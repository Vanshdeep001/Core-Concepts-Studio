import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import useSnapshot from '../../hooks/useSnapshot';
import {
    PillarIcon, TerminalIcon, SaveIcon, GearIcon, ShuffleIcon, PlayIcon,
    InfoIcon, ShieldIcon, LightbulbIcon, ZapIcon, AlertIcon, TreeIcon, WrenchIcon,
    BlueprintIcon, BuildIcon, PlugIcon, BoxIcon, CrownIcon
} from '../../components/Icons';

/* ── DATA TEMPLATES ── */
const BASE_CLASSES = {
    Shape: {
        name: 'Shape',
        concrete: [
            { name: 'getColor()', desc: 'Returns color', code: 'return this.color;' },
            { name: 'toString()', desc: 'Returns shape description', code: 'return "Shape[" + color + "]";' }
        ],
        abstract: [
            { name: 'area()', desc: 'Calculate shape area' },
            { name: 'perimeter()', desc: 'Calculate shape perimeter' }
        ]
    },
    Vehicle: {
        name: 'Vehicle',
        concrete: [
            { name: 'getVin()', desc: 'Returns serial number', code: 'return "1A9X238F";' },
            { name: 'start()', desc: 'Starts the engine', code: 'this.engineRunning = true;' }
        ],
        abstract: [
            { name: 'accelerate()', desc: 'Go faster' },
            { name: 'brake()', desc: 'Slow down' }
        ]
    },
    Animal: {
        name: 'Animal',
        concrete: [
            { name: 'getName()', desc: 'Returns animal name', code: 'return this.name;' },
            { name: 'sleep()', desc: 'Zzzz...', code: 'this.state = "sleeping";' }
        ],
        abstract: [
            { name: 'makeSound()', desc: 'Make animal noise' },
            { name: 'eat()', desc: 'Eat food' }
        ]
    }
};

const ALL_INTERFACES = {
    Flyable: {
        name: 'Flyable',
        color: '#2563eb', // Royal Blue
        methods: [
            { name: 'fly()', desc: 'Fly in the sky' },
            { name: 'land()', desc: 'Land safely' }
        ]
    },
    Swimmable: {
        name: 'Swimmable',
        color: '#db2777', // Deep Pink/Magenta
        methods: [
            { name: 'swim()', desc: 'Swim in water' },
            { name: 'dive()', desc: 'Dive underwater' }
        ]
    },
    Runnable: {
        name: 'Runnable',
        color: '#7c3aed', // Purple
        methods: [
            { name: 'run()', desc: 'Run on the ground' },
            { name: 'sprint()', desc: 'Run at full speed' }
        ]
    }
};

const INTERFACES = Object.values(ALL_INTERFACES);

const FLOWCHART_NODES = [
    {
        id: 0,
        shortName: 'Store Data?',
        q: 'Do you need to store data (like color or size variables) inside this class?',
        yes: 1, // leaf: Abstract Class
        no: 2,  // branch: Multiple Inheritance
    },
    {
        id: 1,
        isLeaf: true,
        type: 'abstract',
        label: 'Use Abstract Class',
        reason: 'Abstract classes are great when you want to store variables (like color or size) and write basic setup code that all child classes can share.',
    },
    {
        id: 2,
        shortName: 'Multiple Behaviors?',
        q: 'Do you need your class to have multiple different behaviors at the same time (like Flyable AND Swimmable)?',
        yes: 3, // leaf: Interface
        no: 4,  // branch: Share Pre-written Code
    },
    {
        id: 3,
        isLeaf: true,
        type: 'interface',
        label: 'Use Interface',
        reason: 'A class can only have ONE parent class, but it can follow as many interface checklists (like Flyable and Swimmable) as you want.',
    },
    {
        id: 4,
        shortName: 'Share Pre-written Code?',
        q: 'Do you want to share pre-written helper code that child classes can run directly?',
        yes: 5, // leaf: Abstract Class
        no: 6,  // leaf: Interface
    },
    {
        id: 5,
        isLeaf: true,
        type: 'abstract',
        label: 'Use Abstract Class',
        reason: 'Choose this when you want to write some methods now for everyone to use, and leave the rest for child classes to finish.',
    },
    {
        id: 6,
        isLeaf: true,
        type: 'interface',
        label: 'Use Interface',
        reason: 'Choose this when you want a pure checklist of rules, without writing any actual code yet.',
    }
];

const getFileExtension = (lang) => {
    if (lang === 'Java') return 'java';
    if (lang === 'Python') return 'py';
    return lang === 'C++' ? 'hpp' : 'cpp';
};

const getFilesList = (lang, baseClass, interfaces, concreteName) => {
    const ext = getFileExtension(lang);
    const list = [];
    if (baseClass !== 'None') {
        list.push(`${baseClass}.${ext}`);
    }
    interfaces.forEach(iface => {
        list.push(`${iface}.${ext}`);
    });
    const concreteExt = lang === 'C++' ? 'cpp' : ext;
    list.push(`${concreteName}.${concreteExt}`);
    return list;
};

