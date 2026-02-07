import { useState } from "react";
import { MonthlyFinancials, formatMoney } from "@/lib/financialEngine";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Money } from "@/components/Money";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { AlertTriangle, CheckCircle, ChevronDown, ChevronRight } from "lucide-react";
import {
  LoanParams,
  GlobalLoanParams,
  calculateLoanParams,
  getAcquisitionYear,
  YearlyCashFlowResult,
  DEFAULT_COMMISSION_RATE
} from "@/lib/loanCalculations";
import { OPERATING_RESERVE_BUFFER, RESERVE_ROUNDING_INCREMENT } from "@/lib/constants";

interface YearlyDetails {
  soldRooms: number;
  availableRooms: number;
  revenueRooms: number;
  revenueEvents: number;
  revenueFB: number;
  revenueOther: number;
  totalRevenue: number;
  expenseRooms: number;
  expenseFB: number;
  expenseEvents: number;
  expenseMarketing: number;
  expensePropertyOps: number;
  expenseUtilitiesVar: number;
  expenseUtilitiesFixed: number;
  expenseFFE: number;
  expenseAdmin: number;
  expenseIT: number;
  expenseInsurance: number;
  expenseTaxes: number;
  expenseOther: number;
  feeBase: number;
  feeIncentive: number;
  totalExpenses: number;
  gop: number;
  interestExpense: number;
  incomeTax: number;
}

function aggregateYearlyDetails(data: MonthlyFinancials[], years: number): YearlyDetails[] {
  const result: YearlyDetails[] = [];
  for (let y = 0; y < years; y++) {
    const yearData = data.slice(y * 12, (y + 1) * 12);
    result.push({
      soldRooms: yearData.reduce((a, m) => a + m.soldRooms, 0),
      availableRooms: yearData.reduce((a, m) => a + m.availableRooms, 0),
      revenueRooms: yearData.reduce((a, m) => a + m.revenueRooms, 0),
      revenueEvents: yearData.reduce((a, m) => a + m.revenueEvents, 0),
      revenueFB: yearData.reduce((a, m) => a + m.revenueFB, 0),
      revenueOther: yearData.reduce((a, m) => a + m.revenueOther, 0),
      totalRevenue: yearData.reduce((a, m) => a + m.revenueTotal, 0),
      expenseRooms: yearData.reduce((a, m) => a + m.expenseRooms, 0),
      expenseFB: yearData.reduce((a, m) => a + m.expenseFB, 0),
      expenseEvents: yearData.reduce((a, m) => a + m.expenseEvents, 0),
      expenseMarketing: yearData.reduce((a, m) => a + m.expenseMarketing, 0),
      expensePropertyOps: yearData.reduce((a, m) => a + m.expensePropertyOps, 0),
      expenseUtilitiesVar: yearData.reduce((a, m) => a + m.expenseUtilitiesVar, 0),
      expenseUtilitiesFixed: yearData.reduce((a, m) => a + m.expenseUtilitiesFixed, 0),
      expenseFFE: yearData.reduce((a, m) => a + m.expenseFFE, 0),
      expenseAdmin: yearData.reduce((a, m) => a + m.expenseAdmin, 0),
      expenseIT: yearData.reduce((a, m) => a + m.expenseIT, 0),
      expenseInsurance: yearData.reduce((a, m) => a + m.expenseInsurance, 0),
      expenseTaxes: yearData.reduce((a, m) => a + m.expenseTaxes, 0),
      expenseOther: yearData.reduce((a, m) => a + m.expenseOtherCosts, 0),
      feeBase: yearData.reduce((a, m) => a + m.feeBase, 0),
      feeIncentive: yearData.reduce((a, m) => a + m.feeIncentive, 0),
      totalExpenses: yearData.reduce((a, m) => a + m.totalExpenses, 0),
      gop: yearData.reduce((a, m) => a + m.gop, 0),
      interestExpense: yearData.reduce((a, m) => a + m.interestExpense, 0),
      incomeTax: yearData.reduce((a, m) => a + m.incomeTax, 0),
    });
  }
  return result;
}

