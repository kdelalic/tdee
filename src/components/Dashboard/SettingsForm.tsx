"use client";

import { useState, useEffect } from "react";
import { UserSettings, updateUserSettings } from "@/lib/firebase/firestore";
import { useToast } from "@/components/ui/Toast";
import styles from "./Dashboard.module.css";

interface SettingsFormProps {
    userId: string;
    existingSettings: UserSettings | null;
    onSave: () => void;
    onCancel?: () => void;
}

type GoalType = 'cut' | 'bulk' | 'maintain';

export default function SettingsForm({ userId, existingSettings, onSave, onCancel }: SettingsFormProps) {
    // Form State
    const [units, setUnits] = useState<'lb' | 'kg'>('lb');
    const [startDate, setStartDate] = useState("");
    const [startingWeight, setStartingWeight] = useState("");
    const [goalWeight, setGoalWeight] = useState("");
    const [goalType, setGoalType] = useState<GoalType>('cut');
    const [weeklyGoalRate, setWeeklyGoalRate] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();

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
        } else {
            // New user: prepopulate date
            const now = new Date();
            setStartDate(now.toISOString().split('T')[0]);
        }
    }, [existingSettings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const startW = parseFloat(startingWeight);
        const goalW = parseFloat(goalWeight);
        const rate = parseFloat(weeklyGoalRate);

        if (startW < 0 || goalW < 0 || rate < 0) {
            showToast("Values cannot be negative", "error");
            setLoading(false);
            return;
        }

        if (startW <= 0) {
            setError("Starting weight must be positive");
            setLoading(false);
            return;
        }

        if (goalType !== 'maintain') {
            if (goalW <= 0) {
                setError("Goal weight must be positive");
                setLoading(false);
                return;
            }
            if (rate <= 0) {
                setError("Target rate must be positive");
                setLoading(false);
                return;
            }
            if (goalType === 'cut' && goalW >= startW) {
                setError("For cutting, goal weight must be less than current weight");
                setLoading(false);
                return;
            }
            if (goalType === 'bulk' && goalW <= startW) {
                setError("For bulking, goal weight must be greater than current weight");
                setLoading(false);
                return;
            }
        }

        let finalWeeklyGoal = 0;

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
            startingWeight: startW,
            goalWeight: goalType === 'maintain' ? startW : goalW, // if maintaining, goal is to stay at start weight (conceptually) or we effectively ignore it
            weeklyGoal: finalWeeklyGoal,
            goal: goalType
        };

        try {
            await updateUserSettings(userId, newSettings);
            showToast("Settings saved");
            onSave();
        } catch (err) {
            console.error(err);
            setError("Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    const getValidationError = () => {
        const startW = parseFloat(startingWeight);
        const goalW = parseFloat(goalWeight);
        const rate = parseFloat(weeklyGoalRate);

        if (isNaN(startW) || startW <= 0) return "Starting weight must be positive";
        if (!startDate) return null; // Date is required but browser handles it, or strictly: "Start date is required"

        if (goalType !== 'maintain') {
            if (isNaN(goalW) || goalW <= 0) return "Goal weight must be positive";
            if (isNaN(rate) || rate <= 0) return "Target rate must be positive";

            if (goalType === 'cut' && goalW >= startW) return "For cutting, goal weight must be less than current weight";
            if (goalType === 'bulk' && goalW <= startW) return "For bulking, goal weight must be greater than current weight";
        }
        return null;
    };

    const validationError = getValidationError();

    return (
        <div className={styles.card}>
            <div className={styles.settingsHeader}>
                <h2 className={styles.accordionTitle}>
                    {existingSettings ? "Settings & Goals" : "Initial Setup"}
                </h2>
                {!existingSettings && <span className={styles.badge}>Required</span>}
            </div>

            {(error || validationError) && (
                <div className={styles.errorBanner}>
                    {error || validationError}
                </div>
            )}

            <form onSubmit={handleSubmit} className={styles.settingsForm}>
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
                        <div className={styles.selectWrapper}>
                            <select
                                value={units}
                                onChange={e => setUnits(e.target.value as 'lb' | 'kg')}
                                className={`${styles.input} ${styles.selectInput}`}
                            >
                                <option value="lb">Lb</option>
                                <option value="kg">Kg</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className={styles.inputGroup}>
                        <label>Starting Weight ({units})</label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
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
                            min="0"
                            value={goalWeight}
                            onChange={e => setGoalWeight(e.target.value)}
                            required={goalType !== 'maintain'}
                            disabled={goalType === 'maintain'}
                            className={`${styles.input} ${goalType === 'maintain' ? styles.disabledInput : ''}`}
                            style={goalType === 'maintain' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
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
                                📉 <span className={styles.hideOnMobile}>Cut (Lose)</span><span className={styles.showOnMobile}>Cut</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setGoalType('maintain');
                                    setGoalWeight(startingWeight); // Auto-set goal to start when maintaining
                                }}
                                className={`${styles.toggleButton} ${goalType === 'maintain' ? styles.maintainActive : ''}`}
                            >
                                ⚖️ <span className={styles.hideOnMobile}>Maintain</span><span className={styles.showOnMobile}>Maint.</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setGoalType('bulk')}
                                className={`${styles.toggleButton} ${goalType === 'bulk' ? styles.bulkActive : ''}`}
                            >
                                💪 <span className={styles.hideOnMobile}>Bulk (Gain)</span><span className={styles.showOnMobile}>Bulk</span>
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

                <div className={styles.settingsActions}>
                    <button
                        type="submit"
                        disabled={loading || !!validationError}
                        title={validationError || "Save settings"}
                        className={`${styles.primaryButton} ${styles.fullWidth}`}
                    >
                        {loading ? "Saving..." : "Save Settings"}
                    </button>

                    {existingSettings && onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className={styles.secondaryButton}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
