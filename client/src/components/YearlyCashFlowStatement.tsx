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
  calculatePropertyYearlyCashFlows,
  YearlyCashFlowResult,
  DEFAULT_TAX_RATE,
  DEFAULT_COMMISSION_RATE
} from "@/lib/loanCalculations";

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
  const suggestedReserve = isAdequate ? operatingReserve : operatingReserve + shortfall + 50000;
  
  return {
    operatingReserve,
    minCashPosition,
    minCashMonth,
    shortfall,
    isAdequate,
    suggestedReserve: Math.ceil(suggestedReserve / 10000) * 10000
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

function aggregateCashFlowByYear(
  data: MonthlyFinancials[], 
  property: LoanParams, 
  global: GlobalLoanParams | undefined,
  years: number
): YearlyCashFlowResult[] {
  const yearlyNOIData: number[] = [];
  for (let y = 0; y < years; y++) {
    const yearData = data.slice(y * 12, (y + 1) * 12);
    yearlyNOIData.push(yearData.reduce((a, m) => a + m.noi, 0));
  }
  
  return calculatePropertyYearlyCashFlows(yearlyNOIData, property, global, years);
}

export function YearlyCashFlowStatement({ data, property, global, years = 10, startYear = 2026 }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  
  const yearlyData = aggregateCashFlowByYear(data, property, global, years);
  const yearlyDetails = aggregateYearlyDetails(data, years);
  
  const loan = calculateLoanParams(property, global);
  const equityInvested = loan.equityInvested;
  
  const operatingReserve = property.operatingReserve || 0;
  const cashAnalysis = analyzeMonthlyCashPosition(data, operatingReserve);
  
    
  const toggleSection = (section: string) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  return (
    <Card className="overflow-hidden bg-white shadow-lg border border-gray-100">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          Investor Cash Flows
          <HelpTooltip text="Shows the cash available to distribute to investors each year, including operating cash flow (after taxes), refinancing proceeds, and sale proceeds at exit." />
        </CardTitle>
        <p className="text-sm text-gray-500">Annual distributions, refinancing proceeds, and exit value</p>
        
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
                <span className="font-medium text-primary">Property Assumptions → Capital & Acquisition</span>.
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
              <TableHead className="w-[280px] font-bold sticky left-0 bg-gray-100 text-gray-900">Free Cash Flow Statement</TableHead>
              {yearlyData.map((y) => (
                <TableHead key={y.year} className="text-right min-w-[110px] font-bold text-gray-900">
                  FY {startYear + y.year - 1}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* GAAP Net Income Section */}
            <TableRow className="bg-gray-50">
              <TableCell colSpan={years + 1} className="font-bold text-[#257D41]">Net Income</TableCell>
            </TableRow>
            
            {/* NOI - Expandable with Revenue Details */}
            <TableRow 
              data-testid="row-noi-expandable"
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSection('revenue')}
            >
              <TableCell className="pl-6 sticky left-0 bg-white flex items-center gap-1">
                {expanded.revenue ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="ml-1">Total Revenue</span>
                <HelpTooltip text="Click to expand revenue details: Rooms, Events, F&B, and Other income." />
              </TableCell>
              {yearlyDetails.map((y, i) => (
                <TableCell key={i} className="text-right font-medium"><Money amount={y.totalRevenue} /></TableCell>
              ))}
            </TableRow>
            {expanded.revenue && (
              <>
                <TableRow className="bg-white">
                  <TableCell className="pl-16 sticky left-0 bg-white text-muted-foreground label-text">ADR</TableCell>
                  {yearlyDetails.map((y, i) => (
                    <TableCell key={i} className="text-right text-muted-foreground font-mono">
                      <Money amount={y.soldRooms > 0 ? y.revenueRooms / y.soldRooms : 0} />
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-white">
                  <TableCell className="pl-16 sticky left-0 bg-white text-muted-foreground label-text">Occupancy</TableCell>
                  {yearlyDetails.map((y, i) => (
                    <TableCell key={i} className="text-right text-muted-foreground font-mono">
                      {y.availableRooms > 0 ? ((y.soldRooms / y.availableRooms) * 100).toFixed(1) : 0}%
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-white">
                  <TableCell className="pl-16 sticky left-0 bg-white text-muted-foreground label-text">RevPAR</TableCell>
                  {yearlyDetails.map((y, i) => (
                    <TableCell key={i} className="text-right text-muted-foreground font-mono">
                      <Money amount={y.availableRooms > 0 ? y.revenueRooms / y.availableRooms : 0} />
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-white">
                  <TableCell className="pl-12 sticky left-0 bg-white text-muted-foreground">Room Revenue</TableCell>
                  {yearlyDetails.map((y, i) => (
                    <TableCell key={i} className="text-right text-muted-foreground"><Money amount={y.revenueRooms} /></TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-white">
                  <TableCell className="pl-12 sticky left-0 bg-white text-muted-foreground">Event Revenue</TableCell>
                  {yearlyDetails.map((y, i) => (
                    <TableCell key={i} className="text-right text-muted-foreground"><Money amount={y.revenueEvents} /></TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-white">
                  <TableCell className="pl-12 sticky left-0 bg-white text-muted-foreground">F&B Revenue</TableCell>
                  {yearlyDetails.map((y, i) => (
                    <TableCell key={i} className="text-right text-muted-foreground"><Money amount={y.revenueFB} /></TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-white">
                  <TableCell className="pl-12 sticky left-0 bg-white text-muted-foreground">Other Revenue</TableCell>
                  {yearlyDetails.map((y, i) => (
                    <TableCell key={i} className="text-right text-muted-foreground"><Money amount={y.revenueOther} /></TableCell>
                  ))}
                </TableRow>
              </>
            )}
            
            {/* Operating Expenses - Expandable */}
            <TableRow 
              data-testid="row-expenses-expandable"
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSection('expenses')}
            >
              <TableCell className="pl-6 sticky left-0 bg-white flex items-center gap-1">
                {expanded.expenses ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="ml-1">Less: Operating Expenses</span>
                <HelpTooltip text="Click to expand expense details: departmental costs, utilities, taxes, insurance, and management fees." />
              </TableCell>
              {yearlyDetails.map((y, i) => (
                <TableCell key={i} className="text-right text-muted-foreground"><Money amount={-y.totalExpenses} /></TableCell>
              ))}
            </TableRow>
            {expanded.expenses && (
              <>
                <TableRow className="bg-white">
                  <TableCell className="pl-12 sticky left-0 bg-white text-muted-foreground">Housekeeping</TableCell>
                  {yearlyDetails.map((y, i) => (
                    <TableCell key={i} className="text-right text-muted-foreground"><Money amount={y.expenseRooms} /></TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-white">
                  <TableCell className="pl-12 sticky left-0 bg-white text-muted-foreground">F&B Expense</TableCell>
                  {yearlyDetails.map((y, i) => (
                    <TableCell key={i} className="text-right text-muted-foreground"><Money amount={y.expenseFB} /></TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-white">
                  <TableCell className="pl-12 sticky left-0 bg-white text-muted-foreground">Event Expense</TableCell>
                  {yearlyDetails.map((y, i) => (
                    <TableCell key={i} className="text-right text-muted-foreground"><Money amount={y.expenseEvents} /></TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-white">
                  <TableCell className="pl-12 sticky left-0 bg-white text-muted-foreground">Marketing</TableCell>
                  {yearlyDetails.map((y, i) => (
                    <TableCell key={i} className="text-right text-muted-foreground"><Money amount={y.expenseMarketing} /></TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-white">
                  <TableCell className="pl-12 sticky left-0 bg-white text-muted-foreground">Property Operations</TableCell>
                  {yearlyDetails.map((y, i) => (
                    <TableCell key={i} className="text-right text-muted-foreground"><Money amount={y.expensePropertyOps} /></TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-white">
                  <TableCell className="pl-12 sticky left-0 bg-white text-muted-foreground">Utilities (Variable)</TableCell>
                  {yearlyDetails.map((y, i) => (
                    <TableCell key={i} className="text-right text-muted-foreground"><Money amount={y.expenseUtilitiesVar} /></TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-white">
                  <TableCell className="pl-12 sticky left-0 bg-white text-muted-foreground">Utilities (Fixed)</TableCell>
                  {yearlyDetails.map((y, i) => (
                    <TableCell key={i} className="text-right text-muted-foreground"><Money amount={y.expenseUtilitiesFixed} /></TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-white">
                  <TableCell className="pl-12 sticky left-0 bg-white text-muted-foreground">FF&E Reserve</TableCell>
                  {yearlyDetails.map((y, i) => (
                    <TableCell key={i} className="text-right text-muted-foreground"><Money amount={y.expenseFFE} /></TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-white">
                  <TableCell className="pl-12 sticky left-0 bg-white text-muted-foreground">Administrative</TableCell>
                  {yearlyDetails.map((y, i) => (
                    <TableCell key={i} className="text-right text-muted-foreground"><Money amount={y.expenseAdmin} /></TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-white">
                  <TableCell className="pl-12 sticky left-0 bg-white text-muted-foreground">IT Systems</TableCell>
                  {yearlyDetails.map((y, i) => (
                    <TableCell key={i} className="text-right text-muted-foreground"><Money amount={y.expenseIT} /></TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-white">
                  <TableCell className="pl-12 sticky left-0 bg-white text-muted-foreground">Insurance</TableCell>
                  {yearlyDetails.map((y, i) => (
                    <TableCell key={i} className="text-right text-muted-foreground"><Money amount={y.expenseInsurance} /></TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-white">
                  <TableCell className="pl-12 sticky left-0 bg-white text-muted-foreground">Property Taxes</TableCell>
                  {yearlyDetails.map((y, i) => (
                    <TableCell key={i} className="text-right text-muted-foreground"><Money amount={y.expenseTaxes} /></TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-white">
                  <TableCell className="pl-12 sticky left-0 bg-white text-muted-foreground">Other Expenses</TableCell>
                  {yearlyDetails.map((y, i) => (
                    <TableCell key={i} className="text-right text-muted-foreground"><Money amount={y.expenseOther} /></TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-white">
                  <TableCell className="pl-12 sticky left-0 bg-white text-muted-foreground">Base Management Fee</TableCell>
                  {yearlyDetails.map((y, i) => (
                    <TableCell key={i} className="text-right text-muted-foreground"><Money amount={y.feeBase} /></TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-white">
                  <TableCell className="pl-12 sticky left-0 bg-white text-muted-foreground">Incentive Management Fee</TableCell>
                  {yearlyDetails.map((y, i) => (
                    <TableCell key={i} className="text-right text-muted-foreground"><Money amount={y.feeIncentive} /></TableCell>
                  ))}
                </TableRow>
              </>
            )}
            
            {/* NOI Summary Row */}
            <TableRow className="bg-primary/5 font-medium">
              <TableCell className="pl-6 sticky left-0 bg-primary/5 flex items-center gap-1">
                Net Operating Income (NOI)
                <HelpTooltip text="NOI = Total Revenue - Operating Expenses. The property's income before debt service, taxes, and depreciation." />
              </TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right"><Money amount={y.noi} /></TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-white flex items-center gap-1">
                Less: Interest Expense
                <HelpTooltip text="The interest portion of debt payments. Tax-deductible expense that reduces taxable income." />
              </TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-muted-foreground">
                  {y.interestExpense > 0 ? <Money amount={-y.interestExpense} /> : '-'}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-white flex items-center gap-1">
                Less: Depreciation
                <HelpTooltip text="Non-cash expense (27.5 year straight-line on building value). Reduces taxable income but not actual cash flow." />
              </TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-muted-foreground">
                  <Money amount={-y.depreciation} />
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-white flex items-center gap-1">
                Less: Income Tax ({((property.taxRate ?? DEFAULT_TAX_RATE) * 100).toFixed(0)}%)
                <HelpTooltip text="Income tax on taxable income (NOI - Interest - Depreciation). Only applies when taxable income is positive." />
              </TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-muted-foreground">
                  {y.taxLiability > 0 ? <Money amount={-y.taxLiability} /> : '-'}
                </TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-primary/5 font-medium">
              <TableCell className="sticky left-0 bg-primary/5 flex items-center gap-1">
                Net Income
                <HelpTooltip text="GAAP Net Income = NOI - Interest Expense - Depreciation - Income Taxes" />
              </TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className={cn("text-right", y.netIncome < 0 ? "text-destructive" : "")}>
                  <Money amount={y.netIncome} />
                </TableCell>
              ))}
            </TableRow>

            <TableRow className="h-3 border-none"><TableCell colSpan={years + 1}></TableCell></TableRow>

            {/* GAAP Operating Cash Flow Section */}
            <TableRow className="bg-gray-50">
              <TableCell colSpan={years + 1} className="font-bold text-[#257D41]">Operating Cash Flow (Indirect Method)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-white">Net Income</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-muted-foreground"><Money amount={y.netIncome} /></TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-white flex items-center gap-1">
                Add: Depreciation
                <HelpTooltip text="Add back depreciation since it's a non-cash expense that reduced Net Income but didn't consume cash." />
              </TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-accent">
                  <Money amount={y.depreciation} />
                </TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-primary/5 font-medium">
              <TableCell className="sticky left-0 bg-primary/5 flex items-center gap-1">
                Operating Cash Flow
                <HelpTooltip text="Cash generated from operations = Net Income + Non-cash expenses (Depreciation)" />
              </TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className={cn("text-right", y.operatingCashFlow < 0 ? "text-destructive" : "")}>
                  <Money amount={y.operatingCashFlow} />
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-white flex items-center gap-1">
                Working Capital Changes
                <HelpTooltip text="Changes in receivables, payables, and other current assets/liabilities. For stabilized properties, typically minimal." />
              </TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-muted-foreground">
                  {y.workingCapitalChange !== 0 ? <Money amount={-y.workingCapitalChange} /> : '-'}
                </TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-primary/5 font-medium">
              <TableCell className="sticky left-0 bg-primary/5 flex items-center gap-1">
                Cash from Operations (CFO)
                <HelpTooltip text="CFO = Operating Cash Flow ± Working Capital Changes. The actual cash generated from property operations." />
              </TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right"><Money amount={y.cashFromOperations} /></TableCell>
              ))}
            </TableRow>

            <TableRow className="h-3 border-none"><TableCell colSpan={years + 1}></TableCell></TableRow>

            {/* GAAP Free Cash Flow Section */}
            <TableRow className="bg-gray-50">
              <TableCell colSpan={years + 1} className="font-bold text-[#257D41]">Free Cash Flow (GAAP)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-white">Cash from Operations</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-muted-foreground"><Money amount={y.cashFromOperations} /></TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-white flex items-center gap-1">
                Less: Maintenance CapEx
                <HelpTooltip text="Ongoing capital expenditures. For hotels, FF&E reserves (4% of revenue) are already included in NOI as an operating expense, so no additional maintenance capex is deducted here." />
              </TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-muted-foreground">
                  {y.maintenanceCapex > 0 ? <Money amount={-y.maintenanceCapex} /> : 'incl. in NOI'}
                </TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-primary/5 font-medium">
              <TableCell className="sticky left-0 bg-primary/5 flex items-center gap-1">
                Free Cash Flow (FCF)
                <HelpTooltip text="GAAP Free Cash Flow = Cash from Operations - Maintenance CapEx. Cash generated by the property before debt repayment." />
              </TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className={cn("text-right", y.freeCashFlow >= 0 ? "" : "text-destructive")}>
                  <Money amount={y.freeCashFlow} />
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-white flex items-center gap-1">
                Less: Principal Payments
                <HelpTooltip text="Principal portion of debt service (financing activity). Reduces cash available to equity investors." />
              </TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-muted-foreground">
                  {y.principalPayment > 0 ? <Money amount={-y.principalPayment} /> : '-'}
                </TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-accent/10 font-bold">
              <TableCell className="sticky left-0 bg-accent/10 flex items-center gap-1">
                Free Cash Flow to Equity (FCFE)
                <HelpTooltip text="Free Cash Flow to Equity = FCF - Principal Payments. Cash available for distribution to investors after debt service." />
              </TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className={cn("text-right", y.freeCashFlowToEquity >= 0 ? "text-accent" : "text-destructive")}>
                  <Money amount={y.freeCashFlowToEquity} />
                </TableCell>
              ))}
            </TableRow>

            <TableRow className="h-3 border-none"><TableCell colSpan={years + 1}></TableCell></TableRow>

            <TableRow className="bg-gray-50">
              <TableCell colSpan={years + 1} className="font-bold text-[#257D41]">Capital Events</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-white">Initial Equity Investment</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-muted-foreground">
                  {y.capitalExpenditures < 0 ? <Money amount={y.capitalExpenditures} /> : '-'}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-white flex items-center gap-1">
                Refinancing Proceeds
                <HelpTooltip text="Cash-out from refinancing when property value has increased. Net of closing costs and payoff of existing loan." />
              </TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className={cn("text-right", y.refinancingProceeds > 0 ? "text-accent" : "")}>
                  {y.refinancingProceeds > 0 ? <Money amount={y.refinancingProceeds} /> : '-'}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-white flex items-center gap-1">
                Sale Proceeds (Net Exit Value)
                <HelpTooltip text={`Property sale price minus ${((global?.commissionRate ?? DEFAULT_COMMISSION_RATE) * 100).toFixed(0)}% commission and outstanding loan payoff. Calculated using Year 10 NOI and exit cap rate.`} />
              </TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className={cn("text-right", y.exitValue > 0 ? "text-accent font-bold" : "")}>
                  {y.exitValue > 0 ? <Money amount={y.exitValue} /> : '-'}
                </TableCell>
              ))}
            </TableRow>

            <TableRow className="h-3 border-none"><TableCell colSpan={years + 1}></TableCell></TableRow>

            <TableRow className="bg-gradient-to-r from-primary/80 via-primary/60 to-primary/40 backdrop-blur-sm font-bold text-primary-foreground shadow-sm">
              <TableCell className="sticky left-0 bg-primary/70 flex items-center gap-1">
                Net Cash Flow to Investors
                <HelpTooltip text="Total cash distributed to investors including annual operating returns, refinancing proceeds, and sale proceeds. This is the basis for IRR calculations." light />
              </TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right">
                  <Money amount={y.netCashFlowToInvestors} className={y.netCashFlowToInvestors < 0 ? "text-red-200" : ""} />
                </TableCell>
              ))}
            </TableRow>

            <TableRow className="bg-gray-50">
              <TableCell className="sticky left-0 bg-gray-50">Cumulative Cash Flow</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right">
                  <Money amount={y.cumulativeCashFlow} className={y.cumulativeCashFlow < 0 ? "text-destructive" : "text-accent"} />
                </TableCell>
              ))}
            </TableRow>

            <TableRow className="h-3 border-none"><TableCell colSpan={years + 1}></TableCell></TableRow>

            <TableRow className="bg-gray-50">
              <TableCell colSpan={years + 1} className="font-bold text-[#257D41]">Key Metrics</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-white flex items-center gap-1">
                Cash-on-Cash Return
                <HelpTooltip text="Annual ATCF divided by initial equity. Shows the cash yield on your investment each year." />
              </TableCell>
              {yearlyData.map((y) => {
                const cocReturn = equityInvested > 0 ? (y.atcf / equityInvested) * 100 : 0;
                return (
                  <TableCell key={y.year} className={cn("text-right font-medium", cocReturn > 0 ? "text-accent" : "text-muted-foreground")}>
                    {equityInvested > 0 ? `${cocReturn.toFixed(1)}%` : '-'}
                  </TableCell>
                );
              })}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-white flex items-center gap-1">
                Debt Service Coverage Ratio
                <HelpTooltip text="NOI divided by debt service. Lenders typically require 1.25x minimum. Higher is better." />
              </TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className={cn("text-right font-medium", y.debtService > 0 && y.noi / y.debtService < 1.25 ? "text-destructive" : "")}>
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