interface CashPositionAnalysis {
  operatingReserve: number;
  minCashPosition: number;
  minCashMonth: number | null;
  shortfall: number;
  isAdequate: boolean;
  suggestedReserve: number;
}

function analyzeMonthlyCashPosition(
  data: MonthlyFinancials[],
  operatingReserve: number
): CashPositionAnalysis {
  if (!data || data.length === 0) {
    return {
      operatingReserve,
      minCashPosition: operatingReserve,
      minCashMonth: null,
      shortfall: 0,
      isAdequate: true,
      suggestedReserve: operatingReserve
    };
  }
  
  let cashPosition = operatingReserve;
  let minCashPosition = operatingReserve;
  let minCashMonth: number | null = null;
  let hasActivity = false;
  
  for (let i = 0; i < data.length; i++) {
    const month = data[i];
    if (month.cashFlow === 0 && month.revenueTotal === 0 && month.debtPayment === 0) {
      continue;
    }
    hasActivity = true;
    cashPosition += month.cashFlow;
    
    if (cashPosition < minCashPosition) {
      minCashPosition = cashPosition;
      minCashMonth = i + 1;
    }
  }
  
  if (!hasActivity) {
    return {
      operatingReserve,
      minCashPosition: operatingReserve,
      minCashMonth: null,
      shortfall: 0,
      isAdequate: true,
      suggestedReserve: operatingReserve
    };
  }
  
  const shortfall = minCashPosition < 0 ? Math.abs(minCashPosition) : 0;
  const isAdequate = minCashPosition >= 0;
  const suggestedReserve = isAdequate ? operatingReserve : operatingReserve + shortfall + OPERATING_RESERVE_BUFFER;
  
  return {
    operatingReserve,
    minCashPosition,
    minCashMonth,
    shortfall,
    isAdequate,
    suggestedReserve: Math.ceil(suggestedReserve / RESERVE_ROUNDING_INCREMENT) * RESERVE_ROUNDING_INCREMENT
  };
}

interface Props {
  data: MonthlyFinancials[];
  property: LoanParams;
  global?: GlobalLoanParams;
  years?: number;
  startYear?: number;
  defaultLTV?: number;
}

