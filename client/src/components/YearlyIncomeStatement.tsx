import { MonthlyFinancials } from "@/lib/financialEngine";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Money } from "@/components/Money";

interface Props {
  data: MonthlyFinancials[];
  years?: number;
  startYear?: number;
}

interface YearlyData {
  year: number;
  soldRooms: number;
  availableRooms: number;
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
      soldRooms: yearData.reduce((a, m) => a + m.soldRooms, 0),
      availableRooms: yearData.reduce((a, m) => a + m.availableRooms, 0),
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
    <Card className="overflow-hidden bg-white shadow-lg border border-gray-100">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="w-[250px] font-bold text-gray-900">Income Statement</TableHead>
              {yearlyData.map((y) => (
                <TableHead key={y.year} className="text-right min-w-[120px] font-bold text-gray-900">
                  {startYear + y.year - 1}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-gray-50">
              <TableCell colSpan={years + 1} className="font-bold text-[#257D41]">Revenue</TableCell>
            </TableRow>
            <TableRow className="bg-white">
              <TableCell className="pl-10 text-gray-500 label-text">ADR</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-gray-500 font-mono">
                  <Money amount={y.soldRooms > 0 ? y.revenueRooms / y.soldRooms : 0} />
                </TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-white">
              <TableCell className="pl-10 text-gray-500 label-text">Occupancy</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-gray-500 font-mono">
                  {y.availableRooms > 0 ? ((y.soldRooms / y.availableRooms) * 100).toFixed(1) : 0}%
                </TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-white">
              <TableCell className="pl-10 text-gray-500 label-text">RevPAR</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-gray-500 font-mono">
                  <Money amount={y.availableRooms > 0 ? y.revenueRooms / y.availableRooms : 0} />
                </TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-white">
              <TableCell className="pl-6 text-gray-700">Room Revenue</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-gray-700"><Money amount={y.revenueRooms} /></TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-white">
              <TableCell className="pl-6 text-gray-700">Food & Beverage</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-gray-700"><Money amount={y.revenueFB} /></TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-white">
              <TableCell className="pl-6 text-gray-700">Events & Functions</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-gray-700"><Money amount={y.revenueEvents} /></TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-white">
              <TableCell className="pl-6 text-gray-700">Other Revenue</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-gray-700"><Money amount={y.revenueOther} /></TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-[#257D41]/10 font-bold">
              <TableCell className="text-gray-900">Total Revenue</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-[#257D41]"><Money amount={y.revenueTotal} /></TableCell>
              ))}
            </TableRow>

            <TableRow className="h-2 border-none bg-white"><TableCell colSpan={years + 1}></TableCell></TableRow>

            <TableRow className="bg-gray-50">
              <TableCell colSpan={years + 1} className="font-bold text-[#257D41]">Operating Expenses</TableCell>
            </TableRow>
            <TableRow className="bg-white">
              <TableCell className="pl-6 text-gray-700">Housekeeping</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-gray-700"><Money amount={y.expenseRooms} /></TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-white">
              <TableCell className="pl-6 text-gray-700">Food & Beverage</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-gray-700"><Money amount={y.expenseFB} /></TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-white">
              <TableCell className="pl-6 text-gray-700">Events & Functions</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-gray-700"><Money amount={y.expenseEvents} /></TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-white">
              <TableCell className="pl-6 text-gray-700">Other Departments</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-gray-700"><Money amount={y.expenseOther} /></TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-white">
              <TableCell className="pl-6 text-gray-700">Sales & Marketing</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-gray-700"><Money amount={y.expenseMarketing} /></TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-white">
              <TableCell className="pl-6 text-gray-700">Property Operations</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-gray-700"><Money amount={y.expensePropertyOps} /></TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-white">
              <TableCell className="pl-6 text-gray-700">Utilities</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-gray-700"><Money amount={y.expenseUtilities} /></TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-white">
              <TableCell className="pl-6 text-gray-700">Administrative & General</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-gray-700"><Money amount={y.expenseAdmin} /></TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-white">
              <TableCell className="pl-6 text-gray-700">IT & Technology</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-gray-700"><Money amount={y.expenseIT} /></TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-white">
              <TableCell className="pl-6 text-gray-700">Insurance</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-gray-700"><Money amount={y.expenseInsurance} /></TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-white">
              <TableCell className="pl-6 text-gray-700">Property Taxes</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-gray-700"><Money amount={y.expenseTaxes} /></TableCell>
              ))}
            </TableRow>

            <TableRow className="h-2 border-none bg-white"><TableCell colSpan={years + 1}></TableCell></TableRow>

            <TableRow className="bg-[#3B82F6]/10 font-bold">
              <TableCell className="text-gray-900">Gross Operating Profit (GOP)</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-[#3B82F6]"><Money amount={y.gop} /></TableCell>
              ))}
            </TableRow>

            <TableRow className="h-2 border-none bg-white"><TableCell colSpan={years + 1}></TableCell></TableRow>

            <TableRow className="bg-gray-50">
              <TableCell colSpan={years + 1} className="font-bold text-[#257D41]">Non-Operating Expenses</TableCell>
            </TableRow>
            <TableRow className="bg-white">
              <TableCell className="pl-6 text-gray-700">Base Management Fee</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-gray-700"><Money amount={y.feeBase} /></TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-white">
              <TableCell className="pl-6 text-gray-700">Incentive Management Fee</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-gray-700"><Money amount={y.feeIncentive} /></TableCell>
              ))}
            </TableRow>
            <TableRow className="bg-white">
              <TableCell className="pl-6 text-gray-700">FF&E Reserve</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-gray-700"><Money amount={y.expenseFFE} /></TableCell>
              ))}
            </TableRow>

            <TableRow className="h-2 border-none bg-white"><TableCell colSpan={years + 1}></TableCell></TableRow>

            <TableRow className="bg-[#F4795B]/10 font-bold">
              <TableCell className="text-gray-900">Net Operating Income (NOI)</TableCell>
              {yearlyData.map((y) => (
                <TableCell key={y.year} className="text-right text-[#F4795B]"><Money amount={y.noi} /></TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
