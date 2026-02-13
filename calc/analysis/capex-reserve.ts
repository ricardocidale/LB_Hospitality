import type { RoundingPolicy } from "../../domain/types/rounding.js";
import { roundTo } from "../../domain/types/rounding.js";
import { rounder, RATIO_ROUNDING, sumArray } from "../shared/utils.js";
import { DEFAULT_COST_RATE_FFE } from "../../shared/constants.js";

export interface CapexCategory {
  label: string;
  useful_life_years: number;
  replacement_cost: number;
  age_years?: number;
}

export interface CapexReserveInput {
  property_name?: string;
  room_count: number;
  annual_revenue: number;
  ffe_reserve_rate?: number;
  initial_reserve_balance?: number;
  hold_period_years: number;
  revenue_growth_rate?: number;
  capex_categories?: CapexCategory[];
  inflation_rate?: number;
  rounding_policy: RoundingPolicy;
}

export interface CapexYearProjection {
  year: number;
  revenue: number;
  reserve_contribution: number;
  planned_replacements: number;
  replacement_items: string[];
  beginning_balance: number;
  ending_balance: number;
  reserve_per_key: number;
  funded_ratio: number;
}

export interface CapexCategoryStatus {
  label: string;
  useful_life_years: number;
  replacement_cost: number;
  current_age: number;
  remaining_life: number;
  annual_reserve_needed: number;
  replacement_year: number | null;
  inflated_replacement_cost: number;
}

export interface CapexReserveOutput {
  annual_reserve_rate: number;
  annual_reserve_amount: number;
  reserve_per_key_per_year: number;
  total_contributions_over_hold: number;
  total_replacements_over_hold: number;
  net_reserve_at_exit: number;
  category_status: CapexCategoryStatus[];
  yearly_projections: CapexYearProjection[];
  underfunding_risk: "adequate" | "marginal" | "underfunded" | "critical";
  minimum_recommended_rate: number;
  industry_benchmark_per_key: number;
}

export function computeCapexReserve(input: CapexReserveInput): CapexReserveOutput {
  const r = rounder(input.rounding_policy);
  const ratio = (v: number) => roundTo(v, RATIO_ROUNDING);

  const ffeRate = input.ffe_reserve_rate ?? DEFAULT_COST_RATE_FFE;
  const DEFAULT_REVENUE_GROWTH = 0.03;
  const DEFAULT_INFLATION = 0.03;
  const revenueGrowth = input.revenue_growth_rate ?? DEFAULT_REVENUE_GROWTH;
  const inflationRate = input.inflation_rate ?? DEFAULT_INFLATION;
  const initialBalance = input.initial_reserve_balance ?? 0;

  const annual_reserve_amount = r(input.annual_revenue * ffeRate);
  const reserve_per_key_per_year = input.room_count > 0
    ? r(annual_reserve_amount / input.room_count)
    : 0;

  const categories = input.capex_categories ?? DEFAULT_CAPEX_CATEGORIES(input.room_count);
  const category_status: CapexCategoryStatus[] = categories.map(cat => {
    const age = cat.age_years ?? 0;
    const remaining = Math.max(0, cat.useful_life_years - age);
    const annual_reserve_needed = cat.useful_life_years > 0
      ? r(cat.replacement_cost / cat.useful_life_years)
      : 0;
    const replacementYear = remaining > 0 && remaining <= input.hold_period_years
      ? remaining
      : null;
    const inflated_cost = replacementYear !== null
      ? r(cat.replacement_cost * Math.pow(1 + inflationRate, replacementYear))
      : r(cat.replacement_cost * Math.pow(1 + inflationRate, cat.useful_life_years));

    return {
      label: cat.label,
      useful_life_years: cat.useful_life_years,
      replacement_cost: cat.replacement_cost,
      current_age: age,
      remaining_life: remaining,
      annual_reserve_needed,
      replacement_year: replacementYear,
      inflated_replacement_cost: inflated_cost,
    };
  });

  const yearly_projections: CapexYearProjection[] = [];
  let balance = initialBalance;
  let revenue = input.annual_revenue;
  let totalContributions = 0;
  let totalReplacements = 0;

  for (let y = 1; y <= input.hold_period_years; y++) {
    if (y > 1) revenue = r(revenue * (1 + revenueGrowth));
    const contribution = r(revenue * ffeRate);
    const beginningBalance = r(balance);

    const dueItems = category_status.filter(c => c.replacement_year === y);
    const replacementCost = r(sumArray(dueItems.map(c => c.inflated_replacement_cost)));
    const replacementLabels = dueItems.map(c => c.label);

    balance = r(beginningBalance + contribution - replacementCost);
    totalContributions += contribution;
    totalReplacements += replacementCost;

    const reserve_per_key = input.room_count > 0 ? r(balance / input.room_count) : 0;
    const totalNeeded = r(sumArray(category_status.map(c => c.annual_reserve_needed)));
    const funded_ratio = totalNeeded > 0 ? ratio(contribution / totalNeeded) : 1;

    yearly_projections.push({
      year: y,
      revenue: r(revenue),
      reserve_contribution: contribution,
      planned_replacements: replacementCost,
      replacement_items: replacementLabels,
      beginning_balance: beginningBalance,
      ending_balance: r(balance),
      reserve_per_key,
      funded_ratio,
    });
  }

  const net_reserve_at_exit = r(balance);
  const totalAnnualNeeded = r(sumArray(category_status.map(c => c.annual_reserve_needed)));
  const minimum_recommended_rate = input.annual_revenue > 0
    ? ratio(totalAnnualNeeded / input.annual_revenue)
    : ffeRate;

  const INDUSTRY_BENCHMARK_PER_KEY = 5000;
  const industry_benchmark_per_key = INDUSTRY_BENCHMARK_PER_KEY;

  let underfunding_risk: "adequate" | "marginal" | "underfunded" | "critical";
  const fundedRatio = totalAnnualNeeded > 0 ? annual_reserve_amount / totalAnnualNeeded : 1;
  if (fundedRatio >= 1.0) underfunding_risk = "adequate";
  else if (fundedRatio >= 0.75) underfunding_risk = "marginal";
  else if (fundedRatio >= 0.5) underfunding_risk = "underfunded";
  else underfunding_risk = "critical";

  return {
    annual_reserve_rate: ffeRate,
    annual_reserve_amount,
    reserve_per_key_per_year,
    total_contributions_over_hold: r(totalContributions),
    total_replacements_over_hold: r(totalReplacements),
    net_reserve_at_exit,
    category_status,
    yearly_projections,
    underfunding_risk,
    minimum_recommended_rate,
    industry_benchmark_per_key,
  };
}

