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

  properties.forEach((prop, idx) => {
    const proForma = allProFormas[idx]?.data || [];
    
    const propertyBasis = prop.purchasePrice + prop.buildingImprovements;
    totalPropertyValue += propertyBasis;
    
    const annualDepreciation = propertyBasis / 27.5;
    totalAccumulatedDepreciation += annualDepreciation * Math.min(year, 10);
    
    totalCashReserves += prop.operatingReserve || 0;
    
    const isFinanced = prop.type === 'Financed';
    const ltv = prop.acquisitionLTV || 0;
    const loanAmount = isFinanced ? (prop.purchasePrice + prop.buildingImprovements) * ltv : 0;
    
    if (loanAmount > 0 && isFinanced) {
      const rate = (prop.acquisitionInterestRate || 0.065) / 12;
      const term = (prop.acquisitionTermYears || 25) * 12;
      const monthlyPayment = loanAmount * (rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
      
      let balance = loanAmount;
      const monthsElapsed = year * 12;
      for (let m = 0; m < monthsElapsed && m < term; m++) {
        const interestPayment = balance * rate;
        const principalPayment = monthlyPayment - interestPayment;
        balance -= principalPayment;
      }
      totalDebtOutstanding += Math.max(0, balance);
    }
    
    const equityInvested = prop.purchasePrice + prop.buildingImprovements + 
                          (prop.preOpeningCosts || 0) + (prop.operatingReserve || 0) - loanAmount;
    totalInitialEquity += equityInvested;
    
    const yearlyNOI = proForma
      .filter(m => {
        const monthYear = new Date(m.date).getFullYear();
        return monthYear <= modelStartYear + year;
      })
      .reduce((sum, m) => sum + m.noi, 0);
    
    const yearlyDebtPayment = proForma
      .filter(m => {
        const monthYear = new Date(m.date).getFullYear();
        return monthYear <= modelStartYear + year;
      })
      .reduce((sum, m) => sum + m.debtPayment, 0);
    
    totalRetainedEarnings += yearlyNOI - yearlyDebtPayment;
  });

  const netPropertyValue = totalPropertyValue - totalAccumulatedDepreciation;
  const totalAssets = netPropertyValue + totalCashReserves;
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
              <TableCell className="pl-10">Cash & Operating Reserves</TableCell>
              <TableCell className="text-right"><Money amount={totalCashReserves} /></TableCell>
            </TableRow>
            <TableRow className="bg-primary/5">
              <TableCell className="pl-6 font-medium">Total Current Assets</TableCell>
              <TableCell className="text-right font-medium"><Money amount={totalCashReserves} /></TableCell>
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
