import { AnimatePresence, motion } from 'framer-motion';

export default function RunningProcessDisplay({ runningProcess, lastPreemption, algorithm, quantumRemaining, quantum }) {
    const isRR = algorithm === 'RR' || algorithm === 'MLFQ';

    return (
        <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6, marginBottom: '0.5rem' }}>
                CPU Executing
            </div>

            <AnimatePresence mode="wait">
                {runningProcess ? (
                    <motion.div
                        key={runningProcess.id}
                        initial={{ opacity: 0, scale: 0.92, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: -8 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div style={{
                            background: runningProcess.color,
                            border: '3px solid var(--border)',
                            boxShadow: '5px 5px 0 var(--border)',
                            padding: '0.75rem 1rem',
                            position: 'relative',
                        }}>
                            {/* Preemption flash */}
                            <AnimatePresence>
                                {lastPreemption && (
                                    <motion.div
                                        key="preempted"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.1 }}
                                        style={{
                                            position: 'absolute', inset: 0,
                                            background: 'rgba(229,62,62,0.25)',
                                            border: '3px solid #e53e3e',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            pointerEvents: 'none', zIndex: 2,
                                        }}
                                    >
                                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#e53e3e', letterSpacing: '0.1em' }}>
                                            PREEMPTED
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div style={{ fontWeight: 700, fontSize: '1.5rem', fontFamily: 'var(--font-mono)' }}>
                                {runningProcess.id}
                            </div>
                            <div style={{ fontSize: '0.78rem', display: 'flex', gap: '1rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                                <span><strong>Remaining:</strong> {runningProcess.remainingTime}</span>
                                <span><strong>Priority:</strong> {runningProcess.priority}</span>
                                {isRR && quantumRemaining > 0 && (
                                    <span style={{ background: 'rgba(0,0,0,0.1)', padding: '0 0.35rem', fontFamily: 'var(--font-mono)' }}>
                                        ⏱ {quantumRemaining}/{quantum}
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            border: '3px dashed var(--border)',
                            padding: '0.75rem 1rem',
                            background: 'rgba(0,0,0,0.03)',
                            color: 'var(--text)', opacity: 0.45,
                            fontStyle: 'italic', fontSize: '0.88rem',
                        }}
                    >
                        CPU Idle
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
