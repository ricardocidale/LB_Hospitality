/**
 * financialEngine.ts — The Core Property Pro Forma Calculator
 *
 * This is the heart of the financial modeling system. It takes a single property's
 * assumptions (room count, ADR, occupancy, purchase price, financing terms, etc.)
 * and produces a month-by-month financial projection for up to 10 years (120 months).
 *
 * The output is an array of MonthlyFinancials objects — one per month — containing:
 *   - Revenue breakdown (rooms, F&B, events, other)
 *   - Operating expenses (variable costs that scale with revenue + fixed costs that escalate with inflation)
 *   - Gross Operating Profit (GOP), Net Operating Income (NOI), Net Income
 *   - Debt service (interest + principal, split per GAAP ASC 470)
 *   - Balance sheet fields (property value with depreciation, debt outstanding)
 *   - Cash flow statement fields (operating CF, financing CF, ending cash per ASC 230)
 *
 * Key accounting standards followed:
 *   - ASC 606: Revenue recognized when room nights are consumed (point-in-time)
 *   - ASC 360: Property depreciated over 27.5 years straight-line (land excluded)
 *   - ASC 470: Interest hits the income statement; principal is balance-sheet only
 *   - ASC 230: Cash flow split into operating and financing activities (indirect method)
 *   - USALI: Uniform System of Accounts for the Lodging Industry (hotel P&L structure)
 *
 * This file also contains generateCompanyProForma(), which models the management
 * company's own P&L. The management company earns fees from properties (base fee
 * on revenue + incentive fee on GOP) and has its own overhead (staff, office, etc.).
 *
 * Data flow: PropertyInput + GlobalInput → generatePropertyProForma() → MonthlyFinancials[]
 */
import { addMonths, differenceInMonths, isBefore, startOfMonth } from "date-fns";
import { pmt } from "@calc/shared/pmt";

/**
 * Parse a date string into a Date object, handling both ISO format ("2026-04-01T00:00:00")
 * and plain date format ("2026-04-01"). The plain format gets "T00:00:00" appended to
 * prevent timezone-related off-by-one-day errors that happen with new Date("2026-04-01").
 */
function parseLocalDate(dateStr: string): Date {
  if (dateStr.includes('T')) return new Date(dateStr);
  return new Date(dateStr + 'T00:00:00');
}
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
  DEFAULT_STAFF_SALARY,
  DEFAULT_OFFICE_LEASE,
  DEFAULT_PROFESSIONAL_SERVICES,
  DEFAULT_TECH_INFRA,
  DEFAULT_BUSINESS_INSURANCE,
  DEFAULT_TRAVEL_PER_CLIENT,
  DEFAULT_IT_LICENSE_PER_CLIENT,
  DEFAULT_MARKETING_RATE,
  DEFAULT_MISC_OPS_RATE,
  DEFAULT_SAFE_TRANCHE,
  DEFAULT_PARTNER_COMP,
  DEFAULT_EVENT_EXPENSE_RATE,
  DEFAULT_OTHER_EXPENSE_RATE,
  DEFAULT_UTILITIES_VARIABLE_SPLIT,
  PROJECTION_MONTHS,
  STAFFING_TIERS,
  DEFAULT_LAND_VALUE_PERCENT,
  DEFAULT_TAX_RATE,
  DEFAULT_REFI_LTV,
  DEFAULT_REFI_CLOSING_COST_RATE,
  DEFAULT_EXIT_CAP_RATE,
  DEFAULT_OCCUPANCY_RAMP_MONTHS,
  DEFAULT_BASE_MANAGEMENT_FEE_RATE,
  DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,
  DEFAULT_SERVICE_FEE_CATEGORIES,
} from './constants';
import { computeRefinance } from '@calc/refinance';

import { DEFAULT_ACCOUNTING_POLICY } from '@domain/types/accounting-policy';

/**
 * Determine which fiscal year a given month belongs to.
 *
 * Fiscal years don't always start in January. For example, if the fiscal year
 * starts in April, then April 2026 through March 2027 is "FY 2026".
 * This function figures out the correct label for any month in the projection.
 *
 * @param modelStartDate When the financial model begins (e.g., "2026-04-01")
 * @param fiscalYearStartMonth Which month the fiscal year starts (1=Jan, 4=Apr, etc.)
 * @param monthIndex 0-based index from the model start date
 * @returns The fiscal year number (e.g., 2026)
 */
