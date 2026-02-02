export interface LoanParams {
  purchasePrice: number;
  buildingImprovements: number;
  preOpeningCosts: number;
  operatingReserve: number;
  type: string;
  acquisitionDate?: string | null;
  taxRate?: number | null;
  acquisitionLTV?: number | null;
  acquisitionInterestRate?: number | null;
  acquisitionTermYears?: number | null;
  willRefinance?: string | null;
  refinanceDate?: string | null;
  refinanceLTV?: number | null;
  refinanceInterestRate?: number | null;
  refinanceTermYears?: number | null;
  refinanceClosingCostRate?: number | null;
  exitCapRate?: number | null;
}

export interface GlobalLoanParams {
  modelStartDate: string;
  commissionRate?: number;
  salesCommissionRate?: number;
  exitCapRate?: number;
  companyTaxRate?: number;
  debtAssumptions?: {
    acqLTV?: number;
    interestRate?: number;
    amortizationYears?: number;
    refiLTV?: number;
    refiClosingCostRate?: number;
  };
}

export interface LoanCalculation {
  totalInvestment: number;
  loanAmount: number;
  equityInvested: number;
  interestRate: number;
  termYears: number;
  monthlyRate: number;
  totalPayments: number;
  monthlyPayment: number;
  acqMonthsFromModelStart: number;
  buildingValue: number;
  annualDepreciation: number;
  taxRate: number;
  commissionRate: number;
}

export interface RefinanceCalculation {
  refiYear: number;
  refiProceeds: number;
  refiLoanAmount: number;
  refiMonthlyPayment: number;
  refiInterestRate: number;
  refiTermYears: number;
  refiMonthlyRate: number;
  refiTotalPayments: number;
}

export interface YearlyDebtService {
  debtService: number;
  interestExpense: number;
  principalPayment: number;
}

// Re-export constants from shared module for backwards compatibility
export { 
  DEFAULT_LTV, 
  DEFAULT_INTEREST_RATE, 
  DEFAULT_TERM_YEARS, 
  DEFAULT_TAX_RATE, 
  DEFAULT_COMMISSION_RATE, 
  DEFAULT_EXIT_CAP_RATE, 
  DEPRECIATION_YEARS, 
  DEFAULT_REFI_LTV, 
  DEFAULT_REFI_CLOSING_COST_RATE,
  DEFAULT_ACQ_CLOSING_COST_RATE 
} from './constants';

export function calculateLoanParams(
  property: LoanParams,
  global?: GlobalLoanParams
): LoanCalculation {
  const totalInvestment = property.purchasePrice + property.buildingImprovements + 
                          property.preOpeningCosts + property.operatingReserve;
  const ltv = property.acquisitionLTV ?? global?.debtAssumptions?.acqLTV ?? DEFAULT_LTV;
  const loanAmount = property.type === "Financed" ? totalInvestment * ltv : 0;
  const equityInvested = totalInvestment - loanAmount;
  
  const interestRate = property.acquisitionInterestRate ?? global?.debtAssumptions?.interestRate ?? DEFAULT_INTEREST_RATE;
  const termYears = property.acquisitionTermYears ?? global?.debtAssumptions?.amortizationYears ?? DEFAULT_TERM_YEARS;
  const taxRate = property.taxRate ?? global?.companyTaxRate ?? DEFAULT_TAX_RATE;
  const commissionRate = global?.salesCommissionRate ?? global?.commissionRate ?? DEFAULT_COMMISSION_RATE;
  
  const buildingValue = property.purchasePrice + property.buildingImprovements;
  const annualDepreciation = buildingValue / DEPRECIATION_YEARS;
  
  const monthlyRate = interestRate / 12;
  const totalPayments = termYears * 12;
  
  // Handle zero interest rate (straight-line principal reduction)
  let monthlyPayment = 0;
  if (loanAmount > 0) {
    if (monthlyRate === 0) {
      // Zero interest: simple principal / payments
      monthlyPayment = loanAmount / totalPayments;
    } else {
      // Standard PMT formula
      monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                       (Math.pow(1 + monthlyRate, totalPayments) - 1);
    }
  }
  
  const modelStart = new Date(global?.modelStartDate || '2026-04-01');
  const acqDate = new Date(property.acquisitionDate || global?.modelStartDate || '2026-04-01');
  const acqMonthsFromModelStart = Math.max(0, 
    (acqDate.getFullYear() - modelStart.getFullYear()) * 12 + 
    (acqDate.getMonth() - modelStart.getMonth())
  );
  
  return {
    totalInvestment,
    loanAmount,
    equityInvested,
    interestRate,
    termYears,
    monthlyRate,
    totalPayments,
    monthlyPayment,
    acqMonthsFromModelStart,
    buildingValue,
    annualDepreciation,
    taxRate,
    commissionRate
  };
}

