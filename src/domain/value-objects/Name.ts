export class Name {
    readonly #value: string;

    private constructor(value: string) {
        this.#value = value;
    }

    static create(raw: string): Name {
        const trimmed = raw.trim();
        
        if (!trimmed) {
            throw new Error("Name is required");
        }
        
        if (trimmed.length > 50) {
            throw new Error("Name cannot exceed 50 characters");
        }
        
        if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(trimmed)) {
            throw new Error("Name can only contain letters, spaces, hyphens, and apostrophes");
        }
        
        if (/[-']{2,}/.test(trimmed)) {
            throw new Error("Name cannot contain consecutive hyphens or apostrophes");
        }
        
        if (/^[ '-]|[ '-]$/.test(trimmed)) {
            throw new Error("Name cannot start or end with a space, hyphen, or apostrophe");
        }

        return new Name(trimmed);
    }

    get value(): string {
        return this.#value;
    }

    equals(other: Name): boolean {
        return this.#value === other.#value;
    }

    change(newValue: string): Name {
        return Name.create(newValue);
    }
}