const getFileContent = (fileName, lang, baseClass, interfaces, concreteName, customBase, interfaceMethods, crafted) => {
    const ext = getFileExtension(lang);
    
    // Check if it's the base class file
    if (baseClass !== 'None' && fileName.startsWith(baseClass)) {
        const classData = BASE_CLASSES[baseClass];
        const concreteMethods = classData ? classData.concrete : [];
        const abstractMethods = classData ? [...classData.abstract, ...customBase] : customBase;
        
        if (lang === 'Java') {
            return `
<span style="color: #ff79c6">public abstract class</span> <span style="color: #50fa7b">${baseClass}</span> {
    <span style="color: #ff79c6">private</span> String name = <span style="color: #f1fa8c">"Parent"</span>;

    <span style="color: #6272a4">// Already written methods:</span>
${concreteMethods.map(m => `    <span style="color: #ff79c6">public</span> String <span style="color: #50fa7b">${m.name.replace('()', '')}</span>() { ${m.code} }`).join('\n')}

    <span style="color: #6272a4">// Empty methods that child must write:</span>
${abstractMethods.map(m => `    <span style="color: #ff79c6">public abstract double</span> <span style="color: #50fa7b">${m.name.replace('()', '')}</span>();`).join('\n')}
}`;
        }
        
        if (lang === 'Python') {
            return `
<span style="color: #ff79c6">from</span> abc <span style="color: #ff79c6">import</span> ABC, abstractmethod

<span style="color: #ff79c6">class</span> <span style="color: #50fa7b">${baseClass}</span>(ABC):
    <span style="color: #ff79c6">def</span> <span style="color: #50fa7b">__init__</span>(self):
        self.name = <span style="color: #f1fa8c">"Parent"</span>

${concreteMethods.map(m => `    <span style="color: #ff79c6">def</span> <span style="color: #50fa7b">${m.name.replace('()', '')}</span>(self):\n        return self.name`).join('\n\n')}

${abstractMethods.map(m => `    <span style="color: #ff79c6">@abstractmethod</span>\n    <span style="color: #ff79c6">def</span> <span style="color: #50fa7b">${m.name.replace('()', '')}</span>(self):\n        <span style="color: #ff79c6">pass</span>`).join('\n\n')}
`;
        }
        
        // C++
        return `
<span style="color: #ff79c6">#include</span> <span style="color: #f1fa8c">&lt;string&gt;</span>

<span style="color: #ff79c6">class</span> <span style="color: #50fa7b">${baseClass}</span> {
<span style="color: #ff79c6">public</span>:
    <span style="color: #6272a4">// Already written methods</span>
${concreteMethods.map(m => `    std::string <span style="color: #50fa7b">${m.name.replace('()', '')}</span>() { ${m.code} }`).join('\n')}

    <span style="color: #6272a4">// Pure virtual (empty) methods</span>
${abstractMethods.map(m => `    <span style="color: #ff79c6">virtual double</span> <span style="color: #50fa7b">${m.name.replace('()', '')}</span>() = <span style="color: #bd93f9">0</span>;`).join('\n')}
};`;
    }

    // Check if it's an interface file
    const matchingIface = interfaces.find(iface => fileName.startsWith(iface));
    if (matchingIface) {
        const ifaceData = ALL_INTERFACES[matchingIface];
        const methods = ifaceData ? ifaceData.methods : [];
        
        if (lang === 'Java') {
            return `
<span style="color: #ff79c6">public interface</span> <span style="color: #50fa7b">${matchingIface}</span> {
${methods.map(m => `    <span style="color: #ff79c6">void</span> <span style="color: #50fa7b">${m.name.replace('()', '')}</span>();`).join('\n')}
}`;
        }
        if (lang === 'Python') {
            return `
<span style="color: #ff79c6">from</span> abc <span style="color: #ff79c6">import</span> ABC, abstractmethod

<span style="color: #ff79c6">class</span> <span style="color: #50fa7b">${matchingIface}</span>(ABC):
${methods.map(m => `    <span style="color: #ff79c6">@abstractmethod</span>\n    <span style="color: #ff79c6">def</span> <span style="color: #50fa7b">${m.name.replace('()', '')}</span>(self):\n        <span style="color: #ff79c6">pass</span>`).join('\n\n')}
`;
        }
        return `
<span style="color: #ff79c6">class</span> <span style="color: #50fa7b">${matchingIface}</span> {
<span style="color: #ff79c6">public</span>:
${methods.map(m => `    <span style="color: #ff79c6">virtual void</span> <span style="color: #50fa7b">${m.name.replace('()', '')}</span>() = <span style="color: #bd93f9">0</span>;`).join('\n')}
};`;
    }

    // Concrete Class File
    const parentsList = [];
    if (baseClass !== 'None') parentsList.push(baseClass);
    interfaces.forEach(i => parentsList.push(i));
    
    const baseClassData = baseClass !== 'None' ? BASE_CLASSES[baseClass] : null;
    const baseAbstract = baseClassData ? [...baseClassData.abstract, ...customBase] : customBase;
    const required = [...baseAbstract.map(m => m.name), ...interfaceMethods.map(m => m.name)];

    if (lang === 'Java') {
        const extendsClause = baseClass !== 'None' ? ` <span style="color: #ff79c6">extends</span> ${baseClass}` : '';
        const implementsClause = interfaces.length > 0 ? ` <span style="color: #ff79c6">implements</span> ${interfaces.join(', ')}` : '';
        
        return `
<span style="color: #ff79c6">public class</span> <span style="color: #50fa7b">${concreteName}</span>${extendsClause}${implementsClause} {
${required.map(m => {
    const impl = crafted[m] || '0.0';
    return `    <span style="color: #ff79c6">@Override</span>\n    <span style="color: #ff79c6">public double</span> <span style="color: #50fa7b">${m.replace('()', '')}</span>() {\n        <span style="color: #ff79c6">return</span> ${impl};\n    }`;
}).join('\n\n')}
}`;
    }

    if (lang === 'Python') {
        const inheritClause = parentsList.length > 0 ? `(${parentsList.join(', ')})` : '';
        return `
<span style="color: #ff79c6">class</span> <span style="color: #50fa7b">${concreteName}</span>${inheritClause}:
${required.length === 0 ? '    <span style="color: #ff79c6">pass</span>' : required.map(m => {
    const impl = crafted[m] || '0.0';
    return `    <span style="color: #ff79c6">def</span> <span style="color: #50fa7b">${m.replace('()', '')}</span>(self):\n        <span style="color: #ff79c6">return</span> ${impl}`;
}).join('\n\n')}
`;
    }

    // C++
    const inheritanceList = [];
    if (baseClass !== 'None') inheritanceList.push(`<span style="color: #ff79c6">public</span> ${baseClass}`);
    interfaces.forEach(i => inheritanceList.push(`<span style="color: #ff79c6">public</span> ${i}`));
    const cppInherit = inheritanceList.length > 0 ? ` : ${inheritanceList.join(', ')}` : '';

    return `
<span style="color: #ff79c6">class</span> <span style="color: #50fa7b">${concreteName}</span>${cppInherit} {
<span style="color: #ff79c6">public</span>:
${required.map(m => {
    const impl = crafted[m] || '0.0';
    return `    <span style="color: #ff79c6">double</span> <span style="color: #50fa7b">${m.replace('()', '')}</span>() <span style="color: #ff79c6">override</span> {\n        <span style="color: #ff79c6">return</span> ${impl};\n    }`;
}).join('\n\n')}
};`;
};

