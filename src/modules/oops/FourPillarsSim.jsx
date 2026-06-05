import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';

/* ══════════════════════════════════════════════════════════════════
   CONSTANTS & DEFAULTS
   ══════════════════════════════════════════════════════════════════ */
const PILLARS = ['Encapsulation', 'Abstraction', 'Inheritance', 'Polymorphism'];
const PILLAR_COLORS = { Encapsulation: '#ffd93d', Abstraction: '#66d9ef', Inheritance: '#a8e6cf', Polymorphism: '#ff6b9d' };
const PILLAR_ICONS = { Encapsulation: '🔒', Abstraction: '🎭', Inheritance: '🌿', Polymorphism: '🔀' };

const TYPES = ['String', 'int', 'double', 'boolean', 'float', 'char'];
const VIS_OPTS = [{ val: '-', label: '- priv' }, { val: '+', label: '+ pub' }, { val: '#', label: '# prot' }];
const CHILD_ICONS = ['🐕', '🐦', '🐟', '🐱', '🐎', '🦁', '🐸', '🦊', '🐍', '🦅', '🐘', '🦈'];
const CHILD_COLORS = ['#ffd93d', '#ff6b9d', '#66d9ef', '#b39ddb', '#ffb347', '#4dd0c8'];

const NODE_W = 240, NODE_H_BASE = 42; // card width, header height

const DEFAULT_PARENT = {
    name: 'Animal',
    fields: [
        { id: 'f1', name: 'name', type: 'String', value: '"Buddy"', visibility: '-' },
        { id: 'f2', name: 'age', type: 'int', value: '5', visibility: '-' },
        { id: 'f3', name: 'energy', type: 'double', value: '100.0', visibility: '-' },
    ],
    methods: [
        { id: 'm1', name: 'makeSound', returnType: 'void', visibility: '+', response: 'Generic sound...' },
        { id: 'm2', name: 'move', returnType: 'void', visibility: '+', response: 'Moving...' },
        { id: 'm3', name: 'eat', returnType: 'void', visibility: '+', response: 'Eating...' },
    ],
};

const DEFAULT_CHILDREN = [
    {
        id: 'c1', name: 'Dog', icon: '🐕', color: '#ffd93d',
        fields: [{ id: 'cf1', name: 'breed', type: 'String', value: '"Labrador"', visibility: '-' }],
        methods: [
            { id: 'cm1', name: 'makeSound', returnType: 'void', visibility: '+', overridden: true, response: 'Woof! Woof! 🐕' },
            { id: 'cm2', name: 'fetch', returnType: 'void', visibility: '+', overridden: false, response: 'Fetching ball! 🎾' },
        ],
    },
    {
        id: 'c2', name: 'Bird', icon: '🐦', color: '#66d9ef',
        fields: [{ id: 'cf2', name: 'wingspan', type: 'double', value: '1.2', visibility: '-' }],
        methods: [
            { id: 'cm3', name: 'makeSound', returnType: 'void', visibility: '+', overridden: true, response: 'Tweet! Tweet! 🐦' },
            { id: 'cm4', name: 'fly', returnType: 'void', visibility: '+', overridden: false, response: 'Soaring high! 🌤️' },
        ],
    },
];

/* ── Canvas light theme styles ── */
const CANVAS_BG = 'var(--white)';
const CANVAS_STYLE = {
    background: `radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px), var(--bg)`,
    backgroundSize: '24px 24px',
};
const CARD_BG = 'var(--white)';
const CARD_BORDER = 'var(--border)';
const TEXT_DIM = 'var(--text)';
const TEXT_LIGHT = 'var(--text)';

const visColor = (v) => {
    if (v === '+') return '#22863a';
    if (v === '-') return '#d73a49';
    return '#b08800';
};

const glow = (color, i = 0.35) => `0 0 12px ${color}${Math.round(i * 255).toString(16).padStart(2, '0')}, 0 0 25px ${color}${Math.round(i * 0.4 * 255).toString(16).padStart(2, '0')}`;

/* ── Helpers ── */
const capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const genImplSteps = (n) => [`${n}.validate()`, `${n}.prepare()`, `${n}.execute()`, `${n}.cleanup()`];

/* ── Code generation ── */
function genJava(p, ch, pil) {
    const vis = v => v === '+' ? 'public' : v === '#' ? 'protected' : 'private';
    let c = '';
    if (pil === 'Encapsulation') {
        c += `public class ${p.name} {\n`;
        p.fields.forEach(f => { c += `    private ${f.type} ${f.name};  // Hidden\n`; });
        c += '\n    // Controlled access\n';
        p.fields.forEach(f => {
            c += `    public ${f.type} get${capFirst(f.name)}() {\n        return ${f.name};\n    }\n`;
            c += `    public void set${capFirst(f.name)}(${f.type} v) {\n        this.${f.name} = v;\n    }\n`;
        });
        c += '}';
    } else if (pil === 'Abstraction') {
        c += `// Interface (what users see)\n`;
        c += `public interface I${p.name} {\n`;
        p.methods.filter(m => m.visibility === '+').forEach(m => { c += `    ${m.returnType} ${m.name}();\n`; });
        c += '}\n\n// Implementation (hidden)\n';
        c += `public class ${p.name} implements I${p.name} {\n`;
        p.methods.forEach(m => {
            c += `    public ${m.returnType} ${m.name}() {\n`;
            genImplSteps(m.name).forEach(s => { c += `        ${s};\n`; });
            c += `    }\n`;
        });
        c += '}';
    } else if (pil === 'Inheritance') {
        c += `public class ${p.name} {\n`;
        p.fields.forEach(f => { c += `    ${vis(f.visibility)} ${f.type} ${f.name};\n`; });
        p.methods.forEach(m => { c += `    public ${m.returnType} ${m.name}() { }\n`; });
        c += '}\n';
        ch.forEach(cl => {
            c += `\npublic class ${cl.name} extends ${p.name} {\n`;
            cl.fields.forEach(f => { c += `    ${vis(f.visibility)} ${f.type} ${f.name};\n`; });
            cl.methods.filter(m => m.overridden).forEach(m => { c += `    @Override\n    public ${m.returnType} ${m.name}() {\n        // ${m.response}\n    }\n`; });
            cl.methods.filter(m => !m.overridden).forEach(m => { c += `    public ${m.returnType} ${m.name}() { }\n`; });
            c += '}\n';
        });
    } else {
        ch.forEach((cl, i) => { c += `${p.name} obj${i + 1} = new ${cl.name}();  // ${cl.icon}\n`; });
        if (!ch.length) c += `${p.name} obj = new ${p.name}();\n`;
        c += '\n// Same call → different behavior!\n';
        const mn = p.methods[0]?.name || 'do';
        ch.forEach((cl, i) => { const o = cl.methods.find(m => m.overridden); c += `obj${i + 1}.${mn}();  // "${o?.response || '...'}"\n`; });
    }
    return c;
}
function genPython(p, ch, pil) {
    let c = '';
    if (pil === 'Encapsulation') {
        c += `class ${p.name}:\n    def __init__(self):\n`;
        p.fields.forEach(f => { c += `        self.__${f.name} = ${f.value}  # private\n`; });
        c += '\n';
        p.fields.forEach(f => { c += `    @property\n    def ${f.name}(self):\n        return self.__${f.name}\n\n`; });
    } else if (pil === 'Abstraction') {
        c += `from abc import ABC, abstractmethod\n\nclass I${p.name}(ABC):\n`;
        p.methods.filter(m => m.visibility === '+').forEach(m => { c += `    @abstractmethod\n    def ${m.name}(self): pass\n\n`; });
        c += `class ${p.name}(I${p.name}):\n`;
        p.methods.forEach(m => {
            c += `    def ${m.name}(self):\n`;
            genImplSteps(m.name).forEach(s => { c += `        ${s}\n`; });
            c += '\n';
        });
    } else if (pil === 'Inheritance') {
        c += `class ${p.name}:\n    def __init__(self):\n`;
        p.fields.forEach(f => { c += `        self._${f.name} = ${f.value}\n`; });
        p.methods.forEach(m => { c += `    def ${m.name}(self): ...\n`; });
        ch.forEach(cl => {
            c += `\nclass ${cl.name}(${p.name}):  # ${cl.icon}\n    def __init__(self):\n        super().__init__()\n`;
            cl.fields.forEach(f => { c += `        self._${f.name} = ${f.value}\n`; });
            cl.methods.filter(m => m.overridden).forEach(m => { c += `    def ${m.name}(self):\n        print("${m.response}")\n`; });
        });
    } else {
        ch.forEach((cl, i) => { c += `obj${i + 1}: ${p.name} = ${cl.name}()  # ${cl.icon}\n`; });
        if (!ch.length) c += `obj = ${p.name}()\n`;
        c += '\n# Same call → different behavior!\n';
        const mn = p.methods[0]?.name || 'do';
        ch.forEach((cl, i) => { const o = cl.methods.find(m => m.overridden); c += `obj${i + 1}.${mn}()  # "${o?.response || '...'}"\n`; });
    }
    return c;
}

