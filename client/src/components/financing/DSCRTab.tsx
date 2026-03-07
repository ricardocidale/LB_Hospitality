import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Loader2, Calculator } from "lucide-react";
import { formatMoney } from "@/lib/financialEngine";
import { Gauge, DonutChart, InsightPanel } from "@/components/graphics";
import { InputField, formatPct, formatRatio } from "./InputField";

export function DSCRTab() {
  const [noi, setNoi] = useState("500000");
  const [rate, setRate] = useState("7");
  const [termMonths, setTermMonths] = useState("120");
  const [amortMonths, setAmortMonths] = useState("360");
  const [ioMonths, setIoMonths] = useState("24");
  const [minDscr, setMinDscr] = useState("1.25");
  const [purchasePrice, setPurchasePrice] = useState("5000000");
  const [ltvMax, setLtvMax] = useState("75");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculate = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/financing/dscr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          noi_annual: parseFloat(noi),
          interest_rate_annual: parseFloat(rate) / 100,
          term_months: parseInt(termMonths),
          amortization_months: parseInt(amortMonths),
          io_months: parseInt(ioMonths) || 0,
          min_dscr: parseFloat(minDscr),
          purchase_price: parseFloat(purchasePrice) || undefined,
          ltv_max: parseFloat(ltvMax) / 100 || undefined,
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
  }, [noi, rate, termMonths, amortMonths, ioMonths, minDscr, purchasePrice, ltvMax]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InputField label="Annual NOI" value={noi} onChange={setNoi} prefix="$" helpText="Net Operating Income: total revenue minus operating expenses, before debt service" data-testid="input-dscr-noi" />
        <InputField label="Interest Rate" value={rate} onChange={setRate} suffix="%" step="0.25" helpText="Annual interest rate on the loan" data-testid="input-dscr-rate" />
        <InputField label="Loan Term (months)" value={termMonths} onChange={setTermMonths} helpText="Total duration of the loan before maturity or balloon payment" data-testid="input-dscr-term" />
        <InputField label="Amortization (months)" value={amortMonths} onChange={setAmortMonths} helpText="Period over which principal is repaid — longer = lower monthly payments" data-testid="input-dscr-amort" />
        <InputField label="IO Period (months)" value={ioMonths} onChange={setIoMonths} helpText="Interest-only period at the start of the loan — no principal payments during this time" data-testid="input-dscr-io" />
        <InputField label="Minimum DSCR" value={minDscr} onChange={setMinDscr} step="0.05" helpText="Lender's required minimum Debt Service Coverage Ratio (typically 1.20x–1.35x)" data-testid="input-dscr-min" />
        <InputField label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} prefix="$" helpText="Total acquisition price of the property" data-testid="input-dscr-price" />
        <InputField label="Max LTV" value={ltvMax} onChange={setLtvMax} suffix="%" helpText="Maximum Loan-to-Value ratio the lender will allow (typically 65–75%)" data-testid="input-dscr-ltv" />
      </div>
      <Button
        onClick={calculate}
        disabled={loading}
        variant="default"
        data-testid="button-dscr-calculate"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> : <Calculator className="w-4 h-4 mr-2 inline" />}
        Calculate Max Loan
      </Button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Max Loan (DSCR)" value={result.max_loan_dscr} format="money" data-testid="stat-dscr-max-loan" />
            <StatCard label="Max Loan (LTV)" value={result.max_loan_ltv ?? "N/A"} format={result.max_loan_ltv ? "money" : "text"} data-testid="stat-dscr-ltv-loan" />
            <StatCard label="Binding Constraint" value={result.binding_constraint === "dscr" ? "DSCR" : result.binding_constraint === "ltv" ? "LTV" : "None"} format="text" variant="sage" data-testid="stat-dscr-binding" />
            <StatCard label="Final Max Loan" value={result.max_loan_binding} format="money" variant="sage" data-testid="stat-dscr-final-loan" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Amortizing DSCR" value={formatRatio(result.actual_dscr)} format="text" data-testid="stat-dscr-actual" />
            <StatCard label="IO DSCR" value={result.io_dscr ? formatRatio(result.io_dscr) : "N/A"} format="text" />
            <StatCard label="Monthly Payment (Amort)" value={result.monthly_payment_amortizing} format="money" />
            <StatCard label="Implied LTV" value={result.implied_ltv ? formatPct(result.implied_ltv) : "N/A"} format="text" />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Gauge
              data-testid="gauge-dscr"
              value={result.actual_dscr ?? 0}
              min={0}
              max={3}
              label="Amortizing DSCR"
              format={(v: number) => `${v.toFixed(2)}x`}
              thresholds={{ good: parseFloat(minDscr), warn: 1.0 }}
              size="lg"
            />
            {result.io_dscr && (
              <Gauge
                data-testid="gauge-io-dscr"
                value={result.io_dscr}
                min={0}
                max={3}
                label="IO Period DSCR"
                format={(v: number) => `${v.toFixed(2)}x`}
                thresholds={{ good: parseFloat(minDscr), warn: 1.0 }}
                size="lg"
              />
            )}
            <DonutChart
              data-testid="donut-loan-constraint"
              data={[
                { name: "DSCR Limit", value: result.max_loan_dscr ?? 0 },
                ...(result.max_loan_ltv ? [{ name: "LTV Limit", value: result.max_loan_ltv }] : []),
              ]}
              title="Loan Constraint Comparison"
              subtitle="Max loan by constraint type"
              centerValue={formatMoney(result.max_loan_binding)}
              centerLabel="Binding Limit"
              formatValue={(v: number) => formatMoney(v)}
              height={200}
            />
          </div>
          <InsightPanel
            data-testid="insight-dscr"
            variant="compact"
            title="Loan Sizing Insights"
            insights={[
              { text: `Binding constraint is ${result.binding_constraint === "dscr" ? "DSCR" : "LTV"}`, type: "neutral" as const },
              { text: "Actual DSCR", metric: formatRatio(result.actual_dscr), type: (result.actual_dscr ?? 0) >= parseFloat(minDscr) ? "positive" as const : "warning" as const },
              ...(result.implied_ltv ? [{ text: "Implied LTV", metric: formatPct(result.implied_ltv), type: (result.implied_ltv ?? 0) <= 0.75 ? "positive" as const : "warning" as const }] : []),
              { text: "Max loan amount", metric: formatMoney(result.max_loan_binding), type: "neutral" as const },
            ]}
          />
        </div>
      )}
    </div>
  );
}
