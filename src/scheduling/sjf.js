/**
 * Shortest Job First (Non-Preemptive)
 * @param {Array} processes - cloned process list
 * @returns {{ gantt: Array, processes: Array }}
 */
export function sjf(processes) {
    let remaining = processes.map(p => ({ ...p, done: false }));
    const gantt = [];
    const result = [];
    let currentTime = 0;
    let completedCount = 0;
    const n = remaining.length;

    while (completedCount < n) {
        // Find arrived, not-done processes
        const available = remaining.filter(p => !p.done && p.arrivalTime <= currentTime);

        if (available.length === 0) {
            // Advance time to next arrival
            const next = remaining.filter(p => !p.done).sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
            gantt.push({ processId: 'IDLE', start: currentTime, end: next.arrivalTime });
            currentTime = next.arrivalTime;
            continue;
        }

        // Pick shortest burst; tie-break by arrival then id
        available.sort((a, b) => a.burstTime - b.burstTime || a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id));
        const chosen = available[0];
        const start = currentTime;
        const end = currentTime + chosen.burstTime;
        gantt.push({ processId: chosen.id, start, end });
        result.push({ ...chosen, startTime: start, completionTime: end });
        currentTime = end;

        const idx = remaining.findIndex(p => p.id === chosen.id);
        remaining[idx].done = true;
        completedCount++;
    }

    return { gantt, processes: result };
}
