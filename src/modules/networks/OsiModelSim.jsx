import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import { BoxIcon } from '../../components/Icons';

/* ════════════════════════════════════════
   DATA — OSI layers, protocols, PDU fields
   ════════════════════════════════════════ */
const OSI_LAYERS = [
    { id: 7, name: 'Application',   color: '#b39ddb', pdu: 'Data',    tcpip: 'Application',  protocols: ['HTTP','HTTPS','FTP','SMTP','DNS','SSH','Telnet','SNMP'], headerSize: 0 },
    { id: 6, name: 'Presentation',  color: '#ce93d8', pdu: 'Data',    tcpip: 'Application',  protocols: ['SSL/TLS','JPEG','MPEG','ASCII','EBCDIC','GIF'], headerSize: 0 },
    { id: 5, name: 'Session',       color: '#ef9a9a', pdu: 'Data',    tcpip: 'Application',  protocols: ['NetBIOS','RPC','PPTP','SAP','SDP'], headerSize: 0 },
    { id: 4, name: 'Transport',     color: '#90caf9', pdu: 'Segment', tcpip: 'Transport',     protocols: ['TCP','UDP','SCTP','DCCP'], headerSize: 20 },
    { id: 3, name: 'Network',       color: '#a5d6a7', pdu: 'Packet',  tcpip: 'Internet',      protocols: ['IP','ICMP','ARP','RARP','IGMP','OSPF','BGP'], headerSize: 20 },
    { id: 2, name: 'Data Link',     color: '#ffcc80', pdu: 'Frame',   tcpip: 'Network Access', protocols: ['Ethernet','PPP','HDLC','Frame Relay','Wi-Fi','ARP'], headerSize: 18 },
    { id: 1, name: 'Physical',      color: '#ffab91', pdu: 'Bits',    tcpip: 'Network Access', protocols: ['RS-232','RJ45','V.35','100BaseTX','DSL','ISDN','USB'], headerSize: 0 },
];

const TCPIP_LAYERS = [
    { id: 4, name: 'Application',    color: '#b39ddb', osiLayers: [7,6,5], pdu: 'Data' },
    { id: 3, name: 'Transport',      color: '#90caf9', osiLayers: [4],     pdu: 'Segment' },
    { id: 2, name: 'Internet',       color: '#a5d6a7', osiLayers: [3],     pdu: 'Packet' },
    { id: 1, name: 'Network Access', color: '#ffcc80', osiLayers: [2,1],   pdu: 'Frame' },
];

const PROTOCOL_FIELDS = {
    TCP: [
        { name: 'Src Port', bits: 16, color: '#90caf9' }, { name: 'Dst Port', bits: 16, color: '#64b5f6' },
        { name: 'Seq Number', bits: 32, color: '#42a5f5' }, { name: 'Ack Number', bits: 32, color: '#2196f3' },
        { name: 'Offset', bits: 4, color: '#bbdefb' }, { name: 'Flags', bits: 12, color: '#1e88e5' },
        { name: 'Window', bits: 16, color: '#1565c0' }, { name: 'Checksum', bits: 16, color: '#0d47a1' },
        { name: 'Urgent Ptr', bits: 16, color: '#82b1ff' },
    ],
    UDP: [
        { name: 'Src Port', bits: 16, color: '#90caf9' }, { name: 'Dst Port', bits: 16, color: '#64b5f6' },
        { name: 'Length', bits: 16, color: '#42a5f5' }, { name: 'Checksum', bits: 16, color: '#2196f3' },
    ],
    IP: [
        { name: 'Version', bits: 4, color: '#a5d6a7' }, { name: 'IHL', bits: 4, color: '#81c784' },
        { name: 'ToS', bits: 8, color: '#66bb6a' }, { name: 'Total Len', bits: 16, color: '#4caf50' },
        { name: 'ID', bits: 16, color: '#43a047' }, { name: 'Flags', bits: 3, color: '#388e3c' },
        { name: 'Frag Offset', bits: 13, color: '#2e7d32' }, { name: 'TTL', bits: 8, color: '#1b5e20' },
        { name: 'Protocol', bits: 8, color: '#c8e6c9' }, { name: 'Checksum', bits: 16, color: '#a5d6a7' },
        { name: 'Src IP', bits: 32, color: '#69f0ae' }, { name: 'Dst IP', bits: 32, color: '#00e676' },
    ],
    Ethernet: [
        { name: 'Preamble', bits: 56, color: '#ffcc80' }, { name: 'SFD', bits: 8, color: '#ffb74d' },
        { name: 'Dst MAC', bits: 48, color: '#ffa726' }, { name: 'Src MAC', bits: 48, color: '#ff9800' },
        { name: 'EtherType', bits: 16, color: '#fb8c00' }, { name: 'Payload', bits: 'var', color: '#f57c00' },
        { name: 'FCS', bits: 32, color: '#ef6c00' },
    ],
    HTTP: [
        { name: 'Method', bits: 'var', color: '#b39ddb' }, { name: 'URL', bits: 'var', color: '#9575cd' },
        { name: 'Version', bits: 'var', color: '#7e57c2' }, { name: 'Headers', bits: 'var', color: '#673ab7' },
        { name: 'Body', bits: 'var', color: '#5e35b1' },
    ],
};

