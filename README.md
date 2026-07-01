# 🎨 Core Concepts Studio — Interactive Computer Science Simulators

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62B)](https://vitejs.dev/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![SEO Optimized](https://img.shields.io/badge/SEO-Optimized-success?style=for-the-badge)](#-search-engine-optimization-seo)

**Core Concepts Studio** (previously *CS Simulator*) is a premium, highly interactive browser-based visualization platform designed to demystify complex computer science theories. By stripping away black boxes, it allows developers, engineers, and students to watch algorithms execute tick-by-tick, packet-by-packet, and commit-by-commit.

Featuring a high-fidelity **Neo-Brutalist** dashboard design system with dark/light mode toggles, this platform delivers premium, responsive user experiences optimized for both ultra-wide screens and mobile viewports.

---

## 🚀 Key Modules & Interactive Simulators

### 1. 🖥️ Operating Systems (OS)
*   **CPU Scheduler**: Real-time Gantt charts for FCFS, SJF, Round Robin, and Priority scheduling (preemptive/non-preemptive). Includes **multi-core configuration**, ready queue timelines, and average turnaround/waiting metrics.
*   **Page Replacement Sim**: Interactive FIFO, LRU, and Optimal simulator. Step-by-step memory frame allocation grids displaying hits, page faults, and queue state changes.
*   **Banker's Algorithm**: Resource allocation solver. Highlights safe sequences, allocation matrices, and highlights unsafe states/deadlock states in real time.
*   **Disk Scheduling**: FCFS, SSTF, SCAN, C-SCAN, LOOK, and C-LOOK. Renders a smooth, dynamic SVG line chart plotting read-write head movements across disk tracks.
*   **Process Synchronization**: Interactive, state-logged simulators for classic synchronization problems: Producer-Consumer (bounded buffer), Reader-Writer, and Dining Philosophers.

### 2. 🗄️ Database Management Systems (DBMS)
*   **Database Normalization**: Input schemas and functional dependencies to normal forms (1NF, 2NF, 3NF, and BCNF) with clear breakdown explanations.
*   **SQL Joins Visualizer**: Live interactive Venn diagrams mapping dataset tables to SQL query outputs (`INNER`, `LEFT`, `RIGHT`, and `FULL OUTER` joins).
*   **B+ Tree Indexing**: Full insertion, deletion, and search animations with tree balance splitting, parent promotion, and key lookup highlighting.
*   **ER Diagram Builder**: Draw entities, attributes, and relationships. Create links and export schemas on a fully interactive board.
*   **SQL AST Parse Visualizer**: Parses raw SQL queries into interactive syntax trees.

### 3. 🌐 Computer Networks
*   **OSI Layer Protocol Stack**: Visualizes packet encapsulation and decapsulation from Application down to Physical layer as it traverses network boundaries.
*   **TCP vs UDP Flow**: Side-by-side animation displaying TCP 3-way handshakes (SYN, SYN-ACK, ACK) and flow control vs UDP connectionless streaming.
*   **IP Subnetting Calculator**: Dynamically splits network ranges, computes mask representations, host capacity limits, and visualizes network boundaries.
*   **Routing Algorithms**: Interactive network graphs to edit nodes, links, and run Dijkstra's or Distance Vector routing step-by-step.
*   **HTTP Request Lifecycle**: Tracks DNS query resolution from root servers down to Authoritative Nameservers, then routes HTTP payloads to API endpoints.

### 4. 🧩 OOP, SOLID Principles & UML
*   **Four Pillars of OOP**: Dynamic dashboards demonstrating abstraction, encapsulation, inheritance, and polymorphism.
*   **VTable Runtime Dispatch**: Shows class memory layout, compiler pointers (`vptr`), and Virtual Method Tables (`VTables`) during runtime method overrides.
*   **SOLID Principles Sim**: Dual-column dashboards displaying structured side-by-side code blocks showing violations vs refactored patterns, accompanied by interactive class dependency flowcharts.
*   **UML Class Editor**: Interactive canvas to model UML blocks, add properties/methods, and connect classes with dependency, inheritance, or association arrows.

### 5. 🔀 Git Graph Version Control
*   **Visual Git Commit Tree**: Interactive CLI simulator. Execute commands like `git commit`, `git branch`, `git checkout`, `git merge`, `git rebase`, and watch the commit graph render dynamically.

### 6. 🌐 System Design (Distributed Systems)
*   **Load Balancers**: Simulate Round Robin, Least Connections, and IP Hashing traffic distribution.
*   **Redis Caching Policies**: EVict keys in real-time under LRU, LFU, and FIFO rules.
*   **Database Scaling**: Interactive visualizer for database master-slave replication and horizontal sharding.
*   **Message Queues**: RabbitMQ & Kafka simulators showcasing publish-subscribe, topic routing, and partition offsets.

---

## 🛠️ Architecture & Tech Stack

The application is built on a clean, scalable architectural model:
*   **Vite + React**: Hot-reloading, lighting-fast production builds, and clean component structures.
*   **Framer Motion**: Powering fluid layouts, responsive panels, slide-overs, and algorithm step transitions.
*   **Pure SVG Coordinates**: Interactive flowcharts, Dijkstra graphs, and UML editor connectors are drawn using SVG paths with custom dynamic Bezier coordinates for perfect browser scalability.
*   **Custom React Hooks State Engine**: Complex simulators (like CPU scheduling and Git commit trees) run on robust, custom hook-based state machines, isolating domain logic from UI presentation.
*   **Neo-Brutalist Theme System**: Powered by raw CSS variables, supporting pixel-perfect dark/light modes, thick black borders (`3px solid var(--border)`), high-contrast panels, and offset box shadows.

---

## 🔍 Search Engine Optimization (SEO)

The platform is SEO-optimized to target the keyword **`coreconceptstudio`** and **"Core Concepts Studio"**:
*   **Dynamic Document Title & Description Manager**: Injects descriptive, keyword-rich titles and metadata page-by-page as user routes shift.
*   **Semantic Markup Hierarchy**: Structured with clear heading weights, `<meta>` OG tags, and canonical links.
*   **High Indexability**: Meta viewport optimizations, fast page loading, and responsive desktop/mobile layouts.

---

## 🏁 Getting Started

### 📋 Prerequisites
*   Node.js (v18.0.0 or higher)
*   npm (v9.0.0 or higher)

### 💻 Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/coreconceptstudio.git
    cd coreconceptstudio
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Launch the development server:
    ```bash
    npm run dev
    ```
    Open your browser and navigate to `http://localhost:5173` to explore!

4.  Build for production:
    ```bash
    npm run build
    ```

---

## 🌟 Why this Project Impresses Recruiters

*   **Deep Computational Modeling**: Writing functional simulators (like vtables, database normalizers, and routing algorithms) requires deep engineering knowledge, far beyond basic CRUD applications.
*   **Custom SVG Engines**: Designing interactive vector builders (like UML Editors and Network Graph creators) showcases mastery over the HTML5 DOM, React refs, and coordinate geometry.
*   **Responsive Neo-Brutalist Styling**: A flawless visual aesthetic without reliance on bulky utility classes, demonstrating advanced CSS architecture and animation design.
*   **Clean and Decoupled Code**: Utilizing custom React hook structures separates system state logic from display components, making the codebase highly maintainable.
