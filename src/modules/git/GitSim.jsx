// GitSim.jsx — Git Internals Simulator with Guided Scenarios + Resizable Layout
import { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
            { command: 'git log', args: {}, narration: ' git log traverses the DAG backward via parentHashes — like following a chain back in time.' },
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

const SPEED_OPTIONS = [
    { ms: 3000, label: '0.5×' },
    { ms: 2000, label: '1×' },
    { ms: 1200, label: '2×' },
    { ms: 600, label: '4×' },
];

// ─── Config Panel ─────────────────────────────────────────────────────────────
function ConfigPanel({ onLaunch }) {
    const [repoName, setRepoName] = useState('my-project');
    const [selectedScenario, setSelectedScenario] = useState('basic');

    return (
        <div className="main-content">
            <div style={{ marginBottom: '0.4rem' }}>
                <Link to="/git" style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.6, textDecoration: 'none' }}>← Git Module</Link>
            </div>
            <div style={{ marginBottom: '2rem' }}>
                <div className="section-header">Module 5 · Git & GitHub</div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>🌿 Git Internals Simulator</h1>
                <p style={{ opacity: 0.6, fontSize: '0.92rem', marginTop: '0.3rem' }}>
                    Pick a guided scenario and watch Git's internal model evolve step by step — DAG, staging, branching, merging, rebasing.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Scenario Selection */}
                <div>
                    <div className="panel">
                        <div className="panel-header" style={{ background: 'var(--green)' }}>🎬 Choose a Scenario</div>
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {Object.entries(GUIDED_SCENARIOS).map(([key, scenario]) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedScenario(key)}
                                    style={{
                                        padding: '0.75rem 1rem', textAlign: 'left',
                                        border: `2px solid ${selectedScenario === key ? '#000' : 'var(--border)'}`,
                                        borderRadius: 8, cursor: 'pointer',
                                        background: selectedScenario === key ? scenario.color : 'var(--white)',
                                        transition: 'all 0.12s',
                                    }}
                                >
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{scenario.label}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.65, marginTop: '0.2rem' }}>{scenario.description}</div>
                                    <div style={{ marginTop: '0.4rem', fontSize: '0.68rem', fontWeight: 700, opacity: 0.5 }}>
                                        {scenario.steps.length} steps
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right side info */}
                <div>
                    <div className="panel" style={{ marginBottom: '1.25rem' }}>
                        <div className="panel-header" style={{ background: GUIDED_SCENARIOS[selectedScenario].color }}>
                            {GUIDED_SCENARIOS[selectedScenario].label} — Preview
                        </div>
                        <div style={{ padding: '1rem' }}>
                            {GUIDED_SCENARIOS[selectedScenario].steps.map((step, i) => (
                                <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem', fontSize: '0.8rem' }}>
                                    <span style={{ opacity: 0.35, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{i + 1}.</span>
                                    <span style={{ fontFamily: step.type === 'file' ? 'inherit' : 'var(--font-mono)', fontWeight: step.type === 'file' ? 400 : 700 }}>
                                        {step.type === 'file' ? `📄 create ${step.filename}` : step.command + (step.args?.name ? ` ${step.args.name}` : step.args?.message ? ` -m "${step.args.message}"` : step.args?.branch ? ` ${step.args.branch}` : step.args?.file ? ` ${step.args.file}` : '')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="panel">
                        <div className="panel-header" style={{ background: 'var(--cyan)' }}>🗂️ Repo Name</div>
                        <div style={{ padding: '1rem' }}>
                            <input value={repoName} onChange={e => setRepoName(e.target.value)}
                                style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', padding: '0.4rem 0.6rem', border: '2px solid var(--border)', borderRadius: 6, boxSizing: 'border-box' }} />
                            <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.5rem' }}>
                                You can also run commands manually at any time during the simulation using the Command Panel.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <motion.div style={{ marginTop: '2rem', textAlign: 'center' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <button
                    onClick={() => onLaunch(selectedScenario, repoName)}
                    className="btn"
                    style={{ background: 'var(--green)', fontSize: '1.1rem', fontWeight: 800, padding: '0.9rem 2.5rem', border: '3px solid var(--border)', boxShadow: '4px 4px 0 var(--border)', cursor: 'pointer' }}
                >
                    🚀 Launch Simulator
                </button>
            </motion.div>
        </div>
    );
}

// ─── Narration Banner ──────────────────────────────────────────────────────────
function NarrationBanner({ text, stepNum, totalSteps, color, isManual }) {
    if (!text) return null;
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={text}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                style={{
                    padding: '0.55rem 1rem',
                    background: color || '#fffbea',
                    borderBottom: '2px solid var(--border)',
                    fontSize: '0.82rem', lineHeight: 1.5,
                    display: 'flex', gap: '0.65rem', alignItems: 'flex-start',
                    flexShrink: 0,
                }}
            >
                <span style={{
                    fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.68rem',
                    background: 'rgba(0,0,0,0.12)', padding: '0.12rem 0.4rem', borderRadius: 4,
                    flexShrink: 0, whiteSpace: 'nowrap',
                }}>
                    {isManual ? '⌨ manual' : `${stepNum}/${totalSteps}`}
                </span>
                <span>{text}</span>
            </motion.div>
        </AnimatePresence>
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
function FileEditorBar({ state, onAddFile, onEditFile }) {
    const [filename, setFilename] = useState('');
    const [content, setContent] = useState('');
    const [open, setOpen] = useState(false);

    function handleSubmit() {
        if (!filename.trim()) return;
        const allFiles = { ...(state.currentFiles || {}), ...(state.workingDirectory || {}) };
        if (allFiles[filename]) onEditFile(filename, content);
        else onAddFile(filename, content);
        setFilename(''); setContent(''); setOpen(false);
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {open ? (
                <>
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
    const [isActive, setIsActive] = useState(false);
    const [state, setState] = useState(createInitialState());
    const [repoName, setRepoName] = useState('my-project');
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
    const [currentNarration, setCurrentNarration] = useState('');

    // Layout: resizable DAG / Terminal split
    const containerRef = useRef(null);
    const [dagHeightPx, setDagHeightPx] = useState(null); // null = auto (default 58%)

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
            setState(prev => {
                const { state: newState, output, explanation } = dispatch(prev, step.command, step.args || {});
                const argsStr = Object.entries(step.args || {}).filter(([, v]) => v !== '' && v !== false && v !== null).map(([k, v]) => v === true ? `-${k}` : v).join(' ');
                const entry = { command: step.command, args: step.args, argsStr, output };
                setCommandLog(log => [...log, entry]);
                setLastCommand(entry);
                setLastExplanation(explanation);

                const rebaseDone = newState.events?.find(e => e.type === 'REBASE_DONE');
                if (rebaseDone) {
                    setOrphanedHashes(rebaseDone.oldHashes || []);
                    setTimeout(() => setOrphanedHashes([]), 2500);
                }
                return newState;
            });
            setScenarioStep(stepIndex + 1);
        }
    }

    // Auto-play loop
    useEffect(() => {
        if (!isActive) return;
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
    }, [isActive, isRunning, isPaused, isFinished, scenarioStep, speed]);

    function handleLaunch(key, name) {
        setScenarioKey(key);
        setRepoName(name);
        setState(createInitialState());
        setCommandLog([]);
        setLastCommand(null);
        setLastExplanation(null);
        setOrphanedHashes([]);
        setScenarioStep(0);
        setIsRunning(false);
        setIsPaused(false);
        setIsFinished(false);
        setCurrentNarration('Press ▶ START to begin the guided scenario, or run commands manually below.');
        setIsActive(true);
    }

    function handleStart() {
        setScenarioStep(0);
        setState(createInitialState());
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
        setIsActive(false);
        setState(createInitialState());
        setCommandLog([]);
        setScenarioStep(0);
        setIsRunning(false);
        setIsPaused(false);
        setIsFinished(false);
        setCurrentNarration('');
        setOrphanedHashes([]);
    }

    // Build narration text for a manual command
    function buildManualNarration(cmd, events, explanation, conceptMode) {
        // Use the engine explanation first
        const base = conceptMode ? explanation?.beginner : explanation?.advanced;
        if (base) return base;
        // Fallback per command
        const map = {
            'git init': '🎉 .git folder created. HEAD → unborn main branch. Object store ready.',
            'git add': '📦 Files moved from Working Directory → Staging Area (Index). Blob objects created.',
            'git commit': '📸 Snapshot created: blob → tree → commit object. Branch pointer advances.',
            'git status': '🔍 Comparing Working Dir vs Index vs HEAD commit.',
            'git log': '📖 Traversing DAG backward via parentHashes from HEAD.',
            'git branch': '🏷️ New branch = 41-byte ref file pointing to current commit. Free and instant.',
            'git checkout': '🚪 HEAD moves. Working directory restored to target commit snapshot.',
            'git switch': '🚪 HEAD moves to new branch.',
            'git merge': '🔀 Git finds common ancestor. Combines changes. May create merge commit (2 parents).',
            'git rebase': '♻️ Commits replayed on new base with NEW hashes. History becomes linear.',
            'git reset': '⏮️ Branch pointer moved. Working dir / staging may be affected by mode.',
            'git stash': '🗄️ WD + staging saved to stash stack. Working dir becomes clean.',
            'git push': '🚀 New objects sent to remote. Remote branch pointer advances.',
            'git pull': '⬇️🔀 fetch + merge. Remote commits integrated into local branch.',
            'git fetch': '⬇️ Remote objects downloaded. Local branches NOT changed.',
            'git clone': '📋 Full copy of remote repo. origin/* remote-tracking refs set up.',
            'git diff': '🔎 Shows unstaged changes between Working Dir and Index.',
            'git restore': '↩️ File reverted to committed state.',
            'git tag': '🔖 Lightweight tag = fixed pointer to a commit (doesn\'t move).',
        };
        return map[cmd] || `Executed ${cmd}.`;
    }

    // Manual command runner (from terminal)
    const handleCommand = useCallback((cmd, args) => {
        // Capture result outside setState so we can use it for side effects
        let captured = null;

        setState(prev => {
            const result = dispatch(prev, cmd, args);
            captured = result; // capture before React may re-run updater
            return result.state;
        });

        // Schedule side effects AFTER setState (microtask ensures capture is set)
        Promise.resolve().then(() => {
            if (!captured) return;
            const { output, explanation } = captured;
            const events = captured.state?.events || [];

            const argsStr = Object.entries(args || {})
                .filter(([, v]) => v !== '' && v !== false && v !== null && v !== undefined)
                .map(([k, v]) => v === true ? `-${k}` : v).join(' ');

            const entry = { command: cmd, args, argsStr, output };
            setCommandLog(log => [...log, entry]);
            setLastCommand(entry);
            setLastExplanation(explanation);

            // Narration
            const base = explanation?.beginner;
            const fallbackMap = {
                'git init': '🎉 .git folder created. HEAD → unborn main branch. Object store ready.',
                'git add': '📦 Files moved from Working Directory → Staging Area. Blob objects created.',
                'git commit': '📸 Snapshot: blob → tree → commit. Branch pointer advances to new commit.',
                'git status': '🔍 Comparing Working Dir vs Index vs HEAD commit snapshot.',
                'git log': '📖 Traversing DAG backward via parentHashes from HEAD.',
                'git branch': '🏷️ Branch = 41-byte ref file → current commit. Free + instant.',
                'git checkout': '🚪 HEAD moves. Working directory restored to that commit snapshot.',
                'git switch': '🚪 HEAD moves to new branch. Files update to match commit.',
                'git merge': '🔀 Common ancestor found. Changes combined. Merge commit may have 2 parents.',
                'git rebase': '♻️ Commits replayed on new base with NEW hashes. History becomes linear.',
                'git reset': '⏮️ Branch pointer moved. WD/staging change based on mode (soft/mixed/hard).',
                'git stash': '🗄️ WD + staging saved to stash stack. Working dir becomes clean.',
                'git push': '🚀 New objects sent to remote. Remote branch pointer advances.',
                'git pull': '⬇️🔀 fetch + merge. Remote commits integrated into local branch.',
                'git fetch': '⬇️ Remote objects downloaded. Local branches NOT changed.',
                'git clone': '📋 Full copy of remote repo. origin/* remote-tracking refs created.',
                'git diff': '🔎 Shows unstaged changes between Working Dir and Index.',
                'git restore': '↩️ File reverted to last committed state.',
                'git tag': '🔖 Fixed pointer to a commit (doesn\'t move like a branch).',
            };
            setCurrentNarration(base || fallbackMap[cmd] || `Ran ${cmd}.`);
            setIsManualNarration(true);

            // Highlight newly created commit
            clearTimeout(highlightTimerRef.current);
            const commitEvt = events.find(e => e.type === 'COMMIT' || e.type === 'MERGE_COMMIT');
            if (commitEvt?.hash) {
                setHighlightHash(commitEvt.hash);
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
        });
    }, []);


    const handleAddFile = useCallback((filename, content) => setState(prev => addFile(prev, filename, content)), []);
    const handleEditFile = useCallback((filename, content) => setState(prev => editFile(prev, filename, content)), []);

    // Resizable split handler
    function handleDividerDrag(clientY) {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const relY = clientY - rect.top;
        const min = 120, max = rect.height - 120;
        setDagHeightPx(Math.max(min, Math.min(max, relY)));
    }

    const timelineItems = commandLog.slice(-12).map((entry, i, arr) => ({
        id: i, label: entry.command.replace('git ', ''), done: true, active: i === arr.length - 1,
    }));

    const scenarioColor = GUIDED_SCENARIOS[scenarioKey]?.color || '#fffbea';

    // ── Center Content ──────────────────────────────────────────────────────
    const centerContent = (
        <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

            {/* Narration Banner */}
            <NarrationBanner
                text={currentNarration}
                stepNum={scenarioStep}
                totalSteps={totalSteps}
                color={isManualNarration ? '#e8f5e9' : scenarioColor}
                isManual={isManualNarration}
            />

            {/* DAG Area */}
            <div style={{
                flexShrink: 0,
                height: dagHeightPx ? `${dagHeightPx}px` : '55%',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
                <div style={{
                    padding: '0.4rem 0.75rem', background: '#f0fff4', borderBottom: '2px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: '0.7rem', fontWeight: 800, flexShrink: 0,
                }}>
                    <span>🌳 Commit DAG — {repoName}</span>
                    <span style={{ opacity: 0.5 }}>{Object.keys(state.commits).length} commit{Object.keys(state.commits).length !== 1 ? 's' : ''} · {Object.keys(state.branches).length} branch{Object.keys(state.branches).length !== 1 ? 'es' : ''}</span>
                </div>
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
                    <span>⌨️ Manual Command Panel{isRunning && !isPaused ? ' (scenario running…)' : ''}</span>
                    <FileEditorBar state={state} onAddFile={handleAddFile} onEditFile={handleEditFile} />
                </div>
                <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                    <GitTerminal onCommand={handleCommand} commandLog={commandLog} disabled={false} />
                </div>
            </div>
        </div>
    );

    return (
        <ImmersiveLayout
            isActive={isActive}
            title="Git Internals Simulator"
            icon="🌿"
            moduleLabel={`Module 5 · ${GUIDED_SCENARIOS[scenarioKey]?.label || 'Git & GitHub'}`}
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
                            'Press ▶ START to auto-play, or run commands manually'
            }
            centerContent={centerContent}
            leftContent={<GitStatePanel state={state} conceptMode={conceptMode} />}
            rightContent={<GitExplainPanel lastCommand={lastCommand} explanation={lastExplanation} conceptMode={conceptMode} state={state} />}
            timelineItems={timelineItems}
            legend={[]}
            conceptMode={conceptMode}
            onConceptModeToggle={() => setConceptMode(m => !m)}
        >
            <ConfigPanel onLaunch={handleLaunch} />
        </ImmersiveLayout>
    );
}
