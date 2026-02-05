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
    ReferenceLine,
} from "recharts";
import { DailyEntry, UserSettings } from "@/lib/firebase/firestore";
import { parseYYYYMMDD, daysBetween } from "@/lib/date-utils";
import { calculateLinearRegression, calculateTrendLine, DataPoint } from "@/lib/math-utils";
import { CALORIES_PER_POUND } from "@/lib/constants";
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
                {payload.map((p: TooltipPayloadItem) => (
                    <p key={p.name} className={styles.tooltipItem}>
                        <span style={{ color: p.color, fontWeight: 'bold' }}>•</span>
                        <span style={{ color: p.color }}>
                            {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : p.value}
                        </span>
                    </p>
                ))}
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

// Helper function to calculate TDEE for a given window of entries
function calculateRollingTDEE(windowEntries: DailyEntry[]): number | null {
    if (windowEntries.length < 7) return null;

    // Sort by date ascending
    const sorted = [...windowEntries].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Average Calories
    const avgCals = sorted.reduce((sum, e) => sum + e.calories, 0) / sorted.length;

    // Weight Trend using centralized linear regression
    const data: DataPoint[] = sorted.map((e, i) => ({ x: i, y: e.weight }));
    const regression = calculateLinearRegression(data);

    if (!regression) return null;

    // TDEE = avgCals - (slope * CALORIES_PER_POUND)
    const tdee = avgCals - (regression.slope * CALORIES_PER_POUND);

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

    const earliest = sortedEntries[0];
    const latest = sortedEntries[sortedEntries.length - 1];

    const daysDiff = daysBetween(earliest.date, latest.date);

    // Safety check for zero days diff
    if (daysDiff <= 0) {
        return {
            actualRate: null,
            targetRate: settings.weeklyGoal,
            daysTracked: sortedEntries.length,
        };
    }

    const weightChange = latest.weight - earliest.weight;
    const actualRate = (weightChange / daysDiff) * 7;

    return {
        actualRate: Math.round(actualRate * 100) / 100,
        targetRate: settings.weeklyGoal,
        daysTracked: sortedEntries.length,
    };
}

