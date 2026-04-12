import { Wallet } from "../entities/Wallet.ts";

export interface IWalletRepository {
    create(wallet: Wallet): Promise<void>;
    findByUserId(userId: string): Promise<Wallet | null>;
    findById(id: string): Promise<Wallet | null>;
    update(wallet: Wallet): Promise<void>;
    delete(userId: string): Promise<void>;
    deleteAll(): Promise<void>;
}
