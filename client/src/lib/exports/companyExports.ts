import { format } from "date-fns";
import domtoimage from 'dom-to-image-more';
import { drawLineChart } from "@/lib/exports/pdfChartDrawer";
import { exportCompanyPPTX } from "@/lib/exports/pptxExport";
import { downloadCSV } from "@/lib/exports/csvExport";
import { buildFinancialTableConfig, addFooters, drawTitle, drawSubtitle, drawSubtitleRow } from "@/lib/exports/pdfHelpers";
import {
  exportCompanyIncomeStatement,
  exportCompanyCashFlow,
  exportCompanyBalanceSheet
} from "@/lib/exports/excelExport";

export const exportCompanyPDF = async (
  type: 'income' | 'cashflow' | 'balance',
  data: { years: number[]; rows: any[] },
  global: any,
  projectionYears: number,
  yearlyChartData: any[],
  orientation: 'landscape' | 'portrait' = 'landscape'
) => {
  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageWidth = orientation === 'landscape' ? 297 : 210;
  const chartWidth = pageWidth - 28;
  const companyName = global?.companyName || "Management Company";

  let title: string;
  switch (type) {
    case 'income': title = 'Income Statement'; break;
    case 'cashflow': title = 'Cash Flow Statement'; break;
    case 'balance': title = 'Balance Sheet'; break;
    default: title = 'Financial Statement';
  }
  const entityTag = `${companyName} \u2014 Management Company`;

  drawTitle(doc, `${companyName} \u2014 ${title}`, 14, 15);
  drawSubtitleRow(doc,
    `${projectionYears}-Year Projection (${data.years[0]} \u2013 ${data.years[data.years.length - 1]})`,
    entityTag, 14, 22, pageWidth);
  drawSubtitle(doc, `Generated: ${format(new Date(), 'MMM d, yyyy')}`, 14, 27);

  const tableConfig = buildFinancialTableConfig(data.years, data.rows, orientation, 32);
  autoTable(doc, tableConfig);

  if (yearlyChartData && yearlyChartData.length > 0) {
    doc.addPage();
    drawTitle(doc, `${companyName} \u2014 ${title} Performance Trend`, 14, 15, { fontSize: 16 });
    drawSubtitleRow(doc,
      `${projectionYears}-Year Revenue, Expenses, and Net Income Trend`,
      entityTag, 14, 22, pageWidth);

    drawLineChart({
      doc,
      x: 14,
      y: 30,
      width: chartWidth,
      height: 150,
      title: `Management Company Performance (${projectionYears}-Year Projection)`,
      series: [
        { name: 'Revenue', data: yearlyChartData.map((d: any) => ({ label: String(d.year), value: d.Revenue })), color: '#257D41' },
        { name: 'Expenses', data: yearlyChartData.map((d: any) => ({ label: String(d.year), value: d.Expenses })), color: '#3B82F6' },
        { name: 'Net Income', data: yearlyChartData.map((d: any) => ({ label: String(d.year), value: d.NetIncome })), color: '#F4795B' },
      ],
    });
  }

  addFooters(doc, companyName);
  doc.save(`${companyName} - ${title}.pdf`);
};

export const exportCompanyCSV = (
  type: 'income' | 'cashflow' | 'balance',
  data: { years: number[]; rows: any[] },
  companyName?: string
) => {
  const headers = ['Category', ...data.years.map(String)];
  const csvRows = [
    headers.join(','),
    ...data.rows.map(row => [
      `"${(row.indent ? '  '.repeat(row.indent) : '') + row.category}"`,
      ...row.values.map((v: number) => v.toFixed(2))
    ].join(','))
  ];

  const csvContent = csvRows.join('\n');
  const name = companyName || "Management Company";
  const typeLabel = type === 'income' ? 'Income Statement' : type === 'cashflow' ? 'Cash Flow' : 'Balance Sheet';
  downloadCSV(csvContent, `${name} - ${typeLabel}.csv`);
};

export const handleExcelExport = async (
  activeTab: string,
  financials: any[],
  projectionYears: number,
  global: any,
  fiscalYearStartMonth: number
) => {
  if (!global) return;
  await exportCompanyFullWorkbook(financials, projectionYears, global, fiscalYearStartMonth);
};

