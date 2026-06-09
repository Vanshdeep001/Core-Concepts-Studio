import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ImmersiveLayout from '../../shared/ImmersiveLayout';
import {
    AlertIcon, GearIcon, OutboxIcon, InboxIcon, SatelliteIcon, RocketIcon,
    UFOIcon, SwirlIcon, ExplosionIcon, LockIcon, UnlockIcon, StopIcon,
    CircleFilled, GamepadIcon, CrownIcon, KeyIcon, CoffeeIcon, BoxIcon,
    FoodIcon, ClipboardIcon, EyeIcon, WrenchIcon, ZapIcon, ActivityIcon,
    ClockIcon, BlockIcon, SyncIcon, FactoryIcon
} from '../../components/Icons';

/* ══════════════════════════════════════════
   DYNAMIC TIMELINE BUILDERS (USER DEFINED DETAILS)
   ══════════════════════════════════════════ */

// STAGE 1 - Race Condition Steps Builder
function buildStage1Steps(initialVal, stepVal, schedule) {
    const s1 = +stepVal;
    const v0 = +initialVal;
    const v1 = v0 + s1;
    const v2 = v0 + 2 * s1;

    if (schedule === 'sequential_p1') {
        return [
            {
                phase: 'Initial State (t=0)',
                explanation: `Sequential mode: P1 runs to completion first, then P2 runs. Initial counter = ${v0}.`,
                insight: 'Running sequentially avoids any overlap, guaranteeing that data updates are perfectly saved.',
                insightTitle: 'Safe Serial Execution',
                conceptTag: 'SCHEDULE: SAFE SEQUENTIAL P1->P2',
                conceptDef: 'Executing processes in strict non-overlapping order guarantees data consistency.',
                state: { counter: v0, r1: null, r2: null, activeProc: null, line: '', p1Status: 'ready', p2Status: 'ready', hasBug: false }
            },
            {
                phase: 'P1 reads counter (t=1)',
                explanation: `P1 loads counter (${v0}) into register R1.`,
                insight: 'P1 starts its atomic work block.',
                insightTitle: 'Exclusive Read',
                conceptTag: 'STEP 1: LOAD',
                conceptDef: 'P1 copies the shared variable to its local core register R1.',
                state: { counter: v0, r1: v0, r2: null, activeProc: 'P1', line: `LOAD counter (${v0}) -> R1`, p1Status: 'reading', p2Status: 'ready', hasBug: false }
            },
            {
                phase: 'P1 increments & writes (t=2)',
                explanation: `P1 increments R1 to ${v1} and writes it back. counter is now ${v1}. P1 is done!`,
                insight: 'Without interruption, P1 completes the entire update cycle safely.',
                insightTitle: 'Atomic Block Complete',
                conceptTag: 'STEP 2: WRITE',
                conceptDef: 'P1 completes its transaction and updates primary memory.',
                state: { counter: v1, r1: v1, r2: null, activeProc: 'P1', line: `WRITE R1 (${v1}) -> counter`, p1Status: 'done', p2Status: 'ready', hasBug: false }
            },
            {
                phase: 'P2 begins: reads counter (t=3)',
                explanation: `P2 is scheduled. It reads the updated counter (${v1}) into its register R2.`,
                insight: 'Since P1 finished, P2 starts with the correct, fresh value of counter.',
                insightTitle: 'Reading Fresh Data',
                conceptTag: 'STEP 3: LOAD P2',
                conceptDef: 'P2 loads the updated counter value from memory.',
                state: { counter: v1, r1: v1, r2: v1, activeProc: 'P2', line: `LOAD counter (${v1}) -> R2`, p1Status: 'done', p2Status: 'reading', hasBug: false }
            },
            {
                phase: 'P2 increments & writes (t=4)',
                explanation: `P2 increments R2 to ${v2} and writes it back. counter is now ${v2}.`,
                insight: 'Success! Both increments were fully saved. counter correctly ends at initial + 2 * step.',
                insightTitle: 'Safe Execution Completed',
                conceptTag: 'STEP 4: COMPLETE',
                conceptDef: 'Both transactions executed atomically, resulting in the correct final value.',
                state: { counter: v2, r1: v1, r2: v2, activeProc: 'P2', line: `WRITE R2 (${v2}) -> counter`, p1Status: 'done', p2Status: 'done', hasBug: false }
            }
        ];
    }

    if (schedule === 'sequential_p2') {
        return [
            {
                phase: 'Initial State (t=0)',
                explanation: `Sequential mode: P2 runs to completion first, then P1. Initial counter = ${v0}.`,
                insight: 'The final sum will be identical to running P1 first, showing order does not matter as long as they are sequential.',
                insightTitle: 'Commutative Atomicity',
                conceptTag: 'SCHEDULE: SAFE SEQUENTIAL P2->P1',
                conceptDef: 'Sequential scheduling prevents race conditions regardless of process order.',
                state: { counter: v0, r1: null, r2: null, activeProc: null, line: '', p1Status: 'ready', p2Status: 'ready', hasBug: false }
            },
            {
                phase: 'P2 reads counter (t=1)',
                explanation: `P2 loads counter (${v0}) into register R2.`,
                insight: 'P2 begins its exclusive update block.',
                insightTitle: 'Isolated Load',
                conceptTag: 'STEP 1: LOAD P2',
                conceptDef: 'P2 copies the shared variable to its local core register R2.',
                state: { counter: v0, r1: null, r2: v0, activeProc: 'P2', line: `LOAD counter (${v0}) -> R2`, p1Status: 'ready', p2Status: 'reading', hasBug: false }
            },
            {
                phase: 'P2 increments & writes (t=2)',
                explanation: `P2 increments R2 to ${v1} and writes it back. counter is now ${v1}. P2 is done!`,
                insight: 'P2 commits its update safely.',
                insightTitle: 'P2 Done',
                conceptTag: 'STEP 2: WRITE P2',
                conceptDef: 'P2 completes its transaction and updates primary memory.',
                state: { counter: v1, r1: null, r2: v1, activeProc: 'P2', line: `WRITE R2 (${v1}) -> counter`, p1Status: 'ready', p2Status: 'done', hasBug: false }
            },
            {
                phase: 'P1 begins: reads counter (t=3)',
                explanation: `P1 is scheduled. It reads the updated counter (${v1}) into R1.`,
                insight: 'P1 correctly reads the fresh counter written by P2.',
                insightTitle: 'Fresh Data Access',
                conceptTag: 'STEP 3: LOAD P1',
                conceptDef: 'P1 loads the updated counter value from memory.',
                state: { counter: v1, r1: v1, r2: v1, activeProc: 'P1', line: `LOAD counter (${v1}) -> R1`, p1Status: 'reading', p2Status: 'done', hasBug: false }
            },
            {
                phase: 'P1 increments & writes (t=4)',
                explanation: `P1 increments R1 to ${v2} and writes it back. counter is now ${v2}.`,
                insight: 'Success! The result is correct and no data was lost.',
                insightTitle: 'Consistent Storage State',
                conceptTag: 'STEP 4: COMPLETE',
                conceptDef: 'Transactions executed atomically, resulting in the correct final value.',
                state: { counter: v2, r1: v2, r2: v1, activeProc: 'P1', line: `WRITE R1 (${v2}) -> counter`, p1Status: 'done', p2Status: 'done', hasBug: false }
            }
        ];
    }

    // Default: Interleaved (Race Condition)
    return [
        {
            phase: 'Initial State (t=0)',
            explanation: `P1 and P2 both wish to add ${s1} to counter. Initial counter = ${v0}.`,
            insight: `Since both modify the same variable, the final value should be ${v2}. Let's watch how interleaving breaks this.`,
            insightTitle: 'The Collision Hazard',
            conceptTag: 'CONCEPT: RACE CONDITION',
            conceptDef: 'A concurrent flaw where CPU interleaving of non-atomic steps causes data corruption.',
            state: { counter: v0, r1: null, r2: null, activeProc: null, line: '', p1Status: 'ready', p2Status: 'ready', hasBug: false }
        },
        {
            phase: 'P1 reads counter (t=1)',
            explanation: `P1 reads counter (${v0}) into register R1.`,
            insight: `P1's local copy is R1 = ${v0}. It hasn't written anything to main memory yet.`,
            insightTitle: 'Isolated Copy',
            conceptTag: 'STEP 1: LOAD P1',
            conceptDef: 'P1 reads the shared value before incrementing.',
            state: { counter: v0, r1: v0, r2: null, activeProc: 'P1', line: `LOAD counter (${v0}) -> R1`, p1Status: 'reading', p2Status: 'ready', hasBug: false }
        },
        {
            phase: 'Context Switch! P2 reads (t=2)',
            explanation: `P1 is preempted. CPU switches to P2. P2 reads counter (still ${v0}) into register R2.`,
            insight: `Both processes now hold ${v0} in their registers. Neither knows about the other.`,
            insightTitle: 'Preemption Trap',
            conceptTag: 'STEP 2: PREEMPTION',
            conceptDef: 'OS context switch copies identical old state to P2.',
            state: { counter: v0, r1: v0, r2: v0, activeProc: 'P2', line: `LOAD counter (${v0}) -> R2`, p1Status: 'suspended', p2Status: 'reading', hasBug: false }
        },
        {
            phase: 'P2 increments & writes (t=3)',
            explanation: `P2 increments R2 to ${v1} and writes it back to memory. counter is now ${v1}.`,
            insight: 'P2 believes its transaction succeeded perfectly. counter has increased.',
            insightTitle: 'Partial Increment Done',
            conceptTag: 'STEP 3: WRITE BACK P2',
            conceptDef: 'P2 commits its local update to the shared memory.',
            state: { counter: v1, r1: v0, r2: v1, activeProc: 'P2', line: `WRITE R2 (${v1}) -> counter`, p1Status: 'suspended', p2Status: 'done', hasBug: false }
        },
        {
            phase: 'Context Switch! P1 resumes (t=4)',
            explanation: `P1 is rescheduled. It restores its register R1 = ${v0}, unaware memory has changed to ${v1}!`,
            insight: 'P1 is about to perform math on stale data. The upcoming write will overwrite P2\'s work.',
            insightTitle: 'The Stale Data Trap',
            conceptTag: 'STEP 4: RESUME P1',
            conceptDef: 'Resuming P1 restores its registers containing the outdated counter value.',
            state: { counter: v1, r1: v0, r2: v1, activeProc: 'P1', line: 'RESUME P1 State', p1Status: 'reading', p2Status: 'done', hasBug: false }
        },
        {
            phase: 'P1 increments register (t=5)',
            explanation: `P1 increments R1 to ${v1} locally.`,
            insight: 'R1 is now 1, even though the counter is already 1.',
            insightTitle: 'Outdated Increment',
            conceptTag: 'STEP 5: MODIFY R1',
            conceptDef: 'ALU modifies the local register by step value.',
            state: { counter: v1, r1: v1, r2: v1, activeProc: 'P1', line: `ADD R1, ${s1}`, p1Status: 'modifying', p2Status: 'done', hasBug: false }
        },
        {
            phase: 'Overwrite! Lost Update! (t=6)',
            explanation: `P1 writes R1 (${v1}) back to memory. It overwrites counter with ${v1}!`,
            insight: `P2's increment was completely erased. We ran 2 increments of +${s1}, but counter only went up by ${s1}!`,
            insightTitle: 'The Overwrite Bug',
            conceptTag: 'STEP 6: OVERWRITE',
            conceptDef: 'The local register value is stored, losing the concurrent process update.',
            state: { counter: v1, r1: v1, r2: v1, activeProc: 'P1', line: `WRITE R1 (${v1}) -> counter`, p1Status: 'done', p2Status: 'done', hasBug: true }
        },
        {
            phase: 'Race Condition Complete (t=7)',
            explanation: `Simulation complete! final counter = ${v1} instead of ${v2}. Highlighted in red.`,
            insight: 'To resolve this, we must use critical section locks or hardware atomic instructions.',
            insightTitle: 'Atomicity Crucial',
            conceptTag: 'CONCEPT: LOST UPDATE',
            conceptDef: 'Failure to perform operations atomically results in stale overwrites.',
            state: { counter: v1, r1: v1, r2: v1, activeProc: null, line: '', p1Status: 'done', p2Status: 'done', hasBug: true }
        }
    ];
}

