import {
  DEFAULT_REV_SHARE_EVENTS,
  DEFAULT_REV_SHARE_FB,
  DEFAULT_REV_SHARE_OTHER,
  DEFAULT_CATERING_BOOST_PCT,
  DEFAULT_EVENT_EXPENSE_RATE,
  DEFAULT_OTHER_EXPENSE_RATE,
  DEFAULT_UTILITIES_VARIABLE_SPLIT,
  DEFAULT_COST_RATE_ROOMS,
  DEFAULT_COST_RATE_FB,
  DEFAULT_COST_RATE_ADMIN,
  DEFAULT_COST_RATE_MARKETING,
  DEFAULT_COST_RATE_PROPERTY_OPS,
  DEFAULT_COST_RATE_UTILITIES,
  DEFAULT_COST_RATE_INSURANCE,
  DEFAULT_COST_RATE_TAXES,
  DEFAULT_COST_RATE_IT,
  DEFAULT_COST_RATE_FFE,
  DEFAULT_COST_RATE_OTHER,
  DEFAULT_TAX_RATE,
  DEPRECIATION_YEARS,
  DAYS_PER_MONTH,
  DEFAULT_LAND_VALUE_PERCENT,
  DEFAULT_OCCUPANCY_RAMP_MONTHS,
  DEFAULT_BASE_MANAGEMENT_FEE_RATE,
  DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,
} from "@shared/constants";
import type { CheckerProperty, CheckerGlobalAssumptions, IndependentMonthlyResult, YearMonth } from "./types";

const PROJECTION_YEARS = 10;
const DEFAULT_LTV = 0.75;
const DEFAULT_INTEREST_RATE = 0.09;
const DEFAULT_TERM_YEARS = 25;

const TOLERANCE = 0.001;

export function withinTolerance(expected: number, actual: number): boolean {
  if (expected === 0 && actual === 0) return true;
  if (expected === 0) return Math.abs(actual) < TOLERANCE;
  return Math.abs((expected - actual) / expected) < TOLERANCE;
}

// INTENTIONAL: Independent reimplementation per audit-persona.md rule.
// The server-side checker must NOT import from calc/shared/pmt.ts to maintain
// verification independence. Both implementations must produce identical results.
export function calculatePMT(principal: number, monthlyRate: number, totalPayments: number): number {
  if (principal === 0) return 0;
  if (monthlyRate === 0) return principal / totalPayments;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
    (Math.pow(1 + monthlyRate, totalPayments) - 1);
}

export function parseYearMonth(isoDate: string): YearMonth {
  const [year, month] = isoDate.split('-').map(Number);
  return { year, month: month - 1 };
}

export function addMonthsYM(ym: YearMonth, n: number): YearMonth {
  const totalMonths = ym.year * 12 + ym.month + n;
  return { year: Math.floor(totalMonths / 12), month: totalMonths % 12 };
}

export function diffMonthsYM(a: YearMonth, b: YearMonth): number {
  return (a.year * 12 + a.month) - (b.year * 12 + b.month);
}

export function ymNotBefore(a: YearMonth, b: YearMonth): boolean {
  return diffMonthsYM(a, b) >= 0;
}

