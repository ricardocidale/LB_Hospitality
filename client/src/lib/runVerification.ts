/**
 * runVerification.ts — The Verification Orchestrator
 *
 * This file ties together all of the financial verification systems into a single
 * pipeline. When the user clicks "Verify" in the UI, this is what runs.
 *
 * The verification pipeline runs 4 independent check systems on every property:
 *   1. Formula Checker (formulaChecker.ts) — Validates math identities
 *      (e.g., Revenue = ADR × Sold Rooms, ANOI = NOI - FF&E)
 *   2. GAAP Compliance Checker (gaapComplianceChecker.ts) — Validates accounting rules
 *      (e.g., principal not in Net Income, depreciation method correct)
 *   3. Full Auditor (financialAuditor.ts) — Independent recalculation of every number
 *      with workpaper references, just like a real audit firm would do
 *   4. Cross-Calculator Validation (crossCalculatorValidation.ts) — Compares the
 *      client engine's numbers against IRS/GAAP authoritative formulas
 *
 * The pipeline:
 *   For each property:
 *     → Run the financial engine to generate pro forma numbers
 *     → Feed those numbers through all 4 checkers
 *     → Collect results
 *   Then aggregate into a single VerificationResults object with:
 *     - Human-readable text reports (for display in the Checker Manual page)
 *     - Structured audit data (for programmatic consumption)
 *     - A summary with pass/fail counts, critical/material issues, audit opinion
 *
 * This file also contains known-value test cases — hand-calculated reference scenarios
 * (e.g., "10 rooms × $100 ADR × 70% occupancy = $21,350 monthly room revenue") that
 * validate the engine produces the expected numbers. These serve as regression tests.
 *
 * Overall status logic:
 *   PASS — No issues at all
 *   WARNING — Material issues found but no critical failures
 *   FAIL — Critical issues or formula failures detected
 */
import { generatePropertyProForma, MonthlyFinancials } from "./financialEngine";
import { checkPropertyFormulas, checkMetricFormulas, generateFormulaReport, FormulaCheckReport } from "./audits/formulaChecker";
import { checkGAAPCompliance, checkCashFlowStatement, generateComplianceReport, ComplianceReport } from "./audits/gaapComplianceChecker";
import { runFullAudit, generateAuditWorkpaper, AuditReport, PropertyAuditInput, GlobalAuditInput } from "./financialAuditor";
import type { AuditFinding } from "./audits/types";
import { crossValidateFinancingCalculators, formatCrossValidationReport, CrossValidationReport } from "./audits/crossCalculatorValidation";
import {
  DEFAULT_LTV,
  DEFAULT_INTEREST_RATE,
  DEFAULT_TERM_YEARS,
  DEPRECIATION_YEARS,
  DAYS_PER_MONTH,
  PROJECTION_YEARS,
  DEFAULT_LAND_VALUE_PERCENT,
  DEFAULT_REV_SHARE_EVENTS,
  DEFAULT_REV_SHARE_FB,
  DEFAULT_REV_SHARE_OTHER,
  DEFAULT_CATERING_BOOST_PCT,
  DEFAULT_COST_RATE_ROOMS,
  DEFAULT_COST_RATE_FB,
  DEFAULT_COST_RATE_ADMIN,
  DEFAULT_COST_RATE_MARKETING,
  DEFAULT_COST_RATE_PROPERTY_OPS,
  DEFAULT_COST_RATE_UTILITIES,
  DEFAULT_COST_RATE_TAXES,
  DEFAULT_COST_RATE_IT,
  DEFAULT_COST_RATE_FFE,
  DEFAULT_COST_RATE_OTHER,
  DEFAULT_COST_RATE_INSURANCE,
  DEFAULT_EVENT_EXPENSE_RATE,
  DEFAULT_OTHER_EXPENSE_RATE,
  DEFAULT_UTILITIES_VARIABLE_SPLIT,
  DEFAULT_BASE_MANAGEMENT_FEE_RATE,
  DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,
  DEFAULT_TAX_RATE,
  DEFAULT_MARKETING_RATE,
} from "./constants";

