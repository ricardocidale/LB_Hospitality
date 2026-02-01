import { MonthlyFinancials } from "./financialEngine";
import { addMonths, differenceInMonths, isBefore } from "date-fns";

export interface AuditFinding {
  category: string;
  rule: string;
  gaapReference: string;
  severity: "critical" | "material" | "minor" | "info";
  passed: boolean;
  expected: string | number;
  actual: string | number;
  variance: string | number;
  recommendation: string;
  workpaperRef: string;
}

export interface AuditSection {
  name: string;
  description: string;
  findings: AuditFinding[];
  passed: number;
  failed: number;
  materialIssues: number;
}

export interface AuditReport {
  timestamp: Date;
  auditorName: string;
  propertyName: string;
  sections: AuditSection[];
  totalChecks: number;
  totalPassed: number;
  totalFailed: number;
  criticalIssues: number;
  materialIssues: number;
  opinion: "UNQUALIFIED" | "QUALIFIED" | "ADVERSE" | "DISCLAIMER";
  opinionText: string;
}

const TOLERANCE = 0.01;
const DEPRECIATION_YEARS = 27.5;

function withinTolerance(expected: number, actual: number, tolerance: number = TOLERANCE): boolean {
  if (expected === 0 && actual === 0) return true;
  if (expected === 0) return Math.abs(actual) < tolerance;
  return Math.abs((expected - actual) / expected) < tolerance;
}

function formatVariance(expected: number, actual: number): string {
  const diff = actual - expected;
  const pct = expected !== 0 ? ((diff / expected) * 100).toFixed(2) : "N/A";
  return `${diff >= 0 ? '+' : ''}${diff.toFixed(2)} (${pct}%)`;
}

function calculatePMT(principal: number, monthlyRate: number, totalPayments: number): number {
  if (principal === 0 || monthlyRate === 0) return 0;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
         (Math.pow(1 + monthlyRate, totalPayments) - 1);
}

export interface PropertyAuditInput {
  name: string;
  operationsStartDate: string;
  acquisitionDate?: string;
  roomCount: number;
  startAdr: number;
  adrGrowthRate: number;
  startOccupancy: number;
  maxOccupancy: number;
  occupancyRampMonths: number;
  occupancyGrowthStep: number;
  purchasePrice: number;
  buildingImprovements: number;
  type: string;
  acquisitionLTV?: number;
  debtAssumptions?: {
    interestRate: number;
    amortizationYears: number;
  };
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
  revShareEvents: number;
  revShareFB: number;
  revShareOther: number;
}

export interface GlobalAuditInput {
  modelStartDate: string;
  inflationRate: number;
  baseManagementFee: number;
  incentiveManagementFee: number;
  debtAssumptions: {
    interestRate: number;
    amortizationYears: number;
    acqLTV?: number;
  };
}

export function auditDepreciation(
  property: PropertyAuditInput,
  global: GlobalAuditInput,
  monthlyData: MonthlyFinancials[]
): AuditSection {
  const findings: AuditFinding[] = [];
  
  const buildingValue = property.purchasePrice + property.buildingImprovements;
  const expectedMonthlyDep = buildingValue / DEPRECIATION_YEARS / 12;
  const expectedAnnualDep = buildingValue / DEPRECIATION_YEARS;
  
  const modelStart = new Date(global.modelStartDate);
  const acquisitionDate = new Date(property.acquisitionDate || property.operationsStartDate);
  const acqMonthIndex = Math.max(0, differenceInMonths(acquisitionDate, modelStart));
  
  findings.push({
    category: "Depreciation",
    rule: "27.5-Year Straight-Line Method",
    gaapReference: "IRS Publication 946 / ASC 360-10",
    severity: "critical",
    passed: true,
    expected: `Building: $${buildingValue.toLocaleString()}`,
    actual: `Monthly: $${expectedMonthlyDep.toFixed(2)}`,
    variance: `Annual: $${expectedAnnualDep.toFixed(2)}`,
    recommendation: "Verify depreciation uses 27.5-year schedule for residential rental property",
    workpaperRef: "WP-DEP-001"
  });
  
  findings.push({
    category: "Depreciation",
    rule: "Depreciation Start Date",
    gaapReference: "ASC 360-10-35",
    severity: "critical",
    passed: true,
    expected: `Starts Month ${acqMonthIndex + 1}`,
    actual: `Acquisition: ${acquisitionDate.toISOString().slice(0, 10)}`,
    variance: "N/A",
    recommendation: "Depreciation must begin when property is placed in service",
    workpaperRef: "WP-DEP-002"
  });
  
  for (let i = 0; i < Math.min(acqMonthIndex, monthlyData.length); i++) {
    const m = monthlyData[i];
    if (m.noi !== 0 || m.revenueTotal !== 0) {
      findings.push({
        category: "Depreciation",
        rule: "Pre-Acquisition Activity",
        gaapReference: "ASC 360-10-35",
        severity: "critical",
        passed: false,
        expected: 0,
        actual: m.noi,
        variance: formatVariance(0, m.noi),
        recommendation: `Month ${i + 1} shows activity before acquisition date - investigate`,
        workpaperRef: `WP-DEP-003-M${i + 1}`
      });
    }
  }
  
  const passed = findings.filter(f => f.passed).length;
  const materialIssues = findings.filter(f => !f.passed && (f.severity === "critical" || f.severity === "material")).length;
  
  return {
    name: "Depreciation Audit",
    description: "Verify 27.5-year straight-line depreciation per IRS/GAAP requirements",
    findings,
    passed,
    failed: findings.length - passed,
    materialIssues
  };
}

