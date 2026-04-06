import { describe, it, expect, beforeEach } from "bun:test";
import { CreateUserUseCase } from "../src/application/use-cases/CreateUserUseCase.ts";
import type { IUserRepository } from "../src/domain/repositories/IUserRepository.ts";
import type { IWalletRepository } from "../src/domain/repositories/IWalletRepository.ts";
import type { IUuidGenerator } from "../src/domain/value-objects/IUuidGenerator.ts";
import type { IEmailValidator } from "../src/domain/value-objects/IEmailValidator.ts";
import type { IPasswordHash } from "../src/domain/value-objects/IPasswordHash.ts";
import { User } from "../src/domain/entities/User.ts";
import { Wallet } from "../src/domain/entities/Wallet.ts";

class MockUuidGenerator implements IUuidGenerator {
    private counter = 0;
    generate(): string {
        return `mock-uuid-${++this.counter}`;
    }
}

class MockEmailValidator implements IEmailValidator {
    isValid(_input: string): boolean {
        return true;
    }
}

class MockPasswordHash implements IPasswordHash {
    async hashPassword(plainText: string): Promise<string> {
        return `hashed_${plainText}`;
    }

    async verifyPassword(_plainText: string, _hashedPassword: string): Promise<boolean> {
        return true;
    }
}

class InMemoryUserRepository implements IUserRepository {
    users: User[] = [];

    async create(user: User): Promise<void> {
        this.users.push(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.users.find(u => u.email.value === email) || null;
    }

    async findById(id: string): Promise<User | null> {
        return this.users.find(u => u.id.value === id) || null;
    }

    async findAll(): Promise<User[]> {
        return this.users;
    }
}

class InMemoryWalletRepository implements IWalletRepository {
    wallets: Wallet[] = [];

    async create(wallet: Wallet): Promise<void> {
        this.wallets.push(wallet);
    }

    async findByUserId(userId: string): Promise<Wallet | null> {
        return this.wallets.find(w => w.userId.value === userId) || null;
    }

    async findById(id: string): Promise<Wallet | null> {
        return this.wallets.find(w => w.id.value === id) || null;
    }

    async update(wallet: Wallet): Promise<void> {
        const index = this.wallets.findIndex(w => w.id.value === wallet.id.value);
        if (index >= 0) {
            this.wallets[index] = wallet;
        }
    }
}

describe("UseCase: CreateUserUseCase", () => {
    let userRepository: InMemoryUserRepository;
    let walletRepository: InMemoryWalletRepository;
    let uuidGenerator: MockUuidGenerator;
    let emailValidator: MockEmailValidator;
    let passwordHash: MockPasswordHash;
    let useCase: CreateUserUseCase;

    beforeEach(() => {
        userRepository = new InMemoryUserRepository();
        walletRepository = new InMemoryWalletRepository();
        uuidGenerator = new MockUuidGenerator();
        emailValidator = new MockEmailValidator();
        passwordHash = new MockPasswordHash();
        useCase = new CreateUserUseCase(
            userRepository,
            walletRepository,
            uuidGenerator,
            emailValidator,
            passwordHash
        );
    });

    describe("execute", () => {
        it("Should create user with valid data", async () => {
            const result = await useCase.execute({
                email: "test@test.com",
                password: "Password1!",
                name: "John Doe"
            });

            expect(result.user.email.value).toBe("test@test.com");
            expect(result.user.name.value).toBe("John Doe");
            expect(result.wallet.points.value).toBe(0);
        });

        it("Should throw when email already exists", async () => {
            await useCase.execute({
                email: "existing@test.com",
                password: "Password1!",
                name: "John Doe"
            });

            await expect(useCase.execute({
                email: "existing@test.com",
                password: "Password1!",
                name: "Jane Doe"
            })).rejects.toThrow("User already exists");
        });

        it("Should create wallet for new user", async () => {
            const result = await useCase.execute({
                email: "test@test.com",
                password: "Password1!",
                name: "John Doe"
            });

            expect(result.wallet.userId.value).toBe(result.user.id.value);
            expect(result.wallet.points.value).toBe(0);
        });

        it("Should persist user to repository", async () => {
            await useCase.execute({
                email: "test@test.com",
                password: "Password1!",
                name: "John Doe"
            });

            expect(userRepository.users.length).toBe(1);
        });

        it("Should persist wallet to repository", async () => {
            await useCase.execute({
                email: "test@test.com",
                password: "Password1!",
                name: "John Doe"
            });

            expect(walletRepository.wallets.length).toBe(1);
        });
    });
});
