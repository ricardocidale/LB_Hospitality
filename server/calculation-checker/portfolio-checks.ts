import {
  DEFAULT_BASE_MANAGEMENT_FEE_RATE,
  DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,
  DEFAULT_COMPANY_INFLATION_RATE,
  STAFFING_TIERS,
  DEFAULT_SAFE_TRANCHE,
  MONTHS_PER_YEAR,
} from "@shared/constants";
import type { CheckResult, CheckerProperty, CheckerGlobalAssumptions, EngineMonthlyResult, ClientPropertyMonthly } from "./types";
import { check } from "./gaap-checks";
import {
  parseYearMonth,
  addMonthsYM,
  ymNotBefore,
  diffMonthsYM,
} from "./property-checks";
import { sumServerPortfolioTotals, sumClientPortfolioTotals } from "./helpers";
import { checkFeeZeroSum } from "../../calc/validation/data-integrity";

export function runCompanyChecks(
  properties: CheckerProperty[],
  allEngineCalcs: EngineMonthlyResult[][],
  globalAssumptions: CheckerGlobalAssumptions,
  projectionMonths: number,
  clientResults?: ClientPropertyMonthly[][]
): CheckResult[] {
  const companyChecks: CheckResult[] = [];
  if (properties.length === 0) return companyChecks;

  const { revenue: serverTotalRevenue, feeBase: serverTotalFeeBase, feeIncentive: serverTotalFeeIncentive } =
    sumServerPortfolioTotals(allEngineCalcs);

  let expectedBaseFee = 0;
  let expectedIncentiveFee = 0;
  for (let pi = 0; pi < properties.length; pi++) {
    const propBaseRate = properties[pi].baseManagementFeeRate ?? DEFAULT_BASE_MANAGEMENT_FEE_RATE;
    const propIncRate = properties[pi].incentiveManagementFeeRate ?? DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE;
    for (const m of allEngineCalcs[pi] ?? []) {
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

  let totalPropertyFeesPaid = 0;
  for (const calc of allEngineCalcs) {
    for (const m of calc ?? []) {
      totalPropertyFeesPaid += m.feeBase + m.feeIncentive;
    }
  }

  let companyFeesReceivable = 0;
  for (let pi = 0; pi < properties.length; pi++) {
    const propBaseRate = properties[pi].baseManagementFeeRate ?? DEFAULT_BASE_MANAGEMENT_FEE_RATE;
    const propIncRate = properties[pi].incentiveManagementFeeRate ?? DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE;
    for (const m of allEngineCalcs[pi] ?? []) {
      companyFeesReceivable += m.revenueTotal * propBaseRate;
      companyFeesReceivable += (m.gop > 0 ? m.gop : 0) * propIncRate;
    }
  }

  const feeZeroSum = checkFeeZeroSum({
    propertyFeesPaid: totalPropertyFeesPaid,
    companyFeesReceived: companyFeesReceivable,
    rounding_policy: { precision: 2, bankers_rounding: false },
  });
  companyChecks.push(check(
    "Fee Zero-Sum (Intercompany Elimination)",
    "Consolidated",
    "ASC 810",
    `Management fees paid by properties = fees receivable by management company; diff = $${feeZeroSum.difference}`,
    companyFeesReceivable,
    totalPropertyFeesPaid,
    "critical"
  ));

  if (clientResults && clientResults.length === properties.length) {
    const { revenue: clientTotalRevenue, feeBase: clientTotalFeeBase, feeIncentive: clientTotalFeeIncentive } =
      sumClientPortfolioTotals(clientResults);

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
    for (const propCalc of allEngineCalcs) {
      if (propCalc && cm < propCalc.length) {
        monthlyFeeBase += propCalc[cm].feeBase;
        monthlyFeeIncentive += propCalc[cm].feeIncentive;
      }
    }
    const companyRevenue = monthlyFeeBase + monthlyFeeIncentive;

    let safeFunding = 0;
    if (currentYM.year === tranche1YM.year && currentYM.month === tranche1YM.month) {
      safeFunding += globalAssumptions.safeTranche1Amount ?? DEFAULT_SAFE_TRANCHE;
    }
    if (tranche2YM && currentYM.year === tranche2YM.year && currentYM.month === tranche2YM.month) {
      safeFunding += globalAssumptions.safeTranche2Amount ?? DEFAULT_SAFE_TRANCHE;
    }

    let companyExpenses = 0;
    if (hasStartedOps) {
      const monthsSinceOps = diffMonthsYM(currentYM, opsStartYM);
      const companyOpsYear = Math.floor(monthsSinceOps / MONTHS_PER_YEAR);
      const companyInflation = globalAssumptions.companyInflationRate ?? globalAssumptions.inflationRate ?? DEFAULT_COMPANY_INFLATION_RATE;
      const fixedEscRate = globalAssumptions.fixedCostEscalationRate ?? companyInflation;
      const fixedFactor = Math.pow(1 + fixedEscRate, companyOpsYear);

      const partnerCompByYear = [
        globalAssumptions.partnerCompYear1,
        globalAssumptions.partnerCompYear2,
        globalAssumptions.partnerCompYear3,
        globalAssumptions.partnerCompYear4,
        globalAssumptions.partnerCompYear5,
        globalAssumptions.partnerCompYear6,
        globalAssumptions.partnerCompYear7,
        globalAssumptions.partnerCompYear8,
        globalAssumptions.partnerCompYear9,
        globalAssumptions.partnerCompYear10,
      ];
      const modelYear = Math.floor(cm / MONTHS_PER_YEAR);
      const yrIdx = Math.min(modelYear, 9);
      const partnerComp = ((partnerCompByYear[yrIdx] ?? 0) / MONTHS_PER_YEAR);

      const staffSalary = globalAssumptions.staffSalary ?? 0;
      const tier1Max = globalAssumptions.staffTier1MaxProperties ?? STAFFING_TIERS[0].maxProperties;
      const tier2Max = globalAssumptions.staffTier2MaxProperties ?? STAFFING_TIERS[1].maxProperties;
      const tier1Fte = globalAssumptions.staffTier1Fte ?? STAFFING_TIERS[0].fte;
      const tier2Fte = globalAssumptions.staffTier2Fte ?? STAFFING_TIERS[1].fte;
      const tier3Fte = globalAssumptions.staffTier3Fte ?? STAFFING_TIERS[2].fte;
      const activePropertyCount = properties.length;
      const staffFTE = activePropertyCount <= tier1Max ? tier1Fte
        : activePropertyCount <= tier2Max ? tier2Fte
        : tier3Fte;
      const staffComp = (staffFTE * staffSalary * fixedFactor) / MONTHS_PER_YEAR;

      const officeLease = ((globalAssumptions.officeLeaseStart ?? 0) * fixedFactor) / MONTHS_PER_YEAR;
      const profServices = ((globalAssumptions.professionalServicesStart ?? 0) * fixedFactor) / MONTHS_PER_YEAR;
      const tech = ((globalAssumptions.techInfraStart ?? 0) * fixedFactor) / MONTHS_PER_YEAR;

      companyExpenses = partnerComp + staffComp + officeLease + profServices + tech;
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
  properties: CheckerProperty[],
  allEngineCalcs: EngineMonthlyResult[][],
  globalAssumptions: CheckerGlobalAssumptions,
  clientResults?: ClientPropertyMonthly[][]
): CheckResult[] {
  const consolidatedChecks: CheckResult[] = [];
  if (properties.length <= 1) return consolidatedChecks;

  const actualYear1RoomRevenue = allEngineCalcs.reduce(
    (s, calc) => s + (calc ?? []).slice(0, MONTHS_PER_YEAR).reduce((s2, m) => s2 + m.revenueRooms, 0), 0
  );

  let directYear1RoomRevenue = 0;
  for (let pi = 0; pi < properties.length; pi++) {
    const calc = allEngineCalcs[pi] ?? [];
    const opMonths = calc.slice(0, MONTHS_PER_YEAR).filter((m) => m.revenueRooms > 0);
    directYear1RoomRevenue += opMonths.reduce((s, m) => s + m.revenueRooms, 0);
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

  if (clientResults && clientResults.length === properties.length) {
    const { revenue: serverPortfolioRevenue } = sumServerPortfolioTotals(allEngineCalcs);
    const { revenue: clientPortfolioRevenue } = sumClientPortfolioTotals(clientResults);

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
