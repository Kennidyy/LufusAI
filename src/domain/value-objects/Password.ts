import type { IPasswordHash } from "./IPasswordHash.ts";

export class Password {
    readonly #value: string;

    private constructor(hashedValue: string) {
        this.#value = hashedValue;
    }

    static async create(plainText: string, hash: IPasswordHash): Promise<Password> {
        const validation = Password.validate(plainText);
        if (!validation.isValid) {
            throw new Error(validation.error!);
        }
        
        const hashedPassword: string = await hash.hashPassword(plainText);

        return new Password(hashedPassword);
    }

    get value(): string {
        return this.#value;
    }

    equals(other: Password): boolean {
        return this.#value === other.#value;
    }

    private static validate(input: string): { isValid: boolean; error?: string } {
        if (!input) {
            return { isValid: false, error: "Password is required" };
        }
        
        if (input.length < 8) {
            return { isValid: false, error: "Password must be at least 8 characters" };
        }
        
        if (input.length > 128) {
            return { isValid: false, error: "Password exceeds maximum length of 128 characters" };
        }
        
        if (!/[a-z]/.test(input)) {
            return { isValid: false, error: "Password must contain at least one lowercase letter" };
        }
        
        if (!/[A-Z]/.test(input)) {
            return { isValid: false, error: "Password must contain at least one uppercase letter" };
        }
        
        if (!/[0-9]/.test(input)) {
            return { isValid: false, error: "Password must contain at least one number" };
        }
        
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(input)) {
            return { isValid: false, error: "Password must contain at least one special character" };
        }
        
        const uniqueChars = new Set(input).size;
        if (uniqueChars < input.length * 0.5) {
            return { isValid: false, error: "Password contains too many repeated characters" };
        }

        return { isValid: true };
    }
}
