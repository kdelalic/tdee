"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/Auth/AuthProvider";
import { useRouter } from "next/navigation";
import { getUserSettings, UserSettings } from "@/lib/firebase/firestore";
import SettingsForm from "@/components/Dashboard/SettingsForm";
import styles from "@/components/Dashboard/Dashboard.module.css";
import Link from "next/link";

import SettingsSkeleton from "@/components/Dashboard/SettingsSkeleton";
import Skeleton from "@/components/ui/Skeleton";

export default function SettingsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
    const [loadingData, setLoadingData] = useState(true);

    // Auth protection
    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // Data fetching
    const fetchSettings = useCallback(async () => {
        if (!user) return;
        try {
            const settings = await getUserSettings(user.uid);
            setUserSettings(settings);
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoadingData(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchSettings();
        }
    }, [user, fetchSettings]);

    const handleSave = () => {
        router.push("/dashboard");
    };

    const handleCancel = () => {
        router.push("/dashboard");
    };

    if (loading || (loadingData && user)) {
        return (
            <div className={styles.dashboardContainer}>
                <header className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Skeleton width={60} height={24} />
                        <Skeleton width={150} height={40} />
                    </div>
                </header>
                <SettingsSkeleton />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className={styles.dashboardContainer}>
            <header className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/dashboard" className={styles.backLink}>
                        ← Back
                    </Link>
                    <h1 className={styles.title}>Settings</h1>
                </div>
            </header>

            <SettingsForm
                userId={user.uid}
                existingSettings={userSettings}
                onSave={handleSave}
                onCancel={userSettings ? handleCancel : undefined}
            />
        </div>
    );
}
