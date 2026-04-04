import {describe, it, expect} from "bun:test";
import {Password} from "../../../../src/backend/User/ValueObjects/Password.ts";
import { Argon2IdPasswordHash } from "../../../../src/backend/User/ValueObjects/Infrastructure/Cryptography/Argon2IdPasswordHash.ts";

const hashPassword = new Argon2IdPasswordHash;

describe("Value Object: Password", (): void => {

    describe("Value Object: Password", (): void => {
        it("Should create a valid Password", async (): Promise<void> => {
            const password: Password = await Password.create("Carlos@143", hashPassword);
            expect(typeof password.value).toBe("string");
        });

        it("Empty password throws error", (): void => {
            expect(async (): Promise<Password> => await Password.create("", hashPassword)).toThrow("Password cannot be empty");
        });
        it("Password length < 8 throw error", (): void => {
            expect(async (): Promise<Password> => await Password.create("Mike@23", hashPassword)).toThrow("Password should be at least 8 characters long");
        });
        it("Missing lowercase throws error", (): void => {
            expect(async (): Promise<Password> => await Password.create("MIKEN@233", hashPassword)).toThrow("Password should contain at least one lowercase character");
        });
        it("Missing uppercase throws error", (): void => {
            expect(async (): Promise<Password> => await Password.create("miken@233", hashPassword)).toThrow("Password should contain at least one uppercase character");
        });
        it("Missing number throws error", (): void => {
            expect(async (): Promise<Password> => await Password.create("Miken@sdad", hashPassword)).toThrow("Password should contain at least one number character");
        });
        it("Missing symbol throws error", (): void => {
            expect(async (): Promise<Password> => await Password.create("Miken12sdad", hashPassword)).toThrow("Password should contain at least one symbol character");
        });
    });

    describe("Comparison", (): void => {
        it("Should compare two passwords correctly", async (): Promise<void> => {
            const password1: Password = await Password.create("Miken12#$", hashPassword);
            const password2: Password = await Password.create("Coffee3233$$", hashPassword);

            expect(password1.equals(password2)).toBe(false);
            expect(password1.equals(password1)).toBe(true);
        });
    });
});