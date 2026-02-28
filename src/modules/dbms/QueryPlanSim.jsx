import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';

const QUERY = {
    sql: 'SELECT * FROM orders o JOIN customers c ON o.cust_id = c.id WHERE c.city = \'NYC\' AND o.amount > 100',
    plans: [
        { name: 'Parse & Validate', icon: '📝', description: 'SQL is tokenized and parsed into an Abstract Syntax Tree (AST). Syntax errors are caught here.', color: 'var(--white)' },
        { name: 'Logical Plan', icon: '📋', description: 'Raw logical plan: SELECT ← JOIN (orders ⋈ customers) ← FILTER(city=NYC AND amount>100)', color: 'var(--cyan)' },
        { name: 'Selection Pushdown', icon: '🔽', description: 'Optimizer pushes WHERE filters below JOIN: filter customers first (city=NYC), filter orders (amount>100). Reduces JOIN size.', color: 'var(--yellow)' },
        { name: 'Join Order Optimization', icon: '🔀', description: 'Optimizer estimates smaller relation: customers WHERE city=NYC is smaller → set as build side of hash join.', color: 'var(--pink)' },
        { name: 'Add Index Scan', icon: '🔍', description: 'Index exists on customers.city → use Index Scan. For orders.amount, use sequential scan (no index found).', color: 'var(--green)' },
        { name: 'Physical Plan Ready', icon: '⚙', description: 'Final plan: IndexScan(customers, city=NYC) → HashJoin → SeqScan(orders, amount>100) → Project(*)', color: 'var(--yellow)' },
        { name: 'Execute → Result', icon: '✅', description: 'Plan executed. Rows fetched, joined, filtered. Result set returned to client.', color: 'var(--green)' },
    ],
    insights: [
        'Parsing converts SQL text to an internal AST. Checks syntax and resolves table/column names against the catalog.',
        'The logical plan describes WHAT to compute (relational algebra) but not HOW. Multiple physical plans can implement the same logical plan.',
        'Pushing selections down (below joins) is one of the most impactful optimizations — reduce rows before joining, not after.',
        'Join order and algorithm matter: hash join vs merge join vs nested loop have very different costs depending on data size.',
        'Index scans are O(log n) — much faster than O(n) sequential scans for selective queries. The optimizer checks statistics.',
        'The query planner uses statistics (row counts, cardinality, histograms) to estimate costs and pick the cheapest physical plan.',
        'The final result is streamed back through the same pipeline (volcano model): each operator pulls from its child lazily.',
    ],
};

