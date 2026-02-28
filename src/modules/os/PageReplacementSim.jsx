import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import { runFIFO, runLRU, runOptimal, runLFU } from './pageReplacement';

const ALGOS = ['FIFO', 'LRU', 'Optimal', 'LFU'];

const EXPLANATIONS = {
    miss: (page, victim, algo) => ({
        what: `Page ${page} is NOT in any frame → PAGE FAULT. ${victim !== null ? `Victim: page ${victim} evicted.` : 'Frames have free space.'}`,
        why: `A page fault occurs when the required page is not resident in physical memory. The OS must fetch it from disk.`,
        insight: algo === 'LRU' ? 'LRU evicts the page that was LEAST RECENTLY used — great for temporal locality.'
            : algo === 'FIFO' ? 'FIFO evicts the OLDEST loaded page — simple but can evict frequently used pages (Belady\'s Anomaly).'
                : algo === 'Optimal' ? 'OPT evicts the page used FARTHEST in the future — theoretically best but requires future knowledge.'
                    : 'LFU evicts the page with LOWEST frequency of use — good for frequency-based workloads.',
    }),
    hit: (page) => ({
        what: `Page ${page} is already in memory → HIT. No disk I/O needed.`,
        why: 'The page is resident in a frame. No eviction is necessary. This is the ideal case.',
        insight: 'Cache hits are fast — no disk access required. A high hit rate means less disk I/O and faster execution.',
    }),
};

