import {it, describe, expect} from "bun:test";
import {Name} from "../../../../src/backend/User/ValueObjects/Name.ts";

describe("Value Object: Name", () => {
    it("Should create a valid Name", () => {
        const userName = Name.create("Jorge");

        expect(userName.value).toBe("Jorge");

    });

    it("Should trim the Name", () => {
        const userName = Name.create("       Mauricio      ");

        expect(userName.value).toBe("Mauricio");
    });

    it("Empty name throws error", () => {
        expect((): Name => Name.create("")).toThrow("Name cannot be empty");
    });

    it("Name length > 50 throws error", () => {
        expect((): Name => Name.create("Maximilian Alexandre Fernando Gabriel Theodor Sebastiano")).toThrow("Name length cannot be over 50 characters");
    });

    describe("Comparison", () => {
        it("Should compare two names correctly", () => {
            const name1: Name = Name.create("Alexandre");
            const name2: Name = Name.create("Sebastiano");
            expect(name1.equals(name2)).toBe(false);
            expect(name1.equals(name1)).toBe(true);
        });
    });
});