import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';

// ── DATA STRUCTURES ──

const CLASSES = {
    Animal: {
        addr: '0x1000',
        color: '#f1c40f', // Bright Yellow
        vtableAddr: '0x300A',
        methods: [
            { name: 'speak()', isVirtual: true, impl: 'Animal::speak() → "Animal sound"', owner: 'Animal' },
            { name: 'move()', isVirtual: true, impl: 'Animal::move() → "Animal moves"', owner: 'Animal' }
        ]
    },
    Dog: {
        parent: 'Animal',
        addr: '0x1100',
        color: '#3498db', // Bright Blue
        vtableAddr: '0x400B',
        methods: [
            { name: 'speak()', isVirtual: true, impl: 'Dog::speak() → "Woof! Woof!"', owner: 'Dog' },
            { name: 'move()', isVirtual: true, impl: 'Animal::move() → "Animal moves"', owner: 'Animal' }, // inherited
            { name: 'fetch()', isVirtual: false, impl: 'Dog::fetch() → "Fetching!"', owner: 'Dog' }
        ]
    },
    Cat: {
        parent: 'Animal',
        addr: '0x1200',
        color: '#e91e63', // Bright Pink
        vtableAddr: '0x500C',
        methods: [
            { name: 'speak()', isVirtual: true, impl: 'Cat::speak() → "Meow!"', owner: 'Cat' },
            { name: 'move()', isVirtual: true, impl: 'Cat::move() → "Cat slinks"', owner: 'Cat' }
        ]
    },
};

const DEFAULT_CONFIG = {
    refType: 'Animal',
    objType: 'Dog',
    methodName: 'speak()',
    isVirtual: true,
    hasOverride: true,
    deepMode: false,
    misconceptionMode: false
};

