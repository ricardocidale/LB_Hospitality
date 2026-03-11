/**
 * InvestmentAnalysis.tsx — IRR and equity return analysis across the portfolio.
 *
 * Computes and displays investment-level returns for each property and
 * the portfolio as a whole:
 *
 *   • Equity Invested   — down payment + closing costs + renovation capex
 *   • Annual Cash Flow  — NOI minus debt service for each projection year
 *   • Exit Proceeds     — estimated sale price at exit cap rate minus
 *                         remaining loan balance and disposition costs
 *   • IRR               — Internal Rate of Return: the discount rate that
 *                         makes the NPV of all cash flows (equity out,
 *                         annual CF in, exit proceeds in) equal to zero.
 *                         A property-level IRR above the threshold
 *                         (typically 15-20%) is highlighted green.
 *   • Equity Multiple   — total distributions / total equity invested
 *
 * Uses the Newton-Raphson IRR solver from @analytics/returns/irr.js.
 * Rows are expandable to show per-property detail within a consolidated view.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatMoney, getFiscalYearForModelYear } from "@/lib/financialEngine";
import {
  PROJECTION_YEARS,
  DEFAULT_EXIT_CAP_RATE,
  DEFAULT_TAX_RATE,
  IRR_HIGHLIGHT_THRESHOLD,
} from "@/lib/constants";
import { DEFAULT_COST_OF_EQUITY } from "@shared/constants";
import { propertyEquityInvested, acquisitionYearIndex } from "@/lib/financial/equityCalculations";
import { computeIRR } from "@analytics/returns/irr.js";
import type { aggregateCashFlowByYear } from "@/lib/financial/cashFlowAggregator";

/** Adapter: wraps standalone IRR solver to return a plain number (annual rate). */
function calculateIRR(cashFlows: number[]): number {
  const result = computeIRR(cashFlows, 1);
  return result.irr_periodic ?? 0;
}

interface InvestmentAnalysisProps {
  properties: any[];
  allPropertyFinancials: any[];
  allPropertyYearlyCF: ReturnType<typeof aggregateCashFlowByYear>[];
  getPropertyYearly: (propIndex: number, yearIndex: number) => any;
  getYearlyConsolidated: (yearIndex: number) => any;
  global: any;
  expandedRows: Set<string>;
  toggleRow: (rowId: string) => void;
}

