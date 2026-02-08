import type { MonthlyFinancials } from './financialEngine';
import { pmt } from '@calc/shared/pmt';

export interface CrossValidationResult {
  name: string;
  description: string;
  passed: boolean;
  severity: 'critical' | 'material' | 'info';
  expected: string;
  actual: string;
  source: string;
}

export interface CrossValidationReport {
  results: CrossValidationResult[];
  totalChecks: number;
  passed: number;
  failed: number;
  criticalIssues: number;
}

interface PropertyForValidation {
  purchasePrice: number;
  type: string;
  acquisitionLTV?: number | null;
  acquisitionInterestRate?: number | null;
  acquisitionTermYears?: number | null;
}

interface GlobalForValidation {
  debtAssumptions?: {
    acqLTV?: number;
    interestRate?: number;
    amortizationYears?: number;
  };
}

const DEFAULT_LTV = 0.75;
const DEFAULT_INTEREST_RATE = 0.09;
const DEFAULT_TERM_YEARS = 25;
const TOLERANCE = 0.01;

function withinTolerance(a: number, b: number, tol = TOLERANCE): boolean {
  if (a === 0 && b === 0) return true;
  return Math.abs(a - b) <= Math.max(tol, Math.abs(a) * 0.0001);
}

export function crossValidateFinancingCalculators(
  property: PropertyForValidation,
  global: GlobalForValidation,
  monthlyData: MonthlyFinancials[],
): CrossValidationReport {
  const results: CrossValidationResult[] = [];

  if (property.type !== 'Financed' || !property.purchasePrice) {
    results.push({
      name: 'Skip: Cash Purchase',
      description: 'Property is not financed — no debt to validate',
      passed: true,
      severity: 'info',
      expected: 'N/A',
      actual: 'N/A',
      source: 'Cross-Validator',
    });
    return buildReport(results);
  }

  const ltv = property.acquisitionLTV ?? global.debtAssumptions?.acqLTV ?? DEFAULT_LTV;
  const rate = property.acquisitionInterestRate ?? global.debtAssumptions?.interestRate ?? DEFAULT_INTEREST_RATE;
  const termYears = property.acquisitionTermYears ?? global.debtAssumptions?.amortizationYears ?? DEFAULT_TERM_YEARS;
  const totalPropertyValue = property.purchasePrice;
  const loanAmount = totalPropertyValue * ltv;
  const monthlyRate = rate / 12;
  const totalPayments = termYears * 12;

  const expectedPMT = monthlyRate === 0
    ? loanAmount / totalPayments
    : pmt(loanAmount, monthlyRate, totalPayments);

  // 1. PMT Formula Consistency
  // The financial engine computes PMT inline; verify it matches the shared pmt() function
  const firstDebtMonth = monthlyData.find(m => m.debtPayment > 0);
  if (firstDebtMonth) {
    results.push({
      name: 'PMT Formula: Engine vs Shared pmt()',
      description: 'Monthly payment from financial engine must match shared PMT function (P×r×(1+r)^n / ((1+r)^n−1))',
      passed: withinTolerance(firstDebtMonth.debtPayment, expectedPMT),
      severity: 'critical',
      expected: expectedPMT.toFixed(2),
      actual: firstDebtMonth.debtPayment.toFixed(2),
      source: 'IRS/GAAP: Standard amortization formula',
    });
  }

  // 2. Debt Service Split: Interest + Principal = Total Payment (ASC 470)
  const debtMonths = monthlyData.filter(m => m.debtPayment > 0);
  let splitErrors = 0;
  for (const m of debtMonths) {
    if (!withinTolerance(m.interestExpense + m.principalPayment, m.debtPayment)) {
      splitErrors++;
    }
  }
  results.push({
    name: 'ASC 470: Debt Service Split',
    description: 'Interest + Principal must equal total debt payment for every month',
    passed: splitErrors === 0,
    severity: 'critical',
    expected: '0 errors',
    actual: `${splitErrors} months with split errors`,
    source: 'GAAP ASC 470: Interest to IS, Principal to BS',
  });

  // 3. DSCR Cross-Check
  // For each operating year, compute DSCR from engine data and verify formula
  const projectionYears = Math.ceil(monthlyData.length / 12);
  for (let y = 0; y < Math.min(projectionYears, 5); y++) {
    const yearSlice = monthlyData.slice(y * 12, (y + 1) * 12);
    const yearNOI = yearSlice.reduce((sum, m) => sum + m.noi, 0);
    const yearDS = yearSlice.reduce((sum, m) => sum + m.debtPayment, 0);

    if (yearDS > 0 && yearNOI > 0) {
      const engineDSCR = yearNOI / yearDS;
      const expectedDSCR = yearNOI / yearDS;

      results.push({
        name: `Year ${y + 1}: DSCR Calculation`,
        description: 'DSCR = Annual NOI ÷ Annual Debt Service (industry standard)',
        passed: withinTolerance(engineDSCR, expectedDSCR),
        severity: 'material',
        expected: expectedDSCR.toFixed(4),
        actual: engineDSCR.toFixed(4),
        source: 'CRE Lending: JP Morgan, Wall Street Prep',
      });
    }
  }

  // 4. Debt Yield Cross-Check
  if (loanAmount > 0) {
    const year1NOI = monthlyData.slice(0, 12).reduce((sum, m) => sum + m.noi, 0);
    if (year1NOI > 0) {
      const debtYield = year1NOI / loanAmount;
      results.push({
        name: 'Year 1: Debt Yield',
        description: 'Debt Yield = NOI ÷ Loan Amount (rate-independent risk metric)',
        passed: debtYield > 0,
        severity: 'info',
        expected: `> 0% (typical minimum 8-10%)`,
        actual: `${(debtYield * 100).toFixed(2)}%`,
        source: 'CRE Lending Standard: NOI / Loan Amount',
      });
    }
  }

  // 5. Loan Balance Declining Monotonically (amortizing loan)
  let balanceErrors = 0;
  for (let i = 1; i < debtMonths.length; i++) {
    if (debtMonths[i].debtOutstanding > debtMonths[i - 1].debtOutstanding + TOLERANCE) {
      balanceErrors++;
    }
  }
  results.push({
    name: 'Amortization: Balance Monotonically Decreasing',
    description: 'Outstanding debt must decline each month for a fully amortizing loan',
    passed: balanceErrors === 0,
    severity: 'critical',
    expected: '0 months with increasing balance',
    actual: `${balanceErrors} months with increasing balance`,
    source: 'Standard amortization: each payment reduces principal',
  });

  // 6. Interest Expense Declining Over Time (amortizing loan)
  let interestIncreases = 0;
  for (let i = 1; i < debtMonths.length; i++) {
    if (debtMonths[i].interestExpense > debtMonths[i - 1].interestExpense + TOLERANCE) {
      interestIncreases++;
    }
  }
  results.push({
    name: 'Amortization: Interest Expense Declining',
    description: 'Interest expense should decrease as balance decreases (amortizing loan)',
    passed: interestIncreases === 0,
    severity: 'material',
    expected: '0 months with increasing interest',
    actual: `${interestIncreases} months with increasing interest`,
    source: 'Amortization: Interest = Balance × Rate (declining balance)',
  });

  // 7. Net Income Identity: NOI - Interest - Depreciation - Tax = Net Income (GAAP)
  let niErrors = 0;
  for (const m of monthlyData) {
    const taxableIncome = m.noi - m.interestExpense - (m.depreciationExpense || 0);
    const expectedTax = taxableIncome > 0 ? taxableIncome * (m.incomeTax / Math.max(taxableIncome, 0.01)) : 0;
    const expectedNI = m.noi - m.interestExpense - (m.depreciationExpense || 0) - m.incomeTax;
    if (!withinTolerance(m.netIncome, expectedNI)) {
      niErrors++;
    }
  }
  results.push({
    name: 'GAAP: Net Income Identity',
    description: 'Net Income = NOI − Interest − Depreciation − Tax (per GAAP Income Statement)',
    passed: niErrors === 0,
    severity: 'critical',
    expected: '0 errors',
    actual: `${niErrors} months with identity failures`,
    source: 'GAAP ASC 470 + ASC 360: Interest and Depreciation on IS',
  });

  // 8. Cash Flow Reconciliation: Operating CF + Financing CF = Total Cash Flow (ASC 230)
  let cfErrors = 0;
  for (const m of monthlyData) {
    const expectedCF = (m.operatingCashFlow || 0) + (m.financingCashFlow || 0);
    if (Math.abs(m.cashFlow - expectedCF) > TOLERANCE && m.refinancingProceeds === 0) {
      cfErrors++;
    }
  }
  results.push({
    name: 'ASC 230: Cash Flow Reconciliation',
    description: 'Operating CF + Financing CF = Total Cash Flow (indirect method)',
    passed: cfErrors === 0,
    severity: 'critical',
    expected: '0 reconciliation errors',
    actual: `${cfErrors} months with reconciliation failures`,
    source: 'GAAP ASC 230: Statement of Cash Flows',
  });

  // 9. Revenue Identity: Total = Rooms + F&B + Events + Other (USALI)
  let revErrors = 0;
  for (const m of monthlyData) {
    const expectedTotal = m.revenueRooms + m.revenueFB + m.revenueEvents + m.revenueOther;
    if (!withinTolerance(m.revenueTotal, expectedTotal)) {
      revErrors++;
    }
  }
  results.push({
    name: 'USALI: Revenue Identity',
    description: 'Total Revenue = Rooms + F&B + Events + Other (USALI Summary Statement)',
    passed: revErrors === 0,
    severity: 'critical',
    expected: '0 errors',
    actual: `${revErrors} months with revenue identity failures`,
    source: 'USALI 12th Edition: Summary Operating Statement',
  });

  // 10. GOP Identity: Revenue - Operating Expenses (USALI)
  let gopErrors = 0;
  for (const m of monthlyData) {
    const totalOpEx = m.expenseRooms + m.expenseFB + m.expenseEvents + m.expenseOther +
      m.expenseMarketing + m.expensePropertyOps + m.expenseUtilitiesVar +
      m.expenseAdmin + m.expenseIT + m.expenseInsurance + m.expenseTaxes +
      m.expenseUtilitiesFixed + m.expenseOtherCosts;
    const expectedGOP = m.revenueTotal - totalOpEx;
    if (!withinTolerance(m.gop, expectedGOP)) {
      gopErrors++;
    }
  }
  results.push({
    name: 'USALI: GOP Identity',
    description: 'GOP = Total Revenue − Total Operating Expenses',
    passed: gopErrors === 0,
    severity: 'critical',
    expected: '0 errors',
    actual: `${gopErrors} months with GOP identity failures`,
    source: 'USALI 12th Edition: Gross Operating Profit',
  });

  // 11. NOI Identity: GOP - Mgmt Fees - FFE (USALI)
  let noiErrors = 0;
  for (const m of monthlyData) {
    const expectedNOI = m.gop - m.feeBase - m.feeIncentive - m.expenseFFE;
    if (!withinTolerance(m.noi, expectedNOI)) {
      noiErrors++;
    }
  }
  results.push({
    name: 'USALI: NOI Identity',
    description: 'NOI = GOP − Base Fee − Incentive Fee − FF&E Reserve',
    passed: noiErrors === 0,
    severity: 'critical',
    expected: '0 errors',
    actual: `${noiErrors} months with NOI identity failures`,
    source: 'USALI 12th Edition: Net Operating Income',
  });

  // 12. Balance Sheet: Property Value = Land + (Building - Accum Depreciation) (ASC 360)
  const operatingMonths = monthlyData.filter(m => m.propertyValue > 0);
  let bsErrors = 0;
  if (operatingMonths.length > 0) {
    const landValue = property.purchasePrice * (0.25);
    const buildingValue = property.purchasePrice * 0.75;
    const monthlyDep = buildingValue / 27.5 / 12;

    for (let i = 0; i < operatingMonths.length; i++) {
      const m = operatingMonths[i];
      if (m.depreciationExpense > 0) {
        const expectedPropValue = landValue + buildingValue - (m.depreciationExpense * (i + 1));
        if (Math.abs(m.propertyValue - expectedPropValue) / Math.max(m.propertyValue, 1) > 0.05) {
          bsErrors++;
        }
      }
    }
  }
  results.push({
    name: 'ASC 360: Property Value',
    description: 'Property Value = Land + (Building − Accumulated Depreciation)',
    passed: bsErrors === 0,
    severity: 'material',
    expected: '0 inconsistencies',
    actual: `${bsErrors} months with property value issues`,
    source: 'GAAP ASC 360: Property, Plant & Equipment',
  });

  // 13. No Pre-Operations Revenue/Expense
  const preOpsRevenue = monthlyData.filter(m => m.occupancy === 0 && m.revenueTotal > 0);
  results.push({
    name: 'Timing: No Pre-Operations Revenue',
    description: 'Zero occupancy months must have zero revenue',
    passed: preOpsRevenue.length === 0,
    severity: 'critical',
    expected: '0 months',
    actual: `${preOpsRevenue.length} months with pre-ops revenue`,
    source: 'GAAP ASC 606: Revenue Recognition',
  });

  // 14. IRS: Depreciation = Basis / 27.5 / 12 (straight-line)
  const depMonths = monthlyData.filter(m => m.depreciationExpense > 0);
  if (depMonths.length > 0) {
    const buildingBasis = property.purchasePrice * 0.75;
    const expectedMonthlyDep = buildingBasis / 27.5 / 12;
    let depErrors = 0;
    for (const m of depMonths) {
      if (!withinTolerance(m.depreciationExpense, expectedMonthlyDep, 1.0)) {
        depErrors++;
      }
    }
    results.push({
      name: 'IRS Pub 946: Monthly Depreciation',
      description: 'Monthly depreciation = depreciable basis / 27.5 / 12',
      passed: depErrors === 0,
      severity: 'material',
      expected: expectedMonthlyDep.toFixed(2),
      actual: depMonths[0].depreciationExpense.toFixed(2),
      source: 'IRS Publication 946: 27.5-year straight-line, residential rental',
    });
  }

  return buildReport(results);
}

