import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Loader from './components/Loader';
import ScrollToTop from './components/ScrollToTop';


// Pages
import LandingPage from './pages/LandingPage';
import SimulationPage from './pages/SimulationPage';
import ComparisonPage from './pages/ComparisonPage';

// OS Module
import OSLanding from './modules/os/OSLanding';
import PageReplacementSim from './modules/os/PageReplacementSim';
import BankersAlgorithmSim from './modules/os/BankersAlgorithmSim';
import DiskSchedulingSim from './modules/os/DiskSchedulingSim';
import ProcessSyncSim from './modules/os/ProcessSyncSim';

// DBMS Module
import DBMSLanding from './modules/dbms/DBMSLanding';
import NormalizationSim from './modules/dbms/NormalizationSim';
import SqlJoinsSim from './modules/dbms/SqlJoinsSim';
import TransactionsSim from './modules/dbms/TransactionsSim';
import BPlusTreeSim from './modules/dbms/BPlusTreeSim';
import ErDesignSim from './modules/dbms/ErDesignSim';
import SqlQueryVisualizerSim from './modules/dbms/SqlQueryVisualizerSim';

// Networks Module
import NetworksLanding from './modules/networks/NetworksLanding';
import OsiModelSim from './modules/networks/OsiModelSim';
import TcpUdpSim from './modules/networks/TcpUdpSim';
import SubnettingSim from './modules/networks/SubnettingSim';
import RoutingAlgoSim from './modules/networks/RoutingAlgoSim';
import HttpDnsSim from './modules/networks/HttpDnsSim';

// OOP Module
import OOPSLanding from './modules/oops/OOPSLanding';
import FourPillarsSim from './modules/oops/FourPillarsSim';
import InheritanceDeepDiveSim from './modules/oops/InheritanceDeepDiveSim';
import AbstractInterfaceSim from './modules/oops/AbstractInterfaceSim';
import DesignPatternsSim from './modules/oops/DesignPatternsSim';
import SolidPrinciplesSim from './modules/oops/SolidPrinciplesSim';
import UmlDiagramsSim from './modules/oops/UmlDiagramsSim';

// Git Module
import GitLanding from './modules/git/GitLanding';
import GitSim from './modules/git/GitSim';

// Interview Module
import InterviewSim from './modules/interview/InterviewSim';

// System Design Module
import SystemDesignLanding from './modules/systemdesign/SystemDesignLanding';
import LoadBalancerSim from './modules/systemdesign/LoadBalancerSim';
import CacheRedisSim from './modules/systemdesign/CacheRedisSim';
import DbScalingSim from './modules/systemdesign/DbScalingSim';
import MessageQueueSim from './modules/systemdesign/MessageQueueSim';
import ApiLifecycleSim from './modules/systemdesign/ApiLifecycleSim';
import MicroservicesSim from './modules/systemdesign/MicroservicesSim';

const MODULE_LABELS = {
  '/os': 'OS',
  '/dbms': 'DBMS',
  '/networks': 'Networks',
  '/oops': 'OOP',
  '/git': 'Git',
  '/interview': 'Interview',
};

