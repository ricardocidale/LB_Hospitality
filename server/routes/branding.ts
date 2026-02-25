import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth, requireAdmin } from "../auth";
import { insertLogoSchema, insertCompanySchema, insertUserGroupSchema, insertDesignThemeSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { fullName } from "./helpers";
import { z } from "zod";

export function register(app: Express) {
  // ────────────────────────────────────────────────────────────
  // LOGOS, ASSET DESCRIPTIONS, USER GROUPS, COMPANIES
  // CRUD for white-label branding entities. Each has standard REST endpoints.
  // GET /api/branding — composite endpoint returning the current user's
  // personalized logo, theme colors, and group branding.
  // ────────────────────────────────────────────────────────────

  app.get("/api/branding", requireAuth, async (req, res) => {
    try {
      const u = req.user!;
      let companyName = "Hospitality Business Group";
      let logoUrl: string | null = null;
      let userName = fullName(u) || u.email;

      if (u.companyId) {
        const comp = await storage.getCompany(u.companyId);
        if (comp) companyName = comp.name;
      }

      if (u.userGroupId) {
        const group = await storage.getUserGroup(u.userGroupId);
        if (group?.logoId) {
          const logo = await storage.getLogo(group.logoId);
          if (logo) {
            logoUrl = logo.url;
            if (logo.companyName) companyName = logo.companyName;
          }
        }
      }

      if (!logoUrl) {
        const defaultLogo = await storage.getDefaultLogo();
        if (defaultLogo) logoUrl = defaultLogo.url;
      }

      const ga = await storage.getGlobalAssumptions(u.id);
      if (ga?.companyName) companyName = ga.companyName;

      res.json({ userName, companyName, logoUrl });
    } catch (error) {
      console.error("Error fetching branding:", error);
      res.status(500).json({ error: "Failed to fetch branding" });
    }
  });

  // Logos CRUD
  app.get("/api/logos", requireAuth, async (req, res) => {
    try {
      const logos = await storage.getAllLogos();
      res.json(logos);
    } catch (error) {
      console.error("Error fetching logos:", error);
      res.status(500).json({ error: "Failed to fetch logos" });
    }
  });

  app.post("/api/logos", requireAdmin, async (req, res) => {
    try {
      const validation = insertLogoSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }
      const logo = await storage.createLogo(validation.data);
      res.status(201).json(logo);
    } catch (error) {
      console.error("Error creating logo:", error);
      res.status(500).json({ error: "Failed to create logo" });
    }
  });

  app.delete("/api/logos/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteLogo(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting logo:", error);
      res.status(500).json({ error: "Failed to delete logo" });
    }
  });

  // Asset Descriptions CRUD
  app.get("/api/asset-descriptions", requireAuth, async (req, res) => {
    try {
      const descriptions = await storage.getAllAssetDescriptions();
      res.json(descriptions);
    } catch (error) {
      console.error("Error fetching asset descriptions:", error);
      res.status(500).json({ error: "Failed to fetch asset descriptions" });
    }
  });

  // User Groups CRUD
  app.get("/api/user-groups", requireAuth, async (req, res) => {
    try {
      const groups = await storage.getAllUserGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching user groups:", error);
      res.status(500).json({ error: "Failed to fetch user groups" });
    }
  });

  app.post("/api/user-groups", requireAdmin, async (req, res) => {
    try {
      const validation = insertUserGroupSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }
      const group = await storage.createUserGroup(validation.data);
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating user group:", error);
      res.status(500).json({ error: "Failed to create user group" });
    }
  });

  app.patch("/api/user-groups/:id", requireAdmin, async (req, res) => {
    try {
      const group = await storage.updateUserGroup(Number(req.params.id), req.body);
      res.json(group);
    } catch (error) {
      console.error("Error updating user group:", error);
      res.status(500).json({ error: "Failed to update user group" });
    }
  });

  app.delete("/api/user-groups/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteUserGroup(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user group:", error);
      res.status(500).json({ error: "Failed to delete user group" });
    }
  });

  // Companies CRUD
  app.get("/api/companies", requireAuth, async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  app.post("/api/companies", requireAdmin, async (req, res) => {
    try {
      const validation = insertCompanySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }
      const company = await storage.createCompany(validation.data);
      res.status(201).json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ error: "Failed to create company" });
    }
  });

  app.patch("/api/companies/:id", requireAdmin, async (req, res) => {
    try {
      const company = await storage.updateCompany(Number(req.params.id), req.body);
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ error: "Failed to update company" });
    }
  });

  app.delete("/api/companies/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteCompany(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ error: "Failed to delete company" });
    }
  });

  // Design Themes CRUD
  app.get("/api/available-themes", requireAuth, async (req, res) => {
    try {
      const themes = await storage.getAllDesignThemes();
      res.json(themes.map(t => ({ id: t.id, name: t.name, description: t.description, isDefault: t.isDefault, colors: t.colors })));
    } catch (error) {
      console.error("Error fetching available themes:", error);
      res.status(500).json({ error: "Failed to fetch themes" });
    }
  });

  app.get("/api/admin/design-themes", requireAdmin, async (req, res) => {
    try {
      const themes = await storage.getAllDesignThemes();
      res.json(themes);
    } catch (error) {
      console.error("Error fetching themes:", error);
      res.status(500).json({ error: "Failed to fetch themes" });
    }
  });

  app.post("/api/admin/design-themes", requireAdmin, async (req, res) => {
    try {
      const validation = insertDesignThemeSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }
      const theme = await storage.createDesignTheme(validation.data);
      res.status(201).json(theme);
    } catch (error) {
      console.error("Error creating theme:", error);
      res.status(500).json({ error: "Failed to create theme" });
    }
  });

  app.patch("/api/admin/design-themes/:id", requireAdmin, async (req, res) => {
    try {
      const theme = await storage.updateDesignTheme(Number(req.params.id), req.body);
      res.json(theme);
    } catch (error) {
      console.error("Error updating theme:", error);
      res.status(500).json({ error: "Failed to update theme" });
    }
  });

  app.delete("/api/admin/design-themes/:id", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const theme = await storage.getDesignTheme(id);
      if (theme?.isDefault) {
        return res.status(400).json({ error: "Cannot delete the default theme" });
      }
      await storage.deleteDesignTheme(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting theme:", error);
      res.status(500).json({ error: "Failed to delete theme" });
    }
  });
}
