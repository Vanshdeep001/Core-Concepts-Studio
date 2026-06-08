import { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import {
    ScissorsIcon, PlugIcon, SyncIcon, PlateIcon, ShuffleIcon,
    XIcon, AlertIcon, LinkIcon, CheckIcon, WrenchIcon, ShieldIcon,
    CircleShape, SquareShape, RectShape, TriangleShape, PentagonShape, HexagonShape,
    GearIcon, LaptopIcon, ClockIcon, FoodIcon, CoffeeIcon, SleepIcon,
    ClipboardIcon, HandshakeIcon, BlockIcon, CpuIcon, EmailIcon, PhoneIcon,
    BellIcon, TargetIcon, DiamondIcon, PillarIcon, BuildIcon, LightbulbIcon
} from '../../components/Icons';

/* ── PRINCIPLES DATA ── */
const PRINCIPLES = [
    { id: 'srp', name: 'SRP', full: 'Single Responsibility', color: '#ffd93d' },
    { id: 'ocp', name: 'OCP', full: 'Open/Closed', color: '#66d9ef' },
    { id: 'lsp', name: 'LSP', full: 'Liskov Substitution', color: '#a8e6cf' },
    { id: 'isp', name: 'ISP', full: 'Interface Segregation', color: '#ff6b9d' },
    { id: 'dip', name: 'DIP', full: 'Dependency Inversion', color: '#b39ddb' },
];

const getPrincipleIcon = (id, size = 16) => {
    switch (id) {
        case 'srp': return <ScissorsIcon size={size} />;
        case 'ocp': return <PlugIcon size={size} />;
        case 'lsp': return <SyncIcon size={size} />;
        case 'isp': return <PlateIcon size={size} />;
        case 'dip': return <ShuffleIcon size={size} />;
        default: return null;
    }
};


/* ── SHARED STYLES ── */
const SIM_WRAP = { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'auto', padding: '1rem' };
const DOT_BG = (id) => (
    <svg style={{ position: 'absolute', inset: 0, opacity: 0.05, pointerEvents: 'none' }}>
        <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="1.2" fill="var(--text)" />
        </pattern>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
);
const MINI_INPUT = { border: '2px solid var(--border)', padding: '0.25rem 0.4rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 700, background: 'var(--white)', color: 'var(--text)', outline: 'none', borderRadius: '6px', width: '100%' };

/* ══════════════════════════════════════════════════════════════
   HELPER: Particle burst effect
   ══════════════════════════════════════════════════════════════ */
const Particles = ({ active, color = '#ffd93d', count = 12, cx = 200, cy = 200 }) => {
    if (!active) return null;
    return (
        <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible', zIndex: 50 }}>
            {Array.from({ length: count }).map((_, i) => {
                const angle = (i / count) * Math.PI * 2;
                const dist = 60 + Math.random() * 80;
                return (
                    <motion.circle key={i} cx={cx} cy={cy} r={3 + Math.random() * 3} fill={color}
                        initial={{ opacity: 1, cx, cy }}
                        animate={{ cx: cx + Math.cos(angle) * dist, cy: cy + Math.sin(angle) * dist, opacity: 0, r: 0 }}
                        transition={{ duration: 0.8 + Math.random() * 0.4, ease: 'easeOut' }}
                    />
                );
            })}
        </svg>
    );
};


/* ══════════════════════════════════════════════════════════════
   1. SRP — Swiss Army Knife to Specialized Tools
   ══════════════════════════════════════════════════════════════ */
const SRPSim = () => {
    const [phase, setPhase] = useState('violation');
    const [hoveredTool, setHoveredTool] = useState(null);
    const [particles, setParticles] = useState(false);
    // User input state
    const [className, setClassName] = useState('Employee');
    const [responsibilities, setResponsibilities] = useState([
        { id: 1, name: 'Employee Data', color: '#ffd93d', methods: ['getName()', 'getEmail()', 'setDept()'] },
        { id: 2, name: 'Payroll', color: '#66d9ef', methods: ['calcSalary()', 'calcTax()', 'genPaySlip()'] },
        { id: 3, name: 'Repository', color: '#a8e6cf', methods: ['saveToDB()', 'update()', 'delete()'] },
        { id: 4, name: 'Reporting', color: '#ff6b9d', methods: ['genReport()', 'exportPDF()', 'print()'] },
    ]);
    const [newResp, setNewResp] = useState('');
    const [newMethod, setNewMethod] = useState('');
    const [editingResp, setEditingResp] = useState(null);
    const nextId = useRef(5);
    const RESP_COLORS = ['#ffd93d', '#66d9ef', '#a8e6cf', '#ff6b9d', '#b39ddb', '#ffb347', '#4dd0c8', '#f0a0c0'];

    const addResponsibility = () => {
        if (!newResp.trim()) return;
        setResponsibilities(prev => [...prev, { id: nextId.current++, name: newResp.trim(), color: RESP_COLORS[(responsibilities.length) % RESP_COLORS.length], methods: [] }]);
        setNewResp('');
    };
    const removeResponsibility = (id) => setResponsibilities(prev => prev.filter(r => r.id !== id));
    const addMethodToResp = (respId) => {
        if (!newMethod.trim()) return;
        const m = newMethod.trim().endsWith(')') ? newMethod.trim() : newMethod.trim() + '()';
        setResponsibilities(prev => prev.map(r => r.id === respId ? { ...r, methods: [...r.methods, m] } : r));
        setNewMethod('');
        setEditingResp(null);
    };
    const removeMethod = (respId, methodIdx) => {
        setResponsibilities(prev => prev.map(r => r.id === respId ? { ...r, methods: r.methods.filter((_, i) => i !== methodIdx) } : r));
    };

    const handleApply = () => {
        if (phase === 'violation') {
            setParticles(true);
            setPhase('exploding');
            setTimeout(() => setPhase('clean'), 900);
            setTimeout(() => setParticles(false), 1200);
        } else {
            setPhase('violation');
        }
    };

    const allMethods = responsibilities.flatMap(r => r.methods.map(m => ({ ...r, method: m })));

    return (
        <div style={SIM_WRAP}>
            {DOT_BG('srpGrid')}
            <Particles active={particles} cx={300} cy={250} color="#ffd93d" count={20} />

            <AnimatePresence mode="wait">
                {phase === 'violation' || phase === 'exploding' ? (
                    <motion.div key="knife" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' }}>
                        {/* God class box */}
                        <motion.div
                            animate={phase === 'exploding' ? { scale: [1, 1.1, 0], opacity: [1, 1, 0] } : { rotate: [0, -0.3, 0.3, 0] }}
                            transition={phase === 'exploding' ? { duration: 0.8 } : { duration: 4, repeat: Infinity }}
                            style={{ border: '4px solid #e53e3e', borderRadius: '16px', overflow: 'hidden', maxWidth: 500, boxShadow: '0 0 25px rgba(229,62,62,0.25), 5px 5px 0 var(--border)' }}>
                            <div style={{ background: '#e53e3e', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 900, fontSize: '0.85rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><XIcon size={14} color="#fff" /> {className} (GOD CLASS)</span>
                                <span style={{ fontSize: '0.6rem', color: '#ffcece', fontWeight: 700 }}>{allMethods.length} methods • {responsibilities.length} responsibilities</span>
                            </div>
                            <div style={{ padding: '0.6rem', display: 'flex', flexWrap: 'wrap', gap: '4px', background: 'var(--white)' }}>
                                {responsibilities.map(resp => resp.methods.map((m, mi) => (
                                    <motion.span key={`${resp.id}-${mi}`}
                                        animate={{ opacity: [0.7, 1, 0.7] }}
                                        transition={{ duration: 2, delay: mi * 0.1, repeat: Infinity }}
                                        style={{ padding: '0.2rem 0.5rem', background: resp.color + '30', border: `1.5px solid ${resp.color}`, borderRadius: '5px', fontSize: '0.62rem', fontFamily: 'var(--font-mono)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                        {m} <XIcon size={10} color="#e53e3e" />
                                    </motion.span>
                                )))}
                            </div>
                        </motion.div>
                        <motion.div animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.02, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                            style={{ background: '#fff5f5', border: '2px solid #e53e3e', borderRadius: '8px', padding: '0.35rem 0.8rem', fontSize: '0.68rem', fontWeight: 800, color: '#e53e3e', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <AlertIcon size={14} color="#e53e3e" /> {responsibilities.length} different reasons to change — violates SRP!
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div key="stations" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: 600 }}>
                        {/* Central hub label */}
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                            style={{ background: '#ffd93d', border: '2px solid var(--border)', borderRadius: '20px', padding: '0.3rem 1rem', fontWeight: 900, fontSize: '0.72rem', boxShadow: '3px 3px 0 var(--border)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <LinkIcon size={14} /> {className} — Decomposed
                        </motion.div>
                        {/* Split services grid */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
                            {responsibilities.map((resp, i) => (
                                <motion.div key={resp.id}
                                    initial={{ scale: 0, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.1 + i * 0.1, type: 'spring', stiffness: 200 }}
                                    onMouseEnter={() => setHoveredTool(resp.id)}
                                    onMouseLeave={() => setHoveredTool(null)}
                                    style={{
                                        width: 155, background: 'var(--white)',
                                        border: `3px solid ${hoveredTool === resp.id ? resp.color : 'var(--border)'}`,
                                        borderRadius: '12px', overflow: 'hidden',
                                        boxShadow: hoveredTool === resp.id ? `0 0 18px ${resp.color}40, 4px 4px 0 var(--border)` : '4px 4px 0 var(--border)',
                                        transition: 'border-color 0.2s, box-shadow 0.2s',
                                    }}>
                                    <div style={{ background: resp.color, padding: '0.3rem 0.5rem', borderBottom: '2px solid var(--border)', fontWeight: 800, fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <CheckIcon size={12} /> {resp.name}
                                    </div>
                                    <div style={{ padding: '0.35rem 0.4rem' }}>
                                        {resp.methods.map((m, mi) => (
                                            <div key={mi} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 600, padding: '0.1rem 0.25rem', borderRadius: '3px', marginBottom: '2px', background: `${resp.color}18` }}>
                                                {m}
                                            </div>
                                        ))}
                                        {resp.methods.length === 0 && <div style={{ fontSize: '0.55rem', opacity: 0.4, fontStyle: 'italic' }}>No methods</div>}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                            style={{ background: '#f0fff4', border: '2px solid #38a169', borderRadius: '8px', padding: '0.3rem 0.8rem', fontSize: '0.66rem', fontWeight: 800, color: '#38a169', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <CheckIcon size={14} color="#38a169" /> Each class has exactly ONE reason to change
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button className="btn btn-sm" style={{ background: phase === 'clean' ? '#a8e6cf' : '#ffd93d', marginTop: '0.75rem', zIndex: 2, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                onClick={handleApply}>
                {phase === 'clean' ? (<><SyncIcon size={14} /> Show God Class</>) : (<><ScissorsIcon size={14} /> Split Responsibilities</>)}
            </button>
        </div>
    );
};


/* ══════════════════════════════════════════════════════════════
   2. OCP — Plug & Play Interface Extension
   ══════════════════════════════════════════════════════════════ */
const OCPSim = () => {
    const [applied, setApplied] = useState(false);
    const [drilling, setDrilling] = useState(false);
    const [pluggedExtras, setPluggedExtras] = useState([]);
    const [customName, setCustomName] = useState('');
    const [customFormula, setCustomFormula] = useState('');
    const nextCustom = useRef(100);
    const CUSTOM_COLORS = ['#ff6b9d', '#b39ddb', '#ffb347', '#4dd0c8', '#f0a0c0', '#90cdf4'];

    const baseShapes = [
        { id: 'circle', icon: CircleShape, name: 'Circle', formula: 'π·r²', color: '#66d9ef' },
        { id: 'square', icon: SquareShape, name: 'Square', formula: 's²', color: '#ffd93d' },
        { id: 'rect', icon: RectShape, name: 'Rectangle', formula: 'l×w', color: '#a8e6cf' },
    ];
    const presetExtras = [
        { id: 'triangle', icon: TriangleShape, name: 'Triangle', formula: '½·b·h', color: '#ff6b9d' },
        { id: 'pentagon', icon: PentagonShape, name: 'Pentagon', formula: '¼√5·s²', color: '#b39ddb' },
    ];

    const handleDrill = () => {
        setDrilling(true);
        setTimeout(() => setDrilling(false), 1200);
    };

    const handlePlugShape = (shape) => {
        if (pluggedExtras.find(s => s.id === shape.id)) return;
        setPluggedExtras(prev => [...prev, shape]);
    };

    const handleAddCustom = () => {
        if (!customName.trim()) return;
        const shape = {
            id: `custom_${nextCustom.current++}`,
            icon: DiamondIcon,
            name: customName.trim(),
            formula: customFormula.trim() || '?',
            color: CUSTOM_COLORS[pluggedExtras.length % CUSTOM_COLORS.length],
        };
        setPluggedExtras(prev => [...prev, shape]);
        setCustomName('');
        setCustomFormula('');
    };

    return (
        <div style={SIM_WRAP}>
            {DOT_BG('ocpGrid')}

            <AnimatePresence mode="wait">
                {!applied ? (
                    <motion.div key="violation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' }}>
                        {/* Hardcoded calculator */}
                        <motion.div
                            animate={drilling ? { x: [-2, 2, -2, 2, 0] } : {}}
                            transition={{ duration: 0.3 }}
                            style={{
                                border: `3px solid ${drilling ? '#e53e3e' : 'var(--border)'}`, borderRadius: '14px',
                                overflow: 'hidden', width: 400, background: 'var(--white)',
                                boxShadow: drilling ? '0 0 25px rgba(229,62,62,0.3), 5px 5px 0 var(--border)' : '5px 5px 0 var(--border)',
                                transition: 'border-color 0.3s',
                            }}>
                            <div style={{ background: drilling ? '#e53e3e' : '#f8f9fa', padding: '0.5rem 0.8rem', borderBottom: '2px solid var(--border)', fontWeight: 900, fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: drilling ? '#fff' : 'var(--text)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><XIcon size={14} /> AreaCalculator</span>
                                {drilling && <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.3, repeat: 4 }} style={{ fontSize: '0.65rem' }}>CRACKING OPEN!</motion.span>}
                            </div>
                            <pre style={{ padding: '0.7rem 0.9rem', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', margin: 0, background: '#0f172a', color: '#e2e8f0', lineHeight: 1.7, position: 'relative' }}>
                                {drilling && <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                                    style={{ position: 'absolute', top: '40%', left: 10, right: 10, height: 2, background: '#e53e3e', transformOrigin: 'left', opacity: 0.7 }} />}
{`calculateArea(shape) {
  if (shape == "Circle")   → π * r²
  else if (shape == "Square")    → s * s
  else if (shape == "Rect")      → l * w`}
                                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}
                                    style={{ color: '#e53e3e' }}>{`
  // Adding Triangle = MODIFY this! `}</motion.span>
                                <span style={{ color: '#e53e3e', display: 'inline-flex', verticalAlign: 'middle' }}><XIcon size={10} color="#e53e3e" /></span>
{`
}`}
                            </pre>
                        </motion.div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-sm" style={{ background: '#e53e3e', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={handleDrill}>
                                <WrenchIcon size={14} /> Try Adding Shape
                            </button>
                            <button className="btn btn-sm" style={{ background: '#66d9ef', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => setApplied(true)}>
                                <PlugIcon size={14} /> Apply OCP
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="clean" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: 560 }}>

                        {/* Interface header */}
                        <motion.div initial={{ y: -10 }} animate={{ y: 0 }}
                            style={{ background: '#f0fff4', border: '3px solid #38a169', borderRadius: '12px', padding: '0.4rem 1.2rem', textAlign: 'center', boxShadow: '4px 4px 0 var(--border)' }}>
                            <div style={{ fontWeight: 900, fontSize: '0.75rem', color: '#38a169' }}>«interface» Shape</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', opacity: 0.7 }}>+ area(): double</div>
                        </motion.div>

                        {/* Connector lines */}
                        <div style={{ width: 2, height: 16, background: '#38a169' }} />

                        {/* Shape implementations */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'center' }}>
                            {[...baseShapes, ...pluggedExtras].map((s, i) => {
                                const ShapeIcon = s.icon;
                                return (
                                    <motion.div key={s.id}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: i * 0.08, type: 'spring', stiffness: 250 }}
                                        style={{
                                            width: 90, background: 'var(--white)', border: `3px solid ${s.color}`,
                                            borderRadius: '12px', padding: '0.5rem', textAlign: 'center',
                                            boxShadow: '3px 3px 0 var(--border)', position: 'relative',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                        <span style={{ color: s.color, display: 'inline-flex', marginBottom: '0.3rem' }}>
                                            {ShapeIcon && <ShapeIcon size={24} />}
                                        </span>
                                        <div style={{ fontWeight: 800, fontSize: '0.68rem' }}>{s.name}</div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', opacity: 0.5 }}>{s.formula}</div>
                                        {i >= baseShapes.length && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, background: '#38a169', borderRadius: '50%', fontSize: '0.55rem', color: '#fff', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--border)' }}><CheckIcon size={10} color="#fff" /></motion.div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Plug in presets */}
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {presetExtras.filter(s => !pluggedExtras.find(p => p.id === s.id)).map(s => {
                                const ShapeIcon = s.icon;
                                return (
                                    <motion.button key={s.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                        onClick={() => handlePlugShape(s)}
                                        style={{ background: `${s.color}15`, border: `2px solid ${s.color}`, borderRadius: '8px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.68rem', fontFamily: 'var(--font-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        {ShapeIcon && <ShapeIcon size={16} color={s.color} />} + {s.name}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Custom shape input */}
                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', background: 'var(--white)', border: '2px solid var(--border)', borderRadius: '8px', padding: '0.35rem 0.5rem' }}>
                            <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Shape name"
                                style={{ ...MINI_INPUT, width: 100 }} onKeyDown={e => e.key === 'Enter' && handleAddCustom()} />
                            <input value={customFormula} onChange={e => setCustomFormula(e.target.value)} placeholder="formula"
                                style={{ ...MINI_INPUT, width: 80 }} onKeyDown={e => e.key === 'Enter' && handleAddCustom()} />
                            <button className="btn btn-sm" style={{ background: '#38a169', color: '#fff', fontSize: '0.65rem' }} onClick={handleAddCustom}>+ Plug In</button>
                        </div>

                        {pluggedExtras.length > 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                style={{ background: '#f0fff4', border: '2px solid #38a169', borderRadius: '8px', padding: '0.3rem 0.8rem', fontSize: '0.65rem', fontWeight: 800, color: '#38a169', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <ShieldIcon size={14} color="#38a169" /> {pluggedExtras.length} new shape{pluggedExtras.length > 1 ? 's' : ''} added — ZERO existing code modified!
                            </motion.div>
                        )}

                        <button className="btn btn-sm" style={{ background: '#a8e6cf', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            onClick={() => { setApplied(false); setPluggedExtras([]); }}>
                            <SyncIcon size={14} /> Show Violation
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


/* ══════════════════════════════════════════════════════════════
   3. LSP — Substitutability Tester
   ══════════════════════════════════════════════════════════════ */
const LSPSim = () => {
    const [showClean, setShowClean] = useState(false);
    const [testResults, setTestResults] = useState([]);
    const [testing, setTesting] = useState(false);
    // User input
    const [parentName, setParentName] = useState('Rectangle');
    const [parentW, setParentW] = useState(10);
    const [parentH, setParentH] = useState(5);
    const [childName, setChildName] = useState('Square');
    const [childSize, setChildSize] = useState(10);
    const timers = useRef([]);

    useEffect(() => () => timers.current.forEach(t => clearTimeout(t)), []);

    const expectedArea = parentW * parentH; // parent contract
    const childArea = showClean ? (childSize * childSize) : (childSize * childSize); // in violation, square forces both dims equal
    const violationChildArea = childSize * childSize; // square always squares it
    const isViolation = !showClean && violationChildArea !== expectedArea;

    const runTest = () => {
        setTesting(true);
        setTestResults([]);

        // Test parent first
        timers.current.push(setTimeout(() => {
            setTestResults(prev => [...prev, { name: parentName, w: parentW, h: parentH, area: parentW * parentH, expected: expectedArea, pass: true }]);
        }, 800));

        // Test child
        timers.current.push(setTimeout(() => {
            const childActualArea = showClean ? childSize * childSize : childSize * childSize;
            const passes = showClean || childActualArea === expectedArea;
            setTestResults(prev => [...prev, { name: childName, w: showClean ? childSize : childSize, h: showClean ? childSize : childSize, area: childActualArea, expected: expectedArea, pass: passes }]);
        }, 1800));

        timers.current.push(setTimeout(() => setTesting(false), 2200));
    };

    return (
        <div style={SIM_WRAP}>
            {DOT_BG('lspGrid')}

            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
                {/* Test configuration */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: 200 }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.5 }}>Configure Test</div>
                    {/* Parent */}
                    <div style={{ border: '2px solid var(--border)', borderRadius: '10px', overflow: 'hidden', background: 'var(--white)', boxShadow: '3px 3px 0 var(--border)' }}>
                        <div style={{ background: '#66d9ef', padding: '0.3rem 0.6rem', borderBottom: '2px solid var(--border)', fontWeight: 800, fontSize: '0.68rem' }}>Parent Class</div>
                        <div style={{ padding: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <input value={parentName} onChange={e => setParentName(e.target.value)} style={MINI_INPUT} placeholder="Class name" />
                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.55rem', fontWeight: 700, opacity: 0.5 }}>Width</div>
                                    <input type="number" value={parentW} onChange={e => setParentW(Number(e.target.value) || 1)} style={{ ...MINI_INPUT, width: '100%' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.55rem', fontWeight: 700, opacity: 0.5 }}>Height</div>
                                    <input type="number" value={parentH} onChange={e => setParentH(Number(e.target.value) || 1)} style={{ ...MINI_INPUT, width: '100%' }} />
                                </div>
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', background: '#f8f9fa', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                area() = {parentW} × {parentH} = <strong>{parentW * parentH}</strong>
                            </div>
                        </div>
                    </div>
                    {/* Child */}
                    <div style={{ border: `2px solid ${showClean ? '#38a169' : '#e53e3e'}`, borderRadius: '10px', overflow: 'hidden', background: 'var(--white)', boxShadow: '3px 3px 0 var(--border)', transition: 'border-color 0.3s' }}>
                        <div style={{ background: showClean ? '#a8e6cf' : '#ffd93d', padding: '0.3rem 0.6rem', borderBottom: '2px solid var(--border)', fontWeight: 800, fontSize: '0.68rem' }}>
                            Child: {showClean ? 'implements Shape' : `extends ${parentName}`}
                        </div>
                        <div style={{ padding: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <input value={childName} onChange={e => setChildName(e.target.value)} style={MINI_INPUT} placeholder="Child name" />
                            <div>
                                <div style={{ fontSize: '0.55rem', fontWeight: 700, opacity: 0.5 }}>Side (forces w=h)</div>
                                <input type="number" value={childSize} onChange={e => setChildSize(Number(e.target.value) || 1)} style={MINI_INPUT} />
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', background: '#f8f9fa', padding: '0.2rem 0.4rem', borderRadius: '4px', border: `1px solid ${showClean ? '#38a169' : isViolation ? '#e53e3e' : 'var(--border)'}` }}>
                                area() = {childSize} × {childSize} = <strong style={{ color: !showClean && isViolation ? '#e53e3e' : '#38a169' }}>{childSize * childSize}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Test machine visualization */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', flex: 1, minWidth: 260 }}>
                    {/* The substitutability test machine */}
                    <div style={{
                        width: 280, border: `3px solid ${testing ? '#66d9ef' : 'var(--border)'}`, borderRadius: '16px',
                        overflow: 'hidden', background: 'var(--white)', boxShadow: '5px 5px 0 var(--border)',
                        transition: 'border-color 0.3s',
                    }}>
                        <div style={{ background: testing ? '#66d9ef' : '#f8f9fa', padding: '0.5rem 0.8rem', borderBottom: '2px solid var(--border)', fontWeight: 900, fontSize: '0.78rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                            {testing && <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-flex' }}><GearIcon size={14} /></motion.span>}
                            <SyncIcon size={16} /> Substitutability Checker
                            {testing && <motion.span animate={{ rotate: -360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-flex' }}><GearIcon size={14} /></motion.span>}
                        </div>
                        <div style={{ padding: '0.6rem', textAlign: 'center' }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', opacity: 0.6, marginBottom: '0.3rem' }}>Contract: area() must return</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 900, color: '#66d9ef' }}>{expectedArea}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', opacity: 0.4 }}>({parentW} × {parentH})</div>
                        </div>
                    </div>

                    {/* Test results */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: 280 }}>
                        <AnimatePresence>
                            {testResults.map((r, i) => (
                                <motion.div key={i}
                                    initial={{ x: -30, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ type: 'spring' }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        padding: '0.5rem 0.7rem', borderRadius: '10px',
                                        border: `2px solid ${r.pass ? '#38a169' : '#e53e3e'}`,
                                        background: r.pass ? '#f0fff4' : '#fff5f5',
                                        boxShadow: '3px 3px 0 var(--border)',
                                    }}>
                                    <motion.div
                                        animate={r.pass ? { scale: [1, 1.2, 1] } : { rotate: [0, 10, -10, 10, -10, 0] }}
                                        transition={{ duration: r.pass ? 0.4 : 0.5 }}
                                        style={{ fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center' }}>
                                        {r.pass ? <CheckIcon size={20} color="#38a169" /> : <AlertIcon size={20} color="#e53e3e" />}
                                    </motion.div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.72rem' }}>{r.name}</div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', opacity: 0.7 }}>
                                            area() → {r.area} {r.pass ? '= ' : '≠ '} expected {r.expected}
                                        </div>
                                    </div>
                                    <span style={{ fontWeight: 900, fontSize: '0.7rem', color: r.pass ? '#38a169' : '#e53e3e' }}>
                                        {r.pass ? 'PASS' : 'FAIL'}
                                    </span>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {testResults.length >= 2 && !testResults[1].pass && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                style={{ background: '#fff5f5', border: '2px solid #e53e3e', borderRadius: '8px', padding: '0.4rem 0.6rem', fontSize: '0.62rem', color: '#c53030', fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'center' }}>
                                <AlertIcon size={14} color="#e53e3e" /> <span>{childName} cannot substitute {parentName} — setting width also sets height, breaking contract!</span>
                            </motion.div>
                        )}
                        {testResults.length >= 2 && testResults[1].pass && showClean && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                style={{ background: '#f0fff4', border: '2px solid #38a169', borderRadius: '8px', padding: '0.4rem 0.6rem', fontSize: '0.62rem', color: '#38a169', fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'center' }}>
                                <CheckIcon size={14} color="#38a169" /> <span>Both implement Shape independently — no forced inheritance!</span>
                            </motion.div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-sm" style={{ background: showClean ? '#ffd93d' : '#a8e6cf', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            onClick={() => { setShowClean(!showClean); setTestResults([]); }}>
                            {showClean ? (<><SyncIcon size={14} /> Show Violation</>) : (<><CheckIcon size={14} /> Fix Design</>)}
                        </button>
                        <button className="btn btn-sm" style={{ background: '#66d9ef', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            onClick={runTest} disabled={testing}>
                            <SyncIcon size={14} /> Run Test
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


/* ══════════════════════════════════════════════════════════════
   4. ISP — Restaurant Menu 🍽️
   ══════════════════════════════════════════════════════════════ */
const DEFAULT_MENU_ITEMS = [
    { id: 'work', name: 'work()', cat: 'workable', icon: GearIcon, canRobot: true },
    { id: 'code', name: 'code()', cat: 'workable', icon: LaptopIcon, canRobot: true },
    { id: 'overtime', name: 'overtime()', cat: 'workable', icon: ClockIcon, canRobot: true },
    { id: 'eat', name: 'eat()', cat: 'eatable', icon: FoodIcon, canRobot: false },
    { id: 'takeBreak', name: 'takeBreak()', cat: 'eatable', icon: CoffeeIcon, canRobot: false },
    { id: 'sleep', name: 'sleep()', cat: 'sleepable', icon: SleepIcon, canRobot: false },
    { id: 'manage', name: 'manage()', cat: 'manageable', icon: ClipboardIcon, canRobot: false },
    { id: 'meetClient', name: 'meetClient()', cat: 'manageable', icon: HandshakeIcon, canRobot: false },
];

const ISPSim = () => {
    const [applied, setApplied] = useState(false);
    const [robotReaction, setRobotReaction] = useState(null);
    const [menuItems, setMenuItems] = useState(DEFAULT_MENU_ITEMS);
    const [newMethod, setNewMethod] = useState('');
    const [newCat, setNewCat] = useState('workable');
    const [newCanRobot, setNewCanRobot] = useState(true);
    const nextItem = useRef(100);

    const handleMenuItemHover = (item) => {
        if (!applied && !item.canRobot) setRobotReaction('confused');
        else setRobotReaction(null);
    };

    const addMethod = () => {
        if (!newMethod.trim()) return;
        const m = newMethod.trim().endsWith(')') ? newMethod.trim() : newMethod.trim() + '()';
        setMenuItems(prev => [...prev, { id: `custom_${nextItem.current++}`, name: m, cat: newCat, icon: newCanRobot ? WrenchIcon : BlockIcon, canRobot: newCanRobot }]);
        setNewMethod('');
    };

    const cats = [...new Set(menuItems.map(i => i.cat))];
    const catLabels = { workable: 'IWorkable', eatable: 'IEatable', sleepable: 'ISleepable', manageable: 'IManageable' };
    const catColors = { workable: '#a8e6cf', eatable: '#ffd93d', sleepable: '#66d9ef', manageable: '#b39ddb' };
    const catFor = { workable: 'Robot', eatable: 'Human', sleepable: 'Human', manageable: 'Manager' };

    return (
        <div style={SIM_WRAP}>
            {DOT_BG('ispGrid')}

            <AnimatePresence mode="wait">
                {!applied ? (
                    <motion.div key="fat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {/* Fat menu */}
                        <motion.div animate={{ rotate: [0, -0.3, 0.3, 0] }} transition={{ duration: 5, repeat: Infinity }}
                            style={{ width: 230, background: 'var(--white)', border: '3px solid #d69e2e', borderRadius: '14px', overflow: 'hidden', boxShadow: '5px 5px 0 var(--border)' }}>
                            <div style={{ background: '#d69e2e', padding: '0.45rem 0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', fontWeight: 900, fontSize: '0.78rem', color: '#fff', borderBottom: '2px solid #b7791f' }}>
                                <FileIcon size={16} /> IWorker — MEGA MENU
                            </div>
                            <div style={{ padding: '0.4rem', maxHeight: 280, overflowY: 'auto' }}>
                                {menuItems.map(item => {
                                    const ItemIcon = item.icon;
                                    return (
                                        <motion.div key={item.id}
                                            onMouseEnter={() => handleMenuItemHover(item)}
                                            onMouseLeave={() => setRobotReaction(null)}
                                            whileHover={{ x: 3 }}
                                            style={{
                                                padding: '0.25rem 0.45rem', marginBottom: '3px', borderRadius: '6px',
                                                display: 'flex', alignItems: 'center', gap: '0.35rem',
                                                fontSize: '0.68rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                                                background: item.canRobot ? '#c6f6d520' : '#fed7d720',
                                                border: `1.5px solid ${item.canRobot ? '#38a16940' : '#e53e3e40'}`,
                                                cursor: 'default',
                                            }}>
                                            {ItemIcon && <ItemIcon size={14} />}
                                            <span style={{ flex: 1 }}>{item.name}</span>
                                            {!item.canRobot && <span style={{ fontSize: '0.5rem', color: '#e53e3e', fontWeight: 900 }}>N/A</span>}
                                        </motion.div>
                                    );
                                })}
                            </div>
                            <div style={{ background: '#fff5f5', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', fontSize: '0.55rem', fontWeight: 800, color: '#e53e3e', borderTop: '2px solid #e53e3e40' }}>
                                <AlertIcon size={12} color="#e53e3e" /> {menuItems.length} items — Robot can only use {menuItems.filter(i => i.canRobot).length}!
                            </div>
                        </motion.div>

                        {/* Robot */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                            <motion.div
                                animate={robotReaction === 'confused' ? { rotate: [0, -8, 8, -4, 4, 0] } : {}}
                                transition={{ duration: 0.5 }}
                                style={{
                                    width: 90, height: 110, background: '#e2e8f0', borderRadius: '18px',
                                    border: '3px solid var(--border)', display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '4px 4px 0 var(--border)', position: 'relative',
                                }}>
                                <CpuIcon size={36} color="var(--text)" />
                                <AnimatePresence>
                                    {robotReaction === 'confused' && (
                                        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                                            style={{ position: 'absolute', top: -12, right: -12, display: 'inline-flex' }}>
                                            <AlertIcon size={16} color="#e53e3e" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                            <span style={{ fontWeight: 800, fontSize: '0.72rem' }}>Robot</span>
                            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2.5, repeat: Infinity }}
                                style={{ fontSize: '0.58rem', fontWeight: 700, color: '#e53e3e', textAlign: 'center', maxWidth: 110 }}>
                                "Why must I implement sleep() and eat()?"
                            </motion.div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="split" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {cats.map((cat, i) => (
                            <motion.div key={cat}
                                initial={{ scale: 0, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
                                style={{
                                    width: 135, background: 'var(--white)', borderRadius: '12px', overflow: 'hidden',
                                    border: `3px solid ${catColors[cat] || '#ccc'}`, boxShadow: '4px 4px 0 var(--border)',
                                }}>
                                <div style={{ background: catColors[cat] || '#ddd', padding: '0.3rem 0.5rem', borderBottom: '2px solid var(--border)', fontWeight: 800, fontSize: '0.65rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                                    <ScissorsIcon size={14} /> {catLabels[cat] || `I${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
                                </div>
                                <div style={{ padding: '0.3rem' }}>
                                    {menuItems.filter(i => i.cat === cat).map(item => {
                                        const ItemIcon = item.icon;
                                        return (
                                            <div key={item.id} style={{
                                                padding: '0.15rem 0.3rem', marginBottom: '2px', borderRadius: '4px',
                                                background: `${catColors[cat] || '#ddd'}18`, fontSize: '0.6rem', fontWeight: 700,
                                                fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '0.25rem',
                                            }}>
                                                {ItemIcon && <ItemIcon size={12} />} <span>{item.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div style={{ background: '#f8f9fa', padding: '0.15rem', textAlign: 'center', fontSize: '0.5rem', fontWeight: 800, borderTop: '1.5px solid var(--border)', color: '#555' }}>
                                    → {catFor[cat] || 'Custom'}
                                </div>
                            </motion.div>
                        ))}

                        {/* Happy Robot */}
                        <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                            <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CpuIcon size={36} color="#38a169" />
                            </motion.div>
                            <span style={{ fontWeight: 800, fontSize: '0.65rem' }}>Robot</span>
                            <span style={{ fontSize: '0.52rem', color: '#38a169', fontWeight: 700, textAlign: 'center' }}>implements only<br />IWorkable ✓</span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button className="btn btn-sm" style={{ background: applied ? '#a8e6cf' : '#ff6b9d', marginTop: '0.8rem', zIndex: 2, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                onClick={() => setApplied(!applied)}>
                {applied ? (<><SyncIcon size={14} /> Show Fat Interface</>) : (<><ScissorsIcon size={14} /> Split Interfaces (Apply ISP)</>)}
            </button>
        </div>
    );
};


/* ══════════════════════════════════════════════════════════════
   5. DIP — Dependency Flow Diagram
   ══════════════════════════════════════════════════════════════ */
const DIPSim = () => {
    const [applied, setApplied] = useState(false);
    const [activePuppet, setActivePuppet] = useState(0);
    const [shaking, setShaking] = useState(false);
    // User input
    const [highLevelName, setHighLevelName] = useState('NotificationService');
    const [interfaceName, setInterfaceName] = useState('MessageSender');
    const [implementations, setImplementations] = useState([
        { id: 'email', name: 'EmailSender', icon: EmailIcon, color: '#66d9ef' },
        { id: 'sms', name: 'SMSSender', icon: PhoneIcon, color: '#a8e6cf' },
        { id: 'push', name: 'PushSender', icon: BellIcon, color: '#ffd93d' },
    ]);
    const [newImplName, setNewImplName] = useState('');
    const nextImpl = useRef(100);
    const IMPL_COLORS = ['#ff6b9d', '#b39ddb', '#ffb347', '#4dd0c8', '#f0a0c0'];

    useEffect(() => {
        if (!applied) {
            const interval = setInterval(() => {
                setShaking(true);
                setTimeout(() => setShaking(false), 500);
            }, 3500);
            return () => clearInterval(interval);
        }
    }, [applied]);

    const addImpl = () => {
        if (!newImplName.trim()) return;
        setImplementations(prev => [...prev, {
            id: `impl_${nextImpl.current++}`,
            name: newImplName.trim(),
            icon: DiamondIcon,
            color: IMPL_COLORS[(implementations.length) % IMPL_COLORS.length],
        }]);
        setNewImplName('');
    };

    return (
        <div style={SIM_WRAP}>
            {DOT_BG('dipGrid')}

            <AnimatePresence mode="wait">
                {!applied ? (
                    <motion.div key="violation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>

                        {/* High-level module */}
                        <motion.div
                            animate={shaking ? { x: [-3, 3, -3, 0] } : {}}
                            transition={{ duration: 0.3 }}
                            style={{
                                width: 220, background: 'var(--white)',
                                border: `3px solid ${shaking ? '#e53e3e' : 'var(--border)'}`,
                                borderRadius: '14px', padding: '0.6rem', textAlign: 'center',
                                boxShadow: shaking ? '0 0 20px rgba(229,62,62,0.25), 4px 4px 0 var(--border)' : '4px 4px 0 var(--border)',
                                transition: 'border-color 0.3s, box-shadow 0.3s',
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.1rem' }}>
                                <TargetIcon size={24} />
                            </div>
                            <div style={{ fontWeight: 900, fontSize: '0.82rem' }}>{highLevelName}</div>
                            <div style={{ fontSize: '0.55rem', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase' }}>HIGH-LEVEL MODULE</div>
                        </motion.div>

                        {/* Rigid rod connection */}
                        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <motion.div
                                animate={shaking ? { scaleY: [1, 0.95, 1.05, 1] } : {}}
                                style={{ width: 6, height: 50, background: '#e53e3e', borderRadius: '3px', boxShadow: '0 0 8px rgba(229,62,62,0.3)' }} />
                            <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', background: '#e53e3e', borderRadius: '6px', padding: '0.15rem 0.5rem', fontSize: '0.5rem', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap' }}>
                                DIRECT DEPENDENCY ↓
                            </div>
                        </div>

                        {/* Low-level module */}
                        <motion.div
                            animate={shaking ? { x: [3, -3, 3, 0], rotate: [1, -1, 1, 0] } : {}}
                            transition={{ duration: 0.3 }}
                            style={{
                                width: 220, background: 'var(--white)',
                                border: `3px solid ${shaking ? '#e53e3e' : 'var(--border)'}`,
                                borderRadius: '14px', padding: '0.6rem', textAlign: 'center',
                                boxShadow: '4px 4px 0 var(--border)', transition: 'border-color 0.3s',
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0.3rem 0' }}>
                                <EmailIcon size={24} />
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '0.78rem' }}>{implementations[0]?.name || 'EmailSender'}</div>
                            <div style={{ fontSize: '0.55rem', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase' }}>LOW-LEVEL MODULE</div>
                            <motion.div animate={shaking ? { opacity: [0, 1, 0] } : { opacity: 0 }}
                                style={{ fontSize: '0.58rem', color: '#e53e3e', fontWeight: 800, marginTop: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                                <AlertIcon size={12} color="#e53e3e" /> <span>Changes here break above!</span>
                            </motion.div>
                        </motion.div>

                        <div style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 700, textAlign: 'center', maxWidth: 280, marginTop: '0.3rem' }}>
                            Can't swap to SMS or Push without modifying {highLevelName}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="clean" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>

                        {/* High-level module */}
                        <motion.div initial={{ y: -10 }} animate={{ y: 0 }}
                            style={{
                                width: 220, background: 'var(--white)', border: '3px solid #38a169',
                                borderRadius: '14px', padding: '0.6rem', textAlign: 'center',
                                boxShadow: '0 0 12px rgba(56,161,105,0.15), 4px 4px 0 var(--border)',
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.1rem' }}>
                                <TargetIcon size={24} />
                            </div>
                            <div style={{ fontWeight: 900, fontSize: '0.82rem' }}>{highLevelName}</div>
                            <div style={{ fontSize: '0.55rem', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase' }}>HIGH-LEVEL (STABLE)</div>
                        </motion.div>

                        {/* Connection to interface */}
                        <div style={{ width: 2, height: 14, background: '#38a169' }} />

                        {/* Abstraction interface */}
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring' }}
                            style={{
                                background: '#b39ddb20', border: '3px solid #b39ddb', borderRadius: '20px',
                                padding: '0.4rem 1.2rem', textAlign: 'center', boxShadow: '4px 4px 0 var(--border)',
                            }}>
                            <div style={{ fontWeight: 800, fontSize: '0.62rem', color: '#7c3aed' }}>«interface»</div>
                            <div style={{ fontWeight: 900, fontSize: '0.78rem' }}>{interfaceName}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', opacity: 0.5 }}>+ send(msg): void</div>
                        </motion.div>

                        {/* Branching lines */}
                        <svg width={Math.max(implementations.length * 100, 200)} height="20" style={{ overflow: 'visible' }}>
                            {implementations.map((impl, i) => {
                                const cx = (Math.max(implementations.length * 100, 200)) / 2;
                                const spacing = 100;
                                const startX = cx - ((implementations.length - 1) * spacing) / 2;
                                const px = startX + i * spacing;
                                return (
                                    <motion.line key={impl.id}
                                        x1={cx} y1={0} x2={px} y2={20}
                                        stroke={i === activePuppet ? impl.color : '#ccc'}
                                        strokeWidth={i === activePuppet ? 2.5 : 1.5}
                                        strokeDasharray={i === activePuppet ? '' : '4 3'}
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                                    />
                                );
                            })}
                        </svg>

                        {/* Implementation modules */}
                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {implementations.map((impl, i) => (
                                <motion.div key={impl.id}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.35 + i * 0.1, type: 'spring' }}
                                    onClick={() => setActivePuppet(i)}
                                    style={{
                                        width: 95, background: 'var(--white)',
                                        border: `3px solid ${i === activePuppet ? impl.color : 'var(--border)'}`,
                                        borderRadius: '12px', padding: '0.4rem', textAlign: 'center', cursor: 'pointer',
                                        boxShadow: i === activePuppet ? `0 0 12px ${impl.color}35, 3px 3px 0 var(--border)` : '3px 3px 0 var(--border)',
                                        transition: 'border-color 0.2s, box-shadow 0.2s',
                                    }}>
                                    <motion.div animate={i === activePuppet ? { y: [0, -3, 0] } : {}}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 28, margin: '0.2rem 0' }}>
                                        {impl.icon && <impl.icon size={24} color={i === activePuppet ? impl.color : 'var(--text)'} />}
                                    </motion.div>
                                    <div style={{ fontWeight: 800, fontSize: '0.6rem' }}>{impl.name}</div>
                                    {i === activePuppet && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            style={{ fontSize: '0.48rem', color: '#38a169', fontWeight: 800, marginTop: '0.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.1rem' }}>ACTIVE <CheckIcon size={10} color="#38a169" /></motion.div>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* Add custom implementation */}
                        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', background: 'var(--white)', border: '2px solid var(--border)', borderRadius: '8px', padding: '0.3rem 0.5rem' }}>
                            <input value={newImplName} onChange={e => setNewImplName(e.target.value)} placeholder="New sender name"
                                style={{ ...MINI_INPUT, width: 130 }} onKeyDown={e => e.key === 'Enter' && addImpl()} />
                            <button className="btn btn-sm" style={{ background: '#b39ddb', fontSize: '0.62rem' }} onClick={addImpl}>+ Add</button>
                        </div>

                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                            style={{ fontSize: '0.6rem', fontWeight: 700, color: '#38a169', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                            <span>Click any implementation to swap — {highLevelName} is unaffected!</span> <ShuffleIcon size={12} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button className="btn btn-sm" style={{ background: applied ? '#a8e6cf' : '#b39ddb', marginTop: '0.5rem', zIndex: 2, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                onClick={() => { setApplied(!applied); setActivePuppet(0); }}>
                {applied ? (<><SyncIcon size={14} /> Show Direct Coupling</>) : (<><ShuffleIcon size={14} /> Invert Dependencies</>)}
            </button>
        </div>
    );
};


/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function SolidPrinciplesSim() {
    const [activePrinciple, setActivePrinciple] = useState('srp');
    const [speed, setSpeed] = useState(700);
    const active = PRINCIPLES.find(p => p.id === activePrinciple);

    const descriptions = {
        srp: { title: 'Single Responsibility Principle', text: 'A class should have only ONE reason to change. Each class should have a single, well-defined purpose.', insight: 'The God Class anti-pattern puts everything in one class. SRP splits responsibilities into focused services — easier to test, maintain, and extend.' },
        ocp: { title: 'Open/Closed Principle', text: 'Software entities should be OPEN for extension but CLOSED for modification. Add new behavior without changing existing code.', insight: 'Instead of an ever-growing if/else chain, define an interface. New types simply implement it — zero changes to existing code.' },
        lsp: { title: 'Liskov Substitution Principle', text: 'Objects of a superclass should be replaceable with objects of its subclasses without affecting correctness.', insight: 'The classic Square-Rectangle problem: a Square IS NOT a valid Rectangle subtype because setting width independently breaks the contract.' },
        isp: { title: 'Interface Segregation Principle', text: 'No client should be forced to depend on interfaces it does not use. Prefer many small interfaces to one large one.', insight: 'A Robot shouldn\'t implement eat() and sleep() just because it implements IWorker. Split the fat interface into focused ones.' },
        dip: { title: 'Dependency Inversion Principle', text: 'High-level modules should not depend on low-level modules. Both should depend on abstractions.', insight: 'Instead of NotificationService → EmailSender (direct), insert an interface. Now you can swap Email for SMS or Push without touching high-level code.' },
    };

    const desc = descriptions[activePrinciple];

    const CENTER = (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '3px solid var(--border)', flexShrink: 0 }}>
                {PRINCIPLES.map(p => (
                    <button key={p.id} onClick={() => setActivePrinciple(p.id)} style={{
                        flex: 1, padding: '0.6rem', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer',
                        background: activePrinciple === p.id ? p.color : 'var(--white)', border: 'none',
                        borderRight: '2px solid var(--border)', fontFamily: 'var(--font-main)', color: 'var(--text)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                        transition: 'background 0.2s',
                    }}>{getPrincipleIcon(p.id)} {p.name}</button>
                ))}
            </div>
            <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
                <AnimatePresence mode="wait">
                    <motion.div key={activePrinciple}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        style={{ width: '100%', height: '100%' }}>
                        {activePrinciple === 'srp' && <SRPSim />}
                        {activePrinciple === 'ocp' && <OCPSim />}
                        {activePrinciple === 'lsp' && <LSPSim />}
                        {activePrinciple === 'isp' && <ISPSim />}
                        {activePrinciple === 'dip' && <DIPSim />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );

    const LEFT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.5, textTransform: 'uppercase' }}>SOLID Principles</div>
            {PRINCIPLES.map(p => (
                <div key={p.id} onClick={() => setActivePrinciple(p.id)} style={{
                    border: `2px solid ${activePrinciple === p.id ? p.color : 'var(--border)'}`, borderRadius: '8px',
                    padding: '0.5rem 0.75rem', cursor: 'pointer', background: activePrinciple === p.id ? p.color + '30' : 'var(--white)',
                    transition: 'all 0.2s', boxShadow: activePrinciple === p.id ? `0 0 10px ${p.color}30` : 'none',
                }}>
                    <div style={{ fontWeight: 800, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>{getPrincipleIcon(p.id, 18)} {p.name}</div>
                    <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>{p.full} Principle</div>
                </div>
            ))}
        </div>
    );

    const RIGHT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="panel">
                <div className="panel-header" style={{ background: active?.color, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>{active && getPrincipleIcon(active.id, 16)} Algorithm Logic</div>
                <div style={{ padding: '0.75rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.3rem' }}>{desc.title}</div>
                    <div style={{ fontSize: '0.78rem', lineHeight: 1.6, opacity: 0.8 }}>{desc.text}</div>
                </div>
            </div>
            <div className="panel">
                <div className="panel-header" style={{ background: '#ffd93d', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><LightbulbIcon size={16} /> Educational Insight</div>
                <div style={{ padding: '0.75rem', fontSize: '0.78rem', lineHeight: 1.6 }}>{desc.insight}</div>
            </div>
            <div style={{ background: '#111', color: active?.color, padding: '0.75rem', borderRadius: '8px', border: `2px solid ${active?.color}` }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.5 }}>CONCEPT: {active?.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', marginTop: '0.3rem' }}>SOLID — {active?.full} Principle</div>
            </div>
        </div>
    );

    return (
        <ImmersiveLayout isActive={true} title="SOLID Principles" icon={<BuildIcon />} moduleLabel="OOP MODULE"
            hideControls={true}
            isRunning={false} isPaused={false} isFinished={false} speed={speed} onSpeedChange={setSpeed}
            onStart={() => {}} onPause={() => {}} onResume={() => {}} onStep={() => {}}
            onReset={() => setActivePrinciple('srp')}
            currentStepNum={PRINCIPLES.findIndex(p => p.id === activePrinciple) + 1} totalSteps={5}
            phaseName={`${active?.name}: ${active?.full}`}
            centerContent={CENTER} leftContent={LEFT} rightContent={RIGHT}
            timelineItems={PRINCIPLES.map((p, i) => ({ id: i, label: p.name, done: false, active: p.id === activePrinciple }))}
            legend={PRINCIPLES.map(p => ({ color: p.color, label: p.name }))}>
            <div className="main-content">
                <Link to="/oops" style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← OOP Module</Link>
                <h1><BuildIcon size={28} /> SOLID Principles</h1>
            </div>
        </ImmersiveLayout>
    );
}
