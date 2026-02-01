"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/Auth/AuthProvider";
import { useRouter } from "next/navigation";
import { getEntries, DailyEntry, deleteDailyEntry, updateDailyEntry } from "@/lib/firebase/firestore";
import { calculateTDEE, TDEEResult } from "@/lib/tdee-calculations";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/firebase";
import DailyInput from "@/components/Dashboard/DailyInput";
import StatsOverview from "@/components/Dashboard/StatsOverview";
import HistoryTable from "@/components/Dashboard/HistoryTable";
import styles from "@/components/Dashboard/Dashboard.module.css";

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [entries, setEntries] = useState<DailyEntry[]>([]);
    const [stats, setStats] = useState<TDEEResult | null>(null);
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
            const data = await getEntries(user.uid);
            setEntries(data);
            const calculatedStats = calculateTDEE(data);
            setStats(calculatedStats);
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

    return (
        <div className={styles.dashboardContainer}>
            <header className={styles.header}>
                <h1 className={styles.title}>Dashboard</h1>
                <button onClick={handleLogout} className={styles.logoutButton}>
                    Log Out
                </button>
            </header>

            <div className={styles.grid}>
                <StatsOverview stats={stats} />
                <DailyInput
                    userId={user.uid}
                    onEntryAdded={handleEntrySaved}
                    initialData={editingEntry}
                    onCancel={handleCancelEdit}
                />
            </div>

            <HistoryTable
                entries={entries}
                onDelete={handleDeleteEntry}
                onEdit={handleEditEntry}
            />
        </div>
    );
}