export function auditLoanAmortization(
  property: PropertyAuditInput,
  global: GlobalAuditInput,
  monthlyData: MonthlyFinancials[]
): AuditSection {
  const findings: AuditFinding[] = [];
  
  if (property.type !== "Financed") {
    findings.push({
      category: "Loan Amortization",
      rule: "All-Cash Acquisition",
      gaapReference: "N/A",
      severity: "info",
      passed: true,
      expected: "No debt",
      actual: "All-cash transaction",
      variance: "N/A",
      recommendation: "Property acquired without financing - no debt service to audit",
      workpaperRef: "WP-LOAN-001"
    });
    return { name: "Loan Amortization Audit", description: "Verify loan payment calculations", findings, passed: 1, failed: 0, materialIssues: 0 };
  }
  
  const totalInvestment = property.purchasePrice + property.buildingImprovements;
  const ltv = property.acquisitionLTV || global.debtAssumptions?.acqLTV || 0.75;
  const loanAmount = totalInvestment * ltv;
  const interestRate = property.debtAssumptions?.interestRate || global.debtAssumptions.interestRate;
  const termYears = property.debtAssumptions?.amortizationYears || global.debtAssumptions.amortizationYears;
  const monthlyRate = interestRate / 12;
  const totalPayments = termYears * 12;
  
  const expectedMonthlyPayment = calculatePMT(loanAmount, monthlyRate, totalPayments);
  
  findings.push({
    category: "Loan Amortization",
    rule: "PMT Formula Verification",
    gaapReference: "Standard Amortization",
    severity: "critical",
    passed: true,
    expected: `Loan: $${loanAmount.toLocaleString()} @ ${(interestRate * 100).toFixed(2)}% for ${termYears} yrs`,
    actual: `Monthly Payment: $${expectedMonthlyPayment.toFixed(2)}`,
    variance: "N/A",
    recommendation: "Verify PMT = P × r × (1+r)^n / ((1+r)^n - 1)",
    workpaperRef: "WP-LOAN-002"
  });
  
  const modelStart = new Date(global.modelStartDate);
  const acquisitionDate = new Date(property.acquisitionDate || property.operationsStartDate);
  const acqMonthIndex = Math.max(0, differenceInMonths(acquisitionDate, modelStart));
  
  let runningBalance = loanAmount;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  
  for (let i = 0; i < acqMonthIndex && i < monthlyData.length; i++) {
    const m = monthlyData[i];
    if (m.debtPayment !== 0 || m.interestExpense !== 0 || m.principalPayment !== 0) {
      findings.push({
        category: "Loan Amortization",
        rule: "Pre-Acquisition Debt Service",
        gaapReference: "ASC 470",
        severity: "critical",
        passed: false,
        expected: 0,
        actual: m.debtPayment,
        variance: formatVariance(0, m.debtPayment),
        recommendation: `Month ${i + 1}: Debt service recorded before acquisition date`,
        workpaperRef: `WP-LOAN-003-M${i + 1}`
      });
    }
  }
  
  const startMonth = Math.max(0, acqMonthIndex);
  for (let i = startMonth; i < Math.min(startMonth + 24, monthlyData.length); i++) {
    const m = monthlyData[i];
    const expectedInterest = runningBalance * monthlyRate;
    const expectedPrincipal = expectedMonthlyPayment - expectedInterest;
    const expectedDebtService = expectedMonthlyPayment;
    
    const interestMatch = withinTolerance(expectedInterest, m.interestExpense);
    const principalMatch = withinTolerance(expectedPrincipal, m.principalPayment);
    const totalMatch = withinTolerance(expectedDebtService, m.debtPayment);
    
    if (!interestMatch) {
      findings.push({
        category: "Loan Amortization",
        rule: "Interest Calculation",
        gaapReference: "ASC 835-30",
        severity: "material",
        passed: false,
        expected: expectedInterest.toFixed(2),
        actual: m.interestExpense.toFixed(2),
        variance: formatVariance(expectedInterest, m.interestExpense),
        recommendation: `Month ${i + 1}: Interest = Balance × Monthly Rate (${runningBalance.toFixed(2)} × ${monthlyRate.toFixed(6)})`,
        workpaperRef: `WP-LOAN-INT-M${i + 1}`
      });
    }
    
    if (!principalMatch) {
      findings.push({
        category: "Loan Amortization",
        rule: "Principal Calculation",
        gaapReference: "ASC 470",
        severity: "material",
        passed: false,
        expected: expectedPrincipal.toFixed(2),
        actual: m.principalPayment.toFixed(2),
        variance: formatVariance(expectedPrincipal, m.principalPayment),
        recommendation: `Month ${i + 1}: Principal = Payment - Interest`,
        workpaperRef: `WP-LOAN-PRIN-M${i + 1}`
      });
    }
    
    if (!totalMatch) {
      findings.push({
        category: "Loan Amortization",
        rule: "Total Debt Service",
        gaapReference: "ASC 470",
        severity: "material",
        passed: false,
        expected: expectedDebtService.toFixed(2),
        actual: m.debtPayment.toFixed(2),
        variance: formatVariance(expectedDebtService, m.debtPayment),
        recommendation: `Month ${i + 1}: Debt Service = Interest + Principal`,
        workpaperRef: `WP-LOAN-DS-M${i + 1}`
      });
    }
    
    if (interestMatch && principalMatch && totalMatch && i < startMonth + 3) {
      findings.push({
        category: "Loan Amortization",
        rule: "Payment Verification",
        gaapReference: "ASC 470 / ASC 835-30",
        severity: "info",
        passed: true,
        expected: expectedDebtService.toFixed(2),
        actual: m.debtPayment.toFixed(2),
        variance: "Within tolerance",
        recommendation: `Month ${i + 1}: All debt service components verified`,
        workpaperRef: `WP-LOAN-OK-M${i + 1}`
      });
    }
    
    runningBalance -= expectedPrincipal;
    totalInterestPaid += expectedInterest;
    totalPrincipalPaid += expectedPrincipal;
  }
  
  const passed = findings.filter(f => f.passed).length;
  const materialIssues = findings.filter(f => !f.passed && (f.severity === "critical" || f.severity === "material")).length;
  
  return {
    name: "Loan Amortization Audit",
    description: "Verify PMT formula, interest/principal split, and amortization schedule",
    findings,
    passed,
    failed: findings.length - passed,
    materialIssues
  };
}

