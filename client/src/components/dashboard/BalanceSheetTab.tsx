import React from "react";
import { ConsolidatedBalanceSheet } from "@/components/ConsolidatedBalanceSheet";
import { DashboardTabProps } from "./types";
import { useGlobalAssumptions } from "@/lib/api";

export function BalanceSheetTab({ financials, properties, projectionYears, getFiscalYear, showCalcDetails }: DashboardTabProps) {
  const { data: global } = useGlobalAssumptions();
  if (!global) return null;
  return (
    <div className="space-y-6">
      <ConsolidatedBalanceSheet 
        properties={properties} 
        global={global}
        allProFormas={financials.allPropertyFinancials.map(f => ({ property: f.property, data: f.financials }))}
        year={0}
      />
    </div>
  );
}
