import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import useSnapshot from '../../hooks/useSnapshot';
import DownloadNotes from '../../components/DownloadNotes';

/* ════════════════════════════════════════
   PRESET TOPOLOGIES
   ════════════════════════════════════════ */
const PRESETS = {
    Simple: {
        nodes: [
            { id: 'R1', x: 120, y: 100 }, { id: 'R2', x: 320, y: 60 }, { id: 'R3', x: 320, y: 200 },
            { id: 'R4', x: 520, y: 100 }, { id: 'R5', x: 520, y: 240 },
        ],
        edges: [
            { from: 'R1', to: 'R2', w: 2 }, { from: 'R1', to: 'R3', w: 5 },
            { from: 'R2', to: 'R3', w: 1 }, { from: 'R2', to: 'R4', w: 3 },
            { from: 'R3', to: 'R5', w: 2 }, { from: 'R4', to: 'R5', w: 4 },
        ],
    },
    'Complex mesh': {
        nodes: [
            { id: 'R1', x: 80, y: 80 }, { id: 'R2', x: 250, y: 40 }, { id: 'R3', x: 420, y: 80 },
            { id: 'R4', x: 80, y: 220 }, { id: 'R5', x: 250, y: 260 }, { id: 'R6', x: 420, y: 220 },
            { id: 'R7', x: 250, y: 150 }, { id: 'R8', x: 550, y: 150 },
        ],
        edges: [
            { from: 'R1', to: 'R2', w: 4 }, { from: 'R1', to: 'R4', w: 2 }, { from: 'R2', to: 'R3', w: 3 },
            { from: 'R2', to: 'R7', w: 1 }, { from: 'R3', to: 'R6', w: 5 }, { from: 'R3', to: 'R8', w: 2 },
            { from: 'R4', to: 'R5', w: 3 }, { from: 'R4', to: 'R7', w: 6 }, { from: 'R5', to: 'R6', w: 1 },
            { from: 'R5', to: 'R7', w: 2 }, { from: 'R6', to: 'R8', w: 3 }, { from: 'R7', to: 'R6', w: 4 },
        ],
    },
    'Negative weight': {
        nodes: [
            { id: 'R1', x: 100, y: 100 }, { id: 'R2', x: 300, y: 50 }, { id: 'R3', x: 300, y: 200 },
            { id: 'R4', x: 500, y: 100 }, { id: 'R5', x: 500, y: 250 },
        ],
        edges: [
            { from: 'R1', to: 'R2', w: 6 }, { from: 'R1', to: 'R3', w: 7 },
            { from: 'R2', to: 'R4', w: 5 }, { from: 'R2', to: 'R3', w: -2 },
            { from: 'R3', to: 'R5', w: 9 }, { from: 'R4', to: 'R5', w: -4 },
        ],
    },
};

/* ════════════════════════════════════════
   DIJKSTRA step-by-step
   ════════════════════════════════════════ */
