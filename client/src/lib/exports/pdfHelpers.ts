/**
 * pdfHelpers.ts — Shared PDF generation helpers for jsPDF
 *
 * Centralises branded page layout, typography, table formatting, and footer
 * rendering for all PDF exports (financial statements, research reports).
 *
 * ─── Usage ────────────────────────────────────────────────────────────────
 *   const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
 *   drawBrandedHeader(doc, pageW);
 *   drawTitle(doc, "Income Statement", 14, 18);
 *   // … add content …
 *   addFooters(doc, "My Company");   // call LAST — iterates all pages
 */

import { BRAND, type ExportRowMeta, classifyRow, indentLabel, formatFull, normalizeCaps } from "./exportStyles";

export function drawBrandedHeader(doc: any, pageW: number, height = 28) {
  doc.setFillColor(...BRAND.NAVY_RGB);
  doc.rect(0, 0, pageW, height, "F");
  doc.setFillColor(...BRAND.SAGE_RGB);
  doc.rect(0, height - 2, pageW, 2, "F");
}

export function drawTitle(doc: any, text: string, x: number, y: number, opts?: {
  fontSize?: number; color?: [number, number, number]; bold?: boolean;
}) {
  const { fontSize = 18, color = BRAND.DARK_TEXT_RGB, bold = true } = opts || {};
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);
  doc.text(text, x, y);
}

export function drawSubtitle(doc: any, text: string, x: number, y: number, opts?: {
  fontSize?: number; color?: [number, number, number];
}) {
  const { fontSize = 10, color = BRAND.GRAY_RGB } = opts || {};
  doc.setFont("helvetica", "normal");
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);
  doc.text(text, x, y);
}

/**
 * Draw a subtitle row with left-aligned text and a right-aligned source tag.
 * The source tag describes the origin of the export (e.g., "Income Statement — Consolidated").
 */
export function drawSubtitleRow(doc: any, leftText: string, rightText: string, x: number, y: number, pageW: number, opts?: {
  fontSize?: number; color?: [number, number, number]; rightColor?: [number, number, number];
}) {
  const { fontSize = 10, color = BRAND.GRAY_RGB, rightColor = BRAND.DARK_GREEN_RGB } = opts || {};
  doc.setFont("helvetica", "normal");
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);
  doc.text(leftText, x, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(fontSize - 1);
  doc.setTextColor(...rightColor);
  doc.text(rightText, pageW - x, y, { align: "right" });
}

export function drawSectionHeader(doc: any, title: string, y: number, color = BRAND.DARK_GREEN_RGB): number {
  if (y > 260) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...color);
  doc.text(title, 14, y);
  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);
  doc.line(14, y + 2, 80, y + 2);
  return y + 8;
}

export function drawParagraph(doc: any, text: string, y: number, pageW: number, opts?: {
  fontSize?: number; indent?: number; italic?: boolean;
}): number {
  if (!text) return y;
  const { fontSize = 9, indent = 14, italic = false } = opts || {};
  doc.setFont("helvetica", italic ? "italic" : "normal");
  doc.setFontSize(fontSize);
  doc.setTextColor(...BRAND.DARK_TEXT_RGB);
  const lines = doc.splitTextToSize(text, pageW - indent - 14);
  for (const line of lines) {
    if (y > 275) { doc.addPage(); y = 20; }
    doc.text(line, indent, y);
    y += fontSize * 0.5;
  }
  return y + 2;
}

export function drawKeyValue(doc: any, label: string, value: string, y: number, x = 18): number {
  if (y > 275) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.GRAY_RGB);
  doc.text(label + ":", x, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  doc.text(value || "N/A", x + 52, y);
  return y + 5;
}

/**
 * Build a jspdf-autotable config with brand styling, proper indent/bold/italic
 * support via didParseCell, alternating row tint, thicker section divider
 * lines, and an outer table frame.
 */
