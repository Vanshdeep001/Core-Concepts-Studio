/**
 * useSimEngine — shared simulation state hook for all immersive simulators.
 * Handles: step array, currentStep, isRunning/Paused/Finished, timer, mode.
 */
import { useState, useRef, useCallback } from 'react';

export default function useSimEngine(speed = 700) {
    const [steps, setSteps] = useState([]);
    const [currentStep, setCurrentStep] = useState(-1);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [isSimMode, setIsSimMode] = useState(false);
    const [logs, setLogs] = useState([]);

    const timerRef = useRef(null);
    const stepRef = useRef(-1);
    const stepsRef = useRef([]);

    const advanceStep = useCallback((stepsArr, idx, onStepChange) => {
        const newIdx = idx + 1;
        if (newIdx >= stepsArr.length) {
            setCurrentStep(newIdx - 1);
            setIsRunning(false); setIsFinished(true);
            clearInterval(timerRef.current);
            setLogs(prev => [...prev, { step: newIdx, message: '✅ Simulation complete', detail: '' }]);
            return;
        }
        setCurrentStep(newIdx);
        stepRef.current = newIdx;
        const s = stepsArr[newIdx];
        if (onStepChange) onStepChange(s, newIdx);
        setLogs(prev => [...prev, { step: newIdx + 1, message: s.phase ?? s.label ?? `Step ${newIdx + 1}`, detail: s.detail ?? '' }]);
    }, []);

    const start = useCallback((stepsArr, speedMs, onStepChange) => {
        stepsRef.current = stepsArr;
        setSteps(stepsArr);
        setCurrentStep(-1); stepRef.current = -1;
        setIsRunning(true); setIsPaused(false); setIsFinished(false);
        setIsSimMode(true);
        setLogs([]);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => advanceStep(stepsRef.current, stepRef.current, onStepChange), speedMs);
    }, [advanceStep]);

    const pause = useCallback(() => {
        setIsRunning(false); setIsPaused(true); clearInterval(timerRef.current);
    }, []);

    const resume = useCallback((speedMs, onStepChange) => {
        setIsRunning(true); setIsPaused(false);
        timerRef.current = setInterval(() => advanceStep(stepsRef.current, stepRef.current, onStepChange), speedMs);
    }, [advanceStep]);

    const reset = useCallback(() => {
        clearInterval(timerRef.current);
        setSteps([]); stepsRef.current = [];
        setCurrentStep(-1); stepRef.current = -1;
        setIsRunning(false); setIsPaused(false); setIsFinished(false);
        setIsSimMode(false); setLogs([]);
    }, []);

    const stepForward = useCallback((onStepChange) => {
        setIsSimMode(true);
        advanceStep(stepsRef.current, stepRef.current, onStepChange);
    }, [advanceStep]);

    return {
        steps, currentStep, isRunning, isPaused, isFinished, isSimMode, logs,
        stepsRef, stepRef,
        start, pause, resume, reset, stepForward,
    };
}
