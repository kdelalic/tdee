import { calculateTDEE, calculateFormulaTDEE } from "../tdee-calculations";
import { UserSettings } from "../firebase/firestore";

// Mock DailyEntry type
interface DailyEntry {
    id?: string;
    userId: string;
    date: string;
    weight: number;
    calories: number;
    notes?: string;
    createdAt?: string;
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

describe("tdee-calculations", () => {
    describe("calculateTDEE", () => {
        it("should return null for less than 7 days of data", () => {
            const entries = createEntries(6, 200, 0, 2000);
            const result = calculateTDEE(entries);
            expect(result).toBeNull();
        });

        it("should return a result for 7+ days of data", () => {
            const entries = createEntries(7, 200, 0, 2000);
            const result = calculateTDEE(entries);
            expect(result).not.toBeNull();
        });

        it("should calculate TDEE for stable weight (maintenance)", () => {
            // If weight is stable and eating 2000 cal, TDEE should be ~2000
            const entries = createEntries(14, 185, 0, 2000);
            const result = calculateTDEE(entries);
            expect(result).not.toBeNull();
            expect(result!.tdee).toBeCloseTo(2000, -2); // Within 100 calories
            expect(result!.weightTrend).toBeCloseTo(0, 1);
        });

        it("should calculate TDEE for weight loss scenario", () => {
            // Losing 0.1 lb/day while eating 1800 cal
            // Daily deficit = 0.1 * 3500 = 350 cal
            // TDEE = 1800 + 350 = 2150
            const entries = createEntries(14, 200, -0.1, 1800);
            const result = calculateTDEE(entries);
            expect(result).not.toBeNull();
            expect(result!.tdee).toBeCloseTo(2150, -2);
            expect(result!.weightTrend).toBeLessThan(0); // Losing weight
        });

        it("should calculate TDEE for weight gain scenario", () => {
            // Gaining 0.1 lb/day while eating 2500 cal
            // Daily surplus = 0.1 * 3500 = 350 cal
            // TDEE = 2500 - 350 = 2150
            const entries = createEntries(14, 180, 0.1, 2500);
            const result = calculateTDEE(entries);
            expect(result).not.toBeNull();
            expect(result!.tdee).toBeCloseTo(2150, -2);
            expect(result!.weightTrend).toBeGreaterThan(0); // Gaining weight
        });

        it("should use only last 21 days if more data available", () => {
            // Create 30 days of data with consistent pattern
            const entries = createEntries(30, 200, -0.05, 1900);
            const result = calculateTDEE(entries);
            expect(result).not.toBeNull();
            // Should still calculate correctly using recent data
        });

        it("should handle entries in random order", () => {
            const entries = createEntries(10, 190, -0.05, 2000);
            // Shuffle entries
            const shuffled = [...entries].sort(() => Math.random() - 0.5);
            const result = calculateTDEE(shuffled);
            expect(result).not.toBeNull();
        });

        it("should return weightTrend in lbs per week", () => {
            // Losing 0.1 lb/day = 0.7 lbs/week
            const entries = createEntries(14, 200, -0.1, 1800);
            const result = calculateTDEE(entries);
            expect(result).not.toBeNull();
            expect(result!.weightTrend).toBeCloseTo(-0.7, 1);
        });
    });

    describe("calculateFormulaTDEE", () => {
        const baseSettings: UserSettings = {
            goal: 'bulk',
            units: 'lb',
            startDate: '2024-01-01',
            startingWeight: 180,
            goalWeight: 200,
            weeklyGoal: 1.0,
            sex: 'male',
            age: 25,
            heightCm: 177.8, // 5'10"
            activityLevel: 1.55, // moderately active
        };

        it("should calculate TDEE for a male in lbs", () => {
            const result = calculateFormulaTDEE(baseSettings);
            expect(result).not.toBeNull();
            // BMR = (10 * 81.65) + (6.25 * 177.8) - (5 * 25) + 5 = 816.5 + 1111.25 - 125 + 5 = 1807.75
            // TDEE = 1807.75 * 1.55 = 2802
            expect(result!).toBeCloseTo(2802, -2);
        });

        it("should calculate TDEE for a female in kg", () => {
            const settings: UserSettings = {
                ...baseSettings,
                sex: 'female',
                units: 'kg',
                startingWeight: 65,
            };
            const result = calculateFormulaTDEE(settings);
            expect(result).not.toBeNull();
            // BMR = (10 * 65) + (6.25 * 177.8) - (5 * 25) - 161 = 650 + 1111.25 - 125 - 161 = 1475.25
            // TDEE = 1475.25 * 1.55 = 2286.6
            expect(result!).toBeCloseTo(2287, -2);
        });

        it("should use currentWeight when provided", () => {
            const result = calculateFormulaTDEE(baseSettings, 190);
            expect(result).not.toBeNull();
            // 190 lbs = 86.18 kg
            // BMR = (10 * 86.18) + (6.25 * 177.8) - (5 * 25) + 5 = 861.8 + 1111.25 - 125 + 5 = 1853.05
            // TDEE = 1853.05 * 1.55 = 2872
            expect(result!).toBeCloseTo(2872, -2);
        });

        it("should return null if sex is missing", () => {
            const settings = { ...baseSettings, sex: undefined as unknown as 'male' | 'female' };
            expect(calculateFormulaTDEE(settings)).toBeNull();
        });

        it("should return null if age is missing", () => {
            const settings = { ...baseSettings, age: undefined as unknown as number };
            expect(calculateFormulaTDEE(settings)).toBeNull();
        });

        it("should return null if heightCm is missing", () => {
            const settings = { ...baseSettings, heightCm: undefined as unknown as number };
            expect(calculateFormulaTDEE(settings)).toBeNull();
        });

        it("should return null if activityLevel is missing", () => {
            const settings = { ...baseSettings, activityLevel: undefined as unknown as number };
            expect(calculateFormulaTDEE(settings)).toBeNull();
        });

        it("should scale with activity level", () => {
            const sedentary = calculateFormulaTDEE({ ...baseSettings, activityLevel: 1.2 });
            const veryActive = calculateFormulaTDEE({ ...baseSettings, activityLevel: 1.725 });
            expect(sedentary).not.toBeNull();
            expect(veryActive).not.toBeNull();
            expect(veryActive!).toBeGreaterThan(sedentary!);
            // Ratio should match multiplier ratio
            expect(veryActive! / sedentary!).toBeCloseTo(1.725 / 1.2, 1);
        });
    });
});
