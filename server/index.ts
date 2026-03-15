/**
 * server/index.ts — Application Entry Point
 *
 * This is the main startup file for the Express server. It wires together every
 * layer of the backend in the correct order:
 *
 *   1. Security headers (CSP, HSTS, X-Frame-Options, etc.)
 *   2. Body parsing (JSON + URL-encoded, with raw body preserved for webhooks)
 *   3. Cookie-based session authentication middleware
 *   4. Default-deny authorization: every /api/ route requires a valid session
 *      unless it's on the explicit PUBLIC_API_PATHS whitelist
 *   5. Request logging (method, path, status, duration) for all /api/ calls
 *   6. Seed data: admin user, logos, companies, user groups, fee categories,
 *      and missing market research records are created on first boot
 *   7. Route registration: image routes, API routes, object storage, chat, etc.
 *   8. Error handler (hides internal details in production)
 *   9. Static file serving (production) or Vite dev server (development)
 *  10. Periodic cleanup: expired sessions and stale rate-limit entries every hour
 *
 * The server listens on the PORT environment variable (default 5000). This single
 * port serves both the API and the client SPA — it is the only port not firewalled.
 */
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import compression from "compression";
import { registerRoutes } from "./routes";
import { registerImageRoutes } from "./replit_integrations/image";
import { serveStatic } from "./static";
import { createServer } from "http";
import { authMiddleware, requireAuth, seedAdminUser, cleanupRateLimitMaps } from "./auth";
import { storage } from "./storage";
import { log as serverLog } from "./logger";
import { initSentry, sentryRequestHandler, sentryErrorHandler, setupSentryExpressErrorHandler } from "./sentry";

initSentry();

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.set("trust proxy", 1); // Replit runs behind a reverse proxy
app.use(sentryRequestHandler());
app.use(compression({ threshold: 1024 })); // Compress responses > 1KB
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(self), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.plaid.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://api.elevenlabs.io wss://api.elevenlabs.io https://*.ingest.sentry.io https://*.sentry.io https://us.i.posthog.com https://app.posthog.com https://*.plaid.com; media-src 'self' blob:; frame-ancestors 'self' https://*.replit.dev https://*.replit.app https://*.repl.co");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));
app.use(authMiddleware);

// Default-deny: require authentication on all /api/ routes unless explicitly public
const PUBLIC_API_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/admin-login",
  "/api/auth/dev-login",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/auth/google",
  "/api/auth/google/callback",
  "/api/twilio/voice/incoming",
  "/api/twilio/voice/status",
  "/api/twilio/sms/incoming",
  "/api/documents/webhook/docusign",
]);

const PUBLIC_API_PREFIXES = [
  "/api/marcela-tools/",
  "/api/letter-logo/",
];

app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.path.startsWith("/api")) return next();
  if (PUBLIC_API_PATHS.has(req.path)) return next();
  if (PUBLIC_API_PREFIXES.some(p => req.path.startsWith(p))) return next();
  return requireAuth(req, res, next);
});

export function log(message: string, source = "express") {
  serverLog(message, source);
}

