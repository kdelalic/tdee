"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import styles from "./Toast.module.css";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

interface ToastProviderProps {
    children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "success") => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className={styles.container}>
                {toasts.map((toast) => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onRemove={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

interface ToastItemProps {
    toast: Toast;
    onRemove: () => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
    useEffect(() => {
        const timer = setTimeout(onRemove, 3000);
        return () => clearTimeout(timer);
    }, [onRemove]);

    return (
        <div
            className={`${styles.toast} ${styles[toast.type]}`}
            role="alert"
            aria-live="polite"
        >
            <span className={styles.icon}>
                {toast.type === "success" && "✓"}
                {toast.type === "error" && "✕"}
                {toast.type === "info" && "ℹ"}
            </span>
            <span className={styles.message}>{toast.message}</span>
            <button
                className={styles.close}
                onClick={onRemove}
                aria-label="Dismiss notification"
            >
                ×
            </button>
        </div>
    );
}
