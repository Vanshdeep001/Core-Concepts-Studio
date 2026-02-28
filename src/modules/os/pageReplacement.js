/**
 * Page Replacement Algorithm Engines
 * Returns an array of simulation steps — each step describes one page access.
 */

function buildStep(time, page, frames, hit, victim, algo, detail) {
    return {
        time,
        page,
        frames: frames.map((f) => ({ ...f })),
        hit,
        fault: !hit,
        victim,
        algo,
        detail,
    };
}

/* ── FIFO ── */
export function runFIFO(refString, frameCount) {
    const steps = [];
    const frames = Array(frameCount).fill(null);
    const queue = []; // tracks insertion order
    let faults = 0;
    let hits = 0;

    refString.forEach((page, t) => {
        const idx = frames.indexOf(page);
        if (idx !== -1) {
            hits++;
            steps.push(buildStep(t, page, frames.map((f, i) => ({ val: f, victim: false, new: false })), true, null, 'FIFO',
                `Page ${page} found in frame ${idx} — HIT`));
        } else {
            faults++;
            let victim = null;
            let replaceIdx;
            const emptyIdx = frames.indexOf(null);
            if (emptyIdx !== -1) {
                replaceIdx = emptyIdx;
            } else {
                const oldest = queue[0];
                replaceIdx = frames.indexOf(oldest);
                victim = oldest;
                queue.shift();
            }
            frames[replaceIdx] = page;
            queue.push(page);
            const fSnap = frames.map((f, i) => ({ val: f, victim: false, new: i === replaceIdx }));
            if (victim !== null) fSnap[replaceIdx] = { val: page, victim: false, new: true, replaced: victim };
            steps.push(buildStep(t, page, fSnap, false, victim, 'FIFO',
                victim ? `Page ${page} loaded, evicted ${victim} (oldest in FIFO queue) — FAULT` : `Page ${page} loaded into empty frame ${replaceIdx} — FAULT`));
        }
    });

    return { steps, faults, hits };
}

/* ── LRU ── */
export function runLRU(refString, frameCount) {
    const steps = [];
    const frames = Array(frameCount).fill(null);
    const lastUsed = {}; // page → last time used
    let faults = 0, hits = 0;

    refString.forEach((page, t) => {
        const idx = frames.indexOf(page);
        if (idx !== -1) {
            hits++;
            lastUsed[page] = t;
            steps.push(buildStep(t, page, frames.map((f, i) => ({ val: f, new: false })), true, null, 'LRU',
                `Page ${page} in frame ${idx} — HIT (last used at t=${lastUsed[page]})`));
        } else {
            faults++;
            let victim = null;
            let replaceIdx;
            const emptyIdx = frames.indexOf(null);
            if (emptyIdx !== -1) {
                replaceIdx = emptyIdx;
            } else {
                // Find LRU page
                let lruTime = Infinity, lruPage = null;
                frames.forEach((f) => {
                    const lu = lastUsed[f] ?? -1;
                    if (lu < lruTime) { lruTime = lu; lruPage = f; }
                });
                victim = lruPage;
                replaceIdx = frames.indexOf(lruPage);
            }
            frames[replaceIdx] = page;
            lastUsed[page] = t;
            const fSnap = frames.map((f, i) => ({ val: f, new: i === replaceIdx }));
            steps.push(buildStep(t, page, fSnap, false, victim, 'LRU',
                victim ? `Page ${page} loaded, evicted ${victim} (least recently used at t=${lastUsed[victim] ?? '?'}) — FAULT`
                    : `Page ${page} loaded into empty frame ${replaceIdx} — FAULT`));
        }
    });

    return { steps, faults, hits };
}

/* ── Optimal ── */
export function runOptimal(refString, frameCount) {
    const steps = [];
    const frames = Array(frameCount).fill(null);
    let faults = 0, hits = 0;

    function nextUse(page, from) {
        for (let i = from; i < refString.length; i++) {
            if (refString[i] === page) return i;
        }
        return Infinity;
    }

    refString.forEach((page, t) => {
        const idx = frames.indexOf(page);
        if (idx !== -1) {
            hits++;
            steps.push(buildStep(t, page, frames.map((f) => ({ val: f, new: false })), true, null, 'Optimal',
                `Page ${page} in frame — HIT`));
        } else {
            faults++;
            let victim = null;
            let replaceIdx;
            const emptyIdx = frames.indexOf(null);
            if (emptyIdx !== -1) {
                replaceIdx = emptyIdx;
            } else {
                let farthest = -1;
                frames.forEach((f, i) => {
                    const nu = nextUse(f, t + 1);
                    if (nu > farthest) { farthest = nu; victim = f; replaceIdx = i; }
                });
            }
            frames[replaceIdx] = page;
            const fSnap = frames.map((f, i) => ({ val: f, new: i === replaceIdx }));
            steps.push(buildStep(t, page, fSnap, false, victim, 'Optimal',
                victim ? `Page ${page} loaded, evicted ${victim} (next use farthest in future) — FAULT`
                    : `Page ${page} loaded into empty frame ${replaceIdx} — FAULT`));
        }
    });

    return { steps, faults, hits };
}

/* ── LFU ── */
export function runLFU(refString, frameCount) {
    const steps = [];
    const frames = Array(frameCount).fill(null);
    const freq = {};
    const lastUsed = {};
    let faults = 0, hits = 0;

    refString.forEach((page, t) => {
        freq[page] = (freq[page] || 0);
        const idx = frames.indexOf(page);
        if (idx !== -1) {
            hits++;
            freq[page]++;
            lastUsed[page] = t;
            steps.push(buildStep(t, page, frames.map((f) => ({ val: f, new: false, freq: freq[f] || 0 })), true, null, 'LFU',
                `Page ${page} in frame — HIT (freq=${freq[page]})`));
        } else {
            faults++;
            freq[page]++;
            lastUsed[page] = t;
            let victim = null;
            let replaceIdx;
            const emptyIdx = frames.indexOf(null);
            if (emptyIdx !== -1) {
                replaceIdx = emptyIdx;
            } else {
                let minFreq = Infinity;
                frames.forEach((f, i) => {
                    const f_ = freq[f] || 0;
                    if (f_ < minFreq || (f_ === minFreq && (lastUsed[f] || 0) < (lastUsed[victim] || 0))) {
                        minFreq = f_; victim = f; replaceIdx = i;
                    }
                });
            }
            frames[replaceIdx] = page;
            const fSnap = frames.map((f, i) => ({ val: f, new: i === replaceIdx, freq: freq[f] || 0 }));
            steps.push(buildStep(t, page, fSnap, false, victim, 'LFU',
                victim ? `Page ${page} loaded, evicted ${victim} (lowest freq=${freq[victim] || 0}) — FAULT`
                    : `Page ${page} loaded into empty frame ${replaceIdx} — FAULT`));
        }
    });

    return { steps, faults, hits };
}
