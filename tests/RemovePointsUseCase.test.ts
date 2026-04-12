import { describe, test, expect, beforeEach } from "bun:test";
import { RemovePointsUseCase } from "../src/application/use-cases/RemovePointsUseCase.ts";
import { MockWalletRepository, MockUuidGenerator } from "./mocks.ts";
import { Wallet } from "../src/domain/entities/Wallet.ts";
import { Points } from "../src/domain/value-objects/Points.ts";
import { ID } from "../src/domain/value-objects/ID.ts";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("RemovePointsUseCase", () => {
    let useCase: RemovePointsUseCase;
    let walletRepository: MockWalletRepository;
    let uuidGenerator: MockUuidGenerator;
    
    beforeEach(() => {
        walletRepository = new MockWalletRepository();
        uuidGenerator = new MockUuidGenerator();
        useCase = new RemovePointsUseCase(walletRepository, uuidGenerator);
    });
    
    async function createWalletWithPoints(userId: string, points: number): Promise<Wallet> {
        const wallet = Wallet.restore(
            ID.restore(VALID_UUID),
            ID.restore(userId),
            Points.create(points),
            new Date(),
            new Date()
        );
        await walletRepository.create(wallet);
        return wallet;
    }
    
    test("should remove points from existing wallet", async () => {
        const userId = VALID_UUID;
        await createWalletWithPoints(userId, 100);
        
        const result = await useCase.execute({ userId, amount: 30 });
        
        expect(result.wallet.points.value).toBe(70);
    });
    
    test("should remove all points", async () => {
        const userId = VALID_UUID;
        await createWalletWithPoints(userId, 50);
        
        const result = await useCase.execute({ userId, amount: 50 });
        
        expect(result.wallet.points.value).toBe(0);
    });
    
    test("should throw DomainError for insufficient points", async () => {
        const userId = VALID_UUID;
        await createWalletWithPoints(userId, 30);
        
        await expect(useCase.execute({ userId, amount: 50 }))
            .rejects.toThrow("Insufficient points");
    });
    
    test("should throw NotFoundError for non-existent wallet", async () => {
        await expect(useCase.execute({ userId: VALID_UUID, amount: 10 }))
            .rejects.toThrow("not found");
    });
    
    test("should throw ValidationError for empty userId", async () => {
        await expect(useCase.execute({ userId: "", amount: 10 }))
            .rejects.toThrow();
    });
    
    test("should throw ValidationError for zero amount", async () => {
        await expect(useCase.execute({ userId: VALID_UUID, amount: 0 }))
            .rejects.toThrow();
    });
    
    test("should throw ValidationError for negative amount", async () => {
        await expect(useCase.execute({ userId: VALID_UUID, amount: -5 }))
            .rejects.toThrow();
    });
    
    test("should store updated wallet in repository", async () => {
        const userId = VALID_UUID;
        await createWalletWithPoints(userId, 100);
        
        await useCase.execute({ userId, amount: 40 });
        
        const found = await walletRepository.findByUserId(userId);
        expect(found?.points.value).toBe(60);
    });
});
