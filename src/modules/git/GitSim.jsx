// GitSim.jsx — Git Internals Simulator (Direct Mode)
import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import CommitGraph from './CommitGraph';
import GitStatePanel from './GitStatePanel';
import GitExplainPanel from './GitExplainPanel';
import GitTerminal from './GitTerminal';
import { createInitialState, dispatch, addFile, editFile } from './engine/gitEngine';

// ─── Guided Scenarios ────────────────────────────────────────────────────────
const GUIDED_SCENARIOS = {
    basic: {
        label: '📄 Basic Workflow',
        description: 'init → create files → add → commit → log',
        color: '#a8e6cf',
        steps: [
            { command: 'git init', args: {}, narration: ' git init — Creates a new repository. Git creates a hidden .git folder with an object store, HEAD pointer, and an unborn "main" branch.' },
            { type: 'file', filename: 'index.js', content: 'console.log("Hello World");', narration: '📄 A new file appears in the Working Directory with status "untracked" — Git knows nothing about it yet.' },
            { command: 'git status', args: {}, narration: ' git status compares Working Dir vs Staging Area vs last commit. index.js shows as Untracked.' },
            { command: 'git add', args: { file: '.' }, narration: 'git add moves index.js into the Staging Area (Index). Git creates a blob object with the file\'s SHA-1 hash.' },
            { command: 'git commit', args: { message: 'Initial commit' }, narration: '📸 git commit creates 3 objects: blob (file), tree (directory), commit (points to tree + parent). First node in the DAG!' },
            { type: 'file', filename: 'README.md', content: '# My Project\nThis is amazing.', narration: '📄 Create README.md — another untracked file in the working directory.' },
            { command: 'git add', args: { file: '.' }, narration: 'Stage README.md. Staging area now has the new file ready to snapshot.' },
            { command: 'git commit', args: { message: 'Add README' }, narration: '📸 Second commit! The DAG grows. Branch pointer "main" advances automatically.' },
            { command: 'git log', args: {}, narration: 'git log traverses the DAG backward via parentHashes — like following a chain back in time.' },
            { type: 'file', filename: 'app.js', content: 'const app = require("express")();', narration: '📄 Add app.js — Working Dir has a change again.' },
            { command: 'git add', args: { file: '.' }, narration: ' Stage app.js.' },
            { command: 'git commit', args: { message: 'Add Express app' }, narration: '📸 Third commit! You can see the linear history forming in the DAG.' },
            { command: 'git diff', args: {}, narration: ' git diff with a clean state shows nothing — confirms our working directory matches the committed snapshot.' },
        ],
    },
    branching: {
        label: '🌿 Branching & Merging',
        description: 'Feature branch → commits → 3-way merge',
        color: '#ffd93d',
        steps: [
            { command: 'git init', args: {}, narration: '🎉 Initialize the repository.' },
            { type: 'file', filename: 'app.js', content: 'const version = 1;', narration: '📄 Create app.js on main.' },
            { command: 'git add', args: { file: '.' }, narration: '📦 Stage app.js.' },
            { command: 'git commit', args: { message: 'Initial commit' }, narration: '📸 First commit on main. HEAD → main → this commit.' },
            { command: 'git branch', args: { name: 'feature' }, narration: '🏷️ Create "feature" branch — it\'s just a 41-byte file containing the current commit hash. Adding a branch is INSTANT and FREE.' },
            { command: 'git checkout', args: { branch: 'feature' }, narration: '🚪 HEAD moves to "feature". Watch the HEAD label in the DAG shift.' },
            { type: 'file', filename: 'feature.js', content: 'const newFeature = true;', narration: '📄 Create feature.js — only visible on this branch.' },
            { command: 'git add', args: { file: '.' }, narration: '📦 Stage feature.js.' },
            { command: 'git commit', args: { message: 'Add feature' }, narration: '📸 Commit on feature branch. The DAG now diverges from main!' },
            { type: 'file', filename: 'utils.js', content: 'const helper = () => {};', narration: '📄 Another feature branch file.' },
            { command: 'git add', args: { file: '.' }, narration: '📦 Stage utils.js.' },
            { command: 'git commit', args: { message: 'Add utils' }, narration: '📸 Second commit on feature. Feature is 2 commits ahead of main.' },
            { command: 'git checkout', args: { branch: 'main' }, narration: '🚪 Switch back to main. HEAD moves back.' },
            { type: 'file', filename: 'hotfix.js', content: 'const patch = "v1.0.1";', narration: '📄 A hotfix file on main — branches have now truly diverged!' },
            { command: 'git add', args: { file: '.' }, narration: '📦 Stage hotfix.' },
            { command: 'git commit', args: { message: 'Hotfix v1.0.1' }, narration: '📸 Commit on main. Now we need a 3-way merge (common ancestor exists).' },
            { command: 'git merge', args: { branch: 'feature', message: "Merge branch 'feature'" }, narration: '🔀 3-WAY MERGE! Git finds the common ancestor, combines changes from both branches, and creates a merge commit with TWO parent arrows in the DAG!' },
        ],
    },
    rebase: {
        label: '♻️ Rebase Deep Dive',
        description: 'See commits get replayed with new hashes',
        color: '#66d9ef',
        steps: [
            { command: 'git init', args: {}, narration: '🎉 Initialize repo.' },
            { type: 'file', filename: 'a.js', content: 'const A = 1;', narration: '📄 Create A.js on main.' },
            { command: 'git add', args: { file: '.' }, narration: '📦 Stage.' },
            { command: 'git commit', args: { message: 'Commit A' }, narration: '📸 Commit A on main.' },
            { type: 'file', filename: 'b.js', content: 'const B = 2;', narration: '📄 Create B.js.' },
            { command: 'git add', args: { file: '.' }, narration: '📦 Stage.' },
            { command: 'git commit', args: { message: 'Commit B' }, narration: '📸 Commit B. main: A → B' },
            { command: 'git branch', args: { name: 'feature' }, narration: '🏷️ Create feature branch at B.' },
            { command: 'git checkout', args: { branch: 'feature' }, narration: '🚪 Switch to feature.' },
            { type: 'file', filename: 'd.js', content: 'const D = 4;', narration: '📄 Create D.js on feature.' },
            { command: 'git add', args: { file: '.' }, narration: '📦 Stage D.' },
            { command: 'git commit', args: { message: 'Commit D' }, narration: '📸 Commit D on feature.' },
            { type: 'file', filename: 'e.js', content: 'const E = 5;', narration: '📄 Create E.js on feature.' },
            { command: 'git add', args: { file: '.' }, narration: '📦 Stage E.' },
            { command: 'git commit', args: { message: 'Commit E' }, narration: '📸 Commit E. feature: B → D → E' },
            { command: 'git checkout', args: { branch: 'main' }, narration: '🚪 Back to main.' },
            { type: 'file', filename: 'c.js', content: 'const C = 3;', narration: '📄 Create C.js on main — branches have diverged!' },
            { command: 'git add', args: { file: '.' }, narration: '📦 Stage C.' },
            { command: 'git commit', args: { message: 'Commit C' }, narration: '📸 Commit C on main. main: A → B → C. feature: A → B → D → E' },
            { command: 'git checkout', args: { branch: 'feature' }, narration: '🚪 Switch to feature to rebase it.' },
            { command: 'git rebase', args: { branch: 'main' }, narration: '♻️ REBASE! Git REPLAYS D and E on top of C. D and E get NEW commit hashes (D\' and E\'). The old D and E become orphaned. History becomes linear!' },
        ],
    },
    remote: {
        label: '🌐 Remote & GitHub Flow',
        description: 'clone → edit → push → fetch → pull',
        color: '#c3aed6',
        steps: [
            { command: 'git clone', args: { url: 'https://github.com/demo/project.git' }, narration: '📋 git clone copies ALL objects (commits, trees, blobs) from the remote. Sets up "origin" as the remote name. Both local and origin point to same commits.' },
            { type: 'file', filename: 'feature.js', content: 'const newFeature = true;', narration: '📄 Make a local change — this only exists in your working directory.' },
            { command: 'git add', args: { file: '.' }, narration: '📦 Stage the change.' },
            { command: 'git commit', args: { message: 'Add local feature' }, narration: '📸 Commit locally. Your main is now 1 commit AHEAD of origin/main.' },
            { type: 'file', filename: 'fix.js', content: 'const bugfix = true;', narration: '📄 Another local change.' },
            { command: 'git add', args: { file: '.' }, narration: '📦 Stage.' },
            { command: 'git commit', args: { message: 'Fix bug locally' }, narration: '📸 Second local commit. 2 commits ahead of remote now.' },
            { command: 'git push', args: { branch: 'main' }, narration: '🚀 PUSH! Git transfers ONLY the new objects (the 2 commits + their trees + blobs). Remote branch pointer advances to match local main.' },
            { command: 'git fetch', args: {}, narration: '⬇️ FETCH — downloads new remote commits without merging. Your local branches stay unchanged. Only origin/* refs update.' },
            { command: 'git pull', args: {}, narration: '⬇️🔀 PULL = fetch + merge in one step. Remote changes integrate into your local branch.' },
        ],
    },
};

