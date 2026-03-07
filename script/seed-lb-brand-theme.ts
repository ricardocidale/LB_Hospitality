/**
 * One-time script: Insert the "L+B Brand" theme derived from the app's index.css
 * CSS custom property values.
 *
 * Run: npx tsx scripts/seed-lb-brand-theme.ts
 */

import { db } from "../server/db";
import { designThemes } from "../shared/schema";
import { eq } from "drizzle-orm";

const THEME_NAME = "L+B Brand";

const LB_BRAND_THEME = {
  name: THEME_NAME,
  description:
    "The native application color system. Derived directly from the app's CSS custom properties — sage green primary, forest green secondary, warm cream backgrounds, and a charcoal sidebar. Earthy, natural, and trustworthy.",
  isDefault: true,
  colors: [
    // ── Palette colors ──────────────────────────────────────────────────────
    {
      rank: 1,
      name: "Sage Green",
      hexCode: "#9FBCA4",
      description:
        "PALETTE: Primary brand color. Drives action buttons, active nav items, focus rings, and key highlights. CSS: --primary (hsl 131 18% 68%)",
    },
    {
      rank: 2,
      name: "Forest Green",
      hexCode: "#257D41",
      description:
        "PALETTE: Deep secondary color for contrast elements, secondary buttons, and badges. CSS: --secondary (hsl 145 55% 31%)",
    },
    {
      rank: 3,
      name: "Warm Cream",
      hexCode: "#FFF9F5",
      description:
        "PALETTE: Page background and warm card surfaces. Creates a soft, welcoming canvas. CSS: --background (hsl 30 100% 98%)",
    },
    {
      rank: 4,
      name: "Charcoal",
      hexCode: "#3D3D3D",
      description:
        "PALETTE: Dark sidebar background, primary text foreground. Provides depth and contrast. CSS: --foreground / --sidebar (hsl 0 0% 24%)",
    },
    {
      rank: 5,
      name: "Warm Linen",
      hexCode: "#F5F2F0",
      description:
        "PALETTE: Muted surface color for secondary cards, table row alternates, and input backgrounds. CSS: --muted (hsl 30 20% 95%)",
    },
    {
      rank: 6,
      name: "Warm Border",
      hexCode: "#E5E0DC",
      description:
        "PALETTE: Subtle border and input outline color. Warm-toned to complement the cream background. CSS: --border (hsl 30 15% 88%)",
    },
    // ── Chart colors ─────────────────────────────────────────────────────────
    {
      rank: 1,
      name: "Sage",
      hexCode: "#9FBCA4",
      description:
        "CHART: Primary series — revenue, total income, and primary metrics. CSS: --chart-1",
    },
    {
      rank: 2,
      name: "Forest",
      hexCode: "#257D41",
      description:
        "CHART: Secondary series — NOI, net income, and profitability metrics. CSS: --chart-2",
    },
    {
      rank: 3,
      name: "Amethyst",
      hexCode: "#AF57DB",
      description:
        "CHART: Tertiary series — cash flow, EBITDA, and financial health metrics. CSS: --chart-3",
    },
    {
      rank: 4,
      name: "Amber",
      hexCode: "#D97706",
      description:
        "CHART: Quaternary series — expenses, cost metrics, and budget tracking. CSS: --chart-4",
    },
    {
      rank: 5,
      name: "Crimson",
      hexCode: "#EF4444",
      description:
        "CHART: Quinary series — alerts, shortfalls, and negative variance. CSS: --chart-5 / --destructive",
    },
  ],
};

async function main() {
  // Check if it already exists
  const existing = await db
    .select()
    .from(designThemes)
    .where(eq(designThemes.name, THEME_NAME));

  if (existing.length > 0) {
    console.log(`Theme "${THEME_NAME}" already exists (id=${existing[0].id}). Skipping.`);
    process.exit(0);
  }

  // Unset default on any existing default theme
  await db
    .update(designThemes)
    .set({ isDefault: false })
    .where(eq(designThemes.isDefault, true));

  // Insert the new theme
  const [inserted] = await db
    .insert(designThemes)
    .values(LB_BRAND_THEME)
    .returning();

  console.log(`✓ Created theme "${inserted.name}" (id=${inserted.id}) as default.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed L+B Brand theme:", err);
  process.exit(1);
});
