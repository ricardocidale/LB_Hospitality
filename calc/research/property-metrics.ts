/**
 * property-metrics.ts — Deterministic Property Financial Metrics
 *
 * Computes key financial metrics from property inputs so the research LLM
 * can validate its recommendations against exact math instead of estimating.
 *
 * Used by the AI research tool `compute_property_metrics` during property
 * research generation.
 */
import { roundCents } from "../shared/utils.js";

const DAYS_PER_MONTH = 30.5;

interface PropertyMetricsInput {
  room_count: number;
  adr: number;
  occupancy: number; // 0-1 decimal
  cost_rate_rooms?: number;
  cost_rate_fb?: number;
  cost_rate_admin?: number;
  cost_rate_marketing?: number;
  cost_rate_property_ops?: number;
  cost_rate_utilities?: number;
  cost_rate_ffe?: number;
  cost_rate_other?: number;
  rev_share_events?: number;
  rev_share_fb?: number;
  rev_share_other?: number;
  catering_boost_pct?: number;
  base_management_fee_rate?: number;
  incentive_management_fee_rate?: number;
}

interface PropertyMetricsOutput {
  revpar: number;
  monthly_room_revenue: number;
  annual_room_revenue: number;
  monthly_total_revenue: number;
  annual_total_revenue: number;
  revenue_breakdown: {
    rooms: number;
    events: number;
    fb: number;
    other: number;
  };
  annual_gop: number;
  gop_margin_pct: number;
  annual_noi: number;
  noi_margin_pct: number;
  revenue_per_room: number;
  cost_per_room: number;
}

export function computePropertyMetrics(input: PropertyMetricsInput): PropertyMetricsOutput {
  const {
    room_count,
    adr,
    occupancy,
    cost_rate_rooms = 0.36,
    cost_rate_fb = 0.32,
    cost_rate_admin = 0.08,
    cost_rate_marketing = 0.05,
    cost_rate_property_ops = 0.04,
    cost_rate_utilities = 0.05,
    cost_rate_ffe = 0.04,
    cost_rate_other = 0.05,
    rev_share_events = 0.43,
    rev_share_fb = 0.22,
    rev_share_other = 0.07,
    catering_boost_pct = 0.30,
    base_management_fee_rate = 0.05,
    incentive_management_fee_rate = 0.15,
  } = input;

  // RevPAR
  const revpar = roundCents(adr * occupancy);

  // Monthly room revenue
  const monthlyRoomRevenue = roundCents(room_count * adr * occupancy * DAYS_PER_MONTH);
  const annualRoomRevenue = roundCents(monthlyRoomRevenue * 12);

  // Revenue streams (all based on room revenue)
  const monthlyEvents = roundCents(monthlyRoomRevenue * rev_share_events);
  const monthlyFB = roundCents(monthlyRoomRevenue * rev_share_fb * (1 + catering_boost_pct));
  const monthlyOther = roundCents(monthlyRoomRevenue * rev_share_other);
  const monthlyTotal = roundCents(monthlyRoomRevenue + monthlyEvents + monthlyFB + monthlyOther);
  const annualTotal = roundCents(monthlyTotal * 12);

  // Department expenses
  const roomCosts = monthlyRoomRevenue * cost_rate_rooms;
  const fbCosts = monthlyFB * cost_rate_fb;
  const eventCosts = monthlyEvents * 0.65; // DEFAULT_EVENT_EXPENSE_RATE

  // GOP = Revenue - Department Costs
  const departmentCosts = roomCosts + fbCosts + eventCosts;
  const monthlyGOP = monthlyTotal - departmentCosts;

  // Undistributed expenses (% of total revenue)
  const adminCosts = monthlyTotal * cost_rate_admin;
  const marketingCosts = monthlyTotal * cost_rate_marketing;
  const propOpsCosts = monthlyTotal * cost_rate_property_ops;
  const utilitiesCosts = monthlyTotal * cost_rate_utilities;
  const ffeCosts = monthlyTotal * cost_rate_ffe;
  const otherCosts = monthlyTotal * cost_rate_other;
  const undistributed = adminCosts + marketingCosts + propOpsCosts + utilitiesCosts + ffeCosts + otherCosts;

  // Management fees
  const baseFee = monthlyTotal * base_management_fee_rate;
  const incentiveFee = monthlyGOP > 0 ? monthlyGOP * incentive_management_fee_rate : 0;

  // NOI = GOP - Undistributed - Management Fees - FF&E
  const monthlyNOI = monthlyGOP - undistributed - baseFee - incentiveFee;
  const annualNOI = roundCents(monthlyNOI * 12);
  const annualGOP = roundCents(monthlyGOP * 12);

  const gopMargin = annualTotal > 0 ? roundCents((annualGOP / annualTotal) * 100) : 0;
  const noiMargin = annualTotal > 0 ? roundCents((annualNOI / annualTotal) * 100) : 0;

  return {
    revpar,
    monthly_room_revenue: monthlyRoomRevenue,
    annual_room_revenue: annualRoomRevenue,
    monthly_total_revenue: monthlyTotal,
    annual_total_revenue: annualTotal,
    revenue_breakdown: {
      rooms: roundCents(annualRoomRevenue),
      events: roundCents(monthlyEvents * 12),
      fb: roundCents(monthlyFB * 12),
      other: roundCents(monthlyOther * 12),
    },
    annual_gop: annualGOP,
    gop_margin_pct: gopMargin,
    annual_noi: annualNOI,
    noi_margin_pct: noiMargin,
    revenue_per_room: roundCents(annualTotal / room_count),
    cost_per_room: roundCents((annualTotal - annualNOI) / room_count),
  };
}
