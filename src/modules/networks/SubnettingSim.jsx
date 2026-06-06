import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import { NetworkIcon, TreeIcon } from '../../components/Icons';

/* ════════════════════════════════════════
   HELPERS — IP math
   ════════════════════════════════════════ */
function ipToInt(a, b, c, d) { return ((a << 24) | (b << 16) | (c << 8) | d) >>> 0; }
function intToIp(n) { return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]; }
function intToIpStr(n) { return intToIp(n).join('.'); }
function maskFromPrefix(p) { return p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0; }
function getNetworkAddr(ip, prefix) { return (ip & maskFromPrefix(prefix)) >>> 0; }
function getBroadcast(ip, prefix) { return (getNetworkAddr(ip, prefix) | (~maskFromPrefix(prefix) & 0xffffffff)) >>> 0; }
function getUsableHosts(prefix) { return prefix >= 31 ? 0 : Math.pow(2, 32 - prefix) - 2; }
function getAddressClass(firstOctet) { if (firstOctet < 128) return 'A'; if (firstOctet < 192) return 'B'; if (firstOctet < 224) return 'C'; if (firstOctet < 240) return 'D'; return 'E'; }
function bitsToBinaryStr(n, bits) { return n.toString(2).padStart(bits, '0'); }

const QUIZ_SCENARIOS = [
    {
        prompt: 'Divide 192.168.1.0/24 into 4 equal subnets for ~62 hosts each.',
        baseIp: [192, 168, 1, 0],
        basePrefix: 24,
        expectedPrefix: 26,
        expectedCount: 4,
        departments: [
            { name: 'Engineering', hosts: 62 },
            { name: 'Sales', hosts: 62 },
            { name: 'Support', hosts: 62 },
            { name: 'Finance', hosts: 62 }
        ]
    },
    {
        prompt: 'Create 8 subnets from 10.0.0.0/8 (each with ~2M hosts).',
        baseIp: [10, 0, 0, 0],
        basePrefix: 8,
        expectedPrefix: 11,
        expectedCount: 8,
        departments: [
            { name: 'Region 1', hosts: 2000000 },
            { name: 'Region 2', hosts: 2000000 },
            { name: 'Region 3', hosts: 2000000 },
            { name: 'Region 4', hosts: 2000000 },
            { name: 'Region 5', hosts: 2000000 },
            { name: 'Region 6', hosts: 2000000 },
            { name: 'Region 7', hosts: 2000000 },
            { name: 'Region 8', hosts: 2000000 }
        ]
    },
    {
        prompt: 'Split 172.16.0.0/16 into 2 subnets for ~32766 hosts each.',
        baseIp: [172, 16, 0, 0],
        basePrefix: 16,
        expectedPrefix: 17,
        expectedCount: 2,
        departments: [
            { name: 'HQ Network', hosts: 32766 },
            { name: 'Branch Network', hosts: 32766 }
        ]
    },
];

/* ════════════════════════════════════════
   BUILD steps for CIDR walkthrough
   ════════════════════════════════════════ */
function buildSteps(octets, prefix) {
    const steps = [];
    const ipIntVal = ipToInt(...octets);
    for (let p = 8; p <= prefix; p += 4) {
        const effectiveP = Math.min(p, prefix);
        const net = getNetworkAddr(ipIntVal, effectiveP);
        const bcast = getBroadcast(ipIntVal, effectiveP);
        steps.push({
            prefix: effectiveP,
            networkAddr: intToIpStr(net),
            broadcast: intToIpStr(bcast),
            firstUsable: intToIpStr(net + 1),
            lastUsable: intToIpStr(bcast - 1),
            totalHosts: getUsableHosts(effectiveP),
            explanation: `With /${effectiveP}, the first ${effectiveP} bits are the network portion. ${32 - effectiveP} bits remain for host addressing = ${getUsableHosts(effectiveP)} usable hosts.`,
            insight: effectiveP <= 8 ? 'Class A range: First octet is network. Huge address space for very large organizations.' :
                     effectiveP <= 16 ? 'Class B range: First two octets are network. Medium-sized organizations.' :
                     effectiveP <= 24 ? 'Class C range: First three octets are network. Small networks (up to 254 hosts).' :
                     'Subnetting within a Class C: Borrowing host bits to create smaller subnets. Each additional bit halves the hosts.',
        });
    }
    const net = getNetworkAddr(ipIntVal, prefix);
    const bcast = getBroadcast(ipIntVal, prefix);
    steps.push({
        prefix,
        networkAddr: intToIpStr(net),
        broadcast: intToIpStr(bcast),
        firstUsable: intToIpStr(net + 1),
        lastUsable: intToIpStr(bcast - 1),
        totalHosts: getUsableHosts(prefix),
        explanation: `Final: /${prefix} gives network ${intToIpStr(net)}, broadcast ${intToIpStr(bcast)}, ${getUsableHosts(prefix)} usable host addresses.`,
        insight: 'CIDR (Classless Inter-Domain Routing) replaces the old classful system, allowing flexible allocation of IP addresses with any prefix length.',
    });
    return steps;
}