// Cache-Control for stable, rarely-changing GET endpoints
const CACHEABLE_PATHS = new Set([
  "/api/logos",
  "/api/design-themes",
  "/api/companies",
  "/api/documents/templates",
  "/api/documents/docusign/status",
]);
app.use((req, res, next) => {
  if (req.method === "GET" && CACHEABLE_PATHS.has(req.path)) {
    res.setHeader("Cache-Control", "private, max-age=300, stale-while-revalidate=600");
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      const responseSize = res.getHeader("content-length") || "unknown";
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms :: ${responseSize} bytes`);
    }
  });

  next();
});

(async () => {
  // Sequential: prod-sync-001 must run before 002
  const { runProdSync001 } = await import("./migrations/prod-sync-001");
  await runProdSync001();
  const { runProdSync002 } = await import("./migrations/prod-sync-002");
  await runProdSync002();

  // Independent schema migrations — run in parallel for faster startup
  const [
    { runMigration: runResearchConfig001 },
    { runMigration: runInflationPerEntity001 },
    { runMigration: runCompaniesTheme001 },
    { runIcpConfigMigration },
    { runMarcelaVoice001 },
    { runPropertyPhotos001 },
    { runPlaid001 },
    { runDocuments001 },
    { runCompositeIndexes001 },
    { runMigration: runAutoResearchRefresh001 },
    { runFundingInterest001 },
  ] = await Promise.all([
    import("./migrations/research-config-001"),
    import("./migrations/inflation-per-entity-001"),
    import("./migrations/companies-theme-001"),
    import("./migrations/icp-config-001"),
    import("./migrations/marcela-voice-001"),
    import("./migrations/property-photos-001"),
    import("./migrations/plaid-001"),
    import("./migrations/documents-001"),
    import("./migrations/composite-indexes-001"),
    import("./migrations/auto-research-refresh-001"),
    import("./migrations/funding-interest-001"),
  ]);
  await Promise.all([
    runResearchConfig001(),
    runInflationPerEntity001(),
    runCompaniesTheme001(),
    runIcpConfigMigration(),
    runMarcelaVoice001(),
    runPropertyPhotos001(),
    runPlaid001(),
    runDocuments001(),
    runCompositeIndexes001(),
    runAutoResearchRefresh001(),
    runFundingInterest001(),
  ]);

  // Notification logs schema fix must run before FK indexes
  const { runNotificationLogs001 } = await import("./migrations/notification-logs-001");
  await runNotificationLogs001();

  // FK indexes must run after all table-creating migrations complete
  const { runFkIndexes001 } = await import("./migrations/fk-indexes-001");
  await runFkIndexes001();

  await seedAdminUser(); // Must complete first — users are FK dependencies
  const { seedMissingMarketResearch, seedDefaultLogos, seedUserGroups, seedCompanies, seedFeeCategories, seedServiceTemplates, seedPropertyPhotos } = await import("./seed");
  const { seedMarketRates } = await import("./seeds/market-rates");
  const { seedUserCompanyAssignments } = await import("./seeds/users");

  // Independent seeds can run in parallel for faster startup
  await Promise.all([
    seedMissingMarketResearch(),
    seedMarketRates(),
    seedDefaultLogos(),
    seedUserGroups(),
    seedFeeCategories(),
    seedServiceTemplates(),
    seedPropertyPhotos(),
  ]);
  // These depend on groups/companies existing
  await seedCompanies();
  await seedUserCompanyAssignments();
  registerImageRoutes(app);
  const { registerGoogleAuthRoutes } = await import("./routes/google-auth");
  registerGoogleAuthRoutes(app);
  await registerRoutes(httpServer, app);

  setupSentryExpressErrorHandler(app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = process.env.NODE_ENV === "production" && status >= 500
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ error: message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);

      // Refresh stale market rates every 5 minutes
      setInterval(async () => {
        try {
          const { refreshAllStaleRates } = await import("./data/marketRates");
          const refreshed = await refreshAllStaleRates();
          if (refreshed > 0) log(`Refreshed ${refreshed} stale market rates`);
        } catch (err) {
          console.error("Market rate refresh error:", err);
        }
        try {
          const { getMarketIntelligenceAggregator } = await import("./services/MarketIntelligenceAggregator");
          const aggregator = getMarketIntelligenceAggregator();
          await aggregator.refreshFREDRates();
        } catch (err) {
          console.error("FRED market intelligence refresh error:", err);
        }
      }, 5 * 60 * 1000);

      // Clean expired sessions and stale rate-limit entries every hour
      setInterval(async () => {
        try {
          const sessions = await storage.deleteExpiredSessions();
          if (sessions > 0) log(`Cleaned ${sessions} expired sessions`);
          const rateLimits = cleanupRateLimitMaps();
          if (rateLimits > 0) log(`Cleaned ${rateLimits} stale rate-limit entries`);
        } catch (err) {
          console.error("Periodic cleanup error:", err);
        }
      }, 60 * 60 * 1000);

      // Invalidate stale property-level MI cache daily so next research regen gets fresh data
      setInterval(async () => {
        try {
          const { cache } = await import("./cache");
          const invalidated = await cache.invalidate("mi:property:*");
          if (invalidated > 0) log(`Invalidated ${invalidated} stale MI cache entries`);
        } catch (err) {
          console.error("MI cache invalidation error:", err);
        }
      }, 24 * 60 * 60 * 1000);
    },
  );
})();
