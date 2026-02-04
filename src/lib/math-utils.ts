/**
 * Math utilities for TDEE calculations
 */

export interface LinearRegressionResult {
    slope: number;
    intercept: number;
}

export interface DataPoint {
    x: number;
    y: number;
}

/**
 * Calculates linear regression (slope and intercept) for a set of data points.
 * Uses the least squares method: y = mx + b
 *
 * @param data - Array of {x, y} data points
 * @returns {slope, intercept} or null if calculation not possible
 */
export function calculateLinearRegression(data: DataPoint[]): LinearRegressionResult | null {
    const n = data.length;
    if (n < 2) return null;

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < n; i++) {
        sumX += data[i].x;
        sumY += data[i].y;
        sumXY += data[i].x * data[i].y;
        sumXX += data[i].x * data[i].x;
    }

    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) return null;

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
}

/**
 * Calculates just the slope from a linear regression.
 * Convenience function when only the slope is needed.
 *
 * @param xValues - Array of x values (e.g., day indices)
 * @param yValues - Array of corresponding y values (e.g., weights)
 * @returns The slope or null if calculation not possible
 */
export function calculateSlope(xValues: number[], yValues: number[]): number | null {
    if (xValues.length !== yValues.length || xValues.length < 2) return null;

    const data = xValues.map((x, i) => ({ x, y: yValues[i] }));
    const result = calculateLinearRegression(data);
    return result?.slope ?? null;
}

/**
 * Calculates trend line values for a dataset.
 * Returns an array of y-values representing the linear trend.
 *
 * @param data - Array of {x, y} data points
 * @returns Array of trend y-values, or original y-values if regression fails
 */
export function calculateTrendLine(data: DataPoint[]): number[] {
    const result = calculateLinearRegression(data);

    if (!result) {
        return data.map(d => d.y);
    }

    const { slope, intercept } = result;
    return data.map(d => slope * d.x + intercept);
}

/**
 * Calculates the simple average of an array of numbers.
 *
 * @param values - Array of numbers
 * @returns The average or 0 if empty array
 */
export function calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
}
