import type { IEmailValidator } from "./IEmailValidator.ts";
import { ValidationError } from "../errors/index.ts";

export class Email {
    readonly #value: string;

    private constructor(value: string) {
        this.#value = value;
    }

    static create(input: string, validator: IEmailValidator): Email {
        const trimmed = input.trim();
        
        if (!trimmed) {
            throw new ValidationError("Email is required");
        }
        
        if (trimmed.length > 254) {
            throw new ValidationError("Email exceeds maximum length of 254 characters");
        }
        
        const normalized = trimmed.toLowerCase();
        
        if (!validator.isValid(normalized)) {
            throw new ValidationError("Invalid email format");
        }

        return new Email(normalized);
    }

    static restore(value: string): Email {
        if (!value || !value.trim()) {
            throw new ValidationError("Email is required");
        }
        
        const trimmed = value.trim().toLowerCase();
        
        if (trimmed.length > 254) {
            throw new ValidationError("Email exceeds maximum length of 254 characters");
        }
        
        const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
        if (!emailRegex.test(trimmed)) {
            throw new ValidationError("Invalid email format");
        }
        
        return new Email(trimmed);
    }

    get value(): string {
        return this.#value;
    }

    equals(other: Email): boolean {
        return this.#value === other.#value;
    }

    change(newValue: string, validator: IEmailValidator): Email {
        return Email.create(newValue, validator);
    }
}
