import { db } from "../db";
import { logos, companies } from "@shared/schema";

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
      companyName: "Norfolk Group",
      url: "/logos/norfolk-ai-blue.png",
      isDefault: false,
    },
    {
      name: "Norfolk AI - Yellow",
      companyName: "Norfolk Group",
      url: "/logos/norfolk-ai-yellow.png",
      isDefault: false,
    },
    {
      name: "Norfolk AI - Wireframe",
      companyName: "Norfolk Group",
      url: "/logos/norfolk-ai-wireframe.png",
      isDefault: false,
    },
  ]);
  console.log("Seeded default logos: HBG (default) + 3 Norfolk AI variants");
}

export async function seedCompanies() {
  const existing = await db.select().from(companies).limit(1);
  if (existing.length > 0) return;

  const companiesToSeed = [
    { name: "Hospitality Business Group", type: "management" as const, description: "Management company overseeing all hotel SPVs" },
    { name: "HBG Property 1 LLC", type: "spv" as const, description: "SPV for first hotel property" },
    { name: "HBG Property 2 LLC", type: "spv" as const, description: "SPV for second hotel property" },
  ];

  for (const c of companiesToSeed) {
    await db.insert(companies).values(c);
  }
  console.log("Seeded default companies");
}
