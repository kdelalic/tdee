"use client";

import { useEffect, useState, useCallback } from "react";
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
import DashboardSkeleton from "@/components/Dashboard/DashboardSkeleton";
import Link from "next/link";
import ThemeToggle from "@/components/Theme/ThemeToggle";
import { useToast } from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [entries, setEntries] = useState<DailyEntry[]>([]);
    const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [editingEntry, setEditingEntry] = useState<DailyEntry | null>(null);
    const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
    const { showToast } = useToast();

    // Auth protection
    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // Data fetching
    const refreshData = useCallback(async () => {
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
    }, [user, router]);

    useEffect(() => {
        if (user) {
            refreshData();
        }
    }, [user, refreshData]);

    const handleDeleteEntry = (entryId: string) => {
        setDeletingEntryId(entryId);
    };

    const confirmDeleteEntry = async () => {
        if (!deletingEntryId) return;

        try {
            await deleteDailyEntry(deletingEntryId);
            if (editingEntry?.id === deletingEntryId) {
                setEditingEntry(null);
            }
            showToast("Entry deleted");
            refreshData();
        } catch (error) {
            console.error("Error deleting entry:", error);
            showToast("Failed to delete entry", "error");
        } finally {
            setDeletingEntryId(null);
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
        return <DashboardSkeleton />;
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
                    <Link href="/tips" className={styles.tipsButton} title="Tips for Success" aria-label="Tips for Success">
                        <span aria-hidden="true">💡</span>
                    </Link>
                    <Link href="/how-it-works" className={styles.tipsButton} title="How Equations Work" aria-label="How Equations Work">
                        <span aria-hidden="true">📊</span>
                    </Link>
                    <Link href="/dashboard/settings" className={styles.settingsLink} title="Goal Settings" aria-label="Goal Settings">
                        <span aria-hidden="true">⚙️</span>
                    </Link>
                    <ThemeToggle className={styles.themeToggle} />
                    <button onClick={handleLogout} className={styles.logoutButton} title="Log Out" aria-label="Log Out">
                        <span aria-hidden="true">⏻</span>
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

            {/* Delete Confirmation Dialog */}
            {deletingEntryId && (
                <ConfirmDialog
                    title="Delete Entry"
                    message="Are you sure you want to delete this entry? This action cannot be undone."
                    confirmLabel="Delete"
                    cancelLabel="Cancel"
                    variant="danger"
                    onConfirm={confirmDeleteEntry}
                    onCancel={() => setDeletingEntryId(null)}
                />
            )}
        </div>
    );
}
