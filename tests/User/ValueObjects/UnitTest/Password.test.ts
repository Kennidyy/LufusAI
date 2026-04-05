import {describe, it, expect} from "bun:test";
import {Password} from "../../../../src/backend/User/Domain/ValueObjects/Password.ts";
import { Argon2IdPasswordHash } from "../../../../src/backend/User/Domain/ValueObjects/Infrastructure/Cryptography/Argon2IdPasswordHash.ts";

const hashPassword = new Argon2IdPasswordHash();

describe("Value Object: Password", (): void => {
    describe("Creation", (): void => {
        it("Should create a valid password", async (): Promise<void> => {
            const password: Password = await Password.create("Carlos@143", hashPassword);
            expect(typeof password.value).toBe("string");
            expect(password.value.length).toBeGreaterThan(0);
        });

        it("Should throw for empty password", async (): Promise<void> => {
            await expect(Password.create("", hashPassword)).rejects.toThrow("Password is required");
        });

        it("Should throw for password shorter than 8 characters", async (): Promise<void> => {
            await expect(Password.create("Mike@23", hashPassword)).rejects.toThrow("Password must be at least 8 characters");
        });

        it("Should throw for password exceeding max length", async (): Promise<void> => {
            await expect(Password.create("Aa1@" + "a".repeat(125), hashPassword)).rejects.toThrow("Password exceeds maximum length");
        });

        it("Should throw for password without lowercase", async (): Promise<void> => {
            await expect(Password.create("MIKEN@233", hashPassword)).rejects.toThrow("Password must contain at least one lowercase letter");
        });

        it("Should throw for password without uppercase", async (): Promise<void> => {
            await expect(Password.create("miken@233", hashPassword)).rejects.toThrow("Password must contain at least one uppercase letter");
        });

        it("Should throw for password without number", async (): Promise<void> => {
            await expect(Password.create("Miken@sdad", hashPassword)).rejects.toThrow("Password must contain at least one number");
        });

        it("Should throw for password without special character", async (): Promise<void> => {
            await expect(Password.create("Miken12sdad", hashPassword)).rejects.toThrow("Password must contain at least one special character");
        });

        it("Should throw for password with too many repeated characters", async (): Promise<void> => {
            await expect(Password.create("Aaaa1111@", hashPassword)).rejects.toThrow("Password contains too many repeated characters");
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