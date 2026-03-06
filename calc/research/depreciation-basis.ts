/**
 * depreciation-basis.ts — Deterministic Depreciation Basis Calculator
 *
 * Computes the IRS-compliant depreciation basis, monthly/annual depreciation,
 * and land value allocation for a given property. Used by AI research to
 * validate land value recommendations against exact tax math.
 *
 * IRS Publication 946: Residential rental property = 27.5 years straight-line.
 */
import { roundCents } from "../shared/utils.js";
import { DEPRECIATION_YEARS, DEFAULT_TAX_RATE } from "../../shared/constants.js";

const TAX_RATE_30_PCT = 0.30;

interface DepreciationBasisInput {
  purchase_price: number;
  land_value_pct: number; // 0-1 decimal (e.g., 0.20 for 20%)
  building_improvements?: number;
}

interface DepreciationBasisOutput {
  purchase_price: number;
  land_value_pct: number;
  land_value_dollars: number;
  building_value: number;
  building_improvements: number;
  depreciable_basis: number;
  annual_depreciation: number;
  monthly_depreciation: number;
  depreciation_years: number;
  tax_shield_at_25pct: number;
  tax_shield_at_30pct: number;
  effective_cost_reduction_pct: number;
}

export function computeDepreciationBasis(input: DepreciationBasisInput): DepreciationBasisOutput {
  const {
    purchase_price,
    land_value_pct,
    building_improvements = 0,
  } = input;

  const landValue = roundCents(purchase_price * land_value_pct);
  const buildingValue = roundCents(purchase_price * (1 - land_value_pct));
  const depreciableBasis = roundCents(buildingValue + building_improvements);
  const annualDepreciation = roundCents(depreciableBasis / DEPRECIATION_YEARS);
  const monthlyDepreciation = roundCents(depreciableBasis / DEPRECIATION_YEARS / 12);

  // Tax shields show the annual tax savings from depreciation
  const taxShield25 = roundCents(annualDepreciation * DEFAULT_TAX_RATE);
  const taxShield30 = roundCents(annualDepreciation * TAX_RATE_30_PCT);

  // Effective cost reduction: how much depreciation reduces effective annual cost as % of purchase price
  const effectiveCostReduction = purchase_price > 0
    ? roundCents((annualDepreciation / purchase_price) * 100)
    : 0;

  return {
    purchase_price,
    land_value_pct,
    land_value_dollars: landValue,
    building_value: buildingValue,
    building_improvements,
    depreciable_basis: depreciableBasis,
    annual_depreciation: annualDepreciation,
    monthly_depreciation: monthlyDepreciation,
    depreciation_years: DEPRECIATION_YEARS,
    tax_shield_at_25pct: taxShield25,
    tax_shield_at_30pct: taxShield30,
    effective_cost_reduction_pct: effectiveCostReduction,
  };
}
