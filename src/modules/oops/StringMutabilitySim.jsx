import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';

// ─── PRESET SCENARIOS ────────────────────────────────────────────────────────
const PRESETS = [
    {
        id: 'literal',
        icon: '🌊',
        label: 'Pool Reuse',
        badge: 'String Pool',
        color: '#10b981',
        code: `String s1 = "Hello";\nString s2 = "Hello";`,
    },
    {
        id: 'concat',
        icon: '🔒',
        label: 'Immutability',
        badge: 'Concat',
        color: '#8b5cf6',
        code: `String s = "Hello";\ns = s + " World";`,
    },
    {
        id: 'stringbuilder',
        icon: '✏️',
        label: 'StringBuilder',
        badge: 'Mutable',
        color: '#06b6d4',
        code: `StringBuilder sb = new StringBuilder("Hello");\nsb.append(" World");`,
    },
    {
        id: 'stringbuffer',
        icon: '🛡️',
        label: 'StringBuffer',
        badge: 'Thread-Safe',
        color: '#f97316',
        code: `StringBuffer sb = new StringBuffer("Hi");\nsb.append("!");`,
    },
    {
        id: 'intern',
        icon: '♻️',
        label: 'intern()',
        badge: 'Interning',
        color: '#ec4899',
        code: `String s = new String("Hello").intern();`,
    },
    {
        id: 'capacity',
        icon: '📈',
        label: 'Capacity Resize',
        badge: 'Buffer',
        color: '#3b82f6',
        code: `StringBuilder sb = new StringBuilder("Hello");\nsb.append(" World!!!!!!!!!");`,
    },
    {
        id: 'custom',
        icon: '📝',
        label: 'Custom Code',
        badge: 'Yours',
        color: '#f59e0b',
        code: `// Write your own Java-like string code!\n// Supported:\n//   String x = "text";\n//   x = x + " more";\n//   StringBuilder sb = new StringBuilder("hi");\n//   sb.append(" there");\n//   StringBuffer buf = new StringBuffer("a");\n//   buf.append("b");\n//   String s = new String("text").intern();\nString a = "Java";\nString b = "Java";\na = a + " Rocks";\n`,
    },
];

// ─── STEP BUILDER ─────────────────────────────────────────────────────────────
const ADDR = (n) => `0x${n.toString(16).toUpperCase().padStart(4, '0')}`;

