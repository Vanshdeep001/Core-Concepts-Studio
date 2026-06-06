import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import { HandshakeIcon } from '../../components/Icons';

/* ════════════════════════════════════════
   DATA — TCP states, scenarios
   ════════════════════════════════════════ */
const TCP_STATES = ['CLOSED','SYN_SENT','SYN_RCVD','ESTABLISHED','FIN_WAIT_1','FIN_WAIT_2','TIME_WAIT','CLOSED'];
const STATE_COLORS = { CLOSED:'#ef9a9a', SYN_SENT:'#ffcc80', SYN_RCVD:'#ffe082', ESTABLISHED:'#a5d6a7', FIN_WAIT_1:'#90caf9', FIN_WAIT_2:'#80deea', TIME_WAIT:'#ce93d8' };

const SCENARIOS = {
    'File download': { desc: 'Large reliable transfer — TCP is ideal. Every byte must arrive in order.', protocol: 'TCP', pattern: [3,3,3,3,3], windowHint: 4 },
    'Video call':    { desc: 'Real-time streaming — UDP preferred. Dropped frames are better than delayed ones.', protocol: 'UDP', pattern: [1,1,1,1,1,1,1], windowHint: 1 },
    'Live game':     { desc: 'Low-latency updates — UDP preferred. Stale game-state data is useless.', protocol: 'UDP', pattern: [1,1,1,1,1,1], windowHint: 1 },
};

/* ════════════════════════════════════════
   BUILD — simulation steps
   ════════════════════════════════════════ */
