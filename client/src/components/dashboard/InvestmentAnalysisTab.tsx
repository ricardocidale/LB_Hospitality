import React from "react";
import { InvestmentAnalysis } from "@/components/InvestmentAnalysis";
import { DashboardTabProps } from "./types";

export function InvestmentAnalysisTab({ financials, properties, projectionYears, getFiscalYear, showCalcDetails, global }: DashboardTabProps & { global: any }) {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
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

  return (
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
  );
}
