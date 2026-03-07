/**
 * CashFlowTab.tsx — Annual cash flow waterfall for a single property.
 *
 * Shows the path from NOI (Net Operating Income) down to net cash flow
 * available to equity investors:
 *
 *   NOI
 *   − Debt Service (principal + interest payments)
 *   − FF&E Reserve contributions
 *   − Income Tax
 *   = Net Cash Flow (before distributions)
 *
 * Also computes the DSCR (Debt Service Coverage Ratio) = NOI / Debt Service.
 * Lenders typically require DSCR ≥ 1.25×, meaning NOI must be at least
 * 25% higher than the debt service obligation. The UI highlights years
 * where DSCR falls below the required threshold.
 *
 * At the exit year, a terminal cash flow row shows the net sale proceeds:
 *   Gross Sale Price (NOI / exit cap rate)
 *   − Sales Commission
 *   − Remaining Loan Balance
 *   = Net Equity Proceeds
 */
import { formatMoney } from "@/lib/financialEngine";
import { YearlyCashFlowStatement } from "@/components/YearlyCashFlowStatement";
import { DEFAULT_LTV } from "@/lib/financial/loanCalculations";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { CashFlowTabProps } from "./types";

export default function CashFlowTab({
  yearlyChartData,
  cashFlowData,
  financials,
  property,
  global,
  projectionYears,
  startYear,
  cashFlowChartRef,
  cashFlowTableRef,
}: CashFlowTabProps) {
  return (
    <div className="space-y-6">
      <div ref={cashFlowChartRef} className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-3 sm:p-6 bg-card shadow-lg border border-border">
        <div className="relative">
          <h3 className="text-lg font-display text-foreground mb-4">Cash Flow Trends ({projectionYears}-Year Projection)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {/* Merge income-statement chart data (NOI) with cash-flow waterfall
                  data (FCF, FCFE) so the chart shows all three lines together */}
              <LineChart data={yearlyChartData.map((d, i) => {
                return {
                  ...d,
                  FCF: cashFlowData[i]?.freeCashFlow || 0,
                  FCFE: cashFlowData[i]?.freeCashFlowToEquity || 0,
                  NetToInvestors: cashFlowData[i]?.netCashFlowToInvestors || 0,
                };
              })}>
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
                    backgroundColor: 'white', 
                    borderColor: '#E5E7EB',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    color: '#111827',
                  }}
                  labelStyle={{ color: '#374151', fontWeight: 600 }}
                  formatter={(value: number) => [formatMoney(value), ""]}
                />
                <Legend 
                  wrapperStyle={{ color: '#374151' }}
                  iconType="circle"
                />
                <Line 
                  type="monotone" 
                  dataKey="ANOI" 
                  stroke="hsl(var(--line-1))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--line-1))', stroke: '#fff', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--line-1))', stroke: '#fff', strokeWidth: 2 }}
                  name="Adjusted NOI"
                />
                <Line 
                  type="monotone" 
                  dataKey="FCF" 
                  stroke="hsl(var(--line-2))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--line-2))', stroke: '#fff', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--line-2))', stroke: '#fff', strokeWidth: 2 }}
                  name="Free Cash Flow"
                />
                <Line 
                  type="monotone" 
                  dataKey="FCFE" 
                  stroke="hsl(var(--line-3))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--line-3))', stroke: '#fff', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--line-3))', stroke: '#fff', strokeWidth: 2 }}
                  name="Free Cash Flow to Equity"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div ref={cashFlowTableRef}>
        <YearlyCashFlowStatement 
          data={financials} 
          property={property} 
          global={global}
          years={projectionYears} 
          startYear={startYear} 
          defaultLTV={property.acquisitionLTV ?? DEFAULT_LTV}
        />
      </div>
    </div>
  );
}
