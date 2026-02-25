import React from "react";
import { ConsolidatedBalanceSheet } from "@/components/ConsolidatedBalanceSheet";
import { DashboardTabProps } from "./types";

export function BalanceSheetTab({ financials, properties, global }: DashboardTabProps) {
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
