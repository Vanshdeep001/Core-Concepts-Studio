import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UsersIcon, CheckIcon, XIcon, ClockIcon, PlayIcon, AlertIcon, LightbulbIcon, MicIcon, SpeakerIcon, SpeakerOffIcon, LinkIcon } from '../../components/Icons';
import { requestInterviewTurn } from './interviewApi';
import { getSimulation } from './simulationCatalog';
import { useVoice, ttsSupported, sttSupported } from './useVoice';
import { QUESTIONS_DATA } from './interviewQuestions';
import InterviewVisualizer from './InterviewVisualizations';
import { useTheme } from '../../context/ThemeContext';
import DsaWorkspace from './components/DsaWorkspace';
import SqlWorkspace from './components/SqlWorkspace';
import SystemDesignWorkspace from './components/SystemDesignWorkspace';

const ACCENT = 'var(--purple)';

const COMPANY_PROFILES = [
    { value: 'product', label: 'Product (Google / Microsoft / Flipkart)' },
    { value: 'service', label: 'Service (TCS / Infosys / Wipro)' },
    { value: 'startup', label: 'Startup' },
];

const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

function scoreColor(score) {
    if (score >= 0.75) return 'var(--green)';
    if (score >= 0.5) return 'var(--yellow)';
    return 'var(--pink)';
}

function ScoreBar({ score, height = 14 }) {
    const segments = [0.25, 0.5, 0.75, 1.0];
    return (
        <div style={{ display: 'flex', gap: 3 }}>
            {segments.map((s) => (
                <div
                    key={s}
                    style={{
                        flex: 1,
                        height,
                        border: '2px solid var(--border)',
                        background: score >= s - 0.001 ? scoreColor(score) : 'var(--white)',
                    }}
                />
            ))}
        </div>
    );
}

function Chip({ children, color = 'var(--white)' }) {
    return (
        <span
            style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                border: '2px solid var(--border)',
                background: color,
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
            }}
        >
            {children}
        </span>
    );
}

/* ======================== Chat Bubble ======================== */
function ChatBubble({ type, children, animate = true }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const isInterviewer = type === 'interviewer';
    const Wrapper = animate ? motion.div : 'div';
    const animProps = animate
        ? { initial: { opacity: 0, y: 12, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { duration: 0.3, ease: 'easeOut' } }
        : {};

    return (
        <Wrapper
            {...animProps}
            style={{
                display: 'flex',
                justifyContent: isInterviewer ? 'flex-start' : 'flex-end',
                marginBottom: '0.75rem',
            }}
        >
            <div
                style={{
                    maxWidth: '78%',
                    display: 'flex',
                    gap: '0.6rem',
                    flexDirection: isInterviewer ? 'row' : 'row-reverse',
                    alignItems: 'flex-start',
                }}
            >
                {/* Avatar */}
                <div
                    style={{
                        width: 36,
                        height: 36,
                        flexShrink: 0,
                        border: '3px solid var(--border)',
                        background: isInterviewer ? ACCENT : 'var(--cyan)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)',
                        boxShadow: 'var(--shadow-sm)',
                    }}
                >
                    {isInterviewer ? 'AI' : 'You'}
                </div>

                {/* Bubble */}
                <div
                    style={{
                        background: isInterviewer ? (isDark ? '#241c30' : '#f4ebff') : 'var(--cyan)',
                        border: '3px solid var(--border)',
                        boxShadow: 'var(--shadow-sm)',
                        padding: '0.75rem 1rem',
                        fontSize: '0.95rem',
                        lineHeight: 1.55,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: isInterviewer ? 'var(--text)' : '#000000',
                    }}
                >
                    {children}
                </div>
            </div>
        </Wrapper>
    );
}

/* ======================== Typing Indicator ======================== */
function TypingIndicator() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                display: 'flex',
                justifyContent: 'flex-start',
                marginBottom: '0.75rem',
            }}
        >
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <div
                    style={{
                        width: 36,
                        height: 36,
                        flexShrink: 0,
                        border: '3px solid var(--border)',
                        background: ACCENT,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        boxShadow: 'var(--shadow-sm)',
                    }}
                >
                    AI
                </div>
                <div
                    style={{
                        background: isDark ? '#241c30' : '#f4ebff',
                        border: '3px solid var(--border)',
                        boxShadow: 'var(--shadow-sm)',
                        padding: '0.7rem 1.2rem',
                        display: 'flex',
                        gap: '0.3rem',
                        alignItems: 'center',
                    }}
                >
                    {[0, 1, 2].map((i) => (
                        <motion.span
                            key={i}
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                            style={{
                                width: 8,
                                height: 8,
                                background: 'var(--border)',
                                borderRadius: '50%',
                                display: 'block',
                            }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

/* ======================== Voice Input Panel ======================== */
function VoiceInput({ value, onChange, onSend, loading, voice }) {
    const textareaRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }, [value]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (value.trim() && !loading) onSend();
        }
    };

    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div
            style={{
                borderTop: '3px solid var(--border)',
                background: isDark ? '#242424' : '#f5f6f8',
                padding: '0.75rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
            }}
        >
            {/* Top row: Mic + status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {/* Big mic button */}
                <button
                    onClick={voice.onMicToggle}
                    disabled={loading}
                    title={voice.listening ? 'Stop listening' : 'Tap to speak your answer'}
                    style={{
                        width: 52,
                        height: 52,
                        flexShrink: 0,
                        border: '3px solid var(--border)',
                        background: voice.listening ? 'var(--pink)' : ACCENT,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: voice.listening ? 'none' : 'var(--shadow-sm)',
                        animation: voice.listening ? 'pulse 1.2s ease-in-out infinite' : 'none',
                        transition: 'all 0.15s ease',
                        transform: voice.listening ? 'translate(2px, 2px)' : 'none',
                    }}
                >
                    {MicIcon({ size: 22 })}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                    {voice.listening ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>
                                Listening…
                            </span>
                            <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>
                                Say "submit answer" to send · "clear answer" to reset
                            </span>
                        </div>
                    ) : loading ? (
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', opacity: 0.5 }}>
                            Waiting for interviewer…
                        </span>
                    ) : (
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', opacity: 0.6 }}>
                            Tap the mic and speak your answer
                        </span>
                    )}
                </div>

                {/* Send button — appears when there's text */}
                {value.trim() && !loading && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={onSend}
                        title="Send answer"
                        style={{
                            width: 44,
                            height: 44,
                            flexShrink: 0,
                            border: '3px solid var(--border)',
                            background: 'var(--green)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'var(--shadow-sm)',
                            transition: 'all 0.15s ease',
                            fontSize: '1.2rem',
                            fontWeight: 700,
                        }}
                    >
                        ↑
                    </motion.button>
                )}
            </div>

            {/* Editable transcript — only visible when there's text or mic is on */}
            {(value || voice.listening) && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ duration: 0.2 }}
                >
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Your transcript will appear here… you can edit it before sending"
                        disabled={loading}
                        rows={1}
                        style={{
                            width: '100%',
                            border: voice.listening ? '3px solid var(--pink)' : '3px solid var(--border)',
                            background: isDark ? '#1e1e1e' : '#ffffff',
                            color: 'var(--text)',
                            fontFamily: 'var(--font-main)',
                            fontSize: '0.92rem',
                            padding: '0.55rem 0.75rem',
                            resize: 'none',
                            outline: 'none',
                            lineHeight: 1.5,
                            minHeight: 36,
                            maxHeight: 120,
                            overflow: 'auto',
                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)',
                            boxSizing: 'border-box',
                        }}
                    />
                    <div style={{ fontSize: '0.65rem', opacity: 0.4, marginTop: '0.15rem' }}>
                        You can edit this transcript before sending · Press Enter to send
                    </div>
                </motion.div>
            )}
        </div>
    );
}

