/**
 * Form validation utilities
 */

export interface ValidationResult {
    isValid: boolean;
    error: string | null;
}

export interface EntryFormData {
    weight: string;
    calories: string;
    date?: string;
}

export interface ParsedEntryData {
    weight: number;
    calories: number;
    date?: string;
}

/**
 * Validates that a value is a positive number.
 *
 * @param value - The number to validate
 * @param fieldName - Field name for error message
 * @param allowZero - Whether zero is valid (default: false)
 * @returns Validation result
 */
export function validatePositiveNumber(
    value: number,
    fieldName: string,
    allowZero = false
): ValidationResult {
    if (isNaN(value)) {
        return { isValid: false, error: `${fieldName} must be a valid number` };
    }
    if (value < 0) {
        return { isValid: false, error: `${fieldName} cannot be negative` };
    }
    if (!allowZero && value === 0) {
        return { isValid: false, error: `${fieldName} must be greater than zero` };
    }
    return { isValid: true, error: null };
}

/**
 * Parses and validates entry form data.
 *
 * @param formData - Raw form data with string values
 * @returns Parsed data and validation result
 */
export function parseEntryForm(formData: EntryFormData): {
    data: ParsedEntryData | null;
    error: string | null;
} {
    const weight = parseFloat(formData.weight);
    const calories = parseInt(formData.calories, 10);

    // Validate weight
    const weightValidation = validatePositiveNumber(weight, "Weight");
    if (!weightValidation.isValid) {
        return { data: null, error: weightValidation.error };
    }

    // Validate calories (allow zero for fasting days)
    const caloriesValidation = validatePositiveNumber(calories, "Calories", true);
    if (!caloriesValidation.isValid) {
        return { data: null, error: caloriesValidation.error };
    }

    return {
        data: {
            weight,
            calories,
            date: formData.date,
        },
        error: null,
    };
}

/**
 * Validates a weight value within reasonable bounds.
 *
 * @param weight - Weight to validate
 * @param units - 'lb' or 'kg'
 * @returns Validation result
 */
export function validateWeight(weight: number, units: "lb" | "kg" = "lb"): ValidationResult {
    const positiveCheck = validatePositiveNumber(weight, "Weight");
    if (!positiveCheck.isValid) return positiveCheck;

    // Set reasonable bounds based on units
    const maxWeight = units === "lb" ? 1000 : 450; // ~450kg = ~1000lbs
    const minWeight = units === "lb" ? 50 : 22; // ~22kg = ~50lbs

    if (weight > maxWeight) {
        return { isValid: false, error: `Weight cannot exceed ${maxWeight} ${units}` };
    }
    if (weight < minWeight) {
        return { isValid: false, error: `Weight must be at least ${minWeight} ${units}` };
    }

    return { isValid: true, error: null };
}

/**
 * Validates a calorie value within reasonable bounds.
 *
 * @param calories - Calories to validate
 * @returns Validation result
 */
export function validateCalories(calories: number): ValidationResult {
    const positiveCheck = validatePositiveNumber(calories, "Calories", true);
    if (!positiveCheck.isValid) return positiveCheck;

    const maxCalories = 15000; // Very generous upper limit
    if (calories > maxCalories) {
        return { isValid: false, error: `Calories cannot exceed ${maxCalories.toLocaleString()}` };
    }

    return { isValid: true, error: null };
}

/**
 * Validates password strength.
 *
 * @param password - Password to validate
 * @returns Validation result with strength indicator
 */
export function validatePassword(password: string): ValidationResult & { strength: "weak" | "medium" | "strong" } {
    if (password.length < 6) {
        return { isValid: false, error: "Password must be at least 6 characters", strength: "weak" };
    }

    let strength: "weak" | "medium" | "strong" = "weak";

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const score = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

    if (password.length >= 8 && score >= 3) {
        strength = "strong";
    } else if (password.length >= 6 && score >= 2) {
        strength = "medium";
    }

    return { isValid: true, error: null, strength };
}

/**
 * Validates an email address format.
 *
 * @param email - Email to validate
 * @returns Validation result
 */
export function validateEmail(email: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
        return { isValid: false, error: "Email is required" };
    }
    if (!emailRegex.test(email)) {
        return { isValid: false, error: "Please enter a valid email address" };
    }

    return { isValid: true, error: null };
}

/**
 * Escapes a value for CSV output.
 * Wraps in quotes and escapes internal quotes.
 *
 * @param value - Value to escape
 * @returns CSV-safe string
 */
export function escapeCSV(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '""';
    const str = String(value);
    // If contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}
