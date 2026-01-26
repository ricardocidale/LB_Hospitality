import { MonthlyFinancials, formatMoney } from "@/lib/financialEngine";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props {
  data: MonthlyFinancials[];
  years?: number;
  startYear?: number;
}

interface YearlyData {
  year: number;
  revenueRooms: number;
  revenueFB: number;
  revenueEvents: number;
  revenueOther: number;
  revenueTotal: number;
  expenseRooms: number;
  expenseFB: number;
  expenseEvents: number;
  expenseOther: number;
  expenseMarketing: number;
  expensePropertyOps: number;
  expenseUtilities: number;
  expenseAdmin: number;
  expenseIT: number;
  expenseInsurance: number;
  expenseTaxes: number;
  expenseFFE: number;
  feeBase: number;
  feeIncentive: number;
  gop: number;
  noi: number;
}

function aggregateByYear(data: MonthlyFinancials[], years: number): YearlyData[] {
  const result: YearlyData[] = [];
  
  for (let y = 0; y < years; y++) {
    const yearData = data.slice(y * 12, (y + 1) * 12);
    if (yearData.length === 0) continue;
    
    result.push({
      year: y + 1,
      revenueRooms: yearData.reduce((a, m) => a + m.revenueRooms, 0),
      revenueFB: yearData.reduce((a, m) => a + m.revenueFB, 0),
      revenueEvents: yearData.reduce((a, m) => a + m.revenueEvents, 0),
      revenueOther: yearData.reduce((a, m) => a + m.revenueOther, 0),
      revenueTotal: yearData.reduce((a, m) => a + m.revenueTotal, 0),
      expenseRooms: yearData.reduce((a, m) => a + m.expenseRooms, 0),
      expenseFB: yearData.reduce((a, m) => a + m.expenseFB, 0),
      expenseEvents: yearData.reduce((a, m) => a + m.expenseEvents, 0),
      expenseOther: yearData.reduce((a, m) => a + m.expenseOther, 0),
      expenseMarketing: yearData.reduce((a, m) => a + m.expenseMarketing, 0),
      expensePropertyOps: yearData.reduce((a, m) => a + m.expensePropertyOps, 0),
      expenseUtilities: yearData.reduce((a, m) => a + m.expenseUtilitiesVar + m.expenseUtilitiesFixed, 0),
      expenseAdmin: yearData.reduce((a, m) => a + m.expenseAdmin, 0),
      expenseIT: yearData.reduce((a, m) => a + m.expenseIT, 0),
      expenseInsurance: yearData.reduce((a, m) => a + m.expenseInsurance, 0),
      expenseTaxes: yearData.reduce((a, m) => a + m.expenseTaxes, 0),
      expenseFFE: yearData.reduce((a, m) => a + m.expenseFFE, 0),
      feeBase: yearData.reduce((a, m) => a + m.feeBase, 0),
      feeIncentive: yearData.reduce((a, m) => a + m.feeIncentive, 0),
      gop: yearData.reduce((a, m) => a + m.gop, 0),
      noi: yearData.reduce((a, m) => a + m.noi, 0),
    });
  }
  
  return result;
}

export function YearlyIncomeStatement({ data, years = 5, startYear = 2026 }: Props) {
  const yearlyData = aggregateByYear(data, years);
  
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[250px] font-bold">Income Statement</TableHead>
              {yearlyData.map((y) => (
                <TableHead key={y.year} className="text-right min-w-[120px] font-bold">
                  {startYear + y.year - 1}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-muted/30">
              <TableCell colSpan={years + 1} className="font-bold text-primary">Revenue</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">Room Revenue</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right">{formatMoney(y.revenueRooms)}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">Food & Beverage</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right">{formatMoney(y.revenueFB)}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">Events & Functions</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right">{formatMoney(y.revenueEvents)}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">Other Revenue</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right">{formatMoney(y.revenueOther)}</TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-primary/10 font-bold">
              <TableCell>Total Revenue</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-primary">{formatMoney(y.revenueTotal)}</TableCell>
              ))}
            </TableRow>

            <TableRow className="h-2 border-none"><TableCell colSpan={years + 1}></TableCell></TableRow>

            <TableRow className="bg-muted/30">
              <TableCell colSpan={years + 1} className="font-bold text-primary">Operating Expenses</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">Rooms Department</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right">{formatMoney(y.expenseRooms)}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">Food & Beverage</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right">{formatMoney(y.expenseFB)}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">Events & Functions</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right">{formatMoney(y.expenseEvents)}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">Other Departments</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right">{formatMoney(y.expenseOther)}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">Sales & Marketing</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right">{formatMoney(y.expenseMarketing)}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">Property Operations</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right">{formatMoney(y.expensePropertyOps)}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">Utilities</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right">{formatMoney(y.expenseUtilities)}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">Administrative & General</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right">{formatMoney(y.expenseAdmin)}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">IT & Technology</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right">{formatMoney(y.expenseIT)}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">Insurance</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right">{formatMoney(y.expenseInsurance)}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">Property Taxes</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right">{formatMoney(y.expenseTaxes)}</TableCell>
              ))}
            </TableRow>

            <TableRow className="h-2 border-none"><TableCell colSpan={years + 1}></TableCell></TableRow>

            <TableRow className="bg-accent/10 font-bold">
              <TableCell>Gross Operating Profit (GOP)</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-accent">{formatMoney(y.gop)}</TableCell>
              ))}
            </TableRow>

            <TableRow className="h-2 border-none"><TableCell colSpan={years + 1}></TableCell></TableRow>

            <TableRow className="bg-muted/30">
              <TableCell colSpan={years + 1} className="font-bold text-primary">Non-Operating Expenses</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">Base Management Fee</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right">{formatMoney(y.feeBase)}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">Incentive Management Fee</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right">{formatMoney(y.feeIncentive)}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="pl-6">FF&E Reserve</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right">{formatMoney(y.expenseFFE)}</TableCell>
              ))}
            </TableRow>

            <TableRow className="h-2 border-none"><TableCell colSpan={years + 1}></TableCell></TableRow>

            <TableRow className="bg-primary font-bold text-primary-foreground text-lg">
              <TableCell>Net Operating Income (NOI)</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right">{formatMoney(y.noi)}</TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
