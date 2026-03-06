/**
 * markup-waterfall.ts — Compute cost-plus markup waterfall for a service.
 *
 * Given vendor cost and markup percentage, produces the full waterfall:
 * vendor cost → fee charged → gross profit → effective margin.
 * Also provides industry markup benchmarks by service type.
 */

interface MarkupWaterfallInput {
  vendorCost: number;
  markupPct: number;
  serviceType?: string;
}

interface MarkupWaterfallOutput {
  vendorCost: number;
  markupPct: number;
  feeCharged: number;
  grossProfit: number;
  effectiveMargin: number;
  industryMarkupRange: { low: number; mid: number; high: number } | null;
  serviceType: string | null;
}

// skipcalcscan — static industry reference data, not configurable assumptions
const INDUSTRY_MARKUPS: Record<string, { low: number; mid: number; high: number }> = {
  marketing: { low: 0.15, mid: 0.25, high: 0.35 },
  it: { low: 0.10, mid: 0.20, high: 0.30 },
  accounting: { low: 0.20, mid: 0.30, high: 0.40 },
  revenue_management: { low: 0.15, mid: 0.20, high: 0.30 },
  procurement: { low: 0.08, mid: 0.15, high: 0.25 },
  hr: { low: 0.10, mid: 0.20, high: 0.30 },
  design: { low: 0.15, mid: 0.25, high: 0.40 },
  general_management: { low: 0.10, mid: 0.15, high: 0.25 },
};

export function computeMarkupWaterfall(input: MarkupWaterfallInput): MarkupWaterfallOutput {
  const { vendorCost, markupPct } = input;
  const feeCharged = vendorCost * (1 + markupPct);
  const grossProfit = feeCharged - vendorCost;
  const effectiveMargin = feeCharged > 0 ? grossProfit / feeCharged : 0;

  const key = (input.serviceType ?? "").toLowerCase().replace(/[\s/&]+/g, "_");
  const industryMarkupRange = INDUSTRY_MARKUPS[key] ?? null;

  return {
    vendorCost,
    markupPct,
    feeCharged: Math.round(feeCharged * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    effectiveMargin: Math.round(effectiveMargin * 10000) / 10000,
    industryMarkupRange,
    serviceType: input.serviceType ?? null,
  };
}