// F-4 fix: Aggregate cash flow data directly from monthly engine instead of recalculating
// via loanCalculations.ts. This ensures IS, CF, and BS all use the same debt path (including refinance).
function aggregateCashFlowByYear(
  data: MonthlyFinancials[],
  property: LoanParams,
  global: GlobalLoanParams | undefined,
  years: number
): YearlyCashFlowResult[] {
  const loan = calculateLoanParams(property, global);
  const acquisitionYear = getAcquisitionYear(loan);
  const results: YearlyCashFlowResult[] = [];
  let cumulative = 0;

  for (let y = 0; y < years; y++) {
    const yearData = data.slice(y * 12, (y + 1) * 12);
    const noi = yearData.reduce((a, m) => a + m.noi, 0);
    const interestExpense = yearData.reduce((a, m) => a + m.interestExpense, 0);
    const principalPayment = yearData.reduce((a, m) => a + m.principalPayment, 0);
    const debtService = yearData.reduce((a, m) => a + m.debtPayment, 0);
    const depreciationExpense = yearData.reduce((a, m) => a + m.depreciationExpense, 0);
    const taxLiability = yearData.reduce((a, m) => a + m.incomeTax, 0);
    const netIncome = yearData.reduce((a, m) => a + m.netIncome, 0);
    const refiProceeds = yearData.reduce((a, m) => a + m.refinancingProceeds, 0);
    const expenseFFE = yearData.reduce((a, m) => a + m.expenseFFE, 0);

    const operatingCashFlow = netIncome + depreciationExpense;
    const workingCapitalChange = 0;
    const cashFromOperations = operatingCashFlow + workingCapitalChange;
    const freeCashFlow = cashFromOperations - expenseFFE;
    const freeCashFlowToEquity = freeCashFlow - principalPayment;
    const btcf = noi - debtService;
    const taxableIncome = noi - interestExpense - depreciationExpense;
    const atcf = btcf - taxLiability;

    // Capital events (exit only in final year)
    const exitCapRate = property.exitCapRate ?? global?.exitCapRate ?? 0.085;
    const commissionRate = global?.commissionRate ?? global?.salesCommissionRate ?? DEFAULT_COMMISSION_RATE;
    const isLastYear = y === years - 1;
    const lastYearNOI = noi;
    let exitValue = 0;
    if (isLastYear && exitCapRate > 0) {
      const grossValue = lastYearNOI / exitCapRate;
      const commission = grossValue * commissionRate;
      const outstandingDebt = yearData.length > 0 ? yearData[yearData.length - 1].debtOutstanding : 0;
      exitValue = grossValue - commission - outstandingDebt;
    }

    const capitalExpenditures = y === acquisitionYear ? loan.equityInvested : 0;
    const netCashFlowToInvestors = atcf + refiProceeds + (isLastYear ? exitValue : 0) - (y === acquisitionYear ? loan.equityInvested : 0);
    cumulative += netCashFlowToInvestors;

    results.push({
      year: y,
      noi,
      interestExpense,
      depreciation: depreciationExpense,
      netIncome,
      taxLiability,
      operatingCashFlow,
      workingCapitalChange,
      cashFromOperations,
      maintenanceCapex: expenseFFE,
      freeCashFlow,
      principalPayment,
      debtService,
      freeCashFlowToEquity,
      btcf,
      taxableIncome,
      atcf,
      capitalExpenditures,
      refinancingProceeds: refiProceeds,
      exitValue,
      netCashFlowToInvestors,
      cumulativeCashFlow: cumulative,
    });
  }

  return results;
}

const ICE_BLUE = "#E8F4FD";
const ICE_BLUE_DARK = "#D0EAFB";
const SECTION_HEADER_BG = `bg-[${ICE_BLUE}]`;

function SectionHeader({ label, colSpan, tooltip }: { label: string; colSpan: number; tooltip?: string }) {
  return (
    <TableRow style={{ backgroundColor: ICE_BLUE }}>
      <TableCell colSpan={colSpan} className="font-bold text-gray-800 py-2">
        <span className="flex items-center gap-1.5">
          {label}
          {tooltip && <HelpTooltip text={tooltip} />}
        </span>
      </TableCell>
    </TableRow>
  );
}

function SubtotalRow({ label, values, tooltip, positive }: { label: string; values: number[]; tooltip?: string; positive?: boolean }) {
  return (
    <TableRow style={{ backgroundColor: ICE_BLUE_DARK }} className="font-semibold">
      <TableCell className="sticky left-0 py-1.5" style={{ backgroundColor: ICE_BLUE_DARK }}>
        <span className="flex items-center gap-1">
          {label}
          {tooltip && <HelpTooltip text={tooltip} />}
        </span>
      </TableCell>
      {values.map((v, i) => (
        <TableCell key={i} className={cn("text-right py-1.5", v < 0 ? "text-destructive" : positive ? "text-accent" : "")}>
          <Money amount={v} />
        </TableCell>
      ))}
    </TableRow>
  );
}

function LineItem({ label, values, indent, tooltip, showZero, negate }: { 
  label: string; values: number[]; indent?: boolean; tooltip?: string; showZero?: boolean; negate?: boolean 
}) {
  return (
    <TableRow>
      <TableCell className={cn("sticky left-0 bg-white py-1", indent ? "pl-10" : "pl-6")}>
        <span className="flex items-center gap-1">
          {label}
          {tooltip && <HelpTooltip text={tooltip} />}
        </span>
      </TableCell>
      {values.map((v, i) => {
        const displayVal = negate ? -v : v;
        return (
          <TableCell key={i} className="text-right text-muted-foreground py-1">
            {v === 0 && !showZero ? '-' : <Money amount={displayVal} />}
          </TableCell>
        );
      })}
    </TableRow>
  );
}

