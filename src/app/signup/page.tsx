"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { getAuthErrorMessage } from "@/lib/firebase/auth-errors";
import Link from "next/link";
import styles from "../login/login.module.css"; // Reuse login styles

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Create user document
            await setDoc(doc(db, "users", userCredential.user.uid), {
                email: email,
                createdAt: new Date().toISOString(),
            });
            router.push("/dashboard");
        } catch (err: unknown) {
            setError(getAuthErrorMessage(err));
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Sign Up</h1>
                {error && <p className={styles.error}>{error}</p>}
                <form onSubmit={handleSignup} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="signup-email" className={styles.label}>Email</label>
                        <input
                            id="signup-email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={styles.input}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="signup-password" className={styles.label}>Password</label>
                        <input
                            id="signup-password"
                            type="password"
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="signup-confirm" className={styles.label}>Confirm Password</label>
                        <input
                            id="signup-confirm"
                            type="password"
                            placeholder="Re-enter your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={styles.input}
                            required
                        />
                    </div>
                    <button type="submit" className={styles.button}>
                        Create Account
                    </button>
                </form>
                <p className={styles.footer}>
                    Already have an account? <Link href="/login">Log in</Link>
                </p>
            </div>
        </div>
    );
}
