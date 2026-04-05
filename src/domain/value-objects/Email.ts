import type { IEmailValidator } from "./IEmailValidator.ts";

export class Email {
    readonly #value: string;

    private constructor(value: string) {
        this.#value = value;
    }

    static create(input: string, validator: IEmailValidator): Email {
        const trimmed = input.trim();
        
        if (!trimmed) {
            throw new Error("Email is required");
        }
        
        if (trimmed.length > 254) {
            throw new Error("Email exceeds maximum length of 254 characters");
        }
        
        const normalized = trimmed.toLowerCase();
        
        if (!validator.isValid(normalized)) {
            throw new Error("Invalid email format");
        }

        return new Email(normalized);
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
