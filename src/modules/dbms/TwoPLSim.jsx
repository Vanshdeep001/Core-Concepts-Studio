import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';

// ── S/X lock compatibility ──
const S = 'S', X = 'X';
function compatible(held, req) { return held === S && req === S; }

function buildSteps(transactions) {
    const steps = [];
    const lockTable = {};
    const txnStatus = {};
    const waiting = {};
    transactions.forEach(t => { txnStatus[t.id] = 'running'; });

    const opQueue = [];
    transactions.forEach(t => t.ops.forEach((op, oi) => opQueue.push({ txn: t.id, op, oi })));

    for (const { txn, op } of opQueue) {
        if (txnStatus[txn] === 'aborted') continue;
        const item = op.item;
        const reqType = op.type === 'W' ? X : S;
        const held = lockTable[item];

        if (!held || held.holder === txn) {
            if (!held) lockTable[item] = { holder: txn, type: reqType };
            else if (reqType === X) lockTable[item].type = X;

            steps.push({
                phase: `T${txn}: ${op.type}(${item}) — GRANTED`,
                type: 'grant', txn, op, item, lockType: reqType,
                lockTable: JSON.parse(JSON.stringify(lockTable)),
                txnStatus: { ...txnStatus },
                explanation: `Transaction T${txn} requested a ${reqType} lock on ${item}. No conflict exists, so the lock is granted immediately.`,
                insight: reqType === S ? 'Shared (S) locks are compatible with other S locks — multiple readers can coexist.' : 'Exclusive (X) locks block all other transactions. Required for write operations.',
                insightTitle: `${reqType === S ? 'Shared' : 'Exclusive'} Lock`,
            });
        } else if (!compatible(held.type, reqType)) {
            waiting[txn] = { item, type: reqType, blockedBy: held.holder };
            let deadlock = false;
            let cur = held.holder;
            const seen = new Set([txn]);
            while (waiting[cur]) {
                if (seen.has(cur)) { deadlock = true; break; }
                seen.add(cur); cur = waiting[cur]?.blockedBy;
            }

            if (deadlock) {
                txnStatus[txn] = 'aborted';
                Object.keys(lockTable).forEach(k => { if (lockTable[k].holder === txn) delete lockTable[k]; });
                steps.push({
                    phase: `🚨 DEADLOCK — T${txn} aborted`,
                    type: 'deadlock', txn, item, lockType: reqType,
                    lockTable: JSON.parse(JSON.stringify(lockTable)), txnStatus: { ...txnStatus },
                    explanation: `T${txn} and T${held.holder} are waiting for each other's locks — circular wait = DEADLOCK. T${txn} is rolled back.`,
                    insight: 'Deadlock = circular wait: T1 waits for T2, T2 waits for T1. Resolution: abort one transaction (victim selection).',
                    insightTitle: '🚨 Deadlock Detection',
                });
                delete waiting[txn];
            } else {
                txnStatus[txn] = 'waiting';
                steps.push({
                    phase: `T${txn}: ${op.type}(${item}) — BLOCKED`,
                    type: 'block', txn, op, item, lockType: reqType, blockedBy: held.holder,
                    lockTable: JSON.parse(JSON.stringify(lockTable)), txnStatus: { ...txnStatus },
                    explanation: `T${txn} wants ${reqType} lock on ${item}, but T${held.holder} holds ${held.type} lock. T${txn} must wait.`,
                    insight: `${held.type}/${reqType} conflict: ${held.type === X ? 'Writer blocks everyone' : 'Reader blocks writers'}. One must wait.`,
                    insightTitle: 'Lock Conflict',
                });
            }
        }
    }

    transactions.forEach(t => {
        if (txnStatus[t.id] !== 'aborted') {
            txnStatus[t.id] = 'committed';
            Object.keys(lockTable).forEach(k => { if (lockTable[k]?.holder === t.id) delete lockTable[k]; });
            steps.push({
                phase: `T${t.id} COMMITTED`,
                type: 'commit', txn: t.id,
                lockTable: JSON.parse(JSON.stringify(lockTable)), txnStatus: { ...txnStatus },
                explanation: `T${t.id} completes all operations and commits. All its locks are released, unblocking waiting transactions.`,
                insight: '2PL Phase 2 (Shrinking): after commit, all locks are released atomically. No new locks can be acquired.',
                insightTitle: '2PL: Shrinking Phase',
            });
        }
    });

    return steps;
}

