import {describe, it, expect} from "bun:test";
import {EmailValidator} from "../../../../src/backend/User/ValueObjects/Infrastructure/Validator/EmailValidator.ts";
import {Email} from "../../../../src/backend/User/ValueObjects/Email.ts";

const validator = new EmailValidator();

describe("Value Object: Email", () => {
    it("Should create a valid email", () => {
        const email = Email.create("toinhobolotas@gmail.com", validator);

        expect(email.value).toBe("toinhobolotas@gmail.com");
    });

    it("Empty email throw error", () => {
        expect(() => Email.create("", validator)).toThrowError("Email field can't be empty")
    })

    it("Compare two emails", () => {
        const email1 = Email.create("chinesadocaralho@gmail.com", validator);
        const email2 = Email.create("jenifervagaba@gmail.com", validator);

        expect(email1.equals(email2)).toBe(false);
        expect(email1.equals(email1)).toBe(true);
    });
});