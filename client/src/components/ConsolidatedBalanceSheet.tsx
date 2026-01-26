import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Money } from "@/components/Money";
import { Property, GlobalAssumptions } from "@shared/schema";
import { MonthlyFinancials } from "@/lib/financialEngine";

interface Props {
  properties: Property[];
  global: GlobalAssumptions;
  allProFormas: { property: Property; data: MonthlyFinancials[] }[];
  year: number;
}

export function ConsolidatedBalanceSheet({ properties, global, allProFormas, year }: Props) {
  const modelStartYear = global.modelStartDate 
    ? new Date(global.modelStartDate).getFullYear() 
    : 2026;
  
  const displayYear = modelStartYear + year;
  
  let totalPropertyValue = 0;
  let totalAccumulatedDepreciation = 0;
  let totalCashReserves = 0;
  let totalDebtOutstanding = 0;
  let totalInitialEquity = 0;
  let totalRetainedEarnings = 0;
  let totalCumulativeCashFlow = 0;

  properties.forEach((prop, idx) => {
    const proForma = allProFormas[idx]?.data || [];
    const monthsToInclude = year * 12;
    const relevantMonths = proForma.slice(0, monthsToInclude);
    
    // Fixed Assets: Property basis (purchase price + improvements)
    const propertyBasis = prop.purchasePrice + prop.buildingImprovements;
    totalPropertyValue += propertyBasis;
    
    // Accumulated Depreciation: 27.5-year straight-line on building value (GAAP for residential real estate)
    const annualDepreciation = propertyBasis / 27.5;
    totalAccumulatedDepreciation += annualDepreciation * Math.min(year, 10);
    
    // Initial operating reserve
    const operatingReserve = prop.operatingReserve || 0;
    
    // Debt calculations
    const isFinanced = prop.type === 'Financed';
    const debtDefaults = global.debtAssumptions as { acqLTV?: number; interestRate?: number; amortizationYears?: number } | null;
    const ltv = prop.acquisitionLTV || debtDefaults?.acqLTV || 0;
    const loanAmount = isFinanced ? propertyBasis * ltv : 0;
    
    let debtOutstanding = loanAmount;
    let cumulativeInterest = 0;
    let cumulativePrincipal = 0;
    
    if (loanAmount > 0 && isFinanced) {
      const annualRate = prop.acquisitionInterestRate || debtDefaults?.interestRate || 0.065;
      const rate = annualRate / 12;
      const termYears = prop.acquisitionTermYears || debtDefaults?.amortizationYears || 25;
      const term = termYears * 12;
      const monthlyPayment = loanAmount * (rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
      
      let balance = loanAmount;
      for (let m = 0; m < monthsToInclude && m < term; m++) {
        const interestPayment = balance * rate;
        const principalPayment = monthlyPayment - interestPayment;
        cumulativeInterest += interestPayment;
        cumulativePrincipal += principalPayment;
        balance -= principalPayment;
      }
      debtOutstanding = Math.max(0, balance);
    }
    totalDebtOutstanding += debtOutstanding;
    
    // Initial equity investment (what investors put in)
    const equityInvested = propertyBasis + (prop.preOpeningCosts || 0) + operatingReserve - loanAmount;
    totalInitialEquity += equityInvested;
    
    // GAAP Retained Earnings = Cumulative Net Income
    // Net Income = NOI - Interest Expense - Depreciation - Income Taxes
    const cumulativeNOI = relevantMonths.reduce((sum, m) => sum + m.noi, 0);
    const cumulativeDepreciation = annualDepreciation * Math.min(year, 10);
    const taxRate = prop.taxRate || 0.25;
    
    // Taxable Income = NOI - Interest - Depreciation
    const taxableIncome = cumulativeNOI - cumulativeInterest - cumulativeDepreciation;
    const incomeTax = Math.max(0, taxableIncome) * taxRate;
    
    // Net Income (GAAP) = NOI - Interest - Depreciation - Tax
    const netIncome = cumulativeNOI - cumulativeInterest - cumulativeDepreciation - incomeTax;
    totalRetainedEarnings += netIncome;
    
    // Cash = Operating Reserve + Cumulative Cash Flow from Operations
    // Cash Flow = NOI - Debt Service (principal + interest) - Taxes
    const cumulativeDebtService = cumulativeInterest + cumulativePrincipal;
    const cashFromOperations = cumulativeNOI - cumulativeDebtService - incomeTax;
    totalCumulativeCashFlow += cashFromOperations;
    totalCashReserves += operatingReserve;
  });
  
  // Total cash = initial reserves + cumulative cash from operations
  const totalCash = totalCashReserves + totalCumulativeCashFlow;

  const netPropertyValue = totalPropertyValue - totalAccumulatedDepreciation;
  const totalAssets = netPropertyValue + totalCash;
  const totalLiabilities = totalDebtOutstanding;
  const totalEquity = totalInitialEquity + totalRetainedEarnings;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consolidated Balance Sheet</CardTitle>
        <p className="text-sm text-muted-foreground">As of December 31, {displayYear}</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Account</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-muted/30">
              <TableCell colSpan={2} className="font-bold text-accent">ASSETS</TableCell>
            </TableRow>
            
            <TableRow>
              <TableCell className="pl-6 font-medium">Current Assets</TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-10">Cash & Cash Equivalents</TableCell>
              <TableCell className="text-right"><Money amount={totalCash} /></TableCell>
            </TableRow>
            <TableRow className="bg-primary/5">
              <TableCell className="pl-6 font-medium">Total Current Assets</TableCell>
              <TableCell className="text-right font-medium"><Money amount={totalCash} /></TableCell>
            </TableRow>

            <TableRow className="h-2 border-none"><TableCell colSpan={2}></TableCell></TableRow>

            <TableRow>
              <TableCell className="pl-6 font-medium">Fixed Assets</TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-10">Property, Plant & Equipment</TableCell>
              <TableCell className="text-right"><Money amount={totalPropertyValue} /></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-10">Less: Accumulated Depreciation</TableCell>
              <TableCell className="text-right"><Money amount={-totalAccumulatedDepreciation} /></TableCell>
            </TableRow>
            <TableRow className="bg-primary/5">
              <TableCell className="pl-6 font-medium">Net Fixed Assets</TableCell>
              <TableCell className="text-right font-medium"><Money amount={netPropertyValue} /></TableCell>
            </TableRow>

            <TableRow className="h-2 border-none"><TableCell colSpan={2}></TableCell></TableRow>

            <TableRow className="bg-primary/10 font-bold">
              <TableCell>TOTAL ASSETS</TableCell>
              <TableCell className="text-right"><Money amount={totalAssets} /></TableCell>
            </TableRow>

            <TableRow className="h-4 border-none"><TableCell colSpan={2}></TableCell></TableRow>

            <TableRow className="bg-muted/30">
              <TableCell colSpan={2} className="font-bold text-accent">LIABILITIES</TableCell>
            </TableRow>
            
            <TableRow>
              <TableCell className="pl-6 font-medium">Long-Term Liabilities</TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-10">Mortgage Notes Payable</TableCell>
              <TableCell className="text-right"><Money amount={totalDebtOutstanding} /></TableCell>
            </TableRow>
            <TableRow className="bg-primary/10 font-bold">
              <TableCell>TOTAL LIABILITIES</TableCell>
              <TableCell className="text-right"><Money amount={totalLiabilities} /></TableCell>
            </TableRow>

            <TableRow className="h-4 border-none"><TableCell colSpan={2}></TableCell></TableRow>

            <TableRow className="bg-muted/30">
              <TableCell colSpan={2} className="font-bold text-accent">EQUITY</TableCell>
            </TableRow>
            
            <TableRow>
              <TableCell className="pl-6">Paid-In Capital</TableCell>
              <TableCell className="text-right"><Money amount={totalInitialEquity} /></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">Retained Earnings</TableCell>
              <TableCell className="text-right"><Money amount={totalRetainedEarnings} /></TableCell>
            </TableRow>
            <TableRow className="bg-primary/10 font-bold">
              <TableCell>TOTAL EQUITY</TableCell>
              <TableCell className="text-right"><Money amount={totalEquity} /></TableCell>
            </TableRow>

            <TableRow className="h-2 border-none"><TableCell colSpan={2}></TableCell></TableRow>

            <TableRow className="bg-gradient-to-r from-primary/80 via-primary/60 to-primary/40 backdrop-blur-sm font-bold text-primary-foreground">
              <TableCell>TOTAL LIABILITIES & EQUITY</TableCell>
              <TableCell className="text-right"><Money amount={totalLiabilities + totalEquity} /></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