/* ══════════════════════════════════════════════════════════════════
   SHARED SMALL COMPONENTS
   ══════════════════════════════════════════════════════════════════ */
const MiniInput = ({ value, onChange, placeholder, style = {}, mono }) => (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ border: `1.5px solid ${CARD_BORDER}`, padding: '0.2rem 0.35rem', fontSize: '0.7rem', fontFamily: mono ? 'var(--font-mono)' : 'var(--font-main)', fontWeight: 600, background: CARD_BG, color: TEXT_LIGHT, outline: 'none', borderRadius: '4px', ...style }}
        onFocus={e => e.target.style.borderColor = '#58a6ff'} onBlur={e => e.target.style.borderColor = CARD_BORDER} />
);
const MiniSelect = ({ value, onChange, options, style = {} }) => (
    <select value={value} onChange={e => onChange(e.target.value)}
        style={{ border: `1.5px solid ${CARD_BORDER}`, padding: '0.18rem 0.2rem', fontSize: '0.65rem', fontWeight: 700, fontFamily: 'var(--font-mono)', background: CARD_BG, color: TEXT_LIGHT, cursor: 'pointer', borderRadius: '4px', ...style }}>
        {options.map(o => <option key={typeof o === 'string' ? o : o.val} value={typeof o === 'string' ? o : o.val}>{typeof o === 'string' ? o : o.label}</option>)}
    </select>
);
const NeonBtn = ({ children, onClick, color = '#58a6ff', style = {}, disabled, small }) => {
    let bg = color;
    if (color === '#58a6ff' || color === '#66d9ef') bg = 'var(--cyan)';
    else if (color === '#7ee787' || color === '#a8e6cf') bg = 'var(--green)';
    else if (color === '#ffd93d') bg = 'var(--yellow)';
    else if (color === '#ff6b9d' || color === '#f97583') bg = 'var(--pink)';
    else if (color === '#666666' || color === TEXT_DIM) bg = 'var(--bg-outer)';

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`btn ${small ? 'btn-sm' : ''}`}
            style={{
                background: bg,
                color: '#000000',
                borderRadius: 'var(--radius)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                fontSize: small ? '0.65rem' : '0.78rem',
                fontWeight: 800,
                ...style
            }}
        >
            {children}
        </button>
    );
};

/* UML-aligned field/method rows */
const DarkFieldRow = ({ f, blurred, locked }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.45rem',
        background: blurred ? 'rgba(0,0,0,0.03)' : 'transparent', borderRadius: '4px',
        filter: blurred ? 'blur(2.5px)' : 'none', transition: 'all 0.4s',
        fontFamily: 'var(--font-mono)', fontSize: '0.68rem', position: 'relative', color: 'var(--text)',
    }}>
        {locked && <span style={{ position: 'absolute', right: 4, fontSize: '0.6rem' }}>🔒</span>}
        <span style={{ color: visColor(f.visibility), fontWeight: 800 }}>{f.visibility}</span>
        <span style={{ fontWeight: 700 }}>{f.name}</span>
        <span style={{ color: 'var(--text)', opacity: 0.6 }}>: {f.type}</span>
        <span style={{ color: 'var(--text)', opacity: 0.6, marginLeft: 'auto', paddingRight: locked ? '1rem' : 0, fontSize: '0.62rem' }}>= {f.value}</span>
    </div>
);
const DarkMethodRow = ({ m, overriddenBadge, highlight }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.45rem',
        background: highlight ? 'rgba(255,107,157,0.1)' : 'transparent', borderRadius: '4px',
        fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text)',
    }}>
        <span style={{ color: visColor(m.visibility), fontWeight: 800 }}>{m.visibility}</span>
        <span style={{ fontWeight: 700 }}>{m.name}()</span>
        <span style={{ color: 'var(--text)', opacity: 0.6 }}>: {m.returnType}</span>
        {overriddenBadge && <span style={{ marginLeft: 'auto', fontSize: '0.55rem', fontWeight: 800, background: 'var(--pink)', border: '2px solid var(--border)', padding: '1px 5px', borderRadius: '4px', color: '#000000', boxShadow: 'var(--shadow-sm)' }}>OVERRIDE</span>}
    </div>
);

/* ══════════════════════════════════════════════════════════════════
   CLASS BUILDER (Left Panel)
   ══════════════════════════════════════════════════════════════════ */