export function buildFinancialTableConfig(
  years: (string | number)[],
  rows: ExportRowMeta[],
  orientation: "landscape" | "portrait",
  startY = 32,
): Record<string, any> {
  const yearLabels = years.map((y) => typeof y === "number" ? `FY ${y}` : y);
  const numCols = years.length;
  const labelColW = orientation === "landscape" ? 50 : 40;
  const availableWidth = orientation === "landscape" ? 230 : 155;
  const dataColW = availableWidth / numCols;

  const colStyles: Record<number, any> = { 0: { cellWidth: labelColW } };
  for (let i = 1; i <= numCols; i++) {
    colStyles[i] = { halign: "right", cellWidth: dataColW };
  }

  const body = rows.map((row) => [
    indentLabel(normalizeCaps(row.category), row.indent),
    ...row.values.map((v) => {
      if (typeof v === "string" && v.includes("%")) return v;
      if (typeof v === "number" && row.category.includes("%")) return `${v.toFixed(1)}%`;
      return formatFull(v);
    }),
  ]);

  const fontSize = numCols <= 6 ? 7.5 : numCols <= 10 ? 7 : 6;

  return {
    head: [["", ...yearLabels]],
    body,
    startY,
    styles: {
      fontSize,
      cellPadding: 1.5,
      overflow: "linebreak",
      font: "helvetica",
      lineColor: [200, 205, 210],
      lineWidth: 0.25,
    },
    headStyles: {
      fillColor: BRAND.SAGE_RGB,
      textColor: BRAND.WHITE_RGB,
      fontStyle: "bold",
      halign: "center",
      lineWidth: 0.4,
      lineColor: BRAND.SAGE_RGB,
    },
    columnStyles: colStyles,
    tableWidth: "auto",
    tableLineColor: BRAND.SAGE_RGB,
    tableLineWidth: 0.6,
    didParseCell: (() => {
      let dataRowIdx = 0;
      let lastRowIndex = -1;
      return (data: any) => {
        if (data.section !== "body") return;
        const idx = data.row.index;
        if (idx === undefined || idx >= rows.length) return;
        const row = rows[idx];
        const { isSectionHeader, isSubtotal, isFormula } = classifyRow(row);

        if (isSectionHeader) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = BRAND.SECTION_BG_RGB;
          data.cell.styles.lineWidth = { top: 0.6 };
          data.cell.styles.lineColor = { top: BRAND.SAGE_RGB };
        } else if (isSubtotal) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.lineWidth = { top: 0.5 };
          data.cell.styles.lineColor = { top: [180, 185, 190] };
        } else if (isFormula) {
          data.cell.styles.fontStyle = "italic";
          data.cell.styles.textColor = BRAND.GRAY_RGB;
          data.cell.styles.fontSize = (data.cell.styles.fontSize || fontSize) - 0.5;
          if (idx !== lastRowIndex) { dataRowIdx++; lastRowIndex = idx; }
          if (dataRowIdx % 2 === 0) {
            data.cell.styles.fillColor = BRAND.ALT_ROW_RGB;
          }
        } else {
          if (idx !== lastRowIndex) { dataRowIdx++; lastRowIndex = idx; }
          if (dataRowIdx % 2 === 0) {
            data.cell.styles.fillColor = BRAND.ALT_ROW_RGB;
          }
        }

        if (data.column.index > 0 && !isSectionHeader) {
          data.cell.styles.font = "courier";
        }
      };
    })(),
  };
}

export function addFooters(doc: any, companyName: string) {
  const totalPages = doc.internal.getNumberOfPages();
  const pageH = doc.internal.pageSize.getHeight();
  const pageW = doc.internal.pageSize.getWidth();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setDrawColor(...BRAND.SAGE_RGB);
    doc.setLineWidth(0.4);
    doc.line(14, pageH - 10, pageW - 14, pageH - 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...BRAND.LIGHT_GRAY_RGB);
    doc.text(`${companyName} \u2014 Confidential`, 14, pageH - 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...BRAND.LIGHT_GRAY_RGB);
    doc.text(`Page ${i} of ${totalPages}`, pageW - 14, pageH - 6, { align: "right" });
  }
}
