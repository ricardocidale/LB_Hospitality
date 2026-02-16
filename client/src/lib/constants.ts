// Client-side financial constants
// Shared constants are re-exported from @shared/constants.ts (single source of truth)
// Client-only constants are defined below

// Re-export all shared constants (used by both client and server)
export {
  DEFAULT_REV_SHARE_EVENTS,
  DEFAULT_REV_SHARE_FB,
  DEFAULT_REV_SHARE_OTHER,
  DEFAULT_CATERING_BOOST_PCT,
  DEFAULT_EVENT_EXPENSE_RATE,
  DEFAULT_OTHER_EXPENSE_RATE,
  DEFAULT_UTILITIES_VARIABLE_SPLIT,
  DEFAULT_COST_RATE_ROOMS,
  DEFAULT_COST_RATE_FB,
  DEFAULT_COST_RATE_ADMIN,
  DEFAULT_COST_RATE_MARKETING,
  DEFAULT_COST_RATE_PROPERTY_OPS,
  DEFAULT_COST_RATE_UTILITIES,
  DEFAULT_COST_RATE_INSURANCE,
  DEFAULT_COST_RATE_TAXES,
  DEFAULT_COST_RATE_IT,
  DEFAULT_COST_RATE_FFE,
  DEFAULT_COST_RATE_OTHER,
  DEFAULT_EXIT_CAP_RATE,
  DEFAULT_TAX_RATE,
  DEFAULT_COMMISSION_RATE,
  DEPRECIATION_YEARS,
  DAYS_PER_MONTH,
  DEFAULT_LAND_VALUE_PERCENT,
  DEFAULT_OCCUPANCY_RAMP_MONTHS,
  DEFAULT_SAFE_VALUATION_CAP,
  DEFAULT_SAFE_DISCOUNT_RATE,
  DEFAULT_BASE_MANAGEMENT_FEE_RATE,
  DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,
  DEFAULT_SERVICE_FEE_CATEGORIES,
  DEFAULT_FIXED_COST_ESCALATION_RATE,
  DEFAULT_COMPANY_TAX_RATE,
  DEFAULT_PROJECTION_YEARS,
} from "@shared/constants";

// Loan defaults
export const DEFAULT_LTV = 0.75;
export const DEFAULT_INTEREST_RATE = 0.09;
export const DEFAULT_TERM_YEARS = 25;
export const DEFAULT_REFI_LTV = 0.65;
export const DEFAULT_REFI_CLOSING_COST_RATE = 0.03;
export const DEFAULT_ACQ_CLOSING_COST_RATE = 0.02;

// Property defaults
export const DEFAULT_ROOM_COUNT = 10;
export const DEFAULT_START_ADR = 250;
export const DEFAULT_ADR_GROWTH_RATE = 0.03;
export const DEFAULT_START_OCCUPANCY = 0.55;
export const DEFAULT_MAX_OCCUPANCY = 0.85;
export const DEFAULT_OCCUPANCY_GROWTH_STEP = 0.05;
export const DEFAULT_STABILIZATION_MONTHS = 24;

// Company cost defaults
export const DEFAULT_STAFF_SALARY = 75000;
export const DEFAULT_OFFICE_LEASE = 36000;
export const DEFAULT_PROFESSIONAL_SERVICES = 24000;
export const DEFAULT_TECH_INFRA = 18000;
export const DEFAULT_BUSINESS_INSURANCE = 12000;
export const DEFAULT_TRAVEL_PER_CLIENT = 12000;
export const DEFAULT_IT_LICENSE_PER_CLIENT = 3000;
export const DEFAULT_MARKETING_RATE = 0.05;
export const DEFAULT_MISC_OPS_RATE = 0.03;
export const DEFAULT_SAFE_TRANCHE = 800000;

// Projection period
export const PROJECTION_YEARS = 10;
export const PROJECTION_MONTHS = PROJECTION_YEARS * 12; // 120

// Default model start date fallback
export const DEFAULT_MODEL_START_DATE = '2026-04-01';

// Staffing model thresholds
export const STAFFING_TIERS = [
  { maxProperties: 3, fte: 2.5 },
  { maxProperties: 6, fte: 4.5 },
  { maxProperties: Infinity, fte: 7.0 },
];
export function getStaffFTE(propertyCount: number): number {
  const tier = STAFFING_TIERS.find(t => propertyCount <= t.maxProperties);
  return tier ? tier.fte : STAFFING_TIERS[STAFFING_TIERS.length - 1].fte;
}

// Operating reserve / funding buffer constants
export const OPERATING_RESERVE_BUFFER = 50000;
export const COMPANY_FUNDING_BUFFER = 100000;
export const RESERVE_ROUNDING_INCREMENT = 10000;

// Partner defaults
export const DEFAULT_PARTNER_COUNT = 3;
export const DEFAULT_PARTNER_COMP = [540000, 540000, 540000, 600000, 600000, 700000, 700000, 800000, 800000, 900000];

// Refinance default period (years after operations start)
export const DEFAULT_REFI_PERIOD_YEARS = 3;

// Presentation thresholds (conditional formatting)
export const IRR_HIGHLIGHT_THRESHOLD = 0.15;

// Auditor verification thresholds
export const AUDIT_VARIANCE_TOLERANCE = 0.001;
export const AUDIT_DOLLAR_TOLERANCE = 1;
export const AUDIT_VERIFICATION_WINDOW_MONTHS = 24;
export const AUDIT_CRITICAL_ISSUE_THRESHOLD = 3;
