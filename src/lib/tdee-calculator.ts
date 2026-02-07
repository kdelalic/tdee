import { DailyEntry, UserSettings } from "./firebase/firestore";
import { calculateFormulaTDEE } from "./tdee-calculations";
import { isInSetupPhase } from "./date-utils";
import { SETUP_PHASE_DAYS, FALLBACK_TDEE_MULTIPLIER } from "./constants";

export interface TDEEStats {
    currentWeight: number;
    totalLost: number;
    tdee: number;
    targetDeficit: number;
    targetCalories: number;
    weeksToGoal: number;
    goalDate: string;
}

/**
 * Calculates a simple moving average of weight.
 * For a real TDEE sheet, this is usually more complex (exponential smoothing),
 * but strict average of last 7 entries is a good start.
 */
function calculateAverageWeight(entries: DailyEntry[], days = 7): number {
    if (entries.length === 0) return 0;
    const recent = entries.slice(0, days);
    const sum = recent.reduce((acc, curr) => acc + curr.weight, 0);
    return sum / recent.length;
}

/**
 * Calculates the Total Daily Energy Expenditure (TDEE).
 * 
 * Basic Logic:
 * TDEE = (Average Daily Calories) - (Average Daily Weight Change * 3500)
 * 
 * This requires at least 2 weeks of data to be somewhat accurate, 
 * comparing Week 1 Avg Weight vs Week 2 Avg Weight.
 * 
 * For V1, if we don't have enough data, we might return a placeholder or 
 * a standard estimate if we had height/age/gender (which we don't yet).
 * So we will return null if insufficient data.
 */
export function calculateAdaptiveTDEE(entries: DailyEntry[]): number | null {
    // We need at least 14 days of data to compare two weeks?
    // Or at least start vs end of a period.
    if (entries.length < 7) return null;

    // Let's take the last 2 weeks if available, or just last 1 week change vs intake?
    // Better: Average Calories consumed over last 2 weeks + (Weight Lost * 3500 / days)

    // Sort entries by date desc (assuming they come in that way, but safety first)
    const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const daysToAnalyze = Math.min(sorted.length, 14); // Analyze up to 2 weeks
    if (daysToAnalyze < 2) return null;

    const periodEntries = sorted.slice(0, daysToAnalyze);

    // Average Calories
    const avgCalories = periodEntries.reduce((acc, e) => acc + e.calories, 0) / daysToAnalyze;

    // Weight Change Rate
    // Simplest: Linear regression or just (Start - End) / days?
    // Using (First - Last) / days is prone to fluctuations.
    // Let's use average of first 3 days vs average of last 3 days of the period for smoothing?
    // If we have 14 days: Avg(days 0-2) [newest] vs Avg(days 11-13) [oldest]

    let weightDiff = 0;
    const windowSize = Math.max(1, Math.floor(daysToAnalyze / 4)); // e.g., 3 days for 14 day period

    const newestWindow = periodEntries.slice(0, windowSize); // Most recent
    const oldestWindow = periodEntries.slice(periodEntries.length - windowSize); // Oldest in period

    const avgWeightNew = newestWindow.reduce((a, b) => a + b.weight, 0) / newestWindow.length;
    const avgWeightOld = oldestWindow.reduce((a, b) => a + b.weight, 0) / oldestWindow.length;

    const timeSpanDays = daysToAnalyze - windowSize; // Rough time distance between centers of windows? 
    // Actually exact diff in days between the average dates would be better, but simplified:
    // If 14 days, indices 0-2 vs 11-13. Center ~1 vs ~12. Diff ~11 days.

    // Let's just use: (NewWt - OldWt) is the change.
    // Negative change = weight loss.
    // e.g. Old 200, New 198. Change = -2 lbs.
    const totalChange = avgWeightNew - avgWeightOld;

    // Daily Change
    const dailyChange = totalChange / timeSpanDays;

    // 3500 calories per lb
    const dailyDeficitOrSurplus = dailyChange * 3500;

    // TDEE = Intaken - Surplus (or + Deficit)
    // If I ate 2500 and GAINED 0.1 lb (350 cal surplus), TDEE was 2150.
    // TDEE = 2500 - 350;

    // If I ate 2000 and LOST 0.1 lb (-350 cal deficit), TDEE was 2350.
    // TDEE = 2000 - (-350) = 2350.

    return Math.round(avgCalories - dailyDeficitOrSurplus);
}

export function calculateStats(
    entries: DailyEntry[],
    settings: UserSettings
): TDEEStats {
    const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const currentWeight = sorted.length > 0 ? sorted[0].weight : settings.startingWeight;
    const totalLost = settings.startingWeight - currentWeight;

    // Calculate TDEE
    // During setup phase, use Mifflin-St Jeor formula since adaptive data is unreliable
    // (water weight / glycogen fluctuations skew the adaptive calculation)
    let tdee = calculateAdaptiveTDEE(sorted);
    if (tdee === null || isInSetupPhase(settings.startDate, SETUP_PHASE_DAYS)) {
        const formulaTdee = calculateFormulaTDEE(settings, currentWeight);
        tdee = formulaTdee ?? Math.round(currentWeight * FALLBACK_TDEE_MULTIPLIER);
    }

    // Target Calculations
    // 1 lb = 3500 cal
    // Weekly Goal (e.g. -1.5)
    // Daily Deficit needed = (-1.5 * 3500) / 7 = -750
    // Note: If goal is negative (loss), result is negative deficit.
    // If goal is positive (gain), result is positive surplus.

    const dailyTargetDiff = (settings.weeklyGoal * 3500) / 7;

    // If I want to lose, my target calories should be TDEE + dailyTargetDiff (which is negative)
    const targetCalories = Math.round(tdee + dailyTargetDiff);

    // Weeks until goal
    // Remaining amount
    const remaining = currentWeight - settings.goalWeight;
    // Rate is settings.weeklyGoal (e.g. -1)
    // If remaining is 20 (loss needed) and rate is -1: 20 / -(-1) ? 
    // Logic: We want to bridge the gap.
    // Gap = Goal - Current. (e.g. 180 - 200 = -20)
    // Rate = -1.
    // Weeks = -20 / -1 = 20 weeks.

    let weeksToGoal = 0;
    if (settings.weeklyGoal !== 0) {
        weeksToGoal = (settings.goalWeight - currentWeight) / settings.weeklyGoal;
    }
    // If weeksToGoal is negative, it means we are moving away from goal or already passed it?
    // If Goal 220, Current 200 (Need +20). Rate +1. Weeks = 20/1 = 20. Correct.
    // If Goal 180, Current 200 (Need -20). Rate +1 (Wrong direction). Weeks = -20.

    if (weeksToGoal < 0) {
        // Infinite? Or just 0 (done)?
        // If we are "done" (passed goal in correct direction), 0.
        // If wrong direction, maybe Infinity.
        // Let's just treat < 0 as 0 for "done" if the diff is small, or handle edge case.
        weeksToGoal = 0;
    }

    // Goal Date
    const today = new Date();
    const goalDateObj = new Date(today);
    goalDateObj.setDate(today.getDate() + (weeksToGoal * 7));

    // Format Date string
    const goalDate = goalDateObj.toLocaleDateString("en-US", {
        year: 'numeric', month: 'short', day: 'numeric'
    });

    return {
        currentWeight,
        totalLost: parseFloat(totalLost.toFixed(1)),
        tdee,
        targetDeficit: Math.round(dailyTargetDiff), // This will be e.g. -500
        targetCalories,
        weeksToGoal: parseFloat(weeksToGoal.toFixed(1)),
        goalDate
    };
}
