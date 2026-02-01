import { addMonths, differenceInMonths, isBefore } from "date-fns";

// Helper function to get fiscal year label for a given month in the model
// modelStartDate: when the model starts (e.g., "2026-04-01")
// fiscalYearStartMonth: 1 = January, 4 = April, etc.
// monthIndex: 0-based index from model start
export function getFiscalYearLabel(
  modelStartDate: string,
  fiscalYearStartMonth: number,
  monthIndex: number
): number {
  const startDate = new Date(modelStartDate);
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

// Types that match our database schema
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
  type: string;
  cateringLevel: string;
  // Financing
  acquisitionLTV?: number | null;
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
  // Catering mix (% of events using each catering level)
  fullCateringPercent: number;
  partialCateringPercent: number;
}

interface GlobalInput {
  modelStartDate: string;
  companyOpsStartDate?: string;
  fiscalYearStartMonth?: number; // 1 = January, 4 = April, etc.
  inflationRate: number;
  fixedCostEscalationRate?: number;
  baseManagementFee: number;
  incentiveManagementFee: number;
  marketingRate: number;
  // SAFE Funding
  safeTranche1Amount?: number;
  safeTranche1Date?: string;
  safeTranche2Amount?: number;
  safeTranche2Date?: string;
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
  // Catering F&B boost factors
  fullCateringFBBoost?: number;
  partialCateringFBBoost?: number;
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
  cashFlow: number;
  // Balance sheet fields for auditor verification
  depreciationExpense: number;
  propertyValue: number;
  debtOutstanding: number;
  // Cash flow statement fields for GAAP verification (ASC 230)
  operatingCashFlow: number;
  financingCashFlow: number;
  endingCash: number;
}

// Default revenue shares (now property-configurable)
const DEFAULT_REV_SHARE_EVENTS = 0.43;
const DEFAULT_REV_SHARE_FB = 0.22;
const DEFAULT_REV_SHARE_OTHER = 0.07;

