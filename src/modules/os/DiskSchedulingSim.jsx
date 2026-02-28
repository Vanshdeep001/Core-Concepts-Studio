import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import { runDiskFCFS, runDiskSSTF, runDiskSCAN, runDiskCSCAN } from './diskScheduling';

const ALGOS = ['FCFS', 'SSTF', 'SCAN', 'C-SCAN'];
const TRACK_MAX = 199;

const ALGO_INFO = {
    FCFS: { desc: 'Serves requests in order of arrival. Simple but high seek time.', insight: 'No starvation but poor performance on scattered requests.' },
    SSTF: { desc: 'Serves the closest request first. Minimizes seek time per move.', insight: 'Can cause starvation for requests far from the current head position.' },
    SCAN: { desc: 'Head sweeps across the disk like an elevator, serving all requests it passes.', insight: 'No starvation. Favors requests in the middle of the disk.' },
    'C-SCAN': { desc: 'Like SCAN but only serves requests in one direction, then jumps to start.', insight: 'More uniform wait times than SCAN. No favoritism toward middle requests.' },
};

export default function DiskSchedulingSim() {
    const [requestInput, setRequestInput] = useState('98 183 37 122 14 124 65 67');
    const [initialHead, setInitialHead] = useState(53);
    const [algo, setAlgo] = useState('SSTF');
    const [speed, setSpeed] = useState(600);

    const [steps, setSteps] = useState([]);
    const [currentStep, setCurrentStep] = useState(-1);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [isSimMode, setIsSimMode] = useState(false);

    const timerRef = useRef(null);
    const stepRef = useRef(-1);
    const stepsRef = useRef([]);

    const parseRequests = () => requestInput.trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n) && n >= 0 && n <= TRACK_MAX);

    const runAlgo = (reqs, head) => {
        switch (algo) {
            case 'SSTF': return runDiskSSTF(reqs, head);
            case 'SCAN': return runDiskSCAN(reqs, head);
            case 'C-SCAN': return runDiskCSCAN(reqs, head);
            default: return runDiskFCFS(reqs, head);
        }
    };

    const advanceStep = useCallback((stepsArr, idx) => {
        const newIdx = idx + 1;
        if (newIdx >= stepsArr.length) { setCurrentStep(newIdx - 1); setIsRunning(false); setIsFinished(true); clearInterval(timerRef.current); return; }
        setCurrentStep(newIdx); stepRef.current = newIdx;
    }, []);

    const handleStart = () => {
        const reqs = parseRequests();
        const { steps: s } = runAlgo(reqs, initialHead);
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
    const reqs = parseRequests();
    const headPos = curStep ? curStep.target : initialHead;
    const headPct = (headPos / TRACK_MAX) * 100;

    // Path visited
    const visited = [{ pos: initialHead }];
    for (let i = 0; i <= currentStep && i < steps.length; i++) {
        if (steps[i]) visited.push({ pos: steps[i].target });
    }

    const CENTER = (
        <div style={{ padding: '0.75rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Disk track */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5, marginBottom: '1rem' }}>
                    Disk Track (0 – {TRACK_MAX})
                </div>
                <div style={{ position: 'relative', height: 60, marginBottom: '2.5rem' }}>
                    {/* Track line */}
                    <div style={{ position: 'absolute', top: '45%', left: 0, right: 0, height: 4, background: 'var(--border)' }} />
                    {/* Ticks */}
                    {[0, 50, 100, 150, 199].map(tick => (
                        <div key={tick} style={{ position: 'absolute', left: `${(tick / TRACK_MAX) * 100}%`, top: '40%', transform: 'translateX(-50%)' }}>
                            <div style={{ width: 2, height: 14, background: 'var(--border)', margin: '0 auto' }} />
                            <div style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.5, textAlign: 'center', marginTop: 2 }}>{tick}</div>
                        </div>
                    ))}
                    {/* Pending requests */}
                    {reqs.filter(r => steps.slice(0, currentStep + 1).every(s => s.target !== r)).map((r, i) => (
                        <div key={i} style={{ position: 'absolute', left: `${(r / TRACK_MAX) * 100}%`, top: '30%', transform: 'translateX(-50%)' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--cyan)', border: '2px solid var(--border)' }} />
                        </div>
                    ))}
                    {/* Served */}
                    {steps.slice(0, currentStep + 1).map((s, i) => (
                        <div key={i} style={{ position: 'absolute', left: `${(s.target / TRACK_MAX) * 100}%`, top: '30%', transform: 'translateX(-50%)' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green)', border: '2px solid var(--border)' }} />
                        </div>
                    ))}
                    {/* Head */}
                    <motion.div animate={{ left: `${headPct}%` }} transition={{ duration: 0.4, ease: 'easeInOut' }}
                        style={{ position: 'absolute', top: '5%', transform: 'translateX(-50%)', width: 24, height: 48, background: 'var(--yellow)', border: '3px solid var(--border)', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, zIndex: 5 }}>
                        ↕
                    </motion.div>
                </div>

                {/* Path */}
                {visited.length > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.6 }}>Path:</span>
                        {visited.map((v, i) => (
                            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                                <span style={{ background: i === visited.length - 1 ? 'var(--yellow)' : 'var(--white)', border: '2px solid var(--border)', padding: '0.1rem 0.35rem', fontWeight: 700 }}>{v.pos}</span>
                                {i < visited.length - 1 && <span style={{ opacity: 0.4 }}>→</span>}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Seek table */}
            {currentStep >= 0 && (
                <div style={{ maxHeight: 160, overflowY: 'auto', border: '2px solid var(--border)' }}>
                    <table className="neo-table" style={{ fontSize: '0.78rem' }}>
                        <thead><tr><th>#</th><th>From</th><th>To</th><th>Seek</th><th>Total</th></tr></thead>
                        <tbody>
                            {steps.slice(0, currentStep + 1).map((s, i) => (
                                <tr key={i} style={{ background: i === currentStep ? 'rgba(255,217,61,0.3)' : '' }}>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{i + 1}</td>
                                    <td style={{ fontFamily: 'var(--font-mono)' }}>{s.head}</td>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{s.target}</td>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{s.seekDist}</td>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'green' }}>{s.totalSeek}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {curStep && (
                <div style={{ background: 'var(--yellow)', border: '2px solid var(--border)', padding: '0.4rem 0.75rem', fontWeight: 700, fontSize: '0.88rem', flexShrink: 0 }}>
                    Head: {curStep.head} → {curStep.target} &nbsp;|&nbsp; Seek: {curStep.seekDist} &nbsp;|&nbsp; Total: {curStep.totalSeek}
                </div>
            )}
        </div>
    );

    const LEFT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', height: '100%', overflow: 'hidden' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Algorithm</div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{algo}</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Initial Head</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>{initialHead}</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Pending Requests</div>
            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                {reqs.filter(r => steps.slice(0, currentStep + 1).every(s => s.target !== r)).map((r, i) => (
                    <div key={i} style={{ background: 'var(--cyan)', border: '2px solid var(--border)', padding: '0.15rem 0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700 }}>{r}</div>
                ))}
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Served</div>
            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                {steps.slice(0, currentStep + 1).map((s, i) => (
                    <div key={i} style={{ background: 'var(--green)', border: '2px solid var(--border)', padding: '0.15rem 0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700 }}>{s.target}</div>
                ))}
            </div>
            {curStep && <div style={{ marginTop: 'auto', background: 'var(--yellow)', border: '2px solid var(--border)', padding: '0.4rem 0.5rem', fontSize: '0.78rem', fontWeight: 700 }}>Total Seek: {curStep.totalSeek} cyl.</div>}
        </div>
    );

    const info = ALGO_INFO[algo];
    const RIGHT = curStep ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', overflow: 'hidden' }}>
            <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.55, marginBottom: '0.3rem' }}>What Happened</div>
                <div style={{ fontSize: '0.82rem', lineHeight: 1.55, borderLeft: '3px solid var(--yellow)', paddingLeft: '0.6rem' }}>
                    Head moved from <strong>{curStep.head}</strong> to <strong>{curStep.target}</strong> — seek distance: <strong>{curStep.seekDist}</strong> cylinders.
                </div>
            </div>
            <div style={{ height: 2, background: 'var(--border)' }} />
            <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.55, marginBottom: '0.3rem' }}>💡 {algo} Strategy</div>
                <div style={{ background: 'var(--yellow)', border: '2px solid var(--border)', padding: '0.5rem 0.6rem', fontSize: '0.78rem', lineHeight: 1.5 }}>
                    {info.desc}
                </div>
            </div>
            <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.55, marginBottom: '0.3rem' }}>❓ Trade-off</div>
                <div style={{ fontSize: '0.78rem', lineHeight: 1.5, opacity: 0.8 }}>{info.insight}</div>
            </div>
        </div>
    ) : null;

    const TL = reqs.map((r, i) => ({ id: i, label: `${r}`, done: steps.slice(0, currentStep + 1).some(s => s.target === r), active: curStep?.target === r }));

    return (
        <ImmersiveLayout isActive={isSimMode} title="Disk Scheduling" icon="💿" moduleLabel="OS Module"
            isRunning={isRunning} isPaused={isPaused} isFinished={isFinished} speed={speed} onSpeedChange={setSpeed}
            onStart={handleStart} onPause={handlePause} onResume={handleResume} onReset={handleReset} onStep={handleStep}
            currentStepNum={Math.max(0, currentStep + 1)} totalSteps={reqs.length}
            phaseName={curStep ? `Head ${curStep.head} → ${curStep.target} (seek ${curStep.seekDist})` : ''}
            centerContent={CENTER} leftContent={LEFT} rightContent={RIGHT}
            timelineItems={TL}
            legend={[{ color: 'var(--yellow)', label: 'Head' }, { color: 'var(--cyan)', label: 'Pending' }, { color: 'var(--green)', label: 'Served' }]}>
            <div className="main-content">
                <div style={{ marginBottom: '0.4rem' }}><Link to="/os" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← OS Module</Link></div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="section-header">OS · I/O Scheduling</div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 700 }}>💿 Disk Scheduling Simulator</h1>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '0.3rem' }}>Configure the disk head, requests, and algorithm — then watch it sweep the track live.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                    <div className="panel">
                        <div className="panel-header">⚙ Configuration</div>
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div><label className="form-label">Disk Requests (0–199)</label><input className="form-input" value={requestInput} onChange={e => setRequestInput(e.target.value)} /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div><label className="form-label">Initial Head (0–199)</label><input type="number" className="form-input" value={initialHead} min={0} max={TRACK_MAX} onChange={e => setInitialHead(Math.min(TRACK_MAX, Math.max(0, +e.target.value || 0)))} /></div>
                                <div><label className="form-label">Algorithm</label><select className="form-select" value={algo} onChange={e => setAlgo(e.target.value)}>{ALGOS.map(a => <option key={a}>{a}</option>)}</select></div>
                            </div>
                        </div>
                    </div>
                    <div className="panel">
                        <div className="panel-header">📋 Algorithm Info</div>
                        <div style={{ padding: '1rem', fontSize: '0.85rem' }}>
                            <strong>{algo}:</strong> {ALGO_INFO[algo].desc}
                            <div style={{ marginTop: '0.5rem', opacity: 0.7 }}>Trade-off: {ALGO_INFO[algo].insight}</div>
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
