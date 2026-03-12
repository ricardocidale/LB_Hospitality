import { db } from "../db";
import { sql } from "drizzle-orm";
import { logger } from "../logger";

const TAG = "plaid-001";

export async function runPlaid001(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS plaid_connections (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        user_id INTEGER NOT NULL,
        property_id INTEGER NOT NULL,
        institution_id TEXT NOT NULL,
        institution_name TEXT NOT NULL,
        access_token TEXT NOT NULL,
        item_id TEXT NOT NULL,
        cursor TEXT,
        status TEXT DEFAULT 'active',
        last_synced TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS plaid_connections_user_id_idx ON plaid_connections(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS plaid_connections_property_id_idx ON plaid_connections(property_id)`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS plaid_transactions (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        connection_id INTEGER NOT NULL,
        property_id INTEGER NOT NULL,
        plaid_transaction_id TEXT NOT NULL UNIQUE,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        name TEXT NOT NULL,
        merchant_name TEXT,
        category TEXT,
        usali_category TEXT,
        is_reconciled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS plaid_transactions_connection_id_idx ON plaid_transactions(connection_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS plaid_transactions_property_id_idx ON plaid_transactions(property_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS plaid_transactions_date_idx ON plaid_transactions(date)`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS plaid_categorization_cache (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        merchant_name TEXT NOT NULL,
        plaid_category TEXT,
        usali_category TEXT NOT NULL,
        confidence REAL DEFAULT 1.0,
        source TEXT DEFAULT 'manual',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    logger.info("Migration complete", TAG);
  } catch (error) {
    logger.error(`Migration failed: ${error}`, TAG);
  }
}
