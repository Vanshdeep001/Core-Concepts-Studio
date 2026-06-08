import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import { ZapIcon, GlobeIcon, DatabaseIcon } from '../../components/Icons';

export default function CacheRedisSim() {
    const [cache, setCache] = useState([
        { key: 'user:1', val: 'Alice', ttl: 15, initialTtl: 15, lastUsed: 1 },
        { key: 'user:2', val: 'Bob', ttl: 20, initialTtl: 20, lastUsed: 2 }
    ]);
    const [db, setDb] = useState([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
        { id: 4, name: 'David' },
        { id: 5, name: 'Eva' }
    ]);

    const cacheLimit = 4;
    const totalSteps = 10; // Cap run at 10 operations
    
    // Floating requests / responses
    // Array<{ id, op, key, val, status: 'client-to-redis' | 'redis-to-client' | 'redis-to-db' | 'db-to-redis' | 'client-to-db', isResponse?: boolean }>
    const [floatingPackets, setFloatingPackets] = useState([]);
    
    // Active request being processed (for UI highlights)
    // stage: 'checking-cache' | 'db-lookup' | 'write-back' | 'done' | 'writing' | 'deleting'
    const [activeRequest, setActiveRequest] = useState(null); 

    // Table rows being highlighted in Database
    const [highlightedDbId, setHighlightedDbId] = useState(null);

    const [metrics, setMetrics] = useState({ hits: 0, misses: 0, expired: 0, evicted: 0 });
    const [history, setHistory] = useState(['Simulator initialized. App connected to Redis.']);

    // Form inputs
    const [formKeyId, setFormKeyId] = useState('3');
    const [formName, setFormName] = useState('Charlie');
    const [formTtl, setFormTtl] = useState(15);

    // Simulation running state
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [speed, setSpeed] = useState(1500);

    const accessCounter = useRef(3); // tracks LRU usage ranks

    // TTL countdown timer (runs every 1 second)
    useEffect(() => {
        const timer = setInterval(() => {
            setCache(prev => {
                const nextCache = [];
                prev.forEach(item => {
                    if (item.ttl > 1) {
                        nextCache.push({ ...item, ttl: item.ttl - 1 });
                    } else {
                        // Key Expired!
                        setMetrics(m => ({ ...m, expired: m.expired + 1 }));
                        setHistory(h => [`[REDIS] Key '${item.key}' EXPIRED (TTL reached 0)`, ...h.slice(0, 49)]);
                    }
                });
                return nextCache;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Perform GET operation step-by-step
    const runGetRequest = (id) => {
        if (activeRequest) return;
        const totalOps = metrics.hits + metrics.misses;
        if (totalOps >= totalSteps) {
            setIsFinished(true);
            return;
        }

        const key = `user:${id}`;
        setActiveRequest({ op: 'GET', key, stage: 'checking-cache' });
        setHistory(h => [`[CLIENT] GET request initiated for '${key}'`, ...h.slice(0, 49)]);

        // 1. Dispatch request packet from Client to Redis
        const packetId = `get-${Date.now()}`;
        const reqPacket = {
            id: packetId,
            op: 'GET',
            key,
            status: 'client-to-redis'
        };
        setFloatingPackets(prev => [...prev, reqPacket]);

        // After travel time (500ms)
        setTimeout(() => {
            setFloatingPackets(prev => prev.map(p => p.id === packetId ? { ...p, status: 'at-redis' } : p));
            
            // Check cache
            let hitItem = null;
            setCache(currCache => {
                const index = currCache.findIndex(c => c.key === key);
                if (index !== -1) {
                    hitItem = currCache[index];
                    accessCounter.current++;
                    const updated = [...currCache];
                    updated[index] = { ...hitItem, lastUsed: accessCounter.current };
                    return updated;
                }
                return currCache;
            });

            // Perform check pause at Redis (800ms)
            setTimeout(() => {
                if (hitItem) {
                    // CACHE HIT!
                    setMetrics(m => ({ ...m, hits: m.hits + 1 }));
                    setHistory(h => [`[REDIS] CACHE HIT! Key '${key}' found in memory: '${hitItem.val}'`, ...h.slice(0, 49)]);
                    
                    // Transition workflow board
                    setActiveRequest({ op: 'GET', key, stage: 'done' });

                    // Return response packet to client
                    setFloatingPackets(prev => prev.map(p => p.id === packetId ? { 
                        ...p, 
                        status: 'redis-to-client', 
                        isResponse: true, 
                        val: hitItem.val 
                    } : p));

                    setTimeout(() => {
                        // Request completes at client
                        setFloatingPackets(prev => prev.filter(p => p.id !== packetId));
                        setActiveRequest(null);
                        
                        // Check if capped
                        const nextTotal = totalOps + 1;
                        if (nextTotal >= totalSteps) {
                            setIsFinished(true);
                            setIsRunning(false);
                        }
                    }, 500);

                } else {
                    // CACHE MISS!
                    setMetrics(m => ({ ...m, misses: m.misses + 1 }));
                    setHistory(h => [`[REDIS] CACHE MISS for '${key}'. Querying SQL Database...`, ...h.slice(0, 49)]);
                    
                    // Transition workflow board
                    setActiveRequest({ op: 'GET', key, stage: 'db-lookup' });

                    // Set packet status to Redis to DB
                    setFloatingPackets(prev => prev.map(p => p.id === packetId ? { ...p, status: 'redis-to-db' } : p));

                    // After travel to DB (500ms)
                    setTimeout(() => {
                        const numericId = parseInt(id);
                        setHighlightedDbId(numericId);

                        const dbUser = db.find(u => u.id === numericId);
                        
                        // DB Lookup pause (800ms)
                        setTimeout(() => {
                            setHighlightedDbId(null);
                            
                            if (dbUser) {
                                setHistory(h => [`[DB] Found '${key}' on Disk: '${dbUser.name}'`, ...h.slice(0, 49)]);
                                
                                // Transition workflow board
                                setActiveRequest({ op: 'GET', key, stage: 'write-back' });

                                // Write-back to Redis: Packet travels DB to Redis
                                setFloatingPackets(prev => prev.map(p => p.id === packetId ? { 
                                    ...p, 
                                    status: 'db-to-redis', 
                                    val: dbUser.name 
                                } : p));

                                // Write back complete (500ms)
                                setTimeout(() => {
                                    setCache(prevCache => {
                                        accessCounter.current++;
                                        const existsIdx = prevCache.findIndex(c => c.key === key);
                                        
                                        if (existsIdx !== -1) {
                                            const next = [...prevCache];
                                            next[existsIdx] = { key, val: dbUser.name, ttl: 15, initialTtl: 15, lastUsed: accessCounter.current };
                                            return next;
                                        }

                                        // LRU Eviction if full
                                        if (prevCache.length >= cacheLimit) {
                                            let lruItem = prevCache[0];
                                            prevCache.forEach(item => {
                                                if (item.lastUsed < lruItem.lastUsed) {
                                                    lruItem = item;
                                                }
                                            });

                                            setMetrics(m => ({ ...m, evicted: m.evicted + 1 }));
                                            setHistory(h => [`[LRU] Evicted least recently accessed key '${lruItem.key}'`, ...h.slice(0, 49)]);
                                            
                                            const filtered = prevCache.filter(item => item.key !== lruItem.key);
                                            return [...filtered, { key, val: dbUser.name, ttl: 15, initialTtl: 15, lastUsed: accessCounter.current }];
                                        }

                                        return [...prevCache, { key, val: dbUser.name, ttl: 15, initialTtl: 15, lastUsed: accessCounter.current }];
                                    });

                                    setHistory(h => [`[REDIS] Cache populated with key '${key}'`, ...h.slice(0, 49)]);

                                    // Transition workflow board
                                    setActiveRequest({ op: 'GET', key, stage: 'done' });

                                    // Send response from Redis to Client
                                    setFloatingPackets(prev => prev.map(p => p.id === packetId ? { 
                                        ...p, 
                                        status: 'redis-to-client', 
                                        isResponse: true 
                                    } : p));

                                    setTimeout(() => {
                                        setFloatingPackets(prev => prev.filter(p => p.id !== packetId));
                                        setActiveRequest(null);
                                        
                                        // Check if capped
                                        const nextTotal = totalOps + 1;
                                        if (nextTotal >= totalSteps) {
                                            setIsFinished(true);
                                            setIsRunning(false);
                                        }
                                    }, 500);

                                }, 500);

                            } else {
                                // DB miss
                                setHistory(h => [`[DB] Key '${key}' not found on database. Returning NULL.`, ...h.slice(0, 49)]);
                                
                                // Transition workflow board
                                setActiveRequest({ op: 'GET', key, stage: 'done' });

                                setFloatingPackets(prev => prev.map(p => p.id === packetId ? { 
                                    ...p, 
                                    status: 'redis-to-client', 
                                    isResponse: true, 
                                    val: 'NULL' 
                                } : p));

                                setTimeout(() => {
                                    setFloatingPackets(prev => prev.filter(p => p.id !== packetId));
                                    setActiveRequest(null);
                                    
                                    // Check if capped
                                    const nextTotal = totalOps + 1;
                                    if (nextTotal >= totalSteps) {
                                        setIsFinished(true);
                                        setIsRunning(false);
                                    }
                                }, 500);
                            }

                        }, 800);

                    }, 500);
                }
            }, 800);

        }, 500);
    };

    // Perform SET operation (Writes to Cache AND Disk)
    const runSetRequest = (id, name, ttl) => {
        if (activeRequest) return;
        const totalOps = metrics.hits + metrics.misses;
        if (totalOps >= totalSteps) {
            setIsFinished(true);
            return;
        }

        const key = `user:${id}`;
        const ttlNum = parseInt(ttl) || 15;

        setActiveRequest({ op: 'SET', key, stage: 'writing' });
        setHistory(h => [`[CLIENT] SET request initiated: '${key}' = '${name}' (TTL: ${ttlNum}s)`, ...h.slice(0, 49)]);

        // Dispatch dual write packets: Client to Redis & Client to DB
        const packetRedisId = `set-redis-${Date.now()}`;
        const packetDbId = `set-db-${Date.now()}`;

        const reqRedis = { id: packetRedisId, op: 'SET', key, val: name, status: 'client-to-redis' };
        const reqDb = { id: packetDbId, op: 'SET', key, val: name, status: 'client-to-db' };

        setFloatingPackets([reqRedis, reqDb]);

        // After travel time (500ms)
        setTimeout(() => {
            // Write to Cache
            setCache(prevCache => {
                accessCounter.current++;
                const existsIdx = prevCache.findIndex(c => c.key === key);
                
                if (existsIdx !== -1) {
                    const next = [...prevCache];
                    next[existsIdx] = { key, val: name, ttl: ttlNum, initialTtl: ttlNum, lastUsed: accessCounter.current };
                    return next;
                }

                // Evict if cache full
                if (prevCache.length >= cacheLimit) {
                    let lruItem = prevCache[0];
                    prevCache.forEach(item => {
                        if (item.lastUsed < lruItem.lastUsed) {
                            lruItem = item;
                        }
                    });
                    setMetrics(m => ({ ...m, evicted: m.evicted + 1 }));
                    setHistory(h => [`[LRU] Evicted key '${lruItem.key}' to accommodate new record`, ...h.slice(0, 49)]);
                    
                    const filtered = prevCache.filter(item => item.key !== lruItem.key);
                    return [...filtered, { key, val: name, ttl: ttlNum, initialTtl: ttlNum, lastUsed: accessCounter.current }];
                }

                return [...prevCache, { key, val: name, ttl: ttlNum, initialTtl: ttlNum, lastUsed: accessCounter.current }];
            });

            // Write to Database
            setDb(prevDb => {
                const numericId = parseInt(id);
                const exists = prevDb.some(u => u.id === numericId);
                if (exists) {
                    return prevDb.map(u => u.id === numericId ? { ...u, name } : u);
                }
                return [...prevDb, { id: numericId, name }];
            });

            setHistory(h => [`[REDIS/DB] SET completed successfully. Key '${key}' written to memory and disk.`, ...h.slice(0, 49)]);

            // Transition workflow board
            setActiveRequest({ op: 'SET', key, stage: 'done' });

            // Clear write packets
            setTimeout(() => {
                setFloatingPackets([]);
                setActiveRequest(null);
            }, 500);

        }, 500);
    };

    // Perform DELETE operation (Wipes from cache and database)
    const runDeleteRequest = (id) => {
        if (activeRequest) return;
        const totalOps = metrics.hits + metrics.misses;
        if (totalOps >= totalSteps) {
            setIsFinished(true);
            return;
        }

        const key = `user:${id}`;

        setActiveRequest({ op: 'DELETE', key, stage: 'deleting' });
        setHistory(h => [`[CLIENT] DELETE request initiated for '${key}'`, ...h.slice(0, 49)]);

        // Dispatch dual delete packets
        const packetRedisId = `del-redis-${Date.now()}`;
        const packetDbId = `del-db-${Date.now()}`;

        const reqRedis = { id: packetRedisId, op: 'DELETE', key, status: 'client-to-redis' };
        const reqDb = { id: packetDbId, op: 'DELETE', key, status: 'client-to-db' };

        setFloatingPackets([reqRedis, reqDb]);

        // After travel time (500ms)
        setTimeout(() => {
            // Evict Cache
            setCache(prev => prev.filter(c => c.key !== key));
            
            // Delete DB record
            setDb(prev => prev.filter(u => u.id !== parseInt(id)));

            setHistory(h => [`[REDIS/DB] DELETE completed. Key '${key}' evicted from cache and database.`, ...h.slice(0, 49)]);

            // Transition workflow board
            setActiveRequest({ op: 'DELETE', key, stage: 'done' });

            // Clear packets
            setTimeout(() => {
                setFloatingPackets([]);
                setActiveRequest(null);
            }, 500);

        }, 500);
    };

    // Auto test streams
    useEffect(() => {
        let interval = null;
        if (isRunning && !isPaused && !isFinished) {
            interval = setInterval(() => {
                const totalOps = metrics.hits + metrics.misses;
                if (totalOps >= totalSteps) {
                    setIsFinished(true);
                    setIsRunning(false);
                    return;
                }
                const randomId = Math.floor(Math.random() * 5) + 1;
                runGetRequest(randomId);
            }, speed + 3000); 
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, isPaused, isFinished, speed, activeRequest, metrics.hits, metrics.misses]);

    // Calculate Hit Ratio
    const totalOps = metrics.hits + metrics.misses;
    const hitRatio = totalOps > 0 ? ((metrics.hits / totalOps) * 100).toFixed(1) : '0.0';

    // Packet coordinate solver
    const getPacketCoords = (p) => {
        if (p.status === 'client-to-redis') {
            return { left: '12%', top: '50%', x: '-50%', y: '-50%' };
        }
        if (p.status === 'at-redis') {
            return { left: '52%', top: '30%', x: '-50%', y: '-50%' };
        }
        if (p.status === 'redis-to-client') {
            return { left: '12%', top: '50%', x: '-50%', y: '-50%' };
        }
        if (p.status === 'redis-to-db') {
            return { left: '52%', top: '30%', x: '-50%', y: '-50%' };
        }
        if (p.status === 'db-to-redis') {
            return { left: '52%', top: '30%', x: '-50%', y: '-50%' };
        }
        if (p.status === 'client-to-db') {
            return { left: '12%', top: '50%', x: '-50%', y: '-50%' };
        }
        return { left: '12%', top: '50%', x: '-50%', y: '-50%' };
    };

    const isPathActive = (fromNode, toNode) => {
        if (fromNode === 'client' && toNode === 'redis') {
            return floatingPackets.some(p => p.status === 'client-to-redis' || p.status === 'redis-to-client');
        }
        if (fromNode === 'redis' && toNode === 'db') {
            return floatingPackets.some(p => p.status === 'redis-to-db' || p.status === 'db-to-redis');
        }
        if (fromNode === 'client' && toNode === 'db') {
            return floatingPackets.some(p => p.status === 'client-to-db');
        }
        return false;
    };

    // Reset cache and db simulators
    const handleReset = () => {
        setCache([
            { key: 'user:1', val: 'Alice', ttl: 15, initialTtl: 15, lastUsed: 1 },
            { key: 'user:2', val: 'Bob', ttl: 20, initialTtl: 20, lastUsed: 2 }
        ]);
        setDb([
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
            { id: 3, name: 'Charlie' },
            { id: 4, name: 'David' },
            { id: 5, name: 'Eva' }
        ]);
        setFloatingPackets([]);
        setActiveRequest(null);
        setHighlightedDbId(null);
        setMetrics({ hits: 0, misses: 0, expired: 0, evicted: 0 });
        setHistory(['Simulator reset. Cache and database restored.']);
        setIsRunning(false);
        setIsPaused(false);
        setIsFinished(false);
        accessCounter.current = 3;
    };

    // Guide Workflow definitions
    const getWorkflowSteps = (op) => {
        if (op === 'GET') {
            return [
                { id: 'checking-cache', label: '1. Check RAM', desc: 'Look up key in Redis Cache' },
                { id: 'db-lookup', label: '2. Query Disk', desc: 'Cache Miss: fallback to Database' },
                { id: 'write-back', label: '3. Populate RAM', desc: 'Save fetched record in Redis' },
                { id: 'respond', label: '4. Return 200', desc: 'Send final response to Client' }
            ];
        }
        if (op === 'SET') {
            return [
                { id: 'write-cache', label: '1. Update RAM', desc: 'Write record to Redis Cache' },
                { id: 'write-db', label: '2. Update Disk', desc: 'Write record to Database' },
                { id: 'respond', label: '3. Complete', desc: 'SET request successful' }
            ];
        }
        if (op === 'DELETE') {
            return [
                { id: 'delete-cache', label: '1. Flush RAM', desc: 'Evict key from Redis Cache' },
                { id: 'delete-db', label: '2. Flush Disk', desc: 'Delete record from Database' },
                { id: 'respond', label: '3. Complete', desc: 'DELETE request successful' }
            ];
        }
        return [];
    };

    const isStepActive = (stepId, activeReq) => {
        if (!activeReq) return false;
        const { op, stage } = activeReq;
        
        if (op === 'GET') {
            if (stepId === 'checking-cache') return stage === 'checking-cache';
            if (stepId === 'db-lookup') return stage === 'db-lookup';
            if (stepId === 'write-back') return stage === 'write-back';
            if (stepId === 'respond') return stage === 'done';
        }
        if (op === 'SET') {
            if (stepId === 'write-cache') return stage === 'writing';
            if (stepId === 'write-db') return stage === 'writing';
            if (stepId === 'respond') return stage === 'done';
        }
        if (op === 'DELETE') {
            if (stepId === 'delete-cache') return stage === 'deleting';
            if (stepId === 'delete-db') return stage === 'deleting';
            if (stepId === 'respond') return stage === 'done';
        }
        return false;
    };

    const isStepDone = (stepId, activeReq) => {
        if (!activeReq) return false;
        const { op, stage } = activeReq;
        
        if (op === 'GET') {
            if (stepId === 'checking-cache') return stage !== 'checking-cache';
            if (stepId === 'db-lookup') return stage === 'write-back' || stage === 'done';
            if (stepId === 'write-back') return stage === 'done';
            if (stepId === 'respond') return false;
        }
        if (op === 'SET') {
            if (stepId === 'write-cache') return stage === 'done';
            if (stepId === 'write-db') return stage === 'done';
            if (stepId === 'respond') return false;
        }
        if (op === 'DELETE') {
            if (stepId === 'delete-cache') return stage === 'done';
            if (stepId === 'delete-db') return stage === 'done';
            if (stepId === 'respond') return false;
        }
        return false;
    };

    return (
        <ImmersiveLayout
            isActive={true}
            title="Caching & Redis Lab"
            icon={<ZapIcon size={20} />}
            moduleLabel="System Design"
            isRunning={isRunning}
            isPaused={isPaused}
            isFinished={isFinished}
            speed={speed}
            onSpeedChange={setSpeed}
            onStart={() => setIsRunning(true)}
            onPause={() => setIsPaused(true)}
            onResume={() => { setIsRunning(true); setIsPaused(false); }}
            onReset={handleReset}
            onStep={() => runGetRequest(Math.floor(Math.random() * 5) + 1)}
            currentStepNum={metrics.hits + metrics.misses}
            totalSteps={totalSteps}
            phaseName={activeRequest ? `Executing ${activeRequest.op}...` : "Listening"}
            hideFooter={true}
            leftContent={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {/* Read Panel */}
                    <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                        <div className="panel-header" style={{ background: 'var(--cyan)', padding: '4px 8px', fontSize: '0.72rem' }}>
                            Read Operations
                        </div>
                        <div style={{ padding: '0.6rem', background: '#fff', display: 'flex', gap: '0.3rem' }}>
                            <select 
                                value={formKeyId} 
                                onChange={e => setFormKeyId(e.target.value)}
                                style={{ flex: 1, padding: '0.2rem', border: '2px solid var(--border)', fontSize: '0.72rem', fontWeight: 700 }}
                            >
                                <option value="1">user:1</option>
                                <option value="2">user:2</option>
                                <option value="3">user:3</option>
                                <option value="4">user:4</option>
                                <option value="5">user:5</option>
                            </select>
                            <button 
                                onClick={() => runGetRequest(formKeyId)}
                                className="btn btn-sm"
                                style={{ background: 'var(--green)', color: '#000', fontWeight: 800, fontSize: '0.65rem' }}
                                disabled={activeRequest !== null || isFinished}
                            >
                                GET
                            </button>
                        </div>
                    </div>

                    {/* Write Panel */}
                    <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                        <div className="panel-header" style={{ background: 'var(--yellow)', padding: '4px 8px', fontSize: '0.72rem' }}>
                            Write/Delete Operations
                        </div>
                        <div style={{ padding: '0.6rem', background: '#fff', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.7rem' }}>
                            <div style={{ display: 'flex', gap: '0.2rem', flexDirection: 'column' }}>
                                <span>Name:</span>
                                <input 
                                    value={formName} 
                                    onChange={e => setFormName(e.target.value)}
                                    style={{ padding: '0.2rem', border: '1.5px solid var(--border)', fontSize: '0.72rem' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.2rem', flexDirection: 'column' }}>
                                <span>TTL (seconds):</span>
                                <input 
                                    type="number"
                                    value={formTtl} 
                                    onChange={e => setFormTtl(e.target.value)}
                                    style={{ padding: '0.2rem', border: '1.5px solid var(--border)', fontSize: '0.72rem' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.2rem' }}>
                                <button 
                                    onClick={() => runSetRequest(formKeyId, formName, formTtl)}
                                    className="btn btn-sm"
                                    style={{ flex: 1, background: 'var(--cyan)', color: '#000', fontWeight: 800 }}
                                    disabled={activeRequest !== null || isFinished}
                                >
                                    SET
                                </button>
                                <button 
                                    onClick={() => runDeleteRequest(formKeyId)}
                                    className="btn btn-sm"
                                    style={{ flex: 1, background: 'var(--pink)', color: '#fff', fontWeight: 800 }}
                                    disabled={activeRequest !== null || isFinished}
                                >
                                    DELETE
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Cache Stats */}
                    <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                        <div className="panel-header" style={{ background: 'var(--pink)', padding: '4px 8px', fontSize: '0.72rem' }}>
                            Redis Analytics
                        </div>
                        <div style={{ padding: '0.6rem', background: '#fff', fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontFamily: 'var(--font-mono)' }}>
                            {/* Big Premium Hit Ratio Card */}
                            <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                background: '#1e1e2e', 
                                color: 'var(--green)',
                                padding: '0.75rem', 
                                border: '2px solid var(--border)', 
                                borderRadius: '6px', 
                                boxShadow: '3px 3px 0 var(--border)', 
                                marginBottom: '0.5rem',
                                textAlign: 'center'
                            }}>
                                <span style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', color: '#fff', opacity: 0.6 }}>CACHE HIT RATIO</span>
                                <span style={{ fontSize: '1.9rem', fontWeight: 900, marginTop: '2px' }}>{hitRatio}%</span>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Capacity:</span>
                                <strong>{cache.length} / {cacheLimit} keys</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Hits:</span>
                                <strong>{metrics.hits}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Misses:</span>
                                <strong>{metrics.misses}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Expired Keys:</span>
                                <strong>{metrics.expired}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Evicted (LRU):</span>
                                <strong>{metrics.evicted}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            }
            centerContent={
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fafafa', overflowY: 'auto', position: 'relative', scrollbarWidth: 'thin', padding: '0.75rem' }}>
                    
                    <style>{`
                        @keyframes marching-ants {
                            to {
                                stroke-dashoffset: -20;
                            }
                        }
                    `}</style>

                    {/* Step-by-Step Caching Progress Board for first-time users */}
                    {activeRequest ? (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            background: '#fff',
                            border: '2.5px solid var(--border)',
                            borderRadius: '6px',
                            padding: '0.5rem',
                            marginBottom: '0.75rem',
                            boxShadow: '3px 3px 0 var(--border)',
                            width: '100%',
                            flexShrink: 0
                        }}>
                            {getWorkflowSteps(activeRequest.op).map((step, idx) => {
                                const isActive = isStepActive(step.id, activeRequest);
                                const isDone = isStepDone(step.id, activeRequest);
                                return (
                                    <div 
                                        key={step.id} 
                                        style={{
                                            flex: 1,
                                            textAlign: 'center',
                                            borderRight: idx < getWorkflowSteps(activeRequest.op).length - 1 ? '1.5px solid var(--border)' : 'none',
                                            padding: '0 6px',
                                            opacity: isActive ? 1 : isDone ? 0.85 : 0.45,
                                            transition: 'opacity 0.2s'
                                        }}
                                    >
                                        <div style={{
                                            fontSize: '0.62rem',
                                            fontWeight: 900,
                                            color: isActive ? 'var(--pink)' : isDone ? 'var(--green)' : 'inherit',
                                            textTransform: 'uppercase'
                                        }}>
                                            {step.label}
                                        </div>
                                        <div style={{ fontSize: '0.52rem', opacity: 0.7, marginTop: '1px' }}>
                                            {step.desc}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{
                            background: '#fff',
                            border: '2px dashed #ccc',
                            borderRadius: '6px',
                            padding: '0.5rem',
                            textAlign: 'center',
                            fontSize: '0.68rem',
                            color: '#666',
                            marginBottom: '0.75rem',
                            flexShrink: 0
                        }}>
                            Select an operation (GET / SET / DELETE) on the left sidebar to trace the caching workflow lifecycle. (Limited to 10 requests)
                        </div>
                    )}

                    {/* Visualizer container */}
                    <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: 480 }}>
                        
                        {/* Dotted schematic lines */}
                        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                            {/* Client -> Redis */}
                            <line 
                                x1="12%" y1="50%" x2="52%" y2="30%" 
                                stroke="var(--border)" 
                                strokeWidth="2"
                                strokeDasharray="4 4"
                                opacity={isPathActive('client', 'redis') ? 1 : 0.25}
                                style={{ transition: 'opacity 0.2s, stroke 0.2s' }}
                            />
                            {isPathActive('client', 'redis') && (
                                <line 
                                    x1="12%" y1="50%" x2="52%" y2="30%" 
                                    stroke="var(--green)" 
                                    strokeWidth="3.5"
                                    strokeDasharray="6 4"
                                    style={{ animation: 'marching-ants 0.6s linear infinite' }}
                                />
                            )}

                            {/* Redis -> Database */}
                            <line 
                                x1="52%" y1="30%" x2="85%" y2="70%" 
                                stroke="var(--border)" 
                                strokeWidth="2"
                                strokeDasharray="4 4"
                                opacity={isPathActive('redis', 'db') ? 1 : 0.25}
                                style={{ transition: 'opacity 0.2s, stroke 0.2s' }}
                            />
                            {isPathActive('redis', 'db') && (
                                <line 
                                    x1="52%" y1="30%" x2="85%" y2="70%" 
                                    stroke="var(--green)" 
                                    strokeWidth="3.5"
                                    strokeDasharray="6 4"
                                    style={{ animation: 'marching-ants 0.6s linear infinite' }}
                                />
                            )}

                            {/* Client -> Database (Write Path) */}
                            <line 
                                x1="12%" y1="50%" x2="85%" y2="70%" 
                                stroke="var(--border)" 
                                strokeWidth="2"
                                strokeDasharray="4 4"
                                opacity={isPathActive('client', 'db') ? 1 : 0.25}
                                style={{ transition: 'opacity 0.2s, stroke 0.2s' }}
                            />
                            {isPathActive('client', 'db') && (
                                <line 
                                    x1="12%" y1="50%" x2="85%" y2="70%" 
                                    stroke="var(--green)" 
                                    strokeWidth="3.5"
                                    strokeDasharray="6 4"
                                    style={{ animation: 'marching-ants 0.6s linear infinite' }}
                                />
                            )}
                        </svg>

                        {/* CLIENT APP NODE */}
                        <div style={{
                            position: 'absolute',
                            left: '12%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 3,
                            width: 170,
                            border: '2.5px solid var(--border)',
                            background: '#fff',
                            borderRadius: '6px',
                            boxShadow: '3px 3px 0 var(--border)',
                            padding: '0.4rem 0.6rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <GlobeIcon size={16} />
                                <span style={{ fontWeight: 900, fontSize: '0.72rem' }}>CLIENT APP</span>
                            </div>
                            <div style={{ height: 1.5, background: '#eee', margin: '4px 0' }} />
                            <div style={{ fontSize: '0.55rem', color: '#666', fontFamily: 'var(--font-mono)' }}>
                                STATUS: ONLINE<br />
                                PORT: 3000
                            </div>
                        </div>

                        {/* REDIS IN-MEMORY CACHE STICK */}
                        <div style={{
                            position: 'absolute',
                            left: '52%',
                            top: '30%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 3,
                            width: 250,
                            border: '3px solid var(--border)',
                            background: 'var(--cyan)',
                            borderRadius: '8px',
                            boxShadow: '4px 4px 0 var(--border)',
                            padding: '0.5rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 900, fontSize: '0.75rem' }}>REDIS CACHE (RAM)</span>
                                <span style={{ fontSize: '0.55rem', background: '#000', color: '#fff', padding: '1px 4px', borderRadius: '3px', fontWeight: 800 }}>
                                    MAX: 4 KEYS
                                </span>
                            </div>

                            {/* Cache RAM Slots stick */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {cache.length === 0 ? (
                                    <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: '4px', padding: '6px', fontSize: '0.62rem', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
                                        Empty RAM Stick
                                    </div>
                                ) : (
                                    cache.map(item => {
                                        const isActive = activeRequest && activeRequest.key === item.key;
                                        const ttlPct = Math.max(0, (item.ttl / item.initialTtl) * 100);
                                        const progressColor = ttlPct > 50 ? 'var(--green)' : ttlPct > 20 ? 'var(--yellow)' : 'var(--pink)';

                                        return (
                                            <div 
                                                key={item.key}
                                                style={{
                                                    background: isActive ? 'rgba(255, 209, 102, 0.1)' : '#fff',
                                                    border: '1.8px solid var(--border)',
                                                    borderRadius: '4px',
                                                    padding: '4px 6px',
                                                    boxShadow: '1px 1px 0 var(--border)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '1px'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', fontWeight: 800 }}>
                                                    <span style={{ fontFamily: 'var(--font-mono)' }}>{item.key}</span>
                                                    <span>{item.val}</span>
                                                </div>
                                                
                                                {/* TTL progress bar */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                    <div style={{ flex: 1, height: 4, background: '#eee', border: '1px solid var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                                                        <div style={{ width: `${ttlPct}%`, height: '100%', background: progressColor, transition: 'width 1s linear' }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.52rem', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>TTL:{item.ttl}s</span>
                                                    <span style={{ fontSize: '0.5rem', opacity: 0.5, borderLeft: '1px solid #ccc', paddingLeft: '3px' }}>LRU:{item.lastUsed}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* DISK DATABASE CYLINDER */}
                        <div style={{
                            position: 'absolute',
                            left: '85%',
                            top: '70%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 3,
                            width: 200,
                            border: '3px solid var(--border)',
                            background: 'var(--yellow)',
                            borderRadius: '8px',
                            boxShadow: '4px 4px 0 var(--border)',
                            padding: '0.4rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                <DatabaseIcon size={14} />
                                <span style={{ fontWeight: 900, fontSize: '0.72rem' }}>DISK DATABASE</span>
                            </div>

                            {/* DB SQL Table view */}
                            <div style={{ background: '#fff', border: '1.8px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                                <table className="neo-table" style={{ fontSize: '0.58rem', margin: 0, width: '100%' }}>
                                    <thead>
                                        <tr style={{ background: '#f0f0f0' }}>
                                            <th style={{ padding: '2px 4px', borderBottom: '1.5px solid var(--border)' }}>id</th>
                                            <th style={{ padding: '2px 4px', borderBottom: '1.5px solid var(--border)' }}>name</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {db.map(row => {
                                            const isHighlight = highlightedDbId === row.id;
                                            return (
                                                <tr 
                                                    key={row.id}
                                                    style={{ 
                                                        background: isHighlight ? 'var(--yellow)' : 'transparent',
                                                        transition: 'background 0.2s'
                                                    }}
                                                >
                                                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, padding: '2px 4px', borderBottom: '1px solid #eee' }}>{row.id}</td>
                                                    <td style={{ padding: '2px 4px', borderBottom: '1px solid #eee' }}>{row.name}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* FLOATING PACKET ELEMENT */}
                        <AnimatePresence>
                            {floatingPackets.map(p => {
                                const isResp = p.isResponse;
                                const coords = getPacketCoords(p);
                                return (
                                    <motion.div
                                        key={p.id}
                                        initial={{ left: '12%', top: '50%', x: '-50%', y: '-50%', scale: 0.6, opacity: 0 }}
                                        animate={{
                                            left: coords.left,
                                            top: coords.top,
                                            scale: 1,
                                            opacity: 1
                                        }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ duration: 0.45, ease: 'easeInOut' }}
                                        style={{
                                            position: 'absolute',
                                            zIndex: 5,
                                            transform: 'translate(-50%, -50%)'
                                        }}
                                    >
                                        {isResp ? (
                                            <div style={{
                                                padding: '2px 6px',
                                                border: '1.5px solid var(--border)',
                                                borderRadius: '12px',
                                                background: 'var(--green)',
                                                color: '#000',
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: '0.55rem',
                                                fontWeight: 900,
                                                boxShadow: '1px 1px 0 var(--border)',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                200 OK: {p.val || 'SUCCESS'}
                                            </div>
                                        ) : (
                                            <div style={{
                                                padding: '3px 6px',
                                                border: '1.8px solid var(--border)',
                                                borderRadius: '16px',
                                                background: p.op === 'GET' ? 'var(--cyan)' : p.op === 'SET' ? 'var(--yellow)' : 'var(--pink)',
                                                color: '#000',
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: '0.58rem',
                                                fontWeight: 900,
                                                boxShadow: '1.5px 1.5px 0 var(--border)',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {p.op} {p.key}
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                    </div>

                    {/* Console Logger */}
                    <div style={{
                        height: 300, background: '#1e1e2e',
                        padding: '0.3rem 0.8rem', fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                        color: '#cdd6f4', overflowY: 'auto', flexShrink: 0
                    }}>
                        <div style={{ color: '#6c7086', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '2px', marginBottom: '3px', textTransform: 'uppercase', fontSize: '0.58rem' }}>
                            Redis real-time transaction logger
                        </div>
                        {history.map((log, lIdx) => (
                            <div key={lIdx} style={{
                                color: log.includes('HIT') ? '#a6e3a1' : log.includes('MISS') || log.includes('EXPIRED') ? '#ff5555' : log.includes('EVICTED') ? '#ffd166' : '#cdd6f4'
                            }}>
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            }
            rightContent={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.78rem', lineHeight: 1.45 }}>
                    <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                        <div className="panel-header" style={{ background: 'var(--pink)', padding: '4px 8px', fontSize: '0.72rem' }}>
                            Learning Lab
                        </div>
                        <div style={{ padding: '0.6rem', background: '#fff' }}>
                            <p style={{ fontWeight: 800 }}>What is caching?</p>
                            <p style={{ opacity: 0.8, marginTop: '0.2rem', fontSize: '0.72rem' }}>
                                Caching stores copies of frequently requested database values in ultra-fast, volatile RAM (e.g. Redis). This bypasses heavy disk SQL scans.
                            </p>
                            
                            <div style={{ height: 1.5, background: '#eee', margin: '6px 0' }} />
                            
                            <p style={{ fontWeight: 800 }}>Eviction Policy (LRU):</p>
                            <p style={{ opacity: 0.8, marginTop: '0.2rem', fontSize: '0.72rem' }}>
                                Cache memory is finite. Under **Least Recently Used (LRU)** eviction, once storage capacity is hit, the key that has remained untouched for the longest time is discarded to make room.
                            </p>
                        </div>
                    </div>
                </div>
            }
            legend={[
                { color: 'var(--cyan)', label: 'Cache (RAM)' },
                { color: 'var(--yellow)', label: 'Database (Disk)' },
                { color: 'var(--green)', label: 'Response Success' }
            ]}
        />
    );
}
