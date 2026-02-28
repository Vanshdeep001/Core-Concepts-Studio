import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';

const MODES = ['Stop & Wait', 'Go-Back-N', 'Selective Repeat'];
const MODE_EXPLANATIONS = {
    'Stop & Wait': { desc: 'Sender sends 1 packet, waits for ACK before sending next. Window size = 1.', efficiency: 'Very low utilization. Simple but slow. Efficiency = 1/(1+2a) where a = propagation/transmission time.' },
    'Go-Back-N': { desc: 'If a packet is lost or timed out, retransmit it AND all subsequent packets in the window.', efficiency: 'Better throughput. But retransmits unnecessary packets. Window size ≤ 2^n − 1.' },
    'Selective Repeat': { desc: 'Only retransmit the specific lost/errored packet, not the whole window.', efficiency: 'Best throughput. Requires receiver-side buffering. Window size ≤ 2^(n-1).' },
};

function buildPackets(total, ws, mode, lossAt) {
    const steps = [];
    let base = 0, nextSeq = 0;
    const acked = new Set(), sent = new Set();
    let lossTriggered = false;

    while (base < total) {
        const maxSend = Math.min(base + ws, total);
        while (nextSeq < maxSend && !sent.has(nextSeq)) {
            steps.push({ action: 'send', seq: nextSeq, base, nextSeq: nextSeq + 1, windowSize: ws, acked: new Set(acked), sent: new Set(sent), phase: `▶ Send packet ${nextSeq}`, explanation: `Sending packet ${nextSeq} (window base=${base}). Window allows up to ${ws} unacknowledged packets in flight.`, insight: `Sliding window allows up to ${ws} packet(s) in flight without waiting for ACKs, improving link utilization.`, lossAt });
            sent.add(nextSeq); nextSeq++;
        }
        if (!lossTriggered && lossAt !== null && base === lossAt && !acked.has(base)) {
            lossTriggered = true;
            steps.push({ action: 'loss', seq: base, base, nextSeq, windowSize: ws, acked: new Set(acked), sent: new Set(sent), phase: `⏰ TIMEOUT — packet ${base} lost`, explanation: `Packet ${base} was lost (no ACK received). Timeout fires — ${mode === 'Selective Repeat' ? `only packet ${base} is retransmitted.` : `retransmitting from packet ${base} (Go-Back-N).`}`, insight: mode === 'Go-Back-N' ? 'Go-Back-N wastes bandwidth retransmitting correctly received packets. Simple for receiver.' : 'Selective Repeat is more efficient but needs receiver buffering for out-of-order packets.', lossAt });
            if (mode === 'Go-Back-N') { sent.clear();[...acked].forEach(a => sent.add(a)); nextSeq = base; }
            else if (mode === 'Selective Repeat') { sent.delete(base); nextSeq = Math.min(nextSeq, base); }
        } else {
            acked.add(base);
            steps.push({ action: 'ack', seq: base, base: base + 1, nextSeq, windowSize: ws, acked: new Set(acked), sent: new Set(sent), phase: `← ACK ${base} received`, explanation: `ACK for packet ${base} received. Window slides forward — base is now ${base + 1}. New space opens in the window.`, insight: 'When the base packet is ACKed, the window slides forward, potentially allowing new packets to be sent.', lossAt });
            base++;
        }
    }
    steps.push({ action: 'done', base, nextSeq, windowSize: ws, acked: new Set(acked), sent: new Set(sent), phase: '✅ All packets delivered', explanation: 'All packets have been acknowledged. Transmission complete.', insight: `${mode} efficiency: ${mode === 'Stop & Wait' ? 'lowest' : mode === 'Go-Back-N' ? 'medium' : 'highest'}. Selective Repeat maximizes link utilization.`, lossAt: null });
    return steps;
}