/* ════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════ */
export default function SubnettingSim() {
    const [octets, setOctets] = useState([192, 168, 1, 0]);
    const [prefix, setPrefix] = useState(24);
    const [mode, setMode] = useState('ipv4'); // 'ipv4' | 'ipv6'
    const [subnets, setSubnets] = useState([]);
    const [quizIdx, setQuizIdx] = useState(null);
    const [quizResult, setQuizResult] = useState(null);
    const [speed, setSpeed] = useState(700);
    const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'routing' | 'tree'

    // Routing simulator states
    const [routingIpStr, setRoutingIpStr] = useState('192.168.1.75');
    const [routingLogs, setRoutingLogs] = useState([]);
    const [isRoutingActive, setIsRoutingActive] = useState(false);
    const [matchingSubnetIdx, setMatchingSubnetIdx] = useState(-1);

    const [steps, setSteps] = useState([]);
    const [currentStep, setCurrentStep] = useState(-1);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [isSimMode, setIsSimMode] = useState(false);

    const timerRef = useRef(null);
    const stepRef = useRef(-1);
    const stepsRef = useRef([]);

    const ipIntVal = ipToInt(...octets);
    const mask = maskFromPrefix(prefix);
    const networkAddr = getNetworkAddr(ipIntVal, prefix);
    const broadcast = getBroadcast(ipIntVal, prefix);
    const usableHosts = getUsableHosts(prefix);
    const addressClass = getAddressClass(octets[0]);

    const curStep = currentStep >= 0 && currentStep < steps.length ? steps[currentStep] : null;

    const advanceStep = useCallback(() => {
        const next = stepRef.current + 1;
        if (next >= stepsRef.current.length) {
            setCurrentStep(stepsRef.current.length - 1);
            setIsRunning(false); setIsFinished(true);
            clearInterval(timerRef.current);
            return;
        }
        setCurrentStep(next); stepRef.current = next;
    }, []);

    const handleStart = () => {
        const s = buildSteps(octets, prefix);
        stepsRef.current = s; setSteps(s);
        setCurrentStep(-1); stepRef.current = -1;
        setIsRunning(true); setIsPaused(false); setIsFinished(false); setIsSimMode(true);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(advanceStep, speed);
    };
    const handlePause = () => { setIsRunning(false); setIsPaused(true); clearInterval(timerRef.current); };
    const handleResume = () => { setIsRunning(true); setIsPaused(false); timerRef.current = setInterval(advanceStep, speed); };
    const handleReset = () => {
        clearInterval(timerRef.current);
        setSteps([]);
        stepsRef.current = [];
        setCurrentStep(-1);
        stepRef.current = -1;
        setIsRunning(false);
        setIsPaused(false);
        setIsFinished(false);
        setIsSimMode(false);
        setQuizIdx(null);
        setQuizResult(null);
        setMatchingSubnetIdx(-1);
        setIsRoutingActive(false);
        setRoutingLogs([]);
    };
    const handleStep = () => {
        if (!isSimMode) {
            const s = buildSteps(octets, prefix);
            stepsRef.current = s; setSteps(s);
            setIsSimMode(true); stepRef.current = -1;
        }
        advanceStep();
    };

    useEffect(() => () => clearInterval(timerRef.current), []);

    // Flip a bit in the IP address
    const flipBit = (bitIndex) => {
        const octetIdx = Math.floor(bitIndex / 8);
        const bitPos = 7 - (bitIndex % 8);
        const newOctets = [...octets];
        newOctets[octetIdx] ^= (1 << bitPos);
        setOctets(newOctets);
    };

    // Add a subnet to the address space
    const addSubnet = (subPrefix) => {
        const netStart = subnets.length === 0 ? networkAddr : (subnets[subnets.length - 1].end + 1);
        const subMask = maskFromPrefix(subPrefix);
        const subNet = (netStart & subMask) >>> 0;
        const subBcast = (subNet | (~subMask & 0xffffffff)) >>> 0;
        if (subBcast > broadcast) return; // overflow
        const colors = ['#b39ddb', '#90caf9', '#a5d6a7', '#ffcc80', '#ef9a9a', '#80deea', '#ffe082', '#ffab91'];
        setSubnets([...subnets, { start: subNet, end: subBcast, prefix: subPrefix, color: colors[subnets.length % colors.length] }]);
    };

    const clearSubnets = () => setSubnets([]);

    // Check quiz
    const checkQuiz = () => {
        if (quizIdx === null) return;
        const q = QUIZ_SCENARIOS[quizIdx];
        if (subnets.length === q.expectedCount && subnets.every(s => {
            const size = s.end - s.start + 1;
            return size === Math.pow(2, 32 - q.expectedPrefix);
        })) {
            setQuizResult('correct');
        } else {
            setQuizResult('wrong');
        }
    };

    // Trigger bitwise AND Routing simulation
    const runRoutingSim = () => {
        setIsRoutingActive(true);
        setMatchingSubnetIdx(-1);
        const logs = [];
        logs.push(`[ROUTER] Packet received. Destination IP: ${routingIpStr}`);
        
        let routedIpInt = 0;
        try {
            const parts = routingIpStr.split('.').map(Number);
            if (parts.length === 4 && parts.every(p => p >= 0 && p <= 255)) {
                routedIpInt = ipToInt(...parts);
            } else {
                throw new Error();
            }
        } catch {
            logs.push(`[ROUTER] Invalid Destination IP format.`);
            setRoutingLogs(logs);
            return;
        }

        logs.push(`[ROUTER] Destination IP in Binary: ${bitsToBinaryStr(routedIpInt, 32)}`);
        logs.push(`[ROUTER] Checking routing table with ${subnets.length} subnets...`);

        let matched = false;
        for (let i = 0; i < subnets.length; i++) {
            const s = subnets[i];
            const subMask = maskFromPrefix(s.prefix);
            const andResult = (routedIpInt & subMask) >>> 0;
            
            logs.push(`--------------------------------------`);
            logs.push(`Testing Route #${i + 1}: ${intToIpStr(s.start)}/${s.prefix}`);
            logs.push(`IP   : ${bitsToBinaryStr(routedIpInt, 32)}`);
            logs.push(`MASK : ${bitsToBinaryStr(subMask, 32)}`);
            logs.push(`AND  : ${bitsToBinaryStr(andResult, 32)} (${intToIpStr(andResult)})`);
            
            if (andResult === s.start) {
                logs.push(`MATCH! Forwarding packet to Port #${i + 1} (${intToIpStr(s.start)}/${s.prefix})`);
                setMatchingSubnetIdx(i);
                matched = true;
                break;
            } else {
                logs.push(`MISMATCH. Expected network ${intToIpStr(s.start)}, got ${intToIpStr(andResult)}`);
            }
        }

        if (!matched) {
            logs.push(`--------------------------------------`);
            logs.push(`⚠️ No matching subnet found. Dropping packet at default gateway.`);
            setMatchingSubnetIdx(-2);
        }

        setRoutingLogs(logs);
    };

    /* ════════════════════════════════════════
       32-BIT SYNTHESIZER PANEL
       ════════════════════════════════════════ */
    const renderBitGrid = () => {
        const ipBits = bitsToBinaryStr(ipIntVal, 32);
        const maskBits = bitsToBinaryStr(mask, 32);
        const effectivePrefix = curStep ? curStep.prefix : prefix;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', background: 'var(--white)', padding: '0.75rem', border: '3px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                {/* Dotted decimal */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    {octets.map((o, i) => (
                        <motion.div
                            key={i}
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 0.2 }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: 'var(--yellow)',
                                border: '2.5px solid var(--border)',
                                padding: '2px 8px',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                        >
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.2rem' }}>{o}</span>
                            {i < 3 && <span style={{ fontWeight: 800, marginLeft: '0.3rem', opacity: 0.6 }}>.</span>}
                        </motion.div>
                    ))}
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.2rem', color: 'var(--pink)', marginLeft: '0.5rem' }}>/{effectivePrefix}</span>
                </div>

                {/* IP bit row */}
                <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>Interactive Bit Panel (Click to flip)</div>
                <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {ipBits.split('').map((bit, i) => {
                        const isNetwork = i < effectivePrefix;
                        return (
                            <motion.button
                                key={`ip-${i}`}
                                onClick={() => flipBit(i)}
                                whileHover={{ scale: 1.15 }}
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    border: '2px solid var(--border)',
                                    background: isNetwork ? 'var(--orange)' : 'var(--cyan)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontFamily: 'var(--font-mono)',
                                    fontWeight: 800,
                                    fontSize: '0.72rem',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    boxShadow: 'var(--shadow-sm)',
                                    borderRight: (i + 1) % 8 === 0 && i < 31 ? '3.5px solid var(--border)' : '2px solid var(--border)'
                                }}
                                title={`Bit ${i} (Weight: ${Math.pow(2, 7 - (i % 8))}) - ${isNetwork ? 'Network' : 'Host'}`}
                            >
                                {bit}
                                {i === effectivePrefix - 1 && (
                                    <div style={{
                                        position: 'absolute',
                                        right: '-2px',
                                        top: '-4px',
                                        bottom: '-4px',
                                        width: '4px',
                                        background: 'red',
                                        zIndex: 10
                                    }} />
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Subnet mask row */}
                <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.4, marginTop: '0.2rem' }}>Subnet Mask Bits</div>
                <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {maskBits.split('').map((bit, i) => (
                        <div key={`mask-${i}`} style={{
                            width: '24px',
                            height: '24px',
                            border: '2.5px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            background: bit === '1' ? 'var(--orange)' : '#e0e0e0',
                            opacity: 0.8,
                            borderRight: (i + 1) % 8 === 0 && i < 31 ? '3.5px solid var(--border)' : '2.5px solid var(--border)'
                        }}>{bit}</div>
                    ))}
                </div>

                {/* CIDR slider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.3rem' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, opacity: 0.6, flexShrink: 0 }}>CIDR Slider:</span>
                    <input type="range" min={1} max={30} value={prefix}
                        onChange={e => setPrefix(+e.target.value)}
                        style={{ flex: 1, accentColor: 'var(--pink)' }}
                    />
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.9rem', flexShrink: 0 }}>/{prefix}</span>
                </div>

                <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700, opacity: 0.7, textAlign: 'center' }}>
                    Mask Value: {intToIpStr(mask)}
                </div>
            </div>
        );
    };

    /* ════════════════════════════════════════
       SUBNET GRID MAP (LAND PARSER)
       ════════════════════════════════════════ */
    const renderSubnetGrid = () => {
        const totalRange = broadcast - networkAddr + 1;
        const sliceSize = Math.max(1, totalRange / 256);
        
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5 }}>Subnet grid map (256 segments)</span>
                    <div style={{ display: 'flex', gap: '3px' }}>
                        {[26, 27, 28].map(p => (
                            <button key={p} onClick={() => addSubnet(p)} style={{
                                fontSize: '0.6rem', fontWeight: 800, padding: '0.2rem 0.5rem',
                                border: '2px solid var(--border)', background: 'var(--white)',
                                cursor: 'pointer', fontFamily: 'var(--font-mono)',
                                boxShadow: 'var(--shadow-sm)'
                            }}>+/{p}</button>
                        ))}
                        <button onClick={clearSubnets} style={{
                            fontSize: '0.6rem', fontWeight: 800, padding: '0.2rem 0.5rem',
                            border: '2px solid var(--border)', background: 'var(--pink)',
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-sm)'
                        }}>Clear</button>
                    </div>
                </div>

                {/* The 16x16 interactive grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(16, 1fr)',
                    gap: '2px',
                    border: '3px solid var(--border)',
                    background: 'var(--border)',
                    padding: '2px',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    {Array.from({ length: 256 }).map((_, cellIdx) => {
                        const cellIpInt = (networkAddr + cellIdx * sliceSize) >>> 0;
                        const cellEndIpInt = (cellIpInt + sliceSize - 1) >>> 0;

                        // Find matching subnet
                        let matchedSubnet = null;
                        let matchedSubnetIdxVal = -1;
                        for (let j = 0; j < subnets.length; j++) {
                            const s = subnets[j];
                            if (!(cellEndIpInt < s.start || cellIpInt > s.end)) {
                                matchedSubnet = s;
                                matchedSubnetIdxVal = j;
                                break;
                            }
                        }

                        const isFirstOfSubnet = matchedSubnet && cellIpInt === matchedSubnet.start;
                        const isLastOfSubnet = matchedSubnet && cellEndIpInt === matchedSubnet.end;

                        return (
                            <div
                                key={cellIdx}
                                style={{
                                    aspectRatio: '1',
                                    background: matchedSubnet ? matchedSubnet.color : '#eaeaea',
                                    border: matchingSubnetIdx === matchedSubnetIdxVal && matchingSubnetIdx !== -1 ? '2px solid red' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.45rem',
                                    fontWeight: 900,
                                    color: 'black',
                                    position: 'relative',
                                    cursor: 'pointer'
                                }}
                                title={`IP: ${intToIpStr(cellIpInt)}${sliceSize > 1 ? ' - ' + intToIpStr(cellEndIpInt) : ''} ${matchedSubnet ? `(Subnet /${matchedSubnet.prefix})` : ''}`}
                            >
                                {isFirstOfSubnet && 'N'}
                                {isLastOfSubnet && 'B'}
                            </div>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', opacity: 0.5 }}>
                    <span>Block Start: {intToIpStr(networkAddr)}</span>
                    <span>N=Network, B=Broadcast</span>
                    <span>Block End: {intToIpStr(broadcast)}</span>
                </div>
            </div>
        );
    };

    /* ════════════════════════════════════════
       TAB 2: BITWISE AND ROUTING SIMULATOR
       ════════════════════════════════════════ */
    const renderRoutingSimulator = () => {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
                <div style={{ border: '3px solid var(--border)', background: 'var(--white)', padding: '0.75rem', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.8rem', marginBottom: '0.4rem' }}>⚙ Test Packet Router</div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <input
                            type="text"
                            className="form-input"
                            value={routingIpStr}
                            onChange={e => setRoutingIpStr(e.target.value)}
                            placeholder="Enter target IP (e.g. 192.168.1.75)"
                            style={{ fontFamily: 'var(--font-mono)', flex: 1 }}
                        />
                        <button className="btn btn-yellow btn-sm" onClick={runRoutingSim}>Route Packet</button>
                    </div>
                </div>

                <div style={{
                    flex: 1,
                    background: '#121212',
                    color: '#a8e6cf',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    padding: '0.75rem',
                    border: '3px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                    overflowY: 'auto',
                    minHeight: '220px'
                }}>
                    {isRoutingActive ? (
                        routingLogs.map((log, idx) => {
                            let color = '#fff';
                            if (log.includes('MATCH!')) color = 'var(--green)';
                            else if (log.includes('MISMATCH') || log.includes('Invalid')) color = 'var(--pink)';
                            else if (log.includes('Testing Route')) color = 'var(--cyan)';
                            
                            return (
                                <div key={idx} style={{ color, marginBottom: '0.2rem' }}>
                                    {log}
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ opacity: 0.4, fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
                            Carve some subnets on the address bar first, then input an IP address and click "Route Packet" to run the bitwise AND hardware routing simulator.
                        </div>
                    )}
                </div>
            </div>
        );
    };

    /* ════════════════════════════════════════
       TAB 3: SUBNET BINARY TREE
       ════════════════════════════════════════ */
    const renderSubnetTree = () => {
        // Recursive renderer for binary tree depth
        const renderTreeNode = (start, end, depth, prefixLen) => {
            const range = end - start + 1;
            
            // Check if matches exactly any created subnet
            let matchedSubnet = null;
            let partial = false;
            for (let s of subnets) {
                if (s.start === start && s.end === end) {
                    matchedSubnet = s;
                } else if (!(end < s.start || start > s.end)) {
                    partial = true;
                }
            }

            const label = `${intToIpStr(start)}/${prefixLen}`;

            if (depth > 2) return null; // cap visual depth

            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1,
                    border: '2px solid var(--border)',
                    margin: '3px',
                    background: matchedSubnet ? matchedSubnet.color : partial ? '#ffe082' : '#f5f5f5',
                    padding: '4px',
                    textAlign: 'center',
                    boxShadow: matchedSubnet ? 'var(--shadow-sm)' : 'none'
                }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{label}</span>
                    <span style={{ fontSize: '0.5rem', opacity: 0.6 }}>({range.toLocaleString()} IPs)</span>
                    {matchedSubnet && <span style={{ fontSize: '0.5rem', fontWeight: 900, color: 'green' }}>ALLOCATED</span>}
                    {partial && <span style={{ fontSize: '0.5rem', fontWeight: 900, color: '#f57c00' }}>PARTIAL</span>}
                    
                    {!matchedSubnet && range > 1 && (
                        <div style={{ display: 'flex', width: '100%', marginTop: '4px', borderTop: '1px solid var(--border)' }}>
                            {renderTreeNode(start, (start + range/2 - 1) >>> 0, depth + 1, prefixLen + 1)}
                            {renderTreeNode(((start + range/2)) >>> 0, end, depth + 1, prefixLen + 1)}
                        </div>
                    )}
                </div>
            );
        };

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowX: 'auto', padding: '0.4rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5 }}>Subnet division tree (depth 3)</div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: '400px' }}>
                    {renderTreeNode(networkAddr, broadcast, 0, prefix)}
                </div>
            </div>
        );
    };

    /* ════════════════════════════════════════
       IPv6 DISPLAY
       ════════════════════════════════════════ */
    const renderIPv6 = () => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1rem', border: '3px solid var(--border)', background: 'var(--white)', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>IPv6 — 128-bit Address Space</div>
            
            {/* Hexadecimal display */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', justifyContent: 'center' }}>
                {Array.from({ length: 8 }, (_, g) => (
                    <div key={g} style={{ display: 'flex', gap: '0.5px', border: '2px solid var(--border)', background: 'var(--border)', padding: '1px', marginRight: g < 7 ? '6px' : 0 }}>
                        {Array.from({ length: 16 }, (_, b) => (
                            <div key={b} style={{
                                width: '7px', height: '18px', background: (g * 16 + b) < 64 ? 'var(--orange)' : 'var(--cyan)',
                            }} />
                        ))}
                    </div>
                ))}
            </div>
            
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 10, height: 10, background: 'var(--orange)' }} /> Network Routing bits (64)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 10, height: 10, background: 'var(--cyan)' }} /> Interface Identifier bits (64)</div>
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 800, textAlign: 'center', background: '#f5f5f5', border: '2px solid var(--border)', padding: '6px 12px' }}>
                <div>2001:0db8:85a3:0000:0000:8a2e:0370:7334</div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    style={{ color: '#27c93f', fontWeight: 900, marginTop: '0.2rem', borderTop: '1px dashed var(--border)', paddingTop: '2px' }}>
                    → 2001:db8:85a3::8a2e:370:7334 (Compressed)
                </motion.div>
            </div>
            <div style={{
                background: 'var(--yellow)', border: '3px solid var(--border)', padding: '0.5rem 1rem',
                fontSize: '0.78rem', fontWeight: 800, textAlign: 'center', boxShadow: 'var(--shadow-sm)',
            }}>
                IPv6 contains 340 undecillion addresses!<br />
                <span style={{ opacity: 0.7, fontSize: '0.65rem' }}>Enough to assign an IP address to every atom on Earth.</span>
            </div>
        </div>
    );

    /* ════════════════════════════════════════
       CENTER CONTENT
       ════════════════════════════════════════ */
    const CENTER = (
        <div style={{ padding: '0.75rem', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* IPv4/IPv6 toggle */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '0.4rem', flexShrink: 0 }}>
                {['ipv4', 'ipv6'].map(m => (
                    <button key={m} onClick={() => setMode(m)} style={{
                        padding: '0.3rem 0.8rem', fontSize: '0.75rem', fontWeight: 800,
                        border: '3px solid var(--border)',
                        background: mode === m ? 'var(--orange)' : 'var(--white)',
                        cursor: 'pointer', fontFamily: 'var(--font-main)',
                        boxShadow: 'var(--shadow-sm)'
                    }}>{m === 'ipv4' ? 'IPv4 (32-bit)' : 'IPv6 (128-bit)'}</button>
                ))}
            </div>

            {mode === 'ipv4' ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
                    {renderBitGrid()}

                    {/* Subnet Workspace Tab bar */}
                    <div style={{ display: 'flex', gap: '3px', background: 'var(--border)', padding: '3px', border: '3px solid var(--border)', flexShrink: 0 }}>
                        {[
                            { id: 'grid', label: '🎛️ Address Grid Map' },
                            { id: 'routing', label: 'AND Routing Simulator' },
                            { id: 'tree', label: 'Binary Tree Explorer' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    flex: 1,
                                    padding: '0.35rem 0.6rem',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    border: 'none',
                                    background: activeTab === tab.id ? 'var(--cyan)' : 'var(--white)',
                                    cursor: 'pointer'
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {activeTab === 'grid' && renderSubnetGrid()}
                        {activeTab === 'routing' && renderRoutingSimulator()}
                        {activeTab === 'tree' && renderSubnetTree()}
                    </div>

                    {/* Quiz Challenge Card */}
                    {quizIdx !== null && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            style={{ border: '3px solid var(--border)', background: 'var(--yellow)', padding: '0.6rem', boxShadow: 'var(--shadow-sm)', flexShrink: 0 }}>
                            <div style={{ fontWeight: 900, fontSize: '0.8rem', marginBottom: '0.2rem' }}>Network Architect Challenge</div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>{QUIZ_SCENARIOS[quizIdx].prompt}</div>
                            
                            {/* Department cards inside Quiz */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.4rem', marginBottom: '0.5rem' }}>
                                {QUIZ_SCENARIOS[quizIdx].departments.map((dept, dIdx) => {
                                    const matchingSubnet = subnets[dIdx];
                                    const isCorrectSize = matchingSubnet && (matchingSubnet.end - matchingSubnet.start + 1 === Math.pow(2, 32 - QUIZ_SCENARIOS[quizIdx].expectedPrefix));

                                    return (
                                        <div
                                            key={dIdx}
                                            style={{
                                                background: matchingSubnet ? matchingSubnet.color : 'white',
                                                border: '2px solid var(--border)',
                                                padding: '4px 8px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                fontSize: '0.62rem',
                                                fontWeight: 800
                                            }}
                                        >
                                            <span style={{ fontSize: '0.7rem' }}>{dept.name}</span>
                                            <span style={{ opacity: 0.6 }}>Needs: {dept.hosts.toLocaleString()} hosts</span>
                                            {matchingSubnet ? (
                                                <span style={{ color: isCorrectSize ? 'green' : 'red', fontSize: '0.52rem', marginTop: '2px' }}>
                                                    {isCorrectSize ? `✓ allocated /${matchingSubnet.prefix}` : `⚠️ wrong size`}
                                                </span>
                                            ) : (
                                                <span style={{ color: '#888', fontStyle: 'italic', fontSize: '0.52rem', marginTop: '2px' }}>Awaiting allocation</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                <button className="btn btn-green btn-sm" onClick={checkQuiz}>Submit Layout</button>
                                {quizResult && (
                                    <span style={{
                                        padding: '0.2rem 0.5rem', fontWeight: 900, fontSize: '0.75rem',
                                        background: quizResult === 'correct' ? 'var(--green)' : 'var(--pink)',
                                        border: '2px solid var(--border)',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}>{quizResult === 'correct' ? 'Success! Subnets allocated correctly!' : 'Try again — check subnet count and allocations'}</span>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>
            ) : renderIPv6()}
        </div>
    );

    /* ════════════════════════════════════════
       LEFT — System State
       ════════════════════════════════════════ */
    const LEFT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
                { label: 'Network Address', val: intToIpStr(networkAddr), color: 'var(--orange)' },
                { label: 'Broadcast', val: intToIpStr(broadcast), color: 'var(--pink)' },
                { label: 'Usable Hosts', val: usableHosts.toLocaleString(), color: 'var(--cyan)' },
                { label: 'Subnets Created', val: subnets.length, color: 'var(--green)' },
                { label: 'Prefix Length', val: `/${prefix}`, color: 'var(--yellow)' },
                { label: 'Address Class', val: addressClass, color: 'var(--purple)' },
            ].map(s => (
                <div key={s.label} style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ background: s.color, padding: '0.2rem 0.4rem', borderBottom: '2px solid var(--border)', fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase' }}>{s.label}</div>
                    <div style={{ padding: '0.25rem 0.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{s.val}</div>
                </div>
            ))}

            {/* Quiz selector */}
            <div style={{ marginTop: '0.3rem', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>Select Quiz Scenario</div>
            {QUIZ_SCENARIOS.map((q, i) => (
                <button key={i} onClick={() => { setQuizIdx(i); setOctets(q.baseIp); setPrefix(q.basePrefix); setSubnets([]); setQuizResult(null); }}
                    style={{
                        padding: '0.25rem 0.4rem', fontSize: '0.65rem', fontWeight: 800,
                        border: '2px solid var(--border)', textAlign: 'left',
                        background: quizIdx === i ? 'var(--yellow)' : 'var(--white)',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                        marginBottom: '2px'
                    }}>Quiz {i + 1}: Split {q.basePrefix} into {q.expectedCount}</button>
            ))}
        </div>
    );

    /* ════════════════════════════════════════
       RIGHT — Learning Lab
       ════════════════════════════════════════ */
    const RIGHT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {curStep && (
                <AnimatePresence mode="wait">
                    <motion.div key={currentStep} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                            <div style={{ background: 'var(--orange)', padding: '0.4rem 0.6rem', borderBottom: '2px solid var(--border)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>Algorithm Logic</div>
                            <div style={{ padding: '0.5rem 0.6rem', fontSize: '0.82rem', lineHeight: 1.5 }}>{curStep.explanation}</div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}
            {curStep && (
                <div style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--yellow)', padding: '0.4rem 0.6rem', borderBottom: '2px solid var(--border)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>Educational Insight</div>
                    <div style={{ padding: '0.5rem 0.6rem', fontSize: '0.8rem', lineHeight: 1.5, opacity: 0.85 }}>{curStep.insight}</div>
                </div>
            )}
            <div style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <div style={{ background: 'var(--green)', padding: '0.4rem 0.6rem', borderBottom: '2px solid var(--border)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>Concept: CIDR</div>
                <div style={{ padding: '0.5rem 0.6rem', fontSize: '0.78rem', lineHeight: 1.5, opacity: 0.8 }}>
                    <strong>CIDR notation</strong> (e.g., /24) specifies how many bits are the network portion. The remaining bits are for hosts.
                    <strong> VLSM</strong> (Variable Length Subnet Masking) allows different subnets to have different prefix lengths, enabling efficient use of address space.
                </div>
            </div>
            <div style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <div style={{ background: 'var(--cyan)', padding: '0.4rem 0.6rem', borderBottom: '2px solid var(--border)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>Quick Reference</div>
                <div style={{ padding: '0.4rem', fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>
                    {[{p:'/24',h:'254'},{p:'/25',h:'126'},{p:'/26',h:'62'},{p:'/27',h:'30'},{p:'/28',h:'14'},{p:'/29',h:'6'},{p:'/30',h:'2'}].map(r => (
                        <div key={r.p} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.1rem 0.3rem', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ fontWeight: 700 }}>{r.p}</span>
                            <span>{r.h} hosts</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const TL = steps.map((s, i) => ({
        id: i, label: `/${s.prefix}`, done: i < currentStep, active: i === currentStep,
    }));

    return (
        <ImmersiveLayout
            isActive={isSimMode}
            title="IP Addressing & Subnetting"
            icon={<NetworkIcon size={20} />}
            moduleLabel="CN MODULE"
            isRunning={isRunning} isPaused={isPaused} isFinished={isFinished}
            speed={speed} onSpeedChange={setSpeed}
            onStart={handleStart} onPause={handlePause} onResume={handleResume} onReset={handleReset} onStep={handleStep}
            currentStepNum={Math.max(0, currentStep + 1)} totalSteps={steps.length}
            phaseName={curStep ? `/${curStep.prefix}` : ''} centerContent={CENTER} leftContent={LEFT} rightContent={RIGHT}
            timelineItems={TL}
            legend={[
                { color: 'var(--orange)', label: 'Network bits' },
                { color: 'var(--cyan)', label: 'Host bits' },
                { color: 'var(--pink)', label: 'Broadcast' },
                { color: 'var(--green)', label: 'Usable' },
            ]}
        >
            {/* Config mode */}
            <div className="main-content">
                <div style={{ marginBottom: '0.4rem' }}><Link to="/networks" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← Networks Module</Link></div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="section-header">Networks · Network Layer</div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><NetworkIcon size={28} /> IP Addressing & Subnetting</h1>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '0.3rem' }}>Interactive 32-bit grid, CIDR slider, VLSM address-space bar, subnetting quiz, and IPv4 ↔ IPv6 toggle.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                    <div className="panel">
                        <div className="panel-header" style={{ background: 'var(--orange)' }}>⚙ Configuration</div>
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                                {octets.map((o, i) => (
                                    <div key={i}>
                                        <label className="form-label">Octet {i + 1}</label>
                                        <input type="number" className="form-input" value={o} min={0} max={255}
                                            onChange={e => { const n = [...octets]; n[i] = Math.max(0, Math.min(255, +e.target.value || 0)); setOctets(n); }} />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label className="form-label">CIDR Prefix (/{prefix})</label>
                                <input type="range" min={1} max={30} value={prefix} onChange={e => setPrefix(+e.target.value)} style={{ width: '100%' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', opacity: 0.5, fontFamily: 'var(--font-mono)' }}>
                                    <span>/1</span><span>/30</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="panel">
                        <div className="panel-header" style={{ background: 'var(--orange)' }}>🏷 Concepts Covered</div>
                        <div style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                                {['Network bits','Host bits','CIDR','VLSM','Broadcast','Subnetting'].map(t => (
                                    <span key={t} style={{
                                        fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                                        padding: '0.2rem 0.5rem', border: '2px solid var(--border)', background: 'var(--orange)',
                                    }}>{t}</span>
                                ))}
                            </div>
                            <p style={{ fontSize: '0.82rem', opacity: 0.7 }}>Click individual bits, drag the CIDR slider, carve subnets on the address bar, or try quiz challenges.</p>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-lg" style={{ background: 'var(--orange)' }} onClick={handleStart}>▶ Simulate</button>
                    <button className="btn btn-sm" style={{ marginTop: '0.15rem' }} onClick={handleStep}>⏭ Step Through</button>
                </div>
            </div>
        </ImmersiveLayout>
    );
}
