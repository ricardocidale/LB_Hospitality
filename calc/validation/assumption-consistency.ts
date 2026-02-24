/**
 * calc/validation/assumption-consistency.ts — Pre-flight validation of model assumptions.
 *
 * PURPOSE:
 * Before the financial engine runs any projections, this module checks that all
 * user-entered assumptions are internally consistent, within reasonable ranges,
 * and free of contradictions. Think of it as a "preflight checklist" that catches
 * data-entry errors before they propagate into multi-year financial projections.
 *
 * SEVERITY LEVELS:
 *   - "critical": Model cannot run (e.g., missing start date, negative occupancy).
 *     The engine should refuse to proceed.
 *   - "material": Results will be unreliable (e.g., start occupancy > max occupancy,
 *     interest rate above 25%). The engine can run but results are suspect.
 *   - "warning": Unusual but not necessarily wrong (e.g., exit cap rate outside
 *     3–15% typical range, no SAFE funding configured).
 *   - "info": Informational notes for the user.
 *
 * ISSUE CATEGORIES:
 *   - missing_value: A required field is not provided.
 *   - out_of_range: A value is outside the reasonable or mathematically valid range.
 *   - contradiction: Two values conflict (e.g., start occupancy exceeds max occupancy).
 *   - timing_conflict: Dates are in the wrong order (e.g., operations before model start,
 *     refinance before acquisition).
 *   - business_rule: A business logic rule is violated (e.g., no funding before operations).
 *
 * KEY FINANCIAL TERMS CHECKED:
 *   - Exit Cap Rate: The capitalization rate used to value the property at sale.
 *     Typical hospitality range: 3–15%. A zero or negative cap rate causes divide-by-zero.
 *   - LTV (Loan-to-Value): Acquisition LTV above 95% is extremely aggressive.
 *   - ADR (Average Daily Rate): Must be positive — zero ADR means zero revenue.
 *   - SAFE (Simple Agreement for Future Equity): Startup funding for the management
 *     company. If no SAFE tranches are configured, the company has no capital before
 *     operations begin.
 *   - Land Value Percent: Portion of purchase price allocated to land (not depreciable).
 *     Typical range: 5–50%.
 *
 * HOW IT FITS THE SYSTEM:
 * Called via the dispatch layer as the "assumption_consistency" skill. Also invoked
 * by the financial auditor before running full projections. The `is_valid` flag
 * (true when no critical or material issues) gates whether the engine proceeds.
 */
export interface AssumptionIssue {
  severity: "critical" | "material" | "warning" | "info";
  category: "missing_value" | "out_of_range" | "contradiction" | "timing_conflict" | "business_rule";
  entity: string;
  field: string;
  message: string;
  current_value: string;
  expected_range: string;
}

export interface AssumptionConsistencyInput {
  global_assumptions: {
    model_start_date: string;
    projection_years?: number;
    company_ops_start_date?: string;
    inflation_rate?: number;
    fixed_cost_escalation_rate?: number;
    base_management_fee?: number;
    incentive_management_fee?: number;
    safe_tranche1_date?: string;
    safe_tranche1_amount?: number;
    safe_tranche2_date?: string;
    safe_tranche2_amount?: number;
    exit_cap_rate?: number;
    debt_assumptions?: {
      interest_rate?: number;
      amortization_years?: number;
      acq_ltv?: number;
      refi_ltv?: number;
    };
  };
  properties?: Array<{
    name: string;
    operations_start_date: string;
    acquisition_date?: string;
    purchase_price: number;
    room_count?: number;
    start_adr?: number;
    start_occupancy?: number;
    max_occupancy?: number;
    type?: string;
    will_refinance?: string;
    refinance_date?: string;
    exit_cap_rate?: number;
    land_value_percent?: number;
  }>;
}

export interface AssumptionConsistencyOutput {
  is_valid: boolean;
  total_issues: number;
  issues: AssumptionIssue[];
  summary_by_severity: {
    critical: number;
    material: number;
    warning: number;
    info: number;
  };
}

