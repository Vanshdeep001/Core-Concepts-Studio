import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';

const DEFAULT_PROGRAM = `Animal* ptr;
ptr = new Dog();
ptr->speak();
delete ptr;
ptr = null;`;

const MEMORY_TYPES = {
    'Dog': { label: 'Dog', fields: ['name: "Rex"', 'sound: "Woof"'], color: 'var(--cyan)' },
    'Cat': { label: 'Cat', fields: ['name: "Whiskers"', 'sound: "Meow"'], color: 'var(--pink)' },
    'Bird': { label: 'Bird', fields: ['name: "Tweety"', 'sound: "Chirp"'], color: 'var(--yellow)' },
};

function buildStepsFromProgram(input) {
    const lines = input.split('\n').map(l => l.trim()).filter(l => l);
    let steps = [];
    let currentStack = [{ label: 'main()', vars: [], isTop: true }];
    let currentHeap = [];
    let heapAddresses = ['0xA1F0', '0xB2C1', '0xC3D2'];
    let nextAddrIdx = 0;

    steps.push({
        phase: 'main() called',
        code: 'void main() {',
        stack: JSON.parse(JSON.stringify(currentStack)),
        heap: JSON.parse(JSON.stringify(currentHeap)),
        explanation: 'Call stack initialized with main().',
        insight: 'Every program execution starts with a stack frame for the entry point.',
        insightTitle: 'Entry Point'
    });

    lines.forEach(line => {
        let step = { code: '  ' + line, stack: [], heap: [], explanation: '', insight: '', insightTitle: '' };

        try {
            if (line.match(/^[a-zA-Z*]+\s+([a-zA-Z0-9]+);$/)) {
                const name = line.match(/^[a-zA-Z*]+\s+([a-zA-Z0-9]+);$/)[1];
                currentStack[0].vars.push({ name, val: 'null', type: 'Animal*', id: `var-${name}` });
                step.explanation = `Variable '${name}' declared on the stack.`;
                step.insight = 'Stack variables are automatically managed and very fast.';
                step.insightTitle = 'Stack Allocation';
            } else if (line.match(/^([a-zA-Z0-9]+)\s*=\s*new\s+([a-zA-Z0-9]+)\(\);$/)) {
                const [_, name, type] = line.match(/^([a-zA-Z0-9]+)\s*=\s*new\s+([a-zA-Z0-9]+)\(\);$/);
                const addr = heapAddresses[nextAddrIdx++] || '0xDEAD';
                const v = currentStack[0].vars.find(v => v.name === name);
                if (v) { v.val = addr; v.targetId = `obj-${addr}`; }
                currentHeap.push({ ...MEMORY_TYPES[type || 'Dog'], id: `obj-${addr}`, state: 'alive' });
                step.explanation = `New ${type} object created on the heap at ${addr}. Pointer '${name}' updated.`;
                step.insight = 'The heap is for data that needs to persist beyond a single function call.';
                step.insightTitle = 'Heap Allocation';
            } else if (line.match(/^([a-zA-Z0-9]+)->([a-zA-Z0-9]+)\(\);$/)) {
                const [_, name, method] = line.match(/^([a-zA-Z0-9]+)->([a-zA-Z0-9]+)\(\);$/);
                const v = currentStack[0].vars.find(v => v.name === name);
                const target = currentHeap.find(h => h.id === v?.targetId);
                if (target) {
                    target.state = 'active';
                    step.explanation = `Calling ${method}() on object at ${v.val}.`;
                    step.insight = 'Method calls use the pointer to find the object in memory.';
                    step.insightTitle = 'Dereferencing';
                } else {
                    step.explanation = `⚠️ SEGMENTATION FAULT: Attempted to call ${method} on null/invalid pointer!`;
                    step.isError = true;
                }
            } else if (line.match(/^delete\s+([a-zA-Z0-9]+);$/)) {
                const name = line.match(/^delete\s+([a-zA-Z0-9]+);$/)[1];
                const v = currentStack[0].vars.find(v => v.name === name);
                const target = currentHeap.find(h => h.id === v?.targetId && h.state !== 'freed');
                if (target) {
                    target.state = 'freed';
                    if (v) v.dangling = true;
                    step.explanation = `Memory at ${v.val} freed. Variable '${name}' is now a dangling pointer!`;
                    step.insight = 'Always set pointers to null after delete to avoid bugs.';
                    step.insightTitle = 'Dangling Pointers';
                } else {
                    step.explanation = `⚠️ ERROR: Double free or invalid delete for '${name}'!`;
                    step.isError = true;
                }
            } else if (line.match(/^([a-zA-Z0-9]+)\s*=\s*(null|nullptr|0);$/)) {
                const name = line.match(/^([a-zA-Z0-9]+)\s*=\s*(null|nullptr|0);$/)[1];
                const v = currentStack[0].vars.find(v => v.name === name);
                if (v) { v.val = 'null'; v.targetId = null; v.dangling = false; }
                step.explanation = `Pointer '${name}' safely set to null.`;
                step.insight = 'This prevents accidental access to freed memory.';
                step.insightTitle = 'Nulling Pointers';
            }
        } catch (e) {
            step.explanation = "⚠️ Syntax error in program line.";
            step.isError = true;
        }

        step.stack = JSON.parse(JSON.stringify(currentStack));
        step.heap = JSON.parse(JSON.stringify(currentHeap));
        steps.push(step);
        currentHeap.forEach(h => { if (h.state === 'active') h.state = 'alive'; });
    });

    steps.push({ phase: 'main() returns', code: '}', stack: [], heap: JSON.parse(JSON.stringify(currentHeap)), explanation: 'Program terminates. Stack memory reclaimed.', insight: 'Stack cleanup is automatic.', insightTitle: 'End of Scope' });
    return steps;
}

