import type { ReportDefinition, ReportSection, FormattedValue } from "../../report/types";

function fmtPptxValue(fv: FormattedValue): string {
  return fv.text;
}

export async function generatePptxFromReport(report: ReportDefinition): Promise<Buffer> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const t = report.tokens;

  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_WIDE";
  pres.author = report.cover.companyName;
  pres.title = report.cover.reportTitle;

  const SLIDE_W = 13.33;
  const SLIDE_H = 7.5;

  const strip = (hex: string) => hex.replace(/^#/, "");

  if (report.includeCoverPage) {
    const slide = pres.addSlide();
    slide.background = { color: strip(t.primary) };
    slide.addShape("rect", { x: 0, y: 0, w: SLIDE_W, h: 0.05, fill: { color: strip(t.secondary) } });
    slide.addText(report.cover.companyName, {
      x: 0.6, y: 1.5, w: 12, h: 0.6,
      fontSize: 28, fontFace: "Arial", color: strip(t.secondary), bold: true,
    });
    slide.addText(report.cover.subtitle || "Financial Report", {
      x: 0.6, y: 2.3, w: 12, h: 0.5,
      fontSize: 22, fontFace: "Arial", color: strip(t.white),
    });
    slide.addText(report.cover.entityName, {
      x: 0.6, y: 2.9, w: 8, h: 0.4,
      fontSize: 14, fontFace: "Arial", color: strip(t.border),
    });
    slide.addShape("rect", { x: 0, y: SLIDE_H - 0.35, w: SLIDE_W, h: 0.01, fill: { color: strip(t.secondary) } });
    slide.addText(`${report.cover.companyName} \u2014 Confidential`, {
      x: 0.3, y: SLIDE_H - 0.32, w: 5, h: 0.25,
      fontSize: 7, fontFace: "Arial", color: strip(t.border), italic: true,
    });
  }

  for (const section of report.sections) {
    const slide = pres.addSlide();

    if (section.kind === "kpi") {
      slide.addText(section.title, {
        x: 0.5, y: 0.2, w: 8, h: 0.4,
        fontSize: 20, fontFace: "Arial", color: strip(t.accent), bold: true,
      });
      slide.addShape("rect", { x: 0.5, y: 0.65, w: 12, h: 0.02, fill: { color: strip(t.secondary) } });

      const cols = 3;
      const cardW = 3.8;
      const cardH = 1.1;
      section.metrics.forEach((m, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = 0.5 + col * (cardW + 0.35);
        const y = 0.9 + row * (cardH + 0.15);
        slide.addShape("rect", {
          x, y, w: cardW, h: cardH,
          fill: { color: strip(t.surface) },
          line: { color: strip(t.secondary), width: 1 },
          rectRadius: 0.1,
        });
        slide.addText(m.value, {
          x: x + 0.15, y: y + 0.15, w: cardW - 0.3, h: 0.5,
          fontSize: 18, fontFace: "Arial", color: strip(t.accent), bold: true,
        });
        slide.addText(m.label, {
          x: x + 0.15, y: y + 0.6, w: cardW - 0.3, h: 0.35,
          fontSize: 9, fontFace: "Arial", color: strip(t.border),
        });
      });
    } else if (section.kind === "table") {
      slide.addText(section.title, {
        x: 0.3, y: 0.1, w: 8, h: 0.3,
        fontSize: 14, fontFace: "Arial", color: strip(t.accent), bold: true,
      });

      const years = section.years;
      const tableRows: any[][] = [];

      const headerRow = [
        { text: "", options: { fill: { color: strip(t.secondary) }, fontFace: "Arial", fontSize: 8, color: strip(t.white), bold: true } },
        ...years.map((y: string) => ({
          text: y, options: { fill: { color: strip(t.secondary) }, fontFace: "Arial", fontSize: 8, color: strip(t.white), bold: true, align: "right" as const },
        })),
      ];
      tableRows.push(headerRow);

      section.rows.forEach((row, ri) => {
        const isHeader = row.type === "header";
        const isTotal = row.type === "total" || row.type === "subtotal";
        const indent = row.indent ? "  ".repeat(row.indent) : "";
        const bg = isHeader ? strip(t.surface) : ri % 2 === 1 ? strip(t.muted) : strip(t.white);

        const labelCell = {
          text: indent + (row.category || ""),
          options: {
            fontFace: "Arial", fontSize: 8,
            color: strip(t.foreground),
            bold: isHeader || isTotal,
            fill: { color: bg },
          },
        };
        const valCells = row.values.map((fv: FormattedValue) => ({
          text: fmtPptxValue(fv),
          options: {
            fontFace: "Arial", fontSize: 8, color: fv.negative ? strip(t.negativeRed) : strip(t.foreground),
            bold: isTotal, align: "right" as const, fill: { color: bg },
          },
        }));
        tableRows.push([labelCell, ...valCells]);
      });

      if (tableRows.length > 1) {
        const tableW = SLIDE_W - 0.6;
        const labelW = Math.max(2.4, Math.min(3.8, tableW - years.length * 0.9));
        const dataW = years.length > 0 ? (tableW - labelW) / years.length : 1;
        slide.addTable(tableRows, {
          x: 0.3, y: 0.45, w: tableW,
          colW: [labelW, ...years.map(() => dataW)],
          rowH: 0.22, autoPage: true,
        });
      }
    } else if (section.kind === "chart") {
      slide.addText(section.title, {
        x: 0.5, y: 0.2, w: 12, h: 0.4,
        fontSize: 20, fontFace: "Arial", color: strip(t.accent), bold: true,
      });
      slide.addShape("rect", { x: 0.5, y: 0.65, w: 12, h: 0.02, fill: { color: strip(t.secondary) } });

      if (section.svgAsset) {
        slide.addText("See chart in PDF/PNG export", {
          x: 0.5, y: 3.0, w: 12, h: 0.5,
          fontSize: 12, fontFace: "Arial", color: strip(t.border), align: "center",
        });
      }

      const legendY = 6.8;
      section.series.forEach((s, si) => {
        const color = strip(s.color || t.chart[si % t.chart.length]);
        const x = 0.5 + si * 3.0;
        slide.addShape("rect", { x, y: legendY, w: 0.25, h: 0.12, fill: { color } });
        slide.addText(s.label, {
          x: x + 0.35, y: legendY - 0.04, w: 2.5, h: 0.2,
          fontSize: 9, fontFace: "Arial", color: strip(t.foreground),
        });
      });
    }

    slide.addShape("rect", { x: 0, y: SLIDE_H - 0.35, w: SLIDE_W, h: 0.01, fill: { color: strip(t.secondary) } });
    slide.addText(`${report.cover.companyName} \u2014 Confidential`, {
      x: 0.3, y: SLIDE_H - 0.32, w: 5, h: 0.25,
      fontSize: 7, fontFace: "Arial", color: strip(t.border), italic: true,
    });
  }

  const arrayBuf = await pres.write({ outputType: "arraybuffer" });
  return Buffer.from(arrayBuf as ArrayBuffer);
}

