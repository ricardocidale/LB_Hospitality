import type { RoundingPolicy } from "../../domain/types/rounding.js";
import { roundTo } from "../../domain/types/rounding.js";
import { rounder, RATIO_ROUNDING } from "../shared/utils.js";

export interface RevPARIndexInput {
  property_name?: string;
  room_count: number;
  adr: number;
  occupancy: number;
  market_adr: number;
  market_occupancy: number;
  comp_set_adr?: number;
  comp_set_occupancy?: number;
  rounding_policy: RoundingPolicy;
}

export interface RevPARIndexOutput {
  property_revpar: number;
  market_revpar: number;
  comp_set_revpar: number | null;
  mpi: number;
  ari: number;
  rgi: number;
  comp_mpi: number | null;
  comp_ari: number | null;
  comp_rgi: number | null;
  penetration_assessment: "outperforming" | "at_market" | "underperforming";
  available_room_nights: number;
  sold_room_nights: number;
  room_revenue: number;
}

export function computeRevPARIndex(input: RevPARIndexInput): RevPARIndexOutput {
  const r = rounder(input.rounding_policy);
  const idx = (v: number) => roundTo(v, RATIO_ROUNDING);
  const DAYS_PER_YEAR = 365;
  const days = DAYS_PER_YEAR;

  const property_revpar = r(input.adr * input.occupancy);
  const market_revpar = r(input.market_adr * input.market_occupancy);

  const available_room_nights = input.room_count * days;
  const sold_room_nights = Math.round(available_room_nights * input.occupancy);
  const room_revenue = r(sold_room_nights * input.adr);

  const mpi = input.market_occupancy > 0
    ? idx(input.occupancy / input.market_occupancy)
    : 0;

  const ari = input.market_adr > 0
    ? idx(input.adr / input.market_adr)
    : 0;

  const rgi = market_revpar > 0
    ? idx(property_revpar / market_revpar)
    : 0;

  let comp_set_revpar: number | null = null;
  let comp_mpi: number | null = null;
  let comp_ari: number | null = null;
  let comp_rgi: number | null = null;

  if (input.comp_set_adr !== undefined && input.comp_set_occupancy !== undefined) {
    comp_set_revpar = r(input.comp_set_adr * input.comp_set_occupancy);
    comp_mpi = input.comp_set_occupancy > 0
      ? idx(input.occupancy / input.comp_set_occupancy)
      : 0;
    comp_ari = input.comp_set_adr > 0
      ? idx(input.adr / input.comp_set_adr)
      : 0;
    comp_rgi = comp_set_revpar > 0
      ? idx(property_revpar / comp_set_revpar)
      : 0;
  }

  let penetration_assessment: "outperforming" | "at_market" | "underperforming";
  if (rgi > 1.05) penetration_assessment = "outperforming";
  else if (rgi < 0.95) penetration_assessment = "underperforming";
  else penetration_assessment = "at_market";

  return {
    property_revpar,
    market_revpar,
    comp_set_revpar,
    mpi, ari, rgi,
    comp_mpi, comp_ari, comp_rgi,
    penetration_assessment,
    available_room_nights,
    sold_room_nights,
    room_revenue,
  };
}
