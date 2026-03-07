import React, { useState, useMemo, useRef, RefObject } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExportMenu, pdfAction, csvAction, excelAction, pptxAction, pngAction } from "@/components/ui/export-toolbar";
import { ChevronRight, ChevronDown, ChevronsUpDown } from "lucide-react";
import { formatMoney } from "@/lib/financialEngine";
import { CalcDetailsProvider } from "@/components/financial-table-rows";
import { FinancialChart } from "@/components/ui/financial-chart";
import { DashboardTabProps } from "./types";
import { dashboardExports, generatePortfolioCashFlowData, generatePortfolioInvestmentData } from "./dashboardExports";

export function IncomeStatementTab({ financials, properties, projectionYears, getFiscalYear, showCalcDetails }: DashboardTabProps) {
  const { 
    allPropertyYearlyIS, 
    allPropertyYearlyCF,
    yearlyConsolidatedCache, 
    totalInitialEquity,
    totalExitValue,
    portfolioIRR,
    equityMultiple,
    cashOnCash,
    totalProjectionRevenue,
    totalProjectionNOI,
    totalProjectionCashFlow
  } = financials;

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const tabContentRef = useRef<HTMLDivElement>(null);

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

  const chartData = useMemo(() => {
    return Array.from({ length: projectionYears }, (_, i) => {
      const c = yearlyConsolidatedCache[i];
      return {
        year: getFiscalYear(i),
        Revenue: c?.revenueTotal ?? 0,
        GOP: c?.gop ?? 0,
        NOI: c?.noi ?? 0,
      };
    });
  }, [yearlyConsolidatedCache, projectionYears, getFiscalYear]);

  const toggleAll = () => {
    const allKeys = ["revenue", "expenses", "gop", "fees", "noi"];
    const allExpanded = allKeys.every(k => expandedRows.has(k));
    if (allExpanded) {
      setExpandedRows(new Set());
    } else {
      setExpandedRows(new Set(allKeys));
    }
  };

  const allRowsExpanded = ["revenue", "expenses", "gop", "fees", "noi"].every(k => expandedRows.has(k));

  const generateIncomeStatementData = () => {
    const years = Array.from({ length: projectionYears }, (_, i) => getFiscalYear(i));
    const rows: { category: string; values: number[]; isHeader?: boolean; indent?: number; rowId?: string; isFormula?: boolean }[] = [];
    
    const c = (i: number) => yearlyConsolidatedCache[i];
    const p = (idx: number, i: number) => allPropertyYearlyIS[idx]?.[i];

    rows.push({ category: "Total Revenue", values: years.map((_, i) => c(i)?.revenueTotal ?? 0), isHeader: true, rowId: "revenue" });
    if (expandedRows.has("revenue")) {
      rows.push({ category: "Room Revenue", values: years.map((_, i) => c(i)?.revenueRooms ?? 0), indent: 1 });
      rows.push({ category: "Event Revenue", values: years.map((_, i) => c(i)?.revenueEvents ?? 0), indent: 1 });
      rows.push({ category: "F&B Revenue", values: years.map((_, i) => c(i)?.revenueFB ?? 0), indent: 1 });
      rows.push({ category: "Other Revenue", values: years.map((_, i) => c(i)?.revenueOther ?? 0), indent: 1 });
      rows.push({ category: "= Rooms + Events + F&B + Other", values: years.map((_, i) => c(i)?.revenueTotal ?? 0), indent: 1, isFormula: true });

      properties.forEach((prop, idx) => {
        rows.push({
          category: prop.name,
          values: years.map((_, i) => p(idx, i)?.revenueTotal ?? 0),
          indent: 2
        });
      });
    }

    const totalOpEx = (i: number) => {
      const data = c(i);
      if (!data) return 0;
      return data.expenseRooms + data.expenseFB + data.expenseEvents + data.expenseOther +
        data.expenseMarketing + data.expensePropertyOps + data.expenseUtilitiesVar +
        data.expenseAdmin + data.expenseIT + data.expenseInsurance + data.expenseTaxes +
        data.expenseUtilitiesFixed + data.expenseOtherCosts;
    };

    rows.push({
      category: "Operating Expenses",
      values: years.map((_, i) => totalOpEx(i)),
      isHeader: true,
      rowId: "expenses"
    });
    
    if (expandedRows.has("expenses")) {
      rows.push({ category: "Room Expense", values: years.map((_, i) => c(i)?.expenseRooms ?? 0), indent: 1 });
      rows.push({ category: "F&B Expense", values: years.map((_, i) => c(i)?.expenseFB ?? 0), indent: 1 });
      rows.push({ category: "Event Expense", values: years.map((_, i) => c(i)?.expenseEvents ?? 0), indent: 1 });
      rows.push({ category: "Marketing", values: years.map((_, i) => c(i)?.expenseMarketing ?? 0), indent: 1 });
      rows.push({ category: "Property Ops", values: years.map((_, i) => c(i)?.expensePropertyOps ?? 0), indent: 1 });
      rows.push({ category: "Admin & General", values: years.map((_, i) => c(i)?.expenseAdmin ?? 0), indent: 1 });
      rows.push({ category: "IT", values: years.map((_, i) => c(i)?.expenseIT ?? 0), indent: 1 });
      rows.push({ category: "Insurance", values: years.map((_, i) => c(i)?.expenseInsurance ?? 0), indent: 1 });
      rows.push({ category: "Taxes", values: years.map((_, i) => c(i)?.expenseTaxes ?? 0), indent: 1 });
      rows.push({ category: "Utilities", values: years.map((_, i) => (c(i)?.expenseUtilitiesVar ?? 0) + (c(i)?.expenseUtilitiesFixed ?? 0)), indent: 1 });
      rows.push({ category: "FF&E Reserve", values: years.map((_, i) => c(i)?.expenseFFE ?? 0), indent: 1 });
      rows.push({ category: "Other Expenses", values: years.map((_, i) => (c(i)?.expenseOther ?? 0) + (c(i)?.expenseOtherCosts ?? 0)), indent: 1 });
      rows.push({ category: "= Sum of all departmental + undistributed expenses", values: years.map((_, i) => totalOpEx(i)), indent: 1, isFormula: true });
    }

    rows.push({ category: "Gross Operating Profit", values: years.map((_, i) => c(i)?.gop ?? 0), isHeader: true, rowId: "gop" });
    if (expandedRows.has("gop")) {
      rows.push({ category: "= Total Revenue − Operating Expenses", values: years.map((_, i) => c(i)?.gop ?? 0), indent: 1, isFormula: true });
      properties.forEach((prop, idx) => {
        rows.push({
          category: prop.name,
          values: years.map((_, i) => p(idx, i)?.gop ?? 0),
          indent: 1
        });
      });
    }

    rows.push({ category: "Management Fees", values: years.map((_, i) => (c(i)?.feeBase ?? 0) + (c(i)?.feeIncentive ?? 0)), isHeader: true, rowId: "fees" });
    if (expandedRows.has("fees")) {
      rows.push({ category: "Base Fee", values: years.map((_, i) => c(i)?.feeBase ?? 0), indent: 1 });
      rows.push({ category: "Incentive Fee", values: years.map((_, i) => c(i)?.feeIncentive ?? 0), indent: 1 });
      rows.push({ category: "= Base Fee (% of Revenue) + Incentive Fee (% of GOP)", values: years.map((_, i) => (c(i)?.feeBase ?? 0) + (c(i)?.feeIncentive ?? 0)), indent: 1, isFormula: true });
    }

    rows.push({ category: "Net Operating Income", values: years.map((_, i) => c(i)?.noi ?? 0), isHeader: true, rowId: "noi" });
    if (expandedRows.has("noi")) {
      rows.push({ category: "= GOP − Management Fees − FF&E Reserve", values: years.map((_, i) => c(i)?.noi ?? 0), indent: 1, isFormula: true });
      properties.forEach((prop, idx) => {
        rows.push({
          category: prop.name,
          values: years.map((_, i) => p(idx, i)?.noi ?? 0),
          indent: 1
        });
      });
    }
    
    return { years, rows };
  };

  const { years, rows } = generateIncomeStatementData();

  const handleExport = (action: string) => {
    switch(action) {
      case 'pdf': 
        dashboardExports.exportToPDF({ 
          propertyName: "Hospitality Business Group", 
          projectionYears, 
          years, 
          rows, 
          getYearlyConsolidated: (i) => yearlyConsolidatedCache[i] 
        }); 
        break;
      case 'csv': dashboardExports.exportToCSV(years, rows); break;
      case 'excel': dashboardExports.exportToExcel(years, rows); break;
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
          incomeData: { years: years.map(String), rows: rows.map(r => ({ category: r.category, values: r.values, indent: r.indent, isBold: r.isHeader })) },
          cashFlowData: (() => { const cf = generatePortfolioCashFlowData(allPropertyYearlyCF, projectionYears, getFiscalYear); return { years: cf.years.map(String), rows: cf.rows.map(r => ({ category: r.category, values: r.values, indent: r.indent, isBold: r.isHeader })) }; })(),
          balanceSheetData: { years: years.map(String), rows: [] },
          investmentData: (() => { const inv = generatePortfolioInvestmentData(financials, properties, projectionYears, getFiscalYear); return { years: inv.years.map(String), rows: inv.rows.map(r => ({ category: r.category, values: r.values, indent: r.indent, isBold: r.isHeader })) }; })()
        });
        break;
      case 'png': dashboardExports.exportToPNG(tabContentRef as RefObject<HTMLElement>); break;
    }
  };

  return (
    <div className="space-y-6">
      <FinancialChart
        data={chartData}
        series={["revenue", "gop", "noi"]}
        title={`Income Statement Trends (${projectionYears}-Year Projection)`}
        id="dashboard-income-chart"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <CardTitle>Consolidated Income Statement</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAll}
              className="text-xs text-muted-foreground h-7 px-2"
              data-testid="button-toggle-all-is"
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
              pngAction(() => handleExport('png')),
            ]}
          />
        </CardHeader>
        <CardContent ref={tabContentRef}>
          <CalcDetailsProvider show={showCalcDetails}>
            <div className="rounded-md border overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[200px] sticky left-0 bg-muted/50 z-10">Category</TableHead>
                    {years.map(year => (
                      <TableHead key={year} className="text-right">{year}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => {
                    if (row.isFormula) {
                      return (
                        <TableRow key={idx} className="bg-blue-50/40" data-expandable-row="true">
                          <TableCell
                            className="sticky left-0 bg-blue-50/40 z-10 py-0.5 text-xs text-muted-foreground italic"
                            style={{ paddingLeft: `${(row.indent ?? 1) * 1.5 + 1}rem` }}
                          >
                            {row.category}
                          </TableCell>
                          {row.values.map((val, vIdx) => (
                            <TableCell key={vIdx} className="text-right font-mono text-xs text-muted-foreground py-0.5">
                              {formatMoney(val)}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    }
                    return (
                      <TableRow 
                        key={idx} 
                        className={row.isHeader ? "bg-muted/30 font-bold cursor-pointer hover:bg-muted/50" : ""}
                        onClick={() => row.rowId && toggleRow(row.rowId)}
                        style={{ cursor: row.rowId ? 'pointer' : 'default' }}
                      >
                        <TableCell 
                          className="sticky left-0 bg-card z-10"
                          style={{ paddingLeft: row.indent ? `${row.indent * 1.5 + 1}rem` : '1rem' }}
                        >
                          <div className="flex items-center gap-2">
                            {row.rowId && (
                              expandedRows.has(row.rowId) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                            )}
                            {row.category}
                          </div>
                        </TableCell>
                        {row.values.map((val, vIdx) => (
                          <TableCell key={vIdx} className="text-right font-mono">
                            {formatMoney(val)}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CalcDetailsProvider>
        </CardContent>
      </Card>
    </div>
  );
}
