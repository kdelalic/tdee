"use client";

import { useState, useEffect } from "react";
import { addDailyEntry, updateDailyEntry, DailyEntry } from "@/lib/firebase/firestore";
import styles from "./Dashboard.module.css"; // We'll create this shared CSS

interface DailyInputProps {
    userId: string;
    onEntryAdded: () => void;
    initialData?: DailyEntry | null;
    onCancel?: () => void;
}

export default function DailyInput({ userId, onEntryAdded, initialData, onCancel }: DailyInputProps) {
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

    useEffect(() => {
        if (initialData) {
            setWeight(initialData.weight.toString());
            setCalories(initialData.calories.toString());
            setDate(initialData.date);
        } else {
            setWeight("");
            setCalories("");
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            setDate(`${year}-${month}-${day}`);
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const entryData = {
                date,
                weight: parseFloat(weight),
                calories: parseInt(calories),
            };

            if (initialData) {
                await updateDailyEntry(userId, initialData, entryData);
            } else {
                await addDailyEntry(userId, entryData);
            }

            setWeight("");
            setCalories("");
            if (!initialData) {
                // Only reset date if adding new
                // For edit, we might want to stay or reset?
                // Actually reset form is fine, but onEntryAdded usually refreshes parent.
                // Parent might clear initialData if we call onEntryAdded.
            }
            onEntryAdded();
        } catch (error) {
            console.error("Failed to save entry", error);
            alert("Failed to save entry");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <h2 className={styles.cardTitle}>{initialData ? "Edit Daily Entry" : "Add Daily Entry"}</h2>
                {initialData && onCancel && (
                    <button
                        onClick={(e) => { e.preventDefault(); onCancel(); }}
                        className={styles.secondaryButton}
                    >
                        Cancel
                    </button>
                )}
            </div>
            <form onSubmit={handleSubmit} className={styles.formRow}>
                <div className={styles.inputGroup}>
                    <label>Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className={styles.input}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label>Weight (lbs)</label>
                    <input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        required
                        className={styles.input}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label>Calories</label>
                    <input
                        type="number"
                        placeholder="0"
                        value={calories}
                        onChange={(e) => setCalories(e.target.value)}
                        required
                        className={styles.input}
                    />
                </div>
                <button type="submit" disabled={loading} className={styles.primaryButton}>
                    {loading ? "Saving..." : (initialData ? "Update" : "Add")}
                </button>
            </form>
        </div>
    );
}
