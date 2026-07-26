import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import useSnapshot from '../../hooks/useSnapshot';
import {
    PillarIcon, TerminalIcon, SaveIcon, GearIcon, ShuffleIcon, PlayIcon,
    InfoIcon, ShieldIcon, LightbulbIcon, ZapIcon, AlertIcon, TreeIcon, WrenchIcon, TargetIcon,
    ActivityIcon
} from '../../components/Icons';

/* ══════════════════════════════════════════════════════════════════
   CONSTANTS & DEFAULT PRESETS WITH FIELDS & METHODS
   ══════════════════════════════════════════════════════════════════ */
const TYPES = ['String', 'int', 'double', 'boolean', 'float', 'char'];
const VIS_OPTS = [{ val: '-', label: '- priv' }, { val: '+', label: '+ pub' }, { val: '#', label: '# prot' }];
const CLASS_COLORS = ['#66d9ef', '#ffd93d', '#a8e6cf', '#ff6b9d', '#ffb347', '#b39ddb', '#4dd0c8'];

const TEXT_DIM = 'var(--text)';
const visColor = (v) => {
    if (v === '+') return 'var(--green)';
    if (v === '-') return 'var(--pink)';
    return 'var(--yellow)';
};

const PRESETS = {
    Single: [
        {
            id: 'Animal', parents: [], color: '#66d9ef', x: 305, y: 40,
            fields: [{ id: 'f1', name: 'name', type: 'String', value: '"Buddy"', visibility: '-' }],
            methods: [{ id: 'm1', name: 'speak', returnType: 'void', visibility: '+', response: 'Generic animal sound' }]
        },
        {
            id: 'Dog', parents: ['Animal'], color: '#ffd93d', x: 305, y: 220,
            fields: [{ id: 'f2', name: 'breed', type: 'String', value: '"Labrador"', visibility: '-' }],
            methods: [
                { id: 'm2', name: 'speak', returnType: 'void', visibility: '+', response: 'Woof! Woof!', overridden: true },
                { id: 'm3', name: 'fetch', returnType: 'void', visibility: '+', response: 'Fetching ball...' }
            ]
        }
    ],
    'Multi-level': [
        {
            id: 'Animal', parents: [], color: '#66d9ef', x: 305, y: 30,
            fields: [{ id: 'f1', name: 'name', type: 'String', value: '"Buddy"', visibility: '-' }],
            methods: [{ id: 'm1', name: 'speak', returnType: 'void', visibility: '+', response: 'Generic animal sound' }]
        },
        {
            id: 'Dog', parents: ['Animal'], color: '#ffd93d', x: 305, y: 190,
            fields: [{ id: 'f2', name: 'breed', type: 'String', value: '"Labrador"', visibility: '-' }],
            methods: [
                { id: 'm2', name: 'speak', returnType: 'void', visibility: '+', response: 'Woof!', overridden: true }
            ]
        },
        {
            id: 'Puppy', parents: ['Dog'], color: '#a8e6cf', x: 305, y: 350,
            fields: [{ id: 'f3', name: 'age', type: 'int', value: '1', visibility: '-' }],
            methods: [{ id: 'm3', name: 'play', returnType: 'void', visibility: '+', response: 'Puppy plays with toys!' }]
        }
    ],
    Hierarchical: [
        {
            id: 'Animal', parents: [], color: '#66d9ef', x: 305, y: 30,
            fields: [{ id: 'f1', name: 'name', type: 'String', value: '"Buddy"', visibility: '-' }],
            methods: [{ id: 'm1', name: 'speak', returnType: 'void', visibility: '+', response: 'Generic animal sound' }]
        },
        {
            id: 'Dog', parents: ['Animal'], color: '#ffd93d', x: 125, y: 220,
            fields: [{ id: 'f2', name: 'breed', type: 'String', value: '"Labrador"', visibility: '-' }],
            methods: [{ id: 'm2', name: 'speak', returnType: 'void', visibility: '+', response: 'Woof!', overridden: true }]
        },
        {
            id: 'Cat', parents: ['Animal'], color: '#ff6b9d', x: 485, y: 220,
            fields: [{ id: 'f3', name: 'lives', type: 'int', value: '9', visibility: '-' }],
            methods: [{ id: 'm3', name: 'speak', returnType: 'void', visibility: '+', response: 'Meow!', overridden: true }]
        }
    ],
    Multiple: [
        {
            id: 'Flyable', parents: [], color: '#b39ddb', x: 125, y: 40,
            fields: [],
            methods: [{ id: 'm1', name: 'fly', returnType: 'void', visibility: '+', response: 'Flying high in the clouds!' }]
        },
        {
            id: 'Swimmable', parents: [], color: '#4dd0c8', x: 485, y: 40,
            fields: [],
            methods: [{ id: 'm2', name: 'swim', returnType: 'void', visibility: '+', response: 'Swimming deep in the ocean!' }]
        },
        {
            id: 'Duck', parents: ['Flyable', 'Swimmable'], color: '#ffd93d', x: 305, y: 220,
            fields: [{ id: 'f1', name: 'quackVolume', type: 'int', value: '5', visibility: '-' }],
            methods: [{ id: 'm3', name: 'quack', returnType: 'void', visibility: '+', response: 'Quack! Quack!' }]
        }
    ],
    Hybrid: [
        {
            id: 'Animal', parents: [], color: '#66d9ef', x: 305, y: 20,
            fields: [],
            methods: [{ id: 'm1', name: 'speak', returnType: 'void', visibility: '+', response: 'Generic animal sound' }]
        },
        {
            id: 'Dog', parents: ['Animal'], color: '#ffd93d', x: 125, y: 170,
            fields: [],
            methods: [{ id: 'm2', name: 'speak', returnType: 'void', visibility: '+', response: 'Woof!', overridden: true }]
        },
        {
            id: 'Cat', parents: ['Animal'], color: '#ff6b9d', x: 485, y: 170,
            fields: [],
            methods: []
        },
        {
            id: 'Hybrid', parents: ['Dog', 'Cat'], color: '#a8e6cf', x: 305, y: 320,
            fields: [],
            methods: []
        }
    ]
};

const NODE_W = 190;
const NODE_H_BASE = 40;
const glow = (color, i = 0.35) => `0 0 12px ${color}${Math.round(i * 255).toString(16).padStart(2, '0')}, 0 0 25px ${color}${Math.round(i * 0.4 * 255).toString(16).padStart(2, '0')}`;
const capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* ── C3 Linearization Solver ── */
const getC3MRO = (className, nodesList, visited = new Set()) => {
    const node = nodesList.find(n => n.id === className);
    if (!node) return [];
    if (visited.has(className)) {
        throw new Error(`Circular inheritance detected at class ${className}!`);
    }
    visited.add(className);
    
    const parents = node.parents || [];
    if (parents.length === 0) return [className];
    
    const parentMROs = parents.map(p => getC3MRO(p, nodesList, new Set(visited)));
    const lists = [...parentMROs, parents.slice()];
    const result = [className];
    
    while (true) {
        if (lists.every(list => list.length === 0)) break;
        let candidate = null;
        for (const list of lists) {
            if (list.length === 0) continue;
            const item = list[0];
            // Check if item is in the tail of any other list
            const inTail = lists.some(otherList => otherList.slice(1).includes(item));
            if (!inTail) {
                candidate = item;
                break;
            }
        }
        
        if (candidate === null) {
            throw new Error(`MRO Conflict: Inconsistent hierarchy for class ${className}`);
        }
        
        result.push(candidate);
        for (const list of lists) {
            const index = list.indexOf(candidate);
            if (index === 0) list.shift();
        }
    }
    return result;
};

const getMethodResolution = (classId, methodName, nodesList) => {
    try {
        const mro = getC3MRO(classId, nodesList);
        for (const cid of mro) {
            const node = nodesList.find(n => n.id === cid);
            const m = node?.methods.find(x => x.name === methodName);
            if (m) {
                const isOverride = cid === classId && mro.slice(1).some(ancId => {
                    const ancNode = nodesList.find(n => n.id === ancId);
                    return ancNode?.methods.some(pm => pm.name === methodName);
                });
                return { classId: cid, method: m, color: node.color, isOverride };
            }
        }
    } catch (e) {}
    return null;
};

const getAllAncestors = (classId, nodesList) => {
    const ancestors = new Set();
    const queue = [classId];
    while (queue.length > 0) {
        const curr = queue.shift();
        const node = nodesList.find(n => n.id === curr);
        if (node) {
            node.parents.forEach(p => {
                if (!ancestors.has(p)) {
                    ancestors.add(p);
                    queue.push(p);
                }
            });
        }
    }
    return Array.from(ancestors);
};

/* ── Java Code Generation ── */
function genJava(nodesList) {
    let code = `/* Note: Java does not support multiple inheritance of classes! \n   Representing multiple paths via interfaces where necessary. */\n\n`;
    nodesList.forEach(n => {
        const isMultiple = n.parents.length > 1;
        if (isMultiple) {
            code += `// Java interface workaround for multiple inheritance\n`;
            code += `interface I${n.id} {\n`;
            n.methods.forEach(m => {
                code += `    ${m.returnType} ${m.name}();\n`;
            });
            code += `}\n\n`;
            
            const firstParent = n.parents[0];
            const interfaces = n.parents.slice(1).map(p => `I${p}`).join(', ');
            code += `public class ${n.id} extends ${firstParent} implements ${interfaces} {\n`;
        } else if (n.parents.length === 1) {
            code += `public class ${n.id} extends ${n.parents[0]} {\n`;
        } else {
            code += `public class ${n.id} {\n`;
        }
        
        n.fields.forEach(f => {
            const vis = f.visibility === '+' ? 'public' : f.visibility === '#' ? 'protected' : 'private';
            code += `    ${vis} ${f.type} ${f.name} = ${f.value};\n`;
        });
        if (n.fields.length > 0) code += `\n`;
        
        n.methods.forEach(m => {
            const vis = m.visibility === '+' ? 'public' : m.visibility === '#' ? 'protected' : 'private';
            if (m.overridden) code += `    @Override\n`;
            code += `    ${vis} ${m.returnType} ${m.name}() {\n`;
            code += `        System.out.println("${m.response || 'Calling ' + m.name}");\n`;
            code += `    }\n\n`;
        });
        code += `}\n\n`;
    });
    return code;
}

