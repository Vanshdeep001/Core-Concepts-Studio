import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const MODULES = [
    {
        id: 'os',
        label: 'Operating Systems',
        icon: '🖥',
        color: 'var(--yellow)',
        description: 'CPU Scheduling · Page Replacement · Banker\'s Algorithm · Disk Scheduling',
        sims: ['FCFS', 'SJF', 'SRTF', 'RR', 'MLFQ', 'LRU', 'Optimal', 'SCAN'],
        path: '/os',
    },
    {
        id: 'dbms',
        label: 'DBMS',
        icon: '🗄',
        color: 'var(--cyan)',
        description: '2-Phase Locking · B+ Tree Index · Query Execution Plan',
        sims: ['2PL', 'B+ Tree', 'Query Plan', 'Deadlock'],
        path: '/dbms',
    },
    {
        id: 'networks',
        label: 'Computer Networks',
        icon: '🌐',
        color: 'var(--pink)',
        description: 'Distance Vector · Link State · Sliding Window Protocol',
        sims: ['Bellman-Ford', 'Dijkstra', 'Go-Back-N', 'Selective Repeat'],
        path: '/networks',
    },
    {
        id: 'oops',
        label: 'OOP Concepts',
        icon: '🧱',
        color: 'var(--green)',
        description: 'Memory Lifecycle · Polymorphism · Observer Pattern',
        sims: ['Stack/Heap', 'Dynamic Dispatch', 'Observer', 'Destructor'],
        path: '/oops',
    },
    {
        id: 'git',
        label: 'Git & GitHub',
        icon: '🌿',
        color: '#a8e6cf',
        description: 'Commit DAG · Branching · Merge · Rebase · Remote Sync',
        sims: ['DAG Viz', 'Branch', 'Merge', 'Rebase', 'Push/Pull'],
        path: '/git',
    },
];

const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.12, duration: 0.4, ease: 'easeOut' },
    }),
};

export default function LandingPage() {
    return (
        <div className="main-content">
            {/* Hero */}
            <div style={{ textAlign: 'center', marginBottom: '3rem', paddingTop: '1rem' }}>
                <div className="section-header">Interactive Simulator Platform</div>
                <h1
                    style={{
                        fontSize: 'clamp(2rem, 5vw, 3.2rem)',
                        fontWeight: 700,
                        lineHeight: 1.1,
                        marginBottom: '0.75rem',
                        letterSpacing: '-0.01em',
                    }}
                >
                    Core{' '}
                    <span
                        style={{
                            background: 'var(--yellow)',
                            padding: '0 0.4rem',
                            border: '3px solid var(--border)',
                            display: 'inline-block',
                        }}
                    >
                        Concepts
                    </span>
                    {' '}Studio
                </h1>
                <p style={{ opacity: 0.6, fontSize: '1rem', maxWidth: 560, margin: '0 auto' }}>
                    Pick a module and watch algorithms execute in real-time — tick by tick,
                    decision by decision. No black boxes.
                </p>
            </div>

            {/* Module Cards */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2.5rem',
                }}
            >
                {MODULES.map((mod, i) => (
                    <motion.div
                        key={mod.id}
                        custom={i}
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                    >
                        <Link
                            to={mod.path}
                            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                        >
                            <div
                                className="panel"
                                style={{
                                    cursor: 'pointer',
                                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translate(4px,4px)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = '';
                                    e.currentTarget.style.boxShadow = 'var(--shadow)';
                                }}
                            >
                                {/* Card header */}
                                <div
                                    className="panel-header"
                                    style={{ background: mod.color, fontSize: '1.05rem', padding: '0.8rem 1rem' }}
                                >
                                    <span style={{ fontSize: '1.3rem' }}>{mod.icon}</span>
                                    <strong>{mod.label}</strong>
                                </div>

                                {/* Card body */}
                                <div style={{ padding: '1.25rem' }}>
                                    <p style={{ fontSize: '0.88rem', opacity: 0.7, marginBottom: '1rem' }}>
                                        {mod.description}
                                    </p>

                                    {/* Algorithm chips */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.1rem' }}>
                                        {mod.sims.map((s) => (
                                            <span
                                                key={s}
                                                style={{
                                                    fontSize: '0.72rem',
                                                    fontWeight: 700,
                                                    padding: '0.2rem 0.5rem',
                                                    border: '2px solid var(--border)',
                                                    background: mod.color,
                                                    fontFamily: 'var(--font-mono)',
                                                }}
                                            >
                                                {s}
                                            </span>
                                        ))}
                                    </div>

                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            fontWeight: 700,
                                            fontSize: '0.9rem',
                                        }}
                                    >
                                        Open Module <span>→</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Stats row */}
            <div className="stat-cards" style={{ marginBottom: '2rem' }}>
                {[
                    { label: 'Modules', value: '5', unit: 'topics', color: 'yellow' },
                    { label: 'Simulators', value: '14+', unit: 'interactive', color: 'cyan' },
                    { label: 'Algorithms', value: '30+', unit: 'visualized', color: 'pink' },
                    { label: 'Real-time', value: '∞', unit: 'step-by-step', color: 'green' },
                ].map((s) => (
                    <div key={s.label} className={`stat-card ${s.color}`}>
                        <div className="stat-card-label">{s.label}</div>
                        <div className="stat-card-value">{s.value}</div>
                        <div className="stat-card-unit">{s.unit}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
