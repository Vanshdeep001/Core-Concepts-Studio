import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShuffleIcon, ZapIcon, ScaleIcon, InboxIcon, SignalIcon, NetworkIcon } from '../../components/Icons';

const SYSTEM_DESIGN_SIMS = [
    {
        path: '/systemdesign/load-balancer',
        icon: ShuffleIcon,
        label: 'Load Balancers',
        desc: 'Simulate high-concurrency client requests and watch load balancing algorithms route traffic, execute periodic health checks, and manage dynamic server failover.',
        color: 'var(--yellow)',
        badge: 'Round Robin · Weighted RR · Least Connections · Health Checks · Failover',
    },
    {
        path: '/systemdesign/cache-redis',
        icon: ZapIcon,
        label: 'Caching & Redis',
        desc: 'Explore Cache Hits/Misses, read-through patterns, SQL Database fallbacks, and real-time LRU (Least Recently Used) cache evictions and TTL expirations.',
        color: 'var(--cyan)',
        badge: 'Cache Hits/Misses · TTL · LRU Eviction · Redis Memory Storage',
    },
    {
        path: '/systemdesign/db-scaling',
        icon: ScaleIcon,
        label: 'Database Scaling',
        desc: 'Scale data structures horizontally. Practice Primary-Replica write/read splitting, replication lag propagation, and multi-shard database hash routing.',
        color: 'var(--pink)',
        badge: 'Primary Node · Read Replicas · Replication Lag · Sharding · Hashing',
    },
    {
        path: '/systemdesign/message-queue',
        icon: InboxIcon,
        label: 'Message Queues',
        desc: 'Analyze asynchronous processing pipelines. Adjust producer rates and consumer delay thresholds to watch queue build-up, failed-message retries, and DLQ routing.',
        color: 'var(--green)',
        badge: 'Producers · Consumers · Queue Backlog · DLQ · Retries',
    },
    {
        path: '/systemdesign/api-lifecycle',
        icon: SignalIcon,
        label: 'API Request Lifecycle',
        desc: 'Trace a web packet from DNS lookup, through a Load Balancer and API Gateway, into Backend Services, cache checks, DB queries, and back as a response.',
        color: 'var(--purple)',
        badge: 'DNS · API Gateway · Auth · Cache Check · DB Queries · Latency Trace',
    },
    {
        path: '/systemdesign/microservices',
        icon: NetworkIcon,
        label: 'Microservices Fundamentals',
        desc: 'Orchestrate distributed workflows. Execute multi-step service orders, monitor inter-service communication, and trigger Circuit Breaker fail-fast resilience.',
        color: 'var(--orange)',
        badge: 'Monolith vs Microservices · Service Discovery · Circuit Breakers · Fault Tolerance',
    },
];

export default function SystemDesignLanding() {
    return (
        <div className="main-content">
            <div style={{ marginBottom: '2rem' }}>
                <div className="section-header">Module 6</div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>System Design & Architecture</h1>
                <p style={{ opacity: 0.6, fontSize: '0.92rem', marginTop: '0.3rem' }}>
                    Deconstruct distributed systems concepts through interactive sandboxes. Experiment with load balancers, caching evictions, sharding hash rings, message queues, lifecycle traces, and service mesh failures.
                </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gridAutoRows: '1fr', gap: '1.25rem' }}>
                {SYSTEM_DESIGN_SIMS.map((sim, i) => (
                    <motion.div key={sim.path} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} style={{ height: '100%' }}>
                        <Link to={sim.path} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
                            <div className="panel" style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', height: '100%', display: 'flex', flexDirection: 'column' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(4px,4px)'; e.currentTarget.style.boxShadow = 'none'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}>
                                <div className="panel-header" style={{ background: sim.color }}>
                                    <span style={{ display: 'flex', alignItems: 'center' }}>{sim.icon({ size: 18 })}</span> {sim.label}
                                </div>
                                <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <p style={{ fontSize: '0.85rem', opacity: 0.68, marginBottom: '0.75rem' }}>{sim.desc}</p>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', opacity: 0.7, marginBottom: '0.75rem' }}>{sim.badge}</div>
                                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}>
                                        Launch Sandbox <span>→</span>
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
