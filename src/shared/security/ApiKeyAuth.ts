import { createHash, randomBytes } from "crypto";

export interface ApiKeyConfig {
    keyId: string;
    keyHash: string;
    permissions: ApiKeyPermission[];
    createdAt: Date;
    expiresAt?: Date;
}

export type ApiKeyPermission = 
    | "read:users"
    | "write:users"
    | "delete:users"
    | "delete:all"
    | "manage:points"
    | "admin";

export class ApiKeyManager {
    private keys: Map<string, ApiKeyConfig> = new Map();

    generateKey(permissions: ApiKeyPermission[]): { id: string; key: string } {
        const id = `key_${randomBytes(8).toString("hex")}`;
        const key = `lfk_${randomBytes(32).toString("hex")}`;
        const keyHash = this.hashKey(key);

        this.keys.set(id, {
            keyId: id,
            keyHash,
            permissions,
            createdAt: new Date()
        });

        return { id, key };
    }

    validateKey(key: string): ApiKeyConfig | null {
        if (!key || !key.startsWith("lfk_")) {
            return null;
        }

        const keyHash = this.hashKey(key);

        for (const config of this.keys.values()) {
            if (config.keyHash === keyHash) {
                if (config.expiresAt && config.expiresAt < new Date()) {
                    return null;
                }
                return config;
            }
        }

        return null;
    }

    hasPermission(key: string, permission: ApiKeyPermission): boolean {
        const config = this.validateKey(key);
        if (!config) return false;
        
        return config.permissions.includes(permission) || config.permissions.includes("admin");
    }

    revokeKey(keyId: string): boolean {
        return this.keys.delete(keyId);
    }

    private hashKey(key: string): string {
        return createHash("sha256").update(key).digest("hex");
    }

    listKeys(): { id: string; permissions: ApiKeyPermission[]; createdAt: Date }[] {
        return Array.from(this.keys.values()).map(k => ({
            id: k.keyId,
            permissions: k.permissions,
            createdAt: k.createdAt
        }));
    }

    saveToEnv(): { id: string; key: string } {
        const { id, key } = this.generateKey(["admin"]);
        console.log(`\n🔐 Nova API Key gerada:`);
        console.log(`   ID: ${id}`);
        console.log(`   Key: ${key}`);
        console.log(`\n⚠️  GUARDE ESTA KEY EM LOCAL SEGURO!`);
        console.log(`   Adicione ao .env: LUFUS_API_KEY=${key}`);
        return { id, key };
    }
}

export const apiKeyManager = new ApiKeyManager();
