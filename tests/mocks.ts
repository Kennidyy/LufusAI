import type { IUserRepository } from "../src/domain/repositories/IUserRepository.ts";
import type { IWalletRepository } from "../src/domain/repositories/IWalletRepository.ts";
import { User } from "../src/domain/entities/User.ts";
import { Wallet } from "../src/domain/entities/Wallet.ts";
import type { IUuidGenerator } from "../src/domain/value-objects/IUuidGenerator.ts";
import type { IEmailValidator } from "../src/domain/value-objects/IEmailValidator.ts";
import type { IPasswordHash } from "../src/domain/value-objects/IPasswordHash.ts";

export class MockUuidGenerator implements IUuidGenerator {
    private ids: string[] = [];
    private counter = 0;
    
    generate(): string {
        const id = crypto.randomUUID();
        this.ids.push(id);
        return id;
    }
    
    setNextId(id: string): void {
        this.ids.push(id);
    }
    
    getNextSequential(): string {
        const id = `00000000-0000-4000-8000-${String(this.counter++).padStart(12, "0")}`;
        this.ids.push(id);
        return id;
    }
}

export class MockEmailValidator implements IEmailValidator {
    isValid(email: string): boolean {
        return email.includes("@") && email.includes(".");
    }
}

export class MockPasswordHash implements IPasswordHash {
    async hashPassword(plainText: string): Promise<string> {
        return `hashed_${plainText}`;
    }
    
    async verify(plainText: string, hashed: string): Promise<boolean> {
        return hashed === `hashed_${plainText}`;
    }
}

export class MockUserRepository implements IUserRepository {
    private users: Map<string, User> = new Map();
    private usersByEmail: Map<string, User> = new Map();
    
    async create(user: User): Promise<void> {
        this.users.set(user.id.value, user);
        this.usersByEmail.set(user.email.value, user);
    }
    
    async findByEmail(email: string): Promise<User | null> {
        return this.usersByEmail.get(email) || null;
    }
    
    async findById(id: string): Promise<User | null> {
        return this.users.get(id) || null;
    }
    
    async findAll(): Promise<User[]> {
        return Array.from(this.users.values());
    }
    
    async delete(id: string): Promise<void> {
        const user = this.users.get(id);
        if (user) {
            this.users.delete(id);
            this.usersByEmail.delete(user.email.value);
        }
    }
    
    async deleteAll(): Promise<void> {
        this.users.clear();
        this.usersByEmail.clear();
    }
    
    getUsers(): User[] {
        return Array.from(this.users.values());
    }
}

export class MockWalletRepository implements IWalletRepository {
    private wallets: Map<string, Wallet> = new Map();
    
    async create(wallet: Wallet): Promise<void> {
        this.wallets.set(wallet.userId.value, wallet);
    }
    
    async findByUserId(userId: string): Promise<Wallet | null> {
        return this.wallets.get(userId) || null;
    }
    
    async findById(id: string): Promise<Wallet | null> {
        for (const wallet of this.wallets.values()) {
            if (wallet.id.value === id) return wallet;
        }
        return null;
    }
    
    async update(wallet: Wallet): Promise<void> {
        this.wallets.set(wallet.userId.value, wallet);
    }
    
    async delete(userId: string): Promise<void> {
        this.wallets.delete(userId);
    }
    
    async deleteAll(): Promise<void> {
        this.wallets.clear();
    }
    
    getWallets(): Wallet[] {
        return Array.from(this.wallets.values());
    }
}
