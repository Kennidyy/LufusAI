import { describe, it, expect } from "bun:test";
import { Email } from "../../../domain/value-objects/Email.ts";
import { EmailValidator } from "../../../infrastructure/validators/EmailValidator.ts";

const validator = new EmailValidator();

describe("Value Object: Email", () => {
    it("Should create a valid email", () => {
        const email = Email.create("toinhobolotas@gmail.com", validator);
        expect(email.value).toBe("toinhobolotas@gmail.com");
    });

    it("Should normalize email to lowercase", () => {
        const email = Email.create("TOINHOBOlotas@GMAIL.COM", validator);
        expect(email.value).toBe("toinhobolotas@gmail.com");
    });

    it("Should trim whitespace from email", () => {
        const email = Email.create("  john@example.com  ", validator);
        expect(email.value).toBe("john@example.com");
    });

    it("Should throw for empty email", () => {
        expect(() => Email.create("", validator)).toThrowError("Email is required");
    });

    it("Should throw for whitespace-only email", () => {
        expect(() => Email.create("   ", validator)).toThrowError("Email is required");
    });

    it("Should throw for invalid email format", () => {
        expect(() => Email.create("notanemail", validator)).toThrowError("Invalid email format");
    });

    it("Should throw for email exceeding max length", () => {
        const longEmail = "a".repeat(250) + "@test.com";
        expect(() => Email.create(longEmail, validator)).toThrowError("Email exceeds maximum length");
    });

    it("Should compare two emails correctly", () => {
        const email1 = Email.create("chinesadocaralho@gmail.com", validator);
        const email2 = Email.create("jenifervagaba@gmail.com", validator);
        const email3 = Email.create("CHINESADOCARALHO@GMAIL.COM", validator);
        expect(email1.equals(email2)).toBe(false);
        expect(email1.equals(email1)).toBe(true);
        expect(email1.equals(email3)).toBe(true);
    });
});
