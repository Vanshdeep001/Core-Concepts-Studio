import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChartIcon, LinkIcon, VaultIcon, TreeIcon, BuildIcon, CodeIcon } from '../../components/Icons';

const DBMS_SIMS = [
    {
        path: '/dbms/normalization',
        icon: ChartIcon,
        label: 'Normalization (1NF to BCNF)',
        desc: 'Observe a single Student God-table decompose and physically split apart columns dynamically based on functional dependencies.',
        color: 'var(--yellow)',
        badge: 'Decomposition \u00b7 1NF \u00b7 2NF \u00b7 3NF \u00b7 BCNF',
    },
    {
        path: '/dbms/joins',
        icon: LinkIcon,
        label: 'SQL Joins Connector',
        desc: 'Connect records with live SVG bezier curves, edit cells in real-time, and watch outer join results compile row-by-row.',
        color: 'var(--cyan)',
        badge: 'Inner \u00b7 Left \u00b7 Right \u00b7 Full \u00b7 Cross \u00b7 Self',
    },
    {
        path: '/dbms/transactions',
        icon: VaultIcon,
        label: 'Transactions & ACID Lab',
        desc: 'Trigger debit/credit pipe steps, inject runtime system crashes mid-transfer, and inspect concurrency isolation timelines.',
        color: 'var(--pink)',
        badge: 'Atomicity \u00b7 Dirty Read \u00b7 Rollback \u00b7 ACID',
    },
    {
        path: '/dbms/bplustree',
        icon: TreeIcon,
        label: 'Indexing & B+ Trees',
        desc: 'Visualize dynamic B+ tree node splits/merges and launch a side-by-side Index Search Race comparing linear scans.',
        color: 'var(--green)',
        badge: 'B+ Tree \u00b7 Dense/Sparse \u00b7 Search Race',
    },
    {
        path: '/dbms/er-design',
        icon: BuildIcon,
        label: 'ER Model & Schema Design',
        desc: "Place entities, ovals, and card lines, select Crow's foot cardinalities, and watch relational schemas update live.",
        color: 'var(--purple)',
        badge: 'ER Model \u00b7 Cardinality \u00b7 Junction Table',
    },
    {
        path: '/dbms/sql-visualizer',
        icon: CodeIcon,
        label: 'SQL Query Visualizer',
        desc: 'Write standard SQL queries and watch the query planner run animated table scans, filters, joins, groupings, and mutations.',
        color: 'var(--orange)',
        badge: 'SELECT \u00b7 WHERE \u00b7 JOIN \u00b7 GROUP BY \u00b7 Mutation',
    },
];

export default function DBMSLanding() {
    return (
        <div className="main-content">

            <div style={{ marginBottom: '2rem' }}>
                <div className="section-header">Module 2</div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>DBMS (Database Systems)</h1>
                <p style={{ opacity: 0.6, fontSize: '0.92rem', marginTop: '0.3rem' }}>
                    Interact with core database internals and design systems \u2014 normalization decomposition, SQL joins, ACID logs, index racing, and ER builders.
                </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gridAutoRows: '1fr', gap: '1.25rem' }}>
                {DBMS_SIMS.map((sim, i) => (
                    <motion.div key={sim.path} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} style={{ height: '100%' }}>
                        <Link to={sim.path} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
                            <div className="panel" style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', height: '100%', display: 'flex', flexDirection: 'column' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(4px,4px)'; e.currentTarget.style.boxShadow = 'none'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}>
                                <div className="panel-header" style={{ background: sim.color }}>
                                    <span style={{ display: 'flex', alignItems: 'center' }}>{sim.icon({ size: 18 })}</span> {sim.label}
                                </div>
                                <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <p style={{ fontSize: '0.85rem', opacity: 0.68, marginBottom: '0.75rem' }}>{sim.desc}</p>
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
