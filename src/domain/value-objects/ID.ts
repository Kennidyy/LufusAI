import type { IUuidGenerator } from "./IUuidGenerator.ts";

export class ID {
    readonly #value: string;

    private constructor(id: string) {
        if (!id || id.length === 0) {
            throw new Error("ID cannot be empty");
        }
        this.#value = id;
    }

    static create(generator: IUuidGenerator): ID {
        const generatedId = generator.generate();
        
        if (!generatedId) {
            throw new Error("UUID generator returned invalid value");
        }
        
        return new ID(generatedId);
    }

    get value(): string {
        return this.#value;
    }

    equals(other: ID): boolean {
        return this.#value === other.#value;
    }
}
