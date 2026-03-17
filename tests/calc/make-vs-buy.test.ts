import { describe, it, expect } from "vitest";
import { executeComputationTool } from "../../calc/dispatch";

describe("compute_make_vs_buy via dispatch", () => {
  const BASE_INPUT = {
    serviceName: "Housekeeping",
    inHouseLabor: 180000,
    benefitsRate: 0.30,
    trainingAnnual: 5000,
    suppliesAnnual: 12000,
    allocatedOverhead: 8000,
    vendorContractPrice: 220000,
    internalOversightHours: 4,
    managerHourlyRate: 45,
    unitCount: 50,
  };

  it("returns a valid result via dispatch", () => {
    const raw = executeComputationTool("compute_make_vs_buy", BASE_INPUT);
    expect(raw).not.toBeNull();
    const result = JSON.parse(raw!);
    expect(result.service).toBe("Housekeeping");
    expect(typeof result.totalInHouseCost).toBe("number");
    expect(typeof result.totalVendorCost).toBe("number");
    expect(typeof result.annualSavings).toBe("number");
    expect(typeof result.recommendation).toBe("string");
    expect(["In-House", "Outsource", "Marginal"]).toContain(result.recommendation);
  });

  it("recommends outsource when vendor is significantly cheaper", () => {
    const input = {
      ...BASE_INPUT,
      inHouseLabor: 400000,
      vendorContractPrice: 150000,
    };
    const result = JSON.parse(executeComputationTool("compute_make_vs_buy", input)!);
    expect(result.recommendation).toBe("Outsource");
    expect(result.annualSavings).toBeGreaterThan(0);
  });

  it("recommends in-house when in-house is significantly cheaper", () => {
    const input = {
      ...BASE_INPUT,
      inHouseLabor: 80000,
      vendorContractPrice: 350000,
    };
    const result = JSON.parse(executeComputationTool("compute_make_vs_buy", input)!);
    expect(result.recommendation).toBe("In-House");
  });

  it("handles zero unit count gracefully", () => {
    const input = { ...BASE_INPUT, unitCount: 0 };
    const result = JSON.parse(executeComputationTool("compute_make_vs_buy", input)!);
    expect(result.costPerUnitInHouse).toBe(0);
    expect(result.costPerUnitVendor).toBe(0);
  });

  it("computes cost per unit correctly", () => {
    const result = JSON.parse(executeComputationTool("compute_make_vs_buy", BASE_INPUT)!);
    expect(result.costPerUnitInHouse).toBeCloseTo(result.totalInHouseCost / 50, 2);
    expect(result.costPerUnitVendor).toBeCloseTo(result.totalVendorCost / 50, 2);
  });
});