function ExpandableLineItem({ label, values, tooltip, children, expanded, onToggle, negate }: { 
  label: string; values: number[]; tooltip?: string; children: React.ReactNode; expanded: boolean; onToggle: () => void; negate?: boolean 
}) {
  return (
    <>
      <TableRow 
        className="cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <TableCell className="pl-6 sticky left-0 bg-white py-1">
          <span className="flex items-center gap-1">
            {expanded ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
            <span className="ml-1">{label}</span>
            {tooltip && <HelpTooltip text={tooltip} />}
          </span>
        </TableCell>
        {values.map((v, i) => {
          const displayVal = negate ? -v : v;
          return (
            <TableCell key={i} className="text-right font-medium py-1">
              <Money amount={displayVal} />
            </TableCell>
          );
        })}
      </TableRow>
      {expanded && children}
    </>
  );
}

function SpacerRow({ colSpan }: { colSpan: number }) {
  return <TableRow className="h-2 border-none"><TableCell colSpan={colSpan}></TableCell></TableRow>;
}

export function YearlyCashFlowStatement({ data, property, global, years = 10, startYear = 2026 }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  
  const yearlyData = aggregateCashFlowByYear(data, property, global, years);
  const yearlyDetails = aggregateYearlyDetails(data, years);

  const loan = calculateLoanParams(property, global);
  const equityInvested = loan.equityInvested;
  const acquisitionYear = getAcquisitionYear(loan);

  const operatingReserve = property.operatingReserve || 0;
  const cashAnalysis = analyzeMonthlyCashPosition(data, operatingReserve);
  
  const toggleSection = (section: string) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  const colSpan = years + 1;
  
  const totalPropertyCost = property.purchasePrice + (property.buildingImprovements ?? 0) + property.preOpeningCosts;
  
  const cashFromOperations = yearlyDetails.map((yd, i) => {
    return yd.totalRevenue - (yd.totalExpenses - yd.expenseFFE) - yd.interestExpense - yd.incomeTax;
  });
  
  const cashFromInvesting = yearlyData.map((cf, i) => {
    const ffe = yearlyDetails[i].expenseFFE;
    const acqCost = i === acquisitionYear ? totalPropertyCost : 0;
    const exitVal = cf.exitValue;
    return -acqCost - ffe + exitVal;
  });
  
  const cashFromFinancing = yearlyData.map((cf, i) => {
    const eqContrib = i === acquisitionYear ? equityInvested : 0;
    const loanProceeds = i === acquisitionYear && loan.loanAmount > 0 ? loan.loanAmount : 0;
    return eqContrib + loanProceeds - cf.principalPayment + cf.refinancingProceeds;
  });
  
  const netChangeCash = cashFromOperations.map((cfo, i) => cfo + cashFromInvesting[i] + cashFromFinancing[i]);
  
  const openingCash: number[] = [];
  const closingCash: number[] = [];
  let runningCash = 0;
  for (let i = 0; i < years; i++) {
    openingCash.push(runningCash);
    runningCash += netChangeCash[i];
    closingCash.push(runningCash);
  }
  
  return (
    <Card className="overflow-hidden bg-white shadow-lg border border-gray-100">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          Cash Flow Statement
          <HelpTooltip text="Direct-method cash flow statement showing actual cash receipts and payments organized by Operating, Investing, and Financing activities. Includes beginning/ending cash balance tie-out." />
        </CardTitle>
        <p className="text-sm text-gray-500">Operating, investing, and financing cash flows with balance tie-out</p>
        
        {!cashAnalysis.isAdequate ? (
          <div data-testid="banner-equity-warning" className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p data-testid="text-equity-warning-title" className="font-semibold text-destructive">Additional Equity Investment Required</p>
              <p className="text-muted-foreground mt-1">
                The current Operating Reserve of <span data-testid="text-current-reserve">{formatMoney(operatingReserve)}</span> is insufficient. 
                Monthly cash position drops to <span data-testid="text-min-cash-position">{formatMoney(cashAnalysis.minCashPosition)}</span>
                {cashAnalysis.minCashMonth !== null && <> in month <span data-testid="text-min-cash-month">{cashAnalysis.minCashMonth}</span></>}.
              </p>
              <p className="text-muted-foreground mt-1">
                <span className="font-medium">Suggested:</span> Increase Operating Reserve to at least{' '}
                <span data-testid="text-suggested-reserve" className="font-semibold text-foreground">{formatMoney(cashAnalysis.suggestedReserve)}</span> in{' '}
                <span className="font-medium text-primary">Property Assumptions &rarr; Capital & Acquisition</span>.
              </p>
            </div>
          </div>
        ) : (
          <div data-testid="banner-cash-adequate" className="mt-3 p-3 bg-accent/10 border border-accent/30 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p data-testid="text-cash-adequate-title" className="font-semibold text-accent">Cash Position Adequate</p>
              <p className="text-muted-foreground mt-1">
                The Operating Reserve of <span data-testid="text-current-reserve">{formatMoney(operatingReserve)}</span> covers all costs during ramp-up.
                {cashAnalysis.minCashMonth !== null && (
                  <> Minimum cash position: <span data-testid="text-min-cash-position">{formatMoney(cashAnalysis.minCashPosition)}</span> (month <span data-testid="text-min-cash-month">{cashAnalysis.minCashMonth}</span>).</>
                )}
              </p>
            </div>
          </div>
        )}
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="w-[280px] font-bold sticky left-0 bg-gray-100 text-gray-900">Cash Flow Statement</TableHead>
              {yearlyData.map((y) => (
                <TableHead key={y.year} className="text-right min-w-[110px] font-bold text-gray-900">
                  FY {startYear + y.year}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* ═══ OPERATING CASH FLOW ═══ */}
            <SectionHeader 
              label="Operating Cash Flow" 
              colSpan={colSpan}
              tooltip="Cash generated from day-to-day property operations. Shows actual cash received from guests and paid to vendors/staff."
            />
            
            {/* Cash Received - Revenue (expandable) */}
            <ExpandableLineItem
              label="Cash Received from Guests & Clients"
              values={yearlyDetails.map(y => y.totalRevenue)}
              tooltip="Click to expand: Room revenue, event & venue income, food & beverage, and other revenue streams."
              expanded={!!expanded.revenue}
              onToggle={() => toggleSection('revenue')}
            >
              <LineItem label="ADR" values={yearlyDetails.map(y => y.soldRooms > 0 ? y.revenueRooms / y.soldRooms : 0)} indent />
              <TableRow>
                <TableCell className="pl-10 sticky left-0 bg-white py-1 text-muted-foreground">Occupancy</TableCell>
                {yearlyDetails.map((y, i) => (
                  <TableCell key={i} className="text-right text-muted-foreground py-1 font-mono">
                    {y.availableRooms > 0 ? ((y.soldRooms / y.availableRooms) * 100).toFixed(1) : 0}%
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="pl-10 sticky left-0 bg-white py-1 text-muted-foreground">RevPAR</TableCell>
                {yearlyDetails.map((y, i) => (
                  <TableCell key={i} className="text-right text-muted-foreground py-1 font-mono">
                    <Money amount={y.availableRooms > 0 ? y.revenueRooms / y.availableRooms : 0} />
                  </TableCell>
                ))}
              </TableRow>
              <LineItem label="Guest Room Revenue" values={yearlyDetails.map(y => y.revenueRooms)} indent />
              <LineItem label="Event & Venue Revenue" values={yearlyDetails.map(y => y.revenueEvents)} indent />
              <LineItem label="Food & Beverage Revenue" values={yearlyDetails.map(y => y.revenueFB)} indent />
              <LineItem label="Other Revenue (Spa/Experiences)" values={yearlyDetails.map(y => y.revenueOther)} indent />
            </ExpandableLineItem>
            
            {/* Cash Paid - Operating Expenses (expandable) */}
            <ExpandableLineItem
              label="Cash Paid for Operating Expenses"
              values={yearlyDetails.map(y => y.totalExpenses - y.expenseFFE)}
              tooltip="Click to expand: Departmental costs, utilities, taxes, insurance, and management fees. Excludes FF&E (shown in Investing)."
              expanded={!!expanded.expenses}
              onToggle={() => toggleSection('expenses')}
              negate
            >
              <LineItem label="Housekeeping & Room Operations" values={yearlyDetails.map(y => y.expenseRooms)} indent />
              <LineItem label="Food & Beverage Costs" values={yearlyDetails.map(y => y.expenseFB)} indent />
              <LineItem label="Event Operations" values={yearlyDetails.map(y => y.expenseEvents)} indent />
              <LineItem label="Marketing & Platform Fees" values={yearlyDetails.map(y => y.expenseMarketing)} indent />
              <LineItem label="Property Operations & Maintenance" values={yearlyDetails.map(y => y.expensePropertyOps)} indent />
              <LineItem label="Utilities (Variable)" values={yearlyDetails.map(y => y.expenseUtilitiesVar)} indent />
              <LineItem label="Utilities (Fixed)" values={yearlyDetails.map(y => y.expenseUtilitiesFixed)} indent />
              <LineItem label="Insurance" values={yearlyDetails.map(y => y.expenseInsurance)} indent />
              <LineItem label="Property Taxes" values={yearlyDetails.map(y => y.expenseTaxes)} indent />
              <LineItem label="Administrative & Compliance" values={yearlyDetails.map(y => y.expenseAdmin)} indent />
              <LineItem label="IT Systems" values={yearlyDetails.map(y => y.expenseIT)} indent />
              <LineItem label="Other Operating Costs" values={yearlyDetails.map(y => y.expenseOther)} indent />
              <LineItem label="Base Management Fee" values={yearlyDetails.map(y => y.feeBase)} indent />
              <LineItem label="Incentive Management Fee" values={yearlyDetails.map(y => y.feeIncentive)} indent />
            </ExpandableLineItem>
            
            {/* Interest Paid */}
            <LineItem 
              label="Less: Interest Paid" 
              values={yearlyData.map(y => y.interestExpense)} 
              negate
              tooltip="Interest portion of debt service payments. Classified as operating under ASC 230."
            />
            
            {/* Income Tax Paid */}
            <LineItem 
              label="Less: Income Taxes Paid" 
              values={yearlyData.map(y => y.taxLiability)} 
              negate
              tooltip="Income tax on taxable income (NOI - Interest - Depreciation). Only when taxable income is positive."
            />
            
            {/* ═ Cash from Operations Subtotal ═ */}
            <SubtotalRow 
              label="Cash from Operations" 
              values={cashFromOperations}
              tooltip="Total cash generated from property operations = Revenue - Operating Expenses - Interest - Taxes."
            />

            <SpacerRow colSpan={colSpan} />

            {/* ═══ INVESTING CASH FLOW ═══ */}
            <SectionHeader 
              label="Investing Cash Flow" 
              colSpan={colSpan}
              tooltip="Cash spent on property acquisition, renovation, and capital improvements."
            />
            
            <LineItem 
              label="Property Acquisition" 
              values={yearlyData.map((_, i) => i === acquisitionYear ? totalPropertyCost : 0)} 
              negate
              tooltip="Total property cost in acquisition year (purchase price + building improvements + pre-opening costs)."
            />
            
            <LineItem 
              label="FF&E Reserve / Capital Improvements" 
              values={yearlyDetails.map(y => y.expenseFFE)} 
              negate
              tooltip="Furniture, fixtures & equipment reserve. Reclassified from operating to investing as a capital expenditure."
            />
            
            <LineItem 
              label="Sale Proceeds (Net Exit Value)" 
              values={yearlyData.map(y => y.exitValue)} 
              showZero={false}
              tooltip={`Property sale price minus ${((global?.commissionRate ?? DEFAULT_COMMISSION_RATE) * 100).toFixed(0)}% commission and outstanding loan payoff. Classified as investing per ASC 360.`}
            />
            
            {/* ═ Cash from Investing Subtotal ═ */}
            <SubtotalRow 
              label="Cash from Investing" 
              values={cashFromInvesting}
              tooltip="Net cash from investing = -(Acquisition + FF&E) + Sale Proceeds."
            />

            <SpacerRow colSpan={colSpan} />

            {/* ═══ FINANCING CASH FLOW ═══ */}
            <SectionHeader 
              label="Financing Cash Flow" 
              colSpan={colSpan}
              tooltip="Cash from equity contributions, debt financing, and capital returns."
            />
            
            <LineItem 
              label="Equity Contribution" 
              values={yearlyData.map((_, i) => i === acquisitionYear ? equityInvested : 0)} 
              showZero={false}
              tooltip="Initial equity invested by owners/investors, including operating reserve."
            />
            
            <LineItem 
              label="Loan Proceeds" 
              values={yearlyData.map((_, i) => i === acquisitionYear && loan.loanAmount > 0 ? loan.loanAmount : 0)} 
              showZero={false}
              tooltip="Mortgage proceeds received at acquisition."
            />
            
            <LineItem 
              label="Less: Principal Repayments" 
              values={yearlyData.map(y => y.principalPayment)} 
              negate
              tooltip="Principal portion of debt service. Reduces outstanding loan balance."
            />
            
            <LineItem 
              label="Refinancing Proceeds" 
              values={yearlyData.map(y => y.refinancingProceeds)} 
              showZero={false}
              tooltip="Net cash-out from refinancing, after closing costs and payoff of existing loan."
            />
            
            {/* ═ Cash from Financing Subtotal ═ */}
            <SubtotalRow 
              label="Cash from Financing" 
              values={cashFromFinancing}
              tooltip="Net cash from financing = Equity + Loan Proceeds - Principal + Refinancing."
            />

            <SpacerRow colSpan={colSpan} />

            {/* ═══ NET CHANGE & BALANCES ═══ */}
            <TableRow className="bg-gradient-to-r from-primary/80 via-primary/60 to-primary/40 backdrop-blur-sm font-bold text-primary-foreground shadow-sm">
              <TableCell className="sticky left-0 bg-primary/70 py-1.5">
                <span className="flex items-center gap-1">
                  Net Increase (Decrease) in Cash
                  <HelpTooltip text="CFO + CFI + CFF = Net change in cash position for the year." light />
                </span>
              </TableCell>
              {netChangeCash.map((v, i) => (
                <TableCell key={i} className="text-right py-1.5">
                  <Money amount={v} className={v < 0 ? "text-red-200" : ""} />
                </TableCell>
              ))}
            </TableRow>
            
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-white py-1">Opening Cash Balance</TableCell>
              {openingCash.map((v, i) => (
                <TableCell key={i} className="text-right text-muted-foreground py-1"><Money amount={v} /></TableCell>
              ))}
            </TableRow>
            
            <TableRow className="font-semibold border-t-2 border-gray-300">
              <TableCell className="pl-6 sticky left-0 bg-white py-1.5">
                <span className="flex items-center gap-1">
                  Closing Cash Balance
                  <HelpTooltip text="Opening balance + Net change in cash. This should match the Balance Sheet cash position." />
                </span>
              </TableCell>
              {closingCash.map((v, i) => (
                <TableCell key={i} className={cn("text-right py-1.5", v < 0 ? "text-destructive" : "text-accent")}>
                  <Money amount={v} />
                </TableCell>
              ))}
            </TableRow>

            <SpacerRow colSpan={colSpan} />

            {/* ═══ FREE CASH FLOW ═══ */}
            <SectionHeader 
              label="Free Cash Flow" 
              colSpan={colSpan}
              tooltip="Cash from Operations minus capital expenditures. Shows cash available before debt repayment."
            />
            
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-white py-1">Cash from Operations</TableCell>
              {cashFromOperations.map((v, i) => (
                <TableCell key={i} className="text-right text-muted-foreground py-1"><Money amount={v} /></TableCell>
              ))}
            </TableRow>
            
            <LineItem 
              label="Less: Capital Expenditures (FF&E)" 
              values={yearlyDetails.map(y => y.expenseFFE)} 
              negate
              tooltip="FF&E reserve deducted from CFO to arrive at Free Cash Flow."
            />
            
            <TableRow className="bg-accent/10 font-bold">
              <TableCell className="sticky left-0 bg-accent/10 py-1.5">
                <span className="flex items-center gap-1">
                  Free Cash Flow (FCF)
                  <HelpTooltip text="FCF = Cash from Operations - Capital Expenditures. Cash available to service debt and distribute to investors." />
                </span>
              </TableCell>
              {cashFromOperations.map((cfo, i) => {
                const val = cfo - yearlyDetails[i].expenseFFE;
                return (
                  <TableCell key={i} className={cn("text-right py-1.5", val >= 0 ? "text-accent" : "text-destructive")}>
                    <Money amount={val} />
                  </TableCell>
                );
              })}
            </TableRow>
            
            <LineItem 
              label="Less: Principal Payments" 
              values={yearlyData.map(y => y.principalPayment)} 
              negate
              tooltip="Principal portion of debt service. Reduces cash available to equity investors."
            />
            
            <TableRow className="bg-accent/10 font-bold">
              <TableCell className="sticky left-0 bg-accent/10 py-1.5">
                <span className="flex items-center gap-1">
                  Free Cash Flow to Equity (FCFE)
                  <HelpTooltip text="FCFE = FCF - Principal Payments. Cash available for distribution to investors after all obligations." />
                </span>
              </TableCell>
              {yearlyData.map((cf, i) => {
                const localFcf = cashFromOperations[i] - yearlyDetails[i].expenseFFE;
                const fcfe = localFcf - cf.principalPayment;
                return (
                  <TableCell key={i} className={cn("text-right py-1.5", fcfe >= 0 ? "text-accent" : "text-destructive")}>
                    <Money amount={fcfe} />
                  </TableCell>
                );
              })}
            </TableRow>

            <SpacerRow colSpan={colSpan} />

            {/* ═══ KEY METRICS ═══ */}
            <SectionHeader label="Key Metrics" colSpan={colSpan} />
            
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-white py-1">
                <span className="flex items-center gap-1">
                  Cash-on-Cash Return
                  <HelpTooltip text="Annual after-tax cash flow divided by initial equity. Shows the cash yield on your investment each year." />
                </span>
              </TableCell>
              {yearlyData.map((y, i) => {
                const cocReturn = equityInvested > 0 ? (y.atcf / equityInvested) * 100 : 0;
                return (
                  <TableCell key={i} className={cn("text-right font-medium py-1", cocReturn > 0 ? "text-accent" : "text-muted-foreground")}>
                    {equityInvested > 0 ? `${cocReturn.toFixed(1)}%` : '-'}
                  </TableCell>
                );
              })}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-white py-1">
                <span className="flex items-center gap-1">
                  Debt Service Coverage Ratio
                  <HelpTooltip text="NOI divided by debt service. Lenders typically require 1.25x minimum. Higher is better." />
                </span>
              </TableCell>
              {yearlyData.map((y, i) => (
                <TableCell key={i} className={cn("text-right font-medium py-1", y.debtService > 0 && y.noi / y.debtService < 1.25 ? "text-destructive" : "")}>
                  {y.debtService > 0 ? `${(y.noi / y.debtService).toFixed(2)}x` : 'N/A'}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
