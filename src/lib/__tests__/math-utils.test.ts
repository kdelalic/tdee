import {
    calculateLinearRegression,
    calculateSlope,
    calculateTrendLine,
    calculateAverage,
    calculateExponentialMovingAverage,
    calculateTargetTrajectory,
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

    describe("calculateExponentialMovingAverage", () => {
        it("should return empty array for empty input", () => {
            expect(calculateExponentialMovingAverage([])).toEqual([]);
        });

        it("should return same value for single element", () => {
            expect(calculateExponentialMovingAverage([185])).toEqual([185]);
        });

        it("should smooth out weight fluctuations", () => {
            // Simulating daily weight with water fluctuations around 185
            const weights = [185, 186.5, 184, 185.5, 187, 184.5, 185];
            const smoothed = calculateExponentialMovingAverage(weights, 0.1);

            expect(smoothed.length).toBe(7);
            // First value is unchanged
            expect(smoothed[0]).toBe(185);
            // All smoothed values should be close to the average (~185)
            smoothed.forEach((val) => {
                expect(val).toBeGreaterThan(184);
                expect(val).toBeLessThan(186);
            });
        });

        it("should track a consistent downward trend", () => {
            // Consistent weight loss: 0.5 lbs/day
            const weights = [200, 199.5, 199, 198.5, 198, 197.5, 197];
            const smoothed = calculateExponentialMovingAverage(weights, 0.1);

            expect(smoothed.length).toBe(7);
            // EMA should follow the downward trend (each value less than previous)
            for (let i = 1; i < smoothed.length; i++) {
                expect(smoothed[i]).toBeLessThan(smoothed[i - 1]);
            }
            // But EMA lags behind actual values
            expect(smoothed[6]).toBeGreaterThan(weights[6]);
        });

        it("should use custom smoothing factor", () => {
            const weights = [100, 110];
            // With 0.5 factor, second value = 110 * 0.5 + 100 * 0.5 = 105
            const smoothed = calculateExponentialMovingAverage(weights, 0.5);
            expect(smoothed[1]).toBe(105);
        });

        it("should dampen spikes", () => {
            // Normal weight with one spike (e.g., water retention)
            const weights = [180, 180, 185, 180, 180]; // spike at index 2
            const smoothed = calculateExponentialMovingAverage(weights, 0.1);

            // The spike should be dampened significantly
            expect(smoothed[2]).toBeLessThan(181); // Much less than 185
            // After the spike, values should slowly return toward 180
            expect(smoothed[3]).toBeGreaterThan(180);
            expect(smoothed[4]).toBeGreaterThan(180);
        });
    });

    describe("calculateTargetTrajectory", () => {
        it("should return empty array for 0 or negative days", () => {
            expect(calculateTargetTrajectory(200, -0.5, 0)).toEqual([]);
            expect(calculateTargetTrajectory(200, -0.5, -5)).toEqual([]);
        });

        it("should calculate correct trajectory for weight loss", () => {
            // 200 lbs, losing 0.7 lbs/week = 0.1 lbs/day
            const result = calculateTargetTrajectory(200, -0.7, 4);
            expect(result.length).toBe(4);
            expect(result[0]).toBe(200);
            expect(result[1]).toBeCloseTo(199.9, 5);
            expect(result[2]).toBeCloseTo(199.8, 5);
            expect(result[3]).toBeCloseTo(199.7, 5);
        });

        it("should calculate correct trajectory for weight gain", () => {
            // 150 lbs, gaining 0.7 lbs/week = 0.1 lbs/day
            const result = calculateTargetTrajectory(150, 0.7, 3);
            expect(result.length).toBe(3);
            expect(result[0]).toBe(150);
            expect(result[1]).toBeCloseTo(150.1, 5);
            expect(result[2]).toBeCloseTo(150.2, 5);
        });

        it("should handle zero goal (maintenance)", () => {
            const result = calculateTargetTrajectory(180, 0, 5);
            expect(result.every((val: number) => val === 180)).toBe(true);
        });
    });
});

