import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProcessInputForm from '../components/ProcessInputForm';
import AlgorithmSelector from '../components/AlgorithmSelector';
import CoreSelector from '../components/CoreSelector';
import SimulationControls from '../components/SimulationControls';
import ReadyQueueDisplay from '../components/ReadyQueueDisplay';
import RunningProcessDisplay from '../components/RunningProcessDisplay';
import LiveGanttChart from '../components/LiveGanttChart';
import LiveMetrics from '../components/LiveMetrics';
import MetricsTable from '../components/MetricsTable';
import RecommendationCard from '../components/RecommendationCard';
import useSimulator from '../hooks/useSimulator';
import { validateProcesses, getProcessColor } from '../utils/helpers';
import { recommend } from '../engine/recommendation';
import ImmersiveLayout from '../shared/ImmersiveLayout';

export default function SimulationPage() {
    const [conceptMode, setConceptMode] = useState(true);
    const [processes, setProcesses] = useState([
        { id: 'P1', arrivalTime: 0, burstTime: 8, priority: 3, color: getProcessColor(0) },
        { id: 'P2', arrivalTime: 1, burstTime: 4, priority: 1, color: getProcessColor(1) },
        { id: 'P3', arrivalTime: 2, burstTime: 9, priority: 2, color: getProcessColor(2) },
        { id: 'P4', arrivalTime: 3, burstTime: 5, priority: 4, color: getProcessColor(3) },
    ]);
    const [algorithm, setAlgorithm] = useState('FCFS');
    const [quantum, setQuantum] = useState(2);
    const [cores, setCores] = useState(1);
    const [errors, setErrors] = useState([]);
    const [activeTab, setActiveTab] = useState('gantt');
    const [recommendation, setRecommendation] = useState(null);

    const {
        simState, isRunning, isPaused, speed, finalMetrics,
        startSimulation, pauseSimulation, resumeSimulation,
        resetSimulation, stepSimulation, changeSpeed,
        SPEED_OPTIONS,
    } = useSimulator();

    const isActive = isRunning || isPaused;
    const isFinished = simState?.isFinished ?? false;

    const handleStart = () => {
        const errs = validateProcesses(processes);
        if (errs.length > 0) { setErrors(errs); return; }
        setErrors([]);
        setRecommendation(null);
        startSimulation(processes, algorithm, quantum, cores);
        // Generate recommendation in background
        try {
            setRecommendation(recommend(processes, { quantum }));
        } catch (_) { /* ignore */ }
    };

    // ─── IMMERSIVE MODE CONTENT ───
    const leftContent = simState && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="panel" style={{ background: 'rgba(52, 152, 219, 0.05)', borderStyle: 'dashed' }}>
                <div style={{ padding: '0.75rem' }}>
                    <RunningProcessDisplay
                        runningProcess={simState.runningProcess}
                        lastPreemption={simState.lastPreemption}
                        algorithm={algorithm}
                        quantumRemaining={simState.quantumRemaining}
                        quantum={quantum}
                    />
                </div>
            </div>

            <div className="panel">
                <div className="panel-header" style={{ fontSize: '0.7rem' }}>📥 Ready Queue</div>
                <div style={{ padding: '0.75rem' }}>
                    <ReadyQueueDisplay
                        readyQueue={simState.readyQueue}
                        currentTime={simState.currentTime}
                    />
                </div>
            </div>

            <div style={{ marginTop: 'auto' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.5rem' }}>Live Stats</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {[
                        { label: 'Time', val: `t = ${simState.currentTime}` },
                        { label: 'Context Sw.', val: simState.contextSwitches },
                        { label: 'Finished', val: `${simState.completedProcesses.length}/${simState.allProcesses.length}` },
                        { label: 'Alg.', val: algorithm },
                    ].map((s, i) => (
                        <div key={i} style={{ background: 'var(--white)', border: '2px solid var(--border)', padding: '0.4rem', borderRadius: '4px' }}>
                            <div style={{ fontSize: '0.55rem', fontWeight: 700, opacity: 0.5 }}>{s.label}</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>{s.val}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const centerContent = simState && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', padding: '0.5rem' }}>
            <div style={{ flex: 1, minHeight: 0 }}>
                <LiveGanttChart
                    ganttTimeline={simState.ganttTimeline}
                    processes={processes}
                    coresMode={simState.coresMode}
                    cores={simState.cores}
                    currentTime={simState.currentTime}
                />
            </div>

            <div style={{ height: '35%', borderTop: '2px solid var(--border)', paddingTop: '1rem', overflowY: 'auto' }}>
                <LiveMetrics simState={simState} finalMetrics={finalMetrics} />
            </div>
        </div>
    );

    const rightContent = simState && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
                background: 'var(--yellow)', border: '2px solid var(--border)', padding: '1rem',
                borderRadius: '8px', boxShadow: '3px 3px 0 var(--border)'
            }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6, marginBottom: '0.4rem' }}>
                    Algorithm logic
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.4 }}>
                    {algorithm === 'FCFS' && 'First-Come, First-Served: Non-preemptive. Simple queue based on arrival.'}
                    {algorithm === 'SJF' && 'Shortest Job First: Minimizes average waiting time by picking the shortest burst.'}
                    {algorithm === 'Round Robin' && `Time-Slicing: Each process gets ${quantum} units then moves to back of queue.`}
                    {algorithm === 'Priority' && 'Priority-Based: CPU is allocated to process with highest priority level.'}
                </div>
            </div>

            <div style={{ border: '2px solid var(--border)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6, marginBottom: '0.5rem' }}>
                    Educational Insight
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8, lineHeight: 1.5 }}>
                    {simState.runningProcess ? (
                        `CPU is currently executing ${simState.runningProcess.id}. It was chosen based on the ${algorithm} criteria.`
                    ) : (
                        'CPU is currently IDLE. It is waiting for the next process to arrive in the Ready Queue.'
                    )}
                </div>
            </div>

            {conceptMode && (
                <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--green)', marginBottom: '0.5rem' }}>
                        💡 Concept: Context Switch
                    </div>
                    <div style={{ fontSize: '0.78rem', background: 'rgba(46, 204, 113, 0.1)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--green)' }}>
                        When CPU moves from one process to another, it must save the state of the old one and load the state of the new one.
                    </div>
                </div>
            )}

            {simState.isFinished && recommendation && (
                <div style={{ marginTop: 'auto' }}>
                    <RecommendationCard recommendation={recommendation} />
                </div>
            )}
        </div>
    );

    const timelineItems = simState ? simState.ganttTimeline.map((item, idx) => ({
        id: idx,
        label: `${item.processId} [${item.startTime}-${item.endTime || '...'}]`,
        active: simState.currentTime >= item.startTime && (item.endTime === null || simState.currentTime < item.endTime),
        done: item.endTime !== null && simState.currentTime >= item.endTime
    })) : [];

    return (
        <ImmersiveLayout
            isActive={isActive}
            title={`${algorithm} Scheduler`}
            icon="🖥️"
            moduleLabel="OS Module"
            isRunning={isRunning}
            isPaused={isPaused}
            isFinished={isFinished}
            speed={speed}
            onSpeedChange={changeSpeed}
            onStart={handleStart}
            onPause={pauseSimulation}
            onResume={resumeSimulation}
            onReset={resetSimulation}
            onStep={stepSimulation}
            currentStepNum={simState ? simState.currentTime : 0}
            totalSteps={simState ? Math.max(simState.currentTime + 1, processes.reduce((acc, p) => acc + p.burstTime, 0)) : 10}
            phaseName={simState?.runningProcess ? `Executing ${simState.runningProcess.id}` : 'CPU Idle'}
            centerContent={centerContent}
            leftContent={leftContent}
            rightContent={rightContent}
            timelineItems={timelineItems.slice(-8)} // Show last 8 for clarity
            legend={[
                { color: 'var(--blue)', label: 'Ready' },
                { color: 'var(--red)', label: 'Running' },
                { color: 'var(--green)', label: 'Finished' }
            ]}
            conceptMode={conceptMode}
            onConceptModeToggle={() => setConceptMode(!conceptMode)}
        >
            <div className="main-content">
                {/* Header */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="section-header">CPU Scheduling Simulator</div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.15 }}>Real-Time Simulation</h1>
                    <p style={{ opacity: 0.65, fontSize: '0.9rem', marginTop: '0.3rem' }}>
                        Watch processes execute tick-by-tick, see the ready queue evolve, and observe preemption in real time.
                    </p>
                </div>

                {/* ─── Top Config Row ─── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.25rem', alignItems: 'start', marginBottom: '1.25rem' }}>
                    {/* Process Table */}
                    <div className="panel">
                        <div className="panel-header">📋 Process Table</div>
                        <div style={{ padding: '1rem' }}>
                            <ProcessInputForm
                                processes={processes}
                                onChange={procs => { setProcesses(procs); if (isActive) resetSimulation(); }}
                            />
                        </div>
                    </div>

                    {/* Config + Controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="panel">
                            <div className="panel-header">⚙ Algorithm</div>
                            <div style={{ padding: '1rem' }}>
                                <AlgorithmSelector
                                    algorithm={algorithm}
                                    quantum={quantum}
                                    onAlgorithmChange={a => { setAlgorithm(a); if (isActive) resetSimulation(); }}
                                    onQuantumChange={q => { setQuantum(q); if (isActive) resetSimulation(); }}
                                />
                            </div>
                        </div>
                        <div className="panel">
                            <div className="panel-header">🖥 Cores</div>
                            <div style={{ padding: '1rem' }}>
                                <CoreSelector cores={cores} onChange={c => { setCores(c); if (isActive) resetSimulation(); }} />
                            </div>
                        </div>
                        <div className="panel">
                            <div className="panel-header">🎮 Controls</div>
                            <div style={{ padding: '1rem' }}>
                                <SimulationControls
                                    isRunning={isRunning}
                                    isPaused={isPaused}
                                    isFinished={isFinished}
                                    speed={speed}
                                    speedOptions={SPEED_OPTIONS}
                                    onStart={handleStart}
                                    onPause={pauseSimulation}
                                    onResume={resumeSimulation}
                                    onReset={resetSimulation}
                                    onStep={stepSimulation}
                                    onSpeedChange={changeSpeed}
                                    canStart={processes.length > 0}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Errors */}
                {errors.length > 0 && (
                    <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                        {errors.map((e, i) => <div key={i}>⚠ {e}</div>)}
                    </div>
                )}

                <div className="alert alert-info">
                    💡 Click <strong>▶ Run Simulation</strong> to enter <strong>Immersive Mode</strong> (100vh full-screen visualization).
                </div>
            </div>
        </ImmersiveLayout>
    );
}
