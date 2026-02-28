import { motion } from 'framer-motion';
import { ALGORITHM_LABELS } from '../engine/schedulerEngine';

const SPEED_ICONS = { '0.5x': '🐢', '1x': '▶', '2x': '⚡', '5x': '🚀', '10x': '💥' };

export default function SimulationControls({
    isRunning, isPaused, isFinished,
    speed, speedOptions,
    onStart, onPause, onResume, onReset, onStep,
    onSpeedChange,
    canStart, // false if no processes
}) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Primary controls */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {!isRunning && !isPaused && (
                    <motion.button
                        className="btn btn-yellow btn-lg"
                        onClick={onStart}
                        disabled={!canStart || isFinished}
                        whileTap={{ scale: 0.97 }}
                        style={{ flex: 1, justifyContent: 'center' }}
                    >
                        ▶ Run Simulation
                    </motion.button>
                )}

                {(isRunning || isPaused) && !isFinished && (
                    <>
                        {isRunning ? (
                            <button className="btn btn-sm btn-cyan" onClick={onPause} style={{ minWidth: 100 }}>
                                ⏸ Pause
                            </button>
                        ) : (
                            <button className="btn btn-sm btn-cyan" onClick={onResume} style={{ minWidth: 100 }}>
                                ▶ Resume
                            </button>
                        )}
                        <button className="btn btn-sm btn-green" onClick={onStep} disabled={isRunning}>
                            ⏭ Step
                        </button>
                    </>
                )}

                {(isRunning || isPaused || isFinished) && (
                    <button className="btn btn-sm btn-pink" onClick={onReset}>
                        ↺ Reset
                    </button>
                )}
            </div>

            {/* Speed controls */}
            {(isRunning || isPaused) && !isFinished && (
                <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem', opacity: 0.6 }}>
                        Simulation Speed
                    </div>
                    <div className="chip-group">
                        {speedOptions.map(s => (
                            <button
                                key={s}
                                className={`chip${speed === s ? ' active' : ''}`}
                                onClick={() => onSpeedChange(s)}
                            >
                                {SPEED_ICONS[s] || s} {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Status badge */}
            {(isRunning || isPaused || isFinished) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        width: 10, height: 10,
                        borderRadius: '50%',
                        background: isFinished ? '#38a169' : isRunning ? '#e53e3e' : '#d69e2e',
                        animation: isRunning ? 'pulse 1s infinite' : 'none',
                        border: '2px solid var(--border)',
                    }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                        {isFinished ? 'Completed' : isRunning ? `Running @ ${speed}` : 'Paused'}
                    </span>
                </div>
            )}
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        </div>
    );
}
