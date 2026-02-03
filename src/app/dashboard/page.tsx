"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/Auth/AuthProvider";
import { useRouter } from "next/navigation";
import { getEntries, DailyEntry, deleteDailyEntry, getUserSettings, UserSettings } from "@/lib/firebase/firestore";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/firebase";
import DailyInput from "@/components/Dashboard/DailyInput";
import StatsSummary from "@/components/Dashboard/StatsSummary";
import ChartsOverview from "@/components/Dashboard/ChartsOverview";
import HistoryTable from "@/components/Dashboard/HistoryTable";
import EditEntryModal from "@/components/Dashboard/EditEntryModal";
import styles from "@/components/Dashboard/Dashboard.module.css";
import Link from "next/link";

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

            // Redirect to settings if no setup completed
            if (!settings) {
                router.push("/dashboard/settings");
            }
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
    };

    const handleEntrySaved = () => {
        setEditingEntry(null);
        refreshData();
    };

    const handleCloseModal = () => {
        setEditingEntry(null);
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/");
    };

    if (loading || (loadingData && user)) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                Loading...
            </div>
        );
    }

    if (!user) return null;

    // If no settings, we'll redirect (handled in refreshData)
    if (!userSettings) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                Redirecting to setup...
            </div>
        );
    }

    return (
        <div className={styles.dashboardContainer}>
            <header className={styles.header}>
                <h1 className={styles.title}>Dashboard</h1>
                <div className={styles.headerActions}>
                    <Link href="/tips" className={styles.tipsButton}>
                        💡 <span className={styles.hideOnMobile}>Tips</span>
                    </Link>
                    <Link href="/how-it-works" className={styles.tipsButton}>
                        📊 <span className={styles.hideOnMobile}>How It Works</span>
                    </Link>
                    <Link href="/dashboard/settings" className={styles.settingsLink} title="Settings">
                        ⚙️
                    </Link>
                    <button onClick={handleLogout} className={styles.logoutButton}>
                        Log Out
                    </button>
                </div>
            </header>

            <div className={styles.grid}>
                {/* Left Column: Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <StatsSummary entries={entries} settings={userSettings} />
                </div>

                {/* Right Column: Input, Charts, History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <DailyInput
                        userId={user.uid}
                        onEntryAdded={handleEntrySaved}
                    />

                    <ChartsOverview entries={entries} settings={userSettings} />

                    <HistoryTable
                        entries={entries}
                        onDelete={handleDeleteEntry}
                        onEdit={handleEditEntry}
                    />
                </div>
            </div>

            {/* Edit Entry Modal */}
            {editingEntry && (
                <EditEntryModal
                    entry={editingEntry}
                    userId={user.uid}
                    onSave={handleEntrySaved}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
}
