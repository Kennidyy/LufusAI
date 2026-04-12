import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { Logger, LogLevel } from "../src/shared/logger/Logger.ts";

describe("Logger", () => {
    let logs: string[] = [];
    let originalConsoleLog: typeof console.log;
    let originalConsoleWarn: typeof console.warn;
    let originalConsoleError: typeof console.error;
    
    beforeEach(() => {
        logs = [];
        originalConsoleLog = console.log;
        originalConsoleWarn = console.warn;
        originalConsoleError = console.error;
        
        console.log = (...args: unknown[]) => logs.push(args.join(" "));
        console.warn = (...args: unknown[]) => logs.push(args.join(" "));
        console.error = (...args: unknown[]) => logs.push(args.join(" "));
    });
    
    afterEach(() => {
        console.log = originalConsoleLog;
        console.warn = originalConsoleWarn;
        console.error = originalConsoleError;
    });
    
    test("should log info messages", () => {
        const logger = new Logger(LogLevel.INFO);
        logger.info("Test message");
        
        expect(logs.length).toBe(1);
        expect(logs[0]).toContain("INFO");
        expect(logs[0]).toContain("Test message");
    });
    
    test("should log debug messages when level is DEBUG", () => {
        const logger = new Logger(LogLevel.DEBUG);
        logger.debug("Debug message");
        
        expect(logs.length).toBe(1);
        expect(logs[0]).toContain("DEBUG");
    });
    
    test("should not log debug messages when level is INFO", () => {
        const logger = new Logger(LogLevel.INFO);
        logger.debug("Debug message");
        
        expect(logs.length).toBe(0);
    });
    
    test("should log warning messages", () => {
        const logger = new Logger(LogLevel.WARN);
        logger.warn("Warning message");
        
        expect(logs.length).toBe(1);
        expect(logs[0]).toContain("WARN");
    });
    
    test("should log error messages", () => {
        const logger = new Logger(LogLevel.ERROR);
        logger.error("Error message");
        
        expect(logs.length).toBe(1);
        expect(logs[0]).toContain("ERROR");
    });
    
    test("should include context in log", () => {
        const logger = new Logger(LogLevel.INFO);
        logger.info("User action", { userId: "123", action: "login" });
        
        expect(logs[0]).toContain("userId");
        expect(logs[0]).toContain("123");
    });
    
    test("should include error details", () => {
        const logger = new Logger(LogLevel.ERROR);
        const error = new Error("Something went wrong");
        logger.error("Operation failed", error);
        
        expect(logs[0]).toContain("Something went wrong");
        expect(logs[0]).toContain("Error");
    });
    
    test("should create child logger with additional context", () => {
        const logger = new Logger(LogLevel.INFO, { service: "test" });
        const childLogger = logger.child({ operation: "create" });
        childLogger.info("Operation started");
        
        expect(logs[0]).toContain("service");
        expect(logs[0]).toContain("test");
        expect(logs[0]).toContain("operation");
        expect(logs[0]).toContain("create");
    });
    
    test("should output JSON format", () => {
        const logger = new Logger(LogLevel.INFO);
        logger.info("JSON test");
        
        expect(logs[0]).toContain('"timestamp"');
        expect(logs[0]).toContain('"level"');
        expect(logs[0]).toContain('"message"');
    });
    
    test("should not log when level is ERROR and message is INFO", () => {
        const logger = new Logger(LogLevel.ERROR);
        logger.info("Should not log");
        
        expect(logs.length).toBe(0);
    });
});
