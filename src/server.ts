import "dotenv/config";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { DrizzleUserRepository, DrizzleWalletRepository, UuidGenerator, EmailValidator, Argon2IdPasswordHash } from "./infrastructure/index.ts";
import { FileSessionStore, createSession } from "./shared/security/SessionManager.ts";
import { CreateUserCommand, AddPointsCommand, RemovePointsCommand } from "./application/commands/index.ts";
import { GetBalanceQuery, GetLeaderboardQuery, ListUsersQuery } from "./application/queries/index.ts";
import { DeleteUserUseCase } from "./application/use-cases/DeleteUserUseCase.ts";
import { ValidationError, NotFoundError } from "./domain/errors/index.ts";

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "Admin123@";

const uuidGenerator = new UuidGenerator();
const userRepository = new DrizzleUserRepository(uuidGenerator);
const walletRepository = new DrizzleWalletRepository();
const emailValidator = new EmailValidator();
const passwordHash = new Argon2IdPasswordHash();
const sessionStore = new FileSessionStore();

const createUserCommand = new CreateUserCommand(userRepository, walletRepository, uuidGenerator, emailValidator, passwordHash);
const addPointsCommand = new AddPointsCommand(walletRepository, uuidGenerator);
const removePointsCommand = new RemovePointsCommand(walletRepository, uuidGenerator);
const getBalanceQuery = new GetBalanceQuery(walletRepository);
const getLeaderboardQuery = new GetLeaderboardQuery(userRepository, walletRepository);
const listUsersQuery = new ListUsersQuery(userRepository, walletRepository);
const deleteUserUseCase = new DeleteUserUseCase(userRepository, walletRepository);

function getErrorMessage(e: unknown): string {
    if (e instanceof ValidationError) return e.message;
    if (e instanceof NotFoundError) return e.message;
    if (e instanceof Error) return e.message;
    return String(e);
}

function extractToken(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    return authHeader.slice(7);
}

