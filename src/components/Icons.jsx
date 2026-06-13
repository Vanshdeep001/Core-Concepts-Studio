/**
 * Icons.jsx — Centralized SVG icon library.
 * Replaces all emoji usage across the codebase with crisp, scalable vector icons.
 * Each icon is a functional component accepting `size` (default 20) and `color` (default 'currentColor').
 */

const d = { size: 20, color: 'currentColor' };
const S = (size, color, children) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
        {children}
    </svg>
);

// ─── MODULE ICONS (Landing pages, Navbar) ───

export const MonitorIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
</>);

export const DatabaseIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
</>);

export const GlobeIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
</>);

export const CubeIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
</>);

export const GitBranchIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <line x1="6" y1="3" x2="6" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
</>);

// ─── OS MODULE ICONS ───

export const GearIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
</>);

export const FileIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
</>);

export const ShieldIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
</>);

export const DiskIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="3" />
    <line x1="12" y1="9" x2="12" y2="2" />
</>);

export const SyncIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
    <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
</>);

// ─── DBMS MODULE ICONS ───

export const ChartIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
</>);

export const LinkIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
</>);

export const VaultIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="12" x2="15" y2="12" />
</>);

export const TreeIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <line x1="12" y1="22" x2="12" y2="12" />
    <path d="M12 12L6 6" />
    <path d="M12 12L18 6" />
    <circle cx="12" cy="4" r="2" />
    <circle cx="6" cy="4" r="2" />
    <circle cx="18" cy="4" r="2" />
    <circle cx="12" cy="12" r="2" />
</>);

export const BuildIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <rect x="2" y="18" width="20" height="4" rx="1" />
    <rect x="5" y="10" width="4" height="8" />
    <rect x="15" y="10" width="4" height="8" />
    <path d="M5 10L12 4L19 10" />
</>);

export const BlueprintIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
</>);

// ─── NETWORKS MODULE ICONS ───

export const BoxIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
</>);

export const HandshakeIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M20.5 11H16l-4 4-4-4H3.5" />
    <path d="M3.5 11V6.5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2V11" />
    <path d="M12 15v4" />
    <path d="M8 15l-2 4" />
    <path d="M16 15l2 4" />
</>);

export const HashIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="8" y2="21" />
    <line x1="16" y1="3" x2="14" y2="21" />
</>);

export const MapIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
</>);

export const WorldIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
</>);

// ─── OOP MODULE ICONS ───

export const PillarIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <rect x="3" y="2" width="18" height="3" rx="1" />
    <rect x="3" y="19" width="18" height="3" rx="1" />
    <rect x="5" y="5" width="3" height="14" />
    <rect x="10.5" y="5" width="3" height="14" />
    <rect x="16" y="5" width="3" height="14" />
</>);

export const RulerIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M1 22L22 1" />
    <path d="M5 18L8 15" />
    <path d="M9 14L12 11" />
    <path d="M13 10L16 7" />
    <polyline points="1 17 1 22 6 22" />
</>);

export const PuzzleIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M20 14V10a2 2 0 0 0-2-2h-2.3a1 1 0 0 1-.7-1.7l.9-.9a2 2 0 0 0-2.8-2.8l-.9.9A1 1 0 0 1 10.5 3V2a2 2 0 0 0-4 0v1a1 1 0 0 1-1.7.7l-.9-.9A2 2 0 0 0 1.1 5.6l.9.9A1 1 0 0 1 1.3 8H0" />
    <path d="M4 18V14h2.3a1 1 0 0 0 .7-1.7l-.9-.9a2 2 0 0 1 2.8-2.8l.9.9a1 1 0 0 0 1.7-.7V8h4v2a1 1 0 0 0 1.7.7l.9-.9a2 2 0 0 1 2.8 2.8l-.9.9a1 1 0 0 0 .7 1.7H22v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
</>);

// ─── STATUS & INDICATOR ICONS ───

