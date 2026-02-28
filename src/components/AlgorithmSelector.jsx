import { ALGORITHM_LABELS, ALGORITHM_OPTIONS } from '../engine/schedulerEngine';

const NEEDS_QUANTUM = ['RR', 'MLFQ'];
const NEEDS_PREEMPTION_NOTE = ['PRIORITY_NP', 'PRIORITY_P'];

export default function AlgorithmSelector({ algorithm, quantum, onAlgorithmChange, onQuantumChange }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
                <label className="form-label">Algorithm</label>
                <select
                    className="form-select"
                    value={algorithm}
                    onChange={e => onAlgorithmChange(e.target.value)}
                >
                    {ALGORITHM_OPTIONS.map(alg => (
                        <option key={alg} value={alg}>{ALGORITHM_LABELS[alg]}</option>
                    ))}
                </select>
            </div>

            {NEEDS_QUANTUM.includes(algorithm) && (
                <div>
                    <label className="form-label">Time Quantum</label>
                    <input
                        type="number"
                        className="form-input"
                        min="1"
                        max="100"
                        value={quantum}
                        onChange={e => onQuantumChange(Number(e.target.value))}
                    />
                </div>
            )}

            {/* Algorithm description */}
            <div style={{ fontSize: '0.8rem', opacity: 0.7, background: 'rgba(102,217,239,0.12)', padding: '0.5rem 0.75rem', borderLeft: '3px solid #66d9ef' }}>
                {getAlgorithmDescription(algorithm)}
            </div>
        </div>
    );
}

function getAlgorithmDescription(algo) {
    const descriptions = {
        FCFS: 'Processes execute in order of arrival. Simple but may cause convoy effect.',
        SJF: 'Selects process with shortest burst time available. Minimizes average wait.',
        SRTF: 'Preemptive SJF — switches to shorter job when it arrives. Optimal average wait.',
        PRIORITY_NP: 'Priority-based selection, non-preemptive. Lower number = higher priority.',
        PRIORITY_P: 'Priority-based, preemptive. Higher priority process can preempt running one.',
        RR: 'Each process gets a fixed time quantum cyclically. Fair, good for time-sharing.',
        MLFQ: '3-level queue: Q0 (RR q=4) → Q1 (RR q=8) → Q2 (FCFS). Adapts to behavior.',
    };
    return descriptions[algo] || '';
}
