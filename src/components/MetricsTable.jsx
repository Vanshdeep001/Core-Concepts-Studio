import { useState } from 'react';

const COLUMNS = [
    { key: 'id', label: 'PID' },
    { key: 'arrivalTime', label: 'Arrival' },
    { key: 'burstTime', label: 'Burst' },
    { key: 'completionTime', label: 'CT' },
    { key: 'turnaroundTime', label: 'TAT' },
    { key: 'waitingTime', label: 'WT' },
    { key: 'responseTime', label: 'RT' },
];

export default function MetricsTable({ perProcess }) {
    const [sortKey, setSortKey] = useState(null);
    const [sortAsc, setSortAsc] = useState(true);

    if (!perProcess || perProcess.length === 0) return null;

    const handleSort = (key) => {
        if (sortKey === key) setSortAsc(a => !a);
        else { setSortKey(key); setSortAsc(true); }
    };

    const sorted = [...perProcess].sort((a, b) => {
        if (!sortKey) return 0;
        const valA = a[sortKey], valB = b[sortKey];
        const cmp = typeof valA === 'string' ? valA.localeCompare(valB) : valA - valB;
        return sortAsc ? cmp : -cmp;
    });

    return (
        <div style={{ overflowX: 'auto' }}>
            <table className="neo-table">
                <thead>
                    <tr>
                        <th style={{ width: 14 }}></th>
                        {COLUMNS.map(col => (
                            <th
                                key={col.key}
                                onClick={() => handleSort(col.key)}
                                style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                                title={getColumnFull(col.key)}
                            >
                                {col.label}
                                {sortKey === col.key ? (sortAsc ? ' ▲' : ' ▼') : ''}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((proc) => (
                        <tr key={proc.id}>
                            <td>
                                <div style={{ width: 12, height: 12, background: proc.color, border: '2px solid var(--border)' }} />
                            </td>
                            {COLUMNS.map(col => (
                                <td key={col.key} style={{ fontFamily: col.key === 'id' ? 'var(--font-main)' : 'var(--font-mono)', fontWeight: col.key === 'id' ? 700 : 400 }}>
                                    {col.key === 'id' ? proc[col.key] : Number(proc[col.key]).toFixed(0)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <div style={{ fontSize: '0.72rem', opacity: 0.6, marginTop: '0.4rem' }}>
                CT = Completion Time · TAT = Turnaround Time · WT = Waiting Time · RT = Response Time
            </div>
        </div>
    );
}

function getColumnFull(key) {
    const map = {
        id: 'Process ID', arrivalTime: 'Arrival Time', burstTime: 'Burst Time',
        completionTime: 'Completion Time', turnaroundTime: 'Turnaround Time',
        waitingTime: 'Waiting Time', responseTime: 'Response Time',
    };
    return map[key] || key;
}
