import { DailyEntry, UserSettings } from "./firebase/firestore";
import { calculateLinearRegression } from "./math-utils";
import { daysBetween } from "./date-utils";
import { CALORIES_PER_POUND, MIN_ENTRIES_FOR_TDEE, ANALYSIS_PERIOD_DAYS, LBS_TO_KG, TDEE_MIN_BOUND, TDEE_MAX_BOUND } from "./constants";

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
    // Use actual date offsets (not array indices) so gaps between entries are handled correctly
    const firstDate = recentEntries[0].date;
    const data = recentEntries.map(e => ({ x: daysBetween(firstDate, e.date), y: e.weight }));
    const regression = calculateLinearRegression(data);

    if (!regression) return null;

    const slope = regression.slope; // lbs per day change

    // 3. TDEE Calculation
    const caloricSurplusOrDeficit = slope * CALORIES_PER_POUND;
    const tdee = Math.max(TDEE_MIN_BOUND, Math.min(TDEE_MAX_BOUND, avgCals - caloricSurplusOrDeficit));

    return {
        tdee: Math.round(tdee),
        weightTrend: Number((slope * 7).toFixed(2)) // lbs per week
    };
};

/**
 * Calculates TDEE using the Mifflin-St Jeor formula.
 * Used during the setup phase when adaptive data is unreliable.
 *
 * Male:   BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
 * Female: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161
 * TDEE = BMR × activityLevel
 */
export function calculateFormulaTDEE(settings: UserSettings, currentWeight?: number): number | null {
    if (!settings.sex || !settings.age || !settings.heightCm || !settings.activityLevel) return null;

    const weight = currentWeight ?? settings.startingWeight;
    const weightKg = settings.units === 'kg' ? weight : weight * LBS_TO_KG;

    const bmr = settings.sex === 'male'
        ? (10 * weightKg) + (6.25 * settings.heightCm) - (5 * settings.age) + 5
        : (10 * weightKg) + (6.25 * settings.heightCm) - (5 * settings.age) - 161;

    return Math.round(bmr * settings.activityLevel);
}

