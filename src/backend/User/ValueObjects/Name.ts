export class Name {
    #value: string;

    private constructor(value: string) {
        this.#value = value;
    }

    static create(raw: string): Name {
        const input: string = raw.trim();
        if (!input) {
            throw new Error("Name cannot be empty");
        }
        if (input.length > 50) {
            throw new Error("Name length cannot be over 50 characters");
        }

        return new Name(input);
    }

    get value(): string {
        return this.#value;
    }

    equals(other: Name): boolean {
        return this.#value === other.value;
    }

}