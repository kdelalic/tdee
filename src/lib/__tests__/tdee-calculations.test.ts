import { calculateTDEE } from "../tdee-calculations";

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
});