export function getFiscalYearLabel(
  modelStartDate: string,
  fiscalYearStartMonth: number,
  monthIndex: number
): number {
  const startDate = startOfMonth(parseLocalDate(modelStartDate));
  const currentDate = addMonths(startDate, monthIndex);
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();
  
  // Fiscal year is labeled by the year when it starts
  // If fiscal year starts in January, then Jan-Dec 2026 = FY 2026
  // If fiscal year starts in April, then Apr 2026 - Mar 2027 = FY 2026
  if (currentMonth >= fiscalYearStartMonth) {
    return currentYear;
  } else {
    return currentYear - 1;
  }
}

// Get the fiscal year label for a model year index (0-9)
export function getFiscalYearForModelYear(
  modelStartDate: string,
  fiscalYearStartMonth: number,
  yearIndex: number
): number {
  // Use the first month of the model year to determine fiscal year
  const firstMonthOfYear = yearIndex * 12;
  return getFiscalYearLabel(modelStartDate, fiscalYearStartMonth, firstMonthOfYear);
}

/**
 * PropertyInput — All the assumptions needed to model a single hotel property.
 *
 * This mirrors the database schema for a property record. Key groups:
 *   - Identity: room count, property type (Financed vs All Cash)
 *   - Revenue: starting ADR, ADR growth rate, occupancy ramp-up schedule
 *   - Acquisition: purchase price, building improvements, land value split
 *   - Financing: LTV ratio, interest rate, loan term (only for Financed properties)
 *   - Refinancing: whether/when to refinance, new loan terms
 *   - Operating costs: rates for each expense category (rooms, F&B, admin, etc.)
 *   - Revenue shares: what percentage of room revenue goes to events, F&B, other
 *   - Management fees: base fee rate on revenue, incentive fee rate on GOP
 */
interface PropertyInput {
  operationsStartDate: string;
  acquisitionDate?: string; // For balance sheet timing - defaults to operationsStartDate
  roomCount: number;
  startAdr: number;
  adrGrowthRate: number;
  startOccupancy: number;
  maxOccupancy: number;
  occupancyRampMonths: number;
  occupancyGrowthStep: number;
  purchasePrice: number;
  buildingImprovements?: number | null;
  landValuePercent?: number | null;
  type: string;
  // Financing
  acquisitionLTV?: number | null;
  acquisitionInterestRate?: number | null;
  acquisitionTermYears?: number | null;
  taxRate?: number | null;
  // Refinance
  willRefinance?: string | null;
  refinanceDate?: string | null;
  refinanceLTV?: number | null;
  refinanceInterestRate?: number | null;
  refinanceTermYears?: number | null;
  refinanceClosingCostRate?: number | null;
  exitCapRate?: number | null;
  // Disposition
  dispositionCommission?: number | null;
  // Operating reserve (seeds initial cash at acquisition)
  operatingReserve?: number | null;
  // Refinance timing
  refinanceYearsAfterAcquisition?: number | null;
  // Operating Cost Rates (should sum to ~84% of revenue)
  costRateRooms: number;
  costRateFB: number;
  costRateAdmin: number;
  costRateMarketing: number;
  costRatePropertyOps: number;
  costRateUtilities: number;
  costRateInsurance: number;
  costRateTaxes: number;
  costRateIT: number;
  costRateFFE: number;
  costRateOther: number;
  // Revenue Streams
  revShareEvents: number;
  revShareFB: number;
  revShareOther: number;
  // Catering boost (percentage uplift applied to F&B revenue)
  cateringBoostPercent?: number;
  // Management company fee rates (per-property)
  baseManagementFeeRate?: number;
  incentiveManagementFeeRate?: number;
  // Service fee categories (replaces single baseManagementFeeRate when present)
  feeCategories?: { name: string; rate: number; isActive: boolean }[];
  // Property identity (for keying breakdowns)
  id?: number;
  name?: string;
}

/**
 * GlobalInput — System-wide assumptions that apply to all properties and the
 * management company. These are set once and shared across the entire model.
 *
 * Includes: model timeline, inflation, staffing tiers, partner compensation,
 * corporate overhead, funding instrument (SAFE notes), debt defaults, and exit assumptions.
 */
