/**
 * Multilevel Feedback Queue (MLFQ)
 * Q0: RR quantum=4  (highest priority)
 * Q1: RR quantum=8
 * Q2: FCFS           (lowest priority)
 *
 * New processes enter Q0. On quantum expiry → demote to next level.
 * @param {Array} processes - cloned process list
 * @returns {{ gantt: Array, processes: Array }}
 */
export function mlfq(processes) {
    const QUANTA = [4, 8, Infinity]; // Infinity = FCFS for Q2
    const procs = processes.map(p => ({
        ...p,
        remainingTime: p.burstTime,
        queueLevel: 0,
        startTime: -1,
        completionTime: 0,
        done: false,
    }));

    procs.sort((a, b) => a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id));

    const queues = [[], [], []];
    const gantt = [];
    let currentTime = 0;
    let arrivedIdx = 0;

    // Seed initial arrivals
    while (arrivedIdx < procs.length && procs[arrivedIdx].arrivalTime <= currentTime) {
        queues[0].push(procs[arrivedIdx]);
        arrivedIdx++;
    }

    const totalBurst = procs.reduce((s, p) => s + p.burstTime, 0);
    const maxTime = totalBurst + Math.max(...procs.map(p => p.arrivalTime)) + 100;
    let completedCount = 0;

    while (completedCount < procs.length && currentTime <= maxTime) {
        // Find highest non-empty queue
        let qLevel = -1;
        for (let l = 0; l < 3; l++) {
            if (queues[l].length > 0) { qLevel = l; break; }
        }

        if (qLevel === -1) {
            // All queues empty, jump to next arrival
            if (arrivedIdx >= procs.length) break;
            const next = procs[arrivedIdx];
            gantt.push({ processId: 'IDLE', start: currentTime, end: next.arrivalTime });
            currentTime = next.arrivalTime;
            while (arrivedIdx < procs.length && procs[arrivedIdx].arrivalTime <= currentTime) {
                queues[0].push(procs[arrivedIdx]);
                arrivedIdx++;
            }
            continue;
        }

        const proc = queues[qLevel].shift();
        const quantum = QUANTA[qLevel];

        if (proc.startTime === -1) proc.startTime = currentTime;

        const slice = Math.min(quantum, proc.remainingTime);
        const start = currentTime;
        const end = currentTime + slice;
        gantt.push({ processId: proc.id, start, end });

        proc.remainingTime -= slice;
        currentTime = end;

        // Admit newly arrived processes to Q0
        while (arrivedIdx < procs.length && procs[arrivedIdx].arrivalTime <= currentTime) {
            queues[0].push(procs[arrivedIdx]);
            arrivedIdx++;
        }

        if (proc.remainingTime > 0) {
            // Demote, max level 2
            const nextLevel = Math.min(qLevel + 1, 2);
            proc.queueLevel = nextLevel;
            queues[nextLevel].push(proc);
        } else {
            proc.done = true;
            proc.completionTime = currentTime;
            completedCount++;
        }
    }

    const result = procs.map(p => ({ ...p }));
    return { gantt, processes: result };
}
