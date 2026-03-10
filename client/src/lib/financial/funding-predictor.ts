import type { CompanyMonthlyFinancials, GlobalInput, FundingAnalysis, FundingTranche, CashRunwayPoint } from './types';
import type { MarketRateResponse } from '@/lib/api/market-rates';
import { OPERATING_RESERVE_BUFFER, COMPANY_FUNDING_BUFFER } from '@/lib/constants';
import { DEFAULT_SAFE_VALUATION_CAP, DEFAULT_SAFE_DISCOUNT_RATE } from '@shared/constants';

interface FundingGlobalInput extends GlobalInput {
  propertyLabel?: string;
  companyName?: string;
  assetDescription?: string;
  fundingSourceLabel?: string;
  safeValuationCap?: number;
  safeDiscountRate?: number;
}

const EARLY_STAGE_DISCOUNT_PREMIUM = 0.05;
const EARLY_STAGE_CAP_DISCOUNT = 0.20;
const TRANCHE_BUFFER_MULTIPLIER = 1.15;

function getMarketRate(rates: MarketRateResponse[] | undefined, key: string): number | null {
  if (!rates) return null;
  const rate = rates.find(r => r.rateKey === key);
  return rate?.value ?? null;
}

function computeCashWithoutFunding(financials: CompanyMonthlyFinancials[]): number[] {
  let cash = 0;
  return financials.map(m => {
    cash += m.netIncome;
    return cash;
  });
}

function findBreakevenMonth(financials: CompanyMonthlyFinancials[]): number | null {
  let hasSeenExpenses = false;
  for (let i = 0; i < financials.length; i++) {
    if (financials[i].totalExpenses > 0) hasSeenExpenses = true;
    if (hasSeenExpenses && financials[i].netIncome > 0) {
      return i;
    }
  }
  return null;
}

function countActiveProperties(financials: CompanyMonthlyFinancials[], monthIndex: number): number {
  const m = financials[monthIndex];
  if (!m) return 0;
  const breakdown = m.serviceFeeBreakdown;
  if (!breakdown?.byPropertyId) return 0;
  return Object.values(breakdown.byPropertyId).filter(v => v > 0).length;
}

function buildInvestorThesis(global: FundingGlobalInput): string {
  const propertyLabel = global.propertyLabel || "Hotel";
  const companyName = global.companyName || "the management company";
  const assetDesc = global.assetDescription;

  let thesis = `${companyName} is building a scalable platform to acquire and operate ${propertyLabel.toLowerCase()} properties`;

  if (assetDesc && typeof assetDesc === 'string' && assetDesc.length > 50) {
    const lowerDesc = assetDesc.toLowerCase();
    const focuses: string[] = [];
    if (lowerDesc.includes('wellness') || lowerDesc.includes('retreat')) focuses.push('wellness retreats');
    if (lowerDesc.includes('corporate') || lowerDesc.includes('event')) focuses.push('corporate events');
    if (lowerDesc.includes('wedding') || lowerDesc.includes('celebration')) focuses.push('destination weddings');
    if (lowerDesc.includes('yoga') || lowerDesc.includes('meditation')) focuses.push('mindfulness programming');
    if (focuses.length > 0) {
      thesis += ` specializing in ${focuses.join(', ')}`;
    }
  }

  thesis += `. Each property is held in a separate SPV (Special Purpose Vehicle), isolating liability while the management company earns recurring fee revenue — both base management fees (a percentage of total property revenue) and incentive fees (a percentage of Gross Operating Profit).`;

  thesis += ` Early investors in ${companyName} are investing in the management platform itself, not individual properties. As the portfolio grows, fee revenue scales with each new property while corporate overhead grows at a slower rate — creating an operating leverage effect that drives the company toward profitability.`;

  thesis += ` The ${propertyLabel.toLowerCase()} asset class targets high-margin experiential hospitality, a segment with strong secular tailwinds in wellness tourism, corporate retreat demand, and the growing preference for authentic, boutique experiences over standardized hotel brands.`;

  return thesis;
}

