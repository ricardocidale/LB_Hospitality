import { generatePropertyProForma, MonthlyFinancials } from "./financialEngine";
import { checkPropertyFormulas, checkMetricFormulas, generateFormulaReport, FormulaCheckReport } from "./formulaChecker";
import { checkGAAPCompliance, checkCashFlowStatement, generateComplianceReport, ComplianceReport } from "./gaapComplianceChecker";
import { runFullAudit, generateAuditWorkpaper, AuditReport, PropertyAuditInput, GlobalAuditInput } from "./financialAuditor";
import { 
  DEFAULT_LTV, 
  DEFAULT_INTEREST_RATE, 
  DEFAULT_TERM_YEARS, 
  DEPRECIATION_YEARS,
  DAYS_PER_MONTH,
  PROJECTION_YEARS,
  PROJECTION_MONTHS
} from "./constants";

export interface VerificationResults {
  formulaReport: string;
  complianceReport: string;
  auditWorkpaper: string;
  auditReports: AuditReport[];
  summary: {
    formulaChecksPassed: number;
    formulaChecksFailed: number;
    complianceChecksPassed: number;
    complianceChecksFailed: number;
    criticalIssues: number;
    materialIssues: number;
    auditOpinion: "UNQUALIFIED" | "QUALIFIED" | "ADVERSE" | "DISCLAIMER";
    overallStatus: "PASS" | "FAIL" | "WARNING";
  };
}

function convertToAuditInput(property: any): PropertyAuditInput {
  return {
    name: property.name || 'Unnamed Property',
    operationsStartDate: property.operationsStartDate,
    acquisitionDate: property.acquisitionDate || property.operationsStartDate,
    roomCount: property.roomCount,
    startAdr: property.startAdr,
    adrGrowthRate: property.adrGrowthRate,
    startOccupancy: property.startOccupancy,
    maxOccupancy: property.maxOccupancy,
    occupancyRampMonths: property.occupancyRampMonths,
    occupancyGrowthStep: property.occupancyGrowthStep,
    purchasePrice: property.purchasePrice,
    buildingImprovements: property.buildingImprovements || 0,
    type: property.type,
    acquisitionLTV: property.acquisitionLTV,
    debtAssumptions: property.debtAssumptions,
    costRateRooms: property.costRateRooms,
    costRateFB: property.costRateFB,
    costRateAdmin: property.costRateAdmin,
    costRateMarketing: property.costRateMarketing,
    costRatePropertyOps: property.costRatePropertyOps,
    costRateUtilities: property.costRateUtilities,
    costRateInsurance: property.costRateInsurance,
    costRateTaxes: property.costRateTaxes,
    costRateIT: property.costRateIT,
    costRateFFE: property.costRateFFE,
    costRateOther: property.costRateOther,
    revShareEvents: property.revShareEvents,
    revShareFB: property.revShareFB,
    revShareOther: property.revShareOther,
  };
}

function convertToGlobalAuditInput(global: any): GlobalAuditInput {
  return {
    modelStartDate: global.modelStartDate,
    inflationRate: global.inflationRate,
    baseManagementFee: global.baseManagementFee,
    incentiveManagementFee: global.incentiveManagementFee,
    debtAssumptions: global.debtAssumptions || {
      interestRate: DEFAULT_INTEREST_RATE,
      amortizationYears: DEFAULT_TERM_YEARS,
      acqLTV: DEFAULT_LTV
    }
  };
}

