/**
 * Investment Analysis Aggregator — single source of truth.
 */
import type { StatementData, ChartSeries } from "./types";
import { headerRow, childRow, grandchildRow, separatorRow } from "./helpers";
import { propertyEquityInvested } from "@/lib/financial/equityCalculations";

export function aggregatePortfolioInvestment(
  financials: { totalInitialEquity: number; totalExitValue: number; portfolioIRR: number; equityMultiple: number; cashOnCash: number; yearlyConsolidatedCache: any[]; allPropertyYearlyCF: any[][]; weightedMetricsByYear: any[] },
  properties: Array<{ name: string; roomCount: number; [k: string]: any }>,
  projectionYears: number,
  getFiscalYear: (i: number) => number,
): StatementData {
  const years = Array.from({ length: projectionYears }, (_, i) => getFiscalYear(i));
  const yc = financials.yearlyConsolidatedCache;
  const cf = financials.allPropertyYearlyCF;
  const totalRooms = properties.reduce((sum, p) => sum + p.roomCount, 0);
  const wm = financials.weightedMetricsByYear;
  const rows = [];

  // Investment Summary (always visible)
  rows.push(headerRow("Investment Summary", years.map(() => 0)));
  rows.push(childRow("Total Initial Equity", years.map(() => financials.totalInitialEquity), { isChevronChild: false }));
  rows.push(childRow("Total Exit Value", years.map(() => financials.totalExitValue), { isChevronChild: false }));
  rows.push(childRow("Portfolio IRR (%)", years.map(() => financials.portfolioIRR), { isChevronChild: false, format: "percentage" }));
  rows.push(childRow("Equity Multiple", years.map(() => financials.equityMultiple), { isChevronChild: false, format: "multiplier" }));
  rows.push(childRow("Cash-on-Cash Return (%)", years.map(() => financials.cashOnCash / 100), { isChevronChild: false, format: "percentage" }));
  rows.push(childRow("Total Properties", years.map(() => properties.length), { isChevronChild: false, format: "number" }));
  rows.push(childRow("Total Rooms", years.map(() => totalRooms), { isChevronChild: false, format: "number" }));

  // Computed values
  const rev = years.map((_, i) => yc[i]?.revenueTotal ?? 0);
  const gop = years.map((_, i) => yc[i]?.gop ?? 0);
  const noi = years.map((_, i) => yc[i]?.noi ?? 0);
  const anoi = years.map((_, i) => yc[i]?.anoi ?? 0);
  const netInc = years.map((_, i) => yc[i]?.netIncome ?? 0);
  const totExp = years.map((_, i) => yc[i]?.totalExpenses ?? 0);
  const intExp = years.map((_, i) => yc[i]?.interestExpense ?? 0);
  const dep = years.map((_, i) => yc[i]?.depreciationExpense ?? 0);
  const taxProv = years.map((_, i) => yc[i]?.incomeTax ?? 0);
  const fb = years.map((_, i) => yc[i]?.feeBase ?? 0);
  const fi = years.map((_, i) => yc[i]?.feeIncentive ?? 0);
  const ffe = years.map((_, i) => yc[i]?.expenseFFE ?? 0);
  const ptax = years.map((_, i) => yc[i]?.expenseTaxes ?? 0);
  const cfo = years.map((_, y) => cf.reduce((s, p) => s + (p[y]?.cashFromOperations ?? 0), 0));
  const fcf = years.map((_, y) => cf.reduce((s, p) => s + (p[y]?.freeCashFlow ?? 0), 0));
  const fcfe = years.map((_, y) => cf.reduce((s, p) => s + (p[y]?.freeCashFlowToEquity ?? 0), 0));
  const ds = years.map((_, y) => cf.reduce((s, p) => s + (p[y]?.debtService ?? 0), 0));
  const prin = years.map((_, y) => cf.reduce((s, p) => s + (p[y]?.principalPayment ?? 0), 0));
  const cumFcfe = years.map((_, y) => { let c = 0; for (let i = 0; i <= y; i++) c += cf.reduce((s, p) => s + (p[i]?.freeCashFlowToEquity ?? 0), 0); return c; });
  const dscr = years.map((_, y) => { const d = ds[y]; return d > 0 ? noi[y] / d : 0; });
  const cr = years.map((_, i) => financials.totalExitValue > 0 ? noi[i] / financials.totalExitValue : 0);
  const oer = years.map((_, i) => rev[i] > 0 ? totExp[i] / rev[i] : 0);
  const atcf = years.map((_, y) => cf.reduce((s, p) => s + (p[y]?.atcf ?? 0), 0));
  const btcf = years.map((_, y) => cf.reduce((s, p) => s + (p[y]?.btcf ?? 0), 0));
  const refiP = years.map((_, y) => cf.reduce((s, p) => s + (p[y]?.refinancingProceeds ?? 0), 0));
  const exitP = years.map((_, y) => cf.reduce((s, p) => s + (p[y]?.exitValue ?? 0), 0));
  const taxL = years.map((_, y) => cf.reduce((s, p) => s + (p[y]?.taxLiability ?? 0), 0));
  const taxI = years.map((_, y) => cf.reduce((s, p) => s + (p[y]?.taxableIncome ?? 0), 0));
  const invCF = years.map((_, y) => cf.reduce((s, p) => s + (p[y]?.netCashFlowToInvestors ?? 0), 0));

  // Detail sections (chevron children — hidden in short mode)
  rows.push(separatorRow(projectionYears));
  rows.push(headerRow("Revenue & Profitability", years.map(() => 0), { isChevronChild: true }));
  rows.push(childRow("Total Revenue", rev)); rows.push(childRow("Total Operating Expenses", totExp));
  rows.push(childRow("Gross Operating Profit (GOP)", gop));
  rows.push(childRow("GOP Margin (%)", years.map((_, i) => rev[i] > 0 ? gop[i] / rev[i] : 0), { format: "percentage" }));
  rows.push(childRow("Property Taxes", ptax)); rows.push(childRow("Net Operating Income (NOI)", noi));
  rows.push(childRow("NOI Margin (%)", years.map((_, i) => rev[i] > 0 ? noi[i] / rev[i] : 0), { format: "percentage" }));
  rows.push(childRow("Management Fees (Base)", fb)); rows.push(childRow("Management Fees (Incentive)", fi));
  rows.push(childRow("FF&E Reserve", ffe)); rows.push(childRow("Adjusted NOI (ANOI)", anoi));

  rows.push(separatorRow(projectionYears));
  rows.push(headerRow("Cash Flow Analysis", years.map(() => 0), { isChevronChild: true }));
  rows.push(childRow("Cash from Operations (CFO)", cfo)); rows.push(childRow("Free Cash Flow (FCF)", fcf));
  rows.push(childRow("Total Debt Service", ds));
  rows.push(grandchildRow("Principal Payments", prin)); rows.push(grandchildRow("Interest Expense", intExp));
  rows.push(childRow("Free Cash Flow to Equity (FCFE)", fcfe)); rows.push(childRow("Cumulative FCFE", cumFcfe));

  rows.push(separatorRow(projectionYears));
  rows.push(headerRow("Below-the-Line Items", years.map(() => 0), { isChevronChild: true }));
  rows.push(childRow("Interest Expense", intExp)); rows.push(childRow("Depreciation & Amortization", dep));
  rows.push(childRow("Income Tax Provision", taxProv)); rows.push(childRow("GAAP Net Income", netInc));

  rows.push(separatorRow(projectionYears));
  rows.push(headerRow("Key Ratios & Returns", years.map(() => 0), { isChevronChild: true }));
  rows.push(childRow("DSCR", dscr, { format: "ratio" })); rows.push(childRow("Cap Rate (%)", cr, { format: "percentage" }));
  rows.push(childRow("Operating Expense Ratio (%)", oer, { format: "percentage" }));
  rows.push(childRow("NOI per Room", years.map((_, i) => totalRooms > 0 ? noi[i] / totalRooms : 0)));
  rows.push(childRow("Revenue per Room", years.map((_, i) => totalRooms > 0 ? rev[i] / totalRooms : 0)));

  rows.push(separatorRow(projectionYears));
  rows.push(headerRow("Operating Metrics", years.map(() => 0), { isChevronChild: true }));
  rows.push(childRow("ADR (Weighted Avg)", years.map((_, i) => wm[i]?.weightedADR ?? 0)));
  rows.push(childRow("Occupancy (%)", years.map((_, i) => wm[i]?.weightedOcc ?? 0), { format: "percentage" }));
  rows.push(childRow("RevPAR", years.map((_, i) => wm[i]?.revPAR ?? 0)));
  rows.push(childRow("Available Room Nights", years.map((_, i) => wm[i]?.totalAvailableRoomNights ?? 0), { format: "number" }));
  rows.push(childRow("Sold Room Nights", years.map((_, i) => yc[i]?.soldRooms ?? 0), { format: "number" }));

  rows.push(separatorRow(projectionYears));
  rows.push(headerRow("Free Cash Flow to Investors", years.map(() => 0), { isChevronChild: true }));
  rows.push(childRow("After-Tax Cash Flow (ATCF)", atcf)); rows.push(childRow("Refinancing Proceeds", refiP));
  rows.push(childRow("Exit Proceeds", exitP)); rows.push(childRow("Net Cash Flow to Investors", invCF, { isBold: true }));

  rows.push(separatorRow(projectionYears));
  rows.push(headerRow("Operating Cash Flow Waterfall", years.map(() => 0), { isChevronChild: true }));
  rows.push(childRow("Adjusted NOI (ANOI)", anoi)); rows.push(childRow("Less: Debt Service", ds.map(v => -v)));
  rows.push(childRow("Before-Tax Cash Flow (BTCF)", btcf, { isBold: true }));
  rows.push(grandchildRow("Taxable Income", taxI)); rows.push(grandchildRow("Less: Income Tax", taxL.map(v => -v)));
  rows.push(childRow("After-Tax Cash Flow (ATCF)", atcf, { isBold: true }));

  if (properties.length > 0 && cf.length > 0) {
    rows.push(separatorRow(projectionYears));
    rows.push(headerRow("Per-Property Returns", years.map(() => 0), { isChevronChild: true }));
    properties.forEach((prop, pi) => {
      const pCF = cf[pi] || [];
      const eq = propertyEquityInvested(prop);
      const ev = pCF[projectionYears - 1]?.exitValue ?? 0;
      const pATCF = years.map((_, y) => pCF[y]?.atcf ?? 0);
      const avg = pATCF.reduce((s, v) => s + v, 0) / projectionYears;
      const coc = eq > 0 ? (avg / eq) * 100 : 0;
      rows.push(childRow(prop.name || `Property ${pi + 1}`, years.map(() => 0), { isHeader: true }));
      rows.push(grandchildRow("Equity Invested", years.map(() => eq)));
      rows.push(grandchildRow("Annual ATCF", pATCF));
      rows.push(grandchildRow("Exit Value", years.map((_, y) => y === projectionYears - 1 ? ev : 0)));
      rows.push(grandchildRow("Cash-on-Cash (%)", years.map(() => coc / 100), { format: "percentage" }));
    });
  }

  const chartSeries: ChartSeries[] = [
    { label: "NOI", values: noi, color: "#10B981" },
    { label: "ANOI", values: anoi, color: "#257D41" },
    { label: "FCFE", values: fcfe, color: "#8B5CF6" },
  ];

  return { title: "Investment Analysis", years, rows, chartSeries };
}