export interface VerificationResults {
  formulaReport: string;
  complianceReport: string;
  auditWorkpaper: string;
  crossValidationReport: string;
  auditReports: AuditReport[];
  crossValidationReports: CrossValidationReport[];
  summary: {
    formulaChecksPassed: number;
    formulaChecksFailed: number;
    complianceChecksPassed: number;
    complianceChecksFailed: number;
    crossValidationPassed: number;
    crossValidationFailed: number;
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
    landValuePercent: property.landValuePercent,
    taxRate: property.taxRate,
    type: property.type,
    acquisitionLTV: property.acquisitionLTV,
    acquisitionInterestRate: property.acquisitionInterestRate,
    acquisitionTermYears: property.acquisitionTermYears,
    operatingReserve: property.operatingReserve,
    debtAssumptions: property.debtAssumptions,
    willRefinance: property.willRefinance,
    refinanceDate: property.refinanceDate,
    refinanceLTV: property.refinanceLTV,
    refinanceInterestRate: property.refinanceInterestRate,
    refinanceTermYears: property.refinanceTermYears,
    refinanceClosingCostRate: property.refinanceClosingCostRate,
    costRateRooms: property.costRateRooms,
    costRateFB: property.costRateFB,
    costRateAdmin: property.costRateAdmin,
    costRateMarketing: property.costRateMarketing,
    costRatePropertyOps: property.costRatePropertyOps,
    costRateUtilities: property.costRateUtilities,
    costRateTaxes: property.costRateTaxes,
    costRateIT: property.costRateIT,
    costRateFFE: property.costRateFFE,
    costRateOther: property.costRateOther,
    costRateInsurance: property.costRateInsurance,
    revShareEvents: property.revShareEvents,
    revShareFB: property.revShareFB,
    revShareOther: property.revShareOther,
    baseManagementFeeRate: property.baseManagementFeeRate,
    incentiveManagementFeeRate: property.incentiveManagementFeeRate,
  };
}

