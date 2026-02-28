import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';

function buildBankersSteps(allocation, max, available, n, m) {
    const steps = [];
    const need = allocation.map((row, i) => row.map((val, j) => max[i][j] - val));
    const work = [...available];
    const finish = new Array(n).fill(false);
    const safeSeq = [];

    steps.push({
        phase: 'Compute Need Matrix',
        need: JSON.parse(JSON.stringify(need)),
        work: [...work], finish: [...finish], safeSeq: [...safeSeq],
        detail: 'Need[i][j] = Max[i][j] − Allocation[i][j]. Need = max resources each process might still request.',
        explanation: 'Need[i][j] = Max[i][j] − Allocation[i][j]. Shows what more each process might still need.',
        insight: 'If a process\'s Need ≤ Available resources, the OS can safely grant it and eventually get all its resources back.',
        insightTitle: 'Why compute Need?',
    });

    let changed = true;
    while (changed) {
        changed = false;
        for (let i = 0; i < n; i++) {
            if (finish[i]) continue;
            if (need[i].every((v, j) => v <= work[j])) {
                finish[i] = true; changed = true;
                const before = [...work];
                need[i].forEach((_, j) => { work[j] += allocation[i][j]; });
                safeSeq.push(i);
                steps.push({
                    phase: `Grant P${i}: Need ≤ Work`,
                    need: JSON.parse(JSON.stringify(need)),
                    work: [...work], finish: [...finish], safeSeq: [...safeSeq],
                    grantedProcess: i, workBefore: before, workAfter: [...work],
                    detail: `P${i} needs ${need[i].map((v, j) => `R${j}=${v}`).join(', ')} ≤ work [${before}]. Granted! work += allocation[${i}] → [${work}].`,
                    explanation: `Process P${i}'s Need ≤ Work (available resources), so it can be granted. After it runs and releases, work increases.`,
                    insight: 'When a process finishes, it returns ALL its allocated resources. Work grows, enabling more processes to run.',
                    insightTitle: 'Resource Release Cycle',
                });
            }
        }
    }

    const isSafe = safeSeq.length === n;
    steps.push({
        phase: isSafe ? '✅ Safe State Found' : '🚨 Unsafe State — Deadlock Risk',
        need: JSON.parse(JSON.stringify(need)), work: [...work], finish: [...finish], safeSeq: [...safeSeq],
        done: true, isSafe,
        detail: isSafe
            ? `Safe sequence: P${safeSeq.join(' → P')}. All processes can complete.`
            : `Only ${safeSeq.length}/${n} processes completed. Remaining processes cannot proceed — deadlock risk!`,
        explanation: isSafe
            ? `All processes can complete in the order: P${safeSeq.join(' → P')}. The system is in a SAFE STATE.`
            : `Not all processes can complete. Circular resource dependency = potential DEADLOCK.`,
        insight: isSafe ? 'Safe state = at least one sequence exists where all processes can finish. No deadlock is possible.' : 'Unsafe state ≠ deadlock — but there IS a possibility of deadlock if processes request max resources simultaneously.',
        insightTitle: isSafe ? 'What is a Safe State?' : 'Safe vs. Unsafe vs. Deadlock',
    });

    return steps;
}