export const CircleFilled = ({ size = 12, color = 'currentColor' } = {}) => (
    <svg width={size} height={size} viewBox="0 0 12 12" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
        <circle cx="6" cy="6" r="5" fill={color} stroke={color} strokeWidth="1" />
    </svg>
);

export const CheckIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <polyline points="20 6 9 17 4 12" />
</>);

export const XIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
</>);

export const AlertIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
</>);

export const TrendUpIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
</>);

// ─── CONTROL ICONS ───

export const PlayIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <polygon points="5 3 19 12 5 21 5 3" fill={color} />
</>);

export const PauseIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <rect x="6" y="4" width="4" height="16" fill={color} />
    <rect x="14" y="4" width="4" height="16" fill={color} />
</>);

export const SkipIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <polygon points="5 4 15 12 5 20 5 4" fill={color} />
    <line x1="19" y1="5" x2="19" y2="19" />
</>);

export const ResetIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
</>);

// ─── UTILITY ICONS ───

export const ClipboardIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" />
</>);

export const InboxIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
</>);

export const OutboxIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    <polyline points="12 2 12 8" />
    <polyline points="9 5 12 2 15 5" />
</>);

export const LightbulbIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5C8.35 12.26 8.82 13.02 9 14" />
</>);

export const FactoryIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M2 20h20" />
    <path d="M5 20V8l5 4V8l5 4V4h5v16" />
</>);

export const SunIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
</>);

export const MoonIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
</>);

export const LockIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
</>);

export const UnlockIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
</>);

export const KeyIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
</>);

export const WrenchIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
</>);

export const BlockIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
</>);

export const PlugIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M12 22v-5" />
    <path d="M9 8V2" />
    <path d="M15 8V2" />
    <path d="M18 8v5a6 6 0 0 1-12 0V8z" />
</>);

export const ShuffleIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
    <line x1="4" y1="4" x2="9" y2="9" />
</>);

export const ScissorsIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="20" y1="4" x2="8.12" y2="15.88" />
    <line x1="14.47" y1="14.48" x2="20" y2="20" />
    <line x1="8.12" y1="8.12" x2="12" y2="12" />
</>);

export const PlateIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <ellipse cx="12" cy="14" rx="10" ry="6" />
    <ellipse cx="12" cy="14" rx="6" ry="3" />
    <path d="M12 4v4" />
    <path d="M9 4h6" />
</>);

export const ClockIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
</>);

export const LaptopIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <line x1="2" y1="20" x2="22" y2="20" />
</>);

export const CoffeeIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
    <line x1="6" y1="1" x2="6" y2="4" />
    <line x1="10" y1="1" x2="10" y2="4" />
    <line x1="14" y1="1" x2="14" y2="4" />
</>);

export const FoodIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M12 2L8 10h8L12 2z" />
    <circle cx="12" cy="16" r="6" />
    <circle cx="12" cy="16" r="2" />
</>);

export const SleepIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    <path d="M14 9h3l-3 3h3" />
    <path d="M16 5h2l-2 2h2" />
</>);

export const EmailIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22 6 12 13 2 6" />
</>);

export const PhoneIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
</>);

export const BellIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
</>);

export const GamepadIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <line x1="6" y1="12" x2="10" y2="12" />
    <line x1="8" y1="10" x2="8" y2="14" />
    <line x1="15" y1="13" x2="15.01" y2="13" />
    <line x1="18" y1="11" x2="18.01" y2="11" />
    <rect x="2" y="6" width="20" height="12" rx="2" />
</>);

export const ScaleIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <line x1="12" y1="3" x2="12" y2="21" />
    <polyline points="3 9 12 3 21 9" />
    <path d="M3 9c0 3 4 6 4 6" />
    <path d="M21 9c0 3-4 6-4 6" />
</>);

export const HourglassIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M5 3h14" />
    <path d="M5 21h14" />
    <path d="M7 3v4l5 5-5 5v4" />
    <path d="M17 3v4l-5 5 5 5v4" />
</>);

export const RocketIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
</>);