export function getAcquisitionOutstandingBalance(
  loan: LoanCalculation,
  yearEnd: number
): number {
  if (loan.loanAmount === 0) return 0;
  const endOfYearMonth = (yearEnd + 1) * 12;
  
  // No debt exists before acquisition
  if (endOfYearMonth <= loan.acqMonthsFromModelStart) return 0;
  
  const monthsPaid = Math.max(0, Math.min(endOfYearMonth - loan.acqMonthsFromModelStart, loan.totalPayments));
  if (monthsPaid <= 0) return loan.loanAmount;
  const remainingPayments = loan.totalPayments - monthsPaid;
  if (remainingPayments <= 0) return 0;
  
  // Handle zero interest rate (straight-line principal reduction)
  if (loan.monthlyRate === 0) {
    return loan.loanAmount - (loan.monthlyPayment * monthsPaid);
  }
  
  return loan.monthlyPayment * (1 - Math.pow(1 + loan.monthlyRate, -remainingPayments)) / loan.monthlyRate;
}

export function calculateRefinanceParams(
  property: LoanParams,
  global: GlobalLoanParams | undefined,
  loan: LoanCalculation,
  yearlyNOIData: number[],
  years: number
): RefinanceCalculation {
  const defaultResult: RefinanceCalculation = {
    refiYear: -1,
    refiProceeds: 0,
    refiLoanAmount: 0,
    refiMonthlyPayment: 0,
    refiInterestRate: 0,
    refiTermYears: 0,
    refiMonthlyRate: 0,
    refiTotalPayments: 0
  };
  
  if (property.willRefinance !== "Yes" || !property.refinanceDate || !global?.modelStartDate) {
    return defaultResult;
  }
  
  const modelStart = new Date(global.modelStartDate);
  const refiDate = new Date(property.refinanceDate);
  const monthsDiff = (refiDate.getFullYear() - modelStart.getFullYear()) * 12 + 
                     (refiDate.getMonth() - modelStart.getMonth());
  const refiYear = Math.floor(monthsDiff / 12);
  
  if (refiYear < 0 || refiYear >= years) {
    return defaultResult;
  }
  
  const refiInterestRate = property.refinanceInterestRate ?? global?.debtAssumptions?.interestRate ?? DEFAULT_INTEREST_RATE;
  const refiTermYears = property.refinanceTermYears ?? global?.debtAssumptions?.amortizationYears ?? DEFAULT_TERM_YEARS;
  const refiMonthlyRate = refiInterestRate / 12;
  const refiTotalPayments = refiTermYears * 12;
  
  const refiLTV = property.refinanceLTV ?? global?.debtAssumptions?.refiLTV ?? DEFAULT_REFI_LTV;
  const stabilizedNOI = yearlyNOIData[refiYear] || 0;
  const exitCapRate = property.exitCapRate ?? global?.exitCapRate ?? DEFAULT_EXIT_CAP_RATE;
  const propertyValue = stabilizedNOI / exitCapRate;
  const refiLoanAmount = propertyValue * refiLTV;
  
  // Handle zero interest rate (straight-line principal reduction)
  let refiMonthlyPayment = 0;
  if (refiLoanAmount > 0) {
    if (refiMonthlyRate === 0) {
      refiMonthlyPayment = refiLoanAmount / refiTotalPayments;
    } else {
      refiMonthlyPayment = (refiLoanAmount * refiMonthlyRate * Math.pow(1 + refiMonthlyRate, refiTotalPayments)) / 
                           (Math.pow(1 + refiMonthlyRate, refiTotalPayments) - 1);
    }
  }
  
  const closingCostRate = property.refinanceClosingCostRate ?? global?.debtAssumptions?.refiClosingCostRate ?? DEFAULT_REFI_CLOSING_COST_RATE;
  const closingCosts = refiLoanAmount * closingCostRate;
  const existingDebt = getAcquisitionOutstandingBalance(loan, refiYear - 1);
  const refiProceeds = Math.max(0, refiLoanAmount - closingCosts - existingDebt);
  
  return {
    refiYear,
    refiProceeds,
    refiLoanAmount,
    refiMonthlyPayment,
    refiInterestRate,
    refiTermYears,
    refiMonthlyRate,
    refiTotalPayments
  };
}

export function getRefiOutstandingBalance(
  refi: RefinanceCalculation,
  yearEnd: number
): number {
  if (refi.refiLoanAmount === 0 || refi.refiYear < 0) return 0;
  const yearsFromRefi = yearEnd - refi.refiYear + 1;
  if (yearsFromRefi < 0) return refi.refiLoanAmount;
  const monthsPaid = Math.min(yearsFromRefi * 12, refi.refiTotalPayments);
  if (monthsPaid <= 0) return refi.refiLoanAmount;
  const remainingPayments = refi.refiTotalPayments - monthsPaid;
  if (remainingPayments <= 0) return 0;
  
  // Handle zero interest rate (straight-line principal reduction)
  if (refi.refiMonthlyRate === 0) {
    return refi.refiLoanAmount - (refi.refiMonthlyPayment * monthsPaid);
  }
  
  return refi.refiMonthlyPayment * (1 - Math.pow(1 + refi.refiMonthlyRate, -remainingPayments)) / refi.refiMonthlyRate;
}