/* ── Python Code Generation ── */
function genPython(nodesList) {
    let code = ``;
    nodesList.forEach(n => {
        if (n.parents.length > 0) {
            code += `class ${n.id}(${n.parents.join(', ')}):\n`;
        } else {
            code += `class ${n.id}:\n`;
        }
        
        code += `    def __init__(self):\n`;
        if (n.parents.length > 0) {
            code += `        super().__init__()\n`;
        }
        if (n.fields.length === 0 && n.parents.length === 0) {
            code += `        pass\n`;
        }
        n.fields.forEach(f => {
            const prefix = f.visibility === '-' ? '__' : f.visibility === '#' ? '_' : '';
            code += `        self.${prefix}${f.name} = ${f.value}\n`;
        });
        code += `\n`;
        
        if (n.methods.length === 0) {
            code += `    # Inherits all parents methods\n    pass\n`;
        }
        n.methods.forEach(m => {
            code += `    def ${m.name}(self):\n`;
            code += `        print("${m.response || 'Calling ' + m.name}")\n\n`;
        });
        code += `\n`;
    });
    return code;
}

/* ══════════════════════════════════════════════════════════════════
   SHARED UTILS
   ══════════════════════════════════════════════════════════════════ */
const MiniInput = ({ value, onChange, placeholder, style = {}, mono }) => (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ border: 'var(--border-width) solid var(--border)', padding: '0.2rem 0.35rem', fontSize: '0.7rem', fontFamily: mono ? 'var(--font-mono)' : 'var(--font-main)', fontWeight: 600, background: 'var(--white)', color: 'var(--text)', outline: 'none', borderRadius: 'var(--radius)', ...style }}
        onFocus={e => e.target.style.borderColor = '#58a6ff'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
);
const MiniSelect = ({ value, onChange, options, style = {} }) => (
    <select value={value} onChange={e => onChange(e.target.value)}
        style={{ border: 'var(--border-width) solid var(--border)', padding: '0.18rem 0.2rem', fontSize: '0.65rem', fontWeight: 700, fontFamily: 'var(--font-mono)', background: 'var(--white)', color: 'var(--text)', cursor: 'pointer', borderRadius: 'var(--radius)', ...style }}>
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

const DarkFieldRow = ({ f }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.15rem 0.35rem', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text)' }}>
        <span style={{ color: visColor(f.visibility), fontWeight: 800 }}>{f.visibility}</span>
        <span style={{ fontWeight: 700 }}>{f.name}</span>
        <span style={{ color: 'var(--text)', opacity: 0.5 }}>: {f.type}</span>
    </div>
);

const DarkMethodRow = ({ m, isFoundNode, isSearching }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.15rem 0.35rem',
        background: isFoundNode ? 'rgba(56,161,105,0.15)' : isSearching ? 'rgba(255,217,61,0.15)' : 'transparent',
        borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: isFoundNode ? '#22863a' : 'var(--text)',
        border: isFoundNode ? '1.5px solid #22863a' : '1.5px solid transparent', transition: 'all 0.3s',
        cursor: 'pointer'
    }}>
        <span style={{ color: visColor(m.visibility), fontWeight: 800 }}>{m.visibility}</span>
        <span style={{ fontWeight: 700 }}>{m.name}()</span>
        {m.overridden && <span style={{ fontSize: '0.55rem', background: 'var(--pink)', border: '2px solid var(--border)', color: '#000000', padding: '1px 5px', borderRadius: '4px', fontWeight: 800, boxShadow: 'var(--shadow-sm)' }}>override</span>}
    </div>
);

/* ── DYNAMIC STYLE OVERRIDE FOR THIS PAGE ONLY ── */
const StyleOverrides = () => (
    <style>{`
        @keyframes flowUp {
            to { stroke-dashoffset: -20; }
        }
        @keyframes neonPulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
        }
        @keyframes scanLine {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
        }
        @keyframes glowBreathe {
            0%, 100% { box-shadow: 0 0 8px currentColor, 0 0 2px currentColor; }
            50% { box-shadow: 0 0 18px currentColor, 0 0 6px currentColor; }
        }
        @keyframes strikeThrough {
            0% { width: 0; }
            100% { width: 100%; }
        }
        @keyframes dashFlow {
            to { stroke-dashoffset: -30; }
        }
        @keyframes vtableSlide {
            from { transform: translateX(-8px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `}</style>
);

/* ══════════════════════════════════════════════════════════════════
   CLASS HIERARCHY BUILDER (Left Sidebar component)
   ══════════════════════════════════════════════════════════════════ */
