// Shared constants used by both client and server
// These are the single source of truth for default values that must be consistent
// across the financial engine, seed data, and verification checker.

// Default revenue shares (property-configurable)
export const DEFAULT_REV_SHARE_EVENTS = 0.43;
export const DEFAULT_REV_SHARE_FB = 0.22;
export const DEFAULT_REV_SHARE_OTHER = 0.07;

// Single catering boost percentage applied to F&B revenue at property level
// Represents blended effect across all events (catered and non-catered)
export const DEFAULT_CATERING_BOOST_PCT = 0.30;

// Expense rate defaults (global-configurable)
export const DEFAULT_EVENT_EXPENSE_RATE = 0.65;
export const DEFAULT_OTHER_EXPENSE_RATE = 0.60;
export const DEFAULT_UTILITIES_VARIABLE_SPLIT = 0.60;

// Property cost rate defaults (USALI standard allocations)
export const DEFAULT_COST_RATE_ROOMS = 0.36;
export const DEFAULT_COST_RATE_FB = 0.32;
export const DEFAULT_COST_RATE_ADMIN = 0.08;
export const DEFAULT_COST_RATE_MARKETING = 0.05;
export const DEFAULT_COST_RATE_PROPERTY_OPS = 0.04;
export const DEFAULT_COST_RATE_UTILITIES = 0.05;
export const DEFAULT_COST_RATE_INSURANCE = 0.02;
export const DEFAULT_COST_RATE_TAXES = 0.03;
export const DEFAULT_COST_RATE_IT = 0.02;
export const DEFAULT_COST_RATE_FFE = 0.04;
export const DEFAULT_COST_RATE_OTHER = 0.05;

// Exit & sale defaults
export const DEFAULT_EXIT_CAP_RATE = 0.085;
export const DEFAULT_TAX_RATE = 0.25;
export const DEFAULT_COMMISSION_RATE = 0.05;

// Default land value percentage (IRS Publication 946 — non-depreciable)
export const DEFAULT_LAND_VALUE_PERCENT = 0.25;

// IRS-mandated depreciation period (Publication 946 / ASC 360)
export const DEPRECIATION_YEARS = 27.5;

// Industry standard days per month (365/12 rounded)
export const DAYS_PER_MONTH = 30.5;

// Default occupancy ramp period (months between growth steps)
export const DEFAULT_OCCUPANCY_RAMP_MONTHS = 6;

// Funding instrument defaults
export const DEFAULT_SAFE_VALUATION_CAP = 2500000;
export const DEFAULT_SAFE_DISCOUNT_RATE = 0.20;
