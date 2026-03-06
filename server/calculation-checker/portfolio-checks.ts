import {
  DEFAULT_BASE_MANAGEMENT_FEE_RATE,
  DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,
} from "@shared/constants";
import { CheckResult, YearMonth } from "./types";
import { check } from "./gaap-checks";
import {
  parseYearMonth,
  addMonthsYM,
  ymNotBefore,
  diffMonthsYM,
} from "./property-checks";

export function runCompanyChecks(
  properties: any[],
  allIndependentCalcs: any[][],
  globalAssumptions: any,
  projectionMonths: number,
  clientResults?: any[][]
): CheckResult[] {
  const companyChecks: CheckResult[] = [];
  if (properties.length === 0) return companyChecks;

  let serverTotalRevenue = 0;
  let serverTotalFeeBase = 0;
  let serverTotalFeeIncentive = 0;

  for (const propCalc of allIndependentCalcs) {
    for (const m of propCalc) {
      serverTotalRevenue += m.revenueTotal;
      serverTotalFeeBase += m.feeBase;
      serverTotalFeeIncentive += m.feeIncentive;
    }
  }

  let expectedBaseFee = 0;
  let expectedIncentiveFee = 0;
  for (let pi = 0; pi < properties.length; pi++) {
    const propBaseRate = properties[pi].baseManagementFeeRate ?? DEFAULT_BASE_MANAGEMENT_FEE_RATE;
    const propIncRate = properties[pi].incentiveManagementFeeRate ?? DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE;
    for (const m of allIndependentCalcs[pi]) {
      expectedBaseFee += m.revenueTotal * propBaseRate;
      expectedIncentiveFee += (m.gop > 0 ? m.gop : 0) * propIncRate;
    }
  }

  companyChecks.push(check(
    "Base Fee Applied at Stated Rate",
    "Management Co",
    "ASC 606",
    `Σ monthly base fees = Σ per-property (monthly revenue × property base rate)`,
    expectedBaseFee,
    serverTotalFeeBase,
    "critical"
  ));

  companyChecks.push(check(
    "Incentive Fee Applied at Stated Rate",
    "Management Co",
    "ASC 606",
    `Σ monthly incentive fees = Σ per-property (monthly positive GOP × property incentive rate)`,
    expectedIncentiveFee,
    serverTotalFeeIncentive,
    "critical"
  ));

  if (clientResults && clientResults.length === properties.length) {
    let clientTotalRevenue = 0;
    let clientTotalFeeBase = 0;
    let clientTotalFeeIncentive = 0;
    for (const propMonthly of clientResults) {
      for (const m of propMonthly) {
        clientTotalRevenue += m.revenueTotal;
        clientTotalFeeBase += m.feeBase;
        clientTotalFeeIncentive += m.feeIncentive;
      }
    }

    companyChecks.push(check(
      "Portfolio Revenue (Server vs Client Engine)",
      "Cross-Validation",
      "Independence",
      "Total revenue across all properties and all months",
      serverTotalRevenue,
      clientTotalRevenue,
      "critical"
    ));

    companyChecks.push(check(
      "Portfolio Base Fees (Server vs Client Engine)",
      "Cross-Validation",
      "Independence",
      "Total base management fees across all properties",
      serverTotalFeeBase,
      clientTotalFeeBase,
      "critical"
    ));

    companyChecks.push(check(
      "Portfolio Incentive Fees (Server vs Client Engine)",
      "Cross-Validation",
      "Independence",
      "Total incentive management fees across all properties",
      serverTotalFeeIncentive,
      clientTotalFeeIncentive,
      "critical"
    ));
  }

  // Management Company Negative Cash Balance check
  const modelStartYM = parseYearMonth(globalAssumptions.modelStartDate);
  const tranche1YM = globalAssumptions.safeTranche1Date
    ? parseYearMonth(globalAssumptions.safeTranche1Date)
    : modelStartYM;
  const tranche2YM = globalAssumptions.safeTranche2Date
    ? parseYearMonth(globalAssumptions.safeTranche2Date)
    : null;
  const opsStartYM = globalAssumptions.companyOpsStartDate
    ? parseYearMonth(globalAssumptions.companyOpsStartDate)
    : modelStartYM;

  let companyCumCash = 0;
  let companyShortfallMonths = 0;
  let companyMinCash = Infinity;

  for (let cm = 0; cm < projectionMonths; cm++) {
    const currentYM = addMonthsYM(modelStartYM, cm);
    const hasStartedOps = ymNotBefore(currentYM, opsStartYM) && ymNotBefore(currentYM, tranche1YM);

    let monthlyFeeBase = 0;
    let monthlyFeeIncentive = 0;
    for (const propCalc of allIndependentCalcs) {
      if (cm < propCalc.length) {
        monthlyFeeBase += propCalc[cm].feeBase;
        monthlyFeeIncentive += propCalc[cm].feeIncentive;
      }
    }
    const companyRevenue = monthlyFeeBase + monthlyFeeIncentive;

    let safeFunding = 0;
    if (currentYM.year === tranche1YM.year && currentYM.month === tranche1YM.month) {
      safeFunding += globalAssumptions.safeTranche1Amount ?? 500_000;
    }
    if (tranche2YM && currentYM.year === tranche2YM.year && currentYM.month === tranche2YM.month) {
      safeFunding += globalAssumptions.safeTranche2Amount ?? 500_000;
    }

    let companyExpenses = 0;
    if (hasStartedOps) {
      const monthsSinceOps = diffMonthsYM(currentYM, opsStartYM);
      const companyOpsYear = Math.floor(monthsSinceOps / 12);
      const fixedEscRate = globalAssumptions.fixedCostEscalationRate ?? globalAssumptions.inflationRate ?? 0.03;
      const fixedFactor = Math.pow(1 + fixedEscRate, companyOpsYear);

      const partnerCompKeys = [
        'partnerCompYear1', 'partnerCompYear2', 'partnerCompYear3',
        'partnerCompYear4', 'partnerCompYear5', 'partnerCompYear6',
        'partnerCompYear7', 'partnerCompYear8', 'partnerCompYear9',
        'partnerCompYear10',
      ] as const;
      const modelYear = Math.floor(cm / 12);
      const yrIdx = Math.min(modelYear, 9);
      const partnerComp = ((globalAssumptions as any)[partnerCompKeys[yrIdx]] ?? 0) / 12;

      const staffSalary = globalAssumptions.staffSalary ?? 0;
      const staffFTE = globalAssumptions.staffTier1Fte ?? 1;
      const staffComp = (staffFTE * staffSalary * fixedFactor) / 12;

      const officeLease = ((globalAssumptions.officeLeaseStart ?? 0) * fixedFactor) / 12;
      const profServices = ((globalAssumptions.professionalServicesStart ?? 0) * fixedFactor) / 12;
      const tech = ((globalAssumptions.techInfraStart ?? 0) * fixedFactor) / 12;
      const insurance = ((globalAssumptions.businessInsuranceStart ?? 0) * fixedFactor) / 12;

      companyExpenses = partnerComp + staffComp + officeLease + profServices + tech + insurance;
    }

    const companyCashFlow = companyRevenue - companyExpenses + safeFunding;
    companyCumCash += companyCashFlow;
    if (companyCumCash < companyMinCash) companyMinCash = companyCumCash;
    if (companyCumCash < 0) companyShortfallMonths++;
  }

  if (companyMinCash === Infinity) companyMinCash = 0;

  companyChecks.push(check(
    "No Negative Cash Balance",
    "Management Co",
    "Business Rule",
    `[Management Company] Cash balance must never go negative; min balance = $${Math.round(companyMinCash).toLocaleString()}, shortfall months = ${companyShortfallMonths}`,
    0,
    companyShortfallMonths,
    "info"
  ));

  return companyChecks;
}

