"use client";

import { useAuth } from "@/components/Auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import styles from "./page.module.css";
import Skeleton from "@/components/ui/Skeleton";

const tips = [
    {
        icon: "📊",
        title: "Log Daily, Even If Imperfect",
        description: "Consistency beats perfection. Even if you estimate your calories, logging every day helps you see patterns and stay accountable. The data becomes more valuable over time."
    },
    {
        icon: "⚖️",
        title: "Weigh Yourself at the Same Time",
        description: "Weight fluctuates throughout the day. For the most accurate trend data, weigh yourself at the same time each day—ideally in the morning, after using the bathroom, before eating."
    },
    {
        icon: "📈",
        title: "Focus on Weekly Trends, Not Daily Numbers",
        description: "Day-to-day weight changes are mostly water and food volume. Look at your 7-day average trends instead. That's where real progress shows."
    },
    {
        icon: "🎯",
        title: "Adjust Based on Your TDEE",
        description: "After 3-4 weeks, your calculated TDEE becomes highly accurate. If you're not losing or gaining at your target rate, adjust your daily calorie intake by 100-200 calories."
    },
    {
        icon: "💪",
        title: "Be Patient",
        description: "Sustainable weight change happens at 0.5-1 lb per week for cutting, and 0.25-0.5 lb per week for lean bulking. Faster isn't always better—it often leads to muscle loss or excess fat gain."
    },
    {
        icon: "🥗",
        title: "Prioritize Protein",
        description: "Aim for 0.7-1g of protein per pound of bodyweight. High protein intake helps preserve muscle during a cut and build muscle during a bulk."
    },
    {
        icon: "💧",
        title: "Stay Hydrated",
        description: "Water weight can mask true progress for days. Stay well-hydrated (and consistently so) to minimize day-to-day scale fluctuations."
    },
    {
        icon: "😴",
        title: "Prioritize Sleep",
        description: "Poor sleep increases hunger hormones and water retention. Aim for 7-9 hours per night for optimal results and more consistent weigh-ins."
    },
    {
        icon: "🔄",
        title: "Take Diet Breaks",
        description: "If you've been cutting for 8-12 weeks, consider a 1-2 week maintenance period. This helps reset hormones, reduce fatigue, and makes your cut more sustainable."
    },
    {
        icon: "📝",
        title: "Trust the Process",
        description: "This app uses real math—your actual energy expenditure calculated from your own data. Trust the numbers, stay consistent, and the results will follow."
    }
];

export default function TipsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);


    if (loading) {
        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <Skeleton width={120} height={20} style={{ marginBottom: "1rem" }} />
                    <Skeleton width={250} height={48} style={{ marginBottom: "0.5rem" }} />
                    <Skeleton width={350} height={24} />
                </header>
                <div className={styles.tipsGrid}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={styles.tipCard}>
                            <div className={styles.tipIcon}>
                                <Skeleton width={40} height={40} borderRadius="50%" />
                            </div>
                            <Skeleton width={150} height={24} style={{ marginBottom: "0.5rem" }} />
                            <Skeleton width="100%" height={16} style={{ marginBottom: 4 }} />
                            <Skeleton width="90%" height={16} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button onClick={() => router.push("/dashboard")} className={styles.backButton}>
                    ← Back to Dashboard
                </button>
                <h1 className={styles.title}>Tips for Success</h1>
                <p className={styles.subtitle}>
                    Science-backed strategies to maximize your results
                </p>
            </header>

            <div className={styles.tipsGrid}>
                {tips.map((tip, index) => (
                    <div key={index} className={styles.tipCard}>
                        <div className={styles.tipIcon}>{tip.icon}</div>
                        <h2 className={styles.tipTitle}>{tip.title}</h2>
                        <p className={styles.tipDescription}>{tip.description}</p>
                    </div>
                ))}
            </div>

            <footer className={styles.footer}>
                <p>Remember: Small, consistent actions lead to big results over time.</p>
            </footer>
        </div>
    );
}