export function checkAssumptionConsistency(input: AssumptionConsistencyInput): AssumptionConsistencyOutput {
  const issues: AssumptionIssue[] = [];
  const g = input.global_assumptions;

  // Global checks
  if (!g.model_start_date) {
    issues.push({
      severity: "critical", category: "missing_value", entity: "global", field: "model_start_date",
      message: "Model start date is required", current_value: "missing", expected_range: "Valid ISO date",
    });
  }

  if (g.exit_cap_rate !== undefined && g.exit_cap_rate <= 0) {
    issues.push({
      severity: "critical", category: "out_of_range", entity: "global", field: "exit_cap_rate",
      message: "Exit cap rate must be positive (cannot be 0%)", current_value: String(g.exit_cap_rate),
      expected_range: "0.03 – 0.15 (3% – 15%)",
    });
  }

  if (g.exit_cap_rate !== undefined && (g.exit_cap_rate < 0.03 || g.exit_cap_rate > 0.15)) {
    issues.push({
      severity: "warning", category: "out_of_range", entity: "global", field: "exit_cap_rate",
      message: `Exit cap rate ${(g.exit_cap_rate * 100).toFixed(1)}% is outside typical hospitality range`,
      current_value: String(g.exit_cap_rate), expected_range: "0.03 – 0.15 (3% – 15%)",
    });
  }

  if (g.inflation_rate !== undefined && (g.inflation_rate < 0 || g.inflation_rate > 0.15)) {
    issues.push({
      severity: "warning", category: "out_of_range", entity: "global", field: "inflation_rate",
      message: `Inflation rate ${(g.inflation_rate * 100).toFixed(1)}% is outside reasonable range`,
      current_value: String(g.inflation_rate), expected_range: "0.00 – 0.15 (0% – 15%)",
    });
  }

  if (g.base_management_fee !== undefined && (g.base_management_fee < 0 || g.base_management_fee > 0.10)) {
    issues.push({
      severity: "warning", category: "out_of_range", entity: "global", field: "base_management_fee",
      message: `Base management fee ${(g.base_management_fee * 100).toFixed(1)}% is outside typical range`,
      current_value: String(g.base_management_fee), expected_range: "0.02 – 0.05 (2% – 5%)",
    });
  }

  if (g.debt_assumptions) {
    const da = g.debt_assumptions;
    if (da.interest_rate !== undefined && (da.interest_rate < 0 || da.interest_rate > 0.25)) {
      issues.push({
        severity: "material", category: "out_of_range", entity: "global", field: "debt_assumptions.interest_rate",
        message: `Interest rate ${(da.interest_rate * 100).toFixed(1)}% is outside reasonable range`,
        current_value: String(da.interest_rate), expected_range: "0.02 – 0.15 (2% – 15%)",
      });
    }
    if (da.acq_ltv !== undefined && (da.acq_ltv < 0 || da.acq_ltv > 0.95)) {
      issues.push({
        severity: "material", category: "out_of_range", entity: "global", field: "debt_assumptions.acq_ltv",
        message: `Acquisition LTV ${(da.acq_ltv * 100).toFixed(0)}% exceeds typical maximum`,
        current_value: String(da.acq_ltv), expected_range: "0.50 – 0.80 (50% – 80%)",
      });
    }
  }

  // SAFE funding check
  if (g.company_ops_start_date && g.model_start_date) {
    const noSAFE = !g.safe_tranche1_date && !g.safe_tranche2_date;
    if (noSAFE) {
      issues.push({
        severity: "warning", category: "business_rule", entity: "global", field: "safe_tranche_dates",
        message: "No SAFE funding dates configured — management company may have no funding before operations start",
        current_value: "missing", expected_range: "At least one SAFE tranche date before company_ops_start_date",
      });
    }
  }

  // Property checks
  if (input.properties) {
    for (const prop of input.properties) {
      const entity = `property: ${prop.name}`;

      if (prop.purchase_price <= 0) {
        issues.push({
          severity: "critical", category: "out_of_range", entity, field: "purchase_price",
          message: "Purchase price must be positive", current_value: String(prop.purchase_price),
          expected_range: "> 0",
        });
      }

      if (prop.start_occupancy !== undefined && (prop.start_occupancy < 0 || prop.start_occupancy > 1)) {
        issues.push({
          severity: "critical", category: "out_of_range", entity, field: "start_occupancy",
          message: `Start occupancy ${(prop.start_occupancy * 100).toFixed(0)}% is invalid`,
          current_value: String(prop.start_occupancy), expected_range: "0.00 – 1.00 (0% – 100%)",
        });
      }

      if (prop.max_occupancy !== undefined && (prop.max_occupancy < 0 || prop.max_occupancy > 1)) {
        issues.push({
          severity: "critical", category: "out_of_range", entity, field: "max_occupancy",
          message: `Max occupancy ${(prop.max_occupancy * 100).toFixed(0)}% is invalid`,
          current_value: String(prop.max_occupancy), expected_range: "0.00 – 1.00 (0% – 100%)",
        });
      }

      if (prop.start_occupancy !== undefined && prop.max_occupancy !== undefined &&
        prop.start_occupancy > prop.max_occupancy) {
        issues.push({
          severity: "material", category: "contradiction", entity, field: "start_occupancy / max_occupancy",
          message: `Start occupancy (${(prop.start_occupancy * 100).toFixed(0)}%) exceeds max occupancy (${(prop.max_occupancy * 100).toFixed(0)}%)`,
          current_value: `${prop.start_occupancy} > ${prop.max_occupancy}`,
          expected_range: "start_occupancy <= max_occupancy",
        });
      }

      if (prop.land_value_percent !== undefined && (prop.land_value_percent < 0 || prop.land_value_percent > 0.80)) {
        issues.push({
          severity: "warning", category: "out_of_range", entity, field: "land_value_percent",
          message: `Land value ${(prop.land_value_percent * 100).toFixed(0)}% is outside typical range`,
          current_value: String(prop.land_value_percent), expected_range: "0.05 – 0.50 (5% – 50%)",
        });
      }

      // Timing checks
      if (g.model_start_date && prop.operations_start_date) {
        if (new Date(prop.operations_start_date) < new Date(g.model_start_date)) {
          issues.push({
            severity: "material", category: "timing_conflict", entity, field: "operations_start_date",
            message: `Operations start (${prop.operations_start_date}) is before model start (${g.model_start_date})`,
            current_value: prop.operations_start_date, expected_range: `>= ${g.model_start_date}`,
          });
        }
      }

      if (prop.will_refinance === "Yes" && prop.refinance_date && prop.acquisition_date) {
        if (new Date(prop.refinance_date) <= new Date(prop.acquisition_date)) {
          issues.push({
            severity: "critical", category: "timing_conflict", entity, field: "refinance_date",
            message: `Refinance date (${prop.refinance_date}) is before or at acquisition date (${prop.acquisition_date})`,
            current_value: prop.refinance_date, expected_range: `> ${prop.acquisition_date}`,
          });
        }
      }

      if (prop.start_adr !== undefined && prop.start_adr <= 0) {
        issues.push({
          severity: "critical", category: "out_of_range", entity, field: "start_adr",
          message: "Starting ADR must be positive", current_value: String(prop.start_adr),
          expected_range: "> 0",
        });
      }
    }
  }

  const summary_by_severity = {
    critical: issues.filter(i => i.severity === "critical").length,
    material: issues.filter(i => i.severity === "material").length,
    warning: issues.filter(i => i.severity === "warning").length,
    info: issues.filter(i => i.severity === "info").length,
  };

  return {
    is_valid: summary_by_severity.critical === 0 && summary_by_severity.material === 0,
    total_issues: issues.length,
    issues,
    summary_by_severity,
  };
}
