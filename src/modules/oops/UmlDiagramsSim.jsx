import { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import useSnapshot from '../../hooks/useSnapshot';
import { BoxIcon, TerminalIcon, SyncIcon, ChartIcon, LightbulbIcon } from '../../components/Icons';

/* ── CONSTANTS ── */
const DIAGRAM_TABS = [
    { id: 'class', name: 'Class Diagram', icon: <BoxIcon size={16} /> },
    { id: 'code', name: 'Code-to-UML', icon: <TerminalIcon size={16} /> },
];

const PREBUILT = [
    { name: 'Library System', classes: [
        { id: 'c1', name: 'Library', x: 50, y: 50, fields: ['- name: String', '- books: List<Book>'], methods: ['+ addBook(b: Book)', '+ findBook(isbn): Book', '+ registerMember(m: Member)'] },
        { id: 'c2', name: 'Book', x: 320, y: 50, fields: ['- isbn: String', '- title: String', '- author: String', '- available: boolean'], methods: ['+ borrow(): void', '+ returnBook(): void'] },
        { id: 'c3', name: 'Member', x: 50, y: 280, fields: ['- id: int', '- name: String', '- borrowedBooks: List<Book>'], methods: ['+ borrowBook(b: Book)', '+ returnBook(b: Book)'] },
        { id: 'c4', name: 'Librarian', x: 320, y: 280, fields: ['- empId: int'], methods: ['+ issueBook(b, m)', '+ collectFine(m)'] },
    ], relations: [{ from: 'c1', to: 'c2', type: 'composition', label: 'has' }, { from: 'c1', to: 'c3', type: 'aggregation', label: 'registers' }, { from: 'c4', to: 'c3', type: 'association', label: 'serves' }] },
    { name: 'Online Shopping', classes: [
        { id: 'c1', name: 'Customer', x: 50, y: 50, fields: ['- id: int', '- name: String', '- cart: Cart'], methods: ['+ addToCart()', '+ checkout()'] },
        { id: 'c2', name: 'Cart', x: 320, y: 50, fields: ['- items: List<Item>'], methods: ['+ addItem()', '+ removeItem()', '+ getTotal(): double'] },
        { id: 'c3', name: 'Order', x: 50, y: 260, fields: ['- orderId: int', '- status: String'], methods: ['+ place()', '+ cancel()'] },
        { id: 'c4', name: 'Payment', x: 320, y: 260, fields: ['- amount: double', '- method: String'], methods: ['+ process(): boolean'] },
    ], relations: [{ from: 'c1', to: 'c2', type: 'composition', label: 'has' }, { from: 'c1', to: 'c3', type: 'association', label: 'places' }, { from: 'c3', to: 'c4', type: 'dependency', label: 'uses' }] },
    { name: 'ATM System', classes: [
        { id: 'c1', name: 'ATM', x: 200, y: 30, fields: ['- location: String'], methods: ['+ authenticate()', '+ displayMenu()'] },
        { id: 'c2', name: 'Account', x: 50, y: 230, fields: ['- accNo: int', '- balance: double'], methods: ['+ getBalance()', '+ debit()', '+ credit()'] },
        { id: 'c3', name: 'Transaction', x: 350, y: 230, fields: ['- txnId: int', '- amount: double', '- type: String'], methods: ['+ execute()'] },
    ], relations: [{ from: 'c1', to: 'c2', type: 'association', label: 'accesses' }, { from: 'c1', to: 'c3', type: 'association', label: 'creates' }, { from: 'c3', to: 'c2', type: 'dependency', label: 'modifies' }] },
    { name: 'Hospital Mgmt', classes: [
        { id: 'c1', name: 'Hospital', x: 200, y: 30, fields: ['- name: String'], methods: ['+ addDoctor()', '+ admitPatient()'] },
        { id: 'c2', name: 'Doctor', x: 50, y: 220, fields: ['- id: int', '- specialization: String'], methods: ['+ prescribe()', '+ diagnose()'] },
        { id: 'c3', name: 'Patient', x: 350, y: 220, fields: ['- id: int', '- name: String', '- diagnosis: String'], methods: ['+ getHistory()', '+ bookAppointment()'] },
    ], relations: [{ from: 'c1', to: 'c2', type: 'aggregation', label: 'employs' }, { from: 'c1', to: 'c3', type: 'association', label: 'treats' }, { from: 'c2', to: 'c3', type: 'association', label: 'diagnoses' }] },
];

const REL_STYLES = {
    association: { stroke: '#64748b', dash: 'none', marker: 'arrow', label: 'Association (→)' },
    aggregation: { stroke: '#ffd93d', dash: 'none', marker: 'diamond-hollow', label: 'Aggregation (◇)' },
    composition: { stroke: '#ff6b9d', dash: 'none', marker: 'diamond-filled', label: 'Composition (◆)' },
    inheritance: { stroke: '#a8e6cf', dash: 'none', marker: 'triangle', label: 'Inheritance (△)' },
    dependency: { stroke: '#b39ddb', dash: '6 4', marker: 'arrow', label: 'Dependency (- →)' },
    realization: { stroke: '#66d9ef', dash: '6 4', marker: 'triangle', label: 'Realization (--△)' },
};

let uid = 200;

/* ── CODE PARSER ── */
function parseCode(code) {
    const classes = [];
    // Match class declarations: class ClassName { ... } or public class ClassName extends/implements
    const classRegex = /(?:public\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?\s*[{:]/g;
    let match;
    while ((match = classRegex.exec(code)) !== null) {
        const name = match[1];
        const parent = match[2] || null;
        const interfaces = match[3] ? match[3].split(',').map(s => s.trim()) : [];
        const fields = [];
        const methods = [];

        // Find fields and methods inside braces (simplified)
        const afterClass = code.substring(match.index + match[0].length);
        const fieldRegex = /(?:private|public|protected)?\s+(\w+)\s+(\w+)\s*[;=]/g;
        const methodRegex = /(?:public|private|protected)?\s+(?:static\s+)?(\w+)\s+(\w+)\s*\([^)]*\)/g;
        let fm;
        while ((fm = fieldRegex.exec(afterClass)) !== null) {
            if (fm.index > 500) break;
            const vis = afterClass.substring(Math.max(0, fm.index - 10), fm.index).includes('private') ? '-' : '+';
            fields.push(`${vis} ${fm[2]}: ${fm[1]}`);
        }
        while ((fm = methodRegex.exec(afterClass)) !== null) {
            if (fm.index > 500) break;
            if (['if', 'for', 'while', 'return', 'new', 'class'].includes(fm[2])) continue;
            const vis = afterClass.substring(Math.max(0, fm.index - 10), fm.index).includes('private') ? '-' : '+';
            methods.push(`${vis} ${fm[2]}(): ${fm[1]}`);
        }

        classes.push({
            id: `parsed_${name}`, name, x: 50 + classes.length * 280, y: 50,
            fields: fields.length ? fields : ['(no fields detected)'],
            methods: methods.length ? methods : ['(no methods detected)'],
            parent, interfaces,
        });
    }

    // Python class support
    const pyRegex = /class\s+(\w+)(?:\(([^)]+)\))?\s*:/g;
    while ((match = pyRegex.exec(code)) !== null) {
        if (classes.find(c => c.name === match[1])) continue;
        const name = match[1];
        const parents = match[2] ? match[2].split(',').map(s => s.trim()) : [];
        const methods = [];
        const defRegex = /def\s+(\w+)\s*\(self/g;
        const afterClass = code.substring(match.index);
        let dm;
        while ((dm = defRegex.exec(afterClass)) !== null) {
            if (dm.index > 500) break;
            methods.push(`+ ${dm[1]}()`);
        }
        classes.push({
            id: `parsed_${name}`, name, x: 50 + classes.length * 280, y: 50,
            fields: ['(Python: use type hints)'], methods: methods.length ? methods : ['(no methods)'],
            parent: parents[0] || null, interfaces: parents.slice(1),
        });
    }

    return classes;
}

/* ── CLASS BOX COMPONENT ── */
const ClassBox = ({ cls, onDragStart, isActive }) => (
    <div onMouseDown={(e) => onDragStart(cls.id, e)}
        style={{
            position: 'absolute', left: cls.x, top: cls.y, width: 230,
            border: `3px solid ${isActive ? '#ffd93d' : 'var(--border)'}`, borderRadius: '8px',
            background: 'var(--white)', boxShadow: isActive ? '0 0 15px rgba(255,217,61,0.5)' : '4px 4px 0 var(--border)',
            cursor: 'grab', userSelect: 'none', zIndex: 10, fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
        }}>
        <div style={{ padding: '0.4rem 0.6rem', borderBottom: '2px solid var(--border)', fontWeight: 800, textAlign: 'center', background: '#ff8a65', fontSize: '0.78rem', fontFamily: 'var(--font-main)' }}>
            {cls.name}
        </div>
        <div style={{ padding: '0.3rem 0.5rem', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
            {cls.fields.map((f, i) => <div key={i}>{f}</div>)}
        </div>
        <div style={{ padding: '0.3rem 0.5rem' }}>
            {cls.methods.map((m, i) => <div key={i}>{m}</div>)}
        </div>
    </div>
);



/* ══════════════════════════════════════════════ */
/* ── MAIN COMPONENT ── */
/* ══════════════════════════════════════════════ */

export default function UmlDiagramsSim() {
    const [activeTab, setActiveTab] = useState('class');
    const [speed, setSpeed] = useState(700);
    const [classes, setClasses] = useState(PREBUILT[0].classes);
    const [relations, setRelations] = useState(PREBUILT[0].relations);
    const [draggedClass, setDraggedClass] = useState(null);
    const [dragStart, setDragStart] = useState({ mx: 0, my: 0, cx: 0, cy: 0 });
    const [selectedPrebuilt, setSelectedPrebuilt] = useState(0);
    const [codeInput, setCodeInput] = useState(`public class Student {
    private int id;
    private String name;
    public void enroll() {}
    public double getGPA() {}
}

public class Course {
    private String title;
    public void addStudent(Student s) {}
}`);
    const [parsedClasses, setParsedClasses] = useState([]);
    const canvasRef = useRef(null);

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleDragStart = (id, e) => {
        if (e.button !== 0) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const cls = classes.find(c => c.id === id);
        setDraggedClass(id);
        setDragStart({ mx: e.clientX - rect.left, my: e.clientY - rect.top, cx: cls.x, cy: cls.y });
    };

    const handleDragMove = (e) => {
        if (!draggedClass) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const dx = (e.clientX - rect.left) - dragStart.mx;
        const dy = (e.clientY - rect.top) - dragStart.my;
        setClasses(prev => prev.map(c => c.id === draggedClass ? { ...c, x: Math.max(0, dragStart.cx + dx), y: Math.max(0, dragStart.cy + dy) } : c));
    };

    const handleDragEnd = () => setDraggedClass(null);

    const addClass = () => {
        const id = `c${++uid}`;
        setClasses(prev => [...prev, { id, name: 'NewClass', x: 100 + Math.random() * 200, y: 100 + Math.random() * 200, fields: ['- field: Type'], methods: ['+ method(): void'] }]);
    };

    const loadPrebuilt = (idx) => {
        setSelectedPrebuilt(idx);
        setClasses(PREBUILT[idx].classes);
        setRelations(PREBUILT[idx].relations);
    };

    const handleParse = () => {
        const parsed = parseCode(codeInput);
        setParsedClasses(parsed);
        if (parsed.length > 0) {
            setClasses(parsed);
            setRelations([]);
            setActiveTab('class');
        }
    };

    /* ── RENDER RELATIONSHIPS ── */
    const renderRelations = () => relations.map((r, i) => {
        const from = classes.find(c => c.id === r.from);
        const to = classes.find(c => c.id === r.to);
        if (!from || !to) return null;
        const x1 = from.x + 115, y1 = from.y + 50;
        const x2 = to.x + 115, y2 = to.y + 50;
        const style = REL_STYLES[r.type] || REL_STYLES.association;
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        return (
            <g key={i}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={style.stroke} strokeWidth="2.5" strokeDasharray={style.dash} />
                {r.type === 'composition' && <polygon points={`${x2},${y2-8} ${x2+8},${y2} ${x2},${y2+8} ${x2-8},${y2}`} fill={style.stroke} />}
                {r.type === 'aggregation' && <polygon points={`${x2},${y2-8} ${x2+8},${y2} ${x2},${y2+8} ${x2-8},${y2}`} fill="white" stroke={style.stroke} strokeWidth="2" />}
                {r.type === 'inheritance' && <polygon points={`${x2-8},${y2+8} ${x2},${y2-8} ${x2+8},${y2+8}`} fill="white" stroke={style.stroke} strokeWidth="2" />}
                {r.label && <text x={mx} y={my - 6} textAnchor="middle" fontSize="9" fontWeight="700" fill={style.stroke}>{r.label}</text>}
            </g>
        );
    });

    /* ── CENTER ── */
    const CENTER = (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{
                display: 'flex',
                borderBottom: '3px solid var(--border)',
                flexShrink: 0,
                overflowX: isMobile ? 'auto' : 'visible',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
            }}>
                {DIAGRAM_TABS.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                        flex: isMobile ? '1 0 auto' : 1,
                        minWidth: isMobile ? '110px' : 'auto',
                        padding: isMobile ? '0.4rem 0.2rem' : '0.55rem',
                        fontWeight: 800,
                        fontSize: isMobile ? '0.65rem' : '0.72rem',
                        cursor: 'pointer',
                        background: activeTab === t.id ? '#ff8a65' : 'var(--white)', border: 'none',
                        borderRight: '2px solid var(--border)', fontFamily: 'var(--font-main)', color: 'var(--text)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                    }}>{t.icon} {t.name}</button>
                ))}
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
                {activeTab === 'class' && (
                    <div style={{ height: '100%' }}>
                        <div style={{ padding: '0.4rem 0.8rem', background: '#f8f9fa', borderBottom: '2px solid var(--border)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button className="btn btn-sm btn-cyan" onClick={addClass} style={{ fontSize: '0.65rem' }}>+ Add Class</button>
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.3rem' }}>
                                {PREBUILT.map((pb, i) => (
                                    <button key={i} className="btn btn-sm" onClick={() => loadPrebuilt(i)}
                                        style={{ fontSize: '0.6rem', background: selectedPrebuilt === i ? '#ff8a65' : 'var(--white)' }}>{pb.name}</button>
                                ))}
                            </div>
                        </div>
                        <div ref={canvasRef} onMouseMove={handleDragMove} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}
                            style={{ width: isMobile ? 650 : '100%', height: 500, position: 'relative', background: '#0f172a', backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
                                {renderRelations()}
                            </svg>
                            {classes.map(cls => <ClassBox key={cls.id} cls={cls} onDragStart={handleDragStart} isActive={draggedClass === cls.id} />)}
                        </div>
                    </div>
                )}

                {activeTab === 'code' && (
                    <div style={{ padding: '1rem', display: 'flex', gap: '1rem', height: isMobile ? 'auto' : '100%', flexDirection: isMobile ? 'column' : 'row' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: isMobile ? 220 : 'auto' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.3rem' }}>Paste Java/Python Code:</div>
                            <textarea value={codeInput} onChange={e => setCodeInput(e.target.value)}
                                style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.72rem', padding: '0.75rem', border: '3px solid var(--border)', borderRadius: '8px', background: '#0f172a', color: '#a8e6cf', resize: 'none' }} />
                            <button className="btn btn-sm btn-cyan" onClick={handleParse} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}><SyncIcon size={14} /> Parse to UML</button>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.3rem' }}>Parsed Classes ({parsedClasses.length}):</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {parsedClasses.map(cls => (
                                    <div key={cls.id} style={{ border: '2px solid var(--border)', borderRadius: '6px', overflow: 'hidden', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                                        <div style={{ background: '#ff8a65', padding: '0.3rem 0.5rem', fontWeight: 800, fontFamily: 'var(--font-main)' }}>{cls.name}</div>
                                        <div style={{ padding: '0.3rem 0.5rem', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                                            {cls.fields.map((f, i) => <div key={i}>{f}</div>)}
                                        </div>
                                        <div style={{ padding: '0.3rem 0.5rem' }}>
                                            {cls.methods.map((m, i) => <div key={i}>{m}</div>)}
                                        </div>
                                    </div>
                                ))}
                                {parsedClasses.length === 0 && <div style={{ opacity: 0.4, fontSize: '0.75rem' }}>Click "Parse to UML" to generate class diagrams from your code.</div>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const LEFT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.5, textTransform: 'uppercase' }}>System State</div>
            {[
                { label: 'Elements', value: classes.length + (activeTab === 'class' ? relations.length : 0), color: '#ff8a65' },
                { label: 'Relationships', value: relations.length, color: '#66d9ef' },
                { label: 'Diagram Type', value: DIAGRAM_TABS.find(t => t.id === activeTab)?.name || '', color: '#a8e6cf', isText: true },
            ].map(s => (
                <div key={s.label} style={{ border: '2px solid var(--border)', borderRadius: '6px', padding: '0.5rem 0.75rem' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase' }}>{s.label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: s.isText ? '0.85rem' : '1.5rem', color: s.color }}>{s.value}</div>
                </div>
            ))}
            <div style={{ borderTop: '2px solid var(--border)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.4, marginBottom: '0.5rem' }}>RELATIONSHIP LEGEND</div>
                {Object.entries(REL_STYLES).map(([key, style]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.62rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                        <div style={{ width: 20, height: 3, background: style.stroke, borderRadius: '1px' }} />
                        {style.label}
                    </div>
                ))}
            </div>
        
            
        </div>
    );

    const RIGHT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="panel">
                <div className="panel-header" style={{ background: '#ff8a65', display: 'flex', alignItems: 'center', gap: '4px' }}><ChartIcon size={14} /> Algorithm Logic</div>
                <div style={{ padding: '0.75rem', fontSize: '0.78rem', lineHeight: 1.6 }}>
                    {activeTab === 'class' && <span><strong>Class Diagram</strong>: Shows the static structure of a system — classes, attributes, methods, and relationships. The foundation of OOP design.</span>}
                    {activeTab === 'code' && <span><strong>Code-to-UML</strong>: Paste Java or Python code and automatically extract class definitions, fields, methods, and visibility modifiers into UML class diagrams.</span>}
                </div>
            </div>
            <div className="panel">
                <div className="panel-header" style={{ background: '#ffd93d', display: 'flex', alignItems: 'center', gap: '4px' }}><LightbulbIcon size={14} /> Educational Insight</div>
                <div style={{ padding: '0.75rem', fontSize: '0.78rem', lineHeight: 1.6 }}>
                    {activeTab === 'class' && 'UML uses standard notation: + (public), - (private), # (protected). Relationships have priority: Composition > Aggregation > Association > Dependency.'}
                    {activeTab === 'code' && 'Most practical exam feature! Paste real code and see the UML structure instantly. Great for reverse engineering and documentation.'}
                </div>
            </div>
            <div style={{ background: '#111', color: '#ff8a65', padding: '0.75rem', borderRadius: '8px', border: '2px solid #ff8a65' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.5 }}>CONCEPT: UML</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', marginTop: '0.3rem' }}>Unified Modeling Language — standardized visual language for specifying, constructing, and documenting software artifacts.</div>
            </div>
        </div>
    );

    
    useSnapshot(useCallback((config, step) => {
        if (config.activeTab !== undefined) setActiveTab(config.activeTab);
        if (config.selectedPrebuilt !== undefined) setSelectedPrebuilt(config.selectedPrebuilt);
        if (config.codeInput !== undefined) setCodeInput(config.codeInput);

        setTimeout(() => {

        }, 50);
    }, []));

    return (
        <ImmersiveLayout isActive={true}
            snapshotData={{
                config: { activeTab, selectedPrebuilt, codeInput },
                step: 0
            }} title="UML Diagrams" icon={<ChartIcon size={22} />} moduleLabel="OOP MODULE"
            hideControls={true}
            isRunning={false} isPaused={false} isFinished={false} speed={speed} onSpeedChange={setSpeed}
            onStart={() => {}} onPause={() => {}} onResume={() => {}} onStep={() => {}}
            onReset={() => { setActiveTab('class'); loadPrebuilt(0); }}
            currentStepNum={DIAGRAM_TABS.findIndex(t => t.id === activeTab) + 1} totalSteps={DIAGRAM_TABS.length}
            phaseName={`${DIAGRAM_TABS.find(t => t.id === activeTab)?.name}`}
            centerContent={CENTER} leftContent={LEFT} rightContent={RIGHT}
            timelineItems={DIAGRAM_TABS.map((t, i) => ({ id: i, label: t.name, done: false, active: t.id === activeTab }))}
            legend={[{ color: '#ff8a65', label: 'Class' }, { color: '#64748b', label: 'Relationship' }]}>
            <div className="main-content">
                <Link to="/oops" style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← OOP Module</Link>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ChartIcon size={28} /> UML Diagrams</h1>
            </div>
        </ImmersiveLayout>
    );
}