const PAYLOAD = 'Hello';
const PAYLOAD_SIZE = 5;

/* ════════════════════════════════════════
   BUILD simulation steps
   ════════════════════════════════════════ */
function buildSteps() {
    const steps = [];
    let totalSize = PAYLOAD_SIZE;
    const headers = [];

    // Encapsulation: descend L7 → L1
    for (let i = 0; i < OSI_LAYERS.length; i++) {
        const layer = OSI_LAYERS[i];
        if (layer.headerSize > 0) {
            totalSize += layer.headerSize;
            headers.push(`L${layer.id} +${layer.headerSize}B`);
        }
        steps.push({
            phase: 'encapsulate',
            layerIdx: i,
            layerId: layer.id,
            layerName: layer.name,
            pdu: layer.pdu,
            totalSize,
            headers: [...headers],
            side: 'sender',
            explanation: layer.id === 7
                ? `Application layer receives payload "${PAYLOAD}" (${PAYLOAD_SIZE} bytes). This is the raw data to be sent.`
                : layer.id === 4
                ? `Transport layer adds TCP header (20 bytes): source/destination ports, sequence number, flags. PDU is now a Segment (${totalSize} bytes).`
                : layer.id === 3
                ? `Network layer adds IP header (20 bytes): source/destination IP addresses, TTL, protocol field. PDU is now a Packet (${totalSize} bytes).`
                : layer.id === 2
                ? `Data Link layer adds Ethernet header (14 bytes) + trailer FCS (4 bytes): MAC addresses, EtherType. PDU is now a Frame (${totalSize} bytes).`
                : layer.id === 1
                ? `Physical layer converts the frame into a raw bitstream for transmission over the medium.`
                : `${layer.name} layer processes the data. Encapsulation continues.`,
            insight: layer.id === 7
                ? 'ENCAPSULATION: Each layer adds its own header (and sometimes trailer) to the data from the layer above, wrapping it like nested envelopes.'
                : layer.id === 4
                ? 'SEGMENT: The Transport layer breaks data into segments and adds port numbers for process-to-process delivery.'
                : layer.id === 3
                ? 'PACKET: The Network layer adds logical addressing (IP) for host-to-host delivery across networks.'
                : layer.id === 2
                ? 'FRAME: The Data Link layer adds physical addressing (MAC) for hop-to-hop delivery on the local network.'
                : layer.id === 1
                ? 'BITS: The Physical layer deals with raw bit transmission — voltage levels, cable specs, encoding schemes.'
                : `The ${layer.name} layer handles ${layer.pdu} formatting.`,
        });
    }

    // Transit across wire
    steps.push({
        phase: 'transit',
        hopNum: 0,
        totalHops: 3,
        totalSize,
        headers: [...headers],
        side: 'wire',
        explanation: 'The bitstream is transmitted across the physical medium (cable, fiber, wireless) toward the first network device.',
        insight: 'TRANSMISSION MEDIUM: Data travels as electrical signals (copper), light pulses (fiber), or radio waves (wireless).',
    });

    // Router hop — peeks at L3
    steps.push({
        phase: 'router',
        hopNum: 1,
        totalHops: 3,
        peekLayer: 3,
        totalSize,
        headers: [...headers],
        side: 'wire',
        explanation: 'Router receives the frame, strips L2 header, examines L3 (IP) to determine the next hop. Re-encapsulates with new L2 header for the next link.',
        insight: 'ROUTER: Operates at Layer 3. It decapsulates only up to the Network layer to read the destination IP and make forwarding decisions.',
    });

    // Switch hop — peeks at L2
    steps.push({
        phase: 'switch',
        hopNum: 2,
        totalHops: 3,
        peekLayer: 2,
        totalSize,
        headers: [...headers],
        side: 'wire',
        explanation: 'Switch receives the frame and reads L2 (MAC address) to forward the frame out the correct port. Does not inspect L3.',
        insight: 'SWITCH: Operates at Layer 2. Uses MAC address table to forward frames. Faster than routers because no L3 processing.',
    });

    // Arrive at receiver
    steps.push({
        phase: 'arrive',
        totalSize,
        headers: [...headers],
        side: 'wire',
        explanation: 'The frame arrives at the destination host. Decapsulation begins — each layer strips its header in reverse order.',
        insight: 'DECAPSULATION: The reverse of encapsulation. Each layer reads and removes its header, passing the remaining data up.',
    });

    // Decapsulation: ascend L1 → L7
    for (let i = OSI_LAYERS.length - 1; i >= 0; i--) {
        const layer = OSI_LAYERS[i];
        if (layer.headerSize > 0) {
            totalSize -= layer.headerSize;
            headers.pop();
        }
        steps.push({
            phase: 'decapsulate',
            layerIdx: i,
            layerId: layer.id,
            layerName: layer.name,
            pdu: layer.pdu,
            totalSize,
            headers: [...headers],
            side: 'receiver',
            explanation: layer.id === 1
                ? 'Physical layer receives the raw bitstream and converts it back into a frame for the Data Link layer.'
                : layer.id === 2
                ? `Data Link layer strips Ethernet header/trailer, verifies FCS checksum. Passes the Packet up (${totalSize} bytes remaining).`
                : layer.id === 3
                ? `Network layer strips IP header, checks destination IP matches this host. Passes the Segment up (${totalSize} bytes remaining).`
                : layer.id === 4
                ? `Transport layer strips TCP header, reassembles segments in order, verifies checksum. Passes Data up (${totalSize} bytes remaining).`
                : layer.id === 7
                ? `Application layer receives the original payload: "${PAYLOAD}" — message delivered successfully!`
                : `${layer.name} layer processes and passes data upward.`,
            insight: layer.id === 7
                ? `DELIVERY COMPLETE: The original "${PAYLOAD}" message has been fully decapsulated and delivered to the application.`
                : `Layer ${layer.id} (${layer.name}) removes its header and delivers the ${layer.pdu} to the layer above.`,
        });
    }

    steps.push({
        phase: 'done',
        totalSize: PAYLOAD_SIZE,
        headers: [],
        side: 'receiver',
        explanation: `Transmission complete! "${PAYLOAD}" traveled through all 7 OSI layers, across the network, and was delivered intact.`,
        insight: 'The OSI model provides a universal framework for understanding how different protocols work together at each layer of network communication.',
    });

    return steps;
}

