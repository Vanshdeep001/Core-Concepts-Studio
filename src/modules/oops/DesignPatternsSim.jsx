import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';

import {
    DiamondIcon,
    FactoryIcon,
    SignalIcon,
    CoffeeIcon,
    TargetIcon,
    CircleShape,
    SquareShape,
    TriangleShape,
    PentagonShape,
    HexagonShape,
    ClockIcon,
    BlockIcon,
    EmailIcon,
    PhoneIcon,
    BellIcon,
    SendIcon,
    LaptopIcon,
    GearIcon,
    PuzzleIcon,
    ShuffleIcon,
    ZapIcon
} from '../../components/Icons';

/* ── PATTERNS DATA ── */
const PATTERNS = [
    { id: 'singleton', name: 'Singleton', icon: DiamondIcon, color: '#ffd93d', desc: 'One instance to rule them all' },
    { id: 'factory', name: 'Factory', icon: FactoryIcon, color: '#66d9ef', desc: 'Object creation without specifying exact class' },
    { id: 'observer', name: 'Observer', icon: SignalIcon, color: '#ff6b9d', desc: 'Publish-subscribe notification' },
    { id: 'decorator', name: 'Decorator', icon: CoffeeIcon, color: '#a8e6cf', desc: 'Add behavior dynamically' },
    { id: 'strategy', name: 'Strategy', icon: TargetIcon, color: '#b39ddb', desc: 'Swap algorithms at runtime' },
];

const getShapeIcon = (iconName, size = 18, color = 'currentColor') => {
    switch (iconName) {
        case 'CircleShape': return <CircleShape size={size} color={color} />;
        case 'SquareShape': return <SquareShape size={size} color={color} />;
        case 'TriangleShape': return <TriangleShape size={size} color={color} />;
        case 'PentagonShape': return <PentagonShape size={size} color={color} />;
        case 'HexagonShape': return <HexagonShape size={size} color={color} />;
        case 'DiamondIcon': return <DiamondIcon size={size} color={color} />;
        default: return <CircleShape size={size} color={color} />;
    }
};

const getObserverIcon = (iconName, size = 20, color = 'currentColor') => {
    switch (iconName) {
        case 'EmailIcon': return <EmailIcon size={size} color={color} />;
        case 'PhoneIcon': return <PhoneIcon size={size} color={color} />;
        case 'BellIcon': return <BellIcon size={size} color={color} />;
        case 'SendIcon': return <SendIcon size={size} color={color} />;
        case 'LaptopIcon': return <LaptopIcon size={size} color={color} />;
        default: return <BellIcon size={size} color={color} />;
    }
};