export function InvestmentAnalysis({
  properties,
  allPropertyFinancials,
  allPropertyYearlyCF,
  getPropertyYearly,
  getYearlyConsolidated,
  global,
  expandedRows,
  toggleRow
}: InvestmentAnalysisProps) {
  const projectionYears = global?.projectionYears ?? PROJECTION_YEARS;
  const projectionMonths = projectionYears * 12;

  const fiscalYearStartMonth = global.fiscalYearStartMonth ?? 1;
  const getFiscalYear = (yearIndex: number) => getFiscalYearForModelYear(global.modelStartDate, fiscalYearStartMonth, yearIndex);

  const getPropertyAcquisitionYear = (prop: any): number =>
    acquisitionYearIndex(prop.acquisitionDate, prop.operationsStartDate, global.modelStartDate);

  const getPropertyInvestment = (prop: any): number =>
    propertyEquityInvested(prop);

  const getEquityInvestmentForYear = (yearIndex: number): number =>
    properties.reduce((sum, prop) => sum + (getPropertyAcquisitionYear(prop) === yearIndex ? getPropertyInvestment(prop) : 0), 0);

  // Aggregator-based helpers: read from precomputed allPropertyYearlyCF
  const getPropertyExitValue = (propIndex: number): number => {
    const yearly = allPropertyYearlyCF[propIndex];
    return yearly?.[projectionYears - 1]?.exitValue ?? 0;
  };

  const getPropertyCashFlows = (propIndex: number): number[] => {
    const yearly = allPropertyYearlyCF[propIndex];
    if (!yearly) return [];
    return yearly.map(r => r.netCashFlowToInvestors);
  };

  const getConsolidatedYearlyDetails = (yearIndex: number) => {
    let totalNOI = 0;
    let totalDebtService = 0;
    let totalInterest = 0;
    let totalPrincipal = 0;
    let totalDepreciation = 0;
    let totalBTCF = 0;
    let totalTaxableIncome = 0;
    let totalTaxLiability = 0;
    let totalATCF = 0;

    allPropertyYearlyCF.forEach(propYearly => {
      const yr = propYearly[yearIndex];
      if (!yr) return;
      totalNOI += yr.noi;
      totalDebtService += yr.debtService;
      totalInterest += yr.interestExpense;
      totalPrincipal += yr.principalPayment;
      totalDepreciation += yr.depreciation;
      totalBTCF += yr.btcf;
      totalTaxableIncome += yr.taxableIncome;
      totalTaxLiability += yr.taxLiability;
      totalATCF += yr.atcf;
    });

    return {
      noi: totalNOI,
      debtService: totalDebtService,
      interestPortion: totalInterest,
      principalPortion: totalPrincipal,
      depreciation: totalDepreciation,
      btcf: totalBTCF,
      taxableIncome: totalTaxableIncome,
      taxLiability: totalTaxLiability,
      atcf: totalATCF
    };
  };

  const consolidatedFlowsIA = Array.from({ length: projectionYears }, (_, y) =>
    allPropertyYearlyCF.reduce((sum, propYearly) => sum + (propYearly[y]?.netCashFlowToInvestors ?? 0), 0)
  );
  const portfolioIRRIA = calculateIRR(consolidatedFlowsIA);

  const totalInitialEquityIA = properties.reduce((sum, prop) => sum + getPropertyInvestment(prop), 0);
  const totalExitValueIA = allPropertyYearlyCF.reduce(
    (sum, yearly) => sum + (yearly[projectionYears - 1]?.exitValue ?? 0), 0
  );

  const totalCashReturnedIA = consolidatedFlowsIA.reduce((sum, cf) => sum + cf, 0);
  const midProjectionEquityIA = Array.from({ length: projectionYears }, (_, y) => getEquityInvestmentForYear(y + 1))
    .reduce((sum, eq) => sum + eq, 0);
  const equityMultipleIA = totalInitialEquityIA > 0 ? (totalCashReturnedIA + midProjectionEquityIA) / totalInitialEquityIA : 0;

  const operatingCashFlowsIA = Array.from({ length: projectionYears }, (_, y) =>
    allPropertyYearlyCF.reduce((sum, propYearly) => sum + (propYearly[y]?.atcf ?? 0), 0)
  );
  const avgAnnualCashFlowIA = operatingCashFlowsIA.reduce((sum, cf) => sum + cf, 0) / projectionYears;
  const cashOnCashIA = totalInitialEquityIA > 0 ? (avgAnnualCashFlowIA / totalInitialEquityIA) * 100 : 0;

  return (
    <>
      {/* Investment Analysis - Liquid Glass Metrics */}
      <div className="relative overflow-hidden rounded-lg p-6 mb-6">
        <div className="absolute inset-0 bg-background" />

        <div className="relative grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
            <p className="text-sm font-medium text-foreground/70 flex items-center mb-2">
              Total Equity
              <HelpTooltip text="Total initial capital required from investors across all properties, including purchase price, improvements, pre-opening costs, and operating reserves (net of any financing)." manualSection="investment-returns" />
            </p>
            <div className="text-2xl font-bold text-foreground font-mono">{formatMoney(totalInitialEquityIA)}</div>
          </div>

          <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
            <p className="text-sm font-medium text-foreground/70 flex items-center mb-2">
              Exit Value ({getFiscalYear(projectionYears - 1)})
              <HelpTooltip text={`Projected sale value of all properties at ${getFiscalYear(10)}, calculated as NOI ÷ Exit Cap Rate, minus any outstanding debt at time of sale.`} manualSection="investment-returns" />
            </p>
            <div className="text-2xl font-bold text-emerald-600 font-mono">{formatMoney(totalExitValueIA)}</div>
          </div>

          <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
            <p className="text-sm font-medium text-foreground/70 flex items-center mb-2">
              Equity Multiple
              <HelpTooltip text="Total cash returned to investors divided by total equity invested. A 2.0x multiple means investors receive $2 back for every $1 invested." manualSection="investment-returns" manualLabel="MOIC formula in the Manual" />
            </p>
            <div className="text-2xl font-bold text-blue-600 font-mono">{equityMultipleIA.toFixed(2)}x</div>
          </div>

          <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
            <p className="text-sm font-medium text-foreground/70 flex items-center mb-2">
              Avg Cash-on-Cash
              <HelpTooltip text="Average annual operating cash flow (excluding exit proceeds) as a percentage of total equity invested. Measures the annual yield on invested capital." />
            </p>
            <div className="text-2xl font-bold text-amber-600 font-mono">{cashOnCashIA.toFixed(1)}%</div>
          </div>

          <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
            <p className="text-sm font-medium text-foreground/70 flex items-center mb-2">
              Portfolio IRR
              <HelpTooltip text="Internal Rate of Return - the annualized return that makes the net present value of all cash flows (investments, distributions, and exit) equal to zero. The gold standard metric for real estate investments." manualSection="investment-returns" manualLabel="IRR methodology in the Manual" />
            </p>
            <div className="text-2xl font-bold text-secondary font-mono">{(portfolioIRRIA * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Free Cash Flow Analysis ({projectionYears}-Year)</CardTitle>
          <p className="text-sm text-muted-foreground">Investor cash flows including distributions, refinancing proceeds, and exit values</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card min-w-[200px]">Category</TableHead>
                <TableHead className="text-right min-w-[110px]">{getFiscalYear(0)}</TableHead>
                {Array.from({ length: projectionYears }, (_, i) => (
                  <TableHead key={i} className="text-right min-w-[110px]">{getFiscalYear(i + 1)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                className="font-semibold bg-muted/20 cursor-pointer hover:bg-muted/30"
                onClick={() => toggleRow('fcfEquity')}
              >
                <TableCell className="sticky left-0 bg-muted/20 flex items-center gap-2">
                  {expandedRows.has('fcfEquity') ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  Equity Investment
                </TableCell>
                {(() => {
                  const year0Inv = getEquityInvestmentForYear(0);
                  return (
                    <TableCell className={`text-right ${year0Inv > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {year0Inv > 0 ? `(${formatMoney(year0Inv)})` : '-'}
                    </TableCell>
                  );
                })()}
                {Array.from({ length: projectionYears }, (_, y) => {
                  const yearInv = getEquityInvestmentForYear(y + 1);
                  return (
                    <TableCell key={y} className={`text-right ${yearInv > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {yearInv > 0 ? `(${formatMoney(yearInv)})` : '-'}
                    </TableCell>
                  );
                })}
              </TableRow>
              {expandedRows.has('fcfEquity') && properties.map((prop) => {
                const acqYear = getPropertyAcquisitionYear(prop);
                return (
                  <TableRow key={prop.id} className="bg-muted/10">
                    <TableCell className="sticky left-0 bg-muted/10 pl-8 text-sm text-muted-foreground">{prop.name}</TableCell>
                    <TableCell className={`text-right text-sm ${acqYear === 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {acqYear === 0 ? `(${formatMoney(getPropertyInvestment(prop))})` : '-'}
                    </TableCell>
                    {Array.from({ length: projectionYears }, (_, y) => (
                      <TableCell key={y} className={`text-right text-sm ${acqYear === y + 1 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {acqYear === y + 1 ? `(${formatMoney(getPropertyInvestment(prop))})` : '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}

              <TableRow
                className="cursor-pointer hover:bg-muted/20"
                onClick={() => toggleRow('fcfOperating')}
              >
                <TableCell className="sticky left-0 bg-card flex items-center gap-2">
                  {expandedRows.has('fcfOperating') ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  Free Cash Flow to Equity (FCFE)
                  <HelpTooltip text="GAAP FCFE = Cash from Operations - Principal Payments. For hotels where FF&E reserves are included in NOI, this equals After-Tax Cash Flow (ATCF)." manualSection="investment-returns" manualLabel="FCFE formula in the Manual" />
                </TableCell>
                <TableCell className="text-right text-muted-foreground">-</TableCell>
                {Array.from({ length: projectionYears }, (_, y) => {
                  const details = getConsolidatedYearlyDetails(y);
                  return (
                    <TableCell key={y} className={`text-right ${details.atcf < 0 ? 'text-destructive' : ''}`}>
                      {formatMoney(details.atcf)}
                    </TableCell>
                  );
                })}
              </TableRow>
              {expandedRows.has('fcfOperating') && (
                <>
                  <TableRow className="bg-blue-50/30 dark:bg-blue-950/20">
                    <TableCell className="sticky left-0 bg-blue-50/30 dark:bg-blue-950/20 pl-8 text-sm font-medium text-muted-foreground" colSpan={1}>
                      Cash Flow
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: projectionYears }, (_, y) => (
                      <TableCell key={y} className="text-right text-sm text-muted-foreground">-</TableCell>
                    ))}
                  </TableRow>
                  <TableRow className="bg-muted/5">
                    <TableCell className="sticky left-0 bg-muted/5 pl-12 text-sm text-muted-foreground">Adjusted NOI (ANOI)</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: projectionYears }, (_, y) => (
                      <TableCell key={y} className="text-right text-sm text-muted-foreground">
                        {formatMoney(getConsolidatedYearlyDetails(y).noi)}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow className="bg-muted/5">
                    <TableCell className="sticky left-0 bg-muted/5 pl-12 text-sm text-muted-foreground">Less: Debt Service (P+I)</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: projectionYears }, (_, y) => {
                      const ds = getConsolidatedYearlyDetails(y).debtService;
                      return (
                        <TableCell key={y} className="text-right text-sm text-destructive">
                          {ds > 0 ? `(${formatMoney(ds)})` : '-'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="bg-muted/5">
                    <TableCell className="sticky left-0 bg-muted/5 pl-12 text-sm text-muted-foreground flex items-center gap-1">
                      = Before-Tax Cash Flow (BTCF)
                      <HelpTooltip text="BTCF = NOI - Debt Service. Cash available before income taxes." manualSection="property-formulas" />
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: projectionYears }, (_, y) => {
                      const btcf = getConsolidatedYearlyDetails(y).btcf;
                      return (
                        <TableCell key={y} className={`text-right text-sm ${btcf < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {formatMoney(btcf)}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  <TableRow className="bg-amber-50/30 dark:bg-amber-950/20">
                    <TableCell className="sticky left-0 bg-amber-50/30 dark:bg-amber-950/20 pl-8 text-sm font-medium text-muted-foreground" colSpan={1}>
                      Tax (GAAP)
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: projectionYears }, (_, y) => (
                      <TableCell key={y} className="text-right text-sm text-muted-foreground">-</TableCell>
                    ))}
                  </TableRow>
                  <TableRow className="bg-muted/5">
                    <TableCell className="sticky left-0 bg-muted/5 pl-12 text-sm text-muted-foreground">Less: Interest Expense</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: projectionYears }, (_, y) => {
                      const interest = getConsolidatedYearlyDetails(y).interestPortion;
                      return (
                        <TableCell key={y} className="text-right text-sm text-destructive">
                          {interest > 0 ? `(${formatMoney(interest)})` : '-'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="bg-muted/5">
                    <TableCell className="sticky left-0 bg-muted/5 pl-12 text-sm text-muted-foreground">Less: Depreciation (non-cash)</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: projectionYears }, (_, y) => {
                      const dep = getConsolidatedYearlyDetails(y).depreciation;
                      return (
                        <TableCell key={y} className="text-right text-sm text-destructive">
                          {dep > 0 ? `(${formatMoney(dep)})` : '-'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="bg-muted/5">
                    <TableCell className="sticky left-0 bg-muted/5 pl-12 text-sm text-muted-foreground">= Taxable Income (NOI-Int-Dep)</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: projectionYears }, (_, y) => {
                      const ti = getConsolidatedYearlyDetails(y).taxableIncome;
                      return (
                        <TableCell key={y} className={`text-right text-sm ${ti < 0 ? 'text-muted-foreground' : ''}`}>
                          {formatMoney(ti)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="bg-muted/5">
                    <TableCell className="sticky left-0 bg-muted/5 pl-12 text-sm text-muted-foreground">Tax Liability (if positive)</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: projectionYears }, (_, y) => {
                      const tax = getConsolidatedYearlyDetails(y).taxLiability;
                      return (
                        <TableCell key={y} className="text-right text-sm text-destructive">
                          {tax > 0 ? `(${formatMoney(tax)})` : '-'}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  <TableRow className="bg-green-50/30 dark:bg-green-950/20 border-t">
                    <TableCell className="sticky left-0 bg-green-50/30 dark:bg-green-950/20 pl-8 text-sm font-medium flex items-center gap-1">
                      After-Tax Cash Flow (ATCF)
                      <HelpTooltip text="ATCF = BTCF - Tax Liability. Cash available to investors after all taxes paid." manualSection="property-formulas" />
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: projectionYears }, (_, y) => {
                      const atcf = getConsolidatedYearlyDetails(y).atcf;
                      return (
                        <TableCell key={y} className={`text-right text-sm font-medium ${atcf < 0 ? 'text-destructive' : ''}`}>
                          {formatMoney(atcf)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="bg-muted/10">
                    <TableCell className="sticky left-0 bg-muted/10 pl-8 text-sm text-muted-foreground">By Property:</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: projectionYears }, (_, y) => (
                      <TableCell key={y} className="text-right text-sm text-muted-foreground">-</TableCell>
                    ))}
                  </TableRow>
                  {properties.map((prop, idx) => (
                    <TableRow key={prop.id} className="bg-muted/5" data-testid={`fcf-property-${prop.id}`}>
                      <TableCell className="sticky left-0 bg-muted/5 pl-12 text-sm text-muted-foreground">
                        {prop.name}
                        <span className="text-xs ml-2">({((prop.taxRate ?? DEFAULT_TAX_RATE) * 100).toFixed(0)}% income tax)</span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                      {Array.from({ length: projectionYears }, (_, y) => {
                        const yr = allPropertyYearlyCF[idx]?.[y];
                        const atcf = yr?.atcf ?? 0;
                        return (
                          <TableCell key={y} className={`text-right text-sm ${atcf < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {formatMoney(atcf)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </>
              )}

              <TableRow
                className="cursor-pointer hover:bg-muted/20"
                onClick={() => toggleRow('fcfRefi')}
              >
                <TableCell className="sticky left-0 bg-card flex items-center gap-2">
                  {expandedRows.has('fcfRefi') ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  Refinancing Proceeds
                </TableCell>
                <TableCell className="text-right text-muted-foreground">-</TableCell>
                {Array.from({ length: projectionYears }, (_, y) => {
                  const totalRefi = allPropertyYearlyCF.reduce(
                    (sum, propYearly) => sum + (propYearly[y]?.refinancingProceeds ?? 0), 0
                  );
                  return (
                    <TableCell key={y} className={`text-right ${totalRefi > 0 ? 'text-accent font-medium' : 'text-muted-foreground'}`}>
                      {totalRefi > 0 ? formatMoney(totalRefi) : '-'}
                    </TableCell>
                  );
                })}
              </TableRow>
              {expandedRows.has('fcfRefi') && properties.filter(p => p.willRefinance === "Yes").map((prop, idx) => {
                const propIdx = properties.findIndex(p => p.id === prop.id);
                const propYearly = allPropertyYearlyCF[propIdx];
                return (
                  <TableRow key={prop.id} className="bg-muted/10">
                    <TableCell className="sticky left-0 bg-muted/10 pl-8 text-sm text-muted-foreground">{prop.name}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: projectionYears }, (_, y) => {
                      const refiAmt = propYearly?.[y]?.refinancingProceeds ?? 0;
                      return (
                        <TableCell key={y} className={`text-right text-sm ${refiAmt > 0 ? 'text-accent' : 'text-muted-foreground'}`}>
                          {refiAmt > 0 ? formatMoney(refiAmt) : '-'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}

              <TableRow
                className="cursor-pointer hover:bg-muted/30"
                onClick={() => toggleRow('fcfExit')}
              >
                <TableCell className="sticky left-0 bg-card flex items-center gap-2">
                  {expandedRows.has('fcfExit') ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  Exit Proceeds ({getFiscalYear(10)})
                </TableCell>
                <TableCell className="text-right text-muted-foreground">-</TableCell>
                {Array.from({ length: projectionYears }, (_, y) => (
                  <TableCell key={y} className={`text-right ${y !== projectionYears - 1 ? 'text-muted-foreground' : ''}`}>
                    {y === projectionYears - 1 ? formatMoney(totalExitValueIA) : '-'}
                  </TableCell>
                ))}
              </TableRow>
              {expandedRows.has('fcfExit') && properties.map((prop, idx) => (
                <TableRow key={prop.id} className="bg-muted/10">
                  <TableCell className="sticky left-0 bg-muted/10 pl-8 text-sm text-muted-foreground">
                    {prop.name}
                    <span className="text-xs ml-2">({((prop.exitCapRate ?? DEFAULT_EXIT_CAP_RATE) * 100).toFixed(1)}% cap)</span>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                  {Array.from({ length: projectionYears }, (_, y) => (
                    <TableCell key={y} className={`text-right text-sm ${y === projectionYears - 1 ? 'text-accent' : 'text-muted-foreground'}`}>
                      {y === projectionYears - 1 ? formatMoney(getPropertyExitValue(idx)) : '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}

              <TableRow className="bg-primary/10">
                <TableCell className="sticky left-0 bg-primary/10">Net Cash Flow to Investors</TableCell>
                {consolidatedFlowsIA.map((cf, i) => (
                  <TableCell key={i} className={`text-right ${cf < 0 ? 'text-destructive' : ''}`}>
                    {formatMoney(cf)}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow className="bg-muted/30">
                <TableCell className="sticky left-0 bg-muted/30 font-semibold">Cumulative Cash Flow</TableCell>
                {(() => {
                  let cumulative = 0;
                  return consolidatedFlowsIA.map((cf, i) => {
                    cumulative += cf;
                    return (
                      <TableCell key={i} className={`text-right font-medium ${cumulative < 0 ? 'text-destructive' : 'text-accent'}`}>
                        {formatMoney(cumulative)}
                      </TableCell>
                    );
                  });
                })()}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Property-Level IRR Analysis</CardTitle>
          <p className="text-sm text-muted-foreground">Individual property returns based on equity investment, cash flows, and exit value</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead className="text-right">Equity Investment</TableHead>
                <TableHead className="text-right">Income Tax</TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    Exit Cap Rate
                    <HelpTooltip text="Capitalization rate used to value the property at sale. Lower cap rate = higher valuation." manualSection="investment-returns" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Exit Value ({getFiscalYear(10)})</TableHead>
                <TableHead className="text-right">Total Distributions</TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    Equity Multiple
                    <HelpTooltip text="Total cash returned ÷ Equity invested. A 2.0x means $2 back for every $1 invested." manualSection="investment-returns" />
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    IRR
                    <HelpTooltip text="Internal Rate of Return - the annualized return that makes NPV of all cash flows = 0." manualSection="investment-returns" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((prop, idx) => {
                const equity = getPropertyInvestment(prop);
                const exitValue = getPropertyExitValue(idx);
                const cashFlows = getPropertyCashFlows(idx);
                const irr = calculateIRR(cashFlows);
                const totalDistributions = cashFlows.slice(1).reduce((a, b) => a + b, 0);
                const equityMultiple = totalDistributions / equity;

                return (
                  <TableRow key={prop.id}>
                    <TableCell className="font-medium">{prop.name}</TableCell>
                    <TableCell className="text-right font-mono">{formatMoney(equity)}</TableCell>
                    <TableCell className="text-right">{((prop.taxRate ?? DEFAULT_TAX_RATE) * 100).toFixed(0)}%</TableCell>
                    <TableCell className="text-right">{((prop.exitCapRate ?? DEFAULT_EXIT_CAP_RATE) * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right text-accent">{formatMoney(exitValue)}</TableCell>
                    <TableCell className="text-right font-mono">{formatMoney(totalDistributions)}</TableCell>
                    <TableCell className="text-right font-medium">{equityMultiple.toFixed(2)}x</TableCell>
                    <TableCell className={`text-right font-bold ${irr > IRR_HIGHLIGHT_THRESHOLD ? 'text-accent' : irr > 0 ? 'text-primary' : 'text-destructive'}`}>
                      {(irr * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-primary/10 font-bold">
                <TableCell>Portfolio Total</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(totalInitialEquityIA)}</TableCell>
                <TableCell className="text-right text-muted-foreground">-</TableCell>
                <TableCell className="text-right text-muted-foreground">-</TableCell>
                <TableCell className="text-right text-accent">{formatMoney(totalExitValueIA)}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(consolidatedFlowsIA.slice(1).reduce((a, b) => a + b, 0))}</TableCell>
                <TableCell className="text-right">{equityMultipleIA.toFixed(2)}x</TableCell>
                <TableCell className="text-right text-primary">{(portfolioIRRIA * 100).toFixed(1)}%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card data-testid="dcf-analysis-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            Discounted Cash Flow (DCF) Analysis
            <HelpTooltip text="DCF values the portfolio by discounting future cash flows to present value using the Weighted Average Cost of Capital (WACC). WACC blends the cost of equity and after-tax cost of debt, weighted by capital structure." manualSection="investment-returns" />
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Portfolio valuation using WACC-discounted ATCF and terminal value
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {(() => {
            // WACC computation: (E/V × Re) + (D/V × Rd × (1-T))
            const taxRate = global?.companyTaxRate ?? DEFAULT_TAX_RATE;
            const costOfEquity = global?.costOfEquity ?? DEFAULT_COST_OF_EQUITY;

            let totalEquity = 0;
            let totalDebt = 0;
            let weightedDebtCost = 0;

            for (let pi = 0; pi < properties.length; pi++) {
              const prop = properties[pi];
              const equity = propertyEquityInvested(prop);
              const debt = (prop.purchasePrice ?? 0) * (prop.acquisitionLTV ?? 0);
              const debtRate = prop.acquisitionInterestRate ?? 0.09;
              totalEquity += equity;
              totalDebt += debt;
              weightedDebtCost += debt * debtRate;
            }

            const totalCapital = totalEquity + totalDebt;
            const equityWeight = totalCapital > 0 ? totalEquity / totalCapital : 1;
            const debtWeight = totalCapital > 0 ? totalDebt / totalCapital : 0;
            const avgCostOfDebt = totalDebt > 0 ? weightedDebtCost / totalDebt : 0;
            const afterTaxDebtCost = avgCostOfDebt * (1 - taxRate);
            const wacc = (equityWeight * costOfEquity) + (debtWeight * afterTaxDebtCost);

            // Use WACC as discount rate (fallback to 10% if WACC is zero/invalid)
            const discountRate = wacc > 0 ? wacc : 0.10;

            const yearlyATCF = Array.from({ length: projectionYears }, (_, y) =>
              allPropertyYearlyCF.reduce((sum, propYearly) => sum + (propYearly[y]?.atcf ?? 0), 0)
            );

            const terminalValue = totalExitValueIA;

            const pvFactors = Array.from({ length: projectionYears }, (_, y) =>
              1 / Math.pow(1 + discountRate, y + 1)
            );

            const pvCashFlows = yearlyATCF.map((cf, y) => cf * pvFactors[y]);
            const pvTerminal = terminalValue * pvFactors[projectionYears - 1];
            const totalPVOperating = pvCashFlows.reduce((sum, pv) => sum + pv, 0);
            const dcfValue = totalPVOperating + pvTerminal;
            const npv = dcfValue - totalInitialEquityIA;
            const valueCreation = totalInitialEquityIA > 0 ? (npv / totalInitialEquityIA) * 100 : 0;

            return (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
                    <p className="text-sm font-medium text-foreground/70 flex items-center mb-2">
                      WACC
                      <HelpTooltip text={`Weighted Average Cost of Capital. Blends cost of equity (${(costOfEquity * 100).toFixed(1)}%) and after-tax cost of debt (${(afterTaxDebtCost * 100).toFixed(1)}%) weighted by capital structure (${(equityWeight * 100).toFixed(0)}% equity / ${(debtWeight * 100).toFixed(0)}% debt).`} manualSection="investment-returns" />
                    </p>
                    <div className="text-2xl font-bold text-foreground font-mono">{(discountRate * 100).toFixed(1)}%</div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Re: {(costOfEquity * 100).toFixed(0)}% · Rd(1-T): {(afterTaxDebtCost * 100).toFixed(1)}% · E/V: {(equityWeight * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
                    <p className="text-sm font-medium text-foreground/70 flex items-center mb-2">
                      DCF Portfolio Value
                      <HelpTooltip text="Sum of all discounted operating cash flows plus the discounted terminal (exit) value. Represents the present value of the entire portfolio." />
                    </p>
                    <div className="text-2xl font-bold text-foreground font-mono">{formatMoney(dcfValue)}</div>
                  </div>
                  <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
                    <p className="text-sm font-medium text-foreground/70 flex items-center mb-2">
                      Net Present Value (NPV)
                      <HelpTooltip text="DCF Portfolio Value minus Total Equity Invested. A positive NPV indicates the investment creates value above the required return." />
                    </p>
                    <div className={`text-2xl font-bold font-mono ${npv >= 0 ? 'text-accent' : 'text-destructive'}`}>
                      {formatMoney(npv)}
                    </div>
                  </div>
                  <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
                    <p className="text-sm font-medium text-foreground/70 flex items-center mb-2">
                      Value Creation
                      <HelpTooltip text="NPV as a percentage of total equity invested. Shows how much value is created (or destroyed) relative to the investment." />
                    </p>
                    <div className={`text-2xl font-bold font-mono ${valueCreation >= 0 ? 'text-accent' : 'text-destructive'}`}>
                      {valueCreation >= 0 ? '+' : ''}{valueCreation.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-card min-w-[200px]">Category</TableHead>
                      {Array.from({ length: projectionYears }, (_, i) => (
                        <TableHead key={i} className="text-right min-w-[110px]">{getFiscalYear(i)}</TableHead>
                      ))}
                      <TableHead className="text-right min-w-[120px] font-bold">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card">After-Tax Cash Flow (ATCF)</TableCell>
                      {yearlyATCF.map((cf, i) => (
                        <TableCell key={i} className={`text-right font-mono ${cf < 0 ? 'text-destructive' : ''}`}>
                          {formatMoney(cf)}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-mono font-medium">
                        {formatMoney(yearlyATCF.reduce((a, b) => a + b, 0))}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="sticky left-0 bg-card">
                        Terminal Value
                        <span className="text-xs text-muted-foreground ml-1">(exit proceeds)</span>
                      </TableCell>
                      {Array.from({ length: projectionYears }, (_, i) => (
                        <TableCell key={i} className="text-right font-mono text-muted-foreground">
                          {i === projectionYears - 1 ? formatMoney(terminalValue) : '-'}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-mono font-medium">{formatMoney(terminalValue)}</TableCell>
                    </TableRow>

                    <TableRow className="bg-muted/20">
                      <TableCell className="sticky left-0 bg-muted/20 font-medium">
                        Discount Factor
                        <span className="text-xs text-muted-foreground ml-1">@ {(discountRate * 100).toFixed(1)}%</span>
                      </TableCell>
                      {pvFactors.map((pv, i) => (
                        <TableCell key={i} className="text-right font-mono text-muted-foreground">
                          {pv.toFixed(4)}
                        </TableCell>
                      ))}
                      <TableCell className="text-right text-muted-foreground">-</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="sticky left-0 bg-card">PV of Cash Flows</TableCell>
                      {pvCashFlows.map((pv, i) => (
                        <TableCell key={i} className={`text-right font-mono ${pv < 0 ? 'text-destructive' : ''}`}>
                          {formatMoney(pv)}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-mono font-medium">{formatMoney(totalPVOperating)}</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="sticky left-0 bg-card">PV of Terminal Value</TableCell>
                      {Array.from({ length: projectionYears }, (_, i) => (
                        <TableCell key={i} className="text-right font-mono text-muted-foreground">
                          {i === projectionYears - 1 ? formatMoney(pvTerminal) : '-'}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-mono font-medium">{formatMoney(pvTerminal)}</TableCell>
                    </TableRow>

                    <TableRow className="bg-primary/10 font-bold">
                      <TableCell className="sticky left-0 bg-primary/10">DCF Portfolio Value</TableCell>
                      {Array.from({ length: projectionYears }, (_, i) => {
                        let cumPV = 0;
                        for (let j = 0; j <= i; j++) cumPV += pvCashFlows[j];
                        if (i === projectionYears - 1) cumPV += pvTerminal;
                        return (
                          <TableCell key={i} className="text-right font-mono">{formatMoney(cumPV)}</TableCell>
                        );
                      })}
                      <TableCell className="text-right font-mono">{formatMoney(dcfValue)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            );
          })()}
        </CardContent>
      </Card>

    </>
  );
}
