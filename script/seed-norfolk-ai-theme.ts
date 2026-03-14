/**
 * One-time script: Insert the "Norfolk AI" theme.
 *
 * Run: npx tsx script/seed-norfolk-ai-theme.ts
 */

import { db } from "../server/db";
import { designThemes } from "../shared/schema";
import { eq } from "drizzle-orm";

const THEME_NAME = "Norfolk AI";

const NORFOLK_AI_THEME = {
  name: THEME_NAME,
  description:
    "A bold, modern AI brand palette. Navy primary with salmon, yellow gold, and teal accents — confident, tech-forward, and warm.",
  isDefault: false,
  colors: [
    // ── Palette colors ──────────────────────────────────────────────────────
    {
      rank: 1,
      name: "Navy",
      hexCode: "#1B2A4A",
      description:
        "PALETTE: Primary brand color. Drives action buttons, active nav items, focus rings, and key highlights.",
    },
    {
      rank: 2,
      name: "Salmon",
      hexCode: "#E8735A",
      description:
        "PALETTE: Warm accent for CTAs, notifications, and attention-drawing elements.",
    },
    {
      rank: 3,
      name: "Yellow Gold",
      hexCode: "#F2C94C",
      description:
        "PALETTE: Bright accent for highlights, badges, and status indicators.",
    },
    {
      rank: 4,
      name: "Teal",
      hexCode: "#2A9D8F",
      description:
        "PALETTE: Cool accent for secondary actions, links, and success states.",
    },
    {
      rank: 5,
      name: "Ice White",
      hexCode: "#F5F7FA",
      description:
        "PALETTE: Page background and card surfaces. Clean, cool canvas.",
    },
    // ── Chart colors ─────────────────────────────────────────────────────────
    {
      rank: 1,
      name: "Navy",
      hexCode: "#1B2A4A",
      description:
        "CHART: Primary series — revenue, total income, and primary metrics.",
    },
    {
      rank: 2,
      name: "Salmon",
      hexCode: "#E8735A",
      description:
        "CHART: Secondary series — NOI, net income, and profitability metrics.",
    },
    {
      rank: 3,
      name: "Teal",
      hexCode: "#2A9D8F",
      description:
        "CHART: Tertiary series — cash flow, EBITDA, and financial health metrics.",
    },
    {
      rank: 4,
      name: "Yellow Gold",
      hexCode: "#F2C94C",
      description:
        "CHART: Quaternary series — expenses, cost metrics, and budget tracking.",
    },
    {
      rank: 5,
      name: "Crimson",
      hexCode: "#EF4444",
      description:
        "CHART: Quinary series — alerts, shortfalls, and negative variance.",
    },
  ],
};

async function main() {
  const existing = await db
    .select()
    .from(designThemes)
    .where(eq(designThemes.name, THEME_NAME));

  if (existing.length > 0) {
    console.log(`Theme "${THEME_NAME}" already exists (id=${existing[0].id}). Updating…`);
    await db
      .update(designThemes)
      .set({
        description: NORFOLK_AI_THEME.description,
        colors: NORFOLK_AI_THEME.colors,
        isDefault: NORFOLK_AI_THEME.isDefault,
      })
      .where(eq(designThemes.name, THEME_NAME));
    console.log(`✓ Updated theme "${THEME_NAME}".`);
    process.exit(0);
  }

  const [inserted] = await db
    .insert(designThemes)
    .values(NORFOLK_AI_THEME)
    .returning();

  console.log(`✓ Created theme "${inserted.name}" (id=${inserted.id}).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed Norfolk AI theme:", err);
  process.exit(1);
});