export default function SlidingWindowSim() {
    const [mode, setMode] = useState('Go-Back-N');
    const [total, setTotal] = useState(8);
    const [ws, setWs] = useState(3);
    const [lossAt, setLossAt] = useState(2);
    const [enableLoss, setEnableLoss] = useState(true);
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

    const effectiveWS = mode === 'Stop & Wait' ? 1 : ws;

    const advanceStep = useCallback((stepsArr, idx) => {
        const newIdx = idx + 1;
        if (newIdx >= stepsArr.length) { setCurrentStep(newIdx - 1); setIsRunning(false); setIsFinished(true); clearInterval(timerRef.current); return; }
        setCurrentStep(newIdx); stepRef.current = newIdx;
    }, []);

    const handleStart = () => {
        const s = buildPackets(total, effectiveWS, mode, enableLoss ? lossAt : null);
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
    const pkts = Array.from({ length: total }, (_, i) => i);

    const CENTER = (
        <div style={{ padding: '0.75rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Sender Window (size = {effectiveWS})</div>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {pkts.map(i => {
                    const isAcked = curStep?.acked?.has(i);
                    const isSent = curStep?.sent?.has(i);
                    const isWindow = i >= (curStep?.base ?? 0) && i < (curStep?.base ?? 0) + effectiveWS;
                    const isLost = curStep?.action === 'loss' && curStep.seq === i;
                    const isCurrent = curStep?.action === 'send' && curStep.seq === i;
                    return (
                        <motion.div key={i} animate={{ scale: isCurrent || isLost ? 1.18 : 1, rotate: isLost ? -5 : 0 }}
                            style={{ width: 46, height: 46, border: '3px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.9rem', boxShadow: isWindow ? 'var(--shadow)' : 'var(--shadow-sm)', background: isLost ? 'var(--pink)' : isAcked ? 'var(--green)' : isCurrent ? 'var(--yellow)' : isWindow ? 'var(--cyan)' : 'var(--white)' }}>
                            {i}{isAcked ? '✓' : isLost ? '✗' : ''}
                        </motion.div>
                    );
                })}
            </div>

            {/* Window bracket */}
            {curStep && curStep.action !== 'done' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', fontWeight: 700 }}>
                    <span style={{ opacity: 0.5 }}>Window [</span>
                    <span style={{ background: 'var(--cyan)', border: '2px solid var(--border)', padding: '0.1rem 0.4rem', fontFamily: 'var(--font-mono)' }}>{curStep.base}</span>
                    <span style={{ opacity: 0.5 }}>…</span>
                    <span style={{ background: 'var(--cyan)', border: '2px solid var(--border)', padding: '0.1rem 0.4rem', fontFamily: 'var(--font-mono)' }}>{Math.min(curStep.base + effectiveWS - 1, total - 1)}</span>
                    <span style={{ opacity: 0.5 }}>]</span>
                    <span style={{ marginLeft: '0.5rem', background: 'var(--yellow)', border: '2px solid var(--border)', padding: '0.1rem 0.5rem' }}>next={curStep.nextSeq}</span>
                </div>
            )}

            {/* Status banner */}
            {curStep && (
                <AnimatePresence mode="wait">
                    <motion.div key={currentStep} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        style={{ padding: '0.5rem 0.75rem', border: '3px solid var(--border)', fontWeight: 700, fontSize: '0.9rem', background: curStep.action === 'loss' ? 'var(--pink)' : curStep.action === 'ack' ? 'var(--green)' : curStep.action === 'done' ? 'var(--green)' : 'var(--yellow)' }}>
                        {curStep.phase}
                    </motion.div>
                </AnimatePresence>
            )}

            {/* Progress stats */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                {[
                    { label: 'ACKed', val: curStep?.acked?.size ?? 0, color: 'var(--green)' },
                    { label: 'In Flight', val: curStep ? [...(curStep.sent ?? [])].filter(s => !(curStep.acked ?? new Set()).has(s)).length : 0, color: 'var(--cyan)' },
                    { label: 'Remaining', val: total - (curStep?.acked?.size ?? 0), color: 'var(--white)' },
                ].map(s => (
                    <div key={s.label} style={{ flex: 1, border: '2px solid var(--border)', background: s.color, padding: '0.35rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.7 }}>{s.label}</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{s.val}</div>
                    </div>
                ))}
            </div>
        </div>
    );

    const LEFT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', overflow: 'hidden' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Protocol</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{mode}</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Window Size</div>
            <div style={{ fontWeight: 700, fontSize: '1.5rem', fontFamily: 'var(--font-mono)' }}>{effectiveWS}</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Total Pkts</div>
            <div style={{ fontWeight: 700, fontSize: '1.3rem', fontFamily: 'var(--font-mono)' }}>{total}</div>
            <div style={{ height: 2, background: 'var(--border)' }} />
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Event</div>
            <div style={{ fontWeight: 700, padding: '0.3rem 0.5rem', border: '2px solid var(--border)', background: curStep?.action === 'loss' ? 'var(--pink)' : curStep?.action === 'ack' ? 'var(--green)' : 'var(--yellow)', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                {curStep?.action ?? '—'}
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
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.55, marginBottom: '0.3rem' }}>💡 {mode} Strategy</div>
                <div style={{ background: 'var(--yellow)', border: '2px solid var(--border)', padding: '0.5rem 0.6rem', fontSize: '0.78rem', lineHeight: 1.5 }}>{curStep.insight}</div>
            </div>
        </div>
    ) : null;

    const TL = steps.map((s, i) => ({ id: i, label: s.phase, done: i < currentStep, active: i === currentStep }));

    return (
        <ImmersiveLayout isActive={isSimMode} title="Sliding Window" icon="🪟" moduleLabel="Networks Module"
            isRunning={isRunning} isPaused={isPaused} isFinished={isFinished} speed={speed} onSpeedChange={setSpeed}
            onStart={handleStart} onPause={handlePause} onResume={handleResume} onReset={handleReset} onStep={handleStep}
            currentStepNum={Math.max(0, currentStep + 1)} totalSteps={steps.length}
            phaseName={curStep?.phase ?? ''} centerContent={CENTER} leftContent={LEFT} rightContent={RIGHT}
            timelineItems={TL} legend={[{ color: 'var(--green)', label: 'ACKed' }, { color: 'var(--cyan)', label: 'In Window' }, { color: 'var(--yellow)', label: 'Sending Now' }, { color: 'var(--pink)', label: 'Lost/Timeout' }]}>
            <div className="main-content">
                <div style={{ marginBottom: '0.4rem' }}><Link to="/networks" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← Networks Module</Link></div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="section-header">Networks · Data Link Layer</div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 700 }}>🪟 Sliding Window Protocol</h1>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '0.3rem' }}>Simulate Stop & Wait, Go-Back-N, and Selective Repeat with optional packet loss.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                    <div className="panel">
                        <div className="panel-header">⚙ Configuration</div>
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div><label className="form-label">Protocol</label><select className="form-select" value={mode} onChange={e => setMode(e.target.value)}>{MODES.map(m => <option key={m}>{m}</option>)}</select></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div><label className="form-label">Total Packets</label><input type="number" className="form-input" value={total} min={3} max={15} onChange={e => setTotal(Math.max(3, +e.target.value || 3))} /></div>
                                {mode !== 'Stop & Wait' && <div><label className="form-label">Window Size</label><input type="number" className="form-input" value={ws} min={1} max={8} onChange={e => setWs(Math.max(1, +e.target.value || 1))} /></div>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={enableLoss} onChange={e => setEnableLoss(e.target.checked)} />
                                    Simulate loss at seq #:
                                </label>
                                <input type="number" className="form-input" value={lossAt} min={0} max={total - 1} onChange={e => setLossAt(+e.target.value || 0)} disabled={!enableLoss} style={{ width: 60 }} />
                            </div>
                        </div>
                    </div>
                    <div className="panel">
                        <div className="panel-header">📋 {mode} Info</div>
                        <div style={{ padding: '1rem', fontSize: '0.85rem' }}>
                            <div style={{ marginBottom: '0.5rem' }}>{MODE_EXPLANATIONS[mode].desc}</div>
                            <div style={{ opacity: 0.7 }}>{MODE_EXPLANATIONS[mode].efficiency}</div>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-yellow btn-lg" onClick={handleStart}>▶ Simulate</button>
                    <button className="btn btn-sm" style={{ marginTop: '0.15rem' }} onClick={handleStep}>⏭ Step Through</button>
                </div>
            </div>
        </ImmersiveLayout>
    );
}
