import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PillarIcon, TreeIcon, RulerIcon, PuzzleIcon, BuildIcon, ChartIcon } from '../../components/Icons';

const OOP_SIMS = [
    {
        path: '/oops/pillars',
        icon: PillarIcon,
        label: 'Four Pillars of OOP',
        desc: 'Central Car object transforms live \u2014 Encapsulation locks fields, Abstraction grays internals, Inheritance spawns children, Polymorphism fires different responses.',
        color: '#ffd93d',
        badge: 'Encapsulation \u00b7 Abstraction \u00b7 Inheritance \u00b7 Polymorphism \u00b7 Object \u00b7 Class',
    },
    {
        path: '/oops/inheritance',
        icon: TreeIcon,
        label: 'Inheritance & Polymorphism Deep Dive',
        desc: 'Build inheritance trees live. MRO pulses cascade through nodes. Diamond problem lights up red. Runtime dispatch shows reference vs actual type.',
        color: '#66b3ff',
        badge: 'MRO \u00b7 Dynamic dispatch \u00b7 Override \u00b7 Overload \u00b7 Diamond Problem \u00b7 Virtual',
    },
    {
        path: '/oops/abstract-interface',
        icon: RulerIcon,
        label: 'Abstract Class vs Interface',
        desc: 'Blueprint boards side by side \u2014 filled vs dashed cells. Drop a concrete class and fulfill the contract method by method.',
        color: 'var(--pink)',
        badge: 'Abstract \u00b7 Interface \u00b7 Contract \u00b7 Realization \u00b7 Multiple inheritance',
    },
    {
        path: '/oops/patterns',
        icon: PuzzleIcon,
        label: 'Design Patterns',
        desc: 'Live interactive simulations \u2014 Singleton convergence, Factory conveyor belt, Observer pub/sub, Decorator nested rings, Strategy swap.',
        color: '#4dd0c8',
        badge: 'Singleton \u00b7 Factory \u00b7 Observer \u00b7 Decorator \u00b7 Strategy \u00b7 GoF',
    },
    {
        path: '/oops/solid',
        icon: BuildIcon,
        label: 'SOLID Principles',
        desc: 'Watch BAD class diagrams restructure on screen \u2014 methods migrate, interfaces split, dependencies flip. Animated transformation.',
        color: 'var(--purple)',
        badge: 'SRP \u00b7 OCP \u00b7 LSP \u00b7 ISP \u00b7 DIP \u00b7 Coupling \u00b7 Cohesion',
    },
    {
        path: '/oops/uml',
        icon: ChartIcon,
        label: 'UML Diagrams',
        desc: 'Drag-and-drop UML builder \u2014 Class, Sequence, Use Case, Activity diagrams. Code-to-UML parser. Pre-built scenarios.',
        color: '#ff8a65',
        badge: 'Class diagram \u00b7 Sequence \u00b7 Use case \u00b7 Activity \u00b7 Multiplicity \u00b7 Lifeline',
    },
];

export default function OOPSLanding() {
    return (
        <div className="main-content">

            <div style={{ marginBottom: '2rem' }}>
                <div className="section-header">Module 4</div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>OOP Concepts</h1>
                <p style={{ opacity: 0.6, fontSize: '0.92rem', marginTop: '0.3rem' }}>
                    Visualize object-oriented principles \u2014 four pillars, inheritance trees, design patterns, SOLID principles, and UML diagrams.
                </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gridAutoRows: '1fr', gap: '1.25rem' }}>
                {OOP_SIMS.map((sim, i) => (
                    <motion.div key={sim.path} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} style={{ height: '100%' }}>
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
