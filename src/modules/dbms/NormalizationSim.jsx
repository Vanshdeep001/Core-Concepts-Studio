import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';

export default function NormalizationSim() {
    const [step, setStep] = useState(0); // 0: UNF, 1: 1NF, 2: 2NF, 3: 3NF, 4: BCNF
    const [speed, setSpeed] = useState(700);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [conceptMode, setConceptMode] = useState(false);

    // Anomaly Demo States
    const [anomalyType, setAnomalyType] = useState(null); // 'insert', 'delete', 'update'
    const [anomalyMsg, setAnomalyMsg] = useState(null);

    // Start with raw, redundant unnormalized data
    const rawData = [
        { roll: 'P101', name: 'Alice', courses: 'OS, DBMS', teacher: 'Prof. Smith', phone: '9876543210', marks: '85, 90' },
        { roll: 'P102', name: 'Bob', courses: 'DBMS', teacher: 'Dr. Jones', phone: '8765432109', marks: '92' },
        { roll: 'P103', name: 'Charlie', courses: 'OS', teacher: 'Prof. Smith', phone: '9876543210', marks: '78' },
        { roll: 'P104', name: 'Dave', courses: 'DBMS', teacher: 'Dr. Jones', phone: '8765432109', marks: '88' },
        { roll: 'P105', name: 'Frank', courses: 'Networks', teacher: 'Prof. Miller', phone: '7654321098', marks: '90' },
    ];

    // Reset simulator
    const handleReset = () => {
        setStep(0);
        setIsRunning(false);
        setIsPaused(false);
        setIsFinished(false);
        setAnomalyType(null);
        setAnomalyMsg(null);
    };

    // Playback ticks
    const handleStart = () => {
        setIsRunning(true);
        setIsPaused(false);
        setIsFinished(false);
    };

    const handlePause = () => {
        setIsRunning(false);
        setIsPaused(true);
    };

    const handleStep = () => {
        if (step < 4) {
            setStep(prev => prev + 1);
        } else {
            setIsFinished(true);
        }
    };

    // Auto Playback Tick
    useEffect(() => {
        let interval = null;
        if (isRunning && !isPaused && !isFinished) {
            interval = setInterval(() => {
                setStep(prev => {
                    if (prev < 4) return prev + 1;
                    setIsRunning(false);
                    setIsFinished(true);
                    return prev;
                });
            }, speed);
        }
        return () => clearInterval(interval);
    }, [isRunning, isPaused, isFinished, speed]);

    // Anomaly Triggers
    const triggerAnomaly = (type) => {
        setAnomalyType(type);
        if (type === 'insert') {
            setAnomalyMsg('INSERT ANOMALY! Cannot insert new course "Compiler Design" by teacher "Dr. Green" because no student has enrolled yet (RollNo cannot be NULL in primary key).');
        } else if (type === 'delete') {
            setAnomalyMsg('DELETE ANOMALY! If you delete student P105 (Frank), you permanently LOSE all record of the "Networks" course, its teacher "Prof. Miller" and their phone number.');
        } else if (type === 'update') {
            setAnomalyMsg('UPDATE ANOMALY! To change Prof. Smith\'s phone number, we must update MULTIPLE rows concurrently. If we miss one, the database falls into an inconsistent state.');
        }
    };

    const getPhaseName = () => {
        if (step === 0) return 'Unnormalized Form (UNF)';
        if (step === 1) return 'First Normal Form (1NF)';
        if (step === 2) return 'Second Normal Form (2NF)';
        if (step === 3) return 'Third Normal Form (3NF)';
        return 'Boyce-Codd Normal Form (BCNF)';
    };

    /* ══════════════════════════════════════════
       RENDER CORE: Normal Form Splits
       ══════════════════════════════════════════ */
    const renderUNF = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ background: 'var(--yellow)', border: '2px solid var(--border)', padding: '0.4rem 0.8rem', fontSize: '0.72rem', fontWeight: 900 }}>
                ⚠️ UNNORMALIZED GOD TABLE: Contains non-atomic values (comma separated) and redundant columns.
            </div>
            <table className="neo-table" style={{ fontSize: '0.78rem' }}>
                <thead>
                    <tr>
                        <th>RollNo (PK)</th>
                        <th>Name</th>
                        <th style={{ background: 'var(--pink)', color: '#000' }}>Courses (Non-Atomic)</th>
                        <th>Teacher</th>
                        <th>TeacherPhone</th>
                        <th style={{ background: 'var(--pink)', color: '#000' }}>Marks (Non-Atomic)</th>
                    </tr>
                </thead>
                <tbody>
                    {rawData.map((row, idx) => (
                        <tr key={idx}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 900 }}>{row.roll}</td>
                            <td>{row.name}</td>
                            <td style={{ background: '#ffe4e6', fontWeight: 900 }}>{row.courses}</td>
                            <td>{row.teacher}</td>
                            <td>{row.phone}</td>
                            <td style={{ background: '#ffe4e6', fontWeight: 900 }}>{row.marks}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const render1NF = () => {
        // Expand atomic values
        const oneNFData = [
            { roll: 'P101', name: 'Alice', course: 'OS', teacher: 'Prof. Smith', phone: '9876543210', mark: 85 },
            { roll: 'P101', name: 'Alice', course: 'DBMS', teacher: 'Dr. Jones', phone: '8765432109', mark: 90 },
            { roll: 'P102', name: 'Bob', course: 'DBMS', teacher: 'Dr. Jones', phone: '8765432109', mark: 92 },
            { roll: 'P103', name: 'Charlie', course: 'OS', teacher: 'Prof. Smith', phone: '9876543210', mark: 78 },
            { roll: 'P104', name: 'Dave', course: 'DBMS', teacher: 'Dr. Jones', phone: '8765432109', mark: 88 },
            { roll: 'P105', name: 'Frank', course: 'Networks', teacher: 'Prof. Miller', phone: '7654321098', mark: 90 },
        ];

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div style={{ background: 'var(--cyan)', border: '2px solid var(--border)', padding: '0.4rem 0.8rem', fontSize: '0.72rem', fontWeight: 900 }}>
                    1NF SECURED: All cells are now atomic. Composite Key is (RollNo, Course).
                </div>
                <div style={{ background: '#fef3c7', border: '2px solid var(--border)', padding: '0.4rem', fontSize: '0.7rem', fontWeight: 900, color: 'red' }}>
                    🔴 PARTIAL DEPENDENCY DETECTED: (RollNo) determines (Name). Candidate Key is (RollNo, Course). Since Name depends on a subset of the PK, this violates 2NF!
                </div>
                <table className="neo-table" style={{ fontSize: '0.78rem' }}>
                    <thead>
                        <tr>
                            <th style={{ background: 'var(--yellow)', color: '#000' }}>RollNo (Key)</th>
                            <th style={{ background: '#ffe4e6', color: '#000' }}>Name (Partial Dep)</th>
                            <th style={{ background: 'var(--yellow)', color: '#000' }}>Course (Key)</th>
                            <th>Teacher</th>
                            <th>TeacherPhone</th>
                            <th>Mark</th>
                        </tr>
                    </thead>
                    <tbody>
                        {oneNFData.map((row, idx) => (
                            <tr key={idx}>
                                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 900 }}>{row.roll}</td>
                                <td style={{ background: '#ffe4e6', fontWeight: 900 }}>{row.name}</td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 900 }}>{row.course}</td>
                                <td>{row.teacher}</td>
                                <td>{row.phone}</td>
                                <td>{row.mark}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const render2NF = () => {
        const studentInfo = [
            { roll: 'P101', name: 'Alice' },
            { roll: 'P102', name: 'Bob' },
            { roll: 'P103', name: 'Charlie' },
            { roll: 'P104', name: 'Dave' },
            { roll: 'P105', name: 'Frank' },
        ];

        const enrollment = [
            { roll: 'P101', course: 'OS', teacher: 'Prof. Smith', phone: '9876543210', mark: 85 },
            { roll: 'P101', course: 'DBMS', teacher: 'Dr. Jones', phone: '8765432109', mark: 90 },
            { roll: 'P102', course: 'DBMS', teacher: 'Dr. Jones', phone: '8765432109', mark: 92 },
            { roll: 'P103', course: 'OS', teacher: 'Prof. Smith', phone: '9876543210', mark: 78 },
            { roll: 'P104', course: 'DBMS', teacher: 'Dr. Jones', phone: '8765432109', mark: 88 },
            { roll: 'P105', course: 'Networks', teacher: 'Prof. Miller', phone: '7654321098', mark: 90 },
        ];

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ background: 'var(--green)', border: '2px solid var(--border)', padding: '0.4rem 0.8rem', fontSize: '0.72rem', fontWeight: 900 }}>
                    2NF SECURED: Partial dependency removed. Tables split into StudentInfo and CourseEnroll.
                </div>
                <div style={{ background: '#fef3c7', border: '2px solid var(--border)', padding: '0.4rem', fontSize: '0.7rem', fontWeight: 900, color: 'red' }}>
                    🔴 TRANSITIVE DEPENDENCY DETECTED: (Course) determines (Teacher), and (Teacher) determines (TeacherPhone). Since Phone depends transitively on Course, this violates 3NF!
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1rem' }}>
                    {/* StudentInfo */}
                    <div style={{ border: '3px solid var(--border)', background: 'var(--white)', boxShadow: '3px 3px 0 var(--border)', overflow: 'hidden' }}>
                        <div style={{ background: 'var(--yellow)', borderBottom: '3px solid var(--border)', padding: '0.35rem 0.6rem', fontWeight: 900, fontSize: '0.72rem' }}>
                            📁 Table: StudentInfo
                        </div>
                        <table className="neo-table" style={{ fontSize: '0.72rem' }}>
                            <thead>
                                <tr>
                                    <th>RollNo (PK)</th>
                                    <th>Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentInfo.map((row, idx) => (
                                    <tr key={idx}>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 900 }}>{row.roll}</td>
                                        <td>{row.name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Enrollment */}
                    <div style={{ border: '3px solid var(--border)', background: 'var(--white)', boxShadow: '3px 3px 0 var(--border)', overflow: 'hidden' }}>
                        <div style={{ background: 'var(--pink)', borderBottom: '3px solid var(--border)', padding: '0.35rem 0.6rem', fontWeight: 900, fontSize: '0.72rem' }}>
                            📁 Table: CourseEnroll
                        </div>
                        <table className="neo-table" style={{ fontSize: '0.72rem' }}>
                            <thead>
                                <tr>
                                    <th>RollNo (FK)</th>
                                    <th>Course (PK)</th>
                                    <th>Teacher</th>
                                    <th style={{ background: '#ffe4e6' }}>TeacherPhone (Transitive)</th>
                                    <th>Mark</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrollment.map((row, idx) => (
                                    <tr key={idx}>
                                        <td>{row.roll}</td>
                                        <td>{row.course}</td>
                                        <td>{row.teacher}</td>
                                        <td style={{ background: '#ffe4e6', fontWeight: 900 }}>{row.phone}</td>
                                        <td>{row.mark}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const render3NF = () => {
        const studentInfo = [
            { roll: 'P101', name: 'Alice' },
            { roll: 'P102', name: 'Bob' },
            { roll: 'P103', name: 'Charlie' },
            { roll: 'P104', name: 'Dave' },
            { roll: 'P105', name: 'Frank' },
        ];

        const courseMarks = [
            { roll: 'P101', course: 'OS', mark: 85 },
            { roll: 'P101', course: 'DBMS', mark: 90 },
            { roll: 'P102', course: 'DBMS', mark: 92 },
            { roll: 'P103', course: 'OS', mark: 78 },
            { roll: 'P104', course: 'DBMS', mark: 88 },
            { roll: 'P105', course: 'Networks', mark: 90 },
        ];

        const teachers = [
            { course: 'OS', teacher: 'Prof. Smith', phone: '9876543210' },
            { course: 'DBMS', teacher: 'Dr. Jones', phone: '8765432109' },
            { course: 'Networks', teacher: 'Prof. Miller', phone: '7654321098' },
        ];

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                <div style={{ background: 'var(--green)', border: '2px solid var(--border)', padding: '0.4rem 0.8rem', fontSize: '0.72rem', fontWeight: 900 }}>
                    3NF SECURED: Transitive dependencies removed. Teachers moved to TeacherDetails table.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <div style={{ border: '3px solid var(--border)', background: 'var(--white)', boxShadow: '2px 2px 0 var(--border)', overflow: 'hidden' }}>
                        <div style={{ background: 'var(--yellow)', borderBottom: '3px solid var(--border)', padding: '0.3rem 0.5rem', fontWeight: 900, fontSize: '0.7rem' }}>
                            📁 Table: StudentInfo
                        </div>
                        <table className="neo-table" style={{ fontSize: '0.68rem' }}>
                            <thead>
                                <tr><th>RollNo (PK)</th><th>Name</th></tr>
                            </thead>
                            <tbody>
                                {studentInfo.map((row, idx) => (
                                    <tr key={idx}><td>{row.roll}</td><td>{row.name}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ border: '3px solid var(--border)', background: 'var(--white)', boxShadow: '2px 2px 0 var(--border)', overflow: 'hidden' }}>
                        <div style={{ background: 'var(--pink)', borderBottom: '3px solid var(--border)', padding: '0.3rem 0.5rem', fontWeight: 900, fontSize: '0.7rem' }}>
                            📁 Table: CourseMarks
                        </div>
                        <table className="neo-table" style={{ fontSize: '0.68rem' }}>
                            <thead>
                                <tr><th>RollNo (FK)</th><th>Course (FK)</th><th>Mark</th></tr>
                            </thead>
                            <tbody>
                                {courseMarks.map((row, idx) => (
                                    <tr key={idx}><td>{row.roll}</td><td>{row.course}</td><td>{row.mark}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ border: '3px solid var(--border)', background: 'var(--white)', boxShadow: '3px 3px 0 var(--border)', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--cyan)', borderBottom: '3px solid var(--border)', padding: '0.3rem 0.5rem', fontWeight: 900, fontSize: '0.7rem' }}>
                        📁 Table: TeacherDetails
                    </div>
                    <table className="neo-table" style={{ fontSize: '0.68rem' }}>
                        <thead>
                            <tr><th>Course (PK)</th><th>Teacher</th><th>TeacherPhone</th></tr>
                        </thead>
                        <tbody>
                            {teachers.map((row, idx) => (
                                <tr key={idx}><td>{row.course}</td><td>{row.teacher}</td><td>{row.phone}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderBCNF = () => {
        // Splitting teacher details if teacher determines course but is not superkey
        const assign = [
            { teacher: 'Prof. Smith', course: 'OS' },
            { teacher: 'Dr. Jones', course: 'DBMS' },
            { teacher: 'Prof. Miller', course: 'Networks' },
        ];

        const phones = [
            { teacher: 'Prof. Smith', phone: '9876543210' },
            { teacher: 'Dr. Jones', phone: '8765432109' },
            { teacher: 'Prof. Miller', phone: '7654321098' },
        ];

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'var(--green)', border: '2px solid var(--border)', padding: '0.4rem 0.8rem', fontSize: '0.72rem', fontWeight: 900 }}>
                    🏆 BCNF SECURED: All determinants are now superkeys! Decomposition complete.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                    <div style={{ border: '3px solid var(--border)', background: 'var(--white)', boxShadow: '3px 3px 0 var(--border)', overflow: 'hidden' }}>
                        <div style={{ background: 'var(--purple)', borderBottom: '3px solid var(--border)', padding: '0.3rem 0.5rem', fontWeight: 900, fontSize: '0.7rem' }}>
                            📁 Table: TeacherPhone (BCNF)
                        </div>
                        <table className="neo-table" style={{ fontSize: '0.68rem' }}>
                            <thead>
                                <tr><th>Teacher (PK)</th><th>TeacherPhone</th></tr>
                            </thead>
                            <tbody>
                                {phones.map((row, idx) => (
                                    <tr key={idx}><td>{row.teacher}</td><td>{row.phone}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ border: '3px solid var(--border)', background: 'var(--white)', boxShadow: '3px 3px 0 var(--border)', overflow: 'hidden' }}>
                        <div style={{ background: 'var(--cyan)', borderBottom: '3px solid var(--border)', padding: '0.3rem 0.5rem', fontWeight: 900, fontSize: '0.7rem' }}>
                            📁 Table: TeacherAssign (BCNF)
                        </div>
                        <table className="neo-table" style={{ fontSize: '0.68rem' }}>
                            <thead>
                                <tr><th>Teacher (FK)</th><th>Course</th></tr>
                            </thead>
                            <tbody>
                                {assign.map((row, idx) => (
                                    <tr key={idx}><td>{row.teacher}</td><td>{row.course}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    /* ══════════════════════════════════════════
       RENDER HELPERS: Center, Left, Right
       ══════════════════════════════════════════ */
    const centerContent = (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', background: 'var(--white)', padding: '1rem', overflowY: 'hidden' }}>
            
            {/* Steps button navigation */}
            <div style={{ display: 'flex', border: '3px solid var(--border)', boxShadow: '3px 3px 0 var(--border)', background: 'var(--white)', flexShrink: 0 }}>
                {['UNF', '1NF', '2NF', '3NF', 'BCNF'].map((nf, idx) => (
                    <button
                        key={nf}
                        onClick={() => { setStep(idx); setIsFinished(false); }}
                        style={{
                            flex: 1, border: 'none', borderRight: idx < 4 ? '3px solid var(--border)' : 'none', padding: '0.4rem', fontWeight: 900,
                            background: step === idx ? 'var(--yellow)' : 'var(--white)', cursor: 'pointer', fontSize: '0.8rem'
                        }}
                    >
                        {nf}
                    </button>
                ))}
            </div>

            {/* Main Decomposing Canvas */}
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '4px' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {step === 0 && renderUNF()}
                        {step === 1 && render1NF()}
                        {step === 2 && render2NF()}
                        {step === 3 && render3NF()}
                        {step === 4 && renderBCNF()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Anomaly sandbox injector panel */}
            <div style={{ border: '3px solid var(--border)', background: '#fafafa', padding: '0.6rem 0.8rem', boxShadow: '3px 3px 0 var(--border)', flexShrink: 0 }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.35rem' }}>Anomaly Sandbox Injector</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-sm btn-pink" style={{ flex: 1 }} onClick={() => triggerAnomaly('insert')}>Inject Insert Anomaly</button>
                    <button className="btn btn-sm btn-yellow" style={{ flex: 1 }} onClick={() => triggerAnomaly('delete')}>Inject Delete Anomaly</button>
                    <button className="btn btn-sm btn-cyan" style={{ flex: 1 }} onClick={() => triggerAnomaly('update')}>Inject Update Anomaly</button>
                </div>

                <AnimatePresence>
                    {anomalyMsg && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{
                                background: 'var(--white)', border: '2px solid var(--border)', padding: '6px 10px', fontSize: '0.72rem',
                                color: 'red', fontWeight: 900, marginTop: '0.5rem', boxShadow: '2px 2px 0 red', position: 'relative'
                            }}
                        >
                            <span>{anomalyMsg}</span>
                            <button
                                onClick={() => { setAnomalyMsg(null); setAnomalyType(null); }}
                                style={{ position: 'absolute', top: 2, right: 6, border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 900 }}
                            >
                                ✕
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );

    const leftContent = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>System State</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ border: '2px solid var(--border)', padding: '0.35rem 0.5rem', background: 'var(--yellow)', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 800, boxShadow: '2px 2px 0 var(--border)' }}>
                    <span>Current Schema State:</span>
                    <span>{getPhaseName()}</span>
                </div>
                <div style={{ border: '2px solid var(--border)', padding: '0.35rem 0.5rem', background: 'var(--pink)', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 800, boxShadow: '2px 2px 0 var(--border)' }}>
                    <span>Active Tables Count:</span>
                    <span>{step === 0 ? 1 : step === 1 ? 1 : step === 2 ? 2 : step === 3 ? 3 : 4}</span>
                </div>
                <div style={{ border: '2px solid var(--border)', padding: '0.35rem 0.5rem', background: 'var(--cyan)', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 800, boxShadow: '2px 2px 0 var(--border)' }}>
                    <span>Redundant Cells Freed:</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{step === 0 ? 0 : step === 1 ? 4 : step === 2 ? 12 : step === 3 ? 20 : 26}</span>
                </div>
                <div style={{ border: '2px solid var(--border)', padding: '0.35rem 0.5rem', background: 'var(--green)', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 800, boxShadow: '2px 2px 0 var(--border)' }}>
                    <span>Anomalies Remaining:</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{step === 4 ? 0 : 3 - step}</span>
                </div>
            </div>

            <div style={{ height: 2, background: 'var(--border)' }} />

            <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>FD Dependency Canvas</div>
            <div style={{ border: '2px solid var(--border)', background: '#222', color: '#00ff00', padding: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ color: step >= 2 ? 'var(--green)' : 'red' }}>RollNo → Name {step >= 2 ? '✓ [RESOLVED]' : '⚠️ [PARTIAL]' }</div>
                <div style={{ color: step >= 3 ? 'var(--green)' : 'red' }}>Course → Teacher {step >= 3 ? '✓ [RESOLVED]' : '⚠️ [TRANSITIVE]' }</div>
                <div style={{ color: step >= 4 ? 'var(--green)' : 'red' }}>Teacher → TeacherPhone {step >= 4 ? '✓ [RESOLVED]' : '⚠️ [BCNF]' }</div>
            </div>
        </div>
    );

    const rightContent = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {conceptMode && (
                <div style={{ background: 'var(--purple)', border: '2px solid var(--border)', padding: '0.5rem 0.75rem', fontSize: '0.72rem', fontWeight: 800, boxShadow: '2px 2px 0 var(--border)' }}>
                    📚 CONCEPT RADAR:<br/>
                    1NF = Atomic values.<br/>
                    2NF = 1NF + No Partial dependency.<br/>
                    3NF = 2NF + No Transitive dependency.<br/>
                    BCNF = For every X→Y, X is Superkey.
                </div>
            )}

            <div style={{ border: '2px solid var(--border)', background: 'var(--yellow)', padding: '0.4rem 0.6rem', boxShadow: '2px 2px 0 var(--border)' }}>
                <div style={{ fontSize: '0.55rem', fontWeight: 900, opacity: 0.6 }}>CONCEPT TAG</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                    {step === 0 && 'CONCEPT: ATOMICITY'}
                    {step === 1 && 'CONCEPT: PARTIAL DEPENDENCY'}
                    {step === 2 && 'CONCEPT: TRANSITIVE DEPENDENCY'}
                    {step === 3 && 'CONCEPT: TRIVIAL DEPENDENCY'}
                    {step === 4 && 'CONCEPT: BCNF KEY THEOREM'}
                </div>
            </div>

            <div style={{ border: '2px solid var(--border)', background: 'var(--white)', padding: '0.6rem', boxShadow: '2px 2px 0 var(--border)' }}>
                <p style={{ fontSize: '0.72rem', opacity: 0.8, lineHeight: 1.4 }}>
                    {step === 0 && 'Atomicity requires that values in a table cell must be indivisible. Commas indicate repeating attributes violating 1NF.'}
                    {step === 1 && 'Partial dependency occurs when a non-prime attribute is functionally dependent on part of a candidate key. Causes insert/delete anomalies.'}
                    {step === 2 && 'Transitive dependency is when a non-prime attribute determines another non-prime attribute (X → Y → Z). Violates 3NF.'}
                    {step === 3 && '3NF removes transitive paths but still permits anomalies if a non-key determines part of a composite candidate key. BCNF addresses this.'}
                    {step === 4 && 'BCNF is a stronger version of 3NF. It guarantees that the database has 0 functional redundancy and is completely safe from anomalies.'}
                </p>
            </div>

            <div style={{ height: 2, background: 'var(--border)' }} />

            {/* Algorithm Logic card */}
            <div className="panel" style={{ boxShadow: '3px 3px 0 var(--border)' }}>
                <div className="panel-header" style={{ background: 'var(--pink)', fontSize: '0.72rem', padding: '4px 10px' }}>
                    Decomposition Rules
                </div>
                <div style={{ padding: '0.6rem', background: 'var(--white)' }}>
                    <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', background: '#eee', padding: '0.4rem', border: '1.5px solid var(--border)', overflowX: 'auto' }}>
                        {step === 0 && `// UNF -> 1NF
Split non-atomic lists
into separate row keys.
Key: (RollNo, Course)`}
                        {step === 1 && `// 1NF -> 2NF
If (A, B) -> C and A -> D:
Split:
Table1(A, B, C)
Table2(A, D)`}
                        {step === 2 && `// 2NF -> 3NF
If A -> B and B -> C:
Split:
Table1(A, B)
Table2(B, C)`}
                        {step === 3 && `// 3NF -> BCNF
If X -> Y and X is not
a candidate superkey:
Decompose into:
Table1(X, Y), Table2(X, others)`}
                        {step === 4 && `// BCNF Secured
Anomalies = 0
Redundant cells freed!`}
                    </pre>
                </div>
            </div>
        </div>
    );

    // timeline logs
    const timelineItems = [
        { label: 'Decomposing God Table', active: step === 0, done: step > 0 },
        { label: 'Splitting Atomic Rows (1NF)', active: step === 1, done: step > 1 },
        { label: 'Removing Partial Paths (2NF)', active: step === 2, done: step > 2 },
        { label: 'Clearing Transitives (3NF)', active: step === 3, done: step > 3 },
        { label: 'Enforcing Superkey rule (BCNF)', active: step === 4, done: step === 4 }
    ];

    return (
        <ImmersiveLayout
            isActive={true}
            title="Normalization (1NF to BCNF)" icon="📊" moduleLabel="DBMS Module"
            isRunning={isRunning} isPaused={isPaused} isFinished={isFinished}
            speed={speed} onSpeedChange={setSpeed}
            onStart={handleStart} onPause={handlePause} onResume={handleStart}
            onReset={handleReset} onStep={handleStep}
            currentStepNum={step + 1} totalSteps={5}
            phaseName={getPhaseName()}
            centerContent={centerContent}
            leftContent={leftContent}
            rightContent={rightContent}
            timelineItems={timelineItems}
            legend={[
                { color: 'var(--yellow)', label: 'Keys/FK' },
                { color: 'var(--cyan)', label: 'Atomic' },
                { color: 'var(--pink)', label: 'Violations' },
                { color: 'var(--green)', label: 'Secured' }
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
