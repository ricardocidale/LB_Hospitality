import { MonthlyFinancials } from "@/lib/financialEngine";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Money } from "@/components/Money";
import { HelpTooltip } from "@/components/ui/help-tooltip";

interface Props {
  data: MonthlyFinancials[];
  property: {
    purchasePrice: number;
    buildingImprovements: number;
    preOpeningCosts: number;
    operatingReserve: number;
    type: string;
    acquisitionDate?: string;
    taxRate?: number | null;
    acquisitionLTV?: number | null;
    acquisitionInterestRate?: number | null;
    acquisitionTermYears?: number | null;
    willRefinance?: string | null;
    refinanceDate?: string | null;
    refinanceLTV?: number | null;
    refinanceInterestRate?: number | null;
    refinanceTermYears?: number | null;
    refinanceClosingCostRate?: number | null;
    exitCapRate?: number | null;
  };
  global?: {
    modelStartDate: string;
    commissionRate?: number;
    debtAssumptions?: {
      acqLTV?: number;
      interestRate?: number;
      amortizationYears?: number;
      refiLTV?: number;
      refiClosingCostRate?: number;
    };
  };
  years?: number;
  startYear?: number;
  defaultLTV?: number;
}

interface YearlyCashFlow {
  year: number;
  noi: number;
  debtService: number;
  interestExpense: number;
  principalPayment: number;
  depreciation: number;
  btcf: number;
  taxableIncome: number;
  taxLiability: number;
  atcf: number;
  capitalExpenditures: number;
  refinancingProceeds: number;
  exitValue: number;
  netCashFlowToInvestors: number;
  cumulativeCashFlow: number;
}

