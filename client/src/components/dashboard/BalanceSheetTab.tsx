import React, { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, ChevronsUpDown } from "@/components/icons/themed-icons";
import { formatMoney } from "@/lib/financialEngine";
import { CalcDetailsProvider } from "@/components/financial-table";
import { FinancialChart } from "@/components/ui/financial-chart";
import { DashboardTabProps } from "./types";
import { useExpandableRows } from "./useExpandableRows";
import { propertyEquityInvested, acquisitionYearIndex } from "@/lib/financial/equityCalculations";
import { MONTHS_PER_YEAR } from "@/lib/constants";


function MetricItemRow({ label, values }: { label: string; values: string[] }) {
  return (
    <TableRow data-testid={`row-bs-metric-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
      <TableCell className="pl-10 sticky left-0 bg-card z-10 text-sm text-muted-foreground italic">{label}</TableCell>
      {values.map((val, i) => (
        <TableCell key={i} className="text-right font-mono text-sm text-muted-foreground italic">
          {val}
        </TableCell>
      ))}
    </TableRow>
  );
}

interface YearlyPerPropertyBS {
  cash: number;
  ppe: number;
  accDep: number;
  deferredFinancing: number;
  totalAssets: number;
  debtOutstanding: number;
  equityInvested: number;
  retainedEarnings: number;
}

export function BalanceSheetTab({ financials, properties, global, projectionYears, getFiscalYear, showCalcDetails }: DashboardTabProps) {
  const BS_ROW_KEYS = useMemo(() => ["assets", "liabilities", "equity", "metrics"], []);
  const { expandedRows, expandedFormulas, toggleRow, toggleFormula, toggleAll, allRowsExpanded } = useExpandableRows(BS_ROW_KEYS);

  const years = Array.from({ length: projectionYears }, (_, i) => getFiscalYear(i));

  const yearlyData = useMemo(() => {
    const allProFormas = financials.allPropertyFinancials;

    const consolidatedCash: number[] = [];
    const consolidatedPPE: number[] = [];
    const consolidatedAccDep: number[] = [];
    const consolidatedDeferredFC: number[] = [];
    const consolidatedTotalAssets: number[] = [];
    const consolidatedDebt: number[] = [];
    const consolidatedEquity: number[] = [];
    const consolidatedRetained: number[] = [];
    const consolidatedTotalLiabilities: number[] = [];
    const consolidatedTotalEquity: number[] = [];
    const consolidatedTotalLE: number[] = [];
    const perPropertyByYear: Map<number, YearlyPerPropertyBS>[] = [];

    for (let y = 0; y < projectionYears; y++) {
      let totalCash = 0;
      let totalPPE = 0;
      let totalAccDep = 0;
      let totalDeferredFC = 0;
      let totalDebt = 0;
      let totalEquityInvested = 0;
      let totalRetained = 0;
      let totalPreOpening = 0;

      const perPropThisYear: Map<number, YearlyPerPropertyBS> = new Map();

      allProFormas.forEach(({ property: prop, financials: proForma }, propIdx) => {
        const acqYear = acquisitionYearIndex(prop.acquisitionDate, prop.operationsStartDate, global.modelStartDate);
        if (y < acqYear) return;

        const monthsToInclude = (y + 1) * MONTHS_PER_YEAR;
        const relevantMonths = proForma.slice(0, monthsToInclude);

        const propValue = prop.purchasePrice + prop.buildingImprovements;
        const accDep = relevantMonths.reduce((sum, m) => sum + m.depreciationExpense, 0);
        const operatingReserve = prop.operatingReserve ?? 0;
        const preOpening = prop.preOpeningCosts ?? 0;
        const equityInvested = propertyEquityInvested(prop);

        const lastMonthIdx = monthsToInclude - 1;
        const debtOutstanding = lastMonthIdx >= 0 && lastMonthIdx < proForma.length
          ? proForma[lastMonthIdx].debtOutstanding
          : 0;

        let cumulativeInterest = 0;
        let cumulativePrincipal = 0;
        let refiProceeds = 0;
        let deferredFC = 0;

        for (let m = 0; m < relevantMonths.length; m++) {
          cumulativeInterest += relevantMonths[m].interestExpense;
          cumulativePrincipal += relevantMonths[m].principalPayment;
          refiProceeds += relevantMonths[m].refinancingProceeds;

          if (relevantMonths[m].refinancingProceeds > 0) {
            const debtBefore = m > 0 ? relevantMonths[m - 1].debtOutstanding : 0;
            const debtAfter = relevantMonths[m].debtOutstanding;
            const principalInRefiMonth = relevantMonths[m].principalPayment;
            const newLoanAmount = debtAfter + principalInRefiMonth;
            const refiClosingCosts = newLoanAmount - debtBefore - relevantMonths[m].refinancingProceeds;
            if (refiClosingCosts > 0) deferredFC += refiClosingCosts;
          }
        }

        const netIncome = relevantMonths.reduce((sum, m) => sum + m.netIncome, 0);
        const cumulativeANOI = relevantMonths.reduce((sum, m) => sum + m.anoi, 0);
        const incomeTax = relevantMonths.reduce((sum, m) => sum + m.incomeTax, 0);
        const debtService = cumulativeInterest + cumulativePrincipal;
        const operatingCF = cumulativeANOI - debtService - incomeTax;
        const cash = operatingReserve + operatingCF + refiProceeds;
        const netFixed = propValue - accDep;
        const propTotalAssets = netFixed + cash + deferredFC;
        const retained = netIncome - preOpening;

        totalCash += cash;
        totalPPE += propValue;
        totalAccDep += accDep;
        totalDeferredFC += deferredFC;
        totalDebt += debtOutstanding;
        totalEquityInvested += equityInvested;
        totalRetained += retained;
        totalPreOpening += preOpening;

        perPropThisYear.set(propIdx, {
          cash,
          ppe: propValue,
          accDep,
          deferredFinancing: deferredFC,
          totalAssets: propTotalAssets,
          debtOutstanding,
          equityInvested,
          retainedEarnings: retained,
        });
      });

      const netFixed = totalPPE - totalAccDep;
      const totalAssets = netFixed + totalCash + totalDeferredFC;
      const totalLiabilities = totalDebt;
      const totalEq = totalEquityInvested + totalRetained;
      const totalLE = totalLiabilities + totalEq;

      consolidatedCash.push(totalCash);
      consolidatedPPE.push(totalPPE);
      consolidatedAccDep.push(totalAccDep);
      consolidatedDeferredFC.push(totalDeferredFC);
      consolidatedTotalAssets.push(totalAssets);
      consolidatedDebt.push(totalDebt);
      consolidatedEquity.push(totalEquityInvested);
      consolidatedRetained.push(totalRetained);
      consolidatedTotalLiabilities.push(totalLiabilities);
      consolidatedTotalEquity.push(totalEq);
      consolidatedTotalLE.push(totalLE);
      perPropertyByYear.push(perPropThisYear);
    }

    return {
      consolidatedCash,
      consolidatedPPE,
      consolidatedAccDep,
      consolidatedDeferredFC,
      consolidatedTotalAssets,
      consolidatedDebt,
      consolidatedEquity,
      consolidatedRetained,
      consolidatedTotalLiabilities,
      consolidatedTotalEquity,
      consolidatedTotalLE,
      perPropertyByYear,
    };
  }, [financials.allPropertyFinancials, projectionYears, global.modelStartDate]);

  const chartData = useMemo(() => {
    return years.map((year, y) => ({
      year,
      Assets: yearlyData.consolidatedTotalAssets[y],
      Liabilities: yearlyData.consolidatedTotalLiabilities[y],
      Equity: yearlyData.consolidatedTotalEquity[y],
    }));
  }, [years, yearlyData]);

  const {
    consolidatedCash,
    consolidatedPPE,
    consolidatedAccDep,
    consolidatedDeferredFC,
    consolidatedTotalAssets,
    consolidatedDebt,
    consolidatedEquity,
    consolidatedRetained,
    consolidatedTotalLiabilities,
    consolidatedTotalEquity,
    consolidatedTotalLE,
    perPropertyByYear,
  } = yearlyData;

  const consolidatedNetFixed = useMemo(() =>
    years.map((_, y) => consolidatedPPE[y] - consolidatedAccDep[y]),
    [consolidatedPPE, consolidatedAccDep, years]
  );

  return (
    <div className="space-y-6">
      <FinancialChart
        data={chartData}
        series={[
          { dataKey: "Assets", name: "Total Assets", color: "hsl(var(--chart-2))", gradientTo: "hsl(var(--chart-2) / 0.5)" },
          { dataKey: "Liabilities", name: "Total Liabilities", color: "hsl(var(--chart-5))", gradientTo: "hsl(var(--chart-5) / 0.5)" },
          { dataKey: "Equity", name: "Total Equity", color: "hsl(var(--line-3))", gradientTo: "hsl(var(--line-3) / 0.5)" },
        ]}
        title={`Balance Sheet Trends (${projectionYears}-Year Projection)`}
        id="dashboard-balance-chart"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <CardTitle>Consolidated Balance Sheet</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAll}
              className="text-xs text-muted-foreground h-7 px-2"
              data-testid="button-toggle-all-bs"
            >
              <ChevronsUpDown className="h-3.5 w-3.5 mr-1" />
              {allRowsExpanded ? "Collapse All" : "Expand All"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <CalcDetailsProvider show={showCalcDetails}>
            <div className="rounded-md border overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[280px] sticky left-0 bg-muted/50 z-10">Account</TableHead>
                    {years.map(year => (
                      <TableHead key={year} className="text-right">{year}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* ══════════════════════════════════════
                       ASSETS (ASC 210 / USALI Chapter 12)
                     ══════════════════════════════════════ */}
                  <TableRow className="bg-muted/20 font-bold" onClick={() => toggleRow("assets")} style={{ cursor: 'pointer' }} data-testid="row-assets-header">
                    <TableCell className="sticky left-0 bg-card z-10">
                      <div className="flex items-center gap-2">
                        {expandedRows.has("assets") ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        TOTAL ASSETS
                      </div>
                    </TableCell>
                    {consolidatedTotalAssets.map((val, i) => (
                      <TableCell key={i} className="text-right font-mono">{formatMoney(val)}</TableCell>
                    ))}
                  </TableRow>
                  {expandedRows.has("assets") && (
                    <>
                      {/* Assets Formula */}
                      <TableRow
                        className="bg-chart-1/5 cursor-pointer hover:bg-chart-1/5"
                        data-expandable-row="true"
                        onClick={() => toggleFormula("assets-formula")}
                      >
                        <TableCell className="pl-10 sticky left-0 bg-chart-1/5 z-10 py-0.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            {expandedFormulas.has("assets-formula") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            <span className="italic">Formula</span>
                          </div>
                        </TableCell>
                        {consolidatedTotalAssets.map((_, i) => (
                          <TableCell key={i} className="py-0.5" />
                        ))}
                      </TableRow>
                      {expandedFormulas.has("assets-formula") && (
                        <TableRow className="bg-chart-1/3" data-expandable-row="true">
                          <TableCell className="pl-14 sticky left-0 bg-chart-1/3 z-10 py-0.5 text-xs text-muted-foreground italic">
                            = Current Assets + Net Fixed Assets + Other Assets
                          </TableCell>
                          {consolidatedTotalAssets.map((val, i) => (
                            <TableCell key={i} className="text-right font-mono text-xs text-muted-foreground py-0.5">
                              {formatMoney(val)}
                            </TableCell>
                          ))}
                        </TableRow>
                      )}

                      {/* ── Current Assets ── */}
                      <TableRow data-testid="row-bs-current-assets-header">
                        <TableCell className="pl-10 sticky left-0 bg-card z-10 text-sm font-semibold">Current Assets</TableCell>
                        {years.map((_, i) => (<TableCell key={i} />))}
                      </TableRow>

                      {/* Cash & Cash Equivalents [chevron → per-property] */}
                      <TableRow
                        className="cursor-pointer hover:bg-muted/10"
                        onClick={() => toggleFormula("cash-detail")}
                        data-testid="row-bs-cash"
                      >
                        <TableCell className="pl-14 sticky left-0 bg-card z-10 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            {expandedFormulas.has("cash-detail") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            Cash & Cash Equivalents
                          </div>
                        </TableCell>
                        {consolidatedCash.map((val, i) => (
                          <TableCell key={i} className="text-right font-mono text-sm text-muted-foreground">{formatMoney(val)}</TableCell>
                        ))}
                      </TableRow>
                      {expandedFormulas.has("cash-detail") && (
                        <>
                          <TableRow className="bg-chart-1/3" data-expandable-row="true">
                            <TableCell className="pl-[72px] sticky left-0 bg-chart-1/3 z-10 py-0.5 text-xs text-muted-foreground italic">
                              = Operating Reserves + Cumulative Cash Flow + Refinancing Proceeds
                            </TableCell>
                            {consolidatedCash.map((val, i) => (
                              <TableCell key={i} className="text-right font-mono text-xs text-muted-foreground py-0.5">{formatMoney(val)}</TableCell>
                            ))}
                          </TableRow>
                          {properties.map((prop, idx) => (
                            <TableRow key={idx} data-expandable-row="true">
                              <TableCell className="pl-[72px] sticky left-0 bg-card z-10 text-muted-foreground text-xs">{prop.name}</TableCell>
                              {years.map((_, y) => (
                                <TableCell key={y} className="text-right font-mono text-muted-foreground text-xs">
                                  {formatMoney(perPropertyByYear[y]?.get(idx)?.cash ?? 0)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </>
                      )}

                      {/* Total Current Assets subtotal */}
                      <TableRow data-testid="row-bs-total-current-assets">
                        <TableCell className="pl-10 sticky left-0 bg-card z-10 text-sm font-semibold border-t">Total Current Assets</TableCell>
                        {consolidatedCash.map((val, i) => (
                          <TableCell key={i} className="text-right font-mono text-sm font-semibold border-t">{formatMoney(val)}</TableCell>
                        ))}
                      </TableRow>

                      {/* ── Fixed Assets (ASC 360) ── */}
                      <TableRow data-testid="row-bs-fixed-assets-header">
                        <TableCell className="pl-10 sticky left-0 bg-card z-10 text-sm font-semibold">Fixed Assets</TableCell>
                        {years.map((_, i) => (<TableCell key={i} />))}
                      </TableRow>

                      {/* PP&E [chevron → per-property] */}
                      <TableRow
                        className="cursor-pointer hover:bg-muted/10"
                        onClick={() => toggleFormula("ppe-detail")}
                        data-testid="row-bs-ppe"
                      >
                        <TableCell className="pl-14 sticky left-0 bg-card z-10 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            {expandedFormulas.has("ppe-detail") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            Property, Plant & Equipment
                          </div>
                        </TableCell>
                        {consolidatedPPE.map((val, i) => (
                          <TableCell key={i} className="text-right font-mono text-sm text-muted-foreground">{formatMoney(val)}</TableCell>
                        ))}
                      </TableRow>
                      {expandedFormulas.has("ppe-detail") && properties.map((prop, idx) => (
                        <TableRow key={idx} data-expandable-row="true">
                          <TableCell className="pl-[72px] sticky left-0 bg-card z-10 text-muted-foreground text-xs">{prop.name}</TableCell>
                          {years.map((_, y) => (
                            <TableCell key={y} className="text-right font-mono text-muted-foreground text-xs">
                              {formatMoney(perPropertyByYear[y]?.get(idx)?.ppe ?? 0)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}

                      {/* Accumulated Depreciation [chevron → per-property] */}
                      <TableRow
                        className="cursor-pointer hover:bg-muted/10"
                        onClick={() => toggleFormula("accdep-detail")}
                        data-testid="row-bs-accdep"
                      >
                        <TableCell className="pl-14 sticky left-0 bg-card z-10 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            {expandedFormulas.has("accdep-detail") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            Less: Accumulated Depreciation
                          </div>
                        </TableCell>
                        {consolidatedAccDep.map((val, i) => (
                          <TableCell key={i} className="text-right font-mono text-sm text-muted-foreground">{formatMoney(-val)}</TableCell>
                        ))}
                      </TableRow>
                      {expandedFormulas.has("accdep-detail") && (
                        <>
                          <TableRow className="bg-chart-1/3" data-expandable-row="true">
                            <TableCell className="pl-[72px] sticky left-0 bg-chart-1/3 z-10 py-0.5 text-xs text-muted-foreground italic">
                              Straight-line over 27.5 years (ASC 360)
                            </TableCell>
                            {consolidatedAccDep.map((val, i) => (
                              <TableCell key={i} className="text-right font-mono text-xs text-muted-foreground py-0.5">{formatMoney(-val)}</TableCell>
                            ))}
                          </TableRow>
                          {properties.map((prop, idx) => (
                            <TableRow key={idx} data-expandable-row="true">
                              <TableCell className="pl-[72px] sticky left-0 bg-card z-10 text-muted-foreground text-xs">{prop.name}</TableCell>
                              {years.map((_, y) => (
                                <TableCell key={y} className="text-right font-mono text-muted-foreground text-xs">
                                  {formatMoney(-(perPropertyByYear[y]?.get(idx)?.accDep ?? 0))}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </>
                      )}

                      {/* Net Fixed Assets subtotal */}
                      <TableRow data-testid="row-bs-net-fixed-assets">
                        <TableCell className="pl-10 sticky left-0 bg-card z-10 text-sm font-semibold border-t">Net Fixed Assets</TableCell>
                        {consolidatedNetFixed.map((val, i) => (
                          <TableCell key={i} className="text-right font-mono text-sm font-semibold border-t">{formatMoney(val)}</TableCell>
                        ))}
                      </TableRow>

                      {/* ── Other Assets (ASC 835-30) ── */}
                      {consolidatedDeferredFC.some(v => v > 0) && (
                        <>
                          <TableRow data-testid="row-bs-other-assets-header">
                            <TableCell className="pl-10 sticky left-0 bg-card z-10 text-sm font-semibold">Other Assets</TableCell>
                            {years.map((_, i) => (<TableCell key={i} />))}
                          </TableRow>

                          {/* Deferred Financing Costs [chevron → per-property] */}
                          <TableRow
                            className="cursor-pointer hover:bg-muted/10"
                            onClick={() => toggleFormula("deferredfc-detail")}
                            data-testid="row-bs-deferred-financing"
                          >
                            <TableCell className="pl-14 sticky left-0 bg-card z-10 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                {expandedFormulas.has("deferredfc-detail") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                Deferred Financing Costs
                              </div>
                            </TableCell>
                            {consolidatedDeferredFC.map((val, i) => (
                              <TableCell key={i} className="text-right font-mono text-sm text-muted-foreground">{formatMoney(val)}</TableCell>
                            ))}
                          </TableRow>
                          {expandedFormulas.has("deferredfc-detail") && (
                            <>
                              <TableRow className="bg-chart-1/3" data-expandable-row="true">
                                <TableCell className="pl-[72px] sticky left-0 bg-chart-1/3 z-10 py-0.5 text-xs text-muted-foreground italic">
                                  Refinancing closing costs capitalized per ASC 835-30
                                </TableCell>
                                {consolidatedDeferredFC.map((val, i) => (
                                  <TableCell key={i} className="text-right font-mono text-xs text-muted-foreground py-0.5">{formatMoney(val)}</TableCell>
                                ))}
                              </TableRow>
                              {properties.map((prop, idx) => {
                                const hasAny = years.some((_, y) => (perPropertyByYear[y]?.get(idx)?.deferredFinancing ?? 0) > 0);
                                if (!hasAny) return null;
                                return (
                                  <TableRow key={idx} data-expandable-row="true">
                                    <TableCell className="pl-[72px] sticky left-0 bg-card z-10 text-muted-foreground text-xs">{prop.name}</TableCell>
                                    {years.map((_, y) => (
                                      <TableCell key={y} className="text-right font-mono text-muted-foreground text-xs">
                                        {formatMoney(perPropertyByYear[y]?.get(idx)?.deferredFinancing ?? 0)}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                );
                              })}
                            </>
                          )}
                        </>
                      )}

                      {/* Per-Property Total Assets breakdown */}
                      <TableRow
                        className="cursor-pointer hover:bg-muted/10"
                        onClick={() => toggleFormula("assets-by-entity")}
                        data-testid="row-bs-assets-by-entity"
                      >
                        <TableCell className="pl-10 sticky left-0 bg-card z-10 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            {expandedFormulas.has("assets-by-entity") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            Assets by Entity (SPV)
                          </div>
                        </TableCell>
                        {consolidatedTotalAssets.map((val, i) => (
                          <TableCell key={i} className="text-right font-mono text-sm text-muted-foreground">{formatMoney(val)}</TableCell>
                        ))}
                      </TableRow>
                      {expandedFormulas.has("assets-by-entity") && properties.map((prop, idx) => (
                        <TableRow key={idx} data-expandable-row="true">
                          <TableCell className="pl-14 sticky left-0 bg-card z-10 text-muted-foreground text-xs">{prop.name}</TableCell>
                          {years.map((_, y) => (
                            <TableCell key={y} className="text-right font-mono text-muted-foreground text-xs">
                              {formatMoney(perPropertyByYear[y]?.get(idx)?.totalAssets ?? 0)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </>
                  )}

                  {/* ══════════════════════════════════════
                       LIABILITIES (ASC 470)
                     ══════════════════════════════════════ */}
                  <TableRow className="bg-muted/20 font-bold" onClick={() => toggleRow("liabilities")} style={{ cursor: 'pointer' }} data-testid="row-liabilities-header">
                    <TableCell className="sticky left-0 bg-card z-10">
                      <div className="flex items-center gap-2">
                        {expandedRows.has("liabilities") ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        TOTAL LIABILITIES
                      </div>
                    </TableCell>
                    {consolidatedTotalLiabilities.map((val, i) => (
                      <TableCell key={i} className="text-right font-mono">{formatMoney(val)}</TableCell>
                    ))}
                  </TableRow>
                  {expandedRows.has("liabilities") && (
                    <>
                      {/* ── Long-Term Liabilities ── */}
                      <TableRow data-testid="row-bs-lt-liabilities-header">
                        <TableCell className="pl-10 sticky left-0 bg-card z-10 text-sm font-semibold">Long-Term Liabilities</TableCell>
                        {years.map((_, i) => (<TableCell key={i} />))}
                      </TableRow>

                      {/* Mortgage Notes Payable [chevron → per-property] */}
                      <TableRow
                        className="cursor-pointer hover:bg-muted/10"
                        onClick={() => toggleFormula("debt-detail")}
                        data-testid="row-bs-mortgage"
                      >
                        <TableCell className="pl-14 sticky left-0 bg-card z-10 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            {expandedFormulas.has("debt-detail") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            Mortgage Notes Payable
                          </div>
                        </TableCell>
                        {consolidatedDebt.map((val, i) => (
                          <TableCell key={i} className="text-right font-mono text-sm text-muted-foreground">{formatMoney(val)}</TableCell>
                        ))}
                      </TableRow>
                      {expandedFormulas.has("debt-detail") && (
                        <>
                          <TableRow className="bg-chart-1/3" data-expandable-row="true">
                            <TableCell className="pl-[72px] sticky left-0 bg-chart-1/3 z-10 py-0.5 text-xs text-muted-foreground italic">
                              Remaining principal on acquisition & refinancing loans
                            </TableCell>
                            {consolidatedDebt.map((val, i) => (
                              <TableCell key={i} className="text-right font-mono text-xs text-muted-foreground py-0.5">{formatMoney(val)}</TableCell>
                            ))}
                          </TableRow>
                          {properties.map((prop, idx) => (
                            <TableRow key={idx} data-expandable-row="true">
                              <TableCell className="pl-[72px] sticky left-0 bg-card z-10 text-muted-foreground text-xs">{prop.name}</TableCell>
                              {years.map((_, y) => (
                                <TableCell key={y} className="text-right font-mono text-muted-foreground text-xs">
                                  {formatMoney(perPropertyByYear[y]?.get(idx)?.debtOutstanding ?? 0)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </>
                      )}

                      {/* Per-Entity Liabilities breakdown */}
                      <TableRow
                        className="cursor-pointer hover:bg-muted/10"
                        onClick={() => toggleFormula("liabilities-by-entity")}
                        data-testid="row-bs-liabilities-by-entity"
                      >
                        <TableCell className="pl-10 sticky left-0 bg-card z-10 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            {expandedFormulas.has("liabilities-by-entity") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            Liabilities by Entity (SPV)
                          </div>
                        </TableCell>
                        {consolidatedTotalLiabilities.map((val, i) => (
                          <TableCell key={i} className="text-right font-mono text-sm text-muted-foreground">{formatMoney(val)}</TableCell>
                        ))}
                      </TableRow>
                      {expandedFormulas.has("liabilities-by-entity") && properties.map((prop, idx) => (
                        <TableRow key={idx} data-expandable-row="true">
                          <TableCell className="pl-14 sticky left-0 bg-card z-10 text-muted-foreground text-xs">{prop.name}</TableCell>
                          {years.map((_, y) => (
                            <TableCell key={y} className="text-right font-mono text-muted-foreground text-xs">
                              {formatMoney(perPropertyByYear[y]?.get(idx)?.debtOutstanding ?? 0)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </>
                  )}

                  {/* ══════════════════════════════════════
                       EQUITY (ASC 505)
                     ══════════════════════════════════════ */}
                  <TableRow className="bg-muted/20 font-bold" onClick={() => toggleRow("equity")} style={{ cursor: 'pointer' }} data-testid="row-equity-header">
                    <TableCell className="sticky left-0 bg-card z-10">
                      <div className="flex items-center gap-2">
                        {expandedRows.has("equity") ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        TOTAL EQUITY
                      </div>
                    </TableCell>
                    {consolidatedTotalEquity.map((val, i) => (
                      <TableCell key={i} className="text-right font-mono">{formatMoney(val)}</TableCell>
                    ))}
                  </TableRow>
                  {expandedRows.has("equity") && (
                    <>
                      {/* Equity Formula */}
                      <TableRow
                        className="bg-chart-1/5 cursor-pointer hover:bg-chart-1/5"
                        data-expandable-row="true"
                        onClick={() => toggleFormula("equity-formula")}
                      >
                        <TableCell className="pl-10 sticky left-0 bg-chart-1/5 z-10 py-0.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            {expandedFormulas.has("equity-formula") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            <span className="italic">Formula</span>
                          </div>
                        </TableCell>
                        {consolidatedTotalEquity.map((_, i) => (
                          <TableCell key={i} className="py-0.5" />
                        ))}
                      </TableRow>
                      {expandedFormulas.has("equity-formula") && (
                        <TableRow className="bg-chart-1/3" data-expandable-row="true">
                          <TableCell className="pl-14 sticky left-0 bg-chart-1/3 z-10 py-0.5 text-xs text-muted-foreground italic">
                            = Paid-In Capital + Retained Earnings (ASC 720-15 adjusted)
                          </TableCell>
                          {consolidatedTotalEquity.map((val, i) => (
                            <TableCell key={i} className="text-right font-mono text-xs text-muted-foreground py-0.5">
                              {formatMoney(val)}
                            </TableCell>
                          ))}
                        </TableRow>
                      )}

                      {/* Paid-In Capital [chevron → per-property] */}
                      <TableRow
                        className="cursor-pointer hover:bg-muted/10"
                        onClick={() => toggleFormula("paidin-detail")}
                        data-testid="row-bs-paid-in-capital"
                      >
                        <TableCell className="pl-14 sticky left-0 bg-card z-10 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            {expandedFormulas.has("paidin-detail") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            Paid-In Capital
                          </div>
                        </TableCell>
                        {consolidatedEquity.map((val, i) => (
                          <TableCell key={i} className="text-right font-mono text-sm text-muted-foreground">{formatMoney(val)}</TableCell>
                        ))}
                      </TableRow>
                      {expandedFormulas.has("paidin-detail") && (
                        <>
                          <TableRow className="bg-chart-1/3" data-expandable-row="true">
                            <TableCell className="pl-[72px] sticky left-0 bg-chart-1/3 z-10 py-0.5 text-xs text-muted-foreground italic">
                              = Total Project Cost − Acquisition Loan
                            </TableCell>
                            {consolidatedEquity.map((val, i) => (
                              <TableCell key={i} className="text-right font-mono text-xs text-muted-foreground py-0.5">{formatMoney(val)}</TableCell>
                            ))}
                          </TableRow>
                          {properties.map((prop, idx) => (
                            <TableRow key={idx} data-expandable-row="true">
                              <TableCell className="pl-[72px] sticky left-0 bg-card z-10 text-muted-foreground text-xs">{prop.name}</TableCell>
                              {years.map((_, y) => (
                                <TableCell key={y} className="text-right font-mono text-muted-foreground text-xs">
                                  {formatMoney(perPropertyByYear[y]?.get(idx)?.equityInvested ?? 0)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </>
                      )}

                      {/* Retained Earnings [chevron → per-property] */}
                      <TableRow
                        className="cursor-pointer hover:bg-muted/10"
                        onClick={() => toggleFormula("retained-detail")}
                        data-testid="row-bs-retained-earnings"
                      >
                        <TableCell className="pl-14 sticky left-0 bg-card z-10 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            {expandedFormulas.has("retained-detail") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            Retained Earnings
                          </div>
                        </TableCell>
                        {consolidatedRetained.map((val, i) => (
                          <TableCell key={i} className="text-right font-mono text-sm text-muted-foreground">{formatMoney(val)}</TableCell>
                        ))}
                      </TableRow>
                      {expandedFormulas.has("retained-detail") && (
                        <>
                          <TableRow className="bg-chart-1/3" data-expandable-row="true">
                            <TableCell className="pl-[72px] sticky left-0 bg-chart-1/3 z-10 py-0.5 text-xs text-muted-foreground italic">
                              = Cumulative Net Income − Pre-Opening Costs (ASC 720-15)
                            </TableCell>
                            {consolidatedRetained.map((val, i) => (
                              <TableCell key={i} className="text-right font-mono text-xs text-muted-foreground py-0.5">{formatMoney(val)}</TableCell>
                            ))}
                          </TableRow>
                          {properties.map((prop, idx) => (
                            <TableRow key={idx} data-expandable-row="true">
                              <TableCell className="pl-[72px] sticky left-0 bg-card z-10 text-muted-foreground text-xs">{prop.name}</TableCell>
                              {years.map((_, y) => (
                                <TableCell key={y} className="text-right font-mono text-muted-foreground text-xs">
                                  {formatMoney(perPropertyByYear[y]?.get(idx)?.retainedEarnings ?? 0)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </>
                      )}

                      {/* Per-Entity Equity breakdown */}
                      <TableRow
                        className="cursor-pointer hover:bg-muted/10"
                        onClick={() => toggleFormula("equity-by-entity")}
                        data-testid="row-bs-equity-by-entity"
                      >
                        <TableCell className="pl-10 sticky left-0 bg-card z-10 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            {expandedFormulas.has("equity-by-entity") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            Equity by Entity (SPV)
                          </div>
                        </TableCell>
                        {consolidatedTotalEquity.map((val, i) => (
                          <TableCell key={i} className="text-right font-mono text-sm text-muted-foreground">{formatMoney(val)}</TableCell>
                        ))}
                      </TableRow>
                      {expandedFormulas.has("equity-by-entity") && properties.map((prop, idx) => (
                        <TableRow key={idx} data-expandable-row="true">
                          <TableCell className="pl-14 sticky left-0 bg-card z-10 text-muted-foreground text-xs">{prop.name}</TableCell>
                          {years.map((_, y) => {
                            const d = perPropertyByYear[y]?.get(idx);
                            return (
                              <TableCell key={y} className="text-right font-mono text-muted-foreground text-xs">
                                {formatMoney((d?.equityInvested ?? 0) + (d?.retainedEarnings ?? 0))}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </>
                  )}

                  {/* ══════════════════════════════════════
                       TOTAL L + E
                     ══════════════════════════════════════ */}
                  <TableRow className="bg-primary/10 font-bold border-t-2 border-primary" data-testid="row-total-le">
                    <TableCell className="sticky left-0 bg-primary/5 z-10 font-bold">TOTAL LIABILITIES & EQUITY</TableCell>
                    {consolidatedTotalLE.map((val, i) => (
                      <TableCell key={i} className="text-right font-mono">{formatMoney(val)}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow
                    className="bg-chart-1/5 cursor-pointer hover:bg-chart-1/5"
                    data-expandable-row="true"
                    onClick={() => toggleFormula("le-formula")}
                  >
                    <TableCell className="pl-10 sticky left-0 bg-chart-1/5 z-10 py-0.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        {expandedFormulas.has("le-formula") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        <span className="italic">Formula</span>
                      </div>
                    </TableCell>
                    {consolidatedTotalLE.map((_, i) => (
                      <TableCell key={i} className="py-0.5" />
                    ))}
                  </TableRow>
                  {expandedFormulas.has("le-formula") && (
                    <TableRow className="bg-chart-1/3" data-expandable-row="true">
                      <TableCell className="pl-14 sticky left-0 bg-chart-1/3 z-10 py-0.5 text-xs text-muted-foreground italic">
                        = Total Liabilities + Total Equity
                      </TableCell>
                      {years.map((_, y) => (
                        <TableCell key={y} className="text-right font-mono text-xs text-muted-foreground py-0.5">
                          {formatMoney(consolidatedTotalLiabilities[y])} + {formatMoney(consolidatedTotalEquity[y])}
                        </TableCell>
                      ))}
                    </TableRow>
                  )}

                  {/* ── Balance Check ── */}
                  <TableRow className="font-medium bg-primary/10" data-testid="row-balance-check">
                    <TableCell className="pl-6 sticky left-0 bg-primary/10 z-10">Balance Check (Assets − L&E)</TableCell>
                    {years.map((_, y) => {
                      const variance = consolidatedTotalAssets[y] - consolidatedTotalLE[y];
                      const isBalanced = Math.abs(variance) <= 1;
                      return (
                        <TableCell key={y} className={`text-right font-mono ${isBalanced ? 'text-primary' : 'text-destructive font-bold'}`}>
                          {isBalanced ? "✓ Balanced" : formatMoney(variance)}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* ══════════════════════════════════════
                       KEY RATIOS
                     ══════════════════════════════════════ */}
                  <TableRow className="bg-muted/20 font-bold border-t" onClick={() => toggleRow("metrics")} style={{ cursor: 'pointer' }} data-testid="row-bs-metrics-header">
                    <TableCell className="sticky left-0 bg-card z-10">
                      <div className="flex items-center gap-2">
                        {expandedRows.has("metrics") ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        Key Ratios
                      </div>
                    </TableCell>
                    {years.map((_, i) => (
                      <TableCell key={i} />
                    ))}
                  </TableRow>
                  {expandedRows.has("metrics") && (
                    <>
                      <MetricItemRow
                        label="Debt-to-Assets"
                        values={years.map((_, y) => consolidatedTotalAssets[y] > 0 ? `${((consolidatedTotalLiabilities[y] / consolidatedTotalAssets[y]) * 100).toFixed(1)}%` : "-")}
                      />
                      <MetricItemRow
                        label="Equity-to-Assets"
                        values={years.map((_, y) => consolidatedTotalAssets[y] > 0 ? `${((consolidatedTotalEquity[y] / consolidatedTotalAssets[y]) * 100).toFixed(1)}%` : "-")}
                      />
                      <MetricItemRow
                        label="Debt-to-Equity"
                        values={years.map((_, y) => consolidatedTotalEquity[y] > 0 ? `${((consolidatedTotalLiabilities[y] / consolidatedTotalEquity[y])).toFixed(2)}x` : "-")}
                      />
                      <MetricItemRow
                        label="Book Value per Entity"
                        values={years.map((_, y) => {
                          const activePropCount = perPropertyByYear[y]?.size ?? 0;
                          return activePropCount > 0 ? formatMoney(consolidatedTotalEquity[y] / activePropCount) : "-";
                        })}
                      />
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </CalcDetailsProvider>
        </CardContent>
      </Card>
    </div>
  );
}
