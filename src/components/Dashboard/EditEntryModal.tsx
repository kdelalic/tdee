"use client";

import { useState, useEffect } from "react";
import { updateDailyEntry, DailyEntry } from "@/lib/firebase/firestore";
import styles from "./EditEntryModal.module.css";

interface EditEntryModalProps {
    entry: DailyEntry;
    userId: string;
    onSave: () => void;
    onClose: () => void;
}

export default function EditEntryModal({ entry, userId, onSave, onClose }: EditEntryModalProps) {
    const [weight, setWeight] = useState(entry.weight.toString());
    const [calories, setCalories] = useState(entry.calories.toString());
    const [loading, setLoading] = useState(false);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateDailyEntry(userId, entry, {
                date: entry.date,
                weight: parseFloat(weight),
                calories: parseInt(calories),
            });
            onSave();
        } catch (error) {
            console.error("Failed to update entry", error);
            alert("Failed to update entry");
        } finally {
            setLoading(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Format date for display
    const displayDate = new Date(entry.date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Edit Entry</h2>
                    <button onClick={onClose} className={styles.closeButton} aria-label="Close">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <p className={styles.date}>{displayDate}</p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="edit-weight">Weight (lbs)</label>
                        <input
                            id="edit-weight"
                            type="number"
                            step="0.1"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            required
                            className={styles.input}
                            autoFocus
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="edit-calories">Calories</label>
                        <input
                            id="edit-calories"
                            type="number"
                            value={calories}
                            onChange={(e) => setCalories(e.target.value)}
                            required
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelButton}>
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className={styles.saveButton}>
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