function buildSteps(code) {
    const steps = [];
    let heapSeq = 0xa100;
    let poolSeq = 0xc000;
    const heap = {};
    const pool = {};   // value → addr
    const stack = {};  // name → addr
    const vars = {};   // name → { type, addr, value }

    const snap = (phase, explanation, why, impact, action = {}) =>
        steps.push({
            phase, explanation, why, impact, action,
            heapState: JSON.parse(JSON.stringify(heap)),
            poolState: JSON.parse(JSON.stringify(pool)),
            stackState: JSON.parse(JSON.stringify(stack))
        });

    snap('Ready', 'Memory initialized. All regions are empty.', 'Program not started yet.', 'No memory consumed.');

    const lines = code.split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('//'));

    for (const raw of lines) {
        const line = raw.replace(/;$/, '').trim();

        // ── String x = "literal"
        const strLit = line.match(/^String\s+(\w+)\s*=\s*"([^"]+)"$/);
        if (strLit) {
            const [, name, val] = strLit;
            snap(`Check Pool → "${val}"`, `JVM checks String Pool for "${val}".`, 'String literals are always interned by default.', 'O(1) pool lookup.', { poolCheck: val });
            if (!pool[val]) {
                const addr = ADDR(poolSeq);
                poolSeq += 0x10;
                pool[val] = addr;
                heap[addr] = { type: 'String (Pool)', value: val, immutable: true };
                snap(`Pool Miss → Create "${val}"`, `"${val}" not in pool. Allocated at ${addr}.`, 'First-time literal → new pool object.', `1 new object: ${addr}`, { highlight: addr });
            } else {
                snap(`Pool Hit → "${val}"`, `"${val}" already in pool at ${pool[val]}. Reusing!`, 'String interning deduplicates literals.', 'Zero new objects.', { highlight: pool[val], sharedRef: pool[val] });
            }
            stack[name] = pool[val];
            vars[name] = { type: 'String', addr: pool[val], value: val };
            snap(`${name} → ${pool[val]}`, `Stack variable ${name} references pool object ${pool[val]}.`, 'Stack holds references, not copies.', `1 stack ref added.`, { highlight: pool[val] });
            continue;
        }

        // ── String x = new String("literal").intern()
        const newIntern = line.match(/^String\s+(\w+)\s*=\s*new\s+String\s*\(\s*"([^"]+)"\s*\)\.intern\(\)$/);
        if (newIntern) {
            const [, name, val] = newIntern;
            const heapAddr = ADDR(heapSeq);
            heapSeq += 0x20;
            heap[heapAddr] = { type: 'String (Heap)', value: val, immutable: true };
            stack[name] = heapAddr;
            snap(`new String("${val}") on Heap`, `Heap object created at ${heapAddr}. Pool bypassed by explicit new.`, 'new keyword always creates a fresh heap object.', `1 heap object: ${heapAddr}`, { highlight: heapAddr });
            snap(`.intern() called`, `intern() checks pool for "${val}". Moving reference to pool.`, 'intern() canonicalizes strings, enabling == equality.', 'Heap duplicate becomes GC-eligible.', { internCheck: heapAddr });
            if (!pool[val]) {
                const pAddr = ADDR(poolSeq);
                poolSeq += 0x10;
                pool[val] = pAddr;
                heap[pAddr] = { type: 'String (Pool)', value: val, immutable: true };
            }
            delete heap[heapAddr];
            stack[name] = pool[val];
            vars[name] = { type: 'String', addr: pool[val], value: val };
            snap(`${name} → Pool ${pool[val]}`, `${name} now references pool object. Heap copy GC'd.`, 'intern() deduplicates across the JVM.', 'Net: 0 heap objects. 1 pool object.', { highlight: pool[val] });
            continue;
        }

        // ── x = x + "more"  (String concat)
        const concat = line.match(/^(\w+)\s*=\s*(\w+)\s*\+\s*"([^"]+)"$/);
        if (concat) {
            const [, lhs, src, extra] = concat;
            if (vars[src] && vars[src].type === 'String') {
                const oldVal = vars[src].value;
                const newVal = oldVal + extra;
                const oldAddr = vars[src].addr;
                snap(`Concat: ${src} + "${extra}"`, `String is immutable — "${oldVal}" CANNOT be changed in place.`, 'Strings in Java are final — every byte is fixed after creation.', 'JVM must allocate a brand-new object.', { stale: oldAddr, concat: true });
                const nAddr = ADDR(heapSeq);
                heapSeq += 0x20;
                heap[nAddr] = { type: 'String (Heap)', value: newVal, immutable: true, isNew: true };
                snap(`Old Object Untouched`, `"${oldVal}" still exists at ${oldAddr}. Unchanged.`, 'Immutability guarantee keeps old value safe.', 'Memory holds BOTH objects temporarily.', { stale: oldAddr });
                stack[lhs] = nAddr;
                vars[lhs] = { type: 'String', addr: nAddr, value: newVal };
                snap(`${lhs} → ${nAddr} "${newVal}"`, `Stack pointer ${lhs} reassigned to new object.`, 'The variable changes; the original object does not.', `2 objects (old eligible for GC).`, { highlight: nAddr });
            }
            continue;
        }

        // ── StringBuilder sb = new StringBuilder("val")
        const sbNew = line.match(/^StringBuilder\s+(\w+)\s*=\s*new\s+StringBuilder\s*\(\s*"([^"]*)"\s*\)$/);
        if (sbNew) {
            const [, name, val] = sbNew;
            const addr = ADDR(heapSeq);
            heapSeq += 0x20;
            const cap = Math.max(16, val.length + 16);
            const chars = Array.from(val).concat(Array(cap - val.length).fill(''));
            heap[addr] = { type: 'StringBuilder', value: val, capacity: cap, length: val.length, chars, mutable: true };
            stack[name] = addr;
            vars[name] = { type: 'StringBuilder', addr, value: val, capacity: cap };
            snap(`new StringBuilder("${val}")`, `StringBuilder at ${addr}. capacity=${cap}, length=${val.length}.`, 'StringBuilder lives on heap, not pool. Mutable!', `char[${cap}] allocated. ${cap - val.length} slots free.`, { highlight: addr });
            continue;
        }

        // ── StringBuffer sb = new StringBuffer("val")
        const bufNew = line.match(/^StringBuffer\s+(\w+)\s*=\s*new\s+StringBuffer\s*\(\s*"([^"]*)"\s*\)$/);
        if (bufNew) {
            const [, name, val] = bufNew;
            const addr = ADDR(heapSeq);
            heapSeq += 0x20;
            const cap = Math.max(16, val.length + 16);
            heap[addr] = { type: 'StringBuffer', value: val, capacity: cap, length: val.length, mutable: true, locked: false };
            stack[name] = addr;
            vars[name] = { type: 'StringBuffer', addr, value: val, capacity: cap };
            snap(`new StringBuffer("${val}")`, `StringBuffer at ${addr}. Synchronized methods enabled.`, 'StringBuffer = StringBuilder + monitor lock on every write.', 'Slightly slower due to synchronization overhead.', { highlight: addr });
            continue;
        }

        // ── sb.append("val")
        const append = line.match(/^(\w+)\.append\s*\(\s*"([^"]*)"\s*\)$/);
        if (append) {
            const [, name, extra] = append;
            if (vars[name] && (vars[name].type === 'StringBuilder' || vars[name].type === 'StringBuffer')) {
                const v = vars[name];
                const addr = v.addr;
                const obj = heap[addr];
                const newVal = v.value + extra;
                const needed = newVal.length;

                if (v.type === 'StringBuffer') {
                    heap[addr].locked = true;
                    snap(`🔒 LOCK ACQUIRED (${name})`, `Monitor lock acquired on ${name} before mutation.`, "StringBuffer's methods are synchronized — prevents race conditions.", 'All other threads block until unlock.', { lock: true, highlight: addr });
                    if (needed > v.capacity) {
                        const newCap = v.capacity * 2 + 2;
                        heap[addr].capacity = newCap;
                        v.capacity = newCap;
                        snap(`Capacity Expanded: ${v.capacity - extra.length} → ${newCap}`, `Buffer full! Old cap=${v.capacity - extra.length}. New cap=(old*2)+2=${newCap}.`, 'Java arrays are fixed. Must copy to larger array.', `Old char[] GC'd. New char[${newCap}] allocated.`, { overflow: true, highlight: addr, lock: true });
                    }
                    heap[addr].value = newVal;
                    heap[addr].length = needed;
                    vars[name].value = newVal;
                    snap(`Append "${extra}" Complete`, `${name} now holds "${newVal}" — same object, same address.`, 'In-place mutation inside synchronized block.', '0 new objects created.', { highlight: addr, lock: true });
                    heap[addr].locked = false;
                    snap(`🔓 LOCK RELEASED (${name})`, `Monitor released. ${name} is "${newVal}".`, 'Other threads may now access the buffer.', `StringBuffer slower than StringBuilder by ~10-30%.`, { unlock: true, highlight: addr });
                } else {
                    // StringBuilder
                    if (needed > v.capacity) {
                        const newCap = v.capacity * 2 + 2;
                        heap[addr].capacity = newCap;
                        v.capacity = newCap;
                        const newChars = Array.from(newVal).concat(Array(newCap - needed).fill(''));
                        heap[addr].chars = newChars;
                        snap(`⚠️ Overflow Detected`, `Need ${needed} chars, capacity=${v.capacity - extra.length}. Growing buffer!`, 'char[] is fixed-size. Must reallocate.', `New capacity = (old*2)+2 = ${newCap}.`, { overflow: true });
                        snap(`Buffer Resized → cap=${newCap}`, `New char[${newCap}] created. Old array GC'd.`, 'Amortized growth keeps future resizes rare.', `${needed} chars used, ${newCap - needed} slots free.`, { resized: true, highlight: addr });
                    } else {
                        const newChars = Array.from(newVal).concat(Array(v.capacity - needed).fill(''));
                        heap[addr].chars = newChars;
                    }
                    heap[addr].value = newVal;
                    heap[addr].length = needed;
                    vars[name].value = newVal;
                    snap(`${name}.append("${extra}")`, `SAME object at ${addr} now holds "${newVal}".`, 'StringBuilder mutates in-place — no new allocation.', `0 new objects. Efficient for loops.`, { highlight: addr });
                }
            }
            continue;
        }
    }

    if (steps.length <= 1) {
        snap('No Operations', 'No recognized string operations found in your code.', 'Supported: String literal, concat (+), new StringBuilder/StringBuffer, .append(), .intern()', 'Try a preset or check the syntax hints.');
    }

    return steps;
}

