import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import { ScaleIcon, DatabaseIcon, GlobeIcon, SignalIcon } from '../../components/Icons';

export default function DbScalingSim() {
    const [mode, setMode] = useState('replication'); // replication, sharding
    const [primaryDb, setPrimaryDb] = useState([
        { id: 1, name: 'Alice', score: 100 },
        { id: 2, name: 'Bob', score: 85 }
    ]);
    const [replicas, setReplicas] = useState({
        1: [
            { id: 1, name: 'Alice', score: 100 },
            { id: 2, name: 'Bob', score: 85 }
        ],
        2: [
            { id: 1, name: 'Alice', score: 100 },
            { id: 2, name: 'Bob', score: 85 }
        ],
        3: [
            { id: 1, name: 'Alice', score: 100 },
            { id: 2, name: 'Bob', score: 85 }
        ],
        4: [
            { id: 1, name: 'Alice', score: 100 },
            { id: 2, name: 'Bob', score: 85 }
        ]
    });
    const [replicaCount, setReplicaCount] = useState(2); // Customizable: 1 to 4 replicas

    // Sharding Databases
    const [shards, setShards] = useState({
        shardA: [{ id: 3, name: 'Charlie' }], // Hash 0: 3, 6, 9
        shardB: [{ id: 1, name: 'Alice' }],   // Hash 1: 1, 4, 7
        shardC: [{ id: 2, name: 'Bob' }]     // Hash 2: 2, 5, 8
    });
    const [shardingStrategy, setShardingStrategy] = useState('hash'); // hash (id % 3), range (1-3, 4-6, 7-9)

    // Configuration / Traffic
    const [syncLag, setSyncLag] = useState(2); // in seconds
    const [activePackets, setActivePackets] = useState([]); // { id, type: 'read'|'write'|'sync', target, step: 0|1 }
    const [metrics, setMetrics] = useState({ reads: 0, writes: 0 });
    const [history, setHistory] = useState(['DB Scaling Simulator ready. Choose Replication or Sharding.']);

    // Form / Simulator Input States
    const [userId, setUserId] = useState('4');
    const [userName, setUserName] = useState('David');

    // Direct Manual Inline Table Input States
    const [directPrimId, setDirectPrimId] = useState('');
    const [directPrimName, setDirectPrimName] = useState('');
    const [directShardAId, setDirectShardAId] = useState('');
    const [directShardAName, setDirectShardAName] = useState('');
    const [directShardBId, setDirectShardBId] = useState('');
    const [directShardBName, setDirectShardBName] = useState('');
    const [directShardCId, setDirectShardCId] = useState('');
    const [directShardCName, setDirectShardCName] = useState('');

    // Simulation states
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [speed, setSpeed] = useState(1500);

    // Active request step details for guide workflow
    const [activeRequest, setActiveRequest] = useState(null); // { op: 'READ'|'WRITE', id: number, stage: string, target: string, isStale?: boolean }
    const [staleAlert, setStaleAlert] = useState(null); // 'replica1' | 'replica2' | 'replica3' | 'replica4' | null

    const packetCounter = useRef(0);
    const replicaIndex = useRef(0);

    // Spacing coordinates for dynamically scaled Replicas (relative layout sizing)
    const getReplicaCoordinates = (idx, total) => {
        if (total === 1) return { left: '50%', top: '68%' };
        if (total === 2) {
            return idx === 0 ? { left: '28%', top: '68%' } : { left: '72%', top: '68%' };
        }
        if (total === 3) {
            return idx === 0 ? { left: '20%', top: '68%' } : idx === 1 ? { left: '50%', top: '68%' } : { left: '80%', top: '68%' };
        }
        if (total === 4) {
            if (idx === 0) return { left: '15%', top: '68%' };
            if (idx === 1) return { left: '38%', top: '68%' };
            if (idx === 2) return { left: '62%', top: '68%' };
            return { left: '85%', top: '68%' };
        }
        return { left: '50%', top: '68%' };
    };

    // Auto generator loop for background read/write traffic
    useEffect(() => {
        let timer = null;
        if (isRunning && !isPaused && !isFinished) {
            timer = setInterval(() => {
                if (activeRequest) return; // Wait for active request animation to clear

                const totalOps = metrics.reads + metrics.writes;
                if (totalOps >= 10) {
                    setIsFinished(true);
                    setIsRunning(false);
                    return;
                }

                const rand = Math.random();
                if (rand < 0.6) {
                    const randId = Math.floor(Math.random() * 9) + 1;
                    handleRead(randId.toString());
                } else {
                    const ids = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
                    const names = ['Alice', 'Bob', 'Charlie', 'David', 'Eva', 'Frank', 'Grace', 'Helen', 'Ivan'];
                    const rIdx = Math.floor(Math.random() * ids.length);
                    handleWrite(ids[rIdx], names[rIdx]);
                }
            }, speed);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isRunning, isPaused, isFinished, speed, mode, primaryDb, shards, shardingStrategy, activeRequest, metrics.reads, metrics.writes, replicaCount]);

    // Calculate Shard storage hotspotting alerts
    const getHotspotShard = () => {
        if (mode !== 'sharding') return null;
        const lenA = shards.shardA.length;
        const lenB = shards.shardB.length;
        const lenC = shards.shardC.length;
        
        // A shard is a hotspot if it has at least 3 items, and has at least 2 more items than all other shards
        if (lenA >= 3 && lenA > lenB + 1 && lenA > lenC + 1) return 'shardA';
        if (lenB >= 3 && lenB > lenA + 1 && lenB > lenC + 1) return 'shardB';
        if (lenC >= 3 && lenC > lenA + 1 && lenC > lenB + 1) return 'shardC';
        return null;
    };
    const hotspotShard = getHotspotShard();

    // Generate READ traffic
    const handleRead = (overrideId) => {
        if (activeRequest) return;
        const totalOps = metrics.reads + metrics.writes;
        if (totalOps >= 10) {
            setIsFinished(true);
            setIsRunning(false);
            return;
        }

        const idToUse = overrideId || userId;
        const numId = parseInt(idToUse) || 1;
        packetCounter.current++;
        const pId = packetCounter.current;

        if (mode === 'replication') {
            // Load balance read requests round robin across N replicas
            const repId = (replicaIndex.current % replicaCount) + 1;
            replicaIndex.current++;
            const targetName = `replica${repId}`;

            // Check if this read is going to be STALE
            const primaryRecord = primaryDb.find(r => r.id === numId);
            const replicaData = replicas[repId] || [];
            const replicaRecord = replicaData.find(r => r.id === numId);
            const isStaleRead = primaryRecord && (!replicaRecord || replicaRecord.name !== primaryRecord.name);

            setActiveRequest({ op: 'READ', id: numId, stage: 'round-robin', target: targetName, isStale: isStaleRead });
            setMetrics(m => ({ ...m, reads: m.reads + 1 }));
            setHistory(h => [`[CLIENT] GET request for row id=${numId} initiated. Round-robin selected Replica ${repId}.`, ...h.slice(0, 49)]);

            const newPacket = { id: pId, type: 'read', target: targetName, step: 0 };
            setActivePackets([newPacket]);

            // Packet travels to center/primary
            setTimeout(() => {
                setActiveRequest({ op: 'READ', id: numId, stage: 'route-to-replica', target: targetName, isStale: isStaleRead });
                setActivePackets(curr => curr.map(p => p.id === pId ? { ...p, step: 1 } : p));

                setTimeout(() => {
                    if (isStaleRead) {
                        setHistory(h => [
                            `[WARNING] STALE READ DETECTED: Replica ${repId} returned stale/missing data for ID ${numId} (Primary has it, but replication sync is still pending).`,
                            ...h.slice(0, 49)
                        ]);
                        setStaleAlert(targetName);
                        setTimeout(() => setStaleAlert(null), 3000);
                    } else if (replicaRecord) {
                        setHistory(h => [`[READ] Replica ${repId} found row { id: ${replicaRecord.id}, name: '${replicaRecord.name}' }`, ...h.slice(0, 49)]);
                    } else {
                        setHistory(h => [`[READ] Replica ${repId} row id=${numId} not found.`, ...h.slice(0, 49)]);
                    }
                    setActiveRequest({ op: 'READ', id: numId, stage: 'done', target: targetName, isStale: isStaleRead });

                    setTimeout(() => {
                        setActivePackets([]);
                        setActiveRequest(null);
                        
                        const nextTotal = totalOps + 1;
                        if (nextTotal >= 10) {
                            setIsFinished(true);
                            setIsRunning(false);
                        }
                    }, 500);
                }, 500);

            }, 500);

        } else {
            // Sharding mode read
            let shardKey = '';
            if (shardingStrategy === 'hash') {
                const h = numId % 3;
                shardKey = h === 0 ? 'shardA' : h === 1 ? 'shardB' : 'shardC';
            } else {
                shardKey = numId <= 3 ? 'shardA' : numId <= 6 ? 'shardB' : 'shardC';
            }

            setActiveRequest({ op: 'READ', id: numId, stage: 'parse-key', target: shardKey });
            setMetrics(m => ({ ...m, reads: m.reads + 1 }));
            setHistory(h => [`[CLIENT] GET request for row id=${numId} initiated. Evaluating sharding strategy...`, ...h.slice(0, 49)]);

            const newPacket = { id: pId, type: 'read', target: shardKey, step: 0 };
            setActivePackets([newPacket]);

            setTimeout(() => {
                setActiveRequest({ op: 'READ', id: numId, stage: 'route-to-router', target: shardKey });
                setHistory(h => [`[ROUTER] Routing read query to target database node: ${shardKey.toUpperCase()}`, ...h.slice(0, 49)]);

                setTimeout(() => {
                    setActiveRequest({ op: 'READ', id: numId, stage: 'route-to-shard', target: shardKey });
                    setActivePackets(curr => curr.map(p => p.id === pId ? { ...p, step: 1 } : p));

                    const record = shards[shardKey].find(r => r.id === numId);

                    setTimeout(() => {
                        if (record) {
                            setHistory(h => [`[SHARD] ${shardKey.toUpperCase()} found row { id: ${record.id}, name: '${record.name}' }`, ...h.slice(0, 49)]);
                        } else {
                            setHistory(h => [`[SHARD] ${shardKey.toUpperCase()} row id=${numId} not found.`, ...h.slice(0, 49)]);
                        }
                        setActiveRequest({ op: 'READ', id: numId, stage: 'done', target: shardKey });

                        setTimeout(() => {
                            setActivePackets([]);
                            setActiveRequest(null);

                            const nextTotal = totalOps + 1;
                            if (nextTotal >= 10) {
                                setIsFinished(true);
                                setIsRunning(false);
                            }
                        }, 500);
                    }, 500);

                }, 400);

            }, 400);
        }
    };

    // Generate WRITE traffic
    const handleWrite = (overrideId, overrideName) => {
        if (activeRequest) return;
        const totalOps = metrics.reads + metrics.writes;
        if (totalOps >= 10) {
            setIsFinished(true);
            setIsRunning(false);
            return;
        }

        const idToUse = overrideId || userId;
        const nameToUse = overrideName || userName;
        const id = parseInt(idToUse) || 4;
        const name = nameToUse || 'David';
        packetCounter.current++;
        const pId = packetCounter.current;

        if (mode === 'replication') {
            setActiveRequest({ op: 'WRITE', id, stage: 'route-to-primary', target: 'primary' });
            setMetrics(m => ({ ...m, writes: m.writes + 1 }));
            setHistory(h => [`[CLIENT] WRITE request initiated for row id=${id}, name='${name}'. Directing to Primary (Writes only).`, ...h.slice(0, 49)]);

            const newPacket = { id: pId, type: 'write', target: 'primary', step: 0 };
            setActivePackets([newPacket]);

            // Packet travels from client to Primary (Center)
            setTimeout(() => {
                setActiveRequest({ op: 'WRITE', id, stage: 'write-primary', target: 'primary' });
                setActivePackets(curr => curr.map(p => p.id === pId ? { ...p, step: 1 } : p));

                // Commit to primary DB
                setPrimaryDb(prev => {
                    const exists = prev.some(u => u.id === id);
                    if (exists) {
                        return prev.map(u => u.id === id ? { ...u, name } : u);
                    }
                    return [...prev, { id, name, score: 90 }];
                });
                setHistory(h => [`[PRIMARY] Record committed to primary storage: id=${id}, name='${name}'`, ...h.slice(0, 49)]);

                setTimeout(() => {
                    // Remove write packet
                    setActivePackets([]);
                    setActiveRequest({ op: 'WRITE', id, stage: 'sync-replicas', target: 'replicas' });
                    setHistory(h => [`[REPLICATION] Scheduling sync to ${replicaCount} Read Replicas (Lag: ${syncLag}s)...`, ...h.slice(0, 49)]);

                    // Trigger sync packets from primary to all replicas after lag
                    setTimeout(() => {
                        const syncPackets = [];
                        for (let i = 1; i <= replicaCount; i++) {
                            syncPackets.push({
                                id: `sync-${i}-${Date.now()}`,
                                type: 'sync',
                                target: `replica${i}`,
                                step: 0
                            });
                        }

                        setHistory(h => [`[SYNC] Propagating replication packets to all active replicas...`, ...h.slice(0, 49)]);
                        setActivePackets(syncPackets);

                        setTimeout(() => {
                            setActivePackets(curr => curr.map(p => p.type === 'sync' ? { ...p, step: 1 } : p));

                            // Commit update to all replicas
                            setReplicas(prev => {
                                const next = { ...prev };
                                const updater = list => {
                                    const exists = list.some(u => u.id === id);
                                    if (exists) return list.map(u => u.id === id ? { ...u, name } : u);
                                    return [...list, { id, name, score: 90 }];
                                };
                                for (let i = 1; i <= replicaCount; i++) {
                                    next[i] = updater(next[i] || []);
                                }
                                return next;
                            });

                            setActiveRequest({ op: 'WRITE', id, stage: 'done', target: 'replicas' });
                            setHistory(h => [`[SYNC] Replication complete. All ${replicaCount} Replicas are in sync with Primary.`, ...h.slice(0, 49)]);

                            setTimeout(() => {
                                setActivePackets([]);
                                setActiveRequest(null);

                                const nextTotal = totalOps + 1;
                                if (nextTotal >= 10) {
                                    setIsFinished(true);
                                    setIsRunning(false);
                                }
                            }, 500);

                        }, 500);

                    }, syncLag * 1000);

                }, 500);

            }, 500);

        } else {
            // Sharding mode write
            let shardKey = '';
            if (shardingStrategy === 'hash') {
                const h = id % 3;
                shardKey = h === 0 ? 'shardA' : h === 1 ? 'shardB' : 'shardC';
            } else {
                shardKey = id <= 3 ? 'shardA' : id <= 6 ? 'shardB' : 'shardC';
            }

            setActiveRequest({ op: 'WRITE', id, stage: 'parse-key', target: shardKey });
            setMetrics(m => ({ ...m, writes: m.writes + 1 }));
            setHistory(h => [`[CLIENT] WRITE request for row id=${id}, name='${name}' initiated. Evaluating sharding key...`, ...h.slice(0, 49)]);

            const newPacket = { id: pId, type: 'write', target: shardKey, step: 0 };
            setActivePackets([newPacket]);

            setTimeout(() => {
                setActiveRequest({ op: 'WRITE', id, stage: 'route-to-router', target: shardKey });
                setHistory(h => [`[ROUTER] Routing write query to target database shard: ${shardKey.toUpperCase()}`, ...h.slice(0, 49)]);

                setTimeout(() => {
                    setActiveRequest({ op: 'WRITE', id, stage: 'route-to-shard', target: shardKey });
                    setActivePackets(curr => curr.map(p => p.id === pId ? { ...p, step: 1 } : p));

                    // Commit to Shard
                    setShards(prev => {
                        const list = [...prev[shardKey]];
                        const exists = list.some(u => u.id === id);
                        let newList = [];
                        if (exists) {
                            newList = list.map(u => u.id === id ? { ...u, name } : u);
                        } else {
                            newList = [...list, { id, name }];
                        }
                        return { ...prev, [shardKey]: newList };
                    });

                    setTimeout(() => {
                        setHistory(h => [`[SHARD] Committed row { id: ${id}, name: '${name}' } to database shard ${shardKey.toUpperCase()}`, ...h.slice(0, 49)]);
                        
                        // Check if a hotspot was just created
                        const nextA = shardKey === 'shardA' ? shards.shardA.length + 1 : shards.shardA.length;
                        const nextB = shardKey === 'shardB' ? shards.shardB.length + 1 : shards.shardB.length;
                        const nextC = shardKey === 'shardC' ? shards.shardC.length + 1 : shards.shardC.length;
                        if (shardKey === 'shardA' && nextA >= 3 && nextA > nextB + 1 && nextA > nextC + 1) {
                            setHistory(h => [`[WARNING] STORAGE HOTSPOT DETECTED: Shard A contains disproportionately more rows than other shards. Sequential range writes often trigger hotspots.`, ...h.slice(0, 49)]);
                        } else if (shardKey === 'shardB' && nextB >= 3 && nextB > nextA + 1 && nextB > nextC + 1) {
                            setHistory(h => [`[WARNING] STORAGE HOTSPOT DETECTED: Shard B contains disproportionately more rows than other shards. Sequential range writes often trigger hotspots.`, ...h.slice(0, 49)]);
                        } else if (shardKey === 'shardC' && nextC >= 3 && nextC > nextA + 1 && nextC > nextB + 1) {
                            setHistory(h => [`[WARNING] STORAGE HOTSPOT DETECTED: Shard C contains disproportionately more rows than other shards. Sequential range writes often trigger hotspots.`, ...h.slice(0, 49)]);
                        }

                        setActiveRequest({ op: 'WRITE', id, stage: 'done', target: shardKey });

                        setTimeout(() => {
                            setActivePackets([]);
                            setActiveRequest(null);

                            const nextTotal = totalOps + 1;
                            if (nextTotal >= 10) {
                                setIsFinished(true);
                                setIsRunning(false);
                            }
                        }, 500);
                    }, 500);

                }, 400);

            }, 400);
        }
    };

    // Handler to customize replica counts dynamically
    const handleReplicaCountChange = (count) => {
        const newCount = parseInt(count) || 2;
        setReplicaCount(newCount);
        setReplicas(prev => {
            const next = { ...prev };
            // Ensure all replicas have copies of current primaryDb data so it begins synchronized
            for (let i = 1; i <= newCount; i++) {
                if (!next[i]) {
                    next[i] = [...primaryDb];
                }
            }
            return next;
        });
        setHistory(h => [`[CONFIG] Scaled database to ${newCount} Read Replicas.`, ...h.slice(0, 49)]);
    };

    const handleReset = () => {
        setPrimaryDb([
            { id: 1, name: 'Alice', score: 100 },
            { id: 2, name: 'Bob', score: 85 }
        ]);
        setReplicas({
            1: [
                { id: 1, name: 'Alice', score: 100 },
                { id: 2, name: 'Bob', score: 85 }
            ],
            2: [
                { id: 1, name: 'Alice', score: 100 },
                { id: 2, name: 'Bob', score: 85 }
            ],
            3: [
                { id: 1, name: 'Alice', score: 100 },
                { id: 2, name: 'Bob', score: 85 }
            ],
            4: [
                { id: 1, name: 'Alice', score: 100 },
                { id: 2, name: 'Bob', score: 85 }
            ]
        });
        setShards({
            shardA: [{ id: 3, name: 'Charlie' }],
            shardB: [{ id: 1, name: 'Alice' }],
            shardC: [{ id: 2, name: 'Bob' }]
        });
        setActivePackets([]);
        setActiveRequest(null);
        setStaleAlert(null);
        setMetrics({ reads: 0, writes: 0 });
        setHistory(['Simulation reset. Databases initialized.']);
        setIsRunning(false);
        setIsPaused(false);
        setIsFinished(false);
        packetCounter.current = 0;
        replicaIndex.current = 0;
    };

    // Direct Inline Table Add Handlers
    const addPrimaryRowDirectly = () => {
        const idVal = parseInt(directPrimId);
        const nameVal = directPrimName.trim();
        if (!idVal || !nameVal) return;
        setPrimaryDb(prev => {
            const exists = prev.some(u => u.id === idVal);
            if (exists) return prev.map(u => u.id === idVal ? { ...u, name: nameVal } : u);
            return [...prev, { id: idVal, name: nameVal, score: 90 }];
        });
        setDirectPrimId('');
        setDirectPrimName('');
        setHistory(h => [`[PRIMARY] Instantly added row { id: ${idVal}, name: '${nameVal}' } directly to table.`, ...h.slice(0, 49)]);
    };

    const addShardRowDirectly = (shardKey, idInput, nameInput, setidInput, setnameInput) => {
        const idVal = parseInt(idInput);
        const nameVal = nameInput.trim();
        if (!idVal || !nameVal) return;
        setShards(prev => {
            const list = [...prev[shardKey]];
            const exists = list.some(u => u.id === idVal);
            let newList = [];
            if (exists) {
                newList = list.map(u => u.id === idVal ? { ...u, name: nameVal } : u);
            } else {
                newList = [...list, { id: idVal, name: nameVal }];
            }
            return { ...prev, [shardKey]: newList };
        });
        setidInput('');
        setnameInput('');
        setHistory(h => [`[${shardKey.toUpperCase()}] Instantly added row { id: ${idVal}, name: '${nameVal}' } directly.`, ...h.slice(0, 49)]);
    };

    // Guide Workflow definitions
    const getReplicationSteps = (op, stage) => {
        if (op === 'WRITE') {
            return [
                { id: 'route-to-primary', label: '1. Route Write', desc: 'Direct write query to Primary DB' },
                { id: 'write-primary', label: '2. Commit Primary', desc: 'Persist record to Primary storage' },
                { id: 'sync-replicas', label: '3. Replicate Sync', desc: `Async sync with lag (${syncLag}s)` },
                { id: 'done', label: '4. Consistent', desc: 'Replicas updated successfully' }
            ];
        }
        if (op === 'READ') {
            return [
                { id: 'round-robin', label: '1. Round Robin', desc: 'Select replica node' },
                { id: 'route-to-replica', label: '2. Route Read', desc: 'Query data from replica storage' },
                { id: 'done', label: '3. Complete', desc: 'Return data to Application Client' }
            ];
        }
        return [];
    };

    const getShardingSteps = (op, stage) => {
        const keyDesc = shardingStrategy === 'hash' ? 'ID % 3' : 'Range checks';
        return [
            { id: 'parse-key', label: '1. Parse Key', desc: `Evaluate key using ${keyDesc}` },
            { id: 'route-to-router', label: '2. Route Router', desc: 'Forward request to Shard Router' },
            { id: 'route-to-shard', label: '3. Query Shard', desc: 'Direct query to target Shard' },
            { id: 'done', label: '4. Complete', desc: `${op} request completed successfully` }
        ];
    };

    const isStepActive = (stepId, activeReq) => {
        if (!activeReq) return false;
        return activeReq.stage === stepId;
    };

    const isStepDone = (stepId, activeReq) => {
        if (!activeReq) return false;
        const { op, stage } = activeReq;
        if (mode === 'replication') {
            if (op === 'WRITE') {
                const order = ['route-to-primary', 'write-primary', 'sync-replicas', 'done'];
                return order.indexOf(stage) > order.indexOf(stepId);
            }
            if (op === 'READ') {
                const order = ['round-robin', 'route-to-replica', 'done'];
                return order.indexOf(stage) > order.indexOf(stepId);
            }
        } else {
            const order = ['parse-key', 'route-to-router', 'route-to-shard', 'done'];
            return order.indexOf(stage) > order.indexOf(stepId);
        }
        return false;
    };

    const isLineActive = (from, to) => {
        if (!activeRequest) return false;
        const { op, stage, target } = activeRequest;

        if (from === 'client' && to === 'center') {
            if (mode === 'replication') {
                if (op === 'WRITE') return stage === 'route-to-primary';
                if (op === 'READ') return stage === 'round-robin';
            } else {
                return stage === 'parse-key' || stage === 'route-to-router';
            }
        }

        if (mode === 'replication') {
            if (op === 'WRITE') {
                if (from === 'center' && target === 'replicas') return stage === 'sync-replicas';
                if (from === 'center' && to === target) return stage === 'sync-replicas';
            }
            if (op === 'READ') {
                if (from === 'center' && to === target) return stage === 'route-to-replica';
            }
        } else {
            if (from === 'center' && to === 'shardA') return stage === 'route-to-shard' && target === 'shardA';
            if (from === 'center' && to === 'shardB') return stage === 'route-to-shard' && target === 'shardB';
            if (from === 'center' && to === 'shardC') return stage === 'route-to-shard' && target === 'shardC';
        }

        return false;
    };

    const isRowHighlighted = (rowId, nodeName) => {
        if (!activeRequest) return false;
        const { op, id, stage, target } = activeRequest;
        if (parseInt(id) !== parseInt(rowId)) return false;

        if (mode === 'replication') {
            if (op === 'WRITE') {
                if (nodeName === 'primary') return stage === 'write-primary';
                if (nodeName.startsWith('replica')) return stage === 'sync-replicas' || stage === 'done';
            }
            if (op === 'READ') {
                return stage === 'route-to-replica' && target === nodeName;
            }
        } else {
            return stage === 'route-to-shard' && target === nodeName;
        }
        return false;
    };

    const totalOps = metrics.reads + metrics.writes;

    return (
        <ImmersiveLayout
            isActive={true}
            title="Database Scaling & Sharding Sandbox"
            icon={<ScaleIcon size={20} />}
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
            onStep={() => {
                const randId = Math.floor(Math.random() * 9) + 1;
                handleRead(randId.toString());
            }}
            currentStepNum={totalOps}
            totalSteps={10}
            phaseName={activeRequest ? `Running ${activeRequest.op}...` : "Listening"}
            hideFooter={true}
            leftContent={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                        <div className="panel-header" style={{ background: 'var(--cyan)', padding: '4px 8px', fontSize: '0.72rem' }}>
                            Scaling Pattern
                        </div>
                        <div style={{ padding: '0.6rem', background: '#fff', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button 
                                    className="btn btn-sm" 
                                    style={{ flex: 1, background: mode === 'replication' ? 'var(--cyan)' : 'var(--white)' }}
                                    onClick={() => { setMode('replication'); handleReset(); }}
                                    disabled={activeRequest !== null || isFinished}
                                >
                                    Replication
                                </button>
                                <button 
                                    className="btn btn-sm" 
                                    style={{ flex: 1, background: mode === 'sharding' ? 'var(--cyan)' : 'var(--white)' }}
                                    onClick={() => { setMode('sharding'); handleReset(); }}
                                    disabled={activeRequest !== null || isFinished}
                                >
                                    Sharding
                                </button>
                            </div>
                        </div>
                    </div>

                    {mode === 'replication' ? (
                        <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                            <div className="panel-header" style={{ background: 'var(--yellow)', padding: '4px 8px', fontSize: '0.72rem' }}>
                                Replication Config
                            </div>
                            <div style={{ padding: '0.6rem', background: '#fff', fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <span>Sync Lag ({syncLag}s):</span>
                                    <input 
                                        type="range" min="0" max="5" 
                                        value={syncLag} 
                                        onChange={e => setSyncLag(parseInt(e.target.value))}
                                        style={{ width: '100%' }}
                                        disabled={activeRequest !== null || isFinished}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <span>Scale Replicas (1 to 4):</span>
                                    <select
                                        value={replicaCount}
                                        onChange={e => handleReplicaCountChange(e.target.value)}
                                        style={{ padding: '0.2rem', border: '1.5px solid var(--border)', fontSize: '0.72rem', fontWeight: 700 }}
                                        disabled={activeRequest !== null || isFinished}
                                    >
                                        <option value="1">1 Replica</option>
                                        <option value="2">2 Replicas</option>
                                        <option value="3">3 Replicas</option>
                                        <option value="4">4 Replicas</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                            <div className="panel-header" style={{ background: 'var(--yellow)', padding: '4px 8px', fontSize: '0.72rem' }}>
                                Sharding Config
                            </div>
                            <div style={{ padding: '0.6rem', background: '#fff', fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <span>Key Strategy:</span>
                                    <select 
                                        value={shardingStrategy}
                                        onChange={e => setShardingStrategy(e.target.value)}
                                        style={{ padding: '0.2rem', border: '1.5px solid var(--border)', fontSize: '0.72rem', fontWeight: 700 }}
                                        disabled={activeRequest !== null || isFinished}
                                    >
                                        <option value="hash">Hash Strategy (ID % 3)</option>
                                        <option value="range">Range Strategy (1-3, 4-6, 7-9)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                        <div className="panel-header" style={{ background: 'var(--pink)', padding: '4px 8px', fontSize: '0.72rem' }}>
                            Trigger Operations
                        </div>
                        <div style={{ padding: '0.6rem', background: '#fff', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.72rem' }}>
                            <div style={{ display: 'flex', gap: '0.2rem', flexDirection: 'column' }}>
                                <span>Record ID (1-9):</span>
                                <input 
                                    type="number" min="1" max="9"
                                    value={userId} 
                                    onChange={e => setUserId(e.target.value)}
                                    style={{ padding: '0.2rem', border: '1.5px solid var(--border)', fontSize: '0.72rem' }}
                                    disabled={activeRequest !== null || isFinished}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.2rem', flexDirection: 'column' }}>
                                <span>Record Name:</span>
                                <input 
                                    value={userName} 
                                    onChange={e => setUserName(e.target.value)}
                                    style={{ padding: '0.2rem', border: '1.5px solid var(--border)', fontSize: '0.72rem' }}
                                    disabled={activeRequest !== null || isFinished}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.2rem' }}>
                                <button 
                                    className="btn btn-sm" 
                                    style={{ flex: 1, background: 'var(--cyan)' }} 
                                    onClick={() => handleRead()}
                                    disabled={activeRequest !== null || isFinished || totalOps >= 10}
                                >
                                    Read
                                </button>
                                <button 
                                    className="btn btn-sm" 
                                    style={{ flex: 1, background: 'var(--pink)', color: '#fff' }} 
                                    onClick={() => handleWrite(userId, userName)}
                                    disabled={activeRequest !== null || isFinished || totalOps >= 10}
                                >
                                    Write
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            }
            centerContent={
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fafafa', overflowY: 'auto', padding: '1rem' }}>
                    
                    <style>{`
                        @keyframes marching-ants {
                            to {
                                stroke-dashoffset: -20;
                            }
                        }
                        @keyframes pulse {
                            0% { opacity: 0.6; }
                            50% { opacity: 1; }
                            100% { opacity: 0.6; }
                        }
                        @keyframes row-pulse-read {
                            0% { background-color: rgba(0, 245, 255, 0.02); }
                            50% { background-color: rgba(0, 245, 255, 0.18); }
                            100% { background-color: rgba(0, 245, 255, 0.02); }
                        }
                        @keyframes row-pulse-write {
                            0% { background-color: rgba(255, 99, 132, 0.02); }
                            50% { background-color: rgba(255, 99, 132, 0.18); }
                            100% { background-color: rgba(255, 99, 132, 0.02); }
                        }
                        @keyframes row-pulse-sync {
                            0% { background-color: rgba(168, 85, 247, 0.02); }
                            50% { background-color: rgba(168, 85, 247, 0.18); }
                            100% { background-color: rgba(168, 85, 247, 0.02); }
                        }
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .no-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>

                    {/* Step-by-Step database scaling workflow guide board */}
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
                            {(mode === 'replication' 
                                ? getReplicationSteps(activeRequest.op, activeRequest.stage)
                                : getShardingSteps(activeRequest.op, activeRequest.stage)
                            ).map((step, idx, arr) => {
                                const isActive = isStepActive(step.id, activeRequest);
                                const isDone = isStepDone(step.id, activeRequest);
                                return (
                                    <div 
                                        key={step.id} 
                                        style={{
                                            flex: 1,
                                            textAlign: 'center',
                                            borderRight: idx < arr.length - 1 ? '1.5px solid var(--border)' : 'none',
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
                            border: '2.5px dashed #ccc',
                            borderRadius: '6px',
                            padding: '0.5rem',
                            textAlign: 'center',
                            fontSize: '0.68rem',
                            color: '#666',
                            marginBottom: '0.75rem',
                            flexShrink: 0
                        }}>
                            Select an operation (Read / Write) on the left sidebar to trace the database scaling lifecycle. (Limited to 10 operations)
                        </div>
                    )}

                    {/* Canvas containing nodes and wires */}
                    <div style={{ flex: 1, minHeight: '520px', position: 'relative', background: '#fff', border: '2.5px solid var(--border)', borderRadius: '8px', boxShadow: '4px 4px 0 var(--border)', overflow: 'hidden' }}>
                        
                        {isFinished && (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(4px)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 100,
                                padding: '2rem',
                                textAlign: 'center'
                            }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--pink)', marginBottom: '0.5rem' }}>SIMULATION COMPLETED</h3>
                                <p style={{ fontSize: '0.8rem', maxWidth: '300px', opacity: 0.8, marginBottom: '1rem' }}>
                                    You have reached the strict limit of 10 simulation operations. Reset to run a new test!
                                </p>
                                <button 
                                    className="btn" 
                                    style={{ background: 'var(--cyan)', border: '2px solid var(--border)', boxShadow: '3px 3px 0 var(--border)', fontWeight: 800 }} 
                                    onClick={handleReset}
                                >
                                    Reset Simulation
                                </button>
                            </div>
                        )}

                        {/* Wires */}
                        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                            {/* Client -> Center (Primary or Shard Router) */}
                            <line 
                                x1="50%" y1="8%" x2="50%" y2="30%" 
                                stroke="var(--border)" 
                                strokeWidth="2"
                                strokeDasharray="4 4"
                                opacity={isLineActive('client', 'center') ? 1 : 0.25}
                                style={{ transition: 'opacity 0.2s, stroke 0.2s' }}
                            />
                            {isLineActive('client', 'center') && (
                                <line 
                                    x1="50%" y1="8%" x2="50%" y2="30%" 
                                    stroke="var(--green)" 
                                    strokeWidth="3.5"
                                    strokeDasharray="6 4"
                                    style={{ animation: 'marching-ants 0.6s linear infinite' }}
                                />
                            )}

                            {mode === 'replication' ? (
                                <>
                                    {/* Center to Replicas (dynamically generated based on count) */}
                                    {Array.from({ length: replicaCount }).map((_, idx) => {
                                        const repId = idx + 1;
                                        const targetName = `replica${repId}`;
                                        const coords = getReplicaCoordinates(idx, replicaCount);
                                        return (
                                            <g key={targetName}>
                                                <line 
                                                    x1="50%" y1="34%" x2={coords.left} y2={coords.top} 
                                                    stroke="var(--border)" 
                                                    strokeWidth="2"
                                                    strokeDasharray="4 4"
                                                    opacity={isLineActive('center', targetName) ? 1 : 0.25}
                                                    style={{ transition: 'opacity 0.2s, stroke 0.2s' }}
                                                />
                                                {isLineActive('center', targetName) && (
                                                    <line 
                                                        x1="50%" y1="34%" x2={coords.left} y2={coords.top} 
                                                        stroke="var(--green)" 
                                                        strokeWidth="3.5"
                                                        strokeDasharray="6 4"
                                                        style={{ animation: 'marching-ants 0.6s linear infinite' }}
                                                    />
                                                )}
                                            </g>
                                        );
                                    })}
                                </>
                            ) : (
                                <>
                                    {/* Router -> Shard A */}
                                    <line 
                                        x1="50%" y1="34%" x2="18%" y2="68%" 
                                        stroke="var(--border)" 
                                        strokeWidth="2"
                                        strokeDasharray="4 4"
                                        opacity={isLineActive('center', 'shardA') ? 1 : 0.25}
                                        style={{ transition: 'opacity 0.2s, stroke 0.2s' }}
                                    />
                                    {isLineActive('center', 'shardA') && (
                                        <line 
                                            x1="50%" y1="34%" x2="18%" y2="68%" 
                                            stroke="var(--green)" 
                                            strokeWidth="3.5"
                                            strokeDasharray="6 4"
                                            style={{ animation: 'marching-ants 0.6s linear infinite' }}
                                        />
                                    )}

                                    {/* Router -> Shard B */}
                                    <line 
                                        x1="50%" y1="34%" x2="50%" y2="68%" 
                                        stroke="var(--border)" 
                                        strokeWidth="2"
                                        strokeDasharray="4 4"
                                        opacity={isLineActive('center', 'shardB') ? 1 : 0.25}
                                        style={{ transition: 'opacity 0.2s, stroke 0.2s' }}
                                    />
                                    {isLineActive('center', 'shardB') && (
                                        <line 
                                            x1="50%" y1="34%" x2="50%" y2="68%" 
                                            stroke="var(--green)" 
                                            strokeWidth="3.5"
                                            strokeDasharray="6 4"
                                            style={{ animation: 'marching-ants 0.6s linear infinite' }}
                                        />
                                    )}

                                    {/* Router -> Shard C */}
                                    <line 
                                        x1="50%" y1="34%" x2="82%" y2="68%" 
                                        stroke="var(--border)" 
                                        strokeWidth="2"
                                        strokeDasharray="4 4"
                                        opacity={isLineActive('center', 'shardC') ? 1 : 0.25}
                                        style={{ transition: 'opacity 0.2s, stroke 0.2s' }}
                                    />
                                    {isLineActive('center', 'shardC') && (
                                        <line 
                                            x1="50%" y1="34%" x2="82%" y2="68%" 
                                            stroke="var(--green)" 
                                            strokeWidth="3.5"
                                            strokeDasharray="6 4"
                                            style={{ animation: 'marching-ants 0.6s linear infinite' }}
                                        />
                                    )}
                                </>
                            )}
                        </svg>

                        {/* Node 1: Client Node */}
                        <div style={{
                            position: 'absolute',
                            top: '4%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            border: '2.5px solid var(--border)',
                            background: '#fafafa',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            boxShadow: '3px 3px 0 var(--border)',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            zIndex: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                        }}>
                            <GlobeIcon size={16} color="var(--border)" />
                            <span>APPLICATION CLIENTS</span>
                        </div>

                        {/* Node 2: Center Node (Primary DB or Shard Router) */}
                        {mode === 'replication' ? (
                            <div style={{
                                position: 'absolute',
                                top: '30%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                border: '3px solid var(--border)',
                                background: 'var(--yellow)',
                                width: 230,
                                padding: '0.5rem',
                                borderRadius: '8px',
                                boxShadow: '4px 4px 0 var(--border)',
                                zIndex: 2
                            }}>
                                <div style={{ fontWeight: 800, fontSize: '0.72rem', borderBottom: '1.5px solid var(--border)', paddingBottom: '0.25rem', marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        <DatabaseIcon size={14} />
                                        PRIMARY NODE
                                    </span>
                                    <span style={{ fontSize: '0.55rem', background: '#fff', padding: '1px 3px', borderRadius: '2px', border: '1px solid var(--border)', fontWeight: 'bold' }}>WRITES</span>
                                </div>
                                <div className="no-scrollbar" style={{ maxHeight: 80, overflowY: 'auto' }}>
                                    <table className="neo-table" style={{ fontSize: '0.62rem' }}>
                                        <thead>
                                            <tr><th>id</th><th>name</th><th></th></tr>
                                        </thead>
                                        <tbody>
                                            {primaryDb.map(u => (
                                                <tr key={u.id} style={{ 
                                                    animation: isRowHighlighted(u.id, 'primary') ? 'row-pulse-write 1s infinite' : 'none',
                                                    transition: 'background-color 0.3s'
                                                }}>
                                                    <td>{u.id}</td>
                                                    <td>{u.name}</td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button 
                                                            style={{ background: 'none', border: 'none', color: 'var(--pink)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.65rem', padding: '0 4px' }}
                                                            onClick={() => {
                                                                setPrimaryDb(prev => prev.filter(r => r.id !== u.id));
                                                                setHistory(h => [`[PRIMARY] Instantly deleted row id=${u.id} directly from table.`, ...h.slice(0, 49)]);
                                                            }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Direct Inline table editor */}
                                <div style={{ display: 'flex', gap: '3px', marginTop: '0.4rem', borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
                                    <input 
                                        placeholder="ID"
                                        type="number"
                                        value={directPrimId}
                                        onChange={e => setDirectPrimId(e.target.value)}
                                        style={{ width: '40px', padding: '1px 3px', fontSize: '0.58rem', border: '1.5px solid var(--border)', borderRadius: '2px', fontFamily: 'var(--font-mono)' }}
                                    />
                                    <input 
                                        placeholder="Name"
                                        value={directPrimName}
                                        onChange={e => setDirectPrimName(e.target.value)}
                                        style={{ flex: 1, padding: '1px 3px', fontSize: '0.58rem', border: '1.5px solid var(--border)', borderRadius: '2px' }}
                                    />
                                    <button 
                                        style={{ padding: '2px 5px', fontSize: '0.58rem', background: 'var(--green)', border: '1px solid var(--border)', borderRadius: '2px', cursor: 'pointer', fontWeight: 'bold' }}
                                        onClick={addPrimaryRowDirectly}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                position: 'absolute',
                                top: '28%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                border: '3px solid var(--border)',
                                background: 'var(--purple)',
                                width: 240,
                                padding: '0.5rem 0.75rem',
                                borderRadius: '8px',
                                boxShadow: '4px 4px 0 var(--border)',
                                zIndex: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px'
                            }}>
                                <div style={{ fontWeight: 800, fontSize: '0.72rem', borderBottom: '1.5px solid var(--border)', paddingBottom: '0.25rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                                    <SignalIcon size={14} />
                                    <span>SHARD ROUTER</span>
                                </div>
                                <span style={{ fontSize: '0.6rem', opacity: 0.8, textAlign: 'center' }}>
                                    Strategy: <strong>{shardingStrategy === 'hash' ? 'Modulo Hash (ID % 3)' : 'Range (1-3, 4-6, 7-9)'}</strong>
                                </span>
                                
                                {/* Dynamic Math routing formula card */}
                                {activeRequest && (activeRequest.stage === 'parse-key' || activeRequest.stage === 'route-to-router' || activeRequest.stage === 'route-to-shard') && (
                                    <div style={{
                                        marginTop: '0.4rem',
                                        padding: '4px 8px',
                                        background: '#1e1e2e',
                                        border: '1.5px solid var(--border)',
                                        borderRadius: '4px',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.58rem',
                                        color: '#a6e3a1',
                                        textAlign: 'center',
                                        boxShadow: '1px 1px 0 var(--border)'
                                    }}>
                                        <div style={{ color: '#6c7086', fontSize: '0.48rem', textTransform: 'uppercase', marginBottom: '2px', fontWeight: 'bold' }}>Routing Decision</div>
                                        {shardingStrategy === 'hash' ? (
                                            <span>ID {activeRequest.id} % 3 = <strong style={{ color: '#fff' }}>{activeRequest.id % 3}</strong> → Shard {activeRequest.id % 3 === 0 ? 'A' : activeRequest.id % 3 === 1 ? 'B' : 'C'}</span>
                                        ) : (
                                            <span>ID {activeRequest.id} ∈ <strong style={{ color: '#fff' }}>{activeRequest.id <= 3 ? '[1-3] (A)' : activeRequest.id <= 6 ? '[4-6] (B)' : '[7-9] (C)'}</strong></span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Node 3: Bottom Nodes (Replicas or Shards) */}
                        {mode === 'replication' ? (
                            <div style={{ display: 'flex', width: '100%' }}>
                                {/* Dynamically generated replicas */}
                                {Array.from({ length: replicaCount }).map((_, idx) => {
                                    const repId = idx + 1;
                                    const coords = getReplicaCoordinates(idx, replicaCount);
                                    const replicaData = replicas[repId] || [];
                                    const isTargetStale = (staleAlert === `replica${repId}` || (activeRequest?.isStale && activeRequest?.target === `replica${repId}`));

                                    return (
                                        <div 
                                            key={repId}
                                            style={{
                                                position: 'absolute',
                                                top: coords.top,
                                                left: coords.left,
                                                transform: 'translateX(-50%)',
                                                border: '2.5px solid var(--border)',
                                                background: 'var(--cyan)',
                                                width: replicaCount === 4 ? 135 : replicaCount === 3 ? 165 : 190,
                                                padding: '0.5rem',
                                                borderRadius: '8px',
                                                boxShadow: '3px 3px 0 var(--border)',
                                                zIndex: 2,
                                                transition: 'left 0.3s, width 0.3s'
                                            }}
                                        >
                                            <div style={{ fontWeight: 800, fontSize: '0.68rem', borderBottom: '1.5px solid var(--border)', paddingBottom: '0.2rem', marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                    <DatabaseIcon size={12} />
                                                    REPLICA {repId}
                                                </span>
                                                
                                                {/* Stale Alert Badge */}
                                                {isTargetStale ? (
                                                    <span style={{ 
                                                        fontSize: '0.45rem', 
                                                        background: '#ff5722', 
                                                        color: '#fff', 
                                                        padding: '1px 3px', 
                                                        borderRadius: '2px', 
                                                        fontWeight: 'bold',
                                                        animation: 'pulse 1s infinite'
                                                    }}>STALE READ</span>
                                                ) : (
                                                    <span style={{ fontSize: '0.48rem', background: '#fff', padding: '1px 2px', borderRadius: '2px', border: '1px solid var(--border)', fontWeight: 'bold' }}>READS</span>
                                                )}
                                            </div>
                                            <div className="no-scrollbar" style={{ maxHeight: 75, overflowY: 'auto' }}>
                                                <table className="neo-table" style={{ fontSize: '0.6rem' }}>
                                                    <thead><tr><th>id</th><th>name</th><th></th></tr></thead>
                                                    <tbody>
                                                        {replicaData.map(u => (
                                                            <tr key={u.id} style={{ 
                                                                animation: isRowHighlighted(u.id, `replica${repId}`) 
                                                                    ? (activeRequest?.op === 'WRITE' ? 'row-pulse-sync 1.2s infinite' : 'row-pulse-read 1s infinite') 
                                                                    : 'none',
                                                                transition: 'background-color 0.3s'
                                                            }}>
                                                                <td>{u.id}</td>
                                                                <td>{u.name}</td>
                                                                <td style={{ textAlign: 'right' }}>
                                                                    <button 
                                                                        style={{ background: 'none', border: 'none', color: 'var(--pink)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.65rem', padding: '0 4px' }}
                                                                        onClick={() => {
                                                                            setReplicas(prev => {
                                                                                const next = { ...prev };
                                                                                next[repId] = next[repId].filter(r => r.id !== u.id);
                                                                                return next;
                                                                            });
                                                                            setHistory(h => [`[REPLICA ${repId}] Instantly deleted row id=${u.id} directly from replica.`, ...h.slice(0, 49)]);
                                                                        }}
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Replication Sync Countdown progress bar */}
                                            {activeRequest && activeRequest.stage === 'sync-replicas' && (
                                                <div style={{ marginTop: '0.4rem', fontSize: '0.52rem', color: 'var(--purple)', fontWeight: 'bold' }}>
                                                    <span>Syncing updates ({syncLag}s)...</span>
                                                    <div style={{ width: '100%', height: '5px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', overflow: 'hidden', marginTop: '2px', border: '1px solid var(--border)' }}>
                                                        <motion.div 
                                                            initial={{ width: '0%' }}
                                                            animate={{ width: '100%' }}
                                                            transition={{ duration: syncLag, ease: 'linear' }}
                                                            style={{ height: '100%', background: 'var(--purple)' }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', width: '100%' }}>
                                {/* Shard A */}
                                <div style={{
                                    position: 'absolute',
                                    top: '68%',
                                    left: '18%',
                                    transform: 'translateX(-50%)',
                                    border: '2.5px solid var(--border)',
                                    background: 'var(--pink)',
                                    width: 180,
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    boxShadow: '3px 3px 0 var(--border)',
                                    zIndex: 2
                                }}>
                                    <div style={{ fontWeight: 800, fontSize: '0.65rem', borderBottom: '1.5px solid var(--border)', paddingBottom: '0.2rem', marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <DatabaseIcon size={12} />
                                            SHARD A
                                        </span>
                                        {hotspotShard === 'shardA' ? (
                                            <span style={{ 
                                                fontSize: '0.48rem', 
                                                background: '#ff5722', 
                                                color: '#fff', 
                                                padding: '1px 3px', 
                                                borderRadius: '2px', 
                                                fontWeight: 'bold',
                                                animation: 'pulse 1s infinite'
                                            }}>HOTSPOT</span>
                                        ) : (
                                            <span style={{ fontSize: '0.48rem', opacity: 0.8 }}>ID: 3, 6, 9</span>
                                        )}
                                    </div>
                                    <div className="no-scrollbar" style={{ maxHeight: 75, overflowY: 'auto' }}>
                                        <table className="neo-table" style={{ fontSize: '0.6rem' }}>
                                            <thead><tr><th>id</th><th>name</th><th></th></tr></thead>
                                            <tbody>
                                                {shards.shardA.map(u => (
                                                    <tr key={u.id} style={{ 
                                                        background: isRowHighlighted(u.id, 'shardA') 
                                                            ? (activeRequest?.op === 'WRITE' ? 'row-pulse-write 1.2s infinite' : 'row-pulse-read 1s infinite') 
                                                            : 'none',
                                                        transition: 'background-color 0.3s'
                                                    }}>
                                                        <td>{u.id}</td>
                                                        <td>{u.name}</td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <button 
                                                                style={{ background: 'none', border: 'none', color: 'var(--pink)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.65rem', padding: '0 4px' }}
                                                                onClick={() => {
                                                                    setShards(prev => {
                                                                        const next = { ...prev };
                                                                        next.shardA = next.shardA.filter(r => r.id !== u.id);
                                                                        return next;
                                                                    });
                                                                    setHistory(h => [`[SHARD A] Instantly deleted row id=${u.id} directly from shard.`, ...h.slice(0, 49)]);
                                                                }}
                                                            >
                                                                ✕
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Direct Inline Table Form */}
                                    <div style={{ display: 'flex', gap: '3px', marginTop: '0.4rem', borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
                                        <input 
                                            placeholder="ID"
                                            type="number"
                                            value={directShardAId}
                                            onChange={e => setDirectShardAId(e.target.value)}
                                            style={{ width: '30px', padding: '1px 2px', fontSize: '0.55rem', border: '1px solid var(--border)', borderRadius: '2px', fontFamily: 'var(--font-mono)' }}
                                        />
                                        <input 
                                            placeholder="Name"
                                            value={directShardAName}
                                            onChange={e => setDirectShardAName(e.target.value)}
                                            style={{ flex: 1, padding: '1px 2px', fontSize: '0.55rem', border: '1px solid var(--border)', borderRadius: '2px' }}
                                        />
                                        <button 
                                            style={{ padding: '2px 4px', fontSize: '0.55rem', background: 'var(--green)', border: '1px solid var(--border)', borderRadius: '2px', cursor: 'pointer', fontWeight: 'bold' }}
                                            onClick={() => addShardRowDirectly('shardA', directShardAId, directShardAName, setDirectShardAId, setDirectShardAName)}
                                        >
                                            +
                                        </button>
                                    </div>

                                    {/* Storage Load Gauge */}
                                    <div style={{ marginTop: '0.4rem', fontSize: '0.55rem', color: '#555' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '0.52rem', fontWeight: 'bold' }}>
                                            <span>LOAD:</span>
                                            <span>{shards.shardA.length} / 8 rows</span>
                                        </div>
                                        <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                            <div style={{ 
                                                width: `${Math.min((shards.shardA.length / 8) * 100, 100)}%`, 
                                                height: '100%', 
                                                background: hotspotShard === 'shardA' ? '#ff5722' : 'var(--green)',
                                                transition: 'width 0.3s'
                                            }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Shard B */}
                                <div style={{
                                    position: 'absolute',
                                    top: '68%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    border: '2.5px solid var(--border)',
                                    background: 'var(--cyan)',
                                    width: 180,
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    boxShadow: '3px 3px 0 var(--border)',
                                    zIndex: 2
                                }}>
                                    <div style={{ fontWeight: 800, fontSize: '0.65rem', borderBottom: '1.5px solid var(--border)', paddingBottom: '0.2rem', marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <DatabaseIcon size={12} />
                                            SHARD B
                                        </span>
                                        {hotspotShard === 'shardB' ? (
                                            <span style={{ 
                                                fontSize: '0.48rem', 
                                                background: '#ff5722', 
                                                color: '#fff', 
                                                padding: '1px 3px', 
                                                borderRadius: '2px', 
                                                fontWeight: 'bold',
                                                animation: 'pulse 1s infinite'
                                            }}>HOTSPOT</span>
                                        ) : (
                                            <span style={{ fontSize: '0.48rem', opacity: 0.8 }}>ID: 1, 4, 7</span>
                                        )}
                                    </div>
                                    <div className="no-scrollbar" style={{ maxHeight: 75, overflowY: 'auto' }}>
                                        <table className="neo-table" style={{ fontSize: '0.6rem' }}>
                                            <thead><tr><th>id</th><th>name</th><th></th></tr></thead>
                                            <tbody>
                                                {shards.shardB.map(u => (
                                                    <tr key={u.id} style={{ 
                                                        background: isRowHighlighted(u.id, 'shardB') 
                                                            ? (activeRequest?.op === 'WRITE' ? 'row-pulse-write 1.2s infinite' : 'row-pulse-read 1s infinite') 
                                                            : 'none',
                                                        transition: 'background-color 0.3s'
                                                    }}>
                                                        <td>{u.id}</td>
                                                        <td>{u.name}</td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <button 
                                                                style={{ background: 'none', border: 'none', color: 'var(--pink)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.65rem', padding: '0 4px' }}
                                                                onClick={() => {
                                                                    setShards(prev => {
                                                                        const next = { ...prev };
                                                                        next.shardB = next.shardB.filter(r => r.id !== u.id);
                                                                        return next;
                                                                    });
                                                                    setHistory(h => [`[SHARD B] Instantly deleted row id=${u.id} directly from shard.`, ...h.slice(0, 49)]);
                                                                }}
                                                            >
                                                                ✕
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Direct Inline Table Form */}
                                    <div style={{ display: 'flex', gap: '3px', marginTop: '0.4rem', borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
                                        <input 
                                            placeholder="ID"
                                            type="number"
                                            value={directShardBId}
                                            onChange={e => setDirectShardBId(e.target.value)}
                                            style={{ width: '30px', padding: '1px 2px', fontSize: '0.55rem', border: '1px solid var(--border)', borderRadius: '2px', fontFamily: 'var(--font-mono)' }}
                                        />
                                        <input 
                                            placeholder="Name"
                                            value={directShardBName}
                                            onChange={e => setDirectShardBName(e.target.value)}
                                            style={{ flex: 1, padding: '1px 2px', fontSize: '0.55rem', border: '1px solid var(--border)', borderRadius: '2px' }}
                                        />
                                        <button 
                                            style={{ padding: '2px 4px', fontSize: '0.55rem', background: 'var(--green)', border: '1px solid var(--border)', borderRadius: '2px', cursor: 'pointer', fontWeight: 'bold' }}
                                            onClick={() => addShardRowDirectly('shardB', directShardBId, directShardBName, setDirectShardBId, setDirectShardBName)}
                                        >
                                            +
                                        </button>
                                    </div>

                                    {/* Storage Load Gauge */}
                                    <div style={{ marginTop: '0.4rem', fontSize: '0.55rem', color: '#555' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '0.52rem', fontWeight: 'bold' }}>
                                            <span>LOAD:</span>
                                            <span>{shards.shardB.length} / 8 rows</span>
                                        </div>
                                        <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                            <div style={{ 
                                                width: `${Math.min((shards.shardB.length / 8) * 100, 100)}%`, 
                                                height: '100%', 
                                                background: hotspotShard === 'shardB' ? '#ff5722' : 'var(--green)',
                                                transition: 'width 0.3s'
                                            }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Shard C */}
                                <div style={{
                                    position: 'absolute',
                                    top: '68%',
                                    left: '82%',
                                    transform: 'translateX(-50%)',
                                    border: '2.5px solid var(--border)',
                                    background: 'var(--yellow)',
                                    width: 180,
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    boxShadow: '3px 3px 0 var(--border)',
                                    zIndex: 2
                                }}>
                                    <div style={{ fontWeight: 800, fontSize: '0.65rem', borderBottom: '1.5px solid var(--border)', paddingBottom: '0.2rem', marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <DatabaseIcon size={12} />
                                            SHARD C
                                        </span>
                                        {hotspotShard === 'shardC' ? (
                                            <span style={{ 
                                                fontSize: '0.48rem', 
                                                background: '#ff5722', 
                                                color: '#fff', 
                                                padding: '1px 3px', 
                                                borderRadius: '2px', 
                                                fontWeight: 'bold',
                                                animation: 'pulse 1s infinite'
                                            }}>HOTSPOT</span>
                                        ) : (
                                            <span style={{ fontSize: '0.48rem', opacity: 0.8 }}>ID: 2, 5, 8</span>
                                        )}
                                    </div>
                                    <div className="no-scrollbar" style={{ maxHeight: 75, overflowY: 'auto' }}>
                                        <table className="neo-table" style={{ fontSize: '0.6rem' }}>
                                            <thead><tr><th>id</th><th>name</th><th></th></tr></thead>
                                            <tbody>
                                                {shards.shardC.map(u => (
                                                    <tr key={u.id} style={{ 
                                                        background: isRowHighlighted(u.id, 'shardC') 
                                                            ? (activeRequest?.op === 'WRITE' ? 'row-pulse-write 1.2s infinite' : 'row-pulse-read 1s infinite') 
                                                            : 'none',
                                                        transition: 'background-color 0.3s'
                                                    }}>
                                                        <td>{u.id}</td>
                                                        <td>{u.name}</td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <button 
                                                                style={{ background: 'none', border: 'none', color: 'var(--pink)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.65rem', padding: '0 4px' }}
                                                                onClick={() => {
                                                                    setShards(prev => {
                                                                        const next = { ...prev };
                                                                        next.shardC = next.shardC.filter(r => r.id !== u.id);
                                                                        return next;
                                                                    });
                                                                    setHistory(h => [`[SHARD C] Instantly deleted row id=${u.id} directly from shard.`, ...h.slice(0, 49)]);
                                                                }}
                                                            >
                                                                ✕
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Direct Inline Table Form */}
                                    <div style={{ display: 'flex', gap: '3px', marginTop: '0.4rem', borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
                                        <input 
                                            placeholder="ID"
                                            type="number"
                                            value={directShardCId}
                                            onChange={e => setDirectShardCId(e.target.value)}
                                            style={{ width: '30px', padding: '1px 2px', fontSize: '0.55rem', border: '1px solid var(--border)', borderRadius: '2px', fontFamily: 'var(--font-mono)' }}
                                        />
                                        <input 
                                            placeholder="Name"
                                            value={directShardCName}
                                            onChange={e => setDirectShardCName(e.target.value)}
                                            style={{ flex: 1, padding: '1px 2px', fontSize: '0.55rem', border: '1px solid var(--border)', borderRadius: '2px' }}
                                        />
                                        <button 
                                            style={{ padding: '2px 4px', fontSize: '0.55rem', background: 'var(--green)', border: '1px solid var(--border)', borderRadius: '2px', cursor: 'pointer', fontWeight: 'bold' }}
                                            onClick={() => addShardRowDirectly('shardC', directShardCId, directShardCName, setDirectShardCId, setDirectShardCName)}
                                        >
                                            +
                                        </button>
                                    </div>

                                    {/* Storage Load Gauge */}
                                    <div style={{ marginTop: '0.4rem', fontSize: '0.55rem', color: '#555' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '0.52rem', fontWeight: 'bold' }}>
                                            <span>LOAD:</span>
                                            <span>{shards.shardC.length} / 8 rows</span>
                                        </div>
                                        <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                            <div style={{ 
                                                width: `${Math.min((shards.shardC.length / 8) * 100, 100)}%`, 
                                                height: '100%', 
                                                background: hotspotShard === 'shardC' ? '#ff5722' : 'var(--green)',
                                                transition: 'width 0.3s'
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Animated Packets */}
                        <AnimatePresence>
                            {activePackets.map(pkt => {
                                const isStep0 = pkt.step === 0;
                                let targetLeft = '50%';
                                let targetTop = '68%';
                                let pillText = '';
                                let pillColor = 'var(--cyan)';
                                let textColor = '#000';

                                if (pkt.type === 'write') {
                                    pillText = `WRITE id=${activeRequest?.id || '?'}`;
                                    pillColor = 'var(--pink)';
                                    textColor = '#fff';
                                } else if (pkt.type === 'read') {
                                    pillText = `READ id=${activeRequest?.id || '?'}`;
                                    pillColor = 'var(--cyan)';
                                    textColor = '#000';
                                } else if (pkt.type === 'sync') {
                                    pillText = `SYNC id=${activeRequest?.id || '?'}`;
                                    pillColor = 'var(--purple)';
                                    textColor = '#fff';
                                }

                                if (mode === 'replication') {
                                    if (pkt.type === 'write') {
                                        targetLeft = '50%';
                                        targetTop = '30%';
                                    } else if (pkt.type === 'read') {
                                        // Find coordinate of target replica
                                        const repId = parseInt(pkt.target.replace('replica', '')) || 1;
                                        const coords = getReplicaCoordinates(repId - 1, replicaCount);
                                        targetLeft = coords.left;
                                        targetTop = coords.top;
                                    } else if (pkt.type === 'sync') {
                                        // Replication Sync (Starts at Primary Center and goes to target replica)
                                        const repId = parseInt(pkt.target.replace('replica', '')) || 1;
                                        const coords = getReplicaCoordinates(repId - 1, replicaCount);
                                        return (
                                            <motion.div
                                                key={pkt.id}
                                                initial={{ top: '34%', left: '50%', x: '-50%', y: '-50%', scale: 0.6, opacity: 0 }}
                                                animate={{
                                                    top: coords.top,
                                                    left: coords.left,
                                                    x: '-50%',
                                                    y: '-50%',
                                                    scale: 1,
                                                    opacity: 1
                                                }}
                                                exit={{ opacity: 0, scale: 0.6 }}
                                                transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                                                style={{
                                                    position: 'absolute',
                                                    padding: '3px 8px',
                                                    borderRadius: '20px',
                                                    border: '2px solid var(--border)',
                                                    background: 'var(--purple)',
                                                    boxShadow: '3px 3px 0 var(--border)',
                                                    color: '#fff',
                                                    fontFamily: 'var(--font-mono)',
                                                    fontSize: '0.55rem',
                                                    fontWeight: 'bold',
                                                    zIndex: 10,
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {pillText}
                                            </motion.div>
                                        );
                                    }
                                } else {
                                    // Sharding mode
                                    targetTop = '68%';
                                    targetLeft = pkt.target === 'shardA' ? '18%' : pkt.target === 'shardB' ? '50%' : '82%';
                                }

                                return (
                                    <motion.div
                                        key={pkt.id}
                                        initial={{ top: '8%', left: '50%', x: '-50%', y: '-50%', scale: 0.6, opacity: 0 }}
                                        animate={isStep0 
                                            ? { top: '28%', left: '50%', x: '-50%', y: '-50%', scale: 1, opacity: 1 } 
                                            : { top: targetTop, left: targetLeft, x: '-50%', y: '-50%', scale: 1, opacity: 1 }
                                        }
                                        exit={{ opacity: 0, scale: 0.6 }}
                                        transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                                        style={{
                                            position: 'absolute',
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            border: '2px solid var(--border)',
                                            background: pillColor,
                                            boxShadow: '3px 3px 0 var(--border)',
                                            color: textColor,
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: '0.58rem',
                                            fontWeight: 'bold',
                                            zIndex: 10,
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {pillText}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Console Log - 300px expand height with scroll */}
                    <div style={{
                        height: 300,
                        border: '2.5px solid var(--border)',
                        background: '#1e1e2e',
                        borderRadius: '6px',
                        boxShadow: '3px 3px 0 var(--border)',
                        padding: '0.6rem 1rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        color: '#cdd6f4',
                        overflowY: 'auto',
                        flexShrink: 0,
                        marginTop: '1rem'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            color: '#6c7086', 
                            borderBottom: '1px solid rgba(255,255,255,0.06)', 
                            paddingBottom: '4px', 
                            marginBottom: '6px',
                            fontWeight: 'bold',
                            fontSize: '0.65rem',
                            textTransform: 'uppercase'
                        }}>
                            <span>DATABASE OPERATIONS LOGS</span>
                            <span style={{ color: 'var(--cyan)' }}>{totalOps} / 10 Ops</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {history.map((log, lIdx) => {
                                const isWarning = log.includes('[WARNING]') || log.includes('[STALE READ]');
                                return (
                                    <div key={lIdx} style={{
                                        color: isWarning ? '#e67e22' : log.startsWith('[WRITE]') ? '#f38ba8' : log.startsWith('[READ]') ? '#89b4fa' : log.startsWith('[SYNC]') ? '#a6e3a1' : '#cdd6f4',
                                        padding: '2px 0',
                                        borderBottom: '1px solid rgba(255,255,255,0.02)'
                                    }}>
                                        <span style={{ color: '#6c7086', marginRight: '6px' }}>&gt;</span>
                                        {log}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            }
            rightContent={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.78rem', lineHeight: 1.5 }}>
                    <div className="panel" style={{ boxShadow: '2px 2px 0 var(--border)' }}>
                        <div className="panel-header" style={{ background: 'var(--pink)', padding: '4px 8px', fontSize: '0.72rem' }}>
                            Learning Lab
                        </div>
                        <div style={{ padding: '0.6rem', background: '#fff' }}>
                            <p><strong>Primary-Replica Replication:</strong></p>
                            <p style={{ opacity: 0.8, marginTop: '0.2rem' }}>
                                To scale read throughput, writes update the Primary node, which asynchronously propagates copies to Read Replicas. If a read is executed before the sync finishes, a **Stale Read** occurs.
                            </p>

                            <p style={{ marginTop: '0.6rem' }}><strong>What is Database Sharding?</strong></p>
                            <p style={{ opacity: 0.8, marginTop: '0.2rem' }}>
                                Sharding partitions records across multiple database nodes based on a sharding key. Modulo Hashing spreads rows evenly, whereas Range partitioning can create storage **Hotspots** when keys are sequential.
                            </p>
                        </div>
                    </div>
                </div>
            }
            legend={[
                { color: 'var(--pink)', label: 'Write Query' },
                { color: 'var(--cyan)', label: 'Read Query' },
                { color: 'var(--purple)', label: 'Sync Pipeline' }
            ]}
        />
    );
}
