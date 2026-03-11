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

export const handleExcelExport = (
  activeTab: string,
  financials: any[],
  projectionYears: number,
  global: any,
  fiscalYearStartMonth: number
) => {
  if (!global) return;
  if (activeTab === 'cashflow') {
    exportCompanyCashFlow(financials, projectionYears, global.modelStartDate, fiscalYearStartMonth);
  } else if (activeTab === 'balance') {
    exportCompanyBalanceSheet(
      financials,
      global.safeTranche1Amount || 0,
      global.safeTranche2Amount || 0,
      global.modelStartDate,
      fiscalYearStartMonth,
      projectionYears
    );
  } else {
    exportCompanyIncomeStatement(financials, projectionYears, global.modelStartDate, fiscalYearStartMonth);
  }
};

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
