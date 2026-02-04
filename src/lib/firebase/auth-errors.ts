/**
 * Maps Firebase Auth error codes to user-friendly messages
 */
export function getAuthErrorMessage(error: unknown): string {
    if (!error || typeof error !== "object") {
        return "An unexpected error occurred";
    }

    const errorCode = (error as { code?: string }).code;

    switch (errorCode) {
        // Sign In Errors
        case "auth/user-not-found":
            return "No account found with this email address";
        case "auth/wrong-password":
            return "Incorrect password. Please try again";
        case "auth/invalid-credential":
            return "Invalid email or password";
        case "auth/invalid-email":
            return "Please enter a valid email address";
        case "auth/user-disabled":
            return "This account has been disabled";
        case "auth/too-many-requests":
            return "Too many failed attempts. Please try again later";

        // Sign Up Errors
        case "auth/email-already-in-use":
            return "An account with this email already exists";
        case "auth/weak-password":
            return "Password must be at least 6 characters";
        case "auth/operation-not-allowed":
            return "Account creation is currently disabled";

        // Network Errors
        case "auth/network-request-failed":
            return "Network error. Please check your connection";
        case "auth/timeout":
            return "Request timed out. Please try again";

        // General Errors
        case "auth/internal-error":
            return "An internal error occurred. Please try again";
        case "auth/invalid-api-key":
            return "Configuration error. Please contact support";

        default:
            // Return a generic message for unknown errors
            return "Something went wrong. Please try again";
    }
}
