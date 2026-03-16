import { describe, it, expect } from "vitest";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { AI_GENERATION_TIMEOUT_MS } from "../../server/constants";

const routeSource = fs.readFileSync(
  path.resolve(__dirname, "../../server/routes/premium-exports.ts"),
  "utf-8"
);

describe("Premium export route structure audit", () => {
  it("validates request with zod schema requiring format enum", () => {
    expect(routeSource).toContain('z.enum(["xlsx", "pptx", "pdf", "docx"])');
  });

  it("defines all four content types", () => {
    expect(routeSource).toContain("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    expect(routeSource).toContain("application/vnd.openxmlformats-officedocument.presentationml.presentation");
    expect(routeSource).toContain("application/pdf");
    expect(routeSource).toContain("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  });

  it("defines format extensions for all four types", () => {
    expect(routeSource).toContain('xlsx: ".xlsx"');
    expect(routeSource).toContain('pptx: ".pptx"');
    expect(routeSource).toContain('pdf: ".pdf"');
    expect(routeSource).toContain('docx: ".docx"');
  });

  it("error handler extracts format safely from req.body", () => {
    expect(routeSource).toContain('typeof req.body?.format === "string" ? req.body.format : "unknown"');
  });

  it("error handler includes format in all error response payloads (503, 504, 500)", () => {
    expect(routeSource).toContain('res.status(503).json({ error: "AI service is not available for premium exports", format }');
    expect(routeSource).toContain("res.status(504).json({");
    expect(routeSource).toContain("res.status(500).json({");

    const catchBlock = routeSource.slice(routeSource.indexOf("} catch (error: any)"));
    const formatOccurrences = (catchBlock.match(/\bformat\b/g) || []).length;
    expect(formatOccurrences).toBeGreaterThanOrEqual(5);
  });

  it("timeout error message includes format.toUpperCase()", () => {
    expect(routeSource).toContain("format.toUpperCase()");
  });

  it("has API key not configured check returning 503", () => {
    expect(routeSource).toContain('"API key not configured"');
    expect(routeSource).toContain("res.status(503)");
  });

  it("has timeout check returning 504", () => {
    expect(routeSource).toContain('"timed out"');
    expect(routeSource).toContain("res.status(504)");
  });

  it("truncates long error messages at 300 characters", () => {
    expect(routeSource).toContain("errorMsg.length > 300");
    expect(routeSource).toContain("errorMsg.substring(0, 300)");
  });

  it("sanitizes company name for filenames", () => {
    expect(routeSource).toContain('.replace(/[^a-zA-Z0-9 ]/g, "")');
    expect(routeSource).toContain(".substring(0, 40)");
  });
});

describe("Timeout coordination", () => {
  it("server AI timeout is 120 seconds", () => {
    expect(AI_GENERATION_TIMEOUT_MS).toBe(120_000);
  });

  it("client-side abort timeout (200s) exceeds server AI timeout", () => {
    const CLIENT_TIMEOUT_MS = 200_000;
    expect(CLIENT_TIMEOUT_MS).toBeGreaterThan(AI_GENERATION_TIMEOUT_MS);
    expect(CLIENT_TIMEOUT_MS - AI_GENERATION_TIMEOUT_MS).toBeGreaterThanOrEqual(60_000);
  });

  it("route imports AI_GENERATION_TIMEOUT_MS from server constants", () => {
    expect(routeSource).toContain("AI_GENERATION_TIMEOUT_MS");
    expect(routeSource).toContain('import { AI_GENERATION_TIMEOUT_MS } from "../constants"');
  });
});

describe("Premium export schema validation behavior", () => {
  const exportRowSchema = z.object({
    category: z.string(),
    values: z.array(z.number()),
    indent: z.number().optional(),
    isBold: z.boolean().optional(),
    isHeader: z.boolean().optional(),
  });

  const premiumExportSchema = z.object({
    format: z.enum(["xlsx", "pptx", "pdf", "docx"]),
    orientation: z.enum(["landscape", "portrait"]).optional().default("landscape"),
    version: z.enum(["short", "extended"]).optional().default("short"),
    entityName: z.string(),
    companyName: z.string().optional().default("Hospitality Business Group"),
    statementType: z.string().optional(),
    years: z.array(z.string()).optional(),
    rows: z.array(exportRowSchema).optional(),
  });

  it("accepts valid xlsx request", () => {
    const result = premiumExportSchema.safeParse({
      format: "xlsx",
      entityName: "Hotel Portfolio",
      years: ["2025", "2026"],
      rows: [{ category: "Revenue", values: [1000, 2000] }],
    });
    expect(result.success).toBe(true);
    expect(result.data?.companyName).toBe("Hospitality Business Group");
    expect(result.data?.orientation).toBe("landscape");
  });

  it("accepts valid pptx request", () => {
    const result = premiumExportSchema.safeParse({
      format: "pptx",
      entityName: "Test Hotel",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid format", () => {
    const result = premiumExportSchema.safeParse({
      format: "txt",
      entityName: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing entityName", () => {
    const result = premiumExportSchema.safeParse({
      format: "pdf",
    });
    expect(result.success).toBe(false);
  });

  it("applies default values for optional fields", () => {
    const result = premiumExportSchema.safeParse({
      format: "docx",
      entityName: "Test",
    });
    expect(result.success).toBe(true);
    expect(result.data?.orientation).toBe("landscape");
    expect(result.data?.version).toBe("short");
    expect(result.data?.companyName).toBe("Hospitality Business Group");
  });
});

describe("Safe filename generation", () => {
  it("sanitizes company name for filename", () => {
    const companyName = "Acme Hotels & Resorts (NYC)";
    const safe = companyName.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 40).trim();
    expect(safe).toBe("Acme Hotels  Resorts NYC");
    expect(safe.length).toBeLessThanOrEqual(40);
  });

  it("handles empty company name with fallback to entityName", () => {
    const companyName = "";
    const entityName = "Portfolio Report";
    const safe = (companyName || entityName).replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 40).trim();
    expect(safe).toBe("Portfolio Report");
  });

  it("truncates long names at 40 characters", () => {
    const longName = "A".repeat(60);
    const safe = longName.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 40).trim();
    expect(safe.length).toBe(40);
  });
});
