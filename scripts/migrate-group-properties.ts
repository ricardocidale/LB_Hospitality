import { db } from "../server/db";

async function main() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_group_properties (
      user_group_id INTEGER NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
      property_id   INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      PRIMARY KEY (user_group_id, property_id)
    )
  `);
  console.log("user_group_properties table created.");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
