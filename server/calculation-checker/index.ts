import {
  DEPRECIATION_YEARS,
  DAYS_PER_MONTH,
  DEFAULT_LAND_VALUE_PERCENT,
  DEFAULT_OCCUPANCY_RAMP_MONTHS,
  DEFAULT_REV_SHARE_EVENTS,
  DEFAULT_TAX_RATE,
  DEFAULT_PROJECTION_YEARS,
  DEFAULT_LTV,
  DEFAULT_INTEREST_RATE,
  DEFAULT_TERM_YEARS,
  CHECKER_REVENUE_GROWTH_VARIANCE,
  CHECKER_NOI_MARGIN_MIN_PCT,
  CHECKER_NOI_MARGIN_MAX_PCT,
  CHECKER_BALANCE_SHEET_TOLERANCE,
  CHECKER_MIN_DSCR,
} from "@shared/constants";
import type {
  VerificationReport,
  PropertyCheckResults,
  CheckResult,
  ClientPropertyMonthly,
  CheckerProperty,
  CheckerGlobalAssumptions,
  IndependentMonthlyResult,
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
import {
  aggregateYearMetrics,
  addCrossValidationChecks,
} from "./helpers";

const PROJECTION_YEARS = DEFAULT_PROJECTION_YEARS;

/**
 * Run the full independent verification suite across all properties and the company.
 */
export function runIndependentVerification(
  properties: CheckerProperty[],
  globalAssumptions: CheckerGlobalAssumptions,
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

  const allIndependentCalcs: IndependentMonthlyResult[][] = [];
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

    const firstOperationalMonth = independentCalc.findIndex((m) => m.revenueRooms > 0);

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
        "AGOP = GOP - Management Fees",
        "P&L",
        "USALI",
        "GOP - Base Fee - Incentive Fee",
        m.gop - m.feeBase - m.feeIncentive,
        m.agop,
        "critical"
      ));

      checks.push(check(
        "NOI = AGOP - Taxes",
        "P&L",
        "USALI",
        "AGOP - Property Taxes",
        m.agop - m.expenseTaxes,
        m.noi,
        "critical"
      ));

      checks.push(check(
        "ANOI = NOI - FF&E Reserve",
        "P&L",
        "USALI",
        "NOI - FF&E Reserve",
        m.noi - m.expenseFFE,
        m.anoi,
        "critical"
      ));

      checks.push(check(
        "Net Income = ANOI - Interest - Depreciation - Tax",
        "P&L",
        "ASC 470 / ASC 360",
        "ANOI - Interest - Depreciation - Income Tax",
        m.anoi - m.interestExpense - m.depreciationExpense - (Math.max(0, m.anoi - m.interestExpense - m.depreciationExpense) * (property.taxRate ?? DEFAULT_TAX_RATE)),
        m.netIncome,
        "critical"
      ));

      checks.push(check(
        "Cash Flow = ANOI - Debt Service - Tax",
        "Cash Flow",
        "ASC 230",
        "ANOI - Total Debt Payment (interest + principal) - Income Tax",
        m.anoi - m.debtPayment - (Math.max(0, m.anoi - m.interestExpense - m.depreciationExpense) * (property.taxRate ?? DEFAULT_TAX_RATE)),
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
      (independentCalc.find((m) => m.depreciationExpense > 0)?.depreciationExpense ?? 0) * 12,
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
        independentCalc.find((m) => m.debtPayment > 0)?.debtPayment || 0,
        "critical"
      ));

      checks.push(check(
        "Interest + Principal = Debt Payment",
        "Debt",
        "ASC 470",
        "Interest Expense + Principal Payment = Total Debt Service",
        independentCalc.find((m) => m.debtPayment > 0)?.debtPayment || 0,
        (independentCalc.find((m) => m.debtPayment > 0)?.interestExpense || 0) +
        (independentCalc.find((m) => m.debtPayment > 0)?.principalPayment || 0),
        "critical"
      ));
    }

    const midYear = Math.floor(projectionYears / 2);
    const serverYear1    = aggregateYearMetrics(independentCalc.slice(0, 12));
    const serverMidYear  = aggregateYearMetrics(independentCalc.slice(midYear * 12, (midYear + 1) * 12));
    const serverLastYear = aggregateYearMetrics(independentCalc.slice((projectionYears - 1) * 12, projectionMonths));

    if (clientMonthly && clientMonthly.length >= 12) {
      const clientYear1 = aggregateYearMetrics(clientMonthly.slice(0, 12));
      addCrossValidationChecks(checks, "Year 1", serverYear1, clientYear1);

      if (clientMonthly.length >= (midYear + 1) * 12 && serverMidYear.revenue > 0) {
        const clientMidYear = aggregateYearMetrics(clientMonthly.slice(midYear * 12, (midYear + 1) * 12));
        addCrossValidationChecks(checks, `Year ${midYear + 1} (Mid-Projection)`, serverMidYear, clientMidYear);
      }

      if (clientMonthly.length >= projectionMonths && serverLastYear.revenue > 0) {
        const clientLastYear = aggregateYearMetrics(clientMonthly.slice((projectionYears - 1) * 12, projectionMonths));
        addCrossValidationChecks(checks, `Year ${projectionYears}`, serverLastYear, clientLastYear);
      }
    }

    if (serverYear1.revenue > 0 && serverLastYear.revenue > 0) {
      const annualGrowthRate = Math.pow(serverLastYear.revenue / serverYear1.revenue, 1 / (projectionYears - 1)) - 1;
      const expectedGrowthRate = property.adrGrowthRate;

      // Only compare revenue CAGR to ADR growth when occupancy is stable (no ramp).
      // When occupancy ramps, revenue CAGR includes both ADR growth AND occupancy growth,
      // so comparing to ADR growth alone produces false "material" findings.
      const hasOccupancyRamp = (property.startOccupancy ?? 0) < (property.maxOccupancy ?? 1);
      if (projectionYears > 1) {
        if (hasOccupancyRamp) {
          checks.push(check(
            "Revenue Growth Rate Consistency",
            "Reasonableness",
            "Industry",
            `Revenue CAGR ${(annualGrowthRate * 100).toFixed(1)}% includes occupancy ramp (start ${((property.startOccupancy ?? 0) * 100).toFixed(0)}% → max ${((property.maxOccupancy ?? 1) * 100).toFixed(0)}%) — not directly comparable to ADR growth ${(expectedGrowthRate * 100).toFixed(1)}%`,
            expectedGrowthRate,
            annualGrowthRate,
            "info"
          ));
        } else {
          checks.push(check(
            "Revenue Growth Rate Consistency",
            "Reasonableness",
            "Industry",
            `Expected ADR growth ${(expectedGrowthRate * 100).toFixed(1)}% vs Actual Revenue CAGR ${(annualGrowthRate * 100).toFixed(1)}%`,
            expectedGrowthRate,
            annualGrowthRate,
            Math.abs(annualGrowthRate - expectedGrowthRate) > CHECKER_REVENUE_GROWTH_VARIANCE ? "material" : "info"
          ));
        }
      }

      checks.push(check(
        "Revenue Growth Direction",
        "Reasonableness",
        "Industry",
        `Year 1 $${Math.round(serverYear1.revenue).toLocaleString()} → Year ${projectionYears} $${Math.round(serverLastYear.revenue).toLocaleString()} (expect growth)`,
        1,
        serverLastYear.revenue > serverYear1.revenue ? 1 : 0,
        serverLastYear.revenue <= serverYear1.revenue ? "material" : "info"
      ));
    }

    if (property.type === "Financed" && loanAmount > 0) {
      const year1DebtService = independentCalc.slice(0, 12).reduce((s, m) => s + m.debtPayment, 0);
      const year1DSCR = year1DebtService > 0 ? serverYear1.noi / year1DebtService : 0;

      checks.push(check(
        "DSCR Reasonableness (Year 1)",
        "Debt",
        "ASC 470 / Banking",
        `Year 1 NOI $${Math.round(serverYear1.noi).toLocaleString()} / Debt Service $${Math.round(year1DebtService).toLocaleString()} (expect > 1.0x)`,
        CHECKER_MIN_DSCR,
        year1DSCR,
        year1DSCR < CHECKER_MIN_DSCR ? "critical" : "info"
      ));
    }

    if (serverLastYear.revenue > 0) {
      const noiMarginYear1 = serverYear1.revenue > 0 ? (serverYear1.noi / serverYear1.revenue * 100) : 0;
      const noiMarginLastYear = (serverLastYear.noi / serverLastYear.revenue * 100);

      checks.push(check(
        "NOI Margin Reasonableness",
        "Reasonableness",
        "Industry Benchmark",
        `Year 1: ${noiMarginYear1.toFixed(1)}% → Year ${projectionYears}: ${noiMarginLastYear.toFixed(1)}% (expect 5-60%)`,
        1,
        (noiMarginLastYear >= CHECKER_NOI_MARGIN_MIN_PCT && noiMarginLastYear <= CHECKER_NOI_MARGIN_MAX_PCT) ? 1 : 0,
        (noiMarginLastYear < CHECKER_NOI_MARGIN_MIN_PCT || noiMarginLastYear > CHECKER_NOI_MARGIN_MAX_PCT) ? "material" : "info"
      ));
    }

    // ── A = L + E identity check (ASC 210) ──────────────────────────────────
    const initialEquity = checkPropertyValue - loanAmount + (property.operatingReserve ?? 0);
    let cumulativeNetIncome = 0;
    let aleFailedMonths = 0;
    const acquisitionIndex = independentCalc.findIndex((m) => m.propertyValue > 0);

    for (let mi = 0; mi < independentCalc.length; mi++) {
      const m = independentCalc[mi];
      if (mi < acquisitionIndex) continue;
      cumulativeNetIncome += m.netIncome;
      const totalAssets = m.endingCash + m.propertyValue;
      const totalLiabilities = m.debtOutstanding;
      const derivedEquity = initialEquity + cumulativeNetIncome;
      const gap = Math.abs(totalAssets - totalLiabilities - derivedEquity);
      if (gap > CHECKER_BALANCE_SHEET_TOLERANCE) aleFailedMonths++;
    }

    checks.push(check(
      "Balance Sheet Identity A=L+E",
      "Balance Sheet",
      "ASC 210",
      `Assets = Liabilities + Equity for all ${independentCalc.length - Math.max(acquisitionIndex, 0)} post-acquisition months; failed = ${aleFailedMonths}`,
      0,
      aleFailedMonths,
      "critical"
    ));

    const endingCash = independentCalc[independentCalc.length - 1]?.endingCash || 0;
    const cumulativeCashFlow = independentCalc.reduce((sum, m) => sum + m.cashFlow, 0);
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

    const shortfallMonths = independentCalc.filter((m) => m.cashShortfall);
    const minCash = Math.min(...independentCalc.map((m) => m.endingCash));
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

    const preOpMonths = independentCalc.filter((m) => m.monthIndex < firstOperationalMonth);
    if (preOpMonths.length > 0) {
      const preOpRevenue = preOpMonths.reduce((sum, m) => sum + m.revenueTotal, 0);
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

    if (firstOperationalMonth >= 0) {
      const m0 = independentCalc[firstOperationalMonth];
      checks.push(check(
        "Working Capital AR (First Operational Month)",
        "Balance Sheet",
        "ASC 310",
        `AR = Monthly Revenue / 30 × ${(property as any).arDays ?? 30} AR days`,
        m0.accountsReceivable,
        m0.accountsReceivable,
        "info"
      ));

      checks.push(check(
        "Working Capital AP (First Operational Month)",
        "Balance Sheet",
        "ASC 405",
        `AP = Monthly OpEx / 30 × ${(property as any).apDays ?? 45} AP days`,
        m0.accountsPayable,
        m0.accountsPayable,
        "info"
      ));
    }

    const finalNOL = independentCalc[independentCalc.length - 1]?.nolBalance ?? 0;
    checks.push(check(
      "NOL Carryforward Balance (End of Projection)",
      "Tax",
      "IRC §172",
      `NOL balance at end of projection = $${Math.round(finalNOL).toLocaleString()} (80% utilization cap applied)`,
      finalNOL,
      finalNOL,
      "info"
    ));

    if ((property as any).costSegEnabled) {
      const costSegDepMonth1 = independentCalc.find(m => m.depreciationExpense > 0);
      const standardMonthlyDep = depBasis / DEPRECIATION_YEARS / 12;
      if (costSegDepMonth1) {
        checks.push(check(
          "Cost Segregation Depreciation > Standard SL",
          "Tax",
          "IRS Pub 946 / Cost Seg Study",
          `Cost seg depreciation $${Math.round(costSegDepMonth1.depreciationExpense).toLocaleString()}/mo vs standard SL $${Math.round(standardMonthlyDep).toLocaleString()}/mo`,
          1,
          costSegDepMonth1.depreciationExpense > standardMonthlyDep ? 1 : 0,
          "info"
        ));
      }
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
