"use client";

import { useState } from "react";
import { addDailyEntry, getDailyEntry } from "@/lib/firebase/firestore";
import { useToast } from "@/components/ui/Toast";
import { parseEntryForm } from "@/lib/validation";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import styles from "./Dashboard.module.css";

interface DailyInputProps {
    userId: string;
    onEntryAdded: () => void;
}

export default function DailyInput({ userId, onEntryAdded }: DailyInputProps) {
    const [weight, setWeight] = useState("");
    const [calories, setCalories] = useState("");

    const [date, setDate] = useState(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [loading, setLoading] = useState(false);
    const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
    const [pendingEntry, setPendingEntry] = useState<{ date: string; weight: number; calories: number } | null>(null);
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Use centralized validation
            const { data: parsedData, error: validationError } = parseEntryForm({
                weight,
                calories,
                date,
            });

            if (validationError || !parsedData) {
                showToast(validationError || "Invalid input", "error");
                setLoading(false);
                return;
            }

            const entryData = {
                date: parsedData.date!,
                weight: parsedData.weight,
                calories: parsedData.calories,
            };

            // Check for existing entry
            const existing = await getDailyEntry(userId, date);
            if (existing) {
                setPendingEntry(entryData);
                setShowOverwriteDialog(true);
                setLoading(false);
                return;
            }

            await addDailyEntry(userId, entryData);

            setWeight("");
            setCalories("");

            showToast("Entry added");
            onEntryAdded();
        } catch (error) {
            console.error("Failed to save entry", error);
            showToast("Failed to save entry", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmOverwrite = async () => {
        if (!pendingEntry) return;
        setShowOverwriteDialog(false);
        setLoading(true);

        try {
            await addDailyEntry(userId, pendingEntry);
            setWeight("");
            setCalories("");

            showToast("Entry updated");
            onEntryAdded();
        } catch (error) {
            console.error("Failed to save entry", error);
            showToast("Failed to save entry", "error");
        } finally {
            setLoading(false);
            setPendingEntry(null);
        }
    };

    const handleCancelOverwrite = () => {
        setShowOverwriteDialog(false);
        setPendingEntry(null);
    };

    return (
        <div className={styles.card}>
            <h2 className={styles.cardTitle}>Add Daily Entry</h2>
            <form onSubmit={handleSubmit} className={styles.formRow}>
                <div className={styles.inputGroup}>
                    <label htmlFor="daily-date">Date</label>
                    <input
                        id="daily-date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className={styles.input}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="daily-weight">Weight (lbs)</label>
                    <input
                        id="daily-weight"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0.0"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        required
                        className={styles.input}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="daily-calories">Calories</label>
                    <input
                        id="daily-calories"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={calories}
                        onChange={(e) => setCalories(e.target.value)}
                        required
                        className={styles.input}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label className={styles.visuallyHidden}>Submit</label>
                    <button type="submit" disabled={loading} className={styles.primaryButton}>
                        {loading ? "Saving..." : "Add"}
                    </button>
                </div>
            </form>

            {showOverwriteDialog && (
                <ConfirmDialog
                    title="Overwrite Entry"
                    message="An entry for this date already exists. Do you want to overwrite it with the new values?"
                    confirmLabel="Overwrite"
                    cancelLabel="Cancel"
                    variant="default"
                    onConfirm={handleConfirmOverwrite}
                    onCancel={handleCancelOverwrite}
                />
            )}
        </div>
    );
}
