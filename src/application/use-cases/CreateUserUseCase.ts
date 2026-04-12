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
import { ConflictError, ValidationError, DomainError } from "../../domain/errors/index.ts";
import { logger } from "../../shared/logger/index.ts";

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
    private readonly log = logger.child({ useCase: "CreateUserUseCase" });

    constructor(
        private readonly userRepository: IUserRepository,
        private readonly walletRepository: IWalletRepository,
        private readonly uuidGenerator: IUuidGenerator,
        private readonly emailValidator: IEmailValidator,
        private readonly passwordHash: IPasswordHash
    ) {}

    async execute(input: CreateUserInput): Promise<CreateUserOutput> {
        this.log.info("Creating user", { email: input.email });

        if (!input.email || !input.email.trim()) {
            throw new ValidationError("Email is required");
        }
        if (!input.password) {
            throw new ValidationError("Password is required");
        }
        if (!input.name || !input.name.trim()) {
            throw new ValidationError("Name is required");
        }

        try {
            const email = Email.create(input.email.trim(), this.emailValidator);
            const existingUser = await this.userRepository.findByEmail(email.value);
            
            if (existingUser) {
                this.log.warn("User already exists", { email: email.value });
                throw new ConflictError(`User with email '${email.value}' already exists`);
            }

            const password = await Password.create(input.password, this.passwordHash);
            const name = Name.create(input.name);
            const id = ID.create(this.uuidGenerator);

            const user = User.create(id, email, password, name);
            await this.userRepository.create(user);

            const wallet = Wallet.create(id, this.uuidGenerator);
            await this.walletRepository.create(wallet);

            this.log.info("User created successfully", { userId: user.id.value, email: email.value });

            return { user, wallet };
        } catch (error) {
            if (error instanceof ConflictError || error instanceof ValidationError || error instanceof DomainError) {
                throw error;
            }
            this.log.error("Failed to create user", error as Error, { email: input.email });
            throw error;
        }
    }
}
