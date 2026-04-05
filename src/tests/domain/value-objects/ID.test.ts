import { describe, it, expect } from "bun:test";
import type { IUuidGenerator } from "../../../domain/value-objects/IUuidGenerator.ts";
import { ID } from "../../../domain/value-objects/ID.ts";
import { UuidGenerator } from "../../../infrastructure/uuid/UuidGenerator.ts";

class MockUuidGenerator implements IUuidGenerator {
    generate(): string {
        return "test-uuid-123";
    }
}

class EmptyUuidGenerator implements IUuidGenerator {
    generate(): string {
        return "";
    }
}

describe("Value Object: ID", () => {
    describe("Creation", () => {
        it("Should create a valid ID", () => {
            const generator = new UuidGenerator();
            const id = ID.create(generator);
            expect(typeof id.value).toBe("string");
            expect(id.value.length).toBeGreaterThan(0);
        });

        it("Should throw for invalid UUID from generator", () => {
            const generator = new EmptyUuidGenerator();
            expect(() => ID.create(generator)).toThrow("UUID generator returned invalid value");
        });
    });

    describe("Comparison", () => {
        it("Should compare two IDs correctly", () => {
            const generator1 = new MockUuidGenerator();
            const generator2 = new MockUuidGenerator();
            const id1 = ID.create(generator1);
            const id2 = ID.create(generator2);
            expect(id1.equals(id2)).toBe(true);
            expect(id1.equals(id1)).toBe(true);
        });

        it("Should differentiate between different IDs", () => {
            const generator = new UuidGenerator();
            const id1 = ID.create(generator);
            const id2 = ID.create(generator);
            expect(id1.equals(id2)).toBe(false);
        });
    });
});