const ROUTE_TITLES = {
  '/': 'Core Concepts Studio — Interactive Computer Science Simulators',
  '/os': 'Operating Systems Simulators | Core Concepts Studio',
  '/os/scheduling': 'CPU Scheduling Simulator | Core Concepts Studio',
  '/os/scheduling/compare': 'CPU Scheduling Algorithms Comparison | Core Concepts Studio',
  '/os/page-replacement': 'Page Replacement Algorithms Simulator | Core Concepts Studio',
  '/os/bankers': "Banker's Algorithm Resource Allocation | Core Concepts Studio",
  '/os/disk': 'Disk Scheduling Algorithms Simulator | Core Concepts Studio',
  '/os/sync': 'Process Synchronization Simulators | Core Concepts Studio',
  '/dbms': 'DBMS Database Concepts | Core Concepts Studio',
  '/dbms/normalization': 'Database Normalization Sim (1NF, 2NF, 3NF, BCNF) | Core Concepts Studio',
  '/dbms/joins': 'SQL Joins Simulator (Inner, Left, Right, Outer) | Core Concepts Studio',
  '/dbms/transactions': 'Concurrency Control & Transactions Simulator | Core Concepts Studio',
  '/dbms/bplustree': 'B+ Tree Indexing Visualizer | Core Concepts Studio',
  '/dbms/er-design': 'ER Diagram Database Design Tool | Core Concepts Studio',
  '/dbms/sql-visualizer': 'SQL Query Abstract Syntax Tree Visualizer | Core Concepts Studio',
  '/networks': 'Computer Networks Simulator | Core Concepts Studio',
  '/networks/osi': 'OSI Layer Protocol Stack Simulator | Core Concepts Studio',
  '/networks/tcp-udp': 'TCP vs UDP Transmission Flow | Core Concepts Studio',
  '/networks/subnetting': 'IP Subnetting Calculator & Visualizer | Core Concepts Studio',
  '/networks/routing': 'Routing Algorithms (Dijkstra, Distance Vector) | Core Concepts Studio',
  '/networks/http-dns': 'HTTP Request Lifecycle & DNS Lookup | Core Concepts Studio',
  '/oops': 'Object-Oriented Programming (OOP) | Core Concepts Studio',
  '/oops/pillars': 'Four Pillars of OOP Interactive Visualizer | Core Concepts Studio',
  '/oops/inheritance': 'Polymorphism & VTable Dispatch Simulator | Core Concepts Studio',
  '/oops/abstract-interface': 'Abstract Class vs Interface Architecture | Core Concepts Studio',
  '/oops/patterns': 'Strategy, Factory & Observer Design Patterns | Core Concepts Studio',
  '/oops/solid': 'SOLID Software Design Principles Sim | Core Concepts Studio',
  '/oops/uml': 'UML Class Diagram Editor & Visualizer | Core Concepts Studio',
  '/interview': 'CS Interview Coding Simulator | Core Concepts Studio',
  '/git': 'Git Version Control Simulator | Core Concepts Studio',
  '/git/sim': 'Git Graph Visual Commit Simulator | Core Concepts Studio',
  '/systemdesign': 'System Design Visual Simulators | Core Concepts Studio',
  '/systemdesign/load-balancer': 'Load Balancer Algorithms Visualizer | Core Concepts Studio',
  '/systemdesign/cache-redis': 'Redis Cache Policies Simulator | Core Concepts Studio',
  '/systemdesign/db-scaling': 'Database Sharding & Replication | Core Concepts Studio',
  '/systemdesign/message-queue': 'RabbitMQ & Kafka Message Queue Simulator | Core Concepts Studio',
  '/systemdesign/api-lifecycle': 'API Lifecycle & Gateway Routing Sim | Core Concepts Studio',
  '/systemdesign/microservices': 'Microservices Communication Sim | Core Concepts Studio',
};

