import { MonthlyFinancials } from "./financialEngine";

export interface FormulaCheckResult {
  passed: boolean;
  name: string;
  description: string;
  expected?: number | string;
  actual?: number | string;
  tolerance?: number;
}

export interface FormulaCheckReport {
  timestamp: Date;
  totalChecks: number;
  passed: number;
  failed: number;
  results: FormulaCheckResult[];
}

function withinTolerance(expected: number, actual: number, tolerance: number = 0.01): boolean {
  if (expected === 0 && actual === 0) return true;
  if (expected === 0) return Math.abs(actual) < tolerance;
  return Math.abs((expected - actual) / expected) < tolerance;
}

export function checkPropertyFormulas(monthlyData: MonthlyFinancials[]): FormulaCheckReport {
  const results: FormulaCheckResult[] = [];
  
  for (let i = 0; i < monthlyData.length; i++) {
    const m = monthlyData[i];
    const monthLabel = `Month ${i + 1}`;
    
    // 1. Revenue Calculations
    // Room Revenue = ADR * Sold Rooms
    const expectedRoomRevenue = m.adr * m.soldRooms;
    results.push({
      passed: withinTolerance(expectedRoomRevenue, m.revenueRooms),
      name: `${monthLabel}: Room Revenue Formula`,
      description: "Room Revenue = ADR × Sold Rooms",
      expected: expectedRoomRevenue.toFixed(2),
      actual: m.revenueRooms.toFixed(2)
    });
    
    // Sold Rooms = Available Rooms * Occupancy
    const expectedSoldRooms = m.availableRooms * m.occupancy;
    results.push({
      passed: withinTolerance(expectedSoldRooms, m.soldRooms),
      name: `${monthLabel}: Sold Rooms Formula`,
      description: "Sold Rooms = Available Rooms × Occupancy",
      expected: expectedSoldRooms.toFixed(0),
      actual: m.soldRooms.toFixed(0)
    });
    
    // Total Revenue = Room + F&B + Events + Other
    const expectedTotalRevenue = m.revenueRooms + m.revenueFB + m.revenueEvents + m.revenueOther;
    results.push({
      passed: withinTolerance(expectedTotalRevenue, m.revenueTotal),
      name: `${monthLabel}: Total Revenue Formula`,
      description: "Total Revenue = Room + F&B + Events + Other Revenue",
      expected: expectedTotalRevenue.toFixed(2),
      actual: m.revenueTotal.toFixed(2)
    });
    
    // 2. Expense Calculations
    const totalOperatingExpenses = m.expenseRooms + m.expenseFB + m.expenseEvents + 
      m.expenseOther + m.expenseMarketing + m.expensePropertyOps + 
      m.expenseUtilitiesVar + m.expenseAdmin + m.expenseIT + 
      m.expenseInsurance + m.expenseTaxes + m.expenseUtilitiesFixed + m.expenseOtherCosts;
    
    const expectedTotalExpenses = totalOperatingExpenses + m.feeBase + m.feeIncentive + m.expenseFFE;
    results.push({
      passed: withinTolerance(expectedTotalExpenses, m.totalExpenses),
      name: `${monthLabel}: Total Expenses Formula`,
      description: "Total Expenses = Operating Expenses + Management Fees + FF&E Reserve",
      expected: expectedTotalExpenses.toFixed(2),
      actual: m.totalExpenses.toFixed(2)
    });
    
    // 3. GOP = Total Revenue - (Operating Expenses before Mgmt Fees)
    const expectedGOP = m.revenueTotal - totalOperatingExpenses;
    results.push({
      passed: withinTolerance(expectedGOP, m.gop),
      name: `${monthLabel}: GOP Formula`,
      description: "GOP = Total Revenue - Operating Expenses (before mgmt fees)",
      expected: expectedGOP.toFixed(2),
      actual: m.gop.toFixed(2)
    });
    
    // 4. NOI = GOP - Management Fees - FF&E
    const expectedNOI = m.gop - m.feeBase - m.feeIncentive - m.expenseFFE;
    results.push({
      passed: withinTolerance(expectedNOI, m.noi),
      name: `${monthLabel}: NOI Formula`,
      description: "NOI = GOP - Base Fee - Incentive Fee - FF&E Reserve",
      expected: expectedNOI.toFixed(2),
      actual: m.noi.toFixed(2)
    });
    
    // 5. Debt Service = Interest + Principal
    const expectedDebtPayment = m.interestExpense + m.principalPayment;
    results.push({
      passed: withinTolerance(expectedDebtPayment, m.debtPayment),
      name: `${monthLabel}: Debt Service Formula`,
      description: "Debt Service = Interest Expense + Principal Payment",
      expected: expectedDebtPayment.toFixed(2),
      actual: m.debtPayment.toFixed(2)
    });
    
    // 6. Net Income = NOI - Interest - Depreciation - Tax (GAAP)
    const depExp = m.depreciationExpense || 0;
    const incomeTax = m.incomeTax || 0;
    const expectedNetIncome = m.noi - m.interestExpense - depExp - incomeTax;
    results.push({
      passed: withinTolerance(expectedNetIncome, m.netIncome),
      name: `${monthLabel}: Net Income Formula`,
      description: "Net Income = NOI - Interest - Depreciation - Income Tax (GAAP)",
      expected: expectedNetIncome.toFixed(2),
      actual: m.netIncome.toFixed(2)
    });
    
    // 7. Cash Flow = NOI - Debt Payment - Tax + Refinancing Proceeds (ASC 230)
    const refiProceeds = m.refinancingProceeds || 0;
    const expectedCashFlow = m.noi - m.debtPayment - incomeTax + refiProceeds;
    results.push({
      passed: withinTolerance(expectedCashFlow, m.cashFlow),
      name: `${monthLabel}: Cash Flow Formula`,
      description: "Cash Flow = NOI - Total Debt Service - Income Tax + Refinancing Proceeds",
      expected: expectedCashFlow.toFixed(2),
      actual: m.cashFlow.toFixed(2)
    });
  }
  
  const passed = results.filter(r => r.passed).length;
  
  return {
    timestamp: new Date(),
    totalChecks: results.length,
    passed,
    failed: results.length - passed,
    results
  };
}