const ClassBuilder = ({ parentClass, onUpdateParent, nextId }) => {
    const up = (key, val) => onUpdateParent({ ...parentClass, [key]: val });
    const upField = (id, k, v) => up('fields', parentClass.fields.map(f => f.id === id ? { ...f, [k]: v } : f));
    const addField = () => up('fields', [...parentClass.fields, { id: `f_${nextId.current++}`, name: '', type: 'String', value: '""', visibility: '-' }]);
    const rmField = id => up('fields', parentClass.fields.filter(f => f.id !== id));
    const upMethod = (id, k, v) => up('methods', parentClass.methods.map(m => m.id === id ? { ...m, [k]: v } : m));
    const addMethod = () => up('methods', [...parentClass.methods, { id: `m_${nextId.current++}`, name: '', returnType: 'void', visibility: '+', response: '' }]);
    const rmMethod = id => up('methods', parentClass.methods.filter(m => m.id !== id));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.58rem', fontWeight: 900, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>🔧 Parent Class Builder</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: TEXT_DIM }}>Class:</span>
                <MiniInput value={parentClass.name} onChange={v => up('name', v)} placeholder="Name" style={{ flex: 1 }} mono />
            </div>
            {/* Fields */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.55rem', fontWeight: 800, color: TEXT_DIM, textTransform: 'uppercase' }}>Fields ({parentClass.fields.length})</span>
                    <NeonBtn onClick={addField} color="#7ee787" small>+ Field</NeonBtn>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {parentClass.fields.map(f => (
                        <div key={f.id} style={{ display: 'flex', gap: '0.15rem', alignItems: 'center' }}>
                            <MiniSelect value={f.visibility} onChange={v => upField(f.id, 'visibility', v)} options={VIS_OPTS} style={{ width: 28 }} />
                            <MiniInput value={f.name} onChange={v => upField(f.id, 'name', v)} placeholder="name" style={{ flex: 1, minWidth: 0 }} mono />
                            <MiniSelect value={f.type} onChange={v => upField(f.id, 'type', v)} options={TYPES} style={{ width: 55 }} />
                            <button onClick={() => rmField(f.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.65rem', color: '#f97583', fontWeight: 900, padding: '0 2px' }}>✕</button>
                        </div>
                    ))}
                </div>
            </div>
            {/* Methods */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.55rem', fontWeight: 800, color: TEXT_DIM, textTransform: 'uppercase' }}>Methods ({parentClass.methods.length})</span>
                    <NeonBtn onClick={addMethod} color="#58a6ff" small>+ Method</NeonBtn>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {parentClass.methods.map(m => (
                        <div key={m.id} style={{ display: 'flex', gap: '0.15rem', alignItems: 'center' }}>
                            <MiniSelect value={m.visibility} onChange={v => upMethod(m.id, 'visibility', v)} options={VIS_OPTS} style={{ width: 28 }} />
                            <MiniInput value={m.name} onChange={v => upMethod(m.id, 'name', v)} placeholder="method" style={{ flex: 1, minWidth: 0 }} mono />
                            <MiniSelect value={m.returnType} onChange={v => upMethod(m.id, 'returnType', v)} options={['void', ...TYPES]} style={{ width: 55 }} />
                            <button onClick={() => rmMethod(m.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.65rem', color: '#f97583', fontWeight: 900, padding: '0 2px' }}>✕</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════
   ENCAPSULATION VIEW  — Dark Canvas
   ══════════════════════════════════════════════════════════════════ */
const EncapsulationView = ({ parentClass, showGetters, onToggleGetters }) => {
    const [accessLog, setAccessLog] = useState([]);
    const [shakeField, setShakeField] = useState(null);
    const [glowField, setGlowField] = useState(null);

    const tryDirect = (f) => { setShakeField(f.id); setTimeout(() => setShakeField(null), 600); setAccessLog(prev => [{ id: Date.now(), field: f.name, type: 'direct', ok: false }, ...prev].slice(0, 8)); };
    const tryGetter = (f) => { setGlowField(f.id); setTimeout(() => setGlowField(null), 800); setAccessLog(prev => [{ id: Date.now(), field: f.name, type: 'getter', ok: true }, ...prev].slice(0, 8)); };

    const privFields = parentClass.fields.filter(f => f.visibility === '-');
    const pubMethods = parentClass.methods.filter(m => m.visibility === '+');

    return (
        <div style={{ ...CANVAS_STYLE, minHeight: '100%', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: TEXT_DIM, letterSpacing: '0.12em' }}>
                ENCAPSULATION — Data Hiding & Protection
            </div>

            {/* Class Card */}
            <div style={{ position: 'relative' }}>
                <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} style={{
                    border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', width: 350,
                    boxShadow: 'var(--shadow)', background: CARD_BG,
                }}>
                    <div style={{ background: PILLAR_COLORS.Encapsulation, padding: '0.5rem 0.9rem', borderBottom: 'var(--border-width) solid var(--border)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#000000' }}>
                        🔒 {parentClass.name} <span style={{ fontSize: '0.55rem', opacity: 0.6, marginLeft: 'auto', color: '#000000' }}>ENCAPSULATED</span>
                    </div>
                    <div style={{ padding: '0.6rem' }}>
                        <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#cf222e', marginBottom: '0.2rem', textTransform: 'uppercase' }}>Private Fields (Hidden)</div>
                        {privFields.map(f => (
                            <motion.div key={f.id} animate={shakeField === f.id ? { x: [0, -6, 6, -5, 5, -2, 2, 0] } : glowField === f.id ? { scale: [1, 1.02, 1] } : {}}
                                transition={{ duration: 0.4 }} style={{ position: 'relative' }}>
                                <DarkFieldRow f={f} blurred locked />
                                {shakeField === f.id && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(207,34,46,0.15)', borderRadius: '4px', border: '1px solid #cf222e' }} />}
                                {glowField === f.id && <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.4, 0] }} transition={{ duration: 0.8 }} style={{ position: 'absolute', inset: 0, background: 'rgba(34,134,58,0.15)', borderRadius: '4px', border: '1px solid #22863a' }} />}
                            </motion.div>
                        ))}
                        <div style={{ height: 1, background: CARD_BORDER, margin: '0.4rem 0' }} />
                        <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#22863a', marginBottom: '0.2rem', textTransform: 'uppercase' }}>Public Methods (Accessible)</div>
                        {pubMethods.map(m => <DarkMethodRow key={m.id} m={m} />)}
                    </div>
                </motion.div>
                <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }} style={{
                    position: 'absolute', top: -10, right: -10, width: 32, height: 32, background: 'var(--yellow)', border: '2px solid var(--border)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', boxShadow: 'var(--shadow-sm)',
                }}>🛡️</motion.div>
            </div>

            {/* Access Simulator */}
            <div className="panel" style={{ width: 350 }}>
                <div className="panel-header" style={{ background: PILLAR_COLORS.Encapsulation, color: '#000000', padding: '0.35rem 0.65rem', fontSize: '0.65rem' }}>
                    ⚡ ACCESS SIMULATOR
                </div>
                <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {privFields.map(f => (
                        <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0', borderBottom: `1px solid ${CARD_BORDER}20` }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, flex: 1, color: TEXT_LIGHT }}>{f.name}</span>
                            <NeonBtn onClick={() => tryDirect(f)} color="#f97583" small>Direct ⚡</NeonBtn>
                            <NeonBtn onClick={() => tryGetter(f)} color="#7ee787" small>Getter 🔑</NeonBtn>
                        </div>
                    ))}
                </div>
            </div>

            {/* Access Log — Terminal Style */}
            <AnimatePresence>
                {accessLog.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="panel" style={{ width: 350, background: '#0d1117' }}>
                        <div style={{ background: '#161b22', padding: '0.35rem 0.65rem', fontSize: '0.6rem', fontWeight: 800, color: '#7ee787', borderBottom: 'var(--border-width) solid var(--border)', fontFamily: 'var(--font-mono)' }}>
                            $ ACCESS LOG
                        </div>
                        <div style={{ padding: '0.3rem 0.6rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', maxHeight: 130, overflowY: 'auto' }}>
                            {accessLog.map(l => (
                                <motion.div key={l.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: l.ok ? '#7ee787' : '#f97583', display: 'flex', gap: '0.3rem' }}>
                                    <span>{l.ok ? '✅' : '❌'}</span>
                                    <span style={{ opacity: 0.8 }}>obj.{l.type === 'direct' ? l.field : `get${capFirst(l.field)}()`}</span>
                                    <span style={{ marginLeft: 'auto', fontSize: '0.55rem', opacity: 0.5 }}>{l.ok ? 'GRANTED' : 'DENIED'}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <NeonBtn onClick={onToggleGetters} color={showGetters ? '#7ee787' : '#58a6ff'}>{showGetters ? '🔓 Hide Getters/Setters' : '🔑 Show Controlled Access'}</NeonBtn>

            <AnimatePresence>
                {showGetters && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
                        className="panel" style={{ width: 350 }}>
                        <div className="panel-header" style={{ background: 'var(--orange)', color: '#000000', fontSize: '0.6rem', padding: '0.35rem 0.65rem' }}>
                            🔑 CONTROLLED ACCESS CHANNEL
                        </div>
                        <div style={{ padding: '0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', color: 'var(--text)' }}>
                            {privFields.map(f => (
                                <div key={f.id} style={{ borderBottom: `1px dashed var(--border)`, paddingBottom: '0.2rem', marginBottom: '0.2rem' }}>
                                    <div><span style={{ color: '#22863a', fontWeight: 800 }}>+</span> get{capFirst(f.name)}(): {f.type} → <span style={{ color: 'var(--text)', opacity: 0.6 }}>returns {f.name}</span></div>
                                    <div><span style={{ color: '#22863a', fontWeight: 800 }}>+</span> set{capFirst(f.name)}({f.type} v) → <span style={{ color: 'var(--text)', opacity: 0.6 }}>validates & sets</span></div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════
   ABSTRACTION VIEW  — Dark Canvas
   ══════════════════════════════════════════════════════════════════ */
const AbstractionView = ({ parentClass }) => {
    const [revealed, setRevealed] = useState(null);
    const [showAll, setShowAll] = useState(false);
    const pubMethods = parentClass.methods.filter(m => m.visibility === '+');

    return (
        <div style={{ ...CANVAS_STYLE, minHeight: '100%', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: TEXT_DIM, letterSpacing: '0.12em' }}>ABSTRACTION — Hide Complexity, Show Simplicity</div>

            <div style={{ position: 'relative', width: 380 }}>
                {/* Clean API */}
                <motion.div animate={{ y: showAll ? -8 : 0 }} style={{ border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow)', background: CARD_BG, position: 'relative', zIndex: 2 }}>
                    <div style={{ background: 'var(--cyan)', padding: '0.5rem 0.9rem', borderBottom: 'var(--border-width) solid var(--border)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#000000' }}>
                        🎭 {parentClass.name} — Public API <span style={{ fontSize: '0.55rem', opacity: 0.6, marginLeft: 'auto', color: '#000000' }}>WHAT YOU SEE</span>
                    </div>
                    <div style={{ padding: '0.6rem' }}>
                        {pubMethods.map(m => (
                            <motion.div key={m.id} whileHover={{ x: 3 }} onClick={() => setRevealed(revealed === m.id ? null : m.id)} style={{
                                padding: '0.35rem 0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', borderRadius: '4px',
                                background: revealed === m.id ? 'rgba(102, 217, 239, 0.2)' : 'transparent', color: TEXT_LIGHT,
                            }}>
                                <span style={{ color: 'var(--cyan)' }}>▶</span> {m.name}()
                                <span style={{ marginLeft: 'auto', fontSize: '0.55rem', color: 'var(--text)', opacity: 0.6 }}>click ↓</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Water Line */}
                <div style={{ position: 'relative', height: 24, overflow: 'hidden', zIndex: 3 }}>
                    <motion.div animate={{ x: [0, -20, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', fontSize: '0.85rem', whiteSpace: 'nowrap', opacity: 0.15 }}>
                        {'〰️'.repeat(30)}
                    </motion.div>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ background: 'var(--cyan)', padding: '0.2rem 0.6rem', fontSize: '0.55rem', fontWeight: 900, color: '#000000', border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)', zIndex: 1, boxShadow: 'var(--shadow-sm)' }}>🌊 ABSTRACTION BARRIER</span>
                    </div>
                </div>

                {/* Hidden Implementation */}
                <motion.div animate={{ opacity: showAll || revealed ? 1 : 0.35 }} style={{ border: 'var(--border-width) dashed var(--border)', borderRadius: 'var(--radius)', padding: '0.7rem', background: 'var(--bg)', boxShadow: 'var(--shadow)' }}>
                    <div style={{ fontSize: '0.55rem', fontWeight: 800, color: TEXT_DIM, marginBottom: '0.3rem' }}>🔧 HIDDEN IMPLEMENTATION</div>
                    {pubMethods.map(m => {
                        const steps = genImplSteps(m.name);
                        const show = showAll || revealed === m.id;
                        return (
                            <motion.div key={m.id} animate={{ opacity: show ? 1 : 0.2, height: show ? 'auto' : 20 }} style={{ overflow: 'hidden', borderRadius: '6px', border: show ? `1px solid ${CARD_BORDER}` : 'none', marginBottom: '0.25rem' }}>
                                <div style={{ padding: '0.25rem 0.4rem', background: show ? '#66d9ef08' : 'transparent', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, color: TEXT_LIGHT }}>⚙ {m.name}()</div>
                                {show && (
                                    <div style={{ padding: '0.2rem 0.4rem 0.2rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                        {steps.map((s, si) => (
                                            <motion.div key={si} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: si * 0.08 }}
                                                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: TEXT_DIM, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <span style={{ color: '#66d9ef', fontSize: '0.4rem' }}>●</span> {s}
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>

            <NeonBtn onClick={() => setShowAll(p => !p)} color={showAll ? '#66d9ef' : '#58a6ff'}>{showAll ? '🎭 Hide Implementations' : '⚙ Reveal All'}</NeonBtn>
            <div style={{ fontSize: '0.65rem', color: TEXT_DIM, fontWeight: 600, textAlign: 'center', maxWidth: 340 }}>
                💡 Users interact with the <span style={{ color: '#66d9ef' }}>clean API</span> above. They don't need to know HOW — only THAT it works.
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════
   INHERITANCE VIEW  — Dark Canvas + DRAGGABLE CLASSES
   ══════════════════════════════════════════════════════════════════ */
const InheritanceView = ({ parentClass, childClasses, onAddChild, onRemoveChild }) => {
    const canvasRef = useRef(null);
    const [positions, setPositions] = useState({});
    const [dragging, setDragging] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newIcon, setNewIcon] = useState('🐱');
    const [newFields, setNewFields] = useState([]);
    const [overrides, setOverrides] = useState({});
    const [overrideResps, setOverrideResps] = useState({});
    const formId = useRef(300);

    // Approximate card heights
    const parentH = NODE_H_BASE + parentClass.fields.length * 20 + parentClass.methods.length * 20 + 16;
    const childH = (c) => NODE_H_BASE + (parentClass.fields.length + c.fields.length) * 18 + c.methods.length * 20 + 40;

    // Init positions
    useEffect(() => {
        const w = canvasRef.current?.offsetWidth || 800;
        setPositions(prev => {
            const next = { ...prev };
            if (!next.parent) next.parent = { x: w / 2 - NODE_W / 2, y: 30 };
            childClasses.forEach((c, i) => {
                if (!next[c.id]) {
                    const spacing = Math.min(260, (w - 60) / Math.max(childClasses.length, 1));
                    const totalW = childClasses.length * spacing;
                    const sx = (w - totalW) / 2;
                    next[c.id] = { x: Math.max(10, sx + i * spacing), y: 260 };
                }
            });
            // Cleanup deleted
            Object.keys(next).forEach(k => { if (k !== 'parent' && !childClasses.find(c => c.id === k)) delete next[k]; });
            return next;
        });
    }, [childClasses]);

    // Drag handlers
    const onMouseDown = (id, e) => {
        e.preventDefault();
        setDragging({ id, sx: e.clientX, sy: e.clientY, ox: positions[id]?.x || 0, oy: positions[id]?.y || 0 });
    };
    useEffect(() => {
        if (!dragging) return;
        const onMove = e => {
            setPositions(p => ({ ...p, [dragging.id]: { x: dragging.ox + (e.clientX - dragging.sx), y: dragging.oy + (e.clientY - dragging.sy) } }));
        };
        const onUp = () => setDragging(null);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    }, [dragging]);

    const resetForm = () => { setNewName(''); setNewIcon('🐱'); setNewFields([]); setOverrides({}); setOverrideResps({}); setShowForm(false); };
    const handleCreate = () => {
        if (!newName.trim()) return;
        const methods = [];
        parentClass.methods.forEach(m => { if (overrides[m.id]) methods.push({ id: `cm_${formId.current++}`, name: m.name, returnType: m.returnType, visibility: '+', overridden: true, response: overrideResps[m.id] || `${newName} ${m.name}!` }); });
        const color = CHILD_COLORS[childClasses.length % CHILD_COLORS.length];
        onAddChild({
            id: `c_${formId.current++}`, name: newName.trim(), icon: newIcon, color,
            fields: newFields.filter(f => f.name.trim()).map(f => ({ ...f, id: `cf_${formId.current++}` })),
            methods,
        });
        resetForm();
    };

    // SVG connection lines
    const lines = childClasses.map(c => {
        const pp = positions.parent, cp = positions[c.id];
        if (!pp || !cp) return null;
        const x1 = pp.x + NODE_W / 2, y1 = pp.y + parentH;
        const x2 = cp.x + NODE_W / 2, y2 = cp.y;
        return { id: c.id, color: c.color, d: `M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}` };
    }).filter(Boolean);

    return (
        <div ref={canvasRef} style={{ ...CANVAS_STYLE, position: 'relative', width: '100%', height: '100%', minHeight: 500, overflow: 'hidden', cursor: dragging ? 'grabbing' : 'default' }}>
            {/* Animated dash keyframes */}
            <style>{`@keyframes dashFlow { to { stroke-dashoffset: -20; } }`}</style>

            {/* SVG Connection Lines */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                {lines.map(l => (
                    <path key={l.id} d={l.d} fill="none" stroke={l.color} strokeWidth={2.5} strokeDasharray="8 4"
                        style={{ animation: 'dashFlow 1s linear infinite', filter: `drop-shadow(0 0 4px ${l.color}60)` }} />
                ))}
            </svg>

            {/* Parent Card */}
            {positions.parent && (
                <div onMouseDown={e => onMouseDown('parent', e)} style={{
                    position: 'absolute', left: positions.parent.x, top: positions.parent.y, width: NODE_W,
                    border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', background: CARD_BG,
                    boxShadow: dragging?.id === 'parent' ? 'var(--shadow-lg)' : 'var(--shadow)',
                    zIndex: dragging?.id === 'parent' ? 50 : 10, cursor: dragging?.id === 'parent' ? 'grabbing' : 'grab',
                    transition: dragging?.id === 'parent' ? 'none' : 'box-shadow 0.3s',
                    transform: dragging?.id === 'parent' ? 'scale(1.03)' : 'scale(1)',
                }}>
                    <div style={{ padding: '0.4rem 0.7rem', borderBottom: 'var(--border-width) solid var(--border)', fontWeight: 800, fontSize: '0.78rem', color: '#000000', background: 'var(--green)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        🏛️ {parentClass.name} <span style={{ fontSize: '0.5rem', color: '#000000', opacity: 0.6, marginLeft: 'auto' }}>PARENT</span>
                    </div>
                    <div style={{ padding: '0.35rem' }}>
                        {parentClass.fields.map(f => <DarkFieldRow key={f.id} f={f} />)}
                        <div style={{ height: 1, background: CARD_BORDER, margin: '0.2rem 0' }} />
                        {parentClass.methods.map(m => <DarkMethodRow key={m.id} m={m} />)}
                    </div>
                </div>
            )}

            {/* Child Cards */}
            {childClasses.map(c => positions[c.id] && (
                <div key={c.id} onMouseDown={e => onMouseDown(c.id, e)} style={{
                    position: 'absolute', left: positions[c.id].x, top: positions[c.id].y, width: NODE_W,
                    border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', background: CARD_BG,
                    boxShadow: dragging?.id === c.id ? 'var(--shadow-lg)' : 'var(--shadow)',
                    zIndex: dragging?.id === c.id ? 50 : 10, cursor: dragging?.id === c.id ? 'grabbing' : 'grab',
                    transition: dragging?.id === c.id ? 'none' : 'box-shadow 0.3s',
                    transform: dragging?.id === c.id ? 'scale(1.03)' : 'scale(1)',
                }}>
                    <div style={{ padding: '0.35rem 0.65rem', borderBottom: 'var(--border-width) solid var(--border)', fontWeight: 800, fontSize: '0.75rem', color: '#000000', background: c.color, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        {c.icon} {c.name}
                        <span style={{ fontSize: '0.45rem', color: '#000000', opacity: 0.6, marginLeft: '0.15rem' }}>extends {parentClass.name}</span>
                        <button onClick={e => { e.stopPropagation(); onRemoveChild(c.id); }} style={{ marginLeft: 'auto', border: 'none', background: 'rgba(0,0,0,0.15)', borderRadius: '50%', width: 16, height: 16, cursor: 'pointer', fontSize: '0.55rem', fontWeight: 900, color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                    <div style={{ padding: '0.3rem' }}>
                        <div style={{ fontSize: '0.48rem', fontWeight: 800, color: TEXT_DIM, textTransform: 'uppercase' }}>INHERITED</div>
                        {parentClass.fields.map(f => (
                            <div key={f.id} style={{ padding: '0.1rem 0.35rem', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', background: '#e0e0e0', borderRadius: '3px', marginBottom: 1, color: '#333' }}>
                                {f.visibility} {f.name}: {f.type}
                            </div>
                        ))}
                        {c.fields.length > 0 && <div style={{ fontSize: '0.48rem', fontWeight: 800, color: c.color, textTransform: 'uppercase', marginTop: '0.15rem' }}>OWN</div>}
                        {c.fields.map(f => (
                            <div key={f.id || f.name} style={{ padding: '0.1rem 0.35rem', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', background: c.color, borderRadius: '3px', marginBottom: 1, color: '#000' }}>
                                {f.visibility} {f.name}: {f.type}
                            </div>
                        ))}
                        <div style={{ height: 1, background: CARD_BORDER, margin: '0.2rem 0' }} />
                        {c.methods.map(m => <DarkMethodRow key={m.id} m={m} overriddenBadge={m.overridden} />)}
                    </div>
                </div>
            ))}

            {/* Add Class Button */}
            {childClasses.length < 4 && !showForm && (
                <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 20 }}>
                    <NeonBtn onClick={() => setShowForm(true)} color="#a8e6cf">+ Add Child Class</NeonBtn>
                </div>
            )}

            {/* Hint */}
            <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 20, fontSize: '0.55rem', color: TEXT_DIM, fontWeight: 700, opacity: 0.6 }}>
                ✋ Drag cards anywhere
            </div>

            {/* Add Child Form — Modal Overlay */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}
                        onClick={e => { if (e.target === e.currentTarget) resetForm(); }}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            style={{ width: 360, border: `2px solid #ffd93d50`, borderRadius: '12px', overflow: 'hidden', background: CARD_BG, boxShadow: glow('#ffd93d') }}>
                            <div style={{ background: '#ffd93d15', padding: '0.45rem 0.8rem', borderBottom: `1px solid #ffd93d30`, fontWeight: 800, fontSize: '0.75rem', color: '#ffd93d' }}>
                                ✨ New Child Class <span style={{ fontSize: '0.55rem', color: TEXT_DIM }}>(extends {parentClass.name})</span>
                            </div>
                            <div style={{ padding: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <MiniInput value={newName} onChange={setNewName} placeholder="ClassName" style={{ width: '100%' }} mono />
                                <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap' }}>
                                    {CHILD_ICONS.map(ic => (
                                        <button key={ic} onClick={() => setNewIcon(ic)} style={{ width: 26, height: 26, border: newIcon === ic ? '2px solid #ffd93d' : `1px solid ${CARD_BORDER}`, borderRadius: '4px', background: newIcon === ic ? '#ffd93d15' : 'transparent', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ic}</button>
                                    ))}
                                </div>
                                <div style={{ fontSize: '0.55rem', fontWeight: 800, color: TEXT_DIM, marginTop: '0.1rem' }}>OVERRIDE METHODS</div>
                                {parentClass.methods.filter(m => m.visibility === '+').map(m => (
                                    <div key={m.id}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', color: TEXT_LIGHT }}>
                                            <input type="checkbox" checked={!!overrides[m.id]} onChange={e => setOverrides(p => ({ ...p, [m.id]: e.target.checked }))} style={{ accentColor: '#ff6b9d' }} />
                                            Override {m.name}()
                                        </label>
                                        {overrides[m.id] && <MiniInput value={overrideResps[m.id] || ''} onChange={v => setOverrideResps(p => ({ ...p, [m.id]: v }))} placeholder={`Response for ${m.name}()`} style={{ marginLeft: '1.2rem', width: 'calc(100% - 1.2rem)', marginTop: '0.15rem' }} />}
                                    </div>
                                ))}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.55rem', fontWeight: 800, color: TEXT_DIM }}>OWN FIELDS</span>
                                    <NeonBtn onClick={() => setNewFields(p => [...p, { name: '', type: 'String', value: '""', visibility: '-' }])} color="#58a6ff" small>+ Field</NeonBtn>
                                </div>
                                {newFields.map((f, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '0.15rem', alignItems: 'center' }}>
                                        <MiniInput value={f.name} onChange={v => { const nf = [...newFields]; nf[i] = { ...nf[i], name: v }; setNewFields(nf); }} placeholder="field" style={{ flex: 1 }} mono />
                                        <MiniSelect value={f.type} onChange={v => { const nf = [...newFields]; nf[i] = { ...nf[i], type: v }; setNewFields(nf); }} options={TYPES} />
                                        <button onClick={() => setNewFields(p => p.filter((_, j) => j !== i))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#f97583', fontWeight: 900, fontSize: '0.65rem' }}>✕</button>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                                    <NeonBtn onClick={handleCreate} color="#7ee787" disabled={!newName.trim()}>✓ Create</NeonBtn>
                                    <NeonBtn onClick={resetForm} color={TEXT_DIM}>Cancel</NeonBtn>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════
   POLYMORPHISM VIEW  — Dark Canvas + Method Dispatch
   ══════════════════════════════════════════════════════════════════ */
const PolymorphismView = ({ parentClass, childClasses }) => {
    const [firing, setFiring] = useState(false);
    const [selMethod, setSelMethod] = useState(null);
    const pubMethods = parentClass.methods.filter(m => m.visibility === '+');

    const objects = useMemo(() => {
        const list = [{ name: parentClass.name, icon: '🏛️', color: '#a8e6cf', methods: parentClass.methods, isParent: true }];
        childClasses.forEach(c => list.push({ name: c.name, icon: c.icon, color: c.color, methods: c.methods, isParent: false }));
        return list;
    }, [parentClass, childClasses]);

    const fire = (m) => { setSelMethod(m); setFiring(true); setTimeout(() => setFiring(false), 2800); };
    const getResp = (obj, mn) => { const m = obj.methods.find(x => x.name === mn); if (m) return m.response || `${obj.name}.${mn}()`; const pm = parentClass.methods.find(x => x.name === mn); return pm?.response || `${mn}()`; };
    const isOver = (obj, mn) => !!obj.methods.find(m => m.name === mn && m.overridden);

    return (
        <div style={{ ...CANVAS_STYLE, minHeight: '100%', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: TEXT_DIM, letterSpacing: '0.12em' }}>POLYMORPHISM — Same Call, Different Behavior</div>

            {/* Method Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {pubMethods.map(m => {
                    const active = selMethod?.id === m.id && firing;
                    return (
                        <motion.button 
                            key={m.id} 
                            onClick={() => fire(m)} 
                            disabled={firing}
                            className="btn"
                            style={{
                                padding: '0.45rem 0.9rem',
                                background: active ? 'var(--green)' : 'var(--cyan)',
                                color: '#000000',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 800,
                                fontSize: '0.82rem',
                                cursor: firing ? 'not-allowed' : 'pointer',
                                transform: active ? 'translate(3px, 3px)' : 'none',
                                boxShadow: active ? 'none' : 'var(--shadow-sm)',
                                opacity: firing && selMethod?.id !== m.id ? 0.4 : 1,
                            }}
                        >
                            🚀 .{m.name}()
                        </motion.button>
                    );
                })}
            </div>

            {/* Call Label */}
            {firing && selMethod && (
                <motion.div 
                    initial={{ opacity: 0, y: -6 }} 
                    animate={{ opacity: 1, y: 0 }}
                    style={{ 
                        padding: '0.4rem 1rem', 
                        background: 'var(--green)', 
                        color: '#000000', 
                        fontFamily: 'var(--font-mono)', 
                        fontWeight: 800, 
                        fontSize: '0.9rem', 
                        border: 'var(--border-width) solid var(--border)', 
                        boxShadow: 'var(--shadow-sm)' 
                    }}
                >
                    <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>obj.{selMethod.name}()</motion.span>
                </motion.div>
            )}

            {/* Dispatch Lines SVG */}
            {firing && selMethod && objects.length > 1 && (
                <svg width={Math.min(objects.length * 160, 650)} height="28" style={{ overflow: 'visible' }}>
                    {objects.map((o, i) => {
                        const w = Math.min(objects.length * 160, 650);
                        const cx = w / 2;
                        const tx = objects.length === 1 ? cx : (i / (objects.length - 1)) * (w - 60) + 30;
                        return <motion.line key={i} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: i * 0.1 }} x1={cx} y1={0} x2={tx} y2={28} stroke={o.color} strokeWidth={2.5} strokeDasharray="5 3" style={{ filter: `drop-shadow(0 0 3px ${o.color}60)` }} />;
                    })}
                </svg>
            )}

            {/* Object Cards */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {objects.map((obj, i) => {
                    const resp = selMethod ? getResp(obj, selMethod.name) : '';
                    const over = selMethod ? isOver(obj, selMethod.name) : false;
                    return (
                        <motion.div key={obj.name} animate={firing ? { scale: [1, 1.06, 1], rotate: over ? [0, 3, -3, 0] : [0, -1, 1, 0] } : {}} transition={{ duration: 0.5, delay: i * 0.12, repeat: firing ? 2 : 0 }}
                            style={{
                                width: 150, border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden',
                                boxShadow: firing ? 'var(--shadow-lg)' : 'var(--shadow)', background: CARD_BG, textAlign: 'center', transition: 'box-shadow 0.3s',
                            }}>
                            <div style={{ background: obj.color, padding: '0.4rem', borderBottom: 'var(--border-width) solid var(--border)', fontWeight: 800, fontSize: '0.75rem', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                                {obj.icon} {obj.name}
                            </div>
                            <div style={{ padding: '0.55rem', minHeight: 65 }}>
                                {selMethod && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700, color: 'var(--text)', opacity: 0.6 }}>.{selMethod.name}()</div>}
                                {firing && selMethod && (
                                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.15 }}>
                                        <div style={{ marginTop: '0.3rem', fontSize: '0.68rem', fontWeight: 800, color: 'var(--text)' }}>{resp}</div>
                                        {over && <div style={{ marginTop: '0.15rem', fontSize: '0.48rem', fontWeight: 800, background: '#ff6b9d', display: 'inline-block', padding: '1px 4px', borderRadius: '3px', color: '#fff' }}>OVERRIDDEN</div>}
                                        {!over && !obj.isParent && <div style={{ marginTop: '0.15rem', fontSize: '0.48rem', color: 'var(--text)', opacity: 0.6, fontWeight: 700 }}>inherited</div>}
                                    </motion.div>
                                )}
                                {!firing && !selMethod && <div style={{ fontSize: '0.58rem', color: 'var(--text)', opacity: 0.6, marginTop: '0.3rem' }}>Pick method ↑</div>}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {childClasses.length === 0 && (
                <div style={{ fontSize: '0.68rem', color: 'var(--text)', opacity: 0.6, fontWeight: 600, textAlign: 'center', padding: '0.5rem 1rem', background: '#ff6b9d10', borderRadius: '8px', border: '1.5px dashed #ff6b9d40' }}>
                    💡 Go to <span style={{ color: '#a8e6cf' }}>Inheritance</span> tab first and create child classes!
                </div>
            )}

            {/* VTABLE Viz */}
            {firing && selMethod && childClasses.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    className="panel" style={{ width: '100%', maxWidth: 500 }}>
                    <div className="panel-header" style={{ padding: '0.35rem 0.65rem', fontSize: '0.55rem', fontWeight: 800, color: '#000000', background: 'var(--yellow)' }}>🔀 RUNTIME METHOD DISPATCH (VTABLE)</div>
                    <div style={{ padding: '0.4rem 0.65rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <div style={{ color: 'var(--text)', opacity: 0.6 }}>// JVM looks up actual object type</div>
                        {objects.map((o, i) => {
                            const ov = isOver(o, selMethod.name);
                            return (
                                <motion.div key={o.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 * i }} style={{ color: ov ? '#ff6b9d' : '#22863a', fontWeight: 700 }}>
                                    {o.icon} {o.name} → {ov ? `${o.name}::${selMethod.name}()` : `${parentClass.name}::${selMethod.name}()`} {ov ? '⟲ overridden' : '← inherited'}
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════
   CODE PANEL (Right Sidebar)
   ══════════════════════════════════════════════════════════════════ */
const CodePanel = ({ parentClass, childClasses, activePillar, codeLang, onLangChange }) => {
    const code = codeLang === 'java' ? genJava(parentClass, childClasses, activePillar) : genPython(parentClass, childClasses, activePillar);
    const ins = {
        Encapsulation: { t: 'Data Protection', txt: 'Bundles data & methods into a class and restricts direct access. Only public methods provide controlled access.', ana: '🚗 A car dashboard shows speed — you never touch the engine internals. The pedal is your public interface.' },
        Abstraction: { t: 'Interface Simplicity', txt: 'Hides complex implementation and shows only essential features. Users interact with a clean API.', ana: '📺 TV remote: press "Volume Up" without knowing circuits. The button IS the abstraction.' },
        Inheritance: { t: 'Code Reuse', txt: 'A new class inherits properties & methods from an existing class, creating parent-child hierarchies.', ana: '🧬 Like genetics — children inherit traits from parents but can develop their own unique features.' },
        Polymorphism: { t: 'Dynamic Behavior', txt: 'Objects of different classes respond to the same method call differently, resolved at runtime.', ana: '🎵 Musicians: when conductor says "play", each instrument sounds different. Same cue, different execution.' },
    }[activePillar];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div className="panel">
                <div className="panel-header" style={{ background: PILLAR_COLORS[activePillar], color: '#000000' }}>💻 Live Code</div>
                <div style={{ padding: '0.4rem' }}>
                    <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.3rem' }}>
                        {['java', 'python'].map(l => <NeonBtn key={l} onClick={() => onLangChange(l)} color={codeLang === l ? '#58a6ff' : TEXT_DIM} small>{l === 'java' ? '☕ Java' : '🐍 Python'}</NeonBtn>)}
                    </div>
                    <pre style={{ background: '#0d1117', color: '#c9d1d9', padding: '0.5rem', borderRadius: '6px', fontSize: '0.58rem', fontFamily: 'var(--font-mono)', lineHeight: 1.6, overflowX: 'auto', overflowY: 'auto', maxHeight: 240, border: 'var(--border-width) solid var(--border)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{code}</pre>
                </div>
            </div>
            <div className="panel">
                <div className="panel-header" style={{ background: PILLAR_COLORS[activePillar], color: '#000000' }}>{PILLAR_ICONS[activePillar]} {ins.t}</div>
                <div style={{ padding: '0.5rem', fontSize: '0.7rem', lineHeight: 1.6, color: TEXT_LIGHT }}>{ins.txt}</div>
            </div>
            <div className="panel">
                <div className="panel-header" style={{ background: 'var(--white)', color: 'var(--text)' }}>💡 Real-World Analogy</div>
                <div style={{ padding: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', lineHeight: 1.5 }}>{ins.ana}</div>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════
   UML PANEL
   ══════════════════════════════════════════════════════════════════ */
const UMLPanel = ({ parentClass, childClasses, activePillar }) => (
    <div className="panel" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem' }}>
        <div className="panel-header" style={{ background: 'var(--bg-outer)', color: 'var(--text)', padding: '0.3rem 0.55rem', fontSize: '0.55rem' }}>📐 UML CLASS DIAGRAM</div>
        <div style={{ padding: '0.4rem' }}>
            <div style={{ border: `2px solid ${CARD_BORDER}`, marginBottom: '0.3rem' }}>
                <div style={{ borderBottom: `2px solid ${CARD_BORDER}`, padding: '0.15rem 0.35rem', fontWeight: 800, textAlign: 'center', background: 'var(--green)', color: '#000000', fontSize: '0.6rem' }}>{parentClass.name}</div>
                <div style={{ borderBottom: `2px solid ${CARD_BORDER}20`, padding: '0.15rem 0.35rem' }}>{parentClass.fields.map(f => <div key={f.id}>{f.visibility} {f.name}: {f.type}</div>)}</div>
                <div style={{ padding: '0.15rem 0.35rem' }}>{parentClass.methods.map(m => <div key={m.id}>{m.visibility} {m.name}(): {m.returnType}</div>)}</div>
            </div>
            {(activePillar === 'Inheritance' || activePillar === 'Polymorphism') && childClasses.length > 0 && (
                <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap' }}>
                    {childClasses.map(c => (
                        <div key={c.id} style={{ flex: 1, minWidth: 75, border: `2px solid ${CARD_BORDER}` }}>
                            <div style={{ borderBottom: `2px solid ${CARD_BORDER}`, padding: '0.1rem 0.25rem', fontWeight: 800, textAlign: 'center', fontSize: '0.5rem', background: c.color, color: '#000000' }}>△ {c.name}</div>
                            <div style={{ padding: '0.1rem 0.25rem', fontSize: '0.5rem' }}>{c.fields.map(f => <div key={f.id || f.name}>- {f.name}</div>)}</div>
                            <div style={{ borderTop: `2px solid ${CARD_BORDER}20`, padding: '0.1rem 0.25rem', fontSize: '0.5rem' }}>
                                {c.methods.map(m => <div key={m.id} style={{ color: m.overridden ? '#ff6b9d' : 'var(--text)' }}>+ {m.name}(){m.overridden ? ' ⟲' : ''}</div>)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
);

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════ */
export default function FourPillarsSim() {
    const [activePillar, setActivePillar] = useState('Encapsulation');
    const [parentClass, setParentClass] = useState({ ...DEFAULT_PARENT, fields: DEFAULT_PARENT.fields.map(f => ({ ...f })), methods: DEFAULT_PARENT.methods.map(m => ({ ...m })) });
    const [childClasses, setChildClasses] = useState([]);
    const [showGetters, setShowGetters] = useState(false);
    const [codeLang, setCodeLang] = useState('java');
    const [speed, setSpeed] = useState(700);
    const [pillarsExplored, setPillarsExplored] = useState(new Set(['Encapsulation']));
    const nextId = useRef(500);

    const stats = useMemo(() => ({
        classes: 1 + childClasses.length,
        fields: parentClass.fields.length + childClasses.reduce((a, c) => a + c.fields.length, 0),
        methods: parentClass.methods.length + childClasses.reduce((a, c) => a + c.methods.length, 0),
        overrides: childClasses.reduce((a, c) => a + c.methods.filter(m => m.overridden).length, 0),
    }), [parentClass, childClasses]);

    const changePillar = useCallback(p => { setActivePillar(p); setPillarsExplored(prev => new Set([...prev, p])); }, []);
    const addChild = useCallback(c => setChildClasses(prev => [...prev, c]), []);
    const rmChild = useCallback(id => setChildClasses(prev => prev.filter(c => c.id !== id)), []);

    const reset = useCallback(() => {
        setActivePillar('Encapsulation'); setShowGetters(false); setCodeLang('java');
        setParentClass({ ...DEFAULT_PARENT, fields: DEFAULT_PARENT.fields.map(f => ({ ...f })), methods: DEFAULT_PARENT.methods.map(m => ({ ...m })) });
        setChildClasses([]); setPillarsExplored(new Set(['Encapsulation']));
    }, []);
    const loadExample = useCallback(() => {
        setParentClass({ ...DEFAULT_PARENT, fields: DEFAULT_PARENT.fields.map(f => ({ ...f })), methods: DEFAULT_PARENT.methods.map(m => ({ ...m })) });
        setChildClasses(DEFAULT_CHILDREN.map(c => ({ ...c, fields: c.fields.map(f => ({ ...f })), methods: c.methods.map(m => ({ ...m })) })));
    }, []);

    /* ── LEFT PANEL ── */
    const LEFT = (
        <div style={{ margin: '-1rem', padding: '0.75rem', background: CANVAS_BG, color: TEXT_LIGHT, minHeight: '100%' }}>
            <ClassBuilder parentClass={parentClass} onUpdateParent={setParentClass} nextId={nextId} />
            <div style={{ borderTop: `2px solid ${CARD_BORDER}`, paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--text)', textTransform: 'uppercase', marginBottom: '0.3rem', letterSpacing: '0.1em', opacity: 0.6 }}>📊 Stats</div>
                {[
                    { l: 'Pillars', v: pillarsExplored.size, m: 4, c: '#b58900' },
                    { l: 'Classes', v: stats.classes, c: '#008ba3' },
                    { l: 'Fields', v: stats.fields, c: '#22863a' },
                    { l: 'Methods', v: stats.methods, c: '#b06500' },
                    { l: 'Overrides', v: stats.overrides, c: '#d01b60' },
                ].map(s => (
                    <div key={s.l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.2rem 0', borderBottom: `1px solid ${CARD_BORDER}20` }}>
                        <span style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--text)', opacity: 0.6 }}>{s.l}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.8rem', color: s.c }}>{s.v}{s.m ? `/${s.m}` : ''}</span>
                    </div>
                ))}
            </div>
            <NeonBtn onClick={loadExample} color="#ffd93d" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} small>📦 Load Example</NeonBtn>
            <div style={{ borderTop: `1px solid ${CARD_BORDER}`, paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                <UMLPanel parentClass={parentClass} childClasses={childClasses} activePillar={activePillar} />
            </div>
        </div>
    );

    /* ── RIGHT PANEL ── */
    const RIGHT = (
        <div style={{ margin: '-1rem', padding: '0.75rem', background: CANVAS_BG, color: TEXT_LIGHT, minHeight: '100%' }}>
            <CodePanel parentClass={parentClass} childClasses={childClasses} activePillar={activePillar} codeLang={codeLang} onLangChange={setCodeLang} />
        </div>
    );

    /* ── CENTER ── */
    const CENTER = (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: CANVAS_BG }}>
            {/* Pillar Tabs */}
            <div style={{ display: 'flex', borderBottom: `3px solid ${CARD_BORDER}`, flexShrink: 0 }}>
                {PILLARS.map(p => (
                    <button key={p} onClick={() => changePillar(p)} style={{
                        flex: 1, padding: '0.55rem', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer',
                        background: activePillar === p ? PILLAR_COLORS[p] : 'var(--white)',
                        border: 'none',
                        borderRight: `3px solid ${CARD_BORDER}`,
                        fontFamily: 'var(--font-main)',
                        color: activePillar === p ? '#000000' : 'var(--text)',
                        opacity: activePillar === p ? 1 : 0.6,
                        transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', position: 'relative',
                    }}>
                        {PILLAR_ICONS[p]} {p}
                        {pillarsExplored.has(p) && activePillar !== p && <span style={{ position: 'absolute', top: 4, right: 6, width: 6, height: 6, borderRadius: '50%', background: '#22863a', border: '1px solid var(--border)' }} />}
                    </button>
                ))}
            </div>
            {/* Active View */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                <AnimatePresence mode="wait">
                    <motion.div key={activePillar} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} style={{ height: '100%' }}>
                        {activePillar === 'Encapsulation' && <EncapsulationView parentClass={parentClass} showGetters={showGetters} onToggleGetters={() => setShowGetters(p => !p)} />}
                        {activePillar === 'Abstraction' && <AbstractionView parentClass={parentClass} />}
                        {activePillar === 'Inheritance' && <InheritanceView parentClass={parentClass} childClasses={childClasses} onAddChild={addChild} onRemoveChild={rmChild} />}
                        {activePillar === 'Polymorphism' && <PolymorphismView parentClass={parentClass} childClasses={childClasses} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );

    return (
        <ImmersiveLayout isActive={true} title="Four Pillars of OOP" icon="🏛️" moduleLabel="OOP MODULE"
            isRunning={false} isPaused={false} isFinished={false} speed={speed} onSpeedChange={setSpeed}
            onStart={() => {}} onPause={() => {}} onResume={() => {}} onReset={reset}
            onStep={() => { const i = PILLARS.indexOf(activePillar); if (i < 3) changePillar(PILLARS[i + 1]); }}
            currentStepNum={pillarsExplored.size} totalSteps={4}
            phaseName={`Exploring: ${activePillar}`}
            centerContent={CENTER} leftContent={LEFT} rightContent={RIGHT}
            timelineItems={PILLARS.map((p, i) => ({ id: i, label: p, done: pillarsExplored.has(p) && activePillar !== p, active: activePillar === p }))}
            legend={[
                { color: '#ffd93d', label: 'Encapsulation' }, { color: '#66d9ef', label: 'Abstraction' },
                { color: '#a8e6cf', label: 'Inheritance' }, { color: '#ff6b9d', label: 'Polymorphism' },
            ]}>
            <div className="main-content">
                <div style={{ marginBottom: '0.5rem' }}><Link to="/oops" style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← OOP Module</Link></div>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>🏛️ Four Pillars of OOP</h1>
                <p style={{ opacity: 0.6, fontSize: '1rem', marginBottom: '2rem' }}>Build your own classes and see each OOP pillar in action.</p>
                <button className="btn btn-yellow btn-lg" onClick={() => {}}>LAUNCH EXPLORER</button>
            </div>
        </ImmersiveLayout>
    );
}
