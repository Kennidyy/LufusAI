import { describe, it, expect, beforeEach } from "bun:test";
import { Password } from "../src/domain/value-objects/Password.ts";
import type { IPasswordHash } from "../src/domain/value-objects/IPasswordHash.ts";

class MockPasswordHash implements IPasswordHash {
    async hashPassword(plainText: string): Promise<string> {
        return `hashed_${plainText}`;
    }

    async verifyPassword(plainText: string, hashedPassword: string): Promise<boolean> {
        return hashedPassword === `hashed_${plainText}`;
    }
}

describe("Value Object: Password", () => {
    let passwordHash: MockPasswordHash;

    beforeEach(() => {
        passwordHash = new MockPasswordHash();
    });

    describe("Creation", () => {
        it("Should create password with valid input", async () => {
            const password = await Password.create("Password1!", passwordHash);
            expect(password.value).toBe("hashed_Password1!");
        });

        it("Should throw when password is empty", async () => {
            await expect(Password.create("", passwordHash)).rejects.toThrow("Password is required");
        });

        it("Should throw when password is less than 8 characters", async () => {
            await expect(Password.create("Pass1!", passwordHash)).rejects.toThrow("Password must be at least 8 characters");
        });

        it("Should throw when password exceeds 128 characters", async () => {
            const longPassword = "P".repeat(129);
            await expect(Password.create(longPassword, passwordHash)).rejects.toThrow("Password exceeds maximum length of 128 characters");
        });

        it("Should throw when password lacks lowercase", async () => {
            await expect(Password.create("PASSWORD1!", passwordHash)).rejects.toThrow("Password must contain at least one lowercase letter");
        });

        it("Should throw when password lacks uppercase", async () => {
            await expect(Password.create("password1!", passwordHash)).rejects.toThrow("Password must contain at least one uppercase letter");
        });

        it("Should throw when password lacks number", async () => {
            await expect(Password.create("Passworda!", passwordHash)).rejects.toThrow("Password must contain at least one number");
        });

        it("Should throw when password lacks special character", async () => {
            await expect(Password.create("Password1", passwordHash)).rejects.toThrow("Password must contain at least one special character");
        });

        it("Should throw when password has too many repeated characters", async () => {
            await expect(Password.create("Aaaaaaaa1!", passwordHash)).rejects.toThrow("Password contains too many repeated characters");
        });
    });

    describe("fromHashed", () => {
        it("Should create password from hashed value", () => {
            const password = Password.fromHashed("existing_hashed_password");
            expect(password.value).toBe("existing_hashed_password");
        });
    });

    describe("Comparison", () => {
        it("Should compare two passwords correctly", () => {
            const password1 = Password.fromHashed("same_hash");
            const password2 = Password.fromHashed("same_hash");
            const password3 = Password.fromHashed("different_hash");

            expect(password1.equals(password2)).toBe(true);
            expect(password1.equals(password3)).toBe(false);
        });
    });

    describe("Change", () => {
        it("Should change password value", async () => {
            const password = Password.fromHashed("old_hash");
            const newPassword = await password.change("NewPassword1!", passwordHash);
            expect(newPassword.value).toBe("hashed_NewPassword1!");
        });
    });
});
