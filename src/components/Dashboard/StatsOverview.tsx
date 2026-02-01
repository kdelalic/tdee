import { TDEEResult } from "@/lib/tdee-calculations";
import styles from "./Dashboard.module.css";

interface StatsOverviewProps {
    stats: TDEEResult | null;
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
    if (!stats) {
        return (
            <div className={styles.card}>
                <h2 className={styles.cardTitle}>Current TDEE</h2>
                <div className={styles.statValue}>--</div>
                <p className={styles.statLabel}>Need ~1 week of data</p>
            </div>
        );
    }

    return (
        <>
            <div className={styles.card}>
                <h2 className={styles.cardTitle}>Estimated TDEE</h2>
                <div className={styles.statValue}>{stats.tdee} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>kcal</span></div>
                <p className={styles.statLabel}>Daily maintenance calories</p>
            </div>
            <div className={styles.card}>
                <h2 className={styles.cardTitle}>Weight Trend</h2>
                <div className={styles.statValue} style={{ color: stats.weightTrend > 0 ? 'var(--error)' : 'var(--success)' }}>
                    {stats.weightTrend > 0 ? '+' : ''}{stats.weightTrend} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>lbs/week</span>
                </div>
                <p className={styles.statLabel}>Based on last 3 weeks</p>
            </div>
        </>
    );
}
