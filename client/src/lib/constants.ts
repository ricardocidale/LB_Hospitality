// Shared constants for financial calculations
// These are the single source of truth for all default values used across the codebase

// Loan defaults
export const DEFAULT_LTV = 0.75;
export const DEFAULT_INTEREST_RATE = 0.09;
export const DEFAULT_TERM_YEARS = 25;
export const DEFAULT_TAX_RATE = 0.25;
export const DEFAULT_COMMISSION_RATE = 0.05;
export const DEFAULT_EXIT_CAP_RATE = 0.085;
export const DEFAULT_REFI_LTV = 0.65;
export const DEFAULT_REFI_CLOSING_COST_RATE = 0.03;
export const DEFAULT_ACQ_CLOSING_COST_RATE = 0.02;

// IRS-mandated depreciation period (Publication 946 / ASC 360)
export const DEPRECIATION_YEARS = 27.5;

// Industry standard days per month (365/12 rounded)
export const DAYS_PER_MONTH = 30.5;

// Default revenue shares (property-configurable)
export const DEFAULT_REV_SHARE_EVENTS = 0.43;
export const DEFAULT_REV_SHARE_FB = 0.22;
export const DEFAULT_REV_SHARE_OTHER = 0.07;

// Expense rate defaults (global-configurable)
export const DEFAULT_EVENT_EXPENSE_RATE = 0.65;
export const DEFAULT_OTHER_EXPENSE_RATE = 0.60;
export const DEFAULT_UTILITIES_VARIABLE_SPLIT = 0.60;
export const DEFAULT_COMPANY_TAX_RATE = 0.30;

// Property defaults
export const DEFAULT_ROOM_COUNT = 10;
export const DEFAULT_START_ADR = 250;
export const DEFAULT_ADR_GROWTH_RATE = 0.03;
export const DEFAULT_START_OCCUPANCY = 0.55;
export const DEFAULT_MAX_OCCUPANCY = 0.85;
export const DEFAULT_OCCUPANCY_GROWTH_STEP = 0.05;
export const DEFAULT_OCCUPANCY_RAMP_MONTHS = 6;
export const DEFAULT_STABILIZATION_MONTHS = 24;

// Catering defaults
export const DEFAULT_FULL_CATERING_PCT = 0.40;
export const DEFAULT_PARTIAL_CATERING_PCT = 0.30;
export const DEFAULT_FULL_CATERING_BOOST = 0.50;
export const DEFAULT_PARTIAL_CATERING_BOOST = 0.25;

// Property cost rate defaults (USALI standard allocations)
export const DEFAULT_COST_RATE_ROOMS = 0.36;
export const DEFAULT_COST_RATE_FB = 0.15;
export const DEFAULT_COST_RATE_ADMIN = 0.08;
export const DEFAULT_COST_RATE_MARKETING = 0.05;
export const DEFAULT_COST_RATE_PROPERTY_OPS = 0.04;
export const DEFAULT_COST_RATE_UTILITIES = 0.05;
export const DEFAULT_COST_RATE_INSURANCE = 0.02;
export const DEFAULT_COST_RATE_TAXES = 0.03;
export const DEFAULT_COST_RATE_IT = 0.02;
export const DEFAULT_COST_RATE_FFE = 0.04;
export const DEFAULT_COST_RATE_OTHER = 0.05;

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
export const AUDIT_VARIANCE_TOLERANCE = 0.01;
export const AUDIT_DOLLAR_TOLERANCE = 100;
export const AUDIT_VERIFICATION_WINDOW_MONTHS = 24;
export const AUDIT_CRITICAL_ISSUE_THRESHOLD = 3;
