import "dotenv/config";

import * as inquirer from "@inquirer/prompts";
import { DrizzleUserRepository, DrizzleWalletRepository, UuidGenerator, EmailValidator, Argon2IdPasswordHash } from "./infrastructure/index.ts";
import { CreateUserUseCase, AddPointsUseCase, RemovePointsUseCase } from "./application/index.ts";
import { FileSessionStore } from "./shared/security/SessionManager.ts";
import { closeConnection } from "../database/connection.ts";
import { 
    CreateUserCommand, 
    AddPointsCommand, 
    RemovePointsCommand,
    TransferPointsCommand
} from "./application/commands/index.ts";
import { 
    GetUserQuery,
    ListUsersQuery,
    GetBalanceQuery,
    GetTransactionHistoryQuery,
    GetLeaderboardQuery
} from "./application/queries/index.ts";
import { ValidationError, NotFoundError } from "./domain/errors/index.ts";

const uuidGenerator = new UuidGenerator();
const userRepository = new DrizzleUserRepository(uuidGenerator);
const walletRepository = new DrizzleWalletRepository();
const emailValidator = new EmailValidator();
const passwordHash = new Argon2IdPasswordHash();
const sessionStore = new FileSessionStore();

const createUserUseCase = new CreateUserUseCase(userRepository, walletRepository, uuidGenerator, emailValidator, passwordHash);
const addPointsUseCase = new AddPointsUseCase(walletRepository, uuidGenerator);
const removePointsUseCase = new RemovePointsUseCase(walletRepository, uuidGenerator);

const createUserCommand = new CreateUserCommand(userRepository, walletRepository, uuidGenerator, emailValidator, passwordHash);
const addPointsCommand = new AddPointsCommand(walletRepository, uuidGenerator);
const removePointsCommand = new RemovePointsCommand(walletRepository, uuidGenerator);
const transferPointsCommand = new TransferPointsCommand(walletRepository, uuidGenerator);

const getUserQuery = new GetUserQuery(userRepository, walletRepository);
const listUsersQuery = new ListUsersQuery(userRepository, walletRepository);
const getBalanceQuery = new GetBalanceQuery(walletRepository);
const getHistoryQuery = new GetTransactionHistoryQuery(userRepository);
const getLeaderboardQuery = new GetLeaderboardQuery(userRepository, walletRepository);

const SESSION_FILE = "./.lufus-session";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

const { existsSync, readFileSync, writeFileSync } = require("fs");

function success(msg: string) { console.log(`${GREEN}✓ ${msg}${RESET}`); }
function error(msg: string) { console.log(`${RED}✗ ${msg}${RESET}`); }
function warn(msg: string) { console.log(`${YELLOW}⚠ ${msg}${RESET}`); }
function info(msg: string) { console.log(`${CYAN}ℹ ${msg}${RESET}`); }
function header(msg: string) { console.log(`\n${CYAN}${BOLD}═══ ${msg} ═══${RESET}\n`); }

function getStoredToken(): string | null {
    try {
        if (existsSync(SESSION_FILE)) {
            const data = readFileSync(SESSION_FILE, "utf-8");
            const sessions = JSON.parse(data);
            for (const token of Object.keys(sessions)) {
                return token;
            }
        }
    } catch {}
    return null;
}

function storeToken(token: string, userData: { userId: string; email: string; name: string }): void {
    try {
        let sessions: Record<string, unknown> = {};
        if (existsSync(SESSION_FILE)) {
            sessions = JSON.parse(readFileSync(SESSION_FILE, "utf-8"));
        }
        sessions[token] = {
            ...userData,
            createdAt: Date.now(),
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
        };
        writeFileSync(SESSION_FILE, JSON.stringify(sessions, null, 2));
    } catch (e) {
        warn("Não foi possível salvar sessão");
    }
}

function getSessionStore() { return sessionStore; }

