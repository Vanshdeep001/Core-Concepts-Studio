import { useState } from 'react';
import { PlayIcon } from '../../../components/Icons';

const EMPLOYEES = [
  { id: 1, name: 'Amit', salary: 90000, department_id: 10, role: 'SDE' },
  { id: 2, name: 'Priya', salary: 120000, department_id: 10, role: 'Lead' },
  { id: 3, name: 'Rohan', salary: 85000, department_id: 20, role: 'QA' },
  { id: 4, name: 'Sneha', salary: 95000, department_id: 20, role: 'SDE' },
  { id: 5, name: 'Vikram', salary: 110000, department_id: 30, role: 'Manager' }
];

const DEPARTMENTS = [
  { id: 10, name: 'Engineering' },
  { id: 20, name: 'QA' },
  { id: 30, name: 'Product' }
];

export default function SqlWorkspace({ query, setQuery }) {
  const [activeTab, setActiveTab] = useState('employees'); // employees | departments
  const [resultRows, setResultRows] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [executionMessage, setExecutionMessage] = useState('Workspace loaded. Write a query against Employees / Departments and click "Run Query".');

  const runQuery = () => {
    setErrorMessage('');
    setResultRows(null);
    setExecutionMessage('Executing query...');

    setTimeout(() => {
      try {
        const cleanQuery = query.replace(/\s+/g, ' ').trim();
        const lowerQuery = cleanQuery.toLowerCase();

        if (!lowerQuery.startsWith('select')) {
          throw new Error('OSlizer SQL: Only SELECT queries are supported in this sandbox.');
        }

        // Identify Tables
        const hasEmployees = lowerQuery.includes('employees');
        const hasDepartments = lowerQuery.includes('departments');

        if (!hasEmployees && !hasDepartments) {
          throw new Error("OSlizer SQL: Table not found. Please select FROM 'Employees' or 'Departments'.");
        }

        let dataset = [];
        let defaultColumns = [];

        // Check for JOIN
        const isJoined = lowerQuery.includes('join') || (hasEmployees && hasDepartments);

        if (isJoined) {
          dataset = EMPLOYEES.map(emp => {
            const dept = DEPARTMENTS.find(d => d.id === emp.department_id);
            return {
              emp_id: emp.id,
              employee_name: emp.name,
              salary: emp.salary,
              role: emp.role,
              department_name: dept ? dept.name : 'Unknown'
            };
          });
          defaultColumns = ['emp_id', 'employee_name', 'salary', 'role', 'department_name'];
        } else if (hasEmployees) {
          dataset = EMPLOYEES.map(e => ({ ...e }));
          defaultColumns = ['id', 'name', 'salary', 'department_id', 'role'];
        } else if (hasDepartments) {
          dataset = DEPARTMENTS.map(d => ({ ...d }));
          defaultColumns = ['id', 'name'];
        }

        // Apply WHERE filter
        const whereIndex = lowerQuery.indexOf('where ');
        let filtered = [...dataset];

        if (whereIndex !== -1) {
          // Extract everything after WHERE up to ORDER BY or LIMIT or end
          let whereClause = cleanQuery.substring(whereIndex + 6);
          const orderIndex = whereClause.toLowerCase().indexOf('order by');
          const limitIndex = whereClause.toLowerCase().indexOf('limit');
          
          if (orderIndex !== -1) {
            whereClause = whereClause.substring(0, orderIndex);
          } else if (limitIndex !== -1) {
            whereClause = whereClause.substring(0, limitIndex);
          }
          whereClause = whereClause.trim();

          // Simple comparison parser (e.g. salary > 90000 or role = 'SDE')
          const conditionMatch = whereClause.match(/([\w.]+)\s*([>=<!]+)\s*['"]?([^'"]+)['"]?/);
          if (conditionMatch) {
            let [_, field, operator, value] = conditionMatch;
            // Strip table prefixes e.g. e.salary -> salary
            field = field.split('.').pop();

            filtered = dataset.filter(row => {
              const rowVal = row[field];
              if (rowVal === undefined) {
                throw new Error(`OSlizer SQL: Column '${field}' not found in the target table.`);
              }
              const numVal = Number(value);
              const isNum = !isNaN(numVal);
              const target = isNum ? numVal : value.trim();
              const current = isNum ? Number(rowVal) : String(rowVal).trim();

              switch (operator) {
                case '=': return current == target;
                case '>': return current > target;
                case '<': return current < target;
                case '>=': return current >= target;
                case '<=': return current <= target;
                case '!=':
                case '<>': return current != target;
                default: return true;
              }
            });
          } else {
            throw new Error(`OSlizer SQL: Unsupported WHERE condition format. Use simple filters like 'salary > 90000'.`);
          }
        }

        // Apply ORDER BY
        const orderByIndex = lowerQuery.indexOf('order by ');
        if (orderByIndex !== -1) {
          let orderClause = cleanQuery.substring(orderByIndex + 9);
          const limitIndex = orderClause.toLowerCase().indexOf('limit');
          if (limitIndex !== -1) {
            orderClause = orderClause.substring(0, limitIndex);
          }
          orderClause = orderClause.trim();

          const parts = orderClause.split(' ');
          let sortField = parts[0].split('.').pop();
          const isDesc = parts[1] && parts[1].toLowerCase() === 'desc';

          filtered.sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];
            if (valA === undefined || valB === undefined) return 0;
            if (typeof valA === 'number' && typeof valB === 'number') {
              return isDesc ? valB - valA : valA - valB;
            }
            return isDesc 
              ? String(valB).localeCompare(String(valA)) 
              : String(valA).localeCompare(String(valB));
          });
        }

        // Apply LIMIT
        const limitIndex = lowerQuery.indexOf('limit ');
        if (limitIndex !== -1) {
          const limitClause = cleanQuery.substring(limitIndex + 6).trim();
          const limitNum = parseInt(limitClause);
          if (!isNaN(limitNum)) {
            filtered = filtered.slice(0, limitNum);
          }
        }

        // Apply Projection (Columns select)
        const fromIndex = lowerQuery.indexOf(' from ');
        if (fromIndex === -1) {
          throw new Error("OSlizer SQL: Query must contain a FROM clause.");
        }

        let selectFields = cleanQuery.substring(6, fromIndex).trim();
        let finalRows = [];

        if (selectFields === '*') {
          finalRows = filtered.map(row => {
            const mapped = {};
            defaultColumns.forEach(col => {
              mapped[col] = row[col];
            });
            return mapped;
          });
        } else {
          const requestedCols = selectFields.split(',').map(c => c.trim().split('.').pop());
          finalRows = filtered.map(row => {
            const mapped = {};
            requestedCols.forEach(col => {
              // map aliases if needed
              if (row[col] !== undefined) {
                mapped[col] = row[col];
              } else {
                // fallback search in row keys
                const matchingKey = Object.keys(row).find(k => k.toLowerCase() === col.toLowerCase());
                if (matchingKey) {
                  mapped[col] = row[matchingKey];
                } else {
                  throw new Error(`OSlizer SQL: Column '${col}' not found.`);
                }
              }
            });
            return mapped;
          });
        }

        setResultRows(finalRows);
        setExecutionMessage(`Query executed successfully. Returned ${finalRows.length} row(s).`);
      } catch (err) {
        setErrorMessage(err.message);
        setExecutionMessage('Execution failed.');
      }
    }, 800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem' }}>
      {/* Schema View panel */}
      <div style={{ border: '3px solid var(--border)', background: 'var(--white)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{
          display: 'flex',
          background: 'var(--cyan)',
          borderBottom: '3px solid var(--border)',
          fontFamily: 'var(--font-mono)',
          fontWeight: 800,
          fontSize: '0.75rem',
          color: '#000000',
        }}>
          <button
            onClick={() => setActiveTab('employees')}
            style={{
              padding: '0.45rem 0.8rem',
              background: activeTab === 'employees' ? 'var(--white)' : 'transparent',
              border: 'none',
              borderRight: '2px solid var(--border)',
              fontWeight: 800,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            TABLE: Employees
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            style={{
              padding: '0.45rem 0.8rem',
              background: activeTab === 'departments' ? 'var(--white)' : 'transparent',
              border: 'none',
              borderRight: '2px solid var(--border)',
              fontWeight: 800,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            TABLE: Departments
          </button>
        </div>

        <div style={{ padding: '0.6rem 0.8rem', background: '#fafafa', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', lineHeight: 1.4 }}>
          {activeTab === 'employees' ? (
            <div>
              <strong>Columns:</strong><br />
              - <span style={{ color: 'var(--purple)' }}>id</span> (INT, Primary Key)<br />
              - <span style={{ color: 'var(--purple)' }}>name</span> (VARCHAR)<br />
              - <span style={{ color: 'var(--purple)' }}>salary</span> (INT)<br />
              - <span style={{ color: 'var(--purple)' }}>department_id</span> (INT, Foreign Key ➔ Departments.id)<br />
              - <span style={{ color: 'var(--purple)' }}>role</span> (VARCHAR)
            </div>
          ) : (
            <div>
              <strong>Columns:</strong><br />
              - <span style={{ color: 'var(--purple)' }}>id</span> (INT, Primary Key)<br />
              - <span style={{ color: 'var(--purple)' }}>name</span> (VARCHAR)
            </div>
          )}
        </div>
      </div>

      {/* Editor & Execute */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '0.75rem', minHeight: 0 }}>
        {/* SQL Input Area */}
        <div style={{
          border: '3px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          background: '#1e1e1e',
          display: 'flex',
          flexDirection: 'column',
          height: '140px',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: '#2d2d2d',
            padding: '0.35rem 0.7rem',
            borderBottom: '2px solid var(--border)'
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 800, color: '#9aa0a6' }}>
              QUERY_EDITOR.SQL
            </span>
            <button
              onClick={runQuery}
              disabled={!query.trim()}
              className="btn btn-sm btn-green"
              style={{
                marginLeft: 'auto',
                padding: '0.15rem 0.55rem',
                fontSize: '0.7rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                cursor: 'pointer',
              }}
            >
              {PlayIcon({ size: 10 })}
              <span>Run Query</span>
            </button>
          </div>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SELECT * FROM Employees WHERE salary > 90000 ORDER BY salary DESC;"
            style={{
              flex: 1,
              background: 'transparent',
              color: '#d4d4d4',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.84rem',
              lineHeight: 1.5,
              padding: '0.7rem 0.85rem',
              border: 'none',
              outline: 'none',
              resize: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Query Results / Terminal Output */}
        <div style={{
          flex: 1,
          border: '3px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header status bar */}
          <div style={{
            background: 'var(--bg)',
            padding: '0.35rem 0.6rem',
            borderBottom: '2px solid var(--border)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            fontWeight: 800,
            color: 'var(--text)',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>RESULT PANELS</span>
            <span style={{ opacity: 0.6 }}>{executionMessage}</span>
          </div>

          {/* Results table */}
          <div className="hide-scrollbar" style={{ flex: 1, overflow: 'auto', padding: '0.5rem' }}>
            {errorMessage ? (
              <div style={{
                color: 'var(--pink)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                background: '#fff3f5',
                border: '2px solid var(--border)',
                padding: '0.6rem'
              }}>
                {errorMessage}
              </div>
            ) : resultRows ? (
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)'
              }}>
                <thead>
                  <tr style={{ background: 'var(--cyan)' }}>
                    {Object.keys(resultRows[0] || {}).map((key) => (
                      <th
                        key={key}
                        style={{
                          border: '2px solid var(--border)',
                          padding: '0.45rem',
                          textAlign: 'left',
                          fontWeight: 800,
                          color: '#000000'
                        }}
                      >
                        {key.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resultRows.map((row, idx) => (
                    <tr
                      key={idx}
                      style={{
                        background: idx % 2 === 0 ? 'transparent' : 'var(--bg)',
                        borderBottom: '1px solid #ddd'
                      }}
                    >
                      {Object.values(row).map((val, vIdx) => (
                        <td
                          key={vIdx}
                          style={{
                            border: '2px solid var(--border)',
                            padding: '0.45rem',
                            color: 'var(--text)'
                          }}
                        >
                          {val === null || val === undefined ? 'NULL' : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#aaa',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                fontStyle: 'italic'
              }}>
                No active records. Run a query to retrieve rows.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
