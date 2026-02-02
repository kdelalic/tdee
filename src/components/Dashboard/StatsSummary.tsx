"use client";

import { useEffect, useState, useMemo } from "react";
import { DailyEntry, UserSettings } from "@/lib/firebase/firestore";
import { calculateStats, TDEEStats } from "@/lib/tdee-calculator";
import styles from "./Dashboard.module.css";

interface StatsSummaryProps {
    entries: DailyEntry[];
    settings: UserSettings | null;
}

// Calculate the current streak of consecutive logging days
function calculateStreak(entries: DailyEntry[]): number {
    if (entries.length === 0) return 0;

    // Sort entries by date descending (most recent first)
    const sortedDates = entries
        .map(e => e.date)
        .sort((a, b) => b.localeCompare(a));

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    // Get yesterday's date
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    // Check if the most recent entry is today or yesterday
    // If the most recent entry is older, streak is 0
    const mostRecentDate = sortedDates[0];
    if (mostRecentDate !== todayString && mostRecentDate !== yesterdayString) {
        return 0;
    }

    // Create a Set for O(1) lookup
    const dateSet = new Set(sortedDates);

    // Count consecutive days starting from the most recent entry
    let streak = 0;
    let checkDate = new Date(mostRecentDate + 'T12:00:00'); // Use noon to avoid timezone issues

    while (true) {
        const dateString = checkDate.toISOString().split('T')[0];
        if (dateSet.has(dateString)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

export default function StatsSummary({ entries, settings }: StatsSummaryProps) {
    const [stats, setStats] = useState<TDEEStats | null>(null);

    const streak = useMemo(() => calculateStreak(entries), [entries]);

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

                {/* Streak Counter */}
                <div className={styles.statRow}>
                    <span className={styles.statLabel}>Logging Streak:</span>
                    <span className={styles.statValue}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🔥 {streak} <small>day{streak !== 1 ? 's' : ''}</small>
                        </span>
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
