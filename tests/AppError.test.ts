import { describe, test, expect } from "bun:test";
import { 
    AppError, 
    NotFoundError, 
    ValidationError, 
    ConflictError, 
    DomainError 
} from "../src/domain/errors/AppError.ts";

describe("AppError", () => {
    test("should create error with default values", () => {
        const error = new AppError("Test error", "TEST_ERROR");
        
        expect(error.message).toBe("Test error");
        expect(error.code).toBe("TEST_ERROR");
        expect(error.statusCode).toBe(500);
        expect(error.isOperational).toBe(true);
        expect(error.name).toBe("AppError");
    });
    
    test("should create error with custom status code", () => {
        const error = new AppError("Custom error", "CUSTOM", 418);
        
        expect(error.statusCode).toBe(418);
    });
    
    test("should be instance of Error", () => {
        const error = new AppError("Test", "TEST");
        
        expect(error instanceof Error).toBe(true);
        expect(error instanceof AppError).toBe(true);
    });
    
    test("should have stack trace", () => {
        const error = new AppError("Test", "TEST");
        
        expect(error.stack).toBeDefined();
        expect(error.stack).toContain("AppError");
    });
});

describe("NotFoundError", () => {
    test("should create with resource name only", () => {
        const error = new NotFoundError("User");
        
        expect(error.message).toBe("User not found");
        expect(error.code).toBe("NOT_FOUND");
        expect(error.statusCode).toBe(404);
    });
    
    test("should create with resource and identifier", () => {
        const error = new NotFoundError("User", "123");
        
        expect(error.message).toBe("User with id '123' not found");
    });
    
    test("should be instance of AppError", () => {
        const error = new NotFoundError("Test");
        
        expect(error instanceof AppError).toBe(true);
    });
});

describe("ValidationError", () => {
    test("should create with message", () => {
        const error = new ValidationError("Invalid email format");
        
        expect(error.message).toBe("Invalid email format");
        expect(error.code).toBe("VALIDATION_ERROR");
        expect(error.statusCode).toBe(400);
    });
    
    test("should be instance of AppError", () => {
        const error = new ValidationError("Test");
        
        expect(error instanceof AppError).toBe(true);
    });
});

describe("ConflictError", () => {
    test("should create with message", () => {
        const error = new ConflictError("Email already exists");
        
        expect(error.message).toBe("Email already exists");
        expect(error.code).toBe("CONFLICT");
        expect(error.statusCode).toBe(409);
    });
    
    test("should be instance of AppError", () => {
        const error = new ConflictError("Test");
        
        expect(error instanceof AppError).toBe(true);
    });
});

describe("DomainError", () => {
    test("should create with message", () => {
        const error = new DomainError("Insufficient balance");
        
        expect(error.message).toBe("Insufficient balance");
        expect(error.code).toBe("DOMAIN_ERROR");
        expect(error.statusCode).toBe(422);
    });
    
    test("should be instance of AppError", () => {
        const error = new DomainError("Test");
        
        expect(error instanceof AppError).toBe(true);
    });
});

describe("Error hierarchy", () => {
    test("all error types should be catchable as AppError", () => {
        const errors: AppError[] = [
            new NotFoundError("Resource"),
            new ValidationError("Invalid"),
            new ConflictError("Conflict"),
            new DomainError("Domain")
        ];
        
        for (const error of errors) {
            expect(error instanceof AppError).toBe(true);
        }
    });
    
    test("errors should have correct status codes", () => {
        const errorStatusCodes: [AppError, number][] = [
            [new NotFoundError("R"), 404],
            [new ValidationError("V"), 400],
            [new ConflictError("C"), 409],
            [new DomainError("D"), 422],
            [new AppError("E", "E", 500), 500]
        ];
        
        for (const [error, expected] of errorStatusCodes) {
            expect(error.statusCode).toBe(expected);
        }
    });
});
