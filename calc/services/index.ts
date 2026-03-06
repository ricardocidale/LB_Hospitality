/**
 * calc/services/index.ts — Public barrel export for centralized services calculations.
 *
 * Re-exports the cost-plus markup calculator and aggregator used by the financial
 * engine to compute the management company's cost of centralized services.
 *
 * The management company can provide services to properties in two modes:
 *   - Centralized: company procures externally, charges cost + markup
 *   - Direct: property handles, company earns oversight fee (no vendor cost)
 */
export { vendorCostFromFee, grossProfitFromFee, feeFromVendorCost, effectiveMargin } from "./margin-calculator.js";
export { computeCostOfServices } from "./cost-of-services.js";
export type { ServiceTemplate, ServiceCostResult, AggregatedServiceCosts, ServiceModel } from "./types.js";
