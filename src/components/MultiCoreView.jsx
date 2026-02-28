import GanttChart from './GanttChart';

export default function MultiCoreView({ coreResults, processes }) {
    if (!coreResults || coreResults.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {coreResults.map(core => (
                <div key={core.coreId}>
                    <div className="core-label">Core {core.coreId}</div>
                    {core.gantt && core.gantt.length > 0 ? (
                        <GanttChart gantt={core.gantt} processes={processes} />
                    ) : (
                        <div style={{ padding: '0.75rem', opacity: 0.5, fontSize: '0.85rem', border: '2px dashed var(--border)' }}>
                            No processes assigned to this core.
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
