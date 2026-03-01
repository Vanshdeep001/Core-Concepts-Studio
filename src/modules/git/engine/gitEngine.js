// gitEngine.js — Pure deterministic Git internal state machine
// No real Git. Simulates the DAG + Working Directory + Staging + Remote model.

// ─── Helpers ────────────────────────────────────────────────────────────────

let _hashCounter = 1;

function makeHash(prefix = '') {
    const h = (_hashCounter++).toString(16).padStart(2, '0');
    return (prefix + h + Math.random().toString(16).slice(2, 6)).slice(0, 7);
}

function shortHash(h) {
    return h ? h.slice(0, 7) : '0000000';
}

function timestamp() {
    return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Find lowest common ancestor of two commits in the DAG
function findLCA(commits, hashA, hashB) {
    const ancestorsOf = (h) => {
        const visited = new Set();
        const queue = [h];
        while (queue.length) {
            const cur = queue.shift();
            if (!cur || visited.has(cur)) continue;
            visited.add(cur);
            const c = commits[cur];
            if (c) c.parentHashes.forEach(p => queue.push(p));
        }
        return visited;
    };
    const aAnc = ancestorsOf(hashA);
    // Walk up B's ancestors until we find one in A's ancestor set
    const queue = [hashB];
    const visited = new Set();
    while (queue.length) {
        const cur = queue.shift();
        if (!cur || visited.has(cur)) continue;
        visited.add(cur);
        if (aAnc.has(cur)) return cur;
        const c = commits[cur];
        if (c) c.parentHashes.forEach(p => queue.push(p));
    }
    return null;
}

// Collect commits reachable from hash (inclusive), in order
function commitAncestors(commits, hash) {
    const result = [];
    const visited = new Set();
    const queue = [hash];
    while (queue.length) {
        const cur = queue.shift();
        if (!cur || visited.has(cur)) continue;
        visited.add(cur);
        result.push(cur);
        const c = commits[cur];
        if (c) c.parentHashes.forEach(p => queue.push(p));
    }
    return result;
}

// ─── Initial State ───────────────────────────────────────────────────────────

export function createInitialState() {
    return {
        initialized: false,
        workingDirectory: {},   // { filename: { content, status: 'untracked'|'modified'|'deleted' } }
        stagingArea: {},        // { filename: { content, status } }
        commits: {},            // { hash: CommitObject }
        branches: {},           // { branchName: commitHash }
        HEAD: { type: 'branch', ref: 'main' },
        remote: null,           // or { url, branches: {name: hash}, commits: {} }
        stash: [],              // [{workingDirectory, stagingArea}]
        log: [],                // [{command, explanation, timestamp}]
        currentFiles: {},       // { filename: content } — resolved snapshot
        events: [],             // animation events from last command
    };
}

// ─── Commit Object Factory ───────────────────────────────────────────────────
function makeCommit({ message, parentHashes = [], tree, branch, author = 'you' }) {
    const hash = makeHash();
    return {
        hash,
        shortHash: shortHash(hash),
        message,
        parentHashes,
        tree: tree || {},              // snapshot of files at commit time
        branch,                        // branch that was current at commit
        author,
        timestamp: timestamp(),
        isMerge: parentHashes.length > 1,
        isRebase: false,
    };
}

// Get current HEAD commit hash
function getHEADHash(state) {
    if (state.HEAD.type === 'branch') {
        return state.branches[state.HEAD.ref] || null;
    }
    return state.HEAD.ref;
}

// Get tree (file snapshot) of a commit
function getCommitTree(state, hash) {
    if (!hash) return {};
    return state.commits[hash]?.tree || {};
}

// ─── EXPLANATIONS ─────────────────────────────────────────────────────────

const EXPLANATIONS = {
    'git init': {
        beginner: '🎉 You just created a new Git repository! Think of it as an empty scrapbook ready for your project\'s history. Git created a hidden .git folder that stores everything.',
        advanced: 'Initializes the object store (.git/objects), refs directory (.git/refs), and sets HEAD to point to the unborn "main" branch. No commits exist yet.',
    },
    'git clone': {
        beginner: '📋 You copied the entire remote repository — all commits, branches, and files — to your machine. Git also set up "origin" as a name for the remote.',
        advanced: 'Copies all objects (commits, trees, blobs) from remote into local object store. Creates remote-tracking refs (origin/main). Sets up tracking configuration.',
    },
    'git add': {
        beginner: '📦 You moved files into the "staging area" (also called the index). Think of it as packing items into a box before shipping — you\'re preparing what goes into the next commit.',
        advanced: 'Updates the index with the current content of the file. Creates a blob object (compressed file content) in .git/objects. Each staged file maps to a SHA-1 blob hash.',
    },
    'git status': {
        beginner: '🔍 Git compared your files against the staging area and last commit to show you what\'s changed, what\'s staged, and what\'s untracked.',
        advanced: 'Compares working tree against index (staging area) and index against HEAD commit\'s tree object. Reports three classes: untracked, unstaged changes, staged changes.',
    },
    'git commit': {
        beginner: '📸 You just took a snapshot of ALL your staged files! This snapshot is stored as a commit node in the history graph, with a unique ID (hash) and a pointer to its parent.',
        advanced: 'Creates three objects: (1) blob objects for changed files, (2) a tree object mapping filenames to blob hashes, (3) a commit object with tree hash, parent hash(es), author, message. Branch pointer advances.',
    },
    'git log': {
        beginner: '📖 Git is showing you the history of commits by walking backward through the parent pointers — like following a chain of snapshots back in time.',
        advanced: 'Traverses the commit DAG from HEAD backward via parentHashes. Each commit object contains its parent commit\'s hash, forming the directed acyclic graph.',
    },
    'git branch': {
        beginner: '🏷️ A branch is just a sticky note (pointer) attached to a commit. Creating a branch doesn\'t copy anything — it\'s instant, just a new label pointing to the current commit.',
        advanced: 'Creates a new ref file in .git/refs/heads/<name> containing the SHA-1 of the current HEAD commit. Branches are 41-byte files (40-char hash + newline).',
    },
    'git checkout': {
        beginner: '🚪 You switched to a different branch or commit. HEAD (which points to "where you are") moved. Your working files updated to match that commit\'s snapshot.',
        advanced: 'Updates HEAD to point to the specified ref. Checks out the tree of the target commit into the working directory and index. If detached, HEAD points directly to a commit hash.',
    },
    'git switch': {
        beginner: '🚪 Same as checkout — you switched branches. HEAD moved to the new branch, and your working files match the latest commit there.',
        advanced: 'Modern equivalent of git checkout for switching branches. Updates HEAD ref and checks out the corresponding commit tree into the index and working directory.',
    },
    'git merge': {
        beginner: '🔀 You combined two branches! If one branch was simply "ahead" of the other, Git did a fast-forward (just moved the pointer). Otherwise, Git created a new "merge commit" with two parents.',
        advanced: 'Finds LCA (lowest common ancestor) of two branches via DAG traversal. Fast-forward if one is ancestor of other. Otherwise creates merge commit with two parentHashes, combining both line trees.',
    },
    'git rebase': {
        beginner: '♻️ Rebase picked up your commits from your branch and replayed them on top of the target branch, giving them new IDs. Your history becomes linear — like you branched off after the latest work.',
        advanced: 'Detaches commits from their current parent chain. Replays each commit\'s diff onto the target base, creating new commit objects with new hashes and updated parentHashes. Original commits become unreachable (orphaned).',
    },
    'git reset': {
        beginner: '⚠️ Reset moved your branch pointer backward. Soft: keeps staged changes. Mixed: unstages but keeps files. Hard: discards EVERYTHING — be careful!',
        advanced: 'Moves the branch ref to the specified commit. --soft: only moves HEAD/branch. --mixed (default): moves HEAD + clears index. --hard: moves HEAD + clears index + resets working tree to commit\'s tree.',
    },
    'git stash': {
        beginner: '🗄️ Stash is like a temporary drawer. You saved your unfinished changes so you can do something else with a clean working directory, then pop them back later.',
        advanced: 'Saves the current working directory and index state to a stack (stash@{0}). Creates stash commit objects pointing to the dirty state. git stash pop applies then removes the top entry.',
    },
    'git stash pop': {
        beginner: '📤 You restored your previously stashed (saved) changes back into your working directory.',
        advanced: 'Retrieves the top entry from the stash ref-log stack, applies the diff to working directory and index, then removes the entry from the stash.',
    },
    'git remote add': {
        beginner: '🌐 You told Git about a remote repository and named it "origin". This is just a saved address — nothing is transferred yet.',
        advanced: 'Adds a remote config entry in .git/config: [remote "origin"] with url and fetch refspec. Creates remote-tracking ref namespace origin/*.',
    },
    'git push': {
        beginner: '🚀 You uploaded your local commits to the remote! The remote branch pointer moved forward to match your local branch.',
        advanced: 'Sends local objects (commits, trees, blobs) that remote doesn\'t have. Updates the remote branch ref. Creates/updates remote-tracking ref origin/<branch> locally.',
    },
    'git fetch': {
        beginner: '⬇️ You downloaded the latest commits from the remote, but didn\'t merge them yet. Your local branches are untouched — only origin/* references updated.',
        advanced: 'Fetches all missing objects from remote and updates remote-tracking refs (origin/<branch>) without modifying local branches or working directory.',
    },
    'git pull': {
        beginner: '⬇️🔀 Pull = fetch + merge. You downloaded new commits from the remote AND merged them into your current branch in one step.',
        advanced: 'Runs git fetch, then git merge FETCH_HEAD (or git rebase if configured with --rebase). Updates both the remote-tracking refs and local branch.',
    },
    'git restore': {
        beginner: '↩️ You discarded changes in your working directory, reverting the file back to what it looked like in the last commit (or staging area).',
        advanced: 'Restores working tree files from the index or a specified tree-ish. Does not affect commit history. Replaces --checkout for file restoration.',
    },
    'git rm': {
        beginner: '🗑️ You deleted the file and staged that deletion. The next commit will record the file as removed from the project.',
        advanced: 'Removes the file from the working tree AND the index. The deletion is staged, so the next commit object\'s tree will not include the blob mapping for this file.',
    },
    'git diff': {
        beginner: '🔎 Git is showing you exactly what changed — comparing your current files against the staged version or the last commit, line by line.',
        advanced: 'Computes diff between working tree and index (git diff), or between index and HEAD commit tree (git diff --staged / --cached). Shows unified diff format.',
    },
};

// ─── COMMAND DISPATCHER ──────────────────────────────────────────────────────

export function dispatch(state, command, args = {}) {
    const s = deepClone(state);
    s.events = [];
    let explanation = { beginner: '', advanced: '' };
    let output = '';

    const cmdKey = command + (args.mode ? ` (${args.mode})` : '');
    explanation = EXPLANATIONS[command] || { beginner: '', advanced: '' };

    switch (command) {

        // ── git init ──────────────────────────────────────────────────────────
        case 'git init': {
            s.initialized = true;
            s.branches = { main: null };
            s.HEAD = { type: 'branch', ref: 'main' };
            s.workingDirectory = {};
            s.stagingArea = {};
            s.commits = {};
            s.currentFiles = {};
            s.remote = null;
            s.stash = [];
            output = 'Initialized empty Git repository in .git/';
            s.events.push({ type: 'INIT' });
            break;
        }

        // ── git clone ──────────────────────────────────────────────────────────
        case 'git clone': {
            const url = args.url || 'https://github.com/user/repo.git';
            // Simulate a remote with some pre-existing commits
            const initHash = makeHash();
            const secondHash = makeHash();
            s.initialized = true;
            s.commits[initHash] = makeCommit({ message: 'Initial commit', parentHashes: [], tree: { 'README.md': '# My Project\n' }, branch: 'main' });
            s.commits[secondHash] = makeCommit({ message: 'Add project structure', parentHashes: [initHash], tree: { 'README.md': '# My Project\n', 'index.js': 'console.log("hello");\n' }, branch: 'main' });
            s.commits[initHash].hash = initHash;
            s.commits[secondHash].hash = secondHash;
            s.branches = { main: secondHash };
            s.HEAD = { type: 'branch', ref: 'main' };
            s.currentFiles = { 'README.md': '# My Project\n', 'index.js': 'console.log("hello");\n' };
            s.workingDirectory = {};
            s.stagingArea = {};
            s.remote = { url, branches: { main: secondHash }, commits: deepClone(s.commits) };
            output = `Cloning from ${url}...\nDone. 2 commits checked out.`;
            s.events.push({ type: 'CLONE', commits: [initHash, secondHash] });
            break;
        }

        // ── git status ──────────────────────────────────────────────────────────
        case 'git status': {
            const headHash = getHEADHash(s);
            const headTree = getCommitTree(s, headHash);
            const branch = s.HEAD.type === 'branch' ? s.HEAD.ref : 'HEAD (detached)';
            const lines = [`On branch ${branch}`];

            const staged = Object.keys(s.stagingArea);
            const modified = Object.keys(s.workingDirectory);
            const untracked = modified.filter(f => !headTree[f] && !s.stagingArea[f]);
            const modifiedTracked = modified.filter(f => headTree[f] || s.stagingArea[f]);

            if (staged.length) lines.push(`\nChanges to be committed:\n  ${staged.map(f => `staged: ${f}`).join('\n  ')}`);
            if (modifiedTracked.length) lines.push(`\nChanges not staged:\n  ${modifiedTracked.map(f => `modified: ${f}`).join('\n  ')}`);
            if (untracked.length) lines.push(`\nUntracked files:\n  ${untracked.join('\n  ')}`);
            if (!staged.length && !modified.length) lines.push('\nNothing to commit, working tree clean');

            output = lines.join('\n');
            s.events.push({ type: 'STATUS' });
            break;
        }

        // ── git add ────────────────────────────────────────────────────────────
        case 'git add': {
            const files = args.file === '.' ? Object.keys(s.workingDirectory) : [args.file].filter(Boolean);
            if (!files.length) { output = 'Nothing to add.'; break; }
            files.forEach(f => {
                if (s.workingDirectory[f]) {
                    s.stagingArea[f] = deepClone(s.workingDirectory[f]);
                    delete s.workingDirectory[f];
                    s.events.push({ type: 'STAGE', file: f });
                }
            });
            output = files.map(f => `staged: ${f}`).join('\n');
            break;
        }

        // ── git restore ────────────────────────────────────────────────────────
        case 'git restore': {
            const f = args.file;
            if (!f) { output = 'Specify a file.'; break; }
            const headHash = getHEADHash(s);
            const headTree = getCommitTree(s, headHash);
            if (headTree[f]) {
                s.workingDirectory[f] = { content: headTree[f], status: 'modified' };
                // Actually restore means remove the modification:
                delete s.workingDirectory[f];
            } else {
                delete s.workingDirectory[f];
            }
            output = `Restored '${f}'`;
            s.events.push({ type: 'RESTORE', file: f });
            break;
        }

        // ── git rm ─────────────────────────────────────────────────────────────
        case 'git rm': {
            const f = args.file;
            if (!f) { output = 'Specify a file.'; break; }
            delete s.workingDirectory[f];
            s.stagingArea[f] = { content: null, status: 'deleted' };
            if (s.currentFiles[f]) delete s.currentFiles[f];
            output = `rm '${f}'`;
            s.events.push({ type: 'RM', file: f });
            break;
        }

        // ── git commit ─────────────────────────────────────────────────────────
        case 'git commit': {
            if (!Object.keys(s.stagingArea).length) {
                output = 'Nothing to commit (use "git add" to stage changes)';
                break;
            }
            const headHash = getHEADHash(s);
            const prevTree = getCommitTree(s, headHash);
            // Merge prev tree with staged changes
            const newTree = { ...prevTree };
            Object.entries(s.stagingArea).forEach(([f, v]) => {
                if (v.status === 'deleted') delete newTree[f];
                else newTree[f] = v.content;
            });
            // Also apply currentFiles
            Object.assign(s.currentFiles, newTree);

            const branch = s.HEAD.type === 'branch' ? s.HEAD.ref : null;
            const commit = makeCommit({
                message: args.message || 'commit',
                parentHashes: headHash ? [headHash] : [],
                tree: newTree,
                branch,
            });
            s.commits[commit.hash] = commit;

            // Advance branch pointer
            if (s.HEAD.type === 'branch') {
                s.branches[s.HEAD.ref] = commit.hash;
            } else {
                s.HEAD.ref = commit.hash;
            }
            s.stagingArea = {};
            output = `[${branch || 'HEAD'} ${commit.shortHash}] ${commit.message}`;
            s.events.push({ type: 'COMMIT', hash: commit.hash, parentHashes: commit.parentHashes, branch });
            break;
        }

        // ── git log ────────────────────────────────────────────────────────────
        case 'git log': {
            const headHash = getHEADHash(s);
            if (!headHash) { output = 'No commits yet.'; break; }
            const ancestors = commitAncestors(s.commits, headHash);
            output = ancestors.map(h => {
                const c = s.commits[h];
                return `commit ${h}\nAuthor: ${c.author}\nDate:   ${c.timestamp}\n\n    ${c.message}`;
            }).join('\n\n');
            s.events.push({ type: 'LOG', hashes: ancestors });
            break;
        }

        // ── git diff ───────────────────────────────────────────────────────────
        case 'git diff': {
            const headHash = getHEADHash(s);
            const headTree = getCommitTree(s, headHash);
            const diffs = [];
            // WD vs staging + head
            Object.entries(s.workingDirectory).forEach(([f, v]) => {
                const base = s.stagingArea[f]?.content || headTree[f] || '';
                diffs.push(`diff --git a/${f} b/${f}\n--- a/${f}\n+++ b/${f}\n${diffLines(base, v.content)}`);
            });
            if (!diffs.length) output = 'No differences.';
            else output = diffs.join('\n');
            s.events.push({ type: 'DIFF' });
            break;
        }

        // ── git branch ────────────────────────────────────────────────────────
        case 'git branch': {
            if (args.list || !args.name) {
                // list branches
                const branches = Object.keys(s.branches);
                output = branches.map(b => (b === s.HEAD.ref ? `* ${b}` : `  ${b}`)).join('\n');
                s.events.push({ type: 'BRANCH_LIST' });
                break;
            }
            const headHash = getHEADHash(s);
            s.branches[args.name] = headHash;
            output = `Branch '${args.name}' created at ${shortHash(headHash)}`;
            s.events.push({ type: 'BRANCH_CREATE', name: args.name, hash: headHash });
            break;
        }

        // ── git checkout ──────────────────────────────────────────────────────
        case 'git checkout':
        case 'git switch': {
            const target = args.branch || args.ref;
            if (!target) { output = 'Specify a branch.'; break; }

            // Create and switch: git switch -c <branch>
            if (args.create) {
                const headHash = getHEADHash(s);
                s.branches[target] = headHash;
                s.events.push({ type: 'BRANCH_CREATE', name: target, hash: headHash });
            }

            if (s.branches[target] !== undefined) {
                const prevRef = s.HEAD.ref;
                s.HEAD = { type: 'branch', ref: target };
                // Update working files to match target commit
                const targetHash = s.branches[target];
                if (targetHash) {
                    s.currentFiles = deepClone(s.commits[targetHash]?.tree || {});
                }
                output = `Switched to branch '${target}'`;
                s.events.push({ type: 'CHECKOUT', from: prevRef, to: target, hash: s.branches[target] });
            } else if (s.commits[target]) {
                // Detached HEAD
                s.HEAD = { type: 'detached', ref: target };
                s.currentFiles = deepClone(s.commits[target]?.tree || {});
                output = `HEAD is now at ${shortHash(target)}`;
                s.events.push({ type: 'CHECKOUT_DETACHED', hash: target });
            } else {
                output = `error: pathspec '${target}' did not match any branch.`;
            }
            break;
        }

        // ── git merge ─────────────────────────────────────────────────────────
        case 'git merge': {
            const sourceBranch = args.branch;
            if (!sourceBranch || !s.branches[sourceBranch]) {
                output = `Branch '${sourceBranch}' not found.`; break;
            }
            const sourceHash = s.branches[sourceBranch];
            const targetHash = getHEADHash(s);
            const currentBranch = s.HEAD.ref;

            if (sourceHash === targetHash) {
                output = 'Already up to date.'; break;
            }

            // Check if fast-forward possible
            const sourceAncestors = commitAncestors(s.commits, sourceHash);
            const isFF = sourceAncestors.includes(targetHash);

            if (isFF) {
                // Fast-forward
                s.branches[currentBranch] = sourceHash;
                s.currentFiles = deepClone(s.commits[sourceHash]?.tree || {});
                output = `Fast-forward\nUpdated ${shortHash(targetHash)}..${shortHash(sourceHash)}`;
                s.events.push({ type: 'MERGE_FF', from: targetHash, to: sourceHash, branch: currentBranch });
            } else {
                // 3-way merge — create merge commit
                const lca = findLCA(s.commits, targetHash, sourceHash);
                const targetTree = getCommitTree(s, targetHash);
                const sourceTree = getCommitTree(s, sourceHash);
                // Simple merge (no conflict simulation by default)
                const mergedTree = { ...targetTree, ...sourceTree };
                const mergeCommit = makeCommit({
                    message: args.message || `Merge branch '${sourceBranch}'`,
                    parentHashes: [targetHash, sourceHash],
                    tree: mergedTree,
                    branch: currentBranch,
                });
                s.commits[mergeCommit.hash] = mergeCommit;
                s.branches[currentBranch] = mergeCommit.hash;
                s.currentFiles = deepClone(mergedTree);
                output = `Merge made by 'ort' strategy.\nMerge commit ${mergeCommit.shortHash}`;
                s.events.push({ type: 'MERGE_3WAY', mergeHash: mergeCommit.hash, parents: [targetHash, sourceHash], branch: currentBranch, lca });
            }
            break;
        }

        // ── git rebase ────────────────────────────────────────────────────────
        case 'git rebase': {
            const targetBranch = args.branch;
            if (!targetBranch || !s.branches[targetBranch]) {
                output = `Branch '${targetBranch}' not found.`; break;
            }
            const currentBranch = s.HEAD.ref;
            if (!currentBranch) { output = 'Cannot rebase in detached HEAD state.'; break; }

            const targetHash = s.branches[targetBranch];
            const sourceHash = s.branches[currentBranch];
            const lca = findLCA(s.commits, sourceHash, targetHash);

            // Collect commits on current branch after LCA
            const toReplay = [];
            let cur = sourceHash;
            while (cur && cur !== lca) {
                toReplay.unshift(cur);
                const c = s.commits[cur];
                cur = c?.parentHashes[0];
            }

            // Mark old commits as orphaned (for animation)
            const oldHashes = [...toReplay];
            s.events.push({ type: 'REBASE_START', oldHashes, targetHash });

            // Replay commits on top of target
            let base = targetHash;
            const newHashes = [];
            toReplay.forEach(h => {
                const orig = s.commits[h];
                const newCommit = makeCommit({
                    message: orig.message,
                    parentHashes: [base],
                    tree: orig.tree,
                    branch: currentBranch,
                });
                newCommit.isRebase = true;
                newCommit.rebasedFrom = h;
                s.commits[newCommit.hash] = newCommit;
                base = newCommit.hash;
                newHashes.push(newCommit.hash);
            });

            // Move current branch to new top
            s.branches[currentBranch] = base;
            if (base && s.commits[base]) {
                s.currentFiles = deepClone(s.commits[base].tree);
            }

            output = `Successfully rebased and updated refs/heads/${currentBranch}.\n${oldHashes.length} commit(s) replayed.`;
            s.events.push({ type: 'REBASE_DONE', oldHashes, newHashes, targetHash, branch: currentBranch });
            break;
        }

        // ── git reset ─────────────────────────────────────────────────────────
        case 'git reset': {
            const mode = args.mode || 'mixed'; // soft | mixed | hard
            const targetHash = args.hash || getHEADHash(s);
            const targetCommit = s.commits[targetHash];
            if (!targetCommit) { output = 'Invalid target commit.'; break; }

            const currentBranch = s.HEAD.ref;
            if (currentBranch) s.branches[currentBranch] = targetHash;
            else s.HEAD.ref = targetHash;

            if (mode === 'mixed' || mode === 'hard') {
                s.stagingArea = {};
            }
            if (mode === 'hard') {
                s.workingDirectory = {};
                s.currentFiles = deepClone(targetCommit.tree);
            }

            output = `HEAD is now at ${shortHash(targetHash)} ${targetCommit.message}\n(${mode} reset)`;
            s.events.push({ type: 'RESET', mode, hash: targetHash });
            break;
        }

        // ── git stash ─────────────────────────────────────────────────────────
        case 'git stash': {
            if (!Object.keys(s.workingDirectory).length && !Object.keys(s.stagingArea).length) {
                output = 'No local changes to save.'; break;
            }
            s.stash.push({ workingDirectory: deepClone(s.workingDirectory), stagingArea: deepClone(s.stagingArea) });
            s.workingDirectory = {};
            s.stagingArea = {};
            output = `Saved working directory and index state WIP on ${s.HEAD.ref}: stash@{${s.stash.length - 1}}`;
            s.events.push({ type: 'STASH', index: s.stash.length - 1 });
            break;
        }

        case 'git stash pop': {
            if (!s.stash.length) { output = 'No stash entries found.'; break; }
            const entry = s.stash.pop();
            s.workingDirectory = entry.workingDirectory;
            s.stagingArea = entry.stagingArea;
            output = `Dropped stash@{0}`;
            s.events.push({ type: 'STASH_POP' });
            explanation = EXPLANATIONS['git stash pop'];
            break;
        }

        // ── git remote add ────────────────────────────────────────────────────
        case 'git remote add': {
            const url = args.url || 'https://github.com/user/repo.git';
            const name = args.name || 'origin';
            s.remote = { url, name, branches: {}, commits: {} };
            output = `Remote '${name}' added → ${url}`;
            s.events.push({ type: 'REMOTE_ADD', url, name });
            break;
        }

        // ── git push ──────────────────────────────────────────────────────────
        case 'git push': {
            if (!s.remote) { output = 'No remote configured. Use git remote add first.'; break; }
            const branch = args.branch || s.HEAD.ref;
            const localHash = s.branches[branch];
            if (!localHash) { output = 'Nothing to push.'; break; }

            // Copy commits to remote
            const ancestors = commitAncestors(s.commits, localHash);
            ancestors.forEach(h => { s.remote.commits[h] = deepClone(s.commits[h]); });
            s.remote.branches[branch] = localHash;

            output = `To ${s.remote.url}\n  ${shortHash(s.remote.branches[branch] || '0000000')}..${shortHash(localHash)}  ${branch} -> ${branch}`;
            s.events.push({ type: 'PUSH', branch, hash: localHash });
            break;
        }

        // ── git fetch ─────────────────────────────────────────────────────────
        case 'git fetch': {
            if (!s.remote) { output = 'No remote configured.'; break; }
            // Copy remote commits locally (without merging)
            const fetched = [];
            Object.entries(s.remote.commits || {}).forEach(([h, c]) => {
                if (!s.commits[h]) {
                    s.commits[h] = deepClone(c);
                    fetched.push(h);
                }
            });
            output = fetched.length
                ? `From ${s.remote.url}\n  Fetched ${fetched.length} new commit(s)`
                : `Already up to date.`;
            s.events.push({ type: 'FETCH', hashes: fetched });
            break;
        }

        // ── git pull ──────────────────────────────────────────────────────────
        case 'git pull': {
            if (!s.remote) { output = 'No remote configured.'; break; }
            const branch = s.HEAD.ref || 'main';
            const remoteHash = s.remote.branches[branch];
            if (!remoteHash) { output = 'Remote branch not found.'; break; }

            // Fetch step
            Object.entries(s.remote.commits || {}).forEach(([h, c]) => {
                if (!s.commits[h]) s.commits[h] = deepClone(c);
            });

            // Merge step (fast-forward if possible)
            const localHash = s.branches[branch];
            if (localHash === remoteHash) { output = 'Already up to date.'; break; }

            const remoteAncestors = commitAncestors(s.commits, remoteHash);
            if (!localHash || remoteAncestors.includes(localHash)) {
                // Fast-forward
                s.branches[branch] = remoteHash;
                s.currentFiles = deepClone(s.commits[remoteHash]?.tree || {});
                output = `Fast-forward pull from ${s.remote.url}\n${shortHash(localHash || '0000000')}..${shortHash(remoteHash)}`;
            } else {
                // Merge commit
                const mergedTree = { ...getCommitTree(s, localHash), ...getCommitTree(s, remoteHash) };
                const mergeCommit = makeCommit({
                    message: `Merge branch '${branch}' of ${s.remote.url}`,
                    parentHashes: [localHash, remoteHash],
                    tree: mergedTree,
                    branch,
                });
                s.commits[mergeCommit.hash] = mergeCommit;
                s.branches[branch] = mergeCommit.hash;
                s.currentFiles = deepClone(mergedTree);
                output = `Merge commit ${mergeCommit.shortHash}`;
            }
            s.events.push({ type: 'PULL', branch, hash: s.branches[branch] });
            break;
        }

        default:
            output = `Unknown command: ${command}`;
    }

    // Log the command
    s.log.push({ command, args, output: output.slice(0, 200), timestamp: timestamp(), explanation });

    return { state: s, output, explanation };
}

// ─── File Helpers ─────────────────────────────────────────────────────────────

export function addFile(state, filename, content) {
    const s = deepClone(state);
    s.workingDirectory[filename] = { content, status: 'untracked' };
    return s;
}

export function editFile(state, filename, content) {
    const s = deepClone(state);
    const headHash = getHEADHash(s);
    const headTree = getCommitTree(s, headHash);
    const isTracked = headTree[filename] || s.stagingArea[filename];
    s.workingDirectory[filename] = { content, status: isTracked ? 'modified' : 'untracked' };
    return s;
}

export function deleteWorkingFile(state, filename) {
    const s = deepClone(state);
    delete s.workingDirectory[filename];
    return s;
}

// ─── DAG Layout ──────────────────────────────────────────────────────────────

export function computeDAGLayout(commits, branches, HEAD, remote) {
    // Topological sort + position assignment
    const ids = Object.keys(commits);
    if (!ids.length) return { nodes: [], edges: [] };

    // Build adjacency (parent -> children)
    const children = {};
    ids.forEach(id => { children[id] = []; });
    ids.forEach(id => {
        commits[id].parentHashes.forEach(p => {
            if (children[p]) children[p].push(id);
        });
    });

    // Find roots (no parents)
    const roots = ids.filter(id => commits[id].parentHashes.length === 0);

    // BFS-based level assignment
    const levels = {};
    const visited = new Set();
    const queue = roots.map(r => ({ id: r, level: 0 }));
    while (queue.length) {
        const { id, level } = queue.shift();
        if (visited.has(id)) continue;
        visited.add(id);
        levels[id] = Math.max(levels[id] || 0, level);
        (children[id] || []).forEach(c => queue.push({ id: c, level: level + 1 }));
    }

    // Group by level
    const byLevel = {};
    Object.entries(levels).forEach(([id, lvl]) => {
        if (!byLevel[lvl]) byLevel[lvl] = [];
        byLevel[lvl].push(id);
    });

    const NODE_W = 120;
    const NODE_H = 60;
    const H_GAP = 50;
    const V_GAP = 80;

    const positions = {};
    Object.entries(byLevel).forEach(([lvl, ids]) => {
        ids.forEach((id, i) => {
            positions[id] = {
                x: parseInt(lvl) * (NODE_W + H_GAP) + 40,
                y: i * (NODE_H + V_GAP) + 40,
            };
        });
    });

    // Build branch labels
    const branchLabels = {};
    Object.entries(branches).forEach(([name, hash]) => {
        if (!branchLabels[hash]) branchLabels[hash] = [];
        branchLabels[hash].push({ name, type: 'local' });
    });

    // HEAD label
    const headHash = HEAD.type === 'branch' ? branches[HEAD.ref] : HEAD.ref;
    if (headHash) {
        if (!branchLabels[headHash]) branchLabels[headHash] = [];
        // HEAD pointer
    }

    // Remote branch labels
    if (remote?.branches) {
        Object.entries(remote.branches).forEach(([name, hash]) => {
            if (positions[hash]) {
                if (!branchLabels[hash]) branchLabels[hash] = [];
                branchLabels[hash].push({ name: `origin/${name}`, type: 'remote' });
            }
        });
    }

    const nodes = ids.filter(id => positions[id]).map(id => ({
        id,
        ...positions[id],
        width: NODE_W,
        height: NODE_H,
        commit: commits[id],
        branchLabels: branchLabels[id] || [],
        isHEAD: id === headHash,
        isMerge: commits[id].isMerge,
        isRebase: commits[id].isRebase,
    }));

    const edges = [];
    ids.forEach(id => {
        if (!positions[id]) return;
        commits[id].parentHashes.forEach((p, i) => {
            if (positions[p]) {
                edges.push({ from: id, to: p, isMergeEdge: i > 0 });
            }
        });
    });

    return { nodes, edges, headHash, branchLabels };
}

// ─── Diff helper ─────────────────────────────────────────────────────────────
function diffLines(a, b) {
    const aLines = (a || '').split('\n');
    const bLines = (b || '').split('\n');
    const removed = aLines.filter(l => !bLines.includes(l)).map(l => `- ${l}`);
    const added = bLines.filter(l => !aLines.includes(l)).map(l => `+ ${l}`);
    return [...removed, ...added].join('\n') || '(no textual differences)';
}

// ─── Preset Scenarios ─────────────────────────────────────────────────────────
export const PRESETS = {
    basic: {
        label: 'Basic Flow',
        description: 'init → add → commit sequence',
        steps: [
            { command: 'git init', args: {} },
        ],
    },
    branching: {
        label: 'Branching & Merging',
        description: 'Create branch, commit, merge back',
        steps: [
            { command: 'git init', args: {} },
        ],
    },
    rebase: {
        label: 'Rebase Demo',
        description: 'See commits replayed on a new base',
        steps: [
            { command: 'git init', args: {} },
        ],
    },
    remote: {
        label: 'Remote Flow',
        description: 'push, fetch, pull with origin',
        steps: [
            { command: 'git clone', args: { url: 'https://github.com/demo/project.git' } },
        ],
    },
};

export const COMMAND_GROUPS = [
    {
        label: 'Setup',
        color: '#a8e6cf',
        commands: [
            { cmd: 'git init', label: 'init', argsSchema: [] },
            { cmd: 'git clone', label: 'clone', argsSchema: [{ key: 'url', placeholder: 'URL', default: 'https://github.com/user/repo.git' }] },
        ],
    },
    {
        label: 'Working & Staging',
        color: '#ffd93d',
        commands: [
            { cmd: 'git status', label: 'status', argsSchema: [] },
            { cmd: 'git add', label: 'add', argsSchema: [{ key: 'file', placeholder: 'filename or .', default: '.' }] },
            { cmd: 'git restore', label: 'restore', argsSchema: [{ key: 'file', placeholder: 'filename' }] },
            { cmd: 'git rm', label: 'rm', argsSchema: [{ key: 'file', placeholder: 'filename' }] },
            { cmd: 'git diff', label: 'diff', argsSchema: [] },
            { cmd: 'git stash', label: 'stash', argsSchema: [] },
            { cmd: 'git stash pop', label: 'stash pop', argsSchema: [] },
        ],
    },
    {
        label: 'Commits',
        color: '#66d9ef',
        commands: [
            { cmd: 'git commit', label: 'commit', argsSchema: [{ key: 'message', placeholder: 'commit message', default: 'update' }] },
            { cmd: 'git log', label: 'log', argsSchema: [] },
        ],
    },
    {
        label: 'Branching',
        color: '#ff6b9d',
        commands: [
            { cmd: 'git branch', label: 'branch', argsSchema: [{ key: 'name', placeholder: 'branch name (blank to list)' }] },
            { cmd: 'git checkout', label: 'checkout', argsSchema: [{ key: 'branch', placeholder: 'branch name' }] },
            { cmd: 'git switch', label: 'switch', argsSchema: [{ key: 'branch', placeholder: 'branch name' }, { key: 'create', placeholder: '', type: 'checkbox', label: '-c (create)' }] },
            { cmd: 'git merge', label: 'merge', argsSchema: [{ key: 'branch', placeholder: 'branch to merge' }] },
            { cmd: 'git rebase', label: 'rebase', argsSchema: [{ key: 'branch', placeholder: 'target branch' }] },
            { cmd: 'git reset', label: 'reset', argsSchema: [{ key: 'mode', placeholder: 'soft|mixed|hard', default: 'mixed' }, { key: 'hash', placeholder: 'commit hash (blank=HEAD~1)' }] },
        ],
    },
    {
        label: 'Remote',
        color: '#c3aed6',
        commands: [
            { cmd: 'git remote add', label: 'remote add', argsSchema: [{ key: 'url', placeholder: 'URL', default: 'https://github.com/user/repo.git' }] },
            { cmd: 'git push', label: 'push', argsSchema: [{ key: 'branch', placeholder: 'branch (blank=current)' }] },
            { cmd: 'git fetch', label: 'fetch', argsSchema: [] },
            { cmd: 'git pull', label: 'pull', argsSchema: [] },
        ],
    },
];
