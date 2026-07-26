// GitExplainPanel.jsx — Right panel: Educational explanations + beginner/advanced toggle
import { motion, AnimatePresence } from 'framer-motion';
import { CrownIcon, BoxIcon, SaveIcon, TagIcon, ShuffleIcon, SyncIcon, ResetIcon, SendIcon, LightbulbIcon } from '../../components/Icons';
import { diagnose } from './engine/gitEngine';

// Detailed "why it didn't work + how to fix it" card for failed / no-op commands.
function TroubleshootCard({ diagnostic }) {
    const isError = diagnostic.severity === 'error';
    const accent = isError ? '#c62828' : '#0277bd';
    const bg = isError ? '#fff2f2' : '#eef7ff';
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                marginBottom: '1rem', border: `2px solid ${accent}`, borderRadius: 8,
                overflow: 'hidden', boxShadow: `3px 3px 0 ${accent}`,
            }}
        >
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.4rem 0.6rem', background: accent, color: '#fff',
                fontWeight: 800, fontSize: '0.72rem',
            }}>
                <span>{isError ? '⚠' : 'ℹ'}</span>
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    {isError ? "That didn't work" : 'Heads up'}
                </span>
            </div>
            <div style={{ padding: '0.6rem 0.7rem', background: bg }}>
                <div style={{ fontWeight: 800, fontSize: '0.82rem', marginBottom: '0.35rem', color: '#222' }}>
                    {diagnostic.title}
                </div>
                <div style={{ fontSize: '0.78rem', lineHeight: 1.5, color: '#333', marginBottom: '0.5rem' }}>
                    {diagnostic.what}
                </div>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.55, marginBottom: '0.3rem', color: accent }}>
                    How to fix it
                </div>
                <ol style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {diagnostic.fix.map((step, i) => (
                        <li key={i} style={{ fontSize: '0.78rem', lineHeight: 1.45, color: '#333' }}>{step}</li>
                    ))}
                </ol>
            </div>
        </motion.div>
    );
}

function getConceptIcon(iconKey) {
    if (iconKey === 'init') return <CrownIcon size={14} color="var(--yellow)" />;
    if (iconKey === 'add') return <BoxIcon size={14} />;
    if (iconKey === 'commit') return <SaveIcon size={14} />;
    if (iconKey === 'branch') return <TagIcon size={14} />;
    if (iconKey === 'merge') return <ShuffleIcon size={14} />;
    if (iconKey === 'rebase') return <SyncIcon size={14} />;
    if (iconKey === 'reset') return <ResetIcon size={14} />;
    if (iconKey === 'push') return <SendIcon size={14} />;
    if (iconKey === 'default') return <LightbulbIcon size={14} />;
    return null;
}

