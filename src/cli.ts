import "dotenv/config";

import { CreateUserUseCase, AddPointsUseCase, RemovePointsUseCase, DeleteUserUseCase, DeleteAllUsersUseCase } from "./application/index.ts";
import { DrizzleUserRepository, DrizzleWalletRepository, UuidGenerator, EmailValidator, Argon2IdPasswordHash } from "./infrastructure/index.ts";
import { closeConnection } from "../database/connection.ts";
import { logger } from "./shared/logger/index.ts";
import { AppError, ValidationError, NotFoundError, ConflictError } from "./domain/errors/index.ts";
import { createHash, randomBytes } from "crypto";
import * as inquirer from "@inquirer/prompts";

const uuidGenerator = new UuidGenerator();
const userRepository = new DrizzleUserRepository(uuidGenerator);
const walletRepository = new DrizzleWalletRepository();
const emailValidator = new EmailValidator();
const passwordHash = new Argon2IdPasswordHash();

const createUserUseCase = new CreateUserUseCase(userRepository, walletRepository, uuidGenerator, emailValidator, passwordHash);
const addPointsUseCase = new AddPointsUseCase(walletRepository, uuidGenerator);
const removePointsUseCase = new RemovePointsUseCase(walletRepository, uuidGenerator);
const deleteUserUseCase = new DeleteUserUseCase(userRepository, walletRepository);
const deleteAllUsersUseCase = new DeleteAllUsersUseCase(userRepository, walletRepository);

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

function success(msg: string) { console.log(`${GREEN}✓ ${msg}${RESET}`); }
function error(msg: string) { console.log(`${RED}✗ ${msg}${RESET}`); }
function info(msg: string) { console.log(`${YELLOW}ℹ ${msg}${RESET}`); }
function header(msg: string) { console.log(`\n${CYAN}${BOLD}═══ ${msg} ═══${RESET}\n`); }

function validateApiKey(): boolean {
    const configuredKey = process.env.LUFUS_API_KEY;
    if (!configuredKey) {
        info("API key não configurada - permitindo acesso local");
        return true;
    }
    return true;
}

function generateApiKey(): string {
    return `lfk_${randomBytes(32).toString("hex")}`;
}

function validatePassword(value: string): string | true {
    if (!value) return "Senha é obrigatória";
    if (value.length < 8) return "Mínimo 8 caracteres";
    if (!/[a-z]/.test(value)) return "Precisa de letra minúscula";
    if (!/[A-Z]/.test(value)) return "Precisa de letra maiúscula";
    if (!/[0-9]/.test(value)) return "Precisa de número";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return "Precisa de símbolo (!@#$...)";
    return true;
}

function validateUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
}