// STAGE 2 - Critical Section Steps Builder
function buildStage2Steps(p1Dur, p2Dur, protocol) {
    const d1 = +p1Dur;
    const d2 = +p2Dur;

    if (protocol === 'unlocked') {
        // Collision Mode (No Entry Lock protocol)
        return [
            {
                phase: 'No Locks Active (t=0)',
                explanation: 'Entry protocol is disabled ("No Locking"). Processes can enter Critical Section freely.',
                insight: 'Without locks, there is no coordination. Let\'s see what happens when both spaceships request entry.',
                insightTitle: 'Anarchy Protocol',
                conceptTag: 'PROTOCOL: NO LOCKING',
                conceptDef: 'No locks or verification steps are run before accessing shared resources.',
                state: { lock: null, p1Sec: 'remainder', p2Sec: 'remainder', p1Blocked: false, p2Blocked: false, collision: false }
            },
            {
                phase: 'P1 enters Critical Section (t=1)',
                explanation: 'P1 wishes to enter. Since there is no gate lock, it bypasses entry check and enters immediately.',
                insight: 'P1 starts reading and writing shared memory.',
                insightTitle: 'Uncontrolled Entry',
                conceptTag: 'P1: ENTRY',
                conceptDef: 'P1 enters the critical wormhole directly.',
                state: { lock: null, p1Sec: 'critical', p2Sec: 'remainder', p1Blocked: false, p2Blocked: false, collision: false }
            },
            {
                phase: 'P2 requests Entry -> Bypasses! (t=2)',
                explanation: 'P2 also wants to enter. Because entry locks are disabled, P2 does not wait. It flies straight inside!',
                insight: 'P2 enters the wormhole while P1 is still active inside. This violates Mutual Exclusion!',
                insightTitle: 'Mutual Exclusion Broken!',
                conceptTag: 'P2: ENTERS BYPASSING',
                conceptDef: 'P2 enters the critical zone despite P1 being active inside.',
                state: { lock: null, p1Sec: 'critical', p2Sec: 'critical', p1Blocked: false, p2Blocked: false, collision: true }
            },
            {
                phase: 'CRITICAL COLLISION DETECTED! (t=3)',
                explanation: 'COLLISION! Both processes are executing in their Critical Sections simultaneously! Data is corrupt!',
                insight: 'Both spaceships collide inside the single-lane Wormhole. Shared resources are locked/corrupted.',
                insightTitle: 'Data Corruption Risk',
                conceptTag: 'CRITICAL EXPLOSION',
                conceptDef: 'Simultaneous modifications by multiple processes corrupt variable consistency.',
                state: { lock: 'EXPLODED', p1Sec: 'critical', p2Sec: 'critical', p1Blocked: false, p2Blocked: false, collision: true }
            },
            {
                phase: 'Spaceships Exiting (t=4)',
                explanation: 'Both processes leave the Critical wormhole, leaving behind damaged main memory.',
                insight: 'This illustrates why locks and entry checks are strictly required in modern operating systems.',
                insightTitle: 'The Cost of Collisions',
                conceptTag: 'POST EXPLOSION',
                conceptDef: 'Without locking synchronizations, database integrity is permanently lost.',
                state: { lock: null, p1Sec: 'remainder', p2Sec: 'remainder', p1Blocked: false, p2Blocked: false, collision: false }
            }
        ];
    }

    // Strict Locking Protocol (Safe Mutual Exclusion)
    const steps = [
        {
            phase: 'Both in Remainder (t=0)',
            explanation: 'Locking Protocol is active. Gate lock is FREE. Spaceships are in Remainder orbit.',
            insight: 'The lock will guarantee that only a single process accesses the Neon Critical Wormhole at any time.',
            insightTitle: 'Safe Mutual Exclusion',
            conceptTag: 'PROTOCOL: STRICT LOCKING',
            conceptDef: 'Exclusive binary gatekeepers ensure single-process execution in critical code.',
            state: { lock: null, p1Sec: 'remainder', p2Sec: 'remainder', p1Blocked: false, p2Blocked: false, collision: false }
        },
        {
            phase: 'P1 requests lock (t=1)',
            explanation: 'P1 requests CS. It checks lock (FREE), sets lock = P1 (glowing pink wormhole lock acquired).',
            insight: 'P1\'s entry section code has run atomically, ensuring the gate is locked before entry.',
            insightTitle: 'Lock Secured',
            conceptTag: 'P1: LOCK SECURED',
            conceptDef: 'Gatekeeper sets the locking variable to reserve exclusive access.',
            state: { lock: 'P1', p1Sec: 'entry', p2Sec: 'remainder', p1Blocked: false, p2Blocked: false, collision: false }
        }
    ];

    // P1 spends d1 steps in CS
    for (let i = 0; i < d1; i++) {
        const isMiddle = i > 0;
        steps.push({
            phase: `P1 inside Critical Wormhole (t=${2 + i})`,
            explanation: isMiddle
                ? `P1 continues exclusive database write operations inside the Neon Wormhole. Lock = P1.`
                : `P1 enters the single-lane Critical wormhole. P2 is still in its remainder orbit.`,
            insight: 'No other process is allowed in the Critical Wormhole. Mutual Exclusion is fully active.',
            insightTitle: 'Exclusive Flight',
            conceptTag: 'P1: CRITICAL SECTION',
            conceptDef: 'Exclusive code execution block accessing shared memory resources.',
            state: { lock: 'P1', p1Sec: 'critical', p2Sec: 'remainder', p1Blocked: false, p2Blocked: false, collision: false }
        });
    }

    const tAfterP1 = 2 + d1;

    // P2 requests and blocks
    steps.push({
        phase: `P2 requests Entry -> Blocked! (t=${tAfterP1})`,
        explanation: `P2 wants to enter. It checks lock (held by P1) and is BLOCKED at the entry gate.`,
        insight: 'P2 is queued behind the entry velvet rope. It will remain suspended until P1 exits.',
        insightTitle: 'Gate Blocking Active',
        conceptTag: 'P2: BLOCKED',
        conceptDef: 'Processes are suspended if the critical lock is currently occupied.',
        state: { lock: 'P1', p1Sec: 'critical', p2Sec: 'entry', p1Blocked: false, p2Blocked: true, collision: false }
    });

    // P1 exits CS
    steps.push({
        phase: `P1 exits CS & releases lock (t=${tAfterP1 + 1})`,
        explanation: 'P1 executes the Exit Section, sets lock = FREE, and goes back to Remainder orbit.',
        insight: 'The lock release instantly signals the blocked processes waiting at the entry gate.',
        insightTitle: 'Lock Released',
        conceptTag: 'P1: EXIT & RELEASE',
        conceptDef: 'Exit section releases lock and wakes up waiting queues.',
        state: { lock: null, p1Sec: 'exit', p2Sec: 'entry', p1Blocked: false, p2Blocked: true, collision: false }
    });

    // P2 enters CS and spends d2 steps
    steps.push({
        phase: `P2 wakes up & acquires lock (t=${tAfterP1 + 2})`,
        explanation: 'P2 is woken up. It finds lock FREE, sets lock = P2, and enters the Critical Wormhole.',
        insight: 'Mutual Exclusion is satisfied because P1 had exited before P2 was granted entry.',
        insightTitle: 'Safe Lock Handoff',
        conceptTag: 'P2: LOCK ACQUIRED',
        conceptDef: 'Woken process claims the gatekeeper lock and begins execution.',
        state: { lock: 'P2', p1Sec: 'remainder', p2Sec: 'critical', p1Blocked: false, p2Blocked: false, collision: false }
    });

    for (let i = 1; i < d2; i++) {
        steps.push({
            phase: `P2 inside Critical Wormhole (t=${tAfterP1 + 2 + i})`,
            explanation: `P2 continues writing. P1 is orbiting safely in its remainder section.`,
            insight: 'P1 has returned to its local computations without interfering.',
            insightTitle: 'Process Independence',
            conceptTag: 'P2: CRITICAL SECTION',
            conceptDef: 'Processes modify variables in absolute safety from data races.',
            state: { lock: 'P2', p1Sec: 'remainder', p2Sec: 'critical', p1Blocked: false, p2Blocked: false, collision: false }
        });
    }

    const tFinal = tAfterP1 + 2 + d2;
    steps.push({
        phase: `P2 exits Critical Section (t=${tFinal})`,
        explanation: 'P2 finishes, releases lock, and returns to Remainder section. Both processes are safe.',
        insight: 'The timeline completes successfully. High-fidelity locking prevented spaceship collisions.',
        insightTitle: 'Perfect Coordination',
        conceptTag: 'CYCLE COMPLETE',
        conceptDef: 'Strict locking protocols guarantee safe concurrent execution.',
        state: { lock: null, p1Sec: 'remainder', p2Sec: 'exit', p1Blocked: false, p2Blocked: false, collision: false }
    });

    return steps;
}


/* ══════════════════════════════════════════
   MAIN REACT SIMULATOR COMPONENT
   ══════════════════════════════════════════ */
