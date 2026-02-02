"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/Auth/AuthProvider";
import { useRouter } from "next/navigation";
import { getUserSettings, UserSettings } from "@/lib/firebase/firestore";
import SettingsForm from "@/components/Dashboard/SettingsForm";
import styles from "@/components/Dashboard/Dashboard.module.css";
import Link from "next/link";

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
    const fetchSettings = async () => {
        if (!user) return;
        try {
            const settings = await getUserSettings(user.uid);
            setUserSettings(settings);
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchSettings();
        }
    }, [user]);

    const handleSave = () => {
        router.push("/dashboard");
    };

    const handleCancel = () => {
        router.push("/dashboard");
    };

    if (loading || (loadingData && user)) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                Loading...
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
