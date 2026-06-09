import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import { CodeIcon, DatabaseIcon } from '../../components/Icons';

// Initial Mock Database Schema
const INITIAL_USERS = [
    { id: 1, name: 'Alice', age: 25, city: 'London' },
    { id: 2, name: 'Bob', age: 30, city: 'Paris' },
    { id: 3, name: 'Charlie', age: 22, city: 'London' },
    { id: 4, name: 'David', age: 28, city: 'New York' },
    { id: 5, name: 'Eva', age: 35, city: 'Paris' },
];

const INITIAL_ORDERS = [
    { order_id: 101, user_id: 1, product: 'Laptop', amount: 1200 },
    { order_id: 102, user_id: 2, product: 'Phone', amount: 800 },
    { order_id: 103, user_id: 1, product: 'Mouse', amount: 50 },
    { order_id: 104, user_id: 3, product: 'Keyboard', amount: 100 },
    { order_id: 105, user_id: 5, product: 'Monitor', amount: 300 },
];

const TEMPLATES = [
    {
        label: 'Simple Select & Filter',
        query: "SELECT * FROM Users WHERE age >= 25;",
        desc: "Performs a sequential scan on 'Users' table and applies a filter predicate on 'age'."
    },
    {
        label: 'Projection & Filter',
        query: "SELECT name, city FROM Users WHERE city = 'London';",
        desc: "Filters records matching the city, then projects only the specified columns."
    },
    {
        label: 'Inner Join Connector',
        query: "SELECT Users.name, Orders.product, Orders.amount FROM Users JOIN Orders ON Users.id = Orders.user_id;",
        desc: "Executes a nested loop join matching primary key 'id' to foreign key 'user_id'."
    },
    {
        label: 'Aggregation & Grouping',
        query: "SELECT city, COUNT(*) as count, AVG(age) as avg_age FROM Users GROUP BY city;",
        desc: "Buckets rows into distinct city keys and computes aggregates (COUNT, AVG) per group."
    },
    {
        label: 'Insert Row Mutation',
        query: "INSERT INTO Users VALUES (6, 'Frank', 29, 'New York');",
        desc: "Inserts a new record into the database table, rendering real-time mutations."
    },
    {
        label: 'Update Row Mutation',
        query: "UPDATE Users SET age = 26 WHERE id = 1;",
        desc: "Finds the row matching the predicate and updates its attributes in-place."
    },
    {
        label: 'Delete Row Mutation',
        query: "DELETE FROM Users WHERE age > 30;",
        desc: "Deletes rows matching the criteria, visually dissolving records from the grid."
    }
];

