"use client";

import { useTheme } from "./ThemeProvider";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
    className?: string;
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // Return a placeholder with the same dimensions if possible, or nothing
        // To avoid layout shift, we might want to apply the className to a div
        return <div className={className} />;
    }

    return (
        <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
            className={className}
        >
            {theme === 'light' ? '☀️' : '🌙'}
        </button>
    );
}
