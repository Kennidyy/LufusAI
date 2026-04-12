import { logger } from "../logger/index.ts";

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

export class RateLimiter {
    private store = new Map<string, RateLimitEntry>();
    private readonly windowMs: number;
    private readonly maxRequests: number;

    constructor(windowMs: number = 60000, maxRequests: number = 100) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
        
        setInterval(() => this.cleanup(), this.windowMs);
    }

    check(identifier: string): { allowed: boolean; remaining: number; resetAt: number } {
        const now = Date.now();
        let entry = this.store.get(identifier);

        if (!entry || now > entry.resetAt) {
            entry = { count: 0, resetAt: now + this.windowMs };
            this.store.set(identifier, entry);
        }

        entry.count++;
        const remaining = Math.max(0, this.maxRequests - entry.count);

        if (entry.count > this.maxRequests) {
            logger.warn("Rate limit exceeded", { identifier, count: entry.count });
            return { allowed: false, remaining: 0, resetAt: entry.resetAt };
        }

        return { allowed: true, remaining, resetAt: entry.resetAt };
    }

    private cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.resetAt) {
                this.store.delete(key);
            }
        }
    }
}

export const rateLimiter = new RateLimiter();