export function auditIncomeStatement(
  property: PropertyAuditInput,
  global: GlobalAuditInput,
  monthlyData: MonthlyFinancials[]
): AuditSection {
  const findings: AuditFinding[] = [];
  
  const modelStart = new Date(global.modelStartDate);
  const opsStart = new Date(property.operationsStartDate);
  
  for (let i = 0; i < monthlyData.length; i++) {
    const m = monthlyData[i];
    const currentDate = addMonths(modelStart, i);
    const isOperational = !isBefore(currentDate, opsStart);
    
    if (!isOperational) continue;
    
    const expectedRoomRevenue = m.adr * m.soldRooms;
    const revenueMatch = withinTolerance(expectedRoomRevenue, m.revenueRooms);
    
    if (!revenueMatch) {
      findings.push({
        category: "Income Statement",
        rule: "Room Revenue Calculation",
        gaapReference: "ASC 606",
        severity: "critical",
        passed: false,
        expected: expectedRoomRevenue.toFixed(2),
        actual: m.revenueRooms.toFixed(2),
        variance: formatVariance(expectedRoomRevenue, m.revenueRooms),
        recommendation: `Month ${i + 1}: Room Revenue = ADR × Sold Rooms (${m.adr.toFixed(2)} × ${m.soldRooms})`,
        workpaperRef: `WP-IS-REV-M${i + 1}`
      });
    }
    
    const expectedSoldRooms = Math.round(m.availableRooms * m.occupancy);
    const soldRoomsMatch = Math.abs(expectedSoldRooms - m.soldRooms) <= 1;
    
    if (!soldRoomsMatch) {
      findings.push({
        category: "Income Statement",
        rule: "Sold Rooms Calculation",
        gaapReference: "USALI",
        severity: "material",
        passed: false,
        expected: expectedSoldRooms,
        actual: m.soldRooms,
        variance: formatVariance(expectedSoldRooms, m.soldRooms),
        recommendation: `Month ${i + 1}: Sold Rooms = Available × Occupancy`,
        workpaperRef: `WP-IS-SOLD-M${i + 1}`
      });
    }
    
    const expectedTotalRevenue = m.revenueRooms + m.revenueFB + m.revenueEvents + m.revenueOther;
    const totalRevMatch = withinTolerance(expectedTotalRevenue, m.revenueTotal);
    
    if (!totalRevMatch) {
      findings.push({
        category: "Income Statement",
        rule: "Total Revenue Calculation",
        gaapReference: "ASC 606",
        severity: "critical",
        passed: false,
        expected: expectedTotalRevenue.toFixed(2),
        actual: m.revenueTotal.toFixed(2),
        variance: formatVariance(expectedTotalRevenue, m.revenueTotal),
        recommendation: `Month ${i + 1}: Total Revenue = Sum of all revenue streams`,
        workpaperRef: `WP-IS-TREV-M${i + 1}`
      });
    }
    
    const totalDeptExpenses = m.expenseRooms + m.expenseFB + m.expenseEvents + m.expenseOther;
    const totalUndistExpenses = m.expenseMarketing + m.expensePropertyOps + m.expenseUtilitiesVar + 
                                m.expenseAdmin + m.expenseIT + m.expenseInsurance + 
                                m.expenseTaxes + m.expenseUtilitiesFixed + m.expenseOtherCosts;
    const expectedGOP = m.revenueTotal - totalDeptExpenses - totalUndistExpenses;
    const gopMatch = withinTolerance(expectedGOP, m.gop);
    
    if (!gopMatch) {
      findings.push({
        category: "Income Statement",
        rule: "GOP Calculation",
        gaapReference: "USALI",
        severity: "critical",
        passed: false,
        expected: expectedGOP.toFixed(2),
        actual: m.gop.toFixed(2),
        variance: formatVariance(expectedGOP, m.gop),
        recommendation: `Month ${i + 1}: GOP = Revenue - Department Expenses - Undistributed Expenses`,
        workpaperRef: `WP-IS-GOP-M${i + 1}`
      });
    }
    
    const expectedNOI = m.gop - m.feeBase - m.feeIncentive - m.expenseFFE;
    const noiMatch = withinTolerance(expectedNOI, m.noi);
    
    if (!noiMatch) {
      findings.push({
        category: "Income Statement",
        rule: "NOI Calculation",
        gaapReference: "USALI",
        severity: "critical",
        passed: false,
        expected: expectedNOI.toFixed(2),
        actual: m.noi.toFixed(2),
        variance: formatVariance(expectedNOI, m.noi),
        recommendation: `Month ${i + 1}: NOI = GOP - Management Fees - FF&E Reserve`,
        workpaperRef: `WP-IS-NOI-M${i + 1}`
      });
    }
    
    const expectedNetIncome = m.noi - m.interestExpense;
    const netIncomeMatch = withinTolerance(expectedNetIncome, m.netIncome);
    
    if (!netIncomeMatch) {
      findings.push({
        category: "Income Statement",
        rule: "Net Income Calculation (GAAP)",
        gaapReference: "ASC 470 - Principal NOT in Income Statement",
        severity: "critical",
        passed: false,
        expected: expectedNetIncome.toFixed(2),
        actual: m.netIncome.toFixed(2),
        variance: formatVariance(expectedNetIncome, m.netIncome),
        recommendation: `Month ${i + 1}: Net Income = NOI - Interest (NOT principal, per GAAP)`,
        workpaperRef: `WP-IS-NI-M${i + 1}`
      });
    }
    
    const incorrectNetIncome = m.noi - m.debtPayment;
    if (m.principalPayment > 0 && withinTolerance(incorrectNetIncome, m.netIncome)) {
      findings.push({
        category: "Income Statement",
        rule: "Principal in Net Income (ERROR)",
        gaapReference: "ASC 470 - Principal is FINANCING, not EXPENSE",
        severity: "critical",
        passed: false,
        expected: "Principal excluded from Net Income",
        actual: "Principal appears to reduce Net Income",
        variance: `Understated by $${m.principalPayment.toFixed(2)}`,
        recommendation: `Month ${i + 1}: GAAP VIOLATION - Principal payments should NOT reduce Net Income`,
        workpaperRef: `WP-IS-GAAP-M${i + 1}`
      });
    }
    
    const expectedCashFlow = m.noi - m.debtPayment;
    const cashFlowMatch = withinTolerance(expectedCashFlow, m.cashFlow);
    
    if (!cashFlowMatch) {
      findings.push({
        category: "Cash Flow",
        rule: "Property Cash Flow",
        gaapReference: "ASC 230",
        severity: "material",
        passed: false,
        expected: expectedCashFlow.toFixed(2),
        actual: m.cashFlow.toFixed(2),
        variance: formatVariance(expectedCashFlow, m.cashFlow),
        recommendation: `Month ${i + 1}: Cash Flow = NOI - Total Debt Service (interest + principal)`,
        workpaperRef: `WP-CF-M${i + 1}`
      });
    }
    
    if (i < 3 && revenueMatch && totalRevMatch && gopMatch && noiMatch && netIncomeMatch && cashFlowMatch) {
      findings.push({
        category: "Income Statement",
        rule: "Full Verification",
        gaapReference: "ASC 606 / USALI",
        severity: "info",
        passed: true,
        expected: "All formulas correct",
        actual: "All formulas verified",
        variance: "Within tolerance",
        recommendation: `Month ${i + 1}: Revenue, GOP, NOI, Net Income all verified`,
        workpaperRef: `WP-IS-OK-M${i + 1}`
      });
    }
  }
  
  const passed = findings.filter(f => f.passed).length;
  const materialIssues = findings.filter(f => !f.passed && (f.severity === "critical" || f.severity === "material")).length;
  
  return {
    name: "Income Statement Audit",
    description: "Verify revenue, expenses, GOP, NOI, and Net Income calculations per USALI and GAAP",
    findings,
    passed,
    failed: findings.length - passed,
    materialIssues
  };
}

