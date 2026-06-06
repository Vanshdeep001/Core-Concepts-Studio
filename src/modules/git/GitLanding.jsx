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

export default function GitLanding() {
    return (
        <div className="main-content">
            <div style={{ marginBottom: '0.4rem' }}>
                <Link to="/" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>
                    ← All Modules
                </Link>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <div className="section-header">Module 5</div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>🌿 Git & GitHub</h1>
                <p style={{ opacity: 0.6, fontSize: '0.92rem', marginTop: '0.3rem' }}>
                    Visualize Git's internal model — commits, branches, merges, rebases, and remote operations.
                </p>
            </div>

            {/* Simulator Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {GIT_SIMS.map((sim, i) => (
                    <motion.div key={sim.path} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                        <Link to={sim.path} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                            <div className="panel" style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(4px,4px)'; e.currentTarget.style.boxShadow = 'none'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}>
                                <div className="panel-header" style={{ background: sim.color }}>
                                    <span style={{ fontSize: '1.1rem' }}>{sim.icon}</span> {sim.label}
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.35rem' }}>
                                        {sim.tags.map(t => (
                                            <span key={t} style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem', border: '2px solid var(--border)', background: 'rgba(255,255,255,0.5)', borderRadius: 4 }}>{t}</span>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ padding: '1rem' }}>
                                    <p style={{ fontSize: '0.85rem', opacity: 0.68, marginBottom: '0.75rem', lineHeight: 1.5 }}>{sim.desc}</p>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', opacity: 0.7, marginBottom: '0.75rem' }}>{sim.badge}</div>
                                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Launch →</span>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
