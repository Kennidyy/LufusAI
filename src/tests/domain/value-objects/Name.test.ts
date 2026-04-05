import { describe, it, expect } from "bun:test";
import { Name } from "../../../domain/value-objects/Name.ts";

describe("Value Object: Name", () => {
    it("Should create a valid name", () => {
        const userName = Name.create("Jorge");
        expect(userName.value).toBe("Jorge");
    });

    it("Should trim whitespace", () => {
        const userName = Name.create("       Mauricio      ");
        expect(userName.value).toBe("Mauricio");
    });

    it("Should accept names with hyphens", () => {
        const userName = Name.create("Mary-Jane");
        expect(userName.value).toBe("Mary-Jane");
    });

    it("Should accept names with apostrophes", () => {
        const userName = Name.create("O'Connor");
        expect(userName.value).toBe("O'Connor");
    });

    it("Should accept accented characters", () => {
        const userName = Name.create("José António");
        expect(userName.value).toBe("José António");
    });

    it("Should throw for empty name", () => {
        expect(() => Name.create("")).toThrow("Name is required");
    });

    it("Should throw for whitespace-only name", () => {
        expect(() => Name.create("   ")).toThrow("Name is required");
    });

    it("Should throw for name exceeding 50 characters", () => {
        expect(() => Name.create("a".repeat(51))).toThrow("Name cannot exceed 50 characters");
    });

    it("Should throw for name with numbers", () => {
        expect(() => Name.create("John123")).toThrow("Name can only contain letters");
    });

    it("Should throw for name with special characters", () => {
        expect(() => Name.create("John@Doe")).toThrow("Name can only contain letters");
    });

    it("Should throw for consecutive hyphens", () => {
        expect(() => Name.create("John--Doe")).toThrow("cannot contain consecutive hyphens");
    });

    it("Should throw for consecutive apostrophes", () => {
        expect(() => Name.create("O''Neil")).toThrow("cannot contain consecutive hyphens or apostrophes");
    });

    it("Should throw for name starting with hyphen", () => {
        expect(() => Name.create("-John")).toThrow("cannot start or end with");
    });

    it("Should throw for name ending with apostrophe", () => {
        expect(() => Name.create("John'")).toThrow("cannot start or end with");
    });

    describe("Comparison", () => {
        it("Should compare two names correctly", () => {
            const name1 = Name.create("Alexandre");
            const name2 = Name.create("Sebastiano");
            expect(name1.equals(name2)).toBe(false);
            expect(name1.equals(name1)).toBe(true);
        });
    });
});