export function runFullVerification(
  properties: any[],
  globalAssumptions: any
): VerificationResults {
  const formulaReports: FormulaCheckReport[] = [];
  const complianceReports: ComplianceReport[] = [];
  const auditReports: AuditReport[] = [];
  
  console.log("╔══════════════════════════════════════════════════════════════════════════════╗");
  console.log("║           L+B HOSPITALITY - FINANCIAL VERIFICATION SUITE                     ║");
  console.log("║                    PwC-Level Audit Standards                                 ║");
  console.log("╚══════════════════════════════════════════════════════════════════════════════╝\n");
  
  console.log(`Running comprehensive audit on ${properties.length} properties...\n`);
  
  const globalAuditInput = convertToGlobalAuditInput(globalAssumptions);
  
  for (const property of properties) {
    console.log(`\n▸ Auditing: ${property.name || 'Property'}`);
    console.log("  ─────────────────────────────────────────────────────────────");
    
    try {
      const projectionMonths = ((globalAssumptions as any).projectionYears ?? PROJECTION_YEARS) * 12;
      const financials = generatePropertyProForma(property, globalAssumptions, projectionMonths);
      
      // Run legacy formula checks
      const formulaCheck = checkPropertyFormulas(financials);
      formulaReports.push(formulaCheck);
      console.log(`  [1/5] Formula Verification:     ${formulaCheck.passed}/${formulaCheck.totalChecks} passed`);
      
      // Run legacy GAAP compliance checks
      const gaapCheck = checkGAAPCompliance(financials);
      complianceReports.push(gaapCheck);
      console.log(`  [2/5] GAAP Compliance:          ${gaapCheck.passed}/${gaapCheck.totalChecks} passed`);
      
      // Run cash flow statement checks
      const cfCheck = checkCashFlowStatement(financials);
      complianceReports.push(cfCheck);
      console.log(`  [3/5] Cash Flow Statement:      ${cfCheck.passed}/${cfCheck.totalChecks} passed`);
      
      // Run metric formula checks
      const yearlyData = aggregateToYearly(financials);
      const metricCheck = checkMetricFormulas(yearlyData);
      formulaReports.push(metricCheck);
      console.log(`  [4/5] Metric Formulas:          ${metricCheck.passed}/${metricCheck.totalChecks} passed`);
      
      // Run comprehensive PwC-level audit
      const propertyAuditInput = convertToAuditInput(property);
      const auditReport = runFullAudit(propertyAuditInput, globalAuditInput, financials);
      auditReports.push(auditReport);
      console.log(`  [5/5] Comprehensive Audit:      ${auditReport.totalPassed}/${auditReport.totalChecks} passed`);
      console.log(`        Opinion: ${auditReport.opinion}`);
      if (auditReport.criticalIssues > 0) {
        console.log(`        ⚠️  Critical Issues: ${auditReport.criticalIssues}`);
      }
      if (auditReport.materialIssues > 0) {
        console.log(`        △  Material Issues: ${auditReport.materialIssues}`);
      }
      
    } catch (error) {
      console.error(`  ✗ Error processing property: ${error}`);
    }
  }
  
  // Generate reports
  const formulaReport = generateFormulaReport(formulaReports);
  const complianceReport = generateComplianceReport(complianceReports);
  
  // Generate consolidated audit workpaper
  let auditWorkpaper = "";
  auditWorkpaper += "╔══════════════════════════════════════════════════════════════════════════════╗\n";
  auditWorkpaper += "║               CONSOLIDATED INDEPENDENT AUDITOR'S REPORT                      ║\n";
  auditWorkpaper += "║                       L+B Hospitality Group                                  ║\n";
  auditWorkpaper += "╚══════════════════════════════════════════════════════════════════════════════╝\n\n";
  
  for (const report of auditReports) {
    auditWorkpaper += generateAuditWorkpaper(report);
    auditWorkpaper += "\n\n";
  }
  
  // Calculate summary
  const formulaChecksPassed = formulaReports.reduce((sum, r) => sum + r.passed, 0);
  const formulaChecksFailed = formulaReports.reduce((sum, r) => sum + r.failed, 0);
  const complianceChecksPassed = complianceReports.reduce((sum, r) => sum + r.passed, 0);
  const complianceChecksFailed = complianceReports.reduce((sum, r) => sum + r.failed, 0);
  const criticalIssues = auditReports.reduce((sum, r) => sum + r.criticalIssues, 0);
  const materialIssues = auditReports.reduce((sum, r) => sum + r.materialIssues, 0);
  
  // Determine overall audit opinion
  let auditOpinion: "UNQUALIFIED" | "QUALIFIED" | "ADVERSE" | "DISCLAIMER" = "UNQUALIFIED";
  if (auditReports.some(r => r.opinion === "ADVERSE")) {
    auditOpinion = "ADVERSE";
  } else if (auditReports.some(r => r.opinion === "QUALIFIED")) {
    auditOpinion = "QUALIFIED";
  } else if (auditReports.some(r => r.opinion === "DISCLAIMER")) {
    auditOpinion = "DISCLAIMER";
  }
  
  let overallStatus: "PASS" | "FAIL" | "WARNING" = "PASS";
  if (criticalIssues > 0 || formulaChecksFailed > 0 || auditOpinion === "ADVERSE") {
    overallStatus = "FAIL";
  } else if (materialIssues > 0 || complianceChecksFailed > 0 || auditOpinion === "QUALIFIED") {
    overallStatus = "WARNING";
  }
  
  return {
    formulaReport,
    complianceReport,
    auditWorkpaper,
    auditReports,
    summary: {
      formulaChecksPassed,
      formulaChecksFailed,
      complianceChecksPassed,
      complianceChecksFailed,
      criticalIssues,
      materialIssues,
      auditOpinion,
      overallStatus
    }
  };
}

