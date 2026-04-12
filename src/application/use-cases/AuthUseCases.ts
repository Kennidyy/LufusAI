import type { IUserRepository } from "../../domain/repositories/IUserRepository.ts";
import type { IPasswordHash } from "../../domain/value-objects/IPasswordHash.ts";
import { createSession, type SessionStore } from "../../shared/security/SessionManager.ts";
import { ValidationError } from "../../domain/errors/index.ts";

export interface LoginInput {
    email: string;
    password: string;
}

export interface LoginOutput {
    token: string;
    userId: string;
    email: string;
    name: string;
}

export class LoginUseCase {
    constructor(
        private userRepository: IUserRepository,
        private passwordHash: IPasswordHash,
        private sessionStore: SessionStore
    ) {}

    async execute(input: LoginInput): Promise<LoginOutput> {
        if (!input.email || !input.email.trim()) {
            throw new ValidationError("Email é obrigatório");
        }
        if (!input.password) {
            throw new ValidationError("Senha é obrigatória");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.email)) {
            throw new ValidationError("Email inválido");
        }

        const user = await this.userRepository.findByEmail(input.email.toLowerCase().trim());
        if (!user) {
            throw new ValidationError("Email ou senha incorretos");
        }

        const isValidPassword = await this.passwordHash.verify(input.password, user.password.value);
        if (!isValidPassword) {
            throw new ValidationError("Email ou senha incorretos");
        }

        const session = createSession(
            user.id.value,
            user.email.value,
            user.name.value
        );

        this.sessionStore.save(session);

        return {
            token: session.token,
            userId: session.userId,
            email: session.email,
            name: session.name
        };
    }
}

export class LogoutUseCase {
    constructor(private sessionStore: SessionStore) {}

    execute(token: string): void {
        this.sessionStore.delete(token);
    }
}

export class ValidateSessionUseCase {
    constructor(private sessionStore: SessionStore) {}

    execute(token: string) {
        if (!token) {
            throw new ValidationError("Token é obrigatório");
        }

        const session = this.sessionStore.findByToken(token);
        if (!session) {
            throw new ValidationError("Sessão expirada ou inválida");
        }

        return session;
    }
}

export class GetCurrentUserUseCase {
    constructor(private sessionStore: SessionStore) {}

    execute(token: string) {
        const session = this.sessionStore.findByToken(token);
        if (!session) {
            throw new ValidationError("Não autenticado");
        }

        return {
            userId: session.userId,
            email: session.email,
            name: session.name
        };
    }
}
