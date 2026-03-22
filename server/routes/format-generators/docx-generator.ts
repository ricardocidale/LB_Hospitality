import { BRAND } from "../premium-export-prompts";

export async function generateDocxBuffer(aiResult: any, data: { companyName?: string; entityName: string }): Promise<Buffer> {
  const docxLib = await import("docx");
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel, ShadingType } = docxLib;

  const children: any[] = [];

  children.push(new Paragraph({
    children: [new TextRun({ text: data.companyName || data.entityName, bold: true, size: 20, color: BRAND.SECONDARY_HEX, font: "Arial" })],
    spacing: { after: 100 },
  }));

  children.push(new Paragraph({
    children: [new TextRun({ text: aiResult.title || `${data.entityName} \u2014 Investor Memo`, bold: true, size: 36, color: BRAND.PRIMARY_HEX, font: "Arial" })],
    spacing: { after: 100 },
  }));

  if (aiResult.subtitle) {
    children.push(new Paragraph({
      children: [new TextRun({ text: aiResult.subtitle, size: 22, color: BRAND.BORDER_HEX, font: "Arial" })],
      spacing: { after: 200 },
    }));
  }

  children.push(new Paragraph({
    children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, size: 18, color: BRAND.BORDER_HEX, italics: true, font: "Arial" })],
    spacing: { after: 100 },
  }));

  children.push(new Paragraph({
    children: [new TextRun({ text: "Confidential \u2014 For authorized recipients only", size: 16, color: BRAND.BORDER_HEX, italics: true, font: "Arial" })],
    spacing: { after: 400 },
    border: { bottom: { color: BRAND.SECONDARY_HEX, space: 4, style: BorderStyle.SINGLE, size: 6 } },
  }));

  for (const section of (aiResult.sections || [])) {
    const headingLevel = section.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_1;
    children.push(new Paragraph({
      text: section.heading || "",
      heading: headingLevel,
      spacing: { before: 300, after: 150 },
    }));

    for (const content of (section.content || [])) {
      if (content.type === "paragraph") {
        const style = content.style || "normal";
        children.push(new Paragraph({
          children: [new TextRun({
            text: content.text || "",
            bold: style === "bold",
            italics: style === "italic",
            size: 22,
            font: "Arial",
          })],
          spacing: { after: 120 },
        }));
      } else if (content.type === "bullet_list") {
        for (const item of (content.items || [])) {
          children.push(new Paragraph({
            children: [new TextRun({ text: item, size: 22, font: "Arial" })],
            bullet: { level: 0 },
            spacing: { after: 60 },
          }));
        }
      } else if (content.type === "key_value") {
        for (const pair of (content.pairs || [])) {
          children.push(new Paragraph({
            children: [
              new TextRun({ text: `${pair.label}: `, bold: true, size: 22, font: "Arial", color: BRAND.BORDER_HEX }),
              new TextRun({ text: pair.value || "N/A", size: 22, font: "Arial" }),
            ],
            spacing: { after: 60 },
          }));
        }
      } else if (content.type === "table" && content.headers?.length) {
        const headerCells = content.headers.map((h: string) => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, color: BRAND.WHITE_HEX, font: "Arial" })] })],
          shading: { type: ShadingType.SOLID, color: BRAND.SECONDARY_HEX },
        }));

        const dataRows = (content.rows || []).map((row: string[], ri: number) =>
          new TableRow({
            children: row.map((cell: string) => new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: cell || "", size: 18, font: "Arial" })] })],
              shading: ri % 2 === 1 ? { type: ShadingType.SOLID, color: BRAND.SURFACE_HEX } : undefined,
            })),
          })
        );

        children.push(new Table({
          rows: [new TableRow({ children: headerCells }), ...dataRows],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }));
        children.push(new Paragraph({ spacing: { after: 200 } }));
      }
    }
  }

  if (aiResult.appendix?.financial_tables?.length) {
    children.push(new Paragraph({
      text: "Appendix: Financial Tables",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }));

    for (const table of aiResult.appendix.financial_tables) {
      children.push(new Paragraph({
        text: table.title || "",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }));

      const years = table.years || [];
      const headerCells = ["", ...years].map((h: string) => new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: h, bold: true, size: 16, color: BRAND.WHITE_HEX, font: "Arial" })],
          alignment: h ? AlignmentType.RIGHT : AlignmentType.LEFT,
        })],
        shading: { type: ShadingType.SOLID, color: BRAND.SECONDARY_HEX },
      }));

      const dataRows = (table.rows || []).map((row: any, ri: number) => {
        const indent = row.indent ? "  ".repeat(row.indent) : "";
        const isHeaderRow = row.type === "header";
        const isTotalRow = row.type === "total" || row.type === "subtotal";

        return new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({
                  text: indent + (row.category || ""),
                  bold: isHeaderRow || isTotalRow,
                  size: 16, font: "Arial",
                })],
              })],
              shading: isHeaderRow ? { type: ShadingType.SOLID, color: BRAND.BACKGROUND_HEX } :
                ri % 2 === 1 ? { type: ShadingType.SOLID, color: BRAND.SURFACE_HEX } : undefined,
            }),
            ...(row.values || []).map((v: any) => new TableCell({
              children: [new Paragraph({
                children: [new TextRun({
                  text: typeof v === "number" ? (v === 0 ? "\u2014" : v < 0 ? `($${Math.abs(v).toLocaleString()})` : `$${v.toLocaleString()}`) : String(v),
                  bold: isTotalRow,
                  size: 16, font: "Arial",
                })],
                alignment: AlignmentType.RIGHT,
              })],
              shading: isHeaderRow ? { type: ShadingType.SOLID, color: BRAND.BACKGROUND_HEX } :
                ri % 2 === 1 ? { type: ShadingType.SOLID, color: BRAND.SURFACE_HEX } : undefined,
            })),
          ],
        });
      });

      children.push(new Table({
        rows: [new TableRow({ children: headerCells }), ...dataRows],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }));
      children.push(new Paragraph({ spacing: { after: 200 } }));
    }
  }

  const docDocument = new Document({
    sections: [{
      properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children,
    }],
  });

  return await Packer.toBuffer(docDocument);
}