function buildTcpSteps(windowSize, dropAt, totalData) {
    const steps = [];
    let pktsSent = 0, pktsLost = 0, retrans = 0, acked = 0;
    let cwnd = 1, ssthresh = 8, cwndHistory = [1];
    let tcpState = 'CLOSED', udpLoss = false;

    // 3-way handshake
    steps.push({ type:'handshake', arrow:'SYN', from:'client', to:'server', tcpState:'SYN_SENT', udpState:'—', pktsSent:++pktsSent, pktsLost, retrans, acked, cwnd, windowSize, throughput: 0, explanation:'Client sends SYN packet to initiate connection. Sequence number is randomly generated.', insight:'SYN (Synchronize): The first step of the 3-way handshake. Client proposes initial sequence number.', cwndHistory:[...cwndHistory] });
    tcpState = 'SYN_SENT';
    steps.push({ type:'handshake', arrow:'SYN-ACK', from:'server', to:'client', tcpState:'SYN_RCVD', udpState:'—', pktsSent:++pktsSent, pktsLost, retrans, acked, cwnd, windowSize, throughput: 0, explanation:'Server responds with SYN-ACK: acknowledges client\'s SYN and sends its own SYN.', insight:'SYN-ACK: Server agrees to connect. Contains both acknowledgment and server\'s own sequence number.', cwndHistory:[...cwndHistory] });
    tcpState = 'SYN_RCVD';
    steps.push({ type:'handshake', arrow:'ACK', from:'client', to:'server', tcpState:'ESTABLISHED', udpState:'—', pktsSent:++pktsSent, pktsLost, retrans, acked:++acked, cwnd, windowSize, throughput: 0, explanation:'Client sends final ACK. Connection is now ESTABLISHED — data can flow.', insight:'3-WAY HANDSHAKE COMPLETE: Both sides have synchronized sequence numbers and confirmed connectivity.', cwndHistory:[...cwndHistory] });
    tcpState = 'ESTABLISHED';

    // Data transfer
    let seqNum = 1;
    for (let i = 0; i < totalData; i++) {
        const sendCount = Math.min(windowSize, totalData - i);
        // Send window of segments
        for (let w = 0; w < sendCount && (i + w) < totalData; w++) {
            const thisSeq = seqNum + w;
            const isDrop = (dropAt !== null && thisSeq === dropAt);

            if (isDrop) {
                // TCP: packet drop
                pktsLost++;
                cwnd = Math.max(1, Math.floor(cwnd / 2));
                ssthresh = cwnd;
                cwndHistory.push(cwnd);
                steps.push({
                    type:'data', arrow:`DATA[${thisSeq}]`, from:'client', to:'server',
                    dropped: true, tcpState, udpState:'sending',
                    pktsSent:++pktsSent, pktsLost, retrans, acked, cwnd, windowSize,
                    throughput: Math.round((acked * 1024) / Math.max(1, pktsSent) * 10) / 10,
                    explanation:`Packet DATA[${thisSeq}] is DROPPED! TCP detects loss via timeout. Congestion window halved from ${cwnd*2} to ${cwnd}.`,
                    insight:'PACKET LOSS: TCP uses timeouts and duplicate ACKs to detect loss. The congestion window is reduced to slow down sending.',
                    cwndHistory:[...cwndHistory],
                });

                // UDP side: silent loss
                steps.push({
                    type:'udp-loss', arrow:`DATA[${thisSeq}]`, from:'client', to:'server',
                    tcpState, udpState:'DATA LOST',
                    pktsSent, pktsLost, retrans, acked, cwnd, windowSize,
                    throughput: Math.round((acked * 1024) / Math.max(1, pktsSent) * 10) / 10,
                    explanation:`UDP: Same packet DATA[${thisSeq}] is also lost — but UDP has NO retransmission. Data is gone forever. Application must handle it.`,
                    insight:'UDP IS STATELESS: No connection tracking, no retransmission, no congestion control. Fire-and-forget.',
                    cwndHistory:[...cwndHistory],
                });

                // TCP retransmission
                retrans++;
                cwnd = Math.min(cwnd + 1, windowSize);
                cwndHistory.push(cwnd);
                steps.push({
                    type:'retransmit', arrow:`DATA[${thisSeq}] (retx)`, from:'client', to:'server',
                    tcpState, udpState:'—',
                    pktsSent:++pktsSent, pktsLost, retrans, acked, cwnd, windowSize,
                    throughput: Math.round((acked * 1024) / Math.max(1, pktsSent) * 10) / 10,
                    explanation:`TCP retransmits DATA[${thisSeq}]. Slow start resumes — congestion window grows from ${cwnd-1} to ${cwnd}.`,
                    insight:'RETRANSMISSION: TCP guarantees delivery by resending lost packets. This adds latency but ensures reliability.',
                    cwndHistory:[...cwndHistory],
                });
            } else {
                cwnd = Math.min(cwnd < ssthresh ? cwnd * 2 : cwnd + 1, windowSize * 2);
                cwndHistory.push(cwnd);
                steps.push({
                    type:'data', arrow:`DATA[${thisSeq}]`, from:'client', to:'server',
                    dropped: false, tcpState, udpState:'sending',
                    pktsSent:++pktsSent, pktsLost, retrans, acked, cwnd, windowSize,
                    throughput: Math.round((acked * 1024) / Math.max(1, pktsSent) * 10) / 10,
                    explanation:`Sending DATA[${thisSeq}]. Congestion window: ${cwnd}. ${cwnd < ssthresh ? 'Slow start (exponential growth)' : 'Congestion avoidance (linear growth)'}.`,
                    insight: cwnd < ssthresh ? 'SLOW START: cwnd doubles each RTT until ssthresh is reached, probing for available bandwidth.' : 'CONGESTION AVOIDANCE: cwnd increases by 1 MSS per RTT — gentle probing to avoid overwhelming the network.',
                    cwndHistory:[...cwndHistory],
                });
            }
        }

        // ACK
        acked += sendCount;
        steps.push({
            type:'ack', arrow:`ACK[${seqNum + sendCount - 1}]`, from:'server', to:'client',
            tcpState, udpState:'—',
            pktsSent, pktsLost, retrans, acked, cwnd, windowSize,
            throughput: Math.round((acked * 1024) / Math.max(1, pktsSent) * 10) / 10,
            explanation:`Server acknowledges up to sequence ${seqNum + sendCount - 1}. Window slides forward.`,
            insight:'CUMULATIVE ACK: TCP acknowledges all bytes received up to this point, allowing the window to advance.',
            cwndHistory:[...cwndHistory],
        });

        seqNum += sendCount;
        i += sendCount - 1; // skip forward by window
    }

    // Connection teardown
    steps.push({ type:'fin', arrow:'FIN', from:'client', to:'server', tcpState:'FIN_WAIT_1', udpState:'—', pktsSent:++pktsSent, pktsLost, retrans, acked, cwnd, windowSize, throughput: Math.round((acked * 1024) / Math.max(1, pktsSent) * 10) / 10, explanation:'Client sends FIN to close the connection. Enters FIN_WAIT_1 state.', insight:'FIN (Finish): Signals that the sender has no more data to transmit. Connection teardown begins.', cwndHistory:[...cwndHistory] });
    steps.push({ type:'fin', arrow:'FIN-ACK', from:'server', to:'client', tcpState:'TIME_WAIT', udpState:'—', pktsSent:++pktsSent, pktsLost, retrans, acked, cwnd, windowSize, throughput: Math.round((acked * 1024) / Math.max(1, pktsSent) * 10) / 10, explanation:'Server acknowledges FIN and sends its own FIN. Client enters TIME_WAIT (waits 2×MSL before closing).', insight:'TIME_WAIT: Client waits to ensure the final ACK reaches the server. Prevents old packets from interfering with new connections.', cwndHistory:[...cwndHistory] });
    steps.push({ type:'done', arrow:'', from:'', to:'', tcpState:'CLOSED', udpState:'closed', pktsSent, pktsLost, retrans, acked, cwnd, windowSize, throughput: Math.round((acked * 1024) / Math.max(1, pktsSent) * 10) / 10, explanation:'Connection fully closed. All data delivered reliably via TCP.', insight:'TCP provides reliable, ordered delivery with congestion control. UDP provides speed with no guarantees.', cwndHistory:[...cwndHistory] });

    return steps;
}

