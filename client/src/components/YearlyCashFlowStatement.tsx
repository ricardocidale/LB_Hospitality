import { MonthlyFinancials } from "@/lib/financialEngine";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Money } from "@/components/Money";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { 
  LoanParams, 
  GlobalLoanParams,
  calculateLoanParams,
  calculatePropertyYearlyCashFlows,
  YearlyCashFlowResult
} from "@/lib/loanCalculations";

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
  const yearlyData = aggregateCashFlowByYear(data, property, global, years);
  
  const loan = calculateLoanParams(property, global);
  const equityInvested = loan.equityInvested;
  
  const operatingReserve = property.operatingReserve || 0;
  const cashAnalysis = analyzeMonthlyCashPosition(data, operatingReserve);
  
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          Investor Cash Flows
          <HelpTooltip text="Shows the cash available to distribute to investors each year, including operating cash flow (after taxes), refinancing proceeds, and sale proceeds at exit." />
        </CardTitle>
        <p className="text-sm text-muted-foreground">Annual distributions, refinancing proceeds, and exit value</p>
        
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
            <TableRow className="bg-muted/50">
              <TableHead className="w-[280px] font-bold sticky left-0 bg-muted/50">Free Cash Flow Statement</TableHead>
              {yearlyData.map((y) => (
                <TableHead key={y.year} className="text-right min-w-[110px] font-bold">
                  FY {startYear + y.year - 1}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* GAAP Net Income Section */}
            <TableRow className="bg-muted/30">
              <TableCell colSpan={years + 1} className="font-bold text-primary">Net Income Calculation</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-card flex items-center gap-1">
                Net Operating Income (NOI)
                <HelpTooltip text="NOI = Total Revenue - Operating Expenses. The property's income before debt service, taxes, and depreciation." />
              </TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right"><Money amount={y.noi} /></TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-card flex items-center gap-1">
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
              <TableCell className="pl-6 sticky left-0 bg-card flex items-center gap-1">
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
              <TableCell className="pl-6 sticky left-0 bg-card flex items-center gap-1">
                Less: Income Tax ({((property.taxRate ?? 0.25) * 100).toFixed(0)}%)
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
            <TableRow className="bg-muted/30">
              <TableCell colSpan={years + 1} className="font-bold text-primary">Operating Cash Flow (Indirect Method)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-card">Net Income</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-muted-foreground"><Money amount={y.netIncome} /></TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-card flex items-center gap-1">
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
              <TableCell className="pl-6 sticky left-0 bg-card flex items-center gap-1">
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
            <TableRow className="bg-muted/30">
              <TableCell colSpan={years + 1} className="font-bold text-primary">Free Cash Flow (GAAP)</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-card">Cash from Operations</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-muted-foreground"><Money amount={y.cashFromOperations} /></TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-card flex items-center gap-1">
                Less: Maintenance CapEx
                <HelpTooltip text="Ongoing capital expenditures. For hotels, FF&E reserves (4% of revenue) are already included in NOI as an operating expense, so no additional maintenance capex is deducted here." />
              </TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-muted-foreground italic">
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
              <TableCell className="pl-6 sticky left-0 bg-card flex items-center gap-1">
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

            <TableRow className="bg-muted/30">
              <TableCell colSpan={years + 1} className="font-bold text-primary">Capital Events</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-card">Initial Equity Investment</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-muted-foreground">
                  {y.capitalExpenditures < 0 ? <Money amount={y.capitalExpenditures} /> : '-'}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-card flex items-center gap-1">
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
              <TableCell className="pl-6 sticky left-0 bg-card flex items-center gap-1">
                Sale Proceeds (Net Exit Value)
                <HelpTooltip text={`Property sale price minus ${((global?.commissionRate ?? 0.05) * 100).toFixed(0)}% commission and outstanding loan payoff. Calculated using Year 10 NOI and exit cap rate.`} />
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

            <TableRow className="bg-muted/20">
              <TableCell className="sticky left-0 bg-muted/20">Cumulative Cash Flow</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right">
                  <Money amount={y.cumulativeCashFlow} className={y.cumulativeCashFlow < 0 ? "text-destructive" : "text-accent"} />
                </TableCell>
              ))}
            </TableRow>

            <TableRow className="h-3 border-none"><TableCell colSpan={years + 1}></TableCell></TableRow>

            <TableRow className="bg-muted/30">
              <TableCell colSpan={years + 1} className="font-bold text-primary">Key Metrics</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-card flex items-center gap-1">
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
              <TableCell className="pl-6 sticky left-0 bg-card flex items-center gap-1">
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