const CONCEPT_CARDS = {
    'git init': {
        title: 'Repository Initialization',
        icon: 'init',
        concepts: [
            { label: 'What is .git?', text: 'A hidden folder that IS your repository. It stores all objects (commits, trees, blobs), references (branches, HEAD), and configuration.' },
            { label: 'HEAD', text: 'A pointer to your current location. Initially points to "main" (an unborn branch with no commits yet).' },
            { label: 'Object Store', text: 'Git uses content-addressable storage — every object (file, tree, commit) is addressed by its SHA-1 hash.' },
        ],
    },
    'git add': {
        title: 'Staging Area (Index)',
        icon: 'add',
        concepts: [
            { label: 'Why stage?', text: 'The staging area lets you craft commits precisely. You can stage some changes without committing everything.' },
            { label: 'Blob Objects', text: 'When you add a file, Git creates a "blob" object — a compressed copy of the file content — stored in .git/objects.' },
            { label: 'Snapshot, not diff', text: 'Git stages the full file content, not just the changes. Each commit is a complete snapshot.' },
        ],
    },
    'git commit': {
        title: 'Snapshot Commit',
        icon: 'commit',
        concepts: [
            { label: 'Three objects created', text: '1. Blob (file content) 2. Tree (directory listing mapping filenames→blobs) 3. Commit (points to tree + parent commit)' },
            { label: 'Branch Moves', text: 'After a commit, the current branch pointer automatically moves forward to point to the new commit.' },
            { label: 'Immutable', text: 'Commits are immutable. You can never change a commit — only create new ones (that\'s what amend, rebase do).' },
        ],
    },
    'git branch': {
        title: 'Branch = Pointer',
        icon: 'branch',
        concepts: [
            { label: 'Just a file', text: 'A branch is literally a 41-byte text file in .git/refs/heads/ containing the SHA-1 hash of one commit. Nothing more!' },
            { label: 'Zero cost', text: 'Creating a branch is instant and takes no space. It\'s just writing a hash to a file.' },
            { label: 'Not a copy', text: 'Branches don\'t copy files or commits. They\'re just labels pointing to existing commits.' },
        ],
    },
    'git merge': {
        title: 'Merge Strategies',
        icon: 'merge',
        concepts: [
            { label: 'Fast-forward', text: 'If the target branch is directly behind the source, Git just moves the pointer forward. No new commit needed.' },
            { label: '3-way merge', text: 'When branches have diverged, Git finds the common ancestor and combines changes from both sides.' },
            { label: 'Merge commit', text: 'A merge commit is special — it has TWO parent hashes. This is what creates the "diamond" shape in the DAG.' },
        ],
    },
    'git rebase': {
        title: 'Rebase = Replay',
        icon: 'rebase',
        concepts: [
            { label: 'New hashes!', text: 'Rebase creates brand new commit objects. Even if the message is identical, the parent is different so the hash changes.' },
            { label: 'Linear history', text: 'After rebase, history looks like commits happened sequentially — no merge diamonds.' },
            { label: 'Danger zone', text: 'Never rebase commits already pushed to a shared branch. Others\' histories would diverge from yours.' },
        ],
    },
    'git reset': {
        title: 'Reset Modes',
        icon: 'reset',
        concepts: [
            { label: '--soft', text: 'Only moves the branch pointer. Changes stay staged. Safe.' },
            { label: '--mixed (default)', text: 'Moves branch pointer + clears staging area. Changes stay in working directory.' },
            { label: '--hard ⚠️', text: 'Moves branch pointer + clears staging + resets working directory. Data is GONE (unless in reflog).' },
        ],
    },
    'git push': {
        title: 'Remote Sync',
        icon: 'push',
        concepts: [
            { label: 'Objects transfer', text: 'Git sends only the commit objects + trees + blobs that the remote doesn\'t already have.' },
            { label: 'Remote pointer', text: 'The remote updates its branch pointer (e.g. main) to your latest commit.' },
            { label: 'Rejected push', text: 'Push fails if remote has commits you don\'t. You must pull first to include their work.' },
        ],
    },
};

const DEFAULT_CONCEPTS = {
    title: 'Git Internals',
    icon: 'default',
    concepts: [
        { label: 'Git = DAG', text: 'Git\'s history is a Directed Acyclic Graph. Each commit points to parent commit(s). The DAG can never have cycles.' },
        { label: 'Content Addressable', text: 'Every object is named by the SHA-1 hash of its content. Same content = same hash. Change anything = new hash.' },
        { label: 'Three Trees', text: 'Git manages three "trees": Working Directory (your files), Index/Staging (next commit), HEAD (last commit snapshot).' },
        { label: 'Everything is local', text: 'All history, all commits, all branches live in your .git folder. Remote operations are just syncing.' },
    ],
};

function ConceptCard({ concept }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                marginBottom: '0.75rem',
                border: '2px solid var(--border)',
                borderRadius: 8,
                overflow: 'hidden',
            }}
        >
            <div style={{
                padding: '0.35rem 0.6rem',
                background: 'var(--yellow)',
                fontWeight: 800,
                fontSize: '0.72rem',
                borderBottom: '2px solid var(--border)',
            }}>
                {concept.label}
            </div>
            <div style={{
                padding: '0.5rem 0.6rem',
                fontSize: '0.82rem',
                lineHeight: 1.5,
                background: 'var(--white)',
            }}>
                {concept.text}
            </div>
        </motion.div>
    );
}