const DEFAULT_TRANSACTIONS = [
    { id: 1, ops: [{ type: 'R', item: 'X' }, { type: 'W', item: 'Y' }] },
    { id: 2, ops: [{ type: 'W', item: 'X' }, { type: 'R', item: 'Y' }] },
];
const TXN_COLORS = ['var(--yellow)', 'var(--cyan)', 'var(--pink)', 'var(--green)'];

export default function TwoPLSim() {
    const [transactions, setTransactions] = useState(DEFAULT_TRANSACTIONS);
    const [speed, setSpeed] = useState(800);
    const [steps, setSteps] = useState([]);
    const [currentStep, setCurrentStep] = useState(-1);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [isSimMode, setIsSimMode] = useState(false);

    const timerRef = useRef(null);
    const stepRef = useRef(-1);
    const stepsRef = useRef([]);

    const advanceStep = useCallback((stepsArr, idx) => {
        const newIdx = idx + 1;
        if (newIdx >= stepsArr.length) { setCurrentStep(newIdx - 1); setIsRunning(false); setIsFinished(true); clearInterval(timerRef.current); return; }
        setCurrentStep(newIdx); stepRef.current = newIdx;
    }, []);

    const handleStart = () => {
        const s = buildSteps(transactions);
        stepsRef.current = s; setSteps(s);
        setCurrentStep(-1); stepRef.current = -1;
        setIsRunning(true); setIsPaused(false); setIsFinished(false); setIsSimMode(true);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => advanceStep(stepsRef.current, stepRef.current), speed);
    };
    const handlePause = () => { setIsRunning(false); setIsPaused(true); clearInterval(timerRef.current); };
    const handleResume = () => { setIsRunning(true); setIsPaused(false); timerRef.current = setInterval(() => advanceStep(stepsRef.current, stepRef.current), speed); };
    const handleReset = () => { clearInterval(timerRef.current); setSteps([]); stepsRef.current = []; setCurrentStep(-1); stepRef.current = -1; setIsRunning(false); setIsPaused(false); setIsFinished(false); setIsSimMode(false); };
    const handleStep = () => { setIsSimMode(true); advanceStep(stepsRef.current, stepRef.current); };

    const curStep = currentStep >= 0 ? steps[currentStep] : null;
    const lockTable = curStep?.lockTable ?? {};
    const txnStatus = curStep?.txnStatus ?? {};

    const CENTER = (
        <div style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '1.2rem', overflow: 'hidden' }}>
            {/* 2PL Global Lock Table */}
            <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.8rem', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between' }}>
                    <span>DATABASE LOCK TABLE</span>
                    <span>{Object.keys(lockTable).length} LOCKS ACTIVE</span>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                    {['X', 'Y', 'Z'].map(item => {
                        const lock = lockTable[item];
                        return (
                            <motion.div
                                key={item}
                                animate={{
                                    scale: lock ? 1.05 : 1,
                                    borderColor: lock ? (lock.type === 'X' ? 'var(--pink)' : 'var(--cyan)') : 'var(--border)'
                                }}
                                style={{
                                    flex: '1', minWidth: 100, border: '4px solid var(--border)', borderRadius: '12px',
                                    background: lock ? (lock.type === 'X' ? 'rgba(255, 107, 107, 0.1)' : 'rgba(168, 230, 207, 0.1)') : 'var(--white)',
                                    padding: '0.8rem', textAlign: 'center', boxShadow: lock ? 'var(--shadow)' : 'none'
                                }}
                            >
                                <div style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '0.4rem' }}>📦 {item}</div>
                                {lock ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                        <div style={{
                                            background: lock.type === 'X' ? 'var(--pink)' : 'var(--cyan)',
                                            padding: '2px 8px', borderRadius: '4px', fontWeight: 900, fontSize: '0.8rem'
                                        }}>
                                            {lock.type === 'X' ? '🔒 EXC' : '👥 SHR'}
                                        </div>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.6 }}>HELD BY T{lock.holder}</div>
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.3 }}>FREE</div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Transaction Pipeline */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem', minHeight: 0 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.5, letterSpacing: '0.05em' }}>TRANSACTION PIPELINE</div>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '0.4rem' }}>
                    {transactions.map((txn, ti) => {
                        const status = txnStatus[txn.id] ?? 'pending';
                        const isActive = curStep?.txn === txn.id;
                        const bg = status === 'committed' ? 'var(--green)' : status === 'aborted' ? 'var(--pink)' : status === 'waiting' ? 'var(--yellow)' : TXN_COLORS[ti % TXN_COLORS.length];

                        return (
                            <motion.div
                                key={txn.id}
                                animate={{
                                    x: isActive ? [0, 5, 0] : 0,
                                    scale: isActive ? 1.02 : 1,
                                    opacity: status === 'aborted' ? 0.6 : 1
                                }}
                                style={{
                                    border: '3px solid var(--border)', borderRadius: '12px', background: bg,
                                    padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                                    boxShadow: isActive ? 'var(--shadow)' : 'var(--shadow-sm)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 900, fontSize: '1.2rem' }}>T{txn.id}</span>
                                    <div style={{
                                        padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.9)',
                                        border: '2px solid var(--border)', fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase'
                                    }}>
                                        {status}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {txn.ops.map((op, oi) => (
                                        <div key={oi} style={{
                                            padding: '2px 6px', border: '2px solid var(--border)', background: 'rgba(255,255,255,0.5)',
                                            borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)'
                                        }}>
                                            {op.type}({op.item})
                                        </div>
                                    ))}
                                </div>
                                {status === 'waiting' && (
                                    <motion.div
                                        animate={{ opacity: [0.4, 1, 0.4] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        style={{ fontSize: '0.7rem', fontWeight: 900, color: '#b8860b', marginTop: '4px' }}
                                    >
                                        ⏳ BLOCKED ON {lockTable[txn.ops.find(o => o.item)?.item]?.holder === txn.id ? '?' : `T${curStep?.blockedBy || '?'}`}
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Deadlock Detection Overlay */}
            <AnimatePresence>
                {curStep?.type === 'deadlock' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }}
                        style={{
                            position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem',
                            background: 'var(--red)', color: '#fff', border: '4px solid var(--border)',
                            padding: '1rem', borderRadius: '12px', fontWeight: 900, boxShadow: 'var(--shadow)',
                            display: 'flex', alignItems: 'center', gap: '15px'
                        }}
                    >
                        <span style={{ fontSize: '2rem' }}>💀</span>
                        <div>
                            <div style={{ fontSize: '1.1rem' }}>DEADLOCK DETECTED</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>T{curStep.txn} has been selected as the victim and aborted.</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    const LEFT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', overflow: 'hidden' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Steps</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {steps.slice(0, currentStep + 1).map((s, i) => (
                    <div key={i} style={{
                        width: 20, height: 20, border: '2px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700,
                        background: i === currentStep ? 'var(--yellow)' : s.type === 'deadlock' ? 'var(--pink)' : s.type === 'commit' ? 'var(--green)' : s.type === 'block' ? 'rgba(255,217,61,0.5)' : 'var(--cyan)',
                    }} onClick={() => { setCurrentStep(i); stepRef.current = i; }} title={s.phase}>
                        {i + 1}
                    </div>
                ))}
            </div>
            <div style={{ height: 2, background: 'var(--border)', flexShrink: 0 }} />
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Locks Held</div>
            <div style={{ fontWeight: 700, fontSize: '1.3rem', fontFamily: 'var(--font-mono)' }}>{Object.keys(lockTable).length}</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Event Type</div>
            <div style={{
                fontWeight: 700, fontSize: '0.88rem', textTransform: 'uppercase', padding: '0.25rem 0.5rem', border: '2px solid var(--border)',
                background: curStep?.type === 'grant' ? 'var(--green)' : curStep?.type === 'block' ? 'var(--yellow)' : curStep?.type === 'deadlock' ? 'var(--pink)' : 'var(--cyan)'
            }}>
                {curStep?.type ?? '—'}
            </div>
        </div>
    );

    const RIGHT = curStep ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
                <motion.div key={currentStep} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.55, marginBottom: '0.3rem' }}>What Happened</div>
                    <div style={{ fontSize: '0.82rem', lineHeight: 1.55, borderLeft: '3px solid var(--yellow)', paddingLeft: '0.6rem' }}>{curStep.explanation}</div>
                </motion.div>
            </AnimatePresence>
            <div style={{ height: 2, background: 'var(--border)' }} />
            <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.55, marginBottom: '0.3rem' }}>💡 {curStep.insightTitle}</div>
                <div style={{ background: 'var(--yellow)', border: '2px solid var(--border)', padding: '0.5rem 0.6rem', fontSize: '0.78rem', lineHeight: 1.5 }}>{curStep.insight}</div>
            </div>
            <div style={{ marginTop: 'auto', borderTop: '2px solid var(--border)', paddingTop: '0.4rem', fontSize: '0.72rem', opacity: 0.7 }}>
                2PL Guarantee: Strict 2PL ensures serializability — concurrent transactions produce the same result as some sequential execution.
            </div>
        </div>
    ) : null;

    const TL = steps.map((s, i) => ({ id: i, label: `T${s.txn}:${s.type}`, done: i < currentStep, active: i === currentStep }));

    return (
        <ImmersiveLayout isActive={isSimMode} title="Two-Phase Locking" icon="🔒" moduleLabel="DBMS Module"
            isRunning={isRunning} isPaused={isPaused} isFinished={isFinished} speed={speed} onSpeedChange={setSpeed}
            onStart={handleStart} onPause={handlePause} onResume={handleResume} onReset={handleReset} onStep={handleStep}
            currentStepNum={Math.max(0, currentStep + 1)} totalSteps={steps.length}
            phaseName={curStep?.phase ?? ''} centerContent={CENTER} leftContent={LEFT} rightContent={RIGHT}
            timelineItems={TL} legend={[{ color: 'var(--green)', label: 'Granted' }, { color: 'var(--yellow)', label: 'Waiting' }, { color: 'var(--pink)', label: 'Deadlock' }, { color: 'var(--cyan)', label: 'Commit' }]}>
            <div className="main-content">
                <div style={{ marginBottom: '0.4rem' }}><Link to="/dbms" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← DBMS Module</Link></div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="section-header">DBMS · Concurrency Control</div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 700 }}>🔒 Two-Phase Locking Simulator</h1>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '0.3rem' }}>Configure transactions with R/W operations and watch S/X locks, conflicts, and deadlocks play out live.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                    {transactions.map((txn, ti) => (
                        <div key={txn.id} className="panel">
                            <div className="panel-header" style={{ background: TXN_COLORS[ti % TXN_COLORS.length] }}>T{txn.id} — Operations</div>
                            <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {txn.ops.map((op, oi) => (
                                    <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.88rem', padding: '0.3rem 0.5rem', border: '2px solid var(--border)', background: 'var(--white)', fontWeight: 700 }}>
                                        <span style={{ background: op.type === 'W' ? 'var(--pink)' : 'var(--cyan)', padding: '0 0.4rem', border: '2px solid var(--border)', fontSize: '0.78rem' }}>{op.type}</span>({op.item})
                                    </div>
                                ))}
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                    {['X', 'Y', 'Z'].map(item => (
                                        <div key={item} style={{ display: 'flex', gap: '0.25rem' }}>
                                            <button className="btn btn-sm btn-cyan" onClick={() => setTransactions(prev => { const t = [...prev]; t[ti] = { ...t[ti], ops: [...t[ti].ops, { type: 'R', item }] }; return t; })}>R({item})</button>
                                            <button className="btn btn-sm btn-pink" onClick={() => setTransactions(prev => { const t = [...prev]; t[ti] = { ...t[ti], ops: [...t[ti].ops, { type: 'W', item }] }; return t; })}>W({item})</button>
                                        </div>
                                    ))}
                                    {txn.ops.length > 0 && <button className="btn btn-sm" onClick={() => setTransactions(prev => { const t = [...prev]; t[ti] = { ...t[ti], ops: t[ti].ops.slice(0, -1) }; return t; })}>← Undo</button>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-yellow btn-lg" onClick={handleStart}>▶ Run 2PL Simulation</button>
                    <button className="btn btn-sm" style={{ marginTop: '0.15rem' }} onClick={handleStep}>⏭ Step Through</button>
                </div>
            </div>
        </ImmersiveLayout>
    );
}