/* ── SHARED ── */
const FULL = { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' };
const MINI_INPUT = { border: '2px solid var(--border)', padding: '0.25rem 0.45rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 700, background: 'var(--white)', color: 'var(--text)', outline: 'none', borderRadius: '6px' };
const DOT_BG = (id) => (
    <svg style={{ position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none' }}>
        <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="1.2" fill="var(--text)" />
        </pattern>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
);


/* ══════════════════════════════════════════════════════════════
   1. SINGLETON — One Instance
   ══════════════════════════════════════════════════════════════ */
const SingletonSim = ({ isMobile }) => {
    const [initMode, setInitMode] = useState('lazy'); // 'lazy' | 'eager'
    const [instance, setInstance] = useState(null); // null or { address: '@0xDB_LZY', color: '#ffb347' }
    const [clients, setClients] = useState([
        { name: 'Client A', ref: null, color: '#ffd93d', x: '15%', y: '30%' },
        { name: 'Client B', ref: null, color: '#4dd0c8', x: '15%', y: '70%' },
        { name: 'Client C', ref: null, color: '#b39ddb', x: '85%', y: '30%' },
        { name: 'Client D', ref: null, color: '#ff6b9d', x: '85%', y: '70%' },
    ]);
    const [isSimulating, setIsSimulating] = useState(false);
    const [pulseActive, setPulseActive] = useState(false);
    const [showConstructorError, setShowConstructorError] = useState(false);
    const [className, setClassName] = useState('DatabaseConnection');

    useEffect(() => {
        if (initMode === 'eager') {
            setInstance({ address: '@0xDB_EGR', color: '#6366f1' });
        } else {
            setInstance(null);
        }
        setClients(prev => prev.map(c => ({ ...c, ref: null })));
        setIsSimulating(false);
        setPulseActive(false);
        setShowConstructorError(false);
    }, [initMode]);

    const runRequest = async (clientIndex = null) => {
        if (isSimulating) return;
        setIsSimulating(true);
        setPulseActive(true);
        setShowConstructorError(false);

        // Pulse animation duration is 800ms
        await new Promise(r => setTimeout(r, 800));

        // When pulse hits the center:
        let currentAddr = '';
        setInstance(prev => {
            if (prev) {
                currentAddr = prev.address;
                return prev;
            } else {
                currentAddr = `@0xDB_LZY${Math.floor(100 + Math.random() * 900)}`;
                return { address: currentAddr, color: '#10b981' };
            }
        });

        // Small delay at the core
        await new Promise(r => setTimeout(r, 400));

        // Update clients
        setClients(prev => prev.map((c, idx) => {
            if (clientIndex === null || idx === clientIndex) {
                return { ...c, ref: currentAddr };
            }
            return c;
        }));

        setPulseActive(false);
        setIsSimulating(false);
    };

    const attemptDirectInstantiation = () => {
        if (isSimulating) return;
        setShowConstructorError(true);
        setTimeout(() => setShowConstructorError(false), 3000);
    };

    const reset = () => {
        if (initMode === 'eager') {
            setInstance({ address: '@0xDB_EGR', color: '#6366f1' });
        } else {
            setInstance(null);
        }
        setClients(prev => prev.map(c => ({ ...c, ref: null })));
        setIsSimulating(false);
        setPulseActive(false);
        setShowConstructorError(false);
    };

    return (
        <div style={{ ...FULL, alignItems: 'stretch', padding: isMobile ? '0.8rem' : '1rem', gap: '0.8rem' }}>
            {DOT_BG('singleGrid')}

            {/* Header Control Panel */}
            <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'center', 
                justifyContent: 'space-between', 
                gap: '0.6rem', 
                flexShrink: 0, 
                zIndex: 10, 
                borderBottom: '2px solid var(--border)', 
                paddingBottom: '0.6rem' 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.6 }}>Mode:</span>
                    <div style={{ display: 'flex', border: '2px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                        <button onClick={() => setInitMode('eager')} style={{ fontSize: '0.65rem', padding: '0.3rem 0.6rem', fontWeight: 800, background: initMode === 'eager' ? '#ffd93d' : 'var(--white)', border: 'none', borderRight: '2px solid var(--border)', cursor: 'pointer' }}>Eager</button>
                        <button onClick={() => setInitMode('lazy')} style={{ fontSize: '0.65rem', padding: '0.3rem 0.6rem', fontWeight: 800, background: initMode === 'lazy' ? '#ffd93d' : 'var(--white)', border: 'none', cursor: 'pointer' }}>Lazy</button>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.5 }}>Class:</span>
                        <input value={className} onChange={e => setClassName(e.target.value)} style={{ ...MINI_INPUT, width: 140, height: 26, fontSize: '0.7rem' }} disabled={isSimulating} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignSelf: isMobile ? 'flex-end' : 'auto' }}>
                    <button className="btn btn-sm" style={{ background: '#ffd93d', color: '#000', fontSize: '0.65rem', padding: '0.3rem 0.6rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => runRequest()} disabled={isSimulating}>
                        <ZapIcon size={12} /> Query getInstance() (All)
                    </button>
                    <button className="btn btn-sm" style={{ background: '#ef4444', color: '#fff', fontSize: '0.65rem', padding: '0.3rem 0.6rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }} onClick={attemptDirectInstantiation} disabled={isSimulating}>
                        <BlockIcon size={12} /> new {className}()
                    </button>
                    <button className="btn btn-sm" style={{ background: '#64748b', color: '#fff', fontSize: '0.65rem', padding: '0.3rem 0.6rem' }} onClick={reset} disabled={isSimulating}>
                        Reset
                    </button>
                </div>
            </div>

            {/* Central Canvas */}
            <div style={{ overflowX: isMobile ? 'auto' : 'visible', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ 
                    flex: 1, 
                    width: isMobile ? 650 : '100%',
                    minHeight: isMobile ? 320 : 'auto',
                    border: '2px solid var(--border)', 
                    borderRadius: '12px', 
                    background: '#f8fafc', 
                    position: 'relative', 
                    overflow: 'hidden', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                    flexShrink: 0
                }}>
                    {/* SVG Connections */}
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                        {clients.map((c, idx) => {
                            if (!c.ref) return null;
                            return (
                                <motion.line
                                    key={c.name}
                                    x1={c.x}
                                    y1={c.y}
                                    x2="50%"
                                    y2="50%"
                                    stroke={c.color}
                                    strokeWidth="3"
                                    strokeDasharray="6,4"
                                    initial={{ strokeDashoffset: 50, opacity: 0 }}
                                    animate={{ strokeDashoffset: 0, opacity: 0.7 }}
                                    transition={{ strokeDashoffset: { repeat: Infinity, duration: 3, ease: 'linear' }, opacity: { duration: 0.4 } }}
                                />
                            );
                        })}
                    </svg>

                    {/* Flying Pulses */}
                    {pulseActive && clients.map((c) => (
                        <motion.div
                            key={`pulse-${c.name}`}
                            initial={{ left: c.x, top: c.y, scale: 0.5, opacity: 1 }}
                            animate={{ left: '50%', top: '50%', scale: 1.2, opacity: [1, 1, 0.8] }}
                            transition={{ duration: 0.8, ease: 'easeInOut' }}
                            style={{
                                position: 'absolute',
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                background: c.color,
                                boxShadow: `0 0 10px ${c.color}`,
                                transform: 'translate(-50%, -50%)',
                                zIndex: 10,
                            }}
                        />
                    ))}

                    {/* Central Core (Singleton Instance) */}
                    <div style={{ 
                        position: 'absolute', 
                        left: '50%', 
                        top: '50%', 
                        transform: 'translate(-50%, -50%)', 
                        zIndex: 5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        <AnimatePresence mode="wait">
                            {instance ? (
                                <motion.div
                                    key="active-core"
                                    initial={{ scale: 0.7, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.7, opacity: 0 }}
                                    transition={{ type: 'spring', damping: 15 }}
                                    style={{
                                        width: 140,
                                        height: 140,
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #a78bfa 50%, #4c1d95 100%)',
                                        border: '4px solid var(--border)',
                                        boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.4), inset 0 2px 4px rgba(255,255,255,0.4)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative'
                                    }}
                                >
                                    <span style={{ 
                                        fontSize: '0.55rem', 
                                        fontWeight: 900, 
                                        background: '#000', 
                                        color: '#fff', 
                                        padding: '2px 6px', 
                                        borderRadius: '4px', 
                                        position: 'absolute', 
                                        top: -10,
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}>
                                        {instance.address}
                                    </span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                        {className}
                                    </span>
                                    <span style={{ fontSize: '0.55rem', color: '#e9d5ff', marginTop: '0.2rem', fontWeight: 700 }}>
                                        Active Instance
                                    </span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="inactive-core"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    style={{
                                        width: 140,
                                        height: 140,
                                        borderRadius: '50%',
                                        border: '3px dashed #cbd5e1',
                                        background: 'rgba(241, 245, 249, 0.6)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#94a3b8'
                                    }}
                                >
                                    <ClockIcon size={24} color="#94a3b8" style={{ marginBottom: '0.2rem' }} />
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>null</span>
                                    <span style={{ fontSize: '0.55rem', opacity: 0.7 }}>Uninitialized</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Private Constructor Forcefield Alert */}
                        <AnimatePresence>
                            {showConstructorError && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                    style={{
                                        position: 'absolute',
                                        top: 155,
                                        width: 220,
                                        background: '#fee2e2',
                                        border: '2px solid #ef4444',
                                        borderRadius: '8px',
                                        padding: '0.5rem',
                                        textAlign: 'center',
                                        boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.2)',
                                        zIndex: 20
                                    }}
                                >
                                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#991b1b', textTransform: 'uppercase', marginBottom: '0.1rem' }}>
                                        Access Blocked
                                    </div>
                                    <div style={{ fontSize: '0.55rem', color: '#7f1d1d', fontFamily: 'var(--font-mono)' }}>
                                        Constructor is private! Direct creation is forbidden.
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Clients layout */}
                    {clients.map((c, idx) => (
                        <div
                            key={c.name}
                            style={{
                                position: 'absolute',
                                left: c.x,
                                top: c.y,
                                transform: 'translate(-50%, -50%)',
                                zIndex: 6,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.4rem'
                            }}
                        >
                            <div style={{
                                border: '2px solid var(--border)',
                                borderRadius: '10px',
                                padding: '0.5rem 0.6rem',
                                background: '#fff',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 3px 3px 0 var(--border)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                minWidth: 100
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
                                    <span style={{ fontSize: '0.65rem', fontWeight: 900 }}>{c.name}</span>
                                </div>
                                
                                <div style={{ 
                                    fontSize: '0.55rem', 
                                    fontFamily: 'var(--font-mono)', 
                                    padding: '2px 4px', 
                                    borderRadius: '4px', 
                                    background: c.ref ? `${c.color}15` : '#f1f5f9', 
                                    color: c.ref ? c.color : '#64748b',
                                    border: `1px solid ${c.ref ? c.color : '#e2e8f0'}`,
                                    fontWeight: 800,
                                    marginBottom: '0.4rem',
                                    width: '100%',
                                    textAlign: 'center',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    ref: {c.ref || 'null'}
                                </div>

                                <button 
                                    className="btn btn-sm" 
                                    style={{ 
                                        fontSize: '0.55rem', 
                                        padding: '0.15rem 0.4rem', 
                                        width: '100%',
                                        background: 'var(--white)',
                                        border: '1.5px solid var(--border)',
                                        fontWeight: 800,
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => runRequest(idx)}
                                    disabled={isSimulating}
                                >
                                    getInstance()
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


/* ══════════════════════════════════════════════════════════════
   2. FACTORY — Production Line
   ══════════════════════════════════════════════════════════════ */
const FactorySim = ({ isMobile }) => {
    const [products, setProducts] = useState([]);
    const [customTypes, setCustomTypes] = useState([
        { type: 'Circle', icon: 'CircleShape', color: '#66d9ef' },
        { type: 'Square', icon: 'SquareShape', color: '#ffd93d' },
        { type: 'Triangle', icon: 'TriangleShape', color: '#ff6b9d' },
    ]);
    const [newType, setNewType] = useState('');
    const [animationState, setAnimationState] = useState('idle');
    const [activeShape, setActiveShape] = useState(null);

    const getLaneLeft = (type) => {
        const idx = customTypes.findIndex(t => t.type === type);
        const count = customTypes.length;
        if (idx < 0 || count === 0) return '75%';
        const laneStart = 55;
        const laneEnd = 95;
        const laneWidth = (laneEnd - laneStart) / count;
        return `${laneStart + laneWidth * idx + laneWidth / 2}%`;
    };

    const CUSTOM_ICONS = ['PentagonShape', 'HexagonShape', 'DiamondIcon', 'SquareShape', 'CircleShape'];
    const CUSTOM_COLORS = ['#b39ddb', '#ffb347', '#4dd0c8', '#f0a0c0', '#90cdf4'];

    const produce = async (shape) => {
        if (animationState !== 'idle') return;
        setActiveShape(shape);
        setAnimationState('ordering');
        await new Promise(r => setTimeout(r, 800));
        setAnimationState('manufacturing');
        await new Promise(r => setTimeout(r, 1000));
        setAnimationState('dispatching');
        await new Promise(r => setTimeout(r, 800));
        setProducts(prev => [...prev, { ...shape, id: Date.now() }]);
        setAnimationState('idle');
        setActiveShape(null);
    };

    const addType = () => {
        const trimmed = newType.trim();
        if (!trimmed || customTypes.length >= 6) return;
        if (customTypes.some(t => t.type.toLowerCase() === trimmed.toLowerCase())) return;
        const nextIdx = customTypes.length;
        setCustomTypes(prev => [...prev, {
            type: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
            icon: CUSTOM_ICONS[nextIdx % CUSTOM_ICONS.length],
            color: CUSTOM_COLORS[nextIdx % CUSTOM_COLORS.length]
        }]);
        setNewType('');
    };

    const statusColor = animationState === 'ordering' ? '#2563eb' : animationState === 'manufacturing' ? '#d97706' : animationState === 'dispatching' ? '#059669' : 'var(--text)';
    const statusBg = animationState === 'ordering' ? 'var(--blue)' : animationState === 'manufacturing' ? 'var(--orange)' : animationState === 'dispatching' ? 'var(--green)' : 'var(--bg-outer)';

    return (
        <div style={{ ...FULL, padding: isMobile ? '0.8rem' : '1.2rem', gap: '1rem', overflowY: isMobile ? 'auto' : 'hidden' }}>

            {/* Top Bar */}
            <div style={{
                display: 'flex', flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between',
                gap: '0.6rem', flexShrink: 0, zIndex: 10,
                borderBottom: 'var(--border-width) solid var(--border)', paddingBottom: '0.6rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase' }}>Register Type:</span>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <input value={newType} onChange={e => setNewType(e.target.value)} placeholder="e.g. Star"
                            style={{ ...MINI_INPUT, width: 130, height: 28, border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)' }}
                            disabled={animationState !== 'idle'} onKeyDown={e => e.key === 'Enter' && addType()} />
                        <button style={{
                            background: 'var(--green)', border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)',
                            fontSize: '0.65rem', padding: '0.3rem 0.7rem', fontWeight: 900, cursor: 'pointer', boxShadow: 'var(--shadow-sm)'
                        }} onClick={addType} disabled={animationState !== 'idle' || customTypes.length >= 6}>+ Add</button>
                    </div>
                </div>
                {products.length > 0 && (
                    <button style={{
                        background: 'var(--pink)', border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)',
                        color: 'var(--text)', fontSize: '0.65rem', padding: '0.3rem 0.7rem', fontWeight: 900, cursor: 'pointer', boxShadow: 'var(--shadow-sm)'
                    }} onClick={() => setProducts([])}>Clear All</button>
                )}
            </div>

            {/* Main 3-Column Layout */}
            <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', minHeight: 0, zIndex: 1, position: 'relative' }}>

                {/* 1. CLIENT PANEL */}
                <div style={{
                    width: isMobile ? '100%' : '22%',
                    border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)',
                    background: 'var(--white)', boxShadow: 'var(--shadow)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{ background: 'var(--yellow)', borderBottom: 'var(--border-width) solid var(--border)', padding: '0.5rem 0.7rem', fontWeight: 900, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                        Client
                    </div>
                    <div style={{ padding: '0.6rem', fontSize: '0.58rem', fontWeight: 700, opacity: 0.6, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                        Select a blueprint to order:
                    </div>
                    <div className="hide-scrollbar" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0', overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {customTypes.map((s, i) => {
                            const isActive = activeShape?.type === s.type;
                            return (
                                <motion.button
                                    key={s.type}
                                    whileHover={{ x: 2 }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{
                                        background: isActive ? s.color : 'var(--white)',
                                        borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                                        borderBottom: '1px solid rgba(0,0,0,0.08)',
                                        padding: '0.55rem 0.7rem',
                                        fontSize: '0.7rem', fontWeight: 800, fontFamily: 'var(--font-main)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        cursor: animationState !== 'idle' ? 'not-allowed' : 'pointer',
                                        opacity: animationState !== 'idle' && !isActive ? 0.5 : 1,
                                        color: 'var(--text)', textAlign: 'left'
                                    }}
                                    onClick={() => produce(s)}
                                    disabled={animationState !== 'idle'}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        {getShapeIcon(s.icon, 16, isActive ? 'var(--text)' : s.color)}
                                        {s.type}
                                    </span>
                                    <span style={{ fontSize: '0.55rem', fontWeight: 900, opacity: 0.5 }}>ORDER</span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. FACTORY NODE */}
                <div style={{
                    width: isMobile ? '100%' : '22%',
                    minHeight: isMobile ? '160px' : 'auto',
                    border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)',
                    background: 'var(--white)', boxShadow: 'var(--shadow)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{ background: 'var(--cyan)', borderBottom: 'var(--border-width) solid var(--border)', padding: '0.5rem 0.7rem', fontWeight: 900, fontSize: '0.68rem', textTransform: 'uppercase' }}>
                        ShapeFactory
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', padding: '1rem' }}>
                        {/* Gears */}
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <motion.div
                                animate={animationState === 'manufacturing' ? { rotate: 360 } : {}}
                                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                                style={{ display: 'flex' }}
                            >
                                <GearIcon size={36} color={animationState === 'manufacturing' ? '#d97706' : '#94a3b8'} />
                            </motion.div>
                            <motion.div
                                animate={animationState === 'manufacturing' ? { rotate: -360 } : {}}
                                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                style={{ display: 'flex', marginTop: '0.5rem' }}
                            >
                                <GearIcon size={26} color={animationState === 'manufacturing' ? 'var(--text)' : '#cbd5e1'} />
                            </motion.div>
                        </div>

                        {/* Status Display */}
                        <div style={{
                            fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 900,
                            background: statusBg, border: 'var(--border-width) solid var(--border)',
                            borderRadius: 'var(--radius)', padding: '0.4rem 0.8rem', textAlign: 'center',
                            color: 'var(--text)', boxShadow: 'var(--shadow-sm)',
                            transition: 'all 0.2s'
                        }}>
                            {animationState === 'idle' && 'Awaiting...'}
                            {animationState === 'ordering' && `parse("${activeShape?.type}")`}
                            {animationState === 'manufacturing' && `new ${activeShape?.type}()`}
                            {animationState === 'dispatching' && 'return product;'}
                        </div>

                        {/* Step indicator */}
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                            {['ordering', 'manufacturing', 'dispatching'].map((step, i) => (
                                <div key={step} style={{
                                    width: 8, height: 8,
                                    background: animationState === step ? statusColor :
                                        ['ordering', 'manufacturing', 'dispatching'].indexOf(animationState) > i ? 'var(--green)' : 'var(--bg-outer)',
                                    border: '2px solid var(--border)',
                                    transition: 'all 0.2s'
                                }} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. PRODUCT LANES */}
                <div style={{
                    flex: 1, display: 'flex', gap: '0.5rem',
                    height: isMobile ? '350px' : '100%',
                    overflowX: isMobile ? 'auto' : 'visible',
                    paddingBottom: isMobile ? '0.5rem' : 0
                }}>
                    {customTypes.map(typeObj => (
                        <div key={typeObj.type} style={{
                            flex: 1,
                            border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)',
                            background: 'var(--white)', boxShadow: 'var(--shadow)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            overflow: 'hidden', minWidth: isMobile ? '110px' : 0
                        }}>
                            {/* Lane Header */}
                            <div style={{
                                width: '100%', background: `${typeObj.color}30`,
                                borderBottom: 'var(--border-width) solid var(--border)',
                                padding: '0.4rem', textAlign: 'center',
                                fontWeight: 900, fontSize: '0.6rem', textTransform: 'uppercase',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
                            }}>
                                {getShapeIcon(typeObj.icon, 12, typeObj.color)}
                                <span>{typeObj.type}s</span>
                                <span style={{
                                    background: 'var(--text)', color: 'var(--white)', fontSize: '0.5rem',
                                    fontWeight: 900, padding: '0 4px', marginLeft: '0.2rem'
                                }}>{products.filter(p => p.type === typeObj.type).length}</span>
                            </div>

                            {/* Products Stack */}
                            <div className="hide-scrollbar" style={{
                                flex: 1, display: 'flex', flexDirection: 'column-reverse',
                                gap: '0.4rem', width: '100%', overflowY: 'auto',
                                scrollbarWidth: 'none', msOverflowStyle: 'none',
                                alignItems: 'center', padding: '0.5rem 0.3rem'
                            }}>
                                <AnimatePresence>
                                    {products.filter(p => p.type === typeObj.type).map(p => (
                                        <motion.div
                                            key={p.id}
                                            initial={{ scale: 0, y: -30 }}
                                            animate={{ scale: 1, y: 0 }}
                                            exit={{ scale: 0 }}
                                            transition={{ type: 'spring', stiffness: 250, damping: 14 }}
                                            style={{
                                                width: 42, height: 42,
                                                border: 'var(--border-width) solid var(--border)',
                                                borderRadius: 'var(--radius)',
                                                background: 'var(--white)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: `2px 2px 0 ${p.color}`,
                                            }}
                                        >
                                            {getShapeIcon(p.icon, 22, p.color)}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    ))}
                </div>

                {/* FLYING ANIMATIONS */}
                {animationState === 'ordering' && activeShape && (
                    <motion.div
                        initial={{ left: '11%', top: '50%', scale: 0.5, opacity: 0, x: '-50%', y: '-50%' }}
                        animate={{ left: '33%', top: '50%', scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        style={{
                            position: 'absolute', zIndex: 20,
                            background: activeShape.color, border: 'var(--border-width) solid var(--border)',
                            borderRadius: 'var(--radius)', padding: '4px 10px',
                            fontSize: '0.65rem', fontWeight: 900, fontFamily: 'var(--font-mono)',
                            boxShadow: 'var(--shadow-sm)', color: 'var(--text)'
                        }}
                    >
                        order({activeShape.type})
                    </motion.div>
                )}

                {animationState === 'dispatching' && activeShape && (
                    <motion.div
                        initial={{ left: '33%', top: '50%', scale: 0.6, opacity: 0.8, x: '-50%', y: '-50%' }}
                        animate={{ left: getLaneLeft(activeShape.type), top: '15%', scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                        style={{
                            position: 'absolute', zIndex: 20,
                            background: activeShape.color, border: 'var(--border-width) solid var(--border)',
                            borderRadius: 'var(--radius)',
                            width: 42, height: 42,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                    >
                        {getShapeIcon(activeShape.icon, 22, activeShape.color)}
                    </motion.div>
                )}

            </div>
        </div>
    );
};


/* ══════════════════════════════════════════════════════════════
   3. OBSERVER — Broadcast Tower
   ══════════════════════════════════════════════════════════════ */
const ObserverSim = ({ isMobile }) => {
    const [subscribers, setSubscribers] = useState([
        { id: 1, name: 'EmailNotifier', icon: 'EmailIcon', subscribed: true, active: false, msg: '' },
        { id: 2, name: 'SMSNotifier', icon: 'PhoneIcon', subscribed: true, active: false, msg: '' },
        { id: 3, name: 'PushNotifier', icon: 'BellIcon', subscribed: true, active: false, msg: '' },
        { id: 4, name: 'SlackWebhook', icon: 'SendIcon', subscribed: false, active: false, msg: '' },
        { id: 5, name: 'ConsoleLogger', icon: 'LaptopIcon', subscribed: true, active: false, msg: '' },
    ]);
    const [publishing, setPublishing] = useState(false);
    const [wave, setWave] = useState(false);
    const [msgLog, setMsgLog] = useState([]);
    
    // User input
    const [channelName, setChannelName] = useState('NewsPublisher');
    const [newSubName, setNewSubName] = useState('');
    const [customMsg, setCustomMsg] = useState('');
    const nextId = useRef(10);
    const SUB_ICONS = ['EmailIcon', 'PhoneIcon', 'BellIcon', 'SendIcon', 'LaptopIcon'];

    const getObserverPosition = (index, total) => {
        const angle = (index * (2 * Math.PI) / total) - Math.PI / 2;
        const radiusX = 35;
        const radiusY = 35;
        return {
            x: `${50 + radiusX * Math.cos(angle)}%`,
            y: `${50 + radiusY * Math.sin(angle)}%`,
            angle: angle
        };
    };

    const toggleSub = (id) => {
        if (publishing) return;
        setSubscribers(prev => prev.map(s => s.id === id ? { ...s, subscribed: !s.subscribed } : s));
    };

    const addSub = () => {
        if (publishing) return;
        const name = newSubName.trim() || `ClientNotifier ${nextId.current}`;
        if (subscribers.length >= 8) return;
        setSubscribers(prev => [
            ...prev,
            {
                id: nextId.current++,
                name,
                icon: SUB_ICONS[subscribers.length % SUB_ICONS.length],
                subscribed: true,
                active: false,
                msg: ''
            }
        ]);
        setNewSubName('');
    };

    const removeSub = (id) => {
        if (publishing) return;
        setSubscribers(prev => prev.filter(s => s.id !== id));
    };

    const publish = async () => {
        if (publishing || subscribers.filter(s => s.subscribed).length === 0) return;
        
        const msg = customMsg.trim() || `Payload #${Math.floor(100 + Math.random() * 900)}`;
        setPublishing(true);
        setWave(true);
        
        setSubscribers(prev => prev.map(s => ({ ...s, active: false })));

        setTimeout(() => setWave(false), 1200);

        await new Promise(r => setTimeout(r, 800));

        setSubscribers(prev => prev.map(s => {
            if (s.subscribed) {
                return { ...s, active: true, msg: msg };
            }
            return { ...s, msg: s.subscribed ? s.msg : '' };
        }));

        setMsgLog(prev => [
            { msg, time: Date.now(), count: subscribers.filter(s => s.subscribed).length },
            ...prev
        ].slice(0, 5));

        await new Promise(r => setTimeout(r, 1800));

        setSubscribers(prev => prev.map(s => ({ ...s, active: false })));
        setPublishing(false);
    };

    return (
        <div style={{ ...FULL, padding: '1rem', gap: '0.8rem' }}>
            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
            {DOT_BG('obsGrid')}

            {/* Header Control Panel */}
            <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'center', 
                justifyContent: 'space-between', 
                gap: '0.6rem', 
                flexShrink: 0, 
                zIndex: 10, 
                borderBottom: '2.5px solid var(--border)', 
                paddingBottom: '0.6rem' 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0f172a' }}>Subject:</span>
                        <input value={channelName} onChange={e => setChannelName(e.target.value)} style={{ ...MINI_INPUT, width: 120, height: 26, fontSize: '0.7rem', border: '2px solid var(--border)' }} disabled={publishing} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0f172a' }}>Message:</span>
                        <input value={customMsg} onChange={e => setCustomMsg(e.target.value)} placeholder="Enter payload..." style={{ ...MINI_INPUT, width: 180, height: 26, fontSize: '0.7rem', border: '2px solid var(--border)' }} disabled={publishing} onKeyDown={e => e.key === 'Enter' && publish()} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', alignSelf: isMobile ? 'flex-end' : 'auto' }}>
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                        <input value={newSubName} onChange={e => setNewSubName(e.target.value)} placeholder="New Observer"
                            style={{ ...MINI_INPUT, width: 100, height: 26, fontSize: '0.7rem', border: '2px solid var(--border)' }} disabled={publishing || subscribers.length >= 8} onKeyDown={e => e.key === 'Enter' && addSub()} />
                        <button className="btn btn-sm" style={{ background: '#66d9ef', color: '#0f172a', border: '2px solid var(--border)', fontSize: '0.65rem', padding: '0.3rem 0.6rem', fontWeight: 800, cursor: 'pointer' }} onClick={addSub} disabled={publishing || subscribers.length >= 8}>+ Add</button>
                    </div>

                    <button className="btn btn-sm" style={{ background: '#ff6b9d', color: '#fff', border: '2px solid var(--border)', fontSize: '0.65rem', padding: '0.3rem 0.6rem', fontWeight: 800, cursor: 'pointer' }} onClick={publish} disabled={publishing || subscribers.filter(s => s.subscribed).length === 0}>
                        notifyObservers()
                    </button>
                </div>
            </div>

            {/* Main Interactive Circle View */}
            <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1.2rem', minHeight: 0, zIndex: 1, overflowY: isMobile ? 'auto' : 'visible' }}>
                
                {/* Visualizer Canvas */}
                <div style={{ 
                    flex: isMobile ? 'none' : 1, 
                    border: '2.5px solid var(--border)', 
                    borderRadius: '12px', 
                    background: '#f8fafc', 
                    position: 'relative', 
                    overflowX: isMobile ? 'auto' : 'hidden',
                    overflowY: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isMobile ? 'flex-start' : 'center',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                    height: isMobile ? '400px' : 'auto'
                }}>
                    <div style={{
                        position: 'relative',
                        width: isMobile ? 650 : '100%',
                        height: '100%',
                        minWidth: isMobile ? 650 : 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        
                        {/* SVG Subscription Connections */}
                        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                            {subscribers.map((sub, idx) => {
                                const pos = getObserverPosition(idx, subscribers.length);
                                return (
                                    <motion.line
                                        key={`line-${sub.id}`}
                                        x1="50%"
                                        y1="50%"
                                        x2={pos.x}
                                        y2={pos.y}
                                        stroke={sub.subscribed ? '#ff6b9d' : 'var(--border)'}
                                        strokeWidth={sub.subscribed ? '3' : '1.5'}
                                        strokeDasharray={sub.subscribed ? 'none' : '4,4'}
                                        animate={sub.subscribed && publishing ? {
                                            strokeDasharray: ['0,0', '8,4', '0,0']
                                        } : {}}
                                        transition={{ duration: 0.8 }}
                                        style={{ 
                                            opacity: sub.subscribed ? 0.8 : 0.2, 
                                            transition: 'all 0.3s' 
                                        }}
                                    />
                                );
                            })}
                        </svg>

                        {/* Outer Broadcast Wave Ripples */}
                        {wave && [1, 2, 3].map(i => (
                            <motion.div
                                key={`ripple-${i}`}
                                initial={{ width: 60, height: 60, opacity: 0.8 }}
                                animate={{ width: 500, height: 500, opacity: 0 }}
                                transition={{ duration: 1.2, ease: 'easeOut', delay: i * 0.15 }}
                                style={{
                                    position: 'absolute',
                                    left: '50%',
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    borderRadius: '50%',
                                    border: '2.5px solid #ff6b9d',
                                    pointerEvents: 'none',
                                    zIndex: 2
                                }}
                            />
                        ))}

                        {/* Pulses traveling to Subscribed Observers */}
                        {publishing && wave && subscribers.map((sub, idx) => {
                            if (!sub.subscribed) return null;
                            const pos = getObserverPosition(idx, subscribers.length);
                            return (
                                <motion.div
                                    key={`pulse-${sub.id}`}
                                    initial={{ left: '50%', top: '50%', scale: 0.4, opacity: 1, x: '-50%', y: '-50%' }}
                                    animate={{ left: pos.x, top: pos.y, scale: 1, opacity: [1, 1, 0] }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                    style={{
                                        position: 'absolute',
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        background: '#ff6b9d',
                                        border: '2px solid var(--border)',
                                        boxShadow: '2px 2px 0 var(--border)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 15,
                                    }}
                                >
                                    <ZapIcon size={12} color="#fff" />
                                </motion.div>
                            );
                        })}

                        {/* Central Publisher / Broadcast Subject Tower */}
                        <div style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <motion.div
                                animate={publishing ? { 
                                    scale: [1, 1.15, 0.95, 1.05, 1],
                                    boxShadow: ['0 0 15px rgba(255,107,157,0.3)', '0 0 35px rgba(255,107,157,0.8)', '0 0 15px rgba(255,107,157,0.3)']
                                } : {}}
                                transition={{ duration: 0.8 }}
                                style={{
                                    width: 100,
                                    height: 100,
                                    borderRadius: '50%',
                                    border: '2.5px solid var(--border)',
                                    background: '#fff',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '4px 4px 0 var(--border)',
                                    cursor: 'default'
                                }}
                            >
                                <SignalIcon size={32} color="#ff6b9d" />
                                <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: '#ff6b9d', marginTop: '2px' }}>
                                    {publishing ? 'Broadcasting' : 'Subject'}
                                </span>
                            </motion.div>
                            <div style={{
                                marginTop: '0.5rem',
                                background: '#000',
                                color: '#fff',
                                fontSize: '0.55rem',
                                fontFamily: 'var(--font-mono)',
                                padding: '3px 10px',
                                borderRadius: '4px',
                                fontWeight: 900,
                                boxShadow: '2px 2px 0 var(--border)',
                                whiteSpace: 'nowrap'
                            }}>
                                {channelName}
                            </div>
                        </div>

                        {/* Observers layout */}
                        {subscribers.map((sub, idx) => {
                            const pos = getObserverPosition(idx, subscribers.length);
                            return (
                                <div
                                    key={sub.id}
                                    style={{
                                        position: 'absolute',
                                        left: pos.x,
                                        top: pos.y,
                                        transform: 'translate(-50%, -50%)',
                                        zIndex: 6,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center'
                                    }}
                                >
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => toggleSub(sub.id)}
                                        style={{
                                            border: '2.5px solid var(--border)',
                                            borderRadius: '10px',
                                            padding: '0.4rem 0.6rem',
                                            background: sub.active ? '#ecfdf5' : (sub.subscribed ? '#fff' : '#f1f5f9'),
                                            boxShadow: sub.active 
                                                ? '3px 3px 0 #10b981' 
                                                : `3px 3px 0 ${sub.subscribed ? '#ff6b9d' : 'var(--border)'}`,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            minWidth: 110,
                                            cursor: 'pointer',
                                            opacity: sub.subscribed ? 1 : 0.65,
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                                            {getObserverIcon(sub.icon, 18, sub.subscribed ? '#0f172a' : '#64748b')}
                                            <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#0f172a' }}>{sub.name}</span>
                                        </div>
                                        
                                        <div style={{ 
                                            fontSize: '0.5rem', 
                                            fontFamily: 'var(--font-mono)', 
                                            padding: '2px 4px', 
                                            borderRadius: '3px', 
                                            background: sub.active ? '#10b981' : (sub.subscribed ? '#ff6b9d15' : '#e2e8f0'), 
                                            color: sub.active ? '#fff' : (sub.subscribed ? '#ff6b9d' : '#475569'),
                                            border: `1px solid ${sub.active ? '#10b981' : (sub.subscribed ? '#ff6b9d30' : '#cbd5e1')}`,
                                            fontWeight: 900,
                                            width: '100%',
                                            textAlign: 'center'
                                        }}>
                                            {sub.active ? '✓ NOTIFIED' : (sub.subscribed ? 'SUBSCRIBED' : 'UNSUBSCRIBED')}
                                        </div>

                                        {sub.msg && (
                                            <div style={{
                                                marginTop: '0.4rem',
                                                fontSize: '0.52rem',
                                                fontFamily: 'var(--font-mono)',
                                                background: sub.active ? '#10b98125' : '#f1f5f9',
                                                color: sub.active ? '#047857' : '#334155',
                                                border: `1.5px solid ${sub.active ? '#10b98150' : 'var(--border)'}`,
                                                padding: '2px 4px',
                                                borderRadius: '4px',
                                                fontWeight: 800,
                                                width: '100%',
                                                textAlign: 'center',
                                                wordBreak: 'break-all'
                                            }}>
                                                {sub.msg}
                                            </div>
                                        )}

                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeSub(sub.id);
                                            }}
                                            disabled={publishing}
                                            style={{ 
                                                fontSize: '0.48rem', 
                                                cursor: publishing ? 'not-allowed' : 'pointer', 
                                                background: '#ef444415', 
                                                color: '#ef4444', 
                                                border: '1px solid #ef444430', 
                                                borderRadius: '4px', 
                                                padding: '2px 4px', 
                                                marginTop: '0.3rem', 
                                                fontWeight: 800,
                                                width: '100%',
                                                opacity: publishing ? 0.5 : 1
                                            }}
                                        >
                                            Delete Observer
                                        </button>
                                    </motion.div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar Broadcast Log & Info */}
                <div style={{ 
                    width: isMobile ? '100%' : '25%', 
                    border: '2.5px solid var(--border)', 
                    borderRadius: '12px', 
                    background: '#fff', 
                    padding: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                    boxShadow: '4px 4px 0 var(--border)',
                    height: isMobile ? '250px' : 'auto'
                }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a' }}>
                        Broadcast History
                    </div>
                    
                    <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {msgLog.map((m) => (
                            <motion.div 
                                key={m.time} 
                                initial={{ x: 15, opacity: 0 }} 
                                animate={{ x: 0, opacity: 1 }}
                                style={{ 
                                    fontSize: '0.55rem', 
                                    padding: '0.35rem 0.5rem', 
                                    background: '#ff6b9d08', 
                                    border: '2px solid var(--border)',
                                    borderLeft: '4px solid #ff6b9d', 
                                    borderRadius: '6px',
                                    boxShadow: '2px 2px 0 var(--border)'
                                }}
                            >
                                <div style={{ fontWeight: 800, color: '#0f172a' }}>"{m.msg}"</div>
                                <div style={{ opacity: 0.7, marginTop: '2px', display: 'flex', justifyContent: 'space-between', color: '#334155', fontWeight: 700 }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}><SignalIcon size={12} color="#ff6b9d" /> Broadcasted</span>
                                    <span>{m.count} notified</span>
                                </div>
                            </motion.div>
                        ))}
                        {msgLog.length === 0 && (
                            <div style={{ fontSize: '0.58rem', color: '#475569', fontStyle: 'italic', textAlign: 'center', marginTop: '2rem', fontWeight: 700 }}>
                                No payloads broadcasted yet. Click "notifyObservers()" to run simulation.
                            </div>
                        )}
                    </div>
                    
                    <div style={{ 
                        borderTop: '2px solid var(--border)', 
                        paddingTop: '0.6rem', 
                        fontSize: '0.52rem', 
                        color: '#334155',
                        fontWeight: 700,
                        lineHeight: 1.4
                    }}>
                        <strong>Interactive Hint:</strong> Click any observer node to toggle its subscription. When the Subject notifies observers, unsubscribed ones are ignored!
                    </div>
                </div>
            </div>
        </div>
    );
};


/* ══════════════════════════════════════════════════════════════
   4. DECORATOR — Layered Enhancement
   ══════════════════════════════════════════════════════════════ */
const DecoratorSim = ({ isMobile }) => {
    const [decorators, setDecorators] = useState([]);
    // User input
    const [baseName, setBaseName] = useState('Coffee');
    const [baseCost, setBaseCost] = useState(50);
    const [addons, setAddons] = useState([
        { name: 'Milk', cost: 10, color: '#ffd93d' },
        { name: 'Sugar', cost: 5, color: '#a8e6cf' },
        { name: 'Whip', cost: 10, color: '#ff6b9d' },
        { name: 'Vanilla', cost: 15, color: '#b39ddb' },
    ]);
    const [newAddon, setNewAddon] = useState('');
    const [newCost, setNewCost] = useState('');
    const ADDON_COLORS = ['#ffb347', '#4dd0c8', '#66d9ef', '#f0a0c0', '#90cdf4'];

    const totalCost = baseCost + decorators.reduce((a, d) => a + d.cost, 0);
    const addDeco = (item) => setDecorators(prev => [...prev, { ...item, id: Date.now() }]);
    const removeDeco = (id) => setDecorators(prev => prev.filter(d => d.id !== id));
    const addAddon = () => {
        if (!newAddon.trim()) return;
        const cost = parseInt(newCost) || 10;
        setAddons(prev => [...prev, { name: newAddon.trim(), cost, color: ADDON_COLORS[addons.length % ADDON_COLORS.length] }]);
        setNewAddon(''); setNewCost('');
    };

    const L = decorators.length;
    const coreSize = 110;
    const maxOuterSize = 270;
    const step = L > 0 ? (maxOuterSize - coreSize) / L : 0;

    return (
        <div style={{ ...FULL, padding: '1rem', gap: '0.8rem' }}>
            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
            {DOT_BG('decoGrid')}

            {/* Controls row */}
            <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'center', 
                justifyContent: 'space-between', 
                gap: '0.6rem', 
                flexShrink: 0, 
                zIndex: 10, 
                borderBottom: '2.5px solid var(--border)', 
                paddingBottom: '0.6rem' 
            }}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0f172a' }}>Add Decorator:</span>
                    {addons.map(item => (
                        <motion.button key={item.name} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            className="btn btn-sm" 
                            style={{ 
                                background: item.color, 
                                border: '2px solid var(--border)', 
                                fontSize: '0.65rem',
                                padding: '0.3rem 0.6rem',
                                fontWeight: 800,
                                color: '#0f172a',
                                boxShadow: '2px 2px 0 var(--border)',
                                cursor: 'pointer'
                            }}
                            onClick={() => addDeco(item)}>
                            + {item.name} (₹{item.cost})
                        </motion.button>
                    ))}
                </div>
                
                <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center', alignSelf: isMobile ? 'flex-end' : 'auto' }}>
                    <input value={newAddon} onChange={e => setNewAddon(e.target.value)} placeholder="Addon Name"
                        style={{ ...MINI_INPUT, width: 80, height: 26, fontSize: '0.7rem', border: '2px solid var(--border)' }} />
                    <input value={newCost} onChange={e => setNewCost(e.target.value)} placeholder="₹"
                        style={{ ...MINI_INPUT, width: 35, height: 26, fontSize: '0.7rem', border: '2px solid var(--border)' }} onKeyDown={e => e.key === 'Enter' && addAddon()} />
                    <button className="btn btn-sm" style={{ background: '#a8e6cf', border: '2px solid var(--border)', fontSize: '0.65rem', padding: '0.3rem 0.5rem', fontWeight: 800, color: '#0f172a', cursor: 'pointer' }} onClick={addAddon}>+</button>
                </div>
            </div>

            {/* Main visual: structured layout */}
            <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1.2rem', minHeight: 0, zIndex: 1, overflowY: isMobile ? 'auto' : 'visible' }}>
                
                {/* Left Visualizer Canvas */}
                <div style={{
                    flex: isMobile ? 'none' : 1,
                    height: isMobile ? '350px' : 'auto',
                    border: '2.5px solid var(--border)',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }}>
                    <div style={{ position: 'relative', width: 320, height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {decorators.slice().reverse().map((d, i) => {
                            const size = coreSize + (L - i) * step;
                            return (
                                <motion.div 
                                    key={d.id} 
                                    initial={{ scale: 0 }} 
                                    animate={{ scale: 1 }}
                                    onClick={() => removeDeco(d.id)}
                                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                    style={{
                                        position: 'absolute', 
                                        width: size, 
                                        height: size,
                                        borderRadius: '50%', 
                                        border: `3px solid var(--border)`, 
                                        background: `${d.color}15`,
                                        cursor: 'pointer', 
                                        display: 'flex', 
                                        alignItems: 'flex-start', 
                                        justifyContent: 'center',
                                        paddingTop: '6px',
                                        boxShadow: `inset 0 0 10px ${d.color}30`
                                    }}
                                >
                                    <span style={{ 
                                        fontSize: '0.52rem', 
                                        fontWeight: 900, 
                                        color: '#0f172a', 
                                        background: d.color, 
                                        padding: '1px 6px', 
                                        borderRadius: '8px', 
                                        border: `1.5px solid var(--border)`,
                                        boxShadow: '1px 1px 0 var(--border)',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {d.name} (+₹{d.cost})
                                    </span>
                                </motion.div>
                            );
                        })}
                        
                        {/* Core base object (Coffee Cup) */}
                        <div style={{
                            width: coreSize, 
                            height: coreSize, 
                            borderRadius: '50%', 
                            border: '3.5px solid var(--border)',
                            background: 'radial-gradient(circle at 35% 35%, #a0714e, #6f4e37)',
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            zIndex: L + 1, 
                            position: 'relative',
                            boxShadow: '4px 4px 0 var(--border)',
                        }}>
                            <CoffeeIcon size={32} color="#fff" style={{ marginBottom: '0.2rem' }} />
                            <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#fff' }}>{baseName}</div>
                            <div style={{ fontSize: '0.55rem', color: '#ffd93d', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>₹{baseCost}</div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar Composition Stack */}
                <div style={{ 
                    width: isMobile ? '100%' : '25%', 
                    border: '2.5px solid var(--border)', 
                    borderRadius: '12px', 
                    background: '#fff', 
                    padding: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                    boxShadow: '4px 4px 0 var(--border)',
                    height: isMobile ? '300px' : 'auto'
                }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a' }}>
                        Composition Stack
                    </div>
                    
                    <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {/* Decorators top to bottom */}
                        {decorators.slice().reverse().map((d) => (
                            <motion.div 
                                key={d.id} 
                                initial={{ x: -15, opacity: 0 }} 
                                animate={{ x: 0, opacity: 1 }}
                                style={{ 
                                    padding: '0.35rem 0.5rem', 
                                    border: '2px solid var(--border)',
                                    borderLeft: `4px solid ${d.color}`,
                                    borderRadius: '6px', 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    background: `${d.color}08`, 
                                    fontSize: '0.62rem', 
                                    fontWeight: 800,
                                    boxShadow: '1.5px 1.5px 0 var(--border)'
                                }}
                            >
                                <span style={{ color: '#0f172a' }}>↳ {d.name}</span>
                                <span style={{ fontFamily: 'var(--font-mono)', color: '#334155' }}>+₹{d.cost}</span>
                            </motion.div>
                        ))}
                        
                        {/* Base */}
                        <div style={{ 
                            padding: '0.35rem 0.5rem', 
                            background: '#f8fafc', 
                            border: '2px solid var(--border)',
                            borderRadius: '6px',
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            fontSize: '0.62rem', 
                            fontWeight: 900,
                            boxShadow: '1.5px 1.5px 0 var(--border)'
                        }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><CoffeeIcon size={14} /> {baseName} (Base)</span>
                            <span style={{ fontFamily: 'var(--font-mono)' }}>₹{baseCost}</span>
                        </div>
                    </div>

                    <div style={{ 
                        borderTop: '2px solid var(--border)', 
                        paddingTop: '0.6rem', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.4rem' 
                    }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.15rem', color: '#0f172a', textAlign: 'center' }}>
                            Total: ₹{totalCost}
                        </div>
                        <div style={{ fontSize: '0.5rem', color: '#475569', textAlign: 'center', fontWeight: 700 }}>
                            Click any ring to remove that decorator layer
                        </div>

                        {/* Base editor */}
                        <div style={{ display: 'flex', gap: '0.2rem', marginTop: '0.2rem' }}>
                            <input value={baseName} onChange={e => setBaseName(e.target.value)} style={{ ...MINI_INPUT, flex: 1, fontSize: '0.65rem', border: '1.5px solid var(--border)', height: 24 }} placeholder="Base Name" />
                            <input type="number" value={baseCost} onChange={e => setBaseCost(Number(e.target.value) || 0)} style={{ ...MINI_INPUT, width: 45, fontSize: '0.65rem', border: '1.5px solid var(--border)', height: 24 }} placeholder="₹" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


/* ══════════════════════════════════════════════════════════════
   5. STRATEGY — Swap Algorithms
   ══════════════════════════════════════════════════════════════ */
const StrategySim = ({ isMobile }) => {
    const [strategies, setStrategies] = useState([
        {
            id: 'road',
            name: 'RoadTripStrategy',
            label: 'Road Trip (Car)',
            color: '#ffb347',
            speed: 'High (80 km/h)',
            cost: '$18.50',
            carbon: '2.4 kg CO2',
            icon: 'car',
            desc: 'Interstate highways. Avoids obstacles via bridges, toll fees apply.',
            waypoints: [{ x: 25, y: 150 }, { x: 90, y: 80 }, { x: 160, y: 80 }, { x: 230, y: 80 }, { x: 230, y: 220 }, { x: 295, y: 150 }],
            code: `class RoadTripStrategy implements RouteStrategy {
    public List<Point> buildRoute(Point a, Point b) {
        // Highway routing engine
        return getHighwayRoute(a, b);
    }
}`
        },
        {
            id: 'hiking',
            name: 'HikingStrategy',
            label: 'Hiking Trail (Walk)',
            color: '#ffd93d',
            speed: 'Low (5 km/h)',
            cost: '$0.00',
            carbon: '0.0 kg CO2',
            icon: 'walk',
            desc: 'Direct forest paths. Zero cost, eco-friendly.',
            waypoints: [{ x: 25, y: 150 }, { x: 95, y: 185 }, { x: 160, y: 185 }, { x: 225, y: 115 }, { x: 295, y: 150 }],
            code: `class HikingStrategy implements RouteStrategy {
    public List<Point> buildRoute(Point a, Point b) {
        // Pedestrian forest trails
        return getWalkingTrails(a, b);
    }
}`
        },
        {
            id: 'sky',
            name: 'SkyExpressStrategy',
            label: 'Sky Express (Drone)',
            color: '#ff6b9d',
            speed: 'Extreme (150 km/h)',
            cost: '$45.00',
            carbon: '0.8 kg CO2',
            icon: 'drone',
            desc: 'Direct line (beeline) over all terrain. Expensive but fastest.',
            waypoints: [{ x: 25, y: 150 }, { x: 295, y: 150 }],
            code: `class SkyExpressStrategy implements RouteStrategy {
    public List<Point> buildRoute(Point a, Point b) {
        // Straight flight beeline
        return getDirectLine(a, b);
    }
}`
        },
        {
            id: 'transit',
            name: 'TransitStrategy',
            label: 'Rail Transit (Train)',
            color: '#66d9ef',
            speed: 'Medium (60 km/h)',
            cost: '$3.50',
            carbon: '0.3 kg CO2',
            icon: 'train',
            desc: 'Fixed railway line and stations. Fast and cheap.',
            waypoints: [{ x: 25, y: 150 }, { x: 60, y: 260 }, { x: 160, y: 260 }, { x: 240, y: 260 }, { x: 295, y: 150 }],
            code: `class TransitStrategy implements RouteStrategy {
    public List<Point> buildRoute(Point a, Point b) {
        // Fixed rail route
        return getRailwayPath(a, b);
    }
}`
        }
    ]);

    const [selectedStrategy, setSelectedStrategy] = useState(strategies[0]);
    const [animationState, setAnimationState] = useState('idle'); // 'idle' | 'calculating' | 'navigating' | 'finished'
    const [travelerPos, setTravelerPos] = useState({ x: 25, y: 150 });
    const [currentWaypointIdx, setCurrentWaypointIdx] = useState(0);
    const [logs, setLogs] = useState([]);
    const [customName, setCustomName] = useState('');
    const [showCode, setShowCode] = useState('java');

    const addCustomStrategy = () => {
        if (!customName.trim()) return;
        const name = customName.trim().replace(/\s+/g, '') + 'Strategy';
        const label = customName.trim();
        const randColor = ['#b39ddb', '#4dd0c8', '#f0a0c0', '#90cdf4'][strategies.length % 4];
        
        // Random path bypassing obstacles
        const waypoints = [
            { x: 25, y: 150 },
            { x: 80 + Math.floor(Math.random() * 40), y: 60 + Math.floor(Math.random() * 80) },
            { x: 180 + Math.floor(Math.random() * 40), y: 180 + Math.floor(Math.random() * 80) },
            { x: 295, y: 150 }
        ];

        const newStrat = {
            id: `custom-${Date.now()}`,
            name,
            label: `${label} (Custom)`,
            color: randColor,
            speed: 'Variable (50 km/h)',
            cost: `$${(Math.random() * 20 + 5).toFixed(2)}`,
            carbon: `${(Math.random() * 1.5).toFixed(1)} kg CO2`,
            icon: 'custom',
            desc: 'Custom user-defined path planning strategy.',
            waypoints,
            code: `class ${name} implements RouteStrategy {
    public List<Point> buildRoute(Point a, Point b) {
        // Custom path routing calculation
        return getCustomPath(a, b);
    }
}`
        };

        setStrategies(prev => [...prev, newStrat]);
        setSelectedStrategy(newStrat);
        setCustomName('');
        addLog(`Created and registered strategy: ${name}`);
    };

    const addLog = (msg) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg}`]);
    };

    const runNavigation = async () => {
        if (animationState !== 'idle') return;
        setAnimationState('calculating');
        setLogs([]);
        addLog(`CONTEXT: Client requests route from (A) to (B)`);
        addLog(`CONTEXT: Current strategy set to: ${selectedStrategy.name}`);
        
        await new Promise(r => setTimeout(r, 800));
        addLog(`STRATEGY: ${selectedStrategy.name}.buildRoute() invoked`);
        addLog(`STRATEGY: Path computed. Waypoints: ${selectedStrategy.waypoints.length}`);
        
        await new Promise(r => setTimeout(r, 600));
        setAnimationState('navigating');
        addLog(`NAVIGATOR: Executing movement at ${selectedStrategy.speed}...`);

        const wps = selectedStrategy.waypoints;
        for (let i = 0; i < wps.length; i++) {
            setTravelerPos(wps[i]);
            setCurrentWaypointIdx(i);
            if (i > 0) {
                addLog(`NAVIGATOR: Passed waypoint ${i}: (${wps[i].x}, ${wps[i].y})`);
            }
            let delay = 350;
            if (selectedStrategy.id === 'hiking') delay = 500;
            if (selectedStrategy.id === 'sky') delay = 180;
            await new Promise(r => setTimeout(r, delay));
        }

        setAnimationState('finished');
        addLog(`NAVIGATOR: Arrived at Destination (B)!`);
        addLog(`SUMMARY: Time: ${selectedStrategy.speed} | Cost: ${selectedStrategy.cost} | Eco: ${selectedStrategy.carbon}`);
    };

    const resetSim = () => {
        setAnimationState('idle');
        setTravelerPos(selectedStrategy.waypoints[0]);
        setCurrentWaypointIdx(0);
        setLogs([]);
    };

    useEffect(() => {
        resetSim();
    }, [selectedStrategy]);

    const renderIcon = (type, color) => {
        switch (type) {
            case 'car':
                return (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="3" width="15" height="13" />
                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                        <circle cx="5.5" cy="18.5" r="2.5" />
                        <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                );
            case 'walk':
                return (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="4" r="2" />
                        <path d="M13.6 15l-1.6-4-1-2.5c-.2-.6-.8-1-1.5-1H7C6.4 7.5 6 8 6 8.5v3.6" />
                        <path d="M12 11.5l1.6 3 2.4 4" />
                        <path d="M8 15v3.5" />
                    </svg>
                );
            case 'drone':
                return (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                );
            case 'train':
                return (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="2" width="16" height="16" rx="2" />
                        <line x1="4" y1="12" x2="20" y2="12" />
                        <line x1="8" y1="2" x2="8" y2="18" />
                        <line x1="16" y1="2" x2="16" y2="18" />
                        <path d="M6 22l2-4M18 22l-2-4" />
                    </svg>
                );
            default:
                return (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 2 22 22 22" />
                    </svg>
                );
        }
    };

    return (
        <div style={{ ...FULL, padding: isMobile ? '0.6rem 0.6rem 2.5rem 0.6rem' : '1.2rem', gap: isMobile ? '0.7rem' : '1rem', overflowY: isMobile ? 'auto' : 'hidden' }}>
            {DOT_BG('stratGrid')}

            {/* Top Selector Panel */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '0.5rem' : '0.6rem', flexWrap: 'wrap', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', flexShrink: 0, zIndex: 2 }}>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase', marginRight: '0.2rem' }}>Select Strategy:</span>
                    {strategies.map(s => {
                        const active = selectedStrategy.id === s.id;
                        return (
                            <button key={s.id}
                                onClick={() => setSelectedStrategy(s)}
                                style={{
                                    padding: isMobile ? '0.35rem 0.6rem' : '0.4rem 0.8rem',
                                    fontSize: isMobile ? '0.62rem' : '0.68rem',
                                    fontWeight: 900,
                                    fontFamily: 'var(--font-main)',
                                    border: 'var(--border-width) solid var(--border)',
                                    borderRadius: 'var(--radius)',
                                    background: active ? s.color : 'var(--white)',
                                    boxShadow: active ? 'var(--shadow-sm)' : 'none',
                                    cursor: 'pointer',
                                    transform: active ? 'translate(-1px, -1px)' : 'none',
                                    transition: 'all 0.1s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                }}
                            >
                                {renderIcon(s.icon, 'var(--text)')}
                                {s.label}
                            </button>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: isMobile ? 'center' : 'flex-end', width: isMobile ? '100%' : 'auto' }}>
                    <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g. Helicopter"
                        style={{ ...MINI_INPUT, width: isMobile ? 110 : 120, height: 28, border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)' }} />
                    <button style={{
                        background: 'var(--purple)', border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)',
                        fontSize: isMobile ? '0.6rem' : '0.65rem', padding: '0.3rem 0.7rem', fontWeight: 900, cursor: 'pointer', boxShadow: 'var(--shadow-sm)'
                    }} onClick={addCustomStrategy}>+ Register Strategy</button>
                </div>
            </div>

            {/* Main Content Layout */}
            <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', minHeight: 0, zIndex: 1 }}>
                
                {/* Left: Map visualizer */}
                <div style={{
                    flex: isMobile ? 'none' : 1.1,
                    height: isMobile ? '390px' : 'auto',
                    border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)',
                    background: 'var(--white)', boxShadow: 'var(--shadow)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{ background: 'var(--cyan)', borderBottom: 'var(--border-width) solid var(--border)', padding: '0.5rem 0.8rem', fontWeight: 900, fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Interactive Navigation Map</span>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                            <button style={{
                                background: 'var(--white)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)',
                                fontSize: '0.58rem', padding: '1px 6px', cursor: 'pointer', fontWeight: 800
                            }} onClick={resetSim}>Reset</button>
                            <button style={{
                                background: selectedStrategy.color, border: '1.5px solid var(--border)', borderRadius: 'var(--radius)',
                                fontSize: '0.58rem', padding: '1px 8px', cursor: 'pointer', fontWeight: 900
                            }} onClick={runNavigation} disabled={animationState !== 'idle'}>
                                {animationState === 'idle' ? 'Calculate & Run' : animationState === 'calculating' ? 'Routing...' : 'Traveling...'}
                            </button>
                        </div>
                    </div>
                    
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', position: 'relative', padding: '0 0.8rem', overflow: 'hidden' }}>
                        <svg width="100%" height="100%" viewBox="0 0 320 320" style={{ maxWidth: 320, maxHeight: 320, overflow: 'visible' }}>
                            <defs>
                                {/* Reusable Pine Tree */}
                                <g id="tree">
                                    <polygon points="6,0 11,8 8,8 10,13 2,13 4,8 1,8" fill="#2d6a4f" stroke="#0f172a" strokeWidth="1.2" />
                                    <rect x="5" y="13" width="2" height="3" fill="#78350f" stroke="#0f172a" strokeWidth="1" />
                                </g>
                                {/* Grid Pattern */}
                                <pattern id="mapGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                                    <circle cx="2" cy="2" r="1" fill="#e2e8f0" />
                                </pattern>
                            </defs>

                            {/* Background Grid */}
                            <rect width="320" height="320" fill="url(#mapGrid)" />

                            {/* Forest / Mountains Area */}
                            <rect x="205" y="70" width="80" height="90" fill="#a8e6cf25" stroke="#a8e6cf" strokeWidth="2" strokeDasharray="4,3" rx="4" />
                            <text x="245" y="82" fill="#2d6a4f" fontSize="7" fontWeight="900" textAnchor="middle" letterSpacing="0.05em">FOREST ZONE</text>
                            
                            {/* Forest trees */}
                            <use href="#tree" x="215" y="90" />
                            <use href="#tree" x="230" y="95" />
                            <use href="#tree" x="220" y="115" />
                            <use href="#tree" x="245" y="105" />
                            <use href="#tree" x="260" y="95" />
                            <use href="#tree" x="255" y="120" />
                            <use href="#tree" x="238" y="125" />

                            {/* River obstacle with beautiful gradient or waves (extended beyond y=0 to y=320) */}
                            <path d="M150,-60 Q170,80 135,160 T160,380" stroke="#90cdf4" strokeWidth="16" fill="none" opacity="0.6" />
                            <path d="M150,-60 Q170,80 135,160 T160,380" stroke="#cbd5e1" strokeWidth="18" fill="none" opacity="0.15" />
                            {/* Road Network (Highway) */}
                            <path d="M25,150 L90,80 L230,80 L230,220 L295,150" stroke="#475569" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8" />
                            <path d="M25,150 L90,80 L230,80 L230,220 L295,150" stroke="#ffd93d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4,4" fill="none" opacity="0.9" />
                            
                            {/* Rail network (Tracks) */}
                            <path d="M25,150 L60,260 L240,260 L295,150" stroke="#64748b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.6" />
                            <path d="M25,150 L60,260 L240,260 L295,150" stroke="#334155" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2,6" fill="none" opacity="0.8" />

                            {/* Bridges over river */}
                            {/* Highway Bridge */}
                            <g>
                                <rect x="135" y="73" width="25" height="14" fill="#475569" stroke="var(--border)" strokeWidth="1.5" rx="1" />
                                <line x1="140" y1="73" x2="140" y2="87" stroke="#cbd5e1" strokeWidth="1" />
                                <line x1="145" y1="73" x2="145" y2="87" stroke="#cbd5e1" strokeWidth="1" />
                                <line x1="150" y1="73" x2="150" y2="87" stroke="#cbd5e1" strokeWidth="1" />
                                <line x1="155" y1="73" x2="155" y2="87" stroke="#cbd5e1" strokeWidth="1" />
                            </g>
                            {/* Train bridge */}
                            <g>
                                <rect x="108" y="253" width="24" height="14" fill="#1e293b" stroke="var(--border)" strokeWidth="1.5" rx="1" />
                                <path d="M108,253 Q120,245 132,253" stroke="#94a3b8" fill="none" strokeWidth="1.5" />
                            </g>

                            {/* Start A / End B nodes with shadows */}
                            <circle cx="27" cy="152" r="14" fill="#000" />
                            <circle cx="25" cy="150" r="14" fill="var(--yellow)" stroke="var(--border)" strokeWidth="2.5" />
                            <text x="25" y="154" textAnchor="middle" fontSize="11" fontWeight="900" fill="var(--text)">A</text>

                            <circle cx="297" cy="152" r="14" fill="#000" />
                            <circle cx="295" cy="150" r="14" fill="var(--green)" stroke="var(--border)" strokeWidth="2.5" />
                            <text x="295" y="154" textAnchor="middle" fontSize="11" fontWeight="900" fill="var(--text)">B</text>

                            {/* Selected strategy path line with glow & animation */}
                            {selectedStrategy && (
                                <>
                                    {/* Thick glow underlay */}
                                    <polyline
                                        points={selectedStrategy.waypoints.map(w => `${w.x},${w.y}`).join(' ')}
                                        stroke={selectedStrategy.color}
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        fill="none"
                                        opacity="0.3"
                                    />
                                    {/* Running dotted line */}
                                    <motion.polyline
                                        points={selectedStrategy.waypoints.map(w => `${w.x},${w.y}`).join(' ')}
                                        stroke={selectedStrategy.color}
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeDasharray="6,4"
                                        animate={{ strokeDashoffset: [0, -20] }}
                                        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                        fill="none"
                                    />
                                </>
                            )}

                            {/* Traveler Avatar */}
                            <motion.g
                                animate={{ x: travelerPos.x - 14, y: travelerPos.y - 14 }}
                                transition={{ type: 'spring', stiffness: 150, damping: 15 }}
                            >
                                <circle cx="15.5" cy="15.5" r="13.5" fill="#000000" />
                                <circle cx="14" cy="14" r="13" fill={selectedStrategy.color} stroke="var(--border)" strokeWidth="2.5" />
                                <g transform="translate(5, 5)">
                                    {renderIcon(selectedStrategy.icon, 'var(--text)')}
                                </g>
                            </motion.g>
                        </svg>
                    </div>

                    {/* Strategy Details Box (Relative Footer to avoid overlap) */}
                    <div style={{
                        background: 'var(--white)', borderTop: 'var(--border-width) solid var(--border)',
                        padding: '0.4rem 0.6rem', fontSize: '0.62rem',
                        display: 'flex', flexDirection: 'column', gap: '0.15rem', flexShrink: 0
                    }}>
                        <span style={{ fontWeight: 900 }}>{selectedStrategy.label} Parameters:</span>
                        <div style={{ display: 'flex', gap: '0.8rem', opacity: 0.85, fontWeight: 700 }}>
                            <span>Speed: {selectedStrategy.speed}</span>
                            <span>Cost: {selectedStrategy.cost}</span>
                            <span>Carbon: {selectedStrategy.carbon}</span>
                        </div>
                    </div>
                </div>

                {/* Right: Code & Execution Console */}
                <div style={{
                    flex: isMobile ? 'none' : 1,
                    display: 'flex', flexDirection: 'column', gap: '1rem',
                    height: isMobile ? 'auto' : '100%'
                }}>
                    {/* Strategy Pattern UML / Code Explanation */}
                    <div style={{
                        border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)',
                        background: 'var(--white)', boxShadow: 'var(--shadow)', overflow: 'hidden',
                        display: 'flex', flexDirection: 'column',
                        flex: isMobile ? 'none' : 1.1,
                        height: isMobile ? '280px' : 'auto'
                    }}>
                        <div style={{ background: 'var(--yellow)', borderBottom: 'var(--border-width) solid var(--border)', padding: '0.5rem 0.8rem', fontWeight: 900, fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Interchangeable Code Implementation</span>
                            <div style={{ display: 'flex', gap: '0.2rem' }}>
                                <button onClick={() => setShowCode('java')} style={{ background: showCode === 'java' ? 'var(--text)' : 'var(--white)', color: showCode === 'java' ? 'var(--white)' : 'var(--text)', border: '1.5px solid var(--border)', fontSize: '0.55rem', fontWeight: 900, padding: '1px 5px', cursor: 'pointer' }}>Java</button>
                                <button onClick={() => setShowCode('js')} style={{ background: showCode === 'js' ? 'var(--text)' : 'var(--white)', color: showCode === 'js' ? 'var(--white)' : 'var(--text)', border: '1.5px solid var(--border)', fontSize: '0.55rem', fontWeight: 900, padding: '1px 5px', cursor: 'pointer' }}>JS</button>
                            </div>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            {/* Code snippet display */}
                            <div style={{
                                flex: 1, background: '#282a36', color: '#f8f8f2',
                                fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                                padding: '0.8rem', overflowY: 'auto', lineHeight: 1.55
                            }}>
                                {showCode === 'java' ? (
                                    <>
                                        <div style={{ color: '#ff79c6', fontWeight: 'bold' }}>// 1. Define RouteStrategy Interface</div>
                                        <div><span style={{ color: '#ff79c6' }}>interface</span> <span style={{ color: '#50fa7b' }}>RouteStrategy</span> {'{'}</div>
                                        <div style={{ paddingLeft: '1rem' }}><span style={{ color: '#8be9fd' }}>List&lt;Point&gt;</span> <span style={{ color: '#50fa7b' }}>buildRoute</span>(Point a, Point b);</div>
                                        <div>{'}'}</div>
                                        <br />
                                        <div style={{ color: '#ff79c6', fontWeight: 'bold' }}>// 2. interchangeable Strategy subclass</div>
                                        <div style={{ background: '#383a59', padding: '0.2rem 0.4rem', borderLeft: `3px solid ${selectedStrategy.color}` }}>
                                            {selectedStrategy.code}
                                        </div>
                                        <br />
                                        <div style={{ color: '#ff79c6', fontWeight: 'bold' }}>// 3. Navigator context swaps strategy at runtime</div>
                                        <div><span style={{ color: '#ff79c6' }}>class</span> <span style={{ color: '#8be9fd' }}>Navigator</span> {'{'}</div>
                                        <div style={{ paddingLeft: '1rem' }}><span style={{ color: '#ff79c6' }}>private</span> RouteStrategy strategy;</div>
                                        <div style={{ paddingLeft: '1rem' }}><span style={{ color: '#ff79c6' }}>public void</span> <span style={{ color: '#50fa7b' }}>setStrategy</span>(RouteStrategy s) {'{'} <span style={{ color: '#ff79c6' }}>this</span>.strategy = s; {'}'}</div>
                                        <div style={{ paddingLeft: '1rem' }}><span style={{ color: '#ff79c6' }}>public</span> List&lt;Point&gt; <span style={{ color: '#50fa7b' }}>navigate</span>(Point a, Point b) {'{'}</div>
                                        <div style={{ paddingLeft: '2rem' }}><span style={{ color: '#ff79c6' }}>return</span> <span style={{ color: '#ff79c6' }}>this</span>.strategy.buildRoute(a, b);</div>
                                        <div style={{ paddingLeft: '1rem' }}>{'}'}</div>
                                        <div>{'}'}</div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ color: '#ff79c6', fontWeight: 'bold' }}>// Context class using active strategy function</div>
                                        <div><span style={{ color: '#ff79c6' }}>class</span> <span style={{ color: '#8be9fd' }}>Navigator</span> {'{'}</div>
                                        <div style={{ paddingLeft: '1rem' }}>constructor(strategy) {'{'} <span style={{ color: '#ff79c6' }}>this</span>.strategy = strategy; {'}'}</div>
                                        <div style={{ paddingLeft: '1rem' }}>setStrategy(strategy) {'{'} <span style={{ color: '#ff79c6' }}>this</span>.strategy = strategy; {'}'}</div>
                                        <div style={{ paddingLeft: '1rem' }}>buildRoute(a, b) {'{'} <span style={{ color: '#ff79c6' }}>return</span> <span style={{ color: '#ff79c6' }}>this</span>.strategy(a, b); {'}'}</div>
                                        <div>{'}'}</div>
                                        <br />
                                        <div style={{ color: '#ff79c6', fontWeight: 'bold' }}>// Swappable functional strategies</div>
                                        <div style={{ background: '#383a59', padding: '0.2rem 0.4rem', borderLeft: `3px solid ${selectedStrategy.color}` }}>
                                            <span style={{ color: '#ff79c6' }}>const</span> <span style={{ color: '#50fa7b' }}>{selectedStrategy.name}</span> = (a, b) =&gt; {'{'}
                                            <div style={{ paddingLeft: '1rem' }}><span style={{ color: '#6272a4' }}>// Interchangeable calculation logic</span></div>
                                            <div style={{ paddingLeft: '1rem' }}><span style={{ color: '#ff79c6' }}>return</span> path;</div>
                                            {'};'}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Live Execution Console Logs */}
                    <div style={{
                        flex: isMobile ? 'none' : 0.9,
                        height: isMobile ? '160px' : 'auto',
                        border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)',
                        background: 'var(--white)', boxShadow: 'var(--shadow)', overflow: 'hidden',
                        display: 'flex', flexDirection: 'column'
                    }}>
                        <div style={{ background: 'var(--pink)', borderBottom: 'var(--border-width) solid var(--border)', padding: '0.5rem 0.8rem', fontWeight: 900, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <GearIcon size={16} color="var(--text)" /> Execution Log & Trace
                        </div>
                        <div style={{
                            flex: 1, background: '#1e1e1e', color: '#a8ff60',
                            fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                            padding: '0.6rem', overflowY: 'auto', display: 'flex',
                            flexDirection: 'column', gap: '0.25rem', minHeight: 80
                        }}>
                            {logs.length === 0 ? (
                                <span style={{ color: '#6272a4', fontStyle: 'italic' }}>Press "Calculate & Run" to execute Strategy runtime delegation...</span>
                            ) : (
                                logs.map((log, idx) => (
                                    <div key={idx} style={{ opacity: idx === logs.length - 1 ? 1 : 0.65 }}>
                                        {log}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function DesignPatternsSim() {
    const [activePattern, setActivePattern] = useState('singleton');
    const [speed, setSpeed] = useState(700);

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const active = PATTERNS.find(p => p.id === activePattern);

    const CENTER = (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Pattern Selector Tabs */}
            <div style={{ 
                display: 'flex', 
                borderBottom: '3px solid var(--border)', 
                flexShrink: 0,
                overflowX: isMobile ? 'auto' : 'visible',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
            }}>
                {PATTERNS.map(p => {
                    const IconComp = p.icon;
                    return (
                        <button key={p.id} onClick={() => setActivePattern(p.id)} style={{
                            flex: isMobile ? '1 0 auto' : 1,
                            minWidth: isMobile ? '90px' : 'auto',
                            padding: isMobile ? '0.4rem 0.6rem' : '0.55rem',
                            fontWeight: 800,
                            fontSize: isMobile ? '0.62rem' : '0.72rem',
                            cursor: 'pointer',
                            background: activePattern === p.id ? p.color : 'var(--white)', border: 'none',
                            borderRight: '2px solid var(--border)', fontFamily: 'var(--font-main)', color: 'var(--text)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                            transition: 'background 0.2s',
                        }}>
                            <IconComp size={16} color={activePattern === p.id ? '#000000' : 'var(--text)'} />
                            {p.name}
                        </button>
                    );
                })}
            </div>
            {/* Full-height sim area */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                <AnimatePresence mode="wait">
                    <motion.div key={activePattern}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        style={{ width: '100%', height: '100%' }}>
                        {activePattern === 'singleton' && <SingletonSim isMobile={isMobile} />}
                        {activePattern === 'factory' && <FactorySim isMobile={isMobile} />}
                        {activePattern === 'observer' && <ObserverSim isMobile={isMobile} />}
                        {activePattern === 'decorator' && <DecoratorSim isMobile={isMobile} />}
                        {activePattern === 'strategy' && <StrategySim isMobile={isMobile} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );

    const patternDescriptions = {
        singleton: { title: 'Singleton Pattern', text: 'Ensures a class has only ONE instance and provides a global point of access. All clients share the same object.', uml: 'Singleton\n- static instance\n- private constructor\n+ static getInstance()' },
        factory: { title: 'Factory Pattern', text: 'Defines an interface for creating objects, but lets subclasses decide which class to instantiate. Decouples creation from usage.', uml: 'ShapeFactory\n+ createShape(type)\n---\nCircle | Square | Triangle' },
        observer: { title: 'Observer Pattern', text: 'Defines a one-to-many dependency. When the Subject changes state, all registered Observers are notified and updated automatically.', uml: 'Subject →→→ Observer\n+ attach() + update()\n+ detach()\n+ notify()' },
        decorator: { title: 'Decorator Pattern', text: 'Attaches additional responsibilities to an object dynamically. Decorators provide a flexible alternative to subclassing.', uml: 'Component\n  └→ Decorator\n       └→ MilkDecorator\n       └→ SugarDecorator' },
        strategy: { title: 'Strategy Pattern', text: 'Defines a family of algorithms, encapsulates each one, and makes them interchangeable. Strategy lets the algorithm vary independently from clients.', uml: 'Context\n- strategy: Strategy\n+ sort()\n---\nBubble | Quick | Merge' },
    };

    const pd = patternDescriptions[activePattern];

    const LEFT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.5, textTransform: 'uppercase' }}>System State</div>
            <div style={{ border: '2px solid var(--border)', borderRadius: '6px', padding: '0.5rem 0.75rem' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.5 }}>ACTIVE PATTERN</div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: active?.color }}>{active?.name}</div>
            </div>
            <div style={{ borderTop: '2px solid var(--border)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.4, marginBottom: '0.5rem' }}>UML STRUCTURE</div>
                <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: '0.5rem', borderRadius: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', whiteSpace: 'pre-wrap', border: '2px solid #334155' }}>
                    {pd.uml}
                </pre>
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.4 }}>PATTERN CATEGORY</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                {activePattern === 'singleton' || activePattern === 'factory' ? 'Creational' : activePattern === 'decorator' ? 'Structural' : 'Behavioral'}
            </div>
        
            </div>
    );

    const ActiveIcon = active?.icon;
    const RIGHT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="panel">
                <div className="panel-header" style={{ background: active?.color || '#4dd0c8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {ActiveIcon && <ActiveIcon size={16} color="#000" />} Algorithm Logic
                </div>
                <div style={{ padding: '0.75rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.3rem' }}>{pd.title}</div>
                    <div style={{ fontSize: '0.78rem', lineHeight: 1.6, opacity: 0.8 }}>{pd.text}</div>
                </div>
            </div>
            <div className="panel">
                <div className="panel-header" style={{ background: '#ffd93d' }}>Educational Insight</div>
                <div style={{ padding: '0.75rem', fontSize: '0.78rem', lineHeight: 1.6 }}>
                    {activePattern === 'singleton' && 'Database connections, configuration managers, and thread pools typically use Singleton. Be careful — it can make testing harder!'}
                    {activePattern === 'factory' && 'Used extensively in frameworks: Document.createElement(), Calendar.getInstance(), NumberFormat.getInstance() — all are factories!'}
                    {activePattern === 'observer' && 'React\'s setState, Redux, event listeners, and RxJS all implement the Observer pattern. It\'s the backbone of reactive programming.'}
                    {activePattern === 'decorator' && 'Java\'s I/O streams use Decorator: BufferedInputStream wraps FileInputStream wraps InputStream. Each adds functionality without modifying the original.'}
                    {activePattern === 'strategy' && 'Sorting algorithms, compression algorithms, payment processing — any time you want to swap behavior at runtime, use Strategy.'}
                </div>
            </div>
            <div style={{ background: '#111', color: active?.color || '#4dd0c8', padding: '0.75rem', borderRadius: '8px', border: `2px solid ${active?.color || '#4dd0c8'}` }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.5 }}>CONCEPT: {active?.name.toUpperCase()}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', marginTop: '0.3rem' }}>GoF Design Pattern — {activePattern === 'singleton' || activePattern === 'factory' ? 'Creational' : activePattern === 'decorator' ? 'Structural' : 'Behavioral'} category</div>
            </div>
        </div>
    );

    return (
        <ImmersiveLayout isActive={true} title="Design Patterns" icon={<PuzzleIcon size={22} />} moduleLabel="OOP MODULE"
            hideControls={true}
            isRunning={false} isPaused={false} isFinished={false} speed={speed} onSpeedChange={setSpeed}
            onStart={() => { }} onPause={() => { }} onResume={() => { }} onStep={() => { }}
            onReset={() => setActivePattern('singleton')}
            currentStepNum={PATTERNS.findIndex(p => p.id === activePattern) + 1} totalSteps={PATTERNS.length}
            phaseName={`Pattern: ${active?.name}`}
            centerContent={CENTER} leftContent={LEFT} rightContent={RIGHT}
            timelineItems={PATTERNS.map((p, i) => ({ id: i, label: p.name, done: false, active: p.id === activePattern }))}
            legend={PATTERNS.map(p => ({ color: p.color, label: p.name }))}>
            <div className="main-content">
                <Link to="/oops" style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← OOP Module</Link>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><PuzzleIcon size={32} /> Design Patterns</h1>
            </div>
        </ImmersiveLayout>
    );
}
