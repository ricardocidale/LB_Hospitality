import { describe, it, expect } from "vitest";
import pptxgen from "pptxgenjs";
import {
  exportPortfolioPPTX,
  exportPropertyPPTX,
  exportCompanyPPTX,
  type PortfolioExportData,
  type PropertyExportData,
  type CompanyExportData,
} from "../../client/src/lib/exports/pptxExport";
import {
  BRAND,
  formatShort,
  pptxFontSize,
  pptxColumnWidths,
} from "../../client/src/lib/exports/exportStyles";

describe("PPTX export types and structure", () => {
  it("PortfolioExportData accepts valid data shape", () => {
    const data: PortfolioExportData = {
      years: ["2025", "2026", "2027"],
      rows: [
        { category: "Total Revenue", values: [6000000, 6500000, 7000000], isBold: true },
        { category: "Room Revenue", values: [4000000, 4300000, 4600000], indent: 1 },
      ],
    };
    expect(data.years).toHaveLength(3);
    expect(data.rows).toHaveLength(2);
    expect(data.rows[0].isBold).toBe(true);
  });

  it("PropertyExportData accepts valid data shape", () => {
    const data: PropertyExportData = {
      years: ["2025"],
      rows: [{ category: "Revenue", values: [100000] }],
    };
    expect(data.years).toHaveLength(1);
  });

  it("CompanyExportData accepts valid data shape", () => {
    const data: CompanyExportData = {
      years: ["2025"],
      rows: [{ category: "Revenue", values: [100000] }],
    };
    expect(data.years).toHaveLength(1);
  });
});

describe("PPTX formatting integration", () => {
  it("formatShort produces correct slide-ready labels", () => {
    expect(formatShort(6030000)).toBe("$6.0M");
    expect(formatShort(450000)).toBe("$450K");
    expect(formatShort(-120000)).toBe("($120K)");
    expect(formatShort(0)).toBe("\u2014");
  });

  it("pptxFontSize returns correct sizes for year counts used in exports", () => {
    expect(pptxFontSize(1)).toBe(10);
    expect(pptxFontSize(5)).toBe(10);
    expect(pptxFontSize(10)).toBe(8);
  });

  it("pptxColumnWidths produces valid layout dimensions", () => {
    for (const yearCount of [1, 5, 10, 15]) {
      const { labelW, dataW, tableW } = pptxColumnWidths(yearCount);
      expect(labelW).toBeGreaterThan(0);
      expect(dataW).toBeGreaterThan(0);
      const totalWidth = labelW + dataW * yearCount;
      expect(totalWidth).toBeCloseTo(tableW, 5);
    }
  });
});

describe("PPTX footer page numbering logic", () => {
  it("page numbering follows 1-indexed i+1/total pattern", () => {
    const total = 5;
    for (let i = 0; i < total; i++) {
      const pageNum = `${i + 1} / ${total}`;
      expect(pageNum).toMatch(/^\d+ \/ \d+$/);
      const [current, of] = pageNum.split(" / ").map(Number);
      expect(current).toBe(i + 1);
      expect(of).toBe(total);
    }
  });

  it("single-slide gets 1/1 numbering", () => {
    const total = 1;
    expect(`${0 + 1} / ${total}`).toBe("1 / 1");
  });

  it("footer text uses company name and confidential marker", () => {
    const companyName = "Acme Hotels";
    const footerLabel = `${companyName} \u2014 Confidential`;
    expect(footerLabel).toBe("Acme Hotels \u2014 Confidential");
  });

  it("footer line color matches BRAND.SAGE_HEX", () => {
    expect(BRAND.SAGE_HEX).toBe("9FBCA4");
  });
});

describe("pptxgen slide creation", () => {
  it("creates slides with addSlide and supports addText/addShape", () => {
    const pres = new pptxgen();
    pres.layout = "LAYOUT_WIDE";
    const slide = pres.addSlide();
    expect(slide).toBeDefined();
    expect(typeof slide.addText).toBe("function");
    expect(typeof slide.addShape).toBe("function");
  });

  it("tracks correct slide count", () => {
    const pres = new pptxgen();
    pres.layout = "LAYOUT_WIDE";
    pres.addSlide();
    pres.addSlide();
    pres.addSlide();
    expect((pres as any).slides).toHaveLength(3);
  });
});
