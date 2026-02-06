import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Money } from "@/components/Money";
import { Property } from "@shared/schema";
import { MonthlyFinancials, getFiscalYearForModelYear } from "@/lib/financialEngine";
import { GlobalResponse } from "@/lib/api";
import {
  DEFAULT_LTV,
  DEFAULT_LAND_VALUE_PERCENT,
  PROJECTION_YEARS,
  DEPRECIATION_YEARS
} from "@/lib/constants";

interface Props {
  properties: Property[];
  global: GlobalResponse;
  allProFormas: { property: Property; data: MonthlyFinancials[] }[];
  year: number;
  /** Optional: show a single property instead of consolidated */
  propertyIndex?: number;
}

export function ConsolidatedBalanceSheet({ properties, global, allProFormas, year, propertyIndex }: Props) {
  const projectionYears = global?.projectionYears ?? PROJECTION_YEARS;
  const fiscalYearStartMonth = global.fiscalYearStartMonth ?? 1;
  const displayYear = global.modelStartDate
    ? getFiscalYearForModelYear(global.modelStartDate, fiscalYearStartMonth, year)
    : 2026 + year;

  // If propertyIndex is provided, only show that property; otherwise show all
  const propertiesToShow = propertyIndex !== undefined
    ? [{ prop: properties[propertyIndex], idx: propertyIndex }]
    : properties.map((prop, idx) => ({ prop, idx }));

  let totalPropertyValue = 0;
  let totalAccumulatedDepreciation = 0;
  let totalCashReserves = 0;
  let totalDebtOutstanding = 0;
  let totalInitialEquity = 0;
  let totalRetainedEarnings = 0;
  let totalCumulativeCashFlow = 0;
  let totalRefinanceProceeds = 0;

  propertiesToShow.forEach(({ prop, idx }) => {
    const proForma = allProFormas[idx]?.data || [];
    const monthsToInclude = year * 12;
    const relevantMonths = proForma.slice(0, monthsToInclude);

    // Determine acquisition year from dates (no loanCalculations dependency)
    const modelStart = new Date(global.modelStartDate);
    const acqDate = prop.acquisitionDate ? new Date(prop.acquisitionDate) : new Date(prop.operationsStartDate);
    const acqMonthsFromModelStart = Math.max(0,
      (acqDate.getFullYear() - modelStart.getFullYear()) * 12 +
      (acqDate.getMonth() - modelStart.getMonth()));
    const acqYear = Math.floor(acqMonthsFromModelStart / 12);

    // Property not yet acquired - skip all balance sheet entries
    if (year < acqYear) {
      return;
    }

    // Fixed Assets: Full property value (land + building + improvements)
    const totalPropValue = prop.purchasePrice + prop.buildingImprovements;
    totalPropertyValue += totalPropValue;

    // Accumulated Depreciation: sum monthly depreciation from engine data
    const accDepForProp = relevantMonths.reduce((sum, m) => sum + m.depreciationExpense, 0);
    totalAccumulatedDepreciation += accDepForProp;

    // Initial operating reserve (only after acquisition)
    const operatingReserve = prop.operatingReserve ?? 0;
    totalCashReserves += operatingReserve;

    // Equity invested: compute inline (no loanCalculations dependency)
    const totalInvestment = prop.purchasePrice + prop.buildingImprovements +
      (prop.preOpeningCosts ?? 0) + operatingReserve;
    const totalPropVal = prop.purchasePrice + prop.buildingImprovements;
    const ltv = prop.acquisitionLTV ?? (global.debtAssumptions as any)?.acqLTV ?? DEFAULT_LTV;
    const loanAmount = prop.type === "Financed" ? totalPropVal * ltv : 0;
    const equityInvested = totalInvestment - loanAmount;
    totalInitialEquity += equityInvested;

    // Debt outstanding: from last month of the year period (engine data)
    const lastMonthIdx = monthsToInclude - 1;
    const debtOutstanding = lastMonthIdx >= 0 && lastMonthIdx < proForma.length
      ? proForma[lastMonthIdx].debtOutstanding
      : 0;
    totalDebtOutstanding += debtOutstanding;

    // Cumulative interest and principal from engine monthly data
    let cumulativeInterest = 0;
    let cumulativePrincipal = 0;
    let refiProceedsReceived = 0;

    for (let m = 0; m < relevantMonths.length; m++) {
      cumulativeInterest += relevantMonths[m].interestExpense;
      cumulativePrincipal += relevantMonths[m].principalPayment;
      refiProceedsReceived += relevantMonths[m].refinancingProceeds;
    }
    totalRefinanceProceeds += refiProceedsReceived;

    // GAAP Retained Earnings = Cumulative Net Income from engine
    const netIncome = relevantMonths.reduce((sum, m) => sum + m.netIncome, 0);
    totalRetainedEarnings += netIncome;

    // Cash Position = cumulative cash flow from engine (NOI - debt service - taxes)
    const cumulativeNOI = relevantMonths.reduce((sum, m) => sum + m.noi, 0);
    const incomeTax = relevantMonths.reduce((sum, m) => sum + m.incomeTax, 0);
    const cumulativeDebtService = cumulativeInterest + cumulativePrincipal;
    const operatingCashFlow = cumulativeNOI - cumulativeDebtService - incomeTax;
    totalCumulativeCashFlow += operatingCashFlow;
  });

  // Total cash = initial reserves + operating cash flow + refinancing proceeds (financing activity)
  const totalCash = totalCashReserves + totalCumulativeCashFlow + totalRefinanceProceeds;

  const netPropertyValue = totalPropertyValue - totalAccumulatedDepreciation;
  const totalAssets = netPropertyValue + totalCash;
  const totalLiabilities = totalDebtOutstanding;
  const totalEquity = totalInitialEquity + totalRetainedEarnings;

  const title = propertyIndex !== undefined
    ? `Balance Sheet — ${properties[propertyIndex]?.name}`
    : "Consolidated Balance Sheet";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
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