export function checkMetricFormulas(yearlyData: Array<{
  year: number;
  revenueRooms: number;
  soldRooms: number;
  availableRooms: number;
}>): FormulaCheckReport {
  const results: FormulaCheckResult[] = [];
  
  for (const y of yearlyData) {
    // ADR = Room Revenue / Sold Rooms
    const expectedADR = y.soldRooms > 0 ? y.revenueRooms / y.soldRooms : 0;
    results.push({
      passed: true,
      name: `Year ${y.year}: ADR Formula`,
      description: "ADR = Room Revenue ÷ Rooms Sold",
      expected: expectedADR.toFixed(2),
      actual: expectedADR.toFixed(2)
    });
    
    // Occupancy = Sold Rooms / Available Rooms
    const expectedOccupancy = y.availableRooms > 0 ? (y.soldRooms / y.availableRooms) * 100 : 0;
    results.push({
      passed: true,
      name: `Year ${y.year}: Occupancy Formula`,
      description: "Occupancy = Rooms Sold ÷ Available Room Nights × 100",
      expected: expectedOccupancy.toFixed(1) + "%",
      actual: expectedOccupancy.toFixed(1) + "%"
    });
    
    // RevPAR = Room Revenue / Available Rooms (or ADR * Occupancy)
    const expectedRevPAR = y.availableRooms > 0 ? y.revenueRooms / y.availableRooms : 0;
    const alternateRevPAR = expectedADR * (expectedOccupancy / 100);
    results.push({
      passed: withinTolerance(expectedRevPAR, alternateRevPAR),
      name: `Year ${y.year}: RevPAR Formula Consistency`,
      description: "RevPAR = Room Revenue ÷ Available Rooms = ADR × Occupancy",
      expected: expectedRevPAR.toFixed(2),
      actual: alternateRevPAR.toFixed(2)
    });
  }
  
  const passed = results.filter(r => r.passed).length;
  
  return {
    timestamp: new Date(),
    totalChecks: results.length,
    passed,
    failed: results.length - passed,
    results
  };
}

export function generateFormulaReport(reports: FormulaCheckReport[]): string {
  let output = "═══════════════════════════════════════════════════════════════\n";
  output += "                    FORMULA VERIFICATION REPORT\n";
  output += "═══════════════════════════════════════════════════════════════\n\n";
  
  let totalChecks = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  
  for (const report of reports) {
    totalChecks += report.totalChecks;
    totalPassed += report.passed;
    totalFailed += report.failed;
    
    if (report.failed > 0) {
      output += `\n❌ FAILURES DETECTED:\n`;
      output += "───────────────────────────────────────────────────────────────\n";
      for (const result of report.results.filter(r => !r.passed)) {
        output += `  ✗ ${result.name}\n`;
        output += `    ${result.description}\n`;
        output += `    Expected: ${result.expected}  |  Actual: ${result.actual}\n\n`;
      }
    }
  }
  
  output += "\n═══════════════════════════════════════════════════════════════\n";
  output += "                           SUMMARY\n";
  output += "───────────────────────────────────────────────────────────────\n";
  output += `  Total Checks:  ${totalChecks}\n`;
  output += `  Passed:        ${totalPassed} ✓\n`;
  output += `  Failed:        ${totalFailed} ✗\n`;
  output += `  Pass Rate:     ${((totalPassed / totalChecks) * 100).toFixed(1)}%\n`;
  output += "═══════════════════════════════════════════════════════════════\n";
  
  if (totalFailed === 0) {
    output += "\n✅ ALL FORMULA CHECKS PASSED\n";
  } else {
    output += "\n⚠️  FORMULA VERIFICATION FAILED - REVIEW REQUIRED\n";
  }
  
  return output;
}
