import { describe, it, expect } from "bun:test";
import { Name } from "../src/domain/value-objects/Name.ts";

describe("Value Object: Name", () => {
    describe("Creation", () => {
        it("Should create name with valid input", () => {
            const name = Name.create("John Doe");
            expect(name.value).toBe("John Doe");
        });

        it("Should trim whitespace", () => {
            const name = Name.create("  John Doe  ");
            expect(name.value).toBe("John Doe");
        });

        it("Should throw when name is empty", () => {
            expect(() => Name.create("")).toThrow("Name is required");
        });

        it("Should throw when name is only whitespace", () => {
            expect(() => Name.create("   ")).toThrow("Name is required");
        });

        it("Should throw when name exceeds 50 characters", () => {
            const longName = "a".repeat(51);
            expect(() => Name.create(longName)).toThrow("Name cannot exceed 50 characters");
        });

        it("Should throw when name contains invalid characters", () => {
            expect(() => Name.create("John123")).toThrow("Name can only contain letters, spaces, hyphens, and apostrophes");
        });

        it("Should throw when name has consecutive hyphens", () => {
            expect(() => Name.create("John--Doe")).toThrow("Name cannot contain consecutive hyphens or apostrophes");
        });

        it("Should throw when name has consecutive apostrophes", () => {
            expect(() => Name.create("John''Doe")).toThrow("Name cannot contain consecutive hyphens or apostrophes");
        });

        it("Should throw when name starts with hyphen", () => {
            expect(() => Name.create("-John")).toThrow("Name cannot start or end with a space, hyphen, or apostrophe");
        });

        it("Should throw when name ends with apostrophe", () => {
            expect(() => Name.create("John'")).toThrow("Name cannot start or end with a space, hyphen, or apostrophe");
        });

        it("Should accept name with hyphen", () => {
            const name = Name.create("Mary-Jane");
            expect(name.value).toBe("Mary-Jane");
        });

        it("Should accept name with apostrophe", () => {
            const name = Name.create("O'Brien");
            expect(name.value).toBe("O'Brien");
        });

        it("Should accept name with accented characters", () => {
            const name = Name.create("José");
            expect(name.value).toBe("José");
        });
    });

    describe("Comparison", () => {
        it("Should compare two names correctly", () => {
            const name1 = Name.create("John");
            const name2 = Name.create("John");
            const name3 = Name.create("Jane");

            expect(name1.equals(name2)).toBe(true);
            expect(name1.equals(name3)).toBe(false);
        });
    });

    describe("Change", () => {
        it("Should change name value", () => {
            const name = Name.create("John");
            const newName = name.change("Jane");
            expect(newName.value).toBe("Jane");
        });
    });
});
