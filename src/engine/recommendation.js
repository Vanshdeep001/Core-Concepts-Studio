import { runSimulation, ALGORITHM_OPTIONS, ALGORITHM_LABELS } from './schedulerEngine';

/**
 * Recommendation Engine
 * Runs all algorithms on the same input and recommends the one
 * with the lowest average waiting time.
 *
 * @param {Array} processList
 * @param {Object} options - { quantum: number }
 * @returns {{ recommended: string, ranking: Array, reasoning: string }}
 */
export function recommend(processList, options = { quantum: 2 }) {
    const results = [];

    for (const algoName of ALGORITHM_OPTIONS) {
        try {
            const { metrics } = runSimulation(algoName, processList, options);
            results.push({
                algorithmName: algoName,
                label: ALGORITHM_LABELS[algoName],
                avgWaitingTime: metrics.overall.avgWaitingTime,
                avgTurnaroundTime: metrics.overall.avgTurnaroundTime,
                cpuUtilization: metrics.overall.cpuUtilization,
                contextSwitches: metrics.overall.contextSwitches,
            });
        } catch (e) {
            // Skip failing algorithms gracefully
        }
    }

    // Sort by avg waiting time ascending
    results.sort((a, b) => a.avgWaitingTime - b.avgWaitingTime);

    const best = results[0];
    const reasoning = best
        ? `${best.label} achieves the lowest average waiting time of ${best.avgWaitingTime.toFixed(2)} units for this workload.`
        : 'Unable to determine a recommendation.';

    return {
        recommended: best ? best.algorithmName : null,
        recommendedLabel: best ? best.label : null,
        ranking: results,
        reasoning,
    };
}
