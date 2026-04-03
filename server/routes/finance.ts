import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { computePortfolioProjection } from "../finance/service";
import type { PropertyInput, GlobalInput } from "@/lib/financial/types";

const propertyInputSchema = z.object({
  operationsStartDate: z.string(),
  acquisitionDate: z.string().optional(),
  roomCount: z.number().int().positive(),
  startAdr: z.number().positive(),
  adrGrowthRate: z.number(),
  startOccupancy: z.number().min(0).max(1),
  maxOccupancy: z.number().min(0).max(1),
  occupancyRampMonths: z.number().int().min(1),
  occupancyGrowthStep: z.number(),
  purchasePrice: z.number().nonnegative(),
  buildingImprovements: z.number().nullable().optional(),
  landValuePercent: z.number().nullable().optional(),
  type: z.string(),
  acquisitionLTV: z.number().nullable().optional(),
  acquisitionInterestRate: z.number().nullable().optional(),
  acquisitionTermYears: z.number().nullable().optional(),
  taxRate: z.number().nullable().optional(),
  inflationRate: z.number().nullable().optional(),
  willRefinance: z.string().nullable().optional(),
  refinanceDate: z.string().nullable().optional(),
  refinanceLTV: z.number().nullable().optional(),
  refinanceInterestRate: z.number().nullable().optional(),
  refinanceTermYears: z.number().nullable().optional(),
  refinanceClosingCostRate: z.number().nullable().optional(),
  exitCapRate: z.number().nullable().optional(),
  dispositionCommission: z.number().nullable().optional(),
  operatingReserve: z.number().nullable().optional(),
  refinanceYearsAfterAcquisition: z.number().nullable().optional(),
  costRateRooms: z.number(),
  costRateFB: z.number(),
  costRateAdmin: z.number(),
  costRateMarketing: z.number(),
  costRatePropertyOps: z.number(),
  costRateUtilities: z.number(),
  costRateTaxes: z.number(),
  costRateIT: z.number(),
  costRateFFE: z.number(),
  costRateOther: z.number(),
  costRateInsurance: z.number(),
  revShareEvents: z.number(),
  revShareFB: z.number(),
  revShareOther: z.number(),
  cateringBoostPercent: z.number().optional(),
  baseManagementFeeRate: z.number().optional(),
  incentiveManagementFeeRate: z.number().optional(),
  feeCategories: z.array(z.object({
    name: z.string(),
    rate: z.number(),
    isActive: z.boolean(),
  })).optional(),
  arDays: z.number().nullable().optional(),
  apDays: z.number().nullable().optional(),
  reinvestmentRate: z.number().nullable().optional(),
  dayCountConvention: z.string().nullable().optional(),
  escalationMethod: z.string().nullable().optional(),
  costSegEnabled: z.boolean().nullable().optional(),
  costSeg5yrPct: z.number().nullable().optional(),
  costSeg7yrPct: z.number().nullable().optional(),
  costSeg15yrPct: z.number().nullable().optional(),
  depreciationYears: z.number().nullable().optional(),
  id: z.number().optional(),
  name: z.string().optional(),
}).passthrough();

const globalInputSchema = z.object({
  modelStartDate: z.string(),
  projectionYears: z.number().optional(),
  companyOpsStartDate: z.string().optional(),
  fiscalYearStartMonth: z.number().optional(),
  inflationRate: z.number(),
  companyInflationRate: z.number().optional(),
  fixedCostEscalationRate: z.number().optional(),
  marketingRate: z.number(),
  debtAssumptions: z.object({
    interestRate: z.number(),
    amortizationYears: z.number(),
    acqLTV: z.number().optional(),
    refiLTV: z.number().optional(),
    refiClosingCostRate: z.number().optional(),
  }),
}).passthrough();

const computeRequestSchema = z.object({
  properties: z.array(propertyInputSchema).min(1),
  globalAssumptions: globalInputSchema,
  projectionYears: z.number().int().positive().max(30).optional(),
});

export function registerFinanceRoutes(router: Router): void {
  router.post("/api/finance/compute", async (req: Request, res: Response) => {
    try {
      const validation = computeRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid input",
          details: validation.error.issues.map(i => ({
            path: i.path.join("."),
            message: i.message,
          })),
        });
      }

      const { properties, globalAssumptions, projectionYears } = validation.data;

      const result = computePortfolioProjection({
        properties: properties as PropertyInput[],
        globalAssumptions: globalAssumptions as GlobalInput,
        projectionYears,
      });

      res.setHeader("X-Finance-Engine-Version", result.engineVersion);
      res.setHeader("X-Finance-Output-Hash", result.outputHash);

      return res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Server computation failed";
      console.error("[finance/compute] Error:", message);
      return res.status(500).json({ error: message });
    }
  });

  router.get("/api/finance/health", (_req: Request, res: Response) => {
    return res.json({
      status: "ok",
      engineVersion: "1.0.0",
      capabilities: ["portfolio-projection", "identity-validation"],
    });
  });
}
