import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.ts";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
}

const isProduction = process.env.NODE_ENV === "production";
const ssl = isProduction ? "require" as const : false as const;

const client = postgres(connectionString, { 
    connect_timeout: 10,
    ssl,
    max: isProduction ? 20 : 5
});

export const db = drizzle(client, { schema });

export async function closeConnection() {
    await client.end();
}

export type Database = typeof db;