export function getOutstandingDebtAtYear(
  loan: LoanCalculation,
  refi: RefinanceCalculation,
  year: number
): number {
  if (refi.refiYear >= 0 && year >= refi.refiYear && refi.refiLoanAmount > 0) {
    return getRefiOutstandingBalance(refi, year);
  }
  return getAcquisitionOutstandingBalance(loan, year);
}

export function calculateYearlyDebtService(
  loan: LoanCalculation,
  refi: RefinanceCalculation,
  year: number
): YearlyDebtService {
  let yearlyDebtService = 0;
  let yearlyInterest = 0;
  let yearlyPrincipal = 0;
  
  const yearStartMonth = year * 12;
  const yearEndMonth = (year + 1) * 12;
  
  if (refi.refiYear >= 0 && year >= refi.refiYear && refi.refiLoanAmount > 0) {
    const yearsFromRefi = year - refi.refiYear;
    const monthsFromRefi = yearsFromRefi * 12;
    let refiBalance = refi.refiLoanAmount;
    for (let pm = 0; pm < monthsFromRefi; pm++) {
      const interest = refiBalance * refi.refiMonthlyRate;
      const principal = refi.refiMonthlyPayment - interest;
      refiBalance -= principal;
    }
    
    for (let m = 0; m < 12; m++) {
      const interest = refiBalance * refi.refiMonthlyRate;
      const principal = refi.refiMonthlyPayment - interest;
      yearlyInterest += interest;
      yearlyPrincipal += principal;
      refiBalance -= principal;
    }
    yearlyDebtService = refi.refiMonthlyPayment * 12;
  } else if (loan.loanAmount > 0) {
    const loanPaymentsThisYear = Math.min(12, 
      Math.max(0, Math.min(yearEndMonth, loan.acqMonthsFromModelStart + loan.totalPayments) - Math.max(yearStartMonth, loan.acqMonthsFromModelStart))
    );
    
    if (loanPaymentsThisYear > 0) {
      const paymentsMadeBefore = Math.max(0, yearStartMonth - loan.acqMonthsFromModelStart);
      let remainingBalance = loan.loanAmount;
      for (let pm = 0; pm < paymentsMadeBefore; pm++) {
        const interest = remainingBalance * loan.monthlyRate;
        const principal = loan.monthlyPayment - interest;
        remainingBalance -= principal;
      }
      
      for (let m = 0; m < loanPaymentsThisYear; m++) {
        const interestPayment = remainingBalance * loan.monthlyRate;
        const principalPayment = loan.monthlyPayment - interestPayment;
        yearlyInterest += interestPayment;
        yearlyPrincipal += principalPayment;
        remainingBalance -= principalPayment;
      }
      yearlyDebtService = loan.monthlyPayment * loanPaymentsThisYear;
    }
  }
  
  return {
    debtService: yearlyDebtService,
    interestExpense: yearlyInterest,
    principalPayment: yearlyPrincipal
  };
}

export function calculateExitValue(
  noi: number,
  loan: LoanCalculation,
  refi: RefinanceCalculation,
  year: number,
  exitCapRate?: number | null
): number {
  const capRate = exitCapRate ?? DEFAULT_EXIT_CAP_RATE;
  const grossValue = noi / capRate;
  const commission = grossValue * loan.commissionRate;
  const outstandingDebt = getOutstandingDebtAtYear(loan, refi, year);
  return grossValue - commission - outstandingDebt;
}

export function getAcquisitionYear(loan: LoanCalculation): number {
  return Math.floor(loan.acqMonthsFromModelStart / 12);
}

export interface YearlyCashFlowResult {
  year: number;
  // Operating Performance
  noi: number;
  interestExpense: number;
  depreciation: number;
  // GAAP Net Income Calculation
  netIncome: number;           // NOI - Interest - Depreciation - Tax
  taxLiability: number;
  // GAAP Operating Cash Flow (Indirect Method)
  operatingCashFlow: number;   // Net Income + Depreciation (add back non-cash)
  workingCapitalChange: number; // Changes in receivables, payables, etc.
  cashFromOperations: number;  // OCF ± Working Capital Changes
  // GAAP Free Cash Flow (to the property)
  maintenanceCapex: number;    // Ongoing capital expenditures (FF&E reserves, maintenance)
  freeCashFlow: number;        // Cash from Operations - Maintenance CapEx
  // Financing Activities
  principalPayment: number;
  debtService: number;
  // Free Cash Flow to Equity (after debt service)
  freeCashFlowToEquity: number; // FCF - Principal Payments
  // Legacy fields for compatibility
  btcf: number;                // NOI - Debt Service (Before-Tax Cash Flow)
  taxableIncome: number;       // NOI - Interest - Depreciation
  atcf: number;                // BTCF - Tax (After-Tax Cash Flow)
  // Capital Events (Investing/Financing)
  capitalExpenditures: number; // Initial equity investment (negative in acquisition year)
  refinancingProceeds: number;
  exitValue: number;
  // Net to Investors
  netCashFlowToInvestors: number;
  cumulativeCashFlow: number;
}

