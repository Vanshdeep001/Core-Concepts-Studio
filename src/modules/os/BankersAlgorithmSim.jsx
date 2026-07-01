import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import useSnapshot from '../../hooks/useSnapshot';

/* ══════════════════════════════════════════
   Safety Algorithm — step builder
══════════════════════════════════════════ */
function buildBankersSteps(allocation, max, available, n, m) {
    const steps = [];
    const need = allocation.map((row, i) => row.map((val, j) => (max[i][j] ?? 0) - val));
    const work = [...available];
    const finish = new Array(n).fill(false);
    const safeSeq = [];

    steps.push({
        phase: 'Compute Need Matrix',
        need: JSON.parse(JSON.stringify(need)),
        work: [...work], finish: [...finish], safeSeq: [...safeSeq],
        grantedProcess: null,
        explanation: 'Need[i][j] = Max[i][j] − Allocation[i][j]. Shows the maximum additional resources each process may still request.',
        insight: 'Think of it like a credit limit: the bank must know the worst-case loan each customer might ask for.',
        insightTitle: 'Why compute Need?',
    });

    let changed = true;
    while (changed) {
        changed = false;
        for (let i = 0; i < n; i++) {
            if (finish[i]) continue;
            if (need[i].every((v, j) => v <= work[j])) {
                finish[i] = true; changed = true;
                const workBefore = [...work];
                need[i].forEach((_, j) => { work[j] += allocation[i][j]; });
                safeSeq.push(i);
                steps.push({
                    phase: `Grant P${i}`,
                    need: JSON.parse(JSON.stringify(need)),
                    work: [...work], finish: [...finish], safeSeq: [...safeSeq],
                    grantedProcess: i, workBefore,
                    explanation: `P${i}'s Need [${need[i].join(', ')}] ≤ Work [${workBefore.join(', ')}]. Loan granted! After completing, P${i} returns all resources. Vault grows to [${work.join(', ')}].`,
                    insight: 'When a process finishes it returns ALL allocated resources — the vault grows, enabling more loans.',
                    insightTitle: 'Resource Release Cycle',
                });
            }
        }
    }

    const isSafe = safeSeq.length === n;
    steps.push({
        phase: isSafe ? 'Safe State Found' : 'Unsafe — Deadlock Risk',
        need: JSON.parse(JSON.stringify(need)), work: [...work], finish: [...finish], safeSeq: [...safeSeq],
        done: true, isSafe, grantedProcess: null,
        explanation: isSafe
            ? `Safe sequence: P${safeSeq.join(' → P')}. All processes can complete without deadlock.`
            : `Only ${safeSeq.length}/${n} processes completed. Remaining processes cannot proceed — circular dependency detected!`,
        insight: isSafe
            ? 'Safe state = at least one execution order exists where all processes can finish. Deadlock is impossible.'
            : 'Unsafe ≠ deadlock yet — but if all processes request maximum simultaneously, deadlock WILL occur.',
        insightTitle: isSafe ? 'What is a Safe State?' : 'Safe vs Unsafe vs Deadlock',
    });

    return steps;
}

