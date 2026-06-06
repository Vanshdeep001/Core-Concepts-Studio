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

export default function SqlQueryVisualizerSim() {
    const [query, setQuery] = useState(TEMPLATES[0].query);
    const [speed, setSpeed] = useState(1000);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [conceptMode, setConceptMode] = useState(false);

    // Database Tables State (can mutate)
    const [users, setUsers] = useState(INITIAL_USERS);
    const [orders, setOrders] = useState(INITIAL_ORDERS);

    // Compiler output & Steps
    const [error, setError] = useState(null);
    const [steps, setSteps] = useState([]);
    const [resultColumns, setResultColumns] = useState([]);
    const [queryPlan, setQueryPlan] = useState(null);

    // Helper to evaluate simple filter conditions
    const evalCondition = (row, field, op, val) => {
        let rowVal = row[field.toLowerCase()] ?? row[field];
        if (rowVal === undefined) return false;

        // Clean values
        let checkVal = val.replace(/['";]/g, '').trim();
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
            const primaryTable = match[2].trim();
            const joinTable = match[3] ? match[3].trim() : null;
            const joinKeyL = match[4] ? match[4].trim() : null;
            const joinKeyR = match[5] ? match[5].trim() : null;
            const whereClause = match[6] ? match[6].trim() : null;
            const groupByCol = match[7] ? match[7].trim() : null;

            // Validate tables
            if (primaryTable.toLowerCase() !== 'users' && primaryTable.toLowerCase() !== 'orders') {
                setError(`SQL Compiler Error: Table '${primaryTable}' does not exist.`);
                return;
            }
            if (joinTable && joinTable.toLowerCase() !== 'users' && joinTable.toLowerCase() !== 'orders') {
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
                const isUsersPrimary = primaryTable.toLowerCase() === 'users';
                const leftTable = isUsersPrimary ? users : orders;
                const rightTable = isUsersPrimary ? orders : users;
                
                setResultColumns(selectCols.map(c => c.replace(/^\w+\./, '')));

                animSteps.push({
                    desc: `Initializing Nested Loop Join: Scanning ${primaryTable} & joining with ${joinTable}...`,
                    type: 'init',
                    activeTable: 'both',
                    activeRowData: null,
                    opDetails: { label: 'Nested Loop Join', status: 'INIT' },
                    currentResults: []
                });

                // Nested Loop evaluation
                leftTable.forEach((leftRow, lIdx) => {
                    animSteps.push({
                        desc: `Scanning primary table: evaluating row ${lIdx + 1} (${leftRow.name || leftRow.order_id})...`,
                        type: 'left_scan',
                        activeTable: 'both',
                        highlightedUsers: isUsersPrimary ? [leftRow.id] : [],
                        highlightedOrders: isUsersPrimary ? [] : [leftRow.order_id],
                        activeRowData: leftRow,
                        opDetails: { label: `Scan Left Row`, status: 'SCANNING' },
                        currentResults: [...currentResults]
                    });

                    rightTable.forEach((rightRow, rIdx) => {
                        const leftJoinKeyVal = isUsersPrimary ? leftRow.id : leftRow.user_id;
                        const rightJoinKeyVal = isUsersPrimary ? rightRow.user_id : rightRow.id;
                        const isMatch = leftJoinKeyVal === rightJoinKeyVal;

                        const activeCompareData = {
                            left_id: leftJoinKeyVal,
                            right_user_id: rightJoinKeyVal,
                            left_info: leftRow.name || leftRow.product,
                            right_info: rightRow.product || rightRow.name
                        };

                        animSteps.push({
                            desc: `Comparing keys: Left (${leftJoinKeyVal}) == Right (${rightJoinKeyVal})? ${isMatch ? 'MATCH ✅' : 'NO MATCH ❌'}`,
                            type: 'join_check',
                            activeTable: 'both',
                            highlightedUsers: [isUsersPrimary ? leftRow.id : rightRow.id],
                            highlightedOrders: [isUsersPrimary ? rightRow.order_id : leftRow.order_id],
                            isMatch,
                            bezierLine: isMatch ? [{ userId: isUsersPrimary ? leftRow.id : rightRow.id, orderId: isUsersPrimary ? rightRow.order_id : leftRow.order_id }] : [],
                            activeRowData: activeCompareData,
                            opDetails: {
                                label: `Join Match: ${leftJoinKeyVal} == ${rightJoinKeyVal}`,
                                status: isMatch ? 'PASS' : 'FAIL'
                            },
                            currentResults: [...currentResults]
                        });

                        if (isMatch) {
                            // Create Joined row
                            const joined = {};
                            selectCols.forEach(col => {
                                const cleanCol = col.replace(/^\w+\./, '');
                                if (leftRow[cleanCol] !== undefined) joined[cleanCol] = leftRow[cleanCol];
                                else if (rightRow[cleanCol] !== undefined) joined[cleanCol] = rightRow[cleanCol];
                            });

                            currentResults.push(joined);
                            animSteps.push({
                                desc: `Match confirmed: Emitting joined row to result table!`,
                                type: 'emit_join',
                                activeTable: 'both',
                                highlightedUsers: [isUsersPrimary ? leftRow.id : rightRow.id],
                                highlightedOrders: [isUsersPrimary ? rightRow.order_id : leftRow.order_id],
                                bezierLine: [{ userId: isUsersPrimary ? leftRow.id : rightRow.id, orderId: isUsersPrimary ? rightRow.order_id : leftRow.order_id }],
                                activeRowData: joined,
                                opDetails: { label: 'Emit Joined Row', status: 'EMITTING' },
                                currentResults: [...currentResults]
                            });
                        }
                    });
                });
            } 
            // Case B: Group By Aggregation
            else if (groupByCol) {
                const targetTable = primaryTable.toLowerCase() === 'users' ? users : orders;
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
                    activeTable: primaryTable.toLowerCase(),
                    activeRowData: null,
                    opDetails: { label: 'Group By init', status: 'INIT' },
                    currentResults: []
                });

                const buckets = {};
                
                targetTable.forEach((row, idx) => {
                    const keyVal = String(row[grpCol] ?? row[groupByCol]);
                    if (!buckets[keyVal]) buckets[keyVal] = [];
                    buckets[keyVal].push(row);

                    animSteps.push({
                        desc: `Scanning row ${idx + 1}: Value of ${groupByCol} is '${keyVal}'. Assigning to bucket...`,
                        type: 'bucket',
                        activeTable: primaryTable.toLowerCase(),
                        highlightedUsers: primaryTable.toLowerCase() === 'users' ? [row.id] : [],
                        highlightedOrders: primaryTable.toLowerCase() === 'orders' ? [row.order_id] : [],
                        buckets: JSON.parse(JSON.stringify(buckets)),
                        activeRowData: row,
                        opDetails: {
                            label: `Group key (${groupByCol}) = '${keyVal}'`,
                            status: 'BUCKET'
                        },
                        currentResults: []
                    });
                });

                // Run aggregations
                const keys = Object.keys(buckets);
                keys.forEach((key, kIdx) => {
                    const groupRows = buckets[key];
                    const count = groupRows.length;
                    const sumAge = groupRows.reduce((sum, r) => sum + (r.age || 0), 0);
                    const avgAge = count > 0 ? (sumAge / count).toFixed(1) : 0;

                    const aggRow = {};
                    selectCols.forEach(c => {
                        const cleanC = c.toUpperCase();
                        if (cleanC.includes('COUNT')) aggRow['count'] = count;
                        else if (cleanC.includes('AVG')) aggRow['avg_age'] = avgAge;
                        else aggRow[c] = key;
                    });

                    currentResults.push(aggRow);

                    animSteps.push({
                        desc: `Computing aggregate for group '${key}': count=${count}, avg_age=${avgAge}...`,
                        type: 'aggregate',
                        activeTable: primaryTable.toLowerCase(),
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
                const targetTable = primaryTable.toLowerCase() === 'users' ? users : orders;
                const isUsers = primaryTable.toLowerCase() === 'users';

                if (selectColsStr === '*') {
                    setResultColumns(isUsers ? ['id', 'name', 'age', 'city'] : ['order_id', 'user_id', 'product', 'amount']);
                } else {
                    setResultColumns(selectCols);
                }

                animSteps.push({
                    desc: `Initializing Sequential Scan on table '${primaryTable}'...`,
                    type: 'init',
                    activeTable: primaryTable.toLowerCase(),
                    activeRowData: null,
                    opDetails: { label: 'Seq Scan Scan', status: 'INIT' },
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
                    let isMatch = true;
                    if (whereClause) {
                        isMatch = evalCondition(row, filterField, filterOp, filterVal);
                    }

                    animSteps.push({
                        desc: `Evaluating Row ${idx + 1}: ${whereClause ? `${filterField} (${row[filterField]}) ${filterOp} ${filterVal}?` : 'No predicate.'} -> ${isMatch ? 'PASS ✅' : 'FAIL ❌'}`,
                        type: 'eval_filter',
                        activeTable: primaryTable.toLowerCase(),
                        highlightedUsers: isUsers ? [row.id] : [],
                        highlightedOrders: isUsers ? [] : [row.order_id],
                        isMatch,
                        activeRowData: row,
                        opDetails: {
                            label: whereClause ? `${filterField} (${row[filterField]}) ${filterOp} ${filterVal}` : 'Select All',
                            status: isMatch ? 'PASS' : 'FAIL'
                        },
                        currentResults: [...currentResults]
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
                            activeTable: primaryTable.toLowerCase(),
                            highlightedUsers: isUsers ? [row.id] : [],
                            highlightedOrders: isUsers ? [] : [row.order_id],
                            activeRowData: projected,
                            opDetails: { label: 'Emit Output', status: 'EMITTING' },
                            currentResults: [...currentResults]
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

            if (table !== 'users') {
                setError("SQL Engine: Mutation is only permitted on 'Users' table in this simulator.");
                return;
            }

            const values = valsStr.split(',').map(v => v.replace(/['"]/g, '').trim());

            if (values.length !== 4) {
                setError("SQL Engine Error: Insert expects exactly 4 values (id, name, age, city).");
                return;
            }

            const newId = parseInt(values[0]);
            const newName = values[1];
            const newAge = parseInt(values[2]);
            const newCity = values[3];

            if (isNaN(newId) || isNaN(newAge)) {
                setError("SQL Engine Error: Invalid datatype. ID and Age must be integers.");
                return;
            }

            if (users.some(u => u.id === newId)) {
                setError(`SQL Engine Error: Primary key constraint violation. User ID ${newId} already exists.`);
                return;
            }

            setQueryPlan({
                type: 'INSERT',
                tables: ['Users'],
                cost: 'O(1) - Row Append',
                index: 'None',
                stages: ['Parse SQL', 'Primary Key Check', 'Append Row']
            });

            setResultColumns(['Status']);

            const newRow = { id: newId, name: newName, age: newAge, city: newCity };
            const animSteps = [
                {
                    desc: "Checking primary key constraint... Success.",
                    type: 'init',
                    activeTable: 'users',
                    activeRowData: newRow,
                    opDetails: { label: 'Constraint Check', status: 'PASS' },
                    currentResults: []
                },
                {
                    desc: `Inserting values: (${newId}, '${newName}', ${newAge}, '${newCity}') into Users table...`,
                    type: 'insert_row',
                    activeTable: 'users',
                    newRow,
                    activeRowData: newRow,
                    opDetails: { label: 'Insert Record', status: 'PASS' },
                    currentResults: [{ Status: '1 row inserted successfully.' }]
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

            if (table !== 'users') {
                setError("SQL Engine: Mutation is only permitted on 'Users' table in this simulator.");
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
                tables: ['Users'],
                cost: 'O(N) - Table Scan',
                index: 'None',
                stages: ['Parse SQL', 'Locate Row', 'In-Place Mutation']
            });

            setResultColumns(['Status']);

            const animSteps = [
                {
                    desc: "Scanning Users table to match predicate...",
                    type: 'init',
                    activeTable: 'users',
                    activeRowData: null,
                    opDetails: { label: 'Init Update Scan', status: 'INIT' },
                    currentResults: []
                }
            ];

            let updateCount = 0;
            const mutatedUsersList = JSON.parse(JSON.stringify(users));

            mutatedUsersList.forEach((row, idx) => {
                let isMatch = true;
                if (whereClause) {
                    isMatch = evalCondition(row, filterField, filterOp, filterVal);
                }

                if (isMatch) {
                    const oldRow = { ...row };
                    row[updateField] = isNaN(updateVal) ? updateVal : Number(updateVal);
                    updateCount++;

                    animSteps.push({
                        desc: `Matching Row found (ID: ${row.id}). Mutating cell: updating ${updateField} from '${oldRow[updateField]}' to '${row[updateField]}'...`,
                        type: 'update_row',
                        activeTable: 'users',
                        highlightedUsers: [row.id],
                        isMatch: true,
                        mutatedUsers: JSON.parse(JSON.stringify(mutatedUsersList)),
                        activeRowData: row,
                        opDetails: {
                            label: `Update ${updateField} = ${updateVal}`,
                            status: 'PASS'
                        },
                        currentResults: [{ Status: `Updated ${updateCount} row(s) successfully.` }]
                    });
                } else {
                    animSteps.push({
                        desc: `Evaluating Row (ID: ${row.id}): Predicate failed. Skipping row.`,
                        type: 'update_row',
                        activeTable: 'users',
                        highlightedUsers: [row.id],
                        isMatch: false,
                        activeRowData: row,
                        opDetails: {
                            label: `Match WHERE condition`,
                            status: 'FAIL'
                        },
                        currentResults: []
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

            if (table !== 'users') {
                setError("SQL Engine: Mutation is only permitted on 'Users' table in this simulator.");
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
                tables: ['Users'],
                cost: 'O(N) - Table Scan',
                index: 'None',
                stages: ['Parse SQL', 'Locate Match', 'Deallocate Row']
            });

            setResultColumns(['Status']);

            const animSteps = [
                {
                    desc: "Scanning Users table for target rows...",
                    type: 'init',
                    activeTable: 'users',
                    activeRowData: null,
                    opDetails: { label: 'Init Delete Scan', status: 'INIT' },
                    currentResults: []
                }
            ];

            let mutatedUsersList = JSON.parse(JSON.stringify(users));
            let deleteCount = 0;

            users.forEach((row, idx) => {
                let isMatch = true;
                if (whereClause) {
                    isMatch = evalCondition(row, filterField, filterOp, filterVal);
                }

                if (isMatch) {
                    deleteCount++;
                    // Remove from list
                    mutatedUsersList = mutatedUsersList.filter(u => u.id !== row.id);

                    animSteps.push({
                        desc: `Matching Row found (ID: ${row.id}). Discarding from grid...`,
                        type: 'delete_row',
                        activeTable: 'users',
                        highlightedUsers: [row.id],
                        isMatch: true,
                        mutatedUsers: JSON.parse(JSON.stringify(mutatedUsersList)),
                        activeRowData: row,
                        opDetails: {
                            label: 'Match condition. Delete!',
                            status: 'PASS'
                        },
                        currentResults: [{ Status: `Deleted ${deleteCount} row(s) successfully.` }]
                    });
                } else {
                    animSteps.push({
                        desc: `Evaluating Row (ID: ${row.id}): Predicate failed. Keeping row.`,
                        type: 'delete_row',
                        activeTable: 'users',
                        highlightedUsers: [row.id],
                        isMatch: false,
                        activeRowData: row,
                        opDetails: {
                            label: 'Match WHERE condition',
                            status: 'FAIL'
                        },
                        currentResults: []
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
                        setUsers(prev => [...prev, stepObj.newRow]);
                    }
                    if (stepObj.type === 'update_row' && stepObj.mutatedUsers && stepObj.isMatch) {
                        setUsers(stepObj.mutatedUsers);
                    }
                    if (stepObj.type === 'delete_row' && stepObj.mutatedUsers && stepObj.isMatch) {
                        setUsers(stepObj.mutatedUsers);
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
        setUsers(INITIAL_USERS);
        setOrders(INITIAL_ORDERS);
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
                setUsers(prev => [...prev, stepObj.newRow]);
            }
            if (stepObj.type === 'update_row' && stepObj.mutatedUsers && stepObj.isMatch) {
                setUsers(stepObj.mutatedUsers);
            }
            if (stepObj.type === 'delete_row' && stepObj.mutatedUsers && stepObj.isMatch) {
                setUsers(stepObj.mutatedUsers);
            }
        } else {
            setIsFinished(true);
            setIsRunning(false);
        }
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
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.8rem', background: 'var(--white)', padding: '1rem', overflowY: 'auto' }}>
                    
                    {/* Error Overlay Console */}
                    {error && (
                        <div style={{ border: '3px solid var(--pink)', background: 'rgba(255, 107, 157, 0.15)', color: 'var(--pink)', padding: '0.6rem', fontWeight: 700, fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Pre-made Templates */}
                    <div style={{ flexShrink: 0 }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.25rem' }}>Templates / Quick Queries</div>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            {TEMPLATES.map((t, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => { setQuery(t.query); handleReset(); }}
                                    style={{
                                        border: '2px solid var(--border)', background: query === t.query ? 'var(--cyan)' : 'var(--white)',
                                        color: '#000', padding: '0.2rem 0.5rem', fontWeight: 700, fontSize: '0.68rem', cursor: 'pointer',
                                    }}
                                    title={t.desc}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* SQL Editor Area */}
                    <div className="panel" style={{ flexShrink: 0 }}>
                        <div className="panel-header" style={{ background: 'var(--orange)', fontSize: '0.75rem', padding: '4px 8px' }}>
                            Interactive SQL Editor
                        </div>
                        <div style={{ padding: '0.5rem', background: 'var(--white)' }}>
                            <textarea
                                value={query}
                                onChange={e => { setQuery(e.target.value); if (steps.length) handleReset(); }}
                                style={{
                                    width: '100%', height: '80px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                                    background: '#222', color: '#66d9ef', border: '2px solid var(--border)', padding: '0.4rem',
                                    resize: 'none', outline: 'none'
                                }}
                                placeholder="SELECT * FROM Users WHERE age > 25;"
                            />
                        </div>
                    </div>

                    {/* Simulation Console Screen */}
                    <div className="panel" style={{ flexShrink: 0 }}>
                        <div className="panel-header" style={{ background: 'var(--yellow)', fontSize: '0.72rem', padding: '4px 8px' }}>
                            DBMS Execution Console Logs
                        </div>
                        <div style={{ padding: '0.5rem 0.8rem', background: '#111', color: '#a8e6cf', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', minHeight: '40px', display: 'flex', alignItems: 'center' }}>
                            🚀 {activeStepObj.desc}
                        </div>
                    </div>

                    {/* Live Visual Pipeline Processor (New Creative Animation Node) */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '3.5px dashed var(--border)', padding: '1rem', background: 'var(--white)', borderRadius: '4px', flexShrink: 0, minHeight: '130px', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 5, left: 10, fontSize: '0.55rem', fontFamily: 'var(--font-mono)', fontWeight: 900, opacity: 0.35 }}>
                            SQL_PIPELINE_ENGINE
                        </div>
                        
                        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-around', alignItems: 'center', gap: '1rem', marginTop: '0.4rem' }}>
                            
                            {/* Input Row Card */}
                            <div style={{ minWidth: '130px' }}>
                                <div style={{ fontSize: '0.55rem', fontWeight: 900, opacity: 0.5, textAlign: 'center', marginBottom: '2px' }}>SCANNED RECORD</div>
                                <AnimatePresence mode="wait">
                                    {activeRowData ? (
                                        <motion.div
                                            key={JSON.stringify(activeRowData)}
                                            initial={{ opacity: 0, x: -30, scale: 0.9 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            exit={{ opacity: 0, x: 30, scale: 0.9 }}
                                            style={{
                                                background: 'var(--white)', border: '2px solid var(--border)', padding: '0.4rem',
                                                boxShadow: '3px 3px 0 var(--border)', fontSize: '0.62rem', fontFamily: 'var(--font-mono)'
                                            }}
                                        >
                                            {Object.entries(activeRowData).map(([key, val]) => (
                                                <div key={key}>
                                                    <span style={{ opacity: 0.6 }}>{key}:</span> {String(val)}
                                                </div>
                                            ))}
                                        </motion.div>
                                    ) : (
                                        <div style={{ border: '2px dashed #ccc', height: '55px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '0.62rem' }}>
                                            [Waiting for Scan]
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Operator Node */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '140px' }}>
                                <div style={{
                                    background: 'var(--yellow)', border: '2px solid var(--border)', padding: '0.4rem',
                                    boxShadow: '3px 3px 0 var(--border)', width: '100%', textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '0.6rem', fontWeight: 900 }}>EVAL OPERATOR</div>
                                    <div style={{ height: 2, background: 'var(--border)', margin: '4px 0' }} />
                                    <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                                        {opDetails.label}
                                    </div>
                                </div>

                                {opDetails.status && (
                                    <motion.div
                                        key={opDetails.status}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        style={{
                                            background: opDetails.status === 'PASS' || opDetails.status === 'EMITTING' ? 'var(--green)' : opDetails.status === 'FAIL' ? 'var(--pink)' : 'var(--cyan)',
                                            color: '#000', border: '1.5px solid var(--border)', fontSize: '0.58rem', fontWeight: 900, padding: '1px 5px', marginTop: '2px', textTransform: 'uppercase'
                                        }}
                                    >
                                        {opDetails.status}
                                    </motion.div>
                                )}
                            </div>

                            {/* Routing arrows */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <motion.span
                                        animate={(opDetails.status === 'PASS' || opDetails.status === 'EMITTING') ? { x: [0, 8, 0] } : {}}
                                        transition={{ repeat: Infinity, duration: 0.8 }}
                                        style={{ fontSize: '1rem', color: (opDetails.status === 'PASS' || opDetails.status === 'EMITTING') ? 'var(--green)' : '#ccc' }}
                                    >
                                        ➔
                                    </motion.span>
                                    <div style={{
                                        background: (opDetails.status === 'PASS' || opDetails.status === 'EMITTING') ? 'rgba(168,230,207,0.3)' : 'transparent',
                                        border: '2px solid ' + ((opDetails.status === 'PASS' || opDetails.status === 'EMITTING') ? 'var(--border)' : '#ccc'),
                                        padding: '0.2rem 0.4rem', fontSize: '0.6rem', fontWeight: 700, fontFamily: 'var(--font-mono)'
                                    }}>
                                        EMIT RESULT
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <motion.span
                                        animate={opDetails.status === 'FAIL' ? { x: [0, 8, 0] } : {}}
                                        transition={{ repeat: Infinity, duration: 0.8 }}
                                        style={{ fontSize: '1rem', color: opDetails.status === 'FAIL' ? 'var(--pink)' : '#ccc' }}
                                    >
                                        ➔
                                    </motion.span>
                                    <div style={{
                                        background: opDetails.status === 'FAIL' ? 'rgba(255,107,157,0.2)' : 'transparent',
                                        border: '2px solid ' + (opDetails.status === 'FAIL' ? 'var(--border)' : '#ccc'),
                                        padding: '0.2rem 0.4rem', fontSize: '0.6rem', fontWeight: 700, fontFamily: 'var(--font-mono)'
                                    }}>
                                        DISCARD 🗑️
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Grid Databases Representation */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.25rem', flex: 1, position: 'relative' }}>
                        
                        {/* Users Table Card */}
                        <div style={{ border: '3px solid var(--border)', background: 'var(--white)' }}>
                            <div style={{ background: 'var(--cyan)', borderBottom: '3px solid var(--border)', padding: '4px 8px', fontSize: '0.72rem', fontWeight: 900, display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}><DatabaseIcon size={12} /> Table: Users</span>
                                <span style={{ fontSize: '0.55rem', opacity: 0.6 }}>Primary Key (id)</span>
                            </div>
                            <table className="neo-table" style={{ fontSize: '0.72rem' }}>
                                <thead>
                                    <tr>
                                        <th>id</th>
                                        <th>name</th>
                                        <th>age</th>
                                        <th>city</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((row) => {
                                        const isHlg = activeStepObj.highlightedUsers?.includes(row.id);
                                        const isFilterMatch = activeStepObj.type === 'eval_filter' && isHlg && activeStepObj.isMatch;
                                        const isFilterFail = activeStepObj.type === 'eval_filter' && isHlg && !activeStepObj.isMatch;
                                        let bg = 'transparent';
                                        if (isFilterMatch) bg = 'rgba(168,230,207,0.4)'; // success glow
                                        else if (isFilterFail) bg = 'rgba(255,107,157,0.3)'; // fail dim
                                        else if (isHlg) bg = 'rgba(255,217,61,0.3)'; // active scan

                                        return (
                                            <motion.tr
                                                key={row.id}
                                                animate={{ background: bg }}
                                                transition={{ duration: 0.15 }}
                                            >
                                                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{row.id}</td>
                                                <td>{row.name}</td>
                                                <td style={{ fontFamily: 'var(--font-mono)' }}>{row.age}</td>
                                                <td>{row.city}</td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Orders Table Card */}
                        <div style={{ border: '3px solid var(--border)', background: 'var(--white)' }}>
                            <div style={{ background: 'var(--pink)', borderBottom: '3px solid var(--border)', padding: '4px 8px', fontSize: '0.72rem', fontWeight: 900, display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}><DatabaseIcon size={12} /> Table: Orders</span>
                                <span style={{ fontSize: '0.55rem', opacity: 0.6 }}>Foreign Key (user_id)</span>
                            </div>
                            <table className="neo-table" style={{ fontSize: '0.72rem' }}>
                                <thead>
                                    <tr>
                                        <th>order_id</th>
                                        <th>user_id</th>
                                        <th>product</th>
                                        <th>amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((row) => {
                                        const isHlg = activeStepObj.highlightedOrders?.includes(row.order_id);
                                        let bg = isHlg ? 'rgba(255,217,61,0.3)' : 'transparent';
                                        return (
                                            <motion.tr
                                                key={row.order_id}
                                                animate={{ background: bg }}
                                                transition={{ duration: 0.15 }}
                                            >
                                                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{row.order_id}</td>
                                                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{row.user_id}</td>
                                                <td>{row.product}</td>
                                                <td style={{ fontFamily: 'var(--font-mono)' }}>${row.amount}</td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Dynamic Aggregated Group By Buckets Visualizer */}
                    {activeStepObj.buckets && (
                        <div className="panel" style={{ flexShrink: 0 }}>
                            <div className="panel-header" style={{ background: 'var(--purple)', fontSize: '0.7rem', padding: '4px' }}>
                                Intermediate Grouping Buckets
                            </div>
                            <div style={{ padding: '0.5rem', display: 'flex', gap: '1rem', background: 'var(--white)' }}>
                                {Object.entries(activeStepObj.buckets).map(([key, rows]) => (
                                    <div key={key} style={{ flex: 1, border: '2px solid var(--border)', padding: '0.35rem', background: '#fafafa' }}>
                                        <div style={{ fontWeight: 900, fontSize: '0.65rem', borderBottom: '1.5px solid var(--border)', marginBottom: '4px', textTransform: 'uppercase' }}>
                                            🔑 GROUP: {key}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                            {rows.map((r, ri) => (
                                                <div key={ri} style={{ background: '#eee', padding: '2px 4px', fontSize: '0.58rem', fontFamily: 'var(--font-mono)' }}>
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
                { color: 'var(--cyan)', label: 'Users Grid' },
                { color: 'var(--pink)', label: 'Orders Grid' },
                { color: 'var(--yellow)', label: 'Row Scan Evaluation' },
                { color: 'var(--green)', label: 'Emitted Output Buffer' }
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
