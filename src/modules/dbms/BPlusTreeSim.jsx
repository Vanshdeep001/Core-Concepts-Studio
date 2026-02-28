import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';

const MAX_KEYS = 3; // B+ tree of order 4

// === Minimal B+ Tree engine ===
class BPlusNode {
    constructor(isLeaf = false) {
        this.keys = []; this.children = []; this.isLeaf = isLeaf; this.next = null;
        this.id = Math.random().toString(36).slice(2, 8);
    }
}

function nodeToObj(node, depth = 0) {
    if (!node) return null;
    return { id: node.id, keys: [...node.keys], isLeaf: node.isLeaf, depth, children: node.children.map(c => nodeToObj(c, depth + 1)) };
}

function insertBPlusSteps(values) {
    const steps = [];
    const tree = { root: new BPlusNode(true) };

    function insertLeaf(node, key) {
        let i = 0; while (i < node.keys.length && node.keys[i] < key) i++;
        node.keys.splice(i, 0, key);
    }
    function splitChild(parent, i) {
        const full = parent.children[i]; const mid = Math.floor(full.keys.length / 2);
        const right = new BPlusNode(full.isLeaf);
        if (full.isLeaf) { right.keys = full.keys.splice(mid); right.next = full.next; full.next = right; parent.keys.splice(i, 0, right.keys[0]); }
        else { parent.keys.splice(i, 0, full.keys.splice(mid, 1)[0]); right.children = full.children.splice(mid + 1); right.keys = full.keys.splice(mid); }
        parent.children.splice(i + 1, 0, right);
    }
    function insertNonFull(node, key) {
        if (node.isLeaf) { insertLeaf(node, key); }
        else {
            let i = node.keys.length - 1;
            while (i >= 0 && key < node.keys[i]) i--;
            i++;
            if (node.children[i].keys.length >= MAX_KEYS) { splitChild(node, i); if (key > node.keys[i]) i++; }
            insertNonFull(node.children[i], key);
        }
    }

    for (const val of values) {
        steps.push({ phase: `Insert ${val} (before)`, val, tree: nodeToObj(tree.root), inserting: true, explanation: `About to insert key ${val} into the B+ Tree. Traversing from root to find the correct leaf node.`, insight: 'B+ Trees keep keys sorted within nodes. Leaf nodes hold actual data; internal nodes are just routing keys.', insightTitle: 'B+ Tree Structure' });
        if (tree.root.keys.length >= MAX_KEYS) {
            const newRoot = new BPlusNode(false); newRoot.children.push(tree.root); splitChild(newRoot, 0); tree.root = newRoot;
        }
        insertNonFull(tree.root, val);
        steps.push({ phase: `Inserted ${val}`, val, tree: nodeToObj(tree.root), done: true, explanation: `Key ${val} inserted. ${tree.root.keys.length > 0 ? `Root now has keys [${tree.root.keys.join(', ')}].` : 'Tree structure updated.'}`, insight: 'After insertion, if a node overflows (>max-1 keys), it splits: median key is promoted to parent. Root splits create a new root (tree grows taller).', insightTitle: 'Node Splitting' });
    }

    steps.push({ phase: '✅ All keys inserted', tree: nodeToObj(tree.root), final: true, explanation: 'All keys inserted. The B+ Tree is balanced — all leaves are at the same depth.', insight: 'B+ Trees are always balanced (O(log n) search/insert). Leaf nodes form a linked list for efficient range queries.', insightTitle: 'Why B+ Trees?' });

    return steps;
}

