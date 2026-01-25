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
  laborAdj: number;
  utilitiesAdj: number;
  taxAdj: number;
}

interface GlobalInput {
  modelStartDate: string;
  inflationRate: number;
  baseManagementFee: number;
  incentiveManagementFee: number;
  marketingRate: number;
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

const REV_SHARE_EVENTS = 0.43;
const REV_SHARE_FB = 0.22;
const REV_SHARE_OTHER = 0.07;

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
    const revenueEvents = revenueRooms * REV_SHARE_EVENTS;
    const revenueFB = revenueRooms * REV_SHARE_FB;
    const revenueOther = revenueRooms * REV_SHARE_OTHER;
    const revenueTotal = revenueRooms + revenueEvents + revenueFB + revenueOther;
    
    // Base rates from global settings
    const baseRoomsCostRate = global.baseRoomsCostRate ?? 0.36;
    const baseUtilitiesRate = global.baseUtilitiesRate ?? 0.05;
    const baseTaxRate = global.baseTaxRate ?? 0.03;
    const baseAdminRate = global.baseAdminRate ?? 0.08;
    const basePropertyOpsRate = global.basePropertyOpsRate ?? 0.04;
    const baseInsuranceRate = global.baseInsuranceRate ?? 0.02;
    const baseITRate = global.baseITRate ?? 0.02;
    const baseFFERate = global.baseFFERate ?? 0.04;
    
    // Property-specific adjustments (multipliers)
    const laborAdj = property.laborAdj ?? 1.0;
    const utilitiesAdj = property.utilitiesAdj ?? 1.0;
    const taxAdj = property.taxAdj ?? 1.0;
    
    const expenseRooms = revenueRooms * baseRoomsCostRate * laborAdj;
    const fbCostRatio = property.cateringLevel === "Full" ? 0.92 : 0.80;
    const expenseFB = (revenueFB + (revenueEvents * 0.2)) * fbCostRatio;
    const expenseEvents = revenueEvents * 0.25;
    const expenseOther = revenueOther * 0.60;
    const expenseMarketing = revenueTotal * global.marketingRate;
    const expensePropertyOps = revenueTotal * basePropertyOpsRate;
    const expenseUtilitiesVar = revenueTotal * (baseUtilitiesRate * 0.6) * utilitiesAdj;
    const expenseFFE = revenueTotal * baseFFERate;
    
    const expenseAdmin = revenueTotal * baseAdminRate;
    const expenseIT = revenueTotal * baseITRate;
    const expenseInsurance = revenueTotal * baseInsuranceRate;
    const expenseTaxes = revenueTotal * baseTaxRate * taxAdj;
    const expenseUtilitiesFixed = revenueTotal * (baseUtilitiesRate * 0.4) * utilitiesAdj;
    
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