function buildMarketContext(rates: MarketRateResponse[] | undefined): string {
  if (!rates || rates.length === 0) {
    return 'Market rate data is not yet available. Terms shown use default benchmarks. Refresh market rates in Admin > Research > Market Rates for live data.';
  }

  const fedFunds = getMarketRate(rates, 'fed_funds');
  const sofr = getMarketRate(rates, 'sofr');
  const treasury10y = getMarketRate(rates, 'treasury_10y');
  const lendingSpread = getMarketRate(rates, 'hotel_lending_spread');

  const parts: string[] = [];

  if (fedFunds !== null) parts.push(`Fed Funds rate at ${(fedFunds).toFixed(2)}%`);
  if (sofr !== null) parts.push(`SOFR at ${(sofr).toFixed(2)}%`);
  if (treasury10y !== null) parts.push(`10-Year Treasury at ${(treasury10y).toFixed(2)}%`);
  if (lendingSpread !== null) parts.push(`hotel lending spread at ${lendingSpread} bps over SOFR`);

  if (parts.length === 0) {
    return 'Market rate data is available but no key rates were found. Terms use default benchmarks.';
  }

  let context = `Current market environment: ${parts.join(', ')}.`;

  if (treasury10y !== null) {
    if (treasury10y > 4.5) {
      context += ' The elevated rate environment increases the cost of capital, making early-stage SAFE terms more investor-friendly (higher discounts, lower caps) to compensate for opportunity cost.';
    } else if (treasury10y < 3.0) {
      context += ' The low-rate environment reduces investor opportunity cost, supporting more founder-friendly terms (lower discounts, higher caps).';
    } else {
      context += ' The moderate rate environment supports balanced SAFE terms that reflect both investor risk and the management company\'s growth potential.';
    }
  }

  return context;
}

function buildNarrative(
  global: FundingGlobalInput,
  analysis: { totalRaiseNeeded: number; breakevenMonth: number | null; monthlyBurnRate: number; propertiesAtBreakeven: number; revenueAtBreakeven: number; tranches: FundingTranche[]; fundingGap: number; currentFunding: number },
): string {
  const propertyLabel = global.propertyLabel || "Hotel";
  const companyName = global.companyName || "The management company";
  const fundingLabel = global.fundingSourceLabel || "Funding Vehicle";

  let narrative = '';

  narrative += `${companyName} requires approximately $${(analysis.totalRaiseNeeded / 1000).toFixed(0)}K in total capital to reach profitability`;
  if (analysis.breakevenMonth !== null) {
    const years = Math.floor(analysis.breakevenMonth / 12);
    const months = analysis.breakevenMonth % 12;
    narrative += `, projected to occur in ${years > 0 ? `${years} year${years > 1 ? 's' : ''}` : ''}${years > 0 && months > 0 ? ' and ' : ''}${months > 0 ? `${months} month${months > 1 ? 's' : ''}` : ''} from model start`;
  } else {
    narrative += `. The company does not reach breakeven within the projection period — additional portfolio growth or expense optimization may be needed`;
  }
  narrative += '. ';

  if (analysis.propertiesAtBreakeven > 0) {
    narrative += `At breakeven, the portfolio is projected to include ${analysis.propertiesAtBreakeven} ${propertyLabel.toLowerCase()} propert${analysis.propertiesAtBreakeven === 1 ? 'y' : 'ies'} generating approximately $${(analysis.revenueAtBreakeven / 1000).toFixed(0)}K in annual fee revenue. `;
  }

  narrative += `The average monthly cash burn during the pre-profitability period is $${(analysis.monthlyBurnRate / 1000).toFixed(0)}K. `;

  narrative += `The recommended funding structure uses ${analysis.tranches.length} tranche${analysis.tranches.length !== 1 ? 's' : ''} via ${fundingLabel} notes. `;

  if (analysis.tranches.length >= 2) {
    narrative += `Splitting the raise into tranches allows the company to demonstrate progress — signing management agreements, onboarding properties, and generating initial fee revenue — before raising additional capital at improved terms. `;
  }

  if (analysis.fundingGap > 0) {
    narrative += `The current ${fundingLabel} configuration of $${(analysis.currentFunding / 1000).toFixed(0)}K leaves a funding gap of $${(analysis.fundingGap / 1000).toFixed(0)}K. Consider increasing the raise or reducing operating expenses in Company Assumptions. `;
  } else if (analysis.fundingGap < 0) {
    narrative += `The current ${fundingLabel} configuration of $${(analysis.currentFunding / 1000).toFixed(0)}K provides a surplus of $${(Math.abs(analysis.fundingGap) / 1000).toFixed(0)}K beyond the minimum needed, providing an additional operating cushion. `;
  }

  return narrative;
}

