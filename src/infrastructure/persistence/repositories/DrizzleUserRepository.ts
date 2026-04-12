import { eq } from "drizzle-orm";
import { db } from "../../../../database/connection.ts";
import { users } from "../../../../database/schema.ts";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository.ts";
import { User } from "../../../domain/entities/User.ts";
import { UserMapper } from "../mappers/UserMapper.ts";
import type { IUuidGenerator } from "../../../domain/value-objects/IUuidGenerator.ts";
import { ConflictError } from "../../../domain/errors/index.ts";
import { logger } from "../../../shared/logger/index.ts";

export class DrizzleUserRepository implements IUserRepository {
    private readonly log = logger.child({ repository: "DrizzleUserRepository" });

    constructor(private readonly uuidGenerator: IUuidGenerator) {}

    async create(user: User): Promise<void> {
        try {
            this.log.debug("Creating user", { email: user.email.value });
            const tableData = UserMapper.toTable(user);
            await db.insert(users).values(tableData);
            this.log.info("User created", { userId: user.id.value });
        } catch (error: unknown) {
            if (error instanceof Error && error.message.includes("users_email_unique")) {
                this.log.warn("Duplicate email attempted", { email: user.email.value });
                throw new ConflictError(`User with email '${user.email.value}' already exists`);
            }
            this.log.error("Failed to create user", error as Error);
            throw error;
        }
    }

    async findByEmail(email: string): Promise<User | null> {
        this.log.debug("Finding user by email", { email });
        const result = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
        
        if (result.length === 0) {
            return null;
        }

        return UserMapper.toDomain(result[0]!);
    }

    async findById(id: string): Promise<User | null> {
        this.log.debug("Finding user by id", { userId: id });
        const result = await db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);
        
        if (result.length === 0) {
            return null;
        }

        return UserMapper.toDomain(result[0]!);
    }

    async findAll(): Promise<User[]> {
        this.log.debug("Finding all users");
        const results = await db.select().from(users);
        this.log.info("Found users", { count: results.length });
        return results.map(user => UserMapper.toDomain(user));
    }

    async delete(id: string): Promise<void> {
        this.log.debug("Deleting user", { userId: id });
        await db.delete(users).where(eq(users.id, id));
        this.log.info("User deleted", { userId: id });
    }

    async deleteAll(): Promise<void> {
        this.log.warn("Deleting all users");
        await db.delete(users);
        this.log.info("All users deleted");
    }
}
