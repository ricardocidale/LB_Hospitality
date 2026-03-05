import React, { useRef, RefObject } from "react";
import { InvestmentAnalysis } from "@/components/InvestmentAnalysis";
import { DashboardTabProps } from "./types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ExportMenu, pdfAction, csvAction, excelAction, pptxAction, chartAction, pngAction } from "@/components/ui/export-toolbar";
import { 
  dashboardExports, 
  generatePortfolioInvestmentData, 
  generatePortfolioCashFlowData,
  generatePortfolioIncomeData,
  exportPortfolioPDF,
  exportPortfolioCSV,
  exportPortfolioExcel
} from "./dashboardExports";

export function InvestmentAnalysisTab({ financials, properties, projectionYears, getFiscalYear, showCalcDetails, global }: DashboardTabProps & { global: any }) {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
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

  const handleExport = (action: string) => {
    const { years, rows } = generatePortfolioInvestmentData(financials, properties, projectionYears, getFiscalYear);

    switch(action) {
      case 'pdf':
        exportPortfolioPDF(
          "landscape",
          projectionYears,
          years,
          rows,
          (i: number) => financials.yearlyConsolidatedCache[i],
          "Portfolio Investment Analysis"
        );
        break;
      case 'csv':
        exportPortfolioCSV(years, rows, "portfolio-investment-analysis.csv");
        break;
      case 'excel':
        const { rows: incomeRows } = generatePortfolioIncomeData(financials.yearlyConsolidatedCache, projectionYears, getFiscalYear);
        const { rows: cfRows } = generatePortfolioCashFlowData(financials.allPropertyYearlyCF, projectionYears, getFiscalYear);
        exportPortfolioExcel(years, incomeRows, cfRows); 
        break;
      case 'pptx':
        const totalRooms = properties.reduce((sum, p) => sum + p.roomCount, 0);
        dashboardExports.exportToPPTX({
          projectionYears,
          getFiscalYear,
          totalInitialEquity: financials.totalInitialEquity,
          totalExitValue: financials.totalExitValue,
          equityMultiple: financials.equityMultiple,
          portfolioIRR: financials.portfolioIRR,
          cashOnCash: financials.cashOnCash,
          totalProperties: properties.length,
          totalRooms,
          totalProjectionRevenue: financials.totalProjectionRevenue,
          totalProjectionNOI: financials.totalProjectionNOI,
          totalProjectionCashFlow: financials.totalProjectionCashFlow,
          incomeData: (() => { 
            const inc = generatePortfolioIncomeData(financials.yearlyConsolidatedCache, projectionYears, getFiscalYear); 
            return { years: inc.years.map(String), rows: inc.rows.map((r: any) => ({ category: r.category, values: r.values, indent: r.indent, isBold: r.isHeader })) }; 
          })(),
          cashFlowData: (() => { 
            const cf = generatePortfolioCashFlowData(financials.allPropertyYearlyCF, projectionYears, getFiscalYear); 
            return { years: cf.years.map(String), rows: cf.rows.map((r: any) => ({ category: r.category, values: r.values, indent: r.indent, isBold: r.isHeader })) }; 
          })(),
          balanceSheetData: { years: years.map(String), rows: [] },
          investmentData: { years: years.map(String), rows: rows.map((r: any) => ({ category: r.category, values: r.values, indent: r.indent, isBold: r.isHeader })) }
        });
        break;
      case 'png':
        dashboardExports.exportToPNG(tabContentRef as RefObject<HTMLElement>);
        break;
    }
  };

  return (
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
  );
}