async function createUserInteractive() {
    header("CRIAR USUÁRIO");
    try {
        const email = await inquirer.input({
            message: "Email:",
            validate: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Email inválido (ex: usuario@dominio.com)"
        });
        const password = await inquirer.input({
            message: "Senha:",
            validate: validatePassword
        });
        const name = await inquirer.input({
            message: "Nome:",
            validate: (v: string) => v.trim().length > 0 && /^[a-zA-ZÀ-ÿ\s'-]+$/.test(v) || "Nome inválido (apenas letras)"
        });
        
        const result = await createUserUseCase.execute({ email, password, name });
        success(`"${result.user.name.value}" criado!`);
        console.log(`   ID: ${result.user.id.value}`);
        console.log(`   Email: ${result.user.email.value}`);
    } catch (e) {
        error(getErrorMessage(e));
    }
}

async function listUsersInteractive() {
    header("USUÁRIOS");
    try {
        const users = await userRepository.findAll();
        if (users.length === 0) {
            info("Nenhum usuário encontrado");
            return;
        }
        for (const user of users) {
            const wallet = await walletRepository.findByUserId(user.id.value);
            console.log(`${CYAN}•${RESET} ${BOLD}${user.name.value}${RESET} - ${user.email.value}`);
            console.log(`  ID: ${user.id.value} | Pontos: ${wallet?.points.value || 0}`);
        }
    } catch (e) {
        error(getErrorMessage(e));
    }
}

async function userDetailsInteractive() {
    header("DETALHES DO USUÁRIO");
    try {
        const users = await userRepository.findAll();
        if (users.length === 0) {
            info("Nenhum usuário");
            return;
        }
        const selected = await inquirer.select({
            message: "Selecione:",
            choices: users.map(u => ({ name: `${u.name.value} (${u.email.value})`, value: u.id.value }))
        });
        if (!validateUUID(selected)) {
            error("ID inválido");
            return;
        }
        const user = await userRepository.findById(selected);
        const wallet = await walletRepository.findByUserId(selected);
        if (user) {
            console.log(`\n${BOLD}Nome:${RESET} ${user.name.value}`);
            console.log(`${BOLD}Email:${RESET} ${user.email.value}`);
            console.log(`${BOLD}ID:${RESET} ${user.id.value}`);
            console.log(`${BOLD}Saldo:${RESET} ${wallet?.points.value || 0} pontos`);
            console.log(`${BOLD}Criado:${RESET} ${user.createdAt.toLocaleString("pt-BR")}`);
        }
    } catch (e) {
        error(getErrorMessage(e));
    }
}

async function managePointsInteractive(action: "add" | "remove") {
    header(action === "add" ? "ADICIONAR PONTOS" : "REMOVER PONTOS");
    try {
        const users = await userRepository.findAll();
        if (users.length === 0) {
            info("Nenhum usuário");
            return;
        }
        const userId = await inquirer.select({
            message: "Selecione o usuário:",
            choices: users.map(u => ({ name: `${u.name.value} (${u.email.value})`, value: u.id.value }))
        });
        if (!validateUUID(userId)) {
            error("ID inválido");
            return;
        }
        const amountStr = await inquirer.input({
            message: "Quantidade de pontos:",
            validate: (v: string) => /^\d+$/.test(v) && parseInt(v) > 0 || "Digite um número positivo"
        });
        const amount = parseInt(amountStr);
        if (amount > 1000000) {
            error("Quantidade máxima: 1.000.000");
            return;
        }
        if (action === "add") {
            await addPointsUseCase.execute({ userId, amount });
        } else {
            await removePointsUseCase.execute({ userId, amount });
        }
        success(`Pontos ${action === "add" ? "adicionados" : "removidos"}!`);
        const wallet = await walletRepository.findByUserId(userId);
        console.log(`   Novo saldo: ${wallet?.points.value} pontos`);
    } catch (e) {
        error(getErrorMessage(e));
    }
}

async function deleteUserInteractive() {
    header("DELETAR USUÁRIO");
    try {
        const users = await userRepository.findAll();
        if (users.length === 0) {
            info("Nenhum usuário");
            return;
        }
        const userId = await inquirer.select({
            message: "Selecione o usuário:",
            choices: users.map(u => ({ name: `${u.name.value} (${u.email.value})`, value: u.id.value }))
        });
        if (!validateUUID(userId)) {
            error("ID inválido");
            return;
        }
        const confirm = await inquirer.confirm({ message: "Confirmar exclusão?", default: false });
        if (confirm) {
            await deleteUserUseCase.execute({ userId });
            success("Usuário deletado!");
        } else {
            info("Cancelado");
        }
    } catch (e) {
        error(getErrorMessage(e));
    }
}

async function deleteAllUsersInteractive() {
    header("DELETAR TODOS");
    try {
        const users = await userRepository.findAll();
        if (users.length === 0) {
            info("Nenhum usuário");
            return;
        }
        info(`Excluir ${users.length} usuário(s). Digite o número para confirmar:`);
        const confirm = await inquirer.input({
            message: `Digite "${users.length}" para confirmar:`,
            validate: (v: string) => v === String(users.length) || "Número incorreto"
        });
        if (confirm === String(users.length)) {
            const result = await deleteAllUsersUseCase.execute();
            success(`${result.deletedCount} usuário(s) deletado(s)!`);
        }
    } catch (e) {
        error(getErrorMessage(e));
    }
}

function getErrorMessage(e: unknown): string {
    if (e instanceof ValidationError) return e.message;
    if (e instanceof NotFoundError) return e.message;
    if (e instanceof ConflictError) return e.message;
    if (e instanceof AppError) return e.message;
    if (e instanceof Error) return e.message;
    return String(e);
}

async function runCommandMode(args: string[]) {
    const [cmd, ...rest] = args;
    try {
        switch (cmd) {
            case "create-user": {
                if (rest.length < 3) { error("Uso: create-user <email> <password> <name>"); break; }
                const [email, password, ...nameParts] = rest;
                const r = await createUserUseCase.execute({ email: email!, password: password!, name: nameParts.join(" ") });
                success(`"${r.user.name.value}" criado!`);
                break;
            }
            case "list-users": {
                const users = await userRepository.findAll();
                console.log(`\n${users.length} usuário(s):\n`);
                for (const u of users) {
                    const w = await walletRepository.findByUserId(u.id.value);
                    console.log(`• ${u.name.value} (${u.email.value}) - ${w?.points.value || 0} pts`);
                }
                break;
            }
            case "get-user": {
                const id = rest[0];
                if (!id || !validateUUID(id)) { error("ID inválido"); break; }
                const u = await userRepository.findById(id);
                if (!u) { error("Usuário não encontrado"); break; }
                const w = await walletRepository.findByUserId(id);
                console.log(`\n${u.name.value}\nEmail: ${u.email.value}\nID: ${u.id.value}\nPontos: ${w?.points.value || 0}\n`);
                break;
            }
            case "add-points": {
                const userId = rest[0], amountStr = rest[1];
                if (!userId || !validateUUID(userId)) { error("ID inválido"); break; }
                const amount = parseInt(amountStr!);
                if (isNaN(amount) || amount <= 0) { error("Quantidade inválida"); break; }
                if (amount > 1000000) { error("Quantidade máxima: 1.000.000"); break; }
                await addPointsUseCase.execute({ userId, amount });
                success("Pontos adicionados!");
                break;
            }
            case "remove-points": {
                const userId = rest[0], amountStr = rest[1];
                if (!userId || !validateUUID(userId)) { error("ID inválido"); break; }
                const amount = parseInt(amountStr!);
                if (isNaN(amount) || amount <= 0) { error("Quantidade inválida"); break; }
                await removePointsUseCase.execute({ userId, amount });
                success("Pontos removidos!");
                break;
            }
            case "delete-user": {
                const userId = rest[0];
                if (!userId || !validateUUID(userId)) { error("ID inválido"); break; }
                await deleteUserUseCase.execute({ userId });
                success("Usuário deletado!");
                break;
            }
            case "delete-all-users": {
                const result = await deleteAllUsersUseCase.execute();
                success(`${result.deletedCount} usuário(s) deletado(s)!`);
                break;
            }
            case "generate-key": {
                const newKey = generateApiKey();
                console.log(`\n${GREEN}🔐 Nova API Key gerada:${RESET}`);
                console.log(`   LUFUS_API_KEY=${newKey}`);
                console.log(`\n${YELLOW}⚠️  Adicione ao .env e reinicie${RESET}`);
                break;
            }
            default:
                error(`Comando: ${cmd}`);
        }
    } catch (e) {
        error(getErrorMessage(e));
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
        await runCommandMode(args);
        await closeConnection();
        return;
    }
    
    validateApiKey();
    
    while (true) {
        console.clear();
        console.log(`${CYAN}${BOLD}
╔═══════════════════════════════════════╗
║      LUFUS CLI - SISTEMA            ║
╚═══════════════════════════════════════╝${RESET}\n`);
        
        const action = await inquirer.select({
            message: "Selecione uma opção:",
            choices: [
                { name: "👤 Criar usuário", value: "create" },
                { name: "📋 Listar usuários", value: "list" },
                { name: "👁️ Ver detalhes", value: "details" },
                { name: "➕ Adicionar pontos", value: "add" },
                { name: "➖ Remover pontos", value: "remove" },
                { name: "🗑️ Deletar usuário", value: "delete" },
                { name: "💥 Deletar todos", value: "delete-all" },
                { name: "❌ Sair", value: "exit" }
            ]
        });

        if (action === "exit") break;

        switch (action) {
            case "create": await createUserInteractive(); break;
            case "list": await listUsersInteractive(); break;
            case "details": await userDetailsInteractive(); break;
            case "add": await managePointsInteractive("add"); break;
            case "remove": await managePointsInteractive("remove"); break;
            case "delete": await deleteUserInteractive(); break;
            case "delete-all": await deleteAllUsersInteractive(); break;
        }

        console.log();
        await inquirer.input({ message: "Pressione ENTER para continuar..." });
    }

    info("Até logo!");
    await closeConnection();
}

main().catch(e => {
    error(getErrorMessage(e));
    logger.error("CLI error", e as Error);
    closeConnection();
});
