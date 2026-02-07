/**
 * Date utilities for consistent date handling across the application.
 * Avoids timezone issues by using noon local time.
 */

import { MS_PER_DAY } from "./constants";

/**
 * Parses a YYYY-MM-DD date string into a Date object at noon local time.
 * Using noon avoids timezone boundary issues.
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Date object at noon local time
 */
export function parseYYYYMMDD(dateString: string): Date {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Formats a Date object to YYYY-MM-DD string.
 *
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * Gets today's date as a YYYY-MM-DD string.
 *
 * @returns Today's date in YYYY-MM-DD format
 */
export function getTodayString(): string {
    return formatYYYYMMDD(new Date());
}

/**
 * Calculates the difference in days between two date strings.
 *
 * @param dateString1 - First date in YYYY-MM-DD format
 * @param dateString2 - Second date in YYYY-MM-DD format
 * @returns Number of days between the dates (can be negative)
 */
export function daysBetween(dateString1: string, dateString2: string): number {
    const date1 = parseYYYYMMDD(dateString1);
    const date2 = parseYYYYMMDD(dateString2);
    return Math.round((date2.getTime() - date1.getTime()) / MS_PER_DAY);
}

/**
 * Checks if a date string is in the future.
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns True if the date is after today
 */
export function isFutureDate(dateString: string): boolean {
    const date = parseYYYYMMDD(dateString);
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return date.getTime() > today.getTime();
}

/**
 * Gets the start of the current week (Sunday).
 *
 * @param date - Reference date (defaults to today)
 * @returns Date object at start of the week
 */
export function getWeekStart(date: Date = new Date()): Date {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayOfWeek = d.getDay();
    d.setDate(d.getDate() - dayOfWeek);
    return d;
}

/**
 * Gets the start of the month.
 *
 * @param date - Reference date (defaults to today)
 * @returns Date object at start of the month
 */
export function getMonthStart(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Formats a date for user-friendly display.
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDisplayDate(
    dateString: string,
    options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
): string {
    const date = parseYYYYMMDD(dateString);
    return date.toLocaleDateString("en-US", options);
}

/**
 * Gets the number of days since the user started tracking.
 *
 * @param startDate - Start date in YYYY-MM-DD format
 * @returns Number of days since start (0 if no startDate)
 */
export function daysSinceStart(startDate: string | undefined): number {
    if (!startDate) return 0;
    return Math.max(0, daysBetween(startDate, getTodayString()));
}

/**
 * Checks if the user is still in the initial setup phase.
 * During this period, TDEE estimates are unreliable due to water weight
 * and glycogen refill fluctuations.
 *
 * @param startDate - Start date in YYYY-MM-DD format
 * @param setupDays - Number of days in setup phase
 * @returns True if user is still in setup phase
 */
export function isInSetupPhase(startDate: string | undefined, setupDays: number): boolean {
    if (!startDate) return false;
    return daysSinceStart(startDate) < setupDays;
}
