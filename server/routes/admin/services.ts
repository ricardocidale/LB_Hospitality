import { type Express } from "express";
import { requireAdmin } from "../../auth";
import { updateServiceTemplateSchema, insertServiceTemplateSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { ServiceStorage } from "../../storage/services";

const serviceStorage = new ServiceStorage();

export function registerServiceRoutes(app: Express) {
  // ────────────────────────────────────────────────────────────
  // ADMIN: CENTRALIZED SERVICE TEMPLATES
  // CRUD for company service templates. Controls which services
  // the management company provides and their cost-plus markup.
  // ────────────────────────────────────────────────────────────

  app.get("/api/admin/service-templates", requireAdmin, async (_req, res) => {
    try {
      const templates = await serviceStorage.getAllServiceTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching service templates:", error);
      res.status(500).json({ error: "Failed to fetch service templates" });
    }
  });

  app.post("/api/admin/service-templates", requireAdmin, async (req, res) => {
    try {
      const validation = insertServiceTemplateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }
      const template = await serviceStorage.createServiceTemplate(validation.data);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating service template:", error);
      res.status(500).json({ error: "Failed to create service template" });
    }
  });

  app.patch("/api/admin/service-templates/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid template ID" });

      const validation = updateServiceTemplateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }

      const template = await serviceStorage.updateServiceTemplate(id, validation.data);
      if (!template) return res.status(404).json({ error: "Service template not found" });
      res.json(template);
    } catch (error) {
      console.error("Error updating service template:", error);
      res.status(500).json({ error: "Failed to update service template" });
    }
  });

  app.delete("/api/admin/service-templates/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid template ID" });

      const existing = await serviceStorage.getServiceTemplate(id);
      if (!existing) return res.status(404).json({ error: "Service template not found" });

      await serviceStorage.deleteServiceTemplate(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting service template:", error);
      res.status(500).json({ error: "Failed to delete service template" });
    }
  });

  app.post("/api/admin/service-templates/sync", requireAdmin, async (_req, res) => {
    try {
      const result = await serviceStorage.syncTemplatesToProperties();
      res.json({
        message: `Sync complete: ${result.created} fee categories created, ${result.skipped} already existed`,
        ...result,
      });
    } catch (error) {
      console.error("Error syncing service templates:", error);
      res.status(500).json({ error: "Failed to sync service templates to properties" });
    }
  });
}