const ELEVATOR_MECHANICAL_COST = 150000;
const ROOF_EXTERIOR_COST = 200000;
const FB_EQUIPMENT_COST = 100000;
const SPA_EQUIPMENT_COST = 75000;
const SOFT_GOODS_LIFE = 5;
const CASE_GOODS_LIFE = 10;
const HVAC_LIFE = 15;
const STRUCTURAL_LIFE = 20;
const TECH_LIFE = 5;
const FB_EQUIP_LIFE = 8;
const SPA_EQUIP_LIFE = 7;
const SOFT_GOODS_PER_KEY = 8000;
const CASE_GOODS_PER_KEY = 12000;
const HVAC_PER_KEY = 5000;
const TECH_PER_KEY = 2000;

function DEFAULT_CAPEX_CATEGORIES(roomCount: number): CapexCategory[] {
  return [
    { label: "Soft Goods (bedding, drapes, carpet)", useful_life_years: SOFT_GOODS_LIFE, replacement_cost: roomCount * SOFT_GOODS_PER_KEY, age_years: 2 },
    { label: "Case Goods (furniture, fixtures)", useful_life_years: CASE_GOODS_LIFE, replacement_cost: roomCount * CASE_GOODS_PER_KEY, age_years: 3 },
    { label: "HVAC Systems", useful_life_years: HVAC_LIFE, replacement_cost: roomCount * HVAC_PER_KEY, age_years: 5 },
    { label: "Elevator/Mechanical", useful_life_years: STRUCTURAL_LIFE, replacement_cost: ELEVATOR_MECHANICAL_COST, age_years: 8 },
    { label: "Roof & Exterior", useful_life_years: STRUCTURAL_LIFE, replacement_cost: ROOF_EXTERIOR_COST, age_years: 7 },
    { label: "Technology & PMS", useful_life_years: TECH_LIFE, replacement_cost: roomCount * TECH_PER_KEY, age_years: 1 },
    { label: "F&B Equipment", useful_life_years: FB_EQUIP_LIFE, replacement_cost: FB_EQUIPMENT_COST, age_years: 3 },
    { label: "Spa/Wellness Equipment", useful_life_years: SPA_EQUIP_LIFE, replacement_cost: SPA_EQUIPMENT_COST, age_years: 2 },
  ];
}
