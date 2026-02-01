import { DailyEntry } from "./firebase/firestore";

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
    if (entries.length < 7) return null;

    // Sort by date ascending
    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Use last 21 days for calculation if available, otherwise use what we have
    const recentEntries = sorted.slice(-21);

    // 1. Average Calories
    const totalCals = recentEntries.reduce((sum, e) => sum + e.calories, 0);
    const avgCals = totalCals / recentEntries.length;

    // 2. Weight Trend (Linear Regression)
    // We want the slope of the line (m) in y = mx + b
    // y = weight, x = days from start
    // This gives us avg lbs gained/lost per day

    const xValues = recentEntries.map((e, i) => i); // 0, 1, 2...
    const yValues = recentEntries.map(e => e.weight);

    const n = recentEntries.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // slope is "lbs per day" change

    // 3. TDEE Calculation
    // 3500 calories per lb of fat
    const caloricSurplusOrDeficit = slope * 3500;
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
