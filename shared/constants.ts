// Shared constants used by both client and server
// These are the single source of truth for default values that must be consistent
// across the financial engine, seed data, and verification checker.

// Default revenue shares (property-configurable)
// Wellness clinic/retreat event programming justifies higher event share vs standard hotels (10-15%)
// Global Wellness Institute 2024: wellness retreats generate 25-35% of total revenue
export const DEFAULT_REV_SHARE_EVENTS = 0.30;
export const DEFAULT_REV_SHARE_FB = 0.18;
export const DEFAULT_REV_SHARE_OTHER = 0.05;

// Single catering boost percentage applied to F&B revenue at property level
// Represents blended effect across all events (catered and non-catered)
export const DEFAULT_CATERING_BOOST_PCT = 0.22;

// Expense rate defaults (global-configurable)
export const DEFAULT_EVENT_EXPENSE_RATE = 0.65;
export const DEFAULT_OTHER_EXPENSE_RATE = 0.60;
export const DEFAULT_UTILITIES_VARIABLE_SPLIT = 0.60;

// Property cost rate defaults (USALI standard allocations)
export const DEFAULT_COST_RATE_ROOMS = 0.20;
export const DEFAULT_COST_RATE_FB = 0.09;
export const DEFAULT_COST_RATE_ADMIN = 0.08;
export const DEFAULT_COST_RATE_MARKETING = 0.01;
export const DEFAULT_COST_RATE_PROPERTY_OPS = 0.04;
export const DEFAULT_COST_RATE_UTILITIES = 0.05;
export const DEFAULT_COST_RATE_INSURANCE = 0.02;
export const DEFAULT_COST_RATE_TAXES = 0.03;
export const DEFAULT_COST_RATE_IT = 0.005;
export const DEFAULT_COST_RATE_FFE = 0.04;
export const DEFAULT_COST_RATE_OTHER = 0.05;

// Management company fee defaults (per-property)
// HVS Fee Survey 2024: Specialty/wellness operators command 6-10% base + 12-20% incentive
export const DEFAULT_BASE_MANAGEMENT_FEE_RATE = 0.085;
export const DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE = 0.12;

// Service fee category defaults (per-property, % of Total Revenue)
// These replace the single baseManagementFeeRate with granular categories
// Sum of default rates = 8.5% (matches DEFAULT_BASE_MANAGEMENT_FEE_RATE)
export const DEFAULT_SERVICE_FEE_CATEGORIES = [
  { name: "Marketing", rate: 0.02, sortOrder: 1 },
  { name: "IT", rate: 0.01, sortOrder: 2 },
  { name: "Accounting", rate: 0.015, sortOrder: 3 },
  { name: "Reservations", rate: 0.02, sortOrder: 4 },
  { name: "General Management", rate: 0.02, sortOrder: 5 },
] as const;

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

// Fixed cost escalation rate (annual inflation for fixed operating expenses)
export const DEFAULT_FIXED_COST_ESCALATION_RATE = 0.03;

// Management company tax rate (corporate income tax on management company earnings)
export const DEFAULT_COMPANY_TAX_RATE = 0.30;

// Default projection horizon
export const DEFAULT_PROJECTION_YEARS = 10;

// Funding instrument defaults
export const DEFAULT_SAFE_VALUATION_CAP = 2500000;
export const DEFAULT_SAFE_DISCOUNT_RATE = 0.20;

// Seed debt assumptions for production seeding
export const SEED_DEBT_ASSUMPTIONS = {
  acqLTV: 0.75,
  refiLTV: 0.75,
  interestRate: 0.09,
  amortizationYears: 25,
  acqClosingCostRate: 0.02,
  refiClosingCostRate: 0.03,
} as const;
