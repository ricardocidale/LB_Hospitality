/**
 * shared/constants.ts — Single Source of Truth for Financial Defaults
 *
 * Every default value that the financial engine, seed data, verification checker,
 * and UI all rely on lives here. Changing a value here automatically propagates
 * across the entire stack (client + server). These constants represent industry-
 * standard benchmarks from USALI (Uniform System of Accounts for the Lodging
 * Industry), IRS publications, and HVS fee surveys.
 *
 * How these are used:
 *   - The database schema (shared/schema.ts) references them as column defaults
 *   - The financial engine uses them as fallbacks when a property hasn't
 *     overridden a particular rate
 *   - The verification checker compares calculated values against these defaults
 *     to detect anomalies
 */

// ──────────────────────────────────────────────────────────
// REVENUE STREAM SHARES
// Each property generates revenue from multiple sources. These percentages
// express how much revenue each ancillary stream contributes relative to
// room revenue. For example, 0.30 means event revenue = 30% of room revenue.
// ──────────────────────────────────────────────────────────

// Events share is higher than standard hotels (10-15%) because these are
// boutique wellness/retreat properties with dedicated event programming.
// Source: Global Wellness Institute 2024 — wellness retreats generate 25-35% of total revenue.
export const DEFAULT_REV_SHARE_EVENTS = 0.30;
// Food & Beverage revenue as a share of room revenue
export const DEFAULT_REV_SHARE_FB = 0.18;
// Other revenue (parking, spa, gift shop, etc.) as a share of room revenue
export const DEFAULT_REV_SHARE_OTHER = 0.05;

// Catering boost: percentage uplift applied on top of base F&B revenue to
// account for event catering (weddings, corporate retreats, etc.).
// This is a blended rate across catered and non-catered events.
export const DEFAULT_CATERING_BOOST_PCT = 0.22;

// ──────────────────────────────────────────────────────────
// EXPENSE RATES (GLOBAL-CONFIGURABLE)
// Applied to specific revenue streams to compute their direct costs.
// ──────────────────────────────────────────────────────────

// Event expense rate: 65% of event revenue goes to direct event costs
export const DEFAULT_EVENT_EXPENSE_RATE = 0.65;
// Other revenue expense rate: 60% of other revenue goes to direct costs
export const DEFAULT_OTHER_EXPENSE_RATE = 0.60;
// What fraction of total utility cost is variable (scales with occupancy)
// vs. fixed (base load regardless of guests). 60% variable / 40% fixed.
export const DEFAULT_UTILITIES_VARIABLE_SPLIT = 0.60;

// ──────────────────────────────────────────────────────────
// PROPERTY OPERATING COST RATES (USALI CATEGORIES)
// Each rate is a percentage of total property revenue allocated to that
// department. These follow USALI (Uniform System of Accounts for the
// Lodging Industry) standard departmental expense categories.
// ──────────────────────────────────────────────────────────

export const DEFAULT_COST_RATE_ROOMS = 0.20;       // Rooms department (housekeeping, front desk, linens)
export const DEFAULT_COST_RATE_FB = 0.09;           // Food & Beverage cost of goods + labor
export const DEFAULT_COST_RATE_ADMIN = 0.08;        // General & Administrative (G&A)
export const DEFAULT_COST_RATE_MARKETING = 0.01;    // Sales & Marketing
export const DEFAULT_COST_RATE_PROPERTY_OPS = 0.04; // Property Operations & Maintenance (POM)
export const DEFAULT_COST_RATE_UTILITIES = 0.05;    // Utilities (electric, water, gas, internet)
export const DEFAULT_COST_RATE_INSURANCE = 0.02;    // Property insurance
export const DEFAULT_COST_RATE_TAXES = 0.03;        // Property/real estate taxes
export const DEFAULT_COST_RATE_IT = 0.005;          // Information Technology
export const DEFAULT_COST_RATE_FFE = 0.04;          // Furniture, Fixtures & Equipment reserve (FF&E)
export const DEFAULT_COST_RATE_OTHER = 0.05;        // Miscellaneous / other operating expenses

// ──────────────────────────────────────────────────────────
// MANAGEMENT COMPANY FEE DEFAULTS
// The management company charges each property two types of fees:
//   1. Base fee: a flat percentage of total revenue (compensation for day-to-day operations)
//   2. Incentive fee: a percentage of Gross Operating Profit (GOP) that rewards performance
// Source: HVS Fee Survey 2024 — Specialty/wellness operators command 6-10% base + 12-20% incentive
// ──────────────────────────────────────────────────────────

export const DEFAULT_BASE_MANAGEMENT_FEE_RATE = 0.085;      // 8.5% of Total Revenue
export const DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE = 0.12;   // 12% of Gross Operating Profit

