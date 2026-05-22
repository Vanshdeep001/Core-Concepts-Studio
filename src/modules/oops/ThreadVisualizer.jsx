import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// --- DESIGN SYSTEM ---
const UI = {
  BG: '#f8f9fa',
  SURFACE: '#ffffff',
  BORDER: '#e0e0e0',
  TEXT: '#2d3436',
  MUTED: '#636e72',
  BRAND: '#3b82f6', // Bright Blue
  STATES: {
    NEW: { bg: '#f1f2f6', color: '#747d8c', label: 'NEW', icon: '🥚' },
    RUNNABLE: { bg: '#e0f2fe', color: '#0284c7', label: 'RUNNABLE', icon: '⏳' },
    RUNNING: { bg: '#dcfce7', color: '#16a34a', label: 'RUNNING', icon: '⚡' },
    DEAD: { bg: '#fee2e2', color: '#dc2626', label: 'DEAD', icon: '🛑' }
  }
};

const STEPS = [
  { 
    id: 1, 
    action: 'Main thread begins execution.', 
    codeFocus: 6,
    mainState: 'RUNNING',
    childVisible: false,
    childState: null
  },
  { 
    id: 2, 
    action: 'Thread object instantiated on Heap.', 
    codeFocus: 7,
    mainState: 'RUNNING',
    childVisible: true,
    childState: 'NEW'
  },
  { 
    id: 3, 
    action: 'start() tells OS to spawn context.', 
    codeFocus: 8,
    mainState: 'RUNNING',
    childVisible: true,
    childState: 'RUNNABLE'
  },
  { 
    id: 4, 
    action: 'CPU Scheduler multiplexes execution.', 
    codeFocus: 2, // run method
    mainState: 'RUNNABLE', // Toggled by interval
    childVisible: true,
    childState: 'RUNNABLE' // Toggled by interval
  },
  { 
    id: 5, 
    action: 'Execution completes.', 
    codeFocus: 9,
    mainState: 'DEAD',
    childVisible: true,
    childState: 'DEAD'
  }
];

// --- COMPONENTS ---

