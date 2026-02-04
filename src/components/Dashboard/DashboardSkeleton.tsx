import React from "react";
import styles from "./Dashboard.module.css";
import Skeleton from "@/components/ui/Skeleton";
import StatsSkeleton from "./StatsSkeleton";

export default function DashboardSkeleton() {
    return (
        <div className={styles.dashboardContainer}>
            <header className={styles.header}>
                <Skeleton width={180} height={40} />
                <div className={styles.headerActions}>
                    <Skeleton width="var(--header-btn-size)" height="var(--header-btn-size)" borderRadius="var(--radius-lg)" />
                    <Skeleton width="var(--header-btn-size)" height="var(--header-btn-size)" borderRadius="var(--radius-lg)" />
                    <Skeleton width="var(--header-btn-size)" height="var(--header-btn-size)" borderRadius="var(--radius-lg)" />
                    <Skeleton width="var(--header-btn-size)" height="var(--header-btn-size)" borderRadius="var(--radius-lg)" />
                    <Skeleton width="var(--header-btn-size)" height="var(--header-btn-size)" borderRadius="var(--radius-lg)" />
                </div>
            </header>

            <div className={styles.grid}>
                {/* Left Column: Stats */}
                <div className={styles.skeletonColumn}>
                    <StatsSkeleton />
                </div>

                {/* Right Column: Input, Charts, History */}
                <div className={styles.skeletonColumn}>

                    {/* Daily Input Skeleton */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>
                            <Skeleton width={160} height={24} />
                        </h2>
                        <div className={styles.formRow}>
                            <div className={styles.inputGroup}>
                                <Skeleton height={16} width={40} className={styles.skeletonLabelSpacing} />
                                <Skeleton width="100%" height={50} />
                            </div>
                            <div className={styles.inputGroup}>
                                <Skeleton height={16} width={90} className={styles.skeletonLabelSpacing} />
                                <Skeleton width="100%" height={50} />
                            </div>
                            <div className={styles.inputGroup}>
                                <Skeleton height={16} width={60} className={styles.skeletonLabelSpacing} />
                                <Skeleton width="100%" height={50} />
                            </div>
                            <div className={styles.inputGroup}>
                                <Skeleton width="100%" height={50} />
                            </div>
                        </div>
                    </div>

                    {/* Charts Overview Skeleton */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>
                            <Skeleton width={100} height={24} />
                        </h2>

                        {/* Weekly Rate Box Skeleton */}
                        <div className={styles.skeletonRateBox}>
                            <div className={styles.skeletonRateItem}>
                                <Skeleton width={60} height={12} className={styles.skeletonLabelSpacing} />
                                <Skeleton width={120} height={32} />
                            </div>
                            <div className={styles.skeletonRateItem}>
                                <Skeleton width={60} height={12} className={styles.skeletonLabelSpacing} />
                                <Skeleton width={120} height={32} />
                            </div>
                            <div className={styles.skeletonRateItemCenter}>
                                <Skeleton width={100} height={24} borderRadius={6} />
                            </div>
                        </div>

                        <div className={styles.skeletonChartGrid}>
                            <div className={styles.skeletonChartContainer}>
                                <Skeleton width={120} height={16} className={styles.skeletonChartTitle} />
                                <Skeleton width="100%" height={260} />
                            </div>
                            <div className={styles.skeletonChartContainer}>
                                <Skeleton width={140} height={16} className={styles.skeletonChartTitle} />
                                <Skeleton width="100%" height={260} />
                            </div>
                        </div>
                    </div>

                    {/* History Table Skeleton */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>
                            <Skeleton width={140} height={24} />
                        </h2>
                        <div className={styles.tableContainer}>
                            <div className={styles.skeletonTablePadding}>
                                <div className={styles.skeletonTableHeader}>
                                    <Skeleton width="20%" height={20} />
                                    <Skeleton width="20%" height={20} />
                                    <Skeleton width="20%" height={20} />
                                    <Skeleton width="20%" height={20} />
                                </div>
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className={styles.skeletonTableRow}>
                                        <Skeleton width="20%" height={20} />
                                        <Skeleton width="20%" height={20} />
                                        <Skeleton width="20%" height={20} />
                                        <Skeleton width="20%" height={20} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
