import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayIcon, CheckIcon, AlertIcon } from '../../components/Icons';

/* =========================================================================
   1. PIPELINE STEPPER ENGINE
   ========================================================================= */
export function PipelineStepper({ steps, runnerText = 'Step Execution' }) {
  const [activeStep, setActiveStep] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setActiveStep((s) => {
        if (s >= steps.length - 1) {
          setRunning(false);
          return s;
        }
        return s + 1;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [running, steps.length]);

  const handleNext = () => {
    if (activeStep < steps.length - 1) setActiveStep(activeStep + 1);
  };

  const handlePrev = () => {
    if (activeStep > 0) setActiveStep(activeStep - 1);
  };

  const handleRun = () => {
    setActiveStep(0);
    setRunning(true);
  };

  const current = steps[activeStep];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      {/* Visual progress bar */}
      <div style={{ width: '100%', height: 10, background: 'var(--bg)', border: '2px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <motion.div
          style={{ height: '100%', background: 'var(--purple)' }}
          animate={{ width: `${((activeStep) / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* Horizontal Steps indicator */}
      <div className="hide-scrollbar" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', overflowX: 'auto', padding: '0.4rem 0' }}>
        {steps.map((step, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button
              onClick={() => { setRunning(false); setActiveStep(idx); }}
              style={{
                padding: '0.45rem 0.65rem',
                border: '2.5px solid var(--border)',
                background: activeStep === idx ? 'var(--cyan)' : 'var(--white)',
                boxShadow: activeStep === idx ? 'none' : '2px 2px 0px var(--border)',
                transform: activeStep === idx ? 'translate(1.5px, 1.5px)' : 'none',
                cursor: 'pointer',
                textAlign: 'left',
                minWidth: 100,
                transition: 'all 0.1s ease',
                fontFamily: 'var(--font-main)'
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.72rem' }}>{step.title}</div>
              {step.ext && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', opacity: 0.6 }}>{step.ext}</div>}
            </button>
            {idx < steps.length - 1 && (
              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--border)' }}>➔</span>
            )}
          </div>
        ))}
      </div>

      {/* Main step details box */}
      <div style={{ minHeight: 120 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            style={{ border: '3px solid var(--border)', background: 'var(--white)', boxShadow: 'var(--shadow-sm)', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--purple)', fontFamily: 'var(--font-main)' }}>
                Stage {activeStep + 1}: {current.title}
              </h4>
              {current.ext && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', padding: '0.1rem 0.4rem', border: '1.5px solid var(--border)', background: 'var(--bg)' }}>
                  Format: {current.ext}
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.45, opacity: 0.8, fontFamily: 'var(--font-main)' }}>
              {current.desc}
            </p>
            {current.detail && (
              <div style={{ padding: '0.6rem', background: 'var(--bg)', borderLeft: '4px solid var(--border)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                {current.detail}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controller bar */}
      <div style={{ display: 'flex', gap: '0.35rem' }}>
        <button className="btn btn-sm" style={{ flex: 1, background: 'var(--green)' }} onClick={handleRun} disabled={running}>
          {running ? 'Running...' : runnerText}
        </button>
        <button className="btn btn-sm" onClick={handlePrev} disabled={activeStep === 0 || running}>← Back</button>
        <button className="btn btn-sm" onClick={handleNext} disabled={activeStep === steps.length - 1 || running}>Next →</button>
      </div>
    </div>
  );
}

/* =========================================================================
   2. MEMORY MODEL ENGINE
   ========================================================================= */

function PointerOverlay({ pointerMap, stackItems, heapItems, activePointer, parentRef }) {
  const [coords, setCoords] = useState([]);

  useEffect(() => {
    const updateCoords = () => {
      if (!parentRef.current) return;
      const parentRect = parentRef.current.getBoundingClientRect();
      const newCoords = pointerMap.map(p => {
        const fromId = 'stack_' + p.from.replace(/[^a-zA-Z0-9]/g, '_');
        const toId = 'heap_' + p.to.replace(/[^a-zA-Z0-9]/g, '_');
        const fromEl = document.getElementById(fromId);
        const toEl = document.getElementById(toId);
        if (fromEl && toEl) {
          const fromRect = fromEl.getBoundingClientRect();
          const toRect = toEl.getBoundingClientRect();
          const isActive = activePointer && activePointer.from === p.from && activePointer.to === p.to;
          return {
            fromX: fromRect.right - parentRect.left,
            fromY: fromRect.top + fromRect.height / 2 - parentRect.top,
            toX: toRect.left - parentRect.left,
            toY: toRect.top + toRect.height / 2 - parentRect.top,
            isActive,
            color: isActive ? 'var(--purple)' : '#7f8c8d'
          };
        }
        return null;
      }).filter(Boolean);
      setCoords(newCoords);
    };

    updateCoords();
    window.addEventListener('resize', updateCoords);
    const timer1 = setTimeout(updateCoords, 50);
    const timer2 = setTimeout(updateCoords, 300);
    const timer3 = setTimeout(updateCoords, 600);
    return () => {
      window.removeEventListener('resize', updateCoords);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [pointerMap, stackItems, heapItems, activePointer, parentRef]);

  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible', zIndex: 10 }}>
      {coords.map((c, i) => {
        const dx = Math.abs(c.toX - c.fromX) * 0.4;
        const dstr = `M ${c.fromX} ${c.fromY} C ${c.fromX + dx} ${c.fromY}, ${c.toX - dx} ${c.toY}, ${c.toX} ${c.toY}`;
        return (
          <g key={i}>
            {c.isActive && (
              <motion.path
                d={dstr}
                fill="none"
                stroke="var(--purple)"
                strokeWidth="7"
                strokeLinecap="round"
                opacity="0.4"
                animate={{ strokeWidth: [6, 9, 6] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <motion.path
              d={dstr}
              fill="none"
              stroke={c.color}
              strokeWidth={c.isActive ? '3.5' : '2'}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
            <polygon
              points={`${c.toX},${c.toY} ${c.toX - 8},${c.toY - 5} ${c.toX - 8},${c.toY + 5}`}
              fill={c.color}
            />
          </g>
        );
      })}
    </svg>
  );
}

export function MemoryModel({ type, stackItems = [], heapItems = [], pointerMap = [], explanation = '' }) {
  const [variables, setVariables] = useState(stackItems);
  const [heapObjects, setHeapObjects] = useState(heapItems);
  const [activePointer, setActivePointer] = useState(null);
  const [log, setLog] = useState('Click a block to trace references.');
  const parentRef = useRef(null);

  const handleStackClick = (idx, varName) => {
    const conn = pointerMap.find(p => p.from === varName);
    if (conn) {
      setActivePointer(conn);
      setLog(`${varName} → ${conn.to}`);
    } else {
      setActivePointer(null);
      setLog(`${varName} holds a value directly.`);
    }
  };

  const handleHeapClick = (obj) => {
    if (type === 'smart-pointers') {
      if (obj.refCount > 0) {
        const updated = heapObjects.map(h => {
          if (h.addr === obj.addr) {
            const nextCount = h.refCount - 1;
            return { ...h, refCount: nextCount, free: nextCount === 0 };
          }
          return h;
        });
        setHeapObjects(updated);
        const next = updated.find(h => h.addr === obj.addr);
        setLog(next.free ? 'Ref count 0 → destroyed automatically.' : `Ref count → ${next.refCount}`);
      }
    } else if (type === 'leak-segfault') {
      if (obj.leak) {
        setLog(`Leak: "${obj.label}" can't be freed — refs dropped.`);
      } else {
        setLog(`${obj.addr} → needs explicit delete.`);
      }
    } else {
      setLog(`${obj.addr} = ${obj.val}`);
    }
  };

  const handleTriggerSegfault = () => {
    setLog('Segfault — dereferenced nullptr (0x000000).');
  };

  const colHeader = (title, tag, accent) => (
    <div style={{ padding: '0.45rem 0.6rem', borderBottom: '3px solid var(--border)', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.05em' }}>{title}</span>
      <span style={{ fontSize: '0.58rem', fontWeight: 700, opacity: 0.6, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{tag}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', background: 'var(--bg)', borderLeft: '4px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '0.74rem', minHeight: 30 }}>
        <span style={{ opacity: 0.5, fontWeight: 800 }}>▸</span>
        <span>{log}</span>
      </div>

      <div ref={parentRef} style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', minHeight: 220, position: 'relative' }}>
        <PointerOverlay pointerMap={pointerMap} stackItems={variables} heapItems={heapObjects} activePointer={activePointer} parentRef={parentRef} />

        {/* STACK COLUMN */}
        <div style={{ border: '3px solid var(--border)', background: 'var(--white)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', zIndex: 2 }}>
          {colHeader('STACK', 'LIFO', 'var(--cyan)')}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column-reverse', gap: 5, padding: '0.5rem', justifyContent: 'flex-start' }}>
            {variables.map((item, i) => {
              const hasPointer = pointerMap.some(p => p.from === item);
              const isActive = activePointer?.from === item;
              return (
                <div
                  key={i}
                  id={`stack_${item.replace(/[^a-zA-Z0-9]/g, '_')}`}
                  onClick={() => handleStackClick(i, item)}
                  style={{
                    padding: '0.5rem',
                    border: '2px solid var(--border)',
                    background: isActive ? 'var(--purple)' : 'var(--cyan)',
                    color: isActive ? 'var(--white)' : 'var(--text)',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    textAlign: 'center',
                    cursor: 'pointer',
                    boxShadow: '1.5px 1.5px 0px var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{item}</span>
                  {hasPointer && <span style={{ fontSize: '0.85rem' }}>→</span>}
                </div>
              );
            })}
            {type === 'leak-segfault' && (
              <button
                className="btn btn-sm btn-pink"
                style={{ fontSize: '0.65rem', padding: '0.25rem', zIndex: 5 }}
                onClick={handleTriggerSegfault}
              >
                ptr = nullptr ⚡
              </button>
            )}
          </div>
        </div>

        {/* HEAP COLUMN */}
        <div style={{ border: '3px solid var(--border)', background: 'var(--white)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', zIndex: 2 }}>
          {colHeader('HEAP', 'Dynamic', 'var(--yellow)')}
          <div style={{ flex: 1, padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', overflowY: 'auto' }}>
            {heapObjects.map((item, i) => {
              const isTargeted = activePointer?.to === item.addr;
              return (
                <div
                  key={i}
                  id={`heap_${item.addr.replace(/[^a-zA-Z0-9]/g, '_')}`}
                  onClick={() => handleHeapClick(item)}
                  style={{
                    padding: '0.5rem 0.6rem',
                    border: '2px solid var(--border)',
                    background: item.free ? 'var(--bg)' : isTargeted ? 'var(--purple)' : 'var(--yellow)',
                    color: isTargeted ? 'var(--white)' : 'var(--text)',
                    opacity: item.free ? 0.4 : 1,
                    fontSize: '0.74rem',
                    fontFamily: 'var(--font-mono)',
                    boxShadow: item.free ? 'none' : '1.5px 1.5px 0px var(--border)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.6rem',
                    flexWrap: 'wrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontWeight: 800 }}>{item.label}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {item.val !== undefined && <span style={{ opacity: 0.7 }}>{item.val}</span>}
                    {item.refCount !== undefined && (
                      <span style={{ fontWeight: 800, color: isTargeted ? 'var(--white)' : 'var(--pink)' }}>×{item.refCount}</span>
                    )}
                    {item.leak && <span style={{ fontWeight: 800, color: isTargeted ? 'var(--white)' : 'var(--pink)' }}>leak</span>}
                    <span style={{ fontSize: '0.62rem', opacity: 0.55 }}>{item.addr}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {explanation && (
        <div style={{ fontSize: '0.76rem', opacity: 0.65, textAlign: 'center', lineHeight: 1.45 }}>
          {explanation}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   3. VENN & CONCENTRIC ENGINE
   ========================================================================= */
export function VennConcentric({ layout = 'venn', titleA = 'Set A', titleB = 'Set B', overlappingText = 'Intersection', concentricBoxes = [] }) {
  const [activeSelection, setActiveSelection] = useState(layout === 'venn' ? 'overlap' : concentricBoxes[0]?.id || 'outer');

  const renderNested = (boxes, index) => {
    if (index >= boxes.length) return null;
    const box = boxes[index];
    const isActive = activeSelection === box.id;
    return (
      <div
        onClick={(e) => { e.stopPropagation(); setActiveSelection(box.id); }}
        style={{
          border: '3px solid var(--border)',
          background: isActive ? box.color || 'var(--purple)' : 'var(--white)',
          color: isActive ? '#000000' : 'var(--text)',
          padding: '0.75rem',
          cursor: 'pointer',
          borderRadius: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          width: '100%',
          boxShadow: isActive ? 'none' : 'var(--shadow-sm)',
          transform: isActive ? 'translate(1px, 1px)' : 'none',
          transition: 'all 0.15s ease',
          marginTop: index > 0 ? '0.5rem' : 0
        }}
      >
        <span style={{ fontWeight: 800, fontSize: '0.74rem', letterSpacing: '0.04em', color: isActive ? '#000000' : 'var(--text)' }}>
          {box.label}
        </span>
        {renderNested(boxes, index + 1)}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'center', background: 'var(--bg)', border: '3px solid var(--border)', padding: '1.25rem', minHeight: 180, alignItems: 'center' }}>
        {layout === 'venn' ? (
          <div style={{ position: 'relative', width: 280, height: 160, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {/* Left Circle A */}
            <motion.div
              onClick={() => setActiveSelection('A')}
              whileHover={{ scale: 1.03 }}
              style={{
                position: 'absolute',
                left: 20,
                width: 120,
                height: 120,
                borderRadius: '50%',
                border: '3px solid var(--border)',
                background: activeSelection === 'A' ? 'var(--cyan)' : 'rgba(102, 217, 239, 0.15)',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingRight: '1.2rem',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'background 0.25s ease',
                zIndex: activeSelection === 'A' ? 3 : 1
              }}
            >
              {titleA}
            </motion.div>

            {/* Right Circle B */}
            <motion.div
              onClick={() => setActiveSelection('B')}
              whileHover={{ scale: 1.03 }}
              style={{
                position: 'absolute',
                right: 20,
                width: 120,
                height: 120,
                borderRadius: '50%',
                border: '3px solid var(--border)',
                background: activeSelection === 'B' ? 'var(--pink)' : 'rgba(255, 107, 157, 0.15)',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingLeft: '1.2rem',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'background 0.25s ease',
                zIndex: activeSelection === 'B' ? 3 : 1
              }}
            >
              {titleB}
            </motion.div>

            {/* Overlap Area */}
            <motion.div
              onClick={() => setActiveSelection('overlap')}
              whileHover={{ scale: 1.05 }}
              style={{
                position: 'absolute',
                width: 70,
                height: 80,
                background: activeSelection === 'overlap' ? 'var(--purple)' : 'rgba(179, 157, 219, 0.4)',
                border: '2px dashed var(--border)',
                borderRadius: '35%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.68rem',
                color: activeSelection === 'overlap' ? '#000000' : 'var(--text)',
                zIndex: 4,
                textAlign: 'center',
                transition: 'background 0.25s ease'
              }}
            >
              {overlappingText}
            </motion.div>
          </div>
        ) : (
          /* Nested concentric boxes */
          <div style={{ width: '100%', maxWidth: 340 }}>
            {renderNested(concentricBoxes, 0)}
          </div>
        )}
      </div>

      {/* Description output */}
      <div style={{ border: '3px solid var(--border)', background: 'var(--white)', padding: '0.75rem', minHeight: 65, boxShadow: 'var(--shadow-sm)' }}>
        {layout === 'venn' ? (
          <div>
            {activeSelection === 'A' && <div><strong style={{ color: 'var(--cyan)' }}>{titleA}:</strong> Represents logic or memory unique to the left operand.</div>}
            {activeSelection === 'B' && <div><strong style={{ color: 'var(--pink)' }}>{titleB}:</strong> Represents logic or memory unique to the right operand.</div>}
            {activeSelection === 'overlap' && <div><strong style={{ color: 'var(--purple)' }}>{overlappingText}:</strong> Shared intersection properties resolving to true for both variables.</div>}
          </div>
        ) : (
          <div>
            {concentricBoxes.find(b => b.id === activeSelection) ? (
              <div>
                <strong>{concentricBoxes.find(b => b.id === activeSelection).label}:</strong> {concentricBoxes.find(b => b.id === activeSelection).desc}
              </div>
            ) : (
              <div style={{ opacity: 0.5, fontStyle: 'italic', textAlign: 'center', fontSize: '0.8rem' }}>Click boxes to inspect features.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   4. GIT GRAPH ENGINE
   ========================================================================= */
export function GeneralGitGraph({ commits = [], branches = [], actionText = 'Run Operation', onAction }) {
  const [gitStatus, setGitStatus] = useState('Workspace loaded. Click commit node to inspect details.');
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [actionDone, setActionDone] = useState(false);
  const [localCommits, setLocalCommits] = useState(commits);
  const [localBranches, setLocalBranches] = useState(branches);

  useEffect(() => {
    setLocalCommits(commits);
    setLocalBranches(branches);
    setSelectedCommit(null);
    setActionDone(false);
    setGitStatus('Workspace loaded. Click commit node to inspect details.');
  }, [commits, branches]);

  const handleCommitClick = (c) => {
    setSelectedCommit(c);
    setGitStatus(`Commit ${c.id}: "${c.msg}" | Author: ${c.author || 'Developer'}`);
  };

  const handleAction = () => {
    setActionDone(true);
    if (onAction) {
      const result = onAction();
      setGitStatus(result);
      
      if (actionText === 'git rebase main') {
        setLocalCommits([
          { id: 'C1', msg: 'Root' },
          { id: 'C2', msg: 'Base' },
          { id: 'C4', msg: 'Main head' },
          { id: "C3'", msg: 'Feature commit (rebased)' }
        ]);
        setLocalBranches([
          { name: 'main', commitId: 'C4' },
          { name: 'feature', commitId: "C3'" }
        ]);
      } else if (actionText === 'git pull (Fetch + Merge)') {
        setLocalBranches([
          { name: 'origin/main', commitId: 'C3' },
          { name: 'main', commitId: 'C3' }
        ]);
      } else if (actionText === 'git branch feature') {
        setLocalBranches([
          { name: 'main', commitId: 'C2' },
          { name: 'feature', commitId: 'C2' }
        ]);
      } else if (actionText === 'Merge Pull Request') {
        setLocalCommits([
          ...commits,
          { id: 'C3', msg: 'Merge pull request #1 from feature' }
        ]);
        setLocalBranches([
          { name: 'main', commitId: 'C3' }
        ]);
      } else if (actionText === 'git push origin main') {
        setLocalBranches([
          { name: 'main', commitId: 'C2' },
          { name: 'origin/main', commitId: 'C2' }
        ]);
      } else if (actionText === 'git reset --hard HEAD~1' || actionText === 'git reset --soft HEAD~1') {
        setLocalBranches([
          { name: 'main', commitId: 'C1' }
        ]);
      } else if (actionText === 'git checkout <hash>') {
        setLocalBranches([
          { name: 'main', commitId: 'C2' },
          { name: 'HEAD (detached)', commitId: 'C1' }
        ]);
      }
    }
  };

  const handleReset = () => {
    setActionDone(false);
    setSelectedCommit(null);
    setLocalCommits(commits);
    setLocalBranches(branches);
    setGitStatus('Workspace reset.');
  };

  // Dynamic layout coordinate mapping
  const getCoords = (commitId) => {
    if (actionText === 'git rebase main') {
      if (commitId === 'C1') return { x: 50, y: 45 };
      if (commitId === 'C2') return { x: 120, y: 45 };
      if (commitId === 'C4') return { x: 190, y: 45 };
      if (commitId === 'C3') return { x: 120, y: 95 }; // Branch off C2
      if (commitId === "C3'") return { x: 260, y: 45 };
    }
    if (actionText === 'Trigger conflict merge') {
      if (commitId === 'C1') return { x: 60, y: 70 };
      if (commitId === 'C2') return { x: 180, y: 35 };
      if (commitId === 'C3') return { x: 180, y: 105 };
    }
    if (actionText === 'Merge Pull Request') {
      if (commitId === 'C1') return { x: 60, y: 45 };
      if (commitId === 'C2') return { x: 160, y: 95 };
      if (commitId === 'C3') return { x: 260, y: 45 };
    }
    if (actionText === 'git pull (Fetch + Merge)') {
      if (commitId === 'C1') return { x: 50, y: 45 };
      if (commitId === 'C2') return { x: 140, y: 45 };
      // C3 (remote commit) is on side branch lane, but pulled onto main lane when done
      if (commitId === 'C3') return { x: 230, y: actionDone ? 45 : 95 };
    }
    if (actionText === 'git push origin main') {
      if (commitId === 'C1') return { x: 60, y: 70 };
      // C2 local commit, when pushed, moves rightward towards the remote zone!
      if (commitId === 'C2') return { x: actionDone ? 300 : 130, y: 70 };
    }
    if (actionText === 'git clone <url>') {
      // C1 starts in Remote Server (top), clones down to Local Machine (bottom)
      if (commitId === 'C1') return { x: 200, y: actionDone ? 100 : 40 };
    }
    
    // Default linear layout
    const idx = localCommits.findIndex(c => c.id === commitId);
    if (localCommits.length === 1) {
      return { x: 200, y: 70 };
    }
    const gap = 80;
    const startX = (400 - (localCommits.length - 1) * gap) / 2;
    return { x: startX + idx * gap, y: 70 };
  };

  // Dynamic edge connection mapper
  const getConnections = () => {
    const edges = [];
    const ids = localCommits.map(c => c.id);
    
    if (actionText === 'git rebase main') {
      if (actionDone) {
        if (ids.includes('C1') && ids.includes('C2')) edges.push({ from: 'C1', to: 'C2' });
        if (ids.includes('C2') && ids.includes('C4')) edges.push({ from: 'C2', to: 'C4' });
        if (ids.includes('C4') && ids.includes("C3'")) edges.push({ from: 'C4', to: "C3'" });
      } else {
        if (ids.includes('C1') && ids.includes('C2')) edges.push({ from: 'C1', to: 'C2' });
        if (ids.includes('C2') && ids.includes('C4')) edges.push({ from: 'C2', to: 'C4' });
        if (ids.includes('C2') && ids.includes('C3')) edges.push({ from: 'C2', to: 'C3' });
      }
    } else if (actionText === 'Trigger conflict merge') {
      if (ids.includes('C1') && ids.includes('C2')) edges.push({ from: 'C1', to: 'C2' });
      if (ids.includes('C1') && ids.includes('C3')) edges.push({ from: 'C1', to: 'C3' });
    } else if (actionText === 'Merge Pull Request') {
      if (actionDone) {
        if (ids.includes('C1') && ids.includes('C2')) edges.push({ from: 'C1', to: 'C2' });
        if (ids.includes('C1') && ids.includes('C3')) edges.push({ from: 'C1', to: 'C3' });
        if (ids.includes('C2') && ids.includes('C3')) edges.push({ from: 'C2', to: 'C3' });
      } else {
        if (ids.includes('C1') && ids.includes('C2')) edges.push({ from: 'C1', to: 'C2' });
      }
    } else if (actionText === 'git pull (Fetch + Merge)') {
      if (ids.includes('C1') && ids.includes('C2')) edges.push({ from: 'C1', to: 'C2' });
      if (ids.includes('C2') && ids.includes('C3')) edges.push({ from: 'C2', to: 'C3' });
    } else {
      for (let i = 0; i < ids.length - 1; i++) {
        edges.push({ from: ids[i], to: ids[i+1] });
      }
    }
    return edges;
  };

  const connections = getConnections();

  const isConflicted = actionText === 'Trigger conflict merge' && actionDone;
  const isResetHard = actionText === 'git reset --hard HEAD~1' && actionDone;
  const isResetSoft = actionText === 'git reset --soft HEAD~1' && actionDone;

  const isCustomViz = [
    'git init',
    'Check .git contents',
    'git add .',
    'Check .gitignore match',
    'Check HEAD file',
    'git bisect start'
  ].includes(actionText);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      <div style={{ padding: '0.45rem', background: 'var(--bg)', border: '2px solid var(--border)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', borderLeft: isConflicted ? '5px solid var(--pink)' : '5px solid var(--purple)' }}>
        <strong>Git Log:</strong> {gitStatus}
      </div>

      {/* Commit Graph Container */}
      <div style={{ background: 'var(--white)', border: '3px solid var(--border)', borderRadius: 6, padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 175, alignItems: 'center', boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle grid pattern background */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '12px 12px' }} />

        <svg width="100%" height="140" viewBox="0 0 400 140" style={{ maxWidth: '400px', overflow: 'visible', zIndex: 1 }}>
          
          {/* Push Partition */}
          {actionText === 'git push origin main' && (
            <>
              <line x1="240" y1="10" x2="240" y2="130" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
              <text x="10" y="22" fill="var(--text)" fontSize="8" fontWeight="800" opacity="0.45" fontFamily="var(--font-mono)">[LOCAL WORKSPACE]</text>
              <text x="250" y="22" fill="var(--text)" fontSize="8" fontWeight="800" opacity="0.45" fontFamily="var(--font-mono)">[REMOTE SERVER]</text>
            </>
          )}

          {/* Clone Partition */}
          {actionText === 'git clone <url>' && (
            <>
              <line x1="10" y1="70" x2="390" y2="70" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
              <text x="10" y="22" fill="var(--text)" fontSize="8" fontWeight="800" opacity="0.45" fontFamily="var(--font-mono)">[REMOTE REPO]</text>
              <text x="10" y="130" fill="var(--text)" fontSize="8" fontWeight="800" opacity="0.45" fontFamily="var(--font-mono)">[LOCAL MACHINE]</text>
            </>
          )}

          {/* Stash Representation */}
          {actionText === 'git stash push' && (
            <>
              <rect x="260" y="75" width="120" height="50" rx="4" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x="320" y="92" textAnchor="middle" fill="var(--text)" fontSize="8" fontWeight="800" opacity="0.45" fontFamily="var(--font-mono)">STASH STACK</text>
              {actionDone && (
                <motion.g
                  initial={{ scale: 0, x: 200, y: 70 }}
                  animate={{ scale: 1, x: 320, y: 110 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                >
                  <rect x="-35" y="-8" width="70" height="13" rx="2" fill="var(--cyan)" stroke="var(--border)" strokeWidth="1.5" />
                  <text x="0" y="1" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7.2" fontWeight="900" fill="#000000">stash@{0}</text>
                </motion.g>
              )}
            </>
          )}

          {/* Custom Visualizations */}
          {actionText === 'git init' && (
            <>
              {/* Workspace border box */}
              <rect x="20" y="25" width="360" height="90" rx="6" fill="none" stroke="var(--border)" strokeWidth="2.5" strokeDasharray={actionDone ? "none" : "5 5"} />
              <text x="35" y="44" fill="var(--text)" fontSize="9" fontWeight="bold" fontFamily="var(--font-mono)">
                {actionDone ? "📁 my-project/ (Initialized Git Repository)" : "📁 my-project/ (Standard Directory)"}
              </text>
              
              {!actionDone ? (
                <g>
                  <text x="200" y="80" textAnchor="middle" fill="var(--text)" fontSize="9" opacity="0.65" fontFamily="var(--font-mono)">
                    [Repository Uninitialized]
                  </text>
                  <circle cx="200" cy="74" r="10" fill="none" stroke="var(--border)" strokeWidth="2" strokeDasharray="3 3" opacity="0.4" />
                </g>
              ) : (
                <g>
                  {/* .git folder icon */}
                  <motion.g
                    initial={{ opacity: 0, scale: 0.5, x: 50, y: 65 }}
                    animate={{ opacity: 1, scale: 1, x: 50, y: 65 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    <rect x="0" y="0" width="50" height="28" rx="3" fill="var(--purple)" opacity="0.15" />
                    <rect x="0" y="0" width="50" height="28" rx="3" fill="none" stroke="var(--purple)" strokeWidth="2" />
                    <polygon points="0,5 18,5 23,10 50,10 50,28 0,28" fill="none" stroke="var(--purple)" strokeWidth="2" />
                    <text x="25" y="18" textAnchor="middle" fill="var(--purple)" fontSize="8.5" fontWeight="900" fontFamily="var(--font-mono)">.git/</text>
                  </motion.g>

                  {/* Connector arrow */}
                  <motion.line
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    x1="105" y1="78" x2="285" y2="78"
                    stroke="var(--purple)"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />

                  {/* C1 Commit Node */}
                  <motion.g
                    initial={{ opacity: 0, scale: 0, x: 300, y: 78 }}
                    animate={{ opacity: 1, scale: 1, x: 300, y: 78 }}
                    transition={{ type: 'spring', stiffness: 250, damping: 14, delay: 0.4 }}
                  >
                    <circle cx="0" cy="0" r="11" fill="var(--pink)" stroke="var(--border)" strokeWidth="2.5" />
                    <text x="0" y="3.5" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9.5" fontWeight="900" fill="#000000">C1</text>
                    
                    {/* Branch Label */}
                    <g transform="translate(0, -23)">
                      <rect x="-20" y="0" width="40" height="12" rx="2" fill="var(--yellow)" stroke="var(--border)" strokeWidth="1.5" />
                      <text x="0" y="9" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fontWeight="900" fill="#000000">main</text>
                    </g>
                  </motion.g>
                </g>
              )}
            </>
          )}

          {actionText === 'Check .git contents' && (
            <>
              {/* Root folder */}
              <motion.g
                initial={{ x: 177.5, y: 55 }}
                animate={{ x: 177.5, y: actionDone ? 20 : 55 }}
                transition={{ type: 'spring', stiffness: 180, damping: 20 }}
              >
                <rect x="0" y="0" width="45" height="25" rx="3" fill="var(--purple)" opacity="0.15" />
                <rect x="0" y="0" width="45" height="25" rx="3" fill="none" stroke="var(--purple)" strokeWidth="2" />
                <polygon points="0,5 15,5 20,10 45,10 45,25 0,25" fill="none" stroke="var(--purple)" strokeWidth="2" />
                <text x="22.5" y="16" textAnchor="middle" fill="var(--purple)" fontSize="8.5" fontWeight="900" fontFamily="var(--font-mono)">.git/</text>
              </motion.g>

              {!actionDone ? (
                <text x="200" y="105" textAnchor="middle" fill="var(--text)" fontSize="8.5" opacity="0.6" fontFamily="var(--font-mono)">
                  Click button to examine inside .git
                </text>
              ) : (
                <>
                  {/* Connector lines branching out */}
                  <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} x1="200" y1="45" x2="80" y2="85" stroke="var(--border)" strokeWidth="2" />
                  <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.1 }} x1="200" y1="45" x2="200" y2="85" stroke="var(--border)" strokeWidth="2" />
                  <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.2 }} x1="200" y1="45" x2="320" y2="85" stroke="var(--border)" strokeWidth="2" />

                  {/* Left: objects/ */}
                  <motion.g
                    initial={{ opacity: 0, x: 45, y: 95 }}
                    animate={{ opacity: 1, x: 45, y: 85 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                  >
                    <rect x="0" y="0" width="70" height="24" rx="3" fill="var(--cyan)" opacity="0.15" />
                    <rect x="0" y="0" width="70" height="24" rx="3" fill="none" stroke="var(--cyan)" strokeWidth="1.5" />
                    <text x="35" y="15" textAnchor="middle" fill="var(--cyan)" fontSize="8" fontWeight="900" fontFamily="var(--font-mono)">📁 objects/</text>
                    <text x="35" y="38" textAnchor="middle" fill="var(--text)" fontSize="8" opacity="0.8" fontFamily="var(--font-sans)" fontWeight="bold">Commits/Blobs</text>
                  </motion.g>

                  {/* Middle: refs/ */}
                  <motion.g
                    initial={{ opacity: 0, x: 165, y: 95 }}
                    animate={{ opacity: 1, x: 165, y: 85 }}
                    transition={{ delay: 0.4, type: 'spring' }}
                  >
                    <rect x="0" y="0" width="70" height="24" rx="3" fill="var(--pink)" opacity="0.15" />
                    <rect x="0" y="0" width="70" height="24" rx="3" fill="none" stroke="var(--pink)" strokeWidth="1.5" />
                    <text x="35" y="15" textAnchor="middle" fill="var(--pink)" fontSize="8" fontWeight="900" fontFamily="var(--font-mono)">📁 refs/</text>
                    <text x="35" y="38" textAnchor="middle" fill="var(--text)" fontSize="8" opacity="0.8" fontFamily="var(--font-sans)" fontWeight="bold">Branch pointers</text>
                  </motion.g>

                  {/* Right: index */}
                  <motion.g
                    initial={{ opacity: 0, x: 285, y: 95 }}
                    animate={{ opacity: 1, x: 285, y: 85 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                  >
                    <rect x="0" y="0" width="70" height="24" rx="3" fill="var(--yellow)" opacity="0.15" />
                    <rect x="0" y="0" width="70" height="24" rx="3" fill="none" stroke="var(--yellow)" strokeWidth="1.5" />
                    <text x="35" y="15" textAnchor="middle" fill="var(--yellow)" fontSize="8" fontWeight="900" fontFamily="var(--font-mono)">📄 index</text>
                    <text x="35" y="38" textAnchor="middle" fill="var(--text)" fontSize="8" opacity="0.8" fontFamily="var(--font-sans)" fontWeight="bold">Staging area</text>
                  </motion.g>
                </>
              )}
            </>
          )}

          {actionText === 'git add .' && (
            <>
              {/* Working Directory Box */}
              <rect x="20" y="35" width="150" height="85" rx="5" fill="none" stroke="var(--border)" strokeWidth="2" />
              <text x="95" y="24" textAnchor="middle" fill="var(--text)" fontSize="8" fontWeight="900" fontFamily="var(--font-mono)">WORKING DIRECTORY</text>
              
              {/* Staging Area Box */}
              <rect x="230" y="35" width="150" height="85" rx="5" fill="none" stroke="var(--border)" strokeWidth="2" strokeDasharray="3 3" />
              <text x="305" y="24" textAnchor="middle" fill="var(--text)" fontSize="8" fontWeight="900" fontFamily="var(--font-mono)">STAGING INDEX</text>

              {/* Connecting line */}
              <line x1="170" y1="77" x2="230" y2="77" stroke="var(--border)" strokeWidth="2" strokeDasharray="3 3" />
              <polygon points="230,77 222,73 222,81" fill="var(--border)" />

              {/* file.txt */}
              <motion.g
                initial={{ x: 55, y: 57 }}
                animate={{
                  x: actionDone ? 265 : 55,
                  y: 57
                }}
                transition={{ type: 'spring', stiffness: 120, damping: 15 }}
              >
                <rect x="0" y="0" width="80" height="30" rx="3" fill={actionDone ? 'var(--cyan)' : 'var(--pink)'} opacity="0.15" />
                <rect x="0" y="0" width="80" height="30" rx="3" fill="none" stroke={actionDone ? 'var(--cyan)' : 'var(--pink)'} strokeWidth="2" />
                <text x="10" y="18" fill="var(--text)" fontSize="8" fontWeight="900" fontFamily="var(--font-mono)">📄 file.txt</text>
                
                {actionDone && (
                  <motion.g
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    transform="translate(62, 5)"
                  >
                    <circle cx="5" cy="5" r="5" fill="var(--cyan)" stroke="var(--border)" strokeWidth="1" />
                    <text x="5" y="8.5" textAnchor="middle" fill="#000000" fontSize="7" fontWeight="bold">+</text>
                  </motion.g>
                )}
              </motion.g>
            </>
          )}

          {actionText === 'Check .gitignore match' && (
            <>
              {/* Workspace & Staging Area */}
              <rect x="20" y="35" width="140" height="90" rx="5" fill="none" stroke="var(--border)" strokeWidth="2" />
              <text x="90" y="24" textAnchor="middle" fill="var(--text)" fontSize="8" fontWeight="900" fontFamily="var(--font-mono)">WORKSPACE</text>
              
              <rect x="240" y="35" width="140" height="90" rx="5" fill="none" stroke="var(--border)" strokeWidth="2" strokeDasharray="3 3" />
              <text x="310" y="24" textAnchor="middle" fill="var(--text)" fontSize="8" fontWeight="900" fontFamily="var(--font-mono)">STAGING AREA</text>

              {/* .gitignore filter line */}
              <line x1="200" y1="25" x2="200" y2="130" stroke="var(--purple)" strokeWidth="3" strokeDasharray="4 2" />
              <text x="200" y="18" textAnchor="middle" fill="var(--purple)" fontSize="8" fontWeight="900" fontFamily="var(--font-mono)">.gitignore</text>

              {/* README.md */}
              <motion.g
                initial={{ x: 50, y: 46 }}
                animate={{
                  x: actionDone ? 270 : 50,
                  y: 46
                }}
                transition={{ type: 'spring', stiffness: 120, damping: 14 }}
              >
                <rect x="0" y="0" width="80" height="22" rx="3" fill="var(--cyan)" opacity="0.15" />
                <rect x="0" y="0" width="80" height="22" rx="3" fill="none" stroke="var(--cyan)" strokeWidth="1.5" />
                <text x="10" y="14" fill="var(--text)" fontSize="7.5" fontWeight="900" fontFamily="var(--font-mono)">📄 README.md</text>
              </motion.g>

              {/* node_modules */}
              <motion.g
                initial={{ x: 50, y: 84 }}
                animate={actionDone ? {
                  x: [50, 185, 160, 165, 50],
                  y: [84, 84, 84, 84, 84],
                } : {
                  x: 50,
                  y: 84
                }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              >
                <rect x="0" y="0" width="80" height="22" rx="3" fill="var(--pink)" opacity="0.15" />
                <rect x="0" y="0" width="80" height="22" rx="3" fill="none" stroke="var(--pink)" strokeWidth="1.5" />
                <text x="10" y="14" fill="var(--text)" fontSize="7.5" fontWeight="900" fontFamily="var(--font-mono)">📁 node_modules</text>
                
                {actionDone && (
                  <motion.g
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0] }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    transform="translate(68, 4)"
                  >
                    <circle cx="5" cy="5" r="6" fill="var(--pink)" />
                    <text x="5" y="8" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">✕</text>
                  </motion.g>
                )}
              </motion.g>
            </>
          )}

          {actionText === 'Check HEAD file' && (
            <>
              {/* Commits C1 & C2 background chain */}
              <g opacity="0.5">
                <circle cx="120" cy="95" r="11" fill="none" stroke="var(--border)" strokeWidth="2.5" />
                <text x="120" y="98.5" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9.5" fontWeight="900" fill="var(--text)">C1</text>
                <line x1="131" y1="95" x2="269" y2="95" stroke="var(--border)" strokeWidth="2.5" />
              </g>
              
              {/* C2 Commit Node */}
              <g transform="translate(280, 95)">
                <circle cx="0" cy="0" r="11" fill="var(--cyan)" stroke="var(--border)" strokeWidth="2.5" />
                <text x="0" y="3.5" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9.5" fontWeight="900" fill="#000000">C2</text>
              </g>

              {/* HEAD File box */}
              <g transform="translate(50, 30)">
                <rect x="0" y="0" width="80" height="25" rx="3" fill="var(--purple)" opacity="0.15" />
                <rect x="0" y="0" width="80" height="25" rx="3" fill="none" stroke="var(--purple)" strokeWidth="2" />
                <text x="40" y="16" textAnchor="middle" fill="var(--purple)" fontSize="8.5" fontWeight="900" fontFamily="var(--font-mono)">HEAD</text>
                <text x="40" y="-4" textAnchor="middle" fill="var(--text)" fontSize="6" opacity="0.8" fontFamily="var(--font-sans)" fontWeight="bold">Pointer File</text>
              </g>

              {/* Branch File box */}
              <g transform="translate(170, 30)">
                <rect x="0" y="0" width="90" height="25" rx="3" fill="var(--yellow)" opacity="0.15" />
                <rect x="0" y="0" width="90" height="25" rx="3" fill="none" stroke="var(--yellow)" strokeWidth="2" />
                <text x="45" y="16" textAnchor="middle" fill="var(--yellow)" fontSize="7.5" fontWeight="900" fontFamily="var(--font-mono)">refs/heads/main</text>
                <text x="45" y="-4" textAnchor="middle" fill="var(--text)" fontSize="6" opacity="0.8" fontFamily="var(--font-sans)" fontWeight="bold">Branch File</text>
              </g>

              {/* Connector: HEAD -> Branch */}
              {actionDone ? (
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5 }}
                  d="M 130 42 L 170 42"
                  stroke="var(--purple)"
                  strokeWidth="2.5"
                  markerEnd="url(#arrow)"
                />
              ) : (
                <line x1="130" y1="42" x2="170" y2="42" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
              )}

              {/* Connector: Branch -> C2 */}
              {actionDone ? (
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  d="M 215 55 L 275 84"
                  stroke="var(--purple)"
                  strokeWidth="2.5"
                  markerEnd="url(#arrow)"
                />
              ) : (
                <line x1="215" y1="55" x2="275" y2="84" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
              )}

              {/* Labels / Text */}
              {actionDone && (
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <rect x="120" y="65" width="160" height="15" rx="2" fill="var(--white)" stroke="var(--border)" strokeWidth="1.5" />
                  <text x="200" y="75" textAnchor="middle" fill="var(--text)" fontSize="6.5" fontWeight="900" fontFamily="var(--font-mono)">
                    HEAD points to main -> C2
                  </text>
                </motion.g>
              )}

              {/* SVG Marker Definition */}
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--purple)" />
                </marker>
              </defs>
            </>
          )}

          {actionText === 'git bisect start' && (
            <>
              {/* 5 commit chain representing search space */}
              <g>
                {/* Connector lines */}
                <line x1="60" y1="75" x2="340" y2="75" stroke="var(--border)" strokeWidth="3.5" />
                
                {/* Commits */}
                {[
                  { id: 'C1', x: 60, status: 'good', color: 'var(--cyan)' },
                  { id: 'C2', x: 130, status: 'unknown', color: 'var(--white)' },
                  { id: 'C3', x: 200, status: 'unknown', color: 'var(--white)' },
                  { id: 'C4', x: 270, status: 'unknown', color: 'var(--white)' },
                  { id: 'C5', x: 340, status: 'bad', color: 'var(--pink)' },
                ].map((c) => (
                  <g key={c.id} transform={`translate(${c.x}, 75)`}>
                    <circle cx="0" cy="0" r="11" fill={c.color} stroke="var(--border)" strokeWidth="2.5" />
                    <text x="0" y="3" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fontWeight="900" fill={c.status === 'unknown' ? 'var(--text)' : '#000000'}>{c.id}</text>
                    <text x="0" y="-15" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="7.5" fontWeight="900" fill={c.status === 'good' ? 'var(--cyan)' : c.status === 'bad' ? 'var(--pink)' : 'var(--text)'} opacity={c.status === 'unknown' ? 0.5 : 1}>
                      {c.status.toUpperCase()}
                    </text>
                  </g>
                ))}
              </g>

              {/* Bisect scanning selector */}
              {actionDone && (
                <motion.g
                  initial={{ x: 340, y: 75, scale: 0 }}
                  animate={{
                    x: [340, 200, 130, 200], // Jumps to midpoint C3, then checks, etc.
                    scale: [0, 1.3, 1.3, 1.3],
                    y: [75, 75, 75, 75]
                  }}
                  transition={{
                    duration: 2.2,
                    times: [0, 0.4, 0.7, 1],
                    ease: "easeInOut"
                  }}
                >
                  {/* Scanning circle */}
                  <circle cx="0" cy="0" r="16" fill="none" stroke="var(--purple)" strokeWidth="2.5" strokeDasharray="3 3" />
                  <motion.circle
                    cx="0"
                    cy="0"
                    r="16"
                    fill="transparent"
                    stroke="var(--purple)"
                    strokeWidth="1.5"
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                  {/* Magnifying glass handle */}
                  <line x1="11" y1="11" x2="19" y2="19" stroke="var(--purple)" strokeWidth="3.5" strokeLinecap="round" />
                </motion.g>
              )}

              {actionDone && (
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.2 }}
                >
                  <rect x="100" y="112" width="200" height="15" rx="2" fill="var(--white)" stroke="var(--purple)" strokeWidth="1.5" />
                  <text x="200" y="122" textAnchor="middle" fill="var(--purple)" fontSize="6.5" fontWeight="900" fontFamily="var(--font-mono)">
                    🔍 testing midpoint C3 (unknown)...
                  </text>
                </motion.g>
              )}
            </>
          )}

          {/* Animated DAG lines */}
          {!isCustomViz && connections.map((edge, idx) => {
            const start = getCoords(edge.from);
            const end = getCoords(edge.to);
            const isBranching = start.y !== end.y;

            // Fade connections to a reset commit
            const isOrphaned = (isResetHard || isResetSoft) && (edge.to === 'C2' || edge.from === 'C2');

            return (
              <motion.line
                key={`line-${edge.from}-${edge.to}-${idx}`}
                animate={{
                  x1: start.x,
                  y1: start.y,
                  x2: end.x,
                  y2: end.y
                }}
                transition={{ type: 'spring', stiffness: 180, damping: 20 }}
                stroke="var(--border)"
                strokeWidth="3.5"
                strokeDasharray={isBranching ? "5 3" : "none"}
                opacity={isOrphaned ? 0.15 : isBranching ? 0.6 : 1}
              />
            );
          })}

          {/* Animated Commit nodes */}
          {!isCustomViz && localCommits.map((c) => {
            const coords = getCoords(c.id);
            const isSelected = selectedCommit?.id === c.id;
            const matchedBranches = localBranches.filter(b => b.commitId === c.id);
            const isBranchHead = matchedBranches.length > 0;
            const isMainLane = coords.y <= 70;
            
            const isConflictedNode = isConflicted && (c.id === 'C2' || c.id === 'C3');
            
            let nodeOpacity = 1;
            let nodeStrokeDash = "none";
            let nodeStroke = "var(--border)";
            
            if (c.id === 'C2') {
              if (isResetHard) {
                nodeOpacity = 0.2;
                nodeStrokeDash = "3 3";
              } else if (isResetSoft) {
                nodeStroke = "var(--yellow)";
                nodeStrokeDash = "3 1";
              }
            }

            const nodeFillColor = isSelected 
              ? (isMainLane ? 'var(--purple)' : 'var(--cyan)') 
              : isBranchHead 
                ? 'var(--pink)' 
                : isConflictedNode
                  ? 'var(--pink)'
                  : 'var(--white)';

            const motionProps = isConflictedNode
              ? {
                  animate: { 
                    x: [coords.x, coords.x - 3, coords.x + 3, coords.x - 3, coords.x + 3, coords.x],
                    y: [coords.y, coords.y + 2, coords.y - 2, coords.y + 2, coords.y - 2, coords.y]
                  },
                  transition: { duration: 0.5, repeat: Infinity, repeatType: "mirror" }
                }
              : {
                  animate: { x: coords.x, y: coords.y, opacity: nodeOpacity },
                  transition: { type: 'spring', stiffness: 180, damping: 20 }
                };

            return (
              <g key={c.id}>
                <motion.g
                  {...motionProps}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleCommitClick(c)}
                  whileHover={{ scale: 1.2 }}
                >
                  {isSelected && (
                    <motion.circle
                      cx={0}
                      cy={0}
                      r="16"
                      fill="transparent"
                      stroke={isMainLane ? "var(--purple)" : "var(--cyan)"}
                      strokeWidth="2.5"
                      animate={{ scale: [1, 1.25, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                  
                  <circle
                    cx={0}
                    cy={0}
                    r="11"
                    fill={nodeFillColor}
                    stroke={nodeStroke}
                    strokeWidth="3.5"
                    strokeDasharray={nodeStrokeDash}
                  />
                  
                  <text
                    x={0}
                    y={3.5}
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                    fontSize="9.5"
                    fontWeight="900"
                    fill={isSelected ? '#ffffff' : 'var(--text)'}
                  >
                    {c.id}
                  </text>

                  {matchedBranches.map((b, bIdx) => {
                    const isDetached = b.name.includes('detached');
                    const isRemoteTag = b.name.includes('origin');
                    
                    const tagFill = isDetached 
                      ? 'var(--pink)' 
                      : isRemoteTag 
                        ? 'var(--orange)' 
                        : 'var(--yellow)';
                    const tagTextFill = isDetached ? '#ffffff' : '#000000';
                    const ry = -24 - (bIdx * 16);
                    
                    const tagScale = isDetached ? [1, 1.06, 1] : 1;
                    const tagTransition = isDetached 
                      ? { duration: 1.2, repeat: Infinity } 
                      : {};

                    return (
                      <motion.g
                        key={b.name}
                        initial={{ scale: 0, y: -6 }}
                        animate={{ scale: tagScale, y: 0 }}
                        transition={isDetached ? tagTransition : { type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        <rect
                          x={-28}
                          y={ry}
                          width="56"
                          height="13"
                          rx="3"
                          fill={tagFill}
                          stroke="var(--border)"
                          strokeWidth="1.5"
                        />
                        <text
                          x={0}
                          y={ry + 9}
                          textAnchor="middle"
                          fontFamily="var(--font-mono)"
                          fontSize="7"
                          fontWeight="900"
                          fill={tagTextFill}
                        >
                          {b.name}
                        </text>
                      </motion.g>
                    );
                  })}
                </motion.g>
              </g>
            );
          })}
        </svg>

        {isConflicted && (
          <div style={{ position: 'absolute', bottom: '6px', left: '10px', fontSize: '0.66rem', fontWeight: 800, color: 'var(--pink)', fontFamily: 'var(--font-mono)' }}>
            ⚠️ CONFLICT (content): Merge conflict in file.txt (Nodes shaking)
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.35rem' }}>
        <button className="btn btn-sm" style={{ flex: 1, background: 'var(--cyan)' }} onClick={handleAction} disabled={actionDone}>
          {actionText}
        </button>
        <button className="btn btn-sm" onClick={handleReset}>Reset</button>
      </div>
    </div>
  );
}

/* =========================================================================
   5. SQL SANDBOX ENGINE
   ========================================================================= */
export function SqlSandbox({ sourceHeaders = [], sourceRows = [], queryText = '', resultHeaders = [], resultRows = [], annotation = '' }) {
  const [executed, setExecuted] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      <div style={{ padding: '0.5rem', background: '#1e1e1e', color: '#d4d4d4', border: '3.5px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', overflowX: 'auto', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>
        <code>{queryText}</code>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: executed ? '1fr 1fr' : '1fr', gap: '0.75rem', minHeight: 170 }}>
        {/* Source Table */}
        <div style={{ border: '3px solid var(--border)', background: 'var(--white)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '0.35rem', borderBottom: '3px solid var(--border)', background: 'var(--cyan)', fontWeight: 800, fontSize: '0.75rem' }}>
            📋 SOURCE TABLE
          </div>
          <div style={{ flex: 1, padding: '0.4rem', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {sourceHeaders.map((h, i) => <th key={i} style={{ padding: '0.2rem', textAlign: 'left', fontWeight: 800 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {sourceRows.map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: '1px solid #ddd' }}>
                    {row.map((cell, cIdx) => <td key={cIdx} style={{ padding: '0.2rem' }}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Result Table */}
        {executed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ border: '3px solid var(--border)', background: 'var(--white)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-sm)' }}
          >
            <div style={{ padding: '0.35rem', borderBottom: '3px solid var(--border)', background: 'var(--green)', fontWeight: 800, fontSize: '0.75rem' }}>
              📊 QUERY RESULT SET
            </div>
            <div style={{ flex: 1, padding: '0.4rem', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    {resultHeaders.map((h, i) => <th key={i} style={{ padding: '0.2rem', textAlign: 'left', fontWeight: 800 }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {resultRows.map((row, rIdx) => (
                    <tr key={rIdx} style={{ borderBottom: '1px solid #ddd' }}>
                      {row.map((cell, cIdx) => <td key={cIdx} style={{ padding: '0.2rem' }}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
        <button className="btn btn-sm" style={{ flex: 1, background: 'var(--green)' }} onClick={() => setExecuted(true)} disabled={executed}>
          Execute Query
        </button>
        <button className="btn btn-sm" onClick={() => setExecuted(false)}>Reset</button>
      </div>

      {annotation && (
        <div style={{ fontSize: '0.75rem', opacity: 0.6, fontStyle: 'italic', textAlign: 'center' }}>
          {annotation}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   6. CONCURRENCY TIMELINE ENGINE
   ========================================================================= */
export function ConcurrencyTimeline({ timelines = [], legend = [] }) {
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setTick(t => {
        if (t >= 10) {
          setRunning(false);
          return t;
        }
        return t + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  const handleRun = () => {
    setTick(0);
    setRunning(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>Time tick: {tick} / 10</span>
        <button className={`btn btn-sm ${running ? 'btn-pink' : 'btn-cyan'}`} onClick={handleRun} disabled={running}>
          {running ? 'Simulating...' : 'Run Timeline'}
        </button>
      </div>

      {/* Grid containing Timelines */}
      <div style={{ border: '3px solid var(--border)', background: 'var(--white)', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', boxShadow: 'var(--shadow-sm)' }}>
        {timelines.map((timeline, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 80, fontWeight: 800, fontSize: '0.75rem' }}>{timeline.name}:</div>
            <div style={{ flex: 1, border: '2px solid var(--border)', height: 28, background: 'var(--bg)', display: 'flex', overflow: 'hidden' }}>
              {timeline.segments.map((seg, sIdx) => {
                const duration = seg.duration || 1;
                const progressWidth = Math.max(0, Math.min(100, ((tick - seg.start) / duration) * 100));
                const active = tick >= seg.start;
                const widthPercent = (duration / 10) * 100;

                return (
                  <div
                    key={sIdx}
                    style={{
                      width: `${widthPercent}%`,
                      height: '100%',
                      background: active ? (seg.color || 'var(--cyan)') : '#e0e0e0',
                      opacity: active ? 1 : 0.45,
                      borderRight: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: '0.3rem',
                      fontWeight: 800,
                      fontSize: '0.62rem',
                      fontFamily: 'var(--font-mono)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {active ? seg.label : ''}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      {legend.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {legend.map((leg, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem' }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, border: '1px solid var(--border)', background: leg.color }} />
              {leg.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   7. 15 INTERACTIVE RIDDLES
   ========================================================================= */

// 1. 25 Horses Puzzle Racing Lanes Simulator
export function Horses25Visualizer() {
  const [races, setRaces] = useState([]);
  const [status, setStatus] = useState('No races run yet. Run Group races 1-5 first.');
  const [activeRace, setActiveRace] = useState(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  const runRace = (group) => {
    let result = '';
    if (group === 'group') {
      result = 'Group Races: A1>A2>A3, B1>B2>B3, C1>C2>C3, D1>D2>D3, E1>E2>E3';
      setStatus('Races 1-5 finished. Next, run the Winners race.');
    } else if (group === 'winners') {
      result = 'Winners Race: A1 > B1 > C1 > D1 > E1';
      setStatus('Race 6 finished. A1 is overall 1st. Next, race candidates A2, A3, B1, B2, C1 to find 2nd & 3rd.');
    } else if (group === 'final') {
      result = 'Final Race (A2, A3, B1, B2, C1): A2 > B1 > B2';
      setStatus('Race 7 finished. Top 3 are Rank 1: A1, Rank 2: A2, Rank 3: B1. Completed in 7 races!');
    }
    
    setActiveRace(group);
    setAnimationProgress(0);
    setTimeout(() => {
      setAnimationProgress(100);
      setRaces([...races, result]);
    }, 1500);
  };

  const getHorseName = () => {
    if (activeRace === 'group') {
      return ['A1', 'A2', 'A3', 'A4', 'A5'];
    }
    if (activeRace === 'winners') {
      return ['A1', 'B1', 'C1', 'D1', 'E1'];
    }
    if (activeRace === 'final') {
      return ['A2', 'B1', 'B2', 'A3', 'C1'];
    }
    return ['', '', '', '', ''];
  };

  const getTargetPosition = (laneIdx) => {
    if (animationProgress === 0) return 0;
    if (activeRace === 'group') {
      return 100 - laneIdx * 15;
    }
    if (activeRace === 'winners') {
      return 100 - laneIdx * 15;
    }
    if (activeRace === 'final') {
      const finalRanks = [100, 85, 70, 55, 40];
      return finalRanks[laneIdx];
    }
    return 0;
  };

  const horseLanes = getHorseName();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
      <div style={{ padding: '0.4rem 0.6rem', background: 'var(--bg)', border: '2px solid var(--border)', fontSize: '0.78rem' }}>{status}</div>
      
      {/* Racetrack Visualizer */}
      <div style={{ border: '3px solid var(--border)', padding: '0.75rem', background: '#2c3e50', minHeight: 180, display: 'flex', flexDirection: 'column', gap: '0.35rem', position: 'relative', overflow: 'hidden' }}>
        {[0, 1, 2, 3, 4].map((i) => {
          const horseName = horseLanes[i] || `H${i + 1}`;
          const leftPos = getTargetPosition(i);
          return (
            <div key={i} style={{ height: 28, background: '#34495e', borderBottom: i < 4 ? '1.5px dashed rgba(255,255,255,0.2)' : 'none', display: 'flex', alignItems: 'center', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 4, fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>LANE {i+1}</span>
              
              <motion.div
                initial={{ left: '15%' }}
                animate={{ left: `${15 + leftPos * 0.7}%` }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '0.1rem 0.4rem',
                  background: 'var(--yellow)',
                  border: '1.5px solid var(--border)',
                  boxShadow: '1px 1px 0 var(--border)',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: '#000000',
                  borderRadius: 2,
                  zIndex: 2
                }}
              >
                <span>🐎</span>
                <span>{activeRace ? horseName : `H${i+1}`}</span>
              </motion.div>

              <div style={{ position: 'absolute', right: '12%', top: 0, bottom: 0, width: 4, background: '#ffffff', borderRight: '2px dashed #000000' }} />
            </div>
          );
        })}
      </div>

      <div style={{ border: '2.5px solid var(--border)', padding: '0.5rem', background: 'var(--white)', minHeight: 80, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.5 }}>Race Results Log</div>
        {races.length === 0 && <div style={{ fontSize: '0.72rem', fontStyle: 'italic', opacity: 0.5 }}>Run races to populate logs.</div>}
        {races.map((r, i) => (
          <div key={i} style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', borderBottom: '1px solid #eee', paddingBottom: 2 }}>
            <strong>Race {i + 1}:</strong> {r}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.35rem' }}>
        <button className="btn btn-sm" style={{ flex: 1, background: 'var(--cyan)' }} onClick={() => runRace('group')}>Races 1-5 (Groups)</button>
        <button className="btn btn-sm" style={{ flex: 1, background: 'var(--purple)' }} onClick={() => runRace('winners')} disabled={races.length < 1}>Race 6 (Winners)</button>
        <button className="btn btn-sm" style={{ flex: 1, background: 'var(--pink)' }} onClick={() => runRace('final')} disabled={races.length < 2}>Race 7 (Finals)</button>
        <button className="btn btn-sm" onClick={() => { setRaces([]); setActiveRace(null); setStatus('No races run yet. Run Group races 1-5 first.'); }}>Clear</button>
      </div>
    </div>
  );
}

// 2. 8 Ball Puzzle Scale Weight balance
export function Ball8Visualizer() {
  const [leftPan, setLeftPan] = useState([]);
  const [rightPan, setRightPan] = useState([]);
  const [scale, setScale] = useState('Balanced');
  const [weightsCount, setWeightsCount] = useState(0);
  const [weighed, setWeighed] = useState(false);

  const weigh = () => {
    if (leftPan.length === 0 && rightPan.length === 0) return;
    setWeightsCount(weightsCount + 1);
    setWeighed(true);

    const getWeight = (pan) => {
      return pan.reduce((acc, b) => acc + (b === 8 ? 1.5 : 1.0), 0);
    };

    const wLeft = getWeight(leftPan);
    const wRight = getWeight(rightPan);

    if (wLeft > wRight) {
      setScale('Left Heavy');
    } else if (wRight > wLeft) {
      setScale('Right Heavy');
    } else {
      setScale('Balanced');
    }
  };

  const handleReset = () => {
    setLeftPan([]);
    setRightPan([]);
    setScale('Balanced');
    setWeightsCount(0);
    setWeighed(false);
  };

  const toggleBall = (b) => {
    setWeighed(false);
    if (leftPan.includes(b)) {
      setLeftPan(leftPan.filter(x => x !== b));
      setRightPan([...rightPan, b]);
    } else if (rightPan.includes(b)) {
      setRightPan(rightPan.filter(x => x !== b));
    } else {
      setLeftPan([...leftPan, b]);
    }
  };

  const tableBalls = [1, 2, 3, 4, 5, 6, 7, 8].filter(b => !leftPan.includes(b) && !rightPan.includes(b));
  const scaleAngle = scale === 'Left Heavy' ? -12 : scale === 'Right Heavy' ? 12 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
      <div style={{ padding: '0.4rem 0.6rem', background: 'var(--bg)', border: '2px solid var(--border)', fontSize: '0.78rem', textAlign: 'center' }}>
        Weighings: <strong>{weightsCount} / 2</strong> | Status: <strong>{weighed ? scale : 'Not Weighed'}</strong>
      </div>

      <div style={{ border: '3px solid var(--border)', padding: '1rem', background: 'var(--white)', minHeight: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'relative', width: 280, height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
          <div style={{ position: 'absolute', bottom: 0, width: 60, height: 8, background: '#7f8c8d', border: '2.5px solid var(--border)' }} />
          <div style={{ position: 'absolute', bottom: 8, width: 10, height: 60, background: '#bdc3c7', border: '2.5px solid var(--border)' }} />
          
          <motion.div
            animate={{ rotate: scaleAngle }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            style={{
              position: 'absolute',
              top: 45,
              width: 200,
              height: 8,
              background: '#7f8c8d',
              border: '2.5px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transformOrigin: 'center center'
            }}
          >
            <div style={{ position: 'relative', left: -2, top: 4 }}>
              <motion.div
                animate={{ y: scaleAngle * 0.5 }}
                transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                style={{
                  position: 'absolute',
                  left: -30,
                  width: 60,
                  minHeight: 40,
                  background: 'rgba(102, 217, 239, 0.15)',
                  border: '2px solid var(--border)',
                  borderTop: 'none',
                  borderRadius: '0 0 16px 16px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignContent: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  padding: 4
                }}
              >
                {leftPan.map(b => (
                  <span key={b} style={{ display: 'inline-block', width: 15, height: 15, background: 'var(--cyan)', border: '1.5px solid var(--border)', borderRadius: '50%', fontSize: '0.55rem', fontWeight: 900, textAlign: 'center', lineHeight: '12px', color: '#000000' }}>
                    {b}
                  </span>
                ))}
              </motion.div>
            </div>

            <div style={{ width: 8, height: 8, background: 'var(--purple)', border: '1px solid var(--border)', borderRadius: '50%' }} />

            <div style={{ position: 'relative', right: -2, top: 4 }}>
              <motion.div
                animate={{ y: -scaleAngle * 0.5 }}
                transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                style={{
                  position: 'absolute',
                  right: -30,
                  width: 60,
                  minHeight: 40,
                  background: 'rgba(255, 107, 157, 0.15)',
                  border: '2px solid var(--border)',
                  borderTop: 'none',
                  borderRadius: '0 0 16px 16px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignContent: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  padding: 4
                }}
              >
                {rightPan.map(b => (
                  <span key={b} style={{ display: 'inline-block', width: 15, height: 15, background: 'var(--pink)', border: '1.5px solid var(--border)', borderRadius: '50%', fontSize: '0.55rem', fontWeight: 900, textAlign: 'center', lineHeight: '12px', color: '#000000' }}>
                    {b}
                  </span>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{ border: '2px dashed var(--border)', padding: '0.5rem', background: 'var(--white)', minHeight: 45, display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
        {tableBalls.map(b => (
          <motion.button
            key={b}
            whileHover={{ scale: 1.1 }}
            onClick={() => toggleBall(b)}
            style={{
              width: 25,
              height: 25,
              background: 'var(--white)',
              border: '2px solid var(--border)',
              borderRadius: '50%',
              fontSize: '0.75rem',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '1.5px 1.5px 0 var(--border)'
            }}
          >
            {b}
          </motion.button>
        ))}
        {tableBalls.length === 0 && <span style={{ fontSize: '0.7rem', opacity: 0.5, fontStyle: 'italic', alignSelf: 'center' }}>All balls placed. Click on pans to return them.</span>}
      </div>

      <div style={{ display: 'flex', gap: '0.35rem' }}>
        <button className="btn btn-sm btn-cyan" style={{ flex: 1 }} onClick={weigh} disabled={leftPan.length === 0 && rightPan.length === 0}>
          ⚖ Weigh Scale
        </button>
        <button className="btn btn-sm" onClick={handleReset}>Reset</button>
      </div>
    </div>
  );
}

// 3. Bridge & Torch Character Crossing Stepper
export function BridgeTorchVisualizer() {
  const [left, setLeft] = useState(['A (1)', 'B (2)', 'C (5)', 'D (10)']);
  const [right, setRight] = useState([]);
  const [torch, setTorch] = useState('left');
  const [time, setTime] = useState(0);
  const [log, setLog] = useState('Select up to 2 people on the active bank, then cross.');
  const [selected, setSelected] = useState([]);
  const [isCrossing, setIsCrossing] = useState(false);

  const toggleSelect = (person) => {
    if (isCrossing) return;
    if (selected.includes(person)) {
      setSelected(selected.filter(p => p !== person));
    } else {
      if (selected.length >= 2) {
        setLog('Can only cross up to 2 people at a time!');
        return;
      }
      setSelected([...selected, person]);
    }
  };

  const handleCross = () => {
    if (selected.length === 0 || isCrossing) return;
    setIsCrossing(true);

    const cost = Math.max(...selected.map(p => {
      const match = p.match(/\d+/);
      return match ? parseInt(match[0]) : 1;
    }));

    setLog(`Crossing ${selected.join(' & ')} (takes ${cost} min)...`);

    setTimeout(() => {
      if (torch === 'left') {
        setLeft(left.filter(p => !selected.includes(p)));
        setRight([...right, ...selected]);
        setTorch('right');
      } else {
        setRight(right.filter(p => !selected.includes(p)));
        setLeft([...left, ...selected]);
        setTorch('left');
      }
      setTime(time + cost);
      setLog(`Crossed successfully! Cost: ${cost} min.`);
      setSelected([]);
      setIsCrossing(false);
    }, 1200);
  };

  const handleReset = () => {
    setLeft(['A (1)', 'B (2)', 'C (5)', 'D (10)']);
    setRight([]);
    setTorch('left');
    setTime(0);
    setSelected([]);
    setIsCrossing(false);
    setLog('Simulator reset.');
  };

  const peopleDetails = {
    'A (1)': { name: 'A', speed: '1m', color: '#66D9EF', xLeft: 7, xRight: 78, y: 18 },
    'B (2)': { name: 'B', speed: '2m', color: '#A6E22E', xLeft: 7, xRight: 78, y: 55 },
    'C (5)': { name: 'C', speed: '5m', color: '#FD971F', xLeft: 18, xRight: 89, y: 18 },
    'D (10)': { name: 'D', speed: '10m', color: '#F92672', xLeft: 18, xRight: 89, y: 55 }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
      <div style={{ padding: '0.4rem 0.6rem', background: 'var(--bg)', border: '2px solid var(--border)', fontSize: '0.78rem' }}>
        <strong>Log:</strong> {log} | <strong>Total Time:</strong> {time} min (Goal: &le;17 min)
      </div>

      {/* Starry Night River crossing scene */}
      <div style={{ 
        border: '3px solid var(--border)', 
        padding: '0.75rem', 
        background: '#0B132B', // Dark night sky
        height: 200, 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative', 
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Pulsing Stars */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.7 }}>
          <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 2 }} style={{ position: 'absolute', top: '15%', left: '12%', width: 2, height: 2, background: '#fff', borderRadius: '50%' }} />
          <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 3, delay: 0.5 }} style={{ position: 'absolute', top: '25%', left: '48%', width: 3, height: 3, background: '#fff', borderRadius: '50%' }} />
          <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} style={{ position: 'absolute', top: '10%', left: '85%', width: 2, height: 2, background: '#fff', borderRadius: '50%' }} />
          <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 2.5, delay: 0.8 }} style={{ position: 'absolute', top: '75%', left: '25%', width: 2, height: 2, background: '#fff', borderRadius: '50%' }} />
        </div>

        {/* River in the middle */}
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          bottom: 0, 
          left: '32%', 
          right: '32%', 
          background: 'linear-gradient(90deg, #1C2541 0%, #3A506B 50%, #1C2541 100%)', 
          borderLeft: '2px solid rgba(255,255,255,0.05)', 
          borderRight: '2px solid rgba(255,255,255,0.05)', 
          zIndex: 1 
        }}>
          {/* Animated Wave lines */}
          <svg width="100%" height="100%" style={{ opacity: 0.15 }}>
            <pattern id="waves" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M 0 10 Q 10 5, 20 10 T 40 10" fill="none" stroke="#5BC0BE" strokeWidth="1.5" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#waves)" />
          </svg>
        </div>

        {/* Wooden Bridge */}
        <div style={{ 
          position: 'absolute', 
          top: '35%', 
          bottom: '35%', 
          left: '28%', 
          right: '28%', 
          background: '#5C4033', // Brown wood
          borderTop: '3px solid #3d2b22', 
          borderBottom: '3px solid #3d2b22', 
          zIndex: 2,
          boxShadow: '0 4px 6px rgba(0,0,0,0.4)'
        }}>
          {/* Wood Planks lines */}
          <div style={{
            width: '100%',
            height: '100%',
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 12px, #3d2b22 12px, #3d2b22 14px)',
            opacity: 0.4
          }} />
          {/* Handrails */}
          <div style={{ position: 'absolute', top: -5, left: 0, right: 0, height: 2, background: '#CD7F32', opacity: 0.8 }} />
          <div style={{ position: 'absolute', bottom: -5, left: 0, right: 0, height: 2, background: '#CD7F32', opacity: 0.8 }} />
        </div>

        {/* Grassy banks */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '30%', background: '#1B4D3E', zIndex: 1, borderRight: '4px solid #14352B' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '30%', background: '#1B4D3E', zIndex: 1, borderLeft: '4px solid #14352B' }} />

        {/* Bank Labels */}
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 5, fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
          Left Bank {torch === 'left' && !isCrossing && <span style={{ color: '#FFD700' }}>● ACTIVE</span>}
        </div>
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 5, fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
          Right Bank {torch === 'right' && !isCrossing && <span style={{ color: '#FFD700' }}>● ACTIVE</span>}
        </div>

        {/* Animated Torch */}
        <motion.div
          animate={{
            left: isCrossing
              ? (torch === 'left' ? '65%' : '35%')
              : (torch === 'left' ? '25%' : '75%'),
            top: isCrossing ? '50%' : '50%'
          }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            width: 24,
            height: 24,
            zIndex: 10,
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Torch Glow Effect */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }} 
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{
              position: 'absolute',
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,165,0,0.5) 0%, rgba(255,165,0,0) 70%)'
            }} 
          />
          {/* Torch Icon (Vector SVG flame) */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF5722" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px #FFD700)' }}>
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z" fill="#FFC107" />
          </svg>
        </motion.div>

        {/* Render Characters */}
        {['A (1)', 'B (2)', 'C (5)', 'D (10)'].map(p => {
          const detail = peopleDetails[p];
          const isSel = selected.includes(p);
          const onLeft = left.includes(p);
          const onRight = right.includes(p);
          const activeBank = torch === 'left' ? onLeft : onRight;

          let targetX = onLeft ? detail.xLeft : detail.xRight;
          let targetY = detail.y;

          if (isCrossing && selected.includes(p)) {
            const isFirst = selected.indexOf(p) === 0;
            targetX = torch === 'left' ? 62 : 38;
            targetY = isFirst ? 28 : 50;
          }

          return (
            <motion.div
              key={p}
              animate={{ 
                left: `${targetX}%`, 
                top: `${targetY}%`,
                scale: isSel ? 1.12 : 1,
                y: isCrossing && selected.includes(p) ? [0, -3, 0] : 0
              }}
              transition={{ 
                left: { duration: 1.2, ease: 'easeInOut' },
                top: { duration: 1.2, ease: 'easeInOut' },
                y: isCrossing && selected.includes(p) ? { repeat: Infinity, duration: 0.3 } : {}
              }}
              onClick={() => activeBank && !isCrossing && toggleSelect(p)}
              style={{
                position: 'absolute',
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: isSel ? '2px solid #FFD700' : '2.5px solid var(--border)',
                background: detail.color,
                boxShadow: isSel ? '0 0 8px #FFD700' : '0 2px 4px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: activeBank && !isCrossing ? 'pointer' : 'default',
                zIndex: 8,
                color: '#000000',
                userSelect: 'none',
                transform: 'translate(-50%, -50%)'
              }}
            >
              <span style={{ fontSize: '0.74rem', fontWeight: 900 }}>{detail.name}</span>
              <span style={{ fontSize: '0.48rem', fontWeight: 800, marginTop: -4 }}>{detail.speed}</span>
            </motion.div>
          );
        })}
      </div>

      {left.length === 0 && !isCrossing && (
        <div style={{ color: 'var(--green)', fontWeight: 800, textAlign: 'center', fontSize: '0.8rem' }}>
          ALL CROSSED SUCCESSFULLY! {time <= 17 ? '🏆 Optimal Strategy Met!' : 'Try to finish under 17 min!'}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.35rem' }}>
        <button
          className="btn btn-sm btn-cyan"
          style={{ flex: 1 }}
          onClick={handleCross}
          disabled={selected.length === 0 || isCrossing}
        >
          {isCrossing ? 'Crossing...' : 'Cross Bridge ➔'}
        </button>
        <button className="btn btn-sm" onClick={handleReset}>Reset</button>
      </div>
    </div>
  );
}

// 4. Water Jug Solver Stepper
export function WaterJugVisualizer() {
  const [mode, setMode] = useState('play'); // 'play' | 'solution'
  const [j5, setJ5] = useState(0);
  const [j3, setJ3] = useState(0);
  const [step, setStep] = useState(0);
  const [activeAction, setActiveAction] = useState(null); // 'filling5' | 'filling3' | 'emptying5' | 'emptying3' | 'pouring53' | 'pouring35' | null
  const [history, setHistory] = useState([]);

  const steps = [
    { j5: 0, j3: 0, action: 'Start: Both jugs empty.', desc: 'Goal: Measure exactly 4 liters using these jugs.' },
    { j5: 5, j3: 0, action: 'Fill the 5L jug.', desc: 'Fill the 5-liter jug to capacity from the infinite tap.' },
    { j5: 2, j3: 3, action: 'Pour 5L jug into 3L jug.', desc: 'Pour from the 5L jug until the 3L jug is full. This leaves exactly 2 liters in the 5L jug.' },
    { j5: 2, j3: 0, action: 'Empty the 3L jug.', desc: 'Empty the 3-liter jug completely.' },
    { j5: 0, j3: 2, action: 'Pour remaining 2L into 3L jug.', desc: 'Transfer the 2 liters from the 5L jug into the empty 3L jug.' },
    { j5: 5, j3: 2, action: 'Fill the 5L jug again.', desc: 'Fill the 5-liter jug to capacity again.' },
    { j5: 4, j3: 3, action: 'Pour from 5L into 3L to fill it.', desc: 'Pour from the 5L jug into the 3L jug. Since the 3L jug already has 2L, it accepts exactly 1 more liter, leaving exactly 4 liters in the 5L jug. Success!' }
  ];

  const handleActionStart = (actionName, nextJ5, nextJ3) => {
    if (activeAction) return;
    setActiveAction(actionName);
    
    if (mode === 'play') {
      setHistory(prev => [...prev, { j5, j3 }]);
    }

    setTimeout(() => {
      setJ5(nextJ5);
      setJ3(nextJ3);
      setActiveAction(null);
    }, 850);
  };

  const fill5 = () => handleActionStart('filling5', 5, j3);
  const fill3 = () => handleActionStart('filling3', j5, 3);
  const empty5 = () => handleActionStart('emptying5', 0, j3);
  const empty3 = () => handleActionStart('emptying3', j5, 0);

  const pour5to3 = () => {
    const space3 = 3 - j3;
    const amount = Math.min(j5, space3);
    handleActionStart('pouring53', j5 - amount, j3 + amount);
  };

  const pour3to5 = () => {
    const space5 = 5 - j5;
    const amount = Math.min(j3, space5);
    handleActionStart('pouring35', j5 + amount, j3 - amount);
  };

  const handleUndo = () => {
    if (history.length === 0 || activeAction) return;
    const prev = history[history.length - 1];
    setJ5(prev.j5);
    setJ3(prev.j3);
    setHistory(history.slice(0, -1));
  };

  const handleReset = () => {
    setJ5(0);
    setJ3(0);
    setStep(0);
    setHistory([]);
    setActiveAction(null);
  };

  // Solution stepper handler
  const handleSolutionNext = () => {
    if (step >= steps.length - 1 || activeAction) return;
    const nextStep = step + 1;
    const next = steps[nextStep];
    
    let act = 'pouring53';
    if (nextStep === 1) act = 'filling5';
    else if (nextStep === 3) act = 'emptying3';
    else if (nextStep === 5) act = 'filling5';
    else if (nextStep === 4) act = 'pouring53';
    else if (nextStep === 2) act = 'pouring53';

    setActiveAction(act);
    setTimeout(() => {
      setJ5(next.j5);
      setJ3(next.j3);
      setStep(nextStep);
      setActiveAction(null);
    }, 850);
  };

  const handleSolutionPrev = () => {
    if (step <= 0 || activeAction) return;
    const prevStep = step - 1;
    const prev = steps[prevStep];
    setJ5(prev.j5);
    setJ3(prev.j3);
    setStep(prevStep);
  };

  const isWin = (j5 === 4 || j3 === 4) && !activeAction;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {/* Mode Switches */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)' }}>
        <button
          className="btn btn-sm"
          style={{ flex: 1, background: mode === 'play' ? 'var(--cyan)' : 'transparent', border: 'none', borderBottom: mode === 'play' ? '3px solid var(--border)' : 'none', color: '#000000', fontWeight: 700 }}
          onClick={() => { setMode('play'); handleReset(); }}
        >
          Free Play Mode
        </button>
        <button
          className="btn btn-sm"
          style={{ flex: 1, background: mode === 'solution' ? 'var(--purple)' : 'transparent', border: 'none', borderBottom: mode === 'solution' ? '3px solid var(--border)' : 'none', color: mode === 'solution' ? '#ffffff' : 'var(--text)', fontWeight: 700 }}
          onClick={() => { setMode('solution'); handleReset(); }}
        >
          View Solution Steps
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {mode === 'solution' ? (
          <>
            <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>
              Step {step} / {steps.length - 1}
            </div>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button className="btn btn-sm" onClick={handleSolutionPrev} disabled={step === 0 || !!activeAction}>← Back</button>
              <button className="btn btn-sm btn-purple" onClick={handleSolutionNext} disabled={step === steps.length - 1 || !!activeAction}>Next Step →</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>
              Goal: Measure exactly 4 Liters
            </div>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button className="btn btn-sm" onClick={handleUndo} disabled={history.length === 0 || !!activeAction}>Undo</button>
              <button className="btn btn-sm" onClick={handleReset} disabled={!!activeAction}>Reset</button>
            </div>
          </>
        )}
      </div>

      {/* Simulator canvas */}
      <div style={{ 
        border: '3px solid var(--border)', 
        background: 'var(--white)', 
        padding: '1.5rem 1rem', 
        display: 'flex',
        justifyContent: 'center',
        minHeight: 230, 
        position: 'relative',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }}>
        <div style={{ width: 400, height: 200, position: 'relative' }}>
          
          {/* Faucets (Taps) */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
            {/* Left Tap */}
            <path d="M 100 0 L 100 20 L 120 20" fill="none" stroke="#bdc3c7" strokeWidth="6" strokeLinecap="round" />
            <rect x="117" y="16" width="8" height="8" rx="1" fill="#7f8c8d" />

            {/* Right Tap */}
            <path d="M 280 0 L 280 20 L 300 20" fill="none" stroke="#bdc3c7" strokeWidth="6" strokeLinecap="round" />
            <rect x="297" y="16" width="8" height="8" rx="1" fill="#7f8c8d" />

            {/* Filling Stream Left */}
            {activeAction === 'filling5' && (
              <motion.line
                x1="121" y1="24" x2="121" y2="100"
                stroke="#29B6F6"
                strokeWidth="4"
                strokeDasharray="6 4"
                animate={{ strokeDashoffset: [-20, 0] }}
                transition={{ repeat: Infinity, ease: 'linear', duration: 0.5 }}
              />
            )}

            {/* Filling Stream Right */}
            {activeAction === 'filling3' && (
              <motion.line
                x1="301" y1="24" x2="301" y2="120"
                stroke="#29B6F6"
                strokeWidth="4"
                strokeDasharray="6 4"
                animate={{ strokeDashoffset: [-20, 0] }}
                transition={{ repeat: Infinity, ease: 'linear', duration: 0.5 }}
              />
            )}

            {/* Pouring Stream 5 to 3 */}
            {activeAction === 'pouring53' && (
              <motion.path
                d="M 150 90 Q 220 50 290 115"
                fill="none"
                stroke="#29B6F6"
                strokeWidth="4.5"
                strokeDasharray="8 4"
                animate={{ strokeDashoffset: [-30, 0] }}
                transition={{ repeat: Infinity, ease: 'linear', duration: 0.6 }}
              />
            )}

            {/* Pouring Stream 3 to 5 */}
            {activeAction === 'pouring35' && (
              <motion.path
                d="M 270 120 Q 200 80 130 90"
                fill="none"
                stroke="#29B6F6"
                strokeWidth="4.5"
                strokeDasharray="8 4"
                animate={{ strokeDashoffset: [30, 0] }}
                transition={{ repeat: Infinity, ease: 'linear', duration: 0.6 }}
              />
            )}

            {/* Emptying stream 5 */}
            {activeAction === 'emptying5' && (
              <motion.path
                d="M 90 140 Q 60 170 30 200"
                fill="none"
                stroke="#29B6F6"
                strokeWidth="4.5"
                strokeDasharray="6 4"
                animate={{ strokeDashoffset: [-20, 0] }}
                transition={{ repeat: Infinity, ease: 'linear', duration: 0.5 }}
              />
            )}

            {/* Emptying stream 3 */}
            {activeAction === 'emptying3' && (
              <motion.path
                d="M 330 150 Q 360 180 380 210"
                fill="none"
                stroke="#29B6F6"
                strokeWidth="4.5"
                strokeDasharray="6 4"
                animate={{ strokeDashoffset: [-20, 0] }}
                transition={{ repeat: Infinity, ease: 'linear', duration: 0.5 }}
              />
            )}
          </svg>

          {/* 5 Liter Jug Container */}
          <motion.div
            animate={{
              rotate: activeAction === 'pouring53' ? 35 : activeAction === 'emptying5' ? -65 : 0,
              x: activeAction === 'pouring53' ? 25 : activeAction === 'emptying5' ? -15 : 0,
              y: activeAction === 'pouring53' ? -10 : activeAction === 'emptying5' ? 10 : 0
            }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'absolute',
              left: 80,
              bottom: 10,
              width: 82,
              height: 120,
              border: '3.5px solid #94a3b8',
              borderTop: 'none',
              borderRadius: '0 0 12px 12px',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'flex-end',
              overflow: 'hidden',
              transformOrigin: 'bottom right',
              boxShadow: 'inset 2px -2px 0 rgba(255,255,255,0.05)'
            }}
          >
            {/* Water levels inside 5L */}
            <motion.div
              animate={{ height: `${(j5 / 5) * 100}%` }}
              transition={{ duration: 0.6 }}
              style={{
                width: '100%',
                background: 'linear-gradient(180deg, #29B6F6 0%, #0288D1 100%)',
                opacity: 0.85,
                position: 'relative'
              }}
            >
              {/* Top Water line wave */}
              <motion.div
                animate={{ y: [-1, 1, -1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', top: -3, left: 0, right: 0, height: 6, background: '#4aa3df', borderRadius: '50%' }}
              />
            </motion.div>
            {/* Volume label */}
            <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text)', zIndex: 4, background: 'var(--white)', padding: '0.1rem 0.3rem', border: '1.5px solid var(--border)' }}>
              {j5}L / 5L
            </div>
            {/* Markings */}
            <div style={{ position: 'absolute', right: 4, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '0.52rem', color: '#475569', fontFamily: 'var(--font-mono)', padding: '6px 0', pointerEvents: 'none' }}>
              <span>- 5L</span>
              <span>- 4L</span>
              <span>- 3L</span>
              <span>- 2L</span>
              <span>- 1L</span>
            </div>
          </motion.div>
          <div style={{ position: 'absolute', left: 81, bottom: -12, width: 80, textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text)', opacity: 0.85 }}>5L Jug</div>

          {/* 3 Liter Jug Container */}
          <motion.div
            animate={{
              rotate: activeAction === 'pouring35' ? -35 : activeAction === 'emptying3' ? 65 : 0,
              x: activeAction === 'pouring35' ? -25 : activeAction === 'emptying3' ? 15 : 0,
              y: activeAction === 'pouring35' ? -10 : activeAction === 'emptying3' ? 10 : 0
            }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'absolute',
              left: 260,
              bottom: 10,
              width: 72,
              height: 90,
              border: '3.5px solid #94a3b8',
              borderTop: 'none',
              borderRadius: '0 0 10px 10px',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'flex-end',
              overflow: 'hidden',
              transformOrigin: 'bottom left',
              boxShadow: 'inset 2px -2px 0 rgba(255,255,255,0.05)'
            }}
          >
            {/* Water levels inside 3L */}
            <motion.div
              animate={{ height: `${(j3 / 3) * 100}%` }}
              transition={{ duration: 0.6 }}
              style={{
                width: '100%',
                background: 'linear-gradient(180deg, #29B6F6 0%, #0288D1 100%)',
                opacity: 0.85,
                position: 'relative'
              }}
            >
              {/* Top Water line wave */}
              <motion.div
                animate={{ y: [-1, 1, -1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                style={{ position: 'absolute', top: -3, left: 0, right: 0, height: 6, background: '#4aa3df', borderRadius: '50%' }}
              />
            </motion.div>
            {/* Volume label */}
            <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text)', zIndex: 4, background: 'var(--white)', padding: '0.1rem 0.25rem', border: '1.5px solid var(--border)' }}>
              {j3}L / 3L
            </div>
            {/* Markings */}
            <div style={{ position: 'absolute', right: 4, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '0.52rem', color: '#475569', fontFamily: 'var(--font-mono)', padding: '6px 0', pointerEvents: 'none' }}>
              <span>- 3L</span>
              <span>- 2L</span>
              <span>- 1L</span>
            </div>
          </motion.div>
          <div style={{ position: 'absolute', left: 256, bottom: -12, width: 80, textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text)', opacity: 0.85 }}>3L Jug</div>

        </div>
      </div>

      {/* Interactive Controls (For Play Mode) */}
      {mode === 'play' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', border: '2px solid var(--border)', padding: '0.6rem', background: 'var(--bg)' }}>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button className="btn btn-sm btn-cyan" style={{ flex: 1 }} onClick={fill5} disabled={j5 === 5 || !!activeAction}>Fill 5L</button>
            <button className="btn btn-sm btn-pink" style={{ flex: 1 }} onClick={empty5} disabled={j5 === 0 || !!activeAction}>Empty 5L</button>
            <button className="btn btn-sm" style={{ flex: 1.2 }} onClick={pour5to3} disabled={j5 === 0 || j3 === 3 || !!activeAction}>Pour 5L ➔ 3L</button>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button className="btn btn-sm btn-cyan" style={{ flex: 1 }} onClick={fill3} disabled={j3 === 3 || !!activeAction}>Fill 3L</button>
            <button className="btn btn-sm btn-pink" style={{ flex: 1 }} onClick={empty3} disabled={j3 === 0 || !!activeAction}>Empty 3L</button>
            <button className="btn btn-sm" style={{ flex: 1.2 }} onClick={pour3to5} disabled={j3 === 0 || j5 === 5 || !!activeAction}>Pour 3L ➔ 5L</button>
          </div>
        </div>
      )}

      {/* Description output */}
      <div style={{ border: '3px solid var(--border)', background: 'var(--white)', padding: '0.75rem', boxShadow: 'var(--shadow-sm)' }}>
        {mode === 'solution' ? (
          <>
            <h5 style={{ margin: '0 0 0.25rem', fontWeight: 700, color: 'var(--purple)', fontFamily: 'var(--font-main)' }}>{steps[step].action}</h5>
            <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.8, lineHeight: 1.4, fontFamily: 'var(--font-main)' }}>{steps[step].desc}</p>
          </>
        ) : (
          <div>
            {isWin ? (
              <h5 style={{ margin: 0, fontWeight: 800, color: 'var(--green)', fontSize: '0.9rem', textAlign: 'center' }}>
                🎉 Success! You measured exactly 4 liters!
              </h5>
            ) : (
              <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.8, textAlign: 'center', fontStyle: 'italic' }}>
                Interact with the buttons above to transfer water and measure exactly 4 liters.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 5. 100 Prisoners Pointer Loops
function PrisonerPathOverlay({ history, parentRef }) {
  const [paths, setPaths] = useState([]);

  useEffect(() => {
    const updatePaths = () => {
      if (!parentRef.current || history.length < 2) {
        setPaths([]);
        return;
      }
      const parentRect = parentRef.current.getBoundingClientRect();
      const newPaths = [];
      for (let i = 0; i < history.length - 1; i++) {
        const fromEl = document.getElementById(`prisoner-box-${history[i].box}`);
        const toEl = document.getElementById(`prisoner-box-${history[i+1].box}`);
        if (fromEl && toEl) {
          const fromRect = fromEl.getBoundingClientRect();
          const toRect = toEl.getBoundingClientRect();
          newPaths.push({
            fromX: fromRect.left + fromRect.width / 2 - parentRect.left,
            fromY: fromRect.top + fromRect.height / 2 - parentRect.top,
            toX: toRect.left + toRect.width / 2 - parentRect.left,
            toY: toRect.top + toRect.height / 2 - parentRect.top
          });
        }
      }
      setPaths(newPaths);
    };

    updatePaths();
    window.addEventListener('resize', updatePaths);
    const timer = setTimeout(updatePaths, 150);
    return () => {
      window.removeEventListener('resize', updatePaths);
      clearTimeout(timer);
    };
  }, [history, parentRef]);

  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible', zIndex: 10 }}>
      <defs>
        <filter id="laser-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {paths.map((p, i) => {
        const midX = (p.fromX + p.toX) / 2;
        const midY = (p.fromY + p.toY) / 2 - 20;
        const dstr = `M ${p.fromX} ${p.fromY} Q ${midX} ${midY} ${p.toX} ${p.toY}`;
        return (
          <g key={i}>
            {/* Glow backing path */}
            <motion.path
              d={dstr}
              fill="none"
              stroke="var(--purple)"
              strokeWidth="4"
              opacity="0.8"
              filter="url(#laser-glow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
            {/* Pulsing/moving dashed dash path */}
            <motion.path
              d={dstr}
              fill="none"
              stroke="var(--cyan)"
              strokeWidth="2.5"
              strokeDasharray="12 6"
              animate={{ strokeDashoffset: [0, -36] }}
              transition={{ ease: "linear", duration: 1.2, repeat: Infinity }}
            />
            {/* Target indicator */}
            <circle cx={p.toX} cy={p.toY} r="5" fill="var(--cyan)" filter="url(#laser-glow)" />
          </g>
        );
      })}
    </svg>
  );
}

export function PrisonersVisualizer() {
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'simulation'
  
  // --- Manual Mode State ---
  const [manualHistory, setManualHistory] = useState([]);
  const [manualSuccess, setManualSuccess] = useState(false);
  const [manualStatus, setManualStatus] = useState('Select Box 3 to start searching for Prisoner 3.');
  const manualParentRef = useRef(null);
  
  const targetPrisoner = 3;
  const manualBoxes = [
    { num: 0, card: 6 },
    { num: 1, card: 8 },
    { num: 2, card: 1 },
    { num: 3, card: 7 },
    { num: 4, card: 9 },
    { num: 5, card: 3 },
    { num: 6, card: 0 },
    { num: 7, card: 5 },
    { num: 8, card: 2 },
    { num: 9, card: 4 }
  ];

  const handleOpenManualBox = (index) => {
    if (manualSuccess) return;
    if (manualHistory.length >= 5) {
      setManualStatus('Failed! Opened 5 boxes without finding card 3.');
      return;
    }

    const cardVal = manualBoxes[index].card;
    const newHistory = [...manualHistory, { box: index, card: cardVal }];
    setManualHistory(newHistory);

    if (cardVal === targetPrisoner) {
      setManualSuccess(true);
      setManualStatus(`Success! Found card 3 in Box ${index} in ${newHistory.length} attempts!`);
    } else {
      if (newHistory.length >= 5) {
        setManualStatus('Failed! Opened 5 boxes without finding card 3.');
      } else {
        setManualStatus(`Opened Box ${index}. Found card ${cardVal}. Next, you should open Box ${cardVal}.`);
      }
    }
  };

  const handleResetManual = () => {
    setManualHistory([]);
    setManualSuccess(false);
    setManualStatus('Select Box 3 to start searching for Prisoner 3.');
  };

  // --- Simulation Mode State ---
  const [simBoxes, setSimBoxes] = useState([]);
  const [simCycles, setSimCycles] = useState([]);
  const [simLongestCycle, setSimLongestCycle] = useState(0);
  const [simSuccessCount, setSimSuccessCount] = useState(0);
  const [simTotalCount, setSimTotalCount] = useState(0);
  const [simIsRunning, setSimIsRunning] = useState(false);
  const [selectedSimPrisoner, setSelectedSimPrisoner] = useState(null);
  const [hoveredCycleIdx, setHoveredCycleIdx] = useState(null);
  const simParentRef = useRef(null);

  // Helper to generate new cards
  const generateSimCards = () => {
    const arr = Array.from({ length: 100 }, (_, i) => i);
    // Fisher-Yates Shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    
    // Find cycles
    const visited = Array(100).fill(false);
    const cycles = [];
    let longest = 0;
    
    for (let i = 0; i < 100; i++) {
      if (!visited[i]) {
        const cycle = [];
        let curr = i;
        while (!visited[curr]) {
          visited[curr] = true;
          cycle.push(curr);
          curr = arr[curr];
        }
        cycles.push(cycle);
        if (cycle.length > longest) {
          longest = cycle.length;
        }
      }
    }
    
    return { cards: arr, cycles, longest };
  };

  const runSimulation = () => {
    setSimIsRunning(true);
    const { cards, cycles, longest } = generateSimCards();
    
    setSimBoxes(cards);
    setSimCycles(cycles);
    setSimLongestCycle(longest);
    
    let successes = 0;
    for (let p = 0; p < 100; p++) {
      const cycle = cycles.find(c => c.includes(p));
      if (cycle && cycle.length <= 50) {
        successes++;
      }
    }
    
    setSimSuccessCount(successes);
    setSimTotalCount(simTotalCount + 1);
    setSelectedSimPrisoner(null);
    setSimIsRunning(false);
  };

  useEffect(() => {
    if (simBoxes.length === 0) {
      const { cards, cycles, longest } = generateSimCards();
      setSimBoxes(cards);
      setSimCycles(cycles);
      setSimLongestCycle(longest);
      let successes = 0;
      for (let p = 0; p < 100; p++) {
        const cycle = cycles.find(c => c.includes(p));
        if (cycle && cycle.length <= 50) successes++;
      }
      setSimSuccessCount(successes);
    }
  }, [simBoxes.length]);

  const getCycleColor = (boxIdx) => {
    if (simCycles.length === 0) return 'var(--white)';
    const cycleIdx = simCycles.findIndex(c => c.includes(boxIdx));
    if (cycleIdx === -1) return 'var(--white)';
    
    const hue = (cycleIdx * 137.5) % 360;
    return `hsl(${hue}, 80%, 45%)`;
  };

  const getPrisonerPathHistory = () => {
    if (selectedSimPrisoner === null || simBoxes.length === 0) return [];
    const path = [];
    let curr = selectedSimPrisoner;
    for (let step = 0; step < 50; step++) {
      const nextCard = simBoxes[curr];
      path.push({ box: curr, card: nextCard });
      if (nextCard === selectedSimPrisoner) {
        break;
      }
      curr = nextCard;
    }
    return path;
  };

  const simPathHistory = getPrisonerPathHistory();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', background: 'var(--bg-light)', padding: '0 0.5rem' }}>
        <button
          onClick={() => setActiveTab('manual')}
          style={{
            padding: '0.5rem 1rem',
            background: activeTab === 'manual' ? 'var(--white)' : 'transparent',
            border: activeTab === 'manual' ? '2px solid var(--border)' : '2px solid transparent',
            borderBottom: activeTab === 'manual' ? '2px solid var(--white)' : '2px solid transparent',
            marginBottom: -2,
            fontWeight: 800,
            cursor: 'pointer',
            fontSize: '0.8rem',
            color: activeTab === 'manual' ? 'var(--purple)' : 'var(--text-muted)'
          }}
        >
          Manual Play (10 Boxes)
        </button>
        <button
          onClick={() => setActiveTab('simulation')}
          style={{
            padding: '0.5rem 1rem',
            background: activeTab === 'simulation' ? 'var(--white)' : 'transparent',
            border: activeTab === 'simulation' ? '2px solid var(--border)' : '2px solid transparent',
            borderBottom: activeTab === 'simulation' ? '2px solid var(--white)' : '2px solid transparent',
            marginBottom: -2,
            fontWeight: 800,
            cursor: 'pointer',
            fontSize: '0.8rem',
            color: activeTab === 'simulation' ? 'var(--purple)' : 'var(--text-muted)'
          }}
        >
          Auto Simulator (100 Prisoners)
        </button>
      </div>

      {activeTab === 'manual' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text)' }}>
              Prisoner 3 Search Attempts: <span style={{ color: manualHistory.length > 5 ? 'var(--pink)' : 'var(--purple)', fontFamily: 'var(--font-mono)' }}>{manualHistory.length} / 5</span>
            </span>
            <button className="btn btn-sm" onClick={handleResetManual}>Reset</button>
          </div>

          <div style={{ padding: '0.6rem', background: 'var(--bg)', border: '2px solid var(--border)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', borderLeft: '5px solid var(--purple)' }}>
            <strong>Status:</strong> {manualStatus}
          </div>

          <div ref={manualParentRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', position: 'relative', padding: '1rem 0' }}>
            <PrisonerPathOverlay history={manualHistory} parentRef={manualParentRef} />
            
            {manualBoxes.map((box, idx) => {
              const opened = manualHistory.find(h => h.box === idx);
              const isNext = manualHistory.length > 0 && manualHistory[manualHistory.length - 1].card === idx && !manualSuccess;
              const isTarget = opened && box.card === targetPrisoner;
              const disabled = manualSuccess || manualHistory.length >= 5 || (manualHistory.length > 0 && !isNext && !opened);

              const boxBorder = isNext 
                ? '3px solid var(--purple)' 
                : opened 
                  ? '3.5px solid var(--border)' 
                  : '3px solid var(--border)';

              return (
                <motion.div
                  key={idx}
                  id={`prisoner-box-${idx}`}
                  onClick={() => !disabled && handleOpenManualBox(idx)}
                  style={{
                    perspective: 1000,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled && !opened ? 0.45 : 1,
                    transition: 'opacity 0.25s ease'
                  }}
                  whileHover={!disabled && { y: -3, scale: 1.02 }}
                >
                  <motion.div
                    animate={{ rotateY: opened ? 180 : 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                    style={{
                      width: '100%',
                      height: 70,
                      transformStyle: 'preserve-3d',
                      position: 'relative',
                      border: boxBorder,
                      background: isTarget ? 'var(--green)' : opened ? 'var(--cyan)' : isNext ? 'var(--yellow)' : 'var(--white)',
                      boxShadow: isNext ? '0 0 12px var(--purple)' : opened ? 'none' : 'var(--shadow-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 4
                    }}
                  >
                    <div style={{ backfaceVisibility: 'hidden', position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ fontWeight: 900, fontSize: '0.8rem', color: isNext ? 'var(--purple)' : 'var(--text)' }}>Box {idx}</div>
                      <div style={{ fontSize: '0.58rem', opacity: 0.6, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                        {isNext ? '👉 OPEN NEXT' : 'Closed'}
                      </div>
                    </div>
                    
                    <div style={{ backfaceVisibility: 'hidden', position: 'absolute', transform: 'rotateY(180deg)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.62rem', opacity: 0.7, color: '#000000' }}>CARD inside</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--purple)', fontFamily: 'var(--font-mono)' }}>{box.card}</div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          {manualHistory.length > 0 && (
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', alignItems: 'center', background: 'var(--bg-light)', padding: '0.5rem', border: '1.5px dashed var(--border)' }}>
              <strong>Loop Path:</strong>
              {manualHistory.map((h, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ padding: '0.15rem 0.35rem', border: '2px solid var(--border)', background: h.card === targetPrisoner ? 'var(--green)' : 'var(--cyan)', fontWeight: 800 }}>
                    Box {h.box} ➔ Card {h.card}
                  </span>
                  {i < manualHistory.length - 1 && <span style={{ fontWeight: 800 }}>➔</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <button className="btn btn-sm btn-cyan" onClick={runSimulation} disabled={simIsRunning} style={{ marginRight: '0.5rem' }}>
                🎲 Shuffle & Run Simulation
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Trace Prisoner:</span>
              <select
                value={selectedSimPrisoner === null ? '' : selectedSimPrisoner}
                onChange={(e) => setSelectedSimPrisoner(e.target.value === '' ? null : Number(e.target.value))}
                style={{
                  padding: '0.25rem 0.4rem',
                  border: '2px solid var(--border)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  background: 'var(--white)',
                  color: 'var(--text)'
                }}
              >
                <option value="">-- None --</option>
                {Array.from({ length: 100 }, (_, i) => (
                  <option key={i} value={i}>Prisoner {i}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
            <div style={{ border: '2px solid var(--border)', padding: '0.4rem', background: simLongestCycle <= 50 ? 'var(--green)' : 'var(--pink)', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 4 }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', color: '#000000' }}>Simulation Verdict</span>
              <strong style={{ fontSize: '0.92rem', color: '#000000' }}>
                {simLongestCycle <= 50 ? '🎉 SUCCESS' : '💔 FAILED'}
              </strong>
            </div>
            <div style={{ border: '2px solid var(--border)', padding: '0.4rem', background: 'var(--white)', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 4 }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>Longest Loop Cycle</span>
              <strong style={{ fontSize: '1rem', color: simLongestCycle <= 50 ? 'var(--green)' : 'var(--pink)', fontFamily: 'var(--font-mono)' }}>
                {simLongestCycle} boxes
              </strong>
            </div>
            <div style={{ border: '2px solid var(--border)', padding: '0.4rem', background: 'var(--white)', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 4 }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>Prisoners Found Card</span>
              <strong style={{ fontSize: '1rem', color: 'var(--purple)', fontFamily: 'var(--font-mono)' }}>
                {simSuccessCount} / 100
              </strong>
            </div>
            <div style={{ border: '2px solid var(--border)', padding: '0.4rem', background: 'var(--white)', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 4 }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>Distinct Loops</span>
              <strong style={{ fontSize: '1rem', color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                {simCycles.length} loops
              </strong>
            </div>
          </div>

          <div style={{ fontSize: '0.72rem', opacity: 0.8, background: 'var(--bg)', padding: '0.45rem', borderLeft: '4px solid var(--cyan)' }}>
            💡 <strong>Cycle-Following Strategy:</strong> Each prisoner starts at the box with their own number, opens it, and follows the card number to the next box. Since boxes form closed loops (cycles), if the largest loop is 50 or less, <strong>every prisoner</strong> is guaranteed to find their card!
          </div>

          <div ref={simParentRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px', position: 'relative', background: 'var(--white)', padding: '6px', border: '3px solid var(--border)', borderRadius: 6 }}>
            <PrisonerPathOverlay history={simPathHistory} parentRef={simParentRef} />

            {Array.from({ length: 100 }).map((_, idx) => {
              const cardVal = simBoxes[idx];
              const cycleIdx = simCycles.findIndex(c => c.includes(idx));
              const isHoveredCycle = hoveredCycleIdx !== null && cycleIdx === hoveredCycleIdx;
              const isPartOfSelectedPath = simPathHistory.some(p => p.box === idx);
              
              let bg = '#eef2f6';
              let opacity = 0.85;
              let border = '1px solid var(--border)';
              let textColor = 'var(--text)';
              
              if (selectedSimPrisoner !== null) {
                if (idx === selectedSimPrisoner) {
                  bg = 'var(--yellow)';
                  opacity = 1;
                  border = '2px solid var(--purple)';
                  textColor = '#000000';
                } else if (isPartOfSelectedPath) {
                  bg = 'var(--purple)';
                  opacity = 1;
                  border = '1.5px solid var(--cyan)';
                  textColor = '#ffffff';
                } else {
                  opacity = 0.25;
                }
              } else if (simCycles.length > 0) {
                bg = getCycleColor(idx);
                textColor = '#ffffff';
                if (hoveredCycleIdx !== null) {
                  if (isHoveredCycle) {
                    opacity = 1;
                    border = '2px solid var(--purple)';
                  } else {
                    opacity = 0.15;
                  }
                }
              }

              return (
                <div
                  key={idx}
                  id={`prisoner-box-${idx}`}
                  style={{
                    aspectRatio: '1',
                    background: bg,
                    opacity: opacity,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 3,
                    border: border,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  title={`Box ${idx} contains Card ${cardVal} (Loop #${cycleIdx + 1}, length ${simCycles[cycleIdx]?.length || 0})`}
                  onClick={() => setSelectedSimPrisoner(idx)}
                >
                  <span style={{ fontSize: '0.62rem', fontWeight: 900, color: textColor, fontFamily: 'var(--font-mono)' }}>
                    {idx}
                  </span>
                  <span style={{ fontSize: '0.45rem', color: textColor === '#ffffff' ? '#ffffffaa' : '#00000088', fontFamily: 'var(--font-mono)' }}>
                    {cardVal !== undefined ? cardVal : ''}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800 }}>Disjoint Loop Cycles: (Hover to highlight)</span>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {simCycles.map((cycle, cIdx) => (
                <span
                  key={cIdx}
                  onMouseEnter={() => setHoveredCycleIdx(cIdx)}
                  onMouseLeave={() => setHoveredCycleIdx(null)}
                  style={{
                    padding: '0.2rem 0.45rem',
                    border: '1.5px solid var(--border)',
                    background: hoveredCycleIdx === cIdx ? getCycleColor(cycle[0]) : 'var(--white)',
                    color: hoveredCycleIdx === cIdx ? '#ffffff' : 'var(--text)',
                    fontSize: '0.68rem',
                    fontFamily: 'var(--font-mono)',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: 700,
                    transition: 'all 0.15s ease',
                    boxShadow: hoveredCycleIdx === cIdx ? 'none' : 'var(--shadow-xs)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                >
                  Loop #{cIdx + 1} ({cycle.length} boxes)
                  {cycle.length > 50 && <span style={{ color: 'var(--pink)', fontSize: '0.85em' }}>⚠️</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 6. Egg Dropping Floor Stepper
export function EggDropVisualizer() {
  const [eggsLeft, setEggsLeft] = useState(2);
  const [dropsCount, setDropsCount] = useState(0);
  const [log, setLog] = useState('Experiment: find the critical floor (Target is 37) using 2 eggs.');
  const [history, setHistory] = useState([]);
  const [animationState, setAnimationState] = useState('idle');
  const [dropFloor, setDropFloor] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(14);

  const criticalFloor = 37;

  const handleDrop = () => {
    if (eggsLeft <= 0 || animationState === 'dropping') return;
    setDropFloor(selectedFloor);
    setAnimationState('dropping');
    setDropsCount(d => d + 1);

    setTimeout(() => {
      const isBroken = selectedFloor >= criticalFloor;
      if (isBroken) {
        setEggsLeft(e => e - 1);
        setAnimationState('broken');
        setLog(`Egg broke at floor ${selectedFloor}! 💥 Eggs remaining: ${eggsLeft - 1}`);
        setHistory([...history, { floor: selectedFloor, broken: true }]);
      } else {
        setAnimationState('survived');
        setLog(`Egg survived drop at floor ${selectedFloor}! 🥚 Next, test a higher floor.`);
        setHistory([...history, { floor: selectedFloor, broken: false }]);
      }
    }, 1000);
  };

  const handleReset = () => {
    setEggsLeft(2);
    setDropsCount(0);
    setHistory([]);
    setAnimationState('idle');
    setDropFloor(null);
    setLog('Experiment: find the critical floor (Target is 37) using 2 eggs.');
  };

  const getFloorStatus = (f) => {
    const found = history.find(h => h.floor === f);
    if (!found) return 'untested';
    return found.broken ? 'broken' : 'survived';
  };

  const optimalSteps = [14, 27, 39, 50, 60, 69, 77, 84, 90, 95, 99, 100];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>
          Eggs Left: {Array.from({ length: eggsLeft }).map((_, i) => '🥚').join(' ')} ({eggsLeft}/2) | Drops: {dropsCount}
        </span>
        <button className="btn btn-sm" onClick={handleReset}>Reset</button>
      </div>

      <div style={{ padding: '0.4rem 0.6rem', background: 'var(--bg)', border: '2px solid var(--border)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
        <strong>Log:</strong> {log}
      </div>

      <div style={{ border: '3px solid var(--border)', padding: '0.75rem', background: 'var(--white)', minHeight: 200, display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ border: '2.5px solid var(--border)', background: '#bdc3c7', borderRadius: 4, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '6px 0', height: 180, overflow: 'hidden' }}>
          {[100, 80, 60, 40, 20, 1].map((f, i) => (
            <div key={f} style={{ display: 'flex', justifyContent: 'space-around', width: '100%', borderBottom: '1px solid rgba(0,0,0,0.15)', paddingBottom: 2 }}>
              <span style={{ fontSize: '0.55rem', fontWeight: 800, opacity: 0.5 }}>F{f}</span>
              <div style={{ width: 10, height: 10, background: '#f39c12', border: '1px solid var(--border)' }} />
              <div style={{ width: 10, height: 10, background: '#f39c12', border: '1px solid var(--border)' }} />
            </div>
          ))}

          {animationState === 'dropping' && dropFloor !== null && (
            <motion.div
              initial={{ y: 15, opacity: 1 }}
              animate={{ y: 130 }}
              transition={{ duration: 0.9, ease: 'linear' }}
              style={{ position: 'absolute', left: '42%', fontSize: '1.2rem', zIndex: 10 }}
            >
              🥚
            </motion.div>
          )}

          {animationState === 'broken' && dropFloor !== null && (
            <div style={{ position: 'absolute', left: '42%', bottom: 10, fontSize: '1.2rem', zIndex: 10 }}>
              💥🍳
            </div>
          )}

          {animationState === 'survived' && dropFloor !== null && (
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.4 }}
              style={{ position: 'absolute', left: '42%', bottom: 10, fontSize: '1.2rem', zIndex: 10 }}
            >
              🥚
            </motion.div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>Choose Floor:</span>
            <input
              type="number"
              min={1}
              max={100}
              value={selectedFloor}
              onChange={e => setSelectedFloor(Math.max(1, Math.min(100, Number(e.target.value))))}
              style={{ width: 60, border: '2px solid var(--border)', textAlign: 'center', padding: '0.2rem', fontWeight: 800 }}
            />
          </div>

          <button
            className="btn btn-sm btn-cyan"
            onClick={handleDrop}
            disabled={eggsLeft === 0 || animationState === 'dropping'}
          >
            {animationState === 'dropping' ? 'Dropping...' : 'Drop Egg 🥚'}
          </button>

          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.4, marginBottom: 2 }}>Optimal Drop Sequence</div>
            <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap' }}>
              {optimalSteps.map(f => {
                const status = getFloorStatus(f);
                const isSel = selectedFloor === f;
                return (
                  <button
                    key={f}
                    onClick={() => setSelectedFloor(f)}
                    style={{
                      padding: '0.15rem 0.35rem',
                      border: isSel ? '2.5px solid var(--border)' : '1.5px solid var(--border)',
                      background: status === 'broken' ? 'var(--pink)' : status === 'survived' ? 'var(--green)' : 'var(--yellow)',
                      fontWeight: 800,
                      fontSize: '0.65rem',
                      cursor: 'pointer',
                      boxShadow: isSel ? 'none' : '1px 1px 0 var(--border)',
                      transform: isSel ? 'translate(0.5px, 0.5px)' : 'none'
                    }}
                  >
                    F{f}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
          <strong>Tests:</strong>
          {history.map((h, i) => (
            <span key={i} style={{ padding: '0.1rem 0.35rem', border: '1.5px solid var(--border)', background: h.broken ? 'var(--pink)' : 'var(--green)' }}>
              F{h.floor}: {h.broken ? 'Broken 💥' : 'Survived 🥚'}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// 7. Coin Flip Biased simulation
export function CoinFlipVisualizer() {
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState('Click Flip to simulate pairs.');
  const [isFlipping, setIsFlipping] = useState(false);
  const [currentCoins, setCurrentCoins] = useState(['H', 'T']);

  const runFlips = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    setStats('Flipping biased coins...');

    const flipBiased = () => Math.random() < 0.7 ? 'H' : 'T';
    let f1 = flipBiased();
    let f2 = flipBiased();
    while (f1 === f2) {
      f1 = flipBiased();
      f2 = flipBiased();
    }

    setTimeout(() => {
      setCurrentCoins([f1, f2]);
      setIsFlipping(false);
      const finalVal = f1 === 'H' ? 'Heads' : 'Tails';
      setResults([`${f1}${f2} ➔ ${finalVal}`, ...results].slice(0, 5));
      setStats(`Last Pair result: ${f1}${f2}. Map HT to Heads, TH to Tails. Discard matching pairs.`);
    }, 1000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
      <div style={{ padding: '0.4rem 0.6rem', background: 'var(--bg)', border: '2px solid var(--border)', fontSize: '0.75rem' }}>{stats}</div>
      
      {/* 3D Coin Toss area */}
      <div style={{ border: '3px solid var(--border)', padding: '1.25rem', background: 'var(--white)', minHeight: 120, display: 'flex', gap: '2rem', justifyContent: 'center', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
        {[0, 1].map(i => (
          <div key={i} style={{ perspective: 1000 }}>
            <motion.div
              animate={isFlipping ? { rotateY: 720, y: [-20, 20, -20, 0] } : { rotateY: 0 }}
              transition={{ duration: 1.0, ease: 'easeInOut' }}
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                border: '3px solid var(--border)',
                background: 'var(--yellow)',
                boxShadow: '2px 2px 0 var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.2rem',
                color: '#000000',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {isFlipping ? '?' : currentCoins[i]}
            </motion.div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.35rem' }}>
        <button className="btn btn-sm btn-cyan" style={{ flex: 1 }} onClick={runFlips} disabled={isFlipping}>
          {isFlipping ? 'Flipping...' : 'Flip Pair 🪙'}
        </button>
        <button className="btn btn-sm" onClick={() => { setResults([]); setStats('Click Flip to simulate pairs.'); }}>Clear</button>
      </div>

      <div style={{ border: '2.5px solid var(--border)', padding: '0.4rem', background: 'var(--white)', minHeight: 80, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.4 }}>Simulation Log</div>
        {results.length === 0 && <div style={{ fontSize: '0.72rem', fontStyle: 'italic', opacity: 0.5 }}>Flip coin pairs to populate log.</div>}
        {results.map((r, i) => (
          <div key={i} style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{r}</div>
        ))}
      </div>
    </div>
  );
}

// 8. Poisoned Bottle Binary table (Binary Test Tube Rack)
export function PoisonedBottleVisualizer() {
  const [testId, setTestId] = useState(42);

  // Generate bit status (Bit 9 on left, Bit 0 on right)
  const bits = Array.from({ length: 10 }, (_, idx) => {
    const bitIndex = 9 - idx;
    const isActive = ((testId >> bitIndex) & 1) === 1;
    return { bitIndex, isActive };
  });

  const presets = [1, 42, 256, 512, 999];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
      {/* Lookup Controls */}
      <div style={{ border: '3px solid var(--border)', padding: '0.85rem', background: 'var(--white)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: '0.85rem', fontFamily: 'var(--font-main)' }}>
            🧪 Poisoned Bottle Search (Binary Representation)
          </span>
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Bottle #:</span>
            <input
              type="number"
              min={1}
              max={1000}
              value={testId}
              onChange={(e) => setTestId(Math.max(1, Math.min(1000, Number(e.target.value))))}
              style={{ width: 70, border: '2.5px solid var(--border)', textAlign: 'center', padding: '0.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>

        {/* Range Slider for quick scrub */}
        <input
          type="range"
          min={1}
          max={1000}
          value={testId}
          onChange={(e) => setTestId(Number(e.target.value))}
          style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--purple)' }}
        />

        {/* Presets */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase' }}>Interesting Presets:</span>
          {presets.map(p => (
            <button
              key={p}
              onClick={() => setTestId(p)}
              style={{
                padding: '0.15rem 0.45rem',
                border: '1.5px solid var(--border)',
                background: testId === p ? 'var(--cyan)' : 'var(--white)',
                fontSize: '0.7rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: testId === p ? 'none' : '1px 1px 0 var(--border)',
                transform: testId === p ? 'translate(0.5px, 0.5px)' : 'none'
              }}
            >
              Bottle {p}
            </button>
          ))}
        </div>
      </div>

      {/* Test Tube Rack */}
      <div style={{ border: '3px solid var(--border)', padding: '1.25rem 0.85rem', background: '#eef2f5', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: 'var(--shadow-sm)', overflowX: 'auto', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'space-between', minWidth: 320 }}>
          {bits.map(({ bitIndex, isActive }) => (
            <div key={bitIndex} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '0.4rem' }}>
              {/* Bit Exponent label */}
              <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', fontWeight: 800, opacity: 0.6 }}>
                2<sup>{bitIndex}</sup>
              </span>

              {/* Test Tube */}
              <div
                style={{
                  width: 24,
                  height: 90,
                  border: '3.5px solid var(--border)',
                  borderRadius: '0 0 12px 12px',
                  background: 'rgba(255, 255, 255, 0.65)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'flex-end',
                  overflow: 'hidden',
                  boxShadow: 'inset 1.5px 0 0 rgba(255,255,255,0.9)'
                }}
              >
                {/* Liquid fill */}
                <motion.div
                  animate={{
                    height: '75%',
                    backgroundColor: isActive ? '#ff4757' : '#00d2d3'
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    width: '100%',
                    position: 'relative',
                    borderRadius: '0 0 8px 8px'
                  }}
                >
                  {/* Bubbles if active/poisoned */}
                  {isActive && (
                    <>
                      <motion.div
                        animate={{ y: [0, -45], opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 1.2, delay: 0.1 }}
                        style={{ position: 'absolute', left: 4, bottom: 5, width: 3, height: 3, borderRadius: '50%', background: 'white' }}
                      />
                      <motion.div
                        animate={{ y: [0, -50], opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
                        style={{ position: 'absolute', right: 5, bottom: 10, width: 4, height: 4, borderRadius: '50%', background: 'white' }}
                      />
                      <div style={{ position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)', fontSize: '0.75rem', userSelect: 'none' }}>
                        💀
                      </div>
                    </>
                  )}
                  {/* Liquid top sheen */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.4)' }} />
                </motion.div>
              </div>

              {/* Bit value (0 or 1) */}
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: '2px solid var(--border)',
                  background: isActive ? 'var(--pink)' : 'var(--white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {isActive ? '1' : '0'}
              </div>
            </div>
          ))}
        </div>

        {/* Binary interpretation explanation */}
        <div style={{ padding: '0.5rem', background: 'var(--white)', border: '2px solid var(--border)', width: '100%', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', minWidth: 320 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Bottle <strong>{testId}</strong> binary:</span>
            <strong>{testId.toString(2).padStart(10, '0')}</strong>
          </div>
          <div style={{ fontSize: '0.65rem', opacity: 0.65, marginTop: 4, lineHeight: 1.3 }}>
            Tubes lit up (value 1) represent which prisoners drink from this bottle. Prisoner index matches the bit position.
          </div>
        </div>
      </div>
    </div>
  );
}

// 9. Pirate Gold game theory simulation
export function PirateGoldVisualizer() {
  const [stage, setStage] = useState('idle'); // idle, distributing, done
  const [showExplanation, setShowExplanation] = useState(false);

  const proposal = { p5: 98, p4: 0, p3: 1, p2: 0, p1: 1 };
  
  const pirates = [
    { id: 'P5', name: 'P5 (Oldest)', emoji: '🏴‍☠️', coins: proposal.p5, vote: '👍 YES', voteColor: 'var(--green)', voteReason: 'Self-vote' },
    { id: 'P4', name: 'P4', emoji: '🧔', coins: proposal.p4, vote: '👎 NO', voteColor: 'var(--pink)', voteReason: 'Wants P5 dead to propose next' },
    { id: 'P3', name: 'P3', emoji: '🤠', coins: proposal.p3, vote: '👍 YES', voteColor: 'var(--green)', voteReason: '1 coin > 0 coins if P4 proposes' },
    { id: 'P2', name: 'P2', emoji: '🦹', coins: proposal.p2, vote: '👎 NO', voteColor: 'var(--pink)', voteReason: 'Expects 1 coin from P4 if P5 dies' },
    { id: 'P1', name: 'P1 (Youngest)', emoji: '🧙', coins: proposal.p1, vote: '👍 YES', voteColor: 'var(--green)', voteReason: '1 coin > 0 coins if P4 proposes' },
  ];

  const handleSimulate = () => {
    setStage('distributing');
    setTimeout(() => {
      setStage('done');
    }, 1500);
  };

  const handleReset = () => {
    setStage('idle');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
      {/* Simulation Box */}
      <div style={{ border: '3px solid var(--border)', padding: '1rem', background: '#f8f9fa', minHeight: 220, display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        
        {/* Animated Flying Coins */}
        {stage === 'distributing' && (
          <>
            {/* Coins to P3 */}
            <motion.div
              initial={{ x: -100, y: -20, scale: 0.5, opacity: 1 }}
              animate={{ x: 10, y: 10, scale: 1, opacity: 0 }}
              transition={{ duration: 1.0, ease: 'easeOut' }}
              style={{ position: 'absolute', left: '50%', top: '35%', fontSize: '1.5rem', zIndex: 10 }}
            >
              🪙
            </motion.div>
            {/* Coins to P1 */}
            <motion.div
              initial={{ x: -100, y: -20, scale: 0.5, opacity: 1 }}
              animate={{ x: 130, y: 10, scale: 1, opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{ position: 'absolute', left: '50%', top: '35%', fontSize: '1.5rem', zIndex: 10 }}
            >
              🪙
            </motion.div>
            {/* Coins staying with P5 */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 0.6 }}
              style={{ position: 'absolute', left: '12%', top: '35%', fontSize: '1.8rem', zIndex: 10 }}
            >
              🪙
            </motion.div>
          </>
        )}

        {/* Pirates Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', minWidth: 320 }}>
          {pirates.map((pirate, idx) => {
            const isProposer = pirate.id === 'P5';
            const showCoins = stage === 'done' || (stage === 'distributing' && isProposer);
            const isRecipient = pirate.coins > 0;

            return (
              <div
                key={pirate.id}
                style={{
                  border: '2.5px solid var(--border)',
                  background: 'var(--white)',
                  padding: '0.5rem 0.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                  position: 'relative',
                  boxShadow: '1.5px 1.5px 0 var(--border)',
                  minHeight: 140,
                  justifyContent: 'space-between'
                }}
              >
                {/* Pirate avatar */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.4rem' }}>{pirate.emoji}</span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, textAlign: 'center', marginTop: 2 }}>{pirate.name}</span>
                  {isProposer && (
                    <span style={{ fontSize: '0.5rem', background: 'var(--purple)', color: 'white', padding: '0.05rem 0.2rem', border: '1px solid var(--border)', borderRadius: 2, fontWeight: 900, marginTop: 2 }}>
                      PROPOSER
                    </span>
                  )}
                </div>

                {/* Chest/Coins display */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontSize: '1.2rem', opacity: showCoins && isRecipient ? 1 : 0.3 }}>
                    {showCoins && isRecipient ? '💰' : '📦'}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                    {stage === 'done' ? `${pirate.coins} Gold` : stage === 'distributing' && isProposer ? '98 Gold' : '??'}
                  </span>
                </div>

                {/* Vote Indicator */}
                <div style={{ height: 35, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AnimatePresence>
                    {stage === 'done' && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                        style={{
                          background: pirate.voteColor,
                          border: '1.5px solid var(--border)',
                          borderRadius: 3,
                          padding: '0.15rem 0.3rem',
                          fontSize: '0.6rem',
                          fontWeight: 900,
                          textAlign: 'center',
                          boxShadow: '1px 1px 0 var(--border)'
                        }}
                        title={pirate.voteReason}
                      >
                        {pirate.vote}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>

        {/* Voting Result Banner */}
        {stage === 'done' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '0.5rem',
              background: 'var(--green)',
              border: '2.5px solid var(--border)',
              borderRadius: 4,
              fontSize: '0.75rem',
              fontWeight: 800,
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            🎉 Proposal Passes! Votes: 3/5 (60% approval) — P5 Oldest Pirate survives and keeps 98 gold!
          </motion.div>
        )}
      </div>

      {/* Interactive Controls */}
      <div style={{ display: 'flex', gap: '0.35rem' }}>
        <button
          className="btn btn-sm btn-cyan"
          style={{ flex: 1 }}
          onClick={handleSimulate}
          disabled={stage === 'distributing' || stage === 'done'}
        >
          {stage === 'distributing' ? 'Distributing...' : 'Simulate Proposal 🏴‍☠️'}
        </button>
        <button className="btn btn-sm" onClick={handleReset} disabled={stage === 'idle'}>
          Reset
        </button>
        <button
          className="btn btn-sm"
          onClick={() => setShowExplanation(!showExplanation)}
          style={{ background: 'var(--white)' }}
        >
          {showExplanation ? 'Hide Logic' : 'Explain Logic'}
        </button>
      </div>

      {/* Collapsible Game Theory Explanation */}
      {showExplanation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{
            border: '2.5px solid var(--border)',
            padding: '0.75rem',
            background: 'var(--white)',
            fontSize: '0.72rem',
            lineHeight: 1.45,
            fontFamily: 'var(--font-main)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <strong style={{ color: 'var(--purple)' }}>Game Theory Strategy breakdown:</strong>
          <ol style={{ margin: '0.35rem 0 0 1rem', paddingLeft: 0 }}>
            <li>If only P2 and P1 remain: P2 proposes 100 to himself and 0 to P1. P2 gets 50% approval (his own vote) and passes. P1 gets nothing.</li>
            <li>If P3, P2, and P1 remain: P3 knows if he dies, P1 gets nothing. So P3 bribes P1 with 1 coin. P1 votes YES. P3 gets 99, P2 gets 0.</li>
            <li>If P4, P3, P2, and P1 remain: P4 only needs 2 votes (his own + 1 other). He bribes P2 (who gets 0 under P3's proposal) with 1 coin. P2 votes YES. P4 gets 99, P3/P1 get 0.</li>
            <li>If all 5 remain: P5 needs 3 votes. He bribes P3 and P1 (who get 0 under P4's proposal) with 1 coin each. They vote YES. P5 keeps 98 coins!</li>
          </ol>
        </motion.div>
      )}
    </div>
  );
}

// 10. Clock Angle simulator (Analog SVG Clock)
export function ClockAngleVisualizer() {
  const [hour, setHour] = useState(3);
  const [minute, setMinute] = useState(15);

  const hAngle = ((hour % 12) * 30) + (minute * 0.5);
  const mAngle = minute * 6;
  const rawDiff = Math.abs(hAngle - mAngle);
  const angle = Math.min(rawDiff, 360 - rawDiff);

  // Helper to generate the SVG path for the sector between the hands
  const getSectorPath = (cx, cy, r, startDeg, endDeg) => {
    const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
      const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
      return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians)
      };
    };

    let start = startDeg;
    let end = endDeg;
    let diff = Math.abs(start - end);

    if (diff > 180) {
      if (startDeg < endDeg) {
        start = endDeg;
        end = startDeg + 360;
      } else {
        start = startDeg;
        end = endDeg + 360;
      }
    } else {
      if (startDeg > endDeg) {
        start = endDeg;
        end = startDeg;
      }
    }

    const startPt = polarToCartesian(cx, cy, r, start);
    const endPt = polarToCartesian(cx, cy, r, end);
    const largeArcFlag = (end - start) <= 180 ? "0" : "1";

    return [
      "M", cx, cy,
      "L", startPt.x, startPt.y,
      "A", r, r, 0, largeArcFlag, 1, endPt.x, endPt.y,
      "Z"
    ].join(" ");
  };

  const sectorPath = getSectorPath(100, 100, 70, hAngle, mAngle);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%', alignItems: 'center' }}>
      
      {/* Clock Face SVG */}
      <div style={{ border: '3px solid var(--border)', padding: '1rem', background: 'var(--white)', borderRadius: '50%', boxShadow: 'var(--shadow-sm)', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <svg width="200" height="200" viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
          {/* Clock Outer Rim */}
          <circle cx="100" cy="100" r="80" fill="none" stroke="var(--border)" strokeWidth="3" />
          
          {/* Angle Sector Slice */}
          <path d={sectorPath} fill="rgba(102, 217, 239, 0.25)" stroke="var(--cyan)" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Hour Marks */}
          {[12, 3, 6, 9].map((num) => {
            const angleDeg = num * 30;
            const rad = ((angleDeg - 90) * Math.PI) / 180;
            const tx = 100 + 64 * Math.cos(rad);
            const ty = 100 + 64 * Math.sin(rad) + 4; // offset vertical alignment
            return (
              <text key={num} x={tx} y={ty} textAnchor="middle" style={{ fontSize: '0.72rem', fontWeight: 800, fill: 'var(--border)', fontFamily: 'var(--font-mono)' }}>
                {num}
              </text>
            );
          })}

          {/* Hour Hand */}
          <motion.line
            x1="100"
            y1="100"
            x2="100"
            y2="55"
            stroke="var(--purple)"
            strokeWidth="4"
            strokeLinecap="round"
            style={{ transformOrigin: '100px 100px' }}
            animate={{ rotate: hAngle }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          />

          {/* Minute Hand */}
          <motion.line
            x1="100"
            y1="100"
            x2="100"
            y2="40"
            stroke="var(--border)"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ transformOrigin: '100px 100px' }}
            animate={{ rotate: mAngle }}
            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
          />

          {/* Center Pin */}
          <circle cx="100" cy="100" r="5" fill="var(--white)" stroke="var(--border)" strokeWidth="2.5" />
        </svg>
      </div>

      {/* Calculated Angle Box */}
      <div style={{ border: '3px solid var(--border)', padding: '0.6rem 1rem', background: 'var(--white)', textAlign: 'center', fontWeight: 800, width: '100%', boxShadow: 'var(--shadow-sm)', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.62rem', opacity: 0.5, textTransform: 'uppercase' }}>Time</span>
          <span style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>
            {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
          </span>
        </div>
        <div style={{ width: 2, height: 28, background: 'var(--border)' }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.62rem', opacity: 0.5, textTransform: 'uppercase' }}>Angle Difference</span>
          <span style={{ fontSize: '1rem', color: 'var(--purple)', fontFamily: 'var(--font-mono)' }}>{angle.toFixed(1)}°</span>
        </div>
      </div>

      {/* Controls Sliders */}
      <div style={{ border: '3px solid var(--border)', padding: '0.85rem', background: 'var(--white)', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700 }}>
            <span>Hour Hand (1 - 12):</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{hour}</span>
          </div>
          <input
            type="range"
            min={1}
            max={12}
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--purple)', cursor: 'pointer' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700 }}>
            <span>Minute Hand (0 - 59):</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{minute}</span>
          </div>
          <input
            type="range"
            min={0}
            max={59}
            value={minute}
            onChange={(e) => setMinute(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--cyan)', cursor: 'pointer' }}
          />
        </div>
      </div>
    </div>
  );
}

// 11. Train Crossing speed simulator
export function TrainCrossingVisualizer() {
  const [direction, setDirection] = useState('opposite'); // opposite, same
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [showLogic, setShowLogic] = useState(false);

  useEffect(() => {
    if (!running) return;
    const duration = direction === 'opposite' ? 3000 : 6000; // time in ms
    const interval = 30;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setRunning(false);
          return 100;
        }
        return p + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [running, direction]);

  const handleRun = () => {
    setProgress(0);
    setRunning(true);
  };

  const handleReset = () => {
    setProgress(0);
    setRunning(false);
  };

  // Positions based on progress and direction
  // In a 100% width container:
  // Train length: 25% of width
  let posA = 0; // faster train (starts left, moves right)
  let posB = 0; // slower train

  if (direction === 'opposite') {
    // A starts at -25% (left of screen), moves to 100%
    posA = -25 + (progress / 100) * 125;
    // B starts at 100% (right of screen), moves to -25%
    posB = 100 - (progress / 100) * 125;
  } else {
    // same direction
    // A starts at -30% (behind B), moves to 100%
    posA = -35 + (progress / 100) * 135;
    // B starts at 5% (ahead of A), moves to 70% (moves slower)
    posB = 5 + (progress / 100) * 65;
  }

  // Timer label
  const secondsElapsed = (progress / 100) * (direction === 'opposite' ? 10 : 30);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
      {/* Configuration Header */}
      <div style={{ border: '3px solid var(--border)', padding: '0.65rem 0.85rem', background: 'var(--white)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button
            onClick={() => { setDirection('opposite'); handleReset(); }}
            style={{
              padding: '0.3rem 0.6rem',
              border: '2px solid var(--border)',
              background: direction === 'opposite' ? 'var(--cyan)' : 'var(--white)',
              fontWeight: 800,
              fontSize: '0.72rem',
              cursor: 'pointer',
              boxShadow: direction === 'opposite' ? 'none' : '1.5px 1.5px 0 var(--border)',
              transform: direction === 'opposite' ? 'translate(1px, 1px)' : 'none'
            }}
          >
            Opposite Direction (10s)
          </button>
          <button
            onClick={() => { setDirection('same'); handleReset(); }}
            style={{
              padding: '0.3rem 0.6rem',
              border: '2px solid var(--border)',
              background: direction === 'same' ? 'var(--yellow)' : 'var(--white)',
              fontWeight: 800,
              fontSize: '0.72rem',
              cursor: 'pointer',
              boxShadow: direction === 'same' ? 'none' : '1.5px 1.5px 0 var(--border)',
              transform: direction === 'same' ? 'translate(1px, 1px)' : 'none'
            }}
          >
            Same Direction (30s)
          </button>
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
          Time: {secondsElapsed.toFixed(1)}s / {direction === 'opposite' ? '10' : '30'}s
        </div>
      </div>

      {/* Racetrack Visualizer */}
      <div style={{ border: '3px solid var(--border)', padding: '1.25rem 0.75rem', background: '#34495e', minHeight: 160, display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', overflow: 'hidden', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
        
        {/* Track 1 */}
        <div style={{ position: 'relative', height: 28, display: 'flex', alignItems: 'center' }}>
          {/* Railroad Rails */}
          <div style={{ position: 'absolute', left: 0, right: 0, height: 4, background: '#7f8c8d', borderTop: '1px solid #95a5a6', borderBottom: '1px solid #7f8c8d' }} />
          {/* Railroad Ties */}
          <div style={{ position: 'absolute', left: 0, right: 0, height: '100%', display: 'flex', justifyContent: 'space-between', opacity: 0.15 }}>
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} style={{ width: 4, height: '100%', background: '#000' }} />
            ))}
          </div>

          {/* Train A (Faster) */}
          <div
            style={{
              position: 'absolute',
              left: `${posA}%`,
              width: '25%',
              height: 24,
              background: 'var(--cyan)',
              border: '2.5px solid var(--border)',
              boxShadow: '2px 2px 0 var(--border)',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              padding: '0 0.25rem',
              color: '#000',
              fontWeight: 900,
              fontSize: '0.62rem',
              zIndex: 3
            }}
          >
            <span>🚂 Train A (13.3 m/s)</span>
            <div style={{ display: 'flex', gap: 1 }}>
              <div style={{ width: 4, height: 4, background: 'white', border: '1px solid #000' }} />
              <div style={{ width: 4, height: 4, background: 'white', border: '1px solid #000' }} />
            </div>
          </div>
        </div>

        {/* Track 2 */}
        <div style={{ position: 'relative', height: 28, display: 'flex', alignItems: 'center' }}>
          {/* Railroad Rails */}
          <div style={{ position: 'absolute', left: 0, right: 0, height: 4, background: '#7f8c8d', borderTop: '1px solid #95a5a6', borderBottom: '1px solid #7f8c8d' }} />
          {/* Railroad Ties */}
          <div style={{ position: 'absolute', left: 0, right: 0, height: '100%', display: 'flex', justifyContent: 'space-between', opacity: 0.15 }}>
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} style={{ width: 4, height: '100%', background: '#000' }} />
            ))}
          </div>

          {/* Train B (Slower) */}
          <div
            style={{
              position: 'absolute',
              left: `${posB}%`,
              width: '25%',
              height: 24,
              background: 'var(--yellow)',
              border: '2.5px solid var(--border)',
              boxShadow: '2px 2px 0 var(--border)',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              padding: '0 0.25rem',
              color: '#000',
              fontWeight: 900,
              fontSize: '0.62rem',
              zIndex: direction === 'same' ? 2 : 3
            }}
          >
            <span>🚂 Train B (6.6 m/s)</span>
            <div style={{ display: 'flex', gap: 1 }}>
              <div style={{ width: 4, height: 4, background: 'white', border: '1px solid #000' }} />
              <div style={{ width: 4, height: 4, background: 'white', border: '1px solid #000' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Speed results summary */}
      <div style={{ border: '3px solid var(--border)', padding: '0.75rem', background: 'var(--white)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
        <div style={{ border: '2px solid var(--border)', padding: '0.35rem', background: 'var(--cyan)' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.7 }}>Faster Train A</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>13.33 m/s <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>(48 km/h)</span></div>
        </div>
        <div style={{ border: '2px solid var(--border)', padding: '0.35rem', background: 'var(--yellow)' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.7 }}>Slower Train B</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>6.67 m/s <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>(24 km/h)</span></div>
        </div>
      </div>

      {/* Simulator Actions */}
      <div style={{ display: 'flex', gap: '0.35rem' }}>
        <button className="btn btn-sm btn-cyan" style={{ flex: 1 }} onClick={handleRun} disabled={running}>
          {running ? 'Running...' : 'Run Simulation'}
        </button>
        <button className="btn btn-sm" onClick={handleReset}>
          Reset
        </button>
        <button className="btn btn-sm" onClick={() => setShowLogic(!showLogic)} style={{ background: 'var(--white)' }}>
          {showLogic ? 'Hide Math' : 'Explain Math'}
        </button>
      </div>

      {/* Math Explanation */}
      {showLogic && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{
            border: '2.5px solid var(--border)',
            padding: '0.75rem',
            background: 'var(--white)',
            fontSize: '0.72rem',
            lineHeight: 1.45,
            fontFamily: 'var(--font-main)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <strong style={{ color: 'var(--purple)' }}>Relative Speed Calculations:</strong>
          <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontFamily: 'var(--font-mono)' }}>
            <div>Let L be the length of each train (L = 100m). Total distance to cross is L + L = 200m.</div>
            <div>Let v1 be faster speed, v2 be slower speed.</div>
            <div>
              <strong>1. Opposite direction:</strong> Relative speed is v1 + v2.<br />
              &nbsp;&nbsp; v1 + v2 = 200 meters / 10 seconds = 20 m/s
            </div>
            <div>
              <strong>2. Same direction:</strong> Relative speed is v1 - v2.<br />
              &nbsp;&nbsp; v1 - v2 = 200 meters / 30 seconds = 6.67 m/s
            </div>
            <div>
              <strong>3. Solving the equations:</strong><br />
              &nbsp;&nbsp; Adding equations: 2 * v1 = 26.67 m/s =&gt; v1 = 13.33 m/s<br />
              &nbsp;&nbsp; Substituting v1: v2 = 20 - 13.33 = 6.67 m/s
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// 12. River Crossing fox goose beans stepper
export function RiverCrossingVisualizer() {
  const [left, setLeft] = useState(['Farmer', 'Fox', 'Goose', 'Beans']);
  const [right, setRight] = useState([]);
  const [boat, setBoat] = useState('left'); // left, right
  const [cargo, setCargo] = useState(null); // Fox, Goose, Beans, or null
  const [isMoving, setIsMoving] = useState(false);
  const [log, setLog] = useState('Goal: Transfer all items safely to the right bank.');
  const [errorSplash, setErrorSplash] = useState('');

  const handleReset = () => {
    setLeft(['Farmer', 'Fox', 'Goose', 'Beans']);
    setRight([]);
    setBoat('left');
    setCargo(null);
    setIsMoving(false);
    setLog('Simulator reset.');
    setErrorSplash('');
  };

  const selectCargo = (item) => {
    if (isMoving || errorSplash) return;
    if (cargo === item) {
      setCargo(null);
    } else {
      setCargo(item);
    }
  };

  const handleCross = () => {
    if (isMoving || errorSplash) return;
    setIsMoving(true);
    setLog('Crossing the river...');

    // Animate boat crossing
    setTimeout(() => {
      let nextBoat = boat === 'left' ? 'right' : 'left';
      let currentSource = boat === 'left' ? left : right;
      
      // Remove Farmer and cargo from old bank
      let newSource = currentSource.filter(x => x !== 'Farmer' && x !== cargo);
      
      // Check invalid combinations on the departing bank
      if (newSource.includes('Fox') && newSource.includes('Goose')) {
        setErrorSplash('🦊 Fox ate the Goose! 🪿');
        setLog('Invalid move! Fox will eat Goose if Farmer leaves them alone.');
        setIsMoving(false);
        return;
      }
      if (newSource.includes('Goose') && newSource.includes('Beans')) {
        setErrorSplash('🪿 Goose ate the Beans! 🫘');
        setLog('Invalid move! Goose will eat Beans if Farmer leaves them alone.');
        setIsMoving(false);
        return;
      }

      // If valid, update shores
      if (boat === 'left') {
        setLeft(newSource);
        setRight([...right, 'Farmer', cargo].filter(Boolean));
      } else {
        setRight(newSource);
        setLeft([...left, 'Farmer', cargo].filter(Boolean));
      }

      setBoat(nextBoat);
      setCargo(null);
      setIsMoving(false);
      setLog(`Farmer crossed with ${cargo || 'nothing'}.`);
    }, 1500);
  };

  const getEmoji = (item) => {
    if (item === 'Farmer') return '🧑‍🌾';
    if (item === 'Fox') return '🦊';
    if (item === 'Goose') return '🪿';
    if (item === 'Beans') return '🫘';
    return '';
  };

  // Check if item is on the current bank (where the boat is)
  const isOnCurrentBank = (item) => {
    if (boat === 'left') return left.includes(item) && item !== 'Farmer';
    return right.includes(item) && item !== 'Farmer';
  };

  const solved = right.length === 4;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
      {/* Log status */}
      <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg)', border: '2px solid var(--border)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
        <strong>Status:</strong> {log}
      </div>

      {/* River Canvas */}
      <div style={{ border: '3px solid var(--border)', background: '#90e0ef', minHeight: 180, display: 'flex', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        
        {/* Left Bank */}
        <div style={{ width: '28%', background: '#c7f9cc', borderRight: '3px dashed #80ed99', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem 0', zIndex: 3 }}>
          <span style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.5 }}>LEFT BANK</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
            {left.map(item => (
              <motion.div
                key={item}
                layoutId={`item-${item}`}
                style={{
                  padding: '0.25rem 0.45rem',
                  border: '2px solid var(--border)',
                  background: 'var(--white)',
                  borderRadius: 4,
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  boxShadow: '1.5px 1.5px 0 var(--border)',
                  cursor: isOnCurrentBank(item) && !isMoving ? 'pointer' : 'default',
                  border: cargo === item ? '2px solid var(--purple)' : '2px solid var(--border)'
                }}
                onClick={() => isOnCurrentBank(item) && selectCargo(item)}
              >
                {getEmoji(item)} {item}
              </motion.div>
            ))}
          </div>
        </div>

        {/* River (Middle area) */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          
          {/* Animated Water Waves */}
          <div style={{ position: 'absolute', top: '25%', left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.25)', borderTop: '2px dashed rgba(255,255,255,0.4)' }} />
          <div style={{ position: 'absolute', top: '75%', left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.25)', borderTop: '2px dashed rgba(255,255,255,0.4)' }} />

          {/* Boat Container */}
          <motion.div
            animate={{
              left: boat === 'left' 
                ? (isMoving ? '50%' : '5%') 
                : (isMoving ? '5%' : '50%')
            }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              width: '45%',
              height: 48,
              background: '#d9a05b',
              border: '2.5px solid var(--border)',
              borderRadius: '0 0 16px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              padding: '0 0.5rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              zIndex: 4
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🛶</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {/* Farmer always in boat when moving */}
              {(isMoving || boat === 'left' ? left.includes('Farmer') : right.includes('Farmer')) && (
                <span style={{ fontSize: '1rem' }} title="Farmer">🧑‍🌾</span>
              )}
              {/* Cargo in boat */}
              {cargo && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{ fontSize: '1rem' }}
                  title={cargo}
                >
                  {getEmoji(cargo)}
                </motion.span>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Bank */}
        <div style={{ width: '28%', background: '#c7f9cc', borderLeft: '3px dashed #80ed99', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem 0', zIndex: 3 }}>
          <span style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.5 }}>RIGHT BANK</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
            {right.map(item => (
              <motion.div
                key={item}
                layoutId={`item-${item}`}
                style={{
                  padding: '0.25rem 0.45rem',
                  border: '2px solid var(--border)',
                  background: 'var(--white)',
                  borderRadius: 4,
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  boxShadow: '1.5px 1.5px 0 var(--border)',
                  cursor: isOnCurrentBank(item) && !isMoving ? 'pointer' : 'default',
                  border: cargo === item ? '2px solid var(--purple)' : '2px solid var(--border)'
                }}
                onClick={() => isOnCurrentBank(item) && selectCargo(item)}
              >
                {getEmoji(item)} {item}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Fail Error Splash Overlay */}
        {errorSplash && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(255, 71, 87, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              zIndex: 10
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem' }}>{errorSplash}</h3>
            <button className="btn btn-sm btn-white" onClick={handleReset} style={{ border: '2.5px solid var(--border)' }}>
              Try Again 🔄
            </button>
          </motion.div>
        )}

        {/* Solved Success Overlay */}
        {solved && !isMoving && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(46, 213, 115, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              zIndex: 10
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem', fontWeight: 900 }}>🏆 Puzzle Solved Safely!</h3>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.85rem' }}>All items crossed river without any incidents!</span>
            <button className="btn btn-sm" onClick={handleReset}>
              Play Again 🔄
            </button>
          </motion.div>
        )}
      </div>

      {/* Simulator Actions */}
      <div style={{ display: 'flex', gap: '0.35rem' }}>
        <button
          className="btn btn-sm btn-cyan"
          style={{ flex: 1 }}
          onClick={handleCross}
          disabled={isMoving || errorSplash || solved}
        >
          {isMoving ? 'Crossing...' : 'Cross River 🛶'}
        </button>
        <button className="btn btn-sm" onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}

// 13. Probability Dice roll (Interactive Dice & Distribution Chart)
export function DiceVisualizer() {
  const [die1, setDie1] = useState(1);
  const [die2, setDie2] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [rollHistory, setRollHistory] = useState([]);
  
  // Track counts of sums from 2 to 12
  const [sumCounts, setSumCounts] = useState(
    Array.from({ length: 11 }, (_, i) => ({ sum: i + 2, count: 0 }))
  );

  const rollDiceValues = () => {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    return { d1, d2 };
  };

  const handleRoll = () => {
    if (isRolling) return;
    setIsRolling(true);

    // Roll animation
    setTimeout(() => {
      const { d1, d2 } = rollDiceValues();
      setDie1(d1);
      setDie2(d2);
      const sum = d1 + d2;

      setRollHistory(h => [`${d1} + ${d2} = ${sum}`, ...h].slice(0, 5));
      setSumCounts(counts => 
        counts.map(c => c.sum === sum ? { ...c, count: c.count + 1 } : c)
      );
      setIsRolling(false);
    }, 800);
  };

  const handleRoll100x = () => {
    if (isRolling) return;
    setIsRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      const { d1, d2 } = rollDiceValues();
      setDie1(d1);
      setDie2(d2);
      const sum = d1 + d2;
      setSumCounts(counts => 
        counts.map(c => c.sum === sum ? { ...c, count: c.count + 1 } : c)
      );
      count++;
      if (count >= 50) {
        clearInterval(interval);
        setRollHistory(h => [`Finished 50 quick rolls!`, ...h].slice(0, 5));
        setIsRolling(false);
      }
    }, 40);
  };

  const handleReset = () => {
    setDie1(1);
    setDie2(1);
    setRollHistory([]);
    setSumCounts(Array.from({ length: 11 }, (_, i) => ({ sum: i + 2, count: 0 })));
  };

  const renderDieDots = (val) => {
    const dotCoords = {
      1: [[50, 50]],
      2: [[25, 25], [75, 75]],
      3: [[25, 25], [50, 50], [75, 75]],
      4: [[25, 25], [25, 75], [75, 25], [75, 75]],
      5: [[25, 25], [25, 75], [50, 50], [75, 25], [75, 75]],
      6: [[25, 25], [25, 50], [25, 75], [75, 25], [75, 50], [75, 75]],
    };
    return (
      <svg width="50" height="50" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
        {dotCoords[val].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="9" fill="var(--border)" />
        ))}
      </svg>
    );
  };

  const totalRolls = sumCounts.reduce((acc, c) => acc + c.count, 0);
  const maxCount = Math.max(...sumCounts.map(c => c.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
      
      {/* Dice Board */}
      <div style={{ border: '3px solid var(--border)', padding: '1.25rem', background: '#ecf0f1', minHeight: 110, display: 'flex', gap: '2rem', justifyContent: 'center', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
        {[die1, die2].map((dieVal, idx) => (
          <motion.div
            key={idx}
            animate={isRolling ? {
              rotate: [0, 360, -360, 0],
              x: [0, -12, 12, -6, 6, 0],
              y: [0, -15, 10, -5, 0]
            } : { rotate: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            style={{
              width: 65,
              height: 65,
              borderRadius: 8,
              border: '3.5px solid var(--border)',
              background: 'var(--white)',
              boxShadow: '3px 3px 0 var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            onClick={handleRoll}
          >
            {renderDieDots(dieVal)}
          </motion.div>
        ))}
      </div>

      {/* Control Actions */}
      <div style={{ display: 'flex', gap: '0.35rem' }}>
        <button className="btn btn-sm btn-cyan" style={{ flex: 1 }} onClick={handleRoll} disabled={isRolling}>
          {isRolling ? 'Rolling...' : 'Roll Dice 🎲'}
        </button>
        <button className="btn btn-sm btn-pink" onClick={handleRoll100x} disabled={isRolling}>
          Roll 50x ⚡
        </button>
        <button className="btn btn-sm" onClick={handleReset}>
          Reset
        </button>
      </div>

      {/* Distribution Chart */}
      <div style={{ border: '3px solid var(--border)', padding: '0.85rem', background: 'var(--white)', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', fontWeight: 800 }}>
          <span>📊 Probability Sum Distribution:</span>
          <span>Total Rolls: {totalRolls}</span>
        </div>

        {/* Vertical bars */}
        <div style={{ display: 'flex', alignItems: 'flex-end', height: 80, borderBottom: '2.5px solid var(--border)', paddingTop: '10px', gap: '2px' }}>
          {sumCounts.map((item) => {
            const pct = (item.count / maxCount) * 100;
            const probabilityPct = totalRolls > 0 ? ((item.count / totalRolls) * 100).toFixed(1) : 0;
            return (
              <div key={item.sum} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', position: 'relative', height: `${pct}%`, display: 'flex', justifyContent: 'center' }}>
                  <motion.div
                    animate={{ height: '100%' }}
                    style={{
                      width: '80%',
                      background: item.sum === 7 ? 'var(--pink)' : 'var(--cyan)',
                      border: '1.5px solid var(--border)',
                      borderBottom: 'none',
                      boxShadow: '1px 1px 0 rgba(0,0,0,0.05)'
                    }}
                    title={`Sum ${item.sum}: ${item.count} rolls (${probabilityPct}%)`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Labels row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
          {sumCounts.map(item => (
            <div key={item.sum} style={{ flex: 1, textAlign: 'center' }}>
              {item.sum}
            </div>
          ))}
        </div>

        {/* Roll Log */}
        {rollHistory.length > 0 && (
          <div style={{ borderTop: '1px solid #eee', paddingTop: '0.4rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>
            <strong>Logs:</strong> {rollHistory.join(' | ')}
          </div>
        )}
      </div>
    </div>
  );
}

// 14. Monty Hall game (3D Swinging Doors Simulator)
export function MontyHallVisualizer() {
  const [stage, setStage] = useState(1); // 1: choose, 2: switch/stay, 3: reveal
  const [chosen, setChosen] = useState(null); // 1, 2, 3
  const [revealed, setRevealed] = useState(null); // host revealed goat door
  const [carDoor, setCarDoor] = useState(null);
  const [finalChoice, setFinalChoice] = useState(null);
  const [log, setLog] = useState('Pick a door to start the game.');

  const handleSelect = (doorIdx) => {
    // Determine random car location
    const car = Math.floor(Math.random() * 3) + 1;
    setCarDoor(car);
    setChosen(doorIdx);

    // Host reveals a goat door that wasn't chosen and isn't the car
    const reveal = [1, 2, 3].find(d => d !== doorIdx && d !== car);
    setRevealed(reveal);
    setStage(2);
    setLog(`You picked Door ${doorIdx}. The host opens Door ${reveal} to reveal a GOAT. Switch or Stay?`);
  };

  const handleVerdict = (action) => {
    let finalSel = chosen;
    if (action === 'switch') {
      finalSel = [1, 2, 3].find(d => d !== chosen && d !== revealed);
    }
    setFinalChoice(finalSel);
    setStage(3);
    const win = finalSel === carDoor;
    setLog(`You chose Door ${finalSel}. The car was behind Door ${carDoor}. You ${win ? 'WON THE CAR! 🏎️' : 'got a goat 🐐.'}`);
  };

  const handleReset = () => {
    setStage(1);
    setChosen(null);
    setRevealed(null);
    setCarDoor(null);
    setFinalChoice(null);
    setLog('Pick a door to start the game.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
      {/* Log */}
      <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg)', border: '2px solid var(--border)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
        <strong>Host:</strong> {log}
      </div>

      {/* 3D Doors Area */}
      <div style={{ border: '3px solid var(--border)', padding: '1.25rem 0.75rem', background: '#34495e', minHeight: 180, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', position: 'relative', boxShadow: 'var(--shadow-sm)' }}>
        {[1, 2, 3].map(d => {
          const isChosen = chosen === d;
          const isHostOpened = revealed === d;
          
          // Whether this door panel is physically open
          const isOpen = isHostOpened || (stage === 3);
          
          // What lies behind the door
          const isCar = carDoor === d;
          const prizeEmoji = isCar ? '🏎️' : '🐐';

          return (
            <div
              key={d}
              style={{
                perspective: 1000,
                height: 120,
                position: 'relative',
                cursor: stage === 1 ? 'pointer' : 'default',
                opacity: (stage === 2 && isHostOpened) ? 0.8 : 1
              }}
              onClick={() => stage === 1 && handleSelect(d)}
            >
              {/* Backing Area (The prize) */}
              <div
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: '#1a252f',
                  border: '2.5px solid var(--border)',
                  borderRadius: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4
                }}
              >
                <span style={{ fontSize: '2rem' }}>{prizeEmoji}</span>
                <span style={{ fontSize: '0.6rem', color: '#fff', fontWeight: 800 }}>
                  {isCar ? 'SPORTS CAR' : 'GOAT'}
                </span>
              </div>

              {/* Front Swinging Door Panel */}
              <motion.div
                animate={{
                  rotateY: isOpen ? -110 : 0
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: isChosen ? 'var(--cyan)' : 'var(--white)',
                  border: '3.5px solid var(--border)',
                  borderRadius: 4,
                  transformOrigin: 'left center',
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  zIndex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isOpen ? 'none' : '2px 2px 0 var(--border)'
                }}
              >
                <span style={{ fontSize: '1.2rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>Door {d}</span>
                
                {/* Door Handle */}
                <div
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'gold',
                    border: '1.5px solid var(--border)'
                  }}
                />

                {/* Selection Label */}
                {isChosen && (
                  <div style={{ position: 'absolute', bottom: 4, fontSize: '0.55rem', background: 'var(--purple)', color: '#fff', padding: '0.05rem 0.25rem', border: '1px solid var(--border)', fontWeight: 900 }}>
                    {stage === 3 && finalChoice === d ? 'FINAL' : 'CHOSEN'}
                  </div>
                )}
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Interactive options */}
      <div style={{ display: 'flex', gap: '0.35rem' }}>
        {stage === 2 && (
          <>
            <button className="btn btn-sm btn-cyan" style={{ flex: 1 }} onClick={() => handleVerdict('switch')}>
              Switch Door 🔄
            </button>
            <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => handleVerdict('stay')}>
              Stay 🎯
            </button>
          </>
        )}
        {stage === 3 && (
          <button className="btn btn-sm btn-cyan" style={{ flex: 1 }} onClick={handleReset}>
            Play Again 🔄
          </button>
        )}
      </div>

      {/* Educational Factbox */}
      <div style={{ padding: '0.6rem 0.85rem', background: 'var(--white)', border: '2px dashed var(--border)', fontSize: '0.72rem', lineHeight: 1.4, fontFamily: 'var(--font-main)' }}>
        <strong>Why Switch?</strong> Switching gives you a <strong style={{ color: 'var(--pink)' }}>2/3 (66.7%)</strong> chance of winning, while staying keeps your initial <strong style={{ color: 'var(--purple)' }}>1/3 (33.3%)</strong> chance. The host's knowledge forces the remaining probability onto the unchosen door!
      </div>
    </div>
  );
}

// 15. Logical Deduction boxes check (Interactive Logical Deduction Chests)
export function LogicalDeductionVisualizer() {
  const [hypothesis, setHypothesis] = useState(null); // 'box1', 'box2', 'box3' or null
  const [solved, setSolved] = useState(false);

  const boxes = [
    {
      id: 'box1',
      label: 'Box 1',
      statement: '"Gold is in this box"',
      getTruth: (hyp) => hyp === 'box1'
    },
    {
      id: 'box2',
      label: 'Box 2',
      statement: '"Gold is not in this box"',
      getTruth: (hyp) => hyp !== 'box2'
    },
    {
      id: 'box3',
      label: 'Box 3',
      statement: '"Gold is not in Box 1"',
      getTruth: (hyp) => hyp !== 'box1'
    }
  ];

  // Calculate truth count under current hypothesis
  const getTrueStatementsCount = (hyp) => {
    if (!hyp) return 0;
    return boxes.reduce((acc, box) => acc + (box.getTruth(hyp) ? 1 : 0), 0);
  };

  const handleSelectHypothesis = (id) => {
    setHypothesis(id);
    if (id === 'box2') {
      setSolved(true);
    } else {
      setSolved(false);
    }
  };

  const handleReset = () => {
    setHypothesis(null);
    setSolved(false);
  };

  const trueCount = getTrueStatementsCount(hypothesis);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
      {/* status/rule banner */}
      <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg)', border: '2px solid var(--border)', fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}>
        <strong>Rule:</strong> Only one statement is <strong>TRUE</strong>. Choose where the gold is.
      </div>

      {/* Chests Area */}
      <div style={{ border: '3px solid var(--border)', padding: '1rem', background: '#f5f6fa', minHeight: 180, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', boxShadow: 'var(--shadow-sm)' }}>
        {boxes.map((box) => {
          const isSelected = hypothesis === box.id;
          const isTruth = hypothesis ? box.getTruth(hypothesis) : null;
          
          // Chest states
          let chestEmoji = '🔒📦';
          if (solved && box.id === 'box2') {
            chestEmoji = '🔓✨🪙';
          } else if (isSelected) {
            chestEmoji = '📦❓';
          }

          return (
            <div
              key={box.id}
              onClick={() => handleSelectHypothesis(box.id)}
              style={{
                border: '2.5px solid var(--border)',
                background: isSelected ? 'var(--cyan)' : 'var(--white)',
                padding: '0.6rem 0.35rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.4rem',
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: isSelected ? 'none' : '2px 2px 0 var(--border)',
                transform: isSelected ? 'translate(1.5px, 1.5px)' : 'none',
                minHeight: 140,
                transition: 'all 0.1s ease'
              }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 900 }}>{box.label}</span>
              
              <div style={{ fontSize: '1.8rem', margin: '0.25rem 0' }}>{chestEmoji}</div>
              
              <span style={{ fontSize: '0.62rem', fontStyle: 'italic', opacity: 0.85, height: 26, display: 'flex', alignItems: 'center' }}>
                {box.statement}
              </span>

              {/* Truth badge */}
              {hypothesis && (
                <div
                  style={{
                    fontSize: '0.58rem',
                    fontWeight: 900,
                    padding: '0.1rem 0.35rem',
                    border: '1.5px solid var(--border)',
                    background: isTruth ? 'var(--green)' : 'var(--pink)',
                    borderRadius: 2
                  }}
                >
                  {isTruth ? 'TRUE' : 'FALSE'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Evaluation Result Banner */}
      {hypothesis && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '0.6rem',
            border: '2.5px solid var(--border)',
            background: solved ? 'var(--green)' : 'var(--pink)',
            fontSize: '0.72rem',
            fontWeight: 800,
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {solved ? (
            <span>🏆 Correct! Under Box 2 hypothesis, only Box 3 is TRUE (1 true statement total).</span>
          ) : (
            <span>
              ❌ Incorrect. If gold is in {hypothesis === 'box1' ? 'Box 1' : 'Box 3'}, there are {trueCount} TRUE statements, violating the rule.
            </span>
          )}
        </motion.div>
      )}

      {hypothesis && (
        <button className="btn btn-sm" onClick={handleReset}>
          Reset Hypothesis
        </button>
      )}
    </div>
  );
}

// 16. HashMap vs ConcurrentHashMap visualizer
export function HashMapConcurrentVisualizer() {
  const [mode, setMode] = useState('hashmap'); // hashmap, concurrenthashmap
  const [targetMode, setTargetMode] = useState('different'); // different, same
  const [status, setStatus] = useState('idle'); // idle, animating, done
  const [log, setLog] = useState('Configure target buckets and click Simulate.');

  const [thread1Pos, setThread1Pos] = useState({ left: 0, top: 15 });
  const [thread2Pos, setThread2Pos] = useState({ left: 0, top: 105 });
  const [bucketLocks, setBucketLocks] = useState([false, false, false, false]);
  const [bucketStates, setBucketStates] = useState(['normal', 'normal', 'normal', 'normal']); // normal, writing, success, collision

  const handleReset = () => {
    setStatus('idle');
    setThread1Pos({ left: 0, top: 15 });
    setThread2Pos({ left: 0, top: 105 });
    setBucketLocks([false, false, false, false]);
    setBucketStates(['normal', 'normal', 'normal', 'normal']);
    setLog('Configure target buckets and click Simulate.');
  };

  const handleSimulate = () => {
    if (status === 'animating') return;
    setStatus('animating');
    setBucketStates(['normal', 'normal', 'normal', 'normal']);
    setBucketLocks([false, false, false, false]);

    if (mode === 'hashmap') {
      setLog('HashMap: Both threads sending writes to Bucket 1 simultaneously...');
      setThread1Pos({ left: 170, top: 50 });
      setThread2Pos({ left: 170, top: 60 });

      setTimeout(() => {
        setBucketStates(['normal', 'collision', 'normal', 'normal']);
        setLog('💥 Collision! Simultaneous write without synchronization corrupted bucket node pointers.');
        setStatus('done');
      }, 1500);

    } else if (mode === 'concurrenthashmap' && targetMode === 'different') {
      setLog('ConcurrentHashMap: Thread 1 targets Bucket 1, Thread 2 targets Bucket 3...');
      setThread1Pos({ left: 170, top: 55 });
      setThread2Pos({ left: 170, top: 135 });

      setTimeout(() => {
        setBucketLocks([false, true, false, true]);
        setBucketStates(['normal', 'writing', 'normal', 'writing']);
      }, 600);

      setTimeout(() => {
        setBucketLocks([false, false, false, false]);
        setBucketStates(['normal', 'success', 'normal', 'success']);
        setLog('✅ Success! Threads locked individual buckets and wrote concurrently without conflicts.');
        setStatus('done');
      }, 1800);

    } else if (mode === 'concurrenthashmap' && targetMode === 'same') {
      setLog('ConcurrentHashMap: Both threads targeting Bucket 1. Thread 1 arrives first...');
      setThread1Pos({ left: 170, top: 55 });
      setThread2Pos({ left: 80, top: 90 });

      setTimeout(() => {
        setBucketLocks([false, true, false, false]); // lock bucket 1
        setBucketStates(['normal', 'writing', 'normal', 'normal']);
        setLog('⏳ Thread 1 locks Bucket 1. Thread 2 is BLOCKED and waiting for lock...');
      }, 600);

      setTimeout(() => {
        setBucketLocks([false, false, false, false]);
        setBucketStates(['normal', 'success', 'normal', 'normal']);
        setThread2Pos({ left: 170, top: 60 });
        setLog('🔄 Thread 1 released lock. Thread 2 now locks Bucket 1 to perform its write.');
        setBucketLocks([false, true, false, false]);
        setBucketStates(['normal', 'writing', 'normal', 'normal']);
      }, 1800);

      setTimeout(() => {
        setBucketLocks([false, false, false, false]);
        setBucketStates(['normal', 'success', 'normal', 'normal']);
        setLog('✅ Success! Segment locking synchronized access to Bucket 1 safely.');
        setStatus('done');
      }, 3000);
    }
  };

  const getBucketColor = (state, isLocked) => {
    if (state === 'collision') return 'var(--pink)';
    if (state === 'success') return 'var(--green)';
    if (state === 'writing') return 'var(--yellow)';
    if (isLocked) return '#f39c12';
    return 'var(--white)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
      {/* Configuration */}
      <div style={{ border: '3px solid var(--border)', padding: '0.75rem', background: 'var(--white)', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setMode('hashmap'); handleReset(); }}
            style={{
              flex: 1, padding: '0.35rem', border: '2px solid var(--border)',
              background: mode === 'hashmap' ? 'var(--cyan)' : 'var(--white)',
              fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer',
              boxShadow: mode === 'hashmap' ? 'none' : '1.5px 1.5px 0 var(--border)',
              transform: mode === 'hashmap' ? 'translate(1px, 1px)' : 'none'
            }}
          >
            HashMap (Unsafe)
          </button>
          <button
            onClick={() => { setMode('concurrenthashmap'); handleReset(); }}
            style={{
              flex: 1, padding: '0.35rem', border: '2px solid var(--border)',
              background: mode === 'concurrenthashmap' ? 'var(--purple)' : 'var(--white)',
              fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer',
              boxShadow: mode === 'concurrenthashmap' ? 'none' : '1.5px 1.5px 0 var(--border)',
              transform: mode === 'concurrenthashmap' ? 'translate(1px, 1px)' : 'none'
            }}
          >
            ConcurrentHashMap (Safe)
          </button>
        </div>

        {mode === 'concurrenthashmap' && (
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, opacity: 0.6 }}>TARGET BUCKETS:</span>
            <button
              onClick={() => { setTargetMode('different'); handleReset(); }}
              style={{
                padding: '0.2rem 0.5rem', border: '1.5px solid var(--border)',
                background: targetMode === 'different' ? 'var(--yellow)' : 'var(--white)',
                fontWeight: 800, fontSize: '0.68rem', cursor: 'pointer'
              }}
            >
              Different (Parallel)
            </button>
            <button
              onClick={() => { setTargetMode('same'); handleReset(); }}
              style={{
                padding: '0.2rem 0.5rem', border: '1.5px solid var(--border)',
                background: targetMode === 'same' ? 'var(--pink)' : 'var(--white)',
                fontWeight: 800, fontSize: '0.68rem', cursor: 'pointer'
              }}
            >
              Same (Blocking Lock)
            </button>
          </div>
        )}
      </div>

      {/* Simulator Log */}
      <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg)', border: '2px solid var(--border)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
        <strong>Log:</strong> {log}
      </div>

      {/* Animation Area */}
      <div style={{ border: '3px solid var(--border)', padding: '1rem', background: '#eef2f5', minHeight: 210, display: 'flex', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Threads Column */}
        <div style={{ width: 100, height: 180, position: 'relative', zIndex: 3 }}>
          <motion.div
            animate={thread1Pos}
            transition={{ type: 'spring', stiffness: 80, damping: 14 }}
            style={{
              position: 'absolute', width: '100%',
              padding: '0.4rem', border: '2px solid var(--border)', background: 'var(--cyan)',
              boxShadow: '1.5px 1.5px 0 var(--border)', fontSize: '0.62rem', fontWeight: 900,
              display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 4
            }}
          >
            <span>Thread 1</span>
            <span>Write Node A</span>
          </motion.div>

          <motion.div
            animate={thread2Pos}
            transition={{ type: 'spring', stiffness: 80, damping: 14 }}
            style={{
              position: 'absolute', width: '100%',
              padding: '0.4rem', border: '2px solid var(--border)', background: 'var(--pink)',
              boxShadow: '1.5px 1.5px 0 var(--border)', fontSize: '0.62rem', fontWeight: 900,
              display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 4
            }}
          >
            <span>Thread 2</span>
            <span>Write Node B</span>
          </motion.div>
        </div>

        {/* Buckets Array Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: 180, zIndex: 2 }}>
          {[0, 1, 2, 3].map((i) => {
            const isLocked = bucketLocks[i];
            const state = bucketStates[i];
            const color = getBucketColor(state, isLocked);

            return (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  border: '2.5px solid var(--border)', padding: '0.35rem 0.5rem',
                  background: color, borderRadius: 4, transition: 'background 0.3s ease',
                  boxShadow: '1.5px 1.5px 0 var(--border)'
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 800 }}>[{i}]</span>
                <span style={{ fontSize: '0.85rem' }}>{isLocked ? '🔒' : '🔓'}</span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
                  {state === 'collision' ? (
                    <span style={{ fontSize: '0.6rem', color: '#fff', background: 'red', padding: '1px 3px', fontWeight: 900 }}>💥 CORRUPT</span>
                  ) : state === 'success' ? (
                    <span style={{ fontSize: '0.62rem', fontWeight: 800 }}>Node A ➔ Node B</span>
                  ) : (
                    <span style={{ fontSize: '0.62rem', opacity: 0.5 }}>Empty bucket</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulator Actions */}
      <div style={{ display: 'flex', gap: '0.35rem' }}>
        <button
          className="btn btn-sm btn-cyan"
          style={{ flex: 1 }}
          onClick={handleSimulate}
          disabled={status === 'animating'}
        >
          {status === 'animating' ? 'Simulating...' : 'Simulate Writes ⚡'}
        </button>
        <button className="btn btn-sm" onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}


/* =========================================================================
   8. VISUALIZER WRAPPER ROUTER
   ========================================================================= */
export default function InterviewVisualizer({ id }) {
  // 1. Specific C++ Visualizers mapped to MemoryModel/PipelineStepper
  if (id === 'stack-heap') {
    return (
      <MemoryModel
        type="stack-heap"
        stackItems={['main() frame', 'int x = 10', 'int* p (ptr)']}
        heapItems={[
          { label: 'int value', val: '10', addr: '0x7ffd5' },
          { label: 'String object', val: '"OSlizer"', addr: '0x8a1b2' }
        ]}
        pointerMap={[{ from: 'int* p (ptr)', to: '0x7ffd5' }]}
        explanation="Stack manages local scopes automatically. Heap manages dynamic memory allocated via new."
      />
    );
  }

  if (id === 'compilation-steps') {
    return (
      <PipelineStepper
        runnerText="Run C++ Compiler"
        steps={[
          { title: 'Source Files', ext: '.cpp / .h', desc: 'Human-readable source files containing code and header includes.' },
          { title: '1. Preprocessor', ext: '.i', desc: 'Expands macros, fetches headers (#include), and strips comments.' },
          { title: '2. Compiler', ext: '.s', desc: 'Translates preprocessed C++ source into assembly language.' },
          { title: '3. Assembler', ext: '.o / .obj', desc: 'Translates assembly instructions into relocatable binary machine code.' },
          { title: '4. Linker', ext: '.exe / a.out', desc: 'Merges object files and static library files into the final executable binary.' }
        ]}
      />
    );
  }

  if (id === 'vtable') {
    return (
      <MemoryModel
        type="stack-heap"
        stackItems={['Animal* ptr']}
        heapItems={[
          { label: 'Dog Object', val: 'vptr ➔ [Dog Vtable]', addr: '0x221a' },
          { label: 'Dog Vtable', val: '[0] makeSound() ➔ Dog::makeSound()', addr: '0x88f1' }
        ]}
        pointerMap={[{ from: 'Animal* ptr', to: '0x221a' }]}
        explanation="The vptr inside the object points to the class Vtable, resolving the virtual function call at runtime."
      />
    );
  }

  // 2. Specific Java/Python Visualizers
  if (id === 'jdk-jre-jvm') {
    return (
      <VennConcentric
        layout="concentric"
        concentricBoxes={[
          { id: 'jdk', label: 'JDK (Development Kit)', color: 'var(--pink)', desc: 'Contains compilers, linkers, debuggers and complete SDK tools.' },
          { id: 'jre', label: 'JRE (Runtime Environment)', color: 'var(--orange)', desc: 'Contains Java class libraries, resources and JVM.' },
          { id: 'jvm', label: 'JVM (Virtual Machine)', color: 'var(--cyan)', desc: 'Translates compiled bytecode (.class) instructions to native CPU binary execution.' }
        ]}
      />
    );
  }

  if (id === 'gil') {
    return (
      <ConcurrencyTimeline
        timelines={[
          { name: 'Thread 1', segments: [{ label: 'Execute Code', start: 0, duration: 4, color: 'var(--cyan)' }, { label: 'Wait for GIL', start: 4, duration: 6, color: '#e0e0e0' }] },
          { name: 'Thread 2', segments: [{ label: 'Wait for GIL', start: 0, duration: 4, color: '#e0e0e0' }, { label: 'Execute Code', start: 4, duration: 6, color: 'var(--pink)' }] }
        ]}
        legend={[
          { label: 'Running (Holds GIL)', color: 'var(--cyan)' },
          { label: 'Running (Holds GIL)', color: 'var(--pink)' },
          { label: 'Blocked', color: '#e0e0e0' }
        ]}
      />
    );
  }

  // 3. Specific SQL/Git Visualizers
  if (id === 'sql-joins') {
    return (
      <VennConcentric
        layout="venn"
        titleA="Table A"
        titleB="Table B"
        overlappingText="INNER JOIN"
        explanation="INNER JOIN yields rows with matching keys. LEFT JOIN includes all rows from Table A."
      />
    );
  }

  if (id === 'merge-rebase' || id === 'merge-vs-rebase') {
    return (
      <GeneralGitGraph
        actionText="git rebase main"
        commits={[{ id: 'C1', msg: 'Root' }, { id: 'C2', msg: 'Base' }, { id: 'C3', msg: 'Feature commit' }, { id: 'C4', msg: 'Main head' }]}
        branches={[{ name: 'main', commitId: 'C4' }, { name: 'feature', commitId: 'C3' }]}
        onAction={() => 'git rebase: Reapplied C3 on top of main head C4, creating a linear history.'}
      />
    );
  }

  // 4. Specific Concurrency/Process Visualizers
  if (id === 'process-thread' || id === 'proc-thread-linux' || id === 'java-process-thread') {
    return (
      <VennConcentric
        layout="concentric"
        concentricBoxes={[
          { id: 'proc', label: 'Process (Boundary PID 4911)', color: 'var(--purple)', desc: 'Owns independent memory address space, heap resources, and files.' },
          { id: 't1', label: 'Thread 1 (Active Stack)', color: 'var(--cyan)', desc: 'Shares process heap, runs concurrently with Thread 2.' },
          { id: 't2', label: 'Thread 2 (Active Stack)', color: 'var(--pink)', desc: 'Shares process heap, possesses its own Program Counter (PC).' }
        ]}
      />
    );
  }

  // 5. Specific Puzzles Visualizers (routing to their actual widgets)
  if (id === '25-horses') return <Horses25Visualizer />;
  if (id === '8-balls') return <Ball8Visualizer />;
  if (id === 'bridge-torch') return <BridgeTorchVisualizer />;
  if (id === 'water-jug') return <WaterJugVisualizer />;
  if (id === '100-prisoners') return <PrisonersVisualizer />;
  if (id === 'egg-dropping') return <EggDropVisualizer />;
  if (id === 'coin-flip') return <CoinFlipVisualizer />;
  if (id === 'poisoned-bottle') return <PoisonedBottleVisualizer />;
  if (id === 'pirate-gold') return <PirateGoldVisualizer />;
  if (id === 'clock-angle') return <ClockAngleVisualizer />;
  if (id === 'train-crossing') return <TrainCrossingVisualizer />;
  if (id === 'river-crossing') return <RiverCrossingVisualizer />;
  if (id === 'dice-probability') return <DiceVisualizer />;
  if (id === 'monty-hall') return <MontyHallVisualizer />;
  if (id === 'logical-deduction') return <LogicalDeductionVisualizer />;
  if (id === 'hashmap-concurrenthashmap') return <HashMapConcurrentVisualizer />;

  // 6. General Pipeline Stepper questions
  if (id === 'java-internal-execution') {
    return (
      <PipelineStepper
        runnerText="Run JVM Loader"
        steps={[
          { title: 'Compilation', ext: '.class', desc: 'javac compiles program source code into java bytecode.' },
          { title: 'Class Loading', desc: 'JVM ClassLoader dynamically loads bytes into memory areas.' },
          { title: 'Verification', desc: 'Bytecode verifier ensures security and safety bounds are met.' },
          { title: 'PVM Loop', desc: 'Interpreter runs instructions sequentially; JIT compiler compiles hotspots to native assembly.' }
        ]}
      />
    );
  }
  if (id === 'py-execution-flow') {
    return (
      <PipelineStepper
        runnerText="Run Python interpreter"
        steps={[
          { title: 'Source file', ext: '.py', desc: 'Python script loaded by interpreter.' },
          { title: 'Bytecode Compile', ext: '.pyc', desc: 'Translates source to intermediate bytecode dynamically.' },
          { title: 'PVM Execution', desc: 'Python Virtual Machine stack-based loop interprets bytecode to CPU instructions.' }
        ]}
      />
    );
  }
  if (id === 'terminal-execution') {
    return (
      <PipelineStepper
        runnerText="Type 'ls -l'"
        steps={[
          { title: 'Terminal Input', desc: 'User types terminal string command.' },
          { title: 'Alias Lookup', desc: 'Shell checks list of aliases and macros.' },
          { title: 'PATH Lookup', desc: 'Shell scans bin paths to locate executable file.' },
          { title: 'Fork & Exec', desc: 'Spawns child process replacing image with ls binary code.' }
        ]}
      />
    );
  }
  if (id === 'fork-exec-linux') {
    return (
      <PipelineStepper
        runnerText="Trigger fork()"
        steps={[
          { title: 'Parent run', desc: 'Main thread of execution.' },
          { title: 'fork() system call', desc: 'Clones memory layout to child process (shares page frames via Copy-On-Write).' },
          { title: 'exec() system call', desc: 'Child process replaces its instructions with a new binary program.' }
        ]}
      />
    );
  }
  if (id === 'server-debugging') {
    return (
      <PipelineStepper
        runnerText="Start Debug Pipeline"
        steps={[
          { title: 'Check Ping', desc: 'Verify connection port is reachable.' },
          { title: 'Resource allocation', desc: 'Check CPU/RAM spikes and disk space percentages.' },
          { title: 'Check Log files', desc: 'Scan /var/log/syslog or journalctl daemon logs.' },
          { title: 'Systemctl status', desc: 'Check service state and restart loops.' }
        ]}
      />
    );
  }
  if (id === 'git-workflow') {
    return (
      <PipelineStepper
        runnerText="Execute Workflow"
        steps={[
          { title: 'Local branch', desc: 'Developer creates feature branch from main.' },
          { title: 'Code edits & Commit', desc: 'Developer makes local changes and commits them.' },
          { title: 'Push Remote', desc: 'Uploads feature branch to GitHub server.' },
          { title: 'Pull Request', desc: 'Triggers PR review, CI status checks, and merges branch to main.' }
        ]}
      />
    );
  }
  if (id === 'resolve-merge-conflict') {
    return (
      <PipelineStepper
        runnerText="Resolve Conflict"
        steps={[
          { title: 'Git Merge', desc: 'Git raises merge conflict indicators on overlapping edits.' },
          { title: 'Locate Markers', desc: 'Open file, inspect HEAD vs incoming markers.' },
          { title: 'Edit conflict', desc: 'Manually delete markers and clean code lines.' },
          { title: 'Stage & Commit', desc: 'git add <file> and git commit to finish merge.' }
        ]}
      />
    );
  }
  if (id === 'gc-jvm') {
    return (
      <PipelineStepper
        runnerText="Run Garbage Collector"
        steps={[
          { title: 'Eden Memory', desc: 'New objects created here. Most die young.' },
          { title: 'Survivor S0/S1', desc: 'Surviving objects are copied back and forth between survivor spaces.' },
          { title: 'Tenured Heap', desc: 'Long-lived objects promoted to Old Generation.' },
          { title: 'Mark-and-Sweep', desc: 'GC marks reachable roots and deletes orphaned allocations.' }
        ]}
      />
    );
  }
  if (id === 'platform-independence') {
    return (
      <PipelineStepper
        runnerText="Run WORA pipeline"
        steps={[
          { title: 'Java source', ext: '.java', desc: 'Write platform-independent Java class code.' },
          { title: 'javac Compiler', ext: '.class', desc: 'Compiles source to standard intermediate JVM bytecode.' },
          { title: 'Target Machine JVM', desc: 'Host JVM translates bytecode to local machine binary on-the-fly.' }
        ]}
      />
    );
  }
  if (id === 'cron-job') {
    return (
      <PipelineStepper
        runnerText="Trigger Daemon scan"
        steps={[
          { title: 'Cron Syntax', desc: 'Define backup task schedule (* * * * * backup.sh).' },
          { title: 'Crontab register', desc: 'Write configuration to system crontab scheduler.' },
          { title: 'crond Daemon', desc: 'Background daemon wakes up every minute, checks crontab, and executes active tasks.' }
        ]}
      />
    );
  }

  // 7. General Memory Model questions
  if (id === 'jvm-memory') {
    return (
      <MemoryModel
        type="stack-heap"
        stackItems={['Thread-Stack: main() frame', 'reference value stringRef']}
        heapItems={[{ label: 'String object', val: '"JVM Heap"', addr: '0x32ba1' }]}
        pointerMap={[{ from: 'reference value stringRef', to: '0x32ba1' }]}
        explanation="JVM manages private stacks for each thread, and a single shared heap space."
      />
    );
  }
  if (id === 'shallow-deep-copy') {
    return (
      <MemoryModel
        type="stack-heap"
        stackItems={['Pointer obj1', 'Pointer obj2']}
        heapItems={[
          { label: 'Heap Object A', val: 'Shared Data Block', addr: '0x10a2' }
        ]}
        pointerMap={[
          { from: 'Pointer obj1', to: '0x10a2' },
          { from: 'Pointer obj2', to: '0x10a2' }
        ]}
        explanation="Shallow copy: Both object pointers point to the exact same heap memory block (Address 0x10a2)."
      />
    );
  }
  if (id === 'py-copying') {
    return (
      <MemoryModel
        type="stack-heap"
        stackItems={['Pointer clone1', 'Pointer clone2']}
        heapItems={[
          { label: 'Heap Object A', val: 'Cloned Data Block 1', addr: '0x10a2' },
          { label: 'Heap Object B', val: 'Cloned Data Block 2', addr: '0x20f5' }
        ]}
        pointerMap={[
          { from: 'Pointer clone1', to: '0x10a2' },
          { from: 'Pointer clone2', to: '0x20f5' }
        ]}
        explanation="Deep Copy: Allocates entirely separate heap blocks (Address 0x10a2 and 0x20f5) for each cloned target."
      />
    );
  }
  if (id === 'copy-move-constructor') {
    return (
      <MemoryModel
        type="pointer-steal"
        stackItems={['sourceObj pointer', 'targetObj pointer (new)']}
        heapItems={[
          { label: 'Resource Block', val: 'Allocated array', addr: '0x44a1', free: false }
        ]}
        pointerMap={[
          { from: 'targetObj pointer (new)', to: '0x44a1' }
        ]}
        explanation="Move Constructor: transfers ownership of resource at 0x44a1 directly, clearing sourceObj pointer to NULL without allocation."
      />
    );
  }
  if (id === 'smart-pointers') {
    return (
      <MemoryModel
        type="smart-pointers"
        stackItems={['unique_ptr u', 'shared_ptr s1', 'shared_ptr s2']}
        heapItems={[
          { label: 'Unique object A', val: 'Exclusive resource', addr: '0x77ab', refCount: 1 },
          { label: 'Shared object B', val: 'Shared resource', addr: '0x991f', refCount: 2 }
        ]}
        pointerMap={[
          { from: 'unique_ptr u', to: '0x77ab' },
          { from: 'shared_ptr s1', to: '0x991f' },
          { from: 'shared_ptr s2', to: '0x991f' }
        ]}
        explanation="Smart Pointers manage reference counts and automatically free heap memory when references reach 0."
      />
    );
  }
  if (id === 'memory-leaks-segfaults') {
    return (
      <MemoryModel
        type="leak-segfault"
        stackItems={['Wild pointer']}
        heapItems={[
          { label: 'Orphaned Box', val: 'Leaked Data', addr: '0xbc11', leak: true }
        ]}
        pointerMap={[]}
        explanation="Memory Leak occurs when heap objects lose all stack pointers, making them unreachable but still allocated in memory."
      />
    );
  }
  if (id === 'malloc-new') {
    return (
      <MemoryModel
        type="stack-heap"
        stackItems={['new Operator', 'malloc Call']}
        heapItems={[
          { label: 'Object A (new)', val: 'Allocated + Constructor Called', addr: '0x3a12' },
          { label: 'Block B (malloc)', val: 'Raw bytes (No Constructor)', addr: '0x5ff1' }
        ]}
        pointerMap={[
          { from: 'new Operator', to: '0x3a12' },
          { from: 'malloc Call', to: '0x5ff1' }
        ]}
        explanation="C++ new operator calls class constructors. C malloc only allocates raw byte memory on heap."
      />
    );
  }
  if (id === 'py-mem-management') {
    return (
      <MemoryModel
        type="smart-pointers"
        stackItems={['var_a', 'var_b']}
        heapItems={[
          { label: 'Python Int Object', val: '100', addr: '0xaa12', refCount: 2 }
        ]}
        pointerMap={[
          { from: 'var_a', to: '0xaa12' },
          { from: 'var_b', to: '0xaa12' }
        ]}
        explanation="Python tracks reference counts. When variables pointing to 0xaa12 drop to 0, memory is cleared."
      />
    );
  }
  if (id === 'swap-memory') {
    return (
      <MemoryModel
        type="stack-heap"
        stackItems={['Physical RAM (Paging out)']}
        heapItems={[
          { label: 'Active Process Pages', val: 'Running program data', addr: 'RAM_Block' },
          { label: 'Swap file (Disk block)', val: 'Idle background pages', addr: 'SSD_Block' }
        ]}
        pointerMap={[
          { from: 'Physical RAM (Paging out)', to: 'SSD_Block' }
        ]}
        explanation="Swap Memory pages out idle RAM blocks to disk storage spaces to reclaim physical system memory."
      />
    );
  }
  if (id === 'ram-full-oom') {
    return (
      <MemoryModel
        type="leak-segfault"
        stackItems={['System Memory exhaustion']}
        heapItems={[
          { label: 'Process PID 2041', val: 'OOM Score: 950 (Kill Target)', addr: 'RAM_Block_1', leak: true },
          { label: 'System Service', val: 'OOM Score: 20 (Protected)', addr: 'RAM_Block_2' }
        ]}
        pointerMap={[]}
        explanation="When memory runs full, the OOM Killer kills the process with the highest oom_score (PID 2041)."
      />
    );
  }
  if (id === 'string-builder-buffer') {
    return (
      <MemoryModel
        type="stack-heap"
        stackItems={['immutable String s', 'StringBuilder sb']}
        heapItems={[
          { label: 's Target', val: '"Hello World" (Spawns new string)', addr: '0x101a' },
          { label: 'sb Buffer', val: '"Hello World" (Appends in-place)', addr: '0x302c' }
        ]}
        pointerMap={[
          { from: 'immutable String s', to: '0x101a' },
          { from: 'StringBuilder sb', to: '0x302c' }
        ]}
        explanation="StringBuilder edits its memory buffer in-place. Modifying a String allocates a brand new object."
      />
    );
  }
  if (id === 'links-linux') {
    return (
      <MemoryModel
        type="stack-heap"
        stackItems={['HardLink', 'SymLink (Soft)']}
        heapItems={[
          { label: 'Inode metadata block', val: 'Data blocks pointer', addr: 'Inode_121' },
          { label: 'Symlink path file', val: 'Target path string', addr: 'File_Block' }
        ]}
        pointerMap={[
          { from: 'HardLink', to: 'Inode_121' },
          { from: 'SymLink (Soft)', to: 'File_Block' }
        ]}
        explanation="Hard links point directly to the file Inode. Soft links point to the filename path block."
      />
    );
  }
  if (id === 'inode-linux') {
    return (
      <MemoryModel
        type="stack-heap"
        stackItems={['Filename string', 'Inode mapping lookup']}
        heapItems={[
          { label: 'Inode 49211', val: 'Size: 10KB, Permissions: 755', addr: 'Disk_Blocks' }
        ]}
        pointerMap={[
          { from: 'Filename string', to: 'Inode_49211' }
        ]}
        explanation="Directories map filenames to unique inode numbers, which point to metadata and physical disk blocks."
      />
    );
  }
  if (id === 'generators') {
    return (
      <MemoryModel
        type="stack-heap"
        stackItems={['list generator', 'normal list']}
        heapItems={[
          { label: 'list items in memory', val: '[1, 2, 3 ... 1000]', addr: '0x105a' },
          { label: 'generator state block', val: 'yield item (current index)', addr: '0x44cb' }
        ]}
        pointerMap={[
          { from: 'normal list', to: '0x105a' },
          { from: 'list generator', to: '0x44cb' }
        ]}
        explanation="Generators only hold a tiny active state block in memory, whereas standard lists preallocate all elements."
      />
    );
  }

  // 8. General Venn/Concentric questions
  if (id === 'equals-operator') {
    return (
      <VennConcentric
        layout="venn"
        titleA="== Operator"
        titleB="equals() Method"
        overlappingText="Both compare refs"
        explanation="== compares references (addresses). equals() checks content equivalence (logical value)."
      />
    );
  }
  if (id === 'is-equals-py') {
    return (
      <VennConcentric
        layout="venn"
        titleA="is Operator"
        titleB="== Operator"
        overlappingText="Memory identical"
        explanation="is evaluates memory identity (id(a) == id(b)). == compares values (a == b)."
      />
    );
  }
  if (id === 'list-tuple') {
    return (
      <VennConcentric
        layout="concentric"
        concentricBoxes={[
          { id: 'list', label: 'Python List [Mutable]', color: 'var(--cyan)', desc: 'Can append, edit, and insert elements. Uses more memory.' },
          { id: 'tuple', label: 'Python Tuple (Immutable)', color: 'var(--yellow)', desc: 'Fixed size array, read-only. Fast lookup times.' }
        ]}
      />
    );
  }
  if (id === 'mutable-immutable') {
    return (
      <VennConcentric
        layout="venn"
        titleA="Mutable Objects"
        titleB="Immutable Objects"
        overlappingText="Object references"
        explanation="Mutable objects can modify contents in-place. Immutable objects spawn new allocations on write."
      />
    );
  }
  if (id === 'git-vs-github') {
    return (
      <VennConcentric
        layout="concentric"
        concentricBoxes={[
          { id: 'github', label: 'GitHub Cloud Services', color: 'var(--pink)', desc: 'Remote hosting service enclosing issue tracking, PR reviews, CI pipelines.' },
          { id: 'git', label: 'Git (Local Version tool)', color: 'var(--cyan)', desc: 'Core CLI tool managing branch histories and commit graphs.' }
        ]}
      />
    );
  }
  if (id === 'primary-foreign-keys') {
    return (
      <VennConcentric
        layout="venn"
        titleA="Primary Key"
        titleB="Foreign Key"
        overlappingText="Integrity locks"
        explanation="Primary Key uniquely identifies row entries. Foreign Key references Primary Keys of other tables."
      />
    );
  }
  if (id === 'polymorphism') {
    return (
      <VennConcentric
        layout="venn"
        titleA="Static Overloading"
        titleB="Dynamic Overriding"
        overlappingText="Common Name"
        explanation="Static Compile-time binding resolves overloaded functions. Dynamic Runtime binding overrides virtual function calls."
      />
    );
  }
  if (id === 'interpreter-compiler-py') {
    return (
      <VennConcentric
        layout="venn"
        titleA="Compiler"
        titleB="Interpreter"
        overlappingText="Python Engine"
        explanation="CPython first compiles source code to intermediate bytecode, and then interprets it in the PVM."
      />
    );
  }

  // 9. General Git questions
  if (id === 'pull-vs-fetch') {
    return (
      <GeneralGitGraph
        actionText="git pull (Fetch + Merge)"
        commits={[{ id: 'C1', msg: 'Root' }, { id: 'C2', msg: 'Base' }, { id: 'C3', msg: 'Remote origin' }]}
        branches={[{ name: 'origin/main', commitId: 'C3' }, { name: 'main', commitId: 'C2' }]}
        onAction={() => 'git pull: Fetched commit C3 from origin, then merged it directly into your local main.'}
      />
    );
  }
  if (id === 'git-branch') {
    return (
      <GeneralGitGraph
        actionText="git branch feature"
        commits={[{ id: 'C1', msg: 'Root' }, { id: 'C2', msg: 'Active Main' }]}
        branches={[{ name: 'main', commitId: 'C2' }]}
        onAction={() => 'git branch: Created lightweight pointer "feature" referencing commit C2.'}
      />
    );
  }
  if (id === 'pull-requests') {
    return (
      <GeneralGitGraph
        actionText="Merge Pull Request"
        commits={[{ id: 'C1', msg: 'Root' }, { id: 'C2', msg: 'Feature branch' }]}
        branches={[{ name: 'feature', commitId: 'C2' }]}
        onAction={() => 'Pull Request: Successfully verified checks and merged feature branch into main.'}
      />
    );
  }
  if (id === 'git-stash') {
    return (
      <GeneralGitGraph
        actionText="git stash push"
        commits={[{ id: 'C1', msg: 'Clean index' }]}
        branches={[{ name: 'main', commitId: 'C1' }]}
        onAction={() => 'git stash: Pushed uncommitted index edits onto side stash stack.'}
      />
    );
  }
  if (id === 'reset-vs-revert') {
    return (
      <GeneralGitGraph
        actionText="git reset --hard HEAD~1"
        commits={[{ id: 'C1', msg: 'Root' }, { id: 'C2', msg: 'Broke build' }]}
        branches={[{ name: 'main', commitId: 'C2' }]}
        onAction={() => 'git reset: Rolled main branch reference back to C1. Discarded C2.'}
      />
    );
  }
  if (id === 'undo-commit') {
    return (
      <GeneralGitGraph
        actionText="git reset --soft HEAD~1"
        commits={[{ id: 'C1', msg: 'Root' }, { id: 'C2', msg: 'Mistake commit' }]}
        branches={[{ name: 'main', commitId: 'C2' }]}
        onAction={() => 'git reset: Moved HEAD back to C1. Keeps mistake changes staged in index.'}
      />
    );
  }
  if (id === 'detached-head') {
    return (
      <GeneralGitGraph
        actionText="git checkout <hash>"
        commits={[{ id: 'C1', msg: 'Root' }, { id: 'C2', msg: 'Historical point' }]}
        branches={[{ name: 'main', commitId: 'C2' }]}
        onAction={() => 'git checkout: HEAD is now detached, pointing directly to commit C1 instead of main branch.'}
      />
    );
  }
  if (id === 'what-is-git') {
    return (
      <GeneralGitGraph
        actionText="git init"
        commits={[{ id: 'C1', msg: 'Init local repository' }]}
        branches={[{ name: 'main', commitId: 'C1' }]}
        onAction={() => 'git init: Created dynamic DAG repository inside local .git folder.'}
      />
    );
  }
  if (id === 'git-repo') {
    return (
      <GeneralGitGraph
        actionText="Check .git contents"
        commits={[{ id: 'C1', msg: 'First commit' }]}
        branches={[{ name: 'main', commitId: 'C1' }]}
        onAction={() => 'Opened .git: contains objects/ (commits), refs/ (branches) and index (staging area).'}
      />
    );
  }
  if (id === 'merge-conflict') {
    return (
      <GeneralGitGraph
        actionText="Trigger conflict merge"
        commits={[{ id: 'C1', msg: 'Root' }, { id: 'C2', msg: 'Edit line 5 in main' }, { id: 'C3', msg: 'Edit line 5 in feature' }]}
        branches={[{ name: 'main', commitId: 'C2' }, { name: 'feature', commitId: 'C3' }]}
        onAction={() => 'Merge Conflict: Git cannot merge. Main and Feature both modified Line 5. Resolving required.'}
      />
    );
  }
  if (id === 'local-vs-remote-repo') {
    return (
      <GeneralGitGraph
        actionText="git push origin main"
        commits={[{ id: 'C1', msg: 'Root' }, { id: 'C2', msg: 'Unpushed local commit' }]}
        branches={[{ name: 'main', commitId: 'C2' }]}
        onAction={() => 'git push: Uploaded local commit C2 to remote repository server (GitHub).'}
      />
    );
  }
  if (id === 'gitignore') {
    return (
      <GeneralGitGraph
        actionText="Check .gitignore match"
        commits={[{ id: 'C1', msg: 'Clean file tracking' }]}
        branches={[{ name: 'main', commitId: 'C1' }]}
        onAction={() => 'gitignore check: successfully ignored node_modules/ and .env secrets from staging.'}
      />
    );
  }
  if (id === 'clone-vs-fork') {
    return (
      <GeneralGitGraph
        actionText="git clone <url>"
        commits={[{ id: 'C1', msg: 'Remote commits history' }]}
        branches={[{ name: 'origin/main', commitId: 'C1' }]}
        onAction={() => 'git clone: Downloaded a full copy of the remote repository to your local drive.'}
      />
    );
  }
  if (id === 'git-head') {
    return (
      <GeneralGitGraph
        actionText="Check HEAD file"
        commits={[{ id: 'C1', msg: 'First commit' }, { id: 'C2', msg: 'Latest commit' }]}
        branches={[{ name: 'main', commitId: 'C2' }]}
        onAction={() => 'HEAD contents: points to refs/heads/main, which currently points to C2.'}
      />
    );
  }
  if (id === 'git-add-dot') {
    return (
      <GeneralGitGraph
        actionText="git add ."
        commits={[{ id: 'C1', msg: 'Clean Index status' }]}
        branches={[{ name: 'main', commitId: 'C1' }]}
        onAction={() => 'git add .: staged all modified, new, and deleted files into the staging index.'}
      />
    );
  }
  if (id === 'local-vs-remote-fail') {
    return (
      <GeneralGitGraph
        actionText="git bisect start"
        commits={[{ id: 'C1', msg: 'Good' }, { id: 'C2', msg: 'Bad merge' }]}
        branches={[{ name: 'main', commitId: 'C2' }]}
        onAction={() => 'git bisect: starting binary search to locate the broken commit.'}
      />
    );
  }

  // 10. General SQL Sandbox questions
  if (id === 'nth-salary' || id === 'second-highest-salary') {
    return (
      <SqlSandbox
        sourceHeaders={['EmpId', 'Name', 'Salary']}
        sourceRows={[
          ['1', 'John', '50000'],
          ['2', 'Alice', '90000'],
          ['3', 'Bob', '75000'],
          ['4', 'Cathy', '90000']
        ]}
        queryText="SELECT DISTINCT Salary FROM Employee ORDER BY Salary DESC LIMIT 1 OFFSET 1;"
        resultHeaders={['Salary']}
        resultRows={[['75000']]}
        annotation="Extracts distinct salaries in descending order, skipping top to return 2nd highest."
      />
    );
  }
  if (id === 'find-duplicates') {
    return (
      <SqlSandbox
        sourceHeaders={['Id', 'Email']}
        sourceRows={[
          ['1', 'a@b.com'],
          ['2', 'c@d.com'],
          ['3', 'a@b.com']
        ]}
        queryText="SELECT Email, COUNT(Email) FROM Users GROUP BY Email HAVING COUNT(Email) > 1;"
        resultHeaders={['Email', 'Occurrences']}
        resultRows={[['a@b.com', '2']]}
      />
    );
  }
  if (id === 'delete-duplicates') {
    return (
      <SqlSandbox
        sourceHeaders={['Id', 'Email']}
        sourceRows={[
          ['1', 'a@b.com'],
          ['2', 'c@d.com'],
          ['3', 'a@b.com']
        ]}
        queryText="DELETE e1 FROM Employee e1 INNER JOIN Employee e2 ON e1.Email = e2.Email AND e1.Id > e2.Id;"
        resultHeaders={['Id', 'Email']}
        resultRows={[
          ['1', 'a@b.com'],
          ['2', 'c@d.com']
        ]}
        annotation="Deletes matching emails that possess larger unique ID numbers."
      />
    );
  }
  if (id === 'dept-highest-salary') {
    return (
      <SqlSandbox
        sourceHeaders={['Name', 'DeptId', 'Salary']}
        sourceRows={[
          ['John', 'Tech', '90000'],
          ['Alice', 'HR', '50000'],
          ['Bob', 'Tech', '120000']
        ]}
        queryText="SELECT DeptId, MAX(Salary) FROM Employee GROUP BY DeptId;"
        resultHeaders={['DeptId', 'MaxSalary']}
        resultRows={[
          ['Tech', '120000'],
          ['HR', '50000']
        ]}
      />
    );
  }
  if (id === 'earn-more-dept-avg') {
    return (
      <SqlSandbox
        sourceHeaders={['Name', 'Dept', 'Salary']}
        sourceRows={[
          ['John', 'Sales', '60000'],
          ['Alice', 'Sales', '40000'],
          ['Bob', 'Tech', '100000']
        ]}
        queryText="SELECT Name, Salary FROM Employee e1 WHERE Salary > (SELECT AVG(Salary) FROM Employee e2 WHERE e2.Dept = e1.Dept);"
        resultHeaders={['Name', 'Salary']}
        resultRows={[['John', '60000']]}
        annotation="Sales average is 50000; John earns 60000."
      />
    );
  }
  if (id === 'same-salary') {
    return (
      <SqlSandbox
        sourceHeaders={['Name', 'Salary']}
        sourceRows={[
          ['John', '75000'],
          ['Alice', '60000'],
          ['Bob', '75000']
        ]}
        queryText="SELECT Name, Salary FROM Employee WHERE Salary IN (SELECT Salary FROM Employee GROUP BY Salary HAVING COUNT(Id) > 1);"
        resultHeaders={['Name', 'Salary']}
        resultRows={[
          ['John', '75000'],
          ['Bob', '75000']
        ]}
      />
    );
  }
  if (id === 'manager-self-join') {
    return (
      <SqlSandbox
        sourceHeaders={['EmpId', 'Name', 'ManagerId']}
        sourceRows={[
          ['1', 'John', '2'],
          ['2', 'Alice', 'NULL']
        ]}
        queryText="SELECT e.Name, m.Name AS Manager FROM Employee e LEFT JOIN Employee m ON e.ManagerId = m.EmpId;"
        resultHeaders={['Name', 'Manager']}
        resultRows={[
          ['John', 'Alice'],
          ['Alice', 'NULL']
        ]}
      />
    );
  }
  if (id === 'dept-count-filter') {
    return (
      <SqlSandbox
        sourceHeaders={['Name', 'Dept']}
        sourceRows={[
          ['John', 'Tech'], ['Alice', 'Tech'], ['Bob', 'Tech'],
          ['Cathy', 'Tech'], ['Dan', 'Tech'], ['Eve', 'Tech'],
          ['Frank', 'HR']
        ]}
        queryText="SELECT Dept, COUNT(Name) FROM Employee GROUP BY Dept HAVING COUNT(Name) > 5;"
        resultHeaders={['Dept', 'Count']}
        resultRows={[['Tech', '6']]}
      />
    );
  }
  if (id === 'no-orders') {
    return (
      <SqlSandbox
        sourceHeaders={['CustId', 'Name', 'OrderId']}
        sourceRows={[
          ['1', 'John', '101'],
          ['2', 'Alice', 'NULL']
        ]}
        queryText="SELECT c.Name FROM Customers c LEFT JOIN Orders o ON c.CustId = o.CustomerId WHERE o.OrderId IS NULL;"
        resultHeaders={['Name']}
        resultRows={[['Alice']]}
      />
    );
  }
  if (id === 'delete-drop-truncate') {
    return (
      <SqlSandbox
        sourceHeaders={['Id', 'Data']}
        sourceRows={[['1', 'Value1'], ['2', 'Value2']]}
        queryText="TRUNCATE TABLE Employee;"
        resultHeaders={['Id', 'Data']}
        resultRows={[]}
        annotation="Truncate deletes all rows instantly without scanning, keeping the table structure intact."
      />
    );
  }
  if (id === 'where-having') {
    return (
      <SqlSandbox
        sourceHeaders={['Dept', 'Status', 'Salary']}
        sourceRows={[
          ['Tech', 'Active', '90000'],
          ['Tech', 'Inactive', '120000']
        ]}
        queryText="SELECT Dept, SUM(Salary) FROM Employee WHERE Status='Active' GROUP BY Dept HAVING SUM(Salary) > 50000;"
        resultHeaders={['Dept', 'SUM']}
        resultRows={[['Tech', '90000']]}
        annotation="WHERE filters Status='Active' before grouping. HAVING filters SUM > 50000 after grouping."
      />
    );
  }
  if (id === 'normalization') {
    return (
      <SqlSandbox
        sourceHeaders={['EmpId', 'Skills (Unnormalized)', 'Skill (1NF)']}
        sourceRows={[
          ['1', 'Java, C++', 'Java'],
          ['1', 'Java, C++', 'C++']
        ]}
        queryText="-- Normalization splits multi-valued attributes into unique row items."
        resultHeaders={['EmpId', 'Atomic Skill']}
        resultRows={[['1', 'Java'], ['1', 'C++']]}
      />
    );
  }
  if (id === 'db-indexing') {
    return (
      <SqlSandbox
        sourceHeaders={['Id', 'Name (Full table scan)']}
        sourceRows={[['1', 'John'], ['2', 'Alice'], ['3', 'Bob']]}
        queryText="CREATE INDEX idx_name ON Employee(Name);"
        resultHeaders={['Name', 'B-Tree Block Address']}
        resultRows={[['Alice', 'Address_01'], ['Bob', 'Address_02'], ['John', 'Address_03']]}
        annotation="B-Tree indexes sort targets to avoid scanning entire table contents sequentially."
      />
    );
  }
  if (id === 'union-union-all') {
    return (
      <SqlSandbox
        sourceHeaders={['Query A', 'Query B']}
        sourceRows={[['John'], ['John']]}
        queryText="SELECT Name FROM TableA UNION SELECT Name FROM TableB;"
        resultHeaders={['Name (UNION deduplicated)']}
        resultRows={[['John']]}
      />
    );
  }
  if (id === 'acid-properties') {
    return (
      <SqlSandbox
        sourceHeaders={['Account', 'Balance (Before txn)']}
        sourceRows={[['A', '500'], ['B', '200']]}
        queryText="BEGIN TRANSACTION; UPDATE Acc SET Bal=Bal-100 WHERE Acc='A'; UPDATE Acc SET Bal=Bal+100 WHERE Acc='B'; COMMIT;"
        resultHeaders={['Account', 'Balance (After commit)']}
        resultRows={[['A', '400'], ['B', '300']]}
      />
    );
  }
  if (id === 'clustered-nonclustered-index') {
    return (
      <SqlSandbox
        sourceHeaders={['Primary Index (Clustered)', 'Physical Row order']}
        sourceRows={[['1', 'John'], ['2', 'Alice']]}
        queryText="-- Clustered index defines physical storage layout directly."
        resultHeaders={['Secondary index key', 'Row reference pointer']}
        resultRows={[['Alice', 'Row_2'], ['John', 'Row_1']]}
      />
    );
  }
  if (id === 'subquery-correlated') {
    return (
      <SqlSandbox
        sourceHeaders={['EmpId', 'Salary']}
        sourceRows={[['1', '75000'], ['2', '90000']]}
        queryText="SELECT * FROM Employee e WHERE Salary > (SELECT AVG(Salary) FROM Employee);"
        resultHeaders={['Id', 'Salary (Filtered by independent average)']}
        resultRows={[['2', '90000']]}
      />
    );
  }

  // 11. General Thread Locking & Networks questions
  if (id === 'thread-multiprocessing-py') {
    return (
      <ConcurrencyTimeline
        timelines={[
          { name: 'Threads CPU', segments: [{ label: 'Thread 1 run', start: 0, duration: 4, color: 'var(--cyan)' }, { label: 'Thread 2 run', start: 4, duration: 5, color: 'var(--pink)' }] },
          { name: 'Multiprocess', segments: [{ label: 'Process 1 run', start: 0, duration: 8, color: 'var(--cyan)' }, { label: 'Process 2 run', start: 0, duration: 8, color: 'var(--green)' }] }
        ]}
        legend={[
          { label: 'Process 1 / Thread 1', color: 'var(--cyan)' },
          { label: 'Process 2 / Thread 2', color: 'var(--pink)' },
          { label: 'Core 2 Active', color: 'var(--green)' }
        ]}
      />
    );
  }
  if (id === 'sync-deadlock') {
    return (
      <ConcurrencyTimeline
        timelines={[
          { name: 'Thread 1', segments: [{ label: 'Acquire Lock A', start: 0, duration: 3, color: 'var(--cyan)' }, { label: 'Block: Wait B', start: 3, duration: 7, color: 'var(--pink)' }] },
          { name: 'Thread 2', segments: [{ label: 'Acquire Lock B', start: 0, duration: 3, color: 'var(--yellow)' }, { label: 'Block: Wait A', start: 3, duration: 7, color: 'var(--pink)' }] }
        ]}
        legend={[
          { label: 'Lock A', color: 'var(--cyan)' },
          { label: 'Lock B', color: 'var(--yellow)' },
          { label: 'Deadlock block', color: 'var(--pink)' }
        ]}
      />
    );
  }
  if (id === 'tcp-udp') {
    return (
      <ConcurrencyTimeline
        timelines={[
          { name: 'TCP Stream', segments: [{ label: 'SYN handshake', start: 0, duration: 2, color: 'var(--cyan)' }, { label: 'ACK confirm', start: 2, duration: 2, color: 'var(--green)' }, { label: 'Ordered packet transfer', start: 4, duration: 6, color: 'var(--cyan)' }] },
          { name: 'UDP Stream', segments: [{ label: 'Unordered datagrams stream', start: 0, duration: 10, color: 'var(--yellow)' }] }
        ]}
        legend={[
          { label: 'Reliable TCP', color: 'var(--cyan)' },
          { label: 'Handshake stage', color: 'var(--green)' },
          { label: 'Fast UDP', color: 'var(--yellow)' }
        ]}
      />
    );
  }
  if (id === 'http-https') {
    return (
      <ConcurrencyTimeline
        timelines={[
          { name: 'HTTP (80)', segments: [{ label: 'Cleartext package transmission', start: 0, duration: 10, color: 'var(--pink)' }] },
          { name: 'HTTPS (443)', segments: [{ label: 'TLS Asymmetric Handshake', start: 0, duration: 3, color: 'var(--cyan)' }, { label: 'Symmetric Encrypted session', start: 3, duration: 7, color: 'var(--green)' }] }
        ]}
        legend={[
          { label: 'Vulnerable plaintext', color: 'var(--pink)' },
          { label: 'Asymmetric Handshake', color: 'var(--cyan)' },
          { label: 'Encrypted tunnel', color: 'var(--green)' }
        ]}
      />
    );
  }
  if (id === 'zombie-process') {
    return (
      <ConcurrencyTimeline
        timelines={[
          { name: 'Child process', segments: [{ label: 'Executing tasks', start: 0, duration: 4, color: 'var(--cyan)' }, { label: 'Exit: Zombie status Z', start: 4, duration: 6, color: 'var(--pink)' }] },
          { name: 'Parent process', segments: [{ label: 'Running task loop', start: 0, duration: 8, color: 'var(--green)' }, { label: 'wait() / reap child', start: 8, duration: 2, color: 'var(--cyan)' }] }
        ]}
        legend={[
          { label: 'Active child', color: 'var(--cyan)' },
          { label: 'Zombie (Unreaped PID)', color: 'var(--pink)' },
          { label: 'Parent active', color: 'var(--green)' }
        ]}
      />
    );
  }
  if (id === 'daemon-process') {
    return (
      <ConcurrencyTimeline
        timelines={[
          { name: 'Parent TTY', segments: [{ label: 'Spawn process & exit', start: 0, duration: 2, color: 'var(--pink)' }] },
          { name: 'Daemon task', segments: [{ label: 'setsid() session leader', start: 2, duration: 2, color: 'var(--cyan)' }, { label: 'Run background service', start: 4, duration: 6, color: 'var(--green)' }] }
        ]}
        legend={[
          { label: 'TTY Session parent', color: 'var(--pink)' },
          { label: 'Detached setsid()', color: 'var(--cyan)' },
          { label: 'Continuous Daemon daemon', color: 'var(--green)' }
        ]}
      />
    );
  }
  if (id === 'kill-sigkill') {
    return (
      <ConcurrencyTimeline
        timelines={[
          { name: 'kill (SIGTERM)', segments: [{ label: 'Catch signal & cleanup', start: 0, duration: 3, color: 'var(--cyan)' }, { label: 'Graceful exit', start: 3, duration: 2, color: 'var(--green)' }] },
          { name: 'kill -9 (KILL)', segments: [{ label: 'Execute task', start: 0, duration: 2, color: 'var(--cyan)' }, { label: 'Immediate kernel destroy', start: 2, duration: 1, color: 'var(--pink)' }] }
        ]}
        legend={[
          { label: 'Executing program', color: 'var(--cyan)' },
          { label: 'Clean shut down', color: 'var(--green)' },
          { label: 'Force terminated', color: 'var(--pink)' }
        ]}
      />
    );
  }
  if (id === 'pipe-operator') {
    return (
      <ConcurrencyTimeline
        timelines={[
          { name: 'Command A', segments: [{ label: 'Print stdout data streams', start: 0, duration: 5, color: 'var(--cyan)' }] },
          { name: 'Kernel Buffer', segments: [{ label: 'Piping byte buffers', start: 0, duration: 10, color: 'var(--yellow)' }] },
          { name: 'Command B', segments: [{ label: 'Waiting for stream', start: 0, duration: 2, color: '#e0e0e0' }, { label: 'Read stdin data', start: 2, duration: 8, color: 'var(--green)' }] }
        ]}
        legend={[
          { label: 'Writer stdout', color: 'var(--cyan)' },
          { label: 'Buffer line', color: 'var(--yellow)' },
          { label: 'Reader stdin', color: 'var(--green)' }
        ]}
      />
    );
  }
  if (id === 'ssh-linux') {
    return (
      <ConcurrencyTimeline
        timelines={[
          { name: 'SSH Client', segments: [{ label: 'TCP Conn request', start: 0, duration: 2, color: 'var(--cyan)' }, { label: 'Asymmetric Handshake', start: 2, duration: 3, color: 'var(--yellow)' }, { label: 'Symmetric session', start: 5, duration: 5, color: 'var(--green)' }] },
          { name: 'SSH Daemon', segments: [{ label: 'Listen port 22', start: 0, duration: 2, color: 'var(--cyan)' }, { label: 'Verify PubKey match', start: 2, duration: 3, color: 'var(--purple)' }, { label: 'Execute Shell commands', start: 5, duration: 5, color: 'var(--green)' }] }
        ]}
        legend={[
          { label: 'Network connection', color: 'var(--cyan)' },
          { label: 'Handshake negotiation', color: 'var(--yellow)' },
          { label: 'Authenticated session', color: 'var(--green)' }
        ]}
      />
    );
  }
  if (id === 'env-variables') {
    return (
      <PipelineStepper
        runnerText="Trigger Environment load"
        steps={[
          { title: 'Load Profile', desc: 'Shell reads configuration files (.bashrc, .profile) on login.' },
          { title: 'Export variables', desc: 'Environment variables are loaded into active shell session memory (e.g. USER, PATH).' },
          { title: 'Command Search', desc: 'When user types a command, shell scans PATH directories sequentially to locate target binary.' }
        ]}
      />
    );
  }
  if (id === 'grep-find-locate') {
    return (
      <PipelineStepper
        runnerText="Simulate Find"
        steps={[
          { title: 'grep Command', desc: 'Searches matching string patterns inside files directly (scans file contents).' },
          { title: 'find Command', desc: 'Performs a live walk traversing the directory tree structure to match file names/sizes.' },
          { title: 'locate Command', desc: 'Instantly matches file names by reading a precompiled database index (mlocate.db).' }
        ]}
      />
    );
  }
  if (id === 'redirect-operators') {
    return (
      <PipelineStepper
        runnerText="Test Redirection"
        steps={[
          { title: 'Standard stdout', desc: 'Command prints output directly to active terminal screen (fd 1).' },
          { title: 'Overwrite (> file)', desc: 'Truncates target file content to 0 bytes, then writes new stdout data.' },
          { title: 'Append (>> file)', desc: 'Preserves existing file contents, writing new stdout data to end of file.' }
        ]}
      />
    );
  }

  // Fallback visualizer representation
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', border: '3px solid var(--border)', background: 'var(--bg)' }}>
      <AlertIcon size={28} />
      <span style={{ fontSize: '0.8rem', fontWeight: 800, marginTop: '0.5rem' }}>Visual concept Sketch parameter missing.</span>
      <span style={{ fontSize: '0.72rem', opacity: 0.6, marginTop: '0.2rem' }}>Refer to the explanation tab.</span>
    </div>
  );
}
