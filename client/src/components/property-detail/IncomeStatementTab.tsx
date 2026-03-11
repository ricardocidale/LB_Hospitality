/**
 * IncomeStatementTab.tsx — Multi-year USALI income statement for a property.
 *
 * Renders the hotel's projected income statement following the USALI
 * (Uniform System of Accounts for the Lodging Industry) format:
 *
 *   Revenue:
 *     Rooms revenue (ADR × Occupancy × Room Count × 365)
 *     + F&B revenue + Event revenue + Other revenue
 *     = Total Revenue
 *
 *   Departmental Expenses:
 *     Rooms expense + F&B expense + Other dept expense
 *     = Total Departmental Profit
 *
 *   Undistributed Expenses:
 *     A&G + Sales & Marketing + POM + Utilities
 *     = GOP (Gross Operating Profit)
 *   Management Fees (base + incentive)
 *     = AGOP (Adjusted Gross Operating Profit)
 *   Fixed Charges (Property Tax + Insurance)
 *     = NOI (Net Operating Income)
 *   FF&E Reserve
 *     = ANOI (Adjusted Net Operating Income)
 *
 * Each year is a column; the component also shows the "stabilized year"
 * (when occupancy reaches its long-term target) with a visual highlight.
 */
import { useState } from "react";
import { formatMoney } from "@/lib/financialEngine";
import { YearlyIncomeStatement } from "@/components/YearlyIncomeStatement";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import type { IncomeStatementTabProps } from "./types";

export default function IncomeStatementTab({
  yearlyChartData,
  financials,
  property,
  global,
  projectionYears,
  startYear,
  incomeChartRef,
  incomeTableRef,
  incomeAllExpanded,
}: IncomeStatementTabProps) {
  const [localAllExpanded, setLocalAllExpanded] = useState(false);
  const effectiveAllExpanded = incomeAllExpanded || localAllExpanded;

  return (
    <div className="space-y-6">
      <div ref={incomeChartRef} className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-3 sm:p-6 bg-card shadow-lg border border-border">
        <div className="relative">
          <h3 className="text-lg font-display text-foreground mb-4">Income Statement Trends ({projectionYears}-Year Projection)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis 
                  dataKey="year" 
                  stroke="#6B7280" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  stroke="#6B7280" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    color: 'hsl(var(--foreground))',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = { Revenue: "Revenue — Total Revenue", GOP: "GOP — Gross Operating Profit", NOI: "NOI — Net Operating Income", ANOI: "ANOI — Adjusted Net Operating Income" };
                    return [formatMoney(value), labels[name] ?? name];
                  }}
                />
                <Legend 
                  wrapperStyle={{ color: 'hsl(var(--muted-foreground))' }}
                  iconType="circle"
                  formatter={(value: string) => {
                    const abbr: Record<string, string> = { Revenue: "Revenue", GOP: "GOP", NOI: "NOI", ANOI: "ANOI" };
                    return abbr[value] ?? value;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Revenue" 
                  stroke="hsl(var(--line-1))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--line-1))', stroke: '#fff', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--line-1))', stroke: '#fff', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="GOP" 
                  stroke="hsl(var(--line-2))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--line-2))', stroke: '#fff', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--line-2))', stroke: '#fff', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="NOI" 
                  stroke="hsl(var(--line-3))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--line-3))', stroke: '#fff', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--line-3))', stroke: '#fff', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="ANOI" 
                  stroke="hsl(var(--line-4))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--line-4))', stroke: '#fff', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--line-4))', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div ref={incomeTableRef}>
        <div className="flex justify-end mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocalAllExpanded(!localAllExpanded)}
            className="text-xs text-muted-foreground h-7 px-2"
            data-testid="button-toggle-all-property-is"
          >
            <ChevronsUpDown className="h-3.5 w-3.5 mr-1" />
            {effectiveAllExpanded ? "Collapse All Formulas" : "Expand All Formulas"}
          </Button>
        </div>
        <YearlyIncomeStatement data={financials} years={projectionYears} startYear={startYear} property={property} global={global} allExpanded={effectiveAllExpanded} />
      </div>
    </div>
  );
}
