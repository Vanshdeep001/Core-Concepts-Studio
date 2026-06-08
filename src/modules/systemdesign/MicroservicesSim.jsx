import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import { NetworkIcon } from '../../components/Icons';

export default function MicroservicesSim() {
    // Mode selection: 'trace' | 'build'
    const [mode, setMode] = useState('trace'); 
    
    // Default system nodes
    const defaultNodes = [
        { id: 'client', label: 'Client App', x: '8%', y: '50%', color: '#f2f4f4', activeColor: '#7f8c8d', desc: 'Initiates order checkout requests.', health: 'healthy' },
        { id: 'gateway', label: 'API Gateway', x: '25%', y: '50%', color: '#ebdef0', activeColor: 'var(--yellow)', desc: 'Edge ingress entrypoint. Directs traffic and sanitizes headers.', health: 'healthy' },
        { id: 'registry', label: 'Service Registry', x: '45%', y: '20%', color: '#ebf5fb', activeColor: 'var(--cyan)', desc: 'Service discovery IP registry map.', health: 'healthy' },
        { id: 'order', label: 'Order Service', x: '48%', y: '50%', color: '#e8f8f5', activeColor: '#baffc9', desc: 'Coordinates transaction steps and persists orders.', health: 'healthy' },
        { id: 'payment', label: 'Payment Service', x: '75%', y: '25%', color: '#fdedec', activeColor: '#ffb3ba', desc: 'Charges client cards and validates balances.', health: 'healthy' },
        { id: 'inventory', label: 'Inventory Service', x: '75%', y: '68%', color: '#eaf2f8', activeColor: '#bae1ff', desc: 'Deducts database stock balances.', health: 'healthy' }
    ];

    // Placed components state (starts with default layout)
    const [placedComponents, setPlacedComponents] = useState(defaultNodes);
    
    // Dragging state
    const [draggingId, setDraggingId] = useState(null);
    const [dragStartCoords, setDragStartCoords] = useState(null);
    
    // Active simulation path & steps
    const [activePath, setActivePath] = useState(['client']);
    const pathRef = useRef(['client']);
    const [step, setStep] = useState(-1); // -1: idle
    const [narrationStep, setNarrationStep] = useState(-1);
    
    // Metrics & circuit states
    const [circuitState, setCircuitState] = useState('CLOSED'); // CLOSED, OPEN, HALF-OPEN
    const [metrics, setMetrics] = useState({ success: 0, failed: 0, retries: 0 });
    const [history, setHistory] = useState(['Microservice platform online. Toggle faults and click START.']);
    const [speed, setSpeed] = useState(1000);
    const [labTab, setLabTab] = useState('decoder'); // 'decoder' | 'overview' | 'guide'

    // Form inputs for custom service
    const [customLabel, setCustomLabel] = useState('');
    const [customColor, setCustomColor] = useState('#ebdef0');
    const [customDesc, setCustomDesc] = useState('');

    // Inline canvas node renaming states
    const [editingNodeId, setEditingNodeId] = useState(null);
    const [editingNodeLabel, setEditingNodeLabel] = useState('');

    const handleSaveNodeLabel = (id) => {
        if (editingNodeLabel.trim()) {
            setPlacedComponents(prev => prev.map(comp => 
                comp.id === id ? { ...comp, label: editingNodeLabel.trim() } : comp
            ));
        }
        setEditingNodeId(null);
    };

    // Validation & Error overlays
    const [validationErrors, setValidationErrors] = useState([]);
    const [outageError, setOutageError] = useState(null);

    const canvasRef = useRef(null);
    const animationTimer = useRef(null);
    const retryCountRef = useRef(0);
    
    const speedFactor = speed / 1000;
    const isSimActive = step >= 0;

    // Helper to keep state and ref in sync
    const updatePath = (newPath) => {
        setActivePath(newPath);
        pathRef.current = newPath;
    };

    // Monitor step changes to trigger narration delay
    useEffect(() => {
        if (step === -1) {
            setNarrationStep(-1);
            return;
        }
        if (step === 0) {
            setNarrationStep(0);
            return;
        }
        const delay = 600 * speedFactor;
        const timer = setTimeout(() => {
            setNarrationStep(step);
        }, delay);
        return () => clearTimeout(timer);
    }, [step, speedFactor]);

    // Validation function for microservices architecture
    const checkArchitectureErrors = () => {
        const errors = [];
        const has = (id) => placedComponents.some(c => c.id === id);

        if (!has('gateway')) {
            errors.push({
                nodeId: 'client',
                title: 'No Gateway Ingress',
                msg: 'Missing API Gateway. Client requests are hitting backend services directly, exposing internal APIs.'
            });
        }

        if (!has('order')) {
            errors.push({
                nodeId: 'gateway',
                title: 'No Orchestrator',
                msg: 'Missing Order Service. The cluster lacks an orchestrator to coordinate transactions.'
            });
        } else {
            const others = placedComponents.filter(c => !['client', 'gateway', 'registry', 'order'].includes(c.id));
            if (others.length === 0) {
                errors.push({
                    nodeId: 'order',
                    title: 'No Downstream Services',
                    msg: 'Order Service has no downstream microservices (Payment, Inventory, DB) to call.'
                });
            }
        }

        if (has('gateway') && !has('registry')) {
            errors.push({
                nodeId: 'gateway',
                title: 'No Service Discovery',
                msg: 'Missing Service Registry. Gateway must use hardcoded IP addresses instead of dynamic discovery.'
            });
        }

        return errors;
    };

    // Computes the dynamic hop path
    const getSimulationPath = (components) => {
        const path = ['client'];
        const has = (id) => components.some(c => c.id === id);

        if (has('gateway')) {
            path.push('gateway');
            if (has('registry')) {
                path.push('registry');
                path.push('gateway');
            }
        }

        if (has('order')) {
            path.push('order');
            
            // Find other services and sort horizontally
            const others = components.filter(c => !['client', 'gateway', 'registry', 'order'].includes(c.id));
            const sortedOthers = [...others].sort((a, b) => parseFloat(a.x) - parseFloat(b.x));
            
            sortedOthers.forEach(service => {
                path.push(service.id);
                path.push('order');
            });
        }

        if (has('gateway')) {
            path.push('gateway');
        }
        
        path.push('client');
        return path;
    };

    const handleNextStep = (currentStepIndex, currentPath = pathRef.current) => {
        if (currentStepIndex >= currentPath.length - 1) {
            setStep(currentPath.length - 1);
            
            const visitedNodes = currentPath.slice(0, currentStepIndex + 1);
            const anyFailed = visitedNodes.some(nodeId => {
                const node = placedComponents.find(c => c.id === nodeId);
                return node && node.health === 'offline';
            });

            if (anyFailed || (circuitState === 'OPEN' && visitedNodes.includes('order'))) {
                setMetrics(m => ({ ...m, failed: m.failed + 1 }));
                setHistory(h => [`[CLIENT] Checkout failed. Returned Status 503 Service Unavailable.`, ...h.slice(0, 49)]);
            } else {
                setMetrics(m => ({ ...m, success: m.success + 1 }));
                setHistory(h => [`[CLIENT] Checkout completed successfully. Received Status 201 Created.`, ...h.slice(0, 49)]);
                if (circuitState === 'OPEN' || circuitState === 'HALF-OPEN') {
                    setCircuitState('CLOSED');
                    setHistory(h => [`[CIRCUIT BREAKER] Success response received. Resetting state to CLOSED.`, ...h.slice(0, 49)]);
                }
            }
            return;
        }

        const nextStepIndex = currentStepIndex + 1;
        const src = currentPath[currentStepIndex];
        const dest = currentPath[nextStepIndex];

        // Trigger packet travel animation
        setStep(currentStepIndex);

        // Wait for the packet to actually arrive at the target node, then evaluate status
        const arrivalDelay = 600 * speedFactor;
        animationTimer.current = setTimeout(() => {
            const destNode = placedComponents.find(c => c.id === dest);
            const isOffline = destNode && destNode.health === 'offline';

            if (dest === 'payment') {
                if (circuitState === 'OPEN') {
                    setHistory(h => [`[CIRCUIT BREAKER] Outbound Payment call blocked immediately (State is OPEN). Fast-Fail.`, ...h.slice(0, 49)]);
                    
                    setOutageError({
                        nodeId: 'order',
                        title: 'Circuit Blocked',
                        msg: 'Payment call blocked (Circuit is OPEN). Click Continue to route response.'
                    });

                    const returnHops = ['order'];
                    if (placedComponents.some(c => c.id === 'gateway')) {
                        returnHops.push('gateway');
                    }
                    returnHops.push('client');
                    
                    const newPath = [...currentPath.slice(0, currentStepIndex + 1), ...returnHops];
                    updatePath(newPath);
                    setStep(currentStepIndex);
                    return;
                }

                if (isOffline) {
                    retryCountRef.current += 1;
                    setMetrics(m => ({ ...m, retries: m.retries + 1 }));
                    
                    if (circuitState === 'HALF-OPEN') {
                        setCircuitState('OPEN');
                        setHistory(h => [`[CIRCUIT BREAKER] Test call failed in HALF-OPEN state. Tripping breaker back to OPEN!`, ...h.slice(0, 49)]);
                        
                        setOutageError({
                            nodeId: 'payment',
                            title: 'Breaker Tripped',
                            msg: 'Test call failed in HALF-OPEN state. Circuit tripped to OPEN. Click Continue.'
                        });

                        const returnHops = ['order'];
                        if (placedComponents.some(c => c.id === 'gateway')) {
                            returnHops.push('gateway');
                        }
                        returnHops.push('client');
                        
                        const newPath = [...currentPath.slice(0, currentStepIndex + 1), ...returnHops];
                        updatePath(newPath);
                        setStep(currentStepIndex + 1);
                    } else {
                        setHistory(h => [`[PAYMENT] Call timed out (Offline). Retry attempt #${retryCountRef.current} of 3...`, ...h.slice(0, 49)]);
                        
                        if (retryCountRef.current >= 3) {
                            setCircuitState('OPEN');
                            setHistory(h => [`[CIRCUIT BREAKER] 3 consecutive timeouts. Tripping Circuit Breaker to OPEN!`, ...h.slice(0, 49)]);
                            
                            setOutageError({
                                nodeId: 'payment',
                                title: 'Breaker Tripped',
                                msg: '3 timeouts occurred. Circuit state tripped to OPEN. Click Continue.'
                            });

                            const returnHops = ['order'];
                            if (placedComponents.some(c => c.id === 'gateway')) {
                                returnHops.push('gateway');
                            }
                            returnHops.push('client');
                            
                            const newPath = [...currentPath.slice(0, currentStepIndex + 1), ...returnHops];
                            updatePath(newPath);
                            setStep(currentStepIndex + 1);
                        } else {
                            // Visual retry loop: order -> payment
                            const newPath = [...currentPath.slice(0, currentStepIndex + 1), 'order', 'payment', ...currentPath.slice(currentStepIndex + 1)];
                            updatePath(newPath);
                            const stepDelay = 1000 * speedFactor;
                            animationTimer.current = setTimeout(() => {
                                handleNextStep(currentStepIndex + 1, newPath);
                            }, stepDelay);
                        }
                    }
                    return;
                } else {
                    setHistory(h => [`[PAYMENT] Credit card charged. Transaction authorized.`, ...h.slice(0, 49)]);
                }
            } 
            
            else if (isOffline) {
                setHistory(h => [`[${dest.toUpperCase()}] Service is offline. Transaction aborted.`, ...h.slice(0, 49)]);
                
                setOutageError({
                    nodeId: dest,
                    title: 'Service Outage',
                    msg: `${destNode.label} is offline. Request failed. Click Continue to route failure path.`
                });

                const returnHops = [];
                if (currentPath.includes('order') && currentStepIndex >= currentPath.indexOf('order')) {
                    returnHops.push('order');
                }
                if (placedComponents.some(c => c.id === 'gateway')) {
                    returnHops.push('gateway');
                }
                returnHops.push('client');
                
                const newPath = [...currentPath.slice(0, currentStepIndex + 1), ...returnHops];
                updatePath(newPath);
                setStep(currentStepIndex + 1);
                return;
            } 
            
            else {
                // Log standard healthy step
                if (src === 'client' && dest === 'gateway') {
                    setHistory(h => [`[CLIENT] Initiating checkout: POST /orders sent to API Gateway.`, ...h.slice(0, 49)]);
                } else if (src === 'gateway' && dest === 'registry') {
                    setHistory(h => [`[GATEWAY] Querying Service Registry to discover IP for "order-service".`, ...h.slice(0, 49)]);
                } else if (src === 'registry' && dest === 'gateway') {
                    setHistory(h => [`[REGISTRY] Resolved "order-service" dynamically to 10.0.1.55.`, ...h.slice(0, 49)]);
                } else if (src === 'gateway' && dest === 'order') {
                    setHistory(h => [`[GATEWAY] Proxying request payload to Order Service orchestrator.`, ...h.slice(0, 49)]);
                } else if (src === 'order' && dest === 'inventory') {
                    setHistory(h => [`[ORDER] Calling Inventory Service to reserve stock balances.`, ...h.slice(0, 49)]);
                } else if (src === 'inventory' && dest === 'order') {
                    setHistory(h => [`[INVENTORY] Catalog stock allocated successfully.`, ...h.slice(0, 49)]);
                } else if (src === 'order' && dest === 'database') {
                    setHistory(h => [`[ORDER] Writing order persistence record to disk SQL database.`, ...h.slice(0, 49)]);
                } else if (src === 'database' && dest === 'order') {
                    setHistory(h => [`[DATABASE] Database transaction committed. Record saved.`, ...h.slice(0, 49)]);
                } else if (src === 'order' && dest === 'notification') {
                    setHistory(h => [`[ORDER] Triggering Notification Service to send checkout receipt.`, ...h.slice(0, 49)]);
                } else if (src === 'notification' && dest === 'order') {
                    setHistory(h => [`[NOTIFICATION] Email customer notification dispatched.`, ...h.slice(0, 49)]);
                } else if (destNode && destNode.id.startsWith('custom')) {
                    setHistory(h => [`[ORDER] Invoking custom dependency: ${destNode.label}.`, ...h.slice(0, 49)]);
                } else if (src && src.startsWith('custom') && dest === 'order') {
                    setHistory(h => [`[${src.toUpperCase()}] Response returned to Order Service orchestrator.`, ...h.slice(0, 49)]);
                }
            }

            const stepDelay = 1000 * speedFactor;
            animationTimer.current = setTimeout(() => {
                handleNextStep(nextStepIndex, currentPath);
            }, stepDelay);

        }, arrivalDelay);
    };

    const handleContinueSimulation = () => {
        setOutageError(null);
        const delay = 1000 * speedFactor;
        animationTimer.current = setTimeout(() => {
            handleNextStep(step + 1, pathRef.current);
        }, delay);
    };

    const handlePlaceOrder = () => {
        if (animationTimer.current) clearTimeout(animationTimer.current);
        retryCountRef.current = 0;
        setOutageError(null);

        const errors = checkArchitectureErrors();
        setValidationErrors(errors);

        if (errors.some(e => e.title === 'No Orchestrator')) {
            setHistory(['[VALIDATOR] Blocked: Order Service orchestrator is required to run the simulation.']);
            return;
        }

        const path = getSimulationPath(placedComponents);
        updatePath(path);
        setStep(0);
        setHistory(['[CLIENT] Initiating checkout. Request trace started.']);

        animationTimer.current = setTimeout(() => {
            handleNextStep(0, path);
        }, 1000 * speedFactor);
    };

    const handleReset = () => {
        if (animationTimer.current) clearTimeout(animationTimer.current);
        setStep(-1);
        setNarrationStep(-1);
        setValidationErrors([]);
        setOutageError(null);
        retryCountRef.current = 0;
        setHistory(['Simulation reset. Ready for Place Order request.']);
    };

    // Toggle node health status
    const toggleNodeHealth = (id) => {
        setPlacedComponents(prev => prev.map(comp => {
            if (comp.id === id) {
                const nextHealth = comp.health === 'healthy' ? 'offline' : 'healthy';
                // Trigger circuit transitions on payment health change
                if (id === 'payment') {
                    if (nextHealth === 'healthy' && circuitState === 'OPEN') {
                        setCircuitState('HALF-OPEN');
                        setHistory(h => [`[SYSTEM] Payment Service restored. Circuit placed in HALF-OPEN (testing next call).`, ...h.slice(0, 49)]);
                    }
                }
                return { ...comp, health: nextHealth };
            }
            return comp;
        }));
    };

    // Drag-and-drop mechanics
    const handleDragStart = (id, e) => {
        if (isSimActive) return;
        setDraggingId(id);
        const comp = placedComponents.find(c => c.id === id);
        if (comp) {
            setDragStartCoords({ id, x: comp.x, y: comp.y });
        }
    };

    const handleMouseMove = (e) => {
        if (!draggingId || isSimActive) return;
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
        if (!draggingId || isSimActive) return;
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

    // Add predefined services from toolbox
    const addPredefinedService = (id) => {
        if (placedComponents.some(c => c.id === id)) return;
        
        const defaultPositions = {
            gateway: { x: '25%', y: '50%' },
            registry: { x: '45%', y: '20%' },
            order: { x: '48%', y: '50%' },
            payment: { x: '75%', y: '25%' },
            inventory: { x: '75%', y: '50%' },
            database: { x: '75%', y: '75%' },
            notification: { x: '92%', y: '50%' }
        };

        const serviceDefs = {
            gateway: { label: 'API Gateway', color: '#ebdef0', desc: 'Edge ingress entrypoint. Directs traffic and sanitizes headers.' },
            registry: { label: 'Service Registry', color: '#ebf5fb', desc: 'Service discovery IP registry map.' },
            order: { label: 'Order Service', color: '#e8f8f5', desc: 'Coordinates transaction steps and persists orders.' },
            payment: { label: 'Payment Service', color: '#fdedec', desc: 'Charges client cards and validates balances.' },
            inventory: { label: 'Inventory Service', color: '#eaf2f8', desc: 'Deducts database stock balances.' },
            database: { label: 'Database Service', color: '#fef9e7', desc: 'Relational or Document store for order persistence.' },
            notification: { label: 'Notification Service', color: '#fdf2e9', desc: 'Sends email/SMS receipts to clients.' }
        };

        const pos = defaultPositions[id] || { x: '50%', y: '50%' };
        const def = serviceDefs[id];

        setPlacedComponents(prev => [...prev, {
            id,
            label: def.label,
            color: def.color,
            activeColor: 'var(--yellow)',
            desc: def.desc,
            x: pos.x,
            y: pos.y,
            health: 'healthy'
        }]);

        setValidationErrors([]);
        handleReset();
    };

    const removeComponent = (id) => {
        if (id === 'client' || id === 'order') return; // Core essential nodes
        setPlacedComponents(prev => prev.filter(c => c.id !== id));
        setValidationErrors([]);
        handleReset();
    };

    const handleCreateCustomService = () => {
        if (!customLabel.trim()) return;
        const id = `custom-${Date.now()}`;
        const newService = {
            id,
            label: customLabel.trim(),
            color: customColor,
            activeColor: 'var(--yellow)',
            desc: customDesc.trim() || 'Custom microservice dependency.',
            x: '50%',
            y: '50%',
            health: 'healthy'
        };
        setPlacedComponents(prev => [...prev, newService]);
        setCustomLabel('');
        setCustomDesc('');
        setValidationErrors([]);
        handleReset();
    };

    const getPacketLabel = () => {
        if (step < 0 || step >= activePath.length) return '';
        const src = activePath[step];
        const dest = step + 1 < activePath.length ? activePath[step + 1] : 'client';
        
        if (src === 'client' && dest === 'gateway') return 'POST /orders';
        if (src === 'gateway' && dest === 'registry') return 'LOOKUP: order_service';
        if (src === 'registry' && dest === 'gateway') return 'RESOLVED: order_service';
        if (src === 'gateway' && dest === 'order') return 'ROUTE: order_service';
        if (src === 'order' && dest === 'payment') return 'RPC: charge_cc ($150)';
        if (src === 'payment' && dest === 'order') {
            const pNode = placedComponents.find(c => c.id === 'payment');
            return (pNode && pNode.health === 'offline') ? 'Failed / Timeout' : '200 OK (Captured)';
        }
        if (src === 'order' && dest === 'inventory') return 'RPC: deduct_stock';
        if (src === 'inventory' && dest === 'order') {
            const iNode = placedComponents.find(c => c.id === 'inventory');
            return (iNode && iNode.health === 'offline') ? 'Failed' : '200 OK (Reserved)';
        }
        if (src === 'order' && dest === 'database') return 'SQL: INSERT_ORDER';
        if (src === 'database' && dest === 'order') {
            const dNode = placedComponents.find(c => c.id === 'database');
            return (dNode && dNode.health === 'offline') ? 'Failed' : 'Success';
        }
        if (src === 'order' && dest === 'notification') return 'gRPC: send_email';
        if (src === 'notification' && dest === 'order') {
            const nNode = placedComponents.find(c => c.id === 'notification');
            return (nNode && nNode.health === 'offline') ? 'Failed' : 'Sent';
        }
        if (dest === 'client') {
            const visited = activePath.slice(0, step + 1);
            const anyOffline = visited.some(nodeId => {
                const node = placedComponents.find(c => c.id === nodeId);
                return node && node.health === 'offline';
            });
            return (anyOffline || circuitState === 'OPEN') ? '503 SERVICE UNAVAILABLE' : '201 CREATED';
        }
        return `RPC: ${src} -> ${dest}`;
    };

    const getPacketCoords = () => {
        if (step < 0 || step >= activePath.length) return null;
        
        const srcId = activePath[step];
        const destId = step + 1 < activePath.length ? activePath[step + 1] : activePath[step];
        
        const srcNode = placedComponents.find(c => c.id === srcId);
        const destNode = placedComponents.find(c => c.id === destId);
        
        return {
            srcX: srcNode ? srcNode.x : '50%',
            srcY: srcNode ? srcNode.y : '50%',
            destX: destNode ? destNode.x : '50%',
            destY: destNode ? destNode.y : '50%'
        };
    };

    const getStaticWires = () => {
        const wires = [];
        const has = (id) => placedComponents.some(c => c.id === id);
        const getCoords = (id) => {
            const c = placedComponents.find(node => node.id === id);
            return c ? { x: c.x, y: c.y } : null;
        };

        const clientC = getCoords('client');
        const gatewayC = getCoords('gateway');
        const registryC = getCoords('registry');
        const orderC = getCoords('order');

        if (!clientC) return wires;

        if (gatewayC) {
            wires.push({ from: clientC, to: gatewayC, dash: false });
            if (registryC) {
                wires.push({ from: gatewayC, to: registryC, dash: true });
            }
        } else if (orderC) {
            wires.push({ from: clientC, to: orderC, dash: false });
        }

        if (gatewayC && orderC) {
            wires.push({ from: gatewayC, to: orderC, dash: false });
        }

        if (orderC) {
            placedComponents.forEach(node => {
                if (!['client', 'gateway', 'registry', 'order'].includes(node.id)) {
                    wires.push({ from: orderC, to: { x: node.x, y: node.y }, dash: false });
                }
            });
        }

        return wires;
    };

    const getConceptExplanation = () => {
        const concepts = [];
        if (step >= 0 && step < activePath.length) {
            const nodeId = activePath[step];
            const node = placedComponents.find(c => c.id === nodeId);
            if (nodeId === 'gateway') {
                concepts.push({
                    title: "API Gateway Edge routing",
                    operation: "Request Ingress",
                    color: "var(--yellow)",
                    metrics: [
                        { label: "IP Lookup", value: "Gateway" },
                        { label: "Protocol", value: "HTTP/2 REST" }
                    ],
                    why: "A single client shouldn't manage separate addresses for dozens of services. The API Gateway acts as a central proxy to route and authorize requests.",
                    impact: "Provides clean entry routing and centralizes SSL termination, CORS policies, and rate limits."
                });
            } else if (nodeId === 'registry') {
                concepts.push({
                    title: "Service Discovery Lookup",
                    operation: "Registry Search",
                    color: "var(--cyan)",
                    metrics: [
                        { label: "Query Key", value: "order-service" },
                        { label: "Resolved IP", value: "10.0.4.12" }
                    ],
                    why: "Since containers scale up and down dynamically, static IPs fail. Services register themselves dynamically with a registry database.",
                    impact: "Enables dynamic load-balanced routing to service nodes without manual configs."
                });
            } else if (nodeId === 'order') {
                concepts.push({
                    title: "Distributed Coordination",
                    operation: "Workflow Processing",
                    color: "#baffc9",
                    metrics: [
                        { label: "Workflow", value: "Orchestration" },
                        { label: "State", value: "Processing Order" }
                    ],
                    why: "The Order service acts as the orchestrator, coordinating RPC calls to payment and inventory services to validate purchases.",
                    impact: "Maintains transactional consistency across distributed boundaries."
                });
            } else if (nodeId === 'payment') {
                concepts.push({
                    title: "Circuit Breaker Protection",
                    operation: circuitState,
                    color: "#ffb3ba",
                    metrics: [
                        { label: "State", value: circuitState },
                        { label: "Failures", value: `${retryCountRef.current}/3` }
                    ],
                    why: "Downstream outages can consume threads and cause cascading crashes. Circuit breakers isolate failures and fail-fast.",
                    impact: "Fails open instantly in unhealthy states to avoid resource starvation."
                });
            } else if (nodeId === 'inventory') {
                concepts.push({
                    title: "Inventory Allocation",
                    operation: "Stock Reservation",
                    color: "#bae1ff",
                    metrics: [
                        { label: "Operation", value: "Stock Decrement" },
                        { label: "Status", value: "Reserved" }
                    ],
                    why: "Fulfilling purchases requires stock allocation updates to sync virtual store listings with physical warehouse levels.",
                    impact: "Prevents duplicate stock sales and locks items during purchase completion."
                });
            } else if (nodeId === 'database') {
                concepts.push({
                    title: "Database Persistence",
                    operation: "Write Commit",
                    color: "var(--yellow)",
                    metrics: [
                        { label: "Database", value: "SQL / NoSQL" },
                        { label: "Status", value: "Committed" }
                    ],
                    why: "Once transactions are approved and stock is reserved, orders must be saved permanently to database disk memory.",
                    impact: "Ensures durability of order history and transaction logs."
                });
            } else if (nodeId === 'notification') {
                concepts.push({
                    title: "Notification Dispatch",
                    operation: "Async Alert",
                    color: "var(--pink)",
                    metrics: [
                        { label: "Channel", value: "Email/SMS" },
                        { label: "Status", value: "Sent" }
                    ],
                    why: "Sending confirmation emails is slow and shouldn't block the checkout thread. Notifications are sent asynchronously or after purchase.",
                    impact: "Maintains high throughput for the checkout endpoint."
                });
            } else if (node) {
                concepts.push({
                    title: node.label,
                    operation: "RPC Dependency Call",
                    color: "var(--purple)",
                    metrics: [
                        { label: "Service Name", value: node.label },
                        { label: "Status", value: node.health === 'offline' ? 'Failed' : 'Success' }
                    ],
                    why: "Custom components represent user-defined business logic or third-party integrations in the service catalog.",
                    impact: "Enables flexible modular extensions to core order checkout flows."
                });
            }
        }

        if (concepts.length === 0) {
            concepts.push({
                title: "Awaiting Order Trigger",
                operation: "Ready",
                color: "#6c7086",
                metrics: [
                    { label: "Status", value: "Idle" },
                    { label: "Breaker State", value: circuitState }
                ],
                why: "No checkout simulation is currently active.",
                impact: "Select healthy/offline states in the panel, then click START to trace the dynamic workflow."
            });
        }
        return concepts;
    };

    const getSpeechBubbleData = (nodeId) => {
        const node = placedComponents.find(c => c.id === nodeId);
        const isOffline = node && node.health === 'offline';
        
        switch (nodeId) {
            case 'gateway':
                return {
                    title: 'API Gateway Ingress',
                    desc: isOffline 
                        ? 'API Gateway is offline. Incoming connection request failed at edge ingress (502 Bad Gateway).'
                        : 'Client request enters the API Gateway. The gateway validates signatures and checks rate limits.'
                };
            case 'registry':
                return {
                    title: 'Service Discovery Lookup',
                    desc: isOffline
                        ? 'Service Registry is offline. The gateway failed to resolve the address for "order-service" (500 Discovery Failure).'
                        : 'API Gateway queries Consul/Eureka to find a healthy Order Service IP address.'
                };
            case 'order':
                return {
                    title: 'Orchestrator Routing',
                    desc: isOffline
                        ? 'Order Service is offline. The entrypoint request cannot be coordinated or processed (504 Service Timeout).'
                        : 'The request is routed to the Order Service orchestrator, which coordinates calls to downstream dependencies.'
                };
            case 'payment':
                if (circuitState === 'OPEN') {
                    return {
                        title: 'Circuit Breaker Blocked',
                        desc: 'Outbound request to Payment Service was blocked instantly by the Circuit Breaker (Fast-Fail protection).'
                    };
                }
                return {
                    title: 'Payment Processing',
                    desc: isOffline
                        ? `Payment Service call failed. Initiating retry attempt #${retryCountRef.current} to capture user balance.`
                        : 'The Credit Card transaction is captured successfully. Funds are reserved.'
                };
            case 'inventory':
                return {
                    title: 'Inventory Allocation',
                    desc: isOffline
                        ? 'Inventory Service failed. Failed to reserve catalog stock. Initiating transaction rollback.'
                        : 'The stock count is successfully decremented in the inventory catalog.'
                };
            case 'database':
                return {
                    title: 'Database Persistence',
                    desc: isOffline
                        ? 'Database is offline. Failed to write order details to disk. Transaction aborted.'
                        : 'The order record is written and committed to SQL databases.'
                };
            case 'notification':
                return {
                    title: 'Notification Dispatch',
                    desc: isOffline
                        ? 'Notification Service offline. Failed to send email receipt (Non-blocking warning).'
                        : 'An email checkout receipt is dispatched asynchronously to the customer.'
                };
            default:
                if (node) {
                    return {
                        title: node.label,
                        desc: isOffline
                            ? `Custom Service ${node.label} is offline. The dependency call failed.`
                            : `Custom Service ${node.label} was called successfully. Description: ${node.desc}`
                    };
                }
                return null;
        }
    };

    return (
        <ImmersiveLayout
            isActive={true}
            title="Microservices Discovery & Fault Tolerance"
            icon={<NetworkIcon size={20} />}
            moduleLabel="System Design"
            isRunning={isSimActive && step < activePath.length - 1}
            isPaused={false}
            isFinished={step >= 0 && step === activePath.length - 1}
            speed={speed}
            onSpeedChange={setSpeed}
            onStart={handlePlaceOrder}
            onPause={() => {}}
            onResume={() => {}}
            onReset={handleReset}
            onStep={() => {
                if (step === -1 || step === activePath.length - 1) {
                    handlePlaceOrder();
                } else {
                    if (animationTimer.current) clearTimeout(animationTimer.current);
                    handleNextStep(step + 1);
                }
            }}
            currentStepNum={step >= 0 ? step + 1 : 0}
            totalSteps={activePath.length}
            phaseName={step >= 0 ? `Stage: ${activePath[step].toUpperCase()}` : "Idle"}
            hideFooter={true}
            leftContent={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    
                    {/* Mode Selector */}
                    <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                        <div className="panel-header" style={{ background: 'var(--yellow)', padding: '4px 8px', fontSize: '0.72rem' }}>
                            Sandbox Mode
                        </div>
                        <div style={{ padding: '0.6rem', background: '#fff', display: 'flex', gap: '0.4rem' }}>
                            <button
                                onClick={() => {
                                    setMode('trace');
                                    handleReset();
                                    setPlacedComponents(defaultNodes);
                                }}
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
                                disabled={isSimActive}
                            >
                                Live Tracer
                            </button>
                            <button
                                onClick={() => {
                                    setMode('build');
                                    handleReset();
                                }}
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
                                disabled={isSimActive}
                            >
                                Architecture Builder
                            </button>
                        </div>
                    </div>

                    {/* Builder Toolbox */}
                    {mode === 'build' && (
                        <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                            <div className="panel-header" style={{ background: 'var(--cyan)', padding: '4px 8px', fontSize: '0.72rem' }}>
                                Component Toolbox
                            </div>
                            <div style={{ padding: '0.6rem', background: '#fff', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.68rem' }}>
                                <div style={{ fontSize: '0.58rem', opacity: 0.7, fontWeight: 'bold' }}>
                                    ADD PREDEFINED SERVICE:
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '130px', overflowY: 'auto', border: '1.5px solid var(--border)', padding: '4px', borderRadius: '4px' }}>
                                    {['gateway', 'registry', 'order', 'payment', 'inventory', 'database', 'notification'].map(sId => {
                                        const isPlaced = placedComponents.some(pc => pc.id === sId);
                                        const label = sId === 'gateway' ? 'API Gateway'
                                                    : sId === 'registry' ? 'Service Registry'
                                                    : sId === 'order' ? 'Order Service'
                                                    : sId === 'payment' ? 'Payment Service'
                                                    : sId === 'inventory' ? 'Inventory Service'
                                                    : sId === 'database' ? 'Database Service'
                                                    : 'Notification Service';
                                        return (
                                            <div key={sId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa', padding: '3px 6px', borderRadius: '4px', border: '1px solid #ddd' }}>
                                                <span style={{ fontWeight: 'bold', fontSize: '0.62rem' }}>{label}</span>
                                                <button
                                                    onClick={() => {
                                                        if (isPlaced) {
                                                            removeComponent(sId);
                                                        } else {
                                                            addPredefinedService(sId);
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '1px 5px',
                                                        fontSize: '0.58rem',
                                                        fontWeight: 'bold',
                                                        background: isPlaced ? '#fff0f0' : 'var(--green)',
                                                        color: isPlaced ? '#ff3333' : '#000',
                                                        border: '1.5px solid var(--border)',
                                                        borderRadius: '3px',
                                                        cursor: isSimActive ? 'not-allowed' : 'pointer'
                                                    }}
                                                    disabled={isSimActive}
                                                >
                                                    {isPlaced ? 'Remove' : '+ Add'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Custom Service Spawner */}
                    {mode === 'build' && (
                        <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                            <div className="panel-header" style={{ background: 'var(--yellow)', padding: '4px 8px', fontSize: '0.72rem' }}>
                                Create Custom Service
                            </div>
                            <div style={{ padding: '0.6rem', background: '#fff', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.68rem' }}>
                                <div>
                                    <label className="form-label" style={{ fontSize: '0.62rem' }}>Service Name</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={customLabel} 
                                        onChange={e => setCustomLabel(e.target.value)} 
                                        placeholder="e.g. Auth Service"
                                        style={{ fontSize: '0.65rem', padding: '3px 6px' }}
                                        disabled={isSimActive}
                                    />
                                </div>
                                <div>
                                    <label className="form-label" style={{ fontSize: '0.62rem' }}>Color Theme</label>
                                    <select 
                                        className="form-select" 
                                        value={customColor} 
                                        onChange={e => setCustomColor(e.target.value)}
                                        style={{ fontSize: '0.65rem', padding: '3px' }}
                                        disabled={isSimActive}
                                    >
                                        <option value="#fdedec">Pastel Red</option>
                                        <option value="#eaf2f8">Pastel Blue</option>
                                        <option value="#e8f8f5">Pastel Teal</option>
                                        <option value="#fef9e7">Pastel Yellow</option>
                                        <option value="#fdf2e9">Pastel Orange</option>
                                        <option value="#ebdef0">Pastel Purple</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label" style={{ fontSize: '0.62rem' }}>Description</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={customDesc} 
                                        onChange={e => setCustomDesc(e.target.value)} 
                                        placeholder="e.g. Verifies OAuth credentials"
                                        style={{ fontSize: '0.65rem', padding: '3px 6px' }}
                                        disabled={isSimActive}
                                    />
                                </div>
                                <button 
                                    className="btn btn-sm btn-yellow"
                                    onClick={handleCreateCustomService}
                                    disabled={isSimActive || !customLabel.trim()}
                                    style={{ fontSize: '0.65rem', padding: '4px' }}
                                >
                                    + Create Service
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Resiliency Controls (Fault Injection) */}
                    <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                        <div className="panel-header" style={{ background: 'var(--pink)', padding: '4px 8px', fontSize: '0.72rem' }}>
                            Fault Injection Panel
                        </div>
                        <div style={{ padding: '0.6rem', background: '#fff', fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '150px', overflowY: 'auto' }} className="no-scrollbar">
                                {placedComponents.filter(c => c.id !== 'client').map(comp => (
                                    <div key={comp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa', padding: '4px 6px', border: '1px solid #ddd', borderRadius: '4px' }}>
                                        <span style={{ fontWeight: 'bold', fontSize: '0.62rem' }}>{comp.label}</span>
                                        <button
                                            onClick={() => toggleNodeHealth(comp.id)}
                                            style={{
                                                padding: '2px 6px',
                                                fontSize: '0.58rem',
                                                fontWeight: 'bold',
                                                background: comp.health === 'healthy' ? '#fff0f0' : 'var(--green)',
                                                color: comp.health === 'healthy' ? '#ff3333' : '#000',
                                                border: '1.5px solid var(--border)',
                                                borderRadius: '3px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {comp.health === 'healthy' ? 'FAIL' : 'RESTORE'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                            
                            <div style={{ borderTop: '1px dashed #ddd', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '0.6rem', color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
                                    Circuit Breaker State:
                                </span>
                                <div style={{ 
                                    padding: '4px', 
                                    textAlign: 'center', 
                                    fontWeight: 'bold',
                                    background: circuitState === 'CLOSED' ? '#e1f5fe' : circuitState === 'OPEN' ? '#fff0f0' : '#fff9c4',
                                    color: circuitState === 'CLOSED' ? '#0288d1' : circuitState === 'OPEN' ? '#d32f2f' : '#f57f17',
                                    borderRadius: '4px', 
                                    fontSize: '0.68rem',
                                    border: '1.5px solid var(--border)',
                                    boxShadow: '1px 1px 0 var(--border)'
                                }}>
                                    {circuitState}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Workflow Metrics */}
                    <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                        <div className="panel-header" style={{ background: 'var(--green)', padding: '4px 8px', fontSize: '0.72rem' }}>
                            Workflow Metrics
                        </div>
                        <div style={{ padding: '0.6rem', background: '#fff', fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Successful Checkouts:</span>
                                <strong style={{ fontFamily: 'var(--font-mono)' }}>{metrics.success}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: metrics.failed > 0 ? '#ff3333' : 'inherit' }}>
                                <span>Failed Checkouts:</span>
                                <strong style={{ fontFamily: 'var(--font-mono)' }}>{metrics.failed}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Circuit Retries:</span>
                                <strong style={{ fontFamily: 'var(--font-mono)' }}>{metrics.retries}</strong>
                            </div>
                        </div>
                    </div>

                </div>
            }
            centerContent={
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--white)', padding: '1rem', position: 'relative', overflow: 'hidden' }}>
                    
                    {/* Visual Topology Map */}
                    <div 
                        ref={canvasRef}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleMouseUp}
                        style={{ 
                            flex: 1, 
                            position: 'relative', 
                            minHeight: '400px',
                            background: '#ffffff radial-gradient(circle, rgba(0, 0, 0, 0.08) 1.5px, transparent 1.5px)',
                            backgroundSize: '20px 20px',
                            borderRadius: '8px',
                            border: '3px solid var(--border)',
                            boxShadow: 'var(--shadow)',
                            overflow: 'hidden',
                            cursor: draggingId ? 'grabbing' : 'default',
                            userSelect: 'none'
                        }}
                    >
                        
                        {/* Static Wires Mesh */}
                        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                            {getStaticWires().map((wire, idx) => (
                                <line 
                                    key={`static-wire-${idx}`}
                                    x1={wire.from.x} y1={wire.from.y} x2={wire.to.x} y2={wire.to.y} 
                                    stroke="rgba(0,0,0,0.15)" 
                                    strokeWidth="2" 
                                    strokeDasharray={wire.dash ? "4 4" : "none"} 
                                    style={{ transition: 'all 0.1s ease' }} 
                                />
                            ))}

                            {/* Active Traversing Line Highlight */}
                            {step >= 0 && step < activePath.length - 1 && (() => {
                                const coords = getPacketCoords();
                                if (!coords) return null;
                                const isDestOffline = (() => {
                                    const nextDest = activePath[step + 1];
                                    const destNode = placedComponents.find(c => c.id === nextDest);
                                    return destNode && destNode.health === 'offline';
                                })();
                                const strokeColor = (isDestOffline && activePath[step + 1] === 'payment' && circuitState === 'OPEN') ? 'rgba(0, 0, 0, 0.15)' 
                                                  : isDestOffline ? '#ff3355' : '#1e1e2e';
                                return (
                                    <line 
                                        x1={coords.srcX} y1={coords.srcY} x2={coords.destX} y2={coords.destY} 
                                        stroke={strokeColor} 
                                        strokeWidth="4.5"
                                        strokeLinecap="round"
                                        style={{ transition: 'all 0.1s ease' }} 
                                    />
                                );
                            })()}
                        </svg>

                        {/* Nodes */}
                        {placedComponents.map(node => {
                            const isNodeActive = step >= 0 && activePath[step] === node.id;
                            const isOffline = node.health === 'offline';
                            
                            // Render inline SVG icons based on node types
                            const renderNodeIcon = () => {
                                const size = 16;
                                if (node.id === 'client') {
                                    return (
                                        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                            <rect x="2" y="3" width="20" height="14" rx="2" />
                                            <line x1="8" y1="21" x2="16" y2="21" />
                                            <line x1="12" y1="17" x2="12" y2="21" />
                                        </svg>
                                    );
                                }
                                if (node.id === 'gateway') {
                                    return (
                                        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                            <rect x="4" y="4" width="16" height="16" rx="2" />
                                            <line x1="9" y1="9" x2="9" y2="15" />
                                            <line x1="9" y1="12" x2="15" y2="12" />
                                            <line x1="15" y1="9" x2="15" y2="15" />
                                        </svg>
                                    );
                                }
                                if (node.id === 'registry') {
                                    return (
                                        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                            <circle cx="11" cy="11" r="8" />
                                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                        </svg>
                                    );
                                }
                                if (node.id === 'order') {
                                    return (
                                        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                        </svg>
                                    );
                                }
                                if (node.id === 'payment') {
                                    return (
                                        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                            <rect x="2" y="5" width="20" height="14" rx="2" />
                                            <line x1="2" y1="10" x2="22" y2="10" />
                                        </svg>
                                    );
                                }
                                if (node.id === 'inventory') {
                                    return (
                                        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                                            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                                        </svg>
                                    );
                                }
                                if (node.id === 'database') {
                                    return (
                                        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                            <ellipse cx="12" cy="5" rx="9" ry="3" />
                                            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                                            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                                        </svg>
                                    );
                                }
                                if (node.id === 'notification') {
                                    return (
                                        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                                        </svg>
                                    );
                                }
                                return (
                                    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
                                        <path d="M12 8V16" />
                                        <path d="M8 12H16" />
                                    </svg>
                                );
                            };

                            return (
                                <div
                                    key={node.id}
                                    onMouseDown={(e) => handleDragStart(node.id, e)}
                                    onTouchStart={(e) => handleDragStart(node.id, e)}
                                    style={{
                                        position: 'absolute',
                                        left: node.x,
                                        top: node.y,
                                        transform: 'translate(-50%, -50%)',
                                        border: isNodeActive ? `2.5px solid ${node.activeColor}` 
                                              : isOffline ? '2.5px solid #ff3355' 
                                              : '2.5px solid var(--border)',
                                        background: isOffline ? '#fff8f8' : '#ffffff',
                                        borderRadius: '6px',
                                        boxShadow: isNodeActive ? `0 0 15px ${node.activeColor}55, var(--shadow-sm)` 
                                                  : isOffline ? '3px 3px 0 #ff3355'
                                                  : 'var(--shadow-sm)',
                                        color: isOffline ? '#ff3355' : 'var(--text)',
                                        zIndex: 3,
                                        width: 125,
                                        transition: draggingId === node.id ? 'none' : 'border 0.2s, box-shadow 0.2s, background 0.2s',
                                        textAlign: 'center',
                                        cursor: isSimActive ? 'default' : (draggingId === node.id ? 'grabbing' : 'grab'),
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* Close button for optional nodes */}
                                    {mode === 'build' && node.id !== 'client' && node.id !== 'order' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeComponent(node.id);
                                            }}
                                            style={{
                                                position: 'absolute',
                                                top: '3px',
                                                right: '5px',
                                                background: 'transparent',
                                                border: 'none',
                                                color: isOffline ? '#ff3355' : '#888',
                                                fontSize: '0.62rem',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                zIndex: 10
                                            }}
                                            onMouseEnter={(e) => e.target.style.color = '#ff3355'}
                                            onMouseLeave={(e) => e.target.style.color = isOffline ? '#ff3355' : '#888'}
                                        >
                                            ✕
                                        </button>
                                    )}

                                    {/* Header bar */}
                                    <div style={{
                                        background: isOffline ? '#ffebeb' : node.color,
                                        borderBottom: isOffline ? '2px solid #ff3355' : '2px solid var(--border)',
                                        padding: '4px 6px',
                                        paddingRight: (mode === 'build' && node.id !== 'client' && node.id !== 'order') ? '20px' : '6px',
                                        fontSize: '0.62rem',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px'
                                    }}>
                                        {renderNodeIcon()}
                                        {editingNodeId === node.id ? (
                                            <input
                                                type="text"
                                                value={editingNodeLabel}
                                                onChange={(e) => setEditingNodeLabel(e.target.value)}
                                                onBlur={() => handleSaveNodeLabel(node.id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSaveNodeLabel(node.id);
                                                    if (e.key === 'Escape') setEditingNodeId(null);
                                                }}
                                                autoFocus
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onTouchStart={(e) => e.stopPropagation()}
                                                style={{
                                                    background: '#ffffff',
                                                    border: '1.5px solid var(--border)',
                                                    color: 'var(--text)',
                                                    fontSize: '0.58rem',
                                                    padding: '1px 4px',
                                                    width: '90%',
                                                    fontWeight: 'bold',
                                                    fontFamily: 'var(--font-main)',
                                                    textAlign: 'center'
                                                }}
                                            />
                                        ) : (
                                            <div 
                                                onClick={(e) => {
                                                    if (isSimActive) return;
                                                    e.stopPropagation();
                                                    setEditingNodeId(node.id);
                                                    setEditingNodeLabel(node.label);
                                                }}
                                                title={isSimActive ? "" : "Click to rename"}
                                                style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '3.5px', 
                                                    cursor: isSimActive ? 'default' : 'pointer', 
                                                    overflow: 'hidden', 
                                                    width: '100%',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '85%' }}>
                                                    {node.label}
                                                </span>
                                                {!isSimActive && (
                                                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}>
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Body content */}
                                    <div style={{ padding: '6px' }}>
                                        {node.id === 'payment' && circuitState !== 'CLOSED' && (
                                            <div style={{
                                                fontSize: '0.52rem',
                                                fontWeight: 'bold',
                                                background: circuitState === 'OPEN' ? '#ffebeb' : '#fff9c4',
                                                color: circuitState === 'OPEN' ? '#d32f2f' : '#f57f17',
                                                border: `1px solid ${circuitState === 'OPEN' ? '#d32f2f' : '#f57f17'}`,
                                                borderRadius: '3px',
                                                padding: '1px 2px',
                                                marginBottom: '4px',
                                                textTransform: 'uppercase'
                                            }}>
                                                Breaker: {circuitState}
                                            </div>
                                        )}

                                        {node.id !== 'client' ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleNodeHealth(node.id);
                                                }}
                                                style={{
                                                    padding: '1px 4px',
                                                    fontSize: '0.52rem',
                                                    fontWeight: 'bold',
                                                    background: isOffline ? '#ffebeb' : '#eafaf1',
                                                    color: isOffline ? '#ff3355' : '#2ecc71',
                                                    border: `1px solid ${isOffline ? '#ff3355' : '#2ecc71'}`,
                                                    borderRadius: '3px',
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '2.5px'
                                                }}
                                            >
                                                <span style={{
                                                    width: '5px',
                                                    height: '5px',
                                                    borderRadius: '50%',
                                                    background: isOffline ? '#ff3355' : '#2ecc71',
                                                    display: 'inline-block'
                                                }} />
                                                {isOffline ? 'OFFLINE' : 'HEALTHY'}
                                            </button>
                                        ) : (
                                            <div style={{ fontSize: '0.52rem', color: '#888', fontWeight: 'bold' }}>
                                                VISITOR
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Minimalist Interactive Warning Card */}
                        {outageError && (() => {
                            const node = placedComponents.find(c => c.id === outageError.nodeId);
                            if (!node) return null;
                            const yVal = parseFloat(node.y);
                            const isBottomHalf = yVal > 55;
                            return (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: node.x,
                                        top: node.y,
                                        transform: isBottomHalf ? 'translate(-50%, calc(-100% - 25px))' : 'translate(-50%, 25px)',
                                        zIndex: 40,
                                        width: 200,
                                        background: '#ffffff',
                                        color: '#000000',
                                        border: '3px solid #ff3355',
                                        boxShadow: '4px 4px 0 #ff3355',
                                        padding: '8px 10px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px',
                                        fontFamily: 'var(--font-main), sans-serif',
                                        pointerEvents: 'auto'
                                    }}
                                >
                                    {/* Arrow */}
                                    <div style={{
                                        position: 'absolute',
                                        [isBottomHalf ? 'bottom' : 'top']: '-7px',
                                        left: '50%',
                                        transform: 'translateX(-50%) rotate(45deg)',
                                        width: 10,
                                        height: 10,
                                        background: '#ffffff',
                                        [isBottomHalf ? 'borderRight' : 'borderLeft']: '3px solid #ff3355',
                                        [isBottomHalf ? 'borderBottom' : 'borderTop']: '3px solid #ff3355',
                                    }} />

                                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#ff3355', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {outageError.title}
                                    </div>
                                    <div style={{ fontSize: '0.58rem', color: '#555555', lineHeight: 1.25, fontWeight: 500 }}>
                                        {outageError.msg}
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleContinueSimulation();
                                        }}
                                        style={{
                                            marginTop: '4px',
                                            width: '100%',
                                            padding: '3px',
                                            fontSize: '0.55rem',
                                            fontWeight: 'bold',
                                            background: '#ff3355',
                                            color: '#ffffff',
                                            border: '2px solid #ff3355',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            textTransform: 'uppercase',
                                            boxShadow: '2px 2px 0 #000'
                                        }}
                                    >
                                        Continue
                                    </button>
                                </div>
                            );
                        })()}



                        {/* Animated request flow packet */}
                        {step >= 0 && step < activePath.length && (() => {
                            const label = getPacketLabel();
                            const coords = getPacketCoords();
                            if (!coords || outageError) return null;

                            const isCurrentDestOffline = (() => {
                                const nextDest = activePath[step + 1];
                                const destNode = placedComponents.find(c => c.id === nextDest);
                                return destNode && destNode.health === 'offline';
                            })();

                            const glowColor = isCurrentDestOffline ? 'rgba(255, 51, 85, 0.6)' : 'rgba(30, 30, 46, 0.35)';
                            return (
                                <motion.div
                                    key={`${step}-${retryCountRef.current}-${activePath.length}`}
                                    initial={{
                                        left: coords.srcX,
                                        top: coords.srcY
                                    }}
                                    animate={{
                                        left: coords.destX,
                                        top: coords.destY
                                    }}
                                    transition={{ duration: 0.6 * speedFactor, ease: 'easeInOut' }}
                                    style={{
                                        position: 'absolute',
                                        transform: 'translate(-50%, -50%)',
                                        zIndex: 10,
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        border: '1.5px solid var(--border)',
                                        background: '#1e1e2e',
                                        boxShadow: `0 0 15px ${glowColor}, 3px 3px 0 var(--border)`,
                                        color: '#cdd6f4',
                                        fontFamily: 'var(--font-mono), monospace',
                                        fontSize: '0.55rem',
                                        fontWeight: 'bold',
                                        pointerEvents: 'none',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <span>{label}</span>
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
                        <div style={{ padding: '0.8rem', background: '#fff', maxHeight: '400px', overflowY: 'auto', fontSize: '0.72rem', lineHeight: 1.4 }} className="no-scrollbar">
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
                                            <div style={{
                                                background: concept.color,
                                                padding: '6px 10px',
                                                borderBottom: '2px solid var(--border)',
                                                color: '#000',
                                                fontWeight: 850,
                                                fontSize: '0.65rem',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <span>{concept.title}</span>
                                                <span style={{
                                                    fontSize: '0.52rem',
                                                    background: 'rgba(255,255,255,0.4)',
                                                    padding: '1px 4px',
                                                    borderRadius: '4px',
                                                    border: '1px solid rgba(0,0,0,0.1)',
                                                    fontWeight: 'bold',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {concept.operation}
                                                </span>
                                            </div>

                                            <div style={{ padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#fff' }}>
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

                                    {/* RPC Event Log */}
                                    <div style={{ marginTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', color: '#6c7086', borderBottom: '1px solid var(--border)', paddingBottom: '3px' }}>
                                            Service Event Trace Logs:
                                        </div>
                                        <div className="no-scrollbar" style={{
                                            height: 120, border: '2.5px solid var(--border)', background: '#1e1e2e',
                                            padding: '0.4rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                                            color: '#cdd6f4', overflowY: 'auto', borderRadius: '6px', boxShadow: '2px 2px 0 var(--border)'
                                        }}>
                                            {history.map((log, lIdx) => {
                                                const isErr = log.includes('failed') || log.includes('blocked') || log.includes('timed out') || log.includes('offline') || log.includes('tripped');
                                                const isSuccess = log.includes('success') || log.includes('authorized') || log.includes('completed') || log.includes('allocated');
                                                return (
                                                    <div key={lIdx} style={{
                                                        color: isErr ? '#ff5555' : isSuccess ? '#a6e3a1' : '#cdd6f4',
                                                        marginBottom: '2px'
                                                    }}>
                                                        {log}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {labTab === 'overview' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    <p style={{ fontWeight: 'bold', fontSize: '0.78rem', color: 'var(--cyan)' }}>Microservice System Design</p>
                                    <p style={{ opacity: 0.85 }}>
                                        Microservices scale independent application domains separately. However, separating service domains introduces network hops and failure risks.
                                    </p>
                                    <p style={{ opacity: 0.85 }}>
                                        Essential patterns represented in this simulator:
                                    </p>
                                    <ul style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '4px', opacity: 0.85 }}>
                                        <li><strong>API Gateway Ingress:</strong> Unified proxy routing client requests safely.</li>
                                        <li><strong>Service Registry Discovery:</strong> Dynamically looking up service IP maps at runtime.</li>
                                        <li><strong>Circuit Breaking:</strong> Preventing cascading failures by fast-failing outbound RPC requests to broken dependencies.</li>
                                    </ul>
                                </div>
                            )}
                            
                            {labTab === 'guide' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    <p style={{ fontWeight: 'bold', fontSize: '0.78rem', color: 'var(--yellow)' }}>How to operate this sandbox:</p>
                                    <ol style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '4px', opacity: 0.85 }}>
                                        <li><strong>Standard checkout:</strong> Keep services healthy and click START to observe service discovery and order processing.</li>
                                        <li><strong>Simulate outage:</strong> Click **FAIL** on the Payment Service. Click START. Observe how the Order Service retries the connection 3 times before failing the workflow.</li>
                                        <li><strong>Trip the circuit:</strong> After 3 consecutive timeouts, the Circuit Breaker trips to **OPEN**. Click START again. Observe how the Order Service immediately blocks the call without waiting (Fast-Fail protection).</li>
                                        <li><strong>Recovery:</strong> Click **RESTORE** on the Payment Service. The circuit moves to **HALF-OPEN** testing state. Start a new checkout to see it verify service recovery and reset to **CLOSED**.</li>
                                        <li><strong>Builder:</strong> Switch to **Architecture Builder** to drag and drop nodes, add/remove services, and construct custom system topologies.</li>
                                    </ol>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            }
            legend={[
                { color: '#ebdef0', label: 'Gateway' },
                { color: '#ebf5fb', label: 'Service Registry' },
                { color: '#e8f8f5', label: 'Order Service' },
                { color: '#fdedec', label: 'Payment API' }
            ]}
        />
    );
}
