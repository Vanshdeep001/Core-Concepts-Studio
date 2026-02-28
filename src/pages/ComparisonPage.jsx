import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProcessInputForm from '../components/ProcessInputForm';
import ComparisonPanel from '../components/ComparisonPanel';
import { runSimulation, ALGORITHM_OPTIONS, ALGORITHM_LABELS } from '../engine/schedulerEngine';
import { validateProcesses, getProcessColor } from '../utils/helpers';

export default function ComparisonPage() {
    const [processes, setProcesses] = useState([
        { id: 'P1', arrivalTime: 0, burstTime: 8, priority: 3, color: getProcessColor(0) },
        { id: 'P2', arrivalTime: 1, burstTime: 4, priority: 1, color: getProcessColor(1) },
        { id: 'P3', arrivalTime: 2, burstTime: 9, priority: 2, color: getProcessColor(2) },
        { id: 'P4', arrivalTime: 3, burstTime: 5, priority: 4, color: getProcessColor(3) },
    ]);
    const [selectedAlgos, setSelectedAlgos] = useState(['FCFS', 'SJF', 'SRTF', 'RR']);
    const [quantum, setQuantum] = useState(2);
    const [results, setResults] = useState([]);
    const [errors, setErrors] = useState([]);
    const [running, setRunning] = useState(false);

    const toggleAlgo = (alg) => {
        setSelectedAlgos(prev =>
            prev.includes(alg) ? prev.filter(a => a !== alg) : [...prev, alg]
        );
    };

    const handleCompare = () => {
        const errs = validateProcesses(processes);
        if (errs.length > 0) { setErrors(errs); return; }
        if (selectedAlgos.length < 2) { setErrors(['Select at least 2 algorithms to compare.']); return; }
        setErrors([]);
        setRunning(true);
        setTimeout(() => {
            const res = [];
            for (const alg of selectedAlgos) {
                try {
                    res.push(runSimulation(alg, processes, { quantum }));
                } catch (e) {/* skip */ }
            }
            setResults(res);
            setRunning(false);
        }, 50);
    };

    return (
        <div className="main-content">
            <div style={{ marginBottom: '1.5rem' }}>
                <div className="section-header">Comparison Mode</div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Compare Algorithms</h1>
                <p style={{ opacity: 0.65, fontSize: '0.9rem', marginTop: '0.3rem' }}>
                    Run multiple scheduling algorithms on the same input and compare their performance.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start', marginBottom: '1.5rem' }}>
                {/* Processes */}
                <div className="panel">
                    <div className="panel-header">📋 Process Table</div>
                    <div style={{ padding: '1rem' }}>
                        <ProcessInputForm processes={processes} onChange={setProcesses} />
                    </div>
                </div>

                {/* Algorithm Multi-select */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="panel">
                        <div className="panel-header">⚖ Select Algorithms</div>
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {ALGORITHM_OPTIONS.map(alg => (
                                <label key={alg} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, padding: '0.3rem 0' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedAlgos.includes(alg)}
                                        onChange={() => toggleAlgo(alg)}
                                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--cyan)' }}
                                    />
                                    {ALGORITHM_LABELS[alg]}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Quantum for RR */}
                    {selectedAlgos.some(a => ['RR', 'MLFQ'].includes(a)) && (
                        <div className="panel">
                            <div className="panel-header">⏱ Time Quantum</div>
                            <div style={{ padding: '1rem' }}>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={quantum}
                                    min={1}
                                    onChange={e => setQuantum(Number(e.target.value))}
                                />
                                <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.3rem' }}>Applied to RR and MLFQ Q0</div>
                            </div>
                        </div>
                    )}

                    <button
                        className="btn btn-yellow btn-lg"
                        onClick={handleCompare}
                        disabled={running}
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        {running ? '⏳ Comparing...' : '⚖ Compare Now'}
                    </button>
                </div>
            </div>

            {errors.length > 0 && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                    {errors.map((e, i) => <div key={i}>⚠ {e}</div>)}
                </div>
            )}

            <AnimatePresence>
                {results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <hr className="neo-divider" />
                        <h2 className="section-title">Results</h2>
                        <ComparisonPanel results={results} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
