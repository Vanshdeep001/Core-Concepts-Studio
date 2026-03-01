// GitStatePanel.jsx — Left panel: Working Dir, Staging Area, HEAD inspector
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_STYLES = {
    untracked: { bg: '#fff3cd', color: '#856404', label: 'NEW' },
    modified: { bg: '#d4edda', color: '#155724', label: 'MOD' },
    deleted: { bg: '#f8d7da', color: '#721c24', label: 'DEL' },
    staged: { bg: '#d1ecf1', color: '#0c5460', label: 'STG' },
};

function FileRow({ filename, status, content }) {
    const style = STATUS_STYLES[status] || STATUS_STYLES.modified;
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.35rem 0.5rem', marginBottom: '0.3rem',
                border: '1.5px solid var(--border)', borderRadius: 6,
                background: style.bg, fontSize: '0.78rem',
            }}
        >
            <span style={{
                fontSize: '0.62rem', fontWeight: 800, background: style.color,
                color: 'white', padding: '0.1rem 0.35rem', borderRadius: 3, flexShrink: 0,
            }}>{style.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {filename}
            </span>
        </motion.div>
    );
}

function Section({ title, color, icon, children, count }) {
    return (
        <div style={{ marginBottom: '1.25rem' }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.05em', marginBottom: '0.5rem',
                padding: '0.35rem 0.5rem', background: color,
                border: '2px solid var(--border)', borderRadius: 6,
            }}>
                <span>{icon}</span>
                <span style={{ flex: 1 }}>{title}</span>
                <span style={{
                    background: 'rgba(0,0,0,0.15)', borderRadius: 10,
                    padding: '0.05rem 0.4rem', fontSize: '0.65rem',
                }}>{count}</span>
            </div>
            <div style={{ paddingLeft: '0.25rem' }}>
                {children}
            </div>
        </div>
    );
}

