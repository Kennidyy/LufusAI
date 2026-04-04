import type {IPasswordHash} from "./Infrastructure/Cryptography/IPasswordHash.ts";

export class Password {
    #value: string;

    private constructor(newValue: string) {
        this.#value = newValue;
    }

    static async create(input: string, hash: IPasswordHash): Promise<Password> {
        this.validate(input);
        const password: string = await hash.hashPassword(input)

        return new Password(password);
    }

    get value(): string {
        return this.#value;
    }

    equals(other: Password): boolean {
        return this.#value === other.value;
    }

    private static validate(input: string): void {
        if (!input) {throw new Error("Password cannot be empty");}
        if (input.length < 8) {throw new Error("Password should be at least 8 characters long");}
        if (!/[a-z]/.test(input)) {throw new Error("Password should contain at least one lowercase character");}
        if (!/[A-Z]/.test(input)) {throw new Error("Password should contain at least one uppercase character");}
        if (!/[0-9]/.test(input)) {throw new Error("Password should contain at least one number character");}
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(input)) {throw new Error("Password should contain at least one symbol character");}
    }
}