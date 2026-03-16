import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Loader2 } from "@/components/icons/themed-icons";
import { IconBarChart3, IconAlertTriangle, IconCheckCircle } from "@/components/icons";
import { InsightPanel } from "@/components/graphics";
import { InputField, formatRatio } from "./InputField";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function StressTestTab() {
  const [noi, setNoi] = useState("500000");
  const [loanAmount, setLoanAmount] = useState("3500000");
  const [rate, setRate] = useState("7");
  const [amortMonths, setAmortMonths] = useState("360");
  const [termMonths, setTermMonths] = useState("120");
  const [ioMonths, setIoMonths] = useState("24");
  const [minDscr, setMinDscr] = useState("1.25");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const rateShocks = [-200, -100, -50, 0, 50, 100, 200];
  const noiShocks = [-20, -10, -5, 0, 5, 10, 20];

  const calculate = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/financing/sensitivity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          noi_annual: parseFloat(noi),
          loan_amount: parseFloat(loanAmount),
          interest_rate_annual: parseFloat(rate) / 100,
          amortization_months: parseInt(amortMonths),
          term_months: parseInt(termMonths),
          io_months: parseInt(ioMonths) || 0,
          rate_shocks_bps: rateShocks,
          noi_shocks_pct: noiShocks,
          min_dscr: parseFloat(minDscr),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Calculation failed");
      }
      setResult(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [noi, loanAmount, rate, amortMonths, termMonths, ioMonths, minDscr]);

  const getHeatmapColor = (value: number, threshold: number) => {
    if (value >= threshold + 0.5) return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400";
    if (value >= threshold) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500";
    if (value >= threshold - 0.1) return "bg-amber-500/10 text-amber-600 dark:text-amber-500";
    if (value >= threshold - 0.25) return "bg-orange-500/10 text-orange-600 dark:text-orange-500";
    return "bg-red-500/10 text-red-600 dark:text-red-500";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InputField label="Annual ANOI" value={noi} onChange={setNoi} prefix="$" helpText="Base ANOI before stress adjustments" data-testid="input-sens-noi" />
        <InputField label="Loan Amount" value={loanAmount} onChange={setLoanAmount} prefix="$" helpText="Current or proposed loan principal" data-testid="input-sens-loan" />
        <InputField label="Interest Rate" value={rate} onChange={setRate} suffix="%" helpText="Base interest rate before rate shocks" data-testid="input-sens-rate" />
        <InputField label="Amortization (months)" value={amortMonths} onChange={setAmortMonths} helpText="Amortization schedule for the loan" data-testid="input-sens-amort" />
        <InputField label="Loan Term (months)" value={termMonths} onChange={setTermMonths} helpText="Remaining loan term" data-testid="input-sens-term" />
        <InputField label="IO Period (months)" value={ioMonths} onChange={setIoMonths} helpText="Interest-only months at the start" data-testid="input-sens-io" />
        <InputField label="Min DSCR Threshold" value={minDscr} onChange={setMinDscr} step="0.05" helpText="Red cells in the matrix indicate DSCR below this threshold" data-testid="input-sens-min-dscr" />
      </div>
      <Button
        onClick={calculate}
        disabled={loading}
        variant="default"
        data-testid="button-sens-calculate"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> : <IconBarChart3 className="w-4 h-4 mr-2 inline" />}
        Run Stress Test
      </Button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Base DSCR" value={formatRatio(result.base_dscr)} format="text" variant="sage" data-testid="stat-sens-base-dscr" />
            <StatCard label="Worst DSCR" value={formatRatio(result.worst_dscr)} format="text" trend="down" />
            <StatCard label="Best DSCR" value={formatRatio(result.best_dscr)} format="text" trend="up" />
            <StatCard
              label="Scenarios Failing"
              value={`${result.failing_scenarios} / ${result.total_scenarios}`}
              format="text"
              variant={result.failing_scenarios > 0 ? undefined : "sage"}
              icon={result.failing_scenarios > 0 ? <IconAlertTriangle className="w-4 h-4" /> : <IconCheckCircle className="w-4 h-4" />}
              data-testid="stat-sens-failing"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left text-muted-foreground p-2 border-b border-border">
                    Rate \ NOI
                  </th>
                  {noiShocks.map((ns) => (
                    <th key={ns} className="text-center text-muted-foreground p-2 border-b border-border">
                      {ns > 0 ? `+${ns}%` : `${ns}%`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rateShocks.map((rs) => (
                  <tr key={rs}>
                    <td className="text-foreground p-2 border-b border-border font-medium">
                      {rs > 0 ? `+${rs}` : rs} bps
                    </td>
                    {noiShocks.map((ns) => {
                      const cell = result.matrix.find(
                        (c: any) => c.rate_shock_bps === rs && c.noi_shock_pct === ns
                      );
                      if (!cell) return <td key={ns} />;
                      const isBase = rs === 0 && ns === 0;
                      const dscr = cell.dscr_amortizing;
                      return (
                        <td
                          key={ns}
                          className="p-0 border-b border-border"
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`w-full h-full p-2 text-center font-mono transition-colors ${
                                    isBase ? "ring-2 ring-primary ring-inset z-10 relative" : ""
                                  } ${getHeatmapColor(dscr, parseFloat(minDscr))}`}
                                  data-testid={`cell-sens-${rs}-${ns}`}
                                >
                                  {dscr.toFixed(2)}x
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs space-y-1">
                                  <p className="font-semibold">Scenario Details</p>
                                  <p>NOI: {ns > 0 ? `+${ns}%` : `${ns}%`}</p>
                                  <p>Rate: {rs > 0 ? `+${rs}` : rs} bps</p>
                                  <p>DSCR: {dscr.toFixed(3)}x</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
