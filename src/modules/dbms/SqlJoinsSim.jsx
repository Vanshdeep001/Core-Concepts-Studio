import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import useSnapshot from '../../hooks/useSnapshot';
import { LinkIcon, ClipboardIcon } from '../../components/Icons';

export default function SqlJoinsSim() {
    const [joinType, setJoinType] = useState('inner'); // inner, left, right, full, cross, self
    const [speed, setSpeed] = useState(700);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [currentStep, setCurrentStep] = useState(0); // For row-by-row rendering
    const [conceptMode, setConceptMode] = useState(false);

    // Editable Table A: Employees
    const [employees, setEmployees] = useState([
        { empId: 'E101', name: 'Alice', deptId: 'D01' },
        { empId: 'E102', name: 'Bob', deptId: 'D02' },
        { empId: 'E103', name: 'Charlie', deptId: 'D01' },
        { empId: 'E104', name: 'Dave', deptId: 'D03' },
        { empId: 'E105', name: 'Eve', deptId: '' }, // NULL DeptID
    ]);

    // Editable Table B: Departments
    const [departments, setDepartments] = useState([
        { deptId: 'D01', name: 'Engineering' },
        { deptId: 'D02', name: 'Marketing' },
        { deptId: 'D03', name: 'Sales' },
        { deptId: 'D04', name: 'Support' }, // Unmatched
    ]);

    // Track SVG coordinate bounding boxes
    const tableARef = useRef(null);
    const tableBRef = useRef(null);
    const [connections, setConnections] = useState([]);

    // SQL Syntax highlighted templates
    const getQueryString = () => {
        if (joinType === 'inner') {
            return `SELECT e.EmpID, e.Name, d.DeptName \nFROM Employees e \nINNER JOIN Departments d \n  ON e.DeptID = d.DeptID;`;
        }
        if (joinType === 'left') {
            return `SELECT e.EmpID, e.Name, d.DeptName \nFROM Employees e \nLEFT JOIN Departments d \n  ON e.DeptID = d.DeptID;`;
        }
        if (joinType === 'right') {
            return `SELECT e.EmpID, e.Name, d.DeptName \nFROM Employees e \nRIGHT JOIN Departments d \n  ON e.DeptID = d.DeptID;`;
        }
        if (joinType === 'full') {
            return `SELECT e.EmpID, e.Name, d.DeptName \nFROM Employees e \nFULL OUTER JOIN Departments d \n  ON e.DeptID = d.DeptID;`;
        }
        if (joinType === 'cross') {
            return `SELECT e.EmpID, e.Name, d.DeptName \nFROM Employees e \nCROSS JOIN Departments d;`;
        }
        // Self join
        return `SELECT e1.Name AS Emp, e2.Name AS Manager \nFROM Employees e1 \nINNER JOIN Employees e2 \n  ON e1.DeptID = e2.DeptID AND e1.EmpID != e2.EmpID;`;
    };

    // Computation of joined results
    const computeJoinedResults = () => {
        const results = [];

        if (joinType === 'inner') {
            employees.forEach(e => {
                const match = departments.find(d => d.deptId === e.deptId && e.deptId !== '');
                if (match) {
                    results.push({ empId: e.empId, name: e.name, deptId: e.deptId, deptName: match.name });
                }
            });
        } else if (joinType === 'left') {
            employees.forEach(e => {
                const match = departments.find(d => d.deptId === e.deptId && e.deptId !== '');
                results.push({
                    empId: e.empId,
                    name: e.name,
                    deptId: e.deptId || 'NULL',
                    deptName: match ? match.name : 'NULL'
                });
            });
        } else if (joinType === 'right') {
            departments.forEach(d => {
                const matches = employees.filter(e => e.deptId === d.deptId && d.deptId !== '');
                if (matches.length > 0) {
                    matches.forEach(e => {
                        results.push({ empId: e.empId, name: e.name, deptId: d.deptId, deptName: d.name });
                    });
                } else {
                    results.push({ empId: 'NULL', name: 'NULL', deptId: d.deptId, deptName: d.name });
                }
            });
        } else if (joinType === 'full') {
            // Left + Right unmatched
            const matchedEmpIds = new Set();
            employees.forEach(e => {
                const match = departments.find(d => d.deptId === e.deptId && e.deptId !== '');
                if (match) {
                    matchedEmpIds.add(e.empId);
                    results.push({ empId: e.empId, name: e.name, deptId: e.deptId, deptName: match.name });
                } else {
                    results.push({ empId: e.empId, name: e.name, deptId: e.deptId || 'NULL', deptName: 'NULL' });
                }
            });
            departments.forEach(d => {
                const hasMatch = employees.some(e => e.deptId === d.deptId && d.deptId !== '');
                if (!hasMatch) {
                    results.push({ empId: 'NULL', name: 'NULL', deptId: d.deptId, deptName: d.name });
                }
            });
        } else if (joinType === 'cross') {
            employees.forEach(e => {
                departments.forEach(d => {
                    results.push({ empId: e.empId, name: e.name, deptId: d.deptId, deptName: d.name });
                });
            });
        } else if (joinType === 'self') {
            // Match employees in same dept
            employees.forEach(e1 => {
                employees.forEach(e2 => {
                    if (e1.deptId === e2.deptId && e1.deptId !== '' && e1.empId !== e2.empId) {
                        results.push({ empId: e1.empId, name: e1.name, deptId: e1.deptId, deptName: `Colleague (${e2.name})` });
                    }
                });
            });
        }

        return results;
    };

    const joinedResults = computeJoinedResults();

    // Reset row timeline
    const handleReset = () => {
        setCurrentStep(0);
        setIsRunning(false);
        setIsPaused(false);
        setIsFinished(false);
    };

    const handleStart = () => {
        setIsRunning(true);
        setIsPaused(false);
        setIsFinished(false);
    };

    const handlePause = () => {
        setIsPaused(true);
    };

    const handleStep = () => {
        if (currentStep < joinedResults.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setIsFinished(true);
        }
    };

    // Auto compilation playback timer
    useEffect(() => {
        let interval = null;
        if (isRunning && !isPaused && !isFinished) {
            interval = setInterval(() => {
                setCurrentStep(prev => {
                    const next = prev + 1;
                    if (next >= joinedResults.length) {
                        setIsRunning(false);
                        setIsFinished(true);
                        return prev;
                    }
                    return next;
                });
            }, speed);
        }
        return () => clearInterval(interval);
    }, [isRunning, isPaused, isFinished, joinedResults.length, speed]);

    // Handle updates inside cells
    const updateEmpCell = (idx, key, val) => {
        setEmployees(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [key]: val };
            return next;
        });
    };

    const updateDeptCell = (idx, key, val) => {
        setDepartments(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [key]: val };
            return next;
        });
    };

    /* ══════════════════════════════════════════
       RENDER HELPERS: Center SQL Joined layout
       ══════════════════════════════════════════ */
    // Dynamic Venn shaded region
    const renderVennDiagram = () => {
        const fillLeft = joinType === 'left' || joinType === 'full';
        const fillRight = joinType === 'right' || joinType === 'full';
        const fillMiddle = joinType === 'inner' || joinType === 'left' || joinType === 'right' || joinType === 'full' || joinType === 'self';
        const fillAll = joinType === 'cross';

        return (
            <svg width="120" height="60" style={{ margin: '0 auto', display: 'block' }}>
                {/* Left circle */}
                <circle cx="45" cy="30" r="22" fill={fillAll || fillLeft ? 'var(--cyan)' : 'transparent'} stroke="var(--border)" strokeWidth="2.5" opacity={fillLeft ? 0.75 : 0.3} />
                {/* Right circle */}
                <circle cx="75" cy="30" r="22" fill={fillAll || fillRight ? 'var(--cyan)' : 'transparent'} stroke="var(--border)" strokeWidth="2.5" opacity={fillRight ? 0.75 : 0.3} />
                {/* Intersection overlay for visual shading */}
                {fillMiddle && !fillAll && (
                    <path
                        d="M 59 13 A 22 22 0 0 1 75 30 A 22 22 0 0 1 59 47 A 22 22 0 0 1 45 30 A 22 22 0 0 1 59 13 Z"
                        fill="var(--cyan)"
                        stroke="var(--border)"
                        strokeWidth="2.5"
                    />
                )}
                {/* Outlines */}
                <circle cx="45" cy="30" r="22" fill="none" stroke="var(--border)" strokeWidth="2.5" />
                <circle cx="75" cy="30" r="22" fill="none" stroke="var(--border)" strokeWidth="2.5" />
                <text x="25" y="34" fontSize="7" fontWeight="bold" fontFamily="var(--font-mono)">Emp</text>
                <text x="82" y="34" fontSize="7" fontWeight="bold" fontFamily="var(--font-mono)">Dept</text>
            </svg>
        );
    };

    
    useSnapshot(useCallback((config, step) => {
        if (config.joinType !== undefined) setJoinType(config.joinType);
        if (config.employees !== undefined) setEmployees(config.employees);
        if (config.departments !== undefined) setDepartments(config.departments);

        setTimeout(() => {
            if (step !== undefined) setCurrentStep(step);
            setIsRunning(false);
            setIsPaused(true);

        }, 50);
    }, []));

    return (
        <ImmersiveLayout
            isActive={true}
            snapshotData={{
                config: { joinType, employees, departments },
                step: currentStep
            }}
            title="SQL Joins Simulator" icon={<LinkIcon size={20} />} moduleLabel="DBMS Module"
            isRunning={isRunning} isPaused={isPaused} isFinished={isFinished}
            speed={speed} onSpeedChange={setSpeed}
            onStart={handleStart} onPause={handlePause} onResume={handleStart}
            onReset={handleReset} onStep={handleStep}
            currentStepNum={currentStep + 1} totalSteps={joinedResults.length}
            phaseName={`Compiling SQL ${joinType.toUpperCase()} result...`}
            centerContent={
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.8rem', background: 'var(--white)', padding: '1rem', overflowY: 'auto' }}>

                    {/* Join selectors */}
                    <div className="join-selectors-bar" style={{ display: 'flex', gap: '4px', border: '3.5px solid var(--border)', background: 'var(--white)', padding: '2px', boxShadow: '3px 3px 0 var(--border)', flexShrink: 0 }}>
                        {['inner', 'left', 'right', 'full', 'cross', 'self'].map(type => (
                            <button
                                key={type}
                                onClick={() => { setJoinType(type); handleReset(); }}
                                style={{
                                    flex: 1, border: 'none', padding: '0.35rem 0.5rem', fontWeight: 900, fontSize: '0.72rem', cursor: 'pointer',
                                    background: joinType === type ? 'var(--cyan)' : 'var(--white)',
                                    textTransform: 'uppercase', fontFamily: 'var(--font-mono)'
                                }}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    {/* SVG Connector Viewports */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', flexShrink: 0, position: 'relative' }}>

                        {/* Table Employees */}
                        <div ref={tableARef} style={{ border: '3px solid var(--border)', background: 'var(--white)', boxShadow: '3px 3px 0 var(--border)' }}>
                            <div style={{ background: 'var(--yellow)', borderBottom: '3px solid var(--border)', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 900, display: 'flex', justifyContent: 'space-between' }}>
                                <span>Table A: Employees</span>
                                <span style={{ fontSize: '0.55rem', opacity: 0.5 }}>Click cells to edit</span>
                            </div>
                            <table className="neo-table" style={{ fontSize: '0.72rem' }}>
                                <thead>
                                    <tr>
                                        <th>EmpID</th>
                                        <th>Name</th>
                                        <th style={{ background: 'var(--cyan)', color: '#000' }}>DeptID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map((row, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{row.empId}</td>
                                            <td>
                                                <input
                                                    value={row.name}
                                                    onChange={e => updateEmpCell(idx, 'name', e.target.value)}
                                                    style={{ width: '100%', border: 'none', background: 'transparent', fontWeight: 700 }}
                                                />
                                            </td>
                                            <td style={{ background: 'rgba(102,217,239,0.1)' }}>
                                                <input
                                                    value={row.deptId}
                                                    onChange={e => updateEmpCell(idx, 'deptId', e.target.value)}
                                                    placeholder="NULL"
                                                    style={{ width: '100%', border: 'none', background: 'transparent', fontWeight: 900, fontFamily: 'var(--font-mono)' }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Table Departments */}
                        <div ref={tableBRef} style={{ border: '3px solid var(--border)', background: 'var(--white)', boxShadow: '3px 3px 0 var(--border)' }}>
                            <div style={{ background: 'var(--pink)', borderBottom: '3px solid var(--border)', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 900, display: 'flex', justifyContent: 'space-between' }}>
                                <span>Table B: Departments</span>
                                <span style={{ fontSize: '0.55rem', opacity: 0.5 }}>Click to edit</span>
                            </div>
                            <table className="neo-table" style={{ fontSize: '0.72rem' }}>
                                <thead>
                                    <tr>
                                        <th style={{ background: 'var(--pink)', color: '#000' }}>DeptID</th>
                                        <th>DeptName</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {departments.map((row, idx) => (
                                        <tr key={idx}>
                                            <td style={{ background: 'rgba(255,107,157,0.1)' }}>
                                                <input
                                                    value={row.deptId}
                                                    onChange={e => updateDeptCell(idx, 'deptId', e.target.value)}
                                                    style={{ width: '100%', border: 'none', background: 'transparent', fontWeight: 900, fontFamily: 'var(--font-mono)' }}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    value={row.name}
                                                    onChange={e => updateDeptCell(idx, 'name', e.target.value)}
                                                    style={{ width: '100%', border: 'none', background: 'transparent', fontWeight: 700 }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Result compilation compiling dynamic row-by-row */}
                    <div style={{ border: '3px solid var(--border)', background: 'var(--white)', boxShadow: '4px 4px 0 var(--border)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ background: 'var(--green)', borderBottom: '3px solid var(--border)', padding: '6px 12px', fontSize: '0.78rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                            <span><ClipboardIcon size={14} /> Result Joined Set: SQL Output</span>
                            <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)' }}>Total Rows: {joinedResults.length}</span>
                        </div>
                        <div style={{ maxH: 150, overflowY: 'auto' }}>
                            <table className="neo-table" style={{ fontSize: '0.72rem' }}>
                                <thead>
                                    <tr>
                                        <th>EmpID</th>
                                        <th>Name</th>
                                        <th>DeptID</th>
                                        <th>DeptName</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {joinedResults.slice(0, currentStep + 1).map((row, idx) => {
                                        const isNull = row.empId === 'NULL' || row.deptName === 'NULL' || row.deptId === 'NULL';
                                        return (
                                            <motion.tr
                                                key={idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                style={{ background: isNull ? '#fef3c7' : 'transparent' }}
                                            >
                                                <td style={{ fontFamily: 'var(--font-mono)' }}>{row.empId}</td>
                                                <td>{row.name}</td>
                                                <td style={{ fontFamily: 'var(--font-mono)' }}>{row.deptId}</td>
                                                <td>
                                                    {row.deptName === 'NULL' ? (
                                                        <span style={{ background: 'var(--orange)', color: '#000', padding: '1px 5px', fontSize: '0.58rem', fontWeight: 900 }}>NULL</span>
                                                    ) : row.deptName}
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            }
            leftContent={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>Venn Join visual</div>

                    {renderVennDiagram()}

                    <div style={{ height: 2, background: 'var(--border)' }} />

                    <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>Live Stats</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{ border: '2px solid var(--border)', padding: '0.35rem 0.5rem', background: 'var(--yellow)', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 800, boxShadow: '2px 2px 0 var(--border)' }}>
                            <span>Matched pairs:</span>
                            <span>{joinedResults.filter(r => r.empId !== 'NULL' && r.deptName !== 'NULL').length}</span>
                        </div>
                        <div style={{ border: '2px solid var(--border)', padding: '0.35rem 0.5rem', background: 'var(--pink)', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 800, boxShadow: '2px 2px 0 var(--border)' }}>
                            <span>NULL padded rows:</span>
                            <span>{joinedResults.filter(r => r.empId === 'NULL' || r.deptName === 'NULL').length}</span>
                        </div>
                        <div style={{ border: '2px solid var(--border)', padding: '0.35rem 0.5rem', background: 'var(--cyan)', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 800, boxShadow: '2px 2px 0 var(--border)' }}>
                            <span>Total row outputs:</span>
                            <span>{joinedResults.length}</span>
                        </div>
                    </div>

                    <div style={{ height: 2, background: 'var(--border)' }} />

                    {/* SQL syntax highlighter card */}
                    <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                        <div className="panel-header" style={{ background: 'var(--cyan)', fontSize: '0.65rem', padding: '4px' }}>
                            SQL Editor Query
                        </div>
                        <div style={{ padding: '0.4rem', background: 'var(--white)' }}>
                            <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', background: '#222', color: '#00ff00', padding: '0.4rem', border: '1.5px solid var(--border)', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                                {getQueryString()}
                            </pre>
                        </div>
                    </div>
                </div>
            }
            rightContent={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ border: '2px solid var(--border)', background: 'var(--yellow)', padding: '0.4rem 0.6rem', boxShadow: '2px 2px 0 var(--border)' }}>
                        <div style={{ fontSize: '0.55rem', fontWeight: 900, opacity: 0.6 }}>CONCEPT TAG</div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                            CONCEPT: {joinType.toUpperCase()} JOIN
                        </div>
                    </div>

                    <div style={{ border: '2px solid var(--border)', background: 'var(--white)', padding: '0.6rem', boxShadow: '2px 2px 0 var(--border)' }}>
                        <p style={{ fontSize: '0.72rem', opacity: 0.8, lineHeight: 1.45 }}>
                            {joinType === 'inner' && 'INNER JOIN retrieves records that have matching values in both tables. Unmatched rows are completely filtered out.'}
                            {joinType === 'left' && 'LEFT JOIN returns all rows from the left table (Employees), and matched rows from the right table (Departments). If no match exists, NULL details are filled.'}
                            {joinType === 'right' && 'RIGHT JOIN returns all rows from the right table (Departments), and matching rows from the left (Employees). Unmatched departments show NULL employees.'}
                            {joinType === 'full' && 'FULL OUTER JOIN merges both Left and Right outer results. It retains all records, filling NULLs on either side when a match is absent.'}
                            {joinType === 'cross' && 'CROSS JOIN creates a Cartesian Product of both tables. Every employee row is joined to every department row.'}
                            {joinType === 'self' && 'SELF JOIN joins a table to itself. Useful to query hierarchical relationships, such as finding colleagues inside the same department.'}
                        </p>
                    </div>

                    <div style={{ height: 2, background: 'var(--border)' }} />

                    {/* Algorithm Logic card */}
                    <div className="panel" style={{ boxShadow: '3px 3px 0 var(--border)' }}>
                        <div className="panel-header" style={{ background: 'var(--pink)', fontSize: '0.72rem', padding: '4px 10px' }}>
                            Join Matching Rules
                        </div>
                        <div style={{ padding: '0.6rem', background: 'var(--white)' }}>
                            <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', background: '#eee', padding: '0.4rem', border: '1.5px solid var(--border)' }}>
                                {`// Join pseudocode comparison
for each emp in Employees:
  for each dept in Departments:
    if emp.DeptID == dept.DeptID:
      yield (emp, dept)
    else if OUTER_JOIN:
      yield (emp, NULL)`}
                            </pre>
                        </div>
                    </div>
                </div>
            }
            timelineItems={joinedResults.slice(0, currentStep + 1).map((r, idx) => ({
                id: idx,
                label: `Emp ${r.name} + Dept ${r.deptName}`,
                done: idx < currentStep,
                active: idx === currentStep
            }))}
            legend={[
                { color: 'var(--yellow)', label: 'Employees' },
                { color: 'var(--pink)', label: 'Departments' },
                { color: 'var(--cyan)', label: 'Matched Connectors' },
                { color: 'var(--green)', label: 'Compiled Result' }
            ]}
            conceptMode={conceptMode}
            onConceptModeToggle={() => setConceptMode(prev => !prev)}
        >
            <div className="main-content">
                <Link to="/dbms">← Return to DBMS Landing</Link>
            </div>
        </ImmersiveLayout>
    );
}
