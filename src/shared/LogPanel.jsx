import { useEffect, useRef } from 'react';

/**
 * Universal step-by-step execution log panel.
 * Used by all simulators to show explanation text per step.
 */
export default function LogPanel({ logs = [], title = '📋 Execution Log', maxHeight = 260 }) {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs.length]);

    return (
        <div className="panel">
            <div className="panel-header">{title}</div>
            <div
                style={{
                    maxHeight,
                    overflowY: 'auto',
                    padding: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                }}
            >
                {logs.length === 0 ? (
                    <div style={{ opacity: 0.45, fontStyle: 'italic' }}>
                        Start / step the simulation to see the log…
                    </div>
                ) : (
                    logs.map((entry, i) => (
                        <div
                            key={i}
                            style={{
                                borderLeft: '3px solid var(--border)',
                                paddingLeft: '0.6rem',
                                background: i === logs.length - 1 ? 'rgba(102,217,239,0.15)' : 'transparent',
                                transition: 'background 0.3s ease',
                            }}
                        >
                            <span
                                style={{
                                    display: 'inline-block',
                                    background: 'var(--yellow)',
                                    border: '2px solid var(--border)',
                                    padding: '0 0.35rem',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    marginRight: '0.4rem',
                                    lineHeight: 1.6,
                                }}
                            >
                                #{entry.step ?? i + 1}
                            </span>
                            <span style={{ fontWeight: 600 }}>{entry.message}</span>
                            {entry.detail && (
                                <div style={{ opacity: 0.65, paddingLeft: '2.5rem', marginTop: '0.1rem' }}>
                                    {entry.detail}
                                </div>
                            )}
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