const StateInfoModal = ({ stateInfo, onClose }) => {
    const details = {
        'NEW': "A Java Thread object has been created on the Heap (`new Thread()`), but it hasn't been started yet. The OS doesn't know about it.",
        'RUNNABLE': "The thread is ready to run and waiting in the OS Ready Queue. It is just waiting for the CPU Scheduler to pick it.",
        'RUNNING': "The thread currently possesses the CPU. Its instructions are actively being executed.",
        'DEAD': "The `run()` method has completed. The thread's lifecycle is over and it cannot be restarted."
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            style={{ 
                position: 'absolute', top: 50, right: -10, width: 260, 
                background: UI.SURFACE, borderRadius: 12, padding: '1rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: `1px solid ${UI.BORDER}`,
                zIndex: 100 
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.8rem', color: stateInfo.color }}>
                    {stateInfo.icon} {stateInfo.label} STATE
                </span>
                <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', opacity: 0.5, fontWeight: 900 }}>✕</button>
            </div>
            <div style={{ fontSize: '0.75rem', lineHeight: 1.5, color: UI.MUTED }}>
                {details[stateInfo.label]}
            </div>
        </motion.div>
    );
};

const ThreadCard = ({ name, type, stateKey, isCPUFocused, infoOpen, setInfoOpen }) => {
    const stateInfo = UI.STATES[stateKey];
    
    // CPU overrides RUNNABLE to RUNNING in step 4
    const displayState = isCPUFocused ? UI.STATES['RUNNING'] : stateInfo;

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, scale: isCPUFocused ? 1.02 : 1 }}
            style={{ 
                width: 320, background: UI.SURFACE, borderRadius: 16, 
                border: `2px solid ${isCPUFocused ? UI.BRAND : UI.BORDER}`,
                boxShadow: isCPUFocused ? `0 8px 25px ${UI.BRAND}33` : '0 4px 6px rgba(0,0,0,0.05)',
                padding: '1.2rem', position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem'
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontWeight: 900, fontSize: '1.1rem', color: UI.TEXT }}>{name}</div>
                    <div style={{ fontSize: '0.7rem', color: UI.MUTED, fontWeight: 700, textTransform: 'uppercase' }}>{type}</div>
                </div>
                
                {/* CPU Indicator */}
                <div style={{ 
                    width: 36, height: 36, borderRadius: '50%', background: isCPUFocused ? UI.BRAND : '#f1f2f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isCPUFocused ? 'white' : '#a4b0be', transition: '0.3s'
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                        <rect x="9" y="9" width="6" height="6"></rect>
                        <line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line>
                        <line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line>
                        <line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line>
                        <line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line>
                    </svg>
                </div>
            </div>

            {/* State Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
                <div style={{ 
                    padding: '0.4rem 0.8rem', borderRadius: 8, background: displayState.bg, 
                    color: displayState.color, fontWeight: 800, fontSize: '0.75rem', 
                    display: 'flex', alignItems: 'center', gap: '0.4rem'
                }}>
                    <span>{displayState.icon}</span>
                    <span>State: {displayState.label}</span>
                </div>
                
                {/* Info Button */}
                <button 
                    onClick={() => setInfoOpen(infoOpen === name ? null : name)}
                    style={{ 
                        width: 24, height: 24, borderRadius: '50%', border: `1px solid ${UI.BORDER}`,
                        background: 'transparent', color: UI.MUTED, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.7rem'
                    }}
                >
                    i
                </button>

                <AnimatePresence>
                    {infoOpen === name && <StateInfoModal stateInfo={displayState} onClose={() => setInfoOpen(null)} />}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

// --- MAIN PAGE ---

export default function ThreadVisualizer() {
  const [currentStep, setCurrentStep] = useState(1);
  const [cpuOnMain, setCpuOnMain] = useState(true);
  const [infoOpen, setInfoOpen] = useState(null); // 'Main' | 'Child' | null

  // Scheduler multiplexing simulation
  useEffect(() => {
    if (currentStep === 4) {
      const interval = setInterval(() => setCpuOnMain(p => !p), 800);
      return () => clearInterval(interval);
    } else {
      setCpuOnMain(true);
    }
  }, [currentStep]);

  const stepData = STEPS.find(s => s.id === currentStep);

  const handleNext = () => currentStep < 5 && setCurrentStep(currentStep + 1);
  const handlePrev = () => currentStep > 1 && setCurrentStep(currentStep - 1);

  return (
    <div style={{ 
        height: '100vh', background: UI.BG, display: 'flex', flexDirection: 'column',
        fontFamily: 'var(--font-sans)', color: UI.TEXT, overflow: 'hidden'
    }}>
      {/* Header */}
      <header style={{ 
          height: 60, borderBottom: `1px solid ${UI.BORDER}`, display: 'flex', background: UI.SURFACE,
          alignItems: 'center', padding: '0 1.5rem', gap: '1rem', flexShrink: 0
      }}>
        <Link to="/oops" style={{ fontWeight: 800, color: UI.MUTED, textDecoration: 'none' }}>← Back</Link>
        <span style={{ fontWeight: 900, fontSize: '1rem', borderLeft: `2px solid ${UI.BORDER}`, paddingLeft: '1rem' }}>Lifecycle Simulator</span>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
        {/* Top: The JVM Thread Pool (Visual Stage) */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: UI.BG }}>
            
            {/* Background Branding */}
            <div style={{ position: 'absolute', top: '1.5rem', left: '2rem', fontSize: '0.8rem', fontWeight: 900, color: UI.MUTED, letterSpacing: '1px' }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, background: '#2ed573', borderRadius: '50%', marginRight: 8 }} />
                JVM VIRTUAL MACHINE
            </div>

             <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>
                {/* Main Thread Card */}
                <ThreadCard 
                    name="main" type="Primary Thread" 
                    stateKey={stepData.mainState}
                    isCPUFocused={currentStep < 4 ? true : (currentStep === 4 ? cpuOnMain : false)}
                    infoOpen={infoOpen} setInfoOpen={setInfoOpen}
                />

                {/* Child Thread Card */}
                <AnimatePresence>
                    {stepData.childVisible && (
                        <ThreadCard 
                            name="Thread-0" type="Child Thread" 
                            stateKey={stepData.childState}
                            isCPUFocused={currentStep === 4 ? !cpuOnMain : false}
                            infoOpen={infoOpen} setInfoOpen={setInfoOpen}
                        />
                    )}
                </AnimatePresence>
             </div>
        </div>

        {/* Bottom: Code & Controls */}
        <div style={{ height: 260, borderTop: `1px solid ${UI.BORDER}`, background: UI.SURFACE, display: 'flex', flexShrink: 0 }}>
            
            {/* Left: Code Viewer */}
            <div style={{ flex: 1, borderRight: `1px solid ${UI.BORDER}`, padding: '1.5rem', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: UI.MUTED, marginBottom: '0.8rem' }}>SOURCE CODE</div>
                <div style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: 1.6, overflowY: 'auto' }}>
                    
                    {/* Hardcoded Code Lines for Highlighting */}
                    <div style={{ opacity: stepData.codeFocus === 1 ? 1 : 0.5, background: stepData.codeFocus === 1 ? '#e0f2fe' : 'transparent', padding: '0 4px', borderRadius: 4 }}>
                        <span style={{ color: '#d73a49' }}>class</span> <span style={{ color: '#6f42c1' }}>MyThread</span> <span style={{ color: '#d73a49' }}>extends</span> <span style={{ color: '#24292e' }}>Thread</span> {'{'}
                    </div>
                    <div style={{ opacity: stepData.codeFocus === 2 ? 1 : 0.5, background: stepData.codeFocus === 2 ? '#e0f2fe' : 'transparent', padding: '0 4px', borderRadius: 4, marginLeft: '1rem' }}>
                        <span style={{ color: '#d73a49' }}>public void</span> <span style={{ color: '#6f42c1' }}>run</span>() {'{'}
                    </div>
                    <div style={{ opacity: stepData.codeFocus === 3 ? 1 : 0.5, background: stepData.codeFocus === 3 ? '#e0f2fe' : 'transparent', padding: '0 4px', borderRadius: 4, marginLeft: '2rem' }}>
                        <span style={{ color: '#24292e' }}>System.out.println(</span><span style={{ color: '#032f62' }}>"Child Thread Active"</span><span style={{ color: '#24292e' }}>);</span>
                    </div>
                    <div style={{ opacity: 0.5, marginLeft: '1rem' }}>{'}'}</div>
                    <div style={{ opacity: 0.5 }}>{'}'}</div>
                    <br/>
                    <div style={{ opacity: stepData.codeFocus === 6 ? 1 : 0.5, background: stepData.codeFocus === 6 ? '#e0f2fe' : 'transparent', padding: '0 4px', borderRadius: 4 }}>
                        <span style={{ color: '#d73a49' }}>public static void</span> <span style={{ color: '#6f42c1' }}>main</span>(String[] args) {'{'}
                    </div>
                    <div style={{ opacity: stepData.codeFocus === 7 ? 1 : 0.5, background: stepData.codeFocus === 7 ? '#e0f2fe' : 'transparent', padding: '0 4px', borderRadius: 4, marginLeft: '1rem' }}>
                        <span style={{ color: '#6f42c1' }}>MyThread</span> t = <span style={{ color: '#d73a49' }}>new</span> <span style={{ color: '#6f42c1' }}>MyThread</span>();
                    </div>
                    <div style={{ opacity: stepData.codeFocus === 8 ? 1 : 0.5, background: stepData.codeFocus === 8 ? '#e0f2fe' : 'transparent', padding: '0 4px', borderRadius: 4, marginLeft: '1rem' }}>
                        t.start();
                    </div>
                    <div style={{ opacity: stepData.codeFocus === 9 ? 1 : 0.5, background: stepData.codeFocus === 9 ? '#e0f2fe' : 'transparent', padding: '0 4px', borderRadius: 4, marginLeft: '1rem' }}>
                        <span style={{ color: '#24292e' }}>System.out.println(</span><span style={{ color: '#032f62' }}>"Main Thread Working"</span><span style={{ color: '#24292e' }}>);</span>
                    </div>
                    <div style={{ opacity: 0.5 }}>{'}'}</div>
                </div>
            </div>

            {/* Right: Controller */}
            <div style={{ width: 340, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: UI.MUTED, marginBottom: '0.8rem' }}>STEP {currentStep} OF 5</div>
                
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, lineHeight: 1.4, color: UI.BRAND }}>
                        {stepData.action}
                    </div>
                    {currentStep === 4 && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: UI.MUTED, fontWeight: 600 }}>
                            * Watch the CPU badge alternate between cards. Concurrency is illusionary on a single core!
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button 
                        onClick={handlePrev} disabled={currentStep === 1}
                        style={{ flex: 1, padding: '0.75rem', borderRadius: 8, border: `1px solid ${UI.BORDER}`, background: UI.SURFACE, cursor: currentStep === 1 ? 'not-allowed' : 'pointer', fontWeight: 800, opacity: currentStep === 1 ? 0.5 : 1 }}
                    >
                        PREV
                    </button>
                    <button 
                        onClick={handleNext} disabled={currentStep === 5}
                        style={{ flex: 2, padding: '0.75rem', borderRadius: 8, border: 'none', background: UI.BRAND, color: 'white', cursor: currentStep === 5 ? 'not-allowed' : 'pointer', fontWeight: 800, opacity: currentStep === 5 ? 0.5 : 1 }}
                    >
                        NEXT STEP
                    </button>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