/* ======================== Setup Screen ======================== */
function SetupScreen({ onStart, onBack, loading, error }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [companyProfile, setCompanyProfile] = useState('product');
    const [targetRole, setTargetRole] = useState('SDE-1');
    const [durationMin, setDurationMin] = useState(25);
    const [roundType, setRoundType] = useState('combined');

    return (
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
            {onBack && (
                <button
                    className="btn btn-sm"
                    onClick={onBack}
                    style={{ marginBottom: '1.25rem', background: 'var(--bg)', alignSelf: 'flex-start' }}
                >
                    ← Back to Selection
                </button>
            )}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div className="section-header">AI Mock Interview</div>
                <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 700, lineHeight: 1.15, marginBottom: '0.6rem' }}>
                    Technical{' '}
                    <span style={{ background: ACCENT, padding: '0 0.4rem', border: '3px solid var(--border)', display: 'inline-block', color: 'var(--white)' }}>
                        Interview
                    </span>{' '}
                    Simulator
                </h1>
                <p style={{ opacity: 0.6, fontSize: '0.95rem' }}>
                    A senior-engineer AI conducts a technical round — supporting CS Theory, DSA coding,
                    SQL query design, and interactive System Design whiteboards.
                </p>
            </div>

            <div className="panel" style={{ background: isDark ? '#231e30' : '#f5efff' }}>
                <div className="panel-header" style={{ background: ACCENT }}>
                    <strong>Set Up Your Round</strong>
                </div>
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label className="form-label">Round Type</label>
                        <select className="form-select" value={roundType} onChange={(e) => setRoundType(e.target.value)} style={{ width: '100%' }}>
                            <option value="combined">All-in-One Full Technical Interview (Theory → DSA → SQL → System Design)</option>
                            <option value="theory">CS Theory Round Only</option>
                            <option value="dsa">DSA Coding Round Only (with Mini-Editor)</option>
                            <option value="sql">SQL Query Round Only (with database tables)</option>
                            <option value="system_design">System Design Round Only (with Whiteboard)</option>
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Company Profile</label>
                        <select className="form-select" value={companyProfile} onChange={(e) => setCompanyProfile(e.target.value)} style={{ width: '100%' }}>
                            {COMPANY_PROFILES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Target Role</label>
                        <select className="form-select" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} style={{ width: '100%' }}>
                            <option>SDE-1</option>
                            <option>SDE Intern</option>
                            <option>Graduate Engineer Trainee</option>
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Duration</label>
                        <select className="form-select" value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} style={{ width: '100%' }}>
                            <option value={20}>20 minutes</option>
                            <option value={25}>25 minutes</option>
                            <option value={30}>30 minutes</option>
                        </select>
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}

                    <button
                        className="btn btn-lg"
                        style={{ background: ACCENT }}
                        onClick={() => onStart({ companyProfile, targetRole, durationMin, roundType })}
                        disabled={loading}
                    >
                        {loading ? 'Connecting to your interviewer…' : 'Start Interview →'}
                    </button>
                    {loading && (
                        <p style={{ fontSize: '0.78rem', opacity: 0.6, textAlign: 'center', margin: 0 }}>
                            Free-tier models can take up to a minute to respond — hang tight, the
                            interviewer is on the way. If one model is busy, we automatically try the next.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ======================== Summary — shown only at the end ======================== */
const GAP_STATUS = {
    correct: { color: 'var(--green)', label: 'GOT IT' },
    partial: { color: 'var(--yellow)', label: 'HALF RIGHT' },
    wrong:   { color: 'var(--pink)',  label: 'MISCONCEPTION' },
    missed:  { color: 'var(--orange)', label: 'MISSED' },
};

function FinalSummary({ turns, interviewState, onRestart }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const passed = (interviewState?.overall_score ?? 0) >= 0.6;
    const avgScore = turns.length
        ? turns.reduce((sum, t) => sum + (t.evaluation?.score ?? 0), 0) / turns.length
        : 0;

    const getScorePastel = (score, isDark) => {
        if (isDark) {
            if (score >= 0.75) return '#172f1e'; // Muted dark green
            if (score >= 0.5) return '#3d301b';  // Muted dark yellow/orange
            return '#3d1c24';                    // Muted dark pink
        } else {
            if (score >= 0.75) return '#f0faf4'; // Soft light green
            if (score >= 0.5) return '#fffdf0';  // Soft light yellow
            return '#fff5f7';                    // Soft light pink
        }
    };

    // Collect all simulation triggers across turns
    const simTriggers = turns
        .map((t) => t.trigger)
        .filter(Boolean)
        .reduce((acc, trigger) => {
            if (!acc.find((t) => t.simulation_id === trigger.simulation_id)) acc.push(trigger);
            return acc;
        }, []);

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Verdict banner */}
            <motion.div className="panel" style={{ background: passed ? (isDark ? '#1a3322' : '#f2faf5') : (isDark ? '#3d1c24' : '#fff5f7') }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div
                    className="panel-header"
                    style={{ background: passed ? 'var(--green)' : 'var(--pink)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#000000' }}
                >
                    {passed ? CheckIcon({ size: 18 }) : AlertIcon({ size: 18 })}
                    <strong>Interview Complete</strong>
                </div>
                <div style={{ padding: '1.25rem' }}>
                    <div className="stat-cards" style={{ marginBottom: '1rem' }}>
                        <div className="stat-card yellow">
                            <div className="stat-card-label" style={{ color: '#000000' }}>Overall Score</div>
                            <div className="stat-card-value" style={{ color: '#000000' }}>
                                {((interviewState?.overall_score ?? 0) * 100).toFixed(0)}
                                <span className="stat-card-unit">%</span>
                            </div>
                        </div>
                        <div className="stat-card cyan">
                            <div className="stat-card-label" style={{ color: '#000000' }}>Questions</div>
                            <div className="stat-card-value" style={{ color: '#000000' }}>{turns.length}</div>
                        </div>
                        <div className="stat-card orange">
                            <div className="stat-card-label" style={{ color: '#000000' }}>Avg. Score</div>
                            <div className="stat-card-value" style={{ color: '#000000' }}>
                                {(avgScore * 100).toFixed(0)}
                                <span className="stat-card-unit">%</span>
                            </div>
                        </div>
                        <div className="stat-card pink">
                            <div className="stat-card-label" style={{ color: '#000000' }}>Verdict</div>
                            <div className="stat-card-value" style={{ fontSize: '1.1rem', color: '#000000' }}>
                                {passed ? 'On Track' : 'Keep Practicing'}
                            </div>
                        </div>
                    </div>

                    {/* Topics covered */}
                    {interviewState?.topics_covered?.length > 0 && (
                        <div style={{ marginBottom: '0.75rem' }}>
                            <div className="form-label" style={{ marginBottom: 6 }}>Topics Covered</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {interviewState.topics_covered.map((t) => (
                                    <Chip key={t} color="var(--green)">{t}</Chip>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Per-question breakdown */}
            <motion.div className="panel" style={{ background: isDark ? '#231c30' : '#faf8ff' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="panel-header" style={{ background: ACCENT, color: '#000000' }}>
                    <strong>Question-by-Question Review</strong>
                </div>
                <div style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {turns.map((t, i) => (
                        <div
                            key={i}
                            style={{
                                border: '3px solid var(--border)',
                                boxShadow: 'var(--shadow-sm)',
                                background: getScorePastel(t.evaluation?.score ?? 0, isDark),
                            }}
                        >
                            {/* Question header */}
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.5rem 0.75rem',
                                    borderBottom: '2px solid var(--border)',
                                    background: scoreColor(t.evaluation?.score ?? 0),
                                }}
                            >
                                <strong style={{ fontSize: '0.85rem' }}>Q{i + 1}</strong>
                                <Chip color="var(--white)">
                                    {((t.evaluation?.score ?? 0) * 100).toFixed(0)}%
                                </Chip>
                            </div>

                            <div style={{ padding: '0.75rem', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                <div>
                                    <div className="form-label" style={{ margin: '0 0 2px', fontSize: '0.72rem' }}>Question</div>
                                    <div style={{ whiteSpace: 'pre-wrap' }}>{t.question}</div>
                                </div>
                                <div>
                                    <div className="form-label" style={{ margin: '0 0 2px', fontSize: '0.72rem' }}>Your Answer</div>
                                    <div style={{ opacity: 0.8, whiteSpace: 'pre-wrap' }}>{t.answer}</div>
                                </div>

                                {t.evaluation && (
                                    <>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                                            {t.evaluation.verdict}
                                        </div>
                                        {t.evaluation.what_was_right && (
                                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start', fontSize: '0.85rem' }}>
                                                <span style={{ flexShrink: 0, marginTop: 2 }}>{CheckIcon({ size: 14 })}</span>
                                                <span>{t.evaluation.what_was_right}</span>
                                            </div>
                                        )}
                                        {t.evaluation.what_was_wrong && (
                                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start', fontSize: '0.85rem' }}>
                                                <span style={{ flexShrink: 0, marginTop: 2 }}>{XIcon({ size: 14 })}</span>
                                                <span>{t.evaluation.what_was_wrong}</span>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Gap analysis points */}
                                {t.comparison?.key_points?.length > 0 && (
                                    <div style={{ borderTop: '2px solid var(--border)', paddingTop: '0.6rem' }}>
                                        <div className="form-label" style={{ marginBottom: 4, fontSize: '0.72rem' }}>
                                            Your Answer vs Reality — {Math.round((t.comparison.coverage ?? 0) * 100)}% covered
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                            {t.comparison.key_points.map((kp, j) => {
                                                const meta = GAP_STATUS[kp.status] ?? GAP_STATUS.partial;
                                                return (
                                                    <div
                                                        key={j}
                                                        style={{
                                                            display: 'flex',
                                                            gap: '0.5rem',
                                                            alignItems: 'center',
                                                            fontSize: '0.82rem',
                                                        }}
                                                    >
                                                        <Chip color={meta.color}>{meta.label}</Chip>
                                                        <span>
                                                            <strong>{kp.point}</strong>
                                                            {kp.reality && <> — {kp.reality}</>}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Simulation recommendations */}
            {simTriggers.length > 0 && (
                <motion.div className="panel" style={{ background: isDark ? '#16272c' : '#f0faff' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="panel-header" style={{ background: 'var(--cyan)', color: '#000000' }}>
                        {LightbulbIcon({ size: 18 })}
                        <strong>Recommended Simulations</strong>
                    </div>
                    <div style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: 0 }}>
                            Based on your answers, these simulations will help solidify the concepts:
                        </p>
                        {simTriggers.map((trigger, i) => {
                            const sim = getSimulation(trigger.simulation_id);
                            if (!sim) return null;
                            return (
                                <div
                                    key={i}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        flexWrap: 'wrap',
                                        padding: '0.6rem',
                                        border: '2px solid var(--border)',
                                        background: 'var(--white)',
                                    }}
                                >
                                    <span style={{ fontSize: '0.85rem', flex: 1, minWidth: 200 }}>
                                        {trigger.annotation}
                                    </span>
                                    <Link to={sim.path} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                        <span className="btn btn-sm btn-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                            {PlayIcon({ size: 13 })} {sim.label} →
                                        </span>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Restart */}
            <button className="btn btn-yellow btn-lg" onClick={onRestart} style={{ alignSelf: 'center' }}>
                ↺ Start Another Round
            </button>
        </div>
    );
}

/* ======================== Markdown Parser Helper ======================== */

// Staggered reveal choreography for answer blocks.
const answerContainerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.055, delayChildren: 0.05 } },
};
const answerBlockVariants = {
    hidden: { opacity: 0, y: 16, filter: 'blur(6px)' },
    show: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
};

// Inline formatting: **bold** and `code`.
function parseInline(text, accent) {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={idx} style={{ fontWeight: 800 }}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
            return (
                <code
                    key={idx}
                    style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.82em',
                        background: accent,
                        padding: '0.05em 0.35em',
                        border: '1.5px solid var(--border)',
                        borderRadius: 3,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {part.slice(1, -1)}
                </code>
            );
        }
        return part;
    });
}

function CodeBlock({ code, lang }) {
    return (
        <div style={{ border: '3px solid var(--border)', boxShadow: 'var(--shadow-sm)', margin: '0.6rem 0', overflow: 'hidden' }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                background: '#2d2d2d', padding: '0.35rem 0.7rem', borderBottom: '2px solid var(--border)'
            }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56', border: '1px solid #00000055' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e', border: '1px solid #00000055' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f', border: '1px solid #00000055' }} />
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, color: '#9aa0a6', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {lang || 'code'}
                </span>
            </div>
            <pre style={{
                background: '#1e1e1e', color: '#d4d4d4', padding: '0.85rem 1rem', margin: 0,
                overflowX: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.84rem', lineHeight: 1.5,
            }}>
                <code>{code}</code>
            </pre>
        </div>
    );
}

// Builds an array of answer blocks (React nodes) from markdown text.
function buildAnswerBlocks(text, accent) {
    const lines = text.split('\n');
    let inCode = false;
    let codeLines = [];
    let codeLang = '';
    const blocks = [];
    let tableRows = [];

    const flushTable = (key) => {
        if (!tableRows.length) return;
        const rows = tableRows;
        tableRows = [];
        blocks.push(
            <div key={`tbl-${key}`} style={{ border: '2.5px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', margin: '0.5rem 0' }}>
                {rows.map((cells, r) => (
                    <div key={r} style={{
                        display: 'flex',
                        background: r === 0 ? accent : (r % 2 === 0 ? 'var(--bg)' : 'transparent'),
                        borderBottom: r < rows.length - 1 ? '1.5px solid var(--border)' : 'none',
                        fontSize: '0.82rem', fontFamily: 'var(--font-mono)',
                    }}>
                        {cells.map((c, idx) => (
                            <div key={idx} style={{ flex: 1, padding: '0.45rem 0.7rem', fontWeight: r === 0 ? 800 : 500, borderRight: idx < cells.length - 1 ? '1.5px solid var(--border)' : 'none' }}>{c}</div>
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('```')) {
            if (inCode) {
                blocks.push(<CodeBlock key={`code-${i}`} code={codeLines.join('\n')} lang={codeLang} />);
                codeLines = [];
                inCode = false;
            } else {
                flushTable(i);
                inCode = true;
                codeLang = line.replace('```', '').trim();
            }
            continue;
        }
        if (inCode) { codeLines.push(line); continue; }

        if (line.startsWith('|')) {
            if (line.includes('---')) continue;
            tableRows.push(line.split('|').map(c => c.trim()).filter(Boolean));
            continue;
        }
        flushTable(i);

        if (line.startsWith('### ')) {
            blocks.push(
                <h3 key={i} style={{ fontSize: '1.18rem', fontWeight: 800, margin: '0.9rem 0 0.4rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <span style={{ width: 6, height: '1.1em', background: accent, border: '2px solid var(--border)', flexShrink: 0 }} />
                    {parseInline(line.substring(4), accent)}
                </h3>
            );
        } else if (line.startsWith('#### ')) {
            blocks.push(
                <h4 key={i} style={{ fontSize: '1rem', fontWeight: 800, margin: '0.7rem 0 0.3rem', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.03em', opacity: 0.9 }}>
                    {parseInline(line.substring(5), accent)}
                </h4>
            );
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
            blocks.push(
                <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', fontSize: '0.9rem', lineHeight: 1.55, margin: '0.18rem 0' }}>
                    <span style={{ width: 8, height: 8, marginTop: '0.45em', background: accent, border: '1.5px solid var(--border)', transform: 'rotate(45deg)', flexShrink: 0 }} />
                    <span>{parseInline(line.substring(2), accent)}</span>
                </div>
            );
        } else if (line.trim() === '') {
            // skip blank lines (gap handled by container)
        } else {
            blocks.push(
                <p key={i} style={{ fontSize: '0.9rem', lineHeight: 1.6, margin: '0.3rem 0', color: 'var(--text)' }}>
                    {parseInline(line, accent)}
                </p>
            );
        }
    }
    flushTable('end');
    if (inCode) blocks.push(<CodeBlock key="code-end" code={codeLines.join('\n')} lang={codeLang} />);
    return blocks;
}

// Animated answer renderer — each block reveals with a staggered blur-up.
function AnswerBody({ text, accent, animateKey }) {
    if (!text) return null;
    const blocks = buildAnswerBlocks(text, accent);
    return (
        <motion.div
            key={animateKey}
            variants={answerContainerVariants}
            initial="hidden"
            animate="show"
            style={{ display: 'flex', flexDirection: 'column' }}
        >
            {blocks.map((block, i) => (
                <motion.div key={i} variants={answerBlockVariants}>
                    {block}
                </motion.div>
            ))}
        </motion.div>
    );
}

function getPastelColor(catKey, isDark = false) {
    if (isDark) {
        switch (catKey) {
            case 'cpp': return '#1a273a';      // Muted dark blue
            case 'java': return '#2c2016';     // Muted dark brown/orange
            case 'python': return '#2a2a16';   // Muted dark yellow
            case 'puzzles': return '#221a2c';  // Muted dark lavender
            case 'linux': return '#17271e';    // Muted dark forest green
            case 'sql': return '#16272c';      // Muted dark cyan
            default: return 'var(--white)';
        }
    } else {
        switch (catKey) {
            case 'cpp': return '#f0f7ff';      // Soft pastel blue
            case 'java': return '#fff8f2';     // Soft pastel orange
            case 'python': return '#fffff0';   // Soft pastel yellow
            case 'puzzles': return '#faf5ff';  // Soft pastel lavender
            case 'linux': return '#f2faf5';    // Soft pastel mint green
            case 'sql': return '#f0faff';      // Soft pastel cyan
            default: return 'var(--white)';
        }
    }
}

// A slightly deeper, category-tinted surface for header/toolbar layering.
// Keeps everything in the same hue family so warm panes never clash with cool chrome.
function getTintColor(catKey, isDark = false) {
    if (isDark) {
        switch (catKey) {
            case 'cpp': return '#11203a';
            case 'java': return '#2e1d0f';
            case 'python': return '#2c2c0f';
            case 'puzzles': return '#1f1430';
            case 'linux': return '#0f2419';
            case 'sql': return '#0f2630';
            default: return '#222222';
        }
    }
    switch (catKey) {
        case 'cpp': return '#e3effb';
        case 'java': return '#fdeede';
        case 'python': return '#fbfbd8';
        case 'puzzles': return '#f1e7fb';
        case 'linux': return '#e3f4ea';
        case 'sql': return '#e0f2fb';
        default: return '#f2f2f2';
    }
}

/* ======================== Main Component ======================== */
export default function InterviewSim() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [phase, setPhase] = useState('landing'); // landing | setup | active | finished | explorer
    const [config, setConfig] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('cpp');
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [explorerTab, setExplorerTab] = useState('explanation'); // explanation | visual
    const [copiedId, setCopiedId] = useState(null);
    const [hoveredCardId, setHoveredCardId] = useState(null);
    const [hoveredSidebarId, setHoveredSidebarId] = useState(null);
    const [hoveredPath, setHoveredPath] = useState(null);
    const [readQuestions, setReadQuestions] = useState(() => {
        try {
            const stored = localStorage.getItem('oslizer_interview_read');
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            return new Set();
        }
    });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get('mode');
        const category = params.get('category');
        const q = params.get('q');
        if (mode === 'explorer') {
            setPhase('explorer');
            if (category && QUESTIONS_DATA[category]) {
                setSelectedCategory(category);
                const questionExists = QUESTIONS_DATA[category].questions.find(item => item.id === q);
                if (questionExists) {
                    setSelectedQuestion(questionExists);
                }
            }
        }
    }, []);

    const toggleRead = (qId) => {
        const next = new Set(readQuestions);
        if (next.has(qId)) {
            next.delete(qId);
        } else {
            next.add(qId);
        }
        setReadQuestions(next);
        localStorage.setItem('oslizer_interview_read', JSON.stringify(Array.from(next)));
    };

    const getCategoryProgress = (catKey) => {
        const qList = QUESTIONS_DATA[catKey].questions;
        const readCount = qList.filter(q => readQuestions.has(q.id)).length;
        return {
            readCount,
            total: qList.length,
            pct: Math.round((readCount / qList.length) * 100)
        };
    };

    const handleShareQuestion = (catKey, qId) => {
        const url = `${window.location.origin}${window.location.pathname}?mode=explorer&category=${catKey}&q=${qId}`;
        navigator.clipboard.writeText(url);
        setCopiedId(qId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleBackToLanding = () => {
        setPhase('landing');
        setSelectedQuestion(null);
        window.history.replaceState({}, document.title, window.location.pathname);
    };
    // Starting topic pools for randomization
    const THEORY_STARTING_TOPICS = [
        'OS — Process Management and threads',
        'OS — Memory Management, virtual memory and paging',
        'DBMS — ACID properties and transactions',
        'DBMS — Database indexing using B/B+ trees',
        'Networks — OSI Model layers and encapsulation',
        'Networks — TCP three-way handshake vs UDP routing',
        'OOP — Encapsulation, Polymorphism, Abstraction, and Inheritance'
    ];

    const DSA_STARTING_TOPICS = [
        'DSA — Array manipulation and Two-pointer search strategy',
        'DSA — String anagram checking and hashmap optimization',
        'DSA — Linked List cycle detection using fast/slow pointers',
        'DSA — Stack design for balanced parenthesis validity checking',
        'DSA — Basic recursion and calculating Fibonacci series'
    ];

    const SQL_STARTING_TOPICS = [
        'SQL — Querying records using INNER/LEFT JOIN and aggregations',
        'SQL — Filtering joined records with WHERE vs HAVING groups',
        'SQL — Standard subqueries and table expressions',
        'SQL — Sorting results and paging records using LIMIT clauses'
    ];

    const SD_STARTING_TOPICS = [
        'System Design — Vertical vs Horizontal scaling and Load Balancer setups',
        'System Design — Memory caching layers and Redis setup',
        'System Design — Database partitioning and read-replicas',
        'System Design — Event-driven pipelines using Message Queues (Kafka)'
    ];

    const [messages, setMessages] = useState([]);   // { type: 'interviewer'|'student', text }
    const [turnData, setTurnData] = useState([]);    // accumulated turn results for summary
    const [latestTurn, setLatestTurn] = useState(null);
    const [answer, setAnswer] = useState('');
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [elapsed, setElapsed] = useState(0);
    const [ttsOn, setTtsOn] = useState(true);
    const startRef = useRef(null);
    const chatEndRef = useRef(null);

    // Workspace States
    const [dsaCode, setDsaCode] = useState('');
    const [dsaLanguage, setDsaLanguage] = useState('javascript');
    const [sqlQuery, setSqlQuery] = useState('');
    const [diagram, setDiagram] = useState({ nodes: [], connections: [] });

    const pendingAnswerRef = useRef('');
    const submitRef = useRef(() => {});
    const speakCurrentRef = useRef(() => {});

    const updateAnswer = (value) => {
        pendingAnswerRef.current = value;
        setAnswer(value);
    };

    const voice = useVoice({
        onTranscript: (text) => {
            const prev = pendingAnswerRef.current;
            updateAnswer((prev ? prev.trimEnd() + ' ' : '') + text);
        },
        onCommand: (cmd) => {
            if (cmd === 'submit') submitRef.current();
            else if (cmd === 'repeat') speakCurrentRef.current();
            else if (cmd === 'clear') updateAnswer('');
        },
    });
    const voiceRef = useRef(voice);
    voiceRef.current = voice;

    const totalSeconds = (config?.durationMin ?? 25) * 60;

    // Timer
    useEffect(() => {
        if (phase !== 'active') return;
        const id = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
        }, 1000);
        return () => clearInterval(id);
    }, [phase]);

    // Auto-scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // TTS for interviewer
    speakCurrentRef.current = () => {
        if (!ttsOn || !ttsSupported || !latestTurn) return;
        const parts = [latestTurn.answer_evaluation?.interviewer_reaction, latestTurn.next_move?.question]
            .filter(Boolean)
            .join(' … ');
        voiceRef.current.speak(parts);
    };

    useEffect(() => {
        if (!latestTurn) return;
        voiceRef.current.stopListening();
        speakCurrentRef.current();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [latestTurn]);

    const toggleTts = () => {
        setTtsOn((on) => {
            if (on) voiceRef.current.stopSpeaking();
            return !on;
        });
    };

    const buildSession = (cfg, elapsedSeconds, startTopic) => ({
        round_number: 1,
        company_profile: cfg.companyProfile,
        target_role: cfg.targetRole,
        round_type: cfg.roundType || 'theory',
        starting_topic: startTopic || cfg.startingTopic || null,
        time_elapsed_seconds: elapsedSeconds,
        total_time_seconds: cfg.durationMin * 60,
    });

    const startInterview = async (cfg) => {
        setLoading(true);
        setError(null);

        let startTopic = '';
        if (cfg.roundType === 'dsa') {
            startTopic = DSA_STARTING_TOPICS[Math.floor(Math.random() * DSA_STARTING_TOPICS.length)];
        } else if (cfg.roundType === 'sql') {
            startTopic = SQL_STARTING_TOPICS[Math.floor(Math.random() * SQL_STARTING_TOPICS.length)];
        } else if (cfg.roundType === 'system_design') {
            startTopic = SD_STARTING_TOPICS[Math.floor(Math.random() * SD_STARTING_TOPICS.length)];
        } else {
            startTopic = THEORY_STARTING_TOPICS[Math.floor(Math.random() * THEORY_STARTING_TOPICS.length)];
        }

        const configWithTopic = { ...cfg, startingTopic: startTopic };

        try {
            const result = await requestInterviewTurn({
                session: buildSession(configWithTopic, 0, startTopic),
                history: [],
                currentQuestion: null,
                currentAnswer: null,
            });
            setConfig(configWithTopic);
            setLatestTurn(result);
            setCurrentQuestion(result.next_move.question);
            setMessages([{ type: 'interviewer', text: result.next_move.question }]);
            setHistory([]);
            setTurnData([]);
            updateAnswer('');
            setDsaCode('');
            setSqlQuery('');
            setDiagram({ nodes: [], connections: [] });
            startRef.current = Date.now();
            setElapsed(0);
            setPhase('active');
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const submitAnswer = async () => {
        const answerText = pendingAnswerRef.current;
        const activeWorkspace = latestTurn?.next_move?.active_workspace || config?.roundType || 'theory';
        const hasWorkspaceContent = (activeWorkspace === 'dsa' && dsaCode.trim()) ||
                                    (activeWorkspace === 'sql' && sqlQuery.trim()) ||
                                    (activeWorkspace === 'system_design' && diagram?.nodes?.length > 0);

        if (!answerText.trim() && !hasWorkspaceContent || loading) return;
        voiceRef.current.stopListening();
        voiceRef.current.stopSpeaking();

        // Construct visually formatted student answer for chat display
        let chatDisplayAnswer = answerText;
        if (activeWorkspace === 'dsa') {
            chatDisplayAnswer = (answerText ? answerText + '\n\n' : '') + `\`\`\`${dsaLanguage}\n${dsaCode}\n\`\`\``;
        } else if (activeWorkspace === 'sql') {
            chatDisplayAnswer = (answerText ? answerText + '\n\n' : '') + `\`\`\`sql\n${sqlQuery}\n\`\`\``;
        } else if (activeWorkspace === 'system_design') {
            const comps = diagram?.nodes?.map(n => n.label).join(', ') || 'none';
            chatDisplayAnswer = (answerText ? answerText + '\n\n' : '') + `[Whiteboard Diagram components placed: ${comps}]`;
        }

        // Add student message to chat
        setMessages((prev) => [...prev, { type: 'student', text: chatDisplayAnswer }]);
        setLoading(true);
        setError(null);

        const apiPayloadAnswer = answerText.trim() || "[Student submitted workspace changes]";

        try {
            const result = await requestInterviewTurn({
                session: buildSession(config, elapsed),
                history,
                currentQuestion,
                currentAnswer: apiPayloadAnswer,
                currentCode: activeWorkspace === 'dsa' ? dsaCode : null,
                currentLanguage: activeWorkspace === 'dsa' ? dsaLanguage : null,
                currentQuery: activeWorkspace === 'sql' ? sqlQuery : null,
                currentDiagram: activeWorkspace === 'system_design' ? diagram : null,
            });

            // Store for history
            setHistory((h) => [
                ...h,
                {
                    question: currentQuestion,
                    student_answer: apiPayloadAnswer,
                    score: result.answer_evaluation?.score ?? 0,
                    simulation_triggered: result.simulation_trigger?.simulation_id ?? null,
                },
            ]);

            // Store full turn data for the final summary
            setTurnData((prev) => [
                ...prev,
                {
                    question: currentQuestion,
                    answer: apiPayloadAnswer,
                    evaluation: result.answer_evaluation,
                    comparison: result.answer_comparison,
                    trigger: result.simulation_trigger,
                    feedback: result.feedback_for_student,
                },
            ]);

            // Build the interviewer's response message.
            // Guard: if the model returns the same question we just asked
            // (free-tier models sometimes do this), skip the duplicate.
            const reaction = result.answer_evaluation?.interviewer_reaction;
            const nextQ = result.next_move?.question;
            const isDuplicate = nextQ && currentQuestion &&
                nextQ.trim().toLowerCase() === currentQuestion.trim().toLowerCase();

            let interviewerMsg = '';
            if (reaction) interviewerMsg += reaction;
            if (nextQ && !isDuplicate) {
                if (interviewerMsg) interviewerMsg += '\n\n';
                interviewerMsg += nextQ;
            }

            // If we got nothing useful (model fully repeated itself), show a fallback
            if (!interviewerMsg.trim()) {
                interviewerMsg = "Alright, let's move on. Can you tell me more about that?";
            }

            setMessages((prev) => [...prev, { type: 'interviewer', text: interviewerMsg }]);
            setLatestTurn(result);
            // If duplicate, keep the old question for the next round
            if (!isDuplicate && nextQ) {
                setCurrentQuestion(nextQ);
            }
            updateAnswer('');

            if (result.next_move.type === 'wrap_up') {
                setPhase('finished');
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };
    submitRef.current = submitAnswer;

    const handleRestart = () => {
        setPhase('setup');
        setMessages([]);
        setTurnData([]);
        setLatestTurn(null);
        setHistory([]);
        updateAnswer('');
        setDsaCode('');
        setSqlQuery('');
        setDiagram({ nodes: [], connections: [] });
    };

    const endInterview = () => {
        voiceRef.current.stopListening();
        voiceRef.current.stopSpeaking();
        setPhase('finished');
    };

    /* ---- Render: Setup ---- */
    if (phase === 'setup') {
        return (
            <div className="main-content">
                <SetupScreen
                    onStart={startInterview}
                    onBack={() => setPhase('landing')}
                    loading={loading}
                    error={error}
                />
            </div>
        );
    }

    /* ---- Render: Summary ---- */
    if (phase === 'finished') {
        return (
            <div className="main-content">
                <FinalSummary
                    turns={turnData}
                    interviewState={latestTurn?.interview_state}
                    onRestart={handleRestart}
                />
            </div>
        );
    }

    /* ---- Render: Landing ---- */
    if (phase === 'landing') {
        const isMockHovered = hoveredPath === 'mock';
        const isExplorerHovered = hoveredPath === 'explorer';

        return (
            <div className="main-content" style={{ padding: '2rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div className="section-header">Interview Arena</div>
                    <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 700, lineHeight: 1.15, marginBottom: '0.8rem' }}>
                        Choose Your{' '}
                        <span style={{ background: ACCENT, padding: '0 0.4rem', border: '3px solid var(--border)', display: 'inline-block', color: 'var(--white)' }}>
                            Interview Path
                        </span>
                    </h1>
                    <p style={{ opacity: 0.7, fontSize: '1rem', maxWidth: 600, margin: '0 auto' }}>
                        Simulate a live adaptive AI interview on core computer science subjects, or explore interactive cheat sheets for the most asked recruitment questions.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                    {/* Path 1: AI Interview Simulator */}
                    <div 
                        className="panel" 
                        onMouseEnter={() => setHoveredPath('mock')}
                        onMouseLeave={() => setHoveredPath(null)}
                        style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            height: '100%', 
                            transform: isMockHovered ? 'scale(1.01) rotate(-0.5deg)' : 'rotate(-0.5deg)', 
                            boxShadow: isMockHovered ? 'var(--shadow-lg)' : 'var(--shadow)',
                            background: isMockHovered ? (isDark ? '#261b36' : '#f7f2fe') : (isDark ? '#1e1927' : '#faf6ff'),
                            transition: 'all 0.15s ease-in-out'
                        }}
                    >
                        <div className="panel-header" style={{ background: 'var(--purple)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#000000' }}>
                            <strong>Give AI Mock Interview</strong>
                        </div>
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                            <p style={{ fontSize: '0.92rem', opacity: 0.8, lineHeight: 1.5, margin: 0 }}>
                                A senior-engineer AI interviewer will ask you questions on Operating Systems, DBMS, Networks, and Object-Oriented Programming, adapting difficulty dynamically based on your replies.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '0.5rem 0' }}>
                                <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', fontSize: '0.82rem' }}>
                                    <CheckIcon size={12} color="var(--green)" /> Real-time speech and text mode
                                </div>
                                <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', fontSize: '0.82rem' }}>
                                    <CheckIcon size={12} color="var(--green)" /> AI evaluation and model answers comparison
                                </div>
                                <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', fontSize: '0.82rem' }}>
                                    <CheckIcon size={12} color="var(--green)" /> Detailed Gap analysis reports
                                </div>
                            </div>
                            <button
                                className="btn btn-lg"
                                style={{ background: isMockHovered ? 'var(--purple)' : 'var(--white)', color: isMockHovered ? '#000000' : 'var(--text)', marginTop: 'auto', width: '100%', transition: 'all 0.15s ease' }}
                                onClick={() => setPhase('setup')}
                            >
                                Start Simulator →
                            </button>
                        </div>
                    </div>

                    {/* Path 2: Question Explorer */}
                    <div 
                        className="panel" 
                        onMouseEnter={() => setHoveredPath('explorer')}
                        onMouseLeave={() => setHoveredPath(null)}
                        style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            height: '100%', 
                            transform: isExplorerHovered ? 'scale(1.01) rotate(0.5deg)' : 'rotate(0.5deg)', 
                            boxShadow: isExplorerHovered ? 'var(--shadow-lg)' : 'var(--shadow)',
                            background: isExplorerHovered ? (isDark ? '#2e2c1c' : '#fffdf0') : (isDark ? '#222118' : '#fffef9'),
                            transition: 'all 0.15s ease-in-out'
                        }}
                    >
                        <div className="panel-header" style={{ background: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#000000' }}>
                            <strong>Most Asked Interview Questions</strong>
                        </div>
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                            <p style={{ fontSize: '0.92rem', opacity: 0.8, lineHeight: 1.5, margin: 0 }}>
                                Explore curated lists of the top must-asked technical interview questions outside of core theory, complete with explanations, video resources, and visual sketches.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '0.5rem 0' }}>
                                <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', fontSize: '0.82rem' }}>
                                    <CheckIcon size={12} color="var(--green)" /> 100+ questions in C++, Java, Python, SQL, Git & Linux
                                </div>
                                <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', fontSize: '0.82rem' }}>
                                    <CheckIcon size={12} color="var(--green)" /> Interactive custom visualizers & diagrams
                                </div>
                                <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', fontSize: '0.82rem' }}>
                                    <CheckIcon size={12} color="var(--green)" /> Structured playlists & reference documentation
                                </div>
                            </div>
                            <button
                                className="btn btn-lg"
                                style={{ background: isExplorerHovered ? 'var(--yellow)' : 'var(--white)', color: 'var(--text)', marginTop: 'auto', width: '100%', transition: 'all 0.15s ease' }}
                                onClick={() => setPhase('explorer')}
                            >
                                Explore Questions →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ---- Render: Questions Explorer ---- */
    if (phase === 'explorer') {
        const catData = QUESTIONS_DATA[selectedCategory];
        const categoryQuestions = catData ? catData.questions : [];
        const filteredQuestions = categoryQuestions.filter(q =>
            q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.ans.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const allCatsKeys = Object.keys(QUESTIONS_DATA);
        const totalQuestionsCount = allCatsKeys.reduce((sum, key) => sum + QUESTIONS_DATA[key].questions.length, 0);
        const readQuestionsCount = Array.from(readQuestions).length;
        const totalProgressPct = totalQuestionsCount ? Math.round((readQuestionsCount / totalQuestionsCount) * 100) : 0;

        const accent = catData ? catData.accentColor : 'var(--purple)';
        const pane = getPastelColor(selectedCategory, isDark);
        const tint = getTintColor(selectedCategory, isDark);
        const surface = isDark ? '#1f1f1f' : '#ffffff';

        const gridContainer = { hidden: {}, show: { transition: { staggerChildren: 0.035, delayChildren: 0.04 } } };
        const gridItem = {
            hidden: { opacity: 0, y: 22, scale: 0.96 },
            show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
        };

        return (
            <div className="main-content" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', background: 'var(--bg)' }}>
                {/* Top Horizontal Category Tabs */}
                <div
                    className="hide-scrollbar"
                    style={{
                        display: 'flex',
                        gap: '0.5rem',
                        overflowX: 'auto',
                        padding: '0.7rem 1rem',
                        background: isDark ? '#1c1c1c' : '#eef0f3',
                        borderBottom: '3px solid var(--border)',
                        flexShrink: 0
                    }}
                >
                    <motion.button
                        onClick={handleBackToLanding}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.45rem 0.7rem',
                            border: '2.5px solid var(--border)',
                            background: 'var(--white)',
                            color: 'var(--text)',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            boxShadow: '3px 3px 0 var(--border)',
                            marginRight: '0.5rem',
                            flexShrink: 0
                        }}
                    >
                        ← Back
                    </motion.button>
                    {allCatsKeys.map((key) => {
                        const cat = QUESTIONS_DATA[key];
                        const prog = getCategoryProgress(key);
                        const isActive = selectedCategory === key;
                        return (
                            <motion.button
                                key={key}
                                onClick={() => {
                                    setSelectedCategory(key);
                                    setSelectedQuestion(null);
                                }}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.96 }}
                                style={{
                                    padding: '0.45rem 0.7rem',
                                    border: '2.5px solid var(--border)',
                                    background: isActive ? cat.accentColor : (isDark ? '#2a2a2a' : '#ffffff'),
                                    color: 'var(--text)',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    boxShadow: isActive ? 'none' : '3px 3px 0px var(--border)',
                                    transform: isActive ? 'translate(2px, 2px)' : 'none',
                                    transition: 'background 0.15s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.55rem',
                                    flexShrink: 0
                                }}
                            >
                                <span style={{
                                    fontWeight: 800, fontSize: '0.62rem', fontFamily: 'var(--font-mono)',
                                    padding: '0.15rem 0.3rem', border: '1.5px solid var(--border)',
                                    background: isActive ? 'var(--white)' : cat.accentColor, color: '#000000'
                                }}>{cat.icon}</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{cat.title.split(' ')[0]}</span>
                                        <span style={{ fontSize: '0.64rem', fontWeight: 800, opacity: 0.65, fontFamily: 'var(--font-mono)' }}>{prog.pct}%</span>
                                    </div>
                                    <div style={{ width: 90, height: 5, border: '1.5px solid var(--border)', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
                                        <div style={{ width: `${prog.pct}%`, height: '100%', background: 'var(--green)', transition: 'width 0.4s ease' }} />
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Main Content Area */}
                {!selectedQuestion ? (
                    /* Phase A: Directory View */
                    <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', padding: '1.5rem' }}>
                        <div style={{ maxWidth: 1040, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Category Banner Card */}
                            <motion.div
                                key={selectedCategory}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, ease: 'easeOut' }}
                                style={{ border: '3px solid var(--border)', boxShadow: 'var(--shadow)', background: pane, position: 'relative', overflow: 'hidden' }}
                            >
                                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 10, background: accent, borderRight: '3px solid var(--border)' }} />
                                <div style={{ padding: '1.25rem 1.5rem 1.25rem 2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.7rem', padding: '0.2rem 0.45rem', border: '2px solid var(--border)', background: accent, color: '#000000' }}>{catData?.icon}</span>
                                        <strong style={{ fontSize: '1.15rem', fontWeight: 800 }}>{catData?.title}</strong>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.55, opacity: 0.85 }}>{catData?.description}</p>

                                    {catData?.resources?.length > 0 && (
                                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.55, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
                                                Recommended Playlists &amp; References
                                            </span>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {catData.resources.map((res, i) => (
                                                    <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                                        <span className="btn btn-sm btn-cyan" style={{ fontSize: '0.72rem', padding: '0.3rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#000000' }}>
                                                            {PlayIcon({ size: 11 })} {res.name}
                                                        </span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Search bar section */}
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                                    <span style={{ position: 'absolute', left: '0.85rem', fontSize: '0.95rem', opacity: 0.45, pointerEvents: 'none' }}>⌕</span>
                                    <input
                                        type="text"
                                        placeholder="Search questions by keyword or topic..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{
                                            width: '100%',
                                            border: '3px solid var(--border)',
                                            background: surface,
                                            color: 'var(--text)',
                                            fontFamily: 'var(--font-main)',
                                            fontSize: '0.9rem',
                                            padding: '0.65rem 1rem 0.65rem 2.2rem',
                                            outline: 'none',
                                            boxShadow: 'var(--shadow-sm)'
                                        }}
                                    />
                                </div>
                                {searchQuery && (
                                    <button className="btn" style={{ padding: '0.65rem 1rem' }} onClick={() => setSearchQuery('')}>
                                        Clear
                                    </button>
                                )}
                            </div>

                            {/* Grid of Question Cards */}
                            {filteredQuestions.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.6, fontStyle: 'italic' }}>
                                    No questions match your search.
                                </div>
                            ) : (
                                <motion.div
                                    key={selectedCategory + '-grid'}
                                    variants={gridContainer}
                                    initial="hidden"
                                    animate="show"
                                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1rem' }}
                                >
                                    {filteredQuestions.map((item) => {
                                        const isRead = readQuestions.has(item.id);
                                        const isHovered = hoveredCardId === item.id;
                                        return (
                                            <motion.div
                                                key={item.id}
                                                variants={gridItem}
                                                whileHover={{ y: -5, x: -3 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => {
                                                    setSelectedQuestion(item);
                                                    setExplorerTab('explanation');
                                                }}
                                                onMouseEnter={() => setHoveredCardId(item.id)}
                                                onMouseLeave={() => setHoveredCardId(null)}
                                                style={{
                                                    padding: '1rem 1rem 0.75rem',
                                                    border: '3px solid var(--border)',
                                                    background: isRead ? (isDark ? '#1d241d' : '#f3fbf3') : surface,
                                                    boxShadow: isHovered ? 'var(--shadow-lg)' : 'var(--shadow)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.75rem',
                                                    justifyContent: 'space-between',
                                                    position: 'relative',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: accent }} />
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginTop: '0.3rem' }}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleRead(item.id); }}
                                                        style={{
                                                            width: 22, height: 22,
                                                            border: '2px solid var(--border)',
                                                            background: isRead ? 'var(--green)' : 'var(--white)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            flexShrink: 0, cursor: 'pointer', padding: 0
                                                        }}
                                                    >
                                                        {isRead && <CheckIcon size={14} color="#000000" />}
                                                    </button>
                                                    <span style={{
                                                        fontSize: '0.93rem', fontWeight: 700, lineHeight: 1.4,
                                                        textDecoration: isRead ? 'line-through' : 'none',
                                                        opacity: isRead ? 0.6 : 1
                                                    }}>
                                                        {item.q}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid var(--border)', paddingTop: '0.55rem' }}>
                                                    <span style={{
                                                        fontSize: '0.62rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
                                                        padding: '0.12rem 0.4rem', border: '1.5px solid var(--border)',
                                                        background: item.visualId ? accent : 'transparent', opacity: item.visualId ? 1 : 0.55, color: '#000000'
                                                    }}>
                                                        {item.visualId ? 'VISUAL' : 'TEXT'}
                                                    </span>
                                                    <motion.span
                                                        animate={{ x: isHovered ? 4 : 0 }}
                                                        style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text)' }}
                                                    >
                                                        Read →
                                                    </motion.span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Phase B: Reading/Visualizer View */
                    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: 'var(--bg)', position: 'relative' }}>

                        {/* Left Column: Question switcher sidebar */}
                        <div className="hide-scrollbar" style={{
                            display: isSidebarOpen ? 'flex' : 'none',
                            flexDirection: 'column',
                            borderRight: '3px solid var(--border)',
                            background: isDark ? '#1c1c1c' : '#eef0f3',
                            overflowY: 'auto',
                            width: '300px',
                            flexShrink: 0
                        }}>
                            <div style={{ padding: '0.5rem', borderBottom: '3px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', width: '100%' }}>
                                    <button
                                        className="btn btn-sm"
                                        onClick={() => setSelectedQuestion(null)}
                                        style={{ flex: 1, background: accent, color: '#000000', fontSize: '0.75rem', justifyContent: 'center', height: '34px', padding: '0 0.5rem' }}
                                    >
                                        ← Back
                                    </button>
                                    <button
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="btn btn-sm"
                                        style={{
                                            background: 'var(--white)',
                                            color: '#000000',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '64px',
                                            height: '34px',
                                            padding: 0,
                                            flexShrink: 0,
                                            fontSize: '0.75rem',
                                            boxShadow: 'var(--shadow-sm)'
                                        }}
                                        title="Collapse Sidebar"
                                    >
                                        ◀ Hide
                                    </button>
                                </div>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: '0.2rem', width: '100%' }}>
                                    <span style={{ position: 'absolute', left: '0.55rem', fontSize: '0.85rem', opacity: 0.45, pointerEvents: 'none' }}>⌕</span>
                                    <input
                                        type="text"
                                        placeholder="Filter questions..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{
                                            width: '100%',
                                            border: '2px solid var(--border)',
                                            background: surface,
                                            color: 'var(--text)',
                                            fontFamily: 'var(--font-main)',
                                            fontSize: '0.8rem',
                                            padding: '0.4rem 0.5rem 0.4rem 1.7rem',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {filteredQuestions.map((item) => {
                                    const isSelected = selectedQuestion.id === item.id;
                                    const isRead = readQuestions.has(item.id);
                                    const isHovered = hoveredSidebarId === item.id;
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => {
                                                setSelectedQuestion(item);
                                                setExplorerTab('explanation');
                                            }}
                                            onMouseEnter={() => setHoveredSidebarId(item.id)}
                                            onMouseLeave={() => setHoveredSidebarId(null)}
                                            style={{
                                                padding: '0.5rem 0.6rem',
                                                border: '2px solid var(--border)',
                                                borderLeft: `5px solid ${isSelected ? accent : 'var(--border)'}`,
                                                background: isSelected
                                                    ? pane
                                                    : (isHovered ? (isDark ? '#262626' : '#ffffff') : surface),
                                                color: 'var(--text)',
                                                boxShadow: isSelected ? 'none' : '2px 2px 0px var(--border)',
                                                transform: isSelected ? 'translate(2px, 0)' : 'none',
                                                cursor: 'pointer',
                                                transition: 'all 0.1s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                justifyContent: 'space-between'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                                                <div
                                                    onClick={(e) => { e.stopPropagation(); toggleRead(item.id); }}
                                                    style={{
                                                        width: 16, height: 16,
                                                        border: '2px solid var(--border)',
                                                        background: isRead ? 'var(--green)' : 'var(--white)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        flexShrink: 0, cursor: 'pointer'
                                                    }}
                                                >
                                                    {isRead && <CheckIcon size={10} color="#000000" />}
                                                </div>
                                                <span style={{
                                                    fontSize: '0.8rem', fontWeight: 700,
                                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                    textDecoration: isRead ? 'line-through' : 'none',
                                                    opacity: isRead ? 0.55 : 1
                                                }}>
                                                    {item.q}
                                                </span>
                                            </div>
                                            <span style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.5, fontFamily: 'var(--font-mono)' }}>
                                                {item.visualId ? '◆' : ''}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Column: Spacious explanation & visualizer pane */}
                        <div className="hide-scrollbar" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', background: pane, flex: 1, position: 'relative' }}>
                            {!isSidebarOpen && (
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        zIndex: 100,
                                        background: accent,
                                        border: '3.5px solid var(--border)',
                                        borderLeft: 'none',
                                        boxShadow: '3px 3px 0 var(--border)',
                                        padding: '0.75rem 0.45rem',
                                        cursor: 'pointer',
                                        fontFamily: 'var(--font-mono)',
                                        fontWeight: 800,
                                        fontSize: '0.72rem',
                                        writingMode: 'vertical-lr',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        color: '#000000',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem'
                                    }}
                                    title="Show Questions List"
                                >
                                    <span>❯</span> Questions List
                                </button>
                            )}
                            {/* Question Header */}
                            <div style={{ padding: '1rem 1.25rem', borderBottom: '3px solid var(--border)', background: tint, display: 'flex', flexDirection: 'column', gap: '0.6rem', flexShrink: 0, position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', paddingLeft: '0rem' }}>
                                    <motion.h3
                                        key={selectedQuestion.id}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.35, ease: 'easeOut' }}
                                        style={{ margin: 0, fontSize: '1.28rem', fontWeight: 800, lineHeight: 1.3 }}
                                    >
                                        {selectedQuestion.q}
                                    </motion.h3>
                                    <button
                                        onClick={() => handleShareQuestion(selectedCategory, selectedQuestion.id)}
                                        className="btn btn-sm btn-cyan"
                                        style={{ flexShrink: 0, padding: '0.25rem 0.55rem', fontSize: '0.72rem', color: '#000000', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                    >
                                        {copiedId === selectedQuestion.id ? (
                                            <>✓ Copied!</>
                                        ) : (
                                            <>
                                                <LinkIcon size={11} />
                                                <span>Share</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                            </div>

                            {/* Tabs: Explanation vs visualizer */}
                            <div style={{ display: 'flex', borderBottom: '3px solid var(--border)', background: surface, flexShrink: 0 }}>
                                {[
                                    { key: 'explanation', label: 'Explanation', enabled: true },
                                    { key: 'visual', label: selectedQuestion.visualId ? 'Interactive Sketch' : 'Sketch (N/A)', enabled: !!selectedQuestion.visualId },
                                ].map((tab, idx) => {
                                    const isActiveTab = explorerTab === tab.key;
                                    return (
                                        <button
                                            key={tab.key}
                                            onClick={() => tab.enabled && setExplorerTab(tab.key)}
                                            disabled={!tab.enabled}
                                            style={{
                                                flex: 1,
                                                position: 'relative',
                                                padding: '0.45rem 0.8rem',
                                                fontWeight: 700,
                                                fontSize: '0.75rem',
                                                fontFamily: 'var(--font-main)',
                                                cursor: tab.enabled ? 'pointer' : 'not-allowed',
                                                background: isActiveTab ? accent : 'transparent',
                                                border: 'none',
                                                borderRight: idx === 0 ? '3px solid var(--border)' : 'none',
                                                outline: 'none',
                                                color: isActiveTab ? '#000000' : (tab.enabled ? 'var(--text)' : 'gray'),
                                                opacity: tab.enabled ? 1 : 0.5,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.06em'
                                            }}
                                        >
                                            {tab.label}
                                            {isActiveTab && (
                                                <motion.span
                                                    layoutId="explorerTabUnderline"
                                                    style={{ position: 'absolute', left: 0, right: 0, bottom: -3, height: 3, background: 'var(--border)' }}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Tab Content Pane - Notepad style */}
                            <div className="hide-scrollbar" style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
                                <motion.div
                                    key={selectedQuestion.id + explorerTab}
                                    initial={{ opacity: 0, y: 18 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                    style={{
                                        background: surface,
                                        border: '3px solid var(--border)',
                                        boxShadow: 'var(--shadow)',
                                        padding: '2rem 2rem 1.75rem',
                                        maxWidth: 820,
                                        margin: '0 auto',
                                        position: 'relative'
                                    }}
                                >
                                    {/* Notepad colored top border accent decoration */}
                                    <div style={{
                                        position: 'absolute', top: 0, left: 0, right: 0, height: 8,
                                        background: accent, borderBottom: '3px solid var(--border)'
                                    }} />

                                    <div style={{ marginTop: '0.5rem' }}>
                                        {explorerTab === 'explanation' ? (
                                            <AnswerBody text={selectedQuestion.ans} accent={accent} animateKey={selectedQuestion.id} />
                                        ) : (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.96 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}
                                            >
                                                <InterviewVisualizer id={selectedQuestion.visualId} />
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const renderActiveWorkspace = () => {
        const activeWorkspace = latestTurn?.next_move?.active_workspace || config?.roundType || 'theory';
        if (activeWorkspace === 'dsa') {
            return (
                <DsaWorkspace
                    currentQuestion={currentQuestion}
                    code={dsaCode}
                    setCode={setDsaCode}
                    language={dsaLanguage}
                    setLanguage={setDsaLanguage}
                />
            );
        }
        if (activeWorkspace === 'sql') {
            return (
                <SqlWorkspace
                    query={sqlQuery}
                    setQuery={setSqlQuery}
                />
            );
        }
        if (activeWorkspace === 'system_design') {
            return (
                <SystemDesignWorkspace
                    diagram={diagram}
                    setDiagram={setDiagram}
                />
            );
        }
        // Fallback: Theory round -> show matching visualizer if active
        const simId = latestTurn?.simulation_trigger?.simulation_id;
        if (simId) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
                    <div style={{ padding: '0.5rem', border: '3px solid var(--border)', background: 'var(--yellow)', fontWeight: 800, fontSize: '0.78rem', textAlign: 'center', color: '#000000' }}>
                        ACTIVE VISUALIZER: {simId.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <InterviewVisualizer id={simId} />
                    </div>
                </div>
            );
        }

        return (
            <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '1rem',
                opacity: 0.85
            }}>
                <div style={{ border: '3px solid var(--border)', background: 'var(--purple)', padding: '1rem', color: '#fff', fontSize: '1.4rem', fontWeight: 900, boxShadow: 'var(--shadow-sm)' }}>
                    CS Theory Round
                </div>
                <p style={{ maxWidth: '300px', fontSize: '0.9rem', opacity: 0.6 }}>
                    Answer the interviewer's questions. When a concept matching a simulation is discussed, the interactive visualization will load here.
                </p>
            </div>
        );
    };

    /* ---- Render: Active Chat ---- */
    const timePressure = elapsed > 0.7 * totalSeconds;

    return (
        <div className="main-content" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', overflow: 'hidden' }}>
            {/* Thin header bar */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 1rem',
                    borderBottom: '3px solid var(--border)',
                    background: ACCENT,
                    flexShrink: 0,
                }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>
                    {UsersIcon({ size: 16 })}
                    Interview in Progress
                    {voice.speaking && <Chip color="var(--cyan)">speaking…</Chip>}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {ttsSupported && (
                        <button
                            onClick={toggleTts}
                            title={ttsOn ? 'Voice ON' : 'Voice OFF'}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.15rem 0.5rem',
                                border: '2px solid var(--border)',
                                background: ttsOn ? 'var(--cyan)' : 'var(--white)',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700,
                                fontSize: '0.7rem',
                            }}
                        >
                            {ttsOn ? SpeakerIcon({ size: 12 }) : SpeakerOffIcon({ size: 12 })}
                            {ttsOn ? 'VOICE' : 'MUTED'}
                        </button>
                    )}
                    <span
                        style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.15rem 0.5rem',
                            border: '2px solid var(--border)',
                            background: timePressure ? 'var(--pink)' : 'var(--white)',
                            animation: timePressure ? 'pulse 1.2s ease-in-out infinite' : 'none',
                        }}
                    >
                        {ClockIcon({ size: 12 })} {fmtTime(elapsed)} / {fmtTime(totalSeconds)}
                    </span>
                    <button
                        onClick={endInterview}
                        disabled={loading || turnData.length === 0}
                        title={turnData.length === 0 ? 'Answer at least one question first' : 'End the interview and see your scorecard'}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.15rem 0.6rem',
                            border: '2px solid var(--border)',
                            background: 'var(--pink)',
                            cursor: turnData.length === 0 || loading ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            opacity: turnData.length === 0 ? 0.5 : 1,
                            transition: 'all 0.15s ease',
                        }}
                    >
                        END INTERVIEW
                    </button>
                </span>
            </div>

            {/* Main content split panel */}
            <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
                {/* Left Side: Interactive Workspace */}
                <div style={{
                    width: '58%',
                    borderRight: '3px solid var(--border)',
                    background: isDark ? '#1a1a1a' : '#fafafa',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    overflowY: 'auto'
                }}>
                    {renderActiveWorkspace()}
                </div>

                {/* Right Side: Chat & Voice input */}
                <div style={{
                    width: '42%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: isDark ? '#121212' : '#f9f9fb',
                    minHeight: 0
                }}>
                    {/* Chat messages area */}
                    <div
                        className="hide-scrollbar"
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '1.25rem 1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <AnimatePresence mode="popLayout">
                            {messages.map((msg, i) => (
                                <ChatBubble key={i} type={msg.type} animate={i >= messages.length - 2}>
                                    {msg.text}
                                </ChatBubble>
                            ))}
                        </AnimatePresence>

                        {loading && <TypingIndicator />}

                        {error && (
                            <div className="alert alert-error" style={{ margin: '0.5rem 0', alignSelf: 'center', maxWidth: '80%' }}>
                                {error}
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    {/* Voice input panel */}
                    <div style={{ flexShrink: 0 }}>
                        <VoiceInput
                            value={answer}
                            onChange={updateAnswer}
                            onSend={submitAnswer}
                            loading={loading}
                            voice={{
                                listening: voice.listening,
                                onMicToggle: voice.listening ? voice.stopListening : voice.startListening,
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
