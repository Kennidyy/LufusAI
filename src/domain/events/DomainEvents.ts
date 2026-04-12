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
    readonly eventType = "UserCreated";
    readonly occurredAt: Date;
    readonly version = 1;

    constructor(
        public readonly aggregateId: string,
        public readonly email: string,
        public readonly name: string
    ) {
        this.eventId = crypto.randomUUID();
        this.occurredAt = new Date();
    }
}

export class PointsAddedEvent implements DomainEvent {
    readonly eventId: string;
    readonly eventType = "PointsAdded";
    readonly occurredAt: Date;
    readonly version = 1;

    constructor(
        public readonly aggregateId: string,
        public readonly points: number,
        public readonly newBalance: number,
        public readonly transactionId: string
    ) {
        this.eventId = crypto.randomUUID();
        this.occurredAt = new Date();
    }
}

export class PointsRemovedEvent implements DomainEvent {
    readonly eventId: string;
    readonly eventType = "PointsRemoved";
    readonly occurredAt: Date;
    readonly version = 1;

    constructor(
        public readonly aggregateId: string,
        public readonly points: number,
        public readonly newBalance: number,
        public readonly transactionId: string
    ) {
        this.eventId = crypto.randomUUID();
        this.occurredAt = new Date();
    }
}

export class PointsTransferredEvent implements DomainEvent {
    readonly eventId: string;
    readonly eventType = "PointsTransferred";
    readonly occurredAt: Date;
    readonly version = 1;

    constructor(
        public readonly aggregateId: string,
        public readonly recipientId: string,
        public readonly points: number,
        public readonly transactionId: string
    ) {
        this.eventId = crypto.randomUUID();
        this.occurredAt = new Date();
    }
}

export class UserDeletedEvent implements DomainEvent {
    readonly eventId: string;
    readonly eventType = "UserDeleted";
    readonly occurredAt: Date;
    readonly version = 1;

    constructor(
        public readonly aggregateId: string,
        public readonly email: string
    ) {
        this.eventId = crypto.randomUUID();
        this.occurredAt = new Date();
    }
}
