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
