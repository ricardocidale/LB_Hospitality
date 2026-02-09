import pptxgen from "pptxgenjs";
import { format } from "date-fns";

const SAGE = "9FBCA4";
const DARK_GREEN = "257D41";
const DARK_TEXT = "3D3D3D";
const LIGHT_BG = "FFF9F5";
const WHITE = "FFFFFF";
const GRAY = "666666";

interface SlideTableRow {
  category: string;
  values: (string | number)[];
  indent?: number;
  isBold?: boolean;
}

function addTitleSlide(pres: pptxgen, title: string, subtitle: string) {
  const slide = pres.addSlide();
  slide.background = { color: "1a2a3a" };
  slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.05, fill: { color: SAGE } });
  slide.addText("Hospitality Business Group", {
    x: 0.5, y: 1.5, w: 9, h: 0.6,
    fontSize: 28, fontFace: "Arial", color: SAGE, bold: true,
  });
  slide.addText(title, {
    x: 0.5, y: 2.2, w: 9, h: 0.5,
    fontSize: 22, fontFace: "Arial", color: WHITE,
  });
  slide.addText(subtitle, {
    x: 0.5, y: 2.8, w: 9, h: 0.4,
    fontSize: 14, fontFace: "Arial", color: "AAAAAA",
  });
  slide.addText(`Generated: ${format(new Date(), "MMMM d, yyyy")}`, {
    x: 0.5, y: 4.5, w: 9, h: 0.3,
    fontSize: 10, fontFace: "Arial", color: "888888",
  });
}

function addMetricsSlide(pres: pptxgen, title: string, metrics: { label: string; value: string }[]) {
  const slide = pres.addSlide();
  slide.addText(title, {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontSize: 20, fontFace: "Arial", color: DARK_GREEN, bold: true,
  });
  slide.addShape(pres.ShapeType.rect, { x: 0.5, y: 0.85, w: 9, h: 0.02, fill: { color: SAGE } });

  const cols = 3;
  const cardW = 2.8;
  const cardH = 1.1;
  const gapX = 0.3;
  const startX = 0.5;
  const startY = 1.1;

  metrics.forEach((m, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + 0.15);

    slide.addShape(pres.ShapeType.rect, {
      x, y, w: cardW, h: cardH,
      fill: { color: "F5F9F6" },
      line: { color: SAGE, width: 1 },
      rectRadius: 0.1,
    });
    slide.addText(m.value, {
      x: x + 0.15, y: y + 0.15, w: cardW - 0.3, h: 0.5,
      fontSize: 18, fontFace: "Arial", color: DARK_GREEN, bold: true,
    });
    slide.addText(m.label, {
      x: x + 0.15, y: y + 0.6, w: cardW - 0.3, h: 0.35,
      fontSize: 9, fontFace: "Arial", color: GRAY,
    });
  });
}

function formatVal(v: string | number): string {
  if (typeof v === "number") {
    if (Math.abs(v) >= 1000) {
      return v < 0
        ? `(${Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: 0 })})`
        : v.toLocaleString("en-US", { maximumFractionDigits: 0 });
    }
    return v.toLocaleString("en-US", { maximumFractionDigits: 1 });
  }
  return String(v);
}

function addFinancialTableSlide(
  pres: pptxgen,
  title: string,
  years: string[],
  rows: SlideTableRow[],
  maxYearsPerSlide = 5
) {
  for (let startCol = 0; startCol < years.length; startCol += maxYearsPerSlide) {
    const endCol = Math.min(startCol + maxYearsPerSlide, years.length);
    const sliceYears = years.slice(startCol, endCol);
    const suffix = years.length > maxYearsPerSlide
      ? ` (${sliceYears[0]}–${sliceYears[sliceYears.length - 1]})`
      : "";

    const slide = pres.addSlide();
    slide.addText(title + suffix, {
      x: 0.3, y: 0.2, w: 9.4, h: 0.4,
      fontSize: 16, fontFace: "Arial", color: DARK_GREEN, bold: true,
    });

    const colW = 1.4;
    const labelW = 10 - sliceYears.length * colW - 0.3;
    const headerRow: pptxgen.TableCell[] = [
      { text: "", options: { fill: { color: SAGE }, fontFace: "Arial", fontSize: 8, color: WHITE, bold: true } },
      ...sliceYears.map((y) => ({
        text: y,
        options: { fill: { color: SAGE }, fontFace: "Arial", fontSize: 8, color: WHITE, bold: true, align: "right" as const },
      })),
    ];

    const tableRows: pptxgen.TableRow[] = [headerRow];
    const filteredRows = rows.filter((r) => r.category !== "");

    filteredRows.forEach((row) => {
      const isSectionHeader = row.category === row.category.toUpperCase() && row.category.length > 2 && !row.category.startsWith(" ");
      const isTotal = row.isBold || row.category.toLowerCase().startsWith("total") ||
        row.category.toLowerCase().includes("net operating") ||
        row.category.toLowerCase().includes("gross operating") ||
        row.category.toLowerCase().includes("gaap net") ||
        row.category.toLowerCase().includes("free cash flow") ||
        row.category.toLowerCase().includes("closing cash");

      const label = (row.indent ? "  ".repeat(row.indent) : "") + row.category;
      const bgColor = isSectionHeader ? "EFF5F0" : WHITE;

      const cells: pptxgen.TableCell[] = [
        {
          text: label,
          options: {
            fontFace: "Arial", fontSize: 7, color: DARK_TEXT,
            bold: isSectionHeader || isTotal,
            fill: { color: bgColor },
          },
        },
        ...row.values.slice(startCol, endCol).map((v) => ({
          text: formatVal(v),
          options: {
            fontFace: "Arial", fontSize: 7, color: DARK_TEXT,
            bold: isTotal,
            align: "right" as const,
            fill: { color: bgColor },
          },
        })),
      ];
      tableRows.push(cells);
    });

    slide.addTable(tableRows, {
      x: 0.3,
      y: 0.7,
      w: 9.4,
      colW: [labelW, ...sliceYears.map(() => colW)],
      border: { type: "solid", pt: 0.5, color: "DDDDDD" },
      rowH: 0.22,
      autoPage: true,
      autoPageRepeatHeader: true,
    });
  }
}

