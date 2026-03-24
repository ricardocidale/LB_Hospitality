import React from "react";
import { Document, Page, View, Text, Image, renderToBuffer, Svg, Line, Circle, Path, G, type DocumentProps } from "@react-pdf/renderer";
import { type PdfTheme } from "./theme";
import type { ReportDefinition, ReportSection, TableRow as IRTableRow, DesignTokens, ImageSection } from "../report/types";
import { compileReport, type CompileInput } from "../report/compiler";
import { logger } from "../logger";
import { applyDesignPass, DEFAULT_HINTS, type LayoutHints } from "./design-pass";

const MM_TO_PT = 2.83465;
const PAGE_LANDSCAPE: [number, number] = [406.4 * MM_TO_PT, 228.6 * MM_TO_PT];
const PAGE_PORTRAIT: [number, number] = [215.9 * MM_TO_PT, 279.4 * MM_TO_PT];

function tokensToTheme(t: DesignTokens): PdfTheme {
  return {
    primary: t.primary,
    secondary: t.secondary,
    accent: t.accent,
    foreground: t.foreground,
    border: t.border,
    muted: t.muted,
    surface: t.surface,
    background: t.background,
    white: t.white,
    negativeRed: t.negativeRed,
    chart: t.chart,
    line: t.line,
  };
}

function fmtCompact(v: number): string {
  if (v === 0) return "$0";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000).toLocaleString()}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function monotoneCubicPath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length < 2) return "";
  if (pts.length === 2) return `M${pts[0].x},${pts[0].y}L${pts[1].x},${pts[1].y}`;
  const n = pts.length;
  const dx: number[] = [];
  const dy: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1].x - pts[i].x);
    dy.push(pts[i + 1].y - pts[i].y);
    m.push(dy[i] / dx[i]);
  }
  const alpha: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) alpha.push(0);
    else alpha.push(3 * (dx[i - 1] + dx[i]) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]));
  }
  alpha.push(m[n - 2]);
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const t = dx[i] / 3;
    d += `C${(pts[i].x + t).toFixed(1)},${(pts[i].y + alpha[i] * t).toFixed(1)} ${(pts[i + 1].x - t).toFixed(1)},${(pts[i + 1].y - alpha[i + 1] * t).toFixed(1)} ${pts[i + 1].x.toFixed(1)},${pts[i + 1].y.toFixed(1)}`;
  }
  return d;
}

function PageHeader({ title, companyName, entityName, theme }: { title: string; companyName: string; entityName: string; theme: PdfTheme }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ backgroundColor: theme.primary, padding: "12 20 10 20", borderBottomLeftRadius: 6, borderBottomRightRadius: 6, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: theme.white, fontFamily: "Helvetica-Bold" }}>{title}</Text>
          <Text style={{ fontSize: 7.5, color: theme.muted, marginTop: 2 }}>{companyName} — {entityName}</Text>
        </View>
        <Text style={{ fontSize: 7, color: theme.secondary, fontWeight: "bold", fontFamily: "Helvetica-Bold" }}>{companyName}</Text>
      </View>
    </View>
  );
}

