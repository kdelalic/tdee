"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
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
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Sign Up</h1>
                {error && <p className={styles.error}>{error}</p>}
                <form onSubmit={handleSignup} className={styles.form}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={styles.input}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.input}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={styles.input}
                        required
                    />
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
