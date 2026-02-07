import { calculateStats } from "../tdee-calculator";

// Mock types
interface DailyEntry {
    id?: string;
    userId: string;
    date: string;
    weight: number;
    calories: number;
    notes?: string;
    createdAt?: string;
}

interface UserSettings {
    goal: "cut" | "bulk" | "maintain";
    activityLevel?: number;
    units: "lb" | "kg";
    startDate: string;
    startingWeight: number;
    goalWeight: number;
    weeklyGoal: number;
}

// Helper to create test entries
function createEntries(count: number, startWeight: number, dailyChange: number, dailyCalories: number): DailyEntry[] {
    const entries: DailyEntry[] = [];
    const startDate = new Date("2024-01-01");

    for (let i = 0; i < count; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];

        entries.push({
            userId: "test-user",
            date: dateStr,
            weight: startWeight + dailyChange * i,
            calories: dailyCalories,
        });
    }

    return entries;
}

describe("tdee-calculator", () => {
    describe("calculateStats", () => {
        const baseSettings: UserSettings = {
            goal: "cut",
            units: "lb",
            startDate: "2024-01-01",
            startingWeight: 200,
            goalWeight: 180,
            weeklyGoal: -1,
        };

        it("should calculate current weight from most recent entry", () => {
            const entries = createEntries(10, 200, -0.1, 2000);
            const result = calculateStats(entries, baseSettings);
            // Most recent entry weight: 200 - (0.1 * 9) = 199.1
            expect(result.currentWeight).toBeCloseTo(199.1, 1);
        });

        it("should calculate total weight lost", () => {
            const entries = createEntries(10, 200, -0.2, 1800);
            const result = calculateStats(entries, baseSettings);
            // Started at 200 (settings), now at ~198.2
            expect(result.totalLost).toBeGreaterThan(0);
        });

        it("should use fallback TDEE when insufficient data", () => {
            const entries = createEntries(3, 180, 0, 2000);
            const result = calculateStats(entries, baseSettings);
            // Fallback: weight * 14 = 180 * 14 = 2520
            expect(result.tdee).toBeCloseTo(2520, -2);
        });

        it("should calculate target calories based on weekly goal", () => {
            const entries = createEntries(14, 185, 0, 2100);
            const settingsWithCut: UserSettings = {
                ...baseSettings,
                weeklyGoal: -1.5, // Lose 1.5 lbs/week
            };
            const result = calculateStats(entries, settingsWithCut);
            // Daily deficit for -1.5 lbs/week = (-1.5 * 3500) / 7 = -750
            expect(result.targetDeficit).toBeCloseTo(-750, -1);
        });

        it("should calculate weeks to goal", () => {
            const entries = createEntries(7, 190, 0, 2000);
            const settings: UserSettings = {
                ...baseSettings,
                startingWeight: 200,
                goalWeight: 180,
                weeklyGoal: -1,
            };
            const result = calculateStats(entries, settings);
            // Current ~190, goal 180, rate -1/week = 10 weeks
            expect(result.weeksToGoal).toBeGreaterThan(0);
        });

        it("should handle bulk goal correctly", () => {
            const entries = createEntries(14, 175, 0.05, 2800);
            const bulkSettings: UserSettings = {
                goal: "bulk",
                units: "lb",
                startDate: "2024-01-01",
                startingWeight: 175,
                goalWeight: 195,
                weeklyGoal: 0.5, // Gain 0.5 lbs/week
            };
            const result = calculateStats(entries, bulkSettings);
            expect(result.targetDeficit).toBeGreaterThan(0); // Surplus
        });

        it("should return 0 weeks to goal if already reached", () => {
            const entries = createEntries(10, 180, 0, 2000);
            const settings: UserSettings = {
                ...baseSettings,
                startingWeight: 190,
                goalWeight: 180,
                weeklyGoal: -1,
            };
            const result = calculateStats(entries, settings);
            // Already at goal weight
            expect(result.weeksToGoal).toBe(0);
        });

        it("should return 0 weeks when user has passed their goal", () => {
            const entries = createEntries(10, 175, 0, 2000);
            const settings: UserSettings = {
                ...baseSettings,
                startingWeight: 190,
                goalWeight: 180,
                weeklyGoal: -1,
            };
            const result = calculateStats(entries, settings);
            // Current 175 < goal 180, already passed goal
            expect(result.weeksToGoal).toBe(0);
        });
    });
});
