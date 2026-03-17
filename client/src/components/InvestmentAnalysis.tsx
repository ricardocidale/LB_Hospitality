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
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { ChevronDown, ChevronRight } from "@/components/icons/themed-icons";
import { formatMoney, getFiscalYearForModelYear } from "@/lib/financialEngine";
import {
  PROJECTION_YEARS,
  DEFAULT_EXIT_CAP_RATE,
  DEFAULT_PROPERTY_TAX_RATE,
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
              <InfoTooltip text="Total initial capital required from investors across all properties, including purchase price, improvements, pre-opening costs, and operating reserves (net of any financing)." manualSection="investment-returns" />
            </p>
            <div className="text-2xl font-bold text-foreground font-mono">{formatMoney(totalInitialEquityIA)}</div>
          </div>

          <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
            <p className="text-sm font-medium text-foreground/70 flex items-center mb-2">
              Exit Value ({getFiscalYear(projectionYears - 1)})
              <InfoTooltip text={`Projected sale value of all properties at ${getFiscalYear(10)}, calculated as NOI ÷ Exit Cap Rate, minus any outstanding debt at time of sale.`} manualSection="investment-returns" />
            </p>
            <div className="text-2xl font-bold text-emerald-600 font-mono">{formatMoney(totalExitValueIA)}</div>
          </div>

          <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
            <p className="text-sm font-medium text-foreground/70 flex items-center mb-2">
              Equity Multiple
              <InfoTooltip text="Total cash returned divided by total equity invested. A 2.0x multiple means investors received $2 for every $1 invested." manualSection="investment-returns" manualLabel="MOIC formula in the Manual" />
            </p>
            <div className="text-2xl font-bold text-blue-600 font-mono">{equityMultipleIA.toFixed(2)}x</div>
          </div>

          <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
            <p className="text-sm font-medium text-foreground/70 flex items-center mb-2">
              Avg Cash-on-Cash
              <InfoTooltip text="Average annual operating cash flow (excluding exit proceeds) as a percentage of total equity invested. Measures the annual yield on invested capital." />
            </p>
            <div className="text-2xl font-bold text-amber-600 font-mono">{cashOnCashIA.toFixed(1)}%</div>
          </div>

          <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
            <p className="text-sm font-medium text-foreground/70 flex items-center mb-2">
              Portfolio IRR
              <InfoTooltip text="Internal Rate of Return — the annualized return that makes the net present value of all cash flows equal to zero." manualSection="investment-returns" manualLabel="IRR methodology in the Manual" />
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
                  <InfoTooltip text="GAAP FCFE = Cash from Operations - Principal Payments. For hotels where FF&E reserves are included in NOI, this equals After-Tax Cash Flow (ATCF)." manualSection="investment-returns" manualLabel="FCFE formula in the Manual" />
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
                        {formatMoney(getYearlyConsolidated(y)?.anoi ?? 0)}
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
                      <InfoTooltip text="BTCF = ANOI − Debt Service. Cash available before income taxes." manualSection="property-formulas" />
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
                      <InfoTooltip text="ATCF = BTCF - Tax Liability. Cash available to investors after all taxes paid." manualSection="property-formulas" />
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
                        <span className="text-xs ml-2">({((prop.taxRate ?? DEFAULT_PROPERTY_TAX_RATE) * 100).toFixed(0)}% income tax)</span>
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
                    <InfoTooltip text="Capitalization rate used to value the property at sale. Lower cap rate = higher valuation." manualSection="investment-returns" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Exit Value ({getFiscalYear(10)})</TableHead>
                <TableHead className="text-right">Total Distributions</TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    Equity Multiple
                    <InfoTooltip text="Total cash returned divided by total equity invested. A 2.0x multiple means investors received $2 for every $1 invested." manualSection="investment-returns" />
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    IRR
                    <InfoTooltip text="Internal Rate of Return — the annualized return that makes the net present value of all cash flows equal to zero." manualSection="investment-returns" />
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
                    <TableCell className="text-right">{((prop.taxRate ?? DEFAULT_PROPERTY_TAX_RATE) * 100).toFixed(0)}%</TableCell>
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
            Discounted Cash Flow (DCF) Analysis — Per Property
            <InfoTooltip text="Per-property DCF valuation using individual WACC for each property. Each property's cost of equity = base Re + country risk premium (Damodaran). WACC = (E/V × Re) + (D/V × Rd × (1−T))." manualSection="investment-returns" />
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Individual property valuations with country-adjusted discount rates (source: Damodaran Jan 2026)
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {(() => {
            const baseCostOfEquity = global?.costOfEquity ?? DEFAULT_COST_OF_EQUITY;

            interface PropertyDCF {
              name: string;
              location: string;
              country: string;
              crp: number;
              costOfEquity: number;
              equity: number;
              debt: number;
              debtRate: number;
              taxRate: number;
              wacc: number;
              equityWeight: number;
              debtWeight: number;
              afterTaxDebtCost: number;
              yearlyATCF: number[];
              exitValue: number;
              pvCashFlows: number[];
              pvTerminal: number;
              dcfValue: number;
              npv: number;
              valueCreation: number;
            }

            const propDCFs: PropertyDCF[] = properties.map((prop, pi) => {
              const crp = prop.countryRiskPremium ?? 0;
              const location = prop.location ?? '';
              const costOfEquity = baseCostOfEquity + crp;

              const equity = propertyEquityInvested(prop);
              const isFullEquity = prop.type === 'Full Equity';
              const debt = isFullEquity ? 0 : (prop.purchasePrice ?? 0) * (prop.acquisitionLTV ?? 0);
              const debtRate = prop.acquisitionInterestRate ?? 0.09;
              const taxRate = prop.taxRate ?? DEFAULT_PROPERTY_TAX_RATE;

              const totalCapital = equity + debt;
              const equityWeight = totalCapital > 0 ? equity / totalCapital : 1;
              const debtWeight = totalCapital > 0 ? debt / totalCapital : 0;
              const afterTaxDebtCost = debtRate * (1 - taxRate);
              const wacc = (equityWeight * costOfEquity) + (debtWeight * afterTaxDebtCost);
              const discountRate = wacc > 0 ? wacc : 0.10;

              const yearly = allPropertyYearlyCF[pi];
              const yearlyATCF = Array.from({ length: projectionYears }, (_, y) =>
                yearly?.[y]?.atcf ?? 0
              );
              const exitValue = yearly?.[projectionYears - 1]?.exitValue ?? 0;

              const pvFactors = Array.from({ length: projectionYears }, (_, y) =>
                1 / Math.pow(1 + discountRate, y + 1)
              );
              const pvCashFlows = yearlyATCF.map((cf, y) => cf * pvFactors[y]);
              const pvTerminal = exitValue * pvFactors[projectionYears - 1];
              const dcfValue = pvCashFlows.reduce((s, pv) => s + pv, 0) + pvTerminal;
              const npv = dcfValue - equity;
              const valueCreation = equity > 0 ? (npv / equity) * 100 : 0;

              let country = 'Unknown';
              const loc = location.toLowerCase();
              if (/colombia|medell[ií]n|bogot[aá]|cartagena|antioquia/i.test(loc)) country = 'Colombia';
              else if (/new york|utah|california|texas|florida|catskills|sullivan|ogden/i.test(loc)) country = 'United States';

              return {
                name: prop.name,
                location,
                country,
                crp,
                costOfEquity,
                equity,
                debt,
                debtRate,
                taxRate,
                wacc: discountRate,
                equityWeight,
                debtWeight,
                afterTaxDebtCost,
                yearlyATCF,
                exitValue,
                pvCashFlows,
                pvTerminal,
                dcfValue,
                npv,
                valueCreation,
              };
            });

            const portfolioEquity = propDCFs.reduce((s, p) => s + p.equity, 0);
            const portfolioDCF = propDCFs.reduce((s, p) => s + p.dcfValue, 0);
            const portfolioNPV = propDCFs.reduce((s, p) => s + p.npv, 0);
            const portfolioValueCreation = portfolioEquity > 0 ? (portfolioNPV / portfolioEquity) * 100 : 0;

            const portfolioTotalCapital = propDCFs.reduce((s, p) => s + p.equity + p.debt, 0);
            const portfolioWACC = portfolioTotalCapital > 0
              ? propDCFs.reduce((s, p) => s + p.wacc * ((p.equity + p.debt) / portfolioTotalCapital), 0)
              : 0;

            return (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
                    <p className="text-sm font-medium text-foreground/70 flex items-center mb-2" data-testid="text-portfolio-wacc-label">
                      Portfolio WACC
                      <InfoTooltip text={`Capital-weighted average WACC across all properties. Base Re: ${(baseCostOfEquity * 100).toFixed(0)}% + per-property country risk premium (Damodaran).`} manualSection="investment-returns" />
                    </p>
                    <div className="text-2xl font-bold text-foreground font-mono" data-testid="text-portfolio-wacc">{(portfolioWACC * 100).toFixed(1)}%</div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Base Re: {(baseCostOfEquity * 100).toFixed(0)}% + country risk
                    </p>
                  </div>
                  <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
                    <p className="text-sm font-medium text-foreground/70 flex items-center mb-2">
                      DCF Portfolio Value
                      <InfoTooltip text="Sum of individual property DCF values. Each property discounted at its own WACC." />
                    </p>
                    <div className="text-2xl font-bold text-foreground font-mono" data-testid="text-portfolio-dcf">{formatMoney(portfolioDCF)}</div>
                  </div>
                  <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
                    <p className="text-sm font-medium text-foreground/70 flex items-center mb-2">
                      Net Present Value (NPV)
                      <InfoTooltip text="Sum of individual property NPVs. Positive = portfolio creates value above the required return." />
                    </p>
                    <div className={`text-2xl font-bold font-mono ${portfolioNPV >= 0 ? 'text-accent' : 'text-destructive'}`} data-testid="text-portfolio-npv">
                      {formatMoney(portfolioNPV)}
                    </div>
                  </div>
                  <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
                    <p className="text-sm font-medium text-foreground/70 flex items-center mb-2">
                      Value Creation
                      <InfoTooltip text="Portfolio NPV as % of total equity. Positive = investment exceeds required return." />
                    </p>
                    <div className={`text-2xl font-bold font-mono ${portfolioValueCreation >= 0 ? 'text-accent' : 'text-destructive'}`} data-testid="text-portfolio-value-creation">
                      {portfolioValueCreation >= 0 ? '+' : ''}{portfolioValueCreation.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-card min-w-[220px]">Property</TableHead>
                      <TableHead className="text-right min-w-[90px]">Country</TableHead>
                      <TableHead className="text-right min-w-[70px]">
                        <span className="flex items-center justify-end gap-1">
                          CRP
                          <InfoTooltip text="Country Risk Premium (Damodaran). Additional equity return required for country-specific risk." />
                        </span>
                      </TableHead>
                      <TableHead className="text-right min-w-[70px]">
                        <span className="flex items-center justify-end gap-1">
                          Re
                          <InfoTooltip text="Cost of Equity = Base Re + Country Risk Premium" />
                        </span>
                      </TableHead>
                      <TableHead className="text-right min-w-[70px]">E/V</TableHead>
                      <TableHead className="text-right min-w-[70px]">WACC</TableHead>
                      <TableHead className="text-right min-w-[100px]">Equity</TableHead>
                      <TableHead className="text-right min-w-[100px]">DCF Value</TableHead>
                      <TableHead className="text-right min-w-[100px]">NPV</TableHead>
                      <TableHead className="text-right min-w-[80px]">Value Δ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {propDCFs.map((d, i) => (
                      <TableRow key={i} className="cursor-pointer hover:bg-muted/20" onClick={() => toggleRow(`dcf-${i}`)} data-testid={`row-dcf-property-${i}`}>
                        <TableCell className="sticky left-0 bg-card font-medium">
                          <div className="flex items-center gap-2">
                            {expandedRows.has(`dcf-${i}`) ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className="truncate">{d.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm">{d.country}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {d.crp > 0 ? `+${(d.crp * 100).toFixed(1)}%` : '0%'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{(d.costOfEquity * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-right font-mono text-sm">{(d.equityWeight * 100).toFixed(0)}%</TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">{(d.wacc * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatMoney(d.equity)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatMoney(d.dcfValue)}</TableCell>
                        <TableCell className={`text-right font-mono text-sm ${d.npv >= 0 ? 'text-accent' : 'text-destructive'}`}>
                          {formatMoney(d.npv)}
                        </TableCell>
                        <TableCell className={`text-right font-mono text-sm font-medium ${d.valueCreation >= 0 ? 'text-accent' : 'text-destructive'}`}>
                          {d.valueCreation >= 0 ? '+' : ''}{d.valueCreation.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                    {propDCFs.map((d, i) => expandedRows.has(`dcf-${i}`) && (
                      <TableRow key={`detail-${i}`} className="bg-muted/10">
                        <TableCell colSpan={10} className="p-4">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="min-w-[160px]">{d.name}</TableHead>
                                  {Array.from({ length: projectionYears }, (_, y) => (
                                    <TableHead key={y} className="text-right min-w-[100px]">{getFiscalYear(y)}</TableHead>
                                  ))}
                                  <TableHead className="text-right min-w-[110px] font-bold">Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <TableRow>
                                  <TableCell>ATCF</TableCell>
                                  {d.yearlyATCF.map((cf, y) => (
                                    <TableCell key={y} className={`text-right font-mono ${cf < 0 ? 'text-destructive' : ''}`}>
                                      {formatMoney(cf)}
                                    </TableCell>
                                  ))}
                                  <TableCell className="text-right font-mono font-medium">
                                    {formatMoney(d.yearlyATCF.reduce((a, b) => a + b, 0))}
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Terminal Value</TableCell>
                                  {Array.from({ length: projectionYears }, (_, y) => (
                                    <TableCell key={y} className="text-right font-mono text-muted-foreground">
                                      {y === projectionYears - 1 ? formatMoney(d.exitValue) : '-'}
                                    </TableCell>
                                  ))}
                                  <TableCell className="text-right font-mono font-medium">{formatMoney(d.exitValue)}</TableCell>
                                </TableRow>
                                <TableRow className="bg-muted/20">
                                  <TableCell className="font-medium">
                                    Discount Factor <span className="text-xs text-muted-foreground">@ {(d.wacc * 100).toFixed(1)}%</span>
                                  </TableCell>
                                  {Array.from({ length: projectionYears }, (_, y) => (
                                    <TableCell key={y} className="text-right font-mono text-muted-foreground">
                                      {(1 / Math.pow(1 + d.wacc, y + 1)).toFixed(4)}
                                    </TableCell>
                                  ))}
                                  <TableCell className="text-right text-muted-foreground">-</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>PV of Cash Flows</TableCell>
                                  {d.pvCashFlows.map((pv, y) => (
                                    <TableCell key={y} className={`text-right font-mono ${pv < 0 ? 'text-destructive' : ''}`}>
                                      {formatMoney(pv)}
                                    </TableCell>
                                  ))}
                                  <TableCell className="text-right font-mono font-medium">
                                    {formatMoney(d.pvCashFlows.reduce((a, b) => a + b, 0))}
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>PV of Terminal</TableCell>
                                  {Array.from({ length: projectionYears }, (_, y) => (
                                    <TableCell key={y} className="text-right font-mono text-muted-foreground">
                                      {y === projectionYears - 1 ? formatMoney(d.pvTerminal) : '-'}
                                    </TableCell>
                                  ))}
                                  <TableCell className="text-right font-mono font-medium">{formatMoney(d.pvTerminal)}</TableCell>
                                </TableRow>
                                <TableRow className="bg-primary/10 font-bold">
                                  <TableCell>DCF Value</TableCell>
                                  {Array.from({ length: projectionYears }, (_, y) => {
                                    let cumPV = 0;
                                    for (let j = 0; j <= y; j++) cumPV += d.pvCashFlows[j];
                                    if (y === projectionYears - 1) cumPV += d.pvTerminal;
                                    return (
                                      <TableCell key={y} className="text-right font-mono">{formatMoney(cumPV)}</TableCell>
                                    );
                                  })}
                                  <TableCell className="text-right font-mono">{formatMoney(d.dcfValue)}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-primary/10 font-bold border-t-2" data-testid="row-dcf-portfolio-total">
                      <TableCell className="sticky left-0 bg-primary/10">Portfolio Total</TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right font-mono">{(portfolioWACC * 100).toFixed(1)}%</TableCell>
                      <TableCell className="text-right font-mono">{formatMoney(portfolioEquity)}</TableCell>
                      <TableCell className="text-right font-mono">{formatMoney(portfolioDCF)}</TableCell>
                      <TableCell className={`text-right font-mono ${portfolioNPV >= 0 ? 'text-accent' : 'text-destructive'}`}>
                        {formatMoney(portfolioNPV)}
                      </TableCell>
                      <TableCell className={`text-right font-mono ${portfolioValueCreation >= 0 ? 'text-accent' : 'text-destructive'}`}>
                        {portfolioValueCreation >= 0 ? '+' : ''}{portfolioValueCreation.toFixed(1)}%
                      </TableCell>
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
