import { describe, it, expect } from "vitest";
import { generatePropertyProForma } from "../../server/finance/core/property-pipeline";
import { aggregatePropertyByYear } from "../../server/finance/core/yearly-aggregator";
import { computePortfolioProjection, computeSingleProperty } from "../../server/finance/service";
import { stableHash } from "../../server/scenarios/stable-json";
import type { PropertyInput, GlobalInput } from "@engine/types";
import Decimal from "decimal.js";

const SAMPLE_PROPERTY: PropertyInput = {
  operationsStartDate: "2026-04-01",
  acquisitionDate: "2026-04-01",
  roomCount: 50,
  startAdr: 150,
  adrGrowthRate: 0.03,
  startOccupancy: 0.72,
  maxOccupancy: 0.72,
  occupancyRampMonths: 1,
  occupancyGrowthStep: 0,
  purchasePrice: 5_000_000,
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
  exitCapRate: 0.07,
};

const SAMPLE_GLOBAL: GlobalInput = {
  modelStartDate: "2026-04-01",
  inflationRate: 0,
  projectionYears: 10,
};

describe("Data Flow Integrity Trace", () => {
  it("traces revenue from engine through service with no precision loss", () => {
    const months = 10 * 12;
    const rawMonthly = generatePropertyProForma(SAMPLE_PROPERTY, SAMPLE_GLOBAL, months);
    const rawYearly = aggregatePropertyByYear(rawMonthly, 10);

    const singleResult = computeSingleProperty({
      property: SAMPLE_PROPERTY,
      globalAssumptions: SAMPLE_GLOBAL,
      projectionYears: 10,
    });

    expect(singleResult.yearly.length).toBe(rawYearly.length);
    for (let y = 0; y < rawYearly.length; y++) {
      expect(singleResult.yearly[y].revenueTotal).toBe(rawYearly[y].revenueTotal);
      expect(singleResult.yearly[y].noi).toBe(rawYearly[y].noi);
      expect(singleResult.yearly[y].netIncome).toBe(rawYearly[y].netIncome);
      expect(singleResult.yearly[y].endingCash).toBe(rawYearly[y].endingCash);
    }

    expect(singleResult.monthly.length).toBe(rawMonthly.length);
    for (let m = 0; m < rawMonthly.length; m++) {
      expect(singleResult.monthly[m].revenueTotal).toBe(rawMonthly[m].revenueTotal);
      expect(singleResult.monthly[m].noi).toBe(rawMonthly[m].noi);
    }
  });

  it("portfolio projection matches single-property for single-property input", () => {
    const portfolioResult = computePortfolioProjection({
      properties: [SAMPLE_PROPERTY],
      globalAssumptions: SAMPLE_GLOBAL,
      projectionYears: 10,
    });

    const singleResult = computeSingleProperty({
      property: SAMPLE_PROPERTY,
      globalAssumptions: SAMPLE_GLOBAL,
      projectionYears: 10,
    });

    const key = Object.keys(portfolioResult.perPropertyYearly)[0];
    const portfolioYearly = portfolioResult.perPropertyYearly[key];

    for (let y = 0; y < portfolioYearly.length; y++) {
      expect(portfolioYearly[y].revenueTotal).toBe(singleResult.yearly[y].revenueTotal);
      expect(portfolioYearly[y].noi).toBe(singleResult.yearly[y].noi);
      expect(portfolioYearly[y].netIncome).toBe(singleResult.yearly[y].netIncome);
    }
  });

  it("output hash is deterministic for identical inputs", () => {
    const r1 = computeSingleProperty({
      property: SAMPLE_PROPERTY,
      globalAssumptions: SAMPLE_GLOBAL,
      projectionYears: 10,
    });

    const r2 = computeSingleProperty({
      property: SAMPLE_PROPERTY,
      globalAssumptions: SAMPLE_GLOBAL,
      projectionYears: 10,
    });

    expect(r1.outputHash).toBe(r2.outputHash);
    expect(r1.outputHash.length).toBe(64);
  });

  it("validation summary is UNQUALIFIED for valid input", () => {
    const result = computeSingleProperty({
      property: SAMPLE_PROPERTY,
      globalAssumptions: SAMPLE_GLOBAL,
      projectionYears: 10,
    });

    expect(result.validationSummary.opinion).toBe("UNQUALIFIED");
    expect(result.validationSummary.failed).toBe(0);
    expect(result.validationSummary.passed).toBeGreaterThan(0);
  });

  it("revenue accumulation has no floating-point drift over 120 months", () => {
    const months = 120;
    const monthly = generatePropertyProForma(SAMPLE_PROPERTY, SAMPLE_GLOBAL, months);

    const revenueSum = monthly.reduce((acc, m) => acc + m.revenueTotal, 0);
    const decimalSum = monthly.reduce(
      (acc, m) => acc.plus(new Decimal(m.revenueTotal)),
      new Decimal(0)
    );

    const drift = Math.abs(revenueSum - decimalSum.toNumber());
    expect(drift).toBeLessThan(0.01);
  });

  it("cache returns identical results on repeated call", () => {
    const input = {
      property: { ...SAMPLE_PROPERTY, name: "Cache Test Hotel" },
      globalAssumptions: SAMPLE_GLOBAL,
      projectionYears: 10,
    };

    const r1 = computeSingleProperty(input);
    const r2 = computeSingleProperty(input);

    expect(r2.cached).toBe(true);
    expect(r2.outputHash).toBe(r1.outputHash);
    expect(r2.yearly.length).toBe(r1.yearly.length);
    for (let y = 0; y < r1.yearly.length; y++) {
      expect(r2.yearly[y].revenueTotal).toBe(r1.yearly[y].revenueTotal);
      expect(r2.yearly[y].noi).toBe(r1.yearly[y].noi);
    }
  });

  it("stable hash produces consistent 64-char SHA-256", () => {
    const data = { a: 1, b: [2, 3], c: { d: "test" } };
    const h1 = stableHash(data);
    const h2 = stableHash({ c: { d: "test" }, a: 1, b: [2, 3] });
    expect(h1).toBe(h2);
    expect(h1.length).toBe(64);
    expect(/^[a-f0-9]{64}$/.test(h1)).toBe(true);
  });
});
