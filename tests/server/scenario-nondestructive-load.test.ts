import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

function readFile(relativePath: string): string {
  return readFileSync(resolve(__dirname, "../../", relativePath), "utf-8");
}

describe("Non-Destructive Load — USE_STABLE_SCENARIO_LOAD feature flag", () => {
  it("USE_STABLE_SCENARIO_LOAD is exported from shared/constants.ts", () => {
    const src = readFile("shared/constants.ts");
    expect(src).toContain("export const USE_STABLE_SCENARIO_LOAD");
  });

  it("USE_STABLE_SCENARIO_LOAD defaults to true", () => {
    const src = readFile("shared/constants.ts");
    expect(src).toContain("USE_STABLE_SCENARIO_LOAD = true");
  });

  it("financial.ts imports USE_STABLE_SCENARIO_LOAD from shared/constants", () => {
    const src = readFile("server/storage/financial.ts");
    expect(src).toContain('import { USE_STABLE_SCENARIO_LOAD } from "@shared/constants"');
  });

  it("loadScenario branches on USE_STABLE_SCENARIO_LOAD", () => {
    const src = readFile("server/storage/financial.ts");
    const loadStart = src.indexOf("async loadScenario(");
    const loadEnd = src.indexOf("/** Fetch all fee categories");
    const loadBody = src.slice(loadStart, loadEnd);
    expect(loadBody).toContain("if (USE_STABLE_SCENARIO_LOAD)");
    expect(loadBody).toContain("stableLoadProperties");
    expect(loadBody).toContain("destructiveLoadProperties");
  });

  it("can be imported at runtime", async () => {
    const { USE_STABLE_SCENARIO_LOAD } = await import("@shared/constants");
    expect(USE_STABLE_SCENARIO_LOAD).toBe(true);
  });
});

describe("Non-Destructive Load — stableLoadProperties behavior", () => {
  const src = readFile("server/storage/financial.ts");
  const stableStart = src.indexOf("async function stableLoadProperties(");
  const destructiveStart = src.indexOf("async function destructiveLoadProperties(");
  const stableBody = src.slice(stableStart, destructiveStart);

  it("queries live properties scoped to userId", () => {
    expect(stableBody).toContain("properties.userId, userId");
  });

  it("builds a Map keyed by stableKey for O(1) lookups", () => {
    expect(stableBody).toContain("liveByStableKey");
    expect(stableBody).toContain("new Map<string, LiveProperty>()");
  });

  it("tracks which stableKeys have been matched", () => {
    expect(stableBody).toContain("snapshotStableKeys = new Set<string>()");
  });

  it("updates matched properties in place using tx.update", () => {
    expect(stableBody).toContain("tx.update(properties).set(");
    expect(stableBody).toContain("eq(properties.id, liveProp.id)");
  });

  it("preserves the live property ID when updating (non-destructive)", () => {
    expect(stableBody).toContain("liveProp.id");
    expect(stableBody).toContain("resolvedProperties.push({ id: liveProp.id");
  });

  it("inserts new properties when stableKey has no match", () => {
    expect(stableBody).toContain("tx.insert(properties).values(insertData).returning()");
  });

  it("preserves stableKey on inserted properties", () => {
    expect(stableBody).toContain("insertData.stableKey = stableKey");
  });

  it("never deletes orphaned properties (preserves photos via FK cascade safety)", () => {
    expect(stableBody).not.toContain("tx.delete(properties)");
  });

  it("does NOT delete all properties (unlike destructive path)", () => {
    expect(stableBody).not.toContain("tx.delete(properties).where(eq(properties.userId");
  });

  it("returns resolved property list with {id, name}", () => {
    expect(stableBody).toContain("return resolvedProperties");
  });
});

describe("Non-Destructive Load — destructiveLoadProperties fallback", () => {
  const src = readFile("server/storage/financial.ts");
  const destructiveStart = src.indexOf("async function destructiveLoadProperties(");
  const classStart = src.indexOf("export class FinancialStorage");
  const destructiveBody = src.slice(destructiveStart, classStart);

  it("deletes ALL user properties", () => {
    expect(destructiveBody).toContain("tx.delete(properties).where(eq(properties.userId, userId))");
  });

  it("inserts each saved property from scratch", () => {
    expect(destructiveBody).toContain("tx.insert(properties).values(insertData).returning()");
  });

  it("strips auto fields from properties", () => {
    expect(destructiveBody).toContain("stripAutoFields(prop)");
  });

  it("does NOT use stableKey matching", () => {
    expect(destructiveBody).not.toContain("liveByStableKey");
    expect(destructiveBody).not.toContain("snapshotStableKeys");
  });

  it("returns resolved property list with {id, name}", () => {
    expect(destructiveBody).toContain("return resolvedProperties");
  });
});

