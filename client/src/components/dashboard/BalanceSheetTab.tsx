import React, { useState, useRef, useMemo, RefObject } from "react";
import { ConsolidatedBalanceSheet } from "@/components/ConsolidatedBalanceSheet";
import { DashboardTabProps } from "./types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportMenu, pdfAction, csvAction, excelAction, pptxAction, pngAction, chartAction } from "@/components/ui/export-toolbar";
import { FinancialChart } from "@/components/ui/financial-chart";
import { dashboardExports, generatePortfolioBalanceSheetData, generatePortfolioCashFlowData, generatePortfolioInvestmentData, toExportData } from "./dashboardExports";
import { ExportDialog, type ExportVersion } from "@/components/ExportDialog";

export function BalanceSheetTab({ financials, properties, global, projectionYears, getFiscalYear }: DashboardTabProps) {
  const tabContentRef = useRef<HTMLDivElement>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [pendingExportAction, setPendingExportAction] = useState<string>("");
  const modelStartDate = global.modelStartDate ? new Date(global.modelStartDate) : undefined;
  
  const { years, rows } = generatePortfolioBalanceSheetData(
    financials.allPropertyFinancials,
    projectionYears,
    getFiscalYear,
    modelStartDate
  );

  const chartData = useMemo(() => {
    const totalAssetsRow = rows.find(r => r.category === "TOTAL ASSETS");
    const debtRow = rows.find(r => r.category === "Mortgage Notes Payable");
    const equityRow = rows.find(r => r.category === "Paid-In Capital");
    const retainedRow = rows.find(r => r.category === "Retained Earnings");

    return years.map((year, i) => ({
      year,
      Assets: totalAssetsRow?.values[i] ?? 0,
      Liabilities: debtRow?.values[i] ?? 0,
      Equity: (equityRow?.values[i] ?? 0) + (retainedRow?.values[i] ?? 0),
    }));
  }, [years, rows]);

  const handleExport = (action: string) => {
    if (action === 'pdf' || action === 'pptx' || action === 'png') {
      setPendingExportAction(action);
      setExportDialogOpen(true);
      return;
    }
    switch(action) {
      case 'csv': 
        dashboardExports.exportToCSV(years, rows, "portfolio-balance-sheet.csv"); 
        break;
      case 'excel': 
        dashboardExports.exportToExcel(years, rows, "Portfolio - Balance Sheet.xlsx", "Balance Sheet"); 
        break;
    }
  };

  const getVersionRows = (version: ExportVersion) => {
    const summaryOnly = version === "short";
    const { rows: versionRows } = generatePortfolioBalanceSheetData(
      financials.allPropertyFinancials,
      projectionYears,
      getFiscalYear,
      modelStartDate,
      summaryOnly
    );
    return versionRows;
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
          getYearlyConsolidated: (i: number) => financials.yearlyConsolidatedCache[i],
          title: "Portfolio Balance Sheet"
        }); 
        break;
      case 'pptx': {
        dashboardExports.exportToPPTX({
          projectionYears,
          getFiscalYear,
          totalInitialEquity: financials.totalInitialEquity,
          totalExitValue: financials.totalExitValue,
          equityMultiple: financials.equityMultiple,
          portfolioIRR: financials.portfolioIRR,
          cashOnCash: financials.cashOnCash,
          totalProperties: properties.length,
          totalRooms: financials.totalRooms,
          totalProjectionRevenue: financials.totalProjectionRevenue,
          totalProjectionNOI: financials.totalProjectionNOI,
          totalProjectionCashFlow: financials.totalProjectionCashFlow,
          incomeData: toExportData(dashboardExports.generatePortfolioIncomeData(financials.yearlyConsolidatedCache, projectionYears, getFiscalYear)),
          cashFlowData: toExportData(generatePortfolioCashFlowData(financials.allPropertyYearlyCF, projectionYears, getFiscalYear)),
          balanceSheetData: toExportData({ years, rows: versionRows }),
          investmentData: toExportData(generatePortfolioInvestmentData(financials, properties, projectionYears, getFiscalYear))
        });
        break;
      }
      case 'png': 
        dashboardExports.exportToPNG(tabContentRef as RefObject<HTMLElement>, "portfolio-balance-sheet.png"); 
        break;
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
        series={[
          { dataKey: "Assets", name: "Total Assets", color: "#257D41", gradientTo: "#34D399" },
          { dataKey: "Liabilities", name: "Total Liabilities", color: "#F4795B", gradientTo: "#FB923C" },
          { dataKey: "Equity", name: "Total Equity", color: "#3B82F6", gradientTo: "#60A5FA" },
        ]}
        title={`Balance Sheet Trends (${projectionYears}-Year Projection)`}
        id="dashboard-balance-chart"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Consolidated Balance Sheet</CardTitle>
          <ExportMenu
            actions={[
              pdfAction(() => handleExport('pdf')),
              csvAction(() => handleExport('csv')),
              excelAction(() => handleExport('excel')),
              pptxAction(() => handleExport('pptx')),
              chartAction(() => handleExport('png')),
              pngAction(() => handleExport('png'), "button-export-table-png"),
            ]}
          />
        </CardHeader>
        <CardContent ref={tabContentRef}>
          <ConsolidatedBalanceSheet 
            properties={properties} 
            global={global}
            allProFormas={financials.allPropertyFinancials.map(f => ({ property: f.property, data: f.financials }))}
            year={projectionYears - 1}
          />
        </CardContent>
      </Card>
    </div>
  );
}
