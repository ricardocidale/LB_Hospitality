import { MonthlyFinancials } from "@/lib/financialEngine";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Money } from "@/components/Money";

interface Props {
  data: MonthlyFinancials[];
  property: {
    purchasePrice: number;
    buildingImprovements: number;
    preOpeningCosts: number;
    operatingReserve: number;
    type: string;
  };
  years?: number;
  startYear?: number;
}

interface YearlyCashFlow {
  year: number;
  noi: number;
  debtService: number;
  cashFlowFromOperations: number;
  capitalExpenditures: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
}

function aggregateCashFlowByYear(data: MonthlyFinancials[], property: Props['property'], years: number): YearlyCashFlow[] {
  const result: YearlyCashFlow[] = [];
  let cumulative = 0;
  
  const totalInvestment = property.purchasePrice + property.buildingImprovements + 
                          property.preOpeningCosts + property.operatingReserve;
  const equityInvested = property.type === "Financed" ? totalInvestment * 0.25 : totalInvestment;
  
  for (let y = 0; y < years; y++) {
    const yearData = data.slice(y * 12, (y + 1) * 12);
    if (yearData.length === 0) continue;
    
    const noi = yearData.reduce((a, m) => a + m.noi, 0);
    const debtService = yearData.reduce((a, m) => a + m.debtPayment, 0);
    const cashFlowFromOps = yearData.reduce((a, m) => a + m.cashFlow, 0);
    
    const capex = y === 0 ? -equityInvested : 0;
    const netCash = cashFlowFromOps + capex;
    cumulative += netCash;
    
    result.push({
      year: y + 1,
      noi,
      debtService,
      cashFlowFromOperations: cashFlowFromOps,
      capitalExpenditures: capex,
      netCashFlow: netCash,
      cumulativeCashFlow: cumulative,
    });
  }
  
  return result;
}

export function YearlyCashFlowStatement({ data, property, years = 5, startYear = 2026 }: Props) {
  const yearlyData = aggregateCashFlowByYear(data, property, years);
  
  const totalInvestment = property.purchasePrice + property.buildingImprovements + 
                          property.preOpeningCosts + property.operatingReserve;
  const equityInvested = property.type === "Financed" ? totalInvestment * 0.25 : totalInvestment;
  
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[250px] font-bold">Statement of Cash Flows</TableHead>
              {yearlyData.map((y) => (
                <TableHead key={y.year} className="text-right min-w-[120px] font-bold">
                  {startYear + y.year - 1}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-muted/30">
              <TableCell colSpan={years + 1} className="font-bold text-primary">Cash Flow from Operations</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">Net Operating Income</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right"><Money amount={y.noi} /></TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">Less: Debt Service</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-muted-foreground">
                  {y.debtService > 0 ? <Money amount={-y.debtService} /> : '-'}
                </TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-primary/10 font-bold">
              <TableCell>Net Cash from Operations</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right">
                  <Money amount={y.cashFlowFromOperations} />
                </TableCell>
              ))}
            </TableRow>

            <TableRow className="h-4 border-none"><TableCell colSpan={years + 1}></TableCell></TableRow>

            <TableRow className="bg-muted/30">
              <TableCell colSpan={years + 1} className="font-bold text-primary">Cash Flow from Investing</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">Initial Equity Investment</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-muted-foreground">
                  {y.capitalExpenditures < 0 ? <Money amount={y.capitalExpenditures} /> : '-'}
                </TableCell>
              ))}
            </TableRow>

            <TableRow className="h-4 border-none"><TableCell colSpan={years + 1}></TableCell></TableRow>

            <TableRow className="bg-accent/10 font-bold">
              <TableCell>Net Cash Flow</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className={cn("text-right", y.netCashFlow >= 0 && "text-accent")}>
                  <Money amount={y.netCashFlow} />
                </TableCell>
              ))}
            </TableRow>

            <TableRow className="bg-gradient-to-r from-primary/80 via-primary/60 to-primary/40 backdrop-blur-sm font-bold text-primary-foreground shadow-sm">
              <TableCell>Cumulative Cash Flow</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right">
                  <Money amount={y.cumulativeCashFlow} className={y.cumulativeCashFlow < 0 ? "text-red-200" : ""} />
                </TableCell>
              ))}
            </TableRow>

            <TableRow className="h-4 border-none"><TableCell colSpan={years + 1}></TableCell></TableRow>

            <TableRow className="bg-muted/30">
              <TableCell colSpan={years + 1} className="font-bold text-primary">Key Metrics</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">Cash on Cash Return</TableCell>
              {yearlyData.map((y) => {
                const cocReturn = equityInvested > 0 ? (y.cashFlowFromOperations / equityInvested) * 100 : 0;
                return (
                  <TableCell key={y.year} className={cn("text-right font-medium", cocReturn > 0 ? "text-accent" : "text-muted-foreground")}>
                    {equityInvested > 0 ? `${cocReturn.toFixed(1)}%` : '-'}
                  </TableCell>
                );
              })}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">Debt Service Coverage Ratio</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right font-medium">
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