export interface PortfolioExportData {
  projectionYears: number;
  getFiscalYear: (i: number) => number;
  totalInitialEquity: number;
  totalExitValue: number;
  equityMultiple: number;
  portfolioIRR: number;
  cashOnCash: number;
  totalProperties: number;
  totalRooms: number;
  totalProjectionRevenue: number;
  totalProjectionNOI: number;
  totalProjectionCashFlow: number;
  incomeData: { years: string[]; rows: SlideTableRow[] };
  cashFlowData: { years: string[]; rows: SlideTableRow[] };
  balanceSheetData: { years: string[]; rows: SlideTableRow[] };
  investmentData: { years: string[]; rows: SlideTableRow[] };
}

export function exportPortfolioPPTX(data: PortfolioExportData) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.author = "Hospitality Business Group";
  pres.title = "Portfolio Investment Report";

  addTitleSlide(pres, "Portfolio Investment Report", `${data.projectionYears}-Year Projection (${data.getFiscalYear(0)} – ${data.getFiscalYear(data.projectionYears - 1)})`);

  addMetricsSlide(pres, "Investment Summary", [
    { label: "Total Equity Invested", value: `$${(data.totalInitialEquity / 1000000).toFixed(1)}M` },
    { label: `Exit Value (Year ${data.projectionYears})`, value: `$${(data.totalExitValue / 1000000).toFixed(1)}M` },
    { label: "Equity Multiple", value: `${data.equityMultiple.toFixed(2)}x` },
    { label: "Portfolio IRR", value: `${(data.portfolioIRR * 100).toFixed(1)}%` },
    { label: "Avg Cash-on-Cash", value: `${data.cashOnCash.toFixed(1)}%` },
    { label: "Properties / Rooms", value: `${data.totalProperties} / ${data.totalRooms}` },
    { label: `${data.projectionYears}-Year Revenue`, value: `$${(data.totalProjectionRevenue / 1000000).toFixed(1)}M` },
    { label: `${data.projectionYears}-Year NOI`, value: `$${(data.totalProjectionNOI / 1000000).toFixed(1)}M` },
    { label: `${data.projectionYears}-Year Cash Flow`, value: `$${(data.totalProjectionCashFlow / 1000000).toFixed(1)}M` },
  ]);

  addFinancialTableSlide(pres, "Consolidated Income Statement", data.incomeData.years, data.incomeData.rows);
  addFinancialTableSlide(pres, "Consolidated Cash Flow Statement", data.cashFlowData.years, data.cashFlowData.rows);
  addFinancialTableSlide(pres, "Consolidated Balance Sheet", data.balanceSheetData.years, data.balanceSheetData.rows);
  addFinancialTableSlide(pres, "Investment Analysis", data.investmentData.years, data.investmentData.rows);

  pres.writeFile({ fileName: "LB-Hospitality-Portfolio-Report.pptx" });
}

export interface PropertyExportData {
  propertyName: string;
  projectionYears: number;
  getFiscalYear: (i: number) => string;
  incomeData: { years: string[]; rows: SlideTableRow[] };
  cashFlowData: { years: string[]; rows: SlideTableRow[] };
  balanceSheetData: { years: string[]; rows: SlideTableRow[] };
}

export function exportPropertyPPTX(data: PropertyExportData) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.author = "Hospitality Business Group";
  pres.title = `${data.propertyName} Financial Report`;

  addTitleSlide(pres, data.propertyName, `${data.projectionYears}-Year Financial Projection`);
  addFinancialTableSlide(pres, `${data.propertyName} – Income Statement`, data.incomeData.years, data.incomeData.rows);
  addFinancialTableSlide(pres, `${data.propertyName} – Cash Flow Statement`, data.cashFlowData.years, data.cashFlowData.rows);
  addFinancialTableSlide(pres, `${data.propertyName} – Balance Sheet`, data.balanceSheetData.years, data.balanceSheetData.rows);

  const safeName = data.propertyName.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 30);
  pres.writeFile({ fileName: `${safeName} - Financial Report.pptx` });
}

export interface CompanyExportData {
  projectionYears: number;
  getFiscalYear: (i: number) => string;
  incomeData: { years: string[]; rows: SlideTableRow[] };
  cashFlowData: { years: string[]; rows: SlideTableRow[] };
  balanceSheetData: { years: string[]; rows: SlideTableRow[] };
}

export function exportCompanyPPTX(data: CompanyExportData) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.author = "Hospitality Business Group";
  pres.title = "Management Company Financial Report";

  addTitleSlide(pres, "Management Company", `${data.projectionYears}-Year Financial Projection`);
  addFinancialTableSlide(pres, "Management Company – Income Statement", data.incomeData.years, data.incomeData.rows);
  addFinancialTableSlide(pres, "Management Company – Cash Flow Statement", data.cashFlowData.years, data.cashFlowData.rows);
  addFinancialTableSlide(pres, "Management Company – Balance Sheet", data.balanceSheetData.years, data.balanceSheetData.rows);

  pres.writeFile({ fileName: "LB-Management-Company-Report.pptx" });
}
