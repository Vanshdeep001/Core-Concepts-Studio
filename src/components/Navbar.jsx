import { NavLink, useLocation } from 'react-router-dom';
import { MonitorIcon, DatabaseIcon, GlobeIcon, CubeIcon, GitBranchIcon, LayersIcon } from './Icons';

const MODULE_LABELS = {
    '/os': { label: 'OS', icon: MonitorIcon, color: 'var(--yellow)' },
    '/dbms': { label: 'DBMS', icon: DatabaseIcon, color: 'var(--cyan)' },
    '/networks': { label: 'Networks', icon: GlobeIcon, color: 'var(--pink)' },
    '/oops': { label: 'OOP', icon: CubeIcon, color: 'var(--green)' },
    '/git': { label: 'Git', icon: GitBranchIcon, color: 'var(--green)' },
    '/systemdesign': { label: 'Sys Design', icon: LayersIcon, color: 'var(--green)' },
};

export default function Navbar() {
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
                        <span style={{
                            background: activeModule[1].color,
                            padding: '0.15rem 0.5rem',
                            border: '2px solid var(--border)',
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                        }}>
                            {activeModule[1].icon({ size: 14 })}
                            {activeModule[1].label}
                        </span>
                    </div>
                )}

                <div className="nav-right">
                    {/* Module shortcuts */}
                    <NavLink to="/os" className={({ isActive }) => `nav-link${location.pathname.startsWith('/os') ? ' active' : ''}`}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>{MonitorIcon({ size: 14 })} OS</span>
                    </NavLink>
                    <NavLink to="/dbms" className={({ isActive }) => `nav-link${location.pathname.startsWith('/dbms') ? ' active' : ''}`}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>{DatabaseIcon({ size: 14 })} DB</span>
                    </NavLink>
                    <NavLink to="/networks" className={({ isActive }) => `nav-link${location.pathname.startsWith('/networks') ? ' active' : ''}`}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>{GlobeIcon({ size: 14 })} Net</span>
                    </NavLink>
                    <NavLink to="/oops" className={({ isActive }) => `nav-link${location.pathname.startsWith('/oops') ? ' active' : ''}`}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>{CubeIcon({ size: 14 })} OOP</span>
                    </NavLink>
                    <NavLink to="/git" className={({ isActive }) => `nav-link${location.pathname.startsWith('/git') ? ' active' : ''}`}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>{GitBranchIcon({ size: 14 })} Git</span>
                    </NavLink>
                    <NavLink to="/systemdesign" className={({ isActive }) => `nav-link${location.pathname.startsWith('/systemdesign') ? ' active' : ''}`}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>{LayersIcon({ size: 14 })} SD</span>
                    </NavLink>
                </div>
            </div>
        </nav>
    );
}
