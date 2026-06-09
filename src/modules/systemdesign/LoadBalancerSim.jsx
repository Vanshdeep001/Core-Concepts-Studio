import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import { ShuffleIcon, GlobeIcon, CpuIcon } from '../../components/Icons';

export default function LoadBalancerSim() {
    const [algo, setAlgo] = useState('round-robin'); // round-robin, weighted-rr, least-conn, ip-hash
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const h = () => setIsMobile(window.innerWidth < 768);
        h(); window.addEventListener('resize', h);
        return () => window.removeEventListener('resize', h);
    }, []);
    
    // Server health statuses
    const [serverHealth, setServerHealth] = useState({
        1: 'healthy',
        2: 'healthy',
        3: 'healthy'
    });

    // Keep a mutable ref of health to read latest state in async timeouts
    const healthRef = useRef(serverHealth);
    useEffect(() => {
        healthRef.current = serverHealth;
    }, [serverHealth]);

    // Server weights for Weighted RR
    const [serverWeights, setServerWeights] = useState({
        1: 3,
        2: 1,
        3: 2
    });

    // Server response latencies (ms)
    const [serverLatencies, setServerLatencies] = useState({
        1: 1500,
        2: 1500,
        3: 1500
    });

    // Server permanent metadata
    const serversMetadata = [
        { id: 1, name: 'Server A', color: '#ffb3ba', bgSoft: '#ffe5ec', themeColor: 'var(--pink)' },
        { id: 2, name: 'Server B', color: '#baffc9', bgSoft: '#e8f7ee', themeColor: 'var(--green)' },
        { id: 3, name: 'Server C', color: '#bae1ff', bgSoft: '#eef7ff', themeColor: 'var(--cyan)' }
    ];

    // Server request counts and stats
    const [serverStats, setServerStats] = useState({
        1: { totalHandled: 0 },
        2: { totalHandled: 0 },
        3: { totalHandled: 0 }
    });

    // Floating requests travelling on coordinates
    // status: 'client-to-lb' | 'at-lb' | 'lb-to-server' | 'response-to-client'
    const [floatingRequests, setFloatingRequests] = useState([]);

    // Processing requests inside each server
    // serverQueues[id] = Array<{ id, reqNum, method, path, progress, duration }>
    const [serverQueues, setServerQueues] = useState({
        1: [],
        2: [],
        3: []
    });

    const [metrics, setMetrics] = useState({ routed: 0, failed: 0 });
    const [history, setHistory] = useState(['Simulator initialized. Select an algorithm to trace load balancing.']);

    // Simulation play states
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [speed, setSpeed] = useState(1500); // interval duration in ms

    const requestCounter = useRef(0);
    const rrIndex = useRef(0);
    const wrrIndex = useRef(0);

    // Active routing decision display
    const [activeDecision, setActiveDecision] = useState(null);

    const totalSteps = 10; // keep it minimal

    // Reset simulator
    const handleReset = () => {
        setServerHealth({ 1: 'healthy', 2: 'healthy', 3: 'healthy' });
        setServerWeights({ 1: 3, 2: 1, 3: 2 });
        setServerLatencies({ 1: 1500, 2: 1500, 3: 1500 });
        setServerStats({
            1: { totalHandled: 0 },
            2: { totalHandled: 0 },
            3: { totalHandled: 0 }
        });
        setFloatingRequests([]);
        setServerQueues({ 1: [], 2: [], 3: [] });
        setMetrics({ routed: 0, failed: 0 });
        setHistory(['Simulator reset. Ready for requests flow.']);
        setIsRunning(false);
        setIsPaused(false);
        setIsFinished(false);
        setActiveDecision(null);
        requestCounter.current = 0;
        rrIndex.current = 0;
        wrrIndex.current = 0;
    };

    // Auto stream trigger
    useEffect(() => {
        let timer = null;
        if (isRunning && !isPaused && !isFinished) {
            timer = setInterval(() => {
                if (requestCounter.current >= totalSteps) {
                    setIsFinished(true);
                    setIsRunning(false);
                    return;
                }
                handleAddRequest();
            }, speed);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isRunning, isPaused, isFinished, speed, algo]);

    // Processing scheduler queue draining (every 100ms)
    useEffect(() => {
        let procTimer = null;
        if (isRunning && !isPaused) {
            procTimer = setInterval(() => {
                setServerQueues(prev => {
                    const next = { ...prev };
                    let changed = false;
                    
                    Object.keys(next).forEach(sid => {
                        const serverId = parseInt(sid);
                        const queue = next[serverId];
                        if (queue.length === 0) return;

                        const updatedQueue = [];
                        queue.forEach(req => {
                            const newProgress = req.progress + (100 / (req.duration / 100));
                            if (newProgress >= 100) {
                                // Request completes processing!
                                triggerResponse(req);
                                changed = true;
                            } else {
                                updatedQueue.push({ ...req, progress: newProgress });
                            }
                        });

                        if (updatedQueue.length !== queue.length) {
                            changed = true;
                        }
                        next[serverId] = updatedQueue;
                    });

                    return changed ? next : prev;
                });
            }, 100);
        }
        return () => {
            if (procTimer) clearInterval(procTimer);
        };
    }, [isRunning, isPaused]);

    // Handle Response Flyback
    const triggerResponse = (req) => {
        // Increment server total handled requests
        setServerStats(prev => ({
            ...prev,
            [req.targetServerId]: {
                totalHandled: prev[req.targetServerId].totalHandled + 1
            }
        }));

        setMetrics(m => ({ ...m, routed: m.routed + 1 }));

        const respId = `resp-${req.id}`;
        const respPacket = {
            id: respId,
            reqNum: req.reqNum,
            method: req.method,
            path: req.path,
            targetServerId: req.targetServerId,
            status: 'response-to-client',
            isResponse: true
        };

        setFloatingRequests(prev => [...prev, respPacket]);

        setHistory(h => [
            `[RESPONSE] Server ${req.targetServerId === 1 ? 'A' : req.targetServerId === 2 ? 'B' : 'C'} finished request #${req.reqNum}. HTTP 200 OK.`,
            ...h.slice(0, 49)
        ]);

        // Travel time back to Client
        setTimeout(() => {
            setFloatingRequests(prev => prev.filter(r => r.id !== respId));
        }, 500);
    };

    // Calculate routing target for a specific algorithm
    const selectTargetServer = (currentAlgo, clientIp, reqNum) => {
        const healthyServers = [1, 2, 3].filter(id => serverHealth[id] === 'healthy');
        if (healthyServers.length === 0) return { targetId: null, explanation: 'All servers offline' };

        if (currentAlgo === 'round-robin') {
            let foundId = null;
            const checkIndex = rrIndex.current;
            for (let i = 0; i < 3; i++) {
                const checkId = ((checkIndex + i) % 3) + 1;
                if (serverHealth[checkId] === 'healthy') {
                    foundId = checkId;
                    rrIndex.current = (checkIndex + i + 1) % 3;
                    break;
                }
            }
            return {
                targetId: foundId,
                explanation: `Next in queue: Server ${foundId === 1 ? 'A' : foundId === 2 ? 'B' : 'C'}. (rrIndex: ${checkIndex} -> ${rrIndex.current})`
            };
        }

        if (currentAlgo === 'weighted-rr') {
            const sequence = [];
            if (serverHealth[1] === 'healthy') {
                for (let i = 0; i < serverWeights[1]; i++) sequence.push(1);
            }
            if (serverHealth[2] === 'healthy') {
                for (let i = 0; i < serverWeights[2]; i++) sequence.push(2);
            }
            if (serverHealth[3] === 'healthy') {
                for (let i = 0; i < serverWeights[3]; i++) sequence.push(3);
            }
            if (sequence.length === 0) return { targetId: null, explanation: 'No healthy weighted targets' };

            const seqIndex = wrrIndex.current % sequence.length;
            const targetId = sequence[seqIndex];
            wrrIndex.current = (wrrIndex.current + 1) % sequence.length;

            const seqLabels = sequence.map(id => id === 1 ? 'A' : id === 2 ? 'B' : 'C').join(', ');

            return {
                targetId,
                explanation: `Weight Sequence: [${seqLabels}]. Step index ${seqIndex} selected -> Server ${targetId === 1 ? 'A' : targetId === 2 ? 'B' : 'C'}.`
            };
        }

        if (currentAlgo === 'least-conn') {
            // Find healthy server with lowest queue length
            let minId = healthyServers[0];
            let minLen = serverQueues[minId].length;

            healthyServers.forEach(id => {
                const len = serverQueues[id].length;
                if (len < minLen) {
                    minId = id;
                    minLen = len;
                }
            });

            const comparisonStr = [1, 2, 3].map(id => {
                const label = id === 1 ? 'A' : id === 2 ? 'B' : 'C';
                const statusStr = serverHealth[id] === 'offline' ? 'OFFLINE' : `${serverQueues[id].length} active`;
                return `${label}: ${statusStr}`;
            }).join(' | ');

            return {
                targetId: minId,
                explanation: `Least connections scanned: [${comparisonStr}]. Routing to Server ${minId === 1 ? 'A' : minId === 2 ? 'B' : 'C'} (min: ${minLen}).`
            };
        }

        if (currentAlgo === 'ip-hash') {
            const hashValue = clientIp.split('.').reduce((acc, val) => acc + parseInt(val), 0);
            const initialIndex = hashValue % 3;
            let targetId = initialIndex + 1;
            let offset = 0;

            while (serverHealth[targetId] !== 'healthy' && offset < 3) {
                offset++;
                targetId = ((initialIndex + offset) % 3) + 1;
            }

            if (serverHealth[targetId] !== 'healthy') {
                return { targetId: null, explanation: `Hash ${hashValue} modulo 3 = ${initialIndex} -> Server ${targetId === 1 ? 'A' : targetId === 2 ? 'B' : 'C'} (Failed target health, offline)` };
            }

            return {
                targetId,
                explanation: `Client IP ${clientIp} -> Hash Sum: ${hashValue}. Modulo: ${hashValue} % 3 = ${initialIndex}. Target: Server ${targetId === 1 ? 'A' : targetId === 2 ? 'B' : 'C'}.`
            };
        }

        return { targetId: null, explanation: 'Unknown algorithm' };
    };

    // Dispatch a request manually or in stream
    const handleAddRequest = () => {
        if (requestCounter.current >= totalSteps) {
            setIsFinished(true);
            return;
        }

        requestCounter.current++;
        const reqNum = requestCounter.current;

        // Generate client payload details
        const methods = ['GET', 'POST', 'PUT', 'DELETE'];
        const paths = {
            'GET': ['/api/users', '/api/products', '/api/health', '/index.html'],
            'POST': ['/api/login', '/api/checkout', '/api/payments'],
            'PUT': ['/api/profile', '/api/cart/item'],
            'DELETE': ['/api/session', '/api/cart']
        };

        const randomMethod = methods[Math.floor(Math.random() * methods.length)];
        const pathList = paths[randomMethod];
        const randomPath = pathList[Math.floor(Math.random() * pathList.length)];
        const randomIp = `192.168.1.${Math.floor(Math.random() * 200) + 10}`;

        // Select routing destination
        const { targetId, explanation } = selectTargetServer(algo, randomIp, reqNum);

        if (targetId === null) {
            setMetrics(m => ({ ...m, failed: m.failed + 1 }));
            setHistory(h => [`[FAILED] Request #${reqNum} dropped: All servers offline!`, ...h.slice(0, 49)]);
            return;
        }

        const reqId = `req-${reqNum}`;
        const newRequest = {
            id: reqId,
            reqNum,
            method: randomMethod,
            path: randomPath,
            clientIp: randomIp,
            targetServerId: targetId,
            status: 'client-to-lb',
            progress: 0,
            duration: serverLatencies[targetId],
            explanation
        };

        setHistory(h => [
            `[DISPATCH] Request #${reqNum} [${randomMethod} ${randomPath}] from client IP ${randomIp}.`,
            ...h.slice(0, 49)
        ]);

        // Start Packet Lifecycle animations
        setFloatingRequests(prev => [...prev, newRequest]);

        // 1. Travel from Client to Load Balancer
        setTimeout(() => {
            setFloatingRequests(curr => curr.map(r => r.id === reqId ? { ...r, status: 'at-lb' } : r));
            setActiveDecision({
                reqNum,
                method: randomMethod,
                path: randomPath,
                clientIp: randomIp,
                explanation,
                targetId
            });

            // 2. Pause at Load Balancer for routing decision
            setTimeout(() => {
                setFloatingRequests(curr => curr.map(r => r.id === reqId ? { ...r, status: 'lb-to-server' } : r));
                setActiveDecision(null);

                // 3. Travel from Load Balancer to Server
                setTimeout(() => {
                    // Remove packet from floating
                    setFloatingRequests(curr => curr.filter(r => r.id !== reqId));

                    // Verify target server is still healthy (real-time check from mutable ref)
                    if (healthRef.current[targetId] !== 'healthy') {
                        setMetrics(m => ({ ...m, failed: m.failed + 1 }));
                        setHistory(h => [
                            `[FAILOVER] Request #${reqNum} failed: Target Server ${targetId === 1 ? 'A' : targetId === 2 ? 'B' : 'C'} offline.`,
                            ...h.slice(0, 49)
                        ]);
                    } else {
                        // Add to server queue
                        setServerQueues(queues => ({
                            ...queues,
                            [targetId]: [...queues[targetId], newRequest]
                        }));

                        setHistory(h => [
                            `[PROCESSING] Server ${targetId === 1 ? 'A' : targetId === 2 ? 'B' : 'C'} processing request #${reqNum} (${serverLatencies[targetId]}ms).`,
                            ...h.slice(0, 49)
                        ]);
                    }

                }, 500);

            }, 900);

        }, 500);
    };

    // Toggle server health status
    const toggleServerHealth = (id) => {
        setServerHealth(prev => {
            const nextState = prev[id] === 'healthy' ? 'offline' : 'healthy';
            if (nextState === 'offline') {
                // Drain queue immediately
                setServerQueues(curr => {
                    const droppedCount = curr[id].length;
                    if (droppedCount > 0) {
                        setMetrics(m => ({ ...m, failed: m.failed + droppedCount }));
                        setHistory(h => [
                            `[FAILOVER] Server ${id === 1 ? 'A' : id === 2 ? 'B' : 'C'} offline. ${droppedCount} requests dropped.`,
                            ...h.slice(0, 49)
                        ]);
                    }
                    return { ...curr, [id]: [] };
                });
            } else {
                setHistory(h => [
                    `[SYSTEM] Server ${id === 1 ? 'A' : id === 2 ? 'B' : 'C'} restored to ONLINE.`,
                    ...h.slice(0, 49)
                ]);
            }
            return { ...prev, [id]: nextState };
        });
    };

    // Get color for request methods
    const getMethodColor = (method) => {
        if (method === 'GET') return 'var(--cyan)';
        if (method === 'POST') return 'var(--orange)';
        if (method === 'PUT') return 'var(--yellow)';
        return 'var(--pink)';
    };

    // Calculate positions inside relative canvas
    const getPacketCoords = (req) => {
        if (req.status === 'client-to-lb') {
            return { left: '50%', top: '8%', x: '-50%', y: '-50%' };
        }
        if (req.status === 'at-lb') {
            return { left: '50%', top: '36%', x: '-50%', y: '-50%' };
        }
        if (req.status === 'lb-to-server') {
            if (req.targetServerId === 1) return { left: '18%', top: '68%', x: '-50%', y: '-50%' };
            if (req.targetServerId === 2) return { left: '50%', top: '68%', x: '-50%', y: '-50%' };
            if (req.targetServerId === 3) return { left: '82%', top: '68%', x: '-50%', y: '-50%' };
        }
        if (req.status === 'response-to-client') {
            return { left: '50%', top: '8%', x: '-50%', y: '-50%' };
        }
        return { left: '50%', top: '8%', x: '-50%', y: '-50%' };
    };

    // Check if wiring line is active
    const isPathActive = (fromNode, toNode) => {
        if (fromNode === 'client' && toNode === 'lb') {
            return floatingRequests.some(r => r.status === 'client-to-lb');
        }
        if (fromNode === 'lb') {
            const serverId = toNode;
            return floatingRequests.some(r => 
                r.targetServerId === serverId && 
                (r.status === 'lb-to-server' || r.status === 'response-to-client')
            );
        }
        return false;
    };

    return (
        <ImmersiveLayout
            isActive={true}
            title="Load Balancing Simulator"
            icon={<ShuffleIcon size={20} />}
            moduleLabel="System Design"
            isRunning={isRunning}
            isPaused={isPaused}
            isFinished={isFinished}
            speed={speed}
            onSpeedChange={setSpeed}
            onStart={() => setIsRunning(true)}
            onPause={() => { setIsPaused(true); }}
            onResume={() => { setIsRunning(true); setIsPaused(false); }}
            onReset={handleReset}
            onStep={handleAddRequest}
            currentStepNum={requestCounter.current}
            totalSteps={totalSteps}
            phaseName={isRunning ? "Balancing Load..." : isFinished ? "Completed" : "Idle"}
            hideFooter={true}
            leftContent={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {/* Algorithm Selection */}
                    <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                        <div className="panel-header" style={{ background: 'var(--cyan)', padding: '4px 8px', fontSize: '0.72rem' }}>
                            Algorithm Select
                        </div>
                        <div style={{ padding: '0.6rem', background: '#fff', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {[
                                { id: 'round-robin', label: 'Round Robin' },
                                { id: 'weighted-rr', label: 'Weighted Round Robin' },
                                { id: 'least-conn', label: 'Least Connections' },
                                { id: 'ip-hash', label: 'IP Hash (Sticky Sessions)' }
                            ].map(opt => {
                                const isSel = algo === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => {
                                            if (isRunning) {
                                                handleReset();
                                            }
                                            setAlgo(opt.id);
                                        }}
                                        style={{
                                            padding: '0.5rem',
                                            border: '2px solid var(--border)',
                                            background: isSel ? 'var(--cyan)' : 'var(--white)',
                                            color: 'var(--text)',
                                            fontWeight: 800,
                                            fontSize: '0.72rem',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            boxShadow: isSel ? '2px 2px 0 var(--border)' : 'none',
                                            transform: isSel ? 'translate(-1px, -1px)' : 'none',
                                            transition: 'all 0.1s'
                                        }}
                                    >
                                        <span>{opt.label}</span>
                                        <span style={{
                                            width: 10, height: 10, border: '1.5px solid var(--border)',
                                            background: isSel ? 'var(--text)' : 'transparent',
                                            display: 'inline-block'
                                        }} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Manual Request Controls */}
                    <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                        <div className="panel-header" style={{ background: 'var(--orange)', padding: '4px 8px', fontSize: '0.72rem' }}>
                            Request Dispatcher
                        </div>
                        <div style={{ padding: '0.6rem', background: '#fff', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <button
                                onClick={handleAddRequest}
                                disabled={isFinished}
                                className="btn btn-sm"
                                style={{
                                    width: '100%',
                                    background: 'var(--yellow)',
                                    color: '#000',
                                    fontWeight: 900,
                                    border: '2px solid var(--border)',
                                    boxShadow: '2px 2px 0 var(--border)',
                                    cursor: 'pointer'
                                }}
                            >
                                Dispatch Single Request
                            </button>
                            <div style={{ fontSize: '0.62rem', opacity: 0.6, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                                Limit: {requestCounter.current} / {totalSteps} Requests
                            </div>
                        </div>
                    </div>

                    {/* Metrics Dashboard */}
                    <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                        <div className="panel-header" style={{ background: 'var(--pink)', padding: '4px 8px', fontSize: '0.72rem' }}>
                            Pipeline Metrics
                        </div>
                        <div style={{ padding: '0.6rem', background: '#fff', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontFamily: 'var(--font-mono)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Routed:</span>
                                <strong>{metrics.routed}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Dropped:</span>
                                <strong style={{ color: metrics.failed > 0 ? 'var(--pink)' : 'inherit' }}>{metrics.failed}</strong>
                            </div>
                            <div style={{ height: 1, background: '#eee', margin: '2px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                                <span>Success Rate:</span>
                                <span>
                                    {metrics.routed + metrics.failed > 0 
                                        ? `${Math.round((metrics.routed / (metrics.routed + metrics.failed)) * 100)}%` 
                                        : '100%'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Terminal events log moved here from center panel bottom */}
                    <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                        <div className="panel-header" style={{ background: 'var(--text)', color: 'var(--white)', padding: '4px 8px', fontSize: '0.72rem' }}>
                            Real-time Event Logs
                        </div>
                        <div style={{
                            padding: '0.5rem',
                            background: '#1e1e2e',
                            color: '#cdd6f4',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.6rem',
                            height: '140px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            scrollbarWidth: 'thin'
                        }}>
                            {history.map((log, lIdx) => (
                                <div key={lIdx} style={{
                                    lineHeight: 1.3,
                                    color: log.includes('FAILED') || log.includes('FAILOVER') ? '#ff5555' : log.includes('RESPONSE') ? '#a6e3a1' : '#cdd6f4'
                                }}>
                                    {log}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            }
            centerContent={
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fafafa', overflow: 'hidden', position: 'relative' }}>
                    
                    {/* CSS marching ants animation for active packet streams */}
                    <style>{`
                        @keyframes marching-ants {
                            to {
                                stroke-dashoffset: -20;
                            }
                        }
                    `}</style>

                    {/* Visualizer Canvas container */}
                    <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: isMobile ? 400 : 540, overflowX: isMobile ? 'auto' : 'hidden', overflowY: isMobile ? 'auto' : 'hidden', WebkitOverflowScrolling: 'touch' }}>
                        
                        {/* Dotted wiring lines showing network architecture */}
                        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                            {/* Client -> LB */}
                            <line 
                                x1="50%" y1="8%" x2="50%" y2="36%" 
                                stroke="var(--border)" 
                                strokeWidth="2"
                                strokeDasharray="4 4"
                                opacity={isPathActive('client', 'lb') ? 1 : 0.25}
                                style={{ transition: 'opacity 0.2s, stroke 0.2s' }}
                            />
                            {isPathActive('client', 'lb') && (
                                <line 
                                    x1="50%" y1="8%" x2="50%" y2="36%" 
                                    stroke="var(--green)" 
                                    strokeWidth="3.5"
                                    strokeDasharray="6 4"
                                    style={{ animation: 'marching-ants 0.6s linear infinite' }}
                                />
                            )}

                            {/* LB -> Server A (Left) */}
                            <line 
                                x1="50%" y1="36%" x2="18%" y2="68%" 
                                stroke="var(--border)" 
                                strokeWidth="2"
                                strokeDasharray="4 4"
                                opacity={isPathActive('lb', 1) ? 1 : 0.25}
                                style={{ transition: 'opacity 0.2s, stroke 0.2s' }}
                            />
                            {isPathActive('lb', 1) && (
                                <line 
                                    x1="50%" y1="36%" x2="18%" y2="68%" 
                                    stroke="var(--green)" 
                                    strokeWidth="3.5"
                                    strokeDasharray="6 4"
                                    style={{ animation: 'marching-ants 0.6s linear infinite' }}
                                />
                            )}

                            {/* LB -> Server B (Center) */}
                            <line 
                                x1="50%" y1="36%" x2="50%" y2="68%" 
                                stroke="var(--border)" 
                                strokeWidth="2"
                                strokeDasharray="4 4"
                                opacity={isPathActive('lb', 2) ? 1 : 0.25}
                                style={{ transition: 'opacity 0.2s, stroke 0.2s' }}
                            />
                            {isPathActive('lb', 2) && (
                                <line 
                                    x1="50%" y1="36%" x2="50%" y2="68%" 
                                    stroke="var(--green)" 
                                    strokeWidth="3.5"
                                    strokeDasharray="6 4"
                                    style={{ animation: 'marching-ants 0.6s linear infinite' }}
                                />
                            )}

                            {/* LB -> Server C (Right) */}
                            <line 
                                x1="50%" y1="36%" x2="82%" y2="68%" 
                                stroke="var(--border)" 
                                strokeWidth="2"
                                strokeDasharray="4 4"
                                opacity={isPathActive('lb', 3) ? 1 : 0.25}
                                style={{ transition: 'opacity 0.2s, stroke 0.2s' }}
                            />
                            {isPathActive('lb', 3) && (
                                <line 
                                    x1="50%" y1="36%" x2="82%" y2="68%" 
                                    stroke="var(--green)" 
                                    strokeWidth="3.5"
                                    strokeDasharray="6 4"
                                    style={{ animation: 'marching-ants 0.6s linear infinite' }}
                                />
                            )}
                        </svg>

                        {/* CLIENT NODE (Top) */}
                        <div style={{
                            position: 'absolute',
                            left: '50%',
                            top: '8%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 3,
                            width: isMobile ? 140 : 190,
                            border: '2.5px solid var(--border)',
                            background: '#fff',
                            borderRadius: '6px',
                            boxShadow: '3px 3px 0 var(--border)',
                            padding: '0.4rem 0.6rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <GlobeIcon size={16} />
                                <span style={{ fontWeight: 900, fontSize: isMobile ? '0.6rem' : '0.72rem', letterSpacing: '0.02em' }}>{isMobile ? 'CLIENT' : 'CLIENT TRAFFIC NODE'}</span>
                            </div>
                            <div style={{ height: 1.5, background: '#eee', margin: '4px 0' }} />
                            <div style={{ fontSize: '0.55rem', color: '#666', fontFamily: 'var(--font-mono)' }}>
                                STATUS: ONLINE<br />
                                ACTIVE PIPELINE: {algo.toUpperCase()}
                            </div>
                        </div>

                        {/* LOAD BALANCER NODE (Center) */}
                        <div style={{
                            position: 'absolute',
                            left: '50%',
                            top: '36%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 3,
                            width: isMobile ? 180 : 250,
                            border: '3px solid var(--border)',
                            background: 'var(--yellow)',
                            borderRadius: '8px',
                            boxShadow: '4px 4px 0 var(--border)',
                            padding: '0.5rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.04em' }}>LOAD DISTRIBUTOR</span>
                                <span style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    background: isRunning && !isPaused ? 'var(--green)' : '#888',
                                    boxShadow: isRunning && !isPaused ? '0 0 6px var(--green)' : 'none',
                                    transition: 'background 0.2s'
                                }} />
                            </div>
                            
                            {/* Digital Output Display */}
                            <div style={{
                                background: '#1e1e1e',
                                color: 'var(--cyan)',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.62rem',
                                borderRadius: '4px',
                                border: '1.5px solid var(--border)',
                                padding: '4px 6px',
                                marginTop: '4px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px'
                            }}>
                                <span style={{ color: '#fff', fontWeight: 700 }}>ALGO: {algo.replace('-', ' ').toUpperCase()}</span>
                                
                                <div style={{ height: 1, background: '#333', margin: '2px 0' }} />
                                
                                {/* Live Decision Engine Log output */}
                                <div style={{ minHeight: '36px', display: 'flex', alignItems: 'center' }}>
                                    {activeDecision ? (
                                        <div style={{ color: 'var(--green)', lineHeight: 1.25 }}>
                                            Routing Req #{activeDecision.reqNum}...<br />
                                            <span style={{ fontSize: '0.55rem', color: '#aaa' }}>{activeDecision.explanation}</span>
                                        </div>
                                    ) : (
                                        <span style={{ color: '#888', fontStyle: 'italic' }}>Listening for active request...</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* FLOATING DATA PACKETS */}
                        <AnimatePresence>
                            {floatingRequests.map(req => {
                                const isResp = req.isResponse;
                                const coords = getPacketCoords(req);
                                
                                return (
                                    <motion.div
                                        key={req.id}
                                        initial={
                                            req.status === 'client-to-lb' 
                                                ? { left: '50%', top: '8%', x: '-50%', y: '-50%', scale: 0.6, opacity: 0 }
                                                : req.status === 'response-to-client'
                                                ? { 
                                                    left: req.targetServerId === 1 ? '18%' : req.targetServerId === 2 ? '50%' : '82%', 
                                                    top: '68%', x: '-50%', y: '-50%', scale: 0.8, opacity: 1 
                                                  }
                                                : false
                                        }
                                        animate={{
                                            left: coords.left,
                                            top: coords.top,
                                            scale: req.status === 'at-lb' ? 1.08 : 1,
                                            opacity: 1
                                        }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ duration: 0.45, ease: 'easeInOut' }}
                                        style={{
                                            position: 'absolute',
                                            zIndex: 5,
                                            transform: 'translate(-50%, -50%)'
                                        }}
                                    >
                                        {isResp ? (
                                            /* HTTP Response Bubble */
                                            <div style={{
                                                padding: '2px 6px',
                                                border: '1.5px solid var(--border)',
                                                borderRadius: '12px',
                                                background: 'var(--green)',
                                                color: '#000',
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: '0.55rem',
                                                fontWeight: 900,
                                                boxShadow: '1px 1px 0 var(--border)',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                200 OK
                                            </div>
                                        ) : (
                                            /* HTTP Request Packet Pill */
                                            <div style={{
                                                padding: '3px 8px',
                                                border: '2px solid var(--border)',
                                                borderRadius: '20px',
                                                background: getMethodColor(req.method),
                                                color: '#000',
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: '0.62rem',
                                                fontWeight: 900,
                                                boxShadow: '2px 2px 0 var(--border)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                <span style={{ opacity: 0.6 }}>#{req.reqNum}</span>
                                                <span style={{ borderRight: '1px solid var(--border)', paddingRight: '4px' }}>{req.method}</span>
                                                <span style={{ fontSize: '0.55rem', opacity: 0.85 }}>{req.path}</span>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* BACKEND SERVER NODES (Bottom Row) */}
                        <div style={{
                            position: 'absolute',
                            top: '68%',
                            left: 0,
                            right: 0,
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0 4%',
                            zIndex: 3
                        }}>
                            {serversMetadata.map(server => {
                                const isHealthy = serverHealth[server.id] === 'healthy';
                                const queue = serverQueues[server.id];
                                const totalHandled = serverStats[server.id].totalHandled;
                                
                                return (
                                    <div 
                                        key={server.id}
                                        style={{
                                            width: '29%',
                                            border: '2.5px solid var(--border)',
                                            borderRadius: '8px',
                                            background: isHealthy ? server.bgSoft : '#eaeaea',
                                            boxShadow: isHealthy ? '3px 3px 0 var(--border)' : '1px 1px 0 var(--border)',
                                            opacity: isHealthy ? 1 : 0.65,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            transition: 'all 0.2s',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {/* Server Title bar */}
                                        <div style={{
                                            background: isHealthy ? server.color : '#bbb',
                                            borderBottom: '2.5px solid var(--border)',
                                            padding: '4px 6px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <CpuIcon size={14} />
                                                <span style={{ fontWeight: 900, fontSize: '0.68rem' }}>{server.name}</span>
                                            </div>
                                            <button
                                                onClick={() => toggleServerHealth(server.id)}
                                                style={{
                                                    fontSize: '0.5rem',
                                                    fontWeight: 900,
                                                    padding: '2px 4px',
                                                    border: '1.5px solid var(--border)',
                                                    background: isHealthy ? 'var(--pink)' : 'var(--green)',
                                                    color: isHealthy ? '#fff' : '#000',
                                                    cursor: 'pointer',
                                                    boxShadow: '1px 1px 0 var(--border)',
                                                    transform: 'translateY(-1px)'
                                                }}
                                            >
                                                {isHealthy ? 'FAIL' : 'HEAL'}
                                            </button>
                                        </div>

                                        {/* Server Details Content */}
                                        <div style={{ padding: '6px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            
                                            {/* Metrics row */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', fontFamily: 'var(--font-mono)' }}>
                                                <span>Queue: <strong>{queue.length} active</strong></span>
                                                <span>Total: <strong>{totalHandled}</strong></span>
                                            </div>

                                            {/* Active weights slider (only for Weighted RR) */}
                                            {algo === 'weighted-rr' && isHealthy && (
                                                <div style={{ border: '1.5px solid var(--border)', borderRadius: '4px', background: '#fff', padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', fontWeight: 800 }}>
                                                        <span>STATIC WEIGHT:</span>
                                                        <span style={{ fontFamily: 'var(--font-mono)' }}>{serverWeights[server.id]}</span>
                                                    </div>
                                                    <input 
                                                        type="range" min="1" max="5" 
                                                        value={serverWeights[server.id]}
                                                        onChange={e => {
                                                            const val = parseInt(e.target.value);
                                                            setServerWeights(prev => ({ ...prev, [server.id]: val }));
                                                        }}
                                                        style={{ width: '100%', cursor: 'pointer', height: 4 }}
                                                    />
                                                </div>
                                            )}

                                            {/* Latency adjustment slider */}
                                            {isHealthy && (
                                                <div style={{ border: '1.5px solid var(--border)', borderRadius: '4px', background: '#fff', padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', fontWeight: 800 }}>
                                                        <span>LATENCY DELAY:</span>
                                                        <span style={{ fontFamily: 'var(--font-mono)' }}>{serverLatencies[server.id]}ms</span>
                                                    </div>
                                                    <input 
                                                        type="range" min="500" max="3000" step="500"
                                                        value={serverLatencies[server.id]}
                                                        onChange={e => {
                                                            const val = parseInt(e.target.value);
                                                            setServerLatencies(prev => ({ ...prev, [server.id]: val }));
                                                        }}
                                                        style={{ width: '100%', cursor: 'pointer', height: 4 }}
                                                    />
                                                </div>
                                            )}

                                            <div style={{ height: 1.5, background: 'rgba(0,0,0,0.06)' }} />

                                            {/* Server Active Request Queue visually rendered */}
                                            <div style={{ 
                                                height: '80px', 
                                                background: '#fff', 
                                                border: '1.5px solid var(--border)', 
                                                borderRadius: '4px', 
                                                padding: '4px', 
                                                display: 'flex', 
                                                flexDirection: 'column', 
                                                gap: '3px', 
                                                overflowY: 'auto',
                                                scrollbarWidth: 'thin'
                                            }}>
                                                {queue.length === 0 ? (
                                                    <span style={{ fontSize: '0.52rem', color: '#999', fontStyle: 'italic', margin: 'auto', textAlign: 'center' }}>
                                                        {isHealthy ? 'IDLE NODE' : 'OFFLINE'}
                                                    </span>
                                                ) : (
                                                    queue.map(req => (
                                                        <div key={req.id} style={{
                                                            background: getMethodColor(req.method),
                                                            border: '1px solid var(--border)',
                                                            borderRadius: '3px',
                                                            padding: '2px 4px',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '1px',
                                                            boxShadow: '1px 1px 0 var(--border)'
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5rem', fontWeight: 900 }}>
                                                                <span>#{req.reqNum} {req.method}</span>
                                                                <span>{Math.round(req.progress)}%</span>
                                                            </div>
                                                            {/* Custom Draining Progress Bar */}
                                                            <div style={{ width: '100%', height: 3, background: 'rgba(0,0,0,0.15)', borderRadius: 1.5, overflow: 'hidden' }}>
                                                                <div style={{ width: `${req.progress}%`, height: '100%', background: '#000' }} />
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                    </div>
                </div>
            }
            rightContent={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.78rem', lineHeight: 1.45 }}>
                    <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                        <div className="panel-header" style={{ background: 'var(--pink)', padding: '4px 8px', fontSize: '0.72rem' }}>
                            Learning Lab
                        </div>
                        <div style={{ padding: '0.6rem', background: '#fff' }}>
                            <p style={{ fontWeight: 800 }}>Routing Mechanisms:</p>
                            <p style={{ opacity: 0.8, marginTop: '0.2rem', fontSize: '0.72rem' }}>
                                A Load Balancer distributes incoming network traffic across backend services to maximize reliability and resource usage.
                            </p>
                            
                            <div style={{ height: 1.5, background: '#eee', margin: '6px 0' }} />
                            
                            <ul style={{ paddingLeft: '0.8rem', opacity: 0.8, fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <li><strong>Round Robin:</strong> Cycles through healthy nodes in a strict order. Simple, but assumes all servers have equal capacity.</li>
                                <li><strong>Weighted Round Robin:</strong> Assigns static weights to nodes. A higher weight node receives a proportionally higher ratio of requests.</li>
                                <li><strong>Least Connections:</strong> Evaluates live workloads and routes traffic to the server with the fewest active tasks. Best for long-running operations.</li>
                                <li><strong>IP Hash:</strong> Uses client IP hash calculations to assign requests to specific servers, ensuring sticky sessions for client state continuity.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            }
            legend={[
                { color: 'var(--yellow)', label: 'Load Distributor' },
                { color: 'var(--cyan)', label: 'GET requests' },
                { color: 'var(--orange)', label: 'POST requests' },
                { color: 'var(--green)', label: 'Response Packet (200)' }
            ]}
        />
    );
}
