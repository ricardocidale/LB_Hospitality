import React, { useRef, RefObject } from "react";
import { ConsolidatedBalanceSheet } from "@/components/ConsolidatedBalanceSheet";
import { DashboardTabProps } from "./types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportMenu, pdfAction, csvAction, excelAction, pptxAction, pngAction, chartAction } from "@/components/ui/export-toolbar";
import { dashboardExports, generatePortfolioBalanceSheetData, generatePortfolioCashFlowData, generatePortfolioInvestmentData } from "./dashboardExports";

export function BalanceSheetTab({ financials, properties, global, projectionYears, getFiscalYear }: DashboardTabProps) {
  const tabContentRef = useRef<HTMLDivElement>(null);
  
  const { years, rows } = generatePortfolioBalanceSheetData(
    financials.allPropertyFinancials,
    projectionYears,
    getFiscalYear,
    global.modelStartDate ? new Date(global.modelStartDate) : undefined
  );

  const handleExport = (action: string) => {
    switch(action) {
      case 'pdf': 
        dashboardExports.exportToPDF({ 
          propertyName: "Hospitality Business Group", 
          projectionYears, 
          years, 
          rows, 
          getYearlyConsolidated: (i: number) => financials.yearlyConsolidatedCache[i],
          title: "Portfolio Balance Sheet"
        }); 
        break;
      case 'csv': 
        dashboardExports.exportToCSV(years, rows, "portfolio-balance-sheet.csv"); 
        break;
      case 'excel': 
        dashboardExports.exportToExcel(years, rows, "Portfolio - Balance Sheet.xlsx", "Balance Sheet"); 
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
            const data = dashboardExports.generatePortfolioIncomeData(financials.yearlyConsolidatedCache, projectionYears, getFiscalYear);
            return { years: data.years.map(String), rows: data.rows.map(r => ({ category: r.category, values: r.values, indent: r.indent, isBold: r.isHeader })) };
          })(),
          cashFlowData: (() => { 
            const cf = generatePortfolioCashFlowData(financials.allPropertyYearlyCF, projectionYears, getFiscalYear); 
            return { years: cf.years.map(String), rows: cf.rows.map(r => ({ category: r.category, values: r.values, indent: r.indent, isBold: r.isHeader })) }; 
          })(),
          balanceSheetData: { years: years.map(String), rows: rows.map(r => ({ category: r.category, values: r.values, indent: r.indent, isBold: r.isHeader })) },
          investmentData: (() => { 
            const inv = generatePortfolioInvestmentData(financials, properties, projectionYears, getFiscalYear); 
            return { years: inv.years.map(String), rows: inv.rows.map(r => ({ category: r.category, values: r.values, indent: r.indent, isBold: r.isHeader })) }; 
          })()
        });
        break;
      case 'png': 
        dashboardExports.exportToPNG(tabContentRef as RefObject<HTMLElement>, "portfolio-balance-sheet.png"); 
        break;
    }
  };

  return (
    <div className="space-y-6">
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