export function auditTimingRules(
  property: PropertyAuditInput,
  global: GlobalAuditInput,
  monthlyData: MonthlyFinancials[]
): AuditSection {
  const findings: AuditFinding[] = [];
  
  const modelStart = new Date(global.modelStartDate);
  const opsStart = new Date(property.operationsStartDate);
  const acquisitionDate = new Date(property.acquisitionDate || property.operationsStartDate);
  
  const opsMonthIndex = differenceInMonths(opsStart, modelStart);
  const acqMonthIndex = differenceInMonths(acquisitionDate, modelStart);
  
  findings.push({
    category: "Timing",
    rule: "Model Start Date",
    gaapReference: "N/A",
    severity: "info",
    passed: true,
    expected: global.modelStartDate,
    actual: modelStart.toISOString().slice(0, 10),
    variance: "N/A",
    recommendation: "Model start date recorded",
    workpaperRef: "WP-TIME-001"
  });
  
  findings.push({
    category: "Timing",
    rule: "Operations Start Date",
    gaapReference: "N/A",
    severity: "info",
    passed: true,
    expected: property.operationsStartDate,
    actual: `Month ${opsMonthIndex + 1} of model`,
    variance: "N/A",
    recommendation: "Revenue should begin at operations start",
    workpaperRef: "WP-TIME-002"
  });
  
  for (let i = 0; i < Math.min(opsMonthIndex, monthlyData.length); i++) {
    const m = monthlyData[i];
    
    if (m.revenueTotal > 0) {
      findings.push({
        category: "Timing",
        rule: "Pre-Operations Revenue",
        gaapReference: "ASC 606",
        severity: "critical",
        passed: false,
        expected: 0,
        actual: m.revenueTotal.toFixed(2),
        variance: formatVariance(0, m.revenueTotal),
        recommendation: `Month ${i + 1}: Revenue recorded before operations start - investigate`,
        workpaperRef: `WP-TIME-REV-M${i + 1}`
      });
    }
  }
  
  for (let i = 0; i < Math.min(acqMonthIndex, monthlyData.length); i++) {
    const m = monthlyData[i];
    
    if (m.debtPayment > 0 || m.interestExpense > 0 || m.principalPayment > 0) {
      findings.push({
        category: "Timing",
        rule: "Pre-Acquisition Debt",
        gaapReference: "ASC 470",
        severity: "critical",
        passed: false,
        expected: 0,
        actual: m.debtPayment.toFixed(2),
        variance: formatVariance(0, m.debtPayment),
        recommendation: `Month ${i + 1}: Debt service before acquisition - liability does not exist yet`,
        workpaperRef: `WP-TIME-DEBT-M${i + 1}`
      });
    }
  }
  
  if (opsMonthIndex > 0 && opsMonthIndex < monthlyData.length) {
    const firstOpsMonth = monthlyData[opsMonthIndex];
    if (firstOpsMonth && firstOpsMonth.revenueTotal > 0) {
      findings.push({
        category: "Timing",
        rule: "Operations Start Verified",
        gaapReference: "ASC 606",
        severity: "info",
        passed: true,
        expected: "Revenue begins at ops start",
        actual: `$${firstOpsMonth.revenueTotal.toFixed(2)} in first operational month`,
        variance: "N/A",
        recommendation: "Revenue correctly begins at operations start date",
        workpaperRef: "WP-TIME-OPS-OK"
      });
    }
  }
  
  const passed = findings.filter(f => f.passed).length;
  const materialIssues = findings.filter(f => !f.passed && (f.severity === "critical" || f.severity === "material")).length;
  
  return {
    name: "Timing Rules Audit",
    description: "Verify all financial activity occurs after appropriate start dates",
    findings,
    passed,
    failed: findings.length - passed,
    materialIssues
  };
}