function dijkstraSteps(nodes, edges, srcId, cutEdges = []) {
    const steps = [];
    const dist = {}; const prev = {}; const visited = new Set();
    const activeEdges = edges.filter(e => !cutEdges.some(c => (c.from === e.from && c.to === e.to) || (c.from === e.to && c.to === e.from)));
    const hasNeg = activeEdges.some(e => e.w < 0);

    nodes.forEach(n => { dist[n.id] = Infinity; prev[n.id] = null; });
    dist[srcId] = 0;

    if (hasNeg) {
        steps.push({
            algorithm: 'Dijkstra', visited: new Set(visited), dist: { ...dist }, prev: { ...prev },
            currentNode: null, evaluatingEdge: null, shortestPath: [],
            explanation: '⚠ Negative weight edge detected! Dijkstra CANNOT handle negative weights correctly.',
            insight: 'DIJKSTRA LIMITATION: Dijkstra\'s greedy approach assumes that once a node is finalized, no shorter path exists. Negative weights violate this assumption.',
            failed: true,
        });
        return steps;
    }

    steps.push({
        algorithm: 'Dijkstra', visited: new Set(), dist: { ...dist }, prev: { ...prev },
        currentNode: srcId, evaluatingEdge: null, shortestPath: [],
        explanation: `Initialize: source ${srcId} has distance 0. All others are ∞.`,
        insight: 'DIJKSTRA: A greedy algorithm that always processes the unvisited node with the smallest known distance.',
    });

    while (visited.size < nodes.length) {
        let minNode = null, minDist = Infinity;
        nodes.forEach(n => {
            if (!visited.has(n.id) && dist[n.id] < minDist) { minDist = dist[n.id]; minNode = n.id; }
        });
        if (minNode === null) break;
        visited.add(minNode);

        steps.push({
            algorithm: 'Dijkstra', visited: new Set(visited), dist: { ...dist }, prev: { ...prev },
            currentNode: minNode, evaluatingEdge: null, shortestPath: [],
            explanation: `Visit ${minNode} (distance = ${dist[minNode]}). Mark as finalized — shortest path to ${minNode} is confirmed.`,
            insight: `GREEDY CHOICE: ${minNode} has the smallest tentative distance among unvisited nodes. Once visited, its distance is optimal.`,
        });

        // Relax neighbors
        activeEdges.forEach(e => {
            let neighbor = null;
            if (e.from === minNode) neighbor = e.to;
            else if (e.to === minNode) neighbor = e.from;
            if (!neighbor || visited.has(neighbor)) return;

            const newDist = dist[minNode] + e.w;
            const updated = newDist < dist[neighbor];
            if (updated) {
                dist[neighbor] = newDist;
                prev[neighbor] = minNode;
            }

            steps.push({
                algorithm: 'Dijkstra', visited: new Set(visited), dist: { ...dist }, prev: { ...prev },
                currentNode: minNode, evaluatingEdge: { from: minNode, to: neighbor, w: e.w },
                shortestPath: [],
                explanation: `Evaluate edge ${minNode}→${neighbor} (weight ${e.w}). ${updated ? `Updated: ${dist[neighbor]} < old distance. Via ${minNode}.` : `No update: existing distance ${dist[neighbor]} is already shorter.`}`,
                insight: `EDGE RELAXATION: If dist[${minNode}] + weight(${minNode}→${neighbor}) < dist[${neighbor}], update the distance.`,
            });
        });
    }

    // Build shortest path to each destination
    const pathOf = (target) => {
        const path = [];
        let cur = target;
        while (cur) { path.unshift(cur); cur = prev[cur]; }
        return path[0] === srcId ? path : [];
    };

    steps.push({
        algorithm: 'Dijkstra', visited: new Set(visited), dist: { ...dist }, prev: { ...prev },
        currentNode: null, evaluatingEdge: null,
        shortestPath: nodes.map(n => n.id).filter(id => id !== srcId).flatMap(id => { const p = pathOf(id); return p.length > 1 ? [{ to: id, path: p, cost: dist[id] }] : []; }),
        explanation: 'Dijkstra complete! All shortest paths from source have been computed.',
        insight: 'COMPLEXITY: Dijkstra with a min-heap runs in O((V+E) log V). It guarantees optimal paths for non-negative weights.',
    });

    return steps;
}

/* ════════════════════════════════════════
   BELLMAN-FORD step-by-step
   ════════════════════════════════════════ */
