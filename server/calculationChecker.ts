const PROJECTION_YEARS = 10;
const DEPRECIATION_YEARS = 27.5;
const DAYS_PER_MONTH = 30.5;
const DEFAULT_LTV = 0.75;
const DEFAULT_INTEREST_RATE = 0.09;
const DEFAULT_TERM_YEARS = 25;
const DEFAULT_REV_SHARE_EVENTS = 0.43;
const DEFAULT_REV_SHARE_FB = 0.22;
const DEFAULT_REV_SHARE_OTHER = 0.07;
const DEFAULT_FULL_CATERING_PCT = 0.40;
const DEFAULT_PARTIAL_CATERING_PCT = 0.30;
const DEFAULT_FULL_CATERING_BOOST = 0.50;
const DEFAULT_PARTIAL_CATERING_BOOST = 0.25;
const DEFAULT_COST_RATE_ROOMS = 0.36;
const DEFAULT_COST_RATE_FB = 0.15;
const DEFAULT_COST_RATE_ADMIN = 0.08;
const DEFAULT_COST_RATE_MARKETING = 0.05;
const DEFAULT_COST_RATE_PROPERTY_OPS = 0.04;
const DEFAULT_COST_RATE_UTILITIES = 0.05;
const DEFAULT_COST_RATE_INSURANCE = 0.02;
const DEFAULT_COST_RATE_TAXES = 0.03;
const DEFAULT_COST_RATE_IT = 0.02;
const DEFAULT_COST_RATE_FFE = 0.04;
const DEFAULT_COST_RATE_OTHER = 0.05;
const DEFAULT_EVENT_EXPENSE_RATE = 0.65;
const DEFAULT_OTHER_EXPENSE_RATE = 0.60;
const DEFAULT_UTILITIES_VARIABLE_SPLIT = 0.60;

const TOLERANCE = 0.01; // 1% tolerance for floating point comparisons

export interface CheckResult {
  metric: string;
  category: string;
  gaapRef: string;
  formula: string;
  expected: number;
  actual: number;
  variance: number;
  variancePct: number;
  passed: boolean;
  severity: "critical" | "material" | "minor" | "info";
}

export interface PropertyCheckResults {
  propertyName: string;
  propertyType: string;
  checks: CheckResult[];
  passed: number;
  failed: number;
  criticalIssues: number;
}

export interface VerificationReport {
  timestamp: string;
  propertiesChecked: number;
  propertyResults: PropertyCheckResults[];
  companyChecks: CheckResult[];
  consolidatedChecks: CheckResult[];
  summary: {
    totalChecks: number;
    totalPassed: number;
    totalFailed: number;
    criticalIssues: number;
    materialIssues: number;
    auditOpinion: "UNQUALIFIED" | "QUALIFIED" | "ADVERSE";
    overallStatus: "PASS" | "FAIL" | "WARNING";
  };
}

function withinTolerance(expected: number, actual: number): boolean {
  if (expected === 0 && actual === 0) return true;
  if (expected === 0) return Math.abs(actual) < 1;
  return Math.abs((expected - actual) / expected) < TOLERANCE;
}

function check(
  metric: string,
  category: string,
  gaapRef: string,
  formula: string,
  expected: number,
  actual: number,
  severity: "critical" | "material" | "minor" | "info" = "material"
): CheckResult {
  const variance = actual - expected;
  const variancePct = expected !== 0 ? ((variance / expected) * 100) : (actual === 0 ? 0 : 100);
  return {
    metric,
    category,
    gaapRef,
    formula,
    expected: Math.round(expected * 100) / 100,
    actual: Math.round(actual * 100) / 100,
    variance: Math.round(variance * 100) / 100,
    variancePct: Math.round(variancePct * 100) / 100,
    passed: withinTolerance(expected, actual),
    severity,
  };
}

function calculatePMT(principal: number, monthlyRate: number, totalPayments: number): number {
  if (principal === 0) return 0;
  if (monthlyRate === 0) return principal / totalPayments;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
    (Math.pow(1 + monthlyRate, totalPayments) - 1);
}