export default function BankersAlgorithmSim() {
    const [n, setN] = useState(3);
    const [m, setM] = useState(3);
    const [allocation, setAllocation] = useState([[0, 1, 0], [2, 0, 0], [3, 0, 2]]);
    const [max, setMax] = useState([[0, 2, 2], [3, 2, 2], [4, 2, 3]]); // Adjusted for safe state
    const [available, setAvailable] = useState([3, 3, 2]);
    const [speed, setSpeed] = useState(900);

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
        const s = buildBankersSteps(allocation, max, available, n, m);
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
    const need = allocation.map((row, i) => row.map((val, j) => (max[i]?.[j] ?? 0) - val));

    const CENTER = (
        <div style={{ padding: '0.75rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
            {/* Main Visualizer Board */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: 0 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5, letterSpacing: '0.05em' }}>Process Resource Status (Need vs Available)</div>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.5rem' }}>
                    {Array.from({ length: n }, (_, i) => {
                        const isGranted = curStep?.safeSeq?.includes(i);
                        const isCurrent = curStep?.grantedProcess === i;
                        const pNeed = curStep?.need?.[i] ?? need[i];

                        return (
                            <motion.div
                                key={i}
                                animate={{
                                    scale: isCurrent ? 1.02 : 1,
                                    borderColor: isCurrent ? 'var(--yellow)' : 'var(--border)',
                                    opacity: isGranted && !isCurrent ? 0.6 : 1
                                }}
                                style={{
                                    border: '3px solid var(--border)', borderRadius: '10px', background: 'var(--white)',
                                    padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.6rem',
                                    boxShadow: isCurrent ? '0 8px 24px rgba(0,0,0,0.1)' : 'var(--shadow-sm)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 900, fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }}>PROCESS P{i}</div>
                                    <div style={{
                                        fontSize: '0.65rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px',
                                        background: isGranted ? 'var(--green)' : isCurrent ? 'var(--yellow)' : 'rgba(0,0,0,0.05)',
                                        textTransform: 'uppercase'
                                    }}>
                                        {isGranted ? 'DONE' : isCurrent ? 'ACTIVE' : 'WAITING'}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {pNeed.map((v, j) => {
                                        const avail = curStep?.work?.[j] ?? available[j];
                                        const canProvide = v <= avail;
                                        return (
                                            <div key={j} style={{ flex: 1, textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.5 }}>R{j}</div>
                                                <div style={{
                                                    height: 6, background: 'rgba(0,0,0,0.1)', borderRadius: '3px', margin: '4px 0', overflow: 'hidden',
                                                    border: '1px solid var(--border)'
                                                }}>
                                                    <motion.div
                                                        animate={{ width: `${Math.min(100, (avail / (v || 1)) * 50)}%` }}
                                                        style={{ height: '100%', background: canProvide ? 'var(--green)' : 'var(--pink)' }}
                                                    />
                                                </div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                                                    {v} <span style={{ opacity: 0.3 }}>/</span> {avail}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Work (Available) Vector Visual */}
            <div style={{ flexShrink: 0, background: 'var(--yellow)', border: '4px solid var(--border)', borderRadius: '12px', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>🏦 SYSTEM VAULT (AVAILABLE RESOURCES)</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>[{curStep?.work.join(', ') || available.join(', ')}]</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(curStep?.work || available).map((v, j) => (
                        <div key={j} style={{ flex: 1, background: 'rgba(255,255,255,0.9)', border: '2px solid var(--border)', borderRadius: '6px', padding: '0.5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.6 }}>R{j}</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{v}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Final verdict */}
            {curStep?.done && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ padding: '1rem', borderRadius: '12px', border: '4px solid var(--border)', background: curStep.isSafe ? 'var(--green)' : 'var(--pink)', fontWeight: 900, boxShadow: 'var(--shadow)', textAlign: 'center' }}>
                    {curStep.isSafe ? '🚀 SYSTEM IS IN A SAFE STATE' : '⚠️ DEADLOCK RISK: UNSAFE STATE'}
                </motion.div>
            )}
        </div>
    );

    const LEFT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', overflow: 'hidden' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Processes</div>
            {Array.from({ length: n }, (_, i) => (
                <div key={i} style={{ border: '2px solid var(--border)', background: curStep?.finish?.[i] ? 'var(--green)' : curStep?.grantedProcess === i ? 'var(--yellow)' : 'var(--white)', padding: '0.3rem 0.5rem', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>P{i}</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{curStep?.finish?.[i] ? '✅' : '⏳'}</span>
                </div>
            ))}
            <div style={{ height: 2, background: 'var(--border)', marginTop: '0.25rem' }} />
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Step</div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{curStep?.phase ?? '—'}</div>
        </div>
    );

    const RIGHT = curStep ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', overflow: 'hidden' }}>
            <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.55, marginBottom: '0.3rem' }}>What Happened</div>
                <div style={{ fontSize: '0.82rem', lineHeight: 1.55, borderLeft: '3px solid var(--yellow)', paddingLeft: '0.6rem' }}>{curStep.explanation}</div>
            </div>
            <div style={{ height: 2, background: 'var(--border)' }} />
            <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.55, marginBottom: '0.3rem' }}>💡 {curStep.insightTitle}</div>
                <div style={{ background: 'var(--yellow)', border: '2px solid var(--border)', padding: '0.5rem 0.6rem', fontSize: '0.78rem', lineHeight: 1.5 }}>{curStep.insight}</div>
            </div>
        </div>
    ) : null;

    const TL = steps.map((s, i) => ({ id: i, label: s.phase, done: i < currentStep, active: i === currentStep }));

    return (
        <ImmersiveLayout isActive={isSimMode} title="Banker's Algorithm" icon="🏦" moduleLabel="OS Module"
            isRunning={isRunning} isPaused={isPaused} isFinished={isFinished} speed={speed} onSpeedChange={setSpeed}
            onStart={handleStart} onPause={handlePause} onResume={handleResume} onReset={handleReset} onStep={handleStep}
            currentStepNum={Math.max(0, currentStep + 1)} totalSteps={steps.length}
            phaseName={curStep?.phase ?? ''} centerContent={CENTER} leftContent={LEFT} rightContent={RIGHT}
            timelineItems={TL} legend={[{ color: 'var(--green)', label: 'Granted' }, { color: 'var(--yellow)', label: 'Current' }, { color: 'var(--pink)', label: 'Unsafe' }]}>
            <div className="main-content">
                <div style={{ marginBottom: '0.4rem' }}><Link to="/os" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← OS Module</Link></div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="section-header">OS · Deadlock Avoidance</div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 700 }}>🏦 Banker's Algorithm Simulator</h1>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '0.3rem' }}>Configure allocation and max matrices, then watch the safety algorithm find (or fail to find) a safe sequence.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    {[['Allocation', allocation, setAllocation], ['Max', max, setMax]].map(([label, data, setter]) => (
                        <div key={label} className="panel">
                            <div className="panel-header">{label} Matrix</div>
                            <div style={{ padding: '0.75rem' }}>
                                <table className="neo-table" style={{ fontSize: '0.82rem' }}>
                                    <thead><tr><th>P</th>{Array.from({ length: m }, (_, j) => <th key={j}>R{j}</th>)}</tr></thead>
                                    <tbody>{Array.from({ length: n }, (_, i) => (
                                        <tr key={i}><td style={{ fontWeight: 700 }}>P{i}</td>{Array.from({ length: m }, (_, j) => (
                                            <td key={j}><input type="number" min={0} max={9}
                                                value={data[i]?.[j] ?? 0}
                                                onChange={e => setter(prev => { const c = prev.map(r => [...r]); if (!c[i]) c[i] = []; c[i][j] = +e.target.value || 0; return c; })}
                                                style={{ width: 36, border: '2px solid var(--border)', fontWeight: 700, fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '0.15rem', background: 'var(--white)' }} />
                                            </td>))}</tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                    <div className="panel">
                        <div className="panel-header">Available Resources</div>
                        <div style={{ padding: '0.75rem' }}>
                            {Array.from({ length: m }, (_, j) => (
                                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', width: 24 }}>R{j}</span>
                                    <input type="number" min={0} max={20} value={available[j] ?? 0}
                                        onChange={e => setAvailable(prev => { const c = [...prev]; c[j] = +e.target.value || 0; return c; })}
                                        className="form-input" style={{ width: 60 }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-yellow btn-lg" onClick={handleStart}>▶ Run Safety Algorithm</button>
                    <button className="btn btn-sm" style={{ marginTop: '0.15rem' }} onClick={handleStep}>⏭ Step Through</button>
                </div>
            </div>
        </ImmersiveLayout>
    );
}
