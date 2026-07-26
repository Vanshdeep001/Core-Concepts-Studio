// CommitGraph.jsx — SVG DAG visualizer for Git commits
import { motion, AnimatePresence } from 'framer-motion';
import { computeDAGLayout } from './engine/gitEngine';
import { GitBranchIcon } from '../../components/Icons';

const BRANCH_COLORS = ['#ffd93d', '#66d9ef', '#ff6b9d', '#a8e6cf', '#c3aed6', '#ffb347', '#87ceeb'];
const NODE_W = 120;
const NODE_H = 70;

function getBranchColor(name, index) {
    if (name === 'main' || name === 'master') return '#ffd93d';
    if (name.startsWith('origin/')) return '#c3aed6';
    return BRANCH_COLORS[(index + 1) % BRANCH_COLORS.length];
}

export default function CommitGraph({ commits, branches, HEAD, remote, orphanedHashes = [], highlightHash = null, isMobile = false }) {
    const nodeW = isMobile ? 90 : NODE_W;
    const nodeH = isMobile ? 55 : NODE_H;
    const { nodes, edges, headHash, lanes = [] } = computeDAGLayout(commits, branches, HEAD, remote);

    if (!nodes.length) {
        const flow = [
            { label: '+ File', color: '#a8e6cf' },
            { label: 'git add', color: '#ffd93d' },
            { label: 'git commit', color: '#66d9ef' },
        ];
        return (
            <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: isMobile ? '1rem' : '2rem', minHeight: isMobile ? '160px' : '240px',
            }}>
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isMobile ? '0.6rem' : '0.85rem',
                    background: 'var(--white)', border: '2px solid var(--border)', borderRadius: 10,
                    boxShadow: '4px 4px 0 var(--border)',
                    padding: isMobile ? '1.1rem 1.25rem' : '1.6rem 2rem', maxWidth: isMobile ? 280 : 360, textAlign: 'center',
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: isMobile ? 52 : 64, height: isMobile ? 52 : 64, borderRadius: '50%',
                        background: '#e8fbff', border: '2px solid var(--border)', flexShrink: 0,
                    }}>
                        <GitBranchIcon size={isMobile ? 28 : 34} color="var(--cyan)" />
                    </div>
                    <div style={{ fontWeight: 900, fontSize: isMobile ? '0.85rem' : '1rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text)' }}>
                        No commits yet
                    </div>
                    <div style={{ fontSize: isMobile ? '0.7rem' : '0.78rem', color: '#666', lineHeight: 1.4 }}>
                        Your commit graph is empty. Make your first snapshot to see it appear here.
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.25rem' : '0.4rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.1rem' }}>
                        {flow.map((step, i) => (
                            <span key={step.label} style={{ display: 'inline-flex', alignItems: 'center', gap: isMobile ? '0.25rem' : '0.4rem' }}>
                                <span style={{
                                    fontFamily: 'var(--font-mono)', fontWeight: 800,
                                    fontSize: isMobile ? '0.6rem' : '0.68rem',
                                    background: step.color, color: '#111',
                                    border: '2px solid var(--border)', borderRadius: 5,
                                    padding: isMobile ? '0.15rem 0.35rem' : '0.2rem 0.5rem', whiteSpace: 'nowrap',
                                }}>{step.label}</span>
                                {i < flow.length - 1 && <span style={{ color: '#999', fontWeight: 900, fontSize: isMobile ? '0.65rem' : '0.8rem' }}>→</span>}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Compute canvas size
    const maxX = Math.max(...nodes.map(n => n.x + n.width), 400);
    const maxY = Math.max(...nodes.map(n => n.y + n.height), 200);
    const canvasW = maxX + 80;
    const canvasH = maxY + 60;

    // Branch color map
    const branchColorMap = {};
    Object.keys(branches).forEach((name, i) => {
        branchColorMap[name] = getBranchColor(name, i);
    });

    const headBranch = HEAD.type === 'branch' ? HEAD.ref : null;

    return (
        <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '0.5rem' : '1rem', background: 'var(--bg)', WebkitOverflowScrolling: 'touch' }}>
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
                    <marker id="arrow-head" markerWidth="6" markerHeight="6" refX="5" refY="2" orient="auto">
                        <path d="M0,0 L0,4 L5,2 z" fill="#000" />
                    </marker>
                </defs>

                {/* Swimlane rails — one tinted track per branch, so each branch
                    reads as its own horizontal lane even with a single commit. */}
                {lanes.map((l) => {
                    const color = branchColorMap[l.branch] || '#c3aed6';
                    const x1 = l.minX - nodeW / 2 - 10;
                    const x2 = l.maxX + nodeW / 2 + 10;
                    return (
                        <line
                            key={`lane-${l.lane}`}
                            x1={x1} y1={l.y} x2={x2} y2={l.y}
                            stroke={color}
                            strokeWidth={nodeH + 24}
                            strokeLinecap="round"
                            opacity={0.1}
                        />
                    );
                })}

                {/* Edges */}
                {edges.map((edge, i) => {
                    const fromNode = nodes.find(n => n.id === edge.from);
                    const toNode = nodes.find(n => n.id === edge.to);
                    if (!fromNode || !toNode) return null;

                    const x1 = fromNode.x + nodeW / 2;
                    const y1 = fromNode.y + nodeH / 2;
                    const x2 = toNode.x + nodeW / 2;
                    const y2 = toNode.y + nodeH / 2;

                    const isMerge = edge.isMergeEdge;
                    const isRebase = fromNode.commit?.isRebase;
                    // Colour normal edges by the branch they belong to, so each
                    // lane's line matches its branch badge.
                    const branchColor = branchColorMap[edge.branch] || 'var(--border)';

                    // Curved path for non-linear edges
                    const midX = (x1 + x2) / 2;
                    const midY = (y1 + y2) / 2;
                    const curveOffset = (isMerge && y1 === y2) ? -40 : 0;

                    const pathD = curveOffset !== 0
                        ? `M${x1},${y1} Q${midX},${midY + curveOffset} ${x2},${y2}`
                        : `M${x1},${y1} L${x2},${y2}`;

                    return (
                        <path
                            key={i}
                            d={pathD}
                            stroke={isMerge ? '#ff6b9d' : isRebase ? '#66d9ef' : branchColor}
                            strokeWidth={isMerge ? 2.5 : 2.5}
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
                        const cx = node.x + nodeW / 2;
                        const cy = node.y + nodeH / 2;

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
                                        <circle cx={cx} cy={cy} r={isMobile ? 30 : 38} fill="none" stroke="#ffd93d" strokeWidth={3} opacity={0.8}
                                            style={{ animation: 'git-pulse 1s ease-out infinite' }} />
                                        <circle cx={cx} cy={cy} r={isMobile ? 40 : 48} fill="none" stroke="#ffd93d" strokeWidth={1.5} opacity={0.4}
                                            style={{ animation: 'git-pulse 1s ease-out 0.3s infinite' }} />
                                    </>
                                )}
                                {/* Commit node box */}
                                <rect
                                    x={node.x}
                                    y={node.y}
                                    width={nodeW}
                                    height={nodeH}
                                    rx={isMobile ? 6 : 8}
                                    fill={node.isMerge ? '#ffe0f0' : node.isRebase ? '#e0f7ff' : 'var(--white)'}
                                    stroke={isHEAD ? '#000' : 'var(--border)'}
                                    strokeWidth={isHEAD ? 3 : 2}
                                    style={{ filter: isHighlighted ? 'drop-shadow(0 0 8px rgba(255, 217, 61, 0.8))' : 'none' }}
                                />

                                {/* Commit hash */}
                                <text
                                    x={node.x + nodeW / 2}
                                    y={node.y + (isMobile ? 13 : 15)}
                                    textAnchor="middle"
                                    fontSize={isMobile ? '8' : '10'}
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
                                    x={node.x + nodeW / 2}
                                    y={node.y + (isMobile ? 25 : 30)}
                                    textAnchor="middle"
                                    fontSize={isMobile ? '9' : '11'}
                                    fontFamily="sans-serif"
                                    fontWeight="600"
                                    fill="var(--text)"
                                >
                                    {node.commit.message.slice(0, isMobile ? 10 : 14)}{node.commit.message.length > (isMobile ? 10 : 14) ? '…' : ''}
                                </text>

                                {/* Timestamp */}
                                <text
                                    x={node.x + nodeW / 2}
                                    y={node.y + (isMobile ? 36 : 44)}
                                    textAnchor="middle"
                                    fontSize={isMobile ? '7' : '9'}
                                    fill="#999"
                                >
                                    {node.commit.timestamp?.slice(11) || ''}
                                </text>

                                {/* File Changes */}
                                {(() => {
                                    const parentHash = node.commit.parentHashes[0];
                                    const parentCommit = parentHash ? commits[parentHash] : null;

                                    const changes = [];
                                    const currentTree = node.commit.tree || {};
                                    const parentTree = parentCommit ? (parentCommit.tree || {}) : {};

                                    Object.keys(currentTree).forEach(f => {
                                        if (parentTree[f] === undefined) {
                                            changes.push({ file: f, type: 'added' });
                                        } else if (parentTree[f] !== currentTree[f]) {
                                            changes.push({ file: f, type: 'modified' });
                                        }
                                    });
                                    Object.keys(parentTree).forEach(f => {
                                        if (currentTree[f] === undefined) {
                                            changes.push({ file: f, type: 'deleted' });
                                        }
                                    });

                                    const changeTexts = changes.map(c => {
                                        const icon = c.type === 'added' ? '+' : c.type === 'modified' ? '~' : '-';
                                        return `${icon}${c.file}`;
                                    });
                                    const displayStr = changeTexts.join(', ');

                                    if (changes.length === 0) return null;
                                    const maxLen = isMobile ? 12 : 18;
                                    const sliceLen = isMobile ? 10 : 16;

                                    return (
                                        <text
                                            x={node.x + nodeW / 2}
                                            y={node.y + (isMobile ? 47 : 58)}
                                            textAnchor="middle"
                                            fontSize={isMobile ? '7' : '9'}
                                            fontFamily="monospace"
                                            fontWeight="700"
                                            fill={changes[0].type === 'added' ? '#2e7d32' : changes[0].type === 'modified' ? '#0288d1' : '#c62828'}
                                        >
                                            {displayStr.length > maxLen ? `${displayStr.slice(0, sliceLen)}…` : displayStr}
                                        </text>
                                    );
                                })()}

                                {/* Branch labels */}
                                {node.branchLabels.map((bl, bi) => {
                                    const isCurrentBranch = bl.name === HEAD.ref && HEAD.type === 'branch';
                                    const color = branchColorMap[bl.name] || '#c3aed6';
                                    const isRemote = bl.type === 'remote';
                                    const labelY = node.y - (isMobile ? 16 : 20) - bi * (isMobile ? 18 : 22);
                                    const charW = isMobile ? 6 : 7;
                                    const padW = isMobile ? 12 : 16;
                                    const minW = isMobile ? 48 : 60;
                                    const approxWidth = Math.max(bl.name.length * charW + padW, minW);
                                    const labelX = node.x + nodeW / 2 - approxWidth / 2;

                                    return (
                                        <g key={bi}>
                                            <rect
                                                x={labelX}
                                                y={labelY - 12}
                                                width={approxWidth}
                                                height={isMobile ? 16 : 18}
                                                rx={4}
                                                fill={color}
                                                stroke={isCurrentBranch ? '#000' : 'var(--border)'}
                                                strokeWidth={isCurrentBranch ? 3 : 2}
                                                strokeDasharray={isRemote ? '4 2' : 'none'}
                                            />
                                            <text
                                                x={labelX + approxWidth / 2}
                                                y={labelY + (isMobile ? 0 : 1)}
                                                textAnchor="middle"
                                                fontSize={isMobile ? '8' : '10'}
                                                fontWeight="900"
                                                fontFamily="monospace"
                                                fill="#222"
                                            >
                                                {bl.name}
                                            </text>
                                            {isCurrentBranch && (
                                                <g>
                                                    {/* Arrow from branch badge to HEAD badge */}
                                                    <path d={`M${labelX + approxWidth} ${labelY - 3} L${labelX + approxWidth + 8} ${labelY - 3}`} stroke="#000" strokeWidth="2" markerEnd="url(#arrow-head)" />
                                                    <rect
                                                        x={labelX + approxWidth + 10}
                                                        y={labelY - 12}
                                                        width={isMobile ? 30 : 36}
                                                        height={isMobile ? 16 : 18}
                                                        rx={3}
                                                        fill="#000"
                                                    />
                                                    <text
                                                        x={labelX + approxWidth + (isMobile ? 25 : 28)}
                                                        y={labelY + (isMobile ? 0 : 1)}
                                                        textAnchor="middle"
                                                        fontSize={isMobile ? '7' : '9'}
                                                        fontWeight="900"
                                                        fill="white"
                                                    >
                                                        HEAD
                                                    </text>
                                                </g>
                                            )}
                                            {/* connector line */}
                                            <line
                                                x1={node.x + nodeW / 2}
                                                y1={labelY + 6}
                                                x2={node.x + nodeW / 2}
                                                y2={node.y}
                                                stroke="var(--border)"
                                                strokeWidth={1.5}
                                                strokeDasharray="3 2"
                                            />
                                        </g>
                                    );
                                })}

                                {/* HEAD indicator (only in detached HEAD mode) */}
                                {isHEAD && HEAD.type !== 'branch' && (
                                    <g>
                                        <rect
                                            x={node.x + nodeW - 2}
                                            y={node.y - 2}
                                            width={isMobile ? 30 : 36}
                                            height={16}
                                            rx={3}
                                            fill="#000"
                                            stroke="none"
                                        />
                                        <text
                                            x={node.x + nodeW + (isMobile ? 13 : 16)}
                                            y={node.y + 10}
                                            textAnchor="middle"
                                            fontSize={isMobile ? '7' : '9'}
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


            </svg>
        </div>
    );
}