function getCurrentSession(): { userId: string; email: string; name: string } | null {
    const token = getStoredToken();
    if (!token) return null;
    try {
        const { GetCurrentUserUseCase } = require("./application/use-cases/AuthUseCases.ts");
        const getCurrentUserUseCase = new GetCurrentUserUseCase(getSessionStore());
        return getCurrentUserUseCase.execute(token);
    } catch {
        return null;
    }
}

function getErrorMessage(e: unknown): string {
    if (e instanceof ValidationError) return e.message;
    if (e instanceof NotFoundError) return e.message;
    if (e instanceof Error) return e.message;
    return String(e);
}

async function register() {
    header("CADASTRAR");
    try {
        const email = await inquirer.input({
            message: "Email:",
            validate: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Email inválido"
        });
        const password = await inquirer.input({
            message: "Senha:",
            validate: (v: string) => {
                if (!v) return "Senha é obrigatória";
                if (v.length < 8) return "Mínimo 8 caracteres";
                if (!/[a-z]/.test(v)) return "Precisa de letra minúscula";
                if (!/[A-Z]/.test(v)) return "Precisa de letra maiúscula";
                if (!/[0-9]/.test(v)) return "Precisa de número";
                return true;
            }
        });
        const name = await inquirer.input({
            message: "Nome:",
            validate: (v: string) => v.trim().length > 0 || "Nome é obrigatório"
        });
        
        const result = await createUserCommand.execute({ email, password, name });
        if (result.success) {
            success(`Cadastrado com sucesso!`);
            console.log(`   ID: ${result.data?.userId}`);
            return true;
        }
        return false;
    } catch (e) {
        error(getErrorMessage(e));
        return false;
    }
}

async function login() {
    header("LOGIN");
    try {
        const email = await inquirer.input({
            message: "Email:",
            validate: (v: string) => v.trim().length > 0 || "Email é obrigatório"
        });
        const password = await inquirer.input({
            message: "Senha:",
            validate: (v: string) => v.length > 0 || "Senha é obrigatória"
        });
        
        const { LoginUseCase } = await import("./application/use-cases/AuthUseCases.ts");
        const loginUseCase = new LoginUseCase(userRepository, passwordHash, getSessionStore());
        const result = await loginUseCase.execute({ email, password });
        
        storeToken(result.token, {
            userId: result.userId,
            email: result.email,
            name: result.name
        });
        
        success(`Bem-vindo, ${result.name}!`);
        return { userId: result.userId, email: result.email, name: result.name };
    } catch (e) {
        error(getErrorMessage(e));
        return null;
    }
}

async function logout() {
    const token = getStoredToken();
    if (token) {
        const { LogoutUseCase } = await import("./application/use-cases/AuthUseCases.ts");
        const logoutUseCase = new LogoutUseCase(getSessionStore());
        logoutUseCase.execute(token);
    }
    success("Logout realizado!");
}

async function showBalance(userId: string) {
    try {
        const balance = await getBalanceQuery.execute(userId);
        console.log(`\n${BOLD}Saldo:${RESET} ${CYAN}${balance.balance}${RESET} pontos\n`);
        return balance.balance;
    } catch (e) {
        error(getErrorMessage(e));
        return 0;
    }
}

async function showLeaderboard() {
    header("🏆 RANKING");
    try {
        const leaderboard = await getLeaderboardQuery.execute(10);
        
        if (leaderboard.length === 0) {
            warn("Nenhum usuário no ranking");
            return;
        }
        
        console.log(`${BOLD}Posição  Nome                    Pontos${RESET}`);
        console.log("-".repeat(45));
        
        leaderboard.forEach((user, index) => {
            const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
            const name = user.name.padEnd(20);
            const points = String(user.points).padStart(8);
            console.log(`${medal} ${name} ${CYAN}${points}${RESET}`);
        });
        console.log();
    } catch (e) {
        error(getErrorMessage(e));
    }
}

