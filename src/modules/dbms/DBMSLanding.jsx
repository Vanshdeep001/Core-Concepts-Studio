import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const DBMS_SIMS = [
    {
        path: '/dbms/normalization',
        icon: '📊',
        label: 'Normalization (1NF to BCNF)',
        desc: 'Observe a single Student God-table decompose and physically split apart columns dynamically based on functional dependencies.',
        color: 'var(--yellow)',
        badge: 'Decomposition · 1NF · 2NF · 3NF · BCNF',
    },
    {
        path: '/dbms/joins',
        icon: '🔗',
        label: 'SQL Joins Connector',
        desc: 'Connect records with live SVG bezier curves, edit cells in real-time, and watch outer join results compile row-by-row.',
        color: 'var(--cyan)',
        badge: 'Inner · Left · Right · Full · Cross · Self',
    },
    {
        path: '/dbms/transactions',
        icon: '🏦',
        label: 'Transactions & ACID Lab',
        desc: 'Trigger debit/credit pipe steps, inject runtime system crashes mid-transfer, and inspect concurrency isolation timelines.',
        color: 'var(--pink)',
        badge: 'Atomicity · Dirty Read · Rollback · ACID',
    },
    {
        path: '/dbms/bplustree',
        icon: '🌳',
        label: 'Indexing & B+ Trees',
        desc: 'Visualize dynamic B+ tree node splits/merges and launch a side-by-side Index Search Race comparing linear scans.',
        color: 'var(--green)',
        badge: 'B+ Tree · Dense/Sparse · Search Race',
    },
    {
        path: '/dbms/er-design',
        icon: '🏗️',
        label: 'ER Model & Schema Design',
        desc: 'Place entities, ovals, and card lines, select Crow\'s foot cardinalities, and watch relational schemas update live.',
        color: 'var(--purple)',
        badge: 'ER Model · Cardinality · Junction Table',
    },
];

export default function DBMSLanding() {
    return (
        <div className="main-content">
            <div style={{ marginBottom: '0.4rem' }}>
                <Link to="/" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>
                    ← All Modules
                </Link>
            </div>
            <div style={{ marginBottom: '2rem' }}>
                <div className="section-header">Module 2</div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>🗄 DBMS (Database Systems)</h1>
                <p style={{ opacity: 0.6, fontSize: '0.92rem', marginTop: '0.3rem' }}>
                    Interact with core database internals and design systems — normalization decomposition, SQL joins, ACID logs, index racing, and ER builders.
                </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {DBMS_SIMS.map((sim, i) => (
                    <motion.div key={sim.path} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                        <Link to={sim.path} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                            <div className="panel" style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(4px,4px)'; e.currentTarget.style.boxShadow = 'none'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}>
                                <div className="panel-header" style={{ background: sim.color }}>
                                    <span style={{ fontSize: '1.1rem' }}>{sim.icon}</span> {sim.label}
                                </div>
                                <div style={{ padding: '1rem' }}>
                                    <p style={{ fontSize: '0.85rem', opacity: 0.68, marginBottom: '0.75rem' }}>{sim.desc}</p>
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
