/**
 * First Come First Serve (Non-Preemptive)
 * @param {Array} processes - cloned process list
 * @returns {{ gantt: Array, processes: Array }}
 */
export function fcfs(processes) {
    const procs = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id));
    const gantt = [];
    let currentTime = 0;
    const result = [];

    for (const p of procs) {
        if (currentTime < p.arrivalTime) {
            // CPU idle gap
            gantt.push({ processId: 'IDLE', start: currentTime, end: p.arrivalTime });
            currentTime = p.arrivalTime;
        }
        const start = currentTime;
        const end = currentTime + p.burstTime;
        gantt.push({ processId: p.id, start, end });
        result.push({
            ...p,
            startTime: start,
            completionTime: end,
        });
        currentTime = end;
    }

    return { gantt, processes: result };
}
