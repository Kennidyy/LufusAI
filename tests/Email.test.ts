import { describe, it, expect } from "bun:test";
import { Email } from "../src/domain/value-objects/Email.ts";
import type { IEmailValidator } from "../src/domain/value-objects/IEmailValidator.ts";

class MockEmailValidator implements IEmailValidator {
    private isValidResult: boolean;

    constructor(isValidResult: boolean = true) {
        this.isValidResult = isValidResult;
    }

    isValid(_input: string): boolean {
        return this.isValidResult;
    }

    setResult(result: boolean): void {
        this.isValidResult = result;
    }
}

describe("Value Object: Email", () => {
    describe("Creation", () => {
        it("Should create email with valid input", () => {
            const validator = new MockEmailValidator();
            const email = Email.create("Test@Example.com", validator);
            expect(email.value).toBe("test@example.com");
        });

        it("Should normalize email to lowercase", () => {
            const validator = new MockEmailValidator();
            const email = Email.create("UPPERCASE@TEST.COM", validator);
            expect(email.value).toBe("uppercase@test.com");
        });

        it("Should trim whitespace", () => {
            const validator = new MockEmailValidator();
            const email = Email.create("  test@test.com  ", validator);
            expect(email.value).toBe("test@test.com");
        });

        it("Should throw when email is empty", () => {
            const validator = new MockEmailValidator();
            expect(() => Email.create("", validator)).toThrow("Email is required");
        });

        it("Should throw when email is only whitespace", () => {
            const validator = new MockEmailValidator();
            expect(() => Email.create("   ", validator)).toThrow("Email is required");
        });

        it("Should throw when email exceeds 254 characters", () => {
            const validator = new MockEmailValidator();
            const longEmail = "a".repeat(255) + "@test.com";
            expect(() => Email.create(longEmail, validator)).toThrow("Email exceeds maximum length of 254 characters");
        });

        it("Should throw when email is invalid", () => {
            const validator = new MockEmailValidator(false);
            expect(() => Email.create("invalid-email", validator)).toThrow("Invalid email format");
        });
    });

    describe("Comparison", () => {
        it("Should compare two emails correctly", () => {
            const validator = new MockEmailValidator();
            const email1 = Email.create("test@test.com", validator);
            const email2 = Email.create("test@test.com", validator);
            const email3 = Email.create("other@test.com", validator);

            expect(email1.equals(email2)).toBe(true);
            expect(email1.equals(email3)).toBe(false);
        });
    });

    describe("Change", () => {
        it("Should change email value", () => {
            const validator = new MockEmailValidator();
            const email = Email.create("old@test.com", validator);
            const newEmail = email.change("new@test.com", validator);
            expect(newEmail.value).toBe("new@test.com");
        });
    });
});
