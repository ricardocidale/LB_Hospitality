/**
 * calc/research/index.ts — Public barrel export for research calculators.
 *
 * These deterministic calculators are used by AI research tools to validate
 * LLM-generated recommendations against exact financial math. Each function
 * takes structured inputs and returns precise outputs — no estimation.
 */
export { computePropertyMetrics } from "./property-metrics.js";
export { computeDepreciationBasis } from "./depreciation-basis.js";
export { computeDebtCapacity } from "./debt-capacity.js";
export { computeOccupancyRamp } from "./occupancy-ramp.js";
export { computeADRProjection } from "./adr-projection.js";
export { computeCapRateValuation } from "./cap-rate-valuation.js";
export { computeCostBenchmarks } from "./cost-benchmarks.js";
export { computeMakeVsBuy } from "./make-vs-buy.js";
export { computeServiceFee } from "./service-fee.js";
export { computeMarkupWaterfall } from "./markup-waterfall.js";
export { validateResearchValues } from "./validate-research.js";
export type { ValidatedResearchValues } from "./validate-research.js";
