import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const OOP_SIMS = [
    {
        path: '/oops/pillars',
        icon: '🏛️',
        label: 'Four Pillars of OOP',
        desc: 'Central Car object transforms live — Encapsulation locks fields, Abstraction grays internals, Inheritance spawns children, Polymorphism fires different responses.',
        color: '#ffd93d',
        badge: 'Encapsulation · Abstraction · Inheritance · Polymorphism · Object · Class',
    },
    {
        path: '/oops/inheritance',
        icon: '🌳',
        label: 'Inheritance & Polymorphism Deep Dive',
        desc: 'Build inheritance trees live. MRO pulses cascade through nodes. Diamond problem lights up red. Runtime dispatch shows reference vs actual type.',
        color: '#66b3ff',
        badge: 'MRO · Dynamic dispatch · Override · Overload · Diamond Problem · Virtual',
    },
    {
        path: '/oops/abstract-interface',
        icon: '📐',
        label: 'Abstract Class vs Interface',
        desc: 'Blueprint boards side by side — filled vs dashed cells. Drop a concrete class and fulfill the contract method by method.',
        color: 'var(--pink)',
        badge: 'Abstract · Interface · Contract · Realization · Multiple inheritance',
    },
    {
        path: '/oops/patterns',
        icon: '🧩',
        label: 'Design Patterns',
        desc: 'Live interactive simulations — Singleton convergence, Factory conveyor belt, Observer pub/sub, Decorator nested rings, Strategy swap.',
        color: '#4dd0c8',
        badge: 'Singleton · Factory · Observer · Decorator · Strategy · GoF',
    },
    {
        path: '/oops/solid',
        icon: '🏗️',
        label: 'SOLID Principles',
        desc: 'Watch BAD class diagrams restructure on screen — methods migrate, interfaces split, dependencies flip. Animated transformation.',
        color: 'var(--purple)',
        badge: 'SRP · OCP · LSP · ISP · DIP · Coupling · Cohesion',
    },
    {
        path: '/oops/uml',
        icon: '📊',
        label: 'UML Diagrams',
        desc: 'Drag-and-drop UML builder — Class, Sequence, Use Case, Activity diagrams. Code-to-UML parser. Pre-built scenarios.',
        color: '#ff8a65',
        badge: 'Class diagram · Sequence · Use case · Activity · Multiplicity · Lifeline',
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
                    Visualize object-oriented principles — four pillars, inheritance trees, design patterns, SOLID principles, and UML diagrams.
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
