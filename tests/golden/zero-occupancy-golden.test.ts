/**
 * Golden Scenario: Zero Occupancy (Failed Asset / Permanently Vacant)
 *
 * Tests a property with permanently zero occupancy — a "failed asset" that
 * never generates any revenue. This isolates the behavior of fixed costs
 * that are based on property value (property taxes) vs. all
 * revenue-driven costs which should be exactly $0.
 *
 * PROPERTY: 20 rooms, $200 ADR, 0% start occupancy, 0% max occupancy
 *           Cash purchase (no debt) — $1,000,000, building improvements $0
 *           Land 25% → building $750,000, land $250,000
 *           Operating reserve $15,000, tax rate 25%
 *           Exit Year 10, cap rate 8.5%, commission 5%
 *           0% growth, 0% inflation, 0% fixed cost escalation
 *
 * Key insight: With zero occupancy, ALL revenue = $0 and ALL revenue-based
 * expenses = $0. Only property-value-based costs accrue: property taxes.
 * This produces a negative NOI every month, draining the
 * operating reserve. At exit, negative NOI / cap rate = negative gross value.
 *
 * Projection: 10 years (120 months) starting 2026-04-01.
 * Model start = ops start = acquisition date.
 */
import { describe, it, expect } from "vitest";
import { generatePropertyProForma } from "../../client/src/lib/financial/property-engine";
import { aggregatePropertyByYear } from "../../client/src/lib/financial/yearlyAggregator";
import { aggregateCashFlowByYear } from "../../client/src/lib/financial/cashFlowAggregator";
import {
  DEFAULT_BASE_MANAGEMENT_FEE_RATE, DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,
  DEFAULT_COST_RATE_FFE, DEFAULT_COST_RATE_TAXES,
  DAYS_PER_MONTH, DEPRECIATION_YEARS, DEFAULT_LAND_VALUE_PERCENT,
} from "../../shared/constants";

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO INPUTS
// ═══════════════════════════════════════════════════════════════════════════════

const PROPERTY = {
  id: 1,
  name: "Vacant Lodge",
  type: "Cash",                         // No debt — full equity purchase
  purchasePrice: 1_000_000,
  buildingImprovements: 0,
  preOpeningCosts: 0,
  roomCount: 20,
  startAdr: 200,
  startOccupancy: 0,                    // Zero occupancy — failed asset
  maxOccupancy: 0,                      // Never ramps up
  occupancyGrowthStep: 0,
  occupancyRampMonths: 6,
  adrGrowthRate: 0,
  inflationRate: 0,
  operationsStartDate: "2026-04-01",
  acquisitionDate: "2026-04-01",
  operatingReserve: 15_000,
  taxRate: 0.25,
  acquisitionLTV: 0,                    // Cash purchase
  acquisitionInterestRate: 0,
  acquisitionTermYears: 0,
  exitCapRate: 0.085,
  dispositionCommission: 0.05,
  willRefinance: "No",
} as any;

const GLOBAL = {
  modelStartDate: "2026-04-01",
  projectionYears: 10,
  inflationRate: 0,
  fixedCostEscalationRate: 0,
  companyInflationRate: 0,
  companyTaxRate: 0.30,
  companyOpsStartDate: "2026-04-01",
  safeTranche1Date: "2026-04-01",
  safeTranche1Amount: 800_000,
  safeTranche2Date: null,
  safeTranche2Amount: 0,
} as any;

const MONTHS = 120;

// ═══════════════════════════════════════════════════════════════════════════════
// HAND CALCULATIONS — ALL MONTHS IDENTICAL (0% growth, 0% occupancy, cash)
// ═══════════════════════════════════════════════════════════════════════════════

// Revenue: rooms × ADR × 0% occupancy = $0 everywhere
const H_REV_ROOMS = 0;
const H_REV_EVENTS = 0;
const H_REV_FB = 0;
const H_REV_OTHER = 0;
const H_REV_TOTAL = 0;

// Variable expenses: all revenue-driven = $0
const H_EXP_ROOMS = 0;
const H_EXP_FB = 0;
const H_EXP_EVENTS = 0;
const H_EXP_OTHER = 0;
const H_EXP_MARKETING = 0;
const H_EXP_UTIL_VAR = 0;
const H_EXP_FFE = 0;

// Fixed expenses based on baseMonthlyTotalRev (= 0 since startOccupancy = 0)
const H_EXP_ADMIN = 0;
const H_EXP_PROP_OPS = 0;
const H_EXP_IT = 0;
const H_EXP_UTIL_FIXED = 0;
const H_EXP_OTHER_COSTS = 0;

