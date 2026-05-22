import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import { runDiskFCFS, runDiskSSTF, runDiskSCAN, runDiskCSCAN } from './diskScheduling';

const ALGOS = ['FCFS', 'SSTF', 'SCAN', 'C-SCAN'];
const TRACK_MAX = 199;

const ALGO_INFO = {
    FCFS:     { desc: 'Serves requests in arrival order. Simple but causes large head movement.', trade: 'No starvation, but poor performance when requests are scattered.' },
    SSTF:     { desc: 'Always serves the closest request next. Minimises each individual seek.', trade: 'Can starve distant requests if nearby ones keep arriving.' },
    SCAN:     { desc: 'Head sweeps end-to-end like an elevator, serving all requests it passes.', trade: 'No starvation. Requests near the middle are favoured.' },
    'C-SCAN': { desc: 'One-directional SCAN — serves one way, then jumps back to start.', trade: 'More uniform wait times than SCAN.' },
};

/* one accent colour per algorithm, all from the project palette */
const ALGO_BG = {
    FCFS:     'var(--cyan)',
    SSTF:     'var(--pink)',
    SCAN:     'var(--green)',
    'C-SCAN': 'var(--yellow)',
};

export default function DiskSchedulingSim() {
    const [requestInput, setRequestInput] = useState('98 183 37 122 14 124 65 67');
    const [initialHead, setInitialHead] = useState(53);
    const [algo, setAlgo] = useState('SSTF');
    const [speed, setSpeed] = useState(600);

    const [steps, setSteps]               = useState([]);
    const [currentStep, setCurrentStep]   = useState(-1);
    const [isRunning, setIsRunning]       = useState(false);
    const [isPaused, setIsPaused]         = useState(false);
    const [isFinished, setIsFinished]     = useState(false);
    const [isSimMode, setIsSimMode]       = useState(false);

    const timerRef = useRef(null);
    const stepRef  = useRef(-1);
    const stepsRef = useRef([]);

    const parseRequests = () =>
        requestInput.trim().split(/[\s,]+/).map(Number)
            .filter(n => !isNaN(n) && n >= 0 && n <= TRACK_MAX);

    const runAlgo = (reqs, head) => {
        switch (algo) {
            case 'SSTF':   return runDiskSSTF(reqs, head);
            case 'SCAN':   return runDiskSCAN(reqs, head);
            case 'C-SCAN': return runDiskCSCAN(reqs, head);
            default:       return runDiskFCFS(reqs, head);
        }
    };

    const advanceStep = useCallback((stepsArr, idx) => {
        const next = idx + 1;
        if (next >= stepsArr.length) {
            setCurrentStep(next - 1); setIsRunning(false); setIsFinished(true);
            clearInterval(timerRef.current); return;
        }
        setCurrentStep(next); stepRef.current = next;
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
    const handlePause  = () => { setIsRunning(false); setIsPaused(true); clearInterval(timerRef.current); };
    const handleResume = () => {
        setIsRunning(true); setIsPaused(false);
        timerRef.current = setInterval(() => advanceStep(stepsRef.current, stepRef.current), speed);
    };
    const handleReset  = () => {
        clearInterval(timerRef.current); setSteps([]); stepsRef.current = [];
        setCurrentStep(-1); stepRef.current = -1;
        setIsRunning(false); setIsPaused(false); setIsFinished(false); setIsSimMode(false);
    };
    const handleStep   = () => {
        setIsSimMode(true);
        if (stepsRef.current.length === 0) {
            const reqs = parseRequests();
            const { steps: s } = runAlgo(reqs, initialHead);
            stepsRef.current = s; setSteps(s);
        }
        advanceStep(stepsRef.current, stepRef.current);
    };

    const reqs      = parseRequests();
    const curStep   = currentStep >= 0 ? steps[currentStep] : null;
    const headPos   = curStep ? curStep.target : initialHead;
    const headPct   = (headPos / TRACK_MAX) * 100;
    const accentBg  = ALGO_BG[algo] || 'var(--cyan)';

    const visited = [{ pos: initialHead }];
    for (let i = 0; i <= currentStep && i < steps.length; i++) {
        if (steps[i]) visited.push({ pos: steps[i].target });
    }
    const servedSet = new Set(steps.slice(0, currentStep + 1).map(s => s.target));

    /* ══════════════════════════════════════════════════════════
       CENTER VISUALIZER
    ══════════════════════════════════════════════════════════ */
    const CENTER = (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--white)', overflow: 'hidden' }}>

            {/* ── HEADER: algo name + live stats ── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '0.6rem 1.25rem',
                background: accentBg,
                borderBottom: '3px solid var(--border)',
                flexShrink: 0,
            }}>
                <span style={{ fontWeight: 900, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    {algo}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, opacity: 0.7, flex: 1 }}>
                    {ALGO_INFO[algo].desc}
                </span>
                {curStep && (
                    <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
                        {[
                            { label: 'HEAD', val: headPos },
                            { label: 'SEEK', val: `${curStep.seekDist} cyl` },
                            { label: 'TOTAL', val: `${curStep.totalSeek} cyl` },
                        ].map(c => (
                            <div key={c.label} style={{
                                background: 'var(--white)', border: '2px solid var(--border)',
                                padding: '2px 10px', boxShadow: '2px 2px 0 var(--border)',
                                textAlign: 'center',
                            }}>
                                <div style={{ fontSize: '0.52rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.55 }}>{c.label}</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.85rem' }}>{c.val}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── DISK TRACK ── */}
            <div style={{ flexShrink: 0, padding: '1.25rem 1.5rem 0.75rem', position: 'relative' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.4, marginBottom: '0.6rem', letterSpacing: '0.08em' }}>
                    Disk Track  0 — {TRACK_MAX}
                </div>

                {/* track + head area */}
                <div style={{ position: 'relative', height: 80 }}>
                    {/* grid lines */}
                    {[0, 25, 50, 75, 100, 125, 150, 175, 199].map(t => (
                        <div key={t} style={{
                            position: 'absolute', top: 0, bottom: 0,
                            left: `${(t / TRACK_MAX) * 100}%`,
                            width: 1, background: 'rgba(0,0,0,0.06)',
                        }} />
                    ))}

                    {/* SVG seek-path trail */}
                    <svg
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
                        preserveAspectRatio="none"
                    >
                        {visited.length > 1 && visited.map((v, i) => {
                            if (i === 0) return null;
                            const x1 = `${(visited[i - 1].pos / TRACK_MAX) * 100}%`;
                            const x2 = `${(v.pos / TRACK_MAX) * 100}%`;
                            const isLatest = i === visited.length - 1;
                            return (
                                <motion.line
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    x1={x1} y1="50%" x2={x2} y2="50%"
                                    stroke={isLatest ? 'var(--border)' : 'rgba(0,0,0,0.18)'}
                                    strokeWidth={isLatest ? 3 : 1.5}
                                    strokeDasharray={isLatest ? 'none' : '4 3'}
                                    strokeLinecap="round"
                                />
                            );
                        })}
                    </svg>

                    {/* rail */}
                    <div style={{
                        position: 'absolute', top: '50%', left: 0, right: 0,
                        height: 4, background: 'var(--border)', transform: 'translateY(-50%)',
                    }} />

                    {/* pending pins */}
                    {reqs.filter(r => !servedSet.has(r)).map((r, i) => (
                        <div key={i} style={{
                            position: 'absolute', left: `${(r / TRACK_MAX) * 100}%`,
                            top: '50%', transform: 'translate(-50%, -50%)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                        }}>
                            <div style={{
                                width: 14, height: 14, borderRadius: '50%',
                                background: 'var(--cyan)', border: '2px solid var(--border)',
                                boxShadow: '1px 1px 0 var(--border)',
                            }} />
                            <div style={{ fontSize: '0.5rem', fontWeight: 800, marginTop: 2, fontFamily: 'var(--font-mono)' }}>{r}</div>
                        </div>
                    ))}

                    {/* served dots */}
                    {steps.slice(0, currentStep + 1).map((s, i) => {
                        const isLatest = i === currentStep;
                        return (
                            <motion.div
                                key={i}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                style={{
                                    position: 'absolute', left: `${(s.target / TRACK_MAX) * 100}%`,
                                    top: '50%', transform: 'translate(-50%, -50%)',
                                    zIndex: isLatest ? 4 : 3,
                                }}
                            >
                                <div style={{
                                    width: isLatest ? 18 : 12, height: isLatest ? 18 : 12,
                                    borderRadius: '50%',
                                    background: isLatest ? accentBg : 'var(--green)',
                                    border: '2px solid var(--border)',
                                    boxShadow: isLatest ? '3px 3px 0 var(--border)' : '1px 1px 0 var(--border)',
                                    transition: 'all 0.3s',
                                }} />
                            </motion.div>
                        );
                    })}

                    {/* READ HEAD */}
                    <motion.div
                        animate={{ left: `${headPct}%` }}
                        transition={{ duration: speed > 0 ? speed / 1000 : 0.4, ease: 'easeInOut' }}
                        style={{
                            position: 'absolute', top: 0, bottom: 0,
                            transform: 'translateX(-50%)',
                            zIndex: 10, pointerEvents: 'none',
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                        }}
                    >
                        {/* vertical needle */}
                        <div style={{
                            width: 3, height: '100%', background: 'var(--border)',
                            position: 'absolute', top: 0,
                        }} />
                        {/* label badge */}
                        <div style={{
                            position: 'absolute', top: 4,
                            background: accentBg,
                            border: '2px solid var(--border)',
                            boxShadow: '2px 2px 0 var(--border)',
                            padding: '3px 8px',
                            fontWeight: 900, fontSize: '0.7rem',
                            fontFamily: 'var(--font-mono)',
                            whiteSpace: 'nowrap',
                        }}>
                            {headPos}
                        </div>
                    </motion.div>
                </div>

                {/* tick labels */}
                <div style={{ position: 'relative', height: 18 }}>
                    {[0, 50, 100, 150, 199].map(t => (
                        <div key={t} style={{
                            position: 'absolute', left: `${(t / TRACK_MAX) * 100}%`,
                            transform: 'translateX(-50%)',
                            fontSize: '0.58rem', fontWeight: 700, opacity: 0.45,
                            fontFamily: 'var(--font-mono)',
                        }}>{t}</div>
                    ))}
                </div>
            </div>

            {/* ── SEEK DISTANCE BAR CHART ── */}
            <div style={{
                flexShrink: 0, margin: '0 1.5rem',
                border: '3px solid var(--border)', background: 'var(--bg)',
                boxShadow: '3px 3px 0 var(--border)',
            }}>
                <div style={{
                    background: 'var(--border)', color: 'var(--bg)',
                    padding: '3px 10px', fontSize: '0.6rem', fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                    Seek Distance Per Step
                </div>
                <div style={{
                    display: 'flex', alignItems: 'flex-end', gap: 3,
                    padding: '0.5rem 0.75rem 0.4rem', minHeight: 72,
                }}>
                    {steps.slice(0, currentStep + 1).map((s, i) => {
                        const maxSeek = Math.max(...steps.map(x => x.seekDist), 1);
                        const h = Math.max(6, (s.seekDist / maxSeek) * 56);
                        const isLatest = i === currentStep;
                        return (
                            <motion.div
                                key={i}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: h, opacity: 1 }}
                                style={{
                                    flex: 1, minWidth: 10, maxWidth: 48,
                                    background: isLatest ? accentBg : 'var(--white)',
                                    border: '2px solid var(--border)',
                                    boxShadow: isLatest ? '2px 2px 0 var(--border)' : '1px 1px 0 var(--border)',
                                    position: 'relative', cursor: 'default',
                                }}
                                title={`Step ${i + 1}: ${s.head}→${s.target}, seek=${s.seekDist}`}
                            >
                                {isLatest && (
                                    <div style={{
                                        position: 'absolute', bottom: '100%', left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: 'var(--border)', color: 'var(--bg)',
                                        fontSize: '0.55rem', fontWeight: 900,
                                        padding: '2px 5px', whiteSpace: 'nowrap',
                                        marginBottom: 2,
                                    }}>{s.seekDist}</div>
                                )}
                            </motion.div>
                        );
                    })}
                    {steps.slice(0, currentStep + 1).length === 0 && (
                        <div style={{ width: '100%', textAlign: 'center', fontSize: '0.72rem', opacity: 0.3, padding: '1rem 0' }}>
                            Seek history will appear here…
                        </div>
                    )}
                </div>
            </div>

            {/* ── PATH SEQUENCE STRIP ── */}
            <div style={{
                flexShrink: 0, margin: '0.75rem 1.5rem 1rem',
                border: '3px solid var(--border)',
                boxShadow: '3px 3px 0 var(--border)',
                overflow: 'hidden',
            }}>
                <div style={{
                    background: 'var(--border)', color: 'var(--bg)',
                    padding: '3px 10px', fontSize: '0.6rem', fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                    Head Path
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.5rem 0.75rem', overflowX: 'auto',
                    scrollbarWidth: 'thin', background: 'var(--bg)',
                }}>
                    {visited.map((v, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                            <div style={{
                                padding: '3px 12px',
                                background: i === visited.length - 1 ? accentBg : 'var(--white)',
                                border: '2px solid var(--border)',
                                boxShadow: i === visited.length - 1 ? '2px 2px 0 var(--border)' : '1px 1px 0 var(--border)',
                                fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 900,
                            }}>{v.pos}</div>
                            {i < visited.length - 1 && (
                                <span style={{ fontSize: '0.75rem', fontWeight: 900, opacity: 0.35 }}>→</span>
                            )}
                        </div>
                    ))}
                    {visited.length === 1 && (
                        <span style={{ fontSize: '0.75rem', opacity: 0.3, fontStyle: 'italic' }}>Simulation not started…</span>
                    )}
                </div>
            </div>
        </div>
    );

    /* ── LEFT panel ── */
    const LEFT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>Algorithm</div>
            <div style={{ fontWeight: 900, fontSize: '1rem' }}>{algo}</div>

            <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>Head Position</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1rem' }}>{headPos}</div>

            {curStep && <>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>Seek Distance</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>{curStep.seekDist} cyl</div>

                <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>Total Seek</div>
                <div style={{
                    background: accentBg, border: '2px solid var(--border)',
                    padding: '4px 10px', fontFamily: 'var(--font-mono)', fontWeight: 900,
                    boxShadow: '2px 2px 0 var(--border)', display: 'inline-block',
                }}>{curStep.totalSeek} cyl</div>
            </>}

            <div style={{ height: 2, background: 'var(--border)' }} />

            <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>Pending</div>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {reqs.filter(r => !servedSet.has(r)).map((r, i) => (
                    <span key={i} style={{
                        background: 'var(--cyan)', border: '2px solid var(--border)',
                        padding: '2px 8px', fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem', fontWeight: 800,
                        boxShadow: '1px 1px 0 var(--border)',
                    }}>{r}</span>
                ))}
            </div>

            <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>Served</div>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {steps.slice(0, currentStep + 1).map((s, i) => (
                    <span key={i} style={{
                        background: 'var(--green)', border: '2px solid var(--border)',
                        padding: '2px 8px', fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem', fontWeight: 800,
                        boxShadow: '1px 1px 0 var(--border)',
                    }}>{s.target}</span>
                ))}
            </div>
        </div>
    );

    /* ── RIGHT panel ── */
    const RIGHT = curStep ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>Move</div>
            <div style={{ fontSize: '0.85rem', lineHeight: 1.6, borderLeft: '3px solid var(--border)', paddingLeft: '0.6rem' }}>
                Head moved <strong>{curStep.head}</strong> → <strong>{curStep.target}</strong><br />
                <span style={{ opacity: 0.6, fontSize: '0.78rem' }}>Seek: {curStep.seekDist} cylinders</span>
            </div>

            <div style={{ height: 2, background: 'var(--border)' }} />

            <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>{algo} Strategy</div>
            <div style={{
                background: 'var(--yellow)', border: '2px solid var(--border)',
                padding: '0.6rem 0.75rem', boxShadow: '3px 3px 0 var(--border)',
                fontSize: '0.78rem', lineHeight: 1.55, fontWeight: 600,
            }}>{ALGO_INFO[algo].desc}</div>

            <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>Trade-off</div>
            <div style={{ fontSize: '0.78rem', lineHeight: 1.5, opacity: 0.8 }}>{ALGO_INFO[algo].trade}</div>

            <div style={{ height: 2, background: 'var(--border)' }} />

            <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>Progress</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.85rem' }}>
                {currentStep + 1} / {steps.length} requests
            </div>
            <div style={{ height: 10, background: 'var(--bg)', border: '2px solid var(--border)', overflow: 'hidden' }}>
                <motion.div
                    animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    style={{ height: '100%', background: accentBg }}
                />
            </div>
        </div>
    ) : null;

    const TL = reqs.map((r, i) => ({
        id: i, label: `${r}`,
        done: steps.slice(0, currentStep + 1).some(s => s.target === r),
        active: curStep?.target === r,
    }));

    return (
        <ImmersiveLayout
            isActive={isSimMode}
            title="Disk Scheduling" icon="D" moduleLabel="OS Module"
            isRunning={isRunning} isPaused={isPaused} isFinished={isFinished}
            speed={speed} onSpeedChange={setSpeed}
            onStart={handleStart} onPause={handlePause} onResume={handleResume}
            onReset={handleReset} onStep={handleStep}
            currentStepNum={Math.max(0, currentStep + 1)} totalSteps={reqs.length}
            phaseName={curStep ? `${curStep.head} → ${curStep.target}  (seek ${curStep.seekDist})` : ''}
            centerContent={CENTER} leftContent={LEFT} rightContent={RIGHT}
            timelineItems={TL}
            legend={[
                { color: accentBg,       label: 'Head' },
                { color: 'var(--cyan)',   label: 'Pending' },
                { color: 'var(--green)',  label: 'Served' },
            ]}
        >
            {/* ── CONFIG SCREEN ── */}
            <div className="main-content">
                <div style={{ marginBottom: '0.4rem' }}>
                    <Link to="/os" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← OS Module</Link>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="section-header">OS · I/O Scheduling</div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 700 }}>Disk Scheduling Simulator</h1>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '0.3rem' }}>
                        Pick an algorithm, set the disk head and requests, then watch the head sweep live with seek-distance history.
                    </p>
                </div>

                {/* Algorithm selector */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {ALGOS.map(a => (
                        <button key={a} onClick={() => setAlgo(a)} style={{
                            padding: '0.85rem', cursor: 'pointer',
                            border: `3px solid var(--border)`,
                            background: algo === a ? ALGO_BG[a] : 'var(--white)',
                            boxShadow: algo === a ? '4px 4px 0 var(--border)' : '2px 2px 0 var(--border)',
                            textAlign: 'left', transition: 'all 0.12s',
                            transform: algo === a ? 'translate(-1px,-1px)' : 'none',
                            fontFamily: 'var(--font-main)',
                        }}>
                            <div style={{ fontWeight: 900, fontSize: '0.95rem', marginBottom: 4 }}>{a}</div>
                            <div style={{ fontSize: '0.68rem', opacity: 0.65, lineHeight: 1.4 }}>
                                {ALGO_INFO[a].desc.slice(0, 55)}…
                            </div>
                        </button>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                    <div className="panel">
                        <div className="panel-header">Disk Requests (0 – 199)</div>
                        <div style={{ padding: '1rem' }}>
                            <input className="form-input" value={requestInput}
                                onChange={e => setRequestInput(e.target.value)}
                                placeholder="e.g. 98 183 37 122 14" />
                            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                {reqs.map((r, i) => (
                                    <span key={i} style={{
                                        background: 'var(--cyan)', border: '2px solid var(--border)',
                                        padding: '2px 10px', fontFamily: 'var(--font-mono)',
                                        fontSize: '0.75rem', fontWeight: 800,
                                        boxShadow: '1px 1px 0 var(--border)',
                                    }}>{r}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="panel">
                        <div className="panel-header">Initial Head Position</div>
                        <div style={{ padding: '1rem' }}>
                            <input type="number" className="form-input" value={initialHead}
                                min={0} max={TRACK_MAX}
                                onChange={e => setInitialHead(Math.min(TRACK_MAX, Math.max(0, +e.target.value || 0)))} />
                            {/* mini preview track */}
                            <div style={{ marginTop: '0.85rem', position: 'relative', height: 20, background: 'var(--bg)', border: '3px solid var(--border)' }}>
                                <div style={{
                                    position: 'absolute', top: 0, bottom: 0,
                                    left: `${(initialHead / TRACK_MAX) * 100}%`,
                                    transform: 'translateX(-50%)',
                                    width: 18, background: ALGO_BG[algo],
                                    border: '2px solid var(--border)',
                                    transition: 'left 0.2s',
                                }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                {[0, 50, 100, 150, 199].map(t => (
                                    <span key={t} style={{ fontSize: '0.55rem', fontWeight: 700, opacity: 0.45, fontFamily: 'var(--font-mono)' }}>{t}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-yellow btn-lg" onClick={handleStart}>▶ Launch Simulation</button>
                    <button className="btn btn-sm" onClick={handleStep}>Step Through</button>
                </div>
            </div>
        </ImmersiveLayout>
    );
}
