import {describe, it, expect} from "bun:test";
import {ID} from "../../../../src/backend/User/Domain/ValueObjects/ID.ts";
import type {IUuidGenerator} from "../../../../src/backend/User/Domain/ValueObjects/Infrastructure/Uuid/IUuidGenerator.ts";
import {UuidGenerator} from "../../../../src/backend/User/Domain/ValueObjects/Infrastructure/Uuid/UuidGenerator.ts";

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

describe("Value Object: ID", (): void => {
    describe("Creation", (): void => {
        it("Should create a valid ID", (): void => {
            const generator: IUuidGenerator = new UuidGenerator();
            const id: ID = ID.create(generator);

            expect(typeof id.value).toBe("string");
            expect(id.value.length).toBeGreaterThan(0);
        });

        it("Should throw for invalid UUID from generator", (): void => {
            const generator = new EmptyUuidGenerator();

            expect(() => ID.create(generator)).toThrow("UUID generator returned invalid value");
        });
    });

    describe("Comparison", (): void => {
        it("Should compare two IDs correctly", (): void => {
            const generator1 = new MockUuidGenerator();
            const generator2 = new MockUuidGenerator();
            const id1: ID = ID.create(generator1);
            const id2: ID = ID.create(generator2);

            expect(id1.equals(id2)).toBe(true);
            expect(id1.equals(id1)).toBe(true);
        });

        it("Should differentiate between different IDs", (): void => {
            const generator = new UuidGenerator();
            const id1: ID = ID.create(generator);
            const id2: ID = ID.create(generator);

            expect(id1.equals(id2)).toBe(false);
        });
    });
});