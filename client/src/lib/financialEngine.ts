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
    
    const expenseRooms = revenueRooms * 0.36 * property.laborAdj;
    const fbCostRatio = property.cateringLevel === "Full" ? 0.92 : 0.80;
    const expenseFB = (revenueFB + (revenueEvents * 0.2)) * fbCostRatio;
    const expenseEvents = revenueEvents * 0.25;
    const expenseOther = revenueOther * 0.60;
    const expenseMarketing = revenueTotal * global.marketingRate;
    const expensePropertyOps = revenueTotal * 0.04;
    const expenseUtilitiesVar = revenueTotal * 0.03 * property.utilitiesAdj;
    const expenseFFE = revenueTotal * 0.04;
    
    const expenseAdmin = revenueTotal * 0.08;
    const expenseIT = revenueTotal * 0.02;
    const expenseInsurance = revenueTotal * 0.02;
    const expenseTaxes = revenueTotal * 0.03 * property.taxAdj;
    const expenseUtilitiesFixed = revenueTotal * 0.02 * property.utilitiesAdj;
    
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
