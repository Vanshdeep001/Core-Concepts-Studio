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
    BellIcon, TargetIcon, DiamondIcon, PillarIcon, BuildIcon, LightbulbIcon, FileIcon
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
const FULL = { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' };

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
const SRPSim = ({ isMobile }) => {
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
        <div style={{ ...FULL, padding: isMobile ? '0.6rem 0.6rem 2.5rem 0.6rem' : '1.2rem', gap: isMobile ? '0.7rem' : '1rem', overflowY: isMobile ? 'auto' : 'hidden' }}>
            {DOT_BG('srpGrid')}
            <Particles active={particles} cx={isMobile ? 180 : 300} cy={isMobile ? 200 : 250} color="#ffd93d" count={20} />

            {/* Top Control Bar */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.6rem', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, zIndex: 2 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}>Single Responsibility Principle (SRP)</span>
                <button className="btn btn-sm" style={{ background: phase === 'clean' ? '#a8e6cf' : '#ffd93d', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    onClick={handleApply}>
                    {phase === 'clean' ? (<><SyncIcon size={14} /> Show God Class</>) : (<><ScissorsIcon size={14} /> Split Responsibilities</>)}
                </button>
            </div>

            {/* Main Content Layout */}
            <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1.2rem', minHeight: 0, zIndex: 1 }}>
                
                {/* Left Panel: Class Configurator */}
                <div style={{
                    flex: 1, border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)',
                    background: 'var(--white)', boxShadow: 'var(--shadow)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', height: isMobile ? 'auto' : '100%'
                }}>
                    <div style={{ background: 'var(--cyan)', borderBottom: 'var(--border-width) solid var(--border)', padding: '0.5rem 0.8rem', fontWeight: 900, fontSize: '0.72rem' }}>
                        Class Configurator & Responsibility Manager
                    </div>
                    <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Class name edit */}
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, width: 80 }}>Class Name:</span>
                            <input value={className} onChange={e => setClassName(e.target.value)} style={MINI_INPUT} placeholder="Employee" />
                        </div>

                        {/* Add Responsibility form */}
                        <div style={{ border: '2px solid var(--border)', borderRadius: '8px', padding: '0.5rem', background: 'var(--bg-light)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.5 }}>ADD RESPONSIBILITY (REASON TO CHANGE)</div>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                                <input value={newResp} onChange={e => setNewResp(e.target.value)} placeholder="e.g. Database Storage" style={MINI_INPUT} onKeyDown={e => e.key === 'Enter' && addResponsibility()} />
                                <button className="btn btn-sm" style={{ background: 'var(--green)', fontSize: '0.62rem' }} onClick={addResponsibility}>+ Add</button>
                            </div>
                        </div>

                        {/* Responsibilities list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.5 }}>ACTIVE RESPONSIBILITIES & METHODS</div>
                            {responsibilities.map(resp => (
                                <div key={resp.id} style={{ border: '2px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                                    <div style={{ background: resp.color, padding: '0.3rem 0.5rem', borderBottom: '2px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 800, fontSize: '0.65rem' }}>{resp.name}</span>
                                        <button onClick={() => removeResponsibility(resp.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete"><XIcon size={10} /></button>
                                    </div>
                                    <div style={{ padding: '0.4rem', display: 'flex', flexWrap: 'wrap', gap: '4px', background: 'var(--bg-light)' }}>
                                        {resp.methods.map((m, mi) => (
                                            <span key={`${resp.id}-${mi}`} style={{ padding: '0.15rem 0.35rem', background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: '4px', fontSize: '0.58rem', fontFamily: 'var(--font-mono)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                                {m} <XIcon size={8} color="#e53e3e" style={{ cursor: 'pointer' }} onClick={() => removeMethod(resp.id, mi)} />
                                            </span>
                                        ))}
                                        {editingResp === resp.id ? (
                                            <div style={{ display: 'flex', gap: '0.2rem', width: '100%', marginTop: '0.2rem' }}>
                                                <input value={newMethod} onChange={e => setNewMethod(e.target.value)} placeholder="methodName()" style={{ ...MINI_INPUT, padding: '0.15rem 0.3rem' }} onKeyDown={e => e.key === 'Enter' && addMethodToResp(resp.id)} />
                                                <button style={{ fontSize: '0.55rem', padding: '0.15rem 0.3rem', background: 'var(--green)', border: '1.5px solid var(--border)', borderRadius: '4px', fontWeight: 800, cursor: 'pointer' }} onClick={() => addMethodToResp(resp.id)}>Save</button>
                                                <button style={{ fontSize: '0.55rem', padding: '0.15rem 0.3rem', background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: '4px', fontWeight: 800, cursor: 'pointer' }} onClick={() => setEditingResp(null)}>Cancel</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => { setEditingResp(resp.id); setNewMethod(''); }} style={{ fontSize: '0.55rem', padding: '0.15rem 0.4rem', background: 'var(--white)', border: '1.5px dashed var(--border)', borderRadius: '4px', fontWeight: 800, cursor: 'pointer' }}>+ Add Method</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>

                {/* Right Panel: Class Status & Decomposition Visualizer */}
                <div style={{
                    flex: 1.2, border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)',
                    background: 'var(--white)', boxShadow: 'var(--shadow)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', height: isMobile ? 'auto' : '100%',
                    minHeight: isMobile ? '320px' : 'auto'
                }}>
                    <div style={{ background: 'var(--yellow)', borderBottom: 'var(--border-width) solid var(--border)', padding: '0.5rem 0.8rem', fontWeight: 900, fontSize: '0.72rem' }}>
                        Memory & Assembly Visualization
                    </div>
                    <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', position: 'relative' }}>
                        
                        <AnimatePresence mode="wait">
                            {phase === 'violation' || phase === 'exploding' ? (
                                <motion.div key="knife" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem', width: '100%' }}>
                                    {/* God class box */}
                                    <motion.div
                                        animate={phase === 'exploding' ? { scale: [1, 1.1, 0], opacity: [1, 1, 0] } : { rotate: [0, -0.3, 0.3, 0] }}
                                        transition={phase === 'exploding' ? { duration: 0.8 } : { duration: 4, repeat: Infinity }}
                                        style={{ border: '4px solid #e53e3e', borderRadius: '16px', overflow: 'hidden', width: '100%', maxWidth: 350, boxShadow: '0 0 25px rgba(229,62,62,0.15), 5px 5px 0 var(--border)' }}>
                                        <div style={{ background: '#e53e3e', padding: '0.5rem 0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: 900, fontSize: '0.78rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><XIcon size={14} color="#fff" /> {className}</span>
                                            <span style={{ fontSize: '0.55rem', color: '#ffcece', fontWeight: 700 }}>GOD CLASS</span>
                                        </div>
                                        <div style={{ padding: '0.6rem', display: 'flex', flexWrap: 'wrap', gap: '4px', background: 'var(--white)', minHeight: 120, alignContent: 'flex-start' }}>
                                            {responsibilities.flatMap(resp => resp.methods.map((m, mi) => (
                                                <span key={`${resp.id}-${mi}`}
                                                    style={{ padding: '0.2rem 0.4rem', background: resp.color + '20', border: `1.5px solid ${resp.color}`, borderRadius: '5px', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
                                                    {m}
                                                </span>
                                            )))}
                                            {allMethods.length === 0 && <div style={{ fontSize: '0.65rem', opacity: 0.4, fontStyle: 'italic', margin: 'auto' }}>No methods in class</div>}
                                        </div>
                                    </motion.div>
                                    
                                    <div style={{ background: '#fff5f5', border: '2px solid #e53e3e', borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '0.65rem', fontWeight: 800, color: '#e53e3e', display: 'flex', alignItems: 'center', gap: '0.3rem', width: '100%', maxWidth: 350, justifyContent: 'center' }}>
                                        <AlertIcon size={14} color="#e53e3e" /> <span>{responsibilities.length} reasons to change — violates SRP!</span>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="stations" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
                                    
                                    {/* Split services grid */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'center', width: '100%', maxWidth: 400 }}>
                                        {responsibilities.map((resp, i) => (
                                            <motion.div key={resp.id}
                                                initial={{ scale: 0, rotate: -10 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ delay: 0.05 + i * 0.05, type: 'spring', stiffness: 200 }}
                                                onMouseEnter={() => setHoveredTool(resp.id)}
                                                onMouseLeave={() => setHoveredTool(null)}
                                                style={{
                                                    width: isMobile ? '100%' : '140px', maxWidth: isMobile ? '100%' : '140px', background: 'var(--white)',
                                                    border: `3px solid ${hoveredTool === resp.id ? resp.color : 'var(--border)'}`,
                                                    borderRadius: '12px', overflow: 'hidden',
                                                    boxShadow: hoveredTool === resp.id ? `0 0 15px ${resp.color}30, 3px 3px 0 var(--border)` : '3px 3px 0 var(--border)',
                                                    transition: 'all 0.2s',
                                                }}>
                                                <div style={{ background: resp.color, padding: '0.3rem 0.5rem', borderBottom: '2px solid var(--border)', fontWeight: 800, fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <CheckIcon size={12} /> {resp.name}
                                                </div>
                                                <div style={{ padding: '0.4rem', minHeight: 60 }}>
                                                    {resp.methods.map((m, mi) => (
                                                        <div key={mi} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', fontWeight: 600, padding: '1px 5px', borderRadius: '3px', marginBottom: '2px', background: `${resp.color}15`, border: `1px solid ${resp.color}30` }}>
                                                            {m}
                                                        </div>
                                                    ))}
                                                    {resp.methods.length === 0 && <div style={{ fontSize: '0.55rem', opacity: 0.4, fontStyle: 'italic' }}>No methods</div>}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                    <div style={{ background: '#f0fff4', border: '2px solid #38a169', borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '0.65rem', fontWeight: 800, color: '#38a169', display: 'flex', alignItems: 'center', gap: '0.3rem', width: '100%', maxWidth: 350, justifyContent: 'center' }}>
                                        <CheckIcon size={14} color="#38a169" /> <span>Single Responsibility achieved!</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>
                </div>

            </div>
        </div>
    );
};

const OCPSim = ({ isMobile }) => {
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
        <div style={{ ...FULL, padding: isMobile ? '0.6rem 0.6rem 2.5rem 0.6rem' : '1.2rem', gap: isMobile ? '0.7rem' : '1rem', overflowY: isMobile ? 'auto' : 'hidden' }}>
            {DOT_BG('ocpGrid')}

            {/* Top Control Bar */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.6rem', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, zIndex: 2 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}>Open / Closed Principle (OCP)</span>
                <button className="btn btn-sm" style={{ background: applied ? '#a8e6cf' : '#66d9ef', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    onClick={() => { setApplied(!applied); setPluggedExtras([]); }}>
                    {applied ? (<><SyncIcon size={14} /> Show Violation</>) : (<><PlugIcon size={14} /> Apply OCP</>)}
                </button>
            </div>

            {/* Main Content Layout */}
            <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1.2rem', minHeight: 0, zIndex: 1 }}>
                
                {/* Left Panel: Extensions Manager */}
                <div style={{
                    flex: 1, border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)',
                    background: 'var(--white)', boxShadow: 'var(--shadow)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', height: isMobile ? 'auto' : '100%'
                }}>
                    <div style={{ background: 'var(--cyan)', borderBottom: 'var(--border-width) solid var(--border)', padding: '0.5rem 0.8rem', fontWeight: 900, fontSize: '0.72rem' }}>
                        OCP Plugin Manager
                    </div>
                    <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        
                        {!applied ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.6 }}>Static Area Calculator (OCP Violating)</div>
                                <div style={{ fontSize: '0.62rem', opacity: 0.7, lineHeight: 1.5 }}>
                                    In this mode, adding any new shape requires modification of the core <code>AreaCalculator</code> class, violating OCP. Try adding a shape to see it shake and fail!
                                </div>
                                <button className="btn btn-sm" style={{ background: '#e53e3e', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.3rem', width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} onClick={handleDrill}>
                                    <WrenchIcon size={14} /> Simulate Adding New Shape
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Plug presets */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.5 }}>AVAILABLE SHAPE EXTENSIONS</div>
                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                        {presetExtras.map(s => {
                                            const active = pluggedExtras.some(p => p.id === s.id);
                                            const ShapeIcon = s.icon;
                                            return (
                                                <button key={s.id} onClick={() => handlePlugShape(s)} disabled={active}
                                                    style={{
                                                        background: active ? '#eaeaea' : `${s.color}15`,
                                                        border: `2px solid ${active ? '#ccc' : s.color}`,
                                                        borderRadius: '8px', padding: '0.35rem 0.6rem', cursor: active ? 'default' : 'pointer',
                                                        fontWeight: 700, fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem'
                                                    }}>
                                                    {ShapeIcon && <ShapeIcon size={14} color={active ? '#999' : s.color} />}
                                                    {active ? `${s.name} (Plugged)` : `Plug ${s.name}`}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Custom Shape Plug-in form */}
                                <div style={{ border: '2px solid var(--border)', borderRadius: '8px', padding: '0.5rem', background: 'var(--bg-light)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.5 }}>CREATE CUSTOM PLUGGABLE SHAPE</div>
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                        <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Hexagon" style={MINI_INPUT} onKeyDown={e => e.key === 'Enter' && handleAddCustom()} />
                                        <input value={customFormula} onChange={e => setCustomFormula(e.target.value)} placeholder="3√3/2·s²" style={{ ...MINI_INPUT, width: 80 }} onKeyDown={e => e.key === 'Enter' && handleAddCustom()} />
                                        <button className="btn btn-sm" style={{ background: '#38a169', color: '#fff', fontSize: '0.62rem' }} onClick={handleAddCustom}>+ Plug</button>
                                    </div>
                                </div>
                            </>
                        )}

                    </div>
                </div>

                {/* Right Panel: Engine Visualization */}
                <div style={{
                    flex: 1.2, border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)',
                    background: 'var(--white)', boxShadow: 'var(--shadow)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', height: isMobile ? 'auto' : '100%',
                    minHeight: isMobile ? '320px' : 'auto'
                }}>
                    <div style={{ background: 'var(--yellow)', borderBottom: 'var(--border-width) solid var(--border)', padding: '0.5rem 0.8rem', fontWeight: 900, fontSize: '0.72rem' }}>
                        Area Calculator Architecture
                    </div>
                    <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                        
                        <AnimatePresence mode="wait">
                            {!applied ? (
                                <motion.div key="violation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
                                    {/* Hardcoded calculator */}
                                    <motion.div
                                        animate={drilling ? { x: [-2, 2, -2, 2, 0] } : {}}
                                        transition={{ duration: 0.3 }}
                                        style={{
                                            border: `3px solid ${drilling ? '#e53e3e' : 'var(--border)'}`, borderRadius: '14px',
                                            overflow: 'hidden', width: '100%', maxWidth: 350, background: 'var(--white)',
                                            boxShadow: drilling ? '0 0 20px rgba(229,62,62,0.15), 4px 4px 0 var(--border)' : '4px 4px 0 var(--border)',
                                            transition: 'all 0.3s',
                                        }}>
                                        <div style={{ background: drilling ? '#e53e3e' : '#f8f9fa', padding: '0.5rem 0.8rem', borderBottom: '2px solid var(--border)', fontWeight: 900, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: drilling ? '#fff' : 'var(--text)' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><XIcon size={14} /> AreaCalculator</span>
                                            {drilling && <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.3, repeat: 4 }} style={{ fontSize: '0.6rem' }}>MODIFYING CORE!</motion.span>}
                                        </div>
                                        <pre style={{ padding: '0.6rem 0.8rem', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', margin: 0, background: '#0f172a', color: '#e2e8f0', lineHeight: 1.6, position: 'relative' }}>
                                            {drilling && <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                                                style={{ position: 'absolute', top: '55%', left: 10, right: 10, height: 2, background: '#e53e3e', transformOrigin: 'left', opacity: 0.7 }} />}
{`calculateArea(shape) {
  if (shape == "Circle")   → π*r²
  else if (shape == "Square")  → s²
  else if (shape == "Rect")    → l*w`}
                                            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}
                                                style={{ color: '#e53e3e' }}>{`
  // Violates OCP: MUST modify code! `}</motion.span>
                                            <span style={{ color: '#e53e3e', display: 'inline-flex', verticalAlign: 'middle' }}><XIcon size={10} color="#e53e3e" /></span>
{`
}`}
                                        </pre>
                                    </motion.div>
                                </motion.div>
                            ) : (
                                <motion.div key="clean" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', width: '100%' }}>

                                    {/* Interface header */}
                                    <motion.div initial={{ y: -10 }} animate={{ y: 0 }}
                                        style={{ background: '#f0fff4', border: '3px solid #38a169', borderRadius: '12px', padding: '0.4rem 1rem', textAlign: 'center', boxShadow: '3px 3px 0 var(--border)', width: '100%', maxWidth: 260 }}>
                                        <div style={{ fontWeight: 900, fontSize: '0.72rem', color: '#38a169' }}>«interface» Shape</div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', opacity: 0.7 }}>+ area(): double</div>
                                    </motion.div>

                                    {/* Connector lines */}
                                    <div style={{ width: 2, height: 12, background: '#38a169' }} />

                                    {/* Shape implementations */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', width: '100%', maxWidth: 360 }}>
                                        {[...baseShapes, ...pluggedExtras].map((s, i) => {
                                            const ShapeIcon = s.icon;
                                            return (
                                                <motion.div key={s.id}
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ delay: i * 0.05, type: 'spring', stiffness: 250 }}
                                                    style={{
                                                        width: 75, background: 'var(--white)', border: `2.5px solid ${s.color}`,
                                                        borderRadius: '10px', padding: '0.4rem', textAlign: 'center',
                                                        boxShadow: '2px 2px 0 var(--border)', position: 'relative',
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                                                    }}>
                                                    <span style={{ color: s.color, display: 'inline-flex', marginBottom: '0.2rem' }}>
                                                        {ShapeIcon && <ShapeIcon size={18} />}
                                                    </span>
                                                    <div style={{ fontWeight: 800, fontSize: '0.62rem' }}>{s.name}</div>
                                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.45rem', opacity: 0.5 }}>{s.formula}</div>
                                                    {i >= baseShapes.length && (
                                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                            style={{ position: 'absolute', top: -5, right: -5, width: 14, height: 14, background: '#38a169', borderRadius: '50%', fontSize: '0.5rem', color: '#fff', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}><CheckIcon size={8} color="#fff" /></motion.div>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    {pluggedExtras.length > 0 && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            style={{ background: '#f0fff4', border: '2px solid #38a169', borderRadius: '8px', padding: '0.35rem 0.6rem', fontSize: '0.62rem', fontWeight: 800, color: '#38a169', display: 'flex', alignItems: 'center', gap: '0.3rem', width: '100%', maxWidth: 300, justifyContent: 'center' }}>
                                            <ShieldIcon size={12} color="#38a169" /> <span>{pluggedExtras.length} plugins added without code modification!</span>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>
                </div>

            </div>
        </div>
    );
};

const LSPSim = ({ isMobile }) => {
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
            const childActualArea = childSize * childSize;
            const passes = showClean || childActualArea === expectedArea;
            setTestResults(prev => [...prev, { name: childName, w: childSize, h: childSize, area: childActualArea, expected: expectedArea, pass: passes }]);
        }, 1800));

        timers.current.push(setTimeout(() => setTesting(false), 2200));
    };

    return (
        <div style={{ ...FULL, padding: isMobile ? '0.6rem 0.6rem 2.5rem 0.6rem' : '1.2rem', gap: isMobile ? '0.7rem' : '1rem', overflowY: isMobile ? 'auto' : 'hidden' }}>
            {DOT_BG('lspGrid')}

            {/* Top Control Bar */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.6rem', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, zIndex: 2 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}>Liskov Substitution Tester</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-sm" style={{ background: showClean ? 'var(--yellow)' : '#a8e6cf', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        onClick={() => { setShowClean(!showClean); setTestResults([]); }}>
                        {showClean ? (<><SyncIcon size={14} /> Show Violation</>) : (<><CheckIcon size={14} /> Fix Design</>)}
                    </button>
                    <button className="btn btn-sm" style={{ background: '#66d9ef', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        onClick={runTest} disabled={testing}>
                        <SyncIcon size={14} /> Run Test
                    </button>
                </div>
            </div>

            {/* Main Content Layout */}
            <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1.2rem', minHeight: 0, zIndex: 1 }}>
                
                {/* Left Panel: Class Configurator */}
                <div style={{
                    flex: 1, border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)',
                    background: 'var(--white)', boxShadow: 'var(--shadow)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', height: isMobile ? 'auto' : '100%'
                }}>
                    <div style={{ background: 'var(--cyan)', borderBottom: 'var(--border-width) solid var(--border)', padding: '0.5rem 0.8rem', fontWeight: 900, fontSize: '0.72rem' }}>
                        Inheritance Configuration
                    </div>
                    <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Parent Class */}
                        <div style={{ border: '2px solid var(--border)', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg-light)' }}>
                            <div style={{ background: '#e2e8f0', padding: '0.35rem 0.6rem', borderBottom: '2px solid var(--border)', fontWeight: 800, fontSize: '0.68rem' }}>Parent Class (Supertype)</div>
                            <div style={{ padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, width: 80 }}>Class Name:</span>
                                    <input value={parentName} onChange={e => setParentName(e.target.value)} style={MINI_INPUT} placeholder="Rectangle" />
                                </div>
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, width: 80 }}>Test Width:</span>
                                    <input type="number" value={parentW} onChange={e => setParentW(Number(e.target.value) || 1)} style={MINI_INPUT} />
                                </div>
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, width: 80 }}>Test Height:</span>
                                    <input type="number" value={parentH} onChange={e => setParentH(Number(e.target.value) || 1)} style={MINI_INPUT} />
                                </div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', background: 'var(--white)', padding: '0.25rem 0.4rem', borderRadius: '4px', border: '1.5px solid var(--border)', marginTop: '0.2rem' }}>
                                    area() Contract: width × height = {parentW} × {parentH} = <strong>{parentW * parentH}</strong>
                                </div>
                            </div>
                        </div>

                        {/* Child Class */}
                        <div style={{ border: `2px solid ${showClean ? '#38a169' : '#e53e3e'}`, borderRadius: '10px', overflow: 'hidden', background: 'var(--bg-light)', transition: 'all 0.3s' }}>
                            <div style={{ background: showClean ? '#a8e6cf' : '#ffd93d', padding: '0.35rem 0.6rem', borderBottom: '2px solid var(--border)', fontWeight: 800, fontSize: '0.68rem' }}>
                                Child Class: {showClean ? 'Independent Class' : `Subtype (extends ${parentName})`}
                            </div>
                            <div style={{ padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, width: 80 }}>Class Name:</span>
                                    <input value={childName} onChange={e => setChildName(e.target.value)} style={MINI_INPUT} placeholder="Square" />
                                </div>
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, width: 80 }}>Side Length:</span>
                                    <input type="number" value={childSize} onChange={e => setChildSize(Number(e.target.value) || 1)} style={MINI_INPUT} />
                                </div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', background: 'var(--white)', padding: '0.25rem 0.4rem', borderRadius: '4px', border: `1.5px solid ${showClean ? '#38a169' : isViolation ? '#e53e3e' : 'var(--border)'}`, marginTop: '0.2rem' }}>
                                    area() Outcome: side × side = {childSize} × {childSize} = <strong style={{ color: !showClean && isViolation ? '#e53e3e' : '#38a169' }}>{childSize * childSize}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Verification Engine */}
                <div style={{
                    flex: 1.2, border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)',
                    background: 'var(--white)', boxShadow: 'var(--shadow)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', height: isMobile ? 'auto' : '100%',
                    minHeight: isMobile ? '320px' : 'auto'
                }}>
                    <div style={{ background: 'var(--yellow)', borderBottom: 'var(--border-width) solid var(--border)', padding: '0.5rem 0.8rem', fontWeight: 900, fontSize: '0.72rem' }}>
                        Substitutability Verification Engine
                    </div>
                    <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                        
                        {/* Checker Device */}
                        <div style={{
                            width: '100%', maxWidth: 300, border: `3px solid ${testing ? '#66d9ef' : 'var(--border)'}`, borderRadius: '16px',
                            overflow: 'hidden', background: 'var(--white)', boxShadow: '4px 4px 0 var(--border)',
                            transition: 'border-color 0.3s',
                        }}>
                            <div style={{ background: testing ? '#66d9ef' : '#f1f5f9', padding: '0.5rem 0.8rem', borderBottom: '2px solid var(--border)', fontWeight: 900, fontSize: '0.75rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                {testing && <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-flex' }}><GearIcon size={14} /></motion.span>}
                                <SyncIcon size={16} /> Substitutability Checker
                            </div>
                            <div style={{ padding: '0.8rem', textAlign: 'center' }}>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', opacity: 0.6, marginBottom: '0.3rem' }}>Contract: area() must return</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 900, color: '#2563eb' }}>{expectedArea}</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', opacity: 0.4 }}>({parentW} × {parentH})</div>
                            </div>
                        </div>

                        {/* Test Results Feed */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: 300 }}>
                            <AnimatePresence>
                                {testResults.map((r, i) => (
                                    <motion.div key={i}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ type: 'spring' }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            padding: '0.5rem 0.7rem', borderRadius: '10px',
                                            border: `2px solid ${r.pass ? '#38a169' : '#e53e3e'}`,
                                            background: r.pass ? '#f0fff4' : '#fff5f5',
                                            boxShadow: '2px 2px 0 var(--border)',
                                        }}>
                                        <div style={{ fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center' }}>
                                            {r.pass ? <CheckIcon size={18} color="#38a169" /> : <AlertIcon size={18} color="#e53e3e" />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 800, fontSize: '0.72rem' }}>{r.name}</div>
                                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', opacity: 0.7 }}>
                                                area() → {r.area} {r.pass ? '==' : '!='} expected {r.expected}
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
                                    <AlertIcon size={14} color="#e53e3e" /> <span>{childName} breaks Liskov rules! Width change forces height change, violating parent contract.</span>
                                </motion.div>
                            )}
                            {testResults.length >= 2 && testResults[1].pass && showClean && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    style={{ background: '#f0fff4', border: '2px solid #38a169', borderRadius: '8px', padding: '0.4rem 0.6rem', fontSize: '0.62rem', color: '#38a169', fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'center' }}>
                                    <CheckIcon size={14} color="#38a169" /> <span>Valid design! Independent classes implement Shape contract correctly.</span>
                                </motion.div>
                            )}
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

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

const ISPSim = ({ isMobile }) => {
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

    return (
        <div style={{ ...FULL, padding: isMobile ? '0.6rem 0.6rem 2.5rem 0.6rem' : '1.2rem', gap: isMobile ? '0.7rem' : '1rem', overflowY: isMobile ? 'auto' : 'hidden' }}>
            {DOT_BG('ispGrid')}

            {/* Top Control Bar */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.6rem', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, zIndex: 2 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}>Interface Segregation Principle (ISP)</span>
                <button className="btn btn-sm" style={{ background: applied ? '#a8e6cf' : '#ff6b9d', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    onClick={() => { setApplied(!applied); setRobotReaction(null); }}>
                    {applied ? (<><SyncIcon size={14} /> Show Fat Interface</>) : (<><ScissorsIcon size={14} /> Split Interfaces (Apply ISP)</>)}
                </button>
            </div>

            {/* Main Content Layout */}
            <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1.2rem', minHeight: 0, zIndex: 1 }}>
                
                {/* Left Panel: Capabilities Editor */}
                <div style={{
                    flex: 1, border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)',
                    background: 'var(--white)', boxShadow: 'var(--shadow)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', height: isMobile ? 'auto' : '100%'
                }}>
                    <div style={{ background: 'var(--cyan)', borderBottom: 'var(--border-width) solid var(--border)', padding: '0.5rem 0.8rem', fontWeight: 900, fontSize: '0.72rem' }}>
                        Worker Specification & Menu Builder
                    </div>
                    <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        
                        {/* Define Interface Capabilities */}
                        <div style={{ border: '2px solid var(--border)', borderRadius: '8px', padding: '0.5rem', background: 'var(--bg-light)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.5 }}>ADD INTERFACE CAPABILITY METHOD</div>
                            <input value={newMethod} onChange={e => setNewMethod(e.target.value)} placeholder="e.g. debugCode()" style={MINI_INPUT} onKeyDown={e => e.key === 'Enter' && addMethod()} />
                            
                            <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', marginTop: '0.1rem' }}>
                                <select value={newCat} onChange={e => setNewCat(e.target.value)} style={{ ...MINI_INPUT, flex: 1.2, height: 28, padding: '0 0.3rem' }}>
                                    <option value="workable">Workable (IWorkable)</option>
                                    <option value="eatable">Eatable (IEatable)</option>
                                    <option value="sleepable">Sleepable (ISleepable)</option>
                                    <option value="manageable">Manageable (IManageable)</option>
                                </select>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.58rem', fontWeight: 800, cursor: 'pointer', userSelect: 'none' }}>
                                    <input type="checkbox" checked={newCanRobot} onChange={e => setNewCanRobot(e.target.checked)} />
                                    Robot Can Do
                                </label>
                                <button className="btn btn-sm" style={{ background: '#ff6b9d', fontSize: '0.62rem', height: 28, padding: '0 0.6rem' }} onClick={addMethod}>+ Add</button>
                            </div>
                        </div>

                        {/* Interactive methods grid */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.5 }}>CAPABILITIES (HOVER TO TEST CLIENTS)</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: 220, overflowY: 'auto', paddingRight: '2px' }}>
                                {menuItems.map(item => {
                                    const ItemIcon = item.icon;
                                    return (
                                        <div key={item.id}
                                            onMouseEnter={() => handleMenuItemHover(item)}
                                            onMouseLeave={() => setRobotReaction(null)}
                                            style={{
                                                padding: '0.3rem 0.5rem', borderRadius: '6px',
                                                display: 'flex', alignItems: 'center', gap: '0.35rem',
                                                fontSize: '0.65rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                                                background: item.canRobot ? '#c6f6d520' : '#fed7d720',
                                                border: `1.5px solid ${item.canRobot ? '#38a16940' : '#e53e3e40'}`,
                                                cursor: 'default',
                                            }}>
                                            {ItemIcon && <ItemIcon size={13} color="var(--text)" />}
                                            <span style={{ flex: 1 }}>{item.name}</span>
                                            <span style={{ fontSize: '0.52rem', padding: '1px 5px', borderRadius: '3px', fontWeight: 800, color: 'var(--text)', background: catColors[item.cat] }}>
                                                {catLabels[item.cat]}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Right Panel: Client Execution Simulator */}
                <div style={{
                    flex: 1.2, border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)',
                    background: 'var(--white)', boxShadow: 'var(--shadow)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', height: isMobile ? 'auto' : '100%',
                    minHeight: isMobile ? '320px' : 'auto'
                }}>
                    <div style={{ background: 'var(--yellow)', borderBottom: 'var(--border-width) solid var(--border)', padding: '0.5rem 0.8rem', fontWeight: 900, fontSize: '0.72rem' }}>
                        Client Interface Compliance Simulator
                    </div>
                    <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                        
                        <AnimatePresence mode="wait">
                            {!applied ? (
                                <motion.div key="fat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', width: '100%' }}>
                                    {/* Fat menu */}
                                    <motion.div animate={{ rotate: [0, -0.3, 0.3, 0] }} transition={{ duration: 5, repeat: Infinity }}
                                        style={{ width: '100%', maxWidth: 280, background: 'var(--white)', border: '3px solid #d69e2e', borderRadius: '14px', overflow: 'hidden', boxShadow: '4px 4px 0 var(--border)' }}>
                                        <div style={{ background: '#d69e2e', padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', fontWeight: 900, fontSize: '0.72rem', color: '#fff', borderBottom: '2px solid #b7791f' }}>
                                            <FileIcon size={14} color="#fff" /> IWorker (FAT INTERFACE)
                                        </div>
                                        <div style={{ padding: '0.4rem', maxHeight: 150, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {menuItems.map(item => (
                                                <span key={item.id} style={{ padding: '1px 5px', borderRadius: '3px', fontSize: '0.55rem', fontWeight: 800, fontFamily: 'var(--font-mono)', border: '1px solid var(--border)', background: 'var(--bg-light)' }}>
                                                    {item.name}
                                                </span>
                                            ))}
                                        </div>
                                    </motion.div>

                                    {/* Link line */}
                                    <div style={{ width: 3, height: 16, background: '#e53e3e', borderLeft: '1px dashed #fff' }} />

                                    {/* Robot Client Forced to Implement Eat/Sleep */}
                                    <motion.div
                                        animate={robotReaction === 'confused' ? { x: [-3, 3, -3, 0], rotate: [-2, 2, -2, 0] } : {}}
                                        transition={{ duration: 0.4 }}
                                        style={{
                                            width: 220, border: `3px solid ${robotReaction === 'confused' ? '#e53e3e' : 'var(--border)'}`, borderRadius: '14px',
                                            padding: '0.6rem', background: 'var(--white)', boxShadow: '3px 3px 0 var(--border)', textAlign: 'center',
                                            transition: 'all 0.2s',
                                        }}>
                                        <div style={{ fontSize: '1.5rem', display: 'flex', justifyContent: 'center', margin: '0.2rem 0' }}>🤖</div>
                                        <div style={{ fontWeight: 900, fontSize: '0.75rem' }}>RobotWorker Client</div>
                                        <div style={{ fontSize: '0.55rem', opacity: 0.5, fontWeight: 700 }}>IMPLEMENTS IWORKER</div>

                                        {robotReaction === 'confused' && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                style={{ background: '#fff5f5', border: '1.5px solid #e53e3e', borderRadius: '6px', padding: '0.2rem 0.4rem', fontSize: '0.52rem', color: '#e53e3e', fontWeight: 800, marginTop: '0.3rem', lineHeight: 1.2 }}>
                                                UnsupportedOperationException! Robots cannot eat() or sleep()!
                                            </motion.div>
                                        )}
                                    </motion.div>
                                    
                                    {!robotReaction && (
                                        <div style={{ fontSize: '0.58rem', opacity: 0.5, fontWeight: 700, textAlign: 'center' }}>
                                            Hover any unworkable method (e.g. eat, sleep) to test Robot compliance
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div key="clean" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', width: '100%' }}>
                                    
                                    {/* SVG Layout Flowchart */}
                                    <svg viewBox="0 0 360 300" style={{ width: '100%', maxWidth: 360, height: 300, overflow: 'visible' }}>
                                        {/* Dynamic connection lines */}
                                        {(() => {
                                            const lines = [
                                                { from: 'workable', to: 'robot', x1: 42.5, y1: 100, x2: 90, y2: 210 },
                                                { from: 'workable', to: 'human', x1: 42.5, y1: 100, x2: 270, y2: 210 },
                                                { from: 'eatable', to: 'human', x1: 134.5, y1: 100, x2: 270, y2: 210 },
                                                { from: 'sleepable', to: 'human', x1: 226.5, y1: 100, x2: 270, y2: 210 },
                                            ];
                                            return lines.filter(l => cats.includes(l.from)).map((l, idx) => {
                                                const d = `M ${l.x1} ${l.y1} C ${l.x1} 155, ${l.x2} 155, ${l.x2} ${l.y2}`;
                                                return (
                                                    <g key={idx}>
                                                        <path d={d} stroke="var(--border)" strokeWidth="4.5" fill="none" opacity="0.15" />
                                                        <path d={d} stroke="#38a169" strokeWidth="2.5" fill="none" />
                                                        <circle cx={l.x1} cy={l.y1} r="3.5" fill="#38a169" stroke="var(--white)" strokeWidth="1" />
                                                        <circle cx={l.x2} cy={l.y2} r="3.5" fill="#38a169" stroke="var(--white)" strokeWidth="1" />
                                                    </g>
                                                );
                                            });
                                        })()}

                                        {/* Segregated interfaces */}
                                        {(() => {
                                            const catPositions = { workable: 0, eatable: 92, sleepable: 184, manageable: 275 };
                                            return cats.map(cat => {
                                                const x = catPositions[cat] ?? 0;
                                                return (
                                                    <foreignObject key={cat} x={x} y={10} width={85} height={90}>
                                                        <div style={{
                                                            height: '100%', background: 'var(--white)', border: `2.5px solid ${catColors[cat]}`,
                                                            borderRadius: '10px', overflow: 'hidden', boxShadow: '2px 2px 0 var(--border)',
                                                            display: 'flex', flexDirection: 'column'
                                                        }}>
                                                            <div style={{ background: catColors[cat], padding: '0.25rem 0.4rem', fontWeight: 900, fontSize: '0.58rem', textAlign: 'center', borderBottom: '1.5px solid var(--border)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {catLabels[cat]}
                                                            </div>
                                                            <div style={{ padding: '0.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
                                                                {menuItems.filter(i => i.cat === cat).map(i => (
                                                                    <div key={i.id} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.48rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                        {i.name}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </foreignObject>
                                                );
                                            });
                                        })()}

                                        {/* RobotWorker */}
                                        <foreignObject x={15} y={210} width={150} height={80}>
                                            <div style={{
                                                height: '100%', border: '2.5px solid #38a169', borderRadius: '12px',
                                                padding: '0.4rem', background: 'var(--white)', boxShadow: '2px 2px 0 var(--border)',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center'
                                            }}>
                                                <div style={{ fontSize: '1.2rem', marginBottom: '0.15rem' }}>🤖</div>
                                                <div style={{ fontWeight: 850, fontSize: '0.65rem' }}>RobotWorker</div>
                                                <div style={{ fontSize: '0.42rem', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase', marginTop: '0.1rem' }}>implements IWorkable</div>
                                            </div>
                                        </foreignObject>

                                        {/* HumanWorker */}
                                        <foreignObject x={195} y={210} width={150} height={80}>
                                            <div style={{
                                                height: '100%', border: '2.5px solid #38a169', borderRadius: '12px',
                                                padding: '0.4rem', background: 'var(--white)', boxShadow: '2px 2px 0 var(--border)',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center'
                                            }}>
                                                <div style={{ fontSize: '1.2rem', marginBottom: '0.15rem' }}>🧑‍💻</div>
                                                <div style={{ fontWeight: 850, fontSize: '0.65rem' }}>HumanWorker</div>
                                                <div style={{ fontSize: '0.42rem', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.1, marginTop: '0.1rem' }}>
                                                    implements IWorkable, IEatable, ISleepable
                                                </div>
                                            </div>
                                        </foreignObject>
                                    </svg>

                                    <div style={{ background: '#f0fff4', border: '2px solid #38a169', borderRadius: '8px', padding: '0.35rem 0.6rem', fontSize: '0.62rem', fontWeight: 800, color: '#38a169', display: 'flex', alignItems: 'center', gap: '0.3rem', width: '100%', maxWidth: 300, justifyContent: 'center', textAlign: 'center' }}>
                                        <CheckIcon size={12} color="#38a169" /> <span>ISP Segregation complete! Clients only implement interfaces they actually need.</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>
                </div>

            </div>
        </div>
    );
};

const DIPSim = ({ isMobile }) => {
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
        <div style={{ ...FULL, padding: isMobile ? '0.6rem 0.6rem 2.5rem 0.6rem' : '1.2rem', gap: isMobile ? '0.7rem' : '1rem', overflowY: isMobile ? 'auto' : 'hidden' }}>
            {DOT_BG('dipGrid')}

            {/* Top Control Bar */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.6rem', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, zIndex: 2 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}>Dependency Inversion Principle (DIP)</span>
                <button className="btn btn-sm" style={{ background: applied ? '#a8e6cf' : '#b39ddb', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    onClick={() => { setApplied(!applied); setActivePuppet(0); }}>
                    {applied ? (<><SyncIcon size={14} /> Show Direct Coupling</>) : (<><ShuffleIcon size={14} /> Invert Dependencies</>)}
                </button>
            </div>

            {/* Main Content Layout */}
            <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1.2rem', minHeight: 0, zIndex: 1 }}>
                
                {/* Left Panel: Coupling Configurations */}
                <div style={{
                    flex: 1, border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)',
                    background: 'var(--white)', boxShadow: 'var(--shadow)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', height: isMobile ? 'auto' : '100%'
                }}>
                    <div style={{ background: 'var(--cyan)', borderBottom: 'var(--border-width) solid var(--border)', padding: '0.5rem 0.8rem', fontWeight: 900, fontSize: '0.72rem' }}>
                        Coupling Configuration Manager
                    </div>
                    <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        
                        <div style={{ display: 'flex', gap: '0.4rem', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 800, width: 90 }}>High-Level:</span>
                                <input value={highLevelName} onChange={e => setHighLevelName(e.target.value)} style={MINI_INPUT} placeholder="NotificationService" />
                            </div>
                            {applied && (
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.2rem' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, width: 90 }}>Abstraction:</span>
                                    <input value={interfaceName} onChange={e => setInterfaceName(e.target.value)} style={MINI_INPUT} placeholder="MessageSender" />
                                </div>
                            )}
                        </div>

                        {applied && (
                            <>
                                {/* Add custom implementations */}
                                <div style={{ border: '2px solid var(--border)', borderRadius: '8px', padding: '0.5rem', background: 'var(--bg-light)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.5 }}>ADD LOW-LEVEL PLUGGABLE SENDER</div>
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                        <input value={newImplName} onChange={e => setNewImplName(e.target.value)} placeholder="e.g. WhatsAppSender" style={MINI_INPUT} onKeyDown={e => e.key === 'Enter' && addImpl()} />
                                        <button className="btn btn-sm" style={{ background: '#b39ddb', fontSize: '0.62rem' }} onClick={addImpl}>+ Add</button>
                                    </div>
                                </div>

                                {/* Active implementations grid */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.5 }}>AVAILABLE SENDERS (CLICK TO SWAP RUNTIME)</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        {implementations.map((impl, i) => {
                                            const active = activePuppet === i;
                                            return (
                                                <button key={impl.id} onClick={() => setActivePuppet(i)}
                                                    style={{
                                                        background: active ? impl.color : 'var(--white)',
                                                        border: '2px solid var(--border)',
                                                        boxShadow: active ? 'var(--shadow-sm)' : 'none',
                                                        borderRadius: '8px', padding: '0.35rem 0.6rem', cursor: 'pointer',
                                                        fontWeight: 700, fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem'
                                                    }}>
                                                    {impl.icon && <impl.icon size={13} color="var(--text)" />}
                                                    {impl.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}

                    </div>
                </div>

                {/* Right Panel: Abstraction Graph Visualizer */}
                <div style={{
                    flex: 1.2, border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)',
                    background: 'var(--white)', boxShadow: 'var(--shadow)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', height: isMobile ? 'auto' : '100%',
                    minHeight: isMobile ? '340px' : 'auto'
                }}>
                    <div style={{ background: 'var(--yellow)', borderBottom: 'var(--border-width) solid var(--border)', padding: '0.5rem 0.8rem', fontWeight: 900, fontSize: '0.72rem' }}>
                        Coupling Flowchart Graph
                    </div>
                    <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                        
                        <AnimatePresence mode="wait">
                            {!applied ? (
                                <motion.div key="violation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '100%' }}>

                                    {/* High-level module */}
                                    <motion.div
                                        animate={shaking ? { x: [-3, 3, -3, 0] } : {}}
                                        transition={{ duration: 0.3 }}
                                        style={{
                                            width: 180, background: 'var(--white)',
                                            border: `2.5px solid ${shaking ? '#e53e3e' : 'var(--border)'}`,
                                            borderRadius: '12px', padding: '0.5rem', textAlign: 'center',
                                            boxShadow: shaking ? '0 0 15px rgba(229,62,62,0.15), 3px 3px 0 var(--border)' : '3px 3px 0 var(--border)',
                                            transition: 'all 0.3s',
                                        }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.1rem' }}>
                                            <TargetIcon size={20} />
                                        </div>
                                        <div style={{ fontWeight: 900, fontSize: '0.75rem' }}>{highLevelName}</div>
                                        <div style={{ fontSize: '0.5rem', opacity: 0.5, fontWeight: 700 }}>HIGH-LEVEL MODULE</div>
                                    </motion.div>

                                    {/* Rigid rod connection */}
                                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <motion.div
                                            animate={shaking ? { scaleY: [1, 0.95, 1.05, 1] } : {}}
                                            style={{ width: 5, height: 40, background: '#e53e3e', borderRadius: '3px', boxShadow: '0 0 8px rgba(229,62,62,0.2)' }} />
                                        <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', background: '#e53e3e', borderRadius: '50px', padding: '1px 6px', fontSize: '0.45rem', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap' }}>
                                            DIRECT COUPLING
                                        </div>
                                    </div>

                                    {/* Low-level module */}
                                    <motion.div
                                        animate={shaking ? { x: [3, -3, 3, 0], rotate: [1, -1, 1, 0] } : {}}
                                        transition={{ duration: 0.3 }}
                                        style={{
                                            width: 180, background: 'var(--white)',
                                            border: `2.5px solid ${shaking ? '#e53e3e' : 'var(--border)'}`,
                                            borderRadius: '12px', padding: '0.5rem', textAlign: 'center',
                                            boxShadow: '3px 3px 0 var(--border)', transition: 'all 0.3s',
                                        }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0.2rem 0' }}>
                                            <EmailIcon size={20} />
                                        </div>
                                        <div style={{ fontWeight: 800, fontSize: '0.72rem' }}>{implementations[0]?.name || 'EmailSender'}</div>
                                        <div style={{ fontSize: '0.5rem', opacity: 0.5, fontWeight: 700 }}>LOW-LEVEL COMPONENT</div>
                                        <motion.div animate={shaking ? { opacity: [0, 1, 0] } : { opacity: 0 }}
                                            style={{ fontSize: '0.52rem', color: '#e53e3e', fontWeight: 800, marginTop: '0.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.1rem' }}>
                                            <AlertIcon size={10} color="#e53e3e" /> <span>Low-level edits break High-level!</span>
                                        </motion.div>
                                    </motion.div>
                                </motion.div>
                            ) : (
                                <motion.div key="clean" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', width: '100%' }}>

                                    {/* High-level module */}
                                    <motion.div initial={{ y: -10 }} animate={{ y: 0 }}
                                        style={{
                                            width: 180, background: 'var(--white)', border: '2.5px solid #38a169',
                                            borderRadius: '12px', padding: '0.5rem', textAlign: 'center',
                                            boxShadow: '0 0 10px rgba(56,161,105,0.1), 3px 3px 0 var(--border)',
                                        }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.1rem' }}>
                                            <TargetIcon size={20} />
                                        </div>
                                        <div style={{ fontWeight: 900, fontSize: '0.75rem' }}>{highLevelName}</div>
                                        <div style={{ fontSize: '0.5rem', opacity: 0.5, fontWeight: 700 }}>HIGH-LEVEL (STABLE)</div>
                                    </motion.div>

                                    {/* Connection to interface */}
                                    <div style={{ width: 2, height: 10, background: '#38a169' }} />

                                    {/* Abstraction interface */}
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring' }}
                                        style={{
                                            background: '#b39ddb15', border: '2.5px solid #b39ddb', borderRadius: '20px',
                                            padding: '0.35rem 1rem', textAlign: 'center', boxShadow: '3px 3px 0 var(--border)',
                                        }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.55rem', color: '#7c3aed' }}>«interface»</div>
                                        <div style={{ fontWeight: 900, fontSize: '0.72rem' }}>{interfaceName}</div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', opacity: 0.5 }}>+ send(msg): void</div>
                                    </motion.div>

                                    {/* Branching lines */}
                                    <svg width={Math.max(implementations.length * 90, 180)} height="16" style={{ overflow: 'visible' }}>
                                        {implementations.map((impl, i) => {
                                            const cx = (Math.max(implementations.length * 90, 180)) / 2;
                                            const spacing = 90;
                                            const startX = cx - ((implementations.length - 1) * spacing) / 2;
                                            const px = startX + i * spacing;
                                            return (
                                                <motion.line key={impl.id}
                                                    x1={cx} y1={0} x2={px} y2={16}
                                                    stroke={i === activePuppet ? impl.color : '#ccc'}
                                                    strokeWidth={i === activePuppet ? 2.5 : 1.5}
                                                    strokeDasharray={i === activePuppet ? '' : '3 3'}
                                                    initial={{ pathLength: 0 }}
                                                    animate={{ pathLength: 1 }}
                                                    transition={{ delay: 0.2 + i * 0.05, duration: 0.4 }}
                                                />
                                            );
                                        })}
                                    </svg>

                                    {/* Implementation modules */}
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'nowrap', justifyContent: 'center', overflowX: 'auto', width: '100%', paddingBottom: '4px' }}>
                                        {implementations.map((impl, i) => (
                                            <motion.div key={impl.id}
                                                initial={{ y: 15, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: 0.25 + i * 0.05, type: 'spring' }}
                                                onClick={() => setActivePuppet(i)}
                                                style={{
                                                    width: 80, minWidth: 80, background: 'var(--white)',
                                                    border: `2.5px solid ${i === activePuppet ? impl.color : 'var(--border)'}`,
                                                    borderRadius: '10px', padding: '0.35rem', textAlign: 'center', cursor: 'pointer',
                                                    boxShadow: i === activePuppet ? `0 0 10px ${impl.color}25, 2.5px 2.5px 0 var(--border)` : '2.5px 2.5px 0 var(--border)',
                                                    transition: 'all 0.2s',
                                                }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 22, margin: '0.1rem 0' }}>
                                                    {impl.icon && <impl.icon size={20} color={i === activePuppet ? impl.color : 'var(--text)'} />}
                                                </div>
                                                <div style={{ fontWeight: 800, fontSize: '0.58rem' }}>{impl.name}</div>
                                                {i === activePuppet && (
                                                    <div style={{ fontSize: '0.45rem', color: '#38a169', fontWeight: 800, marginTop: '0.1rem' }}>ACTIVE ✓</div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>

                                    <div style={{ background: '#f0fff4', border: '1.5px solid #38a169', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.55rem', color: '#38a169', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.2rem' }}>
                                        <CheckIcon size={12} color="#38a169" /> <span>Both components depend on the Abstraction Interface!</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default function SolidPrinciplesSim() {
    const [activePrinciple, setActivePrinciple] = useState('srp');
    const [speed, setSpeed] = useState(700);
    const active = PRINCIPLES.find(p => p.id === activePrinciple);

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
            <div style={{ 
                display: 'flex', 
                borderBottom: '3px solid var(--border)', 
                flexShrink: 0,
                overflowX: isMobile ? 'auto' : 'visible',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
            }}>
                {PRINCIPLES.map(p => (
                    <button key={p.id} onClick={() => setActivePrinciple(p.id)} style={{
                        flex: isMobile ? '1 0 auto' : 1,
                        minWidth: isMobile ? '80px' : 'auto',
                        padding: isMobile ? '0.4rem 0.6rem' : '0.6rem',
                        fontWeight: 800,
                        fontSize: isMobile ? '0.62rem' : '0.78rem',
                        cursor: 'pointer',
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
                        {activePrinciple === 'srp' && <SRPSim isMobile={isMobile} />}
                        {activePrinciple === 'ocp' && <OCPSim isMobile={isMobile} />}
                        {activePrinciple === 'lsp' && <LSPSim isMobile={isMobile} />}
                        {activePrinciple === 'isp' && <ISPSim isMobile={isMobile} />}
                        {activePrinciple === 'dip' && <DIPSim isMobile={isMobile} />}
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
