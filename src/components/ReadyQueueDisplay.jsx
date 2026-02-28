import { AnimatePresence, motion } from 'framer-motion';

export default function ReadyQueueDisplay({ readyQueue = [], currentTime }) {
    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>
                    Ready Queue
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', background: 'var(--yellow)', padding: '0.1rem 0.45rem', border: '2px solid var(--border)', fontWeight: 700 }}>
                    {readyQueue.length} waiting
                </span>
            </div>

            <div style={{
                display: 'flex', gap: '0.4rem', flexWrap: 'wrap',
                minHeight: 42, alignItems: 'center',
                padding: '0.4rem',
                background: 'rgba(0,0,0,0.04)',
                border: '2px dashed var(--border)',
            }}>
                <AnimatePresence mode="popLayout">
                    {readyQueue.length === 0 ? (
                        <motion.span
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ fontSize: '0.78rem', opacity: 0.4, fontStyle: 'italic' }}
                        >
                            empty
                        </motion.span>
                    ) : (
                        readyQueue.map((proc, i) => (
                            <motion.div
                                key={proc.id}
                                layoutId={`queue-${proc.id}`}
                                initial={{ opacity: 0, scale: 0.7, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.7, x: -20 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                style={{
                                    background: proc.color,
                                    border: '2px solid var(--border)',
                                    padding: '0.25rem 0.55rem',
                                    fontWeight: 700, fontSize: '0.82rem',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    minWidth: 44, cursor: 'default',
                                    boxShadow: '2px 2px 0 var(--border)',
                                }}
                                title={`${proc.id} — Remaining: ${proc.remainingTime}`}
                            >
                                <span>{proc.id}</span>
                                <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>
                                    r={proc.remainingTime}
                                </span>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
