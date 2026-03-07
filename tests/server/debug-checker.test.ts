import { describe, it, expect } from "vitest";
import { runIndependentVerification } from "../../server/calculationChecker.js";

function makeGlobal() {
  return { modelStartDate: "2026-01-01", projectionYears: 2, inflationRate: 0.02, fixedCostEscalationRate: 0.02 };
}

function makeProperty() {
  return {
    name: "Test Hotel",
    type: "AllCash",
    purchasePrice: 1_000_000,
    buildingImprovements: 0,
    roomCount: 10,
    startAdr: 200,
    startOccupancy: 0.50,
    maxOccupancy: 0.70,
    occupancyGrowthStep: 0.05,
    occupancyRampMonths: 12,
    adrGrowthRate: 0.02,
    operationsStartDate: "2026-01-01",
    acquisitionDate: "2026-01-01",
    operatingReserve: 0,
    taxRate: 0.25,
  };
}

describe("debug checker", () => {
  it("show failures", () => {
    const report = runIndependentVerification([makeProperty()], makeGlobal());
    console.log("Opinion:", report.summary.auditOpinion, "Failed:", report.summary.totalFailed);
    const failedChecks = report.propertyResults[0].checks.filter((c: any) => !c.passed);
    for (const c of failedChecks) {
      console.log(`  FAIL: ${c.metric} | exp=${c.expected} actual=${c.actual}`);
    }
    expect(true).toBe(true);
  });
});