export function generatePropertyProForma(
  property: PropertyInput, 
  global: GlobalInput, 
  months: number = 60
): MonthlyFinancials[] {
  const financials: MonthlyFinancials[] = [];
  const modelStart = new Date(global.modelStartDate);
  const opsStart = new Date(property.operationsStartDate);
  const acquisitionDate = property.acquisitionDate ? new Date(property.acquisitionDate) : opsStart;
  
  // Balance sheet calculations - for PwC-level verification
  const buildingValue = property.purchasePrice + (property.buildingImprovements ?? 0);
  const monthlyDepreciation = buildingValue / 27.5 / 12; // 27.5-year straight-line (IRS Publication 946)
  
  // Loan setup for debt outstanding tracking
  const ltv = property.acquisitionLTV ?? global.debtAssumptions?.acqLTV ?? 0.75;
  const originalLoanAmount = property.type === "Financed" ? buildingValue * ltv : 0;
  const loanRate = global.debtAssumptions?.interestRate ?? 0.09;
  const loanTerm = global.debtAssumptions?.amortizationYears ?? 25;
  const monthlyRate = loanRate / 12;
  const totalPayments = loanTerm * 12;
  // Handle zero interest rate (straight-line principal reduction)
  let monthlyPayment = 0;
  if (originalLoanAmount > 0) {
    if (monthlyRate === 0) {
      monthlyPayment = originalLoanAmount / totalPayments;
    } else {
      monthlyPayment = (originalLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                       (Math.pow(1 + monthlyRate, totalPayments) - 1);
    }
  }
    
  let cumulativeCash = 0; // Track cumulative cash for ending cash balance
  
  let currentAdr = property.startAdr;
  
  for (let i = 0; i < months; i++) {
    const currentDate = addMonths(modelStart, i);
    const isOperational = !isBefore(currentDate, opsStart);
    const monthsSinceOps = isOperational ? differenceInMonths(currentDate, opsStart) : 0;
    
    if (i > 0 && i % 12 === 0) {
      currentAdr = currentAdr * (1 + property.adrGrowthRate);
    }

    let occupancy = 0;
    if (isOperational) {
      const rampSteps = Math.floor(monthsSinceOps / property.occupancyRampMonths);
      occupancy = Math.min(
        property.maxOccupancy, 
        property.startOccupancy + (rampSteps * property.occupancyGrowthStep)
      );
    }
    
    const daysInMonth = 30.5; // Industry standard: 365/12 = 30.4167, rounded to 30.5
    const availableRooms = property.roomCount * daysInMonth;
    const soldRooms = isOperational ? availableRooms * occupancy : 0;
    
    const revenueRooms = soldRooms * currentAdr;
    
    // Events revenue is independent (configurable per property)
    const revShareEvents = property.revShareEvents ?? DEFAULT_REV_SHARE_EVENTS;
    const revShareFB = property.revShareFB ?? DEFAULT_REV_SHARE_FB;
    const revShareOther = property.revShareOther ?? DEFAULT_REV_SHARE_OTHER;
    const revenueEvents = revenueRooms * revShareEvents;
    
    // F&B revenue gets boosted by catering at events
    // Formula: baseFB × (1 + fullBoost × fullCateringPct + partialBoost × partialCateringPct)
    const fullCateringPct = property.fullCateringPercent ?? 0.40;
    const partialCateringPct = property.partialCateringPercent ?? 0.30;
    const fullBoost = global.fullCateringFBBoost ?? 0.50;
    const partialBoost = global.partialCateringFBBoost ?? 0.25;
    const baseFB = revenueRooms * revShareFB;
    const cateringBoostMultiplier = 1 + (fullBoost * fullCateringPct) + (partialBoost * partialCateringPct);
    const revenueFB = baseFB * cateringBoostMultiplier;
    
    const revenueOther = revenueRooms * revShareOther;
    const revenueTotal = revenueRooms + revenueEvents + revenueFB + revenueOther;
    
    // Property-level cost rates
    const costRateRooms = property.costRateRooms ?? 0.36;
    const costRateFB = property.costRateFB ?? 0.15;
    const costRateAdmin = property.costRateAdmin ?? 0.08;
    const costRateMarketing = property.costRateMarketing ?? 0.05;
    const costRatePropertyOps = property.costRatePropertyOps ?? 0.04;
    const costRateUtilities = property.costRateUtilities ?? 0.05;
    const costRateInsurance = property.costRateInsurance ?? 0.02;
    const costRateTaxes = property.costRateTaxes ?? 0.03;
    const costRateIT = property.costRateIT ?? 0.02;
    const costRateFFE = property.costRateFFE ?? 0.04;
    const costRateOther = property.costRateOther ?? 0.05;
    
    const expenseRooms = revenueRooms * costRateRooms;
    
    // F&B costs: apply costRateFB to all F&B revenue (including catering boost)
    const expenseFB = revenueFB * costRateFB;
    
    // Event and Other expenses use configurable global rates
    const eventExpenseRate = global.eventExpenseRate ?? 0.65;
    const otherExpenseRate = global.otherExpenseRate ?? 0.60;
    const utilitiesVariableSplit = global.utilitiesVariableSplit ?? 0.60;
    
    const expenseEvents = revenueEvents * eventExpenseRate;
    const expenseOther = revenueOther * otherExpenseRate;
    const expenseMarketing = revenueTotal * costRateMarketing;
    const expensePropertyOps = revenueTotal * costRatePropertyOps;
    const expenseUtilitiesVar = revenueTotal * (costRateUtilities * utilitiesVariableSplit);
    const expenseFFE = revenueTotal * costRateFFE;
    
    const expenseAdmin = revenueTotal * costRateAdmin;
    const expenseIT = revenueTotal * costRateIT;
    const expenseInsurance = revenueTotal * costRateInsurance;
    const expenseTaxes = revenueTotal * costRateTaxes;
    const expenseUtilitiesFixed = revenueTotal * (costRateUtilities * (1 - utilitiesVariableSplit));
    const expenseOtherCosts = revenueTotal * costRateOther;
    
    const feeBase = revenueTotal * global.baseManagementFee;
    
    const totalOperatingExpenses = 
      expenseRooms + expenseFB + expenseEvents + expenseOther + 
      expenseMarketing + expensePropertyOps + expenseUtilitiesVar + 
      expenseAdmin + expenseIT + expenseInsurance + expenseTaxes + expenseUtilitiesFixed + expenseOtherCosts;
      
    const gop = revenueTotal - totalOperatingExpenses;
    const feeIncentive = Math.max(0, gop * global.incentiveManagementFee);
    const noi = gop - feeBase - feeIncentive - expenseFFE;
    
    let debtPayment = 0;
    let interestExpense = 0;
    let principalPayment = 0;
    let debtOutstanding = 0;
    
    // Check if we're past acquisition date for balance sheet items
    const isAcquired = !isBefore(currentDate, acquisitionDate);
    const monthsSinceAcquisition = isAcquired ? differenceInMonths(currentDate, acquisitionDate) : 0;
    
    if (isOperational && property.type === "Financed") {
      const r = global.debtAssumptions.interestRate / 12;
      const n = global.debtAssumptions.amortizationYears * 12;
      const loanAmount = originalLoanAmount;
      
      if (loanAmount > 0 && r > 0) {
        debtPayment = monthlyPayment;
        
        // Calculate remaining balance at this month to get accurate interest/principal split
        let remainingBalance = loanAmount;
        for (let m = 0; m < monthsSinceAcquisition && m < n; m++) {
          const monthInterest = remainingBalance * r;
          const monthPrincipal = monthlyPayment - monthInterest;
          remainingBalance = Math.max(0, remainingBalance - monthPrincipal);
        }
        
        debtOutstanding = remainingBalance;
        
        // Current month's interest and principal
        interestExpense = remainingBalance * r;
        principalPayment = monthlyPayment - interestExpense;
      }
    }

    const netIncome = noi - interestExpense;
    const cashFlow = noi - debtPayment;
    
    // Balance sheet: Property value = building value - accumulated depreciation (ASC 360)
    const depreciationExpense = isAcquired ? monthlyDepreciation : 0;
    const accumulatedDepreciation = isAcquired ? monthlyDepreciation * (monthsSinceAcquisition + 1) : 0;
    const propertyValue = isAcquired ? buildingValue - accumulatedDepreciation : 0;
    
    // Cash flow statement per GAAP ASC 230 indirect method
    const operatingCashFlow = netIncome + depreciationExpense; // Add back non-cash depreciation
    const financingCashFlow = -principalPayment; // Principal repayment is financing activity
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
      cashFlow,
      // Balance sheet fields for PwC-level audit verification
      depreciationExpense,
      propertyValue,
      debtOutstanding,
      // Cash flow statement fields per GAAP ASC 230
      operatingCashFlow,
      financingCashFlow,
      endingCash
    });
  }
  
  return financials;
}

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

