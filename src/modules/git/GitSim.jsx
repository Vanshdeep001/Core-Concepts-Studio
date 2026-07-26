// GitSim.jsx — Git Internals Simulator (Direct Mode)
import { useState, useCallback, useRef, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import useSnapshot from '../../hooks/useSnapshot';
import CommitGraph from './CommitGraph';
import GitStatePanel from './GitStatePanel';
import GitExplainPanel from './GitExplainPanel';
import GitTerminal from './GitTerminal';
import { createInitialState, dispatch, addFile, editFile } from './engine/gitEngine';
import { GitBranchIcon } from '../../components/Icons';



// ─── Status Strip: Quest progress + narration (in-flow, under DAG header) ──────
function GitStatusStrip({ state, narration, isMobile }) {
    const isInitialized = state.initialized;
    const hasFiles = Object.keys(state.workingDirectory || {}).length > 0 || Object.keys(state.stagingArea || {}).length > 0 || Object.keys(state.commits || {}).length > 0;
    const hasStaged = Object.keys(state.stagingArea || {}).length > 0 || Object.keys(state.commits || {}).length > 0;
    const hasCommits = Object.keys(state.commits || {}).length > 0;

    const steps = [
        { label: 'git init', done: isInitialized },
        { label: 'Add file', done: hasFiles },
        { label: 'Stage', done: hasStaged },
        { label: 'Commit', done: hasCommits },
    ];
    const completed = steps.filter(s => s.done).length;
    const questComplete = completed === 4;
    const currentIdx = steps.findIndex(s => !s.done);

    return (
        <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: isMobile ? '0.4rem' : '0.65rem',
            padding: isMobile ? '0.4rem 0.5rem' : '0.45rem 0.75rem',
            borderBottom: '2px solid var(--border)',
            background: '#f6fbf8',
            flexShrink: 0,
        }}>
            {/* Quest progress stepper */}
            {!questComplete && (
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.25rem' : '0.35rem', flexWrap: 'wrap' }}>
                    <span style={{
                        fontSize: isMobile ? '0.56rem' : '0.62rem', fontWeight: 800,
                        background: '#e0f7ff', color: '#0277bd', whiteSpace: 'nowrap',
                        padding: '0.12rem 0.4rem', borderRadius: 4, border: '2px solid var(--border)',
                    }}>
                        QUEST {completed}/4
                    </span>
                    {steps.map((s, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                            padding: isMobile ? '0.12rem 0.3rem' : '0.15rem 0.45rem',
                            border: `2px solid ${i === currentIdx ? '#000' : 'var(--border)'}`,
                            borderRadius: 5, whiteSpace: 'nowrap',
                            background: s.done ? '#c8f0d8' : (i === currentIdx ? '#fffbea' : 'var(--white)'),
                            fontSize: isMobile ? '0.56rem' : '0.66rem', fontWeight: 700,
                        }}>
                            <span style={{
                                fontWeight: 900, color: s.done ? '#2e7d32' : '#999',
                                fontFamily: s.done ? 'inherit' : 'var(--font-mono)',
                            }}>{s.done ? '✓' : i + 1}</span>
                            <span style={{ textDecoration: s.done ? 'line-through' : 'none', color: '#222' }}>{s.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Divider */}
            {!questComplete && !isMobile && (
                <div style={{ width: 2, alignSelf: 'stretch', background: 'var(--border)', opacity: 0.3, flexShrink: 0 }} />
            )}

            {/* Narration / info */}
            {narration && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', flex: 1, minWidth: 0 }}>
                    <span style={{
                        fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.54rem',
                        background: 'rgba(0,0,0,0.08)', padding: '0.12rem 0.35rem', borderRadius: 3,
                        flexShrink: 0, marginTop: '0.1rem',
                    }}>INFO</span>
                    <span style={{
                        fontSize: isMobile ? '0.62rem' : '0.72rem', fontWeight: 600,
                        color: '#222', lineHeight: 1.35, minWidth: 0,
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>{narration}</span>
                </div>
            )}
        </div>
    );
}

// ─── Resizable Divider ─────────────────────────────────────────────────────────
function ResizableDivider({ onDrag }) {
    const dragging = useRef(false);

    const handleMouseDown = (e) => {
        dragging.current = true;
        e.preventDefault();

        const onMouseMove = (ev) => {
            if (dragging.current) onDrag(ev.clientY);
        };
        const onMouseUp = () => {
            dragging.current = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    return (
        <div
            onMouseDown={handleMouseDown}
            style={{
                height: 8, flexShrink: 0, cursor: 'row-resize',
                background: 'var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                userSelect: 'none',
                transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--cyan)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--border)'}
        >
            <div style={{ width: 40, height: 3, background: 'rgba(255,255,255,0.5)', borderRadius: 2 }} />
        </div>
    );
}

// ─── File Editor Bar ───────────────────────────────────────────────────────────
function FileEditorBar({ 
    state, 
    onAddFile, 
    onEditFile,
    filename,
    setFilename,
    content,
    setContent,
    open,
    setOpen,
    isMobile
}) {
    const allFiles = { ...(state.currentFiles || {}), ...(state.workingDirectory || {}) };
    const fileList = Object.keys(allFiles);

    function handleSubmit() {
        if (!filename.trim()) return;
        if (allFiles[filename] !== undefined) onEditFile(filename, content);
        else onAddFile(filename, content);
        setFilename(''); setContent(''); setOpen(false);
    }

    function handleSelectFile(e) {
        const selected = e.target.value;
        if (selected === '__new__') {
            setFilename('');
            setContent('');
        } else if (selected && allFiles[selected] !== undefined) {
            setFilename(selected);
            setContent(allFiles[selected] || '');
        }
    }

    if (isMobile && open) {
        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(3px)',
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem'
            }}>
                <div style={{
                    background: 'var(--white)',
                    border: '3px solid var(--border)',
                    borderRadius: '8px',
                    boxShadow: '6px 6px 0 var(--border)',
                    padding: '1rem',
                    width: '100%',
                    maxWidth: '300px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.8rem',
                    color: 'var(--text)'
                }}>
                    <div style={{ fontWeight: 800, fontSize: '0.8rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#111' }}>
                        <span>📁 Add / Edit File</span>
                        <button onClick={() => setOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 900, fontSize: '0.8rem', color: '#111' }}>✕</button>
                    </div>

                    {fileList.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.6, color: '#444' }}>SELECT EXISTING OR CREATE NEW:</span>
                            <select
                                onChange={handleSelectFile}
                                value={fileList.includes(filename) ? filename : '__new__'}
                                style={{
                                    fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                                    padding: '0.3rem', border: '2px solid var(--border)',
                                    borderRadius: 4, background: 'white', cursor: 'pointer',
                                    width: '100%', color: '#111'
                                }}
                            >
                                <option value="__new__">+ New File...</option>
                                {fileList.map(f => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.6, color: '#444' }}>FILENAME:</span>
                        <input value={filename} onChange={e => setFilename(e.target.value)} placeholder="filename.ext"
                            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', padding: '0.3rem', border: '2px solid var(--border)', borderRadius: 4, width: '100%', color: '#111', background: '#fff' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.6, color: '#444' }}>CONTENT:</span>
                        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="File content..." rows={3}
                            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', padding: '0.3rem', border: '2px solid var(--border)', borderRadius: 4, width: '100%', resize: 'vertical', color: '#111', background: '#fff' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                        <button onClick={handleSubmit} style={{ flex: 1, padding: '0.4rem', fontWeight: 800, fontSize: '0.75rem', border: '2px solid var(--border)', borderRadius: 4, background: '#a8e6cf', cursor: 'pointer', color: '#111' }}>Save File</button>
                        <button onClick={() => setOpen(false)} style={{ padding: '0.4rem 0.8rem', fontWeight: 800, fontSize: '0.75rem', border: '2px solid var(--border)', borderRadius: 4, background: '#f8d7da', cursor: 'pointer', color: '#111' }}>Cancel</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {open ? (
                <>
                    {fileList.length > 0 && (
                        <select
                            onChange={handleSelectFile}
                            value={fileList.includes(filename) ? filename : '__new__'}
                            style={{
                                fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                                padding: '0.2rem 0.35rem', border: '2px solid var(--border)',
                                borderRadius: 4, background: 'white', cursor: 'pointer',
                                maxWidth: 120
                            }}
                        >
                            <option value="__new__">+ New File...</option>
                            {fileList.map(f => (
                                <option key={f} value={f}>{f}</option>
                            ))}
                        </select>
                    )}
                    <input value={filename} onChange={e => setFilename(e.target.value)} placeholder="filename.ext"
                        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', padding: '0.2rem 0.35rem', border: '2px solid var(--border)', borderRadius: 4, width: 110 }} />
                    <input value={content} onChange={e => setContent(e.target.value)} placeholder="content..."
                        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', padding: '0.2rem 0.35rem', border: '2px solid var(--border)', borderRadius: 4, width: 150 }} />
                    <button onClick={handleSubmit} style={{ padding: '0.2rem 0.5rem', fontWeight: 800, fontSize: '0.7rem', border: '2px solid var(--border)', borderRadius: 4, background: '#a8e6cf', cursor: 'pointer' }}>✓</button>
                    <button onClick={() => setOpen(false)} style={{ padding: '0.2rem 0.4rem', fontWeight: 800, fontSize: '0.7rem', border: '2px solid var(--border)', borderRadius: 4, background: '#f8d7da', cursor: 'pointer' }}>✕</button>
                </>
            ) : (
                <button onClick={() => setOpen(true)}
                    style={{ padding: '0.2rem 0.6rem', fontWeight: 800, fontSize: '0.7rem', border: '2px solid var(--border)', borderRadius: 4, background: '#a8e6cf', cursor: 'pointer' }}>
                    + File
                </button>
            )}
        </div>
    );
}

// ─── Main GitSim Component ────────────────────────────────────────────────────
export default function GitSim() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auto-init: start with git init already run
    const [initState] = useState(() => {
        const s = createInitialState();
        const { state: inited } = dispatch(s, 'git init', {});
        return inited;
    });

    const [state, setState] = useState(initState);
    const [repoName] = useState('my-project');
    const [commandLog, setCommandLog] = useState([]);
    const [lastCommand, setLastCommand] = useState(null);
    const [lastExplanation, setLastExplanation] = useState(null);
    const [conceptMode, setConceptMode] = useState(true);
    const [orphanedHashes, setOrphanedHashes] = useState([]);
    const [highlightHash, setHighlightHash] = useState(null);
    const [isManualNarration, setIsManualNarration] = useState(false);
    const highlightTimerRef = useRef(null);

    // Narration state
    const [currentNarration, setCurrentNarration] = useState('Repository initialized. Use the command panel below to run git commands.');

    const stateRef = useRef(state);
    stateRef.current = state;

    // Layout: resizable DAG / Terminal split
    const containerRef = useRef(null);
    const [dagHeightPx, setDagHeightPx] = useState(null);

    // Editor state lifted up
    const [editorFilename, setEditorFilename] = useState('');
    const [editorContent, setEditorContent] = useState('');
    const [editorOpen, setEditorOpen] = useState(false);

    const triggerEditFile = useCallback((filename, content) => {
        setEditorFilename(filename);
        setEditorContent(content || '');
        setEditorOpen(true);
    }, []);

    // Manual command runner (from terminal)
    const handleCommand = useCallback((cmd, args) => {
        const currentState = stateRef.current;
        const result = dispatch(currentState, cmd, args);
        const { state: newState, output, explanation } = result;
        const events = newState.events || [];

        setState(newState);

        const argsStr = Object.entries(args || {})
            .filter(([, v]) => v !== '' && v !== false && v !== null && v !== undefined)
            .map(([k, v]) => v === true ? `-${k}` : v).join(' ');

        const entry = { command: cmd, args, argsStr, output };
        setCommandLog(log => [...log, entry]);
        setLastCommand(entry);
        setLastExplanation(explanation);

        // Build narration: show actual output + explanation + next step hint
        const explText = explanation?.beginner || '';

        const isNoOp = output.includes('Nothing to commit') || output.includes('Nothing to add')
            || output.includes('No local changes') || output.includes('not found')
            || output.includes('error:') || output.includes('Already up to date')
            || output.includes('No differences') || output.includes('Specify a');

        const nextStepHints = {
            'git init': '→ Next: Click "+ File" (top right) to create a file, then use git add and git commit.',
            'git clone': '→ Next: Edit files with "+ File", then git add → git commit → git push.',
            'git add': '→ Next: Run git commit to save a snapshot of your staged files.',
            'git commit': '→ Next: Keep building! Create more files, branches, or try git log.',
        };
        const hint = !isNoOp ? (nextStepHints[cmd] || '') : '';

        let narration;
        if (isNoOp) {
            narration = `⚠️ ${output}`;
            if (output.includes('Nothing to commit')) {
                narration += ' → Create a file with "+ File" button, then run git add first.';
            } else if (output.includes('Nothing to add')) {
                narration += ' → Create a file first using the "+ File" button (top right of command panel).';
            }
        } else {
            narration = `${output}${hint ? ` ${hint}` : ''}`;
        }

        setCurrentNarration(narration);
        setIsManualNarration(true);

        // Highlight newly created commit
        clearTimeout(highlightTimerRef.current);
        const commitEvt = events.find(e => e.type === 'COMMIT' || e.type === 'MERGE_COMMIT' || e.type === 'MERGE_3WAY');
        const commitHash = commitEvt?.hash || commitEvt?.mergeHash;
        if (commitHash) {
            setHighlightHash(commitHash);
            highlightTimerRef.current = setTimeout(() => setHighlightHash(null), 2500);
        } else {
            setHighlightHash(null);
        }

        // Rebase orphan animation
        const rebaseDone = events.find(e => e.type === 'REBASE_DONE');
        if (rebaseDone) {
            setOrphanedHashes(rebaseDone.oldHashes || []);
            setTimeout(() => setOrphanedHashes([]), 2500);
        }
    }, []);


    const handleAddFile = useCallback((filename, content) => setState(addFile(stateRef.current, filename, content)), []);
    const handleEditFile = useCallback((filename, content) => setState(editFile(stateRef.current, filename, content)), []);

    // Clear everything and start over from a fresh `git init` repo.
    const handleReset = useCallback(() => {
        if (!window.confirm('Reset the simulator? This clears all commits, branches, files and history.')) return;
        const s = createInitialState();
        const { state: fresh } = dispatch(s, 'git init', {});
        clearTimeout(highlightTimerRef.current);
        setState(fresh);
        setCommandLog([]);
        setLastCommand(null);
        setLastExplanation(null);
        setOrphanedHashes([]);
        setHighlightHash(null);
        setEditorFilename('');
        setEditorContent('');
        setEditorOpen(false);
        setCurrentNarration('Repository reset. Fresh repo initialized — start again from git init.');
        setIsManualNarration(false);
    }, []);

    // Resizable split handler
    function handleDividerDrag(clientY) {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const relY = clientY - rect.top;
        const min = 120, max = rect.height - 120;
        setDagHeightPx(Math.max(min, Math.min(max, relY)));
    }



    // ── Center Content ──────────────────────────────────────────────────────
    const centerContent = (
        <div ref={containerRef} className="git-scroll" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

            {/* DAG Area */}
            <div style={{
                flexShrink: 0,
                height: isMobile ? '50%' : (dagHeightPx ? `${dagHeightPx}px` : '55%'),
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                position: 'relative',
            }}>
                <div style={{
                    padding: isMobile ? '0.3rem 0.5rem' : '0.4rem 0.75rem', background: '#f0fff4', borderBottom: '2px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: isMobile ? '0.6rem' : '0.7rem', fontWeight: 800, flexShrink: 0,
                }}>
                    <span><GitBranchIcon size={isMobile ? 12 : 14} /> {isMobile ? 'DAG' : `Commit DAG — ${repoName}`}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.4rem' : '0.6rem' }}>
                        <span style={{ opacity: 0.5, fontSize: isMobile ? '0.55rem' : 'inherit' }}>{Object.keys(state.commits).length} commit{Object.keys(state.commits).length !== 1 ? 's' : ''}{!isMobile && ` · ${Object.keys(state.branches).length} branch${Object.keys(state.branches).length !== 1 ? 'es' : ''}`}</span>
                        <button
                            onClick={handleReset}
                            title="Clear everything and start over"
                            style={{
                                padding: isMobile ? '0.15rem 0.4rem' : '0.2rem 0.55rem',
                                fontSize: isMobile ? '0.55rem' : '0.65rem', fontWeight: 800,
                                border: '2px solid var(--border)', borderRadius: 5, cursor: 'pointer',
                                background: '#ffd0d0', color: '#111', flexShrink: 0,
                                boxShadow: '2px 2px 0 var(--border)',
                            }}
                            onMouseDown={e => e.currentTarget.style.transform = 'translate(2px,2px)'}
                            onMouseUp={e => e.currentTarget.style.transform = ''}
                            onMouseLeave={e => e.currentTarget.style.transform = ''}
                        >
                            ↺ Reset
                        </button>
                    </div>
                </div>

                {/* Quest progress + narration strip (in-flow, no overlap) */}
                <GitStatusStrip state={state} narration={currentNarration} isMobile={isMobile} />

                <div style={{ flex: 1, overflow: 'auto' }}>
                    <CommitGraph
                        commits={state.commits}
                        branches={state.branches}
                        HEAD={state.HEAD}
                        remote={state.remote}
                        orphanedHashes={orphanedHashes}
                        highlightHash={highlightHash}
                        isMobile={isMobile}
                    />
                </div>
            </div>

            {/* Drag Handle */}
            {!isMobile && <ResizableDivider onDrag={handleDividerDrag} />}

            {/* Terminal / Command Panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                <div style={{
                    padding: isMobile ? '0.25rem 0.5rem' : '0.35rem 0.75rem', background: '#1a1a2e', borderBottom: '2px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
                    fontSize: isMobile ? '0.6rem' : '0.7rem', fontWeight: 800, color: '#66d9ef',
                }}>
                    <span>⌨️ Command Panel</span>
                    <FileEditorBar 
                        state={state} 
                        onAddFile={handleAddFile} 
                        onEditFile={handleEditFile}
                        filename={editorFilename}
                        setFilename={setEditorFilename}
                        content={editorContent}
                        setContent={setEditorContent}
                        open={editorOpen}
                        setOpen={setEditorOpen}
                        isMobile={isMobile}
                    />
                </div>
                <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                    <GitTerminal onCommand={handleCommand} disabled={false} isMobile={isMobile} />
                </div>
            </div>
        </div>
    );



    
    useSnapshot(useCallback((config, step) => {
        if (config.state !== undefined) setState(config.state);
        if (config.editorFilename !== undefined) setEditorFilename(config.editorFilename);
        if (config.editorContent !== undefined) setEditorContent(config.editorContent);

        setTimeout(() => {

        }, 50);
    }, []));

    return (
        <ImmersiveLayout
            isActive={true}
            snapshotData={{
                config: { state, editorFilename, editorContent },
                step: 0
            }}
            title="Git Internals Simulator"
            icon={<GitBranchIcon size={20} />}
            moduleLabel={`Module 5 · Git & GitHub`}
            centerContent={centerContent}
            leftContent={<GitStatePanel state={state} conceptMode={conceptMode} onFileClick={triggerEditFile} commandLog={commandLog} />}
            rightContent={<GitExplainPanel lastCommand={lastCommand} explanation={lastExplanation} conceptMode={conceptMode} state={state} />}
            hideFooter={true}
            conceptMode={conceptMode}
            onConceptModeToggle={() => setConceptMode(m => !m)}
            hideControls={true}
        />
    );
}
