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
    icon = null,
    moduleLabel,
    isRunning,
    isPaused,
    isFinished,
    speed,
    onSpeedChange = () => { },
    onStart = () => { },
    onPause = () => { },
    onResume = () => { },
    onReset = () => { },
    onStep = () => { },
    currentStepNum = 0,
    totalSteps = 1,
    phaseName = '',
    centerContent,
    leftContent,
    rightContent,
    timelineItems = [],
    legend = [],
    conceptMode = false,
    onConceptModeToggle = () => { },
    hideFooter = false,
    scenarioPicker = null,
    hideControls = false,
    snapshotData = null,
}) {
    const [leftOpen, setLeftOpen] = useState(false);
    const [rightOpen, setRightOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleResetAndClearUrl = () => {
        const url = new URL(window.location.href);
        if (url.searchParams.has('snapshot')) {
            url.searchParams.delete('snapshot');
            window.history.replaceState({}, '', url.pathname + url.search);
        }
        onReset();
    };

    const handleShareSnapshot = () => {
        if (!snapshotData) return;
        try {
            const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(snapshotData))));
            const url = new URL(window.location.href);
            url.searchParams.set('snapshot', encoded);
            navigator.clipboard.writeText(url.toString()).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        } catch (e) {
            console.error("Failed to copy snapshot url:", e);
        }
    };

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
                className="immersive-layout-container"
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
                <header className="immersive-header" style={{
                    height: isMobile ? 'auto' : 72,
                    flexShrink: 0,
                    background: 'var(--yellow)',
                    borderBottom: '3px solid var(--border)',
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'stretch' : 'center',
                    padding: isMobile ? '0.6rem 0.8rem' : '0 1.25rem',
                    gap: isMobile ? '0.5rem' : '1rem',
                    boxShadow: '0 3px 0 var(--border)',
                    zIndex: 10,
                }}>
                    {isMobile ? (
                        <>
                            {/* Mobile Layout */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="immersive-brand-group" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    {icon && (
                                        <div style={{
                                            width: 34, height: 34, background: 'var(--white)',
                                            border: '2px solid var(--border)', borderRadius: '6px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.1rem', boxShadow: '2px 2px 0 var(--border)', flexShrink: 0
                                        }}>
                                            {icon}
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.1 }}>{title}</span>
                                        <span style={{ fontSize: '0.55rem', fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.1rem' }}>{moduleLabel}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    {snapshotData && (
                                        <button
                                            onClick={handleShareSnapshot}
                                            style={{
                                                background: copied ? 'var(--green)' : 'var(--white)',
                                                color: copied ? 'white' : 'var(--text)',
                                                border: '2px solid var(--border)',
                                                borderRadius: '6px',
                                                height: 30,
                                                padding: '0 0.5rem',
                                                fontSize: '0.65rem',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.2rem',
                                                boxShadow: '1px 1px 0 var(--border)',
                                                transition: 'all 0.1s',
                                                boxSizing: 'border-box'
                                            }}
                                        >
                                            {copied ? '✓' : '🔗'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Row 2: Controls & Speeds */}
                            {!hideControls && (
                                <div className="immersive-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', width: '100%' }}>
                                    <div className="immersive-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        {notStarted ? (
                                            <button className="btn btn-sm" style={{ background: 'var(--green)', color: 'white', height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.6rem', boxSizing: 'border-box', border: '2px solid var(--border)', borderRadius: '6px', boxShadow: '1px 1px 0 var(--border)' }} onClick={onStart}>▶ START</button>
                                        ) : (
                                            <>
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={isPaused ? onResume : onPause}
                                                    style={{
                                                        background: isPaused ? 'var(--green)' : 'var(--white)',
                                                        minWidth: 36,
                                                        height: 30,
                                                        padding: 0,
                                                        border: '2px solid var(--border)',
                                                        borderRadius: '6px',
                                                        boxShadow: '1px 1px 0 var(--border)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxSizing: 'border-box'
                                                    }}
                                                >
                                                    {isPaused ? '▶' : '⏸'}
                                                </button>
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={onStep}
                                                    disabled={isFinished}
                                                    style={{
                                                        background: isFinished ? '#eaeaea' : 'var(--white)',
                                                        color: isFinished ? '#999' : 'var(--text)',
                                                        minWidth: 36,
                                                        height: 30,
                                                        padding: 0,
                                                        border: '2px solid var(--border)',
                                                        borderRadius: '6px',
                                                        boxShadow: isFinished ? 'none' : '1px 1px 0 var(--border)',
                                                        transform: isFinished ? 'translate(1px, 1px)' : 'none',
                                                        opacity: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxSizing: 'border-box'
                                                    }}
                                                >
                                                    ⏭
                                                </button>
                                            </>
                                        )}
                                        <button
                                            className="btn btn-sm"
                                            onClick={handleResetAndClearUrl}
                                            style={{
                                                background: 'var(--white)',
                                                minWidth: 28,
                                                height: 30,
                                                padding: 0,
                                                border: '2px solid var(--border)',
                                                borderRadius: '6px',
                                                boxShadow: '1px 1px 0 var(--border)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxSizing: 'border-box'
                                            }}
                                        >
                                            ↺
                                        </button>
                                    </div>

                                    {/* Speed Selection */}
                                    <div className="immersive-speed" style={{ display: 'flex', height: 30, border: '2px solid var(--border)', borderRadius: '6px', overflow: 'hidden', boxSizing: 'border-box' }}>
                                        {SPEED_OPTIONS.map(opt => (
                                            <button key={opt.ms}
                                                onClick={() => onSpeedChange(opt.ms)}
                                                style={{
                                                    padding: '0 0.45rem', fontSize: '0.62rem', fontWeight: 700,
                                                    background: speed === opt.ms ? 'var(--cyan)' : 'var(--white)',
                                                    border: 'none', borderRight: '1px solid var(--border)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxSizing: 'border-box',
                                                    height: '100%'
                                                }}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Title & Module */}
                            <div className="immersive-brand-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginRight: '0.5rem' }}>
                                {icon && (
                                    <div style={{
                                        width: 40, height: 40, background: 'var(--white)',
                                        border: '2px solid var(--border)', borderRadius: '8px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.4rem', boxShadow: '2px 2px 0 var(--border)'
                                    }}>
                                        {icon}
                                    </div>
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)', lineHeight: 1 }}>{title}</span>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>{moduleLabel}</span>
                                </div>
                            </div>

                            <div style={{ flex: 1 }} />

                            {/* Scenario Picker (optional) */}
                            {!hideControls && scenarioPicker}

                            {/* Controls */}
                            {!hideControls && (
                                <div className="immersive-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                    <div className="immersive-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginRight: '0.5rem' }}>
                                        {notStarted ? (
                                            <button className="btn btn-sm" style={{ background: 'var(--green)', color: '#000000', height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.8rem', boxSizing: 'border-box', border: '2px solid var(--border)', borderRadius: '6px', boxShadow: '2px 2px 0 var(--border)', fontFamily: 'var(--font-main)', fontSize: '0.78rem', fontWeight: 700 }} onClick={onStart}>▶ START</button>
                                        ) : (
                                            <>
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={isPaused ? onResume : onPause}
                                                    style={{
                                                        background: isPaused ? 'var(--green)' : 'var(--white)',
                                                        color: isPaused ? '#000000' : 'var(--text)',
                                                        minWidth: 40,
                                                        height: 30,
                                                        padding: 0,
                                                        border: '2px solid var(--border)',
                                                        borderRadius: '6px',
                                                        boxShadow: '2px 2px 0 var(--border)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxSizing: 'border-box',
                                                        fontFamily: 'var(--font-main)',
                                                        fontSize: '0.78rem',
                                                        fontWeight: 700
                                                    }}
                                                >
                                                    {isPaused ? '▶' : '⏸'}
                                                </button>
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={onStep}
                                                    disabled={isFinished}
                                                    style={{
                                                        background: isFinished ? '#eaeaea' : 'var(--white)',
                                                        color: isFinished ? '#999' : 'var(--text)',
                                                        minWidth: 40,
                                                        height: 30,
                                                        padding: 0,
                                                        border: '2px solid var(--border)',
                                                        borderRadius: '6px',
                                                        boxShadow: isFinished ? 'none' : '2px 2px 0 var(--border)',
                                                        transform: isFinished ? 'translate(2px, 2px)' : 'none',
                                                        opacity: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxSizing: 'border-box',
                                                        fontFamily: 'var(--font-main)',
                                                        fontSize: '0.78rem',
                                                        fontWeight: 700
                                                    }}
                                                >
                                                    ⏭
                                                </button>
                                            </>
                                        )}
                                        <button
                                            className="btn btn-sm"
                                            onClick={handleResetAndClearUrl}
                                            style={{
                                                background: 'var(--white)',
                                                minWidth: 32,
                                                height: 30,
                                                padding: 0,
                                                border: '2px solid var(--border)',
                                                borderRadius: '6px',
                                                boxShadow: '2px 2px 0 var(--border)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxSizing: 'border-box',
                                                fontFamily: 'var(--font-main)',
                                                fontSize: '0.78rem',
                                                fontWeight: 700
                                            }}
                                        >
                                            ↺
                                        </button>
                                    </div>

                                    {/* Speed Selection */}
                                    <div className="immersive-speed" style={{ display: 'flex', height: 30, border: '2px solid var(--border)', borderRadius: '6px', overflow: 'hidden', boxSizing: 'border-box' }}>
                                        {SPEED_OPTIONS.map(opt => (
                                            <button key={opt.ms}
                                                onClick={() => onSpeedChange(opt.ms)}
                                                style={{
                                                    padding: '0 0.6rem', fontSize: '0.68rem', fontWeight: 700,
                                                    background: speed === opt.ms ? 'var(--cyan)' : 'var(--white)',
                                                    border: 'none', borderRight: '1px solid var(--border)',
                                                    cursor: 'pointer',
                                                    height: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxSizing: 'border-box',
                                                    fontFamily: 'var(--font-main)'
                                                }}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {snapshotData && (
                                <button
                                    onClick={handleShareSnapshot}
                                    style={{
                                        marginLeft: '0.5rem',
                                        background: copied ? 'var(--green)' : 'var(--white)',
                                        color: copied ? '#000000' : 'var(--text)',
                                        border: '2px solid var(--border)',
                                        borderRadius: '6px',
                                        height: 30,
                                        padding: '0 0.75rem',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        fontFamily: 'var(--font-main)',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.25rem',
                                        boxShadow: '2px 2px 0 var(--border)',
                                        transition: 'all 0.1s',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    {copied ? '✓ Copied!' : '🔗 Share State'}
                                </button>
                            )}
                        </>
                    )}
                </header>

                {/* ─── MAIN CONTENT AREA ─── */}
                <main style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#f8f9fa' }}>

                    {/* LEFT PANEL: System States */}
                    <motion.aside
                        animate={{ width: leftOpen ? (isMobile ? '280px' : '22%') : 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        style={{
                            borderRight: leftOpen ? '3px solid var(--border)' : 'none',
                            display: 'flex', flexDirection: 'column', background: 'var(--white)',
                            overflow: 'hidden', flexShrink: 0,
                            position: isMobile ? 'absolute' : 'relative',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            height: isMobile ? '100%' : 'auto',
                            zIndex: 15,
                            boxShadow: isMobile && leftOpen ? '5px 0 15px rgba(0,0,0,0.3)' : 'none',
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
                        <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1rem', scrollbarWidth: 'thin' }}>
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
                        position: 'relative'
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
                        animate={{ width: rightOpen ? (isMobile ? '280px' : '22%') : 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        style={{
                            borderLeft: rightOpen ? '3px solid var(--border)' : 'none',
                            display: 'flex', flexDirection: 'column', background: 'var(--white)',
                            overflow: 'hidden', flexShrink: 0,
                            position: isMobile ? 'absolute' : 'relative',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            height: isMobile ? '100%' : 'auto',
                            zIndex: 15,
                            boxShadow: isMobile && rightOpen ? '-5px 0 15px rgba(0,0,0,0.3)' : 'none',
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
                        <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1rem', scrollbarWidth: 'thin' }}>
                            {rightContent}
                        </div>
                    </motion.aside>
                </main>
            </motion.div>
        </AnimatePresence>
    );
}