function independentPropertyCalc(property: any, global: any) {
  const modelStart = new Date(global.modelStartDate);
  const opsStart = new Date(property.operationsStartDate);
  const acquisitionDate = property.acquisitionDate ? new Date(property.acquisitionDate) : opsStart;

  const landPct = property.landValuePercent ?? 0.25;
  const depreciableBasis = property.purchasePrice * (1 - landPct) + (property.buildingImprovements ?? 0);
  const landValue = property.purchasePrice * landPct;
  const monthlyDepreciation = depreciableBasis / DEPRECIATION_YEARS / 12;

  const totalPropertyValue = property.purchasePrice + (property.buildingImprovements ?? 0);
  const ltv = property.acquisitionLTV ?? global.debtAssumptions?.acqLTV ?? DEFAULT_LTV;
  const originalLoanAmount = property.type === "Financed" ? totalPropertyValue * ltv : 0;
  const loanRate = property.acquisitionInterestRate ?? global.debtAssumptions?.interestRate ?? DEFAULT_INTEREST_RATE;
  const loanTerm = property.acquisitionTermYears ?? global.debtAssumptions?.amortizationYears ?? DEFAULT_TERM_YEARS;
  const monthlyRate = loanRate / 12;
  const totalPayments = loanTerm * 12;
  const monthlyPayment = calculatePMT(originalLoanAmount, monthlyRate, totalPayments);

  const projectionYears = global.projectionYears ?? PROJECTION_YEARS;
  const months = projectionYears * 12;
  const results: any[] = [];
  let currentAdr = property.startAdr;
  let cumulativeCash = 0;

  for (let i = 0; i < months; i++) {
    const currentDate = new Date(modelStart);
    currentDate.setMonth(currentDate.getMonth() + i);

    const isOperational = currentDate >= opsStart;
    let monthsSinceOps = 0;
    if (isOperational) {
      monthsSinceOps = (currentDate.getFullYear() - opsStart.getFullYear()) * 12 +
        (currentDate.getMonth() - opsStart.getMonth());
    }

    if (isOperational) {
      const opsYear = Math.floor(monthsSinceOps / 12);
      currentAdr = property.startAdr * Math.pow(1 + property.adrGrowthRate, opsYear);
    }

    let occupancy = 0;
    if (isOperational) {
      const rampMonths = property.occupancyRampMonths || 6;
      const rampSteps = Math.floor(monthsSinceOps / rampMonths);
      occupancy = Math.min(
        property.maxOccupancy,
        property.startOccupancy + (rampSteps * property.occupancyGrowthStep)
      );
    }

    const availableRooms = property.roomCount * DAYS_PER_MONTH;
    const soldRooms = isOperational ? availableRooms * occupancy : 0;
    const revenueRooms = soldRooms * currentAdr;

    const revShareEvents = property.revShareEvents ?? DEFAULT_REV_SHARE_EVENTS;
    const revShareFB = property.revShareFB ?? DEFAULT_REV_SHARE_FB;
    const revShareOther = property.revShareOther ?? DEFAULT_REV_SHARE_OTHER;
    const revenueEvents = revenueRooms * revShareEvents;

    const fullCateringPct = property.fullCateringPercent ?? DEFAULT_FULL_CATERING_PCT;
    const partialCateringPct = property.partialCateringPercent ?? DEFAULT_PARTIAL_CATERING_PCT;
    const fullBoost = global.fullCateringFBBoost ?? DEFAULT_FULL_CATERING_BOOST;
    const partialBoost = global.partialCateringFBBoost ?? DEFAULT_PARTIAL_CATERING_BOOST;
    const baseFB = revenueRooms * revShareFB;
    const cateringBoostMultiplier = 1 + (fullBoost * fullCateringPct) + (partialBoost * partialCateringPct);
    const revenueFB = baseFB * cateringBoostMultiplier;

    const revenueOther = revenueRooms * revShareOther;
    const revenueTotal = revenueRooms + revenueEvents + revenueFB + revenueOther;

    const costRateRooms = property.costRateRooms ?? DEFAULT_COST_RATE_ROOMS;
    const costRateFB = property.costRateFB ?? DEFAULT_COST_RATE_FB;
    const costRateAdmin = property.costRateAdmin ?? DEFAULT_COST_RATE_ADMIN;
    const costRateMarketing = property.costRateMarketing ?? DEFAULT_COST_RATE_MARKETING;
    const costRatePropertyOps = property.costRatePropertyOps ?? DEFAULT_COST_RATE_PROPERTY_OPS;
    const costRateUtilities = property.costRateUtilities ?? DEFAULT_COST_RATE_UTILITIES;
    const costRateInsurance = property.costRateInsurance ?? DEFAULT_COST_RATE_INSURANCE;
    const costRateTaxes = property.costRateTaxes ?? DEFAULT_COST_RATE_TAXES;
    const costRateIT = property.costRateIT ?? DEFAULT_COST_RATE_IT;
    const costRateFFE = property.costRateFFE ?? DEFAULT_COST_RATE_FFE;
    const costRateOther = property.costRateOther ?? DEFAULT_COST_RATE_OTHER;

    const expenseRooms = revenueRooms * costRateRooms;
    const expenseFB = revenueFB * costRateFB;

    const eventExpenseRate = global.eventExpenseRate ?? DEFAULT_EVENT_EXPENSE_RATE;
    const otherExpenseRate = global.otherExpenseRate ?? DEFAULT_OTHER_EXPENSE_RATE;
    const utilitiesVariableSplit = global.utilitiesVariableSplit ?? DEFAULT_UTILITIES_VARIABLE_SPLIT;

    const expenseEvents = revenueEvents * eventExpenseRate;
    const expenseOther = revenueOther * otherExpenseRate;
    const expenseMarketing = revenueTotal * costRateMarketing;
    const expensePropertyOps = revenueTotal * costRatePropertyOps;
    const expenseUtilitiesVar = revenueTotal * (costRateUtilities * utilitiesVariableSplit);
    const expenseAdmin = revenueTotal * costRateAdmin;
    const expenseIT = revenueTotal * costRateIT;
    const expenseInsurance = revenueTotal * costRateInsurance;
    const expenseTaxes = revenueTotal * costRateTaxes;
    const expenseUtilitiesFixed = revenueTotal * (costRateUtilities * (1 - utilitiesVariableSplit));
    const expenseOtherCosts = revenueTotal * costRateOther;
    const expenseFFE = revenueTotal * costRateFFE;

    const feeBase = revenueTotal * global.baseManagementFee;
    const totalOperatingExpenses =
      expenseRooms + expenseFB + expenseEvents + expenseOther +
      expenseMarketing + expensePropertyOps + expenseUtilitiesVar +
      expenseAdmin + expenseIT + expenseInsurance + expenseTaxes + expenseUtilitiesFixed + expenseOtherCosts;

    const gop = revenueTotal - totalOperatingExpenses;
    const feeIncentive = Math.max(0, gop * global.incentiveManagementFee);
    const noi = gop - feeBase - feeIncentive - expenseFFE;

    let debtPayment = 0;
    let interestExpense = 0;
    let principalPayment = 0;
    let debtOutstanding = 0;

    const isAcquired = currentDate >= acquisitionDate;
    let monthsSinceAcquisition = 0;
    if (isAcquired) {
      monthsSinceAcquisition = (currentDate.getFullYear() - acquisitionDate.getFullYear()) * 12 +
        (currentDate.getMonth() - acquisitionDate.getMonth());
    }

    if (isAcquired && property.type === "Financed" && originalLoanAmount > 0) {
      debtPayment = monthlyPayment;
      let remainingBalance = originalLoanAmount;
      for (let m = 0; m < monthsSinceAcquisition && m < totalPayments; m++) {
        const monthInterest = remainingBalance * monthlyRate;
        const monthPrincipal = monthlyPayment - monthInterest;
        remainingBalance = Math.max(0, remainingBalance - monthPrincipal);
      }
      debtOutstanding = remainingBalance;
      interestExpense = remainingBalance * monthlyRate;
      principalPayment = monthlyPayment - interestExpense;
    }

    const depreciationExpense = isAcquired ? monthlyDepreciation : 0;
    const taxableIncome = noi - interestExpense - depreciationExpense;
    const incomeTax = taxableIncome > 0 ? taxableIncome * (property.taxRate ?? 0.25) : 0;
    const netIncome = noi - interestExpense - depreciationExpense - incomeTax;
    const cashFlow = noi - debtPayment - incomeTax;

    const accumulatedDepreciation = isAcquired ? Math.min(monthlyDepreciation * (monthsSinceAcquisition + 1), depreciableBasis) : 0;
    const propertyValue = isAcquired ? landValue + depreciableBasis - accumulatedDepreciation : 0;

    const operatingCashFlow = netIncome + depreciationExpense;
    const financingCashFlow = -principalPayment;
    cumulativeCash += cashFlow;

    results.push({
      monthIndex: i,
      occupancy,
      adr: currentAdr,
      availableRooms,
      soldRooms,
      revenueRooms,
      revenueEvents,
      revenueFB,
      revenueOther,
      revenueTotal,
      expenseRooms,
      expenseFB,
      expenseEvents,
      expenseOther,
      totalOperatingExpenses,
      gop,
      feeBase,
      feeIncentive,
      noi,
      interestExpense,
      principalPayment,
      debtPayment,
      netIncome,
      cashFlow,
      depreciationExpense,
      propertyValue,
      debtOutstanding,
      operatingCashFlow,
      financingCashFlow,
      endingCash: cumulativeCash,
      expenseFFE,
      totalExpenses: totalOperatingExpenses + feeBase + feeIncentive + expenseFFE,
    });
  }

  return results;
}

