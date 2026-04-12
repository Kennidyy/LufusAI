import type { IUuidGenerator } from "./IUuidGenerator.ts";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ID {
    readonly #value: string;

    private constructor(id: string) {
        this.#value = id;
    }

    static create(generator: IUuidGenerator): ID {
        const generatedId = generator.generate();
        
        if (!generatedId || !UUID_REGEX.test(generatedId)) {
            throw new Error("UUID generator returned invalid value");
        }
        
        return new ID(generatedId);
    }

    static restore(value: string): ID {
        if (!value || !value.trim()) {
            throw new Error("ID is required");
        }
        
        if (!UUID_REGEX.test(value)) {
            throw new Error("Invalid UUID format");
        }
        
        return new ID(value.trim().toLowerCase());
    }

    get value(): string {
        return this.#value;
    }

    equals(other: ID): boolean {
        return this.#value === other.#value;
    }
}