export function isNegative(amount: number): boolean {
  return amount < 0;
}

export function formatPercent(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(amount);
}

export interface CompanyMonthlyFinancials {
  date: Date;
  monthIndex: number;
  year: number;
  baseFeeRevenue: number;
  incentiveFeeRevenue: number;
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
}

export function generateCompanyProForma(
  properties: PropertyInput[],
  global: GlobalInput,
  months: number = 120
): CompanyMonthlyFinancials[] {
  const results: CompanyMonthlyFinancials[] = [];
  
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
    const fixedEscalationRate = global.fixedCostEscalationRate ?? global.inflationRate;
    const fixedCostFactor = Math.pow(1 + fixedEscalationRate, year);
    const variableCostFactor = Math.pow(1 + global.inflationRate, year);
    
    // Check if company has started operations
    const opsStartDate = new Date(opsStartParsed.year, opsStartParsed.month, 1);
    const hasStartedOps = currentDate >= opsStartDate;
    
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
    
    const baseFeeRevenue = totalPropertyRevenue * global.baseManagementFee;
    const incentiveFeeRevenue = totalPropertyGOP * global.incentiveManagementFee;
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
      const yearlyPartnerComp = [
        global.partnerCompYear1 ?? 540000,
        global.partnerCompYear2 ?? 540000,
        global.partnerCompYear3 ?? 540000,
        global.partnerCompYear4 ?? 600000,
        global.partnerCompYear5 ?? 600000,
        global.partnerCompYear6 ?? 700000,
        global.partnerCompYear7 ?? 700000,
        global.partnerCompYear8 ?? 800000,
        global.partnerCompYear9 ?? 800000,
        global.partnerCompYear10 ?? 900000,
      ];
      const yearIndex = Math.min(modelYear - 1, 9); // Clamp to 0-9
      const totalPartnerCompForYear = yearlyPartnerComp[yearIndex];
      
      const staffSalary = (global.staffSalary ?? 75000);
      const staffFTE = activePropertyCount <= 3 ? 2.5 : activePropertyCount <= 6 ? 4.5 : 7.0;
      
      partnerCompensation = totalPartnerCompForYear / 12;
      staffCompensation = (staffFTE * staffSalary * fixedCostFactor) / 12;
      officeLease = ((global.officeLeaseStart ?? 36000) * fixedCostFactor) / 12;
      professionalServices = ((global.professionalServicesStart ?? 24000) * fixedCostFactor) / 12;
      techInfrastructure = ((global.techInfraStart ?? 18000) * fixedCostFactor) / 12;
      businessInsurance = ((global.businessInsuranceStart ?? 12000) * fixedCostFactor) / 12;
      
      travelCosts = (activePropertyCount * (global.travelCostPerClient ?? 12000) * variableCostFactor) / 12;
      itLicensing = (activePropertyCount * (global.itLicensePerClient ?? 3000) * variableCostFactor) / 12;
      marketing = totalRevenue * (global.marketingRate ?? 0.05);
      miscOps = totalRevenue * (global.miscOpsRate ?? 0.03);
    }
    
    const totalExpenses = partnerCompensation + staffCompensation + officeLease + professionalServices +
      techInfrastructure + businessInsurance + travelCosts + itLicensing + marketing + miscOps;
    
    const netIncome = totalRevenue - totalExpenses;
    
    let safeFunding1 = 0;
    let safeFunding2 = 0;
    if (currentYear === tranche1Parsed.year && currentMonth === tranche1Parsed.month) {
      safeFunding1 = global.safeTranche1Amount ?? 800000;
    }
    if (tranche2Parsed && currentYear === tranche2Parsed.year && currentMonth === tranche2Parsed.month) {
      safeFunding2 = global.safeTranche2Amount ?? 800000;
    }
    const safeFunding = safeFunding1 + safeFunding2;
    
    const cashFlow = netIncome + safeFunding;
    
    results.push({
      date: currentDate,
      monthIndex: m,
      year: year + 1,
      baseFeeRevenue,
      incentiveFeeRevenue,
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
    });
  }
  
  return results;
}