export default function QueryPlanSim() {
    const [speed, setSpeed] = useState(900);
    const [currentStep, setCurrentStep] = useState(-1);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [isSimMode, setIsSimMode] = useState(false);

    const timerRef = useRef(null);
    const stepRef = useRef(-1);
    const total = QUERY.plans.length;

    const advanceStep = useCallback((idx) => {
        const newIdx = idx + 1;
        if (newIdx >= total) { setCurrentStep(newIdx - 1); setIsRunning(false); setIsFinished(true); clearInterval(timerRef.current); return; }
        setCurrentStep(newIdx); stepRef.current = newIdx;
    }, [total]);

    const handleStart = () => { setCurrentStep(-1); stepRef.current = -1; setIsRunning(true); setIsPaused(false); setIsFinished(false); setIsSimMode(true); clearInterval(timerRef.current); timerRef.current = setInterval(() => advanceStep(stepRef.current), speed); };
    const handlePause = () => { setIsRunning(false); setIsPaused(true); clearInterval(timerRef.current); };
    const handleResume = () => { setIsRunning(true); setIsPaused(false); timerRef.current = setInterval(() => advanceStep(stepRef.current), speed); };
    const handleReset = () => { clearInterval(timerRef.current); setCurrentStep(-1); stepRef.current = -1; setIsRunning(false); setIsPaused(false); setIsFinished(false); setIsSimMode(false); };
    const handleStep = () => { setIsSimMode(true); advanceStep(stepRef.current); };

    const curPlan = currentStep >= 0 ? QUERY.plans[currentStep] : null;

    const CENTER = (
        <div style={{ padding: '0.75rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflow: 'hidden' }}>
            {/* SQL Terminal */}
            <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Input SQL Statement</div>
                <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.85rem', background: '#0d0d0d', color: '#a8ecaf',
                    padding: '1rem', borderRadius: '8px', border: '3px solid var(--border)', lineHeight: 1.6,
                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
                }}>
                    <span style={{ color: '#ff79c6' }}>SELECT</span> * <span style={{ color: '#ff79c6' }}>FROM</span> orders o <br />
                    <span style={{ color: '#ff79c6' }}>JOIN</span> customers c <span style={{ color: '#ff79c6' }}>ON</span> o.cust_id = c.id <br />
                    <span style={{ color: '#ff79c6' }}>WHERE</span> c.city = <span style={{ color: '#f1fa8c' }}>'NYC'</span> <span style={{ color: '#ff79c6' }}>AND</span> o.amount &gt; <span style={{ color: '#bd93f9' }}>100</span>
                </div>
            </div>

            {/* Execution Plan Tree-like Flow */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.8rem', letterSpacing: '0.05em' }}>Pipeline Execution Plan</div>
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column-reverse', gap: '0.4rem',
                    overflowY: 'auto', padding: '0.5rem', alignItems: 'center'
                }}>
                    {QUERY.plans.map((plan, i) => {
                        const isActive = i === currentStep;
                        const isDone = i < currentStep;
                        return (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                                <motion.div
                                    animate={{
                                        scale: isActive ? 1.05 : 1,
                                        borderColor: isActive ? 'var(--yellow)' : isDone ? 'var(--green)' : 'var(--border)',
                                        opacity: !(isActive || isDone) ? 0.3 : 1
                                    }}
                                    style={{
                                        width: '100%', maxWidth: 450, border: '3px solid var(--border)', borderRadius: '12px',
                                        padding: '0.75rem 1.25rem', background: isActive ? plan.color : isDone ? 'rgba(168,230,207,0.15)' : 'var(--white)',
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        boxShadow: isActive ? 'var(--shadow)' : 'none',
                                    }}>
                                    <div style={{ fontSize: '2rem', height: 48, width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>{plan.icon}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>{plan.name}</div>
                                        {isActive && <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.7, marginTop: '2px' }}>{plan.description}</div>}
                                    </div>
                                    {isDone && <span style={{ fontSize: '1.2rem' }}>✅</span>}
                                    {isActive && (
                                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                                            ⚡
                                        </motion.div>
                                    )}
                                </motion.div>

                                {i < QUERY.plans.length - 1 && (
                                    <div style={{ height: 20, width: 3, background: 'var(--border)', position: 'relative' }}>
                                        {isDone && (
                                            <motion.div
                                                initial={{ y: 0 }} animate={{ y: -20 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                                style={{ position: 'absolute', width: 10, height: 10, background: 'var(--green)', borderRadius: '50%', left: -3.5 }}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    const LEFT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', overflow: 'hidden' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Steps</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {QUERY.plans.map((p, i) => (
                    <div key={i} style={{
                        width: 24, height: 24, border: '2px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700,
                        background: i < currentStep ? 'var(--green)' : i === currentStep ? 'var(--yellow)' : 'var(--white)'
                    }}
                        onClick={() => { setCurrentStep(i); stepRef.current = i; setIsSimMode(true); setIsPaused(true); }}>
                        {i + 1}
                    </div>
                ))}
            </div>
            <div style={{ height: 2, background: 'var(--border)' }} />
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Phase</div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', background: curPlan?.color ?? 'var(--white)', border: '2px solid var(--border)', padding: '0.25rem 0.5rem', wordBreak: 'break-word' }}>
                {curPlan?.icon} {curPlan?.name ?? '—'}
            </div>
        </div>
    );

    const RIGHT = curPlan ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
                <motion.div key={currentStep} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.55, marginBottom: '0.3rem' }}>What Happened</div>
                    <div style={{ fontSize: '0.82rem', lineHeight: 1.55, borderLeft: '3px solid var(--yellow)', paddingLeft: '0.6rem' }}>{curPlan.description}</div>
                </motion.div>
            </AnimatePresence>
            <div style={{ height: 2, background: 'var(--border)' }} />
            <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.55, marginBottom: '0.3rem' }}>💡 Optimizer Insight</div>
                <div style={{ background: 'var(--yellow)', border: '2px solid var(--border)', padding: '0.5rem 0.6rem', fontSize: '0.78rem', lineHeight: 1.5 }}>{QUERY.insights[currentStep]}</div>
            </div>
            <div style={{ marginTop: 'auto', borderTop: '2px solid var(--border)', paddingTop: '0.4rem', fontSize: '0.72rem', opacity: 0.7 }}>
                Real databases (PostgreSQL, MySQL) use cost-based optimizers that consider table statistics, index availability, and memory.
            </div>
        </div>
    ) : null;

    const TL = QUERY.plans.map((p, i) => ({ id: i, label: p.name, done: i < currentStep, active: i === currentStep }));

    return (
        <ImmersiveLayout isActive={isSimMode} title="Query Execution Plan" icon="🔎" moduleLabel="DBMS Module"
            isRunning={isRunning} isPaused={isPaused} isFinished={isFinished} speed={speed} onSpeedChange={setSpeed}
            onStart={handleStart} onPause={handlePause} onResume={handleResume} onReset={handleReset} onStep={handleStep}
            currentStepNum={Math.max(0, currentStep + 1)} totalSteps={total}
            phaseName={curPlan?.name ?? ''} centerContent={CENTER} leftContent={LEFT} rightContent={RIGHT}
            timelineItems={TL} legend={[{ color: 'var(--cyan)', label: 'Logical' }, { color: 'var(--yellow)', label: 'Optimizing' }, { color: 'var(--green)', label: 'Done' }, { color: 'var(--pink)', label: 'Join Order' }]}>
            <div className="main-content">
                <div style={{ marginBottom: '0.4rem' }}><Link to="/dbms" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← DBMS Module</Link></div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="section-header">DBMS · Query Optimization</div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 700 }}>🔎 Query Execution Plan Simulator</h1>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '0.3rem' }}>Watch how a SQL query is transformed from raw SQL → logical plan → optimized physical plan → result.</p>
                </div>
                <div className="panel" style={{ marginBottom: '1.25rem' }}>
                    <div className="panel-header">📋 The Query</div>
                    <div style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', background: '#1a1a1a', color: '#a8e6cf', lineHeight: 1.7 }}>{QUERY.sql}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-yellow btn-lg" onClick={handleStart}>▶ Run Optimizer</button>
                    <button className="btn btn-sm" style={{ marginTop: '0.15rem' }} onClick={handleStep}>⏭ Step Through</button>
                </div>
            </div>
        </ImmersiveLayout>
    );
}
