import { type Express, type Request, type Response, type NextFunction } from "express";
import { storage } from "../storage";
import { computePropertyMetrics } from "../../calc/research/property-metrics";
import {
  DEFAULT_EXIT_CAP_RATE,
  DEFAULT_COMMISSION_RATE,
} from "../../shared/constants";

import {
  DEFAULT_LTV,
  DEFAULT_INTEREST_RATE,
  DEFAULT_TERM_YEARS,
} from "../../shared/constants";

const MARCELA_TOOLS_SECRET = process.env.MARCELA_TOOLS_SECRET;
if (!MARCELA_TOOLS_SECRET) {
  console.warn("[marcela-tools] MARCELA_TOOLS_SECRET env var not set — tools endpoint will reject all requests");
}

function verifyToolsAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["x-marcela-tools-secret"] || req.headers["authorization"];
  const token = typeof authHeader === "string"
    ? authHeader.replace(/^Bearer\s+/i, "")
    : "";

  if (MARCELA_TOOLS_SECRET && token === MARCELA_TOOLS_SECRET) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}

function sendToolResponse(res: Response, data: unknown) {
  res.json(data);
}

function sendToolError(res: Response, message: string, status = 500) {
  res.status(status).json({ error: message });
}

/** Compute financial snapshot for a property using the deterministic engine */
function computeSnapshot(p: any) {
  const metrics = computePropertyMetrics({
    room_count: p.roomCount,
    adr: p.startAdr,
    occupancy: p.maxOccupancy,
    cost_rate_rooms: p.costRateRooms,
    cost_rate_fb: p.costRateFB,
    cost_rate_admin: p.costRateAdmin,
    cost_rate_marketing: p.costRateMarketing,
    cost_rate_property_ops: p.costRatePropertyOps,
    cost_rate_utilities: p.costRateUtilities,
    cost_rate_ffe: p.costRateFFE,
    cost_rate_other: p.costRateOther,
    rev_share_events: p.revShareEvents,
    rev_share_fb: p.revShareFB,
    rev_share_other: p.revShareOther,
    catering_boost_pct: p.cateringBoostPercent,
  });

  const exitCapRate = p.exitCapRate ?? DEFAULT_EXIT_CAP_RATE;
  const impliedValue = metrics.annual_noi > 0 ? Math.round(metrics.annual_noi / exitCapRate) : 0;
  const totalInvestment = (p.purchasePrice || 0) + (p.buildingImprovements || 0) + (p.preOpeningCosts || 0) + (p.operatingReserve || 0);

  return { metrics, exitCapRate, impliedValue, totalInvestment };
}

