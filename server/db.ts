import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import {
  DB_POOL_MAX_CONNECTIONS,
  DB_POOL_MIN_CONNECTIONS,
  DB_IDLE_TIMEOUT_MS,
  DB_CONNECTION_TIMEOUT_MS,
  DB_CONNECTION_MAX_USES,
} from "./constants";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: DB_POOL_MAX_CONNECTIONS,
  min: DB_POOL_MIN_CONNECTIONS,
  idleTimeoutMillis: DB_IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: DB_CONNECTION_TIMEOUT_MS,
  maxUses: DB_CONNECTION_MAX_USES,
});

pool.on("error", (err) => {
  console.error("[db] Unexpected pool error — connection will be replaced", err.message);
});

export const db = drizzle(pool, { schema });
