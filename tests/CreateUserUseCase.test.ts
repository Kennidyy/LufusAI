import { describe, test, expect, beforeEach } from "bun:test";
import { CreateUserUseCase } from "../src/application/use-cases/CreateUserUseCase.ts";
import { MockUserRepository, MockWalletRepository, MockUuidGenerator, MockEmailValidator, MockPasswordHash } from "./mocks.ts";

describe("CreateUserUseCase", () => {
    let useCase: CreateUserUseCase;
    let userRepository: MockUserRepository;
    let walletRepository: MockWalletRepository;
    let uuidGenerator: MockUuidGenerator;
    let emailValidator: MockEmailValidator;
    let passwordHash: MockPasswordHash;
    
    beforeEach(() => {
        userRepository = new MockUserRepository();
        walletRepository = new MockWalletRepository();
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
    
    test("should create user with wallet successfully", async () => {
        const result = await useCase.execute({
            email: "test@example.com",
            password: "Password1@",
            name: "Test User"
        });
        
        expect(result.user.email.value).toBe("test@example.com");
        expect(result.user.name.value).toBe("Test User");
        expect(result.wallet.points.value).toBe(0);
        expect(result.wallet.userId.value).toBe(result.user.id.value);
    });
    
    test("should create wallet with same user ID", async () => {
        const result = await useCase.execute({
            email: "wallet@example.com",
            password: "Password1@",
            name: "Wallet Test"
        });
        
        expect(result.wallet.userId.value).toBe(result.user.id.value);
    });
    
    test("should store user in repository", async () => {
        const result = await useCase.execute({
            email: "storage@example.com",
            password: "Password1@",
            name: "Storage Test"
        });
        
        const found = await userRepository.findById(result.user.id.value);
        expect(found).not.toBeNull();
        expect(found?.email.value).toBe("storage@example.com");
    });
    
    test("should store wallet in repository", async () => {
        const result = await useCase.execute({
            email: "walletstore@example.com",
            password: "Password1@",
            name: "Wallet Store"
        });
        
        const found = await walletRepository.findByUserId(result.user.id.value);
        expect(found).not.toBeNull();
        expect(found?.points.value).toBe(0);
    });
    
    test("should throw ConflictError for duplicate email", async () => {
        await useCase.execute({
            email: "duplicate@example.com",
            password: "Password1@",
            name: "First User"
        });
        
        await expect(useCase.execute({
            email: "duplicate@example.com",
            password: "Password1@",
            name: "Second User"
        })).rejects.toThrow("already exists");
    });
    
    test("should throw ValidationError for empty email", async () => {
        await expect(useCase.execute({
            email: "",
            password: "Password1@",
            name: "Test"
        })).rejects.toThrow();
    });
    
    test("should throw ValidationError for empty password", async () => {
        await expect(useCase.execute({
            email: "test@example.com",
            password: "",
            name: "Test"
        })).rejects.toThrow();
    });
    
    test("should throw ValidationError for empty name", async () => {
        await expect(useCase.execute({
            email: "test@example.com",
            password: "Password1@",
            name: ""
        })).rejects.toThrow();
    });
    
    test("should hash password", async () => {
        const result = await useCase.execute({
            email: "hash@example.com",
            password: "Password1@",
            name: "Hash Test"
        });
        
        expect(result.user.password.value).toBe("hashed_Password1@");
    });
    
    test("should normalize email to lowercase", async () => {
        const result = await useCase.execute({
            email: "TEST@EXAMPLE.COM",
            password: "Password1@",
            name: "Lowercase Test"
        });
        
        expect(result.user.email.value).toBe("test@example.com");
    });
});
