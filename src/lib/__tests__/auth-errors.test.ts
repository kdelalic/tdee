import { getAuthErrorMessage } from "../firebase/auth-errors";

describe("getAuthErrorMessage", () => {
    // Sign In Errors
    it("should return message for auth/user-not-found", () => {
        expect(getAuthErrorMessage({ code: "auth/user-not-found" })).toBe(
            "No account found with this email address"
        );
    });

    it("should return message for auth/wrong-password", () => {
        expect(getAuthErrorMessage({ code: "auth/wrong-password" })).toBe(
            "Incorrect password. Please try again"
        );
    });

    it("should return message for auth/invalid-credential", () => {
        expect(getAuthErrorMessage({ code: "auth/invalid-credential" })).toBe(
            "Invalid email or password"
        );
    });

    it("should return message for auth/invalid-email", () => {
        expect(getAuthErrorMessage({ code: "auth/invalid-email" })).toBe(
            "Please enter a valid email address"
        );
    });

    it("should return message for auth/user-disabled", () => {
        expect(getAuthErrorMessage({ code: "auth/user-disabled" })).toBe(
            "This account has been disabled"
        );
    });

    it("should return message for auth/too-many-requests", () => {
        expect(getAuthErrorMessage({ code: "auth/too-many-requests" })).toBe(
            "Too many failed attempts. Please try again later"
        );
    });

    // Sign Up Errors
    it("should return message for auth/email-already-in-use", () => {
        expect(getAuthErrorMessage({ code: "auth/email-already-in-use" })).toBe(
            "An account with this email already exists"
        );
    });

    it("should return message for auth/weak-password", () => {
        expect(getAuthErrorMessage({ code: "auth/weak-password" })).toBe(
            "Password must be at least 6 characters"
        );
    });

    it("should return message for auth/operation-not-allowed", () => {
        expect(getAuthErrorMessage({ code: "auth/operation-not-allowed" })).toBe(
            "Account creation is currently disabled"
        );
    });

    // Network Errors
    it("should return message for auth/network-request-failed", () => {
        expect(getAuthErrorMessage({ code: "auth/network-request-failed" })).toBe(
            "Network error. Please check your connection"
        );
    });

    it("should return message for auth/timeout", () => {
        expect(getAuthErrorMessage({ code: "auth/timeout" })).toBe(
            "Request timed out. Please try again"
        );
    });

    // General Errors
    it("should return message for auth/internal-error", () => {
        expect(getAuthErrorMessage({ code: "auth/internal-error" })).toBe(
            "An internal error occurred. Please try again"
        );
    });

    it("should return message for auth/invalid-api-key", () => {
        expect(getAuthErrorMessage({ code: "auth/invalid-api-key" })).toBe(
            "Configuration error. Please contact support"
        );
    });

    // Edge cases
    it("should return default message for unknown error code", () => {
        expect(getAuthErrorMessage({ code: "auth/unknown-code" })).toBe(
            "Something went wrong. Please try again"
        );
    });

    it("should return unexpected error for null", () => {
        expect(getAuthErrorMessage(null)).toBe("An unexpected error occurred");
    });

    it("should return unexpected error for undefined", () => {
        expect(getAuthErrorMessage(undefined)).toBe("An unexpected error occurred");
    });

    it("should return unexpected error for non-object", () => {
        expect(getAuthErrorMessage("some string")).toBe("An unexpected error occurred");
    });

    it("should return default message for object without code", () => {
        expect(getAuthErrorMessage({ message: "error" })).toBe(
            "Something went wrong. Please try again"
        );
    });
});
