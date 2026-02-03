"use client";

import { useAuth } from "@/components/Auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import styles from "./page.module.css";
import Skeleton from "@/components/ui/Skeleton";

const sections = [
    {
        icon: "🔥",
        title: "What is TDEE?",
        content: `TDEE (Total Daily Energy Expenditure) is the total number of calories your body burns in a day. It includes:

• **BMR (Basal Metabolic Rate)**: Calories burned at complete rest
• **NEAT (Non-Exercise Activity)**: Walking, fidgeting, daily movement
• **TEF (Thermic Effect of Food)**: Energy used to digest food
• **EAT (Exercise Activity)**: Intentional workouts

Traditional TDEE calculators use estimates based on activity multipliers—which can be wildly inaccurate. This app calculates your *actual* TDEE from your own data.`
    },
    {
        icon: "⚖️",
        title: "The Energy Balance Equation",
        content: `Weight change follows a simple law of thermodynamics:

**Calories In − Calories Out = Weight Change**

• If you eat more than you burn → you gain weight
• If you eat less than you burn → you lose weight
• 1 pound of body fat ≈ 3,500 calories

This app uses your logged weight and calorie data to solve for your actual "Calories Out" (TDEE).`
    },
    {
        icon: "🧮",
        title: "The Math Behind the Scenes",
        content: `Here's how we calculate your real TDEE:

**Step 1: Calculate Your Calorie Balance**
Total Calories Eaten ÷ Days Tracked = Average Daily Intake

**Step 2: Calculate Your Weight Change**
(Ending Weight − Starting Weight) × 3,500 = Total Calorie Surplus/Deficit

**Step 3: Solve for TDEE**
TDEE = Average Daily Intake − (Total Surplus or Deficit ÷ Days)

**Example:** If you ate 2,000 cal/day for 14 days and lost 1 lb:
• Deficit = 1 lb × 3,500 = 3,500 calories total
• Daily deficit = 3,500 ÷ 14 = 250 cal/day
• TDEE = 2,000 + 250 = **2,250 calories/day**`
    },
    {
        icon: "📈",
        title: "Why More Data is Better",
        content: `The longer you track, the more accurate your TDEE becomes:

• **Week 1-2**: Water weight fluctuations can skew results by 500+ calories
• **Week 3-4**: Results stabilize, TDEE accuracy improves dramatically
• **Week 5+**: Highly accurate personalized TDEE

Water retention, sodium intake, hormonal cycles, and digestive contents all affect daily weight. The math smooths these out over time.`
    },
    {
        icon: "🎯",
        title: "Setting Your Target",
        content: `Once you know your TDEE, you can calculate your target intake:

**To lose weight (cutting):**
Target = TDEE − (Weekly Goal × 500)
• Lose 0.5 lb/week → eat TDEE − 250
• Lose 1 lb/week → eat TDEE − 500

**To gain weight (bulking):**
Target = TDEE + (Weekly Goal × 500)
• Gain 0.5 lb/week → eat TDEE + 250
• Gain 1 lb/week → eat TDEE + 500

**To maintain:**
Target = TDEE`
    },
    {
        icon: "🔄",
        title: "Adaptive Metabolism",
        content: `Your TDEE isn't fixed—it adapts over time:

• **Metabolic adaptation**: Extended diets can reduce TDEE by 10-15%
• **Activity changes**: More/less movement changes NEAT significantly
• **Weight changes**: Lighter bodies burn fewer calories

This is why continuous tracking beats one-time calculations. Your TDEE from 3 months ago may not be accurate today.`
    }
];

export default function HowItWorksPage() {
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
                <div className={styles.sectionsContainer}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className={styles.sectionCard}>
                            <div className={styles.sectionHeader}>
                                <Skeleton width={32} height={32} borderRadius="50%" />
                                <Skeleton width={200} height={28} />
                            </div>
                            <div className={styles.sectionContent}>
                                <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
                                <Skeleton width="90%" height={16} style={{ marginBottom: 8 }} />
                                <Skeleton width="95%" height={16} />
                            </div>
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
                <h1 className={styles.title}>How It Works</h1>
                <p className={styles.subtitle}>
                    The science and math behind accurate TDEE calculation
                </p>
            </header>

            <div className={styles.sectionsContainer}>
                {sections.map((section, index) => (
                    <div key={index} className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionIcon}>{section.icon}</span>
                            <h2 className={styles.sectionTitle}>{section.title}</h2>
                        </div>
                        <div className={styles.sectionContent}>
                            {section.content.split('\n').map((line, lineIndex) => {
                                // Handle bold text marked with **text**
                                const parts = line.split(/(\*\*[^*]+\*\*)/g);
                                return (
                                    <p key={lineIndex} className={line.startsWith('•') ? styles.bulletPoint : ''}>
                                        {parts.map((part, partIndex) => {
                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
                                            }
                                            return <span key={partIndex}>{part}</span>;
                                        })}
                                    </p>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <footer className={styles.footer}>
                <div className={styles.footerFormula}>
                    <span className={styles.formulaLabel}>The Core Formula</span>
                    <span className={styles.formula}>TDEE = Daily Intake + (Weight Change × 3,500 ÷ Days)</span>
                </div>
            </footer>
        </div>
    );
}
