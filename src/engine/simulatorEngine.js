/**
 * simulatorEngine.js — Pure, stateless tick-based simulation engine.
 *
 * Takes a SimulationState snapshot and returns the NEXT snapshot.
 * No React, no side effects. Fully testable.
 *
 * SimulationState shape:
 * {
 *   currentTime:          number,
 *   algorithm:            string,
 *   quantum:              number,
 *   quantumRemaining:     number,
 *   readyQueue:           Process[],     // { id, arrivalTime, burstTime, remainingTime, priority, color, startTime, firstStart }
 *   runningProcess:       Process|null,
 *   completedProcesses:   Process[],
 *   ganttTimeline:        GanttBlock[],  // { processId, start, end, color }
 *   contextSwitches:      number,
 *   lastPreemption:       boolean,       // was there a preemption this tick?
 *   idleTime:             number,
 *   allProcesses:         Process[],     // original input (immutable reference for arrivals)
 *   arrivedIds:           Set<string>,  // IDs already added to readyQueue or completed
 *   isFinished:           boolean,
 *   // Multi-core
 *   coresMode:            boolean,
 *   cores:                CoreState[],   // { id, runningProcess, quantumRemaining }
 * }
 */

import { deepClone } from '../utils/helpers';

// ─────────────────────────────────────────────
// Initialization
// ─────────────────────────────────────────────

export function createInitialState(processList, algorithm, quantum, coresCount) {
    const allProcesses = processList.map(p => ({
        ...p,
        remainingTime: p.burstTime,
        startTime: -1,   // first tick on CPU
        completionTime: 0,
        waitingTime: 0,
        responseTime: -1,
    }));

    const coresMode = coresCount > 1;
    const cores = coresMode
        ? Array.from({ length: coresCount }, (_, i) => ({ id: i + 1, runningProcess: null, quantumRemaining: 0 }))
        : null;

    return {
        currentTime: 0,
        algorithm,
        quantum,
        quantumRemaining: 0,
        readyQueue: [],
        runningProcess: null,
        completedProcesses: [],
        ganttTimeline: [],
        contextSwitches: 0,
        lastPreemption: false,
        idleTime: 0,
        allProcesses,
        arrivedIds: new Set(),
        isFinished: false,
        coresMode,
        cores,
    };
}

// ─────────────────────────────────────────────
// Main tick function — returns next state
// ─────────────────────────────────────────────

export function tick(state) {
    if (state.isFinished) return state;

    // Shallow clone state (deep clone mutable arrays/objects)
    let s = {
        ...state,
        readyQueue: [...state.readyQueue],
        completedProcesses: [...state.completedProcesses],
        ganttTimeline: [...state.ganttTimeline],
        arrivedIds: new Set(state.arrivedIds),
        lastPreemption: false,
        cores: state.cores ? state.cores.map(c => ({
            ...c,
            runningProcess: c.runningProcess ? { ...c.runningProcess } : null,
        })) : null,
    };

    // 1. Admit newly arrived processes
    s = admitArrivals(s);

    // 2. Execute one tick
    if (s.coresMode) {
        s = tickMultiCore(s);
    } else {
        s = tickSingleCore(s);
    }

    // 3. Advance time
    s.currentTime++;

    // 4. Check completion
    const total = s.allProcesses.length;
    const done = s.completedProcesses.length;
    if (done >= total && !s.runningProcess && s.readyQueue.length === 0) {
        if (!s.coresMode || s.cores.every(c => !c.runningProcess)) {
            s.isFinished = true;
        }
    }

    return s;
}

// ─────────────────────────────────────────────
// Admit newly arrived processes to ready queue
// ─────────────────────────────────────────────

function admitArrivals(s) {
    const newArrivals = [];
    for (const p of s.allProcesses) {
        if (!s.arrivedIds.has(p.id) && p.arrivalTime <= s.currentTime) {
            s.arrivedIds.add(p.id);
            newArrivals.push({ ...p });
        }
    }
    if (newArrivals.length > 0) {
        s.readyQueue = [...s.readyQueue, ...newArrivals];
    }
    return s;
}

// ─────────────────────────────────────────────
// Single-Core Tick
// ─────────────────────────────────────────────

