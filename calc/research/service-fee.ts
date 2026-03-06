/**
 * service-fee.ts — Compute service fee ranges at market rates.
 *
 * Given a property's total revenue and a service type, outputs
 * the expected fee range based on industry benchmarks for
 * hospitality management company services.
 */

interface ServiceFeeInput {
  propertyRevenue: number;
  serviceType: string;
}

interface ServiceFeeOutput {
  serviceType: string;
  propertyRevenue: number;
  lowRate: number;
  midRate: number;
  highRate: number;
  lowFee: number;
  midFee: number;
  highFee: number;
  notes: string;
}

// skipcalcscan — static industry reference data, not configurable assumptions
const SERVICE_BENCHMARKS: Record<string, { low: number; mid: number; high: number; notes: string }> = {
  marketing: { low: 0.015, mid: 0.025, high: 0.04, notes: "Digital marketing, OTA management, brand campaigns. Boutique hotels typically 2-4% of revenue." },
  it: { low: 0.01, mid: 0.015, high: 0.025, notes: "PMS, RMS, channel manager, cybersecurity. Per-property licensing $2K-$5K/yr." },
  accounting: { low: 0.01, mid: 0.02, high: 0.03, notes: "Monthly close, reporting, tax prep, audit support. Scale economies at 5+ properties." },
  revenue_management: { low: 0.015, mid: 0.02, high: 0.03, notes: "Dynamic pricing, demand forecasting, competitive analysis." },
  procurement: { low: 0.005, mid: 0.01, high: 0.02, notes: "Group purchasing, vendor negotiation, FF&E sourcing." },
  hr: { low: 0.005, mid: 0.01, high: 0.015, notes: "Recruitment, training programs, compliance, payroll processing." },
  design: { low: 0.005, mid: 0.01, high: 0.02, notes: "Interior design, brand standards, renovation management." },
  general_management: { low: 0.03, mid: 0.05, high: 0.08, notes: "Base management fee covering day-to-day operations oversight." },
};

export function computeServiceFee(input: ServiceFeeInput): ServiceFeeOutput {
  const key = input.serviceType.toLowerCase().replace(/[\s/&]+/g, "_");
  const bench = SERVICE_BENCHMARKS[key] ?? { low: 0.01, mid: 0.02, high: 0.03, notes: `No specific benchmark for "${input.serviceType}". Using general service range 1-3%.` };

  return {
    serviceType: input.serviceType,
    propertyRevenue: input.propertyRevenue,
    lowRate: bench.low,
    midRate: bench.mid,
    highRate: bench.high,
    lowFee: Math.round(input.propertyRevenue * bench.low),
    midFee: Math.round(input.propertyRevenue * bench.mid),
    highFee: Math.round(input.propertyRevenue * bench.high),
    notes: bench.notes,
  };
}
