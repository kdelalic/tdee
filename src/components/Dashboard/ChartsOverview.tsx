"use client";

import { useMemo } from "react";
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

interface ChartsOverviewProps {
    entries: DailyEntry[];
    settings: UserSettings | null;
}

export default function ChartsOverview({ entries, settings }: ChartsOverviewProps) {
    const data = useMemo(() => {
        // Clone and reverse to show oldest to newest
        return [...entries].reverse().map((entry) => {
            // Parse YYYY-MM-DD directly to avoid timezone issues
            const [year, month, day] = entry.date.split('-').map(Number);
            const dateObj = new Date(year, month - 1, day);

            return {
                date: dateObj.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                }),
                fullDate: entry.date,
                weight: entry.weight,
                calories: entry.calories,
            };
        });
    }, [entries]);

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

    // Colors
    const COLOR_WEIGHT = "var(--primary)";
    const COLOR_CALORIES = "#8b5cf6"; // Violet 500

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
                            {p.name}: {p.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className={styles.card}>
            <h2 className={styles.cardTitle}>Trends</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

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
                        </LineChart>
                    </ResponsiveContainer>
                </div>

            </div>
        </div>
    );
}