/* ══════════════════════════════════════════
   Main Component
══════════════════════════════════════════ */
export default function BankersAlgorithmSim() {
    const [n, setN] = useState(5);
    const [m, setM] = useState(3);
    const [allocation, setAllocation] = useState([
        [0, 1, 0],
        [2, 0, 0],
        [3, 0, 2],
        [2, 1, 1],
        [0, 0, 2],
    ]);
    const [max, setMax] = useState([
        [7, 5, 3],
        [3, 2, 2],
        [9, 0, 2],
        [2, 2, 2],
        [4, 3, 3],
    ]);
    const [available, setAvailable] = useState([3, 3, 2]);
    const [speed, setSpeed] = useState(900);

    /* ── add / remove process helpers ── */
    const addProcess = () => {
        setAllocation(prev => [...prev, Array(m).fill(0)]);
        setMax(prev => [...prev, Array(m).fill(0)]);
        setN(prev => prev + 1);
    };
    const removeProcess = () => {
        if (n <= 2) return;          // keep at least 2
        setAllocation(prev => prev.slice(0, -1));
        setMax(prev => prev.slice(0, -1));
        setN(prev => prev - 1);
    };

    const [steps, setSteps] = useState([]);
    const [currentStep, setCurrentStep] = useState(-1);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [isSimMode, setIsSimMode] = useState(false);

    const timerRef = useRef(null);
    const stepRef = useRef(-1);
    const stepsRef = useRef([]);

    useSnapshot(useCallback((config, step) => {
        if (config.n !== undefined) setN(config.n);
        if (config.m !== undefined) setM(config.m);
        if (config.allocation !== undefined) setAllocation(config.allocation);
        if (config.max !== undefined) setMax(config.max);
        if (config.available !== undefined) setAvailable(config.available);
        
        const s = buildBankersSteps(config.allocation, config.max, config.available, config.n, config.m);
        stepsRef.current = s;
        setSteps(s);
        setCurrentStep(step);
        stepRef.current = step;
        setIsSimMode(true);
        setIsPaused(true);
        setIsRunning(false);
    }, []));

    const advanceStep = useCallback((stepsArr, idx) => {
        const next = idx + 1;
        if (next >= stepsArr.length) {
            setCurrentStep(next - 1); setIsRunning(false); setIsFinished(true);
            clearInterval(timerRef.current); return;
        }
        setCurrentStep(next); stepRef.current = next;
    }, []);

    const handleStart = () => {
        const s = buildBankersSteps(allocation, max, available, n, m);
        stepsRef.current = s; setSteps(s);
        setCurrentStep(-1); stepRef.current = -1;
        setIsRunning(true); setIsPaused(false); setIsFinished(false); setIsSimMode(true);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => advanceStep(stepsRef.current, stepRef.current), speed);
    };
    const handlePause = () => { setIsRunning(false); setIsPaused(true); clearInterval(timerRef.current); };
    const handleResume = () => {
        setIsRunning(true); setIsPaused(false);
        timerRef.current = setInterval(() => advanceStep(stepsRef.current, stepRef.current), speed);
    };
    const handleReset = () => {
        clearInterval(timerRef.current); setSteps([]); stepsRef.current = [];
        setCurrentStep(-1); stepRef.current = -1;
        setIsRunning(false); setIsPaused(false); setIsFinished(false); setIsSimMode(false);
    };
    const handleStep = () => {
        setIsSimMode(true);
        if (stepsRef.current.length === 0) {
            const s = buildBankersSteps(allocation, max, available, n, m);
            stepsRef.current = s; setSteps(s);
        }
        advanceStep(stepsRef.current, stepRef.current);
    };

    const curStep = currentStep >= 0 ? steps[currentStep] : null;
    const need = allocation.map((row, i) => row.map((val, j) => (max[i]?.[j] ?? 0) - val));
    const displayWork = curStep?.work ?? available;
    const displayNeed = curStep?.need ?? need;
    const displayFinish = curStep?.finish ?? new Array(n).fill(false);
    const maxResource = Math.max(...displayWork, ...available, 1);

    /* process status helper */
    const procStatus = (i) => {
        if (displayFinish[i] && curStep?.grantedProcess !== i) return 'done';
        if (curStep?.grantedProcess === i) return 'granting';
        if (!displayFinish[i] && displayNeed[i]?.every((v, j) => v <= displayWork[j])) return 'ready';
        return 'waiting';
    };
    const STATUS_STYLE = {
        done: { bg: 'var(--green)', label: 'Done', border: 'var(--border)' },
        granting: { bg: 'var(--yellow)', label: 'Granting', border: 'var(--border)' },
        ready: { bg: 'var(--cyan)', label: 'Ready', border: 'var(--border)' },
        waiting: { bg: 'var(--white)', label: 'Waiting', border: 'var(--border)' },
    };

    /* ══════════════════════════════════════════
       CENTER VISUALIZER
    ══════════════════════════════════════════ */
    const CENTER = (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--white)', overflow: 'hidden' }}>

            {/* ── VAULT HEADER ── */}
            <div style={{
                flexShrink: 0, background: 'var(--yellow)',
                borderBottom: '3px solid var(--border)',
                padding: '0.7rem 1.25rem',
                display: 'flex', alignItems: 'center', gap: '1.5rem',
            }}>
                <div>
                    <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>System Vault</div>
                    <div style={{ fontWeight: 900, fontSize: '0.82rem' }}>Available Resources (Work Vector)</div>
                </div>

                {/* Vault resource meters */}
                <div style={{ display: 'flex', gap: '0.75rem', flex: 1, justifyContent: 'flex-end' }}>
                    {displayWork.map((v, j) => {
                        const pct = Math.max(8, (v / maxResource) * 100);
                        return (
                            <div key={j} style={{ textAlign: 'center', minWidth: 52 }}>
                                <div style={{
                                    height: 36,
                                    background: 'var(--white)',
                                    border: '2px solid var(--border)',
                                    boxShadow: '2px 2px 0 var(--border)',
                                    display: 'flex', alignItems: 'flex-end',
                                    overflow: 'hidden',
                                    marginBottom: 3,
                                }}>
                                    <motion.div
                                        animate={{ height: `${pct}%` }}
                                        transition={{ duration: 0.5 }}
                                        style={{
                                            width: '100%',
                                            background: v > 0 ? 'var(--green)' : 'rgba(0,0,0,0.08)',
                                            borderTop: v > 0 ? '2px solid var(--border)' : 'none',
                                        }}
                                    />
                                </div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.85rem' }}>{v}</div>
                                <div style={{ fontSize: '0.55rem', fontWeight: 800, opacity: 0.55, textTransform: 'uppercase' }}>R{j}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Work vector badge */}
                <div style={{
                    background: 'var(--white)', border: '3px solid var(--border)',
                    boxShadow: '3px 3px 0 var(--border)',
                    padding: '4px 14px', fontFamily: 'var(--font-mono)',
                    fontWeight: 900, fontSize: '0.9rem', flexShrink: 0,
                }}>
                    [{displayWork.join(', ')}]
                </div>
            </div>

            {/* ── PROCESS CARDS GRID ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', minHeight: 0 }}>
                {Array.from({ length: n }, (_, i) => {
                    const status = procStatus(i);
                    const st = STATUS_STYLE[status];
                    const pNeed = displayNeed[i] ?? need[i];
                    const pAlloc = allocation[i] ?? [];
                    const pMax = max[i] ?? [];

                    return (
                        <motion.div
                            key={i}
                            animate={{
                                scale: status === 'granting' ? 1.015 : 1,
                                y: status === 'granting' ? -2 : 0,
                            }}
                            transition={{ duration: 0.3 }}
                            style={{
                                border: '3px solid var(--border)',
                                boxShadow: status === 'granting' ? '5px 5px 0 var(--border)' : '3px 3px 0 var(--border)',
                                background: 'var(--white)',
                                display: 'flex', alignItems: 'stretch',
                                overflow: 'hidden', flexShrink: 0,
                            }}
                        >
                            {/* LEFT ACCENT STRIP — status color */}
                            <div style={{ width: 8, background: st.bg, flexShrink: 0 }} />

                            {/* PROCESS LABEL */}
                            <div style={{
                                width: 64, flexShrink: 0,
                                background: st.bg, borderRight: '3px solid var(--border)',
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                padding: '0.6rem 0.4rem', gap: 4,
                            }}>
                                <div style={{ fontWeight: 900, fontSize: '1.1rem', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>P{i}</div>
                                <div style={{
                                    fontSize: '0.52rem', fontWeight: 800, textTransform: 'uppercase',
                                    letterSpacing: '0.06em', opacity: 0.7,
                                }}>{st.label}</div>
                            </div>

                            {/* RESOURCE COLUMNS */}
                            <div style={{ flex: 1, display: 'flex' }}>
                                {/* Allocation column */}
                                <ResourceSection
                                    title="Allocated"
                                    subtitle="Holding"
                                    values={pAlloc}
                                    m={m}
                                    bg="rgba(0,0,0,0.03)"
                                    borderRight
                                />
                                {/* Max column */}
                                <ResourceSection
                                    title="Max"
                                    subtitle="Worst case"
                                    values={pMax}
                                    m={m}
                                    bg="rgba(0,0,0,0.03)"
                                    borderRight
                                />
                                {/* Need column — color coded */}
                                <div style={{
                                    flex: 1, padding: '0.35rem 0.75rem',
                                    background: 'rgba(0,0,0,0.02)',
                                    borderRight: '2px solid rgba(0,0,0,0.08)',
                                }}>
                                    <div style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5, marginBottom: 6 }}>
                                        Need <span style={{ opacity: 0.5 }}>/ Work</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {pNeed.map((v, j) => {
                                            const w = displayWork[j] ?? 0;
                                            const ok = v <= w;
                                            const done = displayFinish[i];
                                            return (
                                                <div key={j} style={{ flex: 1, textAlign: 'center' }}>
                                                    <div style={{ fontSize: '0.5rem', fontWeight: 800, opacity: 0.45, marginBottom: 2 }}>R{j}</div>
                                                    {/* comparison bar */}
                                                    <div style={{
                                                        height: 6,
                                                        background: 'rgba(0,0,0,0.08)',
                                                        border: '1.5px solid var(--border)',
                                                        overflow: 'hidden',
                                                        marginBottom: 3,
                                                    }}>
                                                        <motion.div
                                                            animate={{ width: `${Math.min(100, w > 0 ? (w / Math.max(v, w)) * 100 : 0)}%` }}
                                                            transition={{ duration: 0.5 }}
                                                            style={{
                                                                height: '100%',
                                                                background: done ? 'var(--green)' : ok ? 'var(--green)' : 'var(--pink)',
                                                            }}
                                                        />
                                                    </div>
                                                    <div style={{
                                                        fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 900,
                                                        color: done ? 'var(--text)' : ok ? 'var(--text)' : 'var(--pink)',
                                                    }}>
                                                        {v}
                                                        <span style={{ opacity: 0.35, fontSize: '0.6rem' }}> /{w}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Can grant? visual check */}
                                <div style={{
                                    width: 72, flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderLeft: '2px solid rgba(0,0,0,0.08)',
                                    background: status === 'done' ? 'rgba(168,230,207,0.15)'
                                        : status === 'granting' ? 'rgba(255,217,61,0.15)'
                                            : status === 'ready' ? 'rgba(102,217,239,0.12)'
                                                : 'transparent',
                                }}>
                                    <div style={{
                                        fontSize: '1.2rem', fontWeight: 900,
                                        color: status === 'done' ? 'var(--green)'
                                            : status === 'granting' ? 'var(--text)'
                                                : status === 'ready' ? 'var(--cyan)'
                                                    : 'rgba(0,0,0,0.2)',
                                    }}>
                                        {status === 'done' ? '✓' : status === 'granting' ? '►' : status === 'ready' ? '○' : '…'}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* ── SAFE SEQUENCE + VERDICT ── */}
            <div style={{
                flexShrink: 0, borderTop: '3px solid var(--border)',
                background: 'var(--bg)',
                display: 'grid', gridTemplateColumns: '1fr auto',
                minHeight: 80, maxHeight: 100,
            }}>
                {/* Sequence */}
                <div style={{ padding: '0.6rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.3rem', overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.45 }}>
                        Safe Sequence
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {(curStep?.safeSeq ?? []).length === 0
                            ? <span style={{ fontSize: '0.78rem', opacity: 0.3, fontStyle: 'italic' }}>Building sequence…</span>
                            : (curStep?.safeSeq ?? []).map((pid, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        style={{
                                            background: 'var(--green)', border: '2px solid var(--border)',
                                            boxShadow: '2px 2px 0 var(--border)',
                                            padding: '3px 14px',
                                            fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.82rem',
                                        }}
                                    >
                                        P{pid}
                                    </motion.div>
                                    {idx < (curStep?.safeSeq ?? []).length - 1 && (
                                        <span style={{ fontWeight: 900, opacity: 0.35, fontSize: '1rem' }}>→</span>
                                    )}
                                </div>
                            ))
                        }
                    </div>
                </div>

                {/* Verdict badge */}
                <AnimatePresence>
                    {curStep?.done && (
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{
                                background: curStep.isSafe ? 'var(--green)' : 'var(--pink)',
                                borderLeft: '3px solid var(--border)',
                                padding: '0 1.5rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 900, fontSize: '0.82rem',
                                textAlign: 'center', minWidth: 160,
                            }}
                        >
                            {curStep.isSafe ? 'SAFE STATE' : 'UNSAFE STATE'}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );

    /* ── LEFT panel ── */
    const LEFT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>Current Step</div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.4, borderLeft: '3px solid var(--border)', paddingLeft: '0.5rem' }}>
                {curStep?.phase ?? '—'}
            </div>

            <div style={{ height: 2, background: 'var(--border)' }} />

            <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>Processes</div>
            {Array.from({ length: n }, (_, i) => {
                const status = procStatus(i);
                const st = STATUS_STYLE[status];
                return (
                    <motion.div key={i} animate={{ background: st.bg }} style={{
                        border: '2px solid var(--border)', boxShadow: '2px 2px 0 var(--border)',
                        padding: '0.4rem 0.6rem',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <span style={{ fontWeight: 900, fontFamily: 'var(--font-mono)' }}>P{i}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.7 }}>{st.label}</span>
                    </motion.div>
                );
            })}

            <div style={{ height: 2, background: 'var(--border)' }} />
            <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>Safe Sequence</div>
            {(curStep?.safeSeq ?? []).length === 0
                ? <div style={{ opacity: 0.3, fontSize: '0.78rem', fontStyle: 'italic' }}>Building…</div>
                : <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.85rem', lineHeight: 1.6 }}>
                    P{(curStep?.safeSeq ?? []).join(' → P')}
                </div>
            }
        
            
        </div>
    );

    /* ── RIGHT panel ── */
    const RIGHT = curStep ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>What Happened</div>
            <div style={{ fontSize: '0.8rem', lineHeight: 1.6, borderLeft: '3px solid var(--yellow)', paddingLeft: '0.6rem' }}>
                {curStep.explanation}
            </div>

            <div style={{ height: 2, background: 'var(--border)' }} />

            <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>{curStep.insightTitle}</div>
            <div style={{
                background: 'var(--yellow)', border: '2px solid var(--border)',
                boxShadow: '3px 3px 0 var(--border)',
                padding: '0.6rem 0.75rem', fontSize: '0.78rem', lineHeight: 1.55,
            }}>
                {curStep.insight}
            </div>

            {curStep.workBefore && (
                <>
                    <div style={{ height: 2, background: 'var(--border)' }} />
                    <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>Vault Change</div>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                        <span style={{
                            border: '2px solid var(--border)', padding: '3px 10px',
                            boxShadow: '2px 2px 0 var(--border)', fontSize: '0.8rem', opacity: 0.6,
                        }}>[{curStep.workBefore.join(', ')}]</span>
                        <span style={{ fontWeight: 900 }}>→</span>
                        <span style={{
                            background: 'var(--green)', border: '2px solid var(--border)',
                            padding: '3px 10px', boxShadow: '2px 2px 0 var(--border)', fontSize: '0.8rem',
                        }}>[{curStep.work.join(', ')}]</span>
                    </div>
                </>
            )}

            {curStep.done && (
                <>
                    <div style={{ height: 2, background: 'var(--border)' }} />
                    <div style={{
                        background: curStep.isSafe ? 'var(--green)' : 'var(--pink)',
                        border: '3px solid var(--border)',
                        boxShadow: '4px 4px 0 var(--border)',
                        padding: '0.75rem',
                        fontWeight: 900, fontSize: '0.88rem', textAlign: 'center',
                    }}>
                        {curStep.isSafe ? 'SAFE STATE — No Deadlock Possible' : 'UNSAFE STATE — Deadlock Risk!'}
                    </div>
                </>
            )}
        </div>
    ) : null;

    const TL = steps.map((s, i) => ({ id: i, label: s.phase, done: i < currentStep, active: i === currentStep }));

    /* ══════════════════════════════════════════
       CONFIG SCREEN
    ══════════════════════════════════════════ */
    return (
        <ImmersiveLayout
            isActive={isSimMode}
            title="Banker's Algorithm" icon="B" moduleLabel="OS Module"
            isRunning={isRunning} isPaused={isPaused} isFinished={isFinished}
            speed={speed} onSpeedChange={setSpeed}
            onStart={handleStart} onPause={handlePause} onResume={handleResume}
            onReset={handleReset} onStep={handleStep}
            currentStepNum={Math.max(0, currentStep + 1)} totalSteps={steps.length}
            phaseName={curStep?.phase ?? ''}
            centerContent={CENTER} leftContent={LEFT} rightContent={RIGHT}
            timelineItems={TL}
            legend={[
                { color: 'var(--green)', label: 'Done / Can Grant' },
                { color: 'var(--yellow)', label: 'Granting' },
                { color: 'var(--cyan)', label: 'Ready' },
                { color: 'var(--pink)', label: 'Blocked' },
            ]}
            snapshotData={{
                config: { n, m, allocation, max, available },
                step: currentStep
            }}
        >
            <div className="main-content">
                <div style={{ marginBottom: '0.4rem' }}>
                    <Link to="/os" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← OS Module</Link>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="section-header">OS · Deadlock Avoidance</div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 700 }}>Banker's Algorithm Simulator</h1>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '0.3rem' }}>
                        Configure allocation and max matrices, then watch the safety algorithm find (or fail to find) a safe sequence step by step.
                    </p>
                </div>

                {/* Process count controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{
                        background: 'var(--cyan)', border: '3px solid var(--border)',
                        boxShadow: '3px 3px 0 var(--border)',
                        padding: '0.4rem 1rem', fontWeight: 900, fontSize: '0.9rem',
                    }}>
                        {n} Process{n !== 1 ? 'es' : ''}
                    </div>
                    <button className="btn btn-sm" onClick={addProcess}>
                        + Add Process
                    </button>
                    <button className="btn btn-sm" onClick={removeProcess} disabled={n <= 2}
                        style={{ opacity: n <= 2 ? 0.4 : 1 }}>
                        − Remove Last
                    </button>
                    <span style={{ fontSize: '0.72rem', opacity: 0.5, marginLeft: '0.25rem' }}>
                        New rows default to all zeros — edit values below.
                    </span>
                </div>

                {/* Matrix inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    {[['Allocation', 'Currently Holding', allocation, setAllocation], ['Max', 'Worst Case Need', max, setMax]].map(([label, sub, data, setter]) => (
                        <div key={label} className="panel">
                            <div className="panel-header">
                                <div>
                                    <div>{label} Matrix</div>
                                    <div style={{ fontSize: '0.62rem', fontWeight: 600, opacity: 0.6 }}>{sub}</div>
                                </div>
                            </div>
                            <div style={{ padding: '0.75rem' }}>
                                <table className="neo-table" style={{ fontSize: '0.82rem' }}>
                                    <thead>
                                        <tr>
                                            <th>P</th>
                                            {Array.from({ length: m }, (_, j) => <th key={j}>R{j}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: n }, (_, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>P{i}</td>
                                                {Array.from({ length: m }, (_, j) => (
                                                    <td key={j}>
                                                        <input type="number" min={0} max={9}
                                                            value={data[i]?.[j] ?? 0}
                                                            onChange={e => setter(prev => {
                                                                const c = prev.map(r => [...r]);
                                                                if (!c[i]) c[i] = [];
                                                                c[i][j] = +e.target.value || 0;
                                                                return c;
                                                            })}
                                                            style={{
                                                                width: 40, border: '2px solid var(--border)',
                                                                fontWeight: 700, fontFamily: 'var(--font-mono)',
                                                                textAlign: 'center', padding: '0.15rem',
                                                                background: 'var(--white)',
                                                            }}
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}

                    {/* Available resources */}
                    <div className="panel">
                        <div className="panel-header">
                            <div>
                                <div>Available Resources</div>
                                <div style={{ fontSize: '0.62rem', fontWeight: 600, opacity: 0.6 }}>Initial Vault</div>
                            </div>
                        </div>
                        <div style={{ padding: '0.75rem' }}>
                            {Array.from({ length: m }, (_, j) => (
                                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                                    <div style={{
                                        background: 'var(--cyan)', border: '2px solid var(--border)',
                                        boxShadow: '2px 2px 0 var(--border)',
                                        padding: '3px 10px', fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.85rem',
                                        minWidth: 36, textAlign: 'center',
                                    }}>R{j}</div>
                                    <input type="number" min={0} max={20} value={available[j] ?? 0}
                                        onChange={e => setAvailable(prev => { const c = [...prev]; c[j] = +e.target.value || 0; return c; })}
                                        className="form-input" style={{ width: 70 }} />
                                    {/* mini vault bar */}
                                    <div style={{ flex: 1, height: 10, background: 'var(--bg)', border: '2px solid var(--border)', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', background: 'var(--green)',
                                            width: `${Math.min(100, (available[j] / 20) * 100)}%`,
                                            transition: 'width 0.2s',
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick preview of the Need matrix */}
                <div className="panel" style={{ marginBottom: '1.25rem' }}>
                    <div className="panel-header">Need Matrix Preview <span style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.6 }}>= Max − Allocation</span></div>
                    <div style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {Array.from({ length: n }, (_, i) => (
                            <div key={i} style={{
                                border: '3px solid var(--border)', padding: '0.5rem 0.75rem',
                                boxShadow: '3px 3px 0 var(--border)', minWidth: 110,
                            }}>
                                <div style={{ fontWeight: 900, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>P{i}</div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {Array.from({ length: m }, (_, j) => {
                                        const v = (max[i]?.[j] ?? 0) - (allocation[i]?.[j] ?? 0);
                                        const ok = v <= (available[j] ?? 0);
                                        return (
                                            <div key={j} style={{
                                                textAlign: 'center',
                                                background: ok ? 'var(--green)' : 'var(--pink)',
                                                border: '2px solid var(--border)',
                                                padding: '2px 8px',
                                                fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.85rem',
                                            }}>
                                                {Math.max(0, v)}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-yellow btn-lg" onClick={handleStart}>▶ Run Safety Algorithm</button>
                    <button className="btn btn-sm" style={{ marginTop: '0.15rem' }} onClick={handleStep}>Step Through</button>
                </div>
            </div>
        </ImmersiveLayout>
    );
}

/* ── Reusable resource section inside a process card ── */
function ResourceSection({ title, subtitle, values, m, bg, borderRight }) {
    return (
        <div style={{
            flex: 1, padding: '0.35rem 0.75rem',
            background: bg || 'transparent',
            borderRight: borderRight ? '2px solid rgba(0,0,0,0.08)' : 'none',
        }}>
            <div style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45, marginBottom: 6 }}>
                {title} <span style={{ opacity: 0.5 }}>— {subtitle}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                {Array.from({ length: m }, (_, j) => (
                    <div key={j} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.5rem', fontWeight: 800, opacity: 0.4, marginBottom: 2 }}>R{j}</div>
                        <div style={{
                            fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.85rem',
                        }}>{values[j] ?? 0}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
