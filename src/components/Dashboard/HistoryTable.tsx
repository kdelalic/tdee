import { DailyEntry } from "@/lib/firebase/firestore";
import styles from "./Dashboard.module.css";

interface HistoryTableProps {
    entries: DailyEntry[];
    onDelete: (id: string) => void;
    onEdit: (entry: DailyEntry) => void;
}

export default function HistoryTable({ entries, onDelete, onEdit }: HistoryTableProps) {
    // Format date helper
    const formatDate = (dateString: string) => {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleExport = () => {
        if (!entries.length) return;

        // Create CSV content
        const headers = ["Date", "Weight (lbs)", "Calories"];
        const rows = entries.map(e => [e.date, e.weight, e.calories]);

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        // Create download link
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `tdee_data_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={styles.card}>
            <div className={styles.tableHeader}>
                <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>Recent Entries</h2>
                {entries.length > 0 && (
                    <button
                        onClick={handleExport}
                        className={styles.secondaryButton}
                        title="Download CSV"
                    >
                        Export CSV
                    </button>
                )}
            </div>
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
                                <td colSpan={4} className={styles.emptyStateCell}>
                                    <div className={styles.emptyStateMessage}>
                                        <span className={styles.emptyStateIcon}>📝</span>
                                        <span>No entries yet. Start tracking to see your history!</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            entries.map((entry) => (
                                <tr key={entry.id || entry.date}>
                                    <td>{formatDate(entry.date)}</td>
                                    <td>{entry.weight}</td>
                                    <td>{entry.calories}</td>
                                    <td>
                                        <button
                                            onClick={() => onEdit(entry)}
                                            className={`${styles.actionButton} ${styles.editButton}`}
                                            aria-label="Edit entry"
                                            title="Edit"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => entry.id && onDelete(entry.id)}
                                            className={`${styles.actionButton} ${styles.deleteButton}`}
                                            aria-label="Delete entry"
                                            title="Delete"
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