function PageFooter({ companyName, theme }: { companyName: string; theme: PdfTheme }) {
  return (
    <View style={{ position: "absolute", bottom: 12, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between" }} fixed>
      <Text style={{ fontSize: 6, color: theme.border }}>{companyName}</Text>
      <Text style={{ fontSize: 6, color: theme.border }}>CONFIDENTIAL</Text>
      <Text style={{ fontSize: 6, color: theme.border }} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function SectionDivider({ title, theme }: { title: string; theme: PdfTheme }) {
  return (
    <View style={{ backgroundColor: theme.primary, padding: "6 12 5 12", borderRadius: 4, marginBottom: 10, marginTop: 4 }}>
      <Text style={{ fontSize: 11, fontWeight: "bold", fontFamily: "Helvetica-Bold", color: theme.white }}>{title}</Text>
    </View>
  );
}

const DENSITY_PADDING: Record<string, string> = {
  cramped: "3 6",
  comfortable: "6 10",
  spacious: "8 12",
};

interface TableRenderProps {
  years: string[];
  rows: IRTableRow[];
  theme: PdfTheme;
  isLandscape: boolean;
  hints: LayoutHints;
}

function TableBody({ years, rows, theme, isLandscape, hints }: TableRenderProps) {
  const colWidth = isLandscape
    ? (PAGE_LANDSCAPE[0] - 120 - 140) / Math.max(years.length, 1)
    : (PAGE_PORTRAIT[0] - 100 - 110) / Math.max(years.length, 1);
  const labelWidth = isLandscape ? 140 : 110;
  const dataFontSize = Math.round(11 * hints.globalFontSizeScale);
  const headerFontSize = Math.round(12 * hints.globalFontSizeScale);
  const cellPadding = DENSITY_PADDING[hints.tableDensity] || "6 10";

  return (
    <View style={{ borderWidth: 0.25, borderColor: theme.foreground, borderRadius: 4, overflow: "hidden" }}>
      <View style={{ flexDirection: "row", backgroundColor: theme.surface, borderBottomWidth: 0.75, borderBottomColor: theme.foreground }}>
        <View style={{ width: labelWidth, padding: "6 8" }}>
          <Text style={{ fontSize: headerFontSize, fontWeight: "bold", fontFamily: "Helvetica-Bold", color: theme.primary }}> </Text>
        </View>
        {years.map((yr, i) => (
          <View key={i} style={{ width: colWidth, padding: "6 4", alignItems: "flex-end" }}>
            <Text style={{ fontSize: headerFontSize, fontWeight: "bold", fontFamily: "Helvetica-Bold", color: theme.primary }}>FY {yr}</Text>
          </View>
        ))}
      </View>

      {rows.map((row, idx) => {
        const isHeader = row.type === "header";
        const isTotal = row.type === "total" || row.type === "subtotal";
        const category = (row.category || "").trim();

        if (!category && row.values.every((fv) => {
          const r = fv.raw;
          return r === 0 || r === null || r === "";
        })) {
          return <View key={idx} style={{ height: 8 }} />;
        }

        const bgColor = isHeader
          ? theme.surface
          : isTotal
            ? theme.surface
            : idx % 2 === 0
              ? theme.muted
              : theme.white;
        const borderTop = isHeader
          ? { borderTopWidth: 0.5, borderTopColor: theme.foreground }
          : isTotal
            ? { borderTopWidth: 0.5, borderTopColor: theme.foreground }
            : {};

        const rowFontSize = (isHeader || isTotal) ? headerFontSize : dataFontSize;

        const allZero = row.values.every((fv) => {
          const r = fv.raw;
          return r === 0 || r === null || r === "";
        });

        return (
          <View key={idx} style={{ flexDirection: "row", backgroundColor: bgColor, ...borderTop }}>
            <View style={{ width: labelWidth, padding: cellPadding, paddingLeft: 8 + row.indent * 10 }}>
              <Text style={{
                fontSize: rowFontSize,
                fontWeight: isHeader || isTotal ? "bold" : "normal",
                fontFamily: isHeader || isTotal ? "Helvetica-Bold" : "Helvetica",
                color: isHeader || isTotal ? theme.primary : theme.foreground,
              }}>{category}</Text>
            </View>
            {row.values.map((fv, vi) => {
              const displayText = allZero && isHeader ? "" : fv.text;
              return (
                <View key={vi} style={{ width: colWidth, padding: cellPadding, alignItems: "flex-end" }}>
                  <Text style={{
                    fontSize: rowFontSize,
                    fontWeight: isHeader || isTotal ? "bold" : "normal",
                    fontFamily: isHeader || isTotal ? "Helvetica-Bold" : "Courier",
                    color: fv.negative ? theme.negativeRed : theme.foreground,
                  }}>{displayText}</Text>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

function KpiCards({ title, metrics, companyName, entityName, theme, isLandscape, hints }: {
  title: string;
  metrics: Array<{ label: string; value: string; description?: string }>;
  companyName: string;
  entityName: string;
  theme: PdfTheme;
  isLandscape: boolean;
  hints: LayoutHints;
}) {
  const pageSize: [number, number] = isLandscape ? PAGE_LANDSCAPE : PAGE_PORTRAIT;
  const cols = isLandscape ? 3 : 2;

  const rows: Array<typeof metrics> = [];
  for (let i = 0; i < metrics.length; i += cols) {
    rows.push(metrics.slice(i, i + cols));
  }

  return (
    <Page size={pageSize} style={{ paddingTop: 10, paddingHorizontal: isLandscape ? 60 : 50, paddingBottom: 30, backgroundColor: theme.white }}>
      <PageHeader title={title} companyName={companyName} entityName={entityName} theme={theme} />
      <View style={{ flexDirection: "column", gap: 12 }}>
        {rows.map((row, ri) => (
          <View key={ri} style={{ flexDirection: "row", gap: 12 }}>
            {row.map((m, mi) => {
              const isEmphasized = hints.emphasizedKpis.includes(m.label);
              const valueColor = isEmphasized ? theme.accent : theme.primary;
              const borderWidth = isEmphasized ? 4 : 3;
              return (
                <View key={mi} style={{ flex: 1, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 7, overflow: "hidden", flexDirection: "row" }}>
                  <View style={{ width: borderWidth, backgroundColor: theme.accent }} />
                  <View style={{ flex: 1, padding: "16 14 18 14", alignItems: "center" }}>
                    <Text style={{ fontSize: Math.round(28 * hints.globalFontSizeScale), fontWeight: "bold", fontFamily: "Helvetica-Bold", color: valueColor, marginBottom: 5 }}>{m.value}</Text>
                    <Text style={{ fontSize: 8.5, color: theme.foreground, fontWeight: "bold", fontFamily: "Helvetica-Bold", textAlign: "center", marginBottom: 4 }}>{m.label}</Text>
                    {m.description ? <Text style={{ fontSize: 6.5, color: theme.border, textAlign: "center" }}>{m.description}</Text> : null}
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </View>
      <PageFooter companyName={companyName} theme={theme} />
    </Page>
  );
}

function FinancialTable({ title, years, rows, companyName, entityName, theme, isLandscape, hints }: {
  title: string;
  years: string[];
  rows: IRTableRow[];
  companyName: string;
  entityName: string;
  theme: PdfTheme;
  isLandscape: boolean;
  hints: LayoutHints;
}) {
  const pageSize: [number, number] = isLandscape ? PAGE_LANDSCAPE : PAGE_PORTRAIT;

  if (!years.length || !rows.length) {
    return (
      <Page size={pageSize} style={{ paddingTop: 10, paddingHorizontal: isLandscape ? 60 : 50, paddingBottom: 30, backgroundColor: theme.white }}>
        <PageHeader title={title} companyName={companyName} entityName={entityName} theme={theme} />
        <Text style={{ fontSize: 10, color: theme.border, textAlign: "center", paddingTop: 80 }}>No financial data available for this section.</Text>
        <PageFooter companyName={companyName} theme={theme} />
      </Page>
    );
  }

  return (
    <Page size={pageSize} style={{ paddingTop: 10, paddingHorizontal: isLandscape ? 60 : 50, paddingBottom: 30, backgroundColor: theme.white }}>
      <PageHeader title={title} companyName={companyName} entityName={entityName} theme={theme} />
      <TableBody years={years} rows={rows} theme={theme} isLandscape={isLandscape} hints={hints} />
      <PageFooter companyName={companyName} theme={theme} />
    </Page>
  );
}

function ChartSvgBody({ series, years, theme, isLandscape, hints }: {
  series: Array<{ label: string; values: number[]; color: string }>;
  years: string[];
  theme: PdfTheme;
  isLandscape: boolean;
  hints: LayoutHints;
}) {
  const svgW = isLandscape ? 700 : 440;
  const svgH = isLandscape ? 260 : 300;
  const padL = 70, padR = 30, padT = 20, padB = 50;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;
  const baselineY = padT + plotH;

  let globalMax = 1;
  for (const s of series) {
    for (const v of (s.values || [])) {
      if (typeof v === "number" && Math.abs(v) > globalMax) globalMax = Math.abs(v);
    }
  }
  globalMax *= 1.08;
  const gridN = 5;
  const legendItemWidth = isLandscape ? 150 : 110;

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: "100%", maxHeight: isLandscape ? 320 : 380 }}>
        {Array.from({ length: gridN + 1 }).map((_, g) => {
          const y = padT + (plotH / gridN) * g;
          const gVal = globalMax - (globalMax / gridN) * g;
          return (
            <G key={`grid-${g}`}>
              <Line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke={theme.border} strokeWidth={0.7} />
              <Text x={padL - 8} y={y + 3} style={{ fontSize: 8, textAnchor: "end" }} fill={theme.foreground}>{fmtCompact(gVal / 1.08)}</Text>
            </G>
          );
        })}

        <Line x1={padL} y1={padT + plotH} x2={svgW - padR} y2={padT + plotH} stroke={theme.foreground} strokeWidth={1} />
        <Line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke={theme.foreground} strokeWidth={0.5} />

        {years.map((yr, i) => {
          const x = padL + (i / Math.max(years.length - 1, 1)) * plotW;
          const label = yr.length === 4 ? "'" + yr.slice(2) : yr;
          return <Text key={`xl-${i}`} x={x} y={padT + plotH + 16} style={{ fontSize: 8, textAnchor: "middle" }} fill={theme.foreground}>{label}</Text>;
        })}

        {series.map((s, si) => {
          const seriesColorList = hints.seriesColors.length > 0 ? hints.seriesColors : theme.chart;
          const color = s.color || seriesColorList[si % seriesColorList.length];
          const values: number[] = (s.values || []).map((v) => typeof v === "number" ? v : 0);
          if (values.length < 2) return null;
          const pts = values.map((v, i) => ({
            x: padL + (i / Math.max(values.length - 1, 1)) * plotW,
            y: padT + plotH - (v / globalMax) * plotH,
          }));
          const curvePath = monotoneCubicPath(pts);
          const firstPt = pts[0];
          const lastPt = pts[pts.length - 1];
          const fillPath = `${curvePath} L${lastPt.x.toFixed(1)},${baselineY} L${firstPt.x.toFixed(1)},${baselineY} Z`;
          return (
            <G key={`series-${si}`}>
              <Path d={fillPath} fill={color} fillOpacity={hints.chartAreaOpacity} stroke="none" />
              <Path d={curvePath} fill="none" stroke={color} strokeWidth={2} />
              {pts.map((p, pi) => (
                <G key={`dot-${pi}`}>
                  <Circle cx={p.x} cy={p.y} r={2.5} fill={theme.white} stroke={color} strokeWidth={1.5} />
                  <Circle cx={p.x} cy={p.y} r={1.2} fill={color} />
                </G>
              ))}
            </G>
          );
        })}

        {series.map((s, si) => {
          const seriesColorList = hints.seriesColors.length > 0 ? hints.seriesColors : theme.chart;
          const color = s.color || seriesColorList[si % seriesColorList.length];
          const legendX = svgW - padR - (series.length - si) * legendItemWidth;
          const legendY = padT + 10;
          return (
            <G key={`legend-${si}`}>
              <Line x1={legendX} y1={legendY} x2={legendX + 16} y2={legendY} stroke={color} strokeWidth={2} />
              <Circle cx={legendX + 8} cy={legendY} r={2} fill={theme.white} stroke={color} strokeWidth={1.2} />
              <Text x={legendX + 22} y={legendY + 3} style={{ fontSize: 8, fontWeight: 600 }} fill={theme.foreground}>{s.label || ""}</Text>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

function LineChart({ title, series, years, companyName, entityName, theme, isLandscape, hints }: {
  title: string;
  series: Array<{ label: string; values: number[]; color: string }>;
  years: string[];
  companyName: string;
  entityName: string;
  theme: PdfTheme;
  isLandscape: boolean;
  hints: LayoutHints;
}) {
  const pageSize: [number, number] = isLandscape ? PAGE_LANDSCAPE : PAGE_PORTRAIT;
  if (!series.length || !years.length) return null;

  return (
    <Page size={pageSize} style={{ paddingTop: 10, paddingHorizontal: isLandscape ? 60 : 50, paddingBottom: 30, backgroundColor: theme.white }}>
      <PageHeader title={title} companyName={companyName} entityName={entityName} theme={theme} />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ChartSvgBody series={series} years={years} theme={theme} isLandscape={isLandscape} hints={hints} />
      </View>
      <PageFooter companyName={companyName} theme={theme} />
    </Page>
  );
}

const HEADER_HEIGHT_PT = 50;
const FOOTER_HEIGHT_PT = 30;
const PAGE_PADDING_TOP = 10;
const PAGE_PADDING_BOTTOM = 30;
const SECTION_GAP = 16;

function estimateSectionHeight(section: ReportSection, isLandscape: boolean, hints: LayoutHints): number {
  const dividerHeight = 30;
  switch (section.kind) {
    case "kpi": {
      const cols = isLandscape ? 3 : 2;
      const rowCount = Math.ceil(section.metrics.length / cols);
      return dividerHeight + rowCount * 90;
    }
    case "table": {
      const rowHeight = hints.tableDensity === "cramped" ? 18 : hints.tableDensity === "spacious" ? 26 : 22;
      const headerRowHeight = 28;
      return dividerHeight + headerRowHeight + section.rows.length * rowHeight;
    }
    case "chart": {
      const chartHeight = isLandscape ? 340 : 400;
      return dividerHeight + chartHeight;
    }
    case "image": {
      const ar = (section as ImageSection).aspectRatio ?? (16 / 9);
      const imgW = isLandscape ? 900 : 500;
      return dividerHeight + imgW / ar + 10;
    }
    default:
      return 200;
  }
}

function splitOversizedSections(sections: ReportSection[], isLandscape: boolean, hints: LayoutHints): ReportSection[] {
  const pageHeight = isLandscape ? PAGE_LANDSCAPE[1] : PAGE_PORTRAIT[1];
  const usable = pageHeight - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM - HEADER_HEIGHT_PT - FOOTER_HEIGHT_PT;
  const result: ReportSection[] = [];

  for (const section of sections) {
    if (section.kind !== "table") {
      result.push(section);
      continue;
    }

    const sectionH = estimateSectionHeight(section, isLandscape, hints);
    if (sectionH <= usable) {
      result.push(section);
      continue;
    }

    const rowHeight = hints.tableDensity === "cramped" ? 18 : hints.tableDensity === "spacious" ? 26 : 22;
    const dividerHeight = 30;
    const headerRowHeight = 28;
    const overhead = dividerHeight + headerRowHeight;
    const maxRowsPerChunk = Math.max(1, Math.floor((usable - overhead) / rowHeight));
    const totalRows = section.rows;

    for (let offset = 0; offset < totalRows.length; offset += maxRowsPerChunk) {
      const chunk = totalRows.slice(offset, offset + maxRowsPerChunk);
      const suffix = offset === 0 ? "" : " (cont'd)";
      result.push({
        kind: "table",
        title: section.title + suffix,
        years: section.years,
        rows: chunk,
      });
    }
  }

  return result;
}

function groupSectionsIntoPages(sections: ReportSection[], isLandscape: boolean, hints: LayoutHints): ReportSection[][] {
  const normalized = splitOversizedSections(sections, isLandscape, hints);
  const pageHeight = isLandscape ? PAGE_LANDSCAPE[1] : PAGE_PORTRAIT[1];
  const usable = pageHeight - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM - HEADER_HEIGHT_PT - FOOTER_HEIGHT_PT;

  const pages: ReportSection[][] = [];
  let currentPage: ReportSection[] = [];
  let currentHeight = 0;

  for (const section of normalized) {
    const sectionH = estimateSectionHeight(section, isLandscape, hints);

    if (currentPage.length > 0 && currentHeight + SECTION_GAP + sectionH > usable) {
      pages.push(currentPage);
      currentPage = [section];
      currentHeight = sectionH;
    } else {
      if (currentPage.length > 0) currentHeight += SECTION_GAP;
      currentPage.push(section);
      currentHeight += sectionH;
    }
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}

function renderDenseSectionContent(section: ReportSection, index: number, theme: PdfTheme, isLandscape: boolean, hints: LayoutHints): React.ReactElement | null {
  switch (section.kind) {
    case "kpi": {
      const cols = isLandscape ? 3 : 2;
      const rows: Array<typeof section.metrics> = [];
      for (let i = 0; i < section.metrics.length; i += cols) {
        rows.push(section.metrics.slice(i, i + cols));
      }
      return (
        <View key={`kpi-${index}`} wrap={false} style={{ marginBottom: SECTION_GAP }}>
          <SectionDivider title={section.title} theme={theme} />
          <View style={{ flexDirection: "column", gap: 12 }}>
            {rows.map((row, ri) => (
              <View key={ri} style={{ flexDirection: "row", gap: 12 }}>
                {row.map((m, mi) => {
                  const isEmphasized = hints.emphasizedKpis.includes(m.label);
                  const valueColor = isEmphasized ? theme.accent : theme.primary;
                  const borderWidth = isEmphasized ? 4 : 3;
                  return (
                    <View key={mi} style={{ flex: 1, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 7, overflow: "hidden", flexDirection: "row" }}>
                      <View style={{ width: borderWidth, backgroundColor: theme.accent }} />
                      <View style={{ flex: 1, padding: "16 14 18 14", alignItems: "center" }}>
                        <Text style={{ fontSize: Math.round(28 * hints.globalFontSizeScale), fontWeight: "bold", fontFamily: "Helvetica-Bold", color: valueColor, marginBottom: 5 }}>{m.value}</Text>
                        <Text style={{ fontSize: 8.5, color: theme.foreground, fontWeight: "bold", fontFamily: "Helvetica-Bold", textAlign: "center", marginBottom: 4 }}>{m.label}</Text>
                        {m.description ? <Text style={{ fontSize: 6.5, color: theme.border, textAlign: "center" }}>{m.description}</Text> : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      );
    }
    case "table": {
      if (!section.years.length || !section.rows.length) {
        return (
          <View key={`table-${index}`} style={{ marginBottom: SECTION_GAP }}>
            <SectionDivider title={section.title} theme={theme} />
            <Text style={{ fontSize: 10, color: theme.border, textAlign: "center", paddingTop: 20 }}>No financial data available for this section.</Text>
          </View>
        );
      }
      return (
        <View key={`table-${index}`} wrap={false} style={{ marginBottom: SECTION_GAP }}>
          <SectionDivider title={section.title} theme={theme} />
          <TableBody years={section.years} rows={section.rows} theme={theme} isLandscape={isLandscape} hints={hints} />
        </View>
      );
    }
    case "chart": {
      if (!section.series.length || !section.years.length) return null;
      return (
        <View key={`chart-${index}`} wrap={false} style={{ marginBottom: SECTION_GAP }}>
          <SectionDivider title={section.title} theme={theme} />
          <ChartSvgBody series={section.series} years={section.years} theme={theme} isLandscape={isLandscape} hints={hints} />
        </View>
      );
    }
    case "image": {
      if (!section.dataUrl) return null;
      return (
        <View key={`image-${index}`} wrap={false} style={{ marginBottom: SECTION_GAP }}>
          <SectionDivider title={section.title} theme={theme} />
          <View style={{ alignItems: "center", paddingVertical: 8, paddingHorizontal: 4 }}>
            <Image src={section.dataUrl} style={{ width: "96%", objectFit: "contain" }} />
          </View>
        </View>
      );
    }
    default:
      return null;
  }
}

export async function renderPremiumPdf(input: ReportDefinition | CompileInput): Promise<Buffer> {
  let report: ReportDefinition;
  if ("tokens" in input && "sections" in input && "cover" in input) {
    report = input as ReportDefinition;
  } else {
    report = compileReport(input as CompileInput);
  }

  const hints = await applyDesignPass(report).catch(() => DEFAULT_HINTS);

  const theme = tokensToTheme(report.tokens);
  const { cover, orientation, sections } = report;
  const isLandscape = orientation === "landscape";
  const dense = report.densePagination !== false;

  logger.info(`[react-pdf] Building ${sections.length} sections (landscape=${isLandscape}, density=${hints.tableDensity}, fontScale=${hints.globalFontSizeScale}, dense=${dense})`, "premium-export");

  const pageSize: [number, number] = isLandscape ? PAGE_LANDSCAPE : PAGE_PORTRAIT;
  const pageStyle = { paddingTop: 10, paddingHorizontal: isLandscape ? 60 : 50, paddingBottom: 30, backgroundColor: theme.white };

  const buildDocument = (): React.ReactElement<DocumentProps> => {
    if (dense && sections.length > 0) {
      const pageGroups = groupSectionsIntoPages(sections, isLandscape, hints);

      return (
        <Document title={cover.reportTitle} author={cover.companyName} subject="Financial Report" creator="H+ Analytics">
          {pageGroups.map((group, pageIdx) => (
            <Page key={`page-${pageIdx}`} size={pageSize} style={pageStyle}>
              <PageHeader title={cover.reportTitle} companyName={cover.companyName} entityName={cover.entityName} theme={theme} />
              {group.map((section, secIdx) => renderDenseSectionContent(section, pageIdx * 100 + secIdx, theme, isLandscape, hints))}
              <PageFooter companyName={cover.companyName} theme={theme} />
            </Page>
          ))}
        </Document>
      );
    }

    return (
      <Document title={cover.reportTitle} author={cover.companyName} subject="Financial Report" creator="H+ Analytics">
        {sections.map((section, i) => {
          switch (section.kind) {
            case "kpi":
              return (
                <KpiCards
                  key={`kpi-${i}`}
                  title={section.title}
                  metrics={section.metrics}
                  companyName={cover.companyName}
                  entityName={cover.entityName}
                  theme={theme}
                  isLandscape={isLandscape}
                  hints={hints}
                />
              );
            case "table":
              return (
                <FinancialTable
                  key={`table-${i}`}
                  title={section.title}
                  years={section.years}
                  rows={section.rows}
                  companyName={cover.companyName}
                  entityName={cover.entityName}
                  theme={theme}
                  isLandscape={isLandscape}
                  hints={hints}
                />
              );
            case "chart":
              return (
                <LineChart
                  key={`chart-${i}`}
                  title={section.title}
                  series={section.series}
                  years={section.years}
                  companyName={cover.companyName}
                  entityName={cover.entityName}
                  theme={theme}
                  isLandscape={isLandscape}
                  hints={hints}
                />
              );
            case "image":
              if (!section.dataUrl) return null;
              return (
                <Page key={`image-${i}`} size={pageSize} style={pageStyle}>
                  <PageHeader title={section.title} companyName={cover.companyName} entityName={cover.entityName} theme={theme} />
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 8, paddingHorizontal: 4 }}>
                    <Image src={section.dataUrl} style={{ width: "96%", objectFit: "contain" }} />
                  </View>
                  <PageFooter companyName={cover.companyName} theme={theme} />
                </Page>
              );
            default:
              return null;
          }
        })}

        {sections.length === 0 && (
          <Page size={pageSize} style={pageStyle}>
            <PageHeader title="Financial Report" companyName={cover.companyName} entityName={cover.entityName} theme={theme} />
            <Text style={{ fontSize: 10, color: theme.border, textAlign: "center", paddingTop: 80 }}>No financial data available for export.</Text>
            <PageFooter companyName={cover.companyName} theme={theme} />
          </Page>
        )}
      </Document>
    );
  };

  const buffer = await renderToBuffer(buildDocument());
  logger.info(`[react-pdf] Rendered ${buffer.length} bytes`, "premium-export");
  return Buffer.from(buffer);
}