const LEGEND = [
    { color: 'var(--cyan)', label: 'Stack Slot' },
    { color: 'var(--green)', label: 'Heap Nexus' },
    { color: 'var(--pink)', label: 'Dangling / Fault' },
];



export default function MemoryLifecycleSim() {
    const [speed, setSpeed] = useState(900);
    const [program, setProgram] = useState(DEFAULT_PROGRAM);
    const [currentStep, setCurrentStep] = useState(-1);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [isSimMode, setIsSimMode] = useState(false);

    const timerRef = useRef(null);
    const stepRef = useRef(-1);
    const steps = buildStepsFromProgram(program);
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

    const centerContent = (
        <div id="memory-forge-container" style={{ display: 'flex', height: '100%', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(52, 152, 219, 0.05)', borderRadius: '12px', padding: '1rem', border: '2px solid rgba(52, 152, 219, 0.2)', overflow: 'hidden' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--cyan)', marginBottom: '0.5rem' }}>MEMORY DOCK (STACK)</div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column-reverse', gap: '0.5rem', overflowY: 'auto' }}>
                    <AnimatePresence mode="popLayout">
                        {curStep?.stack.slice().reverse().map((frame, fi) => (
                            <motion.div key={fi} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ border: '2px solid var(--border)', background: 'var(--white)', borderRadius: '6px', overflow: 'hidden' }}>
                                <div style={{ background: 'rgba(52, 152, 219, 0.1)', padding: '0.3rem 0.6rem', fontWeight: 800, fontSize: '0.8rem' }}>{frame.label}</div>
                                <div style={{ padding: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {frame.vars.map(v => <div id={v.id} key={v.id} style={{ padding: '0.2rem 0.5rem', border: `2px solid ${v.dangling ? 'var(--pink)' : 'var(--border)'}`, borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{v.name}: {v.val}</div>)}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
            <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', background: 'rgba(46, 204, 113, 0.05)', borderRadius: '12px', padding: '1rem', border: '2px solid rgba(46, 204, 113, 0.2)', overflow: 'hidden' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--green)', marginBottom: '0.5rem' }}>MEMORY NEXUS (HEAP)</div>
                <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '1rem', overflowY: 'auto', alignContent: 'flex-start' }}>
                    <AnimatePresence>
                        {curStep?.heap.map(obj => {
                            // find if any stack var points to this obj
                            const isLinked = (curStep?.stack[0]?.vars || []).some(v => v.targetId === obj.id && v.val !== 'null');
                            return (
                                <motion.div
                                    id={obj.id} key={obj.id}
                                    initial={{ scale: 0 }}
                                    animate={{
                                        scale: 1,
                                        opacity: obj.state === 'freed' ? 0.3 : 1,
                                        boxShadow: obj.state === 'active'
                                            ? '0 0 18px var(--cyan), 0 0 6px var(--cyan)'
                                            : isLinked
                                                ? '0 0 12px rgba(102,217,239,0.5)'
                                                : '4px 4px 0 var(--border)',
                                        borderColor: obj.state === 'active' ? 'var(--cyan)' : isLinked ? 'var(--cyan)' : 'var(--border)',
                                    }}
                                    transition={{ borderColor: { duration: 0.3 }, boxShadow: { duration: 0.3 } }}
                                    style={{ width: 140, border: '2px solid var(--border)', background: obj.color, borderRadius: '8px', padding: '0.4rem' }}
                                >
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, borderBottom: '1px solid rgba(0,0,0,0.1)', marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>{obj.label} ({obj.id.replace('obj-', '')})</span>
                                        {isLinked && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: '0.6rem', background: 'rgba(0,0,0,0.15)', padding: '0.05rem 0.25rem', borderRadius: 3, fontWeight: 900 }}>🔗</motion.span>}
                                    </div>
                                    {obj.fields.map((f, i) => <div key={i} style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>{f}</div>)}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );

    const leftContent = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.5 }}>PROGRAM BUILDER</div>
            <textarea value={program} onChange={(e) => { setProgram(e.target.value); handleReset(); }} disabled={isRunning} style={{ flex: 1, padding: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', border: '2px solid var(--border)', borderRadius: '8px', resize: 'none', background: 'var(--white)', color: 'var(--text)', outline: 'none' }} spellCheck="false" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {steps.map((_, i) => <button key={i} onClick={() => { setCurrentStep(i); stepRef.current = i; setIsSimMode(true); setIsPaused(true); setIsRunning(false); clearInterval(timerRef.current); }} style={{ width: 24, height: 24, border: '2px solid var(--border)', background: i === currentStep ? 'var(--yellow)' : i <= currentStep ? 'var(--green)' : 'var(--white)', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}>{i + 1}</button>)}
            </div>
        </div>
    );

    const rightContent = curStep && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.5 }}>EXPLANATION</div>
            <div style={{ background: curStep.isError ? 'rgba(255,107,157,0.1)' : 'var(--white)', padding: '1rem', borderLeft: '4px solid var(--yellow)', borderRadius: '0 8px 8px 0', fontSize: '0.85rem' }}>{curStep.explanation}</div>
            <AnimatePresence mode="wait"><motion.div key={currentStep} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'var(--yellow)', padding: '1rem', border: '2px solid var(--border)', borderRadius: '8px', fontSize: '0.8rem' }}><strong>💡 {curStep.insightTitle}</strong><br />{curStep.insight}</motion.div></AnimatePresence>
        </div>
    );

    return (
        <ImmersiveLayout isActive={isSimMode} title="Object Lifecycle & Memory" icon="🧠" moduleLabel="OOP Module" isRunning={isRunning} isPaused={isPaused} isFinished={isFinished} speed={speed} onSpeedChange={setSpeed} onStart={handleStart} onPause={handlePause} onResume={handleResume} onReset={handleReset} onStep={handleStep} currentStepNum={Math.max(0, currentStep + 1)} totalSteps={steps.length} phaseName={curStep?.phase || ''} centerContent={centerContent} leftContent={leftContent} rightContent={rightContent} timelineItems={steps.map((s, i) => ({ id: i, label: s.phase || s.code, done: i < currentStep, active: i === currentStep }))} legend={LEGEND}>
            <div className="main-content">
                <Link to="/oops" style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← OOP Module</Link>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.5rem 0' }}>🧠 Memory Lifecycle Forge</h1>
                <p style={{ opacity: 0.6, fontSize: '0.9rem', marginBottom: '1.5rem' }}>Write C++ style memory operations below and watch the stack/heap interaction in real-time.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                    <div className="panel">
                        <div className="panel-header">📝 Edit Your Program</div>
                        <textarea value={program} onChange={(e) => setProgram(e.target.value)} style={{ width: '100%', height: '200px', padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', border: 'none', background: '#1a1a1a', color: '#a8e6cf', outline: 'none', resize: 'none' }} spellCheck="false" />
                    </div>
                    <div className="panel"><div className="panel-header">🔍 Commands Support</div><ul style={{ padding: '1rem', margin: 0, fontSize: '0.8rem', listStyle: 'none', lineHeight: 2 }}><li>• <code>Type* ptr;</code> - Stack declare</li><li>• <code>ptr = new Dog();</code> - Heap alloc</li><li>• <code>ptr-&gt;speak();</code> - Method call</li><li>• <code>delete ptr;</code> - Reclaim memory</li><li>• <code>ptr = null;</code> - Safety check</li></ul></div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-yellow btn-lg" onClick={handleStart}>Launch Simulation</button>
                    <button className="btn btn-sm" onClick={() => setProgram(DEFAULT_PROGRAM)}>Reset to Default</button>
                </div>
            </div>
        </ImmersiveLayout>
    );
}