export function register(app: Express) {
  app.get("/api/marcela-tools/properties", verifyToolsAuth, async (_req: Request, res: Response) => {
    try {
      const properties = await storage.getAllProperties();
      const summary = properties.map((p: any) => {
        const { metrics, totalInvestment } = computeSnapshot(p);
        return {
          id: p.id,
          name: p.name,
          location: p.location,
          market: p.market,
          roomCount: p.roomCount,
          startAdr: p.startAdr,
          maxOccupancy: Math.round(p.maxOccupancy * 100) + "%",
          type: p.type,
          purchasePrice: p.purchasePrice,
          totalInvestment,
          revpar: metrics.revpar,
          annualRevenue: metrics.annual_total_revenue,
          annualNOI: metrics.annual_noi,
          noiMargin: metrics.noi_margin_pct + "%",
          status: p.status,
        };
      });
      sendToolResponse(res, { properties: summary, count: summary.length });
    } catch (error: any) {
      console.error("Marcela tool error (properties):", error);
      sendToolError(res, "Failed to fetch properties");
    }
  });

  app.get("/api/marcela-tools/property/:id", verifyToolsAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
      if (isNaN(id)) return sendToolError(res, "Invalid property ID", 400);

      const property = await storage.getProperty(id);
      if (!property) return sendToolError(res, "Property not found", 404);

      const p = property as any;
      const { metrics, exitCapRate, impliedValue, totalInvestment } = computeSnapshot(p);

      // Compute debt metrics if financed
      let debtMetrics: Record<string, any> = { financed: false };
      if (p.type === "Financed") {
        const ltv = p.acquisitionLTV ?? DEFAULT_LTV;
        const rate = p.acquisitionInterestRate ?? DEFAULT_INTEREST_RATE;
        const term = p.acquisitionTermYears ?? DEFAULT_TERM_YEARS;
        const loanAmount = Math.round(p.purchasePrice * ltv);
        const monthlyRate = rate / 12;
        const nPayments = term * 12;
        const monthlyPayment = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, nPayments) / (Math.pow(1 + monthlyRate, nPayments) - 1);
        const annualDebtService = Math.round(monthlyPayment * 12);
        const dscr = annualDebtService > 0 ? Math.round((metrics.annual_noi / annualDebtService) * 100) / 100 : 0;
        debtMetrics = { financed: true, ltv: Math.round(ltv * 100) + "%", loanAmount, interestRate: Math.round(rate * 100 * 100) / 100 + "%", termYears: term, annualDebtService, dscr };
      }

      sendToolResponse(res, {
        id: p.id,
        name: p.name,
        location: p.location,
        market: p.market,
        roomCount: p.roomCount,
        startAdr: p.startAdr,
        adrGrowthRate: Math.round(p.adrGrowthRate * 100) + "%",
        startOccupancy: Math.round(p.startOccupancy * 100) + "%",
        maxOccupancy: Math.round(p.maxOccupancy * 100) + "%",
        type: p.type,
        purchasePrice: p.purchasePrice,
        buildingImprovements: p.buildingImprovements,
        operatingReserve: p.operatingReserve,
        totalInvestment,
        acquisitionDate: p.acquisitionDate,
        operationsStartDate: p.operationsStartDate,
        financials: {
          revpar: metrics.revpar,
          annualRoomRevenue: metrics.annual_room_revenue,
          annualTotalRevenue: metrics.annual_total_revenue,
          revenueBreakdown: metrics.revenue_breakdown,
          annualGOP: metrics.annual_gop,
          gopMargin: metrics.gop_margin_pct + "%",
          annualNOI: metrics.annual_noi,
          noiMargin: metrics.noi_margin_pct + "%",
          revenuePerRoom: metrics.revenue_per_room,
          costPerRoom: metrics.cost_per_room,
        },
        valuation: {
          exitCapRate: Math.round(exitCapRate * 100 * 10) / 10 + "%",
          impliedValue,
          dispositionCommission: Math.round((p.dispositionCommission ?? DEFAULT_COMMISSION_RATE) * 100) + "%",
        },
        debt: debtMetrics,
        status: p.status,
      });
    } catch (error: any) {
      console.error("Marcela tool error (property detail):", error);
      sendToolError(res, "Failed to fetch property");
    }
  });

  app.get("/api/marcela-tools/portfolio-summary", verifyToolsAuth, async (_req: Request, res: Response) => {
    try {
      const properties = await storage.getAllProperties();
      const ga = await storage.getGlobalAssumptions();

      let totalRooms = 0;
      let totalInvestment = 0;
      let totalAnnualRevenue = 0;
      let totalAnnualNOI = 0;
      let weightedAdr = 0;
      let weightedOccupancy = 0;

      for (const p of properties as any[]) {
        const { metrics, totalInvestment: propInvestment } = computeSnapshot(p);
        const rooms = p.roomCount || 0;

        totalRooms += rooms;
        totalInvestment += propInvestment;
        totalAnnualRevenue += metrics.annual_total_revenue;
        totalAnnualNOI += metrics.annual_noi;
        weightedAdr += p.startAdr * rooms;
        weightedOccupancy += p.maxOccupancy * rooms;
      }

      const avgAdr = totalRooms > 0 ? Math.round(weightedAdr / totalRooms * 100) / 100 : 0;
      const avgOccupancy = totalRooms > 0 ? weightedOccupancy / totalRooms : 0;
      const avgRevpar = Math.round(avgAdr * avgOccupancy * 100) / 100;
      const portfolioNOIMargin = totalAnnualRevenue > 0 ? Math.round(totalAnnualNOI / totalAnnualRevenue * 1000) / 10 : 0;

      sendToolResponse(res, {
        companyName: ga?.companyName || "Hospitality Business Group",
        projectionYears: ga?.projectionYears || 10,
        propertyCount: properties.length,
        totalRooms,
        totalInvestment: Math.round(totalInvestment),
        totalAnnualRevenue: Math.round(totalAnnualRevenue),
        totalAnnualNOI: Math.round(totalAnnualNOI),
        portfolioNOIMargin: portfolioNOIMargin + "%",
        weightedAvgAdr: avgAdr,
        weightedAvgOccupancy: Math.round(avgOccupancy * 100) + "%",
        weightedAvgRevpar: avgRevpar,
      });
    } catch (error: any) {
      console.error("Marcela tool error (portfolio summary):", error);
      sendToolError(res, "Failed to compute portfolio summary");
    }
  });

  app.get("/api/marcela-tools/scenarios", verifyToolsAuth, async (_req: Request, res: Response) => {
    try {
      const scenarios = await storage.getScenariosByUser(1);
      const summary = scenarios.map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description || "",
        createdAt: s.createdAt || "",
      }));
      sendToolResponse(res, { scenarios: summary, count: summary.length });
    } catch (error: any) {
      console.error("Marcela tool error (scenarios):", error);
      sendToolError(res, "Failed to fetch scenarios");
    }
  });

  app.get("/api/marcela-tools/global-assumptions", verifyToolsAuth, async (_req: Request, res: Response) => {
    try {
      const ga = await storage.getGlobalAssumptions();
      if (!ga) return sendToolError(res, "No global assumptions found", 404);

      sendToolResponse(res, {
        companyName: ga.companyName,
        modelStartDate: ga.modelStartDate,
        projectionYears: ga.projectionYears,
        companyOpsStartDate: ga.companyOpsStartDate,
        inflationRate: Math.round(ga.inflationRate * 100) + "%",
        baseManagementFee: Math.round(ga.baseManagementFee * 100) + "%",
        incentiveManagementFee: Math.round(ga.incentiveManagementFee * 100) + "%",
        exitCapRate: ga.exitCapRate ? Math.round(ga.exitCapRate * 100 * 10) / 10 + "%" : "8.5%",
        staffSalary: ga.staffSalary,
        fundingSourceLabel: (ga as any).fundingSourceLabel || "Funding Vehicle",
        safeTranche1Amount: ga.safeTranche1Amount,
        safeTranche1Date: ga.safeTranche1Date,
        safeTranche2Amount: ga.safeTranche2Amount,
        safeTranche2Date: ga.safeTranche2Date,
      });
    } catch (error: any) {
      console.error("Marcela tool error (global assumptions):", error);
      sendToolError(res, "Failed to fetch global assumptions");
    }
  });

  app.get("/api/marcela-tools/navigation", verifyToolsAuth, (_req: Request, res: Response) => {
    sendToolResponse(res, {
      pages: [
        { path: "/", name: "Dashboard", description: "Overview of portfolio performance and key metrics" },
        { path: "/portfolio", name: "Portfolio", description: "Map and list view of all properties" },
        { path: "/company", name: "Company", description: "Company-level financial assumptions and settings" },
        { path: "/company/assumptions", name: "Company Assumptions", description: "Edit global financial model parameters" },
        { path: "/analysis", name: "Analysis", description: "Financial analysis, sensitivity, financing, and comparisons" },
        { path: "/scenarios", name: "Scenarios", description: "Saved portfolio snapshots for what-if analysis" },
        { path: "/property-finder", name: "Property Finder", description: "Search for new hotel acquisition opportunities" },
        { path: "/help", name: "Help", description: "User manual, checker manual, and guided tour" },
        { path: "/settings", name: "Settings", description: "User preferences and display settings" },
        { path: "/profile", name: "Profile", description: "User profile and account settings" },
        { path: "/admin", name: "Admin", description: "Admin settings (admin only)" },
      ],
    });
  });
}
