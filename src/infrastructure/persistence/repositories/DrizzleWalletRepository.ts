import { eq } from "drizzle-orm";
import { db } from "../../../../database/connection.ts";
import { wallets } from "../../../../database/schema.ts";
import type { IWalletRepository } from "../../../domain/repositories/IWalletRepository.ts";
import { Wallet } from "../../../domain/entities/Wallet.ts";
import { WalletMapper } from "../mappers/WalletMapper.ts";
import { logger } from "../../../shared/logger/index.ts";

export class DrizzleWalletRepository implements IWalletRepository {
    private readonly log = logger.child({ repository: "DrizzleWalletRepository" });

    async create(wallet: Wallet): Promise<void> {
        try {
            this.log.debug("Creating wallet", { userId: wallet.userId.value });
            const tableData = WalletMapper.toTable(wallet);
            await db.insert(wallets).values(tableData);
            this.log.info("Wallet created", { walletId: wallet.id.value });
        } catch (error) {
            this.log.error("Failed to create wallet", error as Error);
            throw error;
        }
    }

    async findByUserId(userId: string): Promise<Wallet | null> {
        this.log.debug("Finding wallet by userId", { userId });
        const result = await db
            .select()
            .from(wallets)
            .where(eq(wallets.userId, userId))
            .limit(1);
        
        if (result.length === 0) {
            return null;
        }

        return WalletMapper.toDomain(result[0]!);
    }

    async findById(id: string): Promise<Wallet | null> {
        this.log.debug("Finding wallet by id", { walletId: id });
        const result = await db
            .select()
            .from(wallets)
            .where(eq(wallets.id, id))
            .limit(1);
        
        if (result.length === 0) {
            return null;
        }

        return WalletMapper.toDomain(result[0]!);
    }

    async update(wallet: Wallet): Promise<void> {
        this.log.debug("Updating wallet", { walletId: wallet.id.value, points: wallet.points.value });
        await db
            .update(wallets)
            .set({
                points: wallet.points.value,
                updatedAt: new Date()
            })
            .where(eq(wallets.id, wallet.id.value));
        this.log.info("Wallet updated", { walletId: wallet.id.value });
    }

    async delete(userId: string): Promise<void> {
        this.log.debug("Deleting wallet by userId", { userId });
        await db.delete(wallets).where(eq(wallets.userId, userId));
        this.log.info("Wallet deleted", { userId });
    }

    async deleteAll(): Promise<void> {
        this.log.warn("Deleting all wallets");
        await db.delete(wallets);
        this.log.info("All wallets deleted");
    }
}
