import { describe, it, expect } from "bun:test";
import { ID } from "../src/domain/value-objects/ID.ts";
import type { IUuidGenerator } from "../src/domain/value-objects/IUuidGenerator.ts";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

class MockUuidGenerator implements IUuidGenerator {
    generate(): string {
        return VALID_UUID;
    }
}

class MockInvalidUuidGenerator implements IUuidGenerator {
    generate(): string {
        return "";
    }
}

describe("Value Object: ID", () => {
    describe("Creation", () => {
        it("Should create ID with generated UUID", () => {
            const generator = new MockUuidGenerator();
            const id = ID.create(generator);
            expect(id.value).toBe(VALID_UUID);
        });

        it("Should throw when generator returns empty value", () => {
            const invalidGenerator = new MockInvalidUuidGenerator();
            expect(() => ID.create(invalidGenerator)).toThrow("UUID generator returned invalid value");
        });

        it("Should restore ID from existing value", () => {
            const id = ID.restore(VALID_UUID);
            expect(id.value).toBe(VALID_UUID);
        });

        it("Should throw when restoring with empty value", () => {
            expect(() => ID.restore("")).toThrow("ID is required");
        });
    });

    describe("Comparison", () => {
        it("Should compare two IDs correctly", () => {
            const id1 = ID.restore(VALID_UUID);
            const id2 = ID.restore(VALID_UUID);
            const id3 = ID.restore("660e8400-e29b-41d4-a716-446655440000");

            expect(id1.equals(id2)).toBe(true);
            expect(id1.equals(id3)).toBe(false);
        });
    });
});
