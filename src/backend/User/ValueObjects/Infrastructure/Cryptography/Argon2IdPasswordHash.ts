import type {IPasswordHash} from "./IPasswordHash.ts";

export class Argon2IdPasswordHash implements IPasswordHash {
    async hashPassword(input: string): Promise<string> {

        const pepper: string | undefined = process.env.PASSWORD_PEPPER

        if(!pepper) {throw new Error(".env PASSWORD_PEPPER is undefined")}
        const password: string = input + pepper

        return await Bun.password.hash(password, {
            algorithm: "argon2id",
            memoryCost: 65536,
            timeCost: 3,
        });
    }

}