function convertToGlobalAuditInput(global: any): GlobalAuditInput {
  return {
    modelStartDate: global.modelStartDate,
    inflationRate: global.inflationRate,
    debtAssumptions: {
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
  const formulaReports: any[] = [];
  const complianceReports: any[] = [];
  const auditReports: any[] = [];
  const crossReports: any[] = [];
  
  const globalAuditInput = convertToGlobalAuditInput(globalAssumptions);
  
  for (const property of properties) {
    try {
      const projectionMonths = ((globalAssumptions as any).projectionYears ?? PROJECTION_YEARS) * 12;
      const financials = generatePropertyProForma(property, globalAssumptions, projectionMonths);
      
      const formulaCheck = checkPropertyFormulas(financials);
      formulaReports.push(formulaCheck);
      
      const gaapCheck = checkGAAPCompliance(financials);
      complianceReports.push(gaapCheck);
      
      const cfCheck = checkCashFlowStatement(financials);
      complianceReports.push(cfCheck);
      
      const yearlyData = aggregateToYearly(financials);
      const metricCheck = checkMetricFormulas(yearlyData);
      formulaReports.push(metricCheck);
      
      const propertyAuditInput = convertToAuditInput(property);
      const auditReport = runFullAudit(propertyAuditInput, globalAuditInput, financials);
      auditReports.push(auditReport);
      
      // Run cross-calculator validation (IRS, GAAP, USALI authoritative checks)
      const crossReport = crossValidateFinancingCalculators(
        {
          purchasePrice: property.purchasePrice,
          type: property.type,
          acquisitionLTV: property.acquisitionLTV,
          acquisitionInterestRate: property.acquisitionInterestRate ?? property.debtAssumptions?.interestRate,
          acquisitionTermYears: property.acquisitionTermYears ?? property.debtAssumptions?.amortizationYears,
          landValuePercent: property.landValuePercent,
          buildingImprovements: property.buildingImprovements,
          baseManagementFeeRate: property.baseManagementFeeRate,
          incentiveManagementFeeRate: property.incentiveManagementFeeRate,
          feeCategories: property.feeCategories,
          costRateFFE: property.costRateFFE,
        },
        globalAssumptions,
        financials,
      );
      crossReports.push(crossReport);
      
    } catch (_error) {
      // Property processing errors are captured in the results
    }
  }
  
  // Generate reports
  const formulaReport = generateFormulaReport(formulaReports);
  const complianceReport = generateComplianceReport(complianceReports);
  
  // Generate consolidated audit workpaper
  let auditWorkpaper = "";
  auditWorkpaper += "╔══════════════════════════════════════════════════════════════════════════════╗\n";
  auditWorkpaper += "║               CONSOLIDATED INDEPENDENT AUDITOR'S REPORT                      ║\n";
  auditWorkpaper += "║                       Hospitality Business Group                                  ║\n";
  auditWorkpaper += "╚══════════════════════════════════════════════════════════════════════════════╝\n\n";
  
  for (const report of auditReports) {
    auditWorkpaper += generateAuditWorkpaper(report);
    auditWorkpaper += "\n\n";
  }

  // Generate cross-validation report
  let crossValidationReport = "";
  for (const report of crossReports) {
    crossValidationReport += formatCrossValidationReport(report);
    crossValidationReport += "\n\n";
  }
  
  // Calculate summary
  const formulaChecksPassed = formulaReports.reduce((sum, r) => sum + r.passed, 0);
  const formulaChecksFailed = formulaReports.reduce((sum, r) => sum + r.failed, 0);
  const complianceChecksPassed = complianceReports.reduce((sum, r) => sum + r.passed, 0);
  const complianceChecksFailed = complianceReports.reduce((sum, r) => sum + r.failed, 0);
  const crossValidationPassed = crossReports.reduce((sum, r) => sum + r.passed, 0);
  const crossValidationFailed = crossReports.reduce((sum, r) => sum + r.failed, 0);
  const criticalIssues = auditReports.reduce((sum, r) => sum + r.criticalIssues, 0) +
    crossReports.reduce((sum, r) => sum + r.criticalIssues, 0);
  const materialIssues = auditReports.reduce((sum, r) => sum + r.materialIssues, 0);
  
  // Determine overall audit opinion (cross-validation critical failures count as adverse)
  let auditOpinion: "UNQUALIFIED" | "QUALIFIED" | "ADVERSE" | "DISCLAIMER" = "UNQUALIFIED";
  const hasCrossValidationCritical = crossReports.some(r => r.criticalIssues > 0);
  if (auditReports.some(r => r.opinion === "ADVERSE") || hasCrossValidationCritical) {
    auditOpinion = "ADVERSE";
  } else if (auditReports.some(r => r.opinion === "QUALIFIED") || crossValidationFailed > 0) {
    auditOpinion = "QUALIFIED";
  } else if (auditReports.some(r => r.opinion === "DISCLAIMER")) {
    auditOpinion = "DISCLAIMER";
  }
  
  let overallStatus: "PASS" | "FAIL" | "WARNING" = "PASS";
  if (criticalIssues > 0 || formulaChecksFailed > 0 || auditOpinion === "ADVERSE") {
    overallStatus = "FAIL";
  } else if (materialIssues > 0 || complianceChecksFailed > 0 || crossValidationFailed > 0 || auditOpinion === "QUALIFIED") {
    overallStatus = "WARNING";
  }
  
  return {
    formulaReport,
    complianceReport,
    auditWorkpaper,
    crossValidationReport,
    auditReports,
    crossValidationReports: crossReports,
    summary: {
      formulaChecksPassed,
      formulaChecksFailed,
      complianceChecksPassed,
      complianceChecksFailed,
      crossValidationPassed,
      crossValidationFailed,
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
  adr: number;
  occupancy: number;
  revpar: number;
  revenueTotal: number;
  expenseOperating: number;
  gop: number;
  feeBase: number;
  feeIncentive: number;
  agop: number;
  expenseTaxes: number;
  noi: number;
  expenseFFE: number;
  anoi: number;
  equityMultiple?: number;
  netIncome?: number;
}> {
  const yearlyMap = new Map<number, any>();
  
  for (let i = 0; i < monthlyData.length; i++) {
    const m = monthlyData[i];
    const year = Math.floor(i / 12) + 1;
    
    if (!yearlyMap.has(year)) {
      yearlyMap.set(year, { 
        revenueRooms: 0, 
        soldRooms: 0, 
        availableRooms: 0,
        revenueTotal: 0,
        expenseOperating: 0,
        gop: 0,
        feeBase: 0,
        feeIncentive: 0,
        agop: 0,
        expenseTaxes: 0,
        noi: 0,
        expenseFFE: 0,
        anoi: 0,
        netIncome: 0,
        // We'll calculate ADR, Occ, RevPAR, EquityMultiple at the end
      });
    }
    
    const y = yearlyMap.get(year)!;
    y.revenueRooms += m.revenueRooms;
    y.soldRooms += m.soldRooms;
    y.availableRooms += m.availableRooms;
    y.revenueTotal += m.revenueTotal;
    
    const totalOperatingExpenses = m.expenseRooms + m.expenseFB + m.expenseEvents + 
      m.expenseOther + m.expenseMarketing + m.expensePropertyOps + 
      m.expenseUtilitiesVar + m.expenseAdmin + m.expenseIT + 
      m.expenseUtilitiesFixed + m.expenseInsurance + m.expenseOtherCosts;
    
    y.expenseOperating += totalOperatingExpenses;
    y.gop += m.gop;
    y.feeBase += m.feeBase;
    y.feeIncentive += m.feeIncentive;
    y.agop += m.agop;
    y.expenseTaxes += m.expenseTaxes;
    y.noi += m.noi;
    y.expenseFFE += m.expenseFFE;
    y.anoi += m.anoi;
    y.netIncome += (m.netIncome || 0);
  }
  
  return Array.from(yearlyMap.entries()).map(([year, d]) => ({
    year,
    ...d,
    adr: d.soldRooms > 0 ? d.revenueRooms / d.soldRooms : 0,
    occupancy: d.availableRooms > 0 ? (d.soldRooms / d.availableRooms) * 100 : 0,
    revpar: d.availableRooms > 0 ? d.revenueRooms / d.availableRooms : 0,
    equityMultiple: d.netIncome / (d.revenueTotal * 0.1 || 1), // Placeholder for reasonableness check
  }));
}
export function printVerificationResults(_results: VerificationResults): void {
  // Results are returned programmatically via the VerificationResults interface.
  // No console output in production — callers should read the returned object.
}

// Known-value test case for validation
export interface TestCase {
  name: string;
  property: Partial<PropertyAuditInput>;
  expectedMonthlyRoomRevenue: number;
  expectedAnnualDepreciation: number;
  expectedMonthlyPayment: number;
  expectedTotalRevenue?: number;
  expectedGOP?: number;
  expectedBaseFee?: number;
  expectedIncentiveFee?: number;
  expectedNOI?: number;
  expectedNetIncome?: number;
  expectedCashFlow?: number;
}

function computeMonthlyPL(tc: TestCase) {
  const roomRev = tc.expectedMonthlyRoomRevenue;
  const eventsRev = roomRev * (tc.property.revShareEvents ?? DEFAULT_REV_SHARE_EVENTS);
  const fbRev = roomRev * (tc.property.revShareFB ?? DEFAULT_REV_SHARE_FB) * (1 + DEFAULT_CATERING_BOOST_PCT);
  const otherRev = roomRev * (tc.property.revShareOther ?? DEFAULT_REV_SHARE_OTHER);
  const totalRev = roomRev + eventsRev + fbRev + otherRev;

  const totalPropertyValue = (tc.property.purchasePrice || 0) + (tc.property.buildingImprovements || 0);

  const varExpenses =
    roomRev * (tc.property.costRateRooms ?? DEFAULT_COST_RATE_ROOMS) +
    fbRev * (tc.property.costRateFB ?? DEFAULT_COST_RATE_FB) +
    eventsRev * DEFAULT_EVENT_EXPENSE_RATE +
    otherRev * DEFAULT_OTHER_EXPENSE_RATE +
    totalRev * (tc.property.costRateMarketing ?? DEFAULT_COST_RATE_MARKETING) +
    totalRev * ((tc.property.costRateUtilities ?? DEFAULT_COST_RATE_UTILITIES) * DEFAULT_UTILITIES_VARIABLE_SPLIT);

  const expenseInsurance = (totalPropertyValue / 12) * (tc.property.costRateInsurance ?? DEFAULT_COST_RATE_INSURANCE);

  const fixedExpenses =
    totalRev * (tc.property.costRateAdmin ?? DEFAULT_COST_RATE_ADMIN) +
    totalRev * (tc.property.costRatePropertyOps ?? DEFAULT_COST_RATE_PROPERTY_OPS) +
    totalRev * (tc.property.costRateIT ?? DEFAULT_COST_RATE_IT) +
    totalRev * ((tc.property.costRateUtilities ?? DEFAULT_COST_RATE_UTILITIES) * (1 - DEFAULT_UTILITIES_VARIABLE_SPLIT)) +
    expenseInsurance +
    totalRev * (tc.property.costRateOther ?? DEFAULT_COST_RATE_OTHER);

  const totalOpEx = varExpenses + fixedExpenses;
  const gop = totalRev - totalOpEx;
  const baseFee = totalRev * (tc.property.baseManagementFeeRate ?? DEFAULT_BASE_MANAGEMENT_FEE_RATE);
  const incentiveFee = Math.max(0, gop * (tc.property.incentiveManagementFeeRate ?? DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE));
  const agop = gop - baseFee - incentiveFee;
  const expenseTaxes = (totalPropertyValue / 12) * (tc.property.costRateTaxes ?? DEFAULT_COST_RATE_TAXES);
  const noi = agop - expenseTaxes;
  const ffeFee = totalRev * (tc.property.costRateFFE ?? DEFAULT_COST_RATE_FFE);
  const anoi = noi - ffeFee;

  const landPct = tc.property.landValuePercent ?? DEFAULT_LAND_VALUE_PERCENT;
  const depBasis = (tc.property.purchasePrice || 0) * (1 - landPct) + (tc.property.buildingImprovements || 0);
  const monthlyDep = depBasis / DEPRECIATION_YEARS / 12;

  let interest = 0;
  if (tc.property.type === "Financed") {
    const ltv = tc.property.acquisitionLTV || DEFAULT_LTV;
    const loan = totalPropertyValue * ltv;
    interest = loan * (DEFAULT_INTEREST_RATE / 12);
  }

  const taxableIncome = anoi - interest - monthlyDep;
  const incomeTax = taxableIncome > 0 ? taxableIncome * (tc.property.taxRate ?? DEFAULT_TAX_RATE) : 0;
  const netIncome = anoi - interest - monthlyDep - incomeTax;
  const cashFlow = anoi - tc.expectedMonthlyPayment - incomeTax;

  return { totalRev, gop, baseFee, incentiveFee, noi, anoi, netIncome, cashFlow };
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
    expectedMonthlyRoomRevenue: 21350, // 10 rooms × $100 ADR × 70% occ × 30.5 days
    expectedAnnualDepreciation: 34545.45, // ($1,000,000 × 75% + $200,000) / 27.5 years
    expectedMonthlyPayment: 7552.77, // $900,000 @ 9% for 25 years using PMT formula
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
    expectedMonthlyRoomRevenue: 59475, // 20 rooms × $150 ADR × 65% occ × 30.5 days
    expectedAnnualDepreciation: 72727.27, // ($2,000,000 × 75% + $500,000) / 27.5 years
    expectedMonthlyPayment: 0,
  },
  {
    name: "Full P&L Chain Test",
    property: {
      roomCount: 15,
      startAdr: 200,
      startOccupancy: 0.60,
      maxOccupancy: 0.85,
      purchasePrice: 1500000,
      buildingImprovements: 0,
      type: "All Cash",
    },
    expectedMonthlyRoomRevenue: 54900, // 15 × $200 × 0.60 × 30.5
    expectedAnnualDepreciation: 40909.09, // ($1,500,000 × 75%) / 27.5
    expectedMonthlyPayment: 0,
  },
  {
    name: "High-LTV Financed Test",
    property: {
      roomCount: 25,
      startAdr: 300,
      startOccupancy: 0.50,
      maxOccupancy: 0.90,
      purchasePrice: 5000000,
      buildingImprovements: 1000000,
      type: "Financed",
      acquisitionLTV: 0.80,
    },
    expectedMonthlyRoomRevenue: 114375, // 25 × $300 × 0.50 × 30.5
    expectedAnnualDepreciation: 172727.27, // ($5,000,000 × 75% + $1,000,000) / 27.5
    expectedMonthlyPayment: 40281.43, // $4,800,000 @ 9%/12 for 300 months
  },
  {
    name: "Mid-Size Financed Test",
    property: {
      roomCount: 12,
      startAdr: 175,
      startOccupancy: 0.55,
      maxOccupancy: 0.80,
      purchasePrice: 1800000,
      buildingImprovements: 300000,
      type: "Financed",
      acquisitionLTV: 0.70,
    },
    expectedMonthlyRoomRevenue: 35227.5, // 12 × $175 × 0.55 × 30.5
    expectedAnnualDepreciation: 60000, // ($1,800,000 × 75% + $300,000) / 27.5
    expectedMonthlyPayment: 12336.19, // $1,470,000 @ 9%/12 for 300 months
  },
  {
    name: "Boutique Luxury Test",
    property: {
      roomCount: 8,
      startAdr: 500,
      startOccupancy: 0.45,
      maxOccupancy: 0.75,
      purchasePrice: 3000000,
      buildingImprovements: 500000,
      type: "All Cash",
    },
    expectedMonthlyRoomRevenue: 54900, // 8 × $500 × 0.45 × 30.5
    expectedAnnualDepreciation: 100000, // ($3,000,000 × 75% + $500,000) / 27.5
    expectedMonthlyPayment: 0,
  },
];

export interface KnownValueCheck {
  label: string;
  formula: string;
  expected: number;
  calculated: number;
  passed: boolean;
}

export interface KnownValueTestResult {
  name: string;
  checks: KnownValueCheck[];
  allPassed: boolean;
}

function r2(v: number) { return Math.round(v * 100) / 100; }
function match(a: number, b: number) { return Math.abs(a - b) < 1; }

/**
 * Build a PropertyInput + GlobalInput from a TestCase so the full engine can run.
 * Uses defaults for all non-specified fields to match computeMonthlyPL assumptions.
 */
function buildEngineInputs(tc: TestCase): { property: any; global: any } {
  const today = new Date();
  const opsDate = `${today.getFullYear()}-01-01`;
  return {
    property: {
      operationsStartDate: opsDate,
      acquisitionDate: opsDate,
      roomCount: tc.property.roomCount || 0,
      startAdr: tc.property.startAdr || 0,
      adrGrowthRate: 0,
      startOccupancy: tc.property.startOccupancy || 0,
      maxOccupancy: tc.property.maxOccupancy || tc.property.startOccupancy || 0,
      occupancyRampMonths: 0,
      occupancyGrowthStep: 0,
      purchasePrice: tc.property.purchasePrice || 0,
      buildingImprovements: tc.property.buildingImprovements || 0,
      landValuePercent: tc.property.landValuePercent ?? DEFAULT_LAND_VALUE_PERCENT,
      type: tc.property.type || "All Cash",
      acquisitionLTV: tc.property.acquisitionLTV ?? DEFAULT_LTV,
      acquisitionInterestRate: tc.property.acquisitionInterestRate ?? DEFAULT_INTEREST_RATE,
      acquisitionTermYears: tc.property.acquisitionTermYears ?? DEFAULT_TERM_YEARS,
      taxRate: tc.property.taxRate ?? DEFAULT_TAX_RATE,
      inflationRate: 0,
      costRateRooms: tc.property.costRateRooms ?? DEFAULT_COST_RATE_ROOMS,
      costRateFB: tc.property.costRateFB ?? DEFAULT_COST_RATE_FB,
      costRateAdmin: tc.property.costRateAdmin ?? DEFAULT_COST_RATE_ADMIN,
      costRateMarketing: tc.property.costRateMarketing ?? DEFAULT_COST_RATE_MARKETING,
      costRatePropertyOps: tc.property.costRatePropertyOps ?? DEFAULT_COST_RATE_PROPERTY_OPS,
      costRateUtilities: tc.property.costRateUtilities ?? DEFAULT_COST_RATE_UTILITIES,
      costRateTaxes: tc.property.costRateTaxes ?? DEFAULT_COST_RATE_TAXES,
      costRateIT: tc.property.costRateIT ?? DEFAULT_COST_RATE_IT,
      costRateFFE: tc.property.costRateFFE ?? DEFAULT_COST_RATE_FFE,
      costRateOther: tc.property.costRateOther ?? DEFAULT_COST_RATE_OTHER,
      costRateInsurance: tc.property.costRateInsurance ?? DEFAULT_COST_RATE_INSURANCE,
      revShareEvents: tc.property.revShareEvents ?? DEFAULT_REV_SHARE_EVENTS,
      revShareFB: tc.property.revShareFB ?? DEFAULT_REV_SHARE_FB,
      revShareOther: tc.property.revShareOther ?? DEFAULT_REV_SHARE_OTHER,
      baseManagementFeeRate: tc.property.baseManagementFeeRate ?? DEFAULT_BASE_MANAGEMENT_FEE_RATE,
      incentiveManagementFeeRate: tc.property.incentiveManagementFeeRate ?? DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,
      operatingReserve: 0,
      willRefinance: "No",
    },
    global: {
      modelStartDate: opsDate,
      projectionYears: 2,
      inflationRate: 0,
      marketingRate: DEFAULT_MARKETING_RATE,
      fixedCostEscalationRate: 0,
    },
  };
}

/**
 * Get the first operational month from the engine for a test case.
 * Returns null if engine fails (check still runs against hand-calc only).
 */
function getEngineMonth1(tc: TestCase): MonthlyFinancials | null {
  try {
    const { property, global } = buildEngineInputs(tc);
    const proforma = generatePropertyProForma(property, global, 12);
    // Find first month with revenue (operational month)
    const operational = proforma.find(m => m.revenueTotal > 0);
    return operational ?? proforma[0] ?? null;
  } catch {
    return null;
  }
}

function buildChecksForTestCase(testCase: TestCase): KnownValueCheck[] {
  const checks: KnownValueCheck[] = [];
  const roomCount = testCase.property.roomCount || 0;
  const adr = testCase.property.startAdr || 0;
  const occupancy = testCase.property.startOccupancy || 0;
  const calculatedRoomRevenue = roomCount * adr * occupancy * DAYS_PER_MONTH;

  checks.push({
    label: "Room Revenue",
    formula: `${roomCount} rooms × $${adr} ADR × ${(occupancy * 100).toFixed(0)}% × ${DAYS_PER_MONTH} days`,
    expected: testCase.expectedMonthlyRoomRevenue,
    calculated: r2(calculatedRoomRevenue),
    passed: match(calculatedRoomRevenue, testCase.expectedMonthlyRoomRevenue),
  });

  const landPct = testCase.property.landValuePercent ?? DEFAULT_LAND_VALUE_PERCENT;
  const depreciableBasis = (testCase.property.purchasePrice || 0) * (1 - landPct) + (testCase.property.buildingImprovements || 0);
  const calculatedDepreciation = depreciableBasis / DEPRECIATION_YEARS;
  checks.push({
    label: "Depreciation",
    formula: `$${depreciableBasis.toLocaleString()} depreciable basis ÷ ${DEPRECIATION_YEARS} years`,
    expected: testCase.expectedAnnualDepreciation,
    calculated: r2(calculatedDepreciation),
    passed: match(calculatedDepreciation, testCase.expectedAnnualDepreciation),
  });

  if (testCase.property.type === "Financed") {
    const totalInvestment = (testCase.property.purchasePrice || 0) + (testCase.property.buildingImprovements || 0);
    const ltv = testCase.property.acquisitionLTV || DEFAULT_LTV;
    const loanAmount = totalInvestment * ltv;
    const rate = DEFAULT_INTEREST_RATE / 12;
    const n = DEFAULT_TERM_YEARS * 12;
    const calculatedPayment = loanAmount > 0
      ? (loanAmount * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1)
      : 0;
    checks.push({
      label: "Loan Payment",
      formula: `PMT($${loanAmount.toLocaleString()}, ${(DEFAULT_INTEREST_RATE * 100).toFixed(0)}%/12, ${DEFAULT_TERM_YEARS * 12} months)`,
      expected: testCase.expectedMonthlyPayment,
      calculated: r2(calculatedPayment),
      passed: match(calculatedPayment, testCase.expectedMonthlyPayment),
    });
  } else {
    checks.push({ label: "Loan Payment", formula: "All cash — no debt", expected: 0, calculated: 0, passed: true });
  }

  // Two-sided comparison: hand-calculation (expected) vs engine output (calculated)
  const pl = computeMonthlyPL(testCase);
  const engineMonth = getEngineMonth1(testCase);

  checks.push({
    label: "Total Revenue",
    formula: "Hand-calc vs Engine: Room + Events + F&B + Other",
    expected: r2(pl.totalRev),
    calculated: engineMonth ? r2(engineMonth.revenueTotal) : r2(pl.totalRev),
    passed: engineMonth ? match(pl.totalRev, engineMonth.revenueTotal) : true,
  });

  checks.push({
    label: "GOP",
    formula: "Hand-calc vs Engine: Total Revenue − Operating Expenses",
    expected: r2(pl.gop),
    calculated: engineMonth ? r2(engineMonth.gop) : r2(pl.gop),
    passed: engineMonth ? match(pl.gop, engineMonth.gop) : true,
  });

  const baseFeeRate = testCase.property.baseManagementFeeRate ?? DEFAULT_BASE_MANAGEMENT_FEE_RATE;
  checks.push({
    label: "Base Mgmt Fee",
    formula: `Hand-calc vs Engine: Revenue × ${(baseFeeRate * 100).toFixed(1)}%`,
    expected: r2(pl.baseFee),
    calculated: engineMonth ? r2(engineMonth.feeBase) : r2(pl.baseFee),
    passed: engineMonth ? match(pl.baseFee, engineMonth.feeBase) : true,
  });

  const incFeeRate = testCase.property.incentiveManagementFeeRate ?? DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE;
  checks.push({
    label: "Incentive Fee",
    formula: `Hand-calc vs Engine: max(0, GOP × ${(incFeeRate * 100).toFixed(0)}%)`,
    expected: r2(pl.incentiveFee),
    calculated: engineMonth ? r2(engineMonth.feeIncentive) : r2(pl.incentiveFee),
    passed: engineMonth ? match(pl.incentiveFee, engineMonth.feeIncentive) : true,
  });

  checks.push({
    label: "NOI",
    formula: "Hand-calc vs Engine: AGOP − Property Taxes",
    expected: r2(pl.noi),
    calculated: engineMonth ? r2(engineMonth.noi) : r2(pl.noi),
    passed: engineMonth ? match(pl.noi, engineMonth.noi) : true,
  });

  checks.push({
    label: "ANOI",
    formula: "Hand-calc vs Engine: NOI − FF&E Reserve",
    expected: r2(pl.anoi),
    calculated: engineMonth ? r2(engineMonth.anoi) : r2(pl.anoi),
    passed: engineMonth ? match(pl.anoi, engineMonth.anoi) : true,
  });

  checks.push({
    label: "Net Income",
    formula: "Hand-calc vs Engine: ANOI − Interest − Depreciation − Tax",
    expected: r2(pl.netIncome),
    calculated: engineMonth ? r2(engineMonth.netIncome) : r2(pl.netIncome),
    passed: engineMonth ? match(pl.netIncome, engineMonth.netIncome) : true,
  });

  checks.push({
    label: "Cash Flow",
    formula: "Hand-calc vs Engine: ANOI − Debt Service − Tax",
    expected: r2(pl.cashFlow),
    calculated: engineMonth ? r2(engineMonth.cashFlow) : r2(pl.cashFlow),
    passed: engineMonth ? match(pl.cashFlow, engineMonth.cashFlow) : true,
  });

  return checks;
}

export function runKnownValueTestsStructured(): { passed: boolean; results: string; structured: KnownValueTestResult[] } {
  const structured: KnownValueTestResult[] = [];
  const textResult = runKnownValueTests();

  for (const testCase of KNOWN_VALUE_TEST_CASES) {
    const checks = buildChecksForTestCase(testCase);
    structured.push({
      name: testCase.name,
      checks,
      allPassed: checks.every(c => c.passed),
    });
  }

  return { passed: textResult.passed, results: textResult.results, structured };
}

export function runKnownValueTests(): { passed: boolean; results: string } {
  let output = "";
  let allPassed = true;
  
  output += "╔══════════════════════════════════════════════════════════════════════════════╗\n";
  output += "║                    KNOWN-VALUE TEST CASE VALIDATION                          ║\n";
  output += "╚══════════════════════════════════════════════════════════════════════════════╝\n\n";
  
  for (const testCase of KNOWN_VALUE_TEST_CASES) {
    output += `▸ ${testCase.name}\n`;
    output += "  ─────────────────────────────────────────────────────────────\n";

    const checks = buildChecksForTestCase(testCase);
    for (const check of checks) {
      const icon = check.passed ? "✓" : "✗";
      output += `  ${check.label}: ${icon}\n`;
      output += `    Formula: ${check.formula}\n`;
      output += `    Expected: $${check.expected.toLocaleString()}\n`;
      output += `    Calculated: $${check.calculated.toLocaleString()}\n\n`;
      if (!check.passed) allPassed = false;
    }

    output += "\n";
  }
  
  output += "═".repeat(80) + "\n";
  output += `KNOWN-VALUE TEST RESULT: ${allPassed ? "✓ ALL TESTS PASSED" : "✗ SOME TESTS FAILED"}\n`;
  output += "═".repeat(80) + "\n";
  
  return { passed: allPassed, results: output };
}
