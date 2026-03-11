/**
 * compute_make_vs_buy — Hospitality Outsourcing Decision Tool
 * 
 * Compares the total cost of ownership (TCO) for performing a service in-house
 * (labor, overhead, training, benefits) versus outsourcing to a third-party 
 * vendor (contract price, management oversight).
 * 
 * Logic follows standard hospitality management accounting (USALI) for 
 * departmental vs. unallocated expenses.
 */
import { DEFAULT_ROUNDING } from "../shared/utils.js";
import { RESEARCH_MAKE_VS_BUY_MARGINAL_THRESHOLD } from "../../shared/constants.js";

interface MakeVsBuyInput {
  serviceName: string;
  // In-house costs (Annual)
  inHouseLabor: number;        // Direct wages
  benefitsRate: number;        // e.g. 0.25 for 25%
  trainingAnnual: number;      // Recruitment & training costs
  suppliesAnnual: number;      // Direct materials/supplies
  allocatedOverhead: number;   // Space/utilities allocated
  // Vendor costs (Annual)
  vendorContractPrice: number; // Annual contract fee
  internalOversightHours: number; // Hours/week for manager to oversee vendor
  managerHourlyRate: number;   // Manager's fully loaded rate
  // Scaling
  unitCount: number;           // e.g. number of rooms or keys
  rounding_policy?: typeof DEFAULT_ROUNDING;
}

interface MakeVsBuyResult {
  service: string;
  totalInHouseCost: number;
  totalVendorCost: number;
  annualSavings: number;
  savingsPercent: number;
  costPerUnitInHouse: number;
  costPerUnitVendor: number;
  breakEvenUnits: number;
  recommendation: 'In-House' | 'Outsource' | 'Marginal';
  analysis: string;
}

export function computeMakeVsBuy(input: MakeVsBuyInput): MakeVsBuyResult {
  const {
    serviceName,
    inHouseLabor,
    benefitsRate,
    trainingAnnual,
    suppliesAnnual,
    allocatedOverhead,
    vendorContractPrice,
    internalOversightHours,
    managerHourlyRate,
    unitCount
  } = input;

  // 1. Calculate Total In-House Cost
  const fullyLoadedLabor = inHouseLabor * (1 + benefitsRate);
  const totalInHouseCost = fullyLoadedLabor + trainingAnnual + suppliesAnnual + allocatedOverhead;

  // 2. Calculate Total Vendor Cost
  const oversightCost = internalOversightHours * 52 * managerHourlyRate;
  const totalVendorCost = vendorContractPrice + oversightCost;

  // 3. Comparisons
  const annualSavings = totalInHouseCost - totalVendorCost;
  const savingsPercent = totalInHouseCost > 0 ? (annualSavings / totalInHouseCost) : 0;
  
  const costPerUnitInHouse = unitCount > 0 ? (totalInHouseCost / unitCount) : 0;
  const costPerUnitVendor = unitCount > 0 ? (totalVendorCost / unitCount) : 0;

  // 4. Break-even analysis (at what unit count does it flip?)
  // This assumes labor scales semi-linearly with units, which is a simplification.
  // We'll report it based on current cost structure.
  const breakEvenUnits = unitCount; // Simplified for this version

  // 5. Recommendation logic
  let recommendation: 'In-House' | 'Outsource' | 'Marginal';
  const MARGINAL_THRESHOLD = RESEARCH_MAKE_VS_BUY_MARGINAL_THRESHOLD;
  if (savingsPercent > MARGINAL_THRESHOLD) {
    recommendation = 'Outsource';
  } else if (savingsPercent < -MARGINAL_THRESHOLD) {
    recommendation = 'In-House';
  } else {
    recommendation = 'Marginal';
  }

  const analysis = recommendation === 'Outsource' 
    ? `Outsourcing ${serviceName} is projected to save $${Math.abs(annualSavings).toLocaleString()} annually (${(savingsPercent * 100).toFixed(1)}%).`
    : recommendation === 'In-House'
    ? `In-house operations for ${serviceName} are $${Math.abs(annualSavings).toLocaleString()} more cost-effective than vendor quotes.`
    : `The financial difference between in-house and outsourcing for ${serviceName} is marginal (${(savingsPercent * 100).toFixed(1)}%). Consider qualitative factors like quality control and flexibility.`;

  return {
    service: serviceName,
    totalInHouseCost,
    totalVendorCost,
    annualSavings,
    savingsPercent,
    costPerUnitInHouse,
    costPerUnitVendor,
    breakEvenUnits,
    recommendation,
    analysis
  };
}
