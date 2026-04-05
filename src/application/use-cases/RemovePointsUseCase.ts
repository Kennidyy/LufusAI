import { Wallet } from "../../domain/entities/Wallet.ts";
import { Points } from "../../domain/value-objects/Points.ts";
import type { IUuidGenerator } from "../../domain/value-objects/IUuidGenerator.ts";
import type { IWalletRepository } from "../../domain/repositories/IWalletRepository.ts";

export interface RemovePointsInput {
    userId: string;
    amount: number;
}

export interface RemovePointsOutput {
    wallet: Wallet;
}

export class RemovePointsUseCase {
    constructor(
        private readonly walletRepository: IWalletRepository,
        private readonly uuidGenerator: IUuidGenerator
    ) {}

    async execute(input: RemovePointsInput): Promise<RemovePointsOutput> {
        const wallet = await this.walletRepository.findByUserId(input.userId);

        if (!wallet) {
            throw new Error("Wallet not found");
        }

        const pointsToRemove = Points.create(input.amount);
        const updatedWallet = wallet.subtractPoints(pointsToRemove);
        await this.walletRepository.update(updatedWallet);

        return { wallet: updatedWallet };
    }
}
