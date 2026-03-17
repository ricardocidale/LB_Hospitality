import React, { useState, useMemo, useRef, RefObject } from "react";
import { useExportSave } from "@/hooks/useExportSave";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExportMenu, pdfAction, csvAction, excelAction, pptxAction, chartAction, pngAction } from "@/components/ui/export-toolbar";
import { ChevronRight, ChevronDown, ChevronsUpDown } from "@/components/icons/themed-icons";
import { formatMoney } from "@/lib/financialEngine";
import { CalcDetailsProvider } from "@/components/financial-table";
import { FinancialChart } from "@/components/ui/financial-chart";
import { DashboardTabProps } from "./types";
import { aggregateCashFlowByYear } from "@/lib/financial/cashFlowAggregator";
import { LoanParams, GlobalLoanParams } from "@/lib/financial/loanCalculations";
import {
  dashboardExports,
  generatePortfolioCashFlowData,
  generatePortfolioInvestmentData,
  generatePortfolioIncomeData,
  generatePortfolioBalanceSheetData,
  exportPortfolioPDF,
  exportPortfolioCSV,
  buildAllPortfolioStatements,
  exportPortfolioExcel,
  toExportData,
  ExportRow
} from "./dashboardExports";
import { useExpandableRows } from "./useExpandableRows";
import { ExportDialog, type ExportVersion } from "@/components/ExportDialog";