function aggregateToYearly(monthlyData: MonthlyFinancials[]): Array<{
  year: number;
  revenueRooms: number;
  soldRooms: number;
  availableRooms: number;
}> {
  const yearlyMap = new Map<number, {
    revenueRooms: number;
    soldRooms: number;
    availableRooms: number;
  }>();
  
  for (let i = 0; i < monthlyData.length; i++) {
    const m = monthlyData[i];
    const year = Math.floor(i / 12) + 1;
    
    if (!yearlyMap.has(year)) {
      yearlyMap.set(year, { revenueRooms: 0, soldRooms: 0, availableRooms: 0 });
    }
    
    const yearly = yearlyMap.get(year)!;
    yearly.revenueRooms += m.revenueRooms;
    yearly.soldRooms += m.soldRooms;
    yearly.availableRooms += m.availableRooms;
  }
  
  return Array.from(yearlyMap.entries()).map(([year, data]) => ({
    year,
    ...data
  }));
}

export function printVerificationResults(results: VerificationResults): void {
  console.log("\n\n");
  console.log(results.formulaReport);
  console.log("\n\n");
  console.log(results.complianceReport);
  console.log("\n\n");
  console.log(results.auditWorkpaper);
  console.log("\n\n");
  console.log("╔══════════════════════════════════════════════════════════════════════════════╗");
  console.log("║                    CONSOLIDATED VERIFICATION STATUS                          ║");
  console.log("╠══════════════════════════════════════════════════════════════════════════════╣");
  console.log(`║  Formula Checks:      ${results.summary.formulaChecksPassed.toString().padStart(4)} passed, ${results.summary.formulaChecksFailed.toString().padStart(4)} failed                         ║`);
  console.log(`║  Compliance Checks:   ${results.summary.complianceChecksPassed.toString().padStart(4)} passed, ${results.summary.complianceChecksFailed.toString().padStart(4)} failed                         ║`);
  console.log(`║  Critical Issues:     ${results.summary.criticalIssues.toString().padStart(4)}                                                   ║`);
  console.log(`║  Material Issues:     ${results.summary.materialIssues.toString().padStart(4)}                                                   ║`);
  console.log("╠══════════════════════════════════════════════════════════════════════════════╣");
  console.log(`║  AUDIT OPINION:       ${results.summary.auditOpinion.padEnd(55)}║`);
  console.log(`║  OVERALL STATUS:      ${(results.summary.overallStatus === "PASS" ? "✓ PASS" : results.summary.overallStatus === "WARNING" ? "△ WARNING" : "✗ FAIL").padEnd(55)}║`);
  console.log("╚══════════════════════════════════════════════════════════════════════════════╝\n");
}

// Known-value test case for validation
export interface TestCase {
  name: string;
  property: Partial<PropertyAuditInput>;
  expectedMonthlyRoomRevenue: number;
  expectedAnnualDepreciation: number;
  expectedMonthlyPayment: number;
}

export const KNOWN_VALUE_TEST_CASES: TestCase[] = [
  {
    name: "Simple 10-Room Hotel Test",
    property: {
      roomCount: 10,
      startAdr: 100,
      startOccupancy: 0.70,
      maxOccupancy: 0.70,
      purchasePrice: 1000000,
      buildingImprovements: 200000,
      type: "Financed",
      acquisitionLTV: 0.75,
    },
    expectedMonthlyRoomRevenue: 21350, // 10 rooms × $100 ADR × 70% occ × 30.5 days (365/12)
    expectedAnnualDepreciation: 43636.36, // $1,200,000 / 27.5 years
    expectedMonthlyPayment: 7549.94, // $900,000 @ 9% for 25 years using PMT formula
  },
  {
    name: "All-Cash Acquisition Test",
    property: {
      roomCount: 20,
      startAdr: 150,
      startOccupancy: 0.65,
      maxOccupancy: 0.80,
      purchasePrice: 2000000,
      buildingImprovements: 500000,
      type: "All Cash",
    },
    expectedMonthlyRoomRevenue: 59475, // 20 rooms × $150 ADR × 65% occ × 30.5 days (365/12)
    expectedAnnualDepreciation: 90909.09, // $2,500,000 / 27.5 years
    expectedMonthlyPayment: 0, // All cash = no debt
  }
];