export default function GitStatePanel({ state, conceptMode }) {
    if (!state.initialized) {
        return (
            <div style={{ opacity: 0.4, textAlign: 'center', paddingTop: '2rem', fontSize: '0.85rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗂️</div>
                Run <strong>git init</strong> to start
            </div>
        );
    }

    const { workingDirectory, stagingArea, branches, HEAD, commits, stash, remote } = state;
    const headHash = HEAD.type === 'branch' ? branches[HEAD.ref] : HEAD.ref;
    const headCommit = headHash ? commits[headHash] : null;

    // Current files (from last commit)
    const currentFiles = Object.keys(state.currentFiles || {});

    return (
        <div style={{ fontSize: '0.82rem' }}>

            {/* HEAD */}
            <Section title="HEAD" color="#ffd93d" icon="👁️" count={1}>
                <div style={{
                    padding: '0.5rem 0.6rem', background: '#fffbea',
                    border: '2px solid var(--border)', borderRadius: 6,
                    fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                }}>
                    <div style={{ fontWeight: 800, marginBottom: '0.25rem' }}>
                        HEAD → {HEAD.type === 'branch' ? `refs/heads/${HEAD.ref}` : '(detached)'}
                    </div>
                    {HEAD.type === 'branch' && (
                        <div style={{ opacity: 0.7 }}>{HEAD.ref} → {headHash ? headHash.slice(0, 7) : '(no commits)'}</div>
                    )}
                    {headCommit && (
                        <div style={{ marginTop: '0.3rem', background: '#fff', padding: '0.25rem', borderRadius: 4, border: '1px solid #ddd' }}>
                            <div style={{ fontWeight: 700 }}>{headCommit.message}</div>
                            <div style={{ opacity: 0.5, fontSize: '0.68rem' }}>{headCommit.timestamp}</div>
                        </div>
                    )}
                </div>
            </Section>

            {/* Branches */}
            <Section title="Branches" color="#66d9ef" icon="🌿" count={Object.keys(branches).length}>
                <AnimatePresence>
                    {Object.entries(branches).map(([name, hash]) => (
                        <motion.div
                            key={name}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.3rem 0.5rem', marginBottom: '0.3rem',
                                border: `2px solid ${name === HEAD.ref ? '#000' : 'var(--border)'}`,
                                borderRadius: 6,
                                background: name === HEAD.ref ? '#fffbea' : 'var(--white)',
                                fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700,
                            }}
                        >
                            {name === HEAD.ref && <span>★</span>}
                            <span style={{ flex: 1 }}>{name}</span>
                            <span style={{ opacity: 0.5, fontSize: '0.68rem' }}>{hash ? hash.slice(0, 7) : 'unborn'}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </Section>

            {/* Working Directory */}
            <Section
                title="Working Dir"
                color="#a8e6cf"
                icon="📁"
                count={Object.keys(workingDirectory).length}
            >
                <AnimatePresence>
                    {Object.keys(workingDirectory).length === 0 ? (
                        <div style={{ opacity: 0.4, fontSize: '0.75rem', fontStyle: 'italic', paddingLeft: '0.25rem' }}>
                            Clean working directory
                        </div>
                    ) : (
                        Object.entries(workingDirectory).map(([f, v]) => (
                            <FileRow key={f} filename={f} status={v.status} content={v.content} />
                        ))
                    )}
                </AnimatePresence>
            </Section>

            {/* Staging Area */}
            <Section
                title="Staging Area"
                color="#ffb347"
                icon="📦"
                count={Object.keys(stagingArea).length}
            >
                <AnimatePresence>
                    {Object.keys(stagingArea).length === 0 ? (
                        <div style={{ opacity: 0.4, fontSize: '0.75rem', fontStyle: 'italic', paddingLeft: '0.25rem' }}>
                            Nothing staged
                        </div>
                    ) : (
                        Object.entries(stagingArea).map(([f, v]) => (
                            <FileRow key={f} filename={f} status={v.status || 'staged'} />
                        ))
                    )}
                </AnimatePresence>
            </Section>

            {/* Current Files (committed snapshot) */}
            <Section title="Committed Snapshot" color="#e8d5f5" icon="📸" count={currentFiles.length}>
                {currentFiles.length === 0 ? (
                    <div style={{ opacity: 0.4, fontSize: '0.75rem', fontStyle: 'italic', paddingLeft: '0.25rem' }}>No committed files</div>
                ) : (
                    currentFiles.map(f => (
                        <div key={f} style={{
                            padding: '0.25rem 0.5rem', marginBottom: '0.25rem',
                            border: '1.5px solid var(--border)', borderRadius: 5,
                            fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                            background: 'var(--white)',
                        }}>
                            📄 {f}
                        </div>
                    ))
                )}
            </Section>

            {/* Remote */}
            {remote && (
                <Section title="Remote (origin)" color="#c3aed6" icon="🌐" count={Object.keys(remote.branches || {}).length}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', padding: '0.3rem 0.5rem', background: '#f5f0ff', border: '1.5px solid var(--border)', borderRadius: 6 }}>
                        <div style={{ fontWeight: 700, marginBottom: '0.25rem', wordBreak: 'break-all' }}>{remote.url}</div>
                        {Object.entries(remote.branches || {}).map(([name, hash]) => (
                            <div key={name} style={{ opacity: 0.7 }}>origin/{name} → {hash?.slice(0, 7)}</div>
                        ))}
                    </div>
                </Section>
            )}

            {/* Stash */}
            {stash?.length > 0 && (
                <Section title="Stash" color="#ffe0b2" icon="🗄️" count={stash.length}>
                    {stash.map((entry, i) => (
                        <div key={i} style={{
                            padding: '0.3rem 0.5rem', marginBottom: '0.25rem',
                            border: '1.5px solid var(--border)', borderRadius: 5,
                            fontSize: '0.75rem', background: '#fff8e1',
                        }}>
                            stash@{'{' + i + '}'} — {Object.keys(entry.workingDirectory).length + Object.keys(entry.stagingArea).length} file(s)
                        </div>
                    ))}
                </Section>
            )}
        </div>
    );
}
