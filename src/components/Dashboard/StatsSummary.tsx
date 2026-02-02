"use client";

import { useEffect, useState } from "react";
import { DailyEntry, UserSettings } from "@/lib/firebase/firestore";
import { calculateStats, TDEEStats } from "@/lib/tdee-calculator";
import styles from "./Dashboard.module.css";

interface StatsSummaryProps {
    entries: DailyEntry[];
    settings: UserSettings | null;
}

export default function StatsSummary({ entries, settings }: StatsSummaryProps) {
    const [stats, setStats] = useState<TDEEStats | null>(null);

    useEffect(() => {
        if (entries && settings) {
            const calculated = calculateStats(entries, settings);
            setStats(calculated);
        }
    }, [entries, settings]);

    if (!settings) return null;
    if (!stats) return <div className={styles.card}>Loading Stats...</div>;

    const isLossGoal = settings.weeklyGoal < 0;

    return (
        <div className={`${styles.card} ${styles.statsCard}`}>
            <h2 className={styles.cardTitle}>Current Body Stats</h2>

            <div className={styles.statsGrid}>
                <div className={styles.statRow}>
                    <span className={styles.statLabel}>Current Weight:</span>
                    <span className={styles.statValue}>
                        {stats.currentWeight} <small>{settings.units}</small>
                    </span>
                </div>

                <div className={styles.statRow}>
                    <span className={styles.statLabel}>You've {stats.totalLost >= 0 ? "Lost" : "Gained"}:</span>
                    <span className={`${styles.statValue} ${(isLossGoal && stats.totalLost >= 0) || (!isLossGoal && stats.totalLost <= 0)
                        ? styles.textSuccess
                        : styles.textError
                        }`}>
                        {Math.abs(stats.totalLost)} <small>{settings.units}</small>
                    </span>
                </div>

                <hr className={styles.divider} />

                {entries.length >= 7 ? (
                    <>
                        <div className={styles.statRow}>
                            <span className={styles.statLabel}>Current TDEE:</span>
                            <span className={styles.statValue}>
                                ~{stats.tdee} <small>Cal/Day</small>
                            </span>
                        </div>

                        <div className={styles.statRow}>
                            <span className={styles.statLabel}>Target Daily Calories:</span>
                            <span className={`${styles.statValue} ${styles.textPrimary}`}>
                                {stats.targetCalories} <small>Cal/Day</small>
                            </span>
                        </div>

                        <div className={styles.statRow}>
                            <span className={styles.statLabel}>To Reach Goal By:</span>
                            <span className={styles.statValue}>
                                {stats.goalDate}
                            </span>
                        </div>

                        <div className={styles.statFooter}>
                            {stats.weeksToGoal} Weeks until you reach your goal weight
                            <br />
                            {entries.length < 28 && (
                                <span className={styles.statAccuracyNote}>
                                    Numbers take 3-4 weeks to stabilize and become accurate.
                                </span>
                            )}
                        </div>
                    </>
                ) : (
                    <div className={styles.projectionsWait}>
                        <p>
                            Projections available after 7 days of data.
                            <br />
                            ({7 - entries.length} days remaining)
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
