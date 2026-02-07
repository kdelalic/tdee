"use client";

import { useMemo, useState, memo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    Legend,
} from "recharts";
import { DailyEntry, UserSettings } from "@/lib/firebase/firestore";
import { parseYYYYMMDD, daysBetween, isInSetupPhase, daysSinceStart } from "@/lib/date-utils";
import { calculateLinearRegression, calculateTrendLine, calculateExponentialMovingAverage, calculateTargetTrajectory, DataPoint } from "@/lib/math-utils";
import { calculateFormulaTDEE } from "@/lib/tdee-calculations";
import { CALORIES_PER_POUND, SETUP_PHASE_DAYS, WEIGHT_EMA_SMOOTHING_FACTOR, TDEE_MIN_BOUND, TDEE_MAX_BOUND } from "@/lib/constants";
import styles from "./Dashboard.module.css";

// Tooltip types and component extracted outside for performance
interface TooltipPayloadItem {
    value: number;
    name: string;
    color: string;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadItem[];
    label?: string;
}

const CustomTooltip = memo(({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className={styles.customTooltip}>
                <p className={styles.tooltipLabel}>{label}</p>
                {payload.map((p: TooltipPayloadItem) => {
                    // Skip Linear Trend and Target Trajectory if value is null
                    if (p.value === null) return null;

                    return (
                        <p key={p.name} className={styles.tooltipItem}>
                            <span style={{ color: p.color, fontWeight: 'bold' }}>•</span>
                            <span style={{ color: p.color }}>
                                {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : p.value}
                            </span>
                        </p>
                    );
                })}
            </div>
        );
    }
    return null;
});

CustomTooltip.displayName = "CustomTooltip";

// ChangeIndicator component extracted for performance
interface ChangeIndicatorProps {
    change: number | null;
    inverted?: boolean;
}

const formatChange = (change: number | null) => {
    if (change === null) return null;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
};

const ChangeIndicator = memo(({ change, inverted = false }: ChangeIndicatorProps) => {
    if (change === null) return <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>—</span>;

    const isPositive = inverted ? change < 0 : change > 0;
    const color = Math.abs(change) < 0.5 ? 'var(--text-tertiary)' : isPositive ? 'var(--success)' : 'var(--error)';
    const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '';

    return (
        <span className={styles.changeIndicator} style={{ color }}>
            {arrow} {formatChange(change)}
        </span>
    );
});

ChangeIndicator.displayName = "ChangeIndicator";

// Custom Legend for Recharts
const CustomLegend = memo(({ payload }: any) => {
    if (!payload) return null;

    return (
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '1rem',
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border)',
            width: '100%'
        }}>
            {payload.map((entry: any, index: number) => (
                <div key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--foreground)' }}>
                    <span style={{
                        display: 'block',
                        width: '10px',
                        height: '10px',
                        backgroundColor: entry.color,
                        borderRadius: '50%',
                        flexShrink: 0
                    }} />
                    {entry.value}
                </div>
            ))}
        </div>
    );
});

CustomLegend.displayName = "CustomLegend";

interface PeriodAverage {

    weight: number;
    calories: number;
    entryCount: number;
}

interface AveragesData {
    thisWeek: PeriodAverage;
    lastWeek: PeriodAverage;
    thisMonth: PeriodAverage;
    lastMonth: PeriodAverage;
}

