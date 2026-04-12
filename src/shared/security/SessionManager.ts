import { createHash, randomBytes } from "crypto";

export interface Session {
    token: string;
    userId: string;
    email: string;
    name: string;
    expiresAt: number;
    createdAt: number;
}

export interface SessionStore {
    save(session: Session): void;
    findByToken(token: string): Session | null;
    delete(token: string): void;
    deleteByUserId(userId: string): void;
    deleteExpired(): void;
}

export class InMemorySessionStore implements SessionStore {
    private sessions: Map<string, Session> = new Map();
    private readonly SESSION_DURATION = 24 * 60 * 60 * 1000;

    save(session: Session): void {
        const expiresAt = Date.now() + this.SESSION_DURATION;
        session.expiresAt = expiresAt;
        session.createdAt = Date.now();
        this.sessions.set(session.token, session);
    }

    findByToken(token: string): Session | null {
        const session = this.sessions.get(token);
        if (!session) return null;
        if (Date.now() > session.expiresAt) {
            this.sessions.delete(token);
            return null;
        }
        return session;
    }

    delete(token: string): void {
        this.sessions.delete(token);
    }

    deleteByUserId(userId: string): void {
        for (const [token, session] of this.sessions.entries()) {
            if (session.userId === userId) {
                this.sessions.delete(token);
            }
        }
    }

    deleteExpired(): void {
        const now = Date.now();
        for (const [token, session] of this.sessions.entries()) {
            if (now > session.expiresAt) {
                this.sessions.delete(token);
            }
        }
    }
}

export class FileSessionStore implements SessionStore {
    private readonly filePath: string;
    private sessions: Map<string, Session> = new Map();
    private readonly SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

    constructor(filePath: string = "./.lufus-session") {
        this.filePath = filePath;
        this.load();
    }

    private load(): void {
        try {
            const { readFileSync, existsSync } = require("fs");
            if (existsSync(this.filePath)) {
                const data = readFileSync(this.filePath, "utf-8");
                const parsed = JSON.parse(data);
                for (const [token, session] of Object.entries(parsed)) {
                    this.sessions.set(token, session as Session);
                }
                this.deleteExpired();
            }
        } catch {
            this.sessions = new Map();
        }
    }

    private persist(): void {
        const { writeFileSync, mkdirSync, existsSync } = require("fs");
        const dir = require("path").dirname(this.filePath);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        const obj = Object.fromEntries(this.sessions);
        writeFileSync(this.filePath, JSON.stringify(obj, null, 2));
    }

    save(session: Session): void {
        const expiresAt = Date.now() + this.SESSION_DURATION;
        session.expiresAt = expiresAt;
        session.createdAt = Date.now();
        this.sessions.set(session.token, session);
        this.persist();
    }

    findByToken(token: string): Session | null {
        const session = this.sessions.get(token);
        if (!session) return null;
        if (Date.now() > session.expiresAt) {
            this.sessions.delete(token);
            this.persist();
            return null;
        }
        return session;
    }

    delete(token: string): void {
        this.sessions.delete(token);
        this.persist();
    }

    deleteByUserId(userId: string): void {
        for (const [token, session] of this.sessions.entries()) {
            if (session.userId === userId) {
                this.sessions.delete(token);
            }
        }
        this.persist();
    }

    deleteExpired(): void {
        const now = Date.now();
        for (const [token, session] of this.sessions.entries()) {
            if (now > session.expiresAt) {
                this.sessions.delete(token);
            }
        }
        this.persist();
    }
}

export function generateToken(): string {
    return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

export function createSession(userId: string, email: string, name: string): Session {
    return {
        token: generateToken(),
        userId,
        email,
        name,
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
        createdAt: Date.now()
    };
}