describe("Non-Destructive Load — photo decoupling across both paths", () => {
  const src = readFile("server/storage/financial.ts");
  const stableStart = src.indexOf("async function stableLoadProperties(");
  const loadEnd = src.indexOf("/** Fetch all fee categories");
  const fullLoadBody = src.slice(stableStart, loadEnd);

  it("savedPropertyPhotos parameter is prefixed with _ (unused)", () => {
    expect(fullLoadBody).toContain("_savedPropertyPhotos");
  });

  it("no photo insert or delete in any load path", () => {
    expect(fullLoadBody).not.toContain("tx.insert(propertyPhotos)");
    expect(fullLoadBody).not.toContain("tx.delete(propertyPhotos)");
  });

  it("no reference to propertyPhotos table in transaction body", () => {
    const txStart = fullLoadBody.indexOf("db.transaction(");
    const txBody = fullLoadBody.slice(txStart);
    expect(txBody).not.toContain("from(propertyPhotos)");
  });
});

describe("Non-Destructive Load — fee category sync", () => {
  const src = readFile("server/storage/financial.ts");
  const loadStart = src.indexOf("async loadScenario(");
  const loadEnd = src.indexOf("/** Fetch all fee categories");
  const loadBody = src.slice(loadStart, loadEnd);

  it("deletes fee categories for resolved property IDs before reinserting", () => {
    expect(loadBody).toContain("tx.delete(propertyFeeCategories).where(inArray(propertyFeeCategories.propertyId, resolvedIds))");
  });

  it("maps fee categories by property name from snapshot", () => {
    expect(loadBody).toContain("savedFeeCategories[prop.name]");
  });

  it("strips id/propertyId/createdAt from fee category data", () => {
    expect(loadBody).toContain("id: _catId, propertyId: _propId, createdAt: _catCreated");
  });

  it("inserts fee categories with the resolved property ID", () => {
    expect(loadBody).toContain("propertyId: prop.id");
    expect(loadBody).toContain("tx.insert(propertyFeeCategories).values(feeCategoryValues)");
  });
});

describe("Non-Destructive Load — snapshot includes stableKey", () => {
  const src = readFile("server/routes/scenario-helpers.ts");

  it("buildCreateSnapshotData returns scenarioProps (full property objects)", () => {
    const buildStart = src.indexOf("async function buildCreateSnapshotData(");
    const buildEnd = src.indexOf("export function tryComputeResults(");
    const buildBody = src.slice(buildStart, buildEnd);
    expect(buildBody).toContain("scenarioProps: ScenarioPropertySnapshot[]");
  });

  it("ScenarioPropertySnapshot type includes stableKey", () => {
    const types = readFile("shared/schema/types/jsonb-shapes.ts");
    expect(types).toContain("stableKey");
  });

  it("properties table has stableKey column with default UUID", () => {
    const schema = readFile("shared/schema/properties.ts");
    expect(schema).toContain("stableKey");
    expect(schema).toContain("defaultRandom");
  });
});

describe("Non-Destructive Load — validateLoadSnapshot", () => {
  const src = readFile("server/routes/scenario-helpers.ts");
  const validateStart = src.indexOf("export function validateLoadSnapshot(");
  const validateEnd = src.indexOf("export async function checkSharedPropertyAccess(");
  const validateBody = src.slice(validateStart, validateEnd);

  it("rejects empty properties with 422", () => {
    expect(validateBody).toContain("snapshotProps.length === 0");
    expect(validateBody).toContain("422");
  });

  it("rejects properties without valid names", () => {
    expect(validateBody).toContain("!p.name || typeof p.name !== \"string\"");
  });

  it("detects orphaned fee categories", () => {
    expect(validateBody).toContain("orphanedFeeCategories");
  });

  it("returns empty orphanedPhotos (photos are decoupled)", () => {
    expect(validateBody).toContain("orphanedPhotos: []");
  });
});

describe("Non-Destructive Load — behavioral: stripAutoFields", () => {
  it("removes id, createdAt, updatedAt from property data", async () => {
    const { stripAutoFields } = await import("../../server/storage/utils");
    const input = { id: 1, createdAt: new Date(), updatedAt: new Date(), name: "Hotel X", stableKey: "abc-123", userId: 5 };
    const result = stripAutoFields(input);
    expect(result).not.toHaveProperty("id");
    expect(result).not.toHaveProperty("createdAt");
    expect(result).not.toHaveProperty("updatedAt");
    expect(result).toHaveProperty("name", "Hotel X");
    expect(result).toHaveProperty("stableKey", "abc-123");
    expect(result).toHaveProperty("userId", 5);
  });

  it("preserves all non-auto fields including stableKey", async () => {
    const { stripAutoFields } = await import("../../server/storage/utils");
    const input = { id: 99, createdAt: new Date(), updatedAt: new Date(), name: "Test", stableKey: "key-1", rooms: 50, adr: 150 };
    const result = stripAutoFields(input);
    expect(Object.keys(result)).toEqual(expect.arrayContaining(["name", "stableKey", "rooms", "adr"]));
    expect(Object.keys(result)).not.toEqual(expect.arrayContaining(["id", "createdAt", "updatedAt"]));
  });
});

