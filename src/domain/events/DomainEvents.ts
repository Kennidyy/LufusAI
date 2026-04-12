import type { IUuidGenerator } from "../value-objects/IUuidGenerator.ts";
import { EventType } from "./EventTypes.ts";

export interface DomainEvent {
    eventId: string;
    eventType: string;
    aggregateId: string;
    occurredAt: Date;
    version: number;
}

export abstract class AggregateRoot {
    protected domainEvents: DomainEvent[] = [];

    abstract get id(): string;
    abstract get version(): number;

    protected addDomainEvent(event: DomainEvent): void {
        this.domainEvents.push(event);
    }

    getDomainEvents(): DomainEvent[] {
        return [...this.domainEvents];
    }

    clearDomainEvents(): void {
        this.domainEvents = [];
    }
}

export class UserCreatedEvent implements DomainEvent {
    readonly eventId: string;
    readonly eventType = EventType.UserCreated;
    readonly occurredAt: Date;
    readonly version = 1;

    constructor(
        public readonly aggregateId: string,
        public readonly email: string,
        public readonly name: string,
        private readonly uuidGenerator: IUuidGenerator
    ) {
        this.eventId = uuidGenerator.generate();
        this.occurredAt = new Date();
    }
}

export class PointsAddedEvent implements DomainEvent {
    readonly eventId: string;
    readonly eventType = EventType.PointsAdded;
    readonly occurredAt: Date;
    readonly version = 1;

    constructor(
        public readonly aggregateId: string,
        public readonly points: number,
        public readonly newBalance: number,
        public readonly transactionId: string,
        private readonly uuidGenerator: IUuidGenerator
    ) {
        this.eventId = uuidGenerator.generate();
        this.occurredAt = new Date();
    }
}

export class PointsRemovedEvent implements DomainEvent {
    readonly eventId: string;
    readonly eventType = EventType.PointsRemoved;
    readonly occurredAt: Date;
    readonly version = 1;

    constructor(
        public readonly aggregateId: string,
        public readonly points: number,
        public readonly newBalance: number,
        public readonly transactionId: string,
        private readonly uuidGenerator: IUuidGenerator
    ) {
        this.eventId = uuidGenerator.generate();
        this.occurredAt = new Date();
    }
}

export class PointsTransferredEvent implements DomainEvent {
    readonly eventId: string;
    readonly eventType = EventType.PointsTransferred;
    readonly occurredAt: Date;
    readonly version = 1;

    constructor(
        public readonly aggregateId: string,
        public readonly recipientId: string,
        public readonly points: number,
        public readonly transactionId: string,
        private readonly uuidGenerator: IUuidGenerator
    ) {
        this.eventId = uuidGenerator.generate();
        this.occurredAt = new Date();
    }
}

export class UserDeletedEvent implements DomainEvent {
    readonly eventId: string;
    readonly eventType = EventType.UserDeleted;
    readonly occurredAt: Date;
    readonly version = 1;

    constructor(
        public readonly aggregateId: string,
        public readonly email: string,
        private readonly uuidGenerator: IUuidGenerator
    ) {
        this.eventId = uuidGenerator.generate();
        this.occurredAt = new Date();
    }
}
