import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';

const INF = Infinity;
const GRAPH = {
    nodes: ['A', 'B', 'C', 'D', 'E'],
    edges: [
        { from: 'A', to: 'B', w: 4 }, { from: 'A', to: 'C', w: 2 },
        { from: 'B', to: 'C', w: 1 }, { from: 'B', to: 'D', w: 5 },
        { from: 'C', to: 'D', w: 8 }, { from: 'C', to: 'E', w: 10 },
        { from: 'D', to: 'E', w: 2 },
    ],
};
const POSITIONS = { A: [80, 140], B: [200, 60], C: [200, 200], D: [340, 60], E: [340, 200] };

function runDijkstra(startNode, graph) {
    const { nodes, edges } = graph;
    const dist = {}; const prev = {};
    nodes.forEach(n => { dist[n] = n === startNode ? 0 : INF; prev[n] = null; });
    const visited = new Set(); const steps = [];

    for (let i = 0; i < nodes.length; i++) {
        const u = nodes.filter(n => !visited.has(n)).reduce((a, b) => dist[a] <= dist[b] ? a : b);
        visited.add(u);
        steps.push({
            phase: `Visit ${u} (dist=${dist[u] === INF ? '∞' : dist[u]})`,
            visited: new Set(visited), current: u, dist: { ...dist }, prev: { ...prev },
            explanation: `Select unvisited node with smallest distance: ${u} (d=${dist[u] === INF ? '∞' : dist[u]}). Mark as visited and relax its neighbors.`,
            insight: "Dijkstra's greedy approach: always pick the nearest unvisited node next. This works because edge weights are non-negative.",
            insightTitle: "Greedy Selection",
        });

        const neighbors = edges.filter(e => (e.from === u || e.to === u));
        for (const edge of neighbors) {
            const v = edge.from === u ? edge.to : edge.from;
            const w = edge.w;
            if (!visited.has(v) && dist[u] + w < dist[v]) {
                const oldDist = dist[v];
                dist[v] = dist[u] + w; prev[v] = u;
                steps.push({
                    phase: `Relax ${u}→${v}: ${oldDist === INF ? '∞' : oldDist} → ${dist[v]}`,
                    visited: new Set(visited), current: u, relaxing: v, dist: { ...dist }, prev: { ...prev },
                    explanation: `Shorter path found! dist[${v}] improved from ${oldDist === INF ? '∞' : oldDist} to ${dist[u]}+${w}=${dist[v]} via ${u}.`,
                    insight: 'Relaxation: if dist[u] + weight(u,v) < dist[v], update dist[v]. This is the core of shortest-path algorithms.',
                    insightTitle: 'Edge Relaxation',
                });
            }
        }
    }

    steps.push({
        phase: '✅ All shortest paths found',
        visited: new Set(visited), current: null, dist: { ...dist }, prev: { ...prev }, done: true,
        explanation: `Shortest distances from ${startNode}: ${nodes.map(n => `${n}=${dist[n]}`).join(', ')}.`,
        insight: 'Dijkstra runs in O((V+E) log V) with a priority queue. Fails on negative-weight edges (use Bellman-Ford instead).',
        insightTitle: 'Complexity & Limitations',
    });

    return steps;
}

