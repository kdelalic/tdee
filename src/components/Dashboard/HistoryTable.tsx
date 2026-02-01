import { DailyEntry } from "@/lib/firebase/firestore";
import styles from "./Dashboard.module.css";

interface HistoryTableProps {
    entries: DailyEntry[];
    onDelete: (id: string) => void;
    onEdit: (entry: DailyEntry) => void;
}

export default function HistoryTable({ entries, onDelete, onEdit }: HistoryTableProps) {
    return (
        <div className={styles.card}>
            <h2 className={styles.cardTitle}>Recent Entries</h2>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Weight (lbs)</th>
                            <th>Calories</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ textAlign: "center", padding: "2rem" }}>
                                    No entries yet. Start tracking!
                                </td>
                            </tr>
                        ) : (
                            entries.map((entry) => (
                                <tr key={entry.id || entry.date}>
                                    <td>{entry.date}</td>
                                    <td>{entry.weight}</td>
                                    <td>{entry.calories}</td>
                                    <td>
                                        <button
                                            onClick={() => onEdit(entry)}
                                            className={styles.editButton}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', marginRight: '0.5rem' }}
                                            aria-label="Edit entry"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => entry.id && onDelete(entry.id)}
                                            className={styles.deleteButton}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                                            aria-label="Delete entry"
                                        >
                                            ❌
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
