"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/firebase";
import { getAuthErrorMessage } from "@/lib/firebase/auth-errors";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./login.module.css";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isResetMode, setIsResetMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/dashboard");
        } catch (err: unknown) {
            setError(getAuthErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage("Password reset email sent. Check your inbox.");
        } catch (err: unknown) {
            setError(getAuthErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const toggleResetMode = () => {
        setIsResetMode(!isResetMode);
        setError("");
        setMessage("");
    };

    if (isResetMode) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <h1 className={styles.title}>Reset Password</h1>
                    {error && <p className={styles.error}>{error}</p>}
                    {message && <p className={styles.success}>{message}</p>}
                    <form onSubmit={handlePasswordReset} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="reset-email" className={styles.label}>Email</label>
                            <input
                                id="reset-email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={styles.input}
                                required
                            />
                        </div>
                        <button type="submit" className={styles.button} disabled={loading}>
                            {loading ? "Sending..." : "Send Reset Email"}
                        </button>
                    </form>
                    <p className={styles.footer}>
                        Remember your password?{" "}
                        <button type="button" onClick={toggleResetMode} className={styles.linkButton}>
                            Back to login
                        </button>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Login</h1>
                {error && <p className={styles.error}>{error}</p>}
                <form onSubmit={handleLogin} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="login-email" className={styles.label}>Email</label>
                        <input
                            id="login-email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={styles.input}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="login-password" className={styles.label}>Password</label>
                        <input
                            id="login-password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                            required
                        />
                    </div>
                    <button type="submit" className={styles.button} disabled={loading}>
                        {loading ? "Logging in..." : "Log In"}
                    </button>
                </form>
                <button type="button" onClick={toggleResetMode} className={styles.forgotPassword}>
                    Forgot password?
                </button>
                <p className={styles.footer}>
                    Don&apos;t have an account? <Link href="/signup">Sign up</Link>
                </p>
            </div>
        </div>
    );
}
