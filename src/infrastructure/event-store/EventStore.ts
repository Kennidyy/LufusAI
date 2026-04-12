import { db } from "../../../database/connection.ts";
import { events } from "../../../database/schema.ts";
import type { DomainEvent } from "../../domain/events/DomainEvents.ts";
import { logger } from "../../shared/logger/index.ts";

export interface EventStoreEntry {
    id: string;
    aggregateId: string;
    eventType: string;
    eventData: Record<string, unknown>;
    occurredAt: Date;
    version: number;
}

export class EventStore {
    private readonly log = logger.child({ service: "EventStore" });

    async append(event: DomainEvent): Promise<void> {
        this.log.debug("Appending event", { 
            eventType: event.eventType, 
            aggregateId: event.aggregateId 
        });

        await db.insert(events).values({
            id: event.eventId,
            aggregateId: event.aggregateId,
            eventType: event.eventType,
            eventData: event as unknown as Record<string, unknown>,
            occurredAt: event.occurredAt,
            version: event.version
        });
    }

    async appendMany(eventsList: DomainEvent[]): Promise<void> {
        if (eventsList.length === 0) return;

        this.log.debug("Appending events", { count: eventsList.length });

        const values = eventsList.map(e => ({
            id: e.eventId,
            aggregateId: e.aggregateId,
            eventType: e.eventType,
            eventData: e as unknown as Record<string, unknown>,
            occurredAt: e.occurredAt,
            version: e.version
        }));

        await db.insert(events).values(values);
    }

    async getEventsForAggregate(aggregateId: string): Promise<EventStoreEntry[]> {
        const results = await db
            .select()
            .from(events)
            .where(eq(events.aggregateId, aggregateId))
            .orderBy(events.occurredAt);

        return results.map(r => ({
            id: r.id,
            aggregateId: r.aggregateId,
            eventType: r.eventType,
            eventData: r.eventData as Record<string, unknown>,
            occurredAt: r.occurredAt,
            version: r.version
        }));
    }

    async getEventsByType(eventType: string): Promise<EventStoreEntry[]> {
        const results = await db
            .select()
            .from(events)
            .where(eq(events.eventType, eventType))
            .orderBy(events.occurredAt);

        return results.map(r => ({
            id: r.id,
            aggregateId: r.aggregateId,
            eventType: r.eventType,
            eventData: r.eventData as Record<string, unknown>,
            occurredAt: r.occurredAt,
            version: r.version
        }));
    }

    async getAllEvents(): Promise<EventStoreEntry[]> {
        const results = await db
            .select()
            .from(events)
            .orderBy(events.occurredAt);

        return results.map(r => ({
            id: r.id,
            aggregateId: r.aggregateId,
            eventType: r.eventType,
            eventData: r.eventData as Record<string, unknown>,
            occurredAt: r.occurredAt,
            version: r.version
        }));
    }

    async getLatestVersion(aggregateId: string): Promise<number> {
        const results = await db
            .select({ version: events.version })
            .from(events)
            .where(eq(events.aggregateId, aggregateId))
            .orderBy(events.version)
            .limit(1);

        return results.length > 0 ? results[0]!.version : 0;
    }
}

export const eventStore = new EventStore();

import { eq } from "drizzle-orm";
