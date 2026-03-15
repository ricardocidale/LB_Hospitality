import type { Express } from "express";
import { storage } from "../storage";
import { requireChecker, requireAuth } from "../auth";
import { runIndependentVerification } from "../calculationChecker";
import { logActivity, logAndSendError } from "./helpers";
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
import { getOpenAIClient } from "../ai/clients";

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
      logAndSendError(res, "Verification failed", error);
    }
  });

  app.get("/api/verification/history", requireChecker, async (req, res) => {
    try {
      const history = await storage.getVerificationRuns(50);
      res.json(history);
    } catch (error) {
      logAndSendError(res, "Failed to fetch verification history", error);
    }
  });

  app.get("/api/verification/runs/:id", requireChecker, async (req, res) => {
    try {
      const run = await storage.getVerificationRun(Number(req.params.id));
      if (!run) return res.status(404).json({ error: "Run not found" });
      res.json(run);
    } catch (error) {
      logAndSendError(res, "Failed to fetch verification run", error);
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

      const openai = getOpenAIClient();

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
      if (!res.headersSent) {
        logAndSendError(res, "AI review failed", error);
      } else {
        console.error("[ERROR] [calculations] AI verification review error:", error?.message || error);
        res.end();
      }
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