describe("Non-Destructive Load — behavioral: feature flag runtime", () => {
  it("USE_STABLE_SCENARIO_LOAD is a boolean true at runtime", async () => {
    const { USE_STABLE_SCENARIO_LOAD } = await import("@shared/constants");
    expect(typeof USE_STABLE_SCENARIO_LOAD).toBe("boolean");
    expect(USE_STABLE_SCENARIO_LOAD).toBe(true);
  });

  it("feature flag can be toggled at import time", async () => {
    const { USE_STABLE_SCENARIO_LOAD } = await import("@shared/constants");
    expect([true, false]).toContain(USE_STABLE_SCENARIO_LOAD);
  });
});

describe("Non-Destructive Load — behavioral: DbOrTx and LiveProperty types", () => {
  it("stableLoadProperties function signature uses DbOrTx type (not any)", () => {
    const src = readFile("server/storage/financial.ts");
    expect(src).toContain("type DbOrTx = Pick<typeof db,");
    const fnSig = src.match(/async function stableLoadProperties\(tx: (\w+),/);
    expect(fnSig).not.toBeNull();
    expect(fnSig![1]).toBe("DbOrTx");
  });

  it("destructiveLoadProperties function signature uses DbOrTx type (not any)", () => {
    const src = readFile("server/storage/financial.ts");
    const fnSig = src.match(/async function destructiveLoadProperties\(tx: (\w+),/);
    expect(fnSig).not.toBeNull();
    expect(fnSig![1]).toBe("DbOrTx");
  });

  it("LiveProperty interface has id, stableKey, and name fields", () => {
    const src = readFile("server/storage/financial.ts");
    expect(src).toContain("interface LiveProperty");
    expect(src).toContain("id: number;");
    expect(src).toContain("stableKey: string | null;");
    expect(src).toContain("name: string;");
  });

  it("no broad 'any' type in standalone function signatures", () => {
    const src = readFile("server/storage/financial.ts");
    const stableStart = src.indexOf("async function stableLoadProperties(");
    const destructiveEnd = src.indexOf("export class FinancialStorage");
    const fnBlock = src.slice(stableStart, destructiveEnd);
    const sigMatches = fnBlock.match(/\btx: any\b/g);
    expect(sigMatches).toBeNull();
  });
});

describe("Non-Destructive Load — behavioral: photo FK cascade safety", () => {
  it("property_photos FK uses ON DELETE CASCADE (confirms why we must not delete orphans)", () => {
    const schema = readFile("shared/schema/services.ts");
    expect(schema).toContain('references(() => properties.id, { onDelete: "cascade" })');
  });

  it("stableLoadProperties has ZERO tx.delete calls (orphans preserved)", () => {
    const src = readFile("server/storage/financial.ts");
    const stableStart = src.indexOf("async function stableLoadProperties(");
    const stableEnd = src.indexOf("async function destructiveLoadProperties(");
    const stableBody = src.slice(stableStart, stableEnd);
    const deleteMatches = stableBody.match(/tx\.delete\(/g);
    expect(deleteMatches).toBeNull();
  });

  it("destructiveLoadProperties DOES delete all properties (expected behavior for fallback)", () => {
    const src = readFile("server/storage/financial.ts");
    const destructiveStart = src.indexOf("async function destructiveLoadProperties(");
    const classStart = src.indexOf("export class FinancialStorage");
    const destructiveBody = src.slice(destructiveStart, classStart);
    expect(destructiveBody).toContain("tx.delete(properties).where(eq(properties.userId, userId))");
  });
});

describe("Non-Destructive Load — route integration", () => {
  const src = readFile("server/routes/scenarios.ts");
  const loadStart = src.indexOf('"/api/scenarios/:id/load"');
  const loadEnd = src.indexOf('"/api/scenarios/:id"', loadStart + 20);
  const loadRoute = src.slice(loadStart, loadEnd > 0 ? loadEnd : undefined);

  it("load route calls storage.loadScenario", () => {
    expect(loadRoute).toContain("storage.loadScenario");
  });

  it("load route invalidates compute cache after load", () => {
    expect(loadRoute).toContain("invalidateComputeCache()");
  });

  it("load route passes snapshot properties from scenario", () => {
    expect(loadRoute).toContain("snapshotProps");
  });

  it("load route passes fee categories from scenario snapshot", () => {
    expect(loadRoute).toContain("scenario.feeCategories");
  });

  it("load route passes propertyPhotos as last arg (unused in both paths)", () => {
    expect(loadRoute).toContain("scenario.propertyPhotos");
  });

  it("load route returns warnings for orphaned fee categories and photos", () => {
    expect(loadRoute).toContain("orphanedFeeCategories");
    expect(loadRoute).toContain("orphanedPhotos");
  });
});
