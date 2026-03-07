import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { ContentPanel } from "@/components/ui/content-panel";
import { Loader2, Shield } from "lucide-react";
import { formatMoney } from "@/lib/financialEngine";
import { InputField, formatPct } from "./InputField";

export function PrepaymentTab() {
  const [balance, setBalance] = useState("3000000");
  const [prepayMonth, setPrepayMonth] = useState("36");
  const [loanRate, setLoanRate] = useState("7");
  const [termMonths, setTermMonths] = useState("120");
  const [penaltyType, setPenaltyType] = useState<"yield_maintenance" | "step_down" | "defeasance">("yield_maintenance");
  const [treasuryRate, setTreasuryRate] = useState("4");
  const [defeasanceFeePct, setDefeasanceFeePct] = useState("1");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculate = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const body: any = {
        outstanding_balance: parseFloat(balance),
        prepayment_month: parseInt(prepayMonth),
        loan_rate_annual: parseFloat(loanRate) / 100,
        term_months: parseInt(termMonths),
        prepayment_type: penaltyType,
      };
      if (penaltyType === "yield_maintenance" || penaltyType === "defeasance") {
        body.treasury_rate_annual = parseFloat(treasuryRate) / 100;
      }
      if (penaltyType === "step_down") {
        body.step_down_schedule = [0.05, 0.04, 0.03, 0.02, 0.01];
      }
      if (penaltyType === "defeasance") {
        body.defeasance_fee_pct = parseFloat(defeasanceFeePct) / 100;
      }
      const res = await fetch("/api/financing/prepayment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
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
  }, [balance, prepayMonth, loanRate, termMonths, penaltyType, treasuryRate, defeasanceFeePct]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InputField label="Outstanding Balance" value={balance} onChange={setBalance} prefix="$" helpText="Remaining loan principal at prepayment date" data-testid="input-prepay-balance" />
        <InputField label="Prepayment Month" value={prepayMonth} onChange={setPrepayMonth} helpText="Month number from loan origination when you plan to prepay" data-testid="input-prepay-month" />
        <InputField label="Loan Rate" value={loanRate} onChange={setLoanRate} suffix="%" helpText="Annual interest rate on the loan being prepaid" data-testid="input-prepay-rate" />
        <InputField label="Loan Term (months)" value={termMonths} onChange={setTermMonths} helpText="Original loan term in months" data-testid="input-prepay-term" />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Penalty Type</label>
        <div className="flex gap-2">
          {(["yield_maintenance", "step_down", "defeasance"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setPenaltyType(type)}
              data-testid={`button-prepay-type-${type}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                penaltyType === type
                  ? "bg-primary/30 text-primary border border-primary/50"
                  : "bg-muted text-muted-foreground border border-border hover:bg-muted"
              }`}
            >
              {type === "yield_maintenance" ? "Yield Maintenance" : type === "step_down" ? "Step-Down" : "Defeasance"}
            </button>
          ))}
        </div>
      </div>
      {(penaltyType === "yield_maintenance" || penaltyType === "defeasance") && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InputField label="Treasury Rate" value={treasuryRate} onChange={setTreasuryRate} suffix="%" data-testid="input-prepay-treasury" />
          {penaltyType === "defeasance" && (
            <InputField label="Admin Fee %" value={defeasanceFeePct} onChange={setDefeasanceFeePct} suffix="%" data-testid="input-prepay-admin-fee" />
          )}
        </div>
      )}
      {penaltyType === "step_down" && (
        <p className="text-xs text-muted-foreground">Using standard 5-4-3-2-1 step-down schedule</p>
      )}
      <Button variant="default" onClick={calculate} disabled={loading} data-testid="button-prepay-calculate">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> : <Shield className="w-4 h-4 mr-2 inline" />}
        Calculate Prepayment Cost
      </Button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Outstanding Balance" value={result.balance_at_prepayment} format="money" variant="glass" data-testid="stat-prepay-balance" />
            <StatCard label="Penalty Amount" value={result.penalty_amount} format="money" variant="glass" data-testid="stat-prepay-penalty" />
            <StatCard label="Penalty %" value={formatPct(result.penalty_pct)} format="text" variant="glass" />
            <StatCard label="Total Prepayment Cost" value={result.total_prepayment_cost} format="money" variant="sage" data-testid="stat-prepay-total" />
            <StatCard label="Months Remaining" value={result.months_remaining} format="number" variant="glass" />
          </div>
          {result.details && (
            <ContentPanel variant="light" title="Penalty Details">
              <div className="space-y-2 text-sm text-muted-foreground">
                {result.details.type === "yield_maintenance" && (
                  <>
                    <p>Rate Differential: {formatPct(result.details.rate_differential)}</p>
                    <p>PV of Differential: {formatMoney(result.details.pv_differential)}</p>
                    <p>Treasury Rate: {formatPct(result.details.treasury_rate)}</p>
                  </>
                )}
                {result.details.type === "step_down" && (
                  <>
                    <p>Loan Year: {result.details.loan_year}</p>
                    <p>Year Penalty Rate: {formatPct(result.details.year_penalty_pct)}</p>
                  </>
                )}
                {result.details.type === "defeasance" && (
                  <>
                    <p>Securities Cost: {formatMoney(result.details.securities_cost)}</p>
                    <p>Admin Fees: {formatMoney(result.details.admin_fees)}</p>
                  </>
                )}
              </div>
            </ContentPanel>
          )}
        </div>
      )}
    </div>
  );
}
