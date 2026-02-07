import { DailyEntry } from "@/lib/firebase/firestore";
import { escapeCSV } from "@/lib/validation";
import { formatDisplayDate } from "@/lib/date-utils";
import styles from "./Dashboard.module.css";

interface HistoryTableProps {
    entries: DailyEntry[];
    onDelete: (id: string) => void;
    onEdit: (entry: DailyEntry) => void;
}

export default function HistoryTable({ entries, onDelete, onEdit }: HistoryTableProps) {
    // Format date helper using centralized date utility
    const formatDate = (dateString: string) =>
        formatDisplayDate(dateString, { month: 'short', day: 'numeric', year: 'numeric' });

    const handleExport = () => {
        if (!entries.length) return;

        // Create CSV content with proper escaping
        const headers = ["Date", "Weight (lbs)", "Calories"];
        const rows = entries.map(e => [
            escapeCSV(e.date),
            escapeCSV(e.weight),
            escapeCSV(e.calories)
        ]);

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

            {/* Desktop Table View */}
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
                                    <td>{typeof entry.weight === 'number' ? entry.weight.toLocaleString() : entry.weight}</td>
                                    <td>{typeof entry.calories === 'number' ? entry.calories.toLocaleString() : entry.calories}</td>

                                    <td>
                                        <button
                                            onClick={() => onEdit(entry)}
                                            className={`${styles.actionButton} ${styles.editButton}`}
                                            aria-label={`Edit entry for ${formatDate(entry.date)}`}
                                            title="Edit"
                                        >
                                            <span aria-hidden="true">✏️</span>
                                        </button>
                                        <button
                                            onClick={() => entry.id && onDelete(entry.id)}
                                            className={`${styles.actionButton} ${styles.deleteButton}`}
                                            aria-label={`Delete entry for ${formatDate(entry.date)}`}
                                            title="Delete"
                                        >
                                            <span aria-hidden="true">❌</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className={styles.mobileCards}>
                {entries.length === 0 ? (
                    <div className={styles.emptyStateMessage}>
                        <span className={styles.emptyStateIcon}>📝</span>
                        <span>No entries yet. Start tracking to see your history!</span>
                    </div>
                ) : (
                    entries.map((entry) => (
                        <div key={entry.id || entry.date} className={styles.mobileCard}>
                            <div className={styles.mobileCardHeader}>
                                <span className={styles.mobileCardDate}>{formatDate(entry.date)}</span>
                                <div className={styles.mobileCardActions}>
                                    <button
                                        onClick={() => onEdit(entry)}
                                        className={`${styles.actionButton} ${styles.editButton}`}
                                        aria-label={`Edit entry for ${formatDate(entry.date)}`}
                                    >
                                        <span aria-hidden="true">✏️</span>
                                    </button>
                                    <button
                                        onClick={() => entry.id && onDelete(entry.id)}
                                        className={`${styles.actionButton} ${styles.deleteButton}`}
                                        aria-label={`Delete entry for ${formatDate(entry.date)}`}
                                    >
                                        <span aria-hidden="true">❌</span>
                                    </button>
                                </div>
                            </div>
                            <div className={styles.mobileCardBody}>
                                <div className={styles.mobileCardStat}>
                                    <span className={styles.mobileCardLabel}>Weight</span>
                                    <span className={styles.mobileCardValue}>{typeof entry.weight === 'number' ? entry.weight.toLocaleString() : entry.weight} lbs</span>
                                </div>
                                <div className={styles.mobileCardStat}>
                                    <span className={styles.mobileCardLabel}>Calories</span>
                                    <span className={styles.mobileCardValue}>{typeof entry.calories === 'number' ? entry.calories.toLocaleString() : entry.calories}</span>
                                </div>
                            </div>

                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
