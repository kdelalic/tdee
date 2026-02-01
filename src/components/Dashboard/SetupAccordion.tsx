"use client";

import { useState, useEffect } from "react";
import { UserSettings, updateUserSettings } from "@/lib/firebase/firestore";
import styles from "./Dashboard.module.css";

interface SetupAccordionProps {
    userId: string;
    existingSettings: UserSettings | null;
    onSave: () => void;
}

export default function SetupAccordion({ userId, existingSettings, onSave }: SetupAccordionProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Form State
    const [units, setUnits] = useState<'lb' | 'kg'>('lb');
    const [startDate, setStartDate] = useState("");
    const [startingWeight, setStartingWeight] = useState("");
    const [goalWeight, setGoalWeight] = useState("");
    const [weeklyGoal, setWeeklyGoal] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (existingSettings) {
            setUnits(existingSettings.units || 'lb');
            setStartDate(existingSettings.startDate || "");
            setStartingWeight(existingSettings.startingWeight?.toString() || "");
            setGoalWeight(existingSettings.goalWeight?.toString() || "");
            setWeeklyGoal(existingSettings.weeklyGoal?.toString() || "");

            // If settings exist, default to closed
            setIsOpen(false);
        } else {
            // New user: Default open and prepopulate date
            setIsOpen(true);
            const now = new Date();
            setStartDate(now.toISOString().split('T')[0]);
        }
    }, [existingSettings]);

    const toggleOpen = () => {
        setIsOpen(!isOpen);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const newSettings: Partial<UserSettings> = {
            units,
            startDate,
            startingWeight: parseFloat(startingWeight),
            goalWeight: parseFloat(goalWeight),
            weeklyGoal: parseFloat(weeklyGoal),
            goal: parseFloat(weeklyGoal) < 0 ? 'cut' : (parseFloat(weeklyGoal) > 0 ? 'bulk' : 'maintain')
        };

        try {
            await updateUserSettings(userId, newSettings);
            // On successful save, close accordion if it was open (optional, but good UX)
            // But if it was initial setup, we might want to keep it closed.
            setIsOpen(false);
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
            <div
                className={styles.accordionHeader}
                onClick={toggleOpen}
                role="button"
                tabIndex={0}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h2 className={styles.accordionTitle}>
                        {existingSettings ? "Edit Setup & Goals" : "Initial Setup (Required)"}
                    </h2>
                    {!existingSettings && <span className={styles.badge}>Start Here</span>}
                </div>
                <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>
                    ▼
                </span>
            </div>

            {isOpen && (
                <form onSubmit={handleSubmit} className={`${styles.settingsForm} ${styles.accordionContent}`}>
                    <div className={styles.formGrid}>
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
                                <input
                                    type="number"
                                    step="0.1"
                                    value={weeklyGoal}
                                    onChange={e => setWeeklyGoal(e.target.value)}
                                    required
                                    placeholder="-1.0 (loss) / 0.5 (gain)"
                                    className={styles.input}
                                />
                                <span className={styles.helperText}>
                                    (Neg = Loss)
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`${styles.primaryButton} ${styles.fullWidth}`}
                    >
                        {loading ? "Saving..." : "Save Settings"}
                    </button>

                    {existingSettings && (
                        <div className={styles.cancelLink} onClick={() => setIsOpen(false)}>
                            Cancel
                        </div>
                    )}
                </form>
            )}
        </div>
    );
}
