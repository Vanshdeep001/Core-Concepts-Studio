import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';

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
    { prompt: 'Divide 192.168.1.0/24 into 4 equal subnets for ~62 hosts each.', baseIp: [192,168,1,0], basePrefix: 24, expectedPrefix: 26, expectedCount: 4 },
    { prompt: 'Create 8 subnets from 10.0.0.0/8 (each with ~2M hosts).', baseIp: [10,0,0,0], basePrefix: 8, expectedPrefix: 11, expectedCount: 8 },
    { prompt: 'Split 172.16.0.0/16 into 2 subnets for ~32766 hosts each.', baseIp: [172,16,0,0], basePrefix: 16, expectedPrefix: 17, expectedCount: 2 },
];

/* ════════════════════════════════════════
   BUILD steps for CIDR walkthrough
   ════════════════════════════════════════ */
function buildSteps(octets, prefix) {
    const steps = [];
    const ipInt = ipToInt(...octets);
    for (let p = 8; p <= prefix; p += 4) {
        const effectiveP = Math.min(p, prefix);
        const net = getNetworkAddr(ipInt, effectiveP);
        const bcast = getBroadcast(ipInt, effectiveP);
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
    // Final step at exact prefix
    const net = getNetworkAddr(ipInt, prefix);
    const bcast = getBroadcast(ipInt, prefix);
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

    const [steps, setSteps] = useState([]);
    const [currentStep, setCurrentStep] = useState(-1);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [isSimMode, setIsSimMode] = useState(false);

    const timerRef = useRef(null);
    const stepRef = useRef(-1);
    const stepsRef = useRef([]);

    const ipInt = ipToInt(...octets);
    const mask = maskFromPrefix(prefix);
    const networkAddr = getNetworkAddr(ipInt, prefix);
    const broadcast = getBroadcast(ipInt, prefix);
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
    const handleReset = () => { clearInterval(timerRef.current); setSteps([]); stepsRef.current = []; setCurrentStep(-1); stepRef.current = -1; setIsRunning(false); setIsPaused(false); setIsFinished(false); setIsSimMode(false); setQuizIdx(null); setQuizResult(null); };
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

    // Add a subnet to the address space bar
    const addSubnet = (subPrefix) => {
        const netStart = subnets.length === 0 ? networkAddr : (subnets[subnets.length - 1].end + 1);
        const subMask = maskFromPrefix(subPrefix);
        const subNet = (netStart & subMask) >>> 0;
        const subBcast = (subNet | (~subMask & 0xffffffff)) >>> 0;
        if (subBcast > broadcast) return; // overflow
        const colors = ['#b39ddb','#90caf9','#a5d6a7','#ffcc80','#ef9a9a','#80deea','#ffe082','#ffab91'];
        setSubnets([...subnets, { start: subNet, end: subBcast, prefix: subPrefix, color: colors[subnets.length % colors.length] }]);
    };

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

    /* ════════════════════════════════════════
       32-BIT GRID RENDERER
       ════════════════════════════════════════ */
    const renderBitGrid = () => {
        const ipBits = bitsToBinaryStr(ipInt, 32);
        const maskBits = bitsToBinaryStr(mask, 32);
        const effectivePrefix = curStep ? curStep.prefix : prefix;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {/* Dotted decimal */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    {octets.map((o, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1rem' }}>{o}</span>
                            {i < 3 && <span style={{ fontWeight: 800, opacity: 0.3 }}>.</span>}
                        </div>
                    ))}
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.9rem', color: 'var(--orange)' }}>/{effectivePrefix}</span>
                </div>

                {/* IP bit row */}
                <div style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.4, marginBottom: '0.1rem' }}>IP Address</div>
                <div style={{ display: 'flex', gap: '0px', flexWrap: 'wrap' }}>
                    {ipBits.split('').map((bit, i) => {
                        const isNetwork = i < effectivePrefix;
                        return (
                            <motion.div
                                key={`ip-${i}`}
                                onClick={() => flipBit(i)}
                                animate={{ background: isNetwork ? '#ffb74d' : '#4dd0e1' }}
                                style={{
                                    width: 22, height: 22,
                                    border: '1.5px solid var(--border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.7rem',
                                    cursor: 'pointer',
                                    borderRight: (i + 1) % 8 === 0 ? '3px solid var(--border)' : '1.5px solid var(--border)',
                                }}
                            >{bit}</motion.div>
                        );
                    })}
                </div>

                {/* Subnet mask row */}
                <div style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.4, marginTop: '0.3rem', marginBottom: '0.1rem' }}>Subnet Mask</div>
                <div style={{ display: 'flex', gap: '0px', flexWrap: 'wrap' }}>
                    {maskBits.split('').map((bit, i) => (
                        <div key={`mask-${i}`} style={{
                            width: 22, height: 22,
                            border: '1.5px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.7rem',
                            background: bit === '1' ? '#ffb74d' : '#e0e0e0',
                            opacity: 0.8,
                            borderRight: (i + 1) % 8 === 0 ? '3px solid var(--border)' : '1.5px solid var(--border)',
                        }}>{bit}</div>
                    ))}
                </div>

                {/* CIDR slider */}
                <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.5, flexShrink: 0 }}>CIDR /</span>
                    <input type="range" min={1} max={30} value={prefix}
                        onChange={e => setPrefix(+e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0, width: 30, textAlign: 'right' }}>/{prefix}</span>
                </div>

                {/* Mask dotted decimal */}
                <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 600, opacity: 0.6, textAlign: 'center' }}>
                    Mask: {intToIpStr(mask)}
                </div>
            </div>
        );
    };

    /* ════════════════════════════════════════
       ADDRESS SPACE BAR
       ════════════════════════════════════════ */
    const renderAddressBar = () => {
        const totalRange = broadcast - networkAddr + 1;
        return (
            <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.4 }}>Address Space Bar</span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {[26, 27, 28].map(p => (
                            <button key={p} onClick={() => addSubnet(p)} style={{
                                fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.4rem',
                                border: '1.5px solid var(--border)', background: 'var(--white)',
                                cursor: 'pointer', fontFamily: 'var(--font-mono)',
                            }}>+/{p}</button>
                        ))}
                        <button onClick={() => setSubbnetsCleared()} style={{
                            fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.4rem',
                            border: '1.5px solid var(--border)', background: 'var(--pink)',
                            cursor: 'pointer',
                        }}>Clear</button>
                    </div>
                </div>
                <div style={{
                    height: 28, border: '2px solid var(--border)', display: 'flex',
                    background: '#e0e0e0', position: 'relative', overflow: 'hidden',
                }}>
                    {subnets.map((s, i) => {
                        const left = ((s.start - networkAddr) / totalRange) * 100;
                        const width = ((s.end - s.start + 1) / totalRange) * 100;
                        return (
                            <motion.div key={i} initial={{ width: 0 }} animate={{ width: `${width}%` }}
                                style={{
                                    position: 'absolute', left: `${left}%`, top: 0, bottom: 0,
                                    background: s.color, borderRight: '2px solid var(--border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.55rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
                                    overflow: 'hidden',
                                }}>/{s.prefix}</motion.div>
                        );
                    })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', fontFamily: 'var(--font-mono)', opacity: 0.5, marginTop: '0.1rem' }}>
                    <span>{intToIpStr(networkAddr)}</span>
                    <span>{intToIpStr(broadcast)}</span>
                </div>
            </div>
        );
    };

    // Fix: setSubbnetsCleared should be setSubnets([])
    const setSubbnetsCleared = () => setSubnets([]);

    /* ════════════════════════════════════════
       IPv6 DISPLAY
       ════════════════════════════════════════ */
    const renderIPv6 = () => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '0.5rem' }}>
            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>IPv6 — 128-bit Address</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1px', justifyContent: 'center' }}>
                {Array.from({ length: 8 }, (_, g) => (
                    <div key={g} style={{ display: 'flex', gap: '0px', marginRight: g < 7 ? '4px' : 0 }}>
                        {Array.from({ length: 16 }, (_, b) => (
                            <div key={b} style={{
                                width: 6, height: 14, background: (g * 16 + b) < 64 ? '#ffb74d' : '#4dd0e1',
                                border: '0.5px solid rgba(0,0,0,0.15)',
                            }} />
                        ))}
                    </div>
                ))}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 600, textAlign: 'center' }}>
                <div>2001:0db8:85a3:0000:0000:8a2e:0370:7334</div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    style={{ color: 'var(--green)', fontWeight: 800, marginTop: '0.2rem' }}>
                    → 2001:db8:85a3::8a2e:370:7334
                </motion.div>
            </div>
            <div style={{
                background: 'var(--yellow)', border: '2px solid var(--border)', padding: '0.3rem 0.6rem',
                fontSize: '0.72rem', fontWeight: 700, textAlign: 'center', boxShadow: 'var(--shadow-sm)',
            }}>
                IPv6 has 3.4 × 10³⁸ addresses<br />
                <span style={{ opacity: 0.7 }}>— enough for every grain of sand × 100</span>
            </div>
        </div>
    );

    /* ════════════════════════════════════════
       CENTER
       ════════════════════════════════════════ */
    const CENTER = (
        <div style={{ padding: '0.5rem', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            {/* IPv4/IPv6 toggle */}
            <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.4rem', flexShrink: 0 }}>
                {['ipv4', 'ipv6'].map(m => (
                    <button key={m} onClick={() => setMode(m)} style={{
                        padding: '0.25rem 0.7rem', fontSize: '0.72rem', fontWeight: 700,
                        border: '2px solid var(--border)',
                        background: mode === m ? 'var(--orange)' : 'var(--white)',
                        cursor: 'pointer', fontFamily: 'var(--font-main)',
                    }}>{m === 'ipv4' ? 'IPv4 (32-bit)' : 'IPv6 (128-bit)'}</button>
                ))}
            </div>

            {mode === 'ipv4' ? (
                <>
                    {renderBitGrid()}

                    {/* Computed values */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.3rem', marginTop: '0.5rem' }}>
                        {[
                            { label: 'Network', val: intToIpStr(networkAddr), color: '#ffb74d' },
                            { label: 'Broadcast', val: intToIpStr(broadcast), color: '#ef9a9a' },
                            { label: 'Usable Hosts', val: usableHosts.toLocaleString(), color: '#4dd0e1' },
                            { label: 'First Usable', val: intToIpStr(networkAddr + 1), color: '#a5d6a7' },
                            { label: 'Last Usable', val: intToIpStr(broadcast - 1), color: '#a5d6a7' },
                            { label: 'Class', val: addressClass, color: '#ce93d8' },
                        ].map(s => (
                            <div key={s.label} style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                                <div style={{ background: s.color, padding: '0.15rem 0.3rem', borderBottom: '1.5px solid var(--border)', fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase' }}>{s.label}</div>
                                <div style={{ padding: '0.2rem 0.3rem', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.72rem' }}>{s.val}</div>
                            </div>
                        ))}
                    </div>

                    {renderAddressBar()}

                    {/* Quiz */}
                    {quizIdx !== null && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{ marginTop: '0.5rem', border: '2px solid var(--border)', background: 'var(--yellow)', padding: '0.5rem', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.75rem', marginBottom: '0.3rem' }}>🧩 Quiz Challenge</div>
                            <div style={{ fontSize: '0.78rem', marginBottom: '0.3rem' }}>{QUIZ_SCENARIOS[quizIdx].prompt}</div>
                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                                <button onClick={checkQuiz} style={{
                                    padding: '0.2rem 0.5rem', fontSize: '0.7rem', fontWeight: 700,
                                    border: '2px solid var(--border)', background: 'var(--green)', cursor: 'pointer',
                                }}>Check Answer</button>
                                {quizResult && (
                                    <span style={{
                                        padding: '0.2rem 0.5rem', fontWeight: 800, fontSize: '0.72rem',
                                        background: quizResult === 'correct' ? 'var(--green)' : 'var(--pink)',
                                        border: '2px solid var(--border)',
                                    }}>{quizResult === 'correct' ? '✓ Correct!' : '✗ Try again — check subnet count and sizes'}</span>
                                )}
                            </div>
                        </motion.div>
                    )}
                </>
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
            <div style={{ marginTop: '0.3rem', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.4 }}>Quiz Mode</div>
            {QUIZ_SCENARIOS.map((q, i) => (
                <button key={i} onClick={() => { setQuizIdx(i); setOctets(q.baseIp); setPrefix(q.basePrefix); setSubnets([]); setQuizResult(null); }}
                    style={{
                        padding: '0.25rem 0.4rem', fontSize: '0.65rem', fontWeight: 700,
                        border: '2px solid var(--border)', textAlign: 'left',
                        background: quizIdx === i ? 'var(--yellow)' : 'var(--white)',
                        cursor: 'pointer',
                    }}>Quiz {i + 1}</button>
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
                    <div style={{ background: 'var(--yellow)', padding: '0.4rem 0.6rem', borderBottom: '2px solid var(--border)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>💡 Educational Insight</div>
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
            icon="🔢"
            moduleLabel="CN MODULE"
            isRunning={isRunning} isPaused={isPaused} isFinished={isFinished}
            speed={speed} onSpeedChange={setSpeed}
            onStart={handleStart} onPause={handlePause} onResume={handleResume} onReset={handleReset} onStep={handleStep}
            currentStepNum={Math.max(0, currentStep + 1)} totalSteps={steps.length}
            phaseName={curStep ? `/${curStep.prefix}` : ''} centerContent={CENTER} leftContent={LEFT} rightContent={RIGHT}
            timelineItems={TL}
            legend={[
                { color: '#ffb74d', label: 'Network bits' },
                { color: '#4dd0e1', label: 'Host bits' },
                { color: '#ef9a9a', label: 'Broadcast' },
                { color: '#a5d6a7', label: 'Usable' },
            ]}
        >
            {/* Config mode */}
            <div className="main-content">
                <div style={{ marginBottom: '0.4rem' }}><Link to="/networks" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← Networks Module</Link></div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="section-header">Networks · Network Layer</div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 700 }}>🔢 IP Addressing & Subnetting</h1>
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
