import { describe, test, expect, beforeEach } from "bun:test";
import { AddPointsUseCase } from "../src/application/use-cases/AddPointsUseCase.ts";
import { MockWalletRepository, MockUuidGenerator } from "./mocks.ts";
import { Wallet } from "../src/domain/entities/Wallet.ts";
import { Points } from "../src/domain/value-objects/Points.ts";
import { ID } from "../src/domain/value-objects/ID.ts";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("AddPointsUseCase", () => {
    let useCase: AddPointsUseCase;
    let walletRepository: MockWalletRepository;
    let uuidGenerator: MockUuidGenerator;
    
    beforeEach(() => {
        walletRepository = new MockWalletRepository();
        uuidGenerator = new MockUuidGenerator();
        useCase = new AddPointsUseCase(walletRepository, uuidGenerator);
    });
    
    test("should add points to existing wallet", async () => {
        const userId = VALID_UUID;
        const wallet = Wallet.restore(
            ID.restore(VALID_UUID),
            ID.restore(userId),
            Points.zero(),
            new Date(),
            new Date()
        );
        await walletRepository.create(wallet);
        
        const result = await useCase.execute({ userId, amount: 100 });
        
        expect(result.wallet.points.value).toBe(100);
    });
    
    test("should create wallet if not exists", async () => {
        const userId = VALID_UUID;
        
        const result = await useCase.execute({ userId, amount: 50 });
        
        expect(result.wallet.points.value).toBe(50);
        const found = await walletRepository.findByUserId(userId);
        expect(found).not.toBeNull();
    });
    
    test("should accumulate points", async () => {
        const userId = VALID_UUID;
        const wallet = Wallet.restore(
            ID.restore(VALID_UUID),
            ID.restore(userId),
            Points.create(100),
            new Date(),
            new Date()
        );
        await walletRepository.create(wallet);
        
        const result = await useCase.execute({ userId, amount: 50 });
        
        expect(result.wallet.points.value).toBe(150);
    });
    
    test("should throw ValidationError for empty userId", async () => {
        await expect(useCase.execute({ userId: "", amount: 100 }))
            .rejects.toThrow();
    });
    
    test("should throw ValidationError for zero amount", async () => {
        await expect(useCase.execute({ userId: VALID_UUID, amount: 0 }))
            .rejects.toThrow();
    });
    
    test("should throw ValidationError for negative amount", async () => {
        await expect(useCase.execute({ userId: VALID_UUID, amount: -10 }))
            .rejects.toThrow();
    });
    
    test("should store updated wallet in repository", async () => {
        const userId = VALID_UUID;
        const wallet = Wallet.restore(
            ID.restore(VALID_UUID),
            ID.restore(userId),
            Points.zero(),
            new Date(),
            new Date()
        );
        await walletRepository.create(wallet);
        
        await useCase.execute({ userId, amount: 75 });
        
        const found = await walletRepository.findByUserId(userId);
        expect(found?.points.value).toBe(75);
    });
});
