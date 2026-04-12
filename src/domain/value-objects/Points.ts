import { ValidationError } from "../errors/index.ts";

export class Points {
    readonly #value: number;

    private constructor(value: number) {
        this.#value = value;
    }

    static create(amount: number): Points {
        if (!Number.isInteger(amount)) {
            throw new ValidationError("Points must be an integer");
        }
        if (amount < 0) {
            throw new ValidationError("Points cannot be negative");
        }
        return new Points(amount);
    }

    static zero(): Points {
        return new Points(0);
    }

    static restore(value: number): Points {
        return new Points(value);
    }

    get value(): number {
        return this.#value;
    }

    equals(other: Points): boolean {
        return this.#value === other.#value;
    }

    add(other: Points): Points {
        return new Points(this.#value + other.#value);
    }

    subtract(other: Points): Points {
        const result = this.#value - other.#value;
        if (result < 0) {
            throw new ValidationError("Insufficient points");
        }
        return new Points(result);
    }

    isZero(): boolean {
        return this.#value === 0;
    }
}
