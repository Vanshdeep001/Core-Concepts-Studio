import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';

/* ════════════════════════════════════════
   DATA — DNS chain, TLS panels, status codes
   ════════════════════════════════════════ */
const DNS_CHAIN = [
    { id: 'browser', label: 'Browser Cache', icon: '🌐', color: '#b39ddb' },
    { id: 'os', label: 'OS Cache', icon: '💻', color: '#ce93d8' },
    { id: 'resolver', label: 'Recursive Resolver', icon: '🔄', color: '#90caf9' },
    { id: 'root', label: 'Root NS', icon: '🌍', color: '#a5d6a7' },
    { id: 'tld', label: 'TLD NS (.com)', icon: '📋', color: '#ffcc80' },
    { id: 'auth', label: 'Authoritative NS', icon: '✅', color: '#4dd0e1' },
];

const TLS_PANELS = [
    { id: 'client-hello', title: 'Client Hello', desc: 'Client sends supported cipher suites, TLS version, and random number to server.', icon: '📤', color: '#b39ddb' },
    { id: 'server-hello', title: 'Server Hello + Certificate', desc: 'Server selects cipher suite, sends its certificate (public key + CA signature).', icon: '📜', color: '#90caf9' },
    { id: 'key-exchange', title: 'Key Exchange', desc: 'Client and server perform Diffie-Hellman exchange to derive a shared secret key.', icon: '🔑', color: '#ffcc80' },
    { id: 'cipher-spec', title: 'Change Cipher Spec', desc: 'Both sides confirm switching to encrypted communication using the shared key.', icon: '🔄', color: '#a5d6a7' },
    { id: 'finished', title: 'Finished', desc: 'Handshake complete! All subsequent data is encrypted. Green padlock appears.', icon: '🔒', color: '#4dd0e1' },
];

const STATUS_CODES = {
    200: { text: 'OK', color: '#4caf50', desc: 'Request successful. Server returns the requested resource.' },
    301: { text: 'Moved Permanently', color: '#ff9800', desc: 'Resource has moved to a new URL. Browser follows the redirect.' },
    404: { text: 'Not Found', color: '#f44336', desc: 'Server cannot find the requested resource. The URL may be wrong.' },
    500: { text: 'Internal Server Error', color: '#b71c1c', desc: 'Server encountered an unexpected error. Not the client\'s fault.' },
};

const HTTP_METHODS = {
    GET: { color: '#4dd0e1', desc: 'Retrieve a resource' },
    POST: { color: '#64b5f6', desc: 'Submit data' },
    PUT: { color: '#ffb74d', desc: 'Update a resource' },
    DELETE: { color: '#ef5350', desc: 'Remove a resource' },
};

const FAILURES = [
    { id: 'dns-timeout', label: 'DNS Timeout', icon: '⏱', breakAt: 'dns', desc: 'DNS resolver fails to respond → ERR_NAME_NOT_RESOLVED' },
    { id: 'ssl-expired', label: 'Expired SSL Cert', icon: '⚠', breakAt: 'tls', desc: 'TLS handshake fails — certificate expired or invalid' },
    { id: 'server-500', label: 'Server 500', icon: '💥', breakAt: 'response', desc: 'Server crashes — returns 500 Internal Server Error' },
    { id: 'redirect-loop', label: 'Redirect Loop', icon: '🔁', breakAt: 'response-redirect', desc: '301→301→301 infinite redirect loop detected' },
    { id: 'slow-ttfb', label: 'Slow TTFB', icon: '🐢', breakAt: 'ttfb', desc: 'Time to First Byte is very high — server processing is slow' },
];

/* ════════════════════════════════════════
   BUILD — simulation steps
   ════════════════════════════════════════ */