async function exportCompanyFullWorkbook(
  data: any[],
  years: number,
  global: any,
  fiscalYearStartMonth: number
) {
  const { getFiscalYearForModelYear } = await import("@/lib/financialEngine");
  const XLSX = await import("xlsx");
  const wb = (XLSX as any).utils.book_new();
  const companyName = global?.companyName || "Management Company";
  const modelStartDate = global.modelStartDate;

  const yearLabels: string[] = [];
  for (let y = 0; y < years; y++) {
    yearLabels.push(String(getFiscalYearForModelYear(modelStartDate, fiscalYearStartMonth, y)));
  }

  const yearlyData: any[] = [];
  for (let y = 0; y < years; y++) {
    const yearSlice = data.slice(y * 12, (y + 1) * 12);
    if (yearSlice.length === 0) continue;
    const vendorCostByCategory: Record<string, number> = {};
    yearSlice.forEach((m: any) => {
      if (m.costOfCentralizedServices) {
        for (const [catName, cat] of Object.entries(m.costOfCentralizedServices.byCategory) as any) {
          if (cat.serviceModel === 'centralized') {
            vendorCostByCategory[catName] = (vendorCostByCategory[catName] ?? 0) + cat.vendorCost;
          }
        }
      }
    });
    yearlyData.push({
      baseFee: yearSlice.reduce((a: number, m: any) => a + m.baseFeeRevenue, 0),
      incentiveFee: yearSlice.reduce((a: number, m: any) => a + m.incentiveFeeRevenue, 0),
      totalRevenue: yearSlice.reduce((a: number, m: any) => a + m.totalRevenue, 0),
      totalVendorCost: yearSlice.reduce((a: number, m: any) => a + m.totalVendorCost, 0),
      grossProfit: yearSlice.reduce((a: number, m: any) => a + m.grossProfit, 0),
      vendorCostByCategory,
      partnerComp: yearSlice.reduce((a: number, m: any) => a + m.partnerCompensation, 0),
      staffComp: yearSlice.reduce((a: number, m: any) => a + m.staffCompensation, 0),
      officeLease: yearSlice.reduce((a: number, m: any) => a + m.officeLease, 0),
      profServices: yearSlice.reduce((a: number, m: any) => a + m.professionalServices, 0),
      techInfra: yearSlice.reduce((a: number, m: any) => a + m.techInfrastructure, 0),
      
      travel: yearSlice.reduce((a: number, m: any) => a + m.travelCosts, 0),
      itLicensing: yearSlice.reduce((a: number, m: any) => a + m.itLicensing, 0),
      marketing: yearSlice.reduce((a: number, m: any) => a + m.marketing, 0),
      miscOps: yearSlice.reduce((a: number, m: any) => a + m.miscOps, 0),
      totalExpenses: yearSlice.reduce((a: number, m: any) => a + m.totalExpenses, 0),
      netIncome: yearSlice.reduce((a: number, m: any) => a + m.netIncome, 0),
      safeFunding: yearSlice.reduce((a: number, m: any) => a + m.safeFunding, 0),
      cashFlow: yearSlice.reduce((a: number, m: any) => a + m.cashFlow, 0),
      fundingInterestExpense: yearSlice.reduce((a: number, m: any) => a + (m.fundingInterestExpense ?? 0), 0),
      fundingInterestPayment: yearSlice.reduce((a: number, m: any) => a + (m.fundingInterestPayment ?? 0), 0),
      cumulativeAccruedInterest: yearSlice.length > 0 ? (yearSlice[yearSlice.length - 1].cumulativeAccruedInterest ?? 0) : 0,
    });
  }

  const hasVendorCosts = yearlyData.some((y: any) => y.totalVendorCost > 0);
  const centralizedCategories: string[] = [];
  if (hasVendorCosts) {
    const sample = yearlyData.find((y: any) => Object.keys(y.vendorCostByCategory).length > 0);
    if (sample) centralizedCategories.push(...Object.keys(sample.vendorCostByCategory));
  }

  const addSheet = async (sheetName: string, rows: (string | number)[][]) => {
    const ws = (XLSX as any).utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 38 }, ...yearLabels.map(() => ({ wch: 16 }))];
    const { applyCurrencyFormat, applyHeaderStyle } = await import("@/lib/exports/excel/helpers");
    applyCurrencyFormat(ws, rows);
    applyHeaderStyle(ws, rows);
    (XLSX as any).utils.book_append_sheet(wb, ws, sheetName);
  };

  const isRows: (string | number)[][] = [
    ["Income Statement", ...yearLabels],
    [],
    ["REVENUE"],
    ["  Base Management Fees", ...yearlyData.map(y => y.baseFee)],
    ["  Incentive Management Fees", ...yearlyData.map(y => y.incentiveFee)],
    ["Total Revenue", ...yearlyData.map(y => y.totalRevenue)],
    [],
  ];
  if (hasVendorCosts) {
    isRows.push(["COST OF CENTRALIZED SERVICES"]);
    centralizedCategories.forEach(catName => {
      isRows.push([`  ${catName} (Vendor Cost)`, ...yearlyData.map(y => y.vendorCostByCategory[catName] ?? 0)]);
    });
    isRows.push(["Total Vendor Cost", ...yearlyData.map(y => y.totalVendorCost)]);
    isRows.push([]);
    isRows.push(["Gross Profit", ...yearlyData.map(y => y.grossProfit)]);
    isRows.push([]);
  }
  const hasInterest = yearlyData.some((y: any) => y.fundingInterestExpense > 0);
  isRows.push(
    ["OPERATING EXPENSES"],
    ["  Partner Compensation", ...yearlyData.map(y => y.partnerComp)],
    ["  Staff Compensation", ...yearlyData.map(y => y.staffComp)],
    ["  Office Lease", ...yearlyData.map(y => y.officeLease)],
    ["  Professional Services", ...yearlyData.map(y => y.profServices)],
    ["  Technology Infrastructure", ...yearlyData.map(y => y.techInfra)],
    
    ["  Travel Costs", ...yearlyData.map(y => y.travel)],
    ["  IT Licensing", ...yearlyData.map(y => y.itLicensing)],
    ["  Marketing", ...yearlyData.map(y => y.marketing)],
    ["  Miscellaneous Operations", ...yearlyData.map(y => y.miscOps)],
    ["Total Expenses", ...yearlyData.map(y => y.totalExpenses)],
    [],
    [hasInterest ? "Operating Income (EBITDA)" : "Net Income", ...yearlyData.map(y => {
      const ebitda = y.totalRevenue - y.totalVendorCost - y.totalExpenses;
      return hasInterest ? ebitda : y.netIncome;
    })],
  );
  if (hasInterest) {
    isRows.push(
      [],
      ["Interest Expense", ...yearlyData.map(y => -y.fundingInterestExpense)],
      ["Pre-Tax Income", ...yearlyData.map(y => {
        const ebitda = y.totalRevenue - y.totalVendorCost - y.totalExpenses;
        return ebitda - y.fundingInterestExpense;
      })],
      ["Tax Expense", ...yearlyData.map(y => {
        const ebitda = y.totalRevenue - y.totalVendorCost - y.totalExpenses;
        const preTax = ebitda - y.fundingInterestExpense;
        const taxRate = global?.companyTaxRate ?? 0;
        return preTax > 0 ? -(preTax * taxRate) : 0;
      })],
      ["Net Income", ...yearlyData.map(y => y.netIncome)],
    );
  }
  isRows.push(
    [],
    ["FUNDING"],
    ["  Funding Received", ...yearlyData.map(y => y.safeFunding)],
    ["Cash Flow", ...yearlyData.map(y => y.cashFlow)],
  );
  await addSheet("Income Statement", isRows);

  let cumulative = 0;
  const openingCash = yearlyData.map((_: any, i: number) => {
    if (i === 0) return 0;
    let cum = 0;
    for (let j = 0; j < i; j++) cum += yearlyData[j].cashFlow;
    return cum;
  });
  const closingCash = yearlyData.map((y: any) => {
    cumulative += y.cashFlow;
    return cumulative;
  });
  const hasCFVendorCosts = yearlyData.some((y: any) => y.totalVendorCost > 0);

  const cfRows: (string | number)[][] = [
    ["Cash Flow Statement", ...yearLabels],
    [],
    ["CASH FLOW FROM OPERATING ACTIVITIES"],
    ["  Cash Received from Management Fees", ...yearlyData.map(y => y.totalRevenue)],
    ["    Base Management Fees", ...yearlyData.map(y => y.baseFee)],
    ["    Incentive Management Fees", ...yearlyData.map(y => y.incentiveFee)],
  ];
  if (hasCFVendorCosts) {
    cfRows.push(["  Cash Paid to Service Vendors", ...yearlyData.map(y => -y.totalVendorCost)]);
  }
  cfRows.push(
    ["  Cash Paid for Operating Expenses", ...yearlyData.map(y => -y.totalExpenses)],
    ["    Compensation", ...yearlyData.map(y => -(y.partnerComp + y.staffComp))],
    ["    Fixed Overhead", ...yearlyData.map(y => -(y.officeLease + y.profServices + y.techInfra))],
    ["    Variable Costs", ...yearlyData.map(y => -(y.travel + y.itLicensing + y.marketing + y.miscOps))],
  );
  const cfHasInterest = yearlyData.some((y: any) => y.fundingInterestExpense > 0);
  if (cfHasInterest) {
    cfRows.push(
      ["  Add Back: Interest Expense", ...yearlyData.map(y => y.fundingInterestExpense)],
    );
  }
  cfRows.push(
    ["Net Cash from Operating Activities", ...yearlyData.map(y => {
      const opsCF = y.netIncome + y.fundingInterestExpense;
      return opsCF;
    })],
    [],
    ["CASH FLOW FROM FINANCING ACTIVITIES"],
    ["  Funding Received", ...yearlyData.map(y => y.safeFunding)],
  );
  if (cfHasInterest) {
    cfRows.push(
      ["  Interest Paid on Notes", ...yearlyData.map(y => -y.fundingInterestPayment)],
    );
  }
  cfRows.push(
    ["Net Cash from Financing Activities", ...yearlyData.map(y => y.safeFunding - y.fundingInterestPayment)],
    [],
    ["Net Increase (Decrease) in Cash", ...yearlyData.map(y => y.cashFlow)],
    ["Opening Cash Balance", ...openingCash],
    ["Closing Cash Balance", ...closingCash],
  );
  await addSheet("Cash Flow", cfRows);

  const totalSafeFunding = (global.safeTranche1Amount || 0) + (global.safeTranche2Amount || 0);
  const cumRetainedEarnings = yearlyData.map((_: any, i: number) => {
    let cum = 0;
    for (let j = 0; j <= i; j++) cum += yearlyData[j].netIncome;
    return cum;
  });
  const bsHasAccruedInterest = yearlyData.some((y: any) => y.cumulativeAccruedInterest > 0);
  const totalLiabilitiesByYear = yearlyData.map((y: any) => totalSafeFunding + y.cumulativeAccruedInterest);
  const totalEquityByYear = cumRetainedEarnings;
  const bsRows: (string | number)[][] = [
    [`Balance Sheet`, ...yearLabels],
    [],
    ["ASSETS"],
    ["  Cash & Cash Equivalents", ...closingCash],
    ["Total Assets", ...closingCash],
    [],
    ["LIABILITIES"],
    ["  Funding Notes Payable", ...yearlyData.map(() => totalSafeFunding)],
  ];
  if (bsHasAccruedInterest) {
    bsRows.push(
      ["  Accrued Interest on Notes", ...yearlyData.map(y => y.cumulativeAccruedInterest)],
    );
  }
  bsRows.push(
    ["Total Liabilities", ...totalLiabilitiesByYear],
    [],
    ["EQUITY"],
    ["  Retained Earnings", ...cumRetainedEarnings],
    ["Total Equity", ...totalEquityByYear],
    [],
    ["Total Liabilities + Equity", ...totalLiabilitiesByYear.map((l: number, i: number) => l + totalEquityByYear[i])],
  );
  await addSheet("Balance Sheet", bsRows);

  const cumRevenue = yearlyData.map((_: any, i: number) => {
    let cum = 0;
    for (let j = 0; j <= i; j++) cum += yearlyData[j].totalRevenue;
    return cum;
  });
  const cumNetIncome = yearlyData.map((_: any, i: number) => {
    let cum = 0;
    for (let j = 0; j <= i; j++) cum += yearlyData[j].netIncome;
    return cum;
  });
  const cumCashFlow = yearlyData.map((_: any, i: number) => {
    let cum = 0;
    for (let j = 0; j <= i; j++) cum += yearlyData[j].cashFlow;
    return cum;
  });

  const iaRows: (string | number)[][] = [
    ["Investment Analysis", ...yearLabels],
    [],
    ["COMPANY METRICS"],
    ["  Total Revenue", ...yearlyData.map(y => y.totalRevenue)],
    ["  Total Expenses", ...yearlyData.map(y => y.totalExpenses)],
    ["  Net Income", ...yearlyData.map(y => y.netIncome)],
    ["  Net Income Margin (%)", ...yearlyData.map(y => y.totalRevenue > 0 ? (y.netIncome / y.totalRevenue) * 100 : 0)],
    [],
    ["CASH POSITION"],
    ["  Annual Cash Flow", ...yearlyData.map(y => y.cashFlow)],
    ["  Closing Cash Balance", ...closingCash],
    ["  Funding Received", ...yearlyData.map(y => y.safeFunding)],
    [],
    ["CUMULATIVE METRICS"],
    ["  Cumulative Revenue", ...cumRevenue],
    ["  Cumulative Net Income", ...cumNetIncome],
    ["  Cumulative Cash Flow", ...cumCashFlow],
  ];
  await addSheet("Investment Analysis", iaRows);

  const safeName = companyName.replace(/[^a-zA-Z0-9 &\-]/g, "").substring(0, 60);
  (XLSX as any).writeFile(wb, `${safeName} - Management Company Financial Statements.xlsx`);
}

