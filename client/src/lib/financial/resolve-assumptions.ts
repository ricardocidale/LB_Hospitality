/**
 * resolve-assumptions — Resolves property defaults and pre-computes loop-invariant
 * values for the property pro-forma engine.
 *
 * Extracts all assumption resolution, index computation, escalation factor
 * pre-computation, and mutable tracker initialization from the main engine loop
 * so that generatePropertyProForma focuses solely on the monthly iteration.
 */
import { startOfMonth } from "date-fns";
import { pmt } from "@calc/shared/pmt";
import {
  DEFAULT_LTV,
  DEFAULT_INTEREST_RATE,
  DEFAULT_TERM_YEARS,
  DEPRECIATION_YEARS,
  DAYS_PER_MONTH,
  DEFAULT_REV_SHARE_EVENTS,
  DEFAULT_REV_SHARE_FB,
  DEFAULT_REV_SHARE_OTHER,
  DEFAULT_CATERING_BOOST_PCT,
  DEFAULT_COST_RATE_ROOMS,
  DEFAULT_COST_RATE_FB,
  DEFAULT_COST_RATE_ADMIN,
  DEFAULT_COST_RATE_MARKETING,
  DEFAULT_COST_RATE_PROPERTY_OPS,
  DEFAULT_COST_RATE_UTILITIES,
  DEFAULT_COST_RATE_TAXES,
  DEFAULT_COST_RATE_IT,
  DEFAULT_COST_RATE_FFE,
  DEFAULT_COST_RATE_OTHER,
  DEFAULT_COST_RATE_INSURANCE,
  DEFAULT_EVENT_EXPENSE_RATE,
  DEFAULT_OTHER_EXPENSE_RATE,
  DEFAULT_UTILITIES_VARIABLE_SPLIT,
  DEFAULT_LAND_VALUE_PERCENT,
  DEFAULT_PROPERTY_TAX_RATE,
  DEFAULT_OCCUPANCY_RAMP_MONTHS,
  DEFAULT_BASE_MANAGEMENT_FEE_RATE,
  DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,
} from '../constants';
import {
  DEFAULT_AR_DAYS,
  DEFAULT_AP_DAYS,
  DEFAULT_ESCALATION_METHOD,
  DEFAULT_COST_SEG_5YR_PCT,
  DEFAULT_COST_SEG_7YR_PCT,
  DEFAULT_COST_SEG_15YR_PCT,
  COST_SEG_5YR_LIFE_YEARS,
  COST_SEG_7YR_LIFE_YEARS,
  COST_SEG_15YR_LIFE_YEARS,
  MONTHS_PER_YEAR,
} from '@shared/constants';
import { PropertyInput, GlobalInput } from './types';
import { parseLocalDate } from './utils';

