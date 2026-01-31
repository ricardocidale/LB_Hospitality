import { generatePropertyProForma, MonthlyFinancials } from "./financialEngine";
import { checkPropertyFormulas, checkMetricFormulas, generateFormulaReport, FormulaCheckReport } from "./formulaChecker";
import { checkGAAPCompliance, checkCashFlowStatement, generateComplianceReport, ComplianceReport } from "./gaapComplianceChecker";

export interface VerificationResults {
  formulaReport: string;
  complianceReport: string;
  summary: {
    formulaChecksPassed: number;
    formulaChecksFailed: number;
    complianceChecksPassed: number;
    complianceChecksFailed: number;
    criticalIssues: number;
    overallStatus: "PASS" | "FAIL" | "WARNING";
  };
}

export function runFullVerification(
  properties: any[],
  globalAssumptions: any
): VerificationResults {
  const formulaReports: FormulaCheckReport[] = [];
  const complianceReports: ComplianceReport[] = [];
  
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("        FINANCIAL STATEMENT VERIFICATION SUITE");
  console.log("═══════════════════════════════════════════════════════════════\n");
  
  console.log(`Running verification on ${properties.length} properties...\n`);
  
  for (const property of properties) {
    console.log(`\n▸ Verifying: ${property.name || 'Property'}`);
    
    try {
      const financials = generatePropertyProForma(property, globalAssumptions, 120);
      
      // Run formula checks
      const formulaCheck = checkPropertyFormulas(financials);
      formulaReports.push(formulaCheck);
      console.log(`  Formula Checks: ${formulaCheck.passed}/${formulaCheck.totalChecks} passed`);
      
      // Run GAAP compliance checks
      const gaapCheck = checkGAAPCompliance(financials);
      complianceReports.push(gaapCheck);
      console.log(`  GAAP Compliance: ${gaapCheck.passed}/${gaapCheck.totalChecks} passed`);
      
      // Run cash flow statement checks
      const cfCheck = checkCashFlowStatement(financials);
      complianceReports.push(cfCheck);
      console.log(`  Cash Flow Statement: ${cfCheck.passed}/${cfCheck.totalChecks} passed`);
      
      // Run metric formula checks
      const yearlyData = aggregateToYearly(financials);
      const metricCheck = checkMetricFormulas(yearlyData);
      formulaReports.push(metricCheck);
      console.log(`  Metric Formulas: ${metricCheck.passed}/${metricCheck.totalChecks} passed`);
      
    } catch (error) {
      console.error(`  ✗ Error processing property: ${error}`);
    }
  }
  
  // Generate reports
  const formulaReport = generateFormulaReport(formulaReports);
  const complianceReport = generateComplianceReport(complianceReports);
  
  // Calculate summary
  const formulaChecksPassed = formulaReports.reduce((sum, r) => sum + r.passed, 0);
  const formulaChecksFailed = formulaReports.reduce((sum, r) => sum + r.failed, 0);
  const complianceChecksPassed = complianceReports.reduce((sum, r) => sum + r.passed, 0);
  const complianceChecksFailed = complianceReports.reduce((sum, r) => sum + r.failed, 0);
  const criticalIssues = complianceReports.reduce((sum, r) => sum + r.criticalIssues, 0);
  
  let overallStatus: "PASS" | "FAIL" | "WARNING" = "PASS";
  if (criticalIssues > 0 || formulaChecksFailed > 0) {
    overallStatus = "FAIL";
  } else if (complianceChecksFailed > 0) {
    overallStatus = "WARNING";
  }
  
  return {
    formulaReport,
    complianceReport,
    summary: {
      formulaChecksPassed,
      formulaChecksFailed,
      complianceChecksPassed,
      complianceChecksFailed,
      criticalIssues,
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
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("                    OVERALL VERIFICATION STATUS");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`\n  Formula Checks:     ${results.summary.formulaChecksPassed} passed, ${results.summary.formulaChecksFailed} failed`);
  console.log(`  Compliance Checks:  ${results.summary.complianceChecksPassed} passed, ${results.summary.complianceChecksFailed} failed`);
  console.log(`  Critical Issues:    ${results.summary.criticalIssues}`);
  console.log(`\n  OVERALL STATUS:     ${results.summary.overallStatus === "PASS" ? "✅ PASS" : results.summary.overallStatus === "WARNING" ? "⚠️  WARNING" : "❌ FAIL"}`);
  console.log("\n═══════════════════════════════════════════════════════════════\n");
}