function tickSingleCore(s) {
    const alg = s.algorithm;

    // ── Handle preemption before selecting ──
    if (s.runningProcess && isPreemptive(alg)) {
        const candidate = selectCandidate(s.readyQueue, alg, s.runningProcess);
        if (candidate && shouldPreempt(s.runningProcess, candidate, alg)) {
            // Preempt
            s.readyQueue = [...s.readyQueue.filter(p => p.id !== candidate.id)];
            s.readyQueue = [s.runningProcess, ...s.readyQueue]; // push back
            s.runningProcess = { ...candidate };
            s.contextSwitches++;
            s.lastPreemption = true;
            s.quantumRemaining = s.quantum;
        }
    }

    // ── If no running process, select one ──
    if (!s.runningProcess) {
        if (s.readyQueue.length === 0) {
            // CPU idle this tick
            s = appendGantt(s, 'IDLE', null, s.currentTime);
            s.idleTime++;
            return s;
        }
        const chosen = selectProcess(s);
        s.readyQueue = s.readyQueue.filter(p => p.id !== chosen.id);
        if (s.runningProcess && s.runningProcess.id !== chosen.id) s.contextSwitches++;
        s.runningProcess = { ...chosen };
        if (s.runningProcess.startTime === -1) s.runningProcess.startTime = s.currentTime;
        if (s.runningProcess.responseTime === -1) s.runningProcess.responseTime = s.currentTime - s.runningProcess.arrivalTime;
        if (alg === 'RR' || alg === 'MLFQ') s.quantumRemaining = s.quantum;
    } else {
        // Ensure startTime / responseTime is recorded
        if (s.runningProcess.startTime === -1) s.runningProcess.startTime = s.currentTime;
        if (s.runningProcess.responseTime === -1) s.runningProcess.responseTime = s.currentTime - s.runningProcess.arrivalTime;
    }

    // ── Execute 1 unit ──
    s = appendGantt(s, s.runningProcess.id, s.runningProcess.color, s.currentTime);
    s.runningProcess.remainingTime--;

    // ── Increment waiting times for ready queue processes ──
    s.readyQueue = s.readyQueue.map(p => ({ ...p, waitingTime: (p.waitingTime || 0) + 1 }));

    // ── Check Round Robin quantum ──
    if ((alg === 'RR' || alg === 'MLFQ') && s.runningProcess.remainingTime > 0) {
        s.quantumRemaining--;
        if (s.quantumRemaining <= 0) {
            // Quantum expired — re-queue
            const endedProc = { ...s.runningProcess };
            // For MLFQ demote
            if (alg === 'MLFQ') endedProc.queueLevel = Math.min((endedProc.queueLevel || 0) + 1, 2);
            s.readyQueue = [...s.readyQueue, endedProc];
            s.runningProcess = null;
            s.quantumRemaining = 0;
            s.contextSwitches++;
            return s;
        }
    }

    // ── Check completion ──
    if (s.runningProcess.remainingTime <= 0) {
        s.runningProcess.completionTime = s.currentTime + 1;
        s.runningProcess.turnaroundTime = s.runningProcess.completionTime - s.runningProcess.arrivalTime;
        s.runningProcess.waitingTime = s.runningProcess.turnaroundTime - s.runningProcess.burstTime;
        s.completedProcesses = [...s.completedProcesses, { ...s.runningProcess }];
        s.runningProcess = null;
        s.quantumRemaining = 0;
    }

    return s;
}

// ─────────────────────────────────────────────
// Multi-Core Tick
// ─────────────────────────────────────────────