export async function generatePptxBuffer(aiResult: any, data: { companyName?: string; entityName: string; themeColors?: any[] }, tc: any): Promise<Buffer> {
  const PptxGenJS = (await import("pptxgenjs")).default;

  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_WIDE";
  pres.author = data.companyName || "Report";
  pres.title = aiResult.presentation_notes || `${data.entityName} \u2014 Premium Report`;

  const SLIDE_W = 13.33;
  const SLIDE_H = 7.5;

  for (const slideData of (aiResult.slides || [])) {
    const slide = pres.addSlide();

    if (slideData.type === "title") {
      slide.background = { color: tc.navy };
      slide.addShape("rect", { x: 0, y: 0, w: SLIDE_W, h: 0.05, fill: { color: tc.sage } });
      slide.addText(data.companyName || "", {
        x: 0.6, y: 1.5, w: 12, h: 0.6,
        fontSize: 28, fontFace: "Arial", color: tc.sage, bold: true,
      });
      slide.addText(slideData.title || "", {
        x: 0.6, y: 2.3, w: 12, h: 0.5,
        fontSize: 22, fontFace: "Arial", color: tc.white,
      });
      slide.addText(slideData.subtitle || "", {
        x: 0.6, y: 2.9, w: 8, h: 0.4,
        fontSize: 14, fontFace: "Arial", color: tc.lightGray,
      });
      if (slideData.source_tag) {
        slide.addText(slideData.source_tag, {
          x: SLIDE_W - 5.6, y: 2.9, w: 5, h: 0.4,
          fontSize: 11, fontFace: "Arial", color: tc.sage, bold: true, align: "right",
        });
      }
    } else if (slideData.type === "metrics") {
      slide.addText(slideData.title || "", {
        x: 0.5, y: 0.2, w: 8, h: 0.4,
        fontSize: 20, fontFace: "Arial", color: tc.darkGreen, bold: true,
      });
      slide.addShape("rect", { x: 0.5, y: 0.65, w: 12, h: 0.02, fill: { color: tc.sage } });

      const metrics = slideData.content?.metrics || [];
      const cols = 3;
      const cardW = 3.8;
      const cardH = 1.1;
      metrics.forEach((m: any, i: number) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = 0.5 + col * (cardW + 0.35);
        const y = 0.9 + row * (cardH + 0.15);
        slide.addShape("rect", {
          x, y, w: cardW, h: cardH,
          fill: { color: tc.sectionBg },
          line: { color: tc.sage, width: 1 },
          rectRadius: 0.1,
        });
        const trendColor = m.trend === "up" ? tc.darkGreen :
          m.trend === "down" ? tc.negativeRed : tc.darkGreen;
        slide.addText(m.value || "", {
          x: x + 0.15, y: y + 0.15, w: cardW - 0.3, h: 0.5,
          fontSize: 18, fontFace: "Arial", color: trendColor, bold: true,
        });
        slide.addText(m.label || "", {
          x: x + 0.15, y: y + 0.6, w: cardW - 0.3, h: 0.35,
          fontSize: 9, fontFace: "Arial", color: tc.gray,
        });
      });
    } else if (slideData.type === "table") {
      slide.addText(slideData.title || "", {
        x: 0.3, y: 0.1, w: 8, h: 0.3,
        fontSize: 14, fontFace: "Arial", color: tc.darkGreen, bold: true,
      });
      if (slideData.source_tag) {
        slide.addText(slideData.source_tag, {
          x: SLIDE_W - 5.3, y: 0.1, w: 5, h: 0.3,
          fontSize: 9, fontFace: "Arial", color: tc.gray, bold: true, align: "right",
        });
      }

      const years = slideData.content?.years || [];
      const rows = slideData.content?.rows || [];
      const tableRows: any[][] = [];

      const headerRow = [
        { text: "", options: { fill: { color: tc.sage }, fontFace: "Arial", fontSize: 8, color: tc.white, bold: true } },
        ...years.map((y: string) => ({
          text: y, options: { fill: { color: tc.sage }, fontFace: "Arial", fontSize: 8, color: tc.white, bold: true, align: "right" as const },
        })),
      ];
      tableRows.push(headerRow);

      rows.forEach((row: any, ri: number) => {
        const isHeader = row.type === "header";
        const isTotal = row.type === "total" || row.type === "subtotal";
        const indent = row.indent ? "  ".repeat(row.indent) : "";
        const bg = isHeader ? tc.sectionBg : ri % 2 === 1 ? tc.altRow : tc.white;

        const labelCell = {
          text: indent + (row.category || ""),
          options: {
            fontFace: "Arial", fontSize: 8,
            color: tc.darkText,
            bold: isHeader || isTotal,
            fill: { color: bg },
          },
        };
        const valCells = (row.values || []).map((v: any) => ({
          text: typeof v === "number" ? (Math.abs(v) >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : Math.abs(v) >= 1_000 ? `$${(v / 1_000).toFixed(0)}K` : v === 0 ? "\u2014" : `$${v}`) : String(v),
          options: {
            fontFace: "Arial", fontSize: 8, color: tc.darkText,
            bold: isTotal, align: "right" as const, fill: { color: bg },
          },
        }));
        tableRows.push([labelCell, ...valCells]);
      });

      if (tableRows.length > 1) {
        const tableW = SLIDE_W - 0.6;
        const labelW = Math.max(2.4, Math.min(3.8, tableW - years.length * 0.9));
        const dataW = years.length > 0 ? (tableW - labelW) / years.length : 1;
        slide.addTable(tableRows, {
          x: 0.3, y: 0.45, w: tableW,
          colW: [labelW, ...years.map(() => dataW)],
          rowH: 0.22, autoPage: true,
        });
      }
    } else if (slideData.type === "summary" || slideData.type === "comparison") {
      slide.addText(slideData.title || "", {
        x: 0.5, y: 0.2, w: 12, h: 0.4,
        fontSize: 20, fontFace: "Arial", color: tc.darkGreen, bold: true,
      });
      slide.addShape("rect", { x: 0.5, y: 0.65, w: 12, h: 0.02, fill: { color: tc.sage } });

      const takeaways = slideData.content?.key_takeaways || [];
      const recs = slideData.content?.recommendations || [];
      let yPos = 1.0;

      if (takeaways.length) {
        slide.addText("Key Takeaways", {
          x: 0.5, y: yPos, w: 6, h: 0.3,
          fontSize: 12, fontFace: "Arial", color: tc.darkGreen, bold: true,
        });
        yPos += 0.35;
        takeaways.forEach((t2: string) => {
          slide.addText(`\u2022 ${t2}`, {
            x: 0.7, y: yPos, w: 11.5, h: 0.3,
            fontSize: 10, fontFace: "Arial", color: tc.darkText,
          });
          yPos += 0.35;
        });
      }

      if (recs.length) {
        yPos += 0.2;
        slide.addText("Recommendations", {
          x: 0.5, y: yPos, w: 6, h: 0.3,
          fontSize: 12, fontFace: "Arial", color: tc.darkGreen, bold: true,
        });
        yPos += 0.35;
        recs.forEach((r: string) => {
          slide.addText(`\u2192 ${r}`, {
            x: 0.7, y: yPos, w: 11.5, h: 0.3,
            fontSize: 10, fontFace: "Arial", color: tc.darkText,
          });
          yPos += 0.35;
        });
      }
    }

    slide.addShape("rect", {
      x: 0, y: SLIDE_H - 0.35, w: SLIDE_W, h: 0.01,
      fill: { color: tc.sage },
    });
    slide.addText(`${data.companyName} \u2014 Confidential`, {
      x: 0.3, y: SLIDE_H - 0.32, w: 5, h: 0.25,
      fontSize: 7, fontFace: "Arial", color: tc.lightGray, italic: true,
    });
  }

  const arrayBuf = await pres.write({ outputType: "arraybuffer" });
  return Buffer.from(arrayBuf as ArrayBuffer);
}