async function addPoints(userId: string) {
    header("💰 ADICIONAR PONTOS");
    try {
        const amountStr = await inquirer.input({
            message: "Quantidade:",
            validate: (v: string) => /^\d+$/.test(v) && parseInt(v) > 0 || "Digite um número positivo"
        });
        const amount = parseInt(amountStr);
        
        if (amount > 1000000) {
            error("Quantidade máxima: 1.000.000");
            return false;
        }
        
        const result = await addPointsCommand.execute({ userId, amount });
        
        if (result.success) {
            success(`${amount} pontos adicionados!`);
            console.log(`   Novo saldo: ${result.data?.newBalance} pontos`);
            return true;
        }
        return false;
    } catch (e) {
        error(getErrorMessage(e));
        return false;
    }
}

async function usePoints(userId: string) {
    header("🎫 USAR PONTOS");
    try {
        const balance = await getBalanceQuery.execute(userId);
        
        if (balance.balance === 0) {
            warn("Você não tem pontos para usar.");
            return false;
        }
        
        console.log(`Saldo atual: ${balance.balance} pontos\n`);
        
        const amountStr = await inquirer.input({
            message: `Quantidade (max ${balance.balance}):`,
            validate: (v: string) => {
                const n = parseInt(v);
                return /^\d+$/.test(v) && n > 0 && n <= balance.balance || `Digite 1-${balance.balance}`;
            }
        });
        const amount = parseInt(amountStr);
        
        const result = await removePointsCommand.execute({ userId, amount });
        
        if (result.success) {
            success(`${amount} pontos usados!`);
            console.log(`   Saldo restante: ${result.data?.newBalance} pontos`);
            return true;
        }
        return false;
    } catch (e) {
        error(getErrorMessage(e));
        return false;
    }
}

async function transferPoints(userId: string) {
    header("🔄 TRANSFERIR PONTOS");
    try {
        const users = await listUsersQuery.execute();
        const otherUsers = users.filter(u => u.id !== userId);
        
        if (otherUsers.length === 0) {
            warn("Não há outros usuários para transferir.");
            return false;
        }
        
        const recipientId = await inquirer.select({
            message: "Selecione o destinatário:",
            choices: otherUsers.map(u => ({
                name: `${u.name} (${u.email})`,
                value: u.id
            }))
        });
        
        const balance = await getBalanceQuery.execute(userId);
        
        if (balance.balance === 0) {
            warn("Você não tem pontos para transferir.");
            return false;
        }
        
        console.log(`Saldo atual: ${balance.balance} pontos\n`);
        
        const amountStr = await inquirer.input({
            message: `Quantidade (max ${balance.balance}):`,
            validate: (v: string) => {
                const n = parseInt(v);
                return /^\d+$/.test(v) && n > 0 && n <= balance.balance || `Digite 1-${balance.balance}`;
            }
        });
        const amount = parseInt(amountStr);
        
        const result = await transferPointsCommand.execute({
            fromUserId: userId,
            toUserId: recipientId,
            amount
        });
        
        if (result.success) {
            const recipient = users.find(u => u.id === recipientId);
            success(`${amount} pontos transferidos para ${recipient?.name}!`);
            return true;
        }
        return false;
    } catch (e) {
        error(getErrorMessage(e));
        return false;
    }
}

async function showHistory(userId: string) {
    header("📜 HISTÓRICO DE TRANSAÇÕES");
    try {
        const history = await getHistoryQuery.execute(userId);
        
        if (history.length === 0) {
            warn("Nenhuma transação encontrada");
            return;
        }
        
        console.log(`${BOLD}Data/Hora            Tipo        Valor    Saldo${RESET}`);
        console.log("-".repeat(55));
        
        history.forEach(tx => {
            const date = tx.occurredAt.toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
            });
            const type = tx.type.padEnd(12);
            const amount = (tx.type === "REMOVED" ? "-" : "+") + tx.amount;
            const balance = String(tx.balance).padStart(6);
            
            const typeColor = tx.type === "ADDED" ? GREEN : tx.type === "REMOVED" ? RED : CYAN;
            console.log(`${date}  ${typeColor}${type}${RESET}  ${amount.padStart(6)}  ${balance}`);
        });
        console.log();
    } catch (e) {
        error(getErrorMessage(e));
    }
}

