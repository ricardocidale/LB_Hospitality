/**
 * calc/analysis/index.ts — Public barrel export for the Analysis module.
 *
 * Re-exports every function and type from the analysis sub-modules:
 *   - consolidateStatements: Multi-property financial statement consolidation with
 *     intercompany elimination (management fees).
 *   - compareScenarios: Side-by-side what-if scenario comparison.
 *   - computeBreakEven: Operating and cash flow break-even occupancy analysis.
 *   - computeRevPARIndex: STR-style competitive positioning indices (MPI, ARI, RGI).
 *   - computeWaterfall: LP/GP equity distribution waterfall with promote tiers.
 *   - computeStressTest: Multi-scenario macro stress testing (recession, pandemic, etc.).
 *   - computeHoldVsSell: NPV-based hold vs. sell decision analysis with tax impact.
 *   - computeCapexReserve: FF&E reserve adequacy and CapEx replacement projections.
 *
 * Together these eight skills provide the strategic analysis layer that sits on top
 * of the core financial projections, helping investors make informed decisions about
 * portfolio composition, risk management, and disposition timing.
 */
export { consolidateStatements } from "./consolidation.js";
export type { ConsolidationInput, ConsolidationOutput } from "./consolidation.js";

export { compareScenarios } from "./scenario-compare.js";
export type { ScenarioCompareInput, ScenarioCompareOutput } from "./scenario-compare.js";

export { computeBreakEven } from "./break-even.js";
export type { BreakEvenInput, BreakEvenOutput } from "./break-even.js";

export { computeRevPARIndex } from "./revpar-index.js";
export type { RevPARIndexInput, RevPARIndexOutput } from "./revpar-index.js";

export { computeWaterfall } from "./waterfall.js";
export type { WaterfallInput, WaterfallOutput, WaterfallTier, WaterfallTierResult } from "./waterfall.js";

export { computeStressTest, STANDARD_STRESS_SCENARIOS } from "./stress-test.js";
export type { StressTestInput, StressTestOutput, StressScenario, StressScenarioResult } from "./stress-test.js";

export { computeHoldVsSell } from "./hold-vs-sell.js";
export type { HoldVsSellInput, HoldVsSellOutput, HoldScenario, SellScenario } from "./hold-vs-sell.js";

export { computeCapexReserve } from "./capex-reserve.js";
export type { CapexReserveInput, CapexReserveOutput, CapexCategory, CapexCategoryStatus, CapexYearProjection } from "./capex-reserve.js";
