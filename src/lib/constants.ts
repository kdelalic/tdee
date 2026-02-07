/**
 * Application constants for TDEE calculations and display
 */

// Calorie and weight conversion constants
export const CALORIES_PER_POUND = 3500;
export const CALORIES_PER_KG = 7700;

// Minimum data requirements
export const MIN_ENTRIES_FOR_TDEE = 7;
export const MIN_ENTRIES_FOR_TREND = 2;
export const ANALYSIS_PERIOD_DAYS = 21;
export const TDEE_WINDOW_DAYS = 14;

// Fallback calculation multiplier (sedentary/light activity)
export const FALLBACK_TDEE_MULTIPLIER = 14;

// Chart defaults
export const DEFAULT_TDEE_DOMAIN = {
    min: 1500,
    max: 3000,
} as const;

// Time constants
export const DAYS_PER_WEEK = 7;
export const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Setup phase duration (water/glycogen refill period)
// TDEE estimates are unreliable during this initial period
export const SETUP_PHASE_DAYS = 14;

// Weight smoothing (Hacker's Diet-style EMA)
// 0.1 = 10% weight to new data, 90% to previous average
export const WEIGHT_EMA_SMOOTHING_FACTOR = 0.1;
