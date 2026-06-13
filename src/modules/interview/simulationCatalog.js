// Maps backend simulation_id values to in-app routes.
// Keep in sync with backend/src/simulations.js.
export const SIMULATION_CATALOG = {
    // OS
    'cpu-scheduling': { label: 'CPU Scheduling', path: '/os/scheduling', module: 'OS', color: 'var(--yellow)' },
    'page-replacement': { label: 'Page Replacement', path: '/os/page-replacement', module: 'OS', color: 'var(--yellow)' },
    'bankers-deadlock': { label: "Banker's Algorithm", path: '/os/bankers', module: 'OS', color: 'var(--yellow)' },
    'disk-scheduling': { label: 'Disk Scheduling', path: '/os/disk', module: 'OS', color: 'var(--yellow)' },
    'process-sync': { label: 'Process Synchronization', path: '/os/sync', module: 'OS', color: 'var(--yellow)' },
    // DBMS
    'normalization': { label: 'Normalization', path: '/dbms/normalization', module: 'DBMS', color: 'var(--cyan)' },
    'sql-joins': { label: 'SQL Joins', path: '/dbms/joins', module: 'DBMS', color: 'var(--cyan)' },
    'transactions-acid': { label: 'Transactions & ACID', path: '/dbms/transactions', module: 'DBMS', color: 'var(--cyan)' },
    'bplus-tree-index': { label: 'B+ Tree Index', path: '/dbms/bplustree', module: 'DBMS', color: 'var(--cyan)' },
    'er-design': { label: 'ER Design', path: '/dbms/er-design', module: 'DBMS', color: 'var(--cyan)' },
    'sql-query-execution': { label: 'SQL Query Execution', path: '/dbms/sql-visualizer', module: 'DBMS', color: 'var(--cyan)' },
    // Networks
    'osi-model': { label: 'OSI Model', path: '/networks/osi', module: 'Networks', color: 'var(--pink)' },
    'tcp-vs-udp': { label: 'TCP vs UDP', path: '/networks/tcp-udp', module: 'Networks', color: 'var(--pink)' },
    'subnetting': { label: 'IP Subnetting', path: '/networks/subnetting', module: 'Networks', color: 'var(--pink)' },
    'routing-algorithms': { label: 'Routing Algorithms', path: '/networks/routing', module: 'Networks', color: 'var(--pink)' },
    'http-dns': { label: 'HTTP & DNS', path: '/networks/http-dns', module: 'Networks', color: 'var(--pink)' },
    // OOP
    'oop-four-pillars': { label: 'Four Pillars of OOP', path: '/oops/pillars', module: 'OOP', color: 'var(--green)' },
    'inheritance-mro': { label: 'Inheritance & MRO', path: '/oops/inheritance', module: 'OOP', color: 'var(--green)' },
    'abstract-vs-interface': { label: 'Abstract vs Interface', path: '/oops/abstract-interface', module: 'OOP', color: 'var(--green)' },
    'design-patterns': { label: 'Design Patterns', path: '/oops/patterns', module: 'OOP', color: 'var(--green)' },
    'solid-principles': { label: 'SOLID Principles', path: '/oops/solid', module: 'OOP', color: 'var(--green)' },
    'uml-diagrams': { label: 'UML Diagrams', path: '/oops/uml', module: 'OOP', color: 'var(--green)' },
};

export function getSimulation(id) {
    return id ? SIMULATION_CATALOG[id] ?? null : null;
}