export const SatelliteIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M13 7L9 3 3 9l4 4" />
    <path d="M11 15l4 4 6-6-4-4" />
    <path d="M8 12l-4 4" />
    <circle cx="19" cy="5" r="2" />
</>);

export const UFOIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <ellipse cx="12" cy="14" rx="10" ry="3" />
    <path d="M8 14c0-3 2-8 4-8s4 5 4 8" />
    <line x1="12" y1="17" x2="12" y2="20" />
    <line x1="8" y1="17" x2="7" y2="20" />
    <line x1="16" y1="17" x2="17" y2="20" />
</>);

export const SwirlIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M12 2a10 10 0 1 0 10 10" />
    <path d="M12 12a5 5 0 1 0 5-5" />
    <circle cx="12" cy="12" r="1" />
</>);

export const ExplosionIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <polygon points="12 2 15 8.5 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.5 12 2" />
</>);

export const StopIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <circle cx="12" cy="12" r="10" />
    <rect x="9" y="9" width="6" height="6" fill={color} />
</>);

export const SignalIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M2 20h.01" />
    <path d="M7 20v-4" />
    <path d="M12 20v-8" />
    <path d="M17 20V8" />
    <path d="M22 4v16" />
</>);

export const CrownIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M2 17l3-10 5 6 2-8 2 8 5-6 3 10z" />
    <path d="M2 17h20v3H2z" />
</>);

export const GiftIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
</>);

export const TargetIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
</>);

export const DiamondIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <rect x="5.5" y="5.5" width="13" height="13" rx="1" transform="rotate(45 12 12)" />
</>);

export const DogIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .137 1.217 1 2 2 2s1.5-.5 1.5-.5" />
    <path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.137 1.217-1 2-2 2s-1.5-.5-1.5-.5" />
    <path d="M8 14v.5" />
    <path d="M16 14v.5" />
    <path d="M11.25 16.25h1.5L12 17l-.75-.75z" />
    <circle cx="12" cy="12" r="8" />
</>);

export const BirdIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M16 7h.01" />
    <path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20" />
    <path d="M20 7l2 2-2 2" />
</>);

export const SendIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
</>);

export const TerminalIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
</>);

export const FlagIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
</>);

export const LayersIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
</>);

export const SearchIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
</>);

export const ActivityIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
</>);

export const UsersIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
</>);

export const DownloadIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
</>);

export const UploadIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
</>);

export const SaveIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
</>);

export const TagIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
</>);

export const NetworkIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <circle cx="12" cy="5" r="3" />
    <circle cx="5" cy="19" r="3" />
    <circle cx="19" cy="19" r="3" />
    <line x1="12" y1="8" x2="5" y2="16" />
    <line x1="12" y1="8" x2="19" y2="16" />
</>);

export const CpuIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="14" x2="4" y2="14" />
</>);

export const EyeIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
</>);

export const ZapIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
</>);

export const ColumnsIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18" />
</>);

export const InfoIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
</>);

// ─── SHAPE ICONS (for SOLID Principles sim) ───

export const CircleShape = ({ size = d.size, color = d.color } = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    </svg>
);

export const SquareShape = ({ size = d.size, color = d.color } = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <rect x="3" y="3" width="18" height="18" stroke={color} strokeWidth="2" />
    </svg>
);

export const RectShape = ({ size = d.size, color = d.color } = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <rect x="2" y="6" width="20" height="12" stroke={color} strokeWidth="2" />
    </svg>
);

export const TriangleShape = ({ size = d.size, color = d.color } = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <polygon points="12,3 22,21 2,21" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
);

export const PentagonShape = ({ size = d.size, color = d.color } = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <polygon points="12,2 22,9 19,21 5,21 2,9" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
);

export const HexagonShape = ({ size = d.size, color = d.color } = {}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
);

export const CodeIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
</>);

export const MicIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="8" y1="22" x2="16" y2="22" />
</>);

export const SpeakerIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
</>);

export const SpeakerOffIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
</>);

export const BookIcon = ({ size = d.size, color = d.color } = {}) => S(size, color, <>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
</>);

// Trigger HMR rebuild


