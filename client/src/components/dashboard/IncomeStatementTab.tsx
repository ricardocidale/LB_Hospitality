import React, { useState, useMemo, useRef, RefObject } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExportMenu, pdfAction, csvAction, excelAction, pptxAction, pngAction } from "@/components/ui/export-toolbar";
import { ChevronRight, ChevronDown, ChevronsUpDown } from "lucide-react";
import { formatMoney } from "@/lib/financialEngine";
import { CalcDetailsProvider, useCalcDetails } from "@/components/financial-table-rows";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { FinancialChart } from "@/components/ui/financial-chart";
import { DashboardTabProps } from "./types";
import { dashboardExports, generatePortfolioCashFlowData, generatePortfolioInvestmentData, generatePortfolioBalanceSheetData, toExportData } from "./dashboardExports";
import { useExpandableRows } from "./useExpandableRows";
import { ExportDialog, type ExportVersion } from "@/components/ExportDialog";

export function IncomeStatementTab({ financials, properties, projectionYears, getFiscalYear, showCalcDetails, global }: DashboardTabProps) {
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

  const IS_ROW_KEYS = useMemo(() => ["metrics", "revenue", "expenses", "gop", "fees", "agop", "fixed", "noi", "ffe", "anoi"], []);
  const { expandedRows, expandedFormulas, toggleRow, toggleFormula, toggleAll, allRowsExpanded } = useExpandableRows(IS_ROW_KEYS);
  const tabContentRef = useRef<HTMLDivElement>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [pendingExportAction, setPendingExportAction] = useState<string>("");

  const chartData = useMemo(() => {
    return Array.from({ length: projectionYears }, (_, i) => {
      const c = yearlyConsolidatedCache[i];
      return {
        year: getFiscalYear(i),
        Revenue: c?.revenueTotal ?? 0,
        GOP: c?.gop ?? 0,
        AGOP: c?.agop ?? 0,
        NOI: c?.noi ?? 0,
        ANOI: c?.anoi ?? 0,
      };
    });
  }, [yearlyConsolidatedCache, projectionYears, getFiscalYear]);

  const generateIncomeStatementData = (overrideExpanded?: Set<string>, excludeFormulas?: boolean) => {
    const activeExpanded = overrideExpanded ?? expandedRows;
    const years = Array.from({ length: projectionYears }, (_, i) => getFiscalYear(i));
    const rows: { category: string; values: number[]; displayValues?: string[]; isHeader?: boolean; indent?: number; rowId?: string; isFormula?: boolean; formulaId?: string; tooltip?: string }[] = [];
    
    const c = (i: number) => yearlyConsolidatedCache[i];
    const p = (idx: number, i: number) => allPropertyYearlyIS[idx]?.[i];

    const pushRow = (row: typeof rows[0]) => {
      if (excludeFormulas && row.isFormula) return;
      rows.push(row);
    };

    rows.push({ category: "Operational Metrics", values: years.map(() => 0), displayValues: years.map(() => ""), isHeader: true, rowId: "metrics" });
    if (activeExpanded.has("metrics")) {
      rows.push({
        category: "Total Rooms Available",
        values: years.map((_, i) => c(i)?.availableRooms ?? 0),
        indent: 1,
        displayValues: years.map((_, i) => (c(i)?.availableRooms ?? 0).toLocaleString())
      });

      const adrVals = years.map((_, i) => {
        const sold = c(i)?.soldRooms ?? 0;
        return sold > 0 ? (c(i)?.revenueRooms ?? 0) / sold : 0;
      });
      rows.push({
        category: "ADR (Effective)",
        values: adrVals,
        indent: 1,
        displayValues: adrVals.map(v => v > 0 ? formatMoney(v) : "-")
      });
      pushRow({
        category: "= Room Revenue ÷ Sold Rooms",
        values: adrVals,
        indent: 1,
        isFormula: true,
        displayValues: years.map((_, i) => {
          const sold = c(i)?.soldRooms ?? 0;
          const rev = c(i)?.revenueRooms ?? 0;
          return sold > 0 ? `${formatMoney(rev)} ÷ ${sold.toLocaleString()}` : "-";
        })
      });

      const occVals = years.map((_, i) => {
        const sold = c(i)?.soldRooms ?? 0;
        const avail = c(i)?.availableRooms ?? 0;
        return avail > 0 ? sold / avail : 0;
      });
      rows.push({
        category: "Occupancy",
        values: occVals,
        indent: 1,
        displayValues: occVals.map(v => `${(v * 100).toFixed(1)}%`)
      });
      pushRow({
        category: "= Sold Rooms ÷ Available Rooms",
        values: occVals,
        indent: 1,
        isFormula: true,
        displayValues: years.map((_, i) => {
          const sold = c(i)?.soldRooms ?? 0;
          const avail = c(i)?.availableRooms ?? 0;
          return avail > 0 ? `${sold.toLocaleString()} ÷ ${avail.toLocaleString()}` : "-";
        })
      });

      const revparVals = years.map((_, i) => {
        const rev = c(i)?.revenueRooms ?? 0;
        const avail = c(i)?.availableRooms ?? 0;
        return avail > 0 ? rev / avail : 0;
      });
      rows.push({
        category: "RevPAR",
        values: revparVals,
        indent: 1,
        displayValues: revparVals.map(v => v > 0 ? formatMoney(v) : "-")
      });
      pushRow({
        category: "= Room Revenue ÷ Available Rooms",
        values: revparVals,
        indent: 1,
        isFormula: true,
        displayValues: years.map((_, i) => {
          const rev = c(i)?.revenueRooms ?? 0;
          const avail = c(i)?.availableRooms ?? 0;
          return avail > 0 ? `${formatMoney(rev)} ÷ ${avail.toLocaleString()}` : "-";
        })
      });
      pushRow({
        category: "Cross-check: ADR × Occupancy",
        values: revparVals,
        indent: 1,
        isFormula: true,
        displayValues: years.map((_, i) => {
          const sold = c(i)?.soldRooms ?? 0;
          const avail = c(i)?.availableRooms ?? 0;
          const rev = c(i)?.revenueRooms ?? 0;
          const adr = sold > 0 ? rev / sold : 0;
          const occ = avail > 0 ? sold / avail : 0;
          return avail > 0 ? `${formatMoney(adr)} × ${(occ * 100).toFixed(1)}%` : "-";
        })
      });
    }

    rows.push({ category: "Total Revenue", values: years.map((_, i) => c(i)?.revenueTotal ?? 0), isHeader: true, rowId: "revenue" });
    if (activeExpanded.has("revenue")) {
      rows.push({ category: "Room Revenue", values: years.map((_, i) => c(i)?.revenueRooms ?? 0), indent: 1, tooltip: "Income from guest room bookings. Calculated as Room Count × Days × ADR × Occupancy." });
      rows.push({ category: "Event Revenue", values: years.map((_, i) => c(i)?.revenueEvents ?? 0), indent: 1, tooltip: "Income from conferences, weddings, and banquet bookings. Calculated as a percentage of Room Revenue (Events Rev Share)." });
      rows.push({ category: "F&B Revenue", values: years.map((_, i) => c(i)?.revenueFB ?? 0), indent: 1, tooltip: "Income from restaurants, bars, room service, and catering. Calculated as a percentage of Room Revenue (F&B Rev Share), boosted by the catering factor." });
      rows.push({ category: "Other Revenue", values: years.map((_, i) => c(i)?.revenueOther ?? 0), indent: 1, tooltip: "Income from spa, parking, retail, and ancillary services. Calculated as a percentage of Room Revenue (Other Rev Share)." });
      pushRow({ category: "= Rooms + Events + F&B + Other", values: years.map((_, i) => c(i)?.revenueTotal ?? 0), indent: 1, isFormula: true });

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
        data.expenseAdmin + data.expenseIT +
        data.expenseUtilitiesFixed + data.expenseOtherCosts;
    };

    rows.push({
      category: "Operating Expenses",
      values: years.map((_, i) => totalOpEx(i)),
      isHeader: true,
      rowId: "expenses"
    });
    
    if (activeExpanded.has("expenses")) {
      rows.push({ category: "Room Expense", values: years.map((_, i) => c(i)?.expenseRooms ?? 0), indent: 1 });
      rows.push({ category: "F&B Expense", values: years.map((_, i) => c(i)?.expenseFB ?? 0), indent: 1 });
      rows.push({ category: "Event Expense", values: years.map((_, i) => c(i)?.expenseEvents ?? 0), indent: 1 });
      rows.push({ category: "Marketing", values: years.map((_, i) => c(i)?.expenseMarketing ?? 0), indent: 1 });
      rows.push({ category: "Property Ops", values: years.map((_, i) => c(i)?.expensePropertyOps ?? 0), indent: 1 });
      rows.push({ category: "Admin & General", values: years.map((_, i) => c(i)?.expenseAdmin ?? 0), indent: 1 });
      rows.push({ category: "IT", values: years.map((_, i) => c(i)?.expenseIT ?? 0), indent: 1 });
      rows.push({ category: "Utilities", values: years.map((_, i) => (c(i)?.expenseUtilitiesVar ?? 0) + (c(i)?.expenseUtilitiesFixed ?? 0)), indent: 1 });
      rows.push({ category: "Other Expenses", values: years.map((_, i) => (c(i)?.expenseOther ?? 0) + (c(i)?.expenseOtherCosts ?? 0)), indent: 1 });
      pushRow({ category: "= Sum of departmental + undistributed expenses", values: years.map((_, i) => totalOpEx(i)), indent: 1, isFormula: true });
    }

    rows.push({ category: "Gross Operating Profit", values: years.map((_, i) => c(i)?.gop ?? 0), isHeader: true, rowId: "gop" });
    if (activeExpanded.has("gop")) {
      pushRow({ category: "= Total Revenue − Operating Expenses", values: years.map((_, i) => c(i)?.gop ?? 0), indent: 1, isFormula: true });
      properties.forEach((prop, idx) => {
        rows.push({
          category: prop.name,
          values: years.map((_, i) => p(idx, i)?.gop ?? 0),
          indent: 1
        });
      });
    }

    rows.push({ category: "Management Fees", values: years.map((_, i) => (c(i)?.feeBase ?? 0) + (c(i)?.feeIncentive ?? 0)), isHeader: true, rowId: "fees" });
    if (activeExpanded.has("fees")) {
      rows.push({ category: "Base Fee", values: years.map((_, i) => c(i)?.feeBase ?? 0), indent: 1 });
      const catSet = new Set<string>();
      for (const yc of yearlyConsolidatedCache) for (const k of Object.keys(yc?.serviceFeesByCategory ?? {})) catSet.add(k);
      catSet.forEach(cat => {
        rows.push({ category: cat, values: years.map((_, i) => c(i)?.serviceFeesByCategory?.[cat] ?? 0), indent: 2 });
      });
      rows.push({ category: "Incentive Fee", values: years.map((_, i) => c(i)?.feeIncentive ?? 0), indent: 1 });
      pushRow({ category: "= Base Fee (% of Revenue) + Incentive Fee (% of GOP)", values: years.map((_, i) => (c(i)?.feeBase ?? 0) + (c(i)?.feeIncentive ?? 0)), indent: 1, isFormula: true });
    }

    rows.push({ category: "Adjusted GOP (AGOP)", values: years.map((_, i) => c(i)?.agop ?? 0), isHeader: true, rowId: "agop" });
    if (activeExpanded.has("agop")) {
      pushRow({ category: "= GOP − Management Fees", values: years.map((_, i) => c(i)?.agop ?? 0), indent: 1, isFormula: true });
      properties.forEach((prop, idx) => {
        rows.push({
          category: prop.name,
          values: years.map((_, i) => p(idx, i)?.agop ?? 0),
          indent: 1
        });
      });
    }

    rows.push({ category: "Fixed Charges", values: years.map((_, i) => (c(i)?.expenseInsurance ?? 0) + (c(i)?.expenseTaxes ?? 0)), isHeader: true, rowId: "fixed" });
    if (activeExpanded.has("fixed")) {
      rows.push({ category: "Insurance", values: years.map((_, i) => c(i)?.expenseInsurance ?? 0), indent: 1 });
      rows.push({ category: "Property Taxes", values: years.map((_, i) => c(i)?.expenseTaxes ?? 0), indent: 1 });
      pushRow({ category: "= Insurance + Property Taxes", values: years.map((_, i) => (c(i)?.expenseInsurance ?? 0) + (c(i)?.expenseTaxes ?? 0)), indent: 1, isFormula: true });
    }

    rows.push({ category: "Net Operating Income (NOI)", values: years.map((_, i) => c(i)?.noi ?? 0), isHeader: true, rowId: "noi" });
    if (activeExpanded.has("noi")) {
      pushRow({ category: "= AGOP − Fixed Charges", values: years.map((_, i) => c(i)?.noi ?? 0), indent: 1, isFormula: true });
      properties.forEach((prop, idx) => {
        rows.push({
          category: prop.name,
          values: years.map((_, i) => p(idx, i)?.noi ?? 0),
          indent: 1
        });
      });
    }

    rows.push({ category: "FF&E Reserve", values: years.map((_, i) => c(i)?.expenseFFE ?? 0), isHeader: true, rowId: "ffe" });
    if (activeExpanded.has("ffe")) {
      pushRow({ category: "= Reserve for Furniture, Fixtures & Equipment", values: years.map((_, i) => c(i)?.expenseFFE ?? 0), indent: 1, isFormula: true });
    }

    rows.push({ category: "Adjusted NOI (ANOI)", values: years.map((_, i) => c(i)?.anoi ?? 0), isHeader: true, rowId: "anoi" });
    if (activeExpanded.has("anoi")) {
      pushRow({ category: "= NOI − FF&E Reserve", values: years.map((_, i) => c(i)?.anoi ?? 0), indent: 1, isFormula: true });
      properties.forEach((prop, idx) => {
        rows.push({
          category: prop.name,
          values: years.map((_, i) => p(idx, i)?.anoi ?? 0),
          indent: 1
        });
      });
    }

    return { years, rows };
  };

  const { years, rows } = generateIncomeStatementData();

  const allRowKeys = ["metrics", "revenue", "expenses", "gop", "fees", "agop", "fixed", "noi", "ffe", "anoi"];
  const allExpandedSet = new Set(allRowKeys);
  const emptySet = new Set<string>();

  const getVersionRows = (version: ExportVersion) => {
    const override = version === "extended" ? allExpandedSet : emptySet;
    const exclude = version === "short";
    return generateIncomeStatementData(override, exclude).rows;
  };

  const handleExport = (action: string) => {
    if (action === 'pdf' || action === 'pptx' || action === 'png') {
      setPendingExportAction(action);
      setExportDialogOpen(true);
      return;
    }
    switch(action) {
      case 'csv': dashboardExports.exportToCSV(years, rows); break;
      case 'excel': dashboardExports.exportToExcel(years, rows); break;
    }
  };

  const handleVersionExport = (_orientation: 'landscape' | 'portrait', version: ExportVersion) => {
    const versionRows = getVersionRows(version);
    switch(pendingExportAction) {
      case 'pdf':
        dashboardExports.exportToPDF({ 
          propertyName: "Hospitality Business Group", 
          projectionYears, 
          years, 
          rows: versionRows, 
          getYearlyConsolidated: (i) => yearlyConsolidatedCache[i] 
        }); 
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
          incomeData: { years: years.map(String), rows: versionRows.map(r => ({ category: r.category, values: r.values, indent: r.indent, isBold: r.isHeader })) },
          cashFlowData: toExportData(generatePortfolioCashFlowData(allPropertyYearlyCF, projectionYears, getFiscalYear, new Set(["cfo", "cfi", "cff"]), false, properties.map(p => p.name))),
          balanceSheetData: toExportData(generatePortfolioBalanceSheetData(financials.allPropertyFinancials, projectionYears, getFiscalYear)),
          investmentData: toExportData(generatePortfolioInvestmentData(financials, properties, projectionYears, getFiscalYear))
        }, global.companyName || undefined);
        break;
      }
      case 'png': dashboardExports.exportToPNG(tabContentRef as RefObject<HTMLElement>); break;
    }
  };

  return (
    <div className="space-y-6">
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleVersionExport}
        title={pendingExportAction === 'pdf' ? 'Export PDF' : pendingExportAction === 'pptx' ? 'Export PPTX' : 'Export PNG'}
        showVersionOption={true}
      />
      <FinancialChart
        data={chartData}
        series={["revenue", "gop", "agop", "noi", "anoi"]}
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
                      const fId = row.formulaId ?? `formula-${idx}`;
                      const isOpen = expandedFormulas.has(fId);
                      return (
                        <React.Fragment key={idx}>
                          <TableRow
                            className="bg-blue-50/40 cursor-pointer hover:bg-blue-100/40"
                            onClick={() => toggleFormula(fId)}
                            data-expandable-row="true"
                          >
                            <TableCell
                              className="sticky left-0 bg-blue-50/40 z-10 py-0.5 text-xs text-muted-foreground"
                              style={{ paddingLeft: `${(row.indent ?? 1) * 1.5 + 1}rem` }}
                            >
                              <div className="flex items-center gap-1.5">
                                {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                <span className="italic">Formula</span>
                              </div>
                            </TableCell>
                            {row.values.map((_, vIdx) => (
                              <TableCell key={vIdx} className="py-0.5" />
                            ))}
                          </TableRow>
                          {isOpen && (
                            <TableRow className="bg-blue-50/20" data-expandable-row="true">
                              <TableCell
                                className="sticky left-0 bg-blue-50/20 z-10 py-0.5 text-xs text-muted-foreground italic"
                                style={{ paddingLeft: `${(row.indent ?? 1) * 1.5 + 1 + 1.25}rem` }}
                              >
                                {row.category}
                              </TableCell>
                              {row.values.map((val, vIdx) => (
                                <TableCell key={vIdx} className="text-right font-mono text-xs text-muted-foreground py-0.5">
                                  {row.displayValues?.[vIdx] ?? formatMoney(val)}
                                </TableCell>
                              ))}
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    }
                    return (
                      <TableRow 
                        key={idx} 
                        className={row.isHeader ? "bg-muted/30 font-medium cursor-pointer hover:bg-muted/50" : ""}
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
                            {row.tooltip && <HelpTooltip text={row.tooltip} />}
                          </div>
                        </TableCell>
                        {row.values.map((val, vIdx) => (
                          <TableCell key={vIdx} className="text-right font-mono">
                            {row.displayValues?.[vIdx] ?? formatMoney(val)}
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
