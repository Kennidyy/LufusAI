import type { IUserRepository } from "../../domain/repositories/IUserRepository.ts";
import type { IWalletRepository } from "../../domain/repositories/IWalletRepository.ts";
import type { IUuidGenerator } from "../../domain/value-objects/IUuidGenerator.ts";
import type { IEmailValidator } from "../../domain/value-objects/IEmailValidator.ts";
import type { IPasswordHash } from "../../domain/value-objects/IPasswordHash.ts";
import { eventStore } from "../../infrastructure/event-store/EventStore.ts";
import { 
    UserCreatedEvent, 
    PointsAddedEvent, 
    PointsRemovedEvent,
    PointsTransferredEvent,
    UserDeletedEvent 
} from "../../domain/events/DomainEvents.ts";
import { ValidationError, ConflictError, DomainError } from "../../domain/errors/index.ts";
import { logger } from "../../shared/logger/index.ts";

export interface CommandResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

export class CreateUserCommand {
    private readonly log = logger.child({ command: "CreateUserCommand" });

    constructor(
        private userRepository: IUserRepository,
        private walletRepository: IWalletRepository,
        private uuidGenerator: IUuidGenerator,
        private emailValidator: IEmailValidator,
        private passwordHash: IPasswordHash
    ) {}

    async execute(input: { email: string; password: string; name: string }): Promise<CommandResult<{ userId: string }>> {
        this.log.info("Executing CreateUserCommand", { email: input.email });

        if (!input.email?.trim()) {
            throw new ValidationError("Email é obrigatório");
        }
        if (!this.emailValidator.isValid(input.email)) {
            throw new ValidationError("Email inválido");
        }
        if (!input.password || input.password.length < 8) {
            throw new ValidationError("Senha deve ter pelo menos 8 caracteres");
        }
        if (!input.name?.trim()) {
            throw new ValidationError("Nome é obrigatório");
        }

        const existingUser = await this.userRepository.findByEmail(input.email.toLowerCase());
        if (existingUser) {
            throw new ConflictError(`Usuário com email '${input.email}' já existe`);
        }

        const { CreateUserUseCase } = await import("../use-cases/CreateUserUseCase.ts");
        const useCase = new CreateUserUseCase(
            this.userRepository, 
            this.walletRepository, 
            this.uuidGenerator, 
            this.emailValidator, 
            this.passwordHash
        );

        const result = await useCase.execute(input);

        const event = new UserCreatedEvent(
            result.user.id.value,
            result.user.email.value,
            result.user.name.value,
            this.uuidGenerator
        );
        await eventStore.append(event);

        this.log.info("User created via command", { userId: result.user.id.value });
        
        return { success: true, data: { userId: result.user.id.value } };
    }
}

export class AddPointsCommand {
    private readonly log = logger.child({ command: "AddPointsCommand" });

    constructor(
        private walletRepository: IWalletRepository,
        private uuidGenerator: IUuidGenerator
    ) {}

    async execute(input: { userId: string; amount: number }): Promise<CommandResult<{ newBalance: number }>> {
        this.log.info("Executing AddPointsCommand", { userId: input.userId, amount: input.amount });

        if (!input.userId) {
            throw new ValidationError("UserId é obrigatório");
        }
        if (!input.amount || input.amount <= 0) {
            throw new ValidationError("Quantidade deve ser positiva");
        }
        if (input.amount > 1000000) {
            throw new ValidationError("Quantidade máxima: 1.000.000");
        }

        const { AddPointsUseCase } = await import("../use-cases/AddPointsUseCase.ts");
        const useCase = new AddPointsUseCase(this.walletRepository, this.uuidGenerator);
        const result = await useCase.execute(input);

        const event = new PointsAddedEvent(
            input.userId,
            input.amount,
            result.wallet.points.value,
            crypto.randomUUID(),
            this.uuidGenerator
        );
        await eventStore.append(event);

        this.log.info("Points added via command", { userId: input.userId, amount: input.amount });

        return { success: true, data: { newBalance: result.wallet.points.value } };
    }
}

