import { seed } from "./seeds/index";
export * from "./seeds/index";
export * from "./seeds/users";
export * from "./seeds/properties";
export * from "./seeds/branding";
export * from "./seeds/research";

const isMain = process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js");

if (isMain) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