function bellmanFordSteps(nodes, edges, srcId, cutEdges = []) {
    const steps = [];
    const dist = {}; const prev = {};
    const activeEdges = edges.filter(e => !cutEdges.some(c => (c.from === e.from && c.to === e.to) || (c.from === e.to && c.to === e.from)));

    nodes.forEach(n => { dist[n.id] = Infinity; prev[n.id] = null; });
    dist[srcId] = 0;

    steps.push({
        algorithm: 'Bellman-Ford', round: 0, totalRounds: nodes.length - 1,
        dist: { ...dist }, prev: { ...prev }, evaluatingEdge: null, visited: new Set([srcId]),
        explanation: `Initialize: source ${srcId} = 0, all others = ∞. Will perform ${nodes.length - 1} rounds.`,
        insight: 'BELLMAN-FORD: Relaxes ALL edges in each round. Needs V-1 rounds to guarantee shortest paths. Can handle negative weights.',
    });

    for (let round = 1; round < nodes.length; round++) {
        let anyUpdate = false;
        activeEdges.forEach(e => {
            [{ from: e.from, to: e.to }, { from: e.to, to: e.from }].forEach(dir => {
                if (dist[dir.from] === Infinity) return;
                const newDist = dist[dir.from] + e.w;
                if (newDist < dist[dir.to]) {
                    dist[dir.to] = newDist;
                    prev[dir.to] = dir.from;
                    anyUpdate = true;
                }
            });
        });

        const visitedSet = new Set(nodes.filter(n => dist[n.id] < Infinity).map(n => n.id));
        steps.push({
            algorithm: 'Bellman-Ford', round, totalRounds: nodes.length - 1,
            dist: { ...dist }, prev: { ...prev }, evaluatingEdge: null, visited: visitedSet,
            explanation: `Round ${round}/${nodes.length - 1}: ${anyUpdate ? 'Distances updated.' : 'No changes — converged early.'} Relaxed all ${activeEdges.length} edges.`,
            insight: `ROUND ${round}: Each round propagates shortest path information one hop further from the source. After V-1 rounds, all paths up to V-1 hops are finalized.`,
        });

        if (!anyUpdate) break;
    }

    steps.push({
        algorithm: 'Bellman-Ford', round: nodes.length - 1, totalRounds: nodes.length - 1,
        dist: { ...dist }, prev: { ...prev }, evaluatingEdge: null,
        visited: new Set(nodes.filter(n => dist[n.id] < Infinity).map(n => n.id)),
        explanation: 'Bellman-Ford complete. All shortest paths computed (including negative weight edges).',
        insight: 'Bellman-Ford runs in O(V·E). Slower than Dijkstra but handles negative weights. Can also detect negative cycles with one extra round.',
    });

    return steps;
}

