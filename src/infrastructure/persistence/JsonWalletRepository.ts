import { Wallet } from "../../domain/entities/Wallet.ts";
import type { IWalletRepository } from "../../domain/repositories/IWalletRepository.ts";
import { ID } from "../../domain/value-objects/ID.ts";
import { Points } from "../../domain/value-objects/Points.ts";
import { readFileSync, writeFileSync, existsSync } from "fs";

const DB_PATH = "./data/wallets.json";

interface WalletData {
    id: string;
    userId: string;
    points: number;
    createdAt: string;
    updatedAt: string;
}

function loadWallets(): WalletData[] {
    if (!existsSync(DB_PATH)) {
        return [];
    }
    const data = readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
}

function saveWallets(wallets: WalletData[]): void {
    writeFileSync(DB_PATH, JSON.stringify(wallets, null, 2));
}

function toWalletData(wallet: Wallet): WalletData {
    return {
        id: wallet.id.value,
        userId: wallet.userId.value,
        points: wallet.points.value,
        createdAt: wallet.createdAt.toISOString(),
        updatedAt: wallet.updatedAt.toISOString(),
    };
}

function toWallet(data: WalletData): Wallet {
    const id = ID.restore(data.id);
    const userId = ID.restore(data.userId);
    const points = Points.restore(data.points);
    return Wallet.restore(id, userId, points, new Date(data.createdAt), new Date(data.updatedAt));
}

export class JsonWalletRepository implements IWalletRepository {
    async create(wallet: Wallet): Promise<void> {
        const wallets = loadWallets();
        wallets.push(toWalletData(wallet));
        saveWallets(wallets);
    }

    async findByUserId(userId: string): Promise<Wallet | null> {
        const wallets = loadWallets();
        const data = wallets.find(w => w.userId === userId);
        return data ? toWallet(data) : null;
    }

    async findById(id: string): Promise<Wallet | null> {
        const wallets = loadWallets();
        const data = wallets.find(w => w.id === id);
        return data ? toWallet(data) : null;
    }

    async update(wallet: Wallet): Promise<void> {
        const wallets = loadWallets();
        const index = wallets.findIndex(w => w.id === wallet.id.value);
        if (index >= 0) {
            wallets[index] = toWalletData(wallet);
        } else {
            wallets.push(toWalletData(wallet));
        }
        saveWallets(wallets);
    }
}
