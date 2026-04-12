import type { IUserRepository } from "../../domain/repositories/IUserRepository.ts";
import type { IWalletRepository } from "../../domain/repositories/IWalletRepository.ts";
import { ValidationError, NotFoundError } from "../../domain/errors/index.ts";
import { logger } from "../../shared/logger/index.ts";

export interface DeleteUserInput {
    userId: string;
}

export interface DeleteUserOutput {
    deleted: boolean;
}

export class DeleteUserUseCase {
    private readonly log = logger.child({ useCase: "DeleteUserUseCase" });

    constructor(
        private readonly userRepository: IUserRepository,
        private readonly walletRepository: IWalletRepository
    ) {}

    async execute(input: DeleteUserInput): Promise<DeleteUserOutput> {
        this.log.info("Deleting user", { userId: input.userId });

        if (!input.userId || !input.userId.trim()) {
            throw new ValidationError("User ID is required");
        }

        try {
            const user = await this.userRepository.findById(input.userId);
            
            if (!user) {
                this.log.warn("User not found", { userId: input.userId });
                throw new NotFoundError("User", input.userId);
            }

            await this.walletRepository.delete(input.userId);
            await this.userRepository.delete(input.userId);

            this.log.info("User deleted successfully", { userId: input.userId, email: user.email.value });

            return { deleted: true };
        } catch (error) {
            if (error instanceof ValidationError || error instanceof NotFoundError) {
                throw error;
            }
            this.log.error("Failed to delete user", error as Error, { userId: input.userId });
            throw error;
        }
    }
}
