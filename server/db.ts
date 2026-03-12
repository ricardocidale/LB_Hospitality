import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  min: 2,
  idleTimeoutMillis: 60_000,
  connectionTimeoutMillis: 10_000,
  maxUses: 7500, // Recycle connections to prevent memory creep
});

pool.on("error", (err) => {
  console.error("[db] Unexpected pool error — connection will be replaced", err.message);
});

export const db = drizzle(pool, { schema });