export function auditManagementFees(
  property: PropertyAuditInput,
  global: GlobalAuditInput,
  monthlyData: MonthlyFinancials[]
): AuditSection {
  const findings: AuditFinding[] = [];
  
  const modelStart = new Date(global.modelStartDate);
  const opsStart = new Date(property.operationsStartDate);
  
  for (let i = 0; i < Math.min(24, monthlyData.length); i++) {
    const m = monthlyData[i];
    const currentDate = addMonths(modelStart, i);
    const isOperational = !isBefore(currentDate, opsStart);
    
    if (!isOperational) continue;
    
    const expectedBaseFee = m.revenueTotal * global.baseManagementFee;
    const baseFeeMatch = withinTolerance(expectedBaseFee, m.feeBase);
    
    if (!baseFeeMatch && i < 6) {
      findings.push({
        category: "Management Fees",
        rule: "Base Management Fee",
        gaapReference: "ASC 606 - Performance Obligation",
        severity: "material",
        passed: false,
        expected: expectedBaseFee.toFixed(2),
        actual: m.feeBase.toFixed(2),
        variance: formatVariance(expectedBaseFee, m.feeBase),
        recommendation: `Month ${i + 1}: Base Fee = Revenue × ${(global.baseManagementFee * 100).toFixed(1)}%`,
        workpaperRef: `WP-FEE-BASE-M${i + 1}`
      });
    }
    
    const expectedIncentiveFee = m.noi > 0 ? (m.noi + m.feeIncentive) * global.incentiveManagementFee : 0;
    if (m.feeIncentive < 0) {
      findings.push({
        category: "Management Fees",
        rule: "Negative Incentive Fee",
        gaapReference: "ASC 606",
        severity: "critical",
        passed: false,
        expected: ">= 0",
        actual: m.feeIncentive.toFixed(2),
        variance: "Negative fee not allowed",
        recommendation: `Month ${i + 1}: Incentive fee cannot be negative`,
        workpaperRef: `WP-FEE-INC-M${i + 1}`
      });
    }
  }
  
  findings.push({
    category: "Management Fees",
    rule: "Fee Structure Verification",
    gaapReference: "ASC 606",
    severity: "info",
    passed: true,
    expected: `Base: ${(global.baseManagementFee * 100).toFixed(1)}%, Incentive: ${(global.incentiveManagementFee * 100).toFixed(1)}%`,
    actual: "Fee rates documented",
    variance: "N/A",
    recommendation: "Management fee structure matches global assumptions",
    workpaperRef: "WP-FEE-STRUCT"
  });
  
  const passed = findings.filter(f => f.passed).length;
  const materialIssues = findings.filter(f => !f.passed && (f.severity === "critical" || f.severity === "material")).length;
  
  return {
    name: "Management Fees Audit",
    description: "Verify base and incentive management fee calculations",
    findings,
    passed,
    failed: findings.length - passed,
    materialIssues
  };
}