export function runConsolidatedChecks(
  properties: any[],
  allIndependentCalcs: any[][],
  globalAssumptions: any,
  clientResults?: any[][]
): CheckResult[] {
  const consolidatedChecks: CheckResult[] = [];
  if (properties.length <= 1) return consolidatedChecks;

  const actualYear1RoomRevenue = allIndependentCalcs.reduce(
    (s: number, calc: any[]) => s + calc.slice(0, 12).reduce((s2: number, m: any) => s2 + m.revenueRooms, 0), 0
  );

  let directYear1RoomRevenue = 0;
  for (let pi = 0; pi < properties.length; pi++) {
    const calc = allIndependentCalcs[pi];
    const opMonths = calc.slice(0, 12).filter((m: any) => m.revenueRooms > 0);
    directYear1RoomRevenue += opMonths.reduce((s: number, m: any) => s + m.revenueRooms, 0);
  }

  consolidatedChecks.push(check(
    "Portfolio Room Revenue Aggregation",
    "Consolidated",
    "ASC 810",
    "Sum of individual property room revenues = portfolio room revenue total",
    directYear1RoomRevenue,
    actualYear1RoomRevenue,
    "critical"
  ));

  let totalPropertyFeesPaid = 0;
  for (const calc of allIndependentCalcs) {
    for (const m of calc) {
      totalPropertyFeesPaid += m.feeBase + m.feeIncentive;
    }
  }

  let companyFeesReceivable = 0;
  for (let pi = 0; pi < properties.length; pi++) {
    const propBaseRate = properties[pi].baseManagementFeeRate ?? DEFAULT_BASE_MANAGEMENT_FEE_RATE;
    const propIncRate = properties[pi].incentiveManagementFeeRate ?? DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE;
    for (const m of allIndependentCalcs[pi]) {
      companyFeesReceivable += m.revenueTotal * propBaseRate;
      companyFeesReceivable += (m.gop > 0 ? m.gop : 0) * propIncRate;
    }
  }

  consolidatedChecks.push(check(
    "Intercompany Fee Elimination",
    "Consolidated",
    "ASC 810",
    "Management fees paid by properties = fees receivable by management company",
    companyFeesReceivable,
    totalPropertyFeesPaid,
    "critical"
  ));

  if (clientResults && clientResults.length === properties.length) {
    let serverPortfolioRevenue = 0;
    for (const propCalc of allIndependentCalcs) {
      for (const m of propCalc) {
        serverPortfolioRevenue += m.revenueTotal;
      }
    }

    let clientPortfolioRevenue = 0;
    for (const propMonthly of clientResults) {
      for (const m of propMonthly) {
        clientPortfolioRevenue += m.revenueTotal;
      }
    }

    consolidatedChecks.push(check(
      "Consolidated Revenue (Server vs Client Engine)",
      "Cross-Validation",
      "Independence",
      "Portfolio-wide revenue total across all properties and months",
      serverPortfolioRevenue,
      clientPortfolioRevenue,
      "critical"
    ));
  }

  return consolidatedChecks;
}
