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
    { id: 'finished', title: 'Finished', desc: 'Handshake complete! All subsequent data is encrypted. Padlock secures the connection.', icon: '🔒', color: '#4dd0e1' },
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
        } else {
            for (let i = 0; i < TLS_PANELS.length; i++) {
                timings.tls += 10;
                steps.push({
                    phase: 'tls', tlsPanel: i, failed: false, timings: { ...timings },
                    explanation: `TLS Step ${i + 1}: ${TLS_PANELS[i].title} — ${TLS_PANELS[i].desc}`,
                    insight: i === 2 ? 'KEY EXCHANGE: Diffie-Hellman allows both parties to derive the same secret key without ever transmitting it. Even if someone intercepts all traffic, they can\'t derive the key.' :
                             i === 4 ? 'HTTPS COMPLETE: All data is now encrypted. The padlock icon indicates a secure connection.' :
                             `TLS provides encryption (confidentiality), integrity (tampering detection), and authentication (server identity verification).`,
                });
            }
        }
    }

    // HTTP Request
    steps.push({
        phase: 'request', method: 'GET', path: parsedUrl.path, timings: { ...timings },
        explanation: `Sending HTTP ${isHttps ? '(encrypted) ' : ''}request: GET ${parsedUrl.path} HTTP/1.1\\nHost: ${parsedUrl.domain}`,
        insight: 'HTTP REQUEST: The method (GET/POST) tells the server what action to perform. Headers provide metadata like cookies, content type, etc.',
    });

    // HTTP Response
    if (failure === 'server-500') {
        timings.ttfb = 200;
        steps.push({
            phase: 'response', statusCode: 500, timings: { ...timings },
            explanation: '💥 Server returned 500 Internal Server Error! An unexpected error occurred on the server.',
            insight: '5xx ERRORS: Server-side errors. The client request was valid, but the server failed to process it.',
        });
    } else if (failure === 'redirect-loop') {
        timings.ttfb = 50;
        for (let i = 0; i < 4; i++) {
            steps.push({
                phase: 'response', statusCode: 301, redirectCount: i + 1, timings: { ...timings },
                explanation: `🔁 Redirect #${i + 1}: 301 Moved Permanently → ${parsedUrl.domain}${parsedUrl.path}. ${i >= 2 ? 'REDIRECT LOOP DETECTED!' : 'Following redirect...'}`,
                insight: i >= 2 ? 'REDIRECT LOOP: The browser detects circular redirects and stops after a few iterations, showing ERR_TOO_MANY_REDIRECTS.' : '301 REDIRECT: The resource has permanently moved. Browser automatically follows the new Location header.',
            });
        }
    } else if (failure === 'slow-ttfb') {
        timings.ttfb = 3000;
        steps.push({
            phase: 'response', statusCode: 200, slowTtfb: true, timings: { ...timings },
            explanation: '🐢 Extremely slow TTFB (3000ms)! Server took too long to start sending the response.',
            insight: 'TTFB (Time to First Byte): Measures how long the browser waits for the first byte of the response. Ideally < 200ms.',
        });
    } else {
        timings.ttfb = 120;
        steps.push({
            phase: 'response', statusCode: 200, timings: { ...timings },
            explanation: '✅ 200 OK! Server responds with the requested HTML document.',
            insight: '200 OK: The request was successful. The response body contains the requested resource.',
        });
    }

    // Download + render
    timings.download = 80;
    steps.push({
        phase: 'render', timings: { ...timings },
        totalTime: timings.dns + timings.tcp + timings.tls + timings.ttfb + timings.download,
        explanation: 'Page rendering begins. Browser parses HTML, fetches CSS/JS/images, builds the DOM tree, and paints to screen.',
        insight: 'CRITICAL RENDERING PATH: HTML parsing → CSS parsing → Render tree → Layout → Paint. Each sub-resource (CSS, JS, images) may require additional cycles.',
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
   SUBCOMPONENT: Browser Mockup Window
   ════════════════════════════════════════ */
function BrowserMockup({ curStep, url, activeFailure, timingTotal }) {
    const isError = curStep && ['done-error', 'tls-error'].includes(curStep.phase);
    const parsed = parseUrl(url);

    return (
        <div style={{
            width: '180px',
            height: '120px',
            background: 'var(--white)',
            border: '3px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Header window chrome */}
            <div style={{
                background: '#e0e0e0',
                borderBottom: '2px solid var(--border)',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 6px',
                gap: '4px',
                flexShrink: 0
            }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff5f56' }} />
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#27c93f' }} />
                <div style={{
                    flex: 1,
                    background: 'var(--white)',
                    border: '1.5px solid var(--border)',
                    height: '14px',
                    borderRadius: '2px',
                    fontSize: '0.52rem',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 4px',
                    fontFamily: 'var(--font-mono)',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                }}>
                    🔒 {parsed.domain}
                </div>
            </div>
            {/* Window body viewport */}
            <div style={{
                flex: 1,
                padding: '6px',
                fontSize: '0.6rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                background: isError ? '#ffebee' : '#f9f9f9',
                color: isError ? '#c62828' : 'var(--text)',
                overflow: 'hidden',
                lineHeight: 1.2
            }}>
                <AnimatePresence mode="wait">
                    {!curStep || curStep.phase === 'parse' ? (
                        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ fontSize: '1.1rem' }}>🌐</div>
                            <div style={{ fontWeight: 800 }}>Enter URL & Run</div>
                        </motion.div>
                    ) : isError ? (
                        <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                            <div style={{ fontSize: '1.1rem' }}>⚠️</div>
                            <div style={{ fontWeight: 800, fontSize: '0.55rem' }}>Connection Insecure</div>
                            <div style={{ fontSize: '0.48rem', opacity: 0.7 }}>NET::ERR_CERT_INVALID</div>
                        </motion.div>
                    ) : curStep.phase === 'done' ? (
                        <motion.div key="done" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ background: 'var(--yellow)', borderBottom: '1px solid var(--border)', padding: '2px', fontWeight: 800, fontSize: '0.52rem' }}>
                                🏠 Welcome Page
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '2px', padding: '2px' }}>
                                <span style={{ fontWeight: 800, color: '#2e7d32' }}>✓ Loaded OK!</span>
                                <span style={{ fontSize: '0.48rem', opacity: 0.6 }}>Time: {timingTotal}ms</span>
                            </div>
                        </motion.div>
                    ) : curStep.phase === 'render' ? (
                        <motion.div key="render" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ height: '8px', background: '#ccc', width: '80%' }} />
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <div style={{ height: '24px', background: 'var(--cyan)', flex: 1, border: '1px solid var(--border)' }} />
                                <div style={{ height: '24px', background: 'var(--orange)', flex: 2, border: '1px solid var(--border)' }} />
                            </div>
                            <div style={{ fontSize: '0.5rem', fontWeight: 800 }}>Painting Page...</div>
                        </motion.div>
                    ) : (
                        <motion.div key="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ fontSize: '1.1rem', animation: 'spin 2s linear infinite' }}>⌛</div>
                            <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.5rem', marginTop: '3px' }}>
                                {curStep.phase === 'dns' ? 'DNS Lookup' :
                                 curStep.phase === 'tcp' ? 'TCP handshake' :
                                 curStep.phase === 'tls' ? 'TLS Cipher Spec' :
                                 curStep.phase === 'request' ? 'Sending Request' :
                                 curStep.phase === 'response' ? 'Waiting Response' : curStep.phase}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
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
    const [activeTab, setActiveTab] = useState('map'); // 'map' | 'console' | 'waterfall'
    const [timeoutElapsed, setTimeoutElapsed] = useState(0);

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

    // DNS Timeout local ticking effect
    useEffect(() => {
        if (curStep?.phase === 'dns' && curStep.failed) {
            setTimeoutElapsed(0);
            const interval = setInterval(() => {
                setTimeoutElapsed(prev => {
                    if (prev >= 5.0) {
                        clearInterval(interval);
                        return 5.0;
                    }
                    return +(prev + 0.5).toFixed(1);
                });
            }, 100);
            return () => clearInterval(interval);
        } else {
            setTimeoutElapsed(0);
        }
    }, [currentStep, curStep]);

    const parsedUrl = parseUrl(url);

    // Compute coordinates for animated packet flows
    const nodeCoords = {
        client: { x: '16%', y: '16%' },
        cache: { x: '50%', y: '16%' },
        resolver: { x: '50%', y: '45%' },
        root: { x: '84%', y: '16%' },
        tld: { x: '84%', y: '45%' },
        auth: { x: '84%', y: '75%' },
        server: { x: '16%', y: '75%' },
        serverB: { x: '35%', y: '75%' }
    };

    let packetSrc = null;
    let packetDst = null;
    let packetLabel = '';
    let packetColor = 'var(--purple)';

    if (curStep) {
        if (curStep.phase === 'dns') {
            if (curStep.dnsHit) {
                const sourceNode = curStep.dnsNode === 0 ? nodeCoords.client : curStep.dnsNode === 1 ? nodeCoords.cache : nodeCoords.resolver;
                packetSrc = sourceNode;
                packetDst = nodeCoords.client;
                packetLabel = `Cache Hit: ${curStep.cacheHitNode}`;
                packetColor = 'var(--green)';
            } else if (curStep.dnsNode === 0) {
                packetSrc = nodeCoords.client;
                packetDst = nodeCoords.cache;
                packetLabel = 'Check Browser Cache';
                packetColor = 'var(--purple)';
            } else if (curStep.dnsNode === 1) {
                packetSrc = nodeCoords.cache;
                packetDst = nodeCoords.cache;
                packetLabel = 'Check OS Cache';
                packetColor = 'var(--purple)';
            } else if (curStep.dnsNode === 2) {
                packetSrc = nodeCoords.cache;
                packetDst = nodeCoords.resolver;
                packetLabel = 'Query Recursive Resolver';
                packetColor = '#64b5f6';
            } else if (curStep.dnsNode === 3) {
                packetSrc = nodeCoords.resolver;
                packetDst = nodeCoords.root;
                packetLabel = 'Query Root NS';
                packetColor = 'var(--orange)';
            } else if (curStep.dnsNode === 4) {
                packetSrc = nodeCoords.resolver;
                packetDst = nodeCoords.tld;
                packetLabel = 'Query TLD NS';
                packetColor = 'var(--orange)';
            } else if (curStep.dnsNode === 5) {
                packetSrc = nodeCoords.resolver;
                packetDst = nodeCoords.auth;
                packetLabel = 'Query Authoritative NS';
                packetColor = 'var(--orange)';
            }
        } else if (curStep.phase === 'tcp') {
            packetSrc = nodeCoords.client;
            packetDst = nodeCoords.server;
            packetLabel = 'TCP SYN';
            packetColor = 'var(--cyan)';
        } else if (curStep.phase === 'tls') {
            if (curStep.failed) {
                packetSrc = nodeCoords.server;
                packetDst = nodeCoords.client;
                packetLabel = '⚠️ Cert Date Invalid';
                packetColor = 'var(--pink)';
            } else if (curStep.tlsPanel === 0) {
                packetSrc = nodeCoords.client;
                packetDst = nodeCoords.server;
                packetLabel = 'Client Hello';
                packetColor = 'var(--purple)';
            } else if (curStep.tlsPanel === 1) {
                packetSrc = nodeCoords.server;
                packetDst = nodeCoords.client;
                packetLabel = 'Server Hello + Cert';
                packetColor = '#90caf9';
            } else if (curStep.tlsPanel === 2) {
                packetSrc = nodeCoords.client;
                packetDst = nodeCoords.server;
                packetLabel = '🔑 DH Key Exchange';
                packetColor = 'var(--yellow)';
            } else if (curStep.tlsPanel === 3) {
                packetSrc = nodeCoords.client;
                packetDst = nodeCoords.server;
                packetLabel = 'Change Cipher Spec';
                packetColor = '#a5d6a7';
            } else if (curStep.tlsPanel === 4) {
                packetSrc = nodeCoords.server;
                packetDst = nodeCoords.client;
                packetLabel = '🔒 Handshake Finished';
                packetColor = 'var(--green)';
            }
        } else if (curStep.phase === 'request') {
            packetSrc = nodeCoords.client;
            packetDst = nodeCoords.server;
            packetLabel = `HTTP GET ${curStep.path}`;
            packetColor = 'var(--cyan)';
        } else if (curStep.phase === 'response') {
            if (curStep.redirectCount) {
                if (curStep.redirectCount === 1) {
                    packetSrc = nodeCoords.server;
                    packetDst = nodeCoords.client;
                    packetLabel = '301 Moved Permanently';
                    packetColor = 'var(--orange)';
                } else if (curStep.redirectCount === 2) {
                    packetSrc = nodeCoords.client;
                    packetDst = nodeCoords.serverB;
                    packetLabel = 'GET Redirect Page';
                    packetColor = 'var(--cyan)';
                } else if (curStep.redirectCount === 3) {
                    packetSrc = nodeCoords.serverB;
                    packetDst = nodeCoords.client;
                    packetLabel = '301 Loop Redirect';
                    packetColor = 'var(--orange)';
                } else if (curStep.redirectCount === 4) {
                    packetSrc = nodeCoords.client;
                    packetDst = nodeCoords.server;
                    packetLabel = 'GET Bouncing Loop';
                    packetColor = 'var(--pink)';
                }
            } else if (curStep.statusCode === 500) {
                packetSrc = nodeCoords.server;
                packetDst = nodeCoords.client;
                packetLabel = '💥 Server Error 500';
                packetColor = 'var(--pink)';
            } else {
                packetSrc = nodeCoords.server;
                packetDst = nodeCoords.client;
                packetLabel = `HTTP Response: ${curStep.statusCode} OK`;
                packetColor = 'var(--green)';
            }
        }
    }

    const logs = [];
    if (isSimMode && steps.length > 0) {
        logs.push(`[SYSTEM] Initializing client request for URL: ${url}`);
        for (let i = 0; i <= currentStep; i++) {
            const step = steps[i];
            if (!step) continue;
            if (step.phase === 'parse') {
                logs.push(`[URL PARSE] protocol: ${parsedUrl.protocol}, domain: ${parsedUrl.domain}, path: ${parsedUrl.path}`);
            } else if (step.phase === 'dns') {
                const node = DNS_CHAIN[step.dnsNode];
                if (step.failed) {
                    logs.push(`[DNS] RESOLUTION TIMED OUT at ${node?.label || 'resolver'}. Query stuck.`);
                } else if (step.dnsHit) {
                    logs.push(`[DNS] Cache HIT at ${step.cacheHitNode}. Resolved IP: 93.184.216.34`);
                } else {
                    logs.push(`[DNS] MISS at ${node?.label}. forwarding to next node.`);
                    if (step.dnsNode === 5) logs.push(`[DNS] Authoritative Answer: ${parsedUrl.domain} -> 93.184.216.34`);
                }
            } else if (step.phase === 'tcp') {
                logs.push(`[TCP] handshake: SYN -> SYN-ACK -> ACK. established connection.`);
            } else if (step.phase === 'tls') {
                const p = TLS_PANELS[step.tlsPanel];
                if (step.failed) {
                    logs.push(`[TLS] ❌ SECURITY HANDSHAKE FAILED. Expired server certificate presented.`);
                } else {
                    logs.push(`[TLS] ${p?.title}: ${p?.desc}`);
                }
            } else if (step.phase === 'request') {
                logs.push(`[HTTP REQUEST] GET ${step.path} HTTP/1.1 (encrypted session)`);
            } else if (step.phase === 'response') {
                if (step.statusCode === 500) {
                    logs.push(`[HTTP RESPONSE] 💥 500 Internal Server Error returned from server.`);
                } else if (step.statusCode === 301) {
                    logs.push(`[HTTP RESPONSE] 🔁 301 Redirect to Location: /redirect-${step.redirectCount}`);
                } else {
                    logs.push(`[HTTP RESPONSE] ✅ 200 OK. Content-Type: text/html, length: 45230 bytes.`);
                }
            } else if (step.phase === 'render') {
                logs.push(`[RENDER] Building DOM tree, parsing styles, painting webpage.`);
            } else if (step.phase === 'done') {
                logs.push(`[SYSTEM] Finished! Total load time: ${step.totalTime}ms.`);
            }
        }
    }

    const timingTotal = curStep?.totalTime ?? Object.values(curStep?.timings ?? {}).reduce((a, b) => a + b, 0);

    /* ════════════════════════════════════════
       CENTER CONTENT
       ════════════════════════════════════════ */
    const CENTER = (
        <div style={{ padding: '0.75rem', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* View selectors */}
            <div style={{ display: 'flex', gap: '3px', background: 'var(--border)', padding: '3px', border: '3px solid var(--border)', marginBottom: '0.5rem', flexShrink: 0 }}>
                {[
                    { id: 'map', label: '🌐 Interactive Journey Map' },
                    { id: 'console', label: '💻 HTTP Header Console' },
                    { id: 'waterfall', label: '📊 DevTools Waterfall' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            flex: 1,
                            padding: '0.4rem 0.6rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            border: 'none',
                            background: activeTab === tab.id ? 'var(--yellow)' : 'var(--white)',
                            cursor: 'pointer',
                            transition: 'background 0.1s'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div style={{ flex: 1, background: 'var(--white)', border: '3px solid var(--border)', overflow: 'hidden', position: 'relative' }}>
                {activeTab === 'map' && (
                    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '480px', overflow: 'hidden' }}>
                        {/* Map Grid Lines SVG */}
                        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                            {/* Client to Cache */}
                            <line x1="16%" y1="16%" x2="50%" y2="16%" stroke="var(--border)" strokeWidth="2.5" strokeDasharray="5 5" />
                            {/* Cache to Resolver */}
                            <line x1="50%" y1="16%" x2="50%" y2="45%" stroke="var(--border)" strokeWidth="2.5" strokeDasharray="5 5" />
                            {/* Resolver to Root */}
                            <line x1="50%" y1="45%" x2="84%" y2="16%" stroke="var(--border)" strokeWidth="2.5" strokeDasharray="5 5" />
                            {/* Resolver to TLD */}
                            <line x1="50%" y1="45%" x2="84%" y2="45%" stroke="var(--border)" strokeWidth="2.5" strokeDasharray="5 5" />
                            {/* Resolver to Auth */}
                            <line x1="50%" y1="45%" x2="84%" y2="75%" stroke="var(--border)" strokeWidth="2.5" strokeDasharray="5 5" />
                            {/* Client to Web Server */}
                            {curStep && ['tcp', 'tls', 'request', 'response', 'render', 'done', 'done-error', 'tls-error'].includes(curStep.phase) ? (
                                <motion.line
                                    x1="16%" y1="16%" x2="16%" y2="75%"
                                    stroke={isHttps && curStep.phase !== 'tls-error' ? '#27c93f' : '#ff3b30'}
                                    strokeWidth={isHttps && ['request','response','render','done'].includes(curStep.phase) ? "5" : "3"}
                                    animate={isHttps && ['request','response','render','done'].includes(curStep.phase) ? { strokeDashoffset: [0, -20] } : {}}
                                    transition={{ ease: "linear", duration: 1, repeat: Infinity }}
                                    strokeDasharray={isHttps && ['request','response','render','done'].includes(curStep.phase) ? "8 4" : "5 5"}
                                />
                            ) : (
                                <line x1="16%" y1="16%" x2="16%" y2="75%" stroke="var(--border)" strokeWidth="2" strokeDasharray="8 8" opacity="0.25" />
                            )}
                            {/* Client to Server B (Redirect) */}
                            {activeFailure === 'redirect-loop' && (
                                <line x1="16%" y1="16%" x2="35%" y2="75%" stroke="var(--border)" strokeWidth="2" strokeDasharray="5 5" opacity="0.6" />
                            )}
                        </svg>

                        {/* client computer */}
                        <div style={{ position: 'absolute', left: '16%', top: '16%', transform: 'translate(-50%, -50%)', zIndex: 5 }}>
                            <BrowserMockup curStep={curStep} url={url} activeFailure={activeFailure} timingTotal={timingTotal} />
                        </div>

                        {/* DNS Cache */}
                        <div style={{ position: 'absolute', left: '50%', top: '16%', transform: 'translate(-50%, -50%)', zIndex: 5 }}>
                            <motion.div
                                animate={curStep?.phase === 'dns' && curStep.dnsNode === 1 ? { scale: 1.05 } : {}}
                                style={{
                                    border: '3px solid var(--border)',
                                    background: curStep?.phase === 'dns' && curStep.dnsNode === 1 ? 'var(--yellow)' : '#ce93d8',
                                    padding: '6px 12px',
                                    fontWeight: 800,
                                    fontSize: '0.65rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    boxShadow: 'var(--shadow-sm)',
                                    minWidth: '100px',
                                    textAlign: 'center'
                                }}
                            >
                                <span style={{ fontSize: '1rem' }}>💾</span>
                                <span>OS/Browser Cache</span>
                                {curStep?.phase === 'dns' && curStep.dnsHit && curStep.dnsNode <= 1 && (
                                    <span style={{ color: '#1b5e20', fontWeight: 900, fontSize: '0.52rem', background: '#c8e6c9', border: '1px solid #1b5e20', padding: '1px 3px', marginTop: '2px' }}>✓ HIT</span>
                                )}
                            </motion.div>
                        </div>

                        {/* Recursive Resolver (Router) */}
                        <div style={{ position: 'absolute', left: '50%', top: '45%', transform: 'translate(-50%, -50%)', zIndex: 5 }}>
                            <motion.div
                                animate={curStep?.phase === 'dns' && curStep.dnsNode >= 2 ? { rotate: [0, 5, -5, 0] } : {}}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                style={{
                                    border: '3px solid var(--border)',
                                    background: curStep?.phase === 'dns' && curStep.dnsNode === 2 ? 'var(--yellow)' : '#90caf9',
                                    padding: '6px 12px',
                                    fontWeight: 800,
                                    fontSize: '0.65rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    boxShadow: 'var(--shadow-sm)',
                                    minWidth: '120px',
                                    textAlign: 'center'
                                }}
                            >
                                <motion.span
                                    animate={curStep?.phase === 'dns' && curStep.dnsNode >= 2 ? { rotate: 360 } : {}}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                    style={{ fontSize: '1.1rem' }}
                                >
                                    🔄
                                </motion.span>
                                <span>Recursive Resolver</span>
                                {curStep?.phase === 'dns' && curStep.failed && curStep.dnsNode === 2 && (
                                    <div style={{ background: 'var(--pink)', border: '1.5px solid var(--border)', padding: '2px', marginTop: '4px', fontSize: '0.5rem', fontWeight: 900, color: 'black' }}>
                                        ⏱️ TIMEOUT ({timeoutElapsed}s / 5s)
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        {/* DNS Servers Chain */}
                        {[
                            { idx: 3, node: 'root', label: 'Root Nameserver', icon: '🌍', color: '#a5d6a7' },
                            { idx: 4, node: 'tld', label: 'TLD NS (.com)', icon: '📋', color: '#ffcc80' },
                            { idx: 5, node: 'auth', label: 'Authoritative NS', icon: '✅', color: '#4dd0e1' }
                        ].map(ns => {
                            const isActive = curStep?.phase === 'dns' && curStep.dnsNode === ns.idx;
                            const isReached = curStep?.phase === 'dns' ? curStep.dnsNode >= ns.idx : curStep && curStep.phase !== 'parse';
                            return (
                                <div key={ns.node} style={{ position: 'absolute', left: nodeCoords[ns.node].x, top: nodeCoords[ns.node].y, transform: 'translate(-50%, -50%)', zIndex: 5 }}>
                                    <motion.div
                                        animate={isActive ? { scale: 1.08, borderColor: 'var(--yellow)' } : {}}
                                        style={{
                                            border: '3px solid var(--border)',
                                            background: isActive ? 'var(--yellow)' : ns.color,
                                            padding: '6px 12px',
                                            fontWeight: 800,
                                            fontSize: '0.62rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            boxShadow: 'var(--shadow-sm)',
                                            minWidth: '110px',
                                            textAlign: 'center',
                                            opacity: isReached ? 1 : 0.45,
                                            transition: 'opacity 0.3s'
                                        }}
                                    >
                                        <span style={{ fontSize: '1rem' }}>{ns.icon}</span>
                                        <span>{ns.label}</span>
                                    </motion.div>
                                </div>
                            );
                        })}

                        {/* Main Target Web Server */}
                        <div style={{ position: 'absolute', left: '16%', top: '75%', transform: 'translate(-50%, -50%)', zIndex: 5 }}>
                            <motion.div
                                animate={curStep?.phase === 'response' && activeFailure === 'server-500' ? { x: [-4, 4, -4, 4, 0] } : {}}
                                transition={{ repeat: Infinity, duration: 0.15 }}
                                style={{
                                    border: '3px solid var(--border)',
                                    background: curStep && ['tcp','tls','request','response','render','done'].includes(curStep.phase) ? '#a8e6cf' : '#e0e0e0',
                                    padding: '8px 12px',
                                    fontWeight: 800,
                                    fontSize: '0.65rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    boxShadow: 'var(--shadow)',
                                    minWidth: '130px',
                                    textAlign: 'center',
                                    position: 'relative'
                                }}
                            >
                                {/* Blinking LEDs */}
                                <div style={{ display: 'flex', gap: '4px', position: 'absolute', top: '5px', right: '5px' }}>
                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: activeFailure === 'server-500' ? '#ff3b30' : '#4cd964', animation: 'blink 0.5s infinite alternate' }} />
                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ffcc00', animation: 'blink 0.8s infinite alternate' }} />
                                </div>
                                <span style={{ fontSize: '1.2rem' }}>
                                    {activeFailure === 'server-500' && curStep?.phase === 'response' ? '💥' : '🖥️'}
                                </span>
                                <span style={{ fontFamily: 'var(--font-mono)' }}>93.184.216.34</span>
                                <span style={{ fontSize: '0.52rem', opacity: 0.7 }}>Web Server (Port {isHttps ? '443' : '80'})</span>
                                
                                {isHttps && curStep && ['request','response','render','done'].includes(curStep.phase) && curStep.phase !== 'tls-error' && (
                                    <span style={{ color: '#1b5e20', fontWeight: 900, fontSize: '0.5rem', background: '#c8e6c9', border: '1px solid #1b5e20', padding: '1px 4px', marginTop: '3px' }}>
                                        🔒 SECURED (TLS 1.3)
                                    </span>
                                )}
                            </motion.div>
                        </div>

                        {/* Redirect Target Server B */}
                        {activeFailure === 'redirect-loop' && (
                            <div style={{ position: 'absolute', left: '35%', top: '75%', transform: 'translate(-50%, -50%)', zIndex: 5 }}>
                                <motion.div
                                    style={{
                                        border: '3px solid var(--border)',
                                        background: '#ffb347',
                                        padding: '6px 10px',
                                        fontWeight: 800,
                                        fontSize: '0.62rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        boxShadow: 'var(--shadow-sm)',
                                        minWidth: '100px',
                                        textAlign: 'center'
                                    }}
                                >
                                    <span style={{ fontSize: '1rem' }}>🔁</span>
                                    <span style={{ fontFamily: 'var(--font-mono)' }}>Redirect Server</span>
                                    <span style={{ fontSize: '0.5rem', opacity: 0.7 }}>Alt Port 8080</span>
                                </motion.div>
                            </div>
                        )}

                        {/* TLS SECURE PIPE GLOW SHIELD */}
                        {isHttps && curStep && ['request','response','render','done'].includes(curStep.phase) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{
                                    position: 'absolute',
                                    left: '16%',
                                    top: '45%',
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: 6,
                                    background: '#c8e6c9',
                                    border: '2.5px solid #2e7d32',
                                    padding: '2px 5px',
                                    fontSize: '0.52rem',
                                    fontWeight: 900,
                                    color: '#2e7d32',
                                    boxShadow: 'var(--shadow-sm)'
                                }}
                            >
                                🔒 Encrypted Session
                            </motion.div>
                        )}

                        {/* Slow TTFB Turtle Animation */}
                        {curStep?.phase === 'response' && curStep.slowTtfb && (
                            <motion.div
                                animate={{ y: [-15, 15, -15] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                style={{
                                    position: 'absolute',
                                    left: '16%',
                                    top: '48%',
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: 10,
                                    fontSize: '2rem',
                                    pointerEvents: 'none'
                                }}
                            >
                                🐢
                            </motion.div>
                        )}

                        {/* Animated packet */}
                        {packetSrc && packetDst && (
                            <motion.div
                                key={currentStep}
                                initial={{ left: packetSrc.x, top: packetSrc.y, scale: 0.8, opacity: 0 }}
                                animate={{
                                    left: [packetSrc.x, packetDst.x],
                                    top: [packetSrc.y, packetDst.y],
                                    scale: [0.85, 1.1, 1],
                                    opacity: [0, 1, 1, 0.95]
                                }}
                                transition={{ duration: activeFailure === 'slow-ttfb' && curStep.phase === 'response' ? 2.5 : 0.85, ease: "easeInOut" }}
                                style={{
                                    position: 'absolute',
                                    transform: 'translate(-50%, -50%)',
                                    background: packetColor,
                                    border: '2.5px solid var(--border)',
                                    padding: '2px 6px',
                                    fontSize: '0.55rem',
                                    fontWeight: 'bold',
                                    zIndex: 15,
                                    boxShadow: 'var(--shadow-sm)',
                                    pointerEvents: 'none',
                                    whiteSpace: 'nowrap',
                                    fontFamily: 'var(--font-mono)'
                                }}
                            >
                                📦 {packetLabel}
                            </motion.div>
                        )}
                    </div>
                )}

                {activeTab === 'console' && (
                    <div style={{
                        background: '#141414',
                        color: '#66d9ef',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.78rem',
                        padding: '1rem',
                        height: '100%',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem'
                    }}>
                        {logs.length > 0 ? (
                            logs.map((log, idx) => {
                                let c = '#fff';
                                if (log.includes('❌') || log.includes('💥')) c = 'var(--pink)';
                                else if (log.includes('✅') || log.includes('✓') || log.includes('established')) c = 'var(--green)';
                                else if (log.includes('[SYSTEM]')) c = 'var(--yellow)';
                                else if (log.includes('[HTTP REQUEST]')) c = '#a5d6a7';
                                else if (log.includes('[TLS]')) c = '#b39ddb';
                                
                                return (
                                    <div key={idx} style={{ color: c, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.15rem' }}>
                                        <span style={{ opacity: 0.35, marginRight: '0.5rem' }}>&gt;</span>
                                        {log}
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ opacity: 0.35, fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
                                Awaiting simulation start to populate developer console logs...
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'waterfall' && (
                    <div style={{ padding: '0.75rem', height: '100%', overflowY: 'auto', background: '#1c1c1c', color: 'white', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                        <div style={{ borderBottom: '2px solid #333', paddingBottom: '6px', marginBottom: '8px', display: 'flex', fontWeight: 'bold', color: '#888' }}>
                            <div style={{ width: '120px' }}>Name</div>
                            <div style={{ width: '60px' }}>Status</div>
                            <div style={{ width: '70px' }}>Protocol</div>
                            <div style={{ width: '80px' }}>Type</div>
                            <div style={{ width: '60px' }}>Size</div>
                            <div style={{ flex: 1 }}>Waterfall (Total {timingTotal}ms)</div>
                        </div>

                        {curStep && curStep.timings ? (
                            [
                                { name: parsedUrl.domain, status: curStep.statusCode || (curStep.phase === 'done-error' ? 'Failed' : 'Pending'), size: '45.2 kB', type: 'document' },
                                ...(timingTotal > 150 ? [
                                    { name: 'main.css', status: '200', size: '8.4 kB', type: 'stylesheet' },
                                    { name: 'bundle.js', status: '200', size: '124 kB', type: 'script' },
                                    { name: 'logo.png', status: '200', size: '12.1 kB', type: 'image' }
                                ] : [])
                            ].map((row, rIdx) => {
                                const baseTimings = [
                                    { label: 'DNS', time: curStep.timings.dns, color: '#b39ddb' },
                                    { label: 'TCP', time: curStep.timings.tcp, color: '#90caf9' },
                                    ...(isHttps ? [{ label: 'TLS', time: curStep.timings.tls, color: '#4dd0e1' }] : []),
                                    { label: 'TTFB', time: curStep.timings.ttfb, color: '#ffcc80' },
                                    { label: 'Download', time: curStep.timings.download, color: '#a5d6a7' }
                                ];

                                const maxTime = Math.max(1, Object.values(curStep.timings).reduce((a, b) => a + b, 0));
                                let accumulatedPercent = 0;

                                return (
                                    <div key={row.name} style={{ display: 'flex', borderBottom: '1px solid #2a2a2a', padding: '6px 0', alignItems: 'center' }}>
                                        <div style={{ width: '120px', color: '#66d9ef', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</div>
                                        <div style={{ width: '60px', color: row.status === '200' ? '#27c93f' : '#ff3b30' }}>{row.status}</div>
                                        <div style={{ width: '70px', color: '#aaa' }}>{httpVersion === '2' ? 'h2' : 'http/1.1'}</div>
                                        <div style={{ width: '80px', color: '#888' }}>{row.type}</div>
                                        <div style={{ width: '60px', color: '#ccc' }}>{row.size}</div>
                                        <div style={{ flex: 1, display: 'flex', height: '14px', background: '#2d2d2d', position: 'relative' }}>
                                            {baseTimings.map((bar, bIdx) => {
                                                const width = (bar.time / maxTime) * 100;
                                                const offset = accumulatedPercent;
                                                accumulatedPercent += width;
                                                
                                                // For assets secondary to main doc, offset them to start after TTFB of doc
                                                const renderWidth = rIdx === 0 ? width : (bIdx === 4 ? width : 0);
                                                const renderOffset = rIdx === 0 ? offset : (bIdx === 4 ? 65 : 0);
                                                if (renderWidth <= 0) return null;

                                                return (
                                                    <motion.div
                                                        key={bar.label}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${renderWidth}%` }}
                                                        transition={{ duration: 0.5 }}
                                                        style={{
                                                            position: 'absolute',
                                                            left: `${renderOffset}%`,
                                                            height: '100%',
                                                            background: bar.color,
                                                            borderRight: '1px solid rgba(0,0,0,0.1)'
                                                        }}
                                                        title={`${bar.label}: ${bar.time}ms`}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ opacity: 0.35, fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
                                Awaiting simulation steps to draw the timeline waterfall...
                            </div>
                        )}
                        
                        {curStep && curStep.timings && (
                            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '2px solid #333', paddingTop: '8px' }}>
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}><div style={{ width: 8, height: 8, background: '#b39ddb' }} /> DNS: {curStep.timings.dns}ms</div>
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}><div style={{ width: 8, height: 8, background: '#90caf9' }} /> TCP: {curStep.timings.tcp}ms</div>
                                {isHttps && <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}><div style={{ width: 8, height: 8, background: '#4dd0e1' }} /> TLS: {curStep.timings.tls}ms</div>}
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}><div style={{ width: 8, height: 8, background: '#ffcc80' }} /> TTFB: {curStep.timings.ttfb}ms</div>
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}><div style={{ width: 8, height: 8, background: '#a5d6a7' }} /> Download: {curStep.timings.download}ms</div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Timings view selection (bottom of map) */}
            {curStep && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--yellow)', border: '3px solid var(--border)', padding: '4px 10px', marginTop: '0.4rem', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase' }}>Waterfall Config</span>
                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 700 }}>Protocol Version:</span>
                        {['1.1', '2'].map(v => (
                            <button key={v} onClick={() => setHttpVersion(v)} style={{
                                fontSize: '0.58rem', fontWeight: 700, padding: '1px 5px',
                                border: '1.5px solid var(--border)',
                                background: httpVersion === v ? 'var(--cyan)' : 'var(--white)',
                                cursor: 'pointer',
                            }}>HTTP/{v}</button>
                        ))}
                    </div>
                </div>
            )}
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
                { label: 'Total Load', val: `${timingTotal}ms`, color: 'var(--green)' },
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
                        <div className="panel-header" style={{ background: 'var(--pink)' }}>🏷 Failure Injection</div>
                        <div style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                                {FAILURES.map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => setActiveFailure(activeFailure === f.id ? null : f.id)}
                                        style={{
                                            padding: '0.25rem 0.5rem',
                                            fontSize: '0.72rem',
                                            fontWeight: 700,
                                            fontFamily: 'var(--font-mono)',
                                            border: '2px solid var(--border)',
                                            background: activeFailure === f.id ? 'var(--pink)' : 'var(--white)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {f.icon} {f.label}
                                    </button>
                                ))}
                            </div>
                            <p style={{ fontSize: '0.82rem', opacity: 0.7 }}>
                                {activeFailure ? FAILURES.find(f => f.id === activeFailure)?.desc : 'Select a failure scenario above to inject network bottlenecks.'}
                            </p>
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