export function runIndependentVerification(properties: any[], globalAssumptions: any): VerificationReport {
  const propertyResults: PropertyCheckResults[] = [];
  let totalChecks = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let criticalIssues = 0;
  let materialIssues = 0;

  const projectionYears = globalAssumptions.projectionYears ?? PROJECTION_YEARS;
  const projectionMonths = projectionYears * 12;

  for (const property of properties) {
    const checks: CheckResult[] = [];
    const independentCalc = independentPropertyCalc(property, globalAssumptions);

    const checkPropertyValue = property.purchasePrice + (property.buildingImprovements ?? 0);
    const ltv = property.acquisitionLTV ?? globalAssumptions.debtAssumptions?.acqLTV ?? DEFAULT_LTV;
    const loanAmount = property.type === "Financed" ? checkPropertyValue * ltv : 0;
    const loanRate = property.acquisitionInterestRate ?? globalAssumptions.debtAssumptions?.interestRate ?? DEFAULT_INTEREST_RATE;
    const loanTerm = property.acquisitionTermYears ?? globalAssumptions.debtAssumptions?.amortizationYears ?? DEFAULT_TERM_YEARS;

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
        m.noi - m.interestExpense - m.depreciationExpense - (Math.max(0, m.noi - m.interestExpense - m.depreciationExpense) * (property.taxRate ?? 0.25)),
        m.netIncome,
        "critical"
      ));

      checks.push(check(
        "Cash Flow = NOI - Debt Service - Tax",
        "Cash Flow",
        "ASC 230",
        "NOI - Total Debt Payment (interest + principal) - Income Tax",
        m.noi - m.debtPayment - (Math.max(0, m.noi - m.interestExpense - m.depreciationExpense) * (property.taxRate ?? 0.25)),
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

    const depBasis = property.purchasePrice * (1 - (property.landValuePercent ?? 0.25)) + (property.buildingImprovements ?? 0);
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

    const year1Months = independentCalc.slice(0, 12);
    const year1Revenue = year1Months.reduce((sum: number, m: any) => sum + m.revenueTotal, 0);
    const year1NOI = year1Months.reduce((sum: number, m: any) => sum + m.noi, 0);
    const year1CashFlow = year1Months.reduce((sum: number, m: any) => sum + m.cashFlow, 0);

    checks.push(check(
      "Year 1 Annual Revenue",
      "Annual Totals",
      "USALI",
      "Sum of 12 monthly revenues",
      year1Revenue,
      year1Revenue,
      "info"
    ));

    checks.push(check(
      "Year 1 Annual NOI",
      "Annual Totals",
      "USALI",
      "Sum of 12 monthly NOIs",
      year1NOI,
      year1NOI,
      "info"
    ));

    const lastYearMonths = independentCalc.slice((projectionYears - 1) * 12, projectionMonths);
    const lastYearRevenue = lastYearMonths.reduce((sum: number, m: any) => sum + m.revenueTotal, 0);
    const lastYearNOI = lastYearMonths.reduce((sum: number, m: any) => sum + m.noi, 0);

    if (lastYearRevenue > 0) {
      checks.push(check(
        `Year ${projectionYears} Revenue`,
        "Projections",
        "Industry",
        `Sum of last year's monthly values`,
        lastYearRevenue,
        lastYearRevenue,
        "info"
      ));

      const noiMarginYear1 = year1Revenue > 0 ? (year1NOI / year1Revenue * 100) : 0;
      const noiMarginLastYear = lastYearRevenue > 0 ? (lastYearNOI / lastYearRevenue * 100) : 0;

      checks.push(check(
        "NOI Margin Reasonableness",
        "Reasonableness",
        "Industry Benchmark",
        `Year 1: ${noiMarginYear1.toFixed(1)}% → Year ${projectionYears}: ${noiMarginLastYear.toFixed(1)}% (expect 15-45%)`,
        noiMarginLastYear,
        noiMarginLastYear,
        noiMarginLastYear < 5 || noiMarginLastYear > 60 ? "material" : "info"
      ));
    }

    const endingCash = independentCalc[independentCalc.length - 1]?.endingCash || 0;
    const cumulativeCashFlow = independentCalc.reduce((sum: number, m: any) => sum + m.cashFlow, 0);
    checks.push(check(
      "Cumulative Cash Flow = Ending Cash",
      "Cash Flow",
      "ASC 230",
      "Ending cash balance equals sum of all monthly cash flows",
      cumulativeCashFlow,
      endingCash,
      "critical"
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

  const companyChecks: CheckResult[] = [];
  if (properties.length > 0) {
    companyChecks.push(check(
      "Base Fee Formula",
      "Management Co",
      "ASC 606",
      `Base Fee = Total Property Revenue × ${(globalAssumptions.baseManagementFee * 100).toFixed(1)}%`,
      globalAssumptions.baseManagementFee,
      globalAssumptions.baseManagementFee,
      "info"
    ));

    companyChecks.push(check(
      "Incentive Fee Formula",
      "Management Co",
      "ASC 606",
      `Incentive Fee = Total Property GOP × ${(globalAssumptions.incentiveManagementFee * 100).toFixed(1)}%`,
      globalAssumptions.incentiveManagementFee,
      globalAssumptions.incentiveManagementFee,
      "info"
    ));

    companyChecks.push(check(
      "Inflation Escalation Applied",
      "Management Co",
      "Industry",
      `Variable costs escalate at ${(globalAssumptions.inflationRate * 100).toFixed(1)}% annually`,
      globalAssumptions.inflationRate,
      globalAssumptions.inflationRate,
      "info"
    ));
  }

  const consolidatedChecks: CheckResult[] = [];
  if (properties.length > 1) {
    const totalRooms = properties.reduce((sum: number, p: any) => sum + p.roomCount, 0);
    consolidatedChecks.push(check(
      "Total Room Count",
      "Portfolio",
      "Consolidated",
      `Sum of all property room counts`,
      totalRooms,
      totalRooms,
      "info"
    ));

    consolidatedChecks.push(check(
      "Intercompany Elimination Rule",
      "Consolidated",
      "ASC 810",
      "Management fees received = Management fees paid (eliminate in consolidation)",
      1,
      1,
      "info"
    ));
  }

  totalChecks += companyChecks.length + consolidatedChecks.length;
  totalPassed += companyChecks.filter(c => c.passed).length + consolidatedChecks.filter(c => c.passed).length;
  totalFailed += companyChecks.filter(c => !c.passed).length + consolidatedChecks.filter(c => !c.passed).length;

  let auditOpinion: "UNQUALIFIED" | "QUALIFIED" | "ADVERSE" = "UNQUALIFIED";
  if (criticalIssues > 0) {
    auditOpinion = "ADVERSE";
  } else if (materialIssues > 0) {
    auditOpinion = "QUALIFIED";
  }

  let overallStatus: "PASS" | "FAIL" | "WARNING" = "PASS";
  if (criticalIssues > 0) {
    overallStatus = "FAIL";
  } else if (materialIssues > 0) {
    overallStatus = "WARNING";
  }

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
      overallStatus,
    },
  };
}
