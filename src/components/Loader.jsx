import { useEffect, useState } from 'react';

export default function Loader() {
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setHidden(true), 1400);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`loader-overlay${hidden ? ' hidden' : ''}`}>
            <div className="loader-shapes">
                {/* Code icon */}
                <div className="loader-shape">
                    <svg width="70" height="70" viewBox="0 0 100 100" fill="none">
                        <rect x="3" y="3" width="88" height="88" rx="8" fill="#66d9ef" stroke="#000" strokeWidth="4" />
                        <path d="M35 40 L20 50 L35 60" stroke="#000" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M65 40 L80 50 L65 60" stroke="#000" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="55" y1="35" x2="45" y2="65" stroke="#000" strokeWidth="5" strokeLinecap="round" />
                    </svg>
                </div>
                {/* Terminal icon */}
                <div className="loader-shape">
                    <svg width="70" height="70" viewBox="0 0 100 100" fill="none">
                        <rect x="3" y="3" width="88" height="88" rx="8" fill="#ffd93d" stroke="#000" strokeWidth="4" />
                        <path d="M25 35 L40 50 L25 65" stroke="#000" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="50" y1="65" x2="75" y2="65" stroke="#000" strokeWidth="5" strokeLinecap="round" />
                    </svg>
                </div>
                {/* Chip icon */}
                <div className="loader-shape">
                    <svg width="70" height="70" viewBox="0 0 100 100" fill="none">
                        <rect x="3" y="3" width="88" height="88" rx="8" fill="#a8e6cf" stroke="#000" strokeWidth="4" />
                        <rect x="20" y="20" width="60" height="60" rx="3" fill="#ffd93d" stroke="#000" strokeWidth="4" />
                        <rect x="30" y="20" width="40" height="20" fill="#66d9ef" stroke="#000" strokeWidth="3" />
                        <rect x="35" y="55" width="30" height="15" rx="2" fill="#000" />
                        <circle cx="50" cy="35" r="3" fill="#000" />
                    </svg>
                </div>
            </div>
            <div className="loader-letters">
                <div className="loader-letter">C</div>
                <div className="loader-letter">P</div>
            </div>
            <div className="loader-progress-bar">
                <div className="loader-progress-fill" />
            </div>
            <div style={{ position: 'relative', zIndex: 2, fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.2em', opacity: 0.7 }}>
                CPU SCHEDULING PLATFORM
            </div>
        </div>
    );
}
