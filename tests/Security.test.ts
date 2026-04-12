import { describe, test, expect, beforeEach } from "bun:test";
import { RateLimiter } from "../src/shared/security/RateLimiter.ts";
import { InputSanitizer, generateCSRFToken, hashSensitiveData } from "../src/shared/security/Sanitizer.ts";

describe("RateLimiter", () => {
    let globalCounter = 0;
    
    function uniqueId(prefix: string): string {
        return `${prefix}-${++globalCounter}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    
    test("should allow first request", () => {
        const limiter = new RateLimiter(1000, 3);
        const result = limiter.check(uniqueId("user1"));
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(2);
    });
    
    test("should allow requests within limit", () => {
        const limiter = new RateLimiter(1000, 3);
        const userId = uniqueId("user2");
        limiter.check(userId);
        limiter.check(userId);
        const result = limiter.check(userId);
        
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(0);
    });
    
    test("should block requests over limit", () => {
        const limiter = new RateLimiter(1000, 3);
        const userId = uniqueId("user3");
        limiter.check(userId);
        limiter.check(userId);
        limiter.check(userId);
        const result = limiter.check(userId);
        
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
    });
    
    test("should track different users separately", () => {
        const limiter = new RateLimiter(1000, 3);
        const userA = uniqueId("userA");
        const userB = uniqueId("userB");
        
        const resultA1 = limiter.check(userA);
        expect(resultA1.remaining).toBe(2);
        
        limiter.check(userA);
        
        const resultB1 = limiter.check(userB);
        expect(resultB1.remaining).toBe(2);
        
        const resultB2 = limiter.check(userB);
        expect(resultB2.remaining).toBe(1);
    });
    
    test("should reset after window expires", async () => {
        const limiter = new RateLimiter(100, 2);
        const resetId = uniqueId("reset");
        
        limiter.check(resetId);
        limiter.check(resetId);
        const blocked = limiter.check(resetId);
        expect(blocked.allowed).toBe(false);
        
        await new Promise(resolve => setTimeout(resolve, 150));
        
        const allowed = limiter.check(resetId);
        expect(allowed.allowed).toBe(true);
    });
});

describe("InputSanitizer", () => {
    describe("sanitizeString", () => {
        test("should trim whitespace", () => {
            expect(InputSanitizer.sanitizeString("  hello  ")).toBe("hello");
        });
        
        test("should limit length", () => {
            const long = "a".repeat(300);
            expect(InputSanitizer.sanitizeString(long, 10).length).toBe(10);
        });
        
        test("should remove control characters", () => {
            expect(InputSanitizer.sanitizeString("hel\x00lo")).toBe("hello");
        });
        
        test("should return empty string for null/undefined", () => {
            expect(InputSanitizer.sanitizeString("")).toBe("");
        });
    });
    
    describe("sanitizeEmail", () => {
        test("should lowercase email", () => {
            expect(InputSanitizer.sanitizeEmail("TEST@EXAMPLE.COM")).toBe("test@example.com");
        });
        
        test("should trim and limit length", () => {
            const result = InputSanitizer.sanitizeEmail("  test@example.com  ");
            expect(result).toBe("test@example.com");
        });
    });
    
    describe("sanitizeUUID", () => {
        test("should accept valid UUID", () => {
            const uuid = "550e8400-e29b-41d4-a716-446655440000";
            expect(InputSanitizer.sanitizeUUID(uuid)).toBe(uuid);
        });
        
        test("should throw for invalid UUID", () => {
            expect(() => InputSanitizer.sanitizeUUID("invalid-uuid")).toThrow();
        });
        
        test("should trim UUID", () => {
            const uuid = "550e8400-e29b-41d4-a716-446655440000";
            expect(InputSanitizer.sanitizeUUID(`  ${uuid}  `)).toBe(uuid);
        });
    });
    
    describe("isValidEmail", () => {
        test("should validate correct emails", () => {
            expect(InputSanitizer.isValidEmail("test@example.com")).toBe(true);
            expect(InputSanitizer.isValidEmail("user.name@domain.co.uk")).toBe(true);
        });
        
        test("should reject invalid emails", () => {
            expect(InputSanitizer.isValidEmail("invalid")).toBe(false);
            expect(InputSanitizer.isValidEmail("test@")).toBe(false);
            expect(InputSanitizer.isValidEmail("@example.com")).toBe(false);
        });
    });
    
    describe("escapeSQL", () => {
        test("should escape single quotes", () => {
            expect(InputSanitizer.escapeSQL("O'Brien")).toBe("O''Brien");
        });
        
        test("should escape backslashes", () => {
            expect(InputSanitizer.escapeSQL("path\\to\\file")).toBe("path\\\\to\\\\file");
        });
    });
});

describe("generateCSRFToken", () => {
    test("should generate 64 character hex string", () => {
        const token = generateCSRFToken();
        expect(token.length).toBe(64);
        expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });
    
    test("should generate unique tokens", () => {
        const token1 = generateCSRFToken();
        const token2 = generateCSRFToken();
        expect(token1).not.toBe(token2);
    });
});

describe("hashSensitiveData", () => {
    test("should generate SHA256 hash", () => {
        const hash = hashSensitiveData("secret-data");
        expect(hash.length).toBe(64);
        expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
    });
    
    test("should generate same hash for same input", () => {
        const hash1 = hashSensitiveData("test");
        const hash2 = hashSensitiveData("test");
        expect(hash1).toBe(hash2);
    });
    
    test("should generate different hash for different input", () => {
        const hash1 = hashSensitiveData("data1");
        const hash2 = hashSensitiveData("data2");
        expect(hash1).not.toBe(hash2);
    });
});
