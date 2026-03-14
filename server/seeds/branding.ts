import { db } from "../db";
import { eq } from "drizzle-orm";
import { logos, companies, designThemes } from "@shared/schema";
import { logger } from "../logger";

export async function seedDefaultLogos() {
  const existingLogos = await db.select().from(logos);
  if (existingLogos.length > 0) return;

  await db.insert(logos).values([
    {
      name: "Hospitality Business Group",
      companyName: "Hospitality Business Group",
      url: "/logos/default-hbg.png",
      isDefault: true,
    },
    {
      name: "Norfolk AI - Blue",
      companyName: "The Norfolk AI Group",
      url: "/logos/norfolk-ai-blue.png",
      isDefault: false,
    },
    {
      name: "Norfolk AI - Yellow",
      companyName: "The Norfolk AI Group",
      url: "/logos/norfolk-ai-yellow.png",
      isDefault: false,
    },
    {
      name: "Norfolk AI - Wireframe",
      companyName: "The Norfolk AI Group",
      url: "/logos/norfolk-ai-wireframe.png",
      isDefault: false,
    },
  ]);
  logger.info("Seeded default logos: HBG (default) + 3 Norfolk AI variants", "seed");
}

export async function seedCompanies() {
  const [defaultTheme] = await db.select().from(designThemes).where(eq(designThemes.isDefault, true));
  const defaultThemeId = defaultTheme?.id ?? null;

  const existing = await db.select().from(companies);
  const existingNames = new Set(existing.map(c => c.name));

  const companiesToSeed = [
    { name: "Hospitality Business Group", type: "management" as const, description: "Management company overseeing all hotel SPVs" },
    { name: "The Norfolk AI Group", type: "management" as const, description: "AI-powered hospitality technology group" },
    { name: "KIT Capital", type: "management" as const, description: "Investment and capital management firm" },
    { name: "Numeratti Endeavors", type: "management" as const, description: "Strategic investment ventures" },
    { name: "HBG Property 1 LLC", type: "spv" as const, description: "SPV for first hotel property" },
    { name: "HBG Property 2 LLC", type: "spv" as const, description: "SPV for second hotel property" },
    { name: "General", type: "spv" as const, description: "Default catch-all company" },
  ];

  let added = 0;
  for (const c of companiesToSeed) {
    if (!existingNames.has(c.name)) {
      await db.insert(companies).values({ ...c, themeId: defaultThemeId });
      added++;
    }
  }
  if (added > 0) {
    logger.info(`Seeded ${added} new companies (themeId=${defaultThemeId})`, "seed");
  }

  if (defaultThemeId) {
    const needsUpdate = existing.filter(c => c.themeId !== defaultThemeId);
    for (const c of needsUpdate) {
      await db.update(companies).set({ themeId: defaultThemeId }).where(eq(companies.id, c.id));
    }
    if (needsUpdate.length > 0) {
      logger.info(`Assigned default theme to ${needsUpdate.length} existing companies`, "seed");
    }
  }

  const allCompanies = await db.select().from(companies);
  const allLogos = await db.select().from(logos);
  const logosById = new Map(allLogos.map(l => [l.id, l]));
  let logosCreated = 0;
  for (const c of allCompanies) {
    if (c.logoId && logosById.has(c.logoId)) continue;
    const logoUrl = `/api/letter-logo/${encodeURIComponent(c.name)}`;
    const [logo] = await db.insert(logos).values({ name: c.name, companyName: c.name, url: logoUrl, isDefault: false }).returning();
    await db.update(companies).set({ logoId: logo.id }).where(eq(companies.id, c.id));
    logosCreated++;
  }
  if (logosCreated > 0) {
    logger.info(`Created ${logosCreated} letter logos for companies without logos`, "seed");
  }
}
