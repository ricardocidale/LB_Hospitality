import { formatMoney } from "@/lib/financialEngine";
import { YearlyCashFlowStatement } from "@/components/YearlyCashFlowStatement";
import { DEFAULT_LTV } from "@/lib/loanCalculations";
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
      <div ref={cashFlowChartRef} className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-3 sm:p-6 bg-white shadow-lg border border-gray-100">
        <div className="relative">
          <h3 className="text-lg font-display text-gray-900 mb-4">Cash Flow Trends ({projectionYears}-Year Projection)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearlyChartData.map((d, i) => {
                return {
                  ...d,
                  FCF: cashFlowData[i]?.freeCashFlow || 0,
                  FCFE: cashFlowData[i]?.freeCashFlowToEquity || 0,
                  NetToInvestors: cashFlowData[i]?.netCashFlowToInvestors || 0,
                };
              })}>
                <defs>
                  <linearGradient id="noiCfGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#257D41" />
                    <stop offset="100%" stopColor="#34D399" />
                  </linearGradient>
                  <linearGradient id="fcfGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#60A5FA" />
                  </linearGradient>
                  <linearGradient id="fcfeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#F4795B" />
                    <stop offset="100%" stopColor="#FB923C" />
                  </linearGradient>
                </defs>
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
                  dataKey="NOI" 
                  stroke="url(#noiCfGradient)" 
                  strokeWidth={3}
                  dot={{ fill: '#257D41', stroke: '#fff', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#257D41', stroke: '#fff', strokeWidth: 2 }}
                  name="Net Operating Income"
                />
                <Line 
                  type="monotone" 
                  dataKey="FCF" 
                  stroke="url(#fcfGradient)" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', stroke: '#fff', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
                  name="Free Cash Flow"
                />
                <Line 
                  type="monotone" 
                  dataKey="FCFE" 
                  stroke="url(#fcfeGradient)" 
                  strokeWidth={3}
                  dot={{ fill: '#F4795B', stroke: '#fff', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#F4795B', stroke: '#fff', strokeWidth: 2 }}
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
