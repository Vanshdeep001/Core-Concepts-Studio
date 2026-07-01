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

function SEOHandler() {
  const location = useLocation();

  useEffect(() => {
    // 1. Update document title
    const title = ROUTE_TITLES[location.pathname] || 'Core Concepts Studio — CS Simulators';
    document.title = title;

    // 2. Dynamically update meta description with the keyword coreconceptstudio
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    
    let descriptionText = "Core Concepts Studio (coreconceptstudio) is an interactive simulator platform for OS, DBMS, Networks, Git, and OOP design concepts. Watch algorithms execute step-by-step.";
    if (location.pathname.startsWith('/os')) {
      descriptionText = "Learn CPU scheduling, Page replacement, Banker's algorithm, and Process synchronization on Core Concepts Studio (coreconceptstudio).";
    } else if (location.pathname.startsWith('/dbms')) {
      descriptionText = "Simulate SQL Joins, Database Normalization (1NF to BCNF), B+ Trees, and ER design on Core Concepts Studio (coreconceptstudio).";
    } else if (location.pathname.startsWith('/oops')) {
      descriptionText = "Master OOP concepts, SOLID principles, runtime dispatch, and design patterns visually on Core Concepts Studio (coreconceptstudio).";
    } else if (location.pathname.startsWith('/networks')) {
      descriptionText = "Visualize OSI layers, Subnetting, TCP/UDP handshakes, and routing protocols on Core Concepts Studio (coreconceptstudio).";
    } else if (location.pathname.startsWith('/systemdesign')) {
      descriptionText = "Simulate Load Balancers, Redis Caching, DB Sharding, and Kafka Message Queues on Core Concepts Studio (coreconceptstudio).";
    }

    metaDescription.setAttribute('content', descriptionText);
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
