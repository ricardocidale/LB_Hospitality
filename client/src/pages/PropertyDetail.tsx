import Layout from "@/components/Layout";
import { useProperty, useGlobalAssumptions } from "@/lib/api";
import { generatePropertyProForma, formatMoney, getFiscalYearForModelYear } from "@/lib/financialEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { YearlyIncomeStatement } from "@/components/YearlyIncomeStatement";
import { YearlyCashFlowStatement } from "@/components/YearlyCashFlowStatement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MapPin, Loader2, FileDown, FileSpreadsheet } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { calculateLoanParams, calculatePropertyYearlyCashFlows, LoanParams, GlobalLoanParams } from "@/lib/loanCalculations";

import { useState } from "react";

export default function PropertyDetail() {
  const [, params] = useRoute("/property/:id");
  const propertyId = params?.id ? parseInt(params.id) : 0;
  const [activeTab, setActiveTab] = useState("income");
  
  const { data: property, isLoading: propertyLoading } = useProperty(propertyId);
  const { data: global, isLoading: globalLoading } = useGlobalAssumptions();

  if (propertyLoading || globalLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!property || !global) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <h2 className="text-2xl font-serif font-bold">Property Not Found</h2>
          <Link href="/portfolio">
            <Button>Return to Portfolio</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const fiscalYearStartMonth = global.fiscalYearStartMonth ?? 1;
  const getFiscalYear = (yearIndex: number) => getFiscalYearForModelYear(global.modelStartDate, fiscalYearStartMonth, yearIndex);
  const financials = generatePropertyProForma(property, global, 120);
  
  const yearlyChartData = [];
  for (let y = 0; y < 10; y++) {
    const yearData = financials.slice(y * 12, (y + 1) * 12);
    if (yearData.length === 0) continue;
    yearlyChartData.push({
      year: String(getFiscalYear(y)),
      Revenue: yearData.reduce((a, m) => a + m.revenueTotal, 0),
      GOP: yearData.reduce((a, m) => a + m.gop, 0),
      NOI: yearData.reduce((a, m) => a + m.noi, 0),
      CashFlow: yearData.reduce((a, m) => a + m.cashFlow, 0),
    });
  }

  const years = 10;
  const startYear = getFiscalYear(0);
  
  const getYearlyDetails = () => {
    const result = [];
    for (let y = 0; y < years; y++) {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      result.push({
        revenueRooms: yearData.reduce((a, m) => a + m.revenueRooms, 0),
        revenueEvents: yearData.reduce((a, m) => a + m.revenueEvents, 0),
        revenueFB: yearData.reduce((a, m) => a + m.revenueFB, 0),
        revenueOther: yearData.reduce((a, m) => a + m.revenueOther, 0),
        totalRevenue: yearData.reduce((a, m) => a + m.revenueTotal, 0),
        expenseRooms: yearData.reduce((a, m) => a + m.expenseRooms, 0),
        expenseFB: yearData.reduce((a, m) => a + m.expenseFB, 0),
        expenseEvents: yearData.reduce((a, m) => a + m.expenseEvents, 0),
        expenseMarketing: yearData.reduce((a, m) => a + m.expenseMarketing, 0),
        expensePropertyOps: yearData.reduce((a, m) => a + m.expensePropertyOps, 0),
        expenseUtilitiesVar: yearData.reduce((a, m) => a + m.expenseUtilitiesVar, 0),
        expenseUtilitiesFixed: yearData.reduce((a, m) => a + m.expenseUtilitiesFixed, 0),
        expenseFFE: yearData.reduce((a, m) => a + m.expenseFFE, 0),
        expenseAdmin: yearData.reduce((a, m) => a + m.expenseAdmin, 0),
        expenseIT: yearData.reduce((a, m) => a + m.expenseIT, 0),
        expenseInsurance: yearData.reduce((a, m) => a + m.expenseInsurance, 0),
        expenseTaxes: yearData.reduce((a, m) => a + m.expenseTaxes, 0),
        expenseOther: yearData.reduce((a, m) => a + m.expenseOtherCosts, 0),
        feeBase: yearData.reduce((a, m) => a + m.feeBase, 0),
        feeIncentive: yearData.reduce((a, m) => a + m.feeIncentive, 0),
        totalExpenses: yearData.reduce((a, m) => a + m.totalExpenses, 0),
        noi: yearData.reduce((a, m) => a + m.noi, 0),
      });
    }
    return result;
  };

  const getCashFlowData = () => {
    const yearlyNOIData = [];
    for (let y = 0; y < years; y++) {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      yearlyNOIData.push(yearData.reduce((a, m) => a + m.noi, 0));
    }
    return calculatePropertyYearlyCashFlows(yearlyNOIData, property as LoanParams, global as GlobalLoanParams, years);
  };

  const exportCashFlowCSV = () => {
    const yearlyDetails = getYearlyDetails();
    const cashFlowData = getCashFlowData();
    const headers = ["Line Item", ...Array.from({length: years}, (_, i) => `FY ${startYear + i}`)];
    
    const rows = [
      ["REVENUE"],
      ["Rooms Revenue", ...yearlyDetails.map(y => y.revenueRooms.toFixed(0))],
      ["Events Revenue", ...yearlyDetails.map(y => y.revenueEvents.toFixed(0))],
      ["F&B Revenue", ...yearlyDetails.map(y => y.revenueFB.toFixed(0))],
      ["Other Revenue", ...yearlyDetails.map(y => y.revenueOther.toFixed(0))],
      ["Total Revenue", ...yearlyDetails.map(y => y.totalRevenue.toFixed(0))],
      [""],
      ["OPERATING EXPENSES"],
      ["Rooms Expense", ...yearlyDetails.map(y => y.expenseRooms.toFixed(0))],
      ["F&B Expense", ...yearlyDetails.map(y => y.expenseFB.toFixed(0))],
      ["Events Expense", ...yearlyDetails.map(y => y.expenseEvents.toFixed(0))],
      ["Marketing", ...yearlyDetails.map(y => y.expenseMarketing.toFixed(0))],
      ["Property Operations", ...yearlyDetails.map(y => y.expensePropertyOps.toFixed(0))],
      ["Utilities (Variable)", ...yearlyDetails.map(y => y.expenseUtilitiesVar.toFixed(0))],
      ["Utilities (Fixed)", ...yearlyDetails.map(y => y.expenseUtilitiesFixed.toFixed(0))],
      ["FF&E Reserve", ...yearlyDetails.map(y => y.expenseFFE.toFixed(0))],
      ["Administrative", ...yearlyDetails.map(y => y.expenseAdmin.toFixed(0))],
      ["IT Systems", ...yearlyDetails.map(y => y.expenseIT.toFixed(0))],
      ["Insurance", ...yearlyDetails.map(y => y.expenseInsurance.toFixed(0))],
      ["Property Taxes", ...yearlyDetails.map(y => y.expenseTaxes.toFixed(0))],
      ["Other Expenses", ...yearlyDetails.map(y => y.expenseOther.toFixed(0))],
      ["Base Management Fee", ...yearlyDetails.map(y => y.feeBase.toFixed(0))],
      ["Incentive Management Fee", ...yearlyDetails.map(y => y.feeIncentive.toFixed(0))],
      ["Total Operating Expenses", ...yearlyDetails.map(y => y.totalExpenses.toFixed(0))],
      [""],
      ["Net Operating Income (NOI)", ...cashFlowData.map(y => y.noi.toFixed(0))],
      ["Less: Interest Expense", ...cashFlowData.map(y => (-y.interestExpense).toFixed(0))],
      ["Less: Depreciation", ...cashFlowData.map(y => (-y.depreciation).toFixed(0))],
      ["Less: Income Tax", ...cashFlowData.map(y => (-y.taxLiability).toFixed(0))],
      ["Net Income", ...cashFlowData.map(y => y.netIncome.toFixed(0))],
      [""],
      ["Add: Depreciation", ...cashFlowData.map(y => y.depreciation.toFixed(0))],
      ["Operating Cash Flow", ...cashFlowData.map(y => y.operatingCashFlow.toFixed(0))],
      ["Working Capital Changes", ...cashFlowData.map(y => (-y.workingCapitalChange).toFixed(0))],
      ["Cash from Operations", ...cashFlowData.map(y => y.cashFromOperations.toFixed(0))],
      [""],
      ["Free Cash Flow (FCF)", ...cashFlowData.map(y => y.freeCashFlow.toFixed(0))],
      ["Less: Principal Payment", ...cashFlowData.map(y => (-y.principalPayment).toFixed(0))],
      ["Free Cash Flow to Equity (FCFE)", ...cashFlowData.map(y => y.freeCashFlowToEquity.toFixed(0))],
      [""],
      ["Initial Equity Investment", ...cashFlowData.map(y => y.capitalExpenditures.toFixed(0))],
      ["Refinancing Proceeds", ...cashFlowData.map(y => y.refinancingProceeds.toFixed(0))],
      ["Exit Value", ...cashFlowData.map(y => y.exitValue.toFixed(0))],
      ["Net Cash Flow to Investors", ...cashFlowData.map(y => y.netCashFlowToInvestors.toFixed(0))],
      ["Cumulative Cash Flow", ...cashFlowData.map(y => y.cumulativeCashFlow.toFixed(0))],
    ];

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${property.name.replace(/\s+/g, '_')}_CashFlow.csv`);
    link.click();
  };

  const exportCashFlowPDF = () => {
    const yearlyDetails = getYearlyDetails();
    const cashFlowData = getCashFlowData();
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    
    doc.setFontSize(16);
    doc.text(`${property.name} - Cash Flow Statement`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);

    const headers = [["Line Item", ...Array.from({length: years}, (_, i) => `FY ${startYear + i}`)]];
    
    const fmtNum = (n: number) => n === 0 ? "-" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
    
    const body = [
      [{ content: "REVENUE", colSpan: years + 1, styles: { fontStyle: "bold", fillColor: [230, 230, 230] } }],
      ["Rooms Revenue", ...yearlyDetails.map(y => fmtNum(y.revenueRooms))],
      ["Events Revenue", ...yearlyDetails.map(y => fmtNum(y.revenueEvents))],
      ["F&B Revenue", ...yearlyDetails.map(y => fmtNum(y.revenueFB))],
      ["Other Revenue", ...yearlyDetails.map(y => fmtNum(y.revenueOther))],
      [{ content: "Total Revenue", styles: { fontStyle: "bold" } }, ...yearlyDetails.map(y => ({ content: fmtNum(y.totalRevenue), styles: { fontStyle: "bold" } }))],
      [{ content: "OPERATING EXPENSES", colSpan: years + 1, styles: { fontStyle: "bold", fillColor: [230, 230, 230] } }],
      ["Rooms Expense", ...yearlyDetails.map(y => fmtNum(y.expenseRooms))],
      ["F&B Expense", ...yearlyDetails.map(y => fmtNum(y.expenseFB))],
      ["Events Expense", ...yearlyDetails.map(y => fmtNum(y.expenseEvents))],
      ["Marketing", ...yearlyDetails.map(y => fmtNum(y.expenseMarketing))],
      ["Property Operations", ...yearlyDetails.map(y => fmtNum(y.expensePropertyOps))],
      ["Utilities (Variable)", ...yearlyDetails.map(y => fmtNum(y.expenseUtilitiesVar))],
      ["Utilities (Fixed)", ...yearlyDetails.map(y => fmtNum(y.expenseUtilitiesFixed))],
      ["FF&E Reserve", ...yearlyDetails.map(y => fmtNum(y.expenseFFE))],
      ["Administrative", ...yearlyDetails.map(y => fmtNum(y.expenseAdmin))],
      ["IT Systems", ...yearlyDetails.map(y => fmtNum(y.expenseIT))],
      ["Insurance", ...yearlyDetails.map(y => fmtNum(y.expenseInsurance))],
      ["Property Taxes", ...yearlyDetails.map(y => fmtNum(y.expenseTaxes))],
      ["Other Expenses", ...yearlyDetails.map(y => fmtNum(y.expenseOther))],
      ["Base Management Fee", ...yearlyDetails.map(y => fmtNum(y.feeBase))],
      ["Incentive Management Fee", ...yearlyDetails.map(y => fmtNum(y.feeIncentive))],
      [{ content: "Total Operating Expenses", styles: { fontStyle: "bold" } }, ...yearlyDetails.map(y => ({ content: fmtNum(y.totalExpenses), styles: { fontStyle: "bold" } }))],
      [{ content: "NET INCOME CALCULATION", colSpan: years + 1, styles: { fontStyle: "bold", fillColor: [230, 230, 230] } }],
      [{ content: "Net Operating Income (NOI)", styles: { fontStyle: "bold" } }, ...cashFlowData.map(y => ({ content: fmtNum(y.noi), styles: { fontStyle: "bold" } }))],
      ["Less: Interest Expense", ...cashFlowData.map(y => fmtNum(-y.interestExpense))],
      ["Less: Depreciation", ...cashFlowData.map(y => fmtNum(-y.depreciation))],
      ["Less: Income Tax", ...cashFlowData.map(y => fmtNum(-y.taxLiability))],
      [{ content: "Net Income", styles: { fontStyle: "bold" } }, ...cashFlowData.map(y => ({ content: fmtNum(y.netIncome), styles: { fontStyle: "bold" } }))],
      [{ content: "OPERATING CASH FLOW", colSpan: years + 1, styles: { fontStyle: "bold", fillColor: [230, 230, 230] } }],
      ["Add: Depreciation", ...cashFlowData.map(y => fmtNum(y.depreciation))],
      [{ content: "Operating Cash Flow", styles: { fontStyle: "bold" } }, ...cashFlowData.map(y => ({ content: fmtNum(y.operatingCashFlow), styles: { fontStyle: "bold" } }))],
      ["Working Capital Changes", ...cashFlowData.map(y => fmtNum(-y.workingCapitalChange))],
      [{ content: "Cash from Operations", styles: { fontStyle: "bold" } }, ...cashFlowData.map(y => ({ content: fmtNum(y.cashFromOperations), styles: { fontStyle: "bold" } }))],
      [{ content: "FREE CASH FLOW", colSpan: years + 1, styles: { fontStyle: "bold", fillColor: [230, 230, 230] } }],
      [{ content: "Free Cash Flow (FCF)", styles: { fontStyle: "bold" } }, ...cashFlowData.map(y => ({ content: fmtNum(y.freeCashFlow), styles: { fontStyle: "bold" } }))],
      ["Less: Principal Payment", ...cashFlowData.map(y => fmtNum(-y.principalPayment))],
      [{ content: "Free Cash Flow to Equity (FCFE)", styles: { fontStyle: "bold" } }, ...cashFlowData.map(y => ({ content: fmtNum(y.freeCashFlowToEquity), styles: { fontStyle: "bold" } }))],
      [{ content: "INVESTOR CASH FLOWS", colSpan: years + 1, styles: { fontStyle: "bold", fillColor: [230, 230, 230] } }],
      ["Initial Equity Investment", ...cashFlowData.map(y => fmtNum(y.capitalExpenditures))],
      ["Refinancing Proceeds", ...cashFlowData.map(y => fmtNum(y.refinancingProceeds))],
      ["Exit Value", ...cashFlowData.map(y => fmtNum(y.exitValue))],
      [{ content: "Net Cash Flow to Investors", styles: { fontStyle: "bold" } }, ...cashFlowData.map(y => ({ content: fmtNum(y.netCashFlowToInvestors), styles: { fontStyle: "bold" } }))],
      [{ content: "Cumulative Cash Flow", styles: { fontStyle: "bold" } }, ...cashFlowData.map(y => ({ content: fmtNum(y.cumulativeCashFlow), styles: { fontStyle: "bold" } }))],
    ];

    // Build column styles with right alignment for all numeric columns
    const colStyles: Record<number, any> = { 0: { cellWidth: 45, halign: 'left' } };
    for (let i = 1; i <= years; i++) {
      colStyles[i] = { halign: 'right' };
    }

    autoTable(doc, {
      head: headers,
      body: body as any,
      startY: 28,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [159, 188, 164], textColor: [61, 61, 61], fontStyle: "bold", halign: 'center' },
      columnStyles: colStyles,
    });

    doc.save(`${property.name.replace(/\s+/g, '_')}_CashFlow.pdf`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/portfolio">
            <Button variant="ghost" className="pl-0">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Portfolio
            </Button>
          </Link>
          <Link href={`/property/${propertyId}/edit`}>
            <Button variant="outline" size="sm">Property Assumptions</Button>
          </Link>
        </div>

        <div className="relative h-[280px] rounded-xl overflow-hidden">
          <img src={property.imageUrl} alt={property.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <h1 className="text-3xl font-serif font-bold mb-2">{property.name}</h1>
            <div className="flex items-center gap-4 text-white/80 text-sm">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {property.location}</span>
              <span>{property.roomCount} Rooms</span>
              <Badge variant="outline" className="border-white/40 text-white">{property.status}</Badge>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="grid grid-cols-2 max-w-md">
              <TabsTrigger value="income">Income Statement</TabsTrigger>
              <TabsTrigger value="cashflow">Cash Flows</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                data-testid="button-export-pdf"
                onClick={() => exportCashFlowPDF()}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                data-testid="button-export-csv"
                onClick={() => exportCashFlowCSV()}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
          
          <TabsContent value="income" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Income Statement Trends (10-Year Projection)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={yearlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="year" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        tickLine={false}
                        tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [formatMoney(value), ""]}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="Revenue" 
                        stroke="#5C6BC0" 
                        strokeWidth={2}
                        dot={{ fill: '#5C6BC0' }}
                        name="Total Revenue"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="GOP" 
                        stroke="hsl(var(--chart-3))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--chart-3))' }}
                        name="Gross Operating Profit"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="NOI" 
                        stroke="hsl(var(--chart-4))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--chart-4))' }}
                        name="Net Operating Income"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <YearlyIncomeStatement data={financials} years={10} startYear={getFiscalYear(0)} />
          </TabsContent>
          
          <TabsContent value="cashflow" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Trends (10-Year Projection)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={yearlyChartData.map((d, i) => {
                      const cfData = getCashFlowData();
                      return {
                        ...d,
                        FCF: cfData[i]?.freeCashFlow || 0,
                        FCFE: cfData[i]?.freeCashFlowToEquity || 0,
                        NetToInvestors: cfData[i]?.netCashFlowToInvestors || 0,
                      };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="year" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        tickLine={false}
                        tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [formatMoney(value), ""]}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="NOI" 
                        stroke="hsl(var(--chart-4))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--chart-4))' }}
                        name="Net Operating Income"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="FCF" 
                        stroke="#5C6BC0" 
                        strokeWidth={2}
                        dot={{ fill: '#5C6BC0' }}
                        name="Free Cash Flow"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="FCFE" 
                        stroke="hsl(var(--accent))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--accent))' }}
                        name="Free Cash Flow to Equity"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <YearlyCashFlowStatement 
              data={financials} 
              property={property} 
              global={global}
              years={10} 
              startYear={getFiscalYear(0)} 
              defaultLTV={global.debtAssumptions?.acqLTV ?? 0.75}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