function calculateAverages(entries: DailyEntry[]): AveragesData {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get start of current week (Sunday)
    const dayOfWeek = today.getDay();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - dayOfWeek);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(thisWeekStart.getDate() - 1);

    // Get start of current month
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(thisMonthStart);
    lastMonthEnd.setDate(lastMonthEnd.getDate() - 1);

    const thisWeekEntries: DailyEntry[] = [];
    const lastWeekEntries: DailyEntry[] = [];
    const thisMonthEntries: DailyEntry[] = [];
    const lastMonthEntries: DailyEntry[] = [];

    entries.forEach(entry => {
        const entryDate = parseYYYYMMDD(entry.date);

        // This week
        if (entryDate >= thisWeekStart && entryDate <= today) {
            thisWeekEntries.push(entry);
        }
        // Last week
        if (entryDate >= lastWeekStart && entryDate <= lastWeekEnd) {
            lastWeekEntries.push(entry);
        }
        // This month
        if (entryDate >= thisMonthStart && entryDate <= today) {
            thisMonthEntries.push(entry);
        }
        // Last month
        if (entryDate >= lastMonthStart && entryDate <= lastMonthEnd) {
            lastMonthEntries.push(entry);
        }
    });

    const calcAvg = (arr: DailyEntry[]): PeriodAverage => {
        if (arr.length === 0) {
            return { weight: 0, calories: 0, entryCount: 0 };
        }
        const totalWeight = arr.reduce((sum, e) => sum + e.weight, 0);
        const totalCalories = arr.reduce((sum, e) => sum + e.calories, 0);
        return {
            weight: totalWeight / arr.length,
            calories: totalCalories / arr.length,
            entryCount: arr.length,
        };
    };

    return {
        thisWeek: calcAvg(thisWeekEntries),
        lastWeek: calcAvg(lastWeekEntries),
        thisMonth: calcAvg(thisMonthEntries),
        lastMonth: calcAvg(lastMonthEntries),
    };
}

interface ChartsOverviewProps {
    entries: DailyEntry[];
    settings: UserSettings | null;
}

// Helper function to calculate TDEE for a given window of entries.
// Expects entries sorted ascending by date (oldest to newest).
function calculateRollingTDEE(windowEntries: DailyEntry[]): number | null {
    if (windowEntries.length < 7) return null;

    // Average Calories
    const avgCals = windowEntries.reduce((sum, e) => sum + e.calories, 0) / windowEntries.length;

    // Weight Trend using centralized linear regression
    // Use actual date offsets (not array indices) so gaps between entries are handled correctly
    const firstDate = windowEntries[0].date;
    const data: DataPoint[] = windowEntries.map(e => ({ x: daysBetween(firstDate, e.date), y: e.weight }));
    const regression = calculateLinearRegression(data);

    if (!regression) return null;

    // TDEE = avgCals - (slope * CALORIES_PER_POUND)
    const tdee = Math.max(TDEE_MIN_BOUND, Math.min(TDEE_MAX_BOUND, avgCals - (regression.slope * CALORIES_PER_POUND)));

    return Math.round(tdee);
}


interface WeeklyRateData {
    actualRate: number | null;
    targetRate: number;
    daysTracked: number;
}

function calculateWeeklyRate(entries: DailyEntry[], settings: UserSettings | null): WeeklyRateData | null {
    if (!settings || entries.length < 2) return null;

    // Sort all entries by date (oldest first)
    const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));

    // Need at least 7 entries to calculate a meaningful weekly rate
    if (sortedEntries.length < 7) {
        return {
            actualRate: null,
            targetRate: settings.weeklyGoal,
            daysTracked: sortedEntries.length,
        };
    }

    // Use linear regression slope instead of raw first/last values for outlier resistance
    const firstDate = sortedEntries[0].date;
    const weightPoints = sortedEntries.map(e => ({
        x: daysBetween(firstDate, e.date),
        y: e.weight
    }));
    const regression = calculateLinearRegression(weightPoints);

    if (!regression) {
        return {
            actualRate: null,
            targetRate: settings.weeklyGoal,
            daysTracked: sortedEntries.length,
        };
    }

    const actualRate = regression.slope * 7; // lbs per week

    return {
        actualRate: Math.round(actualRate * 100) / 100,
        targetRate: settings.weeklyGoal,
        daysTracked: sortedEntries.length,
    };
}

// Weekly annotation types for tissue vs water interpretation
interface WeeklyAnnotation {
    weekNumber: number;
    startDate: string;
    endDate: string;
    rawChange: number;       // Actual daily weight change
    smoothedChange: number;  // EMA-smoothed change (more accurate)
    interpretation: 'water' | 'tissue' | 'mixed';
    description: string;
}

