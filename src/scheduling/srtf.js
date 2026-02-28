/**
 * Shortest Remaining Time First (Preemptive SJF)
 * Tick-by-tick simulation
 * @param {Array} processes - cloned process list
 * @returns {{ gantt: Array, processes: Array }}
 */
export function srtf(processes) {
    const procs = processes.map(p => ({
        ...p,
        remainingTime: p.burstTime,
        startTime: -1,
        completionTime: 0,
        done: false,
    }));

    const gantt = [];
    let currentTime = 0;
    let completedCount = 0;
    const n = procs.length;
    let prevProcess = null;

    const maxTime = procs.reduce((sum, p) => sum + p.burstTime, 0) +
        Math.max(...procs.map(p => p.arrivalTime));

    while (completedCount < n && currentTime <= maxTime) {
        const available = procs.filter(p => !p.done && p.arrivalTime <= currentTime);

        if (available.length === 0) {
            // Idle tick
            const nextArrival = procs.filter(p => !p.done).sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
            if (!nextArrival) break;
            if (gantt.length && gantt[gantt.length - 1].processId === 'IDLE') {
                gantt[gantt.length - 1].end = nextArrival.arrivalTime;
            } else {
                gantt.push({ processId: 'IDLE', start: currentTime, end: nextArrival.arrivalTime });
            }
            currentTime = nextArrival.arrivalTime;
            prevProcess = null;
            continue;
        }

        // Pick shortest remaining time; tie-break arrival, id
        available.sort((a, b) =>
            a.remainingTime - b.remainingTime ||
            a.arrivalTime - b.arrivalTime ||
            a.id.localeCompare(b.id)
        );
        const chosen = available[0];
        const proc = procs.find(p => p.id === chosen.id);

        // Track first start (response time)
        if (proc.startTime === -1) proc.startTime = currentTime;

        // Extend or create gantt block
        if (gantt.length && gantt[gantt.length - 1].processId === proc.id) {
            gantt[gantt.length - 1].end = currentTime + 1;
        } else {
            gantt.push({ processId: proc.id, start: currentTime, end: currentTime + 1 });
        }

        proc.remainingTime--;
        currentTime++;

        if (proc.remainingTime === 0) {
            proc.done = true;
            proc.completionTime = currentTime;
            completedCount++;
        }
    }

    const result = procs.map(p => ({
        ...p,
        completionTime: p.completionTime,
    }));

    return { gantt, processes: result };
}