interface GlobalInput {
  modelStartDate: string;
  projectionYears?: number;
  companyOpsStartDate?: string;
  fiscalYearStartMonth?: number; // 1 = January, 4 = April, etc.
  inflationRate: number;
  fixedCostEscalationRate?: number;
  marketingRate: number;
  // Funding Instrument
  safeTranche1Amount?: number;
  safeTranche1Date?: string;
  safeTranche2Amount?: number;
  safeTranche2Date?: string;
  // Staffing tiers
  staffTier1MaxProperties?: number;
  staffTier1Fte?: number;
  staffTier2MaxProperties?: number;
  staffTier2Fte?: number;
  staffTier3Fte?: number;
  // Management company cost parameters - yearly partner compensation and count
  partnerCompYear1?: number;
  partnerCompYear2?: number;
  partnerCompYear3?: number;
  partnerCompYear4?: number;
  partnerCompYear5?: number;
  partnerCompYear6?: number;
  partnerCompYear7?: number;
  partnerCompYear8?: number;
  partnerCompYear9?: number;
  partnerCompYear10?: number;
  partnerCountYear1?: number;
  partnerCountYear2?: number;
  partnerCountYear3?: number;
  partnerCountYear4?: number;
  partnerCountYear5?: number;
  partnerCountYear6?: number;
  partnerCountYear7?: number;
  partnerCountYear8?: number;
  partnerCountYear9?: number;
  partnerCountYear10?: number;
  staffSalary?: number;
  officeLeaseStart?: number;
  professionalServicesStart?: number;
  techInfraStart?: number;
  businessInsuranceStart?: number;
  travelCostPerClient?: number;
  itLicensePerClient?: number;
  miscOpsRate?: number;
  // Expense rates (configurable)
  eventExpenseRate?: number;
  otherExpenseRate?: number;
  utilitiesVariableSplit?: number;
  // Exit & Sale
  exitCapRate?: number;
  salesCommissionRate?: number;
  debtAssumptions: {
    interestRate: number;
    amortizationYears: number;
    acqLTV?: number;
    refiLTV?: number;
    refiClosingCostRate?: number;
  };
}

export interface MonthlyFinancials {
  date: Date;
  monthIndex: number;
  occupancy: number;
  adr: number;
  availableRooms: number;
  soldRooms: number;
  revenueRooms: number;
  revenueEvents: number;
  revenueFB: number;
  revenueOther: number;
  revenueTotal: number;
  expenseRooms: number;
  expenseFB: number;
  expenseEvents: number;
  expenseOther: number;
  expenseMarketing: number;
  expensePropertyOps: number;
  expenseUtilitiesVar: number;
  expenseFFE: number;
  feeBase: number;
  feeIncentive: number;
  serviceFeesByCategory: Record<string, number>;
  expenseAdmin: number;
  expenseIT: number;
  expenseInsurance: number;
  expenseTaxes: number;
  expenseUtilitiesFixed: number;
  expenseOtherCosts: number;
  totalExpenses: number;
  gop: number;
  noi: number;
  interestExpense: number;
  principalPayment: number;
  debtPayment: number;
  netIncome: number;
  incomeTax: number;
  cashFlow: number;
  // Balance sheet fields for auditor verification
  depreciationExpense: number;
  propertyValue: number;
  debtOutstanding: number;
  // Refinance
  refinancingProceeds: number;
  // Cash flow statement fields for GAAP verification (ASC 230)
  operatingCashFlow: number;
  financingCashFlow: number;
  endingCash: number;
  // Negative cash detection (mandatory business rule)
  cashShortfall: boolean;
}

