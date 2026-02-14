import { describe, it, expect } from "vitest";
import { generatePropertyProForma, MonthlyFinancials } from "@/lib/financialEngine";
import { differenceInMonths } from "date-fns";

const baseProperty = {
  operationsStartDate: "2026-04-01",
  acquisitionDate: "2026-04-01",
  roomCount: 10,
  startAdr: 200,
  adrGrowthRate: 0.03,
  startOccupancy: 0.60,
  maxOccupancy: 0.80,
  occupancyRampMonths: 6,
  occupancyGrowthStep: 0.05,
  purchasePrice: 1_000_000,
  buildingImprovements: 0,
  landValuePercent: 0.25,
  type: "Full Equity",
  costRateRooms: 0.20,
  costRateFB: 0.09,
  costRateAdmin: 0.08,
  costRateMarketing: 0.01,
  costRatePropertyOps: 0.04,
  costRateUtilities: 0.05,
  costRateInsurance: 0.02,
  costRateTaxes: 0.03,
  costRateIT: 0.005,
  costRateFFE: 0.04,
  costRateOther: 0.05,
  revShareEvents: 0.43,
  revShareFB: 0.22,
  revShareOther: 0.07,
  cateringBoostPercent: 0.30,
};

const baseGlobal = {
  modelStartDate: "2026-04-01",
  inflationRate: 0.03,
  modelDurationYears: 3,
};

