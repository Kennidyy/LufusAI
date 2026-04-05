import type { IUuidGenerator } from "../../../domain/value-objects/IUuidGenerator.ts";
import type { IEmailValidator } from "../../../domain/value-objects/IEmailValidator.ts";
import type { IPasswordHash } from "../../../domain/value-objects/IPasswordHash.ts";
import { describe, it, expect, beforeEach } from "bun:test";
import type { CreateUserInput } from "../../../application/use-cases/CreateUserUseCase.ts";
import { CreateUserUseCase } from "../../../application/use-cases/CreateUserUseCase.ts";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository.ts";
import { User } from "../../../domain/entities/User.ts";

class MockUserRepository implements IUserRepository {
    private users: User[] = [];

    async create(user: User): Promise<void> {
        this.users.push(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.users.find(u => u.email.value === email) || null;
    }

    async findById(id: string): Promise<User | null> {
        return this.users.find(u => u.id.value === id) || null;
    }
}

class MockUuidGenerator implements IUuidGenerator {
    private counter = 0;
    generate(): string {
        return `mock-uuid-${++this.counter}`;
    }
}

class MockEmailValidator implements IEmailValidator {
    isValid(input: string): boolean {
        return input.includes("@") && input.includes(".");
    }
}

class MockPasswordHash implements IPasswordHash {
    async hashPassword(input: string): Promise<string> {
        return "hashed_" + input;
    }
}

describe("CreateUserUseCase", () => {
    let repository: MockUserRepository;
    let uuidGenerator: MockUuidGenerator;
    let emailValidator: MockEmailValidator;
    let passwordHash: MockPasswordHash;
    let useCase: CreateUserUseCase;

    beforeEach(() => {
        repository = new MockUserRepository();
        uuidGenerator = new MockUuidGenerator();
        emailValidator = new MockEmailValidator();
        passwordHash = new MockPasswordHash();
        useCase = new CreateUserUseCase(
            repository,
            uuidGenerator,
            emailValidator,
            passwordHash
        );
    });

    it("Should create a new user", async () => {
        const input: CreateUserInput = {
            email: "test@example.com",
            password: "Password1@",
            name: "John Doe"
        };

        const result = await useCase.execute(input);

        expect(result.user).toBeDefined();
        expect(result.user.email.value).toBe("test@example.com");
        expect(result.user.name.value).toBe("John Doe");
    });

    it("Should throw when email already exists", async () => {
        const input: CreateUserInput = {
            email: "existing@example.com",
            password: "Password1@",
            name: "John Doe"
        };

        await useCase.execute(input);

        await expect(useCase.execute(input)).rejects.toThrow("User already exists");
    });

    it("Should throw for invalid email", async () => {
        const input: CreateUserInput = {
            email: "invalid-email",
            password: "Password1@",
            name: "John Doe"
        };

        await expect(useCase.execute(input)).rejects.toThrow("Invalid email format");
    });

    it("Should throw for weak password", async () => {
        const input: CreateUserInput = {
            email: "test@example.com",
            password: "weak",
            name: "John Doe"
        };

        await expect(useCase.execute(input)).rejects.toThrow("Password must be at least 8 characters");
    });
});