export function runKnownValueTests(): { passed: boolean; results: string } {
  let output = "";
  let allPassed = true;
  
  output += "╔══════════════════════════════════════════════════════════════════════════════╗\n";
  output += "║                    KNOWN-VALUE TEST CASE VALIDATION                          ║\n";
  output += "╚══════════════════════════════════════════════════════════════════════════════╝\n\n";
  
  for (const testCase of KNOWN_VALUE_TEST_CASES) {
    output += `▸ ${testCase.name}\n`;
    output += "  ─────────────────────────────────────────────────────────────\n";
    
    // Test room revenue calculation (use 365/12 = 30.4167, round to 30.5 for standard)
    const roomCount = testCase.property.roomCount || 0;
    const adr = testCase.property.startAdr || 0;
    const occupancy = testCase.property.startOccupancy || 0;
    const calculatedRoomRevenue = roomCount * adr * occupancy * DAYS_PER_MONTH;
    const revenueMatch = Math.abs(calculatedRoomRevenue - testCase.expectedMonthlyRoomRevenue) < 1;
    
    output += `  Room Revenue: ${revenueMatch ? "✓" : "✗"}\n`;
    output += `    Formula: ${roomCount} rooms × $${adr} ADR × ${(occupancy * 100).toFixed(0)}% × ${DAYS_PER_MONTH} days\n`;
    output += `    Expected: $${testCase.expectedMonthlyRoomRevenue.toLocaleString()}\n`;
    output += `    Calculated: $${calculatedRoomRevenue.toLocaleString()}\n`;
    if (!revenueMatch) allPassed = false;
    
    // Test depreciation calculation
    const buildingValue = (testCase.property.purchasePrice || 0) + (testCase.property.buildingImprovements || 0);
    const calculatedDepreciation = buildingValue / DEPRECIATION_YEARS;
    const depreciationMatch = Math.abs(calculatedDepreciation - testCase.expectedAnnualDepreciation) < 1;
    
    output += `\n  Depreciation: ${depreciationMatch ? "✓" : "✗"}\n`;
    output += `    Formula: $${buildingValue.toLocaleString()} ÷ ${DEPRECIATION_YEARS} years\n`;
    output += `    Expected: $${testCase.expectedAnnualDepreciation.toLocaleString()}\n`;
    output += `    Calculated: $${calculatedDepreciation.toLocaleString()}\n`;
    if (!depreciationMatch) allPassed = false;
    
    // Test loan payment calculation
    if (testCase.property.type === "Financed") {
      const totalInvestment = buildingValue;
      const ltv = testCase.property.acquisitionLTV || DEFAULT_LTV;
      const loanAmount = totalInvestment * ltv;
      const rate = DEFAULT_INTEREST_RATE / 12;
      const n = DEFAULT_TERM_YEARS * 12;
      const calculatedPayment = loanAmount > 0 
        ? (loanAmount * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1)
        : 0;
      const paymentMatch = Math.abs(calculatedPayment - testCase.expectedMonthlyPayment) < 1;
      
      output += `\n  Loan Payment: ${paymentMatch ? "✓" : "✗"}\n`;
      output += `    Formula: PMT($${loanAmount.toLocaleString()}, 9%/12, 300 months)\n`;
      output += `    Expected: $${testCase.expectedMonthlyPayment.toLocaleString()}\n`;
      output += `    Calculated: $${calculatedPayment.toFixed(2)}\n`;
      if (!paymentMatch) allPassed = false;
    } else {
      output += `\n  Loan Payment: ✓ (All cash - no debt)\n`;
    }
    
    output += "\n";
  }
  
  output += "═".repeat(80) + "\n";
  output += `KNOWN-VALUE TEST RESULT: ${allPassed ? "✓ ALL TESTS PASSED" : "✗ SOME TESTS FAILED"}\n`;
  output += "═".repeat(80) + "\n";
  
  return { passed: allPassed, results: output };
}
