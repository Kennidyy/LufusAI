import { Wallet } from "../../domain/entities/Wallet.ts";
import { Points } from "../../domain/value-objects/Points.ts";
import type { IUuidGenerator } from "../../domain/value-objects/IUuidGenerator.ts";
import type { IWalletRepository } from "../../domain/repositories/IWalletRepository.ts";
import { NotFoundError, ValidationError, DomainError } from "../../domain/errors/index.ts";
import { logger } from "../../shared/logger/index.ts";

export interface RemovePointsInput {
    userId: string;
    amount: number;
}

export interface RemovePointsOutput {
    wallet: Wallet;
}

export class RemovePointsUseCase {
    private readonly log = logger.child({ useCase: "RemovePointsUseCase" });

    constructor(
        private readonly walletRepository: IWalletRepository,
        private readonly uuidGenerator: IUuidGenerator
    ) {}

    async execute(input: RemovePointsInput): Promise<RemovePointsOutput> {
        this.log.info("Removing points", { userId: input.userId, amount: input.amount });

        if (!input.userId || !input.userId.trim()) {
            throw new ValidationError("User ID is required");
        }
        if (typeof input.amount !== "number" || input.amount <= 0) {
            throw new ValidationError("Amount must be a positive number");
        }

        try {
            const wallet = await this.walletRepository.findByUserId(input.userId);

            if (!wallet) {
                this.log.warn("Wallet not found", { userId: input.userId });
                throw new NotFoundError("Wallet", input.userId);
            }

            const pointsToRemove = Points.create(input.amount);
            const updatedWallet = wallet.subtractPoints(pointsToRemove);
            await this.walletRepository.update(updatedWallet);

            this.log.info("Points removed successfully", { 
                userId: input.userId, 
                amount: input.amount,
                newBalance: updatedWallet.points.value 
            });

            return { wallet: updatedWallet };
        } catch (error) {
            if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof DomainError) {
                throw error;
            }
            this.log.error("Failed to remove points", error as Error, { userId: input.userId, amount: input.amount });
            throw error;
        }
    }
}
