import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NET_SIMS = [
    {
        path: '/networks/distancevector',
        icon: '📡',
        label: 'Distance Vector Routing',
        desc: 'Bellman-Ford per-router iteration — watch routing tables converge step by step',
        color: 'var(--yellow)',
        badge: 'Bellman-Ford · Convergence',
    },
    {
        path: '/networks/linkstate',
        icon: '🗺',
        label: 'Link State (Dijkstra)',
        desc: "Dijkstra's shortest path — see the priority queue and SPT build in real time",
        color: 'var(--cyan)',
        badge: 'Dijkstra · SPT · Min Heap',
    },
    {
        path: '/networks/slidingwindow',
        icon: '🪟',
        label: 'Sliding Window Protocol',
        desc: 'Stop & Wait · Go-Back-N · Selective Repeat — packet flow, ACKs, and retransmissions',
        color: 'var(--pink)',
        badge: 'GBN · SR · Timeout',
    },
];

export default function NetworksLanding() {
    return (
        <div className="main-content">
            <div style={{ marginBottom: '0.4rem' }}>
                <Link to="/" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← All Modules</Link>
            </div>
            <div style={{ marginBottom: '2rem' }}>
                <div className="section-header">Module 3</div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>🌐 Computer Networks</h1>
                <p style={{ opacity: 0.6, fontSize: '0.92rem', marginTop: '0.3rem' }}>
                    Simulate routing protocol convergence and data-link layer protocols with live visuals.
                </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {NET_SIMS.map((sim, i) => (
                    <motion.div key={sim.path} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
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