/* ════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════ */
export default function RoutingAlgoSim() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [preset, setPreset] = useState('Simple');
    const [nodes, setNodes] = useState(PRESETS.Simple.nodes);
    const [edges, setEdges] = useState(PRESETS.Simple.edges);
    const [srcNode, setSrcNode] = useState('R1');
    const [algorithm, setAlgorithm] = useState('Dijkstra');
    const [cutEdges, setCutEdges] = useState([]);
    const [selectedDest, setSelectedDest] = useState(null);
    const [speed, setSpeed] = useState(700);
    const [dragging, setDragging] = useState(null);

    const [steps, setSteps] = useState([]);
    const [currentStep, setCurrentStep] = useState(-1);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [isSimMode, setIsSimMode] = useState(false);

    const timerRef = useRef(null);
    const stepRef = useRef(-1);
    const stepsRef = useRef([]);
    const canvasRef = useRef(null);

    const curStep = currentStep >= 0 && currentStep < steps.length ? steps[currentStep] : null;

    const advanceStep = useCallback(() => {
        const next = stepRef.current + 1;
        if (next >= stepsRef.current.length) {
            setCurrentStep(stepsRef.current.length - 1);
            setIsRunning(false); setIsFinished(true);
            clearInterval(timerRef.current);
            return;
        }
        setCurrentStep(next); stepRef.current = next;
    }, []);

    const handleStart = () => {
        const fn = algorithm === 'Dijkstra' ? dijkstraSteps : bellmanFordSteps;
        const s = fn(nodes, edges, srcNode, cutEdges);
        stepsRef.current = s; setSteps(s);
        setCurrentStep(-1); stepRef.current = -1;
        setIsRunning(true); setIsPaused(false); setIsFinished(false); setIsSimMode(true);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(advanceStep, speed);
    };
    const handlePause = () => { setIsRunning(false); setIsPaused(true); clearInterval(timerRef.current); };
    const handleResume = () => { setIsRunning(true); setIsPaused(false); timerRef.current = setInterval(advanceStep, speed); };
    const handleReset = () => { clearInterval(timerRef.current); setSteps([]); stepsRef.current = []; setCurrentStep(-1); stepRef.current = -1; setIsRunning(false); setIsPaused(false); setIsFinished(false); setIsSimMode(false); setCutEdges([]); setSelectedDest(null); };
    const handleStep = () => {
        if (!isSimMode) {
            const fn = algorithm === 'Dijkstra' ? dijkstraSteps : bellmanFordSteps;
            const s = fn(nodes, edges, srcNode, cutEdges);
            stepsRef.current = s; setSteps(s);
            setIsSimMode(true); stepRef.current = -1;
        }
        advanceStep();
    };

    useEffect(() => () => clearInterval(timerRef.current), []);

    const loadPreset = (name) => {
        setPreset(name);
        setNodes(PRESETS[name].nodes.map(n => ({ ...n })));
        setEdges(PRESETS[name].edges.map(e => ({ ...e })));
        setCutEdges([]);
        setSrcNode(PRESETS[name].nodes[0].id);
    };

    const toggleCutEdge = (edge) => {
        const exists = cutEdges.find(c => c.from === edge.from && c.to === edge.to);
        if (exists) setCutEdges(cutEdges.filter(c => !(c.from === edge.from && c.to === edge.to)));
        else setCutEdges([...cutEdges, edge]);
    };

    // Drag handlers
    const handleMouseDown = (nodeId) => setDragging(nodeId);
    const handleMouseMove = (e) => {
        if (!dragging || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setNodes(nodes.map(n => n.id === dragging ? { ...n, x: Math.max(20, Math.min(rect.width - 20, x)), y: Math.max(20, Math.min(rect.height - 20, y)) } : n));
    };
    const handleMouseUp = () => setDragging(null);

    // Get selected path
    const getHighlightPath = () => {
        if (!curStep?.shortestPath || !selectedDest) return [];
        const sp = curStep.shortestPath.find(p => p.to === selectedDest);
        return sp ? sp.path : [];
    };

    const highlightPath = getHighlightPath();

    /* ════════════════════════════════════════
       CENTER — Network Canvas
       ════════════════════════════════════════ */
    const CENTER = (
        <div style={{ padding: '0.5rem', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Controls */}
            <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.3rem', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
                {Object.keys(PRESETS).map(p => (
                    <button key={p} onClick={() => loadPreset(p)} style={{
                        padding: '0.2rem 0.5rem', fontSize: '0.68rem', fontWeight: 700,
                        border: '2px solid var(--border)',
                        background: preset === p ? 'var(--green)' : 'var(--white)',
                        cursor: 'pointer',
                    }}>{p}</button>
                ))}
                <div style={{ display: isMobile ? 'none' : 'block', width: 1, height: 20, background: 'var(--border)', opacity: 0.3 }} />
                {['Dijkstra', 'Bellman-Ford'].map(a => (
                    <button key={a} onClick={() => setAlgorithm(a)} style={{
                        padding: '0.2rem 0.5rem', fontSize: '0.68rem', fontWeight: 700,
                        border: '2px solid var(--border)',
                        background: algorithm === a ? 'var(--cyan)' : 'var(--white)',
                        cursor: 'pointer',
                    }}>{a}</button>
                ))}
                <div style={{ display: isMobile ? 'none' : 'block', width: 1, height: 20, background: 'var(--border)', opacity: 0.3 }} />
                <span style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.4 }}>Source:</span>
                <select value={srcNode} onChange={e => setSrcNode(e.target.value)}
                    style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.3rem', border: '2px solid var(--border)', fontFamily: 'var(--font-mono)' }}>
                    {nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
                </select>
            </div>

            {/* Canvas */}
            <div style={{ flex: 1, width: '100%', overflow: 'auto', border: '2px solid var(--border)', background: 'rgba(0,0,0,0.02)' }}>
                <div
                    ref={canvasRef}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{
                        position: 'relative',
                        width: isMobile ? '600px' : '100%',
                        height: isMobile ? '350px' : '100%',
                        cursor: dragging ? 'grabbing' : 'default',
                        overflow: 'hidden'
                    }}
                >
                <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                    {/* Edges */}
                    {edges.map((e, i) => {
                        const from = nodes.find(n => n.id === e.from);
                        const to = nodes.find(n => n.id === e.to);
                        if (!from || !to) return null;
                        const isCut = cutEdges.some(c => c.from === e.from && c.to === e.to);
                        const isEval = curStep?.evaluatingEdge && (
                            (curStep.evaluatingEdge.from === e.from && curStep.evaluatingEdge.to === e.to) ||
                            (curStep.evaluatingEdge.from === e.to && curStep.evaluatingEdge.to === e.from)
                        );
                        const isOnPath = highlightPath.length > 1 && highlightPath.some((p, idx) => {
                            if (idx === 0) return false;
                            const prev = highlightPath[idx - 1];
                            return (prev === e.from && p === e.to) || (prev === e.to && p === e.from);
                        });

                        return (
                            <g key={i} onClick={() => toggleCutEdge(e)} style={{ cursor: 'pointer' }}>
                                <line
                                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                                    stroke={isCut ? '#e53935' : isOnPath ? '#00e676' : isEval ? '#ffd93d' : 'var(--border)'}
                                    strokeWidth={isOnPath ? 4 : isEval ? 3 : 2}
                                    strokeDasharray={isCut ? '8,4' : 'none'}
                                    opacity={isCut ? 0.4 : 1}
                                />
                                {/* Weight label */}
                                <text
                                    x={(from.x + to.x) / 2 + 8} y={(from.y + to.y) / 2 - 8}
                                    fontSize="12" fontWeight="800" fontFamily="var(--font-mono)"
                                    fill={e.w < 0 ? '#e53935' : 'var(--text)'} textAnchor="middle"
                                >
                                    {e.w}
                                </text>
                                {isCut && (
                                    <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 + 4}
                                        fontSize="16" fontWeight="900" fill="#e53935" textAnchor="middle">✕</text>
                                )}
                            </g>
                        );
                    })}

                    {/* Shortest path glow */}
                    {isOnPathLine()}
                </svg>

                {/* Nodes */}
                {nodes.map(node => {
                    const isVisited = curStep?.visited?.has(node.id);
                    const isCurrent = curStep?.currentNode === node.id;
                    const isSource = node.id === srcNode;
                    const dist = curStep?.dist?.[node.id];
                    const isOnHighlight = highlightPath.includes(node.id);

                    return (
                        <motion.div
                            key={node.id}
                            onMouseDown={() => handleMouseDown(node.id)}
                            animate={{
                                scale: isCurrent ? 1.2 : 1,
                                boxShadow: isCurrent ? '0 0 16px rgba(255,215,61,0.6)' : isOnHighlight ? '0 0 12px rgba(0,230,118,0.6)' : 'var(--shadow-sm)',
                            }}
                            style={{
                                position: 'absolute',
                                left: node.x - 22,
                                top: node.y - 22,
                                width: 44, height: 44,
                                borderRadius: '50%',
                                border: '3px solid var(--border)',
                                background: isCurrent ? 'var(--yellow)' : isOnHighlight ? '#00e676' : isVisited ? '#4dd0e1' : isSource ? 'var(--green)' : 'var(--white)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                cursor: 'grab',
                                zIndex: 5,
                                userSelect: 'none',
                            }}
                        >
                            <span style={{ fontWeight: 800, fontSize: '0.7rem', lineHeight: 1 }}>{node.id}</span>
                            {dist !== undefined && dist !== Infinity && (
                                <span style={{ fontSize: '0.5rem', fontFamily: 'var(--font-mono)', fontWeight: 700, opacity: 0.7 }}>{dist}</span>
                            )}
                        </motion.div>
                    );
                })}

                {/* Dijkstra failure badge */}
                {curStep?.failed && (
                    <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        style={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                            background: 'var(--pink)', border: '3px solid var(--border)', padding: '0.5rem 1rem',
                            fontWeight: 800, fontSize: '0.85rem', boxShadow: 'var(--shadow)', zIndex: 10,
                        }}
                    >⚠ Negative weights not supported by Dijkstra!</motion.div>
                )}
                </div>
            </div>
        </div>
    );

    // Helper for path line
    function isOnPathLine() { return null; } // Path glow is handled by edge stroke

    /* ════════════════════════════════════════
       LEFT — Distance Table
       ════════════════════════════════════════ */
    const LEFT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <div style={{ background: 'var(--green)', padding: '0.25rem 0.5rem', borderBottom: '2px solid var(--border)', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase' }}>Distance Table</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.68rem' }}>
                    <thead>
                        <tr>
                            <th style={{ padding: '0.2rem 0.3rem', borderBottom: '2px solid var(--border)', borderRight: '1px solid var(--border)', fontWeight: 800, background: 'var(--green)' }}>Node</th>
                            <th style={{ padding: '0.2rem 0.3rem', borderBottom: '2px solid var(--border)', borderRight: '1px solid var(--border)', fontWeight: 800, background: 'var(--green)' }}>Dist</th>
                            <th style={{ padding: '0.2rem 0.3rem', borderBottom: '2px solid var(--border)', fontWeight: 800, background: 'var(--green)' }}>Via</th>
                        </tr>
                    </thead>
                    <tbody>
                        {nodes.map(n => {
                            const d = curStep?.dist?.[n.id];
                            const via = curStep?.prev?.[n.id];
                            const isVis = curStep?.visited?.has(n.id);
                            return (
                                <tr key={n.id}
                                    onClick={() => setSelectedDest(n.id)}
                                    style={{ cursor: 'pointer', background: selectedDest === n.id ? 'var(--yellow)' : isVis ? 'rgba(77,208,225,0.15)' : 'transparent' }}>
                                    <td style={{ padding: '0.2rem 0.3rem', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{n.id}</td>
                                    <td style={{ padding: '0.2rem 0.3rem', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', fontFamily: 'var(--font-mono)' }}>
                                        {d === Infinity ? '∞' : d ?? '—'}
                                    </td>
                                    <td style={{ padding: '0.2rem 0.3rem', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)' }}>
                                        {via || '—'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Stats */}
            {[
                { label: 'Algorithm', val: curStep?.algorithm ?? algorithm, color: 'var(--cyan)' },
                { label: 'Nodes Visited', val: curStep?.visited?.size ?? 0, color: 'var(--green)' },
                { label: 'Round', val: curStep?.round !== undefined ? `${curStep.round}/${curStep.totalRounds}` : '—', color: 'var(--yellow)' },
            ].map(s => (
                <div key={s.label} style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ background: s.color, padding: '0.2rem 0.4rem', borderBottom: '2px solid var(--border)', fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase' }}>{s.label}</div>
                    <div style={{ padding: '0.25rem 0.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{s.val}</div>
                </div>
            ))}

            <div style={{ fontSize: '0.6rem', opacity: 0.4, fontWeight: 700, marginTop: '0.25rem' }}>
                Click an edge to cut it. Click a table row to highlight path.
            </div>
        
            <DownloadNotes topicKey="networks/routing" />
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
                            <div style={{ background: 'var(--green)', padding: '0.4rem 0.6rem', borderBottom: '2px solid var(--border)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>Algorithm Logic</div>
                            <div style={{ padding: '0.5rem 0.6rem', fontSize: '0.82rem', lineHeight: 1.5 }}>{curStep.explanation}</div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}
            {curStep && (
                <div style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--yellow)', padding: '0.4rem 0.6rem', borderBottom: '2px solid var(--border)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>Educational Insight</div>
                    <div style={{ padding: '0.5rem 0.6rem', fontSize: '0.8rem', lineHeight: 1.5, opacity: 0.85 }}>{curStep.insight}</div>
                </div>
            )}
            <div style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <div style={{ background: 'var(--cyan)', padding: '0.4rem 0.6rem', borderBottom: '2px solid var(--border)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>Concept: Link State vs Distance Vector</div>
                <div style={{ padding: '0.5rem 0.6rem', fontSize: '0.72rem', lineHeight: 1.5 }}>
                    <div className="no-mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem', fontSize: '0.65rem' }}>
                        <div style={{ fontWeight: 800, background: 'var(--green)', padding: '0.2rem', textAlign: 'center', border: '1px solid var(--border)' }}>Link State (OSPF)</div>
                        <div style={{ fontWeight: 800, background: 'var(--orange)', padding: '0.2rem', textAlign: 'center', border: '1px solid var(--border)' }}>Distance Vector (RIP)</div>
                        <div style={{ padding: '0.15rem 0.25rem', border: '1px solid var(--border)' }}>Dijkstra</div>
                        <div style={{ padding: '0.15rem 0.25rem', border: '1px solid var(--border)' }}>Bellman-Ford</div>
                        <div style={{ padding: '0.15rem 0.25rem', border: '1px solid var(--border)' }}>Global view</div>
                        <div style={{ padding: '0.15rem 0.25rem', border: '1px solid var(--border)' }}>Local view</div>
                        <div style={{ padding: '0.15rem 0.25rem', border: '1px solid var(--border)' }}>Fast convergence</div>
                        <div style={{ padding: '0.15rem 0.25rem', border: '1px solid var(--border)' }}>Count-to-∞</div>
                    </div>
                </div>
            </div>
        </div>
    );

    const TL = steps.map((s, i) => ({
        id: i, label: s.currentNode || s.algorithm || 'Done',
        done: i < currentStep, active: i === currentStep,
    }));

    
    useSnapshot(useCallback((config, step) => {
        if (config.preset !== undefined) setPreset(config.preset);
        if (config.nodes !== undefined) setNodes(config.nodes);
        if (config.edges !== undefined) setEdges(config.edges);
        if (config.srcNode !== undefined) setSrcNode(config.srcNode);
        if (config.algorithm !== undefined) setAlgorithm(config.algorithm);
        if (config.cutEdges !== undefined) setCutEdges(config.cutEdges);
        if (config.selectedDest !== undefined) setSelectedDest(config.selectedDest);

        setTimeout(() => {
            if (step !== undefined) setCurrentStep(step);
            setIsRunning(false);
            setIsPaused(true);
            setIsSimMode(true);

        }, 50);
    }, []));

    return (
        <ImmersiveLayout
            isActive={isSimMode}
            snapshotData={{
                config: { preset, nodes, edges, srcNode, algorithm, cutEdges, selectedDest },
                step: currentStep
            }}
            title="Routing Algorithms"
            icon="🗺"
            moduleLabel="CN MODULE"
            isRunning={isRunning} isPaused={isPaused} isFinished={isFinished}
            speed={speed} onSpeedChange={setSpeed}
            onStart={handleStart} onPause={handlePause} onResume={handleResume} onReset={handleReset} onStep={handleStep}
            currentStepNum={Math.max(0, currentStep + 1)} totalSteps={steps.length}
            phaseName={curStep?.currentNode ? `Visiting ${curStep.currentNode}` : ''} centerContent={CENTER} leftContent={LEFT} rightContent={RIGHT}
            timelineItems={TL}
            legend={[
                { color: 'var(--green)', label: 'Source' },
                { color: '#4dd0e1', label: 'Visited' },
                { color: 'var(--yellow)', label: 'Current' },
                { color: '#00e676', label: 'Shortest Path' },
                { color: '#e53935', label: 'Cut Link' },
            ]}
        >
            <div className="main-content">
                <div style={{ marginBottom: '0.4rem' }}><Link to="/networks" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← Networks Module</Link></div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="section-header">Networks · Routing</div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 700 }}>🗺 Routing Algorithms</h1>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '0.3rem' }}>Interactive topology with Dijkstra & Bellman-Ford step-through, link failure, distance tables, and path visualization.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                    <div className="panel">
                        <div className="panel-header" style={{ background: 'var(--green)' }}>⚙ Configuration</div>
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <label className="form-label">Topology Preset</label>
                                <div style={{ display: 'flex', gap: '0.3rem' }}>
                                    {Object.keys(PRESETS).map(p => (
                                        <button key={p} className={`chip ${preset === p ? 'active' : ''}`}
                                            onClick={() => loadPreset(p)} style={{ fontSize: '0.78rem' }}>{p}</button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label className="form-label">Algorithm</label>
                                    <select className="form-select" value={algorithm} onChange={e => setAlgorithm(e.target.value)}>
                                        <option>Dijkstra</option>
                                        <option>Bellman-Ford</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Source Node</label>
                                    <select className="form-select" value={srcNode} onChange={e => setSrcNode(e.target.value)}>
                                        {nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="panel">
                        <div className="panel-header" style={{ background: 'var(--green)' }}>🏷 Concepts Covered</div>
                        <div style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                                {['Dijkstra', 'Bellman-Ford', 'Link State', 'Distance Vector', 'OSPF', 'RIP'].map(t => (
                                    <span key={t} style={{
                                        fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                                        padding: '0.2rem 0.5rem', border: '2px solid var(--border)', background: 'var(--green)',
                                    }}>{t}</span>
                                ))}
                            </div>
                            <p style={{ fontSize: '0.82rem', opacity: 0.7 }}>Drag nodes, cut links, compare algorithms. Try the negative weight preset to see Dijkstra fail!</p>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.75rem' }}>
                    <button className="btn btn-lg btn-green" style={{ justifyContent: 'center' }} onClick={handleStart}>▶ Simulate</button>
                    <button className="btn btn-sm" style={{ marginTop: isMobile ? '0' : '0.15rem', justifyContent: 'center' }} onClick={handleStep}>⏭ Step Through</button>
                </div>
            </div>
        </ImmersiveLayout>
    );
}
