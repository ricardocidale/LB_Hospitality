import { db } from "../db";
import { eq } from "drizzle-orm";
import { logos, companies, designThemes, properties } from "@shared/schema";
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

  if (existing.length > 0) {
    // Companies already exist — only ensure "General" exists (required by system).
    // Do NOT re-create user-deleted companies on restart.
    if (!existingNames.has("General")) {
      await db.insert(companies).values({ name: "General", type: "spv", description: "Default catch-all company", themeId: defaultThemeId });
      logger.info("Re-created required 'General' company", "seed");
    }
  } else {
    // First-time setup: seed all initial companies
    const allProperties = await db.select({ id: properties.id, name: properties.name }).from(properties);

    const spvMapping: Record<string, string> = {
      "Jano Grande Ranch": "Jano Grande Ranch LLC",
      "Loch Sheldrake": "Loch Sheldrake LLC",
      "Belleayre Mountain": "Belleayre Mountain LLC",
      "Scott's House": "Scott's House LLC",
      "Lakeview Haven Lodge": "Lakeview Haven Lodge LLC",
      "San Diego": "San Diego Boutique LLC",
      "The Hudson Estate": "The Hudson Estate LLC",
      "Eden Summit Lodge": "Eden Summit Lodge LLC",
      "Austin Hillside": "Austin Hillside LLC",
      "Casa Medellín": "Casa Medellín LLC",
      "Blue Ridge Manor": "Blue Ridge Manor LLC",
    };

    const companiesToSeed = [
      { name: "Hospitality Business Group", type: "management" as const, description: "Management company overseeing all hotel SPVs" },
      { name: "The Norfolk AI Group", type: "management" as const, description: "AI-powered hospitality technology and management group based in Norfolk, VA" },
      { name: "KIT Capital", type: "management" as const, description: "Investment and capital management firm" },
      { name: "Numeratti Endeavors", type: "management" as const, description: "Strategic investment ventures" },
      { name: "HBG Property 1 LLC", type: "spv" as const, description: "SPV for first hotel property" },
      { name: "HBG Property 2 LLC", type: "spv" as const, description: "SPV for second hotel property" },
      { name: "General", type: "spv" as const, description: "Default catch-all company" },
    ];

    for (const prop of allProperties) {
      const spvName = spvMapping[prop.name];
      if (spvName && !companiesToSeed.some(c => c.name === spvName)) {
        companiesToSeed.push({
          name: spvName,
          type: "spv" as const,
          description: `SPV entity for ${prop.name} property`,
        });
      }
    }

    for (const c of companiesToSeed) {
      await db.insert(companies).values({ ...c, themeId: defaultThemeId });
    }
    logger.info(`Seeded ${companiesToSeed.length} companies including Norfolk AI SPVs (themeId=${defaultThemeId})`, "seed");
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
  const [defaultLogo] = await db.select().from(logos).where(eq(logos.isDefault, true));
  if (defaultLogo) {
    let assigned = 0;
    for (const c of allCompanies) {
      if (c.logoId) continue;
      await db.update(companies).set({ logoId: defaultLogo.id }).where(eq(companies.id, c.id));
      assigned++;
    }
    if (assigned > 0) {
      logger.info(`Assigned default logo to ${assigned} companies without logos`, "seed");
    }
  }
}
