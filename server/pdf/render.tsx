import React from "react";
import { Document, Page, View, Text, renderToBuffer, Svg, Line, Circle, Path, G } from "@react-pdf/renderer";
import { type PdfTheme, themeFromColorMap } from "./theme";
import type { ReportDefinition, ReportSection, TableRow as IRTableRow, FormattedValue, DesignTokens } from "../report/types";
import { compileReport } from "../report/compiler";
import { logger } from "../logger";

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
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#ffffff", fontFamily: "Helvetica-Bold" }}>{title}</Text>
          <Text style={{ fontSize: 7.5, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{companyName} — {entityName}</Text>
        </View>
        <Text style={{ fontSize: 7, color: theme.secondary, fontWeight: "bold", fontFamily: "Helvetica-Bold" }}>{companyName}</Text>
      </View>
      <View style={{ height: 5, backgroundColor: theme.accent, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 }} />
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

function CoverPage({ title, subtitle, companyName, entityName, theme, isLandscape }: {
  title: string; subtitle?: string; companyName: string; entityName: string; theme: PdfTheme; isLandscape: boolean;
}) {
  const dateStr = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const pageSize: [number, number] = isLandscape ? PAGE_LANDSCAPE : PAGE_PORTRAIT;

  return (
    <Page size={pageSize} style={{ backgroundColor: theme.primary, position: "relative" }}>
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, backgroundColor: theme.accent }} />
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 10, backgroundColor: theme.secondary }} />

      <View style={{ position: "absolute", left: isLandscape ? 120 : 80, top: "25%", right: isLandscape ? "50%" : 80 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 28 }}>
          <View style={{ width: 5, height: 120, backgroundColor: theme.secondary, borderRadius: 2, marginRight: 16 }} />
          <View style={{ flex: 1 }}>
            <View style={{ borderWidth: 1.5, borderColor: theme.secondary, borderRadius: 3, paddingVertical: 5, paddingHorizontal: 14, alignSelf: "flex-start", marginBottom: 20 }}>
              <Text style={{ fontSize: 6, fontWeight: "bold", fontFamily: "Helvetica-Bold", letterSpacing: 3, color: theme.secondary }}>CONFIDENTIAL</Text>
            </View>
            <Text style={{ fontSize: isLandscape ? 36 : 30, fontWeight: "bold", fontFamily: "Helvetica-Bold", color: "#ffffff", lineHeight: 1.1, marginBottom: 16 }}>{companyName}</Text>
            <View style={{ width: 140, height: 3, backgroundColor: theme.accent, borderRadius: 1, marginBottom: 18 }} />
            <Text style={{ fontSize: isLandscape ? 16 : 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>{title}</Text>
            {subtitle ? <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>{subtitle}</Text> : null}
          </View>
        </View>

        <View style={{ backgroundColor: "rgba(26,35,50,0.6)", borderWidth: 1, borderColor: "rgba(159,188,164,0.35)", borderRadius: 6, padding: "14 18", marginTop: 30 }}>
          <View style={{ flexDirection: "row", gap: 50 }}>
            {[
              { label: "PREPARED FOR", value: entityName },
              { label: "DATE", value: dateStr },
              { label: "CLASSIFICATION", value: "Strictly Confidential" },
            ].map((item, i) => (
              <View key={i}>
                <Text style={{ fontSize: 5.5, fontWeight: "bold", fontFamily: "Helvetica-Bold", letterSpacing: 2, color: theme.secondary, marginBottom: 4 }}>{item.label}</Text>
                <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.85)" }}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={{ position: "absolute", left: isLandscape ? 120 : 80, right: isLandscape ? 120 : 80, bottom: "7%", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", paddingTop: 8 }}>
        <Text style={{ fontSize: 6, color: "rgba(255,255,255,0.35)", fontStyle: "italic", lineHeight: 1.6 }}>
          This document contains proprietary financial projections and confidential business information. Distribution is restricted to authorized recipients only.
        </Text>
      </View>
    </Page>
  );
}

