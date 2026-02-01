"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/Auth/AuthProvider";
import { useRouter } from "next/navigation";
import { getEntries, DailyEntry, deleteDailyEntry, updateDailyEntry, getUserSettings, UserSettings } from "@/lib/firebase/firestore";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/firebase";
import DailyInput from "@/components/Dashboard/DailyInput";
import StatsSummary from "@/components/Dashboard/StatsSummary";
import HistoryTable from "@/components/Dashboard/HistoryTable";
import SetupAccordion from "@/components/Dashboard/SetupAccordion";
import styles from "@/components/Dashboard/Dashboard.module.css";

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [entries, setEntries] = useState<DailyEntry[]>([]);
    const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [editingEntry, setEditingEntry] = useState<DailyEntry | null>(null);

    // Auth protection
    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // Data fetching
    const refreshData = async () => {
        if (!user) return;
        try {
            const [data, settings] = await Promise.all([
                getEntries(user.uid),
                getUserSettings(user.uid)
            ]);
            setEntries(data);
            setUserSettings(settings);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (user) {
            refreshData();
        }
    }, [user]);

    const handleDeleteEntry = async (entryId: string) => {
        if (!confirm("Are you sure you want to delete this entry?")) return;

        try {
            await deleteDailyEntry(entryId);
            if (editingEntry?.id === entryId) {
                setEditingEntry(null);
            }
            refreshData();
        } catch (error) {
            console.error("Error deleting entry:", error);
            alert("Failed to delete entry");
        }
    };

    const handleEditEntry = (entry: DailyEntry) => {
        setEditingEntry(entry);
        // Scroll to top to see input
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleEntrySaved = () => {
        setEditingEntry(null);
        refreshData();
    };

    const handleSettingsSaved = () => {
        refreshData();
    };

    const handleCancelEdit = () => {
        setEditingEntry(null);
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/");
    };

    if (loading || (loadingData && user)) { // Show loading until auth check AND data fetch are done
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                Loading...
            </div>
        );
    }

    if (!user) return null; // Should redirect

    // Logic for new flow
    const isSetup = !!userSettings;

    return (
        <div className={styles.dashboardContainer}>
            <header className={styles.header}>
                <h1 className={styles.title}>Dashboard</h1>
                <button onClick={handleLogout} className={styles.logoutButton}>
                    Log Out
                </button>
            </header>

            {/* Always show Setup Accordion at top */}
            <SetupAccordion
                userId={user.uid}
                existingSettings={userSettings}
                onSave={handleSettingsSaved}
            />

            {/* Only show the rest if setup is complete */}
            {isSetup ? (
                <div className={styles.grid}>
                    {/* Left Column: Stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <StatsSummary entries={entries} settings={userSettings} />
                    </div>

                    {/* Right Column: Input & History */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <DailyInput
                            userId={user.uid}
                            onEntryAdded={handleEntrySaved}
                            initialData={editingEntry}
                            onCancel={handleCancelEdit}
                        />
                        <HistoryTable
                            entries={entries}
                            onDelete={handleDeleteEntry}
                            onEdit={handleEditEntry}
                        />
                    </div>
                </div>
            ) : (
                <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)' }}>
                    <p>Please complete the initial setup above to start tracking.</p>
                </div>
            )}
        </div>
    );
}
