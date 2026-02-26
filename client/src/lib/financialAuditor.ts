/**
 * financialAuditor.ts — The GAAP Compliance Audit Engine (Orchestrator)
 *
 * This file orchestrates 7 audit sections that independently verify every number
 * produced by the financial engine. Each audit module lives in ./audits/ and
 * targets a different area:
 *   1. Timing Rules — No revenue before operations start, no debt before acquisition
 *   2. Depreciation — 27.5-year straight-line per IRS Publication 946 / ASC 360
 *   3. Loan Amortization — PMT formula verification, interest/principal split (ASC 470)
 *   4. Income Statement — Revenue, GOP, NOI, Net Income formulas (USALI / ASC 606)
 *   5. Management Fees — Base fee on revenue, incentive fee on GOP (ASC 606)
 *   6. Balance Sheet — Property value = Land + Building - Accumulated Depreciation (ASC 360)
 *   7. Cash Flow Reconciliation — Operating CF + Financing CF = Net Cash Flow (ASC 230)
 *
 * The final output is an audit opinion: UNQUALIFIED, QUALIFIED, ADVERSE, or DISCLAIMER.
 */
import { MonthlyFinancials } from "./financialEngine";
import { AUDIT_CRITICAL_ISSUE_THRESHOLD } from './constants';

import type { AuditReport, AuditSection, PropertyAuditInput, GlobalAuditInput } from "./audits/types";
import { auditTimingRules } from "./audits/auditTiming";
import { auditDepreciation } from "./audits/auditDepreciation";
import { auditLoanAmortization } from "./audits/auditAmortization";
import { auditIncomeStatement } from "./audits/auditIncomeStatement";
import { auditManagementFees } from "./audits/auditManagementFees";
import { auditBalanceSheet } from "./audits/auditBalanceSheet";
import { auditCashFlowReconciliation } from "./audits/auditCashFlow";

export type { AuditFinding, AuditSection, AuditReport, PropertyAuditInput, GlobalAuditInput } from "./audits/types";
export { auditTimingRules } from "./audits/auditTiming";
export { auditDepreciation } from "./audits/auditDepreciation";
export { auditLoanAmortization } from "./audits/auditAmortization";
export { auditIncomeStatement } from "./audits/auditIncomeStatement";
export { auditManagementFees } from "./audits/auditManagementFees";
export { auditBalanceSheet } from "./audits/auditBalanceSheet";
export { auditCashFlowReconciliation } from "./audits/auditCashFlow";

const ADVERSE_CRITICAL_THRESHOLD = AUDIT_CRITICAL_ISSUE_THRESHOLD;

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
  const materialIssues = sections.reduce((sum, s) => sum + s.materialIssues, 0);
  
  let opinion: "UNQUALIFIED" | "QUALIFIED" | "ADVERSE" | "DISCLAIMER";
  let opinionText: string;
  
  if (criticalIssues === 0 && materialIssues === 0) {
    opinion = "UNQUALIFIED";
    opinionText = "In our opinion, the financial projections present fairly, in all material respects, the expected financial position and results of operations in conformity with Generally Accepted Accounting Principles (GAAP) and industry standards (USALI).";
  } else if (criticalIssues === 0 && materialIssues > 0) {
    opinion = "QUALIFIED";
    opinionText = `In our opinion, except for the ${materialIssues} material issue(s) noted in this report, the financial projections present fairly the expected financial position. Management should address the noted exceptions.`;
  } else if (criticalIssues > 0 && criticalIssues <= ADVERSE_CRITICAL_THRESHOLD) {
    opinion = "QUALIFIED";
    opinionText = `In our opinion, except for the ${criticalIssues} critical and ${materialIssues} material issue(s) noted, the financial projections require adjustment before they can be considered materially correct.`;
  } else {
    opinion = "ADVERSE";
    opinionText = `Due to ${criticalIssues} critical issues affecting the reliability of the financial projections, we are unable to express an unqualified opinion. The projections do not present fairly the expected financial position in conformity with GAAP.`;
  }
  
  return {
    timestamp: new Date(),
    auditorName: "Hospitality Business Financial Audit Engine v2.0",
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
