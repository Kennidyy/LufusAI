import type {IUuidGenerator} from "./Infrastructure/Uuid/IUuidGenerator.ts";

export class ID {
    readonly #value!: string;

    private constructor(id: string) {
        this.#value = id;
    }

    static create(generator: IUuidGenerator): ID {
        return new ID(generator.generate());
    }

    get value(): string {
        return this.#value;
    }

    equals(other: ID): boolean {
        return this.#value === other.value;
    }
}