export default function GitExplainPanel({ lastCommand, explanation, conceptMode, state }) {
    const cmdKey = lastCommand?.command;
    const conceptData = CONCEPT_CARDS[cmdKey] || DEFAULT_CONCEPTS;
    const diagnostic = lastCommand ? diagnose(lastCommand.command, lastCommand.args, lastCommand.output) : null;

    return (
        <div className="git-scroll" style={{ fontSize: '0.85rem' }}>

            {/* Mode indicator */}
            <div style={{
                display: 'inline-block', marginBottom: '0.75rem',
                padding: '0.2rem 0.6rem',
                border: '2px solid var(--border)', borderRadius: 6,
                fontWeight: 800, fontSize: '0.68rem', textTransform: 'uppercase',
                background: conceptMode ? '#a8e6cf' : '#66d9ef',
            }}>
                {conceptMode ? 'Beginner Mode' : 'Advanced Mode'}
            </div>

            {/* Troubleshooting — why the command didn't work + how to fix it */}
            <AnimatePresence mode="wait">
                {diagnostic && <TroubleshootCard key={cmdKey + diagnostic.title} diagnostic={diagnostic} />}
            </AnimatePresence>

            {/* Last command output */}
            {lastCommand && (
                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.3rem' }}>
                        Last Command
                    </div>
                    <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700,
                        padding: '0.35rem 0.6rem', background: '#1a1a2e', color: '#66d9ef',
                        borderRadius: 6, border: '2px solid var(--border)', marginBottom: '0.5rem',
                    }}>
                        $ {lastCommand.command} {lastCommand.argsStr || ''}
                    </div>

                    {/* Explanation based on mode */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={conceptMode ? 'beginner' : 'advanced'}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            style={{
                                padding: '0.6rem 0.75rem',
                                background: conceptMode ? '#e8f5e9' : '#e8f0fe',
                                border: '2px solid var(--border)',
                                borderRadius: 8,
                                lineHeight: 1.6,
                                fontSize: '0.82rem',
                            }}
                        >
                            {conceptMode
                                ? (explanation?.beginner || 'Run a command to see explanations.')
                                : (explanation?.advanced || 'Run a command to see technical details.')
                            }
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}

            {/* Command output */}
            {lastCommand?.output && (
                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.3rem' }}>
                        Output
                    </div>
                    <pre style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                        padding: '0.5rem 0.6rem', background: '#f8f9fa',
                        border: '1.5px solid var(--border)', borderRadius: 6,
                        overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                        margin: 0, lineHeight: 1.6, maxHeight: 140, overflowY: 'auto',
                    }}>
                        {lastCommand.output}
                    </pre>
                </div>
            )}

            {/* Concept Cards */}
            <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.4rem' }}>
                    {getConceptIcon(conceptData.icon)} {conceptData.title}
                </div>
                <AnimatePresence mode="wait">
                    <motion.div key={cmdKey || 'default'} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {conceptData.concepts.map((c, i) => (
                            <ConceptCard key={i} concept={c} />
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Internal state snapshot (advanced mode) */}
            {!conceptMode && state && (
                <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.3rem' }}>
                        Internal Object Store
                    </div>
                    <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
                        padding: '0.5rem', background: '#1a1a2e', color: '#a8e6cf',
                        borderRadius: 6, border: '2px solid var(--border)',
                        maxHeight: 160, overflowY: 'auto',
                    }}>
                        {Object.entries(state.commits || {}).slice(-3).map(([hash, c]) => (
                            <div key={hash} style={{ marginBottom: '0.5rem', borderBottom: '1px solid #333', paddingBottom: '0.35rem' }}>
                                <div style={{ color: '#ffd93d' }}>commit {hash}</div>
                                <div>parent: {c.parentHashes.join(', ') || 'none'}</div>
                                <div>tree: {Object.keys(c.tree || {}).join(', ') || '(empty)'}</div>
                                <div style={{ color: '#66d9ef' }}>msg: "{c.message}"</div>
                            </div>
                        ))}
                        {!Object.keys(state.commits || {}).length && (
                            <div style={{ opacity: 0.4 }}>No objects yet...</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