/* ════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════ */
export default function OsiModelSim() {
    const [speed, setSpeed] = useState(700);
    const [steps] = useState(() => buildSteps());
    const [currentStep, setCurrentStep] = useState(-1);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [isSimMode, setIsSimMode] = useState(false);
    const [viewMode, setViewMode] = useState('osi'); // 'osi' | 'tcpip'
    const [expandedLayer, setExpandedLayer] = useState(null);
    const [selectedProtocol, setSelectedProtocol] = useState(null);
    const [conceptMode, setConceptMode] = useState(false);

    const timerRef = useRef(null);
    const stepRef = useRef(-1);

    const curStep = currentStep >= 0 && currentStep < steps.length ? steps[currentStep] : null;

    const advanceStep = useCallback(() => {
        const next = stepRef.current + 1;
        if (next >= steps.length) {
            setCurrentStep(steps.length - 1);
            setIsRunning(false);
            setIsFinished(true);
            clearInterval(timerRef.current);
            return;
        }
        setCurrentStep(next);
        stepRef.current = next;
    }, [steps]);

    const handleStart = () => {
        setCurrentStep(-1); stepRef.current = -1;
        setIsRunning(true); setIsPaused(false); setIsFinished(false); setIsSimMode(true);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(advanceStep, speed);
    };
    const handlePause = () => { setIsRunning(false); setIsPaused(true); clearInterval(timerRef.current); };
    const handleResume = () => { setIsRunning(true); setIsPaused(false); timerRef.current = setInterval(advanceStep, speed); };
    const handleReset = () => { clearInterval(timerRef.current); setCurrentStep(-1); stepRef.current = -1; setIsRunning(false); setIsPaused(false); setIsFinished(false); setIsSimMode(false); setExpandedLayer(null); setSelectedProtocol(null); };
    const handleStep = () => { if (!isSimMode) { setIsSimMode(true); stepRef.current = -1; } advanceStep(); };

    useEffect(() => { return () => clearInterval(timerRef.current); }, []);

    // Which layer is currently active?
    const activeLayerId = curStep ? curStep.layerId : null;
    const activeSide = curStep ? curStep.side : null;

    /* ── Helper: render a single OSI stack ── */
    const renderStack = (side) => {
        const layers = viewMode === 'osi' ? OSI_LAYERS : TCPIP_LAYERS;
        const isActive = activeSide === side || activeSide === 'wire';
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
                <div style={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.35rem', textAlign: 'center', opacity: 0.5 }}>
                    {side === 'sender' ? 'Sender' : 'Receiver'}
                </div>
                {layers.map((layer, idx) => {
                    const isThisActive = isActive && activeLayerId === (viewMode === 'osi' ? layer.id : layer.id);
                    const isDone = curStep && (
                        (side === 'sender' && curStep.phase === 'encapsulate' && idx < (curStep.layerIdx ?? -1)) ||
                        (side === 'receiver' && curStep.phase === 'decapsulate' && idx > (curStep.layerIdx ?? OSI_LAYERS.length))
                    );
                    const isEncapLayer = side === 'sender' && curStep?.phase === 'encapsulate' && curStep.layerIdx === idx;
                    const isDecapLayer = side === 'receiver' && curStep?.phase === 'decapsulate' && curStep.layerIdx === idx;
                    return (
                        <motion.div
                            key={layer.id}
                            animate={{
                                scale: isEncapLayer || isDecapLayer ? 1.04 : 1,
                                boxShadow: isEncapLayer || isDecapLayer ? '0 0 12px rgba(0,0,0,0.3)' : '2px 2px 0 var(--border)',
                            }}
                            onClick={() => {
                                if (viewMode === 'osi') {
                                    setExpandedLayer(expandedLayer === layer.id ? null : layer.id);
                                    setSelectedProtocol(null);
                                }
                            }}
                            style={{
                                background: layer.color,
                                border: '2px solid var(--border)',
                                padding: '0.35rem 0.6rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: viewMode === 'osi' ? 'pointer' : 'default',
                                opacity: isDone ? 0.4 : 1,
                                transition: 'opacity 0.3s',
                                position: 'relative',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ fontWeight: 800, fontSize: '0.7rem', fontFamily: 'var(--font-mono)', opacity: 0.6 }}>
                                    L{viewMode === 'osi' ? layer.id : layer.id}
                                </span>
                                <span style={{ fontWeight: 700, fontSize: '0.78rem' }}>{layer.name}</span>
                            </div>
                            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700, opacity: 0.7 }}>
                                {layer.pdu}
                            </span>
                            {(isEncapLayer || isDecapLayer) && (
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 0.5 }}
                                    style={{
                                        position: 'absolute', left: 0, bottom: 0, height: 3,
                                        background: 'var(--border)', opacity: 0.6,
                                    }}
                                />
                            )}
                        </motion.div>
                    );
                })}
            </div>
        );
    };

    /* ── Protocol browser ── */
    const renderProtocolBrowser = () => {
        if (viewMode !== 'osi' || expandedLayer === null) return null;
        const layer = OSI_LAYERS.find(l => l.id === expandedLayer);
        if (!layer) return null;
        return (
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{ background: 'var(--white)', border: '2px solid var(--border)', padding: '0.5rem', marginTop: '0.35rem' }}
            >
                <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.3rem' }}>
                    Layer {layer.id} Protocols
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {layer.protocols.map(p => (
                        <motion.button
                            key={p}
                            whileHover={{ scale: 1.08 }}
                            onClick={(e) => { e.stopPropagation(); setSelectedProtocol(selectedProtocol === p ? null : p); }}
                            style={{
                                fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                                padding: '0.2rem 0.45rem', border: '2px solid var(--border)',
                                background: selectedProtocol === p ? layer.color : 'var(--white)',
                                cursor: 'pointer', boxShadow: selectedProtocol === p ? 'var(--shadow-sm)' : 'none',
                            }}
                        >{p}</motion.button>
                    ))}
                </div>
                {selectedProtocol && PROTOCOL_FIELDS[selectedProtocol] && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '0.4rem' }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.2rem' }}>
                            {selectedProtocol} PDU Structure
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1px', border: '2px solid var(--border)' }}>
                            {PROTOCOL_FIELDS[selectedProtocol].map((f, i) => (
                                <div key={i} style={{
                                    background: f.color, padding: '0.25rem 0.4rem',
                                    fontSize: '0.6rem', fontWeight: 700, textAlign: 'center',
                                    flex: typeof f.bits === 'number' ? f.bits : 16,
                                    minWidth: 40, borderRight: '1px solid rgba(0,0,0,0.15)',
                                }}>
                                    <div style={{ opacity: 0.7 }}>{f.name}</div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem' }}>{f.bits}{typeof f.bits === 'number' ? ' bits' : ''}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </motion.div>
        );
    };

    /* ── Encapsulation visual (nested boxes) ── */
    const renderPacketViz = () => {
        if (!curStep) return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3, fontSize: '0.9rem' }}>
                Start simulation to see packet encapsulation...
            </div>
        );

        // Determine which wrapper layers are visible
        let wrapperLayers = [];
        if (curStep.phase === 'encapsulate') {
            wrapperLayers = OSI_LAYERS.slice(0, curStep.layerIdx + 1).filter(l => l.headerSize > 0 || l.id === 7);
        } else if (curStep.phase === 'decapsulate') {
            const remaining = OSI_LAYERS.slice(0, curStep.layerIdx + 1).filter(l => l.headerSize > 0 || l.id === 7);
            wrapperLayers = remaining;
        } else if (curStep.phase === 'transit' || curStep.phase === 'router' || curStep.phase === 'switch' || curStep.phase === 'arrive') {
            wrapperLayers = OSI_LAYERS.filter(l => l.headerSize > 0 || l.id === 7);
        } else if (curStep.phase === 'done') {
            wrapperLayers = [OSI_LAYERS[0]]; // Just application data
        }

        const peekLayer = curStep.peekLayer || null;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flex: 1 }}>
                {/* Phase indicator */}
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase',
                        padding: '0.3rem 0.8rem', background: curStep.phase === 'done' ? 'var(--green)' : 'var(--purple)',
                        border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)',
                    }}
                >
                    {curStep.phase === 'encapsulate' ? `⬇ Encapsulating at ${curStep.layerName}` :
                     curStep.phase === 'decapsulate' ? `⬆ Decapsulating at ${curStep.layerName}` :
                     curStep.phase === 'transit' ? '→ Transmitting on wire...' :
                     curStep.phase === 'router' ? 'Router — peeking at Layer 3' :
                     curStep.phase === 'switch' ? 'Switch — peeking at Layer 2' :
                     curStep.phase === 'arrive' ? 'Arrived at receiver' :
                     'Delivery Complete!'}
                </motion.div>

                {/* Nested boxes */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`pkt-${currentStep}`}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        {wrapperLayers.reverse().reduce((inner, layer) => {
                            const isPeeked = peekLayer && layer.id <= peekLayer;
                            return (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: isPeeked ? 0.5 : 1 }}
                                    style={{
                                        border: `3px solid var(--border)`,
                                        background: layer.color,
                                        padding: '0.5rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        position: 'relative',
                                        boxShadow: 'var(--shadow-sm)',
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute', top: -1, left: 4,
                                        fontSize: '0.55rem', fontWeight: 800,
                                        fontFamily: 'var(--font-mono)', opacity: 0.7,
                                        background: layer.color, padding: '0 3px',
                                    }}>
                                        L{layer.id} {layer.headerSize > 0 ? `+${layer.headerSize}B` : ''}
                                    </div>
                                    {inner}
                                </motion.div>
                            );
                        }, (
                            <div style={{
                                padding: '0.6rem 1.2rem', background: 'var(--white)',
                                border: '3px solid var(--border)', fontWeight: 800,
                                fontFamily: 'var(--font-mono)', fontSize: '1rem',
                                boxShadow: 'var(--shadow-sm)',
                            }}>
                                "{PAYLOAD}"
                            </div>
                        ))}
                    </motion.div>
                </AnimatePresence>

                {/* Binary bits animation for L1 */}
                {curStep.phase === 'encapsulate' && curStep.layerId === 1 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700,
                            opacity: 0.5, overflow: 'hidden', maxWidth: 300, whiteSpace: 'nowrap',
                        }}
                    >
                        {Array.from({ length: 60 }, () => Math.random() > 0.5 ? '1' : '0').join('')}
                    </motion.div>
                )}

                {/* Wire animation */}
                {(curStep.phase === 'transit' || curStep.phase === 'router' || curStep.phase === 'switch') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.5rem' }}>
                        {[0, 1, 2].map(h => (
                            <motion.div
                                key={h}
                                animate={{
                                    background: curStep.hopNum >= h ? 'var(--green)' : 'var(--white)',
                                    scale: curStep.hopNum === h ? 1.2 : 1,
                                }}
                                style={{
                                    width: 32, height: 32, border: '2px solid var(--border)',
                                    borderRadius: '50%', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800,
                                }}
                            >
                                {h === 1 ? 'R' : h === 2 ? 'S' : '•'}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    /* ════════════════════════════════════════
       CENTER CONTENT
       ════════════════════════════════════════ */
    const CENTER = (
        <div style={{ padding: '0.75rem', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* View toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', border: '2px solid var(--border)', borderRadius: 0 }}>
                    {['osi', 'tcpip'].map(m => (
                        <button key={m} onClick={() => setViewMode(m)}
                            style={{
                                padding: '0.3rem 0.8rem', fontSize: '0.75rem', fontWeight: 700,
                                background: viewMode === m ? 'var(--purple)' : 'var(--white)',
                                border: 'none', borderRight: m === 'osi' ? '2px solid var(--border)' : 'none',
                                cursor: 'pointer', fontFamily: 'var(--font-main)',
                            }}
                        >{m === 'osi' ? '7-Layer OSI' : '4-Layer TCP/IP'}</button>
                    ))}
                </div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.4, fontFamily: 'var(--font-mono)' }}>
                    PDU Size: {curStep ? curStep.totalSize : PAYLOAD_SIZE}B
                </div>
            </div>

            {/* Main 3-column: sender | packet viz | receiver */}
            <div style={{ flex: 1, display: 'flex', gap: '0.5rem', minHeight: 0, overflow: 'hidden' }}>
                {/* Sender stack */}
                <div style={{ width: '25%', overflow: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                    {renderStack('sender')}
                    {expandedLayer && activeSide !== 'receiver' && renderProtocolBrowser()}
                </div>

                {/* Center: packet visualization */}
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', border: '2px dashed var(--border)', borderRadius: 0,
                    background: 'rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden',
                }}>
                    {renderPacketViz()}
                </div>

                {/* Receiver stack */}
                <div style={{ width: '25%', overflow: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                    {renderStack('receiver')}
                </div>
            </div>
        </div>
    );

    /* ════════════════════════════════════════
       LEFT PANEL — System State
       ════════════════════════════════════════ */
    const LEFT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[
                { label: 'Current Layer', val: curStep ? `L${curStep.layerId ?? '—'} ${curStep.layerName ?? ''}` : '—', color: 'var(--purple)' },
                { label: 'Phase', val: curStep?.phase ?? '—', color: 'var(--cyan)' },
                { label: 'PDU Type', val: curStep?.pdu ?? '—', color: 'var(--yellow)' },
                { label: 'Total PDU Size', val: `${curStep?.totalSize ?? PAYLOAD_SIZE} bytes`, color: 'var(--green)' },
                { label: 'Headers Added', val: curStep?.headers?.length ?? 0, color: 'var(--orange)' },
                { label: 'Hops Traversed', val: curStep?.hopNum ?? 0, color: 'var(--pink)' },
            ].map(s => (
                <div key={s.label} style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ background: s.color, padding: '0.25rem 0.5rem', borderBottom: '2px solid var(--border)', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase' }}>{s.label}</div>
                    <div style={{ padding: '0.35rem 0.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{s.val}</div>
                </div>
            ))}

            {/* Header stack */}
            {curStep?.headers?.length > 0 && (
                <div style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ background: 'var(--purple)', padding: '0.25rem 0.5rem', borderBottom: '2px solid var(--border)', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase' }}>Encapsulated Headers</div>
                    <div style={{ padding: '0.35rem 0.5rem' }}>
                        {curStep.headers.map((h, i) => (
                            <div key={i} style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 600, padding: '0.1rem 0' }}>{h}</div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    /* ════════════════════════════════════════
       RIGHT PANEL — Learning Lab
       ════════════════════════════════════════ */
    const RIGHT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {curStep && (
                <AnimatePresence mode="wait">
                    <motion.div key={currentStep} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                            <div style={{ background: 'var(--purple)', padding: '0.4rem 0.6rem', borderBottom: '2px solid var(--border)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                Algorithm Logic
                            </div>
                            <div style={{ padding: '0.5rem 0.6rem', fontSize: '0.82rem', lineHeight: 1.5 }}>{curStep.explanation}</div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}
            {curStep && (
                <div style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--yellow)', padding: '0.4rem 0.6rem', borderBottom: '2px solid var(--border)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                        Educational Insight
                    </div>
                    <div style={{ padding: '0.5rem 0.6rem', fontSize: '0.8rem', lineHeight: 1.5, opacity: 0.85 }}>{curStep.insight}</div>
                </div>
            )}
            <div style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <div style={{ background: 'var(--green)', padding: '0.4rem 0.6rem', borderBottom: '2px solid var(--border)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    Concept: Encapsulation
                </div>
                <div style={{ padding: '0.5rem 0.6rem', fontSize: '0.78rem', lineHeight: 1.5, opacity: 0.8 }}>
                    Each layer wraps the data from the layer above with its own header (and sometimes trailer), forming a Protocol Data Unit (PDU). This process is called <strong>encapsulation</strong>. At the receiver, each layer removes its header — this is <strong>decapsulation</strong>.
                </div>
            </div>
        </div>
    );

    const TL = steps.map((s, i) => ({
        id: i,
        label: s.phase === 'encapsulate' ? `Encap L${s.layerId}` :
               s.phase === 'decapsulate' ? `Decap L${s.layerId}` :
               s.phase === 'transit' ? 'Wire' :
               s.phase === 'router' ? 'Router' :
               s.phase === 'switch' ? 'Switch' :
               s.phase === 'arrive' ? 'Arrive' : 'Done',
        done: i < currentStep,
        active: i === currentStep,
    }));

    return (
        <ImmersiveLayout
            isActive={isSimMode}
            title="OSI & TCP/IP Model"
            icon={<BoxIcon size={20} />}
            moduleLabel="CN MODULE"
            isRunning={isRunning}
            isPaused={isPaused}
            isFinished={isFinished}
            speed={speed}
            onSpeedChange={setSpeed}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onReset={handleReset}
            onStep={handleStep}
            currentStepNum={Math.max(0, currentStep + 1)}
            totalSteps={steps.length}
            phaseName={curStep?.phase ?? ''}
            centerContent={CENTER}
            leftContent={LEFT}
            rightContent={RIGHT}
            timelineItems={TL}
            conceptMode={conceptMode}
            onConceptModeToggle={() => setConceptMode(!conceptMode)}
            legend={[
                { color: '#b39ddb', label: 'Application' },
                { color: '#90caf9', label: 'Transport' },
                { color: '#a5d6a7', label: 'Network' },
                { color: '#ffcc80', label: 'Data Link' },
                { color: '#ffab91', label: 'Physical' },
            ]}
        >
            {/* Config mode */}
            <div className="main-content">
                <div style={{ marginBottom: '0.4rem' }}><Link to="/networks" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← Networks Module</Link></div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="section-header">Networks · Protocol Layers</div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><BoxIcon size={28} /> OSI & TCP/IP Model</h1>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '0.3rem' }}>Watch a packet travel through all 7 OSI layers with encapsulation, cross the network, and decapsulate at the receiver.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                    <div className="panel">
                        <div className="panel-header" style={{ background: 'var(--purple)' }}>What You'll See</div>
                        <div style={{ padding: '1rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
                            <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                                <li>Payload "<strong>Hello</strong>" starts at Layer 7 on the sender</li>
                                <li>Each layer adds its header — nested box animation</li>
                                <li>Packet crosses the wire through router & switch hops</li>
                                <li>Receiver decapsulates layer by layer</li>
                                <li>Toggle between 7-layer OSI and 4-layer TCP/IP views</li>
                                <li>Click any layer to browse its protocols and PDU structures</li>
                            </ul>
                        </div>
                    </div>
                    <div className="panel">
                        <div className="panel-header" style={{ background: 'var(--purple)' }}>🏷 Concepts Covered</div>
                        <div style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                                {['Encapsulation', 'PDU', 'Protocol Stack', 'Data Link', 'Decapsulation'].map(t => (
                                    <span key={t} style={{
                                        fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                                        padding: '0.2rem 0.5rem', border: '2px solid var(--border)', background: 'var(--purple)',
                                    }}>{t}</span>
                                ))}
                            </div>
                            <p style={{ fontSize: '0.82rem', opacity: 0.7 }}>
                                Understand how data moves through protocol layers, how headers are added/removed, and why the OSI model matters for network troubleshooting.
                            </p>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-lg" style={{ background: 'var(--purple)' }} onClick={handleStart}>▶ Simulate</button>
                    <button className="btn btn-sm" style={{ marginTop: '0.15rem' }} onClick={handleStep}>⏭ Step Through</button>
                </div>
            </div>
        </ImmersiveLayout>
    );
}