function renderNode(node, highlight) {
    if (!node) return null;
    const isHighlighted = highlight && node.keys.some(k => highlight.includes(k));
    return (
        <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
            <motion.div layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                style={{ border: `3px solid var(--border)`, background: isHighlighted ? 'var(--yellow)' : node.isLeaf ? 'var(--cyan)' : 'var(--white)', boxShadow: isHighlighted ? 'var(--shadow)' : 'var(--shadow-sm)', display: 'flex', gap: 0 }}>
                {node.keys.map((k, i) => (
                    <div key={i} style={{ borderRight: i < node.keys.length - 1 ? '2px solid var(--border)' : 'none', padding: '0.3rem 0.5rem', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', minWidth: 28, textAlign: 'center' }}>{k}</div>
                ))}
            </motion.div>
            {!node.isLeaf && node.children.length > 0 && (
                <div style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
                    {node.children.map(child => renderNode(child, highlight))}
                </div>
            )}
        </div>
    );
}

export default function BPlusTreeSim() {
    const [input, setInput] = useState('10 20 5 30 15 25 3 7');
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
        const vals = input.trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
        const s = insertBPlusSteps(vals);
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
    const vals = input.trim().split(/\s+/).map(Number).filter(n => !isNaN(n));

    const CENTER = (
        <div style={{ padding: '0.75rem', height: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', overflow: 'auto' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.2rem' }}>
                B+ Tree (Order 4, max {MAX_KEYS} keys/node)
                <span style={{ marginLeft: '0.5rem', background: 'var(--cyan)', padding: '0.05rem 0.4rem', border: '1.5px solid var(--border)', fontSize: '0.6rem', fontWeight: 700 }}>Leaf</span>
                <span style={{ marginLeft: '0.25rem', background: 'var(--white)', padding: '0.05rem 0.4rem', border: '1.5px solid var(--border)', fontSize: '0.6rem', fontWeight: 700 }}>Internal</span>
            </div>
            {curStep?.tree ? (
                <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '0.5rem' }}>
                    {renderNode(curStep.tree, curStep.val ? [curStep.val] : null)}
                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.35, fontSize: '0.9rem' }}>Tree will appear here</div>
            )}
            {curStep && (
                <AnimatePresence mode="wait">
                    <motion.div key={currentStep} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        style={{ padding: '0.5rem 0.75rem', border: '3px solid var(--border)', fontWeight: 700, fontSize: '0.88rem', flexShrink: 0, background: curStep.inserting ? 'var(--yellow)' : curStep.done ? 'var(--green)' : curStep.final ? 'var(--green)' : 'var(--white)' }}>
                        {curStep.inserting ? `⏳ Inserting ${curStep.val}…` : curStep.done ? `✅ ${curStep.val} inserted` : '✅ Complete'}
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );

    const LEFT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', overflow: 'hidden' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Insertion Queue</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {vals.map((v, i) => {
                    const insertedAt = steps.findIndex(s => s.done && s.val === v);
                    const isDone = currentStep >= insertedAt && insertedAt >= 0;
                    const isCur = curStep?.val === v;
                    return <div key={i} style={{ width: 28, height: 28, border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.72rem', background: isCur ? 'var(--yellow)' : isDone ? 'var(--green)' : 'var(--white)' }}>{v}</div>;
                })}
            </div>
            <div style={{ height: 2, background: 'var(--border)' }} />
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>Current Insert</div>
            <div style={{ fontWeight: 700, fontSize: '1.5rem', fontFamily: 'var(--font-mono)', background: 'var(--yellow)', border: '2px solid var(--border)', padding: '0.25rem 0.5rem', width: 'fit-content' }}>{curStep?.val ?? '—'}</div>
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
            <div style={{ marginTop: 'auto', borderTop: '2px solid var(--border)', paddingTop: '0.4rem', fontSize: '0.72rem', opacity: 0.7 }}>
                Time complexity: Search O(log n), Insert O(log n). Used by: MySQL InnoDB, PostgreSQL, MongoDB indexes.
            </div>
        </div>
    ) : null;

    const TL = vals.map((v, i) => ({ id: i, label: `${v}`, done: steps.some((s, si) => s.done && s.val === v && si <= currentStep), active: curStep?.val === v }));

    return (
        <ImmersiveLayout isActive={isSimMode} title="B+ Tree Index" icon="🌳" moduleLabel="DBMS Module"
            isRunning={isRunning} isPaused={isPaused} isFinished={isFinished} speed={speed} onSpeedChange={setSpeed}
            onStart={handleStart} onPause={handlePause} onResume={handleResume} onReset={handleReset} onStep={handleStep}
            currentStepNum={Math.max(0, currentStep + 1)} totalSteps={steps.length}
            phaseName={curStep?.phase ?? ''} centerContent={CENTER} leftContent={LEFT} rightContent={RIGHT}
            timelineItems={TL} legend={[{ color: 'var(--cyan)', label: 'Leaf Node' }, { color: 'var(--white)', label: 'Internal Node' }, { color: 'var(--yellow)', label: 'Inserting' }]}>
            <div className="main-content">
                <div style={{ marginBottom: '0.4rem' }}><Link to="/dbms" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← DBMS Module</Link></div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="section-header">DBMS · Index Structures</div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 700 }}>🌳 B+ Tree Index Simulator</h1>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '0.3rem' }}>Enter keys and watch them build a balanced B+ Tree with animated node splits.</p>
                </div>
                <div className="panel" style={{ marginBottom: '1.25rem' }}>
                    <div className="panel-header">⚙ Configuration</div>
                    <div style={{ padding: '1rem' }}>
                        <label className="form-label">Keys to Insert (space separated)</label>
                        <input className="form-input" value={input} onChange={e => setInput(e.target.value)} />
                        <div style={{ fontSize: '0.78rem', opacity: 0.6, marginTop: '0.3rem' }}>Tree order: 4 (max 3 keys per node before splitting)</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-yellow btn-lg" onClick={handleStart}>▶ Build Tree</button>
                    <button className="btn btn-sm" style={{ marginTop: '0.15rem' }} onClick={handleStep}>⏭ Step Through</button>
                </div>
            </div>
        </ImmersiveLayout>
    );
}
