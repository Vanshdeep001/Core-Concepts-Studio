// GitTerminal.jsx — Interactive command input panel with clickable command groups
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COMMAND_GROUPS } from './engine/gitEngine';

export default function GitTerminal({ onCommand, disabled, isMobile }) {
    const [selectedGroup, setSelectedGroup] = useState(0);
    const [argValues, setArgValues] = useState({});
    const [selectedCmd, setSelectedCmd] = useState(null);

    const group = COMMAND_GROUPS[selectedGroup];

    function handleRun(cmdDef) {
        const args = {};
        (cmdDef.argsSchema || []).forEach(schema => {
            const val = argValues[`${cmdDef.cmd}_${schema.key}`];
            if (schema.type === 'checkbox') {
                args[schema.key] = !!val;
            } else {
                args[schema.key] = val !== undefined ? val : (schema.default || '');
            }
        });

        // Special handling for git reset hash — if blank, use prev commit
        if (cmdDef.cmd === 'git reset' && !args.hash) {
            args.hash = null; // engine will use prev commit
        }

        onCommand(cmdDef.cmd, args);
        setArgValues({}); // reset args after run
    }

    function handleArgChange(cmdKey, argKey, value) {
        setArgValues(prev => ({ ...prev, [`${cmdKey}_${argKey}`]: value }));
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

            {/* Group tabs */}
            <div style={{
                display: 'flex', gap: isMobile ? '0.2rem' : '0.3rem', padding: isMobile ? '0.35rem 0.5rem' : '0.5rem 0.75rem',
                background: '#f8f9fa', borderBottom: '2px solid var(--border)',
                overflowX: 'auto', flexShrink: 0,
                WebkitOverflowScrolling: 'touch',
            }}>
                {COMMAND_GROUPS.map((g, i) => (
                    <button
                        key={g.label}
                        onClick={() => { setSelectedGroup(i); setSelectedCmd(null); }}
                        style={{
                            padding: isMobile ? '0.25rem 0.45rem' : '0.3rem 0.65rem', fontSize: isMobile ? '0.62rem' : '0.7rem', fontWeight: 800,
                            border: '2px solid var(--border)', borderRadius: 6, cursor: 'pointer',
                            background: selectedGroup === i ? g.color : 'var(--white)',
                            flexShrink: 0, transition: 'background 0.15s',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {g.label}
                    </button>
                ))}
            </div>

            {/* Scrollable command controls (buttons + args) — fills the panel
                and scrolls natively when the group's commands overflow. */}
            <div style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
            }}>

            {/* Command Buttons */}
            <div style={{
                padding: isMobile ? '0.5rem' : '0.75rem', borderBottom: '2px solid var(--border)',
                display: 'flex', flexWrap: 'wrap', gap: isMobile ? '0.25rem' : '0.35rem', flexShrink: 0,
            }}>
                {group.commands.map((cmdDef) => (
                    <button
                        key={cmdDef.cmd}
                        onClick={() => setSelectedCmd(selectedCmd?.cmd === cmdDef.cmd ? null : cmdDef)}
                        disabled={disabled}
                        style={{
                            padding: isMobile ? '0.25rem 0.45rem' : '0.3rem 0.65rem', fontSize: isMobile ? '0.65rem' : '0.72rem', fontWeight: 800,
                            border: `2px solid ${selectedCmd?.cmd === cmdDef.cmd ? '#000' : 'var(--border)'}`,
                            borderRadius: 6, cursor: disabled ? 'not-allowed' : 'pointer',
                            background: selectedCmd?.cmd === cmdDef.cmd ? group.color : 'var(--white)',
                            fontFamily: 'var(--font-mono)',
                            transition: 'all 0.12s',
                            opacity: disabled ? 0.5 : 1,
                        }}
                    >
                        git {cmdDef.label}
                    </button>
                ))}
            </div>

            {/* Args + Run Panel */}
            <AnimatePresence>
                {selectedCmd && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                            padding: isMobile ? '0.5rem' : '0.75rem', borderBottom: '2px solid var(--border)',
                            background: '#fffbea', flexShrink: 0, overflow: 'hidden',
                        }}
                    >
                        <div style={{
                            fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 800,
                            marginBottom: '0.5rem', color: '#444',
                        }}>
                            $ {selectedCmd.cmd}
                            {selectedCmd.argsSchema?.map(s => ` [${s.placeholder || s.key}]`)}
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: isMobile ? 'stretch' : 'flex-end', flexDirection: isMobile ? 'column' : 'row' }}>
                            {(selectedCmd.argsSchema || []).map((schema) => (
                                schema.type === 'checkbox' ? (
                                    <label key={schema.key} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={!!argValues[`${selectedCmd.cmd}_${schema.key}`]}
                                            onChange={e => handleArgChange(selectedCmd.cmd, schema.key, e.target.checked)}
                                        />
                                        {schema.label || schema.key}
                                    </label>
                                ) : (
                                    <input
                                        key={schema.key}
                                        type="text"
                                        placeholder={schema.placeholder}
                                        defaultValue={schema.default || ''}
                                        onChange={e => handleArgChange(selectedCmd.cmd, schema.key, e.target.value)}
                                        style={{
                                            fontFamily: 'var(--font-mono)', fontSize: isMobile ? '0.7rem' : '0.75rem',
                                            padding: '0.3rem 0.5rem', border: '2px solid var(--border)',
                                            borderRadius: 6, outline: 'none', minWidth: isMobile ? 0 : 140,
                                            width: isMobile ? '100%' : 'auto',
                                        }}
                                    />
                                )
                            ))}

                            <button
                                onClick={() => handleRun(selectedCmd)}
                                disabled={disabled}
                                style={{
                                    padding: '0.35rem 0.9rem', fontWeight: 800, fontSize: '0.78rem',
                                    border: '2px solid var(--border)', borderRadius: 6, cursor: 'pointer',
                                    background: group.color, transition: 'transform 0.1s',
                                }}
                                onMouseDown={e => e.currentTarget.style.transform = 'translate(2px,2px)'}
                                onMouseUp={e => e.currentTarget.style.transform = ''}
                            >
                                ▶ Run
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            </div>
        </div>
    );
}
