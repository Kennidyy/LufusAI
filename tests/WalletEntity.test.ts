import { describe, it, expect, beforeEach } from "bun:test";
import { Wallet } from "../src/domain/entities/Wallet.ts";
import { ID } from "../src/domain/value-objects/ID.ts";
import { Points } from "../src/domain/value-objects/Points.ts";
import type { IUuidGenerator } from "../src/domain/value-objects/IUuidGenerator.ts";

class MockUuidGenerator implements IUuidGenerator {
    private counter = 0;
    generate(): string {
        return `test-uuid-${++this.counter}`;
    }
}

describe("Entity: Wallet", () => {
    let uuidGenerator: MockUuidGenerator;
    let userId: ID;

    beforeEach(() => {
        uuidGenerator = new MockUuidGenerator();
        userId = ID.restore("test-user-id");
    });

    describe("Creation", () => {
        it("Should create wallet with zero points", () => {
            const wallet = Wallet.create(userId, uuidGenerator);
            expect(wallet.points.value).toBe(0);
            expect(wallet.userId.value).toBe("test-user-id");
            expect(wallet.id.value).toBe("test-uuid-1");
        });

        it("Should set createdAt and updatedAt to current time", () => {
            const before = new Date();
            const wallet = Wallet.create(userId, uuidGenerator);
            const after = new Date();

            expect(wallet.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(wallet.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
            expect(wallet.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(wallet.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
        });
    });

    describe("Restore", () => {
        it("Should restore wallet with existing data", () => {
            const id = ID.restore("wallet-id");
            const createdAt = new Date("2024-01-01");
            const updatedAt = new Date("2024-01-02");
            const points = Points.create(100);

            const wallet = Wallet.restore(id, userId, points, createdAt, updatedAt);

            expect(wallet.id.value).toBe("wallet-id");
            expect(wallet.points.value).toBe(100);
            expect(wallet.createdAt).toEqual(createdAt);
            expect(wallet.updatedAt).toEqual(updatedAt);
        });
    });

    describe("addPoints", () => {
        it("Should add points to wallet", () => {
            const wallet = Wallet.create(userId, uuidGenerator);
            const newWallet = wallet.addPoints(Points.create(50));

            expect(newWallet.points.value).toBe(50);
            expect(wallet.points.value).toBe(0);
        });

        it("Should return new wallet instance", () => {
            const wallet = Wallet.create(userId, uuidGenerator);
            const newWallet = wallet.addPoints(Points.create(50));

            expect(newWallet).not.toBe(wallet);
            expect(newWallet.id.value).toBe(wallet.id.value);
        });
    });

    describe("subtractPoints", () => {
        it("Should subtract points from wallet", () => {
            const wallet = Wallet.create(userId, uuidGenerator);
            const walletWithPoints = wallet.addPoints(Points.create(100));
            const newWallet = walletWithPoints.subtractPoints(Points.create(30));

            expect(newWallet.points.value).toBe(70);
        });

        it("Should return new wallet instance", () => {
            const wallet = Wallet.create(userId, uuidGenerator);
            const walletWithPoints = wallet.addPoints(Points.create(100));
            const newWallet = walletWithPoints.subtractPoints(Points.create(30));

            expect(newWallet).not.toBe(walletWithPoints);
        });
    });
});
