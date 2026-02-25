import { formatMoney } from "@/lib/financialEngine";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { drawLineChart } from "@/lib/pdfChartDrawer";
import * as XLSX from "xlsx";
import { exportPortfolioPPTX as originalExportPortfolioPPTX } from "@/lib/exports/pptxExport";
import { exportTablePNG } from "@/lib/exports/pngExport";

export const dashboardExports = {
  exportToPDF: ({ 
    propertyName, 
    projectionYears, 
    years, 
    rows, 
    getYearlyConsolidated 
  }: { 
    propertyName: string, 
    projectionYears: number, 
    years: number[], 
    rows: any[], 
    getYearlyConsolidated: (i: number) => any 
  }) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    doc.setFontSize(18);
    doc.text(`${propertyName} - Portfolio Income Statement`, 14, 15);
    doc.setFontSize(10);
    doc.text(`${projectionYears}-Year Projection (${years[0]} - ${years[projectionYears - 1]})`, 14, 22);
    doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy')}`, 14, 27);
    
    const tableData = rows.map(row => [
      (row.indent ? '  '.repeat(row.indent) : '') + row.category,
      ...row.values.map((v: number) => formatMoney(v))
    ]);
    
    autoTable(doc, {
      head: [['Category', ...years.map(String)]],
      body: tableData,
      startY: 32,
      styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
      headStyles: { fillColor: [159, 188, 164], textColor: [0, 0, 0], fontStyle: 'bold', font: 'helvetica' },
      columnStyles: { 0: { cellWidth: 45, font: 'helvetica' } },
      didParseCell: (data) => {
        if (data.column.index > 0) {
          data.cell.styles.font = 'courier';
        }
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
    doc.setFontSize(16);
    doc.text("Performance Chart", 14, 15);
    doc.setFontSize(10);
    doc.text(`${projectionYears}-Year Revenue, Operating Expenses, and Net Operating Income Trend`, 14, 22);
    
    const chartData = years.map((year, i) => {
      const yearly = getYearlyConsolidated(i);
      return { label: String(year), value: yearly.revenueTotal };
    });
    
    const noiData = years.map((year, i) => {
      const yearly = getYearlyConsolidated(i);
      return { label: String(year), value: yearly.noi };
    });
    
    const expenseData = years.map((year, i) => {
      const yearly = getYearlyConsolidated(i);
      return { label: String(year), value: yearly.totalExpenses };
    });
    
    drawLineChart({
      doc,
      x: 14,
      y: 30,
      width: 269,
      height: 150,
      title: `Portfolio Performance (${projectionYears}-Year Projection)`,
      series: [
        { name: "Revenue", data: chartData, color: "#7C3AED" },
        { name: "Operating Expenses", data: expenseData, color: "#2563EB" },
        { name: "NOI", data: noiData, color: "#257D41" }
      ]
    });
    
    doc.save('portfolio-income-statement.pdf');
  },

  exportToCSV: (years: number[], rows: any[]) => {
    const headers = ['Category', ...years.map(String)];
    const csvContent = [
      headers.join(','),
      ...rows.map(row => [
        `"${row.category}"`,
        ...row.values.map((v: number) => v.toString())
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'portfolio-income-statement.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportToExcel: (years: number[], rows: any[]) => {
    const wsData = [
      ['Category', ...years.map(String)],
      ...rows.map(row => [row.category, ...row.values])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Income Statement");
    XLSX.writeFile(wb, "portfolio-income-statement.xlsx");
  },

  exportToPPTX: (data: any) => {
    originalExportPortfolioPPTX(data);
  },

  exportToPNG: (ref: React.RefObject<HTMLElement>) => {
    if (ref.current) {
      exportTablePNG({ element: ref.current, filename: 'portfolio-income-statement.png' });
    }
  }
};