const app = new Elysia()
    .use(cors({ origin: "*" }))
    
    .post("/api/auth/register", async ({ body }) => {
        try {
            const { email, password, name } = body as { email: string; password: string; name: string };
            const result = await createUserCommand.execute({ email, password, name });
            if (result.success) {
                return { success: true, userId: result.data?.userId };
            }
            return { success: false, message: "Erro ao criar usuário" };
        } catch (e) {
            return { success: false, message: getErrorMessage(e) };
        }
    })
    
    .post("/api/auth/login", async ({ body }) => {
        try {
            const { email, password } = body as { email: string; password: string };
            
            if (!email || !password) {
                return { success: false, message: "Email e senha são obrigatórios" };
            }
            
            const isAdmin = email.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD;
            
            if (isAdmin) {
                const session = createSession("admin", ADMIN_EMAIL, "Administrador");
                sessionStore.save(session);
                return {
                    success: true,
                    token: session.token,
                    user: { userId: "admin", email: ADMIN_EMAIL, name: "Administrador", isAdmin: true }
                };
            }
            
            const user = await userRepository.findByEmail(email.toLowerCase().trim());
            if (!user) {
                return { success: false, message: "Email ou senha incorretos" };
            }
            
            const isValidPassword = await passwordHash.verify(password, user.password.value);
            if (!isValidPassword) {
                return { success: false, message: "Email ou senha incorretos" };
            }
            
            const session = createSession(user.id.value, user.email.value, user.name.value);
            sessionStore.save(session);
            
            return {
                success: true,
                token: session.token,
                user: { userId: session.userId, email: session.email, name: session.name, isAdmin: false }
            };
        } catch (e) {
            return { success: false, message: getErrorMessage(e) };
        }
    })
    
    .post("/api/auth/logout", ({ headers }) => {
        const token = extractToken(headers.authorization);
        if (token) {
            sessionStore.delete(token);
        }
        return { success: true };
    })
    
    .get("/api/auth/me", ({ headers }) => {
        const token = extractToken(headers.authorization);
        if (!token) {
            return { authenticated: false };
        }
        const session = sessionStore.findByToken(token);
        if (!session) {
            return { authenticated: false };
        }
        return { authenticated: true, user: { userId: session.userId, email: session.email, name: session.name } };
    })
    
    .get("/api/wallet/balance", async ({ headers }) => {
        try {
            const token = extractToken(headers.authorization);
            if (!token) {
                return { success: false, message: "Não autenticado" };
            }
            const session = sessionStore.findByToken(token);
            if (!session) {
                return { success: false, message: "Sessão inválida" };
            }
            const balance = await getBalanceQuery.execute(session.userId);
            return { success: true, balance: balance.balance };
        } catch (e) {
            return { success: false, message: getErrorMessage(e) };
        }
    })
    
    .post("/api/wallet/add-points", async ({ body, headers }) => {
        try {
            const token = extractToken(headers.authorization);
            if (!token) {
                return { success: false, message: "Não autenticado" };
            }
            const session = sessionStore.findByToken(token);
            if (!session) {
                return { success: false, message: "Sessão inválida" };
            }
            const { amount } = body as { amount: number };
            const result = await addPointsCommand.execute({ userId: session.userId, amount });
            if (result.success) {
                return { success: true, newBalance: result.data?.newBalance };
            }
            return { success: false, message: "Erro ao adicionar pontos" };
        } catch (e) {
            return { success: false, message: getErrorMessage(e) };
        }
    })
    
    .post("/api/wallet/remove-points", async ({ body, headers }) => {
        try {
            const token = extractToken(headers.authorization);
            if (!token) {
                return { success: false, message: "Não autenticado" };
            }
            const session = sessionStore.findByToken(token);
            if (!session) {
                return { success: false, message: "Sessão inválida" };
            }
            const { amount } = body as { amount: number };
            const result = await removePointsCommand.execute({ userId: session.userId, amount });
            if (result.success) {
                return { success: true, newBalance: result.data?.newBalance };
            }
            return { success: false, message: "Erro ao usar pontos" };
        } catch (e) {
            return { success: false, message: getErrorMessage(e) };
        }
    })
    
    .get("/api/leaderboard", async () => {
        try {
            const leaderboard = await getLeaderboardQuery.execute(10);
            return { success: true, leaderboard };
        } catch (e) {
            return { success: false, message: getErrorMessage(e), leaderboard: [] };
        }
    })
    
    .get("/api/admin/users", async ({ headers }) => {
        try {
            const token = extractToken(headers.authorization);
            if (!token) {
                return { success: false, message: "Não autenticado" };
            }
            const session = sessionStore.findByToken(token);
            if (!session || session.email !== ADMIN_EMAIL) {
                return { success: false, message: "Acesso negado" };
            }
            const users = await listUsersQuery.execute();
            return { success: true, users };
        } catch (e) {
            return { success: false, message: getErrorMessage(e) };
        }
    })
    
    .post("/api/admin/add-points-to-user", async ({ body, headers }) => {
        try {
            const token = extractToken(headers.authorization);
            if (!token) {
                return { success: false, message: "Não autenticado" };
            }
            const session = sessionStore.findByToken(token);
            if (!session || session.email !== ADMIN_EMAIL) {
                return { success: false, message: "Acesso negado" };
            }
            const { userId, amount } = body as { userId: string; amount: number };
            const result = await addPointsCommand.execute({ userId, amount });
            if (result.success) {
                return { success: true, newBalance: result.data?.newBalance };
            }
            return { success: false, message: "Erro ao adicionar pontos" };
        } catch (e) {
            return { success: false, message: getErrorMessage(e) };
        }
    })
    
    .post("/api/admin/remove-points-from-user", async ({ body, headers }) => {
        try {
            const token = extractToken(headers.authorization);
            if (!token) {
                return { success: false, message: "Não autenticado" };
            }
            const session = sessionStore.findByToken(token);
            if (!session || session.email !== ADMIN_EMAIL) {
                return { success: false, message: "Acesso negado" };
            }
            const { userId, amount } = body as { userId: string; amount: number };
            const result = await removePointsCommand.execute({ userId, amount });
            if (result.success) {
                return { success: true, newBalance: result.data?.newBalance };
            }
            return { success: false, message: "Erro ao remover pontos" };
        } catch (e) {
            return { success: false, message: getErrorMessage(e) };
        }
    })
    
    .get("/api/admin/stats", async ({ headers }) => {
        try {
            const token = extractToken(headers.authorization);
            if (!token) {
                return { success: false, message: "Não autenticado" };
            }
            const session = sessionStore.findByToken(token);
            if (!session || session.email !== ADMIN_EMAIL) {
                return { success: false, message: "Acesso negado" };
            }
            const users = await listUsersQuery.execute();
            const totalPoints = users.reduce((sum, u) => sum + u.points, 0);
            return { 
                success: true, 
                stats: {
                    totalUsers: users.length,
                    totalPoints,
                    topUser: users[0] || null
                }
            };
        } catch (e) {
            return { success: false, message: getErrorMessage(e) };
        }
    })
    
    .delete("/api/admin/users/:userId", async ({ params, headers }) => {
        try {
            const token = extractToken(headers.authorization);
            if (!token) {
                return { success: false, message: "Não autenticado" };
            }
            const session = sessionStore.findByToken(token);
            if (!session || session.email !== ADMIN_EMAIL) {
                return { success: false, message: "Acesso negado" };
            }
            const { userId } = params as { userId: string };
            await deleteUserUseCase.execute({ userId });
            return { success: true };
        } catch (e) {
            return { success: false, message: getErrorMessage(e) };
        }
    });

const PORT = parseInt(process.env.PORT || "3001");
app.listen(PORT);
console.log(`🦊 Server running at http://localhost:${PORT}`);