export function analyzeFundingNeeds(
  financials: CompanyMonthlyFinancials[],
  global: FundingGlobalInput,
  marketRates?: MarketRateResponse[],
): FundingAnalysis {
  if (!financials || financials.length === 0) {
    return {
      totalRaiseNeeded: 0,
      breakevenMonth: null,
      monthlyBurnRate: 0,
      peakCashDeficit: 0,
      currentFunding: 0,
      fundingGap: 0,
      tranches: [],
      investorThesis: buildInvestorThesis(global),
      marketContext: buildMarketContext(marketRates),
      narrativeSummary: '',
      cashRunway: [],
      monthsOfRunway: 0,
      revenueAtBreakeven: 0,
      propertiesAtBreakeven: 0,
    };
  }

  const cashWithoutFunding = computeCashWithoutFunding(financials);
  const peakCashDeficit = Math.min(0, ...cashWithoutFunding);
  const breakevenMonth = findBreakevenMonth(financials);

  const preBreakevenEnd = breakevenMonth ?? financials.length;
  const burnMonths = financials.slice(0, preBreakevenEnd).filter(m => m.netIncome < 0);
  const monthlyBurnRate = burnMonths.length > 0
    ? Math.abs(burnMonths.reduce((sum, m) => sum + m.netIncome, 0)) / burnMonths.length
    : 0;

  const totalRaiseRaw = Math.abs(peakCashDeficit) + OPERATING_RESERVE_BUFFER + COMPANY_FUNDING_BUFFER;
  const totalRaiseNeeded = Math.ceil(totalRaiseRaw / 50000) * 50000;

  const currentFunding = (global.safeTranche1Amount ?? 0) + (global.safeTranche2Amount ?? 0);
  const fundingGap = totalRaiseNeeded - currentFunding;

  const revenueAtBreakeven = breakevenMonth !== null
    ? financials.slice(Math.max(0, breakevenMonth - 11), breakevenMonth + 1).reduce((s, m) => s + m.totalRevenue, 0)
    : 0;
  const propertiesAtBreakeven = breakevenMonth !== null
    ? countActiveProperties(financials, breakevenMonth)
    : 0;

  const treasury10y = getMarketRate(marketRates, 'treasury_10y');
  const riskFreeRate = treasury10y !== null ? treasury10y / 100 : 0.04;

  const tranches = buildTranches(financials, totalRaiseNeeded, breakevenMonth, global, riskFreeRate, cashWithoutFunding);

  let cashWithFundingRunning = 0;
  let cumulativeRevenue = 0;
  const cashRunway: CashRunwayPoint[] = financials.map((m, i) => {
    const trancheFunding = tranches
      .filter(t => t.month === i)
      .reduce((s, t) => s + t.amount, 0);
    cashWithFundingRunning += m.netIncome + trancheFunding;
    cumulativeRevenue += m.totalRevenue;
    return {
      month: i,
      date: m.date,
      cashWithFunding: cashWithFundingRunning,
      cashWithoutFunding: cashWithoutFunding[i],
      netIncome: m.netIncome,
      cumulativeRevenue,
    };
  });

  const firstNegativeIdx = cashRunway.findIndex(p => p.cashWithFunding <= 0);
  const monthsOfRunway = firstNegativeIdx === -1 ? cashRunway.length : firstNegativeIdx;

  const analysisData = {
    totalRaiseNeeded, breakevenMonth, monthlyBurnRate, propertiesAtBreakeven,
    revenueAtBreakeven, tranches, fundingGap, currentFunding,
  };

  return {
    totalRaiseNeeded,
    breakevenMonth,
    monthlyBurnRate,
    peakCashDeficit,
    currentFunding,
    fundingGap,
    tranches,
    investorThesis: buildInvestorThesis(global),
    marketContext: buildMarketContext(marketRates),
    narrativeSummary: buildNarrative(global, analysisData),
    cashRunway,
    monthsOfRunway,
    revenueAtBreakeven,
    propertiesAtBreakeven,
  };
}