// ─── Floating Quest Log & Narration HUD ───────────────────────────────────────
function GitQuestLog({ state }) {
    const [collapsed, setCollapsed] = useState(false);
    const isInitialized = state.initialized;
    const hasFiles = Object.keys(state.workingDirectory || {}).length > 0 || Object.keys(state.stagingArea || {}).length > 0 || Object.keys(state.commits || {}).length > 0;
    const hasStaged = Object.keys(state.stagingArea || {}).length > 0 || Object.keys(state.commits || {}).length > 0;
    const hasCommits = Object.keys(state.commits || {}).length > 0;

    const completedCount = [isInitialized, hasFiles, hasStaged, hasCommits].filter(Boolean).length;
    if (completedCount === 4) return null;

    return (
        <div style={{
            position: 'absolute',
            left: 12,
            top: '2.3rem',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid var(--border)',
            borderRadius: '6px',
            boxShadow: '3px 3px 0 var(--border)',
            padding: collapsed ? '0.3rem 0.5rem' : '0.5rem 0.65rem',
            width: collapsed ? 'auto' : '185px',
            zIndex: 10,
            fontSize: '0.7rem',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s ease',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', cursor: 'pointer' }} onClick={() => setCollapsed(!collapsed)}>
                <span style={{ fontWeight: 800, color: '#111' }}>
                    {collapsed ? '🎯 Quest' : '🎯 Git Quest'}
                </span>
                <span style={{ fontSize: '0.62rem', background: completedCount === 4 ? '#e8f5e9' : '#e0f7ff', padding: '0.05rem 0.35rem', borderRadius: 4, fontWeight: 700, color: completedCount === 4 ? '#2e7d32' : '#0288d1' }}>
                    {completedCount}/4
                </span>
            </div>
            {!collapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.35rem', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', opacity: isInitialized ? 0.6 : 1 }}>
                        <input type="checkbox" checked={isInitialized} readOnly style={{ pointerEvents: 'none', width: 12, height: 12 }} />
                        <span style={{ textDecoration: isInitialized ? 'line-through' : 'none', fontWeight: 600 }}>1. git init</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', opacity: hasFiles ? 0.6 : 1 }}>
                        <input type="checkbox" checked={hasFiles} readOnly style={{ pointerEvents: 'none', width: 12, height: 12 }} />
                        <span style={{ textDecoration: hasFiles ? 'line-through' : 'none', fontWeight: 600 }}>2. Create a file (+ File)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', opacity: hasStaged ? 0.6 : 1 }}>
                        <input type="checkbox" checked={hasStaged} readOnly style={{ pointerEvents: 'none', width: 12, height: 12 }} />
                        <span style={{ textDecoration: hasStaged ? 'line-through' : 'none', fontWeight: 600 }}>3. Stage changes</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', opacity: hasCommits ? 0.6 : 1 }}>
                        <input type="checkbox" checked={hasCommits} readOnly style={{ pointerEvents: 'none', width: 12, height: 12 }} />
                        <span style={{ textDecoration: hasCommits ? 'line-through' : 'none', fontWeight: 600 }}>4. Commit snapshot</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function FloatingNarration({ text, stepNum, totalSteps, color, isManual }) {
    const [collapsed, setCollapsed] = useState(false);
    if (!text) return null;

    return (
        <div style={{
            position: 'absolute',
            right: 12,
            top: '2.3rem',
            maxWidth: collapsed ? '110px' : '250px',
            background: color || '#fffbea',
            border: '2px solid var(--border)',
            borderRadius: '6px',
            boxShadow: '3px 3px 0 var(--border)',
            padding: collapsed ? '0.3rem 0.5rem' : '0.5rem 0.65rem',
            zIndex: 10,
            fontSize: '0.72rem',
            lineHeight: 1.3,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s ease',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', cursor: 'pointer' }} onClick={() => setCollapsed(!collapsed)}>
                <span style={{
                    fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.58rem',
                    background: 'rgba(0,0,0,0.08)', padding: '0.05rem 0.3rem', borderRadius: 3,
                }}>
                    {isManual ? '⌨️ MANUAL' : `📖 STEP ${stepNum}/${totalSteps}`}
                </span>
                <span style={{ fontSize: '0.55rem', opacity: 0.5 }}>{collapsed ? '▼' : '▲'}</span>
            </div>
            {!collapsed && (
                <div style={{ color: '#222', fontWeight: 600, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '0.3rem', marginTop: '0.15rem' }}>
                    {text}
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
    setOpen
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
                                <option key={f} value={f}>✏️ {f}</option>
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
    const navigate = useNavigate();

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

    // Scenario player state
    const [scenarioKey, setScenarioKey] = useState('basic');
    const [scenarioStep, setScenarioStep] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [speed, setSpeed] = useState(2000);
    const [currentNarration, setCurrentNarration] = useState('Repository initialized. Use the command panel below to run git commands, or press ▶ START to auto-play a guided scenario.');

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

    const timerRef = useRef(null);
    const stateRef = useRef(state);
    stateRef.current = state;
    const scenarioStepRef = useRef(scenarioStep);
    scenarioStepRef.current = scenarioStep;
    const isRunningRef = useRef(isRunning);
    isRunningRef.current = isRunning;
    const isPausedRef = useRef(isPaused);
    isPausedRef.current = isPaused;

    const scenario = GUIDED_SCENARIOS[scenarioKey];
    const totalSteps = scenario?.steps.length || 1;

    function executeStep(stepIndex) {
        if (!scenario || stepIndex >= scenario.steps.length) {
            setIsRunning(false);
            setIsFinished(true);
            setCurrentNarration('✅ Scenario complete! Run commands manually or reset.');
            return;
        }
        const step = scenario.steps[stepIndex];
        setCurrentNarration(step.narration || '');
        setIsManualNarration(false);

        if (step.type === 'file') {
            setState(prev => addFile(prev, step.filename, step.content));
            setScenarioStep(stepIndex + 1);
        } else {
            const currentState = stateRef.current;
            const { state: newState, output, explanation } = dispatch(currentState, step.command, step.args || {});
            const argsStr = Object.entries(step.args || {}).filter(([, v]) => v !== '' && v !== false && v !== null).map(([k, v]) => v === true ? `-${k}` : v).join(' ');
            const entry = { command: step.command, args: step.args, argsStr, output };
            setCommandLog(log => [...log, entry]);
            setLastCommand(entry);
            setLastExplanation(explanation);
            setState(newState);

            const rebaseDone = newState.events?.find(e => e.type === 'REBASE_DONE');
            if (rebaseDone) {
                setOrphanedHashes(rebaseDone.oldHashes || []);
                setTimeout(() => setOrphanedHashes([]), 2500);
            }

            const commitEvt = newState.events?.find(e => e.type === 'COMMIT' || e.type === 'MERGE_3WAY');
            const commitHash = commitEvt?.hash || commitEvt?.mergeHash;
            if (commitHash) {
                setHighlightHash(commitHash);
                clearTimeout(highlightTimerRef.current);
                highlightTimerRef.current = setTimeout(() => setHighlightHash(null), 2500);
            }

            setScenarioStep(stepIndex + 1);
        }
    }

    // Auto-play loop
    useEffect(() => {
        if (!isRunning || isPaused || isFinished) return;
        if (scenarioStep >= totalSteps) {
            setIsRunning(false);
            setIsFinished(true);
            setCurrentNarration('✅ Scenario complete! You can continue running commands manually.');
            return;
        }
        timerRef.current = setTimeout(() => {
            if (isRunningRef.current && !isPausedRef.current) {
                executeStep(scenarioStepRef.current);
            }
        }, scenarioStep === 0 ? 300 : speed);
        return () => clearTimeout(timerRef.current);
    }, [isRunning, isPaused, isFinished, scenarioStep, speed]);

    function handleStart() {
        // Reset state and start the selected scenario
        const s = createInitialState();
        setState(s);
        stateRef.current = s;
        setScenarioStep(0);
        setCommandLog([]);
        setLastCommand(null);
        setOrphanedHashes([]);
        setHighlightHash(null);
        setIsManualNarration(false);
        setIsRunning(true);
        setIsPaused(false);
        setIsFinished(false);
    }

    function handlePause() { setIsPaused(true); clearTimeout(timerRef.current); }
    function handleResume() { setIsPaused(false); }
    function handleStep() {
        if (isFinished) return;
        clearTimeout(timerRef.current);
        setIsPaused(true);
        executeStep(scenarioStepRef.current);
    }
    function handleReset() {
        clearTimeout(timerRef.current);
        navigate('/git');
    }

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

    // Resizable split handler
    function handleDividerDrag(clientY) {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const relY = clientY - rect.top;
        const min = 120, max = rect.height - 120;
        setDagHeightPx(Math.max(min, Math.min(max, relY)));
    }

    const scenarioColor = GUIDED_SCENARIOS[scenarioKey]?.color || '#fffbea';

    // ── Center Content ──────────────────────────────────────────────────────
    const centerContent = (
        <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

            {/* DAG Area */}
            <div style={{
                flexShrink: 0,
                height: dagHeightPx ? `${dagHeightPx}px` : '55%',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                position: 'relative',
            }}>
                <div style={{
                    padding: '0.4rem 0.75rem', background: '#f0fff4', borderBottom: '2px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: '0.7rem', fontWeight: 800, flexShrink: 0,
                }}>
                    <span>🌳 Commit DAG — {repoName}</span>
                    <span style={{ opacity: 0.5 }}>{Object.keys(state.commits).length} commit{Object.keys(state.commits).length !== 1 ? 's' : ''} · {Object.keys(state.branches).length} branch{Object.keys(state.branches).length !== 1 ? 'es' : ''}</span>
                </div>

                {/* HUD Overlays */}
                <GitQuestLog state={state} />
                <FloatingNarration
                    text={currentNarration}
                    stepNum={scenarioStep}
                    totalSteps={totalSteps}
                    color={isManualNarration ? '#e8f5e9' : scenarioColor}
                    isManual={isManualNarration}
                />

                <div style={{ flex: 1, overflow: 'auto' }}>
                    <CommitGraph
                        commits={state.commits}
                        branches={state.branches}
                        HEAD={state.HEAD}
                        remote={state.remote}
                        orphanedHashes={orphanedHashes}
                        highlightHash={highlightHash}
                    />
                </div>
            </div>

            {/* Drag Handle */}
            <ResizableDivider onDrag={handleDividerDrag} />

            {/* Terminal / Command Panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                <div style={{
                    padding: '0.35rem 0.75rem', background: '#1a1a2e', borderBottom: '2px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
                    fontSize: '0.7rem', fontWeight: 800, color: '#66d9ef',
                }}>
                    <span>⌨️ Command Panel{isRunning && !isPaused ? ' (scenario running…)' : ''}</span>
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
                    />
                </div>
                <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                    <GitTerminal onCommand={handleCommand} commandLog={commandLog} disabled={false} />
                </div>
            </div>
        </div>
    );

    // ── Scenario Picker (inline in top bar area) ────────────────────────────
    const scenarioPicker = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginRight: '0.5rem' }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase' }}>Guided:</span>
            <select
                value={scenarioKey}
                onChange={e => {
                    setScenarioKey(e.target.value);
                    setScenarioStep(0);
                    setIsRunning(false);
                    setIsPaused(false);
                    setIsFinished(false);
                }}
                style={{
                    fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.4rem',
                    border: '2px solid var(--border)', borderRadius: 4,
                    background: GUIDED_SCENARIOS[scenarioKey]?.color || '#fff',
                    cursor: 'pointer',
                }}
            >
                {Object.entries(GUIDED_SCENARIOS).map(([key, sc]) => (
                    <option key={key} value={key}>{sc.label}</option>
                ))}
            </select>
        </div>
    );

    return (
        <ImmersiveLayout
            isActive={true}
            title="Git Internals Simulator"
            icon="🌿"
            moduleLabel={`Module 5 · Git & GitHub`}
            isRunning={isRunning}
            isPaused={isPaused}
            isFinished={isFinished}
            speed={speed}
            onSpeedChange={setSpeed}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onReset={handleReset}
            onStep={handleStep}
            currentStepNum={scenarioStep}
            totalSteps={totalSteps}
            phaseName={
                isFinished ? '✅ Scenario complete' :
                    isRunning && !isPaused ? `Running step ${scenarioStep + 1}/${totalSteps}…` :
                        isPaused ? `Paused at step ${scenarioStep}/${totalSteps}` :
                            'Run commands below or ▶ START a guided scenario'
            }
            centerContent={centerContent}
            leftContent={<GitStatePanel state={state} conceptMode={conceptMode} onFileClick={triggerEditFile} />}
            rightContent={<GitExplainPanel lastCommand={lastCommand} explanation={lastExplanation} conceptMode={conceptMode} state={state} />}
            hideFooter={true}
            timelineItems={[]}
            legend={[]}
            conceptMode={conceptMode}
            onConceptModeToggle={() => setConceptMode(m => !m)}
            scenarioPicker={scenarioPicker}
        />
    );
}
