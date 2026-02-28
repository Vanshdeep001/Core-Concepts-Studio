import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const OOP_SIMS = [
    {
        path: '/oops/memory',
        icon: '🧠',
        label: 'Object Lifecycle & Memory',
        desc: 'Stack frames · heap allocation · constructor/destructor · GC simulation',
        color: 'var(--yellow)',
        badge: 'Stack · Heap · GC · Refs',
    },
    {
        path: '/oops/polymorphism',
        icon: '🔀',
        label: 'Polymorphism & Dispatch',
        desc: 'Dynamic binding — vtable lookup, which override executes, reference assignment',
        color: 'var(--cyan)',
        badge: 'vTable · Override · Binding',
    },
    {
        path: '/oops/observer',
        icon: '👁',
        label: 'Observer Pattern',
        desc: 'Subject state change → notify → all observers update — event propagation visual',
        color: 'var(--pink)',
        badge: 'Pub/Sub · Notify · Event',
    },
];

export default function OOPSLanding() {
    return (
        <div className="main-content">
            <div style={{ marginBottom: '0.4rem' }}>
                <Link to="/" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← All Modules</Link>
            </div>
            <div style={{ marginBottom: '2rem' }}>
                <div className="section-header">Module 4</div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>🧱 OOP Concepts</h1>
                <p style={{ opacity: 0.6, fontSize: '0.92rem', marginTop: '0.3rem' }}>
                    Visualize object-oriented principles — memory, polymorphism, and design patterns.
                </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {OOP_SIMS.map((sim, i) => (
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
