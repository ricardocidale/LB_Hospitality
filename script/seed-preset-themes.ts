/**
 * Seed preset design themes for the admin to choose from.
 * Idempotent — skips themes that already exist by name.
 *
 * Run: npx tsx script/seed-preset-themes.ts
 */

import { db } from "../server/db";
import { designThemes } from "../shared/schema";
import { eq } from "drizzle-orm";

interface PresetTheme {
  name: string;
  description: string;
  isDefault: boolean;
  colors: Array<{
    rank: number;
    name: string;
    hexCode: string;
    description: string;
  }>;
}

const PRESET_THEMES: PresetTheme[] = [
  {
    name: "Muted Sage",
    description:
      "Earthy, grounded palette with muted olive-sage tones. Warm neutrals and natural greens create a sophisticated, calming hospitality aesthetic.",
    isDefault: false,
    colors: [
      { rank: 1, name: "Olive Sage",     hexCode: "#8A9A7B", description: "PALETTE: Primary brand color. Muted olive-green for buttons, active nav, focus rings." },
      { rank: 2, name: "Deep Moss",      hexCode: "#4A5D3F", description: "PALETTE: Secondary accent. Deep forest moss for contrast badges and secondary elements." },
      { rank: 3, name: "Warm Sand",      hexCode: "#FAF6F1", description: "PALETTE: Background and card surfaces. Warm sandy cream for an inviting canvas." },
      { rank: 4, name: "Bark Brown",     hexCode: "#3B3832", description: "PALETTE: Foreground text. Deep brown-charcoal for readable, warm type." },
      { rank: 5, name: "Stone",          hexCode: "#EDEBE7", description: "PALETTE: Muted surfaces. Warm stone for secondary cards and table alternates." },
      { rank: 6, name: "Clay Border",    hexCode: "#D8D3CC", description: "PALETTE: Borders and input outlines. Subtle warm clay tone." },
      { rank: 1, name: "Sage",           hexCode: "#8A9A7B", description: "CHART: Primary series — revenue and key metrics." },
      { rank: 2, name: "Moss",           hexCode: "#4A5D3F", description: "CHART: Secondary series — net income and profitability." },
      { rank: 3, name: "Terracotta",     hexCode: "#C17853", description: "CHART: Tertiary series — warm contrast for cash flow data." },
      { rank: 4, name: "Wheat",          hexCode: "#C4A35A", description: "CHART: Quaternary series — expenses and budget metrics." },
      { rank: 5, name: "Dusty Rose",     hexCode: "#B07070", description: "CHART: Quinary series — alerts and negative variance." },
    ],
  },
  {
    name: "Midnight Navy",
    description:
      "Confident, professional palette built on deep navy blue. Cool neutrals and crisp white backgrounds convey trust, authority, and institutional quality.",
    isDefault: false,
    colors: [
      { rank: 1, name: "Navy",           hexCode: "#2C3E6B", description: "PALETTE: Primary brand color. Deep navy for buttons, active elements, and focus rings." },
      { rank: 2, name: "Royal Blue",     hexCode: "#1A2B5E", description: "PALETTE: Secondary accent. Darker indigo for badges and contrast elements." },
      { rank: 3, name: "Cool White",     hexCode: "#F8F9FC", description: "PALETTE: Background and card surfaces. Crisp cool-toned white." },
      { rank: 4, name: "Ink",            hexCode: "#1E293B", description: "PALETTE: Foreground text. Deep slate-ink for sharp, professional type." },
      { rank: 5, name: "Ice Gray",       hexCode: "#EFF1F5", description: "PALETTE: Muted surfaces. Cool ice gray for secondary cards and rows." },
      { rank: 6, name: "Steel Border",   hexCode: "#D1D5E0", description: "PALETTE: Borders and input outlines. Subtle cool-toned steel." },
      { rank: 1, name: "Navy",           hexCode: "#2C3E6B", description: "CHART: Primary series — revenue and key metrics." },
      { rank: 2, name: "Cobalt",         hexCode: "#3B82F6", description: "CHART: Secondary series — growth and income metrics." },
      { rank: 3, name: "Violet",         hexCode: "#7C3AED", description: "CHART: Tertiary series — cash flow and EBITDA." },
      { rank: 4, name: "Teal",           hexCode: "#0D9488", description: "CHART: Quaternary series — operations and costs." },
      { rank: 5, name: "Coral",          hexCode: "#F43F5E", description: "CHART: Quinary series — alerts and shortfalls." },
    ],
  },
  {
    name: "Warm Charcoal",
    description:
      "Warm, minimal palette with dark slate foundations. Sophisticated charcoal paired with warm off-white creates a modern editorial feel.",
    isDefault: false,
    colors: [
      { rank: 1, name: "Warm Slate",     hexCode: "#6B7280", description: "PALETTE: Primary brand color. Warm gray-slate for buttons, active nav, focus rings." },
      { rank: 2, name: "Graphite",       hexCode: "#374151", description: "PALETTE: Secondary accent. Deep graphite for contrast badges and emphasis." },
      { rank: 3, name: "Warm Ivory",     hexCode: "#FAFAF8", description: "PALETTE: Background and card surfaces. Warm ivory with a hint of cream." },
      { rank: 4, name: "Carbon",         hexCode: "#1F2937", description: "PALETTE: Foreground text. Deep carbon for high-contrast legible type." },
      { rank: 5, name: "Ash",            hexCode: "#F1F0EE", description: "PALETTE: Muted surfaces. Warm ash for secondary cards and table alternates." },
      { rank: 6, name: "Pewter",         hexCode: "#D6D3D1", description: "PALETTE: Borders and input outlines. Warm pewter tone." },
      { rank: 1, name: "Slate",          hexCode: "#6B7280", description: "CHART: Primary series — revenue and key metrics." },
      { rank: 2, name: "Steel",          hexCode: "#374151", description: "CHART: Secondary series — net income and margins." },
      { rank: 3, name: "Copper",         hexCode: "#B45309", description: "CHART: Tertiary series — warm accent for cash flow data." },
      { rank: 4, name: "Plum",           hexCode: "#7E22CE", description: "CHART: Quaternary series — expenses and variance." },
      { rank: 5, name: "Scarlet",        hexCode: "#DC2626", description: "CHART: Quinary series — alerts and negative metrics." },
    ],
  },
  {
    name: "Deep Teal",
    description:
      "Vibrant, aquatic palette centered on rich teal. Blue-green primary with clean white backgrounds evokes coastal luxury and contemporary design.",
    isDefault: false,
    colors: [
      { rank: 1, name: "Teal",           hexCode: "#0D7377", description: "PALETTE: Primary brand color. Rich teal for buttons, active states, focus rings." },
      { rank: 2, name: "Deep Ocean",     hexCode: "#065F5F", description: "PALETTE: Secondary accent. Deep ocean green for contrast and emphasis." },
      { rank: 3, name: "Seafoam White",  hexCode: "#F7FBFA", description: "PALETTE: Background and card surfaces. Clean white with a cool aqua hint." },
      { rank: 4, name: "Dark Slate",     hexCode: "#1A2F2F", description: "PALETTE: Foreground text. Dark teal-slate for cohesive type." },
      { rank: 5, name: "Mist",           hexCode: "#EEF4F3", description: "PALETTE: Muted surfaces. Cool mist for secondary cards and rows." },
      { rank: 6, name: "Sea Glass",      hexCode: "#CADBD8", description: "PALETTE: Borders and input outlines. Subtle sea glass tone." },
      { rank: 1, name: "Teal",           hexCode: "#0D7377", description: "CHART: Primary series — revenue and key metrics." },
      { rank: 2, name: "Deep Ocean",     hexCode: "#065F5F", description: "CHART: Secondary series — profitability and margins." },
      { rank: 3, name: "Coral",          hexCode: "#F97316", description: "CHART: Tertiary series — warm contrast for cash flow." },
      { rank: 4, name: "Cyan",           hexCode: "#06B6D4", description: "CHART: Quaternary series — operations and costs." },
      { rank: 5, name: "Rose",           hexCode: "#E11D48", description: "CHART: Quinary series — alerts and shortfalls." },
    ],
  },
  {
    name: "Steel Blue",
    description:
      "Soft, approachable palette with cool steel-blue tones. Professional yet gentle — ideal for financial dashboards that need to feel accessible.",
    isDefault: false,
    colors: [
      { rank: 1, name: "Steel Blue",     hexCode: "#6889A8", description: "PALETTE: Primary brand color. Soft steel blue for buttons, active nav, focus rings." },
      { rank: 2, name: "Denim",          hexCode: "#3D5A80", description: "PALETTE: Secondary accent. Deep denim for contrast badges and secondary elements." },
      { rank: 3, name: "Cloud White",    hexCode: "#F9FAFB", description: "PALETTE: Background and card surfaces. Clean neutral cloud white." },
      { rank: 4, name: "Dark Blue",      hexCode: "#293241", description: "PALETTE: Foreground text. Deep blue-black for professional readability." },
      { rank: 5, name: "Fog",            hexCode: "#EDF0F4", description: "PALETTE: Muted surfaces. Cool fog for secondary cards and table rows." },
      { rank: 6, name: "Silver",         hexCode: "#CDD5DE", description: "PALETTE: Borders and input outlines. Subtle silver-blue tone." },
      { rank: 1, name: "Steel",          hexCode: "#6889A8", description: "CHART: Primary series — revenue and key metrics." },
      { rank: 2, name: "Denim",          hexCode: "#3D5A80", description: "CHART: Secondary series — net income and profitability." },
      { rank: 3, name: "Marigold",       hexCode: "#E9A23B", description: "CHART: Tertiary series — warm accent for cash flow." },
      { rank: 4, name: "Emerald",        hexCode: "#059669", description: "CHART: Quaternary series — operations and cost metrics." },
      { rank: 5, name: "Crimson",        hexCode: "#EF4444", description: "CHART: Quinary series — alerts and negative variance." },
    ],
  },
];

async function main() {
  let created = 0;
  let skipped = 0;

  for (const theme of PRESET_THEMES) {
    const existing = await db
      .select()
      .from(designThemes)
      .where(eq(designThemes.name, theme.name));

    if (existing.length > 0) {
      console.log(`  skip  "${theme.name}" (already exists, id=${existing[0].id})`);
      skipped++;
      continue;
    }

    const [inserted] = await db
      .insert(designThemes)
      .values(theme)
      .returning();

    console.log(`  ✓     "${inserted.name}" (id=${inserted.id})`);
    created++;
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed preset themes:", err);
  process.exit(1);
});
