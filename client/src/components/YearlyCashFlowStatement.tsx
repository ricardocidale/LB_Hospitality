import { MonthlyFinancials } from "@/lib/financialEngine";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Money } from "@/components/Money";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { 
  LoanParams, 
  GlobalLoanParams,
  calculateLoanParams,
  calculateRefinanceParams,
  calculateYearlyDebtService,
  calculateExitValue,
  getAcquisitionYear,
  YearlyCashFlowResult
} from "@/lib/loanCalculations";

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
  
  const loan = calculateLoanParams(property, global);
  const refi = calculateRefinanceParams(property, global, loan, yearlyNOIData, years);
  
  const results: YearlyCashFlowResult[] = [];
  let cumulative = 0;
  const acquisitionYear = getAcquisitionYear(loan);
  
  for (let y = 0; y < years; y++) {
    const noi = yearlyNOIData[y] || 0;
    const debt = calculateYearlyDebtService(loan, refi, y);
    
    const btcf = noi - debt.debtService;
    const taxableIncome = noi - debt.interestExpense - loan.annualDepreciation;
    const taxLiability = taxableIncome > 0 ? taxableIncome * loan.taxRate : 0;
    const atcf = btcf - taxLiability;
    
    const capex = y === acquisitionYear ? -loan.equityInvested : 0;
    const refiProceedsThisYear = y === refi.refiYear ? refi.refiProceeds : 0;
    
    let exitValue = 0;
    if (y === years - 1) {
      exitValue = calculateExitValue(noi, loan, refi, y, property.exitCapRate);
    }
    
    const netCashFlowToInvestors = atcf + capex + refiProceedsThisYear + exitValue;
    cumulative += netCashFlowToInvestors;
    
    results.push({
      year: y + 1,
      noi,
      debtService: debt.debtService,
      interestExpense: debt.interestExpense,
      principalPayment: debt.principalPayment,
      depreciation: loan.annualDepreciation,
      btcf,
      taxableIncome,
      taxLiability,
      atcf,
      capitalExpenditures: capex,
      refinancingProceeds: refiProceedsThisYear,
      exitValue,
      netCashFlowToInvestors,
      cumulativeCashFlow: cumulative,
    });
  }
  
  return results;
}

export function YearlyCashFlowStatement({ data, property, global, years = 10, startYear = 2026 }: Props) {
  const yearlyData = aggregateCashFlowByYear(data, property, global, years);
  
  const loan = calculateLoanParams(property, global);
  const equityInvested = loan.equityInvested;
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          Investor Cash Flows
          <HelpTooltip text="Shows the cash available to distribute to investors each year, including operating cash flow (after taxes), refinancing proceeds, and sale proceeds at exit." />
        </CardTitle>
        <p className="text-sm text-muted-foreground">Annual distributions, refinancing proceeds, and exit value</p>
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
            <TableRow className="bg-muted/30">
              <TableCell colSpan={years + 1} className="font-bold text-primary">Operating Cash Flow</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-card">Net Operating Income (NOI)</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right"><Money amount={y.noi} /></TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-card">Less: Debt Service</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-muted-foreground">
                  {y.debtService > 0 ? <Money amount={-y.debtService} /> : '-'}
                </TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-primary/5 font-medium">
              <TableCell className="sticky left-0 bg-primary/5 flex items-center gap-1">
                Before-Tax Cash Flow (BTCF)
                <HelpTooltip text="Cash remaining after paying debt service, before accounting for taxes. Also called 'Cash Flow Before Tax'." />
              </TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className={cn("text-right", y.btcf < 0 ? "text-destructive" : "")}>
                  <Money amount={y.btcf} />
                </TableCell>
              ))}
            </TableRow>

            <TableRow className="h-3 border-none"><TableCell colSpan={years + 1}></TableCell></TableRow>

            <TableRow className="bg-muted/30">
              <TableCell colSpan={years + 1} className="font-bold text-primary">Tax Calculation</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-card">NOI</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-muted-foreground"><Money amount={y.noi} /></TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-card">Less: Interest Expense</TableCell>
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
              <TableCell className="pl-6 sticky left-0 bg-card">Taxable Income</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className={cn("text-right", y.taxableIncome < 0 ? "text-muted-foreground" : "")}>
                  <Money amount={y.taxableIncome} />
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6 sticky left-0 bg-card">Tax Liability ({((property.taxRate ?? 0.25) * 100).toFixed(0)}%)</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-destructive">
                  {y.taxLiability > 0 ? <Money amount={-y.taxLiability} /> : '-'}
                </TableCell>
              ))}
            </TableRow>

            <TableRow className="h-3 border-none"><TableCell colSpan={years + 1}></TableCell></TableRow>

            <TableRow className="bg-accent/10 font-bold">
              <TableCell className="sticky left-0 bg-accent/10 flex items-center gap-1">
                After-Tax Cash Flow (ATCF)
                <HelpTooltip text="Cash available for distribution to investors each year from ongoing operations. This is the annual 'yield' on the investment." />
              </TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className={cn("text-right", y.atcf >= 0 ? "text-accent" : "text-destructive")}>
                  <Money amount={y.atcf} />
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
