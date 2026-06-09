import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import { InboxIcon, GlobeIcon, CpuIcon, SignalIcon } from '../../components/Icons';

export default function MessageQueueSim() {
    const [queue, setQueue] = useState([]); // Pending messages: { id, content, retries: 0 }
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const h = () => setIsMobile(window.innerWidth < 768);
        h(); window.addEventListener('resize', h);
        return () => window.removeEventListener('resize', h);
    }, []);
    const [dlq, setDlq] = useState([]); // Dead letter queue messages
    
    // Sliders
    const [producerRate, setProducerRate] = useState(2); // messages per second
    const [consumerDelay, setConsumerDelay] = useState(1.5); // seconds to process
    const [failureRate, setFailureRate] = useState(20); // % chance to fail
    const [maxRetries, setMaxRetries] = useState(3);

    const [producingRequest, setProducingRequest] = useState(null); // { msg, stage }
    const [consumingRequest, setConsumingRequest] = useState(null); // { msg, stage }
    const [activePackets, setActivePackets] = useState([]); // { id, type, status, content }
    const [metrics, setMetrics] = useState({ processed: 0, failed: 0, retries: 0 });
    const [history, setHistory] = useState(['Message Queue simulation online.']);

    // Simulation states
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [speed, setSpeed] = useState(700); // 700 is the 1x speed option from SimulationController
    const [labTab, setLabTab] = useState('decoder'); // 'decoder' | 'overview' | 'dlq' | 'guide'

    const speedFactor = speed / 700;
    const animDuration = 500 * speedFactor;

    const msgCounter = useRef(0);

    // 1. Producer Loop (Runs if running and idle)
    useEffect(() => {
        let interval = null;
        if (isRunning && !isPaused && !isFinished) {
            const ms = (1000 / producerRate) * speedFactor;
            interval = setInterval(() => {
                if (producingRequest) return; // Wait for active production animations to clear
                
                const totalCreated = metrics.processed + dlq.length + queue.length + (producingRequest ? 1 : 0) + (consumingRequest ? 1 : 0);
                if (totalCreated >= 10) {
                    return; // No more tasks can enter the system
                }

                produceMessage();
            }, ms);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, isPaused, isFinished, producerRate, speedFactor, producingRequest, consumingRequest, queue.length, metrics.processed, dlq.length]);

    // 2. Consumer Loop (Polls queue and processes messages)
    useEffect(() => {
        if (isRunning && !isPaused && !isFinished && queue.length > 0 && !consumingRequest) {
            pullMessageForConsumer();
        }
    }, [isRunning, isPaused, isFinished, queue, consumingRequest]);

    // Check if simulation is finished
    useEffect(() => {
        const resolvedCount = metrics.processed + dlq.length;
        if (resolvedCount >= 10) {
            setIsFinished(true);
            setIsRunning(false);
        }
    }, [metrics.processed, dlq.length]);

    const produceMessage = (manual = false) => {
        if (producingRequest) return;
        
        const totalCreated = metrics.processed + dlq.length + queue.length + (producingRequest ? 1 : 0) + (consumingRequest ? 1 : 0);
        if (totalCreated >= 10) {
            return;
        }

        if (queue.length >= 10) {
            setHistory(h => [`[QUEUE] BUFFER OVERFLOW: Main buffer pipe is full. Dropped producer message.`, ...h.slice(0, 49)]);
            return;
        }

        msgCounter.current++;
        const id = msgCounter.current;
        const newMsg = {
            id,
            content: manual ? `Manual Task #${id}` : `Task #${id}`,
            retries: 0
        };

        setProducingRequest({ msg: newMsg, stage: 'producer-to-queue' });
        setHistory(h => [`[PRODUCER] Dispatched ${newMsg.content} to queue buffer`, ...h.slice(0, 49)]);

        const pktId = `prod-${id}-${Date.now()}`;
        // Animate packet producer-to-queue
        setActivePackets(prev => [...prev, {
            id: pktId,
            type: 'produce',
            status: 'producer-to-queue',
            content: newMsg.content
        }]);

        setTimeout(() => {
            setQueue(q => [...q, newMsg]);
            setActivePackets(prev => prev.filter(p => p.id !== pktId));
            setProducingRequest(null);
        }, animDuration);
    };

    const pullMessageForConsumer = () => {
        if (queue.length === 0 || consumingRequest) return;

        const msg = queue[0];
        setQueue(q => q.slice(1));

        setConsumingRequest({ msg, stage: 'queue-to-consumer' });
        setHistory(h => [`[CONSUMER] Pulling ${msg.content} from queue buffer...`, ...h.slice(0, 49)]);

        const pktId = `cons-${msg.id}-${Date.now()}`;
        // Animate packet queue-to-consumer
        setActivePackets(prev => [...prev, {
            id: pktId,
            type: 'consume',
            status: 'queue-to-consumer',
            content: msg.content
        }]);

        setTimeout(() => {
            setActivePackets(prev => prev.filter(p => p.id !== pktId));
            setConsumingRequest({ msg, stage: 'consumer-process' });

            // processing countdown duration
            setTimeout(() => {
                const rand = Math.random() * 100;
                const isFail = rand < failureRate;

                if (isFail) {
                    const updatedMsg = { ...msg, retries: msg.retries + 1 };
                    setMetrics(m => ({ ...m, retries: m.retries + 1 }));

                    if (updatedMsg.retries > maxRetries) {
                        // Exceeded Max Retries -> Discard Task
                        setConsumingRequest({ msg: updatedMsg, stage: 'failed-discard' });
                        setHistory(h => [`[DISCARD] ${msg.content} failed after max retries (${maxRetries}). Discarding task!`, ...h.slice(0, 49)]);

                        setTimeout(() => {
                            setDlq(d => [...d, updatedMsg]); // Keep metrics and DLQ count intact for limits
                            setMetrics(m => ({ ...m, failed: m.failed + 1 }));
                            setConsumingRequest(null);
                        }, animDuration);

                    } else {
                        // Failed but can retry -> Append back to Queue entry
                        setConsumingRequest({ msg: updatedMsg, stage: 'failed-retry' });
                        setHistory(h => [`[CONSUMER] Execution failed for ${msg.content}. Retrying (Attempt ${updatedMsg.retries}/${maxRetries}).`, ...h.slice(0, 49)]);

                        const retryPktId = `retry-${msg.id}-${Date.now()}`;
                        setActivePackets(prev => [...prev, {
                            id: retryPktId,
                            type: 'retry',
                            status: 'consumer-to-queue',
                            content: msg.content
                        }]);

                        setTimeout(() => {
                            setQueue(q => [...q, updatedMsg]);
                            setActivePackets(prev => prev.filter(p => p.id !== retryPktId));
                            setConsumingRequest(null);
                        }, animDuration);
                    }

                } else {
                    // Success!
                    setConsumingRequest({ msg, stage: 'success' });
                    setMetrics(m => ({ ...m, processed: m.processed + 1 }));
                    setHistory(h => [`[CONSUMER] Successfully processed ${msg.content}`, ...h.slice(0, 49)]);

                    setTimeout(() => {
                        setConsumingRequest(null);
                    }, animDuration);
                }

            }, consumerDelay * 1000 * speedFactor);

        }, animDuration);
    };

    const handleReset = () => {
        setQueue([]);
        setDlq([]);
        setProducingRequest(null);
        setConsumingRequest(null);
        setActivePackets([]);
        setMetrics({ processed: 0, failed: 0, retries: 0 });
        setHistory(['Simulation reset. Queue cleared.']);
        setIsRunning(false);
        setIsPaused(false);
        setIsFinished(false);
        msgCounter.current = 0;
    };

    // Helper functions to get guide workflow steps
    const getWorkflowSteps = (consumingReq) => {
        if (!consumingReq) return [];
        const { stage } = consumingReq;
        if (stage === 'failed-dlq' || stage === 'failed-discard') {
            return [
                { id: 'queue-to-consumer', label: '1. Pull Task', desc: 'Consumer pulls task from queue' },
                { id: 'failed-discard', label: '2. Max Retries Met', desc: `Failed > ${maxRetries} times` },
                { id: 'discarded', label: '3. Discard Task', desc: 'Task discarded from system' }
            ];
        }
        if (stage === 'failed-retry' || stage === 'route-to-queue') {
            return [
                { id: 'queue-to-consumer', label: '1. Pull Task', desc: 'Consumer pulls task from queue' },
                { id: 'failed-retry', label: '2. Failed Attempt', desc: 'Retry triggered' },
                { id: 'route-to-queue', label: '3. Re-queue Task', desc: 'Append back to queue buffer' }
            ];
        }
        return [
            { id: 'queue-to-consumer', label: '1. Pull Task', desc: 'Consumer pulls task from queue' },
            { id: 'consumer-process', label: '2. Execute Task', desc: `Process task (delay: ${consumerDelay}s)` },
            { id: 'success', label: '3. Complete', desc: 'Task completed successfully' }
        ];
    };

    const isStepActive = (stepId, consumingReq) => {
        if (!consumingReq) return false;
        if (stepId === 'failed-discard' && consumingReq.stage === 'failed-dlq') return true;
        return consumingReq.stage === stepId;
    };

    const isStepDone = (stepId, consumingReq) => {
        if (!consumingReq) return false;
        const { stage } = consumingReq;
        if (stage === 'failed-dlq' || stage === 'failed-discard') {
            const order = ['queue-to-consumer', 'failed-discard', 'discarded'];
            const mappedStage = stage === 'failed-dlq' ? 'failed-discard' : stage;
            return order.indexOf(mappedStage) > order.indexOf(stepId);
        }
        if (stage === 'failed-retry') {
            const order = ['queue-to-consumer', 'failed-retry', 'route-to-queue'];
            return order.indexOf(stage) > order.indexOf(stepId);
        }
        const order = ['queue-to-consumer', 'consumer-process', 'success'];
        return order.indexOf(stage) > order.indexOf(stepId);
    };

    const isLineActive = (from, to) => {
        if (from === 'producer' && to === 'queue') {
            return producingRequest && producingRequest.stage === 'producer-to-queue';
        }
        if (consumingRequest) {
            const { stage } = consumingRequest;
            if (from === 'queue' && to === 'consumer') {
                return stage === 'queue-to-consumer';
            }
            if (from === 'consumer' && to === 'queue') {
                return stage === 'failed-retry';
            }
        }
        return false;
    };

    const getConceptExplanation = () => {
        const concepts = [];

        if (producingRequest) {
            concepts.push({
                title: "Temporal Decoupling",
                operation: "Producer Dispatches Message",
                color: "var(--yellow)",
                metrics: [
                    { label: "Role", value: "Upstream Publisher" },
                    { label: "Target", value: "Queue Buffer Pipe" }
                ],
                why: "In synchronous designs, if downstream systems slow down, the client request blocks. By publishing to a queue, the producer immediately finishes, maintaining low API response times.",
                impact: "Decouples microservices. High availability is maintained even if workers are temporarily unresponsive."
            });
        }

        if (consumingRequest) {
            const { stage, msg } = consumingRequest;
            if (stage === 'queue-to-consumer') {
                concepts.push({
                    title: "Pull-Based Processing",
                    operation: "Consumer Polls Message",
                    color: "var(--cyan)",
                    metrics: [
                        { label: "Trigger", value: "Polled Pull (polling)" },
                        { label: "Active Task", value: msg.content }
                    ],
                    why: "Instead of having producers push data directly to workers (which can overload CPU/memory), the worker polls tasks only when it has the capacity to execute them.",
                    impact: "Protects consumers from memory exhaustion during heavy traffic spikes."
                });
            } else if (stage === 'consumer-process') {
                concepts.push({
                    title: "Asynchronous Execution",
                    operation: "Consumer Processes Task",
                    color: "var(--green)",
                    metrics: [
                        { label: "Status", value: "Actively Executing" },
                        { label: "Latency", value: `${consumerDelay}s duration` }
                    ],
                    why: "Heavy computation (e.g., generating PDFs, database writes, external APIs) is run out-of-band in the background so the user-facing thread isn't blocked.",
                    impact: "Guarantees highly responsive user interfaces and efficient server thread management."
                });
            } else if (stage === 'failed-retry') {
                concepts.push({
                    title: "At-Least-Once Delivery & Retries",
                    operation: `Task Failure (Attempt ${msg.retries}/${maxRetries})`,
                    color: "var(--pink)",
                    metrics: [
                        { label: "Status", value: "Temporary Failure" },
                        { label: "Strategy", value: "NACK / Re-queue" }
                    ],
                    why: "Temporary network blips or database locking should not lead to data loss. The consumer rejects the task, and it is sent to the back of the queue for later execution.",
                    impact: "Ensures fault tolerance and system resilience against transient errors."
                });
            } else if (stage === 'failed-dlq' || stage === 'failed-discard') {
                concepts.push({
                    title: "Fatal Failure & Discard Strategy",
                    operation: "Discarding Failed Task",
                    color: "var(--pink)",
                    metrics: [
                        { label: "Status", value: "Fatal Failure" },
                        { label: "Limit", value: `> ${maxRetries} Retries` }
                    ],
                    why: "If a task is corrupt (e.g., malformed JSON or divided by zero), retrying it infinitely blocks other healthy tasks and wastes server cycles. We discard the task from the system.",
                    impact: "Protects system resources from being consumed by unprocessable event loops."
                });
            } else if (stage === 'success') {
                concepts.push({
                    title: "Message Acknowledgment (ACK)",
                    operation: "Consumer Completed Task",
                    color: "var(--green)",
                    metrics: [
                        { label: "Signal", value: "ACK (Acknowledge)" },
                        { label: "Action", value: "De-queue Task" }
                    ],
                    why: "Once processing completes successfully, the consumer sends an acknowledgment (ACK). The queue server then safely removes the task from the queue buffer.",
                    impact: "Prevents double-processing and guarantees messages are only deleted after successful completion."
                });
            }
        }

        if (concepts.length === 0) {
            if (queue.length > 0) {
                concepts.push({
                    title: "Load Leveling (Buffering)",
                    operation: `Queue Buffering (${queue.length} task${queue.length > 1 ? 's' : ''})`,
                    color: "var(--cyan)",
                    metrics: [
                        { label: "Buffer Count", value: `${queue.length} tasks` },
                        { label: "Load State", value: queue.length > 5 ? "Backlogged" : "Healthy" }
                    ],
                    why: "The queue buffer absorbs sudden traffic spikes (bursts) and stores them safely. The consumer processes them at a steady, consistent rate.",
                    impact: "Prevents systems from failing under peak traffic, avoiding expensive hardware over-provisioning."
                });
            } else {
                concepts.push({
                    title: "Message Queue Idle",
                    operation: "Awaiting Simulation Traffic",
                    color: "#6c7086",
                    metrics: [
                        { label: "Status", value: "Ready" },
                        { label: "Tasks", value: "0" }
                    ],
                    why: "No messages are currently being produced, buffered, or consumed.",
                    impact: "Start the simulation or click '+ Produce Task' to trace events and decode system design concepts."
                });
            }
        }

        return concepts;
    };

    const totalOps = metrics.processed + dlq.length;

    return (
        <ImmersiveLayout
            isActive={true}
            title="Message Queue Visualizer (MQ)"
            icon={<InboxIcon size={20} />}
            moduleLabel="System Design"
            isRunning={isRunning}
            isPaused={isPaused}
            isFinished={isFinished}
            speed={speed}
            onSpeedChange={setSpeed}
            onStart={() => setIsRunning(true)}
            onPause={() => setIsPaused(true)}
            onResume={() => { setIsRunning(true); setIsPaused(false); }}
            onReset={handleReset}
            onStep={() => produceMessage(true)}
            currentStepNum={totalOps}
            totalSteps={10}
            phaseName={queue.length > 5 ? "Backlogged" : "Healthy"}
            hideFooter={true}
            leftContent={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                        <div className="panel-header" style={{ background: 'var(--cyan)', padding: '4px 8px', fontSize: '0.72rem' }}>
                            Producers & Consumers
                        </div>
                        <div style={{ padding: '0.6rem', background: '#fff', fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span>Producer Rate ({producerRate} msg/s):</span>
                                <input 
                                    type="range" min="1" max="5" step="0.5"
                                    value={producerRate} 
                                    onChange={e => setProducerRate(parseFloat(e.target.value))}
                                    style={{ width: '100%' }}
                                    disabled={producingRequest !== null || consumingRequest !== null || isFinished}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span>Consumer Processing ({consumerDelay}s):</span>
                                <input 
                                    type="range" min="0.5" max="3" step="0.1"
                                    value={consumerDelay} 
                                    onChange={e => setConsumerDelay(parseFloat(e.target.value))}
                                    style={{ width: '100%' }}
                                    disabled={producingRequest !== null || consumingRequest !== null || isFinished}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span>Failure Rate ({failureRate}%):</span>
                                <input 
                                    type="range" min="0" max="80" step="5"
                                    value={failureRate} 
                                    onChange={e => setFailureRate(parseInt(e.target.value))}
                                    style={{ width: '100%' }}
                                    disabled={producingRequest !== null || consumingRequest !== null || isFinished}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span>Max Retries ({maxRetries}):</span>
                                <input 
                                    type="number" min="1" max="5"
                                    value={maxRetries} 
                                    onChange={e => setMaxRetries(parseInt(e.target.value))}
                                    style={{ width: '100%', padding: '0.2rem', border: '1.5px solid var(--border)', fontSize: '0.72rem', fontWeight: 'bold' }}
                                    disabled={producingRequest !== null || consumingRequest !== null || isFinished}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                        <div className="panel-header" style={{ background: 'var(--yellow)', padding: '4px 8px', fontSize: '0.72rem' }}>
                            Queue Statistics
                        </div>
                        <div style={{ padding: '0.6rem', background: '#fff', fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Queue Size:</span>
                                <strong style={{ fontFamily: 'var(--font-mono)' }}>{queue.length} / 10</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Success Rate:</span>
                                <strong style={{ fontFamily: 'var(--font-mono)' }}>{metrics.processed} processed</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>DLQ Failures:</span>
                                <strong style={{ fontFamily: 'var(--font-mono)', color: dlq.length > 0 ? 'var(--pink)' : 'inherit' }}>{dlq.length} msg</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Total Retries:</span>
                                <strong style={{ fontFamily: 'var(--font-mono)' }}>{metrics.retries}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            }
            centerContent={
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fafafa', overflowY: 'auto', padding: isMobile ? '0.5rem' : '1rem' }}>
                    
                    <style>{`
                        @keyframes marching-ants {
                            to {
                                stroke-dashoffset: -20;
                            }
                        }
                        @keyframes pulse {
                            0% { opacity: 0.6; }
                            50% { opacity: 1; }
                            100% { opacity: 0.6; }
                        }
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .no-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>

                    {/* Step-by-Step database scaling workflow guide board */}
                    <div style={{ marginBottom: '0.75rem', flexShrink: 0, width: '100%' }}>
                        {consumingRequest ? (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                background: '#fff',
                                border: '2.5px solid var(--border)',
                                borderRadius: '6px',
                                padding: '0.5rem',
                                boxShadow: '3px 3px 0 var(--border)',
                                width: '100%',
                                flexShrink: 0
                            }}>
                                {getWorkflowSteps(consumingRequest).map((step, idx, arr) => {
                                    const isActive = isStepActive(step.id, consumingRequest);
                                    const isDone = isStepDone(step.id, consumingRequest);
                                    return (
                                        <div 
                                            key={step.id} 
                                            style={{
                                                flex: 1,
                                                textAlign: 'center',
                                                borderRight: idx < arr.length - 1 ? '1.5px solid var(--border)' : 'none',
                                                padding: '0 6px',
                                                opacity: isActive ? 1 : isDone ? 0.85 : 0.45,
                                                transition: 'opacity 0.2s'
                                            }}
                                        >
                                            <div style={{
                                                fontSize: '0.62rem',
                                                fontWeight: 900,
                                                color: isActive ? 'var(--pink)' : isDone ? 'var(--green)' : 'inherit',
                                                textTransform: 'uppercase'
                                            }}>
                                                {step.label}
                                            </div>
                                            <div style={{ fontSize: '0.52rem', opacity: 0.7, marginTop: '1px' }}>
                                                {step.desc}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{
                                background: '#fff',
                                border: '2.5px dashed #ccc',
                                borderRadius: '6px',
                                padding: '0.5rem',
                                textAlign: 'center',
                                fontSize: '0.68rem',
                                color: '#666',
                                flexShrink: 0
                            }}>
                                No active consumer task. {queue.length > 0 ? "Consumer will poll task shortly." : "Produce a task to begin."}
                            </div>
                        )}
                    </div>

                    {/* Canvas containing nodes and wires */}
                    <div style={{ flex: 1, minHeight: isMobile ? '600px' : '520px', position: 'relative', background: '#fff', border: '2.5px solid var(--border)', borderRadius: '8px', boxShadow: '4px 4px 0 var(--border)', overflow: isMobile ? 'auto' : 'hidden', WebkitOverflowScrolling: 'touch' }}>
                        
                        {isFinished && (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(4px)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 100,
                                padding: '2rem',
                                textAlign: 'center'
                            }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--pink)', marginBottom: '0.5rem' }}>SIMULATION COMPLETED</h3>
                                <p style={{ fontSize: '0.8rem', maxWidth: '300px', opacity: 0.8, marginBottom: '1rem' }}>
                                    You have reached the strict limit of 10 simulation operations. Reset to run a new test!
                                </p>
                                <button 
                                    className="btn" 
                                    style={{ background: 'var(--cyan)', border: '2px solid var(--border)', boxShadow: '3px 3px 0 var(--border)', fontWeight: 800 }} 
                                    onClick={handleReset}
                                >
                                    Reset Simulation
                                </button>
                            </div>
                        )}

                        {/* Wires */}
                        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                            {/* Producer -> Queue */}
                            <line 
                                x1={isMobile ? "50%" : "15%"} y1={isMobile ? "18%" : "40%"} 
                                x2={isMobile ? "50%" : "31%"} y2={isMobile ? "50%" : "40%"} 
                                stroke="var(--border)" 
                                strokeWidth="2"
                                strokeDasharray="4 4"
                                opacity={isLineActive('producer', 'queue') ? 1 : 0.25}
                                style={{ transition: 'opacity 0.2s, stroke 0.2s' }}
                            />
                            {isLineActive('producer', 'queue') && (
                                <line 
                                    x1={isMobile ? "50%" : "15%"} y1={isMobile ? "18%" : "40%"} 
                                    x2={isMobile ? "50%" : "31%"} y2={isMobile ? "50%" : "40%"} 
                                    stroke="var(--green)" 
                                    strokeWidth="3.5"
                                    strokeDasharray="6 4"
                                    style={{ animation: 'marching-ants 0.6s linear infinite' }}
                                />
                            )}

                            {/* Queue -> Consumer */}
                            <line 
                                x1={isMobile ? "50%" : "69%"} y1={isMobile ? "50%" : "40%"} 
                                x2={isMobile ? "50%" : "85%"} y2={isMobile ? "82%" : "40%"} 
                                stroke="var(--border)" 
                                strokeWidth="2"
                                strokeDasharray="4 4"
                                opacity={isLineActive('queue', 'consumer') ? 1 : 0.25}
                                style={{ transition: 'opacity 0.2s, stroke 0.2s' }}
                            />
                            {isLineActive('queue', 'consumer') && (
                                <line 
                                    x1={isMobile ? "50%" : "69%"} y1={isMobile ? "50%" : "40%"} 
                                    x2={isMobile ? "50%" : "85%"} y2={isMobile ? "82%" : "40%"} 
                                    stroke="var(--green)" 
                                    strokeWidth="3.5"
                                    strokeDasharray="6 4"
                                    style={{ animation: 'marching-ants 0.6s linear infinite' }}
                                />
                            )}

                            {/* Consumer -> Queue (Retry Path) */}
                            <line 
                                x1={isMobile ? "46%" : "85%"} y1={isMobile ? "82%" : "44%"} 
                                x2={isMobile ? "46%" : "31%"} y2={isMobile ? "50%" : "44%"} 
                                stroke="var(--border)" 
                                strokeWidth="2"
                                strokeDasharray="4 4"
                                opacity={isLineActive('consumer', 'queue') ? 1 : 0.25}
                                style={{ transition: 'opacity 0.2s, stroke 0.2s' }}
                            />
                            {isLineActive('consumer', 'queue') && (
                                <line 
                                    x1={isMobile ? "46%" : "85%"} y1={isMobile ? "82%" : "44%"} 
                                    x2={isMobile ? "46%" : "31%"} y2={isMobile ? "50%" : "44%"} 
                                    stroke="var(--green)" 
                                    strokeWidth="3.5"
                                    strokeDasharray="6 4"
                                    style={{ animation: 'marching-ants 0.6s linear infinite' }}
                                />
                            )}


                        </svg>

                        {/* Producer Node */}
                        <div style={{
                            position: 'absolute',
                            left: isMobile ? '50%' : '15%',
                            top: isMobile ? '18%' : '40%',
                            transform: 'translate(-50%, -50%)',
                            border: '3px solid var(--border)',
                            background: 'var(--yellow)',
                            width: isMobile ? 120 : 150,
                            padding: '0.8rem',
                            borderRadius: '8px',
                            boxShadow: '4px 4px 0 var(--border)',
                            textAlign: 'center',
                            zIndex: 2
                        }}>
                            <div style={{ fontWeight: 800, fontSize: '0.75rem', borderBottom: '1.5px solid var(--border)', paddingBottom: '0.25rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'center' }}>
                                <GlobeIcon size={14} />
                                PRODUCER
                            </div>
                            <div style={{ fontSize: '0.6rem', opacity: 0.8, fontFamily: 'var(--font-mono)' }}>
                                Rate: <strong>{producerRate}/s</strong>
                            </div>
                            <button 
                                className="btn btn-sm" 
                                style={{ marginTop: '0.4rem', fontSize: '0.62rem', background: '#fff', width: '100%', border: '1.5px solid var(--border)', boxShadow: '2px 2px 0 var(--border)', fontWeight: 'bold' }}
                                onClick={() => produceMessage(true)}
                                disabled={producingRequest !== null || isFinished}
                            >
                                + Produce Task
                            </button>
                        </div>

                        {/* Queue Buffer Pipe Conveyer Belt */}
                        <div style={{
                            position: 'absolute',
                            left: '50%',
                            top: isMobile ? '50%' : '40%',
                            transform: 'translate(-50%, -50%)',
                            width: isMobile ? '85%' : '38%',
                            zIndex: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}>
                            <div style={{
                                background: 'var(--cyan)', border: '2px solid var(--border)', padding: '0.25rem 0.5rem',
                                borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', boxShadow: '2px 2px 0 var(--border)'
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <InboxIcon size={14} />
                                    QUEUE BUFFER
                                </span>
                                <span style={{ fontFamily: 'var(--font-mono)' }}>{queue.length} MSG</span>
                            </div>
                            
                            <div className="no-scrollbar" style={{
                                border: '2.5px solid var(--border)', padding: '0.5rem', background: '#fafafa',
                                borderRadius: '6px', boxShadow: '3px 3px 0 var(--border)',
                                display: 'flex', gap: '0.4rem', height: 70, overflowX: 'auto', alignItems: 'center',
                                scrollbarWidth: 'none', msOverflowStyle: 'none'
                            }}>
                                {queue.length === 0 ? (
                                    <div style={{ fontSize: '0.65rem', color: '#888', fontStyle: 'italic', margin: '0 auto' }}>
                                        Queue is empty (Awaiting Tasks)
                                    </div>
                                ) : (
                                    <AnimatePresence>
                                        {queue.map(item => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ scale: 0.6, opacity: 0, x: -20 }}
                                                animate={{ scale: 1, opacity: 1, x: 0 }}
                                                exit={{ scale: 0.6, opacity: 0 }}
                                                style={{
                                                    border: '1.5px solid var(--border)',
                                                    background: item.retries > 0 ? 'var(--pink)' : '#fff',
                                                    color: item.retries > 0 ? '#fff' : 'var(--text)',
                                                    padding: '3px 6px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.62rem',
                                                    fontWeight: 800,
                                                    fontFamily: 'var(--font-mono)',
                                                    flexShrink: 0,
                                                    boxShadow: '1.5px 1.5px 0 var(--border)',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                {item.content}
                                                {item.retries > 0 && (
                                                    <div style={{ fontSize: '0.5rem', opacity: 0.9 }}>
                                                        Retry {item.retries}
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </div>
                        </div>

                        {/* Consumer Node */}
                        <div style={{
                            position: 'absolute',
                            left: isMobile ? '50%' : '85%',
                            top: isMobile ? '82%' : '40%',
                            transform: 'translate(-50%, -50%)',
                            border: '3px solid var(--border)',
                            background: 'var(--green)',
                            width: isMobile ? 130 : 160,
                            padding: '0.6rem 0.8rem',
                            borderRadius: '8px',
                            boxShadow: '4px 4px 0 var(--border)',
                            zIndex: 2,
                            textAlign: 'center'
                        }}>
                            <div style={{ fontWeight: 800, fontSize: '0.72rem', borderBottom: '1.5px solid var(--border)', paddingBottom: '0.2rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'center' }}>
                                <CpuIcon size={14} />
                                CONSUMER
                            </div>
                            <div style={{ fontSize: '0.58rem', opacity: 0.8, fontFamily: 'var(--font-mono)', marginBottom: '0.3rem' }}>
                                Status: <strong>{consumingRequest ? consumingRequest.stage.replace('failed-', '').toUpperCase() : 'IDLE'}</strong>
                            </div>

                            {consumingRequest && (
                                <div style={{ 
                                    padding: '4px 6px', 
                                    background: '#fff', 
                                    border: '1.5px solid var(--border)', 
                                    borderRadius: '4px',
                                    fontSize: '0.62rem',
                                    fontFamily: 'var(--font-mono)',
                                    boxShadow: '1.5px 1.5px 0 var(--border)'
                                }}>
                                    <strong>{consumingRequest.msg.content}</strong>
                                    {consumingRequest.stage === 'consumer-process' && (
                                        <div style={{ marginTop: '0.3rem' }}>
                                            <span style={{ fontSize: '0.5rem', color: 'var(--green)' }}>Executing...</span>
                                            <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
                                                <motion.div 
                                                    initial={{ width: '0%' }}
                                                    animate={{ width: '100%' }}
                                                    transition={{ duration: consumerDelay * speedFactor, ease: 'linear' }}
                                                    style={{ height: '100%', background: 'var(--green)' }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {consumingRequest.stage === 'failed-retry' && <div style={{ fontSize: '0.5rem', color: 'var(--pink)', fontWeight: 'bold', marginTop: '2px' }}>RETRYING...</div>}
                                    {consumingRequest.stage === 'failed-discard' && <div style={{ fontSize: '0.5rem', color: 'var(--pink)', fontWeight: 'bold', marginTop: '2px' }}>DISCARDED!</div>}
                                    {consumingRequest.stage === 'failed-dlq' && <div style={{ fontSize: '0.5rem', color: 'var(--pink)', fontWeight: 'bold', marginTop: '2px' }}>DISCARDED!</div>}
                                    {consumingRequest.stage === 'success' && <div style={{ fontSize: '0.5rem', color: 'var(--green)', fontWeight: 'bold', marginTop: '2px' }}>SUCCESS!</div>}
                                </div>
                            )}
                        </div>

                        {/* Animated Packets */}
                        <AnimatePresence>
                            {activePackets.map(pkt => {
                                let initialX = '15%';
                                let initialY = '40%';
                                let animateX = '31%';
                                let animateY = '40%';
                                let pillColor = 'var(--yellow)';
                                let textColor = '#000';
                                let label = pkt.content;

                                if (pkt.status === 'producer-to-queue') {
                                    initialX = isMobile ? '50%' : '15%';
                                    initialY = isMobile ? '18%' : '40%';
                                    animateX = isMobile ? '50%' : '31%';
                                    animateY = isMobile ? '50%' : '40%';
                                    pillColor = 'var(--yellow)';
                                } else if (pkt.status === 'queue-to-consumer') {
                                    initialX = isMobile ? '50%' : '69%';
                                    initialY = isMobile ? '50%' : '40%';
                                    animateX = isMobile ? '50%' : '85%';
                                    animateY = isMobile ? '82%' : '40%';
                                    pillColor = 'var(--cyan)';
                                } else if (pkt.status === 'consumer-to-queue') {
                                    initialX = isMobile ? '46%' : '85%';
                                    initialY = isMobile ? '82%' : '44%';
                                    animateX = isMobile ? '46%' : '31%';
                                    animateY = isMobile ? '50%' : '44%';
                                    pillColor = 'var(--pink)';
                                    textColor = '#fff';
                                    label = `RETRY ${pkt.content}`;
                                }

                                return (
                                    <motion.div
                                        key={pkt.id}
                                        initial={{ left: initialX, top: initialY, scale: 0.6, opacity: 0, x: '-50%', y: '-50%' }}
                                        animate={{ left: animateX, top: animateY, scale: 1, opacity: 1, x: '-50%', y: '-50%' }}
                                        exit={{ opacity: 0, scale: 0.6 }}
                                        transition={{ duration: animDuration / 1000, ease: 'easeInOut' }}
                                        style={{
                                            position: 'absolute',
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            border: '2px solid var(--border)',
                                            background: pillColor,
                                            boxShadow: '3px 3px 0 var(--border)',
                                            color: textColor,
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: '0.58rem',
                                            fontWeight: 'bold',
                                            zIndex: 10,
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {label}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>


                </div>
            }
            rightContent={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.78rem', lineHeight: 1.5 }}>
                    <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)', display: 'flex', flexDirection: 'column' }}>
                        <div className="panel-header" style={{ background: 'var(--pink)', padding: '4px 8px', fontSize: '0.72rem' }}>
                            Learning Lab
                        </div>
                        <div style={{ background: '#fafafa', borderBottom: '1.5px solid var(--border)', display: 'flex', fontSize: '0.62rem' }}>
                            <button 
                                onClick={() => setLabTab('decoder')}
                                style={{
                                    flex: 1, padding: '6px 4px', border: 'none', background: labTab === 'decoder' ? '#fff' : 'transparent',
                                    borderRight: '1.5px solid var(--border)', fontWeight: labTab === 'decoder' ? 'bold' : 'normal',
                                    borderBottom: labTab === 'decoder' ? 'none' : '1.5px solid var(--border)', cursor: 'pointer',
                                    fontSize: '0.62rem'
                                }}
                            >
                                Live Decoder
                            </button>
                            <button 
                                onClick={() => setLabTab('overview')}
                                style={{
                                    flex: 1, padding: '6px 4px', border: 'none', background: labTab === 'overview' ? '#fff' : 'transparent',
                                    borderRight: '1.5px solid var(--border)', fontWeight: labTab === 'overview' ? 'bold' : 'normal',
                                    borderBottom: labTab === 'overview' ? 'none' : '1.5px solid var(--border)', cursor: 'pointer',
                                    fontSize: '0.62rem'
                                }}
                            >
                                Overview
                            </button>
                            <button 
                                onClick={() => setLabTab('guide')}
                                style={{
                                    flex: 1, padding: '6px 4px', border: 'none', background: labTab === 'guide' ? '#fff' : 'transparent',
                                    fontWeight: labTab === 'guide' ? 'bold' : 'normal',
                                    borderBottom: labTab === 'guide' ? 'none' : '1.5px solid var(--border)', cursor: 'pointer',
                                    fontSize: '0.62rem'
                                }}
                            >
                                Guide
                            </button>
                        </div>
                        <div style={{ padding: '0.8rem', background: '#fff', maxHeight: '420px', overflowY: 'auto', fontSize: '0.72rem', lineHeight: 1.4 }} className="no-scrollbar">
                            {labTab === 'decoder' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {getConceptExplanation().map((concept, idx) => (
                                        <div 
                                            key={idx} 
                                            style={{
                                                border: '2px solid var(--border)',
                                                borderRadius: '6px',
                                                background: '#fafafa',
                                                boxShadow: '3px 3px 0 var(--border)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {/* Header Section */}
                                            <div style={{
                                                background: concept.color,
                                                padding: '6px 10px',
                                                borderBottom: '2px solid var(--border)',
                                                color: concept.color === 'var(--pink)' ? '#fff' : 'var(--text)',
                                                fontWeight: 850,
                                                fontSize: '0.65rem',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <span>{concept.title}</span>
                                                <span style={{
                                                    fontSize: '0.52rem',
                                                    background: 'rgba(255,255,255,0.25)',
                                                    padding: '1px 4px',
                                                    borderRadius: '4px',
                                                    border: '1px solid rgba(0,0,0,0.1)',
                                                    fontWeight: 'bold',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {concept.operation}
                                                </span>
                                            </div>

                                            {/* Content Section */}
                                            <div style={{ padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#fff' }}>
                                                
                                                {/* Key metrics blocks */}
                                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                    {concept.metrics.map((m, mIdx) => (
                                                        <div 
                                                            key={mIdx} 
                                                            style={{
                                                                flex: 1,
                                                                background: '#f8f9fa',
                                                                border: '1.5px solid var(--border)',
                                                                borderRadius: '4px',
                                                                padding: '4px',
                                                                textAlign: 'center',
                                                                fontSize: '0.58rem'
                                                            }}
                                                        >
                                                            <div style={{ opacity: 0.6, fontSize: '0.52rem', textTransform: 'uppercase', fontWeight: 'bold' }}>{m.label}</div>
                                                            <div style={{ fontWeight: 800, color: 'var(--text)' }}>{m.value}</div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Detailed sections with borders */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.68rem', lineHeight: 1.35 }}>
                                                    <div style={{ borderLeft: '3px solid var(--cyan)', paddingLeft: '0.4rem' }}>
                                                        <strong style={{ display: 'block', fontSize: '0.6rem', color: '#555', textTransform: 'uppercase' }}>Why is it done?</strong>
                                                        <span style={{ opacity: 0.85 }}>{concept.why}</span>
                                                    </div>
                                                    <div style={{ borderLeft: '3px solid var(--green)', paddingLeft: '0.4rem' }}>
                                                        <strong style={{ display: 'block', fontSize: '0.6rem', color: '#555', textTransform: 'uppercase' }}>Real-World Impact</strong>
                                                        <span style={{ opacity: 0.85 }}>{concept.impact}</span>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {labTab === 'overview' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    <p style={{ fontWeight: 'bold', fontSize: '0.78rem', color: 'var(--cyan)' }}>Decoupling Producers & Consumers</p>
                                    <p style={{ opacity: 0.85 }}>
                                        In synchronous communication (like direct HTTP calls), if the receiving service slows down or crashes, the sender blocks or fails immediately.
                                    </p>
                                    <p style={{ opacity: 0.85 }}>
                                        A <strong>Message Queue (MQ)</strong> introduces an asynchronous intermediary:
                                    </p>
                                    <ul style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '4px', opacity: 0.85 }}>
                                        <li><strong>Producer:</strong> Dispatches tasks and immediately returns, continuing its own work.</li>
                                        <li><strong>Queue Buffer:</strong> Securely stores tasks in memory/disk until they can be processed.</li>
                                        <li><strong>Consumer:</strong> Polls the queue at its own pace to process tasks.</li>
                                    </ul>
                                    <div style={{ borderLeft: '3px solid var(--cyan)', paddingLeft: '0.5rem', background: '#f0faff', padding: '0.4rem', fontSize: '0.65rem' }}>
                                        <strong>Design Pattern: Load Leveling</strong><br />
                                        Notice how the Queue Buffer acts as a shock-absorber. When traffic spikes, messages accumulate safely instead of crashing your backend.
                                    </div>
                                </div>
                            )}
                            {labTab === 'guide' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    <p style={{ fontWeight: 'bold', fontSize: '0.78rem', color: 'var(--yellow)' }}>First-Time Sandbox Tutorial</p>
                                    <ol style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '4px', opacity: 0.85 }}>
                                        <li><strong>Manual Step:</strong> Click the <strong>+ Produce Task</strong> button on the Producer card to see a single task get enqueued and then consumed.</li>
                                        <li><strong>Observe the Buffer:</strong> Set the **Producer Rate** slider to <code>4 msg/s</code> and the **Consumer Processing** slider to <code>3s</code>, then click <strong>Start</strong>. You will see tasks queueing up in the buffer pipe!</li>
                                        <li><strong>Observe Retries:</strong> Raise the **Failure Rate** to <code>50%</code>. Watch tasks fail, animate back to the Queue, and increment their retry attempt count.</li>
                                        <li><strong>Observe Dropping:</strong> Watch tasks that fail repeatedly (past Max Retries) get discarded from the Consumer to protect system performance.</li>
                                    </ol>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            }
            legend={[
                { color: 'var(--yellow)', label: 'Producer' },
                { color: 'var(--cyan)', label: 'Queue Buffer' },
                { color: 'var(--green)', label: 'Consumer (Success)' },
                { color: 'var(--pink)', label: 'Retries / Discarded' }
            ]}
        />
    );
}
