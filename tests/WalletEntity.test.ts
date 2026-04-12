import { describe, it, expect, beforeEach } from "bun:test";
import { Wallet } from "../src/domain/entities/Wallet.ts";
import { ID } from "../src/domain/value-objects/ID.ts";
import { Points } from "../src/domain/value-objects/Points.ts";
import type { IUuidGenerator } from "../src/domain/value-objects/IUuidGenerator.ts";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_UUID_2 = "660e8400-e29b-41d4-a716-446655440000";

class MockUuidGenerator implements IUuidGenerator {
    generate(): string {
        return crypto.randomUUID();
    }
}

describe("Entity: Wallet", () => {
    let uuidGenerator: MockUuidGenerator;
    let userId: ID;

    beforeEach(() => {
        uuidGenerator = new MockUuidGenerator();
        userId = ID.restore(VALID_UUID);
    });

    describe("Creation", () => {
        it("Should create wallet with zero points", () => {
            const wallet = Wallet.create(userId, uuidGenerator);
            expect(wallet.points.value).toBe(0);
            expect(wallet.userId.value).toBe(VALID_UUID);
            expect(wallet.id.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
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
            const id = ID.restore(VALID_UUID_2);
            const createdAt = new Date("2024-01-01");
            const updatedAt = new Date("2024-01-02");
            const points = Points.create(100);

            const wallet = Wallet.restore(id, userId, points, createdAt, updatedAt);

            expect(wallet.id.value).toBe(VALID_UUID_2);
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
