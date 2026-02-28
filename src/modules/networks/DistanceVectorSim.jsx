import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';

const INF = Infinity;
const DEFAULT_GRAPH = {
    nodes: ['A', 'B', 'C', 'D'],
    edges: [
        { from: 'A', to: 'B', weight: 4 },
        { from: 'A', to: 'C', weight: 2 },
        { from: 'B', to: 'D', weight: 5 },
        { from: 'C', to: 'B', weight: 1 },
        { from: 'C', to: 'D', weight: 8 },
    ],
};
const EXPLANATIONS = {
    iteration: (n, updates) => ({
        what: `Iteration ${n}: Each router shares its table with neighbors. ${updates} route(s) updated.`,
        why: 'Distance Vector uses the Bellman-Ford principle: dist(u,v) = min over neighbors w of (cost(u,w) + dist(w,v)).',
        insight: 'Convergence is guaranteed for finite, non-negative graphs. Each iteration propagates distance info one hop further.',
    }),
    converged: {
        what: 'All routing tables are stable — no router saw an improvement this iteration.',
        why: 'When no updates occur in an iteration, Bellman-Ford terminates. The result is globally optimal.',
        insight: 'Distance Vector can suffer from "count to infinity" on link failures — OSPF (Link State) avoids this.',
    },
};

function buildAdjMatrix(graph) {
    const { nodes, edges } = graph;
    const adj = {};
    nodes.forEach(n => { adj[n] = {}; nodes.forEach(m => { adj[n][m] = n === m ? 0 : INF; }); });
    edges.forEach(e => { adj[e.from][e.to] = e.weight; adj[e.to][e.from] = e.weight; });
    return adj;
}

function runDV(graph) {
    const { nodes } = graph;
    const adj = buildAdjMatrix(graph);
    let tables = {};
    nodes.forEach(n => { tables[n] = { ...adj[n] }; });
    const steps = [];
    let converged = false, iter = 0;
    while (!converged && iter < 20) {
        converged = true;
        const newTables = {};
        nodes.forEach(n => { newTables[n] = { ...tables[n] }; });
        const updates = [];
        nodes.forEach(n => nodes.forEach(dest => nodes.forEach(neighbor => {
            if (adj[n][neighbor] === INF) return;
            const via = adj[n][neighbor] + tables[neighbor][dest];
            if (via < newTables[n][dest]) { updates.push({ node: n, dest, oldDist: newTables[n][dest], newDist: via, via: neighbor }); newTables[n][dest] = via; converged = false; }
        })));
        steps.push({ iteration: iter + 1, tables: JSON.parse(JSON.stringify(newTables)), updates: [...updates], converged: converged && iter > 0, phase: `Iteration ${iter + 1}${updates.length === 0 ? ' — converged' : ` — ${updates.length} update(s)`}` });
        tables = newTables; iter++;
        if (converged) break;
    }
    return steps;
}

const NODE_COLORS = { A: 'var(--yellow)', B: 'var(--cyan)', C: 'var(--pink)', D: 'var(--green)' };

