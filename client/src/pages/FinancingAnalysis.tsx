import { useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { ContentPanel } from "@/components/ui/content-panel";
import { GlassButton } from "@/components/ui/glass-button";
import { formatMoney } from "@/lib/financialEngine";
import {
  Calculator,
  TrendingUp,
  BarChart3,
  ArrowLeftRight,
  Shield,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  Percent,
} from "lucide-react";
import { HelpTooltip } from "@/components/ui/help-tooltip";

type TabId = "dscr" | "debt-yield" | "sensitivity" | "prepayment";

const TABS = [
  { id: "dscr" as TabId, label: "DSCR Sizing", icon: Calculator },
  { id: "debt-yield" as TabId, label: "Debt Yield", icon: TrendingUp },
  { id: "sensitivity" as TabId, label: "Stress Test", icon: BarChart3 },
  { id: "prepayment" as TabId, label: "Prepayment", icon: Shield },
];

function formatPct(val: number | null | undefined, decimals = 2): string {
  if (val == null) return "N/A";
  return `${(val * 100).toFixed(decimals)}%`;
}

function formatRatio(val: number | null | undefined, decimals = 2): string {
  if (val == null) return "N/A";
  return `${val.toFixed(decimals)}x`;
}

function InputField({
  label,
  value,
  onChange,
  type = "number",
  step,
  min,
  max,
  suffix,
  prefix,
  helpText,
  "data-testid": testId,
}: {
  label: string;
  value: string | number;
  onChange: (val: string) => void;
  type?: string;
  step?: string;
  min?: string;
  max?: string;
  suffix?: string;
  prefix?: string;
  helpText?: string;
  "data-testid"?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-600 flex items-center">
        {label}
        {helpText && <HelpTooltip text={helpText} />}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          step={step}
          min={min}
          max={max}
          data-testid={testId}
          className={`w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#9FBCA4] focus:ring-1 focus:ring-[#9FBCA4]/30 ${prefix ? "pl-7" : ""} ${suffix ? "pr-10" : ""}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function DSCRTab() {
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
      <GlassButton variant="primary" onClick={calculate} disabled={loading} data-testid="button-dscr-calculate">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> : <Calculator className="w-4 h-4 mr-2 inline" />}
        Calculate Max Loan
      </GlassButton>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Max Loan (DSCR)" value={result.max_loan_dscr} format="money" variant="glass" data-testid="stat-dscr-max-loan" />
            <StatCard label="Max Loan (LTV)" value={result.max_loan_ltv ?? "N/A"} format={result.max_loan_ltv ? "money" : "text"} variant="glass" data-testid="stat-dscr-ltv-loan" />
            <StatCard label="Binding Constraint" value={result.binding_constraint === "dscr" ? "DSCR" : result.binding_constraint === "ltv" ? "LTV" : "None"} format="text" variant="sage" data-testid="stat-dscr-binding" />
            <StatCard label="Final Max Loan" value={result.max_loan_binding} format="money" variant="sage" data-testid="stat-dscr-final-loan" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Amortizing DSCR" value={formatRatio(result.actual_dscr)} format="text" variant="glass" data-testid="stat-dscr-actual" />
            <StatCard label="IO DSCR" value={result.io_dscr ? formatRatio(result.io_dscr) : "N/A"} format="text" variant="glass" />
            <StatCard label="Monthly Payment (Amort)" value={result.monthly_payment_amortizing} format="money" variant="glass" />
            <StatCard label="Implied LTV" value={result.implied_ltv ? formatPct(result.implied_ltv) : "N/A"} format="text" variant="glass" />
          </div>
        </div>
      )}
    </div>
  );
}

function DebtYieldTab() {
  const [noi, setNoi] = useState("500000");
  const [loanAmount, setLoanAmount] = useState("4000000");
  const [minYield, setMinYield] = useState("8");
  const [purchasePrice, setPurchasePrice] = useState("5000000");
  const [ltvMax, setLtvMax] = useState("75");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculate = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/financing/debt-yield", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          noi_annual: parseFloat(noi),
          loan_amount: parseFloat(loanAmount) || undefined,
          min_debt_yield: parseFloat(minYield) / 100 || undefined,
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
  }, [noi, loanAmount, minYield, purchasePrice, ltvMax]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InputField label="Annual NOI" value={noi} onChange={setNoi} prefix="$" helpText="Net Operating Income used to calculate debt yield" data-testid="input-dy-noi" />
        <InputField label="Loan Amount" value={loanAmount} onChange={setLoanAmount} prefix="$" helpText="Proposed loan amount to evaluate" data-testid="input-dy-loan" />
        <InputField label="Min Debt Yield" value={minYield} onChange={setMinYield} suffix="%" helpText="Lender's minimum debt yield threshold (typically 8–10%)" data-testid="input-dy-min" />
        <InputField label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} prefix="$" helpText="Property purchase price for LTV calculation" data-testid="input-dy-price" />
        <InputField label="Max LTV" value={ltvMax} onChange={setLtvMax} suffix="%" helpText="Maximum Loan-to-Value ratio allowed" data-testid="input-dy-ltv" />
      </div>
      <GlassButton variant="primary" onClick={calculate} disabled={loading} data-testid="button-dy-calculate">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> : <TrendingUp className="w-4 h-4 mr-2 inline" />}
        Analyze Debt Yield
      </GlassButton>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {result && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Debt Yield"
            value={result.debt_yield ? formatPct(result.debt_yield) : "N/A"}
            format="text"
            variant="glass"
            icon={<Percent className="w-4 h-4" />}
            data-testid="stat-dy-yield"
          />
          <StatCard
            label="Passes Threshold"
            value={result.passes_min_threshold === null ? "N/A" : result.passes_min_threshold ? "Yes" : "No"}
            format="text"
            variant={result.passes_min_threshold ? "sage" : "glass"}
            icon={result.passes_min_threshold ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            data-testid="stat-dy-pass"
          />
          <StatCard
            label="Max Loan (Debt Yield)"
            value={result.max_loan_debt_yield ? formatMoney(result.max_loan_debt_yield) : "N/A"}
            format="text"
            variant="glass"
            data-testid="stat-dy-max-loan"
          />
          <StatCard
            label="Binding Constraint"
            value={result.binding_constraint === "debt_yield" ? "Debt Yield" : result.binding_constraint === "ltv" ? "LTV" : "None"}
            format="text"
            variant="sage"
            data-testid="stat-dy-binding"
          />
          <StatCard label="Max Loan (LTV)" value={result.max_loan_ltv ? formatMoney(result.max_loan_ltv) : "N/A"} format="text" variant="glass" />
          <StatCard label="Final Max Loan" value={result.max_loan_binding ? formatMoney(result.max_loan_binding) : "N/A"} format="text" variant="sage" />
          <StatCard label="Implied LTV" value={result.implied_ltv ? formatPct(result.implied_ltv) : "N/A"} format="text" variant="glass" />
        </div>
      )}
    </div>
  );
}

function SensitivityTab() {
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InputField label="Annual NOI" value={noi} onChange={setNoi} prefix="$" helpText="Base NOI before stress adjustments" data-testid="input-sens-noi" />
        <InputField label="Loan Amount" value={loanAmount} onChange={setLoanAmount} prefix="$" helpText="Current or proposed loan principal" data-testid="input-sens-loan" />
        <InputField label="Interest Rate" value={rate} onChange={setRate} suffix="%" helpText="Base interest rate before rate shocks" data-testid="input-sens-rate" />
        <InputField label="Amortization (months)" value={amortMonths} onChange={setAmortMonths} helpText="Amortization schedule for the loan" data-testid="input-sens-amort" />
        <InputField label="Loan Term (months)" value={termMonths} onChange={setTermMonths} helpText="Remaining loan term" data-testid="input-sens-term" />
        <InputField label="IO Period (months)" value={ioMonths} onChange={setIoMonths} helpText="Interest-only months at the start" data-testid="input-sens-io" />
        <InputField label="Min DSCR Threshold" value={minDscr} onChange={setMinDscr} step="0.05" helpText="Red cells in the matrix indicate DSCR below this threshold" data-testid="input-sens-min-dscr" />
      </div>
      <GlassButton variant="primary" onClick={calculate} disabled={loading} data-testid="button-sens-calculate">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> : <BarChart3 className="w-4 h-4 mr-2 inline" />}
        Run Stress Test
      </GlassButton>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Base DSCR" value={formatRatio(result.base_dscr)} format="text" variant="sage" data-testid="stat-sens-base-dscr" />
            <StatCard label="Worst DSCR" value={formatRatio(result.worst_dscr)} format="text" variant="glass" trend="down" />
            <StatCard label="Best DSCR" value={formatRatio(result.best_dscr)} format="text" variant="glass" trend="up" />
            <StatCard
              label="Scenarios Failing"
              value={`${result.failing_scenarios} / ${result.total_scenarios}`}
              format="text"
              variant={result.failing_scenarios > 0 ? "glass" : "sage"}
              icon={result.failing_scenarios > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              data-testid="stat-sens-failing"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left text-gray-500 p-2 border-b border-gray-200">
                    Rate \ NOI
                  </th>
                  {noiShocks.map((ns) => (
                    <th key={ns} className="text-center text-gray-500 p-2 border-b border-gray-200">
                      {ns > 0 ? `+${ns}%` : `${ns}%`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rateShocks.map((rs) => (
                  <tr key={rs}>
                    <td className="text-gray-700 p-2 border-b border-gray-100 font-medium">
                      {rs > 0 ? `+${rs}` : rs} bps
                    </td>
                    {noiShocks.map((ns) => {
                      const cell = result.matrix.find(
                        (c: any) => c.rate_shock_bps === rs && c.noi_shock_pct === ns
                      );
                      if (!cell) return <td key={ns} />;
                      const isBase = rs === 0 && ns === 0;
                      return (
                        <td
                          key={ns}
                          className={`text-center p-2 border-b border-gray-100 font-mono ${
                            !cell.passes
                              ? "bg-red-500/20 text-red-300"
                              : isBase
                              ? "bg-[#9FBCA4]/20 text-[#9FBCA4]"
                              : "text-gray-800"
                          }`}
                          data-testid={`cell-sens-${rs}-${ns}`}
                        >
                          {cell.dscr_amortizing.toFixed(2)}x
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

function PrepaymentTab() {
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
        <label className="text-xs font-medium text-gray-600">Penalty Type</label>
        <div className="flex gap-2">
          {(["yield_maintenance", "step_down", "defeasance"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setPenaltyType(type)}
              data-testid={`button-prepay-type-${type}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                penaltyType === type
                  ? "bg-[#9FBCA4]/30 text-[#9FBCA4] border border-[#9FBCA4]/50"
                  : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
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
        <p className="text-xs text-gray-400">Using standard 5-4-3-2-1 step-down schedule</p>
      )}
      <GlassButton variant="primary" onClick={calculate} disabled={loading} data-testid="button-prepay-calculate">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> : <Shield className="w-4 h-4 mr-2 inline" />}
        Calculate Prepayment Cost
      </GlassButton>
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
              <div className="space-y-2 text-sm text-gray-600">
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

export default function FinancingAnalysis({ embedded }: { embedded?: boolean }) {
  const [activeTab, setActiveTab] = useState<TabId>("dscr");

  const Wrapper = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : Layout;

  return (
    <Wrapper>
      <div className="space-y-6 p-4 md:p-6">
        {!embedded && (
          <PageHeader
            title="Financing Analysis"
            subtitle="Loan sizing, debt yield analysis, stress testing, and prepayment modeling"
          />
        )}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`tab-${tab.id}`}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#9FBCA4]/20 text-[#9FBCA4] border border-[#9FBCA4]/40"
                    : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
        <ContentPanel variant="light">
          {activeTab === "dscr" && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                <Calculator className="w-5 h-5 text-[#9FBCA4] mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">DSCR Loan Sizing</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Determines the maximum loan amount a property can support based on its Debt Service Coverage Ratio (DSCR). 
                    Lenders typically require a minimum DSCR of 1.20x–1.35x, meaning the property's NOI must exceed annual debt payments by that multiple. 
                    Enter your property's NOI and loan terms to see how much you can borrow.
                  </p>
                </div>
              </div>
              <DSCRTab />
            </div>
          )}
          {activeTab === "debt-yield" && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                <TrendingUp className="w-5 h-5 text-[#9FBCA4] mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">Debt Yield Analysis</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Debt Yield = NOI / Loan Amount. It measures the lender's return if they had to foreclose. 
                    Most commercial lenders require a minimum debt yield of 8–10%. 
                    This tool calculates your debt yield and determines the maximum loan based on that threshold, 
                    then compares it against the LTV constraint to find the binding limit.
                  </p>
                </div>
              </div>
              <DebtYieldTab />
            </div>
          )}
          {activeTab === "sensitivity" && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                <BarChart3 className="w-5 h-5 text-[#9FBCA4] mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">Debt Stress Testing</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Tests how your loan performs under adverse conditions. The matrix shows DSCR at every combination of 
                    interest rate changes (in basis points) and NOI changes (in percent). Red cells indicate scenarios 
                    where DSCR falls below your minimum threshold — signaling potential covenant violations or debt service shortfalls.
                  </p>
                </div>
              </div>
              <SensitivityTab />
            </div>
          )}
          {activeTab === "prepayment" && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                <Shield className="w-5 h-5 text-[#9FBCA4] mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">Prepayment Penalty Calculator</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Calculates the cost of paying off a loan early. Three common methods: Yield Maintenance (compensates the lender for lost interest), 
                    Step-Down (declining percentage penalty over time, e.g. 5-4-3-2-1), and Defeasance (replacing the loan with government securities). 
                    Understanding prepayment costs is critical for refinancing or sale decisions.
                  </p>
                </div>
              </div>
              <PrepaymentTab />
            </div>
          )}
        </ContentPanel>
      </div>
    </Wrapper>
  );
}
