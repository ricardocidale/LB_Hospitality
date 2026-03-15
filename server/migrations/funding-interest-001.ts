import { db } from "../db";
import { sql } from "drizzle-orm";
import { logger } from "../logger";

const TAG = "funding-interest-001";

export async function runFundingInterest001(): Promise<void> {
  try {
    await db.execute(sql`
      ALTER TABLE global_assumptions
      ADD COLUMN IF NOT EXISTS funding_interest_rate real NOT NULL DEFAULT 0
    `);

    await db.execute(sql`
      ALTER TABLE global_assumptions
      ADD COLUMN IF NOT EXISTS funding_interest_payment_frequency text NOT NULL DEFAULT 'accrues_only'
    `);

    logger.info(`[${TAG}] Funding interest columns added (or already existed)`);
  } catch (error: any) {
    logger.error(`[${TAG}] Migration failed: ${String(error)}`, TAG);
    throw error;
  }
}
