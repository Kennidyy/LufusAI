import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, pgPolicy } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: text("password").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const wallets = pgTable("wallets", {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    points: integer("points").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const events = pgTable("events", {
    id: uuid("id").primaryKey(),
    aggregateId: uuid("aggregate_id").notNull(),
    eventType: varchar("event_type", { length: 255 }).notNull(),
    eventData: jsonb("event_data").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    version: integer("version").notNull().default(1)
});

export type UserTable = typeof users.$inferSelect;
export type NewUserTable = typeof users.$inferInsert;
export type WalletTable = typeof wallets.$inferSelect;
export type NewWalletTable = typeof wallets.$inferInsert;
export type EventTable = typeof events.$inferSelect;
export type NewEventTable = typeof events.$inferInsert;
