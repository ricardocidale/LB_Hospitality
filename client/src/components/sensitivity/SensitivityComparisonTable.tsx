import { ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";
import { formatMoney } from "@/lib/financialEngine";
import type { ScenarioResult } from "./types";

interface SensitivityComparisonTableProps {
  baseResult: ScenarioResult;
  adjustedResult: ScenarioResult;
}

export function SensitivityComparisonTable({ baseResult, adjustedResult }: SensitivityComparisonTableProps) {
  const rows = [
    { label: "Total Revenue", base: baseResult.totalRevenue, adj: adjustedResult.totalRevenue, fmt: "money" as const },
    { label: "Total NOI", base: baseResult.totalNOI, adj: adjustedResult.totalNOI, fmt: "money" as const },
    { label: "NOI Margin", base: baseResult.avgNOIMargin, adj: adjustedResult.avgNOIMargin, fmt: "pct" as const },
    { label: "Total Cash Flow", base: baseResult.totalCashFlow, adj: adjustedResult.totalCashFlow, fmt: "money" as const },
    { label: "Exit Value", base: baseResult.exitValue, adj: adjustedResult.exitValue, fmt: "money" as const },
    { label: "Levered IRR", base: baseResult.irr * 100, adj: adjustedResult.irr * 100, fmt: "pct" as const },
  ];

  return (
    <div className="bg-white/80 rounded-lg p-6 border border-primary/10 shadow-[0_2px_8px_rgba(var(--primary-rgb,159,188,164),0.08)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <ArrowUpDown className="w-5 h-5 text-secondary" />
        </div>
        <div>
          <h3 className="text-lg font-display font-bold text-gray-900" data-testid="text-comparison-title">
            Base vs. Adjusted Scenario
          </h3>
          <p className="text-xs text-gray-500">Side-by-side comparison of your current adjustments</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="table-comparison">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-600">Metric</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">Base Case</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">Adjusted</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const delta = row.adj - row.base;
              const deltaPct = row.base !== 0 ? (delta / Math.abs(row.base)) * 100 : 0;
              return (
                <tr key={row.label} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-800">{row.label}</td>
                  <td className="py-3 px-4 text-right font-mono text-gray-600">
                    {row.fmt === "money" ? formatMoney(row.base) : `${row.base.toFixed(1)}%`}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900">
                    {row.fmt === "money" ? formatMoney(row.adj) : `${row.adj.toFixed(1)}%`}
                  </td>
                  <td className={`py-3 px-4 text-right font-mono font-semibold ${
                    delta > 0 ? "text-secondary" : delta < 0 ? "text-red-600" : "text-gray-400"
                  }`}>
                    <div className="flex items-center justify-end gap-1">
                      {delta > 0 ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : delta < 0 ? (
                        <TrendingDown className="w-3.5 h-3.5" />
                      ) : null}
                      <span>
                        {row.fmt === "money"
                          ? `${delta >= 0 ? "+" : ""}${formatMoney(delta)}`
                          : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}pp`}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">
                        ({deltaPct >= 0 ? "+" : ""}{deltaPct.toFixed(1)}%)
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