export default function PageReplacementSim() {
    const [refInput, setRefInput] = useState('7 0 1 2 0 3 0 4 2 3 0 3 2');
    const [frames, setFrames] = useState(3);
    const [algo, setAlgo] = useState('LRU');
    const [speed, setSpeed] = useState(700);

    const [steps, setSteps] = useState([]);
    const [currentStep, setCurrentStep] = useState(-1);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [isSimMode, setIsSimMode] = useState(false);
    const [conceptMode, setConceptMode] = useState(true);

    const timerRef = useRef(null);
    const stepRef = useRef(-1);
    const stepsRef = useRef([]);

    const buildSteps = () => {
        const refs = refInput.trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
        const fn = algo === 'FIFO' ? runFIFO : algo === 'LRU' ? runLRU : algo === 'Optimal' ? runOptimal : runLFU;
        const result = fn(refs, frames);
        return result.steps || [];
    };

    const advanceStep = useCallback((stepsArr, idx) => {
        const newIdx = idx + 1;
        if (newIdx >= stepsArr.length) {
            setCurrentStep(newIdx - 1); setIsRunning(false); setIsFinished(true);
            clearInterval(timerRef.current); return;
        }
        setCurrentStep(newIdx); stepRef.current = newIdx;
    }, []);

    const handleStart = () => {
        const s = buildSteps();
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
    const refs = refInput.trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    const totalFaults = steps.slice(0, currentStep + 1).filter(s => s?.fault).length;
    const totalHits = steps.slice(0, currentStep + 1).filter(s => !s?.fault).length;
    const hitRate = (currentStep + 1) > 0 ? ((totalHits / (currentStep + 1)) * 100).toFixed(1) : '0.0';

    const exp = curStep
        ? (curStep.fault
            ? EXPLANATIONS.miss(curStep.page, curStep.victim ?? null, algo)
            : EXPLANATIONS.hit(curStep.page))
        : null;

    // Center: Frame table + reference strip
    const centerContent = (
        <div style={{ padding: '0.75rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
            {/* Reference string strip */}
            <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Reference Stream</div>
                <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
                    {refs.map((r, i) => (
                        <motion.div key={i}
                            animate={{
                                scale: i === currentStep ? 1.1 : 1,
                                opacity: i < currentStep ? 0.6 : 1,
                                borderColor: i === currentStep ? 'var(--yellow)' : 'var(--border)'
                            }}
                            style={{
                                minWidth: 36, height: 36, border: '3px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.9rem',
                                background: i === currentStep ? 'var(--yellow)' : i < currentStep ? (steps[i]?.fault ? 'rgba(255, 107, 107, 0.2)' : 'rgba(168, 230, 207, 0.2)') : 'var(--white)',
                                color: i === currentStep ? '#000' : 'inherit',
                                borderRadius: '4px',
                                flexShrink: 0,
                            }}>
                            {r}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Memory Rack — The core visual */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.8rem', letterSpacing: '0.05em' }}>
                    Physical Memory (Page Frames)
                </div>
                <div style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.03)',
                    border: '4px solid var(--border)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '1rem',
                    boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.05)'
                }}>
                    {Array.from({ length: frames }, (_, fi) => {
                        const frameData = curStep?.frames?.[fi];
                        const pageInFrame = frameData?.val ?? null;
                        const isNew = frameData?.new || (curStep?.fault && pageInFrame === curStep?.page);
                        const isVictim = curStep?.victim === pageInFrame && curStep.fault;

                        return (
                            <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.4, width: 30 }}>F{fi}</div>
                                <motion.div
                                    initial={false}
                                    animate={{
                                        backgroundColor: isNew ? 'var(--yellow)' : pageInFrame !== null ? 'var(--cyan)' : 'var(--white)',
                                        x: isNew ? [20, 0] : 0,
                                        scale: isVictim ? 0.95 : 1,
                                        opacity: isVictim ? 0.5 : 1,
                                        boxShadow: isNew ? '0 10px 20px rgba(0,0,0,0.1)' : 'var(--shadow-sm)'
                                    }}
                                    transition={{ type: 'spring', damping: 15 }}
                                    style={{
                                        flex: 1, height: 60, border: '3px solid var(--border)', borderRadius: '8px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem',
                                    }}
                                >
                                    <div style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                                        {pageInFrame ?? ''}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                        {isNew && <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#000', background: 'var(--yellow)', padding: '2px 6px', borderRadius: '4px' }}>{curStep?.fault ? 'LOADED' : 'REFRESHED'}</div>}
                                        {pageInFrame !== null && !isNew && (
                                            <div style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.5 }}>RESIDENT</div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Performance Metrics */}
            <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
                {[
                    { label: 'Faults', val: totalFaults, color: 'var(--pink)', icon: '🔴' },
                    { label: 'Hits', val: totalHits, color: 'var(--green)', icon: '🟢' },
                    { label: 'Hit Rate', val: `${hitRate}%`, color: 'var(--yellow)', icon: '📈' },
                ].map(s => (
                    <div key={s.label} style={{ flex: 1, border: '3px solid var(--border)', borderRadius: '8px', background: s.color, padding: '0.6rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <span>{s.icon}</span> {s.label}
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{s.val}</div>
                    </div>
                ))}
            </div>

            {/* Dynamic Feedback Toast */}
            {curStep && (
                <AnimatePresence mode="wait">
                    <motion.div key={currentStep}
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                        style={{
                            padding: '0.8rem 1.2rem', borderRadius: '12px', border: '4px solid var(--border)', fontWeight: 800, fontSize: '1rem',
                            background: curStep.fault ? 'var(--pink)' : 'var(--green)', boxShadow: 'var(--shadow)', flexShrink: 0,
                            display: 'flex', alignItems: 'center', gap: '10px'
                        }}
                    >
                        <span style={{ fontSize: '1.4rem' }}>{curStep.fault ? '⚠️' : '🎯'}</span>
                        <span>
                            {curStep.fault
                                ? `PAGE FAULT: Page ${curStep.page} fetched from disk.`
                                : `PAGE HIT: Page ${curStep.page} already in memory.`}
                        </span>
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );

    // Left panel
    const leftContent = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', overflow: 'hidden' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Steps</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', flexShrink: 0 }}>
                {steps.slice(0, currentStep + 1).map((s, i) => (
                    <div key={i} style={{
                        width: 22, height: 22, border: '2px solid var(--border)', fontSize: '0.6rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: i === currentStep ? 'var(--yellow)' : s.fault ? 'var(--pink)' : 'var(--green)',
                        flexShrink: 0, fontFamily: 'var(--font-mono)',
                        cursor: 'pointer', title: `Ref ${s.page}`,
                    }} onClick={() => { setCurrentStep(i); stepRef.current = i; }} title={`Step ${i + 1}: page ${s.page}`}>
                        {s.page}
                    </div>
                ))}
            </div>
            <div style={{ height: 2, background: 'var(--border)', flexShrink: 0 }} />
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Algorithm</div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{algo}</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Frames</div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{frames}</div>
        </div>
    );

    // Right panel
    const rightContent = exp && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
            <div style={{
                background: 'var(--yellow)', border: '2px solid var(--border)', padding: '1rem',
                borderRadius: '8px', boxShadow: '3px 3px 0 var(--border)'
            }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6, marginBottom: '0.4rem' }}>
                    What Happened
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.4 }}>
                    {exp.what}
                </div>
            </div>

            <div style={{ border: '2px solid var(--border)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6, marginBottom: '0.5rem' }}>
                    Educational Insight
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8, lineHeight: 1.5 }}>
                    {exp.why}
                </div>
            </div>

            {conceptMode && (
                <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--green)', marginBottom: '0.5rem' }}>
                        💡 Strategy: {algo}
                    </div>
                    <div style={{ fontSize: '0.78rem', background: 'rgba(46, 204, 113, 0.1)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--green)' }}>
                        {exp.insight}
                    </div>
                </div>
            )}

            <div style={{ marginTop: 'auto', borderTop: '2.5px dashed var(--border)', paddingTop: '1rem' }}>
                <div style={{ fontSize: '0.72rem', opacity: 0.7, fontStyle: 'italic', lineHeight: 1.4 }}>
                    {curStep.fault
                        ? '🔴 Each fault triggers disk I/O, which is expensive. Minimizing faults is the primary goal of paging algorithms.'
                        : '🟢 A Page Hit means the data was already in memory. These are much faster than faults.'}
                </div>
            </div>
        </div>
    );

    const timelineItems = refs.map((r, i) => ({
        id: i, label: `P${r}`, done: i < currentStep, active: i === currentStep,
    }));

    const LEGEND = [
        { color: 'var(--pink)', label: 'Fault' },
        { color: 'var(--green)', label: 'Hit' },
        { color: 'var(--cyan)', label: 'In Memory' },
        { color: 'var(--yellow)', label: 'Current' },
    ];

    return (
        <ImmersiveLayout
            isActive={isSimMode}
            title={`${algo} Paging`}
            icon="📄"
            moduleLabel="OS Module"
            isRunning={isRunning} isPaused={isPaused} isFinished={isFinished}
            speed={speed} onSpeedChange={setSpeed}
            onStart={handleStart} onPause={handlePause} onResume={handleResume}
            onReset={handleReset} onStep={handleStep}
            currentStepNum={Math.max(0, currentStep + 1)} totalSteps={refs.length}
            phaseName={curStep ? `Page ${curStep.page} — ${curStep.fault ? 'FAULT' : 'HIT'}` : 'Ready'}
            centerContent={centerContent}
            leftContent={leftContent}
            rightContent={rightContent}
            timelineItems={timelineItems}
            legend={LEGEND}
            conceptMode={conceptMode}
            onConceptModeToggle={() => setConceptMode(!conceptMode)}
        >
            {/* Config Mode */}
            <div className="main-content">
                <div style={{ marginBottom: '0.4rem' }}>
                    <Link to="/os" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← OS Module</Link>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="section-header">OS · Memory Management</div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 700 }}>📄 Page Replacement Simulator</h1>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '0.3rem' }}>Configure and launch an immersive, step-by-step visualization of page replacement algorithms.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                    <div className="panel">
                        <div className="panel-header">⚙ Configuration</div>
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <label className="form-label">Reference String (space separated)</label>
                                <input className="form-input" value={refInput} onChange={e => setRefInput(e.target.value)} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label className="form-label">Number of Frames</label>
                                    <input type="number" className="form-input" value={frames} min={1} max={8} onChange={e => setFrames(+e.target.value || 3)} />
                                </div>
                                <div>
                                    <label className="form-label">Algorithm</label>
                                    <select className="form-select" value={algo} onChange={e => setAlgo(e.target.value)}>
                                        {ALGOS.map(a => <option key={a}>{a}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Speed</label>
                                <select className="form-select" value={speed} onChange={e => setSpeed(+e.target.value)}>
                                    <option value={1400}>0.5×</option><option value={700}>1×</option><option value={350}>2×</option><option value={150}>4×</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="panel">
                        <div className="panel-header">📋 About the Algorithms</div>
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                            {[
                                { name: 'FIFO', desc: 'Evict the oldest page. Simple but prone to Belady\'s Anomaly.' },
                                { name: 'LRU', desc: 'Evict the least recently used page. Great temporal locality.' },
                                { name: 'Optimal', desc: 'Evict the page used farthest in future. Theoretical benchmark.' },
                                { name: 'LFU', desc: 'Evict the least frequently used page. Good for frequency patterns.' },
                            ].map(a => (
                                <div key={a.name} style={{ padding: '0.4rem 0.6rem', border: '2px solid var(--border)', background: a.name === algo ? 'var(--yellow)' : 'var(--white)', cursor: 'pointer' }}
                                    onClick={() => setAlgo(a.name)}>
                                    <strong>{a.name}</strong> — <span style={{ opacity: 0.7 }}>{a.desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-yellow btn-lg" onClick={handleStart}>▶ Launch Simulation</button>
                    <button className="btn btn-sm" style={{ marginTop: '0.15rem' }} onClick={handleStep}>⏭ Step Through</button>
                </div>
            </div>
        </ImmersiveLayout>
    );
}
