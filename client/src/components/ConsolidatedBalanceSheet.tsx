import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Money } from "@/components/Money";
import { Property } from "@shared/schema";
import { MonthlyFinancials, getFiscalYearForModelYear } from "@/lib/financialEngine";
import { GlobalResponse } from "@/lib/api";
import {
  calculateLoanParams,
  calculateRefinanceParams,
  getOutstandingDebtAtYear,
  calculateYearlyDebtService,
  LoanParams,
  GlobalLoanParams,
  DEFAULT_TAX_RATE,
  DEFAULT_LAND_VALUE_PERCENT,
  PROJECTION_YEARS
} from "@/lib/loanCalculations";

interface Props {
  properties: Property[];
  global: GlobalResponse;
  allProFormas: { property: Property; data: MonthlyFinancials[] }[];
  year: number;
}

export function ConsolidatedBalanceSheet({ properties, global, allProFormas, year }: Props) {
  const projectionYears = global?.projectionYears ?? PROJECTION_YEARS;
  const fiscalYearStartMonth = global.fiscalYearStartMonth ?? 1;
  const displayYear = global.modelStartDate 
    ? getFiscalYearForModelYear(global.modelStartDate, fiscalYearStartMonth, year)
    : 2026 + year;
  
  let totalPropertyValue = 0;
  let totalAccumulatedDepreciation = 0;
  let totalCashReserves = 0;
  let totalDebtOutstanding = 0;
  let totalInitialEquity = 0;
  let totalRetainedEarnings = 0;
  let totalCumulativeCashFlow = 0;
  let totalRefinanceProceeds = 0;

  properties.forEach((prop, idx) => {
    const proForma = allProFormas[idx]?.data || [];
    const monthsToInclude = year * 12;
    const relevantMonths = proForma.slice(0, monthsToInclude);
    
    // Convert property to LoanParams format for shared calculations
    const loanParams: LoanParams = {
      purchasePrice: prop.purchasePrice,
      buildingImprovements: prop.buildingImprovements,
      preOpeningCosts: prop.preOpeningCosts || 0,
      operatingReserve: prop.operatingReserve || 0,
      type: prop.type,
      acquisitionDate: prop.acquisitionDate,
      taxRate: prop.taxRate,
      acquisitionLTV: prop.acquisitionLTV,
      acquisitionInterestRate: prop.acquisitionInterestRate,
      acquisitionTermYears: prop.acquisitionTermYears,
      willRefinance: prop.willRefinance,
      refinanceDate: prop.refinanceDate,
      refinanceLTV: prop.refinanceLTV,
      refinanceInterestRate: prop.refinanceInterestRate,
      refinanceTermYears: prop.refinanceTermYears,
      refinanceClosingCostRate: prop.refinanceClosingCostRate,
      exitCapRate: prop.exitCapRate,
    };
    
    const globalLoanParams: GlobalLoanParams = {
      modelStartDate: global.modelStartDate,
      commissionRate: global.commissionRate,
      debtAssumptions: global.debtAssumptions as {
        acqLTV?: number;
        interestRate?: number;
        amortizationYears?: number;
        refiLTV?: number;
        refiClosingCostRate?: number;
      },
    };
    
    // Use shared loan calculations for consistent debt handling
    const loan = calculateLoanParams(loanParams, globalLoanParams);
    
    // Determine acquisition year (0-indexed from model start)
    const acqYear = Math.floor(loan.acqMonthsFromModelStart / 12);
    
    // Property not yet acquired - skip all balance sheet entries
    if (year <= acqYear) {
      return; // No assets, liabilities, or equity before acquisition
    }
    
    // Fixed Assets: Depreciable basis (land doesn't depreciate per IRS / ASC 360)
    const landPct = prop.landValuePercent ?? DEFAULT_LAND_VALUE_PERCENT;
    const propertyBasis = prop.purchasePrice * (1 - landPct) + prop.buildingImprovements;
    totalPropertyValue += propertyBasis;
    
    // Get yearly NOI data for refinance calculations
    const yearlyNOIData: number[] = [];
    for (let y = 0; y < projectionYears; y++) {
      const yearData = proForma.slice(y * 12, (y + 1) * 12);
      yearlyNOIData.push(yearData.reduce((sum, m) => sum + m.noi, 0));
    }
    
    // Calculate refinance parameters using shared module
    const refi = calculateRefinanceParams(loanParams, globalLoanParams, loan, yearlyNOIData, projectionYears);
    
    // Use shared function to get debt outstanding at year-end (handles both acq and refi loans)
    const debtOutstanding = getOutstandingDebtAtYear(loan, refi, year - 1);
    totalDebtOutstanding += debtOutstanding;
    
    // Accumulated Depreciation: 27.5-year straight-line on building value (GAAP for residential real estate)
    // Only depreciate from acquisition date
    const yearsDepreciated = Math.max(0, Math.min(year - acqYear, projectionYears));
    const annualDepreciation = loan.annualDepreciation;
    totalAccumulatedDepreciation += annualDepreciation * yearsDepreciated;
    
    // Initial operating reserve (only after acquisition)
    const operatingReserve = prop.operatingReserve || 0;
    totalCashReserves += operatingReserve;
    
    // Initial equity investment (what investors put in - only after acquisition)
    totalInitialEquity += loan.equityInvested;
    
    // Calculate cumulative interest and principal using shared debt service calculation
    let cumulativeInterest = 0;
    let cumulativePrincipal = 0;
    let refiProceedsReceived = 0;
    
    for (let y = 0; y < year; y++) {
      const debtService = calculateYearlyDebtService(loan, refi, y);
      cumulativeInterest += debtService.interestExpense;
      cumulativePrincipal += debtService.principalPayment;
      
      // Track refinance proceeds in the year they occur
      if (y === refi.refiYear && refi.refiProceeds > 0) {
        refiProceedsReceived = refi.refiProceeds;
      }
    }
    totalRefinanceProceeds += refiProceedsReceived;
    
    // GAAP Retained Earnings = Cumulative Net Income
    // Net Income = NOI - Interest Expense - Depreciation - Income Taxes
    const cumulativeNOI = relevantMonths.reduce((sum, m) => sum + m.noi, 0);
    const cumulativeDepreciation = annualDepreciation * yearsDepreciated;
    const taxRate = prop.taxRate || DEFAULT_TAX_RATE;
    
    // Taxable Income = NOI - Interest - Depreciation
    const taxableIncome = cumulativeNOI - cumulativeInterest - cumulativeDepreciation;
    const incomeTax = Math.max(0, taxableIncome) * taxRate;
    
    // Net Income (GAAP) = NOI - Interest - Depreciation - Tax
    const netIncome = cumulativeNOI - cumulativeInterest - cumulativeDepreciation - incomeTax;
    totalRetainedEarnings += netIncome;
    
    // Cash Position = Operating Reserve + Cash from Operations + Financing Proceeds
    // Cash from Operations = NOI - Debt Service (principal + interest) - Taxes
    // Financing Proceeds = Refinancing cash-out (separate from operating activities per GAAP)
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