/**
 * Generate a complete month-by-month financial projection for a single property.
 *
 * This is the main calculation function. It runs in two passes:
 *
 * PASS 1 (lines below): For each month, calculate:
 *   - Occupancy (ramps up gradually because a new hotel doesn't fill instantly)
 *   - Revenue (rooms × ADR × occupancy, plus F&B, events, other streams)
 *   - Variable expenses (scale with revenue: rooms dept, F&B, marketing, etc.)
 *   - Fixed expenses (dollar-based, escalate annually with inflation, not revenue)
 *   - GOP, management fees, NOI
 *   - Debt service (PMT-based amortization for financed properties)
 *   - Depreciation (27.5-year straight-line, land excluded)
 *   - Net Income (NOI - interest - depreciation - tax)
 *   - Cash flow (NOI - full debt service - tax)
 *   - Balance sheet (property value net of depreciation, debt outstanding)
 *
 * PASS 2 (at the end): If the property has a refinance event, overlay new debt
 * terms from the refinance month onward. Revenue and NOI stay the same (they're
 * debt-independent), but interest, principal, net income, and cash flow all change.
 *
 * The occupancy ramp-up works in steps: starting at startOccupancy, it increases
 * by occupancyGrowthStep every occupancyRampMonths until hitting maxOccupancy.
 * This models the real-world pattern where a new hotel gradually builds its guest base.
 *
 * Fixed vs variable costs (the "F-8 fix"):
 *   - Variable costs (rooms, F&B, marketing) scale with CURRENT revenue
 *   - Fixed costs (admin, insurance, property tax) are anchored to Year 1 revenue
 *     level and escalate with inflation, NOT with revenue growth. This prevents
 *     the unrealistic scenario where admin costs double just because occupancy doubled.
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
  
  // Balance sheet calculations - for PwC-level verification
  // Depreciable basis: land doesn't depreciate (IRS Publication 946 / ASC 360)
  // depreciableBasis = purchasePrice × (1 - landValuePercent) + buildingImprovements
  const landPct = property.landValuePercent ?? DEFAULT_LAND_VALUE_PERCENT;
  const buildingValue = property.purchasePrice * (1 - landPct) + (property.buildingImprovements ?? 0);
  const monthlyDepreciation = buildingValue / DEPRECIATION_YEARS / 12;
  
  // Loan setup for debt outstanding tracking
  // Loan is based on total property value (including land), NOT depreciable basis
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

  // Base monthly revenue for fixed cost anchoring (F-8: fixed costs escalate independently of revenue growth)
  // Uses starting ADR and starting occupancy to establish Year 1 fixed cost dollar amounts
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
    const currentDate = addMonths(modelStart, i);
    const isOperational = !isBefore(currentDate, opsStart);
    const monthsSinceOps = isOperational ? differenceInMonths(currentDate, opsStart) : 0;
    
    const opsYear = Math.floor(monthsSinceOps / 12);
    const currentAdr = baseAdr * Math.pow(1 + property.adrGrowthRate, opsYear);
    // Fixed cost escalation: compound annually from operations start (F-8 fix)
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
    
    // Revenue streams (shares and catering factors computed outside loop)
    const revenueEvents = revenueRooms * revShareEvents;
    const baseFB = revenueRooms * revShareFB;
    const revenueFB = baseFB * cateringBoostMultiplier;
    const revenueOther = revenueRooms * revShareOther;
    const revenueTotal = revenueRooms + revenueEvents + revenueFB + revenueOther;

    // Property-level cost rates
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

    // PRE-OPERATIONAL GATE: All operating expenses, fees, and reserves are ZERO
    // before operationsStartDate. Per USALI and timing-activation-rules:
    //   Pre-Operations: Revenue=0, Operating Expenses=0, GOP=0, NOI=0
    // Variable costs are naturally zero (driven by zero revenue), but fixed costs
    // must be explicitly gated because they use baseMonthlyTotalRev (a constant).

    // VARIABLE costs: scale with current revenue (grow naturally with ADR/occupancy)
    const expenseRooms = revenueRooms * costRateRooms;
    const expenseFB = revenueFB * costRateFB;
    const expenseEvents = revenueEvents * eventExpenseRate;
    const expenseOther = revenueOther * otherExpenseRate;
    const expenseMarketing = revenueTotal * costRateMarketing;
    const expenseUtilitiesVar = revenueTotal * (costRateUtilities * utilitiesVariableSplit);
    const expenseFFE = revenueTotal * costRateFFE;

    // FIXED costs: base dollar amount (from Year 1 revenue level) × annual escalation (F-8 fix)
    // Per USALI, admin, property ops, insurance, taxes, IT, fixed utilities, and other overhead
    // are dollar-based line items that escalate at fixedCostEscalationRate, not revenue-based.
    // CRITICAL: Only activate when property is operational (isOperational gate)
    const fixedGate = isOperational ? 1 : 0;
    const expenseAdmin = baseMonthlyTotalRev * costRateAdmin * fixedCostFactor * fixedGate;
    const expensePropertyOps = baseMonthlyTotalRev * costRatePropertyOps * fixedCostFactor * fixedGate;
    const expenseIT = baseMonthlyTotalRev * costRateIT * fixedCostFactor * fixedGate;
    const expenseInsurance = (totalPropertyValue / 12) * costRateInsurance * fixedCostFactor * fixedGate;
    const expenseTaxes = (totalPropertyValue / 12) * costRateTaxes * fixedCostFactor * fixedGate;
    const expenseUtilitiesFixed = baseMonthlyTotalRev * (costRateUtilities * (1 - utilitiesVariableSplit)) * fixedCostFactor * fixedGate;
    const expenseOtherCosts = baseMonthlyTotalRev * costRateOther * fixedCostFactor * fixedGate;
    
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
      expenseAdmin + expenseIT + expenseInsurance + expenseTaxes + expenseUtilitiesFixed + expenseOtherCosts;
      
    const gop = revenueTotal - totalOperatingExpenses;
    const feeIncentive = Math.max(0, gop * (property.incentiveManagementFeeRate ?? DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE));
    const noi = gop - feeBase - feeIncentive - expenseFFE;
    
    let debtPayment = 0;
    let interestExpense = 0;
    let principalPayment = 0;
    let debtOutstanding = 0;
    
    // Check if we're past acquisition date for balance sheet items
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

    // Balance sheet: Property value = land + (building - accumulated depreciation) per ASC 360
    const landValue = property.purchasePrice * landPct;
    const depreciationExpense = isAcquired ? monthlyDepreciation : 0;
    const accumulatedDepreciation = isAcquired ? Math.min(monthlyDepreciation * (monthsSinceAcquisition + 1), buildingValue) : 0;
    const propertyValue = isAcquired ? landValue + buildingValue - accumulatedDepreciation : 0;

    // GAAP Net Income = NOI - Interest - Depreciation - Income Tax
    const taxableIncome = noi - interestExpense - depreciationExpense;
    const incomeTax = taxableIncome > 0 ? taxableIncome * taxRate : 0;
    const netIncome = noi - interestExpense - depreciationExpense - incomeTax;
    
    // Cash flow = actual cash movement (NOI - full debt service - taxes)
    const cashFlow = noi - debtPayment - incomeTax;
    
    // Cash flow statement per GAAP ASC 230 indirect method
    // Operating CF = Net Income + Depreciation (add back non-cash expense)
    // This reconciles: OCF + FCF = (NI + Dep) + (-Principal) = NOI - Interest - Tax - Principal = cashFlow
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
      expenseInsurance,
      expenseTaxes,
      expenseUtilitiesFixed,
      expenseOtherCosts,
      totalExpenses: totalOperatingExpenses + feeBase + feeIncentive + expenseFFE,
      gop,
      noi,
      interestExpense,
      principalPayment,
      debtPayment,
      netIncome,
      incomeTax,
      cashFlow,
      // Balance sheet fields for PwC-level audit verification
      depreciationExpense,
      propertyValue,
      debtOutstanding,
      // Refinance
      refinancingProceeds: 0,
      // Cash flow statement fields per GAAP ASC 230
      operatingCashFlow,
      financingCashFlow,
      endingCash,
      cashShortfall: endingCash < 0,
    });
  }

  // --- PASS 2: Refinance post-processing (F-3 fix) ---
  // If the property has a refinance, recalculate debt-related fields from the refinance month onward.
  // NOI is debt-independent, so pass 1 values for revenue/expenses/NOI remain correct.
  if (property.willRefinance === "Yes" && property.refinanceDate) {
    const refiDate = startOfMonth(parseLocalDate(property.refinanceDate));
    const refiMonthIndex = (refiDate.getFullYear() - modelStart.getFullYear()) * 12 +
                           (refiDate.getMonth() - modelStart.getMonth());

    if (refiMonthIndex >= 0 && refiMonthIndex < months) {
      // Aggregate yearly NOI to size the new loan
      // BUG FIX: If the refinance year has fewer than 12 operational months
      // (property started mid-year), annualize the NOI. Otherwise the loan
      // is sized on partial-year income, massively under-sizing the new debt.
      const refiYear = Math.floor(refiMonthIndex / 12);
      const projectionYears = Math.ceil(months / 12);
      const yearlyNOI: number[] = [];
      const yearlyOperationalMonths: number[] = [];
      for (let y = 0; y < projectionYears; y++) {
        const yearSlice = financials.slice(y * 12, (y + 1) * 12);
        yearlyNOI.push(yearSlice.reduce((sum, m) => sum + m.noi, 0));
        yearlyOperationalMonths.push(yearSlice.filter(m => m.revenueTotal > 0 || m.noi !== 0).length);
      }

      // Build RefinanceInput from engine state using fallback pattern
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

      // Call the standalone refinance calculator module (Skill 2)
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

      // Only apply refinance if inputs are valid
      if (refiOutput.flags.invalid_inputs.length === 0) {
        const refiProceeds = refiOutput.cash_out_to_equity;
        const schedule = refiOutput.new_debt_service_schedule;

        // Apply pre-built schedule to monthly financials
        const acqMonthIdx = (acquisitionDate.getFullYear() - modelStart.getFullYear()) * 12 +
                            (acquisitionDate.getMonth() - modelStart.getMonth());
        let cumCash = 0;
        for (let i = 0; i < months; i++) {
          const m = financials[i];

          if (i < refiMonthIndex) {
            // Pre-refinance months: just recalculate cumulative cash (no changes to debt)
            if (i === acqMonthIdx) {
              cumCash += (property.operatingReserve ?? 0);
            }
            cumCash += m.cashFlow;
            m.endingCash = cumCash;
            m.cashShortfall = cumCash < 0;
          } else {
            const monthsSinceRefi = i - refiMonthIndex;

            // Read debt fields from pre-built schedule (O(1) lookup)
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

            // Recalculate net income and cash flow with new debt
            const taxableIncome = m.noi - interestExpense - m.depreciationExpense;
            const incomeTax = taxableIncome > 0 ? taxableIncome * taxRate : 0;
            const netIncome = m.noi - interestExpense - m.depreciationExpense - incomeTax;
            const cashFlow = m.noi - debtPayment - incomeTax;
            const operatingCashFlow = netIncome + m.depreciationExpense;
            const financingCashFlow = -principalPayment;

            // Refinance proceeds flow into cash in the refinance month
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

/**
 * Format a number as USD currency. Negative values are shown in accounting
 * notation with parentheses: ($1,234) instead of -$1,234.
 */
