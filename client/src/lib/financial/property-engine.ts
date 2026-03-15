/**
 * property-engine — Single-property monthly pro-forma generator
 *
 * Generates a complete MonthlyFinancials[] array for one hotel property over
 * the projection horizon. The 8-step pipeline per month:
 *   1. Temporal gates  — is this month pre-acquisition / pre-operations?
 *   2. Occupancy ramp  — step-function ramp from startOccupancy → maxOccupancy
 *   3. Revenue         — rooms, events, F&B (catering boost), other
 *   4. Dept expenses   — variable costs keyed to each revenue stream
 *   5. Undistributed   — fixed/variable overhead, management fees, FF&E
 *   6. Debt service    — PMT amortization (acquisitionInterestRate / Term)
 *   7. Income stmt     — NOI - interest - depreciation - tax = net income
 *   8. Cash & BS       — GAAP indirect OCF, financing CF, ending cash, balance sheet
 *
 * Operating reserve is seeded into cumulativeCash at the acquisition month
 * (acqMonthIdx) so it counts as available cash from day one.
 *
 * Refinancing is applied in Pass 2 via computeRefinance() from calc/refinance.
 * Pass 2 rebuilds the debt schedule from the refi month onward and re-seeds
 * the operating reserve at acqMonthIdx so the reserve is never lost.
 *
 * Key constants (immutable): DEPRECIATION_YEARS=27.5 (IRS Pub 946),
 * DAYS_PER_MONTH=30.5 (industry standard 365/12).
 */
import { startOfMonth } from "date-fns";
import { pmt } from "@calc/shared/pmt";
import { computeRefinance } from '@calc/refinance';
import { DEFAULT_ACCOUNTING_POLICY } from '@domain/types/accounting-policy';
import { 
  DEFAULT_LTV, 
  DEFAULT_INTEREST_RATE, 
  DEFAULT_TERM_YEARS, 
  DEPRECIATION_YEARS,
  DAYS_PER_MONTH,
  DEFAULT_REV_SHARE_EVENTS,
  DEFAULT_REV_SHARE_FB,
  DEFAULT_REV_SHARE_OTHER,
  DEFAULT_CATERING_BOOST_PCT,
  DEFAULT_COST_RATE_ROOMS,
  DEFAULT_COST_RATE_FB,
  DEFAULT_COST_RATE_ADMIN,
  DEFAULT_COST_RATE_MARKETING,
  DEFAULT_COST_RATE_PROPERTY_OPS,
  DEFAULT_COST_RATE_UTILITIES,
  DEFAULT_COST_RATE_TAXES,
  DEFAULT_COST_RATE_IT,
  DEFAULT_COST_RATE_FFE,
  DEFAULT_COST_RATE_OTHER,
  DEFAULT_EVENT_EXPENSE_RATE,
  DEFAULT_OTHER_EXPENSE_RATE,
  DEFAULT_UTILITIES_VARIABLE_SPLIT,
  PROJECTION_MONTHS,
  DEFAULT_LAND_VALUE_PERCENT,
  DEFAULT_TAX_RATE,
  DEFAULT_REFI_LTV,
  DEFAULT_REFI_CLOSING_COST_RATE,
  DEFAULT_EXIT_CAP_RATE,
  DEFAULT_OCCUPANCY_RAMP_MONTHS,
  DEFAULT_BASE_MANAGEMENT_FEE_RATE,
  DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,
} from '../constants';
import {
  DEFAULT_AR_DAYS,
  DEFAULT_AP_DAYS,
  DEFAULT_ESCALATION_METHOD,
  DEFAULT_COST_SEG_5YR_PCT,
  DEFAULT_COST_SEG_7YR_PCT,
  DEFAULT_COST_SEG_15YR_PCT,
  COST_SEG_5YR_LIFE_MONTHS,
  COST_SEG_7YR_LIFE_MONTHS,
  COST_SEG_15YR_LIFE_MONTHS,
  COST_SEG_5YR_LIFE_YEARS,
  COST_SEG_7YR_LIFE_YEARS,
  COST_SEG_15YR_LIFE_YEARS,
  NOL_UTILIZATION_CAP,
} from '@shared/constants';
import { PropertyInput, GlobalInput, MonthlyFinancials } from './types';
import { parseLocalDate } from './utils';