const ROUTE_DESCRIPTIONS = {
  '/': 'Core Concepts Studio (coreconceptstudio) — Master OS, DBMS, Computer Networks, OOP, Git, System Design, and CS Interviews through interactive visual step-by-step simulators.',
  '/os': 'Interactive Operating System (OS) simulators covering CPU Scheduling, Page Replacement, Banker\'s Algorithm, Disk Scheduling, and Process Synchronization.',
  '/os/scheduling': 'Interactive CPU Scheduling Simulator — Visualize FCFS, SJF, SRTF, Round Robin, Priority (Preemptive & Non-Preemptive) algorithms with Gantt charts.',
  '/os/scheduling/compare': 'Compare CPU Scheduling Algorithms side-by-side with metrics for waiting time, turnaround time, throughput, and Gantt charts.',
  '/os/page-replacement': 'Page Replacement Simulator — Visualize FIFO, LRU, Optimal, and LFU page replacement algorithms with step-by-step frame allocation.',
  '/os/bankers': "Banker's Algorithm Simulator — Visual deadlock avoidance and safe state evaluation tool for operating systems.",
  '/os/disk': 'Disk Scheduling Simulator — Visualize FCFS, SSTF, SCAN, C-SCAN, LOOK, and C-LOOK disk head movement and total seek counts.',
  '/os/sync': 'Process Synchronization Simulator — Interactive Producer-Consumer, Reader-Writer, and Dining Philosophers semaphore visualizer.',
  '/dbms': 'Interactive Database Systems (DBMS) visualizers — Master Normalization, SQL Joins, Concurrency, B+ Trees, ER Design, and SQL AST.',
  '/dbms/normalization': 'Database Normalization Visualizer — Step-by-step guide and simulator for 1NF, 2NF, 3NF, and BCNF relational schema decomposition.',
  '/dbms/joins': 'Interactive SQL Joins Simulator — Visual execution of Inner Join, Left Join, Right Join, and Full Outer Join with interactive tables.',
  '/dbms/transactions': 'Transactions & Concurrency Control Simulator — Visualize ACID properties, Serializability, 2PL, and Lock-based protocols.',
  '/dbms/bplustree': 'B+ Tree Index Data Structure Visualizer — Step-by-step node insertion, deletion, splitting, and search visualization.',
  '/dbms/er-design': 'Entity-Relationship (ER) Diagram Design Tool — Interactive ER modeling, entities, attributes, and relationships.',
  '/dbms/sql-visualizer': 'SQL Query Visualizer & AST Parser — Watch SQL queries parse into execution plans and abstract syntax trees visually.',
  '/networks': 'Interactive Computer Networks visualizers — Master OSI & TCP/IP models, Subnetting, TCP handshakes, Routing, and HTTP/DNS.',
  '/networks/osi': 'OSI & TCP/IP Model Interactive Visualizer — Step-by-step encapsulation and decapsulation of packets across network layers.',
  '/networks/tcp-udp': 'TCP vs UDP Simulator — 3-Way Handshake, reliable data transfer, congestion control, and UDP packet flow visualizer.',
  '/networks/subnetting': 'IP Subnetting Calculator & Visualizer — Network ID, Broadcast address, subnet mask, usable host range, and CIDR breakdown.',
  '/networks/routing': 'Network Routing Algorithms Visualizer — Interactive Shortest Path (Dijkstra) and Distance Vector Routing visualizer.',
  '/networks/http-dns': 'HTTP Lifecycle & DNS Lookup Simulator — Visual step-by-step DNS resolution, TCP connection setup, and HTTP headers.',
  '/oops': 'Interactive Object-Oriented Programming (OOP) visualizers — Four Pillars, Inheritance, Interfaces, Design Patterns, SOLID, and UML.',
  '/oops/pillars': 'Four Pillars of OOP Simulator — Interactive visualization of Encapsulation, Abstraction, Inheritance, and Polymorphism.',
  '/oops/inheritance': 'Polymorphism & VTable Dispatch Simulator — Visualize dynamic dispatch, vtables, and multiple inheritance in memory.',
  '/oops/abstract-interface': 'Abstract Class vs Interface Architecture — Visual tool comparing abstract classes, interfaces, and design patterns.',
  '/oops/patterns': 'Design Patterns Interactive Visualizer — Learn Strategy, Factory, Observer, and Singleton patterns with execution steps.',
  '/oops/solid': 'SOLID Principles Simulator — Visual guide and interactive scenarios for Single Responsibility, Open-Closed, Liskov, Interface Segregation, and Dependency Inversion.',
  '/oops/uml': 'UML Class Diagram Visualizer & Editor — Create and visualize UML class diagrams, relationships, and multiplicity.',
  '/interview': 'CS Interview Coding & Technical Challenge Simulator — Practice interactive computer science technical interview questions.',
  '/git': 'Git & GitHub Interactive Visualizer — Learn branch management, commits, merging, rebasing, and version control concepts.',
  '/git/sim': 'Git Visual Commit & Branch Graph Simulator — Execute git init, commit, branch, checkout, merge, rebase, and cherry-pick visually.',
  '/systemdesign': 'System Design & Architecture Visualizers — Load Balancing, Redis Caching, DB Scaling, Message Queues, and Microservices.',
  '/systemdesign/load-balancer': 'Load Balancer Simulator — Visualize Round Robin, Least Connections, IP Hash, and Weighted Round Robin load balancing algorithms.',
  '/systemdesign/cache-redis': 'Redis Caching Strategies Simulator — Cache-Aside, Write-Through, Write-Back, LRU, LFU, and TTL eviction policies visualizer.',
  '/systemdesign/db-scaling': 'Database Sharding & Replication Simulator — Primary-Replica replication, horizontal sharding, and consistent hashing.',
  '/systemdesign/message-queue': 'Message Queue Simulator — Visualize Publish-Subscribe, Kafka partitions, RabbitMQ exchanges, and asynchronous processing.',
  '/systemdesign/api-lifecycle': 'API Gateway & Lifecycle Simulator — Rate limiting, authentication, payload transformation, and routing visualization.',
  '/systemdesign/microservices': 'Microservices Communication Visualizer — Synchronous REST/gRPC vs Asynchronous Event-Driven microservice architectures.',
};