export default function LinkStateSim() {
    const [source, setSource] = useState('A');
    const [speed, setSpeed] = useState(900);
    const [steps, setSteps] = useState([]);
    const [currentStep, setCurrentStep] = useState(-1);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [isSimMode, setIsSimMode] = useState(false);

    const timerRef = useRef(null);
    const stepRef = useRef(-1);
    const stepsRef = useRef([]);

    const advanceStep = useCallback((stepsArr, idx) => {
        const newIdx = idx + 1;
        if (newIdx >= stepsArr.length) { setCurrentStep(newIdx - 1); setIsRunning(false); setIsFinished(true); clearInterval(timerRef.current); return; }
        setCurrentStep(newIdx); stepRef.current = newIdx;
    }, []);

    const handleStart = () => {
        const s = runDijkstra(source, GRAPH);
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

    const CENTER = (
        <div style={{ padding: '0.75rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', overflow: 'hidden' }}>
            {/* SVG Graph */}
            <div style={{ flex: '0 0 240px' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.4rem' }}>Network Graph (Source: {source})</div>
                <svg width="100%" viewBox="0 0 440 260" style={{ border: '2px solid var(--border)', background: 'var(--white)', maxHeight: 240 }}>
                    {GRAPH.edges.map((e, i) => {
                        const [x1, y1] = POSITIONS[e.from]; const [x2, y2] = POSITIONS[e.to];
                        const isRelax = curStep?.relaxing === e.to && curStep?.current === e.from || curStep?.relaxing === e.from && curStep?.current === e.to;
                        return (
                            <g key={i}>
                                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={isRelax ? 'var(--pink)' : '#666'} strokeWidth={isRelax ? 3 : 1.5} strokeDasharray={isRelax ? '6,3' : ''} />
                                <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 6} textAnchor="middle" fontSize="11" fontWeight="700">{e.w}</text>
                            </g>
                        );
                    })}
                    {GRAPH.nodes.map(n => {
                        const [x, y] = POSITIONS[n];
                        const isVisited = curStep?.visited?.has(n);
                        const isCurrent = curStep?.current === n;
                        const isRelaxTarget = curStep?.relaxing === n;
                        const dist = curStep?.dist?.[n];
                        const bg = isCurrent ? '#FFD93D' : isRelaxTarget ? '#ff6b9d' : isVisited ? '#a8e6cf' : '#fff';
                        return (
                            <g key={n}>
                                <circle cx={x} cy={y} r={24} fill={bg} stroke={bg === '#fff' ? '#999' : '#1a1a1a'} strokeWidth={isCurrent ? 3 : 2} />
                                <text x={x} y={y - 4} textAnchor="middle" fontSize="13" fontWeight="700">{n}</text>
                                <text x={x} y={y + 12} textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="monospace">{dist === INF || dist === undefined ? '∞' : dist}</text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Distance table */}
            {curStep && (
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.4rem' }}>Shortest Distances from {source}</div>
                    <table className="neo-table" style={{ fontSize: '0.82rem' }}>
                        <thead><tr><th>Node</th><th>Distance</th><th>Via</th><th>Visited</th></tr></thead>
                        <tbody>
                            {GRAPH.nodes.map(n => {
                                const isRelaxed = curStep.relaxing === n;
                                const isCur = curStep.current === n;
                                return (
                                    <tr key={n} style={{ background: isCur ? 'rgba(255,217,61,0.4)' : isRelaxed ? 'rgba(168,230,207,0.4)' : '' }}>
                                        <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{n}{n === source ? ' (src)' : ''}</td>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: isRelaxed ? 700 : 400 }}>{curStep.dist[n] === INF ? '∞' : curStep.dist[n]} {isRelaxed ? '🔄' : ''}</td>
                                        <td style={{ fontFamily: 'var(--font-mono)' }}>{curStep.prev?.[n] ?? '—'}</td>
                                        <td>{curStep.visited?.has(n) ? '✅' : '⏳'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    const LEFT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', overflow: 'hidden' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Algorithm</div>
            <div style={{ fontWeight: 700 }}>Dijkstra's</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Source</div>
            <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', background: 'var(--yellow)', border: '2px solid var(--border)', padding: '0.2rem 0.5rem', width: 'fit-content' }}>{source}</div>
            {curStep && (
                <>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Visiting</div>
                    <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', background: 'var(--yellow)', border: '2px solid var(--border)', padding: '0.2rem 0.5rem', width: 'fit-content' }}>{curStep.current ?? '—'}</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Visited</div>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {[...curStep.visited].map(n => <div key={n} style={{ background: 'var(--green)', border: '2px solid var(--border)', padding: '0.1rem 0.35rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{n}</div>)}
                    </div>
                </>
            )}
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
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.55, marginBottom: '0.3rem' }}>💡 {curStep.insightTitle}</div>
                <div style={{ background: 'var(--yellow)', border: '2px solid var(--border)', padding: '0.5rem 0.6rem', fontSize: '0.78rem', lineHeight: 1.5 }}>{curStep.insight}</div>
            </div>
        </div>
    ) : null;

    const TL = steps.map((s, i) => ({ id: i, label: s.phase, done: i < currentStep, active: i === currentStep }));

    return (
        <ImmersiveLayout isActive={isSimMode} title="Link State / Dijkstra" icon="📡" moduleLabel="Networks Module"
            isRunning={isRunning} isPaused={isPaused} isFinished={isFinished} speed={speed} onSpeedChange={setSpeed}
            onStart={handleStart} onPause={handlePause} onResume={handleResume} onReset={handleReset} onStep={handleStep}
            currentStepNum={Math.max(0, currentStep + 1)} totalSteps={steps.length}
            phaseName={curStep?.phase ?? ''} centerContent={CENTER} leftContent={LEFT} rightContent={RIGHT}
            timelineItems={TL} legend={[{ color: '#FFD93D', label: 'Current' }, { color: '#ff6b9d', label: 'Relaxing' }, { color: '#a8e6cf', label: 'Visited' }, { color: '#fff', label: 'Unvisited' }]}>
            <div className="main-content">
                <div style={{ marginBottom: '0.4rem' }}><Link to="/networks" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← Networks Module</Link></div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="section-header">Networks · Link State Protocol</div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 700 }}>📡 Link State Routing (Dijkstra)</h1>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '0.3rem' }}>Watch Dijkstra's greedy algorithm discover shortest paths step by step on an animated graph.</p>
                </div>
                <div className="panel" style={{ marginBottom: '1.25rem' }}>
                    <div className="panel-header">⚙ Configuration</div>
                    <div style={{ padding: '1rem' }}>
                        <label className="form-label">Source Node</label>
                        <select className="form-select" value={source} onChange={e => setSource(e.target.value)} style={{ width: 80 }}>
                            {GRAPH.nodes.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-yellow btn-lg" onClick={handleStart}>▶ Run Dijkstra</button>
                    <button className="btn btn-sm" style={{ marginTop: '0.15rem' }} onClick={handleStep}>⏭ Step Through</button>
                </div>
            </div>
        </ImmersiveLayout>
    );
}
