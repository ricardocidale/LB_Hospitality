import { roundCents, sumArray, pctChange } from "../shared/utils.js";

export interface ScenarioMetrics {
  total_revenue?: number[];
  noi: number[];
  net_income?: number[];
  ending_cash?: number[];
  irr: number;
  equity_multiple?: number;
  average_dscr?: number;
  exit_value?: number;
}

export interface AssumptionChange {
  field: string;
  baseline_value: string;
  alternative_value: string;
}

export interface ScenarioCompareInput {
  baseline_label: string;
  alternative_label: string;
  assumption_changes?: AssumptionChange[];
  baseline_metrics: ScenarioMetrics;
  alternative_metrics: ScenarioMetrics;
}

export interface YearlyDelta {
  year: number;
  revenue_delta: number;
  noi_delta: number;
  net_income_delta: number;
  cash_delta: number;
}

export interface SensitivityRanking {
  assumption: string;
  impact_on_irr_bps: number;
}

export interface ScenarioCompareOutput {
  summary: {
    irr_delta: number;
    irr_direction: "improved" | "worsened" | "unchanged";
    equity_multiple_delta: number;
    cumulative_noi_delta: number;
    cumulative_noi_pct_change: number;
    exit_value_delta: number;
  };
  yearly_deltas: YearlyDelta[];
  risk_flags: string[];
  sensitivity_ranking: SensitivityRanking[];
}

export function compareScenarios(input: ScenarioCompareInput): ScenarioCompareOutput {
  const b = input.baseline_metrics;
  const a = input.alternative_metrics;

  const irr_delta = Math.round((a.irr - b.irr) * 10000);

  let irr_direction: "improved" | "worsened" | "unchanged";
  if (Math.abs(irr_delta) < 1) irr_direction = "unchanged";
  else if (irr_delta > 0) irr_direction = "improved";
  else irr_direction = "worsened";

  const equity_multiple_delta = (a.equity_multiple ?? 0) - (b.equity_multiple ?? 0);
  const exit_value_delta = (a.exit_value ?? 0) - (b.exit_value ?? 0);

  const baseNOI = sumArray(b.noi);
  const altNOI = sumArray(a.noi);
  const cumulative_noi_delta = roundCents(altNOI - baseNOI);
  const cumulative_noi_pct_change = pctChange(baseNOI, altNOI);

  const years = Math.max(b.noi.length, a.noi.length);
  const yearly_deltas: YearlyDelta[] = [];
  const risk_flags: string[] = [];

  for (let y = 0; y < years; y++) {
    const bRev = b.total_revenue?.[y] ?? 0;
    const aRev = a.total_revenue?.[y] ?? 0;
    const bNOI = b.noi[y] ?? 0;
    const aNOI = a.noi[y] ?? 0;
    const bNI = b.net_income?.[y] ?? 0;
    const aNI = a.net_income?.[y] ?? 0;
    const bCash = b.ending_cash?.[y] ?? 0;
    const aCash = a.ending_cash?.[y] ?? 0;

    yearly_deltas.push({
      year: y + 1,
      revenue_delta: roundCents(aRev - bRev),
      noi_delta: roundCents(aNOI - bNOI),
      net_income_delta: roundCents(aNI - bNI),
      cash_delta: roundCents(aCash - bCash),
    });

    if (aCash < 0 && bCash >= 0) risk_flags.push(`Alternative scenario produces negative cash in Year ${y + 1}`);
    if (aNOI < 0 && bNOI >= 0) risk_flags.push(`Alternative scenario produces negative NOI in Year ${y + 1}`);
  }

  if (irr_delta < -200) risk_flags.push(`IRR decreased by ${Math.abs(irr_delta)} bps — significant downside risk`);

  const sensitivity_ranking: SensitivityRanking[] = [];
  if (input.assumption_changes && input.assumption_changes.length > 0) {
    const perAssumptionImpact = Math.abs(irr_delta) / input.assumption_changes.length;
    for (const change of input.assumption_changes) {
      sensitivity_ranking.push({ assumption: change.field, impact_on_irr_bps: Math.round(perAssumptionImpact) });
    }
  }

  return {
    summary: {
      irr_delta, irr_direction,
      equity_multiple_delta: Math.round(equity_multiple_delta * 10000) / 10000,
      cumulative_noi_delta, cumulative_noi_pct_change,
      exit_value_delta: roundCents(exit_value_delta),
    },
    yearly_deltas,
    risk_flags,
    sensitivity_ranking,
  };
}
