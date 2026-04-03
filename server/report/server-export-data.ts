import { computePortfolioProjection } from "../finance/service";
import { storage } from "../storage";
import type { PropertyInput, GlobalInput } from "@/lib/financial/types";
import type { YearlyPropertyFinancials } from "@/lib/financial/yearlyAggregator";
import { verifyExport } from "@calc/validation/export-verification";
import { logger } from "../logger";

interface ExportRow {
  category: string;
  values: (string | number)[];
  indent?: number;
  isBold?: boolean;
  isHeader?: boolean;
  isItalic?: boolean;
  format?: "currency" | "percentage" | "number" | "ratio" | "multiplier";
}

interface StatementSection {
  title: string;
  years: string[];
  rows: ExportRow[];
  includeTable?: boolean;
  includeChart?: boolean;
}

interface MetricEntry {
  label: string;
  value: string;
}

export interface ServerExportData {
  statements: StatementSection[];
  metrics: MetricEntry[];
  rows: ExportRow[];
  years: string[];
  outputHash: string;
  engineVersion: string;
  projectionYears: number;
}

function yearLabels(projectionYears: number): string[] {
  return Array.from({ length: projectionYears }, (_, i) => `Year ${i + 1}`);
}

function row(category: string, values: (string | number)[], opts?: { indent?: number; isBold?: boolean; isHeader?: boolean; format?: ExportRow["format"] }): ExportRow {
  return { category, values, ...opts };
}

function yearlyValues(data: YearlyPropertyFinancials[], key: keyof YearlyPropertyFinancials): number[] {
  return data.map(y => {
    const v = y[key];
    return typeof v === "number" ? v : 0;
  });
}

function buildIncomeStatement(yearly: YearlyPropertyFinancials[], years: string[]): StatementSection {
  const rows: ExportRow[] = [
    row("Revenue", [], { isHeader: true }),
    row("Rooms Revenue", yearlyValues(yearly, "revenueRooms"), { indent: 1 }),
    row("Events Revenue", yearlyValues(yearly, "revenueEvents"), { indent: 1 }),
    row("F&B Revenue", yearlyValues(yearly, "revenueFB"), { indent: 1 }),
    row("Other Revenue", yearlyValues(yearly, "revenueOther"), { indent: 1 }),
    row("Total Revenue", yearlyValues(yearly, "revenueTotal"), { isBold: true }),

    row("Departmental Expenses", [], { isHeader: true }),
    row("Rooms Expense", yearlyValues(yearly, "expenseRooms"), { indent: 1 }),
    row("F&B Expense", yearlyValues(yearly, "expenseFB"), { indent: 1 }),
    row("Events Expense", yearlyValues(yearly, "expenseEvents"), { indent: 1 }),
    row("Other Expense", yearlyValues(yearly, "expenseOther"), { indent: 1 }),

    row("Undistributed Expenses", [], { isHeader: true }),
    row("Admin & General", yearlyValues(yearly, "expenseAdmin"), { indent: 1 }),
    row("Marketing", yearlyValues(yearly, "expenseMarketing"), { indent: 1 }),
    row("Property Operations", yearlyValues(yearly, "expensePropertyOps"), { indent: 1 }),
    row("Utilities", yearlyValues(yearly, "expenseUtilities"), { indent: 1 }),
    row("IT & Systems", yearlyValues(yearly, "expenseIT"), { indent: 1 }),
    row("Insurance", yearlyValues(yearly, "expenseInsurance"), { indent: 1 }),
    row("Other Costs", yearlyValues(yearly, "expenseOtherCosts"), { indent: 1 }),

    row("Gross Operating Profit (GOP)", yearlyValues(yearly, "gop"), { isBold: true }),
    row("Base Management Fee", yearlyValues(yearly, "feeBase"), { indent: 1 }),
    row("Incentive Management Fee", yearlyValues(yearly, "feeIncentive"), { indent: 1 }),
    row("Adjusted GOP (AGOP)", yearlyValues(yearly, "agop"), { isBold: true }),

    row("Property Taxes", yearlyValues(yearly, "expenseTaxes"), { indent: 1 }),
    row("NOI", yearlyValues(yearly, "noi"), { isBold: true }),

    row("FF&E Reserve", yearlyValues(yearly, "expenseFFE"), { indent: 1 }),
    row("ANOI", yearlyValues(yearly, "anoi"), { isBold: true }),

    row("Below the Line", [], { isHeader: true }),
    row("Interest Expense", yearlyValues(yearly, "interestExpense"), { indent: 1 }),
    row("Depreciation", yearlyValues(yearly, "depreciationExpense"), { indent: 1 }),
    row("Income Tax", yearlyValues(yearly, "incomeTax"), { indent: 1 }),
    row("Net Income", yearlyValues(yearly, "netIncome"), { isBold: true }),
  ];

  return { title: "Income Statement", years, rows, includeTable: true, includeChart: true };
}

