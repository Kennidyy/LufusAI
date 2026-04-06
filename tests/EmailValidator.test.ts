import { describe, it, expect, beforeEach } from "bun:test";
import { EmailValidator } from "../src/infrastructure/validators/EmailValidator.ts";

describe("Infrastructure: EmailValidator", () => {
    let validator: EmailValidator;

    beforeEach(() => {
        validator = new EmailValidator();
    });

    describe("isValid", () => {
        it("Should accept valid email", () => {
            expect(validator.isValid("test@example.com")).toBe(true);
        });

        it("Should accept email with subdomain", () => {
            expect(validator.isValid("test@mail.example.com")).toBe(true);
        });

        it("Should accept email with plus sign", () => {
            expect(validator.isValid("test+tag@example.com")).toBe(true);
        });

        it("Should reject invalid email without @", () => {
            expect(validator.isValid("testexample.com")).toBe(false);
        });

        it("Should reject invalid email without domain", () => {
            expect(validator.isValid("test@")).toBe(false);
        });

        it("Should reject invalid email without TLD", () => {
            expect(validator.isValid("test@example")).toBe(false);
        });

        it("Should reject email with spaces", () => {
            expect(validator.isValid("test @example.com")).toBe(false);
        });
    });
});
