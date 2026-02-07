import {
    daysSinceStart,
    isInSetupPhase,
    daysBetween,
    parseYYYYMMDD,
    formatYYYYMMDD,
    getTodayString,
    isFutureDate,
} from "../date-utils";

// Helper to create a date string N days ago
function daysAgo(n: number): string {
    const date = new Date();
    date.setDate(date.getDate() - n);
    return formatYYYYMMDD(date);
}

describe("date-utils", () => {
    describe("daysSinceStart", () => {
        it("should return 0 for undefined startDate", () => {
            expect(daysSinceStart(undefined)).toBe(0);
        });

        it("should return 0 for today", () => {
            const today = getTodayString();
            expect(daysSinceStart(today)).toBe(0);
        });

        it("should return correct number of days for past dates", () => {
            const sevenDaysAgo = daysAgo(7);
            expect(daysSinceStart(sevenDaysAgo)).toBe(7);
        });

        it("should return 0 for future dates (clamped)", () => {
            const tomorrow = formatYYYYMMDD(new Date(Date.now() + 86400000));
            // daysSinceStart uses Math.max(0, ...) so future dates return 0
            expect(daysSinceStart(tomorrow)).toBe(0);
        });
    });

    describe("isInSetupPhase", () => {
        const SETUP_DAYS = 14;

        it("should return false for undefined startDate", () => {
            expect(isInSetupPhase(undefined, SETUP_DAYS)).toBe(false);
        });

        it("should return true for startDate within setup period", () => {
            const today = getTodayString();
            expect(isInSetupPhase(today, SETUP_DAYS)).toBe(true);
        });

        it("should return true for day 1", () => {
            const yesterday = daysAgo(1);
            expect(isInSetupPhase(yesterday, SETUP_DAYS)).toBe(true);
        });

        it("should return true for day 13 (still in 14-day setup)", () => {
            const thirteenDaysAgo = daysAgo(13);
            expect(isInSetupPhase(thirteenDaysAgo, SETUP_DAYS)).toBe(true);
        });

        it("should return false for day 14 (edge - just exited)", () => {
            const fourteenDaysAgo = daysAgo(14);
            expect(isInSetupPhase(fourteenDaysAgo, SETUP_DAYS)).toBe(false);
        });

        it("should return false for day 15+ (past setup phase)", () => {
            const fifteenDaysAgo = daysAgo(15);
            expect(isInSetupPhase(fifteenDaysAgo, SETUP_DAYS)).toBe(false);
        });

        it("should work with different setup period lengths", () => {
            const tenDaysAgo = daysAgo(10);
            // Should be in setup for 14-day period
            expect(isInSetupPhase(tenDaysAgo, 14)).toBe(true);
            // Should be out of setup for 7-day period
            expect(isInSetupPhase(tenDaysAgo, 7)).toBe(false);
        });
    });

    describe("daysBetween", () => {
        it("should return 0 for same date", () => {
            expect(daysBetween("2024-01-15", "2024-01-15")).toBe(0);
        });

        it("should return positive for later date", () => {
            expect(daysBetween("2024-01-15", "2024-01-22")).toBe(7);
        });

        it("should return negative for earlier date", () => {
            expect(daysBetween("2024-01-22", "2024-01-15")).toBe(-7);
        });
    });

    describe("parseYYYYMMDD", () => {
        it("should parse date correctly", () => {
            const date = parseYYYYMMDD("2024-06-15");
            expect(date.getFullYear()).toBe(2024);
            expect(date.getMonth()).toBe(5); // 0-indexed
            expect(date.getDate()).toBe(15);
        });

        it("should set time to noon to avoid timezone issues", () => {
            const date = parseYYYYMMDD("2024-06-15");
            expect(date.getHours()).toBe(12);
        });
    });

    describe("isFutureDate", () => {
        it("should return false for past dates", () => {
            expect(isFutureDate("2020-01-01")).toBe(false);
        });

        it("should return false for today", () => {
            const today = getTodayString();
            expect(isFutureDate(today)).toBe(false);
        });

        it("should return true for future dates", () => {
            expect(isFutureDate("2099-12-31")).toBe(true);
        });
    });
});