export function independentPropertyCalc(property: CheckerProperty, global: CheckerGlobalAssumptions): IndependentMonthlyResult[] {
  const modelStartYM = parseYearMonth(global.modelStartDate);
  const opsStartYM = parseYearMonth(property.operationsStartDate);
  const acquisitionYM = property.acquisitionDate ? parseYearMonth(property.acquisitionDate) : opsStartYM;

  const landPct = property.landValuePercent ?? DEFAULT_LAND_VALUE_PERCENT;
  const depreciableBasis = property.purchasePrice * (1 - landPct) + (property.buildingImprovements ?? 0);
  const landValue = property.purchasePrice * landPct;
  const monthlyDepreciation = depreciableBasis / DEPRECIATION_YEARS / 12;

  const totalPropertyValue = property.purchasePrice + (property.buildingImprovements ?? 0);
  const ltv = property.acquisitionLTV ?? DEFAULT_LTV;
  const originalLoanAmount = property.type === "Financed" ? totalPropertyValue * ltv : 0;
  const loanRate = property.acquisitionInterestRate ?? DEFAULT_INTEREST_RATE;
  const loanTerm = property.acquisitionTermYears ?? DEFAULT_TERM_YEARS;
  const monthlyRate = loanRate / 12;
  const totalPayments = loanTerm * 12;
  const monthlyPayment = calculatePMT(originalLoanAmount, monthlyRate, totalPayments);

  const projectionYears = global.projectionYears ?? PROJECTION_YEARS;
  const months = projectionYears * 12;
  const results: IndependentMonthlyResult[] = [];
  let currentAdr = property.startAdr;
  let cumulativeCash = 0;

  const revShareEvents_base = property.revShareEvents ?? DEFAULT_REV_SHARE_EVENTS;
  const revShareFB_base = property.revShareFB ?? DEFAULT_REV_SHARE_FB;
  const revShareOther_base = property.revShareOther ?? DEFAULT_REV_SHARE_OTHER;
  const cateringBoostPct_base = property.cateringBoostPercent ?? DEFAULT_CATERING_BOOST_PCT;
  const cateringBoostMult_base = 1 + cateringBoostPct_base;
  const baseMonthlyRoomRev = property.roomCount * DAYS_PER_MONTH * property.startAdr * property.startOccupancy;
  const baseMonthlyTotalRev = baseMonthlyRoomRev + baseMonthlyRoomRev * revShareEvents_base
    + baseMonthlyRoomRev * revShareFB_base * cateringBoostMult_base + baseMonthlyRoomRev * revShareOther_base;

  for (let i = 0; i < months; i++) {
    const currentYM = addMonthsYM(modelStartYM, i);

    const isOperational = ymNotBefore(currentYM, opsStartYM);
    let monthsSinceOps = 0;
    if (isOperational) {
      monthsSinceOps = diffMonthsYM(currentYM, opsStartYM);
    }

    const opsYear = Math.floor(monthsSinceOps / 12);
    if (isOperational) {
      currentAdr = property.startAdr * Math.pow(1 + property.adrGrowthRate, opsYear);
    }
    const fixedEscalationRate = global.fixedCostEscalationRate ?? global.inflationRate;
    const fixedCostFactor = Math.pow(1 + fixedEscalationRate, opsYear);

    let occupancy = 0;
    if (isOperational) {
      const rampMonths = property.occupancyRampMonths ?? DEFAULT_OCCUPANCY_RAMP_MONTHS;
      const rampSteps = Math.floor(monthsSinceOps / rampMonths);
      occupancy = Math.min(
        property.maxOccupancy,
        property.startOccupancy + (rampSteps * property.occupancyGrowthStep)
      );
    }

    const availableRooms = property.roomCount * DAYS_PER_MONTH;
    const soldRooms = isOperational ? availableRooms * occupancy : 0;
    const revenueRooms = soldRooms * currentAdr;

    const revShareEvents = property.revShareEvents ?? DEFAULT_REV_SHARE_EVENTS;
    const revShareFB = property.revShareFB ?? DEFAULT_REV_SHARE_FB;
    const revShareOther = property.revShareOther ?? DEFAULT_REV_SHARE_OTHER;
    const revenueEvents = revenueRooms * revShareEvents;

    const cateringBoostPct = property.cateringBoostPercent ?? DEFAULT_CATERING_BOOST_PCT;
    const baseFB = revenueRooms * revShareFB;
    const cateringBoostMultiplier = 1 + cateringBoostPct;
    const revenueFB = baseFB * cateringBoostMultiplier;

    const revenueOther = revenueRooms * revShareOther;
    const revenueTotal = revenueRooms + revenueEvents + revenueFB + revenueOther;

    const costRateRooms = property.costRateRooms ?? DEFAULT_COST_RATE_ROOMS;
    const costRateFB = property.costRateFB ?? DEFAULT_COST_RATE_FB;
    const costRateAdmin = property.costRateAdmin ?? DEFAULT_COST_RATE_ADMIN;
    const costRateMarketing = property.costRateMarketing ?? DEFAULT_COST_RATE_MARKETING;
    const costRatePropertyOps = property.costRatePropertyOps ?? DEFAULT_COST_RATE_PROPERTY_OPS;
    const costRateUtilities = property.costRateUtilities ?? DEFAULT_COST_RATE_UTILITIES;
    const costRateInsurance = property.costRateInsurance ?? DEFAULT_COST_RATE_INSURANCE;
    const costRateTaxes = property.costRateTaxes ?? DEFAULT_COST_RATE_TAXES;
    const costRateIT = property.costRateIT ?? DEFAULT_COST_RATE_IT;
    const costRateFFE = property.costRateFFE ?? DEFAULT_COST_RATE_FFE;
    const costRateOther = property.costRateOther ?? DEFAULT_COST_RATE_OTHER;

    const expenseRooms = revenueRooms * costRateRooms;
    const expenseFB = revenueFB * costRateFB;

    const eventExpenseRate = global.eventExpenseRate ?? DEFAULT_EVENT_EXPENSE_RATE;
    const otherExpenseRate = global.otherExpenseRate ?? DEFAULT_OTHER_EXPENSE_RATE;
    const utilitiesVariableSplit = global.utilitiesVariableSplit ?? DEFAULT_UTILITIES_VARIABLE_SPLIT;

    const expenseEvents = revenueEvents * eventExpenseRate;
    const expenseOther = revenueOther * otherExpenseRate;
    const expenseMarketing = revenueTotal * costRateMarketing;
    const expenseUtilitiesVar = revenueTotal * (costRateUtilities * utilitiesVariableSplit);
    const expenseFFE = revenueTotal * costRateFFE;
    const fixedGate = isOperational ? 1 : 0;
    const expenseAdmin = baseMonthlyTotalRev * costRateAdmin * fixedCostFactor * fixedGate;
    const expensePropertyOps = baseMonthlyTotalRev * costRatePropertyOps * fixedCostFactor * fixedGate;
    const expenseIT = baseMonthlyTotalRev * costRateIT * fixedCostFactor * fixedGate;
    const expenseInsurance = (totalPropertyValue / 12) * costRateInsurance * fixedCostFactor * fixedGate;
    const expenseTaxes = (totalPropertyValue / 12) * costRateTaxes * fixedCostFactor * fixedGate;
    const expenseUtilitiesFixed = baseMonthlyTotalRev * (costRateUtilities * (1 - utilitiesVariableSplit)) * fixedCostFactor * fixedGate;
    const expenseOtherCosts = baseMonthlyTotalRev * costRateOther * fixedCostFactor * fixedGate;

    const feeBase = revenueTotal * (property.baseManagementFeeRate ?? DEFAULT_BASE_MANAGEMENT_FEE_RATE);
    const totalOperatingExpenses =
      expenseRooms + expenseFB + expenseEvents + expenseOther +
      expenseMarketing + expensePropertyOps + expenseUtilitiesVar +
      expenseAdmin + expenseIT + expenseUtilitiesFixed + expenseOtherCosts;

    const gop = revenueTotal - totalOperatingExpenses;
    const feeIncentive = Math.max(0, gop * (property.incentiveManagementFeeRate ?? DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE));
    const agop = gop - feeBase - feeIncentive;
    const noi = agop - expenseInsurance - expenseTaxes;
    const anoi = noi - expenseFFE;

    let debtPayment = 0;
    let interestExpense = 0;
    let principalPayment = 0;
    let debtOutstanding = 0;

    const isAcquired = ymNotBefore(currentYM, acquisitionYM);
    let monthsSinceAcquisition = 0;
    if (isAcquired) {
      monthsSinceAcquisition = diffMonthsYM(currentYM, acquisitionYM);
    }

    if (isAcquired && property.type === "Financed" && originalLoanAmount > 0) {
      debtPayment = monthlyPayment;
      let remainingBalance = originalLoanAmount;
      for (let m = 0; m < monthsSinceAcquisition && m < totalPayments; m++) {
        const monthInterest = remainingBalance * monthlyRate;
        const monthPrincipal = monthlyPayment - monthInterest;
        remainingBalance = Math.max(0, remainingBalance - monthPrincipal);
      }
      debtOutstanding = remainingBalance;
      interestExpense = remainingBalance * monthlyRate;
      principalPayment = monthlyPayment - interestExpense;
    }

    const depreciationExpense = isAcquired ? monthlyDepreciation : 0;
    const taxableIncome = anoi - interestExpense - depreciationExpense;
    const incomeTax = taxableIncome > 0 ? taxableIncome * (property.taxRate ?? DEFAULT_TAX_RATE) : 0;
    const netIncome = anoi - interestExpense - depreciationExpense - incomeTax;
    const cashFlow = anoi - debtPayment - incomeTax;

    const accumulatedDepreciation = isAcquired ? Math.min(monthlyDepreciation * (monthsSinceAcquisition + 1), depreciableBasis) : 0;
    const propertyValue = isAcquired ? landValue + depreciableBasis - accumulatedDepreciation : 0;

    const operatingCashFlow = netIncome + depreciationExpense;
    const financingCashFlow = -principalPayment;
    if (isAcquired && monthsSinceAcquisition === 0) {
      cumulativeCash += (property.operatingReserve ?? 0);
    }
    cumulativeCash += cashFlow;

    results.push({
      monthIndex: i,
      occupancy,
      adr: currentAdr,
      availableRooms,
      soldRooms,
      revenueRooms,
      revenueEvents,
      revenueFB,
      revenueOther,
      revenueTotal,
      expenseRooms,
      expenseFB,
      expenseEvents,
      expenseOther,
      totalOperatingExpenses,
      gop,
      agop,
      feeBase,
      feeIncentive,
      expenseInsurance,
      expenseTaxes,
      noi,
      anoi,
      interestExpense,
      principalPayment,
      debtPayment,
      netIncome,
      cashFlow,
      depreciationExpense,
      propertyValue,
      debtOutstanding,
      operatingCashFlow,
      financingCashFlow,
      endingCash: cumulativeCash,
      cashShortfall: cumulativeCash < 0,
      expenseFFE,
      totalExpenses: totalOperatingExpenses + feeBase + feeIncentive + expenseInsurance + expenseTaxes + expenseFFE,
    });
  }

  return results;
}
