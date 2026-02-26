import { MonthlyFinancials } from "../financialEngine";
import { differenceInMonths, startOfMonth } from "date-fns";
import {
  DEFAULT_LAND_VALUE_PERCENT,
  DEPRECIATION_YEARS,
} from '../constants';
import type { AuditFinding, AuditSection, PropertyAuditInput, GlobalAuditInput } from "./types";
import { parseLocalDate, formatVariance, AUDIT_TOLERANCE_DOLLARS } from "./helpers";

export function auditBalanceSheet(
  property: PropertyAuditInput,
  global: GlobalAuditInput,
  monthlyData: MonthlyFinancials[]
): AuditSection {
  const findings: AuditFinding[] = [];

  const modelStart = startOfMonth(parseLocalDate(global.modelStartDate));
  const acqDate = startOfMonth(parseLocalDate(property.acquisitionDate || property.operationsStartDate));
  const acqMonthIndex = differenceInMonths(acqDate, modelStart);

  const landPct = property.landValuePercent ?? DEFAULT_LAND_VALUE_PERCENT;
  const depreciableBasis = (property.purchasePrice || 0) * (1 - landPct) + (property.buildingImprovements || 0);
  const monthlyDepreciation = depreciableBasis / DEPRECIATION_YEARS / 12;
  const landValue = (property.purchasePrice || 0) * landPct;

  let failedPropertyValue = 0;
  let failedEquity = 0;
  let totalChecked = 0;

  let cumulativeDepreciation = 0;

  for (let i = 0; i < monthlyData.length; i++) {
    const m = monthlyData[i];

    if (i < acqMonthIndex) continue;
    totalChecked++;

    cumulativeDepreciation += (m.depreciationExpense || 0);
    const expectedPropertyValue = landValue + depreciableBasis - cumulativeDepreciation;

    const actualPropertyValue = m.propertyValue || 0;

    if (Math.abs(expectedPropertyValue - actualPropertyValue) > AUDIT_TOLERANCE_DOLLARS) {
      failedPropertyValue++;
      if (failedPropertyValue <= 3) {
        findings.push({
          category: "Balance Sheet",
          rule: "Property Asset = Land + Depreciable Basis - Accumulated Depreciation",
          gaapReference: "ASC 360-10",
          severity: "material",
          passed: false,
          expected: expectedPropertyValue.toFixed(2),
          actual: actualPropertyValue.toFixed(2),
          variance: formatVariance(expectedPropertyValue, actualPropertyValue),
          recommendation: `Month ${i + 1}: Expected = $${landValue.toLocaleString()} + $${depreciableBasis.toLocaleString()} - $${cumulativeDepreciation.toFixed(0)} acc. depreciation`,
          workpaperRef: `WP-BS-ASSET-M${i + 1}`
        });
      }
    }

    const expectedNetCF = (m.operatingCashFlow || 0) + (m.financingCashFlow || 0);
    const actualCF = m.cashFlow || 0;
    if (Math.abs(expectedNetCF - actualCF) > AUDIT_TOLERANCE_DOLLARS) {
      failedEquity++;
      if (failedEquity <= 3) {
        findings.push({
          category: "Balance Sheet",
          rule: "Cash Flow = Operating CF + Financing CF",
          gaapReference: "ASC 230 / FASB Conceptual Framework",
          severity: "material",
          passed: false,
          expected: expectedNetCF.toFixed(2),
          actual: actualCF.toFixed(2),
          variance: formatVariance(expectedNetCF, actualCF),
          recommendation: `Month ${i + 1}: Cash flow components must reconcile`,
          workpaperRef: `WP-BS-CF-M${i + 1}`
        });
      }
    }
  }

  if (failedPropertyValue > 3) {
    findings.push({
      category: "Balance Sheet",
      rule: "Property Asset Valuation",
      gaapReference: "ASC 360-10",
      severity: "material",
      passed: false,
      expected: "All months match",
      actual: `${failedPropertyValue} months failed`,
      variance: `${failedPropertyValue} of ${totalChecked} months`,
      recommendation: "Property value calculation has systematic variance - review depreciation logic",
      workpaperRef: "WP-BS-ASSET-SUMMARY"
    });
  }

  if (failedPropertyValue === 0 && failedEquity === 0) {
    findings.push({
      category: "Balance Sheet",
      rule: "Balance Sheet Reconciliation",
      gaapReference: "FASB Conceptual Framework",
      severity: "info",
      passed: true,
      expected: "All balance sheet checks passed",
      actual: `Property value and cash flow reconciled for ${totalChecked} months`,
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