describe("Operating Reserve and Cumulative Cash Flow", () => {
  describe("Operating reserve seeds cash at acquisition month", () => {
    it("ending cash at acquisition month includes operating reserve", () => {
      const reserve = 250_000;
      const property = {
        ...baseProperty,
        operatingReserve: reserve,
      };
      const months = generatePropertyProForma(property, baseGlobal as any);
      const acqMonth = months[0];
      expect(acqMonth.endingCash).toBeGreaterThanOrEqual(reserve);
    });

    it("ending cash without reserve starts at zero from operations only", () => {
      const property = {
        ...baseProperty,
        operatingReserve: 0,
      };
      const months = generatePropertyProForma(property, baseGlobal as any);
      const acqMonth = months[0];
      expect(acqMonth.endingCash).toBeLessThan(250_000);
    });

    it("reserve difference shows up in ending cash", () => {
      const withReserve = generatePropertyProForma(
        { ...baseProperty, operatingReserve: 500_000 },
        baseGlobal as any
      );
      const withoutReserve = generatePropertyProForma(
        { ...baseProperty, operatingReserve: 0 },
        baseGlobal as any
      );
      const diff = (withReserve[0].endingCash || 0) - (withoutReserve[0].endingCash || 0);
      expect(Math.abs(diff - 500_000)).toBeLessThan(1);
    });

    it("reserve value flows through to cumulative cash tracking", () => {
      const reserve = 500_000;
      const property = {
        ...baseProperty,
        operatingReserve: reserve,
      };
      const months = generatePropertyProForma(property, baseGlobal as any);

      let cumulativeCash = reserve;
      for (let i = 0; i < months.length; i++) {
        cumulativeCash += (months[i].cashFlow || 0);
      }
      const lastMonth = months[months.length - 1];
      expect(Math.abs(cumulativeCash - (lastMonth.endingCash || 0))).toBeLessThan(1);
    });
  });

  describe("Per-property financing fields", () => {
    it("uses acquisitionInterestRate for debt payment calculation", () => {
      const property = {
        ...baseProperty,
        type: "Financed",
        acquisitionLTV: 0.60,
        acquisitionInterestRate: 0.08,
        acquisitionTermYears: 25,
      };
      const months = generatePropertyProForma(property, baseGlobal as any);

      const firstOpMonth = months.find(m => (m.debtPayment || 0) > 0);
      expect(firstOpMonth).toBeDefined();

      const loanAmount = (property.purchasePrice + (property.buildingImprovements || 0)) * property.acquisitionLTV;
      const monthlyRate = property.acquisitionInterestRate / 12;
      const totalPayments = property.acquisitionTermYears * 12;
      const expectedPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);

      if (firstOpMonth) {
        expect(Math.abs((firstOpMonth.debtPayment || 0) - expectedPayment)).toBeLessThan(1);
      }
    });

    it("different term years produce different monthly payments", () => {
      const property25yr = {
        ...baseProperty,
        type: "Financed",
        acquisitionLTV: 0.60,
        acquisitionInterestRate: 0.08,
        acquisitionTermYears: 25,
      };
      const property30yr = {
        ...baseProperty,
        type: "Financed",
        acquisitionLTV: 0.60,
        acquisitionInterestRate: 0.08,
        acquisitionTermYears: 30,
      };
      const months25 = generatePropertyProForma(property25yr, baseGlobal as any);
      const months30 = generatePropertyProForma(property30yr, baseGlobal as any);

      const ds25 = months25.find(m => (m.debtPayment || 0) > 0)?.debtPayment || 0;
      const ds30 = months30.find(m => (m.debtPayment || 0) > 0)?.debtPayment || 0;

      expect(ds25).toBeGreaterThan(ds30);
    });
  });

  describe("Cumulative cash equals ending cash", () => {
    it("cumulative cash flow + reserve = ending cash for Full Equity", () => {
      const reserve = 250_000;
      const property = {
        ...baseProperty,
        operatingReserve: reserve,
      };
      const months = generatePropertyProForma(property, baseGlobal as any);

      let cumCash = reserve;
      for (const m of months) {
        cumCash += (m.cashFlow || 0);
      }
      const lastEndingCash = months[months.length - 1].endingCash || 0;
      expect(Math.abs(cumCash - lastEndingCash)).toBeLessThan(1);
    });

    it("cumulative cash flow + reserve = ending cash for Financed", () => {
      const reserve = 600_000;
      const property = {
        ...baseProperty,
        type: "Financed",
        acquisitionLTV: 0.60,
        acquisitionInterestRate: 0.095,
        acquisitionTermYears: 25,
        operatingReserve: reserve,
      };
      const months = generatePropertyProForma(property, {
        ...baseGlobal,
        modelDurationYears: 5,
      } as any);

      let cumCash = reserve;
      for (const m of months) {
        cumCash += (m.cashFlow || 0);
      }
      const lastEndingCash = months[months.length - 1].endingCash || 0;
      expect(Math.abs(cumCash - lastEndingCash)).toBeLessThan(1);
    });

    it("without reserve, cumulative cash = ending cash", () => {
      const property = {
        ...baseProperty,
        operatingReserve: 0,
      };
      const months = generatePropertyProForma(property, baseGlobal as any);

      let cumCash = 0;
      for (const m of months) {
        cumCash += (m.cashFlow || 0);
      }
      const lastEndingCash = months[months.length - 1].endingCash || 0;
      expect(Math.abs(cumCash - lastEndingCash)).toBeLessThan(1);
    });
  });

  describe("Refinance path preserves operating reserve in cumulative cash", () => {
    it("Full Equity + Refinance: ending cash includes operating reserve after refinance rebuild", () => {
      const reserve = 250_000;
      const property = {
        ...baseProperty,
        operatingReserve: reserve,
        willRefinance: "Yes",
        refinanceDate: "2028-04-01",
        refinanceLTV: 0.65,
        refinanceInterestRate: 0.09,
        refinanceTermYears: 25,
        refinanceClosingCostRate: 0.03,
      };
      const months = generatePropertyProForma(property, {
        ...baseGlobal,
        modelDurationYears: 5,
      } as any);

      let cumCash = reserve;
      for (const m of months) {
        cumCash += (m.cashFlow || 0);
      }
      const lastEndingCash = months[months.length - 1].endingCash || 0;
      expect(Math.abs(cumCash - lastEndingCash)).toBeLessThan(1);
    });

    it("Full Equity + Refinance with pre-ops gap: reserve seeds at acquisition month, not lost in refi rebuild", () => {
      const reserve = 250_000;
      const property = {
        ...baseProperty,
        acquisitionDate: "2026-04-01",
        operationsStartDate: "2026-10-01",
        operatingReserve: reserve,
        willRefinance: "Yes",
        refinanceDate: "2029-04-01",
        refinanceLTV: 0.65,
        refinanceInterestRate: 0.09,
        refinanceTermYears: 25,
        refinanceClosingCostRate: 0.03,
      };
      const months = generatePropertyProForma(property, {
        ...baseGlobal,
        modelDurationYears: 5,
      } as any);

      const acqMonth = months[0];
      expect(acqMonth.endingCash).toBeGreaterThanOrEqual(reserve);

      let cumCash = reserve;
      for (const m of months) {
        cumCash += (m.cashFlow || 0);
      }
      const lastEndingCash = months[months.length - 1].endingCash || 0;
      expect(Math.abs(cumCash - lastEndingCash)).toBeLessThan(1);
    });

    it("removing reserve from refinance property drops ending cash by reserve amount", () => {
      const reserve = 500_000;
      const refiProperty = {
        ...baseProperty,
        willRefinance: "Yes",
        refinanceDate: "2028-04-01",
        refinanceLTV: 0.65,
        refinanceInterestRate: 0.09,
        refinanceTermYears: 25,
        refinanceClosingCostRate: 0.03,
      };
      const withReserve = generatePropertyProForma(
        { ...refiProperty, operatingReserve: reserve },
        { ...baseGlobal, modelDurationYears: 5 } as any
      );
      const withoutReserve = generatePropertyProForma(
        { ...refiProperty, operatingReserve: 0 },
        { ...baseGlobal, modelDurationYears: 5 } as any
      );
      const diff = (withReserve[withReserve.length - 1].endingCash || 0) -
                   (withoutReserve[withoutReserve.length - 1].endingCash || 0);
      expect(Math.abs(diff - reserve)).toBeLessThan(1);
    });
  });

  describe("Pre-operations gap with debt service", () => {
    it("financed property with pre-ops gap has debt payments during gap", () => {
      const property = {
        ...baseProperty,
        acquisitionDate: "2026-04-01",
        operationsStartDate: "2028-02-01",
        type: "Financed",
        acquisitionLTV: 0.60,
        acquisitionInterestRate: 0.095,
        acquisitionTermYears: 25,
        operatingReserve: 600_000,
        purchasePrice: 3_800_000,
        buildingImprovements: 1_000_000,
      };
      const months = generatePropertyProForma(property, {
        ...baseGlobal,
        modelDurationYears: 5,
      } as any);

      const opsStart = new Date(property.operationsStartDate);
      const modelStart = new Date(baseGlobal.modelStartDate);
      const opsIdx = differenceInMonths(opsStart, modelStart);

      const preOpsMonths = months.slice(0, opsIdx);
      const hasPreOpsDebt = preOpsMonths.some(m => (m.debtPayment || 0) > 0);
      expect(hasPreOpsDebt).toBe(true);
    });
  });
});
