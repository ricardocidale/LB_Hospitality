import type { Express } from "express";
import { storage } from "../storage";
import { requireManagementAccess, requireAuth , getAuthUser } from "../auth";
import { updateScenarioSchema } from "@shared/schema";
import type { ComputedResultsSnapshot } from "@shared/schema";
import type {
  ScenarioGlobalAssumptionsSnapshot,
  ScenarioPropertySnapshot,
  ScenarioFeeCategorySnapshot,
  ScenarioPhotoSnapshot,
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";
import { logActivity, logAndSendError, createScenarioSchema, MAX_SCENARIOS_PER_USER, fullName } from "./helpers";
import { computeFullDiff, reconstructScenarioProperties } from "../scenarios/diff-engine";
import { computePortfolioProjection } from "../finance/service";
import { stableHash } from "../scenarios/stable-json";
import type { PropertyInput, GlobalInput } from "@engine/types";
import { logger } from "../logger";
import { invalidateComputeCache } from "../finance/cache";

function requireScenarioPermission(req: any, res: any, next: any) {
  if (!req.user) return res.status(401).json({ error: "Authentication required" });
  if (!req.user.canManageScenarios) {
    return res.status(403).json({ error: "Scenario management is disabled for your account" });
  }
  next();
}

export function register(app: Express) {
  app.get("/api/scenarios", requireAuth, async (req, res) => {
    try {
      const owned = await storage.getScenariosByUser(getAuthUser(req).id);
      const shared = await storage.getScenariosSharedWithUser(getAuthUser(req).id);

      const ownedWithAccess = owned.map(s => ({ ...s, accessType: "owned" as const, sharedByUserId: null, sharedByName: null }));
      res.json([...ownedWithAccess, ...shared]);
    } catch (error) {
      logAndSendError(res, "Failed to fetch scenarios", error);
    }
  });

  app.post("/api/scenarios", requireManagementAccess, requireScenarioPermission, async (req, res) => {
    try {
      const validation = createScenarioSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }

      const existing = await storage.getScenariosByUser(getAuthUser(req).id);
      if (existing.length >= MAX_SCENARIOS_PER_USER) {
        return res.status(400).json({ error: `Maximum of ${MAX_SCENARIOS_PER_USER} scenarios allowed` });
      }

      const assumptions = await storage.getGlobalAssumptions(getAuthUser(req).id);
      const properties = await storage.getAllProperties(getAuthUser(req).id);
      
      const propertyIds = properties.map(p => p.id);
      const [feeCatsByPropId, photosByPropId] = await Promise.all([
        storage.getFeeCategoriesByProperties(propertyIds),
        storage.getPhotosByProperties(propertyIds),
      ]);

      const propertyFeeCategories: Record<string, ScenarioFeeCategorySnapshot[]> = {};
      const propertyPhotos: Record<string, ScenarioPhotoSnapshot[]> = {};
      for (const p of properties) {
        propertyFeeCategories[p.name] = (feeCatsByPropId[p.id] || []) as ScenarioFeeCategorySnapshot[];
        propertyPhotos[p.name] = (photosByPropId[p.id] || []) as ScenarioPhotoSnapshot[];
      }

      const liveAssumptions = await storage.getGlobalAssumptions(getAuthUser(req).id);
      const liveProperties = await storage.getAllProperties(getAuthUser(req).id);
      const scenarioGA: ScenarioGlobalAssumptionsSnapshot = (assumptions || {}) as ScenarioGlobalAssumptionsSnapshot;
      const scenarioProps: ScenarioPropertySnapshot[] = (properties || []) as ScenarioPropertySnapshot[];
      const diffResult = computeFullDiff(
        (liveAssumptions || {}) as ScenarioGlobalAssumptionsSnapshot,
        (liveProperties || []) as ScenarioPropertySnapshot[],
        scenarioGA,
        scenarioProps
      );

      let computedResults: ComputedResultsSnapshot | null = null;
      let computeHash: string | null = null;
      try {
        const { propertyInputs, globalInput, projYears } = extractScenarioComputeInputs(
          { globalAssumptions: scenarioGA, properties: scenarioProps }
        );
        const computeResult = computePortfolioProjection({
          properties: propertyInputs,
          globalAssumptions: globalInput,
          projectionYears: projYears,
        });
        computedResults = {
          engineVersion: computeResult.engineVersion,
          computedAt: computeResult.computedAt,
          outputHash: computeResult.outputHash,
          projectionYears: computeResult.projectionYears,
          propertyCount: computeResult.propertyCount,
          auditOpinion: computeResult.validationSummary.opinion,
          consolidatedYearly: computeResult.consolidatedYearly,
        };
        computeHash = computeResult.outputHash;
      } catch (computeErr) {
        logger.warn(`[scenario] Failed to compute results on save: ${computeErr}`, "scenarios");
      }

      const scenario = await storage.createScenario({
        userId: getAuthUser(req).id,
        name: validation.data.name,
        description: validation.data.description,
        globalAssumptions: scenarioGA,
        properties: scenarioProps,
        feeCategories: propertyFeeCategories,
        propertyPhotos: propertyPhotos,
        computedResults,
        computeHash,
        version: 1,
        baseSnapshotHash: diffResult.snapshotHash,
      });

      if (diffResult.propertyDiffs.length > 0) {
        await storage.writePropertyOverrides(scenario.id, diffResult.propertyDiffs);
      }

      logActivity(req, "create", "scenario", scenario.id, scenario.name);
      res.status(201).json({
        ...scenario,
        snapshotStatus: computedResults ? "computed" : "failed",
      });
    } catch (error) {
      logAndSendError(res, "Failed to create scenario", error);
    }
  });

  app.patch("/api/scenarios/:id", requireManagementAccess, requireScenarioPermission, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getScenario(id);
      if (!existing) return res.status(404).json({ error: "Scenario not found" });
      if (existing.userId !== getAuthUser(req).id) return res.status(403).json({ error: "Access denied" });

      const validation = updateScenarioSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }

      const scenario = await storage.updateScenario(id, validation.data);
      if (!scenario) return res.status(404).json({ error: "Scenario not found" });

      logActivity(req, "update", "scenario", id, scenario.name);
      res.json(scenario);
    } catch (error) {
      logAndSendError(res, "Failed to update scenario", error);
    }
  });

  app.post("/api/scenarios/:id/load", requireManagementAccess, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const scenario = await storage.getScenario(id);
      if (!scenario) return res.status(404).json({ error: "Scenario not found" });

      const isOwner = scenario.userId === getAuthUser(req).id;
      if (!isOwner) {
        const shared = await storage.getScenariosSharedWithUser(getAuthUser(req).id);
        const hasAccess = shared.some(s => s.id === id);
        if (!hasAccess) return res.status(403).json({ error: "Access denied" });
      }

      const snapshotProps: ScenarioPropertySnapshot[] = scenario.properties || [];
      const snapshotPropNames = snapshotProps.map(p => p.name).filter(Boolean);
      const snapshotFeeCats = scenario.feeCategories;
      const snapshotPhotos = scenario.propertyPhotos;

      if (snapshotProps.length === 0) {
        return res.status(422).json({ error: "Scenario snapshot contains no properties" });
      }

      const invalidProps = snapshotProps.filter(p => !p.name || typeof p.name !== "string");
      if (invalidProps.length > 0) {
        return res.status(422).json({ error: `Scenario snapshot contains ${invalidProps.length} property(ies) without a valid name` });
      }

      if (!isOwner) {
        const snapshotPropertyIds = snapshotProps
          .map(p => p.id)
          .filter((pid): pid is number => typeof pid === "number");

        if (snapshotPropertyIds.length > 0) {
          const requesterProperties = await storage.getAllProperties(getAuthUser(req).id);
          const requesterPropertyIds = new Set(requesterProperties.map(p => p.id));
          const unauthorizedIds = snapshotPropertyIds.filter(pid => !requesterPropertyIds.has(pid));
          if (unauthorizedIds.length > 0) {
            logger.warn(`[scenario-load] Scenario ${id}: user ${getAuthUser(req).id} lacks access to ${unauthorizedIds.length} property ID(s): ${unauthorizedIds.join(", ")}`, "scenarios");
            return res.status(403).json({
              error: "Scenario contains properties you do not have access to",
            });
          }
        }
      }

      const orphanedFeeCategories = snapshotFeeCats
        ? Object.keys(snapshotFeeCats).filter(name => !snapshotPropNames.includes(name))
        : [];
      const orphanedPhotos = snapshotPhotos
        ? Object.keys(snapshotPhotos).filter(name => !snapshotPropNames.includes(name))
        : [];

      if (orphanedFeeCategories.length > 0) {
        logger.warn(`[scenario-load] Scenario ${id}: fee categories reference missing properties: ${orphanedFeeCategories.join(", ")}`, "scenarios");
      }
      if (orphanedPhotos.length > 0) {
        logger.warn(`[scenario-load] Scenario ${id}: photos reference missing properties: ${orphanedPhotos.join(", ")}`, "scenarios");
      }

      await storage.loadScenario(
        getAuthUser(req).id,
        scenario.globalAssumptions,
        snapshotProps,
        snapshotFeeCats ?? undefined,
        snapshotPhotos ?? undefined
      );

      invalidateComputeCache();
      logActivity(req, "load", "scenario", id, scenario.name);
      res.json({
        success: true,
        propertyCount: snapshotProps.length,
        warnings: [
          ...orphanedFeeCategories.map(name => `Fee categories for "${name}" have no matching property`),
          ...orphanedPhotos.map(name => `Photos for "${name}" have no matching property`),
        ].filter(w => w.length > 0),
      });
    } catch (error) {
      logAndSendError(res, "Failed to load scenario", error);
    }
  });

  app.delete("/api/scenarios/:id", requireManagementAccess, requireScenarioPermission, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const scenario = await storage.getScenario(id);
      if (!scenario) return res.status(404).json({ error: "Scenario not found" });
      if (scenario.userId !== getAuthUser(req).id) return res.status(403).json({ error: "Access denied" });

      if (scenario.name === "Development") {
        return res.status(400).json({ error: "The default Development scenario cannot be deleted" });
      }

      await storage.deleteScenario(id);
      logActivity(req, "delete", "scenario", id, scenario.name);
      res.json({ success: true });
    } catch (error) {
      logAndSendError(res, "Failed to delete scenario", error);
    }
  });

  app.post("/api/scenarios/:id/clone", requireManagementAccess, requireScenarioPermission, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const scenario = await storage.getScenario(id);
      if (!scenario) return res.status(404).json({ error: "Scenario not found" });
      if (scenario.userId !== getAuthUser(req).id) return res.status(403).json({ error: "Access denied" });

      const existing = await storage.getScenariosByUser(getAuthUser(req).id);
      if (existing.length >= MAX_SCENARIOS_PER_USER) {
        return res.status(400).json({ error: `Maximum of ${MAX_SCENARIOS_PER_USER} scenarios allowed` });
      }

      const cloned = await storage.cloneScenario(id, getAuthUser(req).id);
      logActivity(req, "clone", "scenario", cloned.id, cloned.name);
      res.status(201).json(cloned);
    } catch (error) {
      logAndSendError(res, "Failed to clone scenario", error);
    }
  });

  app.get("/api/scenarios/:id/export", requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const scenario = await storage.getScenario(id);
      if (!scenario) return res.status(404).json({ error: "Scenario not found" });
      if (scenario.userId !== getAuthUser(req).id) return res.status(403).json({ error: "Access denied" });

      const exportData = {
        name: scenario.name,
        description: scenario.description,
        globalAssumptions: scenario.globalAssumptions,
        properties: scenario.properties,
        feeCategories: scenario.feeCategories,
      };

      logActivity(req, "export", "scenario", id, scenario.name);
      const filename = scenario.name.replace(/[^a-zA-Z0-9-_ ]/g, "") + ".json";
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.json(exportData);
    } catch (error) {
      logAndSendError(res, "Failed to export scenario", error);
    }
  });

  const importScenarioSchema = z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(1000).nullable().optional(),
    globalAssumptions: z.record(z.unknown()),
    properties: z.array(z.record(z.unknown())),
    feeCategories: z.record(z.array(z.record(z.unknown()))).optional(),
  });

  app.post("/api/scenarios/import", requireManagementAccess, requireScenarioPermission, async (req, res) => {
    try {
      const validation = importScenarioSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }

      const existing = await storage.getScenariosByUser(getAuthUser(req).id);
      if (existing.length >= MAX_SCENARIOS_PER_USER) {
        return res.status(400).json({ error: `Maximum of ${MAX_SCENARIOS_PER_USER} scenarios allowed` });
      }

      const data = validation.data;
      const scenario = await storage.createScenario({
        userId: getAuthUser(req).id,
        name: data.name,
        description: data.description ?? null,
        globalAssumptions: data.globalAssumptions as ScenarioGlobalAssumptionsSnapshot,
        properties: data.properties as ScenarioPropertySnapshot[],
        feeCategories: (data.feeCategories || {}) as Record<string, ScenarioFeeCategorySnapshot[]>,
      });

      logActivity(req, "import", "scenario", scenario.id, scenario.name);
      res.status(201).json(scenario);
    } catch (error) {
      logAndSendError(res, "Failed to import scenario", error);
    }
  });

  app.get("/api/scenarios/:id1/compare/:id2", requireAuth, async (req, res) => {
    try {
      const id1 = Number(req.params.id1);
      const id2 = Number(req.params.id2);
      const [s1, s2] = await Promise.all([
        storage.getScenario(id1),
        storage.getScenario(id2),
      ]);
      if (!s1 || !s2) return res.status(404).json({ error: "Scenario not found" });
      if (s1.userId !== getAuthUser(req).id || s2.userId !== getAuthUser(req).id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const result = storage.compareScenarios(s1, s2);
      res.json(result);
    } catch (error) {
      logAndSendError(res, "Failed to compare scenarios", error);
    }
  });

  const shareScenarioSchema = z.object({
    recipientEmail: z.string().email(),
    mode: z.enum(["single", "all"]),
    scenarioId: z.number().optional(),
  });

  app.post("/api/scenarios/shares", requireManagementAccess, requireScenarioPermission, async (req, res) => {
    try {
      const validation = shareScenarioSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }

      const { recipientEmail, mode, scenarioId } = validation.data;

      if (recipientEmail === getAuthUser(req).email) {
        return res.status(400).json({ error: "You cannot share scenarios with yourself" });
      }

      const recipient = await storage.getUserByEmail(recipientEmail);
      if (!recipient) {
        return res.status(404).json({ error: "No user found with that email address" });
      }

      if (mode === "single") {
        if (!scenarioId) {
          return res.status(400).json({ error: "scenarioId is required for single share mode" });
        }
        const scenario = await storage.getScenario(scenarioId);
        if (!scenario) return res.status(404).json({ error: "Scenario not found" });
        if (scenario.userId !== getAuthUser(req).id) return res.status(403).json({ error: "You can only share your own scenarios" });

        const share = await storage.shareScenarioWithUser(scenarioId, recipient.id, getAuthUser(req).id);
        logActivity(req, "share", "scenario", scenarioId, scenario.name);
        res.status(201).json({ shares: share ? [share] : [], recipientName: fullName(recipient) || recipient.email });
      } else {
        const shares = await storage.shareAllScenariosWithUser(getAuthUser(req).id, recipient.id);
        logActivity(req, "share_all", "scenario", null, `All scenarios to ${recipient.email}`);
        res.status(201).json({ shares, recipientName: fullName(recipient) || recipient.email });
      }
    } catch (error) {
      logAndSendError(res, "Failed to share scenario", error);
    }
  });

  app.get("/api/scenarios/:id/preview", requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const scenario = await storage.getScenario(id);
      if (!scenario) return res.status(404).json({ error: "Scenario not found" });

      const isOwner = scenario.userId === getAuthUser(req).id;
      if (!isOwner) {
        const shared = await storage.getScenariosSharedWithUser(getAuthUser(req).id);
        const hasAccess = shared.some(s => s.id === id);
        if (!hasAccess) return res.status(403).json({ error: "Access denied" });
      }

      const overrides = await storage.getPropertyOverrides(id);

      const liveProperties = await storage.getAllProperties(scenario.userId);
      const propertyDiffs = overrides.map(o => ({
        propertyId: o.propertyId ?? null,
        propertyName: o.propertyName,
        changeType: o.changeType as "added" | "removed" | "modified" | "unchanged",
        overrides: (o.overrides || {}) as Record<string, unknown>,
        baseSnapshot: (o.basePropertySnapshot || null) as Record<string, unknown> | null,
      }));

      const previewProperties = propertyDiffs.length > 0
        ? reconstructScenarioProperties(
            liveProperties as Array<Record<string, unknown>>,
            propertyDiffs
          )
        : scenario.properties;

      const changedFields = overrides.flatMap(o => {
        const ov = (o.overrides || {}) as Record<string, unknown>;
        return Object.keys(ov).map(field => ({
          propertyName: o.propertyName,
          field,
          scenarioValue: ov[field],
          changeType: o.changeType,
        }));
      });

      res.json({
        id: scenario.id,
        name: scenario.name,
        description: scenario.description,
        globalAssumptions: scenario.globalAssumptions,
        properties: previewProperties,
        feeCategories: scenario.feeCategories,
        changedFields,
        version: scenario.version,
        hasOverrides: overrides.length > 0,
      });
    } catch (error) {
      logAndSendError(res, "Failed to preview scenario", error);
    }
  });

  const crossQuerySchema = z.object({
    field: z.string().min(1),
  });

  app.get("/api/scenarios/cross-query", requireAuth, async (req, res) => {
    try {
      const field = req.query.field as string;
      if (!field) return res.status(400).json({ error: "field query parameter is required" });

      const results = await storage.getPropertyOverridesForField(getAuthUser(req).id, field);

      const userScenarios = await storage.getScenariosByUser(getAuthUser(req).id);
      const scenarioBaseValues: Array<{
        scenarioId: number;
        scenarioName: string;
        properties: Array<{ propertyName: string; value: unknown }>;
      }> = [];

      for (const scenario of userScenarios) {
        const props = (scenario.properties || []) as Array<Record<string, unknown>>;
        const propValues = props
          .filter(p => field in p)
          .map(p => ({ propertyName: p.name as string, value: p[field] }));
        if (propValues.length > 0) {
          scenarioBaseValues.push({
            scenarioId: scenario.id,
            scenarioName: scenario.name,
            properties: propValues,
          });
        }
      }

      res.json({
        field,
        scenarios: scenarioBaseValues,
        overrides: results,
      });
    } catch (error) {
      logAndSendError(res, "Failed to query across scenarios", error);
    }
  });

  const recomputeBodySchema = z.object({
    projectionYears: z.number().int().min(1).max(30).optional(),
  }).optional();

  const scenarioIdSchema = z.coerce.number().int().positive();

  async function checkScenarioAccess(scenarioId: number, userId: number, scenario: { userId: number }): Promise<boolean> {
    if (scenario.userId === userId) return true;
    const user = await storage.getUserById(userId);
    if (!user) return false;
    const shares = await storage.getScenarioSharesForScenario(scenarioId);
    return shares.some(s =>
      (s.targetType === "user" && s.targetId === userId) ||
      (s.targetType === "group" && user.userGroupId != null && s.targetId === user.userGroupId) ||
      (s.targetType === "company" && user.companyId != null && s.targetId === user.companyId)
    );
  }

  function extractScenarioComputeInputs(scenario: { globalAssumptions: unknown; properties: unknown }, projectionYearsOverride?: number) {
    const scenarioGA = scenario.globalAssumptions as Record<string, unknown> | null;
    const scenarioProps = (scenario.properties || []) as Array<Record<string, unknown>>;

    const propertyInputs: PropertyInput[] = scenarioProps.map((p, i) => ({
      ...p,
      id: (p.id as number) ?? undefined,
      name: (p.name as string) ?? `Property_${i + 1}`,
    } as PropertyInput));

    const dbDebt = (scenarioGA?.debtAssumptions ?? null) as Record<string, unknown> | null;
    const projYears = projectionYearsOverride ?? Number(scenarioGA?.projectionYears ?? 10);

    const globalInput: GlobalInput = {
      modelStartDate: (scenarioGA?.modelStartDate as string) ?? new Date().toISOString().slice(0, 10),
      inflationRate: Number(scenarioGA?.inflationRate ?? 0.03),
      marketingRate: Number(scenarioGA?.marketingRate ?? 0.01),
      debtAssumptions: {
        interestRate: Number(dbDebt?.interestRate ?? 0.065),
        amortizationYears: Number(dbDebt?.amortizationYears ?? 25),
      },
      projectionYears: projYears,
    };

    return { propertyInputs, globalInput, projYears, scenarioProps, scenarioGA };
  }

  app.post("/api/scenarios/:id/recompute", requireAuth, async (req, res) => {
    try {
      const idParse = scenarioIdSchema.safeParse(req.params.id);
      if (!idParse.success) return res.status(400).json({ error: "Invalid scenario ID" });
      const scenarioId = idParse.data;

      const bodyParse = recomputeBodySchema.safeParse(req.body);
      if (!bodyParse.success) return res.status(400).json({ error: fromZodError(bodyParse.error).message });

      const scenario = await storage.getScenario(scenarioId);
      if (!scenario) return res.status(404).json({ error: "Scenario not found" });

      if (scenario.userId !== getAuthUser(req).id) {
        return res.status(403).json({ error: "Only the scenario owner can trigger recompute" });
      }

      const { propertyInputs, globalInput, projYears, scenarioProps, scenarioGA } =
        extractScenarioComputeInputs(scenario, bodyParse.data?.projectionYears);

      const computeResult = computePortfolioProjection({
        properties: propertyInputs,
        globalAssumptions: globalInput,
        projectionYears: projYears,
      });

      const inputsPayload = { properties: scenarioProps, globalAssumptions: scenarioGA };
      const inputsHash = stableHash(inputsPayload);

      const stored = await storage.getLatestScenarioResult(scenarioId);
      const drift = stored ? stored.outputHash !== computeResult.outputHash : false;
      let driftStatus: "match" | "input_changed" | "engine_changed" | "first_compute" = "first_compute";
      if (stored) {
        if (stored.outputHash === computeResult.outputHash) {
          driftStatus = "match";
        } else if (stored.engineVersion !== computeResult.engineVersion) {
          driftStatus = "engine_changed";
        } else {
          driftStatus = "input_changed";
        }
      }

      const savedResult = await storage.saveScenarioResult({
        scenarioId,
        engineVersion: computeResult.engineVersion,
        outputHash: computeResult.outputHash,
        inputsHash,
        consolidatedYearlyJson: computeResult.consolidatedYearly,
        auditOpinion: computeResult.validationSummary.opinion,
        projectionYears: computeResult.projectionYears,
        propertyCount: computeResult.propertyCount,
        computedBy: getAuthUser(req).id,
      });

      const updatedSnapshot: ComputedResultsSnapshot = {
        engineVersion: computeResult.engineVersion,
        computedAt: computeResult.computedAt,
        outputHash: computeResult.outputHash,
        projectionYears: computeResult.projectionYears,
        propertyCount: computeResult.propertyCount,
        auditOpinion: computeResult.validationSummary.opinion,
        consolidatedYearly: computeResult.consolidatedYearly,
      };
      await storage.updateScenarioComputedResults(scenarioId, updatedSnapshot, computeResult.outputHash);

      logger.info(`[recompute] Scenario ${scenarioId}: hash=${computeResult.outputHash.slice(0, 16)}..., opinion=${computeResult.validationSummary.opinion}, drift=${driftStatus}`, "scenario-results");

      res.json({
        id: savedResult.id,
        outputHash: computeResult.outputHash,
        inputsHash,
        auditOpinion: computeResult.validationSummary.opinion,
        engineVersion: computeResult.engineVersion,
        projectionYears: computeResult.projectionYears,
        propertyCount: computeResult.propertyCount,
        drift,
        driftStatus,
        computedAt: savedResult.computedAt,
      });
    } catch (error) {
      logAndSendError(res, "Failed to recompute scenario", error);
    }
  });

  app.get("/api/scenarios/:id/results/latest", requireAuth, async (req, res) => {
    try {
      const idParse = scenarioIdSchema.safeParse(req.params.id);
      if (!idParse.success) return res.status(400).json({ error: "Invalid scenario ID" });
      const scenarioId = idParse.data;

      const scenario = await storage.getScenario(scenarioId);
      if (!scenario) return res.status(404).json({ error: "Scenario not found" });

      const hasAccess = await checkScenarioAccess(scenarioId, getAuthUser(req).id, scenario);
      if (!hasAccess) return res.status(403).json({ error: "Access denied" });

      const result = await storage.getLatestScenarioResult(scenarioId);
      if (!result) return res.status(404).json({ error: "No computed results found for this scenario" });

      res.json(result);
    } catch (error) {
      logAndSendError(res, "Failed to fetch scenario result", error);
    }
  });

  app.post("/api/scenarios/:id/drift-check", requireAuth, async (req, res) => {
    try {
      const idParse = scenarioIdSchema.safeParse(req.params.id);
      if (!idParse.success) return res.status(400).json({ error: "Invalid scenario ID" });
      const scenarioId = idParse.data;

      const scenario = await storage.getScenario(scenarioId);
      if (!scenario) return res.status(404).json({ error: "Scenario not found" });

      const hasAccess = await checkScenarioAccess(scenarioId, getAuthUser(req).id, scenario);
      if (!hasAccess) return res.status(403).json({ error: "Access denied" });

      const stored = await storage.getLatestScenarioResult(scenarioId);
      if (!stored) {
        return res.json({ drift: true, status: "no_baseline", details: "No previous computation found" });
      }

      const { propertyInputs, globalInput, projYears } =
        extractScenarioComputeInputs(scenario, stored.projectionYears);

      const computeResult = computePortfolioProjection({
        properties: propertyInputs,
        globalAssumptions: globalInput,
        projectionYears: projYears,
      });

      const hashMatch = stored.outputHash === computeResult.outputHash;
      let status: "match" | "input_changed" | "engine_changed" = "match";
      let details = "Current computation matches stored result";

      if (!hashMatch) {
        if (stored.engineVersion !== computeResult.engineVersion) {
          status = "engine_changed";
          details = `Engine version changed: ${stored.engineVersion} → ${computeResult.engineVersion}`;
        } else {
          status = "input_changed";
          details = "Inputs have changed since last computation";
        }
      }

      logger.info(`[drift-check] Scenario ${scenarioId}: status=${status}`, "scenario-results");

      res.json({
        drift: !hashMatch,
        status,
        details,
        storedHash: stored.outputHash,
        currentHash: computeResult.outputHash,
        storedEngineVersion: stored.engineVersion,
        currentEngineVersion: computeResult.engineVersion,
        storedAt: stored.computedAt,
      });
    } catch (error) {
      logAndSendError(res, "Failed to check scenario drift", error);
    }
  });
}