/* ════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════ */
export default function TcpUdpSim() {
    const [windowSize, setWindowSize] = useState(3);
    const [totalData, setTotalData] = useState(8);
    const [dropAt, setDropAt] = useState(3);
    const [enableDrop, setEnableDrop] = useState(true);
    const [scenario, setScenario] = useState(null);
    const [speed, setSpeed] = useState(700);

    const [steps, setSteps] = useState([]);
    const [currentStep, setCurrentStep] = useState(-1);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [isSimMode, setIsSimMode] = useState(false);

    const timerRef = useRef(null);
    const stepRef = useRef(-1);
    const stepsRef = useRef([]);

    const curStep = currentStep >= 0 && currentStep < steps.length ? steps[currentStep] : null;

    const advanceStep = useCallback(() => {
        const next = stepRef.current + 1;
        if (next >= stepsRef.current.length) {
            setCurrentStep(stepsRef.current.length - 1);
            setIsRunning(false);
            setIsFinished(true);
            clearInterval(timerRef.current);
            return;
        }
        setCurrentStep(next);
        stepRef.current = next;
    }, []);

    const handleStart = () => {
        const s = buildTcpSteps(windowSize, enableDrop ? dropAt : null, totalData);
        stepsRef.current = s; setSteps(s);
        setCurrentStep(-1); stepRef.current = -1;
        setIsRunning(true); setIsPaused(false); setIsFinished(false); setIsSimMode(true);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(advanceStep, speed);
    };
    const handlePause = () => { setIsRunning(false); setIsPaused(true); clearInterval(timerRef.current); };
    const handleResume = () => { setIsRunning(true); setIsPaused(false); timerRef.current = setInterval(advanceStep, speed); };
    const handleReset = () => { clearInterval(timerRef.current); setSteps([]); stepsRef.current = []; setCurrentStep(-1); stepRef.current = -1; setIsRunning(false); setIsPaused(false); setIsFinished(false); setIsSimMode(false); setScenario(null); };
    const handleStep = () => {
        if (!isSimMode) {
            const s = buildTcpSteps(windowSize, enableDrop ? dropAt : null, totalData);
            stepsRef.current = s; setSteps(s);
            setIsSimMode(true); stepRef.current = -1;
        }
        advanceStep();
    };

    useEffect(() => () => clearInterval(timerRef.current), []);

    /* ════════════════════════════════════════
       CENTER — Sequence Diagram
       ════════════════════════════════════════ */
    const CENTER = (
        <div style={{ padding: '0.5rem', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Scenario bar */}
            <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
                {Object.keys(SCENARIOS).map(s => (
                    <button key={s} onClick={() => {
                        setScenario(s);
                        const sc = SCENARIOS[s];
                        setWindowSize(sc.windowHint);
                    }} style={{
                        padding: '0.25rem 0.6rem', fontSize: '0.72rem', fontWeight: 700,
                        border: '2px solid var(--border)',
                        background: scenario === s ? 'var(--cyan)' : 'var(--white)',
                        cursor: 'pointer', fontFamily: 'var(--font-main)',
                    }}>{s}</button>
                ))}
                {scenario && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', background: 'var(--yellow)', border: '2px solid var(--border)', fontWeight: 600 }}>
                        Best: {SCENARIOS[scenario].protocol} — {SCENARIOS[scenario].desc}
                    </motion.div>
                )}
            </div>

            {/* Sequence diagram area */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
                {/* Left lifeline: Client */}
                <div style={{ width: '15%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ padding: '0.3rem 0.6rem', background: 'var(--cyan)', border: '2px solid var(--border)', fontWeight: 800, fontSize: '0.75rem', boxShadow: 'var(--shadow-sm)', marginBottom: '0.3rem' }}>CLIENT</div>
                    <div style={{ width: 3, flex: 1, background: 'var(--border)' }} />
                </div>

                {/* Arrows */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0.3rem 0', scrollbarWidth: 'thin' }}>
                    {steps.slice(0, Math.max(0, currentStep + 1)).map((step, i) => {
                        const isActive = i === currentStep;
                        const goRight = step.from === 'client';
                        const isDrop = step.dropped;
                        const isRetx = step.type === 'retransmit';
                        const isUdpLoss = step.type === 'udp-loss';

                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: goRight ? -20 : 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0.15rem 0',
                                    gap: '0.3rem',
                                    position: 'relative',
                                }}
                            >
                                {!goRight && <div style={{ flex: 1 }} />}
                                <motion.div
                                    animate={{ scale: isActive ? 1.05 : 1 }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        padding: '0.2rem 0.5rem',
                                        background: isDrop ? 'var(--pink)' : isRetx ? 'var(--orange)' : isUdpLoss ? '#ffcdd2' :
                                            step.type === 'handshake' ? 'var(--cyan)' : step.type === 'ack' ? 'var(--green)' :
                                            step.type === 'fin' ? 'var(--purple)' : step.type === 'done' ? 'var(--green)' : 'var(--yellow)',
                                        border: `2px solid var(--border)`,
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        fontFamily: 'var(--font-mono)',
                                        boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                                        textDecoration: isDrop ? 'line-through' : 'none',
                                        opacity: isDrop ? 0.7 : 1,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {goRight ? '→' : '←'} {step.arrow}
                                    {isDrop && ' ✗'}
                                    {isUdpLoss && ' UDP LOST'}
                                </motion.div>
                                {goRight && <div style={{ flex: 1 }} />}
                            </motion.div>
                        );
                    })}
                    {steps.length === 0 && (
                        <div style={{ textAlign: 'center', opacity: 0.3, padding: '2rem', fontSize: '0.85rem' }}>
                            Start simulation to see sequence diagram...
                        </div>
                    )}
                </div>

                {/* Right lifeline: Server */}
                <div style={{ width: '15%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ padding: '0.3rem 0.6rem', background: 'var(--green)', border: '2px solid var(--border)', fontWeight: 800, fontSize: '0.75rem', boxShadow: 'var(--shadow-sm)', marginBottom: '0.3rem' }}>SERVER</div>
                    <div style={{ width: 3, flex: 1, background: 'var(--border)' }} />
                </div>
            </div>

            {/* Congestion control graph */}
            {curStep?.cwndHistory?.length > 1 && (
                <div style={{ height: 90, borderTop: '2px solid var(--border)', marginTop: '0.3rem', flexShrink: 0, padding: '0.3rem 0.5rem', position: 'relative' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>Congestion Window (cwnd)</div>
                    <svg width="100%" height="60" viewBox={`0 0 ${curStep.cwndHistory.length * 12} 60`} preserveAspectRatio="none" style={{ display: 'block' }}>
                        <polyline
                            fill="none"
                            stroke="var(--cyan)"
                            strokeWidth="2"
                            points={curStep.cwndHistory.map((v, i) => `${i * 12},${60 - (v / (windowSize * 2)) * 55}`).join(' ')}
                        />
                        {curStep.cwndHistory.map((v, i) => (
                            <circle key={i} cx={i * 12} cy={60 - (v / (windowSize * 2)) * 55} r="2" fill="var(--border)" />
                        ))}
                    </svg>
                </div>
            )}
        </div>
    );

    /* ════════════════════════════════════════
       LEFT — System State + TCP State Machine
       ════════════════════════════════════════ */
    const LEFT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* TCP State Machine */}
            <div style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ background: 'var(--cyan)', padding: '0.25rem 0.5rem', borderBottom: '2px solid var(--border)', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase' }}>TCP State Machine</div>
                <div style={{ padding: '0.35rem 0.4rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {TCP_STATES.filter((s, i, arr) => arr.indexOf(s) === i || i === arr.length - 1).map((state, idx) => (
                        <motion.div
                            key={`${state}-${idx}`}
                            animate={{
                                background: curStep?.tcpState === state ? (STATE_COLORS[state] || '#e0e0e0') : 'transparent',
                                scale: curStep?.tcpState === state ? 1.02 : 1,
                            }}
                            style={{
                                padding: '0.2rem 0.4rem', fontSize: '0.68rem', fontWeight: 700,
                                fontFamily: 'var(--font-mono)', border: '1px solid var(--border)',
                                textAlign: 'center',
                            }}
                        >{state}</motion.div>
                    ))}
                </div>
            </div>

            {/* Stats */}
            {[
                { label: 'Connection', val: curStep?.tcpState ?? 'CLOSED', color: 'var(--cyan)' },
                { label: 'Packets Sent', val: curStep?.pktsSent ?? 0, color: 'var(--yellow)' },
                { label: 'Packets Lost', val: curStep?.pktsLost ?? 0, color: 'var(--pink)' },
                { label: 'Retransmissions', val: curStep?.retrans ?? 0, color: 'var(--orange)' },
                { label: 'Window Size', val: curStep?.windowSize ?? windowSize, color: 'var(--green)' },
                { label: 'Throughput', val: `${curStep?.throughput ?? 0} KB/s`, color: 'var(--purple)' },
            ].map(s => (
                <div key={s.label} style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ background: s.color, padding: '0.2rem 0.4rem', borderBottom: '2px solid var(--border)', fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase' }}>{s.label}</div>
                    <div style={{ padding: '0.25rem 0.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{s.val}</div>
                </div>
            ))}
        </div>
    );

    /* ════════════════════════════════════════
       RIGHT — Learning Lab
       ════════════════════════════════════════ */
    const RIGHT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {curStep && (
                <AnimatePresence mode="wait">
                    <motion.div key={currentStep} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                            <div style={{ background: 'var(--cyan)', padding: '0.4rem 0.6rem', borderBottom: '2px solid var(--border)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                Algorithm Logic
                            </div>
                            <div style={{ padding: '0.5rem 0.6rem', fontSize: '0.82rem', lineHeight: 1.5 }}>{curStep.explanation}</div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}
            {curStep && (
                <div style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--yellow)', padding: '0.4rem 0.6rem', borderBottom: '2px solid var(--border)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                        Educational Insight
                    </div>
                    <div style={{ padding: '0.5rem 0.6rem', fontSize: '0.8rem', lineHeight: 1.5, opacity: 0.85 }}>{curStep.insight}</div>
                </div>
            )}
            {/* TCP vs UDP comparison */}
            <div style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <div style={{ background: 'var(--green)', padding: '0.4rem 0.6rem', borderBottom: '2px solid var(--border)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    Concept: TCP vs UDP
                </div>
                <div style={{ padding: '0.5rem 0.6rem', fontSize: '0.72rem', lineHeight: 1.5 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem', fontSize: '0.68rem' }}>
                        <div style={{ fontWeight: 800, background: 'var(--cyan)', padding: '0.2rem', textAlign: 'center', border: '1px solid var(--border)' }}>TCP</div>
                        <div style={{ fontWeight: 800, background: 'var(--orange)', padding: '0.2rem', textAlign: 'center', border: '1px solid var(--border)' }}>UDP</div>
                        <div style={{ padding: '0.15rem 0.3rem', border: '1px solid var(--border)' }}>Connection-oriented</div>
                        <div style={{ padding: '0.15rem 0.3rem', border: '1px solid var(--border)' }}>Connectionless</div>
                        <div style={{ padding: '0.15rem 0.3rem', border: '1px solid var(--border)' }}>Reliable delivery</div>
                        <div style={{ padding: '0.15rem 0.3rem', border: '1px solid var(--border)' }}>Best-effort</div>
                        <div style={{ padding: '0.15rem 0.3rem', border: '1px solid var(--border)' }}>Flow + congestion ctrl</div>
                        <div style={{ padding: '0.15rem 0.3rem', border: '1px solid var(--border)' }}>No control</div>
                        <div style={{ padding: '0.15rem 0.3rem', border: '1px solid var(--border)' }}>Ordered</div>
                        <div style={{ padding: '0.15rem 0.3rem', border: '1px solid var(--border)' }}>Unordered</div>
                    </div>
                </div>
            </div>
        </div>
    );

    const TL = steps.map((s, i) => ({
        id: i, label: s.arrow || s.type, done: i < currentStep, active: i === currentStep,
    }));

    return (
        <ImmersiveLayout
            isActive={isSimMode}
            title="TCP vs UDP & 3-Way Handshake"
            icon={<HandshakeIcon size={20} />}
            moduleLabel="CN MODULE"
            isRunning={isRunning} isPaused={isPaused} isFinished={isFinished}
            speed={speed} onSpeedChange={setSpeed}
            onStart={handleStart} onPause={handlePause} onResume={handleResume} onReset={handleReset} onStep={handleStep}
            currentStepNum={Math.max(0, currentStep + 1)} totalSteps={steps.length}
            phaseName={curStep?.arrow ?? ''} centerContent={CENTER} leftContent={LEFT} rightContent={RIGHT}
            timelineItems={TL}
            legend={[
                { color: 'var(--cyan)', label: 'Handshake' },
                { color: 'var(--yellow)', label: 'Data' },
                { color: 'var(--green)', label: 'ACK' },
                { color: 'var(--pink)', label: 'Dropped' },
                { color: 'var(--orange)', label: 'Retransmit' },
                { color: 'var(--purple)', label: 'FIN' },
            ]}
        >
            {/* Config mode */}
            <div className="main-content">
                <div style={{ marginBottom: '0.4rem' }}><Link to="/networks" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← Networks Module</Link></div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="section-header">Networks · Transport Layer</div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><HandshakeIcon size={28} /> TCP vs UDP & 3-Way Handshake</h1>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '0.3rem' }}>Vertical sequence diagram with handshake, data transfer, packet drops, retransmissions, congestion control, and protocol comparison.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                    <div className="panel">
                        <div className="panel-header" style={{ background: 'var(--cyan)' }}>⚙ Configuration</div>
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label className="form-label">Window Size (1-8)</label>
                                    <input type="range" min={1} max={8} value={windowSize} onChange={e => setWindowSize(+e.target.value)}
                                        style={{ width: '100%' }} />
                                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, textAlign: 'center' }}>{windowSize}</div>
                                </div>
                                <div>
                                    <label className="form-label">Total Data Segments</label>
                                    <input type="number" className="form-input" value={totalData} min={3} max={20} onChange={e => setTotalData(Math.max(3, +e.target.value || 3))} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={enableDrop} onChange={e => setEnableDrop(e.target.checked)} />
                                    Drop packet at seq #:
                                </label>
                                <input type="number" className="form-input" value={dropAt} min={1} max={totalData} onChange={e => setDropAt(+e.target.value || 1)} disabled={!enableDrop} style={{ width: 60 }} />
                            </div>
                        </div>
                    </div>
                    <div className="panel">
                        <div className="panel-header" style={{ background: 'var(--cyan)' }}>🏷 Concepts Covered</div>
                        <div style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                                {['SYN','ACK','Window','Congestion','Reliability','Stateless'].map(t => (
                                    <span key={t} style={{
                                        fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                                        padding: '0.2rem 0.5rem', border: '2px solid var(--border)', background: 'var(--cyan)',
                                    }}>{t}</span>
                                ))}
                            </div>
                            <p style={{ fontSize: '0.82rem', opacity: 0.7 }}>
                                See the 3-way handshake, compare TCP reliability vs UDP speed, inject packet drops, and watch congestion control in action.
                            </p>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-lg btn-cyan" onClick={handleStart}>▶ Simulate</button>
                    <button className="btn btn-sm" style={{ marginTop: '0.15rem' }} onClick={handleStep}>⏭ Step Through</button>
                </div>
            </div>
        </ImmersiveLayout>
    );
}
