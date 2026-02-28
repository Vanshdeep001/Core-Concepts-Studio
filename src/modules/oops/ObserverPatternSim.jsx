import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';

// ── UTILS ──
const hexGlow = (color) => `0 0 15px ${color}, 0 0 5px ${color}`;

const DEFAULT_PROGRAM = `// Build your Observer scenario
add Display
add Logger
add Email
notify "Price: $100"
remove Email
notify "Price: $120"
`;

// ── CORE LOGIC ──

function buildPulseSteps(program) {
    const lines = program.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));
    const steps = [];
    let currentObservers = []; // List of names

    steps.push({
        phase: 'System Initialization',
        action: 'init',
        observers: [],
        explanation: 'The Subject is ready. No observers registered yet.',
        insight: 'The Subject holds a private list of Observer references.',
        insightTitle: 'Clean Slate'
    });

    lines.forEach((line) => {
        const parts = line.split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const arg = parts.slice(1).join(' ').replace(/['"]/g, '');

        if (cmd === 'add') {
            currentObservers = [...currentObservers, arg];
            steps.push({
                phase: `Register: ${arg}`,
                action: 'add',
                target: arg,
                observers: [...currentObservers],
                explanation: `${arg} added to the subject's subscription list.`,
                insight: 'Dynamic registration allows observers to join at runtime.',
                insightTitle: 'Subscription'
            });
        } else if (cmd === 'remove') {
            currentObservers = currentObservers.filter(o => o !== arg);
            steps.push({
                phase: `Unregister: ${arg}`,
                action: 'remove',
                target: arg,
                observers: [...currentObservers],
                explanation: `${arg} removed. It will no longer receive updates.`,
                insight: 'Unsubscribing prevents memory leaks and unnecessary updates.',
                insightTitle: 'Detach'
            });
        } else if (cmd === 'notify') {
            steps.push({
                phase: 'Notification Start',
                action: 'notify-start',
                payload: arg,
                observers: [...currentObservers],
                explanation: `Subject state changed to "${arg}". Preparation for broadcast...`,
                insight: 'The Subject only knows it must notify "all", not what each one does.',
                insightTitle: 'Broadcasting'
            });

            currentObservers.forEach((obs, idx) => {
                steps.push({
                    phase: `Update: ${obs}`,
                    action: 'update',
                    target: obs,
                    payload: arg,
                    observers: [...currentObservers],
                    explanation: `${obs}.update("${arg}") called. Observer reacts to new data.`,
                    insight: `Observer ${idx + 1} synchronized with Subject state.`,
                    insightTitle: 'Sync Success',
                    activeBeam: obs
                });
            });

            steps.push({
                phase: 'Broadcast Complete',
                action: 'done',
                payload: arg,
                observers: [...currentObservers],
                explanation: 'All active observers have been synchronized.',
                insight: 'Synchronous notification ensures all observers see the same state.',
                insightTitle: 'Consistency'
            });
        }
    });

    return steps;
}

// ── COMPONENTS ──

const SyncNode = ({ name, active, synced, payload }) => (
    <motion.div
        layout
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        style={{
            width: 140, padding: '1rem', border: '3px solid var(--border)', borderRadius: '12px',
            background: active ? 'var(--cyan)' : 'var(--white)',
            boxShadow: active ? hexGlow('var(--cyan)') : '4px 4px 0 var(--border)',
            textAlign: 'center', position: 'relative'
        }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>
            {name.toLowerCase().includes('email') ? '📧' : name.toLowerCase().includes('log') ? '📝' : '🖥️'}
        </div>
        <div style={{ fontWeight: 800, fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{name}</div>
        {synced && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ fontSize: '0.65rem', marginTop: '0.4rem', color: 'rgba(0,0,0,0.6)', fontWeight: 700 }}>
                "{payload}"
            </motion.div>
        )}
    </motion.div>
);

const SyncCore = ({ state, notifying }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <motion.div
            animate={{
                scale: notifying ? [1, 1.2, 1] : 1,
                boxShadow: notifying ? hexGlow('#f1c40f') : '0 0 20px rgba(0,0,0,0.1)'
            }}
            transition={{ repeat: notifying ? Infinity : 0, duration: 0.6 }}
            style={{
                width: 100, height: 100, borderRadius: '50%', background: '#f1c40f',
                border: '6px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
            <span style={{ fontSize: '2rem' }}>🔔</span>
        </motion.div>
        <div style={{ fontWeight: 900, fontSize: '0.8rem', opacity: 0.6 }}>THE SYNC CORE</div>
    </div>
);

const PulseGrid = ({ step }) => {
    return (
        <div style={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4rem', padding: '2rem' }}>
            {/* Subject Core */}
            <SyncCore notifying={step?.action?.startsWith('notify') || step?.action === 'update'} />

            {/* SVG Beams */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                {step?.activeBeam && (
                    <motion.line
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        x1="50%" y1="35%" x2="50%" y2="60%" // Conceptual; dynamic would be complex
                        stroke="var(--cyan)" strokeWidth="4" strokeDasharray="8 4"
                    />
                )}
            </svg>

            {/* Observers Satellites */}
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '80%' }}>
                <AnimatePresence>
                    {(step?.observers || []).map(obs => (
                        <SyncNode
                            key={obs}
                            name={obs}
                            active={step?.target === obs}
                            synced={step?.action === 'done' || (step?.action === 'update' && step.target === obs)}
                            payload={step?.payload}
                        />
                    ))}
                </AnimatePresence>
                {(!step?.observers || step.observers.length === 0) && (
                    <div style={{ opacity: 0.2, fontWeight: 800, letterSpacing: '2px' }}>NO OBSERVERS REGISTERED</div>
                )}
            </div>
        </div>
    );
};

// ── MAIN COMPONENT ──

export default function ObserverPatternSim() {
    const [program, setProgram] = useState(DEFAULT_PROGRAM);
    const [speed, setSpeed] = useState(1000);
    const [currentStep, setCurrentStep] = useState(-1);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [isSimMode, setIsSimMode] = useState(false);

    const timerRef = useRef(null);
    const stepRef = useRef(-1);
    const steps = buildPulseSteps(program);
    const curStep = currentStep >= 0 ? steps[currentStep] : null;

    const advanceStep = useCallback((idx) => {
        const newIdx = idx + 1;
        if (newIdx >= steps.length) { setCurrentStep(newIdx - 1); setIsRunning(false); setIsFinished(true); clearInterval(timerRef.current); return; }
        setCurrentStep(newIdx); stepRef.current = newIdx;
    }, [steps.length]);

    const handleStart = () => { setCurrentStep(-1); stepRef.current = -1; setIsRunning(true); setIsPaused(false); setIsFinished(false); setIsSimMode(true); clearInterval(timerRef.current); timerRef.current = setInterval(() => advanceStep(stepRef.current), speed); };
    const handlePause = () => { setIsRunning(false); setIsPaused(true); clearInterval(timerRef.current); };
    const handleResume = () => { setIsRunning(true); setIsPaused(false); timerRef.current = setInterval(() => advanceStep(stepRef.current), speed); };
    const handleReset = () => { clearInterval(timerRef.current); setCurrentStep(-1); stepRef.current = -1; setIsRunning(false); setIsPaused(false); setIsFinished(false); setIsSimMode(false); };
    const handleStep = () => { setIsSimMode(true); advanceStep(stepRef.current); };

    const LEFT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.5, marginBottom: '0.5rem' }}>SIMULATION BUILDER</div>
                <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
                    <textarea
                        value={program}
                        onChange={(e) => { setProgram(e.target.value); handleReset(); }}
                        style={{
                            width: '100%', height: '100%', background: '#111', color: '#a8e6cf',
                            fontFamily: 'var(--font-mono)', fontSize: '0.8rem', padding: '1rem',
                            border: '3px solid var(--border)', borderRadius: '8px', resize: 'none', outline: 'none'
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button className="btn btn-sm" onClick={() => { setProgram(program + '\nadd NewNode'); handleReset(); }}>+ Observer</button>
                <button className="btn btn-sm" onClick={() => { setProgram(program + '\nnotify "Test"'); handleReset(); }}>🔔 Notify</button>
            </div>

            <div style={{ borderTop: '2px solid var(--border)', paddingTop: '1rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.4, marginBottom: '0.5rem' }}>LEGEND</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem' }}>
                        <div style={{ width: 10, height: 10, background: '#f1c40f', borderRadius: '50%' }} /> Subject (The Core)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem' }}>
                        <div style={{ width: 10, height: 10, background: 'var(--white)', border: '1px solid var(--border)' }} /> Idle Observer
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem' }}>
                        <div style={{ width: 10, height: 10, background: 'var(--cyan)' }} /> Active Sync
                    </div>
                </div>
            </div>
        </div>
    );

    const RIGHT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
            <div className="panel" style={{ background: '#f8f9fa' }}>
                <div className="panel-header">SYNC LOG</div>
                <div style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.4rem' }}>{curStep?.phase || 'Engine Standby'}</div>
                    <div style={{ fontSize: '0.8rem', lineHeight: 1.5, opacity: 0.8 }}>
                        {curStep?.explanation || 'Enter a script and press Start to visualize notification cycles.'}
                    </div>
                </div>
            </div>

            <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="panel-header" style={{ background: 'var(--yellow)' }}>💡 INSIGHT</div>
                <div style={{ padding: '1rem', fontSize: '0.85rem', lineHeight: 1.6, fontWeight: 600 }}>
                    {curStep?.insight || 'The Observer pattern is the backbone of event-driven architectures and reactive UI frameworks like React!'}
                </div>
                <div style={{ marginTop: 'auto', padding: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.1)', fontSize: '0.65rem', fontWeight: 900, opacity: 0.5 }}>
                    ID: {curStep?.insightTitle}
                </div>
            </div>

            {curStep?.payload && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    style={{ background: '#111', color: 'var(--cyan)', padding: '1rem', borderRadius: '8px', textAlign: 'center', border: '2px solid var(--cyan)' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.5 }}>CURRENT PAYLOAD</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem' }}>"{curStep.payload}"</div>
                </motion.div>
            )}
        </div>
    );

    return (
        <ImmersiveLayout isActive={isSimMode} title="Pulse Sync" icon="👁️" moduleLabel="OOP Module"
            isRunning={isRunning} isPaused={isPaused} isFinished={isFinished} speed={speed} onSpeedChange={setSpeed}
            onStart={handleStart} onPause={handlePause} onResume={handleResume} onReset={handleReset} onStep={handleStep}
            currentStepNum={Math.max(0, currentStep + 1)} totalSteps={steps.length}
            phaseName={curStep?.phase ?? 'Standby'} centerContent={<PulseGrid step={curStep} />} leftContent={LEFT} rightContent={RIGHT}
            timelineItems={steps.map((s, i) => ({ id: i, label: s.phase, done: i < currentStep, active: i === currentStep }))}
            legend={[{ color: '#f1c40f', label: 'Subject Core' }, { color: 'var(--cyan)', label: 'Synced Node' }]}>
            <div className="main-content">
                <div style={{ marginBottom: '0.5rem' }}><Link to="/oops" style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← OOP Module</Link></div>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>👁️ Pulse Sync: Observer Engine</h1>
                <p style={{ opacity: 0.6, fontSize: '1rem', marginBottom: '2.5rem', maxWidth: '600px' }}>
                    The "One-to-Many" broadcast pattern. Build your own notification network and watch data propagate instantly.
                </p>

                <div style={{ background: 'var(--white)', border: '4px solid var(--border)', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', display: 'flex', gap: '3rem', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 1rem 0' }}>Core Concept</h3>
                        <p style={{ fontSize: '0.9rem', lineHeight: 1.6, opacity: 0.8 }}>
                            The Subject (Observable) maintains a list of dependents (Observers) and notifies them automatically of any state changes.
                            This decouples the data source from its visualizers or loggers.
                        </p>
                    </div>
                    <div style={{ width: '1px', height: '100px', background: 'var(--border)' }} />
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 1rem 0' }}>Live Builder</h3>
                        <p style={{ fontSize: '0.9rem', lineHeight: 1.6, opacity: 0.8 }}>
                            Write scripts to add/remove nodes and trigger events.
                            Use <code>add [Name]</code>, <code>remove [Name]</code> and <code>notify "[Msg]"</code> commands.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem' }}>
                    <button className="btn btn-yellow btn-lg" onClick={handleStart} style={{ padding: '1rem 2rem' }}>LAUNCH NETWORK</button>
                    <button className="btn btn-sm btn-white" onClick={() => setProgram(DEFAULT_PROGRAM)} style={{ background: 'white' }}>RESET SCRIPT</button>
                </div>
            </div>
        </ImmersiveLayout>
    );
}
