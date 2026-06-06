import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GearIcon, FileIcon, ShieldIcon, DiskIcon, SyncIcon } from '../../components/Icons';

const OS_SIMS = [
    {
        path: '/os/scheduling',
        icon: GearIcon,
        label: 'Process Scheduling',
        desc: 'FCFS \u00b7 SJF \u00b7 SRTF \u00b7 Priority \u00b7 Round Robin \u00b7 MLFQ \u2014 tick-by-tick Gantt chart',
        color: 'var(--yellow)',
        badge: 'Preemption \u00b7 Context Switch',
    },
    {
        path: '/os/page-replacement',
        icon: FileIcon,
        label: 'Page Replacement',
        desc: 'FIFO \u00b7 LRU \u00b7 Optimal \u00b7 LFU \u2014 simulate frame table and page fault counting',
        color: 'var(--cyan)',
        badge: 'Hit/Miss \u00b7 Victim Page',
    },
    {
        path: '/os/bankers',
        icon: ShieldIcon,
        label: "Banker's Algorithm",
        desc: 'Deadlock avoidance \u2014 need matrix, safe sequence, unsafe state detection',
        color: 'var(--pink)',
        badge: 'Safe Sequence \u00b7 Deadlock',
    },
    {
        path: '/os/disk',
        icon: DiskIcon,
        label: 'Disk Scheduling',
        desc: 'FCFS \u00b7 SSTF \u00b7 SCAN \u00b7 C-SCAN \u2014 animated head movement across track 0\u2013199',
        color: 'var(--green)',
        badge: 'Seek Time \u00b7 Head Position',
    },
    {
        path: '/os/sync',
        icon: SyncIcon,
        label: 'Process Synchronization',
        desc: 'Race conditions, critical sections, Mutex vs Semaphore sandbox, classic IPC, and failure modes.',
        color: 'var(--purple)',
        badge: 'Race Condition \u00b7 Semaphore \u00b7 Deadlock',
    },
];

export default function OSLanding() {
    return (
        <div className="main-content">

            <div style={{ marginBottom: '2rem' }}>
                <div className="section-header">Module 1</div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Operating Systems</h1>
                <p style={{ opacity: 0.6, fontSize: '0.92rem', marginTop: '0.3rem' }}>
                    Simulate core OS algorithms step-by-step \u2014 process scheduling, memory management, deadlock avoidance, and disk I/O.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gridAutoRows: '1fr', gap: '1.25rem' }}>
                {OS_SIMS.map((sim, i) => (
                    <motion.div key={sim.path} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} style={{ height: '100%' }}>
                        <Link to={sim.path} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
                            <div
                                className="panel"
                                style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', height: '100%', display: 'flex', flexDirection: 'column' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(4px,4px)'; e.currentTarget.style.boxShadow = 'none'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
                            >
                                <div className="panel-header" style={{ background: sim.color }}>
                                    <span style={{ display: 'flex', alignItems: 'center' }}>{sim.icon({ size: 18 })}</span> {sim.label}
                                </div>
                                <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <p style={{ fontSize: '0.85rem', opacity: 0.68, marginBottom: '0.75rem' }}>{sim.desc}</p>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', opacity: 0.7, marginBottom: '0.75rem' }}>
                                        {sim.badge}
                                    </div>

                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
