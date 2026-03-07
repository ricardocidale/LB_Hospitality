import {
  DEPRECIATION_YEARS,
  DAYS_PER_MONTH,
  DEFAULT_LAND_VALUE_PERCENT,
  DEFAULT_OCCUPANCY_RAMP_MONTHS,
  DEFAULT_REV_SHARE_EVENTS,
  DEFAULT_TAX_RATE,
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

const PROJECTION_YEARS = 10;
const DEFAULT_LTV = 0.75;
const DEFAULT_INTEREST_RATE = 0.09;
const DEFAULT_TERM_YEARS = 25;

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
        "NOI = AGOP - Insurance - Taxes",
        "P&L",
        "USALI",
        "AGOP - Insurance - Property Taxes",
        m.agop - m.expenseInsurance - m.expenseTaxes,
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

    const serverYear1 = independentCalc.slice(0, 12);
    const serverYear1Revenue = serverYear1.reduce((s, m) => s + m.revenueTotal, 0);
    const serverYear1GOP = serverYear1.reduce((s, m) => s + m.gop, 0);
    const serverYear1AGOP = serverYear1.reduce((s, m) => s + m.agop, 0);
    const serverYear1NOI = serverYear1.reduce((s, m) => s + m.noi, 0);
    const serverYear1ANOI = serverYear1.reduce((s, m) => s + m.anoi, 0);

    const midYear = Math.floor(projectionYears / 2);
    const serverMidYear = independentCalc.slice(midYear * 12, (midYear + 1) * 12);
    const serverMidYearRevenue = serverMidYear.reduce((s, m) => s + m.revenueTotal, 0);
    const serverMidYearGOP = serverMidYear.reduce((s, m) => s + m.gop, 0);
    const serverMidYearAGOP = serverMidYear.reduce((s, m) => s + m.agop, 0);
    const serverMidYearNOI = serverMidYear.reduce((s, m) => s + m.noi, 0);
    const serverMidYearANOI = serverMidYear.reduce((s, m) => s + m.anoi, 0);

    const serverLastYear = independentCalc.slice((projectionYears - 1) * 12, projectionMonths);
    const serverLastYearRevenue = serverLastYear.reduce((s, m) => s + m.revenueTotal, 0);
    const serverLastYearGOP = serverLastYear.reduce((s, m) => s + m.gop, 0);
    const serverLastYearAGOP = serverLastYear.reduce((s, m) => s + m.agop, 0);
    const serverLastYearNOI = serverLastYear.reduce((s, m) => s + m.noi, 0);
    const serverLastYearANOI = serverLastYear.reduce((s, m) => s + m.anoi, 0);

    if (clientMonthly && clientMonthly.length >= 12) {
      const clientYear1 = clientMonthly.slice(0, 12);
      const clientYear1Revenue = clientYear1.reduce((s, m) => s + m.revenueTotal, 0);
      const clientYear1GOP = clientYear1.reduce((s, m) => s + m.gop, 0);
      const clientYear1AGOP = clientYear1.reduce((s, m) => s + m.agop, 0);
      const clientYear1NOI = clientYear1.reduce((s, m) => s + m.noi, 0);
      const clientYear1ANOI = clientYear1.reduce((s, m) => s + m.anoi, 0);

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
        "Year 1 GOP (Server vs Client Engine)",
        "Cross-Validation",
        "Independence",
        "Server independent calc vs client generatePropertyProForma",
        serverYear1GOP,
        clientYear1GOP,
        "critical"
      ));

      checks.push(check(
        "Year 1 AGOP (Server vs Client Engine)",
        "Cross-Validation",
        "Independence",
        "Server independent calc vs client generatePropertyProForma",
        serverYear1AGOP,
        clientYear1AGOP,
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

      checks.push(check(
        "Year 1 ANOI (Server vs Client Engine)",
        "Cross-Validation",
        "Independence",
        "Server independent calc vs client generatePropertyProForma",
        serverYear1ANOI,
        clientYear1ANOI,
        "critical"
      ));

      if (clientMonthly.length >= (midYear + 1) * 12 && serverMidYearRevenue > 0) {
        const clientMidYear = clientMonthly.slice(midYear * 12, (midYear + 1) * 12);
        const clientMidYearRevenue = clientMidYear.reduce((s, m) => s + m.revenueTotal, 0);
        const clientMidYearGOP = clientMidYear.reduce((s, m) => s + m.gop, 0);
        const clientMidYearAGOP = clientMidYear.reduce((s, m) => s + m.agop, 0);
        const clientMidYearNOI = clientMidYear.reduce((s, m) => s + m.noi, 0);
        const clientMidYearANOI = clientMidYear.reduce((s, m) => s + m.anoi, 0);

        checks.push(check(
          `Year ${midYear + 1} (Mid-Projection) Revenue (Server vs Client Engine)`,
          "Cross-Validation",
          "Independence",
          "Server independent calc vs client generatePropertyProForma",
          serverMidYearRevenue,
          clientMidYearRevenue,
          "critical"
        ));

        checks.push(check(
          `Year ${midYear + 1} (Mid-Projection) GOP (Server vs Client Engine)`,
          "Cross-Validation",
          "Independence",
          "Server independent calc vs client generatePropertyProForma",
          serverMidYearGOP,
          clientMidYearGOP,
          "critical"
        ));

        checks.push(check(
          `Year ${midYear + 1} (Mid-Projection) AGOP (Server vs Client Engine)`,
          "Cross-Validation",
          "Independence",
          "Server independent calc vs client generatePropertyProForma",
          serverMidYearAGOP,
          clientMidYearAGOP,
          "critical"
        ));

        checks.push(check(
          `Year ${midYear + 1} (Mid-Projection) NOI (Server vs Client Engine)`,
          "Cross-Validation",
          "Independence",
          "Server independent calc vs client generatePropertyProForma",
          serverMidYearNOI,
          clientMidYearNOI,
          "critical"
        ));

        checks.push(check(
          `Year ${midYear + 1} (Mid-Projection) ANOI (Server vs Client Engine)`,
          "Cross-Validation",
          "Independence",
          "Server independent calc vs client generatePropertyProForma",
          serverMidYearANOI,
          clientMidYearANOI,
          "critical"
        ));
      }

      if (clientMonthly.length >= projectionMonths && serverLastYearRevenue > 0) {
        const clientLastYear = clientMonthly.slice((projectionYears - 1) * 12, projectionMonths);
        const clientLastYearRevenue = clientLastYear.reduce((s, m) => s + m.revenueTotal, 0);
        const clientLastYearGOP = clientLastYear.reduce((s, m) => s + m.gop, 0);
        const clientLastYearAGOP = clientLastYear.reduce((s, m) => s + m.agop, 0);
        const clientLastYearNOI = clientLastYear.reduce((s, m) => s + m.noi, 0);
        const clientLastYearANOI = clientLastYear.reduce((s, m) => s + m.anoi, 0);

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
          `Year ${projectionYears} GOP (Server vs Client Engine)`,
          "Cross-Validation",
          "Independence",
          "Server independent calc vs client generatePropertyProForma",
          serverLastYearGOP,
          clientLastYearGOP,
          "critical"
        ));

        checks.push(check(
          `Year ${projectionYears} AGOP (Server vs Client Engine)`,
          "Cross-Validation",
          "Independence",
          "Server independent calc vs client generatePropertyProForma",
          serverLastYearAGOP,
          clientLastYearAGOP,
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

        checks.push(check(
          `Year ${projectionYears} ANOI (Server vs Client Engine)`,
          "Cross-Validation",
          "Independence",
          "Server independent calc vs client generatePropertyProForma",
          serverLastYearANOI,
          clientLastYearANOI,
          "critical"
        ));
      }
    }

    if (serverYear1Revenue > 0 && serverLastYearRevenue > 0) {
      const annualGrowthRate = Math.pow(serverLastYearRevenue / serverYear1Revenue, 1 / (projectionYears - 1)) - 1;
      const expectedGrowthRate = property.adrGrowthRate;

      // Only check growth rate consistency if we have more than 1 year of projection
      if (projectionYears > 1) {
        checks.push(check(
          "Revenue Growth Rate Consistency",
          "Reasonableness",
          "Industry",
          `Expected ADR growth ${(expectedGrowthRate * 100).toFixed(1)}% vs Actual Revenue CAGR ${(annualGrowthRate * 100).toFixed(1)}%`,
          expectedGrowthRate,
          annualGrowthRate,
          Math.abs(annualGrowthRate - expectedGrowthRate) > 0.2 ? "material" : "info"
        ));
      }

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

    if (property.type === "Financed" && loanAmount > 0) {
      const year1DebtService = serverYear1.reduce((s, m) => s + m.debtPayment, 0);
      const year1DSCR = year1DebtService > 0 ? serverYear1NOI / year1DebtService : 0;

      checks.push(check(
        "DSCR Reasonableness (Year 1)",
        "Debt",
        "ASC 470 / Banking",
        `Year 1 NOI $${Math.round(serverYear1NOI).toLocaleString()} / Debt Service $${Math.round(year1DebtService).toLocaleString()} (expect > 1.0x)`,
        1.0,
        year1DSCR,
        year1DSCR < 1.0 ? "critical" : "info"
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
        (noiMarginLastYear >= 5 && noiMarginLastYear <= 70) ? 1 : 0,
        (noiMarginLastYear < 5 || noiMarginLastYear > 70) ? "material" : "info"
      ));
    }

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
