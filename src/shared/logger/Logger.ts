export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    context?: Record<string, unknown>;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
}

export class Logger {
    private level: LogLevel;
    private context: Record<string, unknown>;

    constructor(level: LogLevel = LogLevel.INFO, context: Record<string, unknown> = {}) {
        this.level = level;
        this.context = context;
    }

    private formatEntry(entry: LogEntry): string {
        const base = {
            timestamp: entry.timestamp,
            level: entry.level,
            message: entry.message,
            ...this.context,
            ...entry.context
        };

        if (entry.error) {
            return JSON.stringify({ ...base, error: entry.error });
        }

        return JSON.stringify(base);
    }

    debug(message: string, context?: Record<string, unknown>): void {
        if (this.level <= LogLevel.DEBUG) {
            console.log(this.formatEntry({
                timestamp: new Date().toISOString(),
                level: "DEBUG",
                message,
                context
            }));
        }
    }

    info(message: string, context?: Record<string, unknown>): void {
        if (this.level <= LogLevel.INFO) {
            console.log(this.formatEntry({
                timestamp: new Date().toISOString(),
                level: "INFO",
                message,
                context
            }));
        }
    }

    warn(message: string, context?: Record<string, unknown>): void {
        if (this.level <= LogLevel.WARN) {
            console.warn(this.formatEntry({
                timestamp: new Date().toISOString(),
                level: "WARN",
                message,
                context
            }));
        }
    }

    error(message: string, error?: Error, context?: Record<string, unknown>): void {
        if (this.level <= LogLevel.ERROR) {
            console.error(this.formatEntry({
                timestamp: new Date().toISOString(),
                level: "ERROR",
                message,
                context,
                error: error ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                } : undefined
            }));
        }
    }

    child(additionalContext: Record<string, unknown>): Logger {
        return new Logger(this.level, { ...this.context, ...additionalContext });
    }
}

export const logger = new Logger(
    process.env.LOG_LEVEL === "DEBUG" ? LogLevel.DEBUG :
    process.env.LOG_LEVEL === "WARN" ? LogLevel.WARN :
    process.env.LOG_LEVEL === "ERROR" ? LogLevel.ERROR :
    LogLevel.INFO,
    { service: "lufus-cli" }
);
