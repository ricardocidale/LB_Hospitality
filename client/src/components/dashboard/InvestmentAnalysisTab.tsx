import React, { useRef, useMemo, RefObject } from "react";
import { useExportSave } from "@/hooks/useExportSave";
import { InvestmentAnalysis } from "@/components/InvestmentAnalysis";
import { DashboardTabProps } from "./types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ExportMenu, pdfAction, csvAction, excelAction, pptxAction, chartAction, pngAction } from "@/components/ui/export-toolbar";
import { FinancialChart } from "@/components/ui/financial-chart";
import {
  dashboardExports,
  generatePortfolioInvestmentData,
  generatePortfolioCashFlowData,
  generatePortfolioIncomeData,
  generatePortfolioBalanceSheetData,
  exportPortfolioPDF,
  exportPortfolioCSV,
  buildAllPortfolioStatements,
  exportPortfolioExcel,
  toExportData
} from "./dashboardExports";
import { useExpandableRows } from "./useExpandableRows";

export function InvestmentAnalysisTab({ financials, properties, projectionYears, getFiscalYear, showCalcDetails, global }: DashboardTabProps & { global: any }) {
  const INV_ROW_KEYS = React.useMemo(() => ["metrics", "returns", "composition"], []);
  const { expandedRows, toggleRow } = useExpandableRows(INV_ROW_KEYS);
  const tabContentRef = useRef<HTMLDivElement>(null);
  const { requestSave, SaveDialog } = useExportSave();

  const chartData = useMemo(() => {
    return Array.from({ length: projectionYears }, (_, i) => {
      const c = financials.yearlyConsolidatedCache[i];
      const cfYear = financials.allPropertyYearlyCF.reduce(
        (acc, prop) => ({
          debtService: acc.debtService + (prop[i]?.debtService ?? 0),
          fcfe: acc.fcfe + (prop[i]?.freeCashFlowToEquity ?? 0),
        }),
        { debtService: 0, fcfe: 0 }
      );
      return {
        year: getFiscalYear(i),
        NOI: c?.noi ?? 0,
        ANOI: c?.anoi ?? 0,
        DebtService: cfYear.debtService,
        FCFE: cfYear.fcfe,
      };
    });
  }, [financials, projectionYears, getFiscalYear]);

  const handleExport = (action: string) => {
    const { years, rows } = generatePortfolioInvestmentData(financials, properties, projectionYears, getFiscalYear);

    switch(action) {
      case 'pdf':
        requestSave("Investment Analysis", ".pdf", (f) => exportPortfolioPDF(
          "landscape",
          projectionYears,
          years,
          rows,
          (i: number) => financials.yearlyConsolidatedCache[i],
          "Portfolio Investment Analysis",
          undefined,
          f
        ));
        break;
      case 'csv':
        requestSave("Investment Analysis", ".csv", (f) => exportPortfolioCSV(years, rows, f || "portfolio-investment-analysis.csv"));
        break;
      case 'excel':
        requestSave("Portfolio", ".xlsx", (f) => exportPortfolioExcel(
          buildAllPortfolioStatements(financials, properties, projectionYears, getFiscalYear, global?.modelStartDate ? new Date(global.modelStartDate) : undefined),
          global?.companyName || "Portfolio",
          f
        ));
        break;
      case 'pptx':
        requestSave("Investment Analysis", ".pptx", (f) => dashboardExports.exportToPPTX({
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
          incomeData: toExportData(generatePortfolioIncomeData(financials.yearlyConsolidatedCache, projectionYears, getFiscalYear)),
          cashFlowData: toExportData(generatePortfolioCashFlowData(financials.allPropertyYearlyCF, projectionYears, getFiscalYear)),
          balanceSheetData: toExportData(generatePortfolioBalanceSheetData(financials.allPropertyFinancials, projectionYears, getFiscalYear)),
          investmentData: toExportData({ years, rows })
        }, global.companyName || undefined, f));
        break;
      case 'png':
        requestSave("Investment Analysis", ".png", (f) => dashboardExports.exportToPNG(tabContentRef as RefObject<HTMLElement>, f));
        break;
    }
  };

  return (
    <div className="space-y-6">
      {SaveDialog}
      <FinancialChart
        data={chartData}
        series={[
          { dataKey: "NOI", name: "Net Operating Income (NOI)", color: "#10B981", gradientTo: "#34D399" },
          { dataKey: "ANOI", name: "Adjusted NOI (ANOI)", color: "#257D41", gradientTo: "#34D399" },
          { dataKey: "DebtService", name: "Debt Service", color: "#F4795B", gradientTo: "#FB923C" },
          { dataKey: "FCFE", name: "Free Cash Flow to Equity", color: "#8B5CF6", gradientTo: "#A78BFA" },
        ]}
        title={`Investment Returns (${projectionYears}-Year Projection)`}
        id="dashboard-investment-chart"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Investment Analysis</CardTitle>
          <ExportMenu
            actions={[
              pdfAction(() => handleExport('pdf')),
              csvAction(() => handleExport('csv')),
              excelAction(() => handleExport('excel')),
              pptxAction(() => handleExport('pptx')),
              chartAction(() => handleExport('png')),
              pngAction(() => handleExport('png')),
            ]}
          />
        </CardHeader>
        <CardContent ref={tabContentRef}>
          <div className="space-y-6">
            <InvestmentAnalysis 
              properties={properties}
              allPropertyFinancials={financials.allPropertyFinancials}
              allPropertyYearlyCF={financials.allPropertyYearlyCF}
              getPropertyYearly={(propIdx, yearIdx) => financials.allPropertyYearlyIS[propIdx]?.[yearIdx]}
              getYearlyConsolidated={(yearIdx) => financials.yearlyConsolidatedCache[yearIdx]}
              global={global}
              expandedRows={expandedRows}
              toggleRow={toggleRow}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
