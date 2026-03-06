import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  const res = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`);
  console.log(res.rows.map((r: any) => r.table_name).join('\n'));
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