function calculateWeeklyAnnotations(
    data: Array<{ fullDate: string; weight: number; smoothedWeight: number }>,
    startDate: string | undefined
): WeeklyAnnotation[] {
    if (!startDate || data.length < 7) return [];

    // Group entries by actual calendar week (using days since start date)
    const weekMap = new Map<number, Array<{ fullDate: string; weight: number; smoothedWeight: number }>>();
    for (const entry of data) {
        const daysSince = daysBetween(startDate, entry.fullDate);
        if (daysSince < 0) continue;
        const weekNum = Math.floor(daysSince / 7) + 1;
        if (!weekMap.has(weekNum)) weekMap.set(weekNum, []);
        weekMap.get(weekNum)!.push(entry);
    }

    const annotations: WeeklyAnnotation[] = [];

    for (const [weekNumber, weekEntries] of weekMap) {
        // Need at least 4 entries to evaluate a week
        if (weekEntries.length < 4) continue;

        const startEntry = weekEntries[0];
        const endEntry = weekEntries[weekEntries.length - 1];

        const rawChange = endEntry.weight - startEntry.weight;
        const smoothedChange = endEntry.smoothedWeight - startEntry.smoothedWeight;

        // Determine interpretation based on week number and difference between raw and smoothed
        const noiseMagnitude = Math.abs(rawChange - smoothedChange);
        let interpretation: 'water' | 'tissue' | 'mixed';
        let description: string;

        // Early weeks (1-2): mostly water/glycogen
        if (weekNumber <= 2) {
            interpretation = 'water';
            const changeStr = rawChange >= 0 ? `+${rawChange.toFixed(1)}` : rawChange.toFixed(1);
            description = `Week ${weekNumber}: ${changeStr} lbs (mostly water/glycogen)`;
        }
        // Later weeks with high noise: mixed
        else if (noiseMagnitude > 0.5) {
            interpretation = 'mixed';
            const changeStr = smoothedChange >= 0 ? `+${smoothedChange.toFixed(1)}` : smoothedChange.toFixed(1);
            description = `Week ${weekNumber}: ${changeStr} lbs trend (noisy data)`;
        }
        // Later weeks with stable data: likely tissue
        else {
            interpretation = 'tissue';
            const changeStr = smoothedChange >= 0 ? `+${smoothedChange.toFixed(1)}` : smoothedChange.toFixed(1);
            description = `Week ${weekNumber}: ${changeStr} lbs (tissue change)`;
        }

        annotations.push({
            weekNumber,
            startDate: startEntry.fullDate,
            endDate: endEntry.fullDate,
            rawChange,
            smoothedChange,
            interpretation,
            description,
        });
    }

    return annotations;
}

