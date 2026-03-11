/**
 * company-engine — Management-company monthly pro-forma generator
 *
 * Rolls up all property pro-formas into the management company P&L.
 * Revenue = sum of base + incentive fees from every active property.
 * Expenses = staffing (dynamic tiers), partner comp, fixed G&A, variable ops.
 *
 * Fee zero-sum: fees earned here equal fees expensed in each property SPV.
 * In consolidation these intercompany amounts eliminate to zero.
 *
 * Funding gate: operations cannot begin before BOTH companyOpsStartDate AND
 * the first funding tranche date have been reached. The gate is strict — even
 * one day early returns zero revenue/expenses.
 *
 * Staffing tiers: headcount is derived each month from activePropertyCount
 * against tier thresholds in global (staffTier1MaxProperties, etc.).
 *
 * Service templates (optional): if provided, vendor cost-of-services is
 * deducted from fee revenue to produce grossProfit before G&A.
 */
import {
  PROJECTION_MONTHS,
  DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,
  DEFAULT_BASE_MANAGEMENT_FEE_RATE,
  DEFAULT_PARTNER_COMP,
  DEFAULT_STAFF_SALARY,
  STAFFING_TIERS,
  DEFAULT_OFFICE_LEASE,
  DEFAULT_PROFESSIONAL_SERVICES,
  DEFAULT_TECH_INFRA,
  DEFAULT_BUSINESS_INSURANCE,
  DEFAULT_TRAVEL_PER_CLIENT,
  DEFAULT_IT_LICENSE_PER_CLIENT,
  DEFAULT_MARKETING_RATE,
  DEFAULT_MISC_OPS_RATE,
  DEFAULT_SAFE_TRANCHE,
} from '../constants';
import { DEFAULT_COMPANY_TAX_RATE } from '@shared/constants';
import { computeCostOfServices } from '@calc/services/cost-of-services';
import type { ServiceTemplate, AggregatedServiceCosts } from '@calc/services/types';
import { PropertyInput, GlobalInput, CompanyMonthlyFinancials, ServiceFeeBreakdown } from './types';
import { generatePropertyProForma } from './property-engine';
import { parseLocalDate } from '@shared/dates';

/** Extract { year, month (0-based) } from a date string using parseLocalDate. */
function parseDateComponents(dateStr: string) {
  const d = parseLocalDate(dateStr);
  return { year: d.getFullYear(), month: d.getMonth() };
}

/**
 * Generate month-by-month financials for the management company itself.
 *
 * @param properties      All portfolio properties (used to compute fee revenue each month).
 * @param global          Model-wide assumptions (funding dates, staffing tiers, partner comp).
 * @param months          Projection horizon in months (default: PROJECTION_MONTHS = 120).
 * @param serviceTemplates Optional centralized-services templates. When present, vendor
 *                         cost-of-services is deducted from fee revenue → grossProfit.
 * @returns               Array of CompanyMonthlyFinancials, one entry per month from model start.
 *
 * Funding gate: hasStartedOps = currentDate >= companyOpsStartDate AND >= safeTranche1Date.
 * Both conditions must hold simultaneously — no revenue or expenses accrue before the gate.
 */
