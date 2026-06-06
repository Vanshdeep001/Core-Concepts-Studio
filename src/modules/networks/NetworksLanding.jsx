import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BoxIcon, HandshakeIcon, HashIcon, MapIcon, WorldIcon } from '../../components/Icons';

const NET_SIMS = [
    {
        path: '/networks/osi',
        icon: BoxIcon,
        label: 'OSI & TCP/IP Model',
        desc: 'Watch a packet descend the 7-layer OSI stack with encapsulation, travel the wire, and unwrap at the receiver \u2014 layer by layer.',
        color: 'var(--purple)',
        badge: 'Encapsulation \u00b7 PDU \u00b7 Protocol Stack \u00b7 Data Link \u00b7 Decapsulation',
    },
    {
        path: '/networks/tcp-udp',
        icon: HandshakeIcon,
        label: 'TCP vs UDP & 3-Way Handshake',
        desc: 'Vertical sequence diagram \u2014 SYN/ACK arrows, packet drops, retransmissions, congestion control sawtooth, and side-by-side protocol comparison.',
        color: 'var(--cyan)',
        badge: 'SYN \u00b7 ACK \u00b7 Window \u00b7 Congestion \u00b7 Reliability \u00b7 Stateless',
    },
    {
        path: '/networks/subnetting',
        icon: HashIcon,
        label: 'IP Addressing & Subnetting',
        desc: 'Interactive 32-bit grid with CIDR slider, VLSM address-space bar, subnetting quiz mode, and IPv4 \u2194 IPv6 toggle.',
        color: 'var(--orange)',
        badge: 'Network bits \u00b7 Host bits \u00b7 CIDR \u00b7 VLSM \u00b7 Broadcast \u00b7 Subnetting',
    },
    {
        path: '/networks/routing',
        icon: MapIcon,
        label: 'Routing Algorithms',
        desc: 'Draggable router topology \u2014 run Dijkstra or Bellman-Ford step-by-step, cut links for live rerouting, compare OSPF vs RIP vs BGP.',
        color: 'var(--green)',
        badge: 'Dijkstra \u00b7 Bellman-Ford \u00b7 Link State \u00b7 Distance Vector \u00b7 OSPF \u00b7 RIP',
    },
    {
        path: '/networks/http-dns',
        icon: WorldIcon,
        label: 'HTTP/HTTPS & DNS',
        desc: 'Type a URL and watch the full journey \u2014 DNS resolution chain, TLS handshake comic strip, HTTP request/response, waterfall timeline, and failure injection.',
        color: 'var(--pink)',
        badge: 'DNS \u00b7 TLS \u00b7 Handshake \u00b7 Status codes \u00b7 TTFB \u00b7 Waterfall \u00b7 Cache',
    },
];

export default function NetworksLanding() {
    return (
        <div className="main-content">

            <div style={{ marginBottom: '2rem' }}>
                <div className="section-header">Module 3</div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Computer Networks</h1>
                <p style={{ opacity: 0.6, fontSize: '0.92rem', marginTop: '0.3rem' }}>
                    Visualize network protocols from the OSI stack to HTTP \u2014 packet encapsulation, TCP handshakes, IP subnetting, routing algorithms, and DNS resolution.
                </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gridAutoRows: '1fr', gap: '1.25rem' }}>
                {NET_SIMS.map((sim, i) => (
                    <motion.div key={sim.path} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} style={{ height: '100%' }}>
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

                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
