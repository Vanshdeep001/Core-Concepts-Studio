import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import useSnapshot from '../../hooks/useSnapshot';
import { VaultIcon, LaptopIcon, LockIcon, UnlockIcon, AlertIcon } from '../../components/Icons';

export default function TransactionsSim() {
    const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'sandbox'
    const [speed, setSpeed] = useState(800);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    // ─── TAB 1: ACID TRANSFER PIPELINE STATE ───
    const [pipeStep, setPipeStep] = useState(0); // 0: Idle, 1: BEGIN, 2: DEBIT Alice, 3: CREDIT Bob, 4: COMMIT
    const [balanceA, setBalanceA] = useState(1000);
    const [balanceB, setBalanceB] = useState(500);
    const [logs, setLogs] = useState(['Connection initialized. Database standing by.']);
    const [isCrashed, setIsCrashed] = useState(false);
    const [recoveryDone, setRecoveryDone] = useState(false);

    // ─── TAB 2: TRANSACTION ISOLATION SANDBOX STATE ───
    const [isoLevel, setIsoLevel] = useState('RU'); // 'RU' (Read Uncommitted), 'RC' (Read Committed), 'RR' (Repeatable Read), 'SZ' (Serializable)

    // Client connections states
    const [t1State, setT1State] = useState('IDLE'); // 'IDLE' | 'ACTIVE' | 'COMMITTED' | 'ABORTED'
    const [t2State, setT2State] = useState('IDLE');

    // Command histories
    const [t1History, setT1History] = useState([]);
    const [t2History, setT2History] = useState([]);

    // Shared Database Tables
    const [dbAlice, setDbAlice] = useState(1000); // Committed Alice balance
    const [bufferAlice, setBufferAlice] = useState(1000); // Uncommitted Alice balance

    const [charlieInserted, setCharlieInserted] = useState(false); // If Charlie row is inserted
    const [charlieCommitted, setCharlieCommitted] = useState(false); // If Charlie row is committed

    // Lock states: { row: 'Alice' | 'Charlie', type: 'S' | 'X' | null, holder: 'T1' | 'T2' | null }
    const [locks, setLocks] = useState({
        Alice: { type: null, holder: null },
        Charlie: { type: null, holder: null }
    });

    // Blocked Query State: { thread: 'T1' | 'T2' | null, action: string | null }
    const [blockedQuery, setBlockedQuery] = useState({ thread: null, action: null });

    // Anomaly Warning Alert Modal
    const [anomalyAlert, setAnomalyAlert] = useState({ type: null, msg: null });

    // Read log tracking to detect anomalies
    const [t2FirstReadAlice, setT2FirstReadAlice] = useState(null);
    const [t2ReadCount, setT2ReadCount] = useState(0);
    const [t2FirstScanRows, setT2FirstScanRows] = useState(null);
    const [t2ScanCount, setT2ScanCount] = useState(0);

    // Reset ACID Pipeline (Tab 1)
    const handleResetPipeline = () => {
        setPipeStep(0);
        setBalanceA(1000);
        setBalanceB(500);
        setLogs(['Connection initialized. Database standing by.']);
        setIsCrashed(false);
        setRecoveryDone(false);
        setIsRunning(false);
        setIsPaused(false);
        setIsFinished(false);
    };

    // Auto-advance pipeline steps when running (Tab 1 only)
    useEffect(() => {
        let interval = null;
        if (isRunning && !isPaused && !isFinished && activeTab === 'pipeline') {
            interval = setInterval(() => {
                if (isCrashed) return;
                setPipeStep(prev => {
                    if (prev >= 4) {
                        setIsFinished(true);
                        setIsRunning(false);
                        return prev;
                    }
                    const next = prev + 1;
                    if (next === 1) {
                        setLogs(p => [...p, 'T1: BEGIN TRANSACTION; (Vault row locks acquired)']);
                    } else if (next === 2) {
                        setBalanceA(700);
                        setLogs(p => [...p, 'T1: UPDATE Accounts SET Balance = Balance - 300 WHERE User = "Alice"; (WAL Log buffer updated)']);
                    } else if (next === 3) {
                        setBalanceB(800);
                        setLogs(p => [...p, 'T1: UPDATE Accounts SET Balance = Balance + 300 WHERE User = "Bob"; (Volatile buffer updated)']);
                    } else if (next === 4) {
                        setLogs(p => [...p, 'T1: COMMIT; // Write-Ahead Log flushed to disk. Vault locks released.']);
                        setIsFinished(true);
                        setIsRunning(false);
                    }
                    return next;
                });
            }, speed);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isRunning, isPaused, isFinished, activeTab, speed, isCrashed]);

    // Manual step execution for ACID Pipeline (Tab 1)
    const executeNextPipelineStep = () => {
        if (isCrashed) return;
        if (pipeStep < 4) {
            const next = pipeStep + 1;
            setPipeStep(next);

            if (next === 1) {
                setLogs(prev => [...prev, 'T1: BEGIN TRANSACTION; (Vault row locks acquired)']);
            } else if (next === 2) {
                setBalanceA(700);
                setLogs(prev => [...prev, 'T1: UPDATE Accounts SET Balance = Balance - 300 WHERE User = "Alice"; (WAL Log buffer updated)']);
            } else if (next === 3) {
                setBalanceB(800);
                setLogs(prev => [...prev, 'T1: UPDATE Accounts SET Balance = Balance + 300 WHERE User = "Bob"; (Volatile buffer updated)']);
            } else if (next === 4) {
                setLogs(prev => [...prev, 'T1: COMMIT; // Write-Ahead Log flushed to disk. Vault locks released.']);
                setIsFinished(true);
            }
        }
    };

    // Simulate Hardware Crash in ACID Pipeline (Tab 1)
    const triggerCrash = () => {
        setIsRunning(false);
        setIsCrashed(true);
        setLogs(prev => [
            ...prev,
            '[CRIT] VOLTAGE FLOOD! POWER OUTAGE DETECTED MID-TRANSACTION!',
            '[ERR] DATABASE CORRUPTED: System assets balance is inconsistent ($1200 instead of $1500!)'
        ]);
    };

    // Rollback Recovery engine in ACID Pipeline (Tab 1)
    const triggerRollback = () => {
        setBalanceA(1000);
        setBalanceB(500);
        setIsCrashed(false);
        setRecoveryDone(true);
        setPipeStep(0);
        setLogs(prev => [
            ...prev,
            '[RECOVERY] ACTIVATED: Reading WAL log buffer backwards...',
            '~~T1: CREDIT Bob +$300~~ [UNCOMMITTED CHANGES DISCARDED]',
            '~~T1: DEBIT Alice -$300~~ [ORIGINAL VALUES RESTORED]',
            '[RESTORED] ATOMICITY RESTORED: Transactions rolled back completely. Asset balance consistent at $1500.'
        ]);
    };

    // ─── TAB 2: LIVE ISOLATION LEVEL SANDBOX ENGINE ───

    // Reset Sandbox Playground
    const handleResetSandbox = () => {
        setT1State('IDLE');
        setT2State('IDLE');
        setT1History([]);
        setT2History([]);
        setDbAlice(1000);
        setBufferAlice(1000);
        setCharlieInserted(false);
        setCharlieCommitted(false);
        setLocks({
            Alice: { type: null, holder: null },
            Charlie: { type: null, holder: null }
        });
        setBlockedQuery({ thread: null, action: null });
        setAnomalyAlert({ type: null, msg: null });
        setT2FirstReadAlice(null);
        setT2ReadCount(0);
        setT2FirstScanRows(null);
        setT2ScanCount(0);
    };

    // Trigger T1 or T2 Unblocking logic if locks are released on COMMIT or ROLLBACK
    const tryUnblockWaitingThread = (newLocks, commitedAliceVal, charlieCommState) => {
        if (!blockedQuery.thread) return;

        const { thread, action } = blockedQuery;

        if (thread === 'T2') {
            // T2 was blocked waiting on T1's write lock on Alice
            if (action === 'SELECT_ALICE') {
                // If Alice X-lock is now released
                if (!newLocks.Alice.type || newLocks.Alice.holder !== 'T1') {
                    setBlockedQuery({ thread: null, action: null });
                    executeT2SelectAlice(newLocks, commitedAliceVal);
                }
            }
        } else if (thread === 'T1') {
            // T1 was blocked waiting on T2's read lock (S-lock) on Alice
            if (action === 'UPDATE_ALICE') {
                if (!newLocks.Alice.type || newLocks.Alice.holder !== 'T2') {
                    setBlockedQuery({ thread: null, action: null });
                    executeT1UpdateAlice(newLocks);
                }
            } else if (action === 'INSERT_CHARLIE') {
                // Serializable range lock released by T2
                if (!newLocks.Charlie.type || newLocks.Charlie.holder !== 'T2') {
                    setBlockedQuery({ thread: null, action: null });
                    executeT1InsertCharlie(newLocks);
                }
            }
        }
    };

    // ──────────────── T1 ACTIONS ────────────────
    const handleT1Begin = () => {
        if (t1State !== 'IDLE') return;
        setT1State('ACTIVE');
        setT1History(prev => [...prev, 'T1: BEGIN TRANSACTION;']);
    };

    const executeT1UpdateAlice = (currentLocks) => {
        // T1 updates Alice to 1200
        setBufferAlice(1200);

        // Acquire Exclusive (X) Lock on Alice
        setLocks(prev => ({
            ...prev,
            Alice: { type: 'X', holder: 'T1' }
        }));

        setT1History(prev => [...prev, 'T1: UPDATE Accounts SET Balance = 1200 WHERE User = "Alice";']);
    };

    const handleT1UpdateAlice = () => {
        if (t1State !== 'ACTIVE') return;

        // Check lock conflicts: Does T2 hold a Shared (S) lock on Alice?
        // Long-lived read locks exist in Repeatable Read (RR) and Serializable (SZ)
        const hasT2ReadLock = (isoLevel === 'RR' || isoLevel === 'SZ') && locks.Alice.type === 'S' && locks.Alice.holder === 'T2';

        if (hasT2ReadLock) {
            // T1 is BLOCKED because T2 holds S-lock
            setBlockedQuery({ thread: 'T1', action: 'UPDATE_ALICE' });
            setT1History(prev => [...prev, 'T1: UPDATE Alice ($1200) [BLOCKED] (Waiting for T2 Read S-Lock...)']);
        } else {
            executeT1UpdateAlice(locks);
        }
    };

    const executeT1InsertCharlie = (currentLocks) => {
        setCharlieInserted(true);
        // T1 acquires X lock on Charlie
        setLocks(prev => ({
            ...prev,
            Charlie: { type: 'X', holder: 'T1' }
        }));
        setT1History(prev => [...prev, 'T1: INSERT INTO Accounts (User, Balance) VALUES ("Charlie", 800);']);
    };

    const handleT1InsertCharlie = () => {
        if (t1State !== 'ACTIVE') return;
        if (charlieInserted) return;

        // Check if T2 has Serializable Range locks (SZ) active
        const hasT2RangeLock = isoLevel === 'SZ' && t2State === 'ACTIVE' && t2ScanCount > 0;

        if (hasT2RangeLock) {
            setBlockedQuery({ thread: 'T1', action: 'INSERT_CHARLIE' });
            setT1History(prev => [...prev, 'T1: INSERT Charlie ($800) [BLOCKED] (Waiting for T2 Range Serializable Lock...)']);
        } else {
            executeT1InsertCharlie(locks);
        }
    };

    const handleT1Commit = () => {
        if (t1State !== 'ACTIVE') return;

        // Persist Alice uncommitted state to database committed state
        const finalAlice = bufferAlice;
        setDbAlice(finalAlice);

        const finalCharlieCommitted = charlieInserted;
        if (charlieInserted) {
            setCharlieCommitted(true);
        }

        // Release T1 Locks
        const updatedLocks = { ...locks };
        if (updatedLocks.Alice.holder === 'T1') {
            updatedLocks.Alice = { type: null, holder: null };
        }
        if (updatedLocks.Charlie.holder === 'T1') {
            updatedLocks.Charlie = { type: null, holder: null };
        }
        setLocks(updatedLocks);

        setT1State('COMMITTED');
        setT1History(prev => [...prev, 'T1: COMMIT; (Locks released, updates persisted)']);

        // Check if T2 was waiting for these locks
        tryUnblockWaitingThread(updatedLocks, finalAlice, finalCharlieCommitted);
    };

    const handleT1Rollback = () => {
        if (t1State !== 'ACTIVE') return;

        // Discard uncommitted changes
        setBufferAlice(dbAlice);
        setCharlieInserted(false);

        // Release T1 Locks
        const updatedLocks = { ...locks };
        if (updatedLocks.Alice.holder === 'T1') {
            updatedLocks.Alice = { type: null, holder: null };
        }
        if (updatedLocks.Charlie.holder === 'T1') {
            updatedLocks.Charlie = { type: null, holder: null };
        }
        setLocks(updatedLocks);

        setT1State('ABORTED');
        setT1History(prev => [...prev, 'T1: ROLLBACK; (Uncommitted updates discarded, locks released)']);

        // Check if T2 was waiting for locks
        tryUnblockWaitingThread(updatedLocks, dbAlice, false);
    };

    // ──────────────── T2 ACTIONS ────────────────
    const handleT2Begin = () => {
        if (t2State !== 'IDLE') return;
        setT2State('ACTIVE');
        setT2History(prev => [...prev, 'T2: BEGIN TRANSACTION;']);
    };

    const executeT2SelectAlice = (currentLocks, committedAliceVal) => {
        // T2 queries Alice
        const activeAliceBalance = (isoLevel === 'RU' && t1State === 'ACTIVE' && bufferAlice === 1200)
            ? 1200
            : committedAliceVal;

        // RU does not place read locks. RC places short-lived read locks.
        // RR and SZ place long-lived S-locks on Alice.
        const shouldAcquireS = isoLevel === 'RR' || isoLevel === 'SZ';

        if (shouldAcquireS) {
            setLocks(prev => ({
                ...prev,
                Alice: { type: 'S', holder: 'T2' }
            }));
        }

        // Increment T2 Alice read trackers
        const newReadCount = t2ReadCount + 1;
        setT2ReadCount(newReadCount);

        setT2History(prev => [...prev, `T2: SELECT Balance FROM Accounts WHERE User = "Alice"; --> Returns $${activeAliceBalance}`]);

        // Check for anomalies
        if (isoLevel === 'RU' && t1State === 'ACTIVE' && bufferAlice === 1200) {
            // Dirty Read anomaly occurred
            setAnomalyAlert({
                type: 'dirty',
                msg: 'DIRTY READ ANOMALY DETECTED! Client Thread 2 (T2) just read Alice\'s uncommitted update of $1200. T1 could abort and rollback at any second, leaving T2 with completely false receipts!'
            });
        }

        // Store first read value to trace Non-Repeatable reads
        if (newReadCount === 1) {
            setT2FirstReadAlice(activeAliceBalance);
        } else if (newReadCount > 1 && t2FirstReadAlice !== null && t2FirstReadAlice !== activeAliceBalance) {
            // Non-Repeatable Read anomaly occurred
            setAnomalyAlert({
                type: 'nonrepeatable',
                msg: 'NON-REPEATABLE READ ANOMALY DETECTED! T2 re-read Alice\'s account inside the same transaction and got $700 (Read #2) instead of the initial $1000 (Read #1)! Alice\'s value mutated because T1 committed in between.'
            });
        }
    };

    const handleT2SelectAlice = () => {
        if (t2State !== 'ACTIVE') return;

        // Check Lock conflicts: Does T1 hold an active Exclusive (X) lock on Alice?
        const isAliceLockedByT1 = locks.Alice.type === 'X' && locks.Alice.holder === 'T1';

        // X-locks conflict with read (S) operations in Read Committed, Repeatable Read, and Serializable levels.
        // In Read Uncommitted (RU), reads completely ignore X-locks (allowing dirty reads).
        const shouldWaitOnLock = isAliceLockedByT1 && isoLevel !== 'RU';

        if (shouldWaitOnLock) {
            setBlockedQuery({ thread: 'T2', action: 'SELECT_ALICE' });
            setT2History(prev => [...prev, 'T2: SELECT Alice [BLOCKED] (Waiting for T1 Exclusive Write X-Lock...)']);
        } else {
            executeT2SelectAlice(locks, dbAlice);
        }
    };

    const handleT2RangeScan = () => {
        if (t2State !== 'ACTIVE') return;

        // Range query scans vaults with balance > 600
        // Alice matches. Charlie matches if inserted and either committed OR isolation level is Read Uncommitted.
        const isCharlieVisible = charlieInserted && (charlieCommitted || isoLevel === 'RU');
        const rowsCount = isCharlieVisible ? 2 : 1;

        // If Serializable, acquire S-lock on Charlie to prevent inserts into scanned range
        if (isoLevel === 'SZ') {
            setLocks(prev => ({
                ...prev,
                Charlie: { type: 'S', holder: 'T2' }
            }));
        }

        const newScanCount = t2ScanCount + 1;
        setT2ScanCount(newScanCount);

        setT2History(prev => [...prev, `T2: SELECT * FROM Accounts WHERE Balance > 600; --> Returns ${rowsCount} row(s)`]);

        if (newScanCount === 1) {
            setT2FirstScanRows(rowsCount);
        } else if (newScanCount > 1 && t2FirstScanRows !== null && t2FirstScanRows < rowsCount) {
            // Phantom Read anomaly occurred
            setAnomalyAlert({
                type: 'phantom',
                msg: 'PHANTOM READ ANOMALY DETECTED! T2 re-executed a range query and got 2 rows instead of 1! Charlie\'s row materialized out of thin air because T1 concurrently inserted and committed it!'
            });
        }
    };

    const handleT2Commit = () => {
        if (t2State !== 'ACTIVE') return;

        // Release T2 locks
        const updatedLocks = { ...locks };
        if (updatedLocks.Alice.holder === 'T2') {
            updatedLocks.Alice = { type: null, holder: null };
        }
        if (updatedLocks.Charlie.holder === 'T2') {
            updatedLocks.Charlie = { type: null, holder: null };
        }
        setLocks(updatedLocks);

        setT2State('COMMITTED');
        setT2History(prev => [...prev, 'T2: COMMIT; (Reader locks released)']);

        // Check if T1 was waiting on T2 locks
        tryUnblockWaitingThread(updatedLocks, dbAlice, charlieCommitted);
    };

    const handleT2Rollback = () => {
        if (t2State !== 'ACTIVE') return;

        // Release T2 locks
        const updatedLocks = { ...locks };
        if (updatedLocks.Alice.holder === 'T2') {
            updatedLocks.Alice = { type: null, holder: null };
        }
        if (updatedLocks.Charlie.holder === 'T2') {
            updatedLocks.Charlie = { type: null, holder: null };
        }
        setLocks(updatedLocks);

        setT2State('ABORTED');
        setT2History(prev => [...prev, 'T2: ROLLBACK; (Reader locks released)']);

        // Check if T1 was waiting on T2 locks
        tryUnblockWaitingThread(updatedLocks, dbAlice, charlieCommitted);
    };

    // ─── VISUAL COIN STACK RENDERER ───
    const renderBalanceCoins = (balance) => {
        const coinCount = Math.min(Math.floor(balance / 200), 5);
        return (
            <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', marginTop: '4px' }}>
                {Array.from({ length: coinCount }).map((_, i) => (
                    <div
                        key={i}
                        style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: 'var(--yellow)', border: '1.5px solid var(--border)',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
                        }}
                    />
                ))}
            </div>
        );
    };

    // ─── ACID PIPELINE STATE INDICATORS (Tab 1) ───
    const acid = (() => {
        const atomicity = isCrashed ? 'broken' : pipeStep === 4 ? 'saved' : 'pending';
        const consistency = isCrashed ? 'leaked' : (balanceA + balanceB === 1500) ? 'safe' : 'leaked';
        const isolation = pipeStep >= 1 && pipeStep < 4 ? 'shielded' : 'normal';
        const durability = pipeStep === 4 ? 'saved' : 'pending';
        return { atomicity, consistency, isolation, durability };
    })();

    // ACID indicators calculated dynamically for sandbox
    const getSandboxACID = () => {
        const atomicity = (t1State === 'COMMITTED' || t1State === 'ABORTED') ? 'stable' : 'active';
        const consistency = (dbAlice === 1000 && !charlieCommitted) || (dbAlice === 1200) ? 'valid' : 'valid';
        const isolation = isoLevel === 'SZ' ? 'serializable' : isoLevel === 'RR' ? 'repeatable' : isoLevel === 'RC' ? 'committed' : 'uncommitted';
        const durability = t1State === 'COMMITTED' ? 'flushed' : 'pending';
        return { atomicity, consistency, isolation, durability };
    };

    const sbAcid = getSandboxACID();

    
    useSnapshot(useCallback((config, step) => {
        if (config.activeTab !== undefined) setActiveTab(config.activeTab);
        if (config.balanceA !== undefined) setBalanceA(config.balanceA);
        if (config.balanceB !== undefined) setBalanceB(config.balanceB);
        if (config.isoLevel !== undefined) setIsoLevel(config.isoLevel);
        if (config.t1State !== undefined) setT1State(config.t1State);
        if (config.t2State !== undefined) setT2State(config.t2State);
        if (config.dbAlice !== undefined) setDbAlice(config.dbAlice);
        if (config.bufferAlice !== undefined) setBufferAlice(config.bufferAlice);
        if (config.charlieInserted !== undefined) setCharlieInserted(config.charlieInserted);
        if (config.charlieCommitted !== undefined) setCharlieCommitted(config.charlieCommitted);
        if (config.locks !== undefined) setLocks(config.locks);

        setTimeout(() => {
            if (step !== undefined) setPipeStep(step);
            setIsRunning(false);
            setIsPaused(true);

        }, 50);
    }, []));

    return (
        <ImmersiveLayout
            isActive={true}
            snapshotData={{
                config: { activeTab, balanceA, balanceB, isoLevel, t1State, t2State, dbAlice, bufferAlice, charlieInserted, charlieCommitted, locks },
                step: pipeStep
            }}
            title="Database Transactions & ACID Sandbox" icon={<VaultIcon size={20} />} moduleLabel="DBMS Module"
            isRunning={isRunning} isPaused={isPaused} isFinished={isFinished}
            speed={speed} onSpeedChange={setSpeed}
            onStart={() => { setIsRunning(true); setIsFinished(false); }}
            onPause={() => setIsPaused(true)}
            onResume={() => setIsRunning(true)}
            onReset={activeTab === 'pipeline' ? handleResetPipeline : handleResetSandbox}
            onStep={activeTab === 'pipeline' ? executeNextPipelineStep : () => { }}
            currentStepNum={activeTab === 'pipeline' ? pipeStep : t1History.length + t2History.length}
            totalSteps={activeTab === 'pipeline' ? 4 : 20}
            phaseName={activeTab === 'pipeline' ? `ACID Pipeline Execution` : `Sandbox Level: ${isoLevel}`}
            centerContent={
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.8rem', background: 'var(--white)', padding: '0.8rem', overflowY: 'auto' }}>

                    {/* Tab Selectors */}
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '8px', border: '3.5px solid var(--border)', background: '#fafafa', padding: '4px', boxShadow: '3px 3px 0 var(--border)', flexShrink: 0, borderRadius: '6px' }}>
                        <button
                            onClick={() => { setActiveTab('pipeline'); handleResetPipeline(); }}
                            style={{
                                flex: 1, border: 'none', padding: '0.5rem', fontWeight: 900, cursor: 'pointer',
                                background: activeTab === 'pipeline' ? 'var(--yellow)' : 'transparent',
                                fontSize: '0.75rem', fontFamily: 'var(--font-mono)', borderRadius: '4px'
                            }}
                        >
                            {isMobile ? "Tab 1: ACID Pipeline" : "Tab 1: ACID Transaction Execution Pipeline"}
                        </button>
                        <button
                            onClick={() => { setActiveTab('sandbox'); handleResetSandbox(); }}
                            style={{
                                flex: 1, border: 'none', padding: '0.5rem', fontWeight: 900, cursor: 'pointer',
                                background: activeTab === 'sandbox' ? 'var(--cyan)' : 'transparent',
                                fontSize: '0.75rem', fontFamily: 'var(--font-mono)', borderRadius: '4px'
                            }}
                        >
                            {isMobile ? "Tab 2: Live Sandbox" : "Tab 2: Live Concurrency Isolation Sandbox"}
                        </button>
                    </div>

                    {activeTab === 'pipeline' ? (
                        /* ─── TAB 1: ACID PIPELINE SANDBOX ─── */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1 }}>

                            {/* Visual Engine Status Banner */}
                            <div style={{ border: '3px solid var(--border)', background: isCrashed ? 'rgba(255,107,157,0.1)' : 'rgba(255,221,0,0.06)', padding: '0.6rem 0.8rem', fontSize: '0.75rem', fontWeight: 900, lineHeight: 1.4, flexShrink: 0, borderRadius: '6px' }}>
                                {pipeStep === 0 && !isCrashed && !recoveryDone && "SANDBOX START: Click the STEP button in the top-right control bar to execute the Client A $300 balance transfer step-by-step. Or trigger a hardware crash midway to test consistency!"}
                                {pipeStep === 1 && "STEP 1: TRANSACTION BEGIN. shared lockers lock vaults. Starting balance state recorded."}
                                {pipeStep === 2 && !isCrashed && "STEP 2: DEBIT ALICE. Alice balance decremented to $700. Bob has not been credited. If system crashes now, consistency is broken! (Click 'Simulate Pipeline CRASH' to test!)"}
                                {pipeStep === 3 && !isCrashed && "STEP 3: CREDIT BOB. Bob updated to $800 in buffer, but uncommitted. WAL log is pending disk flush."}
                                {pipeStep === 4 && "STEP 4: TRANSACTION COMMIT. Log buffer flushed to disk (Durability). Vault locks released. Transfer is 100% complete and safe!"}
                                {isCrashed && "PIPELINE CRASHED midway! Alice: $700, Bob: $500. $300 vanished. Asset consistency compromised. Click 'RUN ROLLBACK RECOVERY' below to restore vaults!"}
                                {recoveryDone && !isCrashed && "RECOVERY SUCCESSFUL! The WAL recovery engine rolled back intermediate uncommitted logs. Balances reverted to original $1000/$500."}
                            </div>

                            {/* Main Stage Grid */}
                            <div style={{
                                flex: 1,
                                border: '3.5px solid var(--border)',
                                background: '#0f172a',
                                position: 'relative',
                                minHeight: isMobile ? 320 : 220,
                                display: 'flex',
                                flexDirection: isMobile ? 'column' : 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: isMobile ? '1.5rem 0.5rem' : '0 2.5rem',
                                overflow: 'hidden',
                                boxShadow: '4px 4px 0 var(--border)',
                                borderRadius: '6px'
                            }}>

                                {isCrashed && (
                                    <div style={{ position: 'absolute', inset: 0, opacity: 0.15, background: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 10px, #000 10px, #000 20px)' }} />
                                )}

                                {/* Alice vault */}
                                <div style={{ border: '3px solid var(--border)', background: 'var(--white)', padding: '0.6rem', minWidth: 130, zIndex: 10, textAlign: 'center', boxShadow: '3px 3px 0 var(--border)', borderRadius: '6px' }}>
                                    <div style={{ fontSize: '1.25rem', marginBottom: 2, display: 'flex', justifyContent: 'center' }}><LaptopIcon size={24} /></div>
                                    <div style={{ fontSize: '0.62rem', fontWeight: 900, opacity: 0.5 }}>CLIENT A (ALICE)</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, fontFamily: 'var(--font-mono)', margin: '4px 0' }}>${balanceA}</div>
                                    {renderBalanceCoins(balanceA)}
                                </div>

                                {/* Flow Connection Pipe */}
                                <div style={{
                                    flex: isMobile ? 'none' : 1,
                                    height: isMobile ? 40 : 16,
                                    width: isMobile ? 16 : 'auto',
                                    background: isCrashed ? '#ef4444' : 'rgba(255,255,255,0.08)',
                                    position: 'relative',
                                    margin: isMobile ? '0.5rem 0' : '0 1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <div style={{
                                        position: 'absolute', inset: 0,
                                        borderLeft: isMobile ? '3.5px solid var(--border)' : 'none',
                                        borderRight: isMobile ? '3.5px solid var(--border)' : 'none',
                                        borderTop: isMobile ? 'none' : '3.5px solid var(--border)',
                                        borderBottom: isMobile ? 'none' : '3.5px solid var(--border)',
                                    }} />

                                    <AnimatePresence>
                                        {pipeStep > 0 && pipeStep < 4 && !isCrashed && (
                                            <motion.div
                                                initial={isMobile ? { top: '0%', left: '50%', x: '-50%' } : { left: '0%', top: '50%', y: '-50%' }}
                                                animate={isMobile ? {
                                                    top: pipeStep === 1 ? '10%' : pipeStep === 2 ? '50%' : '90%',
                                                    scale: pipeStep === 2 ? 1.25 : 1
                                                } : {
                                                    left: pipeStep === 1 ? '10%' : pipeStep === 2 ? '50%' : '90%',
                                                    scale: pipeStep === 2 ? 1.25 : 1
                                                }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.4, type: 'spring' }}
                                                style={{
                                                    position: 'absolute',
                                                    width: 36, height: 36,
                                                    background: 'var(--yellow)', border: '2.5px solid var(--border)', borderRadius: '50%',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.65rem',
                                                    boxShadow: '0 0 10px var(--yellow)', zIndex: 5,
                                                    top: isMobile ? undefined : '50%',
                                                    left: isMobile ? '50%' : undefined,
                                                    transform: isMobile ? 'translateX(-50%)' : 'translateY(-50%)',
                                                }}
                                            >
                                                $300
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {isCrashed && (
                                        <motion.div
                                            animate={{ scale: [1, 1.3, 1.2] }}
                                            style={{
                                                position: 'absolute',
                                                left: isMobile ? '50%' : '46%',
                                                top: isMobile ? '46%' : '50%',
                                                transform: isMobile ? 'translate(-50%, -50%)' : 'translateY(-50%)',
                                                zIndex: 10
                                            }}
                                        >
                                            <AlertIcon size={28} color="#ef4444" />
                                        </motion.div>
                                    )}
                                </div>

                                {/* Bob vault */}
                                <div style={{ border: '3px solid var(--border)', background: 'var(--white)', padding: '0.6rem', minWidth: 130, zIndex: 10, textAlign: 'center', boxShadow: '3px 3px 0 var(--border)', borderRadius: '6px' }}>
                                    <div style={{ fontSize: '1.25rem', marginBottom: 2, display: 'flex', justifyContent: 'center' }}><LaptopIcon size={24} /></div>
                                    <div style={{ fontSize: '0.62rem', fontWeight: 900, opacity: 0.5 }}>CLIENT B (BOB)</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, fontFamily: 'var(--font-mono)', margin: '4px 0' }}>${balanceB}</div>
                                    {renderBalanceCoins(balanceB)}
                                </div>
                            </div>

                            {/* Crash & Recovery trigger buttons */}
                            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.5rem', flexShrink: 0 }}>
                                <button
                                    onClick={triggerCrash}
                                    disabled={pipeStep < 2 || pipeStep > 3 || isCrashed}
                                    style={{
                                        flex: 1, padding: '8px', fontWeight: 900, border: '3px solid var(--border)',
                                        background: 'var(--pink)', boxShadow: '3px 3px 0 var(--border)', cursor: pipeStep >= 2 && pipeStep <= 3 && !isCrashed ? 'pointer' : 'not-allowed',
                                        fontSize: '0.75rem', opacity: pipeStep >= 2 && pipeStep <= 3 && !isCrashed ? 1 : 0.4,
                                        borderRadius: '6px'
                                    }}
                                >
                                    Simulate Pipeline CRASH Midway
                                </button>
                                <button
                                    onClick={triggerRollback}
                                    disabled={!isCrashed}
                                    style={{
                                        flex: 1, padding: '8px', fontWeight: 900, border: '3px solid var(--border)',
                                        background: 'var(--green)', boxShadow: '3px 3px 0 var(--border)', cursor: isCrashed ? 'pointer' : 'not-allowed',
                                        fontSize: '0.75rem', opacity: isCrashed ? 1 : 0.4,
                                        borderRadius: '6px'
                                    }}
                                >
                                    Run ROLLBACK Recovery (Undo Crash)
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* ─── TAB 2: LIVE ISOLATION LEVEL CONCURRENCY SANDBOX (USER INVOLVEMENT PLAYGROUND) ─── */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1, position: 'relative' }}>

                            {/* ANOMALY ALERT FLOAT DOWN MODAL */}
                            <AnimatePresence>
                                {anomalyAlert.type && (
                                    <motion.div
                                        initial={{ top: -100, opacity: 0 }}
                                        animate={{ top: 0, opacity: 1 }}
                                        exit={{ top: -100, opacity: 0 }}
                                        style={{
                                            position: 'absolute', left: 0, right: 0, zIndex: 100,
                                            background: '#ffe4e6', border: '3.5px solid red', borderRadius: '8px',
                                            padding: '0.8rem', boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                                            color: '#b91c1c'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <h4 style={{ fontWeight: 900, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: 4 }}>CONCURRENCY ANOMALY DETECTED!</h4>
                                                <p style={{ fontSize: '0.7rem', fontWeight: 700, lineHeight: 1.45 }}>{anomalyAlert.msg}</p>
                                            </div>
                                            <button
                                                onClick={() => setAnomalyAlert({ type: null, msg: null })}
                                                style={{ background: 'red', color: 'white', border: '2px solid var(--border)', padding: '2px 6px', fontWeight: 900, cursor: 'pointer', borderRadius: '4px' }}
                                            >
                                                Dismiss
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Active Isolation Level Selector Bar */}
                            <div className="isolation-selector-bar" style={{
                                display: 'flex',
                                flexDirection: isMobile ? 'column' : 'row',
                                alignItems: isMobile ? 'stretch' : 'center',
                                gap: isMobile ? '8px' : '6px',
                                border: '3px solid var(--border)',
                                background: '#fafafa',
                                padding: isMobile ? '8px 10px' : '6px 10px',
                                boxShadow: '3px 3px 0 var(--border)',
                                flexShrink: 0,
                                borderRadius: '6px',
                                justifyContent: 'space-between'
                            }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 900 }}>Database Isolation Level:</span>
                                <div className="isolation-buttons" style={{ display: 'flex', gap: '4px', width: isMobile ? '100%' : 'auto' }}>
                                    {[
                                        { code: 'RU', label: isMobile ? 'RU' : 'READ UNCOMMITTED', color: 'var(--pink)' },
                                        { code: 'RC', label: isMobile ? 'RC' : 'READ COMMITTED', color: 'var(--yellow)' },
                                        { code: 'RR', label: isMobile ? 'RR' : 'REPEATABLE READ', color: 'var(--cyan)' },
                                        { code: 'SZ', label: isMobile ? 'SZ' : 'SERIALIZABLE', color: 'var(--green)' }
                                    ].map(item => (
                                        <button
                                            key={item.code}
                                            onClick={() => { setIsoLevel(item.code); handleResetSandbox(); }}
                                            style={{
                                                flex: isMobile ? 1 : 'none',
                                                fontSize: '0.62rem', fontWeight: 900, padding: '4px 8px', border: '2px solid var(--border)',
                                                borderRadius: '4px', cursor: 'pointer',
                                                background: isoLevel === item.code ? item.color : 'white',
                                                boxShadow: isoLevel === item.code ? '1.5px 1.5px 0 var(--border)' : 'none'
                                            }}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Main Split Sandbox Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.25fr 1fr', gap: '0.8rem', flex: 1, minHeight: 280 }}>

                                {/* T1 & T2 Parallel Client Connection Columns */}
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.6rem' }}>

                                    {/* Transaction Client Thread 1 (T1) */}
                                    <div style={{ border: '3px solid var(--border)', background: '#f8fafc', padding: '0.6rem', borderRadius: '6px', boxShadow: '3px 3px 0 var(--border)', display: 'flex', flexDirection: 'column', gap: '0.4rem', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: -10, left: 10, background: 'var(--yellow)', border: '1.5px solid var(--border)', fontSize: '0.58rem', fontWeight: 900, padding: '1px 5px', borderRadius: '3px' }}>
                                            CLIENT THREAD 1 (T1)
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px' }}>
                                            <span style={{ fontSize: '0.58rem', fontWeight: 900, opacity: 0.5 }}>STATE:</span>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'blue' }}>{t1State}</span>
                                        </div>

                                        {/* Action buttons (T1 Control panel) */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '0.2rem' }}>
                                            <button
                                                className="btn btn-sm btn-green"
                                                onClick={handleT1Begin}
                                                disabled={t1State !== 'IDLE' || blockedQuery.thread === 'T1'}
                                                style={{ fontSize: '0.62rem', fontWeight: 800, padding: '4px' }}
                                            >
                                                Begin T1
                                            </button>
                                            <button
                                                className="btn btn-sm btn-yellow"
                                                onClick={handleT1UpdateAlice}
                                                disabled={t1State !== 'ACTIVE' || blockedQuery.thread === 'T1'}
                                                style={{ fontSize: '0.62rem', fontWeight: 800, padding: '4px' }}
                                            >
                                                UPDATE Alice = $1200
                                            </button>
                                            <button
                                                className="btn btn-sm btn-cyan"
                                                onClick={handleT1InsertCharlie}
                                                disabled={t1State !== 'ACTIVE' || charlieInserted || blockedQuery.thread === 'T1'}
                                                style={{ fontSize: '0.62rem', fontWeight: 800, padding: '4px' }}
                                            >
                                                INSERT Charlie = $800
                                            </button>
                                            <button
                                                className="btn btn-sm btn-pink"
                                                onClick={handleT1Commit}
                                                disabled={t1State !== 'ACTIVE' || blockedQuery.thread === 'T1'}
                                                style={{ fontSize: '0.62rem', fontWeight: 800, padding: '4px' }}
                                            >
                                                COMMIT T1
                                            </button>
                                            <button
                                                className="btn btn-sm btn-pink"
                                                onClick={handleT1Rollback}
                                                disabled={t1State !== 'ACTIVE' || blockedQuery.thread === 'T1'}
                                                style={{ fontSize: '0.62rem', fontWeight: 800, padding: '4px', background: '#ef4444', color: 'white' }}
                                            >
                                                ROLLBACK T1
                                            </button>
                                        </div>

                                        {/* Execution buffer log for T1 */}
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                                            <span style={{ fontSize: '0.55rem', fontWeight: 900, opacity: 0.5 }}>T1 QUERY HISTORY:</span>
                                            <div style={{ flex: 1, background: '#0f172a', color: '#38bdf8', padding: '6px', borderRadius: '4px', fontSize: '0.62rem', fontFamily: 'var(--font-mono)', overflowY: 'auto', border: '1.5px solid var(--border)' }}>
                                                {t1History.map((h, i) => <div key={i} style={{ color: h.includes('[BLOCKED]') ? '#fbbf24' : '#38bdf8' }}>&gt; {h}</div>)}
                                                {blockedQuery.thread === 'T1' && (
                                                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} style={{ color: '#ef4444', fontWeight: 900, marginTop: 4 }}>
                                                        BLOCKED: WAITING ON LOCK...
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Transaction Client Thread 2 (T2) */}
                                    <div style={{ border: '3px solid var(--border)', background: '#f8fafc', padding: '0.6rem', borderRadius: '6px', boxShadow: '3px 3px 0 var(--border)', display: 'flex', flexDirection: 'column', gap: '0.4rem', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: -10, left: 10, background: 'var(--pink)', border: '1.5px solid var(--border)', fontSize: '0.58rem', fontWeight: 900, padding: '1px 5px', borderRadius: '3px' }}>
                                            CLIENT THREAD 2 (T2)
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px' }}>
                                            <span style={{ fontSize: '0.58rem', fontWeight: 900, opacity: 0.5 }}>STATE:</span>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'blue' }}>{t2State}</span>
                                        </div>

                                        {/* Action buttons (T2 Control panel) */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '0.2rem' }}>
                                            <button
                                                className="btn btn-sm btn-green"
                                                onClick={handleT2Begin}
                                                disabled={t2State !== 'IDLE' || blockedQuery.thread === 'T2'}
                                                style={{ fontSize: '0.62rem', fontWeight: 800, padding: '4px' }}
                                            >
                                                Begin T2
                                            </button>
                                            <button
                                                className="btn btn-sm btn-yellow"
                                                onClick={handleT2SelectAlice}
                                                disabled={t2State !== 'ACTIVE' || blockedQuery.thread === 'T2'}
                                                style={{ fontSize: '0.62rem', fontWeight: 800, padding: '4px' }}
                                            >
                                                SELECT Alice Balance
                                            </button>
                                            <button
                                                className="btn btn-sm btn-cyan"
                                                onClick={handleT2RangeScan}
                                                disabled={t2State !== 'ACTIVE' || blockedQuery.thread === 'T2'}
                                                style={{ fontSize: '0.62rem', fontWeight: 800, padding: '4px' }}
                                            >
                                                SCAN range &gt; $600
                                            </button>
                                            <button
                                                className="btn btn-sm btn-pink"
                                                onClick={handleT2Commit}
                                                disabled={t2State !== 'ACTIVE' || blockedQuery.thread === 'T2'}
                                                style={{ fontSize: '0.62rem', fontWeight: 800, padding: '4px' }}
                                            >
                                                COMMIT T2
                                            </button>
                                            <button
                                                className="btn btn-sm btn-pink"
                                                onClick={handleT2Rollback}
                                                disabled={t2State !== 'ACTIVE' || blockedQuery.thread === 'T2'}
                                                style={{ fontSize: '0.62rem', fontWeight: 800, padding: '4px', background: '#ef4444', color: 'white' }}
                                            >
                                                ROLLBACK T2
                                            </button>
                                        </div>

                                        {/* Execution buffer log for T2 */}
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                                            <span style={{ fontSize: '0.55rem', fontWeight: 900, opacity: 0.5 }}>T2 QUERY HISTORY:</span>
                                            <div style={{ flex: 1, background: '#0f172a', color: '#f472b6', padding: '6px', borderRadius: '4px', fontSize: '0.62rem', fontFamily: 'var(--font-mono)', overflowY: 'auto', border: '1.5px solid var(--border)' }}>
                                                {t2History.map((h, i) => <div key={i} style={{ color: h.includes('[BLOCKED]') ? '#fbbf24' : '#f472b6' }}>&gt; {h}</div>)}
                                                {blockedQuery.thread === 'T2' && (
                                                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} style={{ color: '#ef4444', fontWeight: 900, marginTop: 4 }}>
                                                        BLOCKED: WAITING ON LOCK...
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Shared Database state, Locks Manager & Table values */}
                                <div style={{ border: '3.5px solid var(--border)', background: '#fafafa', padding: '0.6rem', borderRadius: '6px', boxShadow: '3px 3px 0 var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ borderBottom: '2.5px solid var(--border)', paddingBottom: '3px', fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', color: 'blue' }}>
                                        DATABASE SHARED LOCK MANAGER
                                    </div>

                                    {/* Physical Table View */}
                                    <div style={{ border: '2.5px solid var(--border)', background: 'white', borderRadius: '4px', overflow: 'hidden', boxShadow: '2px 2px 0 var(--border)', width: '100%' }}>
                                        <div style={{ background: '#e2e8f0', borderBottom: '2px solid var(--border)', padding: '3px 8px', fontSize: '0.58rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>TABLE: Accounts (Shared Disk)</div>
                                        <div style={{ overflowX: 'auto', width: '100%' }}>
                                            <table style={{ width: '100%', minWidth: isMobile ? '460px' : 'auto', fontSize: '0.65rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                                                <thead>
                                                    <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid var(--border)' }}>
                                                        <th style={{ padding: '4px 6px' }}>User</th>
                                                        <th style={{ padding: '4px 6px' }}>Committed Balance</th>
                                                        <th style={{ padding: '4px 6px' }}>Buffer Value</th>
                                                        <th style={{ padding: '4px 6px' }}>Active Lock State</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {/* Alice Row */}
                                                    <tr>
                                                        <td style={{ padding: '4px 6px', fontWeight: 800 }}>Alice</td>
                                                        <td style={{ padding: '4px 6px', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>${dbAlice}</td>
                                                        <td style={{ padding: '4px 6px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: bufferAlice !== dbAlice ? 'orange' : 'inherit' }}>
                                                            ${bufferAlice}
                                                        </td>
                                                        <td style={{ padding: '4px 6px', fontWeight: 900 }}>
                                                            {locks.Alice.type === 'X' && <span style={{ color: 'red', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><LockIcon size={12} color="red" /> Exclusive (X) lock by T1</span>}
                                                            {locks.Alice.type === 'S' && <span style={{ color: 'green', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><LockIcon size={12} color="green" /> Shared (S) lock by T2</span>}
                                                            {!locks.Alice.type && <span style={{ color: '#888', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><UnlockIcon size={12} /> Unlocked</span>}
                                                        </td>
                                                    </tr>

                                                    {/* Bob Row */}
                                                    <tr>
                                                        <td style={{ padding: '4px 6px', fontWeight: 800 }}>Bob</td>
                                                        <td style={{ padding: '4px 6px', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>$500</td>
                                                        <td style={{ padding: '4px 6px', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>$500</td>
                                                        <td style={{ padding: '4px 6px', fontWeight: 900, color: '#888', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><UnlockIcon size={12} /> Unlocked</td>
                                                    </tr>

                                                    {/* Charlie Ghost Row */}
                                                    {charlieInserted && (
                                                        <tr style={{ background: charlieCommitted ? '#d1fae5' : '#ffe4e6', borderTop: '1px solid #e2e8f0' }}>
                                                            <td style={{ padding: '4px 6px', fontWeight: 800 }}>Charlie {charlieCommitted ? '' : '(Ghost)'}</td>
                                                            <td style={{ padding: '4px 6px', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{charlieCommitted ? '$800' : 'N/A (Uncommitted)'}</td>
                                                            <td style={{ padding: '4px 6px', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>$800</td>
                                                            <td style={{ padding: '4px 6px', fontWeight: 900 }}>
                                                                {locks.Charlie.type === 'X' && <span style={{ color: 'red', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><LockIcon size={12} color="red" /> Exclusive (X) lock by T1</span>}
                                                                {locks.Charlie.type === 'S' && <span style={{ color: 'green', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><LockIcon size={12} color="green" /> Shared (S) lock by T2</span>}
                                                                {!locks.Charlie.type && <span style={{ color: '#888', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><UnlockIcon size={12} /> Unlocked</span>}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Action description banner */}
                                    <div style={{ flex: 1, border: '2px dashed var(--border)', padding: '6px 8px', fontSize: '0.65rem', fontWeight: 700, borderRadius: '4px', background: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <span><strong>SANDBOX ADVICE:</strong></span>
                                        <span style={{ opacity: 0.8, marginTop: 2 }}>
                                            {isoLevel === 'RU' && "Read Uncommitted uses no S-locks! T2 Selects Alice directly, even if T1 has an active uncommitted X-lock. Try Updating Alice in T1, and selecting Alice in T2 to see a DIRTY READ anomaly!"}
                                            {isoLevel === 'RC' && "Read Committed acquires S-locks but releases them immediately after read. T2 will block if T1 holds an active write lock. Alice changes can still mutate between T2 reads (Non-Repeatable reads can occur!)."}
                                            {isoLevel === 'RR' && "Repeatable Read holds S-locks until transaction complete. If T2 selects Alice, T1's updates on Alice are completely BLOCKED, securing Repeatable Reads! Charlie can still insert a Phantom row."}
                                            {isoLevel === 'SZ' && "Serializable locks entire key ranges. T2 scan locks the table range. T1 is completely BLOCKED from inserting Charlie. All anomalies fully blocked, enforcing absolute execution order!"}
                                        </span>
                                    </div>

                                    <button
                                        onClick={handleResetSandbox}
                                        style={{ width: '100%', padding: '6px', fontWeight: 900, border: '2px solid var(--border)', background: 'var(--pink)', boxShadow: '2px 2px 0 var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem' }}
                                    >
                                        Reset Connection Sandbox
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            }
            leftContent={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>ACID Database State Radar</div>

                    {/* ACID meters */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                        <div style={{ border: '2.5px solid var(--border)', padding: '0.35rem', textAlign: 'center', background: (activeTab === 'pipeline' ? acid.atomicity === 'saved' : sbAcid.atomicity === 'stable') ? 'var(--green)' : (activeTab === 'pipeline' ? acid.atomicity === 'broken' : 'transparent') ? 'var(--pink)' : '#eee', borderRadius: '4px' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 900 }}>[ A ]</div>
                            <span style={{ fontSize: '0.52rem', fontWeight: 800 }}>Atomicity</span>
                            <div style={{ fontSize: '0.5rem', opacity: 0.6 }}>
                                {activeTab === 'pipeline'
                                    ? (acid.atomicity === 'saved' ? '✓ Saved' : acid.atomicity === 'broken' ? 'Aborted' : 'Pending')
                                    : (sbAcid.atomicity === 'stable' ? '✓ Stable' : 'Active')}
                            </div>
                        </div>
                        <div style={{ border: '2.5px solid var(--border)', padding: '0.35rem', textAlign: 'center', background: (activeTab === 'pipeline' ? acid.consistency === 'safe' : sbAcid.consistency === 'valid') ? 'var(--green)' : 'var(--pink)', borderRadius: '4px' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 900 }}>[ C ]</div>
                            <span style={{ fontSize: '0.52rem', fontWeight: 800 }}>Consistency</span>
                            <div style={{ fontSize: '0.5rem', opacity: 0.6 }}>
                                {activeTab === 'pipeline'
                                    ? (acid.consistency === 'safe' ? '✓ Safe $1500' : 'Leaked $1200')
                                    : '✓ Asset Valid'}
                            </div>
                        </div>
                        <div style={{ border: '2.5px solid var(--border)', padding: '0.35rem', textAlign: 'center', background: (activeTab === 'pipeline' ? acid.isolation === 'shielded' : sbAcid.isolation !== 'uncommitted') ? 'var(--green)' : '#eee', borderRadius: '4px' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 900 }}>[ I ]</div>
                            <span style={{ fontSize: '0.52rem', fontWeight: 800 }}>Isolation</span>
                            <div style={{ fontSize: '0.5rem', opacity: 0.6 }}>
                                {activeTab === 'pipeline'
                                    ? (acid.isolation === 'shielded' ? 'Shielded' : 'Normal')
                                    : `🛡️ ${isoLevel}`}
                            </div>
                        </div>
                        <div style={{ border: '2.5px solid var(--border)', padding: '0.35rem', textAlign: 'center', background: (activeTab === 'pipeline' ? acid.durability === 'saved' : sbAcid.durability === 'flushed') ? 'var(--green)' : '#eee', borderRadius: '4px' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 900 }}>[ D ]</div>
                            <span style={{ fontSize: '0.52rem', fontWeight: 800 }}>Durability</span>
                            <div style={{ fontSize: '0.5rem', opacity: 0.6 }}>
                                {activeTab === 'pipeline'
                                    ? (acid.durability === 'saved' ? 'Saved WAL' : 'Pending')
                                    : (sbAcid.durability === 'flushed' ? 'Disk WAL' : 'Pending')}
                            </div>
                        </div>
                    </div>

                    <div style={{ height: 2, background: 'var(--border)' }} />

                    <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>Database WAL Ledger</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.72rem', fontWeight: 800 }}>
                        <div style={{ border: '2px solid var(--border)', padding: '4px', display: 'flex', justifyContent: 'space-between', background: 'var(--yellow)', borderRadius: '4px' }}>
                            <span>Total Asset Registry:</span>
                            <span>${activeTab === 'pipeline' ? (balanceA + balanceB) : (dbAlice + 500 + (charlieInserted ? 800 : 0))}</span>
                        </div>
                        <div style={{ border: '2px solid var(--border)', padding: '4px', display: 'flex', justifyContent: 'space-between', background: 'var(--pink)', borderRadius: '4px' }}>
                            <span>WAL Buffers logged:</span>
                            <span>{activeTab === 'pipeline' ? logs.length : t1History.length + t2History.length}</span>
                        </div>
                    </div>
                </div>
            }
            rightContent={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ border: '2px solid var(--border)', background: 'var(--yellow)', padding: '0.4rem 0.6rem', boxShadow: '2px 2px 0 var(--border)', borderRadius: '4px' }}>
                        <div style={{ fontSize: '0.55rem', fontWeight: 900, opacity: 0.6 }}>LEARNING ZONE</div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                            {activeTab === 'pipeline' ? 'ACID PROPERTIES' : 'ISOLATION LEVEL BUGS'}
                        </div>
                    </div>

                    <div style={{ border: '2px solid var(--border)', background: 'var(--white)', padding: '0.6rem', boxShadow: '2px 2px 0 var(--border)', borderRadius: '6px' }}>
                        <p style={{ fontSize: '0.7rem', opacity: 0.8, lineHeight: 1.45 }}>
                            {activeTab === 'pipeline' ? (
                                "A transaction is a single logical unit of database work. To keep your storage reliable, every transaction must obey ACID rules: modifications commit successfully (Atomicity) or get completely rolled back, preventing intermediate asset leakages (Consistency)."
                            ) : (
                                "When multiple users query the database concurrently, the engine must isolate transactions. Low isolation speeds up the database but exposes anomalies (Dirty reads, Phantom rows) where transactions read dirty uncommitted values."
                            )}
                        </p>
                    </div>

                    <div style={{ height: 2, background: 'var(--border)' }} />

                    {/* Scrolling logger ledger (Tab 1 specific) */}
                    {activeTab === 'pipeline' && (
                        <div className="panel" style={{ boxShadow: '3px 3px 0 var(--border)', flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '6px', overflow: 'hidden' }}>
                            <div className="panel-header" style={{ background: 'var(--pink)', fontSize: '0.72rem', padding: '4px 10px' }}>
                                Write-Ahead Log (WAL)
                            </div>
                            <div style={{ padding: '0.5rem', background: '#0f172a', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', flex: 1, overflowY: 'auto', maxH: 140 }}>
                                {logs.map((log, idx) => (
                                    <div key={idx} style={{ textDecoration: log.includes('~~') ? 'line-through' : 'none', opacity: log.includes('~~') ? 0.5 : 1 }}>
                                        &gt; {log}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            }
            timelineItems={activeTab === 'pipeline' ? [
                { id: 0, label: 'BEGIN T1', done: pipeStep > 0, active: pipeStep === 0 },
                { id: 1, label: 'DEBIT A', done: pipeStep > 1, active: pipeStep === 1 },
                { id: 2, label: 'WAL TRANSIT', done: pipeStep > 2, active: pipeStep === 2 },
                { id: 3, label: 'CREDIT B', done: pipeStep > 3, active: pipeStep === 3 },
                { id: 4, label: 'COMMIT T1', done: pipeStep === 4, active: pipeStep === 4 }
            ] : [
                { id: 0, label: 'RU: Test Dirty', done: t2History.some(h => h.includes('Returns $1200')), active: isoLevel === 'RU' },
                { id: 1, label: 'RC: Test Locks', done: t2History.some(h => h.includes('SELECT Alice')) && t1State === 'COMMITTED', active: isoLevel === 'RC' },
                { id: 2, label: 'RR: Repeat Read', done: t2ReadCount >= 2, active: isoLevel === 'RR' },
                { id: 3, label: 'SZ: Serialized', done: t2ScanCount >= 2 && charlieInserted, active: isoLevel === 'SZ' }
            ]}
            legend={[
                { color: 'var(--yellow)', label: 'Uncommitted / Active' },
                { color: 'var(--cyan)', label: 'Shared Read lock' },
                { color: 'var(--pink)', label: 'Exclusive Write lock / Crash' },
                { color: 'var(--green)', label: 'Committed / Shielded' }
            ]}
        >
            <div className="main-content">
                <Link to="/dbms">← Return to DBMS Landing</Link>
            </div>
        </ImmersiveLayout>
    );
}
