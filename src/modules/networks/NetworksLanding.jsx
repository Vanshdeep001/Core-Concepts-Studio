import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NET_SIMS = [
    {
        path: '/networks/osi',
        icon: '📦',
        label: 'OSI & TCP/IP Model',
        desc: 'Watch a packet descend the 7-layer OSI stack with encapsulation, travel the wire, and unwrap at the receiver — layer by layer.',
        color: 'var(--purple)',
        badge: 'Encapsulation · PDU · Protocol Stack · Data Link · Decapsulation',
    },
    {
        path: '/networks/tcp-udp',
        icon: '🤝',
        label: 'TCP vs UDP & 3-Way Handshake',
        desc: 'Vertical sequence diagram — SYN/ACK arrows, packet drops, retransmissions, congestion control sawtooth, and side-by-side protocol comparison.',
        color: 'var(--cyan)',
        badge: 'SYN · ACK · Window · Congestion · Reliability · Stateless',
    },
    {
        path: '/networks/subnetting',
        icon: '🔢',
        label: 'IP Addressing & Subnetting',
        desc: 'Interactive 32-bit grid with CIDR slider, VLSM address-space bar, subnetting quiz mode, and IPv4 ↔ IPv6 toggle.',
        color: 'var(--orange)',
        badge: 'Network bits · Host bits · CIDR · VLSM · Broadcast · Subnetting',
    },
    {
        path: '/networks/routing',
        icon: '🗺',
        label: 'Routing Algorithms',
        desc: 'Draggable router topology — run Dijkstra or Bellman-Ford step-by-step, cut links for live rerouting, compare OSPF vs RIP vs BGP.',
        color: 'var(--green)',
        badge: 'Dijkstra · Bellman-Ford · Link State · Distance Vector · OSPF · RIP',
    },
    {
        path: '/networks/http-dns',
        icon: '🌍',
        label: 'HTTP/HTTPS & DNS',
        desc: 'Type a URL and watch the full journey — DNS resolution chain, TLS handshake comic strip, HTTP request/response, waterfall timeline, and failure injection.',
        color: 'var(--pink)',
        badge: 'DNS · TLS · Handshake · Status codes · TTFB · Waterfall · Cache',
    },
];

export default function NetworksLanding() {
    return (
        <div className="main-content">
            <div style={{ marginBottom: '0.4rem' }}>
                <Link to="/" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← All Modules</Link>
            </div>
            <div style={{ marginBottom: '2rem' }}>
                <div className="section-header">Module 3</div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>🌐 Computer Networks</h1>
                <p style={{ opacity: 0.6, fontSize: '0.92rem', marginTop: '0.3rem' }}>
                    Visualize network protocols from the OSI stack to HTTP — packet encapsulation, TCP handshakes, IP subnetting, routing algorithms, and DNS resolution.
                </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {NET_SIMS.map((sim, i) => (
                    <motion.div key={sim.path} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <Link to={sim.path} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                            <div className="panel" style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(4px,4px)'; e.currentTarget.style.boxShadow = 'none'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}>
                                <div className="panel-header" style={{ background: sim.color }}>
                                    <span style={{ fontSize: '1.1rem' }}>{sim.icon}</span> {sim.label}
                                </div>
                                <div style={{ padding: '1rem' }}>
                                    <p style={{ fontSize: '0.85rem', opacity: 0.68, marginBottom: '0.75rem' }}>{sim.desc}</p>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', opacity: 0.7, marginBottom: '0.75rem' }}>{sim.badge}</div>
                                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Launch →</span>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