// ─── CHAR ARRAY VIZ ──────────────────────────────────────────────────────────
function CharArray({ chars, capacity }) {
    if (!chars) return null;
    return (
        <div style={{ marginTop: '0.6rem' }}>
            <div style={{ fontSize: '0.58rem', fontWeight: 900, opacity: 0.45, marginBottom: '0.3rem', letterSpacing: '0.08em' }}>
                char[] capacity={capacity}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                {chars.map((c, i) => (
                    <motion.div key={i} animate={{ background: c ? '#bfdbfe' : 'transparent', borderColor: c ? '#3b82f6' : 'rgba(0,0,0,0.12)' }}
                        style={{
                            width: 20, height: 20, border: '1.5px solid', borderRadius: 3,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.58rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
                            color: c ? '#1d4ed8' : '#94a3b8', transition: 'all 0.3s'
                        }}>
                        {c || '·'}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// ─── MEMORY CELL ─────────────────────────────────────────────────────────────
function MemoryCell({ addr, obj, highlightAddr, staleAddr, sharedAddr }) {
    const isH = highlightAddr === addr;
    const isS = staleAddr === addr;
    const isSh = sharedAddr === addr;
    let bg = '#f8fafc', border = '#e2e8f0', glow = 'none';
    if (isS) { bg = '#fef2f2'; border = '#f87171'; glow = '0 0 8px #fca5a5'; }
    else if (isSh || obj.locked) { bg = '#fefce8'; border = '#fbbf24'; glow = '0 0 10px #fde68a'; }
    else if (isH) { bg = '#eff6ff'; border = '#3b82f6'; glow = '0 0 12px #93c5fd'; }
    else if (obj.isNew) { bg = '#f0fdf4'; border = '#4ade80'; }
    const typeColor = obj.type?.includes('Pool') ? '#7c3aed' : obj.type?.includes('Buffer') ? '#ea580c' : obj.type?.includes('Builder') ? '#0891b2' : '#64748b';
    return (
        <motion.div layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0, boxShadow: glow !== 'none' ? glow : '2px 2px 0 #cbd5e1' }}
            style={{ border: `2px solid ${border}`, borderRadius: 10, padding: '0.6rem 0.8rem', background: bg, marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 900, color: typeColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{obj.type}</span>
                <span style={{ fontSize: '0.62rem', opacity: 0.45 }}>{addr}</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>"{obj.value}"</div>
            {obj.mutable && <div style={{ fontSize: '0.58rem', color: '#0891b2', marginTop: '0.2rem', fontWeight: 700 }}>✏ MUTABLE · len={obj.length}</div>}
            {obj.locked && <div style={{ fontSize: '0.58rem', color: '#b45309', marginTop: '0.2rem', fontWeight: 700 }}>🔒 SYNCHRONIZED</div>}
            {isS && <div style={{ fontSize: '0.58rem', color: '#ef4444', marginTop: '0.2rem', fontWeight: 700 }}>💀 STALE — GC eligible</div>}
            {obj.isNew && !isS && <div style={{ fontSize: '0.58rem', color: '#16a34a', marginTop: '0.2rem', fontWeight: 700 }}>✨ NEWLY CREATED</div>}
            {obj.chars && <CharArray chars={obj.chars} capacity={obj.capacity} />}
        </motion.div>
    );
}

// ─── MEMORY VISUALIZER (Center) ───────────────────────────────────────────────
function MemoryViz({ step }) {
    if (!step) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.75rem', opacity: 0.25 }}>
            <div style={{ fontSize: '3rem' }}>🧵</div>
            <div style={{ fontWeight: 800, fontSize: '1rem' }}>Select a scenario & press START</div>
        </div>
    );

    const { heapState, poolState, stackState, action: act } = step;
    const stackEntries = Object.entries(stackState || {});
    const heapEntries = Object.entries(heapState || {});
    const poolEntries = Object.entries(poolState || {});
    const poolVals = Object.keys(poolState || {});
    const poolAddrs = Object.values(poolState || {});

    // filter heap to hide pool-aliased objects shown in pool section
    const heapOnly = heapEntries.filter(([addr]) => !poolAddrs.includes(addr));

    return (
        <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', height: '100%', gap: 0, overflow: 'hidden' }}>

            {/* STACK */}
            <div style={{ background: '#faf5ff', borderBottom: '2.5px solid #e2e8f0', padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                    📦 Stack — References
                </div>
                {stackEntries.length === 0
                    ? <div style={{ opacity: 0.25, fontStyle: 'italic', fontSize: '0.75rem' }}>No variables yet</div>
                    : <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {stackEntries.map(([name, addr]) => {
                            const isPoolRef = poolAddrs.includes(addr);
                            const isShared = act?.sharedRef === addr;
                            return (
                                <motion.div key={name} layout initial={{ x: -12, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.6rem',
                                        background: isShared ? '#dcfce7' : isPoolRef ? '#f3e8ff' : '#eff6ff',
                                        border: `2px solid ${isShared ? '#4ade80' : isPoolRef ? '#a78bfa' : '#93c5fd'}`,
                                        borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: '0.72rem'
                                    }}>
                                    <span style={{ fontWeight: 900, color: '#7c3aed' }}>{name}</span>
                                    <span style={{ opacity: 0.4, fontSize: '0.65rem' }}>→</span>
                                    <span style={{ fontWeight: 700, color: '#2563eb' }}>{addr}</span>
                                    {isPoolRef && <span style={{ fontSize: '0.55rem', color: '#7c3aed', fontWeight: 800 }}>POOL</span>}
                                    {isShared && <span style={{ fontSize: '0.55rem', color: '#16a34a', fontWeight: 800 }}>SHARED</span>}
                                </motion.div>
                            );
                        })}
                    </div>
                }
                {act?.poolCheck && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.7] }} transition={{ duration: 0.8, repeat: Infinity }}
                        style={{ marginTop: '0.5rem', fontSize: '0.68rem', fontWeight: 700, color: '#8b5cf6' }}>
                        🔍 Pool lookup for "{act.poolCheck}"…
                    </motion.div>
                )}
            </div>

            {/* HEAP */}
            <div style={{ padding: '0.75rem 1rem', overflow: 'auto', borderBottom: '2.5px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#0891b2', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                    🏗 Heap — Mutable Objects
                </div>
                {heapOnly.length === 0
                    ? <div style={{ opacity: 0.2, fontStyle: 'italic', fontSize: '0.75rem' }}>No heap objects</div>
                    : heapOnly.map(([addr, obj]) => (
                        <MemoryCell key={addr} addr={addr} obj={obj}
                            highlightAddr={act?.highlight}
                            staleAddr={act?.stale}
                            sharedAddr={act?.sharedRef} />
                    ))
                }
                {act?.concat && heapOnly.length === 0 && (
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }}
                        style={{ fontSize: '0.75rem', color: '#ea580c', fontWeight: 700 }}>⚙ Constructing new String object…</motion.div>
                )}
            </div>

            {/* STRING POOL */}
            <div style={{ background: '#f0fdf4', padding: '0.75rem 1rem', overflow: 'auto' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 900, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                    🌊 String Pool — Intern Table
                </div>
                {poolEntries.length === 0
                    ? <div style={{ opacity: 0.25, fontStyle: 'italic', fontSize: '0.75rem' }}>Empty</div>
                    : <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        <AnimatePresence>
                            {poolEntries.map(([val, addr]) => (
                                <motion.div key={val} layout initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}
                                    style={{
                                        padding: '0.35rem 0.65rem', background: '#dcfce7',
                                        border: `2px solid ${act?.highlight === addr ? '#22c55e' : '#86efac'}`,
                                        borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                                        boxShadow: act?.highlight === addr ? '0 0 10px #86efac' : 'none'
                                    }}>
                                    <span style={{ fontWeight: 800, color: '#166534' }}>"{val}"</span>
                                    <span style={{ opacity: 0.4, margin: '0 0.3rem' }}>@</span>
                                    <span style={{ color: '#2563eb', fontWeight: 700 }}>{addr}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                }
            </div>
        </div>
    );
}

// ─── LEFT PANEL: Code Editor + Scenario Selector ─────────────────────────────
function LeftPanel({ code, onCodeChange, scenarioId, onScenarioSelect, isRunning }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', overflow: 'hidden' }}>
            {/* Preset tabs */}
            <div>
                <div style={{ fontSize: '0.58rem', fontWeight: 900, opacity: 0.45, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Presets</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {PRESETS.map(p => (
                        <button key={p.id} onClick={() => onScenarioSelect(p.id)} disabled={isRunning}
                            title={p.label}
                            style={{
                                padding: '0.25rem 0.55rem', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                                border: `2px solid ${scenarioId === p.id ? p.color : 'var(--border)'}`,
                                background: scenarioId === p.id ? p.color : 'var(--white)',
                                color: scenarioId === p.id ? 'white' : 'var(--text)',
                                transition: 'all 0.15s', opacity: isRunning ? 0.5 : 1
                            }}>
                            {p.icon} {p.badge}
                        </button>
                    ))}
                </div>
            </div>

            {/* Code Editor */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ fontSize: '0.58rem', fontWeight: 900, opacity: 0.45, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Code Editor</span>
                    <span style={{ color: '#10b981' }}>✎ editable</span>
                </div>
                <textarea
                    value={code}
                    onChange={e => onCodeChange(e.target.value)}
                    spellCheck={false}
                    style={{
                        flex: 1, resize: 'none', outline: 'none',
                        background: '#0f172a', color: '#7dd3fc',
                        fontFamily: 'var(--font-mono)', fontSize: '0.72rem', lineHeight: 1.65,
                        padding: '0.75rem', border: '2px solid #334155', borderRadius: 8,
                        border: scenarioId === 'custom' ? '2px solid #f59e0b' : '2px solid #334155',
                    }}
                />
                {scenarioId === 'custom' && (
                    <div style={{ fontSize: '0.6rem', color: '#f59e0b', fontWeight: 700, marginTop: '0.3rem' }}>
                        📝 Custom mode — edit code above, then press START
                    </div>
                )}
            </div>

            {/* Syntax reference */}
            <div style={{ fontSize: '0.62rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', lineHeight: 1.7, opacity: 0.65 }}>
                <div style={{ fontWeight: 900, marginBottom: '0.2rem' }}>Supported Syntax:</div>
                <code style={{ display: 'block', fontSize: '0.6rem', lineHeight: 1.6 }}>
                    {`String x = "val";\nx = x + "more";\nnew StringBuilder("val")\nnew StringBuffer("val")\nsb.append("val");\nnew String("v").intern();`}
                </code>
            </div>
        </div>
    );
}

// ─── RIGHT PANEL: Learning Lab ────────────────────────────────────────────────
function RightPanel({ step }) {
    const noStep = !step || step.phase === 'Ready';

    const infoBlocks = [
        {
            num: '1️⃣', label: 'What Happened', color: '#3b82f6',
            content: noStep ? 'Press START to begin the simulation.' : step.explanation
        },
        {
            num: '2️⃣', label: 'Why It Happened', color: '#8b5cf6',
            content: noStep ? '—' : step.why
        },
        {
            num: '3️⃣', label: 'Memory Impact', color: '#10b981',
            content: noStep ? '—' : step.impact
        },
    ];

    const act = step?.action || {};
    const badges = [
        act.lock && { bg: '#fef9c3', border: '#ca8a04', icon: '🔒', title: 'LOCK ACQUIRED', sub: 'Other threads are BLOCKED', color: '#92400e' },
        act.unlock && { bg: '#dcfce7', border: '#16a34a', icon: '🔓', title: 'LOCK RELEASED', sub: 'Other threads may now proceed', color: '#166534' },
        act.overflow && { bg: '#fef2f2', border: '#ef4444', icon: '💥', title: 'CAPACITY EXCEEDED', sub: 'New array = (old×2)+2', color: '#991b1b' },
        act.resized && { bg: '#f0fdf4', border: '#22c55e', icon: '📈', title: 'BUFFER RESIZED', sub: 'Old array GC\'d, new one adopted', color: '#166534' },
        act.sharedRef && { bg: '#eff6ff', border: '#3b82f6', icon: '🔗', title: 'SHARED REFERENCE', sub: 'Same pool object, two variables!', color: '#1e40af' },
        act.internCheck && { bg: '#fdf4ff', border: '#a855f7', icon: '♻️', title: 'INTERN() CALLED', sub: 'Deduplicating to pool…', color: '#7e22ce' },
        act.concat && { bg: '#fff7ed', border: '#f97316', icon: '🔒→📦', title: 'IMMUTABLE STRING', sub: 'New object MUST be created', color: '#9a3412' },
    ].filter(Boolean);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', height: '100%', overflowY: 'auto' }}>
            {infoBlocks.map(b => (
                <div key={b.label} style={{ border: '2px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{ background: b.color, padding: '0.4rem 0.7rem', fontSize: '0.62rem', fontWeight: 900, color: 'white', letterSpacing: '0.04em' }}>
                        {b.num} {b.label}
                    </div>
                    <div style={{ padding: '0.65rem 0.75rem', fontSize: '0.78rem', lineHeight: 1.58, fontWeight: 500 }}>
                        {b.content}
                    </div>
                </div>
            ))}

            <AnimatePresence>
                {badges.map((badge, i) => (
                    <motion.div key={badge.title} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
                        style={{ background: badge.bg, border: `2px solid ${badge.border}`, borderRadius: 10, padding: '0.65rem 0.8rem', textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontSize: '1.4rem' }}>{badge.icon}</div>
                        <div style={{ fontWeight: 900, fontSize: '0.72rem', color: badge.color, marginTop: '0.25rem' }}>{badge.title}</div>
                        <div style={{ fontSize: '0.62rem', opacity: 0.65, marginTop: '0.15rem' }}>{badge.sub}</div>
                    </motion.div>
                ))}
            </AnimatePresence>

            <div style={{ marginTop: 'auto', padding: '0.5rem 0.6rem', border: '1px dashed rgba(0,0,0,0.12)', borderRadius: 8, fontSize: '0.65rem', lineHeight: 1.5, flexShrink: 0 }}>
                <strong>Phase:</strong> {step?.phase || 'Standby'}
            </div>
        </div>
    );
}

// ─── CONFIG MODE LANDING ──────────────────────────────────────────────────────
function ConfigLanding({ code, onCodeChange, scenarioId, onScenarioSelect, onLaunch }) {
    return (
        <div className="main-content">
            <div style={{ marginBottom: '0.5rem' }}>
                <Link to="/oops" style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← OOP Module</Link>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>🧵 String Internals & Mutability</h1>
            <p style={{ opacity: 0.6, fontSize: '0.95rem', marginBottom: '2rem', maxWidth: '600px', lineHeight: 1.6 }}>
                Step through how <strong>String</strong>, <strong>StringBuilder</strong>, and <strong>StringBuffer</strong> live in memory.
                Pick a preset or write your own code — then watch the simulation.
            </p>

            {/* Preset grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
                {PRESETS.map(p => (
                    <button key={p.id} onClick={() => onScenarioSelect(p.id)}
                        style={{
                            textAlign: 'left', padding: '0.75rem 0.9rem', borderRadius: 12, cursor: 'pointer',
                            border: `2.5px solid ${scenarioId === p.id ? p.color : 'var(--border)'}`,
                            background: scenarioId === p.id ? p.color + '18' : 'var(--white)',
                            transition: 'all 0.15s', boxShadow: scenarioId === p.id ? `3px 3px 0 ${p.color}66` : '2px 2px 0 var(--border)'
                        }}>
                        <div style={{ fontSize: '1.3rem', marginBottom: '0.35rem' }}>{p.icon}</div>
                        <div style={{ fontWeight: 800, fontSize: '0.82rem', color: scenarioId === p.id ? p.color : 'var(--text)' }}>{p.label}</div>
                        <div style={{ fontSize: '0.68rem', opacity: 0.55, marginTop: '0.2rem', fontWeight: 500 }}>{p.badge}</div>
                        {p.id === 'custom' && <div style={{ fontSize: '0.6rem', color: '#f59e0b', marginTop: '0.3rem', fontWeight: 700 }}>✎ write your own</div>}
                    </button>
                ))}
            </div>

            {/* Code editor */}
            <div style={{ background: 'var(--white)', border: '3px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: '1.5rem', boxShadow: '4px 4px 0 var(--border)' }}>
                <div style={{ background: '#0f172a', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#7dd3fc', letterSpacing: '0.1em' }}>CODE EDITOR — JAVA</span>
                    <span style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 700 }}>✎ editable</span>
                </div>
                <textarea
                    value={code}
                    onChange={e => onCodeChange(e.target.value)}
                    spellCheck={false}
                    rows={8}
                    style={{
                        width: '100%', resize: 'vertical', outline: 'none',
                        background: '#0f172a', color: '#a5f3fc',
                        fontFamily: 'var(--font-mono)', fontSize: '0.82rem', lineHeight: 1.7,
                        padding: '1rem', border: 'none',
                        borderTop: scenarioId === 'custom' ? '2px solid #f59e0b' : 'none',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            <button className="btn btn-yellow btn-lg" onClick={onLaunch} style={{ padding: '1rem 2.5rem', fontSize: '1rem' }}>
                🚀 LAUNCH SIMULATOR
            </button>
        </div>
    );
}

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────
export default function StringMutabilitySim() {
    const defaultScenario = PRESETS[0];
    const [scenarioId, setScenarioId] = useState(defaultScenario.id);
    const [code, setCode] = useState(defaultScenario.code);
    const [speed, setSpeed] = useState(1000);
    const [currentStep, setCurrentStep] = useState(-1);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [isSimMode, setIsSimMode] = useState(false);

    const timerRef = useRef(null);
    const stepRef = useRef(-1);

    const steps = buildSteps(code);
    const curStep = currentStep >= 0 ? steps[currentStep] : null;

    const advanceStep = useCallback((idx) => {
        const next = idx + 1;
        if (next >= steps.length) {
            setCurrentStep(next - 1); setIsRunning(false); setIsFinished(true);
            clearInterval(timerRef.current); return;
        }
        setCurrentStep(next); stepRef.current = next;
    }, [steps.length]);

    const handleStart = () => {
        setCurrentStep(-1); stepRef.current = -1;
        setIsRunning(true); setIsPaused(false); setIsFinished(false); setIsSimMode(true);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => advanceStep(stepRef.current), speed);
    };
    const handlePause = () => { setIsRunning(false); setIsPaused(true); clearInterval(timerRef.current); };
    const handleResume = () => { setIsRunning(true); setIsPaused(false); timerRef.current = setInterval(() => advanceStep(stepRef.current), speed); };
    const handleReset = () => { clearInterval(timerRef.current); setCurrentStep(-1); stepRef.current = -1; setIsRunning(false); setIsPaused(false); setIsFinished(false); setIsSimMode(false); };
    const handleStep = () => { setIsSimMode(true); advanceStep(stepRef.current); };

    const handleScenarioSelect = (id) => {
        handleReset();
        setScenarioId(id);
        setCode(PRESETS.find(p => p.id === id).code);
    };

    const handleCodeChange = (val) => {
        setCode(val);
        setScenarioId('custom');
        handleReset();
    };

    const LEFT = <LeftPanel code={code} onCodeChange={handleCodeChange} scenarioId={scenarioId} onScenarioSelect={handleScenarioSelect} isRunning={isRunning} />;
    const RIGHT = <RightPanel step={curStep} />;
    const CENTER = <MemoryViz step={curStep} />;

    return (
        <ImmersiveLayout
            isActive={isSimMode}
            title="String Internals"
            icon="🧵"
            moduleLabel="OOP Module"
            isRunning={isRunning}
            isPaused={isPaused}
            isFinished={isFinished}
            speed={speed}
            onSpeedChange={setSpeed}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onReset={handleReset}
            onStep={handleStep}
            currentStepNum={Math.max(0, currentStep + 1)}
            totalSteps={steps.length}
            phaseName={curStep?.phase ?? 'Standby'}
            centerContent={CENTER}
            leftContent={LEFT}
            rightContent={RIGHT}
            timelineItems={steps.map((s, i) => ({ id: i, label: s.phase, done: i < currentStep, active: i === currentStep }))}
            legend={[
                { color: '#7c3aed', label: 'Pool Object' },
                { color: '#0891b2', label: 'Heap Object' },
                { color: '#16a34a', label: 'String Pool' },
                { color: '#ef4444', label: 'Stale/GC' },
            ]}
        >
            <ConfigLanding
                code={code}
                onCodeChange={handleCodeChange}
                scenarioId={scenarioId}
                onScenarioSelect={handleScenarioSelect}
                onLaunch={handleStart}
            />
        </ImmersiveLayout>
    );
}
