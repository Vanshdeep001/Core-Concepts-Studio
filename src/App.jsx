import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Loader from './components/Loader';

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

// Networks Module
import NetworksLanding from './modules/networks/NetworksLanding';
import DistanceVectorSim from './modules/networks/DistanceVectorSim';
import LinkStateSim from './modules/networks/LinkStateSim';
import SlidingWindowSim from './modules/networks/SlidingWindowSim';

// OOP Module
import OOPSLanding from './modules/oops/OOPSLanding';
import MemoryLifecycleSim from './modules/oops/MemoryLifecycleSim';
import PolymorphismSim from './modules/oops/PolymorphismSim';
import ObserverPatternSim from './modules/oops/ObserverPatternSim';
import StringMutabilitySim from './modules/oops/StringMutabilitySim';
import ThreadVisualizer from './modules/oops/ThreadVisualizer';

// Git Module
import GitLanding from './modules/git/GitLanding';
import GitSim from './modules/git/GitSim';

const MODULE_LABELS = {
  '/os': '🖥 OS',
  '/dbms': '🗄 DBMS',
  '/networks': '🌐 Networks',
  '/oops': '🧱 OOP',
  '/git': '🌿 Git',
};

function Footer() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  return (
    <footer className="footer">
      <div>
        <strong>CS Simulator</strong>{' '}
        {!isHome && (
          <span style={{ opacity: 0.6 }}>
            — {Object.entries(MODULE_LABELS).find(([k]) => location.pathname.startsWith(k))?.[1] ?? ''}
          </span>
        )}
      </div>
      <div style={{ opacity: 0.6, fontSize: '0.78rem' }}>
        OS · DBMS · Networks · OOP · Git
      </div>
    </footer>
  );
}

function AppContent() {
  return (
    <>
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

          {/* Networks Module */}
          <Route path="/networks" element={<NetworksLanding />} />
          <Route path="/networks/distancevector" element={<DistanceVectorSim />} />
          <Route path="/networks/linkstate" element={<LinkStateSim />} />
          <Route path="/networks/slidingwindow" element={<SlidingWindowSim />} />

          {/* OOP Module */}
          <Route path="/oops" element={<OOPSLanding />} />
          <Route path="/oops/memory" element={<MemoryLifecycleSim />} />
          <Route path="/oops/polymorphism" element={<PolymorphismSim />} />
          <Route path="/oops/observer" element={<ObserverPatternSim />} />
          <Route path="/oops/strings" element={<StringMutabilitySim />} />
          <Route path="/oops/threads" element={<ThreadVisualizer />} />

          {/* Git Module */}
          <Route path="/git" element={<GitLanding />} />
          <Route path="/git/sim" element={<GitSim />} />

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
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}
