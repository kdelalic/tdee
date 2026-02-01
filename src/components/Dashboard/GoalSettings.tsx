"use client";

import { useState, useEffect } from "react";
import { UserSettings, updateUserSettings } from "@/lib/firebase/firestore";
import styles from "./Dashboard.module.css"; // We might need to add styles here

interface GoalSettingsProps {
    userId: string;
    existingSettings: UserSettings | null;
    onSave: () => void;
}

export default function GoalSettings({ userId, existingSettings, onSave }: GoalSettingsProps) {
    const [units, setUnits] = useState<'lb' | 'kg'>('lb');
    const [startDate, setStartDate] = useState("");
    const [startingWeight, setStartingWeight] = useState("");
    const [goalWeight, setGoalWeight] = useState("");
    const [weeklyGoal, setWeeklyGoal] = useState(""); // String to handle decimals easily
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (existingSettings) {
            setUnits(existingSettings.units || 'lb');
            setStartDate(existingSettings.startDate || "");
            setStartingWeight(existingSettings.startingWeight?.toString() || "");
            setGoalWeight(existingSettings.goalWeight?.toString() || "");
            setWeeklyGoal(existingSettings.weeklyGoal?.toString() || "");
        } else {
            // Default Start Date to today if new
            const now = new Date();
            setStartDate(now.toISOString().split('T')[0]);
        }
    }, [existingSettings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const newSettings: Partial<UserSettings> = {
            units,
            startDate,
            startingWeight: parseFloat(startingWeight),
            goalWeight: parseFloat(goalWeight),
            weeklyGoal: parseFloat(weeklyGoal),
            // Maintain existing goal type 'cut'/'bulk' based on sign of weeklyGoal?
            // Or just ignore the enum for now as it's redundant with exact rate?
            goal: parseFloat(weeklyGoal) < 0 ? 'cut' : (parseFloat(weeklyGoal) > 0 ? 'bulk' : 'maintain')
        };

        try {
            await updateUserSettings(userId, newSettings);
            onSave();
        } catch (err) {
            console.error(err);
            alert("Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.card}>
            <h2 className={styles.cardTitle}>Initial Inputs</h2>
            <form onSubmit={handleSubmit} className={styles.settingsForm}>
                <div className={styles.inputGroup}>
                    <label>Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        required
                        className={styles.input}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label>Units</label>
                    <select
                        value={units}
                        onChange={e => setUnits(e.target.value as 'lb' | 'kg')}
                        className={styles.input}
                    >
                        <option value="lb">Lb</option>
                        <option value="kg">Kg</option>
                    </select>
                </div>

                <div className={styles.inputGroup}>
                    <label>Starting Weight ({units})</label>
                    <input
                        type="number"
                        step="0.1"
                        value={startingWeight}
                        onChange={e => setStartingWeight(e.target.value)}
                        required
                        className={styles.input}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label>Goal Weight ({units})</label>
                    <input
                        type="number"
                        step="0.1"
                        value={goalWeight}
                        onChange={e => setGoalWeight(e.target.value)}
                        required
                        className={styles.input}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label>Weekly Goal ({units}/wk)</label>
                    <div className={styles.inputWithHelper}>
                        {/* Helper to make it intuitive: "Lose" or "Gain" */}
                        <input
                            type="number"
                            step="0.1"
                            value={weeklyGoal}
                            onChange={e => setWeeklyGoal(e.target.value)}
                            required
                            placeholder="-1.0 for loss, 0.5 for gain"
                            className={styles.input}
                        />
                        <span className={styles.helperText}>
                            (Neg = Loss)
                        </span>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`${styles.primaryButton} ${styles.fullWidth}`}
                >
                    {loading ? "Saving..." : "Save Settings"}
                </button>
            </form>
        </div>
    );
}
