import { MonthlyFinancials } from "./financialEngine";

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

const DEFAULT_LTV = 0.75;
const DEFAULT_INTEREST_RATE = 0.09;
const DEFAULT_TERM_YEARS = 25;
const DEFAULT_TAX_RATE = 0.25;
const DEFAULT_COMMISSION_RATE = 0.05;
const DEFAULT_EXIT_CAP_RATE = 0.085;
const DEPRECIATION_YEARS = 27.5;
const DEFAULT_REFI_LTV = 0.65;
const DEFAULT_REFI_CLOSING_COST_RATE = 0.03;

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
  const taxRate = property.taxRate ?? DEFAULT_TAX_RATE;
  const commissionRate = global?.commissionRate ?? DEFAULT_COMMISSION_RATE;
  
  const buildingValue = property.purchasePrice + property.buildingImprovements;
  const annualDepreciation = buildingValue / DEPRECIATION_YEARS;
  
  const monthlyRate = interestRate / 12;
  const totalPayments = termYears * 12;
  const monthlyPayment = loanAmount > 0 
    ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1)
    : 0;
  
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
  const monthsPaid = Math.max(0, Math.min(endOfYearMonth - loan.acqMonthsFromModelStart, loan.totalPayments));
  if (monthsPaid <= 0) return loan.loanAmount;
  const remainingPayments = loan.totalPayments - monthsPaid;
  if (remainingPayments <= 0) return 0;
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
  const exitCapRate = property.exitCapRate ?? DEFAULT_EXIT_CAP_RATE;
  const propertyValue = stabilizedNOI / exitCapRate;
  const refiLoanAmount = propertyValue * refiLTV;
  
  const refiMonthlyPayment = (refiLoanAmount * refiMonthlyRate * Math.pow(1 + refiMonthlyRate, refiTotalPayments)) / 
                             (Math.pow(1 + refiMonthlyRate, refiTotalPayments) - 1);
  
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
  noi: number;
  debtService: number;
  interestExpense: number;
  principalPayment: number;
  depreciation: number;
  btcf: number;
  taxableIncome: number;
  taxLiability: number;
  atcf: number;
  capitalExpenditures: number;
  refinancingProceeds: number;
  exitValue: number;
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
    
    const btcf = noi - debt.debtService;
    const taxableIncome = noi - debt.interestExpense - loan.annualDepreciation;
    const taxLiability = taxableIncome > 0 ? taxableIncome * loan.taxRate : 0;
    const atcf = btcf - taxLiability;
    
    const capex = y === acquisitionYear ? -loan.equityInvested : 0;
    const refiProceedsThisYear = y === refi.refiYear ? refi.refiProceeds : 0;
    
    let exitValue = 0;
    if (y === years - 1) {
      exitValue = calculateExitValue(noi, loan, refi, y, property.exitCapRate);
    }
    
    const netCashFlowToInvestors = atcf + capex + refiProceedsThisYear + exitValue;
    cumulative += netCashFlowToInvestors;
    
    results.push({
      year: y + 1,
      noi,
      debtService: debt.debtService,
      interestExpense: debt.interestExpense,
      principalPayment: debt.principalPayment,
      depreciation: loan.annualDepreciation,
      btcf,
      taxableIncome,
      taxLiability,
      atcf,
      capitalExpenditures: capex,
      refinancingProceeds: refiProceedsThisYear,
      exitValue,
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
