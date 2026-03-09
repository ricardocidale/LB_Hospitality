/**
 * types — Shared TypeScript interfaces for the financial engine
 *
 * Three primary shapes consumed by property-engine and company-engine:
 *
 *   PropertyInput   — per-hotel assumptions (room count, ADR, cost rates, etc.)
 *   GlobalInput     — model-wide assumptions (inflation, staffing, SAFE dates)
 *   MonthlyFinancials — one month of engine output for a single property
 *
 * Nullability rules:
 *   - Required fields have no `?` / `| null`; optional fields use `?` or `| null`
 *   - The engine applies fallback constants (from constants.ts) when optional
 *     fields are absent. Never pass `0` to mean "use default" — use `undefined`.
 *
 * acquisitionDate vs operationsStartDate:
 *   - acquisitionDate: when the property is purchased. Debt and depreciation
 *     begin here. Defaults to operationsStartDate if omitted.
 *   - operationsStartDate: when the hotel opens for business. Revenue and
 *     variable expenses start here. May be later than acquisitionDate (pre-ops
 *     gap means debt service during construction/renovation).
 *
 * feeCategories: custom service-fee breakdown that overrides the flat
 *   baseManagementFeeRate. Each category has a name, rate (fraction of
 *   revenueTotal), and isActive flag. If any active categories exist, the
 *   engine sums them as feeBase instead of using the flat rate.
 */
import { ServiceTemplate, AggregatedServiceCosts } from '@calc/services/types';

export interface PropertyInput {
  operationsStartDate: string;
  acquisitionDate?: string;
  roomCount: number;
  startAdr: number;
  adrGrowthRate: number;
  startOccupancy: number;
  maxOccupancy: number;
  occupancyRampMonths: number;
  occupancyGrowthStep: number;
  purchasePrice: number;
  buildingImprovements?: number | null;
  landValuePercent?: number | null;
  type: string;
  // Financing
  acquisitionLTV?: number | null;
  acquisitionInterestRate?: number | null;
  acquisitionTermYears?: number | null;
  taxRate?: number | null;
  inflationRate?: number | null;
  // Refinance
  willRefinance?: string | null;
  refinanceDate?: string | null;
  refinanceLTV?: number | null;
  refinanceInterestRate?: number | null;
  refinanceTermYears?: number | null;
  refinanceClosingCostRate?: number | null;
  exitCapRate?: number | null;
  // Disposition
  dispositionCommission?: number | null;
  // Operating reserve
  operatingReserve?: number | null;
  // Refinance timing
  refinanceYearsAfterAcquisition?: number | null;
  // Operating Cost Rates
  costRateRooms: number;
  costRateFB: number;
  costRateAdmin: number;
  costRateMarketing: number;
  costRatePropertyOps: number;
  costRateUtilities: number;
  costRateInsurance: number;
  costRateTaxes: number;
  costRateIT: number;
  costRateFFE: number;
  costRateOther: number;
  // Revenue Streams
  revShareEvents: number;
  revShareFB: number;
  revShareOther: number;
  // Catering boost
  cateringBoostPercent?: number;
  // Management company fee rates
  baseManagementFeeRate?: number;
  incentiveManagementFeeRate?: number;
  // Service fee categories
  feeCategories?: { name: string; rate: number; isActive: boolean }[];
  // Property identity
  id?: number;
  name?: string;
}

