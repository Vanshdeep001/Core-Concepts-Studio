/**
 * notesData.js — Comprehensive placement-oriented study material
 * for every topic across all modules of CS Simulator.
 *
 * Structure per topic:
 *   title, module, icon,
 *   fullNotes: { sections: [{ heading, content, codeSnippet? }] }
 *   interviewPrep: { questions: [{ q, a, difficulty }] }
 *   cheatSheet: { keyPoints, formulas?, comparisons?, mnemonics? }
 */

export const NOTES_DATA = {

  /* ═══════════════════════════════════════════════════════════
     MODULE: OPERATING SYSTEMS
     ═══════════════════════════════════════════════════════════ */

  'os/scheduling': {
    title: 'CPU Scheduling Algorithms',
    module: 'Operating Systems',
    icon: '🖥️',
    fullNotes: {
      sections: [
        {
          heading: 'Introduction to CPU Scheduling',
          content: 'CPU scheduling is the mechanism by which the operating system decides which process in the ready queue should be allocated the CPU next. The scheduler aims to maximize CPU utilization, throughput, and fairness while minimizing turnaround time, waiting time, and response time. Scheduling is essential in multiprogramming environments where multiple processes compete for CPU time.'
        },
        {
          heading: 'Scheduling Criteria',
          content: 'Key metrics: (1) CPU Utilization — keep the CPU as busy as possible (ideally 40-90%). (2) Throughput — number of processes completed per unit time. (3) Turnaround Time — total time from submission to completion. (4) Waiting Time — total time spent in the ready queue. (5) Response Time — time from submission to first response (critical in interactive systems).'
        },
        {
          heading: 'First Come First Served (FCFS)',
          content: 'The simplest scheduling algorithm. Processes are executed in the order they arrive in the ready queue. It is non-preemptive — once a process gets the CPU, it runs to completion. Advantage: Simple to implement using a FIFO queue. Disadvantage: Convoy Effect — short processes stuck behind long ones, leading to high average waiting time.',
          codeSnippet: 'Queue: [P1(24ms), P2(3ms), P3(3ms)]\nGantt: |---P1(0-24)---|P2(24-27)|P3(27-30)|\nAvg Waiting = (0+24+27)/3 = 17ms'
        },
        {
          heading: 'Shortest Job First (SJF)',
          content: 'Selects the process with the smallest next CPU burst. Proven to give the minimum average waiting time among all non-preemptive algorithms. The preemptive version is called Shortest Remaining Time First (SRTF). Main challenge: predicting the next CPU burst length — typically done using exponential averaging: τ(n+1) = α × t(n) + (1-α) × τ(n), where α controls the weight of recent history.'
        },
        {
          heading: 'Round Robin (RR)',
          content: 'Designed for time-sharing systems. Each process gets a fixed time quantum (q). After the quantum expires, the process is preempted and placed at the back of the ready queue. Performance depends heavily on quantum size: too large → degenerates to FCFS; too small → excessive context switching overhead. Rule of thumb: 80% of CPU bursts should be shorter than the time quantum.',
          codeSnippet: 'Time Quantum = 4ms\nQueue: [P1(6ms), P2(3ms), P3(8ms)]\nGantt: |P1(0-4)|P2(4-7)|P3(7-11)|P1(11-13)|P3(13-17)|'
        },
        {
          heading: 'Priority Scheduling',
          content: 'Each process is assigned a priority (lower number = higher priority in most systems). The CPU is allocated to the highest priority process. Can be preemptive or non-preemptive. Key problem: Starvation — low priority processes may never execute. Solution: Aging — gradually increase the priority of waiting processes over time.'
        },
        {
          heading: 'Multilevel Queue Scheduling',
          content: 'The ready queue is partitioned into separate queues (e.g., foreground/interactive, background/batch). Each queue has its own scheduling algorithm. Scheduling between queues is typically fixed-priority preemptive. Multilevel Feedback Queue allows processes to move between queues based on behavior — CPU-bound processes migrate to lower-priority queues.'
        },
        {
          heading: 'Real-World Usage',
          content: 'Linux uses the Completely Fair Scheduler (CFS) based on red-black trees and virtual runtime. Windows uses a priority-based preemptive scheduler with 32 priority levels. Real-time systems use Rate Monotonic (RM) or Earliest Deadline First (EDF) scheduling. Modern schedulers also consider multi-core affinity and NUMA topology.'
        }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'What is the difference between preemptive and non-preemptive scheduling?', a: 'In preemptive scheduling, the OS can interrupt a running process and allocate CPU to another process (e.g., SRTF, RR). In non-preemptive, a process runs until it voluntarily releases CPU (e.g., FCFS, SJF). Preemptive is better for responsiveness, non-preemptive avoids context switch overhead.', difficulty: 'Easy' },
        { q: 'What is the Convoy Effect?', a: 'The Convoy Effect occurs in FCFS when a long CPU-burst process arrives first, blocking all shorter processes behind it. This results in very high average waiting time. Solution: Use SJF or Round Robin instead.', difficulty: 'Easy' },
        { q: 'Why is SJF optimal but impractical?', a: 'SJF gives minimum average waiting time (proven mathematically), but requires knowing future CPU burst lengths in advance, which is impossible in practice. We approximate using exponential averaging of past burst lengths.', difficulty: 'Medium' },
        { q: 'How does aging solve starvation in Priority Scheduling?', a: 'Aging gradually increases the priority of processes that have been waiting for a long time. For example, increment priority by 1 every 15 minutes. Eventually, even the lowest priority process reaches the highest priority and gets executed.', difficulty: 'Medium' },
        { q: 'What happens if the time quantum in Round Robin is too small?', a: 'If quantum is too small (e.g., 1ms), context switching overhead dominates. Each context switch takes ~0.1-10ms for saving/restoring registers, TLB flush, cache warmup. Rule: 80% of bursts should complete within one quantum.', difficulty: 'Medium' },
        { q: 'Explain Multilevel Feedback Queue scheduling.', a: 'MLFQ uses multiple queues with different priorities. New processes enter the highest-priority queue. If a process uses its full time quantum, it moves to a lower-priority queue (indicating CPU-bound behavior). If it voluntarily yields (I/O bound), it stays at the same level. This automatically separates interactive and batch processes.', difficulty: 'Hard' },
        { q: 'What scheduling algorithm does Linux use?', a: 'Linux uses CFS (Completely Fair Scheduler) since kernel 2.6.23. CFS uses a red-black tree keyed by virtual runtime (vruntime). The process with the smallest vruntime runs next. Each process gets CPU time proportional to its weight/priority. CFS provides O(log n) scheduling decisions.', difficulty: 'Hard' },
        { q: 'Compare SRTF vs Round Robin for interactive systems.', a: 'SRTF gives better average waiting time but is non-deterministic for response time — a process with a long burst gets delayed indefinitely. Round Robin guarantees maximum response time = (n-1) × q. For interactive systems, RR is preferred for predictable responsiveness.', difficulty: 'Hard' },
        { q: 'What is the turnaround time formula?', a: 'Turnaround Time = Completion Time - Arrival Time. It includes waiting time + burst time + I/O time. Average Turnaround Time = Sum of all turnaround times / Number of processes.', difficulty: 'Easy' },
        { q: 'What is dispatcher latency?', a: 'Dispatcher latency is the time it takes for the dispatcher to stop one process and start another. It includes context switching, switching to user mode, and jumping to the proper location in the user program. It should be minimized as it is pure overhead.', difficulty: 'Medium' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'FCFS: Non-preemptive, FIFO queue, suffers from Convoy Effect',
        'SJF: Optimal average waiting time, impractical (needs future knowledge)',
        'SRTF: Preemptive SJF, best avg waiting time, risk of starvation',
        'Round Robin: Time quantum based, fair, good for interactive systems',
        'Priority: Risk of starvation, solved by aging',
        'MLFQ: Adaptive, auto-separates CPU-bound and I/O-bound processes',
        'Context switch cost: ~0.1-10ms (save registers, flush TLB, cache cold start)'
      ],
      formulas: [
        'Turnaround Time = Completion Time - Arrival Time',
        'Waiting Time = Turnaround Time - Burst Time',
        'Response Time = First CPU Time - Arrival Time',
        'CPU Utilization = (1 - p^n) where p=I/O probability, n=processes',
        'Throughput = Number of processes / Total time',
        'Exponential Average: τ(n+1) = α·t(n) + (1-α)·τ(n)'
      ],
      comparisons: [
        { left: 'FCFS', right: 'SJF', criteria: ['Non-preemptive vs Non-preemptive', 'Simple vs Optimal avg wait', 'Convoy Effect vs Starvation', 'No prediction vs Needs burst estimation'] },
        { left: 'SJF', right: 'Round Robin', criteria: ['Optimal avg wait vs Fair sharing', 'Batch systems vs Interactive systems', 'Starvation possible vs No starvation', 'Non-preemptive vs Preemptive'] }
      ],
      mnemonics: [
        'FCFS = First Come, First Stuck (Convoy Effect)',
        'SJF = Shortest Job Favored (Starvation risk)',
        'RR = Rapid Rotation (time-shared fairness)'
      ]
    }
  },

  'os/page-replacement': {
    title: 'Page Replacement Algorithms',
    module: 'Operating Systems',
    icon: '📄',
    fullNotes: {
      sections: [
        { heading: 'Virtual Memory & Demand Paging', content: 'Virtual memory allows processes to use more memory than physically available. Pages are loaded into RAM on demand (lazy loading). When a page is accessed but not in RAM, a page fault occurs, triggering the OS to load the page from disk. The page table maps virtual pages to physical frames, with a valid-invalid bit indicating presence in RAM.' },
        { heading: 'Page Fault Handling', content: 'On a page fault: (1) Trap to OS. (2) Save process state. (3) Check if reference is valid. (4) Find a free frame (or select a victim). (5) Read the page from disk into the frame. (6) Update page table. (7) Restart the instruction. Page fault service time ≈ 8ms (disk I/O dominated). Even a 0.1% page fault rate can slow execution by 399x.' },
        { heading: 'FIFO (First In First Out)', content: 'Replace the oldest page in memory. Simple to implement using a queue. Suffers from Belady\'s Anomaly — increasing frames can increase page faults (e.g., reference string 1,2,3,4,1,2,5,1,2,3,4,5 with 3 vs 4 frames). Not commonly used in practice.' },
        { heading: 'Optimal (OPT)', content: 'Replace the page that will not be used for the longest time in the future. Gives the minimum possible page faults. Impossible to implement in practice (requires future knowledge) but serves as a benchmark for comparing other algorithms.' },
        { heading: 'LRU (Least Recently Used)', content: 'Replace the page that has not been used for the longest time. Good performance — approximates OPT by looking backward instead of forward. Implementation: (1) Counter-based: each page has a timestamp, replace page with oldest timestamp. (2) Stack-based: maintain a stack of page references, bottom = LRU page. Hardware support needed for efficiency.' },
        { heading: 'LRU Approximation Algorithms', content: 'Clock Algorithm (Second Chance): Uses a reference bit. Pages arranged in circular buffer. On replacement, check reference bit — if 1, set to 0 and move on; if 0, replace. Enhanced version uses (reference, modify) bit pair for 4 categories. Not Recently Used (NRU) periodically clears reference bits.' },
        { heading: 'Thrashing', content: 'Occurs when a process spends more time paging than executing. Caused by insufficient frames allocated to a process. Detection: high page fault rate + low CPU utilization. Solution: Working Set Model — allocate frames based on the working set (pages accessed in last Δ time units). Also use Page Fault Frequency (PFF) to adjust frame allocation.' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'What is Belady\'s Anomaly?', a: 'In FIFO page replacement, increasing the number of page frames can paradoxically increase the number of page faults. This violates the intuition that more memory should always help. LRU and OPT do NOT suffer from this anomaly because they are stack algorithms.', difficulty: 'Easy' },
        { q: 'Why can\'t we implement the Optimal algorithm?', a: 'OPT requires knowing future page references to decide which page won\'t be used the longest. This is impossible at runtime. It serves as a theoretical lower bound for comparison.', difficulty: 'Easy' },
        { q: 'How does the Clock (Second Chance) algorithm work?', a: 'Pages are arranged in a circular buffer with a clock hand pointer. Each page has a reference bit. When a page is accessed, its bit is set to 1. On replacement: if the page at the hand has bit=1, set it to 0 and advance; if bit=0, replace it. This approximates LRU cheaply.', difficulty: 'Medium' },
        { q: 'What is thrashing and how do you prevent it?', a: 'Thrashing: a process page-faults so frequently that it spends more time swapping than executing. Prevention: (1) Working Set Model — track and allocate pages in the working set. (2) PFF — if page fault rate > threshold, allocate more frames. (3) Reduce degree of multiprogramming.', difficulty: 'Medium' },
        { q: 'What is the effective memory access time with page faults?', a: 'EAT = (1-p) × memory_access_time + p × page_fault_service_time. If memory access = 200ns and page fault service = 8ms, then even p=0.001 gives EAT = 8.2μs — a 40x slowdown.', difficulty: 'Hard' },
        { q: 'Compare LRU vs FIFO vs OPT.', a: 'OPT: Best possible, not implementable. LRU: Near-optimal, expensive (needs hardware/stack). FIFO: Simple, suffers Belady\'s anomaly. In practice, LRU approximations (Clock, NRU) are used — they balance performance and implementation cost.', difficulty: 'Medium' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'Page Fault: page not in RAM → trap → load from disk (~8ms)',
        'FIFO: simple queue, Belady\'s Anomaly possible',
        'OPT: replace page used farthest in future (theoretical best)',
        'LRU: replace least recently used page (practical best)',
        'Clock: circular buffer + reference bit (LRU approximation)',
        'Thrashing: excessive paging → CPU idle → add more processes → worse',
        'Working Set: pages accessed in last Δ time units'
      ],
      formulas: [
        'EAT = (1-p) × ma + p × page_fault_time',
        'Page Fault Rate p should be ≤ 0.0001 for acceptable performance',
        'Working Set W(t,Δ) = pages referenced in interval (t-Δ, t)'
      ]
    }
  },

  'os/bankers': {
    title: 'Banker\'s Algorithm (Deadlock Avoidance)',
    module: 'Operating Systems',
    icon: '🏦',
    fullNotes: {
      sections: [
        { heading: 'Deadlock Overview', content: 'Deadlock occurs when a set of processes are each waiting for a resource held by another process in the set. Four necessary conditions (Coffman conditions): (1) Mutual Exclusion — at least one resource is non-sharable. (2) Hold and Wait — a process holds resources while waiting for others. (3) No Preemption — resources cannot be forcibly taken. (4) Circular Wait — circular chain of processes waiting for each other.' },
        { heading: 'Deadlock Handling Strategies', content: 'Prevention: eliminate one of the four conditions. Avoidance: dynamically check if granting a request leads to an unsafe state (Banker\'s Algorithm). Detection: allow deadlock and detect it using wait-for graphs. Recovery: kill processes or preempt resources. Ignorance: Ostrich Algorithm (used by most OSes — reboot if stuck).' },
        { heading: 'Banker\'s Algorithm', content: 'A deadlock avoidance algorithm that checks if a resource allocation leaves the system in a safe state. Maintains: Available[] (free resources), Max[][] (maximum demand), Allocation[][] (currently allocated), Need[][] = Max - Allocation. Before granting a request, the algorithm simulates allocation and checks if a safe sequence exists.' },
        { heading: 'Safety Algorithm', content: 'Initialize: Work = Available, Finish[i] = false. Find process i where Finish[i]=false AND Need[i] ≤ Work. If found: Work = Work + Allocation[i], Finish[i] = true, repeat. If all Finish[i] = true, system is SAFE. The order in which processes finish forms the safe sequence.',
          codeSnippet: 'Available = [3,3,2]  Max = [[7,5,3],[3,2,2],[9,0,2]]\nAllocation = [[0,1,0],[2,0,0],[3,0,2]]\nNeed = [[7,4,3],[1,2,2],[6,0,0]]\nSafe Sequence: <P1, P3, P0> or <P1, P0, P3>' },
        { heading: 'Resource Request Algorithm', content: 'When process Pi requests resources Request_i: (1) If Request_i > Need_i → error. (2) If Request_i > Available → wait. (3) Pretend-allocate: Available -= Request_i, Allocation_i += Request_i, Need_i -= Request_i. (4) Run Safety Algorithm. If safe → grant. If unsafe → rollback and make Pi wait.' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'What are the four conditions for deadlock?', a: 'Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait. ALL four must hold simultaneously for deadlock to occur. Breaking any one prevents deadlock.', difficulty: 'Easy' },
        { q: 'What is the difference between safe and unsafe states?', a: 'A safe state guarantees that all processes can finish (a safe sequence exists). An unsafe state does NOT mean deadlock is certain — it means deadlock is possible. Banker\'s Algorithm ensures the system never enters an unsafe state.', difficulty: 'Medium' },
        { q: 'What is the time complexity of Banker\'s Algorithm?', a: 'Safety Algorithm: O(m × n²) where m = resource types, n = processes. For each of n iterations, we scan up to n processes and compare m resources. Resource Request adds O(m) for the pretend-allocate step.', difficulty: 'Hard' },
        { q: 'Why is Banker\'s Algorithm not used in practice?', a: 'It requires advance knowledge of maximum resource needs (Max matrix), which is often unknown. It is computationally expensive for large systems. Most OSes use the Ostrich Algorithm (ignore deadlocks) because they are rare in practice.', difficulty: 'Medium' },
        { q: 'How do you detect deadlock in a system?', a: 'For single-instance resources: build a wait-for graph and detect cycles (O(n²)). For multiple-instance resources: use a detection algorithm similar to Banker\'s that checks if current allocation can lead to completion. Run detection periodically or on suspected deadlock.', difficulty: 'Hard' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'Deadlock needs ALL 4 conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait',
        'Need[i][j] = Max[i][j] - Allocation[i][j]',
        'Safe State: at least one safe sequence exists',
        'Unsafe ≠ Deadlock (just means deadlock is possible)',
        'Banker\'s checks safety BEFORE granting any request',
        'Complexity: O(m × n²) per safety check'
      ],
      formulas: [
        'Need = Max - Allocation',
        'Safety check: Find i where Need[i] ≤ Work, then Work += Allocation[i]',
        'Total resources = Available + Σ Allocation[i]'
      ],
      mnemonics: [
        'MHNC = Mutual, Hold, No-preempt, Circular (4 deadlock conditions)',
        'Banker = "Can everyone finish if I lend this?" — conservative lending'
      ]
    }
  },

  'os/disk': {
    title: 'Disk Scheduling Algorithms',
    module: 'Operating Systems',
    icon: '💿',
    fullNotes: {
      sections: [
        { heading: 'Disk Structure & Access Time', content: 'A hard disk has platters with tracks (concentric circles), sectors (arc segments), and a read/write head on an arm. Access time = Seek Time (moving head to track, ~3-15ms) + Rotational Latency (waiting for sector, ~2-6ms at 7200 RPM) + Transfer Time (~0.01ms). Seek time dominates, so disk scheduling focuses on minimizing head movement.' },
        { heading: 'FCFS (First Come First Served)', content: 'Service requests in arrival order. Simple but can cause wild head swings across the disk. Total head movement can be very large for random request patterns.' },
        { heading: 'SSTF (Shortest Seek Time First)', content: 'Service the request nearest to the current head position. Reduces average seek time compared to FCFS. Can cause starvation for requests at the disk extremes. Not optimal — similar to SJF scheduling.' },
        { heading: 'SCAN (Elevator Algorithm)', content: 'Head moves in one direction, servicing requests, until it reaches the end of the disk, then reverses direction. Provides uniform wait time. No starvation. Like an elevator going up then down.' },
        { heading: 'C-SCAN (Circular SCAN)', content: 'Like SCAN but when the head reaches one end, it immediately jumps to the other end without servicing requests on the return trip. Provides more uniform wait time than SCAN. Used when requests are uniformly distributed.' },
        { heading: 'LOOK and C-LOOK', content: 'Variants of SCAN/C-SCAN that reverse direction at the last request in each direction rather than going to the physical end of the disk. More efficient in practice.' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'Why does seek time dominate disk access time?', a: 'Seek time (3-15ms) involves physical movement of the disk arm, which is mechanical and slow. Rotational latency (2-6ms) depends on RPM. Transfer time is <0.01ms. Total access ≈ seek + rotation + transfer, so seek dominates.', difficulty: 'Easy' },
        { q: 'Compare SCAN vs C-SCAN.', a: 'SCAN reverses at disk ends, servicing both directions — requests near the ends just visited get quick service. C-SCAN only services in one direction, jumping back to start — more uniform wait times. C-SCAN is preferred for heavily loaded systems.', difficulty: 'Medium' },
        { q: 'Can SSTF cause starvation?', a: 'Yes. If new requests keep arriving near the current head position, requests far from the head may never get serviced. SCAN/C-SCAN solve this by guaranteeing all requests are serviced in each sweep.', difficulty: 'Easy' },
        { q: 'What scheduling does Linux use for disks?', a: 'Linux has used multiple I/O schedulers: Deadline (prevents starvation with expiry), CFQ (Complete Fairness Queuing), and now mq-deadline and BFQ (Budget Fair Queuing) for multi-queue SSDs. For SSDs, NOOP/None is used since seek time doesn\'t apply.', difficulty: 'Hard' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'Disk Access = Seek Time + Rotational Latency + Transfer Time',
        'FCFS: fair but high total head movement',
        'SSTF: greedy, best local seek, starvation possible',
        'SCAN: elevator — sweep both directions, no starvation',
        'C-SCAN: one-direction sweep, uniform wait times',
        'LOOK/C-LOOK: stop at last request, not disk end',
        'SSDs have no seek time — use NOOP/None scheduler'
      ],
      formulas: [
        'Avg Rotational Latency = (1/2) × (60/RPM) seconds',
        'At 7200 RPM: avg rotation = 4.17ms',
        'Total Head Movement = Σ |current - next| (in cylinders)'
      ]
    }
  },

  'os/sync': {
    title: 'Process Synchronization',
    module: 'Operating Systems',
    icon: '🔄',
    fullNotes: {
      sections: [
        { heading: 'The Critical Section Problem', content: 'When multiple processes access shared data concurrently, race conditions can occur. The critical section is the code segment where shared data is accessed. Solution requirements: (1) Mutual Exclusion — only one process in CS at a time. (2) Progress — if no process is in CS, a waiting process should enter. (3) Bounded Waiting — limit on how many times other processes enter CS before a waiting process.' },
        { heading: 'Peterson\'s Solution', content: 'A software solution for 2 processes. Uses two variables: turn and flag[2]. flag[i] = true means process i wants to enter CS. turn indicates whose turn it is. Process i sets flag[i] = true, turn = j, then waits while flag[j] && turn == j. Satisfies all three requirements but only works for 2 processes and assumes atomic loads/stores.' },
        { heading: 'Semaphores', content: 'Synchronization tool with two atomic operations: wait(S) — decrement S, block if S < 0. signal(S) — increment S, wake a blocked process. Binary semaphore (mutex): S ∈ {0,1}. Counting semaphore: S ∈ [0,N] for managing N instances. Semaphores can cause deadlock if wait/signal order is wrong.' },
        { heading: 'Classic Synchronization Problems', content: 'Producer-Consumer: bounded buffer with mutex + full + empty semaphores. Readers-Writers: multiple readers OR one writer using readcount + mutex + write semaphore. Dining Philosophers: 5 philosophers with 5 forks — naive solution deadlocks. Solutions: allow only 4 to sit, odd/even fork pickup order, or use a waiter semaphore.' },
        { heading: 'Monitors', content: 'High-level synchronization construct. Only one process can be active inside a monitor at a time (built-in mutual exclusion). Uses condition variables with wait() and signal() operations. signal() either wakes a waiting process immediately (Hoare style) or at monitor exit (Mesa style). Java synchronized blocks are monitor-based.' },
        { heading: 'Deadlock in Synchronization', content: 'Two processes waiting for each other\'s semaphores: P0 does wait(S), wait(Q) while P1 does wait(Q), wait(S). Prevention: always acquire locks in the same global order. Detection: wait-for graphs. Avoidance: Banker\'s Algorithm on lock resources.' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'What is a race condition?', a: 'A race condition occurs when the outcome depends on the timing/interleaving of process execution. Two processes accessing shared data without synchronization can produce inconsistent results depending on which executes first.', difficulty: 'Easy' },
        { q: 'Difference between mutex and semaphore?', a: 'Mutex: binary lock owned by a thread (only the owner can unlock). Semaphore: signaling mechanism, any thread can signal. Mutex is for mutual exclusion, semaphore is for signaling and resource counting. Mutex has ownership semantics, semaphore does not.', difficulty: 'Medium' },
        { q: 'Explain the Dining Philosophers problem.', a: '5 philosophers sit around a table with 5 forks. Each needs 2 forks to eat. If all pick up their left fork simultaneously → deadlock. Solutions: (1) Allow max 4 philosophers at table. (2) Odd philosophers pick left first, even pick right first. (3) Use a central waiter semaphore.', difficulty: 'Hard' },
        { q: 'What is priority inversion?', a: 'A high-priority process waits for a lock held by a low-priority process. Meanwhile, a medium-priority process preempts the low-priority one, effectively inverting priorities. Solution: Priority Inheritance — temporarily boost the low-priority process to the high-priority level while it holds the lock.', difficulty: 'Hard' },
        { q: 'What is a spinlock and when is it useful?', a: 'A spinlock busy-waits (loops) checking a flag instead of blocking. Useful for very short critical sections on multiprocessor systems where context switch overhead exceeds the wait time. Wasteful on single-processor systems.', difficulty: 'Medium' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'Critical Section needs: Mutual Exclusion + Progress + Bounded Waiting',
        'Semaphore: wait() decrements, signal() increments (atomic)',
        'Mutex: binary, owned — only owner can unlock',
        'Producer-Consumer: 3 semaphores (mutex, full, empty)',
        'Readers-Writers: readcount + mutex + write_lock',
        'Dining Philosophers: 5 forks, deadlock risk',
        'Priority Inversion → solved by Priority Inheritance'
      ],
      formulas: [
        'Bounded Buffer: full=0, empty=N, mutex=1',
        'Reader entry: wait(mutex), readcount++, if readcount==1 wait(wrt), signal(mutex)'
      ]
    }
  },

  /* ═══════════════════════════════════════════════════════════
     MODULE: DBMS
     ═══════════════════════════════════════════════════════════ */

  'dbms/normalization': {
    title: 'Database Normalization',
    module: 'DBMS',
    icon: '🗃️',
    fullNotes: {
      sections: [
        { heading: 'Why Normalize?', content: 'Normalization eliminates redundancy and anomalies (insertion, update, deletion) by decomposing tables based on functional dependencies. A well-normalized schema stores each fact once, reducing storage and ensuring consistency. Trade-off: joins become more frequent in highly normalized schemas.' },
        { heading: '1NF (First Normal Form)', content: 'Requirements: (1) All columns contain atomic (indivisible) values. (2) Each row is unique (has a primary key). (3) No repeating groups or arrays. Example violation: a "PhoneNumbers" column with "123, 456". Fix: separate rows or a new PhoneNumbers table.' },
        { heading: '2NF (Second Normal Form)', content: 'Must be in 1NF + no partial dependencies. A partial dependency exists when a non-prime attribute depends on part of a composite key. Example: (StudentID, CourseID) → Grade, StudentID → StudentName. StudentName partially depends on the key. Fix: decompose into Student(StudentID, StudentName) and Enrollment(StudentID, CourseID, Grade).' },
        { heading: '3NF (Third Normal Form)', content: 'Must be in 2NF + no transitive dependencies. A transitive dependency: A → B → C where A is a key but B is not. Example: EmpID → DeptID → DeptName. Fix: separate Dept(DeptID, DeptName). Formal test: for every FD X→A, either X is a superkey or A is a prime attribute.' },
        { heading: 'BCNF (Boyce-Codd Normal Form)', content: 'Stricter than 3NF. For every functional dependency X → Y, X must be a superkey. 3NF allows X → A when A is prime; BCNF does not. BCNF decomposition may lose some FDs (dependency preservation not guaranteed). Most practical databases target 3NF or BCNF.' },
        { heading: 'Denormalization', content: 'Intentionally adding redundancy to improve read performance. Common in analytics/OLAP systems, caching layers, and NoSQL. Example: storing full address in the Order table instead of joining with Address table. Trade-off: faster reads vs data inconsistency risk.' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'What are the anomalies that normalization prevents?', a: 'Insertion Anomaly: cannot insert data without unrelated data. Update Anomaly: updating one row but not others leads to inconsistency. Deletion Anomaly: deleting a row unintentionally removes unrelated data.', difficulty: 'Easy' },
        { q: 'Difference between 3NF and BCNF?', a: 'In 3NF, for X→A, either X is a superkey OR A is a prime attribute. BCNF requires X to be a superkey always. BCNF is stricter. 3NF guarantees dependency preservation and lossless decomposition; BCNF guarantees lossless but may lose some FDs.', difficulty: 'Medium' },
        { q: 'When should you denormalize?', a: 'Denormalize when: (1) read-heavy workloads (OLAP/analytics). (2) Frequent expensive joins. (3) Caching/materialized views. (4) NoSQL databases that don\'t support joins. Always document what\'s denormalized and maintain consistency via application logic or triggers.', difficulty: 'Medium' },
        { q: 'What is a lossless join decomposition?', a: 'A decomposition is lossless if joining the decomposed tables reproduces the original table exactly (no spurious tuples). Guaranteed by: R1 ∩ R2 → R1 or R1 ∩ R2 → R2 (common attributes form a key in at least one decomposed relation).', difficulty: 'Hard' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        '1NF: atomic values, unique rows, no repeating groups',
        '2NF: 1NF + no partial dependencies (on part of composite key)',
        '3NF: 2NF + no transitive dependencies (A→B→C)',
        'BCNF: for every X→Y, X is a superkey (strictest)',
        'Decomposition must be lossless (join reproduces original)',
        'Denormalization trades consistency for read performance'
      ],
      formulas: [
        'Lossless test: R1 ∩ R2 must be a key of R1 or R2',
        'Candidate Key: minimal set of attributes that functionally determines all attributes'
      ]
    }
  },

  'dbms/joins': {
    title: 'SQL Joins',
    module: 'DBMS',
    icon: '🔗',
    fullNotes: {
      sections: [
        { heading: 'Join Fundamentals', content: 'A JOIN combines rows from two or more tables based on a related column. The join condition specifies how rows match. Without a join condition, you get a Cartesian Product (every row × every row). Joins are the heart of relational queries — understanding them is essential for any database role.' },
        { heading: 'INNER JOIN', content: 'Returns only rows where the join condition is satisfied in BOTH tables. Rows with no match in either table are excluded. Most common join type. Syntax: SELECT * FROM A INNER JOIN B ON A.id = B.a_id.' },
        { heading: 'LEFT (OUTER) JOIN', content: 'Returns ALL rows from the left table, plus matching rows from the right table. If no match exists, NULL is filled for right table columns. Use case: find all customers even those with no orders.' },
        { heading: 'RIGHT (OUTER) JOIN', content: 'Returns ALL rows from the right table, plus matching rows from the left table. Symmetric to LEFT JOIN. Less commonly used — you can rewrite as LEFT JOIN by swapping table order.' },
        { heading: 'FULL OUTER JOIN', content: 'Returns all rows from both tables. Rows with no match get NULLs on the missing side. Useful for finding unmatched records in both tables. Not supported in MySQL — emulate with UNION of LEFT and RIGHT JOIN.' },
        { heading: 'CROSS JOIN', content: 'Produces the Cartesian Product — every row of A paired with every row of B. If A has m rows and B has n rows, result has m × n rows. Rarely used intentionally, but useful for generating combinations.' },
        { heading: 'SELF JOIN', content: 'A table joined with itself. Requires table aliases. Common use: find employees and their managers from the same Employee table. SELECT e.name, m.name FROM Emp e JOIN Emp m ON e.manager_id = m.id.' },
        { heading: 'Join Algorithms', content: 'Databases use three main algorithms: (1) Nested Loop Join: O(m×n), good for small tables. (2) Hash Join: O(m+n), builds hash table on smaller table, probes with larger. (3) Merge Join: O(m log m + n log n), requires sorted inputs. The query optimizer chooses based on table sizes, indexes, and available memory.' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'What is the difference between INNER JOIN and LEFT JOIN?', a: 'INNER JOIN returns only matching rows from both tables. LEFT JOIN returns all rows from the left table, plus matching rows from right (NULLs if no match). Use LEFT JOIN when you need all records from one side regardless of matches.', difficulty: 'Easy' },
        { q: 'How do you find records in Table A that have no match in Table B?', a: 'Use LEFT JOIN with WHERE B.key IS NULL: SELECT A.* FROM A LEFT JOIN B ON A.id = B.a_id WHERE B.a_id IS NULL. Alternative: SELECT * FROM A WHERE id NOT IN (SELECT a_id FROM B) or using NOT EXISTS.', difficulty: 'Medium' },
        { q: 'What is the difference between WHERE and ON in joins?', a: 'ON specifies the join condition (which rows match). WHERE filters the result AFTER the join. For INNER JOIN, placing conditions in ON or WHERE gives the same result. For OUTER JOIN, ON preserves all rows from the outer side, while WHERE can eliminate them.', difficulty: 'Hard' },
        { q: 'When does a Hash Join outperform a Nested Loop Join?', a: 'Hash Join is better for large tables without indexes: O(m+n) vs O(m×n). Nested Loop is better when the inner table has an index (becomes O(m × log n)) or when tables are very small. Hash Join requires memory to hold the hash table.', difficulty: 'Hard' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'INNER: only matching rows from both tables',
        'LEFT: all left rows + matching right (NULLs if no match)',
        'RIGHT: all right rows + matching left',
        'FULL: all rows from both tables (NULLs for no match)',
        'CROSS: Cartesian product (m × n rows)',
        'SELF: table joined with itself (use aliases)',
        'Anti-Join: LEFT JOIN + WHERE right.key IS NULL'
      ],
      formulas: [
        'Nested Loop: O(m × n)',
        'Hash Join: O(m + n) with O(min(m,n)) space',
        'Sort-Merge Join: O(m log m + n log n)',
        'Cross Join result size: |A| × |B| rows'
      ]
    }
  },

  'dbms/transactions': {
    title: 'Transactions & Concurrency Control',
    module: 'DBMS',
    icon: '🔐',
    fullNotes: {
      sections: [
        { heading: 'ACID Properties', content: 'A transaction is a logical unit of work that must be executed atomically. ACID guarantees: Atomicity — all or nothing (undo log). Consistency — database moves from one valid state to another. Isolation — concurrent transactions appear serial. Durability — committed changes survive crashes (redo log).' },
        { heading: 'Transaction States', content: 'Active → Partially Committed (after final statement) → Committed (after successful disk write) OR Failed → Aborted (after rollback). Aborted transactions can be restarted or killed. The log contains enough info to redo committed and undo uncommitted transactions.' },
        { heading: 'Isolation Levels', content: 'READ UNCOMMITTED: sees uncommitted data (dirty reads). READ COMMITTED: sees only committed data (prevents dirty reads). REPEATABLE READ: re-reading same row gives same data (prevents non-repeatable reads). SERIALIZABLE: full isolation, as if serial execution (prevents phantom reads). Higher levels = more consistency, less concurrency.' },
        { heading: 'Concurrency Problems', content: 'Dirty Read: reading uncommitted data that may be rolled back. Non-Repeatable Read: re-reading a row gives different value. Phantom Read: a query returns different set of rows when re-executed. Lost Update: two transactions read and update same row, one overwrite is lost.' },
        { heading: 'Locking Protocols', content: 'Two-Phase Locking (2PL): Growing phase (acquire locks, no release) + Shrinking phase (release locks, no acquire). Guarantees serializability. Strict 2PL: hold all exclusive locks until commit — prevents cascading aborts. Rigorous 2PL: hold ALL locks until commit. Deadlock possible with 2PL.' },
        { heading: 'MVCC (Multi-Version Concurrency Control)', content: 'Each write creates a new version of the row. Readers see a snapshot (consistent version) — no reader blocks writer, no writer blocks reader. Used by PostgreSQL, MySQL InnoDB, Oracle. Combines well with optimistic concurrency for high-throughput systems.' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'Explain ACID properties with examples.', a: 'Atomicity: bank transfer debits A and credits B — both must succeed or neither (rollback). Consistency: account balance cannot go negative (constraint). Isolation: two concurrent transfers don\'t interfere. Durability: after commit confirmation, data persists even if server crashes.', difficulty: 'Easy' },
        { q: 'What is a dirty read and which isolation level prevents it?', a: 'Dirty read: Transaction T2 reads data written by T1 before T1 commits. If T1 rolls back, T2 has invalid data. READ COMMITTED prevents dirty reads by only showing committed data.', difficulty: 'Easy' },
        { q: 'Why does 2PL guarantee serializability?', a: '2PL ensures no two conflicting operations from different transactions can interleave problematically. The growing phase prevents a transaction from releasing a lock it might need, and the shrinking phase ensures deterministic ordering. This produces a conflict-equivalent serial schedule.', difficulty: 'Hard' },
        { q: 'How does MVCC achieve high concurrency?', a: 'MVCC maintains multiple versions of each row. Writers create new versions while readers see consistent snapshots of older versions. This eliminates read-write contention — readers never block writers and vice versa. Garbage collection removes old versions.', difficulty: 'Medium' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'ACID: Atomicity, Consistency, Isolation, Durability',
        'Isolation Levels: RU < RC < RR < Serializable',
        'Dirty Read: reading uncommitted data',
        'Phantom Read: query returns different row set on re-execution',
        '2PL: Growing → Lock Point → Shrinking',
        'Strict 2PL: hold X-locks until commit (no cascading abort)',
        'MVCC: multiple versions, snapshot reads, no read-write blocking'
      ],
      formulas: [
        'Serializable if: conflict graph (precedence graph) is acyclic',
        'Deadlock detection: cycle in wait-for graph'
      ]
    }
  },

  'dbms/bplustree': {
    title: 'B+ Tree Indexing',
    module: 'DBMS',
    icon: '🌳',
    fullNotes: {
      sections: [
        { heading: 'Why Indexing?', content: 'Without indexes, searching requires a full table scan — O(n). Indexes create data structures that allow O(log n) lookups. B+ Trees are the most common index structure in relational databases, optimized for disk-based storage with large fan-out and sequential access patterns.' },
        { heading: 'B+ Tree Structure', content: 'A balanced multi-way search tree. Internal nodes store keys and child pointers (routing decisions). Leaf nodes store keys and data pointers (actual record locations). All leaf nodes are at the same level and linked via sibling pointers for range queries. Order m: internal nodes have ⌈m/2⌉ to m children.' },
        { heading: 'Search Operation', content: 'Start at root. At each internal node, find the appropriate child pointer by comparing the search key with node keys. Follow the pointer down to the next level. At the leaf, either find the key or determine it doesn\'t exist. Time: O(log_m n) where m is the order — typically 3-4 disk I/Os.' },
        { heading: 'Insertion', content: 'Search for the correct leaf node. If the leaf has space, insert the key in sorted order. If the leaf is full, split it: create a new leaf, distribute keys evenly, and push the middle key up to the parent. If the parent overflows, split recursively up to the root, potentially increasing tree height by 1.' },
        { heading: 'Deletion', content: 'Find and remove the key from the leaf. If the leaf has fewer than ⌈m/2⌉ keys, try borrowing from a sibling. If borrowing fails, merge with a sibling and pull down the parent\'s separator key. Merge may propagate upward, potentially reducing tree height.' },
        { heading: 'B+ Tree vs B-Tree', content: 'B+ Tree: data only at leaves, leaves linked for range scans, better sequential access. B-Tree: data at all nodes, slightly fewer I/Os for exact match. B+ Trees are universally preferred in databases because: (1) More keys fit per internal node (higher fan-out). (2) Leaf-level linked list enables efficient range queries. (3) Consistent performance for all lookups.' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'Why are B+ Trees preferred over BSTs for databases?', a: 'BSTs have O(log₂ n) height, causing many disk I/Os. B+ Trees have high fan-out (order 100-1000), so height is only 3-4 even for millions of records. Each node fits one disk page. Also, leaf-level linked lists enable efficient range queries.', difficulty: 'Easy' },
        { q: 'What is the height of a B+ Tree with n keys and order m?', a: 'Height = O(log_{⌈m/2⌉} n). For m=200 and n=1 million: log₁₀₀(1M) ≈ 3. So only 3 disk I/Os for any search. This is why B+ Trees scale beautifully.', difficulty: 'Medium' },
        { q: 'How do B+ Trees support range queries?', a: 'Leaf nodes are linked via sibling pointers. To find all keys in range [a, b]: search for key a, then follow sibling pointers from leaf to leaf until reaching b. This is sequential I/O — much faster than random disk access.', difficulty: 'Easy' },
        { q: 'What happens during a B+ Tree split?', a: 'When a leaf overflows: create new leaf, split keys evenly (left gets ⌈m/2⌉, right gets rest), copy middle key UP to parent. When an internal node overflows: split similarly, but PUSH middle key up (not copy). If root splits, tree height increases by 1.', difficulty: 'Hard' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'B+ Tree: balanced, multi-way, data only at leaves',
        'Order m: internal nodes have ⌈m/2⌉ to m children',
        'Leaf nodes linked for range queries (sequential scan)',
        'Height: O(log_{m/2} n) — typically 3-4 for millions of rows',
        'Insert: find leaf → insert → split if full → push key up',
        'Delete: find leaf → remove → borrow or merge if underflow',
        'Every DB uses B+ Trees: MySQL InnoDB, PostgreSQL, Oracle'
      ],
      formulas: [
        'Max keys in leaf: m-1',
        'Min keys in non-root leaf: ⌈(m-1)/2⌉',
        'Height ≤ log_{⌈m/2⌉}((n+1)/2)',
        'Fan-out typically 100-1000 (based on page size / key size)'
      ]
    }
  },

  'dbms/er-design': {
    title: 'ER Model & Database Design',
    module: 'DBMS',
    icon: '📐',
    fullNotes: {
      sections: [
        { heading: 'Entity-Relationship Model', content: 'The ER model describes data as entities (real-world objects), attributes (properties), and relationships (associations). It provides a high-level conceptual view before translating to relational tables. Key concepts: entity sets, relationship sets, attributes (simple, composite, multivalued, derived), keys (primary, candidate, super).' },
        { heading: 'Cardinality & Participation', content: 'Cardinality: One-to-One (1:1), One-to-Many (1:N), Many-to-Many (M:N). Participation: Total (every entity must participate) vs Partial (some entities may not). Example: Every employee MUST belong to a department (total), but not every employee manages a department (partial).' },
        { heading: 'Weak Entities', content: 'A weak entity cannot be identified by its own attributes alone — it depends on an identifying (owner) entity via an identifying relationship. Has a discriminator (partial key). Example: Dependent of an Employee — identified by (EmpID, DependentName). Drawn with double rectangle in ER diagrams.' },
        { heading: 'ER to Relational Mapping', content: 'Strong entity → table with all attributes. Weak entity → table with own attributes + owner\'s PK. 1:1 relationship → merge or add FK to either side. 1:N → add FK to the "many" side. M:N → create junction/bridge table with both PKs. Multivalued attribute → separate table.' },
        { heading: 'Extended ER (EER) Concepts', content: 'Generalization/Specialization: ISA hierarchy (Employee → Manager/Engineer). Aggregation: treating a relationship as an entity. Category/Union type: subclass with multiple superclass types. These map to: single table (with type column), separate tables per subclass, or parent + child tables.' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'How do you map a M:N relationship to relational tables?', a: 'Create a junction table containing the primary keys of both entities as foreign keys. These two FKs together form the composite primary key. Additional relationship attributes go in this junction table. Example: Student_Course(StudentID, CourseID, Grade).', difficulty: 'Easy' },
        { q: 'What is a weak entity? Give an example.', a: 'A weak entity depends on an owner entity for identification. It has a partial key (discriminator) that, combined with the owner\'s key, forms its full identification. Example: Room(RoomNumber) is weak, identified by Building(BuildingID) + RoomNumber.', difficulty: 'Easy' },
        { q: 'How do you handle ISA (generalization) in relational mapping?', a: 'Three strategies: (1) Single table with type column (fast queries, NULLs for non-applicable columns). (2) Separate table per subclass including parent attributes (no joins, data duplication). (3) Parent + child tables linked by PK/FK (normalized, requires joins). Choice depends on query patterns.', difficulty: 'Hard' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'Entity → Table, Attribute → Column, Relationship → FK/Junction',
        'Cardinality: 1:1, 1:N, M:N',
        'Participation: Total (must participate) vs Partial',
        'Weak Entity: needs owner PK + discriminator for identification',
        '1:1 → FK in either table, 1:N → FK on N side, M:N → junction table',
        'Multivalued attribute → separate table with FK',
        'ISA → single table / table per subclass / parent+child tables'
      ]
    }
  },

  'dbms/sql-visualizer': {
    title: 'SQL Query Execution & Optimization',
    module: 'DBMS',
    icon: '⚡',
    fullNotes: {
      sections: [
        { heading: 'SQL Query Processing Pipeline', content: 'A SQL query goes through: Parsing (syntax check, build parse tree) → Optimization (generate and evaluate execution plans) → Execution (execute chosen plan, return results). The optimizer is the most critical component — the difference between a good and bad plan can be 1000x in performance.' },
        { heading: 'Query Execution Order', content: 'Logical order: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT. This is NOT the written order. Understanding this helps predict which operations can reference aliases, aggregate results, etc. HAVING filters groups (after GROUP BY), WHERE filters rows (before GROUP BY).' },
        { heading: 'Indexes and Performance', content: 'Indexes speed up SELECT/WHERE/JOIN but slow down INSERT/UPDATE/DELETE (index maintenance). Types: B+ Tree (range queries, most common), Hash (exact match, O(1)), GIN/GiST (full-text, JSON). Composite indexes follow the leftmost prefix rule: index on (A,B,C) helps queries on (A), (A,B), (A,B,C) but NOT (B) alone.' },
        { heading: 'EXPLAIN and Query Plans', content: 'EXPLAIN shows how the database will execute a query: scan type (Seq Scan, Index Scan, Bitmap Scan), join method (Nested Loop, Hash, Merge), estimated rows and cost. EXPLAIN ANALYZE actually runs the query and shows real timing. Key indicators: Seq Scan on large tables = missing index. High loops count in Nested Loop = consider Hash Join.' },
        { heading: 'Common Optimizations', content: 'Avoid SELECT * (fetch only needed columns). Use indexes on WHERE, JOIN, ORDER BY columns. Avoid functions on indexed columns (breaks index: WHERE YEAR(date) vs WHERE date >= \'2024-01-01\'). Use EXISTS instead of IN for correlated subqueries. Batch large INSERTs. Use LIMIT for pagination instead of fetching all rows.' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'What is the order of SQL query execution?', a: 'FROM (including JOINs) → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT. This is the logical processing order, not the written syntax order.', difficulty: 'Easy' },
        { q: 'Difference between WHERE and HAVING?', a: 'WHERE filters individual rows BEFORE grouping. HAVING filters groups AFTER GROUP BY. HAVING can use aggregate functions (SUM, COUNT), WHERE cannot. Use WHERE whenever possible (it filters earlier, reducing data).', difficulty: 'Easy' },
        { q: 'What is the leftmost prefix rule for composite indexes?', a: 'For a composite index on (A, B, C): the index is used for queries filtering on A, or A+B, or A+B+C. But NOT for queries filtering only on B or C. The index follows B+ Tree ordering from left to right.', difficulty: 'Medium' },
        { q: 'When would you NOT use an index?', a: 'When: (1) Table is very small (full scan is faster). (2) High-cardinality writes (index maintenance cost). (3) Column has very low selectivity (e.g., boolean — index scan reads most of the table anyway). (4) Write-heavy tables where read speed isn\'t critical.', difficulty: 'Medium' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'Execution order: FROM→WHERE→GROUP BY→HAVING→SELECT→ORDER BY→LIMIT',
        'Index types: B+ Tree (range), Hash (exact), GIN (full-text)',
        'Composite index leftmost prefix: (A,B,C) helps A, A+B, A+B+C',
        'EXPLAIN ANALYZE for real query timing',
        'Avoid functions on indexed columns',
        'EXISTS > IN for correlated subqueries',
        'Covering index: index contains all columns needed by query'
      ]
    }
  },

  /* ═══════════════════════════════════════════════════════════
     MODULE: COMPUTER NETWORKS
     ═══════════════════════════════════════════════════════════ */

  'networks/osi': {
    title: 'OSI Model',
    module: 'Computer Networks',
    icon: '🌐',
    fullNotes: {
      sections: [
        { heading: 'OSI Model Overview', content: 'The OSI (Open Systems Interconnection) model is a 7-layer reference model for network communication. Each layer provides services to the layer above and uses services from the layer below. Data is encapsulated as it moves down the stack and decapsulated moving up.' },
        { heading: 'Layer 7 — Application', content: 'Provides network services directly to user applications. Protocols: HTTP/HTTPS (web), FTP (file transfer), SMTP/POP3/IMAP (email), DNS (name resolution), SSH (remote shell), DHCP (IP assignment). PDU: Data.' },
        { heading: 'Layer 6 — Presentation', content: 'Handles data formatting, encryption/decryption, and compression. Translates between application and network formats. Examples: SSL/TLS encryption, JPEG/MPEG compression, ASCII/Unicode encoding. Often merged with Application layer in practice.' },
        { heading: 'Layer 5 — Session', content: 'Manages sessions (connections) between applications. Handles session establishment, maintenance, and teardown. Manages dialog control (half-duplex, full-duplex) and synchronization checkpoints. Examples: NetBIOS, RPC, PPTP.' },
        { heading: 'Layer 4 — Transport', content: 'Provides end-to-end communication, reliability, and flow control. TCP: reliable, ordered, connection-oriented (3-way handshake). UDP: unreliable, fast, connectionless. Port numbers identify applications (HTTP=80, HTTPS=443, DNS=53). PDU: Segment (TCP) / Datagram (UDP).' },
        { heading: 'Layer 3 — Network', content: 'Handles logical addressing (IP addresses) and routing between networks. Routers operate here. Protocols: IP (IPv4/IPv6), ICMP (ping/traceroute), OSPF, BGP (routing protocols), ARP (IP→MAC). PDU: Packet.' },
        { heading: 'Layer 2 — Data Link', content: 'Provides node-to-node data transfer on the same network. Handles MAC addressing, framing, error detection (CRC), and media access control. Switches operate here. Sub-layers: LLC (Logical Link Control) and MAC. PDU: Frame.' },
        { heading: 'Layer 1 — Physical', content: 'Transmits raw bits over physical medium (cable, fiber, wireless). Defines voltages, data rates, pin layouts, connectors. Devices: hubs, repeaters, cables. Encoding: NRZ, Manchester. PDU: Bits.' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'Name the 7 OSI layers from top to bottom.', a: 'Application, Presentation, Session, Transport, Network, Data Link, Physical. Mnemonic: "All People Seem To Need Data Processing" (top-down) or "Please Do Not Throw Sausage Pizza Away" (bottom-up).', difficulty: 'Easy' },
        { q: 'What is the difference between a hub, switch, and router?', a: 'Hub (Layer 1): broadcasts to all ports, no intelligence. Switch (Layer 2): uses MAC addresses to forward to the correct port. Router (Layer 3): uses IP addresses to route between different networks. Each operates at a higher layer with more intelligence.', difficulty: 'Easy' },
        { q: 'What happens when you type a URL in the browser?', a: 'DNS resolution (URL→IP) → TCP 3-way handshake → TLS handshake (if HTTPS) → HTTP request sent → Server processes request → HTTP response returned → Browser renders HTML/CSS/JS → TCP connection closed or kept alive.', difficulty: 'Medium' },
        { q: 'Why does TCP/IP use 4 layers instead of OSI\'s 7?', a: 'TCP/IP is a practical model that merges OSI layers 5-7 into "Application" and layers 1-2 into "Network Access/Link." The Presentation and Session layers are rarely implemented as distinct layers in practice — their functions are handled within applications or Transport layer (TLS, session management in HTTP).', difficulty: 'Medium' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'L7 Application: HTTP, FTP, SMTP, DNS — user-facing protocols',
        'L6 Presentation: encryption (TLS), compression, encoding',
        'L5 Session: session management, dialog control',
        'L4 Transport: TCP (reliable) / UDP (fast), port numbers',
        'L3 Network: IP addressing, routing (routers)',
        'L2 Data Link: MAC addressing, framing, error detection (switches)',
        'L1 Physical: bits, cables, voltages (hubs, repeaters)',
        'PDUs: Data → Segment → Packet → Frame → Bits'
      ],
      mnemonics: [
        'Top-down: All People Seem To Need Data Processing',
        'Bottom-up: Please Do Not Throw Sausage Pizza Away'
      ]
    }
  },

  'networks/tcp-udp': {
    title: 'TCP vs UDP',
    module: 'Computer Networks',
    icon: '📡',
    fullNotes: {
      sections: [
        { heading: 'TCP Overview', content: 'Transmission Control Protocol: connection-oriented, reliable, ordered delivery. Uses 3-way handshake (SYN → SYN-ACK → ACK) to establish connection, 4-way handshake (FIN → ACK → FIN → ACK) to close. Provides flow control (sliding window), congestion control (slow start, AIMD), error recovery (retransmission), and ordered delivery (sequence numbers).' },
        { heading: 'UDP Overview', content: 'User Datagram Protocol: connectionless, unreliable, unordered. No handshake, no acknowledgments, no retransmission, no flow control. Just adds source/destination port and checksum to data. Minimal overhead (8-byte header vs TCP\'s 20-byte). Used when speed > reliability: DNS, video streaming, gaming, VoIP.' },
        { heading: 'TCP Flow Control', content: 'Sliding Window protocol prevents sender from overwhelming the receiver. Receiver advertises its buffer size (receive window) in each ACK. Sender limits unacknowledged data to the window size. Window size adjusts dynamically based on receiver capacity.' },
        { heading: 'TCP Congestion Control', content: 'Algorithms to prevent network overload: Slow Start: exponential growth (cwnd doubles each RTT). Congestion Avoidance: linear growth after threshold (cwnd += 1/cwnd per ACK). Fast Retransmit: retransmit on 3 duplicate ACKs. Fast Recovery: halve threshold, set cwnd = threshold + 3.' },
        { heading: 'When to Use TCP vs UDP', content: 'TCP: web (HTTP/HTTPS), email (SMTP), file transfer (FTP), SSH — when data integrity matters. UDP: DNS lookups, live streaming, online gaming, VoIP, IoT telemetry — when latency matters more than reliability. QUIC (HTTP/3) runs over UDP but adds reliability at application layer.' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'Explain the TCP 3-way handshake.', a: 'Step 1: Client sends SYN (seq=x). Step 2: Server replies SYN-ACK (seq=y, ack=x+1). Step 3: Client sends ACK (ack=y+1). Connection is now established. This ensures both sides agree on initial sequence numbers and are ready to communicate.', difficulty: 'Easy' },
        { q: 'Why is UDP faster than TCP?', a: 'UDP has no connection setup (no handshake), no acknowledgments, no retransmission, no congestion control, and a smaller header (8 bytes vs 20+). This eliminates all overhead that TCP adds for reliability. UDP just sends data immediately.', difficulty: 'Easy' },
        { q: 'What is TCP slow start?', a: 'Initially, TCP doesn\'t know the network capacity. Slow start begins with cwnd=1 MSS, then doubles cwnd each RTT (exponential growth). When cwnd reaches ssthresh (slow start threshold), it switches to congestion avoidance (linear growth). If timeout occurs, ssthresh = cwnd/2, cwnd = 1 (restart).', difficulty: 'Medium' },
        { q: 'Can you build reliable delivery on top of UDP?', a: 'Yes. QUIC (HTTP/3), WebRTC, and game engines do this. They implement their own acknowledgments, retransmission, and ordering at the application layer while gaining UDP\'s advantages (no head-of-line blocking, faster connection setup, custom congestion control).', difficulty: 'Hard' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'TCP: reliable, ordered, connection-oriented, flow+congestion control',
        'UDP: unreliable, unordered, connectionless, minimal overhead',
        'TCP header: 20 bytes; UDP header: 8 bytes',
        '3-way handshake: SYN → SYN-ACK → ACK',
        'Slow Start: cwnd doubles each RTT until ssthresh',
        'Congestion Avoidance: cwnd += 1 per RTT (linear)',
        'QUIC = UDP + reliability at app layer (HTTP/3)'
      ],
      comparisons: [
        { left: 'TCP', right: 'UDP', criteria: ['Reliable vs Unreliable', 'Ordered vs Unordered', 'Connection-oriented vs Connectionless', '20+ byte header vs 8 byte header', 'Flow control vs None', 'HTTP, FTP, SSH vs DNS, Streaming, Gaming'] }
      ]
    }
  },

  'networks/subnetting': {
    title: 'IP Subnetting',
    module: 'Computer Networks',
    icon: '🔢',
    fullNotes: {
      sections: [
        { heading: 'IP Addressing Basics', content: 'IPv4: 32-bit address divided into 4 octets (e.g., 192.168.1.100). Split into Network part and Host part by the subnet mask. Subnet mask: continuous 1s followed by 0s (e.g., 255.255.255.0 = /24). Network address: host bits all 0. Broadcast: host bits all 1.' },
        { heading: 'CIDR Notation', content: 'Classless Inter-Domain Routing replaces rigid class boundaries. /24 = 24 network bits, 8 host bits = 256 addresses (254 usable). /16 = 65,536 addresses. /32 = single host. Formula: usable hosts = 2^(32-prefix) - 2 (subtract network and broadcast).' },
        { heading: 'Subnetting Process', content: 'To create N subnets: borrow ⌈log₂(N)⌉ bits from the host portion. Each borrowed bit doubles the number of subnets but halves hosts per subnet. Example: 192.168.1.0/24 into 4 subnets → borrow 2 bits → /26 → 62 usable hosts each.' },
        { heading: 'Private IP Ranges', content: '10.0.0.0/8 (Class A private), 172.16.0.0/12 (Class B private), 192.168.0.0/16 (Class C private). These are not routable on the internet — used within organizations. NAT (Network Address Translation) maps private IPs to public IPs for internet access.' },
        { heading: 'IPv6 Overview', content: '128-bit addresses written in hexadecimal (e.g., 2001:0db8::1). Solves IPv4 exhaustion (3.4×10³⁸ addresses). Features: no NAT needed, built-in IPSec, auto-configuration (SLAAC). Dual-stack: run IPv4 and IPv6 simultaneously during transition.' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'How many usable hosts in a /26 network?', a: '32 - 26 = 6 host bits. 2⁶ = 64 total addresses. Subtract 2 (network address and broadcast). 62 usable hosts.', difficulty: 'Easy' },
        { q: 'What is the subnet mask for /20?', a: '20 bits of 1s: 11111111.11111111.11110000.00000000 = 255.255.240.0. This gives 2¹² = 4096 addresses per subnet (4094 usable hosts).', difficulty: 'Medium' },
        { q: 'What is NAT and why is it used?', a: 'Network Address Translation maps private IP addresses to a public IP for internet communication. It conserves IPv4 addresses (many devices share one public IP), provides basic security (internal IPs hidden), and is used in virtually every home/office router.', difficulty: 'Easy' },
        { q: 'What is VLSM?', a: 'Variable Length Subnet Masking allows subnets of different sizes within the same network. Unlike fixed subnetting, you can allocate a /26 for a 50-host network and a /30 for a 2-host link, efficiently using the address space. Requires a routing protocol that supports VLSM (OSPF, EIGRP, not RIPv1).', difficulty: 'Hard' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'IPv4: 32-bit, 4 octets. IPv6: 128-bit, hex notation',
        'Usable hosts = 2^(32-prefix) - 2',
        'Subnet mask: continuous 1s then 0s',
        '/24 = 256 addr (254 usable), /26 = 64 addr (62 usable)',
        'Private: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16',
        'NAT: maps private → public IPs',
        'VLSM: variable-size subnets for efficient allocation'
      ],
      formulas: [
        'Usable Hosts = 2^(host bits) - 2',
        'Number of subnets = 2^(borrowed bits)',
        'Host bits = 32 - prefix length'
      ]
    }
  },

  'networks/routing': {
    title: 'Routing Algorithms',
    module: 'Computer Networks',
    icon: '🗺️',
    fullNotes: {
      sections: [
        { heading: 'Routing Overview', content: 'Routing determines the path packets take through a network. Static routing: manually configured routes. Dynamic routing: routers exchange information and compute paths automatically. Interior Gateway Protocols (IGP): within an AS (OSPF, RIP). Exterior Gateway Protocols (EGP): between ASes (BGP).' },
        { heading: 'Distance Vector (RIP)', content: 'Each router maintains a table of (destination, distance, next hop). Routers share their entire table with direct neighbors periodically. Uses Bellman-Ford algorithm. RIP uses hop count as metric (max 15). Problems: slow convergence, count-to-infinity. Solutions: split horizon, poison reverse, hold-down timers.' },
        { heading: 'Link State (OSPF)', content: 'Each router discovers its neighbors and measures link costs. Floods Link State Advertisements (LSAs) to all routers. Each router builds a complete network topology map. Uses Dijkstra\'s algorithm to compute shortest paths. OSPF uses cost based on bandwidth (cost = 10⁸/bandwidth). Faster convergence than distance vector.' },
        { heading: 'BGP (Border Gateway Protocol)', content: 'The routing protocol of the internet. Path-vector protocol connecting Autonomous Systems. BGP considers policies (business relationships) not just shortest path. iBGP (within AS) and eBGP (between ASes). BGP attributes: AS-PATH, NEXT-HOP, LOCAL-PREF, MED.' },
        { heading: 'Dijkstra\'s Algorithm', content: 'Greedy algorithm for single-source shortest path. Initialize distances to infinity, source to 0. Pick unvisited node with minimum distance, update neighbors. Repeat until all visited. Time: O(V²) or O((V+E) log V) with priority queue. Used by OSPF for computing routing tables.' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'Distance Vector vs Link State routing?', a: 'Distance Vector: routers know only neighbors, share full table with neighbors, uses Bellman-Ford, slow convergence (RIP). Link State: routers know full topology, flood LSAs to all, uses Dijkstra, fast convergence (OSPF). Link State uses more memory but converges faster.', difficulty: 'Medium' },
        { q: 'What is the count-to-infinity problem?', a: 'In Distance Vector routing, when a link fails, routers slowly increment the distance to the failed destination through each other, potentially counting to infinity. Example: A→B cost 1, B→C cost 1. If B-C breaks, A thinks it can reach C via B (cost 2), B thinks via A (cost 3), endlessly. Solutions: split horizon, triggered updates.', difficulty: 'Hard' },
        { q: 'Why does the internet use BGP?', a: 'BGP is the only protocol that scales to the internet\'s size (~900K+ routes) and supports policy-based routing. ISPs need to control traffic flow based on business relationships (customer, peer, provider), not just shortest path. BGP\'s path-vector design prevents loops and enables these policies.', difficulty: 'Hard' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'Distance Vector: Bellman-Ford, share table with neighbors (RIP)',
        'Link State: Dijkstra, flood LSAs to all routers (OSPF)',
        'BGP: path-vector, policy-based, internet backbone',
        'RIP: max 15 hops, slow convergence, count-to-infinity risk',
        'OSPF: cost = 10⁸/bandwidth, areas for scalability',
        'Static vs Dynamic routing: manual vs automatic path computation'
      ],
      formulas: [
        'Dijkstra: O((V+E) log V) with min-heap',
        'Bellman-Ford: O(V × E)',
        'OSPF cost = 10⁸ / bandwidth (bps)'
      ]
    }
  },

  'networks/http-dns': {
    title: 'HTTP, HTTPS & DNS',
    module: 'Computer Networks',
    icon: '🔒',
    fullNotes: {
      sections: [
        { heading: 'HTTP Fundamentals', content: 'HyperText Transfer Protocol: stateless request-response protocol on port 80. Methods: GET (retrieve), POST (create), PUT (update/replace), PATCH (partial update), DELETE (remove). Status codes: 2xx (success), 3xx (redirect), 4xx (client error), 5xx (server error). HTTP/1.1 introduced keep-alive. HTTP/2 added multiplexing and server push. HTTP/3 uses QUIC over UDP.' },
        { heading: 'HTTPS and TLS', content: 'HTTPS = HTTP + TLS encryption (port 443). TLS handshake: Client Hello (supported ciphers) → Server Hello + Certificate → Key Exchange (Diffie-Hellman or RSA) → Symmetric encryption begins. TLS 1.3 reduced handshake to 1 RTT (from 2 in TLS 1.2). Provides confidentiality, integrity, and authentication.' },
        { heading: 'DNS Resolution', content: 'Domain Name System translates domain names to IP addresses. Resolution path: Browser cache → OS cache → Recursive Resolver → Root DNS (.) → TLD DNS (.com) → Authoritative DNS (google.com) → IP returned. DNS uses UDP port 53 (TCP for zone transfers). Record types: A (IPv4), AAAA (IPv6), CNAME (alias), MX (mail), NS (nameserver), TXT (text).' },
        { heading: 'HTTP Caching', content: 'Cache-Control headers manage caching: max-age (TTL in seconds), no-cache (revalidate before use), no-store (never cache). ETag: content hash for conditional requests (If-None-Match → 304 Not Modified). Caching layers: browser cache, CDN, reverse proxy, application cache. Proper caching reduces latency and server load.' },
        { heading: 'REST API Design', content: 'REpresentational State Transfer: resources identified by URLs, operations via HTTP methods, stateless communication. Best practices: use nouns for URLs (/users not /getUsers), proper status codes, versioning (/api/v1/), pagination, HATEOAS links. Common alternatives: GraphQL (flexible queries) and gRPC (binary, fast).' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'What happens during a TLS handshake?', a: '1. Client Hello (supported cipher suites, random). 2. Server Hello (chosen cipher, certificate with public key). 3. Key Exchange (client generates pre-master secret, encrypts with server public key or uses DH). 4. Both derive symmetric session keys. 5. Encrypted communication begins. TLS 1.3 does this in 1 RTT.', difficulty: 'Medium' },
        { q: 'How does DNS resolution work step by step?', a: 'Browser checks its cache → OS resolver cache → Query recursive resolver (ISP/8.8.8.8) → Root server returns TLD nameserver → TLD server returns authoritative NS → Authoritative NS returns IP. Results cached at each level with TTL. Total: typically 4 lookups for uncached domains.', difficulty: 'Medium' },
        { q: 'Difference between HTTP/1.1, HTTP/2, and HTTP/3?', a: 'HTTP/1.1: text-based, keep-alive, pipelining (rarely used). HTTP/2: binary framing, multiplexing (multiple requests on one connection), header compression (HPACK), server push. HTTP/3: runs over QUIC/UDP, eliminates TCP head-of-line blocking, 0-RTT resumption. Each version improves latency and efficiency.', difficulty: 'Hard' },
        { q: 'What is the difference between cookies and sessions?', a: 'Cookies: stored on client, sent with every request (Set-Cookie header). Sessions: stored on server, client holds only a session ID cookie. Cookies have size limits (~4KB) and are visible to the client. Sessions can store larger data securely server-side. JWTs are stateless tokens stored client-side.', difficulty: 'Medium' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'HTTP methods: GET, POST, PUT, PATCH, DELETE',
        'Status: 200 OK, 301 Redirect, 404 Not Found, 500 Server Error',
        'HTTPS = HTTP + TLS (port 443)',
        'TLS 1.3: 1-RTT handshake, forward secrecy',
        'DNS: recursive resolver → root → TLD → authoritative',
        'DNS records: A(IPv4), AAAA(IPv6), CNAME(alias), MX(mail)',
        'HTTP/2: multiplexing, binary, header compression',
        'HTTP/3: QUIC over UDP, 0-RTT'
      ]
    }
  },

  /* ═══════════════════════════════════════════════════════════
     MODULE: OOP
     ═══════════════════════════════════════════════════════════ */

  'oops/pillars': {
    title: 'Four Pillars of OOP',
    module: 'Object-Oriented Programming',
    icon: '🏛️',
    fullNotes: {
      sections: [
        { heading: 'Encapsulation', content: 'Bundling data (attributes) and methods that operate on that data within a class, and restricting direct access to internals. Use access modifiers: private (class only), protected (class + subclasses), public (everyone). Getters/setters provide controlled access. Benefits: data hiding, modularity, easier maintenance. Example: BankAccount class hides balance, exposes deposit()/withdraw().' },
        { heading: 'Abstraction', content: 'Hiding complex implementation details and exposing only the essential interface. Achieved through abstract classes (partial implementation) and interfaces (pure contract). Users interact with "what" not "how." Example: a Car class exposes start(), accelerate(), brake() — hides engine combustion, fuel injection, transmission mechanics.' },
        { heading: 'Inheritance', content: 'A class (child/subclass) inherits attributes and methods from another class (parent/superclass). Promotes code reuse. Types: Single, Multilevel, Hierarchical, Multiple (via interfaces in Java/C#, direct in C++/Python). "Is-a" relationship: Dog IS-A Animal. Override methods for specialized behavior. Use super/base to call parent methods.' },
        { heading: 'Polymorphism', content: 'One interface, many implementations. Compile-time (static): method overloading — same method name, different parameters. Runtime (dynamic): method overriding — subclass provides specific implementation of parent method, resolved at runtime via vtable. Example: Shape.area() — Circle, Rectangle, Triangle each compute differently. Enables writing generic code that works with any subtype.' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'Explain the four pillars of OOP.', a: 'Encapsulation: bundle data + methods, hide internals. Abstraction: expose interface, hide implementation. Inheritance: child class inherits from parent (code reuse). Polymorphism: one interface, many forms (overloading + overriding).', difficulty: 'Easy' },
        { q: 'Difference between method overloading and overriding?', a: 'Overloading: same class, same method name, different parameters (compile-time polymorphism). Overriding: subclass redefines parent method with same signature (runtime polymorphism). Overloading is resolved by compiler, overriding by runtime vtable lookup.', difficulty: 'Easy' },
        { q: 'Why prefer composition over inheritance?', a: 'Inheritance creates tight coupling (fragile base class problem). Composition is more flexible: HAS-A relationship via member objects. You can change behavior at runtime by swapping components. Inheritance should model true IS-A relationships. Composition + interfaces is often the better design.', difficulty: 'Medium' },
        { q: 'What is the diamond problem?', a: 'In multiple inheritance: D inherits from B and C, both inherit from A. If B and C override a method from A, which version does D get? C++ resolves with virtual inheritance. Java/C# avoid it by only allowing single class inheritance + multiple interface implementation.', difficulty: 'Hard' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'Encapsulation: data hiding + access modifiers (private/protected/public)',
        'Abstraction: interface over implementation (abstract classes/interfaces)',
        'Inheritance: code reuse via IS-A relationship',
        'Polymorphism: overloading (compile-time) + overriding (runtime)',
        'Composition > Inheritance for flexibility',
        'Diamond Problem: multiple inheritance ambiguity',
        'Virtual/vtable: runtime method dispatch for overriding'
      ]
    }
  },

  'oops/inheritance': {
    title: 'Inheritance Deep Dive',
    module: 'Object-Oriented Programming',
    icon: '🧬',
    fullNotes: {
      sections: [
        { heading: 'Types of Inheritance', content: 'Single: one parent, one child. Multilevel: chain (A→B→C). Hierarchical: one parent, multiple children. Multiple: multiple parents (C++, Python). Hybrid: combination. Java uses single class inheritance + multiple interface inheritance to avoid diamond problem.' },
        { heading: 'Method Resolution Order (MRO)', content: 'In Python, C3 Linearization determines method lookup order in multiple inheritance. Ensures consistent, predictable resolution. Use ClassName.mro() or help(ClassName) to view. C++ uses depth-first left-to-right search (with virtual inheritance for diamond resolution).' },
        { heading: 'Constructor Chaining', content: 'When creating a subclass object, parent constructors execute first (bottom-up initialization). In Java: super() must be first statement in constructor. In Python: super().__init__(). In C++: member initializer list. Each level initializes its own attributes.' },
        { heading: 'Access Control in Inheritance', content: 'Private members: NOT accessible in subclass (encapsulated). Protected members: accessible in subclass but not outside. Public members: accessible everywhere. In C++: public/protected/private inheritance changes visibility of inherited members.' },
        { heading: 'Abstract Classes vs Interfaces', content: 'Abstract class: can have implemented methods + abstract methods, has constructors, single inheritance. Interface: all methods abstract (Java 8+ allows default methods), no constructors, multiple implementation. Use abstract class for shared code, interface for contracts across unrelated classes.' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'Can you override a private method?', a: 'No. Private methods are not visible to subclasses, so they cannot be overridden. If you define a method with the same name in a subclass, it\'s a new method, not an override. Use protected or public for overridable methods.', difficulty: 'Easy' },
        { q: 'What is constructor chaining?', a: 'The process where constructors call parent constructors up the hierarchy. In Java, super() is implicitly called if not specified. Order: topmost parent constructor first, then down to the child. This ensures proper initialization at every level.', difficulty: 'Medium' },
        { q: 'When to use abstract class vs interface?', a: 'Abstract class: shared implementation + IS-A (Animal → Dog). Interface: contract for unrelated classes (Flyable implemented by Bird and Airplane). After Java 8, interfaces can have default methods, blurring the line. Rule: use interfaces for capabilities, abstract classes for families.', difficulty: 'Medium' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'Types: Single, Multilevel, Hierarchical, Multiple, Hybrid',
        'Java: single class + multiple interface inheritance',
        'Python MRO: C3 Linearization for method resolution',
        'Constructor order: parent first, child last',
        'Private: not inherited, Protected: inherited, Public: inherited',
        'Abstract class: partial impl, single inherit. Interface: contract, multiple impl'
      ]
    }
  },

  'oops/abstract-interface': {
    title: 'Abstract Classes & Interfaces',
    module: 'Object-Oriented Programming',
    icon: '📋',
    fullNotes: {
      sections: [
        { heading: 'Abstract Classes', content: 'A class that cannot be instantiated directly. Contains at least one abstract (unimplemented) method. Subclasses MUST implement all abstract methods. Can have constructors, instance variables, and concrete methods. Models IS-A with shared behavior.' },
        { heading: 'Interfaces', content: 'A pure contract specifying methods a class must implement. All methods are implicitly public and abstract (before Java 8). Since Java 8: default methods (with body) and static methods allowed. Since Java 9: private methods in interfaces. Models CAN-DO capabilities.' },
        { heading: 'Design with Abstraction', content: 'Program to interfaces, not implementations. Dependency Inversion Principle: high-level modules depend on abstractions. Strategy Pattern: different algorithms behind the same interface. Factory Pattern: return interface type, hide concrete class. This enables testability (mock implementations), flexibility, and loose coupling.' },
        { heading: 'Functional Interfaces & Lambdas', content: 'A functional interface has exactly one abstract method (e.g., Runnable, Comparator). Can be implemented using lambda expressions. @FunctionalInterface annotation enforces the single-method constraint. Common: Predicate<T>, Function<T,R>, Consumer<T>, Supplier<T>.' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'Can an abstract class have a constructor?', a: 'Yes. While you can\'t instantiate an abstract class directly, its constructor is called when a subclass is instantiated (via super()). The constructor initializes shared state for all subclasses.', difficulty: 'Easy' },
        { q: 'What are default methods in Java interfaces?', a: 'Introduced in Java 8, default methods have a body/implementation in the interface. Classes inheriting the interface get the default behavior without overriding. Used to add new methods to interfaces without breaking existing implementations (backward compatibility).', difficulty: 'Medium' },
        { q: 'What is the Dependency Inversion Principle?', a: 'High-level modules should not depend on low-level modules — both should depend on abstractions (interfaces). Example: NotificationService depends on MessageSender interface, not EmailSender class. This allows swapping implementations (email, SMS, push) without changing the service.', difficulty: 'Medium' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'Abstract: can\'t instantiate, has abstract + concrete methods',
        'Interface: pure contract, multiple implementation allowed',
        'Java 8+: interfaces can have default and static methods',
        'Program to interfaces, not implementations',
        'Functional Interface: exactly 1 abstract method → lambda compatible',
        'DIP: depend on abstractions, not concretions'
      ]
    }
  },

  'oops/patterns': {
    title: 'Design Patterns',
    module: 'Object-Oriented Programming',
    icon: '🧩',
    fullNotes: {
      sections: [
        { heading: 'Creational Patterns', content: 'Singleton: exactly one instance, global access point. Factory Method: delegate instantiation to subclasses. Abstract Factory: create families of related objects. Builder: construct complex objects step-by-step. Prototype: clone existing objects instead of creating new ones.' },
        { heading: 'Structural Patterns', content: 'Adapter: convert one interface to another. Decorator: add responsibilities dynamically (wrapping). Facade: simplified interface to a complex subsystem. Proxy: placeholder that controls access to another object. Composite: tree structure for part-whole hierarchies.' },
        { heading: 'Behavioral Patterns', content: 'Observer: one-to-many dependency notification. Strategy: interchangeable algorithms behind an interface. Command: encapsulate a request as an object. Iterator: sequential access without exposing internal structure. State: object changes behavior when internal state changes. Template Method: define algorithm skeleton, let subclasses fill in steps.' },
        { heading: 'Most Asked Patterns', content: 'Singleton: lazy initialization + thread safety (double-checked locking or enum in Java). Observer: event systems (pub-sub). Strategy: sorting algorithms, payment methods. Factory: database drivers, UI components. Builder: constructing objects with many optional parameters.' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'Implement a thread-safe Singleton.', a: 'Best approach in Java: use enum (INSTANCE). Alternative: private static holder class (Bill Pugh), or double-checked locking with volatile. In Python: use a module or override __new__. Key: private constructor, static getInstance() method, handle multi-threading.',
          difficulty: 'Medium' },
        { q: 'Explain the Observer pattern with a real example.', a: 'Subject maintains a list of observers. When subject state changes, it notifies all observers. Example: YouTube channel (subject) and subscribers (observers). When a new video is uploaded, all subscribers are notified. Java: Observable/Observer (deprecated), use PropertyChangeListener or custom event system.', difficulty: 'Easy' },
        { q: 'When would you use Strategy vs State pattern?', a: 'Strategy: client chooses the algorithm (e.g., selecting sort algorithm). The algorithm is set externally. State: the object itself changes behavior based on internal state (e.g., vending machine in has-coin vs no-coin state). State transitions are internal; strategy changes are external.', difficulty: 'Hard' },
        { q: 'What is the difference between Adapter and Facade?', a: 'Adapter: makes one incompatible interface work with another (wraps one class). Facade: provides a simplified interface to a complex subsystem of many classes. Adapter converts interfaces; Facade simplifies them.', difficulty: 'Medium' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'Creational: Singleton, Factory, Builder, Prototype',
        'Structural: Adapter, Decorator, Facade, Proxy, Composite',
        'Behavioral: Observer, Strategy, Command, Iterator, State, Template',
        'Singleton: private constructor, static instance, thread-safe',
        'Observer: subject notifies all registered observers on change',
        'Strategy: interchangeable algorithms behind interface',
        'Factory: encapsulate object creation logic'
      ]
    }
  },

  'oops/solid': {
    title: 'SOLID Principles',
    module: 'Object-Oriented Programming',
    icon: '🏗️',
    fullNotes: {
      sections: [
        { heading: 'S — Single Responsibility Principle', content: 'A class should have only one reason to change — one responsibility. Example: UserService handles user logic, EmailService handles email. BAD: a User class that validates data, saves to DB, and sends emails. GOOD: separate classes for each responsibility.' },
        { heading: 'O — Open/Closed Principle', content: 'Classes should be open for extension but closed for modification. Add new functionality by creating new classes/subclasses, not modifying existing code. Use interfaces and abstract classes to define extension points. Example: Shape with area() — add new shapes without modifying existing code.' },
        { heading: 'L — Liskov Substitution Principle', content: 'Subclass objects must be substitutable for their parent class without altering program correctness. If S is a subtype of T, objects of type T can be replaced with objects of type S. Classic violation: Square extending Rectangle — setting width changes height, breaking Rectangle\'s contract.' },
        { heading: 'I — Interface Segregation Principle', content: 'Clients should not be forced to depend on interfaces they don\'t use. Split fat interfaces into smaller, specific ones. BAD: IWorker with work(), eat(), sleep() — Robot implements work() but can\'t eat/sleep. GOOD: IWorkable, IFeedable as separate interfaces.' },
        { heading: 'D — Dependency Inversion Principle', content: 'High-level modules should depend on abstractions, not low-level modules. Both should depend on interfaces. Example: OrderService depends on PaymentProcessor interface, not StripePayment class. Enables dependency injection, testability (mock implementations), and flexibility to swap implementations.' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'Explain SOLID with a real-world example.', a: 'E-commerce: S: OrderService only handles orders, not payments. O: Add new payment methods without modifying OrderService. L: CreditCardPayment and PayPalPayment both work wherever Payment is expected. I: IPayable, IRefundable separate interfaces. D: OrderService depends on IPaymentGateway, not StripeGateway.', difficulty: 'Medium' },
        { q: 'Give an example of Liskov Substitution violation.', a: 'Square extends Rectangle. Rectangle has setWidth() and setHeight() independently. Square\'s setWidth() must also change height (to maintain square property). Code expecting Rectangle behavior breaks: r.setWidth(5); r.setHeight(10); assert(area == 50) fails for Square.', difficulty: 'Medium' },
        { q: 'How does Dependency Injection relate to DIP?', a: 'DI is a technique to implement DIP. Instead of a class creating its dependencies (new ConcreteClass()), dependencies are "injected" from outside (constructor/setter/interface injection). This allows high-level modules to depend on abstractions. DI frameworks (Spring, Dagger) automate this.', difficulty: 'Hard' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'S: One class = one responsibility = one reason to change',
        'O: Open for extension, closed for modification',
        'L: Subtypes must be substitutable for their base types',
        'I: Many specific interfaces > one fat interface',
        'D: Depend on abstractions, not concretions',
        'DI (Dependency Injection) implements DIP',
        'Violation signs: God classes, tight coupling, broken subtype contracts'
      ]
    }
  },

  'oops/uml': {
    title: 'UML Diagrams',
    module: 'Object-Oriented Programming',
    icon: '📊',
    fullNotes: {
      sections: [
        { heading: 'Class Diagrams', content: 'Show classes, attributes, methods, and relationships. Notation: + public, - private, # protected, ~ package. Relationships: Association (line), Aggregation (empty diamond — has-a, weak), Composition (filled diamond — has-a, strong), Inheritance (empty triangle arrow), Implementation (dashed triangle arrow).' },
        { heading: 'Sequence Diagrams', content: 'Show object interactions over time. Vertical lifelines for objects, horizontal arrows for messages. Solid arrow = synchronous call, dashed arrow = return. Activation bars show when an object is processing. Useful for modeling API flows, use cases, and debugging complex interactions.' },
        { heading: 'Use Case Diagrams', content: 'Show system functionality from user perspective. Actors (stick figures) interact with use cases (ovals) inside a system boundary. Include (mandatory sub-use-case) and Extend (optional enhancement) relationships. Good for requirements gathering and stakeholder communication.' },
        { heading: 'State Diagrams', content: 'Model object lifecycle and state transitions. States (rounded rectangles), transitions (arrows with events/conditions), initial state (filled circle), final state (target symbol). Example: Order states — Created → Paid → Shipped → Delivered (or Cancelled from any state).' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'Difference between Aggregation and Composition?', a: 'Both are HAS-A relationships. Aggregation (empty diamond): weak — child can exist independently (University has Professors — professors exist without university). Composition (filled diamond): strong — child cannot exist independently (House has Rooms — rooms don\'t exist without house). Composition implies ownership and lifecycle dependency.', difficulty: 'Easy' },
        { q: 'When would you use a sequence diagram?', a: 'To model the flow of messages between objects over time. Use cases: API call flows, authentication sequences, order processing pipelines, debugging race conditions. Essential for documenting complex multi-object interactions in system design interviews.', difficulty: 'Medium' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'Class Diagram: classes + relationships (most common)',
        'Sequence Diagram: object interactions over time',
        'Use Case Diagram: actor-system interactions',
        'State Diagram: object lifecycle transitions',
        'Access: + public, - private, # protected',
        'Aggregation (◇): weak HAS-A, Composition (◆): strong HAS-A',
        'Inheritance (△): IS-A, Implementation (△ dashed): implements interface'
      ]
    }
  },

  /* ═══════════════════════════════════════════════════════════
     MODULE: GIT
     ═══════════════════════════════════════════════════════════ */

  'git/sim': {
    title: 'Git & Version Control',
    module: 'Git & GitHub',
    icon: '🌿',
    fullNotes: {
      sections: [
        { heading: 'Git Architecture', content: 'Git is a distributed version control system. Every clone is a full repository with complete history. Three areas: Working Directory (your files), Staging Area/Index (files marked for next commit), Repository (.git directory with all commits). Objects: blobs (file content), trees (directory structure), commits (snapshots), tags (named references).' },
        { heading: 'Essential Commands', content: 'git init: create repo. git add: stage changes. git commit: save snapshot. git status: check state. git log: view history. git diff: compare changes. git branch: create/list branches. git checkout/switch: change branches. git merge: combine branches. git rebase: replay commits on new base.' },
        { heading: 'Branching & Merging', content: 'Branches are lightweight pointers to commits. HEAD points to current branch. Fast-forward merge: linear history, just move pointer. Three-way merge: creates a merge commit combining two branches. Merge conflicts: same lines changed in both branches — manual resolution required.' },
        { heading: 'Git Rebase vs Merge', content: 'Merge: preserves complete history, creates merge commits, non-destructive. Rebase: replays commits on new base, creates linear history, rewrites commit hashes. Golden rule: NEVER rebase shared/public branches. Use rebase for local feature branches, merge for integration.' },
        { heading: 'Git Stash, Cherry-pick & Reset', content: 'git stash: temporarily save uncommitted changes. git cherry-pick <hash>: apply a specific commit to current branch. git reset --soft: move HEAD, keep staging. git reset --mixed: move HEAD, unstage files. git reset --hard: move HEAD, discard all changes. git revert: create a new commit that undoes a previous commit (safe for shared branches).' },
        { heading: 'Git Workflow Strategies', content: 'Git Flow: main + develop + feature/release/hotfix branches. GitHub Flow: main + feature branches, deploy from main. Trunk-Based: everyone commits to main, use feature flags. Conventional Commits: structured messages (feat:, fix:, docs:) for automated changelogs.' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'What is the difference between git merge and git rebase?', a: 'Merge creates a merge commit combining two branches, preserving full history. Rebase replays your commits on top of the target branch, creating linear history but rewriting commit hashes. Use rebase for local branches, merge for shared branches. Never rebase public/shared branches.', difficulty: 'Easy' },
        { q: 'What is the difference between git reset and git revert?', a: 'git reset moves HEAD backward, discarding commits (dangerous on shared branches — rewrites history). git revert creates a NEW commit that undoes a previous commit (safe for shared branches — history is preserved). Use revert for public branches, reset for local work.', difficulty: 'Medium' },
        { q: 'Explain the three areas in Git.', a: 'Working Directory: where you edit files. Staging Area (Index): files marked for the next commit via git add. Repository (.git): stores all commits, branches, history. Flow: edit → stage (git add) → commit (git commit). git diff shows working vs staging, git diff --staged shows staging vs last commit.', difficulty: 'Easy' },
        { q: 'How do you resolve a merge conflict?', a: '1. Git marks conflicting files with <<<<<<< HEAD, =======, >>>>>>> markers. 2. Edit the file to keep the desired changes. 3. Remove the markers. 4. Stage the resolved file (git add). 5. Complete the merge (git commit). Tools: git mergetool opens visual diff editors.', difficulty: 'Medium' },
        { q: 'What is git cherry-pick?', a: 'Applies a specific commit from one branch to the current branch. Useful for selectively porting bug fixes without merging entire branches. Creates a new commit with the same changes but a different hash. Example: git cherry-pick abc123 applies commit abc123 to HEAD.', difficulty: 'Medium' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'Git: distributed VCS — every clone is a full repo',
        'Three areas: Working Dir → Staging (Index) → Repository',
        'Merge: preserves history, creates merge commit',
        'Rebase: linear history, rewrites hashes (never on shared branches)',
        'Reset: move HEAD (soft/mixed/hard). Revert: undo with new commit',
        'Stash: save WIP changes temporarily',
        'Cherry-pick: apply specific commit to current branch'
      ],
      mnemonics: [
        'Reset levels: Soft (keep staged) → Mixed (unstage) → Hard (discard all)',
        'Merge = Mailbox (keeps letters), Rebase = Rewriting (clean copy)'
      ]
    }
  },

  /* ═══════════════════════════════════════════════════════════
     MODULE: SYSTEM DESIGN
     ═══════════════════════════════════════════════════════════ */

  'systemdesign/load-balancer': {
    title: 'Load Balancers',
    module: 'System Design',
    icon: '⚖️',
    fullNotes: {
      sections: [
        { heading: 'What is Load Balancing?', content: 'A load balancer distributes incoming network traffic across multiple backend servers to ensure no single server is overwhelmed. Benefits: high availability (if one server fails, others handle traffic), horizontal scalability (add more servers), improved response time. Can operate at Layer 4 (TCP/UDP) or Layer 7 (HTTP/application-level).' },
        { heading: 'Load Balancing Algorithms', content: 'Round Robin: cycle through servers in order. Weighted Round Robin: servers with higher weight get more requests. Least Connections: send to server with fewest active connections. IP Hash: hash client IP to ensure sticky sessions. Least Response Time: send to fastest responding server. Random: random server selection.' },
        { heading: 'Health Checks', content: 'Load balancers periodically probe backend servers (HTTP GET /health, TCP connect, or custom checks). Unhealthy servers are removed from the pool. When they recover, they\'re added back. Active health checks: LB probes servers. Passive health checks: LB monitors response errors from normal traffic.' },
        { heading: 'Layer 4 vs Layer 7', content: 'L4 (Transport): routes based on IP/port, faster, no content inspection. L7 (Application): routes based on URL path, headers, cookies — enables content-based routing, SSL termination, caching. L7 is more flexible but adds latency. Modern LBs (NGINX, HAProxy, AWS ALB) support both.' },
        { heading: 'Sticky Sessions', content: 'Some applications need requests from the same client to go to the same server (e.g., shopping cart in memory). Methods: cookie-based affinity (LB injects a cookie), IP hash, URL/header-based routing. Trade-off: reduces even distribution and complicates failover.' },
        { heading: 'Real-World Load Balancers', content: 'Software: NGINX, HAProxy, Envoy, Traefik. Cloud: AWS ELB/ALB/NLB, GCP Cloud Load Balancing, Azure Load Balancer. DNS-based: Route 53, Cloudflare (geographic distribution). In large systems: multiple tiers of load balancers (global DNS → regional LB → local LB → servers).' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'What is the difference between L4 and L7 load balancing?', a: 'L4 operates at TCP/UDP level — routes based on IP and port, doesn\'t inspect content, very fast. L7 operates at HTTP level — can route based on URL path, headers, cookies. L7 enables content-based routing, SSL termination, and caching but adds latency.', difficulty: 'Easy' },
        { q: 'How does consistent hashing help in load balancing?', a: 'Consistent hashing maps both servers and requests to a hash ring. Each request goes to the nearest server clockwise on the ring. When a server is added/removed, only K/N keys need to remap (K=keys, N=servers) instead of rehashing everything. This minimizes disruption during scaling.', difficulty: 'Hard' },
        { q: 'What happens when a server fails behind a load balancer?', a: 'Health checks detect the failure. LB removes the server from the pool. Active connections to that server timeout/fail. New requests are routed to remaining healthy servers. When the server recovers and passes health checks, it\'s added back to the pool.', difficulty: 'Easy' },
        { q: 'How do you handle session persistence with load balancers?', a: 'Options: (1) Sticky sessions via cookies/IP hash — breaks even distribution. (2) Externalize session state to Redis/Memcached — any server can handle any request. (3) JWT tokens — stateless, session data in the token itself. Option 2 is the most scalable approach.', difficulty: 'Medium' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'Load Balancer: distributes traffic across servers',
        'Algorithms: Round Robin, Weighted RR, Least Connections, IP Hash',
        'L4: TCP/port-based, fast. L7: HTTP/content-based, flexible',
        'Health checks: active (LB probes) vs passive (monitor errors)',
        'Sticky sessions: cookie/IP hash — prefer external session store',
        'Consistent hashing: minimal disruption when scaling',
        'Real-world: NGINX, HAProxy, AWS ALB, Cloudflare'
      ]
    }
  },

  'systemdesign/cache-redis': {
    title: 'Caching & Redis',
    module: 'System Design',
    icon: '⚡',
    fullNotes: {
      sections: [
        { heading: 'Why Caching?', content: 'Caching stores frequently accessed data in fast storage (memory) to reduce latency and database load. A cache hit returns data in microseconds vs milliseconds for DB queries. Cache hit ratio = hits / (hits + misses). Ideal ratio: >95%. The closer the cache is to the client, the faster the response.' },
        { heading: 'Cache Strategies', content: 'Cache-Aside (Lazy Loading): App checks cache first; on miss, reads DB and writes to cache. Write-Through: Every DB write also updates cache (consistent but slower writes). Write-Behind (Write-Back): Write to cache first, asynchronously persist to DB (fast but risk of data loss). Read-Through: Cache automatically loads from DB on miss.' },
        { heading: 'Eviction Policies', content: 'When cache is full, evict entries to make room. LRU (Least Recently Used): evict the entry accessed longest ago — most common. LFU (Least Frequently Used): evict least accessed entry. FIFO: evict oldest entry. TTL (Time To Live): entries expire after a set time. Redis default: noeviction (returns error when full).' },
        { heading: 'Redis Overview', content: 'In-memory key-value store. Data structures: Strings, Lists, Sets, Sorted Sets, Hashes, Streams, HyperLogLog. Sub-millisecond latency. Persistence: RDB (periodic snapshots) and AOF (append-only file, every write logged). Replication: master-replica for read scaling. Cluster: automatic sharding across nodes.' },
        { heading: 'Cache Invalidation Problems', content: '"The two hardest problems in CS: cache invalidation, naming things, and off-by-one errors." Stale data: cached value differs from DB. Thundering herd: cache expires, many requests hit DB simultaneously. Solutions: cache stampede locks, probabilistic early expiration, staggered TTLs, write-through consistency.' },
        { heading: 'Caching Layers', content: 'Browser cache (HTTP headers, Service Workers), CDN (edge servers), Application cache (in-memory), Distributed cache (Redis/Memcached), Database cache (query cache, buffer pool). Multi-tier caching reduces latency progressively. Each layer has different TTL and invalidation strategies.' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'Explain Cache-Aside pattern.', a: 'App checks cache first. On hit: return cached data. On miss: read from database, store result in cache, return to caller. Pros: only requested data is cached (lazy). Cons: initial request for each key is slow (cache miss), potential stale data if DB is updated directly.', difficulty: 'Easy' },
        { q: 'What is a cache stampede and how do you prevent it?', a: 'When a popular cache key expires, many concurrent requests hit the database simultaneously. Prevention: (1) Lock/mutex: only one request fetches from DB, others wait. (2) Probabilistic early expiration: regenerate before actual TTL. (3) "Never expire": update cache asynchronously in background.', difficulty: 'Hard' },
        { q: 'LRU vs LFU eviction — when to use each?', a: 'LRU: evicts least recently used — good for temporal locality (recent data likely needed again). LFU: evicts least frequently used — good for popularity-based access (some items always popular). LRU is simpler and more common. LFU handles the case where a one-time scan evicts frequently used data from LRU.', difficulty: 'Medium' },
        { q: 'How does Redis achieve persistence?', a: 'RDB: periodic point-in-time snapshots (fork + copy-on-write). Fast restarts but may lose recent data. AOF: logs every write operation. Slower restarts but minimal data loss. Can use both: RDB for fast recovery, AOF for durability. Redis 7+ has multi-part AOF for faster rewrite.', difficulty: 'Medium' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'Cache-Aside: check cache → miss → read DB → update cache',
        'Write-Through: write DB + cache simultaneously',
        'Write-Behind: write cache, async persist to DB',
        'LRU: evict least recently used (most common)',
        'TTL: automatic expiration after set time',
        'Redis: in-memory, Strings/Lists/Sets/Hashes, sub-ms latency',
        'Cache stampede: lock, early expiration, or async refresh',
        'Hit ratio target: >95%'
      ]
    }
  },

  'systemdesign/db-scaling': {
    title: 'Database Scaling',
    module: 'System Design',
    icon: '📈',
    fullNotes: {
      sections: [
        { heading: 'Vertical vs Horizontal Scaling', content: 'Vertical (scale up): bigger machine — more CPU, RAM, SSD. Simple but has limits. Horizontal (scale out): add more machines. Requires data distribution strategy. Vertical for simplicity, horizontal for massive scale.' },
        { heading: 'Replication', content: 'Primary-Replica (Master-Slave): Primary handles writes, replicas handle reads. Increases read throughput. Replication lag: replicas may serve stale data (eventual consistency). Synchronous replication: slower writes but consistent replicas. Asynchronous: faster writes but potential data loss on primary failure.' },
        { heading: 'Sharding (Horizontal Partitioning)', content: 'Split data across multiple databases (shards). Each shard holds a subset of data. Sharding key determines which shard holds a record. Methods: Range-based (user IDs 1-1M on shard 1), Hash-based (hash(userID) % N), Directory-based (lookup table). Challenges: cross-shard queries, rebalancing, hotspots.' },
        { heading: 'Consistent Hashing', content: 'Maps both servers and data keys to a hash ring. Each key goes to the first server clockwise on the ring. Adding/removing a server only affects neighboring keys (K/N redistribution). Virtual nodes: each physical server maps to multiple ring positions for better balance.' },
        { heading: 'CAP Theorem', content: 'In a distributed system, you can guarantee at most 2 of 3: Consistency (all nodes see same data), Availability (every request gets a response), Partition Tolerance (system works despite network splits). Since partitions are inevitable, real choice is CP (consistent during partition, reject some requests) vs AP (available during partition, serve potentially stale data).' },
        { heading: 'NewSQL and Beyond', content: 'NewSQL databases (CockroachDB, Spanner, TiDB) aim for SQL interface + horizontal scalability + ACID. Google Spanner uses TrueTime (atomic clocks + GPS) for global consistency. Vitess: MySQL sharding middleware used by YouTube. For most apps: start with single DB → read replicas → caching → shard only when necessary.' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'What is replication lag and how do you handle it?', a: 'Replication lag is the delay between a write on the primary and its availability on replicas. Handling: (1) Read-your-writes consistency — route user\'s reads to primary after their writes. (2) Monotonic reads — always read from the same replica. (3) Use synchronous replication for critical data (slower).', difficulty: 'Medium' },
        { q: 'How do you choose a sharding key?', a: 'Ideal sharding key: high cardinality (many unique values), even distribution (no hotspots), commonly used in queries (avoid cross-shard queries). Example: user_id for a social network (most queries are per-user). Bad: created_date (all new data goes to one shard). Consider access patterns and future growth.', difficulty: 'Hard' },
        { q: 'Explain the CAP theorem with examples.', a: 'CP (Consistency + Partition tolerance): MongoDB, HBase — may reject requests during partitions. AP (Availability + Partition tolerance): Cassandra, DynamoDB — always respond but may serve stale data. CA doesn\'t exist in distributed systems (partitions are inevitable). Most systems offer tunable consistency.', difficulty: 'Medium' },
        { q: 'When should you shard vs add read replicas?', a: 'Read replicas: when reads >> writes (typical web apps). Solves read bottleneck. Sharding: when single-node write capacity is exceeded or dataset exceeds single-node storage. Sharding is much more complex — exhaust simpler options first (caching, read replicas, query optimization).', difficulty: 'Medium' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'Vertical: bigger machine. Horizontal: more machines',
        'Replication: Primary writes, Replicas read (read scaling)',
        'Sharding: split data across DBs by sharding key',
        'Consistent Hashing: minimal redistribution on scale',
        'CAP: pick 2 of Consistency, Availability, Partition Tolerance',
        'CP: MongoDB, HBase. AP: Cassandra, DynamoDB',
        'Scale path: optimize queries → cache → read replicas → shard'
      ]
    }
  },

  'systemdesign/message-queue': {
    title: 'Message Queues',
    module: 'System Design',
    icon: '📨',
    fullNotes: {
      sections: [
        { heading: 'What is a Message Queue?', content: 'An asynchronous communication mechanism between services. Producers send messages to a queue; consumers read and process them independently. Decouples producers from consumers in time, space, and processing speed. Enables: async processing, load leveling, fault tolerance, and microservice communication.' },
        { heading: 'Queue vs Topic (Pub/Sub)', content: 'Queue (Point-to-Point): each message consumed by ONE consumer. Used for task distribution. Topic (Publish-Subscribe): each message delivered to ALL subscribers. Used for event broadcasting. Kafka uses "consumer groups" — within a group, each message goes to one consumer; across groups, every group gets every message.' },
        { heading: 'Delivery Guarantees', content: 'At-Most-Once: message may be lost, never duplicated (fire and forget). At-Least-Once: message never lost, may be duplicated (acknowledge after processing — most common). Exactly-Once: message processed exactly once (hardest — requires idempotent consumers or transactional processing). Most systems use at-least-once + idempotent handlers.' },
        { heading: 'Dead Letter Queue (DLQ)', content: 'A queue for messages that fail processing after multiple retries. Prevents poison messages from blocking the main queue. DLQ messages can be inspected, debugged, and replayed. Typical pattern: retry 3 times with exponential backoff → move to DLQ → alert ops team.' },
        { heading: 'Popular Message Queues', content: 'RabbitMQ: traditional message broker, supports multiple patterns (fanout, direct, topic routing), AMQP protocol. Apache Kafka: distributed log, high throughput, durable, replayable — used for event streaming. AWS SQS: managed queue service, simple and reliable. Redis Streams: lightweight pub/sub and queue functionality built into Redis.' },
        { heading: 'Backpressure', content: 'When producers send faster than consumers can process, the queue grows unboundedly. Backpressure mechanisms: (1) Bounded queues that reject/block producers when full. (2) Rate limiting on producers. (3) Auto-scaling consumers based on queue depth. (4) Drop or sample messages (for monitoring/analytics).' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'When would you use a message queue?', a: 'Use cases: (1) Async processing — email sending, image resizing after upload. (2) Load leveling — smooth traffic spikes. (3) Service decoupling — order service queues payment processing. (4) Reliable delivery — retry failed operations. (5) Event sourcing — log all state changes for replay.', difficulty: 'Easy' },
        { q: 'How does Kafka differ from RabbitMQ?', a: 'Kafka: distributed log, high throughput, messages are persistent and replayable (consumers track offset). RabbitMQ: traditional broker, messages deleted after acknowledgment, rich routing (exchanges/bindings). Kafka for event streaming/analytics; RabbitMQ for task queues and complex routing.', difficulty: 'Medium' },
        { q: 'What is idempotency and why is it important with queues?', a: 'Idempotent operation: applying it multiple times produces the same result as once. Important because at-least-once delivery means consumers may process the same message twice. Example: "set balance to $100" is idempotent; "add $100 to balance" is NOT. Use deduplication keys or idempotent designs.', difficulty: 'Hard' },
        { q: 'What is a Dead Letter Queue?', a: 'A special queue for messages that fail processing after retry attempts. Prevents poison messages from blocking main queue processing. Messages in DLQ can be inspected for debugging and manually replayed after fixing the issue. Critical for production reliability.', difficulty: 'Easy' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'Queue: one consumer per message. Topic: all subscribers get every message',
        'At-Least-Once delivery + idempotent consumers = safe pattern',
        'DLQ: failed messages after retries go here for debugging',
        'Kafka: distributed log, replayable, high throughput',
        'RabbitMQ: traditional broker, rich routing, AMQP',
        'Backpressure: bounded queues, rate limiting, auto-scale consumers',
        'Use cases: async processing, decoupling, load leveling, event sourcing'
      ]
    }
  },

  'systemdesign/api-lifecycle': {
    title: 'API Request Lifecycle',
    module: 'System Design',
    icon: '🔄',
    fullNotes: {
      sections: [
        { heading: 'End-to-End Request Flow', content: 'User clicks link → DNS resolution → TCP connection → TLS handshake → HTTP request → Load Balancer → API Gateway → Authentication/Authorization → Rate Limiting → Backend Service → Cache Check → Database Query → Response Assembly → Return to client. Each step adds latency; optimization targets the slowest steps.' },
        { heading: 'DNS Resolution', content: 'Browser cache → OS cache → Recursive resolver → Root NS → TLD NS → Authoritative NS → IP address. Total: 4-8 lookups for uncached domains, ~50-200ms. Optimization: DNS prefetching (<link rel="dns-prefetch">), short TTLs for failover, GeoDNS for nearest server.' },
        { heading: 'API Gateway', content: 'Central entry point for all API calls. Handles cross-cutting concerns: authentication, rate limiting, request routing, protocol translation (REST→gRPC), request/response transformation, logging, monitoring. Examples: Kong, NGINX, AWS API Gateway, Envoy. Prevents each microservice from reimplementing these concerns.' },
        { heading: 'Authentication & Authorization', content: 'Authentication (who are you?): JWT tokens, OAuth 2.0, API keys, session cookies. Authorization (what can you do?): RBAC (role-based), ABAC (attribute-based), ACL (access control lists). JWT: stateless token containing claims, signed by server, verified without DB lookup. OAuth 2.0: delegated authorization (login with Google).' },
        { heading: 'Rate Limiting', content: 'Prevents abuse by limiting request frequency. Algorithms: Token Bucket (smooth), Leaky Bucket (constant rate), Fixed Window (simple), Sliding Window (accurate). Rate limit by: IP, user, API key, endpoint. Return HTTP 429 Too Many Requests. Use Redis for distributed rate limiting across multiple server instances.' },
        { heading: 'Response Optimization', content: 'Compression (gzip/Brotli), pagination (limit/offset, cursor-based), field selection (GraphQL, sparse fieldsets), HTTP caching (ETag, Cache-Control), connection pooling, and CDN for static assets. Monitor with: P50/P95/P99 latency, error rates, throughput metrics.' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'Walk through what happens when you make an API call.', a: 'DNS → TCP → TLS → LB → API Gateway (auth, rate limit) → Route to service → Service logic (cache check → DB query if miss → compute response) → Response back through LB → Client. Each layer can add caching, retries, and monitoring.', difficulty: 'Easy' },
        { q: 'How does JWT authentication work?', a: 'User logs in with credentials → Server verifies and generates a JWT (header.payload.signature) signed with a secret key → Client stores JWT → Client sends JWT in Authorization header for each request → Server verifies signature without DB lookup (stateless). JWT contains claims (user_id, exp, roles).', difficulty: 'Medium' },
        { q: 'Compare Token Bucket vs Sliding Window rate limiting.', a: 'Token Bucket: tokens added at fixed rate, each request consumes one token. Allows bursts up to bucket capacity. Simple, allows controlled bursts. Sliding Window: count requests in a sliding time window. More accurate rate enforcement, no bursts. Sliding window is more predictable; token bucket is more flexible.', difficulty: 'Hard' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'Flow: DNS → TCP → TLS → LB → Gateway → Service → Cache/DB → Response',
        'API Gateway: auth, rate limit, routing, monitoring in one place',
        'JWT: stateless auth token (header.payload.signature)',
        'OAuth 2.0: delegated auth (Authorization Code, Client Credentials)',
        'Rate Limiting: Token Bucket (bursty), Sliding Window (strict)',
        'HTTP 429: Too Many Requests',
        'P50/P95/P99 latency metrics for monitoring'
      ]
    }
  },

  'systemdesign/microservices': {
    title: 'Microservices Architecture',
    module: 'System Design',
    icon: '🔧',
    fullNotes: {
      sections: [
        { heading: 'Monolith vs Microservices', content: 'Monolith: single deployable unit, shared database, simple to develop initially, difficult to scale and maintain as it grows. Microservices: independent services, each with own database, deployed independently, communicate via APIs/messaging. Microservices add complexity (networking, consistency, debugging) but enable team autonomy and independent scaling.' },
        { heading: 'Service Communication', content: 'Synchronous: REST (HTTP/JSON, simple), gRPC (Protocol Buffers, fast, streaming). Asynchronous: Message queues (Kafka, RabbitMQ) for event-driven communication. Sync = simpler but creates coupling. Async = decoupled but harder to debug. Saga pattern for distributed transactions across services.' },
        { heading: 'Service Discovery', content: 'How services find each other. Client-side: service registry (Consul, Eureka) — client queries registry, selects instance. Server-side: load balancer handles routing (Kubernetes Services). DNS-based: services registered as DNS records. In Kubernetes: Service objects + kube-proxy handle discovery automatically.' },
        { heading: 'Circuit Breaker Pattern', content: 'Prevents cascading failures when a downstream service is failing. States: Closed (normal — requests pass through), Open (service failing — requests fail fast without calling), Half-Open (test — allow limited requests to check recovery). Libraries: Resilience4j (Java), Polly (.NET). Pair with fallbacks, retries with backoff, and bulkheads.' },
        { heading: 'Distributed Tracing', content: 'Track a request across multiple services for debugging and performance analysis. Each request gets a trace ID propagated through all services. Tools: Jaeger, Zipkin, AWS X-Ray, OpenTelemetry. Combined with centralized logging (ELK Stack) and metrics (Prometheus + Grafana) for full observability.' },
        { heading: 'Data Management', content: 'Database per service: each service owns its data, no direct DB access by other services. Challenge: distributed transactions. Solutions: Saga pattern (choreography or orchestration), eventual consistency, event sourcing (store events, derive state). CQRS: separate read and write models for optimized queries.' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'When should you use microservices vs monolith?', a: 'Start with monolith for new projects — simpler to develop and deploy. Consider microservices when: team grows beyond 2 pizza teams, different components need different scaling, independent deployment is critical, technology diversity is needed. Microservices = organizational scaling, not just technical.', difficulty: 'Easy' },
        { q: 'What is the Circuit Breaker pattern?', a: 'Monitors calls to a service. If failures exceed a threshold, the circuit "opens" — subsequent calls fail immediately without attempting the request. After a timeout, the circuit goes "half-open" — allows test requests. If tests succeed, circuit closes. Prevents cascading failures and gives failing services time to recover.', difficulty: 'Medium' },
        { q: 'How do you handle distributed transactions in microservices?', a: 'No distributed ACID transactions. Instead: Saga pattern — sequence of local transactions. Choreography: each service publishes events triggering the next step. Orchestration: a central coordinator directs the flow. Compensation: if step N fails, undo steps 1 to N-1. Requires idempotent operations.', difficulty: 'Hard' },
        { q: 'What is the Strangler Fig pattern?', a: 'Strategy for migrating from monolith to microservices. Gradually route requests from monolith to new microservices. Facade/proxy intercepts requests — new features go to microservices, existing features still in monolith. Over time, the monolith shrinks until fully replaced. Named after strangler fig trees that grow around host trees.', difficulty: 'Medium' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'Monolith: simple start, hard to scale. Microservices: complex, independently scalable',
        'Communication: REST/gRPC (sync) vs Message Queue (async)',
        'Circuit Breaker: Closed → Open → Half-Open (prevent cascading failure)',
        'Service Discovery: registry (Consul) or LB (Kubernetes)',
        'Saga pattern: sequence of local transactions for distributed consistency',
        'Database per service: no shared DB, use events for data sharing',
        'Observability: tracing (Jaeger) + logging (ELK) + metrics (Prometheus)'
      ]
    }
  },

  /* ═══════════════════════════════════════════════════════════
     MODULE: INTERVIEW
     ═══════════════════════════════════════════════════════════ */

  'interview': {
    title: 'Technical Interview Preparation',
    module: 'Interview Prep',
    icon: '🎯',
    fullNotes: {
      sections: [
        { heading: 'Interview Structure', content: 'Typical tech interview rounds: (1) Online Assessment (DSA, MCQ). (2) Technical Phone Screen (coding + CS fundamentals). (3) Onsite — System Design (for experienced), DSA rounds (2-3), Behavioral/HR. Preparation timeline: 3-6 months. Focus: 70% DSA, 20% CS fundamentals, 10% system design (adjust by experience level).' },
        { heading: 'Data Structures Essentials', content: 'Arrays: O(1) access, O(n) insert/delete. Linked Lists: O(1) insert/delete at head, O(n) access. Stacks/Queues: LIFO/FIFO, O(1) operations. Hash Maps: O(1) average lookup, O(n) worst. Trees: BST O(log n) operations. Heaps: O(1) min/max, O(log n) insert/delete. Graphs: adjacency list/matrix, BFS/DFS traversal.' },
        { heading: 'Algorithm Patterns', content: 'Two Pointers, Sliding Window, Binary Search, BFS/DFS, Dynamic Programming, Backtracking, Greedy, Divide & Conquer, Union-Find, Topological Sort. For each pattern: know when to apply, template code, and common problems. DP: identify subproblems, recurrence relation, base cases, memoization vs tabulation.' },
        { heading: 'System Design Framework (RESHADED)', content: 'Requirements (functional + non-functional) → Estimation (traffic, storage, bandwidth) → Storage Schema (DB design) → High-level Architecture (components diagram) → API Design (endpoints) → Detailed Design (deep dive into components) → Evaluation (bottlenecks, trade-offs) → Distinctive (unique aspects, edge cases).' },
        { heading: 'Behavioral Interview (STAR Method)', content: 'Situation: set the context. Task: what was your responsibility. Action: what you specifically did (not the team). Result: quantifiable outcome. Prepare 5-6 stories covering: leadership, conflict, failure, teamwork, tight deadline, ambiguity. Amazon Leadership Principles are a good framework even for non-Amazon interviews.' },
        { heading: 'Common CS Fundamentals', content: 'OS: processes vs threads, virtual memory, scheduling, deadlocks, synchronization. DBMS: normalization, ACID, indexing, SQL queries, transactions. Networks: OSI model, TCP/UDP, HTTP/HTTPS, DNS. OOP: SOLID, design patterns, abstraction, polymorphism. These form the foundation for system design and coding interviews.' }
      ]
    },
    interviewPrep: {
      questions: [
        { q: 'How should I prepare for a technical interview in 3 months?', a: 'Month 1: DS fundamentals + easy problems (50-70 LeetCode). Month 2: medium problems (80-100) + patterns + CS fundamentals. Month 3: hard problems (20-30) + system design + mock interviews. Daily: 2-3 problems + 1 concept review. Use spaced repetition for patterns.', difficulty: 'Easy' },
        { q: 'How do you approach a coding problem in an interview?', a: '1. Clarify requirements (inputs, outputs, edge cases, constraints). 2. Think of examples and trace through. 3. Discuss brute force approach. 4. Optimize — identify pattern/data structure. 5. Code the solution. 6. Test with examples + edge cases. 7. Analyze time/space complexity. Communicate throughout!', difficulty: 'Easy' },
        { q: 'What topics are most commonly asked in CS fundamentals?', a: 'Top topics: (1) OS: processes vs threads, memory management, deadlocks. (2) DBMS: SQL joins, normalization, ACID, indexing. (3) Networks: TCP vs UDP, HTTP methods, DNS resolution. (4) OOP: pillars, SOLID, design patterns (Singleton, Observer, Factory). Focus on conceptual understanding + interview-style Q&A.', difficulty: 'Easy' },
        { q: 'How should I approach a system design interview?', a: 'Follow a structured framework: 1. Clarify requirements (5 min). 2. Estimate scale (3 min). 3. High-level architecture with components (5 min). 4. API design (5 min). 5. Data model (5 min). 6. Deep dive into 2-3 components (15 min). 7. Address bottlenecks and trade-offs (5 min). Drive the conversation, don\'t wait for interviewer.', difficulty: 'Medium' }
      ]
    },
    cheatSheet: {
      keyPoints: [
        'Interview flow: OA → Phone Screen → Onsite (coding + system design + behavioral)',
        'Coding: understand → examples → brute force → optimize → code → test',
        'Patterns: Two Pointers, Sliding Window, Binary Search, DP, BFS/DFS',
        'System Design: RESHADED framework',
        'Behavioral: STAR method (Situation, Task, Action, Result)',
        'CS Fundamentals: OS + DBMS + Networks + OOP',
        'Time complexity cheat: O(1) < O(log n) < O(n) < O(n log n) < O(n²)'
      ],
      formulas: [
        'Time complexities: Array access O(1), Binary Search O(log n)',
        'HashMap O(1) avg, BST O(log n), Sort O(n log n)',
        'BFS/DFS O(V+E), Dijkstra O((V+E) log V)',
        'DP typical: O(n²) or O(n×m) with memoization'
      ]
    }
  }
};
