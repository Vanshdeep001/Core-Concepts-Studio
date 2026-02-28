import { motion } from 'framer-motion';

const STATS = [
    { key: 'avgWaitingTime', label: 'Avg Waiting', unit: 'units', color: 'yellow', decimals: 2 },
    { key: 'avgTurnaroundTime', label: 'Avg Turnaround', unit: 'units', color: 'cyan', decimals: 2 },
    { key: 'avgResponseTime', label: 'Avg Response', unit: 'units', color: 'pink', decimals: 2 },
    { key: 'cpuUtilization', label: 'CPU Utilization', unit: '%', color: 'green', decimals: 1 },
    { key: 'throughput', label: 'Throughput', unit: 'proc/unit', color: 'orange', decimals: 3 },
    { key: 'contextSwitches', label: 'Context Switches', unit: '', color: 'stat-card', decimals: 0 },
];

export default function MetricsSummary({ overall }) {
    if (!overall) return null;

    return (
        <div className="stat-cards">
            {STATS.map((stat, i) => (
                <motion.div
                    key={stat.key}
                    className={`stat-card ${stat.color}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.3 }}
                >
                    <div className="stat-card-label">{stat.label}</div>
                    <div className="stat-card-value">
                        {stat.decimals === 0
                            ? Number(overall[stat.key]).toFixed(0)
                            : Number(overall[stat.key]).toFixed(stat.decimals)}
                    </div>
                    {stat.unit && <div className="stat-card-unit">{stat.unit}</div>}
                </motion.div>
            ))}
        </div>
    );
}