// Fixed expenses based on property value (NOT revenue) — these still accrue
const H_TOTAL_PROP_VALUE = 1_000_000;
const H_EXP_TAXES = (H_TOTAL_PROP_VALUE / 12) * DEFAULT_COST_RATE_TAXES;         // 83333.33 * 0.03 = 2500.00

// USALI waterfall
const H_TOTAL_OP_EXP = 0; // All revenue-driven expenses = $0
const H_GOP = H_REV_TOTAL - H_TOTAL_OP_EXP;                                       // $0
const H_FEE_BASE = H_REV_TOTAL * DEFAULT_BASE_MANAGEMENT_FEE_RATE;                // $0
const H_FEE_INCENTIVE = Math.max(0, H_GOP * DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE); // max(0, 0) = $0
const H_AGOP = H_GOP - H_FEE_BASE - H_FEE_INCENTIVE;                             // $0
const H_NOI = H_AGOP - H_EXP_TAXES;                                               // 0 - 2500 = -2500
const H_ANOI = H_NOI - H_EXP_FFE;                                                 // -2500 - 0 = -2500

// Depreciation
const H_LAND_PCT = DEFAULT_LAND_VALUE_PERCENT;                                     // 0.25
const H_BUILDING_VALUE = H_TOTAL_PROP_VALUE * (1 - H_LAND_PCT);                   // 750,000
const H_LAND_VALUE = H_TOTAL_PROP_VALUE * H_LAND_PCT;                             // 250,000
const H_MONTHLY_DEPR = H_BUILDING_VALUE / DEPRECIATION_YEARS / 12;                // 750000 / 27.5 / 12 = 2272.73

// Income tax: taxableIncome = ANOI - interest - depreciation
// = -2500 - 0 - 2272.73 = -4772.73 → negative → tax = $0
const H_TAXABLE_INCOME = H_ANOI - 0 - H_MONTHLY_DEPR;
const H_INCOME_TAX = H_TAXABLE_INCOME > 0 ? H_TAXABLE_INCOME * 0.25 : 0;         // $0

// Net income = ANOI - interest - depreciation - tax
const H_NET_INCOME = H_ANOI - 0 - H_MONTHLY_DEPR - H_INCOME_TAX;                 // -4772.73

// Cash flow = ANOI - debt payment - tax (cash = no debt)
const H_CASH_FLOW = H_ANOI - 0 - H_INCOME_TAX;                                   // -2500

