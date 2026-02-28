/**
 * Priority Scheduling (Preemptive & Non-Preemptive)
 * Lower priority number = higher priority
 * @param {Array} processes - cloned process list
 * @param {{ preemptive: boolean }} options
 * @returns {{ gantt: Array, processes: Array }}
 */
export function priority(processes, options = { preemptive: false }) {
    const { preemptive } = options;

    if (!preemptive) {
        return priorityNonPreemptive(processes);
    } else {
        return priorityPreemptive(processes);
    }
}

function priorityNonPreemptive(processes) {
    let remaining = processes.map(p => ({ ...p, done: false }));
    const gantt = [];
    const result = [];
    let currentTime = 0;
    let completedCount = 0;
    const n = remaining.length;

    while (completedCount < n) {
        const available = remaining.filter(p => !p.done && p.arrivalTime <= currentTime);

        if (available.length === 0) {
            const next = remaining.filter(p => !p.done).sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
            gantt.push({ processId: 'IDLE', start: currentTime, end: next.arrivalTime });
            currentTime = next.arrivalTime;
            continue;
        }

        available.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id));
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

function priorityPreemptive(processes) {
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

    const maxTime = procs.reduce((sum, p) => sum + p.burstTime, 0) +
        Math.max(...procs.map(p => p.arrivalTime)) + 1;

    while (completedCount < n && currentTime <= maxTime) {
        const available = procs.filter(p => !p.done && p.arrivalTime <= currentTime);

        if (available.length === 0) {
            const next = procs.filter(p => !p.done).sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
            if (!next) break;
            if (gantt.length && gantt[gantt.length - 1].processId === 'IDLE') {
                gantt[gantt.length - 1].end = next.arrivalTime;
            } else {
                gantt.push({ processId: 'IDLE', start: currentTime, end: next.arrivalTime });
            }
            currentTime = next.arrivalTime;
            continue;
        }

        available.sort((a, b) =>
            a.priority - b.priority ||
            a.arrivalTime - b.arrivalTime ||
            a.id.localeCompare(b.id)
        );
        const chosen = available[0];
        const proc = procs.find(p => p.id === chosen.id);

        if (proc.startTime === -1) proc.startTime = currentTime;

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

    const result = procs.map(p => ({ ...p }));
    return { gantt, processes: result };
}
