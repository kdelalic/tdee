"use client";

import { useMemo, useState } from "react";
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
import styles from "./Dashboard.module.css";

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
        const [year, month, day] = entry.date.split('-').map(Number);
        const entryDate = new Date(year, month - 1, day);

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

    // Weight Trend (Linear Regression)
    const xValues = sorted.map((_, i) => i);
    const yValues = sorted.map(e => e.weight);

    const n = sorted.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) return null;

    const slope = (n * sumXY - sumX * sumY) / denominator;

    // TDEE = avgCals - (slope * 3500)
    const tdee = avgCals - (slope * 3500);

    return Math.round(tdee);
}

// Helper to calculate linear regression trend points
function calculateTrendLines(data: { x: number; y: number }[]): number[] {
    if (data.length < 2) return data.map(d => d.y);

    const n = data.length;
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
    if (denominator === 0) return data.map(d => d.y);

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    return data.map(d => slope * d.x + intercept);
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

    const [y1, m1, d1] = earliest.date.split('-').map(Number);
    const [y2, m2, d2] = latest.date.split('-').map(Number);
    const date1 = new Date(y1, m1 - 1, d1);
    const date2 = new Date(y2, m2 - 1, d2);
    const daysDiff = (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24);

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

        const weightTrends = calculateTrendLines(weightPoints);
        const calorieTrends = calculateTrendLines(caloriePoints);

        return reversed.map((entry, index) => {
            // Parse YYYY-MM-DD directly to avoid timezone issues
            const [year, month, day] = entry.date.split('-').map(Number);
            const dateObj = new Date(year, month - 1, day);

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

    if (!entries || entries.length < 2) {
        return null;
    }

    // Calculate generic domains for Y-axis
    const minWeight = Math.min(...entries.map((e) => e.weight));
    const maxWeight = Math.max(...entries.map((e) => e.weight));
    const weightDomain = [Math.floor(minWeight - 2), Math.ceil(maxWeight + 2)];

    const minCalories = Math.min(...entries.map((e) => e.calories));
    const maxCalories = Math.max(...entries.map((e) => e.calories));
    const caloriesDomain = [Math.floor(minCalories - 100), Math.ceil(maxCalories + 100)];

    // Calculate TDEE domain (filter out null values)
    const tdeeValues = data.map(d => d.tdee).filter((v): v is number => v !== null);
    const tdeeDomain = tdeeValues.length > 0
        ? [Math.floor(Math.min(...tdeeValues) - 100), Math.ceil(Math.max(...tdeeValues) + 100)]
        : [1500, 3000]; // Default range if no TDEE data

    // Colors
    const COLOR_WEIGHT = "var(--primary)";
    const COLOR_CALORIES = "#8b5cf6"; // Violet 500
    const COLOR_TDEE = "#10b981"; // Emerald 500

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div
                    style={{
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--border)',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        fontSize: '0.875rem'
                    }}
                >
                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{label}</p>
                    {payload.map((p: any) => (
                        <p key={p.name} style={{ color: p.color }}>
                            {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : p.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Helpers for weekly rate display
    const formatRate = (rate: number) => {
        const absRate = Math.abs(rate);
        const direction = rate < 0 ? 'losing' : rate > 0 ? 'gaining' : 'maintaining';
        return { absRate: absRate.toFixed(2), direction };
    };

    const isOnTrack = (weeklyRate?.actualRate != null && settings?.weeklyGoal != null)
        ? Math.sign(weeklyRate.actualRate) === Math.sign(settings.weeklyGoal) &&
        Math.abs(weeklyRate.actualRate) <= Math.abs(settings.weeklyGoal) * 1.5
        : null;

    return (
        <div className={styles.card}>
            <h2 className={styles.cardTitle}>Trends</h2>

            {/* Weekly Rate of Change */}
            {weeklyRate && settings && (
                <div style={{
                    marginBottom: '2rem',
                    padding: '1.25rem',
                    background: 'var(--background)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)'
                }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Weekly Rate of Change</h3>
                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                        {/* Actual Rate */}
                        <div style={{ flex: 1, minWidth: '140px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actual</span>
                            {weeklyRate.actualRate !== null ? (
                                <div style={{ marginTop: '0.25rem' }}>
                                    <span style={{
                                        fontSize: '1.5rem',
                                        fontWeight: 700,
                                        color: isOnTrack ? 'var(--success)' : 'var(--warning, #f59e0b)'
                                    }}>
                                        {weeklyRate.actualRate > 0 ? '+' : ''}{weeklyRate.actualRate.toFixed(2)}
                                    </span>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>
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
                        <div style={{ flex: 1, minWidth: '140px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target</span>
                            <div style={{ marginTop: '0.25rem' }}>
                                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                                    {weeklyRate.targetRate > 0 ? '+' : ''}{weeklyRate.targetRate.toFixed(2)}
                                </span>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>
                                    {settings.units}/week
                                </span>
                            </div>
                        </div>
                        {/* Status */}
                        <div style={{ flex: 1, minWidth: '140px', display: 'flex', alignItems: 'center' }}>
                            {weeklyRate.actualRate !== null && (
                                <span style={{
                                    padding: '0.375rem 0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>

                {/* Weight Chart */}
                <div style={{ height: 300, width: "100%" }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', textAlign: 'center' }}>Weight History</h3>
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
                <div style={{ height: 300, width: "100%" }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', textAlign: 'center' }}>Calories Consumed</h3>
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
                    <div style={{ height: 300, width: "100%" }}>
                        <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', textAlign: 'center' }}>TDEE History</h3>
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

function AveragesSection({ entries }: AveragesSectionProps) {
    const [view, setView] = useState<'weekly' | 'monthly'>('weekly');

    const averages = useMemo(() => calculateAverages(entries), [entries]);

    const currentPeriod = view === 'weekly' ? averages.thisWeek : averages.thisMonth;
    const previousPeriod = view === 'weekly' ? averages.lastWeek : averages.lastMonth;

    const weightChange = currentPeriod.weight && previousPeriod.weight
        ? ((currentPeriod.weight - previousPeriod.weight) / previousPeriod.weight) * 100
        : null;

    const caloriesChange = currentPeriod.calories && previousPeriod.calories
        ? ((currentPeriod.calories - previousPeriod.calories) / previousPeriod.calories) * 100
        : null;

    const formatChange = (change: number | null) => {
        if (change === null) return null;
        const sign = change >= 0 ? '+' : '';
        return `${sign}${change.toFixed(1)}%`;
    };

    const ChangeIndicator = ({ change, inverted = false }: { change: number | null; inverted?: boolean }) => {
        if (change === null) return <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>—</span>;

        // For weight, decrease is typically good (inverted=true for weight loss goals)
        const isPositive = inverted ? change < 0 : change > 0;
        const color = Math.abs(change) < 0.5 ? 'var(--text-tertiary)' : isPositive ? 'var(--success)' : 'var(--error)';
        const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '';

        return (
            <span style={{
                color,
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
            }}>
                {arrow} {formatChange(change)}
            </span>
        );
    };

    return (
        <div style={{ marginTop: '2rem' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem'
            }}>
                <h3 style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>
                    Averages
                </h3>
                <div style={{
                    display: 'flex',
                    gap: '0.25rem',
                    backgroundColor: 'var(--surface-hover)',
                    padding: '0.25rem',
                    borderRadius: 'var(--radius-md)'
                }}>
                    <button
                        onClick={() => setView('weekly')}
                        style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            backgroundColor: view === 'weekly' ? 'var(--card-bg)' : 'transparent',
                            color: view === 'weekly' ? 'var(--foreground)' : 'var(--text-secondary)',
                            boxShadow: view === 'weekly' ? 'var(--shadow-sm)' : 'none'
                        }}
                    >
                        Weekly
                    </button>
                    <button
                        onClick={() => setView('monthly')}
                        style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            backgroundColor: view === 'monthly' ? 'var(--card-bg)' : 'transparent',
                            color: view === 'monthly' ? 'var(--foreground)' : 'var(--text-secondary)',
                            boxShadow: view === 'monthly' ? 'var(--shadow-sm)' : 'none'
                        }}
                    >
                        Monthly
                    </button>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '1rem'
            }}>
                {/* Weight Average Card */}
                <div style={{
                    backgroundColor: 'var(--surface-hover)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            fontWeight: 500
                        }}>
                            Avg Weight
                        </span>
                        <ChangeIndicator change={weightChange} inverted={true} />
                    </div>
                    <div style={{
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        color: 'var(--foreground)',
                        letterSpacing: '-0.02em'
                    }}>
                        {currentPeriod.weight > 0
                            ? `${currentPeriod.weight.toFixed(1)} lbs`
                            : '—'
                        }
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {previousPeriod.weight > 0
                            ? `vs ${previousPeriod.weight.toFixed(1)} lbs last ${view === 'weekly' ? 'week' : 'month'}`
                            : `No data from last ${view === 'weekly' ? 'week' : 'month'}`
                        }
                    </div>
                </div>

                {/* Calories Average Card */}
                <div style={{
                    backgroundColor: 'var(--surface-hover)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            fontWeight: 500
                        }}>
                            Avg Calories
                        </span>
                        <ChangeIndicator change={caloriesChange} />
                    </div>
                    <div style={{
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        color: 'var(--foreground)',
                        letterSpacing: '-0.02em'
                    }}>
                        {currentPeriod.calories > 0
                            ? `${Math.round(currentPeriod.calories).toLocaleString()}`
                            : '—'
                        }
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {previousPeriod.calories > 0
                            ? `vs ${Math.round(previousPeriod.calories).toLocaleString()} last ${view === 'weekly' ? 'week' : 'month'}`
                            : `No data from last ${view === 'weekly' ? 'week' : 'month'}`
                        }
                    </div>
                </div>
            </div>

            {currentPeriod.entryCount > 0 && (
                <div style={{
                    marginTop: '0.75rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-tertiary)',
                    textAlign: 'center'
                }}>
                    Based on {currentPeriod.entryCount} {currentPeriod.entryCount === 1 ? 'entry' : 'entries'} this {view === 'weekly' ? 'week' : 'month'}
                    {previousPeriod.entryCount > 0 && ` • ${previousPeriod.entryCount} last ${view === 'weekly' ? 'week' : 'month'}`}
                </div>
            )}
        </div>
    );
}
