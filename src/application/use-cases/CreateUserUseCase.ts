import { User } from "../../domain/entities/User.ts";
import { Wallet } from "../../domain/entities/Wallet.ts";
import { ID } from "../../domain/value-objects/ID.ts";
import { Email } from "../../domain/value-objects/Email.ts";
import { Password } from "../../domain/value-objects/Password.ts";
import { Name } from "../../domain/value-objects/Name.ts";
import type { IUuidGenerator } from "../../domain/value-objects/IUuidGenerator.ts";
import type { IEmailValidator } from "../../domain/value-objects/IEmailValidator.ts";
import type { IPasswordHash } from "../../domain/value-objects/IPasswordHash.ts";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.ts";
import type { IWalletRepository } from "../../domain/repositories/IWalletRepository.ts";

export interface CreateUserInput {
    email: string;
    password: string;
    name: string;
}

export interface CreateUserOutput {
    user: User;
    wallet: Wallet;
}

export class CreateUserUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly walletRepository: IWalletRepository,
        private readonly uuidGenerator: IUuidGenerator,
        private readonly emailValidator: IEmailValidator,
        private readonly passwordHash: IPasswordHash
    ) {}

    async execute(input: CreateUserInput): Promise<CreateUserOutput> {
        const existingUser = await this.userRepository.findByEmail(input.email);
        
        if (existingUser) {
            throw new Error("User already exists");
        }

        const email = Email.create(input.email, this.emailValidator);
        const password = await Password.create(input.password, this.passwordHash);
        const name = Name.create(input.name);
        const id = ID.create(this.uuidGenerator);

        const user = User.create(id, email, password, name);
        await this.userRepository.create(user);

        const wallet = Wallet.create(id, this.uuidGenerator);
        await this.walletRepository.create(wallet);

        return { user, wallet };
    }
}