function buildCashFlowStatement(yearly: YearlyPropertyFinancials[], years: string[]): StatementSection {
  const rows: ExportRow[] = [
    row("Operating Activities", [], { isHeader: true }),
    row("Net Income", yearlyValues(yearly, "netIncome"), { indent: 1 }),
    row("Depreciation (add-back)", yearlyValues(yearly, "depreciationExpense"), { indent: 1 }),
    row("Operating Cash Flow", yearlyValues(yearly, "operatingCashFlow"), { isBold: true }),

    row("Financing Activities", [], { isHeader: true }),
    row("Principal Payment", yearlyValues(yearly, "principalPayment"), { indent: 1 }),
    row("Refinancing Proceeds", yearlyValues(yearly, "refinancingProceeds"), { indent: 1 }),
    row("Financing Cash Flow", yearlyValues(yearly, "financingCashFlow"), { isBold: true }),

    row("Cash Position", [], { isHeader: true }),
    row("Cash Flow", yearlyValues(yearly, "cashFlow"), { indent: 1 }),
    row("Ending Cash", yearlyValues(yearly, "endingCash"), { isBold: true }),
  ];

  return { title: "Cash Flow Statement", years, rows, includeTable: true, includeChart: true };
}

function buildMetrics(consolidated: YearlyPropertyFinancials[], propertyCount: number): MetricEntry[] {
  const y1 = consolidated[0];
  const yLast = consolidated[consolidated.length - 1];
  if (!y1 || !yLast) return [];

  const fmt = (v: number) => {
    const abs = Math.abs(v);
    if (abs >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
    if (abs >= 1e3) return `$${Math.round(v / 1e3).toLocaleString()}K`;
    return `$${v.toFixed(0)}`;
  };

  return [
    { label: "Total Properties", value: String(propertyCount) },
    { label: "Year 1 Revenue", value: fmt(y1.revenueTotal) },
    { label: `Year ${consolidated.length} Revenue`, value: fmt(yLast.revenueTotal) },
    { label: "Year 1 NOI", value: fmt(y1.noi) },
    { label: `Year ${consolidated.length} NOI`, value: fmt(yLast.noi) },
    { label: `Year ${consolidated.length} Net Income`, value: fmt(yLast.netIncome) },
    { label: `Year ${consolidated.length} Ending Cash`, value: fmt(yLast.endingCash) },
  ];
}

export interface BuildExportDataInput {
  userId: number;
  propertyIds?: number[];
  projectionYears?: number;
}

export async function buildExportData(
  input: BuildExportDataInput,
): Promise<ServerExportData> {
  const allProperties = await storage.getAllProperties(input.userId);
  const globalAssumptions = await storage.getGlobalAssumptions(input.userId);

  if (!globalAssumptions) {
    throw new Error("No global assumptions found for user");
  }

  let propertiesToCompute = allProperties;
  if (input.propertyIds?.length) {
    const idSet = new Set(input.propertyIds);
    propertiesToCompute = allProperties.filter(p => idSet.has(p.id));
    if (propertiesToCompute.length === 0) {
      throw new Error("No matching properties found for the given IDs");
    }
  }

  const propertyInputs: PropertyInput[] = propertiesToCompute.map(p => ({
    ...p,
    operationsStartDate: p.operationsStartDate,
    roomCount: p.roomCount,
    startAdr: p.startAdr,
    adrGrowthRate: p.adrGrowthRate,
    startOccupancy: p.startOccupancy,
    maxOccupancy: p.maxOccupancy,
    occupancyRampMonths: p.occupancyRampMonths,
    occupancyGrowthStep: p.occupancyGrowthStep,
    purchasePrice: p.purchasePrice,
    type: p.type,
    costRateRooms: p.costRateRooms,
    costRateFB: p.costRateFB,
    costRateAdmin: p.costRateAdmin,
    costRateMarketing: p.costRateMarketing,
    costRatePropertyOps: p.costRatePropertyOps,
    costRateUtilities: p.costRateUtilities,
    costRateTaxes: p.costRateTaxes,
    costRateIT: p.costRateIT,
    costRateFFE: p.costRateFFE,
    costRateOther: p.costRateOther,
    costRateInsurance: p.costRateInsurance,
    revShareEvents: p.revShareEvents,
    revShareFB: p.revShareFB,
    revShareOther: p.revShareOther,
    id: p.id,
    name: p.name,
  } as PropertyInput));

  const dbDebt = globalAssumptions.debtAssumptions as Record<string, unknown> | null;

  const globalInput: GlobalInput = {
    modelStartDate: globalAssumptions.modelStartDate,
    inflationRate: Number(globalAssumptions.inflationRate),
    marketingRate: Number(globalAssumptions.marketingRate ?? 0.01),
    debtAssumptions: {
      interestRate: Number(dbDebt?.interestRate ?? 0.065),
      amortizationYears: Number(dbDebt?.amortizationYears ?? 25),
    },
    projectionYears: input.projectionYears ?? Number(globalAssumptions.projectionYears ?? 10),
  };

  const projYears = input.projectionYears ?? Number(globalAssumptions.projectionYears ?? 10);

  const result = computePortfolioProjection({
    properties: propertyInputs,
    globalAssumptions: globalInput,
    projectionYears: projYears,
  });

  const years = yearLabels(projYears);

  const incomeStatement = buildIncomeStatement(result.consolidatedYearly, years);
  const cashFlowStatement = buildCashFlowStatement(result.consolidatedYearly, years);

  const statements: StatementSection[] = [incomeStatement, cashFlowStatement];
  const metrics = buildMetrics(result.consolidatedYearly, result.propertyCount);

  const allRows = [...incomeStatement.rows, ...cashFlowStatement.rows];

  const y1 = result.consolidatedYearly[0];
  if (y1) {
    const verification = verifyExport({
      export_format: "pdf",
      export_source: "consolidated",
      expected_sections: ["Income Statement", "Cash Flow Statement"],
      actual_sections: statements.map(s => s.title),
      expected_year_count: projYears,
      actual_year_count: years.length,
      expected_property_count: propertiesToCompute.length,
      actual_property_count: result.propertyCount,
      sample_values: [
        { label: "Y1 Revenue", expected_value: y1.revenueTotal, exported_value: y1.revenueTotal },
        { label: "Y1 NOI", expected_value: y1.noi, exported_value: y1.noi },
        { label: "Y1 Net Income", expected_value: y1.netIncome, exported_value: y1.netIncome },
      ],
    });

    if (!verification.all_passed) {
      logger.warn(`Export verification warnings: ${verification.checks.filter(c => !c.passed).map(c => c.details).join("; ")}`, "server-export");
    }
  }

  return {
    statements,
    metrics,
    rows: allRows,
    years,
    outputHash: result.outputHash,
    engineVersion: result.engineVersion,
    projectionYears: projYears,
  };
}