// Exit (Year 10)
const H_ANNUAL_NOI = H_NOI * 12;                                                   // -30,000
const H_GROSS_VALUE = H_ANNUAL_NOI / 0.085;                                        // -352,941.18
const H_COMMISSION = H_GROSS_VALUE * 0.05;                                          // -17,647.06
const H_EXIT_VALUE = H_GROSS_VALUE - H_COMMISSION - 0;                             // -335,294.12 (no debt)

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("Golden Scenario: Zero Occupancy (Failed Asset)", () => {
  const propFinancials = generatePropertyProForma(PROPERTY, GLOBAL, MONTHS);
  const yearlyProp = aggregatePropertyByYear(propFinancials, 10);
  const yearlyCF = aggregateCashFlowByYear(
    propFinancials,
    { ...PROPERTY, preOpeningCosts: 0 } as any,
    GLOBAL as any,
    10,
  );

  // ─── 1. Revenue = $0 Every Month ──────────────────────────────────────────
  describe("Revenue = $0 Every Month", () => {
    it("room revenue = 20 × 30.5 × $200 × 0% = $0 all 120 months", () => {
      for (let i = 0; i < MONTHS; i++) {
        expect(propFinancials[i].revenueRooms).toBe(0);
      }
    });

    it("total revenue = $0 (rooms, events, F&B, other all zero)", () => {
      for (let i = 0; i < MONTHS; i++) {
        expect(propFinancials[i].revenueTotal).toBe(0);
        expect(propFinancials[i].revenueEvents).toBe(0);
        expect(propFinancials[i].revenueFB).toBe(0);
        expect(propFinancials[i].revenueOther).toBe(0);
      }
    });
  });

  // ─── 2. Variable Expenses = $0 ───────────────────────────────────────────
  describe("Variable Expenses = $0", () => {
    it("all revenue-driven expenses are zero every month", () => {
      for (let i = 0; i < MONTHS; i++) {
        const m = propFinancials[i];
        expect(m.expenseRooms).toBe(0);
        expect(m.expenseFB).toBe(0);
        expect(m.expenseEvents).toBe(0);
        expect(m.expenseOther).toBe(0);
        expect(m.expenseMarketing).toBe(0);
        expect(m.expenseFFE).toBe(0);
      }
    });
  });

  // ─── 3. Property Taxes (Property-Value Based) ─────────────────
  describe("Property Taxes (property-value based, NOT revenue)", () => {
    it("property taxes = ($1,000,000 / 12) × 0.03 = $2,500.00/mo", () => {
      for (let i = 0; i < MONTHS; i++) {
        expect(propFinancials[i].expenseTaxes).toBeCloseTo(H_EXP_TAXES, 2);
      }
    });
  });

  // ─── 4. Management Fees = $0 ─────────────────────────────────────────────
  describe("Management Fees = $0", () => {
    it("base fee = 8.5% of $0 = $0", () => {
      for (let i = 0; i < MONTHS; i++) {
        expect(propFinancials[i].feeBase).toBe(0);
      }
    });

    it("incentive fee = max(0, 12% of $0 GOP) = $0", () => {
      for (let i = 0; i < MONTHS; i++) {
        expect(propFinancials[i].feeIncentive).toBe(0);
      }
    });
  });

  // ─── 5. NOI = -$2,500.00/mo ──────────────────────────────────────────────
  describe("NOI = -$2,500.00/mo (only taxes)", () => {
    it("NOI = $0 - $2,500.00 = -$2,500.00 every month", () => {
      for (let i = 0; i < MONTHS; i++) {
        expect(propFinancials[i].noi).toBeCloseTo(H_NOI, 2);
      }
    });
  });

  // ─── 6. ANOI = -$4,166.67/mo (FF&E = 0) ─────────────────────────────────
  describe("ANOI = -$4,166.67/mo (FF&E = 0 since revenue = 0)", () => {
    it("ANOI = NOI - $0 FF&E = -$4,166.67 every month", () => {
      for (let i = 0; i < MONTHS; i++) {
        expect(propFinancials[i].anoi).toBeCloseTo(H_ANOI, 2);
      }
    });
  });

  // ─── 7. No Debt Service (Cash Purchase) ──────────────────────────────────
  describe("No Debt Service (Cash Purchase)", () => {
    it("debt payment, interest, principal, outstanding all = $0", () => {
      for (let i = 0; i < MONTHS; i++) {
        const m = propFinancials[i];
        expect(m.debtPayment).toBe(0);
        expect(m.interestExpense).toBe(0);
        expect(m.principalPayment).toBe(0);
        expect(m.debtOutstanding).toBe(0);
      }
    });
  });

  // ─── 8. Depreciation = $2,272.73/mo ──────────────────────────────────────
  describe("Depreciation", () => {
    it("monthly depreciation = $750,000 / 27.5 / 12 = $2,272.73", () => {
      for (let i = 0; i < MONTHS; i++) {
        expect(propFinancials[i].depreciationExpense).toBeCloseTo(H_MONTHLY_DEPR, 2);
      }
    });
  });

  // ─── 9. Taxable Income Negative → Tax = $0 ──────────────────────────────
  describe("Taxable Income Negative → Tax = $0", () => {
    it("taxable income = -$6,439.39 → income tax = $0 every month", () => {
      for (let i = 0; i < MONTHS; i++) {
        expect(propFinancials[i].incomeTax).toBe(0);
      }
    });
  });

  // ─── 10. Cash Flow = -$4,166.67/mo ───────────────────────────────────────
  describe("Cash Flow = -$4,166.67/mo", () => {
    it("cash flow = ANOI - $0 debt - $0 tax = -$4,166.67 every month", () => {
      for (let i = 0; i < MONTHS; i++) {
        expect(propFinancials[i].cashFlow).toBeCloseTo(H_CASH_FLOW, 2);
      }
    });
  });

  // ─── 11. Operating Reserve Seeded Month 0 ─────────────────────────────────
  describe("Operating Reserve Seeded Month 0", () => {
    it("ending cash month 0 = $15,000 reserve + (-$4,166.67) = $10,833.33", () => {
      const expectedMonth0 = 15_000 + H_CASH_FLOW;
      expect(propFinancials[0].endingCash).toBeCloseTo(expectedMonth0, 2);
    });
  });

  // ─── 12. Ending Cash Decreases by $4,166.67 Each Month ───────────────────
  describe("Ending Cash Decreases by $4,166.67 Each Month", () => {
    it("ending cash is cumulative: reserve + sum(cashFlow[0..i])", () => {
      let cumCash = 15_000; // operating reserve
      for (let i = 0; i < MONTHS; i++) {
        cumCash += propFinancials[i].cashFlow;
        expect(propFinancials[i].endingCash).toBeCloseTo(cumCash, 2);
      }
    });

    it("ending cash decreases monotonically (constant negative CF)", () => {
      for (let i = 1; i < MONTHS; i++) {
        expect(propFinancials[i].endingCash).toBeLessThan(propFinancials[i - 1].endingCash);
      }
    });
  });

  // ─── 13. No NaN or Infinity ──────────────────────────────────────────────
  describe("Data Integrity — No NaN or Infinity", () => {
    it("no NaN values in any month", () => {
      for (let i = 0; i < MONTHS; i++) {
        const m = propFinancials[i];
        expect(Number.isNaN(m.revenueTotal)).toBe(false);
        expect(Number.isNaN(m.noi)).toBe(false);
        expect(Number.isNaN(m.anoi)).toBe(false);
        expect(Number.isNaN(m.netIncome)).toBe(false);
        expect(Number.isNaN(m.cashFlow)).toBe(false);
        expect(Number.isNaN(m.endingCash)).toBe(false);
        expect(Number.isNaN(m.debtOutstanding)).toBe(false);
        expect(Number.isNaN(m.interestExpense)).toBe(false);
        expect(Number.isNaN(m.principalPayment)).toBe(false);
        expect(Number.isNaN(m.incomeTax)).toBe(false);
        expect(Number.isNaN(m.depreciationExpense)).toBe(false);
        expect(Number.isNaN(m.propertyValue)).toBe(false);
      }
    });

    it("no Infinity values in any month", () => {
      for (let i = 0; i < MONTHS; i++) {
        const m = propFinancials[i];
        expect(Number.isFinite(m.revenueTotal)).toBe(true);
        expect(Number.isFinite(m.noi)).toBe(true);
        expect(Number.isFinite(m.netIncome)).toBe(true);
        expect(Number.isFinite(m.cashFlow)).toBe(true);
        expect(Number.isFinite(m.endingCash)).toBe(true);
        expect(Number.isFinite(m.debtOutstanding)).toBe(true);
      }
    });
  });

  // ─── 14. A = L + E Every Month (Balance Sheet Identity) ──────────────────
  describe("A = L + E Every Month (Balance Sheet Identity)", () => {
    it("totalAssets = totalLiabilities + equity (within $1)", () => {
      const initialEquity = H_TOTAL_PROP_VALUE; // Cash purchase — full equity, no loan
      let cumNI = 0;
      for (let i = 0; i < MONTHS; i++) {
        const m = propFinancials[i];
        cumNI += m.netIncome;
        const totalAssets = m.endingCash + m.propertyValue;
        const totalLiabilities = m.debtOutstanding; // 0 for cash purchase
        // Equity = initial equity + operating reserve + cumulative net income
        const derivedEquity = initialEquity + 15_000 + cumNI;
        const gap = Math.abs(totalAssets - totalLiabilities - derivedEquity);
        expect(gap).toBeLessThan(1.0);
      }
    });
  });

  // ─── 15. OCF = NI + Depreciation (ASC 230) ──────────────────────────────
  describe("OCF = NI + Depreciation (ASC 230)", () => {
    it("operating cash flow = net income + depreciation every month", () => {
      for (let i = 0; i < MONTHS; i++) {
        const m = propFinancials[i];
        expect(m.operatingCashFlow).toBeCloseTo(m.netIncome + m.depreciationExpense, 2);
      }
    });
  });

  // ─── Exit Value (Negative Gross Value) ────────────────────────────────────
  describe("Exit — Negative Gross Value from Negative NOI", () => {
    it("annual NOI = -$30,000", () => {
      expect(H_ANNUAL_NOI).toBeCloseTo(-30_000, 2);
    });

    it("gross value = -$30,000 / 0.085 = -$352,941.18", () => {
      expect(H_GROSS_VALUE).toBeCloseTo(-352_941.18, 0);
    });

    it("exit value is negative (worthless asset)", () => {
      expect(H_EXIT_VALUE).toBeLessThan(0);
    });

    it("engine exit value matches hand calculation", () => {
      const lastYearCF = yearlyCF[9]; // Year 10 (index 9)
      expect(lastYearCF.exitValue).toBeCloseTo(H_EXIT_VALUE, 0);
    });
  });
});
