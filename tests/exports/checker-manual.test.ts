import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSave = vi.fn();
const mockText = vi.fn();
const mockAutoTableFn = vi.fn();

vi.mock("jspdf", () => {
  class MockJsPDF {
    internal = { pageSize: { getWidth: () => 210 } };
    lastAutoTable: any = null;
    setFillColor = vi.fn();
    setTextColor = vi.fn();
    setFont = vi.fn();
    setFontSize = vi.fn();
    setDrawColor = vi.fn();
    setLineWidth = vi.fn();
    rect = vi.fn();
    text = mockText;
    line = vi.fn();
    addPage = vi.fn();
    save = mockSave;
    splitTextToSize = vi.fn((text: string) => [text]);
    addImage = vi.fn();
    roundedRect = vi.fn();
  }
  return { default: MockJsPDF };
});

vi.mock("jspdf-autotable", () => {
  return {
    default: function (doc: any, opts: any) {
      doc.lastAutoTable = { finalY: (opts.startY || 0) + 20 };
      mockAutoTableFn(doc, opts);
    },
  };
});

import { exportManualPDF, exportFullData } from "../../client/src/lib/exports/checkerManualExport";

describe("checkerManualExport.exportManualPDF", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success result on valid input", async () => {
    const result = await exportManualPDF({
      email: "admin@test.com",
      role: "admin",
      companyName: "Test Hotels",
    });
    expect(result.success).toBe(true);
  });

  it("calls doc.save with correct filename", async () => {
    await exportManualPDF({ email: "test@test.com", role: "admin" });
    expect(mockSave).toHaveBeenCalledWith("LB_Checker_Manual.pdf");
  });

  it("renders company name in header", async () => {
    await exportManualPDF({
      email: "admin@test.com",
      role: "admin",
      companyName: "Luxury Resorts",
    });
    expect(mockText).toHaveBeenCalledWith(
      "Luxury Resorts",
      expect.any(Number),
      expect.any(Number)
    );
  });

  it("uses default company name when not provided", async () => {
    await exportManualPDF({ email: "test@test.com", role: "admin" });
    expect(mockText).toHaveBeenCalledWith(
      "Hospitality Business Group",
      expect.any(Number),
      expect.any(Number)
    );
  });

  it("handles missing user fields gracefully", async () => {
    const result = await exportManualPDF({});
    expect(result.success).toBe(true);
  });

  it("generates at least 7 sections via autoTable (TOC + 6 formula/rule tables)", async () => {
    await exportManualPDF({ email: "test@test.com" });
    expect(mockAutoTableFn).toHaveBeenCalledTimes(7);
  });

  it("includes checker manual title text", async () => {
    await exportManualPDF({ email: "admin@test.com" });
    expect(mockText).toHaveBeenCalledWith(
      "Checker Manual \u2014 Verification & Testing Guide",
      expect.any(Number),
      expect.any(Number)
    );
  });

  it("renders user email and role in generation metadata", async () => {
    await exportManualPDF({ email: "auditor@firm.com", role: "auditor" });
    const textCalls = mockText.mock.calls.map((c: any) => c[0]);
    const metadataCall = textCalls.find((t: string) => typeof t === "string" && t.includes("auditor@firm.com"));
    expect(metadataCall).toBeDefined();
    expect(metadataCall).toContain("auditor");
  });
});

describe("checkerManualExport.exportFullData", () => {
  it("is exported as an async function", () => {
    expect(typeof exportFullData).toBe("function");
  });
});