export function CashFlowTab({ financials, properties, projectionYears, getFiscalYear, showCalcDetails, global }: DashboardTabProps) {
  const { 
    allPropertyFinancials, 
    allPropertyYearlyCF,
    totalInitialEquity,
    totalExitValue,
    portfolioIRR,
    equityMultiple,
    cashOnCash,
    totalProjectionRevenue,
    totalProjectionNOI,
    totalProjectionCashFlow,
    yearlyConsolidatedCache
  } = financials;
  const CF_ROW_KEYS = useMemo(() => ["metrics", "cfo", "cfi", "cff"], []);
  const { expandedRows, expandedFormulas, toggleRow, toggleFormula, toggleAll, allRowsExpanded } = useExpandableRows(CF_ROW_KEYS);
  const tableRef = useRef<HTMLDivElement>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [pendingExportAction, setPendingExportAction] = useState<string>("");
  const { requestSave, SaveDialog } = useExportSave();

  const years = Array.from({ length: projectionYears }, (_, i) => getFiscalYear(i));

  const consolidatedCFO = useMemo(() => 
    years.map((_, y) => allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.cashFromOperations ?? 0), 0)),
    [allPropertyYearlyCF, years]
  );

  const consolidatedCFI = useMemo(() => 
    years.map((_, y) => allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.capitalExpenditures ?? 0) + (prop[y]?.exitValue ?? 0), 0)),
    [allPropertyYearlyCF, years]
  );

  const consolidatedCFF = useMemo(() => 
    years.map((_, y) => allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.refinancingProceeds ?? 0) - (prop[y]?.principalPayment ?? 0), 0)),
    [allPropertyYearlyCF, years]
  );

  const netChangeInCash = useMemo(() => 
    years.map((_, y) => consolidatedCFO[y] + consolidatedCFI[y] + consolidatedCFF[y]),
    [consolidatedCFO, consolidatedCFI, consolidatedCFF, years]
  );

  const chartData = useMemo(() => {
    return years.map((year, y) => {
      const noi = allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.noi ?? 0), 0);
      const anoi = allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.anoi ?? 0), 0);
      const fcf = allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.freeCashFlow ?? 0), 0);
      const fcfe = allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.freeCashFlowToEquity ?? 0), 0);
      return { year, NOI: noi, ANOI: anoi, CashFlow: fcf, FCFE: fcfe };
    });
  }, [allPropertyYearlyCF, years]);

  const handleExport = (action: string) => {
    if (action === 'pdf' || action === 'pptx' || action === 'chart' || action === 'table') {
      setPendingExportAction(action);
      setExportDialogOpen(true);
      return;
    }

    const { years, rows } = generatePortfolioCashFlowData(allPropertyYearlyCF, projectionYears, getFiscalYear);

    switch (action) {
      case 'csv':
        requestSave("Cash Flow Statement", ".csv", (f) => exportPortfolioCSV(years, rows, f || "portfolio-cash-flow.csv"));
        break;
      case 'excel':
        requestSave("Portfolio", ".xlsx", (f) => exportPortfolioExcel(
          buildAllPortfolioStatements(financials, properties, projectionYears, getFiscalYear, global?.modelStartDate ? new Date(global.modelStartDate) : undefined),
          global?.companyName || "Portfolio",
          f
        ));
        break;
    }
  };

  const CF_SECTION_KEYS = ["cfo", "cfi", "cff"];
  const allCFExpandedSet = new Set(CF_SECTION_KEYS);
  const emptyCFSet = new Set<string>();

  const getVersionCashFlowData = (version: ExportVersion) => {
    const override = version === "extended" ? allCFExpandedSet : emptyCFSet;
    const exclude = version === "short";
    const names = properties.map(p => p.name);
    return generatePortfolioCashFlowData(allPropertyYearlyCF, projectionYears, getFiscalYear, override, exclude, names);
  };

  const handleVersionExport = (_orientation: 'landscape' | 'portrait', version: ExportVersion, customFilename?: string) => {
    const { years, rows } = getVersionCashFlowData(version);

    switch (pendingExportAction) {
      case 'pdf':
        exportPortfolioPDF("landscape", projectionYears, years, rows, (i) => yearlyConsolidatedCache[i], "Portfolio Cash Flow Statement", undefined, customFilename);
        break;
      case 'pptx': {
        dashboardExports.exportToPPTX({
          projectionYears,
          getFiscalYear,
          totalInitialEquity,
          totalExitValue,
          equityMultiple,
          portfolioIRR,
          cashOnCash,
          totalProperties: properties.length,
          totalRooms: financials.totalRooms,
          totalProjectionRevenue,
          totalProjectionNOI,
          totalProjectionCashFlow,
          incomeData: toExportData(generatePortfolioIncomeData(financials.yearlyConsolidatedCache, projectionYears, getFiscalYear)),
          cashFlowData: toExportData({ years, rows }),
          balanceSheetData: toExportData(generatePortfolioBalanceSheetData(financials.allPropertyFinancials, projectionYears, getFiscalYear)),
          investmentData: toExportData(generatePortfolioInvestmentData(financials, properties, projectionYears, getFiscalYear))
        }, global.companyName || undefined, customFilename);
        break;
      }
      case 'chart':
      case 'table':
        dashboardExports.exportToPNG(tableRef as RefObject<HTMLElement>, customFilename);
        break;
    }
  };

  return (
    <div className="space-y-6">
      {SaveDialog}
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleVersionExport}
        title={pendingExportAction === 'pdf' ? 'Export PDF' : pendingExportAction === 'pptx' ? 'Export PPTX' : 'Export PNG'}
        showVersionOption={true}
        suggestedFilename="Cash Flow Statement"
        fileExtension={pendingExportAction === 'pptx' ? '.pptx' : pendingExportAction === 'png' ? '.png' : '.pdf'}
      />
      <FinancialChart
        data={chartData}
        series={["noi", "anoi", "cashFlow", "fcfe"]}
        title={`Cash Flow Trends (${projectionYears}-Year Projection)`}
        id="dashboard-cashflow-chart"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <CardTitle>Consolidated Cash Flow Statement</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAll}
              className="text-xs text-muted-foreground h-7 px-2"
              data-testid="button-toggle-all-cf"
            >
              <ChevronsUpDown className="h-3.5 w-3.5 mr-1" />
              {allRowsExpanded ? "Collapse All" : "Expand All"}
            </Button>
          </div>
          <ExportMenu
            actions={[
              pdfAction(() => handleExport('pdf')),
              csvAction(() => handleExport('csv')),
              excelAction(() => handleExport('excel')),
              pptxAction(() => handleExport('pptx')),
              chartAction(() => handleExport('chart')),
              pngAction(() => handleExport('table')),
            ]}
          />
        </CardHeader>
        <CardContent ref={tableRef}>
          <CalcDetailsProvider show={showCalcDetails}>
            <div className="rounded-md border overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[250px] sticky left-0 bg-muted/50 z-10">Section</TableHead>
                    {years.map(year => (
                      <TableHead key={year} className="text-right">{year}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-muted/20 font-bold" onClick={() => toggleRow("cfo")} style={{ cursor: 'pointer' }}>
                    <TableCell className="sticky left-0 bg-card z-10">
                      <div className="flex items-center gap-2">
                        {expandedRows.has("cfo") ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        Cash Flow from Operations (CFO)
                      </div>
                    </TableCell>
                    {consolidatedCFO.map((val, i) => (
                      <TableCell key={i} className="text-right font-mono">{formatMoney(val)}</TableCell>
                    ))}
                  </TableRow>
                  {expandedRows.has("cfo") && (
                    <>
                      <TableRow
                        className="bg-blue-50/40 cursor-pointer hover:bg-blue-100/40"
                        data-expandable-row="true"
                        onClick={() => toggleFormula("cfo-formula")}
                      >
                        <TableCell className="pl-10 sticky left-0 bg-blue-50/40 z-10 py-0.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            {expandedFormulas.has("cfo-formula") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            <span className="italic">Formula</span>
                          </div>
                        </TableCell>
                        {consolidatedCFO.map((_, i) => (
                          <TableCell key={i} className="py-0.5" />
                        ))}
                      </TableRow>
                      {expandedFormulas.has("cfo-formula") && (
                        <TableRow className="bg-blue-50/20" data-expandable-row="true">
                          <TableCell className="pl-14 sticky left-0 bg-blue-50/20 z-10 py-0.5 text-xs text-muted-foreground italic">
                            = ANOI − Debt Service (Principal + Interest)
                          </TableCell>
                          {consolidatedCFO.map((val, i) => (
                            <TableCell key={i} className="text-right font-mono text-xs text-muted-foreground py-0.5">
                              {formatMoney(val)}
                            </TableCell>
                          ))}
                        </TableRow>
                      )}
                      {properties.map((prop, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="pl-10 sticky left-0 bg-card z-10">{prop.name}</TableCell>
                          {years.map((_, y) => (
                            <TableCell key={y} className="text-right font-mono text-muted-foreground">
                              {formatMoney(allPropertyYearlyCF[idx]?.[y]?.cashFromOperations ?? 0)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </>
                  )}

                  <TableRow className="bg-muted/20 font-bold" onClick={() => toggleRow("cfi")} style={{ cursor: 'pointer' }}>
                    <TableCell className="sticky left-0 bg-card z-10">
                      <div className="flex items-center gap-2">
                        {expandedRows.has("cfi") ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        Cash Flow from Investing (CFI)
                      </div>
                    </TableCell>
                    {consolidatedCFI.map((val, i) => (
                      <TableCell key={i} className="text-right font-mono">{formatMoney(val)}</TableCell>
                    ))}
                  </TableRow>
                  {expandedRows.has("cfi") && (
                    <>
                      <TableRow
                        className="bg-blue-50/40 cursor-pointer hover:bg-blue-100/40"
                        data-expandable-row="true"
                        onClick={() => toggleFormula("cfi-formula")}
                      >
                        <TableCell className="pl-10 sticky left-0 bg-blue-50/40 z-10 py-0.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            {expandedFormulas.has("cfi-formula") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            <span className="italic">Formula</span>
                          </div>
                        </TableCell>
                        {consolidatedCFI.map((_, i) => (
                          <TableCell key={i} className="py-0.5" />
                        ))}
                      </TableRow>
                      {expandedFormulas.has("cfi-formula") && (
                        <TableRow className="bg-blue-50/20" data-expandable-row="true">
                          <TableCell className="pl-14 sticky left-0 bg-blue-50/20 z-10 py-0.5 text-xs text-muted-foreground italic">
                            = Capital Expenditures + Exit Proceeds (if final year)
                          </TableCell>
                          {consolidatedCFI.map((val, i) => (
                            <TableCell key={i} className="text-right font-mono text-xs text-muted-foreground py-0.5">
                              {formatMoney(val)}
                            </TableCell>
                          ))}
                        </TableRow>
                      )}
                      {properties.map((prop, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="pl-10 sticky left-0 bg-card z-10">{prop.name}</TableCell>
                          {years.map((_, y) => (
                            <TableCell key={y} className="text-right font-mono text-muted-foreground">
                              {formatMoney((allPropertyYearlyCF[idx]?.[y]?.capitalExpenditures ?? 0) + (allPropertyYearlyCF[idx]?.[y]?.exitValue ?? 0))}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </>
                  )}

                  <TableRow className="bg-muted/20 font-bold" onClick={() => toggleRow("cff")} style={{ cursor: 'pointer' }}>
                    <TableCell className="sticky left-0 bg-card z-10">
                      <div className="flex items-center gap-2">
                        {expandedRows.has("cff") ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        Cash Flow from Financing (CFF)
                      </div>
                    </TableCell>
                    {consolidatedCFF.map((val, i) => (
                      <TableCell key={i} className="text-right font-mono">{formatMoney(val)}</TableCell>
                    ))}
                  </TableRow>
                  {expandedRows.has("cff") && (
                    <>
                      <TableRow
                        className="bg-blue-50/40 cursor-pointer hover:bg-blue-100/40"
                        data-expandable-row="true"
                        onClick={() => toggleFormula("cff-formula")}
                      >
                        <TableCell className="pl-10 sticky left-0 bg-blue-50/40 z-10 py-0.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            {expandedFormulas.has("cff-formula") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            <span className="italic">Formula</span>
                          </div>
                        </TableCell>
                        {consolidatedCFF.map((_, i) => (
                          <TableCell key={i} className="py-0.5" />
                        ))}
                      </TableRow>
                      {expandedFormulas.has("cff-formula") && (
                        <TableRow className="bg-blue-50/20" data-expandable-row="true">
                          <TableCell className="pl-14 sticky left-0 bg-blue-50/20 z-10 py-0.5 text-xs text-muted-foreground italic">
                            = Refinancing Proceeds − Principal Payments
                          </TableCell>
                          {consolidatedCFF.map((val, i) => (
                            <TableCell key={i} className="text-right font-mono text-xs text-muted-foreground py-0.5">
                              {formatMoney(val)}
                            </TableCell>
                          ))}
                        </TableRow>
                      )}
                      {properties.map((prop, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="pl-10 sticky left-0 bg-card z-10">{prop.name}</TableCell>
                          {years.map((_, y) => (
                            <TableCell key={y} className="text-right font-mono text-muted-foreground">
                              {formatMoney((allPropertyYearlyCF[idx]?.[y]?.refinancingProceeds ?? 0) - (allPropertyYearlyCF[idx]?.[y]?.principalPayment ?? 0))}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </>
                  )}

                  <TableRow className="bg-primary/10 font-bold border-t-2 border-primary">
                    <TableCell className="sticky left-0 bg-primary/5 z-10 font-bold">Net Change in Cash</TableCell>
                    {netChangeInCash.map((val, i) => (
                      <TableCell key={i} className="text-right font-mono">{formatMoney(val)}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow
                    className="bg-blue-50/40 cursor-pointer hover:bg-blue-100/40"
                    data-expandable-row="true"
                    onClick={() => toggleFormula("netcash-formula")}
                  >
                    <TableCell className="pl-10 sticky left-0 bg-blue-50/40 z-10 py-0.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        {expandedFormulas.has("netcash-formula") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        <span className="italic">Formula</span>
                      </div>
                    </TableCell>
                    {netChangeInCash.map((_, i) => (
                      <TableCell key={i} className="py-0.5" />
                    ))}
                  </TableRow>
                  {expandedFormulas.has("netcash-formula") && (
                    <TableRow className="bg-blue-50/20" data-expandable-row="true">
                      <TableCell className="pl-14 sticky left-0 bg-blue-50/20 z-10 py-0.5 text-xs text-muted-foreground italic">
                        = CFO + CFI + CFF
                      </TableCell>
                      {years.map((_, y) => (
                        <TableCell key={y} className="text-right font-mono text-xs text-muted-foreground py-0.5">
                          {formatMoney(consolidatedCFO[y])} + {formatMoney(consolidatedCFI[y])} + {formatMoney(consolidatedCFF[y])}
                        </TableCell>
                      ))}
                    </TableRow>
                  )}

                  <TableRow className="font-medium">
                    <TableCell className="sticky left-0 bg-card z-10">Free Cash Flow</TableCell>
                    {years.map((_, y) => {
                      const fcf = allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.freeCashFlow ?? 0), 0);
                      return <TableCell key={y} className="text-right font-mono">{formatMoney(fcf)}</TableCell>;
                    })}
                  </TableRow>
                  <TableRow
                    className="bg-blue-50/40 cursor-pointer hover:bg-blue-100/40"
                    data-expandable-row="true"
                    onClick={() => toggleFormula("fcf-formula")}
                  >
                    <TableCell className="pl-10 sticky left-0 bg-blue-50/40 z-10 py-0.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        {expandedFormulas.has("fcf-formula") ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        <span className="italic">Formula</span>
                      </div>
                    </TableCell>
                    {years.map((_, i) => (
                      <TableCell key={i} className="py-0.5" />
                    ))}
                  </TableRow>
                  {expandedFormulas.has("fcf-formula") && (
                    <TableRow className="bg-blue-50/20" data-expandable-row="true">
                      <TableCell className="pl-14 sticky left-0 bg-blue-50/20 z-10 py-0.5 text-xs text-muted-foreground italic">
                        = ANOI − Capital Expenditures
                      </TableCell>
                      {years.map((_, y) => {
                        const noi = allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.noi ?? 0), 0);
                        const capex = allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.capitalExpenditures ?? 0), 0);
                        return (
                          <TableCell key={y} className="text-right font-mono text-xs text-muted-foreground py-0.5">
                            {formatMoney(noi)} − {formatMoney(Math.abs(capex))}
                          </TableCell>
                        );
                      })}
                    </TableRow>
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
