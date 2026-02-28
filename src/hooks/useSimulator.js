import { useCallback, useEffect, useRef, useState } from 'react';
import { createInitialState, tick, computeFinalMetrics } from '../engine/simulatorEngine';

const SPEEDS = {
    '0.5x': 2000,
    '1x': 1000,
    '2x': 500,
    '5x': 200,
    '10x': 80,
};

export default function useSimulator() {
    const [simState, setSimState] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [speed, setSpeed] = useState('1x');
    const [finalMetrics, setFinalMetrics] = useState(null);
    const [config, setConfig] = useState(null);

    const intervalRef = useRef(null);
    const stateRef = useRef(null); // keep up-to-date ref for interval closure

    // Keep stateRef in sync with simState
    useEffect(() => {
        stateRef.current = simState;
    }, [simState]);

    // ── Internal tick runner ──
    const runTick = useCallback(() => {
        const current = stateRef.current;
        if (!current || current.isFinished) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            if (current) {
                setFinalMetrics(computeFinalMetrics(
                    current.completedProcesses,
                    current.ganttTimeline,
                    current.currentTime
                ));
            }
            return;
        }
        const next = tick(current);
        stateRef.current = next;
        setSimState(next);

        if (next.isFinished) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            setFinalMetrics(computeFinalMetrics(
                next.completedProcesses,
                next.ganttTimeline,
                next.currentTime
            ));
        }
    }, []);

    // ── Start simulation ──
    const startSimulation = useCallback((processList, algorithm, quantum, cores) => {
        clearInterval(intervalRef.current);
        const initial = createInitialState(processList, algorithm, quantum, cores);
        stateRef.current = initial;
        setSimState(initial);
        setFinalMetrics(null);
        setIsRunning(true);
        setIsPaused(false);
        setConfig({ processList, algorithm, quantum, cores });

        intervalRef.current = setInterval(runTick, SPEEDS[speed] ?? 1000);
    }, [speed, runTick]);

    // ── Pause ──
    const pauseSimulation = useCallback(() => {
        clearInterval(intervalRef.current);
        setIsRunning(false);
        setIsPaused(true);
    }, []);

    // ── Resume ──
    const resumeSimulation = useCallback(() => {
        if (!stateRef.current || stateRef.current.isFinished) return;
        setIsRunning(true);
        setIsPaused(false);
        intervalRef.current = setInterval(runTick, SPEEDS[speed] ?? 1000);
    }, [speed, runTick]);

    // ── Reset ──
    const resetSimulation = useCallback(() => {
        clearInterval(intervalRef.current);
        setSimState(null);
        setIsRunning(false);
        setIsPaused(false);
        setFinalMetrics(null);
    }, []);

    // ── Step (advance 1 tick manually) ──
    const stepSimulation = useCallback(() => {
        const current = stateRef.current;
        if (!current || current.isFinished) return;
        const next = tick(current);
        stateRef.current = next;
        setSimState(next);
        if (next.isFinished) {
            setFinalMetrics(computeFinalMetrics(
                next.completedProcesses,
                next.ganttTimeline,
                next.currentTime
            ));
        }
    }, []);

    // ── Change speed (restart interval at new rate) ──
    const changeSpeed = useCallback((newSpeed) => {
        setSpeed(newSpeed);
        if (isRunning) {
            clearInterval(intervalRef.current);
            intervalRef.current = setInterval(runTick, SPEEDS[newSpeed] ?? 1000);
        }
    }, [isRunning, runTick]);

    // Cleanup on unmount
    useEffect(() => () => clearInterval(intervalRef.current), []);

    return {
        simState,
        isRunning,
        isPaused,
        speed,
        finalMetrics,
        startSimulation,
        pauseSimulation,
        resumeSimulation,
        resetSimulation,
        stepSimulation,
        changeSpeed,
        SPEED_OPTIONS: Object.keys(SPEEDS),
    };
}
