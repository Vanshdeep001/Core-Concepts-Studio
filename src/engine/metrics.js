/**
 * Metrics Module
 * Computes per-process and overall scheduling metrics from algorithm output
 */

/**
 * @param {Array} processes - output from scheduling algorithm (with startTime, completionTime, arrivalTime, burstTime)
 * @param {Array} gantt     - gantt chart data
 * @returns {{ perProcess: Array, overall: Object }}
 */
export function computeMetrics(processes, gantt) {
    let totalWaiting = 0;
    let totalTurnaround = 0;
    let totalResponse = 0;
    let contextSwitches = 0;

    const perProcess = processes.map(p => {
        const turnaroundTime = p.completionTime - p.arrivalTime;
        const waitingTime = turnaroundTime - p.burstTime;
        const responseTime = p.startTime - p.arrivalTime;

        totalWaiting += waitingTime;
        totalTurnaround += turnaroundTime;
        totalResponse += responseTime;

        return {
            id: p.id,
            arrivalTime: p.arrivalTime,
            burstTime: p.burstTime,
            priority: p.priority,
            completionTime: p.completionTime,
            turnaroundTime,
            waitingTime,
            responseTime,
            color: p.color,
        };
    });

    // Count context switches (non-IDLE transitions between different processes)
    for (let i = 1; i < gantt.length; i++) {
        const prev = gantt[i - 1].processId;
        const curr = gantt[i].processId;
        if (curr !== 'IDLE' && prev !== 'IDLE' && prev !== curr) {
            contextSwitches++;
        }
    }

    // CPU Utilization = (total execution time excluding IDLE) / (total time span)
    const totalTime = gantt.length > 0 ? gantt[gantt.length - 1].end - gantt[0].start : 0;
    const idleTime = gantt
        .filter(g => g.processId === 'IDLE')
        .reduce((sum, g) => sum + (g.end - g.start), 0);
    const cpuUtilization = totalTime > 0 ? ((totalTime - idleTime) / totalTime) * 100 : 0;
    const throughput = totalTime > 0 ? processes.length / totalTime : 0;

    const n = processes.length;
    const overall = {
        avgWaitingTime: n > 0 ? totalWaiting / n : 0,
        avgTurnaroundTime: n > 0 ? totalTurnaround / n : 0,
        avgResponseTime: n > 0 ? totalResponse / n : 0,
        cpuUtilization,
        throughput,
        contextSwitches,
        totalTime,
    };

    return { perProcess, overall };
}
