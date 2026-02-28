import { ALGORITHM_LABELS } from '../engine/schedulerEngine';
import GanttChart from './GanttChart';

const METRICS = [
    { key: 'avgWaitingTime', label: 'Avg WT' },
    { key: 'avgTurnaroundTime', label: 'Avg TAT' },
    { key: 'avgResponseTime', label: 'Avg RT' },
    { key: 'cpuUtilization', label: 'CPU %' },
    { key: 'contextSwitches', label: 'CS' },
];

export default function ComparisonPanel({ results }) {
    if (!results || results.length === 0) return null;

    // Find best (lowest) avgWaitingTime
    const bestWT = Math.min(...results.map(r => r.metrics.overall.avgWaitingTime));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Comparison Table */}
            <div>
                <div className="panel-header">📊 Algorithm Comparison</div>
                <div className="comparison-table-wrapper">
                    <table className="neo-table">
                        <thead>
                            <tr>
                                <th>Algorithm</th>
                                {METRICS.map(m => <th key={m.key}>{m.label}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {[...results]
                                .sort((a, b) => a.metrics.overall.avgWaitingTime - b.metrics.overall.avgWaitingTime)
                                .map((r, i) => {
                                    const isBest = r.metrics.overall.avgWaitingTime === bestWT;
                                    return (
                                        <tr key={r.algorithmName} className={isBest ? 'comparison-best' : ''}>
                                            <td style={{ fontWeight: 700 }}>
                                                {isBest ? '🏆 ' : `#${i + 1} `}
                                                {ALGORITHM_LABELS[r.algorithmName]}
                                            </td>
                                            {METRICS.map(m => (
                                                <td
                                                    key={m.key}
                                                    style={{ fontFamily: 'var(--font-mono)' }}
                                                >
                                                    {m.key === 'contextSwitches'
                                                        ? r.metrics.overall[m.key]
                                                        : Number(r.metrics.overall[m.key]).toFixed(2)
                                                    }
                                                    {m.key === 'cpuUtilization' ? '%' : ''}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })
                            }
                        </tbody>
                    </table>
                </div>
                <div style={{ fontSize: '0.72rem', opacity: 0.6, marginTop: '0.4rem' }}>
                    WT = Waiting Time · TAT = Turnaround Time · RT = Response Time · CS = Context Switches
                </div>
            </div>

            {/* Per-Algorithm Gantt Charts */}
            {results.map(r => (
                <div key={r.algorithmName}>
                    <div className="panel-header" style={{ marginBottom: '0.5rem' }}>
                        {ALGORITHM_LABELS[r.algorithmName]} — Gantt Chart
                    </div>
                    <GanttChart gantt={r.gantt} processes={r.processes} />
                </div>
            ))}
        </div>
    );
}
