import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { mergeGanttBlocks } from '../utils/helpers';

const UNIT_WIDTH = 28; // px per time unit

export default function GanttChart({ gantt, processes }) {
    if (!gantt || gantt.length === 0) return null;

    const merged = mergeGanttBlocks(gantt);
    const totalTime = merged[merged.length - 1].end;
    const processColorMap = {};
    processes.forEach(p => { processColorMap[p.id] = p.color; });

    // Build tick positions — show every tick, skip if too dense
    const tickStep = totalTime > 60 ? Math.ceil(totalTime / 30) : 1;
    const ticks = [];
    for (let t = 0; t <= totalTime; t += tickStep) {
        ticks.push(t);
    }
    if (ticks[ticks.length - 1] !== totalTime) ticks.push(totalTime);

    return (
        <div className="gantt-container">
            {/* Chart row */}
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
                {/* Core label placeholder */}
                <div style={{ minWidth: 60, fontSize: '0.75rem', fontWeight: 700, borderRight: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--white)', border: '2px solid var(--border)' }}>
                    CPU
                </div>
                {/* Blocks */}
                <div className="gantt-track">
                    {merged.map((block, i) => {
                        const w = (block.end - block.start) * UNIT_WIDTH;
                        const isIdle = block.processId === 'IDLE';
                        const bg = isIdle ? undefined : processColorMap[block.processId] || '#ddd';
                        return (
                            <motion.div
                                key={i}
                                className={`gantt-block${isIdle ? ' idle' : ''}`}
                                style={{ width: w, minWidth: Math.max(w, 24), background: isIdle ? undefined : bg }}
                                initial={{ scaleX: 0, originX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: i * 0.04, duration: 0.25, ease: 'easeOut' }}
                                title={`${block.processId}: t=${block.start} → t=${block.end}`}
                            >
                                <span className="gantt-block-label">{isIdle ? 'IDLE' : block.processId}</span>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Timeline */}
            <div style={{ display: 'flex', marginLeft: 60 }}>
                {merged.map((block, i) => {
                    const w = (block.end - block.start) * UNIT_WIDTH;
                    return (
                        <div
                            key={i}
                            style={{
                                width: Math.max(w, 24), minWidth: Math.max(w, 24),
                                fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                                color: 'var(--text)', opacity: 0.7,
                                borderLeft: i === 0 ? '2px solid var(--border)' : '2px solid var(--border)',
                                paddingTop: '3px',
                                borderTop: '2px solid var(--border)',
                                background: 'var(--white)',
                            }}
                        >
                            {block.start}
                            {i === merged.length - 1 && (
                                <span style={{ float: 'right', paddingRight: 2 }}>{block.end}</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