export class RemovePointsCommand {
    private readonly log = logger.child({ command: "RemovePointsCommand" });

    constructor(
        private walletRepository: IWalletRepository,
        private uuidGenerator: IUuidGenerator
    ) {}

    async execute(input: { userId: string; amount: number }): Promise<CommandResult<{ newBalance: number }>> {
        this.log.info("Executing RemovePointsCommand", { userId: input.userId, amount: input.amount });

        if (!input.userId) {
            throw new ValidationError("UserId é obrigatório");
        }
        if (!input.amount || input.amount <= 0) {
            throw new ValidationError("Quantidade deve ser positiva");
        }

        const { RemovePointsUseCase } = await import("../use-cases/RemovePointsUseCase.ts");
        const useCase = new RemovePointsUseCase(this.walletRepository, this.uuidGenerator);
        const result = await useCase.execute(input);

        const event = new PointsRemovedEvent(
            input.userId,
            input.amount,
            result.wallet.points.value,
            crypto.randomUUID(),
            this.uuidGenerator
        );
        await eventStore.append(event);

        this.log.info("Points removed via command", { userId: input.userId, amount: input.amount });

        return { success: true, data: { newBalance: result.wallet.points.value } };
    }
}

export class TransferPointsCommand {
    private readonly log = logger.child({ command: "TransferPointsCommand" });

    constructor(
        private walletRepository: IWalletRepository,
        private uuidGenerator: IUuidGenerator
    ) {}

    async execute(input: { fromUserId: string; toUserId: string; amount: number }): Promise<CommandResult<{ transactionId: string }>> {
        this.log.info("Executing TransferPointsCommand", input);

        if (!input.fromUserId || !input.toUserId) {
            throw new ValidationError("IDs dos usuários são obrigatórios");
        }
        if (input.fromUserId === input.toUserId) {
            throw new ValidationError("Não é possível transferir para si mesmo");
        }
        if (!input.amount || input.amount <= 0) {
            throw new ValidationError("Quantidade deve ser positiva");
        }

        const transactionId = crypto.randomUUID();

        const removeCommand = new RemovePointsCommand(this.walletRepository, this.uuidGenerator);
        await removeCommand.execute({ userId: input.fromUserId, amount: input.amount });

        const addCommand = new AddPointsCommand(this.walletRepository, this.uuidGenerator);
        await addCommand.execute({ userId: input.toUserId, amount: input.amount });

        const event = new PointsTransferredEvent(
            input.fromUserId,
            input.toUserId,
            input.amount,
            transactionId,
            this.uuidGenerator
        );
        await eventStore.append(event);

        this.log.info("Points transferred via command", input);

        return { success: true, data: { transactionId } };
    }
}

export class DeleteUserCommand {
    private readonly log = logger.child({ command: "DeleteUserCommand" });

    constructor(
        private userRepository: IUserRepository,
        private walletRepository: IWalletRepository,
        private uuidGenerator: IUuidGenerator
    ) {}

    async execute(input: { userId: string }): Promise<CommandResult> {
        this.log.info("Executing DeleteUserCommand", { userId: input.userId });

        if (!input.userId) {
            throw new ValidationError("UserId é obrigatório");
        }

        const user = await this.userRepository.findById(input.userId);
        if (!user) {
            throw new DomainError("Usuário não encontrado");
        }

        const { DeleteUserUseCase } = await import("../use-cases/DeleteUserUseCase.ts");
        const useCase = new DeleteUserUseCase(this.userRepository, this.walletRepository);
        await useCase.execute(input);

        const event = new UserDeletedEvent(input.userId, user.email.value, this.uuidGenerator);
        await eventStore.append(event);

        this.log.info("User deleted via command", { userId: input.userId });

        return { success: true };
    }
}
