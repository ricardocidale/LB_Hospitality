import { useState } from "react";
import Layout from "@/components/Layout";
import { useProperties, useGlobalAssumptions } from "@/lib/api";
import { generateCompanyProForma, generatePropertyProForma, formatMoney } from "@/lib/financialEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Users, Briefcase, TrendingUp, Settings2, Loader2, ChevronRight, ChevronDown, FileDown } from "lucide-react";
import { Link } from "wouter";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export default function Company() {
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { data: global, isLoading: globalLoading } = useGlobalAssumptions();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("income");

  const toggleRow = (rowId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
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
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <h2 className="text-2xl font-serif font-bold">Data Not Available</h2>
        </div>
      </Layout>
    );
  }

  const modelStartYear = new Date(global.modelStartDate).getFullYear();
  const financials = generateCompanyProForma(properties, global, 120);
  
  const propertyFinancials = properties.map(p => ({
    property: p,
    financials: generatePropertyProForma(p, global, 120)
  }));
  
  const yearlyChartData = [];
  for (let y = 0; y < 10; y++) {
    const yearData = financials.slice(y * 12, (y + 1) * 12);
    if (yearData.length === 0) continue;
    yearlyChartData.push({
      year: String(modelStartYear + y),
      Revenue: yearData.reduce((a, m) => a + m.totalRevenue, 0),
      Expenses: yearData.reduce((a, m) => a + m.totalExpenses, 0),
      NetIncome: yearData.reduce((a, m) => a + m.netIncome, 0),
    });
  }

  const activePropertyCount = properties.filter(p => p.status === "Operating").length;
  const staffFTE = activePropertyCount <= 3 ? 2.5 : activePropertyCount <= 6 ? 4.5 : 7.0;
  
  const year1Financials = financials.slice(0, 12);
  const year1Revenue = year1Financials.reduce((a, m) => a + m.totalRevenue, 0);
  const year1NetIncome = year1Financials.reduce((a, m) => a + m.netIncome, 0);

  const getPropertyYearlyBaseFee = (propIdx: number, year: number) => {
    const pf = propertyFinancials[propIdx].financials;
    const yearData = pf.slice(year * 12, (year + 1) * 12);
    return yearData.reduce((a, m) => a + m.revenueTotal, 0) * global.baseManagementFee;
  };

  const getPropertyYearlyIncentiveFee = (propIdx: number, year: number) => {
    const pf = propertyFinancials[propIdx].financials;
    const yearData = pf.slice(year * 12, (year + 1) * 12);
    return yearData.reduce((a, m) => a + m.gop, 0) * global.incentiveManagementFee;
  };

  const years = Array.from({ length: 10 }, (_, i) => modelStartYear + i);

  const generateCompanyIncomeData = () => {
    const rows: { category: string; values: number[]; isHeader?: boolean; indent?: number }[] = [];
    
    rows.push({ category: "Revenue", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.totalRevenue, 0);
    }), isHeader: true });
    
    rows.push({ category: "Base Management Fees", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.baseFeeRevenue, 0);
    }), indent: 1 });
    
    properties.forEach((prop, idx) => {
      rows.push({ category: prop.name, values: years.map((_, y) => getPropertyYearlyBaseFee(idx, y)), indent: 2 });
    });
    
    rows.push({ category: "Incentive Fees", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.incentiveFeeRevenue, 0);
    }), indent: 1 });
    
    properties.forEach((prop, idx) => {
      rows.push({ category: prop.name, values: years.map((_, y) => getPropertyYearlyIncentiveFee(idx, y)), indent: 2 });
    });
    
    rows.push({ category: "Operating Expenses", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.totalExpenses, 0);
    }), isHeader: true });
    
    rows.push({ category: "Partner Compensation", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.partnerCompensation, 0);
    }), indent: 1 });
    
    rows.push({ category: "Staff Salaries", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.staffCompensation, 0);
    }), indent: 1 });
    
    rows.push({ category: "Office Lease", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.officeLease, 0);
    }), indent: 1 });
    
    rows.push({ category: "Professional Services", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.professionalServices, 0);
    }), indent: 1 });
    
    rows.push({ category: "Insurance", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.businessInsurance, 0);
    }), indent: 1 });
    
    rows.push({ category: "Travel", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.travelCosts, 0);
    }), indent: 1 });
    
    rows.push({ category: "IT Licensing", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.itLicensing, 0);
    }), indent: 1 });
    
    rows.push({ category: "Marketing", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.marketing, 0);
    }), indent: 1 });
    
    rows.push({ category: "Misc Operations", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.miscOps, 0);
    }), indent: 1 });
    
    rows.push({ category: "Net Income", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.netIncome, 0);
    }), isHeader: true });
    
    return { years, rows };
  };

  const generateCompanyCashFlowData = () => {
    const rows: { category: string; values: number[]; isHeader?: boolean; indent?: number }[] = [];
    
    rows.push({ category: "Cash Inflows", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.totalRevenue + m.safeFunding, 0);
    }), isHeader: true });
    
    rows.push({ category: "Management Fee Revenue", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.totalRevenue, 0);
    }), indent: 1 });
    
    rows.push({ category: "Base Management Fees", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.baseFeeRevenue, 0);
    }), indent: 2 });
    
    rows.push({ category: "Incentive Fees", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.incentiveFeeRevenue, 0);
    }), indent: 2 });
    
    rows.push({ category: "SAFE Funding", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.safeFunding, 0);
    }), indent: 1 });
    
    rows.push({ category: "Cash Outflows", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.totalExpenses, 0);
    }), isHeader: true });
    
    rows.push({ category: "Partner Compensation", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.partnerCompensation, 0);
    }), indent: 1 });
    
    rows.push({ category: "Staff Salaries", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.staffCompensation, 0);
    }), indent: 1 });
    
    rows.push({ category: "Other Operating", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return -yearData.reduce((a, m) => a + m.officeLease + m.professionalServices + m.businessInsurance + m.travelCosts + m.itLicensing + m.marketing + m.miscOps, 0);
    }), indent: 1 });
    
    rows.push({ category: "Net Cash Flow", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      return yearData.reduce((a, m) => a + m.netIncome + m.safeFunding, 0);
    }), isHeader: true });
    
    let cumCash = 0;
    rows.push({ category: "Ending Cash Balance", values: years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      cumCash += yearData.reduce((a, m) => a + m.netIncome + m.safeFunding, 0);
      return cumCash;
    }), isHeader: true });
    
    return { years, rows };
  };

  const generateCompanyBalanceData = () => {
    const rows: { category: string; values: number[]; isHeader?: boolean; indent?: number }[] = [];
    
    let cumCash = 0;
    const cashValues = years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      cumCash += yearData.reduce((a, m) => a + m.netIncome + m.safeFunding, 0);
      return cumCash;
    });
    
    let cumRetained = 0;
    const retainedValues = years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      cumRetained += yearData.reduce((a, m) => a + m.netIncome, 0);
      return cumRetained;
    });
    
    let cumSafe = 0;
    const safeValues = years.map((_, y) => {
      const yearData = financials.slice(y * 12, (y + 1) * 12);
      cumSafe += yearData.reduce((a, m) => a + m.safeFunding, 0);
      return cumSafe;
    });
    
    rows.push({ category: "ASSETS", values: years.map(() => 0), isHeader: true });
    rows.push({ category: "Cash & Cash Equivalents", values: cashValues, indent: 1 });
    rows.push({ category: "TOTAL ASSETS", values: cashValues, isHeader: true });
    
    rows.push({ category: "LIABILITIES", values: years.map(() => 0), isHeader: true });
    rows.push({ category: "SAFE Notes", values: safeValues, indent: 1 });
    rows.push({ category: "TOTAL LIABILITIES", values: safeValues, isHeader: true });
    
    rows.push({ category: "EQUITY", values: years.map(() => 0), isHeader: true });
    rows.push({ category: "Retained Earnings", values: retainedValues, indent: 1 });
    rows.push({ category: "TOTAL EQUITY", values: retainedValues, isHeader: true });
    
    return { years, rows };
  };

  const exportCompanyPDF = (type: 'income' | 'cashflow' | 'balance') => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let data: { years: number[]; rows: any[] };
    let title: string;
    
    switch (type) {
      case 'income':
        data = generateCompanyIncomeData();
        title = 'Income Statement';
        break;
      case 'cashflow':
        data = generateCompanyCashFlowData();
        title = 'Cash Flow Statement';
        break;
      case 'balance':
        data = generateCompanyBalanceData();
        title = 'Balance Sheet';
        break;
    }
    
    doc.setFontSize(18);
    doc.text(`L+B Hospitality Co. - ${title}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`10-Year Projection (${data.years[0]} - ${data.years[9]})`, 14, 22);
    doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy')}`, 14, 27);
    
    const tableData = data.rows.map(row => [
      (row.indent ? '  '.repeat(row.indent) : '') + row.category,
      ...row.values.map((v: number) => {
        if (v === 0 && row.isHeader && !row.category.includes('TOTAL')) return '';
        if (v < 0) return `(${formatMoney(Math.abs(v))})`;
        return formatMoney(v);
      })
    ]);
    
    autoTable(doc, {
      head: [['Category', ...data.years.map(String)]],
      body: tableData,
      startY: 32,
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [159, 188, 164], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 50 } },
      didParseCell: (cellData) => {
        if (cellData.section === 'body' && cellData.row.index !== undefined) {
          const row = data.rows[cellData.row.index];
          if (row?.isHeader) {
            cellData.cell.styles.fontStyle = 'bold';
            cellData.cell.styles.fillColor = [240, 240, 240];
          }
        }
      }
    });
    
    doc.save(`company-${type}.pdf`);
  };

  const exportCompanyCSV = (type: 'income' | 'cashflow' | 'balance') => {
    let data: { years: number[]; rows: any[] };
    
    switch (type) {
      case 'income':
        data = generateCompanyIncomeData();
        break;
      case 'cashflow':
        data = generateCompanyCashFlowData();
        break;
      case 'balance':
        data = generateCompanyBalanceData();
        break;
    }
    
    const headers = ['Category', ...data.years.map(String)];
    const csvRows = [
      headers.join(','),
      ...data.rows.map(row => [
        `"${(row.indent ? '  '.repeat(row.indent) : '') + row.category}"`,
        ...row.values.map((v: number) => v.toFixed(2))
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `company-${type}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-serif font-bold text-foreground mb-1">L+B Hospitality Co.</h2>
            <p className="text-muted-foreground">Corporate Management Entity & Operations</p>
          </div>
          <Link href="/company/assumptions">
            <Button variant="outline" size="sm">
              <Settings2 className="w-4 h-4 mr-2" />
              Company Assumptions
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Management Company Performance (10-Year Projection)</CardTitle>
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
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Expenses" 
                    stroke="hsl(var(--chart-3))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-3))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="NetIncome" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--accent))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full grid-cols-3 max-w-lg">
              <TabsTrigger value="income">Income Statement</TabsTrigger>
              <TabsTrigger value="cashflow">Cash Flows</TabsTrigger>
              <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
            </TabsList>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileDown className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportCompanyPDF(activeTab as 'income' | 'cashflow' | 'balance')}>
                  Download PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportCompanyCSV(activeTab as 'income' | 'cashflow' | 'balance')}>
                  Download CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <TabsContent value="income" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Yearly Income Statement</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-card">Category</TableHead>
                      {Array.from({ length: 10 }, (_, i) => (
                        <TableHead key={i} className="text-right min-w-[100px]">{modelStartYear + i}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell className="sticky left-0 bg-muted/30">Revenue</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                        return <TableCell key={y} className="text-right">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    
                    <TableRow 
                      className="cursor-pointer hover:bg-muted/20"
                      onClick={() => toggleRow('baseFees')}
                    >
                      <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                        {expandedRows.has('baseFees') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Base Management Fees
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.baseFeeRevenue, 0);
                        return <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    
                    {expandedRows.has('baseFees') && properties.map((prop, idx) => (
                      <TableRow key={`base-${prop.id}`} className="bg-muted/10">
                        <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">
                          {prop.name}
                        </TableCell>
                        {Array.from({ length: 10 }, (_, y) => (
                          <TableCell key={y} className="text-right text-sm text-muted-foreground">
                            {formatMoney(getPropertyYearlyBaseFee(idx, y))}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    
                    <TableRow 
                      className="cursor-pointer hover:bg-muted/20"
                      onClick={() => toggleRow('incentiveFees')}
                    >
                      <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                        {expandedRows.has('incentiveFees') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Incentive Fees
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.incentiveFeeRevenue, 0);
                        return <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    
                    {expandedRows.has('incentiveFees') && properties.map((prop, idx) => (
                      <TableRow key={`incentive-${prop.id}`} className="bg-muted/10">
                        <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">
                          {prop.name}
                        </TableCell>
                        {Array.from({ length: 10 }, (_, y) => (
                          <TableCell key={y} className="text-right text-sm text-muted-foreground">
                            {formatMoney(getPropertyYearlyIncentiveFee(idx, y))}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    
                    <TableRow 
                      className="bg-muted/30 font-semibold cursor-pointer hover:bg-muted/40"
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
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.totalExpenses, 0);
                        return <TableCell key={y} className="text-right">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('opex') && (
                      <>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/20"
                          onClick={() => toggleRow('opexComp')}
                        >
                          <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                            {expandedRows.has('opexComp') ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            Compensation
                          </TableCell>
                          {Array.from({ length: 10 }, (_, y) => {
                            const yearData = financials.slice(y * 12, (y + 1) * 12);
                            const total = yearData.reduce((a, m) => a + m.partnerCompensation + m.staffCompensation, 0);
                            return <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(total)}</TableCell>;
                          })}
                        </TableRow>
                        {expandedRows.has('opexComp') && (
                          <>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Partner Compensation</TableCell>
                              {Array.from({ length: 10 }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.partnerCompensation, 0);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(total)}</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Staff Compensation</TableCell>
                              {Array.from({ length: 10 }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.staffCompensation, 0);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(total)}</TableCell>;
                              })}
                            </TableRow>
                          </>
                        )}
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/20"
                          onClick={() => toggleRow('opexFixed')}
                        >
                          <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                            {expandedRows.has('opexFixed') ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            Fixed Overhead
                          </TableCell>
                          {Array.from({ length: 10 }, (_, y) => {
                            const yearData = financials.slice(y * 12, (y + 1) * 12);
                            const total = yearData.reduce((a, m) => a + m.officeLease + m.professionalServices + m.techInfrastructure + m.businessInsurance, 0);
                            return <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(total)}</TableCell>;
                          })}
                        </TableRow>
                        {expandedRows.has('opexFixed') && (
                          <>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Office Lease</TableCell>
                              {Array.from({ length: 10 }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.officeLease, 0);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(total)}</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Professional Services</TableCell>
                              {Array.from({ length: 10 }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.professionalServices, 0);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(total)}</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Tech Infrastructure</TableCell>
                              {Array.from({ length: 10 }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.techInfrastructure, 0);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(total)}</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Business Insurance</TableCell>
                              {Array.from({ length: 10 }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.businessInsurance, 0);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(total)}</TableCell>;
                              })}
                            </TableRow>
                          </>
                        )}
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/20"
                          onClick={() => toggleRow('opexVar')}
                        >
                          <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                            {expandedRows.has('opexVar') ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            Variable Costs
                          </TableCell>
                          {Array.from({ length: 10 }, (_, y) => {
                            const yearData = financials.slice(y * 12, (y + 1) * 12);
                            const total = yearData.reduce((a, m) => a + m.travelCosts + m.itLicensing + m.marketing + m.miscOps, 0);
                            return <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(total)}</TableCell>;
                          })}
                        </TableRow>
                        {expandedRows.has('opexVar') && (
                          <>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Travel Costs</TableCell>
                              {Array.from({ length: 10 }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.travelCosts, 0);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(total)}</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">IT Licensing</TableCell>
                              {Array.from({ length: 10 }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.itLicensing, 0);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(total)}</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Marketing</TableCell>
                              {Array.from({ length: 10 }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.marketing, 0);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(total)}</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Misc Operations</TableCell>
                              {Array.from({ length: 10 }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.miscOps, 0);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground">{formatMoney(total)}</TableCell>;
                              })}
                            </TableRow>
                          </>
                        )}
                      </>
                    )}
                    <TableRow className="bg-primary/10 font-bold">
                      <TableCell className="sticky left-0 bg-primary/10">Net Income</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.netIncome, 0);
                        return (
                          <TableCell key={y} className={`text-right ${total < 0 ? 'text-destructive' : ''}`}>
                            {formatMoney(total)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card italic text-muted-foreground">Net Margin</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const netIncome = yearData.reduce((a, m) => a + m.netIncome, 0);
                        const totalRevenue = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                        const margin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;
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
          
          <TabsContent value="cashflow" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Yearly Cash Flow Statement</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-card">Category</TableHead>
                      {Array.from({ length: 10 }, (_, i) => (
                        <TableHead key={i} className="text-right min-w-[100px]">{modelStartYear + i}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="font-semibold bg-muted/20">
                      <TableCell className="sticky left-0 bg-muted/20">Cash Inflows</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const revenue = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                        const safe = yearData.reduce((a, m) => a + m.safeFunding, 0);
                        return <TableCell key={y} className="text-right">{formatMoney(revenue + safe)}</TableCell>;
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell className="sticky left-0 bg-card pl-6">Management Fee Revenue</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.totalRevenue, 0);
                        return <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    <TableRow 
                      className="cursor-pointer hover:bg-muted/20"
                      onClick={() => toggleRow('cfBaseFees')}
                    >
                      <TableCell className="sticky left-0 bg-card flex items-center gap-2 pl-10">
                        {expandedRows.has('cfBaseFees') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Base Management Fees
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.baseFeeRevenue, 0);
                        return <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('cfBaseFees') && properties.map((prop, idx) => (
                      <TableRow key={`cfbase-${prop.id}`} className="bg-muted/10">
                        <TableCell className="sticky left-0 bg-muted/10 pl-14 text-sm text-muted-foreground">
                          {prop.name}
                        </TableCell>
                        {Array.from({ length: 10 }, (_, y) => (
                          <TableCell key={y} className="text-right text-sm text-muted-foreground">
                            {formatMoney(getPropertyYearlyBaseFee(idx, y))}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    <TableRow 
                      className="cursor-pointer hover:bg-muted/20"
                      onClick={() => toggleRow('cfIncentiveFees')}
                    >
                      <TableCell className="sticky left-0 bg-card flex items-center gap-2 pl-10">
                        {expandedRows.has('cfIncentiveFees') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Incentive Fees
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.incentiveFeeRevenue, 0);
                        return <TableCell key={y} className="text-right text-muted-foreground">{formatMoney(total)}</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('cfIncentiveFees') && properties.map((prop, idx) => (
                      <TableRow key={`cfinc-${prop.id}`} className="bg-muted/10">
                        <TableCell className="sticky left-0 bg-muted/10 pl-14 text-sm text-muted-foreground">
                          {prop.name}
                        </TableCell>
                        {Array.from({ length: 10 }, (_, y) => (
                          <TableCell key={y} className="text-right text-sm text-muted-foreground">
                            {formatMoney(getPropertyYearlyIncentiveFee(idx, y))}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    <TableRow 
                      className="cursor-pointer hover:bg-muted/20"
                      onClick={() => toggleRow('cfSafe')}
                    >
                      <TableCell className="sticky left-0 bg-card flex items-center gap-2 pl-6">
                        {expandedRows.has('cfSafe') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        SAFE Funding
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.safeFunding, 0);
                        return <TableCell key={y} className="text-right text-muted-foreground">{total > 0 ? formatMoney(total) : '-'}</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('cfSafe') && (
                      <>
                        <TableRow className="bg-muted/10">
                          <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">
                            SAFE Tranche 1
                          </TableCell>
                          {Array.from({ length: 10 }, (_, y) => {
                            const yearData = financials.slice(y * 12, (y + 1) * 12);
                            const total = yearData.reduce((a, m) => a + m.safeFunding1, 0);
                            return <TableCell key={y} className="text-right text-sm text-muted-foreground">{total > 0 ? formatMoney(total) : '-'}</TableCell>;
                          })}
                        </TableRow>
                        <TableRow className="bg-muted/10">
                          <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">
                            SAFE Tranche 2
                          </TableCell>
                          {Array.from({ length: 10 }, (_, y) => {
                            const yearData = financials.slice(y * 12, (y + 1) * 12);
                            const total = yearData.reduce((a, m) => a + m.safeFunding2, 0);
                            return <TableCell key={y} className="text-right text-sm text-muted-foreground">{total > 0 ? formatMoney(total) : '-'}</TableCell>;
                          })}
                        </TableRow>
                      </>
                    )}

                    <TableRow 
                      className="font-semibold bg-muted/20 cursor-pointer hover:bg-muted/30"
                      onClick={() => toggleRow('cfOutflows')}
                    >
                      <TableCell className="sticky left-0 bg-muted/20 flex items-center gap-2">
                        {expandedRows.has('cfOutflows') ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        Cash Outflows
                      </TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.totalExpenses, 0);
                        return <TableCell key={y} className="text-right">({formatMoney(total)})</TableCell>;
                      })}
                    </TableRow>
                    {expandedRows.has('cfOutflows') && (
                      <>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/20"
                          onClick={() => toggleRow('cfComp')}
                        >
                          <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                            {expandedRows.has('cfComp') ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            Compensation
                          </TableCell>
                          {Array.from({ length: 10 }, (_, y) => {
                            const yearData = financials.slice(y * 12, (y + 1) * 12);
                            const total = yearData.reduce((a, m) => a + m.partnerCompensation + m.staffCompensation, 0);
                            return <TableCell key={y} className="text-right text-muted-foreground">({formatMoney(total)})</TableCell>;
                          })}
                        </TableRow>
                        {expandedRows.has('cfComp') && (
                          <>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Partner Compensation</TableCell>
                              {Array.from({ length: 10 }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.partnerCompensation, 0);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(total)})</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Staff Compensation</TableCell>
                              {Array.from({ length: 10 }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.staffCompensation, 0);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(total)})</TableCell>;
                              })}
                            </TableRow>
                          </>
                        )}
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/20"
                          onClick={() => toggleRow('cfFixed')}
                        >
                          <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                            {expandedRows.has('cfFixed') ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            Fixed Overhead
                          </TableCell>
                          {Array.from({ length: 10 }, (_, y) => {
                            const yearData = financials.slice(y * 12, (y + 1) * 12);
                            const total = yearData.reduce((a, m) => a + m.officeLease + m.professionalServices + m.techInfrastructure + m.businessInsurance, 0);
                            return <TableCell key={y} className="text-right text-muted-foreground">({formatMoney(total)})</TableCell>;
                          })}
                        </TableRow>
                        {expandedRows.has('cfFixed') && (
                          <>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Office Lease</TableCell>
                              {Array.from({ length: 10 }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.officeLease, 0);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(total)})</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Professional Services</TableCell>
                              {Array.from({ length: 10 }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.professionalServices, 0);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(total)})</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Tech Infrastructure</TableCell>
                              {Array.from({ length: 10 }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.techInfrastructure, 0);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(total)})</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Business Insurance</TableCell>
                              {Array.from({ length: 10 }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.businessInsurance, 0);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(total)})</TableCell>;
                              })}
                            </TableRow>
                          </>
                        )}
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/20"
                          onClick={() => toggleRow('cfVar')}
                        >
                          <TableCell className="sticky left-0 bg-card pl-6 flex items-center gap-2">
                            {expandedRows.has('cfVar') ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            Variable Costs
                          </TableCell>
                          {Array.from({ length: 10 }, (_, y) => {
                            const yearData = financials.slice(y * 12, (y + 1) * 12);
                            const total = yearData.reduce((a, m) => a + m.travelCosts + m.itLicensing + m.marketing + m.miscOps, 0);
                            return <TableCell key={y} className="text-right text-muted-foreground">({formatMoney(total)})</TableCell>;
                          })}
                        </TableRow>
                        {expandedRows.has('cfVar') && (
                          <>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Travel Costs</TableCell>
                              {Array.from({ length: 10 }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.travelCosts, 0);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(total)})</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">IT Licensing</TableCell>
                              {Array.from({ length: 10 }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.itLicensing, 0);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(total)})</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Marketing</TableCell>
                              {Array.from({ length: 10 }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.marketing, 0);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(total)})</TableCell>;
                              })}
                            </TableRow>
                            <TableRow className="bg-muted/10">
                              <TableCell className="sticky left-0 bg-muted/10 pl-12 text-sm text-muted-foreground">Misc Operations</TableCell>
                              {Array.from({ length: 10 }, (_, y) => {
                                const yearData = financials.slice(y * 12, (y + 1) * 12);
                                const total = yearData.reduce((a, m) => a + m.miscOps, 0);
                                return <TableCell key={y} className="text-right text-sm text-muted-foreground">({formatMoney(total)})</TableCell>;
                              })}
                            </TableRow>
                          </>
                        )}
                      </>
                    )}

                    <TableRow className="bg-primary/10 font-bold">
                      <TableCell className="sticky left-0 bg-primary/10">Net Cash Flow</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        const yearData = financials.slice(y * 12, (y + 1) * 12);
                        const total = yearData.reduce((a, m) => a + m.cashFlow, 0);
                        return (
                          <TableCell key={y} className={`text-right ${total < 0 ? 'text-destructive' : ''}`}>
                            {formatMoney(total)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell className="sticky left-0 bg-muted/30">Cumulative Cash</TableCell>
                      {Array.from({ length: 10 }, (_, y) => {
                        let cumulative = 0;
                        for (let i = 0; i <= y; i++) {
                          const yearData = financials.slice(i * 12, (i + 1) * 12);
                          cumulative += yearData.reduce((a, m) => a + m.cashFlow, 0);
                        }
                        return (
                          <TableCell key={y} className={`text-right ${cumulative < 0 ? 'text-destructive' : ''}`}>
                            {formatMoney(cumulative)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Balance Sheet - As of {modelStartYear + 9}</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Calculate cumulative values through Year 10
                  const cumulativeNetIncome = financials.reduce((a, m) => a + m.netIncome, 0);
                  
                  // SAFE funding totals
                  const safeTranche1 = global.safeTranche1Amount || 0;
                  const safeTranche2 = global.safeTranche2Amount || 0;
                  const totalSafeFunding = safeTranche1 + safeTranche2;
                  
                  // Cash = SAFE funding + cumulative net income (simplified - no distributions assumed)
                  const cashBalance = totalSafeFunding + cumulativeNetIncome;
                  
                  // Total Assets
                  const totalAssets = cashBalance;
                  
                  // Liabilities (SAFE notes are technically liability until conversion)
                  const safeNotesPayable = totalSafeFunding;
                  const totalLiabilities = safeNotesPayable;
                  
                  // Equity
                  const retainedEarnings = cumulativeNetIncome;
                  const totalEquity = retainedEarnings;
                  
                  // Total Liabilities + Equity should equal Total Assets
                  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

                  return (
                    <Table>
                      <TableBody>
                        {/* ASSETS */}
                        <TableRow className="bg-muted/30 font-semibold">
                          <TableCell colSpan={2} className="text-lg">ASSETS</TableCell>
                        </TableRow>
                        
                        <TableRow className="bg-muted/20">
                          <TableCell className="font-medium pl-4">Current Assets</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">Cash & Cash Equivalents</TableCell>
                          <TableCell className="text-right">{formatMoney(cashBalance)}</TableCell>
                        </TableRow>
                        <TableRow className="font-medium bg-muted/10">
                          <TableCell className="pl-4">Total Current Assets</TableCell>
                          <TableCell className="text-right">{formatMoney(cashBalance)}</TableCell>
                        </TableRow>
                        
                        <TableRow className="font-semibold border-t-2">
                          <TableCell>TOTAL ASSETS</TableCell>
                          <TableCell className="text-right">{formatMoney(totalAssets)}</TableCell>
                        </TableRow>

                        {/* Spacer */}
                        <TableRow><TableCell colSpan={2} className="h-4"></TableCell></TableRow>

                        {/* LIABILITIES */}
                        <TableRow className="bg-muted/30 font-semibold">
                          <TableCell colSpan={2} className="text-lg">LIABILITIES</TableCell>
                        </TableRow>
                        
                        <TableRow className="bg-muted/20">
                          <TableCell className="font-medium pl-4">Long-Term Liabilities</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">SAFE Notes Payable</TableCell>
                          <TableCell className="text-right">{formatMoney(safeNotesPayable)}</TableCell>
                        </TableRow>
                        <TableRow className="font-medium bg-muted/10">
                          <TableCell className="pl-4">Total Long-Term Liabilities</TableCell>
                          <TableCell className="text-right">{formatMoney(totalLiabilities)}</TableCell>
                        </TableRow>
                        
                        <TableRow className="font-semibold border-t">
                          <TableCell>TOTAL LIABILITIES</TableCell>
                          <TableCell className="text-right">{formatMoney(totalLiabilities)}</TableCell>
                        </TableRow>

                        {/* Spacer */}
                        <TableRow><TableCell colSpan={2} className="h-4"></TableCell></TableRow>

                        {/* EQUITY */}
                        <TableRow className="bg-muted/30 font-semibold">
                          <TableCell colSpan={2} className="text-lg">EQUITY</TableCell>
                        </TableRow>
                        
                        <TableRow>
                          <TableCell className="pl-4">Retained Earnings</TableCell>
                          <TableCell className="text-right">{formatMoney(retainedEarnings)}</TableCell>
                        </TableRow>
                        
                        <TableRow className="font-semibold border-t">
                          <TableCell>TOTAL EQUITY</TableCell>
                          <TableCell className="text-right">{formatMoney(totalEquity)}</TableCell>
                        </TableRow>

                        {/* Spacer */}
                        <TableRow><TableCell colSpan={2} className="h-4"></TableCell></TableRow>

                        {/* TOTAL */}
                        <TableRow className="font-bold border-t-2 bg-primary/10">
                          <TableCell>TOTAL LIABILITIES & EQUITY</TableCell>
                          <TableCell className="text-right">{formatMoney(totalLiabilitiesAndEquity)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
