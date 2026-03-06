import {
  DEPRECIATION_YEARS,
  DAYS_PER_MONTH,
  DEFAULT_LAND_VALUE_PERCENT,
  DEFAULT_OCCUPANCY_RAMP_MONTHS,
  DEFAULT_REV_SHARE_EVENTS,
  DEFAULT_TAX_RATE,
} from "@shared/constants";
import {
  VerificationReport,
  PropertyCheckResults,
  CheckResult,
  ClientPropertyMonthly,
} from "./types";
import { check } from "./gaap-checks";
import {
  independentPropertyCalc,
  calculatePMT,
} from "./property-checks";
import {
  runCompanyChecks,
  runConsolidatedChecks,
} from "./portfolio-checks";

const PROJECTION_YEARS = 10;
const DEFAULT_LTV = 0.75;
const DEFAULT_INTEREST_RATE = 0.09;
const DEFAULT_TERM_YEARS = 25;

/**
 * Run the full independent verification suite across all properties and the company.
 */
export function runIndependentVerification(
  properties: any[],
  globalAssumptions: any,
  clientResults?: ClientPropertyMonthly[][]
): VerificationReport {
  const propertyResults: PropertyCheckResults[] = [];
  let totalChecks = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let criticalIssues = 0;
  let materialIssues = 0;

  const projectionYears = globalAssumptions.projectionYears ?? PROJECTION_YEARS;
  const projectionMonths = projectionYears * 12;

  const allIndependentCalcs: any[][] = [];
  for (const property of properties) {
    allIndependentCalcs.push(independentPropertyCalc(property, globalAssumptions));
  }

  for (let pi = 0; pi < properties.length; pi++) {
    const property = properties[pi];
    const checks: CheckResult[] = [];
    const independentCalc = allIndependentCalcs[pi];
    const clientMonthly = clientResults?.[pi];

    const checkPropertyValue = property.purchasePrice + (property.buildingImprovements ?? 0);
    const ltv = property.acquisitionLTV ?? DEFAULT_LTV;
    const loanAmount = property.type === "Financed" ? checkPropertyValue * ltv : 0;
    const loanRate = property.acquisitionInterestRate ?? DEFAULT_INTEREST_RATE;
    const loanTerm = property.acquisitionTermYears ?? DEFAULT_TERM_YEARS;

    const firstOperationalMonth = independentCalc.findIndex((m: any) => m.revenueRooms > 0);

    if (firstOperationalMonth >= 0) {
      const m = independentCalc[firstOperationalMonth];
      const adrAtFirstOp = m.adr;
      const occAtFirstOp = m.occupancy;

      checks.push(check(
        "Room Revenue (First Operational Month)",
        "Revenue",
        "ASC 606",
        `${property.roomCount} rooms × $${Math.round(adrAtFirstOp)} ADR × ${(occAtFirstOp * 100).toFixed(0)}% occ × ${DAYS_PER_MONTH} days`,
        property.roomCount * adrAtFirstOp * occAtFirstOp * DAYS_PER_MONTH,
        m.revenueRooms,
        "critical"
      ));

      const revShareEvents = property.revShareEvents ?? DEFAULT_REV_SHARE_EVENTS;
      checks.push(check(
        "Events Revenue (Month 1)",
        "Revenue",
        "ASC 606",
        `Room Rev × ${(revShareEvents * 100).toFixed(0)}% events share`,
        m.revenueRooms * revShareEvents,
        m.revenueEvents,
        "material"
      ));

      checks.push(check(
        "Total Revenue (Month 1)",
        "Revenue",
        "ASC 606",
        "Rooms + Events + F&B + Other",
        m.revenueRooms + m.revenueEvents + m.revenueFB + m.revenueOther,
        m.revenueTotal,
        "critical"
      ));

      checks.push(check(
        "GOP = Revenue - OpEx",
        "P&L",
        "USALI",
        "Total Revenue - Total Operating Expenses",
        m.revenueTotal - m.totalOperatingExpenses,
        m.gop,
        "critical"
      ));

      checks.push(check(
        "NOI = GOP - Fees - FF&E",
        "P&L",
        "USALI",
        "GOP - Base Fee - Incentive Fee - FF&E Reserve",
        m.gop - m.feeBase - m.feeIncentive - m.expenseFFE,
        m.noi,
        "critical"
      ));

      checks.push(check(
        "Net Income = NOI - Interest - Depreciation - Tax",
        "P&L",
        "ASC 470 / ASC 360",
        "NOI - Interest - Depreciation - Income Tax",
        m.noi - m.interestExpense - m.depreciationExpense - (Math.max(0, m.noi - m.interestExpense - m.depreciationExpense) * (property.taxRate ?? DEFAULT_TAX_RATE)),
        m.netIncome,
        "critical"
      ));

      checks.push(check(
        "Cash Flow = NOI - Debt Service - Tax",
        "Cash Flow",
        "ASC 230",
        "NOI - Total Debt Payment (interest + principal) - Income Tax",
        m.noi - m.debtPayment - (Math.max(0, m.noi - m.interestExpense - m.depreciationExpense) * (property.taxRate ?? DEFAULT_TAX_RATE)),
        m.cashFlow,
        "critical"
      ));

      checks.push(check(
        "Operating CF = NI + Depreciation",
        "Cash Flow",
        "ASC 230 (Indirect)",
        "Net Income + Depreciation (non-cash add-back)",
        m.netIncome + m.depreciationExpense,
        m.operatingCashFlow,
        "critical"
      ));

      checks.push(check(
        "Financing CF = -Principal",
        "Cash Flow",
        "ASC 230",
        "Negative of principal repayment (financing activity)",
        -m.principalPayment,
        m.financingCashFlow,
        "material"
      ));
    }

    const depBasis = property.purchasePrice * (1 - (property.landValuePercent ?? DEFAULT_LAND_VALUE_PERCENT)) + (property.buildingImprovements ?? 0);
    checks.push(check(
      "Annual Depreciation (Land Excluded)",
      "Balance Sheet",
      "ASC 360 / IRS Pub 946",
      `$${depBasis.toLocaleString()} depreciable basis ÷ ${DEPRECIATION_YEARS} years`,
      depBasis / DEPRECIATION_YEARS,
      independentCalc.find((m: any) => m.depreciationExpense > 0)?.depreciationExpense * 12 || 0,
      "critical"
    ));

    if (property.type === "Financed" && loanAmount > 0) {
      const monthlyPayment = calculatePMT(loanAmount, loanRate / 12, loanTerm * 12);

      checks.push(check(
        "Monthly Debt Service",
        "Debt",
        "ASC 470",
        `PMT($${loanAmount.toLocaleString()}, ${(loanRate * 100).toFixed(1)}%/12, ${loanTerm * 12} months)`,
        monthlyPayment,
        independentCalc.find((m: any) => m.debtPayment > 0)?.debtPayment || 0,
        "critical"
      ));

      checks.push(check(
        "Interest + Principal = Debt Payment",
        "Debt",
        "ASC 470",
        "Interest Expense + Principal Payment = Total Debt Service",
        independentCalc.find((m: any) => m.debtPayment > 0)?.debtPayment || 0,
        (independentCalc.find((m: any) => m.debtPayment > 0)?.interestExpense || 0) +
        (independentCalc.find((m: any) => m.debtPayment > 0)?.principalPayment || 0),
        "critical"
      ));
    }

    const serverYear1 = independentCalc.slice(0, 12);
    const serverYear1Revenue = serverYear1.reduce((s: number, m: any) => s + m.revenueTotal, 0);
    const serverYear1NOI = serverYear1.reduce((s: number, m: any) => s + m.noi, 0);

    const serverLastYear = independentCalc.slice((projectionYears - 1) * 12, projectionMonths);
    const serverLastYearRevenue = serverLastYear.reduce((s: number, m: any) => s + m.revenueTotal, 0);
    const serverLastYearNOI = serverLastYear.reduce((s: number, m: any) => s + m.noi, 0);

    if (clientMonthly && clientMonthly.length >= 12) {
      const clientYear1Revenue = clientMonthly.slice(0, 12).reduce((s, m) => s + m.revenueTotal, 0);
      const clientYear1NOI = clientMonthly.slice(0, 12).reduce((s, m) => s + m.noi, 0);

      checks.push(check(
        "Year 1 Revenue (Server vs Client Engine)",
        "Cross-Validation",
        "Independence",
        "Server independent calc vs client generatePropertyProForma",
        serverYear1Revenue,
        clientYear1Revenue,
        "critical"
      ));

      checks.push(check(
        "Year 1 NOI (Server vs Client Engine)",
        "Cross-Validation",
        "Independence",
        "Server independent calc vs client generatePropertyProForma",
        serverYear1NOI,
        clientYear1NOI,
        "critical"
      ));

      if (clientMonthly.length >= projectionMonths && serverLastYearRevenue > 0) {
        const clientLastYearRevenue = clientMonthly.slice((projectionYears - 1) * 12, projectionMonths).reduce((s, m) => s + m.revenueTotal, 0);
        const clientLastYearNOI = clientMonthly.slice((projectionYears - 1) * 12, projectionMonths).reduce((s, m) => s + m.noi, 0);

        checks.push(check(
          `Year ${projectionYears} Revenue (Server vs Client Engine)`,
          "Cross-Validation",
          "Independence",
          "Server independent calc vs client generatePropertyProForma",
          serverLastYearRevenue,
          clientLastYearRevenue,
          "critical"
        ));

        checks.push(check(
          `Year ${projectionYears} NOI (Server vs Client Engine)`,
          "Cross-Validation",
          "Independence",
          "Server independent calc vs client generatePropertyProForma",
          serverLastYearNOI,
          clientLastYearNOI,
          "critical"
        ));
      }
    }

    if (serverYear1Revenue > 0 && serverLastYearRevenue > 0) {
      checks.push(check(
        "Revenue Growth Direction",
        "Reasonableness",
        "Industry",
        `Year 1 $${Math.round(serverYear1Revenue).toLocaleString()} → Year ${projectionYears} $${Math.round(serverLastYearRevenue).toLocaleString()} (expect growth)`,
        1,
        serverLastYearRevenue > serverYear1Revenue ? 1 : 0,
        serverLastYearRevenue <= serverYear1Revenue ? "material" : "info"
      ));
    }

    if (serverLastYearRevenue > 0) {
      const noiMarginYear1 = serverYear1Revenue > 0 ? (serverYear1NOI / serverYear1Revenue * 100) : 0;
      const noiMarginLastYear = (serverLastYearNOI / serverLastYearRevenue * 100);

      checks.push(check(
        "NOI Margin Reasonableness",
        "Reasonableness",
        "Industry Benchmark",
        `Year 1: ${noiMarginYear1.toFixed(1)}% → Year ${projectionYears}: ${noiMarginLastYear.toFixed(1)}% (expect 5-60%)`,
        1,
        (noiMarginLastYear >= 5 && noiMarginLastYear <= 60) ? 1 : 0,
        (noiMarginLastYear < 5 || noiMarginLastYear > 60) ? "material" : "info"
      ));
    }

    const endingCash = independentCalc[independentCalc.length - 1]?.endingCash || 0;
    const cumulativeCashFlow = independentCalc.reduce((sum: number, m: any) => sum + m.cashFlow, 0);
    const reserveSeed = property.operatingReserve ?? 0;
    checks.push(check(
      "Cumulative Cash Flow = Ending Cash",
      "Cash Flow",
      "ASC 230",
      "Ending cash balance equals sum of all monthly cash flows + operating reserve seed",
      cumulativeCashFlow + reserveSeed,
      endingCash,
      "critical"
    ));

    const shortfallMonths = independentCalc.filter((m: any) => m.cashShortfall);
    const minCash = Math.min(...independentCalc.map((m: any) => m.endingCash));
    const propLabel = property.name || `Property ${pi + 1}`;
    checks.push(check(
      "No Negative Cash Balance",
      "Cash Flow",
      "Business Rule",
      `[${propLabel}] Cash balance must never go negative; min balance = $${Math.round(minCash).toLocaleString()}, shortfall months = ${shortfallMonths.length}`,
      0,
      shortfallMonths.length,
      "info"
    ));

    let preOpMonths = independentCalc.filter((m: any) => m.monthIndex < firstOperationalMonth);
    if (preOpMonths.length > 0) {
      const preOpRevenue = preOpMonths.reduce((sum: number, m: any) => sum + m.revenueTotal, 0);
      checks.push(check(
        "Pre-Operations Revenue = $0",
        "Timing",
        "ASC 606",
        "No revenue before operations start date",
        0,
        preOpRevenue,
        "critical"
      ));
    }

    const propResult: PropertyCheckResults = {
      propertyName: property.name || "Unnamed Property",
      propertyType: property.type || "Full Equity",
      checks,
      passed: checks.filter(c => c.passed).length,
      failed: checks.filter(c => !c.passed).length,
      criticalIssues: checks.filter(c => !c.passed && c.severity === "critical").length,
    };

    propertyResults.push(propResult);
    totalChecks += checks.length;
    totalPassed += propResult.passed;
    totalFailed += propResult.failed;
    criticalIssues += propResult.criticalIssues;
    materialIssues += checks.filter(c => !c.passed && c.severity === "material").length;
  }

  const companyChecks = runCompanyChecks(
    properties,
    allIndependentCalcs,
    globalAssumptions,
    projectionMonths,
    clientResults
  );
  
  for (const c of companyChecks) {
    totalChecks++;
    if (c.passed) totalPassed++;
    else {
      totalFailed++;
      if (c.severity === "critical") criticalIssues++;
      else if (c.severity === "material") materialIssues++;
    }
  }

  const consolidatedChecks = runConsolidatedChecks(
    properties,
    allIndependentCalcs,
    globalAssumptions,
    clientResults
  );

  for (const c of consolidatedChecks) {
    totalChecks++;
    if (c.passed) totalPassed++;
    else {
      totalFailed++;
      if (c.severity === "critical") criticalIssues++;
      else if (c.severity === "material") materialIssues++;
    }
  }

  let auditOpinion: "UNQUALIFIED" | "QUALIFIED" | "ADVERSE" = "UNQUALIFIED";
  if (criticalIssues > 0) auditOpinion = "ADVERSE";
  else if (materialIssues > 0) auditOpinion = "QUALIFIED";

  return {
    timestamp: new Date().toISOString(),
    propertiesChecked: properties.length,
    propertyResults,
    companyChecks,
    consolidatedChecks,
    summary: {
      totalChecks,
      totalPassed,
      totalFailed,
      criticalIssues,
      materialIssues,
      auditOpinion,
      overallStatus: criticalIssues > 0 ? "FAIL" : (materialIssues > 0 ? "WARNING" : "PASS"),
    },
  };
}

export * from "./types";
export { independentPropertyCalc } from "./property-checks";
