import React from "react";
import styles from "./Dashboard.module.css";
import Skeleton from "@/components/ui/Skeleton";

export default function StatsSkeleton() {
    return (
        <div className={`${styles.card} ${styles.statsCard}`}>
            <h2 className={styles.cardTitle}>
                <Skeleton width={180} height={24} />
            </h2>

            <div className={styles.statsGrid}>
                {/* Weight */}
                <div className={styles.statRow}>
                    <span className={styles.statLabel}>
                        <Skeleton width={100} height={16} />
                    </span>
                    <span className={styles.statValue}>
                        <Skeleton width={120} height={40} />
                    </span>
                </div>

                {/* Lost/Gained */}
                <div className={styles.statRow}>
                    <span className={styles.statLabel}>
                        <Skeleton width={80} height={16} />
                    </span>
                    <span className={styles.statValue}>
                        <Skeleton width={100} height={40} />
                    </span>
                </div>

                <hr className={styles.divider} />

                {/* Streak */}
                <div className={styles.statRow}>
                    <span className={styles.statLabel}>
                        <Skeleton width={90} height={16} />
                    </span>
                    <span className={styles.statValue}>
                        <Skeleton width={110} height={40} />
                    </span>
                </div>

                <hr className={styles.divider} />

                {/* TDEE */}
                <div className={styles.statRow}>
                    <span className={styles.statLabel}>
                        <Skeleton width={100} height={16} />
                    </span>
                    <span className={styles.statValue}>
                        <Skeleton width={130} height={40} />
                    </span>
                </div>

                {/* Target Calories */}
                <div className={styles.statRow}>
                    <span className={styles.statLabel}>
                        <Skeleton width={120} height={16} />
                    </span>
                    <span className={styles.statValue}>
                        <Skeleton width={140} height={40} />
                    </span>
                </div>

                {/* Goal Date */}
                <div className={styles.statRow}>
                    <span className={styles.statLabel}>
                        <Skeleton width={110} height={16} />
                    </span>
                    <span className={styles.statValue}>
                        <Skeleton width={150} height={40} />
                    </span>
                </div>

                <div className={styles.statFooter}>
                    <Skeleton width="80%" height={20} style={{ marginBottom: 8 }} />
                    <Skeleton width="60%" height={20} />
                </div>
            </div>
        </div>
    );
}
