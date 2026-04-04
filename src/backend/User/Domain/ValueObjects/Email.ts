import type {IEmailValidator} from "./Infrastructure/Validator/IEmailValidator.ts";

export class Email {
    #value: string;

    private constructor(value: string) {
        this.#value = value;
    }

    static create(input: string, validator: IEmailValidator): Email {
        if(!input) { throw new Error("Email field can't be empty") }
        if (!validator.isValid(input)) {
            throw new Error("Email is not valid");
        }

        return new Email(input);
    }

    get value(): string {
        return this.#value;
    }

    equals(other: Email): boolean {
        return this.#value === other.value;
    }
}