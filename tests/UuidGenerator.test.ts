import { describe, it, expect, beforeEach } from "bun:test";
import { UuidGenerator } from "../src/infrastructure/uuid/UuidGenerator.ts";

describe("Infrastructure: UuidGenerator", () => {
    let generator: UuidGenerator;

    beforeEach(() => {
        generator = new UuidGenerator();
    });

    describe("generate", () => {
        it("Should generate valid UUID v4", () => {
            const uuid = generator.generate();
            expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
        });

        it("Should generate unique UUIDs", () => {
            const uuid1 = generator.generate();
            const uuid2 = generator.generate();
            expect(uuid1).not.toBe(uuid2);
        });
    });
});