async function showProfile(user: { userId: string; email: string; name: string }) {
    header("👤 MEU PERFIL");
    try {
        const profile = await getUserQuery.execute(user.userId);
        
        if (!profile) {
            error("Perfil não encontrado");
            return;
        }
        
        console.log(`${BOLD}Nome:${RESET} ${profile.name}`);
        console.log(`${BOLD}Email:${RESET} ${profile.email}`);
        console.log(`${BOLD}ID:${RESET} ${profile.id}`);
        console.log(`${BOLD}Pontos:${RESET} ${CYAN}${profile.points}${RESET}`);
        console.log(`${BOLD}Desde:${RESET} ${profile.createdAt.toLocaleDateString("pt-BR")}`);
        console.log();
    } catch (e) {
        error(getErrorMessage(e));
    }
}

async function mainMenu(user: { userId: string; email: string; name: string }) {
    while (true) {
        console.clear();
        console.log(`${CYAN}${BOLD}
╔══════════════════════════════════════════╗
║         LUFUS - CLIENTE CLI             ║
║         CQRS + Event Sourcing          ║
╠══════════════════════════════════════════╣
║  Logado como: ${user.name.padEnd(27)}║
║  Email: ${user.email.padEnd(34)}║
╚══════════════════════════════════════════╝${RESET}\n`);
        
        await showBalance(user.userId);
        
        const action = await inquirer.select({
            message: "O que deseja fazer?",
            choices: [
                { name: "💰 Adicionar pontos", value: "add" },
                { name: "🎫 Usar pontos", value: "use" },
                { name: "🔄 Transferir pontos", value: "transfer" },
                { name: "📜 Histórico", value: "history" },
                { name: "🏆 Ranking", value: "leaderboard" },
                { name: "", value: "sep1" },
                { name: "👤 Ver perfil", value: "profile" },
                { name: "🚪 Logout", value: "logout" }
            ]
        });

        if (action === "logout") {
            await logout();
            break;
        }
        
        switch (action) {
            case "profile":
                await showProfile(user);
                break;
            case "add":
                await addPoints(user.userId);
                break;
            case "use":
                await usePoints(user.userId);
                break;
            case "transfer":
                await transferPoints(user.userId);
                break;
            case "history":
                await showHistory(user.userId);
                break;
            case "leaderboard":
                await showLeaderboard();
                break;
        }
        
        console.log();
        await inquirer.input({ message: "Pressione ENTER para continuar..." });
    }
}

async function authMenu() {
    while (true) {
        console.clear();
        console.log(`${CYAN}${BOLD}
╔══════════════════════════════════════════╗
║         LUFUS - CLIENTE CLI             ║
║         CQRS + Event Sourcing          ║
╠══════════════════════════════════════════╣
║  Sistema de Pontos                      ║
╚══════════════════════════════════════════╝${RESET}\n`);
        
        const action = await inquirer.select({
            message: "Selecione uma opção:",
            choices: [
                { name: "🔑 Login", value: "login" },
                { name: "📝 Cadastrar", value: "register" },
                { name: "❌ Sair", value: "exit" }
            ]
        });

        if (action === "exit") {
            info("Até logo!");
            return null;
        }
        
        if (action === "register") {
            const registered = await register();
            if (registered) {
                console.log();
                info("Faça login para continuar.");
                await inquirer.input({ message: "Pressione ENTER..." });
            }
            continue;
        }
        
        if (action === "login") {
            const user = await login();
            if (user) {
                return user;
            }
            console.log();
            await inquirer.input({ message: "Pressione ENTER para continuar..." });
        }
    }
}

async function main() {
    const token = getStoredToken();
    let user: { userId: string; email: string; name: string } | null = null;
    
    if (token) {
        try {
            user = getCurrentSession();
            if (user) {
                info(`Sessão ativa como ${user.name}`);
            }
        } catch {
            warn("Sessão expirada. Faça login novamente.");
        }
    }
    
    if (!user) {
        user = await authMenu();
    }
    
    if (user) {
        await mainMenu(user);
    }
    
    await closeConnection();
}

main().catch(e => {
    error(getErrorMessage(e));
    closeConnection();
});
