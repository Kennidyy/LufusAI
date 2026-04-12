import type { IUserRepository } from "../../domain/repositories/IUserRepository.ts";
import type { IWalletRepository } from "../../domain/repositories/IWalletRepository.ts";
import { logger } from "../../shared/logger/index.ts";

export interface DeleteAllUsersOutput {
    deletedCount: number;
}

export class DeleteAllUsersUseCase {
    private readonly log = logger.child({ useCase: "DeleteAllUsersUseCase" });

    constructor(
        private readonly userRepository: IUserRepository,
        private readonly walletRepository: IWalletRepository
    ) {}

    async execute(): Promise<DeleteAllUsersOutput> {
        this.log.warn("Deleting all users");

        try {
            const users = await this.userRepository.findAll();
            const count = users.length;

            if (count === 0) {
                this.log.info("No users to delete");
                return { deletedCount: 0 };
            }

            this.log.info("Found users to delete", { count });

            await this.walletRepository.deleteAll();
            await this.userRepository.deleteAll();

            this.log.info("All users deleted successfully", { deletedCount: count });

            return { deletedCount: count };
        } catch (error) {
            this.log.error("Failed to delete all users", error as Error);
            throw error;
        }
    }
}
