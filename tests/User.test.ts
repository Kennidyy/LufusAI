import { describe, it, expect, beforeEach } from "bun:test";
import { User } from "../src/domain/entities/User.ts";
import { ID } from "../src/domain/value-objects/ID.ts";
import { Email } from "../src/domain/value-objects/Email.ts";
import { Password } from "../src/domain/value-objects/Password.ts";
import { Name } from "../src/domain/value-objects/Name.ts";
import type { IEmailValidator } from "../src/domain/value-objects/IEmailValidator.ts";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

class MockEmailValidator implements IEmailValidator {
    isValid(_input: string): boolean {
        return true;
    }
}

describe("Entity: User", () => {
    let id: ID;
    let email: Email;
    let password: Password;
    let name: Name;
    let validator: IEmailValidator;

    beforeEach(() => {
        id = ID.restore(VALID_UUID);
        validator = new MockEmailValidator();
        email = Email.create("test@test.com", validator);
        password = Password.fromHashed("hashed_password");
        name = Name.create("John Doe");
    });

    describe("Creation", () => {
        it("Should create user with valid data", () => {
            const user = User.create(id, email, password, name);
            expect(user.id.value).toBe(VALID_UUID);
            expect(user.email.value).toBe("test@test.com");
            expect(user.name.value).toBe("John Doe");
            expect(user.createdAt).toBeInstanceOf(Date);
            expect(user.updatedAt).toBeInstanceOf(Date);
        });

        it("Should set createdAt and updatedAt to current time", () => {
            const before = new Date();
            const user = User.create(id, email, password, name);
            const after = new Date();

            expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(user.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
            expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(user.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
        });
    });

    describe("Restore", () => {
        it("Should restore user with existing data", () => {
            const createdAt = new Date("2024-01-01");
            const updatedAt = new Date("2024-01-02");
            const user = User.restore(id, email, password, name, createdAt, updatedAt);

            expect(user.id.value).toBe(VALID_UUID);
            expect(user.createdAt).toEqual(createdAt);
            expect(user.updatedAt).toEqual(updatedAt);
        });
    });
});
