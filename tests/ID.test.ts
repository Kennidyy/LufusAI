import { describe, it, expect } from "bun:test";
import { ID } from "../src/domain/value-objects/ID.ts";
import type { IUuidGenerator } from "../src/domain/value-objects/IUuidGenerator.ts";

class MockUuidGenerator implements IUuidGenerator {
    generate(): string {
        return "test-uuid-123";
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
            expect(id.value).toBe("test-uuid-123");
        });

        it("Should throw when generator returns empty value", () => {
            const invalidGenerator = new MockInvalidUuidGenerator();
            expect(() => ID.create(invalidGenerator)).toThrow("UUID generator returned invalid value");
        });

        it("Should restore ID from existing value", () => {
            const id = ID.restore("existing-id");
            expect(id.value).toBe("existing-id");
        });

        it("Should throw when restoring with empty value", () => {
            expect(() => ID.restore("")).toThrow("ID cannot be empty");
        });
    });

    describe("Comparison", () => {
        it("Should compare two IDs correctly", () => {
            const id1 = ID.restore("same-id");
            const id2 = ID.restore("same-id");
            const id3 = ID.restore("different-id");

            expect(id1.equals(id2)).toBe(true);
            expect(id1.equals(id3)).toBe(false);
        });
    });
});