export default function AbstractInterfaceSim() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Dynamic Class Configurator State
    const [selectedBaseClass, setSelectedBaseClass] = useState('Shape');
    const [selectedInterfaces, setSelectedInterfaces] = useState(['Flyable']);
    const [concreteClassName, setConcreteClassName] = useState('Quadcopter');
    
    // Custom user-added methods
    const [customBaseAbstracts, setCustomBaseAbstracts] = useState([]);
    const [customInterfaceMethods, setCustomInterfaceMethods] = useState([]);
    const [newBaseMethodName, setNewBaseMethodName] = useState('');
    const [newInterfaceMethodName, setNewInterfaceMethodName] = useState('');

    // Method implementation crafting
    const [craftedImplementations, setCraftedImplementations] = useState({});
    const [activeCraftingMethod, setActiveCraftingMethod] = useState(null);
    const [craftingInput, setCraftingInput] = useState('');

    // Multi-assembly Tab States
    const [activeInterfacesMulti, setActiveInterfacesMulti] = useState(['Flyable']);
    const [extendedClassMulti, setExtendedClassMulti] = useState(null);
    const [showInheritanceError, setShowInheritanceError] = useState(false);

    // Language/Flowchart States
    const [lang, setLang] = useState('Java');
    const [activeFile, setActiveFile] = useState('Shape.java');
    const [flowHistory, setFlowHistory] = useState([0]);
    const [speed, setSpeed] = useState(700);
    const [view, setView] = useState('blueprint');
    const [consoleLogs, setConsoleLogs] = useState(['[SYSTEM] Sandbox ready for coding.']);

    // Log helper
    const addLog = useCallback((msg) => {
        setConsoleLogs(prev => [...prev.slice(-3), `[${new Date().toLocaleTimeString()}] ${msg}`]);
    }, []);

    const filesList = getFilesList(lang, selectedBaseClass, selectedInterfaces, concreteClassName);

    // Sync file selection when language, base class, or interfaces change
    useEffect(() => {
        if (!filesList.includes(activeFile)) {
            setActiveFile(filesList[0] || '');
        }
    }, [lang, selectedBaseClass, selectedInterfaces, concreteClassName, filesList, activeFile]);

    // Handle adding custom base abstract method
    const handleAddBaseMethod = () => {
        if (!newBaseMethodName.trim()) return;
        const normalized = newBaseMethodName.includes('()') ? newBaseMethodName.trim() : `${newBaseMethodName.trim()}()`;
        setCustomBaseAbstracts(prev => [...prev, { name: normalized, desc: 'Your custom empty method' }]);
        addLog(`[BASE CLASS] Added new empty method: ${normalized}`);
        setNewBaseMethodName('');
    };

    // Handle adding custom interface method
    const handleAddInterfaceMethod = () => {
        if (!newInterfaceMethodName.trim()) return;
        const normalized = newInterfaceMethodName.includes('()') ? newInterfaceMethodName.trim() : `${newInterfaceMethodName.trim()}()`;
        setCustomInterfaceMethods(prev => [...prev, { name: normalized, desc: 'Your custom checklist rule' }]);
        addLog(`[INTERFACE] Added new rule: ${normalized}`);
        setNewInterfaceMethodName('');
    };

    // Toggle multi interface in Assembly tab
    const toggleInterfaceMulti = (ifaceName) => {
        setActiveInterfacesMulti(prev => {
            if (prev.includes(ifaceName)) {
                addLog(`[REMOVED] Unplugged behavior: ${ifaceName}`);
                return prev.filter(n => n !== ifaceName);
            } else {
                addLog(`[ADDED] Plugged in behavior: ${ifaceName}`);
                return [...prev, ifaceName];
            }
        });
    };

    // Set extended class for multi inheritance demonstration
    const handleExtendClassMulti = (className) => {
        if (extendedClassMulti === className) {
            setExtendedClassMulti(null);
            addLog(`[PARENT CLASS] Removed parent class.`);
        } else if (extendedClassMulti !== null) {
            setShowInheritanceError(true);
            addLog(`[ERROR] Limit reached! You can only inherit from ONE parent class.`);
            setTimeout(() => setShowInheritanceError(false), 2000);
        } else {
            setExtendedClassMulti(className);
            addLog(`[PARENT CLASS] Selected parent: ${className}`);
        }
    };

    // Flowchart answer navigation
    const handleFlowChoice = (currentNodeId, choice) => {
        const node = FLOWCHART_NODES.find(n => n.id === currentNodeId);
        if (!node) return;
        const nextId = choice ? node.yes : node.no;
        const historyIndex = flowHistory.indexOf(currentNodeId);
        const newHistory = flowHistory.slice(0, historyIndex + 1);
        newHistory.push(nextId);
        setFlowHistory(newHistory);
        const nextNode = FLOWCHART_NODES.find(n => n.id === nextId);
        if (nextNode?.isLeaf) {
            addLog(`[GUIDE] Recommendation found: ${nextNode.label}`);
        } else {
            addLog(`[GUIDE] Answered question.`);
        }
    };

    const resetFlowchart = () => {
        setFlowHistory([0]);
        addLog(`[GUIDE] Guide restarted.`);
    };

    // Get current lists based on selections
    const baseClassData = selectedBaseClass !== 'None' ? BASE_CLASSES[selectedBaseClass] : null;
    const baseConcrete = baseClassData ? baseClassData.concrete : [];
    const baseAbstract = baseClassData ? [...baseClassData.abstract, ...customBaseAbstracts] : [...customBaseAbstracts];
    
    const activeInterfaceData = selectedInterfaces.map(name => ALL_INTERFACES[name]).filter(Boolean);
    const interfaceMethods = [
        ...activeInterfaceData.flatMap(i => i.methods),
        ...customInterfaceMethods
    ];

    const requiredMethods = [...baseAbstract.map(m => m.name), ...interfaceMethods.map(m => m.name)];
    const blueprintCompleted = requiredMethods.length > 0 && requiredMethods.every(m => craftedImplementations[m]);

    // Handle compiling custom return code
    const handleSaveCraft = () => {
        if (!activeCraftingMethod) return;
        const value = craftingInput.trim() || '"default"';
        setCraftedImplementations(prev => ({
            ...prev,
            [activeCraftingMethod]: value
        }));
        addLog(`[SAVED] Added code for ${activeCraftingMethod}: return ${value};`);
        setActiveCraftingMethod(null);
        setCraftingInput('');
    };

    // Remove crafted implementation
    const handleRemoveCraft = (name) => {
        setCraftedImplementations(prev => {
            const next = { ...prev };
            delete next[name];
            return next;
        });
        addLog(`[REMOVED] Cleared code for ${name}`);
    };

    // Calculate decision path names for history display
    const getPathHistory = () => {
        const path = [];
        for (let i = 0; i < flowHistory.length - 1; i++) {
            const currentId = flowHistory[i];
            const nextId = flowHistory[i + 1];
            const node = FLOWCHART_NODES.find(n => n.id === currentId);
            if (node) {
                const choice = node.yes === nextId ? 'YES' : 'NO';
                path.push({ name: node.shortName, choice });
            }
        }
        return path;
    };

    const activeNodeId = flowHistory[flowHistory.length - 1];
    const activeNode = FLOWCHART_NODES.find(n => n.id === activeNodeId);

    /* ── CENTER VIZ PANELS ── */
    const CENTER = (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
            {/* Top View Selector Bar */}
            <div style={{
                display: 'flex',
                borderBottom: '4px solid var(--border)',
                flexShrink: 0,
                background: 'var(--white)',
                overflowX: isMobile ? 'auto' : 'visible',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
            }}>
                {[
                    ['blueprint', 'Class Blueprint', 'var(--yellow)'],
                    ['multi', 'Combine Rules', 'var(--cyan)'],
                    ['lang', 'View Code', 'var(--purple)'],
                    ['flowchart', 'Decision Guide', 'var(--pink)']
                ].map(([k, l, color]) => (
                    <button key={k} onClick={() => setView(k)} style={{
                        flex: isMobile ? '1 0 auto' : 1,
                        minWidth: isMobile ? '110px' : 'auto',
                        padding: isMobile ? '0.5rem 0.4rem' : '0.8rem 0.4rem',
                        fontWeight: 900,
                        fontSize: isMobile ? '0.62rem' : '0.75rem',
                        cursor: 'pointer',
                        background: view === k ? color : 'var(--white)', border: 'none',
                        borderRight: '4px solid var(--border)', fontFamily: 'var(--font-main)', color: 'var(--text)',
                        textTransform: 'uppercase', transition: 'all 0.15s',
                        outline: 'none'
                    }}>{l}</button>
                ))}
            </div>

            {/* Inner Content Workspace */}
            <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem', position: 'relative' }}>
                {/* 1. CLASS BLUEPRINT TAB */}
                {view === 'blueprint' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', width: '100%' }}>
                        
                        {/* Preset Selector Bar */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {[
                                { name: 'Quadcopter', base: 'Vehicle', ifaces: ['Flyable', 'Swimmable'], label: 'Quadcopter' },
                                { name: 'BioDrone', base: 'Animal', ifaces: ['Flyable', 'Runnable'], label: 'BioDrone' },
                                { name: 'SmartRobot', base: 'None', ifaces: ['Runnable', 'Swimmable'], label: 'SmartRobot' }
                            ].map(p => {
                                const active = selectedBaseClass === p.base && selectedInterfaces.length === p.ifaces.length && p.ifaces.every(x => selectedInterfaces.includes(x)) && concreteClassName === p.name;
                                return (
                                    <button
                                        key={p.name}
                                        onClick={() => {
                                            setSelectedBaseClass(p.base);
                                            setSelectedInterfaces(p.ifaces);
                                            setConcreteClassName(p.name);
                                            addLog(`Preset: ${p.name}`);
                                        }}
                                        style={{
                                            padding: '0.4rem 0.8rem',
                                            fontSize: '0.68rem',
                                            fontWeight: 900,
                                            fontFamily: 'var(--font-main)',
                                            border: 'var(--border-width) solid var(--border)',
                                            borderRadius: 'var(--radius)',
                                            background: active ? 'var(--yellow)' : 'var(--white)',
                                            color: 'var(--text)',
                                            boxShadow: active ? 'var(--shadow-sm)' : 'none',
                                            cursor: 'pointer',
                                            transform: active ? 'translate(-1px, -1px)' : 'none',
                                            transition: 'all 0.1s'
                                        }}
                                    >
                                        {p.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* 2-Column Layout */}
                        <div style={{ display: 'flex', gap: '1.2rem', flexDirection: isMobile ? 'column' : 'row', alignItems: 'stretch' }}>
                            
                            {/* Left — Settings Panel */}
                            <div style={{ flex: 1, border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--white)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                                <div style={{ background: 'var(--yellow)', borderBottom: 'var(--border-width) solid var(--border)', padding: '0.5rem 0.8rem', fontWeight: 900, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <WrenchIcon size={16} color="var(--text)" /> Class Configuration
                                </div>
                                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {/* Class Name */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                        <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Class Name</span>
                                        <input
                                            type="text"
                                            value={concreteClassName}
                                            onChange={e => setConcreteClassName(e.target.value.replace(/\s+/g, ''))}
                                            style={{ border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)', padding: '0.4rem 0.6rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', background: 'var(--bg)', color: 'var(--text)', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                                        />
                                    </div>

                                    {/* Parent Class */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                        <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Extends (Max 1)</span>
                                        <select
                                            value={selectedBaseClass}
                                            onChange={e => setSelectedBaseClass(e.target.value)}
                                            style={{ border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)', padding: '0.4rem 0.6rem', fontSize: '0.72rem', fontWeight: 'bold', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                                        >
                                            <option value="Shape">Shape</option>
                                            <option value="Vehicle">Vehicle</option>
                                            <option value="Animal">Animal</option>
                                            <option value="None">None</option>
                                        </select>
                                    </div>

                                    {/* Interfaces */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <span style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Implements (Unlimited)</span>
                                        {Object.keys(ALL_INTERFACES).map(name => {
                                            const active = selectedInterfaces.includes(name);
                                            return (
                                                <div key={name} onClick={() => { setSelectedInterfaces(prev => active ? prev.filter(n => n !== name) : [...prev, name]); addLog(`Toggled: ${name}`); }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                        padding: '0.4rem 0.6rem', cursor: 'pointer',
                                                        border: `var(--border-width) solid ${active ? ALL_INTERFACES[name].color : 'var(--border)'}`,
                                                        borderRadius: 'var(--radius)',
                                                        background: active ? `${ALL_INTERFACES[name].color}15` : 'var(--bg)',
                                                        boxShadow: active ? 'var(--shadow-sm)' : 'none',
                                                        transform: active ? 'translate(-1px, -1px)' : 'none',
                                                        transition: 'all 0.1s'
                                                    }}>
                                                    <div style={{ width: 14, height: 14, border: `2px solid ${active ? ALL_INTERFACES[name].color : 'var(--border)'}`, background: active ? ALL_INTERFACES[name].color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        {active && <span style={{ color: '#fff', fontSize: '0.6rem', fontWeight: 900 }}>✓</span>}
                                                    </div>
                                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: active ? ALL_INTERFACES[name].color : 'var(--text)' }}>{name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Right — Composition Visualizer + Code */}
                            <div style={{ flex: 1.4, display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                
                                {/* Wiring Diagram */}
                                <div style={{ border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--white)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                                    <div style={{ background: 'var(--cyan)', borderBottom: 'var(--border-width) solid var(--border)', padding: '0.5rem 0.8rem', fontWeight: 900, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <GearIcon size={16} color="var(--text)" /> Composition Diagram
                                    </div>
                                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                                        {/* Source nodes row */}
                                        <div style={{ display: 'flex', gap: '0.8rem', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
                                            {selectedBaseClass !== 'None' ? (
                                                <div style={{ flex: 1, minWidth: 120, border: 'var(--border-width) solid var(--border)', background: 'var(--orange)', borderRadius: 'var(--radius)', padding: '1.2rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                    <div style={{ fontSize: '0.65rem', fontWeight: 900, background: 'var(--text)', color: 'var(--orange)', padding: '2px 8px', display: 'inline-block', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>EXTENDS</div>
                                                    <div style={{ fontWeight: 900, fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }}>{selectedBaseClass}</div>
                                                </div>
                                            ) : (
                                                <div style={{ flex: 1, minWidth: 120, border: 'var(--border-width) dashed var(--border)', borderRadius: 'var(--radius)', padding: '0.5rem', textAlign: 'center', opacity: 0.35 }}>
                                                    <div style={{ fontSize: '0.6rem', fontWeight: 800 }}>No Parent</div>
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: 120 }}>
                                                {selectedInterfaces.map(name => (
                                                    <div key={name} style={{ border: `var(--border-width) solid ${ALL_INTERFACES[name].color}`, background: `${ALL_INTERFACES[name].color}20`, borderRadius: 'var(--radius)', padding: '0.4rem', textAlign: 'center', boxShadow: `2px 2px 0 ${ALL_INTERFACES[name].color}` }}>
                                                        <div style={{ fontSize: '0.5rem', fontWeight: 900, background: ALL_INTERFACES[name].color, color: '#fff', padding: '1px 5px', display: 'inline-block', marginBottom: '0.1rem' }}>IMPLEMENTS</div>
                                                        <div style={{ fontWeight: 900, fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: ALL_INTERFACES[name].color }}>{name}</div>
                                                    </div>
                                                ))}
                                                {selectedInterfaces.length === 0 && (
                                                    <div style={{ border: 'var(--border-width) dashed var(--border)', borderRadius: 'var(--radius)', padding: '0.5rem', textAlign: 'center', opacity: 0.35 }}>
                                                        <div style={{ fontSize: '0.6rem', fontWeight: 800 }}>No Interfaces</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Arrow connector */}
                                        <div style={{ width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '12px solid var(--border)' }} />

                                        {/* Result node */}
                                        <div style={{ width: '100%', maxWidth: 240, border: 'var(--border-width) solid var(--border)', background: 'var(--green)', borderRadius: 'var(--radius)', padding: '0.6rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                                            <div style={{ fontSize: '0.5rem', fontWeight: 900, background: 'var(--text)', color: 'var(--green)', padding: '1px 6px', display: 'inline-block', marginBottom: '0.15rem' }}>ASSEMBLED</div>
                                            <div style={{ fontWeight: 900, fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>class {concreteClassName}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Code Output */}
                                <div style={{ border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
                                    <div style={{ background: '#21222c', borderBottom: 'var(--border-width) solid var(--border)', padding: '0.45rem 0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5555', border: '2px solid var(--border)' }} />
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f1fa8c', border: '2px solid var(--border)' }} />
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#50fa7b', border: '2px solid var(--border)' }} />
                                            <span style={{ fontSize: '0.6rem', color: '#8b949e', fontFamily: 'var(--font-mono)', marginLeft: '0.5rem' }}>{concreteClassName}.java</span>
                                        </div>
                                        <span style={{ color: '#50fa7b', fontWeight: 900, fontSize: '0.52rem', letterSpacing: '0.05em', border: '2px solid #50fa7b', padding: '1px 6px' }}>COMPILED</span>
                                    </div>
                                    <div style={{ padding: '0.8rem', background: '#282a36', color: '#f8f8f2', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', lineHeight: 1.6, overflowX: 'auto' }}>
                                        <div><span style={{ color: '#ff79c6' }}>public class</span> <span style={{ color: '#8be9fd' }}>{concreteClassName}</span></div>
                                        {selectedBaseClass !== 'None' && <div style={{ paddingLeft: '1rem' }}><span style={{ color: '#ff79c6' }}>extends</span> <span style={{ color: '#f1fa8c' }}>{selectedBaseClass}</span></div>}
                                        {selectedInterfaces.length > 0 && <div style={{ paddingLeft: '1rem' }}><span style={{ color: '#ff79c6' }}>implements</span> <span style={{ color: '#bd93f9' }}>{selectedInterfaces.join(', ')}</span></div>}
                                        <div>{'{'}</div>
                                        {selectedBaseClass !== 'None' && (
                                            <div style={{ paddingLeft: '1.2rem', color: '#6272a4', fontStyle: 'italic' }}>
                                                {'// Inherited fields & methods'}
                                            </div>
                                        )}
                                        {requiredMethods.map(m => (
                                            <div key={m} style={{ paddingLeft: '1.2rem', margin: '0.3rem 0' }}>
                                                <span style={{ color: '#ffb86c' }}>@Override</span>
                                                <div><span style={{ color: '#ff79c6' }}>public double</span> <span style={{ color: '#50fa7b' }}>{m.replace('()', '')}</span>() {'{'}</div>
                                                <div style={{ paddingLeft: '1.2rem' }}><span style={{ color: '#ff79c6' }}>return</span> <span style={{ color: '#bd93f9' }}>1.0</span>;</div>
                                                <div>{'}'}</div>
                                            </div>
                                        ))}
                                        <div>{'}'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. COMBINE RULES TAB */}
                {view === 'multi' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', width: '100%' }}>
                        <div style={{ display: 'flex', gap: '1.2rem', flexDirection: isMobile ? 'column' : 'row', alignItems: 'stretch' }}>
                            
                            {/* Left — Selection Panel */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {/* Base Class */}
                                <div style={{ border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--white)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                                    <div style={{ background: 'var(--orange)', borderBottom: 'var(--border-width) solid var(--border)', padding: '0.5rem 0.8rem', fontWeight: 900, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <BuildIcon size={16} color="var(--text)" /> 1. Base Chassis (Extends)
                                    </div>
                                    <div style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {['Machine', 'Organism'].map(name => {
                                            const active = extendedClassMulti === name;
                                            return (
                                                <div key={name} onClick={() => handleExtendClassMulti(name)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                        padding: '0.45rem 0.6rem', cursor: 'pointer',
                                                        border: `var(--border-width) solid ${active ? '#d97706' : 'var(--border)'}`,
                                                        borderRadius: 'var(--radius)',
                                                        background: active ? 'var(--orange)' : 'var(--bg)',
                                                        boxShadow: active ? 'var(--shadow-sm)' : 'none',
                                                        transform: active ? 'translate(-1px, -1px)' : 'none',
                                                        transition: 'all 0.1s'
                                                    }}>
                                                    <div style={{ width: 14, height: 14, border: '2px solid var(--border)', borderRadius: '50%', background: active ? 'var(--text)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {active && <span style={{ color: 'var(--orange)', fontSize: '0.55rem', fontWeight: 900 }}>✓</span>}
                                                    </div>
                                                    <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>{name}</span>
                                                    <span style={{ marginLeft: 'auto', fontSize: '0.5rem', fontWeight: 900, opacity: 0.5 }}>MAX 1</span>
                                                </div>
                                            );
                                        })}
                                        <AnimatePresence>
                                            {showInheritanceError && (
                                                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                                    style={{ border: 'var(--border-width) solid #d73a49', background: '#d73a4920', borderRadius: 'var(--radius)', padding: '0.4rem 0.6rem', fontSize: '0.62rem', fontWeight: 900, color: '#d73a49', textAlign: 'center' }}>
                                                    Single Inheritance Rule: Only ONE parent allowed!
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Interfaces */}
                                <div style={{ border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--white)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                                    <div style={{ background: 'var(--cyan)', borderBottom: 'var(--border-width) solid var(--border)', padding: '0.5rem 0.8rem', fontWeight: 900, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <PlugIcon size={16} color="var(--text)" /> 2. Plug-ins (Implements)
                                    </div>
                                    <div style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {INTERFACES.map(iface => {
                                            const active = activeInterfacesMulti.includes(iface.name);
                                            return (
                                                <div key={iface.name} onClick={() => toggleInterfaceMulti(iface.name)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                        padding: '0.45rem 0.6rem', cursor: 'pointer',
                                                        border: `var(--border-width) solid ${active ? iface.color : 'var(--border)'}`,
                                                        borderRadius: 'var(--radius)',
                                                        background: active ? `${iface.color}20` : 'var(--bg)',
                                                        boxShadow: active ? `2px 2px 0 ${iface.color}` : 'none',
                                                        transform: active ? 'translate(-1px, -1px)' : 'none',
                                                        transition: 'all 0.1s'
                                                    }}>
                                                    <div style={{ width: 14, height: 14, border: `2px solid ${active ? iface.color : 'var(--border)'}`, background: active ? iface.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {active && <span style={{ color: '#fff', fontSize: '0.55rem', fontWeight: 900 }}>✓</span>}
                                                    </div>
                                                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: active ? iface.color : 'var(--text)' }}>{iface.name}</span>
                                                    <span style={{ marginLeft: 'auto', fontSize: '0.5rem', fontWeight: 900, opacity: 0.5 }}>UNLIMITED</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Right — Socket Visualizer */}
                            <div style={{ flex: 1.3, border: 'var(--border-width) solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--white)', boxShadow: 'var(--shadow)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ background: 'var(--green)', borderBottom: 'var(--border-width) solid var(--border)', padding: '0.5rem 0.8rem', fontWeight: 900, fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><GearIcon size={16} /> Assembly Board</span>
                                    <span style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>class SmartRobot</span>
                                </div>
                                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                                    {/* Chassis socket */}
                                    <div style={{
                                        border: `var(--border-width) ${extendedClassMulti ? 'solid' : 'dashed'} var(--border)`,
                                        borderRadius: 'var(--radius)', padding: '0.5rem 0.8rem',
                                        background: extendedClassMulti ? 'var(--orange)' : 'var(--bg)',
                                        display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.15s'
                                    }}>
                                        <div style={{ width: 8, height: 8, background: extendedClassMulti ? 'var(--text)' : 'var(--border)', opacity: extendedClassMulti ? 1 : 0.3 }} />
                                        <span style={{ fontSize: '0.7rem', fontWeight: 900, fontFamily: 'var(--font-mono)', opacity: extendedClassMulti ? 1 : 0.4 }}>
                                            {extendedClassMulti ? `extends ${extendedClassMulti}` : 'Base Class Slot (empty)'}
                                        </span>
                                        <span style={{
                                            marginLeft: 'auto', fontSize: '0.5rem', fontWeight: 900,
                                            background: extendedClassMulti ? 'var(--text)' : 'transparent',
                                            color: extendedClassMulti ? 'var(--orange)' : 'var(--text)',
                                            border: 'var(--border-width) solid var(--border)',
                                            padding: '0px 5px', opacity: extendedClassMulti ? 1 : 0.3
                                        }}>
                                            {extendedClassMulti ? 'WIRED' : 'EMPTY'}
                                        </span>
                                    </div>

                                    {/* Interface sockets */}
                                    {INTERFACES.map(iface => {
                                        const active = activeInterfacesMulti.includes(iface.name);
                                        return (
                                            <div key={iface.name} style={{
                                                border: `var(--border-width) ${active ? 'solid' : 'dashed'} ${active ? iface.color : 'var(--border)'}`,
                                                borderRadius: 'var(--radius)', padding: '0.5rem 0.8rem',
                                                background: active ? `${iface.color}20` : 'var(--bg)',
                                                display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.15s'
                                            }}>
                                                <div style={{ width: 8, height: 8, background: active ? iface.color : 'var(--border)', opacity: active ? 1 : 0.3 }} />
                                                <span style={{ fontSize: '0.68rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: active ? iface.color : 'var(--text)', opacity: active ? 1 : 0.4 }}>
                                                    {active ? `implements ${iface.name}` : `${iface.name} Slot (empty)`}
                                                </span>
                                                <span style={{
                                                    marginLeft: 'auto', fontSize: '0.5rem', fontWeight: 900,
                                                    background: active ? iface.color : 'transparent',
                                                    color: active ? '#fff' : 'var(--text)',
                                                    border: `var(--border-width) solid ${active ? iface.color : 'var(--border)'}`,
                                                    padding: '0px 5px', opacity: active ? 1 : 0.3
                                                }}>
                                                    {active ? 'WIRED' : 'EMPTY'}
                                                </span>
                                            </div>
                                        );
                                    })}

                                    {/* Compiler checklist */}
                                    <div style={{ borderTop: 'var(--border-width) solid var(--border)', paddingTop: '0.8rem', marginTop: '0.4rem' }}>
                                        <div style={{ fontSize: '0.6rem', fontWeight: 900, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><TerminalIcon size={14} /> Required Methods</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: 150, overflowY: 'auto' }}>
                                            {activeInterfacesMulti.length === 0 ? (
                                                <div style={{ fontSize: '0.65rem', opacity: 0.4, padding: '0.6rem', textAlign: 'center', border: 'var(--border-width) dashed var(--border)', fontStyle: 'italic' }}>
                                                    Wire interfaces to see required methods
                                                </div>
                                            ) : (
                                                activeInterfacesMulti.flatMap(ifaceName => {
                                                    const iface = INTERFACES.find(i => i.name === ifaceName);
                                                    return iface ? iface.methods.map(m => ({ ...m, color: iface.color, from: iface.name })) : [];
                                                }).map(m => (
                                                    <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.5rem', border: `2px solid ${m.color}`, background: `${m.color}10` }}>
                                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 800 }}>{m.name}</span>
                                                        <span style={{ marginLeft: 'auto', fontSize: '0.5rem', fontWeight: 900, color: m.color }}>{m.from}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* 3. CODE SYNTAX PANEL */}
                {view === 'lang' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 640 }}>
                        {/* Selector Tabs for Language */}
                        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '4px solid #000000', pb: '0.5rem' }}>
                            {['Java', 'Python', 'C++'].map(l => (
                                <button
                                    key={l}
                                    onClick={() => setLang(l)}
                                    style={{
                                        padding: '0.5rem 1rem', fontWeight: 900, fontSize: '0.72rem', cursor: 'pointer',
                                        background: lang === l ? 'var(--yellow)' : '#1e1e1e',
                                        border: '4px solid #000000', borderBottom: lang === l ? '4px solid var(--yellow)' : '4px solid #000000',
                                        fontFamily: 'var(--font-main)', color: lang === l ? '#000000' : '#ffffff',
                                        transform: lang === l ? 'translateY(4px)' : 'none',
                                        outline: 'none'
                                    }}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>

                        {/* Editor window representation */}
                        <div style={{ border: '4px solid #ffffff', background: '#282a36', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: '8px 8px 0 #000000' }}>
                            {/* Window header */}
                            <div style={{ background: '#21222c', padding: '0.5rem 1rem', borderBottom: '3px solid #000000', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5555' }} />
                                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f1fa8c' }} />
                                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#50fa7b' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {filesList.map(fileName => (
                                        <button
                                            key={fileName}
                                            onClick={() => setActiveFile(fileName)}
                                            style={{
                                                background: activeFile === fileName ? '#282a36' : 'transparent',
                                                border: 'none', borderBottom: activeFile === fileName ? '3.5px solid #ff79c6' : 'none',
                                                color: activeFile === fileName ? '#f8f8f2' : '#6272a4', padding: '0.3rem 0.6rem',
                                                fontSize: '0.68rem', fontFamily: 'var(--font-mono)', cursor: 'pointer',
                                                outline: 'none'
                                             }}
                                        >
                                            {fileName}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Editor content */}
                            <pre
                                style={{
                                    padding: '1.5rem', margin: 0, overflowX: 'auto',
                                    fontFamily: 'var(--font-mono)', fontSize: '0.72rem', lineHeight: 1.6,
                                    color: '#f8f8f2', background: '#282a36'
                                }}
                                dangerouslySetInnerHTML={{ __html: getFileContent(activeFile, lang, selectedBaseClass, selectedInterfaces, concreteClassName, customBaseAbstracts, interfaceMethods, craftedImplementations) }}
                            />
                        </div>
                    </div>
                )}

                {/* 4. DECISION FLOWCHART GRAPH (WIZARD FLOW LAYOUT) */}
                {view === 'flowchart' && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '1rem 0' }}>
                        {/* Current Question / Outcome Card */}
                        <div style={{ width: '100%', maxWidth: 500 }}>
                            <AnimatePresence mode="wait">
                                {activeNode.isLeaf ? (
                                    <motion.div
                                        key={activeNode.id}
                                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -15 }}
                                        transition={{ duration: 0.25 }}
                                        style={{
                                            border: `5px solid ${activeNode.type === 'abstract' ? 'var(--yellow)' : '#2563eb'}`,
                                            background: 'var(--white)',
                                            boxShadow: '10px 10px 0 #000000',
                                            borderRadius: 'var(--radius)',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div style={{
                                            background: activeNode.type === 'abstract' ? 'var(--yellow)' : '#2563eb',
                                            padding: '0.8rem 1.2rem',
                                            borderBottom: '4px solid #000000',
                                            fontWeight: 900,
                                            fontSize: '0.85rem',
                                            textAlign: 'center',
                                            color: activeNode.type === 'abstract' ? '#000000' : '#ffffff',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' }}><CrownIcon size={14} /> Recommendation</span>
                                        </div>
                                        <div style={{ padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text)' }}>
                                                {activeNode.label}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text)', lineHeight: 1.5, background: 'var(--bg)', padding: '0.8rem 1.2rem', border: '2px solid var(--border)', borderRadius: '4px' }}>
                                                {activeNode.reason}
                                            </div>
                                            <button
                                                onClick={resetFlowchart}
                                                style={{
                                                    marginTop: '0.5rem',
                                                    padding: '0.6rem 1.5rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 900,
                                                    background: '#ffffff',
                                                    color: '#000000',
                                                    border: '4px solid #000000',
                                                    boxShadow: '4px 4px 0 #000000',
                                                    cursor: 'pointer',
                                                    textTransform: 'uppercase',
                                                    outline: 'none',
                                                    transition: 'all 0.1s'
                                                }}
                                            >
                                                ↺ Restart Guide
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key={activeNode.id}
                                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -15 }}
                                        transition={{ duration: 0.25 }}
                                        style={{
                                            border: '5px solid var(--purple)',
                                            background: 'var(--white)',
                                            boxShadow: '10px 10px 0 #000000',
                                            borderRadius: 'var(--radius)',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div style={{
                                            background: 'var(--purple)',
                                            padding: '0.8rem 1.2rem',
                                            borderBottom: '4px solid #000000',
                                            fontWeight: 900,
                                            fontSize: '0.85rem',
                                            color: '#000000',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>
                                            QUESTION {flowHistory.length}
                                        </div>
                                        <div style={{ padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 900, lineHeight: 1.5, color: 'var(--text)' }}>
                                                {activeNode.q}
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => handleFlowChoice(activeNode.id, true)}
                                                    style={{
                                                        padding: '0.6rem 1.8rem',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 900,
                                                        background: '#48bb78',
                                                        color: '#000000',
                                                        border: '4px solid #000000',
                                                        boxShadow: '4px 4px 0 #000000',
                                                        cursor: 'pointer',
                                                        textTransform: 'uppercase',
                                                        outline: 'none',
                                                        transition: 'all 0.1s'
                                                    }}
                                                >
                                                    YES
                                                </button>
                                                <button
                                                    onClick={() => handleFlowChoice(activeNode.id, false)}
                                                    style={{
                                                        padding: '0.6rem 1.8rem',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 900,
                                                        background: '#db2777',
                                                        color: '#ffffff',
                                                        border: '4px solid #000000',
                                                        boxShadow: '4px 4px 0 #000000',
                                                        cursor: 'pointer',
                                                        textTransform: 'uppercase',
                                                        outline: 'none',
                                                        transition: 'all 0.1s'
                                                    }}
                                                >
                                                    NO
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Structured History Trail */}
                        {flowHistory.length > 1 && (
                            <div style={{ width: '100%', maxWidth: 640, marginTop: '1rem', border: '3px solid var(--border)', background: 'var(--white)', padding: '1rem', boxShadow: '6px 6px 0 #000000' }}>
                                <div style={{ fontSize: '0.62rem', fontWeight: 900, opacity: 0.6, textTransform: 'uppercase', marginBottom: '0.6rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.3rem' }}>
                                    Your Answers:
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
                                    {getPathHistory().map((step, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{
                                                background: 'var(--bg)',
                                                border: '2px solid var(--border)',
                                                padding: '0.4rem 0.6rem',
                                                display: 'flex',
                                                gap: '0.5rem',
                                                alignItems: 'center'
                                            }}>
                                                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text)' }}>{step.name}</span>
                                                <span style={{
                                                    fontSize: '0.62rem',
                                                    fontWeight: 900,
                                                    padding: '1px 5px',
                                                    background: step.choice === 'YES' ? '#48bb78' : '#db2777',
                                                    color: step.choice === 'YES' ? '#000000' : '#ffffff',
                                                    border: '1.5px solid #000000'
                                                }}>
                                                    {step.choice}
                                                </span>
                                            </div>
                                            {idx < flowHistory.length - 2 && (
                                                <span style={{ fontSize: '0.8rem', fontWeight: 900 }}>➡</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );

    /* ── LEFT STATE COLUMN ── */
    const LEFT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflowY: 'auto' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.5, textTransform: 'uppercase', color: 'var(--text)' }}>Stats Tracker</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem' }}>
                <div style={{ border: '3px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.6rem 0.8rem', background: 'var(--white)', boxShadow: '4px 4px 0 #000000' }}>
                    <div style={{ fontSize: '0.58rem', fontWeight: 900, color: 'var(--text)', opacity: 0.5 }}>Methods done</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.6rem', color: '#48bb78' }}>
                            {Object.keys(craftedImplementations).length}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text)', opacity: 0.5 }}>/ {requiredMethods.length}</span>
                    </div>
                </div>

                <div style={{ border: '3px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.6rem 0.8rem', background: 'var(--white)', boxShadow: '4px 4px 0 #000000' }}>
                    <div style={{ fontSize: '0.58rem', fontWeight: 900, color: 'var(--text)', opacity: 0.5 }}>Interfaces</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.6rem', color: '#2563eb', marginTop: '0.2rem' }}>
                        {selectedInterfaces.length}
                    </div>
                </div>
            </div>

            {/* UML arrow notation helper diagram (Pure Vector Graphics) */}
            <div style={{ borderTop: '3px solid var(--border)', paddingTop: '1rem', marginTop: '0.2rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.5, textTransform: 'uppercase', color: 'var(--text)', marginBottom: '0.6rem' }}>Arrow Meanings</div>
                
                <div style={{ border: '3px solid var(--border)', background: 'var(--white)', color: 'var(--text)', borderRadius: 'var(--radius)', padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    
                    {/* Extends */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <svg width="45" height="20" style={{ overflow: 'visible' }}>
                            <path d="M 5 10 L 35 10" stroke="var(--yellow)" strokeWidth="2.5" />
                            <polygon points="35,5 45,10 35,15" fill="none" stroke="var(--yellow)" strokeWidth="2.5" />
                        </svg>
                        <div style={{ fontSize: '0.58rem', lineHeight: 1.2 }}>
                            <span style={{ fontWeight: 900, color: '#d69e2e' }}>extends</span><br />
                            <span style={{ opacity: 0.5 }}>(inherits from parent)</span>
                        </div>
                    </div>

                    {/* Implements */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <svg width="45" height="20" style={{ overflow: 'visible' }}>
                            <path d="M 5 10 L 35 10" stroke="#2563eb" strokeWidth="2.5" strokeDasharray="3 3" />
                            <polygon points="35,5 45,10 35,15" fill="none" stroke="#2563eb" strokeWidth="2.5" />
                        </svg>
                        <div style={{ fontSize: '0.58rem', lineHeight: 1.2 }}>
                            <span style={{ fontWeight: 900, color: '#2563eb' }}>implements</span><br />
                            <span style={{ opacity: 0.5 }}>(follows interface rules)</span>
                        </div>
                    </div>

                </div>
            </div>
        
            
        </div>
    );

    /* ── RIGHT EXPLANATORY / CONSOLE COLUMN ── */
    const RIGHT = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflowY: 'auto' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 900, opacity: 0.5, textTransform: 'uppercase', color: 'var(--text)' }}>Activity Log</div>
            
            {/* Realtime Console Terminal mockup */}
            <div style={{
                flex: 1, border: '3px solid var(--border)', background: '#282a36', color: '#f8f8f2',
                borderRadius: 'var(--radius)', padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                minHeight: 185, boxShadow: '4px 4px 0 #000000'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #44475a', paddingBottom: '0.3rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', fontWeight: 900, color: '#ff79c6' }}>Activity Log</span>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#48bb78' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', overflowY: 'auto', flex: 1 }}>
                    {consoleLogs.map((log, idx) => (
                        <div key={idx} style={{ wordBreak: 'break-all', color: log.includes('ERROR') ? '#fc8181' : log.includes('SAVED') || log.includes('ADDED') ? '#50fa7b' : '#f8f8f2' }}>
                            {log}
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Context-sensitive Visual Guide Card */}
            <div style={{
                border: '3px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--white)',
                boxShadow: '4px 4px 0 #000000', padding: '0.8rem', color: 'var(--text)'
            }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text)', opacity: 0.5, marginBottom: '0.4rem' }}>Quick tip</div>
                
                {view === 'blueprint' && (
                    <div style={{ fontSize: '0.65rem', lineHeight: 1.5 }}>
                        <LightbulbIcon size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> A parent class is like a half-built house — some rooms are done, some are empty. An interface is just a checklist saying "you must build these rooms".
                    </div>
                )}
                {view === 'multi' && (
                    <div style={{ fontSize: '0.65rem', lineHeight: 1.5 }}>
                        <LightbulbIcon size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> You can only pick one parent class, but you can add as many interfaces as you want!
                    </div>
                )}
                {view === 'lang' && (
                    <div style={{ fontSize: '0.65rem', lineHeight: 1.5 }}>
                        <LightbulbIcon size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Look at the keywords: "extends" means inheriting a parent class. "implements" means following an interface's rules.
                    </div>
                )}
                {view === 'flowchart' && (
                    <div style={{ fontSize: '0.65rem', lineHeight: 1.5 }}>
                        <LightbulbIcon size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Answer YES or NO to each question. The guide will tell you which one to use.
                    </div>
                )}
            </div>
        </div>
    );

    
    useSnapshot(useCallback((config, step) => {
        if (config.selectedBaseClass !== undefined) setSelectedBaseClass(config.selectedBaseClass);
        if (config.selectedInterfaces !== undefined) setSelectedInterfaces(config.selectedInterfaces);
        if (config.concreteClassName !== undefined) setConcreteClassName(config.concreteClassName);
        if (config.lang !== undefined) setLang(config.lang);
        if (config.view !== undefined) setView(config.view);
        if (config.flowHistory !== undefined) setFlowHistory(config.flowHistory);

        setTimeout(() => {

        }, 50);
    }, []));

    return (
        <ImmersiveLayout
            isActive={true}
            snapshotData={{
                config: { selectedBaseClass, selectedInterfaces, concreteClassName, lang, view, flowHistory },
                step: 0
            }}
            title="Abstract Class vs Interface"
            icon={<BlueprintIcon size={22} />}
            moduleLabel="OOP MODULE"
            hideControls={true}
            isRunning={false}
            isPaused={false}
            isFinished={false}
            speed={speed}
            onSpeedChange={setSpeed}
            onStart={() => {}}
            onPause={() => {}}
            onResume={() => {}}
            onStep={() => {}}
            onReset={() => {
                setSelectedBaseClass('Shape');
                setSelectedInterfaces(['Flyable']);
                setConcreteClassName('Quadcopter');
                setCustomBaseAbstracts([]);
                setCustomInterfaceMethods([]);
                setCraftedImplementations({});
                setActiveCraftingMethod(null);
                setFlowHistory([0]);
                setView('blueprint');
                addLog('[RESET] Setup restarted.');
            }}
            currentStepNum={Object.keys(craftedImplementations).length}
            totalSteps={requiredMethods.length}
            phaseName={blueprintCompleted ? 'Finished ✓' : 'Building Class...'}
            centerContent={CENTER}
            leftContent={LEFT}
            rightContent={RIGHT}
            timelineItems={[]}
            legend={[]}
            hideFooter={true}
        >
            <div className="main-content">
                <Link to="/oops" style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← OOP Module</Link>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BlueprintIcon size={32} /> Abstract Class vs Interface</h1>
            </div>
        </ImmersiveLayout>
    );
}
