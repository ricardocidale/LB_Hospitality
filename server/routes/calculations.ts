import type { Express } from "express";
import { storage } from "../storage";
import { requireChecker, requireAuth } from "../auth";
import { runIndependentVerification } from "../calculationChecker";
import { logActivity } from "./helpers";
import * as calcSchemas from "../../calc/shared/schemas";
import { computeDCF } from "../../calc/returns/dcf-npv";
import { buildIRRVector } from "../../calc/returns/irr-vector";
import { computeEquityMultiple } from "../../calc/returns/equity-multiple";
import { computeExitValuation } from "../../calc/returns/exit-valuation";
import { validateFinancialIdentities } from "../../calc/validation/financial-identities";
import { checkFundingGates } from "../../calc/validation/funding-gates";
import { reconcileSchedule } from "../../calc/validation/schedule-reconcile";
import { checkAssumptionConsistency } from "../../calc/validation/assumption-consistency";
import { verifyExport } from "../../calc/validation/export-verification";
import { consolidateStatements } from "../../calc/analysis/consolidation";
import { compareScenarios } from "../../calc/analysis/scenario-compare";
import { computeBreakEven } from "../../calc/analysis/break-even";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";
import OpenAI from "openai";

export function register(app: Express) {
  // ────────────────────────────────────────────────────────────
  // CALCULATION ENDPOINTS
  // POST /api/calc/* — modular financial calculation endpoints
  // ────────────────────────────────────────────────────────────

  app.post("/api/verification/run", requireChecker, async (req, res) => {
    try {
      const { clientResults } = req.body;
      const properties = await storage.getAllProperties(req.user!.id);
      const globalAssumptions = await storage.getGlobalAssumptions(req.user!.id);

      if (!globalAssumptions) {
        return res.status(400).json({ error: "Global assumptions not found" });
      }

      const report = runIndependentVerification(
        properties,
        globalAssumptions,
        clientResults
      );

      const run = await storage.createVerificationRun({
        userId: req.user!.id,
        passed: report.summary.totalPassed,
        failed: report.summary.totalFailed,
        totalChecks: report.summary.totalChecks,
        auditOpinion: report.summary.auditOpinion,
        overallStatus: report.summary.overallStatus,
        results: report as any,
      });

      logActivity(req, "run-verification", "verification", run.id, `Audit ${run.id}: ${run.auditOpinion}`);
      res.json(run);
    } catch (error) {
      console.error("Verification run error:", error);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  app.get("/api/verification/history", requireChecker, async (req, res) => {
    try {
      const history = await storage.getVerificationRuns(50);
      res.json(history);
    } catch (error) {
      console.error("Error fetching verification history:", error);
      res.status(500).json({ error: "Failed to fetch verification history" });
    }
  });

  app.get("/api/verification/runs/:id", requireChecker, async (req, res) => {
    try {
      const run = await storage.getVerificationRun(Number(req.params.id));
      if (!run) return res.status(404).json({ error: "Run not found" });
      res.json(run);
    } catch (error) {
      console.error("Error fetching verification run:", error);
      res.status(500).json({ error: "Failed to fetch verification run" });
    }
  });

  app.post("/api/verification/ai-review", requireChecker, async (req, res) => {
    try {
      const history = await storage.getVerificationRuns(1);
      if (!history.length) {
        return res.status(400).json({ error: "No verification runs found. Run verification first." });
      }
      const latestRun = await storage.getVerificationRun(history[0].id);
      if (!latestRun) {
        return res.status(404).json({ error: "Verification run not found" });
      }

      const globalAssumptions = await storage.getGlobalAssumptions(req.user!.id);
      const llmModel = globalAssumptions?.marcelaLlmModel || "gpt-4.1";

      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const results = latestRun.results as any;
      const summaryText = JSON.stringify({
        auditOpinion: results?.summary?.auditOpinion,
        overallStatus: results?.summary?.overallStatus,
        totalChecks: results?.summary?.totalChecks,
        totalPassed: results?.summary?.totalPassed,
        totalFailed: results?.summary?.totalFailed,
        criticalIssues: results?.summary?.criticalIssues,
        materialIssues: results?.summary?.materialIssues,
        propertyCount: results?.propertiesChecked,
        failedChecks: results?.propertyResults
          ?.flatMap((p: any) => p.checks?.filter((c: any) => !c.passed).map((c: any) => ({
            property: p.propertyName,
            metric: c.metric,
            gaapRef: c.gaapRef,
            variance: c.variancePct,
            severity: c.severity,
          })) ?? []) ?? [],
        companyFailures: results?.companyChecks?.filter((c: any) => !c.passed) ?? [],
        consolidatedFailures: results?.consolidatedChecks?.filter((c: any) => !c.passed) ?? [],
      }, null, 2);

      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      });

      const stream = await openai.chat.completions.create({
        model: llmModel,
        stream: true,
        max_tokens: 2048,
        messages: [
          {
            role: "system",
            content: "You are Marcela, a GAAP financial auditor for Hospitality Business Group. Write a concise narrative review of the verification results below. Use professional audit language. Highlight any failures, their severity, and recommend next steps. If the opinion is UNQUALIFIED, confirm the financials are fairly stated. Keep the review under 500 words.",
          },
          {
            role: "user",
            content: `Here are the latest verification results:\n\n${summaryText}`,
          },
        ],
      });

      for await (const chunk of stream) {
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error: any) {
      console.error("AI verification review error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "AI review failed" });
      } else {
        res.end();
      }
    }
  });

  app.get("/api/verification/design-check", requireChecker, async (_req, res) => {
    try {
      const fs = await import("fs/promises");
      const path = await import("path");

      const clientDir = path.resolve(import.meta.dirname, "../../client/src");
      const checks: Array<{ category: string; rule: string; status: "pass" | "fail" | "warning"; details: string }> = [];

      const scanDir = async (dir: string): Promise<string[]> => {
        const files: string[] = [];
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              files.push(...await scanDir(fullPath));
            } else if (entry.name.endsWith(".tsx")) {
              files.push(fullPath);
            }
          }
        } catch { /* ignore unreadable dirs */ }
        return files;
      }

      const tsxFiles = await scanDir(clientDir);
      let totalTestIds = 0;
      let filesWithTestIds = 0;
      let filesWithoutTestIds = 0;
      const pageFiles: string[] = [];
      const componentFiles: string[] = [];

      for (const file of tsxFiles) {
        const content = await fs.readFile(file, "utf-8");
        const testIdCount = (content.match(/data-testid/g) || []).length;
        totalTestIds += testIdCount;

        const relPath = path.relative(clientDir, file);
        const isPage = relPath.startsWith("pages/");
        const isComponent = relPath.startsWith("components/");

        if (isPage) pageFiles.push(relPath);
        if (isComponent) componentFiles.push(relPath);

        if (testIdCount > 0) {
          filesWithTestIds++;
        } else if (isPage || isComponent) {
          filesWithoutTestIds++;
          checks.push({
            category: "Test Coverage",
            rule: "data-testid required on interactive elements",
            status: "warning",
            details: `${relPath} has no data-testid attributes`,
          });
        }
      }

      checks.push({
        category: "Test Coverage",
        rule: "data-testid attribute coverage",
        status: totalTestIds > 100 ? "pass" : totalTestIds > 50 ? "warning" : "fail",
        details: `${totalTestIds} data-testid attributes across ${filesWithTestIds} files`,
      });

      checks.push({
        category: "Component Structure",
        rule: "Page count",
        status: pageFiles.length > 0 ? "pass" : "fail",
        details: `${pageFiles.length} page components found`,
      });

      checks.push({
        category: "Component Structure",
        rule: "Component count",
        status: componentFiles.length > 10 ? "pass" : "warning",
        details: `${componentFiles.length} component files found`,
      });

      const passed = checks.filter(c => c.status === "pass").length;
      const failed = checks.filter(c => c.status === "fail").length;
      const warnings = checks.filter(c => c.status === "warning").length;

      res.json({
        timestamp: new Date().toISOString(),
        totalChecks: checks.length,
        passed,
        failed,
        warnings,
        overallStatus: failed > 0 ? "FAIL" : warnings > 3 ? "WARNING" : "PASS",
        checks,
      });
    } catch (error: any) {
      console.error("Design check error:", error);
      res.status(500).json({ error: "Design check failed" });
    }
  });

  app.post("/api/calc/dcf", requireAuth, async (req, res) => {
    try {
      const validation = calcSchemas.dcfSchema.safeParse(req.body);
      if (!validation.success) return res.status(400).json({ error: fromZodError(validation.error).message });
      const result = computeDCF(validation.data as any);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "DCF calculation failed" });
    }
  });

  app.post("/api/calc/irr-vector", requireAuth, async (req, res) => {
    try {
      const validation = calcSchemas.irrVectorSchema.safeParse(req.body);
      if (!validation.success) return res.status(400).json({ error: fromZodError(validation.error).message });
      const result = buildIRRVector(validation.data as any);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "IRR calculation failed" });
    }
  });

  app.post("/api/calc/equity-multiple", requireAuth, async (req, res) => {
    try {
      const result = computeEquityMultiple(req.body);
      res.json({ equityMultiple: result });
    } catch (error) {
      res.status(500).json({ error: "Equity multiple calculation failed" });
    }
  });

  app.post("/api/calc/exit-valuation", requireAuth, async (req, res) => {
    try {
      const validation = calcSchemas.exitValuationSchema.safeParse(req.body);
      if (!validation.success) return res.status(400).json({ error: fromZodError(validation.error).message });
      const result = computeExitValuation(validation.data as any);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Exit valuation failed" });
    }
  });

  app.post("/api/calc/validate-identities", requireChecker, async (req, res) => {
    try {
      const result = validateFinancialIdentities(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Identity validation failed" });
    }
  });

  app.post("/api/calc/check-funding-gates", requireChecker, async (req, res) => {
    try {
      const result = checkFundingGates(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Funding gate check failed" });
    }
  });

  app.post("/api/calc/reconcile-schedule", requireChecker, async (req, res) => {
    try {
      const result = reconcileSchedule(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Schedule reconciliation failed" });
    }
  });

  app.post("/api/calc/check-consistency", requireChecker, async (req, res) => {
    try {
      const result = checkAssumptionConsistency(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Consistency check failed" });
    }
  });

  app.post("/api/calc/verify-export", requireChecker, async (req, res) => {
    try {
      const result = verifyExport(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Export verification failed" });
    }
  });

  app.post("/api/calc/consolidate", requireAuth, async (req, res) => {
    try {
      const result = consolidateStatements(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Consolidation failed" });
    }
  });

  app.post("/api/calc/compare-scenarios", requireAuth, async (req, res) => {
    try {
      const result = compareScenarios(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Scenario comparison failed" });
    }
  });

  app.post("/api/calc/break-even", requireAuth, async (req, res) => {
    try {
      const result = computeBreakEven(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Break-even analysis failed" });
    }
  });
}
