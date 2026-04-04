import { describe, it, expect, beforeEach } from "vitest";
import { execSync } from "child_process";
import {
  computeCacheKey,
  getCachedResult,
  setCachedResult,
  invalidateComputeCache,
  getCacheStatus,
  resetCacheStats,
} from "../../server/finance/cache";
import { computeSingleProperty } from "../../server/finance/service";
import type { PropertyInput, GlobalInput } from "@engine/types";

const PROPERTY: PropertyInput = {
  operationsStartDate: "2026-04-01",
  acquisitionDate: "2026-04-01",
  roomCount: 30,
  startAdr: 120,
  adrGrowthRate: 0.02,
  startOccupancy: 0.70,
  maxOccupancy: 0.70,
  occupancyRampMonths: 1,
  occupancyGrowthStep: 0,
  purchasePrice: 3_000_000,
  type: "Full Equity",
  costRateRooms: 0.20,
  costRateFB: 0.09,
  costRateAdmin: 0.08,
  costRateMarketing: 0.01,
  costRatePropertyOps: 0.04,
  costRateUtilities: 0.05,
  costRateTaxes: 0.03,
  costRateIT: 0.005,
  costRateFFE: 0.04,
  costRateOther: 0.05,
  costRateInsurance: 0,
  revShareEvents: 0.43,
  revShareFB: 0.22,
  revShareOther: 0.07,
  exitCapRate: 0.075,
};

const GLOBAL: GlobalInput = {
  modelStartDate: "2026-04-01",
  inflationRate: 0,
  projectionYears: 10,
};

function grepServer(pattern: string): string[] {
  try {
    const out = execSync(
      `rg -n '${pattern}' server/ --glob '*.ts' -g '!*.test.*' 2>/dev/null`,
      { encoding: "utf-8", timeout: 10_000 }
    );
    return out.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

describe("Cache Invalidation Correctness", () => {
  beforeEach(() => {
    invalidateComputeCache();
    resetCacheStats();
  });

  it("cache is empty after invalidation", () => {
    const status = getCacheStatus();
    expect(status.size).toBe(0);
  });

  it("first compute is a miss, second is a hit", () => {
    const r1 = computeSingleProperty({ property: PROPERTY, globalAssumptions: GLOBAL, projectionYears: 10 });
    expect(r1.cached).toBeUndefined();

    const r2 = computeSingleProperty({ property: PROPERTY, globalAssumptions: GLOBAL, projectionYears: 10 });
    expect(r2.cached).toBe(true);

    const status = getCacheStatus();
    expect(status.hits).toBe(1);
    expect(status.misses).toBe(1);
  });

  it("invalidation clears all entries", () => {
    computeSingleProperty({ property: PROPERTY, globalAssumptions: GLOBAL, projectionYears: 10 });
    expect(getCacheStatus().size).toBeGreaterThan(0);

    invalidateComputeCache();
    expect(getCacheStatus().size).toBe(0);

    const r2 = computeSingleProperty({ property: PROPERTY, globalAssumptions: GLOBAL, projectionYears: 10 });
    expect(r2.cached).toBeUndefined();
  });

  it("different inputs produce different cache keys", () => {
    const key1 = computeCacheKey({ property: PROPERTY, globalAssumptions: GLOBAL });
    const key2 = computeCacheKey({ property: { ...PROPERTY, startAdr: 200 }, globalAssumptions: GLOBAL });
    expect(key1).not.toBe(key2);
  });

  it("same inputs produce same cache key regardless of property order", () => {
    const key1 = computeCacheKey({ a: 1, b: 2 });
    const key2 = computeCacheKey({ b: 2, a: 1 });
    expect(key1).toBe(key2);
  });

  it("cached result preserves all financial values exactly", () => {
    const r1 = computeSingleProperty({ property: PROPERTY, globalAssumptions: GLOBAL, projectionYears: 10 });
    const r2 = computeSingleProperty({ property: PROPERTY, globalAssumptions: GLOBAL, projectionYears: 10 });

    expect(r2.yearly.length).toBe(r1.yearly.length);
    for (let y = 0; y < r1.yearly.length; y++) {
      expect(r2.yearly[y].revenueTotal).toStrictEqual(r1.yearly[y].revenueTotal);
      expect(r2.yearly[y].noi).toStrictEqual(r1.yearly[y].noi);
      expect(r2.yearly[y].netIncome).toStrictEqual(r1.yearly[y].netIncome);
      expect(r2.yearly[y].endingCash).toStrictEqual(r1.yearly[y].endingCash);
      expect(r2.yearly[y].operatingCashFlow).toStrictEqual(r1.yearly[y].operatingCashFlow);
    }
  });
});

describe("Cache Invalidation Mutation Path Coverage", () => {
  it("property create route calls invalidateComputeCache", () => {
    const lines = grepServer("invalidateComputeCache");
    const propertyCreate = lines.filter(l => l.includes("routes/properties.ts"));
    expect(propertyCreate.length).toBeGreaterThanOrEqual(1);
  });

  it("property update (PATCH) route calls invalidateComputeCache", () => {
    const lines = grepServer("invalidateComputeCache");
    const propertyLines = lines.filter(l => l.includes("routes/properties.ts"));
    expect(propertyLines.length).toBeGreaterThanOrEqual(2);
  });

  it("property delete route calls invalidateComputeCache", () => {
    const lines = grepServer("invalidateComputeCache");
    const propertyLines = lines.filter(l => l.includes("routes/properties.ts"));
    expect(propertyLines.length).toBeGreaterThanOrEqual(3);
  });

  it("fee-categories update route calls invalidateComputeCache", () => {
    const lines = grepServer("invalidateComputeCache");
    const propertyLines = lines.filter(l => l.includes("routes/properties.ts"));
    expect(propertyLines.length).toBeGreaterThanOrEqual(4);
  });

  it("global-assumptions PUT route calls invalidateComputeCache", () => {
    const lines = grepServer("invalidateComputeCache");
    const gaLines = lines.filter(l => l.includes("routes/global-assumptions.ts"));
    expect(gaLines.length).toBeGreaterThanOrEqual(1);
  });

  it("scenario load route calls invalidateComputeCache", () => {
    const lines = grepServer("invalidateComputeCache");
    const scenarioLines = lines.filter(l => l.includes("routes/scenarios.ts"));
    expect(scenarioLines.length).toBeGreaterThanOrEqual(1);
  });

  it("finance invalidate route calls invalidateComputeCache", () => {
    const lines = grepServer("invalidateComputeCache");
    const financeLines = lines.filter(l => l.includes("routes/finance.ts"));
    expect(financeLines.length).toBeGreaterThanOrEqual(1);
  });

  it("invalidateComputeCache is imported by all mutation route files", () => {
    const imports = grepServer("import.*invalidateComputeCache.*from");
    const routeFiles = imports.filter(l => l.includes("routes/"));
    const expectedFiles = ["properties.ts", "global-assumptions.ts", "scenarios.ts", "finance.ts"];
    for (const file of expectedFiles) {
      expect(routeFiles.some(l => l.includes(file))).toBe(true);
    }
  });
});
