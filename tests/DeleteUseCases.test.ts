import { describe, test, expect, beforeEach } from "bun:test";
import { DeleteUserUseCase } from "../src/application/use-cases/DeleteUserUseCase.ts";
import { DeleteAllUsersUseCase } from "../src/application/use-cases/DeleteAllUsersUseCase.ts";
import { MockUserRepository, MockWalletRepository } from "./mocks.ts";
import { CreateUserUseCase } from "../src/application/use-cases/CreateUserUseCase.ts";
import { MockUuidGenerator, MockEmailValidator, MockPasswordHash } from "./mocks.ts";

describe("DeleteUserUseCase", () => {
    let deleteUserUseCase: DeleteUserUseCase;
    let userRepository: MockUserRepository;
    let walletRepository: MockWalletRepository;
    let createUserUseCase: CreateUserUseCase;
    
    beforeEach(() => {
        userRepository = new MockUserRepository();
        walletRepository = new MockWalletRepository();
        deleteUserUseCase = new DeleteUserUseCase(userRepository, walletRepository);
        createUserUseCase = new CreateUserUseCase(
            userRepository,
            walletRepository,
            new MockUuidGenerator(),
            new MockEmailValidator(),
            new MockPasswordHash()
        );
    });
    
    test("should delete user and return success", async () => {
        const result = await createUserUseCase.execute({
            email: "delete@example.com",
            password: "Password1@",
            name: "Delete Me"
        });
        
        const deleteResult = await deleteUserUseCase.execute({ userId: result.user.id.value });
        
        expect(deleteResult.deleted).toBe(true);
    });
    
    test("should remove user from repository", async () => {
        const result = await createUserUseCase.execute({
            email: "remove@example.com",
            password: "Password1@",
            name: "Remove Me"
        });
        
        await deleteUserUseCase.execute({ userId: result.user.id.value });
        
        const found = await userRepository.findById(result.user.id.value);
        expect(found).toBeNull();
    });
    
    test("should remove wallet from repository", async () => {
        const result = await createUserUseCase.execute({
            email: "walletremove@example.com",
            password: "Password1@",
            name: "Wallet Remove"
        });
        
        await deleteUserUseCase.execute({ userId: result.user.id.value });
        
        const found = await walletRepository.findByUserId(result.user.id.value);
        expect(found).toBeNull();
    });
    
    test("should throw NotFoundError for non-existent user", async () => {
        await expect(deleteUserUseCase.execute({ userId: "non-existent-id" }))
            .rejects.toThrow("not found");
    });
    
    test("should throw ValidationError for empty userId", async () => {
        await expect(deleteUserUseCase.execute({ userId: "" }))
            .rejects.toThrow();
    });
});

describe("DeleteAllUsersUseCase", () => {
    let deleteAllUseCase: DeleteAllUsersUseCase;
    let userRepository: MockUserRepository;
    let walletRepository: MockWalletRepository;
    let createUserUseCase: CreateUserUseCase;
    
    beforeEach(() => {
        userRepository = new MockUserRepository();
        walletRepository = new MockWalletRepository();
        deleteAllUseCase = new DeleteAllUsersUseCase(userRepository, walletRepository);
        createUserUseCase = new CreateUserUseCase(
            userRepository,
            walletRepository,
            new MockUuidGenerator(),
            new MockEmailValidator(),
            new MockPasswordHash()
        );
    });
    
    test("should delete all users", async () => {
        await createUserUseCase.execute({
            email: "user1@example.com",
            password: "Password1@",
            name: "User One"
        });
        await createUserUseCase.execute({
            email: "user2@example.com",
            password: "Password1@",
            name: "User Two"
        });
        await createUserUseCase.execute({
            email: "user3@example.com",
            password: "Password1@",
            name: "User Three"
        });
        
        const result = await deleteAllUseCase.execute();
        
        expect(result.deletedCount).toBe(3);
    });
    
    test("should return 0 for empty database", async () => {
        const result = await deleteAllUseCase.execute();
        
        expect(result.deletedCount).toBe(0);
    });
    
    test("should remove all users from repository", async () => {
        await createUserUseCase.execute({
            email: "all1@example.com",
            password: "Password1@",
            name: "All One"
        });
        await createUserUseCase.execute({
            email: "all2@example.com",
            password: "Password1@",
            name: "All Two"
        });
        
        await deleteAllUseCase.execute();
        
        const allUsers = await userRepository.findAll();
        expect(allUsers.length).toBe(0);
    });
    
    test("should remove all wallets from repository", async () => {
        await createUserUseCase.execute({
            email: "wallets1@example.com",
            password: "Password1@",
            name: "Wallets One"
        });
        await createUserUseCase.execute({
            email: "wallets2@example.com",
            password: "Password1@",
            name: "Wallets Two"
        });
        
        await deleteAllUseCase.execute();
        
        const allWallets = walletRepository.getWallets();
        expect(allWallets.length).toBe(0);
    });
});
