import Layout from "@/components/Layout";
import { useProperties, useGlobalAssumptions } from "@/lib/api";
import { generatePropertyProForma, formatMoney, getFiscalYearForModelYear } from "@/lib/financialEngine";
import { Money } from "@/components/Money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronRight, ChevronDown, FileDown, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { ConsolidatedBalanceSheet } from "@/components/ConsolidatedBalanceSheet";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  calculateLoanParams, 
  calculateRefinanceParams, 
  calculateYearlyDebtService, 
  calculateExitValue,
  getAcquisitionYear,
  getOutstandingDebtAtYear,
  LoanParams,
  GlobalLoanParams
} from "@/lib/loanCalculations";

export default function Dashboard() {
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: global, isLoading: globalLoading } = useGlobalAssumptions();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("overview");

  const toggleRow = (rowId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  if (propertiesLoading || globalLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!properties || !global) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">No data available. Please check the database.</p>
        </div>
      </Layout>
    );
  }

  const fiscalYearStartMonth = global.fiscalYearStartMonth ?? 1;
  const getFiscalYear = (yearIndex: number) => getFiscalYearForModelYear(global.modelStartDate, fiscalYearStartMonth, yearIndex);

  const allPropertyFinancials = properties.map(p => {
    const financials = generatePropertyProForma(p, global, 120);
    return { property: p, financials };
  });

  const getYearlyConsolidated = (yearIndex: number) => {
    const startMonth = yearIndex * 12;
    const endMonth = startMonth + 12;
    
    let totals = {
      revenueRooms: 0,
      revenueEvents: 0,
      revenueFB: 0,
      revenueOther: 0,
      revenueTotal: 0,
      expenseRooms: 0,
      expenseFB: 0,
      expenseEvents: 0,
      expenseOther: 0,
      expenseMarketing: 0,
      expensePropertyOps: 0,
      expenseUtilitiesVar: 0,
      expenseFFE: 0,
      expenseAdmin: 0,
      expenseIT: 0,
      expenseInsurance: 0,
      expenseTaxes: 0,
      expenseUtilitiesFixed: 0,
      expenseOtherCosts: 0,
      feeBase: 0,
      feeIncentive: 0,
      totalExpenses: 0,
      gop: 0,
      noi: 0,
      debtPayment: 0,
      cashFlow: 0
    };

    allPropertyFinancials.forEach(({ financials }) => {
      const yearData = financials.slice(startMonth, endMonth);
      yearData.forEach(m => {
        totals.revenueRooms += m.revenueRooms;
        totals.revenueEvents += m.revenueEvents;
        totals.revenueFB += m.revenueFB;
        totals.revenueOther += m.revenueOther;
        totals.revenueTotal += m.revenueTotal;
        totals.expenseRooms += m.expenseRooms;
        totals.expenseFB += m.expenseFB;
        totals.expenseEvents += m.expenseEvents;
        totals.expenseOther += m.expenseOther;
        totals.expenseMarketing += m.expenseMarketing;
        totals.expensePropertyOps += m.expensePropertyOps;
        totals.expenseUtilitiesVar += m.expenseUtilitiesVar;
        totals.expenseFFE += m.expenseFFE;
        totals.expenseAdmin += m.expenseAdmin;
        totals.expenseIT += m.expenseIT;
        totals.expenseInsurance += m.expenseInsurance;
        totals.expenseTaxes += m.expenseTaxes;
        totals.expenseUtilitiesFixed += m.expenseUtilitiesFixed;
        totals.expenseOtherCosts += m.expenseOtherCosts;
        totals.feeBase += m.feeBase;
        totals.feeIncentive += m.feeIncentive;
        totals.totalExpenses += m.totalExpenses;
        totals.gop += m.gop;
        totals.noi += m.noi;
        totals.debtPayment += m.debtPayment;
        totals.cashFlow += m.cashFlow;
      });
    });

    return totals;
  };

  const getPropertyYearly = (propIndex: number, yearIndex: number) => {
    const startMonth = yearIndex * 12;
    const endMonth = startMonth + 12;
    const { financials } = allPropertyFinancials[propIndex];
    const yearData = financials.slice(startMonth, endMonth);
    
    return {
      revenueTotal: yearData.reduce((a, m) => a + m.revenueTotal, 0),
      revenueRooms: yearData.reduce((a, m) => a + m.revenueRooms, 0),
      revenueEvents: yearData.reduce((a, m) => a + m.revenueEvents, 0),
      revenueFB: yearData.reduce((a, m) => a + m.revenueFB, 0),
      revenueOther: yearData.reduce((a, m) => a + m.revenueOther, 0),
      gop: yearData.reduce((a, m) => a + m.gop, 0),
      noi: yearData.reduce((a, m) => a + m.noi, 0),
      feeBase: yearData.reduce((a, m) => a + m.feeBase, 0),
      feeIncentive: yearData.reduce((a, m) => a + m.feeIncentive, 0),
      debtPayment: yearData.reduce((a, m) => a + m.debtPayment, 0),
      cashFlow: yearData.reduce((a, m) => a + m.cashFlow, 0)
    };
  };

  const year1Data = getYearlyConsolidated(0);
  const portfolioTotalRevenue = year1Data.revenueTotal;
  const portfolioTotalGOP = year1Data.gop;
  const activeProperties = properties.filter(p => p.status === "Operational" || p.status === "Development").length;
  const managementFees = year1Data.feeBase + year1Data.feeIncentive;

  // Calculate comprehensive investment overview metrics
  const totalProperties = properties.length;
  const totalRooms = properties.reduce((sum, p) => sum + p.roomCount, 0);
  const totalPurchasePrice = properties.reduce((sum, p) => sum + p.purchasePrice, 0);
  const totalBuildingImprovements = properties.reduce((sum, p) => sum + p.buildingImprovements, 0);
  const totalPreOpeningCosts = properties.reduce((sum, p) => sum + (p.preOpeningCosts || 0), 0);
  const totalOperatingReserve = properties.reduce((sum, p) => sum + (p.operatingReserve || 0), 0);
  const totalInvestment = totalPurchasePrice + totalBuildingImprovements + totalPreOpeningCosts + totalOperatingReserve;
  const avgPurchasePrice = totalPurchasePrice / totalProperties;
  const avgRoomsPerProperty = totalRooms / totalProperties;
  const avgADR = properties.reduce((sum, p) => sum + p.startAdr, 0) / totalProperties;
  
  // 10-year projections
  let total10YearRevenue = 0;
  let total10YearNOI = 0;
  let total10YearCashFlow = 0;
  for (let y = 0; y < 10; y++) {
    const yearData = getYearlyConsolidated(y);
    total10YearRevenue += yearData.revenueTotal;
    total10YearNOI += yearData.noi;
    total10YearCashFlow += yearData.cashFlow;
  }
  
  // Calculate weighted average exit cap rate
  const avgExitCapRate = properties.reduce((sum, p) => sum + (p.exitCapRate || 0.085), 0) / totalProperties;
  
  // Year 10 NOI for exit value calculation
  const year10Data = getYearlyConsolidated(9);
  const year10NOI = year10Data.noi;
  const projectedExitValue = year10NOI / avgExitCapRate;
  
  // Geographic distribution
  const marketCounts = properties.reduce((acc, p) => {
    acc[p.market] = (acc[p.market] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Investment horizon
  const investmentHorizon = 10;

  // Convert property data to LoanParams format for shared utilities
  const toGlobalLoanParams = (): GlobalLoanParams => ({
    modelStartDate: global.modelStartDate,
    commissionRate: global.commissionRate,
    debtAssumptions: global.debtAssumptions
  });

  const toLoanParams = (prop: any): LoanParams => ({
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
    exitCapRate: prop.exitCapRate
  });

  const getPropertyYearlyNOI = (propIndex: number): number[] => {
    const { financials } = allPropertyFinancials[propIndex];
    const yearlyNOI: number[] = [];
    for (let y = 0; y < 10; y++) {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      yearlyNOI.push(yearData.reduce((a: number, m: any) => a + m.noi, 0));
    }
    return yearlyNOI;
  };

  const getPropertyAcquisitionYear = (prop: any): number => {
    const loanParams = toLoanParams(prop);
    const globalParams = toGlobalLoanParams();
    const loan = calculateLoanParams(loanParams, globalParams);
    return getAcquisitionYear(loan);
  };

  const getPropertyInvestment = (prop: any) => {
    const loanParams = toLoanParams(prop);
    const globalParams = toGlobalLoanParams();
    const loan = calculateLoanParams(loanParams, globalParams);
    return loan.equityInvested;
  };

  const getEquityInvestmentForYear = (yearIndex: number): number => {
    let total = 0;
    properties.forEach(prop => {
      const acqYear = getPropertyAcquisitionYear(prop);
      if (acqYear === yearIndex) {
        total += getPropertyInvestment(prop);
      }
    });
    return total;
  };

  const getAnnualDepreciation = (prop: any) => {
    const loanParams = toLoanParams(prop);
    const globalParams = toGlobalLoanParams();
    const loan = calculateLoanParams(loanParams, globalParams);
    return loan.annualDepreciation;
  };

  const getPropertyExitValue = (prop: any, propIndex: number) => {
    const loanParams = toLoanParams(prop);
    const globalParams = toGlobalLoanParams();
    const yearlyNOI = getPropertyYearlyNOI(propIndex);
    const loan = calculateLoanParams(loanParams, globalParams);
    const refi = calculateRefinanceParams(loanParams, globalParams, loan, yearlyNOI, 10);
    return calculateExitValue(yearlyNOI[9], loan, refi, 9, prop.exitCapRate);
  };

  const getPropertyYearlyDetails = (prop: any, propIndex: number, yearIndex: number) => {
    const loanParams = toLoanParams(prop);
    const globalParams = toGlobalLoanParams();
    const yearlyNOI = getPropertyYearlyNOI(propIndex);
    const loan = calculateLoanParams(loanParams, globalParams);
    const refi = calculateRefinanceParams(loanParams, globalParams, loan, yearlyNOI, 10);
    
    const noi = yearlyNOI[yearIndex];
    const debt = calculateYearlyDebtService(loan, refi, yearIndex);
    
    const btcf = noi - debt.debtService;
    const taxableIncome = noi - debt.interestExpense - loan.annualDepreciation;
    const taxLiability = taxableIncome > 0 ? taxableIncome * loan.taxRate : 0;
    const atcf = btcf - taxLiability;
    
    return { 
      noi, 
      debtService: debt.debtService, 
      interestPortion: debt.interestExpense, 
      depreciation: loan.annualDepreciation, 
      btcf, 
      taxableIncome, 
      taxLiability, 
      atcf 
    };
  };

  const getConsolidatedYearlyDetails = (yearIndex: number) => {
    let totalNOI = 0;
    let totalDebtService = 0;
    let totalInterest = 0;
    let totalDepreciation = 0;
    let totalBTCF = 0;
    let totalTaxableIncome = 0;
    let totalTax = 0;
    let totalATCF = 0;

    properties.forEach((prop, idx) => {
      const details = getPropertyYearlyDetails(prop, idx, yearIndex);
      totalNOI += details.noi;
      totalDebtService += details.debtService;
      totalInterest += details.interestPortion;
      totalDepreciation += details.depreciation;
      totalBTCF += details.btcf;
      totalTaxableIncome += details.taxableIncome;
      totalTax += details.taxLiability;
      totalATCF += details.atcf;
    });

    return {
      noi: totalNOI,
      debtService: totalDebtService,
      interestPortion: totalInterest,
      depreciation: totalDepreciation,
      btcf: totalBTCF,
      taxableIncome: totalTaxableIncome,
      taxLiability: totalTax,
      atcf: totalATCF
    };
  };

  const getPropertyRefinanceProceeds = (prop: any, propIndex: number) => {
    const loanParams = toLoanParams(prop);
    const globalParams = toGlobalLoanParams();
    const yearlyNOI = getPropertyYearlyNOI(propIndex);
    const loan = calculateLoanParams(loanParams, globalParams);
    const refi = calculateRefinanceParams(loanParams, globalParams, loan, yearlyNOI, 10);
    return { year: refi.refiYear, proceeds: refi.refiProceeds };
  };

  const getConsolidatedCashFlows = (): number[] => {
    const flows: number[] = [];
    const year0Investment = getEquityInvestmentForYear(0);
    flows.push(-year0Investment);
    
    for (let y = 0; y < 10; y++) {
      const consolidated = getConsolidatedYearlyDetails(y);
      let yearCashFlow = consolidated.atcf;
      
      const yearInvestment = getEquityInvestmentForYear(y + 1);
      if (yearInvestment > 0) yearCashFlow -= yearInvestment;
      
      properties.forEach((prop, idx) => {
        const refi = getPropertyRefinanceProceeds(prop, idx);
        if (y === refi.year) {
          yearCashFlow += refi.proceeds;
        }
        
        if (y === 9) {
          yearCashFlow += getPropertyExitValue(prop, idx);
        }
      });
      
      flows.push(yearCashFlow);
    }
    return flows;
  };

  const consolidatedFlows = getConsolidatedCashFlows();
  const portfolioIRR = calculateIRR(consolidatedFlows);
  const totalInitialEquity = properties.reduce((sum, prop) => sum + getPropertyInvestment(prop), 0);
  const totalExitValue = properties.reduce((sum, prop, idx) => sum + getPropertyExitValue(prop, idx), 0);
  const totalCashReturned = consolidatedFlows.slice(1).reduce((sum, cf) => sum + cf, 0);
  const equityMultiple = totalInitialEquity > 0 ? totalCashReturned / totalInitialEquity : 0;
  
  const operatingCashFlows = consolidatedFlows.slice(1).map((cf, idx) => {
    let exitValue = 0;
    if (idx === 9) {
      exitValue = properties.reduce((sum, prop, propIdx) => sum + getPropertyExitValue(prop, propIdx), 0);
    }
    return cf - exitValue;
  });
  const avgAnnualCashFlow = operatingCashFlows.reduce((sum, cf) => sum + cf, 0) / 10;
  const cashOnCash = totalInitialEquity > 0 ? (avgAnnualCashFlow / totalInitialEquity) * 100 : 0;

  const generateIncomeStatementData = () => {
    const years = Array.from({ length: 10 }, (_, i) => getFiscalYear(i));
    const rows: { category: string; values: number[]; isHeader?: boolean; indent?: number }[] = [];
    
    rows.push({ category: "Total Revenue", values: years.map((_, i) => getYearlyConsolidated(i).revenueTotal), isHeader: true });
    rows.push({ category: "Rooms Revenue", values: years.map((_, i) => getYearlyConsolidated(i).revenueRooms), indent: 1 });
    rows.push({ category: "Events Revenue", values: years.map((_, i) => getYearlyConsolidated(i).revenueEvents), indent: 1 });
    rows.push({ category: "F&B Revenue", values: years.map((_, i) => getYearlyConsolidated(i).revenueFB), indent: 1 });
    rows.push({ category: "Other Revenue", values: years.map((_, i) => getYearlyConsolidated(i).revenueOther), indent: 1 });
    
    properties.forEach((prop, idx) => {
      rows.push({ 
        category: `  ${prop.name}`, 
        values: years.map((_, i) => getPropertyYearly(idx, i).revenueTotal), 
        indent: 2 
      });
    });
    
    rows.push({ 
      category: "Operating Expenses", 
      values: years.map((_, i) => {
        const data = getYearlyConsolidated(i);
        return data.expenseRooms + data.expenseFB + data.expenseEvents + data.expenseOther + 
          data.expenseMarketing + data.expensePropertyOps + data.expenseUtilitiesVar + 
          data.expenseAdmin + data.expenseIT + data.expenseInsurance + data.expenseTaxes + 
          data.expenseUtilitiesFixed + data.expenseOtherCosts;
      }), 
      isHeader: true 
    });
    rows.push({ category: "Rooms Expense", values: years.map((_, i) => getYearlyConsolidated(i).expenseRooms), indent: 1 });
    rows.push({ category: "F&B Expense", values: years.map((_, i) => getYearlyConsolidated(i).expenseFB), indent: 1 });
    rows.push({ category: "Events Expense", values: years.map((_, i) => getYearlyConsolidated(i).expenseEvents), indent: 1 });
    rows.push({ category: "Marketing", values: years.map((_, i) => getYearlyConsolidated(i).expenseMarketing), indent: 1 });
    rows.push({ category: "Property Ops", values: years.map((_, i) => getYearlyConsolidated(i).expensePropertyOps), indent: 1 });
    rows.push({ category: "Admin", values: years.map((_, i) => getYearlyConsolidated(i).expenseAdmin), indent: 1 });
    rows.push({ category: "IT", values: years.map((_, i) => getYearlyConsolidated(i).expenseIT), indent: 1 });
    rows.push({ category: "Insurance", values: years.map((_, i) => getYearlyConsolidated(i).expenseInsurance), indent: 1 });
    rows.push({ category: "Taxes", values: years.map((_, i) => getYearlyConsolidated(i).expenseTaxes), indent: 1 });
    rows.push({ category: "Utilities", values: years.map((_, i) => getYearlyConsolidated(i).expenseUtilitiesVar + getYearlyConsolidated(i).expenseUtilitiesFixed), indent: 1 });
    rows.push({ category: "FF&E Reserve", values: years.map((_, i) => getYearlyConsolidated(i).expenseFFE), indent: 1 });
    rows.push({ category: "Other Expenses", values: years.map((_, i) => getYearlyConsolidated(i).expenseOther + getYearlyConsolidated(i).expenseOtherCosts), indent: 1 });
    
    rows.push({ category: "Gross Operating Profit", values: years.map((_, i) => getYearlyConsolidated(i).gop), isHeader: true });
    
    properties.forEach((prop, idx) => {
      rows.push({ 
        category: prop.name, 
        values: years.map((_, i) => getPropertyYearly(idx, i).gop), 
        indent: 1 
      });
    });
    
    rows.push({ category: "Management Fees", values: years.map((_, i) => getYearlyConsolidated(i).feeBase + getYearlyConsolidated(i).feeIncentive), isHeader: true });
    rows.push({ category: "Base Fee", values: years.map((_, i) => getYearlyConsolidated(i).feeBase), indent: 1 });
    rows.push({ category: "Incentive Fee", values: years.map((_, i) => getYearlyConsolidated(i).feeIncentive), indent: 1 });
    
    rows.push({ category: "Net Operating Income", values: years.map((_, i) => getYearlyConsolidated(i).noi), isHeader: true });
    
    properties.forEach((prop, idx) => {
      rows.push({ 
        category: prop.name, 
        values: years.map((_, i) => getPropertyYearly(idx, i).noi), 
        indent: 1 
      });
    });
    
    return { years, rows };
  };

  const exportIncomeStatementToPDF = () => {
    const { years, rows } = generateIncomeStatementData();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    doc.setFontSize(18);
    doc.text("L+B Hospitality Group - Portfolio Income Statement", 14, 15);
    doc.setFontSize(10);
    doc.text(`10-Year Projection (${years[0]} - ${years[9]})`, 14, 22);
    doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy')}`, 14, 27);
    
    const tableData = rows.map(row => [
      (row.indent ? '  '.repeat(row.indent) : '') + row.category,
      ...row.values.map(v => formatMoney(v))
    ]);
    
    autoTable(doc, {
      head: [['Category', ...years.map(String)]],
      body: tableData,
      startY: 32,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [159, 188, 164], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 45 } },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index !== undefined) {
          const row = rows[data.row.index];
          if (row?.isHeader) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 240, 240];
          }
        }
      }
    });
    
    doc.save('income-statement.pdf');
  };

  const exportIncomeStatementToCSV = () => {
    const { years, rows } = generateIncomeStatementData();
    
    const headers = ['Category', ...years.map(String)];
    const csvRows = [
      headers.join(','),
      ...rows.map(row => [
        `"${(row.indent ? '  '.repeat(row.indent) : '') + row.category}"`,
        ...row.values.map(v => v.toFixed(2))
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'income-statement.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateCashFlowData = () => {
    const years = Array.from({ length: 10 }, (_, i) => getFiscalYear(i));
    const rows: { category: string; values: number[]; isHeader?: boolean; indent?: number; isNegative?: boolean }[] = [];
    
    rows.push({ category: "CASH INFLOWS (Revenue)", values: years.map((_, i) => getYearlyConsolidated(i).revenueTotal), isHeader: true });
    rows.push({ category: "Rooms Revenue", values: years.map((_, i) => getYearlyConsolidated(i).revenueRooms), indent: 1 });
    rows.push({ category: "Events Revenue", values: years.map((_, i) => getYearlyConsolidated(i).revenueEvents), indent: 1 });
    rows.push({ category: "F&B Revenue", values: years.map((_, i) => getYearlyConsolidated(i).revenueFB), indent: 1 });
    rows.push({ category: "Other Revenue", values: years.map((_, i) => getYearlyConsolidated(i).revenueOther), indent: 1 });
    
    properties.forEach((prop, idx) => {
      rows.push({ 
        category: prop.name, 
        values: years.map((_, i) => getPropertyYearly(idx, i).revenueTotal), 
        indent: 2 
      });
    });
    
    rows.push({ 
      category: "CASH OUTFLOWS (Operating)", 
      values: years.map((_, i) => {
        const data = getYearlyConsolidated(i);
        return -(data.expenseRooms + data.expenseFB + data.expenseEvents + data.expenseOther + 
          data.expenseMarketing + data.expensePropertyOps + data.expenseUtilitiesVar + 
          data.expenseAdmin + data.expenseIT + data.expenseInsurance + data.expenseTaxes + 
          data.expenseUtilitiesFixed + data.expenseOtherCosts);
      }), 
      isHeader: true,
      isNegative: true
    });
    
    rows.push({ category: "Direct Costs", values: years.map((_, i) => {
      const d = getYearlyConsolidated(i);
      return -(d.expenseRooms + d.expenseFB + d.expenseEvents + d.expenseOther);
    }), indent: 1, isNegative: true });
    rows.push({ category: "Rooms Expense", values: years.map((_, i) => -getYearlyConsolidated(i).expenseRooms), indent: 2, isNegative: true });
    rows.push({ category: "F&B Expense", values: years.map((_, i) => -getYearlyConsolidated(i).expenseFB), indent: 2, isNegative: true });
    rows.push({ category: "Events Expense", values: years.map((_, i) => -getYearlyConsolidated(i).expenseEvents), indent: 2, isNegative: true });
    rows.push({ category: "Other Direct", values: years.map((_, i) => -getYearlyConsolidated(i).expenseOther), indent: 2, isNegative: true });
    
    rows.push({ category: "Overhead & Admin", values: years.map((_, i) => {
      const d = getYearlyConsolidated(i);
      return -(d.expenseAdmin + d.expenseMarketing + d.expensePropertyOps + d.expenseUtilitiesVar + 
        d.expenseUtilitiesFixed + d.expenseIT + d.expenseInsurance + d.expenseTaxes + d.expenseOtherCosts);
    }), indent: 1, isNegative: true });
    rows.push({ category: "Admin & General", values: years.map((_, i) => -getYearlyConsolidated(i).expenseAdmin), indent: 2, isNegative: true });
    rows.push({ category: "Marketing", values: years.map((_, i) => -getYearlyConsolidated(i).expenseMarketing), indent: 2, isNegative: true });
    rows.push({ category: "Property Operations", values: years.map((_, i) => -getYearlyConsolidated(i).expensePropertyOps), indent: 2, isNegative: true });
    rows.push({ category: "Utilities", values: years.map((_, i) => -(getYearlyConsolidated(i).expenseUtilitiesVar + getYearlyConsolidated(i).expenseUtilitiesFixed)), indent: 2, isNegative: true });
    rows.push({ category: "IT Systems", values: years.map((_, i) => -getYearlyConsolidated(i).expenseIT), indent: 2, isNegative: true });
    rows.push({ category: "Insurance", values: years.map((_, i) => -getYearlyConsolidated(i).expenseInsurance), indent: 2, isNegative: true });
    rows.push({ category: "Property Taxes", values: years.map((_, i) => -getYearlyConsolidated(i).expenseTaxes), indent: 2, isNegative: true });
    rows.push({ category: "Other Expenses", values: years.map((_, i) => -getYearlyConsolidated(i).expenseOtherCosts), indent: 2, isNegative: true });
    
    rows.push({ category: "GROSS OPERATING PROFIT (GOP)", values: years.map((_, i) => getYearlyConsolidated(i).gop), isHeader: true });
    
    rows.push({ category: "Management Fees (to L+B Co.)", values: years.map((_, i) => -(getYearlyConsolidated(i).feeBase + getYearlyConsolidated(i).feeIncentive)), isNegative: true });
    rows.push({ category: `Base Fee (${(global.baseManagementFee * 100).toFixed(0)}% of Revenue)`, values: years.map((_, i) => -getYearlyConsolidated(i).feeBase), indent: 1, isNegative: true });
    rows.push({ category: `Incentive Fee (${(global.incentiveManagementFee * 100).toFixed(0)}% of GOP)`, values: years.map((_, i) => -getYearlyConsolidated(i).feeIncentive), indent: 1, isNegative: true });
    
    rows.push({ category: "FF&E Reserve", values: years.map((_, i) => -getYearlyConsolidated(i).expenseFFE), isNegative: true });
    
    rows.push({ category: "NET OPERATING INCOME (NOI)", values: years.map((_, i) => getYearlyConsolidated(i).noi), isHeader: true });
    
    rows.push({ category: "Debt Service", values: years.map((_, i) => -getYearlyConsolidated(i).debtPayment), isNegative: true });
    properties.filter(p => p.type === 'Financed').forEach((prop) => {
      const propIdx = properties.findIndex(p => p.id === prop.id);
      rows.push({ 
        category: prop.name, 
        values: years.map((_, i) => -getPropertyYearly(propIdx, i).debtPayment), 
        indent: 1,
        isNegative: true
      });
    });
    
    rows.push({ category: "NET CASH FLOW", values: years.map((_, i) => getYearlyConsolidated(i).cashFlow), isHeader: true });
    
    const graphData = {
      revenuePerformance: years.map((_, i) => ({
        year: years[i],
        revenue: getYearlyConsolidated(i).revenueTotal,
        opCosts: getYearlyConsolidated(i).totalExpenses,
        noi: getYearlyConsolidated(i).noi
      })),
      cashFlowAfterFinancing: years.map((_, i) => ({
        year: years[i],
        noi: getYearlyConsolidated(i).noi,
        debtService: getYearlyConsolidated(i).debtPayment,
        netCashFlow: getYearlyConsolidated(i).cashFlow
      }))
    };
    
    return { years, rows, graphData };
  };

  const exportCashFlowToPDF = () => {
    const { years, rows, graphData } = generateCashFlowData();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    doc.setFontSize(18);
    doc.text("L+B Hospitality Group - Cash Flow Statement", 14, 15);
    doc.setFontSize(10);
    doc.text(`10-Year Projection (${years[0]} - ${years[9]})`, 14, 22);
    doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy')}`, 14, 27);
    
    const tableData = rows.map(row => [
      (row.indent ? '  '.repeat(row.indent) : '') + row.category,
      ...row.values.map(v => {
        if (row.isNegative && v < 0) return `(${formatMoney(Math.abs(v))})`;
        return formatMoney(v);
      })
    ]);
    
    autoTable(doc, {
      head: [['Category', ...years.map(String)]],
      body: tableData,
      startY: 32,
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [159, 188, 164], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 50 } },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index !== undefined) {
          const row = rows[data.row.index];
          if (row?.isHeader) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 240, 240];
          }
        }
      }
    });
    
    doc.addPage();
    doc.setFontSize(14);
    doc.text("Revenue & Operating Performance", 14, 15);
    
    autoTable(doc, {
      head: [['Year', 'Revenue', 'Operating Costs', 'NOI']],
      body: graphData.revenuePerformance.map(d => [
        String(d.year),
        formatMoney(d.revenue),
        formatMoney(d.opCosts),
        formatMoney(d.noi)
      ]),
      startY: 20,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [92, 107, 192], textColor: [255, 255, 255], fontStyle: 'bold' }
    });
    
    const graphTableY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text("Cash Flow After Financing", 14, graphTableY);
    
    autoTable(doc, {
      head: [['Year', 'NOI', 'Debt Service', 'Net Cash Flow']],
      body: graphData.cashFlowAfterFinancing.map(d => [
        String(d.year),
        formatMoney(d.noi),
        d.debtService > 0 ? `(${formatMoney(d.debtService)})` : '-',
        formatMoney(d.netCashFlow)
      ]),
      startY: graphTableY + 5,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [37, 125, 65], textColor: [255, 255, 255], fontStyle: 'bold' }
    });
    
    doc.save('cash-flow-statement.pdf');
  };

  const exportCashFlowToCSV = () => {
    const { years, rows, graphData } = generateCashFlowData();
    const headers = ['Category', ...years.map(String)];
    const csvRows = [
      headers.join(','),
      ...rows.map(row => [
        `"${(row.indent ? '  '.repeat(row.indent) : '') + row.category}"`,
        ...row.values.map(v => v.toFixed(2))
      ].join(',')),
      '',
      '',
      'REVENUE & OPERATING PERFORMANCE',
      ['Year', 'Revenue', 'Operating Costs', 'NOI'].join(','),
      ...graphData.revenuePerformance.map(d => [d.year, d.revenue.toFixed(2), d.opCosts.toFixed(2), d.noi.toFixed(2)].join(',')),
      '',
      'CASH FLOW AFTER FINANCING',
      ['Year', 'NOI', 'Debt Service', 'Net Cash Flow'].join(','),
      ...graphData.cashFlowAfterFinancing.map(d => [d.year, d.noi.toFixed(2), d.debtService.toFixed(2), d.netCashFlow.toFixed(2)].join(','))
    ];
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cash-flow-statement.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateBalanceSheetData = () => {
    const years = Array.from({ length: 10 }, (_, i) => getFiscalYear(i));
    const rows: { category: string; values: number[]; isHeader?: boolean; indent?: number; isNegative?: boolean }[] = [];
    
    const totalPropertyValue = properties.reduce((sum, p) => sum + p.purchasePrice + p.buildingImprovements, 0);
    const totalOperatingReserves = properties.reduce((sum, p) => sum + (p.operatingReserve || 0), 0);
    
    const getYearlyBalanceSheet = (yearIndex: number) => {
      const monthsToInclude = (yearIndex + 1) * 12;
      
      let totalDebtOutstanding = 0;
      let totalInitialEquity = 0;
      let totalRetainedEarnings = 0;
      let totalCumulativeCashFlow = 0;
      
      properties.forEach((prop, idx) => {
        const proForma = allPropertyFinancials[idx]?.financials || [];
        const relevantMonths = proForma.slice(0, monthsToInclude);
        
        const propertyBasis = prop.purchasePrice + prop.buildingImprovements;
        const annualDepreciation = propertyBasis / 27.5;
        
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
        
        const equityInvested = propertyBasis + (prop.preOpeningCosts || 0) + (prop.operatingReserve || 0) - loanAmount;
        totalInitialEquity += equityInvested;
        
        const cumulativeNOI = relevantMonths.reduce((sum, m) => sum + m.noi, 0);
        const cumulativeDepreciation = annualDepreciation * Math.min(yearIndex + 1, 10);
        const taxRate = prop.taxRate || 0.25;
        const taxableIncome = cumulativeNOI - cumulativeInterest - cumulativeDepreciation;
        const incomeTax = Math.max(0, taxableIncome) * taxRate;
        const netIncome = cumulativeNOI - cumulativeInterest - cumulativeDepreciation - incomeTax;
        totalRetainedEarnings += netIncome;
        
        const cumulativeDebtService = cumulativeInterest + cumulativePrincipal;
        const cashFromOperations = cumulativeNOI - cumulativeDebtService - incomeTax;
        totalCumulativeCashFlow += cashFromOperations;
      });
      
      const accumulatedDepreciation = (totalPropertyValue / 27.5) * Math.min(yearIndex + 1, 10);
      const totalCash = totalOperatingReserves + totalCumulativeCashFlow;
      const netPropertyValue = totalPropertyValue - accumulatedDepreciation;
      const totalAssets = netPropertyValue + totalCash;
      const totalLiabilities = totalDebtOutstanding;
      const totalEquity = totalInitialEquity + totalRetainedEarnings;
      
      return {
        cash: totalCash,
        totalCurrentAssets: totalCash,
        propertyValue: totalPropertyValue,
        accumulatedDepreciation: -accumulatedDepreciation,
        netFixedAssets: netPropertyValue,
        totalAssets,
        mortgageNotesPayable: totalDebtOutstanding,
        totalLiabilities,
        paidInCapital: totalInitialEquity,
        retainedEarnings: totalRetainedEarnings,
        totalEquity
      };
    };
    
    rows.push({ category: "ASSETS", values: years.map(() => 0), isHeader: true });
    rows.push({ category: "Current Assets", values: years.map(() => 0), indent: 1, isHeader: true });
    rows.push({ category: "Cash & Cash Equivalents", values: years.map((_, i) => getYearlyBalanceSheet(i).cash), indent: 2 });
    rows.push({ category: "Total Current Assets", values: years.map((_, i) => getYearlyBalanceSheet(i).totalCurrentAssets), indent: 1, isHeader: true });
    rows.push({ category: "Fixed Assets", values: years.map(() => 0), indent: 1, isHeader: true });
    rows.push({ category: "Property, Plant & Equipment", values: years.map((_, i) => getYearlyBalanceSheet(i).propertyValue), indent: 2 });
    rows.push({ category: "Less: Accumulated Depreciation", values: years.map((_, i) => getYearlyBalanceSheet(i).accumulatedDepreciation), indent: 2, isNegative: true });
    rows.push({ category: "Net Fixed Assets", values: years.map((_, i) => getYearlyBalanceSheet(i).netFixedAssets), indent: 1, isHeader: true });
    rows.push({ category: "TOTAL ASSETS", values: years.map((_, i) => getYearlyBalanceSheet(i).totalAssets), isHeader: true });
    
    rows.push({ category: "", values: years.map(() => 0) });
    rows.push({ category: "LIABILITIES", values: years.map(() => 0), isHeader: true });
    rows.push({ category: "Long-Term Liabilities", values: years.map(() => 0), indent: 1, isHeader: true });
    rows.push({ category: "Mortgage Notes Payable", values: years.map((_, i) => getYearlyBalanceSheet(i).mortgageNotesPayable), indent: 2 });
    rows.push({ category: "TOTAL LIABILITIES", values: years.map((_, i) => getYearlyBalanceSheet(i).totalLiabilities), isHeader: true });
    
    rows.push({ category: "", values: years.map(() => 0) });
    rows.push({ category: "EQUITY", values: years.map(() => 0), isHeader: true });
    rows.push({ category: "Paid-In Capital", values: years.map((_, i) => getYearlyBalanceSheet(i).paidInCapital), indent: 1 });
    rows.push({ category: "Retained Earnings", values: years.map((_, i) => getYearlyBalanceSheet(i).retainedEarnings), indent: 1 });
    rows.push({ category: "TOTAL EQUITY", values: years.map((_, i) => getYearlyBalanceSheet(i).totalEquity), isHeader: true });
    
    rows.push({ category: "", values: years.map(() => 0) });
    rows.push({ category: "TOTAL LIABILITIES & EQUITY", values: years.map((_, i) => {
      const bs = getYearlyBalanceSheet(i);
      return bs.totalLiabilities + bs.totalEquity;
    }), isHeader: true });
    
    return { years, rows };
  };

  const exportBalanceSheetToPDF = () => {
    const { years, rows } = generateBalanceSheetData();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    doc.setFontSize(18);
    doc.text("L+B Hospitality Group - Consolidated Balance Sheet", 14, 15);
    doc.setFontSize(10);
    doc.text(`10-Year Projection (${years[0]} - ${years[9]})`, 14, 22);
    doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy')}`, 14, 27);
    
    const tableData = rows.map(row => [
      (row.indent ? '  '.repeat(row.indent) : '') + row.category,
      ...row.values.map(v => {
        if (row.category === '' || (v === 0 && row.isHeader && !row.category.includes('TOTAL'))) return '';
        if (row.isNegative && v < 0) return `(${formatMoney(Math.abs(v))})`;
        return formatMoney(v);
      })
    ]);
    
    autoTable(doc, {
      head: [['Category', ...years.map(String)]],
      body: tableData,
      startY: 32,
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [159, 188, 164], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 55 } },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index !== undefined) {
          const row = rows[data.row.index];
          if (row?.isHeader) {
            data.cell.styles.fontStyle = 'bold';
            if (row.category.includes('TOTAL') || row.category === 'ASSETS' || row.category === 'LIABILITIES' || row.category === 'EQUITY') {
              data.cell.styles.fillColor = [240, 240, 240];
            }
          }
        }
      }
    });
    
    doc.save('balance-sheet.pdf');
  };

  const exportBalanceSheetToCSV = () => {
    const { years, rows } = generateBalanceSheetData();
    const headers = ['Category', ...years.map(String)];
    const csvRows = [
      headers.join(','),
      ...rows.filter(row => row.category !== '').map(row => [
        `"${(row.indent ? '  '.repeat(row.indent) : '') + row.category}"`,
        ...row.values.map(v => v.toFixed(2))
      ].join(','))
    ];
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'balance-sheet.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateInvestmentAnalysisData = () => {
    const years = ['Initial', ...Array.from({ length: 10 }, (_, i) => String(getFiscalYear(i)))];
    const rows: { category: string; values: (number | string)[]; isHeader?: boolean; indent?: number; isNegative?: boolean }[] = [];
    
    const getEquityForYear = (yearIdx: number): number => {
      let total = 0;
      properties.forEach(prop => {
        const acqDate = new Date(prop.acquisitionDate);
        const modelStart = new Date(global.modelStartDate);
        const monthsDiff = (acqDate.getFullYear() - modelStart.getFullYear()) * 12 + 
                           (acqDate.getMonth() - modelStart.getMonth());
        const acqYear = Math.floor(monthsDiff / 12);
        if (acqYear === yearIdx) {
          const totalInvestment = prop.purchasePrice + prop.buildingImprovements + 
                                  prop.preOpeningCosts + prop.operatingReserve;
          if (prop.type === "Financed") {
            const ltv = prop.acquisitionLTV || (global.debtAssumptions as any)?.acqLTV || 0.75;
            total += totalInvestment * (1 - ltv);
          } else {
            total += totalInvestment;
          }
        }
      });
      return total;
    };
    
    const getYearDetails = (yearIdx: number) => {
      let totalNOI = 0, totalDebtService = 0, totalInterest = 0, totalDepreciation = 0;
      let totalBTCF = 0, totalTaxableIncome = 0, totalTax = 0, totalATCF = 0;
      
      properties.forEach((prop, idx) => {
        const yearlyData = getPropertyYearly(idx, yearIdx);
        const noi = yearlyData.noi || 0;
        totalNOI += noi;
        
        const propertyBasis = prop.purchasePrice + prop.buildingImprovements;
        const depreciation = propertyBasis / 27.5;
        totalDepreciation += depreciation;
        
        if (prop.type === "Financed") {
          const ltv = prop.acquisitionLTV || (global.debtAssumptions as any)?.acqLTV || 0.75;
          const loanAmount = propertyBasis * ltv;
          const annualRate = prop.acquisitionInterestRate || (global.debtAssumptions as any)?.interestRate || 0.09;
          const r = annualRate / 12;
          const termYears = prop.acquisitionTermYears || (global.debtAssumptions as any)?.amortizationYears || 25;
          const n = termYears * 12;
          
          if (r > 0 && n > 0 && loanAmount > 0) {
            const monthlyPayment = (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
            totalDebtService += monthlyPayment * 12;
            
            let balance = loanAmount;
            let yearInterest = 0;
            const startMonth = yearIdx * 12;
            const endMonth = startMonth + 12;
            for (let m = 0; m < endMonth && m < n; m++) {
              const interestPayment = balance * r;
              const principalPayment = monthlyPayment - interestPayment;
              if (m >= startMonth) yearInterest += interestPayment;
              balance -= principalPayment;
            }
            totalInterest += yearInterest;
          }
        }
        
        const taxRate = prop.taxRate || 0.25;
        const btcf = noi - (prop.type === "Financed" ? getPropertyYearly(idx, yearIdx).debtPayment || 0 : 0);
        totalBTCF += btcf;
        
        const taxableIncome = noi - totalInterest - depreciation;
        totalTaxableIncome += taxableIncome;
        const tax = taxableIncome > 0 ? taxableIncome * taxRate : 0;
        totalTax += tax;
        totalATCF += btcf - tax;
      });
      
      return { noi: totalNOI, debtService: totalDebtService, interest: totalInterest, 
               depreciation: totalDepreciation, btcf: totalBTCF, 
               taxableIncome: totalTaxableIncome, tax: totalTax, atcf: totalATCF };
    };
    
    rows.push({ category: "EQUITY INVESTMENT", values: [
      -getEquityForYear(0),
      ...Array.from({ length: 10 }, (_, i) => {
        const eq = getEquityForYear(i + 1);
        return eq > 0 ? -eq : '';
      })
    ], isHeader: true, isNegative: true });
    
    properties.forEach(prop => {
      const acqDate = new Date(prop.acquisitionDate);
      const modelStart = new Date(global.modelStartDate);
      const monthsDiff = (acqDate.getFullYear() - modelStart.getFullYear()) * 12 + 
                         (acqDate.getMonth() - modelStart.getMonth());
      const acqYear = Math.floor(monthsDiff / 12);
      const totalInvestment = prop.purchasePrice + prop.buildingImprovements + 
                              prop.preOpeningCosts + prop.operatingReserve;
      const investment = prop.type === "Financed" ? 
        totalInvestment * (1 - (prop.acquisitionLTV || (global.debtAssumptions as any)?.acqLTV || 0.75)) : 
        totalInvestment;
      
      const values: (number | string)[] = Array(11).fill('');
      if (acqYear >= 0 && acqYear <= 10) {
        values[acqYear] = -investment;
      }
      rows.push({ category: prop.name, values, indent: 1, isNegative: true });
    });
    
    rows.push({ category: "", values: Array(11).fill('') });
    rows.push({ category: "OPERATING CASH FLOW", values: Array(11).fill(''), isHeader: true });
    
    rows.push({ category: "Net Operating Income (NOI)", values: [
      '-',
      ...Array.from({ length: 10 }, (_, i) => getYearDetails(i).noi)
    ], indent: 1 });
    
    rows.push({ category: "Less: Debt Service", values: [
      '-',
      ...Array.from({ length: 10 }, (_, i) => {
        const ds = getYearDetails(i).debtService;
        return ds > 0 ? -ds : '-';
      })
    ], indent: 1, isNegative: true });
    
    rows.push({ category: "Before-Tax Cash Flow", values: [
      '-',
      ...Array.from({ length: 10 }, (_, i) => getYearDetails(i).btcf)
    ], indent: 1 });
    
    rows.push({ category: "", values: Array(11).fill('') });
    rows.push({ category: "TAX CALCULATION", values: Array(11).fill(''), isHeader: true });
    
    rows.push({ category: "Less: Interest Expense", values: [
      '-',
      ...Array.from({ length: 10 }, (_, i) => {
        const int = getYearDetails(i).interest;
        return int > 0 ? -int : '-';
      })
    ], indent: 1, isNegative: true });
    
    rows.push({ category: "Less: Depreciation", values: [
      '-',
      ...Array.from({ length: 10 }, (_, i) => -getYearDetails(i).depreciation)
    ], indent: 1, isNegative: true });
    
    rows.push({ category: "Taxable Income", values: [
      '-',
      ...Array.from({ length: 10 }, (_, i) => getYearDetails(i).taxableIncome)
    ], indent: 1 });
    
    rows.push({ category: "Tax Liability", values: [
      '-',
      ...Array.from({ length: 10 }, (_, i) => {
        const tax = getYearDetails(i).tax;
        return tax > 0 ? -tax : '-';
      })
    ], indent: 1, isNegative: true });
    
    rows.push({ category: "", values: Array(11).fill('') });
    rows.push({ category: "AFTER-TAX CASH FLOW (ATCF)", values: [
      '-',
      ...Array.from({ length: 10 }, (_, i) => getYearDetails(i).atcf)
    ], isHeader: true });
    
    rows.push({ category: "Exit Value (Year 10)", values: [
      ...Array(10).fill(''),
      totalExitValue
    ] });
    
    rows.push({ category: "", values: Array(11).fill('') });
    rows.push({ category: "TOTAL CASH FLOW", values: consolidatedFlows.map((cf, i) => cf), isHeader: true });
    
    rows.push({ category: "", values: Array(11).fill('') });
    rows.push({ category: "INVESTMENT METRICS", values: Array(11).fill(''), isHeader: true });
    rows.push({ category: "Total Equity Invested", values: [formatMoney(totalInitialEquity), ...Array(10).fill('')] });
    rows.push({ category: "Total Exit Value", values: [...Array(10).fill(''), formatMoney(totalExitValue)] });
    rows.push({ category: "Equity Multiple", values: [`${equityMultiple.toFixed(2)}x`, ...Array(10).fill('')] });
    rows.push({ category: "Cash-on-Cash Return", values: [`${cashOnCash.toFixed(1)}%`, ...Array(10).fill('')] });
    rows.push({ category: "Portfolio IRR", values: [`${(portfolioIRR * 100).toFixed(1)}%`, ...Array(10).fill('')], isHeader: true });
    
    return { years, rows };
  };

  const exportInvestmentAnalysisToPDF = () => {
    const { years, rows } = generateInvestmentAnalysisData();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    doc.setFontSize(18);
    doc.text("L+B Hospitality Group - Investment Analysis", 14, 15);
    doc.setFontSize(10);
    doc.text(`10-Year Projection`, 14, 22);
    doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy')}`, 14, 27);
    
    const tableData = rows.map(row => [
      (row.indent ? '  '.repeat(row.indent) : '') + row.category,
      ...row.values.map(v => {
        if (v === '' || v === '-') return v;
        if (typeof v === 'number') {
          if (v < 0) return `(${formatMoney(Math.abs(v))})`;
          return formatMoney(v);
        }
        return v;
      })
    ]);
    
    autoTable(doc, {
      head: [['Category', ...years]],
      body: tableData,
      startY: 32,
      styles: { fontSize: 5.5, cellPadding: 1 },
      headStyles: { fillColor: [159, 188, 164], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 5.5 },
      columnStyles: { 0: { cellWidth: 45 } },
      margin: { left: 8, right: 8 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index !== undefined) {
          const row = rows[data.row.index];
          if (row?.isHeader) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 240, 240];
          }
        }
      }
    });
    
    doc.save('investment-analysis.pdf');
  };

  const exportInvestmentAnalysisToCSV = () => {
    const { years, rows } = generateInvestmentAnalysisData();
    const headers = ['Category', ...years];
    const csvRows = [
      headers.join(','),
      ...rows.filter(row => row.category !== '').map(row => [
        `"${(row.indent ? '  '.repeat(row.indent) : '') + row.category}"`,
        ...row.values.map(v => {
          if (v === '' || v === '-') return '';
          if (typeof v === 'number') return v.toFixed(2);
          return `"${v}"`;
        })
      ].join(','))
    ];
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'investment-analysis.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Comprehensive Overview Export - includes all financial statements
  const exportOverviewToPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Calculate 10-year totals for comprehensive metrics
    const total10YearRevenue = Array.from({ length: 10 }, (_, i) => getYearlyConsolidated(i).revenueTotal).reduce((a, b) => a + b, 0);
    const total10YearNOI = Array.from({ length: 10 }, (_, i) => getYearlyConsolidated(i).noi).reduce((a, b) => a + b, 0);
    const total10YearCashFlow = Array.from({ length: 10 }, (_, i) => getYearlyConsolidated(i).cashFlow).reduce((a, b) => a + b, 0);
    const avgPurchasePrice = properties.length > 0 ? properties.reduce((sum, p) => sum + (p.purchasePrice || 0), 0) / properties.length : 0;
    const avgADR = properties.length > 0 ? properties.reduce((sum, p) => sum + (p.startAdr || 0), 0) / properties.length : 0;

    // Page footer function for didDrawPage hook
    const addFooter = (data: any) => {
      const pageNum = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(`Page ${pageNum}`, pageWidth - 20, pageHeight - 10);
      doc.text("L+B Hospitality Group", 14, pageHeight - 10);
    };

    // ===== PAGE 1: Cover Page =====
    // Header
    doc.setFontSize(28);
    doc.setTextColor(37, 125, 65);
    doc.text("L+B Hospitality Group", pageWidth / 2, 30, { align: 'center' });
    doc.setFontSize(20);
    doc.setTextColor(61, 61, 61);
    doc.text("Portfolio Investment Report", pageWidth / 2, 42, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`10-Year Projection (${getFiscalYear(0)} - ${getFiscalYear(9)})`, pageWidth / 2, 52, { align: 'center' });
    doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, pageWidth / 2, 60, { align: 'center' });

    // Divider line
    doc.setDrawColor(159, 188, 164);
    doc.setLineWidth(0.5);
    doc.line(14, 68, pageWidth - 14, 68);

    // Key Metrics in a clean 3-column layout
    const col1X = 25;
    const col2X = 115;
    const col3X = 205;
    let metricY = 82;

    // Helper function for metric blocks
    const drawMetric = (x: number, y: number, label: string, value: string, isLarge: boolean = false) => {
      doc.setFontSize(isLarge ? 22 : 18);
      doc.setTextColor(37, 125, 65);
      doc.text(value, x, y);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(label, x, y + 6);
    };

    // Row 1: Key Returns
    drawMetric(col1X, metricY, "Total Equity Invested", formatMoney(totalInitialEquity));
    drawMetric(col2X, metricY, "Exit Value (Year 10)", formatMoney(totalExitValue));
    drawMetric(col3X, metricY, "Equity Multiple", `${equityMultiple.toFixed(2)}x`);

    metricY += 25;

    // Row 2: Performance
    drawMetric(col1X, metricY, "Portfolio IRR", `${(portfolioIRR * 100).toFixed(1)}%`);
    drawMetric(col2X, metricY, "Avg Cash-on-Cash", `${cashOnCash.toFixed(1)}%`);
    drawMetric(col3X, metricY, "Properties", `${totalProperties} (${totalRooms} rooms)`);

    metricY += 25;

    // Row 3: 10-Year Totals
    drawMetric(col1X, metricY, "10-Year Revenue", formatMoney(total10YearRevenue));
    drawMetric(col2X, metricY, "10-Year NOI", formatMoney(total10YearNOI));
    drawMetric(col3X, metricY, "10-Year Cash Flow", formatMoney(total10YearCashFlow));

    metricY += 25;

    // Row 4: Averages
    drawMetric(col1X, metricY, "Total Investment", formatMoney(properties.reduce((sum, p) => sum + (p.purchasePrice || 0), 0)));
    drawMetric(col2X, metricY, "Avg Purchase Price", formatMoney(avgPurchasePrice));
    drawMetric(col3X, metricY, "Avg Starting ADR", formatMoney(avgADR));

    // Footer for page 1
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text("Page 1", pageWidth - 20, pageHeight - 10);
    doc.text("L+B Hospitality Group", 14, pageHeight - 10);

    // ===== PAGE 2: Properties =====
    doc.addPage();
    doc.setFontSize(18);
    doc.setTextColor(61, 61, 61);
    doc.text("Portfolio Properties", 14, 20);

    const propertyListData = properties.map(p => [
      p.name,
      p.location,
      p.market || '-',
      `${p.roomCount}`,
      p.type,
      p.status,
      formatMoney(p.purchasePrice || 0),
      formatMoney(p.startAdr || 0)
    ]);

    autoTable(doc, {
      head: [["Property", "Location", "Market", "Rooms", "Financing", "Status", "Purchase Price", "Starting ADR"]],
      body: propertyListData,
      startY: 28,
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [159, 188, 164], textColor: [61, 61, 61], fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 45 },
        2: { cellWidth: 30 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'center', cellWidth: 25 },
        5: { halign: 'center', cellWidth: 28 },
        6: { halign: 'right', cellWidth: 35 },
        7: { halign: 'right', cellWidth: 30 }
      },
      didDrawPage: addFooter,
    });

    doc.addPage();

    // ===== PAGE 2: Income Statement =====
    doc.setFontSize(16);
    doc.setTextColor(61, 61, 61);
    doc.text("Income Statement", 14, 15);
    doc.setFontSize(10);
    doc.text("Consolidated 10-Year Projection", 14, 22);

    const { years: incomeYears, rows: incomeRows } = generateIncomeStatementData();
    const incomeTableData = incomeRows.map(row => [
      (row.indent ? '  '.repeat(row.indent) : '') + row.category,
      ...row.values.map(v => formatMoney(v))
    ]);

    const colStylesNumeric: Record<number, any> = { 0: { cellWidth: 45, halign: 'left' } };
    for (let i = 1; i <= 10; i++) colStylesNumeric[i] = { halign: 'right' };

    autoTable(doc, {
      head: [['Category', ...incomeYears.map(String)]],
      body: incomeTableData,
      startY: 27,
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [159, 188, 164], textColor: [61, 61, 61], fontStyle: 'bold', halign: 'center' },
      columnStyles: colStylesNumeric,
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index !== undefined) {
          const row = incomeRows[data.row.index];
          if (row?.isHeader) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 240, 240];
          }
        }
      },
      didDrawPage: addFooter,
    });

    doc.addPage();

    // ===== PAGE 3: Cash Flow Statement =====
    doc.setFontSize(16);
    doc.setTextColor(61, 61, 61);
    doc.text("Cash Flow Statement", 14, 15);
    doc.setFontSize(10);
    doc.text("Consolidated 10-Year Projection", 14, 22);

    const { years: cfYears, rows: cfRows } = generateCashFlowData();
    const cfTableData = cfRows.map(row => [
      (row.indent ? '  '.repeat(row.indent) : '') + row.category,
      ...row.values.map(v => {
        if (row.isNegative && v < 0) return `(${formatMoney(Math.abs(v))})`;
        return formatMoney(v);
      })
    ]);

    autoTable(doc, {
      head: [['Category', ...cfYears.map(String)]],
      body: cfTableData,
      startY: 27,
      styles: { fontSize: 6.5, cellPadding: 1 },
      headStyles: { fillColor: [159, 188, 164], textColor: [61, 61, 61], fontStyle: 'bold', halign: 'center' },
      columnStyles: colStylesNumeric,
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index !== undefined) {
          const row = cfRows[data.row.index];
          if (row?.isHeader) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 240, 240];
          }
        }
      },
      didDrawPage: addFooter,
    });

    doc.addPage();

    // ===== PAGE 4: Balance Sheet =====
    doc.setFontSize(16);
    doc.setTextColor(61, 61, 61);
    doc.text("Balance Sheet", 14, 15);
    doc.setFontSize(10);
    doc.text("Consolidated 10-Year Projection", 14, 22);

    const { years: bsYears, rows: bsRows } = generateBalanceSheetData();
    const bsTableData = bsRows.map(row => [
      (row.indent ? '  '.repeat(row.indent) : '') + row.category,
      ...row.values.map(v => formatMoney(v))
    ]);

    autoTable(doc, {
      head: [['Category', ...bsYears.map(String)]],
      body: bsTableData,
      startY: 27,
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [159, 188, 164], textColor: [61, 61, 61], fontStyle: 'bold', halign: 'center' },
      columnStyles: colStylesNumeric,
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index !== undefined) {
          const row = bsRows[data.row.index];
          if (row?.isHeader) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 240, 240];
          }
        }
      },
      didDrawPage: addFooter,
    });

    doc.addPage();

    // ===== PAGE 5: Investment Analysis =====
    doc.setFontSize(16);
    doc.setTextColor(61, 61, 61);
    doc.text("Investment Analysis", 14, 15);
    doc.setFontSize(10);
    doc.text("Property-Level IRR and Cash Flows", 14, 22);

    const { years: invYears, rows: invRows } = generateInvestmentAnalysisData();
    const invTableData = invRows.map(row => [
      (row.indent ? '  '.repeat(row.indent) : '') + row.category,
      ...row.values.map(v => {
        if (v === '' || v === '-') return v;
        if (typeof v === 'number') {
          if (v < 0) return `(${formatMoney(Math.abs(v))})`;
          return formatMoney(v);
        }
        return v;
      })
    ]);

    autoTable(doc, {
      head: [['Category', ...invYears]],
      body: invTableData,
      startY: 27,
      styles: { fontSize: 5.5, cellPadding: 1 },
      headStyles: { fillColor: [159, 188, 164], textColor: [61, 61, 61], fontStyle: 'bold', fontSize: 5.5, halign: 'center' },
      columnStyles: colStylesNumeric,
      margin: { left: 8, right: 8 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index !== undefined) {
          const row = invRows[data.row.index];
          if (row?.isHeader) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 240, 240];
          }
        }
      },
      didDrawPage: addFooter,
    });

    doc.save('LB-Hospitality-Portfolio-Report.pdf');
  };

  const exportOverviewToCSV = () => {
    const years = Array.from({ length: 10 }, (_, i) => getFiscalYear(i));
    let csvContent = "";

    // Overview Section
    csvContent += "L+B HOSPITALITY GROUP - PORTFOLIO INVESTMENT REPORT\n";
    csvContent += `Generated: ${format(new Date(), 'MMMM d, yyyy')}\n`;
    csvContent += `Investment Period: ${getFiscalYear(0)} - ${getFiscalYear(9)}\n\n`;

    csvContent += "INVESTMENT RETURNS SUMMARY\n";
    csvContent += `Total Equity Invested,${totalInitialEquity}\n`;
    csvContent += `Exit Value (Year 10),${totalExitValue}\n`;
    csvContent += `Equity Multiple,${equityMultiple.toFixed(2)}x\n`;
    csvContent += `Average Cash-on-Cash,${cashOnCash.toFixed(1)}%\n`;
    csvContent += `Portfolio IRR,${(portfolioIRR * 100).toFixed(1)}%\n\n`;

    csvContent += "PORTFOLIO COMPOSITION\n";
    csvContent += `Properties,${totalProperties}\n`;
    csvContent += `Total Rooms,${totalRooms}\n`;
    csvContent += `Total Investment,${properties.reduce((sum, p) => sum + (p.purchasePrice || 0), 0)}\n`;
    csvContent += `Average Purchase Price,${properties.length > 0 ? properties.reduce((sum, p) => sum + (p.purchasePrice || 0), 0) / properties.length : 0}\n`;
    csvContent += `Average Starting ADR,${properties.length > 0 ? properties.reduce((sum, p) => sum + (p.startAdr || 0), 0) / properties.length : 0}\n\n`;

    csvContent += "10-YEAR FINANCIAL PROJECTIONS\n";
    csvContent += `Total Revenue (10-Year),${Array.from({ length: 10 }, (_, i) => getYearlyConsolidated(i).revenueTotal).reduce((a, b) => a + b, 0)}\n`;
    csvContent += `Total NOI (10-Year),${Array.from({ length: 10 }, (_, i) => getYearlyConsolidated(i).noi).reduce((a, b) => a + b, 0)}\n`;
    csvContent += `Total Cash Flow (10-Year),${Array.from({ length: 10 }, (_, i) => getYearlyConsolidated(i).cashFlow).reduce((a, b) => a + b, 0)}\n`;
    csvContent += `Year 10 Revenue,${getYearlyConsolidated(9).revenueTotal}\n`;
    csvContent += `Year 10 NOI,${getYearlyConsolidated(9).noi}\n\n`;

    csvContent += "PROPERTIES\n";
    csvContent += "Name,Location,Rooms,Financing\n";
    properties.forEach(p => {
      csvContent += `"${p.name}","${p.location}",${p.roomCount},${p.type}\n`;
    });
    csvContent += "\n";

    // Income Statement
    csvContent += "INCOME STATEMENT\n";
    const { years: incomeYears, rows: incomeRows } = generateIncomeStatementData();
    csvContent += `Category,${incomeYears.join(',')}\n`;
    incomeRows.forEach(row => {
      csvContent += `"${(row.indent ? '  '.repeat(row.indent) : '') + row.category}",${row.values.join(',')}\n`;
    });
    csvContent += "\n";

    // Cash Flow Statement
    csvContent += "CASH FLOW STATEMENT\n";
    const { years: cfYears, rows: cfRows } = generateCashFlowData();
    csvContent += `Category,${cfYears.join(',')}\n`;
    cfRows.forEach(row => {
      csvContent += `"${(row.indent ? '  '.repeat(row.indent) : '') + row.category}",${row.values.join(',')}\n`;
    });
    csvContent += "\n";

    // Balance Sheet
    csvContent += "BALANCE SHEET\n";
    const { years: bsYears, rows: bsRows } = generateBalanceSheetData();
    csvContent += `Category,${bsYears.join(',')}\n`;
    bsRows.forEach(row => {
      csvContent += `"${(row.indent ? '  '.repeat(row.indent) : '') + row.category}",${row.values.join(',')}\n`;
    });
    csvContent += "\n";

    // Investment Analysis
    csvContent += "INVESTMENT ANALYSIS\n";
    const { years: invYears, rows: invRows } = generateInvestmentAnalysisData();
    csvContent += `Category,${invYears.join(',')}\n`;
    invRows.filter(row => row.category !== '').forEach(row => {
      const values = row.values.map(v => {
        if (v === '' || v === '-') return '';
        if (typeof v === 'number') return v;
        return `"${v}"`;
      });
      csvContent += `"${(row.indent ? '  '.repeat(row.indent) : '') + row.category}",${values.join(',')}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'LB-Hospitality-Portfolio-Report.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getExportFunctions = () => {
    switch (activeTab) {
      case 'overview':
        return { pdf: exportOverviewToPDF, csv: exportOverviewToCSV };
      case 'income':
        return { pdf: exportIncomeStatementToPDF, csv: exportIncomeStatementToCSV };
      case 'cashflow':
        return { pdf: exportCashFlowToPDF, csv: exportCashFlowToCSV };
      case 'balance':
        return { pdf: exportBalanceSheetToPDF, csv: exportBalanceSheetToCSV };
      case 'investment':
        return { pdf: exportInvestmentAnalysisToPDF, csv: exportInvestmentAnalysisToCSV };
      default:
        return null;
    }
  };

  const exportFunctions = getExportFunctions();

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-serif font-bold text-foreground">Investment Overview</h2>
            <p className="text-muted-foreground mt-1">L+B Hospitality Group - Boutique Hotel Portfolio</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Investment Period</p>
            <p className="text-lg font-medium">{getFiscalYear(0)} - {getFiscalYear(investmentHorizon)}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="income">Income Statement</TabsTrigger>
              <TabsTrigger value="cashflow">Cash Flow Statement</TabsTrigger>
              <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
              <TabsTrigger value="investment">Investment Analysis</TabsTrigger>
            </TabsList>
            
            {exportFunctions && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportFunctions.pdf}
                  className="flex items-center gap-2"
                  data-testid="button-export-pdf"
                >
                  <FileDown className="w-4 h-4" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportFunctions.csv}
                  className="flex items-center gap-2"
                  data-testid="button-export-csv"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export CSV
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="overview" className="space-y-8">
            {/* Investment Returns - Hero Section - Liquid Glass Design */}
            <div className="relative overflow-hidden rounded-3xl p-8">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#2d4a5e] via-[#3d5a6a] to-[#4a3d5e]" />
              <div className="absolute inset-0">
                <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[#9FBCA4]/30 blur-3xl" />
                <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-[#7c6f9f]/40 blur-3xl" />
                <div className="absolute top-1/3 right-0 w-64 h-64 rounded-full bg-[#5a8f9f]/30 blur-2xl" />
              </div>
              
              <div className="relative">
                <div className="text-center mb-8">
                  <p className="text-sm font-medium tracking-widest text-white/60 uppercase mb-2">Investment Performance</p>
                  <p className="text-white/40 text-sm">{investmentHorizon}-Year Hold | {totalProperties} Properties | {totalRooms} Rooms</p>
                </div>
                
                {/* Main IRR Display - Frosted Glass */}
                <div className="flex flex-col items-center mb-10">
                  <div className="relative bg-white/10 backdrop-blur-2xl rounded-[2rem] p-8 border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_20px_40px_rgba(0,0,0,0.2)]">
                    <div className="relative">
                      <svg className="w-48 h-48" viewBox="0 0 200 200">
                        <defs>
                          <linearGradient id="irrGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9FBCA4" />
                            <stop offset="100%" stopColor="#257D41" />
                          </linearGradient>
                        </defs>
                        <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                        <circle 
                          cx="100" cy="100" r="80" fill="none" stroke="url(#irrGradient)" strokeWidth="10"
                          strokeDasharray={`${Math.min(Math.max(portfolioIRR * 100, 0) * 5.03, 503)} 503`}
                          strokeLinecap="round"
                          transform="rotate(-90 100 100)"
                          style={{ filter: 'drop-shadow(0 0 12px rgba(159,188,164,0.6))' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-bold text-white tracking-tight">{(portfolioIRR * 100).toFixed(1)}%</span>
                        <span className="text-sm text-white/60 font-medium mt-2">Portfolio IRR</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Grid - Liquid Glass Cards */}
                <div className="grid gap-4 md:grid-cols-4 max-w-5xl mx-auto">
                  {/* Equity Multiple */}
                  <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-5 border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_10px_30px_rgba(0,0,0,0.15)] hover:bg-white/15 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="relative w-14 h-14 flex-shrink-0">
                        <svg className="w-14 h-14" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                          <circle 
                            cx="50" cy="50" r="40" fill="none" stroke="#60A5FA" strokeWidth="6"
                            strokeDasharray={`${Math.min(equityMultiple * 63, 251)} 251`}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                            style={{ filter: 'drop-shadow(0 0 6px rgba(96,165,250,0.6))' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-white">{equityMultiple.toFixed(1)}x</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{equityMultiple.toFixed(2)}x</p>
                        <p className="text-sm text-white/50">Equity Multiple</p>
                      </div>
                    </div>
                  </div>

                  {/* Cash-on-Cash */}
                  <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-5 border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_10px_30px_rgba(0,0,0,0.15)] hover:bg-white/15 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="relative w-14 h-14 flex-shrink-0">
                        <svg className="w-14 h-14" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                          <circle 
                            cx="50" cy="50" r="40" fill="none" stroke="#FBBF24" strokeWidth="6"
                            strokeDasharray={`${Math.min(Math.max(cashOnCash, 0) * 12.5, 251)} 251`}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                            style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.6))' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-white">{cashOnCash.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{cashOnCash.toFixed(1)}%</p>
                        <p className="text-sm text-white/50">Cash-on-Cash</p>
                      </div>
                    </div>
                  </div>

                  {/* Total Equity */}
                  <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-5 border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_10px_30px_rgba(0,0,0,0.15)] hover:bg-white/15 transition-all duration-300">
                    <div className="mb-2">
                      <p className="text-2xl font-bold text-white">{formatMoney(totalInitialEquity)}</p>
                      <p className="text-sm text-white/50">Equity Invested</p>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#9FBCA4] to-[#257D41] rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>

                  {/* Exit Value */}
                  <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-5 border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_10px_30px_rgba(0,0,0,0.15)] hover:bg-white/15 transition-all duration-300">
                    <div className="mb-2">
                      <p className="text-2xl font-bold text-[#6EE7B7]">{formatMoney(totalExitValue)}</p>
                      <p className="text-sm text-white/50">Projected Exit</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-[#6EE7B7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      <span className="text-sm font-medium text-[#6EE7B7]">+{((totalExitValue / totalInitialEquity - 1) * 100).toFixed(0)}% gain</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Portfolio & Capital Summary - Compact */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Portfolio Composition */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Portfolio Composition</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Properties</span>
                      <span className="font-semibold">{totalProperties}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Rooms</span>
                      <span className="font-semibold">{totalRooms}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg Rooms/Property</span>
                      <span className="font-semibold">{avgRoomsPerProperty.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Markets</span>
                      <span className="font-semibold">{Object.keys(marketCounts).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg Daily Rate</span>
                      <span className="font-semibold">{formatMoney(avgADR)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Capital Structure */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Capital Structure</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Investment</span>
                      <span className="font-semibold">{formatMoney(totalInvestment)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg Purchase Price</span>
                      <span className="font-semibold">{formatMoney(avgPurchasePrice)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg Exit Cap Rate</span>
                      <span className="font-semibold">{(avgExitCapRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Hold Period</span>
                      <span className="font-semibold">{investmentHorizon} Years</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Projected Exit Value</span>
                      <span className="font-semibold text-primary">{formatMoney(projectedExitValue)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 10-Year Totals - Simplified Row */}
            <Card className="bg-muted/30">
              <CardContent className="py-4">
                <div className="grid gap-4 md:grid-cols-3 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">10-Year Revenue</p>
                    <p className="text-xl font-bold">{formatMoney(total10YearRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">10-Year NOI</p>
                    <p className="text-xl font-bold">{formatMoney(total10YearNOI)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">10-Year Cash Flow</p>
                    <p className="text-xl font-bold">{formatMoney(total10YearCashFlow)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="income" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Income Trends</CardTitle>
                <p className="text-sm text-muted-foreground">Revenue, Operating Expenses, and NOI over 10 years</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={Array.from({ length: 10 }, (_, i) => {
                      const yearly = getYearlyConsolidated(i);
                      return {
                        year: getFiscalYear(i),
                        Revenue: yearly.revenueTotal,
                        'Operating Expenses': yearly.totalExpenses,
                        NOI: yearly.noi
                      };
                    })}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatMoney(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="Revenue" stroke="#5C6BC0" strokeWidth={2} dot={{ fill: '#5C6BC0' }} />
                    <Line type="monotone" dataKey="Operating Expenses" stroke="#9575CD" strokeWidth={2} dot={{ fill: '#9575CD' }} />
                    <Line type="monotone" dataKey="NOI" stroke="#257D41" strokeWidth={2} dot={{ fill: '#257D41' }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consolidated Portfolio Income Statement (10-Year)</CardTitle>
                <p className="text-sm text-muted-foreground">All properties combined - management fees shown as expenses paid to L+B Co.</p>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-card min-w-[200px]">Category</TableHead>
                      {Array.from({ length: 10 }, (_, i) => (
                        <TableHead key={i} className="text-right min-w-[110px]">{getFiscalYear(i)}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow 
                      className="font-semibold bg-muted/20 cursor-pointer hover:bg-muted/30"
                      onClick={() => toggleRow('revenue')}
                    >
                      <TableCell className="sticky left-0 bg-muted/20 flex items-center gap-2">
                        {expandedRows.has('revenue') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Total Revenue
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => (
                        <TableCell key={y} className="text-right">{formatMoney(getYearlyConsolidated(y).revenueTotal)}</TableCell>
                      ))}
                    </TableRow>
                    {expandedRows.has('revenue') && (
                      <>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">Rooms Revenue</TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(getYearlyConsolidated(y).revenueRooms)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">Events Revenue</TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(getYearlyConsolidated(y).revenueEvents)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">F&B Revenue</TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(getYearlyConsolidated(y).revenueFB)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">Other Revenue</TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(getYearlyConsolidated(y).revenueOther)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/10"
                          onClick={(e) => { e.stopPropagation(); toggleRow('revenueByProperty'); }}
                        >
                          <TableCell className="sticky left-0 bg-card pl-8 flex items-center gap-2 text-muted-foreground">
                            {expandedRows.has('revenueByProperty') ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            By Property
                          </TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">-</TableCell>
                          ))}
                        </TableRow>
                        {expandedRows.has('revenueByProperty') && properties.map((prop, idx) => (
                          <TableRow key={prop.id} className="bg-muted/10">
                            <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">{prop.name}</TableCell>
                            {Array.from({ length: 10 }, (_, y) => (
                              <TableCell key={y} className="text-right text-sm text-muted-foreground">
                                {formatMoney(getPropertyYearly(idx, y).revenueTotal)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </>
                    )}

                    <TableRow 
                      className="font-semibold bg-muted/30 cursor-pointer hover:bg-muted/40"
                      onClick={() => toggleRow('opex')}
                    >
                      <TableCell className="sticky left-0 bg-muted/30 flex items-center gap-2">
                        {expandedRows.has('opex') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Operating Expenses
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const data = getYearlyConsolidated(y);
                        const totalOpex = data.expenseRooms + data.expenseFB + data.expenseEvents + data.expenseOther + 
                          data.expenseMarketing + data.expensePropertyOps + data.expenseUtilitiesVar + 
                          data.expenseAdmin + data.expenseIT + data.expenseInsurance + data.expenseTaxes + 
                          data.expenseUtilitiesFixed + data.expenseOtherCosts;
                        return <TableCell key={y} className="text-right">{formatMoney(totalOpex)}</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('opex') && (
                      <>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/20"
                          onClick={(e) => { e.stopPropagation(); toggleRow('opexDirect'); }}
                        >
                          <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                            {expandedRows.has('opexDirect') ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            Direct Costs
                          </TableCell>
                          {Array.from({ length: 10 }, (_, y) => {
                            const data = getYearlyConsolidated(y);
                            return <TableCell key={y} className="text-right text-muted-foreground">
                              {formatMoney(data.expenseRooms + data.expenseFB + data.expenseEvents + data.expenseOther)}
                            </TableCell>;
                          })}
                        </TableRow>
                        {expandedRows.has('opexDirect') && (
                          <>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Rooms Expense</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(getYearlyConsolidated(y).expenseRooms)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">F&B Expense</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(getYearlyConsolidated(y).expenseFB)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Events Expense</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(getYearlyConsolidated(y).expenseEvents)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Other Direct</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(getYearlyConsolidated(y).expenseOther)}</TableCell>
                              ))}
                            </TableRow>
                          </>
                        )}
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/20"
                          onClick={(e) => { e.stopPropagation(); toggleRow('opexOverhead'); }}
                        >
                          <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                            {expandedRows.has('opexOverhead') ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            Overhead & Admin
                          </TableCell>
                          {Array.from({ length: 10 }, (_, y) => {
                            const data = getYearlyConsolidated(y);
                            return <TableCell key={y} className="text-right text-muted-foreground">
                              {formatMoney(data.expenseAdmin + data.expenseMarketing + data.expensePropertyOps + 
                                data.expenseUtilitiesVar + data.expenseUtilitiesFixed + data.expenseIT + 
                                data.expenseInsurance + data.expenseTaxes + data.expenseOtherCosts)}
                            </TableCell>;
                          })}
                        </TableRow>
                        {expandedRows.has('opexOverhead') && (
                          <>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Admin & General</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(getYearlyConsolidated(y).expenseAdmin)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Marketing</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(getYearlyConsolidated(y).expenseMarketing)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Property Operations</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(getYearlyConsolidated(y).expensePropertyOps)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Utilities</TableCell>
                              {Array.from({ length: 10 }, (_, y) => {
                                const data = getYearlyConsolidated(y);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(data.expenseUtilitiesVar + data.expenseUtilitiesFixed)}</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">IT Systems</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(getYearlyConsolidated(y).expenseIT)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Insurance</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(getYearlyConsolidated(y).expenseInsurance)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Property Taxes</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(getYearlyConsolidated(y).expenseTaxes)}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Other Expenses</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(getYearlyConsolidated(y).expenseOtherCosts)}</TableCell>
                              ))}
                            </TableRow>
                          </>
                        )}
                      </>
                    )}

                    <TableRow className="bg-accent/20 font-semibold">
                      <TableCell className="sticky left-0 bg-accent/20">Gross Operating Profit (GOP)</TableCell>
                      {Array.from({ length: 10 }, (_, y) => (
                        <TableCell key={y} className="text-right">{formatMoney(getYearlyConsolidated(y).gop)}</TableCell>
                      ))}
                    </TableRow>

                    <TableRow 
                      className="font-semibold bg-muted/30 cursor-pointer hover:bg-muted/40"
                      onClick={() => toggleRow('mgmtFees')}
                    >
                      <TableCell className="sticky left-0 bg-muted/30 flex items-center gap-2">
                        {expandedRows.has('mgmtFees') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Management Fees (to L+B Co.)
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const data = getYearlyConsolidated(y);
                        return <TableCell key={y} className="text-right">{formatMoney(data.feeBase + data.feeIncentive)}</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('mgmtFees') && (
                      <>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">Base Fee ({(global.baseManagementFee * 100).toFixed(0)}% of Revenue)</TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(getYearlyConsolidated(y).feeBase)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">Incentive Fee ({(global.incentiveManagementFee * 100).toFixed(0)}% of GOP)</TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(getYearlyConsolidated(y).feeIncentive)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/10"
                          onClick={(e) => { e.stopPropagation(); toggleRow('mgmtFeesByProperty'); }}
                        >
                          <TableCell className="sticky left-0 bg-card pl-8 flex items-center gap-2 text-muted-foreground">
                            {expandedRows.has('mgmtFeesByProperty') ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            By Property
                          </TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">-</TableCell>
                          ))}
                        </TableRow>
                        {expandedRows.has('mgmtFeesByProperty') && properties.map((prop, idx) => (
                          <TableRow key={prop.id} className="bg-muted/10">
                            <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">{prop.name}</TableCell>
                            {Array.from({ length: 10 }, (_, y) => {
                              const propData = getPropertyYearly(idx, y);
                              return (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">
                                  {formatMoney(propData.feeBase + propData.feeIncentive)}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </>
                    )}

                    <TableRow>
                      <TableCell className="sticky left-0 bg-card">FF&E Reserve</TableCell>
                      {Array.from({ length: 10 }, (_, y) => (
                        <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(getYearlyConsolidated(y).expenseFFE)}</TableCell>
                      ))}
                    </TableRow>

                    <TableRow className="bg-primary/10 font-bold">
                      <TableCell className="sticky left-0 bg-primary/10 flex items-center gap-1">
                        Net Operating Income (NOI)
                        <HelpTooltip text="NOI = Total Revenue - Operating Expenses. The property's income before debt service, taxes, and depreciation." />
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const noi = getYearlyConsolidated(y).noi;
                        return (
                          <TableCell key={y} className={`text-right ${noi < 0 ? 'text-destructive' : ''}`}>
                            {formatMoney(noi)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card italic text-muted-foreground">NOI Margin</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const data = getYearlyConsolidated(y);
                        const margin = data.revenueTotal > 0 ? (data.noi / data.revenueTotal) * 100 : 0;
                        return (
                          <TableCell key={y} className={`text-right italic text-muted-foreground ${margin < 0 ? 'text-destructive' : ''}`}>
                            {margin.toFixed(1)}%
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cashflow" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue & Operating Performance</CardTitle>
                  <p className="text-sm text-muted-foreground">Revenue, Operating Costs, and NOI over 10 years</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={Array.from({ length: 10 }, (_, i) => {
                        const yearly = getYearlyConsolidated(i);
                        return {
                          year: getFiscalYear(i),
                          Revenue: yearly.revenueTotal,
                          'Operating Costs': yearly.totalExpenses,
                          NOI: yearly.noi
                        };
                      })}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatMoney(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="Revenue" stroke="#5C6BC0" strokeWidth={2} dot={{ fill: '#5C6BC0' }} />
                      <Line type="monotone" dataKey="Operating Costs" stroke="#9575CD" strokeWidth={2} dot={{ fill: '#9575CD' }} />
                      <Line type="monotone" dataKey="NOI" stroke="#257D41" strokeWidth={2} dot={{ fill: '#257D41' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cash Flow After Financing</CardTitle>
                  <p className="text-sm text-muted-foreground">NOI, Debt Service, and Net Cash Flow over 10 years</p>
                </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={Array.from({ length: 10 }, (_, i) => {
                      const yearly = getYearlyConsolidated(i);
                      return {
                        year: getFiscalYear(i),
                        NOI: yearly.noi,
                        'Debt Service': yearly.debtPayment,
                        'Net Cash Flow': yearly.cashFlow
                      };
                    })}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatMoney(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="NOI" stroke="#5C6BC0" strokeWidth={2} dot={{ fill: '#5C6BC0' }} />
                    <Line type="monotone" dataKey="Debt Service" stroke="#9575CD" strokeWidth={2} dot={{ fill: '#9575CD' }} />
                    <Line type="monotone" dataKey="Net Cash Flow" stroke="#257D41" strokeWidth={2} dot={{ fill: '#257D41' }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consolidated Portfolio Cash Flow Statement (10-Year)</CardTitle>
                <p className="text-sm text-muted-foreground">All properties combined - shows cash available after debt service</p>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-card min-w-[200px]">Category</TableHead>
                      {Array.from({ length: 10 }, (_, i) => (
                        <TableHead key={i} className="text-right min-w-[110px]">{getFiscalYear(i)}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow 
                      className="font-semibold bg-muted/20 cursor-pointer hover:bg-muted/30"
                      onClick={() => toggleRow('cfInflows')}
                    >
                      <TableCell className="sticky left-0 bg-muted/20 flex items-center gap-2">
                        {expandedRows.has('cfInflows') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Cash Inflows (Revenue)
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => (
                        <TableCell key={y} className="text-right">{formatMoney(getYearlyConsolidated(y).revenueTotal)}</TableCell>
                      ))}
                    </TableRow>
                    {expandedRows.has('cfInflows') && (
                      <>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">Rooms Revenue</TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(getYearlyConsolidated(y).revenueRooms)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">Events Revenue</TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(getYearlyConsolidated(y).revenueEvents)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">F&B Revenue</TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(getYearlyConsolidated(y).revenueFB)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow>
                          <TableCell className="sticky left-0 bg-card pl-8 text-muted-foreground">Other Revenue</TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(getYearlyConsolidated(y).revenueOther)}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/10"
                          onClick={(e) => { e.stopPropagation(); toggleRow('cfInflowsByProperty'); }}
                        >
                          <TableCell className="sticky left-0 bg-card pl-8 flex items-center gap-2 text-muted-foreground">
                            {expandedRows.has('cfInflowsByProperty') ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            By Property
                          </TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-muted-foreground">-</TableCell>
                          ))}
                        </TableRow>
                        {expandedRows.has('cfInflowsByProperty') && properties.map((prop, idx) => (
                          <TableRow key={prop.id} className="bg-muted/10">
                            <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">{prop.name}</TableCell>
                            {Array.from({ length: 10 }, (_, y) => (
                              <TableCell key={y} className="text-right text-sm text-muted-foreground">
                                {formatMoney(getPropertyYearly(idx, y).revenueTotal)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </>
                    )}

                    <TableRow 
                      className="font-semibold bg-muted/30 cursor-pointer hover:bg-muted/40"
                      onClick={() => toggleRow('cfOutflows')}
                    >
                      <TableCell className="sticky left-0 bg-muted/30 flex items-center gap-2">
                        {expandedRows.has('cfOutflows') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Cash Outflows (Operating)
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const data = getYearlyConsolidated(y);
                        const totalOpex = data.expenseRooms + data.expenseFB + data.expenseEvents + data.expenseOther + 
                          data.expenseMarketing + data.expensePropertyOps + data.expenseUtilitiesVar + 
                          data.expenseAdmin + data.expenseIT + data.expenseInsurance + data.expenseTaxes + 
                          data.expenseUtilitiesFixed + data.expenseOtherCosts;
                        return <TableCell key={y} className="text-right">({formatMoney(totalOpex)})</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('cfOutflows') && (
                      <>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/20"
                          onClick={(e) => { e.stopPropagation(); toggleRow('cfDirect'); }}
                        >
                          <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                            {expandedRows.has('cfDirect') ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            Direct Costs
                          </TableCell>
                          {Array.from({ length: 10 }, (_, y) => {
                            const data = getYearlyConsolidated(y);
                            return <TableCell key={y} className="text-right text-muted-foreground">
                              ({formatMoney(data.expenseRooms + data.expenseFB + data.expenseEvents + data.expenseOther)})
                            </TableCell>;
                          })}
                        </TableRow>
                        {expandedRows.has('cfDirect') && (
                          <>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Rooms Expense</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).expenseRooms)})</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">F&B Expense</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).expenseFB)})</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Events Expense</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).expenseEvents)})</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Other Direct</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).expenseOther)})</TableCell>
                              ))}
                            </TableRow>
                          </>
                        )}
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/20"
                          onClick={(e) => { e.stopPropagation(); toggleRow('cfOverhead'); }}
                        >
                          <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                            {expandedRows.has('cfOverhead') ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            Overhead & Admin
                          </TableCell>
                          {Array.from({ length: 10 }, (_, y) => {
                            const data = getYearlyConsolidated(y);
                            return <TableCell key={y} className="text-right text-muted-foreground">
                              ({formatMoney(data.expenseAdmin + data.expenseMarketing + data.expensePropertyOps + 
                                data.expenseUtilitiesVar + data.expenseUtilitiesFixed + data.expenseIT + 
                                data.expenseInsurance + data.expenseTaxes + data.expenseOtherCosts)})
                            </TableCell>;
                          })}
                        </TableRow>
                        {expandedRows.has('cfOverhead') && (
                          <>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Admin & General</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).expenseAdmin)})</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Marketing</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).expenseMarketing)})</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Property Operations</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).expensePropertyOps)})</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Utilities</TableCell>
                              {Array.from({ length: 10 }, (_, y) => {
                                const data = getYearlyConsolidated(y);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(data.expenseUtilitiesVar + data.expenseUtilitiesFixed)})</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">IT Systems</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).expenseIT)})</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Insurance</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).expenseInsurance)})</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Property Taxes</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).expenseTaxes)})</TableCell>
                              ))}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Other Expenses</TableCell>
                              {Array.from({ length: 10 }, (_, y) => (
                                <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).expenseOtherCosts)})</TableCell>
                              ))}
                            </TableRow>
                          </>
                        )}
                      </>
                    )}

                    <TableRow className="bg-accent/20 font-semibold">
                      <TableCell className="sticky left-0 bg-accent/20">Gross Operating Profit (GOP)</TableCell>
                      {Array.from({ length: 10 }, (_, y) => (
                        <TableCell key={y} className="text-right">{formatMoney(getYearlyConsolidated(y).gop)}</TableCell>
                      ))}
                    </TableRow>

                    <TableRow 
                      className="cursor-pointer hover:bg-muted/20"
                      onClick={() => toggleRow('cfMgmtFees')}
                    >
                      <TableCell className="sticky left-0 bg-card flex items-center gap-2">
                        {expandedRows.has('cfMgmtFees') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Management Fees (to L+B Co.)
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const data = getYearlyConsolidated(y);
                        return <TableCell key={y} className="text-right text-muted-foreground">({formatMoney(data.feeBase + data.feeIncentive)})</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('cfMgmtFees') && (
                      <>
                        <TableRow className="bg-muted/10">
                          <TableCell className="sticky left-0 bg-muted/10 pl-8 text-sm text-muted-foreground">Base Fee ({(global.baseManagementFee * 100).toFixed(0)}% of Revenue)</TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).feeBase)})</TableCell>
                          ))}
                        </TableRow>
                        <TableRow className="bg-muted/10">
                          <TableCell className="sticky left-0 bg-muted/10 pl-8 text-sm text-muted-foreground">Incentive Fee ({(global.incentiveManagementFee * 100).toFixed(0)}% of GOP)</TableCell>
                          {Array.from({ length: 10 }, (_, y) => (
                            <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(getYearlyConsolidated(y).feeIncentive)})</TableCell>
                          ))}
                        </TableRow>
                      </>
                    )}

                    <TableRow>
                      <TableCell className="sticky left-0 bg-card">FF&E Reserve</TableCell>
                      {Array.from({ length: 10 }, (_, y) => (
                        <TableCell key={y} className="text-right text-muted-foreground">({formatMoney(getYearlyConsolidated(y).expenseFFE)})</TableCell>
                      ))}
                    </TableRow>

                    <TableRow className="font-semibold bg-muted/20">
                      <TableCell className="sticky left-0 bg-muted/20 flex items-center gap-1">
                        Net Operating Income (NOI)
                        <HelpTooltip text="NOI = Total Revenue - Operating Expenses. The property's income before debt service, taxes, and depreciation." />
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const noi = getYearlyConsolidated(y).noi;
                        return (
                          <TableCell key={y} className={`text-right ${noi < 0 ? 'text-destructive' : ''}`}>
                            {formatMoney(noi)}
                          </TableCell>
                        );
                      })}
                    </TableRow>

                    <TableRow 
                      className="cursor-pointer hover:bg-muted/20"
                      onClick={() => toggleRow('cfDebt')}
                    >
                      <TableCell className="sticky left-0 bg-card flex items-center gap-2">
                        {expandedRows.has('cfDebt') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Debt Service
                        <HelpTooltip text="Total debt payment including principal and interest. Paid to lenders before distributions to investors." />
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const debt = getYearlyConsolidated(y).debtPayment;
                        return <TableCell key={y} className="text-right text-muted-foreground">{debt > 0 ? `(${formatMoney(debt)})` : '-'}</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('cfDebt') && properties.filter(p => p.type === 'Financed').map((prop, idx) => {
                      const propIdx = properties.findIndex(p => p.id === prop.id);
                      return (
                        <TableRow key={prop.id} className="bg-muted/10">
                          <TableCell className="sticky left-0 bg-muted/10 pl-8 text-sm text-muted-foreground">{prop.name}</TableCell>
                          {Array.from({ length: 10 }, (_, y) => {
                            const debt = getPropertyYearly(propIdx, y).debtPayment;
                            return (
                              <TableCell key={y} className="text-right text-sm text-muted-foreground">
                                {debt > 0 ? `(${formatMoney(debt)})` : '-'}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}

                    <TableRow className="bg-primary/10 font-bold">
                      <TableCell className="sticky left-0 bg-primary/10 flex items-center gap-1">
                        Net Cash Flow
                        <HelpTooltip text="Cash available after debt service. For unlevered properties, equals NOI." />
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const cf = getYearlyConsolidated(y).cashFlow;
                        return (
                          <TableCell key={y} className={`text-right ${cf < 0 ? 'text-destructive' : ''}`}>
                            {formatMoney(cf)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    <TableRow 
                      className="cursor-pointer hover:bg-muted/10"
                      onClick={() => toggleRow('cfByProperty')}
                    >
                      <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2 text-muted-foreground italic">
                        {expandedRows.has('cfByProperty') ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        By Property
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => (
                        <TableCell key={y} className="text-right text-muted-foreground">-</TableCell>
                      ))}
                    </TableRow>
                    {expandedRows.has('cfByProperty') && properties.map((prop, idx) => (
                      <TableRow key={prop.id} className="bg-muted/10">
                        <TableCell className="sticky left-0 bg-muted/10 pl-10 text-sm text-muted-foreground">{prop.name}</TableCell>
                        {Array.from({ length: 10 }, (_, y) => {
                          const cf = getPropertyYearly(idx, y).cashFlow;
                          return (
                            <TableCell key={y} className={`text-right text-sm ${cf < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                              {formatMoney(cf)}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balance" className="mt-6">
            <ConsolidatedBalanceSheet 
              properties={properties} 
              global={global} 
              allProFormas={allPropertyFinancials.map(pf => ({ property: pf.property, data: pf.financials }))}
              year={10}
            />
          </TabsContent>

          <TabsContent value="investment" className="mt-6 space-y-6">
            <InvestmentAnalysis 
              properties={properties} 
              allPropertyFinancials={allPropertyFinancials}
              getPropertyYearly={getPropertyYearly}
              getYearlyConsolidated={getYearlyConsolidated}
              global={global}
              expandedRows={expandedRows}
              toggleRow={toggleRow}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function calculateIRR(cashFlows: number[], guess: number = 0.1): number {
  const maxIterations = 100;
  const tolerance = 0.0001;
  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivNpv = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const denominator = Math.pow(1 + rate, t);
      npv += cashFlows[t] / denominator;
      if (t > 0) {
        derivNpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
      }
    }

    if (Math.abs(npv) < tolerance) {
      return rate;
    }

    if (derivNpv === 0) break;
    rate = rate - npv / derivNpv;

    if (rate < -1) rate = -0.99;
  }

  return rate;
}

interface InvestmentAnalysisProps {
  properties: any[];
  allPropertyFinancials: any[];
  getPropertyYearly: (propIndex: number, yearIndex: number) => any;
  getYearlyConsolidated: (yearIndex: number) => any;
  global: any;
  expandedRows: Set<string>;
  toggleRow: (rowId: string) => void;
}

function InvestmentAnalysis({ 
  properties, 
  allPropertyFinancials, 
  getPropertyYearly, 
  getYearlyConsolidated,
  global,
  expandedRows,
  toggleRow
}: InvestmentAnalysisProps) {
  const DEPRECIATION_YEARS = 27.5;
  
  const fiscalYearStartMonth = global.fiscalYearStartMonth ?? 1;
  const getFiscalYear = (yearIndex: number) => getFiscalYearForModelYear(global.modelStartDate, fiscalYearStartMonth, yearIndex);

  const getPropertyAcquisitionYear = (prop: any): number => {
    const acqDate = new Date(prop.acquisitionDate);
    const modelStart = new Date(global.modelStartDate);
    const monthsDiff = (acqDate.getFullYear() - modelStart.getFullYear()) * 12 + 
                       (acqDate.getMonth() - modelStart.getMonth());
    return Math.floor(monthsDiff / 12);
  };

  const getPropertyInvestment = (prop: any) => {
    const totalInvestment = prop.purchasePrice + prop.buildingImprovements + 
                            prop.preOpeningCosts + prop.operatingReserve;
    if (prop.type === "Financed") {
      const ltv = prop.acquisitionLTV || global.debtAssumptions.acqLTV || 0.75;
      return totalInvestment * (1 - ltv);
    }
    return totalInvestment;
  };

  const getEquityInvestmentForYear = (yearIndex: number): number => {
    let total = 0;
    properties.forEach(prop => {
      const acqYear = getPropertyAcquisitionYear(prop);
      if (acqYear === yearIndex) {
        total += getPropertyInvestment(prop);
      }
    });
    return total;
  };

  const getPropertyLoanAmount = (prop: any) => {
    if (prop.type !== "Financed") return 0;
    const ltv = prop.acquisitionLTV || global.debtAssumptions.acqLTV || 0.75;
    return (prop.purchasePrice + prop.buildingImprovements) * ltv;
  };

  const getAnnualDepreciation = (prop: any) => {
    const depreciableBase = prop.purchasePrice + prop.buildingImprovements;
    return depreciableBase / DEPRECIATION_YEARS;
  };

  const getRefiYear = (prop: any): number => {
    if (prop.willRefinance !== "Yes") return -1;
    const refiDate = new Date(prop.refinanceDate);
    const modelStart = new Date(global.modelStartDate);
    const monthsDiff = (refiDate.getFullYear() - modelStart.getFullYear()) * 12 + 
                       (refiDate.getMonth() - modelStart.getMonth());
    return Math.floor(monthsDiff / 12);
  };

  const getDebtServiceDetails = (prop: any, propIndex: number, yearIndex: number) => {
    const refiYear = getRefiYear(prop);
    const isPostRefi = refiYear >= 0 && refiYear < 10 && yearIndex >= refiYear;
    
    if (isPostRefi) {
      const refiLTV = prop.refinanceLTV || global.debtAssumptions.refiLTV || 0.65;
      const { financials } = allPropertyFinancials[propIndex];
      const stabilizedData = financials.slice(refiYear * 12, (refiYear + 1) * 12);
      const stabilizedNOI = stabilizedData.reduce((a: number, m: any) => a + m.noi, 0);
      const capRate = prop.exitCapRate || 0.085;
      const propertyValue = stabilizedNOI / capRate;
      const refiLoanAmount = propertyValue * refiLTV;
      
      const annualRate = prop.refinanceInterestRate || global.debtAssumptions.interestRate || 0.09;
      const r = annualRate / 12;
      const termYears = prop.refinanceTermYears || global.debtAssumptions.amortizationYears || 25;
      const n = termYears * 12;
      
      if (r <= 0 || n <= 0 || refiLoanAmount <= 0) return { debtService: 0, interestPortion: 0, principalPortion: 0 };
      
      const monthlyPayment = (refiLoanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const annualDebtService = monthlyPayment * 12;
      
      let remainingBalance = refiLoanAmount;
      let totalInterest = 0;
      let totalPrincipal = 0;
      
      const yearsSinceRefi = yearIndex - refiYear;
      const startMonth = yearsSinceRefi * 12;
      const endMonth = startMonth + 12;
      
      for (let m = 0; m < endMonth && m < n; m++) {
        const interestPayment = remainingBalance * r;
        const principalPayment = monthlyPayment - interestPayment;
        
        if (m >= startMonth) {
          totalInterest += interestPayment;
          totalPrincipal += principalPayment;
        }
        
        remainingBalance -= principalPayment;
      }
      
      return { 
        debtService: annualDebtService, 
        interestPortion: totalInterest, 
        principalPortion: totalPrincipal 
      };
    }
    
    const loanAmount = getPropertyLoanAmount(prop);
    if (loanAmount <= 0) return { debtService: 0, interestPortion: 0, principalPortion: 0 };

    const annualRate = prop.acquisitionInterestRate || global.debtAssumptions.interestRate || 0.09;
    const r = annualRate / 12;
    const termYears = prop.acquisitionTermYears || global.debtAssumptions.amortizationYears || 25;
    const n = termYears * 12;

    if (r <= 0 || n <= 0) return { debtService: 0, interestPortion: 0, principalPortion: 0 };

    const monthlyPayment = (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const annualDebtService = monthlyPayment * 12;

    let remainingBalance = loanAmount;
    let totalInterest = 0;
    let totalPrincipal = 0;

    const startMonth = yearIndex * 12;
    const endMonth = startMonth + 12;

    for (let m = 0; m < endMonth && m < n; m++) {
      const interestPayment = remainingBalance * r;
      const principalPayment = monthlyPayment - interestPayment;
      
      if (m >= startMonth) {
        totalInterest += interestPayment;
        totalPrincipal += principalPayment;
      }
      
      remainingBalance -= principalPayment;
    }

    return { 
      debtService: annualDebtService, 
      interestPortion: totalInterest, 
      principalPortion: totalPrincipal 
    };
  };

  const getOutstandingLoanBalance = (prop: any, afterYear: number) => {
    const loanAmount = getPropertyLoanAmount(prop);
    if (loanAmount <= 0) return 0;

    const annualRate = prop.acquisitionInterestRate || global.debtAssumptions.interestRate || 0.09;
    const r = annualRate / 12;
    const termYears = prop.acquisitionTermYears || global.debtAssumptions.amortizationYears || 25;
    const n = termYears * 12;

    if (r <= 0 || n <= 0) return 0;

    // Calculate months since acquisition to end of target year
    // Loan payments begin at acquisition date (property closing)
    const modelStart = new Date(global.modelStartDate);
    const acqDate = new Date(prop.acquisitionDate);
    const acqMonthsFromModelStart = (acqDate.getFullYear() - modelStart.getFullYear()) * 12 + 
                                     (acqDate.getMonth() - modelStart.getMonth());
    const endOfYearMonth = (afterYear + 1) * 12;
    
    // If property hasn't been acquired yet, no loan exists yet
    if (acqMonthsFromModelStart > endOfYearMonth) return 0;
    
    // Calculate payments made, capped at total loan term
    const rawMonthsPaid = endOfYearMonth - Math.max(0, acqMonthsFromModelStart);
    const monthsPaid = Math.min(Math.max(0, rawMonthsPaid), n);

    const monthlyPayment = (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const paymentsRemaining = n - monthsPaid;

    if (paymentsRemaining <= 0) return 0;
    return monthlyPayment * (1 - Math.pow(1 + r, -paymentsRemaining)) / r;
  };

  const getPropertyRefinanceProceeds = (prop: any, propIndex: number) => {
    if (prop.willRefinance !== "Yes") return { year: -1, proceeds: 0 };
    
    const refiDate = new Date(prop.refinanceDate);
    const modelStart = new Date(global.modelStartDate);
    const monthsDiff = (refiDate.getFullYear() - modelStart.getFullYear()) * 12 + 
                       (refiDate.getMonth() - modelStart.getMonth());
    const refiYear = Math.floor(monthsDiff / 12);
    
    if (refiYear < 0 || refiYear >= 10) return { year: -1, proceeds: 0 };
    
    const refiLTV = prop.refinanceLTV || global.debtAssumptions.refiLTV || 0.65;
    const closingCostRate = prop.refinanceClosingCostRate || global.debtAssumptions.refiClosingCostRate || 0.02;
    
    const { financials } = allPropertyFinancials[propIndex];
    const stabilizedData = financials.slice(refiYear * 12, (refiYear + 1) * 12);
    const stabilizedNOI = stabilizedData.reduce((a: number, m: any) => a + m.noi, 0);
    const capRate = prop.exitCapRate || 0.085;
    const propertyValue = stabilizedNOI / capRate;
    
    const newLoanAmount = propertyValue * refiLTV;
    const closingCosts = newLoanAmount * closingCostRate;
    const existingDebt = getOutstandingLoanBalance(prop, refiYear - 1);
    
    const netProceeds = newLoanAmount - closingCosts - existingDebt;
    
    return { year: refiYear, proceeds: Math.max(0, netProceeds) };
  };

  const getRefiLoanBalance = (prop: any, propIndex: number, afterYear: number): number => {
    if (prop.willRefinance !== "Yes") return 0;
    
    const refiDate = new Date(prop.refinanceDate);
    const modelStart = new Date(global.modelStartDate);
    const monthsDiff = (refiDate.getFullYear() - modelStart.getFullYear()) * 12 + 
                       (refiDate.getMonth() - modelStart.getMonth());
    const refiYear = Math.floor(monthsDiff / 12);
    
    if (refiYear < 0 || refiYear >= 10 || afterYear < refiYear) return 0;
    
    const refiLTV = prop.refinanceLTV || global.debtAssumptions.refiLTV || 0.65;
    const { financials } = allPropertyFinancials[propIndex];
    const stabilizedData = financials.slice(refiYear * 12, (refiYear + 1) * 12);
    const stabilizedNOI = stabilizedData.reduce((a: number, m: any) => a + m.noi, 0);
    const capRate = prop.exitCapRate || 0.085;
    const propertyValue = stabilizedNOI / capRate;
    const refiLoanAmount = propertyValue * refiLTV;
    
    const annualRate = prop.refinanceInterestRate || global.debtAssumptions.interestRate || 0.09;
    const r = annualRate / 12;
    const termYears = prop.refinanceTermYears || global.debtAssumptions.amortizationYears || 25;
    const n = termYears * 12;
    
    if (r <= 0 || n <= 0) return 0;
    
    const monthlyPayment = (refiLoanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const yearsSinceRefi = afterYear - refiYear + 1;
    const monthsPaid = yearsSinceRefi * 12;
    const paymentsRemaining = Math.max(0, n - monthsPaid);
    
    if (paymentsRemaining <= 0) return 0;
    return monthlyPayment * (1 - Math.pow(1 + r, -paymentsRemaining)) / r;
  };

  const getTotalOutstandingDebt = (prop: any, propIndex: number, afterYear: number): number => {
    if (prop.willRefinance === "Yes") {
      const refiDate = new Date(prop.refinanceDate);
      const modelStart = new Date(global.modelStartDate);
      const monthsDiff = (refiDate.getFullYear() - modelStart.getFullYear()) * 12 + 
                         (refiDate.getMonth() - modelStart.getMonth());
      const refiYear = Math.floor(monthsDiff / 12);
      
      if (refiYear >= 0 && refiYear < 10 && afterYear >= refiYear) {
        return getRefiLoanBalance(prop, propIndex, afterYear);
      }
    }
    return getOutstandingLoanBalance(prop, afterYear);
  };

  const getPropertyExitValue = (prop: any, propIndex: number) => {
    const { financials } = allPropertyFinancials[propIndex];
    const year10Data = financials.slice(108, 120);
    const year10NOI = year10Data.reduce((a: number, m: any) => a + m.noi, 0);
    const capRate = prop.exitCapRate || 0.085;
    const grossValue = year10NOI / capRate;
    const commissionRate = global.commissionRate || 0.05;
    const commission = grossValue * commissionRate;
    const netValue = grossValue - commission;
    const outstandingDebt = getTotalOutstandingDebt(prop, propIndex, 9);
    
    return netValue - outstandingDebt;
  };

  const getPropertyYearlyDetails = (prop: any, propIndex: number, yearIndex: number) => {
    const yearlyData = getPropertyYearly(propIndex, yearIndex);
    const noi = yearlyData.noi || 0;
    const { debtService, interestPortion, principalPortion } = getDebtServiceDetails(prop, propIndex, yearIndex);
    const depreciation = getAnnualDepreciation(prop);
    const taxRate = prop.taxRate || 0.25;

    const btcf = noi - debtService;
    const taxableIncome = noi - interestPortion - depreciation;
    const taxLiability = taxableIncome > 0 ? taxableIncome * taxRate : 0;
    const atcf = btcf - taxLiability;

    return {
      noi,
      debtService,
      interestPortion,
      principalPortion,
      depreciation,
      btcf,
      taxableIncome,
      taxLiability,
      atcf
    };
  };

  const getPropertyCashFlows = (prop: any, propIndex: number): number[] => {
    const flows: number[] = [];
    
    const initialEquity = -getPropertyInvestment(prop);
    flows.push(initialEquity);
    
    const refi = getPropertyRefinanceProceeds(prop, propIndex);
    
    for (let y = 0; y < 10; y++) {
      const details = getPropertyYearlyDetails(prop, propIndex, y);
      let yearCashFlow = details.atcf;
      
      if (y === refi.year) {
        yearCashFlow += refi.proceeds;
      }
      
      if (y === 9) {
        yearCashFlow += getPropertyExitValue(prop, propIndex);
      }
      
      flows.push(yearCashFlow);
    }
    
    return flows;
  };

  const getConsolidatedYearlyDetails = (yearIndex: number) => {
    let totalNOI = 0;
    let totalDebtService = 0;
    let totalInterest = 0;
    let totalPrincipal = 0;
    let totalDepreciation = 0;
    let totalBTCF = 0;
    let totalTaxableIncome = 0;
    let totalTaxLiability = 0;
    let totalATCF = 0;

    properties.forEach((prop, idx) => {
      const details = getPropertyYearlyDetails(prop, idx, yearIndex);
      totalNOI += details.noi;
      totalDebtService += details.debtService;
      totalInterest += details.interestPortion;
      totalPrincipal += details.principalPortion;
      totalDepreciation += details.depreciation;
      totalBTCF += details.btcf;
      totalTaxableIncome += details.taxableIncome;
      totalTaxLiability += details.taxLiability;
      totalATCF += details.atcf;
    });

    return {
      noi: totalNOI,
      debtService: totalDebtService,
      interestPortion: totalInterest,
      principalPortion: totalPrincipal,
      depreciation: totalDepreciation,
      btcf: totalBTCF,
      taxableIncome: totalTaxableIncome,
      taxLiability: totalTaxLiability,
      atcf: totalATCF
    };
  };

  const getConsolidatedCashFlows = (): number[] => {
    const flows: number[] = [];
    const year0Investment = getEquityInvestmentForYear(0);
    flows.push(-year0Investment);
    
    for (let y = 0; y < 10; y++) {
      const consolidated = getConsolidatedYearlyDetails(y);
      let yearCashFlow = consolidated.atcf;
      
      const yearInvestment = getEquityInvestmentForYear(y + 1);
      if (yearInvestment > 0) yearCashFlow -= yearInvestment;
      
      properties.forEach((prop, idx) => {
        const refi = getPropertyRefinanceProceeds(prop, idx);
        if (y === refi.year) {
          yearCashFlow += refi.proceeds;
        }
        
        if (y === 9) {
          yearCashFlow += getPropertyExitValue(prop, idx);
        }
      });
      
      flows.push(yearCashFlow);
    }
    return flows;
  };

  const consolidatedFlowsIA = getConsolidatedCashFlows();
  const portfolioIRRIA = calculateIRR(consolidatedFlowsIA);
  
  const totalInitialEquityIA = properties.reduce((sum, prop) => sum + getPropertyInvestment(prop), 0);
  const totalExitValueIA = properties.reduce((sum, prop, idx) => sum + getPropertyExitValue(prop, idx), 0);

  const totalCashReturnedIA = consolidatedFlowsIA.slice(1).reduce((sum, cf) => sum + cf, 0);
  const equityMultipleIA = totalInitialEquityIA > 0 ? totalCashReturnedIA / totalInitialEquityIA : 0;
  
  const operatingCashFlowsIA = consolidatedFlowsIA.slice(1).map((cf, idx) => {
    let exitValue = 0;
    if (idx === 9) {
      exitValue = properties.reduce((sum, prop, propIdx) => sum + getPropertyExitValue(prop, propIdx), 0);
    }
    return cf - exitValue;
  });
  const avgAnnualCashFlowIA = operatingCashFlowsIA.reduce((sum, cf) => sum + cf, 0) / 10;
  const cashOnCashIA = totalInitialEquityIA > 0 ? (avgAnnualCashFlowIA / totalInitialEquityIA) * 100 : 0;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="bg-gradient-to-br from-primary/90 via-primary/70 to-primary/50 backdrop-blur-xl border border-white/30 shadow-lg shadow-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/80 flex items-center">
              Total Equity
              <HelpTooltip text="Total initial capital required from investors across all properties, including purchase price, improvements, pre-opening costs, and operating reserves (net of any financing)." light />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-foreground">{formatMoney(totalInitialEquityIA)}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-primary/90 via-primary/70 to-primary/50 backdrop-blur-xl border border-white/30 shadow-lg shadow-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/80 flex items-center">
              Exit Value ({getFiscalYear(9)})
              <HelpTooltip text={`Projected sale value of all properties at ${getFiscalYear(10)}, calculated as NOI ÷ Exit Cap Rate, minus any outstanding debt at time of sale.`} light />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-foreground">{formatMoney(totalExitValueIA)}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-primary/90 via-primary/70 to-primary/50 backdrop-blur-xl border border-white/30 shadow-lg shadow-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/80 flex items-center">
              Equity Multiple
              <HelpTooltip text="Total cash returned to investors divided by total equity invested. A 2.0x multiple means investors receive $2 back for every $1 invested." light />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-foreground">{equityMultipleIA.toFixed(2)}x</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-primary/90 via-primary/70 to-primary/50 backdrop-blur-xl border border-white/30 shadow-lg shadow-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/80 flex items-center">
              Avg Cash-on-Cash
              <HelpTooltip text="Average annual operating cash flow (excluding exit proceeds) as a percentage of total equity invested. Measures the annual yield on invested capital." light />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-foreground">{cashOnCashIA.toFixed(1)}%</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-primary/90 via-primary/70 to-primary/50 backdrop-blur-xl border border-white/30 shadow-lg shadow-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/80 flex items-center">
              Portfolio IRR
              <HelpTooltip text="Internal Rate of Return - the annualized return that makes the net present value of all cash flows (investments, distributions, and exit) equal to zero. The gold standard metric for real estate investments." light />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-foreground">{(portfolioIRRIA * 100).toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Free Cash Flow Analysis (10-Year)</CardTitle>
          <p className="text-sm text-muted-foreground">Investor cash flows including distributions, refinancing proceeds, and exit values</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card min-w-[200px]">Category</TableHead>
                <TableHead className="text-right min-w-[110px]">{getFiscalYear(0)}</TableHead>
                {Array.from({ length: 10 }, (_, i) => (
                  <TableHead key={i} className="text-right min-w-[110px]">{getFiscalYear(i + 1)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow 
                className="font-semibold bg-muted/20 cursor-pointer hover:bg-muted/30"
                onClick={() => toggleRow('fcfEquity')}
              >
                <TableCell className="sticky left-0 bg-muted/20 flex items-center gap-2">
                  {expandedRows.has('fcfEquity') ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  Equity Investment
                </TableCell>
                {(() => {
                  const year0Inv = getEquityInvestmentForYear(0);
                  return (
                    <TableCell className={`text-right ${year0Inv > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {year0Inv > 0 ? `(${formatMoney(year0Inv)})` : '-'}
                    </TableCell>
                  );
                })()}
                {Array.from({ length: 10 }, (_, y) => {
                  const yearInv = getEquityInvestmentForYear(y + 1);
                  return (
                    <TableCell key={y} className={`text-right ${yearInv > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {yearInv > 0 ? `(${formatMoney(yearInv)})` : '-'}
                    </TableCell>
                  );
                })}
              </TableRow>
              {expandedRows.has('fcfEquity') && properties.map((prop) => {
                const acqYear = getPropertyAcquisitionYear(prop);
                return (
                  <TableRow key={prop.id} className="bg-muted/10">
                    <TableCell className="sticky left-0 bg-muted/10 pl-8 text-sm text-muted-foreground">{prop.name}</TableCell>
                    <TableCell className={`text-right text-sm ${acqYear === 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {acqYear === 0 ? `(${formatMoney(getPropertyInvestment(prop))})` : '-'}
                    </TableCell>
                    {Array.from({ length: 10 }, (_, y) => (
                      <TableCell key={y} className={`text-right text-sm ${acqYear === y + 1 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {acqYear === y + 1 ? `(${formatMoney(getPropertyInvestment(prop))})` : '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}

              <TableRow 
                className="cursor-pointer hover:bg-muted/20"
                onClick={() => toggleRow('fcfOperating')}
              >
                <TableCell className="sticky left-0 bg-card flex items-center gap-2">
                  {expandedRows.has('fcfOperating') ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  Free Cash Flow to Equity (FCFE)
                  <HelpTooltip text="GAAP FCFE = Cash from Operations - Principal Payments. For hotels where FF&E reserves are included in NOI, this equals After-Tax Cash Flow (ATCF)." />
                </TableCell>
                <TableCell className="text-right text-muted-foreground">-</TableCell>
                {Array.from({ length: 10 }, (_, y) => {
                  const details = getConsolidatedYearlyDetails(y);
                  return (
                    <TableCell key={y} className={`text-right ${details.atcf < 0 ? 'text-destructive' : ''}`}>
                      {formatMoney(details.atcf)}
                    </TableCell>
                  );
                })}
              </TableRow>
              {expandedRows.has('fcfOperating') && (
                <>
                  <TableRow className="bg-blue-50/30 dark:bg-blue-950/20">
                    <TableCell className="sticky left-0 bg-blue-50/30 dark:bg-blue-950/20 pl-8 text-sm font-medium text-muted-foreground" colSpan={1}>
                      Cash Flow
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: 10 }, (_, y) => (
                      <TableCell key={y} className="text-right text-sm text-muted-foreground">-</TableCell>
                    ))}
                  </TableRow>
                  <TableRow className="bg-muted/5">
                    <TableCell className="sticky left-0 bg-muted/5 pl-12 text-sm text-muted-foreground">Net Operating Income (NOI)</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: 10 }, (_, y) => (
                      <TableCell key={y} className="text-right text-sm text-muted-foreground">
                        {formatMoney(getConsolidatedYearlyDetails(y).noi)}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow className="bg-muted/5">
                    <TableCell className="sticky left-0 bg-muted/5 pl-12 text-sm text-muted-foreground">Less: Debt Service (P+I)</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: 10 }, (_, y) => {
                      const ds = getConsolidatedYearlyDetails(y).debtService;
                      return (
                        <TableCell key={y} className="text-right text-sm text-destructive">
                          {ds > 0 ? `(${formatMoney(ds)})` : '-'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="bg-muted/5">
                    <TableCell className="sticky left-0 bg-muted/5 pl-12 text-sm text-muted-foreground flex items-center gap-1">
                      = Before-Tax Cash Flow (BTCF)
                      <HelpTooltip text="BTCF = NOI - Debt Service. Cash available before income taxes." />
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: 10 }, (_, y) => {
                      const btcf = getConsolidatedYearlyDetails(y).btcf;
                      return (
                        <TableCell key={y} className={`text-right text-sm ${btcf < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {formatMoney(btcf)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  
                  <TableRow className="bg-amber-50/30 dark:bg-amber-950/20">
                    <TableCell className="sticky left-0 bg-amber-50/30 dark:bg-amber-950/20 pl-8 text-sm font-medium text-muted-foreground" colSpan={1}>
                      Tax (GAAP)
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: 10 }, (_, y) => (
                      <TableCell key={y} className="text-right text-sm text-muted-foreground">-</TableCell>
                    ))}
                  </TableRow>
                  <TableRow className="bg-muted/5">
                    <TableCell className="sticky left-0 bg-muted/5 pl-12 text-sm text-muted-foreground">Less: Interest Expense</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: 10 }, (_, y) => {
                      const interest = getConsolidatedYearlyDetails(y).interestPortion;
                      return (
                        <TableCell key={y} className="text-right text-sm text-destructive">
                          {interest > 0 ? `(${formatMoney(interest)})` : '-'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="bg-muted/5">
                    <TableCell className="sticky left-0 bg-muted/5 pl-12 text-sm text-muted-foreground">Less: Depreciation (non-cash)</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: 10 }, (_, y) => {
                      const dep = getConsolidatedYearlyDetails(y).depreciation;
                      return (
                        <TableCell key={y} className="text-right text-sm text-destructive">
                          {dep > 0 ? `(${formatMoney(dep)})` : '-'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="bg-muted/5">
                    <TableCell className="sticky left-0 bg-muted/5 pl-12 text-sm text-muted-foreground">= Taxable Income (NOI-Int-Dep)</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: 10 }, (_, y) => {
                      const ti = getConsolidatedYearlyDetails(y).taxableIncome;
                      return (
                        <TableCell key={y} className={`text-right text-sm ${ti < 0 ? 'text-muted-foreground italic' : ''}`}>
                          {formatMoney(ti)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="bg-muted/5">
                    <TableCell className="sticky left-0 bg-muted/5 pl-12 text-sm text-muted-foreground">Tax Liability (if positive)</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: 10 }, (_, y) => {
                      const tax = getConsolidatedYearlyDetails(y).taxLiability;
                      return (
                        <TableCell key={y} className="text-right text-sm text-destructive">
                          {tax > 0 ? `(${formatMoney(tax)})` : '-'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  
                  <TableRow className="bg-green-50/30 dark:bg-green-950/20 border-t">
                    <TableCell className="sticky left-0 bg-green-50/30 dark:bg-green-950/20 pl-8 text-sm font-medium flex items-center gap-1">
                      After-Tax Cash Flow (ATCF)
                      <HelpTooltip text="ATCF = BTCF - Tax Liability. Cash available to investors after all taxes paid." />
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: 10 }, (_, y) => {
                      const atcf = getConsolidatedYearlyDetails(y).atcf;
                      return (
                        <TableCell key={y} className={`text-right text-sm font-medium ${atcf < 0 ? 'text-destructive' : ''}`}>
                          {formatMoney(atcf)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  <TableRow className="bg-muted/10">
                    <TableCell className="sticky left-0 bg-muted/10 pl-8 text-sm text-muted-foreground italic">By Property:</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: 10 }, (_, y) => (
                      <TableCell key={y} className="text-right text-sm text-muted-foreground">-</TableCell>
                    ))}
                  </TableRow>
                  {properties.map((prop, idx) => (
                    <TableRow key={prop.id} className="bg-muted/5" data-testid={`fcf-property-${prop.id}`}>
                      <TableCell className="sticky left-0 bg-muted/5 pl-12 text-sm text-muted-foreground">
                        {prop.name}
                        <span className="text-xs ml-2">({((prop.taxRate || 0.25) * 100).toFixed(0)}% tax)</span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const details = getPropertyYearlyDetails(prop, idx, y);
                        return (
                          <TableCell key={y} className={`text-right text-sm ${details.atcf < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {formatMoney(details.atcf)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </>
              )}

              <TableRow 
                className="cursor-pointer hover:bg-muted/20"
                onClick={() => toggleRow('fcfRefi')}
              >
                <TableCell className="sticky left-0 bg-card flex items-center gap-2">
                  {expandedRows.has('fcfRefi') ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  Refinancing Proceeds
                </TableCell>
                <TableCell className="text-right text-muted-foreground">-</TableCell>
                {Array.from({ length: 10 }, (_, y) => {
                  let totalRefi = 0;
                  properties.forEach((prop, idx) => {
                    const refi = getPropertyRefinanceProceeds(prop, idx);
                    if (y === refi.year) totalRefi += refi.proceeds;
                  });
                  return (
                    <TableCell key={y} className={`text-right ${totalRefi > 0 ? 'text-accent font-medium' : 'text-muted-foreground'}`}>
                      {totalRefi > 0 ? formatMoney(totalRefi) : '-'}
                    </TableCell>
                  );
                })}
              </TableRow>
              {expandedRows.has('fcfRefi') && properties.filter(p => p.willRefinance === "Yes").map((prop, idx) => {
                const propIdx = properties.findIndex(p => p.id === prop.id);
                const refi = getPropertyRefinanceProceeds(prop, propIdx);
                return (
                  <TableRow key={prop.id} className="bg-muted/10">
                    <TableCell className="sticky left-0 bg-muted/10 pl-8 text-sm text-muted-foreground">{prop.name}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                    {Array.from({ length: 10 }, (_, y) => (
                      <TableCell key={y} className={`text-right text-sm ${y === refi.year ? 'text-accent' : 'text-muted-foreground'}`}>
                        {y === refi.year ? formatMoney(refi.proceeds) : '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}

              <TableRow 
                className="cursor-pointer hover:bg-muted/30"
                onClick={() => toggleRow('fcfExit')}
              >
                <TableCell className="sticky left-0 bg-card flex items-center gap-2">
                  {expandedRows.has('fcfExit') ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  Exit Proceeds ({getFiscalYear(10)})
                </TableCell>
                <TableCell className="text-right text-muted-foreground">-</TableCell>
                {Array.from({ length: 10 }, (_, y) => (
                  <TableCell key={y} className={`text-right ${y !== 9 ? 'text-muted-foreground' : ''}`}>
                    {y === 9 ? formatMoney(totalExitValueIA) : '-'}
                  </TableCell>
                ))}
              </TableRow>
              {expandedRows.has('fcfExit') && properties.map((prop, idx) => (
                <TableRow key={prop.id} className="bg-muted/10">
                  <TableCell className="sticky left-0 bg-muted/10 pl-8 text-sm text-muted-foreground">
                    {prop.name} 
                    <span className="text-xs ml-2">({((prop.exitCapRate || 0.085) * 100).toFixed(1)}% cap)</span>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">-</TableCell>
                  {Array.from({ length: 10 }, (_, y) => (
                    <TableCell key={y} className={`text-right text-sm ${y === 9 ? 'text-accent' : 'text-muted-foreground'}`}>
                      {y === 9 ? formatMoney(getPropertyExitValue(prop, idx)) : '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}

              <TableRow className="bg-primary/10">
                <TableCell className="sticky left-0 bg-primary/10">Net Cash Flow to Investors</TableCell>
                {consolidatedFlowsIA.map((cf, i) => (
                  <TableCell key={i} className={`text-right ${cf < 0 ? 'text-destructive' : ''}`}>
                    {formatMoney(cf)}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow className="bg-muted/30">
                <TableCell className="sticky left-0 bg-muted/30 font-semibold">Cumulative Cash Flow</TableCell>
                {(() => {
                  let cumulative = 0;
                  return consolidatedFlowsIA.map((cf, i) => {
                    cumulative += cf;
                    return (
                      <TableCell key={i} className={`text-right font-medium ${cumulative < 0 ? 'text-destructive' : 'text-accent'}`}>
                        {formatMoney(cumulative)}
                      </TableCell>
                    );
                  });
                })()}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Property-Level IRR Analysis</CardTitle>
          <p className="text-sm text-muted-foreground">Individual property returns based on equity investment, cash flows, and exit value</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead className="text-right">Equity Investment</TableHead>
                <TableHead className="text-right">Tax Rate</TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    Exit Cap Rate
                    <HelpTooltip text="Capitalization rate used to value the property at sale. Lower cap rate = higher valuation." />
                  </div>
                </TableHead>
                <TableHead className="text-right">Exit Value ({getFiscalYear(10)})</TableHead>
                <TableHead className="text-right">Total Distributions</TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    Equity Multiple
                    <HelpTooltip text="Total cash returned ÷ Equity invested. A 2.0x means $2 back for every $1 invested." />
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    IRR
                    <HelpTooltip text="Internal Rate of Return - the annualized return that makes NPV of all cash flows = 0." />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((prop, idx) => {
                const equity = getPropertyInvestment(prop);
                const exitValue = getPropertyExitValue(prop, idx);
                const cashFlows = getPropertyCashFlows(prop, idx);
                const irr = calculateIRR(cashFlows);
                const totalDistributions = cashFlows.slice(1).reduce((a, b) => a + b, 0);
                const equityMultiple = totalDistributions / equity;
                
                return (
                  <TableRow key={prop.id}>
                    <TableCell className="font-medium">{prop.name}</TableCell>
                    <TableCell className="text-right">{formatMoney(equity)}</TableCell>
                    <TableCell className="text-right">{((prop.taxRate || 0.25) * 100).toFixed(0)}%</TableCell>
                    <TableCell className="text-right">{((prop.exitCapRate || 0.085) * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right text-accent">{formatMoney(exitValue)}</TableCell>
                    <TableCell className="text-right">{formatMoney(totalDistributions)}</TableCell>
                    <TableCell className="text-right font-medium">{equityMultiple.toFixed(2)}x</TableCell>
                    <TableCell className={`text-right font-bold ${irr > 0.15 ? 'text-accent' : irr > 0 ? 'text-primary' : 'text-destructive'}`}>
                      {(irr * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-primary/10 font-bold">
                <TableCell>Portfolio Total</TableCell>
                <TableCell className="text-right">{formatMoney(totalInitialEquityIA)}</TableCell>
                <TableCell className="text-right text-muted-foreground">-</TableCell>
                <TableCell className="text-right text-muted-foreground">-</TableCell>
                <TableCell className="text-right text-accent">{formatMoney(totalExitValueIA)}</TableCell>
                <TableCell className="text-right">{formatMoney(consolidatedFlowsIA.slice(1).reduce((a, b) => a + b, 0))}</TableCell>
                <TableCell className="text-right">{(consolidatedFlowsIA.slice(1).reduce((a, b) => a + b, 0) / totalInitialEquityIA).toFixed(2)}x</TableCell>
                <TableCell className="text-right text-primary">{(portfolioIRRIA * 100).toFixed(1)}%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