function tickMultiCore(s) {
    s.readyQueue = s.readyQueue.map(p => ({ ...p, waitingTime: (p.waitingTime || 0) + 1 }));

    const newGantt = [...s.ganttTimeline];
    const newCompleted = [...s.completedProcesses];

    s.cores = s.cores.map(core => {
        let c = { ...core, runningProcess: core.runningProcess ? { ...core.runningProcess } : null };

        // Admit to core if idle
        if (!c.runningProcess && s.readyQueue.length > 0) {
            const chosen = s.readyQueue.shift();
            c.runningProcess = { ...chosen };
            if (c.runningProcess.startTime === -1) c.runningProcess.startTime = s.currentTime;
            if (c.runningProcess.responseTime === -1) c.runningProcess.responseTime = s.currentTime - c.runningProcess.arrivalTime;
            c.quantumRemaining = s.quantum;
        }

        if (!c.runningProcess) {
            // Core idle
            newGantt.push({ processId: `CORE${c.id}-IDLE`, start: s.currentTime, end: s.currentTime + 1, color: '#e0e0e0', coreId: c.id });
            return c;
        }

        // Execute
        const last = newGantt.findLast ? newGantt.findLast(g => g.coreId === c.id) : [...newGantt].reverse().find(g => g.coreId === c.id);
        if (last && last.processId === c.runningProcess.id && last.end === s.currentTime) {
            last.end = s.currentTime + 1;
        } else {
            newGantt.push({ processId: c.runningProcess.id, start: s.currentTime, end: s.currentTime + 1, color: c.runningProcess.color, coreId: c.id });
        }

        c.runningProcess.remainingTime--;

        if (c.runningProcess.remainingTime <= 0) {
            c.runningProcess.completionTime = s.currentTime + 1;
            c.runningProcess.turnaroundTime = c.runningProcess.completionTime - c.runningProcess.arrivalTime;
            c.runningProcess.waitingTime = c.runningProcess.turnaroundTime - c.runningProcess.burstTime;
            newCompleted.push({ ...c.runningProcess });
            c.runningProcess = null;
        }

        return c;
    });

    s.ganttTimeline = newGantt;
    s.completedProcesses = newCompleted;
    return s;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function selectProcess(s) {
    const { readyQueue, algorithm, runningProcess } = s;
    if (readyQueue.length === 0) return null;

    switch (algorithm) {
        case 'FCFS':
            return [...readyQueue].sort((a, b) => a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id))[0];
        case 'SJF':
        case 'SRTF':
            return [...readyQueue].sort((a, b) => a.remainingTime - b.remainingTime || a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id))[0];
        case 'PRIORITY_NP':
        case 'PRIORITY_P':
            return [...readyQueue].sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id))[0];
        case 'RR':
        case 'MLFQ':
            return readyQueue[0]; // circular queue — pick front
        default:
            return readyQueue[0];
    }
}

function selectCandidate(readyQueue, algorithm, running) {
    if (readyQueue.length === 0) return null;
    switch (algorithm) {
        case 'SRTF':
            return [...readyQueue].sort((a, b) => a.remainingTime - b.remainingTime || a.id.localeCompare(b.id))[0];
        case 'PRIORITY_P':
            return [...readyQueue].sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id))[0];
        default:
            return null;
    }
}

function shouldPreempt(running, candidate, algorithm) {
    switch (algorithm) {
        case 'SRTF':
            return candidate.remainingTime < running.remainingTime;
        case 'PRIORITY_P':
            return candidate.priority < running.priority;
        default:
            return false;
    }
}

function isPreemptive(algorithm) {
    return algorithm === 'SRTF' || algorithm === 'PRIORITY_P';
}

function appendGantt(s, processId, color, time) {
    const last = s.ganttTimeline.length > 0 ? s.ganttTimeline[s.ganttTimeline.length - 1] : null;
    if (last && last.processId === processId && last.end === time) {
        // Extend existing block
        const newTimeline = [...s.ganttTimeline];
        newTimeline[newTimeline.length - 1] = { ...last, end: time + 1 };
        s.ganttTimeline = newTimeline;
    } else {
        s.ganttTimeline = [
            ...s.ganttTimeline,
            { processId, start: time, end: time + 1, color: color || '#e0e0e0' },
        ];
    }
    return s;
}

// ─────────────────────────────────────────────
// Compute final metrics from completed processes
// ─────────────────────────────────────────────

export function computeFinalMetrics(completedProcesses, ganttTimeline, currentTime) {
    let totalWT = 0, totalTAT = 0, totalRT = 0;

    const perProcess = completedProcesses.map(p => {
        const tat = p.turnaroundTime ?? (p.completionTime - p.arrivalTime);
        const wt = p.waitingTime ?? (tat - p.burstTime);
        const rt = p.responseTime >= 0 ? p.responseTime : 0;
        totalWT += wt; totalTAT += tat; totalRT += rt;
        return { ...p, turnaroundTime: tat, waitingTime: wt, responseTime: rt };
    });

    const n = completedProcesses.length || 1;
    const idleTime = ganttTimeline.filter(g => g.processId === 'IDLE' || g.processId?.includes('IDLE')).reduce((s, g) => s + (g.end - g.start), 0);
    const totalTime = currentTime || 1;
    const cpuUtilization = ((totalTime - idleTime) / totalTime) * 100;

    let contextSwitches = 0;
    for (let i = 1; i < ganttTimeline.length; i++) {
        const a = ganttTimeline[i - 1].processId, b = ganttTimeline[i].processId;
        if (b !== 'IDLE' && a !== 'IDLE' && a !== b) contextSwitches++;
    }

    return {
        perProcess,
        overall: {
            avgWaitingTime: totalWT / n,
            avgTurnaroundTime: totalTAT / n,
            avgResponseTime: totalRT / n,
            cpuUtilization,
            throughput: completedProcesses.length / totalTime,
            contextSwitches,
            totalTime,
        },
    };
}
