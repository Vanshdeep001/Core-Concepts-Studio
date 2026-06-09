import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import { SignalIcon } from '../../components/Icons';

export default function ApiLifecycleSim() {
    const [scenario, setScenario] = useState('cache-hit'); // cache-hit, cache-miss, rate-limit
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const h = () => setIsMobile(window.innerWidth < 768);
        h(); window.addEventListener('resize', h);
        return () => window.removeEventListener('resize', h);
    }, []);
    const [step, setStep] = useState(-1); // -1: not started, 0-6: steps in path
    const [latency, setLatency] = useState(0);
    const [history, setHistory] = useState(['Select a scenario and click START to trace the API lifecycle.']);
    const [speed, setSpeed] = useState(700);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [narrationStep, setNarrationStep] = useState(-1);
    const [labTab, setLabTab] = useState('decoder'); // 'decoder' | 'overview' | 'guide'

    // Default layout configuration
    const defaultNodes = [
        { id: 'dns', label: 'DNS Resolver', color: '#b5e2fa', desc: 'Translates domain to IP (192.168.1.10).', x: '25%', y: '20%' },
        { id: 'lb', label: 'Load Balancer', color: 'var(--yellow)', desc: 'Routes traffic to Gateway.', x: '35%', y: '50%' },
        { id: 'gateway', label: 'API Gateway', color: 'var(--pink)', desc: 'Validates Auth, Rate Limits, and routes.', x: '55%', y: '50%' },
        { id: 'service', label: 'Backend Service', color: 'var(--green)', desc: 'Executes controller and queries data.', x: '75%', y: '50%' },
        { id: 'redis', label: 'Redis Cache', color: 'var(--cyan)', desc: 'Checks memory cache for fast return.', x: '90%', y: '25%' },
        { id: 'db', label: 'Database', color: 'var(--yellow)', desc: 'Disk store fallback for database query.', x: '90%', y: '75%' }
    ];

    // Builder States
    const [mode, setMode] = useState('trace'); // 'trace' | 'build'
    const [placedComponents, setPlacedComponents] = useState(defaultNodes); // Array of { id, label, color, desc, x, y }
    const [draggingId, setDraggingId] = useState(null); // id of dragged component
    const [dragStartCoords, setDragStartCoords] = useState(null); // snapshot of coordinates when dragging starts
    const [validationErrors, setValidationErrors] = useState([]); // Array of { nodeId, title, msg }
    const [acknowledgedNodes, setAcknowledgedNodes] = useState([]); // Array of acknowledged node IDs
    const [requirements, setRequirements] = useState({
        globalAudience: false,
        ddosProtection: false,
        readHeavy: false,
        writeHeavy: false,
        strictSecurity: true
    });
    const [customLabel, setCustomLabel] = useState('');
    const [customColor, setCustomColor] = useState('var(--pink)');
    const [customDesc, setCustomDesc] = useState('');

    const canvasRef = useRef(null);
    const speedFactor = speed / 700;
    const animDuration = 0.6 * speedFactor;

    // Nodes configuration for standard coordinate lookups
    const nodes = [
        { id: 'client', label: 'Client', x: '10%', y: '50%', color: '#fafafa', desc: 'Browser initiates HTTPS request.' },
        { id: 'dns', label: 'DNS Resolver', x: '25%', y: '20%', color: '#b5e2fa', desc: 'Translates domain to IP (192.168.1.10).' },
        { id: 'lb', label: 'Load Balancer', x: '35%', y: '50%', color: 'var(--yellow)', desc: 'Routes traffic to Gateway.' },
        { id: 'gateway', label: 'API Gateway', x: '55%', y: '50%', color: 'var(--pink)', desc: 'Validates Auth, Rate Limits, and routes.' },
        { id: 'service', label: 'Backend Service', x: '75%', y: '50%', color: 'var(--green)', desc: 'Executes controller and queries data.' },
        { id: 'redis', label: 'Redis Cache', x: '90%', y: '25%', color: 'var(--cyan)', desc: 'Checks memory cache for fast return.' },
        { id: 'db', label: 'Database', x: '90%', y: '75%', color: 'var(--yellow)', desc: 'Disk store fallback for database query.' }
    ];

    // Available components in toolbox
    const availableComponents = [
        { id: 'cdn', label: 'CDN Edge Cache', color: '#b4befe', desc: 'Caches static resources and content near users globally.' },
        { id: 'firewall', label: 'Web Firewall (WAF)', color: '#f38ba8', desc: 'Filters out malicious HTTP requests and DDoS attacks.' },
        { id: 'dns', label: 'DNS Resolver', color: '#b5e2fa', desc: 'Translates domain names to IP addresses.' },
        { id: 'lb', label: 'Load Balancer', color: 'var(--yellow)', desc: 'Distributes incoming HTTP traffic across gateways/servers.' },
        { id: 'gateway', label: 'API Gateway', color: 'var(--pink)', desc: 'Validates Auth, Rate Limits, and routes.' },
        { id: 'service', label: 'Backend Service', color: 'var(--green)', desc: 'Executes business logic and controllers.' },
        { id: 'queue', label: 'Message Queue', color: '#f9e2af', desc: 'Queues tasks for asynchronous background execution.' },
        { id: 'redis', label: 'Redis Cache', color: 'var(--cyan)', desc: 'Checks memory cache for fast return.' },
        { id: 'db', label: 'Database', color: 'var(--yellow)', desc: 'Disk store fallback for database query.' }
    ];

    const animationTimer = useRef(null);

    // Latency cost map (ms)
    const latencies = {
        dns: 15,
        lb: 5,
        gateway: 10,
        service: 12,
        redis: 2,
        db: 120
    };

    // Scenarios steps list
    const getScenarioSteps = () => {
        if (mode === 'build') {
            const sorted = [...placedComponents].sort((a, b) => parseFloat(a.x) - parseFloat(b.x));
            const forward = [
                ...sorted.filter(c => parseFloat(c.x) < 10).map(c => c.id),
                'client',
                ...sorted.filter(c => parseFloat(c.x) >= 10).map(c => c.id)
            ];
            const reverse = [...forward].reverse().slice(1);
            return [...forward, ...reverse];
        }

        if (scenario === 'rate-limit') {
            return ['client', 'dns', 'client', 'lb', 'gateway', 'client'];
        }
        if (scenario === 'cache-hit') {
            return ['client', 'dns', 'client', 'lb', 'gateway', 'service', 'redis', 'service', 'client'];
        }
        // cache-miss
        return ['client', 'dns', 'client', 'lb', 'gateway', 'service', 'redis', 'db', 'service', 'client'];
    };

    const stepsList = getScenarioSteps();

    useEffect(() => {
        if (step === -1) {
            setNarrationStep(-1);
            return;
        }
        
        if (step === 0) {
            setNarrationStep(0);
            return;
        }

        const delay = animDuration * 1000;
        const timer = setTimeout(() => {
            setNarrationStep(step);
        }, delay);

        return () => clearTimeout(timer);
    }, [step, animDuration]);

    // Drag-and-drop logic
    const addComponent = (id) => {
        if (placedComponents.some(c => c.id === id)) return;
        const compDef = availableComponents.find(c => c.id === id);
        
        // Define default logical slots for clean system design layouts (horizontal progression)
        const defaultPositions = {
            dns: { x: '20%', y: '25%' },
            cdn: { x: '28%', y: '50%' },
            firewall: { x: '38%', y: '50%' },
            lb: { x: '48%', y: '50%' },
            gateway: { x: '60%', y: '50%' },
            service: { x: '72%', y: '50%' },
            redis: { x: '85%', y: '25%' },
            queue: { x: '82%', y: '75%' },
            db: { x: '92%', y: '60%' }
        };

        const pos = defaultPositions[id] || { x: '50%', y: '50%' };

        setPlacedComponents(prev => [...prev, {
            id,
            label: compDef.label,
            color: compDef.color,
            desc: compDef.desc,
            x: pos.x,
            y: pos.y
        }]);
        setValidationErrors([]);
        handleReset();
    };

    const removeComponent = (id) => {
        setPlacedComponents(prev => prev.filter(c => c.id !== id));
        setValidationErrors([]);
        handleReset();
    };

    const handleDragStart = (id, e) => {
        setDraggingId(id);
        const comp = placedComponents.find(c => c.id === id);
        if (comp) {
            setDragStartCoords({ id, x: comp.x, y: comp.y });
        }
    };

    const handleMouseMove = (e) => {
        if (!draggingId) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        
        const xPercent = Math.min(Math.max(5, ((e.clientX - rect.left) / rect.width) * 100), 95);
        const yPercent = Math.min(Math.max(5, ((e.clientY - rect.top) / rect.height) * 100), 95);
        
        setPlacedComponents(prev => prev.map(comp => 
            comp.id === draggingId ? { ...comp, x: `${xPercent.toFixed(1)}%`, y: `${yPercent.toFixed(1)}%` } : comp
        ));
    };

    const handleTouchMove = (e) => {
        if (!draggingId) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        
        const xPercent = Math.min(Math.max(5, ((touch.clientX - rect.left) / rect.width) * 100), 95);
        const yPercent = Math.min(Math.max(5, ((touch.clientY - rect.top) / rect.height) * 100), 95);
        
        setPlacedComponents(prev => prev.map(comp => 
            comp.id === draggingId ? { ...comp, x: `${xPercent.toFixed(1)}%`, y: `${yPercent.toFixed(1)}%` } : comp
        ));
    };

    const handleMouseUp = () => {
        setDraggingId(null);
        setDragStartCoords(null);
    };

    const checkNodeErrors = (nodeId, stepIndex) => {
        const errors = [];
        const sorted = [...placedComponents].sort((a, b) => parseFloat(a.x) - parseFloat(b.x));
        const fullSequence = [
            ...sorted.filter(c => parseFloat(c.x) < 10),
            { id: 'client', label: 'Client', x: '10%', y: '50%' },
            ...sorted.filter(c => parseFloat(c.x) >= 10)
        ];

        const getIdx = (id) => fullSequence.findIndex(c => c.id === id);
        const hasNode = (id) => placedComponents.some(c => c.id === id);

        const addError = (title, msg) => {
            errors.push({ nodeId, title, msg, stepIndex });
        };

        // DNS Resolver Checks
        if (nodeId === 'dns') {
            const dnsIdx = getIdx('dns');
            const cdnIdx = getIdx('cdn');
            const fwIdx = getIdx('firewall');
            const lbIdx = getIdx('lb');

            if (cdnIdx !== -1 && dnsIdx > cdnIdx) {
                addError('DNS Sequence Flaw', 'DNS Resolver is placed after the CDN. Domain IP lookup must occur before client requests CDN edge content.');
            }
            if (fwIdx !== -1 && dnsIdx > fwIdx) {
                addError('DNS Sequence Flaw', 'DNS Resolver is placed after the Firewall. The client must resolve domain name before filtering traffic.');
            }
            if (lbIdx !== -1 && dnsIdx > lbIdx) {
                addError('DNS Sequence Flaw', 'DNS Resolver is placed after the Load Balancer. Domain resolution must happen before balancer connection.');
            }
        }

        // CDN Checks
        if (nodeId === 'cdn') {
            const cdnIdx = getIdx('cdn');
            const lbIdx = getIdx('lb');
            const gwIdx = getIdx('gateway');

            if (lbIdx !== -1 && cdnIdx > lbIdx) {
                addError('Suboptimal CDN Placement', 'CDN is placed after the Load Balancer. Edge content caching should occur before the request is load-balanced.');
            }
            if (gwIdx !== -1 && cdnIdx > gwIdx) {
                addError('Suboptimal CDN Placement', 'CDN is placed after the API Gateway. Static resource fetches should bypass gateway authentication.');
            }
        }

        // Firewall Checks
        if (nodeId === 'firewall') {
            const fwIdx = getIdx('firewall');
            const lbIdx = getIdx('lb');
            const gwIdx = getIdx('gateway');
            const svcIdx = getIdx('service');

            if (lbIdx !== -1 && fwIdx > lbIdx) {
                addError('Firewall Bypass', 'Firewall is placed after the Load Balancer. Malicious traffic and DDoS spikes will hit the balancer unfiltered.');
            }
            if (gwIdx !== -1 && fwIdx > gwIdx) {
                addError('Firewall Bypass', 'Firewall is placed after the API Gateway. Security screening should block threats at the absolute outer perimeter.');
            }
            if (svcIdx !== -1 && fwIdx > svcIdx) {
                addError('Firewall Bypass', 'Firewall is placed after the Backend Service. Unfiltered traffic has direct access to backend processing.');
            }
        }

        // Load Balancer Checks
        if (nodeId === 'lb') {
            const lbIdx = getIdx('lb');
            const gwIdx = getIdx('gateway');

            if (gwIdx !== -1 && lbIdx > gwIdx) {
                addError('Improper Ingress Order', 'The Load Balancer is placed after the API Gateway. Traffic should be distributed before hitting gateway nodes.');
            }
            
            // Check missing WAF if DDoS protection is required
            if (requirements.ddosProtection && !hasNode('firewall')) {
                addError('WAF Protection Missing', 'DDoS Protection is enabled but no Web Firewall (WAF) is placed before the Load Balancer.');
            }
            // Check missing CDN if Global Audience is active
            if (requirements.globalAudience && !hasNode('cdn')) {
                addError('Global Latency Risk', 'Global Ingress is enabled but no CDN Edge Cache is placed to cache static resources near users.');
            }
        }

        // API Gateway Checks
        if (nodeId === 'gateway') {
            const gwIdx = getIdx('gateway');
            const svcIdx = getIdx('service');
            const dbIdx = getIdx('db');

            if (svcIdx !== -1 && gwIdx > svcIdx) {
                addError('Authentication Bypass', 'API Gateway is placed after the Backend Service. Requests invoke business logic before validation.');
            }
            if (dbIdx !== -1 && gwIdx > dbIdx) {
                addError('Authentication Bypass', 'API Gateway is placed after the Database. Database storage is exposed to unauthenticated queries.');
            }
        }

        // Backend Service Checks
        if (nodeId === 'service') {
            const svcIdx = getIdx('service');

            // Check missing gateway when strict security is active
            if (requirements.strictSecurity && !hasNode('gateway')) {
                addError('Security Vulnerability', 'Strict Auth is active but requests reach the Backend Service without API Gateway token validation.');
            }
        }

        // Redis Cache Checks
        if (nodeId === 'redis') {
            const redisIdx = getIdx('redis');
            const dbIdx = getIdx('db');
            const svcIdx = getIdx('service');

            if (dbIdx !== -1 && redisIdx > dbIdx) {
                addError('Cache Placement Flaw', 'Redis Cache is placed after the Database. Disk queries will execute before cache lookups.');
            }
            if (svcIdx !== -1 && redisIdx < svcIdx) {
                addError('Orphaned Cache', 'Redis Cache is placed before the Backend Service. The backend service should coordinate caching checks.');
            }
        }

        // Database Checks
        if (nodeId === 'db') {
            const dbIdx = getIdx('db');
            const redisIdx = getIdx('redis');
            const queueIdx = getIdx('queue');

            // Check missing cache for read-heavy loads
            if (requirements.readHeavy && !hasNode('redis')) {
                addError('Database Overload Risk', 'Read-heavy traffic will query the persistent Database directly. Add a Redis Cache to handle read spikes.');
            } else if (requirements.readHeavy && redisIdx !== -1 && redisIdx > dbIdx) {
                addError('Database Overload Risk', 'Read-heavy loads query persistent database before cache. Place Redis Cache before Database.');
            }

            // Check missing queue for write-heavy decoupling
            if (requirements.writeHeavy && !hasNode('queue')) {
                addError('Write Bottleneck', 'Write-heavy traffic is active but no Message Queue is placed. Concurrent writes could lock database tables.');
            } else if (requirements.writeHeavy && queueIdx !== -1 && queueIdx > dbIdx) {
                addError('Write Bottleneck', 'Message Queue is placed after Database. Writes will execute synchronously before queuing.');
            }

            // Check missing gateway when strict security is active
            if (requirements.strictSecurity && !hasNode('gateway')) {
                addError('Security Vulnerability', 'Strict Auth is active but requests reach the Database directly without Gateway token validation.');
            }
        }

        return errors;
    };

    const validateArchitecture = () => {
        const errors = [];

        // Sort placed components
        const sorted = [...placedComponents].sort((a, b) => parseFloat(a.x) - parseFloat(b.x));
        const fullSequence = [
            ...sorted.filter(c => parseFloat(c.x) < 10),
            { id: 'client', label: 'Client', x: '10%', y: '50%' },
            ...sorted.filter(c => parseFloat(c.x) >= 10)
        ];

        const getIdx = (id) => fullSequence.findIndex(c => c.id === id);
        const hasNode = (id) => placedComponents.some(c => c.id === id);

        const addError = (nodeId, title, msg) => {
            errors.push({ nodeId, title, msg });
        };

        // Check if there are placed nodes at all
        if (placedComponents.length === 0) {
            addError('client', 'Empty Canvas', 'No components placed yet. Click "+ Add" in the toolbox to begin building your architecture.');
            setValidationErrors(errors);
            return false;
        }

        // Rule 1: DNS Lookup check
        if (hasNode('dns')) {
            const dnsIdx = getIdx('dns');
            const cdnIdx = getIdx('cdn');
            const fwIdx = getIdx('firewall');
            const lbIdx = getIdx('lb');

            if (cdnIdx !== -1 && dnsIdx > cdnIdx) {
                addError('dns', 'DNS Lookup Sequence Error', 'The DNS Resolver is placed after the CDN. Domain IP resolution must occur before requesting CDN edge content.');
            }
            if (fwIdx !== -1 && dnsIdx > fwIdx) {
                addError('dns', 'DNS Lookup Sequence Error', 'The DNS Resolver is placed after the Firewall. The client must resolve domain name before sending traffic to Firewall.');
            }
            if (lbIdx !== -1 && dnsIdx > lbIdx) {
                addError('dns', 'DNS Lookup Sequence Error', 'The DNS Resolver is placed after the Load Balancer. Domain resolution must happen before connecting to the Load Balancer.');
            }
        }

        // Rule 2: DDoS / Attack Shield (Firewall)
        if (requirements.ddosProtection) {
            if (!hasNode('firewall')) {
                addError('client', 'WAF Protection Missing', 'DDoS Protection is enabled but no Web Firewall (WAF) is placed on the canvas.');
            } else {
                const fwIdx = getIdx('firewall');
                const lbIdx = getIdx('lb');
                const gwIdx = getIdx('gateway');
                const svcIdx = getIdx('service');

                if (lbIdx !== -1 && fwIdx > lbIdx) {
                    addError('firewall', 'Firewall Bypass', 'The Firewall is placed after the Load Balancer. Traffic must be filtered before hitting the balancer.');
                }
                if (gwIdx !== -1 && fwIdx > gwIdx) {
                    addError('firewall', 'Firewall Bypass', 'The Firewall is placed after the API Gateway. Malicious requests should be blocked at the outer boundary.');
                }
                if (svcIdx !== -1 && fwIdx > svcIdx) {
                    addError('firewall', 'Firewall Bypass', 'The Firewall is placed after the Backend Service. Unfiltered traffic is reaching the service nodes directly.');
                }
            }
        }

        // Rule 3: Global Audience (CDN Cache)
        if (requirements.globalAudience) {
            if (!hasNode('cdn')) {
                addError('client', 'Global Latency Risk', 'Global Audience is enabled but no CDN Edge Cache is placed. Users will suffer high ingress latencies.');
            } else {
                const cdnIdx = getIdx('cdn');
                const lbIdx = getIdx('lb');
                const gwIdx = getIdx('gateway');

                if (lbIdx !== -1 && cdnIdx > lbIdx) {
                    addError('cdn', 'Suboptimal CDN Placement', 'CDN is placed after the Load Balancer. Edge content should cache near users before balancing.');
                }
                if (gwIdx !== -1 && cdnIdx > gwIdx) {
                    addError('cdn', 'Suboptimal CDN Placement', 'CDN is placed after the API Gateway. Static resource fetches should not invoke gateway operations.');
                }
            }
        }

        // Rule 4: Read-Heavy Traffic Caching (Redis)
        if (requirements.readHeavy) {
            if (!hasNode('redis')) {
                if (hasNode('db')) {
                    addError('db', 'Database Overload Risk', 'Read-heavy traffic will hit the Database directly. Add a Redis Cache to handle frequent read operations.');
                } else {
                    addError('client', 'Caching Layer Missing', 'Read-heavy traffic is enabled but no Redis Cache is placed to offset database reads.');
                }
            } else {
                const redisIdx = getIdx('redis');
                const dbIdx = getIdx('db');
                const svcIdx = getIdx('service');

                if (dbIdx !== -1 && redisIdx > dbIdx) {
                    addError('redis', 'Misplaced Cache', 'The Redis Cache is placed after the Database. Cache lookups should occur before querying persistent database storage.');
                }
                if (svcIdx !== -1 && redisIdx < svcIdx) {
                    addError('redis', 'Orphaned Cache', 'The Redis Cache is placed before the Backend Service. The backend service should coordinate caching checks.');
                }
            }
        }

        // Rule 5: Write-Heavy Ingestion Decoupling (Queue)
        if (requirements.writeHeavy) {
            if (!hasNode('queue')) {
                if (hasNode('db')) {
                    addError('db', 'Write Bottleneck', 'Write-heavy traffic is enabled but no Message Queue is placed. Concurrent writes could lock database tables.');
                } else {
                    addError('client', 'Ingestion Queue Missing', 'Write-heavy traffic is enabled but no Message Queue is placed to buffer writes.');
                }
            } else {
                const queueIdx = getIdx('queue');
                const dbIdx = getIdx('db');

                if (dbIdx !== -1 && queueIdx > dbIdx) {
                    addError('queue', 'Queue Placement Flaw', 'The Message Queue is placed after the Database. Writes will hit the database synchronously before queue buffer ingestion.');
                }
            }
        }

        // Rule 6: Strict Authentication Guard
        if (requirements.strictSecurity) {
            const gwIdx = getIdx('gateway');
            const svcIdx = getIdx('service');
            const dbIdx = getIdx('db');

            if (!hasNode('gateway')) {
                if (svcIdx !== -1) {
                    addError('service', 'Security Vulnerability', 'Strict Auth is active but requests reach Backend Service without Gateway token validation.');
                } else if (dbIdx !== -1) {
                    addError('db', 'Security Vulnerability', 'Strict Auth is active but requests can reach the Database directly without a Gateway guard.');
                }
            } else {
                if (svcIdx !== -1 && gwIdx > svcIdx) {
                    addError('gateway', 'Authentication Bypass', 'API Gateway is placed after the Backend Service. Unauthenticated requests will trigger backend business logic.');
                }
                if (dbIdx !== -1 && gwIdx > dbIdx) {
                    addError('gateway', 'Authentication Bypass', 'API Gateway is placed after the Database. Database is exposed to unauthenticated queries.');
                }
            }
        }

        // Rule 7: Basic Ingress Check
        if (hasNode('lb') && hasNode('gateway')) {
            const lbIdx = getIdx('lb');
            const gwIdx = getIdx('gateway');
            if (lbIdx > gwIdx) {
                addError('lb', 'Improper Ingress Ordering', 'The Load Balancer is placed after the API Gateway. Balance traffic at the outer entry boundary.');
            }
        }

        setValidationErrors(errors);
        return errors;
    };

    const handleNextStep = (currentStepIdx, autoPlay = true, currentErrors = null, ackList = null) => {
        const nextIdx = currentStepIdx + 1;
        if (nextIdx >= stepsList.length) {
            setStep(stepsList.length - 1);
            setIsFinished(true);
            setIsRunning(false);
            setHistory(h => [`[CLIENT] Response rendered. Lifecycle complete!`, ...h.slice(0, 49)]);
            return;
        }

        const currentNodeId = stepsList[nextIdx];
        const prevNodeId = stepsList[currentStepIdx];

        // Check if next node has validation errors (excluding already acknowledged ones)
        const errorsList = currentErrors || validationErrors;
        const ackNodes = ackList || acknowledgedNodes;
        const hasError = mode === 'build' && errorsList.some(e => e.nodeId === currentNodeId) && !ackNodes.includes(currentNodeId);
        
        // Add step latency
        const stepLatency = latencies[currentNodeId] || 0;
        setLatency(prev => prev + stepLatency);
        setStep(nextIdx);

        // Get label dynamically
        let nodeLabel = currentNodeId.toUpperCase();
        if (currentNodeId === 'client') nodeLabel = 'Client';
        else if (currentNodeId === 'dns') nodeLabel = 'DNS Resolver';
        else if (currentNodeId === 'lb') nodeLabel = 'Load Balancer';
        else if (currentNodeId === 'gateway') nodeLabel = 'API Gateway';
        else if (currentNodeId === 'service') nodeLabel = 'Backend Service';
        else if (currentNodeId === 'redis') nodeLabel = 'Redis Cache';
        else if (currentNodeId === 'db') nodeLabel = 'Database';
        else if (currentNodeId === 'cdn') nodeLabel = 'CDN Edge Cache';
        else if (currentNodeId === 'firewall') nodeLabel = 'Web Firewall (WAF)';
        else if (currentNodeId === 'queue') nodeLabel = 'Message Queue';

        // Custom logging details
        let logMsg = `[LIFECYCLE] Packet arrived at ${nodeLabel}.`;
        if (currentNodeId === 'client' && prevNodeId === 'dns') {
            logMsg = `[DNS] DNS Resolver returned IP Address 192.168.1.10. Client initiating HTTPS request to Load Balancer...`;
        } else if (currentNodeId === 'gateway' && scenario === 'rate-limit') {
            logMsg = `[RATE LIMIT] Gateway blocks request. Too many requests from Client IP. Returning 429 Too Many Requests.`;
        } else if (currentNodeId === 'redis' && scenario === 'cache-hit') {
            logMsg = `[CACHE] Redis HIT! Retrieved data key in 2ms. Returning response...`;
        } else if (currentNodeId === 'redis' && scenario === 'cache-miss') {
            logMsg = `[CACHE] Redis MISS! Data key not in cache. Falling back to DB query.`;
        }

        if (hasError) {
            const err = errorsList.find(e => e.nodeId === currentNodeId);
            logMsg = `[VALIDATION ERROR] Request failed at ${nodeLabel}: ${err.msg}`;
        }

        setHistory(h => [logMsg, ...h.slice(0, 49)]);

        if (hasError) {
            setIsRunning(false);
            return;
        }

        // Trigger next automatically if running and not paused
        if (autoPlay) {
            animationTimer.current = setTimeout(() => {
                handleNextStep(nextIdx, true, errorsList, ackNodes);
            }, 1200 * speedFactor);
        }
    };

    const handleStart = () => {
        let errors = [];
        if (mode === 'build') {
            errors = validateArchitecture();
        }
        setAcknowledgedNodes([]);

        if (animationTimer.current) clearTimeout(animationTimer.current);
        setStep(0);
        setLatency(0);
        setIsRunning(true);
        setIsPaused(false);
        setIsFinished(false);
        setHistory([`[CLIENT] Initiating GET /api/user/4 ...`, `Resolving domain hostname via DNS resolver...`]);

        const hasClientError = mode === 'build' && errors.some(e => e.nodeId === 'client');
        if (hasClientError) {
            setIsRunning(false);
            const clientErr = errors.find(e => e.nodeId === 'client');
            setHistory(h => [`[VALIDATION ERROR] Request failed at Client: ${clientErr.msg}`, ...h]);
            return;
        }
        
        animationTimer.current = setTimeout(() => {
            handleNextStep(0, true, errors, []);
        }, 1000 * speedFactor);
    };

    const handlePause = () => {
        if (animationTimer.current) clearTimeout(animationTimer.current);
        setIsPaused(true);
    };

    const handleResume = () => {
        setIsPaused(false);
        animationTimer.current = setTimeout(() => {
            handleNextStep(step, true, validationErrors, acknowledgedNodes);
        }, 1200 * speedFactor);
    };

    const handleStep = () => {
        let errors = [];
        if (mode === 'build' && step === -1) {
            errors = validateArchitecture();
        } else if (mode === 'build') {
            errors = validationErrors;
        }

        if (step === -1 || isFinished) {
            if (animationTimer.current) clearTimeout(animationTimer.current);
            setStep(0);
            setLatency(0);
            setIsRunning(true);
            setIsPaused(true);
            setIsFinished(false);
            setHistory([`[CLIENT] Initiating GET /api/user/4 ...`, `Resolving domain hostname via DNS resolver...`]);

            const hasClientError = mode === 'build' && errors.some(e => e.nodeId === 'client') && !acknowledgedNodes.includes('client');
            if (hasClientError) {
                setIsRunning(false);
                const clientErr = errors.find(e => e.nodeId === 'client');
                setHistory(h => [`[VALIDATION ERROR] Request failed at Client: ${clientErr.msg}`, ...h]);
                return;
            }
        } else {
            if (animationTimer.current) clearTimeout(animationTimer.current);
            setIsPaused(true);
            handleNextStep(step, false, errors, acknowledgedNodes);
        }
    };

    const handleReset = () => {
        if (animationTimer.current) clearTimeout(animationTimer.current);
        setStep(-1);
        setNarrationStep(-1);
        setLatency(0);
        setIsRunning(false);
        setIsPaused(false);
        setIsFinished(false);
        setHistory(['Simulation reset. Ready for lifecycle trace.']);
        setValidationErrors([]);
        setAcknowledgedNodes([]);
    };

    const handleAcknowledgeAndContinue = (nodeId) => {
        const updatedAcks = [...acknowledgedNodes, nodeId];
        setAcknowledgedNodes(updatedAcks);
        setIsRunning(true);
        setIsPaused(false);
        if (animationTimer.current) clearTimeout(animationTimer.current);
        animationTimer.current = setTimeout(() => {
            handleNextStep(step, true, validationErrors, updatedAcks);
        }, 500 * speedFactor);
    };

    const getNodeCoords = (nodeId) => {
        if (nodeId === 'client') return { x: '10%', y: '50%' };
        const comp = placedComponents.find(c => c.id === nodeId);
        if (comp) return { x: comp.x, y: comp.y };
        // Fallback to nodes config if not placed yet
        const node = nodes.find(n => n.id === nodeId);
        return { x: node ? node.x : '50%', y: node ? node.y : '50%' };
    };

    const getPacketNodeCoords = (nodeId) => {
        if (nodeId === 'client') return { x: '10%', y: '50%' };
        if (dragStartCoords && dragStartCoords.id === nodeId) {
            return { x: dragStartCoords.x, y: dragStartCoords.y };
        }
        const comp = placedComponents.find(c => c.id === nodeId);
        if (comp) return { x: comp.x, y: comp.y };
        const node = nodes.find(n => n.id === nodeId);
        return { x: node ? node.x : '50%', y: node ? node.y : '50%' };
    };

    const getPacketDetails = () => {
        if (step < 0) return { label: '', color: 'var(--green)', glow: 'rgba(166,227,161,0.4)', icon: '' };
        
        const currentNodeId = stepsList[step];
        const prevNodeId = step > 0 ? stepsList[step - 1] : null;
        
        // DNS query step
        if (currentNodeId === 'dns' || (currentNodeId === 'client' && prevNodeId === 'dns')) {
            return {
                label: 'DNS REQ',
                color: 'var(--cyan)',
                glow: 'rgba(137,220,235,0.6)',
                icon: ''
            };
        }
        
        // Rate limited return step
        if (scenario === 'rate-limit' && step === 5) {
            return {
                label: '429 BLOCKED',
                color: 'var(--pink)',
                glow: 'rgba(243,139,168,0.7)',
                icon: ''
            };
        }
        
        // Success response steps
        const isResponsePhase = 
            (scenario === 'cache-hit' && step >= 7) ||
            (scenario === 'cache-miss' && step >= 8);
            
        if (isResponsePhase) {
            return {
                label: '200 OK',
                color: 'var(--green)',
                glow: 'rgba(166,227,161,0.7)',
                icon: ''
            };
        }
        
        // Normal Request Phase
        return {
            label: 'GET /api',
            color: 'var(--yellow)',
            glow: 'rgba(249,226,175,0.7)',
            icon: ''
        };
    };

    const getConceptExplanation = () => {
        const concepts = [];
        if (step >= 0 && step < stepsList.length) {
            const nodeId = stepsList[step];
            const prevNodeId = step > 0 ? stepsList[step - 1] : null;

            if (nodeId === 'client' && prevNodeId === 'dns') {
                concepts.push({
                    title: "IP Address Resolution",
                    operation: "DNS Response Received",
                    color: "#b5e2fa",
                    metrics: [
                        { label: "Resolved IP", value: "192.168.1.10" },
                        { label: "Protocol", value: "UDP Port 53" }
                    ],
                    why: "Browsers cannot route requests using human-readable domain names. They must resolve the domain name to a numerical IP address first.",
                    impact: "DNS queries are cached at the OS and browser levels to avoid repeated high-latency roundtrips to recursive name servers."
                });
            } else if (nodeId === 'dns') {
                concepts.push({
                    title: "Domain Name System (DNS)",
                    operation: "DNS Query Sent",
                    color: "#b5e2fa",
                    metrics: [
                        { label: "Target Domain", value: "corestudio.com" },
                        { label: "Latency", value: "15 ms" }
                    ],
                    why: "DNS acts as the phonebook of the internet, mapping human-friendly domain names to machine-routable IP addresses.",
                    impact: "Enables hostnames to remain constant even if underlying server IPs change."
                });
            } else if (nodeId === 'lb') {
                concepts.push({
                    title: "Load Balancing",
                    operation: "Ingress Routing",
                    color: "var(--yellow)",
                    metrics: [
                        { label: "Algorithm", value: "Round Robin" },
                        { label: "Latency", value: "5 ms" }
                    ],
                    why: "A single server cannot handle millions of concurrent requests. A load balancer distributes incoming HTTP traffic evenly across a cluster of servers.",
                    impact: "Prevents server overload, improves redundancy, and enables horizontal scaling."
                });
            } else if (nodeId === 'gateway') {
                concepts.push({
                    title: "API Gateway",
                    operation: scenario === 'rate-limit' ? "Rate Limit Triggered" : "Authentication & Routing",
                    color: "var(--pink)",
                    metrics: [
                        { label: "Status", value: scenario === 'rate-limit' ? "429 Too Many Requests" : "200 Authorized" },
                        { label: "Latency", value: "10 ms" }
                    ],
                    why: "Centralizes cross-cutting concerns like authentication, rate limiting, SSL termination, and microservices routing so individual services don't have to implement them.",
                    impact: "Shields backend services from unauthorized access and distributed denial of service (DDoS) spikes."
                });
            } else if (nodeId === 'service') {
                concepts.push({
                    title: "Backend Application Service",
                    operation: "Request Processing",
                    color: "var(--green)",
                    metrics: [
                        { label: "Runtime", value: "Node.js / Go" },
                        { label: "Latency", value: "12 ms" }
                    ],
                    why: "Executes business logic, controller code, parses payloads, authorizes actions, and interacts with downstream datastores or caches.",
                    impact: "Processes core application logic and coordinates data retrieval to form the final API response payload."
                });
            } else if (nodeId === 'redis') {
                concepts.push({
                    title: "In-Memory Caching (Redis)",
                    operation: scenario === 'cache-hit' ? "Cache HIT" : "Cache MISS",
                    color: "var(--cyan)",
                    metrics: [
                        { label: "Type", value: "Key-Value Store" },
                        { label: "Latency", value: "2 ms" }
                    ],
                    why: "Querying physical databases requires slow disk I/O. Cache stores frequently accessed data in RAM, returning it in a fraction of a millisecond.",
                    impact: "Reduces database read load and decreases API response times exponentially."
                });
            } else if (nodeId === 'db') {
                concepts.push({
                    title: "Relational Database (RDBMS)",
                    operation: "SQL Query Execution",
                    color: "var(--yellow)",
                    metrics: [
                        { label: "Type", value: "PostgreSQL / MySQL" },
                        { label: "Latency", value: "120 ms" }
                    ],
                    why: "When data is not in cache, the system queries the relational database on disk to retrieve the source of truth.",
                    impact: "Ensures strong data consistency and persistence, but incurs significantly higher read/write latency."
                });
            } else if (nodeId === 'client') {
                concepts.push({
                    title: "Client Rendering",
                    operation: "Response Received",
                    color: "#fafafa",
                    metrics: [
                        { label: "Status Code", value: scenario === 'rate-limit' ? "429 Blocked" : "200 OK" },
                        { label: "Total Latency", value: `${latency} ms` }
                    ],
                    why: "The client receives the final JSON response payload or HTTP status, parses it, and renders the updated state to the user's interface.",
                    impact: "Completes the request-response loop, updating UI state in the browser."
                });
            }
        }

        if (concepts.length === 0) {
            concepts.push({
                title: "Awaiting Simulation Trace",
                operation: "Ready",
                color: "#6c7086",
                metrics: [
                    { label: "Status", value: "Idle" },
                    { label: "Scenario", value: scenario.replace('-', ' ').toUpperCase() }
                ],
                why: "No API request is currently being traced.",
                impact: "Select a scenario from the dropdown on the left, then click Start or Step to watch the request travel through system design nodes."
            });
        }
        return concepts;
    };

    const getSpeechBubbleData = (nodeId, stepIndex) => {
        // Suppress message cards (speech bubbles) for the last component and the entire return path
        const isLastOrReturnStep = 
            (scenario === 'rate-limit' && stepIndex >= 4) ||
            (scenario === 'cache-hit' && stepIndex >= 6) ||
            (scenario === 'cache-miss' && stepIndex >= 7);

        if (isLastOrReturnStep) return null;

        const coords = (id) => {
            const pos = getNodeCoords(id);
            return `(${pos.x}, ${pos.y})`;
        };

        switch (nodeId) {
            case 'client':
                if (stepIndex === 0) {
                    return {
                        title: 'Host Resolution',
                        what: 'The client browser initiates a GET request. Since it only knows the hostname "corestudio.com", it must resolve the domain to a public IP address.',
                        howMove: `The browser sends a UDP packet on Port 53 to the DNS Resolver at ${coords('dns')} to fetch the corresponding IP address.`
                    };
                }
                if (stepIndex === 2) {
                    return {
                        title: 'Inbound Request',
                        what: 'Armed with the server\'s IP address (192.168.1.10) resolved from DNS, the client initiates a secure HTTPS connection (TCP + SSL/TLS Handshake).',
                        howMove: `The browser payload travels over the internet, hitting the Load Balancer ingress point at ${coords('lb')} to distribute incoming traffic.`
                    };
                }
                // Final step: Rate limit blocks request or returns 200 OK (no speech bubble for 200 OK)
                if (scenario === 'rate-limit') {
                    return {
                        title: 'Request Blocked',
                        what: 'The browser receives a "429 Too Many Requests" response from the gateway because the IP exceeded its allowed quota limit.',
                        howMove: 'The request-response lifecycle terminates here. The client goes back to idle, waiting for the next user event/interaction.'
                    };
                }
                return null;

            case 'dns':
                return {
                    title: 'DNS Resolution',
                    what: 'The DNS Resolver queries its cache/authoritative nameservers, mapping the hostname "corestudio.com" to the public IP 192.168.1.10.',
                    howMove: `It packages the IP address in a DNS response payload and routes it back to the Client at ${coords('client')} to complete the name resolution phase.`
                };

            case 'lb':
                return {
                    title: 'Traffic Balancing',
                    what: 'The Load Balancer (NGINX/HAProxy) intercepts the incoming HTTPS stream, decrypts TLS, and applies a Round-Robin algorithm to select a healthy gateway node.',
                    howMove: `It proxies the HTTP request headers and payload through the local internal network to the API Gateway at ${coords('gateway')}.`
                };

            case 'gateway':
                if (scenario === 'rate-limit') {
                    return {
                        title: 'Rate Limiter',
                        what: 'The API Gateway evaluates the request headers and client IP. The rate limiter reports that the request quota has been exceeded for this window.',
                        howMove: `To protect upstream servers, it terminates the request immediately and sends a 429 status code back to the Client at ${coords('client')}.`
                    };
                }
                return {
                    title: 'Gateway Guard',
                    what: 'The API Gateway validates the client\'s JWT authentication token, ensures headers are sanitized, and validates that the request is within rate limits.',
                    howMove: `Having authorized the packet, it reverse-proxies the request to the upstream Backend Service at ${coords('service')} for database processing.`
                };

            case 'service':
                if (stepIndex === 5) {
                    return {
                        title: 'Service Handler',
                        what: 'The Backend Service (Go/Node) receives the request and runs the user controller. To fetch the data for "user/4", it first performs a fast RAM cache check.',
                        howMove: `It issues an in-memory key lookup command over TCP to the Redis Cache cluster located at ${coords('redis')}.`
                    };
                }
                // return path
                const source = scenario === 'cache-hit' ? 'Redis cache' : 'Database store';
                return {
                    title: 'Response Packaging',
                    what: `The Backend Service receives the data payload from the ${source}, serializes it into a JSON string, and appends the standard HTTP headers.`,
                    howMove: `It sends the compiled HTTP response (200 OK) back along the response pipeline to the Client at ${coords('client')}.`
                };

            case 'redis':
                if (scenario === 'cache-hit') {
                    return {
                        title: 'Cache Hit',
                        what: 'Redis queries its in-memory key-value store for "user:4" and finds a valid hit. It retrieves the serialized user data in less than 2 milliseconds.',
                        howMove: `It returns the stored JSON object directly to the Backend Service at ${coords('service')}, completely bypassing database disk I/O.`
                    };
                }
                return {
                    title: 'Cache Miss',
                    what: 'Redis queries its in-memory storage for "user:4" but finds no key match. This is a cache miss, meaning the data must be retrieved from the persistent database.',
                    howMove: `It returns a null response to the Backend Service at ${coords('service')}, which will trigger a fallback query to the Database.`
                };

            case 'db':
                return {
                    title: 'Database Query',
                    what: 'The Database (PostgreSQL/MySQL) receives the SQL query: "SELECT * FROM users WHERE id = 4". It executes the query against indexed records on disk.',
                    howMove: `Once the disk read completes, it transmits the retrieved rows back to the Backend Service at ${coords('service')} (which will write it to Redis).`
                };

            case 'cdn':
                return {
                    title: 'CDN Cache Lookup',
                    what: 'The request hits the Content Delivery Network (CDN) edge cache. If the static asset or route is cached, it returns the content instantly from edge memory.',
                    howMove: `If a cache hit occurs, it returns directly. Otherwise, it forwards the request to the next upstream network node.`
                };

            case 'firewall':
                return {
                    title: 'WAF Security Filter',
                    what: 'The Web Application Firewall inspects incoming payloads, headers, and request patterns to mitigate DDoS attacks, SQL injection, and malicious scripts.',
                    howMove: `Authorized requests pass security validations and route inward to the entry points.`
                };

            case 'queue':
                return {
                    title: 'Message Queuing',
                    what: 'The Message Queue buffers incoming transaction requests or background tasks to process them asynchronously and prevent system overload.',
                    howMove: `Tasks are persisted in the queue queue. Worker services will process them and update the database in a controlled stream.`
                };

            default:
                const comp = placedComponents.find(c => c.id === nodeId);
                if (comp) {
                    const isGoingForward = stepIndex < Math.floor(stepsList.length / 2);
                    const directionMsg = isGoingForward 
                        ? `Forwarding request payload to the next node in the pipeline.`
                        : `Returning output response payload back towards the Client.`;
                    return {
                        title: comp.label,
                        what: `${comp.desc}`,
                        howMove: `Hop #${stepIndex + 1}: Request is at ${comp.label}. ${directionMsg}`
                    };
                }
                return null;
        }
    };

    return (
        <ImmersiveLayout
            isActive={true}
            title="API Request Lifecycle Tracer"
            icon={<SignalIcon size={20} />}
            moduleLabel="System Design"
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
            currentStepNum={step >= 0 ? step + 1 : 0}
            totalSteps={stepsList.length}
            phaseName={step >= 0 ? `Stage: ${stepsList[step].toUpperCase()}` : "Idle"}
            hideFooter={true}
            leftContent={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    
                    {/* Mode Selector Panel */}
                    <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                        <div className="panel-header" style={{ background: 'var(--yellow)', padding: '4px 8px', fontSize: '0.72rem' }}>
                            Tracer Mode
                        </div>
                        <div style={{ padding: '0.6rem', background: '#fff', display: 'flex', gap: '0.4rem' }}>
                            <button
                                onClick={() => { setMode('trace'); handleReset(); setValidationErrors([]); setPlacedComponents(defaultNodes); }}
                                style={{
                                    flex: 1,
                                    padding: '4px 8px',
                                    fontSize: '0.65rem',
                                    fontWeight: 'bold',
                                    background: mode === 'trace' ? 'var(--yellow)' : '#fafafa',
                                    border: '1.5px solid var(--border)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    boxShadow: mode === 'trace' ? '1.5px 1.5px 0 var(--border)' : 'none'
                                }}
                            >
                                Live Tracer
                            </button>
                            <button
                                onClick={() => { setMode('build'); handleReset(); setValidationErrors([]); setPlacedComponents([]); }}
                                style={{
                                    flex: 1,
                                    padding: '4px 8px',
                                    fontSize: '0.65rem',
                                    fontWeight: 'bold',
                                    background: mode === 'build' ? 'var(--yellow)' : '#fafafa',
                                    border: '1.5px solid var(--border)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    boxShadow: mode === 'build' ? '1.5px 1.5px 0 var(--border)' : 'none'
                                }}
                            >
                                Architecture Builder
                            </button>
                        </div>
                    </div>

                    {/* Scenario Selector Panel (Only in Trace Mode) */}
                    {mode === 'trace' && (
                        <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                            <div className="panel-header" style={{ background: 'var(--cyan)', padding: '4px 8px', fontSize: '0.72rem' }}>
                                Simulation Scenario
                            </div>
                            <div style={{ padding: '0.6rem', background: '#fff', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <label style={{ fontWeight: 800 }}>Scenario Path:</label>
                                    <select 
                                        value={scenario}
                                        onChange={e => { setScenario(e.target.value); handleReset(); }}
                                        style={{ padding: '0.2rem', border: '1.5px solid var(--border)', fontSize: '0.72rem', fontWeight: 700 }}
                                    >
                                        <option value="cache-hit">Cache Hit (Fast Path)</option>
                                        <option value="cache-miss">Cache Miss (Full DB Path)</option>
                                        <option value="rate-limit">Rate Limited (Early Block)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* System Requirements Panel (Only in Build Mode) */}
                    {mode === 'build' && (
                        <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                            <div className="panel-header" style={{ background: 'var(--yellow)', padding: '4px 8px', fontSize: '0.72rem' }}>
                                System Requirements
                            </div>
                            <div style={{ padding: '0.6rem', background: '#fff', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.68rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, cursor: 'pointer' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={requirements.globalAudience} 
                                        onChange={e => {
                                            setRequirements(r => ({ ...r, globalAudience: e.target.checked }));
                                            setValidationErrors([]);
                                        }}
                                        style={{ accentColor: 'var(--pink)', cursor: 'pointer' }}
                                    />
                                    Global Ingress (CDN Edge)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, cursor: 'pointer' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={requirements.ddosProtection} 
                                        onChange={e => {
                                            setRequirements(r => ({ ...r, ddosProtection: e.target.checked }));
                                            setValidationErrors([]);
                                        }}
                                        style={{ accentColor: 'var(--pink)', cursor: 'pointer' }}
                                    />
                                    DDoS / Attack Shield (WAF)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, cursor: 'pointer' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={requirements.readHeavy} 
                                        onChange={e => {
                                            setRequirements(r => ({ ...r, readHeavy: e.target.checked }));
                                            setValidationErrors([]);
                                        }}
                                        style={{ accentColor: 'var(--pink)', cursor: 'pointer' }}
                                    />
                                    Read-Heavy Loads (Redis Cache)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, cursor: 'pointer' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={requirements.writeHeavy} 
                                        onChange={e => {
                                            setRequirements(r => ({ ...r, writeHeavy: e.target.checked }));
                                            setValidationErrors([]);
                                        }}
                                        style={{ accentColor: 'var(--pink)', cursor: 'pointer' }}
                                    />
                                    Write-Heavy Decoupling (Queue)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, cursor: 'pointer' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={requirements.strictSecurity} 
                                        onChange={e => {
                                            setRequirements(r => ({ ...r, strictSecurity: e.target.checked }));
                                            setValidationErrors([]);
                                        }}
                                        style={{ accentColor: 'var(--pink)', cursor: 'pointer' }}
                                    />
                                    Strict Authentication Guard
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Builder Toolbox (Only in build mode) */}
                    {mode === 'build' && (
                        <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                            <div className="panel-header" style={{ background: 'var(--cyan)', padding: '4px 8px', fontSize: '0.72rem' }}>
                                Component Toolbox
                            </div>
                            <div style={{ padding: '0.6rem', background: '#fff', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.68rem' }}>
                                <div style={{ fontSize: '0.58rem', opacity: 0.7, fontWeight: 'bold' }}>
                                    ADD PREDEFINED COMPONENTS:
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '130px', overflowY: 'auto', border: '1.5px solid var(--border)', padding: '4px', borderRadius: '4px' }}>
                                    {availableComponents.map(comp => {
                                        const isPlaced = placedComponents.some(pc => pc.id === comp.id);
                                        return (
                                            <div key={comp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa', padding: '3px 6px', borderRadius: '4px', border: '1px solid #ddd' }}>
                                                <span style={{ fontWeight: 'bold', fontSize: '0.62rem' }}>{comp.label}</span>
                                                <button
                                                    onClick={() => {
                                                        if (isPlaced) {
                                                            removeComponent(comp.id);
                                                        } else {
                                                            addComponent(comp.id);
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '1px 5px',
                                                        fontSize: '0.58rem',
                                                        fontWeight: 'bold',
                                                        background: isPlaced ? '#fff0f0' : 'var(--yellow)',
                                                        color: isPlaced ? 'red' : 'inherit',
                                                        border: '1.5px solid var(--border)',
                                                        borderRadius: '3px',
                                                        cursor: 'pointer',
                                                        boxShadow: '1px 1px 0 var(--border)'
                                                    }}
                                                >
                                                    {isPlaced ? 'Remove' : '+ Add'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div style={{ borderTop: '1.5px solid var(--border)', paddingTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ fontSize: '0.58rem', opacity: 0.7, fontWeight: 'bold' }}>
                                        CREATE CUSTOM COMPONENT:
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Label (e.g. Stripe Gateway)" 
                                        value={customLabel}
                                        onChange={e => setCustomLabel(e.target.value)}
                                        style={{ width: '100%', padding: '3px 6px', border: '1.5px solid var(--border)', fontSize: '0.62rem', borderRadius: '4px', boxSizing: 'border-box' }}
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Description (e.g. Handles payment sessions)" 
                                        value={customDesc}
                                        onChange={e => setCustomDesc(e.target.value)}
                                        style={{ width: '100%', padding: '3px 6px', border: '1.5px solid var(--border)', fontSize: '0.62rem', borderRadius: '4px', boxSizing: 'border-box' }}
                                    />
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '0.58rem', fontWeight: 'bold' }}>Color:</span>
                                        <div style={{ display: 'flex', gap: '3px' }}>
                                            {[
                                                { name: 'pink', hex: 'var(--pink)' },
                                                { name: 'green', hex: 'var(--green)' },
                                                { name: 'yellow', hex: 'var(--yellow)' },
                                                { name: 'cyan', hex: 'var(--cyan)' },
                                                { name: 'purple', hex: '#cba6f7' }
                                            ].map(c => (
                                                <button
                                                    key={c.name}
                                                    onClick={() => setCustomColor(c.hex)}
                                                    style={{
                                                        width: 13,
                                                        height: 13,
                                                        borderRadius: '50%',
                                                        background: c.hex,
                                                        border: customColor === c.hex ? '1.5px solid #000' : '1px solid rgba(0,0,0,0.2)',
                                                        cursor: 'pointer'
                                                    }}
                                                    title={c.name}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (!customLabel.trim()) return;
                                            const id = 'custom_' + Date.now();
                                            setPlacedComponents(prev => [...prev, {
                                                id,
                                                label: customLabel.trim(),
                                                color: customColor,
                                                desc: customDesc.trim() || 'Custom system design node.',
                                                x: '50%',
                                                y: '50%'
                                            }]);
                                            setCustomLabel('');
                                            setCustomDesc('');
                                            setValidationErrors([]);
                                            handleReset();
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '4px',
                                            fontSize: '0.62rem',
                                            fontWeight: 'bold',
                                            background: 'var(--yellow)',
                                            border: '1.5px solid var(--border)',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            boxShadow: '1px 1px 0 var(--border)'
                                        }}
                                    >
                                        + Add Custom Node
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Builder Controls Panel (Only in build mode) */}
                    {mode === 'build' && (
                        <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                            <div className="panel-header" style={{ background: 'var(--cyan)', padding: '4px 8px', fontSize: '0.72rem' }}>
                                Builder Controls
                            </div>
                            <div style={{ padding: '0.6rem', background: '#fff', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <button
                                    onClick={() => {
                                        handleStart();
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '6px',
                                        fontSize: '0.68rem',
                                        fontWeight: 'bold',
                                        background: 'var(--green)',
                                        border: '1.5px solid var(--border)',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        boxShadow: '1.5px 1.5px 0 var(--border)'
                                    }}
                                >
                                    Validate Architecture
                                </button>
                                <button
                                    onClick={() => {
                                        setPlacedComponents([]);
                                        handleReset();
                                        setValidationErrors([]);
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '6px',
                                        fontSize: '0.68rem',
                                        fontWeight: 'bold',
                                        background: '#fff0f0',
                                        color: '#ff3333',
                                        border: '1.5px solid var(--border)',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        boxShadow: '1.5px 1.5px 0 var(--border)'
                                    }}
                                >
                                    Reset Canvas
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Metrics / Validation Alerts Panel */}
                    <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                        <div className="panel-header" style={{ background: 'var(--pink)', padding: '4px 8px', fontSize: '0.72rem' }}>
                            {mode === 'trace' ? 'Lifecycle Metrics' : 'Architecture Validation'}
                        </div>
                        <div style={{ padding: '0.6rem', background: '#fff', fontSize: '0.72rem' }}>
                            {mode === 'trace' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Network Latency:</span>
                                        <strong style={{ fontFamily: 'var(--font-mono)' }}>{latency} ms</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Request Status:</span>
                                        <strong style={{ 
                                            fontFamily: 'var(--font-mono)', 
                                            color: scenario === 'rate-limit' && step >= 4 ? 'var(--pink)' : 'var(--green)'
                                        }}>
                                            {step === -1 ? 'IDLE' : step === stepsList.length - 1 ? (scenario === 'rate-limit' ? '429 BLOCKED' : '200 OK') : 'ROUTING'}
                                        </strong>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {validationErrors.length > 0 ? (
                                        <div style={{ border: '1.5px solid var(--pink)', background: '#fff0f3', padding: '6px', borderRadius: '4px', color: 'var(--text)' }}>
                                            <div style={{ fontWeight: 'bold', color: 'var(--pink)', fontSize: '0.68rem', marginBottom: '2px' }}>
                                                Architecture Issues Found: {validationErrors.length}
                                            </div>
                                            <div style={{ fontSize: '0.6rem', opacity: 0.85, lineHeight: 1.25 }}>
                                                Warnings have been flagged on the canvas. Adjust node positions and resolve them to enable simulation.
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ border: '1.5px solid var(--green)', background: '#f0fff4', padding: '6px', borderRadius: '4px', color: 'var(--text)' }}>
                                            <div style={{ fontWeight: 'bold', color: 'var(--green)', fontSize: '0.68rem', marginBottom: '2px' }}>
                                                System Configured
                                            </div>
                                            <div style={{ fontSize: '0.6rem', opacity: 0.85, lineHeight: 1.25 }}>
                                                Specify system requirements, add components, and drag them to place them anywhere! Click Validate to verify.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            }
            centerContent={
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--white)', padding: isMobile ? '0.5rem' : '1rem', position: 'relative', overflow: isMobile ? 'auto' : 'hidden', WebkitOverflowScrolling: 'touch' }}>
                    
                    {/* Visual Topology Map */}
                    <div 
                        ref={canvasRef}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleMouseUp}
                        style={{ flex: 1, position: 'relative', minHeight: isMobile ? '300px' : '350px', cursor: draggingId ? 'grabbing' : 'default', userSelect: 'none' }}
                    >
                        
                        {/* Draw connection lines dynamically or statically */}
                        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                            {mode === 'trace' ? (
                                <>
                                    {/* Client -> DNS */}
                                    {(() => {
                                        const dnsCoords = getNodeCoords('dns');
                                        return (
                                            <line x1="10%" y1="50%" x2={dnsCoords.x} y2={dnsCoords.y} stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" />
                                        );
                                    })()}
                                    {/* Client -> LB */}
                                    {(() => {
                                        const lbCoords = getNodeCoords('lb');
                                        return (
                                            <line x1="10%" y1="50%" x2={lbCoords.x} y2={lbCoords.y} stroke="var(--border)" strokeWidth="2" />
                                        );
                                    })()}
                                    {/* LB -> Gateway */}
                                    {(() => {
                                        const lbCoords = getNodeCoords('lb');
                                        const gwCoords = getNodeCoords('gateway');
                                        return (
                                            <line x1={lbCoords.x} y1={lbCoords.y} x2={gwCoords.x} y2={gwCoords.y} stroke="var(--border)" strokeWidth="2" />
                                        );
                                    })()}
                                    {/* Gateway -> Service */}
                                    {(() => {
                                        const gwCoords = getNodeCoords('gateway');
                                        const svcCoords = getNodeCoords('service');
                                        return (
                                            <line x1={gwCoords.x} y1={gwCoords.y} x2={svcCoords.x} y2={svcCoords.y} stroke="var(--border)" strokeWidth="2" />
                                        );
                                    })()}
                                    {/* Service -> Cache */}
                                    {(() => {
                                        const svcCoords = getNodeCoords('service');
                                        const redisCoords = getNodeCoords('redis');
                                        return (
                                            <line x1={svcCoords.x} y1={svcCoords.y} x2={redisCoords.x} y2={redisCoords.y} stroke="var(--border)" strokeWidth="2" />
                                        );
                                    })()}
                                    {/* Service -> DB */}
                                    {(() => {
                                        const svcCoords = getNodeCoords('service');
                                        const dbCoords = getNodeCoords('db');
                                        return (
                                            <line x1={svcCoords.x} y1={svcCoords.y} x2={dbCoords.x} y2={dbCoords.y} stroke="var(--border)" strokeWidth="2" />
                                        );
                                    })()}
                                </>
                            ) : (
                                (() => {
                                    const sorted = [...placedComponents].sort((a, b) => parseFloat(a.x) - parseFloat(b.x));
                                    const fullSequence = [
                                        ...sorted.filter(c => parseFloat(c.x) < 10),
                                        { id: 'client', label: 'Client', x: '10%', y: '50%' },
                                        ...sorted.filter(c => parseFloat(c.x) >= 10)
                                    ];
                                    return fullSequence.map((comp, idx) => {
                                        if (idx === 0) return null;
                                        const prev = fullSequence[idx - 1];
                                        const prevCoords = prev.id === 'client' ? { x: '10%', y: '50%' } : { x: prev.x, y: prev.y };
                                        const currCoords = comp.id === 'client' ? { x: '10%', y: '50%' } : { x: comp.x, y: comp.y };
                                        return (
                                            <line
                                                key={`wire-${idx}`}
                                                x1={prevCoords.x}
                                                y1={prevCoords.y}
                                                x2={currCoords.x}
                                                y2={currCoords.y}
                                                stroke="var(--border)"
                                                strokeWidth="2.5"
                                            />
                                        );
                                    });
                                })()
                            )}
                        </svg>

                        {/* Client Node (Always placed) */}
                        <div
                            style={{
                                position: 'absolute',
                                left: '10%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                border: '2.5px solid var(--border)',
                                background: step >= 0 && stepsList[step] === 'client' ? 'var(--yellow)' : '#fafafa',
                                padding: '0.5rem 0.8rem',
                                borderRadius: '6px',
                                boxShadow: step >= 0 && stepsList[step] === 'client' ? '0 0 12px rgba(255,217,61,0.6)' : '3px 3px 0 var(--border)',
                                zIndex: 3,
                                width: 140,
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                                transition: 'all 0.2s',
                                userSelect: 'none'
                            }}
                        >
                            <div style={{ fontWeight: 800, fontSize: '0.75rem' }}>Client</div>
                            <div style={{ fontSize: '0.55rem', opacity: 0.75, fontWeight: 500, lineHeight: 1.15 }}>Browser initiates HTTPS request.</div>
                        </div>

                        {/* Other Nodes */}
                        {placedComponents.map(comp => {
                            const isNodeActive = step >= 0 && stepsList[step] === comp.id;
                            return (
                                <div
                                    key={comp.id}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleDragStart(comp.id, e);
                                    }}
                                    onTouchStart={(e) => {
                                        handleDragStart(comp.id, e);
                                    }}
                                    style={{
                                        position: 'absolute',
                                        left: comp.x,
                                        top: comp.y,
                                        transform: 'translate(-50%, -50%)',
                                        border: '2.5px solid var(--border)',
                                        background: isNodeActive ? 'var(--yellow)' : comp.color,
                                        padding: '0.5rem 0.8rem',
                                        borderRadius: '6px',
                                        boxShadow: isNodeActive ? '0 0 12px rgba(255,217,61,0.6)' : '3px 3px 0 var(--border)',
                                        zIndex: draggingId === comp.id ? 100 : 3,
                                        width: 140,
                                        textAlign: 'center',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '2px',
                                        cursor: draggingId === comp.id ? 'grabbing' : 'grab',
                                        transition: draggingId === comp.id ? 'none' : 'all 0.1s',
                                        userSelect: 'none'
                                    }}
                                >
                                    {mode === 'build' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeComponent(comp.id);
                                            }}
                                            style={{
                                                position: 'absolute',
                                                top: '3px',
                                                right: '5px',
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#888',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                fontSize: '0.62rem',
                                                padding: '0 2px',
                                                lineHeight: 1
                                            }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                    <div style={{ fontWeight: 800, fontSize: '0.75rem', marginTop: mode === 'build' ? '2px' : '0' }}>{comp.label}</div>
                                    <div style={{ fontSize: '0.55rem', opacity: 0.75, fontWeight: 500, lineHeight: 1.15 }}>{comp.desc}</div>
                                </div>
                            );
                        })}

                        {/* Visual Node-Anchored Warning Flags */}
                        {mode === 'build' && (() => {
                            if (narrationStep < 0 || narrationStep >= stepsList.length) return null;
                            const activeNodeId = stepsList[narrationStep];
                            
                            if (acknowledgedNodes.includes(activeNodeId)) return null;

                            const activeErrors = validationErrors.filter(e => e.nodeId === activeNodeId);
                            if (activeErrors.length === 0) return null;

                            const nodeCoords = getNodeCoords(activeNodeId);
                            const isBottomHalf = parseFloat(nodeCoords.y) > 55;
                            
                            return (
                                <motion.div
                                    key={`err-flag-${activeNodeId}`}
                                    initial={{ scale: 0.9, opacity: 0, y: isBottomHalf ? -10 : 10 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    style={{
                                        position: 'absolute',
                                        left: nodeCoords.x,
                                        top: nodeCoords.y,
                                        transform: isBottomHalf ? 'translate(-50%, calc(-100% - 30px))' : 'translate(-50%, 30px)',
                                        zIndex: 40,
                                        width: 220,
                                        background: '#1a0f12',
                                        color: '#f8f2f4',
                                        border: '1.5px solid #ff3355',
                                        borderRadius: '8px',
                                        padding: '10px',
                                        boxShadow: '0 8px 24px rgba(255, 51, 85, 0.2)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px',
                                        fontFamily: 'var(--font-mono), monospace',
                                        pointerEvents: 'auto'
                                    }}
                                >
                                    {/* Arrow */}
                                    <div style={{
                                        position: 'absolute',
                                        [isBottomHalf ? 'bottom' : 'top']: '-5px',
                                        left: '50%',
                                        transform: 'translateX(-50%) rotate(45deg)',
                                        width: 8,
                                        height: 8,
                                        background: '#1a0f12',
                                        [isBottomHalf ? 'borderRight' : 'borderLeft']: '1.5px solid #ff3355',
                                        [isBottomHalf ? 'borderBottom' : 'borderTop']: '1.5px solid #ff3355',
                                    }} />

                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                        <div style={{
                                            background: '#ff3355',
                                            color: '#fff',
                                            borderRadius: '4px',
                                            padding: '2px 5px',
                                            fontSize: '0.6rem',
                                            fontWeight: 'bold',
                                            lineHeight: 1
                                        }}>
                                            !
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <div style={{ fontSize: '0.68rem', fontWeight: 'bold', color: '#ffffff' }}>
                                                {activeErrors[0].title}
                                            </div>
                                            <div style={{ fontSize: '0.58rem', color: '#a58e94', lineHeight: 1.3 }}>
                                                {activeErrors[0].msg}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAcknowledgeAndContinue(activeNodeId);
                                        }}
                                        style={{
                                            marginTop: '4px',
                                            width: '100%',
                                            padding: '4px',
                                            fontSize: '0.55rem',
                                            fontWeight: 'bold',
                                            background: 'transparent',
                                            color: '#ff3355',
                                            border: '1px solid #ff3355',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            textAlign: 'center',
                                            textTransform: 'uppercase'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.background = '#ff3355';
                                            e.target.style.color = '#fff';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.background = 'transparent';
                                            e.target.style.color = '#ff3355';
                                        }}
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                        }}
                                    >
                                        Continue
                                    </button>
                                </motion.div>
                            );
                        })()}

                        {/* Live Tracer Active Speech Bubble */}
                        {narrationStep >= 0 && narrationStep < stepsList.length && (() => {
                            const activeNodeId = stepsList[narrationStep];
                            const coords = getNodeCoords(activeNodeId);
                            const data = getSpeechBubbleData(activeNodeId, narrationStep);
                            
                            if (!data) return null;

                            // In build mode, we do not show any speech bubbles. Speech bubbles are only for Live Tracer mode.
                            if (mode === 'build') return null;

                            const activeNode = placedComponents.find(c => c.id === activeNodeId) || nodes.find(n => n.id === activeNodeId);
                            const activeColor = activeNode ? activeNode.color : 'var(--cyan)';
                            
                            return (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: coords.x,
                                        top: coords.y,
                                        transform: 'translate(-50%, calc(-100% - 40px))',
                                        zIndex: 50,
                                        pointerEvents: 'none'
                                    }}
                                >
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0, y: 15 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        style={{
                                            width: 270,
                                            background: 'rgba(26, 27, 38, 0.95)',
                                            backdropFilter: 'blur(6px)',
                                            color: '#cdd6f4',
                                            border: `2.5px solid ${activeColor}`,
                                            borderRadius: '12px 12px 0px 12px',
                                            padding: '12px 14px',
                                            boxShadow: `5px 5px 0 ${activeColor}`,
                                            position: 'relative',
                                            textAlign: 'left',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '8px',
                                            fontFamily: 'var(--font-mono), monospace'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.15)', paddingBottom: '6px' }}>
                                            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: activeColor, letterSpacing: '1px' }}>
                                                // {activeNodeId.toUpperCase()}_LOG
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <motion.span 
                                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                                    style={{
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: '50%',
                                                        background: '#a6e3a1',
                                                        display: 'inline-block',
                                                        boxShadow: '0 0 8px #a6e3a1'
                                                    }} 
                                                />
                                                <span style={{ fontSize: '0.52rem', color: '#a6e3a1', fontWeight: 'bold' }}>ACTIVE</span>
                                            </div>
                                        </div>

                                        <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#fafafa', letterSpacing: '-0.2px' }}>
                                            {data.title}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ fontSize: '0.52rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#565f89', fontWeight: 'bold' }}>Processing:</span>
                                            <p style={{ margin: 0, fontSize: '0.62rem', lineHeight: 1.35, color: '#c0caf5' }}>
                                                {data.what}
                                            </p>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: '6px', borderLeft: `3px solid ${activeColor}` }}>
                                            <span style={{ fontSize: '0.52rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#bb9af3', fontWeight: 'bold' }}>Next Target Route:</span>
                                            <p style={{ margin: 0, fontSize: '0.58rem', lineHeight: 1.3, color: '#9ece6a' }}>
                                                {data.howMove}
                                            </p>
                                        </div>

                                        <div style={{
                                            position: 'absolute',
                                            bottom: '-7px',
                                            right: '15px',
                                            width: 12,
                                            height: 12,
                                            background: '#1a1b26',
                                            borderRight: `2.5px solid ${activeColor}`,
                                            borderBottom: `2.5px solid ${activeColor}`,
                                            transform: 'rotate(45deg)',
                                            zIndex: 1
                                        }} />
                                    </motion.div>
                                </div>
                            );
                        })()}

                        {/* Animated Request Packet */}
                        {step >= 0 && step < stepsList.length && (() => {
                            const pkt = getPacketDetails();
                            const coords = getPacketNodeCoords(stepsList[step]);
                            const prevCoords = step === 0 ? { x: '10%', y: '50%' } : getPacketNodeCoords(stepsList[step - 1]);
                            return (
                                <motion.div
                                    key={step}
                                    initial={{
                                        left: prevCoords.x,
                                        top: prevCoords.y,
                                        scale: 0.8,
                                        opacity: 0
                                    }}
                                    animate={{
                                        left: coords.x,
                                        top: coords.y,
                                        scale: 1,
                                        opacity: 1
                                    }}
                                    transition={{ duration: animDuration, ease: 'easeInOut' }}
                                    style={{
                                        position: 'absolute',
                                        transform: 'translate(-50%, -50%)',
                                        zIndex: 10,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        border: '2px solid var(--border)',
                                        background: '#1e1e2e',
                                        boxShadow: `0 0 15px ${pkt.glow}, 3px 3px 0 var(--border)`,
                                        color: '#cdd6f4',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.62rem',
                                        fontWeight: 'bold',
                                        pointerEvents: 'none'
                                    }}
                                >
                                    <span style={{ color: pkt.color }}>{pkt.icon}</span>
                                    <span>{pkt.label}</span>
                                </motion.div>
                            );
                        })()}
                    </div>
                </div>
            }
            rightContent={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.78rem', lineHeight: 1.5 }}>
                    <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)', display: 'flex', flexDirection: 'column' }}>
                        <div className="panel-header" style={{ background: 'var(--pink)', padding: '4px 8px', fontSize: '0.72rem' }}>
                            Learning Lab
                        </div>
                        <div style={{ background: '#fafafa', borderBottom: '1.5px solid var(--border)', display: 'flex', fontSize: '0.62rem' }}>
                            <button 
                                onClick={() => setLabTab('decoder')}
                                style={{
                                    flex: 1, padding: '6px 4px', border: 'none', background: labTab === 'decoder' ? '#fff' : 'transparent',
                                    borderRight: '1.5px solid var(--border)', fontWeight: labTab === 'decoder' ? 'bold' : 'normal',
                                    borderBottom: labTab === 'decoder' ? 'none' : '1.5px solid var(--border)', cursor: 'pointer',
                                    fontSize: '0.62rem'
                                }}
                            >
                                Live Decoder
                            </button>
                            <button 
                                onClick={() => setLabTab('overview')}
                                style={{
                                    flex: 1, padding: '6px 4px', border: 'none', background: labTab === 'overview' ? '#fff' : 'transparent',
                                    borderRight: '1.5px solid var(--border)', fontWeight: labTab === 'overview' ? 'bold' : 'normal',
                                    borderBottom: labTab === 'overview' ? 'none' : '1.5px solid var(--border)', cursor: 'pointer',
                                    fontSize: '0.62rem'
                                }}
                            >
                                Overview
                            </button>
                            <button 
                                onClick={() => setLabTab('guide')}
                                style={{
                                    flex: 1, padding: '6px 4px', border: 'none', background: labTab === 'guide' ? '#fff' : 'transparent',
                                    fontWeight: labTab === 'guide' ? 'bold' : 'normal',
                                    borderBottom: labTab === 'guide' ? 'none' : '1.5px solid var(--border)', cursor: 'pointer',
                                    fontSize: '0.62rem'
                                }}
                            >
                                Guide
                            </button>
                        </div>
                        <div style={{ padding: '0.8rem', background: '#fff', maxHeight: '420px', overflowY: 'auto', fontSize: '0.72rem', lineHeight: 1.4 }} className="no-scrollbar">
                            {labTab === 'decoder' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {getConceptExplanation().map((concept, idx) => (
                                        <div 
                                            key={idx} 
                                            style={{
                                                border: '2px solid var(--border)',
                                                borderRadius: '6px',
                                                background: '#fafafa',
                                                boxShadow: '3px 3px 0 var(--border)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {/* Header Section */}
                                            <div style={{
                                                background: concept.color,
                                                padding: '6px 10px',
                                                borderBottom: '2px solid var(--border)',
                                                color: concept.color === 'var(--pink)' || concept.color === 'var(--green)' ? '#fff' : 'var(--text)',
                                                fontWeight: 850,
                                                fontSize: '0.65rem',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <span>{concept.title}</span>
                                                <span style={{
                                                    fontSize: '0.52rem',
                                                    background: 'rgba(255,255,255,0.25)',
                                                    padding: '1px 4px',
                                                    borderRadius: '4px',
                                                    border: '1px solid rgba(0,0,0,0.1)',
                                                    fontWeight: 'bold',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {concept.operation}
                                                </span>
                                            </div>

                                            {/* Content Section */}
                                            <div style={{ padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#fff' }}>
                                                
                                                {/* Key metrics blocks */}
                                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                    {concept.metrics.map((m, mIdx) => (
                                                        <div 
                                                            key={mIdx} 
                                                            style={{
                                                                flex: 1,
                                                                background: '#f8f9fa',
                                                                border: '1.5px solid var(--border)',
                                                                borderRadius: '4px',
                                                                padding: '4px',
                                                                textAlign: 'center',
                                                                fontSize: '0.58rem'
                                                            }}
                                                        >
                                                            <div style={{ opacity: 0.6, fontSize: '0.52rem', textTransform: 'uppercase', fontWeight: 'bold' }}>{m.label}</div>
                                                            <div style={{ fontWeight: 800, color: 'var(--text)' }}>{m.value}</div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Detailed sections with borders */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.68rem', lineHeight: 1.35 }}>
                                                    <div style={{ borderLeft: '3px solid var(--cyan)', paddingLeft: '0.4rem' }}>
                                                        <strong style={{ display: 'block', fontSize: '0.6rem', color: '#555', textTransform: 'uppercase' }}>Why is it done?</strong>
                                                        <span style={{ opacity: 0.85 }}>{concept.why}</span>
                                                    </div>
                                                    <div style={{ borderLeft: '3px solid var(--green)', paddingLeft: '0.4rem' }}>
                                                        <strong style={{ display: 'block', fontSize: '0.6rem', color: '#555', textTransform: 'uppercase' }}>Real-World Impact</strong>
                                                        <span style={{ opacity: 0.85 }}>{concept.impact}</span>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    ))}

                                    {/* Request Trace Log */}
                                    <div style={{ marginTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', color: '#6c7086', borderBottom: '1px solid var(--border)', paddingBottom: '3px' }}>
                                            HTTP Request Trace Log:
                                        </div>
                                        <div className="no-scrollbar" style={{
                                            height: 120, border: '2.5px solid var(--border)', background: '#1e1e2e',
                                            padding: '0.4rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                                            color: '#cdd6f4', overflowY: 'auto', borderRadius: '6px', boxShadow: '2px 2px 0 var(--border)'
                                        }}>
                                            {history.map((log, lIdx) => (
                                                <div key={lIdx} style={{
                                                    color: log.startsWith('[RATE LIMIT]') ? '#ff5555' : log.startsWith('[CACHE]') ? '#a6e3a1' : '#cdd6f4',
                                                    marginBottom: '2px'
                                                }}>
                                                    {log}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {labTab === 'overview' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    <p style={{ fontWeight: 'bold', fontSize: '0.78rem', color: 'var(--cyan)' }}>Request Lifecycle Overview</p>
                                    <p style={{ opacity: 0.85 }}>
                                        Every HTTP request initiates a complex journey across network layers and physical hardware before returning a response.
                                    </p>
                                    <p style={{ opacity: 0.85 }}>
                                        Key hops in modern system design:
                                    </p>
                                    <ul style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '4px', opacity: 0.85 }}>
                                        <li><strong>DNS lookup:</strong> Resolving the hostname to an IP address.</li>
                                        <li><strong>Load Balancing:</strong> Distributing request traffic.</li>
                                        <li><strong>API Gateway:</strong> Authenticating and throttling requests.</li>
                                        <li><strong>Caching:</strong> Redis memory store to bypass database reads.</li>
                                        <li><strong>Database:</strong> Relational disk store source-of-truth.</li>
                                    </ul>
                                </div>
                            )}
                            {labTab === 'guide' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    <p style={{ fontWeight: 'bold', fontSize: '0.78rem', color: 'var(--yellow)' }}>How to trace this sandbox:</p>
                                    <ol style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '4px', opacity: 0.85 }}>
                                        <li><strong>Select scenario:</strong> Choose between Cache Hit, Cache Miss, or Rate Limit.</li>
                                        <li><strong>Auto Play:</strong> Click <strong>Start</strong> to auto-advance and observe the request packet flow.</li>
                                        <li><strong>Manual Trace:</strong> Click <strong>Step</strong> to step through the lifecycle manually at your own pace.</li>
                                        <li><strong>Adjust Speed:</strong> Use the speed controller in the navigation bar to speed up or slow down the packet animation.</li>
                                    </ol>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            }
            legend={[
                { color: 'var(--yellow)', label: 'Disk/Compute Node' },
                { color: 'var(--cyan)', label: 'In-Memory Node' },
                { color: 'var(--green)', label: 'Request Packet Trace' }
            ]}
        />
    );
}