// ──────────────────────────────────────────────────────────
// SERVICE FEE CATEGORIES (GRANULAR BREAKDOWN)
// Instead of a single base management fee, each property can break down fees
// into specific service categories. The sum of these default rates (8.5%)
// intentionally matches DEFAULT_BASE_MANAGEMENT_FEE_RATE above.
// ──────────────────────────────────────────────────────────

export const DEFAULT_SERVICE_FEE_CATEGORIES = [
  { name: "Marketing", rate: 0.02, sortOrder: 1 },          // 2.0% — brand, digital, campaigns
  { name: "IT", rate: 0.01, sortOrder: 2 },                 // 1.0% — PMS, booking engine, support
  { name: "Accounting", rate: 0.015, sortOrder: 3 },        // 1.5% — bookkeeping, reporting, audit prep
  { name: "Reservations", rate: 0.02, sortOrder: 4 },       // 2.0% — central reservation system
  { name: "General Management", rate: 0.02, sortOrder: 5 }, // 2.0% — executive oversight, HR
] as const;

// ──────────────────────────────────────────────────────────
// EXIT & SALE DEFAULTS
// Used when modeling the sale/disposition of a property at the end of the
// projection horizon or at a refinance event.
// ──────────────────────────────────────────────────────────

// Cap rate applied to trailing NOI to compute exit (sale) price.
// Exit price = NOI / Cap Rate. A lower cap rate = higher valuation.
export const DEFAULT_EXIT_CAP_RATE = 0.085;
// Income tax rate applied to gain on sale
export const DEFAULT_TAX_RATE = 0.25;
// Broker commission on property sale (% of sale price)
export const DEFAULT_COMMISSION_RATE = 0.05;

// ──────────────────────────────────────────────────────────
// DEPRECIATION & LAND VALUE
// ──────────────────────────────────────────────────────────

// Land is not depreciable under IRS rules. This percentage of total purchase
// price is allocated to land, and the remainder to the depreciable building.
// Source: IRS Publication 946
export const DEFAULT_LAND_VALUE_PERCENT = 0.25;

// Commercial real property depreciation period per IRS Publication 946
// and ASC 360 (Property, Plant, and Equipment). The building portion of
// a hotel is depreciated straight-line over 27.5 years.
export const DEPRECIATION_YEARS = 27.5;

// ──────────────────────────────────────────────────────────
// TIME CONSTANTS
// ──────────────────────────────────────────────────────────

// Average days per month (365/12 ≈ 30.42, rounded to 30.5). Used to convert
// monthly ADR × occupancy into available-room-night revenue.
export const DAYS_PER_MONTH = 30.5;

// How many months between each occupancy growth step during the ramp-up phase
// after a property opens. New hotels don't fill instantly — occupancy grows
// in steps until reaching a stabilized level.
export const DEFAULT_OCCUPANCY_RAMP_MONTHS = 6;

// ──────────────────────────────────────────────────────────
// COST ESCALATION & TAXES
// ──────────────────────────────────────────────────────────

// Annual escalation rate for fixed operating expenses (office lease,
// insurance, professional services). Applied as compound growth each year.
export const DEFAULT_FIXED_COST_ESCALATION_RATE = 0.03;

// Corporate income tax rate applied to the management company's net income.
// Used to compute after-tax free cash flow at the company level.
export const DEFAULT_COMPANY_TAX_RATE = 0.30;

// ──────────────────────────────────────────────────────────
// PROJECTION HORIZON
// ──────────────────────────────────────────────────────────

// Default number of years for the financial model (10-year pro forma is
// standard for hospitality private equity underwriting).
export const DEFAULT_PROJECTION_YEARS = 10;

// ──────────────────────────────────────────────────────────
// FUNDING INSTRUMENT DEFAULTS (SAFE)
// A SAFE (Simple Agreement for Future Equity) is an early-stage funding
// instrument. These defaults configure the seed round assumptions.
// ──────────────────────────────────────────────────────────

// Valuation cap: maximum company valuation at which the SAFE converts to equity
export const DEFAULT_SAFE_VALUATION_CAP = 2500000;
// Discount rate: investors get this % discount to the next round's price
export const DEFAULT_SAFE_DISCOUNT_RATE = 0.20;

// ──────────────────────────────────────────────────────────
// SEED DEBT ASSUMPTIONS
// Default loan terms used when seeding production data (initial portfolio).
// These are the starting-point leverage assumptions for both acquisition
// and refinance scenarios.
// ──────────────────────────────────────────────────────────

export const SEED_DEBT_ASSUMPTIONS = {
  acqLTV: 0.75,             // Acquisition loan-to-value (75% LTV means 25% equity down)
  refiLTV: 0.75,            // Refinance loan-to-value
  interestRate: 0.09,       // Annual interest rate (9%)
  amortizationYears: 25,    // Loan fully amortizes over 25 years
  acqClosingCostRate: 0.02, // Acquisition closing costs as % of loan amount
  refiClosingCostRate: 0.03,// Refinance closing costs as % of new loan amount
} as const;
