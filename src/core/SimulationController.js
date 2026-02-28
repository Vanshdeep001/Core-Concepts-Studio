/**
 * SimulationController — Universal base for all simulator engines.
 * Returns a hook-friendly API for step-driven simulations.
 */

export const SPEED_OPTIONS = [
    { label: '0.25×', ms: 2000 },
    { label: '0.5×', ms: 1200 },
    { label: '1×', ms: 700 },
    { label: '2×', ms: 350 },
    { label: '4×', ms: 150 },
    { label: '8×', ms: 60 },
];

export function createSimState(overrides = {}) {
    return {
        currentStep: 0,
        isRunning: false,
        isPaused: false,
        isFinished: false,
        speed: 700,
        events: [],
        logs: [],
        ...overrides,
    };
}

export function makeLogger() {
    const entries = [];
    return {
        log(stepNum, message, detail = '') {
            entries.push({ step: stepNum, message, detail, ts: Date.now() });
        },
        get entries() { return [...entries]; },
        clear() { entries.length = 0; },
    };
}