function buildSteps(url, isHttps, cacheHitAt, failure) {
    const steps = [];
    const parsedUrl = parseUrl(url);
    const timings = { dns: 0, tcp: 0, tls: 0, ttfb: 0, download: 0 };

    // URL parsing
    steps.push({
        phase: 'parse', parsedUrl, isHttps, timings: { ...timings },
        explanation: `Parsing URL: protocol=${parsedUrl.protocol}, domain=${parsedUrl.domain}, path=${parsedUrl.path}${parsedUrl.query ? ', query=' + parsedUrl.query : ''}`,
        insight: 'URL ANATOMY: The protocol (http/https) tells the browser which port and encryption to use. The domain maps to an IP via DNS.',
    });

    // DNS Resolution
    const dnsSteps = DNS_CHAIN.length;
    let cacheHit = false;
    for (let i = 0; i < dnsSteps; i++) {
        const node = DNS_CHAIN[i];
        if (failure === 'dns-timeout' && i === 2) {
            timings.dns += 5000;
            steps.push({
                phase: 'dns', dnsNode: i, dnsHit: false, failed: true, timings: { ...timings },
                explanation: `❌ DNS TIMEOUT at ${node.label}! The recursive resolver failed to respond within the timeout period.`,
                insight: 'DNS FAILURE: If no DNS server responds, the browser shows ERR_NAME_NOT_RESOLVED. Check your internet connection or DNS settings.',
            });
            steps.push({ phase: 'done-error', error: 'ERR_NAME_NOT_RESOLVED', timings: { ...timings }, explanation: 'Browser displays error page: DNS name could not be resolved.', insight: 'Without DNS resolution, the browser has no IP address to connect to.' });
            return steps;
        }
        timings.dns += (i === 0 ? 1 : i < 3 ? 10 : 50);
        if (cacheHitAt === node.id) {
            cacheHit = true;
            steps.push({
                phase: 'dns', dnsNode: i, dnsHit: true, cacheHitNode: node.label, ttl: 300 - i * 50, timings: { ...timings },
                explanation: `✓ Cache HIT at ${node.label}! IP address found without querying further. TTL: ${300 - i * 50}s remaining.`,
                insight: 'DNS CACHING: Caching avoids repeated lookups. Each cached entry has a TTL (Time To Live) after which it expires and must be refreshed.',
            });
            break;
        }
        steps.push({
            phase: 'dns', dnsNode: i, dnsHit: false, timings: { ...timings },
            explanation: `Querying ${node.label}... ${i < dnsSteps - 1 ? 'Cache miss — forwarding to next level.' : 'Authoritative answer received: ' + parsedUrl.domain + ' → 93.184.216.34'}`,
            insight: i === 3 ? 'ROOT NAMESERVERS: 13 root server clusters worldwide. They direct queries to the correct TLD server.' :
                     i === 4 ? 'TLD NAMESERVER: Manages all domains under a TLD (e.g., .com, .org). Points to the authoritative NS.' :
                     i === 5 ? 'AUTHORITATIVE NS: The final answer! This server holds the actual DNS records for the domain.' :
                     `DNS lookup traverses the hierarchy from local caches to authoritative nameservers.`,
        });
    }

    // TCP connect
    timings.tcp = 15;
    steps.push({
        phase: 'tcp', timings: { ...timings },
        explanation: 'TCP 3-way handshake: SYN → SYN-ACK → ACK. Connection established on port ' + (isHttps ? '443' : '80') + '.',
        insight: 'TCP CONNECTION: Before any HTTP data can flow, a reliable TCP connection must be established via the 3-way handshake.',
    });

    // TLS handshake (HTTPS only)
    if (isHttps) {
        if (failure === 'ssl-expired') {
            timings.tls = 50;
            steps.push({
                phase: 'tls', tlsPanel: 1, failed: true, timings: { ...timings },
                explanation: '❌ TLS HANDSHAKE FAILED! Server certificate has expired. Browser refuses to establish encrypted connection.',
                insight: 'CERTIFICATE EXPIRY: SSL/TLS certificates have a validity period. Expired certs trigger browser security warnings.',
            });
            steps.push({
                phase: 'tls-error', timings: { ...timings },
                explanation: 'Browser shows security warning page: "Your connection is not private" (NET::ERR_CERT_DATE_INVALID).',
                insight: 'Users can sometimes bypass this warning, but it indicates a serious configuration issue on the server.',
            });
            // Continue to show the error state, don't return early
        } else {
            for (let i = 0; i < TLS_PANELS.length; i++) {
                timings.tls += 10;
                steps.push({
                    phase: 'tls', tlsPanel: i, failed: false, timings: { ...timings },
                    explanation: `TLS Step ${i + 1}: ${TLS_PANELS[i].title} — ${TLS_PANELS[i].desc}`,
                    insight: i === 2 ? 'KEY EXCHANGE: Diffie-Hellman allows both parties to derive the same secret key without ever transmitting it. Even if someone intercepts all traffic, they can\'t derive the key.' :
                             i === 4 ? 'HTTPS COMPLETE: All data is now encrypted with AES-256 or similar. The green padlock indicates a secure connection.' :
                             `TLS provides encryption (confidentiality), integrity (tampering detection), and authentication (server identity verification).`,
                });
            }
        }
    }

    // HTTP Request
    steps.push({
        phase: 'request', method: 'GET', path: parsedUrl.path, timings: { ...timings },
        explanation: `Sending HTTP ${isHttps ? '(encrypted) ' : ''}request: GET ${parsedUrl.path} HTTP/1.1\\nHost: ${parsedUrl.domain}\\nUser-Agent: Browser/1.0`,
        insight: 'HTTP REQUEST: The method (GET/POST/PUT/DELETE) tells the server what action to perform. Headers provide metadata like cookies, content type, etc.',
    });

    // HTTP Response
    if (failure === 'server-500') {
        timings.ttfb = 200;
        steps.push({
            phase: 'response', statusCode: 500, timings: { ...timings },
            explanation: '💥 Server returned 500 Internal Server Error! An unexpected error occurred on the server.',
            insight: '5xx ERRORS: Server-side errors. The client request was valid, but the server failed to process it. Common causes: bug, database down, out of memory.',
        });
    } else if (failure === 'redirect-loop') {
        timings.ttfb = 50;
        for (let i = 0; i < 4; i++) {
            steps.push({
                phase: 'response', statusCode: 301, redirectCount: i + 1, timings: { ...timings },
                explanation: `🔁 Redirect #${i + 1}: 301 Moved Permanently → ${parsedUrl.domain}${parsedUrl.path}. ${i >= 2 ? 'REDIRECT LOOP DETECTED!' : 'Following redirect...'}`,
                insight: i >= 2 ? 'REDIRECT LOOP: The browser detects circular redirects and stops after ~20 iterations, showing ERR_TOO_MANY_REDIRECTS.' : '301 REDIRECT: The resource has permanently moved. Browser automatically follows the new Location header.',
            });
        }
    } else if (failure === 'slow-ttfb') {
        timings.ttfb = 3000;
        steps.push({
            phase: 'response', statusCode: 200, slowTtfb: true, timings: { ...timings },
            explanation: '🐢 Extremely slow TTFB (3000ms)! Server took too long to start sending the response. User experience severely impacted.',
            insight: 'TTFB (Time to First Byte): Measures how long the browser waits for the first byte of the response. Ideally < 200ms. Slow TTFB = server is overloaded or has slow database queries.',
        });
    } else {
        timings.ttfb = 120;
        steps.push({
            phase: 'response', statusCode: 200, timings: { ...timings },
            explanation: '✅ 200 OK! Server responds with the requested HTML document. Content-Type: text/html, Content-Length: 45,230 bytes.',
            insight: '200 OK: The request was successful. The response body contains the requested resource.',
        });
    }

    // Download + render
    timings.download = 80;
    steps.push({
        phase: 'render', timings: { ...timings },
        totalTime: timings.dns + timings.tcp + timings.tls + timings.ttfb + timings.download,
        explanation: 'Page rendering begins. Browser parses HTML, fetches CSS/JS/images, builds the DOM tree, and paints to screen.',
        insight: 'CRITICAL RENDERING PATH: HTML parsing → CSS parsing → Render tree → Layout → Paint. Each sub-resource (CSS, JS, images) may require additional DNS+TCP+TLS+HTTP cycles.',
    });

    // Done
    steps.push({
        phase: 'done', timings: { ...timings },
        totalTime: timings.dns + timings.tcp + timings.tls + timings.ttfb + timings.download,
        explanation: `Page load complete! Total time: ${timings.dns + timings.tcp + timings.tls + timings.ttfb + timings.download}ms.`,
        insight: 'The full journey: URL → DNS → TCP → TLS → HTTP Request → Server Processing → Response → Render. Each step adds latency.',
    });

    return steps;
}

