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
  type: string;
  cateringLevel: string;
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
  baseManagementFee: number;
  incentiveManagementFee: number;
  marketingRate: number;
  // Catering F&B boost factors
  fullCateringFBBoost?: number;
  fullCateringFBCost?: number;
  partialCateringFBBoost?: number;
  partialCateringFBCost?: number;
  debtAssumptions: {
    interestRate: number;
    amortizationYears: number;
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
  totalExpenses: number;
  gop: number;
  noi: number;
  debtPayment: number;
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
    
    const expenseRooms = revenueRooms * costRateRooms;
    
    // F&B costs: base F&B costs + catering-related costs
    // The additional F&B revenue from catering has higher cost ratios
    const fullCostRatio = global.fullCateringFBCost ?? 0.92;
    const partialCostRatio = global.partialCateringFBCost ?? 0.80;
    const baseFBCost = baseFB * costRateFB;
    const additionalFBRevenue = revenueFB - baseFB;
    // Weight the cost ratio by the catering mix
    const weightedCostRatio = fullCateringPct > 0 || partialCateringPct > 0
      ? (fullCostRatio * fullCateringPct + partialCostRatio * partialCateringPct) / (fullCateringPct + partialCateringPct || 1)
      : 0;
    const expenseFB = baseFBCost + (additionalFBRevenue * weightedCostRatio);
    
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
    
    const feeBase = revenueTotal * global.baseManagementFee;
    
    const totalOperatingExpenses = 
      expenseRooms + expenseFB + expenseEvents + expenseOther + 
      expenseMarketing + expensePropertyOps + expenseUtilitiesVar + 
      expenseAdmin + expenseIT + expenseInsurance + expenseTaxes + expenseUtilitiesFixed;
      
    const gop = revenueTotal - totalOperatingExpenses;
    const feeIncentive = Math.max(0, gop * global.incentiveManagementFee);
    const noi = gop - feeBase - feeIncentive - expenseFFE;
    
    let debtPayment = 0;
    if (isOperational && property.type === "Financed") {
      const r = global.debtAssumptions.interestRate / 12;
      const n = global.debtAssumptions.amortizationYears * 12;
      const loanAmount = property.purchasePrice * 0.75;
      if (loanAmount > 0) {
        debtPayment = (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      }
    }

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
      totalExpenses: totalOperatingExpenses + feeBase + feeIncentive + expenseFFE,
      gop,
      noi,
      debtPayment,
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
