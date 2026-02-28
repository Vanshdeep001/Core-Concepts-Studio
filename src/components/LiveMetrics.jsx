import { motion } from 'framer-motion';

export default function LiveMetrics({ simState, finalMetrics }) {
    const completed = simState?.completedProcesses ?? [];
    const currentTime = simState?.currentTime ?? 0;
    const contextSwitches = simState?.contextSwitches ?? 0;
    const readyQueue = simState?.readyQueue ?? [];
    const isFinished = simState?.isFinished ?? false;

    // Live averages from completed processes only
    const liveAvgWT = completed.length > 0
        ? completed.reduce((s, p) => s + (p.waitingTime || 0), 0) / completed.length
        : null;
    const liveAvgTAT = completed.length > 0
        ? completed.reduce((s, p) => s + (p.turnaroundTime || 0), 0) / completed.length
        : null;

    const stats = [
        {
            label: 'Current Time',
            value: currentTime,
            unit: 'units',
            color: 'cyan',
            decimals: 0,
        },
        {
            label: 'Completed',
            value: completed.length,
            unit: 'procs',
            color: 'green',
            decimals: 0,
        },
        {
            label: 'Waiting',
            value: readyQueue.length,
            unit: 'in queue',
            color: 'yellow',
            decimals: 0,
        },
        {
            label: 'Context Switches',
            value: contextSwitches,
            unit: '',
            color: 'pink',
            decimals: 0,
        },
        {
            label: isFinished ? 'Avg Wait (final)' : 'Avg Wait (live)',
            value: finalMetrics?.overall.avgWaitingTime ?? liveAvgWT,
            unit: 'units',
            color: 'orange',
            decimals: 2,
            na: liveAvgWT === null && !finalMetrics,
        },
        {
            label: isFinished ? 'Avg TAT (final)' : 'Avg TAT (live)',
            value: finalMetrics?.overall.avgTurnaroundTime ?? liveAvgTAT,
            unit: 'units',
            color: 'stat-card',
            decimals: 2,
            na: liveAvgTAT === null && !finalMetrics,
        },
        {
            label: 'CPU Utilization',
            value: finalMetrics?.overall.cpuUtilization ?? null,
            unit: '%',
            color: 'green',
            decimals: 1,
            na: !finalMetrics,
        },
        {
            label: 'Throughput',
            value: finalMetrics?.overall.throughput ?? null,
            unit: 'p/u',
            color: 'cyan',
            decimals: 3,
            na: !finalMetrics,
        },
    ];

    return (
        <div className="stat-cards">
            {stats.map((s, i) => (
                <motion.div
                    key={s.label}
                    className={`stat-card ${s.color}`}
                    animate={{ opacity: 1 }}
                    initial={{ opacity: 0 }}
                >
                    <div className="stat-card-label">{s.label}</div>
                    <div className="stat-card-value">
                        {s.na || s.value === null
                            ? <span style={{ fontSize: '1.2rem', opacity: 0.4 }}>—</span>
                            : s.decimals === 0
                                ? Number(s.value).toFixed(0)
                                : Number(s.value).toFixed(s.decimals)
                        }
                    </div>
                    {s.unit && !s.na && s.value !== null && (
                        <div className="stat-card-unit">{s.unit}</div>
                    )}
                </motion.div>
            ))}
        </div>
    );
}
