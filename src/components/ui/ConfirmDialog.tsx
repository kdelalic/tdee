"use client";

import { useEffect, useRef } from "react";
import styles from "./ConfirmDialog.module.css";

interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "default";
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "default",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const confirmButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCancel();
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onCancel]);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        confirmButtonRef.current?.focus();
        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    return (
        <div
            className={styles.backdrop}
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
        >
            <div className={styles.dialog}>
                <h2 id="confirm-dialog-title" className={styles.title}>
                    {title}
                </h2>
                <p id="confirm-dialog-message" className={styles.message}>
                    {message}
                </p>
                <div className={styles.actions}>
                    <button
                        type="button"
                        onClick={onCancel}
                        className={styles.cancelButton}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        ref={confirmButtonRef}
                        type="button"
                        onClick={onConfirm}
                        className={`${styles.confirmButton} ${variant === "danger" ? styles.danger : ""}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
