// CommitGraph.jsx — SVG DAG visualizer for Git commits
import { motion, AnimatePresence } from 'framer-motion';
import { computeDAGLayout } from './engine/gitEngine';

const BRANCH_COLORS = ['#ffd93d', '#66d9ef', '#ff6b9d', '#a8e6cf', '#c3aed6', '#ffb347', '#87ceeb'];
const NODE_W = 120;
const NODE_H = 54;

function getBranchColor(name, index) {
    if (name === 'main' || name === 'master') return '#ffd93d';
    if (name.startsWith('origin/')) return '#c3aed6';
    return BRANCH_COLORS[(index + 1) % BRANCH_COLORS.length];
}

export default function CommitGraph({ commits, branches, HEAD, remote, orphanedHashes = [], highlightHash = null }) {
    const { nodes, edges, headHash } = computeDAGLayout(commits, branches, HEAD, remote);

    if (!nodes.length) {
        return (
            <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: '1rem', opacity: 0.4, padding: '2rem',
            }}>
                <div style={{ fontSize: '3rem' }}>🌿</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', textAlign: 'center' }}>
                    No commits yet
                </div>
                <div style={{ fontSize: '0.82rem', textAlign: 'center' }}>
                    Run <code style={{ background: '#eee', padding: '0.1rem 0.3rem', borderRadius: 4 }}>git init</code> then start making commits to see the DAG
                </div>
            </div>
        );
    }

    // Compute canvas size
    const maxX = Math.max(...nodes.map(n => n.x + n.width), 400);
    const maxY = Math.max(...nodes.map(n => n.y + n.height), 200);
    const canvasW = maxX + 80;
    const canvasH = maxY + 120;

    // Branch color map
    const branchColorMap = {};
    Object.keys(branches).forEach((name, i) => {
        branchColorMap[name] = getBranchColor(name, i);
    });

    const headBranch = HEAD.type === 'branch' ? HEAD.ref : null;

    return (
        <div style={{ flex: 1, overflow: 'auto', padding: '1rem', background: 'var(--bg)' }}>
            <svg
                width={canvasW}
                height={canvasH}
                style={{ display: 'block', minWidth: '100%' }}
            >
                {/* Arrow defs */}
                <defs>
                    <style>{`
                        @keyframes git-pulse {
                            0%   { r: 34; opacity: 0.9; }
                            100% { r: 56; opacity: 0; }
                        }
                    `}</style>
                    <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L8,3 z" fill="var(--border)" />
                    </marker>
                    <marker id="arrow-merge" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L8,3 z" fill="#ff6b9d" />
                    </marker>
                    <marker id="arrow-rebase" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L8,3 z" fill="#66d9ef" />
                    </marker>
                </defs>

                {/* Edges */}
                {edges.map((edge, i) => {
                    const fromNode = nodes.find(n => n.id === edge.from);
                    const toNode = nodes.find(n => n.id === edge.to);
                    if (!fromNode || !toNode) return null;

                    const x1 = fromNode.x + NODE_W / 2;
                    const y1 = fromNode.y + NODE_H / 2;
                    const x2 = toNode.x + NODE_W / 2;
                    const y2 = toNode.y + NODE_H / 2;

                    const isMerge = edge.isMergeEdge;
                    const isRebase = fromNode.commit?.isRebase;

                    // Curved path for non-linear edges
                    const midX = (x1 + x2) / 2;
                    const midY = (y1 + y2) / 2;
                    const dx = x2 - x1;
                    const dy = y2 - y1;
                    const curveOffset = (isMerge && dy === 0) ? -40 : 0;

                    const pathD = curveOffset !== 0
                        ? `M${x1},${y1} Q${midX},${midY + curveOffset} ${x2},${y2}`
                        : `M${x1},${y1} L${x2},${y2}`;

                    return (
                        <path
                            key={i}
                            d={pathD}
                            stroke={isMerge ? '#ff6b9d' : isRebase ? '#66d9ef' : 'var(--border)'}
                            strokeWidth={isMerge ? 2.5 : 2}
                            strokeDasharray={isRebase ? '6 3' : 'none'}
                            fill="none"
                            markerEnd={`url(#arrow${isMerge ? '-merge' : isRebase ? '-rebase' : ''})`}
                            opacity={orphanedHashes.includes(edge.from) ? 0.2 : 1}
                        />
                    );
                })}

                {/* Nodes */}
                <AnimatePresence>
                    {nodes.map((node) => {
                        const isOrphaned = orphanedHashes.includes(node.id);
                        const isHEAD = node.id === headHash;
                        const isHighlighted = node.id === highlightHash;
                        const cx = node.x + NODE_W / 2;
                        const cy = node.y + NODE_H / 2;

                        return (
                            <motion.g
                                key={node.id}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{
                                    opacity: isOrphaned ? 0.2 : 1,
                                    scale: isHighlighted ? 1.06 : 1,
                                }}
                                exit={{ opacity: 0, scale: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                {/* Pulse ring for newly created nodes */}
                                {isHighlighted && (
                                    <>
                                        <circle cx={cx} cy={cy} r={38} fill="none" stroke="#ffd93d" strokeWidth={3} opacity={0.8}
                                            style={{ animation: 'git-pulse 1s ease-out infinite' }} />
                                        <circle cx={cx} cy={cy} r={48} fill="none" stroke="#ffd93d" strokeWidth={1.5} opacity={0.4}
                                            style={{ animation: 'git-pulse 1s ease-out 0.3s infinite' }} />
                                    </>
                                )}
                                {/* Commit node box */}
                                <rect
                                    x={node.x}
                                    y={node.y}
                                    width={NODE_W}
                                    height={NODE_H}
                                    rx={8}
                                    fill={node.isMerge ? '#ffe0f0' : node.isRebase ? '#e0f7ff' : 'var(--white)'}
                                    stroke={isHEAD ? '#000' : 'var(--border)'}
                                    strokeWidth={isHEAD ? 3 : 2}
                                    style={{ filter: isHighlighted ? 'drop-shadow(0 0 8px rgba(255, 217, 61, 0.8))' : 'none' }}
                                />

                                {/* Commit hash */}
                                <text
                                    x={node.x + NODE_W / 2}
                                    y={node.y + 16}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fontFamily="monospace"
                                    fontWeight="700"
                                    fill="#666"
                                >
                                    {node.commit.shortHash}
                                    {node.isMerge ? ' ⊕' : ''}
                                    {node.isRebase ? ' ↺' : ''}
                                </text>

                                {/* Commit message */}
                                <text
                                    x={node.x + NODE_W / 2}
                                    y={node.y + 32}
                                    textAnchor="middle"
                                    fontSize="11"
                                    fontFamily="sans-serif"
                                    fontWeight="600"
                                    fill="var(--text)"
                                >
                                    {node.commit.message.slice(0, 14)}{node.commit.message.length > 14 ? '…' : ''}
                                </text>

                                {/* Timestamp */}
                                <text
                                    x={node.x + NODE_W / 2}
                                    y={node.y + 47}
                                    textAnchor="middle"
                                    fontSize="9"
                                    fill="#999"
                                >
                                    {node.commit.timestamp?.slice(11) || ''}
                                </text>

                                {/* Branch labels */}
                                {node.branchLabels.map((bl, bi) => {
                                    const color = branchColorMap[bl.name] || '#c3aed6';
                                    const isRemote = bl.type === 'remote';
                                    const labelY = node.y - 20 - bi * 22;
                                    const approxWidth = Math.max(bl.name.length * 7 + 16, 60);
                                    const labelX = node.x + NODE_W / 2 - approxWidth / 2;

                                    return (
                                        <g key={bi}>
                                            <rect
                                                x={labelX}
                                                y={labelY - 12}
                                                width={approxWidth}
                                                height={18}
                                                rx={4}
                                                fill={color}
                                                stroke="var(--border)"
                                                strokeWidth={isRemote ? 1.5 : 2}
                                                strokeDasharray={isRemote ? '4 2' : 'none'}
                                            />
                                            <text
                                                x={labelX + approxWidth / 2}
                                                y={labelY + 1}
                                                textAnchor="middle"
                                                fontSize="10"
                                                fontWeight="800"
                                                fontFamily="monospace"
                                                fill="#222"
                                            >
                                                {bl.name}
                                            </text>
                                            {/* connector line */}
                                            <line
                                                x1={node.x + NODE_W / 2}
                                                y1={labelY + 6}
                                                x2={node.x + NODE_W / 2}
                                                y2={node.y}
                                                stroke="var(--border)"
                                                strokeWidth={1.5}
                                                strokeDasharray="3 2"
                                            />
                                        </g>
                                    );
                                })}

                                {/* HEAD indicator */}
                                {isHEAD && (
                                    <g>
                                        <rect
                                            x={node.x + NODE_W - 2}
                                            y={node.y - 2}
                                            width={36}
                                            height={16}
                                            rx={3}
                                            fill="#000"
                                            stroke="none"
                                        />
                                        <text
                                            x={node.x + NODE_W + 16}
                                            y={node.y + 10}
                                            textAnchor="middle"
                                            fontSize="9"
                                            fontWeight="900"
                                            fill="white"
                                        >
                                            HEAD
                                        </text>
                                    </g>
                                )}
                            </motion.g>
                        );
                    })}
                </AnimatePresence>

                {/* Legend */}
                <g transform={`translate(10, ${canvasH - 60})`}>
                    {[
                        { color: 'var(--white)', label: 'Normal Commit', stroke: 'var(--border)' },
                        { color: '#ffe0f0', label: 'Merge Commit', stroke: 'var(--border)' },
                        { color: '#e0f7ff', label: 'Rebased Commit', stroke: 'var(--border)' },
                    ].map((item, i) => (
                        <g key={i} transform={`translate(${i * 140}, 0)`}>
                            <rect x={0} y={0} width={14} height={14} rx={3} fill={item.color} stroke={item.stroke} strokeWidth={2} />
                            <text x={20} y={11} fontSize={10} fill="#888" fontWeight={600}>{item.label}</text>
                        </g>
                    ))}
                </g>
            </svg>
        </div>
    );
}