function KpiCards({ title, metrics, companyName, entityName, theme, isLandscape }: {
  title: string; metrics: Array<{ label: string; value: string; description?: string }>; companyName: string; entityName: string; theme: PdfTheme; isLandscape: boolean;
}) {
  const accentColors = [theme.accent, theme.primary, theme.secondary, theme.accent, theme.primary, theme.secondary];
  const pageSize: [number, number] = isLandscape ? PAGE_LANDSCAPE : PAGE_PORTRAIT;
  const cols = isLandscape ? 3 : 2;

  const rows: Array<typeof metrics> = [];
  for (let i = 0; i < metrics.length; i += cols) {
    rows.push(metrics.slice(i, i + cols));
  }

  return (
    <Page size={pageSize} style={{ paddingTop: 10, paddingHorizontal: isLandscape ? 60 : 50, paddingBottom: 30, backgroundColor: "#ffffff" }}>
      <PageHeader title={title} companyName={companyName} entityName={entityName} theme={theme} />
      <View style={{ flexDirection: "column", gap: 12 }}>
        {rows.map((row, ri) => (
          <View key={ri} style={{ flexDirection: "row", gap: 12 }}>
            {row.map((m, mi) => {
              const idx = ri * cols + mi;
              const color = accentColors[idx % accentColors.length];
              return (
                <View key={mi} style={{ flex: 1, backgroundColor: theme.muted, borderWidth: 1, borderColor: theme.border, borderRadius: 7, overflow: "hidden", alignItems: "center" }}>
                  <View style={{ height: 7, backgroundColor: color, width: "100%" }} />
                  <View style={{ padding: "16 14 18 14", alignItems: "center" }}>
                    <Text style={{ fontSize: 24, fontWeight: "bold", fontFamily: "Helvetica-Bold", color, marginBottom: 5 }}>{m.value}</Text>
                    <Text style={{ fontSize: 8.5, color: theme.border, fontWeight: "bold", fontFamily: "Helvetica-Bold", textAlign: "center", marginBottom: 4 }}>{m.label}</Text>
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

function FinancialTable({ title, years, rows, companyName, entityName, theme, isLandscape }: {
  title: string; years: string[]; rows: IRTableRow[]; companyName: string; entityName: string; theme: PdfTheme; isLandscape: boolean;
}) {
  const pageSize: [number, number] = isLandscape ? PAGE_LANDSCAPE : PAGE_PORTRAIT;
  const colWidth = isLandscape
    ? (PAGE_LANDSCAPE[0] - 120 - 140) / Math.max(years.length, 1)
    : (PAGE_PORTRAIT[0] - 100 - 110) / Math.max(years.length, 1);
  const labelWidth = isLandscape ? 140 : 110;
  const fontSize = isLandscape ? 7.5 : 7;

  if (!years.length || !rows.length) {
    return (
      <Page size={pageSize} style={{ paddingTop: 10, paddingHorizontal: isLandscape ? 60 : 50, paddingBottom: 30, backgroundColor: "#ffffff" }}>
        <PageHeader title={title} companyName={companyName} entityName={entityName} theme={theme} />
        <Text style={{ fontSize: 10, color: theme.border, textAlign: "center", paddingTop: 80 }}>No financial data available for this section.</Text>
        <PageFooter companyName={companyName} theme={theme} />
      </Page>
    );
  }

  return (
    <Page size={pageSize} style={{ paddingTop: 10, paddingHorizontal: isLandscape ? 60 : 50, paddingBottom: 30, backgroundColor: "#ffffff" }}>
      <PageHeader title={title} companyName={companyName} entityName={entityName} theme={theme} />
      <View style={{ borderWidth: 0.5, borderColor: theme.secondary, borderRadius: 5, overflow: "hidden" }}>
        <View style={{ flexDirection: "row", backgroundColor: theme.surface, borderBottomWidth: 2, borderBottomColor: theme.accent }}>
          <View style={{ width: labelWidth, padding: "6 8" }}>
            <Text style={{ fontSize, fontWeight: "bold", fontFamily: "Helvetica-Bold", color: theme.primary }}> </Text>
          </View>
          {years.map((yr, i) => (
            <View key={i} style={{ width: colWidth, padding: "6 4", alignItems: "flex-end" }}>
              <Text style={{ fontSize, fontWeight: "bold", fontFamily: "Helvetica-Bold", color: theme.primary }}>FY {yr}</Text>
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

          const bgColor = isHeader ? theme.surface : isTotal ? "#ffffff" : idx % 2 === 0 ? theme.muted : "#ffffff";
          const borderTop = isHeader ? { borderTopWidth: 1.5, borderTopColor: theme.secondary } : isTotal ? { borderTopWidth: 1.5, borderTopColor: theme.border } : {};

          const allZero = row.values.every((fv) => {
            const r = fv.raw;
            return r === 0 || r === null || r === "";
          });

          return (
            <View key={idx} style={{ flexDirection: "row", backgroundColor: bgColor, ...borderTop }}>
              <View style={{ width: labelWidth, padding: "4 8", paddingLeft: 8 + row.indent * 10 }}>
                <Text style={{
                  fontSize,
                  fontWeight: isHeader || isTotal ? "bold" : "normal",
                  fontFamily: isHeader || isTotal ? "Helvetica-Bold" : "Helvetica",
                  color: isHeader || isTotal ? theme.primary : theme.foreground,
                }}>{category}</Text>
              </View>
              {row.values.map((fv, vi) => {
                const displayText = allZero && isHeader ? "" : fv.text;
                return (
                  <View key={vi} style={{ width: colWidth, padding: "4 4", alignItems: "flex-end" }}>
                    <Text style={{
                      fontSize,
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
      <PageFooter companyName={companyName} theme={theme} />
    </Page>
  );
}

function LineChart({ title, series, years, companyName, entityName, theme, isLandscape }: {
  title: string;
  series: Array<{ label: string; values: number[]; color: string }>;
  years: string[];
  companyName: string;
  entityName: string;
  theme: PdfTheme;
  isLandscape: boolean;
}) {
  const pageSize: [number, number] = isLandscape ? PAGE_LANDSCAPE : PAGE_PORTRAIT;
  if (!series.length || !years.length) return null;

  const svgW = isLandscape ? 700 : 440;
  const svgH = isLandscape ? 260 : 300;
  const padL = 70, padR = 30, padT = 20, padB = 50;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  let globalMax = 1;
  for (const s of series) {
    for (const v of (s.values || [])) {
      if (typeof v === "number" && Math.abs(v) > globalMax) globalMax = Math.abs(v);
    }
  }
  globalMax *= 1.08;
  const gridN = 5;

  return (
    <Page size={pageSize} style={{ paddingTop: 10, paddingHorizontal: isLandscape ? 60 : 50, paddingBottom: 30, backgroundColor: "#ffffff" }}>
      <PageHeader title={title} companyName={companyName} entityName={entityName} theme={theme} />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: "100%", maxHeight: isLandscape ? 320 : 380 }}>
          {Array.from({ length: gridN + 1 }).map((_, g) => {
            const y = padT + (plotH / gridN) * g;
            const gVal = globalMax - (globalMax / gridN) * g;
            return (
              <G key={`grid-${g}`}>
                <Line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke={theme.border} strokeWidth={0.7} />
                <Text x={padL - 8} y={y + 3} style={{ fontSize: 8, textAnchor: "end" }} fill={theme.border}>{fmtCompact(gVal / 1.08)}</Text>
              </G>
            );
          })}

          <Line x1={padL} y1={padT + plotH} x2={svgW - padR} y2={padT + plotH} stroke={theme.border} strokeWidth={1} />
          <Line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke={theme.border} strokeWidth={0.5} />

          {years.map((yr, i) => {
            const x = padL + (i / Math.max(years.length - 1, 1)) * plotW;
            const label = yr.length === 4 ? "'" + yr.slice(2) : yr;
            return <Text key={`xl-${i}`} x={x} y={padT + plotH + 16} style={{ fontSize: 8, textAnchor: "middle" }} fill={theme.border}>{label}</Text>;
          })}

          {series.map((s, si) => {
            const color = s.color || theme.chart[si % theme.chart.length];
            const values: number[] = (s.values || []).map((v) => typeof v === "number" ? v : 0);
            if (values.length < 2) return null;
            const pts = values.map((v, i) => ({
              x: padL + (i / Math.max(values.length - 1, 1)) * plotW,
              y: padT + plotH - (v / globalMax) * plotH,
            }));
            const curvePath = monotoneCubicPath(pts);
            return (
              <G key={`series-${si}`}>
                <Path d={curvePath} fill="none" stroke={color} strokeWidth={1.5} />
                {pts.map((p, pi) => (
                  <G key={`dot-${pi}`}>
                    <Circle cx={p.x} cy={p.y} r={2.5} fill="#ffffff" stroke={color} strokeWidth={1.5} />
                    <Circle cx={p.x} cy={p.y} r={1.2} fill={color} />
                  </G>
                ))}
              </G>
            );
          })}

          {series.map((s, si) => {
            const color = s.color || theme.chart[si % theme.chart.length];
            const xOff = si * (isLandscape ? 160 : 120);
            const legendY = svgH - 10;
            return (
              <G key={`legend-${si}`}>
                <Line x1={padL + xOff} y1={legendY} x2={padL + xOff + 16} y2={legendY} stroke={color} strokeWidth={1.5} />
                <Circle cx={padL + xOff + 8} cy={legendY} r={2} fill="#ffffff" stroke={color} strokeWidth={1.2} />
                <Text x={padL + xOff + 22} y={legendY + 3} style={{ fontSize: 8, fontWeight: 600 }} fill={theme.foreground}>{s.label || ""}</Text>
              </G>
            );
          })}
        </Svg>
      </View>
      <PageFooter companyName={companyName} theme={theme} />
    </Page>
  );
}

export async function renderPremiumPdf(input: ReportDefinition | Record<string, any>): Promise<Buffer> {
  let report: ReportDefinition;
  if ("tokens" in input && "sections" in input && "cover" in input) {
    report = input as ReportDefinition;
  } else {
    report = compileReport(input as any);
  }

  const theme = tokensToTheme(report.tokens);
  const { cover, orientation, includeCoverPage, sections } = report;
  const isLandscape = orientation === "landscape";

  logger.info(`[react-pdf] Building ${sections.length} sections (cover=${includeCoverPage}, landscape=${isLandscape})`, "premium-export");

  const doc = (
    <Document title={cover.reportTitle} author={cover.companyName} subject="Financial Report" creator="H+ Analytics">
      {includeCoverPage && (
        <CoverPage
          title={cover.subtitle || "Financial Report"}
          companyName={cover.companyName}
          entityName={cover.entityName}
          theme={theme}
          isLandscape={isLandscape}
        />
      )}

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
              />
            );
          default:
            return null;
        }
      })}

      {sections.length === 0 && !includeCoverPage && (
        <Page size={isLandscape ? PAGE_LANDSCAPE : PAGE_PORTRAIT} style={{ paddingTop: 10, paddingHorizontal: 60, paddingBottom: 30, backgroundColor: "#ffffff" }}>
          <PageHeader title="Financial Report" companyName={cover.companyName} entityName={cover.entityName} theme={theme} />
          <Text style={{ fontSize: 10, color: theme.border, textAlign: "center", paddingTop: 80 }}>No financial data available for export.</Text>
          <PageFooter companyName={cover.companyName} theme={theme} />
        </Page>
      )}
    </Document>
  );

  const buffer = await renderToBuffer(doc);
  logger.info(`[react-pdf] Rendered ${buffer.length} bytes`, "premium-export");
  return Buffer.from(buffer);
}
