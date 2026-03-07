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
import { addMonths, differenceInMonths, isBefore, startOfMonth } from "date-fns";
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
  DEFAULT_COST_RATE_INSURANCE,
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
import { PropertyInput, GlobalInput, MonthlyFinancials } from './types';
import { parseLocalDate } from './utils';

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
  const monthlyDepreciation = buildingValue / DEPRECIATION_YEARS / 12;
  
  // Loan setup
  const totalPropertyValue = property.purchasePrice + (property.buildingImprovements ?? 0);
  const ltv = property.acquisitionLTV ?? DEFAULT_LTV;
  const originalLoanAmount = property.type === "Financed" ? totalPropertyValue * ltv : 0;
  const loanRate = property.acquisitionInterestRate ?? DEFAULT_INTEREST_RATE;
  const loanTerm = property.acquisitionTermYears ?? DEFAULT_TERM_YEARS;
  const taxRate = property.taxRate ?? DEFAULT_TAX_RATE;
  const monthlyRate = loanRate / 12;
  const totalPayments = loanTerm * 12;
  let monthlyPayment = 0;
  if (originalLoanAmount > 0) {
    monthlyPayment = pmt(originalLoanAmount, monthlyRate, totalPayments);
  }
    
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
  
  for (let i = 0; i < months; i++) {
    // ── Temporal gates ──────────────────────────────────────────────────────
    // !isBefore(x, threshold) is used instead of x >= threshold because
    // date-fns isBefore/isAfter do not consider same-day equal. Using
    // !isBefore correctly treats the threshold month as "already active".
    const currentDate = addMonths(modelStart, i);
    const isOperational = !isBefore(currentDate, opsStart);
    const monthsSinceOps = isOperational ? differenceInMonths(currentDate, opsStart) : 0;

    const opsYear = Math.floor(monthsSinceOps / 12);
    const currentAdr = baseAdr * Math.pow(1 + property.adrGrowthRate, opsYear);
    const fixedEscalationRate = global.fixedCostEscalationRate ?? global.inflationRate;
    const fixedCostFactor = Math.pow(1 + fixedEscalationRate, opsYear);

    // ── Occupancy ramp ───────────────────────────────────────────────────────
    // Step-function: occupancy increases by occupancyGrowthStep every
    // occupancyRampMonths until it reaches maxOccupancy.
    let occupancy = 0;
    if (isOperational) {
      const rampMonths = property.occupancyRampMonths ?? DEFAULT_OCCUPANCY_RAMP_MONTHS;
      const rampSteps = Math.floor(monthsSinceOps / rampMonths);
      occupancy = Math.min(
        property.maxOccupancy,
        property.startOccupancy + (rampSteps * property.occupancyGrowthStep)
      );
    }

    // ── Revenue ──────────────────────────────────────────────────────────────
    // Room revenue = rooms × ADR × occupancy × 30.5 days (DAYS_PER_MONTH).
    // Events and F&B are derived from room revenue via revenue-share rates.
    // F&B gets an additional cateringBoostMultiplier (default 1.30).
    const availableRooms = property.roomCount * DAYS_PER_MONTH;
    const soldRooms = isOperational ? availableRooms * occupancy : 0;
    const revenueRooms = soldRooms * currentAdr;

    const revenueEvents = revenueRooms * revShareEvents;
    const baseFB = revenueRooms * revShareFB;
    const revenueFB = baseFB * cateringBoostMultiplier;
    const revenueOther = revenueRooms * revShareOther;
    const revenueTotal = revenueRooms + revenueEvents + revenueFB + revenueOther;

    // ── Department expenses ──────────────────────────────────────────────────
    // Variable costs keyed to each revenue stream.
    // Fixed costs use a gate (fixedGate=0 pre-ops, 1 once operational) and
    // escalate annually at fixedCostEscalationRate.
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
    const eventExpenseRate = global.eventExpenseRate ?? DEFAULT_EVENT_EXPENSE_RATE;
    const otherExpenseRate = global.otherExpenseRate ?? DEFAULT_OTHER_EXPENSE_RATE;
    const utilitiesVariableSplit = global.utilitiesVariableSplit ?? DEFAULT_UTILITIES_VARIABLE_SPLIT;

    const expenseRooms = revenueRooms * costRateRooms;
    const expenseFB = revenueFB * costRateFB;
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
    
    // ── Undistributed expenses + management fees ─────────────────────────────
    // GOP = revenue - dept expenses.
    // feeBase: revenue × flat rate, OR sum of active service fee categories.
    // feeIncentive: GOP × incentive rate, floored at 0 (no negative incentive).
    // USALI Waterfall: AGOP = GOP - fees, NOI = AGOP - fixed charges, ANOI = NOI - FF&E.
    const serviceFeesByCategory: Record<string, number> = {};
    let feeBase: number;
    const activeFeeCategories = property.feeCategories?.filter(c => c.isActive);
    if (activeFeeCategories && activeFeeCategories.length > 0) {
      feeBase = 0;
      for (const cat of activeFeeCategories) {
        const catFee = revenueTotal * cat.rate;
        serviceFeesByCategory[cat.name] = catFee;
        feeBase += catFee;
      }
    } else {
      feeBase = revenueTotal * (property.baseManagementFeeRate ?? DEFAULT_BASE_MANAGEMENT_FEE_RATE);
    }
    
    const totalOperatingExpenses = 
      expenseRooms + expenseFB + expenseEvents + expenseOther + 
      expenseMarketing + expensePropertyOps + expenseUtilitiesVar + 
      expenseAdmin + expenseIT + expenseUtilitiesFixed + expenseOtherCosts;
      
    const gop = revenueTotal - totalOperatingExpenses;
    const feeIncentive = Math.max(0, gop * (property.incentiveManagementFeeRate ?? DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE));
    const agop = gop - feeBase - feeIncentive;
    const noi = agop - expenseInsurance - expenseTaxes;
    const anoi = noi - expenseFFE;
    
    // ── Debt service ──────────────────────────────────────────────────────────
    // PMT = principal × rate / (1 - (1+rate)^-n).
    // Interest = outstandingBalance × monthlyRate (income statement).
    // Principal = PMT - interest (financing activity, NOT on income statement).
    // Debt only accrues after acquisitionDate. Zero for Full Equity properties.
    let debtPayment = 0;
    let interestExpense = 0;
    let principalPayment = 0;
    let debtOutstanding = 0;

    const isAcquired = !isBefore(currentDate, acquisitionDate);
    const monthsSinceAcquisition = isAcquired ? differenceInMonths(currentDate, acquisitionDate) : 0;
    
    if (isAcquired && property.type === "Financed") {
      const r = loanRate / 12;
      const n = loanTerm * 12;
      const loanAmount = originalLoanAmount;
      
      if (loanAmount > 0 && acqDebtMonthCount < n) {
        debtPayment = monthlyPayment;
        
        if (r === 0) {
          const straightLinePrincipal = loanAmount / n;
          principalPayment = straightLinePrincipal;
          interestExpense = 0;
          debtOutstanding = Math.max(0, prevDebtOutstanding - straightLinePrincipal);
        } else {
          interestExpense = prevDebtOutstanding * r;
          principalPayment = monthlyPayment - interestExpense;
          debtOutstanding = Math.max(0, prevDebtOutstanding - principalPayment);
        }
        acqDebtMonthCount++;
      } else if (loanAmount > 0) {
        debtOutstanding = 0;
      }
      prevDebtOutstanding = debtOutstanding;
    }

    // ── Income statement ──────────────────────────────────────────────────────
    // Net Income = NOI - interestExpense - depreciation - incomeTax.
    // Principal is a financing activity and NEVER appears on the income stmt.
    // incomeTax = max(0, taxableIncome × taxRate) — no negative tax modeled.
    const landValue = property.purchasePrice * landPct;
    const depreciationExpense = isAcquired ? monthlyDepreciation : 0;
    const accumulatedDepreciation = isAcquired ? Math.min(monthlyDepreciation * (monthsSinceAcquisition + 1), buildingValue) : 0;
    const propertyValue = isAcquired ? landValue + buildingValue - accumulatedDepreciation : 0;

    const taxableIncome = anoi - interestExpense - depreciationExpense;
    const incomeTax = taxableIncome > 0 ? taxableIncome * taxRate : 0;
    const netIncome = anoi - interestExpense - depreciationExpense - incomeTax;
    
    // ── Cash flow (GAAP indirect method, ASC 230) ────────────────────────────
    // operatingCF = netIncome + depreciation (non-cash add-back).
    // financingCF = -principal (debt repayment is a financing outflow).
    // cashFlow    = ANOI - totalDebtService - incomeTax (before-tax FCF bridge).
    // Operating reserve is seeded at the acquisition month (monthsSinceAcquisition===0)
    // so it is available to cover pre-ops debt service.
    const cashFlow = anoi - debtPayment - incomeTax;

    const operatingCashFlow = netIncome + depreciationExpense;
    const financingCashFlow = -principalPayment;
    if (isAcquired && monthsSinceAcquisition === 0) {
      cumulativeCash += (property.operatingReserve ?? 0);
    }
    cumulativeCash += cashFlow;
    const endingCash = cumulativeCash;

    // ── Balance sheet ─────────────────────────────────────────────────────────
    // propertyValue = land + (building - accumulatedDepreciation) after acquisition.
    // endingCash = cumulative cashFlow + operatingReserve seed (PICK_LAST for yearly).
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
      expenseInsurance,
      expenseTaxes,
      expenseUtilitiesFixed,
      expenseOtherCosts,
      totalExpenses: totalOperatingExpenses + feeBase + feeIncentive + expenseInsurance + expenseTaxes + expenseFFE,
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
            const incomeTax = taxableIncome > 0 ? taxableIncome * taxRate : 0;
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