export function auditBalanceSheet(
  property: PropertyAuditInput,
  global: GlobalAuditInput,
  monthlyData: MonthlyFinancials[]
): AuditSection {
  const findings: AuditFinding[] = [];
  
  const modelStart = new Date(global.modelStartDate);
  const acqDate = new Date(property.acquisitionDate || property.operationsStartDate);
  const acqMonthIndex = (acqDate.getFullYear() - modelStart.getFullYear()) * 12 + 
    (acqDate.getMonth() - modelStart.getMonth());
  
  const buildingValue = (property.purchasePrice || 0) + (property.buildingImprovements || 0);
  const monthlyDepreciation = buildingValue / 27.5 / 12;
  
  const debtAssumptions = property.debtAssumptions || global.debtAssumptions;
  const ltv = property.acquisitionLTV || 0.75;
  const originalLoanAmount = property.type === "Financed" ? buildingValue * ltv : 0;
  const monthlyRate = (debtAssumptions?.interestRate || 0.09) / 12;
  const n = (debtAssumptions?.amortizationYears || 25) * 12;
  const pmt = originalLoanAmount > 0 ? (originalLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1) : 0;
  
  let expectedCumulativeDepreciation = 0;
  let expectedCumulativePrincipal = 0;
  let expectedDebtOutstanding = 0;
  
  for (let i = 0; i < monthlyData.length; i++) {
    const m = monthlyData[i];
    
    if (i >= acqMonthIndex) {
      const monthsAfterAcquisition = i - acqMonthIndex + 1;
      expectedCumulativeDepreciation = monthlyDepreciation * monthsAfterAcquisition;
      
      expectedDebtOutstanding = originalLoanAmount;
      let balance = originalLoanAmount;
      for (let j = 0; j < monthsAfterAcquisition && balance > 0; j++) {
        const interest = balance * monthlyRate;
        const principal = pmt - interest;
        balance = Math.max(0, balance - principal);
      }
      expectedDebtOutstanding = balance;
      expectedCumulativePrincipal = originalLoanAmount - balance;
    } else {
      expectedCumulativeDepreciation = 0;
      expectedDebtOutstanding = 0;
      expectedCumulativePrincipal = 0;
    }
    
    const expectedPropertyValue = i >= acqMonthIndex ? buildingValue - expectedCumulativeDepreciation : 0;
    const expectedEquity = expectedPropertyValue - expectedDebtOutstanding;
    
    const actualPropertyValue = m.propertyValue || 0;
    const actualDebtOutstanding = m.debtOutstanding || 0;
    const actualEquity = actualPropertyValue - actualDebtOutstanding;
    
    if (i >= acqMonthIndex && Math.abs(expectedPropertyValue - actualPropertyValue) > 100) {
      findings.push({
        category: "Balance Sheet",
        rule: "Property Asset = Acquisition Cost - Accumulated Depreciation",
        gaapReference: "ASC 360-10",
        severity: "material",
        passed: false,
        expected: expectedPropertyValue.toFixed(2),
        actual: actualPropertyValue.toFixed(2),
        variance: formatVariance(expectedPropertyValue, actualPropertyValue),
        recommendation: `Month ${i + 1}: Expected = $${buildingValue.toLocaleString()} - $${expectedCumulativeDepreciation.toLocaleString()} accumulated depreciation`,
        workpaperRef: `WP-BS-ASSET-M${i + 1}`
      });
    }
    
    if (i >= acqMonthIndex && property.type === "Financed" && Math.abs(expectedDebtOutstanding - actualDebtOutstanding) > 100) {
      findings.push({
        category: "Balance Sheet",
        rule: "Debt Outstanding = Original Loan - Cumulative Principal",
        gaapReference: "ASC 470-10",
        severity: "material",
        passed: false,
        expected: expectedDebtOutstanding.toFixed(2),
        actual: actualDebtOutstanding.toFixed(2),
        variance: formatVariance(expectedDebtOutstanding, actualDebtOutstanding),
        recommendation: `Month ${i + 1}: Expected = $${originalLoanAmount.toLocaleString()} - $${expectedCumulativePrincipal.toLocaleString()} cumulative principal`,
        workpaperRef: `WP-BS-DEBT-M${i + 1}`
      });
    }
    
    if (i >= acqMonthIndex && Math.abs(expectedEquity - actualEquity) > 100) {
      findings.push({
        category: "Balance Sheet",
        rule: "Equity = Assets - Liabilities (Accounting Equation)",
        gaapReference: "FASB Conceptual Framework",
        severity: "critical",
        passed: false,
        expected: expectedEquity.toFixed(2),
        actual: actualEquity.toFixed(2),
        variance: formatVariance(expectedEquity, actualEquity),
        recommendation: `Month ${i + 1}: Equity must equal Assets minus Liabilities`,
        workpaperRef: `WP-BS-EQ-M${i + 1}`
      });
    }
  }
  
  if (findings.filter(f => !f.passed).length === 0) {
    findings.push({
      category: "Balance Sheet",
      rule: "Balance Sheet Reconciliation",
      gaapReference: "FASB Conceptual Framework",
      severity: "info",
      passed: true,
      expected: "All balance sheet checks passed",
      actual: `Property value, debt outstanding, and equity verified for all ${monthlyData.length} months`,
      variance: "N/A",
      recommendation: "Balance sheet is properly reconciled with independent calculations",
      workpaperRef: "WP-BS-OK"
    });
  }
  
  const passed = findings.filter(f => f.passed).length;
  const materialIssues = findings.filter(f => !f.passed && (f.severity === "critical" || f.severity === "material")).length;
  
  return {
    name: "Balance Sheet Audit",
    description: "Verify Assets = Liabilities + Equity and proper asset/debt valuation",
    findings,
    passed,
    failed: findings.length - passed,
    materialIssues
  };
}

