/**
 * validate-research.ts — Post-LLM Research Value Validation
 *
 * Runs extracted research values through deterministic tools to catch
 * hallucinated or unreasonable financial recommendations before they
 * are saved to the property record.
 *
 * Each validation produces a flag: "pass", "warn", or "fail" with a reason.
 */
import { computePropertyMetrics } from "./property-metrics.js";
import { computeCapRateValuation } from "./cap-rate-valuation.js";

interface ResearchValueEntry {
  display: string;
  mid: number;
  source: "ai";
}

interface PropertyContext {
  roomCount: number;
  startAdr: number;
  maxOccupancy: number;
  purchasePrice?: number;
  costRateRooms?: number;
  costRateFB?: number;
}

interface ValidationFlag {
  status: "pass" | "warn" | "fail";
  reason?: string;
}

export interface ValidatedResearchValues {
  values: Record<string, ResearchValueEntry & { validation?: ValidationFlag }>;
  summary: {
    total: number;
    passed: number;
    warned: number;
    failed: number;
  };
}

// Reasonable bounds for hospitality metrics
const BOUNDS = {
  adr: { min: 50, max: 2000 },               // $50-$2000/night
  occupancy: { min: 20, max: 100 },           // 20%-100%
  startOccupancy: { min: 10, max: 90 },       // 10%-90%
  capRate: { min: 3, max: 15 },               // 3%-15%
  noiMargin: { min: 5, max: 55 },             // 5%-55% (reasonable for hotels)
  costRate: { min: 0.5, max: 50 },            // 0.5%-50% for any cost category
  catering: { min: 5, max: 80 },              // 5%-80% boost
  landValue: { min: 5, max: 60 },             // 5%-60% of purchase price
  incomeTax: { min: 5, max: 50 },             // 5%-50% effective rate
  revShare: { min: 1, max: 60 },              // 1%-60% of room revenue
  svcFee: { min: 0.5, max: 10 },              // 0.5%-10% per service category
  rampMonths: { min: 3, max: 36 },            // 3-36 months
};

function checkBounds(value: number, bounds: { min: number; max: number }, label: string): ValidationFlag {
  if (value < bounds.min) return { status: "warn", reason: `${label} (${value}) below typical minimum (${bounds.min})` };
  if (value > bounds.max) return { status: "warn", reason: `${label} (${value}) above typical maximum (${bounds.max})` };
  return { status: "pass" };
}

/**
 * Validate extracted research values against deterministic financial models.
 * Returns the same values with validation flags attached.
 */
export function validateResearchValues(
  extracted: Record<string, ResearchValueEntry>,
  property: PropertyContext
): ValidatedResearchValues {
  const values: Record<string, ResearchValueEntry & { validation?: ValidationFlag }> = {};
  let passed = 0, warned = 0, failed = 0;

  const addValidation = (key: string, entry: ResearchValueEntry, flag: ValidationFlag) => {
    values[key] = { ...entry, validation: flag };
    if (flag.status === "pass") passed++;
    else if (flag.status === "warn") warned++;
    else failed++;
  };

  for (const [key, entry] of Object.entries(extracted)) {
    // Bounds checks by key pattern
    if (key === "adr") {
      const flag = checkBounds(entry.mid, BOUNDS.adr, "ADR");
      if (flag.status === "pass") {
        // Cross-validate: compute metrics with recommended ADR
        const metrics = computePropertyMetrics({
          room_count: property.roomCount,
          adr: entry.mid,
          occupancy: property.maxOccupancy,
          cost_rate_rooms: property.costRateRooms,
          cost_rate_fb: property.costRateFB,
        });
        if (metrics.noi_margin_pct < BOUNDS.noiMargin.min) {
          addValidation(key, entry, { status: "warn", reason: `ADR $${entry.mid} yields ${metrics.noi_margin_pct.toFixed(1)}% NOI margin (below ${BOUNDS.noiMargin.min}%)` });
          continue;
        }
      }
      addValidation(key, entry, flag);

    } else if (key === "occupancy") {
      addValidation(key, entry, checkBounds(entry.mid, BOUNDS.occupancy, "Stabilized occupancy"));

    } else if (key === "startOccupancy") {
      const flag = checkBounds(entry.mid, BOUNDS.startOccupancy, "Starting occupancy");
      if (flag.status === "pass" && extracted["occupancy"]) {
        // Start occupancy should be less than stabilized
        if (entry.mid >= extracted["occupancy"].mid) {
          addValidation(key, entry, { status: "warn", reason: `Start occupancy (${entry.mid}%) >= stabilized (${extracted["occupancy"].mid}%)` });
          continue;
        }
      }
      addValidation(key, entry, flag);

    } else if (key === "capRate") {
      const flag = checkBounds(entry.mid, BOUNDS.capRate, "Cap rate");
      if (flag.status === "pass" && property.purchasePrice) {
        // Cross-validate: compute implied value
        const metrics = computePropertyMetrics({
          room_count: property.roomCount,
          adr: property.startAdr,
          occupancy: property.maxOccupancy,
        });
        if (metrics.annual_noi > 0) {
          const valuation = computeCapRateValuation({
            annual_noi: metrics.annual_noi,
            cap_rate: entry.mid / 100,
            purchase_price: property.purchasePrice,
          });
          // Implied value should be within 3x of purchase price
          if (valuation.implied_value > property.purchasePrice * 3) {
            addValidation(key, entry, { status: "warn", reason: `Cap rate ${entry.mid}% implies value $${valuation.implied_value.toLocaleString()} (>3x purchase price $${property.purchasePrice.toLocaleString()})` });
            continue;
          }
          if (valuation.implied_value < property.purchasePrice * 0.3) {
            addValidation(key, entry, { status: "warn", reason: `Cap rate ${entry.mid}% implies value $${valuation.implied_value.toLocaleString()} (<30% of purchase price $${property.purchasePrice.toLocaleString()})` });
            continue;
          }
        }
      }
      addValidation(key, entry, flag);

    } else if (key === "catering") {
      addValidation(key, entry, checkBounds(entry.mid, BOUNDS.catering, "Catering boost"));

    } else if (key === "landValue") {
      addValidation(key, entry, checkBounds(entry.mid, BOUNDS.landValue, "Land value %"));

    } else if (key === "incomeTax") {
      addValidation(key, entry, checkBounds(entry.mid, BOUNDS.incomeTax, "Income tax rate"));

    } else if (key === "rampMonths") {
      addValidation(key, entry, checkBounds(entry.mid, BOUNDS.rampMonths, "Ramp months"));

    } else if (key.startsWith("cost")) {
      addValidation(key, entry, checkBounds(entry.mid, BOUNDS.costRate, key));

    } else if (key.startsWith("revShare")) {
      addValidation(key, entry, checkBounds(entry.mid, BOUNDS.revShare, key));

    } else if (key.startsWith("svcFee")) {
      addValidation(key, entry, checkBounds(entry.mid, BOUNDS.svcFee, key));

    } else {
      // Unknown key — pass through without validation
      values[key] = { ...entry };
      passed++;
    }
  }

  return {
    values,
    summary: {
      total: passed + warned + failed,
      passed,
      warned,
      failed,
    },
  };
}
