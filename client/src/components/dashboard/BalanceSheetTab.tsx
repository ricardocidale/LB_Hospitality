import React, { useRef, useMemo } from "react";
import { ConsolidatedBalanceSheet } from "@/components/statements/ConsolidatedBalanceSheet";
import { DashboardTabProps } from "./types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialChart } from "@/components/ui/financial-chart";
import { generatePortfolioBalanceSheetData, BS_TOTAL_ASSETS, BS_MORTGAGE_NOTES, BS_PAID_IN_CAPITAL, BS_RETAINED_EARNINGS } from "./dashboardExports";

export function BalanceSheetTab({ financials, properties, global, projectionYears, getFiscalYear }: DashboardTabProps) {
  const tabContentRef = useRef<HTMLDivElement>(null);
  const modelStartDate = global.modelStartDate ? new Date(global.modelStartDate) : undefined;
  
  const { years, rows } = generatePortfolioBalanceSheetData(
    financials.allPropertyFinancials,
    projectionYears,
    getFiscalYear,
    modelStartDate
  );

  const chartData = useMemo(() => {
    const totalAssetsRow = rows.find(r => r.category === BS_TOTAL_ASSETS);
    const debtRow = rows.find(r => r.category === BS_MORTGAGE_NOTES);
    const equityRow = rows.find(r => r.category === BS_PAID_IN_CAPITAL);
    const retainedRow = rows.find(r => r.category === BS_RETAINED_EARNINGS);

    return years.map((year, i) => ({
      year,
      Assets: totalAssetsRow?.values[i] ?? 0,
      Liabilities: debtRow?.values[i] ?? 0,
      Equity: (equityRow?.values[i] ?? 0) + (retainedRow?.values[i] ?? 0),
    }));
  }, [years, rows]);

  return (
    <div className="space-y-6">
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