function buildTranches(
  financials: CompanyMonthlyFinancials[],
  totalRaise: number,
  breakevenMonth: number | null,
  global: FundingGlobalInput,
  riskFreeRate: number,
  cashWithoutFunding: number[],
): FundingTranche[] {
  const fundingLabel = global.fundingSourceLabel || "Funding Vehicle";
  const propertyLabel = global.propertyLabel || "Hotel";

  if (totalRaise <= 0) return [];

  const operationsStartIdx = financials.findIndex(m => m.totalExpenses > 0);
  if (operationsStartIdx < 0) return [];

  const endIdx = breakevenMonth ?? Math.min(financials.length - 1, operationsStartIdx + 60);
  const periodLength = endIdx - operationsStartIdx;

  const baseValuationCap = global.safeValuationCap ?? DEFAULT_SAFE_VALUATION_CAP;
  const baseDiscount = global.safeDiscountRate ?? DEFAULT_SAFE_DISCOUNT_RATE;

  if (periodLength <= 18 || totalRaise <= 400000) {
    const tranche1Amount = Math.ceil(totalRaise / 50000) * 50000;
    return [{
      index: 1,
      amount: tranche1Amount,
      month: operationsStartIdx,
      date: financials[operationsStartIdx].date,
      valuationCap: Math.round(baseValuationCap * (1 - EARLY_STAGE_CAP_DISCOUNT)),
      discountRate: Math.min(0.30, baseDiscount + EARLY_STAGE_DISCOUNT_PREMIUM + riskFreeRate * 0.1),
      rationale: `Single tranche at company launch to fund operations until the ${propertyLabel.toLowerCase()} portfolio generates sufficient fee revenue to cover corporate overhead. Pre-revenue ${fundingLabel} investment carries the highest risk, reflected in the valuation cap and discount rate.`,
    }];
  }

  const midpoint = operationsStartIdx + Math.floor(periodLength * 0.45);
  const lowestCashToMid = Math.min(...cashWithoutFunding.slice(operationsStartIdx, midpoint + 1));
  const tranche1Raw = Math.abs(lowestCashToMid) * TRANCHE_BUFFER_MULTIPLIER + OPERATING_RESERVE_BUFFER;
  const tranche1Amount = Math.ceil(Math.min(tranche1Raw, totalRaise * 0.65) / 50000) * 50000;
  const tranche2Amount = Math.max(0, totalRaise - tranche1Amount);

  const activeAtMid = countActiveProperties(financials, midpoint);
  const revenueAtMid = financials.slice(Math.max(0, midpoint - 11), midpoint + 1).reduce((s, m) => s + m.totalRevenue, 0);

  const tranches: FundingTranche[] = [
    {
      index: 1,
      amount: tranche1Amount,
      month: operationsStartIdx,
      date: financials[operationsStartIdx].date,
      valuationCap: Math.round(baseValuationCap * (1 - EARLY_STAGE_CAP_DISCOUNT)),
      discountRate: Math.min(0.30, baseDiscount + EARLY_STAGE_DISCOUNT_PREMIUM + riskFreeRate * 0.1),
      rationale: `Initial ${fundingLabel} to fund the first ${Math.ceil(periodLength * 0.45 / 12)} months of operations while the ${propertyLabel.toLowerCase()} portfolio is assembled. This pre-revenue capital covers partner compensation, staffing, and fixed overhead. Investor risk is highest at this stage — the management company has no fee revenue yet — reflected in a lower valuation cap and higher discount.`,
    },
    {
      index: 2,
      amount: tranche2Amount,
      month: midpoint,
      date: financials[midpoint].date,
      valuationCap: baseValuationCap,
      discountRate: baseDiscount,
      rationale: `Second ${fundingLabel} tranche to bridge operations to profitability.${activeAtMid > 0 ? ` By this point the portfolio is projected to include ${activeAtMid} propert${activeAtMid === 1 ? 'y' : 'ies'} generating ~$${(revenueAtMid / 1000).toFixed(0)}K in annual fee revenue.` : ''} Revenue traction de-risks the investment, supporting a higher valuation cap and lower discount compared to Tranche 1.`,
    },
  ];

  if (periodLength > 48 && tranche2Amount > 500000) {
    const thirdPoint = operationsStartIdx + Math.floor(periodLength * 0.75);
    const realloc2 = Math.ceil(tranche2Amount * 0.55 / 50000) * 50000;
    const realloc3 = Math.max(0, totalRaise - tranche1Amount - realloc2);
    const activeAtThird = countActiveProperties(financials, thirdPoint);

    tranches[1].amount = realloc2;
    tranches.push({
      index: 3,
      amount: realloc3,
      month: thirdPoint,
      date: financials[thirdPoint].date,
      valuationCap: Math.round(baseValuationCap * 1.20),
      discountRate: Math.max(0.10, baseDiscount - EARLY_STAGE_DISCOUNT_PREMIUM),
      rationale: `Final ${fundingLabel} tranche in the later growth phase.${activeAtThird > 0 ? ` The portfolio now includes ${activeAtThird} propert${activeAtThird === 1 ? 'y' : 'ies'} with established revenue history.` : ''} With proven fee revenue and operational track record, this tranche carries the lowest risk, reflected in the most favorable investor terms (highest cap, lowest discount).`,
    });
  }

  return tranches;
}