/** Coerce NaN/Infinity to 0. Prevents silent propagation from bad inputs. */
function safeNum(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

/**
 * Generate a complete month-by-month financial projection for a single property.
 *
 * @param property  Per-property assumptions (rooms, ADR, cost rates, financing, dates).
 *                  acquisitionDate defaults to operationsStartDate when omitted.
 * @param global    Model-wide assumptions (inflation, management fees, SAFE dates).
 * @param months    Projection horizon in months (default: PROJECTION_MONTHS = 120).
 * @returns         Array of MonthlyFinancials, one entry per month from model start.
 *
 * Operating reserve: seeded into cumulativeCash at the month index where
 * acquisitionDate falls (acqMonthIdx). This ensures the reserve covers pre-ops
 * debt service and never appears as a cash inflow in later months.
 */
export function generatePropertyProForma(
  property: PropertyInput, 
  global: GlobalInput, 
  months: number = PROJECTION_MONTHS
): MonthlyFinancials[] {
  const financials: MonthlyFinancials[] = [];
  const modelStart = startOfMonth(parseLocalDate(global.modelStartDate));
  const opsStart = startOfMonth(parseLocalDate(property.operationsStartDate));
  const acquisitionDate = property.acquisitionDate ? startOfMonth(parseLocalDate(property.acquisitionDate)) : opsStart;
  
  // Balance sheet calculations
  const landPct = property.landValuePercent ?? DEFAULT_LAND_VALUE_PERCENT;
  const buildingValue = property.purchasePrice * (1 - landPct) + (property.buildingImprovements ?? 0);

  // ── Cost segregation depreciation setup ─────────────────────────────────
  const costSegEnabled = property.costSegEnabled ?? false;
  let monthlyDepreciation = safeNum(buildingValue / DEPRECIATION_YEARS / 12);
  let costSeg5yrMonthly = 0;
  let costSeg7yrMonthly = 0;
  let costSeg15yrMonthly = 0;
  let costSegRestMonthly = 0;
  let costSeg5yrBasis = 0;
  let costSeg7yrBasis = 0;
  let costSeg15yrBasis = 0;
  let costSegRestBasis = 0;
  if (costSegEnabled) {
    const pct5 = property.costSeg5yrPct ?? DEFAULT_COST_SEG_5YR_PCT;
    const pct7 = property.costSeg7yrPct ?? DEFAULT_COST_SEG_7YR_PCT;
    const pctLong = property.costSeg15yrPct ?? DEFAULT_COST_SEG_15YR_PCT;
    const pctRest = 1 - pct5 - pct7 - pctLong;
    costSeg5yrBasis = buildingValue * pct5;
    costSeg7yrBasis = buildingValue * pct7;
    costSeg15yrBasis = buildingValue * pctLong;
    costSegRestBasis = buildingValue * Math.max(0, pctRest);
    costSeg5yrMonthly = safeNum(costSeg5yrBasis / COST_SEG_5YR_LIFE_YEARS / 12);
    costSeg7yrMonthly = safeNum(costSeg7yrBasis / COST_SEG_7YR_LIFE_YEARS / 12);
    costSeg15yrMonthly = safeNum(costSeg15yrBasis / COST_SEG_15YR_LIFE_YEARS / 12);
    costSegRestMonthly = safeNum(costSegRestBasis / DEPRECIATION_YEARS / 12);
  }
  
  // Loan setup
  const totalPropertyValue = property.purchasePrice + (property.buildingImprovements ?? 0);
  const ltv = property.acquisitionLTV ?? DEFAULT_LTV;
  const originalLoanAmount = property.type === "Financed" ? totalPropertyValue * ltv : 0;
  const loanRate = property.acquisitionInterestRate ?? DEFAULT_INTEREST_RATE;
  const loanTerm = property.acquisitionTermYears ?? DEFAULT_TERM_YEARS;
  const taxRate = property.taxRate ?? DEFAULT_TAX_RATE;
  const dayCountConvention = property.dayCountConvention ?? '30/360';
  const monthlyRate = loanRate / 12;
  const totalPayments = loanTerm * 12;
  let monthlyPayment = 0;
  if (originalLoanAmount > 0) {
    monthlyPayment = safeNum(pmt(originalLoanAmount, monthlyRate, totalPayments));
  }

  // ── Working capital setup ──────────────────────────────────────────────
  const arDays = property.arDays ?? DEFAULT_AR_DAYS;
  const apDays = property.apDays ?? DEFAULT_AP_DAYS;
  let prevAR = 0;
  let prevAP = 0;

  // ── Escalation method setup ────────────────────────────────────────────
  const escalationMethod = property.escalationMethod ?? DEFAULT_ESCALATION_METHOD;

  // ── NOL carryforward tracking ──────────────────────────────────────────
  let nolBalance = 0;
    
  let cumulativeCash = 0;
  let prevDebtOutstanding = originalLoanAmount;
  let acqDebtMonthCount = 0;

  const baseAdr = property.startAdr;

  // Base monthly revenue for fixed cost anchoring
  const baseMonthlyRoomRev = property.roomCount * DAYS_PER_MONTH * baseAdr * property.startOccupancy;
  const revShareEvents = property.revShareEvents ?? DEFAULT_REV_SHARE_EVENTS;
  const revShareFB = property.revShareFB ?? DEFAULT_REV_SHARE_FB;
  const revShareOther = property.revShareOther ?? DEFAULT_REV_SHARE_OTHER;
  const cateringBoostPct = property.cateringBoostPercent ?? DEFAULT_CATERING_BOOST_PCT;
  const cateringBoostMultiplier = 1 + cateringBoostPct;
  const baseMonthlyEventsRev = baseMonthlyRoomRev * revShareEvents;
  const baseMonthlyFBRev = baseMonthlyRoomRev * revShareFB * cateringBoostMultiplier;
  const baseMonthlyOtherRev = baseMonthlyRoomRev * revShareOther;
  const baseMonthlyTotalRev = baseMonthlyRoomRev + baseMonthlyEventsRev + baseMonthlyFBRev + baseMonthlyOtherRev;

  // ── Pre-computed month indices (Task 1: eliminate date-fns from hot loop) ──
  const startYear = modelStart.getFullYear();
  const startMonth = modelStart.getMonth();
  const opsStartIdx = (opsStart.getFullYear() - startYear) * 12 + (opsStart.getMonth() - startMonth);
  const acqMonthIdx = (acquisitionDate.getFullYear() - startYear) * 12 + (acquisitionDate.getMonth() - startMonth);

  // ── Pre-computed days-in-month lookup for ACT/360 and ACT/365 ──
  const needsDaysLookup = dayCountConvention === 'ACT/360' || dayCountConvention === 'ACT/365';
  const daysInMonthLookup: number[] = needsDaysLookup ? new Array(months) : [];
  if (needsDaysLookup) {
    for (let i = 0; i < months; i++) {
      const totalM = startMonth + i;
      const y = startYear + Math.floor(totalM / 12);
      const m = totalM % 12;
      daysInMonthLookup[i] = new Date(y, m + 1, 0).getDate();
    }
  }

  // ── Hoisted loop-invariant default resolutions (Task 3) ──
  const costRateRooms = property.costRateRooms ?? DEFAULT_COST_RATE_ROOMS;
  const costRateFB = property.costRateFB ?? DEFAULT_COST_RATE_FB;
  const costRateAdmin = property.costRateAdmin ?? DEFAULT_COST_RATE_ADMIN;
  const costRateMarketing = property.costRateMarketing ?? DEFAULT_COST_RATE_MARKETING;
  const costRatePropertyOps = property.costRatePropertyOps ?? DEFAULT_COST_RATE_PROPERTY_OPS;
  const costRateUtilities = property.costRateUtilities ?? DEFAULT_COST_RATE_UTILITIES;
  const costRateTaxes = property.costRateTaxes ?? DEFAULT_COST_RATE_TAXES;
  const costRateIT = property.costRateIT ?? DEFAULT_COST_RATE_IT;
  const costRateFFE = property.costRateFFE ?? DEFAULT_COST_RATE_FFE;
  const costRateOther = property.costRateOther ?? DEFAULT_COST_RATE_OTHER;
  const eventExpenseRate = global.eventExpenseRate ?? DEFAULT_EVENT_EXPENSE_RATE;
  const otherExpenseRate = global.otherExpenseRate ?? DEFAULT_OTHER_EXPENSE_RATE;
  const utilitiesVariableSplit = global.utilitiesVariableSplit ?? DEFAULT_UTILITIES_VARIABLE_SPLIT;
  const utilitiesFixedSplit = 1 - utilitiesVariableSplit;
  const adrGrowthRate = property.adrGrowthRate ?? 0;
  const effectiveInflation = property.inflationRate ?? global.inflationRate;
  const fixedEscalationRate = global.fixedCostEscalationRate ?? effectiveInflation;
  const incentiveFeeRate = property.incentiveManagementFeeRate ?? DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE;
  const baseMgmtFeeRate = property.baseManagementFeeRate ?? DEFAULT_BASE_MANAGEMENT_FEE_RATE;
  const activeFeeCategories = property.feeCategories?.filter(c => c.isActive);
  const hasActiveFeeCategories = activeFeeCategories && activeFeeCategories.length > 0;
  const rampMonths = Math.max(1, property.occupancyRampMonths ?? DEFAULT_OCCUPANCY_RAMP_MONTHS);
  const availableRooms = property.roomCount * DAYS_PER_MONTH;
  const totalPropertyValueDiv12 = totalPropertyValue / 12;
  const isFinanced = property.type === "Financed";
  const loanN = loanTerm * 12;

  // ── Pre-computed escalation factor arrays (Task 2) ──
  const maxMonthsSinceOps = opsStartIdx < 0 ? months - 1 + Math.abs(opsStartIdx) : months - 1;
  const maxOpsYear = Math.floor(maxMonthsSinceOps / 12) + 1;
  const adrFactors = new Array(maxOpsYear);
  const fixedEscFactors = new Array(maxOpsYear);
  for (let y = 0; y < maxOpsYear; y++) {
    adrFactors[y] = safeNum(Math.pow(1 + adrGrowthRate, y));
    fixedEscFactors[y] = safeNum(Math.pow(1 + fixedEscalationRate, y));
  }
  const monthlyEscRate = escalationMethod === 'monthly' ? Math.pow(1 + fixedEscalationRate, 1 / 12) - 1 : 0;

  for (let i = 0; i < months; i++) {
    // ── Temporal gates (index arithmetic instead of date-fns) ────────────────
    const isOperational = i >= opsStartIdx;
    const monthsSinceOps = isOperational ? i - opsStartIdx : 0;

    const opsYear = Math.floor(monthsSinceOps / 12);
    const currentAdr = safeNum(baseAdr * adrFactors[opsYear]);
    let fixedCostFactor: number;
    if (escalationMethod === 'monthly') {
      fixedCostFactor = safeNum(Math.pow(1 + monthlyEscRate, monthsSinceOps));
    } else {
      fixedCostFactor = fixedEscFactors[opsYear];
    }

    // ── Occupancy ramp ───────────────────────────────────────────────────────
    let occupancy = 0;
    if (isOperational) {
      const rampSteps = Math.floor(monthsSinceOps / rampMonths);
      occupancy = Math.min(
        property.maxOccupancy,
        property.startOccupancy + (rampSteps * property.occupancyGrowthStep)
      );
    }

    // ── Revenue ──────────────────────────────────────────────────────────────
    const soldRooms = isOperational ? availableRooms * occupancy : 0;
    const revenueRooms = soldRooms * currentAdr;

    const revenueEvents = revenueRooms * revShareEvents;
    const baseFB = revenueRooms * revShareFB;
    const revenueFB = baseFB * cateringBoostMultiplier;
    const revenueOther = revenueRooms * revShareOther;
    const revenueTotal = revenueRooms + revenueEvents + revenueFB + revenueOther;

    // ── Department expenses ──────────────────────────────────────────────────
    const expenseRooms = revenueRooms * costRateRooms;
    const expenseFB = revenueFB * costRateFB;
    const expenseEvents = revenueEvents * eventExpenseRate;
    const expenseOther = revenueOther * otherExpenseRate;
    const expenseMarketing = revenueTotal * costRateMarketing;
    const expenseUtilitiesVar = revenueTotal * (costRateUtilities * utilitiesVariableSplit);
    const expenseFFE = revenueTotal * costRateFFE;

    const fixedGate = isOperational ? 1 : 0;
    const fixedCostFactorGated = fixedCostFactor * fixedGate;
    const expenseAdmin = baseMonthlyTotalRev * costRateAdmin * fixedCostFactorGated;
    const expensePropertyOps = baseMonthlyTotalRev * costRatePropertyOps * fixedCostFactorGated;
    const expenseIT = baseMonthlyTotalRev * costRateIT * fixedCostFactorGated;
    const expenseTaxes = totalPropertyValueDiv12 * costRateTaxes * fixedCostFactorGated;
    const expenseUtilitiesFixed = baseMonthlyTotalRev * (costRateUtilities * utilitiesFixedSplit) * fixedCostFactorGated;
    const expenseOtherCosts = baseMonthlyTotalRev * costRateOther * fixedCostFactorGated;
    
    // ── Undistributed expenses + management fees ─────────────────────────────
    const serviceFeesByCategory: Record<string, number> = {};
    let feeBase: number;
    if (hasActiveFeeCategories) {
      feeBase = 0;
      for (const cat of activeFeeCategories!) {
        const catFee = revenueTotal * cat.rate;
        serviceFeesByCategory[cat.name] = catFee;
        feeBase += catFee;
      }
    } else {
      feeBase = revenueTotal * baseMgmtFeeRate;
    }
    
    const totalOperatingExpenses = 
      expenseRooms + expenseFB + expenseEvents + expenseOther + 
      expenseMarketing + expensePropertyOps + expenseUtilitiesVar + 
      expenseAdmin + expenseIT + expenseUtilitiesFixed + expenseOtherCosts;
      
    const gop = revenueTotal - totalOperatingExpenses;
    const feeIncentive = Math.max(0, gop * incentiveFeeRate);
    const agop = gop - feeBase - feeIncentive;
    const noi = agop - expenseTaxes;
    const anoi = noi - expenseFFE;
    
    // ── Debt service ──────────────────────────────────────────────────────────
    let debtPayment = 0;
    let interestExpense = 0;
    let principalPayment = 0;
    let debtOutstanding = 0;

    const isAcquired = i >= acqMonthIdx;
    const monthsSinceAcquisition = isAcquired ? i - acqMonthIdx : 0;
    
    if (isAcquired && isFinanced) {
      if (originalLoanAmount > 0 && acqDebtMonthCount < loanN) {
        debtPayment = monthlyPayment;
        
        if (loanRate === 0) {
          const straightLinePrincipal = originalLoanAmount / loanN;
          principalPayment = straightLinePrincipal;
          interestExpense = 0;
          debtOutstanding = Math.max(0, prevDebtOutstanding - straightLinePrincipal);
        } else {
          let effectiveMonthlyRate: number;
          if (dayCountConvention === 'ACT/360') {
            effectiveMonthlyRate = loanRate * daysInMonthLookup[i] / 360;
          } else if (dayCountConvention === 'ACT/365') {
            effectiveMonthlyRate = loanRate * daysInMonthLookup[i] / 365;
          } else {
            effectiveMonthlyRate = monthlyRate;
          }
          interestExpense = prevDebtOutstanding * effectiveMonthlyRate;
          principalPayment = monthlyPayment - interestExpense;
          debtOutstanding = Math.max(0, prevDebtOutstanding - principalPayment);
        }
        acqDebtMonthCount++;
      } else if (originalLoanAmount > 0) {
        debtOutstanding = 0;
      }
      prevDebtOutstanding = debtOutstanding;
    }

    // ── Current date for output (computed via arithmetic, no date-fns) ────────
    const currentDate = new Date(startYear, startMonth + i, 1);

    // ── Income statement ──────────────────────────────────────────────────────
    const landValue = property.purchasePrice * landPct;
    let depreciationExpense: number;
    let accumulatedDepreciation: number;
    if (!isAcquired) {
      depreciationExpense = 0;
      accumulatedDepreciation = 0;
    } else if (costSegEnabled) {
      const dep5 = monthsSinceAcquisition < COST_SEG_5YR_LIFE_MONTHS ? costSeg5yrMonthly : 0;
      const dep7 = monthsSinceAcquisition < COST_SEG_7YR_LIFE_MONTHS ? costSeg7yrMonthly : 0;
      const dep15 = monthsSinceAcquisition < COST_SEG_15YR_LIFE_MONTHS ? costSeg15yrMonthly : 0;
      const depRest = monthsSinceAcquisition < DEPRECIATION_YEARS * 12 ? costSegRestMonthly : 0;
      depreciationExpense = dep5 + dep7 + dep15 + depRest;
      const accDep5 = Math.min(costSeg5yrMonthly * (monthsSinceAcquisition + 1), costSeg5yrBasis);
      const accDep7 = Math.min(costSeg7yrMonthly * (monthsSinceAcquisition + 1), costSeg7yrBasis);
      const accDep15 = Math.min(costSeg15yrMonthly * (monthsSinceAcquisition + 1), costSeg15yrBasis);
      const accDepRest = Math.min(costSegRestMonthly * (monthsSinceAcquisition + 1), costSegRestBasis);
      accumulatedDepreciation = accDep5 + accDep7 + accDep15 + accDepRest;
    } else {
      depreciationExpense = monthlyDepreciation;
      accumulatedDepreciation = Math.min(monthlyDepreciation * (monthsSinceAcquisition + 1), buildingValue);
    }
    const propertyValue = isAcquired ? landValue + buildingValue - accumulatedDepreciation : 0;

    // ── NOL carryforward (IRC §172) ──────────────────────────────────────────
    const preTaxIncome = anoi - interestExpense - depreciationExpense;
    let incomeTax: number;
    if (preTaxIncome < 0) {
      nolBalance += Math.abs(preTaxIncome);
      incomeTax = 0;
    } else if (nolBalance > 0) {
      const maxUtilization = preTaxIncome * NOL_UTILIZATION_CAP;
      const nolUsed = Math.min(nolBalance, maxUtilization);
      const adjustedIncome = preTaxIncome - nolUsed;
      nolBalance -= nolUsed;
      incomeTax = adjustedIncome > 0 ? adjustedIncome * taxRate : 0;
    } else {
      incomeTax = preTaxIncome > 0 ? preTaxIncome * taxRate : 0;
    }
    const netIncome = anoi - interestExpense - depreciationExpense - incomeTax;

    // ── Working capital (AR/AP tracking) ──────────────────────────────────────
    const currentAR = isOperational ? (revenueTotal / 30) * arDays : 0;
    const totalOpCosts = totalOperatingExpenses + feeBase + feeIncentive + expenseTaxes;
    const currentAP = isOperational ? (totalOpCosts / 30) * apDays : 0;
    const workingCapitalChange = (currentAR - prevAR) - (currentAP - prevAP);
    prevAR = currentAR;
    prevAP = currentAP;
    
    // ── Cash flow (GAAP indirect method, ASC 230) ────────────────────────────
    const cashFlow = anoi - debtPayment - incomeTax;

    const operatingCashFlow = netIncome + depreciationExpense;
    const financingCashFlow = -principalPayment;
    if (isAcquired && monthsSinceAcquisition === 0) {
      cumulativeCash += (property.operatingReserve ?? 0);
    }
    cumulativeCash += cashFlow;
    const endingCash = cumulativeCash;

    financials.push({
      date: currentDate,
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
      expenseMarketing,
      expensePropertyOps,
      expenseUtilitiesVar,
      expenseFFE,
      feeBase,
      feeIncentive,
      serviceFeesByCategory,
      expenseAdmin,
      expenseIT,
      expenseTaxes,
      expenseUtilitiesFixed,
      expenseOtherCosts,
      totalExpenses: totalOperatingExpenses + feeBase + feeIncentive + expenseTaxes + expenseFFE,
      gop,
      agop,
      noi,
      anoi,
      interestExpense,
      principalPayment,
      debtPayment,
      netIncome,
      incomeTax,
      cashFlow,
      depreciationExpense,
      propertyValue,
      debtOutstanding,
      refinancingProceeds: 0,
      operatingCashFlow,
      financingCashFlow,
      endingCash,
      accountsReceivable: currentAR,
      accountsPayable: currentAP,
      workingCapitalChange,
      nolBalance,
      cashShortfall: endingCash < 0,
    });
  }

  // --- PASS 2: Refinance post-processing ---
  if (property.willRefinance === "Yes" && property.refinanceDate) {
    const refiDate = startOfMonth(parseLocalDate(property.refinanceDate));
    const refiMonthIndex = (refiDate.getFullYear() - modelStart.getFullYear()) * 12 +
                           (refiDate.getMonth() - modelStart.getMonth());

    if (refiMonthIndex >= 0 && refiMonthIndex < months) {
      const refiYear = Math.floor(refiMonthIndex / 12);
      const projectionYears = Math.ceil(months / 12);
      const yearlyNOI: number[] = [];
      const yearlyOperationalMonths: number[] = [];
      for (let y = 0; y < projectionYears; y++) {
        const yearSlice = financials.slice(y * 12, (y + 1) * 12);
        yearlyNOI.push(yearSlice.reduce((sum, m) => sum + m.noi, 0));
        yearlyOperationalMonths.push(yearSlice.filter(m => m.revenueTotal > 0 || m.anoi !== 0).length);
      }

      const refiLTV = property.refinanceLTV ?? DEFAULT_REFI_LTV;
      const refiExitCap = property.exitCapRate ?? global.exitCapRate ?? DEFAULT_EXIT_CAP_RATE;
      const rawRefiYearNOI = yearlyNOI[refiYear] || 0;
      const refiYearOpsMonths = yearlyOperationalMonths[refiYear] || 12;
      const stabilizedNOI = refiYearOpsMonths >= 12
        ? rawRefiYearNOI
        : refiYearOpsMonths > 0
          ? (rawRefiYearNOI / refiYearOpsMonths) * 12
          : 0;
      const refiRate = property.refinanceInterestRate ?? DEFAULT_INTEREST_RATE;
      const refiTermYears = property.refinanceTermYears ?? DEFAULT_TERM_YEARS;
      const closingCostRate = property.refinanceClosingCostRate ?? DEFAULT_REFI_CLOSING_COST_RATE;
      const existingDebt = refiMonthIndex > 0 ? financials[refiMonthIndex - 1].debtOutstanding : originalLoanAmount;

      const refiOutput = computeRefinance({
        refinance_date: property.refinanceDate!,
        current_loan_balance: existingDebt,
        valuation: { method: "noi_cap", stabilized_noi: stabilizedNOI, cap_rate: refiExitCap },
        ltv_max: refiLTV,
        closing_cost_pct: closingCostRate,
        prepayment_penalty: { type: "none", value: 0 },
        new_loan_terms: {
          rate_annual: refiRate,
          term_months: refiTermYears * 12,
          amortization_months: refiTermYears * 12,
          io_months: 0,
        },
        accounting_policy_ref: DEFAULT_ACCOUNTING_POLICY,
        rounding_policy: { precision: 2, bankers_rounding: false },
      });

      if (refiOutput.flags.invalid_inputs.length === 0) {
        const refiProceeds = refiOutput.cash_out_to_equity;
        const schedule = refiOutput.new_debt_service_schedule;

        const acqMonthIdx = (acquisitionDate.getFullYear() - modelStart.getFullYear()) * 12 +
                            (acquisitionDate.getMonth() - modelStart.getMonth());
        let cumCash = 0;
        let refiNolBalance = refiMonthIndex > 0 ? financials[refiMonthIndex - 1].nolBalance : 0;
        for (let i = 0; i < months; i++) {
          const m = financials[i];

          if (i < refiMonthIndex) {
            if (i === acqMonthIdx) {
              cumCash += (property.operatingReserve ?? 0);
            }
            cumCash += m.cashFlow;
            m.endingCash = cumCash;
            m.cashShortfall = cumCash < 0;
          } else {
            const monthsSinceRefi = i - refiMonthIndex;

            let debtPayment = 0;
            let interestExpense = 0;
            let principalPayment = 0;
            let debtOutstanding = 0;

            if (monthsSinceRefi < schedule.length) {
              const entry = schedule[monthsSinceRefi];
              interestExpense = entry.interest;
              principalPayment = entry.principal;
              debtPayment = entry.payment;
              debtOutstanding = entry.ending_balance;
            }

            const taxableIncome = m.anoi - interestExpense - m.depreciationExpense;
            let incomeTax: number;
            if (taxableIncome < 0) {
              refiNolBalance += Math.abs(taxableIncome);
              incomeTax = 0;
            } else if (refiNolBalance > 0) {
              const maxUtil = taxableIncome * NOL_UTILIZATION_CAP;
              const nolUsed = Math.min(refiNolBalance, maxUtil);
              refiNolBalance -= nolUsed;
              incomeTax = (taxableIncome - nolUsed) > 0 ? (taxableIncome - nolUsed) * taxRate : 0;
            } else {
              incomeTax = taxableIncome > 0 ? taxableIncome * taxRate : 0;
            }
            m.nolBalance = refiNolBalance;
            const netIncome = m.anoi - interestExpense - m.depreciationExpense - incomeTax;
            const cashFlow = m.anoi - debtPayment - incomeTax;
            const operatingCashFlow = netIncome + m.depreciationExpense;
            const financingCashFlow = -principalPayment;

            const proceeds = (i === refiMonthIndex) ? refiProceeds : 0;

            m.interestExpense = interestExpense;
            m.principalPayment = principalPayment;
            m.debtPayment = debtPayment;
            m.debtOutstanding = debtOutstanding;
            m.incomeTax = incomeTax;
            m.netIncome = netIncome;
            m.cashFlow = cashFlow + proceeds;
            m.operatingCashFlow = operatingCashFlow;
            m.financingCashFlow = financingCashFlow + proceeds;
            m.refinancingProceeds = proceeds;

            cumCash += m.cashFlow;
            m.endingCash = cumCash;
            m.cashShortfall = cumCash < 0;
          }
        }
      }
    }
  }

  return financials;
}
