import { SPEED_OPTIONS } from '../core/SimulationController';

/**
 * Universal simulation control bar — Start, Pause, Resume, Reset, Step, Speed.
 * Used by every simulator in every module.
 */
export default function SimControls({
    isRunning = false,
    isPaused = false,
    isFinished = false,
    speed = 700,
    canStart = true,
    onStart,
    onPause,
    onResume,
    onReset,
    onStep,
    onSpeedChange,
    className = '',
}) {
    const notStarted = !isRunning && !isPaused && !isFinished;

    return (
        <div
            className={className}
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                alignItems: 'center',
            }}
        >
            {/* Primary Action */}
            {notStarted && (
                <button
                    className="btn btn-yellow btn-sm"
                    onClick={onStart}
                    disabled={!canStart}
                >
                    ▶ Start
                </button>
            )}
            {isRunning && (
                <button className="btn btn-cyan btn-sm" onClick={onPause}>
                    ⏸ Pause
                </button>
            )}
            {isPaused && (
                <button className="btn btn-green btn-sm" onClick={onResume}>
                    ▶ Resume
                </button>
            )}
            {isFinished && (
                <button className="btn btn-yellow btn-sm" onClick={onReset}>
                    ↺ Restart
                </button>
            )}

            {/* Step */}
            {(isPaused || notStarted) && !isFinished && (
                <button
                    className="btn btn-sm"
                    onClick={onStep}
                    disabled={!canStart}
                    title="Step forward one tick"
                >
                    ⏭ Step
                </button>
            )}

            {/* Reset */}
            {(isRunning || isPaused || isFinished) && (
                <button className="btn btn-sm" onClick={onReset}>
                    ↺ Reset
                </button>
            )}

            {/* Speed */}
            <div style={{ display: 'flex', gap: 0, marginLeft: 'auto' }}>
                {SPEED_OPTIONS.map((opt) => (
                    <button
                        key={opt.ms}
                        className={`chip${speed === opt.ms ? ' active' : ''}`}
                        style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
                        onClick={() => onSpeedChange(opt.ms)}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