const ClassHierarchyBuilder = ({ nodes, onAddClass, onUpdateClass, editNode, onCancelEdit }) => {
    const [name, setName] = useState('');
    const [parents, setParents] = useState([]);
    const [fields, setFields] = useState([]);
    const [methods, setMethods] = useState([]);
    const nextId = useRef(1000);

    const resetForm = () => { setName(''); setParents([]); setFields([]); setMethods([]); };

    useEffect(() => {
        if (editNode) {
            setName(editNode.id);
            setParents(editNode.parents || []);
            setFields(editNode.fields ? editNode.fields.map(f => ({ ...f })) : []);
            setMethods(editNode.methods ? editNode.methods.map(m => ({ ...m })) : []);
        } else {
            resetForm();
        }
    }, [editNode]);
    
    const handleAddField = () => setFields(f => [...f, { id: `f_${nextId.current++}`, name: '', type: 'String', visibility: '-' }]);
    const handleRmField = (fid) => setFields(f => f.filter(x => x.id !== fid));
    const handleUpField = (fid, k, v) => setFields(f => f.map(x => x.id === fid ? { ...x, [k]: v } : x));

    const handleAddMethod = () => setMethods(m => [...m, { id: `m_${nextId.current++}`, name: '', returnType: 'void', visibility: '+', response: '', overridden: false }]);
    const handleRmMethod = (mid) => setMethods(m => m.filter(x => x.id !== mid));
    const handleUpMethod = (mid, k, v) => setMethods(m => m.map(x => x.id === mid ? { ...x, [k]: v } : x));

    const handleCreate = () => {
        if (!name.trim()) return;
        const finalMethods = methods.map(m => {
            const hasSameInParents = parents.some(pId => {
                const pNode = nodes.find(n => n.id === pId);
                return pNode?.methods.some(pm => pm.name === m.name);
            });
            return { ...m, overridden: hasSameInParents };
        });

        const updatedData = {
            id: name.trim(), parents,
            fields: fields.filter(f => f.name.trim()),
            methods: finalMethods.filter(m => m.name.trim()),
        };

        if (editNode) {
            onUpdateClass(editNode.id, updatedData);
        } else {
            const color = CLASS_COLORS[nodes.length % CLASS_COLORS.length];
            onAddClass({
                ...updatedData, color,
                x: Math.random() * 200 + 320, y: Math.random() * 150 + 100
            });
        }
        resetForm();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', color: 'var(--text)' }}>
            <div style={{ fontSize: '0.58rem', fontWeight: 900, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {editNode ? `Edit Class: ${editNode.id}` : <><WrenchIcon size={12} /> Class Builder</>}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text)', opacity: 0.6 }}>Class Name:</span>
                <MiniInput value={name} onChange={setName} placeholder="e.g. Dog" style={{ width: '100%' }} mono />
            </div>

            {/* Parent Classes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text)', opacity: 0.6 }}>Parents:</span>
                {parents.length === 0 ? <div style={{ fontSize: '0.55rem', fontStyle: 'italic', color: 'var(--text)', opacity: 0.6 }}>No parent selected</div> : null}
                {nodes.filter(n => !editNode || n.id !== editNode.id).length === 0 ? (
                    <div style={{ fontSize: '0.55rem', fontStyle: 'italic', color: 'var(--text)', opacity: 0.6 }}>No other classes available</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', maxHeight: 80, overflowY: 'auto', border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)', padding: '0.25rem', background: 'var(--white)' }}>
                        {nodes.filter(n => !editNode || n.id !== editNode.id).map(n => (
                            <label key={n.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer' }}>
                                <input type="checkbox" checked={parents.includes(n.id)} onChange={e => {
                                    if (e.target.checked) setParents(p => [...p, n.id]);
                                    else setParents(p => p.filter(x => x !== n.id));
                                }} style={{ accentColor: '#ff6b9d' }} />
                                {n.id}
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Fields list */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.58rem', fontWeight: 800, color: 'var(--text)', opacity: 0.6, textTransform: 'uppercase' }}>Fields ({fields.length})</span>
                    <NeonBtn onClick={handleAddField} color="#7ee787" small>+ Field</NeonBtn>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {fields.map(f => (
                        <div key={f.id} style={{ display: 'flex', gap: '0.15rem', alignItems: 'center' }}>
                            <MiniSelect value={f.visibility} onChange={v => handleUpField(f.id, 'visibility', v)} options={VIS_OPTS} style={{ width: 28 }} />
                            <MiniInput value={f.name} onChange={v => handleUpField(f.id, 'name', v)} placeholder="name" style={{ flex: 1, minWidth: 0 }} mono />
                            <MiniSelect value={f.type} onChange={v => handleUpField(f.id, 'type', v)} options={TYPES} style={{ width: 55 }} />
                            <button onClick={() => handleRmField(f.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.65rem', color: '#f97583', fontWeight: 900, padding: '0 2px' }}>✕</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Methods list */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.58rem', fontWeight: 800, color: 'var(--text)', opacity: 0.6, textTransform: 'uppercase' }}>Methods ({methods.length})</span>
                    <NeonBtn onClick={handleAddMethod} color="#58a6ff" small>+ Method</NeonBtn>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {methods.map(m => (
                        <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', borderBottom: '1px dashed var(--border)', paddingBottom: '0.25rem' }}>
                            <div style={{ display: 'flex', gap: '0.15rem', alignItems: 'center' }}>
                                <MiniSelect value={m.visibility} onChange={v => handleUpMethod(m.id, 'visibility', v)} options={VIS_OPTS} style={{ width: 28 }} />
                                <MiniInput value={m.name} onChange={v => handleUpMethod(m.id, 'name', v)} placeholder="methodName" style={{ flex: 1, minWidth: 0 }} mono />
                                <MiniSelect value={m.returnType} onChange={v => handleUpMethod(m.id, 'returnType', v)} options={['void', ...TYPES]} style={{ width: 55 }} />
                                <button onClick={() => handleRmMethod(m.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.65rem', color: '#f97583', fontWeight: 900, padding: '0 2px' }}>✕</button>
                            </div>
                            <MiniInput value={m.response} onChange={v => handleUpMethod(m.id, 'response', v)} placeholder="Action console response log" style={{ width: '100%', fontSize: '0.62rem' }} />
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.3rem' }}>
                <NeonBtn onClick={handleCreate} color="#ffd93d" style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.25rem' }} disabled={!name.trim()}>
                    {editNode ? <><SaveIcon size={12} /> Save Changes</> : 'Add Class Card'}
                </NeonBtn>
                {editNode && (
                    <NeonBtn onClick={onCancelEdit} color="#666666" style={{ justifyContent: 'center' }}>
                        Cancel
                    </NeonBtn>
                )}
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════
   LIVE CODE PANEL (Right Sidebar component)
   ══════════════════════════════════════════════════════════════════ */
const LiveCodePanel = ({ nodes, codeLang, onLangChange }) => {
    const code = codeLang === 'java' ? genJava(nodes) : genPython(nodes);
    return (
        <div className="panel">
            <div className="panel-header" style={{ background: 'var(--yellow)', color: '#000000', padding: '0.4rem 0.6rem', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><TerminalIcon size={14} color="#000000" /> Live Code</div>
            <div style={{ padding: '0.4rem' }}>
                <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.3rem' }}>
                    {['java', 'python'].map(l => (
                        <NeonBtn key={l} onClick={() => onLangChange(l)} color={codeLang === l ? '#58a6ff' : '#666666'} small>
                            {l === 'java' ? 'Java' : 'Python'}
                        </NeonBtn>
                    ))}
                </div>
                <pre style={{ background: '#0d1117', color: '#c9d1d9', padding: '0.5rem', borderRadius: '6px', fontSize: '0.58rem', fontFamily: 'var(--font-mono)', lineHeight: 1.6, overflowX: 'auto', overflowY: 'auto', maxHeight: 200, border: 'var(--border-width) solid var(--border)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{code}</pre>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════
   DRAGGABLE CLASS NODE CARD
   ══════════════════════════════════════════════════════════════════ */
const ClassNodeCard = ({ node, isActive, mroPath, foundNodeId, currentMroSearch, onMethodCall, onMouseDown, onTouchStart, onRemove, onEdit }) => {
    const isPath = mroPath.includes(node.id);
    const isSearching = currentMroSearch === node.id;
    const isFound = foundNodeId === node.id;

    let borderVal = '3px solid var(--border)';
    let cardShadow = isFound ? '0 0 15px rgba(56,161,105,0.4)' : isSearching ? '0 0 15px rgba(255,217,61,0.4)' : 'var(--shadow)';
    
    if (isFound) borderVal = '3px solid #22863a';
    else if (isSearching) borderVal = '3px solid #ffd93d';
    else if (isPath) borderVal = '3px solid var(--green)';

    return (
        <div
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            style={{
                position: 'absolute', left: node.x, top: node.y, width: NODE_W,
                border: borderVal, borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--white)',
                boxShadow: cardShadow, zIndex: isSearching || isFound ? 40 : 10, cursor: 'grab',
                transform: isSearching ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.2s, box-shadow 0.2s',
                color: 'var(--text)'
            }}>
            {/* Header */}
            <div style={{
                padding: '0.4rem 0.6rem', borderBottom: '3px solid var(--border)', fontWeight: 800, fontSize: '0.75rem',
                color: '#000000', background: node.color, display: 'flex', alignItems: 'center', gap: '0.3rem'
            }}>
                <TreeIcon size={14} color="#000000" /> {node.id}
                <button onClick={e => { e.stopPropagation(); onEdit(node); }} style={{ marginLeft: 'auto', border: 'none', background: 'rgba(0,0,0,0.15)', borderRadius: '4px', padding: '2px 5px', cursor: 'pointer', fontSize: '0.55rem', fontWeight: 900, color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>Edit</button>
                <button onClick={e => { e.stopPropagation(); onRemove(node.id); }} style={{ border: 'none', background: 'rgba(0,0,0,0.15)', borderRadius: '50%', width: 16, height: 16, cursor: 'pointer', fontSize: '0.55rem', fontWeight: 900, color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            
            {/* Fields */}
            <div style={{ padding: '0.3rem 0.4rem' }}>
                {node.fields && node.fields.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {node.fields.map(f => <DarkFieldRow key={f.id} f={f} />)}
                        <div style={{ height: 1, background: 'var(--border)', opacity: 0.15, margin: '0.3rem 0' }} />
                    </div>
                )}
                
                {/* Methods */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    {node.methods && node.methods.length > 0 ? node.methods.map(m => (
                        <div key={m.id} onClick={e => { e.stopPropagation(); onMethodCall(node.id, m.name); }}>
                            <DarkMethodRow m={m} isFoundNode={isFound && node.methods.some(x => x.name === m.name && x.id === m.id)} isSearching={isSearching} />
                        </div>
                    )) : (
                        <div style={{ fontSize: '0.55rem', fontStyle: 'italic', color: 'var(--text)', opacity: 0.5, padding: '0.15rem 0.35rem' }}>No methods</div>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════
   OVERRIDE PANEL — DARK NEON VTABLE VISUALIZATION
   ══════════════════════════════════════════════════════════════════ */
const OverrideOverloadPanel = ({ nodes, isMobile }) => {
    const [selectedClassId, setSelectedClassId] = useState(nodes[0]?.id || '');
    const [selectedMethodName, setSelectedMethodName] = useState(null);

    const childNode = nodes.find(n => n.id === selectedClassId);

    // Reset selected method if class changes
    useEffect(() => {
        setSelectedMethodName(null);
    }, [selectedClassId]);

    // Calculate Child VTable entries
    const childVTable = useMemo(() => {
        if (!childNode) return [];
        let mro = [];
        try {
            mro = getC3MRO(childNode.id, nodes);
        } catch (e) {
            mro = [childNode.id];
        }
        const seen = new Set();
        const entries = [];
        mro.forEach(cid => {
            const n = nodes.find(x => x.id === cid);
            if (n) {
                n.methods.forEach(m => {
                    if (!seen.has(m.name)) {
                        seen.add(m.name);
                        const res = getMethodResolution(childNode.id, m.name, nodes);
                        const existsInAncestor = childNode.parents.some(pId => {
                            try {
                                const parentMro = getC3MRO(pId, nodes);
                                return parentMro.some(ancId => {
                                    const ancNode = nodes.find(x => x.id === ancId);
                                    return ancNode?.methods.some(pm => pm.name === m.name);
                                });
                            } catch (e) {
                                return false;
                            }
                        });
                        entries.push({
                            name: m.name,
                            resolvedClassId: res?.classId || cid,
                            isOverride: existsInAncestor && (res?.classId === childNode.id),
                            isInherited: existsInAncestor && (res?.classId !== childNode.id),
                            isNew: !existsInAncestor,
                            response: m.response
                        });
                    }
                });
            }
        });
        return entries;
    }, [childNode, nodes]);

    const activeEntry = childVTable.find(e => e.name === selectedMethodName);

    return (
        <div style={{
            height: '100%', width: '100%', display: 'flex', flexDirection: 'column', padding: '1rem', gap: '1rem',
            background: 'var(--bg)', color: 'var(--text)', overflowY: 'auto'
        }}>
            {/* Top Selector Panel */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', background: 'var(--white)', border: '3px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.6rem 0.8rem', boxShadow: 'var(--shadow-sm)', flexShrink: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontSize: '0.58rem', fontWeight: 800, opacity: 0.6, textTransform: 'uppercase' }}>Select Class to Inspect:</span>
                    <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} style={{ border: '2px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.2rem 0.4rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', background: 'var(--white)', color: 'var(--text)', cursor: 'pointer', outline: 'none' }}>
                        {nodes.map(n => (
                            <option key={n.id} value={n.id}>
                                Class {n.id}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Split Visual Layout */}
            <div style={{ display: 'flex', flex: 1, gap: '1.2rem', minHeight: 360, flexDirection: isMobile ? 'column' : 'row' }}>
                
                {/* 1. Left Card: Class Blueprint */}
                <div style={{
                    flex: 1, border: '3px solid var(--border)', borderRadius: 'var(--radius)',
                    background: 'var(--white)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.4rem', fontWeight: 900, fontSize: '0.75rem' }}>
                        <span style={{ background: childNode?.color || 'var(--cyan)', color: '#000000', padding: '1px 6px', border: '1px solid var(--border)', borderRadius: '4px' }}>Class {selectedClassId}</span>
                        <span>Blueprint Methods</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto' }}>
                        {childVTable.length === 0 ? (
                            <div style={{ fontStyle: 'italic', opacity: 0.5, textAlign: 'center', padding: '1rem' }}>No methods defined. Open Class Builder in the Canvas tab to add methods!</div>
                        ) : (
                            childVTable.map(entry => {
                                const isSelected = entry.name === selectedMethodName;
                                let badgeColor = 'var(--cyan)';
                                let badgeText = 'Subclass Exclusive';
                                if (entry.isOverride) {
                                    badgeColor = 'var(--pink)';
                                    badgeText = 'Overridden';
                                } else if (entry.isInherited) {
                                    badgeColor = 'var(--yellow)';
                                    badgeText = `Inherited from ${entry.resolvedClassId}`;
                                }
                                return (
                                    <button
                                        key={entry.name}
                                        onClick={() => setSelectedMethodName(entry.name)}
                                        style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', border: '2.5px solid var(--border)',
                                            background: isSelected ? 'var(--bg-outer)' : 'var(--white)',
                                            boxShadow: isSelected ? 'none' : '2px 2px 0 var(--border)',
                                            transform: isSelected ? 'translate(2px, 2px)' : 'none',
                                            cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left', width: '100%',
                                            outline: 'none'
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                            <span style={{ fontWeight: 800, fontSize: '0.7rem', color: 'var(--text)' }}>{entry.name}()</span>
                                        </div>
                                        <span style={{
                                            fontSize: '0.55rem', fontWeight: 900, background: badgeColor, color: '#000000',
                                            padding: '2px 6px', border: '1px solid var(--border)', borderRadius: '4px'
                                        }}>
                                            {badgeText}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* 2. Right Card: Resolution Target */}
                <div style={{
                    flex: 1.2, border: '3px solid var(--border)', borderRadius: 'var(--radius)',
                    background: 'var(--white)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: '0.4rem', fontWeight: 900, fontSize: '0.75rem', color: 'var(--text)' }}>
                        🎯 VTable Resolution Target
                    </div>

                    {activeEntry ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1, justifyContent: 'center' }}>
                            {/* Visual Dispatch Arrow Diagram */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', background: 'var(--bg-outer)', border: '2px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <div style={{ border: '2px solid var(--border)', background: 'var(--white)', padding: '0.35rem 0.6rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800 }}>
                                    {selectedClassId.toLowerCase()}.{activeEntry.name}()
                                </div>
                                <div style={{ fontSize: '1rem', color: 'var(--border)' }}>➔</div>
                                <div style={{ border: '2px solid var(--border)', background: activeEntry.isOverride ? 'var(--pink)' : activeEntry.isInherited ? 'var(--yellow)' : 'var(--green)', color: '#000000', padding: '0.35rem 0.6rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800 }}>
                                    {activeEntry.resolvedClassId}::{activeEntry.name}()
                                </div>
                            </div>

                            {/* Text explanation */}
                            <div style={{ fontSize: '0.66rem', lineHeight: 1.4, color: 'var(--text)', background: 'var(--white)', borderLeft: `4px solid ${activeEntry.isOverride ? 'var(--pink)' : activeEntry.isInherited ? 'var(--yellow)' : 'var(--green)'}`, paddingLeft: '0.5rem' }}>
                                {activeEntry.isOverride && (
                                    <>
                                        <strong>Method Overridden:</strong> Since <code>{selectedClassId}</code> overrides <code>{activeEntry.name}()</code>, the VTable slot points to the subclass implementation, overriding the behavior of the parent.
                                    </>
                                )}
                                {activeEntry.isInherited && (
                                    <>
                                        <strong>Method Inherited:</strong> Since <code>{selectedClassId}</code> does not override <code>{activeEntry.name}()</code>, the call resolves up the inheritance hierarchy to the parent implementation in <code>{activeEntry.resolvedClassId}</code>.
                                    </>
                                )}
                                {activeEntry.isNew && (
                                    <>
                                        <strong>New Method:</strong> This method is defined exclusively in <code>{selectedClassId}</code>.
                                    </>
                                )}
                            </div>

                            {/* Executed Code Segment */}
                            <div style={{ border: '2.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                                <div style={{ background: 'var(--bg-outer)', borderBottom: '2px solid var(--border)', padding: '0.2rem 0.5rem', fontSize: '0.58rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                                    Executed Code Body ({activeEntry.resolvedClassId}::{activeEntry.name})
                                </div>
                                <div style={{ padding: '0.6rem', background: '#0d1117', color: '#c9d1d9', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', lineHeight: 1.4 }}>
                                    <div>{`void ${activeEntry.name}() {`}</div>
                                    <div style={{ color: '#7ee787', paddingLeft: '1rem' }}>{`System.out.println("${activeEntry.response || 'Calling ' + activeEntry.name}");`}</div>
                                    <div>{`}`}</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '0.5rem', color: 'var(--text)', opacity: 0.6, textAlign: 'center', padding: '1rem' }}>
                            <LightbulbIcon size={36} color="var(--yellow)" />
                            <div style={{ fontSize: '0.72rem', fontWeight: 800 }}>No Method Selected</div>
                            <div style={{ fontSize: '0.62rem', maxWidth: 240, lineHeight: 1.3 }}>Click any method in the Class Blueprint on the left to simulate resolution.</div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════
   RUNTIME DISPATCH PANEL — DARK NEON PIPELINE VISUALIZATION
   ══════════════════════════════════════════════════════════════════ */
const RuntimeDispatchPanel = ({
    nodes,
    dispatchPairs,
    pairIdx,
    setPairIdx,
    selectedMethod,
    setSelectedMethod,
    step,
    log,
    runSimulation,
    onReset,
    isRunning,
    isMobile
}) => {
    const activePair = dispatchPairs[pairIdx] || null;

    if (dispatchPairs.length === 0) {
        return (
            <div style={{ height: '100%', width: '100%', background: 'var(--bg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', color: 'var(--text)' }}>
                <TargetIcon size={48} color="var(--pink)" />
                <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>No Polymorphic Pairs Available</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.6, textAlign: 'center', maxWidth: 320, lineHeight: 1.5 }}>
                    Polymorphism requires parent-child inheritance. Add classes on the canvas with parents to start!
                </div>
            </div>
        );
    }

    // Step explanation text mapping (clean & structured)
    const getStepExplanation = () => {
        if (!activePair) return '';
        switch (step) {
            case 1:
                return `Static check: The compiler verifies that the declared class '${activePair.parent.id}' defines '${selectedMethod}()' so that it compiles.`;
            case 2:
                return `Heap dereference: At runtime, the JVM looks up the reference 'ref' and finds the true object is of type '${activePair.child.id}'. It reads its hidden class pointer (vptr).`;
            case 3:
                return `VTable lookup & Execution: JVM inspects class '${activePair.child.id}'s VTable, resolves '${selectedMethod}()' slot, and calls '${getMethodResolution(activePair.child.id, selectedMethod, nodes)?.classId}::${selectedMethod}()'.`;
            case 4:
                return `Execution Completed: stdout prints "${getMethodResolution(activePair.child.id, selectedMethod, nodes)?.method.response || 'calling ' + selectedMethod}".`;
            default:
                return `Select ref/object setup and click "Dispatch" to trace the dynamic resolution step-by-step.`;
        }
    };

    return (
        <div style={{ height: '100%', width: '100%', background: 'var(--bg)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text)', overflowY: 'auto' }}>
            {/* Control Panel */}
            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'flex-end', background: 'var(--white)', border: '3px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.6rem 0.8rem', boxShadow: 'var(--shadow-sm)', flexShrink: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontSize: '0.55rem', fontWeight: 800, opacity: 0.6, textTransform: 'uppercase' }}>Reference Setup:</span>
                    <select value={pairIdx} onChange={e => setPairIdx(parseInt(e.target.value))} style={{ border: '2px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.2rem 0.4rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', background: 'var(--white)', color: 'var(--text)', cursor: 'pointer', outline: 'none' }}>
                        {dispatchPairs.map((p, idx) => (
                            <option key={idx} value={idx}>
                                {p.parent.id} ref = new {p.child.id}()
                            </option>
                        ))}
                    </select>
                </div>
                {activePair && activePair.sharedMethods.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, opacity: 0.6, textTransform: 'uppercase' }}>Method Call:</span>
                        <select value={selectedMethod} onChange={e => setSelectedMethod(e.target.value)} style={{ border: '2px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.2rem 0.4rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', background: 'var(--white)', color: 'var(--text)', cursor: 'pointer', outline: 'none' }}>
                            {activePair.sharedMethods.map(m => (
                                <option key={m.name} value={m.name}>{m.name}()</option>
                            ))}
                        </select>
                    </div>
                )}
                <div style={{ display: 'flex', gap: '0.3rem', marginLeft: 'auto' }}>
                    <button className="btn btn-yellow btn-sm" onClick={runSimulation} disabled={step > 0 && step < 4} style={{ fontSize: '0.68rem', padding: '0.35rem 0.75rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><ZapIcon size={12} color="#000000" /> Dispatch</span>
                    </button>
                    {step > 0 && (
                        <button className="btn btn-sm" onClick={onReset} style={{ fontSize: '0.68rem', padding: '0.35rem 0.75rem', background: 'var(--white)', border: '2px solid var(--border)' }}>
                            ↻ Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Code Context Header */}
            <div style={{
                background: 'var(--white)', border: '3px solid var(--border)', borderRadius: 'var(--radius)',
                padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', boxShadow: 'var(--shadow-sm)', flexShrink: 0
            }}>
                <div style={{ fontSize: '0.55rem', fontWeight: 800, opacity: 0.6, textTransform: 'uppercase' }}>Polymorphic Code Context:</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--pink)', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <div>{activePair.parent.id} ref = new {activePair.child.id}();</div>
                    <div>ref.{selectedMethod}();</div>
                </div>
            </div>

            {/* Redesigned 3-Box Flow Canvas */}
            <div style={{
                flex: 1, minHeight: 260, border: '3px solid var(--border)', background: 'var(--white)',
                borderRadius: 'var(--radius)', padding: '1.5rem', position: 'relative', display: 'flex',
                flexDirection: isMobile ? 'column' : 'row', gap: '1.5rem', justifyContent: 'space-around',
                alignItems: 'center', boxShadow: 'var(--shadow)'
            }}>
                {/* Step 1 Box: Reference (Compile Time Type) */}
                <div style={{
                    width: isMobile ? '100%' : '28%', minHeight: '120px', borderRadius: 'var(--radius)',
                    border: '3px solid var(--border)', background: step === 1 ? 'rgba(217, 119, 6, 0.12)' : 'var(--white)',
                    borderColor: step === 1 ? '#d97706' : 'var(--border)',
                    boxShadow: step === 1 ? '0 0 20px rgba(217, 119, 6, 0.4)' : 'none',
                    transform: step === 1 ? 'scale(1.04)' : 'scale(1)',
                    transition: 'all 0.25s ease-in-out', padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem',
                    animation: step === 1 ? 'glowBreathe 2s ease-in-out infinite' : 'none',
                    color: '#d97706'
                }}>
                    <div style={{
                        fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase',
                        color: step === 1 ? '#ffffff' : '#000000',
                        background: step === 1 ? '#d97706' : 'var(--yellow)',
                        padding: '2px 5px', borderRadius: '3px', alignSelf: 'flex-start',
                        transition: 'all 0.25s'
                    }}>
                        1. Reference Variable
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text)' }}>
                        <div><strong>Variable:</strong> ref</div>
                        <div><strong>Declared Type:</strong> {activePair.parent.id}</div>
                        <div style={{ fontSize: '0.58rem', opacity: 0.5, marginTop: '0.2rem' }}>[Compiler checks this class definition]</div>
                    </div>
                </div>

                {!isMobile && <div style={{ fontSize: '1.5rem', color: step === 1 ? '#d97706' : step === 2 ? '#2563eb' : (step === 3 || step === 4) ? '#16a34a' : 'var(--border)', fontWeight: 800, transition: 'color 0.25s' }}>➔</div>}

                {/* Step 2 Box: Runtime Instance */}
                <div style={{
                    width: isMobile ? '100%' : '28%', minHeight: '120px', borderRadius: 'var(--radius)',
                    border: '3px solid var(--border)', background: step === 2 ? 'rgba(37, 99, 235, 0.12)' : 'var(--white)',
                    borderColor: step === 2 ? '#2563eb' : 'var(--border)',
                    boxShadow: step === 2 ? '0 0 20px rgba(37, 99, 235, 0.4)' : 'none',
                    transform: step === 2 ? 'scale(1.04)' : 'scale(1)',
                    transition: 'all 0.25s ease-in-out', padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem',
                    animation: step === 2 ? 'glowBreathe 2s ease-in-out infinite' : 'none',
                    color: '#2563eb'
                }}>
                    <div style={{
                        fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase',
                        color: step === 2 ? '#ffffff' : '#000000',
                        background: step === 2 ? '#2563eb' : 'var(--cyan)',
                        padding: '2px 5px', borderRadius: '3px', alignSelf: 'flex-start',
                        transition: 'all 0.25s'
                    }}>
                        2. Heap Object
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text)' }}>
                        <div><strong>True Instance:</strong> {activePair.child.id}</div>
                        <div><strong>Metadata Link:</strong> vptr</div>
                        <div style={{ fontSize: '0.58rem', opacity: 0.5, marginTop: '0.2rem' }}>[Jumps to true class implementation at runtime]</div>
                    </div>
                </div>

                {!isMobile && <div style={{ fontSize: '1.5rem', color: step === 2 ? '#2563eb' : (step === 3 || step === 4) ? '#16a34a' : 'var(--border)', fontWeight: 800, transition: 'color 0.25s' }}>➔</div>}

                {/* Step 3 Box: VTable Target Executed */}
                <div style={{
                    width: isMobile ? '100%' : '28%', minHeight: '120px', borderRadius: 'var(--radius)',
                    border: '3px solid var(--border)', background: (step === 3 || step === 4) ? 'rgba(22, 163, 74, 0.12)' : 'var(--white)',
                    borderColor: (step === 3 || step === 4) ? '#16a34a' : 'var(--border)',
                    boxShadow: (step === 3 || step === 4) ? '0 0 20px rgba(22, 163, 74, 0.4)' : 'none',
                    transform: (step === 3 || step === 4) ? 'scale(1.04)' : 'scale(1)',
                    transition: 'all 0.25s ease-in-out', padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem',
                    animation: (step === 3 || step === 4) ? 'glowBreathe 2s ease-in-out infinite' : 'none',
                    color: '#16a34a'
                }}>
                    <div style={{
                        fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase',
                        color: (step === 3 || step === 4) ? '#ffffff' : '#000000',
                        background: (step === 3 || step === 4) ? '#16a34a' : 'var(--green)',
                        padding: '2px 5px', borderRadius: '3px', alignSelf: 'flex-start',
                        transition: 'all 0.25s'
                    }}>
                        3. Resolved Method
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text)' }}>
                        <div><strong>Resolves To:</strong> {getMethodResolution(activePair.child.id, selectedMethod, nodes)?.classId}::{selectedMethod}()</div>
                        <div style={{ fontSize: '0.58rem', opacity: 0.5, marginTop: '0.2rem' }}>[Redirected by VTable function slot]</div>
                    </div>
                </div>
            </div>

            {/* Explanation Banner */}
            <div style={{
                background: 'rgba(56, 161, 105, 0.08)',
                borderLeft: '4px solid var(--green)',
                padding: '0.6rem 0.8rem',
                fontSize: '0.68rem',
                lineHeight: 1.4,
                borderRadius: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.15rem',
                flexShrink: 0
            }}>
                <div style={{ fontWeight: 800 }}>⚙️ JVM Resolution Flow:</div>
                <div style={{ color: 'var(--text)' }}>{getStepExplanation()}</div>
            </div>

            {/* Output Segment */}
            <div className="panel" style={{
                padding: '0.6rem 0.8rem', fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                background: 'var(--white)', color: 'var(--text)', border: 'var(--border-width) solid var(--border)',
                borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', flexShrink: 0
            }}>
                <span style={{ fontWeight: 800, color: 'var(--pink)' }}>Console Output:</span>
                <div style={{ marginTop: '0.2rem', color: step === 4 ? 'var(--green)' : 'var(--text)', fontWeight: step === 4 ? 800 : 500 }}>
                    {log || 'Click "Dispatch" to start step-by-step memory resolution.'}
                </div>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT DEFINITION
   ══════════════════════════════════════════════════════════════════ */
export default function InheritanceDeepDiveSim() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const canvasContainerRef = useRef(null);
    const [treeType, setTreeType] = useState('Single');
    const [nodes, setNodes] = useState(() => {
        // Initial state uses raw presets; centering happens in useEffect once canvasContainerRef is measured
        return PRESETS['Single'].map(n => ({ ...n }));
    });
    const [activeNode, setActiveNode] = useState(null);
    const [mroPath, setMroPath] = useState([]);
    const [currentMroSearch, setCurrentMroSearch] = useState(null);
    const [foundNodeId, setFoundNodeId] = useState(null);
    const [mroSteps, setMroSteps] = useState(0);
    const [mroOutput, setMroOutput] = useState(null);
    const [codeLang, setCodeLang] = useState('java');
    const [speed, setSpeed] = useState(700);
    const [view, setView] = useState('tree'); // tree | override | dispatch
    const [mroError, setMroError] = useState(null);
    const [showBuilder, setShowBuilder] = useState(false);

    const loadPreset = useCallback((type) => {
        setTreeType(type);
        // Just set raw preset nodes; the centering useEffect will position them
        setNodes(PRESETS[type].map(n => ({ ...n })));
        setActiveNode(null); setMroPath([]); setMroSteps(0);
        setCurrentMroSearch(null); setFoundNodeId(null); setMroOutput(null);
        setMroError(null);
        setIsRunning(false);
        setIsPaused(false);
        setIsFinished(false);
        setCurrentStep(0);
        setDispatchStep(0);
        setDispatchLog('');
        userDraggedRef.current = false;
    }, []);

    // Track whether user has manually dragged cards
    const userDraggedRef = useRef(false);
    const treeTypeRef = useRef(treeType);
    treeTypeRef.current = treeType;

    // Helper to center nodes given a canvas width
    const centerNodes = useCallback((canvasWidth) => {
        if (canvasWidth <= 0 || userDraggedRef.current) return;
        const centerX = (canvasWidth - NODE_W) / 2;
        setNodes(prev => prev.map(n => {
            let xOffset = 0;
            const currentType = treeTypeRef.current;
            const presetNodes = PRESETS[currentType];
            if (presetNodes) {
                const presetNode = presetNodes.find(pn => pn.id === n.id);
                if (presetNode) {
                    xOffset = presetNode.x - 305;
                }
            }
            return { ...n, x: centerX + xOffset };
        }));
    }, []);

    // Use ResizeObserver for reliable centering after layout settles
    useEffect(() => {
        const el = canvasContainerRef.current;
        if (!el) return;
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const w = entry.contentRect.width;
                if (w > 0 && !userDraggedRef.current) {
                    centerNodes(w);
                }
            }
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [centerNodes, view]);

    // Re-center when treeType changes (preset loaded)
    useEffect(() => {
        userDraggedRef.current = false;
        const el = canvasContainerRef.current;
        if (el && el.clientWidth > 0) {
            // Use a small delay for the preset nodes state to settle
            const t = setTimeout(() => centerNodes(el.clientWidth), 60);
            return () => clearTimeout(t);
        }
    }, [treeType, centerNodes]);

    // Helper to calculate card center coordinates for drawing connections
    const getCoordinates = (nodeId) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return { x: 0, y: 0 };
        const h = NODE_H_BASE + (node.fields?.length || 0) * 18 + (node.methods?.length || 0) * 20 + 20;
        return {
            x1: node.x + NODE_W / 2,
            y1: node.y + h,
            x2: node.x + NODE_W / 2,
            y2: node.y
        };
    };

    // Dynamic drag event bindings
    const handleDragStart = (id, e, isTouch = false) => {
        e.preventDefault();
        const clientX = isTouch ? e.touches[0].clientX : e.clientX;
        const clientY = isTouch ? e.touches[0].clientY : e.clientY;
        const node = nodes.find(n => n.id === id);
        if (!node) return;
        
        const startX = node.x;
        const startY = node.y;
        
        const handleMove = (moveEv) => {
            userDraggedRef.current = true;
            const x = isTouch ? moveEv.touches[0].clientX : moveEv.clientX;
            const y = isTouch ? moveEv.touches[0].clientY : moveEv.clientY;
            setNodes(prev => prev.map(n => n.id === id ? { ...n, x: Math.max(10, startX + (x - clientX)), y: Math.max(10, startY + (y - clientY)) } : n));
        };
        
        const handleEnd = () => {
            if (isTouch) {
                window.removeEventListener('touchmove', handleMove);
                window.removeEventListener('touchend', handleEnd);
            } else {
                window.removeEventListener('mousemove', handleMove);
                window.removeEventListener('mouseup', handleEnd);
            }
        };
        
        if (isTouch) {
            window.addEventListener('touchmove', handleMove, { passive: false });
            window.addEventListener('touchend', handleEnd);
        } else {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleEnd);
        }
    };
    
    const [editingClassNode, setEditingClassNode] = useState(null);

    const handleAddClass = useCallback((c) => {
        setNodes(prev => [...prev, c]);
        setTreeType('Custom');
    }, []);

    const handleEditClass = useCallback((node) => {
        setEditingClassNode(node);
        setShowBuilder(true);
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditingClassNode(null);
        setShowBuilder(false);
    }, []);

    const handleUpdateClass = useCallback((oldId, updatedNode) => {
        setNodes(prev => prev.map(n => {
            if (n.id === oldId) {
                return { ...n, ...updatedNode };
            }
            if (updatedNode.id !== oldId && n.parents.includes(oldId)) {
                return {
                    ...n,
                    parents: n.parents.map(p => p === oldId ? updatedNode.id : p)
                };
            }
            return n;
        }));
        setEditingClassNode(null);
        setShowBuilder(false);
        setTreeType('Custom');
    }, []);

    const handleRemoveClass = useCallback((id) => {
        setNodes(prev => prev.filter(n => n.id !== id).map(n => ({
            ...n, parents: n.parents.filter(p => p !== id)
        })));
        if (editingClassNode && editingClassNode.id === id) {
            setEditingClassNode(null);
            setShowBuilder(false);
        }
        setTreeType('Custom');
    }, [editingClassNode]);

    const simIntervalRef = useRef(null);
    const simStateRef = useRef({
        type: 'mro', // 'mro' | 'dispatch'
        steps: [],
        stepIndex: 0,
        resolvedNodeId: null,
        methodName: '',
        classId: ''
    });

    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [totalSteps, setTotalSteps] = useState(1);

    // Elevated dispatch states
    const [dispatchPairIdx, setDispatchPairIdx] = useState(0);
    const [dispatchSelectedMethod, setDispatchSelectedMethod] = useState('');
    const [dispatchStep, setDispatchStep] = useState(0);
    const [dispatchLog, setDispatchLog] = useState('');

    const dispatchPairs = useMemo(() => {
        const pairs = [];
        nodes.forEach(child => {
            const ancestors = getAllAncestors(child.id, nodes);
            ancestors.forEach(pId => {
                const parent = nodes.find(n => n.id === pId);
                if (!parent) return;
                const sharedMethods = parent.methods;
                if (sharedMethods.length > 0) {
                    pairs.push({ parent, child, sharedMethods });
                }
            });
        });
        return pairs;
    }, [nodes]);

    const activeDispatchPair = dispatchPairs[dispatchPairIdx] || null;

    useEffect(() => {
        if (dispatchPairs.length > 0 && dispatchPairIdx >= dispatchPairs.length) {
            setDispatchPairIdx(0);
        }
    }, [dispatchPairs, dispatchPairIdx]);

    useEffect(() => {
        if (activeDispatchPair && activeDispatchPair.sharedMethods.length > 0) {
            setDispatchSelectedMethod(activeDispatchPair.sharedMethods[0].name);
        } else {
            setDispatchSelectedMethod('');
        }
        setDispatchStep(0);
        setDispatchLog('');
        
        setIsRunning(false);
        setIsPaused(false);
        setIsFinished(false);
        setCurrentStep(0);
    }, [dispatchPairIdx, activeDispatchPair]);

    useEffect(() => {
        return () => clearInterval(simIntervalRef.current);
    }, []);

    const startTimer = useCallback(() => {
        clearInterval(simIntervalRef.current);
        setIsRunning(true);
        setIsPaused(false);
        setIsFinished(false);

        simIntervalRef.current = setInterval(() => {
            const { type, steps, stepIndex, resolvedNodeId, methodName, classId } = simStateRef.current;
            
            if (stepIndex >= steps.length) {
                clearInterval(simIntervalRef.current);
                setIsRunning(false);
                setIsFinished(true);
                
                if (type === 'mro') {
                    if (resolvedNodeId) {
                        setFoundNodeId(resolvedNodeId);
                        const matchedMethod = nodes.find(n => n.id === resolvedNodeId)?.methods.find(m => m.name === methodName);
                        setMroOutput(`Method call resolve success! Resolved to ${resolvedNodeId}.${methodName}() -> "${matchedMethod?.response || 'Method executed'}"`);
                    } else {
                        setMroOutput(`Lookup failed: Method "${methodName}()" is not defined anywhere in the class hierarchy.`);
                    }
                } else if (type === 'dispatch') {
                    const res = getMethodResolution(activeDispatchPair.child.id, dispatchSelectedMethod, nodes);
                    if (res) {
                        setDispatchLog(`Step 4: Dispatched! Resolved to ${res.classId}.${dispatchSelectedMethod}() -> "${res.method.response || 'Method executed'}"`);
                    } else {
                        setDispatchLog('Step 4: Error - Method not found in hierarchy.');
                    }
                }
                return;
            }

            // Execute step
            if (type === 'mro') {
                const activeStepNode = steps[stepIndex];
                setCurrentMroSearch(activeStepNode);
                setMroPath(steps.slice(0, stepIndex + 1));
                setMroSteps(stepIndex + 1);
                setCurrentStep(stepIndex + 1);
            } else if (type === 'dispatch') {
                const s = steps[stepIndex];
                setDispatchStep(s);
                setCurrentStep(s);
                if (s === 1) {
                    setDispatchLog(`Step 1: Checking compile-time type on Stack. Compiler verifies that "${activeDispatchPair.parent.id}" defines "${dispatchSelectedMethod}()".`);
                } else if (s === 2) {
                    setDispatchLog(`Step 2: Dereferencing pointer (0x7B58) to Heap. The JVM checks the actual object type in memory ("${activeDispatchPair.child.id}").`);
                } else if (s === 3) {
                    setDispatchLog(`Step 3: Querying VTable of "${activeDispatchPair.child.id}" via its "vptr" pointer.`);
                }
            }

            simStateRef.current.stepIndex = stepIndex + 1;
        }, speed);
    }, [nodes, speed, activeDispatchPair, dispatchSelectedMethod]);

    const handleMethodCall = useCallback((nodeId, methodName) => {
        clearInterval(simIntervalRef.current);
        setMroError(null);
        setMroOutput(null);
        setCurrentMroSearch(null);
        setFoundNodeId(null);
        setMroPath([]);
        setMroSteps(0);
        
        try {
            const mro = getC3MRO(nodeId, nodes);
            let searchSteps = [];
            let resolvedNodeId = null;

            for (const classId of mro) {
                searchSteps.push(classId);
                const classNode = nodes.find(n => n.id === classId);
                if (classNode?.methods.some(m => m.name === methodName)) {
                    resolvedNodeId = classId;
                    break;
                }
            }

            simStateRef.current = {
                type: 'mro',
                steps: searchSteps,
                stepIndex: 0,
                resolvedNodeId,
                methodName,
                classId: nodeId
            };
            setTotalSteps(searchSteps.length);
            setCurrentStep(0);
            startTimer();
            
        } catch (err) {
            setMroError(err.message);
            setIsRunning(false);
        }
    }, [nodes, startTimer]);

    const handleStart = useCallback(() => {
        if (view === 'tree') {
            const candidate = nodes.slice().reverse().find(n => n.methods.length > 0) || nodes[0];
            if (candidate && candidate.methods.length > 0) {
                handleMethodCall(candidate.id, candidate.methods[0].name);
            }
        } else if (view === 'dispatch') {
            if (activeDispatchPair && dispatchSelectedMethod) {
                simStateRef.current = {
                    type: 'dispatch',
                    steps: [1, 2, 3, 4],
                    stepIndex: 0
                };
                setTotalSteps(4);
                setCurrentStep(0);
                setDispatchStep(0);
                setDispatchLog('Initializing Dynamic Dispatch simulation...');
                startTimer();
            }
        }
    }, [view, nodes, activeDispatchPair, dispatchSelectedMethod, handleMethodCall, startTimer]);

    const handlePause = useCallback(() => {
        clearInterval(simIntervalRef.current);
        setIsPaused(true);
    }, []);

    const handleResume = useCallback(() => {
        startTimer();
    }, [startTimer]);

    const handleReset = useCallback(() => {
        clearInterval(simIntervalRef.current);
        setIsRunning(false);
        setIsPaused(false);
        setIsFinished(false);
        setCurrentStep(0);
        setMroSteps(0);
        setMroPath([]);
        setCurrentMroSearch(null);
        setFoundNodeId(null);
        setMroOutput(null);
        setMroError(null);
        setDispatchStep(0);
        setDispatchLog('');
        loadPreset('Single');
    }, [loadPreset]);

    const handleStep = useCallback(() => {
        clearInterval(simIntervalRef.current);
        setIsRunning(true);
        setIsPaused(true);
        const { type, steps, stepIndex, resolvedNodeId, methodName } = simStateRef.current;
        if (stepIndex >= steps.length) {
            setIsFinished(true);
            setIsRunning(false);
            return;
        }

        if (type === 'mro') {
            const activeStepNode = steps[stepIndex];
            setCurrentMroSearch(activeStepNode);
            setMroPath(steps.slice(0, stepIndex + 1));
            setMroSteps(stepIndex + 1);
            setCurrentStep(stepIndex + 1);
            if (stepIndex + 1 === steps.length) {
                setIsFinished(true);
                setIsRunning(false);
                if (resolvedNodeId) {
                    setFoundNodeId(resolvedNodeId);
                    const matchedMethod = nodes.find(n => n.id === resolvedNodeId)?.methods.find(m => m.name === methodName);
                    setMroOutput(`Method call resolve success! Resolved to ${resolvedNodeId}.${methodName}() -> "${matchedMethod?.response || 'Method executed'}"`);
                } else {
                    setMroOutput(`Lookup failed: Method "${methodName}()" is not defined anywhere in the class hierarchy.`);
                }
            }
        } else if (type === 'dispatch') {
            const s = steps[stepIndex];
            setDispatchStep(s);
            setCurrentStep(s);
            if (s === 1) {
                setDispatchLog(`Step 1: Checking compile-time type on Stack. Compiler verifies that "${activeDispatchPair.parent.id}" defines "${dispatchSelectedMethod}()".`);
            } else if (s === 2) {
                setDispatchLog(`Step 2: Dereferencing pointer (0x7B58) to Heap. The JVM checks the actual object type in memory ("${activeDispatchPair.child.id}").`);
            } else if (s === 3) {
                setDispatchLog(`Step 3: Querying VTable of "${activeDispatchPair.child.id}" via its "vptr" pointer.`);
            } else if (s === 4) {
                const res = getMethodResolution(activeDispatchPair.child.id, dispatchSelectedMethod, nodes);
                setIsFinished(true);
                setIsRunning(false);
                if (res) {
                    setDispatchLog(`Step 4: Dispatched! Resolved to ${res.classId}.${dispatchSelectedMethod}() -> "${res.method.response || 'Method executed'}"`);
                } else {
                    setDispatchLog('Step 4: Error - Method not found in hierarchy.');
                }
            }
        }

        simStateRef.current.stepIndex = stepIndex + 1;
    }, [nodes, activeDispatchPair, dispatchSelectedMethod]);

    useEffect(() => {
    }, []);

    // Compute MRO summary for left info tab
    const selectedClassMro = useMemo(() => {
        if (nodes.length === 0) return [];
        try {
            const rootClass = nodes[nodes.length - 1]?.id;
            return getC3MRO(rootClass, nodes);
        } catch (e) {
            return [];
        }
    }, [nodes]);

    /* ── SVG CONNECTIONS ── */
    const svgLines = useMemo(() => {
        const list = [];
        nodes.forEach(n => {
            n.parents.forEach(pId => {
                const parentCoords = getCoordinates(pId);
                const childCoords = getCoordinates(n.id);
                if (!parentCoords || !childCoords) return;
                
                const x1 = childCoords.x2; // Child top center
                const y1 = childCoords.y2;
                const x2 = parentCoords.x1; // Parent bottom center
                const y2 = parentCoords.y1;

                // Bezier curve points
                const cy = (y1 + y2) / 2;
                const pathD = `M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`;

                // Pulse lookup path matching active MRO search
                const isPulse = mroPath.includes(n.id) && mroPath.includes(pId);

                list.push({
                    key: `${n.id}-${pId}`,
                    d: pathD,
                    stroke: isPulse ? '#ffd93d' : 'var(--border)',
                    strokeWidth: isPulse ? 4 : 2.5,
                    dashFlow: isPulse
                });
            });
        });
        return list;
    }, [nodes, mroPath]);

    /* ── LEFT PANEL ── */
    const LEFT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', color: 'var(--text)' }}>
            {/* Presets selector */}
            <div className="panel">
                <div className="panel-header" style={{ background: 'var(--yellow)', color: '#000000', padding: '0.4rem 0.6rem', fontSize: '0.68rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><PillarIcon size={14} /> Class Presets</span>
                </div>
                <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {Object.keys(PRESETS).map(k => (
                        <button key={k} onClick={() => loadPreset(k)} 
                            className="btn btn-sm"
                            style={{
                                background: treeType === k ? 'var(--yellow)' : 'var(--white)',
                                color: '#000000',
                                width: '100%',
                                justifyContent: 'flex-start',
                                fontSize: '0.65rem',
                                border: '2px solid var(--border)',
                                transform: 'none',
                                boxShadow: 'none'
                            }}>
                            {treeType === k ? '> ' : ''}{k}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats panel */}
            <div className="panel">
                <div className="panel-header" style={{ background: 'var(--cyan)', color: '#000000', padding: '0.4rem 0.6rem', fontSize: '0.68rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><ActivityIcon size={14} /> System Stats</span>
                </div>
                <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total Classes:</span>
                        <span style={{ fontWeight: 800 }}>{nodes.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Inheritance type:</span>
                        <span style={{ fontWeight: 800, color: 'var(--pink)' }}>{treeType}</span>
                    </div>
                </div>
            </div>

            {/* MRO info */}
            {selectedClassMro.length > 0 && (
                <div className="panel">
                    <div className="panel-header" style={{ background: 'var(--green)', color: '#000000', padding: '0.4rem 0.6rem', fontSize: '0.68rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><TreeIcon size={14} /> C3 MRO Order</span>
                    </div>
                    <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.62rem', fontFamily: 'var(--font-mono)' }}>
                        <div style={{ opacity: 0.6, fontSize: '0.55rem' }}>Method Resolution Path:</div>
                        {selectedClassMro.map((cId, idx) => (
                            <div key={cId} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <span style={{ background: 'var(--green)', color: '#000000', padding: '1px 5px', fontWeight: 800, border: '1px solid var(--border)' }}>
                                    {idx + 1}
                                </span>
                                <span style={{ fontWeight: 800 }}>{cId}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        
            
        </div>
    );

    /* ── RIGHT PANEL ── */
    const RIGHT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <LiveCodePanel nodes={nodes} codeLang={codeLang} onLangChange={setCodeLang} />
            
            <div className="panel">
                <div className="panel-header" style={{ background: 'var(--cyan)', color: '#000000', padding: '0.4rem 0.6rem', fontSize: '0.68rem' }}>Method Resolution Order</div>
                <div style={{ padding: '0.5rem', fontSize: '0.68rem', lineHeight: 1.5, color: 'var(--text)' }}>
                    MRO defines the search path when looking up methods in multiple inheritance structures. Python uses <strong>C3 Linearization</strong> to merge parent lookup tables, preventing conflicts.
                </div>
            </div>
            
            <div className="panel">
                <div className="panel-header" style={{ background: 'var(--pink)', color: '#000000', padding: '0.4rem 0.6rem', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><LightbulbIcon size={14} color="#000000" /> Diamond Problem</div>
                <div style={{ padding: '0.5rem', fontSize: '0.68rem', lineHeight: 1.5, color: 'var(--text)' }}>
                    Occurs when a child class inherits from multiple parents who share a common ancestor. Trace hybrid presets to see MRO path routing resolution in real time.
                </div>
            </div>
        </div>
    );

    /* ── CENTER VIEW ── */
    const CENTER = (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* View selectors */}
            <div style={{ 
                display: 'flex', 
                borderBottom: 'var(--border-width) solid var(--border)', 
                flexShrink: 0, 
                background: 'var(--white)',
                overflowX: isMobile ? 'auto' : 'visible',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
            }}>
                {[['tree', 'Inheritance Canvas'], ['override', 'Overriding'], ['dispatch', 'Runtime Dispatch']].map(([k, label]) => (
                    <button key={k} onClick={() => setView(k)} style={{
                        flex: isMobile ? '1 0 auto' : 1,
                        minWidth: isMobile ? '110px' : 'auto',
                        padding: isMobile ? '0.4rem 0.6rem' : '0.55rem',
                        fontWeight: 800,
                        fontSize: isMobile ? '0.65rem' : '0.75rem',
                        cursor: 'pointer',
                        background: view === k ? 'var(--yellow)' : 'transparent',
                        border: 'none', borderBottom: view === k ? `3px solid var(--border)` : '3px solid transparent',
                        borderRight: 'var(--border-width) solid var(--border)', fontFamily: 'var(--font-main)',
                        color: view === k ? '#000000' : 'var(--text)', opacity: view === k ? 1 : 0.6, transition: 'all 0.2s'
                    }}>{label}</button>
                ))}
            </div>

            <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg)', position: 'relative', padding: '1rem' }}>
                {view === 'tree' && (
                    <div ref={canvasContainerRef} style={{ width: isMobile ? 650 : '100%', height: '100%', minHeight: 480, position: 'relative', overflow: 'hidden', background: `radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px), var(--bg)`, backgroundSize: '24px 24px', border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
                        
                        {/* Connection Lines Rendering */}
                        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                            {/* Hollow triangle markers for UML notation inheritance arrows */}
                            <defs>
                                <marker id="uml-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                    <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--white)" stroke="var(--border)" strokeWidth="1.8" />
                                </marker>
                                <marker id="uml-arrow-pulse" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                    <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--white)" stroke="#ffd93d" strokeWidth="1.8" />
                                </marker>
                            </defs>
                            
                            {svgLines.map(l => (
                                <path key={l.key} d={l.d} fill="none" stroke={l.stroke} strokeWidth={l.strokeWidth}
                                    markerEnd={l.dashFlow ? 'url(#uml-arrow-pulse)' : 'url(#uml-arrow)'}
                                    style={l.dashFlow ? { animation: 'flowUp 1s linear infinite' } : {}}
                                    strokeDasharray={l.dashFlow ? '6 3' : 'none'} />
                            ))}
                        </svg>

                        {/* Class Cards rendering */}
                        <div style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
                            {nodes.map(n => (
                                <ClassNodeCard key={n.id} node={n}
                                    isActive={activeNode === n.id}
                                    mroPath={mroPath}
                                    foundNodeId={foundNodeId}
                                    currentMroSearch={currentMroSearch}
                                    onMethodCall={handleMethodCall}
                                    onMouseDown={e => handleDragStart(n.id, e, false)}
                                    onTouchStart={e => handleDragStart(n.id, e, true)}
                                    onRemove={handleRemoveClass}
                                    onEdit={handleEditClass} />
                            ))}
                        </div>

                        {/* Class Builder Floating Tool Window */}
                        {showBuilder ? (
                            <div style={{
                                position: 'absolute', top: 15, left: 15, zIndex: 100, width: 280,
                                background: 'var(--white)', border: 'var(--border-width) solid var(--border)',
                                boxShadow: 'var(--shadow)', borderRadius: 'var(--radius)',
                                maxHeight: 'calc(100% - 30px)', overflowY: 'auto'
                            }}>
                                <div style={{ background: 'var(--yellow)', color: '#000000', padding: '0.4rem 0.6rem', borderBottom: 'var(--border-width) solid var(--border)', fontWeight: 800, fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>{editingClassNode ? `Edit Class: ${editingClassNode.id}` : 'Class Builder'}</span>
                                    <button onClick={handleCancelEdit} style={{ border: 'none', background: 'rgba(0,0,0,0.1)', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 900, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                                </div>
                                <div style={{ padding: '0.6rem' }}>
                                    <ClassHierarchyBuilder nodes={nodes} onAddClass={handleAddClass} onUpdateClass={handleUpdateClass} editNode={editingClassNode} onCancelEdit={handleCancelEdit} />
                                </div>
                            </div>
                        ) : (
                            <button onClick={() => { setEditingClassNode(null); setShowBuilder(true); }} className="btn btn-yellow" style={{ position: 'absolute', top: 15, left: 15, zIndex: 100, fontSize: '0.7rem', padding: '0.4rem 0.8rem', boxShadow: 'var(--shadow-sm)' }}>
                                Open Class Builder
                            </button>
                        )}

                        {/* Drag and Drop instructions */}
                        <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', gap: '0.4rem', zIndex: 10, pointerEvents: 'none', opacity: 0.6, fontSize: '0.55rem', color: 'var(--text)', fontWeight: 800 }}>
                            Drag any class card to arrange UML structure. Click method name to trace MRO.
                        </div>

                        {/* Interactive MRO Step Tracker */}
                        {mroSteps > 0 && (
                            <div style={{ position: 'absolute', top: 10, right: 10, background: 'var(--white)', border: '2px solid var(--border)', color: '#000000', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius)', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 800, zIndex: 10, boxShadow: 'var(--shadow-sm)' }}>
                                MRO Search Lookup: {mroSteps} step{mroSteps > 1 ? 's' : ''}
                            </div>
                        )}

                        {/* Console Output Log */}
                        <AnimatePresence>
                            {mroOutput && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                    style={{ position: 'absolute', bottom: 15, right: 15, background: 'var(--white)', border: '2px solid var(--border)', color: '#22863a', padding: '0.5rem 0.8rem', borderRadius: 'var(--radius)', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 800, maxWidth: 300, zIndex: 10, boxShadow: 'var(--shadow)' }}>
                                    {mroOutput}
                                </motion.div>
                            )}
                            
                            {mroError && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                    style={{ position: 'absolute', bottom: 15, right: 15, background: 'var(--white)', border: '2px solid var(--border)', color: '#d73a49', padding: '0.5rem 0.8rem', borderRadius: 'var(--radius)', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 800, maxWidth: 300, zIndex: 10, boxShadow: 'var(--shadow)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><AlertIcon size={12} color="#d73a49" /> {mroError}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
                {view === 'override' && <OverrideOverloadPanel nodes={nodes} isMobile={isMobile} />}
                {view === 'dispatch' && (
                    <RuntimeDispatchPanel
                        nodes={nodes}
                        dispatchPairs={dispatchPairs}
                        pairIdx={dispatchPairIdx}
                        setPairIdx={setDispatchPairIdx}
                        selectedMethod={dispatchSelectedMethod}
                        setSelectedMethod={setDispatchSelectedMethod}
                        step={dispatchStep}
                        log={dispatchLog}
                        runSimulation={handleStart}
                        onReset={handleReset}
                        isRunning={isRunning}
                        isMobile={isMobile}
                    />
                )}
            </div>
        </div>
    );

    
    useSnapshot(useCallback((config, step) => {
        if (config.treeType !== undefined) setTreeType(config.treeType);
        if (config.nodes !== undefined) setNodes(config.nodes);
        if (config.activeNode !== undefined) setActiveNode(config.activeNode);
        if (config.view !== undefined) setView(config.view);
        if (config.codeLang !== undefined) setCodeLang(config.codeLang);

        setTimeout(() => {
            if (step !== undefined) setCurrentStep(step);
            setIsRunning(false);
            setIsPaused(true);

        }, 50);
    }, []));

    return (
        <ImmersiveLayout isActive={true}
            snapshotData={{
                config: { treeType, nodes, activeNode, view, codeLang },
                step: currentStep
            }} title="Inheritance & Polymorphism Deep Dive" icon={<TreeIcon size={22} />} moduleLabel="OOP MODULE"
            isRunning={isRunning} isPaused={isPaused} isFinished={isFinished} speed={speed} onSpeedChange={setSpeed}
            onStart={handleStart} onPause={handlePause} onResume={handleResume} onReset={handleReset} onStep={handleStep}
            currentStepNum={currentStep} totalSteps={totalSteps}
            phaseName={view === 'tree' ? (currentMroSearch ? `MRO: Searching ${currentMroSearch}` : `${treeType} Inheritance`) : `Dynamic Dispatch Simulation`}
            centerContent={CENTER} leftContent={LEFT} rightContent={RIGHT}
            timelineItems={mroPath.map((p, i) => ({ id: i, label: p, done: i < mroPath.length - 1, active: i === mroPath.length - 1 }))}
            legend={[{ color: '#ffd93d', label: 'Active MRO Path' }, { color: '#22863a', label: 'Method Found' }, { color: 'var(--border)', label: 'Inheritance Connection' }]}>
            <StyleOverrides />
            <div className="main-content">
                <Link to="/oops" style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← OOP Module</Link>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TreeIcon size={32} /> Inheritance Deep Dive</h1>
            </div>
        </ImmersiveLayout>
    );
}