export default function ChartsOverview({ entries, settings }: ChartsOverviewProps) {
    const data = useMemo(() => {
        // Clone and reverse to show oldest to newest
        const reversed = [...entries].reverse();

        // Calculate trends on the sorted data
        const weightPoints = reversed.map((e, i) => ({ x: i, y: e.weight }));
        const caloriePoints = reversed.map((e, i) => ({ x: i, y: e.calories }));

        const weightTrends = calculateTrendLine(weightPoints);
        const calorieTrends = calculateTrendLine(caloriePoints);

        return reversed.map((entry, index) => {
            const dateObj = parseYYYYMMDD(entry.date);

            // Calculate rolling TDEE using a window of entries up to this point
            // Use the last 14 days window for TDEE calculation
            const windowStart = Math.max(0, index - 13);
            const windowEntries = reversed.slice(windowStart, index + 1);
            const rollingTDEE = calculateRollingTDEE(windowEntries);

            return {
                date: dateObj.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                }),
                fullDate: entry.date,
                weight: entry.weight,
                calories: entry.calories,
                weightTrend: weightTrends[index],
                caloriesTrend: calorieTrends[index],
                tdee: rollingTDEE,
            };
        });
    }, [entries]);

    const weeklyRate = useMemo(() => calculateWeeklyRate(entries, settings), [entries, settings]);

    // Memoize chart domain calculations to avoid recalculating on every render
    const { weightDomain, caloriesDomain, tdeeDomain, tdeeValues } = useMemo(() => {
        if (!entries || entries.length < 2) {
            return {
                weightDomain: [0, 100] as [number, number],
                caloriesDomain: [0, 3000] as [number, number],
                tdeeDomain: [1500, 3000] as [number, number],
                tdeeValues: [] as number[],
            };
        }

        const minWeight = Math.min(...entries.map((e) => e.weight));
        const maxWeight = Math.max(...entries.map((e) => e.weight));
        const weightDom: [number, number] = [Math.floor(minWeight - 2), Math.ceil(maxWeight + 2)];

        const minCalories = Math.min(...entries.map((e) => e.calories));
        const maxCalories = Math.max(...entries.map((e) => e.calories));
        const caloriesDom: [number, number] = [Math.floor(minCalories - 100), Math.ceil(maxCalories + 100)];

        const tdeeVals = data.map(d => d.tdee).filter((v): v is number => v !== null);
        const tdeeDom: [number, number] = tdeeVals.length > 0
            ? [Math.floor(Math.min(...tdeeVals) - 100), Math.ceil(Math.max(...tdeeVals) + 100)]
            : [1500, 3000];

        return {
            weightDomain: weightDom,
            caloriesDomain: caloriesDom,
            tdeeDomain: tdeeDom,
            tdeeValues: tdeeVals,
        };
    }, [entries, data]);

    // Memoize isOnTrack calculation
    const isOnTrack = useMemo(() => {
        if (weeklyRate?.actualRate == null || settings?.weeklyGoal == null) return null;
        return Math.sign(weeklyRate.actualRate) === Math.sign(settings.weeklyGoal) &&
            Math.abs(weeklyRate.actualRate) <= Math.abs(settings.weeklyGoal) * 1.5;
    }, [weeklyRate?.actualRate, settings?.weeklyGoal]);

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
    const COLOR_WEIGHT = "var(--primary)";
    const COLOR_CALORIES = "#8b5cf6"; // Violet 500
    const COLOR_TDEE = "#10b981"; // Emerald 500

    return (
        <div className={styles.card}>
            <h2 className={styles.cardTitle}>Trends</h2>

            {/* Weekly Rate of Change */}
            {weeklyRate && settings && (
                <div className={styles.weeklyRateContainer}>
                    <h3 className={styles.weeklyRateHeader}>Weekly Rate of Change</h3>
                    <div className={styles.weeklyRateGrid}>
                        {/* Actual Rate */}
                        <div className={styles.rateItem}>
                            <span className={styles.rateLabel}>Actual</span>
                            {weeklyRate.actualRate !== null ? (
                                <div className={styles.rateValueContainer}>
                                    <span style={{
                                        fontSize: '1.5rem',
                                        fontWeight: 700,
                                        color: isOnTrack ? 'var(--success)' : 'var(--warning, #f59e0b)'
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
                                <span className={styles.rateValue} style={{ color: 'var(--primary)' }}>
                                    {weeklyRate.targetRate > 0 ? '+' : ''}{weeklyRate.targetRate.toFixed(2)}
                                </span>
                                <span className={styles.rateUnit}>
                                    {settings.units}/week
                                </span>
                            </div>
                        </div>
                        {/* Status */}
                        <div style={{ flex: 1, minWidth: '140px', display: 'flex', alignItems: 'center' }}>
                            {weeklyRate.actualRate !== null && (
                                <span className={styles.rateStatusBadge} style={{
                                    background: isOnTrack ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
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
                                    <stop offset="5%" stopColor={COLOR_WEIGHT} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={COLOR_WEIGHT} stopOpacity={0} />
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
                                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                width={30}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="weight"
                                name="Weight"
                                stroke={COLOR_WEIGHT}
                                fillOpacity={1}
                                fill="url(#colorWeight)"
                                strokeWidth={2}
                            />
                            <Line
                                type="linear"
                                dataKey="weightTrend"
                                name="Trend"
                                stroke="var(--text-secondary)"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                activeDot={false}
                            />
                            {settings && (
                                <ReferenceLine y={settings.goalWeight} label="Goal" stroke="var(--success)" strokeDasharray="3 3" />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

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
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="calories"
                                name="Calories"
                                stroke={COLOR_CALORIES}
                                strokeWidth={2}
                                dot={false}
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