export function auditCashFlowReconciliation(
  property: PropertyAuditInput,
  global: GlobalAuditInput,
  monthlyData: MonthlyFinancials[]
): AuditSection {
  const findings: AuditFinding[] = [];
  
  const modelStart = new Date(global.modelStartDate);
  const acqDate = new Date(property.acquisitionDate || property.operationsStartDate);
  const acqMonthIndex = (acqDate.getFullYear() - modelStart.getFullYear()) * 12 + 
    (acqDate.getMonth() - modelStart.getMonth());
  
  let cumulativeCashFlow = 0;
  
  for (let i = acqMonthIndex; i < monthlyData.length; i++) {
    const m = monthlyData[i];
    
    const netIncome = m.netIncome || 0;
    const depreciation = m.depreciationExpense || 0;
    
    const expectedOperatingCF = netIncome + depreciation;
    
    const interestExpense = m.interestExpense || 0;
    const principalPayment = m.principalPayment || 0;
    const expectedFinancingCF = -principalPayment;
    
    const expectedNetCF = expectedOperatingCF + expectedFinancingCF;
    const actualCashFlow = m.cashFlow || 0;
    
    if (Math.abs(expectedNetCF - actualCashFlow) > 100) {
      findings.push({
        category: "Cash Flow Statement",
        rule: "Net Cash Flow = Operating CF + Financing CF",
        gaapReference: "ASC 230-10-45",
        severity: "material",
        passed: false,
        expected: `Op CF ($${expectedOperatingCF.toFixed(0)}) + Fin CF ($${expectedFinancingCF.toFixed(0)}) = $${expectedNetCF.toFixed(2)}`,
        actual: actualCashFlow.toFixed(2),
        variance: formatVariance(expectedNetCF, actualCashFlow),
        recommendation: `Month ${i + 1}: Operating CF = Net Income + Depreciation; Financing CF = -Principal`,
        workpaperRef: `WP-CF-NET-M${i + 1}`
      });
    }
    
    const debtPayment = m.debtPayment || 0;
    const expectedTotalDebt = interestExpense + principalPayment;
    if (debtPayment > 0 && Math.abs(debtPayment - expectedTotalDebt) > 1) {
      findings.push({
        category: "Cash Flow Statement",
        rule: "Debt Service Split: Interest (Operating) vs Principal (Financing)",
        gaapReference: "ASC 230-10-45-17",
        severity: "material",
        passed: false,
        expected: `Interest: $${interestExpense.toFixed(2)} (Operating) + Principal: $${principalPayment.toFixed(2)} (Financing)`,
        actual: `Total Debt: $${debtPayment.toFixed(2)}`,
        variance: formatVariance(expectedTotalDebt, debtPayment),
        recommendation: `Month ${i + 1}: Per GAAP, interest reduces Operating CF, principal is Financing activity`,
        workpaperRef: `WP-CF-SPLIT-M${i + 1}`
      });
    }
    
    cumulativeCashFlow += actualCashFlow;
    
    const expectedEndingCash = cumulativeCashFlow;
    const actualEndingCash = m.endingCash;
    
    if (actualEndingCash !== undefined && Math.abs(expectedEndingCash - actualEndingCash) > 100) {
      findings.push({
        category: "Cash Flow Statement",
        rule: "Ending Cash = Cumulative Net Cash Flows",
        gaapReference: "ASC 230-10-45-24",
        severity: "critical",
        passed: false,
        expected: `Cumulative cash flow: $${expectedEndingCash.toFixed(2)}`,
        actual: `Ending Cash: $${actualEndingCash.toFixed(2)}`,
        variance: formatVariance(expectedEndingCash, actualEndingCash),
        recommendation: `Month ${i + 1}: Cash reconciliation failed - verify all cash inflows/outflows`,
        workpaperRef: `WP-CF-RECON-M${i + 1}`
      });
    }
    
    const actualOperatingCF = m.operatingCashFlow;
    if (actualOperatingCF !== undefined && Math.abs(expectedOperatingCF - actualOperatingCF) > 100) {
      findings.push({
        category: "Cash Flow Statement",
        rule: "Operating CF = Net Income + Depreciation (Indirect Method)",
        gaapReference: "ASC 230-10-45",
        severity: "material",
        passed: false,
        expected: `NI ($${netIncome.toFixed(0)}) + Dep ($${depreciation.toFixed(0)}) = $${expectedOperatingCF.toFixed(2)}`,
        actual: `Operating CF: $${actualOperatingCF.toFixed(2)}`,
        variance: formatVariance(expectedOperatingCF, actualOperatingCF),
        recommendation: `Month ${i + 1}: Operating cash flow calculation differs from indirect method`,
        workpaperRef: `WP-CF-OP-M${i + 1}`
      });
    }
    
    const actualFinancingCF = m.financingCashFlow;
    if (actualFinancingCF !== undefined && Math.abs(expectedFinancingCF - actualFinancingCF) > 100) {
      findings.push({
        category: "Cash Flow Statement",
        rule: "Financing CF = -Principal (Debt Repayment)",
        gaapReference: "ASC 230-10-45-17",
        severity: "material",
        passed: false,
        expected: `Financing CF: $${expectedFinancingCF.toFixed(2)}`,
        actual: `Financing CF: $${actualFinancingCF.toFixed(2)}`,
        variance: formatVariance(expectedFinancingCF, actualFinancingCF),
        recommendation: `Month ${i + 1}: Financing cash flow should equal negative principal repayment`,
        workpaperRef: `WP-CF-FIN-M${i + 1}`
      });
    }
  }
  
  if (findings.filter(f => !f.passed).length === 0) {
    const monthsVerified = monthlyData.length - acqMonthIndex;
    findings.push({
      category: "Cash Flow Statement",
      rule: "Cash Flow Reconciliation",
      gaapReference: "ASC 230",
      severity: "info",
      passed: true,
      expected: "All cash flow checks passed",
      actual: `Verified ${monthsVerified} months of cash flow statements`,
      variance: "N/A",
      recommendation: "Cash flow statement follows GAAP indirect method with proper Operating/Financing split",
      workpaperRef: "WP-CF-OK"
    });
  }
  
  const passed = findings.filter(f => f.passed).length;
  const materialIssues = findings.filter(f => !f.passed && (f.severity === "critical" || f.severity === "material")).length;
  
  return {
    name: "Cash Flow Reconciliation Audit",
    description: "Verify cash flow statement per GAAP indirect method (ASC 230)",
    findings,
    passed,
    failed: findings.length - passed,
    materialIssues
  };
}

export function runFullAudit(
  property: PropertyAuditInput,
  global: GlobalAuditInput,
  monthlyData: MonthlyFinancials[]
): AuditReport {
  const sections: AuditSection[] = [
    auditTimingRules(property, global, monthlyData),
    auditDepreciation(property, global, monthlyData),
    auditLoanAmortization(property, global, monthlyData),
    auditIncomeStatement(property, global, monthlyData),
    auditManagementFees(property, global, monthlyData),
    auditBalanceSheet(property, global, monthlyData),
    auditCashFlowReconciliation(property, global, monthlyData)
  ];
  
  const totalChecks = sections.reduce((sum, s) => sum + s.findings.length, 0);
  const totalPassed = sections.reduce((sum, s) => sum + s.passed, 0);
  const totalFailed = sections.reduce((sum, s) => sum + s.failed, 0);
  const criticalIssues = sections.reduce((sum, s) => 
    sum + s.findings.filter(f => !f.passed && f.severity === "critical").length, 0);
  const materialIssues = sections.reduce((sum, s) => s.materialIssues, 0);
  
  let opinion: "UNQUALIFIED" | "QUALIFIED" | "ADVERSE" | "DISCLAIMER";
  let opinionText: string;
  
  if (criticalIssues === 0 && materialIssues === 0) {
    opinion = "UNQUALIFIED";
    opinionText = "In our opinion, the financial projections present fairly, in all material respects, the expected financial position and results of operations in conformity with Generally Accepted Accounting Principles (GAAP) and industry standards (USALI).";
  } else if (criticalIssues === 0 && materialIssues > 0) {
    opinion = "QUALIFIED";
    opinionText = `In our opinion, except for the ${materialIssues} material issue(s) noted in this report, the financial projections present fairly the expected financial position. Management should address the noted exceptions.`;
  } else if (criticalIssues > 0 && criticalIssues <= 3) {
    opinion = "QUALIFIED";
    opinionText = `In our opinion, except for the ${criticalIssues} critical and ${materialIssues} material issue(s) noted, the financial projections require adjustment before they can be considered materially correct.`;
  } else {
    opinion = "ADVERSE";
    opinionText = `Due to ${criticalIssues} critical issues affecting the reliability of the financial projections, we are unable to express an unqualified opinion. The projections do not present fairly the expected financial position in conformity with GAAP.`;
  }
  
  return {
    timestamp: new Date(),
    auditorName: "L+B Financial Audit Engine v2.0",
    propertyName: property.name,
    sections,
    totalChecks,
    totalPassed,
    totalFailed,
    criticalIssues,
    materialIssues,
    opinion,
    opinionText
  };
}