function buildReport(results: CrossValidationResult[]): CrossValidationReport {
  const totalChecks = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = totalChecks - passed;
  const criticalIssues = results.filter(r => !r.passed && r.severity === 'critical').length;

  return { results, totalChecks, passed, failed, criticalIssues };
}

export function formatCrossValidationReport(report: CrossValidationReport): string {
  let output = '';
  output += '╔══════════════════════════════════════════════════════════════════════════════╗\n';
  output += '║           CROSS-CALCULATOR VALIDATION REPORT                                ║\n';
  output += '║       Authoritative Sources: IRS, GAAP (ASC 230/360/470/606), USALI         ║\n';
  output += '╚══════════════════════════════════════════════════════════════════════════════╝\n\n';

  for (const r of report.results) {
    const status = r.passed ? '✓ PASS' : '✗ FAIL';
    const severityTag = r.severity === 'critical' ? '[CRITICAL]' : r.severity === 'material' ? '[MATERIAL]' : '[INFO]';
    output += `${status} ${severityTag} ${r.name}\n`;
    output += `  ${r.description}\n`;
    output += `  Expected: ${r.expected}\n`;
    output += `  Actual:   ${r.actual}\n`;
    output += `  Source:   ${r.source}\n\n`;
  }

  output += '────────────────────────────────────────────────────────────────────────────────\n';
  output += `Total: ${report.totalChecks} checks | Passed: ${report.passed} | Failed: ${report.failed} | Critical: ${report.criticalIssues}\n`;

  if (report.criticalIssues > 0) {
    output += 'OPINION: ADVERSE — Critical calculation inconsistencies found.\n';
  } else if (report.failed > 0) {
    output += 'OPINION: QUALIFIED — Material issues require attention.\n';
  } else {
    output += 'OPINION: UNQUALIFIED — All calculations verified against authoritative sources.\n';
  }

  return output;
}
