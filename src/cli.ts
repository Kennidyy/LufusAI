import { CreateUserUseCase } from "./application/use-cases/CreateUserUseCase.ts";
import type { IUserRepository } from "./domain/repositories/IUserRepository.ts";
import type { IUuidGenerator } from "./domain/value-objects/IUuidGenerator.ts";
import type { IEmailValidator } from "./domain/value-objects/IEmailValidator.ts";
import type { IPasswordHash } from "./domain/value-objects/IPasswordHash.ts";
import { User } from "./domain/entities/User.ts";
import { EmailValidator } from "./infrastructure/validators/EmailValidator.ts";
import { Argon2IdPasswordHash } from "./infrastructure/cryptography/Argon2IdPasswordHash.ts";
import { UuidGenerator } from "./infrastructure/uuid/UuidGenerator.ts";

class InMemoryUserRepository implements IUserRepository {
    private users: User[] = [];

    async create(user: User): Promise<void> {
        this.users.push(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.users.find(u => u.email.value === email) || null;
    }

    async findById(id: string): Promise<User | null> {
        return this.users.find(u => u.id.value === id) || null;
    }
}

const args = process.argv.slice(2);

if (args.length < 3) {
    console.log("\n=== CLI de Criação de Usuário ===\n");
    console.log("Uso: bun run cli.ts <email> <password> <name>");
    console.log("Exemplo: bun run cli.ts test@example.com Password1@ John Doe\n");
    process.exit(1);
}

const [email, password, name] = args as [string, string, string];

const repository = new InMemoryUserRepository();
const uuidGenerator = new UuidGenerator();
const emailValidator = new EmailValidator();
const passwordHash = new Argon2IdPasswordHash();
const createUserUseCase = new CreateUserUseCase(
    repository,
    uuidGenerator,
    emailValidator,
    passwordHash
);

async function main() {
    console.log("\n=== CLI de Criação de Usuário ===\n");

    try {
        const result = await createUserUseCase.execute({ email, password, name });
        console.log("✓ Usuário criado com sucesso!");
        console.log(`  ID: ${result.user.id.value}`);
        console.log(`  Email: ${result.user.email.value}`);
        console.log(`  Name: ${result.user.name.value}`);
    } catch (error: unknown) {
        console.log(`\n✗ Erro: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}

main();
