// GitLanding.jsx \u2014 Module 5 landing page for Git & GitHub
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GitBranchIcon } from '../../components/Icons';

const GIT_SIMS = [
    {
        path: '/git/sim',
        icon: GitBranchIcon,
        label: 'Git Internals Simulator',
        desc: 'Watch commits form a DAG \u2014 staging area, branching, merging, rebasing, and remote sync all visualized in real time.',
        color: 'var(--green)',
        badge: 'DAG \u00b7 Branch \u00b7 Merge \u00b7 Rebase \u00b7 Push/Pull',
        tags: ['Beginner', 'Advanced'],
    },
];

export default function GitLanding() {
    return (
        <div className="main-content">


            <div style={{ marginBottom: '2rem' }}>
                <div className="section-header">Module 5</div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Git & GitHub</h1>
                <p style={{ opacity: 0.6, fontSize: '0.92rem', marginTop: '0.3rem' }}>
                    Visualize Git's internal model \u2014 commits, branches, merges, rebases, and remote operations.
                </p>
            </div>

            {/* Simulator Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gridAutoRows: '1fr', gap: '1.25rem' }}>
                {GIT_SIMS.map((sim, i) => (
                    <motion.div key={sim.path} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} style={{ height: '100%' }}>
                        <Link to={sim.path} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
                            <div className="panel" style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', height: '100%', display: 'flex', flexDirection: 'column' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(4px,4px)'; e.currentTarget.style.boxShadow = 'none'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}>
                                <div className="panel-header" style={{ background: sim.color }}>
                                    <span style={{ display: 'flex', alignItems: 'center' }}>{sim.icon({ size: 18 })}</span> {sim.label}
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.35rem' }}>
                                        {sim.tags.map(t => (
                                            <span key={t} style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem', border: '2px solid var(--border)', background: 'rgba(255,255,255,0.5)', borderRadius: 4 }}>{t}</span>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <p style={{ fontSize: '0.85rem', opacity: 0.68, marginBottom: '0.75rem', lineHeight: 1.5 }}>{sim.desc}</p>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', opacity: 0.7, marginBottom: '0.75rem' }}>{sim.badge}</div>

                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
