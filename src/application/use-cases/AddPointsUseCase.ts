import { Wallet } from "../../domain/entities/Wallet.ts";
import { Points } from "../../domain/value-objects/Points.ts";
import { ID } from "../../domain/value-objects/ID.ts";
import type { IUuidGenerator } from "../../domain/value-objects/IUuidGenerator.ts";
import type { IWalletRepository } from "../../domain/repositories/IWalletRepository.ts";

export interface AddPointsInput {
    userId: string;
    amount: number;
}

export interface AddPointsOutput {
    wallet: Wallet;
}

export class AddPointsUseCase {
    constructor(
        private readonly walletRepository: IWalletRepository,
        private readonly uuidGenerator: IUuidGenerator
    ) {}

    async execute(input: AddPointsInput): Promise<AddPointsOutput> {
        let wallet = await this.walletRepository.findByUserId(input.userId);

        if (!wallet) {
            const userId = ID.restore(input.userId);
            wallet = Wallet.create(userId, this.uuidGenerator);
            await this.walletRepository.create(wallet);
        }

        const pointsToAdd = Points.create(input.amount);
        const updatedWallet = wallet.addPoints(pointsToAdd);
        await this.walletRepository.update(updatedWallet);

        return { wallet: updatedWallet };
    }
}