export function generateCompanyProForma(
  properties: PropertyInput[],
  global: GlobalInput,
  months: number = PROJECTION_MONTHS,
  serviceTemplates?: ServiceTemplate[],
): CompanyMonthlyFinancials[] {
  const results: any[] = []; // Using any[] to match the existing return type in the original file which has more fields than the interface
  let cumulativeCompanyCash = 0;

  const startParsed = parseDateComponents(global.modelStartDate);
  const tranche1Parsed = global.safeTranche1Date ? parseDateComponents(global.safeTranche1Date) : startParsed;
  const tranche2Parsed = global.safeTranche2Date ? parseDateComponents(global.safeTranche2Date) : null;
  const opsStartParsed = global.companyOpsStartDate ? parseDateComponents(global.companyOpsStartDate) : startParsed;
  
  const propertyFinancials = properties.map(p => generatePropertyProForma(p, global, months));
  
  for (let m = 0; m < months; m++) {
    const totalMonths = startParsed.month + m;
    const currentYear = startParsed.year + Math.floor(totalMonths / 12);
    const currentMonth = totalMonths % 12;
    const currentDate = new Date(currentYear, currentMonth, 1);
    const year = Math.floor(m / 12);
    
    const opsStartDate = new Date(opsStartParsed.year, opsStartParsed.month, 1);
    const firstSafeDate = new Date(tranche1Parsed.year, tranche1Parsed.month, 1);
    const hasStartedOps = currentDate >= opsStartDate && currentDate >= firstSafeDate;

    const monthsSinceCompanyOps = hasStartedOps
      ? (currentYear - opsStartParsed.year) * 12 + (currentMonth - opsStartParsed.month)
      : 0;
    const companyOpsYear = Math.floor(monthsSinceCompanyOps / 12);
    const companyInflation = global.companyInflationRate ?? global.inflationRate;
    const fixedEscalationRate = global.fixedCostEscalationRate ?? companyInflation;
    const fixedCostFactor = Math.pow(1 + fixedEscalationRate, companyOpsYear);
    const variableCostFactor = Math.pow(1 + companyInflation, companyOpsYear);
    
    let totalPropertyRevenue = 0;
    let totalPropertyGOP = 0;
    let activePropertyCount = 0;
    
    for (let i = 0; i < properties.length; i++) {
      const pf = propertyFinancials[i];
      if (m < pf.length) {
        totalPropertyRevenue += pf[m].revenueTotal;
        totalPropertyGOP += pf[m].gop;
        if (pf[m].revenueTotal > 0) activePropertyCount++;
      }
    }
    
    // ── Fee aggregation ───────────────────────────────────────────────────────
    // base fee:      revenue × rate  (flat % of total revenue per property)
    // incentive fee: GOP × rate, floored at 0 — no negative incentive fees.
    // Both are summed across all active properties for the company's total revenue.
    // These amounts mirror the feeBase + feeIncentive expenses in each property SPV;
    // the intercompany eliminations zero out in consolidation.
    let baseFeeRevenue = 0;
    let incentiveFeeRevenue = 0;
    const incentiveFeeByPropertyId: Record<string, number> = {};
    const serviceFeeBreakdown: ServiceFeeBreakdown = {
      byCategory: {},
      byPropertyId: {},
      byCategoryByPropertyId: {},
    };
    for (let i = 0; i < properties.length; i++) {
      const pf = propertyFinancials[i];
      if (m < pf.length) {
        const propId = String(properties[i].id ?? i);
        const propIncentive = pf[m].feeIncentive;
        incentiveFeeRevenue += propIncentive;
        incentiveFeeByPropertyId[propId] = propIncentive;
        
        const catFees = pf[m].serviceFeesByCategory;
        const hasCategoryData = Object.keys(catFees).length > 0;
        if (hasCategoryData) {
          let propServiceTotal = 0;
          for (const [catName, catAmount] of Object.entries(catFees)) {
            serviceFeeBreakdown.byCategory[catName] = (serviceFeeBreakdown.byCategory[catName] || 0) + catAmount;
            if (!serviceFeeBreakdown.byCategoryByPropertyId[catName]) {
              serviceFeeBreakdown.byCategoryByPropertyId[catName] = {};
            }
            serviceFeeBreakdown.byCategoryByPropertyId[catName][propId] = catAmount;
            propServiceTotal += catAmount;
          }
          serviceFeeBreakdown.byPropertyId[propId] = propServiceTotal;
          baseFeeRevenue += propServiceTotal;
        } else {
          const propBaseFee = properties[i].baseManagementFeeRate ?? DEFAULT_BASE_MANAGEMENT_FEE_RATE;
          const propServiceFee = pf[m].revenueTotal * propBaseFee;
          baseFeeRevenue += propServiceFee;
          serviceFeeBreakdown.byPropertyId[propId] = propServiceFee;
          serviceFeeBreakdown.byCategory["Service Fee"] = (serviceFeeBreakdown.byCategory["Service Fee"] || 0) + propServiceFee;
          if (!serviceFeeBreakdown.byCategoryByPropertyId["Service Fee"]) {
            serviceFeeBreakdown.byCategoryByPropertyId["Service Fee"] = {};
          }
          serviceFeeBreakdown.byCategoryByPropertyId["Service Fee"][propId] = propServiceFee;
        }
      }
    }
    const totalRevenue = baseFeeRevenue + incentiveFeeRevenue;

    let costOfCentralizedServices: AggregatedServiceCosts | null = null;
    let totalVendorCost = 0;
    let grossProfit = totalRevenue;
    if (serviceTemplates && serviceTemplates.length > 0) {
      costOfCentralizedServices = computeCostOfServices(
        serviceFeeBreakdown.byCategory,
        serviceTemplates,
      );
      totalVendorCost = costOfCentralizedServices.totalVendorCost;
      grossProfit = totalRevenue - totalVendorCost;
    }

    let partnerCompensation = 0;
    let staffCompensation = 0;
    let officeLease = 0;
    let professionalServices = 0;
    let techInfrastructure = 0;
    let businessInsurance = 0;
    let travelCosts = 0;
    let itLicensing = 0;
    let marketing = 0;
    let miscOps = 0;
    
    if (hasStartedOps) {
      const modelYear = year + 1;
      const yearlyPartnerComp = [
        global.partnerCompYear1 ?? DEFAULT_PARTNER_COMP[0],
        global.partnerCompYear2 ?? DEFAULT_PARTNER_COMP[1],
        global.partnerCompYear3 ?? DEFAULT_PARTNER_COMP[2],
        global.partnerCompYear4 ?? DEFAULT_PARTNER_COMP[3],
        global.partnerCompYear5 ?? DEFAULT_PARTNER_COMP[4],
        global.partnerCompYear6 ?? DEFAULT_PARTNER_COMP[5],
        global.partnerCompYear7 ?? DEFAULT_PARTNER_COMP[6],
        global.partnerCompYear8 ?? DEFAULT_PARTNER_COMP[7],
        global.partnerCompYear9 ?? DEFAULT_PARTNER_COMP[8],
        global.partnerCompYear10 ?? DEFAULT_PARTNER_COMP[9],
      ];
      const yearIndex = Math.min(modelYear - 1, DEFAULT_PARTNER_COMP.length - 1);
      const totalPartnerCompForYear = yearlyPartnerComp[yearIndex];
      
      const staffSalary = (global.staffSalary ?? DEFAULT_STAFF_SALARY);
      const tier1Max = global.staffTier1MaxProperties ?? STAFFING_TIERS[0].maxProperties;
      const tier1Fte = global.staffTier1Fte ?? STAFFING_TIERS[0].fte;
      const tier2Max = global.staffTier2MaxProperties ?? STAFFING_TIERS[1].maxProperties;
      const tier2Fte = global.staffTier2Fte ?? STAFFING_TIERS[1].fte;
      const tier3Fte = global.staffTier3Fte ?? STAFFING_TIERS[2].fte;
      const staffFTE = activePropertyCount <= tier1Max ? tier1Fte
        : activePropertyCount <= tier2Max ? tier2Fte
        : tier3Fte;
      
      partnerCompensation = totalPartnerCompForYear / 12;
      staffCompensation = (staffFTE * staffSalary * fixedCostFactor) / 12;
      officeLease = ((global.officeLeaseStart ?? DEFAULT_OFFICE_LEASE) * fixedCostFactor) / 12;
      professionalServices = ((global.professionalServicesStart ?? DEFAULT_PROFESSIONAL_SERVICES) * fixedCostFactor) / 12;
      techInfrastructure = ((global.techInfraStart ?? DEFAULT_TECH_INFRA) * fixedCostFactor) / 12;
      businessInsurance = ((global.businessInsuranceStart ?? DEFAULT_BUSINESS_INSURANCE) * fixedCostFactor) / 12;
      
      travelCosts = (activePropertyCount * (global.travelCostPerClient ?? DEFAULT_TRAVEL_PER_CLIENT) * variableCostFactor) / 12;
      itLicensing = (activePropertyCount * (global.itLicensePerClient ?? DEFAULT_IT_LICENSE_PER_CLIENT) * variableCostFactor) / 12;
      marketing = totalRevenue * (global.marketingRate ?? DEFAULT_MARKETING_RATE);
      miscOps = totalRevenue * (global.miscOpsRate ?? DEFAULT_MISC_OPS_RATE);
    }
    
    const totalExpenses = partnerCompensation + staffCompensation + officeLease + professionalServices +
      techInfrastructure + businessInsurance + travelCosts + itLicensing + marketing + miscOps;

    const preTaxIncome = totalRevenue - totalVendorCost - totalExpenses;
    const companyTaxRate = global.companyTaxRate ?? DEFAULT_COMPANY_TAX_RATE;
    const companyIncomeTax = preTaxIncome > 0 ? preTaxIncome * companyTaxRate : 0;
    const netIncome = preTaxIncome - companyIncomeTax;
    
    let safeFunding1 = 0;
    let safeFunding2 = 0;
    if (currentYear === tranche1Parsed.year && currentMonth === tranche1Parsed.month) {
      safeFunding1 = global.safeTranche1Amount ?? DEFAULT_SAFE_TRANCHE;
    }
    if (tranche2Parsed && currentYear === tranche2Parsed.year && currentMonth === tranche2Parsed.month) {
      safeFunding2 = global.safeTranche2Amount ?? DEFAULT_SAFE_TRANCHE;
    }
    const safeFunding = safeFunding1 + safeFunding2;
    
    const cashFlow = netIncome + safeFunding;
    cumulativeCompanyCash += cashFlow;

    results.push({
      date: currentDate,
      monthIndex: m,
      year: year + 1,
      baseFeeRevenue,
      incentiveFeeRevenue,
      incentiveFeeByPropertyId,
      serviceFeeBreakdown,
      totalRevenue,
      costOfCentralizedServices,
      totalVendorCost,
      grossProfit,
      partnerCompensation,
      staffCompensation,
      officeLease,
      professionalServices,
      techInfrastructure,
      businessInsurance,
      travelCosts,
      itLicensing,
      marketing,
      miscOps,
      totalExpenses,
      preTaxIncome,
      companyIncomeTax,
      netIncome,
      safeFunding,
      safeFunding1,
      safeFunding2,
      cashFlow,
      endingCash: cumulativeCompanyCash,
      cashShortfall: cumulativeCompanyCash < 0,
    });
  }
  
  return results as CompanyMonthlyFinancials[];
}

/**
 * Analyze company cash position over the projection period.
 */
export function analyzeCompanyCashPosition(financials: CompanyMonthlyFinancials[]) {
  const shortfalls = financials.filter(f => f.cashShortfall);
  const minCash = Math.min(...financials.map(f => f.endingCash));
  const totalNetIncome = financials.reduce((sum, f) => sum + f.netIncome, 0);
  
  return {
    hasShortfall: shortfalls.length > 0,
    firstShortfallMonth: shortfalls.length > 0 ? shortfalls[0].monthIndex : null,
    minimumCashBalance: minCash,
    totalProjectedNetIncome: totalNetIncome,
  };
}
