import { createHash, randomBytes, timingSafeEqual } from "crypto";

export class InputSanitizer {
    private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    private static readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    static sanitizeString(input: string, maxLength: number = 255): string {
        if (!input || typeof input !== "string") {
            return "";
        }
        return input.trim().slice(0, maxLength).replace(/[\x00-\x1F\x7F]/g, "");
    }

    static sanitizeEmail(input: string): string {
        const sanitized = this.sanitizeString(input, 254);
        return sanitized.toLowerCase();
    }

    static sanitizeName(input: string): string {
        return this.sanitizeString(input, 50);
    }

    static sanitizeUUID(input: string): string {
        const sanitized = this.sanitizeString(input, 36);
        if (!this.UUID_REGEX.test(sanitized)) {
            throw new Error("Invalid UUID format");
        }
        return sanitized;
    }

    static isValidEmail(input: string): boolean {
        return this.EMAIL_REGEX.test(input);
    }

    static escapeSQL(input: string): string {
        return input.replace(/'/g, "''").replace(/\\/g, "\\\\");
    }
}

export function generateCSRFToken(): string {
    return randomBytes(32).toString("hex");
}

export function hashSensitiveData(data: string): string {
    return createHash("sha256").update(data).digest("hex");
}
