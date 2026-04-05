import { describe, it, expect } from "bun:test";
import { Points } from "../src/domain/value-objects/Points.ts";

describe("Value Object: Points", () => {
    describe("Creation", () => {
        it("Should create points with valid amount", () => {
            const points = Points.create(100);
            expect(points.value).toBe(100);
        });

        it("Should create zero points", () => {
            const points = Points.zero();
            expect(points.value).toBe(0);
        });

        it("Should throw for negative points", () => {
            expect(() => Points.create(-10)).toThrow("Points cannot be negative");
        });

        it("Should throw for non-integer points", () => {
            expect(() => Points.create(10.5)).toThrow("Points must be an integer");
        });
    });

    describe("Operations", () => {
        it("Should add points correctly", () => {
            const p1 = Points.create(50);
            const p2 = Points.create(30);
            const result = p1.add(p2);
            expect(result.value).toBe(80);
        });

        it("Should subtract points correctly", () => {
            const p1 = Points.create(50);
            const p2 = Points.create(20);
            const result = p1.subtract(p2);
            expect(result.value).toBe(30);
        });

        it("Should throw when subtracting more points than available", () => {
            const p1 = Points.create(50);
            const p2 = Points.create(100);
            expect(() => p1.subtract(p2)).toThrow("Insufficient points");
        });

        it("Should check if points are zero", () => {
            const p1 = Points.zero();
            const p2 = Points.create(10);
            expect(p1.isZero()).toBe(true);
            expect(p2.isZero()).toBe(false);
        });
    });

    describe("Comparison", () => {
        it("Should compare two points correctly", () => {
            const p1 = Points.create(50);
            const p2 = Points.create(50);
            const p3 = Points.create(30);
            expect(p1.equals(p2)).toBe(true);
            expect(p1.equals(p3)).toBe(false);
        });
    });
});
