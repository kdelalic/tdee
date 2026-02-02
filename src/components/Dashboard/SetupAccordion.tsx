"use client";

import { useState, useEffect } from "react";
import { UserSettings, updateUserSettings } from "@/lib/firebase/firestore";
import styles from "./Dashboard.module.css";

interface SetupAccordionProps {
    userId: string;
    existingSettings: UserSettings | null;
    onSave: () => void;
}

type GoalType = 'cut' | 'bulk' | 'maintain';

export default function SetupAccordion({ userId, existingSettings, onSave }: SetupAccordionProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Form State
    const [units, setUnits] = useState<'lb' | 'kg'>('lb');
    const [startDate, setStartDate] = useState("");
    const [startingWeight, setStartingWeight] = useState("");
    const [goalWeight, setGoalWeight] = useState("");
    const [goalType, setGoalType] = useState<GoalType>('cut');
    const [weeklyGoalRate, setWeeklyGoalRate] = useState(""); // Always positive for input
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (existingSettings) {
            setUnits(existingSettings.units || 'lb');
            setStartDate(existingSettings.startDate || "");
            setStartingWeight(existingSettings.startingWeight?.toString() || "");
            setGoalWeight(existingSettings.goalWeight?.toString() || "");

            // Determine Goal Type and Rate
            const rate = existingSettings.weeklyGoal || 0;
            if (rate < 0) {
                setGoalType('cut');
                setWeeklyGoalRate(Math.abs(rate).toString());
            } else if (rate > 0) {
                setGoalType('bulk');
                setWeeklyGoalRate(rate.toString());
            } else {
                setGoalType('maintain');
                setWeeklyGoalRate("0");
            }

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

        let finalWeeklyGoal = 0;
        const rate = parseFloat(weeklyGoalRate);

        if (goalType === 'cut') {
            finalWeeklyGoal = -Math.abs(rate);
        } else if (goalType === 'bulk') {
            finalWeeklyGoal = Math.abs(rate);
        } else {
            finalWeeklyGoal = 0;
        }

        const newSettings: Partial<UserSettings> = {
            units,
            startDate,
            startingWeight: parseFloat(startingWeight),
            goalWeight: parseFloat(goalWeight),
            weeklyGoal: finalWeeklyGoal,
            goal: goalType
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
                    <div className={styles.setupGrid}>
                        {/* Row 1 */}
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

                        {/* Row 2 */}
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

                        {/* Row 3 - Full Width Goal Selector */}
                        <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                            <label style={{ marginBottom: '0.25rem' }}>Goal Strategy</label>
                            <div className={styles.toggleContainer}>
                                <button
                                    type="button"
                                    onClick={() => setGoalType('cut')}
                                    className={`${styles.toggleButton} ${goalType === 'cut' ? styles.cutActive : ''}`}
                                >
                                    📉 Cut (Lose)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setGoalType('maintain')}
                                    className={`${styles.toggleButton} ${goalType === 'maintain' ? styles.maintainActive : ''}`}
                                >
                                    ⚖️ Maintain
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setGoalType('bulk')}
                                    className={`${styles.toggleButton} ${goalType === 'bulk' ? styles.bulkActive : ''}`}
                                >
                                    💪 Bulk (Gain)
                                </button>
                            </div>
                        </div>

                        {/* Row 4 - Conditional Rate */}
                        {goalType !== 'maintain' && (
                            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                                <label>Target {goalType === 'cut' ? 'Loss' : 'Gain'} Rate ({units}/week)</label>
                                <div className={styles.inputWithHelper}>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={weeklyGoalRate}
                                        onChange={e => setWeeklyGoalRate(e.target.value)}
                                        required
                                        placeholder="1.0"
                                        className={`${styles.input} ${styles.compactInput}`}
                                    />
                                    <span className={styles.helperText}>
                                        Recommended: 0.5 - 1.5 {units}/week
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
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
                    </div>
                </form>
            )}
        </div>
    );
}
