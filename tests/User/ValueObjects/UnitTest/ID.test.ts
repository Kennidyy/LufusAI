import {describe, it, expect} from "bun:test";
import {ID} from "../../../../src/backend/User/Domain/ValueObjects/ID.ts";
import type {IUuidGenerator} from "../../../../src/backend/User/Domain/ValueObjects/Infrastructure/Uuid/IUuidGenerator.ts";
import {UuidGenerator} from "../../../../src/backend/User/Domain/ValueObjects/Infrastructure/Uuid/UuidGenerator.ts";


describe("Value Object: ID", (): void => {
    describe("Creation", (): void => {
        it("Should create a valid ID", (): void => {
            const generator: IUuidGenerator = new UuidGenerator;
            const id: ID = ID.create(generator);
            expect(typeof id.value).toBe("string");
            expect(generator).toBeInstanceOf(UuidGenerator);
        });
    });

    describe("Comparison", (): void => {
        it("Should compare two ids correctly", (): void => {
            const generator: IUuidGenerator = new UuidGenerator;
            const id1: ID = ID.create(generator);
            const id2: ID = ID.create(generator);

            expect(id1.equals(id2)).toBe(false);
            expect(id1.equals(id1)).toBe(true);
        });
    });
});