function parseUrl(url) {
    try {
        const hasProtocol = url.includes('://');
        const full = hasProtocol ? url : 'https://' + url;
        const u = new URL(full);
        return { protocol: u.protocol.replace(':', ''), domain: u.hostname, path: u.pathname || '/', query: u.search || '' };
    } catch {
        return { protocol: 'https', domain: url || 'example.com', path: '/', query: '' };
    }
}

/* ════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════ */
export default function HttpDnsSim() {
    const [url, setUrl] = useState('https://www.example.com/page?q=hello');
    const [isHttps, setIsHttps] = useState(true);
    const [cacheHitAt, setCacheHitAt] = useState(null);
    const [activeFailure, setActiveFailure] = useState(null);
    const [httpVersion, setHttpVersion] = useState('1.1');
    const [speed, setSpeed] = useState(700);
    const [expandedTls, setExpandedTls] = useState(null);

    const [steps, setSteps] = useState([]);
    const [currentStep, setCurrentStep] = useState(-1);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [isSimMode, setIsSimMode] = useState(false);

    const timerRef = useRef(null);
    const stepRef = useRef(-1);
    const stepsRef = useRef([]);

    const curStep = currentStep >= 0 && currentStep < steps.length ? steps[currentStep] : null;

    // Update isHttps when URL changes
    useEffect(() => {
        setIsHttps(url.startsWith('https') || (!url.includes('://') && !url.startsWith('http://')));
    }, [url]);

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
        const s = buildSteps(url, isHttps, cacheHitAt, activeFailure);
        stepsRef.current = s; setSteps(s);
        setCurrentStep(-1); stepRef.current = -1;
        setIsRunning(true); setIsPaused(false); setIsFinished(false); setIsSimMode(true);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(advanceStep, speed);
    };
    const handlePause = () => { setIsRunning(false); setIsPaused(true); clearInterval(timerRef.current); };
    const handleResume = () => { setIsRunning(true); setIsPaused(false); timerRef.current = setInterval(advanceStep, speed); };
    const handleReset = () => { clearInterval(timerRef.current); setSteps([]); stepsRef.current = []; setCurrentStep(-1); stepRef.current = -1; setIsRunning(false); setIsPaused(false); setIsFinished(false); setIsSimMode(false); setActiveFailure(null); setExpandedTls(null); };
    const handleStep = () => {
        if (!isSimMode) {
            const s = buildSteps(url, isHttps, cacheHitAt, activeFailure);
            stepsRef.current = s; setSteps(s);
            setIsSimMode(true); stepRef.current = -1;
        }
        advanceStep();
    };

    useEffect(() => () => clearInterval(timerRef.current), []);

    const parsedUrl = parseUrl(url);

    /* ════════════════════════════════════════
       CENTER
       ════════════════════════════════════════ */
    const CENTER = (
        <div style={{ padding: '0.5rem', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Browser bar */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.35rem 0.6rem', background: 'var(--white)',
                border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)',
                marginBottom: '0.4rem', flexShrink: 0,
            }}>
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5 }}
                    style={{ fontSize: '1rem' }}>
                    {isHttps ? '🔒' : '🔓'}
                </motion.div>
                {!isHttps && (
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#e53935', padding: '0.1rem 0.3rem', background: '#ffcdd2', border: '1px solid #e53935' }}>
                        Not Secure
                    </span>
                )}
                <div style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', display: 'flex', flexWrap: 'wrap' }}>
                    <span style={{ color: isHttps ? '#4caf50' : '#ff9800', fontWeight: 700 }}>{parsedUrl.protocol}://</span>
                    <span style={{ color: 'var(--text)', fontWeight: 800 }}>{parsedUrl.domain}</span>
                    <span style={{ color: '#1565c0' }}>{parsedUrl.path}</span>
                    {parsedUrl.query && <span style={{ color: '#7b1fa2' }}>{parsedUrl.query}</span>}
                </div>
            </div>

            {/* Comic strip panels */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', scrollbarWidth: 'thin' }}>
                {/* DNS chain */}
                {(curStep?.phase === 'dns' || (curStep && ['tcp','tls','request','response','render','done','done-error','tls-error'].includes(curStep.phase))) && (
                    <div style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', flexShrink: 0 }}>
                        <div style={{ background: '#b39ddb', padding: '0.25rem 0.5rem', borderBottom: '2px solid var(--border)', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase' }}>
                            DNS Resolution Chain
                        </div>
                        <div style={{ padding: '0.3rem', display: 'flex', gap: '0.2rem', overflowX: 'auto' }}>
                            {DNS_CHAIN.map((node, i) => {
                                const isReached = curStep.phase === 'dns' ? i <= curStep.dnsNode : true;
                                const isActive = curStep.phase === 'dns' && i === curStep.dnsNode;
                                const isHit = curStep.phase === 'dns' && curStep.dnsHit && i === curStep.dnsNode;
                                const isFailed = curStep.phase === 'dns' && curStep.failed && i === curStep.dnsNode;
                                return (
                                    <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', flexShrink: 0 }}>
                                        <motion.div
                                            animate={{ scale: isActive ? 1.1 : 1, boxShadow: isActive ? 'var(--shadow-sm)' : 'none' }}
                                            style={{
                                                padding: '0.2rem 0.35rem', border: '2px solid var(--border)',
                                                background: isFailed ? 'var(--pink)' : isHit ? 'var(--green)' : isActive ? 'var(--yellow)' : isReached ? node.color : '#e0e0e0',
                                                fontSize: '0.58rem', fontWeight: 700, textAlign: 'center',
                                                opacity: isReached ? 1 : 0.4, minWidth: 55,
                                            }}
                                        >
                                            <div>{node.icon}</div>
                                            <div>{node.label}</div>
                                            {isHit && <div style={{ color: '#2e7d32', fontWeight: 800 }}>✓ HIT</div>}
                                            {isFailed && <div style={{ color: '#c62828', fontWeight: 800 }}>✕ TIMEOUT</div>}
                                        </motion.div>
                                        {i < DNS_CHAIN.length - 1 && (
                                            <div style={{ width: 12, height: 2, background: isReached ? 'var(--border)' : '#ccc' }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* TLS handshake panels */}
                {isHttps && curStep?.phase === 'tls' && (
                    <div style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', flexShrink: 0 }}>
                        <div style={{ background: '#4dd0e1', padding: '0.25rem 0.5rem', borderBottom: '2px solid var(--border)', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase' }}>
                            TLS Handshake
                        </div>
                        <div style={{ padding: '0.3rem', display: 'flex', gap: '0.2rem', overflowX: 'auto' }}>
                            {TLS_PANELS.map((panel, i) => {
                                const isReached = i <= curStep.tlsPanel;
                                const isActive = i === curStep.tlsPanel;
                                const isFailed = curStep.failed && isActive;
                                return (
                                    <motion.div
                                        key={panel.id}
                                        onClick={() => setExpandedTls(expandedTls === i ? null : i)}
                                        animate={{ scale: isActive ? 1.05 : 1 }}
                                        style={{
                                            padding: '0.3rem', border: '2px solid var(--border)',
                                            background: isFailed ? 'var(--pink)' : isActive ? 'var(--yellow)' : isReached ? panel.color : '#e0e0e0',
                                            fontSize: '0.6rem', fontWeight: 700, textAlign: 'center',
                                            opacity: isReached ? 1 : 0.4, cursor: 'pointer',
                                            minWidth: 70, flexShrink: 0,
                                        }}
                                    >
                                        <div style={{ fontSize: '1rem' }}>{isFailed ? '⚠' : panel.icon}</div>
                                        <div>{panel.title}</div>
                                        {isFailed && <div style={{ color: '#c62828', fontWeight: 800, fontSize: '0.55rem' }}>FAILED</div>}
                                    </motion.div>
                                );
                            })}
                        </div>
                        {expandedTls !== null && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }}
                                style={{ padding: '0.3rem 0.5rem', background: 'rgba(0,0,0,0.03)', borderTop: '1px solid var(--border)', fontSize: '0.72rem', lineHeight: 1.4 }}>
                                <strong>{TLS_PANELS[expandedTls].title}:</strong> {TLS_PANELS[expandedTls].desc}
                            </motion.div>
                        )}
                    </div>
                )}

                {/* HTTP Request/Response */}
                {curStep?.phase === 'request' && (
                    <div style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', flexShrink: 0 }}>
                        <div style={{ background: 'var(--cyan)', padding: '0.25rem 0.5rem', borderBottom: '2px solid var(--border)', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase' }}>
                            HTTP Request
                        </div>
                        <div style={{ padding: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                <span style={{
                                    padding: '0.15rem 0.5rem', fontWeight: 800, fontSize: '0.75rem',
                                    background: HTTP_METHODS.GET.color, border: '2px solid var(--border)',
                                    fontFamily: 'var(--font-mono)',
                                }}>GET</span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600 }}>{parsedUrl.path} HTTP/1.1</span>
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', opacity: 0.7, borderLeft: '3px solid var(--cyan)', paddingLeft: '0.4rem' }}>
                                Host: {parsedUrl.domain}<br />
                                User-Agent: Browser/1.0<br />
                                Accept: text/html<br />
                                Connection: keep-alive
                            </div>
                        </div>
                    </div>
                )}

                {curStep?.phase === 'response' && (
                    <div style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', flexShrink: 0 }}>
                        <div style={{ background: 'var(--green)', padding: '0.25rem 0.5rem', borderBottom: '2px solid var(--border)', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase' }}>
                            HTTP Response
                        </div>
                        <div style={{ padding: '0.4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                            <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                style={{
                                    fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-mono)',
                                    color: STATUS_CODES[curStep.statusCode]?.color || '#333',
                                    textShadow: '2px 2px 0 rgba(0,0,0,0.1)',
                                }}
                            >{curStep.statusCode}</motion.div>
                            <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                                {STATUS_CODES[curStep.statusCode]?.text || 'Unknown'}
                            </div>
                            {curStep.redirectCount && (
                                <div style={{
                                    display: 'flex', gap: '0.2rem', alignItems: 'center',
                                    padding: '0.2rem 0.5rem', background: 'var(--orange)', border: '2px solid var(--border)',
                                    fontSize: '0.7rem', fontWeight: 700,
                                }}>
                                    🔁 Redirect #{curStep.redirectCount}
                                    {curStep.redirectCount >= 3 && <span style={{ color: '#c62828' }}> — LOOP DETECTED!</span>}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Waterfall timeline */}
                {curStep?.timings && curStep.phase !== 'parse' && (
                    <div style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', flexShrink: 0 }}>
                        <div style={{ background: 'var(--yellow)', padding: '0.25rem 0.5rem', borderBottom: '2px solid var(--border)', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Waterfall Timeline</span>
                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                                {['1.1', '2'].map(v => (
                                    <button key={v} onClick={() => setHttpVersion(v)} style={{
                                        fontSize: '0.55rem', fontWeight: 700, padding: '0.1rem 0.3rem',
                                        border: '1.5px solid var(--border)',
                                        background: httpVersion === v ? 'var(--cyan)' : 'var(--white)',
                                        cursor: 'pointer',
                                    }}>HTTP/{v}</button>
                                ))}
                            </div>
                        </div>
                        <div style={{ padding: '0.3rem 0.5rem' }}>
                            {[
                                { label: 'DNS', time: curStep.timings.dns, color: '#b39ddb' },
                                { label: 'TCP', time: curStep.timings.tcp, color: '#90caf9' },
                                ...(isHttps ? [{ label: 'TLS', time: curStep.timings.tls, color: '#4dd0e1' }] : []),
                                { label: 'TTFB', time: curStep.timings.ttfb, color: '#ffcc80' },
                                { label: 'Download', time: curStep.timings.download, color: '#a5d6a7' },
                            ].map(bar => {
                                const maxTime = Math.max(1, Object.values(curStep.timings).reduce((a, b) => a + b, 0));
                                const width = Math.max(3, (bar.time / maxTime) * 100);
                                return (
                                    <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.15rem' }}>
                                        <span style={{ fontSize: '0.6rem', fontWeight: 700, width: 50, textAlign: 'right', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>{bar.label}</span>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${width}%` }}
                                            style={{
                                                height: 14, background: bar.color,
                                                border: '1.5px solid var(--border)',
                                                display: 'flex', alignItems: 'center', paddingLeft: '0.2rem',
                                                fontSize: '0.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                                                overflow: 'hidden', whiteSpace: 'nowrap',
                                            }}
                                        >{bar.time}ms</motion.div>
                                    </div>
                                );
                            })}
                            <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', fontWeight: 700, opacity: 0.5, marginTop: '0.2rem', textAlign: 'right' }}>
                                Total: {Object.values(curStep.timings).reduce((a, b) => a + b, 0)}ms
                            </div>
                        </div>
                    </div>
                )}

                {/* Failure injection panel */}
                <div style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{ background: 'var(--pink)', padding: '0.25rem 0.5rem', borderBottom: '2px solid var(--border)', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase' }}>
                        Failure Injection
                    </div>
                    <div style={{ padding: '0.3rem', display: 'flex', gap: '0.2rem', flexWrap: 'wrap' }}>
                        {FAILURES.map(f => (
                            <button key={f.id}
                                onClick={() => setActiveFailure(activeFailure === f.id ? null : f.id)}
                                style={{
                                    padding: '0.2rem 0.4rem', fontSize: '0.6rem', fontWeight: 700,
                                    border: '2px solid var(--border)',
                                    background: activeFailure === f.id ? 'var(--pink)' : 'var(--white)',
                                    cursor: 'pointer',
                                }}
                            >{f.icon} {f.label}</button>
                        ))}
                    </div>
                    {activeFailure && (
                        <div style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', opacity: 0.7, borderTop: '1px solid var(--border)' }}>
                            {FAILURES.find(f => f.id === activeFailure)?.desc}
                        </div>
                    )}
                </div>

                {!curStep && (
                    <div style={{ textAlign: 'center', opacity: 0.3, padding: '1.5rem', fontSize: '0.85rem' }}>
                        Press Enter in the URL bar or Start to begin the journey...
                    </div>
                )}
            </div>
        </div>
    );

    /* ════════════════════════════════════════
       LEFT — System State
       ════════════════════════════════════════ */
    const LEFT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
                { label: 'DNS Time', val: `${curStep?.timings?.dns ?? 0}ms`, color: '#b39ddb' },
                { label: 'TCP Time', val: `${curStep?.timings?.tcp ?? 0}ms`, color: '#90caf9' },
                { label: 'TLS Time', val: `${curStep?.timings?.tls ?? 0}ms`, color: '#4dd0e1' },
                { label: 'TTFB', val: `${curStep?.timings?.ttfb ?? 0}ms`, color: '#ffcc80' },
                { label: 'Total Load', val: `${curStep?.totalTime ?? Object.values(curStep?.timings ?? {}).reduce((a,b)=>a+b,0)}ms`, color: 'var(--green)' },
                { label: 'Status Code', val: curStep?.statusCode ?? '—', color: curStep?.statusCode ? (STATUS_CODES[curStep.statusCode]?.color || 'var(--white)') : 'var(--white)' },
                { label: 'Cache Hit', val: curStep?.dnsHit ? 'Yes ✓' : 'No', color: curStep?.dnsHit ? 'var(--green)' : 'var(--pink)' },
            ].map(s => (
                <div key={s.label} style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ background: s.color, padding: '0.2rem 0.4rem', borderBottom: '2px solid var(--border)', fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase' }}>{s.label}</div>
                    <div style={{ padding: '0.25rem 0.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{s.val}</div>
                </div>
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
                            <div style={{ background: 'var(--pink)', padding: '0.4rem 0.6rem', borderBottom: '2px solid var(--border)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>Algorithm Logic</div>
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
                <div style={{ background: 'var(--green)', padding: '0.4rem 0.6rem', borderBottom: '2px solid var(--border)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>HTTP Methods</div>
                <div style={{ padding: '0.4rem', display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                    {Object.entries(HTTP_METHODS).map(([m, info]) => (
                        <div key={m} style={{
                            padding: '0.2rem 0.5rem', background: info.color,
                            border: '2px solid var(--border)', fontWeight: 800,
                            fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
                        }}>{m}</div>
                    ))}
                </div>
            </div>
            <div style={{ border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <div style={{ background: 'var(--cyan)', padding: '0.4rem 0.6rem', borderBottom: '2px solid var(--border)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>Concept: DNS Hierarchy</div>
                <div style={{ padding: '0.5rem 0.6rem', fontSize: '0.78rem', lineHeight: 1.5, opacity: 0.8 }}>
                    DNS is a <strong>hierarchical distributed database</strong>. Queries flow from local caches → recursive resolver → root → TLD → authoritative nameserver. Each level narrows down the domain until the exact IP is found.
                </div>
            </div>
        </div>
    );

    const TL = steps.map((s, i) => ({
        id: i,
        label: s.phase === 'dns' ? `DNS:${DNS_CHAIN[s.dnsNode]?.label?.split(' ')[0] || ''}` :
               s.phase === 'tls' ? `TLS:${s.tlsPanel + 1}` :
               s.phase,
        done: i < currentStep, active: i === currentStep,
    }));

    return (
        <ImmersiveLayout
            isActive={isSimMode}
            title="HTTP/HTTPS & DNS"
            icon="🌍"
            moduleLabel="CN MODULE"
            isRunning={isRunning} isPaused={isPaused} isFinished={isFinished}
            speed={speed} onSpeedChange={setSpeed}
            onStart={handleStart} onPause={handlePause} onResume={handleResume} onReset={handleReset} onStep={handleStep}
            currentStepNum={Math.max(0, currentStep + 1)} totalSteps={steps.length}
            phaseName={curStep?.phase ?? ''} centerContent={CENTER} leftContent={LEFT} rightContent={RIGHT}
            timelineItems={TL}
            legend={[
                { color: '#b39ddb', label: 'DNS' },
                { color: '#90caf9', label: 'TCP' },
                { color: '#4dd0e1', label: 'TLS' },
                { color: '#ffcc80', label: 'TTFB' },
                { color: '#a5d6a7', label: 'Download' },
                { color: 'var(--pink)', label: 'Error' },
            ]}
        >
            <div className="main-content">
                <div style={{ marginBottom: '0.4rem' }}><Link to="/networks" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← Networks Module</Link></div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="section-header">Networks · Application Layer</div>
                    <h1 style={{ fontSize: '1.9rem', fontWeight: 700 }}>🌍 HTTP/HTTPS & DNS</h1>
                    <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '0.3rem' }}>Type a URL and watch the full journey: DNS resolution, TLS handshake, HTTP request/response, waterfall timeline, and failure injection.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                    <div className="panel">
                        <div className="panel-header" style={{ background: 'var(--pink)' }}>⚙ Configuration</div>
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <label className="form-label">URL</label>
                                <input type="text" className="form-input" value={url}
                                    onChange={e => setUrl(e.target.value)}
                                    placeholder="https://www.example.com/page"
                                    style={{ fontFamily: 'var(--font-mono)' }} />
                            </div>
                            <div>
                                <label className="form-label">Simulate DNS Cache Hit At</label>
                                <select className="form-select" value={cacheHitAt || ''} onChange={e => setCacheHitAt(e.target.value || null)}>
                                    <option value="">No cache hit (full resolution)</option>
                                    {DNS_CHAIN.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="panel">
                        <div className="panel-header" style={{ background: 'var(--pink)' }}>🏷 Concepts Covered</div>
                        <div style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                                {['DNS','TLS','Handshake','Status codes','TTFB','Waterfall','Cache'].map(t => (
                                    <span key={t} style={{
                                        fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                                        padding: '0.2rem 0.5rem', border: '2px solid var(--border)', background: 'var(--pink)',
                                    }}>{t}</span>
                                ))}
                            </div>
                            <p style={{ fontSize: '0.82rem', opacity: 0.7 }}>Trace DNS queries, watch TLS negotiate encryption, inspect HTTP headers, analyze waterfall timing, and inject failures.</p>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-lg btn-pink" onClick={handleStart}>▶ Simulate</button>
                    <button className="btn btn-sm" style={{ marginTop: '0.15rem' }} onClick={handleStep}>⏭ Step Through</button>
                </div>
            </div>
        </ImmersiveLayout>
    );
}
