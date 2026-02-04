"use client";

import React, { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={styles.container}>
                    <div style={styles.card}>
                        <div style={styles.icon}>⚠️</div>
                        <h2 style={styles.title}>Something went wrong</h2>
                        <p style={styles.message}>
                            We encountered an unexpected error. Please try refreshing the page.
                        </p>
                        {this.state.error && (
                            <details style={styles.details}>
                                <summary style={styles.summary}>Error details</summary>
                                <pre style={styles.errorText}>{this.state.error.message}</pre>
                            </details>
                        )}
                        <div style={styles.actions}>
                            <button onClick={this.handleRetry} style={styles.retryButton}>
                                Try Again
                            </button>
                            <button onClick={() => window.location.reload()} style={styles.reloadButton}>
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        padding: "2rem",
    },
    card: {
        maxWidth: "500px",
        width: "100%",
        padding: "2rem",
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        textAlign: "center",
    },
    icon: {
        fontSize: "3rem",
        marginBottom: "1rem",
    },
    title: {
        fontSize: "1.5rem",
        fontWeight: 700,
        color: "var(--foreground)",
        marginBottom: "0.75rem",
    },
    message: {
        color: "var(--text-secondary)",
        fontSize: "0.9375rem",
        marginBottom: "1.5rem",
        lineHeight: 1.6,
    },
    details: {
        textAlign: "left",
        marginBottom: "1.5rem",
        padding: "1rem",
        backgroundColor: "var(--surface-hover)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
    },
    summary: {
        cursor: "pointer",
        fontWeight: 600,
        color: "var(--text-secondary)",
        fontSize: "0.875rem",
    },
    errorText: {
        marginTop: "0.75rem",
        padding: "0.75rem",
        backgroundColor: "var(--background)",
        borderRadius: "var(--radius-sm)",
        fontSize: "0.75rem",
        color: "var(--error)",
        overflow: "auto",
        maxHeight: "150px",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
    },
    actions: {
        display: "flex",
        gap: "0.75rem",
        justifyContent: "center",
        flexWrap: "wrap",
    },
    retryButton: {
        padding: "0.75rem 1.5rem",
        backgroundColor: "var(--primary)",
        color: "white",
        border: "none",
        borderRadius: "var(--radius-md)",
        fontWeight: 600,
        cursor: "pointer",
    },
    reloadButton: {
        padding: "0.75rem 1.5rem",
        backgroundColor: "var(--surface-hover)",
        color: "var(--foreground)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        fontWeight: 600,
        cursor: "pointer",
    },
};
