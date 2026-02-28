import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const MODULE_LABELS = {
    '/os': { label: '🖥 OS', color: 'var(--yellow)' },
    '/dbms': { label: '🗄 DBMS', color: 'var(--cyan)' },
    '/networks': { label: '🌐 Networks', color: 'var(--pink)' },
    '/oops': { label: '🧱 OOP', color: 'var(--green)' },
};

export default function Navbar() {
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();

    const activeModule = Object.entries(MODULE_LABELS).find(([k]) =>
        location.pathname !== '/' && location.pathname.startsWith(k)
    );

    return (
        <nav className="navbar">
            <div className="nav-content">
                {/* Brand */}
                <NavLink to="/" className="nav-brand">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="2.5" />
                        <rect x="7" y="7" width="10" height="10" rx="1" fill="currentColor" />
                    </svg>
                    <span>CS Simulator</span>
                </NavLink>

                {/* Module breadcrumb */}
                {activeModule && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        fontSize: '0.82rem', fontWeight: 700, opacity: 0.8,
                    }}>
                        <NavLink to="/" style={{ textDecoration: 'none', color: 'inherit', opacity: 0.6 }}>Home</NavLink>
                        <span>›</span>
                        <span style={{
                            background: activeModule[1].color,
                            padding: '0.15rem 0.5rem',
                            border: '2px solid var(--border)',
                            fontSize: '0.8rem',
                        }}>
                            {activeModule[1].label}
                        </span>
                    </div>
                )}

                <div className="nav-right">
                    {/* Module shortcuts */}
                    <NavLink to="/os" className={({ isActive }) => `nav-link${location.pathname.startsWith('/os') ? ' active' : ''}`}>🖥 OS</NavLink>
                    <NavLink to="/dbms" className={({ isActive }) => `nav-link${location.pathname.startsWith('/dbms') ? ' active' : ''}`}>🗄 DB</NavLink>
                    <NavLink to="/networks" className={({ isActive }) => `nav-link${location.pathname.startsWith('/networks') ? ' active' : ''}`}>🌐 Net</NavLink>
                    <NavLink to="/oops" className={({ isActive }) => `nav-link${location.pathname.startsWith('/oops') ? ' active' : ''}`}>🧱 OOP</NavLink>

                    <button className="nav-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
                        {theme === 'dark' ? '☀' : '🌙'}
                    </button>
                </div>
            </div>
        </nav>
    );
}
