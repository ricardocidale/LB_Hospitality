import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("dom-to-image-more", () => ({
  default: { toPng: vi.fn(), toSvg: vi.fn() },
  toPng: vi.fn(),
  toSvg: vi.fn(),
}));

import { downloadCSV } from "../../client/src/lib/exports/csvExport";
import {
  exportPortfolioCSV,
  type ExportRow,
} from "../../client/src/components/dashboard/dashboardExports";

let mockLink: any;
let capturedBlob: Blob | null;

beforeEach(() => {
  capturedBlob = null;
  mockLink = {
    href: "",
    download: "",
    click: vi.fn(),
  };

  (globalThis as any).document = {
    createElement: vi.fn().mockReturnValue(mockLink),
    body: {
      appendChild: vi.fn().mockReturnValue(mockLink),
      removeChild: vi.fn().mockReturnValue(mockLink),
    },
  };

  (URL as any).createObjectURL = vi.fn((blob: Blob) => {
    capturedBlob = blob;
    return "blob:http://test/abc123";
  });
  (URL as any).revokeObjectURL = vi.fn();
});

afterEach(() => {
  delete (globalThis as any).document;
});

describe("downloadCSV (csvExport.ts)", () => {
  it("creates blob with correct MIME type", () => {
    downloadCSV("a,b\n1,2", "test.csv");
    expect(capturedBlob).toBeInstanceOf(Blob);
    expect(capturedBlob!.type).toBe("text/csv;charset=utf-8;");
  });

  it("sanitizes dangerous filename characters", () => {
    downloadCSV("data", 'portfolio/export:file*"name".csv');
    expect(mockLink.download).toBe("portfolio_export_file__name_.csv");
  });

  it("preserves safe filename characters", () => {
    downloadCSV("data", "my-report_2025.csv");
    expect(mockLink.download).toBe("my-report_2025.csv");
  });

  it("handles commas in pre-escaped cell values", async () => {
    const content = '"Category","Value"\n"Grand Hotel, NYC","$1,500,000"';
    downloadCSV(content, "test.csv");

    const text = await capturedBlob!.text();
    expect(text).toContain('"Grand Hotel, NYC"');
    expect(text).toContain('"$1,500,000"');
  });

  it("handles quotes in pre-escaped cell values", async () => {
    const content = '"Name","Description"\n"The ""Grand"" Hotel","A luxury property"';
    downloadCSV(content, "quotes.csv");

    const text = await capturedBlob!.text();
    expect(text).toContain('""Grand""');
  });

  it("handles newlines within quoted cells", async () => {
    const content = '"Name","Notes"\n"Hotel A","Line 1\nLine 2"';
    downloadCSV(content, "multiline.csv");

    const text = await capturedBlob!.text();
    expect(text).toContain("Line 1\nLine 2");
  });

  it("handles unicode characters in financial data", async () => {
    const content = '"Category","Year 1"\n"Revenue \u2014 Total","$1,234,567"\n"NOI (Net Operating Income)","$500,000"';
    downloadCSV(content, "unicode.csv");

    const text = await capturedBlob!.text();
    expect(text).toContain("Revenue \u2014 Total");
  });

  it("handles empty content", () => {
    const result = downloadCSV("", "empty.csv");
    expect(result).toBe(true);
  });

  it("returns true on success", () => {
    expect(downloadCSV("a,b\n1,2", "test.csv")).toBe(true);
  });
});

describe("exportPortfolioCSV (dashboardExports.ts)", () => {
  it("builds correct CSV structure from ExportRow data", async () => {
    const years = [2025, 2026, 2027];
    const rows: ExportRow[] = [
      { category: "Total Revenue", values: [6000000, 6500000, 7000000], isHeader: true },
      { category: "Room Revenue", values: [4000000, 4300000, 4600000], indent: 1 },
      { category: "F&B Revenue", values: [1200000, 1300000, 1400000], indent: 1 },
    ];

    exportPortfolioCSV(years, rows, "portfolio-is.csv");

    await new Promise(r => setTimeout(r, 50));
    const text = await capturedBlob!.text();

    expect(text).toContain("Category,2025,2026,2027");
    expect(text).toContain('"Total Revenue"');
    expect(text).toContain("6000000.00");
    expect(text).toContain('"  Room Revenue"');
    expect(text).toContain('"  F&B Revenue"');
  });

  it("applies double-indent for nested rows", async () => {
    const years = [2025];
    const rows: ExportRow[] = [
      { category: "Hotel A", values: [3000000], indent: 2 },
    ];
    exportPortfolioCSV(years, rows, "nested.csv");

    await new Promise(r => setTimeout(r, 50));
    const text = await capturedBlob!.text();
    expect(text).toContain('"    Hotel A"');
  });

  it("handles special characters in category names via quoting", async () => {
    const years = [2025];
    const rows: ExportRow[] = [
      { category: "O'Brien's Resort & Spa", values: [2000000] },
      { category: "Ch\u00e2teau du Lac", values: [5000000] },
    ];
    exportPortfolioCSV(years, rows, "special.csv");

    await new Promise(r => setTimeout(r, 50));
    const text = await capturedBlob!.text();
    expect(text).toContain("O'Brien's Resort & Spa");
    expect(text).toContain("Ch\u00e2teau du Lac");
  });

  it("wraps category values in quotes to handle embedded commas safely", async () => {
    const years = [2025];
    const rows: ExportRow[] = [
      { category: "Revenue, Total", values: [1000000] },
    ];
    exportPortfolioCSV(years, rows, "comma-category.csv");

    await new Promise(r => setTimeout(r, 50));
    const text = await capturedBlob!.text();
    expect(text).toContain('"Revenue, Total"');
  });

  it("formats numeric values to 2 decimal places in CSV output", async () => {
    const years = [2025, 2026];
    const rows: ExportRow[] = [
      { category: "NOI", values: [1234567.891, 2345678.999] },
    ];
    exportPortfolioCSV(years, rows, "decimals.csv");

    await new Promise(r => setTimeout(r, 50));
    const text = await capturedBlob!.text();
    expect(text).toContain("1234567.89");
    expect(text).toContain("2345679.00");
  });

  it("generates valid CSV with header row and data rows", async () => {
    const years = [2025, 2026];
    const rows: ExportRow[] = [
      { category: "Revenue", values: [100, 200], isHeader: true },
      { category: "Rooms", values: [60, 120], indent: 1 },
      { category: "F&B", values: [40, 80], indent: 1 },
    ];
    exportPortfolioCSV(years, rows, "structured.csv");

    await new Promise(r => setTimeout(r, 50));
    const text = await capturedBlob!.text();
    const lines = text.split("\n");
    expect(lines[0]).toBe("Category,2025,2026");
    expect(lines).toHaveLength(4);
  });

  it("handles large number of rows without error", () => {
    const years = [2025, 2026];
    const rows: ExportRow[] = Array.from({ length: 100 }, (_, i) => ({
      category: `Line Item ${i}`,
      values: [i * 10000, i * 11000],
    }));
    exportPortfolioCSV(years, rows, "large.csv");
    expect(mockLink.click).toHaveBeenCalled();
  });
});
