import { describe, it, expect } from "vitest";
import { generatePropertyProForma } from "../../client/src/lib/financial/property-engine";

const goldenProperty = {
  operationsStartDate: "2026-04-01",
  acquisitionDate: "2026-04-01",
  roomCount: 10, startAdr: 200, adrGrowthRate: 0,
  startOccupancy: 0.70, maxOccupancy: 0.70,
  occupancyRampMonths: 1, occupancyGrowthStep: 0,
  purchasePrice: 1_000_000, buildingImprovements: 0,
  landValuePercent: 0.20, preOpeningCosts: 0, operatingReserve: 0,
  costRateRooms: 0.20, costRateFB: 0.09, costRateAdmin: 0.08,
  costRateMarketing: 0.01, costRatePropertyOps: 0.04, costRateUtilities: 0.05,
  costRateTaxes: 0.03, costRateIT: 0.005, costRateFFE: 0.04, costRateOther: 0.05,
  revShareEvents: 0.43, revShareFB: 0.22, revShareOther: 0.07,
  cateringBoostPercent: 0.30,
  baseManagementFeeRate: 0.085,
  incentiveManagementFeeRate: 0.12,
  taxRate: 0.30, type: "Full Equity" as const,
};
const goldenGlobal = {
  modelStartDate: "2026-04-01",
  projectionYears: 1,
  inflationRate: 0,
  fixedCostEscalationRate: 0,
  eventExpenseRate: 0.65,
  otherExpenseRate: 0.60,
  utilitiesVariableSplit: 0.60,
};

describe("debug insurance NaN", () => {
  const result = generatePropertyProForma(goldenProperty as any, goldenGlobal as any, 1);
  const m = result[0];
  
  it("dump all expense values", () => {
    console.log("expenseRooms:", m.expenseRooms);
    console.log("expenseFB:", m.expenseFB);
    console.log("expenseEvents:", m.expenseEvents);
    console.log("expenseOther:", m.expenseOther);
    console.log("expenseMarketing:", m.expenseMarketing);
    console.log("expensePropertyOps:", m.expensePropertyOps);
    console.log("expenseUtilitiesVar:", m.expenseUtilitiesVar);
    console.log("expenseAdmin:", m.expenseAdmin);
    console.log("expenseIT:", m.expenseIT);
    console.log("expenseTaxes:", m.expenseTaxes);
    console.log("expenseUtilitiesFixed:", m.expenseUtilitiesFixed);
    console.log("expenseInsurance:", m.expenseInsurance);
    console.log("expenseOtherCosts:", m.expenseOtherCosts);
    console.log("gop:", m.gop);
    console.log("noi:", m.noi);
    console.log("revenueTotal:", m.revenueTotal);
    
    const nanFields: string[] = [];
    for (const [k, v] of Object.entries(m)) {
      if (typeof v === "number" && isNaN(v)) nanFields.push(k);
    }
    expect(nanFields).toEqual([]);
  });
});
