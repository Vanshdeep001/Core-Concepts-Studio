import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SPEED_OPTIONS } from '../core/SimulationController';

/**
 * ImmersiveLayout — Universal full-screen simulation view.
 *
 * Props:
 *   isActive: bool — if true, render immersive mode; else render children (config mode)
 *   children: JSX — configuration UI (shown when !isActive)
 *   title, icon, moduleLabel, backPath: strings
 *   isRunning, isPaused, isFinished: bool
 *   speed, onSpeedChange: number, fn
 *   onStart, onPause, onResume, onReset, onStep: fns
 *   currentStepNum, totalSteps: numbers (1-based for display)
 *   phaseName: string — shown in top bar
 *   centerContent: JSX — main viz (60%)
 *   leftContent: JSX — state/timeline (20%)
 *   rightContent: JSX — explanation panel (20%)
 *   timelineItems: [{id, label, done, active}] — bottom bar
 *   legend: [{color, label}] — mini legend for bottom bar
 */
export default function ImmersiveLayout({
    isActive,
    children,
    title,
    icon = '⚙',
    moduleLabel,
    isRunning,
    isPaused,
    isFinished,
    speed,
    onSpeedChange,
    onStart,
    onPause,
    onResume,
    onReset,
    onStep,
    currentStepNum = 0,
    totalSteps = 1,
    phaseName = '',
    centerContent,
    leftContent,
    rightContent,
    timelineItems = [],
    legend = [],
    conceptMode = false,
    onConceptModeToggle,
}) {
    // Lock body scroll in simulation mode
    useEffect(() => {
        if (isActive) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, [isActive]);

    if (!isActive) {
        return <>{children}</>;
    }

    const notStarted = !isRunning && !isPaused && !isFinished;
    const progress = totalSteps > 0 ? (currentStepNum / totalSteps) * 100 : 0;

    return (
        <AnimatePresence>
            <motion.div
                key="immersive"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                    position: 'fixed',
                    inset: 0,
                    width: '100vw',
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--bg)',
                    zIndex: 1000,
                    overflow: 'hidden',
                }}
            >
                {/* ─── TOP BAR (Fixed height: 72px) ─── */}
                <header style={{
                    height: 72,
                    flexShrink: 0,
                    background: 'var(--yellow)',
                    borderBottom: '3px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 1.25rem',
                    gap: '1rem',
                    boxShadow: '0 3px 0 var(--border)',
                    zIndex: 10,
                }}>
                    {/* Title & Module */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginRight: '0.5rem' }}>
                        <div style={{
                            width: 40, height: 40, background: 'var(--white)',
                            border: '2px solid var(--border)', borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.4rem', boxShadow: '2px 2px 0 var(--border)'
                        }}>
                            {icon}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)', lineHeight: 1 }}>{title}</span>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>{moduleLabel}</span>
                        </div>
                    </div>

                    <div style={{ width: 2, height: 32, background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />

                    {/* Progress Detail */}
                    <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '1.5rem', minWidth: 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>Current Phase</span>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {phaseName || 'Waiting to start...'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>Step Progress</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.9rem' }}>{currentStepNum}/{totalSteps}</span>
                                <div style={{ width: 120, height: 10, background: 'rgba(0,0,0,0.1)', border: '2px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <motion.div
                                        animate={{ width: `${progress}%` }}
                                        style={{ height: '100%', background: 'var(--text)' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', padding: '0.25rem', borderRadius: '8px', border: '2px solid var(--border)', marginRight: '0.5rem' }}>
                            {notStarted ? (
                                <button className="btn btn-sm" style={{ background: 'var(--green)', color: 'white' }} onClick={onStart}>▶ START</button>
                            ) : (
                                <>
                                    <button className="btn btn-sm" style={{ background: isPaused ? 'var(--green)' : 'var(--white)', minWidth: 40 }} onClick={isPaused ? onResume : onPause}>
                                        {isPaused ? '▶' : '⏸'}
                                    </button>
                                    <button className="btn btn-sm" style={{ background: 'var(--white)', minWidth: 40 }} onClick={onStep} disabled={isFinished}>⏭</button>
                                </>
                            )}
                            <button className="btn btn-sm" style={{ background: 'var(--white)', marginLeft: '0.25rem' }} onClick={onReset}>↺</button>
                        </div>

                        {/* Speed Selection */}
                        <div style={{ display: 'flex', border: '2px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                            {SPEED_OPTIONS.map(opt => (
                                <button key={opt.ms}
                                    onClick={() => onSpeedChange(opt.ms)}
                                    style={{
                                        padding: '0.35rem 0.6rem', fontSize: '0.7rem', fontWeight: 700,
                                        background: speed === opt.ms ? 'var(--cyan)' : 'var(--white)',
                                        border: 'none', borderRight: '1px solid var(--border)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <div style={{ width: 2, height: 32, background: 'rgba(0,0,0,0.1)', margin: '0 0.5rem' }} />

                        {/* Concept Toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>Concept Mode</span>
                            <button
                                onClick={onConceptModeToggle}
                                style={{
                                    width: 44, height: 22, borderRadius: 11, background: conceptMode ? 'var(--green)' : '#ccc',
                                    border: '2px solid var(--border)', position: 'relative', cursor: 'pointer', transition: '0.2s'
                                }}
                            >
                                <motion.div
                                    animate={{ x: conceptMode ? 22 : 2 }}
                                    style={{ width: 14, height: 14, background: 'white', borderRadius: '50%', border: '2px solid var(--border)', position: 'absolute', top: 2 }}
                                />
                            </button>
                        </div>

                        <button
                            onClick={onReset}
                            style={{
                                marginLeft: '0.5rem', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: '50%', background: 'rgba(0,0,0,0.1)', border: 'none', cursor: 'pointer', fontWeight: 900
                            }}
                        >✕</button>
                    </div>
                </header>

                {/* ─── MAIN CONTENT AREA (Grid) ─── */}
                <main style={{ flex: 1, display: 'grid', gridTemplateColumns: '20% 60% 20%', overflow: 'hidden', background: '#f8f9fa' }}>

                    {/* LEFT PANEL: State & Data */}
                    <aside style={{
                        borderRight: '3px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--white)',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: '0.75rem 1rem', background: 'var(--cyan)', borderBottom: '3px solid var(--border)',
                            fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                            📊 System States
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', scrollbarWidth: 'thin' }}>
                            {leftContent}
                        </div>
                    </aside>

                    {/* CENTER PANEL: Primary Visualizer */}
                    <section style={{
                        position: 'relative', display: 'flex', flexDirection: 'column',
                        overflow: 'hidden', padding: '1rem'
                    }}>
                        <div style={{
                            flex: 1, background: 'var(--white)', border: '3px solid var(--border)', borderRadius: '12px',
                            boxShadow: '4px 4px 0 var(--border)', position: 'relative', overflow: 'hidden',
                            display: 'flex', flexDirection: 'column'
                        }}>
                            {centerContent}
                        </div>

                        {/* Legend Overlay */}
                        {legend.length > 0 && (
                            <div style={{
                                position: 'absolute', bottom: '2rem', right: '2rem',
                                background: 'white', border: '2px solid var(--border)', padding: '0.5rem 0.75rem',
                                borderRadius: '8px', boxShadow: '3px 3px 0 var(--border)', display: 'flex', gap: '1rem'
                            }}>
                                {legend.map((l, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700 }}>
                                        <div style={{ width: 12, height: 12, background: l.color, border: '1.5px solid var(--border)', borderRadius: '2px' }} />
                                        {l.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* RIGHT PANEL: Educational/Explanations */}
                    <aside style={{
                        borderLeft: '3px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--white)',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: '0.75rem 1rem', background: 'var(--pink)', borderBottom: '3px solid var(--border)',
                            fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                            📖 Learning Lab
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', scrollbarWidth: 'thin' }}>
                            {rightContent}
                        </div>
                    </aside>
                </main>

                {/* ─── BOTTOM BAR (Fixed height: 80px) ─── */}
                <footer style={{
                    height: 80,
                    flexShrink: 0,
                    background: 'var(--white)',
                    borderTop: '3px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 1rem',
                    overflow: 'hidden',
                    zIndex: 10,
                }}>
                    <div style={{
                        width: 100, flexShrink: 0, fontSize: '0.65rem', fontWeight: 800, opacity: 0.5,
                        textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '2px solid var(--border)',
                        height: '100%', display: 'flex', alignItems: 'center'
                    }}>
                        Execution<br />Timeline
                    </div>

                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0 1.5rem', overflowX: 'auto', height: '100%', scrollbarWidth: 'none'
                    }}>
                        {timelineItems.length > 0 ? (
                            timelineItems.map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                    <motion.div
                                        animate={{ scale: item.active ? 1.05 : 1 }}
                                        style={{
                                            padding: '0.4rem 0.8rem', borderRadius: '6px', border: '2px solid var(--border)',
                                            background: item.active ? 'var(--yellow)' : item.done ? 'var(--green)' : 'var(--white)',
                                            boxShadow: item.active ? '2px 2px 0 var(--border)' : 'none',
                                            fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                                            color: 'var(--text)', transition: 'background 0.3s'
                                        }}
                                    >
                                        <span style={{ opacity: 0.5, marginRight: '0.4rem' }}>#{i + 1}</span>
                                        {item.label}
                                    </motion.div>
                                    {i < timelineItems.length - 1 && (
                                        <div style={{ width: 24, height: 2, background: 'var(--border)', opacity: 0.3 }} />
                                    )}
                                </div>
                            ))
                        ) : (
                            <div style={{ opacity: 0.3, fontStyle: 'italic', fontSize: '0.85rem' }}>Timeline ready for simulation...</div>
                        )}
                    </div>
                </footer>
            </motion.div>
        </AnimatePresence>
    );
}
