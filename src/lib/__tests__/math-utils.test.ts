import {
    calculateLinearRegression,
    calculateSlope,
    calculateTrendLine,
    calculateAverage,
    DataPoint,
} from "../math-utils";

describe("math-utils", () => {
    describe("calculateLinearRegression", () => {
        it("should return null for less than 2 data points", () => {
            expect(calculateLinearRegression([])).toBeNull();
            expect(calculateLinearRegression([{ x: 0, y: 1 }])).toBeNull();
        });

        it("should calculate correct slope for simple ascending data", () => {
            const data: DataPoint[] = [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
                { x: 2, y: 2 },
            ];
            const result = calculateLinearRegression(data);
            expect(result).not.toBeNull();
            expect(result!.slope).toBeCloseTo(1, 5);
            expect(result!.intercept).toBeCloseTo(0, 5);
        });

        it("should calculate correct slope for descending data (weight loss)", () => {
            const data: DataPoint[] = [
                { x: 0, y: 200 },
                { x: 7, y: 199 },
                { x: 14, y: 198 },
            ];
            const result = calculateLinearRegression(data);
            expect(result).not.toBeNull();
            // Losing ~0.143 lbs per day
            expect(result!.slope).toBeCloseTo(-0.143, 2);
        });

        it("should return null when all x values are the same", () => {
            const data: DataPoint[] = [
                { x: 5, y: 100 },
                { x: 5, y: 200 },
            ];
            const result = calculateLinearRegression(data);
            expect(result).toBeNull();
        });

        it("should handle flat data (no change)", () => {
            const data: DataPoint[] = [
                { x: 0, y: 185 },
                { x: 1, y: 185 },
                { x: 2, y: 185 },
            ];
            const result = calculateLinearRegression(data);
            expect(result).not.toBeNull();
            expect(result!.slope).toBeCloseTo(0, 5);
            expect(result!.intercept).toBeCloseTo(185, 5);
        });
    });

    describe("calculateSlope", () => {
        it("should return null for mismatched array lengths", () => {
            expect(calculateSlope([1, 2, 3], [1, 2])).toBeNull();
        });

        it("should return null for arrays with less than 2 elements", () => {
            expect(calculateSlope([], [])).toBeNull();
            expect(calculateSlope([1], [1])).toBeNull();
        });

        it("should calculate correct slope", () => {
            const xValues = [0, 1, 2, 3, 4, 5, 6];
            const yValues = [200, 199.5, 199, 198.5, 198, 197.5, 197];
            const slope = calculateSlope(xValues, yValues);
            expect(slope).not.toBeNull();
            expect(slope!).toBeCloseTo(-0.5, 5); // Losing 0.5 lbs per day
        });
    });

    describe("calculateTrendLine", () => {
        it("should return original values for less than 2 data points", () => {
            const data: DataPoint[] = [{ x: 0, y: 100 }];
            const result = calculateTrendLine(data);
            expect(result).toEqual([100]);
        });

        it("should return trend values for valid data", () => {
            const data: DataPoint[] = [
                { x: 0, y: 200 },
                { x: 1, y: 199 },
                { x: 2, y: 198 },
            ];
            const result = calculateTrendLine(data);
            expect(result.length).toBe(3);
            // Trend line should be close to actual values for this linear data
            expect(result[0]).toBeCloseTo(200, 1);
            expect(result[1]).toBeCloseTo(199, 1);
            expect(result[2]).toBeCloseTo(198, 1);
        });
    });

    describe("calculateAverage", () => {
        it("should return 0 for empty array", () => {
            expect(calculateAverage([])).toBe(0);
        });

        it("should calculate correct average", () => {
            expect(calculateAverage([1, 2, 3, 4, 5])).toBe(3);
            expect(calculateAverage([2000, 2200, 1800, 2100])).toBe(2025);
        });

        it("should handle single value", () => {
            expect(calculateAverage([42])).toBe(42);
        });
    });
});
