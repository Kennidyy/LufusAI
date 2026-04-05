import { CreateUserUseCase } from "./application/use-cases/CreateUserUseCase.ts";
import { AddPointsUseCase } from "./application/use-cases/AddPointsUseCase.ts";
import { RemovePointsUseCase } from "./application/use-cases/RemovePointsUseCase.ts";
import type { IUserRepository } from "./domain/repositories/IUserRepository.ts";
import type { IWalletRepository } from "./domain/repositories/IWalletRepository.ts";
import type { IUuidGenerator } from "./domain/value-objects/IUuidGenerator.ts";
import type { IEmailValidator } from "./domain/value-objects/IEmailValidator.ts";
import type { IPasswordHash } from "./domain/value-objects/IPasswordHash.ts";
import { EmailValidator } from "./infrastructure/validators/EmailValidator.ts";
import { Argon2IdPasswordHash } from "./infrastructure/cryptography/Argon2IdPasswordHash.ts";
import { UuidGenerator } from "./infrastructure/uuid/UuidGenerator.ts";
import { JsonUserRepository } from "./infrastructure/persistence/JsonUserRepository.ts";
import { JsonWalletRepository } from "./infrastructure/persistence/JsonWalletRepository.ts";

const userRepository = new JsonUserRepository();
const walletRepository = new JsonWalletRepository();
const uuidGenerator = new UuidGenerator();
const emailValidator = new EmailValidator();
const passwordHash = new Argon2IdPasswordHash();

const createUserUseCase = new CreateUserUseCase(
    userRepository,
    walletRepository,
    uuidGenerator,
    emailValidator,
    passwordHash
);

const addPointsUseCase = new AddPointsUseCase(walletRepository, uuidGenerator);
const removePointsUseCase = new RemovePointsUseCase(walletRepository, uuidGenerator);

const args = process.argv.slice(2);
const command = args[0];

async function createUser(email: string, password: string, name: string) {
    const result = await createUserUseCase.execute({ email, password, name });
    console.log("✓ Usuário criado com sucesso!");
    console.log(`  ID: ${result.user.id.value}`);
    console.log(`  Email: ${result.user.email.value}`);
    console.log(`  Name: ${result.user.name.value}`);
    return result.user.id.value;
}

async function addPoints(userId: string, amount: number) {
    const result = await addPointsUseCase.execute({ userId, amount });
    console.log("✓ Pontos adicionados!");
    console.log(`  Saldo atual: ${result.wallet.points.value}`);
}

async function removePoints(userId: string, amount: number) {
    const result = await removePointsUseCase.execute({ userId, amount });
    console.log("✓ Pontos removidos!");
    console.log(`  Saldo atual: ${result.wallet.points.value}`);
}

async function getBalance(userId: string) {
    const wallet = await walletRepository.findByUserId(userId);
    if (!wallet) {
        console.log(`✗ Carteira não encontrada para userId: ${userId}`);
        process.exit(1);
    }
    console.log(`  Saldo: ${wallet.points.value}`);
}

async function getUser(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
        console.log(`✗ Usuário não encontrado: ${userId}`);
        process.exit(1);
    }
    const wallet = await walletRepository.findByUserId(userId);
    console.log(`=== Usuário ===`);
    console.log(`  ID: ${user.id.value}`);
    console.log(`  Email: ${user.email.value}`);
    console.log(`  Nome: ${user.name.value}`);
    console.log(`  Criado em: ${user.createdAt.toISOString()}`);
    console.log(`  Carteira ID: ${wallet?.id.value || 'N/A'}`);
    console.log(`  Saldo: ${wallet?.points.value || 0}`);
}

async function listUsers() {
    const users = await userRepository.findAll();
    if (users.length === 0) {
        console.log("Nenhum usuário encontrado");
        return;
    }
    console.log(`=== ${users.length} usuário(s) ===`);
    for (const user of users) {
        const wallet = await walletRepository.findByUserId(user.id.value);
        console.log(`\nID: ${user.id.value}`);
        console.log(`  Email: ${user.email.value}`);
        console.log(`  Nome: ${user.name.value}`);
        console.log(`  Saldo: ${wallet?.points.value || 0}`);
    }
}

function help() {
    console.log(`
=== CLI Lufus ===

Uso: bun run src/cli.ts <comando> [argumentos]

Comandos:
  create-user <email> <password> <name>
    Cria um novo usuário
    
  add-points <userId> <amount>
    Adiciona pontos à carteira de um usuário
    
  remove-points <userId> <amount>
    Remove pontos da carteira de um usuário
    
  get-balance <userId>
    Consulta o saldo de pontos de um usuário

  get-user <userId>
    Consulta todas as informações do usuário

  list-users
    Lista todos os usuários

 Exemplos:
  bun run src/cli.ts create-user john@example.com Password1@ "John Doe"
  bun run src/cli.ts add-points USER_ID 100
  bun run src/cli.ts remove-points USER_ID 50
  bun run src/cli.ts get-balance USER_ID
  bun run src/cli.ts get-user USER_ID
  bun run src/cli.ts list-users
`);
}

async function main() {
    try {
        switch (command) {
            case "create-user": {
                if (args.length < 4) {
                    console.log("Uso: create-user <email> <password> <name>");
                    process.exit(1);
                }
                const [, email, password, name] = args as [string, string, string, string];
                await createUser(email!, password!, name!);
                break;
            }
            case "add-points": {
                if (args.length < 3) {
                    console.log("Uso: add-points <userId> <amount>");
                    process.exit(1);
                }
                const userId = args[1]!;
                const amount = parseInt(args[2]!, 10);
                if (isNaN(amount)) {
                    console.log("✗ Amount deve ser um número inteiro");
                    process.exit(1);
                }
                await addPoints(userId, amount);
                break;
            }
            case "remove-points": {
                if (args.length < 3) {
                    console.log("Uso: remove-points <userId> <amount>");
                    process.exit(1);
                }
                const userId = args[1]!;
                const amount = parseInt(args[2]!, 10);
                if (isNaN(amount)) {
                    console.log("✗ Amount deve ser um número inteiro");
                    process.exit(1);
                }
                await removePoints(userId, amount);
                break;
            }
            case "get-balance": {
                if (args.length < 2) {
                    console.log("Uso: get-balance <userId>");
                    process.exit(1);
                }
                const userId = args[1]!;
                await getBalance(userId!);
                break;
            }
            case "get-user": {
                if (args.length < 2) {
                    console.log("Uso: get-user <userId>");
                    process.exit(1);
                }
                const userId = args[1]!;
                await getUser(userId!);
                break;
            }
            case "list-users": {
                await listUsers();
                break;
            }
            default:
                help();
                process.exit(1);
        }
    } catch (error: unknown) {
        console.log(`\n✗ Erro: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}

main();
