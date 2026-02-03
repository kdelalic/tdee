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
                    <Skeleton width={80} height={40} />
                    <Skeleton width={120} height={40} />
                    <Skeleton width={40} height={40} borderRadius={12} />
                    <Skeleton width={80} height={40} />
                </div>
            </header>

            <div className={styles.grid}>
                {/* Left Column: Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <StatsSkeleton />
                </div>

                {/* Right Column: Input, Charts, History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Daily Input Skeleton */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>
                            <Skeleton width={160} height={24} />
                        </h2>
                        <div className={styles.formRow}>
                            <div className={styles.inputGroup}>
                                <Skeleton height={16} width={40} style={{ marginBottom: 8 }} />
                                <Skeleton width="100%" height={50} />
                            </div>
                            <div className={styles.inputGroup}>
                                <Skeleton height={16} width={90} style={{ marginBottom: 8 }} />
                                <Skeleton width="100%" height={50} />
                            </div>
                            <div className={styles.inputGroup}>
                                <Skeleton height={16} width={60} style={{ marginBottom: 8 }} />
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
                        <div style={{
                            marginBottom: '2rem',
                            padding: '1.25rem',
                            background: 'var(--background)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            gap: '2rem'
                        }}>
                            <div style={{ flex: 1 }}>
                                <Skeleton width={60} height={12} style={{ marginBottom: 8 }} />
                                <Skeleton width={120} height={32} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <Skeleton width={60} height={12} style={{ marginBottom: 8 }} />
                                <Skeleton width={120} height={32} />
                            </div>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                <Skeleton width={100} height={24} borderRadius={6} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                            <div style={{ height: 300, width: "100%" }}>
                                <Skeleton width={120} height={16} style={{ margin: '0 auto 1rem auto' }} />
                                <Skeleton width="100%" height={260} />
                            </div>
                            <div style={{ height: 300, width: "100%" }}>
                                <Skeleton width={140} height={16} style={{ margin: '0 auto 1rem auto' }} />
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
                            <div style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <Skeleton width="20%" height={20} />
                                    <Skeleton width="20%" height={20} />
                                    <Skeleton width="20%" height={20} />
                                    <Skeleton width="20%" height={20} />
                                </div>
                                {[1, 2, 3].map((i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderTop: '1px solid var(--border)' }}>
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
