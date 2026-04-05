import { User } from "../../domain/entities/User.ts";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.ts";
import { ID } from "../../domain/value-objects/ID.ts";
import { Email } from "../../domain/value-objects/Email.ts";
import { Password } from "../../domain/value-objects/Password.ts";
import { Name } from "../../domain/value-objects/Name.ts";
import { readFileSync, writeFileSync, existsSync } from "fs";

const DB_PATH = "./data/users.json";

interface UserData {
    id: string;
    email: string;
    password: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

function loadUsers(): UserData[] {
    if (!existsSync(DB_PATH)) {
        return [];
    }
    const data = readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
}

function saveUsers(users: UserData[]): void {
    writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}

function toUserData(user: User): UserData {
    return {
        id: user.id.value,
        email: user.email.value,
        password: user.password.value,
        name: user.name.value,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    };
}

function toUser(data: UserData): User {
    const id = ID.restore(data.id);
    const email = Email.create(data.email, { isValid: () => true });
    const password = Password.fromHashed(data.password);
    const name = Name.create(data.name);
    return User.restore(id, email, password, name, new Date(data.createdAt), new Date(data.updatedAt));
}

export class JsonUserRepository implements IUserRepository {
    async create(user: User): Promise<void> {
        const users = loadUsers();
        users.push(toUserData(user));
        saveUsers(users);
    }

    async findByEmail(email: string): Promise<User | null> {
        const users = loadUsers();
        const data = users.find(u => u.email === email.toLowerCase());
        return data ? toUser(data) : null;
    }

    async findById(id: string): Promise<User | null> {
        const users = loadUsers();
        const data = users.find(u => u.id === id);
        return data ? toUser(data) : null;
    }

    async findAll(): Promise<User[]> {
        const users = loadUsers();
        return users.map(toUser);
    }
}
