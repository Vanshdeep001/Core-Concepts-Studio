import { motion } from 'framer-motion';
import { ALGORITHM_LABELS } from '../engine/schedulerEngine';

export default function RecommendationCard({ recommendation }) {
    if (!recommendation) return null;
    const { recommendedLabel, ranking, reasoning } = recommendation;

    return (
        <div className="recommendation-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🏆</span>
                <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>Recommended Algorithm</div>
                    <div className="recommendation-badge">{recommendedLabel}</div>
                </div>
            </div>

            <p style={{ fontSize: '0.88rem', marginBottom: '1rem', fontStyle: 'italic' }}>{reasoning}</p>

            <div style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                Full Ranking (by avg waiting time)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {ranking.map((r, i) => (
                    <motion.div
                        key={r.algorithmName}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            background: i === 0 ? 'rgba(0,0,0,0.08)' : 'transparent',
                            padding: '0.3rem 0.5rem',
                            border: i === 0 ? '2px solid var(--border)' : '2px solid transparent',
                        }}
                    >
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, minWidth: 20, color: i === 0 ? 'inherit' : 'inherit', opacity: i === 0 ? 1 : 0.7 }}>
                            #{i + 1}
                        </span>
                        <span style={{ fontWeight: 700, minWidth: 200 }}>{r.label}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', opacity: 0.8 }}>
                            WT: {r.avgWaitingTime.toFixed(2)} · TAT: {r.avgTurnaroundTime.toFixed(2)}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
