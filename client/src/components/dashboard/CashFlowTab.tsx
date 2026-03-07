import React, { useState, useMemo, useRef, RefObject } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportMenu, pdfAction, csvAction, excelAction, pptxAction, chartAction, pngAction } from "@/components/ui/export-toolbar";
import { ChevronRight, ChevronDown } from "lucide-react";
import { formatMoney } from "@/lib/financialEngine";
import { CalcDetailsProvider } from "@/components/financial-table-rows";
import { FinancialChart } from "@/components/ui/financial-chart";
import { DashboardTabProps } from "./types";
import { aggregateCashFlowByYear } from "@/lib/financial/cashFlowAggregator";
import { LoanParams, GlobalLoanParams } from "@/lib/financial/loanCalculations";
import { 
  dashboardExports, 
  generatePortfolioCashFlowData, 
  generatePortfolioInvestmentData,
  exportPortfolioPDF,
  exportPortfolioCSV,
  ExportRow
} from "./dashboardExports";
import * as XLSX from "xlsx";

export function CashFlowTab({ financials, properties, projectionYears, getFiscalYear, showCalcDetails }: DashboardTabProps) {
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const tableRef = useRef<HTMLDivElement>(null);

  const toggleRow = (rowId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

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
      const fcf = allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.freeCashFlow ?? 0), 0);
      const fcfe = allPropertyYearlyCF.reduce((sum, prop) => sum + (prop[y]?.freeCashFlowToEquity ?? 0), 0);
      return { year, NOI: noi, CashFlow: fcf, FCFE: fcfe };
    });
  }, [allPropertyYearlyCF, years]);

  const handleExport = (action: string) => {
    const { years, rows } = generatePortfolioCashFlowData(allPropertyYearlyCF, projectionYears, getFiscalYear);

    switch (action) {
      case 'pdf':
        exportPortfolioPDF("landscape", projectionYears, years, rows, (i) => yearlyConsolidatedCache[i], "Portfolio Cash Flow Statement");
        break;
      case 'csv':
        exportPortfolioCSV(years, rows, "portfolio-cash-flow.csv");
        break;
      case 'excel':
        const wb = XLSX.utils.book_new();
        const wsData = [
          ["Portfolio Cash Flow Statement", ...years.map(String)],
          ...rows.map(row => [
            (row.indent ? "  ".repeat(row.indent) : "") + row.category,
            ...row.values
          ])
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws["!cols"] = [{ wch: 40 }, ...years.map(() => ({ wch: 15 }))];
        
        const currencyFormat = "#,##0";
        for (let r = 1; r < wsData.length; r++) {
          for (let c = 1; c < wsData[r].length; c++) {
            const cellRef = XLSX.utils.encode_cell({ r, c });
            const cell = ws[cellRef];
            if (cell && typeof cell.v === "number") {
              cell.z = currencyFormat;
            }
          }
        }
        
        XLSX.utils.book_append_sheet(wb, ws, "Cash Flow");
        XLSX.writeFile(wb, "portfolio-cash-flow.xlsx");
        break;
      case 'pptx':
        const totalRooms = properties.reduce((sum, p) => sum + p.roomCount, 0);
        dashboardExports.exportToPPTX({
          projectionYears,
          getFiscalYear,
          totalInitialEquity,
          totalExitValue,
          equityMultiple,
          portfolioIRR,
          cashOnCash,
          totalProperties: properties.length,
          totalRooms,
          totalProjectionRevenue,
          totalProjectionNOI,
          totalProjectionCashFlow,
          incomeData: { years: years.map(String), rows: [] },
          cashFlowData: { years: years.map(String), rows: rows.map(r => ({ category: r.category, values: r.values, indent: r.indent, isBold: r.isHeader })) },
          balanceSheetData: { years: years.map(String), rows: [] },
          investmentData: (() => { 
            const inv = generatePortfolioInvestmentData(financials, properties, projectionYears, getFiscalYear); 
            return { years: inv.years.map(String), rows: inv.rows.map(r => ({ category: r.category, values: r.values, indent: r.indent, isBold: r.isHeader })) }; 
          })()
        });
        break;
      case 'chart':
      case 'table':
        dashboardExports.exportToPNG(tableRef as RefObject<HTMLElement>);
        break;
    }
  };

  return (
    <div className="space-y-6">
      <FinancialChart
        data={chartData}
        series={["noi", "cashFlow", "fcfe"]}
        title={`Cash Flow Trends (${projectionYears}-Year Projection)`}
        id="dashboard-cashflow-chart"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Consolidated Cash Flow Statement</CardTitle>
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
                  {expandedRows.has("cfo") && properties.map((prop, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-10 sticky left-0 bg-card z-10">{prop.name}</TableCell>
                      {years.map((_, y) => (
                        <TableCell key={y} className="text-right font-mono text-muted-foreground">
                          {formatMoney(allPropertyYearlyCF[idx]?.[y]?.cashFromOperations ?? 0)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

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
                  {expandedRows.has("cfi") && properties.map((prop, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-10 sticky left-0 bg-card z-10">{prop.name}</TableCell>
                      {years.map((_, y) => (
                        <TableCell key={y} className="text-right font-mono text-muted-foreground">
                          {formatMoney((allPropertyYearlyCF[idx]?.[y]?.capitalExpenditures ?? 0) + (allPropertyYearlyCF[idx]?.[y]?.exitValue ?? 0))}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

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
                  {expandedRows.has("cff") && properties.map((prop, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-10 sticky left-0 bg-card z-10">{prop.name}</TableCell>
                      {years.map((_, y) => (
                        <TableCell key={y} className="text-right font-mono text-muted-foreground">
                          {formatMoney((allPropertyYearlyCF[idx]?.[y]?.refinancingProceeds ?? 0) - (allPropertyYearlyCF[idx]?.[y]?.principalPayment ?? 0))}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                  <TableRow className="bg-primary/10 font-bold border-t-2 border-primary">
                    <TableCell className="sticky left-0 bg-primary/5 z-10 font-bold">Net Change in Cash</TableCell>
                    {netChangeInCash.map((val, i) => (
                      <TableCell key={i} className="text-right font-mono">{formatMoney(val)}</TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CalcDetailsProvider>
        </CardContent>
      </Card>
    </div>
  );
}
