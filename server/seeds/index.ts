import { db } from "../db";
import { globalAssumptions, marketResearch, properties, logos, userGroups, companies, propertyFeeCategories } from "@shared/schema";
import { seedUsers, seedUserGroups } from "./users";
import { seedGlobalAssumptions, seedProperties, seedFeeCategories, seedCanonicalProperties } from "./properties";
import { seedDefaultLogos, seedCompanies } from "./branding";
import { seedMissingMarketResearch, getHudsonEstateResearch, getEdenSummitResearch, getAustinHillsideResearch, getCasaMedellinResearch, getBlueRidgeResearch } from "./research";

export async function seed() {
  const forceReseed = process.argv.includes("--force");
  
  console.log("Starting database seed...");

  // Check if data already exists
  const existingGlobal = await db.select().from(globalAssumptions).limit(1);
  const existingProperties = await db.select().from(properties).limit(1);

  if (existingGlobal.length > 0 || existingProperties.length > 0) {
    if (forceReseed) {
      console.log("Force mode: Clearing existing data...");
      await db.delete(marketResearch);
      await db.delete(properties);
      await db.delete(globalAssumptions);
      console.log("Existing data cleared.");
    } else {
      console.log("Database already has data. Skipping seed to prevent duplicates.");
      console.log("To force re-seed, run: npx tsx server/seed.ts --force");
      return;
    }
  }

  // Seed admin user
  await seedUsers();

  // Seed global assumptions
  await seedGlobalAssumptions();

  // Seed properties
  await seedProperties();

  // Seed fee categories
  await seedFeeCategories();

  // Seed market research
  const seededProperties = await db.select().from(properties);
  const propertyMap: Record<string, number> = {};
  for (const p of seededProperties) {
    propertyMap[p.name] = p.id;
  }

  const marketResearchEntries = [
    {
      userId: null,
      type: "property",
      propertyId: propertyMap["The Hudson Estate"],
      title: "Market Research: The Hudson Estate",
      llmModel: "seed-data",
      content: getHudsonEstateResearch()
    },
    {
      userId: null,
      type: "property",
      propertyId: propertyMap["Eden Summit Lodge"],
      title: "Market Research: Eden Summit Lodge",
      llmModel: "seed-data",
      content: getEdenSummitResearch()
    },
    {
      userId: null,
      type: "property",
      propertyId: propertyMap["Austin Hillside"],
      title: "Market Research: Austin Hillside",
      llmModel: "seed-data",
      content: getAustinHillsideResearch()
    },
    {
      userId: null,
      type: "property",
      propertyId: propertyMap["Casa Medellín"],
      title: "Market Research: Casa Medellín",
      llmModel: "seed-data",
      content: getCasaMedellinResearch()
    },
    {
      userId: null,
      type: "property",
      propertyId: propertyMap["Blue Ridge Manor"],
      title: "Market Research: Blue Ridge Manor",
      llmModel: "seed-data",
      content: getBlueRidgeResearch()
    }
  ];
  await db.insert(marketResearch).values(marketResearchEntries);
  console.log(`Seeded market research for ${marketResearchEntries.length} properties`);

  // Seed branding & groups
  await seedDefaultLogos();
  await seedUserGroups();
  await seedCompanies();

  // Seed canonical properties
  await seedCanonicalProperties();

  console.log("Database seed completed successfully!");
}

export { 
  seedMissingMarketResearch, 
  seedDefaultLogos, 
  seedUserGroups, 
  seedCompanies 
};

// Re-export for getMarketResearchSeedData if needed (though it seems specific to seed.ts internal usage)
export function getMarketResearchSeedData(propertyMap: Record<string, number>) {
  return [
    {
      userId: null as number | null,
      type: "property",
      propertyId: propertyMap["The Hudson Estate"],
      title: "Market Research: The Hudson Estate",
      llmModel: "seed-data",
    },
    {
      userId: null as number | null,
      type: "property",
      propertyId: propertyMap["Eden Summit Lodge"],
      title: "Market Research: Eden Summit Lodge",
      llmModel: "seed-data",
    },
    {
      userId: null as number | null,
      type: "property",
      propertyId: propertyMap["Austin Hillside"],
      title: "Market Research: Austin Hillside",
      llmModel: "seed-data",
    },
    {
      userId: null as number | null,
      type: "property",
      propertyId: propertyMap["Casa Medellín"],
      title: "Market Research: Casa Medellín",
      llmModel: "seed-data",
    },
    {
      userId: null as number | null,
      type: "property",
      propertyId: propertyMap["Blue Ridge Manor"],
      title: "Market Research: Blue Ridge Manor",
      llmModel: "seed-data",
    },
  ];
}

