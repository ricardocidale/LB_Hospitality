import { type Express } from "express";
import { z } from "zod";
import { storage } from "../../storage";
import { requireAdmin } from "../../auth";
import { logAndSendError } from "../helpers";
import type { InsertGlobalAssumptions } from "@shared/schema";

const exportConfigSchema = z.object({
  allowLandscape: z.boolean().optional(),
  allowPortrait: z.boolean().optional(),
  allowPremium: z.boolean().optional(),
  densePagination: z.boolean().optional(),
  overview: z.object({
    kpiMetrics: z.boolean(),
    revenueChart: z.boolean(),
    projectionTable: z.boolean(),
    compositionTables: z.boolean(),
    waterfallTable: z.boolean(),
    propertyInsights: z.boolean(),
  }).optional(),
  statements: z.object({
    incomeStatement: z.boolean(),
    incomeChart: z.boolean(),
    cashFlow: z.boolean(),
    cashFlowChart: z.boolean(),
    balanceSheet: z.boolean(),
    balanceSheetChart: z.boolean(),
    detailedLineItems: z.boolean(),
  }).optional(),
  analysis: z.object({
    investmentAnalysis: z.boolean(),
    kpiSummaryCards: z.boolean(),
    debtSchedule: z.boolean(),
  }).optional(),
});

const DEFAULT_EXPORT_CONFIG = {
  allowLandscape: true,
  allowPortrait: true,
  allowPremium: true,
  densePagination: true,
  overview: {
    kpiMetrics: true,
    revenueChart: true,
    projectionTable: true,
    compositionTables: true,
    waterfallTable: true,
    propertyInsights: true,
  },
  statements: {
    incomeStatement: true,
    incomeChart: true,
    cashFlow: true,
    cashFlowChart: true,
    balanceSheet: true,
    balanceSheetChart: true,
    detailedLineItems: true,
  },
  analysis: {
    investmentAnalysis: true,
    kpiSummaryCards: true,
    debtSchedule: true,
  },
};

export function registerExportConfigRoutes(app: Express) {
  app.get("/api/admin/export-config", requireAdmin, async (_req, res) => {
    try {
      const ga = await storage.getGlobalAssumptions();
      if (!ga) return res.status(404).json({ error: "No global assumptions found" });
      const stored = ga.exportConfig as typeof DEFAULT_EXPORT_CONFIG | null;
      if (!stored) {
        return res.json(DEFAULT_EXPORT_CONFIG);
      }
      const merged = {
        ...DEFAULT_EXPORT_CONFIG,
        ...stored,
        overview: { ...DEFAULT_EXPORT_CONFIG.overview, ...(stored.overview ?? {}) },
        statements: { ...DEFAULT_EXPORT_CONFIG.statements, ...(stored.statements ?? {}) },
        analysis: { ...DEFAULT_EXPORT_CONFIG.analysis, ...(stored.analysis ?? {}) },
      };
      res.json(merged);
    } catch (error) {
      logAndSendError(res, "Failed to fetch export config", error);
    }
  });

  app.put("/api/admin/export-config", requireAdmin, async (req, res) => {
    try {
      const parsed = exportConfigSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid export config", details: parsed.error.flatten() });
      }
      const ga = await storage.getGlobalAssumptions();
      if (!ga) return res.status(404).json({ error: "No global assumptions found" });
      const current = (ga.exportConfig as typeof DEFAULT_EXPORT_CONFIG) ?? DEFAULT_EXPORT_CONFIG;
      const incoming = parsed.data;
      const merged = {
        ...current,
        ...incoming,
        overview: { ...current.overview, ...(incoming.overview ?? {}) },
        statements: { ...current.statements, ...(incoming.statements ?? {}) },
        analysis: { ...current.analysis, ...(incoming.analysis ?? {}) },
      };
      await storage.upsertGlobalAssumptions({ exportConfig: merged } as InsertGlobalAssumptions);
      res.json(merged);
    } catch (error) {
      logAndSendError(res, "Failed to save export config", error);
    }
  });
}
