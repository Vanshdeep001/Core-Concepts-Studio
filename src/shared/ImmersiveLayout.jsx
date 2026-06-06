import { useEffect, useState } from 'react';
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
    onSpeedChange = () => {},
    onStart = () => {},
    onPause = () => {},
    onResume = () => {},
    onReset = () => {},
    onStep = () => {},
    currentStepNum = 0,
    totalSteps = 1,
    phaseName = '',
    centerContent,
    leftContent,
    rightContent,
    timelineItems = [],
    legend = [],
    conceptMode = false,
    onConceptModeToggle = () => {},
    hideFooter = false,
    scenarioPicker = null,
}) {
    const [leftOpen, setLeftOpen] = useState(false);
    const [rightOpen, setRightOpen] = useState(false);

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

                    {/* Scenario Picker (optional) */}
                    {scenarioPicker}

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

                        <button
                            onClick={onReset}
                            style={{
                                marginLeft: '0.5rem', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: '50%', background: 'rgba(0,0,0,0.1)', border: 'none', cursor: 'pointer', fontWeight: 900
                            }}
                        >✕</button>
                    </div>
                </header>

                {/* ─── MAIN CONTENT AREA ─── */}
                <main style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#f8f9fa' }}>

                    {/* LEFT PANEL: System States */}
                    <motion.aside
                        animate={{ width: leftOpen ? '22%' : 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        style={{
                            borderRight: leftOpen ? '3px solid var(--border)' : 'none',
                            display: 'flex', flexDirection: 'column', background: 'var(--white)',
                            overflow: 'hidden', flexShrink: 0,
                        }}
                    >
                        <div style={{
                            padding: '0.75rem 1rem', background: 'var(--cyan)', borderBottom: '3px solid var(--border)',
                            fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
                        }}>
                            <span>System States</span>
                            <button
                                onClick={() => setLeftOpen(false)}
                                title="Collapse System States"
                                style={{
                                    background: 'rgba(0,0,0,0.12)', border: '2px solid var(--border)',
                                    borderRadius: '4px', cursor: 'pointer', fontWeight: 900,
                                    fontSize: '0.7rem', lineHeight: 1, padding: '2px 6px',
                                    display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0
                                }}
                            >
                                ◀ Hide
                            </button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', scrollbarWidth: 'thin' }}>
                            {leftContent}
                        </div>
                    </motion.aside>

                    {/* LEFT COLLAPSED TAB — inline flex strip, pushes center, never overlaps */}
                    <AnimatePresence>
                        {!leftOpen && (
                            <motion.button
                                key="left-tab"
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 32, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                onClick={() => setLeftOpen(true)}
                                title="Expand System States"
                                style={{
                                    flexShrink: 0, height: '100%',
                                    background: 'var(--cyan)',
                                    border: 'none', borderRight: '3px solid var(--border)',
                                    cursor: 'pointer', overflow: 'hidden', padding: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <span style={{
                                    transform: 'rotate(-90deg)',
                                    whiteSpace: 'nowrap',
                                    fontWeight: 800, fontSize: '0.65rem',
                                    textTransform: 'uppercase', letterSpacing: '0.06em',
                                    color: 'var(--text)', pointerEvents: 'none',
                                }}>
                                    System States
                                </span>
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* CENTER PANEL: Primary Visualizer */}
                    <section style={{
                        flex: 1, display: 'flex', flexDirection: 'column',
                        overflow: 'hidden', minWidth: 0,
                        background: 'var(--white)',
                        borderLeft: '1px solid var(--border)',
                        borderRight: '1px solid var(--border)',
                    }}>
                        {centerContent}
                    </section>

                    {/* RIGHT COLLAPSED TAB — inline flex strip, pushes center, never overlaps */}
                    <AnimatePresence>
                        {!rightOpen && (
                            <motion.button
                                key="right-tab"
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 32, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                onClick={() => setRightOpen(true)}
                                title="Expand Learning Lab"
                                style={{
                                    flexShrink: 0, height: '100%',
                                    background: 'var(--pink)',
                                    border: 'none', borderLeft: '3px solid var(--border)',
                                    cursor: 'pointer', overflow: 'hidden', padding: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <span style={{
                                    transform: 'rotate(90deg)',
                                    whiteSpace: 'nowrap',
                                    fontWeight: 800, fontSize: '0.65rem',
                                    textTransform: 'uppercase', letterSpacing: '0.06em',
                                    color: 'var(--text)', pointerEvents: 'none',
                                }}>
                                    Learning Lab
                                </span>
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* RIGHT PANEL: Educational/Explanations */}
                    <motion.aside
                        animate={{ width: rightOpen ? '22%' : 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        style={{
                            borderLeft: rightOpen ? '3px solid var(--border)' : 'none',
                            display: 'flex', flexDirection: 'column', background: 'var(--white)',
                            overflow: 'hidden', flexShrink: 0
                        }}
                    >
                        <div style={{
                            padding: '0.75rem 1rem', background: 'var(--pink)', borderBottom: '3px solid var(--border)',
                            fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
                        }}>
                            <span>Learning Lab</span>
                            <button
                                onClick={() => setRightOpen(false)}
                                title="Collapse Learning Lab"
                                style={{
                                    background: 'rgba(0,0,0,0.12)', border: '2px solid var(--border)',
                                    borderRadius: '4px', cursor: 'pointer', fontWeight: 900,
                                    fontSize: '0.7rem', lineHeight: 1, padding: '2px 6px',
                                    display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0
                                }}
                            >
                                Hide ▶
                            </button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', scrollbarWidth: 'thin' }}>
                            {rightContent}
                        </div>
                    </motion.aside>
                </main>

                {/* ─── BOTTOM BAR (Fixed height: 80px) ─── */}
                {!hideFooter && (
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
                                            <span style={{ opacity: 0.5, marginRight: '0.4rem' }}>#i + 1</span>
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

                        {/* Legend — moved from absolute overlay to footer right */}
                        {legend.length > 0 && (
                            <div style={{
                                flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.75rem',
                                borderLeft: '2px solid var(--border)', paddingLeft: '1rem', height: '100%'
                            }}>
                                {legend.map((l, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                                        <div style={{ width: 12, height: 12, background: l.color, border: '1.5px solid var(--border)', borderRadius: '2px', flexShrink: 0 }} />
                                        {l.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </footer>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