function setMetaTag(selector, attrName, attrValue, content) {
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonicalTag(url) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

function setJsonLdBreadcrumbs(pathname) {
  let script = document.getElementById('schema-breadcrumbs');
  if (!script) {
    script = document.createElement('script');
    script.id = 'schema-breadcrumbs';
    script.setAttribute('type', 'application/ld+json');
    document.head.appendChild(script);
  }

  const parts = pathname.split('/').filter(Boolean);
  const items = [{
    '@type': 'ListItem',
    position: 1,
    name: 'Home',
    item: 'https://www.coreconceptsstudio.site/'
  }];

  let currentPath = '';
  parts.forEach((part, index) => {
    currentPath += `/${part}`;
    const name = ROUTE_TITLES[currentPath]
      ? ROUTE_TITLES[currentPath].split('|')[0].split('—')[0].trim()
      : part.toUpperCase();
    items.push({
      '@type': 'ListItem',
      position: index + 2,
      name: name,
      item: `https://www.coreconceptsstudio.site${currentPath}`
    });
  });

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items
  };

  script.textContent = JSON.stringify(schemaData);
}

function SEOHandler() {
  const location = useLocation();

  useEffect(() => {
    const canonicalUrl = `https://www.coreconceptsstudio.site${location.pathname}`;
    const title = ROUTE_TITLES[location.pathname] || 'Core Concepts Studio — CS Simulators';
    const description = ROUTE_DESCRIPTIONS[location.pathname] || 
      'Core Concepts Studio (coreconceptstudio) is an interactive simulator platform for OS, DBMS, Networks, Git, System Design, and OOP design concepts.';

    // 1. Document Title
    document.title = title;

    // 2. Meta description
    setMetaTag('meta[name="description"]', 'name', 'description', description);

    // 3. Canonical Link
    setCanonicalTag(canonicalUrl);

    // 4. OpenGraph Meta Tags
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);

    // 5. Twitter Card Meta Tags
    setMetaTag('meta[property="twitter:title"]', 'property', 'twitter:title', title);
    setMetaTag('meta[property="twitter:description"]', 'property', 'twitter:description', description);
    setMetaTag('meta[property="twitter:url"]', 'property', 'twitter:url', canonicalUrl);

    // 6. Dynamic JSON-LD Breadcrumbs
    setJsonLdBreadcrumbs(location.pathname);
  }, [location.pathname]);

  return null;
}

