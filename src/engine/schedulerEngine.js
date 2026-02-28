import { deepClone } from '../utils/helpers';
import { computeMetrics } from './metrics';
import { fcfs } from '../scheduling/fcfs';
import { sjf } from '../scheduling/sjf';
import { srtf } from '../scheduling/srtf';
import { priority } from '../scheduling/priority';
import { roundRobin } from '../scheduling/roundRobin';
import { mlfq } from '../scheduling/mlfq';

const ALGORITHMS = {
    FCFS: (procs, opts) => fcfs(procs),
    SJF: (procs, opts) => sjf(procs),
    SRTF: (procs, opts) => srtf(procs),
    PRIORITY_NP: (procs, opts) => priority(procs, { preemptive: false }),
    PRIORITY_P: (procs, opts) => priority(procs, { preemptive: true }),
    RR: (procs, opts) => roundRobin(procs, { quantum: opts.quantum }),
    MLFQ: (procs, opts) => mlfq(procs),
};

export const ALGORITHM_LABELS = {
    FCFS: 'FCFS',
    SJF: 'SJF (Non-Preemptive)',
    SRTF: 'SRTF (Preemptive)',
    PRIORITY_NP: 'Priority (Non-Preemptive)',
    PRIORITY_P: 'Priority (Preemptive)',
    RR: 'Round Robin',
    MLFQ: 'MLFQ',
};

export const ALGORITHM_OPTIONS = Object.keys(ALGORITHM_LABELS);

/**
 * Run simulation for a single algorithm
 * @param {string} algorithmName - one of ALGORITHM_OPTIONS
 * @param {Array} processList - raw process input
 * @param {Object} options - { quantum, cores }
 * @returns {{ gantt, processes, metrics }}
 */
export function runSimulation(algorithmName, processList, options = {}) {
    const algo = ALGORITHMS[algorithmName];
    if (!algo) throw new Error(`Unknown algorithm: ${algorithmName}`);

    const cloned = deepClone(processList);
    const { gantt, processes } = algo(cloned, options);
    const metrics = computeMetrics(processes, gantt);

    return {
        algorithmName,
        gantt,
        processes,
        metrics,
    };
}

/**
 * Multi-core simulation: distributes processes across N cores
 * using a work-stealing approach — assign each process to the
 * least-loaded core's queue and run FCFS per core.
 */
export function runMultiCoreSimulation(processList, cores = 2, algorithmName = 'FCFS', options = {}) {
    const sorted = deepClone(processList).sort((a, b) => a.arrivalTime - b.arrivalTime);

    // Distribute processes round-robin across cores by arrival order
    const coreQueues = Array.from({ length: cores }, () => []);
    sorted.forEach((p, i) => coreQueues[i % cores].push(p));

    const coreResults = coreQueues.map((coreProcs, coreIdx) => {
        if (coreProcs.length === 0) return { coreId: coreIdx + 1, gantt: [], processes: [], metrics: null };
        const cloned = deepClone(coreProcs);
        const algo = ALGORITHMS[algorithmName] || ALGORITHMS.FCFS;
        const { gantt, processes } = algo(cloned, options);
        const metrics = computeMetrics(processes, gantt);
        return { coreId: coreIdx + 1, gantt, processes, metrics };
    });

    return coreResults;
}
