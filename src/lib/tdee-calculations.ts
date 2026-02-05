import { DailyEntry } from "./firebase/firestore";
import { calculateLinearRegression } from "./math-utils";
import { CALORIES_PER_POUND, MIN_ENTRIES_FOR_TDEE, ANALYSIS_PERIOD_DAYS } from "./constants";

export interface TDEEResult {
    tdee: number;
    weightTrend: number; // lbs per week
    weeksToGoal?: number;
}

/**
 * Calculates TDEE based on the nSuns adaptive methodology.
 * 
 * Logic:
 * 1. Filter entries for the analysis period (default 3 weeks for stability).
 * 2. Calculate average daily calories consumed.
 * 3. Calculate weight trend (lbs/day) using linear regression on weight data to strictly smooth outliers.
 * 4. TDEE = AvgCalories - (DailyWeightChange * 3500)
 */
export const calculateTDEE = (entries: DailyEntry[]): TDEEResult | null => {
    // Need at least roughly a week of data to start showing meaningful numbers
    if (entries.length < MIN_ENTRIES_FOR_TDEE) return null;

    // Sort by date ascending
    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Use last ANALYSIS_PERIOD_DAYS for calculation if available, otherwise use what we have
    const recentEntries = sorted.slice(-ANALYSIS_PERIOD_DAYS);

    // 1. Average Calories
    const totalCals = recentEntries.reduce((sum, e) => sum + e.calories, 0);
    const avgCals = totalCals / recentEntries.length;

    // 2. Weight Trend using centralized linear regression
    const data = recentEntries.map((e, i) => ({ x: i, y: e.weight }));
    const regression = calculateLinearRegression(data);

    if (!regression) return null;

    const slope = regression.slope; // lbs per day change

    // 3. TDEE Calculation
    const caloricSurplusOrDeficit = slope * CALORIES_PER_POUND;
    const tdee = avgCals - caloricSurplusOrDeficit;

    return {
        tdee: Math.round(tdee),
        weightTrend: Number((slope * 7).toFixed(2)) // lbs per week
    };
};

export const getWeightTrend = (entries: DailyEntry[]) => {
    // Helper to just get the trend for the UI graph
    if (entries.length < 2) return [];
    // ... 
    return entries.map(e => ({ date: e.date, weight: e.weight }));
}
