import { logger } from "../logger/index.ts";
import { Redis } from "ioredis";

interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
  redisUrl?: string;
}

export class RateLimiter {
  private redis: Redis | null;
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly useRedis: boolean;
  private localStore = new Map<string, { count: number; resetAt: number }>();

  constructor(config: RateLimiterConfig = { windowMs: 60000, maxRequests: 100 }) {
    const {
      windowMs = 60000,
      maxRequests = 100,
      redisUrl
    } = config;

    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.useRedis = !!redisUrl;

    if (this.useRedis && redisUrl) {
      try {
        this.redis = new Redis(redisUrl);
        // Test connection
        this.redis.ping().catch((err: unknown) => {
          logger.warn("Redis connection failed, falling back to local rate limiting", { error: (err as Error).message });
          this.redis = null;
        });
      } catch (err) {
        logger.warn("Failed to initialize Redis, falling back to local rate limiting", { error: (err as Error).message });
        this.redis = null;
      }
    } else {
      this.redis = null;
    }

    // Cleanup local store periodically
    setInterval(() => this.cleanupLocal(), this.windowMs);
  }

  async check(identifier: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    if (this.useRedis && this.redis) {
      const redis = this.redis;
      return this.checkRedis(identifier, redis);
    }
    return this.checkLocal(identifier);
  }

  private async checkRedis(identifier: string, redis: Redis): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Date.now();
    const key = `rate_limit:${identifier}`;
    
    try {
      const luaScript = `
        local current = redis.call("GET", KEYS[1])
        if current == false then
          redis.call("SET", KEYS[1], 1)
          redis.call("PEXPIRE", KEYS[1], ARGV[1])
          return {1, ARGV[2], ARGV[1]}
        end
        if tonumber(current) >= tonumber(ARGV[2]) then
          return {0, 0, redis.call("PTTL", KEYS[1])}
        end
        local incremented = redis.call("INCR", KEYS[1])
        local ttl = redis.call("PTTL", KEYS[1])
        return {incremented, tonumber(ARGV[2]) - incremented, ttl}
      `;
      
      const result = await redis.eval(luaScript, 1, key, this.windowMs, this.maxRequests);
      const current = Number((result as unknown[])[0]);
      const remaining = Number((result as unknown[])[1]);
      const resetAt = now + Number((result as unknown[])[2]);
      
      return {
        allowed: current <= this.maxRequests,
        remaining: Math.max(0, remaining),
        resetAt: resetAt
      };
    } catch (err) {
      logger.warn("Redis rate limit check failed, falling back to local", { error: (err as Error).message });
      return this.checkLocal(identifier);
    }
  }

  private checkLocal(identifier: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    let entry = this.localStore.get(identifier);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + this.windowMs };
      this.localStore.set(identifier, entry);
    }

    entry.count++;
    const remaining = Math.max(0, this.maxRequests - entry.count);

    if (entry.count > this.maxRequests) {
      logger.warn("Rate limit exceeded", { identifier, count: entry.count });
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    return { allowed: true, remaining, resetAt: entry.resetAt };
  }

  private cleanupLocal() {
    const now = Date.now();
    for (const [key, entry] of this.localStore.entries()) {
      if (now > entry.resetAt) {
        this.localStore.delete(key);
      }
    }
  }
}

// Default rate limiter (can be overridden with Redis config in shared/config)
export const rateLimiter = new RateLimiter();