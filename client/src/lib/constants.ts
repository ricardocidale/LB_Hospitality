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

// IRS-mandated depreciation period (Publication 946 / ASC 360)
export const DEPRECIATION_YEARS = 27.5;

// Industry standard days per month (365/12 rounded)
export const DAYS_PER_MONTH = 30.5;

// Default revenue shares (property-configurable)
export const DEFAULT_REV_SHARE_EVENTS = 0.43;
export const DEFAULT_REV_SHARE_FB = 0.22;
export const DEFAULT_REV_SHARE_OTHER = 0.07;

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

// Partner compensation defaults (indexed by year 1-10)
export const DEFAULT_PARTNER_COMP = [540000, 540000, 540000, 600000, 600000, 700000, 700000, 800000, 800000, 900000];
