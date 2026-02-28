import { getProcessColor } from '../utils/helpers';

const COLUMNS = [
    { key: 'id', label: 'PID', type: 'text', width: '80px' },
    { key: 'arrivalTime', label: 'Arrival', type: 'number', width: '80px' },
    { key: 'burstTime', label: 'Burst', type: 'number', width: '80px' },
    { key: 'priority', label: 'Priority', type: 'number', width: '80px' },
];

export default function ProcessInputForm({ processes, onChange }) {
    const addRow = () => {
        const idx = processes.length;
        onChange([
            ...processes,
            {
                id: `P${idx + 1}`,
                arrivalTime: 0,
                burstTime: Math.floor(Math.random() * 6) + 2,
                priority: 1,
                color: getProcessColor(idx),
            },
        ]);
    };

    const removeRow = (idx) => {
        onChange(processes.filter((_, i) => i !== idx));
    };

    const updateRow = (idx, field, value) => {
        const updated = processes.map((p, i) => {
            if (i !== idx) return p;
            return {
                ...p,
                [field]: field === 'id' ? value : Number(value),
            };
        });
        onChange(updated);
    };

    const loadSample = () => {
        onChange([
            { id: 'P1', arrivalTime: 0, burstTime: 8, priority: 3, color: getProcessColor(0) },
            { id: 'P2', arrivalTime: 1, burstTime: 4, priority: 1, color: getProcessColor(1) },
            { id: 'P3', arrivalTime: 2, burstTime: 9, priority: 2, color: getProcessColor(2) },
            { id: 'P4', arrivalTime: 3, burstTime: 5, priority: 4, color: getProcessColor(3) },
            { id: 'P5', arrivalTime: 4, burstTime: 2, priority: 5, color: getProcessColor(4) },
        ]);
    };

    return (
        <div>
            <div style={{ overflowX: 'auto' }}>
                <table className="process-table-input">
                    <thead>
                        <tr>
                            <th style={{ width: '14px' }}>#</th>
                            {COLUMNS.map(col => (
                                <th key={col.key} style={{ width: col.width }}>{col.label}</th>
                            ))}
                            <th style={{ width: '40px' }}>Del</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processes.map((proc, idx) => (
                            <tr key={idx}>
                                <td>
                                    <div className="pid-cell">
                                        <div className="pid-swatch" style={{ background: proc.color }} />
                                    </div>
                                </td>
                                {COLUMNS.map(col => (
                                    <td key={col.key}>
                                        <input
                                            type={col.type}
                                            value={proc[col.key]}
                                            min={col.type === 'number' ? (col.key === 'burstTime' ? 1 : 0) : undefined}
                                            onChange={e => updateRow(idx, col.key, e.target.value)}
                                        />
                                    </td>
                                ))}
                                <td>
                                    <button
                                        className="btn btn-sm btn-pink"
                                        onClick={() => removeRow(idx)}
                                        title="Remove process"
                                    >✕</button>
                                </td>
                            </tr>
                        ))}
                        {processes.length === 0 && (
                            <tr>
                                <td colSpan={COLUMNS.length + 2} style={{ textAlign: 'center', padding: '1rem', opacity: 0.5 }}>
                                    No processes. Click "+ Add Process" or "Load Sample".
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <button className="btn btn-sm btn-cyan" onClick={addRow}>+ Add Process</button>
                <button className="btn btn-sm" onClick={loadSample}>📋 Load Sample</button>
                {processes.length > 0 && (
                    <button className="btn btn-sm" onClick={() => onChange([])}>🗑 Clear All</button>
                )}
            </div>
        </div>
    );
}