export function formatMoney(amount: number) {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absAmount);
  return isNegative ? `(${formatted})` : formatted;
}

/** Helper for conditional CSS styling — returns true when a value should be shown in red. */
export function isNegative(amount: number): boolean {
  return amount < 0;
}

/** Format a decimal ratio as a percentage string with one decimal place (e.g. 0.85 → "85.0%"). */
export function formatPercent(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(amount);
}

export interface ServiceFeeBreakdown {
  byCategory: Record<string, number>;
  byPropertyId: Record<string, number>;
  byCategoryByPropertyId: Record<string, Record<string, number>>;
}

export interface CompanyMonthlyFinancials {
  date: Date;
  monthIndex: number;
  year: number;
  baseFeeRevenue: number;
  incentiveFeeRevenue: number;
  incentiveFeeByPropertyId: Record<string, number>;
  serviceFeeBreakdown: ServiceFeeBreakdown;
  totalRevenue: number;
  partnerCompensation: number;
  staffCompensation: number;
  officeLease: number;
  professionalServices: number;
  techInfrastructure: number;
  businessInsurance: number;
  travelCosts: number;
  itLicensing: number;
  marketing: number;
  miscOps: number;
  totalExpenses: number;
  netIncome: number;
  safeFunding: number;
  safeFunding1: number;
  safeFunding2: number;
  cashFlow: number;
  endingCash: number;
  cashShortfall: boolean;
}