function aggregateCashFlowByYear(
  data: MonthlyFinancials[], 
  property: Props['property'], 
  global: Props['global'],
  years: number, 
  defaultLTV: number = 0.75
): YearlyCashFlow[] {
  const result: YearlyCashFlow[] = [];
  let cumulative = 0;
  
  const totalInvestment = property.purchasePrice + property.buildingImprovements + 
                          property.preOpeningCosts + property.operatingReserve;
  const ltv = property.acquisitionLTV ?? global?.debtAssumptions?.acqLTV ?? defaultLTV;
  const loanAmount = property.type === "Financed" ? totalInvestment * ltv : 0;
  const equityInvested = totalInvestment - loanAmount;
  
  const interestRate = property.acquisitionInterestRate ?? global?.debtAssumptions?.interestRate ?? 0.09;
  const termYears = property.acquisitionTermYears ?? global?.debtAssumptions?.amortizationYears ?? 25;
  const taxRate = property.taxRate ?? 0.25;
  const commissionRate = global?.commissionRate ?? 0.05;
  
  const buildingValue = property.purchasePrice + property.buildingImprovements;
  const annualDepreciation = buildingValue / 27.5;
  
  const monthlyRate = interestRate / 12;
  const totalPayments = termYears * 12;
  const monthlyPayment = loanAmount > 0 
    ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1)
    : 0;
  
  const modelStart = new Date(global?.modelStartDate || '2026-04-01');
  const acqDate = new Date(property.acquisitionDate || global?.modelStartDate || '2026-04-01');
  const acqMonthsFromModelStart = Math.max(0, 
    (acqDate.getFullYear() - modelStart.getFullYear()) * 12 + 
    (acqDate.getMonth() - modelStart.getMonth())
  );
  
  const getOutstandingBalance = (yearEnd: number): number => {
    if (loanAmount === 0) return 0;
    const endOfYearMonth = (yearEnd + 1) * 12;
    const monthsPaid = Math.max(0, Math.min(endOfYearMonth - acqMonthsFromModelStart, totalPayments));
    if (monthsPaid <= 0) return loanAmount;
    const remainingPayments = totalPayments - monthsPaid;
    if (remainingPayments <= 0) return 0;
    return monthlyPayment * (1 - Math.pow(1 + monthlyRate, -remainingPayments)) / monthlyRate;
  };
  
  const refiInterestRate = property.refinanceInterestRate ?? global?.debtAssumptions?.interestRate ?? 0.09;
  const refiTermYears = property.refinanceTermYears ?? global?.debtAssumptions?.amortizationYears ?? 25;
  const refiMonthlyRate = refiInterestRate / 12;
  const refiTotalPayments = refiTermYears * 12;
  
  let refiYear = -1;
  let refiProceeds = 0;
  let refiLoanAmount = 0;
  let refiMonthlyPayment = 0;
  
  if (property.willRefinance === "Yes" && property.refinanceDate && global?.modelStartDate) {
    const refiDate = new Date(property.refinanceDate);
    const monthsDiff = (refiDate.getFullYear() - modelStart.getFullYear()) * 12 + 
                       (refiDate.getMonth() - modelStart.getMonth());
    refiYear = Math.floor(monthsDiff / 12);
    
    if (refiYear >= 0 && refiYear < years) {
      const refiLTV = property.refinanceLTV ?? global?.debtAssumptions?.refiLTV ?? 0.65;
      const yearData = data.slice(refiYear * 12, (refiYear + 1) * 12);
      const stabilizedNOI = yearData.reduce((a, m) => a + m.noi, 0);
      const exitCapRate = property.exitCapRate ?? 0.085;
      const propertyValue = stabilizedNOI / exitCapRate;
      refiLoanAmount = propertyValue * refiLTV;
      refiMonthlyPayment = (refiLoanAmount * refiMonthlyRate * Math.pow(1 + refiMonthlyRate, refiTotalPayments)) / 
                           (Math.pow(1 + refiMonthlyRate, refiTotalPayments) - 1);
      const closingCostRate = property.refinanceClosingCostRate ?? global?.debtAssumptions?.refiClosingCostRate ?? 0.03;
      const closingCosts = refiLoanAmount * closingCostRate;
      const existingDebt = getOutstandingBalance(refiYear - 1);
      refiProceeds = Math.max(0, refiLoanAmount - closingCosts - existingDebt);
    }
  }
  
  const getRefiOutstandingBalance = (yearEnd: number): number => {
    if (refiLoanAmount === 0 || refiYear < 0) return 0;
    const yearsFromRefi = yearEnd - refiYear + 1;
    if (yearsFromRefi < 0) return refiLoanAmount;
    const monthsPaid = Math.min(yearsFromRefi * 12, refiTotalPayments);
    if (monthsPaid <= 0) return refiLoanAmount;
    const remainingPayments = refiTotalPayments - monthsPaid;
    if (remainingPayments <= 0) return 0;
    return refiMonthlyPayment * (1 - Math.pow(1 + refiMonthlyRate, -remainingPayments)) / refiMonthlyRate;
  };
  
  for (let y = 0; y < years; y++) {
    const yearData = data.slice(y * 12, (y + 1) * 12);
    if (yearData.length === 0) continue;
    
    const noi = yearData.reduce((a, m) => a + m.noi, 0);
    
    let yearlyDebtService = 0;
    let yearlyInterest = 0;
    let yearlyPrincipal = 0;
    
    const yearStartMonth = y * 12;
    const yearEndMonth = (y + 1) * 12;
    
    if (refiYear >= 0 && y >= refiYear && refiLoanAmount > 0) {
      const yearsFromRefi = y - refiYear;
      const monthsFromRefi = yearsFromRefi * 12;
      let refiBalance = refiLoanAmount;
      for (let pm = 0; pm < monthsFromRefi; pm++) {
        const interest = refiBalance * refiMonthlyRate;
        const principal = refiMonthlyPayment - interest;
        refiBalance -= principal;
      }
      
      for (let m = 0; m < 12; m++) {
        const interest = refiBalance * refiMonthlyRate;
        const principal = refiMonthlyPayment - interest;
        yearlyInterest += interest;
        yearlyPrincipal += principal;
        refiBalance -= principal;
      }
      yearlyDebtService = refiMonthlyPayment * 12;
    } else if (loanAmount > 0) {
      const loanPaymentsThisYear = Math.min(12, 
        Math.max(0, Math.min(yearEndMonth, acqMonthsFromModelStart + totalPayments) - Math.max(yearStartMonth, acqMonthsFromModelStart))
      );
      
      if (loanPaymentsThisYear > 0) {
        const paymentsMadeBefore = Math.max(0, yearStartMonth - acqMonthsFromModelStart);
        let remainingBalance = loanAmount;
        for (let pm = 0; pm < paymentsMadeBefore; pm++) {
          const interest = remainingBalance * monthlyRate;
          const principal = monthlyPayment - interest;
          remainingBalance -= principal;
        }
        
        for (let m = 0; m < loanPaymentsThisYear; m++) {
          const interestPayment = remainingBalance * monthlyRate;
          const principalPayment = monthlyPayment - interestPayment;
          yearlyInterest += interestPayment;
          yearlyPrincipal += principalPayment;
          remainingBalance -= principalPayment;
        }
        yearlyDebtService = monthlyPayment * loanPaymentsThisYear;
      }
    }
    
    const btcf = noi - yearlyDebtService;
    const taxableIncome = noi - yearlyInterest - annualDepreciation;
    const taxLiability = taxableIncome > 0 ? taxableIncome * taxRate : 0;
    const atcf = btcf - taxLiability;
    
    const acquisitionYear = Math.floor(acqMonthsFromModelStart / 12);
    const capex = y === acquisitionYear ? -equityInvested : 0;
    const refiProceedsThisYear = y === refiYear ? refiProceeds : 0;
    
    let exitValue = 0;
    if (y === years - 1) {
      const exitCapRate = property.exitCapRate ?? 0.085;
      const grossValue = noi / exitCapRate;
      const commission = grossValue * commissionRate;
      let outstandingDebt = 0;
      
      if (refiYear >= 0 && refiLoanAmount > 0) {
        outstandingDebt = getRefiOutstandingBalance(y);
      } else if (loanAmount > 0) {
        outstandingDebt = getOutstandingBalance(y);
      }
      exitValue = grossValue - commission - outstandingDebt;
    }
    
    const netCashFlowToInvestors = atcf + capex + refiProceedsThisYear + exitValue;
    cumulative += netCashFlowToInvestors;
    
    result.push({
      year: y + 1,
      noi,
      debtService: yearlyDebtService,
      interestExpense: yearlyInterest,
      principalPayment: yearlyPrincipal,
      depreciation: annualDepreciation,
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
  
  return result;
}

export function YearlyCashFlowStatement({ data, property, global, years = 10, startYear = 2026, defaultLTV = 0.75 }: Props) {
  const yearlyData = aggregateCashFlowByYear(data, property, global, years, defaultLTV);
  
  const totalInvestment = property.purchasePrice + property.buildingImprovements + 
                          property.preOpeningCosts + property.operatingReserve;
  const ltv = property.acquisitionLTV ?? global?.debtAssumptions?.acqLTV ?? defaultLTV;
  const loanAmount = property.type === "Financed" ? totalInvestment * ltv : 0;
  const equityInvested = totalInvestment - loanAmount;
  
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