// ─── SQL Syntax Tokenizer ───
// Splits a SQL line into tokens with type info for coloring
const SQL_KEYWORDS = new Set(['SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'ON', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'GROUP', 'BY', 'AS', 'AND', 'OR', 'NOT', 'IN', 'COUNT', 'AVG', 'SUM', 'MIN', 'MAX', 'ORDER', 'HAVING', 'LIMIT', 'DISTINCT']);
const SQL_OPERATORS = new Set(['=', '>=', '<=', '>', '<', '!=', '<>', '*']);

function tokenizeSqlLine(line) {
    const tokens = [];
    // Match words, quoted strings, operators, parens, commas, semicolons, dots, numbers
    const regex = /('[^']*'|"[^"]*"|\b\w+\b|>=|<=|<>|!=|[=><*(),;.])/g;
    let m;
    while ((m = regex.exec(line)) !== null) {
        const raw = m[0];
        const upper = raw.toUpperCase();
        let type = 'ident';
        if (SQL_KEYWORDS.has(upper)) type = 'keyword';
        else if (SQL_OPERATORS.has(raw)) type = 'operator';
        else if (/^['"]/.test(raw)) type = 'string';
        else if (/^\d+$/.test(raw)) type = 'number';
        else if (/^[(),;.]$/.test(raw)) type = 'punct';
        tokens.push({ text: raw, type });
    }
    return tokens;
}

const TOKEN_COLORS = {
    keyword: '#ff79c6',   // pink
    ident: '#8be9fd',     // cyan
    string: '#f1fa8c',    // yellow
    number: '#bd93f9',    // purple
    operator: '#ff5555',  // red
    punct: '#6272a4',     // grey
};

function RenderSqlTokens({ line }) {
    const tokens = tokenizeSqlLine(line);
    return (
        <span>
            {tokens.map((tok, i) => (
                <span key={i} style={{ color: TOKEN_COLORS[tok.type] || '#f8f8f2', marginRight: tok.type === 'punct' ? 0 : 2 }}>
                    {tok.text}
                </span>
            ))}
        </span>
    );
}

// ─── Parse query into logical clause lines ───
function splitQueryIntoClauses(query) {
    const q = query.replace(/;$/, '').trim();
    const upper = q.toUpperCase();

    if (upper.startsWith('SELECT')) {
        const lines = [];
        // Break at keywords: SELECT, FROM, JOIN, ON, WHERE, GROUP BY
        const clauseRegex = /\b(SELECT|FROM|JOIN|INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|ON|WHERE|GROUP\s+BY|ORDER\s+BY|HAVING)\b/gi;
        let lastIdx = 0;
        const splits = [];
        let match;
        while ((match = clauseRegex.exec(q)) !== null) {
            if (match.index > lastIdx) {
                // Attach trailing text to previous split
                if (splits.length > 0) {
                    splits[splits.length - 1].text += q.substring(lastIdx, match.index);
                }
            }
            splits.push({ keyword: match[0].toUpperCase().replace(/\s+/g, ' '), text: '', startIdx: match.index });
            lastIdx = match.index + match[0].length;
        }
        if (splits.length > 0) {
            splits[splits.length - 1].text += q.substring(lastIdx);
        }

        splits.forEach(s => {
            const fullLine = (s.keyword === splits[0].keyword ? '' : '  ') + q.substring(s.startIdx, s.startIdx + s.keyword.length) + s.text;
            let clauseType = 'select';
            const kw = s.keyword;
            if (kw === 'SELECT') clauseType = 'select';
            else if (kw === 'FROM') clauseType = 'from';
            else if (kw.includes('JOIN')) clauseType = 'join';
            else if (kw === 'ON') clauseType = 'on';
            else if (kw === 'WHERE') clauseType = 'where';
            else if (kw.includes('GROUP')) clauseType = 'groupby';
            else if (kw.includes('ORDER')) clauseType = 'orderby';
            else if (kw === 'HAVING') clauseType = 'having';
            lines.push({ text: fullLine.trimEnd(), clauseType });
        });

        return lines.length > 0 ? lines : [{ text: q, clauseType: 'select' }];
    }
    else if (upper.startsWith('INSERT')) {
        const parts = [];
        const intoMatch = q.match(/^(INSERT\s+INTO\s+\w+)/i);
        if (intoMatch) {
            parts.push({ text: intoMatch[1], clauseType: 'insert' });
            const rest = q.substring(intoMatch[0].length).trim();
            if (rest) parts.push({ text: '  ' + rest, clauseType: 'values' });
        } else {
            parts.push({ text: q, clauseType: 'insert' });
        }
        return parts;
    }
    else if (upper.startsWith('UPDATE')) {
        const parts = [];
        const updateMatch = q.match(/^(UPDATE\s+\w+)/i);
        if (updateMatch) {
            parts.push({ text: updateMatch[1], clauseType: 'update' });
            const rest = q.substring(updateMatch[0].length).trim();
            const setIdx = rest.toUpperCase().indexOf('SET');
            const whereIdx = rest.toUpperCase().indexOf('WHERE');
            if (setIdx !== -1 && whereIdx !== -1) {
                parts.push({ text: '  ' + rest.substring(setIdx, whereIdx).trim(), clauseType: 'set' });
                parts.push({ text: '  ' + rest.substring(whereIdx).trim(), clauseType: 'where' });
            } else if (setIdx !== -1) {
                parts.push({ text: '  ' + rest.substring(setIdx).trim(), clauseType: 'set' });
            } else {
                parts.push({ text: '  ' + rest, clauseType: 'set' });
            }
        } else {
            parts.push({ text: q, clauseType: 'update' });
        }
        return parts;
    }
    else if (upper.startsWith('DELETE')) {
        const parts = [];
        const delMatch = q.match(/^(DELETE\s+FROM\s+\w+)/i);
        if (delMatch) {
            parts.push({ text: delMatch[1], clauseType: 'delete' });
            const rest = q.substring(delMatch[0].length).trim();
            if (rest) parts.push({ text: '  ' + rest, clauseType: 'where' });
        } else {
            parts.push({ text: q, clauseType: 'delete' });
        }
        return parts;
    }
    return [{ text: q, clauseType: 'unknown' }];
}

// Map step types to their active clause
function getActiveLineIndex(stepObj, clauses) {
    if (!stepObj || stepObj.type === 'idle') return -1;
    const t = stepObj.type;
    // Find index by clauseType
    const findClause = (type) => clauses.findIndex(c => c.clauseType === type);

    if (t === 'init') {
        // Highlight FROM or the table clause
        const fromIdx = findClause('from');
        if (fromIdx !== -1) return fromIdx;
        const insertIdx = findClause('insert');
        if (insertIdx !== -1) return insertIdx;
        const updateIdx = findClause('update');
        if (updateIdx !== -1) return updateIdx;
        const deleteIdx = findClause('delete');
        if (deleteIdx !== -1) return deleteIdx;
        return 0;
    }
    if (t === 'eval_filter' || t === 'update_row' || t === 'delete_row') {
        const whereIdx = findClause('where');
        return whereIdx !== -1 ? whereIdx : 0;
    }
    if (t === 'emit_row' || t === 'emit_join') {
        return findClause('select') !== -1 ? findClause('select') : 0;
    }
    if (t === 'left_scan') {
        return findClause('from') !== -1 ? findClause('from') : 0;
    }
    if (t === 'join_check') {
        const onIdx = findClause('on');
        if (onIdx !== -1) return onIdx;
        const joinIdx = findClause('join');
        return joinIdx !== -1 ? joinIdx : 0;
    }
    if (t === 'bucket') {
        return findClause('groupby') !== -1 ? findClause('groupby') : 0;
    }
    if (t === 'aggregate') {
        return findClause('select') !== -1 ? findClause('select') : 0;
    }
    if (t === 'insert_row') {
        const valIdx = findClause('values');
        return valIdx !== -1 ? valIdx : 0;
    }
    return 0;
}

// ─── Status badge color helper ───
function getStatusStyle(status) {
    if (status === 'PASS' || status === 'EMITTING') return { bg: '#50fa7b', color: '#1a1a2e' };
    if (status === 'FAIL') return { bg: '#ff5555', color: '#fff' };
    if (status === 'SCANNING' || status === 'BUCKET') return { bg: '#f1fa8c', color: '#1a1a2e' };
    return { bg: '#6272a4', color: '#fff' };
}


export default function SqlQueryVisualizerSim() {
    const [query, setQuery] = useState(TEMPLATES[0].query);
    const [speed, setSpeed] = useState(1000);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [conceptMode, setConceptMode] = useState(false);

    // Database Tables State (can mutate)
    const [tables, setTables] = useState({
        users: INITIAL_USERS,
        orders: INITIAL_ORDERS
    });

    // Compiler output & Steps
    const [error, setError] = useState(null);
    const [steps, setSteps] = useState([]);
    const [resultColumns, setResultColumns] = useState([]);
    const [queryPlan, setQueryPlan] = useState(null);

    // Parsed query clauses for visual display
    const clauses = useMemo(() => splitQueryIntoClauses(query), [query]);

    // Helper to evaluate simple filter conditions
    const evalCondition = (row, field, op, val) => {
        let rowVal = row[field.toLowerCase()] ?? row[field];
        if (rowVal === undefined) return false;

        // Clean values
        let checkVal = val.replace(/['\";]/g, '').trim();
        let currentVal = String(rowVal).trim();

        // Numeric comparison
        if (!isNaN(checkVal) && !isNaN(currentVal)) {
            const numA = Number(currentVal);
            const numB = Number(checkVal);
            if (op === '=') return numA === numB;
            if (op === '>') return numA > numB;
            if (op === '<') return numA < numB;
            if (op === '>=') return numA >= numB;
            if (op === '<=') return numA <= numB;
            if (op === '!=' || op === '<>') return numA !== numB;
        }

        // String comparison
        const strA = currentVal.toLowerCase();
        const strB = checkVal.toLowerCase();
        if (op === '=') return strA === strB;
        if (op === '!=') return strA !== strB;
        return false;
    };

    // Compile Query & Generate Animation Steps
    const compileQuery = (inputQuery) => {
        setError(null);
        setSteps([]);
        setCurrentStep(0);
        setIsRunning(false);
        setIsPaused(false);
        setIsFinished(false);

        // Standardize whitespace
        const q = inputQuery.replace(/\s+/g, ' ').replace(/;$/, '').trim();

        if (q.toUpperCase().startsWith('SELECT')) {
            const selectRegex = /^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+JOIN\s+(\w+)\s+ON\s+([\w.]+)\s*=\s*([\w.]+))?(?:\s+WHERE\s+(.+?))?(?:\s+GROUP\s+BY\s+(.+?))?$/i;
            const match = q.match(selectRegex);

            if (!match) {
                setError("SQL Compiler Error: Invalid SELECT query format. Note: Joins must map ON T1.col = T2.col.");
                return;
            }

            const selectColsStr = match[1].trim();
            const primaryTable = match[2].trim().toLowerCase();
            const joinTable = match[3] ? match[3].trim().toLowerCase() : null;
            const joinKeyL = match[4] ? match[4].trim() : null;
            const joinKeyR = match[5] ? match[5].trim() : null;
            const whereClause = match[6] ? match[6].trim() : null;
            const groupByCol = match[7] ? match[7].trim() : null;

            // Validate tables
            if (!tables[primaryTable]) {
                setError(`SQL Compiler Error: Table '${primaryTable}' does not exist.`);
                return;
            }
            if (joinTable && !tables[joinTable]) {
                setError(`SQL Compiler Error: Table '${joinTable}' does not exist.`);
                return;
            }

            // Set query execution plan metadata
            setQueryPlan({
                type: 'SELECT',
                tables: joinTable ? [primaryTable, joinTable] : [primaryTable],
                cost: joinTable ? 'O(N * M) - Nested Loop Join' : 'O(N) - Table Scan',
                index: 'None (Sequential Scan)',
                stages: ['Parse SQL', 'Scan & Evaluate', 'Join Match', 'Grouping / Projection']
            });

            // Columns to select
            let selectCols = selectColsStr.split(',').map(c => c.trim());
            const animSteps = [];
            let currentResults = [];

            // Case A: Inner Join query
            if (joinTable) {
                const leftTable = tables[primaryTable];
                const rightTable = tables[joinTable];

                // If SELECT *, project all columns from both tables
                let finalResultCols = [];
                if (selectColsStr === '*') {
                    const leftCols = Object.keys(leftTable[0] || {});
                    const rightCols = Object.keys(rightTable[0] || {});
                    finalResultCols = [...leftCols, ...rightCols];
                } else {
                    finalResultCols = selectCols.map(c => c.replace(/^\w+\./, ''));
                }
                setResultColumns(finalResultCols);

                animSteps.push({
                    desc: `Initializing Nested Loop Join: Scanning ${primaryTable} & joining with ${joinTable}...`,
                    type: 'init',
                    activeTable: 'both',
                    activeRowData: null,
                    opDetails: { label: 'Nested Loop Join', status: 'INIT' },
                    currentResults: [],
                    isUsersPrimary: primaryTable === 'users'
                });

                const cleanL = joinKeyL.includes('.') ? joinKeyL.split('.')[1] : joinKeyL;
                const cleanR = joinKeyR.includes('.') ? joinKeyR.split('.')[1] : joinKeyR;

                // Nested Loop evaluation
                leftTable.forEach((leftRow, lIdx) => {
                    const leftId = leftRow.id || leftRow.order_id || Object.values(leftRow)[0];
                    animSteps.push({
                        desc: `Scanning primary table ${primaryTable}: evaluating row ${lIdx + 1}...`,
                        type: 'left_scan',
                        activeTable: 'both',
                        highlightedUsers: primaryTable === 'users' ? [leftId] : [],
                        highlightedOrders: primaryTable === 'orders' ? [leftId] : [],
                        activeTableHighlights: {
                            [primaryTable]: [leftId]
                        },
                        activeRowData: leftRow,
                        opDetails: { label: `Scan Left Row`, status: 'SCANNING' },
                        currentResults: [...currentResults],
                        isUsersPrimary: primaryTable === 'users'
                    });

                    rightTable.forEach((rightRow, rIdx) => {
                        const rightId = rightRow.id || rightRow.order_id || Object.values(rightRow)[0];
                        const leftJoinKeyVal = leftRow[cleanL] ?? leftRow[cleanL.toLowerCase()];
                        const rightJoinKeyVal = rightRow[cleanR] ?? rightRow[cleanR.toLowerCase()];
                        const isMatch = String(leftJoinKeyVal).trim().toLowerCase() === String(rightJoinKeyVal).trim().toLowerCase();

                        const activeCompareData = {
                            left_key: leftJoinKeyVal,
                            right_key: rightJoinKeyVal,
                            comparison: `${leftJoinKeyVal} == ${rightJoinKeyVal}`
                        };

                        animSteps.push({
                            desc: `Comparing keys: Left (${leftJoinKeyVal}) == Right (${rightJoinKeyVal})? ${isMatch ? 'MATCH' : 'NO MATCH'}`,
                            type: 'join_check',
                            activeTable: 'both',
                            highlightedUsers: [],
                            highlightedOrders: [],
                            activeTableHighlights: {
                                [primaryTable]: [leftId],
                                [joinTable]: [rightId]
                            },
                            isMatch,
                            activeRowData: activeCompareData,
                            opDetails: {
                                label: `Join Match: ${leftJoinKeyVal} == ${rightJoinKeyVal}`,
                                status: isMatch ? 'PASS' : 'FAIL'
                            },
                            currentResults: [...currentResults],
                            isUsersPrimary: primaryTable === 'users',
                            joinKeyL: cleanL,
                            joinKeyR: cleanR
                        });

                        if (isMatch) {
                            // Create Joined row
                            const joined = {};
                            if (selectColsStr === '*') {
                                Object.assign(joined, leftRow, rightRow);
                            } else {
                                selectCols.forEach(col => {
                                    const cleanCol = col.replace(/^\w+\./, '');
                                    if (leftRow[cleanCol] !== undefined) joined[cleanCol] = leftRow[cleanCol];
                                    else if (rightRow[cleanCol] !== undefined) joined[cleanCol] = rightRow[cleanCol];
                                });
                            }

                            currentResults.push(joined);
                            animSteps.push({
                                desc: `Match confirmed: Emitting joined row to result table!`,
                                type: 'emit_join',
                                activeTable: 'both',
                                highlightedUsers: [],
                                highlightedOrders: [],
                                activeTableHighlights: {
                                    [primaryTable]: [leftId],
                                    [joinTable]: [rightId]
                                },
                                activeRowData: joined,
                                opDetails: { label: 'Emit Joined Row', status: 'EMITTING' },
                                currentResults: [...currentResults],
                                isUsersPrimary: primaryTable === 'users',
                                joinKeyL: cleanL,
                                joinKeyR: cleanR
                            });
                        }
                    });
                });
            }
            // Case B: Group By Aggregation
            else if (groupByCol) {
                const targetTable = tables[primaryTable];
                const grpCol = groupByCol.toLowerCase();

                // Setup columns based on SELECT clause
                setResultColumns(selectCols.map(c => {
                    if (c.toUpperCase().includes('COUNT')) return 'count';
                    if (c.toUpperCase().includes('AVG')) return 'avg_age';
                    return c;
                }));

                animSteps.push({
                    desc: `Initializing GROUP BY on column '${groupByCol}'...`,
                    type: 'init',
                    activeTable: primaryTable,
                    activeRowData: null,
                    opDetails: { label: 'Group By init', status: 'INIT' },
                    currentResults: []
                });

                const buckets = {};

                targetTable.forEach((row, idx) => {
                    const rowId = row.id || row.order_id || Object.values(row)[0];
                    const keyVal = String(row[grpCol] ?? row[groupByCol] ?? '');
                    if (!buckets[keyVal]) buckets[keyVal] = [];
                    buckets[keyVal].push(row);

                    animSteps.push({
                        desc: `Scanning row ${idx + 1}: Value of ${groupByCol} is '${keyVal}'. Assigning to bucket...`,
                        type: 'bucket',
                        activeTable: primaryTable,
                        highlightedUsers: [],
                        highlightedOrders: [],
                        activeTableHighlights: {
                            [primaryTable]: [rowId]
                        },
                        buckets: JSON.parse(JSON.stringify(buckets)),
                        activeRowData: row,
                        opDetails: {
                            label: `Group key (${groupByCol}) = '${keyVal}'`,
                            status: 'BUCKET'
                        },
                        currentResults: [],
                        filterField: groupByCol
                    });
                });

                // Run aggregations
                const keys = Object.keys(buckets);
                keys.forEach((key, kIdx) => {
                    const groupRows = buckets[key];
                    const count = groupRows.length;

                    let sumVal = 0;
                    let hasAge = groupRows.some(r => r.age !== undefined);
                    if (hasAge) {
                        sumVal = groupRows.reduce((sum, r) => sum + (Number(r.age) || 0), 0);
                    }
                    const avgAge = count > 0 ? (sumVal / count).toFixed(1) : 0;

                    const aggRow = {};
                    selectCols.forEach(c => {
                        const cleanC = c.toUpperCase();
                        if (cleanC.includes('COUNT')) aggRow['count'] = count;
                        else if (cleanC.includes('AVG')) aggRow['avg_age'] = avgAge;
                        else aggRow[c] = key;
                    });

                    currentResults.push(aggRow);

                    const groupRowIds = groupRows.map(r => r.id || r.order_id || Object.values(r)[0]);

                    animSteps.push({
                        desc: `Computing aggregate for group '${key}': count=${count}${hasAge ? `, avg_age=${avgAge}` : ''}...`,
                        type: 'aggregate',
                        activeTable: primaryTable,
                        highlightedUsers: [],
                        highlightedOrders: [],
                        activeTableHighlights: {
                            [primaryTable]: groupRowIds
                        },
                        buckets: JSON.parse(JSON.stringify(buckets)),
                        activeRowData: aggRow,
                        opDetails: {
                            label: `Aggregate group: ${key}`,
                            status: 'PASS'
                        },
                        currentResults: [...currentResults]
                    });
                });
            }
            // Case C: Standard Select / Filter
            else {
                const targetTable = tables[primaryTable];
                const isUsers = primaryTable === 'users';

                if (selectColsStr === '*') {
                    const firstRow = targetTable[0] || {};
                    setResultColumns(Object.keys(firstRow));
                } else {
                    setResultColumns(selectCols);
                }

                animSteps.push({
                    desc: `Initializing Sequential Scan on table '${primaryTable}'...`,
                    type: 'init',
                    activeTable: primaryTable,
                    activeRowData: null,
                    opDetails: { label: 'Seq Scan', status: 'INIT' },
                    currentResults: []
                });

                // Parse WHERE if exists
                let filterField = null, filterOp = null, filterVal = null;
                if (whereClause) {
                    const whereRegex = /(\w+)\s*([>=<!]+)\s*(.+)/;
                    const wMatch = whereClause.match(whereRegex);
                    if (wMatch) {
                        filterField = wMatch[1].trim();
                        filterOp = wMatch[2].trim();
                        filterVal = wMatch[3].trim();
                    } else {
                        setError("SQL Compiler Error: Invalid WHERE clause condition format.");
                        return;
                    }
                }

                targetTable.forEach((row, idx) => {
                    const rowId = row.id || row.order_id || Object.values(row)[0];
                    let isMatch = true;
                    if (whereClause) {
                        isMatch = evalCondition(row, filterField, filterOp, filterVal);
                    }

                    animSteps.push({
                        desc: `Evaluating Row ${idx + 1}: ${whereClause ? `${filterField} (${row[filterField]}) ${filterOp} ${filterVal}?` : 'No predicate.'} -> ${isMatch ? 'PASS' : 'FAIL'}`,
                        type: 'eval_filter',
                        activeTable: primaryTable,
                        highlightedUsers: isUsers ? [rowId] : [],
                        highlightedOrders: isUsers ? [] : [rowId],
                        activeTableHighlights: {
                            [primaryTable]: [rowId]
                        },
                        isMatch,
                        activeRowData: row,
                        opDetails: {
                            label: whereClause ? `${filterField} (${row[filterField]}) ${filterOp} ${filterVal}` : 'Select All',
                            status: isMatch ? 'PASS' : 'FAIL'
                        },
                        currentResults: [...currentResults],
                        filterField,
                        filterOp,
                        filterVal
                    });

                    if (isMatch) {
                        const projected = {};
                        if (selectColsStr === '*') {
                            Object.assign(projected, row);
                        } else {
                            selectCols.forEach(col => {
                                projected[col] = row[col] ?? row[col.toLowerCase()];
                            });
                        }
                        currentResults.push(projected);

                        animSteps.push({
                            desc: `Projecting row into results.`,
                            type: 'emit_row',
                            activeTable: primaryTable,
                            highlightedUsers: isUsers ? [rowId] : [],
                            highlightedOrders: isUsers ? [] : [rowId],
                            activeTableHighlights: {
                                [primaryTable]: [rowId]
                            },
                            activeRowData: projected,
                            opDetails: { label: 'Emit Output', status: 'EMITTING' },
                            currentResults: [...currentResults],
                            filterField,
                            filterOp,
                            filterVal
                        });
                    }
                });
            }

            setSteps(animSteps);
            setTotalSteps(animSteps.length);
            setIsRunning(true);
        }

        // ─── INSERT MUTATION ───
        else if (q.toUpperCase().startsWith('INSERT')) {
            const insertRegex = /^INSERT\s+INTO\s+(\w+)\s*(?:\((.+?)\))?\s*VALUES\s*\((.+?)\)$/i;
            const match = q.match(insertRegex);

            if (!match) {
                setError("SQL Compiler Error: Invalid INSERT statement format. Use: INSERT INTO Users VALUES (id, 'Name', age, 'City');");
                return;
            }

            const table = match[1].trim().toLowerCase();
            const colsStr = match[2] ? match[2].trim() : null;
            const valsStr = match[3].trim();

            if (!tables[table]) {
                setError(`SQL Engine: Table '${table}' does not exist.`);
                return;
            }

            const values = valsStr.split(',').map(v => v.replace(/['"]/g, '').trim());
            const targetTableData = tables[table];
            const firstRow = targetTableData[0] || {};
            const columns = Object.keys(firstRow);

            if (values.length !== columns.length) {
                setError(`SQL Engine Error: Insert expects exactly ${columns.length} values (${columns.join(', ')}).`);
                return;
            }

            const newId = parseInt(values[0]);
            const pkField = columns[0];

            if (targetTableData.some(u => parseInt(u[pkField]) === newId)) {
                setError(`SQL Engine Error: Primary key constraint violation. Value ${newId} already exists in ${pkField}.`);
                return;
            }

            setQueryPlan({
                type: 'INSERT',
                tables: [table],
                cost: 'O(1) - Row Append',
                index: 'None',
                stages: ['Parse SQL', 'Primary Key Check', 'Append Row']
            });

            setResultColumns(['Status']);

            const newRow = {};
            columns.forEach((col, cidx) => {
                const isNum = typeof firstRow[col] === 'number';
                newRow[col] = isNum ? Number(values[cidx]) : values[cidx];
            });

            const animSteps = [
                {
                    desc: "Checking primary key constraint... Success.",
                    type: 'init',
                    activeTable: table,
                    activeRowData: newRow,
                    opDetails: { label: 'Constraint Check', status: 'PASS' },
                    currentResults: [],
                    highlightedUsers: table === 'users' ? [newId] : [],
                    highlightedOrders: table === 'orders' ? [newId] : [],
                    activeTableHighlights: {
                        [table]: [newId]
                    }
                },
                {
                    desc: `Inserting values: (${values.join(', ')}) into ${table} table...`,
                    type: 'insert_row',
                    activeTable: table,
                    newRow,
                    activeRowData: newRow,
                    opDetails: { label: 'Insert Record', status: 'PASS' },
                    currentResults: [{ Status: '1 row inserted successfully.' }],
                    highlightedUsers: table === 'users' ? [newId] : [],
                    highlightedOrders: table === 'orders' ? [newId] : [],
                    activeTableHighlights: {
                        [table]: [newId]
                    }
                }
            ];

            setSteps(animSteps);
            setTotalSteps(animSteps.length);
            setIsRunning(true);
        }

        // ─── UPDATE MUTATION ───
        else if (q.toUpperCase().startsWith('UPDATE')) {
            const updateRegex = /^UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+?))?$/i;
            const match = q.match(updateRegex);

            if (!match) {
                setError("SQL Compiler Error: Invalid UPDATE query format. Use: UPDATE Users SET age = value WHERE id = value;");
                return;
            }

            const table = match[1].trim().toLowerCase();
            const setClause = match[2].trim();
            const whereClause = match[3] ? match[3].trim() : null;

            if (!tables[table]) {
                setError(`SQL Engine: Table '${table}' does not exist.`);
                return;
            }

            // Parse SET clause e.g. age = 26
            const setParts = setClause.split('=');
            if (setParts.length !== 2) {
                setError("SQL Compiler Error: Invalid SET assignment.");
                return;
            }
            const updateField = setParts[0].trim();
            const updateVal = setParts[1].trim().replace(/['"]/g, '');

            // Parse WHERE clause e.g. id = 1
            let filterField = null, filterOp = null, filterVal = null;
            if (whereClause) {
                const whereRegex = /(\w+)\s*([>=<!]+)\s*(.+)/;
                const wMatch = whereClause.match(whereRegex);
                if (wMatch) {
                    filterField = wMatch[1].trim();
                    filterOp = wMatch[2].trim();
                    filterVal = wMatch[3].trim();
                } else {
                    setError("SQL Compiler Error: Invalid WHERE clause condition.");
                    return;
                }
            }

            setQueryPlan({
                type: 'UPDATE',
                tables: [table],
                cost: 'O(N) - Table Scan',
                index: 'None',
                stages: ['Parse SQL', 'Locate Row', 'In-Place Mutation']
            });

            setResultColumns(['Status']);

            const animSteps = [
                {
                    desc: `Scanning ${table} table to match predicate...`,
                    type: 'init',
                    activeTable: table,
                    activeRowData: null,
                    opDetails: { label: 'Init Update Scan', status: 'INIT' },
                    currentResults: []
                }
            ];

            let updateCount = 0;
            const mutatedList = JSON.parse(JSON.stringify(tables[table]));

            mutatedList.forEach((row, idx) => {
                const rowId = row.id || row.order_id || Object.values(row)[0];
                let isMatch = true;
                if (whereClause) {
                    isMatch = evalCondition(row, filterField, filterOp, filterVal);
                }

                if (isMatch) {
                    const oldRow = { ...row };
                    row[updateField] = isNaN(updateVal) ? updateVal : Number(updateVal);
                    updateCount++;

                    animSteps.push({
                        desc: `Matching Row found. Mutating cell: updating ${updateField} from '${oldRow[updateField]}' to '${row[updateField]}'...`,
                        type: 'update_row',
                        activeTable: table,
                        highlightedUsers: table === 'users' ? [rowId] : [],
                        highlightedOrders: table === 'orders' ? [rowId] : [],
                        activeTableHighlights: {
                            [table]: [rowId]
                        },
                        isMatch: true,
                        mutatedUsers: JSON.parse(JSON.stringify(mutatedList)),
                        activeRowData: row,
                        opDetails: {
                            label: `Update ${updateField} = ${updateVal}`,
                            status: 'PASS'
                        },
                        currentResults: [{ Status: `Updated ${updateCount} row(s) successfully.` }],
                        filterField,
                        updateField
                    });
                } else {
                    animSteps.push({
                        desc: `Evaluating Row: Predicate failed. Skipping row.`,
                        type: 'update_row',
                        activeTable: table,
                        highlightedUsers: table === 'users' ? [rowId] : [],
                        highlightedOrders: table === 'orders' ? [rowId] : [],
                        activeTableHighlights: {
                            [table]: [rowId]
                        },
                        isMatch: false,
                        activeRowData: row,
                        opDetails: {
                            label: `Match WHERE condition`,
                            status: 'FAIL'
                        },
                        currentResults: [],
                        filterField
                    });
                }
            });

            setSteps(animSteps);
            setTotalSteps(animSteps.length);
            setIsRunning(true);
        }

        // ─── DELETE MUTATION ───
        else if (q.toUpperCase().startsWith('DELETE')) {
            const deleteRegex = /^DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?$/i;
            const match = q.match(deleteRegex);

            if (!match) {
                setError("SQL Compiler Error: Invalid DELETE statement. Use: DELETE FROM Users WHERE condition;");
                return;
            }

            const table = match[1].trim().toLowerCase();
            const whereClause = match[2] ? match[2].trim() : null;

            if (!tables[table]) {
                setError(`SQL Engine: Table '${table}' does not exist.`);
                return;
            }

            let filterField = null, filterOp = null, filterVal = null;
            if (whereClause) {
                const whereRegex = /(\w+)\s*([>=<!]+)\s*(.+)/;
                const wMatch = whereClause.match(whereRegex);
                if (wMatch) {
                    filterField = wMatch[1].trim();
                    filterOp = wMatch[2].trim();
                    filterVal = wMatch[3].trim();
                } else {
                    setError("SQL Compiler Error: Invalid WHERE clause condition.");
                    return;
                }
            }

            setQueryPlan({
                type: 'DELETE',
                tables: [table],
                cost: 'O(N) - Table Scan',
                index: 'None',
                stages: ['Parse SQL', 'Locate Match', 'Deallocate Row']
            });

            setResultColumns(['Status']);

            const animSteps = [
                {
                    desc: `Scanning ${table} table for target rows...`,
                    type: 'init',
                    activeTable: table,
                    activeRowData: null,
                    opDetails: { label: 'Init Delete Scan', status: 'INIT' },
                    currentResults: []
                }
            ];

            let mutatedList = JSON.parse(JSON.stringify(tables[table]));
            let deleteCount = 0;
            const targetTableData = tables[table];

            targetTableData.forEach((row, idx) => {
                const rowId = row.id || row.order_id || Object.values(row)[0];
                let isMatch = true;
                if (whereClause) {
                    isMatch = evalCondition(row, filterField, filterOp, filterVal);
                }

                if (isMatch) {
                    deleteCount++;
                    // Remove from list
                    const pkField = Object.keys(row)[0];
                    mutatedList = mutatedList.filter(u => u[pkField] !== row[pkField]);

                    animSteps.push({
                        desc: `Matching Row found. Discarding from grid...`,
                        type: 'delete_row',
                        activeTable: table,
                        highlightedUsers: table === 'users' ? [rowId] : [],
                        highlightedOrders: table === 'orders' ? [rowId] : [],
                        activeTableHighlights: {
                            [table]: [rowId]
                        },
                        isMatch: true,
                        mutatedUsers: JSON.parse(JSON.stringify(mutatedList)),
                        activeRowData: row,
                        opDetails: {
                            label: 'Match condition. Delete!',
                            status: 'PASS'
                        },
                        currentResults: [{ Status: `Deleted ${deleteCount} row(s) successfully.` }],
                        filterField
                    });
                } else {
                    animSteps.push({
                        desc: `Evaluating Row: Predicate failed. Keeping row.`,
                        type: 'delete_row',
                        activeTable: table,
                        highlightedUsers: table === 'users' ? [rowId] : [],
                        highlightedOrders: table === 'orders' ? [rowId] : [],
                        activeTableHighlights: {
                            [table]: [rowId]
                        },
                        isMatch: false,
                        activeRowData: row,
                        opDetails: {
                            label: 'Match WHERE condition',
                            status: 'FAIL'
                        },
                        currentResults: [],
                        filterField
                    });
                }
            });

            setSteps(animSteps);
            setTotalSteps(animSteps.length);
            setIsRunning(true);
        }

        else {
            setError("SQL Compiler Error: Unsupported SQL statement. This engine supports SELECT, INSERT, UPDATE, and DELETE.");
        }
    };

    // Auto-stepping handler
    const [totalSteps, setTotalSteps] = useState(0);

    useEffect(() => {
        let timer = null;
        if (isRunning && !isPaused && !isFinished && steps.length > 0) {
            timer = setInterval(() => {
                if (currentStep < steps.length - 1) {
                    const nextStep = currentStep + 1;
                    setCurrentStep(nextStep);

                    // Commit mutations to tables when they execute in steps
                    const stepObj = steps[nextStep];
                    if (stepObj.type === 'insert_row' && stepObj.newRow) {
                        setTables(prev => ({
                            ...prev,
                            [stepObj.activeTable]: [...prev[stepObj.activeTable], stepObj.newRow]
                        }));
                    }
                    if (stepObj.type === 'update_row' && stepObj.mutatedUsers && stepObj.isMatch) {
                        setTables(prev => ({
                            ...prev,
                            [stepObj.activeTable]: stepObj.mutatedUsers
                        }));
                    }
                    if (stepObj.type === 'delete_row' && stepObj.mutatedUsers && stepObj.isMatch) {
                        setTables(prev => ({
                            ...prev,
                            [stepObj.activeTable]: stepObj.mutatedUsers
                        }));
                    }
                } else {
                    setIsFinished(true);
                    setIsRunning(false);
                }
            }, speed);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isRunning, isPaused, isFinished, currentStep, steps, speed]);

    const handleStart = () => {
        compileQuery(query);
    };

    const handlePause = () => {
        setIsPaused(true);
    };

    const handleReset = () => {
        setTables({
            users: INITIAL_USERS,
            orders: INITIAL_ORDERS
        });
        setSteps([]);
        setCurrentStep(0);
        setIsRunning(false);
        setIsPaused(false);
        setIsFinished(false);
        setError(null);
    };

    const handleStep = () => {
        if (steps.length === 0) {
            compileQuery(query);
            return;
        }
        if (currentStep < steps.length - 1) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);

            // Apply mutations
            const stepObj = steps[nextStep];
            if (stepObj.type === 'insert_row' && stepObj.newRow) {
                setTables(prev => ({
                    ...prev,
                    [stepObj.activeTable]: [...prev[stepObj.activeTable], stepObj.newRow]
                }));
            }
            if (stepObj.type === 'update_row' && stepObj.mutatedUsers && stepObj.isMatch) {
                setTables(prev => ({
                    ...prev,
                    [stepObj.activeTable]: stepObj.mutatedUsers
                }));
            }
            if (stepObj.type === 'delete_row' && stepObj.mutatedUsers && stepObj.isMatch) {
                setTables(prev => ({
                    ...prev,
                    [stepObj.activeTable]: stepObj.mutatedUsers
                }));
            }
        } else {
            setIsFinished(true);
            setIsRunning(false);
        }
    };

    // ─── Dynamic Table Schema & Editing Handlers ───
    const handleEditCell = (tableName, rowIndex, field, value) => {
        setTables(prev => {
            const tableData = [...prev[tableName]];
            const row = { ...tableData[rowIndex] };

            // Cast numeric fields if applicable
            row[field] = (field.toLowerCase().includes('id') || field.toLowerCase() === 'age' || field.toLowerCase() === 'amount')
                ? (isNaN(Number(value)) ? value : Number(value))
                : value;

            tableData[rowIndex] = row;
            return { ...prev, [tableName]: tableData };
        });
    };

    const handleAddRow = (tableName) => {
        setTables(prev => {
            const tableData = [...prev[tableName]];
            const firstRow = tableData[0] || {};
            const newRow = {};

            Object.keys(firstRow).forEach(col => {
                if (col.toLowerCase().includes('id')) {
                    const maxVal = tableData.length > 0
                        ? Math.max(...tableData.map(r => Number(r[col]) || 0))
                        : 0;
                    newRow[col] = maxVal + 1;
                } else if (typeof firstRow[col] === 'number') {
                    newRow[col] = 0;
                } else {
                    newRow[col] = '';
                }
            });

            if (Object.keys(firstRow).length === 0) {
                newRow['id'] = 1;
            }

            return { ...prev, [tableName]: [...tableData, newRow] };
        });
    };

    const handleRemoveRow = (tableName, rowIndex) => {
        setTables(prev => ({
            ...prev,
            [tableName]: prev[tableName].filter((_, i) => i !== rowIndex)
        }));
    };

    const handleAddColumn = (tableName, colName) => {
        if (!colName) return;
        const cleanCol = colName.trim().toLowerCase().replace(/\s+/g, '_');
        setTables(prev => {
            const tableData = prev[tableName].map(row => ({
                ...row,
                [cleanCol]: ''
            }));
            return { ...prev, [tableName]: tableData };
        });
    };

    const handleRemoveColumn = (tableName, colName) => {
        setTables(prev => {
            const tableData = prev[tableName].map(row => {
                const newRow = { ...row };
                delete newRow[colName];
                return newRow;
            });
            return { ...prev, [tableName]: tableData };
        });
    };

    const handleAddTable = (tableName) => {
        if (!tableName) return;
        const cleanName = tableName.trim().toLowerCase().replace(/\s+/g, '_');
        if (tables[cleanName]) {
            setError(`Table '${cleanName}' already exists.`);
            return;
        }
        setTables(prev => ({
            ...prev,
            [cleanName]: [
                { id: 1, name: '' }
            ]
        }));
    };

    const handleRemoveTable = (tableName) => {
        setTables(prev => {
            const next = { ...prev };
            delete next[tableName];
            return next;
        });
    };

    // Helper to calculate row background color during simulation
    const getRowHighlightStyle = (tableName, rowId) => {
        if (!isSimActive) return { bg: 'transparent' };

        const highlights = activeStepObj.activeTableHighlights?.[tableName] || [];
        const isHlg = highlights.includes(rowId) ||
            (tableName === 'users' && activeStepObj.highlightedUsers?.includes(rowId)) ||
            (tableName === 'orders' && activeStepObj.highlightedOrders?.includes(rowId));

        if (!isHlg) return { bg: 'transparent' };

        const type = activeStepObj.type;
        const isMatch = activeStepObj.isMatch;

        // Green tints for pass/matches
        if (
            (type === 'eval_filter' && isMatch) ||
            (type === 'join_check' && isMatch) ||
            (type === 'emit_row') ||
            (type === 'emit_join') ||
            (type === 'insert_row') ||
            (type === 'update_row' && isMatch)
        ) {
            return { bg: 'rgba(168,230,207,0.45)' };
        }

        // Red/Pink tints for fail/discards
        if (
            (type === 'eval_filter' && !isMatch) ||
            (type === 'join_check' && !isMatch) ||
            (type === 'update_row' && !isMatch) ||
            (type === 'delete_row' && isMatch)
        ) {
            return { bg: 'rgba(255,107,157,0.25)' };
        }

        // Blue/Purple for bucketing / grouping
        if (type === 'bucket' || type === 'aggregate') {
            return { bg: 'rgba(189,147,249,0.25)' };
        }

        // Yellow/orange for scanning or general highlights
        return { bg: 'rgba(255,217,61,0.25)' };
    };

    // Helper to style specific cell values during active simulation stages
    const getCellHighlightStyle = (tableName, rowId, field) => {
        if (!isSimActive) return {};

        const highlights = activeStepObj.activeTableHighlights?.[tableName] || [];
        const isHlg = highlights.includes(rowId) ||
            (tableName === 'users' && activeStepObj.highlightedUsers?.includes(rowId)) ||
            (tableName === 'orders' && activeStepObj.highlightedOrders?.includes(rowId));

        if (!isHlg) return {};

        const type = activeStepObj.type;

        // 1. Highlight target filtering column
        if (activeStepObj.filterField && activeStepObj.filterField.toLowerCase() === field.toLowerCase()) {
            if (type === 'eval_filter' || type === 'update_row' || type === 'delete_row' || type === 'bucket') {
                return {
                    outline: '2.5px solid var(--text)',
                    outlineOffset: '-2.5px',
                    fontWeight: 900,
                    background: 'rgba(255,255,255,0.7)',
                };
            }
        }

        // 2. Highlight target join column
        if (type === 'join_check' || type === 'emit_join') {
            const cleanL = activeStepObj.joinKeyL;
            const cleanR = activeStepObj.joinKeyR;
            if (cleanL && cleanL.toLowerCase() === field.toLowerCase()) {
                return {
                    outline: '2.5px solid var(--text)',
                    outlineOffset: '-2.5px',
                    fontWeight: 900,
                    background: 'rgba(255,255,255,0.7)',
                };
            }
            if (cleanR && cleanR.toLowerCase() === field.toLowerCase()) {
                return {
                    outline: '2.5px solid var(--text)',
                    outlineOffset: '-2.5px',
                    fontWeight: 900,
                    background: 'rgba(255,255,255,0.7)',
                };
            }
        }

        // 3. Highlight updated field during update mutations
        if (type === 'update_row' && activeStepObj.isMatch && activeStepObj.updateField && activeStepObj.updateField.toLowerCase() === field.toLowerCase()) {
            return {
                fontWeight: 900,
                background: 'var(--purple)',
                color: 'var(--white)',
            };
        }

        return {};
    };

    const getColumnHeaderStyle = (tableName, columnName) => {
        if (!isSimActive) return {};

        const currentClause = clauses[activeLineIdx];
        if (!currentClause) return {};

        const type = activeStepObj.type;
        const clauseType = currentClause.clauseType;

        let isAffected = false;

        // 1. WHERE filter column
        if (clauseType === 'where' && activeStepObj.filterField) {
            if (activeStepObj.filterField.toLowerCase() === columnName.toLowerCase()) {
                isAffected = true;
            }
        }

        // 2. JOIN ON keys
        if ((clauseType === 'on' || clauseType === 'join') && (type === 'join_check' || type === 'emit_join')) {
            const cleanL = activeStepObj.joinKeyL;
            const cleanR = activeStepObj.joinKeyR;
            if (cleanL && cleanL.toLowerCase() === columnName.toLowerCase()) {
                isAffected = true;
            }
            if (cleanR && cleanR.toLowerCase() === columnName.toLowerCase()) {
                isAffected = true;
            }
        }

        // 3. SET columns during UPDATE
        if (clauseType === 'set' && activeStepObj.updateField) {
            if (activeStepObj.updateField.toLowerCase() === columnName.toLowerCase()) {
                isAffected = true;
            }
        }

        // 4. SELECT / projection columns
        if (clauseType === 'select') {
            const textUpper = currentClause.text.toUpperCase();
            if (textUpper.includes('*')) {
                if (tableName === activeStepObj.activeTable || activeStepObj.activeTable === 'both') {
                    isAffected = true;
                }
            } else {
                const colPattern = new RegExp(`\\b(${tableName}\\.)?${columnName}\\b`, 'i');
                if (colPattern.test(currentClause.text)) {
                    isAffected = true;
                }
            }
        }

        // 5. GROUP BY columns
        if (clauseType === 'groupby') {
            const colPattern = new RegExp(`\\b(${tableName}\\.)?${columnName}\\b`, 'i');
            if (colPattern.test(currentClause.text)) {
                isAffected = true;
            }
        }

        // 6. INSERT columns
        if (clauseType === 'insert' || clauseType === 'values') {
            if (tableName === activeStepObj.activeTable) {
                isAffected = true;
            }
        }

        if (isAffected) {
            return {
                background: 'rgba(255, 217, 61, 0.45)',
                color: '#000',
                fontWeight: 900,
                boxShadow: 'inset 0 -3px 0 var(--border)',
                transition: 'all 0.15s ease'
            };
        }
        return {};
    };

    const getRowStatusIndicator = (type, isMatch) => {
        let color = '#f1fa8c'; // default scanning yellow
        let label = 'SCAN';

        if (type === 'left_scan' || type === 'init') {
            color = '#f1fa8c'; // yellow
            label = 'SCAN';
        } else if (type === 'eval_filter' || type === 'join_check' || type === 'update_row' || type === 'delete_row') {
            if (isMatch) {
                color = '#50fa7b'; // green
                label = 'PASS';
            } else {
                color = '#ff5555'; // red
                label = 'SKIP';
            }
        } else if (type === 'emit_row' || type === 'emit_join' || type === 'insert_row') {
            color = '#50fa7b'; // green
            label = 'EMIT';
        } else if (type === 'bucket') {
            color = '#bd93f9'; // purple
            label = 'BCKT';
        } else if (type === 'aggregate') {
            color = '#bd93f9'; // purple
            label = 'AGG';
        }

        return (
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(30, 30, 46, 0.95)',
                border: `1.5px solid ${color}`,
                borderRadius: '4px',
                padding: '1px 4px',
                fontSize: '0.52rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 900,
                color: color,
                boxShadow: `0 0 8px rgba(${color === '#50fa7b' ? '80,250,123' : color === '#ff5555' ? '255,85,85' : color === '#bd93f9' ? '189,147,249' : '241,250,140'}, 0.4)`,
                userSelect: 'none',
                verticalAlign: 'middle',
                marginRight: '6px',
            }}>
                <span className="pulse-dot" style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: color,
                }} />
                {label}
            </span>
        );
    };

    const activeStepObj = steps[currentStep] || {
        desc: "Write an SQL query or select a template, then click 'Start Simulation'.",
        type: 'idle',
        activeTable: 'none',
        highlightedUsers: [],
        highlightedOrders: [],
        currentResults: [],
        activeRowData: null,
        opDetails: { label: 'SQL Pipeline Idle', status: 'WAITING' }
    };

    const activeRowData = activeStepObj.activeRowData;
    const opDetails = activeStepObj.opDetails || { label: 'Waiting', status: 'IDLE' };
    const isSimActive = isRunning || isPaused || isFinished;
    const activeLineIdx = isSimActive ? getActiveLineIndex(activeStepObj, clauses) : -1;

    return (
        <ImmersiveLayout
            isActive={true}
            title="SQL Query Visualizer"
            icon={<CodeIcon size={20} />}
            moduleLabel="DBMS Module"
            isRunning={isRunning}
            isPaused={isPaused}
            isFinished={isFinished}
            speed={speed}
            onSpeedChange={setSpeed}
            onStart={handleStart}
            onPause={handlePause}
            onResume={() => { setIsRunning(true); setIsPaused(false); }}
            onReset={handleReset}
            onStep={handleStep}
            currentStepNum={steps.length ? currentStep + 1 : 0}
            totalSteps={steps.length}
            phaseName={error ? "Syntax Error" : isFinished ? "Query completed" : isRunning ? "Evaluating Query Plan..." : "Idle"}
            centerContent={
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--white)', padding: '0', overflowY: 'auto' }}>
                    <style>{`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .no-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                        @keyframes statusPulse {
                            0% { transform: scale(0.8); opacity: 0.6; }
                            100% { transform: scale(1.25); opacity: 1; }
                        }
                        .pulse-dot {
                            animation: statusPulse 1s infinite alternate ease-in-out;
                        }
                    `}</style>

                    {/* Error Overlay Console */}
                    {error && (
                        <div style={{ border: '2px solid var(--pink)', borderLeft: '5px solid var(--pink)', background: 'rgba(255,107,157,0.08)', color: 'var(--pink)', padding: '0.6rem 0.8rem', fontWeight: 700, fontSize: '0.78rem', fontFamily: 'var(--font-mono)', margin: '0.5rem' }}>
                            <span style={{ marginRight: '6px', fontWeight: 900 }}>[!]</span> {error}
                        </div>
                    )}

                    {/* ─── Template Pills ─── */}
                    <div style={{ padding: '0.6rem 0.8rem', borderBottom: '2px solid var(--border)', flexShrink: 0 }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.4, marginBottom: '0.35rem' }}>Templates</div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {TEMPLATES.map((t, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => { setQuery(t.query); handleReset(); }}
                                    style={{
                                        border: '2px solid var(--border)',
                                        background: query === t.query ? 'var(--cyan)' : 'var(--white)',
                                        color: 'var(--text)',
                                        padding: '0.2rem 0.5rem', fontWeight: 700, fontSize: '0.62rem', cursor: 'pointer',
                                        boxShadow: query === t.query ? '2px 2px 0 var(--border)' : 'none',
                                        transition: 'all 0.15s',
                                    }}
                                    title={t.desc}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ─── UNIFIED SQL CONSOLE ─── */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '320px' }}>

                        {/* Mode A: Editable textarea when idle */}
                        {!isSimActive && (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0' }}>
                                <div style={{ padding: '0.35rem 0.8rem', borderBottom: '2px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--orange)' }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>Interactive SQL Editor</span>
                                    <div style={{ flex: 1 }} />
                                    <span style={{ fontSize: '0.55rem', opacity: 0.5, fontFamily: 'var(--font-mono)' }}>Press START to simulate</span>
                                </div>
                                <textarea
                                    value={query}
                                    onChange={e => { setQuery(e.target.value); if (steps.length) handleReset(); }}
                                    style={{
                                        flex: 1, width: '100%', minHeight: '180px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem',
                                        background: '#1e1e2e', color: '#cdd6f4', border: 'none', padding: '0.6rem 0.8rem',
                                        resize: 'none', outline: 'none', lineHeight: 1.7,
                                    }}
                                    placeholder="SELECT * FROM Users WHERE age > 25;"
                                    spellCheck={false}
                                />
                            </div>
                        )}

                        {/* Mode B: Syntax highlighted line-by-line player when simulating */}
                        {isSimActive && (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1e1e2e', borderBottom: '2px solid var(--border)', overflowY: 'auto' }}>
                                <div style={{ padding: '0.3rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)' }}>Query Execution</span>
                                    <div style={{ flex: 1 }} />
                                    <span style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.25)' }}>
                                        Step {currentStep + 1}/{steps.length}
                                    </span>
                                </div>
                                <div style={{ padding: '0.3rem 0', flex: 1, overflowY: 'auto' }}>
                                    {clauses.map((clause, lineIdx) => {
                                        const isActive = lineIdx === activeLineIdx;
                                        const isPast = activeLineIdx > lineIdx;
                                        return (
                                            <div key={lineIdx}>
                                                {/* The SQL line */}
                                                <motion.div
                                                    animate={{
                                                        backgroundColor: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                                                    }}
                                                    transition={{ duration: 0.2 }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', padding: '0', cursor: 'default',
                                                        borderLeft: isActive ? '3px solid #a6e3a1' : isPast ? '3px solid rgba(166,227,161,0.2)' : '3px solid transparent',
                                                        minHeight: '1.6rem',
                                                    }}
                                                >
                                                    {/* Line number gutter */}
                                                    <div style={{
                                                        width: 32, flexShrink: 0, textAlign: 'right', paddingRight: '0.4rem',
                                                        fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                                                        color: isActive ? '#a6e3a1' : 'rgba(255,255,255,0.15)',
                                                        userSelect: 'none', fontWeight: isActive ? 800 : 400,
                                                    }}>
                                                        {lineIdx + 1}
                                                    </div>

                                                    {/* Active indicator arrow */}
                                                    <div style={{
                                                        width: 16, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.5rem', color: '#a6e3a1',
                                                    }}>
                                                        {isActive && (
                                                            <motion.span
                                                                initial={{ opacity: 0, x: -3 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                style={{ fontWeight: 900, lineHeight: 1 }}
                                                            >▶</motion.span>
                                                        )}
                                                    </div>

                                                    {/* SQL Code */}
                                                    <div style={{
                                                        flex: 1, padding: '0.15rem 0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
                                                        lineHeight: 1.5, opacity: isActive ? 1 : isPast ? 0.35 : 0.65,
                                                        whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                                                    }}>
                                                        <RenderSqlTokens line={clause.text} />
                                                    </div>
                                                </motion.div>

                                                {/* ─── Inline Detail Drawer (only under active line) ─── */}
                                                <AnimatePresence>
                                                    {isActive && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.25, ease: 'easeOut' }}
                                                            style={{ overflow: 'hidden', marginLeft: 51, marginRight: 8 }}
                                                        >
                                                            <div style={{
                                                                background: 'rgba(255,255,255,0.04)', borderRadius: '4px',
                                                                border: '1px solid rgba(255,255,255,0.08)', padding: '0.4rem 0.6rem',
                                                                marginBottom: '0.25rem', marginTop: '0.1rem',
                                                            }}>
                                                                {/* Natural language log */}
                                                                <div style={{
                                                                    fontSize: '0.68rem', color: '#a6e3a1', fontFamily: 'var(--font-mono)',
                                                                    lineHeight: 1.5, marginBottom: activeRowData ? '0.35rem' : 0,
                                                                }}>
                                                                    {activeStepObj.desc}
                                                                </div>

                                                                {/* Active record data pills + status badge */}
                                                                {activeRowData && (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                                                                        {Object.entries(activeRowData).map(([key, val]) => (
                                                                            <span key={key} style={{
                                                                                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                                                                borderRadius: '3px', padding: '0.1rem 0.3rem',
                                                                                fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: '#cdd6f4',
                                                                            }}>
                                                                                <span style={{ color: '#6c7086' }}>{key}:</span> {String(val)}
                                                                            </span>
                                                                        ))}

                                                                        {/* Status badge */}
                                                                        <motion.span
                                                                            key={opDetails.status + currentStep}
                                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                                            animate={{ scale: 1, opacity: 1 }}
                                                                            style={{
                                                                                background: getStatusStyle(opDetails.status).bg,
                                                                                color: getStatusStyle(opDetails.status).color,
                                                                                fontSize: '0.55rem', fontWeight: 900, padding: '0.1rem 0.4rem',
                                                                                borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '0.05em',
                                                                                marginLeft: 'auto',
                                                                            }}
                                                                        >
                                                                            {opDetails.status}
                                                                        </motion.span>
                                                                    </div>
                                                                )}

                                                                {!activeRowData && opDetails.status && (
                                                                    <div style={{ marginTop: '0.2rem' }}>
                                                                        <motion.span
                                                                            key={opDetails.status + currentStep}
                                                                            initial={{ scale: 0.8 }}
                                                                            animate={{ scale: 1 }}
                                                                            style={{
                                                                                background: getStatusStyle(opDetails.status).bg,
                                                                                color: getStatusStyle(opDetails.status).color,
                                                                                fontSize: '0.55rem', fontWeight: 900, padding: '0.1rem 0.4rem',
                                                                                borderRadius: '3px', textTransform: 'uppercase',
                                                                            }}
                                                                        >
                                                                            {opDetails.status}
                                                                        </motion.span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ─── Data Tables Toolbar ─── */}
                    <div style={{ padding: '0.4rem 0.8rem', borderTop: '2px solid var(--border)', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7 }}>Database Tables</span>
                        {!isSimActive && (
                            <button
                                onClick={() => {
                                    const tName = prompt("Enter new table name:");
                                    if (tName) handleAddTable(tName);
                                }}
                                style={{
                                    border: '2px solid var(--border)',
                                    background: 'var(--green)',
                                    color: 'white',
                                    padding: '0.15rem 0.4rem', fontWeight: 700, fontSize: '0.62rem', cursor: 'pointer',
                                    boxShadow: '1.5px 1.5px 0 var(--border)',
                                }}
                            >
                                + Add Custom Table
                            </button>
                        )}
                    </div>

                    {/* ─── Data Tables ─── */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: Object.keys(tables).length > 1 ? '1fr 1fr' : '1fr',
                        gap: '0.8rem',
                        padding: '0.8rem',
                        flexShrink: 0,
                    }}>
                        {Object.entries(tables).map(([tableName, rows]) => {
                            const firstRow = rows[0] || {};
                            const columns = Object.keys(firstRow);
                            const isUsers = tableName === 'users';
                            const headerColor = isUsers ? 'var(--cyan)' : tableName === 'orders' ? 'var(--pink)' : 'var(--yellow)';

                            return (
                                <div key={tableName} style={{ border: '2px solid var(--border)', background: 'var(--white)' }}>
                                    <div style={{
                                        padding: '0.35rem 0.6rem', borderBottom: '2px solid var(--border)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        background: headerColor,
                                    }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem', textTransform: 'uppercase' }}>
                                            <DatabaseIcon size={12} /> {tableName}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            {!isSimActive && (
                                                <>
                                                    <button onClick={() => {
                                                        const colName = prompt(`Add column to table '${tableName}':`);
                                                        if (colName) handleAddColumn(tableName, colName);
                                                    }} style={{
                                                        background: 'var(--white)', border: '1.5px solid var(--border)', cursor: 'pointer',
                                                        fontWeight: 700, fontSize: '0.55rem', padding: '1px 4px',
                                                    }} title="Add column">col+</button>
                                                    <button onClick={() => handleAddRow(tableName)} style={{
                                                        background: 'var(--white)', border: '1.5px solid var(--border)', cursor: 'pointer',
                                                        fontWeight: 900, fontSize: '0.65rem', padding: '0px 5px', lineHeight: '1.3',
                                                    }} title="Add row">+</button>
                                                    {Object.keys(tables).length > 1 && (
                                                        <button onClick={() => handleRemoveTable(tableName)} style={{
                                                            background: 'none', border: 'none', cursor: 'pointer',
                                                            color: 'var(--pink)', fontWeight: 900, fontSize: '0.82rem', padding: '0px 3px',
                                                        }} title="Delete table">×</button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="no-scrollbar" style={{ overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                        <table className="neo-table" style={{ fontSize: '0.7rem' }}>
                                            <thead>
                                                <tr>
                                                    {columns.map(col => {
                                                        const headerStyle = getColumnHeaderStyle(tableName, col);
                                                        return (
                                                            <th key={col} style={{ position: 'relative', ...headerStyle }}>
                                                                {col}
                                                                {!isSimActive && columns.length > 1 && (
                                                                    <span onClick={() => handleRemoveColumn(tableName, col)} style={{
                                                                        marginLeft: '4px', color: 'var(--pink)', cursor: 'pointer', fontWeight: 900, fontSize: '0.6rem'
                                                                    }} title="Remove column">×</span>
                                                                )}
                                                            </th>
                                                        );
                                                    })}
                                                    {!isSimActive && <th style={{ width: 28 }}></th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rows.map((row, rowIndex) => {
                                                    const rowId = row.id || row.order_id || Object.values(row)[0];
                                                    const style = getRowHighlightStyle(tableName, rowId);

                                                    const highlights = activeStepObj.activeTableHighlights?.[tableName] || [];
                                                    const isRowActive = isSimActive && (
                                                        highlights.includes(rowId) ||
                                                        (tableName === 'users' && activeStepObj.highlightedUsers?.includes(rowId)) ||
                                                        (tableName === 'orders' && activeStepObj.highlightedOrders?.includes(rowId))
                                                    );

                                                    return (
                                                        <motion.tr
                                                            key={rowIndex}
                                                            animate={{
                                                                backgroundColor: style.bg,
                                                                scale: isRowActive ? 1.025 : 1,
                                                                boxShadow: isRowActive ? '0 4px 10px rgba(0,0,0,0.15)' : 'none',
                                                            }}
                                                            transition={{ duration: 0.15 }}
                                                            style={{
                                                                position: 'relative',
                                                                zIndex: isRowActive ? 10 : 1,
                                                            }}
                                                        >
                                                            {columns.map((field, colIdx) => {
                                                                const cellStyle = getCellHighlightStyle(tableName, rowId, field);
                                                                return (
                                                                    <td key={field} style={{
                                                                        fontFamily: field.toLowerCase().includes('id') || field.toLowerCase() === 'age' || field.toLowerCase() === 'amount' ? 'var(--font-mono)' : 'inherit',
                                                                        fontWeight: field.toLowerCase().includes('id') ? 800 : 400,
                                                                        ...cellStyle
                                                                    }}>
                                                                        {isSimActive && isRowActive && colIdx === 0 && (
                                                                            getRowStatusIndicator(activeStepObj.type, activeStepObj.isMatch)
                                                                        )}
                                                                        {isSimActive ? (
                                                                            String(row[field] ?? '')
                                                                        ) : (
                                                                            <input
                                                                                value={String(row[field] ?? '')}
                                                                                onChange={e => handleEditCell(tableName, rowIndex, field, e.target.value)}
                                                                                style={{
                                                                                    border: 'none', background: 'transparent', fontFamily: 'inherit',
                                                                                    fontSize: 'inherit', fontWeight: 'inherit', color: 'var(--text)',
                                                                                    width: '100%', padding: 0, outline: 'none',
                                                                                }}
                                                                            />
                                                                        )}
                                                                    </td>
                                                                );
                                                            })}
                                                            {!isSimActive && (
                                                                <td style={{ textAlign: 'center', padding: '0.15rem' }}>
                                                                    <button onClick={() => handleRemoveRow(tableName, rowIndex)} style={{
                                                                        background: 'none', border: 'none', cursor: 'pointer',
                                                                        color: 'var(--pink)', fontWeight: 900, fontSize: '0.72rem', lineHeight: 1,
                                                                    }} title="Remove row">×</button>
                                                                </td>
                                                            )}
                                                        </motion.tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ─── Group By Buckets (only shown during GROUP BY) ─── */}
                    {activeStepObj.buckets && (
                        <div style={{ padding: '0.5rem 0.8rem', flexShrink: 0 }}>
                            <div className="panel-header" style={{ background: 'var(--purple)', fontSize: '0.68rem', padding: '4px 8px' }}>
                                Intermediate Grouping Buckets
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem', border: '2px solid var(--border)', borderTop: 'none' }}>
                                {Object.entries(activeStepObj.buckets).map(([key, rows]) => (
                                    <div key={key} style={{
                                        flex: 1, border: '2px solid var(--border)', padding: '0.35rem', background: '#fafafa',
                                    }}>
                                        <div style={{ fontWeight: 900, fontSize: '0.62rem', borderBottom: '1.5px solid var(--border)', paddingBottom: '0.2rem', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                                            GROUP: {key}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            {rows.map((r, ri) => (
                                                <div key={ri} style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', background: '#eee', padding: '2px 4px' }}>
                                                    {r.name || r.id} (Age: {r.age})
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            }
            rightContent={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>

                    {/* Query Execution Plan Panel */}
                    {queryPlan && (
                        <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                            <div className="panel-header" style={{ background: 'var(--cyan)', fontSize: '0.72rem', padding: '4px 8px' }}>
                                SQL Execution Optimizer Plan
                            </div>
                            <div style={{ padding: '0.55rem', background: 'var(--white)', fontSize: '0.68rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <div><strong>Operation:</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{queryPlan.type}</span></div>
                                <div><strong>Target Tables:</strong> {queryPlan.tables.join(', ')}</div>
                                <div><strong>Est. Time Cost:</strong> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--pink)', fontWeight: 700 }}>{queryPlan.cost}</span></div>
                                <div><strong>Index Access:</strong> {queryPlan.index}</div>

                                <div style={{ height: 1, background: '#eee', margin: '4px 0' }} />
                                <strong>Execution Pipeline Stages:</strong>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px' }}>
                                    {queryPlan.stages.map((stage, sIdx) => {
                                        let stepColor = 'var(--text)';
                                        let opacity = 0.5;
                                        if (isRunning || isFinished) {
                                            if (sIdx === 0 && (activeStepObj.type === 'init' || activeStepObj.type === 'idle')) {
                                                stepColor = 'var(--orange)'; opacity = 1;
                                            } else if (sIdx === 1 && (activeStepObj.type === 'eval_filter' || activeStepObj.type === 'left_scan' || activeStepObj.type === 'bucket')) {
                                                stepColor = 'var(--cyan)'; opacity = 1;
                                            } else if (sIdx === 2 && (activeStepObj.type === 'join_check' || activeStepObj.type === 'emit_join')) {
                                                stepColor = 'var(--pink)'; opacity = 1;
                                            } else if (sIdx === 3 && (activeStepObj.type === 'emit_row' || activeStepObj.type === 'aggregate')) {
                                                stepColor = 'var(--green)'; opacity = 1;
                                            }
                                        }
                                        return (
                                            <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', opacity, color: stepColor, fontWeight: 700, fontSize: '0.62rem' }}>
                                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: stepColor }} />
                                                {stage}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Live Compiled Result Grid */}
                    <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div className="panel-header" style={{ background: 'var(--green)', fontSize: '0.72rem', padding: '4px 8px' }}>
                            Live Query Result Buffer
                        </div>
                        <div style={{ padding: '0.5rem', background: 'var(--white)', flex: 1, overflowY: 'auto' }}>
                            {activeStepObj.currentResults?.length === 0 ? (
                                <div style={{ fontSize: '0.68rem', color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: '2rem' }}>
                                    Awaiting result emission...
                                </div>
                            ) : (
                                <table className="neo-table" style={{ fontSize: '0.68rem' }}>
                                    <thead>
                                        <tr>
                                            {resultColumns.map((colName, cIdx) => (
                                                <th key={cIdx}>{colName}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <AnimatePresence>
                                            {activeStepObj.currentResults?.map((row, idx) => (
                                                <motion.tr
                                                    key={idx}
                                                    initial={{ opacity: 0, x: -15, background: 'var(--green)' }}
                                                    animate={{ opacity: 1, x: 0, background: 'transparent' }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.25 }}
                                                >
                                                    {resultColumns.map((colName, cIdx) => (
                                                        <td key={cIdx} style={{ fontWeight: cIdx === 0 ? 800 : 400 }}>
                                                            {String(row[colName] ?? '')}
                                                        </td>
                                                    ))}
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            }
            timelineItems={steps.slice(0, currentStep + 1).map((s, idx) => ({
                id: idx,
                label: s.type.toUpperCase(),
                done: idx < currentStep,
                active: idx === currentStep
            }))}
            legend={[
                { color: 'var(--cyan)', label: 'Users' },
                { color: 'var(--pink)', label: 'Orders' },
                { color: 'var(--green)', label: 'Pass / Emit' },
                { color: 'var(--orange)', label: 'Fail / Discard' },
            ]}
            conceptMode={conceptMode}
            onConceptModeToggle={() => setConceptMode(prev => !prev)}
            hideFooter={true}
        >
            <div className="main-content">
                <Link to="/dbms">← Return to DBMS Landing</Link>
            </div>
        </ImmersiveLayout>
    );
}