function buildComprehensiveSteps(config) {
    const { refType, objType, methodName, isVirtual, hasOverride } = config;
    const baseClass = CLASSES[refType];
    const actualClass = CLASSES[objType];

    // Find method in base and actual
    const baseMethod = baseClass.methods.find(m => m.name === methodName);
    const actualMethod = actualClass.methods.find(m => m.name === methodName);

    const steps = [];
    const objAddr = '0xA1F0';

    // --- PHASE A: COMPILE-TIME (STATIC) ---
    steps.push({
        phase: 'Compiler: Symbol Check',
        isCompileTime: true,
        code: `${refType}* ptr;`,
        explanation: `Compiler verifies if '${methodName}' is defined in class '${refType}' or its parents.`,
        insight: `Compile-time visibility is strictly limited by the Static Type (${refType}*).`,
        insightTitle: 'Static Visibility',
        highlight: { ref: refType }
    });

    steps.push({
        phase: 'Compiler: Binding Resolution',
        isCompileTime: true,
        code: `ptr->${methodName};`,
        explanation: isVirtual
            ? `Method is 'virtual'. Compiler generates code for an indirect lookup (Late Binding).`
            : `Method NOT virtual. Compiler resolves the address to '${refType}::${methodName}' NOW (Early Binding).`,
        insight: isVirtual ? 'Dynamic dispatch shifts the call resolution from compile-time to runtime.' : 'Early binding is direct and cannot be overridden by subtypes.',
        insightTitle: isVirtual ? 'Vtable Required' : 'Static Call',
        decision: isVirtual ? 'dynamic' : 'early'
    });

    // --- PHASE B: RUNTIME (DYNAMIC) ---
    if (!isVirtual) {
        steps.push({
            phase: 'Runtime: Direct Call',
            isRuntime: true,
            code: `ptr->${methodName};`,
            explanation: `CPU executes the pre-determined address: ${refType}::${methodName}. No Vtable lookup performed.`,
            insight: 'The object type on the heap is IGNORED for early-bound methods.',
            insightTitle: 'Early Binding Result',
            jumpTo: `${refType}::${methodName}`
        });
    } else {
        steps.push({
            phase: 'Runtime: Obj Initialization',
            isRuntime: true,
            code: `ptr = new ${objType}();`,
            explanation: `Memory allocated for ${objType}. Its internal 'vptr' is pointing to ${objType}'s Vtable.`,
            insight: 'Objects carry their class identity via the hidden vptr field.',
            insightTitle: 'Memory Layout',
            object: { type: objType, addr: objAddr, vptr: actualClass.vtableAddr }
        });

        steps.push({
            phase: 'Runtime: Fetch Vptr',
            isRuntime: true,
            code: `ptr->${methodName};`,
            explanation: `Execution starts. CPU dereferences 'ptr' to find the object, then reads its 'vptr'.`,
            trace: `[Runtime] Dereferencing ${objAddr} to fetch vptr: ${actualClass.vtableAddr}`,
            insight: 'This indirection is why polymorphism has a tiny runtime cost.',
            insightTitle: 'Vptr Access',
            activeSignal: 'ptr-to-obj'
        });

        steps.push({
            phase: 'Runtime: Vtable Jump',
            isRuntime: true,
            code: `// Fetch vtable[index]`,
            explanation: `The CPU "jumps" to the Vtable at address ${actualClass.vtableAddr}.`,
            trace: `[Runtime] Accessing Vtable entries for '${objType}'`,
            vtable: { owner: objType, addr: actualClass.vtableAddr, highlightIdx: actualClass.methods.findIndex(m => m.name === methodName) },
            activeSignal: 'obj-to-vtable'
        });

        const resolvedMethod = actualMethod || baseMethod;
        const resolvedOwner = (hasOverride && actualMethod && actualMethod.owner === objType) ? objType : (actualMethod ? actualMethod.owner : refType);

        steps.push({
            phase: 'Runtime: Final Resolution',
            isRuntime: true,
            code: `// Found ${resolvedOwner}::${methodName}`,
            explanation: `The Vtable entry points to '${resolvedOwner}::${methodName}'. Lookup complete.`,
            trace: `[Runtime] Resolved to method implementation: ${resolvedOwner}::${methodName}`,
            resolved: { owner: resolvedOwner, method: methodName },
            activeSignal: 'vtable-resolved'
        });

        steps.push({
            phase: 'Runtime: Method Execute',
            isRuntime: true,
            code: `${resolvedOwner}::${methodName}`,
            explanation: `Control transferred to ${resolvedOwner}::${methodName}. Implicit 'this' passed as ${objAddr}.`,
            insight: `Polymorphism complete: The same ptr->${methodName} call ran ${resolvedOwner}'s code based on runtime type!`,
            insightTitle: 'Late Binding Success',
            executing: { owner: resolvedOwner, this: objAddr }
        });
    }

    return steps;
}

// ── UTILS ──
const hexGlow = (color) => `0 0 15px ${color}, 0 0 5px ${color}`;

// ── COMPONENTS ──

const SignalBeam = ({ signal, stepId }) => {
    if (!signal) return null;
    let path = "";
    if (signal === 'ptr-to-obj') path = "M 150 150 C 200 150, 250 200, 300 150";
    if (signal === 'obj-to-vtable') path = "M 450 150 L 450 350";
    if (signal === 'vtable-resolved') path = "M 450 450 C 450 500, 300 500, 150 500";

    return (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
            <motion.path
                key={signal + stepId}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                d={path}
                stroke="var(--cyan)"
                strokeWidth="4"
                strokeDasharray="10, 5"
                fill="none"
                style={{ filter: 'drop-shadow(0 0 5px var(--cyan))' }}
            />
        </svg>
    );
};

const MemoryNode = ({ label, value, addr, color, isDeep, active }) => (
    <motion.div
        animate={{ scale: active ? 1.05 : 1, borderColor: active ? 'var(--cyan)' : 'var(--border)' }}
        style={{
            background: color || 'var(--white)', border: '3px solid var(--border)', borderRadius: '12px',
            padding: '1rem', width: 220, boxShadow: active ? hexGlow(color || 'var(--cyan)') : '6px 6px 0 var(--border)',
            position: 'relative'
        }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.5, marginBottom: '0.4rem' }}>{addr}</div>
        <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', background: 'rgba(0,0,0,0.05)', padding: '0.3rem', borderRadius: '4px' }}>
            {value}
        </div>
        {isDeep && (
            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(0,0,0,0.1)', fontSize: '0.7rem', opacity: 0.7 }}>
                [+0] vptr: {addr.slice(0, 3)}...<br />
                [+8] fields...
            </div>
        )}
    </motion.div>
);

