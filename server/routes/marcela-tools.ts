import { type Express, type Request, type Response, type NextFunction } from "express";

const MARCELA_TOOLS_SECRET = process.env.MARCELA_TOOLS_SECRET;
if (!MARCELA_TOOLS_SECRET) {
  console.warn("[marcela-tools] MARCELA_TOOLS_SECRET env var not set — tools endpoint will reject all requests");
}

function verifyToolsAuth(req: Request, res: Response, next: NextFunction) {
  const { timingSafeEqual } = require("crypto");
  const authHeader = req.headers["x-marcela-tools-secret"] || req.headers["authorization"];
  const token = typeof authHeader === "string"
    ? authHeader.replace(/^Bearer\s+/i, "")
    : "";

  if (MARCELA_TOOLS_SECRET && token.length > 0) {
    try {
      const a = Buffer.from(token);
      const b = Buffer.from(MARCELA_TOOLS_SECRET);
      if (a.length === b.length && timingSafeEqual(a, b)) {
        return next();
      }
    } catch (_authErr) {
    }
  }
  res.status(401).json({ error: "Unauthorized" });
}

function sendToolResponse(res: Response, data: unknown) {
  res.json(data);
}

export function register(app: Express) {
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