export interface GlobalInput {
  modelStartDate: string;
  projectionYears?: number;
  companyOpsStartDate?: string;
  fiscalYearStartMonth?: number;
  inflationRate: number;
  companyInflationRate?: number;
  fixedCostEscalationRate?: number;
  marketingRate: number;
  // Funding Instrument
  safeTranche1Amount?: number;
  safeTranche1Date?: string;
  safeTranche2Amount?: number;
  safeTranche2Date?: string;
  // Staffing tiers
  staffTier1MaxProperties?: number;
  staffTier1Fte?: number;
  staffTier2MaxProperties?: number;
  staffTier2Fte?: number;
  staffTier3Fte?: number;
  // Management company cost parameters
  partnerCompYear1?: number;
  partnerCompYear2?: number;
  partnerCompYear3?: number;
  partnerCompYear4?: number;
  partnerCompYear5?: number;
  partnerCompYear6?: number;
  partnerCompYear7?: number;
  partnerCompYear8?: number;
  partnerCompYear9?: number;
  partnerCompYear10?: number;
  partnerCountYear1?: number;
  partnerCountYear2?: number;
  partnerCountYear3?: number;
  partnerCountYear4?: number;
  partnerCountYear5?: number;
  partnerCountYear6?: number;
  partnerCountYear7?: number;
  partnerCountYear8?: number;
  partnerCountYear9?: number;
  partnerCountYear10?: number;
  staffSalary?: number;
  officeLeaseStart?: number;
  professionalServicesStart?: number;
  techInfraStart?: number;
  businessInsuranceStart?: number;
  travelCostPerClient?: number;
  itLicensePerClient?: number;
  miscOpsRate?: number;
  // Expense rates
  eventExpenseRate?: number;
  otherExpenseRate?: number;
  utilitiesVariableSplit?: number;
  // Tax
  companyTaxRate?: number;
  // Exit & Sale
  exitCapRate?: number;
  salesCommissionRate?: number;
  debtAssumptions: {
    interestRate: number;
    amortizationYears: number;
    acqLTV?: number;
    refiLTV?: number;
    refiClosingCostRate?: number;
  };
}

export interface MonthlyFinancials {
  date: Date;
  monthIndex: number;
  occupancy: number;
  adr: number;
  availableRooms: number;
  soldRooms: number;
  revenueRooms: number;
  revenueEvents: number;
  revenueFB: number;
  revenueOther: number;
  revenueTotal: number;
  expenseRooms: number;
  expenseFB: number;
  expenseEvents: number;
  expenseOther: number;
  expenseMarketing: number;
  expensePropertyOps: number;
  expenseUtilitiesVar: number;
  expenseFFE: number;
  feeBase: number;
  feeIncentive: number;
  serviceFeesByCategory: Record<string, number>;
  expenseAdmin: number;
  expenseIT: number;
  expenseInsurance: number;
  expenseTaxes: number;
  expenseUtilitiesFixed: number;
  expenseOtherCosts: number;
  totalExpenses: number;
  gop: number;
  agop: number;
  noi: number;
  anoi: number;
  interestExpense: number;
  principalPayment: number;
  debtPayment: number;
  netIncome: number;
  incomeTax: number;
  cashFlow: number;
  // Balance sheet fields
  depreciationExpense: number;
  propertyValue: number;
  debtOutstanding: number;
  // Refinance
  refinancingProceeds: number;
  // Cash flow statement fields
  operatingCashFlow: number;
  financingCashFlow: number;
  endingCash: number;
  // Negative cash detection
  cashShortfall: boolean;
}

export interface ServiceFeeBreakdown {
  byCategory: Record<string, number>;
  byPropertyId: Record<string, number>;
  byCategoryByPropertyId: Record<string, Record<string, number>>;
}

export interface CompanyMonthlyFinancials {
  date: Date;
  monthIndex: number;
  year: number;
  baseFeeRevenue: number;
  incentiveFeeRevenue: number;
  incentiveFeeByPropertyId: Record<string, number>;
  serviceFeeBreakdown: ServiceFeeBreakdown;
  totalRevenue: number;
  costOfCentralizedServices: AggregatedServiceCosts | null;
  totalVendorCost: number;
  grossProfit: number;
  partnerCompensation: number;
  staffCompensation: number;
  officeLease: number;
  professionalServices: number;
  techInfrastructure: number;
  businessInsurance: number;
  travelCosts: number;
  itLicensing: number;
  marketing: number;
  miscOps: number;
  totalExpenses: number;
  netIncome: number;
  safeFunding: number;
  safeFunding1: number;
  safeFunding2: number;
  cashFlow: number;
  endingCash: number;
  cashShortfall: boolean;
  // legacy compatibility
  propertyCount?: number;
  totalPropertyRevenue?: number;
  staffFte?: number;
  staffCost?: number;
  partnerCost?: number;
  ebitda?: number;
  interestExpense?: number;
  operatingCashFlow?: number;
  financingCashFlow?: number;
  netCashFlow?: number;
}
