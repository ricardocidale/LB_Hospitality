import { resolveThemeColors } from "../../theme-resolver";
import type { ReportDefinition, KpiMetric, ChartSeries } from "../../report/types";

interface LegacySection {
  type: "cover" | "metrics_dashboard" | "financial_table" | "line_chart";
  title: string;
  content?: {
    metrics?: KpiMetric[];
    years?: string[];
    rows?: Array<{ category: string; values: (string | number)[]; type: string; indent: number; format?: string }>;
    series?: ChartSeries[];
  };
  [key: string]: unknown;
}

function buildLegacySections(report: ReportDefinition): LegacySection[] {
  const sections: LegacySection[] = [];

  if (report.includeCoverPage) {
    sections.push({
      type: "cover",
      title: report.cover.subtitle || "Financial Report",
    });
  }

  for (const s of report.sections) {
    if (s.kind === "kpi") {
      sections.push({
        type: "metrics_dashboard",
        title: s.title,
        content: { metrics: s.metrics },
      });
    } else if (s.kind === "table") {
      sections.push({
        type: "financial_table",
        title: s.title,
        content: {
          years: s.years,
          rows: s.rows.map((r) => ({
            category: r.category,
            values: r.rawValues,
            type: r.type,
            indent: r.indent,
            format: r.format,
          })),
        },
      });
    } else if (s.kind === "chart") {
      sections.push({
        type: "line_chart",
        title: s.title,
        content: { series: s.series, years: s.years },
      });
    }
  }

  return sections;
}

export async function generatePngFromReport(report: ReportDefinition): Promise<Buffer> {
  const archiver = (await import("archiver")).default;
  const { buildPdfHtml } = await import("../pdf-html-templates");
  const { renderPng } = await import("../../browser-renderer");

  const isLandscape = report.orientation === "landscape";
  const legacySections = buildLegacySections(report);

  const strip = (hex: string) => hex.replace(/^#/, "");
  const colors = {
    navy: strip(report.tokens.primary),
    sage: strip(report.tokens.secondary),
    darkGreen: strip(report.tokens.accent),
    darkText: strip(report.tokens.foreground),
    gray: strip(report.tokens.border),
    altRow: strip(report.tokens.muted),
    sectionBg: strip(report.tokens.surface),
    white: strip(report.tokens.background),
    lightGray: strip(report.tokens.border),
    negativeRed: strip(report.tokens.negativeRed),
    chart: report.tokens.chart.map(strip),
    line: report.tokens.line.map(strip),
  };

  const pngs: { name: string; buffer: Buffer }[] = [];

  for (let i = 0; i < legacySections.length; i++) {
    const section = legacySections[i];
    const html = buildPdfHtml({ sections: [section] }, {
      orientation: report.orientation,
      companyName: report.cover.companyName,
      entityName: report.cover.entityName,
      sections: [section],
      reportTitle: report.cover.reportTitle,
      colors,
    });

    const pngBuffer = await renderPng(html, {
      width: isLandscape ? 1536 : 816,
      height: isLandscape ? 864 : 1056,
      scale: 2,
    });

    const idx = String(i + 1).padStart(2, "0");
    const label = (section.title || section.type || "Page").replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "-");
    pngs.push({ name: `${idx}-${label}.png`, buffer: pngBuffer });
  }

  const zipPromise = new Promise<Buffer>((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 6 } });
    const chunks: Buffer[] = [];
    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    for (const png of pngs) {
      archive.append(png.buffer, { name: png.name });
    }
    archive.finalize();
  });
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("PNG ZIP generation timed out after 30s")), 30_000)
  );
  return Promise.race([zipPromise, timeoutPromise]);
}

export async function generatePngZipBuffer(
  data: {
    companyName?: string;
    entityName: string;
    orientation?: "landscape" | "portrait";
    statementType?: string;
    themeColors?: any[];
  },
  buildPdfSectionsFromData: (data: any) => any[],
): Promise<Buffer> {
  const archiver = (await import("archiver")).default;
  const { buildPdfHtml } = await import("../pdf-html-templates");
  const { renderPng } = await import("../../browser-renderer");

  const company = data.companyName || data.entityName;
  const isLandscape = (data.orientation || "landscape") === "landscape";
  const sections = buildPdfSectionsFromData(data);
  const colors = resolveThemeColors(data.themeColors);
  const reportTitle = data.statementType
    ? `${company} \u2014 ${data.statementType}`
    : `${company} \u2014 Financial Report`;

  const pngs: { name: string; buffer: Buffer }[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const html = buildPdfHtml({ sections: [section] }, {
      orientation: data.orientation || "landscape",
      companyName: company,
      entityName: data.entityName,
      sections: [section],
      reportTitle,
      colors,
    });

    const pngBuffer = await renderPng(html, {
      width: isLandscape ? 1536 : 816,
      height: isLandscape ? 864 : 1056,
      scale: 2,
    });

    const idx = String(i + 1).padStart(2, "0");
    const label = (section.title || section.type || "Page").replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "-");
    pngs.push({ name: `${idx}-${label}.png`, buffer: pngBuffer });
  }

  const zipPromise = new Promise<Buffer>((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 6 } });
    const chunks: Buffer[] = [];
    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    for (const png of pngs) {
      archive.append(png.buffer, { name: png.name });
    }
    archive.finalize();
  });
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("PNG ZIP generation timed out after 30s")), 30_000)
  );
  return Promise.race([zipPromise, timeoutPromise]);
}
