/**
 * Round Robin Scheduling
 * @param {Array} processes - cloned process list
 * @param {{ quantum: number }} options
 * @returns {{ gantt: Array, processes: Array }}
 */
export function roundRobin(processes, options = { quantum: 2 }) {
    const quantum = Math.max(1, Number(options.quantum) || 2);

    const procs = processes.map(p => ({
        ...p,
        remainingTime: p.burstTime,
        startTime: -1,
        completionTime: 0,
        done: false,
    }));

    // Sort by arrival time initially
    procs.sort((a, b) => a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id));

    const gantt = [];
    let currentTime = 0;
    const queue = [];
    let idx = 0;

    // Seed queue with all processes arriving at t=0 or earlier
    while (idx < procs.length && procs[idx].arrivalTime <= currentTime) {
        queue.push(procs[idx]);
        idx++;
    }

    while (queue.length > 0 || idx < procs.length) {
        if (queue.length === 0) {
            // CPU idle — jump to next arrival
            const nextProc = procs[idx];
            gantt.push({ processId: 'IDLE', start: currentTime, end: nextProc.arrivalTime });
            currentTime = nextProc.arrivalTime;
            while (idx < procs.length && procs[idx].arrivalTime <= currentTime) {
                queue.push(procs[idx]);
                idx++;
            }
            continue;
        }

        const proc = queue.shift();

        if (proc.startTime === -1) proc.startTime = currentTime;

        const slice = Math.min(quantum, proc.remainingTime);
        const start = currentTime;
        const end = currentTime + slice;
        gantt.push({ processId: proc.id, start, end });

        proc.remainingTime -= slice;
        currentTime = end;

        // Enqueue newly arrived processes during this slice
        while (idx < procs.length && procs[idx].arrivalTime <= currentTime) {
            queue.push(procs[idx]);
            idx++;
        }

        if (proc.remainingTime > 0) {
            queue.push(proc); // re-enqueue
        } else {
            proc.done = true;
            proc.completionTime = currentTime;
        }
    }

    const result = procs.map(p => ({ ...p }));
    return { gantt, processes: result };
}
