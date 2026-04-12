import { describe, it, expect, beforeEach } from "bun:test";
import { AddPointsUseCase } from "../src/application/use-cases/AddPointsUseCase.ts";
import { RemovePointsUseCase } from "../src/application/use-cases/RemovePointsUseCase.ts";
import type { IWalletRepository } from "../src/domain/repositories/IWalletRepository.ts";
import type { IUuidGenerator } from "../src/domain/value-objects/IUuidGenerator.ts";
import { Wallet } from "../src/domain/entities/Wallet.ts";

class MockUuidGenerator implements IUuidGenerator {
    generate(): string {
        return crypto.randomUUID();
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

    async delete(userId: string): Promise<void> {
        this.wallets = this.wallets.filter(w => w.userId.value !== userId);
    }

    async deleteAll(): Promise<void> {
        this.wallets = [];
    }
}

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_UUID_2 = "660e8400-e29b-41d4-a716-446655440000";

describe("AddPointsUseCase", () => {
    let repository: InMemoryWalletRepository;
    let uuidGenerator: MockUuidGenerator;
    let useCase: AddPointsUseCase;

    beforeEach(() => {
        repository = new InMemoryWalletRepository();
        uuidGenerator = new MockUuidGenerator();
        useCase = new AddPointsUseCase(repository, uuidGenerator);
    });

    it("Should create wallet and add points", async () => {
        const userId = VALID_UUID;
        const result = await useCase.execute({ userId, amount: 100 });

        expect(result.wallet.points.value).toBe(100);
        expect(repository.wallets.length).toBe(1);
    });

    it("Should add points to existing wallet", async () => {
        const userId = VALID_UUID;
        await useCase.execute({ userId, amount: 50 });
        const result = await useCase.execute({ userId, amount: 30 });

        expect(result.wallet.points.value).toBe(80);
    });
});

describe("RemovePointsUseCase", () => {
    let repository: InMemoryWalletRepository;
    let uuidGenerator: MockUuidGenerator;
    let addUseCase: AddPointsUseCase;
    let removeUseCase: RemovePointsUseCase;

    beforeEach(() => {
        repository = new InMemoryWalletRepository();
        uuidGenerator = new MockUuidGenerator();
        addUseCase = new AddPointsUseCase(repository, uuidGenerator);
        removeUseCase = new RemovePointsUseCase(repository, uuidGenerator);
    });

    it("Should remove points from wallet", async () => {
        const userId = VALID_UUID;
        await addUseCase.execute({ userId, amount: 100 });
        const result = await removeUseCase.execute({ userId, amount: 30 });

        expect(result.wallet.points.value).toBe(70);
    });

    it("Should throw when insufficient points", async () => {
        const userId = VALID_UUID;
        await addUseCase.execute({ userId, amount: 50 });

        await expect(removeUseCase.execute({ userId, amount: 100 }))
            .rejects.toThrow("Insufficient points");
    });

    it("Should throw when wallet not found", async () => {
        await expect(removeUseCase.execute({ userId: VALID_UUID_2, amount: 10 }))
            .rejects.toThrow("not found");
    });
});