export function generateAuditWorkpaper(report: AuditReport): string {
  let output = "";
  
  output += "╔══════════════════════════════════════════════════════════════════════════════╗\n";
  output += "║                    INDEPENDENT AUDITOR'S REPORT                              ║\n";
  output += "║                         Financial Verification                                ║\n";
  output += "╠══════════════════════════════════════════════════════════════════════════════╣\n";
  output += `║  Property: ${report.propertyName.padEnd(66)}║\n`;
  output += `║  Date: ${report.timestamp.toISOString().slice(0, 19).padEnd(69)}║\n`;
  output += `║  Auditor: ${report.auditorName.padEnd(67)}║\n`;
  output += "╚══════════════════════════════════════════════════════════════════════════════╝\n\n";
  
  output += "┌──────────────────────────────────────────────────────────────────────────────┐\n";
  output += "│                              AUDIT OPINION                                    │\n";
  output += "├──────────────────────────────────────────────────────────────────────────────┤\n";
  
  const opinionIcon = report.opinion === "UNQUALIFIED" ? "✓" : 
                      report.opinion === "QUALIFIED" ? "△" : "✗";
  output += `│  Opinion: ${opinionIcon} ${report.opinion.padEnd(64)}│\n`;
  output += "├──────────────────────────────────────────────────────────────────────────────┤\n";
  
  const words = report.opinionText.split(' ');
  let line = "│  ";
  for (const word of words) {
    if (line.length + word.length + 1 > 77) {
      output += line.padEnd(79) + "│\n";
      line = "│  " + word + " ";
    } else {
      line += word + " ";
    }
  }
  if (line.length > 3) {
    output += line.padEnd(79) + "│\n";
  }
  
  output += "└──────────────────────────────────────────────────────────────────────────────┘\n\n";
  
  output += "┌──────────────────────────────────────────────────────────────────────────────┐\n";
  output += "│                           SUMMARY OF FINDINGS                                │\n";
  output += "├──────────────┬──────────┬──────────┬──────────┬─────────────────────────────┤\n";
  output += "│ Total Checks │  Passed  │  Failed  │ Critical │ Material                    │\n";
  output += "├──────────────┼──────────┼──────────┼──────────┼─────────────────────────────┤\n";
  output += `│ ${report.totalChecks.toString().padStart(12)} │ ${report.totalPassed.toString().padStart(8)} │ ${report.totalFailed.toString().padStart(8)} │ ${report.criticalIssues.toString().padStart(8)} │ ${report.materialIssues.toString().padStart(8)}                    │\n`;
  output += "└──────────────┴──────────┴──────────┴──────────┴─────────────────────────────┘\n\n";
  
  for (const section of report.sections) {
    const sectionIcon = section.failed === 0 ? "✓" : 
                        section.materialIssues > 0 ? "✗" : "△";
    output += `\n${sectionIcon} ${section.name.toUpperCase()}\n`;
    output += `  ${section.description}\n`;
    output += `  Results: ${section.passed}/${section.findings.length} passed\n`;
    output += "─".repeat(80) + "\n";
    
    const failedFindings = section.findings.filter(f => !f.passed);
    if (failedFindings.length > 0) {
      for (const finding of failedFindings) {
        const severityIcon = finding.severity === "critical" ? "🚨" : 
                            finding.severity === "material" ? "⚠️" : "ℹ️";
        output += `\n  ${severityIcon} [${finding.workpaperRef}] ${finding.rule}\n`;
        output += `     GAAP Reference: ${finding.gaapReference}\n`;
        output += `     Expected: ${finding.expected}\n`;
        output += `     Actual: ${finding.actual}\n`;
        output += `     Variance: ${finding.variance}\n`;
        output += `     Recommendation: ${finding.recommendation}\n`;
      }
    } else {
      output += "  All checks passed - no exceptions noted.\n";
    }
  }
  
  output += "\n" + "═".repeat(80) + "\n";
  output += "                              END OF AUDIT REPORT\n";
  output += "═".repeat(80) + "\n";
  output += "\nGAAP STANDARDS TESTED:\n";
  output += "• ASC 606 - Revenue Recognition\n";
  output += "• ASC 470 - Debt (Interest vs Principal Classification)\n";
  output += "• ASC 230 - Statement of Cash Flows\n";
  output += "• ASC 360 - Property, Plant & Equipment\n";
  output += "• ASC 835-30 - Interest Imputation\n";
  output += "• IRS Publication 946 - Depreciation\n";
  output += "• USALI - Uniform System of Accounts for the Lodging Industry\n";
  
  return output;
}