function safeNum(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

export interface PropertyEngineContext {
  modelStart: Date;
  opsStart: Date;
  acquisitionDate: Date;
  startYear: number;
  startMonth: number;
  opsStartIdx: number;
  acqMonthIdx: number;

  landPct: number;
  buildingValue: number;
  totalPropertyValue: number;
  totalPropertyValueDiv12: number;

  depreciationYears: number;
  costSegEnabled: boolean;
  monthlyDepreciation: number;
  costSeg5yrMonthly: number;
  costSeg7yrMonthly: number;
  costSeg15yrMonthly: number;
  costSegRestMonthly: number;
  costSeg5yrBasis: number;
  costSeg7yrBasis: number;
  costSeg15yrBasis: number;
  costSegRestBasis: number;

  originalLoanAmount: number;
  loanRate: number;
  taxRate: number;
  dayCountConvention: string;
  monthlyRate: number;
  totalPayments: number;
  monthlyPayment: number;
  isFinanced: boolean;
  loanN: number;

  arDays: number;
  apDays: number;
  escalationMethod: string;

  costRateRooms: number;
  costRateFB: number;
  costRateAdmin: number;
  costRateMarketing: number;
  costRatePropertyOps: number;
  costRateUtilities: number;
  costRateTaxes: number;
  costRateIT: number;
  costRateFFE: number;
  costRateOther: number;
  costRateInsurance: number;
  eventExpenseRate: number;
  otherExpenseRate: number;
  utilitiesVariableSplit: number;
  utilitiesFixedSplit: number;
  adrGrowthRate: number;
  effectiveInflation: number;
  fixedEscalationRate: number;
  incentiveFeeRate: number;
  baseMgmtFeeRate: number;
  activeFeeCategories: { name: string; rate: number; isActive: boolean }[] | undefined;
  hasActiveFeeCategories: boolean;

  rampMonths: number;
  availableRooms: number;
  baseAdr: number;
  baseMonthlyRoomRev: number;
  baseMonthlyTotalRev: number;
  stabilizedMonthlyTotalRev: number;
  revShareEvents: number;
  revShareFB: number;
  revShareOther: number;
  cateringBoostMultiplier: number;

  needsDaysLookup: boolean;
  daysInMonthLookup: number[];
  adrFactors: number[];
  fixedEscFactors: number[];
  monthlyEscRate: number;

  nolBalance: number;
  cumulativeCash: number;
  prevDebtOutstanding: number;
  acqDebtMonthCount: number;
  prevAR: number;
  prevAP: number;
}

export function resolvePropertyAssumptions(
  property: PropertyInput,
  global: GlobalInput,
  months: number
): PropertyEngineContext {
  const modelStart = startOfMonth(parseLocalDate(global.modelStartDate));
  const opsStart = startOfMonth(parseLocalDate(property.operationsStartDate));
  const acquisitionDate = property.acquisitionDate ? startOfMonth(parseLocalDate(property.acquisitionDate)) : opsStart;

  const landPct = property.landValuePercent ?? DEFAULT_LAND_VALUE_PERCENT;
  const buildingValue = property.purchasePrice * (1 - landPct) + (property.buildingImprovements ?? 0);

  const depreciationYears = property.depreciationYears ?? global.depreciationYears ?? DEPRECIATION_YEARS;
  const daysPerMonth = global.daysPerMonth ?? DAYS_PER_MONTH;

  const costSegEnabled = property.costSegEnabled ?? false;
  let monthlyDepreciation = safeNum(buildingValue / depreciationYears / MONTHS_PER_YEAR);
  let costSeg5yrMonthly = 0;
  let costSeg7yrMonthly = 0;
  let costSeg15yrMonthly = 0;
  let costSegRestMonthly = 0;
  let costSeg5yrBasis = 0;
  let costSeg7yrBasis = 0;
  let costSeg15yrBasis = 0;
  let costSegRestBasis = 0;
  if (costSegEnabled) {
    const pct5 = property.costSeg5yrPct ?? DEFAULT_COST_SEG_5YR_PCT;
    const pct7 = property.costSeg7yrPct ?? DEFAULT_COST_SEG_7YR_PCT;
    const pctLong = property.costSeg15yrPct ?? DEFAULT_COST_SEG_15YR_PCT;
    const pctRest = 1 - pct5 - pct7 - pctLong;
    costSeg5yrBasis = buildingValue * pct5;
    costSeg7yrBasis = buildingValue * pct7;
    costSeg15yrBasis = buildingValue * pctLong;
    costSegRestBasis = buildingValue * Math.max(0, pctRest);
    costSeg5yrMonthly = safeNum(costSeg5yrBasis / COST_SEG_5YR_LIFE_YEARS / MONTHS_PER_YEAR);
    costSeg7yrMonthly = safeNum(costSeg7yrBasis / COST_SEG_7YR_LIFE_YEARS / MONTHS_PER_YEAR);
    costSeg15yrMonthly = safeNum(costSeg15yrBasis / COST_SEG_15YR_LIFE_YEARS / MONTHS_PER_YEAR);
    costSegRestMonthly = safeNum(costSegRestBasis / depreciationYears / MONTHS_PER_YEAR);
  }

  const totalPropertyValue = property.purchasePrice + (property.buildingImprovements ?? 0);
  const ltv = property.acquisitionLTV ?? DEFAULT_LTV;
  const originalLoanAmount = property.type === "Financed" ? totalPropertyValue * ltv : 0;
  const loanRate = property.acquisitionInterestRate ?? DEFAULT_INTEREST_RATE;
  const loanTerm = property.acquisitionTermYears ?? DEFAULT_TERM_YEARS;
  // Income tax rate (NOT property tax — property taxes use costRateTaxes)
  const taxRate = property.taxRate ?? DEFAULT_PROPERTY_TAX_RATE;
  const dayCountConvention = property.dayCountConvention ?? '30/360';
  const monthlyRate = loanRate / MONTHS_PER_YEAR;
  const totalPayments = loanTerm * MONTHS_PER_YEAR;
  let monthlyPayment = 0;
  if (originalLoanAmount > 0) {
    monthlyPayment = safeNum(pmt(originalLoanAmount, monthlyRate, totalPayments));
  }

  const arDays = property.arDays ?? DEFAULT_AR_DAYS;
  const apDays = property.apDays ?? DEFAULT_AP_DAYS;
  const escalationMethod = property.escalationMethod ?? DEFAULT_ESCALATION_METHOD;

  const baseAdr = property.startAdr;
  const baseMonthlyRoomRev = property.roomCount * daysPerMonth * baseAdr * property.startOccupancy;
  const revShareEvents = property.revShareEvents ?? DEFAULT_REV_SHARE_EVENTS;
  const revShareFB = property.revShareFB ?? DEFAULT_REV_SHARE_FB;
  const revShareOther = property.revShareOther ?? DEFAULT_REV_SHARE_OTHER;
  const cateringBoostPct = property.cateringBoostPercent ?? DEFAULT_CATERING_BOOST_PCT;
  const cateringBoostMultiplier = 1 + cateringBoostPct;
  const baseMonthlyEventsRev = baseMonthlyRoomRev * revShareEvents;
  const baseMonthlyFBRev = baseMonthlyRoomRev * revShareFB * cateringBoostMultiplier;
  const baseMonthlyOtherRev = baseMonthlyRoomRev * revShareOther;
  const baseMonthlyTotalRev = baseMonthlyRoomRev + baseMonthlyEventsRev + baseMonthlyFBRev + baseMonthlyOtherRev;

  // Fixed costs are sized to stabilized (max occupancy) revenue, not starting occupancy.
  // A hotel's admin staff, utilities, and insurance don't shrink because occupancy is 40% in month 1.
  const stabilizedMonthlyRoomRev = property.roomCount * daysPerMonth * baseAdr * property.maxOccupancy;
  const stabilizedMonthlyTotalRev = stabilizedMonthlyRoomRev * (1 + revShareEvents + revShareFB * cateringBoostMultiplier + revShareOther);

  const startYear = modelStart.getFullYear();
  const startMonth = modelStart.getMonth();
  const opsStartIdx = (opsStart.getFullYear() - startYear) * MONTHS_PER_YEAR + (opsStart.getMonth() - startMonth);
  const acqMonthIdx = (acquisitionDate.getFullYear() - startYear) * MONTHS_PER_YEAR + (acquisitionDate.getMonth() - startMonth);

  const needsDaysLookup = dayCountConvention === 'ACT/360' || dayCountConvention === 'ACT/365';
  const daysInMonthLookup: number[] = needsDaysLookup ? new Array(months) : [];
  if (needsDaysLookup) {
    for (let i = 0; i < months; i++) {
      const totalM = startMonth + i;
      const y = startYear + Math.floor(totalM / MONTHS_PER_YEAR);
      const m = totalM % MONTHS_PER_YEAR;
      daysInMonthLookup[i] = new Date(y, m + 1, 0).getDate();
    }
  }

  const costRateRooms = property.costRateRooms ?? DEFAULT_COST_RATE_ROOMS;
  const costRateFB = property.costRateFB ?? DEFAULT_COST_RATE_FB;
  const costRateAdmin = property.costRateAdmin ?? DEFAULT_COST_RATE_ADMIN;
  const costRateMarketing = property.costRateMarketing ?? DEFAULT_COST_RATE_MARKETING;
  const costRatePropertyOps = property.costRatePropertyOps ?? DEFAULT_COST_RATE_PROPERTY_OPS;
  const costRateUtilities = property.costRateUtilities ?? DEFAULT_COST_RATE_UTILITIES;
  const costRateTaxes = property.costRateTaxes ?? DEFAULT_COST_RATE_TAXES;
  const costRateIT = property.costRateIT ?? DEFAULT_COST_RATE_IT;
  const costRateFFE = property.costRateFFE ?? DEFAULT_COST_RATE_FFE;
  const costRateOther = property.costRateOther ?? DEFAULT_COST_RATE_OTHER;
  const costRateInsurance = property.costRateInsurance ?? DEFAULT_COST_RATE_INSURANCE;
  const eventExpenseRate = global.eventExpenseRate ?? DEFAULT_EVENT_EXPENSE_RATE;
  const otherExpenseRate = global.otherExpenseRate ?? DEFAULT_OTHER_EXPENSE_RATE;
  const utilitiesVariableSplit = global.utilitiesVariableSplit ?? DEFAULT_UTILITIES_VARIABLE_SPLIT;
  const utilitiesFixedSplit = 1 - utilitiesVariableSplit;
  const adrGrowthRate = property.adrGrowthRate ?? 0;
  const effectiveInflation = property.inflationRate ?? global.inflationRate;
  const fixedEscalationRate = global.fixedCostEscalationRate ?? effectiveInflation;
  const incentiveFeeRate = property.incentiveManagementFeeRate ?? DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE;
  const baseMgmtFeeRate = property.baseManagementFeeRate ?? DEFAULT_BASE_MANAGEMENT_FEE_RATE;
  const activeFeeCategories = property.feeCategories?.filter(c => c.isActive);
  const hasActiveFeeCategories = activeFeeCategories != null && activeFeeCategories.length > 0;
  const rampMonths = Math.max(1, property.occupancyRampMonths ?? DEFAULT_OCCUPANCY_RAMP_MONTHS);
  const availableRooms = property.roomCount * daysPerMonth;
  const totalPropertyValueDiv12 = totalPropertyValue / MONTHS_PER_YEAR;
  const isFinanced = property.type === "Financed";
  const loanN = loanTerm * MONTHS_PER_YEAR;

  const maxMonthsSinceOps = opsStartIdx < 0 ? months - 1 + Math.abs(opsStartIdx) : months - 1;
  const maxOpsYear = Math.floor(maxMonthsSinceOps / MONTHS_PER_YEAR) + 1;
  const adrFactors = new Array(maxOpsYear);
  const fixedEscFactors = new Array(maxOpsYear);
  for (let y = 0; y < maxOpsYear; y++) {
    adrFactors[y] = safeNum(Math.pow(1 + adrGrowthRate, y));
    fixedEscFactors[y] = safeNum(Math.pow(1 + fixedEscalationRate, y));
  }
  const monthlyEscRate = escalationMethod === 'monthly' ? Math.pow(1 + fixedEscalationRate, 1 / MONTHS_PER_YEAR) - 1 : 0;

  return {
    modelStart,
    opsStart,
    acquisitionDate,
    startYear,
    startMonth,
    opsStartIdx,
    acqMonthIdx,
    landPct,
    buildingValue,
    totalPropertyValue,
    totalPropertyValueDiv12,
    depreciationYears,
    costSegEnabled,
    monthlyDepreciation,
    costSeg5yrMonthly,
    costSeg7yrMonthly,
    costSeg15yrMonthly,
    costSegRestMonthly,
    costSeg5yrBasis,
    costSeg7yrBasis,
    costSeg15yrBasis,
    costSegRestBasis,
    originalLoanAmount,
    loanRate,
    taxRate,
    dayCountConvention,
    monthlyRate,
    totalPayments,
    monthlyPayment,
    isFinanced,
    loanN,
    arDays,
    apDays,
    escalationMethod,
    costRateRooms,
    costRateFB,
    costRateAdmin,
    costRateMarketing,
    costRatePropertyOps,
    costRateUtilities,
    costRateTaxes,
    costRateIT,
    costRateFFE,
    costRateOther,
    costRateInsurance,
    eventExpenseRate,
    otherExpenseRate,
    utilitiesVariableSplit,
    utilitiesFixedSplit,
    adrGrowthRate,
    effectiveInflation,
    fixedEscalationRate,
    incentiveFeeRate,
    baseMgmtFeeRate,
    activeFeeCategories,
    hasActiveFeeCategories,
    rampMonths,
    availableRooms,
    baseAdr,
    baseMonthlyRoomRev,
    baseMonthlyTotalRev,
    stabilizedMonthlyTotalRev,
    revShareEvents,
    revShareFB,
    revShareOther,
    cateringBoostMultiplier,
    needsDaysLookup,
    daysInMonthLookup,
    adrFactors,
    fixedEscFactors,
    monthlyEscRate,
    nolBalance: 0,
    cumulativeCash: 0,
    prevDebtOutstanding: originalLoanAmount,
    acqDebtMonthCount: 0,
    prevAR: 0,
    prevAP: 0,
  };
}
