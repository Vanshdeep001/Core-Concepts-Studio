import { motion, AnimatePresence } from 'framer-motion';

const UNIT_PX = 26;

export default function LiveGanttChart({ ganttTimeline, processes, coresMode, cores, currentTime }) {
    if (!ganttTimeline && !coresMode) return null;

    const processColorMap = {};
    (processes || []).forEach(p => { processColorMap[p.id] = p.color; });

    if (coresMode && cores) {
        // Build per-core gantt from the flat ganttTimeline with coreId
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {cores.map(core => {
                    const coreGantt = (ganttTimeline || []).filter(g => g.coreId === core.id);
                    return (
                        <div key={core.id}>
                            <div className="core-label">Core {core.id}</div>
                            <GanttRow gantt={coreGantt} processColorMap={processColorMap} currentTime={currentTime} />
                        </div>
                    );
                })}
                <TimeRuler maxTime={currentTime} />
            </div>
        );
    }

    return (
        <div>
            <GanttRow gantt={ganttTimeline || []} processColorMap={processColorMap} currentTime={currentTime} />
            <TimeRuler maxTime={currentTime} />
        </div>
    );
}

function GanttRow({ gantt, processColorMap, currentTime }) {
    if (gantt.length === 0) {
        return (
            <div style={{ border: '2px dashed var(--border)', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4, fontSize: '0.8rem' }}>
                Waiting for first tick…
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', alignItems: 'stretch', overflowX: 'auto' }}>
            <div style={{
                minWidth: 50, width: 50, flexShrink: 0,
                border: '2px solid var(--border)', borderRight: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.72rem', background: 'var(--white)',
            }}>CPU</div>

            <div style={{ display: 'flex', flex: 1 }}>
                <AnimatePresence initial={false}>
                    {gantt.map((block, i) => {
                        const w = Math.max((block.end - block.start) * UNIT_PX, 26);
                        const isIdle = block.processId === 'IDLE' || block.processId?.includes('IDLE');
                        const bg = isIdle ? '#e0e0e0' : (processColorMap[block.processId] || block.color || '#ddd');
                        return (
                            <motion.div
                                key={`${block.processId}-${block.start}`}
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: w, opacity: 1 }}
                                transition={{ duration: 0.18, ease: 'easeOut' }}
                                style={{
                                    height: 52, width: w, minWidth: w,
                                    background: bg,
                                    border: '2px solid var(--border)',
                                    borderLeft: i === 0 ? '2px solid var(--border)' : 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, fontSize: '0.72rem',
                                    position: 'relative', overflow: 'hidden',
                                    flexShrink: 0,
                                    color: isIdle ? '#888' : 'inherit',
                                }}
                                title={`${block.processId}: t=${block.start}→${block.end}`}
                            >
                                {block.processId.replace('-IDLE', '')}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Current time marker */}
                <div style={{
                    width: 3, background: 'var(--pink)', flexShrink: 0,
                    position: 'relative', alignSelf: 'stretch',
                }}>
                    <span style={{
                        position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)',
                        fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap',
                        color: 'var(--pink)',
                    }}>t={currentTime}</span>
                </div>
            </div>
        </div>
    );
}

function TimeRuler({ maxTime }) {
    if (!maxTime) return null;
    const ticks = [];
    const step = maxTime > 50 ? Math.ceil(maxTime / 25) : 1;
    for (let t = 0; t <= maxTime; t += step) ticks.push(t);

    return (
        <div style={{ display: 'flex', marginLeft: 50, overflowX: 'auto' }}>
            {ticks.map((t, i) => (
                <div key={t} style={{
                    width: i === 0 ? UNIT_PX * step : UNIT_PX * step,
                    minWidth: UNIT_PX * step,
                    fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
                    borderLeft: '1px solid var(--border)',
                    paddingTop: 2, opacity: 0.6, flexShrink: 0,
                }}>
                    {t}
                </div>
            ))}
        </div>
    );
}
