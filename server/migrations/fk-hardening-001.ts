import { db } from "../db";
import { sql } from "drizzle-orm";
import { logger } from "../logger";

const TAG = "fk-hardening-001";

const FK_CONSTRAINTS = [
  `ALTER TABLE "companies" ADD CONSTRAINT "companies_logo_id_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "logos"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
  `ALTER TABLE "companies" ADD CONSTRAINT "companies_theme_id_design_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "design_themes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
  `ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
  `ALTER TABLE "users" ADD CONSTRAINT "users_user_group_id_user_groups_id_fk" FOREIGN KEY ("user_group_id") REFERENCES "user_groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
  `ALTER TABLE "users" ADD CONSTRAINT "users_selected_theme_id_design_themes_id_fk" FOREIGN KEY ("selected_theme_id") REFERENCES "design_themes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
  `ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_logo_id_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "logos"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
  `ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_theme_id_design_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "design_themes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
  `ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_asset_description_id_asset_descriptions_id_fk" FOREIGN KEY ("asset_description_id") REFERENCES "asset_descriptions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
  `ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
  `ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_alert_rule_id_alert_rules_id_fk" FOREIGN KEY ("alert_rule_id") REFERENCES "alert_rules"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
  `ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
];

export async function runFkHardening001(): Promise<void> {
  let applied = 0;
  let skipped = 0;

  for (const ddl of FK_CONSTRAINTS) {
    try {
      await db.execute(sql.raw(`DO $$ BEGIN ${ddl}; EXCEPTION WHEN duplicate_object THEN NULL; END $$`));
      applied++;
    } catch (error: unknown) {
      const pgCode = (error as { code?: string })?.code;
      if (pgCode === "42P01" || pgCode === "42703") {
        logger.warn(`[${TAG}] Skipped (missing table/column): ${ddl.slice(0, 80)}…`);
        skipped++;
      } else {
        logger.error(`[${TAG}] Failed: ${String(error)}`, TAG);
        throw error;
      }
    }
  }

  logger.info(`[${TAG}] FK hardening complete: ${applied} applied, ${skipped} skipped`);
}
