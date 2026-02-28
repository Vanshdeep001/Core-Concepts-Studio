// Color palette matching neo-brutalist design system
const PROCESS_COLORS = [
    '#66d9ef', // cyan
    '#ffd93d', // yellow
    '#ff6b9d', // pink
    '#a8e6cf', // green
    '#ffb347', // orange
    '#b39ddb', // purple
    '#f48fb1', // light pink
    '#80cbc4', // teal
    '#fff176', // light yellow
    '#ef9a9a', // light red
];

export function getProcessColor(index) {
    return PROCESS_COLORS[index % PROCESS_COLORS.length];
}

export function generateProcessId(index) {
    return `P${index + 1}`;
}

export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

export function createDefaultProcess(index) {
    return {
        id: generateProcessId(index),
        arrivalTime: 0,
        burstTime: 1,
        priority: 1,
        color: getProcessColor(index),
    };
}

/**
 * Merge consecutive Gantt blocks of the same process for display
 */
export function mergeGanttBlocks(gantt) {
    if (!gantt || gantt.length === 0) return [];
    const merged = [{ ...gantt[0] }];
    for (let i = 1; i < gantt.length; i++) {
        const last = merged[merged.length - 1];
        if (gantt[i].processId === last.processId && gantt[i].start === last.end) {
            last.end = gantt[i].end;
        } else {
            merged.push({ ...gantt[i] });
        }
    }
    return merged;
}

/**
 * Validate process list — returns array of error strings (empty = valid)
 */
export function validateProcesses(processes) {
    const errors = [];
    if (!processes || processes.length === 0) {
        errors.push('Please add at least one process.');
        return errors;
    }
    const ids = new Set();
    processes.forEach((p, i) => {
        if (!p.id || p.id.trim() === '') errors.push(`Row ${i + 1}: PID is required.`);
        if (ids.has(p.id)) errors.push(`Duplicate PID: ${p.id}`);
        ids.add(p.id);
        if (p.arrivalTime < 0) errors.push(`${p.id}: Arrival time cannot be negative.`);
        if (p.burstTime <= 0) errors.push(`${p.id}: Burst time must be > 0.`);
        if (p.priority < 0) errors.push(`${p.id}: Priority cannot be negative.`);
    });
    return errors;
}