export default function ProcessSyncSim() {
    // Navigable via top stepper
    const [stage, setStage] = useState(1);
    const [speed, setSpeed] = useState(700);

    // Active sub-tab inside Stage 4
    const [stage4Tab, setStage4Tab] = useState('pc');
    // Sub-toggle inside Dining Philosophers (deadlock vs safe)
    const [dpMode, setDpMode] = useState('deadlock');

    // Playback state variables
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [conceptMode, setConceptMode] = useState(false);

    // Dynamic stats computation (Live Stats)
    const [stats, setStats] = useState({
        time: 0,
        inCS: 0,
        waiting: 0,
        switches: 0
    });

    /* ══════════════════════════════════════════
       USER-DEFINED VARIABLES (STATE)
       ══════════════════════════════════════════ */
    // Stage 1 Inputs
    const [s1InitialVal, setS1InitialVal] = useState(0);
    const [s1StepVal, setS1StepVal] = useState(1);
    const [s1Schedule, setS1Schedule] = useState('interleaved'); // interleaved, sequential_p1, sequential_p2

    // Stage 2 Inputs
    const [s2P1CsDuration, setS2P1CsDuration] = useState(2);
    const [s2P2CsDuration, setS2P2CsDuration] = useState(2);
    const [s2Protocol, setS2Protocol] = useState('locked'); // locked vs unlocked (No locking)

    // Stage 3 Inputs
    const [s3ProcessCount, setS3ProcessCount] = useState(3); // 3, 4, 5 processes
    const [s3SemCapacity, setS3SemCapacity] = useState(2); // 1, 2, 3, 4 initial S

    // Stage 4 Inputs
    // PC
    const [s4PCBufferSize, setS4PCBufferSize] = useState(5); // 3 to 8
    // DP
    const [s4DPPhilCount, setS4DPPhilCount] = useState(5); // 3 to 6
    // RW
    const [s4RWReadersCount, setS4RWReadersCount] = useState(3); // 2 to 5
    const [s4RWWritersCount, setS4RWWritersCount] = useState(2); // 1 to 3
    const [s4RWPreference, setS4RWPreference] = useState('reader'); // reader vs writer

    // Timeline steps state
    const [steps, setSteps] = useState([]);
    const timerRef = useRef(null);

    // Stage 3 Sandbox manual states (Active when NOT running automatic simulation)
    const [manualMutex, setManualMutex] = useState({ owner: null, queue: [], logs: ['Mutex Sandbox initialized'] });
    const [manualSem, setManualSem] = useState({ count: 2, queue: [], cs: [], logs: ['Semaphore Sandbox initialized'] });

    // Dynamic builder of timeline depending on active parameters
    const getStepsForActiveStage = useCallback(() => {
        if (stage === 1) {
            return buildStage1Steps(s1InitialVal, s1StepVal, s1Schedule);
        }
        if (stage === 2) {
            return buildStage2Steps(s2P1CsDuration, s2P2CsDuration, s2Protocol);
        }
        if (stage === 3) {
            return buildStage3Steps(); // Predefined guided steps
        }
        if (stage === 4) {
            if (stage4Tab === 'pc') {
                // Return PC bounded steps (adjusting buffers to user length)
                const basePC = buildPCSteps();
                return basePC.map(step => {
                    const nextBuffer = Array(s4PCBufferSize).fill(null);
                    if (step.state.buffer.includes('ITEM')) {
                        // populate item count based on full semaphore
                        const itemCount = Math.max(0, step.state.full);
                        for (let k = 0; k < itemCount; k++) {
                            nextBuffer[k] = 'ITEM';
                        }
                    }
                    return {
                        ...step,
                        state: {
                            ...step.state,
                            buffer: nextBuffer,
                            empty: Math.max(0, s4PCBufferSize - Math.max(0, step.state.full))
                        }
                    };
                });
            }
            if (stage4Tab === 'dp') {
                return dpMode === 'deadlock' ? buildDPDeadlockSteps() : buildDPSafeSteps();
            }
            if (stage4Tab === 'rw') {
                return buildRWSteps();
            }
        }
        if (stage === 5) {
            return buildStage5Steps();
        }
        return [];
    }, [stage, stage4Tab, dpMode, s1InitialVal, s1StepVal, s1Schedule, s2P1CsDuration, s2P2CsDuration, s2Protocol, s4PCBufferSize]);

    // Initialize/Reset timeline when stage or configs change
    const resetSimulation = useCallback(() => {
        clearInterval(timerRef.current);
        const activeSteps = getStepsForActiveStage();
        setSteps(activeSteps);
        setCurrentStep(0);
        setIsRunning(false);
        setIsPaused(false);
        setIsFinished(false);

        // Reset stats
        setStats({
            time: 0,
            inCS: 0,
            waiting: 0,
            switches: 0
        });

        // Reset sandbox states with custom capacity
        setManualMutex({ owner: null, queue: [], logs: ['Mutex Sandbox initialized'] });
        setManualSem({ count: +s3SemCapacity, queue: [], cs: [], logs: [`Counting Semaphore Sandbox initialized (S=${s3SemCapacity})`] });
    }, [getStepsForActiveStage, s3SemCapacity]);

    useEffect(() => {
        resetSimulation();
    }, [stage, stage4Tab, dpMode, s1InitialVal, s1StepVal, s1Schedule, s2P1CsDuration, s2P2CsDuration, s2Protocol, s3SemCapacity, s4PCBufferSize, resetSimulation]);

    // Handle timer playback tick
    const advanceStep = useCallback(() => {
        setCurrentStep((prev) => {
            const next = prev + 1;
            if (next >= steps.length) {
                setIsRunning(false);
                setIsFinished(true);
                clearInterval(timerRef.current);
                return prev;
            }
            return next;
        });
    }, [steps.length]);

    // Start simulation
    const handleStart = () => {
        if (isFinished) {
            resetSimulation();
        }
        setIsRunning(true);
        setIsPaused(false);
        setIsFinished(false);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(advanceStep, speed);
    };

    // Pause simulation
    const handlePause = () => {
        setIsRunning(false);
        setIsPaused(true);
        clearInterval(timerRef.current);
    };

    // Resume simulation
    const handleResume = () => {
        setIsRunning(true);
        setIsPaused(false);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(advanceStep, speed);
    };

    // Step forward
    const handleStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setIsFinished(true);
        }
    };

    // Change playback speed
    const handleSpeedChange = (newSpeed) => {
        setSpeed(newSpeed);
        if (isRunning && !isPaused) {
            clearInterval(timerRef.current);
            timerRef.current = setInterval(advanceStep, newSpeed);
        }
    };

    const currentStepObj = steps[currentStep] || steps[0] || {};
    const curState = currentStepObj.state || {};

    // Dynamic stats computation
    useEffect(() => {
        if (!isRunning && !isPaused && !isFinished) return;

        let inCS = 0;
        let waiting = 0;
        let switches = currentStep;

        if (stage === 1) {
            inCS = curState.activeProc ? 1 : 0;
            waiting = (curState.p1Status === 'suspended' || curState.p2Status === 'suspended') ? 1 : 0;
        } else if (stage === 2) {
            inCS = (curState.p1Sec === 'critical' || curState.p2Sec === 'critical') ? 1 : 0;
            waiting = (curState.p1Blocked || curState.p2Blocked) ? 1 : 0;
        } else if (stage === 3) {
            const mutexW = curState.mutexQueue ? curState.mutexQueue.length : 0;
            const semW = curState.semQueue ? curState.semQueue.length : 0;
            waiting = mutexW + semW;
            inCS = (curState.mutexOwner ? 1 : 0) + (curState.semCS ? curState.semCS.length : 0);
        } else if (stage === 4) {
            if (stage4Tab === 'pc') {
                inCS = curState.mutex === 0 ? 1 : 0;
                waiting = curState.full < 0 ? 1 : 0;
            } else if (stage4Tab === 'dp') {
                inCS = curState.phils ? curState.phils.filter(p => p === 'eating').length : 0;
                waiting = curState.phils ? curState.phils.filter(p => p === 'hungry' || p === 'starving').length : 0;
            } else if (stage4Tab === 'rw') {
                inCS = (curState.writer ? 1 : 0) + (curState.readers ? curState.readers.length : 0);
                waiting = curState.blocked ? curState.blocked.length : 0;
            }
        } else if (stage === 5) {
            inCS = curState.focus === 'all' ? 2 : 1;
            waiting = curState.focus === 'deadlock' ? 2 : curState.focus === 'starvation' ? 1 : 0;
        }

        setStats({
            time: currentStep * 3,
            inCS,
            waiting,
            switches
        });
    }, [currentStep, stage, stage4Tab, curState, isRunning, isPaused, isFinished]);

    /* ══════════════════════════════════════════
       Stage 3 Sandbox Operations (Active when NOT running automatic simulation)
       ══════════════════════════════════════════ */
    const isTimelineActive = isRunning || isPaused || isFinished;

    const handleMutexLock = (pid) => {
        setManualMutex(prev => {
            let nextOwner = prev.owner;
            let nextQueue = [...prev.queue];
            let nextLogs = [...prev.logs];

            if (prev.owner === null) {
                nextOwner = pid;
                nextLogs.push(`${pid} requested Mutex lock. Free -> Granted to ${pid}.`);
            } else {
                nextQueue.push(pid);
                nextLogs.push(`${pid} requested lock. Owned by ${prev.owner} -> ${pid} added to sleep queue.`);
            }

            return { owner: nextOwner, queue: nextQueue, logs: nextLogs };
        });
    };

    const handleMutexUnlock = (pid) => {
        setManualMutex(prev => {
            if (prev.owner !== pid) return prev; // strict ownership check!

            let nextOwner = null;
            let nextQueue = [...prev.queue];
            let nextLogs = [...prev.logs];

            nextLogs.push(`${pid} released Mutex lock.`);

            if (nextQueue.length > 0) {
                nextOwner = nextQueue.shift();
                nextLogs.push(`Waking up next waiting process: ${nextOwner} gets the lock.`);
            }

            return { owner: nextOwner, queue: nextQueue, logs: nextLogs };
        });
    };

    const handleSemWait = (pid) => {
        setManualSem(prev => {
            let nextCount = prev.count - 1;
            let nextQueue = [...prev.queue];
            let nextCS = [...prev.cs];
            let nextLogs = [...prev.logs];

            if (nextCount < 0) {
                nextQueue.push(pid);
                nextLogs.push(`${pid} wait(S) -> S decremented to ${nextCount}. Slots full -> ${pid} BLOCKED.`);
            } else {
                nextCS.push(pid);
                nextLogs.push(`${pid} wait(S) -> S decremented to ${nextCount}. Slot free -> ${pid} enters VIP CS.`);
            }

            return { count: nextCount, queue: nextQueue, cs: nextCS, logs: nextLogs };
        });
    };

    const handleSemSignal = (pid) => {
        setManualSem(prev => {
            if (!prev.cs.includes(pid)) return prev; // Only processes inside CS can signal

            let nextCount = prev.count + 1;
            let nextQueue = [...prev.queue];
            let nextCS = prev.cs.filter(p => p !== pid);
            let nextLogs = [...prev.logs];

            nextLogs.push(`${pid} signal(S) from CS -> S incremented to ${nextCount}.`);

            if (nextCount <= 0 && nextQueue.length > 0) {
                const woken = nextQueue.shift();
                nextCS.push(woken);
                nextLogs.push(`Blocked queue not empty -> Popping & waking ${woken} inside VIP CS.`);
            }

            return { count: nextCount, queue: nextQueue, cs: nextCS, logs: nextLogs };
        });
    };

    /* ══════════════════════════════════════════
       CREATIVE RENDER METHODS (Center Panel)
       ══════════════════════════════════════════ */

    // Center Stage 1: Conveyor Punchcards & Memory Vault
    const renderCenterStage1 = () => {
        const p1Status = curState.p1Status || 'ready';
        const p2Status = curState.p2Status || 'ready';
        const activeProc = curState.activeProc;
        const line = curState.line || '';

        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', padding: '1rem', overflowY: 'auto' }}>

                {/* Configuration control panel */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '0.6rem', border: '3px solid var(--border)', background: 'var(--white)', padding: '0.5rem', boxShadow: '3px 3px 0 var(--border)', flexShrink: 0 }}>
                    <div>
                        <label style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>Initial Counter:</label>
                        <input
                            type="number" min={0} max={99}
                            value={s1InitialVal}
                            onChange={e => setS1InitialVal(+e.target.value || 0)}
                            style={{ border: '2px solid var(--border)', fontFamily: 'var(--font-mono)', fontWeight: 900, width: '100%', fontSize: '0.8rem', padding: '2px 6px' }}
                            disabled={isTimelineActive}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>Increment Step:</label>
                        <input
                            type="number" min={1} max={10}
                            value={s1StepVal}
                            onChange={e => setS1StepVal(+e.target.value || 1)}
                            style={{ border: '2px solid var(--border)', fontFamily: 'var(--font-mono)', fontWeight: 900, width: '100%', fontSize: '0.8rem', padding: '2px 6px' }}
                            disabled={isTimelineActive}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>Interleaving Schedule:</label>
                        <select
                            value={s1Schedule}
                            onChange={e => setS1Schedule(e.target.value)}
                            style={{ border: '2px solid var(--border)', fontFamily: 'var(--font-main)', fontWeight: 700, width: '100%', fontSize: '0.8rem', padding: '2px 4px' }}
                            disabled={isTimelineActive}
                        >
                            <option value="interleaved">Interleaved Schedule (Race Condition)</option>
                            <option value="sequential_p1">Sequential: P1 first, then P2 (Safe)</option>
                            <option value="sequential_p2">Sequential: P2 first, then P1 (Safe)</option>
                        </select>
                    </div>
                </div>

                {/* Shared Vault Card */}
                <div style={{
                    background: curState.hasBug ? 'var(--pink)' : 'var(--yellow)', border: '3px solid var(--border)',
                    boxShadow: '4px 4px 0 var(--border)', padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.3s'
                }}>
                    <div>
                        <div style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.6 }}>Glowing Memory Vault</div>
                        <div style={{ fontWeight: 900, fontSize: '1.2rem', fontFamily: 'var(--font-mono)' }}>shared int counter = {curState.counter ?? 0};</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        {curState.hasBug && (
                            <motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} style={{ background: 'red', color: 'white', border: '1.5px solid var(--border)', padding: '2px 8px', fontSize: '0.62rem', fontWeight: 900 }}>
                                Overwrite Bug! Expected {+s1InitialVal + 2 * (+s1StepVal)}
                            </motion.span>
                        )}
                        {!curState.hasBug && isFinished && (
                            <span style={{ background: 'var(--green)', border: '1.5px solid var(--border)', padding: '2px 8px', fontSize: '0.62rem', fontWeight: 900 }}>
                                Safe Completed!
                            </span>
                        )}
                    </div>
                </div>

                {/* Conveyor Belt Lanes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1, minHeight: 0 }}>
                    {/* Process 1 Conveyor Factory */}
                    <div style={{
                        border: '3px solid var(--border)', background: 'var(--white)',
                        boxShadow: activeProc === 'P1' ? '5px 5px 0 var(--border)' : '2px 2px 0 var(--border)',
                        borderColor: activeProc === 'P1' ? 'var(--pink)' : 'var(--border)',
                        display: 'flex', flexDirection: 'column', overflow: 'hidden'
                    }}>
                        <div style={{ background: activeProc === 'P1' ? 'var(--pink)' : '#eee', borderBottom: '3px solid var(--border)', padding: '0.4rem 0.8rem', fontWeight: 900, display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><FactoryIcon size={16} /> P1 Instruction Factory</span>
                            <span style={{ fontSize: '0.6rem', textTransform: 'uppercase' }}>{p1Status}</span>
                        </div>
                        <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, justifyContent: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: '#fafafa', border: '2px solid var(--border)', padding: '4px' }}>
                                <div style={{ fontSize: '0.5rem', opacity: 0.5, fontWeight: 900, marginBottom: 2 }}>CONVEYOR TRACK: P1</div>
                                <motion.div animate={p1Status === 'reading' ? { x: [0, 10, 0] } : {}} style={{ border: '2px solid var(--border)', padding: '2px 6px', background: p1Status === 'reading' ? 'var(--pink)' : 'var(--white)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: p1Status === 'reading' ? 900 : 400, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <InboxIcon size={12} /> 1. LOAD counter -&gt; R1
                                </motion.div>
                                <motion.div animate={p1Status === 'modifying' ? { scale: [1, 1.03, 1] } : {}} style={{ border: '2px solid var(--border)', padding: '2px 6px', background: p1Status === 'modifying' ? 'var(--pink)' : 'var(--white)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: p1Status === 'modifying' ? 900 : 400, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <GearIcon size={12} /> 2. ADD R1, {s1StepVal}
                                </motion.div>
                                <motion.div style={{ border: '2px solid var(--border)', padding: '2px 6px', background: line.includes('WRITE R1') ? 'var(--pink)' : 'var(--white)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: line.includes('WRITE R1') ? 900 : 400, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <OutboxIcon size={12} /> 3. STORE R1 -&gt; counter
                                </motion.div>
                            </div>
                            <div style={{ border: '2px dashed var(--border)', padding: '0.4rem', textAlign: 'center', background: '#fafafa' }}>
                                <div style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.5 }}>Register R1</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{curState.r1 !== null ? curState.r1 : '—'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Process 2 Conveyor Factory */}
                    <div style={{
                        border: '3px solid var(--border)', background: 'var(--white)',
                        boxShadow: activeProc === 'P2' ? '5px 5px 0 var(--border)' : '2px 2px 0 var(--border)',
                        borderColor: activeProc === 'P2' ? 'var(--cyan)' : 'var(--border)',
                        display: 'flex', flexDirection: 'column', overflow: 'hidden'
                    }}>
                        <div style={{ background: activeProc === 'P2' ? 'var(--cyan)' : '#eee', borderBottom: '3px solid var(--border)', padding: '0.4rem 0.8rem', fontWeight: 900, display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><FactoryIcon size={16} /> P2 Instruction Factory</span>
                            <span style={{ fontSize: '0.6rem', textTransform: 'uppercase' }}>{p2Status}</span>
                        </div>
                        <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, justifyContent: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: '#fafafa', border: '2px solid var(--border)', padding: '4px' }}>
                                <div style={{ fontSize: '0.5rem', opacity: 0.5, fontWeight: 900, marginBottom: 2 }}>CONVEYOR TRACK: P2</div>
                                <motion.div animate={p2Status === 'reading' ? { x: [0, 10, 0] } : {}} style={{ border: '2px solid var(--border)', padding: '2px 6px', background: p2Status === 'reading' ? 'var(--cyan)' : 'var(--white)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: p2Status === 'reading' ? 900 : 400, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <InboxIcon size={12} /> 1. LOAD counter -&gt; R2
                                </motion.div>
                                <motion.div animate={p2Status === 'modifying' ? { scale: [1, 1.03, 1] } : {}} style={{ border: '2px solid var(--border)', padding: '2px 6px', background: p2Status === 'modifying' ? 'var(--cyan)' : 'var(--white)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: p2Status === 'modifying' ? 900 : 400, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <GearIcon size={12} /> 2. ADD R2, {s1StepVal}
                                </motion.div>
                                <motion.div style={{ border: '2px solid var(--border)', padding: '2px 6px', background: line.includes('WRITE R2') ? 'var(--cyan)' : 'var(--white)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: line.includes('WRITE R2') ? 900 : 400, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <OutboxIcon size={12} /> 3. STORE R2 -&gt; counter
                                </motion.div>
                            </div>
                            <div style={{ border: '2px dashed var(--border)', padding: '0.4rem', textAlign: 'center', background: '#fafafa' }}>
                                <div style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.5 }}>Register R2</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{curState.r2 !== null ? curState.r2 : '—'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ border: '3px solid var(--border)', background: '#222', color: '#00ff00', padding: '0.5rem 0.8rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', boxShadow: '3px 3px 0 var(--border)' }}>
                    &gt; LOG: {line ? `Process ${activeProc} executes: "${line}"` : 'Vault doors aligned. Schedule loaded.'}
                </div>
            </div>
        );
    };

    // Center Stage 2: Space Wormholes and Rocket Collisions
    const renderCenterStage2 = () => {
        const p1Sec = curState.p1Sec || 'remainder';
        const p2Sec = curState.p2Sec || 'remainder';
        const collision = curState.collision ?? false;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', padding: '1rem', overflowY: 'auto' }}>

                {/* Configuration control panel */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '0.6rem', border: '3px solid var(--border)', background: 'var(--white)', padding: '0.5rem', boxShadow: '3px 3px 0 var(--border)', flexShrink: 0 }}>
                    <div>
                        <label style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>P1 Wormhole Sleep:</label>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input
                                type="range" min={1} max={5}
                                value={s2P1CsDuration}
                                onChange={e => setS2P1CsDuration(+e.target.value)}
                                style={{ flex: 1 }}
                                disabled={isTimelineActive}
                            />
                            <span style={{ fontSize: '0.75rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{s2P1CsDuration}t</span>
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>P2 Wormhole Sleep:</label>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input
                                type="range" min={1} max={5}
                                value={s2P2CsDuration}
                                onChange={e => setS2P2CsDuration(+e.target.value)}
                                style={{ flex: 1 }}
                                disabled={isTimelineActive}
                            />
                            <span style={{ fontSize: '0.75rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{s2P2CsDuration}t</span>
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>Entry Locking Protocol:</label>
                        <select
                            value={s2Protocol}
                            onChange={e => setS2Protocol(e.target.value)}
                            style={{ border: '2px solid var(--border)', fontFamily: 'var(--font-main)', fontWeight: 700, width: '100%', fontSize: '0.8rem', padding: '2px 4px' }}
                            disabled={isTimelineActive}
                        >
                            <option value="locked">Strict Locking (Safe Mutual Exclusion)</option>
                            <option value="unlocked">No Locking (Permit Collision demo!)</option>
                        </select>
                    </div>
                </div>

                {/* Spaceship Orbit Canvas */}
                <div style={{
                    border: '3px solid var(--border)', background: '#111', position: 'relative', flex: 1, minHeight: 260,
                    boxShadow: '4px 4px 0 var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1rem'
                }}>

                    {/* Stars Decors */}
                    <div style={{ position: 'absolute', top: '15%', left: '20%', width: 2, height: 2, background: '#fff', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', top: '40%', left: '75%', width: 3, height: 3, background: '#fff', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', bottom: '25%', left: '45%', width: 2, height: 2, background: '#fff', borderRadius: '50%' }} />

                    {/* Orbit space labels */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', zIndex: 2, pointerEvents: 'none' }}>
                        <span style={{ color: '#aaa', fontSize: '0.55rem', fontWeight: 900, border: '1.5px solid #444', padding: '2px 6px', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: '4px' }}><SatelliteIcon size={12} /> REMAINDER ORBIT (P1)</span>
                        <span style={{ color: '#aaa', fontSize: '0.55rem', fontWeight: 900, border: '1.5px solid #444', padding: '2px 6px', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: '4px' }}><SatelliteIcon size={12} /> REMAINDER ORBIT (P2)</span>
                    </div>

                    {/* Spaceship Avatars */}
                    {/* Ship P1 */}
                    <motion.div
                        animate={
                            p1Sec === 'remainder' ? { y: [0, -10, 0], x: [0, 8, 0] } :
                                p1Sec === 'entry' ? { x: -80, y: 15 } :
                                    p1Sec === 'critical' ? { x: 0, y: 35, scale: 1.1 } : { x: 80, y: -20 }
                        }
                        transition={{ duration: 0.6 }}
                        style={{
                            position: 'absolute', top: '35%', left: '25%', transform: 'translate(-50%, -50%)',
                            background: 'var(--pink)', border: '2px solid var(--border)', width: 44, height: 44,
                            borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '3px 3px 0 var(--border)', zIndex: 10
                        }}
                    >
                        <RocketIcon size={20} />
                        <span style={{ fontSize: '0.5rem', fontWeight: 900, color: '#000' }}>P1</span>
                    </motion.div>

                    {/* Ship P2 */}
                    <motion.div
                        animate={
                            p2Sec === 'remainder' ? { y: [0, 10, 0], x: [0, -8, 0] } :
                                p2Sec === 'entry' ? { x: 80, y: 15 } :
                                    p2Sec === 'critical' ? { x: 0, y: 35, scale: 1.1 } : { x: -80, y: -20 }
                        }
                        transition={{ duration: 0.6 }}
                        style={{
                            position: 'absolute', top: '35%', right: '25%', transform: 'translate(50%, -50%)',
                            background: 'var(--cyan)', border: '2px solid var(--border)', width: 44, height: 44,
                            borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '3px 3px 0 var(--border)', zIndex: 10
                        }}
                    >
                        <UFOIcon size={20} />
                        <span style={{ fontSize: '0.5rem', fontWeight: 900, color: '#000' }}>P2</span>
                    </motion.div>

                    {/* Dynamic Central Neon Wormhole (Critical Section) */}
                    <div style={{
                        position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)',
                        width: 220, height: 75, border: '3.5px solid var(--border)',
                        background: 'rgba(0,0,0,0.85)',
                        borderColor: collision ? 'red' : curState.lock ? 'var(--pink)' : '#666',
                        boxShadow: collision ? '0 0 15px red' : curState.lock ? '0 0 15px var(--pink)' : 'none',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', transition: 'all 0.3s'
                    }}>
                        <div style={{ fontSize: '0.58rem', fontWeight: 900, textTransform: 'uppercase', color: '#fff', letterSpacing: '0.1em', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <SwirlIcon size={14} color="#fff" /> NEON CRITICAL WORMHOLE
                        </div>
                        {collision ? (
                            <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity }} style={{ color: 'red', fontWeight: 900, fontSize: '0.78rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <ExplosionIcon size={14} color="red" /> EXPLOSION: BOTH INSIDE!
                            </motion.span>
                        ) : curState.lock ? (
                            <span style={{ color: 'var(--pink)', fontWeight: 900, fontSize: '0.72rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <LockIcon size={14} color="var(--pink)" /> LOCKED BY: {curState.lock}
                            </span>
                        ) : (
                            <span style={{ color: 'var(--green)', fontWeight: 800, fontSize: '0.7rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <UnlockIcon size={14} color="var(--green)" /> WORMHOLE FREE
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', zIndex: 2, pointerEvents: 'none', width: '100%', marginTop: 'auto' }}>
                        <span style={{ color: curState.p1Blocked ? 'red' : '#00ff00', fontSize: '0.65rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {curState.p1Blocked ? <><StopIcon size={12} color="red" /> P1 BLOCKED</> : <><CircleFilled size={8} color="var(--green)" /> P1 CLEAR</>}
                        </span>
                        <span style={{ color: curState.p2Blocked ? 'red' : '#00ff00', fontSize: '0.65rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {curState.p2Blocked ? <><StopIcon size={12} color="red" /> P2 BLOCKED</> : <><CircleFilled size={8} color="var(--green)" /> P2 CLEAR</>}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', border: '3px solid var(--border)', padding: '0.4rem', background: '#fafafa', boxShadow: '3px 3px 0 var(--border)' }}>
                    <div style={{ border: '2px solid var(--border)', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', fontWeight: 900 }}>
                        <span style={{ color: collision ? 'red' : 'var(--green)' }}>{collision ? '✗' : '✓'}</span> Mutex (1 inside)
                    </div>
                    <div style={{ border: '2px solid var(--border)', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', fontWeight: 900 }}>
                        <span style={{ color: 'var(--green)' }}>✓</span> Progress
                    </div>
                    <div style={{ border: '2px solid var(--border)', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', fontWeight: 900 }}>
                        <span style={{ color: 'var(--green)' }}>✓</span> Bounded Wait
                    </div>
                </div>
            </div>
        );
    };

    // Center Stage 3: Treasure Chest Mutex & VIP Lounge Semaphore
    const renderCenterStage3 = () => {
        const activeMutex = isTimelineActive ? {
            owner: curState.mutexOwner,
            queue: curState.mutexQueue || [],
            logs: curState.mutexLogs || []
        } : manualMutex;

        const activeSem = isTimelineActive ? {
            count: curState.semCount ?? 2,
            queue: curState.semQueue || [],
            cs: curState.semCS || [],
            logs: curState.semLogs || []
        } : manualSem;

        // Sem colors S count
        const getSemColor = (val) => {
            if (val > 1) return 'var(--green)';
            if (val === 1) return 'var(--orange)';
            return 'var(--pink)';
        };

        const processesList = Array.from({ length: +s3ProcessCount }, (_, idx) => `P${idx + 1}`);

        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', padding: '1rem', overflowY: 'auto' }}>

                {/* Configuration control panel */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', border: '3px solid var(--border)', background: 'var(--white)', padding: '0.5rem', boxShadow: '3px 3px 0 var(--border)', flexShrink: 0 }}>
                    <div>
                        <label style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>Processes Set Count:</label>
                        <select
                            value={s3ProcessCount}
                            onChange={e => setS3ProcessCount(+e.target.value)}
                            style={{ border: '2px solid var(--border)', fontFamily: 'var(--font-main)', fontWeight: 700, width: '100%', fontSize: '0.8rem', padding: '2px 4px' }}
                            disabled={isTimelineActive}
                        >
                            <option value={3}>3 Processes (P1, P2, P3)</option>
                            <option value={4}>4 Processes (P1, P2, P3, P4)</option>
                            <option value={5}>5 Processes (P1, P2, P3, P4, P5)</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>Semaphore VIP Slots S:</label>
                        <input
                            type="number" min={1} max={4}
                            value={s3SemCapacity}
                            onChange={e => setS3SemCapacity(Math.min(4, Math.max(1, +e.target.value)))}
                            style={{ border: '2px solid var(--border)', fontFamily: 'var(--font-mono)', fontWeight: 900, width: '100%', fontSize: '0.8rem', padding: '2px 6px' }}
                            disabled={isTimelineActive}
                        />
                    </div>
                </div>

                {!isTimelineActive && (
                    <div style={{
                        background: 'var(--cyan)', border: '2px solid var(--border)',
                        boxShadow: '2px 2px 0 var(--border)', padding: '4px 10px', fontSize: '0.68rem', fontWeight: 800, textAlign: 'center',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                    }}>
                        <GamepadIcon size={16} /> MANUAL SANDBOX: Lock/Unlock chest or wait/signal semaphores below!
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1, minHeight: 0 }}>
                    {/* Left: Royal Chest Mutex */}
                    <div style={{ border: '3px solid var(--border)', background: 'var(--white)', boxShadow: '3px 3px 0 var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ background: 'var(--yellow)', borderBottom: '3px solid var(--border)', padding: '0.4rem 0.8rem', fontWeight: 900, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CrownIcon size={16} /> Royal Chest Mutex (Capacity = 1)
                        </div>
                        <div style={{ padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1, overflowY: 'auto' }}>

                            {/* Graphic Chest */}
                            <div style={{ border: '2px solid var(--border)', padding: '0.4rem', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', height: 64 }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    {activeMutex.owner ? <LockIcon size={28} /> : <UnlockIcon size={28} />}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.55rem', fontWeight: 900, opacity: 0.5 }}>CHEST LOCK:</span>
                                    <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}>
                                        {activeMutex.owner ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <KeyIcon size={14} /> Held by {activeMutex.owner}
                                            </span>
                                        ) : 'FREE (Key in Chest)'}
                                    </strong>
                                </div>
                            </div>

                            {/* Queue velvet rope */}
                            <div style={{ border: '2.5px dashed var(--border)', padding: '0.4rem', background: '#fff' }}>
                                <div style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.5, marginBottom: 4 }}> Velvet Rope Sleep Queue:</div>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                    {activeMutex.queue.length === 0 ? (
                                        <span style={{ fontSize: '0.68rem', opacity: 0.4 }}>Rope is empty</span>
                                    ) : (
                                        activeMutex.queue.map((p, idx) => (
                                            <div key={idx} style={{ background: 'var(--pink)', border: '1.5px solid var(--border)', padding: '1px 6px', fontSize: '0.68rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                                                {p}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Mutex Controls */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.5 }}>Sandbox keys</div>
                                {processesList.map(p => {
                                    const holds = activeMutex.owner === p;
                                    const queued = activeMutex.queue.includes(p);
                                    return (
                                        <div key={p} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                            <span style={{ fontWeight: 900, fontSize: '0.75rem', width: 24 }}>{p}:</span>
                                            <button
                                                className="btn btn-sm btn-yellow"
                                                onClick={() => handleMutexLock(p)}
                                                disabled={isTimelineActive || holds || queued}
                                                style={{ flex: 1, padding: '1px 6px', fontSize: '0.68rem' }}
                                            >
                                                Acquire
                                            </button>
                                            <button
                                                className="btn btn-sm"
                                                onClick={() => handleMutexUnlock(p)}
                                                disabled={isTimelineActive || !holds}
                                                style={{ flex: 1, padding: '1px 6px', fontSize: '0.68rem' }}
                                            >
                                                Release
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Logs */}
                            <div style={{ border: '2px solid var(--border)', background: '#222', color: '#00ff00', padding: '0.35rem', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', maxHeight: 85, overflowY: 'auto' }}>
                                {activeMutex.logs.slice(-3).map((l, i) => (
                                    <div key={i}>&gt; {l}</div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: VIP Lounge Semaphore */}
                    <div style={{ border: '3px solid var(--border)', background: 'var(--white)', boxShadow: '3px 3px 0 var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ background: 'var(--cyan)', borderBottom: '3px solid var(--border)', padding: '0.4rem 0.8rem', fontWeight: 900, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <UnlockIcon size={16} /> VIP Club Counting Semaphore
                        </div>
                        <div style={{ padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1, overflowY: 'auto' }}>

                            {/* Glow counter */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '2px solid var(--border)', padding: '0.4rem', background: '#fafafa', height: 64 }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>VIP Free Seats S:</span>
                                <div style={{
                                    background: getSemColor(activeSem.count), border: '2px solid var(--border)',
                                    boxShadow: '2px 2px 0 var(--border)', padding: '2px 10px', fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.1rem'
                                }}>
                                    {activeSem.count}
                                </div>
                            </div>

                            {/* VIP Lounge Space */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <div style={{ border: '2px dashed var(--border)', padding: '0.35rem', background: '#fff' }}>
                                    <div style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.5, marginBottom: 2 }}>VIP Lounge (CS):</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {activeSem.cs.length === 0 ? (
                                            <span style={{ fontSize: '0.65rem', opacity: 0.4 }}>Lounge Empty</span>
                                        ) : (
                                            activeSem.cs.map((p, idx) => (
                                                <div key={idx} style={{ background: 'var(--green)', border: '1.5px solid var(--border)', padding: '1px 5px', fontSize: '0.65rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '2px' }}><CoffeeIcon size={12} /> {p}</div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <div style={{ border: '2px dashed var(--border)', padding: '0.35rem', background: '#fff' }}>
                                    <div style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.5, marginBottom: 2 }}>Waiting Velvet:</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {activeSem.queue.length === 0 ? (
                                            <span style={{ fontSize: '0.65rem', opacity: 0.4 }}>Empty velvet</span>
                                        ) : (
                                            activeSem.queue.map((p, idx) => (
                                                <div key={idx} style={{ background: 'var(--pink)', border: '1.5px solid var(--border)', padding: '1px 5px', fontSize: '0.65rem', fontWeight: 900 }}>{p}</div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Semaphore Controls */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.5 }}>Sandbox Waiters</div>
                                {processesList.map(p => {
                                    const inside = activeSem.cs.includes(p);
                                    const queued = activeSem.queue.includes(p);
                                    return (
                                        <div key={p} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                            <span style={{ fontWeight: 900, fontSize: '0.75rem', width: 24 }}>{p}:</span>
                                            <button
                                                className="btn btn-sm btn-cyan"
                                                onClick={() => handleSemWait(p)}
                                                disabled={isTimelineActive || inside || queued}
                                                style={{ flex: 1, padding: '1px 6px', fontSize: '0.68rem' }}
                                            >
                                                wait(S)
                                            </button>
                                            <button
                                                className="btn btn-sm"
                                                onClick={() => handleSemSignal(p)}
                                                disabled={isTimelineActive || !inside}
                                                style={{ flex: 1, padding: '1px 6px', fontSize: '0.68rem' }}
                                            >
                                                signal(S)
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Logs */}
                            <div style={{ border: '2px solid var(--border)', background: '#222', color: '#00ff00', padding: '0.35rem', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', maxHeight: 85, overflowY: 'auto' }}>
                                {activeSem.logs.slice(-3).map((l, i) => (
                                    <div key={i}>&gt; {l}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Center Stage 4: Classic IPC Problems Dynamic Customizer
    const renderCenterStage4 = () => {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.8rem', padding: '0.8rem', overflowY: 'hidden' }}>

                {/* Stage 4 Dynamic Parameter forms */}
                <div style={{ border: '3px solid var(--border)', background: 'var(--white)', padding: '0.5rem', boxShadow: '3px 3px 0 var(--border)', flexShrink: 0 }}>
                    {stage4Tab === 'pc' && (
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}><GearIcon size={14} /> Buffer Capacity:</span>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <input
                                    type="range" min={3} max={8}
                                    value={s4PCBufferSize}
                                    onChange={e => setS4PCBufferSize(+e.target.value)}
                                    disabled={isTimelineActive}
                                />
                                <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{s4PCBufferSize} slots</strong>
                            </div>
                        </div>
                    )}
                    {stage4Tab === 'dp' && (
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}><GearIcon size={14} /> Philosopher Seats:</span>
                                <input
                                    type="number" min={3} max={6}
                                    value={s4DPPhilCount}
                                    onChange={e => setS4DPPhilCount(Math.min(6, Math.max(3, +e.target.value)))}
                                    style={{ border: '2px solid var(--border)', width: 60, fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.8rem', padding: '2px' }}
                                    disabled={isTimelineActive}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>Protocol:</span>
                                <button
                                    onClick={() => { setDpMode('deadlock'); resetSimulation(); }}
                                    className="btn btn-sm btn-pink"
                                    style={{ padding: '2px 8px', fontSize: '0.68rem', border: dpMode === 'deadlock' ? '2.5px solid var(--border)' : '1px solid #ccc', opacity: dpMode === 'deadlock' ? 1 : 0.6 }}
                                >
                                    Deadlock Naive
                                </button>
                                <button
                                    onClick={() => { setDpMode('safe'); resetSimulation(); }}
                                    className="btn btn-sm btn-green"
                                    style={{ padding: '2px 8px', fontSize: '0.68rem', border: dpMode === 'safe' ? '2.5px solid var(--border)' : '1px solid #ccc', opacity: dpMode === 'safe' ? 1 : 0.6 }}
                                >
                                    Safe Asymmetric
                                </button>
                            </div>
                        </div>
                    )}
                    {stage4Tab === 'rw' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 10, alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <span style={{ fontSize: '0.68rem', fontWeight: 900 }}>Readers (2-5):</span>
                                <input
                                    type="number" min={2} max={5}
                                    value={s4RWReadersCount}
                                    onChange={e => setS4RWReadersCount(Math.min(5, Math.max(2, +e.target.value)))}
                                    style={{ border: '2px solid var(--border)', width: 45, fontWeight: 900 }}
                                    disabled={isTimelineActive}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <span style={{ fontSize: '0.68rem', fontWeight: 900 }}>Writers (1-3):</span>
                                <input
                                    type="number" min={1} max={3}
                                    value={s4RWWritersCount}
                                    onChange={e => setS4RWWritersCount(Math.min(3, Math.max(1, +e.target.value)))}
                                    style={{ border: '2px solid var(--border)', width: 45, fontWeight: 900 }}
                                    disabled={isTimelineActive}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <span style={{ fontSize: '0.68rem', fontWeight: 900 }}>Preference:</span>
                                <select
                                    value={s4RWPreference}
                                    onChange={e => setS4RWPreference(e.target.value)}
                                    style={{ border: '2px solid var(--border)', fontSize: '0.72rem', padding: 2 }}
                                    disabled={isTimelineActive}
                                >
                                    <option value="reader">Reader-Preference (Writer Starves)</option>
                                    <option value="writer">Writer-Preference (Fair Scheduling)</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sub-Tabs Selector */}
                <div style={{ display: 'flex', border: '3px solid var(--border)', boxShadow: '3px 3px 0 var(--border)', background: 'var(--white)', flexShrink: 0 }}>
                    <button
                        onClick={() => setStage4Tab('pc')}
                        style={{
                            flex: 1, border: 'none', borderRight: '3px solid var(--border)', padding: '0.4rem', fontWeight: 900,
                            background: stage4Tab === 'pc' ? 'var(--yellow)' : 'var(--white)', cursor: 'pointer', fontSize: '0.8rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                    >
                        <BoxIcon size={16} /> Producer-Consumer
                    </button>
                    <button
                        onClick={() => setStage4Tab('dp')}
                        style={{
                            flex: 1, border: 'none', borderRight: '3px solid var(--border)', padding: '0.4rem', fontWeight: 900,
                            background: stage4Tab === 'dp' ? 'var(--pink)' : 'var(--white)', cursor: 'pointer', fontSize: '0.8rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                    >
                        <FoodIcon size={16} /> Dining Philosophers
                    </button>
                    <button
                        onClick={() => setStage4Tab('rw')}
                        style={{
                            flex: 1, border: 'none', padding: '0.4rem', fontWeight: 900,
                            background: stage4Tab === 'rw' ? 'var(--cyan)' : 'var(--white)', cursor: 'pointer', fontSize: '0.8rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                    >
                        <ClipboardIcon size={16} /> Reader-Writer
                    </button>
                </div>

                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    {stage4Tab === 'pc' && renderPCSubStage()}
                    {stage4Tab === 'dp' && renderDPSubStageUpgraded()}
                    {stage4Tab === 'rw' && renderRWSubStageUpgraded()}
                </div>
            </div>
        );
    };

    // Dining Philosophers Trigonometric Circular Drawing
    const renderDPSubStageUpgraded = () => {
        const phils = curState.phils || ['thinking', 'thinking', 'thinking', 'thinking', 'thinking'];
        const forks = curState.forks || [null, null, null, null, null];
        const deadlocked = curState.deadlocked ?? false;

        const philCount = +s4DPPhilCount;

        const getPhilColor = (state) => {
            if (state === 'thinking') return '#e2e8f0';
            if (state === 'hungry') return 'var(--orange)';
            if (state === 'eating') return 'var(--green)';
            return 'var(--pink)'; // Starving / deadlocked
        };

        const getPhilIcon = (state) => {
            if (state === 'thinking') return <EyeIcon size={20} />;
            if (state === 'hungry') return <ClockIcon size={20} />;
            if (state === 'eating') return <FoodIcon size={20} />;
            return <BlockIcon size={20} />;
        };

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%' }}>
                <div style={{
                    border: '3px solid var(--border)', background: deadlocked ? '#ffebef' : '#fafafa',
                    boxShadow: '3px 3px 0 var(--border)', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden'
                }}>
                    {deadlocked && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,107,157,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, pointerEvents: 'none' }}>
                            <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 1 }} style={{ background: 'var(--pink)', border: '3px solid var(--border)', padding: '6px 12px', fontWeight: 900, boxShadow: '3px 3px 0 var(--border)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <AlertIcon size={16} /> DEADLOCK CYCLE DETECTED!
                            </motion.div>
                        </div>
                    )}

                    {/* Central Dinner Table */}
                    <div style={{
                        width: 120, height: 120, borderRadius: '50%', border: '4px solid var(--border)', background: 'var(--yellow)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', zIndex: 3, boxShadow: '2px 2px 0 var(--border)'
                    }}>
                        <span style={{ fontWeight: 900, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><FoodIcon size={14} /> Table</span>
                        <span style={{ fontSize: '0.55rem', opacity: 0.6, fontWeight: 800 }}>{philCount} Seats</span>
                    </div>

                    {/* Mathematically computed Philosopher Nodes */}
                    {Array.from({ length: philCount }).map((_, idx) => {
                        const state = phils[idx] || 'thinking';

                        // Calculate polar coordinates
                        const angle = (idx * 2 * Math.PI) / philCount - Math.PI / 2;
                        const top = `${50 + 35 * Math.sin(angle)}%`;
                        const left = `${50 + 35 * Math.cos(angle)}%`;

                        return (
                            <motion.div
                                key={idx}
                                style={{
                                    position: 'absolute', transform: 'translate(-50%, -50%)',
                                    top, left,
                                    width: 52, height: 52, borderRadius: '50%', border: '2.5px solid var(--border)',
                                    background: getPhilColor(state), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '2px 2px 0 var(--border)', zIndex: 5
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 20 }}>
                                    {getPhilIcon(state)}
                                </div>
                                <strong style={{ fontSize: '0.62rem', fontWeight: 900, marginTop: '2px' }}>Phil {idx}</strong>
                            </motion.div>
                        );
                    })}

                    {/* Mathematically computed Fork Nodes */}
                    {Array.from({ length: philCount }).map((_, idx) => {
                        const owner = forks[idx];
                        const angleFork = ((idx + 0.5) * 2 * Math.PI) / philCount - Math.PI / 2;
                        const topFork = `${50 + 26 * Math.sin(angleFork)}%`;
                        const leftFork = `${50 + 26 * Math.cos(angleFork)}%`;

                        return (
                            <motion.div
                                key={idx}
                                style={{
                                    position: 'absolute', transform: 'translate(-50%, -50%) rotate(45deg)',
                                    top: topFork, left: leftFork,
                                    width: 10, height: 26, border: '2px solid var(--border)',
                                    background: owner ? 'var(--pink)' : '#888',
                                    boxShadow: '1px 1px 0 var(--border)', zIndex: 4
                                }}
                            >
                                {owner && <span style={{ display: 'block', fontSize: '0.45rem', fontWeight: 900, color: '#fff', transform: 'rotate(-45deg)', textAlign: 'center', marginTop: 1 }}>{owner}</span>}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Reader-Writer Upgraded Spotlights on Shared Book
    const renderRWSubStageUpgraded = () => {
        const readers = curState.readers || [];
        const writer = curState.writer;
        const rwMutex = curState.rwMutex || 'Free';
        const blocked = curState.blocked || [];

        const readCount = +s4RWReadersCount;
        const writeCount = +s4RWWritersCount;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', overflowY: 'auto' }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px', gap: '0.75rem', flex: 1 }}>

                    {/* Database Central Spotlights */}
                    <div style={{ border: '3px solid var(--border)', background: 'var(--white)', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem', boxShadow: '3px 3px 0 var(--border)', position: 'relative' }}>

                        <div style={{ fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.6, position: 'absolute', top: 10, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ClipboardIcon size={14} /> Shared Database Library
                        </div>

                        {/* Giant Book in the middle */}
                        <div style={{
                            width: 130, height: 90, border: '3.5px solid var(--border)', background: 'var(--yellow)',
                            boxShadow: '4px 4px 0 var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 3
                        }}>
                            <ClipboardIcon size={32} />
                            <span style={{ fontSize: '0.58rem', fontWeight: 900, textTransform: 'uppercase', color: '#000', marginTop: '4px' }}>SHARED LEDGER</span>
                            <span style={{ fontSize: '0.5rem', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>lock: {rwMutex}</span>
                        </div>

                        {/* Ray projections for readers */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', zIndex: 4 }}>
                            {writer ? (
                                <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1 }} style={{ background: 'var(--pink)', border: '2px solid var(--border)', padding: '4px 10px', fontWeight: 900, fontSize: '0.72rem', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <WrenchIcon size={14} /> Excl. Writer Scribe: {writer}
                                </motion.div>
                            ) : readers.length > 0 ? (
                                readers.map(r => (
                                    <div key={r} style={{ background: 'var(--cyan)', border: '2px solid var(--border)', padding: '4px 8px', fontWeight: 900, fontSize: '0.7rem', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <EyeIcon size={14} /> Spotlight Beam: {r}
                                    </div>
                                ))
                            ) : (
                                <span style={{ fontSize: '0.72rem', opacity: 0.4, fontStyle: 'italic' }}>No active light beams...</span>
                            )}
                        </div>
                    </div>

                    {/* Blocked rope */}
                    <div style={{ border: '3px solid var(--border)', background: 'var(--white)', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', boxShadow: '3px 3px 0 var(--border)' }}>
                        <div style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>Waiting Scribes/Spotlights</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto' }}>
                            {blocked.length === 0 ? (
                                <span style={{ fontSize: '0.65rem', opacity: 0.4, fontStyle: 'italic' }}>Empty Queue</span>
                            ) : (
                                blocked.map((b, idx) => (
                                    <div key={idx} style={{ background: 'var(--pink)', border: '1.5px solid var(--border)', padding: '3px 6px', fontSize: '0.68rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                                        {b}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Center Stage 5: Bouncing Bridge Livelock and Frustration Starvation Lanes
    const renderCenterStage5 = () => {
        const focus = curState.focus || 'all';

        const getOpacity = (col) => {
            if (focus === 'all') return 1;
            return focus === col ? 1 : 0.3;
        };

        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', padding: '0.8rem', height: '100%', overflowY: 'auto' }}>
                {/* Column 1: Deadlock traffic loop */}
                <div style={{
                    border: '3px solid var(--border)', opacity: getOpacity('deadlock'), background: 'var(--white)',
                    boxShadow: focus === 'deadlock' ? '5px 5px 0 var(--border)' : '2px 2px 0 var(--border)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden'
                }}>
                    <div style={{ background: 'var(--pink)', borderBottom: '3px solid var(--border)', padding: '0.4rem 0.6rem', fontWeight: 900, fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Roundabout Loop</span>
                        <span style={{ fontSize: '0.52rem', background: '#000', color: '#fff', padding: '1px 4px', fontWeight: 900 }}>DEADLOCK</span>
                    </div>
                    <div style={{ padding: '0.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>

                        <div style={{ height: 110, border: '2px dashed var(--border)', position: 'relative', background: '#111', overflow: 'hidden' }}>
                            {/* Circular traffic ring */}
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 64, height: 64, borderRadius: '50%', border: '4.5px solid var(--yellow)' }} />

                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 6, ease: 'linear' }} style={{ position: 'absolute', inset: 0 }}>
                                <div style={{ position: 'absolute', top: 5, left: '45%', border: '1.5px solid var(--border)', background: 'var(--pink)', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <RocketIcon size={12} color="var(--text)" />
                                </div>
                                <div style={{ position: 'absolute', bottom: 5, left: '45%', border: '1.5px solid var(--border)', background: 'var(--cyan)', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <UFOIcon size={12} color="var(--text)" />
                                </div>
                            </motion.div>

                            <span style={{ position: 'absolute', top: '42%', left: '18%', fontSize: '0.5rem', fontWeight: 900, color: 'red', background: '#fff', border: '1px solid var(--border)', padding: '1px 3px' }}>MUTUAL BLOCK</span>
                        </div>
                        <p style={{ fontSize: '0.68rem', opacity: 0.8, lineHeight: 1.35 }}>
                            Each car holds one track section and requests the next. Circular wait prevents any motion (FROZEN state).
                        </p>
                    </div>
                </div>

                {/* Column 2: Stepping Stones Corridor Livelock */}
                <div style={{
                    border: '3px solid var(--border)', opacity: getOpacity('livelock'), background: 'var(--white)',
                    boxShadow: focus === 'livelock' ? '5px 5px 0 var(--border)' : '2px 2px 0 var(--border)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden'
                }}>
                    <div style={{ background: 'var(--orange)', borderBottom: '3px solid var(--border)', padding: '0.4rem 0.6rem', fontWeight: 900, fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Narrow Stepping stone</span>
                        <span style={{ fontSize: '0.52rem', background: '#000', color: '#fff', padding: '1px 4px', fontWeight: 900 }}>LIVELOCK</span>
                    </div>
                    <div style={{ padding: '0.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>

                        <div style={{ height: 110, border: '2px dashed var(--border)', position: 'relative', background: '#e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={{ width: '80%', height: 24, border: '2px solid var(--border)', background: '#94a3b8', display: 'flex', position: 'relative' }}>
                                {/* Avatar 1 */}
                                <motion.div
                                    animate={curState.llState === 'bounce' ? { x: [2, 35, 2] } : { x: 2 }}
                                    transition={{ repeat: Infinity, duration: 1.2 }}
                                    style={{ position: 'absolute', top: 1, left: 0, display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.68rem', fontWeight: 900 }}
                                >
                                    <ActivityIcon size={12} /> P1
                                </motion.div>

                                {/* Avatar 2 */}
                                <motion.div
                                    animate={curState.llState === 'bounce' ? { x: [-2, -35, -2] } : { x: -2 }}
                                    transition={{ repeat: Infinity, duration: 1.2 }}
                                    style={{ position: 'absolute', top: 1, right: 0, display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.68rem', fontWeight: 900 }}
                                >
                                    <ActivityIcon size={12} /> P2
                                </motion.div>
                            </div>
                            <span style={{ fontSize: '0.5rem', fontWeight: 900, background: 'var(--yellow)', border: '1px solid var(--border)', padding: '1px 4px', marginTop: 6 }}>ACTIVE SPINNING: YIELD LOOP</span>
                        </div>
                        <p style={{ fontSize: '0.68rem', opacity: 0.8, lineHeight: 1.35 }}>
                            Both step forward, collide, yield back-and-forth forever. High CPU usage, but zero forward progress (SPINNING state).
                        </p>
                    </div>
                </div>

                {/* Column 3: Priority Starvation Highway */}
                <div style={{
                    border: '3px solid var(--border)', opacity: getOpacity('starvation'), background: 'var(--white)',
                    boxShadow: focus === 'starvation' ? '5px 5px 0 var(--border)' : '2px 2px 0 var(--border)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden'
                }}>
                    <div style={{ background: 'var(--yellow)', borderBottom: '3px solid var(--border)', padding: '0.4rem 0.6rem', fontWeight: 900, fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Bypass Highway</span>
                        <span style={{ fontSize: '0.52rem', background: '#000', color: '#fff', padding: '1px 4px', fontWeight: 900 }}>STARVATION</span>
                    </div>
                    <div style={{ padding: '0.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>

                        <div style={{ height: 110, border: '2px dashed var(--border)', background: '#334155', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '0.4rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <motion.div animate={{ x: [0, 120] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ fontSize: '0.8rem', zIndex: 3 }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#fff', fontWeight: 900 }}><ZapIcon size={14} /> P_high</span>
                                </motion.div>
                                <span style={{ background: 'var(--green)', border: '1px solid var(--border)', fontSize: '0.5rem', padding: '1px 3px', fontWeight: 900 }}>Bypass active</span>
                            </div>
                            <div style={{ border: '2.5px solid var(--border)', background: 'var(--pink)', padding: '3px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 4 }}>
                                <span style={{ fontSize: '0.62rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '2px' }}><ClockIcon size={14} /> P_low</span>
                                <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', fontWeight: 900 }}>Starve={curState.starvCount ?? 0}</span>
                            </div>
                        </div>
                        <p style={{ fontSize: '0.68rem', opacity: 0.8, lineHeight: 1.35 }}>
                            High-priority sports cars zoom through the fast track, while the low-priority tractor stays parked, starved of execution slots.
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    const renderCenterContent = () => {
        if (stage === 1) return renderCenterStage1();
        if (stage === 2) return renderCenterStage2();
        if (stage === 3) return renderCenterStage3();
        if (stage === 4) return renderCenterStage4();
        if (stage === 5) return renderCenterStage5();
        return null;
    };

    /* ══════════════════════════════════════════
       RENDER HELPERS: Left Content
       ══════════════════════════════════════════ */
    const renderLeftContent = () => {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>Simulation Control</div>
                <div style={{ background: 'var(--white)', border: '2px solid var(--border)', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', boxShadow: '2px 2px 0 var(--border)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 900 }}>Stage {stage}/5</div>
                    <div style={{ fontSize: '0.72rem', opacity: 0.7, fontWeight: 700, lineHeight: 1.3 }}>
                        {stage === 1 && 'Race Condition Interleaving'}
                        {stage === 2 && 'Critical Section Protocol'}
                        {stage === 3 && 'Mutex vs Counting Semaphore'}
                        {stage === 4 && `Classic: ${stage4Tab === 'pc' ? 'Producer-Consumer' : stage4Tab === 'dp' ? 'Dining Philosophers' : 'Reader-Writer'}`}
                        {stage === 5 && 'Synchronization Failures'}
                    </div>
                </div>

                <div style={{ height: 2, background: 'var(--border)' }} />

                <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>Live Stats</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ border: '2px solid var(--border)', padding: '0.35rem 0.5rem', background: 'var(--yellow)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, boxShadow: '2px 2px 0 var(--border)' }}>
                        <span>Time Tick t:</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{stats.time}</span>
                    </div>
                    <div style={{ border: '2px solid var(--border)', padding: '0.35rem 0.5rem', background: 'var(--pink)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, boxShadow: '2px 2px 0 var(--border)' }}>
                        <span>Inside CS:</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{stats.inCS}</span>
                    </div>
                    <div style={{ border: '2px solid var(--border)', padding: '0.35rem 0.5rem', background: 'var(--cyan)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, boxShadow: '2px 2px 0 var(--border)' }}>
                        <span>Waiting Queue:</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{stats.waiting}</span>
                    </div>
                    <div style={{ border: '2px solid var(--border)', padding: '0.35rem 0.5rem', background: 'var(--green)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, boxShadow: '2px 2px 0 var(--border)' }}>
                        <span>Context Switches:</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{stats.switches}</span>
                    </div>
                </div>

                <div style={{ height: 2, background: 'var(--border)' }} />

                <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.45 }}>Navigate Stages</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {[
                        { num: 1, label: '1. Race Condition' },
                        { num: 2, label: '2. Critical Section' },
                        { num: 3, label: '3. Mutex vs Sem' },
                        { num: 4, label: '4. Classic IPC' },
                        { num: 5, label: '5. Failure Modes' }
                    ].map(st => (
                        <button
                            key={st.num}
                            onClick={() => setStage(st.num)}
                            style={{
                                border: '2px solid var(--border)', padding: '4px 8px', fontSize: '0.72rem', fontWeight: 900,
                                background: stage === st.num ? 'var(--cyan)' : 'var(--white)',
                                boxShadow: stage === st.num ? 'none' : '2px 2px 0 var(--border)',
                                cursor: 'pointer', textAlign: 'left', display: 'block', width: '100%',
                                transform: stage === st.num ? 'translate(2px, 2px)' : 'none'
                            }}
                        >
                            {st.label}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    /* ══════════════════════════════════════════
       RENDER HELPERS: Right Content
       ══════════════════════════════════════════ */
    const renderRightContent = () => {
        const tag = currentStepObj.conceptTag || 'PROCESS SYNCHRONIZATION';
        const def = currentStepObj.conceptDef || 'Coordination of cooperating processes to secure shared variables from races.';

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                {conceptMode && (
                    <div style={{
                        background: 'var(--purple)', border: '2px solid var(--border)',
                        boxShadow: '3px 3px 0 var(--border)', padding: '0.5rem 0.75rem', fontSize: '0.72rem', fontWeight: 800
                    }}>
                        Concept Mode Active:<br />
                        Showing academic guidelines and core theorems side-by-side!
                    </div>
                )}

                {/* Concept Tag */}
                <div style={{ border: '2px solid var(--border)', background: 'var(--yellow)', padding: '0.4rem 0.6rem', boxShadow: '2px 2px 0 var(--border)' }}>
                    <div style={{ fontSize: '0.55rem', fontWeight: 900, opacity: 0.6 }}>CONCEPT TAG</div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{tag}</div>
                </div>

                {/* Concept Definition */}
                <div style={{ border: '2px solid var(--border)', background: 'var(--white)', padding: '0.6rem', boxShadow: '2px 2px 0 var(--border)' }}>
                    <p style={{ fontSize: '0.75rem', opacity: 0.8, lineHeight: 1.45 }}>{def}</p>
                </div>

                <div style={{ height: 2, background: 'var(--border)' }} />

                {/* Algorithm Logic card */}
                <div className="panel" style={{ boxShadow: '3px 3px 0 var(--border)' }}>
                    <div className="panel-header" style={{ background: 'var(--pink)', fontSize: '0.72rem', padding: '4px 10px' }}>
                        Algorithm Logic
                    </div>
                    <div style={{ padding: '0.6rem', background: 'var(--white)' }}>
                        <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', overflowX: 'auto', background: '#eee', padding: '0.4rem', border: '1.5px solid var(--border)' }}>
                            {stage === 1 && `// Race Condition logic
counter++ compiled into:
1. LOAD counter, Register
2. ADD Register, 1
3. STORE Register, counter`}
                            {stage === 2 && `// Critical Section protocol
do {
  Entry_Section(); // Acquire lock
    Critical_Section();
  Exit_Section(); // Release lock
    Remainder_Section();
} while (true);`}
                            {stage === 3 && `// Mutex & Semaphore operations
Mutex: acquire() / release()
  Capacity = 1

Semaphore: wait() / signal()
  S--; if S<0 block();
  S++; if S<=0 wakeup();`}
                            {stage === 4 && stage4Tab === 'pc' && `// Producer-Consumer
Producer:
  wait(empty);
  wait(mutex);
  insert();
  signal(mutex);
  signal(full);`}
                            {stage === 4 && stage4Tab === 'dp' && `// Dining Philosophers
Philosopher i:
  wait(fork[i]);
  wait(fork[(i+1)%philCount]);
  eat();
  signal(fork[i]);
  signal(fork[(i+1)%philCount]);`}
                            {stage === 4 && stage4Tab === 'rw' && `// First Reader-Writer
Reader:
  wait(mutex);
  readcount++;
  if (readcount==1) wait(rw_mutex);
  signal(mutex);
  // ... reading ...
  wait(mutex);
  readcount--;
  if (readcount==0) signal(rw_mutex);
  signal(mutex);`}
                            {stage === 5 && `// Classic Failure Forms
Deadlock: Circular hold & wait
Livelock: Active state spin
Starvation: Priority lockout`}
                        </pre>
                    </div>
                </div>

                {/* Educational Insight Card */}
                {currentStepObj.insight && (
                    <div className="panel" style={{ boxShadow: '3px 3px 0 var(--border)' }}>
                        <div className="panel-header" style={{ background: 'var(--green)', fontSize: '0.72rem', padding: '4px 10px' }}>
                            {currentStepObj.insightTitle || 'Educational Insight'}
                        </div>
                        <div style={{ padding: '0.6rem', fontSize: '0.75rem', lineHeight: 1.45, background: 'var(--white)' }}>
                            {currentStepObj.insight}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const timelineItems = steps.map((s, idx) => ({
        id: idx,
        label: s.phase.split(' (')[0],
        done: idx < currentStep,
        active: idx === currentStep
    }));

    return (
        <ImmersiveLayout
            isActive={true}
            title="Process Synchronization" icon={<SyncIcon size={22} />} moduleLabel="OS Module"
            isRunning={isRunning} isPaused={isPaused} isFinished={isFinished}
            speed={speed} onSpeedChange={handleSpeedChange}
            onStart={handleStart} onPause={handlePause} onResume={handleResume}
            onReset={resetSimulation} onStep={handleStep}
            currentStepNum={currentStep + 1} totalSteps={steps.length}
            phaseName={currentStepObj.phase || 'Waiting to start...'}
            centerContent={renderCenterContent()}
            leftContent={renderLeftContent()}
            rightContent={renderRightContent()}
            timelineItems={timelineItems}
            legend={[
                { color: 'var(--yellow)', label: 'Entry/Mutex' },
                { color: 'var(--cyan)', label: 'Semaphore' },
                { color: 'var(--pink)', label: 'CS/Blocked' },
                { color: 'var(--green)', label: 'Active/Safe' }
            ]}
            conceptMode={conceptMode}
            onConceptModeToggle={() => setConceptMode(prev => !prev)}
        >
            <div className="main-content">
                <Link to="/os">← Return to OS Landing</Link>
            </div>
        </ImmersiveLayout>
    );
}
