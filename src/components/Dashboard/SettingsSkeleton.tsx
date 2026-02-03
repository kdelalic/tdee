import React from "react";
import styles from "./Dashboard.module.css";
import Skeleton from "@/components/ui/Skeleton";

export default function SettingsSkeleton() {
    return (
        <div className={styles.card}>
            <div className={styles.settingsHeader}>
                <Skeleton width={200} height={28} />
            </div>

            <div className={styles.settingsForm}>
                <div className={styles.setupGrid}>
                    <div className={styles.inputGroup}>
                        <Skeleton width={80} height={16} style={{ marginBottom: 8 }} />
                        <Skeleton width="100%" height={50} />
                    </div>
                    <div className={styles.inputGroup}>
                        <Skeleton width={60} height={16} style={{ marginBottom: 8 }} />
                        <Skeleton width="100%" height={50} />
                    </div>
                    <div className={styles.inputGroup}>
                        <Skeleton width={110} height={16} style={{ marginBottom: 8 }} />
                        <Skeleton width="100%" height={50} />
                    </div>
                    <div className={styles.inputGroup}>
                        <Skeleton width={90} height={16} style={{ marginBottom: 8 }} />
                        <Skeleton width="100%" height={50} />
                    </div>
                    <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                        <Skeleton width={100} height={16} style={{ marginBottom: 8 }} />
                        <div className={styles.toggleContainer} style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "0.25rem" }}>
                            <Skeleton width="32%" height={42} style={{ marginRight: "1%" }} />
                            <Skeleton width="32%" height={42} style={{ marginRight: "1%" }} />
                            <Skeleton width="32%" height={42} />
                        </div>
                    </div>
                </div>
                <div className={styles.settingsActions}>
                    <Skeleton width="100%" height={50} />
                </div>
            </div>
        </div>
    );
}
