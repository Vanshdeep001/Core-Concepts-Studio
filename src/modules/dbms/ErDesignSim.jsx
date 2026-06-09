import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import { FileIcon, LinkIcon, SyncIcon, KeyIcon, SwirlIcon, ZapIcon, ClipboardIcon, BlueprintIcon, CrownIcon, CheckIcon, WrenchIcon, BuildIcon, GearIcon } from '../../components/Icons';

export default function ErDesignSim() {
    const [speed, setSpeed] = useState(700);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [conceptMode, setConceptMode] = useState(false);

    // ─── LARGE CANVAS INITIAL COORDINATE POSITIONS ───
    const [positions, setPositions] = useState({
        ent_student: { x: 100, y: 150 },
        ent_course: { x: 750, y: 150 },
        rel_enrolls: { x: 460, y: 185 }
    });

    const [draggedNode, setDraggedNode] = useState(null);
    const [dragStart, setDragStart] = useState({ mouseX: 0, mouseY: 0, nodeX: 0, nodeY: 0 });

    const canvasRef = useRef(null);

    // ER Canvas state - Starts with two beautiful default tables
    const [entities, setEntities] = useState([
        { id: 'ent_student', name: 'Student', isWeak: false, participation: 'partial' },
        { id: 'ent_course', name: 'Course', isWeak: false, participation: 'partial' }
    ]);

    const [relationships, setRelationships] = useState([
        { id: 'rel_enrolls', name: 'Enrolls', entA: 'ent_student', entB: 'ent_course', cardinality: 'M:N', isWeak: false }
    ]);

    const [attributes, setAttributes] = useState([
        { id: 'attr_roll', name: 'RollNo', entId: 'ent_student', type: 'primary' },
        { id: 'attr_sname', name: 'SName', entId: 'ent_student', type: 'simple' },
        { id: 'attr_cid', name: 'CourseID', entId: 'ent_course', type: 'primary' },
        { id: 'attr_cname', name: 'CName', entId: 'ent_course', type: 'simple' }
    ]);

    // Manual relationship builder form state
    const [newRelName, setNewRelName] = useState('Teaches');
    const [newRelEntA, setNewRelEntA] = useState('ent_student');
    const [newRelEntB, setNewRelEntB] = useState('ent_course');
    const [newRelCard, setNewRelCard] = useState('1:N');

    // Active hovered element for schema highlighting
    const [hoveredElement, setHoveredElement] = useState(null);

    // Dynamic Compilation Steps State
    const [currentStep, setCurrentStep] = useState(-1); // -1 means simulation hasn't started yet

    // Sync form selectors when entities list changes
    useEffect(() => {
        if (entities.length > 0) {
            const entIds = entities.map(e => e.id);
            if (!entIds.includes(newRelEntA)) {
                setNewRelEntA(entities[0].id);
            }
            if (!entIds.includes(newRelEntB)) {
                setNewRelEntB(entities[entities.length > 1 ? 1 : 0].id);
            }
        } else {
            setNewRelEntA('');
            setNewRelEntB('');
        }
    }, [entities, newRelEntA, newRelEntB]);

    // Handle smooth relative dragging with scrollbar adjustments
    const handlePointerDown = (id, e) => {
        // Stop drag trigger on interaction with inputs, selectors, and buttons
        if (
            e.target.tagName === 'INPUT' || 
            e.target.tagName === 'SELECT' || 
            e.target.tagName === 'BUTTON' || 
            e.target.closest('button')
        ) {
            return;
        }
        if (e.button !== 0) return; // Only drag with left click
        e.preventDefault();
        e.stopPropagation();

        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const currentPos = positions[id] || { x: 100, y: 100 };
            
            // Mouse pointer coordinates relative to the canvas client rect
            const pointerX = e.clientX - rect.left;
            const pointerY = e.clientY - rect.top;

            setDraggedNode(id);
            setDragStart({
                mouseX: pointerX,
                mouseY: pointerY,
                nodeX: currentPos.x,
                nodeY: currentPos.y
            });
        }
    };

    const handlePointerMove = (e) => {
        if (!draggedNode) return;
        e.preventDefault();

        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            
            // Pointer coordinates relative to the canvas client rect
            const pointerX = e.clientX - rect.left;
            const pointerY = e.clientY - rect.top;

            const dx = pointerX - dragStart.mouseX;
            const dy = pointerY - dragStart.mouseY;

            let newX = dragStart.nodeX + dx;
            let newY = dragStart.nodeY + dy;

            // Clamping cards cleanly to stay completely inside the huge scrollable canvas workspace
            // Virtual size is 2400px x 1600px
            const scrollWidth = canvasRef.current.scrollWidth || 2400;
            const scrollHeight = canvasRef.current.scrollHeight || 1600;

            const cardWidth = draggedNode.startsWith('rel_') ? 130 : 200;
            const cardHeight = draggedNode.startsWith('rel_') ? 130 : 160;

            newX = Math.max(10, Math.min(scrollWidth - cardWidth - 10, newX));
            newY = Math.max(10, Math.min(scrollHeight - cardHeight - 10, newY));

            setPositions(prev => ({
                ...prev,
                [draggedNode]: { x: newX, y: newY }
            }));
        }
    };

    const handlePointerUp = () => {
        setDraggedNode(null);
    };

    // Cycle cardinalities: 1:1 -> 1:N -> M:N
    const cycleCardinality = (relId) => {
        setRelationships(prev => prev.map(r => {
            if (r.id === relId) {
                const nextCard = r.cardinality === '1:1' ? '1:N' : r.cardinality === '1:N' ? 'M:N' : '1:1';
                return { ...r, cardinality: nextCard };
            }
            return r;
        }));
    };

    // Toggle entity weakness
    const toggleWeak = (entId) => {
        setEntities(prev => prev.map(e => {
            if (e.id === entId) {
                const nextWeak = !e.isWeak;
                // If it becomes weak, auto set its relationships to weak
                setRelationships(rPrev => rPrev.map(r => {
                    if (r.entA === entId || r.entB === entId) {
                        return { ...r, isWeak: nextWeak, cardinality: '1:N' };
                    }
                    return r;
                }));
                return { ...e, isWeak: nextWeak };
            }
            return e;
        }));
    };

    // Toggle entity participation constraints
    const toggleParticipation = (entId) => {
        setEntities(prev => prev.map(e => (
            e.id === entId ? { ...e, participation: e.participation === 'partial' ? 'total' : 'partial' } : e
        )));
    };

    // Cycle attribute types
    const cycleAttributeType = (attrId) => {
        setAttributes(prev => prev.map(a => {
            if (a.id === attrId) {
                const nextType = a.type === 'primary' ? 'simple' : a.type === 'simple' ? 'multivalued' : a.type === 'multivalued' ? 'derived' : 'primary';
                return { ...a, type: nextType };
            }
            return a;
        }));
    };

    // Add entities manually
    const addCustomEntity = () => {
        const id = `ent_custom_${Date.now()}`;
        setEntities(prev => [...prev, { id, name: 'CustomTable', isWeak: false, participation: 'partial' }]);
        setAttributes(prev => [...prev, { id: `attr_pk_${Date.now()}`, name: 'ID', entId: id, type: 'primary' }]);
        
        // Spawn inside virtual canvas bounds
        const x = Math.floor(Math.random() * 400) + 150;
        const y = Math.floor(Math.random() * 300) + 200;
        setPositions(prev => ({
            ...prev,
            [id]: { x, y }
        }));
    };

    // Delete Entity
    const deleteEntity = (entId) => {
        setEntities(prev => prev.filter(e => e.id !== entId));
        setAttributes(prev => prev.filter(a => a.entId !== entId));
        setRelationships(prev => prev.filter(r => r.entA !== entId && r.entB !== entId));
    };

    // Rename Entity manually
    const renameEntity = (entId, newName) => {
        setEntities(prev => prev.map(e => e.id === entId ? { ...e, name: newName } : e));
    };

    // Add column manually
    const addColumn = (entId, colName) => {
        const id = `attr_col_${Date.now()}`;
        setAttributes(prev => [...prev, { id, name: colName, entId, type: 'simple' }]);
    };

    // Delete Column manually
    const deleteAttribute = (attrId) => {
        setAttributes(prev => prev.filter(a => a.id !== attrId));
    };

    // Rename Column/Attribute manually
    const renameAttribute = (attrId, newName) => {
        setAttributes(prev => prev.map(a => {
            if (a.id === attrId) {
                return { ...a, name: newName };
            }
            return a;
        }));
    };

    // Add custom relationship manually
    const addCustomRelationship = (e) => {
        e.preventDefault();
        if (newRelEntA === newRelEntB) {
            alert("Relationships connect two DIFFERENT tables!");
            return;
        }
        const id = `rel_custom_${Date.now()}`;
        setRelationships(prev => [...prev, {
            id, name: newRelName, entA: newRelEntA, entB: newRelEntB, cardinality: newRelCard, isWeak: false
        }]);

        // Place on canvas automatically in the horizontal center of the two entities
        const posA = positions[newRelEntA] || { x: 100, y: 150 };
        const posB = positions[newRelEntB] || { x: 750, y: 150 };
        const x = (posA.x + posB.x) / 2 + 35;
        const y = (posA.y + posB.y) / 2 + 15;

        setPositions(prev => ({
            ...prev,
            [id]: { x, y }
        }));
    };

    // Delete Relationship manually
    const deleteRelationship = (relId) => {
        setRelationships(prev => prev.filter(r => r.id !== relId));
    };

    /* ══════════════════════════════════════════
       RELATIONAL MAPPING COMPILING RULES
       ══════════════════════════════════════════ */
    const compileSchema = () => {
        const tables = [];

        // 1. Map basic entities
        entities.forEach(ent => {
            const entAttrs = attributes.filter(a => a.entId === ent.id);
            const cols = entAttrs.filter(a => a.type !== 'multivalued' && a.type !== 'derived').map(a => ({
                name: a.name,
                isPK: a.type === 'primary',
                isFK: false,
                isNullable: ent.participation === 'partial'
            }));

            // Check if this entity has a 1:N relationship pointing to it
            relationships.forEach(rel => {
                if (rel.cardinality === '1:N') {
                    if (rel.entB === ent.id) {
                        const parentEnt = entities.find(e => e.id === rel.entA);
                        const parentPK = attributes.find(a => a.entId === rel.entA && a.type === 'primary');
                        if (parentPK && parentEnt) {
                            cols.push({
                                name: `${parentEnt.name}_${parentPK.name} (FK)`,
                                isPK: ent.isWeak,
                                isFK: true,
                                isNullable: ent.participation === 'partial'
                            });
                        }
                    }
                } else if (rel.cardinality === '1:1') {
                    if (rel.entB === ent.id) {
                        const parentEnt = entities.find(e => e.id === rel.entA);
                        const parentPK = attributes.find(a => a.entId === rel.entA && a.type === 'primary');
                        if (parentPK && parentEnt) {
                            cols.push({
                                name: `${parentEnt.name}_${parentPK.name} (FK)`,
                                isPK: false,
                                isFK: true,
                                isNullable: ent.participation === 'partial'
                            });
                        }
                    }
                }
            });

            tables.push({
                id: `tab_${ent.id}`,
                name: ent.name,
                columns: cols
            });

            // Map Multivalued Attributes to separate tables
            entAttrs.filter(a => a.type === 'multivalued').forEach(a => {
                const pkAttr = entAttrs.find(attr => attr.type === 'primary');
                tables.push({
                    id: `tab_multival_${a.id}`,
                    name: `${ent.name}_${a.name}`,
                    columns: [
                        { name: `${ent.name}_${pkAttr ? pkAttr.name : 'ID'} (FK)`, isPK: true, isFK: true, isNullable: false },
                        { name: a.name, isPK: true, isFK: false, isNullable: false }
                    ]
                });
            });
        });

        // 2. Map M:N Relationships to Junction Tables
        relationships.forEach(rel => {
            if (rel.cardinality === 'M:N') {
                const entA = entities.find(e => e.id === rel.entA);
                const entB = entities.find(e => e.id === rel.entB);
                const pkA = attributes.find(a => a.entId === rel.entA && a.type === 'primary');
                const pkB = attributes.find(a => a.entId === rel.entB && a.type === 'primary');

                if (entA && entB && pkA && pkB) {
                    tables.push({
                        id: `tab_junction_${rel.id}`,
                        name: rel.name,
                        columns: [
                            { name: `${entA.name}_${pkA.name} (FK)`, isPK: true, isFK: true, isNullable: false },
                            { name: `${entB.name}_${pkB.name} (FK)`, isPK: true, isFK: true, isNullable: false }
                        ]
                    });
                }
            }
        });

        return tables;
    };

    const compiledTables = compileSchema();

    // ─── DYNAMIC COMPILATION FLOW STEP ENGINE ───
    const compSteps = useMemo(() => {
        const steps = [];

        // 1. Basic Strong Entity mapping
        entities.forEach(ent => {
            const simpleAttrs = attributes.filter(a => a.entId === ent.id && a.type === 'simple');
            steps.push({
                type: 'entity',
                id: ent.id,
                title: `Map Table: ${ent.name}`,
                desc: `Step 1: Translate entity '${ent.name}' into a standalone Relational Table. Simple attributes (${simpleAttrs.map(a => a.name).join(', ') || 'none'}) are declared as basic primitive columns.`
            });
        });

        // 2. Primary Key constraints
        entities.forEach(ent => {
            const pk = attributes.find(a => a.entId === ent.id && a.type === 'primary');
            if (pk) {
                steps.push({
                    type: 'pk',
                    id: pk.id,
                    entId: ent.id,
                    title: `Mark PK: ${ent.name}.${pk.name}`,
                    desc: `Step 2: Assign column '${pk.name}' as the PRIMARY KEY (PK) for relation '${ent.name}'. This enforces structural integrity and index uniqueness.`
                });
            }
        });

        // 3. Weak Entities checking
        entities.forEach(ent => {
            if (ent.isWeak) {
                steps.push({
                    type: 'weak',
                    id: ent.id,
                    title: `Resolve Weak: ${ent.name}`,
                    desc: `Step 3: '${ent.name}' is registered as a WEAK entity! It lacks a distinct identifier, requiring composite primary key binding from its owner entity.`
                });
            }
        });

        // 4. Resolve 1:1 and 1:N connections
        relationships.forEach(rel => {
            if (rel.cardinality !== 'M:N') {
                const entA = entities.find(e => e.id === rel.entA);
                const entB = entities.find(e => e.id === rel.entB);
                steps.push({
                    type: 'rel_1_n',
                    id: rel.id,
                    title: `Map FK: ${rel.name} (${rel.cardinality})`,
                    desc: `Step 4: Establish the '${rel.cardinality}' relationship '${rel.name}' by inserting a FOREIGN KEY (FK) referencing '${entA?.name}' inside table '${entB?.name}'.`
                });
            }
        });

        // 5. Resolve M:N Junction mapping
        relationships.forEach(rel => {
            if (rel.cardinality === 'M:N') {
                const entA = entities.find(e => e.id === rel.entA);
                const entB = entities.find(e => e.id === rel.entB);
                steps.push({
                    type: 'rel_m_n',
                    id: rel.id,
                    title: `Map Junction: ${rel.name} (M:N)`,
                    desc: `Step 5: Translate M:N relationship '${rel.name}' into a dedicated **Junction Table**. This table aggregates composite foreign keys referencing both '${entA?.name}' and '${entB?.name}'.`
                });
            }
        });

        // 6. Multivalued attributes
        attributes.forEach(attr => {
            if (attr.type === 'multivalued') {
                const ent = entities.find(e => e.id === attr.entId);
                steps.push({
                    type: 'multivalued',
                    id: attr.id,
                    entId: attr.entId,
                    title: `Extract Multivalued: ${attr.name}`,
                    desc: `Step 6: Attribute '${attr.name}' of '${ent?.name}' is MULTIVALUED. To achieve 1st Normal Form (1NF), it splits into a separate child table linking composite primary keys.`
                });
            }
        });

        return steps;
    }, [entities, attributes, relationships]);

    // Interval handler to run the simulation tick-by-tick
    useEffect(() => {
        let interval = null;
        if (isRunning && !isPaused && !isFinished) {
            interval = setInterval(() => {
                setCurrentStep(prev => {
                    const next = prev + 1;
                    if (next >= compSteps.length) {
                        setIsFinished(true);
                        setIsRunning(false);
                        return prev;
                    }
                    return next;
                });
            }, speed);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, isPaused, isFinished, speed, compSteps.length]);

    // Handle Reset
    const handleReset = () => {
        setEntities([
            { id: 'ent_student', name: 'Student', isWeak: false, participation: 'partial' },
            { id: 'ent_course', name: 'Course', isWeak: false, participation: 'partial' }
        ]);
        setRelationships([
            { id: 'rel_enrolls', name: 'Enrolls', entA: 'ent_student', entB: 'ent_course', cardinality: 'M:N', isWeak: false }
        ]);
        setAttributes([
            { id: 'attr_roll', name: 'RollNo', entId: 'ent_student', type: 'primary' },
            { id: 'attr_sname', name: 'SName', entId: 'ent_student', type: 'simple' },
            { id: 'attr_cid', name: 'CourseID', entId: 'ent_course', type: 'primary' },
            { id: 'attr_cname', name: 'CName', entId: 'ent_course', type: 'simple' }
        ]);
        setPositions({
            ent_student: { x: 100, y: 150 },
            ent_course: { x: 750, y: 150 },
            rel_enrolls: { x: 460, y: 185 }
        });
        setIsRunning(false);
        setIsPaused(false);
        setIsFinished(false);
        setCurrentStep(-1);
    };

    // Calculate center coordinates of nodes for rendering solid connection lines
    const getEntityCenter = (entId) => {
        const pos = positions[entId] || { x: 100, y: 150 };
        return { x: pos.x + 100, y: pos.y + 60 };
    };

    const getRelationshipCenter = (relId) => {
        const pos = positions[relId] || { x: 460, y: 185 };
        return { x: pos.x + 65, y: pos.y + 65 };
    };

    // Identify which elements are currently active in the simulation for highlighting
    const activeStepInfo = currentStep >= 0 && currentStep < compSteps.length ? compSteps[currentStep] : null;

    return (
        <ImmersiveLayout
            isActive={true}
            title="ER Diagram to Relational Schema Mapping" icon={<BuildIcon size={22} />} moduleLabel="DBMS Module"
            isRunning={isRunning} isPaused={isPaused} isFinished={isFinished}
            speed={speed} onSpeedChange={setSpeed}
            onStart={() => {
                setIsRunning(true);
                setIsPaused(false);
                setIsFinished(false);
                if (currentStep === -1) setCurrentStep(0);
            }} 
            onPause={() => {
                setIsRunning(false);
                setIsPaused(true);
            }} 
            onResume={() => {
                setIsRunning(true);
                setIsPaused(false);
            }}
            onReset={handleReset} 
            onStep={() => {
                if (currentStep + 1 < compSteps.length) {
                    setCurrentStep(prev => prev + 1);
                } else {
                    setIsFinished(true);
                    setIsRunning(false);
                }
            }}
            currentStepNum={currentStep === -1 ? 0 : currentStep + 1} 
            totalSteps={compSteps.length}
            phaseName={currentStep === -1 ? "Designing Phase" : isFinished ? "Compilation Finished" : "Translating Constraints..."}
            centerContent={
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.8rem', background: 'var(--white)', padding: '0.8rem', overflowY: 'hidden' }}>
                    
                    {/* Top Canvas Action Dashboard: Manual inputs */}
                    <div className="er-dashboard-actions" style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        gap: '0.6rem', 
                        flexShrink: 0, 
                        border: '3px solid var(--border)', 
                        background: '#fafafa', 
                        padding: '0.5rem 0.8rem', 
                        boxShadow: '3px 3px 0 var(--border)',
                        borderRadius: '6px'
                    }}>
                        {/* Table adder button */}
                        <button 
                            className="btn btn-sm btn-green" 
                            onClick={addCustomEntity} 
                            style={{ fontSize: '0.72rem', fontWeight: 800, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }} 
                            disabled={isRunning}
                        >
                            <FileIcon size={14} /> Add New Table
                        </button>
 
                        {/* Manual relationship connector form */}
                        <form 
                            className="er-connect-form"
                            onSubmit={addCustomRelationship} 
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '5px', 
                                background: '#f1f5f9', 
                                border: '2px solid var(--border)', 
                                padding: '4px 8px', 
                                borderRadius: '6px',
                                flexWrap: 'nowrap',
                                minWidth: 0,
                            }}
                        >
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, whiteSpace: 'nowrap' }}>Connect:</span>
                            <select value={newRelEntA} onChange={e => setNewRelEntA(e.target.value)} style={{ fontSize: '0.65rem', border: '1.5px solid var(--border)', padding: '2px 4px', background: 'white', borderRadius: '4px', fontWeight: 700, minWidth: '70px' }} disabled={isRunning}>
                                {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                            
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, whiteSpace: 'nowrap' }}>to</span>
                            
                            <select value={newRelEntB} onChange={e => setNewRelEntB(e.target.value)} style={{ fontSize: '0.65rem', border: '1.5px solid var(--border)', padding: '2px 4px', background: 'white', borderRadius: '4px', fontWeight: 700, minWidth: '70px' }} disabled={isRunning}>
                                {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                            
                            <input
                                value={newRelName} onChange={e => setNewRelName(e.target.value)} placeholder="Name"
                                style={{ fontSize: '0.65rem', border: '1.5px solid var(--border)', width: '75px', padding: '2px 4px', borderRadius: '4px', fontWeight: 700 }}
                                required
                                disabled={isRunning}
                            />
                            
                            <select value={newRelCard} onChange={e => setNewRelCard(e.target.value)} style={{ fontSize: '0.65rem', border: '1.5px solid var(--border)', padding: '2px 4px', background: 'white', borderRadius: '4px', fontWeight: 700 }} disabled={isRunning}>
                                <option value="1:1">1:1</option>
                                <option value="1:N">1:N</option>
                                <option value="M:N">M:N</option>
                            </select>
                            
                            <button type="submit" className="btn btn-sm btn-pink" style={{ fontSize: '0.65rem', padding: '3px 8px', fontWeight: 800, whiteSpace: 'nowrap' }} disabled={isRunning}>
                                <LinkIcon size={12} /> Link
                            </button>
                        </form>
 
                        {/* Reset button */}
                        <button 
                            className="btn btn-sm btn-pink" 
                            onClick={handleReset} 
                            style={{ fontSize: '0.72rem', fontWeight: 800, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                            <SyncIcon size={12} /> Start Clean Slate
                        </button>
                    </div>

                    {/* ER Diagram Canvas Scrollable Viewport Wrapper */}
                    <div
                        style={{
                            border: '3.5px solid var(--border)', 
                            flex: 1, minHeight: 480,
                            boxShadow: '4px 4px 0 var(--border)',
                            overflow: 'auto',
                            background: '#0f172a'
                        }}
                    >
                        {/* Huge Virtual ER Diagram Canvas Workspace */}
                        <div
                            ref={canvasRef}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerLeave={handlePointerUp}
                            style={{
                                width: '2400px',
                                height: '1600px',
                                background: '#0f172a',
                                backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                                backgroundSize: '20px 20px',
                                position: 'relative',
                                touchAction: 'none'
                            }}
                        >
                            <span style={{ position: 'absolute', top: 8, left: 12, fontSize: '0.65rem', color: '#64748b', fontWeight: 900, textTransform: 'uppercase', zIndex: 10, letterSpacing: '0.05em' }}>
                                🛠️ Interactive ER Workspace (Huge Scrollable Canvas • Fluid Node Drag Anywhere • Straight Clean Connections)
                            </span>

                            {/* ─── DYNAMIC SVG CONNECTOR LINES & MIDPOINT CARDINALITY BADGES ─── */}
                            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}>
                                {relationships.map(rel => {
                                    const entA = entities.find(e => e.id === rel.entA);
                                    const entB = entities.find(e => e.id === rel.entB);

                                    if (!entA || !entB) return null;

                                    const centerA = getEntityCenter(rel.entA);
                                    const centerB = getEntityCenter(rel.entB);
                                    const centerRel = getRelationshipCenter(rel.id);

                                    // Midpoints for placing cardinality labels elegantly on lines
                                    const midXA = centerA.x + (centerRel.x - centerA.x) * 0.45;
                                    const midYA = centerA.y + (centerRel.y - centerA.y) * 0.45;
                                    const midXB = centerRel.x + (centerB.x - centerRel.x) * 0.55;
                                    const midYB = centerRel.y + (centerB.y - centerRel.y) * 0.55;

                                    const cardParts = rel.cardinality.split(':');
                                    const cardA = cardParts[0] || '1';
                                    const cardB = cardParts[1] || 'N';

                                    // Highlight active relationship connectors
                                    const isActiveRel = activeStepInfo?.type.startsWith('rel') && activeStepInfo?.id === rel.id;

                                    return (
                                        <g key={rel.id}>
                                            {/* Line from Entity A to Relationship Diamond */}
                                            <line
                                                x1={centerA.x} y1={centerA.y}
                                                x2={centerRel.x} y2={centerRel.y}
                                                stroke={isActiveRel ? "var(--yellow)" : "#818cf8"} 
                                                strokeWidth={isActiveRel ? "5" : "3"}
                                                strokeDasharray={rel.isWeak ? "5,5" : "none"}
                                                strokeLinecap="round"
                                                style={{ transition: 'all 0.2s ease' }}
                                            />
                                            
                                            {/* Line from Relationship Diamond to Entity B */}
                                            <line
                                                x1={centerRel.x} y1={centerRel.y}
                                                x2={centerB.x} y2={centerB.y}
                                                stroke={isActiveRel ? "var(--yellow)" : "#818cf8"} 
                                                strokeWidth={isActiveRel ? "5" : "3"}
                                                strokeDasharray={rel.isWeak ? "5,5" : "none"}
                                                strokeLinecap="round"
                                                style={{ transition: 'all 0.2s ease' }}
                                            />

                                            {/* Cardinality badge circles with labels near the nodes */}
                                            <g>
                                                <circle cx={midXA} cy={midYA} r="10" fill={isActiveRel ? "var(--yellow)" : "var(--cyan)"} stroke="var(--border)" strokeWidth="2" style={{ transition: 'fill 0.2s' }} />
                                                <text x={midXA} y={midYA} textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="900" fill="var(--text)">
                                                    {cardA}
                                                </text>
                                            </g>
                                            <g>
                                                <circle cx={midXB} cy={midYB} r="10" fill={isActiveRel ? "var(--yellow)" : "var(--pink)"} stroke="var(--border)" strokeWidth="2" style={{ transition: 'fill 0.2s' }} />
                                                <text x={midXB} y={midYB} textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="900" fill="var(--text)">
                                                    {cardB}
                                                </text>
                                            </g>
                                        </g>
                                    );
                                })}
                            </svg>

                            {/* Renders Draggable Entities (Tables) */}
                            <AnimatePresence>
                                {entities.map(ent => {
                                    const entAttrs = attributes.filter(a => a.entId === ent.id);
                                    const pos = positions[ent.id] || { x: 100, y: 150 };

                                    // Highlight card if active in the current compilation step
                                    const isActiveNode = activeStepInfo?.id === ent.id || (activeStepInfo?.type === 'pk' && activeStepInfo?.entId === ent.id);

                                    return (
                                        <div
                                            key={ent.id}
                                            onPointerDown={(e) => handlePointerDown(ent.id, e)}
                                            onMouseEnter={() => setHoveredElement(ent.id)}
                                            onMouseLeave={() => setHoveredElement(null)}
                                            style={{
                                                position: 'absolute',
                                                left: pos.x,
                                                top: pos.y,
                                                width: 200,
                                                border: ent.isWeak ? '6px double var(--border)' : '3px solid var(--border)',
                                                borderStyle: ent.participation === 'total' ? 'double' : 'solid',
                                                background: isActiveNode ? 'var(--yellow)' : hoveredElement === ent.id ? 'var(--cyan)' : 'var(--white)',
                                                boxShadow: isActiveNode 
                                                    ? '0 0 20px rgba(250, 204, 21, 0.9), 4px 4px 0 var(--border)' 
                                                    : '3px 3px 0 var(--border)',
                                                transform: isActiveNode ? 'scale(1.05)' : 'scale(1)',
                                                padding: '0.5rem', 
                                                cursor: draggedNode === ent.id ? 'grabbing' : 'grab', 
                                                zIndex: isActiveNode ? 12 : 10,
                                                userSelect: 'none',
                                                touchAction: 'none',
                                                borderRadius: '6px',
                                                transition: 'background-color 0.25s, border-style 0.15s, transform 0.2s, box-shadow 0.2s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2.5px solid var(--border)', paddingBottom: 4, marginBottom: 6 }}>
                                                {/* Manual inline renaming input for Entity */}
                                                <input
                                                    value={ent.name}
                                                    onChange={e => renameEntity(ent.id, e.target.value)}
                                                    disabled={isRunning}
                                                    style={{
                                                        fontSize: '0.85rem', fontWeight: 900, border: 'none', background: 'transparent',
                                                        width: '100px', borderBottom: '1.5px dashed var(--border)', outline: 'none'
                                                    }}
                                                />
                                                <div style={{ display: 'flex', gap: '3px' }}>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); toggleWeak(ent.id); }} 
                                                        title={ent.isWeak ? "Make Strong" : "Make Weak"} 
                                                        disabled={isRunning}
                                                        style={{ fontSize: '0.58rem', padding: '1px 4px', cursor: 'pointer', fontWeight: 800, background: ent.isWeak ? 'var(--pink)' : '#eee', border: '1.5px solid var(--border)', borderRadius: '3px' }}
                                                    >
                                                        W
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); toggleParticipation(ent.id); }} 
                                                        title={ent.participation === 'total' ? "Make Partial" : "Make Total Participation"} 
                                                        disabled={isRunning}
                                                        style={{ fontSize: '0.58rem', padding: '1px 4px', cursor: 'pointer', fontWeight: 800, background: ent.participation === 'total' ? 'var(--cyan)' : '#eee', border: '1.5px solid var(--border)', borderRadius: '3px' }}
                                                    >
                                                        P
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); deleteEntity(ent.id); }} 
                                                        title="Delete Table" 
                                                        disabled={isRunning}
                                                        style={{ fontSize: '0.58rem', padding: '1px 4px', cursor: 'pointer', background: '#ef4444', color: 'white', border: '1.5px solid var(--border)', borderRadius: '3px' }}
                                                    >
                                                        Del
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Attributes list inside entity card */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                {entAttrs.map(attr => {
                                                    const isActiveAttr = activeStepInfo?.type === 'pk' && activeStepInfo?.id === attr.id;
                                                    return (
                                                        <div
                                                            key={attr.id}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                                fontSize: '0.7rem', fontFamily: 'var(--font-mono)', padding: '3px 6px', border: '1.5px solid var(--border)',
                                                                borderStyle: attr.type === 'derived' ? 'dashed' : attr.type === 'multivalued' ? 'double' : 'solid',
                                                                background: isActiveAttr ? 'var(--yellow)' : attr.type === 'primary' ? 'var(--pink)' : attr.type === 'multivalued' ? 'var(--cyan)' : '#f1f5f9',
                                                                borderRadius: '4px',
                                                                boxShadow: isActiveAttr ? '0 0 8px rgba(0,0,0,0.15)' : '1px 1px 0 var(--border)',
                                                                transition: 'background-color 0.2s'
                                                            }}
                                                        >
                                                            {/* Badge for Attribute Type */}
                                                            <span style={{ fontSize: '0.55rem', fontWeight: 900, background: 'rgba(0,0,0,0.06)', padding: '1px 3px', borderRadius: '3px', textTransform: 'uppercase' }}>
                                                                {attr.type === 'primary' ? 'PK' : attr.type === 'multivalued' ? 'ML' : attr.type === 'derived' ? 'DV' : 'Col'}
                                                            </span>

                                                            {/* Manual column name editing */}
                                                            <input
                                                                value={attr.name}
                                                                onChange={e => renameAttribute(attr.id, e.target.value)}
                                                                disabled={isRunning}
                                                                style={{
                                                                    fontSize: '0.68rem', border: 'none', background: 'transparent',
                                                                    width: '80px', outline: 'none', fontWeight: 700,
                                                                    textDecoration: attr.type === 'primary' ? 'underline' : 'none'
                                                                }}
                                                            />
                                                            
                                                            {/* Quick cycle button */}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); cycleAttributeType(attr.id); }}
                                                                title="Cycle constraint: PK, Simple, Multivalued, Derived"
                                                                disabled={isRunning}
                                                                style={{ fontSize: '0.52rem', padding: '1px 3px', cursor: 'pointer', flexShrink: 0, border: '1px solid var(--border)', borderRadius: '2px', background: 'white' }}
                                                            >
                                                                <GearIcon size={10} />
                                                            </button>
                                                            {/* Delete Attribute */}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); deleteAttribute(attr.id); }}
                                                                disabled={isRunning}
                                                                style={{ fontSize: '0.52rem', padding: '1px 3px', cursor: 'pointer', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', flexShrink: 0, fontWeight: 900 }}
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Column inline adder form inside card */}
                                            <form
                                                onSubmit={e => {
                                                    e.preventDefault();
                                                    const colInput = e.target.elements[`new_col_${ent.id}`];
                                                    const colName = colInput.value.trim();
                                                    if (colName) {
                                                        addColumn(ent.id, colName);
                                                        colInput.value = '';
                                                    }
                                                }}
                                                style={{ display: 'flex', gap: 2, marginTop: 8 }}
                                            >
                                                <input
                                                    name={`new_col_${ent.id}`}
                                                    placeholder="+ Add Column..."
                                                    disabled={isRunning}
                                                    style={{ fontSize: '0.62rem', padding: '2px 4px', border: '1.5px solid var(--border)', width: '135px', borderRadius: '4px' }}
                                                    required
                                                />
                                                <button type="submit" style={{ fontSize: '0.62rem', padding: '2px 6px', cursor: 'pointer', fontWeight: 900, background: 'var(--yellow)', border: '1.5px solid var(--border)', borderRadius: '4px' }} disabled={isRunning}>+</button>
                                            </form>
                                        </div>
                                    );
                                })}
                            </AnimatePresence>

                            {/* Renders Draggable Relationships as beautifully stylized diamond cards */}
                            <AnimatePresence>
                                {relationships.map(rel => {
                                    const entA = entities.find(e => e.id === rel.entA);
                                    const entB = entities.find(e => e.id === rel.entB);
                                    const pos = positions[rel.id] || { x: 460, y: 185 };

                                    // Highlight if active in compile flow
                                    const isActiveRelNode = activeStepInfo?.id === rel.id;

                                    return (
                                        <div
                                            key={rel.id}
                                            onPointerDown={(e) => handlePointerDown(rel.id, e)}
                                            style={{
                                                position: 'absolute',
                                                left: pos.x,
                                                top: pos.y,
                                                width: 130,
                                                height: 130,
                                                zIndex: isActiveRelNode ? 12 : 9,
                                                cursor: draggedNode === rel.id ? 'grabbing' : 'grab',
                                                userSelect: 'none',
                                                touchAction: 'none',
                                                transform: isActiveRelNode ? 'scale(1.08)' : 'scale(1)',
                                                transition: 'transform 0.2s'
                                            }}
                                        >
                                            {/* Diamond background shape */}
                                            <div style={{
                                                position: 'absolute',
                                                inset: 0,
                                                border: rel.isWeak ? '6px double var(--border)' : '3.5px solid var(--border)',
                                                background: isActiveRelNode ? 'var(--yellow)' : 'var(--white)',
                                                transform: 'rotate(45deg)',
                                                boxShadow: isActiveRelNode 
                                                    ? '0 0 20px rgba(250, 204, 21, 0.9), 3px 3px 0 var(--border)' 
                                                    : '3px 3px 0 var(--border)',
                                                transition: 'background-color 0.25s, transform 0.15s'
                                            }} />
                                            
                                            {/* Content inside the diamond, perfectly aligned horizontally */}
                                            <div style={{
                                                position: 'relative',
                                                width: '100%',
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                zIndex: 2,
                                                padding: '0.4rem',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '2px' }}>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); deleteRelationship(rel.id); }} 
                                                        title="Delete Relationship" 
                                                        disabled={isRunning}
                                                        style={{ 
                                                            fontSize: '0.55rem', padding: '1px 4px', 
                                                            background: '#ef4444', color: 'white', 
                                                            border: '1.5px solid var(--border)', 
                                                            cursor: 'pointer', borderRadius: '3px',
                                                            boxShadow: '1px 1px 0 var(--border)'
                                                        }}
                                                    >
                                                        Del
                                                    </button>
                                                </div>
                                                
                                                <strong style={{ fontSize: '0.8rem', display: 'block', color: 'var(--text)', fontWeight: 900 }}>
                                                    {rel.name}
                                                </strong>
                                                
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); cycleCardinality(rel.id); }}
                                                    title="Cycle Cardinality Constraint"
                                                    disabled={isRunning}
                                                    style={{
                                                        background: 'var(--cyan)', border: '2px solid var(--border)',
                                                        fontSize: '0.6rem', fontWeight: 900, padding: '1px 4px', 
                                                        cursor: 'pointer', boxShadow: '1.5px 1.5px 0 var(--border)',
                                                        marginTop: 4, borderRadius: '4px'
                                                    }}
                                                >
                                                    {rel.cardinality}
                                                </button>
                                                
                                                <div style={{ fontSize: '0.5rem', opacity: 0.5, marginTop: 4, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                    {entA ? entA.name : '?'} ↔ {entB ? entB.name : '?'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            }
            leftContent={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>Relational Schema Output</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {compiledTables.map(table => {
                            // Find out if this table is active in the current step
                            const isJunctionTable = table.id.startsWith('tab_junction_');
                            const isMultivalTable = table.id.startsWith('tab_multival_');
                            
                            let isActiveTable = false;
                            if (activeStepInfo) {
                                if (activeStepInfo.type === 'entity' && table.id === `tab_${activeStepInfo.id}`) isActiveTable = true;
                                if (activeStepInfo.type === 'pk' && table.id === `tab_${activeStepInfo.entId}`) isActiveTable = true;
                                if (activeStepInfo.type === 'rel_m_n' && isJunctionTable && table.id === `tab_junction_${activeStepInfo.id}`) isActiveTable = true;
                                if (activeStepInfo.type === 'multivalued' && isMultivalTable && table.id === `tab_multival_${activeStepInfo.id}`) isActiveTable = true;
                            }

                            // If simulator is running, only show tables that have already been compiled up to this step
                            const stepIdx = compSteps.findIndex(s => s.id === table.id.replace('tab_', '').replace('junction_', '').replace('multival_', ''));
                            const isVisible = currentStep === -1 || compSteps.slice(0, currentStep + 1).some(s => {
                                return (s.type === 'entity' && table.id === `tab_${s.id}`) ||
                                       (s.type === 'rel_m_n' && table.id === `tab_junction_${s.id}`) ||
                                       (s.type === 'multivalued' && table.id === `tab_multival_${s.id}`);
                            });

                            if (!isVisible) return null;

                            return (
                                <div 
                                    key={table.id} 
                                    style={{ 
                                        border: isActiveTable ? '3.5px solid var(--yellow)' : '2.5px solid var(--border)', 
                                        background: 'var(--white)', 
                                        boxShadow: isActiveTable ? '0 0 15px rgba(250, 204, 21, 0.45), 2px 2px 0 var(--border)' : '2px 2px 0 var(--border)', 
                                        overflow: 'hidden', 
                                        borderRadius: '6px',
                                        transition: 'all 0.25s ease'
                                    }}
                                >
                                    <div style={{ background: isActiveTable ? 'var(--yellow)' : 'var(--purple)', borderBottom: '2.5px solid var(--border)', padding: '4px 8px', fontSize: '0.72rem', fontWeight: 900, color: isActiveTable ? 'var(--text)' : '#fff', transition: 'all 0.25s', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <ClipboardIcon size={14} /> Table: {table.name} {isActiveTable ? '(Compiling...)' : ''}
                                    </div>
                                    <table className="neo-table" style={{ fontSize: '0.65rem', width: '100%' }}>
                                        <thead>
                                            <tr>
                                                <th>Column</th>
                                                <th>Constraints</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {table.columns.map((col, cidx) => (
                                                <tr key={cidx}>
                                                    <td style={{ textDecoration: col.isPK ? 'underline' : 'none', color: col.isFK ? 'blue' : 'inherit', fontWeight: col.isPK || col.isFK ? 900 : 400 }}>
                                                        {col.name}
                                                    </td>
                                                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                                                        {col.isPK ? 'PK ' : ''}
                                                        {col.isFK ? 'FK ' : ''}
                                                        {!col.isNullable ? 'NOT NULL' : 'NULL'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })}
                    </div>
                </div>
            }
            rightContent={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    
                    {/* Live Translation Process Output */}
                    <div style={{ border: '2.5px solid var(--border)', background: currentStep === -1 ? 'var(--yellow)' : 'var(--cyan)', padding: '0.6rem', boxShadow: '3px 3px 0 var(--border)', borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.55rem', fontWeight: 900, opacity: 0.6, textTransform: 'uppercase' }}>
                            {currentStep === -1 ? 'Simulation Lab Ready' : isFinished ? 'Compilation Complete' : 'Active Compiler Step'}
                        </div>
                        <h4 style={{ fontSize: '0.82rem', fontWeight: 900, margin: '4px 0', textTransform: 'uppercase' }}>
                            {currentStep === -1 ? 'Interactive Design Mode' : activeStepInfo?.title || 'Mapping...'}
                        </h4>
                        <p style={{ fontSize: '0.72rem', opacity: 0.85, lineHeight: 1.4, marginTop: 4 }}>
                            {currentStep === -1 
                                ? 'Click the ▶ START button in the top control bar to watch the dynamic step-by-step compiler map these constraints into clean physical relational tables!' 
                                : activeStepInfo?.desc}
                        </p>
                    </div>

                    {/* Educational Concept Guide */}
                    <div style={{ border: '2px solid var(--border)', background: 'var(--white)', padding: '0.6rem', boxShadow: '2px 2px 0 var(--border)', borderRadius: '6px' }}>
                        <h5 style={{ fontSize: '0.72rem', fontWeight: 900, borderBottom: '1.5px solid var(--border)', paddingBottom: '3px', marginBottom: '6px' }}>How ER translates to Relational:</h5>
                        <ul style={{ fontSize: '0.68rem', opacity: 0.8, display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '12px' }}>
                            <li><strong>Strong Entities:</strong> Become standalone tables with primitive key columns.</li>
                            <li><strong>1:N Relationships:</strong> Propagate the PK of the "1" side as an FK on the "N" side.</li>
                            <li><strong>M:N Relationships:</strong> Spawn a separate <strong>Junction Table</strong> connecting compound foreign keys.</li>
                            <li><strong>Multivalued attributes:</strong> Violate 1NF. Extracted into sub-tables referencing owner parent PK.</li>
                        </ul>
                    </div>

                    {/* Dynamic Compilation Progress Tracker List */}
                    <div style={{ border: '2px solid var(--border)', background: 'var(--white)', padding: '0.6rem', boxShadow: '2px 2px 0 var(--border)', borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.45, marginBottom: '6px' }}>Compiler Steps List ({compSteps.length})</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '180px', overflowY: 'auto' }}>
                            {compSteps.map((step, idx) => {
                                const isDone = idx < currentStep;
                                const isActive = idx === currentStep;
                                return (
                                    <div 
                                        key={idx} 
                                        style={{ 
                                            display: 'flex', alignItems: 'center', gap: '6px', 
                                            fontSize: '0.68rem', padding: '3px 6px',
                                            border: '1.5px solid var(--border)', borderRadius: '4px',
                                            background: isActive ? 'var(--yellow)' : isDone ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                                            borderColor: isActive ? 'var(--border)' : isDone ? '#22c55e' : 'var(--border)',
                                            fontWeight: isActive ? '900' : '500',
                                            opacity: isActive || isDone ? 1 : 0.5,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <span>{isDone ? <CheckIcon size={12} color="var(--green)" /> : isActive ? <ZapIcon size={12} color="var(--yellow)" /> : <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#ccc' }} />}</span>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{step.title}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ height: 2, background: 'var(--border)' }} />

                    {/* Live Stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.72rem', fontWeight: 800 }}>
                        <div style={{ border: '2px solid var(--border)', padding: '4px', display: 'flex', justifyContent: 'space-between', background: 'var(--yellow)', borderRadius: '4px' }}>
                            <span>Entities placed:</span>
                            <span>{entities.length}</span>
                        </div>
                        <div style={{ border: '2px solid var(--border)', padding: '4px', display: 'flex', justifyContent: 'space-between', background: 'var(--pink)', borderRadius: '4px' }}>
                            <span>Relationships:</span>
                            <span>{relationships.length}</span>
                        </div>
                        <div style={{ border: '2px solid var(--border)', padding: '4px', display: 'flex', justifyContent: 'space-between', background: 'var(--cyan)', borderRadius: '4px' }}>
                            <span>Relational tables:</span>
                            <span>{compiledTables.length}</span>
                        </div>
                    </div>
                </div>
            }
            timelineItems={compSteps.map((step, idx) => ({
                id: idx,
                label: step.title,
                done: idx < currentStep,
                active: idx === currentStep
            }))}
            legend={[
                { color: 'var(--yellow)', label: 'Entities' },
                { color: 'var(--pink)', label: 'PK Attributes' },
                { color: 'var(--cyan)', label: 'Multivalued' },
                { color: 'var(--purple)', label: 'Mapped Tables' }
            ]}
            conceptMode={conceptMode}
            onConceptModeToggle={() => setConceptMode(prev => !prev)}
        >
            <div className="main-content">
                <Link to="/dbms">← Return to DBMS Landing</Link>
            </div>
        </ImmersiveLayout>
    );
}
