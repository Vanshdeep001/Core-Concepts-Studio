import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const OS_SIMS = [
    {
        path: '/os/scheduling',
        icon: '⚙',
        label: 'Process Scheduling',
        desc: 'FCFS · SJF · SRTF · Priority · Round Robin · MLFQ — tick-by-tick Gantt chart',
        color: 'var(--yellow)',
        badge: 'Preemption · Context Switch',
    },
    {
        path: '/os/page-replacement',
        icon: '📄',
        label: 'Page Replacement',
        desc: 'FIFO · LRU · Optimal · LFU — simulate frame table and page fault counting',
        color: 'var(--cyan)',
        badge: 'Hit/Miss · Victim Page',
    },
    {
        path: '/os/bankers',
        icon: '🏦',
        label: "Banker's Algorithm",
        desc: 'Deadlock avoidance — need matrix, safe sequence, unsafe state detection',
        color: 'var(--pink)',
        badge: 'Safe Sequence · Deadlock',
    },
    {
        path: '/os/disk',
        icon: '💿',
        label: 'Disk Scheduling',
        desc: 'FCFS · SSTF · SCAN · C-SCAN — animated head movement across track 0–199',
        color: 'var(--green)',
        badge: 'Seek Time · Head Position',
    },
];

export default function OSLanding() {
    return (
        <div className="main-content">
            <div style={{ marginBottom: '0.4rem' }}>
                <Link to="/" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>
                    ← All Modules
                </Link>
            </div>
            <div style={{ marginBottom: '2rem' }}>
                <div className="section-header">Module 1</div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>🖥 Operating Systems</h1>
                <p style={{ opacity: 0.6, fontSize: '0.92rem', marginTop: '0.3rem' }}>
                    Simulate core OS algorithms step-by-step — process scheduling, memory management, deadlock avoidance, and disk I/O.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {OS_SIMS.map((sim, i) => (
                    <motion.div key={sim.path} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <Link to={sim.path} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                            <div
                                className="panel"
                                style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(4px,4px)'; e.currentTarget.style.boxShadow = 'none'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
                            >
                                <div className="panel-header" style={{ background: sim.color }}>
                                    <span style={{ fontSize: '1.1rem' }}>{sim.icon}</span> {sim.label}
                                </div>
                                <div style={{ padding: '1rem' }}>
                                    <p style={{ fontSize: '0.85rem', opacity: 0.68, marginBottom: '0.75rem' }}>{sim.desc}</p>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', opacity: 0.7, marginBottom: '0.75rem' }}>
                                        {sim.badge}
                                    </div>
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
