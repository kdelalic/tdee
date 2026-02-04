import {
    validatePositiveNumber,
    parseEntryForm,
    validateWeight,
    validateCalories,
    validatePassword,
    validateEmail,
    escapeCSV,
} from "../validation";

describe("validation", () => {
    describe("validatePositiveNumber", () => {
        it("should reject NaN values", () => {
            const result = validatePositiveNumber(NaN, "Weight");
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("valid number");
        });

        it("should reject negative values", () => {
            const result = validatePositiveNumber(-5, "Calories");
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("negative");
        });

        it("should reject zero by default", () => {
            const result = validatePositiveNumber(0, "Weight");
            expect(result.isValid).toBe(false);
            expect(result.error).toContain("greater than zero");
        });

        it("should allow zero when specified", () => {
            const result = validatePositiveNumber(0, "Calories", true);
            expect(result.isValid).toBe(true);
        });

        it("should accept positive values", () => {
            const result = validatePositiveNumber(185.5, "Weight");
            expect(result.isValid).toBe(true);
            expect(result.error).toBeNull();
        });
    });

    describe("parseEntryForm", () => {
        it("should parse valid form data", () => {
            const result = parseEntryForm({
                weight: "185.5",
                calories: "2000",
                date: "2024-01-15",
            });
            expect(result.error).toBeNull();
            expect(result.data).toEqual({
                weight: 185.5,
                calories: 2000,
                date: "2024-01-15",
            });
        });

        it("should reject invalid weight", () => {
            const result = parseEntryForm({
                weight: "abc",
                calories: "2000",
            });
            expect(result.error).not.toBeNull();
            expect(result.data).toBeNull();
        });

        it("should reject negative calories", () => {
            const result = parseEntryForm({
                weight: "185",
                calories: "-500",
            });
            expect(result.error).not.toBeNull();
        });

        it("should allow zero calories (fasting)", () => {
            const result = parseEntryForm({
                weight: "185",
                calories: "0",
            });
            expect(result.error).toBeNull();
            expect(result.data?.calories).toBe(0);
        });
    });

    describe("validateWeight", () => {
        it("should reject weights below minimum", () => {
            const result = validateWeight(30, "lb");
            expect(result.isValid).toBe(false);
        });

        it("should reject weights above maximum", () => {
            const result = validateWeight(1500, "lb");
            expect(result.isValid).toBe(false);
        });

        it("should accept reasonable weights", () => {
            expect(validateWeight(185, "lb").isValid).toBe(true);
            expect(validateWeight(84, "kg").isValid).toBe(true);
        });

        it("should handle kg units correctly", () => {
            const result = validateWeight(15, "kg"); // Too low
            expect(result.isValid).toBe(false);
        });
    });

    describe("validateCalories", () => {
        it("should accept zero calories", () => {
            const result = validateCalories(0);
            expect(result.isValid).toBe(true);
        });

        it("should reject extremely high values", () => {
            const result = validateCalories(20000);
            expect(result.isValid).toBe(false);
        });

        it("should accept normal calorie values", () => {
            expect(validateCalories(1500).isValid).toBe(true);
            expect(validateCalories(3000).isValid).toBe(true);
        });
    });

    describe("validatePassword", () => {
        it("should reject passwords under 6 characters", () => {
            const result = validatePassword("12345");
            expect(result.isValid).toBe(false);
            expect(result.strength).toBe("weak");
        });

        it("should mark weak passwords", () => {
            const result = validatePassword("password");
            expect(result.isValid).toBe(true);
            expect(result.strength).toBe("weak");
        });

        it("should mark medium passwords", () => {
            const result = validatePassword("Pass12"); // 6 chars, 2 criteria
            expect(result.isValid).toBe(true);
            expect(result.strength).toBe("medium");
        });

        it("should mark strong passwords", () => {
            const result = validatePassword("Password1"); // 8+ chars, 3 criteria
            expect(result.isValid).toBe(true);
            expect(result.strength).toBe("strong");
        });
    });

    describe("validateEmail", () => {
        it("should reject empty email", () => {
            const result = validateEmail("");
            expect(result.isValid).toBe(false);
        });

        it("should reject invalid email format", () => {
            expect(validateEmail("notanemail").isValid).toBe(false);
            expect(validateEmail("missing@domain").isValid).toBe(false);
            expect(validateEmail("@nodomain.com").isValid).toBe(false);
        });

        it("should accept valid email", () => {
            expect(validateEmail("user@example.com").isValid).toBe(true);
            expect(validateEmail("user.name@domain.co.uk").isValid).toBe(true);
        });
    });

    describe("escapeCSV", () => {
        it("should handle simple values", () => {
            expect(escapeCSV("hello")).toBe("hello");
            expect(escapeCSV(123)).toBe("123");
        });

        it("should escape values with commas", () => {
            expect(escapeCSV("hello, world")).toBe('"hello, world"');
        });

        it("should escape values with quotes", () => {
            expect(escapeCSV('say "hi"')).toBe('"say ""hi"""');
        });

        it("should escape values with newlines", () => {
            expect(escapeCSV("line1\nline2")).toBe('"line1\nline2"');
        });

        it("should handle null and undefined", () => {
            expect(escapeCSV(null)).toBe('""');
            expect(escapeCSV(undefined)).toBe('""');
        });
    });
});