/**
 * Generate month-by-month financials for the management company itself.
 *
 * The management company is a separate entity from the hotel properties it manages.
 * Its revenue comes from management fees charged to properties:
 *   - Base management fee: a percentage of each property's total revenue
 *   - Incentive fee: a percentage of each property's GOP (only when GOP > 0)
 *
 * Its expenses are corporate overhead:
 *   - Partner compensation (set per year by the admin, not inflation-adjusted)
 *   - Staff salaries (tiered by number of active properties: more properties = more staff)
 *   - Office lease, professional services, tech infrastructure, business insurance
 *   - Variable costs: travel per client property, IT licensing per property
 *   - Marketing and miscellaneous operations (percentage of company revenue)
 *
 * The company also receives SAFE (Simple Agreement for Future Equity) funding
 * tranches — essentially startup capital that arrives at specific dates.
 *
 * Company operations are gated: no expenses are incurred until both the company
 * ops start date has passed AND the first SAFE tranche has been received.
 *
 * Fixed cost escalation counts from when the company starts operations, not from
 * the model start date. So if the company starts in month 6, Year 1 costs use
 * base values (no escalation), even though the model is already 6 months in.
 */
export function generateCompanyProForma(
  properties: PropertyInput[],
  global: GlobalInput,
  months: number = PROJECTION_MONTHS
): CompanyMonthlyFinancials[] {
  const results: CompanyMonthlyFinancials[] = [];
  let cumulativeCompanyCash = 0;

  const parseDateString = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return { year, month: month - 1, day };
  };
  
  const startParsed = parseDateString(global.modelStartDate);
  const tranche1Parsed = global.safeTranche1Date ? parseDateString(global.safeTranche1Date) : startParsed;
  const tranche2Parsed = global.safeTranche2Date ? parseDateString(global.safeTranche2Date) : null;
  const opsStartParsed = global.companyOpsStartDate ? parseDateString(global.companyOpsStartDate) : startParsed;
  
  const propertyFinancials = properties.map(p => generatePropertyProForma(p, global, months));
  
  for (let m = 0; m < months; m++) {
    // Calculate current year and month using parsed values to avoid timezone issues
    const totalMonths = startParsed.month + m;
    const currentYear = startParsed.year + Math.floor(totalMonths / 12);
    const currentMonth = totalMonths % 12;
    const currentDate = new Date(currentYear, currentMonth, 1);
    const year = Math.floor(m / 12);
    
    // Check if company has started operations (gated on funding instrument receipt)
    const opsStartDate = new Date(opsStartParsed.year, opsStartParsed.month, 1);
    const firstSafeDate = new Date(tranche1Parsed.year, tranche1Parsed.month, 1);
    const hasStartedOps = currentDate >= opsStartDate && currentDate >= firstSafeDate;

    // BUG FIX: Escalation must count from company ops start, not model start.
    // If company starts in month 6, Year 1 costs should use base values (factor=1.0),
    // not model-year escalated values. Partner comp uses model year by design (admin-set per year).
    const monthsSinceCompanyOps = hasStartedOps
      ? (currentYear - opsStartParsed.year) * 12 + (currentMonth - opsStartParsed.month)
      : 0;
    const companyOpsYear = Math.floor(monthsSinceCompanyOps / 12);
    const fixedEscalationRate = global.fixedCostEscalationRate ?? global.inflationRate;
    const fixedCostFactor = Math.pow(1 + fixedEscalationRate, companyOpsYear);
    const variableCostFactor = Math.pow(1 + global.inflationRate, companyOpsYear);
    
    let totalPropertyRevenue = 0;
    let totalPropertyGOP = 0;
    let activePropertyCount = 0;
    
    for (let i = 0; i < properties.length; i++) {
      const pf = propertyFinancials[i];
      if (m < pf.length) {
        totalPropertyRevenue += pf[m].revenueTotal;
        totalPropertyGOP += pf[m].gop;
        if (pf[m].revenueTotal > 0) activePropertyCount++;
      }
    }
    
    let baseFeeRevenue = 0;
    let incentiveFeeRevenue = 0;
    const incentiveFeeByPropertyId: Record<string, number> = {};
    const serviceFeeBreakdown: ServiceFeeBreakdown = {
      byCategory: {},
      byPropertyId: {},
      byCategoryByPropertyId: {},
    };
    for (let i = 0; i < properties.length; i++) {
      const pf = propertyFinancials[i];
      if (m < pf.length) {
        const propId = String(properties[i].id ?? i);
        const propIncentiveFee = properties[i].incentiveManagementFeeRate ?? DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE;
        const propIncentive = Math.max(0, pf[m].gop * propIncentiveFee);
        incentiveFeeRevenue += propIncentive;
        incentiveFeeByPropertyId[propId] = propIncentive;
        
        const catFees = pf[m].serviceFeesByCategory;
        const hasCategoryData = Object.keys(catFees).length > 0;
        if (hasCategoryData) {
          let propServiceTotal = 0;
          for (const [catName, catAmount] of Object.entries(catFees)) {
            serviceFeeBreakdown.byCategory[catName] = (serviceFeeBreakdown.byCategory[catName] || 0) + catAmount;
            if (!serviceFeeBreakdown.byCategoryByPropertyId[catName]) {
              serviceFeeBreakdown.byCategoryByPropertyId[catName] = {};
            }
            serviceFeeBreakdown.byCategoryByPropertyId[catName][propId] = catAmount;
            propServiceTotal += catAmount;
          }
          serviceFeeBreakdown.byPropertyId[propId] = propServiceTotal;
          baseFeeRevenue += propServiceTotal;
        } else {
          const propBaseFee = properties[i].baseManagementFeeRate ?? DEFAULT_BASE_MANAGEMENT_FEE_RATE;
          const propServiceFee = pf[m].revenueTotal * propBaseFee;
          baseFeeRevenue += propServiceFee;
          serviceFeeBreakdown.byPropertyId[propId] = propServiceFee;
          serviceFeeBreakdown.byCategory["Service Fee"] = (serviceFeeBreakdown.byCategory["Service Fee"] || 0) + propServiceFee;
          if (!serviceFeeBreakdown.byCategoryByPropertyId["Service Fee"]) {
            serviceFeeBreakdown.byCategoryByPropertyId["Service Fee"] = {};
          }
          serviceFeeBreakdown.byCategoryByPropertyId["Service Fee"][propId] = propServiceFee;
        }
      }
    }
    const totalRevenue = baseFeeRevenue + incentiveFeeRevenue;
    
    // Only incur expenses after company operations start
    let partnerCompensation = 0;
    let staffCompensation = 0;
    let officeLease = 0;
    let professionalServices = 0;
    let techInfrastructure = 0;
    let businessInsurance = 0;
    let travelCosts = 0;
    let itLicensing = 0;
    let marketing = 0;
    let miscOps = 0;
    
    if (hasStartedOps) {
      // Use yearly partner compensation values (year is 0-indexed, so year 0 = Year 1)
      const modelYear = year + 1; // year is 0-indexed, convert to 1-10
      const partnerCompKeys = [
        'partnerCompYear1', 'partnerCompYear2', 'partnerCompYear3',
        'partnerCompYear4', 'partnerCompYear5', 'partnerCompYear6',
        'partnerCompYear7', 'partnerCompYear8', 'partnerCompYear9',
        'partnerCompYear10',
      ] as const;
      const yearlyPartnerComp = partnerCompKeys.map((key, i) =>
        (global as any)[key] ?? DEFAULT_PARTNER_COMP[i]
      );
      const yearIndex = Math.min(modelYear - 1, DEFAULT_PARTNER_COMP.length - 1);
      const totalPartnerCompForYear = yearlyPartnerComp[yearIndex];
      
      const staffSalary = (global.staffSalary ?? DEFAULT_STAFF_SALARY);
      const tier1Max = global.staffTier1MaxProperties ?? STAFFING_TIERS[0].maxProperties;
      const tier1Fte = global.staffTier1Fte ?? STAFFING_TIERS[0].fte;
      const tier2Max = global.staffTier2MaxProperties ?? STAFFING_TIERS[1].maxProperties;
      const tier2Fte = global.staffTier2Fte ?? STAFFING_TIERS[1].fte;
      const tier3Fte = global.staffTier3Fte ?? STAFFING_TIERS[2].fte;
      const staffFTE = activePropertyCount <= tier1Max ? tier1Fte
        : activePropertyCount <= tier2Max ? tier2Fte
        : tier3Fte;
      
      partnerCompensation = totalPartnerCompForYear / 12;
      staffCompensation = (staffFTE * staffSalary * fixedCostFactor) / 12;
      officeLease = ((global.officeLeaseStart ?? DEFAULT_OFFICE_LEASE) * fixedCostFactor) / 12;
      professionalServices = ((global.professionalServicesStart ?? DEFAULT_PROFESSIONAL_SERVICES) * fixedCostFactor) / 12;
      techInfrastructure = ((global.techInfraStart ?? DEFAULT_TECH_INFRA) * fixedCostFactor) / 12;
      businessInsurance = ((global.businessInsuranceStart ?? DEFAULT_BUSINESS_INSURANCE) * fixedCostFactor) / 12;
      
      travelCosts = (activePropertyCount * (global.travelCostPerClient ?? DEFAULT_TRAVEL_PER_CLIENT) * variableCostFactor) / 12;
      itLicensing = (activePropertyCount * (global.itLicensePerClient ?? DEFAULT_IT_LICENSE_PER_CLIENT) * variableCostFactor) / 12;
      marketing = totalRevenue * (global.marketingRate ?? DEFAULT_MARKETING_RATE);
      miscOps = totalRevenue * (global.miscOpsRate ?? DEFAULT_MISC_OPS_RATE);
    }
    
    const totalExpenses = partnerCompensation + staffCompensation + officeLease + professionalServices +
      techInfrastructure + businessInsurance + travelCosts + itLicensing + marketing + miscOps;
    
    const netIncome = totalRevenue - totalExpenses;
    
    let safeFunding1 = 0;
    let safeFunding2 = 0;
    if (currentYear === tranche1Parsed.year && currentMonth === tranche1Parsed.month) {
      safeFunding1 = global.safeTranche1Amount ?? DEFAULT_SAFE_TRANCHE;
    }
    if (tranche2Parsed && currentYear === tranche2Parsed.year && currentMonth === tranche2Parsed.month) {
      safeFunding2 = global.safeTranche2Amount ?? DEFAULT_SAFE_TRANCHE;
    }
    const safeFunding = safeFunding1 + safeFunding2;
    
    const cashFlow = netIncome + safeFunding;
    cumulativeCompanyCash += cashFlow;

    results.push({
      date: currentDate,
      monthIndex: m,
      year: year + 1,
      baseFeeRevenue,
      incentiveFeeRevenue,
      incentiveFeeByPropertyId,
      serviceFeeBreakdown,
      totalRevenue,
      partnerCompensation,
      staffCompensation,
      officeLease,
      professionalServices,
      techInfrastructure,
      businessInsurance,
      travelCosts,
      itLicensing,
      marketing,
      miscOps,
      totalExpenses,
      netIncome,
      safeFunding,
      safeFunding1,
      safeFunding2,
      cashFlow,
      endingCash: cumulativeCompanyCash,
      cashShortfall: cumulativeCompanyCash < 0,
    });
  }
  
  return results;
}
