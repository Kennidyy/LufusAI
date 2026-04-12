import { Wallet } from "../../domain/entities/Wallet.ts";
import { Points } from "../../domain/value-objects/Points.ts";
import { ID } from "../../domain/value-objects/ID.ts";
import type { IUuidGenerator } from "../../domain/value-objects/IUuidGenerator.ts";
import type { IWalletRepository } from "../../domain/repositories/IWalletRepository.ts";
import { NotFoundError, ValidationError, DomainError } from "../../domain/errors/index.ts";
import { logger } from "../../shared/logger/index.ts";

export interface AddPointsInput {
    userId: string;
    amount: number;
}

export interface AddPointsOutput {
    wallet: Wallet;
}

export class AddPointsUseCase {
    private readonly log = logger.child({ useCase: "AddPointsUseCase" });

    constructor(
        private readonly walletRepository: IWalletRepository,
        private readonly uuidGenerator: IUuidGenerator
    ) {}

    async execute(input: AddPointsInput): Promise<AddPointsOutput> {
        this.log.info("Adding points", { userId: input.userId, amount: input.amount });

        if (!input.userId || !input.userId.trim()) {
            throw new ValidationError("User ID is required");
        }
        if (typeof input.amount !== "number" || input.amount <= 0) {
            throw new ValidationError("Amount must be a positive number");
        }

        try {
            let wallet = await this.walletRepository.findByUserId(input.userId);

            if (!wallet) {
                this.log.info("Creating wallet for user", { userId: input.userId });
                const userId = ID.restore(input.userId);
                wallet = Wallet.create(userId, this.uuidGenerator);
                await this.walletRepository.create(wallet);
            }

            const pointsToAdd = Points.create(input.amount);
            const updatedWallet = wallet.addPoints(pointsToAdd);
            await this.walletRepository.update(updatedWallet);

            this.log.info("Points added successfully", { 
                userId: input.userId, 
                amount: input.amount,
                newBalance: updatedWallet.points.value 
            });

            return { wallet: updatedWallet };
        } catch (error) {
            if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof DomainError) {
                throw error;
            }
            this.log.error("Failed to add points", error as Error, { userId: input.userId, amount: input.amount });
            throw error;
        }
    }
}
