// GitLanding.jsx — Module 5 landing page for Git & GitHub
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const GIT_SIMS = [
    {
        path: '/git/sim',
        icon: '🌿',
        label: 'Git Internals Simulator',
        desc: 'Watch commits form a DAG — staging area, branching, merging, rebasing, and remote sync all visualized in real time.',
        color: 'var(--green)',
        badge: 'DAG · Branch · Merge · Rebase · Push/Pull',
        tags: ['Beginner', 'Advanced'],
    },
];

const KEY_CONCEPTS = [
    { icon: '🌳', title: 'Commit DAG', desc: 'Every commit is a node. Parent pointers form the Directed Acyclic Graph.' },
    { icon: '🏷️', title: 'Branches = Pointers', desc: 'A branch is just a 41-byte file with a commit hash. Zero cost to create.' },
    { icon: '👁️', title: 'HEAD', desc: 'Tells Git "where you are". Points to a branch (or detached to a hash).' },
    { icon: '📦', title: 'Staging Area', desc: 'The index between your files and commits. Craft precise snapshots.' },
    { icon: '🔀', title: 'Merge vs Rebase', desc: 'Merge preserves history. Rebase replays commits, creating new hashes.' },
    { icon: '🌐', title: 'Remote Sync', desc: 'Push/pull = transferring objects + updating branch pointers.' },
];

export default function GitLanding() {
    return (
        <div className="main-content">
            <div style={{ marginBottom: '0.4rem' }}>
                <Link to="/" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← All Modules</Link>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <div className="section-header">Module 5</div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>🌿 Git & GitHub</h1>
                <p style={{ opacity: 0.6, fontSize: '0.92rem', marginTop: '0.3rem' }}>
                    Visualize Git's internal model — DAG, staging area, branching, merging, rebasing, and remote operations.
                    Not just commands — the <em>internals</em>.
                </p>
            </div>

            {/* Simulator Card */}
            <div style={{ marginBottom: '2rem' }}>
                {GIT_SIMS.map((sim, i) => (
                    <motion.div key={sim.path} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <Link to={sim.path} style={{ textDecoration: 'none', color: 'inherit', display: 'block', maxWidth: 520 }}>
                            <div className="panel" style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(4px,4px)'; e.currentTarget.style.boxShadow = 'none'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}>
                                <div className="panel-header" style={{ background: sim.color, fontSize: '1.05rem' }}>
                                    <span style={{ fontSize: '1.2rem' }}>{sim.icon}</span> {sim.label}
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.35rem' }}>
                                        {sim.tags.map(t => (
                                            <span key={t} style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem', border: '2px solid var(--border)', background: 'rgba(255,255,255,0.5)', borderRadius: 4 }}>{t}</span>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ padding: '1.1rem' }}>
                                    <p style={{ fontSize: '0.88rem', opacity: 0.7, marginBottom: '0.85rem', lineHeight: 1.5 }}>{sim.desc}</p>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', opacity: 0.7, marginBottom: '0.85rem' }}>{sim.badge}</div>
                                    <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Launch Simulator →</span>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Key Concepts Grid */}
            <div style={{ marginBottom: '2rem' }}>
                <div className="section-header" style={{ marginBottom: '0.75rem' }}>Core Concepts</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                    {KEY_CONCEPTS.map((c, i) => (
                        <motion.div
                            key={c.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.06 }}
                            className="panel"
                            style={{ padding: '0' }}
                        >
                            <div style={{ padding: '0.75rem 1rem' }}>
                                <div style={{ fontSize: '1.3rem', marginBottom: '0.35rem' }}>{c.icon}</div>
                                <div style={{ fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.3rem' }}>{c.title}</div>
                                <div style={{ fontSize: '0.78rem', opacity: 0.65, lineHeight: 1.4 }}>{c.desc}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* What makes this unique */}
            <div className="panel">
                <div className="panel-header" style={{ background: 'var(--green)' }}>🏆 Git Internals Engine — What's Different</div>
                <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem' }}>
                    {[
                        '🌳 Live DAG graph — watch commit nodes appear',
                        '👁️ HEAD pointer animates on checkout',
                        '🏷️ Branch labels move as commits happen',
                        '🔀 Merge commits show two parent arrows',
                        '♻️ Rebase: old commits fade, new ones appear',
                        '📦 Staging area → commit snapshot flow',
                        '🌐 Remote (origin) branch tracking labels',
                        '📘 Beginner + 🔬 Advanced mode explanations',
                    ].map((item, i) => (
                        <div key={i} style={{ fontSize: '0.82rem', opacity: 0.8, display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
                            <span>{item.split(' ')[0]}</span>
                            <span>{item.split(' ').slice(1).join(' ')}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
