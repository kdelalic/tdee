import Link from "next/link";
import styles from "./page.module.css";

export default function AboutPage() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/" className={styles.backButton}>
                    ← Back to Home
                </Link>
                <h1 className={styles.title}>About TDEE Tracker</h1>
                <p className={styles.subtitle}>
                    A data-driven approach to body composition, built for those who want precision over guesswork.
                </p>
            </header>

            <main className={styles.content}>
                <section className={styles.card}>
                    <h2 className={styles.sectionTitle}>👋 The Mission</h2>
                    <p className={styles.text}>
                        TDEE Tracker was built to solve a common problem in fitness: static calculators are often wrong.
                        Most calorie calculators use generic formulas that don&apos;t account for your unique metabolism,
                        activity level, or hormonal fluctuations.
                    </p>
                    <p className={styles.text}>
                        This application takes a different approach. By applying the laws of thermodynamics to your
                        actual data (daily weight logs and calorie intake), we can mathematically solve for your
                        Total Daily Energy Expenditure with high precision.
                    </p>
                </section>

                <section className={styles.card}>
                    <h2 className={styles.sectionTitle}>🚀 How It Helps</h2>
                    <p className={styles.text}>
                        Whether you are looking to cut fat, bulk up properly, or maintain your current physique,
                        knowing your true TDEE is the most powerful tool you can have.
                    </p>
                    <p className={styles.text}>
                        This adaptive system updates daily, smoothing out water weight fluctuations and giving you
                        a clear target to hit your weekly goals without the guesswork.
                    </p>
                </section>
            </main>

            <footer className={styles.footer}>
                <p>&copy; {new Date().getFullYear()} TDEE Tracker. All rights reserved.</p>
            </footer>
        </div>
    );
}
