import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import DownloadNotes from '../../components/DownloadNotes';

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
    const [animationState, setAnimationState] = useState('idle'); // 'idle' | 'ordering' | 'manufacturing' | 'dispatching'
    const [activeShape, setActiveShape] = useState(null);

    const COLORS = ['#b39ddb', '#ffb347', '#4dd0c8', '#f0a0c0', '#90cdf4', '#ffd93d'];
    const ICONS = ['PentagonShape', 'HexagonShape', 'DiamondIcon', 'SquareShape', 'CircleShape', 'TriangleShape'];

    const produce = async (shape) => {
        if (animationState !== 'idle') return;
        setActiveShape(shape);
        
        // Step 1: Client sends request to Factory (flies client -> factory)
        setAnimationState('ordering');
        await new Promise(r => setTimeout(r, 800));
        
        // Step 2: Factory runs instantiation logic (gears spin)
        setAnimationState('manufacturing');
        await new Promise(r => setTimeout(r, 1000));
        
        // Step 3: Concrete product is dispatched (flies factory -> lane)
        setAnimationState('dispatching');
        await new Promise(r => setTimeout(r, 800));
        
        // Finalize (bounces into conveyor lane stack)
        setProducts(prev => [...prev, { ...shape, id: Date.now() }]);
        setAnimationState('idle');
        setActiveShape(null);
    };

    const addType = () => {
        if (!newType.trim() || customTypes.length >= 4) return;
        const icon = ICONS[customTypes.length % ICONS.length];
        const trimmed = newType.trim();
        if (!trimmed) return;
        if (customTypes.some(t => t.type.toLowerCase() === trimmed.toLowerCase())) return;
        if (customTypes.length >= 5) return; // Limit categories

        const icons = ['TriangleShape', 'PentagonShape', 'HexagonShape'];
        const colors = ['#b39ddb', '#ffb347', '#4dd0c8'];
        const nextIdx = customTypes.length - 3; // custom categories start after default 3

        const newブルー = {
            type: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
            icon: icons[nextIdx % icons.length],
            color: colors[nextIdx % colors.length]
        };

        setCustomTypes(prev => [...prev, newブルー]);
        setNewType('');
    };

    return (
        <div style={{ ...FULL, padding: isMobile ? '0.8rem' : '1.2rem', gap: '0.8rem', overflowY: isMobile ? 'auto' : 'hidden' }}>
            {DOT_BG('factoryGrid')}

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#0f172a' }}>Factory blueprints:</span>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        <input value={newType} onChange={e => setNewType(e.target.value)} placeholder="Custom Product"
                            style={{ ...MINI_INPUT, width: 120, height: 26, fontSize: '0.7rem', border: '2px solid var(--border)' }} disabled={animationState !== 'idle'} onKeyDown={e => e.key === 'Enter' && addType()} />
                        <button className="btn btn-sm" style={{ background: '#a8e6cf', border: '2px solid var(--border)', fontSize: '0.65rem', padding: '0.3rem 0.6rem', fontWeight: 800, color: '#0f172a', cursor: 'pointer' }} onClick={addType} disabled={animationState !== 'idle' || customTypes.length >= 4}>+ Register Type</button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', alignSelf: isMobile ? 'flex-end' : 'auto' }}>
                    {products.length > 0 && (
                        <button className="btn btn-sm" style={{ background: '#ef4444', border: '2px solid var(--border)', color: '#fff', fontSize: '0.65rem', padding: '0.3rem 0.6rem', fontWeight: 800, cursor: 'pointer' }}
                            onClick={() => setProducts([])}>Clear Products</button>
                    )}
                </div>
            </div>

            {/* Main Interactive Flow */}
            <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1.2rem', minHeight: 0, zIndex: 1, position: 'relative' }}>
                
                {/* 1. Client Order Panel */}
                <div style={{ 
                    width: isMobile ? '100%' : '25%', 
                    border: '2.5px solid var(--border)', 
                    borderRadius: '12px', 
                    background: '#fff', 
                    padding: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                    boxShadow: '4px 4px 0 var(--border)'
                }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a' }}>
                        Client Interface
                    </div>
                    <div style={{ fontSize: '0.58rem', color: '#334155', fontWeight: 700, marginBottom: '0.4rem' }}>
                        Choose a shape blueprint to request instantiation through the factory:
                    </div>
                    
                    <div className="hide-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {customTypes.map(s => (
                            <motion.button 
                                key={s.type} 
                                whileHover={{ scale: 1.02 }} 
                                whileTap={{ scale: 0.98 }}
                                className="btn"
                                style={{ 
                                    background: activeShape?.type === s.type ? s.color : '#fff', 
                                    border: `2px solid var(--border)`,
                                    color: '#0f172a',
                                    fontSize: '0.7rem',
                                    padding: '0.5rem',
                                    fontWeight: 900,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    boxShadow: `3px 3px 0 ${s.color}`,
                                    cursor: 'pointer'
                                }}
                                onClick={() => produce(s)} 
                                disabled={animationState !== 'idle'}
                            >
                                <span>{getShapeIcon(s.icon, 16, activeShape?.type === s.type ? '#0f172a' : s.color)} <span style={{ marginLeft: '0.3rem' }}>{s.type} Blueprint</span></span>
                                <span style={{ fontSize: '0.6rem', fontWeight: 800 }}>Order →</span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* 2. Factory Dispatch Node */}
                <div style={{ 
                    width: isMobile ? '100%' : '30%', 
                    minHeight: isMobile ? '180px' : 'auto',
                    border: '2.5px solid var(--border)', 
                    borderRadius: '12px', 
                    background: '#fff', 
                    padding: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    boxShadow: '4px 4px 0 var(--border)',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: 10, left: 10, fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a' }}>
                        ShapeFactory
                    </div>

                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.8rem',
                        zIndex: 2
                    }}>
                        {/* Animated Gear */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.2rem' }}>
                            <motion.div
                                animate={animationState === 'manufacturing' ? { rotate: 360 } : {}}
                                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                                style={{ display: 'flex', alignItems: 'center' }}
                            >
                                <GearIcon size={32} color={animationState === 'manufacturing' ? '#d97706' : '#94a3b8'} />
                            </motion.div>
                            <motion.div
                                animate={animationState === 'manufacturing' ? { rotate: -360 } : {}}
                                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                style={{ display: 'flex', alignItems: 'center', marginTop: '0.4rem' }}
                            >
                                <GearIcon size={24} color="#1e293b" />
                            </motion.div>
                        </div>

                        <div style={{ 
                            fontSize: '0.65rem', 
                            fontFamily: 'var(--font-mono)', 
                            background: '#f8fafc', 
                            padding: '6px 12px', 
                            borderRadius: '6px', 
                            textAlign: 'center',
                            border: '2px solid var(--border)',
                            color: '#0f172a',
                            fontWeight: 800
                        }}>
                            {animationState === 'idle' && <span style={{ color: '#475569' }}>Awaiting Request...</span>}
                            {animationState === 'ordering' && <span style={{ color: '#2563eb', fontWeight: 900 }}>parseType("{activeShape?.type}")</span>}
                            {animationState === 'manufacturing' && <span style={{ color: '#d97706', fontWeight: 900 }}>new {activeShape?.type}()</span>}
                            {animationState === 'dispatching' && <span style={{ color: '#059669', fontWeight: 900 }}>return product;</span>}
                        </div>
                    </div>
                </div>

                {/* 3. Product Classification Lanes */}
                <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    gap: '0.6rem', 
                    height: isMobile ? '350px' : '100%',
                    minWidth: isMobile ? '100%' : 0,
                    overflowX: isMobile ? 'auto' : 'visible',
                    paddingBottom: isMobile ? '0.5rem' : 0
                }}>
                    {customTypes.map(typeObj => (
                        <div key={typeObj.type} style={{
                            flex: 1,
                            border: '2.5px solid var(--border)',
                            borderRadius: '12px',
                            background: '#f8fafc',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '0.6rem',
                            position: 'relative',
                            boxShadow: '4px 4px 0 var(--border)',
                            minWidth: isMobile ? '130px' : 0
                        }}>
                            {/* Conveyor Belt Indicator */}
                            <div style={{ 
                                fontSize: '0.62rem', 
                                fontWeight: 900, 
                                textTransform: 'uppercase', 
                                background: '#fff',
                                border: '2px solid var(--border)',
                                padding: '3px 8px',
                                borderRadius: '20px',
                                color: '#0f172a',
                                borderBottomColor: typeObj.color,
                                borderBottomWidth: '4px',
                                marginBottom: '0.6rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                zIndex: 2
                            }}>
                                {getShapeIcon(typeObj.icon, 14, typeObj.color)}
                                <span>{typeObj.type}s</span>
                            </div>

                            {/* Conveyor Lines animation background */}
                            <div style={{
                                position: 'absolute',
                                top: 40, bottom: 10, left: '50%',
                                width: 10,
                                background: 'repeating-linear-gradient(0deg, #cbd5e1 0px, #cbd5e1 10px, transparent 10px, transparent 20px)',
                                opacity: 0.7,
                                transform: 'translateX(-50%)',
                                pointerEvents: 'none'
                            }} />

                            <div className="hide-scrollbar" style={{ 
                                flex: 1, 
                                display: 'flex', 
                                flexDirection: 'column-reverse', 
                                gap: '0.5rem', 
                                width: '100%', 
                                overflowY: 'auto', 
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                                alignItems: 'center',
                                zIndex: 1,
                                paddingBottom: '0.4rem'
                            }}>
                                <AnimatePresence>
                                    {products.filter(p => p.type === typeObj.type).map(p => (
                                        <motion.div
                                            key={p.id}
                                            initial={{ scale: 0, y: -45 }}
                                            animate={{ scale: 1, y: 0 }}
                                            exit={{ scale: 0 }}
                                            transition={{ type: 'spring', stiffness: 220, damping: 12 }}
                                            style={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: '8px',
                                                border: `2px solid var(--border)`,
                                                background: '#fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: `3px 3px 0 ${p.color}`,
                                            }}
                                        >
                                            {getShapeIcon(p.icon, 24, p.color)}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Flying Overlay Animation: Client Order Request (moves client -> factory) */}
                {animationState === 'ordering' && activeShape && (
                    <motion.div
                        initial={{ left: '12.5%', top: '50%', scale: 0.6, opacity: 0, x: '-50%', y: '-50%' }}
                        animate={{ left: '42.5%', top: '50%', scale: 1.1, opacity: 1 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        style={{
                            position: 'absolute',
                            background: activeShape.color,
                            border: '2.5px solid var(--border)',
                            color: '#0f172a',
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            padding: '5px 10px',
                            borderRadius: '6px',
                            boxShadow: '3px 3px 0 var(--border)',
                            zIndex: 20,
                        }}
                    >
                        request({activeShape.type})
                    </motion.div>
                )}

                {/* Flying Overlay Animation: Product Dispatch (moves factory -> target lane top) */}
                {animationState === 'dispatching' && activeShape && (
                    <motion.div
                        initial={{ left: '42.5%', top: '50%', scale: 0.6, opacity: 0.8, x: '-50%', y: '-50%' }}
                        animate={{ left: getLaneLeft(activeShape.type), top: '15%', scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                        style={{
                            position: 'absolute',
                            background: activeShape.color,
                            border: '2.5px solid var(--border)',
                            width: 48,
                            height: 48,
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `3px 3px 0 var(--border)`,
                            zIndex: 20,
                        }}
                    >
                        {getShapeIcon(activeShape.icon, 24, activeShape.color)}
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
    const [strategy, setStrategy] = useState(null);
    const [sorting, setSorting] = useState(false);
    const [arr, setArr] = useState([64, 25, 12, 22, 11, 45, 38, 90, 55, 33]);
    const [sortedArr, setSortedArr] = useState(null);
    const [highlightIdx, setHighlightIdx] = useState(-1);
    // User input
    const [customInput, setCustomInput] = useState('');
    const [strategies, setStrategies] = useState([
        { name: 'BubbleSort', color: '#ffd93d', complexity: 'O(n²)', desc: 'Compare adjacent pairs, swap if needed' },
        { name: 'QuickSort', color: '#66d9ef', complexity: 'O(n log n)', desc: 'Pick pivot, partition, recurse' },
        { name: 'MergeSort', color: '#a8e6cf', complexity: 'O(n log n)', desc: 'Divide, sort halves, merge' },
    ]);
    const [newStratName, setNewStratName] = useState('');
    const STRAT_COLORS = ['#b39ddb', '#ffb347', '#4dd0c8', '#f0a0c0'];

    const runSort = () => {
        setSorting(true);
        setSortedArr(null);
        setHighlightIdx(-1);
        const sorted = [...arr].sort((a, b) => a - b);
        // Animate through indices
        sorted.forEach((_, i) => {
            setTimeout(() => setHighlightIdx(i), i * 80);
        });
        setTimeout(() => {
            setSortedArr(sorted);
            setSorting(false);
            setHighlightIdx(-1);
        }, sorted.length * 80 + 300);
    };

    const setCustomArray = () => {
        const nums = customInput.split(/[\s,]+/).map(Number).filter(n => !isNaN(n) && n > 0);
        if (nums.length >= 2) {
            setArr(nums.slice(0, 16));
            setSortedArr(null);
            setCustomInput('');
        }
    };

    const randomize = () => {
        setArr(Array.from({ length: 10 }, () => Math.floor(Math.random() * 99) + 1));
        setSortedArr(null);
    };

    const addStrategy = () => {
        if (!newStratName.trim()) return;
        setStrategies(prev => [...prev, { name: newStratName.trim(), color: STRAT_COLORS[strategies.length % STRAT_COLORS.length], complexity: 'O(?)', desc: 'Custom strategy' }]);
        setNewStratName('');
    };

    const displayArr = sortedArr || arr;
    const maxVal = Math.max(...displayArr);

    return (
        <div style={{ ...FULL, padding: isMobile ? '0.8rem' : '1rem 1.5rem', gap: '0.8rem' }}>
            {DOT_BG('stratGrid')}

            {/* Strategy selection row */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.5rem', flexWrap: 'wrap', alignItems: isMobile ? 'stretch' : 'center', flexShrink: 0, zIndex: 1 }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.4 }}>Strategy:</span>
                    {strategies.map(s => (
                        <motion.button key={s.name} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => { setStrategy(s); setSortedArr(null); }}
                            className="btn btn-sm"
                            style={{
                                background: strategy?.name === s.name ? s.color : 'var(--white)',
                                border: `2px solid ${s.color}`, fontSize: '0.68rem',
                                boxShadow: strategy?.name === s.name ? `0 0 12px ${s.color}60` : '2px 2px 0 var(--border)',
                            }}>
                            {s.name} <span style={{ opacity: 0.5, fontSize: '0.55rem', marginLeft: '0.2rem' }}>{s.complexity}</span>
                        </motion.button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '0.2rem', alignSelf: isMobile ? 'flex-end' : 'auto' }}>
                    <input value={newStratName} onChange={e => setNewStratName(e.target.value)} placeholder="New strategy"
                        style={{ ...MINI_INPUT, width: 100, fontSize: '0.6rem' }} onKeyDown={e => e.key === 'Enter' && addStrategy()} />
                    <button className="btn btn-sm" style={{ background: '#b39ddb', fontSize: '0.5rem' }} onClick={addStrategy}>+</button>
                </div>
            </div>

            {/* Main: bar chart + controls */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem', minHeight: 0, zIndex: 1 }}>
                {/* Sorter context box */}
                <div style={{
                    flex: 1, border: `3px solid ${strategy ? strategy.color : 'var(--border)'}`, borderRadius: '14px',
                    padding: '1rem', background: strategy ? `${strategy.color}08` : 'var(--white)',
                    boxShadow: '4px 4px 0 var(--border)', display: 'flex', flexDirection: 'column',
                    transition: 'border-color 0.3s, background 0.3s', minHeight: isMobile ? 240 : 0,
                }}>
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.4rem', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexShrink: 0, marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 900, fontSize: '0.82rem' }}>
                            Sorter Context
                            <span style={{ fontSize: '0.62rem', opacity: 0.5, marginLeft: '0.5rem' }}>
                                strategy = {strategy ? strategy.name : 'null'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.3rem', alignSelf: isMobile ? 'flex-end' : 'auto' }}>
                            <button className="btn btn-sm" style={{ background: '#f8f9fa', fontSize: '0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }} onClick={randomize}><ShuffleIcon size={12} /> Randomize</button>
                            {strategy && (
                                <button className="btn btn-sm" style={{ background: strategy.color, fontSize: '0.65rem' }}
                                    onClick={runSort} disabled={sorting}>
                                    {sorting ? 'Sorting...' : 'sort()'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Bar chart visualization — fills remaining space */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '3px', minHeight: 60, overflowX: isMobile ? 'auto' : 'visible', paddingBottom: '0.2rem' }}>
                        {displayArr.map((v, i) => {
                            const pct = (v / maxVal) * 100;
                            const isSorted = sortedArr !== null;
                            const isHighlight = i <= highlightIdx;
                            return (
                                <motion.div key={i} layout
                                    style={{
                                        flex: 1, minWidth: isMobile ? 25 : 20, maxWidth: 50,
                                        height: `${pct}%`,
                                        background: isSorted ? '#38a169' : isHighlight && sorting ? (strategy?.color || '#66d9ef') : '#e2e8f0',
                                        border: '2px solid var(--border)',
                                        borderRadius: '4px 4px 0 0',
                                        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                                        transition: 'background 0.2s, height 0.3s',
                                        position: 'relative',
                                    }}>
                                    <span style={{ fontSize: '0.58rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>{v}</span>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Custom input row */}
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.35rem', alignItems: isMobile ? 'stretch' : 'center', flexShrink: 0 }}>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flex: 1 }}>
                        <span style={{ fontSize: '0.58rem', fontWeight: 800, opacity: 0.4, whiteSpace: 'nowrap' }}>Custom array:</span>
                        <input value={customInput} onChange={e => setCustomInput(e.target.value)}
                            placeholder="e.g. 42, 17, 88, 3, 56, 71"
                            style={{ ...MINI_INPUT, flex: 1 }}
                            onKeyDown={e => e.key === 'Enter' && setCustomArray()} />
                    </div>
                    <button className="btn btn-sm" style={{ background: '#66d9ef', fontSize: '0.6rem', alignSelf: isMobile ? 'flex-end' : 'auto' }} onClick={setCustomArray}>Set</button>
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
        
            <DownloadNotes topicKey="oops/patterns" /></div>
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
