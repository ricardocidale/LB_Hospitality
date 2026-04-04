import { describe, it, expect } from "vitest";
import { computePortfolioProjection } from "../../server/finance/service";
import { stableHash } from "../../server/scenarios/stable-json";
import type { PropertyInput, GlobalInput } from "@engine/types";

const PROPERTY_A: PropertyInput = {
  operationsStartDate: "2026-04-01",
  acquisitionDate: "2026-04-01",
  roomCount: 40,
  startAdr: 130,
  adrGrowthRate: 0.03,
  startOccupancy: 0.68,
  maxOccupancy: 0.68,
  occupancyRampMonths: 1,
  occupancyGrowthStep: 0,
  purchasePrice: 4_000_000,
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

const PROPERTY_B: PropertyInput = {
  operationsStartDate: "2026-04-01",
  acquisitionDate: "2026-04-01",
  roomCount: 60,
  startAdr: 180,
  adrGrowthRate: 0.035,
  startOccupancy: 0.75,
  maxOccupancy: 0.75,
  occupancyRampMonths: 1,
  occupancyGrowthStep: 0,
  purchasePrice: 6_000_000,
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
  exitCapRate: 0.065,
};

const GLOBAL: GlobalInput = {
  modelStartDate: "2026-04-01",
  inflationRate: 0,
  projectionYears: 10,
};

describe("Scenario Save/Load Consistency", () => {
  it("compute → serialize → recompute produces identical hash (single property)", () => {
    const r1 = computePortfolioProjection({
      properties: [PROPERTY_A],
      globalAssumptions: GLOBAL,
      projectionYears: 10,
    });

    const snapshot = JSON.parse(JSON.stringify({
      properties: [PROPERTY_A],
      globalAssumptions: GLOBAL,
    }));

    const r2 = computePortfolioProjection({
      properties: snapshot.properties,
      globalAssumptions: snapshot.globalAssumptions,
      projectionYears: 10,
    });

    expect(r2.outputHash).toBe(r1.outputHash);
  });

  it("compute → serialize → recompute produces identical hash (multi-property)", () => {
    const r1 = computePortfolioProjection({
      properties: [PROPERTY_A, PROPERTY_B],
      globalAssumptions: GLOBAL,
      projectionYears: 10,
    });

    const snapshot = JSON.parse(JSON.stringify({
      properties: [PROPERTY_A, PROPERTY_B],
      globalAssumptions: GLOBAL,
    }));

    const r2 = computePortfolioProjection({
      properties: snapshot.properties,
      globalAssumptions: snapshot.globalAssumptions,
      projectionYears: 10,
    });

    expect(r2.outputHash).toBe(r1.outputHash);
  });

  it("consolidatedYearly totals equal sum of per-property values", () => {
    const result = computePortfolioProjection({
      properties: [PROPERTY_A, PROPERTY_B],
      globalAssumptions: GLOBAL,
      projectionYears: 10,
    });

    const keys = Object.keys(result.perPropertyYearly);
    expect(keys.length).toBe(2);

    for (let y = 0; y < result.consolidatedYearly.length; y++) {
      let sumRevenue = 0;
      let sumNoi = 0;
      for (const key of keys) {
        sumRevenue += result.perPropertyYearly[key][y].revenueTotal;
        sumNoi += result.perPropertyYearly[key][y].noi;
      }
      expect(Math.abs(result.consolidatedYearly[y].revenueTotal - sumRevenue)).toBeLessThan(0.01);
      expect(Math.abs(result.consolidatedYearly[y].noi - sumNoi)).toBeLessThan(0.01);
    }
  });

  it("different property order produces same consolidated totals", () => {
    const r1 = computePortfolioProjection({
      properties: [PROPERTY_A, PROPERTY_B],
      globalAssumptions: GLOBAL,
      projectionYears: 10,
    });

    const r2 = computePortfolioProjection({
      properties: [PROPERTY_B, PROPERTY_A],
      globalAssumptions: GLOBAL,
      projectionYears: 10,
    });

    for (let y = 0; y < r1.consolidatedYearly.length; y++) {
      expect(Math.abs(r1.consolidatedYearly[y].revenueTotal - r2.consolidatedYearly[y].revenueTotal)).toBeLessThan(0.01);
      expect(Math.abs(r1.consolidatedYearly[y].noi - r2.consolidatedYearly[y].noi)).toBeLessThan(0.01);
    }
  });

  it("stableHash is deterministic across serialization roundtrips", () => {
    const r1 = computePortfolioProjection({
      properties: [PROPERTY_A],
      globalAssumptions: GLOBAL,
      projectionYears: 10,
    });

    const serialized = JSON.parse(JSON.stringify(r1));
    const h1 = stableHash(r1.consolidatedYearly);
    const h2 = stableHash(serialized.consolidatedYearly);
    expect(h1).toBe(h2);
  });
});
