/**
 * Disk Scheduling Engines — FCFS, SSTF, SCAN, C-SCAN
 * Returns: { steps: [{head, target, seekDist, totalSeek, detail}], totalSeek }
 */

export function runDiskFCFS(requests, initialHead) {
    const steps = [];
    let head = initialHead;
    let total = 0;
    for (const req of requests) {
        const dist = Math.abs(req - head);
        total += dist;
        steps.push({ head, target: req, seekDist: dist, totalSeek: total, detail: `Move head from ${head} → ${req} (seek=${dist})` });
        head = req;
    }
    return { steps, totalSeek: total };
}

export function runDiskSSTF(requests, initialHead) {
    const steps = [];
    let head = initialHead;
    let total = 0;
    const remaining = [...requests];
    while (remaining.length) {
        let minDist = Infinity, minIdx = 0;
        remaining.forEach((r, i) => { const d = Math.abs(r - head); if (d < minDist) { minDist = d; minIdx = i; } });
        const target = remaining[minIdx];
        total += minDist;
        steps.push({ head, target, seekDist: minDist, totalSeek: total, detail: `SSTF: nearest request ${target} (seek=${minDist}) from ${head}` });
        head = target;
        remaining.splice(minIdx, 1);
    }
    return { steps, totalSeek: total };
}

export function runDiskSCAN(requests, initialHead, diskMax = 199) {
    const steps = [];
    let head = initialHead;
    let total = 0;
    const sorted = [...requests].sort((a, b) => a - b);
    const right = sorted.filter(r => r >= head);
    const left = sorted.filter(r => r < head).reverse();
    for (const target of [...right, ...left]) {
        const dist = Math.abs(target - head);
        total += dist;
        steps.push({ head, target, seekDist: dist, totalSeek: total, detail: `SCAN: move to ${target} (seek=${dist}) — ${target >= head ? 'moving right' : 'reversing left'}` });
        head = target;
    }
    return { steps, totalSeek: total };
}

export function runDiskCSCAN(requests, initialHead, diskMax = 199) {
    const steps = [];
    let head = initialHead;
    let total = 0;
    const sorted = [...requests].sort((a, b) => a - b);
    const right = sorted.filter(r => r >= head);
    const left = sorted.filter(r => r < head);
    // Go right to end, jump to 0, continue
    const order = [...right, ...left];
    for (let i = 0; i < order.length; i++) {
        const target = order[i];
        let dist;
        if (i === right.length && right.length > 0 && left.length > 0) {
            // Jump from diskMax to 0 to first left target
            dist = (diskMax - head) + diskMax + target;
            total += dist;
            steps.push({ head, target, seekDist: dist, totalSeek: total, detail: `C-SCAN: wrap-around — reach end ${diskMax}, jump to 0, move to ${target} (seek=${dist})` });
        } else {
            dist = Math.abs(target - head);
            total += dist;
            steps.push({ head, target, seekDist: dist, totalSeek: total, detail: `C-SCAN: move to ${target} (seek=${dist})` });
        }
        head = target;
    }
    return { steps, totalSeek: total };
}