export function calculatePropertyYearlyCashFlows(
  yearlyNOIData: number[],
  property: LoanParams,
  global?: GlobalLoanParams,
  years: number = 10
): YearlyCashFlowResult[] {
  const loan = calculateLoanParams(property, global);
  const refi = calculateRefinanceParams(property, global, loan, yearlyNOIData, years);
  
  const results: YearlyCashFlowResult[] = [];
  let cumulative = 0;
  const acquisitionYear = getAcquisitionYear(loan);
  
  for (let y = 0; y < years; y++) {
    const noi = yearlyNOIData[y] || 0;
    const debt = calculateYearlyDebtService(loan, refi, y);
    const depreciation = loan.annualDepreciation;
    
    // Legacy real estate investment analysis calculations
    const btcf = noi - debt.debtService;
    const taxableIncome = noi - debt.interestExpense - depreciation;
    const taxLiability = taxableIncome > 0 ? taxableIncome * loan.taxRate : 0;
    const atcf = btcf - taxLiability;
    
    // GAAP-compliant calculations (Indirect Method)
    // Step 1: Net Income = NOI - Interest - Depreciation - Taxes
    const netIncome = noi - debt.interestExpense - depreciation - taxLiability;
    
    // Step 2: Operating Cash Flow = Net Income + Depreciation (add back non-cash expense)
    const operatingCashFlow = netIncome + depreciation;
    
    // Step 3: Working Capital Changes (for stabilized properties, typically minimal)
    // Can be expanded to include A/R, A/P changes if needed
    const workingCapitalChange = 0;
    
    // Step 4: Cash from Operations = OCF ± Working Capital Changes
    const cashFromOperations = operatingCashFlow - workingCapitalChange;
    
    // Step 5: GAAP Free Cash Flow = Cash from Operations - Maintenance CapEx
    // Note: For hotels, FF&E reserves are already expensed in NOI, so maintenance capex is minimal
    // This represents any additional capital expenditures not included in operating expenses
    const maintenanceCapex = 0; // Already included in costRateFFE within NOI
    const freeCashFlow = cashFromOperations - maintenanceCapex;
    
    // Step 6: Free Cash Flow to Equity = FCF - Principal Payments
    // Principal is a financing activity - cash used to repay debt reduces equity returns
    const freeCashFlowToEquity = freeCashFlow - debt.principalPayment;
    
    // Capital events (Investing/Financing)
    const capex = y === acquisitionYear ? -loan.equityInvested : 0;
    const refiProceedsThisYear = y === refi.refiYear ? refi.refiProceeds : 0;
    
    let exitValue = 0;
    if (y === years - 1) {
      exitValue = calculateExitValue(noi, loan, refi, y, property.exitCapRate);
    }
    
    // Net cash flow to investors = FCFE + Capital Events + Exit
    const netCashFlowToInvestors = freeCashFlowToEquity + capex + refiProceedsThisYear + exitValue;
    cumulative += netCashFlowToInvestors;
    
    results.push({
      year: y + 1,
      noi,
      interestExpense: debt.interestExpense,
      depreciation,
      // GAAP fields
      netIncome,
      taxLiability,
      operatingCashFlow,
      workingCapitalChange,
      cashFromOperations,
      maintenanceCapex,
      freeCashFlow,
      // Financing
      principalPayment: debt.principalPayment,
      debtService: debt.debtService,
      freeCashFlowToEquity,
      // Legacy fields
      btcf,
      taxableIncome,
      atcf,
      // Capital events
      capitalExpenditures: capex,
      refinancingProceeds: refiProceedsThisYear,
      exitValue,
      // Net to investors
      netCashFlowToInvestors,
      cumulativeCashFlow: cumulative
    });
  }
  
  return results;
}

export function getPropertyIRRCashFlows(
  yearlyNOIData: number[],
  property: LoanParams,
  global?: GlobalLoanParams,
  years: number = 10
): number[] {
  const yearlyResults = calculatePropertyYearlyCashFlows(yearlyNOIData, property, global, years);
  return yearlyResults.map(r => r.netCashFlowToInvestors);
}
