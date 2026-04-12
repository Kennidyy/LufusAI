import type { IUserRepository } from "../../domain/repositories/IUserRepository.ts";
import type { IWalletRepository } from "../../domain/repositories/IWalletRepository.ts";
import { eventStore, type EventStoreEntry } from "../../infrastructure/event-store/EventStore.ts";
import { ValidationError } from "../../domain/errors/index.ts";
import { logger } from "../../shared/logger/index.ts";

export interface UserProjection {
    id: string;
    email: string;
    name: string;
    points: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface TransactionHistory {
    transactionId: string;
    type: "ADDED" | "REMOVED" | "TRANSFERRED";
    amount: number;
    balance: number;
    otherParty?: string;
    occurredAt: Date;
}

export interface UserSummary {
    id: string;
    name: string;
    email: string;
    points: number;
}

export class GetUserQuery {
    private readonly log = logger.child({ query: "GetUserQuery" });

    constructor(
        private userRepository: IUserRepository,
        private walletRepository: IWalletRepository
    ) {}

    async execute(userId: string): Promise<UserProjection | null> {
        this.log.debug("Executing GetUserQuery", { userId });

        if (!userId) {
            throw new ValidationError("UserId é obrigatório");
        }

        const user = await this.userRepository.findById(userId);
        if (!user) {
            return null;
        }

        const wallet = await this.walletRepository.findByUserId(userId);

        return {
            id: user.id.value,
            email: user.email.value,
            name: user.name.value,
            points: wallet?.points.value || 0,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }
}

export class ListUsersQuery {
    private readonly log = logger.child({ query: "ListUsersQuery" });

    constructor(
        private userRepository: IUserRepository,
        private walletRepository: IWalletRepository
    ) {}

    async execute(): Promise<UserSummary[]> {
        this.log.debug("Executing ListUsersQuery");

        const users = await this.userRepository.findAll();
        
        const summaries: UserSummary[] = [];
        
        for (const user of users) {
            const wallet = await this.walletRepository.findByUserId(user.id.value);
            summaries.push({
                id: user.id.value,
                name: user.name.value,
                email: user.email.value,
                points: wallet?.points.value || 0
            });
        }

        return summaries;
    }
}

export class GetBalanceQuery {
    private readonly log = logger.child({ query: "GetBalanceQuery" });

    constructor(private walletRepository: IWalletRepository) {}

    async execute(userId: string): Promise<{ userId: string; balance: number }> {
        this.log.debug("Executing GetBalanceQuery", { userId });

        if (!userId) {
            throw new ValidationError("UserId é obrigatório");
        }

        const wallet = await this.walletRepository.findByUserId(userId);
        
        return {
            userId,
            balance: wallet?.points.value || 0
        };
    }
}

export class GetTransactionHistoryQuery {
    private readonly log = logger.child({ query: "GetTransactionHistoryQuery" });

    constructor(private userRepository: IUserRepository) {}

    async execute(userId: string): Promise<TransactionHistory[]> {
        this.log.debug("Executing GetTransactionHistoryQuery", { userId });

        if (!userId) {
            throw new ValidationError("UserId é obrigatório");
        }

        const events = await eventStore.getEventsForAggregate(userId);
        
        const transactions: TransactionHistory[] = [];
        
        for (const event of events) {
            const data = event.eventData as Record<string, unknown>;
            
            if (event.eventType === "PointsAdded") {
                transactions.push({
                    transactionId: data.transactionId as string,
                    type: "ADDED",
                    amount: data.points as number,
                    balance: data.newBalance as number,
                    occurredAt: event.occurredAt
                });
            } else if (event.eventType === "PointsRemoved") {
                transactions.push({
                    transactionId: data.transactionId as string,
                    type: "REMOVED",
                    amount: data.points as number,
                    balance: data.newBalance as number,
                    occurredAt: event.occurredAt
                });
            } else if (event.eventType === "PointsTransferred") {
                if (data.aggregateId === userId) {
                    transactions.push({
                        transactionId: data.transactionId as string,
                        type: "TRANSFERRED",
                        amount: data.points as number,
                        balance: 0,
                        otherParty: data.recipientId as string,
                        occurredAt: event.occurredAt
                    });
                }
            }
        }

        return transactions.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
    }
}

export class GetAllTransactionsQuery {
    private readonly log = logger.child({ query: "GetAllTransactionsQuery" });

    constructor() {}

    async execute(limit: number = 100): Promise<EventStoreEntry[]> {
        this.log.debug("Executing GetAllTransactionsQuery", { limit });

        const events = await eventStore.getAllEvents();
        return events.slice(-limit);
    }
}

export class GetLeaderboardQuery {
    private readonly log = logger.child({ query: "GetLeaderboardQuery" });

    constructor(
        private userRepository: IUserRepository,
        private walletRepository: IWalletRepository
    ) {}

    async execute(limit: number = 10): Promise<UserSummary[]> {
        this.log.debug("Executing GetLeaderboardQuery", { limit });

        const listQuery = new ListUsersQuery(this.userRepository, this.walletRepository);
        const users = await listQuery.execute();
        
        return users
            .sort((a, b) => b.points - a.points)
            .slice(0, limit);
    }
}
