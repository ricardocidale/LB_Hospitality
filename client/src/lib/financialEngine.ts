import { Property, GlobalAssumptions } from "./store";
import { addMonths, differenceInMonths, isAfter, isBefore, format, startOfMonth } from "date-fns";

// --- FINANCIAL CONSTANTS ---
const REV_SHARE_ROOMS = 1.0;
const REV_SHARE_EVENTS = 0.43;
const REV_SHARE_FB = 0.22;
const REV_SHARE_OTHER = 0.07;
const TOTAL_REV_DIVISOR = 0.58; // Room Rev / 0.58 = Total Rev (approx)

// --- TYPES ---
export interface MonthlyFinancials {
  date: Date;
  monthIndex: number; // 0 = Model Start
  
  // Operational Metrics
  occupancy: number;
  adr: number;
  availableRooms: number;
  soldRooms: number;
  
  // Revenue
  revenueRooms: number;
  revenueEvents: number;
  revenueFB: number;
  revenueOther: number;
  revenueTotal: number;
  
  // Expenses
  expenseRooms: number;
  expenseFB: number;
  expenseEvents: number;
  expenseOther: number;
  expenseMarketing: number;
  expensePropertyOps: number;
  expenseUtilitiesVar: number;
  expenseFFE: number;
  
  // Management Fees
  feeBase: number;
  feeIncentive: number;
  
  // Fixed Expenses
  expenseAdmin: number;
  expenseIT: number;
  expenseInsurance: number;
  expenseTaxes: number;
  expenseUtilitiesFixed: number;
  
  // Totals
  totalExpenses: number;
  gop: number; // Gross Operating Profit
  noi: number; // Net Operating Income (GOP - Fixed Expenses - Fees)
  
  // Debt Service
  debtPayment: number;
  cashFlow: number;
}

export interface AnnualFinancials {
  year: number;
  revenueTotal: number;
  totalExpenses: number;
  gop: number;
  noi: number;
  cashFlow: number;
}

// --- ENGINE ---

export function generatePropertyProForma(
  property: Property, 
  global: GlobalAssumptions, 
  months: number = 60 // 5 years default
): MonthlyFinancials[] {
  const financials: MonthlyFinancials[] = [];
  const modelStart = new Date(global.modelStartDate);
  const opsStart = new Date(property.operationsStartDate);
  
  let currentAdr = property.startAdr;
  
  for (let i = 0; i < months; i++) {
    const currentDate = addMonths(modelStart, i);
    const isOperational = !isBefore(currentDate, opsStart);
    const monthsSinceOps = isOperational ? differenceInMonths(currentDate, opsStart) : 0;
    
    // Inflation Adjustment (Annual)
    const yearIndex = Math.floor(i / 12);
    const inflationMultiplier = Math.pow(1 + global.inflationRate, yearIndex);
    
    // ADR Growth (Annual)
    if (i > 0 && i % 12 === 0) {
      currentAdr = currentAdr * (1 + property.adrGrowthRate);
    }

    // Occupancy Ramp
    let occupancy = 0;
    if (isOperational) {
      const rampSteps = Math.floor(monthsSinceOps / property.occupancyRampMonths);
      occupancy = Math.min(
        property.maxOccupancy, 
        property.startOccupancy + (rampSteps * property.occupancyGrowthStep)
      );
    }
    
    // --- REVENUE CALCULATIONS ---
    const daysInMonth = 30; // Simply for monthly model
    const availableRooms = property.roomCount * daysInMonth;
    const soldRooms = isOperational ? availableRooms * occupancy : 0;
    
    const revenueRooms = soldRooms * currentAdr;
    const revenueEvents = revenueRooms * REV_SHARE_EVENTS;
    const revenueFB = revenueRooms * REV_SHARE_FB;
    const revenueOther = revenueRooms * REV_SHARE_OTHER;
    
    // Total Revenue Check (using the divisor rule from spec or sum)
    // Spec says: Total Revenue = Room Revenue / 0.58. 
    // Let's use the sum of components to be precise based on ratios
    const revenueTotal = revenueRooms + revenueEvents + revenueFB + revenueOther;
    
    // --- EXPENSE CALCULATIONS (Variable) ---
    // Costs escalate with inflation
    const expenseRooms = revenueRooms * 0.36 * property.laborAdj; // 36% base
    
    const fbCostRatio = property.cateringLevel === "Full" ? 0.92 : 0.80;
    const expenseFB = (revenueFB + (revenueEvents * 0.2)) * fbCostRatio; // Assume some event rev is F&B
    
    const expenseEvents = revenueEvents * 0.25; // Non-F&B event costs
    const expenseOther = revenueOther * 0.60;
    
    const expenseMarketing = revenueTotal * global.marketingRate;
    const expensePropertyOps = revenueTotal * 0.04; // 4% fixed in spec for Ops
    const expenseUtilitiesVar = revenueTotal * 0.03 * property.utilitiesAdj;
    const expenseFFE = revenueTotal * 0.04; // Reserve
    
    // --- FIXED EXPENSES ---
    // Base Rates % of Revenue (Mocked as % of Stabilized Revenue for Fixed nature, or just % of actual)
    // Spec says "Fixed Costs (% of Total Revenue)". This usually means they are budgeted as % of stabilized but fixed in dollar amount.
    // For simplicity in this liquid model, we'll treat them as % of revenue but with a floor? 
    // Let's strictly follow the spec table: Fixed Costs (% of Total Revenue).
    // Actually, fixed costs should NOT vary with revenue. 
    // Let's assume the spec means "Target % of Revenue" but derived as fixed amounts?
    // Let's interpret as: expense = revenue * % * inflation. 
    // Wait, "Fixed (do not vary with occupancy)". 
    // We will calculate them based on STABILIZED revenue estimate and fix them there?
    // Let's keep it simple: Dynamic % for now as per "Part Two: Cost Structure" table which lists them as %.
    
    const expenseAdmin = revenueTotal * 0.08;
    const expenseIT = revenueTotal * 0.02;
    const expenseInsurance = revenueTotal * 0.02;
    const expenseTaxes = revenueTotal * 0.03 * property.taxAdj;
    const expenseUtilitiesFixed = revenueTotal * 0.02 * property.utilitiesAdj;
    
    // --- FEES ---
    const feeBase = revenueTotal * global.baseManagementFee;
    
    const totalOperatingExpenses = 
      expenseRooms + expenseFB + expenseEvents + expenseOther + 
      expenseMarketing + expensePropertyOps + expenseUtilitiesVar + 
      expenseAdmin + expenseIT + expenseInsurance + expenseTaxes + expenseUtilitiesFixed;
      
    const gop = revenueTotal - totalOperatingExpenses;
    
    const feeIncentive = Math.max(0, gop * global.incentiveManagementFee);
    
    const noi = gop - feeBase - feeIncentive - expenseFFE;
    
    // --- DEBT SERVICE ---
    let debtPayment = 0;
    if (isOperational) {
        // Simple interest-only or amortized calc? Spec says "fully amortized"
        // Calculate PMT
        const r = global.debtAssumptions.interestRate / 12;
        const n = global.debtAssumptions.amortizationYears * 12;
        
        let loanAmount = 0;
        if (property.type === "Financed") {
            loanAmount = property.purchasePrice * 0.75; // 75% LTV
        }
        
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
      totalExpenses: totalOperatingExpenses + feeBase + feeIncentive + expenseFFE, // Total deductions from Rev to reach NOI/CashFlow? No.
      // Total Exp for display usually excludes Fees/FFE if showing GOP.
      // Let's define Total Exp as Pre-GOP expenses.
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