function Footer() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  return (
    <footer className="footer">
      <div>
        <strong>Core Concepts Studio</strong>{' '}
        {!isHome && (
          <span style={{ opacity: 0.6 }}>
            — {Object.entries(MODULE_LABELS).find(([k]) => location.pathname.startsWith(k))?.[1] ?? ''}
          </span>
        )}
      </div>
      <div style={{ opacity: 0.6, fontSize: '0.78rem' }}>
        OS · DBMS · Networks · OOP · Git · System Design
      </div>
    </footer>
  );
}

function AppContent() {
  return (
    <>
      <SEOHandler />
      <Loader />
      <div className="page-wrapper">
        <Navbar />
        <Routes>
          {/* Home */}
          <Route path="/" element={<LandingPage />} />

          {/* OS Module */}
          <Route path="/os" element={<OSLanding />} />
          <Route path="/os/scheduling" element={<SimulationPage />} />
          <Route path="/os/scheduling/compare" element={<ComparisonPage />} />
          <Route path="/os/page-replacement" element={<PageReplacementSim />} />
          <Route path="/os/bankers" element={<BankersAlgorithmSim />} />
          <Route path="/os/disk" element={<DiskSchedulingSim />} />
          <Route path="/os/sync" element={<ProcessSyncSim />} />

          {/* DBMS Module */}
          <Route path="/dbms" element={<DBMSLanding />} />
          <Route path="/dbms/normalization" element={<NormalizationSim />} />
          <Route path="/dbms/joins" element={<SqlJoinsSim />} />
          <Route path="/dbms/transactions" element={<TransactionsSim />} />
          <Route path="/dbms/bplustree" element={<BPlusTreeSim />} />
          <Route path="/dbms/er-design" element={<ErDesignSim />} />
          <Route path="/dbms/sql-visualizer" element={<SqlQueryVisualizerSim />} />

          {/* Networks Module */}
          <Route path="/networks" element={<NetworksLanding />} />
          <Route path="/networks/osi" element={<OsiModelSim />} />
          <Route path="/networks/tcp-udp" element={<TcpUdpSim />} />
          <Route path="/networks/subnetting" element={<SubnettingSim />} />
          <Route path="/networks/routing" element={<RoutingAlgoSim />} />
          <Route path="/networks/http-dns" element={<HttpDnsSim />} />

          {/* OOP Module */}
          <Route path="/oops" element={<OOPSLanding />} />
          <Route path="/oops/pillars" element={<FourPillarsSim />} />
          <Route path="/oops/inheritance" element={<InheritanceDeepDiveSim />} />
          <Route path="/oops/abstract-interface" element={<AbstractInterfaceSim />} />
          <Route path="/oops/patterns" element={<DesignPatternsSim />} />
          <Route path="/oops/solid" element={<SolidPrinciplesSim />} />
          <Route path="/oops/uml" element={<UmlDiagramsSim />} />

          {/* Interview Module */}
          <Route path="/interview" element={<InterviewSim />} />

          {/* Git Module */}
          <Route path="/git" element={<GitLanding />} />
          <Route path="/git/sim" element={<GitSim />} />

          {/* System Design Module */}
          <Route path="/systemdesign" element={<SystemDesignLanding />} />
          <Route path="/systemdesign/load-balancer" element={<LoadBalancerSim />} />
          <Route path="/systemdesign/cache-redis" element={<CacheRedisSim />} />
          <Route path="/systemdesign/db-scaling" element={<DbScalingSim />} />
          <Route path="/systemdesign/message-queue" element={<MessageQueueSim />} />
          <Route path="/systemdesign/api-lifecycle" element={<ApiLifecycleSim />} />
          <Route path="/systemdesign/microservices" element={<MicroservicesSim />} />

          {/* Fallback */}
          <Route path="*" element={<LandingPage />} />
        </Routes>
        <Footer />
      </div>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}
