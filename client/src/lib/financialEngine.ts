import { addMonths, differenceInMonths, isBefore } from "date-fns";

// Types that match our database schema
interface PropertyInput {
  operationsStartDate: string;
  roomCount: number;
  startAdr: number;
  adrGrowthRate: number;
  startOccupancy: number;
  maxOccupancy: number;
  occupancyRampMonths: number;
  occupancyGrowthStep: number;
  purchasePrice: number;
  buildingImprovements?: number;
  type: string;
  cateringLevel: string;
  // Financing
  acquisitionLTV?: number;
  // Operating Cost Rates (should sum to ~84% of revenue)
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
  // Catering mix (% of events using each catering level)
  fullCateringPercent: number;
  partialCateringPercent: number;
}

interface GlobalInput {
  modelStartDate: string;
  inflationRate: number;
  fixedCostEscalationRate?: number;
  baseManagementFee: number;
  incentiveManagementFee: number;
  marketingRate: number;
  // SAFE Funding
  safeTranche1Amount?: number;
  safeTranche1Date?: string;
  safeTranche2Amount?: number;
  safeTranche2Date?: string;
  // Management company cost parameters
  partnerSalary?: number;
  staffSalary?: number;
  officeLeaseStart?: number;
  professionalServicesStart?: number;
  techInfraStart?: number;
  businessInsuranceStart?: number;
  travelCostPerClient?: number;
  itLicensePerClient?: number;
  miscOpsRate?: number;
  // Catering F&B boost factors
  fullCateringFBBoost?: number;
  partialCateringFBBoost?: number;
  debtAssumptions: {
    interestRate: number;
    amortizationYears: number;
    acqLTV?: number;
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
  expenseAdmin: number;
  expenseIT: number;
  expenseInsurance: number;
  expenseTaxes: number;
  expenseUtilitiesFixed: number;
  expenseOtherCosts: number;
  totalExpenses: number;
  gop: number;
  noi: number;
  interestExpense: number;
  principalPayment: number;
  debtPayment: number;
  netIncome: number;
  cashFlow: number;
}

// Default revenue shares (now property-configurable)
const DEFAULT_REV_SHARE_EVENTS = 0.43;
const DEFAULT_REV_SHARE_FB = 0.22;
const DEFAULT_REV_SHARE_OTHER = 0.07;

export function generatePropertyProForma(
  property: PropertyInput, 
  global: GlobalInput, 
  months: number = 60
): MonthlyFinancials[] {
  const financials: MonthlyFinancials[] = [];
  const modelStart = new Date(global.modelStartDate);
  const opsStart = new Date(property.operationsStartDate);
  
  let currentAdr = property.startAdr;
  
  for (let i = 0; i < months; i++) {
    const currentDate = addMonths(modelStart, i);
    const isOperational = !isBefore(currentDate, opsStart);
    const monthsSinceOps = isOperational ? differenceInMonths(currentDate, opsStart) : 0;
    
    if (i > 0 && i % 12 === 0) {
      currentAdr = currentAdr * (1 + property.adrGrowthRate);
    }

    let occupancy = 0;
    if (isOperational) {
      const rampSteps = Math.floor(monthsSinceOps / property.occupancyRampMonths);
      occupancy = Math.min(
        property.maxOccupancy, 
        property.startOccupancy + (rampSteps * property.occupancyGrowthStep)
      );
    }
    
    const daysInMonth = 30;
    const availableRooms = property.roomCount * daysInMonth;
    const soldRooms = isOperational ? availableRooms * occupancy : 0;
    
    const revenueRooms = soldRooms * currentAdr;
    
    // Events revenue is independent (configurable per property)
    const revShareEvents = property.revShareEvents ?? DEFAULT_REV_SHARE_EVENTS;
    const revShareFB = property.revShareFB ?? DEFAULT_REV_SHARE_FB;
    const revShareOther = property.revShareOther ?? DEFAULT_REV_SHARE_OTHER;
    const revenueEvents = revenueRooms * revShareEvents;
    
    // F&B revenue gets boosted by catering at events
    // Formula: baseFB × (1 + fullBoost × fullCateringPct + partialBoost × partialCateringPct)
    const fullCateringPct = property.fullCateringPercent ?? 0.40;
    const partialCateringPct = property.partialCateringPercent ?? 0.30;
    const fullBoost = global.fullCateringFBBoost ?? 0.50;
    const partialBoost = global.partialCateringFBBoost ?? 0.25;
    const baseFB = revenueRooms * revShareFB;
    const cateringBoostMultiplier = 1 + (fullBoost * fullCateringPct) + (partialBoost * partialCateringPct);
    const revenueFB = baseFB * cateringBoostMultiplier;
    
    const revenueOther = revenueRooms * revShareOther;
    const revenueTotal = revenueRooms + revenueEvents + revenueFB + revenueOther;
    
    // Property-level cost rates
    const costRateRooms = property.costRateRooms ?? 0.36;
    const costRateFB = property.costRateFB ?? 0.15;
    const costRateAdmin = property.costRateAdmin ?? 0.08;
    const costRateMarketing = property.costRateMarketing ?? 0.05;
    const costRatePropertyOps = property.costRatePropertyOps ?? 0.04;
    const costRateUtilities = property.costRateUtilities ?? 0.05;
    const costRateInsurance = property.costRateInsurance ?? 0.02;
    const costRateTaxes = property.costRateTaxes ?? 0.03;
    const costRateIT = property.costRateIT ?? 0.02;
    const costRateFFE = property.costRateFFE ?? 0.04;
    const costRateOther = property.costRateOther ?? 0.05;
    
    const expenseRooms = revenueRooms * costRateRooms;
    
    // F&B costs: apply costRateFB to all F&B revenue (including catering boost)
    const expenseFB = revenueFB * costRateFB;
    
    // Event costs are separate from catering (events are independent)
    const expenseEvents = revenueEvents * 0.65;
    const expenseOther = revenueOther * 0.60;
    const expenseMarketing = revenueTotal * costRateMarketing;
    const expensePropertyOps = revenueTotal * costRatePropertyOps;
    const expenseUtilitiesVar = revenueTotal * (costRateUtilities * 0.6);
    const expenseFFE = revenueTotal * costRateFFE;
    
    const expenseAdmin = revenueTotal * costRateAdmin;
    const expenseIT = revenueTotal * costRateIT;
    const expenseInsurance = revenueTotal * costRateInsurance;
    const expenseTaxes = revenueTotal * costRateTaxes;
    const expenseUtilitiesFixed = revenueTotal * (costRateUtilities * 0.4);
    const expenseOtherCosts = revenueTotal * costRateOther;
    
    const feeBase = revenueTotal * global.baseManagementFee;
    
    const totalOperatingExpenses = 
      expenseRooms + expenseFB + expenseEvents + expenseOther + 
      expenseMarketing + expensePropertyOps + expenseUtilitiesVar + 
      expenseAdmin + expenseIT + expenseInsurance + expenseTaxes + expenseUtilitiesFixed + expenseOtherCosts;
      
    const gop = revenueTotal - totalOperatingExpenses;
    const feeIncentive = Math.max(0, gop * global.incentiveManagementFee);
    const noi = gop - feeBase - feeIncentive - expenseFFE;
    
    let debtPayment = 0;
    let interestExpense = 0;
    let principalPayment = 0;
    
    if (isOperational && property.type === "Financed") {
      const r = global.debtAssumptions.interestRate / 12;
      const n = global.debtAssumptions.amortizationYears * 12;
      const ltv = property.acquisitionLTV ?? global.debtAssumptions.acqLTV ?? 0.75;
      const loanAmount = (property.purchasePrice + (property.buildingImprovements ?? 0)) * ltv;
      
      if (loanAmount > 0 && r > 0) {
        const monthlyPayment = (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        debtPayment = monthlyPayment;
        
        // Calculate remaining balance at this month to get accurate interest/principal split
        let remainingBalance = loanAmount;
        for (let m = 0; m < monthsSinceOps && m < n; m++) {
          const monthInterest = remainingBalance * r;
          const monthPrincipal = monthlyPayment - monthInterest;
          remainingBalance -= monthPrincipal;
        }
        
        // Current month's interest and principal
        interestExpense = remainingBalance * r;
        principalPayment = monthlyPayment - interestExpense;
      }
    }

    const netIncome = noi - interestExpense;
    const cashFlow = noi - debtPayment;

    financials.push({
      date: currentDate,
      monthIndex: i,
      occupancy,
      adr: currentAdr,
      availableRooms,
      soldRooms,
      revenueRooms,
      revenueEvents,
      revenueFB,
      revenueOther,
      revenueTotal,
      expenseRooms,
      expenseFB,
      expenseEvents,
      expenseOther,
      expenseMarketing,
      expensePropertyOps,
      expenseUtilitiesVar,
      expenseFFE,
      feeBase,
      feeIncentive,
      expenseAdmin,
      expenseIT,
      expenseInsurance,
      expenseTaxes,
      expenseUtilitiesFixed,
      expenseOtherCosts,
      totalExpenses: totalOperatingExpenses + feeBase + feeIncentive + expenseFFE,
      gop,
      noi,
      interestExpense,
      principalPayment,
      debtPayment,
      netIncome,
      cashFlow
    });
  }
  
  return financials;
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(amount);
}

export interface CompanyMonthlyFinancials {
  date: Date;
  monthIndex: number;
  year: number;
  baseFeeRevenue: number;
  incentiveFeeRevenue: number;
  totalRevenue: number;
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
}

export function generateCompanyProForma(
  properties: PropertyInput[],
  global: GlobalInput,
  months: number = 120
): CompanyMonthlyFinancials[] {
  const results: CompanyMonthlyFinancials[] = [];
  const startDate = new Date(global.modelStartDate);
  
  const parseDateString = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return { year, month: month - 1, day };
  };
  const tranche1Parsed = global.safeTranche1Date ? parseDateString(global.safeTranche1Date) : parseDateString(global.modelStartDate);
  const tranche2Parsed = global.safeTranche2Date ? parseDateString(global.safeTranche2Date) : null;
  
  const propertyFinancials = properties.map(p => generatePropertyProForma(p, global, months));
  
  for (let m = 0; m < months; m++) {
    const currentDate = new Date(startDate);
    currentDate.setMonth(currentDate.getMonth() + m);
    const year = Math.floor(m / 12);
    const fixedEscalationRate = global.fixedCostEscalationRate ?? global.inflationRate;
    const fixedCostFactor = Math.pow(1 + fixedEscalationRate, year);
    const variableCostFactor = Math.pow(1 + global.inflationRate, year);
    
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
    
    const baseFeeRevenue = totalPropertyRevenue * global.baseManagementFee;
    const incentiveFeeRevenue = totalPropertyGOP * global.incentiveManagementFee;
    const totalRevenue = baseFeeRevenue + incentiveFeeRevenue;
    
    const partnerMonthlyStart = (global.partnerSalary ?? 240000) / 12;
    const partnerMonthlyMax = 30000;
    const partnerEscalationRate = global.inflationRate + 0.10;
    const partnerEscalatedMonthly = Math.min(
      partnerMonthlyStart * Math.pow(1 + partnerEscalationRate, year),
      partnerMonthlyMax
    );
    const staffSalary = (global.staffSalary ?? 75000);
    const staffFTE = activePropertyCount <= 3 ? 2.5 : activePropertyCount <= 6 ? 4.5 : 7.0;
    
    const partnerCompensation = 3 * partnerEscalatedMonthly;
    const staffCompensation = (staffFTE * staffSalary * fixedCostFactor) / 12;
    const officeLease = ((global.officeLeaseStart ?? 36000) * fixedCostFactor) / 12;
    const professionalServices = ((global.professionalServicesStart ?? 24000) * fixedCostFactor) / 12;
    const techInfrastructure = ((global.techInfraStart ?? 18000) * fixedCostFactor) / 12;
    const businessInsurance = ((global.businessInsuranceStart ?? 12000) * fixedCostFactor) / 12;
    
    const travelCosts = (activePropertyCount * (global.travelCostPerClient ?? 12000) * variableCostFactor) / 12;
    const itLicensing = (activePropertyCount * (global.itLicensePerClient ?? 3000) * variableCostFactor) / 12;
    const marketing = totalRevenue * (global.marketingRate ?? 0.05);
    const miscOps = totalRevenue * (global.miscOpsRate ?? 0.03);
    
    const totalExpenses = partnerCompensation + staffCompensation + officeLease + professionalServices +
      techInfrastructure + businessInsurance + travelCosts + itLicensing + marketing + miscOps;
    
    const netIncome = totalRevenue - totalExpenses;
    
    let safeFunding1 = 0;
    let safeFunding2 = 0;
    if (currentDate.getFullYear() === tranche1Parsed.year && 
        currentDate.getMonth() === tranche1Parsed.month) {
      safeFunding1 = global.safeTranche1Amount ?? 450000;
    }
    if (tranche2Parsed && 
        currentDate.getFullYear() === tranche2Parsed.year && 
        currentDate.getMonth() === tranche2Parsed.month) {
      safeFunding2 = global.safeTranche2Amount ?? 450000;
    }
    const safeFunding = safeFunding1 + safeFunding2;
    
    const cashFlow = netIncome + safeFunding;
    
    results.push({
      date: currentDate,
      monthIndex: m,
      year: year + 1,
      baseFeeRevenue,
      incentiveFeeRevenue,
      totalRevenue,
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
      netIncome,
      safeFunding,
      safeFunding1,
      safeFunding2,
      cashFlow,
    });
  }
  
  return results;
}
