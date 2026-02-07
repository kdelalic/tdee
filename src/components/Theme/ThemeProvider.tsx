"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("light"); // Default safe for SSR, updated in effect

    useEffect(() => {
        // Check local storage first
        const stored = localStorage.getItem("theme") as Theme | null;
        if (stored === "light" || stored === "dark") {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTheme(stored);
            document.documentElement.setAttribute("data-theme", stored);
        } else {
            // Fallback to system
            const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            const initial = systemDark ? "dark" : "light";
            setTheme(initial);
            // We don't strictly need to set the attribute if it matches system, 
            // but setting it ensures consistency with the state.
            // However, keeping it unset allows CSS media query to work naturally suitable for "system" mode.
            // But the user requested "light or dark state". 
            // Let's set the attribute to be explicit.
            document.documentElement.setAttribute("data-theme", initial);
        }
    }, []);

    const toggleTheme = () => {
        setTheme((prev) => {
            const next = prev === "light" ? "dark" : "light";
            localStorage.setItem("theme", next);
            document.documentElement.setAttribute("data-theme", next);
            return next;
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
