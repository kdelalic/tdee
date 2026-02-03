"use client";

import { useState } from "react";
import { addDailyEntry, getDailyEntry } from "@/lib/firebase/firestore";
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const entryData = {
                date,
                weight: parseFloat(weight),
                calories: parseInt(calories),
            };

            if (entryData.weight < 0 || entryData.calories < 0) {
                alert("Values cannot be negative");
                setLoading(false);
                return;
            }

            // Check for existing entry
            const existing = await getDailyEntry(userId, date);
            if (existing) {
                const confirmed = window.confirm("An entry for this date already exists. Do you want to overwrite it?");
                if (!confirmed) {
                    setLoading(false);
                    return;
                }
            }

            await addDailyEntry(userId, entryData);

            setWeight("");
            setCalories("");
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
            <h2 className={styles.cardTitle}>Add Daily Entry</h2>
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
                        min="0"
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
                        min="0"
                        placeholder="0"
                        value={calories}
                        onChange={(e) => setCalories(e.target.value)}
                        required
                        className={styles.input}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label>&nbsp;</label>
                    <button type="submit" disabled={loading} className={styles.primaryButton}>
                        {loading ? "Saving..." : "Add"}
                    </button>
                </div>
            </form>
        </div>
    );
}