export default function DistanceVectorSim() {
    const [graph] = useState(DEFAULT_GRAPH);
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
        const s = runDV(graph);
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
    const exp = curStep ? (curStep.converged ? EXPLANATIONS.converged : EXPLANATIONS.iteration(curStep.iteration, curStep.updates.length)) : null;

    const CENTER = (
        <div style={{ padding: '0.75rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
            {/* Network Topology with Animated Updates */}
            <div style={{ flex: '0 0 220px', flexShrink: 0, position: 'relative' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.6rem', letterSpacing: '0.05em' }}>Network Topology & Propagation</div>
                <svg width="100%" viewBox="0 0 380 180" style={{ border: '4px solid var(--border)', borderRadius: '12px', background: 'var(--white)', maxHeight: 180, boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)' }}>
                    {graph.edges.map((e, i) => {
                        const positions = { A: [70, 90], B: [190, 40], C: [190, 140], D: [310, 90] };
                        const [x1, y1] = positions[e.from]; const [x2, y2] = positions[e.to];
                        const isUpdatePath = curStep?.updates.some(u => u.via === e.from && graph.nodes.includes(e.to));

                        return (
                            <g key={i}>
                                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--border)" strokeWidth="3" strokeDasharray={isUpdatePath ? "5,5" : "0"} />
                                {isUpdatePath && !curStep.converged && (
                                    <motion.circle
                                        r="5" fill="var(--pink)"
                                        animate={{ cx: [x1, x2], cy: [y1, y2] }}
                                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                    />
                                )}
                                <rect x={(x1 + x2) / 2 - 12} y={(y1 + y2) / 2 - 12} width="24" height="20" rx="4" fill="var(--white)" stroke="var(--border)" strokeWidth="2" />
                                <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 + 3} textAnchor="middle" fontSize="10" fontWeight="900" fontFamily="var(--font-mono)">{e.weight}</text>
                            </g>
                        );
                    })}
                    {graph.nodes.map(n => {
                        const positions = { A: [70, 90], B: [190, 40], C: [190, 140], D: [310, 90] };
                        const [x, y] = positions[n] || [190, 90];
                        const hasUpdates = curStep?.updates.some(u => u.node === n);
                        const isConverged = curStep?.converged;

                        return (
                            <g key={n}>
                                <motion.circle
                                    cx={x} cy={y} r={24}
                                    fill={NODE_COLORS[n]}
                                    stroke="var(--border)" strokeWidth="3"
                                    animate={{ scale: hasUpdates ? [1, 1.1, 1] : 1 }}
                                />
                                <text x={x} y={y + 6} textAnchor="middle" fontSize="16" fontWeight="900" fontFamily="var(--font-mono)">{n}</text>
                                {isConverged && (
                                    <text x={x + 18} y={y - 18} fontSize="14">✅</text>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Routing Table Grid */}
            {curStep && (
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.6rem', letterSpacing: '0.05em' }}>Node DV Tables (Iter {curStep.iteration})</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', flex: 1, overflowY: 'auto', padding: '0.25rem' }}>
                        {graph.nodes.map(node => (
                            <div key={node} style={{ border: '3px solid var(--border)', borderRadius: '10px', overflow: 'hidden', background: 'var(--white)', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ padding: '0.4rem 0.8rem', fontWeight: 900, background: NODE_COLORS[node], borderBottom: '3px solid var(--border)', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>ROUTER {node}</span>
                                    {curStep.updates.some(u => u.node === node) && <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity }}>⚡ UPDATE</motion.span>}
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border)' }}>
                                            <th style={{ padding: '4px', textAlign: 'left', borderRight: '1px solid var(--border)' }}>Dest</th>
                                            <th style={{ padding: '4px', textAlign: 'center' }}>Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {graph.nodes.map(dest => {
                                            const dist = curStep.tables[node][dest];
                                            const wasUpdated = curStep.updates.some(u => u.node === node && u.dest === dest);
                                            return (
                                                <tr key={dest} style={{ background: wasUpdated ? 'rgba(255,217,61,0.2)' : 'transparent' }}>
                                                    <td style={{ padding: '4px 8px', borderRight: '1px solid var(--border)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{dest}</td>
                                                    <td style={{ padding: '4px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: wasUpdated ? 900 : 700 }}>
                                                        {dist === INF ? '∞' : dist} {wasUpdated ? '↑' : ''}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const LEFT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', overflow: 'hidden' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Iterations</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {steps.slice(0, currentStep + 1).map((s, i) => (
                    <div key={i} style={{
                        border: '2px solid var(--border)', padding: '0.25rem 0.5rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                        background: i === currentStep ? 'var(--yellow)' : s.converged ? 'var(--green)' : 'var(--white)', cursor: 'pointer'
                    }}
                        onClick={() => { setCurrentStep(i); stepRef.current = i; }}>
                        #{i + 1} — {s.updates.length} update{s.updates.length !== 1 ? 's' : ''} {s.converged ? '✅' : ''}
                    </div>
                ))}
            </div>
            {curStep && (
                <>
                    <div style={{ height: 2, background: 'var(--border)', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Updated Routes</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{curStep.updates.length}</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Status</div>
                    <div style={{ fontWeight: 700, background: curStep.converged ? 'var(--green)' : 'var(--cyan)', border: '2px solid var(--border)', padding: '0.25rem 0.5rem', fontSize: '0.82rem' }}>
                        {curStep.converged ? '✅ Converged' : '⚡ Running'}
                    </div>
                </>
            )}
        </div>
    );

    const RIGHT = curStep && exp ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
                <motion.div key={currentStep} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.55, marginBottom: '0.3rem' }}>What Happened</div>
                    <div style={{ fontSize: '0.82rem', lineHeight: 1.55, borderLeft: '3px solid var(--yellow)', paddingLeft: '0.6rem' }}>{exp.what}</div>
                </motion.div>
            </AnimatePresence>
            <div style={{ height: 2, background: 'var(--border)' }} />
            <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.55, marginBottom: '0.3rem' }}>💡 Bellman-Ford Principle</div>
                <div style={{ background: 'var(--yellow)', border: '2px solid var(--border)', padding: '0.5rem 0.6rem', fontSize: '0.78rem', lineHeight: 1.5 }}>{exp.why}</div>
            </div>
            <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.55, marginBottom: '0.3rem' }}>❓ Why This Matters</div>
                <div style={{ fontSize: '0.78rem', lineHeight: 1.5, opacity: 0.8 }}>{exp.insight}</div>
            </div>
        </div>
    ) : null;

    const TL = steps.map((s, i) => ({ id: i, label: `Iter ${i + 1}`, done: i < currentStep, active: i === currentStep }));

    return (
        <ImmersiveLayout isActive={isSimMode} title="Distance Vector Routing" icon="📡" moduleLabel="Networks Module"
            isRunning={isRunning} isPaused={isPaused} isFinished={isFinished} speed={speed} onSpeedChange={setSpeed}
            onStart={handleStart} onPause={handlePause} onResume={handleResume} onReset={handleReset} onStep={handleStep}
            currentStepNum={Math.max(0, currentStep + 1)} totalSteps={steps.length}
            phaseName={curStep?.phase ?? ''} centerContent={CENTER} leftContent={LEFT} rightContent={RIGHT}
            timelineItems={TL} legend={[{ color: 'var(--yellow)', label: 'Node A' }, { color: 'var(--cyan)', label: 'Node B' }, { color: 'var(--pink)', label: 'Node C' }, { color: 'var(--green)', label: 'Node D' }]}>
            <div className="main-content">
                <div style={{ marginBottom: '0.4rem' }}><Link to="/networks" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← Networks Module</Link></div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="section-header">Networks · Routing Protocols</div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 700 }}>📡 Distance Vector Routing Simulator</h1>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '0.3rem' }}>Watch Bellman-Ford iteratively converge routing tables across all nodes in the network.</p>
                </div>
                <div className="panel" style={{ marginBottom: '1.25rem' }}>
                    <div className="panel-header">🗺 Fixed Network Topology</div>
                    <div style={{ padding: '1rem', fontSize: '0.85rem', opacity: 0.8 }}>
                        Graph: A–B(4), A–C(2), B–D(5), C–B(1), C–D(8). Undirected. The algorithm finds shortest paths using iterative table exchange.
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-yellow btn-lg" onClick={handleStart}>▶ Run Distance Vector</button>
                    <button className="btn btn-sm" style={{ marginTop: '0.15rem' }} onClick={handleStep}>⏭ Step Through</button>
                </div>
            </div>
        </ImmersiveLayout>
    );
}
