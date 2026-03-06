import { type Express, type Request, type Response, type NextFunction } from "express";
import { storage } from "../storage";

const MARCELA_TOOLS_SECRET = process.env.MARCELA_TOOLS_SECRET || "marcela-server-tools-key";

function verifyToolsAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["x-marcela-tools-secret"] || req.headers["authorization"];
  const token = typeof authHeader === "string"
    ? authHeader.replace(/^Bearer\s+/i, "")
    : "";

  if (token === MARCELA_TOOLS_SECRET) {
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

export function register(app: Express) {
  app.get("/api/marcela-tools/properties", verifyToolsAuth, async (_req: Request, res: Response) => {
    try {
      const properties = await storage.getAllProperties();
      const summary = properties.map((p: any) => ({
        id: p.id,
        name: p.propertyName || p.property_name || "Unnamed",
        location: p.propertyLocation || p.property_location || "",
        roomCount: p.roomCount || p.room_count || 0,
        adr: p.adr || 0,
        occupancy: p.stabilizedOccupancy || p.stabilized_occupancy || 0,
        totalInvestment: p.totalProjectCost || p.total_project_cost || 0,
        status: p.fundingStage || p.funding_stage || "unknown",
      }));
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
      sendToolResponse(res, {
        id: p.id,
        name: p.propertyName || p.property_name || "Unnamed",
        location: p.propertyLocation || p.property_location || "",
        roomCount: p.roomCount || p.room_count || 0,
        adr: p.adr || 0,
        occupancy: p.stabilizedOccupancy || p.stabilized_occupancy || 0,
        totalInvestment: p.totalProjectCost || p.total_project_cost || 0,
        revpar: p.adr ? (p.adr * (p.stabilizedOccupancy || p.stabilized_occupancy || 0) / 100) : 0,
        grossRevenue: p.grossOperatingRevenue || p.gross_operating_revenue || 0,
        noi: p.netOperatingIncome || p.net_operating_income || 0,
        capRate: p.capRate || p.cap_rate || 0,
        irr: p.targetIrr || p.target_irr || 0,
        equityMultiple: p.targetEquityMultiple || p.target_equity_multiple || 0,
        holdPeriod: p.holdPeriod || p.hold_period || 0,
        fundingStage: p.fundingStage || p.funding_stage || "unknown",
        managementFeeRate: p.managementFeeRate || p.management_fee_rate || 0,
        debtServiceCoverage: p.debtServiceCoverageRatio || p.debt_service_coverage_ratio || 0,
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
      let weightedOccupancy = 0;
      let weightedAdr = 0;

      for (const p of properties as any[]) {
        const rooms = p.roomCount || p.room_count || 0;
        const adr = p.adr || 0;
        const occ = p.stabilizedOccupancy || p.stabilized_occupancy || 0;
        const investment = p.totalProjectCost || p.total_project_cost || 0;

        totalRooms += rooms;
        totalInvestment += investment;
        weightedOccupancy += occ * rooms;
        weightedAdr += adr * rooms;
      }

      const avgOccupancy = totalRooms > 0 ? weightedOccupancy / totalRooms : 0;
      const avgAdr = totalRooms > 0 ? weightedAdr / totalRooms : 0;
      const avgRevpar = avgAdr * avgOccupancy / 100;

      sendToolResponse(res, {
        propertyCount: properties.length,
        totalRooms,
        totalInvestment: Math.round(totalInvestment),
        averageOccupancy: Math.round(avgOccupancy * 10) / 10,
        averageAdr: Math.round(avgAdr * 100) / 100,
        averageRevpar: Math.round(avgRevpar * 100) / 100,
        companyName: (ga as any)?.companyName || (ga as any)?.company_name || "Hospitality Business Group",
      });
    } catch (error: any) {
      console.error("Marcela tool error (portfolio summary):", error);
      sendToolError(res, "Failed to compute portfolio summary");
    }
  });

  app.get("/api/marcela-tools/scenarios", verifyToolsAuth, async (_req: Request, res: Response) => {
    try {
      const scenarios = await storage.getScenariosByUser(1);
      const summary = (scenarios as any[]).map((s) => ({
        id: s.id,
        name: s.name || s.scenarioName || "Unnamed",
        description: s.description || "",
        createdAt: s.createdAt || s.created_at || "",
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

      const g = ga as any;
      sendToolResponse(res, {
        companyName: g.companyName || g.company_name || "",
        discountRate: g.discountRate || g.discount_rate || 0,
        inflationRate: g.inflationRate || g.inflation_rate || 0,
        taxRate: g.taxRate || g.tax_rate || 0,
        defaultHoldPeriod: g.defaultHoldPeriod || g.default_hold_period || 0,
        defaultCapRate: g.defaultCapRate || g.default_cap_rate || 0,
        defaultManagementFee: g.defaultManagementFee || g.default_management_fee || 0,
        currency: g.currency || "USD",
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