const DispatchHub = ({ step, config, currentStep }) => {
    return (
        <div id="dispatch-engine" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
            <SignalBeam signal={step?.activeSignal} stepId={currentStep} />

            {/* Top Layer: Pointer & Object Interaction */}
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flex: 1 }}>
                {/* Pointer Node */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--yellow)', opacity: 0.8 }}>DEREFERENCE UNIT</div>
                    <MemoryNode
                        label={`${config.refType}* ptr`}
                        value={step?.phase === 'Compile: Symbol Check' ? 'null' : (step?.isCompileTime ? '???' : '0xA1F0')}
                        addr="0xFF30 (Stack)"
                        color={CLASSES[config.refType].color}
                        active={step?.activeSignal === 'ptr-to-obj' || step?.isCompileTime}
                    />
                </div>

                {/* Connection Arrow Conceptual */}
                <div style={{ fontSize: '2rem', opacity: 0.2 }}>⟹</div>

                {/* Object Node */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--green)', opacity: 0.8 }}>RUNTIME INSTANCE</div>
                    {step?.object || step?.isRuntime ? (
                        <MemoryNode
                            label={`${config.objType} Instance`}
                            value={`vptr -> ${CLASSES[config.objType].vtableAddr}`}
                            addr="0xA1F0 (Heap)"
                            color={CLASSES[config.objType].color}
                            isDeep={config.deepMode}
                            active={step?.activeSignal === 'obj-to-vtable' || !!step?.object}
                        />
                    ) : (
                        <div style={{ width: 220, height: 100, border: '3px dashed var(--border)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3, fontSize: '0.8rem' }}>
                            Unallocated
                        </div>
                    )}
                </div>
            </div>

            {/* Middle Layer: Vtable Logic */}
            <div style={{ flex: 1.2, display: 'flex', justifyContent: 'center' }}>
                <AnimatePresence mode="wait">
                    {step?.vtable ? (
                        <motion.div key={step.vtable.owner} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="panel" style={{ width: '80%', boxShadow: hexGlow('var(--cyan)') }}>
                            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{step.vtable.owner} VTABLE @ {step.vtable.addr}</span>
                                <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>O(1) Access</span>
                            </div>
                            <div style={{ padding: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                                {CLASSES[step.vtable.owner].methods.map((m, i) => {
                                    const isTarget = m.name === config.methodName;
                                    const isResolved = step.phase === 'Runtime: Final Resolution' && isTarget;
                                    return (
                                        <div key={i} style={{
                                            padding: '0.5rem 0.75rem', border: '2px solid var(--border)', borderRadius: '6px',
                                            background: isTarget ? 'rgba(52, 152, 219, 0.15)' : 'var(--white)',
                                            borderColor: isTarget ? 'var(--cyan)' : 'var(--border)',
                                            position: 'relative', overflow: 'hidden'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                                                <span style={{ opacity: 0.4 }}>[{i}]</span>
                                                <span style={{ fontWeight: 800 }}>{m.name}</span>
                                            </div>
                                            <div style={{ marginTop: '0.2rem', fontSize: '0.65rem', opacity: 0.6, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                → {m.impl}
                                            </div>
                                            {isResolved && <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} style={{ position: 'absolute', bottom: 0, left: 0, height: '4px', background: 'var(--cyan)' }} />}
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ) : (
                        <div style={{ width: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>VTABLE LOOKUP WAITING</div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Layer: Final Dispatch */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                {step?.executing && (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                        className="panel" style={{ width: '50%', background: 'var(--yellow)', border: '4px solid var(--border)', textAlign: 'center' }}>
                        <div className="panel-header">EXECUTION UNIT</div>
                        <div style={{ padding: '1rem' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{step.executing.owner}::{config.methodName}</div>
                            <div style={{ fontSize: '0.75rem', marginTop: '0.3rem', fontWeight: 700, opacity: 0.7 }}>
                                Called with context: this = {step.executing.this}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

// ── MAIN COMPONENT ──

export default function PolymorphismSim() {
    const [config, setConfig] = useState(DEFAULT_CONFIG);
    const [speed, setSpeed] = useState(1200);
    const [currentStep, setCurrentStep] = useState(-1);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [isSimMode, setIsSimMode] = useState(false);

    const timerRef = useRef(null);
    const stepRef = useRef(-1);
    const steps = buildComprehensiveSteps(config);
    const curStep = currentStep >= 0 ? (steps[currentStep] || steps[0]) : null;

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
            <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.5, marginBottom: '0.75rem' }}>1. BINDING SPECS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>STATIC TYPE (Reference)</span>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {['Animal', 'Dog'].map(t => (
                                <button key={t} className={`chip ${config.refType === t ? 'active' : ''}`}
                                    style={{ background: config.refType === t ? CLASSES[t].color : 'var(--white)' }}
                                    onClick={() => { setConfig({ ...config, refType: t }); handleReset(); }}>{t}*</button>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>DYNAMIC TYPE (Object)</span>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {['Animal', 'Dog', 'Cat'].map(t => (
                                <button key={t} className={`chip ${config.objType === t ? 'active' : ''}`}
                                    style={{ background: config.objType === t ? CLASSES[t].color : 'var(--white)' }}
                                    onClick={() => { setConfig({ ...config, objType: t }); handleReset(); }}>new {t}()</button>
                            ))}
                        </div>
                    </div>
                    <button className={`btn btn-sm ${config.isVirtual ? 'btn-cyan' : ''}`} style={{ width: '100%', marginTop: '0.5rem' }}
                        onClick={() => { setConfig({ ...config, isVirtual: !config.isVirtual }); handleReset(); }}>
                        {config.isVirtual ? '✅ VIRTUAL ENABLED' : '❌ VIRTUAL (STATIC CALL)'}
                    </button>
                </div>
            </div>

            <div style={{ borderTop: '2px solid var(--border)', paddingTop: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.5, marginBottom: '0.75rem' }}>2. DEEP INSPECTION</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button className={`btn btn-sm ${config.deepMode ? 'btn-yellow' : ''}`} style={{ width: '100%' }}
                        onClick={() => setConfig({ ...config, deepMode: !config.deepMode })}>SHOW MEMORY LAYOUT</button>
                    <button className={`btn btn-sm ${config.misconceptionMode ? 'btn-yellow' : ''}`} style={{ width: '100%' }}
                        onClick={() => setConfig({ ...config, misconceptionMode: !config.misconceptionMode })}>MISCONCEPTION MODE</button>
                </div>
            </div>

            <div style={{ flex: 1 }} />
            <div style={{ borderTop: '2px solid var(--border)', paddingTop: '1rem' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.4, marginBottom: '0.4rem' }}>WHAT'S HAPPENING?</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text)', opacity: 0.8, lineHeight: 1.4 }}>
                    Polymorphism lets common base pointers behave differently based on their actual runtime type.
                </div>
            </div>
        </div>
    );

    const RIGHT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
            <div style={{
                padding: '0.6rem', background: curStep?.isCompileTime ? 'var(--yellow)' : 'var(--cyan)',
                borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, textAlign: 'center', border: '3px solid var(--border)',
                boxShadow: '3px 3px 0 var(--border)'
            }}>
                {curStep?.isCompileTime ? 'PHASE A: COMPILE-TIME' : 'PHASE B: RUNTIME'}
            </div>

            <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="panel-header">DIAGNOSTIC LOG</div>
                <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <AnimatePresence mode="wait">
                        <motion.div key={currentStep} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.5rem' }}>{curStep?.phase}</div>
                            <div style={{ fontSize: '0.8rem', lineHeight: 1.6, background: '#f8f9fa', padding: '0.75rem', borderLeft: '4px solid var(--border)', borderRadius: '0 6px 6px 0' }}>
                                {curStep?.explanation}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {curStep?.trace && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{ background: '#111', color: '#10b981', padding: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', border: '1px solid #333', borderRadius: '4px' }}>
                            {curStep.trace}
                        </motion.div>
                    )}

                    {config.misconceptionMode && curStep?.isCompileTime && (
                        <div style={{ background: 'rgba(233,30,99,0.1)', border: '2px solid var(--pink)', padding: '0.75rem', borderRadius: '8px' }}>
                            <div style={{ color: 'var(--pink)', fontWeight: 900, fontSize: '0.7rem', marginBottom: '0.3rem' }}>💡 DEBUNKING ERROR</div>
                            <div style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
                                Students often think: "Ptr is <b>{config.refType}*</b>, so it must call <b>{config.refType}::{config.methodName}</b>."
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, marginTop: '0.4rem', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '0.4rem' }}>
                                WATCH PHASE B to see how runtime overrides this choice!
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="panel" style={{ flexShrink: 0 }}>
                <div className="panel-header">INSIGHT: {curStep?.insightTitle || 'Polymorphism'}</div>
                <div style={{ padding: '0.75rem', background: 'var(--yellow)', fontSize: '0.75rem', lineHeight: 1.5, fontWeight: 600 }}>
                    {curStep?.insight}
                </div>
            </div>
        </div>
    );

    return (
        <ImmersiveLayout isActive={isSimMode} title="Dispatch Engine" icon="⚡" moduleLabel="OOP Module"
            isRunning={isRunning} isPaused={isPaused} isFinished={isFinished} speed={speed} onSpeedChange={setSpeed}
            onStart={handleStart} onPause={handlePause} onResume={handleResume} onReset={handleReset} onStep={handleStep}
            currentStepNum={Math.max(0, currentStep + 1)} totalSteps={steps.length}
            phaseName={curStep?.phase ?? 'System Standby'} centerContent={<DispatchHub step={curStep} config={config} currentStep={currentStep} />} leftContent={LEFT} rightContent={RIGHT}
            timelineItems={steps.map((s, i) => ({ id: i, label: s.phase, done: i < currentStep, active: i === currentStep }))}
            legend={[{ color: 'var(--yellow)', label: 'Static Context' }, { color: 'var(--cyan)', label: 'Runtime Resolution' }, { color: 'var(--pink)', label: 'Override Active' }]}>
            <div className="main-content">
                <div style={{ marginBottom: '0.5rem' }}><Link to="/oops" style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← OOP Module</Link></div>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>⚡ Polymorphism Dispatch Engine</h1>
                <p style={{ opacity: 0.6, fontSize: '1rem', marginBottom: '2.5rem', maxWidth: '600px' }}>
                    Visualize how the CPU navigates inheritance and virtual tables to achieve dynamic behavior at runtime.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                    <div className="panel" style={{ padding: '0' }}>
                        <div className="panel-header">Compile-Time Spec (Code)</div>
                        <div style={{ padding: '1.25rem', fontSize: '1rem', fontFamily: 'var(--font-mono)', background: '#1a1a1a', color: '#a8e6cf' }}>
                            <span style={{ color: '#ff79c6' }}>{config.refType}</span>* ptr = <span style={{ color: '#bd93f9' }}>new</span> {config.objType}();<br />
                            ptr-&gt;<span style={{ color: '#50fa7b' }}>{config.methodName}</span>;
                        </div>
                    </div>
                    <div className="panel">
                        <div className="panel-header">Dispatch Diagnosis</div>
                        <div style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: config.isVirtual ? 'var(--green)' : 'var(--pink)' }} />
                                <span style={{ fontWeight: 800 }}>{config.isVirtual ? 'LATE BINDING (Virtual)' : 'EARLY BINDING (Non-Virtual)'}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>
                                {config.isVirtual
                                    ? "Will use Vtable lookup to find the most specific override at runtime."
                                    : "Resolved immediately based on pointer type. Inheritance ignored."}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem' }}>
                    <button className="btn btn-yellow btn-lg" onClick={handleStart} style={{ padding: '1rem 2rem' }}>RUN DISPATCH TRACE</button>
                    <button className="btn btn-sm btn-white" onClick={handleStep} style={{ background: 'white' }}>STEP THROUGH</button>
                    <button className="btn btn-sm" onClick={() => setConfig(DEFAULT_CONFIG)} style={{ marginLeft: 'auto' }}>RESET ENGINE</button>
                </div>
            </div>
        </ImmersiveLayout>
    );
}
