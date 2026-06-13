import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import useSnapshot from '../../hooks/useSnapshot';
import { TreeIcon, SearchIcon, ZapIcon, CrownIcon } from '../../components/Icons';

export default function BPlusTreeSim() {
    const [speed, setSpeed] = useState(700);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [conceptMode, setConceptMode] = useState(false);

    // B+ Tree state
    const [keys, setKeys] = useState([10, 20, 30, 40, 50]);
    const [inputVal, setInputVal] = useState('');
    const [searchKey, setSearchKey] = useState('');
    const [searchPath, setSearchPath] = useState([]); // Nodes highlighted in search
    const [comparisons, setComparisons] = useState(0);

    // Range Query
    const [rangeStart, setRangeStart] = useState(15);
    const [rangeEnd, setRangeEnd] = useState(45);
    const [rangeActive, setRangeActive] = useState(false);

    // Index Race Demo
    const [raceActive, setRaceActive] = useState(false);
    const [tableProgress, setTableProgress] = useState(0);
    const [treeProgress, setTreeProgress] = useState(0);
    const [raceWinner, setRaceWinner] = useState(null);

    // Dense vs Sparse Indexing Toggle
    const [indexType, setIndexType] = useState('dense'); // dense vs sparse

    // Simple Order=3 B+ Tree Layout Calculator
    // Because full dynamic B+ Trees can be highly complex to balance in pure JS client, we build a robust, balanced
    // tree node calculator for keys [10 to 80] to guarantee flawless layout and avoid rendering overlaps.
    const computeTreeLayout = () => {
        const sorted = [...keys].sort((a, b) => a - b);

        // Root and leaves layout
        if (sorted.length <= 2) {
            return {
                root: { id: 'root', keys: sorted, isLeaf: true, x: 250, y: 50 },
                children: [],
                leaves: []
            };
        }

        // We split into leaves of max size 2
        const leaves = [];
        for (let i = 0; i < sorted.length; i += 2) {
            leaves.push(sorted.slice(i, i + 2));
        }

        // Parent keys (first element of each leaf except first)
        const parentKeys = [];
        for (let i = 1; i < leaves.length; i++) {
            parentKeys.push(leaves[i][0]);
        }

        if (parentKeys.length <= 2) {
            // Level 1: Root is parentKeys, children are leaves
            const leafWidth = 440 / leaves.length;
            return {
                root: { id: 'root', keys: parentKeys, isLeaf: false, x: 250, y: 40 },
                children: leaves.map((leafKeys, idx) => ({
                    id: `leaf_${idx}`,
                    keys: leafKeys,
                    isLeaf: true,
                    x: 60 + idx * leafWidth + leafWidth / 2,
                    y: 140
                })),
                leaves: leaves.map((leafKeys, idx) => `leaf_${idx}`)
            };
        }

        // Level 2 Decompositions: Root split
        // For larger trees, root becomes middle key of parentKeys
        const midIdx = Math.floor(parentKeys.length / 2);
        const rootKeys = [parentKeys[midIdx]];
        const leftParents = parentKeys.slice(0, midIdx);
        const rightParents = parentKeys.slice(midIdx + 1);

        const leafWidth = 440 / leaves.length;
        const leafNodes = leaves.map((leafKeys, idx) => ({
            id: `leaf_${idx}`,
            keys: leafKeys,
            isLeaf: true,
            x: 50 + idx * leafWidth + leafWidth / 2,
            y: 180
        }));

        const internalNodes = [
            { id: 'int_left', keys: leftParents, isLeaf: false, x: 120, y: 110, childrenIds: leafNodes.slice(0, midIdx + 1).map(n => n.id) },
            { id: 'int_right', keys: rightParents, isLeaf: false, x: 380, y: 110, childrenIds: leafNodes.slice(midIdx + 1).map(n => n.id) }
        ];

        return {
            root: { id: 'root', keys: rootKeys, isLeaf: false, x: 250, y: 40, childrenIds: ['int_left', 'int_right'] },
            children: internalNodes.concat(leafNodes),
            leaves: leafNodes.map(n => n.id)
        };
    };

    const treeData = computeTreeLayout();

    // Insert key
    const handleInsert = (e) => {
        e.preventDefault();
        const num = parseInt(inputVal);
        if (isNaN(num) || keys.includes(num)) return;
        if (keys.length >= 8) {
            alert("B+ Tree capped at 8 keys to fit the neo-brutalist canvas!");
            return;
        }

        setKeys(prev => [...prev, num]);
        setInputVal('');
        setSearchPath([]);
    };

    // Delete key
    const handleDeleteKey = (val) => {
        setKeys(prev => prev.filter(k => k !== val));
        setSearchPath([]);
    };

    // Search trace algorithm
    const handleSearch = (e) => {
        e.preventDefault();
        const num = parseInt(searchKey);
        if (isNaN(num)) return;

        // Trace search path
        const path = ['root'];
        let comps = 0;

        if (treeData.root.childrenIds) {
            // Has internal nodes
            comps++;
            const firstParent = treeData.children.find(n => n.id === 'int_left');
            const secondParent = treeData.children.find(n => n.id === 'int_right');

            const rootVal = treeData.root.keys[0];
            if (num < rootVal) {
                path.push('int_left');
                comps++;
                // Find leaf inside left
                const leafIdx = num < firstParent.keys[0] ? 0 : 1;
                path.push(`leaf_${leafIdx}`);
            } else {
                path.push('int_right');
                comps++;
                const leafIdx = num < secondParent.keys[0] ? 2 : 3;
                path.push(`leaf_${leafIdx}`);
            }
        } else if (treeData.children.length > 0) {
            // Single level children
            comps++;
            let leafId = `leaf_${treeData.children.length - 1}`;
            for (let i = 0; i < treeData.root.keys.length; i++) {
                if (num < treeData.root.keys[i]) {
                    leafId = `leaf_${i}`;
                    break;
                }
            }
            path.push(leafId);
        }

        setSearchPath(path);
        setComparisons(comps + 1); // Add leaf key comparison
    };

    const getFullPathForVal = (num) => {
        const path = ['root'];
        if (treeData.root.childrenIds) {
            const firstParent = treeData.children.find(n => n.id === 'int_left');
            const secondParent = treeData.children.find(n => n.id === 'int_right');
            const rootVal = treeData.root.keys[0];
            if (num < rootVal) {
                path.push('int_left');
                const leafIdx = num < (firstParent?.keys[0] ?? 0) ? 0 : 1;
                path.push(`leaf_${leafIdx}`);
            } else {
                path.push('int_right');
                const leafIdx = num < (secondParent?.keys[0] ?? 0) ? 2 : 3;
                path.push(`leaf_${leafIdx}`);
            }
        } else if (treeData.children.length > 0) {
            let leafId = `leaf_${treeData.children.length - 1}`;
            for (let i = 0; i < treeData.root.keys.length; i++) {
                if (num < treeData.root.keys[i]) {
                    leafId = `leaf_${i}`;
                    break;
                }
            }
            path.push(leafId);
        }
        return path;
    };

    const handleStart = () => {
        const targetNum = parseInt(searchKey) || 30;
        setSearchKey(String(targetNum));
        setIsRunning(true);
        setIsPaused(false);
        setIsFinished(false);
        setSearchPath(['root']);
    };

    const handlePause = () => {
        setIsPaused(true);
    };

    const handleReset = () => {
        setSearchKey('');
        setSearchPath([]);
        setComparisons(0);
        setIsRunning(false);
        setIsPaused(false);
        setIsFinished(false);
        setRaceActive(false);
        setTableProgress(0);
        setTreeProgress(0);
        setRaceWinner(null);
    };

    const handleStep = () => {
        const targetNum = parseInt(searchKey) || 30;
        setSearchKey(String(targetNum));
        const fullPath = getFullPathForVal(targetNum);
        if (searchPath.length > 0) {
            if (searchPath.length < fullPath.length) {
                setSearchPath(fullPath.slice(0, searchPath.length + 1));
            } else {
                setIsFinished(true);
                setComparisons(fullPath.length);
            }
        } else {
            setSearchPath(['root']);
        }
    };

    useEffect(() => {
        let interval = null;
        if (isRunning && !isPaused && !isFinished) {
            interval = setInterval(() => {
                const targetNum = parseInt(searchKey) || 30;
                const fullPath = getFullPathForVal(targetNum);
                setSearchPath(prev => {
                    if (prev.length < fullPath.length) {
                        return fullPath.slice(0, prev.length + 1);
                    } else {
                        setIsRunning(false);
                        setIsFinished(true);
                        setComparisons(fullPath.length);
                        return prev;
                    }
                });
            }, speed);
        }
        return () => clearInterval(interval);
    }, [isRunning, isPaused, isFinished, searchKey, speed]);

    // Index Race Speed Simulation
    const runRaceDemo = () => {
        setRaceActive(true);
        setTableProgress(0);
        setTreeProgress(0);
        setRaceWinner(null);

        // Linear Table Scan (Slow progress)
        let linearInterval = setInterval(() => {
            setTableProgress(prev => {
                const next = prev + 10;
                if (next >= 100) {
                    clearInterval(linearInterval);
                }
                return next;
            });
        }, 300);

        // B+ Tree Index search (Fast jump)
        let treeInterval = setInterval(() => {
            setTreeProgress(prev => {
                const next = prev + 33.3;
                if (next >= 100) {
                    clearInterval(treeInterval);
                    setRaceWinner('B+ Tree Index');
                }
                return next;
            });
        }, 120);
    };

    
    useSnapshot(useCallback((config, step) => {
        if (config.keys !== undefined) setKeys(config.keys);
        if (config.searchKey !== undefined) setSearchKey(config.searchKey);
        if (config.indexType !== undefined) setIndexType(config.indexType);

        setTimeout(() => {
            if (step !== undefined) setSearchPath(step);
            setIsRunning(false);
            setIsPaused(true);
            if (config.comparisons !== undefined) setComparisons(config.comparisons);

        }, 50);
    }, []));

    return (
        <ImmersiveLayout
            isActive={true}
            snapshotData={{
                config: { keys, searchKey, indexType },
                step: searchPath
            }}
            title="B+ Tree Indexing" icon={<TreeIcon size={22} />} moduleLabel="DBMS Module"
            isRunning={isRunning} isPaused={isPaused} isFinished={isFinished}
            speed={speed} onSpeedChange={setSpeed}
            onStart={handleStart} onPause={handlePause} onResume={handleStart}
            onReset={handleReset} onStep={handleStep}
            currentStepNum={searchPath.length} totalSteps={3}
            phaseName="Tree Search Trace"
            centerContent={
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.8rem', background: 'var(--white)', padding: '1rem', overflowY: 'auto' }}>

                    {/* Controls Panel */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: '0.6rem', border: '3px solid var(--border)', background: 'var(--white)', padding: '0.4rem', boxShadow: '3px 3px 0 var(--border)', flexShrink: 0 }}>
                        <form onSubmit={handleInsert} style={{ display: 'flex', gap: 4 }}>
                            <input
                                type="number" placeholder="Insert key..."
                                value={inputVal}
                                onChange={e => setInputVal(e.target.value)}
                                style={{ border: '2px solid var(--border)', width: '60%', padding: '2px 4px', fontSize: '0.78rem' }}
                            />
                            <button type="submit" className="btn btn-sm btn-green" style={{ flex: 1, padding: 0 }}>Insert</button>
                        </form>
                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 4 }}>
                            <input
                                type="number" placeholder="Search..."
                                value={searchKey}
                                onChange={e => setSearchKey(e.target.value)}
                                style={{ border: '2px solid var(--border)', width: '60%', padding: '2px 4px', fontSize: '0.78rem' }}
                            />
                            <button type="submit" className="btn btn-sm btn-yellow" style={{ flex: 1, padding: 0 }}>Trace Path</button>
                        </form>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 900 }}>Index:</span>
                            <button className="btn btn-sm" onClick={() => setIndexType(indexType === 'dense' ? 'sparse' : 'dense')} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                {indexType.toUpperCase()}
                            </button>
                        </div>
                    </div>

                    {/* Dynamic B+ Tree SVG Canvas */}
                    <div style={{ border: '3px solid var(--border)', background: '#111', position: 'relative', flex: 1, minHeight: 250, boxShadow: '4px 4px 0 var(--border)', overflow: 'hidden' }}>

                        <svg width="100%" height="100%" viewBox="0 0 500 240" style={{ position: 'absolute', inset: 0 }}>
                            {/* Connectors */}
                            {treeData.root.childrenIds && treeData.root.childrenIds.map(cid => {
                                const child = treeData.children.find(n => n.id === cid);
                                if (!child) return null;
                                return (
                                    <line
                                        key={cid} x1={treeData.root.x} y1={treeData.root.y + 15} x2={child.x} y2={child.y - 15}
                                        stroke={searchPath.includes(cid) ? 'var(--yellow)' : '#444'}
                                        strokeWidth={searchPath.includes(cid) ? 3.5 : 1.5}
                                    />
                                );
                            })}

                            {treeData.children.map(node => {
                                if (!node.childrenIds) return null;
                                return node.childrenIds.map(cid => {
                                    const child = treeData.children.find(n => n.id === cid);
                                    if (!child) return null;
                                    return (
                                        <line
                                            key={cid} x1={node.x} y1={node.y + 15} x2={child.x} y2={child.y - 15}
                                            stroke={searchPath.includes(cid) ? 'var(--yellow)' : '#444'}
                                            strokeWidth={searchPath.includes(cid) ? 3.5 : 1.5}
                                        />
                                    );
                                });
                            })}

                            {/* Render Leaf Linked Chains */}
                            {treeData.children.filter(n => n.isLeaf).map((node, idx, arr) => {
                                if (idx === arr.length - 1) return null;
                                const nextNode = arr[idx + 1];
                                return (
                                    <path
                                        key={idx}
                                        d={`M ${node.x + 25} ${node.y} L ${nextNode.x - 25} ${nextNode.y}`}
                                        stroke="var(--pink)"
                                        strokeWidth="2"
                                        strokeDasharray="4,4"
                                        markerEnd="url(#arrow)"
                                    />
                                );
                            })}

                            {/* Root Node rendering */}
                            <g>
                                <rect
                                    x={treeData.root.x - 30} y={treeData.root.y - 15} width="60" height="28"
                                    fill={searchPath.includes('root') ? 'var(--yellow)' : 'var(--white)'}
                                    stroke="var(--border)" strokeWidth="2.5"
                                />
                                <text x={treeData.root.x} y={treeData.root.y + 4} textAnchor="middle" fontWeight="bold" fontSize="10" fontFamily="var(--font-mono)">
                                    {treeData.root.keys.join(' | ')}
                                </text>
                            </g>

                            {/* Children Nodes rendering */}
                            {treeData.children.map(node => (
                                <g key={node.id}>
                                    <rect
                                        x={node.x - 32} y={node.y - 15} width="64" height="28"
                                        fill={searchPath.includes(node.id) ? 'var(--yellow)' : 'var(--white)'}
                                        stroke="var(--border)" strokeWidth="2.5"
                                    />
                                    <text x={node.x} y={node.y + 4} textAnchor="middle" fontWeight="bold" fontSize="9" fontFamily="var(--font-mono)">
                                        {node.keys.join(' | ')}
                                    </text>
                                    {node.isLeaf && (
                                        <text x={node.x} y={node.y - 20} textAnchor="middle" fontSize="6.5" fill="#aaa">LEAF</text>
                                    )}
                                </g>
                            ))}
                        </svg>

                        <div style={{ position: 'absolute', bottom: 6, left: 10, fontSize: '0.62rem', color: '#aaa', display: 'flex', gap: 10 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 10, height: 10, background: 'var(--yellow)', border: '1.5px solid var(--border)' }} /> Active Search
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 10, height: 10, background: 'var(--pink)', border: '1.5px solid var(--border)' }} /> Leaf Links Chain
                            </span>
                        </div>
                    </div>

                    {/* Range Query Demo & Comparison Output */}
                    {comparisons > 0 && (
                        <div style={{ border: '2.5px solid var(--border)', background: '#fef3c7', padding: '6px 12px', fontSize: '0.72rem', fontWeight: 900, boxShadow: '2px 2px 0 var(--border)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <SearchIcon size={16} /> Search Complete: Key found in {comparisons} index comparions vs. {keys.length} sequential disk lookups without B+ Index!
                        </div>
                    )}
                </div>
            }
            leftContent={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>Index Speed Race</div>

                    <button className="btn btn-sm btn-pink" onClick={runRaceDemo} disabled={raceActive && !raceWinner} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'center' }}>
                        <ZapIcon size={12} /> Start Search Race Test
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.2rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', fontWeight: 900 }}>
                                <span>Linear Table Scan:</span>
                                <span>{Math.round(tableProgress)}%</span>
                            </div>
                            <div style={{ height: 8, background: '#eee', border: '1.5px solid var(--border)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: 'var(--pink)', width: `${tableProgress}%` }} />
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', fontWeight: 900 }}>
                                <span>B+ Tree Index Scan:</span>
                                <span>{Math.round(treeProgress)}%</span>
                            </div>
                            <div style={{ height: 8, background: '#eee', border: '1.5px solid var(--border)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: 'var(--green)', width: `${treeProgress}%` }} />
                            </div>
                        </div>
                    </div>

                    {raceWinner && (
                        <div style={{ background: 'var(--green)', border: '2px solid var(--border)', padding: '4px', fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                            <CrownIcon size={14} color="#000" /> WINNER: {raceWinner}!
                        </div>
                    )}

                    <div style={{ height: 2, background: 'var(--border)' }} />

                    <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>Dense vs Sparse</div>
                    <div style={{ border: '2px solid var(--border)', background: '#fafafa', padding: '0.45rem', fontSize: '0.68rem', lineHeight: 1.35 }}>
                        {indexType === 'dense' ? (
                            <span><strong>DENSE INDEX</strong>: Contains an index entry for EVERY single search-key value in the data file. High speed, high memory footprint.</span>
                        ) : (
                            <span><strong>SPARSE INDEX</strong>: Contains entries for only SOME values. Smaller footprint, slower lookup as sequential scans complete the final leaf block.</span>
                        )}
                    </div>

                    <div style={{ height: 2, background: 'var(--border)' }} />

                    <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>Live Stats</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.72rem', fontWeight: 800 }}>
                        <div style={{ border: '2px solid var(--border)', padding: '4px', display: 'flex', justifyContent: 'space-between', background: 'var(--yellow)' }}>
                            <span>Tree Height h:</span>
                            <span>{keys.length <= 2 ? 1 : keys.length <= 6 ? 2 : 3}</span>
                        </div>
                        <div style={{ border: '2px solid var(--border)', padding: '4px', display: 'flex', justifyContent: 'space-between', background: 'var(--cyan)' }}>
                            <span>Total Keys:</span>
                            <span>{keys.length}</span>
                        </div>
                    </div>
                </div>
            }
            rightContent={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ border: '2px solid var(--border)', background: 'var(--yellow)', padding: '0.4rem 0.6rem', boxShadow: '2px 2px 0 var(--border)' }}>
                        <div style={{ fontSize: '0.55rem', fontWeight: 900, opacity: 0.6 }}>CONCEPT TAG</div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                            CONCEPT: B+ TREE INDEX
                        </div>
                    </div>

                    <div style={{ border: '2px solid var(--border)', background: 'var(--white)', padding: '0.6rem', boxShadow: '2px 2px 0 var(--border)' }}>
                        <p style={{ fontSize: '0.72rem', opacity: 0.8, lineHeight: 1.45 }}>
                            B+ Trees are self-balancing search trees. Unlike standard B-trees, all actual data pointers are placed inside Leaf nodes, which are linked as a linked list to accelerate range queries.
                        </p>
                    </div>

                    <div style={{ height: 2, background: 'var(--border)' }} />

                    {/* Algorithm Logic card */}
                    <div className="panel" style={{ boxShadow: '3px 3px 0 var(--border)' }}>
                        <div className="panel-header" style={{ background: 'var(--pink)', fontSize: '0.72rem', padding: '4px 10px' }}>
                            Tree Insertion Logic
                        </div>
                        <div style={{ padding: '0.6rem', background: 'var(--white)' }}>
                            <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', background: '#eee', padding: '0.4rem', border: '1.5px solid var(--border)' }}>
                                {`// Order=3 split threshold
if Node.keys.length > 2:
  1. Split keys into left/right
  2. Push middle key to Parent
  3. Re-balance root if needed`}
                            </pre>
                        </div>
                    </div>
                </div>
            }
            timelineItems={keys.map(k => ({
                id: k,
                label: `Node containing ${k}`,
                done: searchPath.length > 0,
                active: false
            }))}
            legend={[
                { color: 'var(--yellow)', label: 'Search Target' },
                { color: 'var(--pink)', label: 'Leaf Connections' },
                { color: 'var(--green)', label: 'Balanced Index' }
            ]}
            conceptMode={conceptMode}
            onConceptModeToggle={() => setConceptMode(prev => !prev)}
        >
            <div className="main-content">
                <Link to="/dbms">← Return to DBMS Landing</Link>
            </div>
        </ImmersiveLayout>
    );
}