export const exportChartPNG = async (
  chartRef: React.RefObject<HTMLDivElement | null>,
  orientation: 'landscape' | 'portrait' = 'landscape',
  companyName?: string
) => {
  if (!chartRef.current) return;

  try {
    const scale = 2;
    const width = orientation === 'landscape' ? 1200 : 800;
    const height = orientation === 'landscape' ? 600 : 1000;

    const dataUrl = await domtoimage.toPng(chartRef.current, {
      bgcolor: '#ffffff',
      quality: 1,
      width: width,
      height: height,
      style: {
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }
    });

    const name = companyName || "Management Company";
    const link = document.createElement('a');
    link.download = `${name} - Performance Chart.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Error exporting chart:', error);
  }
};

export const exportTablePNG = async (
  tableRef: React.RefObject<HTMLDivElement | null>,
  activeTab: string,
  companyName?: string
) => {
  if (!tableRef.current) return;
  const hiddenRows: HTMLElement[] = [];
  try {
    const expandableRows = tableRef.current.querySelectorAll<HTMLElement>('[data-expandable-row="true"]');
    expandableRows.forEach(row => {
      if (row.style.display !== 'none') {
        hiddenRows.push(row);
        row.style.display = 'none';
      }
    });

    const scale = 2;
    const dataUrl = await domtoimage.toPng(tableRef.current, {
      bgcolor: '#ffffff',
      quality: 1,
      style: { transform: `scale(${scale})`, transformOrigin: 'top left' },
      width: tableRef.current.scrollWidth * scale,
      height: tableRef.current.scrollHeight * scale,
    });
    const name = companyName || "Management Company";
    const tabLabel = activeTab === 'income' ? 'Income Statement' : activeTab === 'cashflow' ? 'Cash Flow' : 'Balance Sheet';
    const link = document.createElement('a');
    link.download = `${name} - ${tabLabel}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Error exporting table:', error);
  } finally {
    hiddenRows.forEach(row => {
      row.style.display = '';
    });
  }
};

export const handlePPTXExport = (
  global: any,
  projectionYears: number,
  getFiscalYear: (i: number) => string,
  incomeData: any,
  cashFlowData: any,
  balanceData: any
) => {
  if (!global) return;
  exportCompanyPPTX({
    projectionYears,
    getFiscalYear,
    incomeData: { years: incomeData.years.map(String), rows: incomeData.rows },
    cashFlowData: { years: cashFlowData.years.map(String), rows: cashFlowData.rows },
    balanceSheetData: { years: balanceData.years.map(String), rows: balanceData.rows },
  });
};
