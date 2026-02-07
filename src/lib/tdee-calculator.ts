import { DailyEntry, UserSettings } from "./firebase/firestore";
import { calculateTDEE, calculateFormulaTDEE } from "./tdee-calculations";
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
    let tdee = calculateTDEE(sorted)?.tdee ?? null;
    if (tdee === null || isInSetupPhase(settings.startDate, SETUP_PHASE_DAYS)) {
        const formulaTdee = calculateFormulaTDEE(settings, currentWeight);
        tdee = formulaTdee ?? Math.round(currentWeight * FALLBACK_TDEE_MULTIPLIER);
    }

    // Target Calculations
    // Daily Deficit needed = (weeklyGoal * 3500) / 7
    // Negative goal (loss) → negative deficit, positive goal (gain) → positive surplus
    const dailyTargetDiff = (settings.weeklyGoal * 3500) / 7;

    // Target calories = TDEE + dailyTargetDiff (negative for loss, positive for gain)
    const targetCalories = Math.round(tdee + dailyTargetDiff);

    // Weeks to goal with directional awareness
    let weeksToGoal = 0;
    if (settings.weeklyGoal !== 0) {
        const gap = settings.goalWeight - currentWeight;
        const sameDirection = Math.sign(gap) === Math.sign(settings.weeklyGoal);
        if (sameDirection) {
            weeksToGoal = gap / settings.weeklyGoal;
        }
        // If not same direction, user has already passed their goal → weeksToGoal stays 0
    }

    // Goal Date
    const today = new Date();
    const goalDateObj = new Date(today);
    goalDateObj.setDate(today.getDate() + (weeksToGoal * 7));

    const goalDate = goalDateObj.toLocaleDateString("en-US", {
        year: 'numeric', month: 'short', day: 'numeric'
    });

    return {
        currentWeight,
        totalLost: parseFloat(totalLost.toFixed(1)),
        tdee,
        targetDeficit: Math.round(dailyTargetDiff),
        targetCalories,
        weeksToGoal: parseFloat(weeksToGoal.toFixed(1)),
        goalDate
    };
}