export default function ChartsOverview({ entries, settings }: ChartsOverviewProps) {
    const data = useMemo(() => {
        // Clone and reverse to show oldest to newest
        const reversed = [...entries].reverse();

        // Calculate trends on the sorted data
        // Use actual date offsets so gaps between entries are handled correctly
        const firstDate = reversed.length > 0 ? reversed[0].date : "";
        const weightPoints = reversed.map(e => ({ x: daysBetween(firstDate, e.date), y: e.weight }));
        const caloriePoints = reversed.map(e => ({ x: daysBetween(firstDate, e.date), y: e.calories }));

        const weightTrends = calculateTrendLine(weightPoints);
        const calorieTrends = calculateTrendLine(caloriePoints);

        // Calculate EMA-smoothed weight (Hacker's Diet style)
        const weights = reversed.map(e => e.weight);
        const smoothedWeights = calculateExponentialMovingAverage(weights, WEIGHT_EMA_SMOOTHING_FACTOR);

        // Calculate Target Trajectory
        // Starts from the first recorded weight
        const startWeight = reversed.length > 0 ? reversed[0].weight : 0;
        const targetTrajectory = settings
            ? calculateTargetTrajectory(startWeight, settings.weeklyGoal, reversed.length)
            : new Array(reversed.length).fill(null);

        return reversed.map((entry, index) => {
            const dateObj = parseYYYYMMDD(entry.date);

            // Calculate rolling TDEE using a window of entries up to this point
            // Use the last 14 days window for TDEE calculation
            const windowStart = Math.max(0, index - 13);
            const windowEntries = reversed.slice(windowStart, index + 1);

            let rollingTDEE: number | null = null;

            // Check if this specific data point is within the setup phase
            const daysSinceStart = settings?.startDate ? daysBetween(settings.startDate, entry.date) : 999;
            const isSetupPhaseForEntry = daysSinceStart >= 0 && daysSinceStart < SETUP_PHASE_DAYS;

            if (isSetupPhaseForEntry && settings) {
                // Use formula during setup phase to avoid erratic jumps
                rollingTDEE = calculateFormulaTDEE(settings, entry.weight);
            } else {
                // Use adaptive calculation after setup phase
                rollingTDEE = calculateRollingTDEE(windowEntries);
            }

            return {
                date: dateObj.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                }),
                fullDate: entry.date,
                weight: entry.weight,
                calories: entry.calories,
                weightTrend: weightTrends[index],
                smoothedWeight: smoothedWeights[index],
                targetWeight: targetTrajectory[index],
                caloriesTrend: calorieTrends[index],
                tdee: rollingTDEE,
            };
        });
    }, [entries, settings]);

    const annotations = useMemo(() => {
        return calculateWeeklyAnnotations(data, settings?.startDate);
    }, [data, settings?.startDate]);

    const weeklyRate = useMemo(() => calculateWeeklyRate(entries, settings), [entries, settings]);

    // Memoize chart domain calculations to avoid recalculating on every render
    const { weightDomain, weightTicks, caloriesDomain, tdeeDomain, tdeeValues } = useMemo(() => {
        if (!entries || entries.length < 2) {
            return {
                weightDomain: [0, 100] as [number, number],
                weightTicks: [0, 20, 40, 60, 80, 100],
                caloriesDomain: [0, 3000] as [number, number],
                tdeeDomain: [1500, 3000] as [number, number],
                tdeeValues: [] as number[],
            };
        }

        const allWeights = [
            ...entries.map(e => e.weight),
            ...(data.map(d => d.targetWeight).filter((v): v is number => v !== null))
        ];

        const minW = Math.min(...allWeights);
        const maxW = Math.max(...allWeights);

        // Create a nice domain with some padding
        const start = Math.floor(minW - 1);
        const end = Math.ceil(maxW + 1);

        // Calculate Nice Ticks (strictly even increments)
        const range = end - start;
        let step = 1;
        if (range > 20) step = 10;
        else if (range > 10) step = 5;
        else if (range > 5) step = 2;

        const ticks: number[] = [];
        const firstTick = Math.ceil(start / step) * step;
        for (let t = firstTick; t <= end; t += step) {
            ticks.push(t);
        }

        const weightDom: [number, number] = [start, Math.max(end, ticks[ticks.length - 1] || end)];

        const minCalories = Math.min(...entries.map((e) => e.calories));
        const maxCalories = Math.max(...entries.map((e) => e.calories));
        const caloriesDom: [number, number] = [Math.floor(minCalories - 100), Math.ceil(maxCalories + 100)];

        const tdeeVals = data.map(d => d.tdee).filter((v): v is number => v !== null);
        const tdeeDom: [number, number] = tdeeVals.length > 0
            ? [Math.floor(Math.min(...tdeeVals) - 100), Math.ceil(Math.max(...tdeeVals) + 100)]
            : [1500, 3000];

        return {
            weightDomain: weightDom,
            weightTicks: ticks,
            caloriesDomain: caloriesDom,
            tdeeDomain: tdeeDom,
            tdeeValues: tdeeVals,
        };
    }, [entries, data]);

    // Memoize isOnTrack calculation
    const isOnTrack = (() => {
        if (weeklyRate?.actualRate == null || settings?.weeklyGoal == null) return null;
        return Math.sign(weeklyRate.actualRate) === Math.sign(settings.weeklyGoal) &&
            Math.abs(weeklyRate.actualRate) <= Math.abs(settings.weeklyGoal) * 1.5;
    })();

    // Check if user is in setup phase (first 2 weeks - glycogen refill period)
    const inSetupPhase = isInSetupPhase(settings?.startDate, SETUP_PHASE_DAYS);

    const currentDayNumber = useMemo(() => {
        return daysSinceStart(settings?.startDate);
    }, [settings?.startDate]);

    if (!entries || entries.length < 2) {
        return (
            <div className={styles.card}>
                <h2 className={styles.cardTitle}>Trends</h2>
                <div className={styles.detailsWait}>
                    Need at least 2 entries to display trends.
                </div>
            </div>
        );
    }

    // Colors (static, no need to memoize)
    const COLOR_WEIGHT = "#3b82f6"; // Vibrant Blue
    const COLOR_CALORIES = "#8b5cf6"; // Purple
    const COLOR_TDEE = "#10b981"; // Green/Teal

    return (
        <div className={styles.card}>
            <h2 className={styles.cardTitle}>Trends</h2>

            {/* Weekly Rate of Change */}
            {weeklyRate && settings && (
                <div className={styles.weeklyRateContainer}>
                    <h3 className={styles.weeklyRateHeader}>Weekly Rate of Change</h3>

                    {/* Setup Phase Banner - shown during first 2 weeks */}
                    {inSetupPhase && (
                        <div className={styles.setupPhaseBanner}>
                            <div className={styles.setupPhaseIcon}>📊</div>
                            <div className={styles.setupPhaseContent}>
                                <strong>Building Your Baseline</strong>
                                <p>
                                    Day {currentDayNumber + 1} of {SETUP_PHASE_DAYS} — TDEE estimates become accurate after glycogen levels stabilize.
                                    Keep logging consistently!
                                </p>
                            </div>
                        </div>
                    )}

                    <div className={styles.weeklyRateGrid} style={inSetupPhase ? { opacity: 0.5 } : undefined}>
                        {/* Actual Rate */}
                        <div className={styles.rateItem}>
                            <span className={styles.rateLabel}>Actual</span>
                            {weeklyRate.actualRate !== null ? (
                                <div className={styles.rateValueContainer}>
                                    <span style={{
                                        fontSize: '1.5rem',
                                        fontWeight: 700,
                                        color: inSetupPhase ? 'var(--text-secondary)' : (isOnTrack ? 'var(--success)' : 'var(--warning, #f59e0b)')
                                    }}>
                                        {weeklyRate.actualRate > 0 ? '+' : ''}{weeklyRate.actualRate.toFixed(2)}
                                    </span>
                                    <span className={styles.rateUnit}>
                                        {settings.units}/week
                                    </span>
                                </div>
                            ) : (
                                <div style={{ marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    Need more data ({weeklyRate.daysTracked}/7 days min)
                                </div>
                            )}
                        </div>
                        {/* Target Rate */}
                        <div className={styles.rateItem}>
                            <span className={styles.rateLabel}>Target</span>
                            <div className={styles.rateValueContainer}>
                                <span className={styles.rateValue} style={{ color: 'var(--accent-purple)' }}>
                                    {weeklyRate.targetRate > 0 ? '+' : ''}{weeklyRate.targetRate.toFixed(2)}
                                </span>
                                <span className={styles.rateUnit}>
                                    {settings.units}/week
                                </span>
                            </div>
                        </div>
                        {/* Status - Hidden during setup phase */}
                        <div style={{ flex: 1, minWidth: '140px', display: 'flex', alignItems: 'center' }}>
                            {weeklyRate.actualRate !== null && !inSetupPhase && (
                                <span className={styles.rateStatusBadge} style={{
                                    background: isOnTrack ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                    color: isOnTrack ? 'var(--success)' : 'var(--warning, #f59e0b)'
                                }}>
                                    {isOnTrack ? '✓ On Track' : '⚠ Adjust Pace'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.chartGrid}>

                {/* Weight Chart */}
                <div className={styles.chartContainer}>
                    <h3 className={styles.chartTitle}>Weight History</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLOR_WEIGHT} stopOpacity={0.15} />
                                    <stop offset="95%" stopColor={COLOR_WEIGHT} stopOpacity={0.05} />
                                </linearGradient>
                                <linearGradient id="colorSmoothed" x1="0" y1="0" x2="0" y2="1">
                                    {/* Using bright blue gradient for the area */}
                                    <stop offset="5%" stopColor={COLOR_WEIGHT} stopOpacity={0.4} />
                                    <stop offset="95%" stopColor={COLOR_WEIGHT} stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis
                                dataKey="date"
                                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                domain={weightDomain}
                                ticks={weightTicks}
                                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                width={30}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend content={<CustomLegend />} />
                            {/* Target trajectory based on goal - Rendered BEFORE other lines to be behind but visible */}

                            {settings && (
                                <Line
                                    type="monotone"
                                    dataKey="targetWeight"
                                    name="Target Trajectory"
                                    stroke="#60a5fa" /* Lighter Blue */
                                    strokeWidth={2.5}
                                    strokeDasharray="5 5" /* Dashed */
                                    dot={false}
                                    activeDot={false}
                                    strokeOpacity={0.8}
                                />
                            )}
                            {/* Smoothed trend area (shows the "true" trend) */}
                            <Area
                                type="monotone"
                                dataKey="smoothedWeight"
                                name="Trend"
                                stroke={COLOR_WEIGHT} /* Bright Blue */
                                fillOpacity={1}
                                fill="url(#colorSmoothed)"
                                strokeWidth={3}
                            />
                            {/* Daily weight line (shows fluctuations/noise) */}
                            <Line
                                type="monotone"
                                dataKey="weight"
                                name="Daily Weight"
                                stroke={COLOR_WEIGHT}
                                strokeWidth={2}
                                dot={{ r: 3, fill: COLOR_WEIGHT }}
                                activeDot={{ r: 6, fill: COLOR_WEIGHT, strokeWidth: 0 }}
                                strokeOpacity={0.4} /* Reduced opacity to let Trend pop */
                            />
                            {/* Linear trend for reference - Hidden from Legend usually, or keep minimal */}
                            {/* Removed Linear Trend from visual chart to reduce clutter, or keep very subtle if interpreted */}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Weekly Insights - Integrated into the grid flow, visually connected or just cleaner */}
                {annotations.length > 0 && (
                    <div className={styles.annotationsWrapper} style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column' }}>
                        {/* Styled in CSS to match chart height or separate card */}

                        {/* For now keeping slightly separate but visually consistent */}
                        <div className={styles.card} style={{ padding: '1.5rem', animation: 'none', border: '1px solid var(--border)', boxShadow: 'none', background: 'var(--surface-hover)' }}>
                            <h3 className={styles.annotationsTitle} style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Weekly Insights</h3>
                            <div className={styles.annotationsList} style={{ maxHeight: '350px', overflowY: 'auto' }}>

                                {annotations.map((ann) => (
                                    <div key={ann.weekNumber} className={styles.annotationItem} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '0.75rem' }}>
                                        <div className={styles.annotationHeader} style={{ marginBottom: '0.5rem' }}>
                                            <span className={`${styles.annotationBadge} ${styles[ann.interpretation]}`}>
                                                {ann.interpretation === 'water' ? '💧 Water' : ann.interpretation === 'tissue' ? '⚖️ Tissue' : '🔄 Mixed'}
                                            </span>
                                            <span className={styles.annotationDate} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {parseYYYYMMDD(ann.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {parseYYYYMMDD(ann.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className={styles.annotationText} style={{ fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>{ann.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Old Weekly Insights Location - Removed */}

            <div className={styles.chartGrid}>
                {/* Calories Chart */}
                <div className={styles.chartContainer}>
                    <h3 className={styles.chartTitle}>Calories Consumed</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis
                                dataKey="date"
                                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                domain={caloriesDomain}
                                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                width={40}
                            />
                            <Legend content={<CustomLegend />} />
                            <Line

                                type="monotone"
                                dataKey="calories"
                                name="Calories"
                                stroke={COLOR_CALORIES}
                                strokeWidth={2.5}
                                dot={{ r: 2, fill: COLOR_CALORIES }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="linear"
                                dataKey="caloriesTrend"
                                name="Trend"
                                stroke="var(--text-secondary)"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                activeDot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* TDEE History Chart */}
                {tdeeValues.length > 0 && (
                    <div className={styles.chartContainer}>
                        <h3 className={styles.chartTitle}>TDEE History</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.filter(d => d.tdee !== null)}>
                                <defs>
                                    <linearGradient id="colorTDEE" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLOR_TDEE} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={COLOR_TDEE} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={30}
                                />
                                <YAxis
                                    domain={tdeeDomain}
                                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    width={40}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend content={<CustomLegend />} />
                                <Area
                                    type="monotone"

                                    dataKey="tdee"
                                    name="TDEE"
                                    stroke={COLOR_TDEE}
                                    fillOpacity={1}
                                    fill="url(#colorTDEE)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

            </div>

            {/* Weekly/Monthly Averages Section */}
            <AveragesSection entries={entries} />
        </div>
    );
}

interface AveragesSectionProps {
    entries: DailyEntry[];
}

const AveragesSection = memo(function AveragesSection({ entries }: AveragesSectionProps) {
    const [view, setView] = useState<'weekly' | 'monthly'>('weekly');

    const averages = useMemo(() => calculateAverages(entries), [entries]);

    // Memoize period selection to avoid recalculating on every render
    const { currentPeriod, previousPeriod } = useMemo(() => ({
        currentPeriod: view === 'weekly' ? averages.thisWeek : averages.thisMonth,
        previousPeriod: view === 'weekly' ? averages.lastWeek : averages.lastMonth,
    }), [view, averages]);

    // Memoize change calculations
    const { weightChange, caloriesChange } = useMemo(() => ({
        weightChange: currentPeriod.weight && previousPeriod.weight
            ? ((currentPeriod.weight - previousPeriod.weight) / previousPeriod.weight) * 100
            : null,
        caloriesChange: currentPeriod.calories && previousPeriod.calories
            ? ((currentPeriod.calories - previousPeriod.calories) / previousPeriod.calories) * 100
            : null,
    }), [currentPeriod, previousPeriod]);

    return (
        <div className={styles.averagesContainer}>
            <div className={styles.averagesHeader}>
                <h3 className={styles.averagesTitle}>
                    Averages
                </h3>
                <div className={styles.viewToggle}>
                    <button
                        onClick={() => setView('weekly')}
                        className={`${styles.viewToggleButton} ${view === 'weekly' ? styles.active : ''}`}
                    >
                        Weekly
                    </button>
                    <button
                        onClick={() => setView('monthly')}
                        className={`${styles.viewToggleButton} ${view === 'monthly' ? styles.active : ''}`}
                    >
                        Monthly
                    </button>
                </div>
            </div>

            <div className={styles.averagesGrid}>
                {/* Weight Average Card */}
                <div className={styles.averageCard}>
                    <div className={styles.averageHeader}>
                        <span className={styles.averageLabel}>
                            Avg Weight
                        </span>
                        <ChangeIndicator change={weightChange} inverted={true} />
                    </div>
                    <div className={styles.averageValue}>
                        {currentPeriod.weight > 0
                            ? `${currentPeriod.weight.toFixed(1)} lbs`
                            : '—'
                        }
                    </div>
                    <div className={styles.averageComparison}>
                        {previousPeriod.weight > 0
                            ? `vs ${previousPeriod.weight.toFixed(1)} lbs last ${view === 'weekly' ? 'week' : 'month'}`
                            : `No data from last ${view === 'weekly' ? 'week' : 'month'}`
                        }
                    </div>
                </div>

                {/* Calories Average Card */}
                <div className={styles.averageCard}>
                    <div className={styles.averageHeader}>
                        <span className={styles.averageLabel}>
                            Avg Calories
                        </span>
                        <ChangeIndicator change={caloriesChange} />
                    </div>
                    <div className={styles.averageValue}>
                        {currentPeriod.calories > 0
                            ? `${Math.round(currentPeriod.calories).toLocaleString()}`
                            : '—'
                        }
                    </div>
                    <div className={styles.averageComparison}>
                        {previousPeriod.calories > 0
                            ? `vs ${Math.round(previousPeriod.calories).toLocaleString()} last ${view === 'weekly' ? 'week' : 'month'}`
                            : `No data from last ${view === 'weekly' ? 'week' : 'month'}`
                        }
                    </div>
                </div>
            </div>

            {currentPeriod.entryCount > 0 && (
                <div className={styles.averageFooter}>
                    Based on {currentPeriod.entryCount} {currentPeriod.entryCount === 1 ? 'entry' : 'entries'} this {view === 'weekly' ? 'week' : 'month'}
                    {previousPeriod.entryCount > 0 && ` • ${previousPeriod.entryCount} last ${view === 'weekly' ? 'week' : 'month'}`}
                </div>
            )}
        </div>
    );
});

AveragesSection.displayName = "AveragesSection";
