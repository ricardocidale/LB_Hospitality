import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage, type ActivityLogFilters } from "./storage";
import { insertGlobalAssumptionsSchema, insertPropertySchema, updatePropertySchema, insertDesignThemeSchema, insertLogoSchema, updateScenarioSchema, insertProspectivePropertySchema, insertSavedSearchSchema, VALID_USER_ROLES } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { registerObjectStorageRoutes, ObjectStorageService, ObjectNotFoundError } from "./replit_integrations/object_storage";
import { hashPassword, verifyPassword, generateSessionId, setSessionCookie, clearSessionCookie, getSessionExpiryDate, requireAuth, requireAdmin, requireChecker, requireManagementAccess, isRateLimited, recordLoginAttempt, sanitizeEmail, validatePassword, isApiRateLimited } from "./auth";
import { z } from "zod";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { runIndependentVerification, type VerificationReport, type ClientPropertyMonthly } from "./calculationChecker";
import { generatePropertyProForma } from "../client/src/lib/financialEngine";
import {
  DEFAULT_REV_SHARE_EVENTS,
  DEFAULT_REV_SHARE_FB,
  DEFAULT_REV_SHARE_OTHER,
  DEFAULT_COST_RATE_ROOMS,
  DEFAULT_COST_RATE_FB,
  DEFAULT_COST_RATE_ADMIN,
  DEFAULT_COST_RATE_MARKETING,
  DEFAULT_COST_RATE_PROPERTY_OPS,
  DEFAULT_COST_RATE_UTILITIES,
  DEFAULT_COST_RATE_INSURANCE,
  DEFAULT_COST_RATE_TAXES,
  DEFAULT_COST_RATE_IT,
  DEFAULT_COST_RATE_FFE,
  DEFAULT_COST_RATE_OTHER,
  DEFAULT_EXIT_CAP_RATE,
  DEFAULT_TAX_RATE,
  DEFAULT_COMMISSION_RATE,
  DEFAULT_EVENT_EXPENSE_RATE,
  DEFAULT_OTHER_EXPENSE_RATE,
  DEFAULT_UTILITIES_VARIABLE_SPLIT,
  DEFAULT_SAFE_VALUATION_CAP,
  DEFAULT_SAFE_DISCOUNT_RATE,
  DEFAULT_BASE_MANAGEMENT_FEE_RATE,
  DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,
} from "@shared/constants";
import { generateResearchWithToolsStream, loadSkill, buildUserPrompt, type ResearchParams } from "./aiResearch";
import { generateLocationAwareResearchValues } from "./researchSeeds";
import * as calcSchemas from "../calc/shared/schemas";
import { computeDCF } from "../calc/returns/dcf-npv";
import { buildIRRVector } from "../calc/returns/irr-vector";
import { computeEquityMultiple } from "../calc/returns/equity-multiple";
import { computeExitValuation } from "../calc/returns/exit-valuation";
import { validateFinancialIdentities } from "../calc/validation/financial-identities";
import { checkFundingGates } from "../calc/validation/funding-gates";
import { reconcileSchedule } from "../calc/validation/schedule-reconcile";
import { checkAssumptionConsistency } from "../calc/validation/assumption-consistency";
import { verifyExport } from "../calc/validation/export-verification";
import { consolidateStatements } from "../calc/analysis/consolidation";
import { compareScenarios } from "../calc/analysis/scenario-compare";
import { computeBreakEven } from "../calc/analysis/break-even";

// Default debt assumptions for seed endpoints (single definition, used by both admin and public seed)
const SEED_DEBT_ASSUMPTIONS = {
  acqLTV: 0.75,
  refiLTV: 0.75,
  interestRate: 0.09,
  amortizationYears: 25,
  acqClosingCostRate: 0.02,
  refiClosingCostRate: 0.03,
} as const;

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

const VALID_ROLES = VALID_USER_ROLES;

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  companyId: z.number().nullable().optional(),
  title: z.string().max(100).optional(),
  role: z.enum(VALID_ROLES).optional().default("partner"),
});

const createScenarioSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
});

const MAX_SCENARIOS_PER_USER = 20;

const researchGenerateSchema = z.object({
  type: z.enum(["property", "company", "global"]),
  propertyId: z.number().optional(),
  propertyContext: z.record(z.any()).optional(),
  assetDefinition: z.record(z.any()).optional(),
});

const VALID_RESEARCH_TYPES = ["property", "company", "global"] as const;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // --- ACTIVITY LOGGING HELPER ---

  /**
   * Log a user action to the activity_logs table. Non-blocking — errors are
   * caught and logged to console so they never break the primary request.
   */
  function logActivity(
    req: Request,
    action: string,
    entityType: string,
    entityId?: number | null,
    entityName?: string | null,
    metadata?: Record<string, unknown> | null,
  ): void {
    const userId = req.user?.id;
    if (!userId) return;
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    storage.createActivityLog({
      userId,
      action,
      entityType,
      entityId: entityId ?? undefined,
      entityName: entityName ?? undefined,
      metadata: metadata ?? undefined,
      ipAddress,
    }).catch(err => console.error("Activity log error:", err));
  }

  // --- AUTH ROUTES ---

  app.post("/api/auth/login", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      
      if (isRateLimited(clientIp)) {
        return res.status(429).json({ error: "Too many login attempts. Please try again in 1 minute." });
      }
      
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid request" });
      }
      
      const email = sanitizeEmail(validation.data.email);
      const password = validation.data.password;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        recordLoginAttempt(clientIp, false);
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        recordLoginAttempt(clientIp, false);
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      recordLoginAttempt(clientIp, true);
      
      const sessionId = generateSessionId();
      const expiresAt = getSessionExpiryDate();
      await storage.createSession(user.id, sessionId, expiresAt);
      await storage.createLoginLog(user.id, sessionId, clientIp);
      setSessionCookie(res, sessionId);
      
      res.json({ 
        user: { id: user.id, email: user.email, name: user.name, company: user.company, title: user.title, role: user.role }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Admin auto-login (for development/demo convenience)
  app.post("/api/auth/admin-login", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";

      if (isRateLimited(clientIp)) {
        return res.status(429).json({ error: "Too many login attempts. Please try again in 1 minute." });
      }

      const user = await storage.getUserByEmail("admin");
      if (!user) {
        recordLoginAttempt(clientIp, false);
        return res.status(401).json({ error: "Admin user not found" });
      }

      // Validate password from request body against stored hash
      const { password } = req.body || {};
      if (!password) {
        recordLoginAttempt(clientIp, false);
        return res.status(401).json({ error: "Password required" });
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        recordLoginAttempt(clientIp, false);
        return res.status(401).json({ error: "Invalid admin credentials" });
      }

      recordLoginAttempt(clientIp, true);

      const sessionId = generateSessionId();
      const expiresAt = getSessionExpiryDate();
      await storage.createSession(user.id, sessionId, expiresAt);
      await storage.createLoginLog(user.id, sessionId, clientIp);
      setSessionCookie(res, sessionId);

      res.json({
        user: { id: user.id, email: user.email, name: user.name, company: user.company, title: user.title, role: user.role }
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Admin login failed" });
    }
  });

  app.post("/api/auth/dev-login", async (req, res) => {
    try {
      if (process.env.NODE_ENV === "production") {
        return res.status(403).json({ error: "Dev login disabled in production" });
      }
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) {
        return res.status(500).json({ error: "ADMIN_PASSWORD not configured" });
      }
      const user = await storage.getUserByEmail("admin");
      if (!user) {
        return res.status(401).json({ error: "Admin user not found" });
      }
      const isValid = await verifyPassword(adminPassword, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Admin password mismatch" });
      }
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      recordLoginAttempt(clientIp, true);
      const sessionId = generateSessionId();
      const expiresAt = getSessionExpiryDate();
      await storage.createSession(user.id, sessionId, expiresAt);
      await storage.createLoginLog(user.id, sessionId, clientIp);
      setSessionCookie(res, sessionId);
      res.json({
        user: { id: user.id, email: user.email, name: user.name, company: user.company, title: user.title, role: user.role }
      });
    } catch (error) {
      console.error("Dev login error:", error);
      res.status(500).json({ error: "Dev login failed" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      if (req.sessionId) {
        await storage.updateLogoutTime(req.sessionId);
        await storage.deleteSession(req.sessionId);
      }
      clearSessionCookie(res);
      res.json({ success: true });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const u = req.user!;
    let companyName: string | null = null;
    if (u.companyId) {
      const comp = await storage.getCompany(u.companyId);
      if (comp) companyName = comp.name;
    }
    res.json({
      user: { id: u.id, email: u.email, name: u.name, company: u.company, companyId: u.companyId, companyName, title: u.title, role: u.role }
    });
  });

  // --- USER PROFILE ROUTES ---
  
  const updateProfileSchema = z.object({
    name: z.string().max(100).optional(),
    email: z.string().email().max(255).optional(),
    company: z.string().max(100).optional(),
    title: z.string().max(100).optional(),
  });

  app.patch("/api/profile", requireAuth, async (req, res) => {
    try {
      const validation = updateProfileSchema.safeParse(req.body);
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }
      
      const updates: { name?: string; email?: string; company?: string; title?: string } = {};
      if (validation.data.name !== undefined) updates.name = validation.data.name.trim();
      if (validation.data.email !== undefined) {
        const protectedEmails = ["admin", "checker@norfolkgroup.io"];
        if (protectedEmails.includes(req.user!.email.toLowerCase())) {
          return res.status(403).json({ error: "System account emails cannot be changed" });
        }
        const newEmail = sanitizeEmail(validation.data.email);
        if (newEmail !== req.user!.email) {
          const existingUser = await storage.getUserByEmail(newEmail);
          if (existingUser && existingUser.id !== req.user!.id) {
            return res.status(400).json({ error: "Email already in use" });
          }
          updates.email = newEmail;
        }
      }
      if (validation.data.company !== undefined) updates.company = validation.data.company.trim();
      if (validation.data.title !== undefined) updates.title = validation.data.title.trim();
      
      const user = await storage.updateUserProfile(req.user!.id, updates);
      res.json({ id: user.id, email: user.email, name: user.name, company: user.company, title: user.title, role: user.role });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and number"),
  });

  app.get("/api/available-themes", requireAuth, async (req, res) => {
    try {
      const themes = await storage.getAllDesignThemes();
      res.json(themes.map(t => ({ id: t.id, name: t.name, description: t.description, isDefault: t.isDefault, colors: t.colors })));
    } catch (error) {
      console.error("Error fetching available themes:", error);
      res.status(500).json({ error: "Failed to fetch themes" });
    }
  });

  app.patch("/api/profile/theme", requireAuth, async (req, res) => {
    try {
      const schema = z.object({ themeId: z.number().nullable() });
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }
      if (validation.data.themeId !== null) {
        const theme = await storage.getDesignTheme(validation.data.themeId);
        if (!theme) {
          return res.status(404).json({ error: "Theme not found" });
        }
      }
      const user = await storage.updateUserSelectedTheme(req.user!.id, validation.data.themeId);
      res.json({ selectedThemeId: user.selectedThemeId });
    } catch (error) {
      console.error("Error updating theme preference:", error);
      res.status(500).json({ error: "Failed to update theme preference" });
    }
  });

  app.patch("/api/profile/password", requireAuth, async (req, res) => {
    try {
      const validation = changePasswordSchema.safeParse(req.body);
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }

      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const validPassword = await verifyPassword(validation.data.currentPassword, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      const newPasswordHash = await hashPassword(validation.data.newPassword);
      await storage.updateUserPassword(req.user!.id, newPasswordHash);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // --- ADMIN USER MANAGEMENT ROUTES ---
  
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(u => ({ id: u.id, email: u.email, name: u.name, company: u.company, companyId: u.companyId, title: u.title, role: u.role, createdAt: u.createdAt, userGroupId: u.userGroupId })));
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const validation = createUserSchema.safeParse(req.body);
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }
      
      const email = sanitizeEmail(validation.data.email);
      const password = validation.data.password;
      const name = validation.data.name?.trim();
      const company = validation.data.company?.trim();
      const title = validation.data.title?.trim();
      
      const passwordCheck = validatePassword(password);
      if (!passwordCheck.valid) {
        return res.status(400).json({ error: passwordCheck.message });
      }
      
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "User with this email already exists" });
      }
      
      const role = validation.data.role || "partner";
      const companyId = validation.data.companyId ?? null;
      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({ email, passwordHash, role, name, company, companyId, title });
      logActivity(req, "create", "user", user.id, user.email, { role });

      res.json({ id: user.id, email: user.email, name: user.name, company: user.company, companyId: user.companyId, title: user.title, role: user.role });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.patch("/api/admin/users/:id/password", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const { password } = req.body;
      if (!password || typeof password !== "string") {
        return res.status(400).json({ error: "Password is required" });
      }
      
      const passwordCheck = validatePassword(password);
      if (!passwordCheck.valid) {
        return res.status(400).json({ error: passwordCheck.message });
      }
      
      const user = await storage.getUserById(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const passwordHash = await hashPassword(password);
      await storage.updateUserPassword(id, passwordHash);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ error: "Failed to update password" });
    }
  });

  const adminUpdateUserSchema = z.object({
    name: z.string().max(100).optional(),
    email: z.string().email().max(255).optional(),
    company: z.string().max(100).optional(),
    companyId: z.number().nullable().optional(),
    title: z.string().max(100).optional(),
    role: z.enum(VALID_ROLES).optional(),
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const validation = adminUpdateUserSchema.safeParse(req.body);
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }
      
      const existingUser = await storage.getUserById(id);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Handle role change with last-admin protection
      if (validation.data.role !== undefined && validation.data.role !== existingUser.role) {
        if (existingUser.role === "admin" && validation.data.role !== "admin") {
          const allUsers = await storage.getAllUsers();
          const adminCount = allUsers.filter(u => u.role === "admin").length;
          if (adminCount <= 1) {
            return res.status(400).json({ error: "Cannot change role of the last admin user" });
          }
        }
        await storage.updateUserRole(id, validation.data.role);
        logActivity(req, "role_change", "user", id, existingUser.email, { oldRole: existingUser.role, newRole: validation.data.role });
      }
      
      const updates: { email?: string; name?: string; company?: string; companyId?: number | null; title?: string } = {};
      if (validation.data.email !== undefined) {
        const newEmail = sanitizeEmail(validation.data.email);
        if (newEmail !== existingUser.email) {
          const emailUser = await storage.getUserByEmail(newEmail);
          if (emailUser && emailUser.id !== id) {
            return res.status(400).json({ error: "Email already in use" });
          }
          updates.email = newEmail;
        }
      }
      if (validation.data.name !== undefined) updates.name = validation.data.name.trim();
      if (validation.data.company !== undefined) updates.company = validation.data.company.trim();
      if (validation.data.companyId !== undefined) updates.companyId = validation.data.companyId;
      if (validation.data.title !== undefined) updates.title = validation.data.title.trim();
      
      const user = await storage.updateUserProfile(id, updates);
      res.json({ id: user.id, email: user.email, name: user.name, company: user.company, companyId: user.companyId, title: user.title, role: user.role });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const user = await storage.getUserById(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (user.role === "admin") {
        const allUsers = await storage.getAllUsers();
        const adminCount = allUsers.filter(u => u.role === "admin").length;
        if (adminCount <= 1) {
          return res.status(400).json({ error: "Cannot delete the last admin user" });
        }
      }
      
      await storage.deleteUser(id);
      logActivity(req, "delete", "user", id, user.email);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });
  
  // Get login logs (admin only)
  app.get("/api/admin/login-logs", requireAdmin, async (req, res) => {
    try {
      const logs = await storage.getLoginLogs();
      const flattenedLogs = logs.map(log => ({
        id: log.id,
        userId: log.userId,
        sessionId: log.sessionId,
        loginAt: log.loginAt,
        logoutAt: log.logoutAt,
        ipAddress: log.ipAddress,
        userEmail: log.user.email,
        userName: log.user.name,
      }));
      res.json(flattenedLogs);
    } catch (error) {
      console.error("Error fetching login logs:", error);
      res.status(500).json({ error: "Failed to fetch login logs" });
    }
  });

  app.get("/api/admin/sync-status", requireAdmin, async (_req, res) => {
    try {
      const globalAssumptions = await storage.getGlobalAssumptions();
      const properties = await storage.getAllProperties();
      const users = await storage.getAllUsers();
      const userGroups = await storage.getAllUserGroups();
      const themes = await storage.getAllDesignThemes();

      const propertyDetails = await Promise.all(properties.map(async (p) => {
        const feeCategories = await storage.getFeeCategoriesByProperty(p.id);
        return {
          id: p.id,
          name: p.name,
          location: p.location,
          status: p.status,
          purchasePrice: p.purchasePrice,
          roomCount: p.roomCount,
          startAdr: p.startAdr,
          startOccupancy: p.startOccupancy,
          baseManagementFeeRate: p.baseManagementFeeRate,
          incentiveManagementFeeRate: p.incentiveManagementFeeRate,
          exitCapRate: p.exitCapRate,
          feeCategories: feeCategories.map(fc => ({ name: fc.name, rate: fc.rate, isActive: fc.isActive })),
          hasResearchValues: !!p.researchValues,
        };
      }));

      const totalFeeCategories = propertyDetails.reduce((sum, p) => sum + p.feeCategories.length, 0);

      res.json({
        environment: process.env.NODE_ENV || "development",
        summary: {
          users: users.length,
          userGroups: userGroups.length,
          properties: properties.length,
          themes: themes.length,
          hasGlobalAssumptions: !!globalAssumptions,
          totalFeeCategories,
        },
        globalAssumptions: globalAssumptions ? {
          baseManagementFee: globalAssumptions.baseManagementFee,
          incentiveManagementFee: globalAssumptions.incentiveManagementFee,
          inflationRate: globalAssumptions.inflationRate,
          companyName: globalAssumptions.companyName,
          modelStartDate: globalAssumptions.modelStartDate,
          exitCapRate: globalAssumptions.exitCapRate,
          commissionRate: globalAssumptions.commissionRate,
          companyTaxRate: globalAssumptions.companyTaxRate,
        } : null,
        properties: propertyDetails,
        userGroups: userGroups.map(g => ({ id: g.id, name: g.name })),
      });
    } catch (error) {
      console.error("Error fetching sync status:", error);
      res.status(500).json({ error: "Failed to fetch sync status" });
    }
  });

  // --- PRODUCTION DATA SEEDING (one-time use) ---
  app.post("/api/admin/seed-production", requireAdmin, async (req, res) => {
    try {
      const syncMode = req.body?.mode === "sync";
      const results = {
        users: { created: 0, skipped: 0, updated: 0 },
        userGroups: { created: 0, skipped: 0 },
        globalAssumptions: { created: 0, skipped: 0, updated: 0 },
        properties: { created: 0, skipped: 0, updated: 0 },
        propertyFeeCategories: { created: 0, updated: 0 },
        designThemes: { created: 0, skipped: 0 }
      };

      // Seed users (skip if already exist)
      // Passwords are hashed dynamically from env vars — never store static hashes in code
      const adminPw = process.env.ADMIN_PASSWORD;
      const checkerPw = process.env.CHECKER_PASSWORD;
      const reynaldoPw = process.env.REYNALDO_PASSWORD;

      if (!adminPw) {
        console.warn("ADMIN_PASSWORD env var not set — skipping user seeding");
      }

      const usersToSeed = !adminPw ? [] : [
        { email: "admin", passwordHash: await hashPassword(adminPw), role: "admin" as const, name: "Ricardo Cidale", company: "Norfolk Group", title: "Partner" },
        { email: "rosario@kitcapital.com", passwordHash: await hashPassword(adminPw), role: "partner" as const, name: "Rosario David", company: "KIT Capital", title: "COO" },
        { email: "kit@kitcapital.com", passwordHash: await hashPassword(adminPw), role: "partner" as const, name: "Dov Tuzman", company: "KIT Capital", title: "Principal" },
        { email: "lemazniku@icloud.com", passwordHash: await hashPassword(adminPw), role: "partner" as const, name: "Lea Mazniku", company: "KIT Capital", title: "Partner" },
        ...(checkerPw ? [{ email: "checker@norfolkgroup.io", passwordHash: await hashPassword(checkerPw), role: "checker" as const, name: "Checker", company: "Norfolk AI", title: "Checker" }] : []),
        { email: "bhuvan@norfolkgroup.io", passwordHash: await hashPassword(adminPw), role: "partner" as const, name: "Bhuvan Agarwal", company: "Norfolk AI", title: "Financial Analyst" },
        ...(reynaldoPw ? [{ email: "reynaldo.fagundes@norfolk.ai", passwordHash: await hashPassword(reynaldoPw), role: "partner" as const, name: "Reynaldo Fagundes", company: "Norfolk AI", title: "CTO" }] : []),
        { email: "leslie@cidale.com", passwordHash: await hashPassword(adminPw), role: "partner" as const, name: "Leslie Cidale", company: "Numeratti Endeavors", title: "Senior Partner" },
      ];
      
      for (const userData of usersToSeed) {
        const existing = await storage.getUserByEmail(userData.email);
        if (!existing) {
          await storage.createUser(userData);
          results.users.created++;
        } else {
          results.users.skipped++;
        }
      }

      // Seed user groups and assign users
      const existingGroups = await storage.getAllUserGroups();
      const groupMap: Record<string, number> = {};
      
      const groupsToSeed = [
        { name: "KIT Group" },
        { name: "Norfolk Group" },
      ];

      for (const groupData of groupsToSeed) {
        const existing = existingGroups.find(g => g.name === groupData.name);
        if (!existing) {
          const created = await storage.createUserGroup(groupData);
          groupMap[groupData.name] = created.id;
          results.userGroups.created++;
        } else {
          groupMap[groupData.name] = existing.id;
          results.userGroups.skipped++;
        }
      }

      const groupAssignments: Record<string, string> = {
        "rosario@kitcapital.com": "KIT Group",
        "kit@kitcapital.com": "KIT Group",
        "lemazniku@icloud.com": "KIT Group",
        "admin": "Norfolk Group",
        "checker@norfolkgroup.io": "Norfolk Group",
        "bhuvan@norfolkgroup.io": "Norfolk Group",
        "reynaldo.fagundes@norfolk.ai": "Norfolk Group",
      };

      for (const [email, groupName] of Object.entries(groupAssignments)) {
        const user = await storage.getUserByEmail(email);
        const groupId = groupMap[groupName];
        if (user && groupId && user.userGroupId !== groupId) {
          await storage.assignUserToGroup(user.id, groupId);
        }
      }

      // Seed/sync global assumptions
      const globalSeedData = {
        modelStartDate: "2026-04-01",
        inflationRate: 0.03,
        baseManagementFee: DEFAULT_BASE_MANAGEMENT_FEE_RATE,
        incentiveManagementFee: DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,
        staffSalary: 75000,
        staffTier1MaxProperties: 3,
        staffTier1Fte: 2.5,
        staffTier2MaxProperties: 6,
        staffTier2Fte: 4.5,
        staffTier3Fte: 7.0,
        travelCostPerClient: 12000,
        itLicensePerClient: 3000,
        marketingRate: 0.05,
        miscOpsRate: 0.03,
        officeLeaseStart: 36000,
        professionalServicesStart: 24000,
        techInfraStart: 18000,
        businessInsuranceStart: 12000,
        standardAcqPackage: { monthsToOps: 6, purchasePrice: 3800000, preOpeningCosts: 200000, operatingReserve: 250000, buildingImprovements: 1200000 },
        debtAssumptions: SEED_DEBT_ASSUMPTIONS,
        commissionRate: DEFAULT_COMMISSION_RATE,
        fixedCostEscalationRate: 0.03,
        safeTranche1Amount: 1000000,
        safeTranche1Date: "2026-06-01",
        safeTranche2Amount: 1000000,
        safeTranche2Date: "2027-04-01",
        safeValuationCap: DEFAULT_SAFE_VALUATION_CAP,
        safeDiscountRate: DEFAULT_SAFE_DISCOUNT_RATE,
        companyTaxRate: 0.3,
        companyOpsStartDate: "2026-06-01",
        fiscalYearStartMonth: 1,
        partnerCompYear1: 540000, partnerCompYear2: 540000, partnerCompYear3: 540000,
        partnerCompYear4: 600000, partnerCompYear5: 600000, partnerCompYear6: 700000,
        partnerCompYear7: 700000, partnerCompYear8: 800000, partnerCompYear9: 800000, partnerCompYear10: 900000,
        partnerCountYear1: 3, partnerCountYear2: 3, partnerCountYear3: 3, partnerCountYear4: 3, partnerCountYear5: 3,
        partnerCountYear6: 3, partnerCountYear7: 3, partnerCountYear8: 3, partnerCountYear9: 3, partnerCountYear10: 3,
        companyName: "L+B Hospitality Company",
        exitCapRate: DEFAULT_EXIT_CAP_RATE,
        salesCommissionRate: DEFAULT_COMMISSION_RATE,
        eventExpenseRate: DEFAULT_EVENT_EXPENSE_RATE,
        otherExpenseRate: DEFAULT_OTHER_EXPENSE_RATE,
        utilitiesVariableSplit: DEFAULT_UTILITIES_VARIABLE_SPLIT,
      };
      const existingAssumptions = await storage.getGlobalAssumptions();
      if (!existingAssumptions) {
        await storage.upsertGlobalAssumptions(globalSeedData);
        results.globalAssumptions.created++;
      } else if (syncMode) {
        await storage.upsertGlobalAssumptions(globalSeedData);
        results.globalAssumptions.updated++;
      } else {
        results.globalAssumptions.skipped++;
      }

      // Seed/sync properties
      const seedDefaults = {
        costRateRooms: DEFAULT_COST_RATE_ROOMS, costRateFB: DEFAULT_COST_RATE_FB, costRateAdmin: DEFAULT_COST_RATE_ADMIN,
        costRateMarketing: DEFAULT_COST_RATE_MARKETING, costRatePropertyOps: DEFAULT_COST_RATE_PROPERTY_OPS,
        costRateUtilities: DEFAULT_COST_RATE_UTILITIES, costRateInsurance: DEFAULT_COST_RATE_INSURANCE,
        costRateTaxes: DEFAULT_COST_RATE_TAXES, costRateIT: DEFAULT_COST_RATE_IT, costRateFFE: DEFAULT_COST_RATE_FFE,
        costRateOther: DEFAULT_COST_RATE_OTHER, revShareEvents: DEFAULT_REV_SHARE_EVENTS,
        revShareFB: DEFAULT_REV_SHARE_FB, revShareOther: DEFAULT_REV_SHARE_OTHER,
        exitCapRate: DEFAULT_EXIT_CAP_RATE, taxRate: DEFAULT_TAX_RATE,
        baseManagementFeeRate: DEFAULT_BASE_MANAGEMENT_FEE_RATE,
        incentiveManagementFeeRate: DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,
      };
      const propertiesToSeed = [
        { ...seedDefaults, name: "The Hudson Estate", streetAddress: "142 Old Post Road", city: "Millbrook", stateProvince: "NY", zipPostalCode: "12545", country: "United States", location: "Hudson Valley, New York", market: "North America", imageUrl: "/images/property-ny.png", status: "Development", acquisitionDate: "2026-06-01", operationsStartDate: "2026-12-01", purchasePrice: 3800000, buildingImprovements: 1200000, preOpeningCosts: 200000, operatingReserve: 250000, roomCount: 20, startAdr: 385, adrGrowthRate: 0.025, startOccupancy: 0.55, maxOccupancy: 0.82, occupancyRampMonths: 6, occupancyGrowthStep: 0.05, stabilizationMonths: 36, type: "Full Equity", costRateFB: 0.085, costRateIT: 0.005, cateringBoostPercent: 0.22, exitCapRate: 0.08, willRefinance: "Yes", refinanceDate: "2029-12-01", revShareEvents: 0.30 },
        { ...seedDefaults, name: "Eden Summit Lodge", streetAddress: "3850 Nordic Valley Road", city: "Eden", stateProvince: "UT", zipPostalCode: "84310", location: "Ogden Valley, Utah", market: "North America", imageUrl: "/images/property-utah.png", status: "Acquisition", acquisitionDate: "2027-01-01", operationsStartDate: "2027-07-01", purchasePrice: 4000000, buildingImprovements: 1200000, preOpeningCosts: 200000, operatingReserve: 250000, roomCount: 20, startAdr: 425, adrGrowthRate: 0.025, startOccupancy: 0.50, maxOccupancy: 0.80, occupancyRampMonths: 6, occupancyGrowthStep: 0.05, stabilizationMonths: 36, type: "Full Equity", costRateFB: 0.085, costRateIT: 0.005, cateringBoostPercent: 0.25, willRefinance: "Yes", refinanceDate: "2030-07-01", revShareEvents: 0.30 },
        { ...seedDefaults, name: "Austin Hillside", streetAddress: "4100 Mount Bonnell Drive", city: "Austin", stateProvince: "TX", zipPostalCode: "78731", location: "Hill Country, Texas", market: "North America", imageUrl: "/images/property-austin.png", status: "Acquisition", acquisitionDate: "2027-04-01", operationsStartDate: "2028-01-01", purchasePrice: 3500000, buildingImprovements: 1100000, preOpeningCosts: 200000, operatingReserve: 250000, roomCount: 20, startAdr: 320, adrGrowthRate: 0.025, startOccupancy: 0.55, maxOccupancy: 0.82, occupancyRampMonths: 6, occupancyGrowthStep: 0.05, stabilizationMonths: 36, type: "Full Equity", costRateFB: 0.09, costRateIT: 0.005, cateringBoostPercent: 0.20, willRefinance: "Yes", refinanceDate: "2031-01-01", revShareEvents: 0.28 },
        { ...seedDefaults, name: "Casa Medellín", streetAddress: "Carrera 43A #7-50, El Poblado", city: "Medellín", stateProvince: "Antioquia", zipPostalCode: "050021", location: "El Poblado, Medellín", market: "Latin America", imageUrl: "/images/property-medellin.png", status: "Acquisition", acquisitionDate: "2026-09-01", operationsStartDate: "2028-07-01", purchasePrice: 3800000, buildingImprovements: 1000000, preOpeningCosts: 200000, operatingReserve: 250000, roomCount: 30, startAdr: 210, adrGrowthRate: 0.04, startOccupancy: 0.50, maxOccupancy: 0.78, occupancyRampMonths: 6, occupancyGrowthStep: 0.05, stabilizationMonths: 36, type: "Financed", costRateFB: 0.075, costRateIT: 0.005, cateringBoostPercent: 0.18, exitCapRate: 0.095, acquisitionLTV: 0.60, acquisitionInterestRate: 0.095, acquisitionTermYears: 25, acquisitionClosingCostRate: 0.02, revShareEvents: 0.25 },
        { ...seedDefaults, name: "Blue Ridge Manor", streetAddress: "275 Elk Mountain Scenic Highway", city: "Asheville", stateProvince: "NC", zipPostalCode: "28804", location: "Blue Ridge Mountains, North Carolina", market: "North America", imageUrl: "/images/property-asheville.png", status: "Acquisition", acquisitionDate: "2027-07-01", operationsStartDate: "2028-07-01", purchasePrice: 6000000, buildingImprovements: 1500000, preOpeningCosts: 250000, operatingReserve: 300000, roomCount: 30, startAdr: 375, adrGrowthRate: 0.025, startOccupancy: 0.50, maxOccupancy: 0.80, occupancyRampMonths: 6, occupancyGrowthStep: 0.05, stabilizationMonths: 36, type: "Financed", costRateFB: 0.10, costRateIT: 0.005, cateringBoostPercent: 0.25, exitCapRate: 0.09, acquisitionLTV: 0.60, acquisitionInterestRate: 0.09, acquisitionTermYears: 25, acquisitionClosingCostRate: 0.02, revShareEvents: 0.28 }
      ];

      const existingProperties = await storage.getAllProperties();
      const existingByName = new Map(existingProperties.map(p => [p.name, p]));
      
      for (const propData of propertiesToSeed) {
        const existing = existingByName.get(propData.name);
        if (!existing) {
          const researchValues = generateLocationAwareResearchValues({
            location: propData.location,
            streetAddress: propData.streetAddress,
            city: propData.city,
            stateProvince: propData.stateProvince,
            market: propData.market,
          });
          await storage.createProperty({ ...propData, researchValues } as any);
          results.properties.created++;
        } else if (syncMode) {
          const { name, ...updateData } = propData;
          const researchValues = generateLocationAwareResearchValues({
            location: propData.location,
            streetAddress: propData.streetAddress,
            city: propData.city,
            stateProvince: propData.stateProvince,
            market: propData.market,
          });
          await storage.updateProperty(existing.id, { ...updateData, researchValues } as any);
          results.properties.updated++;
        } else {
          if (!existing.researchValues) {
            const rv = generateLocationAwareResearchValues({
              location: existing.location,
              streetAddress: existing.streetAddress,
              city: existing.city,
              stateProvince: existing.stateProvince,
              market: existing.market,
            });
            await storage.updateProperty(existing.id, { researchValues: rv });
          }
          results.properties.skipped++;
        }
      }

      // Sync fee categories in sync mode
      if (syncMode) {
        const defaultFeeCategories = [
          { name: "Marketing", rate: 0.02, sortOrder: 1 },
          { name: "IT", rate: 0.01, sortOrder: 2 },
          { name: "Accounting", rate: 0.015, sortOrder: 3 },
          { name: "Reservations", rate: 0.02, sortOrder: 4 },
          { name: "General Management", rate: 0.02, sortOrder: 5 },
        ];
        const allProps = await storage.getAllProperties();
        for (const prop of allProps) {
          const existingCats = await storage.getFeeCategoriesByProperty(prop.id);
          if (existingCats.length === 0) {
            for (const cat of defaultFeeCategories) {
              await storage.createFeeCategory({ propertyId: prop.id, name: cat.name, rate: cat.rate, isActive: true, sortOrder: cat.sortOrder });
              results.propertyFeeCategories.created++;
            }
          } else {
            for (const cat of defaultFeeCategories) {
              const existingCat = existingCats.find(c => c.name === cat.name);
              if (existingCat && existingCat.rate !== cat.rate) {
                await storage.updateFeeCategory(existingCat.id, { rate: cat.rate });
                results.propertyFeeCategories.updated++;
              } else if (!existingCat) {
                await storage.createFeeCategory({ propertyId: prop.id, name: cat.name, rate: cat.rate, isActive: true, sortOrder: cat.sortOrder });
                results.propertyFeeCategories.created++;
              }
            }
          }
        }
      }

      // Seed design theme (skip if already exists)
      const existingThemes = await storage.getAllDesignThemes();
      if (existingThemes.length === 0) {
        await storage.createDesignTheme({
          name: "Fluid Glass",
          description: "Inspired by Apple's iOS design language, Fluid Glass creates a sense of depth and dimension through translucent layers, subtle gradients, and smooth animations.",
          isDefault: true,
          colors: [
            { name: "Sage Green", rank: 1, hexCode: "#9FBCA4", description: "PALETTE: Secondary accent for subtle highlights, card borders, and supporting visual elements." },
            { name: "Deep Green", rank: 2, hexCode: "#257D41", description: "PALETTE: Primary brand color for main action buttons, active navigation items, and key highlights." },
            { name: "Warm Cream", rank: 3, hexCode: "#FFF9F5", description: "PALETTE: Light background for page backgrounds, card surfaces, and warm accents." },
            { name: "Deep Black", rank: 4, hexCode: "#0a0a0f", description: "PALETTE: Dark theme background for navigation sidebars, dark glass panels, and login screens." },
            { name: "Salmon", rank: 5, hexCode: "#F4795B", description: "PALETTE: Accent color for warnings, notifications, and emphasis highlights." },
            { name: "Yellow Gold", rank: 6, hexCode: "#F59E0B", description: "PALETTE: Accent color for highlights, badges, and attention-drawing elements." },
            { name: "Chart Blue", rank: 1, hexCode: "#3B82F6", description: "CHART: Primary chart line color for revenue and key financial metrics." },
            { name: "Chart Red", rank: 2, hexCode: "#EF4444", description: "CHART: Secondary chart line color for expenses and cost-related metrics." },
            { name: "Chart Purple", rank: 3, hexCode: "#8B5CF6", description: "CHART: Tertiary chart line color for cash flow and profitability metrics." }
          ]
        });
        results.designThemes.created++;
      } else {
        results.designThemes.skipped++;
      }

      res.json({
        success: true,
        message: "Production data seeding completed",
        results
      });
    } catch (error) {
      console.error("Error seeding production data:", error);
      res.status(500).json({ error: "Failed to seed production data" });
    }
  });

  // --- VERIFICATION ROUTES ---
  
  // Run independent financial verification (admin or checker)
  app.get("/api/admin/run-verification", requireChecker, async (req, res) => {
    try {
      if (isApiRateLimited(req.user!.id, "run-verification", 5)) {
        return res.status(429).json({ error: "Too many verification requests. Please wait a minute." });
      }
      const globalAssumptions = await storage.getGlobalAssumptions();
      const properties = await storage.getAllProperties();

      if (!globalAssumptions) {
        return res.status(400).json({ error: "No global assumptions found" });
      }

      // Run the client engine for each property to get "actual" values
      // for cross-implementation verification against the independent checker.
      const clientResults: ClientPropertyMonthly[][] = properties.map((property: any) => {
        const months = generatePropertyProForma(property, globalAssumptions as any);
        return months.map((m: any) => ({
          revenueTotal: m.revenueTotal,
          revenueRooms: m.revenueRooms,
          noi: m.noi,
          gop: m.gop,
          cashFlow: m.cashFlow,
          feeBase: m.feeBase,
          feeIncentive: m.feeIncentive,
        }));
      });

      const report = runIndependentVerification(properties, globalAssumptions, clientResults);

      // Persist verification run for historical tracking
      if (req.user) {
        const s = report.summary;
        storage.createVerificationRun({
          userId: req.user.id,
          totalChecks: s.totalChecks,
          passed: s.totalPassed,
          failed: s.totalFailed,
          auditOpinion: s.auditOpinion,
          overallStatus: s.overallStatus,
          results: report as any,
        }).catch(err => console.error("Verification history save error:", err));
        logActivity(req, "run", "verification", undefined, undefined, {
          totalChecks: s.totalChecks,
          passed: s.totalPassed,
          auditOpinion: s.auditOpinion,
        });
      }

      res.json(report);
    } catch (error) {
      console.error("Error running verification:", error);
      res.status(500).json({ error: "Failed to run verification" });
    }
  });

  // AI-powered methodology review (admin or checker)
  app.post("/api/admin/ai-verification", requireChecker, async (req, res) => {
    try {
      if (isApiRateLimited(req.user!.id, "ai-verification", 3)) {
        return res.status(429).json({ error: "Too many AI verification requests. Please wait a minute." });
      }
      const globalAssumptions = await storage.getGlobalAssumptions();
      const properties = await storage.getAllProperties();

      if (!globalAssumptions) {
        return res.status(400).json({ error: "No global assumptions found" });
      }

      const clientResults: ClientPropertyMonthly[][] = properties.map((property: any) => {
        const months = generatePropertyProForma(property, globalAssumptions as any);
        return months.map((m: any) => ({
          revenueTotal: m.revenueTotal,
          revenueRooms: m.revenueRooms,
          noi: m.noi,
          gop: m.gop,
          cashFlow: m.cashFlow,
          feeBase: m.feeBase,
          feeIncentive: m.feeIncentive,
        }));
      });

      const report = runIndependentVerification(properties, globalAssumptions, clientResults);

      const systemPrompt = `You are a PwC-level financial auditor specializing in hospitality real estate.
Review the following independent verification report and provide:
1. Overall assessment of financial model integrity
2. Any methodology concerns (GAAP compliance, industry standards)
3. Recommendations for improvement
4. Specific areas needing attention

Use GAAP references (ASC 230, ASC 360, ASC 470, ASC 606, USALI) where applicable.
Be concise but thorough. Format as JSON with keys: overallAssessment, methodologyConcerns (array), recommendations (array), areasOfAttention (array), auditOpinionRationale (string).`;

      const userPrompt = `Verification Report:
${JSON.stringify(report, null, 2)}

Properties analyzed: ${properties.map((p: any) => `${p.name} (${p.roomCount} rooms, ${p.type})`).join(', ')}
Global assumptions: Inflation ${(globalAssumptions.inflationRate * 100).toFixed(1)}%. Management fees are per-property.`;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      let fullResponse = "";

      const anthropic = new Anthropic({
        apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
      });

      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          const content = event.delta.text;
          if (content) {
            fullResponse += content;
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }
      }

      let parsedReview: Record<string, any> = {};
      try {
        parsedReview = JSON.parse(fullResponse);
      } catch {
        parsedReview = { rawResponse: fullResponse };
      }

      res.write(`data: ${JSON.stringify({ done: true, review: parsedReview })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error running AI verification:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "AI verification failed" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to run AI verification" });
      }
    }
  });

  // Run design consistency verification (admin only)
  app.get("/api/admin/run-design-check", requireAdmin, async (req, res) => {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const filesToCheck = [
        "client/src/pages/Dashboard.tsx",
        "client/src/pages/Login.tsx",
        "client/src/pages/Admin.tsx",
        "client/src/pages/Portfolio.tsx",
        "client/src/pages/PropertyDetail.tsx",
        "client/src/pages/PropertyEdit.tsx",
        "client/src/pages/Company.tsx",
        "client/src/pages/CompanyAssumptions.tsx",
        "client/src/pages/Settings.tsx",
        "client/src/pages/Profile.tsx",
        "client/src/pages/Scenarios.tsx",
        "client/src/pages/Methodology.tsx",
        "client/src/pages/Research.tsx",
        "client/src/components/Layout.tsx",
        "client/src/components/YearlyIncomeStatement.tsx",
        "client/src/components/YearlyCashFlowStatement.tsx",
        "client/src/components/YearlyBalanceSheet.tsx",
        "client/src/components/MonthlyProForma.tsx",
        "client/src/components/ui/glass-button.tsx",
        "client/src/components/ui/page-header.tsx",
      ];
      
      const fileContents = new Map<string, string>();
      
      for (const filePath of filesToCheck) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          fileContents.set(filePath, content);
        } catch (e) {
          // File not found, skip
        }
      }
      
      const checks: Array<{category: string; rule: string; status: "pass" | "fail" | "warning"; details: string}> = [];
      
      // Check color palette
      const offBrandColors: string[] = [];
      const approvedColors = ["#257D41", "#9FBCA4", "#FFF9F5", "#F4795B", "#0a0a0f", "#000000", "#2d4a5e", "#3d5a6a", "#3a5a5e"];
      const colorRegex = /#[0-9A-Fa-f]{6}\b/g;
      
      fileContents.forEach((content) => {
        const matches = content.match(colorRegex) || [];
        matches.forEach(color => {
          const normalized = color.toLowerCase();
          if (!approvedColors.some(c => c.toLowerCase() === normalized) && 
              !normalized.startsWith("#fff") && !normalized.startsWith("#000") &&
              !normalized.startsWith("#f8") && !normalized.startsWith("#e5") &&
              !normalized.startsWith("#d1") && !normalized.startsWith("#9ca") &&
              !normalized.startsWith("#6b7") && !normalized.startsWith("#374") &&
              !normalized.startsWith("#1f2") && !normalized.startsWith("#1a1")) {
            if (!offBrandColors.includes(normalized)) {
              offBrandColors.push(normalized);
            }
          }
        });
      });
      
      checks.push({
        category: "Color Palette",
        rule: "All colors should be from Hospitality Business brand palette",
        status: offBrandColors.length === 0 ? "pass" : offBrandColors.length <= 3 ? "warning" : "fail",
        details: offBrandColors.length === 0 
          ? "All colors match brand palette"
          : `Found ${offBrandColors.length} off-brand colors: ${offBrandColors.slice(0, 5).join(", ")}`,
      });
      
      // Check typography
      let fontDisplayUsage = 0;
      let labelTextUsage = 0;
      let fontMonoUsage = 0;
      let italicUsage = 0;
      
      fileContents.forEach((content) => {
        if (content.includes("font-display")) fontDisplayUsage++;
        if (content.includes("label-text")) labelTextUsage++;
        if (content.includes("font-mono")) fontMonoUsage++;
        if (content.includes("italic") && !content.includes("no-italic")) italicUsage++;
      });
      
      checks.push({
        category: "Typography",
        rule: "Headers should use font-display class",
        status: fontDisplayUsage >= 5 ? "pass" : "warning",
        details: `font-display found in ${fontDisplayUsage} files`,
      });
      
      checks.push({
        category: "Typography",
        rule: "Body text should use label-text class",
        status: labelTextUsage >= 3 ? "pass" : "warning",
        details: `label-text found in ${labelTextUsage} files`,
      });
      
      checks.push({
        category: "Typography",
        rule: "Numbers/currency should use font-mono class",
        status: fontMonoUsage >= 5 ? "pass" : "warning",
        details: `font-mono found in ${fontMonoUsage} files`,
      });
      
      checks.push({
        category: "Typography",
        rule: "No italic text allowed",
        status: italicUsage === 0 ? "pass" : "fail",
        details: italicUsage === 0 ? "No italic usage found" : `Italic found in ${italicUsage} files`,
      });
      
      // Check GlassButton usage
      let glassButtonUsage = 0;
      fileContents.forEach((content) => {
        const matches = (content.match(/<GlassButton/g) || []).length;
        glassButtonUsage += matches;
      });
      
      checks.push({
        category: "Buttons",
        rule: "Primary actions should use GlassButton component",
        status: glassButtonUsage >= 10 ? "pass" : glassButtonUsage >= 5 ? "warning" : "fail",
        details: `GlassButton used ${glassButtonUsage} times`,
      });
      
      // Check PageHeader usage
      let pageHeaderUsage = 0;
      fileContents.forEach((content, file) => {
        if (file.includes("/pages/") && !file.includes("Login") && !file.includes("not-found")) {
          if (content.includes("PageHeader") || content.includes("page-header")) {
            pageHeaderUsage++;
          }
        }
      });
      
      checks.push({
        category: "Page Structure",
        rule: "Pages should use standardized PageHeader component",
        status: pageHeaderUsage >= 8 ? "pass" : pageHeaderUsage >= 5 ? "warning" : "fail",
        details: `PageHeader used in ${pageHeaderUsage} pages`,
      });
      
      // Check dark glass theme
      let darkGradientUsage = 0;
      let backdropBlurUsage = 0;
      
      fileContents.forEach((content) => {
        if (content.includes("from-[#2d4a5e]") || content.includes("via-[#3d5a6a]") || content.includes("to-[#3a5a5e]")) {
          darkGradientUsage++;
        }
        if (content.includes("backdrop-blur")) {
          backdropBlurUsage++;
        }
      });
      
      checks.push({
        category: "Theme",
        rule: "Dark glass gradient should be consistent",
        status: darkGradientUsage >= 3 ? "pass" : "warning",
        details: `Dark glass gradient found in ${darkGradientUsage} files`,
      });
      
      checks.push({
        category: "Theme",
        rule: "Backdrop blur should be used for glass effects",
        status: backdropBlurUsage >= 5 ? "pass" : "warning",
        details: `backdrop-blur found in ${backdropBlurUsage} files`,
      });
      
      // Check data-testid
      let filesWithTestIds = 0;
      let filesWithInteractiveElements = 0;
      
      fileContents.forEach((content, file) => {
        if (file.includes("/pages/") || file.includes("/components/")) {
          const hasInteractive = content.includes("<Button") || content.includes("<Input") || content.includes("<GlassButton");
          const hasTestIds = content.includes("data-testid");
          
          if (hasInteractive) {
            filesWithInteractiveElements++;
            if (hasTestIds) filesWithTestIds++;
          }
        }
      });
      
      checks.push({
        category: "Testing",
        rule: "Interactive elements should have data-testid attributes",
        status: filesWithTestIds >= filesWithInteractiveElements * 0.8 ? "pass" : 
                filesWithTestIds >= filesWithInteractiveElements * 0.5 ? "warning" : "fail",
        details: `${filesWithTestIds}/${filesWithInteractiveElements} files with interactive elements have data-testid`,
      });
      
      // Check currency formatting
      let currencyFormatUsage = 0;
      fileContents.forEach((content) => {
        if (content.includes("formatCurrency") || content.includes("toLocaleString")) {
          currencyFormatUsage++;
        }
      });
      
      checks.push({
        category: "Formatting",
        rule: "Currency values should use consistent formatting",
        status: currencyFormatUsage >= 5 ? "pass" : "warning",
        details: `Currency formatting found in ${currencyFormatUsage} files`,
      });
      
      const passed = checks.filter(c => c.status === "pass").length;
      const failed = checks.filter(c => c.status === "fail").length;
      const warnings = checks.filter(c => c.status === "warning").length;
      
      let overallStatus: "PASS" | "FAIL" | "WARNING" = "PASS";
      if (failed > 0) overallStatus = "FAIL";
      else if (warnings > 2) overallStatus = "WARNING";
      
      res.json({
        timestamp: new Date().toISOString(),
        totalChecks: checks.length,
        passed,
        failed,
        warnings,
        overallStatus,
        checks,
      });
    } catch (error) {
      console.error("Error running design check:", error);
      res.status(500).json({ error: "Failed to run design check" });
    }
  });

  // --- GLOBAL ASSUMPTIONS ROUTES ---
  
  app.get("/api/global-assumptions", requireAuth, async (req, res) => {
    try {
      const data = await storage.getGlobalAssumptions();
      
      if (!data) {
        return res.status(404).json({ error: "Global assumptions not initialized" });
      }
      
      let companyLogoUrl: string | null = null;
      if (data.companyLogoId) {
        const logo = await storage.getLogo(data.companyLogoId);
        companyLogoUrl = logo?.url ?? null;
      }
      
      res.json({ ...data, companyLogoUrl });
    } catch (error) {
      console.error("Error fetching global assumptions:", error);
      res.status(500).json({ error: "Failed to fetch global assumptions" });
    }
  });

  app.post("/api/global-assumptions", requireAuth, async (req, res) => {
    try {
      const validation = insertGlobalAssumptionsSchema.safeParse(req.body);
      
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }
      
      const data = await storage.upsertGlobalAssumptions(validation.data);
      logActivity(req, "update", "global_assumptions", data.id, "Global Assumptions");
      res.json(data);
    } catch (error) {
      console.error("Error upserting global assumptions:", error);
      res.status(500).json({ error: "Failed to save global assumptions" });
    }
  });

  // --- PROPERTIES ROUTES ---
  
  app.get("/api/properties", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const data = await storage.getAllProperties(userId);
      res.json(data);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ error: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const userId = req.user!.id;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid property ID" });
      }
      
      const property = await storage.getProperty(id);
      
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      
      // Verify property belongs to user (or is shared - userId is null)
      if (property.userId !== null && property.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ error: "Failed to fetch property" });
    }
  });

  app.post("/api/properties", requireAuth, async (req, res) => {
    try {
      const validation = insertPropertySchema.safeParse(req.body);

      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }

      const data = validation.data;
      if (!data.researchValues) {
        data.researchValues = generateLocationAwareResearchValues({
          location: data.location,
          streetAddress: data.streetAddress,
          city: data.city,
          stateProvince: data.stateProvince,
          market: data.market,
        });
      }
      const property = await storage.createProperty({ ...data, userId: req.user!.id });
      logActivity(req, "create", "property", property.id, property.name);
      res.status(201).json(property);
    } catch (error) {
      console.error("Error creating property:", error);
      res.status(500).json({ error: "Failed to create property" });
    }
  });

  app.patch("/api/properties/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const userId = req.user!.id;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid property ID" });
      }
      
      // Check ownership before updating
      const existingProperty = await storage.getProperty(id);
      if (!existingProperty) {
        return res.status(404).json({ error: "Property not found" });
      }
      if (existingProperty.userId !== null && existingProperty.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const validation = updatePropertySchema.safeParse(req.body);
      
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }
      
      const property = await storage.updateProperty(id, validation.data);

      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      logActivity(req, "update", "property", id, property.name, { changedFields: Object.keys(validation.data) });
      res.json(property);
    } catch (error) {
      console.error("Error updating property:", error);
      res.status(500).json({ error: "Failed to update property" });
    }
  });

  app.delete("/api/properties/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const userId = req.user!.id;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid property ID" });
      }
      
      // Check ownership before deleting
      const existingProperty = await storage.getProperty(id);
      if (!existingProperty) {
        return res.status(404).json({ error: "Property not found" });
      }
      if (existingProperty.userId !== null && existingProperty.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await storage.deleteProperty(id);
      logActivity(req, "delete", "property", id, existingProperty.name);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting property:", error);
      res.status(500).json({ error: "Failed to delete property" });
    }
  });

  // Fee category routes are registered below (near end of file) with auto-seed and batch update support

  // Register object storage routes for file uploads
  registerObjectStorageRoutes(app);

  // --- AI IMAGE GENERATION + UPLOAD ---
  app.post("/api/generate-property-image", requireAuth, async (req, res) => {
    try {
      if (isApiRateLimited(req.user!.id, "generate-property-image", 5)) {
        return res.status(429).json({ error: "Rate limit exceeded. Try again in a minute." });
      }

      const { prompt } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // Dynamic import to avoid loading OpenAI client when not needed
      const { generateImageBuffer } = await import("./replit_integrations/image/client");
      const buffer = await generateImageBuffer(prompt, "1024x1024");

      // Upload generated image to object storage
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: buffer,
        headers: { "Content-Type": "image/png" },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload generated image to storage");
      }

      logActivity(req, "create", "image", undefined, undefined, { prompt, objectPath });
      res.json({ objectPath });
    } catch (error) {
      console.error("Error generating property image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  // --- FIX IMAGE URLS ENDPOINT ---
  app.post("/api/fix-images", requireAdmin, async (req, res) => {
    try {
      const imageMap: Record<string, string> = {
        "The Hudson Estate": "/images/property-ny.png",
        "Eden Summit Lodge": "/images/property-utah.png",
        "Austin Hillside": "/images/property-austin.png",
        "Casa Medellín": "/images/property-medellin.png",
        "Blue Ridge Manor": "/images/property-asheville.png"
      };
      
      const properties = await storage.getAllProperties();
      let updated = 0;
      
      for (const prop of properties) {
        const correctUrl = imageMap[prop.name];
        if (correctUrl && prop.imageUrl !== correctUrl) {
          await storage.updateProperty(prop.id, { imageUrl: correctUrl });
          updated++;
        }
      }
      
      res.json({ success: true, updated });
    } catch (error) {
      console.error("Error fixing images:", error);
      res.status(500).json({ error: "Failed to fix images" });
    }
  });

  // --- ONE-TIME SEED ENDPOINT ---
  // Visit /api/seed-production once to populate the database with initial data
  app.post("/api/seed-production", requireAdmin, async (req, res) => {
    try {
      // Check if data already exists
      const existingProperties = await storage.getAllProperties();
      if (existingProperties.length > 0) {
        return res.json({ 
          message: "Database already has data", 
          properties: existingProperties.length 
        });
      }

      // Seed Global Assumptions
      await storage.upsertGlobalAssumptions({
        modelStartDate: "2026-04-01",
        inflationRate: 0.03,
        baseManagementFee: DEFAULT_BASE_MANAGEMENT_FEE_RATE,
        incentiveManagementFee: DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,
        staffSalary: 75000,
        staffTier1MaxProperties: 3,
        staffTier1Fte: 2.5,
        staffTier2MaxProperties: 6,
        staffTier2Fte: 4.5,
        staffTier3Fte: 7.0,
        travelCostPerClient: 12000,
        itLicensePerClient: 3000,
        marketingRate: 0.05,
        miscOpsRate: 0.03,
        officeLeaseStart: 36000,
        professionalServicesStart: 24000,
        techInfraStart: 18000,
        businessInsuranceStart: 12000,
        standardAcqPackage: {
          monthsToOps: 6,
          purchasePrice: 3800000,
          preOpeningCosts: 200000,
          operatingReserve: 250000,
          buildingImprovements: 1200000
        },
        debtAssumptions: SEED_DEBT_ASSUMPTIONS,
        commissionRate: DEFAULT_COMMISSION_RATE,
        fixedCostEscalationRate: 0.03,
        safeTranche1Amount: 1000000,
        safeTranche1Date: "2026-06-01",
        safeTranche2Amount: 1000000,
        safeTranche2Date: "2027-04-01",
        safeValuationCap: DEFAULT_SAFE_VALUATION_CAP,
        safeDiscountRate: DEFAULT_SAFE_DISCOUNT_RATE,
        companyTaxRate: 0.3,
        companyOpsStartDate: "2026-06-01",
        fiscalYearStartMonth: 1,
        partnerCompYear1: 540000, partnerCompYear2: 540000, partnerCompYear3: 540000,
        partnerCompYear4: 600000, partnerCompYear5: 600000, partnerCompYear6: 700000,
        partnerCompYear7: 700000, partnerCompYear8: 800000, partnerCompYear9: 800000, partnerCompYear10: 900000,
        partnerCountYear1: 3, partnerCountYear2: 3, partnerCountYear3: 3, partnerCountYear4: 3, partnerCountYear5: 3,
        partnerCountYear6: 3, partnerCountYear7: 3, partnerCountYear8: 3, partnerCountYear9: 3, partnerCountYear10: 3,
        companyName: "L+B Hospitality Company",
        exitCapRate: DEFAULT_EXIT_CAP_RATE,
        salesCommissionRate: DEFAULT_COMMISSION_RATE,
        eventExpenseRate: DEFAULT_EVENT_EXPENSE_RATE,
        otherExpenseRate: DEFAULT_OTHER_EXPENSE_RATE,
        utilitiesVariableSplit: DEFAULT_UTILITIES_VARIABLE_SPLIT
      });

      // Seed Properties
      const defaults = {
        costRateRooms: DEFAULT_COST_RATE_ROOMS, costRateFB: DEFAULT_COST_RATE_FB,
        costRateAdmin: DEFAULT_COST_RATE_ADMIN, costRateMarketing: DEFAULT_COST_RATE_MARKETING,
        costRatePropertyOps: DEFAULT_COST_RATE_PROPERTY_OPS, costRateUtilities: DEFAULT_COST_RATE_UTILITIES,
        costRateInsurance: DEFAULT_COST_RATE_INSURANCE, costRateTaxes: DEFAULT_COST_RATE_TAXES,
        costRateIT: DEFAULT_COST_RATE_IT, costRateFFE: DEFAULT_COST_RATE_FFE,
        costRateOther: DEFAULT_COST_RATE_OTHER, revShareEvents: DEFAULT_REV_SHARE_EVENTS,
        revShareFB: DEFAULT_REV_SHARE_FB, revShareOther: DEFAULT_REV_SHARE_OTHER,
        exitCapRate: DEFAULT_EXIT_CAP_RATE, taxRate: DEFAULT_TAX_RATE,
        baseManagementFeeRate: DEFAULT_BASE_MANAGEMENT_FEE_RATE,
        incentiveManagementFeeRate: DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,
      };
      const properties = [
        { ...defaults, name: "The Hudson Estate", streetAddress: "142 Old Post Road", city: "Millbrook", stateProvince: "NY", zipPostalCode: "12545", country: "United States", location: "Hudson Valley, New York", market: "North America", imageUrl: "/images/property-ny.png", status: "Development", acquisitionDate: "2026-06-01", operationsStartDate: "2026-12-01", purchasePrice: 3800000, buildingImprovements: 1200000, preOpeningCosts: 200000, operatingReserve: 250000, roomCount: 20, startAdr: 385, adrGrowthRate: 0.025, startOccupancy: 0.55, maxOccupancy: 0.82, occupancyRampMonths: 6, occupancyGrowthStep: 0.05, stabilizationMonths: 36, type: "Full Equity", costRateFB: 0.085, costRateIT: 0.005, cateringBoostPercent: 0.22, exitCapRate: 0.08, willRefinance: "Yes", refinanceDate: "2029-12-01", revShareEvents: 0.30 },
        { ...defaults, name: "Eden Summit Lodge", streetAddress: "3850 Nordic Valley Road", city: "Eden", stateProvince: "UT", zipPostalCode: "84310", location: "Ogden Valley, Utah", market: "North America", imageUrl: "/images/property-utah.png", status: "Acquisition", acquisitionDate: "2027-01-01", operationsStartDate: "2027-07-01", purchasePrice: 4000000, buildingImprovements: 1200000, preOpeningCosts: 200000, operatingReserve: 250000, roomCount: 20, startAdr: 425, adrGrowthRate: 0.025, startOccupancy: 0.50, maxOccupancy: 0.80, occupancyRampMonths: 6, occupancyGrowthStep: 0.05, stabilizationMonths: 36, type: "Full Equity", costRateFB: 0.085, costRateIT: 0.005, cateringBoostPercent: 0.25, willRefinance: "Yes", refinanceDate: "2030-07-01", revShareEvents: 0.30 },
        { ...defaults, name: "Austin Hillside", streetAddress: "4100 Mount Bonnell Drive", city: "Austin", stateProvince: "TX", zipPostalCode: "78731", location: "Hill Country, Texas", market: "North America", imageUrl: "/images/property-austin.png", status: "Acquisition", acquisitionDate: "2027-04-01", operationsStartDate: "2028-01-01", purchasePrice: 3500000, buildingImprovements: 1100000, preOpeningCosts: 200000, operatingReserve: 250000, roomCount: 20, startAdr: 320, adrGrowthRate: 0.025, startOccupancy: 0.55, maxOccupancy: 0.82, occupancyRampMonths: 6, occupancyGrowthStep: 0.05, stabilizationMonths: 36, type: "Full Equity", costRateFB: 0.09, costRateIT: 0.005, cateringBoostPercent: 0.20, willRefinance: "Yes", refinanceDate: "2031-01-01", revShareEvents: 0.28 },
        { ...defaults, name: "Casa Medellín", streetAddress: "Carrera 43A #7-50, El Poblado", city: "Medellín", stateProvince: "Antioquia", zipPostalCode: "050021", location: "El Poblado, Medellín", market: "Latin America", imageUrl: "/images/property-medellin.png", status: "Acquisition", acquisitionDate: "2026-09-01", operationsStartDate: "2028-07-01", purchasePrice: 3800000, buildingImprovements: 1000000, preOpeningCosts: 200000, operatingReserve: 250000, roomCount: 30, startAdr: 210, adrGrowthRate: 0.04, startOccupancy: 0.50, maxOccupancy: 0.78, occupancyRampMonths: 6, occupancyGrowthStep: 0.05, stabilizationMonths: 36, type: "Financed", costRateFB: 0.075, costRateIT: 0.005, cateringBoostPercent: 0.18, exitCapRate: 0.095, acquisitionLTV: 0.60, acquisitionInterestRate: 0.095, acquisitionTermYears: 25, acquisitionClosingCostRate: 0.02, revShareEvents: 0.25 },
        { ...defaults, name: "Blue Ridge Manor", streetAddress: "275 Elk Mountain Scenic Highway", city: "Asheville", stateProvince: "NC", zipPostalCode: "28804", location: "Blue Ridge Mountains, North Carolina", market: "North America", imageUrl: "/images/property-asheville.png", status: "Acquisition", acquisitionDate: "2027-07-01", operationsStartDate: "2028-07-01", purchasePrice: 6000000, buildingImprovements: 1500000, preOpeningCosts: 250000, operatingReserve: 300000, roomCount: 30, startAdr: 375, adrGrowthRate: 0.025, startOccupancy: 0.50, maxOccupancy: 0.80, occupancyRampMonths: 6, occupancyGrowthStep: 0.05, stabilizationMonths: 36, type: "Financed", costRateFB: 0.10, costRateIT: 0.005, cateringBoostPercent: 0.25, exitCapRate: 0.09, acquisitionLTV: 0.60, acquisitionInterestRate: 0.09, acquisitionTermYears: 25, acquisitionClosingCostRate: 0.02, revShareEvents: 0.28 }
      ];

      for (const prop of properties) {
        const rv = generateLocationAwareResearchValues({
          location: prop.location,
          streetAddress: prop.streetAddress,
          city: (prop as any).city,
          stateProvince: (prop as any).stateProvince,
          market: prop.market,
        });
        await storage.createProperty({ ...prop, researchValues: rv });
      }

      res.json({ 
        success: true, 
        message: "Database seeded successfully",
        globalAssumptions: 1,
        properties: properties.length
      });
    } catch (error) {
      console.error("Error seeding database:", error);
      res.status(500).json({ error: "Failed to seed database" });
    }
  });

  // --- SCENARIOS ROUTES ---
  
  async function collectFeeCategories(props: { id: number; name: string }[]): Promise<Record<string, any[]>> {
    const feeCategories: Record<string, any[]> = {};
    for (const prop of props) {
      const cats = await storage.getFeeCategoriesByProperty(prop.id);
      if (cats.length > 0) {
        feeCategories[prop.name] = cats;
      }
    }
    return feeCategories;
  }

  // Get all scenarios for current user (ensures Base scenario exists)
  app.get("/api/scenarios", requireManagementAccess, async (req, res) => {
    try {
      const userId = req.user!.id;
      let scenarios = await storage.getScenariosByUser(userId);
      
      // Ensure Base scenario exists
      const hasBase = scenarios.some(s => s.name === "Base");
      if (!hasBase) {
        let assumptions = await storage.getGlobalAssumptions(userId);
        let properties = await storage.getAllProperties(userId);
        
        if (!assumptions) {
          assumptions = await storage.getGlobalAssumptions();
        }
        if (properties.length === 0) {
          properties = await storage.getAllProperties();
        }
        
        if (assumptions) {
          const baseImages: Record<string, { dataUri: string; contentType: string }> = {};
          const objService = new ObjectStorageService();
          const baseImageUrls: string[] = [];
          for (const prop of properties) {
            if (prop.imageUrl && prop.imageUrl.startsWith("/objects/")) {
              baseImageUrls.push(prop.imageUrl);
            }
          }
          if (assumptions.companyLogo && assumptions.companyLogo.startsWith("/objects/")) {
            baseImageUrls.push(assumptions.companyLogo);
          }
          for (const url of baseImageUrls) {
            try {
              const file = await objService.getObjectEntityFile(url);
              const [metadata] = await file.getMetadata();
              const ct = (metadata.contentType as string) || "image/png";
              const [buf] = await file.download();
              baseImages[url] = { dataUri: `data:${ct};base64,${buf.toString("base64")}`, contentType: ct };
            } catch { /* skip missing images */ }
          }

          const feeCategories = await collectFeeCategories(properties);

          await storage.createScenario({
            userId,
            name: "Base",
            description: "Default baseline scenario with initial assumptions",
            globalAssumptions: assumptions,
            properties: properties,
            scenarioImages: Object.keys(baseImages).length > 0 ? baseImages : undefined,
            feeCategories: Object.keys(feeCategories).length > 0 ? feeCategories : undefined,
          });
          scenarios = await storage.getScenariosByUser(userId);
        }
      }
      
      res.json(scenarios);
    } catch (error) {
      console.error("Error fetching scenarios:", error);
      res.status(500).json({ error: "Failed to fetch scenarios" });
    }
  });

  // Create new scenario (save current assumptions + properties + images)
  app.post("/api/scenarios", requireManagementAccess, async (req, res) => {
    try {
      const userId = req.user!.id;
      const validation = createScenarioSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }
      const { name, description } = validation.data;

      const existingCount = (await storage.getScenariosByUser(userId)).length;
      if (existingCount >= MAX_SCENARIOS_PER_USER) {
        return res.status(400).json({ error: `Maximum of ${MAX_SCENARIOS_PER_USER} scenarios per user reached. Delete an existing scenario to create a new one.` });
      }

      let assumptions = await storage.getGlobalAssumptions(userId);
      let properties = await storage.getAllProperties(userId);

      // If user has no specific data, try to get shared data (userId: null)
      if (!assumptions) {
        assumptions = await storage.getGlobalAssumptions();
      }
      if (properties.length === 0) {
        properties = await storage.getAllProperties();
      }

      if (!assumptions) {
        return res.status(400).json({ error: "No assumptions found to save" });
      }

      // Capture images from object storage as base64 for scenario persistence
      const scenarioImages: Record<string, { dataUri: string; contentType: string }> = {};
      const objectStorageService = new ObjectStorageService();

      // Collect all image URLs that reference object storage
      const imageUrls: string[] = [];
      for (const prop of properties) {
        if (prop.imageUrl && prop.imageUrl.startsWith("/objects/")) {
          imageUrls.push(prop.imageUrl);
        }
      }
      if (assumptions.companyLogo && assumptions.companyLogo.startsWith("/objects/")) {
        imageUrls.push(assumptions.companyLogo);
      }

      // Read each image from object storage and encode as base64
      for (const url of imageUrls) {
        try {
          const file = await objectStorageService.getObjectEntityFile(url);
          const [metadata] = await file.getMetadata();
          const contentType = (metadata.contentType as string) || "image/png";
          const [buffer] = await file.download();
          const base64 = buffer.toString("base64");
          scenarioImages[url] = { dataUri: `data:${contentType};base64,${base64}`, contentType };
        } catch (err) {
          // Image not found in object storage — skip (may be a static image or already gone)
          console.warn(`Scenario save: could not capture image ${url}:`, err instanceof Error ? err.message : err);
        }
      }

      const feeCategories = await collectFeeCategories(properties);

      const scenario = await storage.createScenario({
        userId,
        name: name.trim(),
        description: description || null,
        globalAssumptions: assumptions,
        properties: properties,
        scenarioImages: Object.keys(scenarioImages).length > 0 ? scenarioImages : undefined,
        feeCategories: Object.keys(feeCategories).length > 0 ? feeCategories : undefined,
      });

      logActivity(req, "save", "scenario", scenario.id, scenario.name);
      res.json(scenario);
    } catch (error) {
      console.error("Error creating scenario:", error);
      res.status(500).json({ error: "Failed to create scenario" });
    }
  });

  // Load scenario (restore assumptions + properties + images)
  app.post("/api/scenarios/:id/load", requireManagementAccess, async (req, res) => {
    try {
      const userId = req.user!.id;
      const scenarioId = parseInt(req.params.id as string);
      if (isNaN(scenarioId)) {
        return res.status(400).json({ error: "Invalid scenario ID" });
      }

      const scenario = await storage.getScenario(scenarioId);
      if (!scenario) {
        return res.status(404).json({ error: "Scenario not found" });
      }

      if (scenario.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Restore images from snapshot if they no longer exist in object storage
      const savedImages = (scenario.scenarioImages as Record<string, { dataUri: string; contentType: string }>) || {};
      if (Object.keys(savedImages).length > 0) {
        const objectStorageService = new ObjectStorageService();
        for (const [url, imageData] of Object.entries(savedImages)) {
          try {
            // Check if the image still exists
            await objectStorageService.getObjectEntityFile(url);
          } catch (err) {
            if (err instanceof ObjectNotFoundError) {
              // Image is gone — re-upload from saved base64 data
              try {
                // Extract the object path from the URL (e.g., /objects/uploads/uuid -> uploads/uuid)
                const entityId = url.replace(/^\/objects\//, "");
                let entityDir = objectStorageService.getPrivateObjectDir();
                if (!entityDir.endsWith("/")) entityDir += "/";
                const fullPath = `${entityDir}${entityId}`;

                // Parse bucket/object path
                const pathParts = fullPath.startsWith("/") ? fullPath.split("/") : `/${fullPath}`.split("/");
                const bucketName = pathParts[1];
                const objectName = pathParts.slice(2).join("/");

                // Decode base64 and upload
                const base64Data = imageData.dataUri.replace(/^data:[^;]+;base64,/, "");
                const buffer = Buffer.from(base64Data, "base64");

                const { objectStorageClient } = await import("./replit_integrations/object_storage/objectStorage");
                const bucket = objectStorageClient.bucket(bucketName);
                const file = bucket.file(objectName);
                await file.save(buffer, { contentType: imageData.contentType });
                console.log(`Scenario load: restored image ${url}`);
              } catch (uploadErr) {
                console.warn(`Scenario load: failed to restore image ${url}:`, uploadErr instanceof Error ? uploadErr.message : uploadErr);
              }
            }
          }
        }
      }

      const savedAssumptions = scenario.globalAssumptions as Record<string, unknown>;
      const savedProperties = scenario.properties as Array<Record<string, unknown>>;
      const savedFeeCategories = (scenario.feeCategories as Record<string, Array<Record<string, unknown>>>) || undefined;
      await storage.loadScenario(userId, savedAssumptions, savedProperties, savedFeeCategories);

      logActivity(req, "load", "scenario", scenarioId, scenario.name);
      res.json({ success: true, message: "Scenario loaded successfully" });
    } catch (error) {
      console.error("Error loading scenario:", error);
      res.status(500).json({ error: "Failed to load scenario" });
    }
  });

  // Update scenario (rename)
  app.patch("/api/scenarios/:id", requireManagementAccess, async (req, res) => {
    try {
      const userId = req.user!.id;
      const scenarioId = parseInt(req.params.id as string);
      if (isNaN(scenarioId)) {
        return res.status(400).json({ error: "Invalid scenario ID" });
      }

      const validation = updateScenarioSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }

      const scenario = await storage.getScenario(scenarioId);
      if (!scenario) {
        return res.status(404).json({ error: "Scenario not found" });
      }

      if (scenario.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updated = await storage.updateScenario(scenarioId, validation.data);
      res.json(updated);
    } catch (error) {
      console.error("Error updating scenario:", error);
      res.status(500).json({ error: "Failed to update scenario" });
    }
  });

  // Delete scenario (cannot delete Base scenario)
  app.delete("/api/scenarios/:id", requireManagementAccess, async (req, res) => {
    try {
      const userId = req.user!.id;
      const scenarioId = parseInt(req.params.id as string);
      if (isNaN(scenarioId)) {
        return res.status(400).json({ error: "Invalid scenario ID" });
      }

      const scenario = await storage.getScenario(scenarioId);
      if (!scenario) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      
      if (scenario.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      if (scenario.name === "Base") {
        return res.status(400).json({ error: "Cannot delete the Base scenario" });
      }
      
      await storage.deleteScenario(scenarioId);
      logActivity(req, "delete", "scenario", scenarioId, scenario.name);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting scenario:", error);
      res.status(500).json({ error: "Failed to delete scenario" });
    }
  });

  // --- LOGO PORTFOLIO ROUTES (Admin only) ---
  
  app.get("/api/admin/logos", requireAdmin, async (req, res) => {
    try {
      const allLogos = await storage.getAllLogos();
      res.json(allLogos);
    } catch (error) {
      console.error("Error fetching logos:", error);
      res.status(500).json({ error: "Failed to fetch logos" });
    }
  });

  app.post("/api/admin/logos", requireAdmin, async (req, res) => {
    try {
      const validation = insertLogoSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }
      const logo = await storage.createLogo(validation.data);
      res.json(logo);
    } catch (error) {
      console.error("Error creating logo:", error);
      res.status(500).json({ error: "Failed to create logo" });
    }
  });

  app.delete("/api/admin/logos/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid logo ID" });
      const existing = await storage.getLogo(id);
      if (!existing) return res.status(404).json({ error: "Logo not found" });
      if (existing.isDefault) return res.status(400).json({ error: "Cannot delete the default logo" });
      await storage.deleteLogo(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting logo:", error);
      res.status(500).json({ error: "Failed to delete logo" });
    }
  });

  // --- ASSET DESCRIPTIONS ROUTES (Admin only) ---

  app.get("/api/admin/asset-descriptions", requireAdmin, async (req, res) => {
    try {
      const all = await storage.getAllAssetDescriptions();
      res.json(all);
    } catch (error) {
      console.error("Error fetching asset descriptions:", error);
      res.status(500).json({ error: "Failed to fetch asset descriptions" });
    }
  });

  app.post("/api/admin/asset-descriptions", requireAdmin, async (req, res) => {
    try {
      const { insertAssetDescriptionSchema } = await import("@shared/schema");
      const validation = insertAssetDescriptionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }
      const ad = await storage.createAssetDescription(validation.data);
      res.json(ad);
    } catch (error) {
      console.error("Error creating asset description:", error);
      res.status(500).json({ error: "Failed to create asset description" });
    }
  });

  app.delete("/api/admin/asset-descriptions/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      const existing = await storage.getAssetDescription(id);
      if (!existing) return res.status(404).json({ error: "Asset description not found" });
      if (existing.isDefault) return res.status(400).json({ error: "Cannot delete the default asset description" });
      await storage.deleteAssetDescription(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting asset description:", error);
      res.status(500).json({ error: "Failed to delete asset description" });
    }
  });


  // --- USER GROUPS ROUTES ---

  app.get("/api/admin/user-groups", requireAdmin, async (req, res) => {
    try {
      const groups = await storage.getAllUserGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching user groups:", error);
      res.status(500).json({ error: "Failed to fetch user groups" });
    }
  });

  app.post("/api/admin/user-groups", requireAdmin, async (req, res) => {
    try {
      const { insertUserGroupSchema } = await import("@shared/schema");
      const validation = insertUserGroupSchema.safeParse(req.body);
      if (!validation.success) return res.status(400).json({ error: validation.error.message });
      const group = await storage.createUserGroup(validation.data);
      res.json(group);
    } catch (error) {
      console.error("Error creating user group:", error);
      res.status(500).json({ error: "Failed to create user group" });
    }
  });

  app.patch("/api/admin/user-groups/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid group ID" });
      const { insertUserGroupSchema } = await import("@shared/schema");
      const validation = insertUserGroupSchema.partial().safeParse(req.body);
      if (!validation.success) return res.status(400).json({ error: fromZodError(validation.error).message });
      const group = await storage.updateUserGroup(id, validation.data);
      res.json(group);
    } catch (error) {
      console.error("Error updating user group:", error);
      res.status(500).json({ error: "Failed to update user group" });
    }
  });

  app.delete("/api/admin/user-groups/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid group ID" });
      await storage.deleteUserGroup(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting user group:", error);
      if (error.message?.includes("Cannot delete")) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to delete user group" });
      }
    }
  });

  app.patch("/api/admin/users/:id/group", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid user ID" });
      const { groupId } = req.body;
      const user = await storage.assignUserToGroup(id, groupId ?? null);
      res.json(user);
    } catch (error) {
      console.error("Error assigning user to group:", error);
      res.status(500).json({ error: "Failed to assign user to group" });
    }
  });

  // Company CRUD routes
  app.get("/api/admin/companies", requireAdmin, async (req, res) => {
    try {
      const allCompanies = await storage.getAllCompanies();
      res.json(allCompanies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  app.post("/api/admin/companies", requireAdmin, async (req, res) => {
    try {
      const { name, type, description, logoId } = req.body;
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ error: "Company name is required" });
      }
      const company = await storage.createCompany({ name: name.trim(), type: type || "spv", description: description || null, logoId: logoId ?? null });
      logActivity(req, "create", "company", company.id, company.name);
      res.json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ error: "Failed to create company" });
    }
  });

  app.patch("/api/admin/companies/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid company ID" });
      const company = await storage.updateCompany(id, req.body);
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ error: "Failed to update company" });
    }
  });

  app.delete("/api/admin/companies/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid company ID" });
      await storage.deleteCompany(id);
      logActivity(req, "delete", "company", id, "");
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ error: "Failed to delete company" });
    }
  });

  // Public companies list (for dropdowns, any authenticated user)
  app.get("/api/companies", requireAuth, async (req, res) => {
    try {
      const allCompanies = await storage.getAllCompanies();
      res.json(allCompanies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  app.get("/api/my-branding", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      let logoUrl: string | null = null;
      let themeName: string | null = null;
      let themeColors: Array<{ rank: number; name: string; hexCode: string; description: string }> | null = null;
      let assetDescriptionName: string | null = null;
      let groupCompanyName: string | null = null;

      let group: Awaited<ReturnType<typeof storage.getUserGroup>> | undefined;
      if (user.userGroupId) {
        group = await storage.getUserGroup(user.userGroupId);
      }

      let resolvedLogo: Awaited<ReturnType<typeof storage.getLogo>> | undefined;
      if (group?.logoId) {
        resolvedLogo = await storage.getLogo(group.logoId) ?? undefined;
      }
      if (!resolvedLogo) {
        resolvedLogo = await storage.getDefaultLogo() ?? undefined;
      }
      if (resolvedLogo) {
        logoUrl = resolvedLogo.url;
        groupCompanyName = resolvedLogo.companyName;
      }

      if (user.selectedThemeId) {
        const selectedTheme = await storage.getDesignTheme(user.selectedThemeId);
        if (selectedTheme) {
          themeName = selectedTheme.name;
          themeColors = selectedTheme.colors;
        } else {
          await storage.updateUserSelectedTheme(user.id, null);
        }
      }
      if (!themeName && group?.themeId) {
        const theme = await storage.getDesignTheme(group.themeId);
        if (theme) {
          themeName = theme.name;
          themeColors = theme.colors;
        }
      }
      if (!themeName) {
        const defaultTheme = await storage.getDefaultDesignTheme();
        if (defaultTheme) {
          themeName = defaultTheme.name;
          themeColors = defaultTheme.colors;
        }
      }

      if (group?.assetDescriptionId) {
        const ad = await storage.getAssetDescription(group.assetDescriptionId);
        if (ad) assetDescriptionName = ad.name;
      }
      if (!assetDescriptionName) {
        const defaultAd = await storage.getDefaultAssetDescription();
        if (defaultAd) assetDescriptionName = defaultAd.name;
      }

      res.json({ logoUrl, themeName, themeColors, assetDescriptionName, groupCompanyName, selectedThemeId: user.selectedThemeId || null });
    } catch (error) {
      console.error("Error fetching branding:", error);
      res.status(500).json({ error: "Failed to fetch branding" });
    }
  });

  // --- DESIGN THEMES ROUTES (standalone, like logos) ---

  app.get("/api/design-themes", requireAdmin, async (req, res) => {
    try {
      const themes = await storage.getAllDesignThemes();
      res.json(themes);
    } catch (error) {
      console.error("Error fetching design themes:", error);
      res.status(500).json({ error: "Failed to fetch design themes" });
    }
  });

  app.post("/api/design-themes", requireAdmin, async (req, res) => {
    try {
      const validation = insertDesignThemeSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }
      const theme = await storage.createDesignTheme(validation.data);
      logActivity(req, "create", "design_theme", theme.id, theme.name);
      res.json(theme);
    } catch (error) {
      console.error("Error creating design theme:", error);
      res.status(500).json({ error: "Failed to create design theme" });
    }
  });

  app.patch("/api/design-themes/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid theme ID" });

      const existing = await storage.getDesignTheme(id);
      if (!existing) return res.status(404).json({ error: "Theme not found" });

      const validation = insertDesignThemeSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }
      const theme = await storage.updateDesignTheme(id, validation.data);
      logActivity(req, "update", "design_theme", id, theme?.name ?? existing.name);
      res.json(theme);
    } catch (error) {
      console.error("Error updating design theme:", error);
      res.status(500).json({ error: "Failed to update design theme" });
    }
  });

  app.delete("/api/design-themes/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid theme ID" });

      const existing = await storage.getDesignTheme(id);
      if (!existing) return res.status(404).json({ error: "Theme not found" });
      if (existing.isDefault) return res.status(400).json({ error: "Cannot delete the default theme" });

      await storage.deleteDesignTheme(id);
      logActivity(req, "delete", "design_theme", id, existing.name);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting design theme:", error);
      res.status(500).json({ error: "Failed to delete design theme" });
    }
  });

  // --- MARKET RESEARCH ROUTES ---
  
  app.get("/api/research/:type", requireAuth, async (req, res) => {
    try {
      const { type } = req.params;
      if (!VALID_RESEARCH_TYPES.includes(type as any)) {
        return res.status(400).json({ error: "Invalid research type. Must be 'property', 'company', or 'global'." });
      }
      let propertyId: number | undefined;
      if (req.query.propertyId) {
        propertyId = parseInt(req.query.propertyId as string);
        if (isNaN(propertyId)) {
          return res.status(400).json({ error: "Invalid property ID" });
        }
      }
      const userId = req.user!.id;
      const research = await storage.getMarketResearch(type as string, userId, propertyId);
      res.json(research || null);
    } catch (error) {
      console.error("Error fetching research:", error);
      res.status(500).json({ error: "Failed to fetch research" });
    }
  });
  
  app.post("/api/research/generate", requireAuth, async (req, res) => {
    try {
      const validation = researchGenerateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }
      const { type, propertyId, propertyContext, assetDefinition: clientAssetDef } = validation.data;
      const userId = req.user!.id;

      if (isApiRateLimited(userId, "research/generate", 10)) {
        return res.status(429).json({ error: "Too many research requests. Please wait a minute." });
      }
      
      const globalAssumptions = await storage.getGlobalAssumptions(userId);
      const preferredModel = globalAssumptions?.preferredLlm || "claude-sonnet-4-5";
      const assetDef = clientAssetDef || (globalAssumptions?.assetDefinition as any) || {
        minRooms: 10, maxRooms: 80, hasFB: true, hasEvents: true, hasWellness: true, minAdr: 150, maxAdr: 600,
        level: "luxury", eventLocations: 2, maxEventCapacity: 150, acreage: 5, privacyLevel: "high", parkingSpaces: 50,
        description: "Independently operated, design-forward properties with curated guest experiences."
      };
      
      const researchParams: ResearchParams = {
        type: type as "property" | "company" | "global",
        propertyLabel: globalAssumptions?.propertyLabel || "Boutique Hotel",
        propertyContext: propertyContext as ResearchParams["propertyContext"],
        assetDefinition: assetDef,
      };
      
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      
      let fullResponse = "";
      const isGeminiModel = preferredModel.startsWith("gemini");
      const isClaudeModel = preferredModel.startsWith("claude");
      
      if (isClaudeModel) {
        const anthropic = new Anthropic({
          apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
          baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
        });
        
        for await (const chunk of generateResearchWithToolsStream(researchParams, anthropic, preferredModel)) {
          if (chunk.type === "content" && chunk.data) {
            fullResponse += chunk.data;
            res.write(`data: ${JSON.stringify({ content: chunk.data })}\n\n`);
          }
        }
      } else if (isGeminiModel) {
        const systemPrompt = loadSkill(type);
        const userPrompt = buildUserPrompt(researchParams);
        
        const gemini = new GoogleGenAI({
          apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
          httpOptions: {
            apiVersion: "",
            baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
          },
        });
        
        const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
        const stream = await gemini.models.generateContentStream({
          model: preferredModel,
          contents: combinedPrompt,
        });
        
        for await (const chunk of stream) {
          const content = chunk.text || "";
          if (content) {
            fullResponse += content;
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }
      } else {
        const systemPrompt = loadSkill(type);
        const userPrompt = buildUserPrompt(researchParams);
        
        const openai = new OpenAI({
          apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
          baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
        });
        
        const stream = await openai.chat.completions.create({
          model: preferredModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          stream: true,
          max_completion_tokens: 4096,
          response_format: { type: "json_object" },
        });
        
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullResponse += content;
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }
      }
      
      let parsedContent: Record<string, any> = {};
      try {
        const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                          fullResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          parsedContent = JSON.parse(jsonStr);
        } else {
          parsedContent = { rawResponse: fullResponse };
        }
      } catch {
        parsedContent = { rawResponse: fullResponse };
      }
      
      const title = type === "property" ? `Market Research: ${propertyContext?.name || "Property"}` :
                     type === "company" ? "Management Company Research" :
                     "Global Industry Research";
      
      const saved = await storage.upsertMarketResearch({
        userId,
        type,
        propertyId: propertyId || null,
        title,
        content: parsedContent,
        llmModel: preferredModel,
      });
      
      res.write(`data: ${JSON.stringify({ done: true, researchId: saved.id })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error generating research:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to generate research" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to generate research" });
      }
    }
  });

  // --- PROPERTY FINDER ROUTES ---
  
  app.get("/api/property-finder/search", requireManagementAccess, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      if (isApiRateLimited(userId, "property-finder/search", 30)) {
        return res.status(429).json({ error: "Too many search requests. Please wait a minute." });
      }
      const apiKey = process.env.RAPIDAPI_KEY;
      if (!apiKey) {
        return res.status(400).json({ 
          error: "no_api_key",
          message: "RapidAPI key not configured. Add your RAPIDAPI_KEY in the Secrets tab to enable property search." 
        });
      }
      
      const searchQuerySchema = z.object({
        location: z.string().min(1, "Location is required").max(200),
        priceMin: z.coerce.number().int().min(0).optional(),
        priceMax: z.coerce.number().int().min(0).optional(),
        bedsMin: z.coerce.number().int().min(0).optional(),
        lotSizeMin: z.coerce.number().min(0).optional(),
        propertyType: z.string().max(50).optional(),
        offset: z.coerce.number().int().min(0).optional(),
      });
      const searchParsed = searchQuerySchema.safeParse(req.query);
      if (!searchParsed.success) {
        return res.status(400).json({ error: fromZodError(searchParsed.error).message });
      }

      const { location } = searchParsed.data;
      const parsedPriceMin = searchParsed.data.priceMin;
      const parsedPriceMax = searchParsed.data.priceMax;
      const parsedBedsMin = searchParsed.data.bedsMin;
      const parsedLotSizeMin = searchParsed.data.lotSizeMin;
      const parsedOffset = searchParsed.data.offset ?? 0;
      const propertyType = searchParsed.data.propertyType;

      const searchUrl = "https://realty-in-us.p.rapidapi.com/properties/v3/list";

      const filters: any[] = [];

      if (parsedPriceMin || parsedPriceMax) {
        const priceFilter: any = { type: "sold" };
        if (parsedPriceMin && !isNaN(parsedPriceMin)) priceFilter.min = parsedPriceMin;
        if (parsedPriceMax && !isNaN(parsedPriceMax)) priceFilter.max = parsedPriceMax;
        filters.push(priceFilter);
      }

      const payload: any = {
        limit: 20,
        offset: !isNaN(parsedOffset) ? parsedOffset : 0,
        status: ["for_sale"],
        sort: { direction: "desc", field: "list_date" },
      };

      if (/^\d{5}$/.test(location as string)) {
        payload.postal_code = location;
      } else {
        const parts = (location as string).split(",").map((s: string) => s.trim());
        if (parts.length >= 2) {
          payload.city = parts[0];
          payload.state_code = parts[1].toUpperCase().substring(0, 2);
        } else {
          payload.city = location;
        }
      }

      const listPrice: any = {};
      if (parsedPriceMin && !isNaN(parsedPriceMin)) listPrice.min = parsedPriceMin;
      if (parsedPriceMax && !isNaN(parsedPriceMax)) listPrice.max = parsedPriceMax;
      if (Object.keys(listPrice).length > 0) {
        payload.list_price = listPrice;
      }

      if (parsedBedsMin && !isNaN(parsedBedsMin)) {
        payload.beds_min = parsedBedsMin;
      }

      if (parsedLotSizeMin && !isNaN(parsedLotSizeMin)) {
        payload.lot_sqft_min = Math.round(parsedLotSizeMin * 43560);
      }

      if (propertyType && propertyType !== "any") {
        payload.type = [propertyType];
      }

      const response = await fetch(searchUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "realty-in-us.p.rapidapi.com",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("RapidAPI error:", response.status, errorText);
        return res.status(response.status).json({ error: "Property search failed. Check your API key." });
      }

      const data = await response.json();
      const results = data?.data?.home_search?.results || [];
      const totalCount = data?.data?.home_search?.total || 0;

      const normalized = results.map((r: any) => {
        const propertyId = r.property_id || r.listing_id || null;
        const href = r.href || r.permalink || null;

        let listingUrl: string | null = null;
        if (href && typeof href === "string") {
          const path = href.startsWith("/") ? href : `/${href}`;
          if (/^\/realestateandhomes-detail\//.test(path)) {
            listingUrl = `https://www.realtor.com${path}`;
          }
        }
        if (!listingUrl && propertyId && typeof propertyId === "string" && /^M?\d/.test(propertyId)) {
          const addr = r.location?.address;
          if (addr?.line && addr?.city && addr?.state_code && addr?.postal_code) {
            const slug = [addr.line, addr.city, addr.state_code, addr.postal_code]
              .map((s: string) => s.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, ""))
              .join("_");
            listingUrl = `https://www.realtor.com/realestateandhomes-detail/${slug}_${propertyId}`;
          }
        }

        return {
          externalId: propertyId || String(Math.random()),
          address: [r.location?.address?.line, r.location?.address?.city, r.location?.address?.state_code].filter(Boolean).join(", "),
          city: r.location?.address?.city || null,
          state: r.location?.address?.state_code || null,
          zipCode: r.location?.address?.postal_code || null,
          price: r.list_price || null,
          beds: r.description?.beds || null,
          baths: r.description?.baths || null,
          sqft: r.description?.sqft || null,
          lotSizeAcres: r.description?.lot_sqft ? Math.round((r.description.lot_sqft / 43560) * 100) / 100 : null,
          propertyType: r.description?.type || null,
          imageUrl: r.primary_photo?.href || null,
          listingUrl,
        };
      });

      res.json({ results: normalized, total: totalCount, offset: parsedOffset });
    } catch (error) {
      console.error("Property search error:", error);
      res.status(500).json({ error: "Property search failed" });
    }
  });

  app.get("/api/property-finder/favorites", requireManagementAccess, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const favorites = await storage.getProspectiveProperties(userId);

      for (const item of favorites as any[]) {
        if (item.listingUrl && typeof item.listingUrl === "string") {
          const isValidRealtorUrl = /^https:\/\/www\.realtor\.com\/realestateandhomes-detail\//.test(item.listingUrl);
          if (!isValidRealtorUrl) {
            item.listingUrl = null;
          }
        }
      }

      res.json(favorites);
    } catch (error) {
      console.error("Get favorites error:", error);
      res.status(500).json({ error: "Failed to load saved properties" });
    }
  });

  app.post("/api/property-finder/favorites", requireManagementAccess, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const validation = insertProspectivePropertySchema.safeParse({ ...req.body, userId });
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }
      const saved = await storage.addProspectiveProperty(validation.data);
      res.json(saved);
    } catch (error) {
      console.error("Save favorite error:", error);
      res.status(500).json({ error: "Failed to save property" });
    }
  });

  app.delete("/api/property-finder/favorites/:id", requireManagementAccess, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid property ID" });
      }
      await storage.deleteProspectiveProperty(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete favorite error:", error);
      res.status(500).json({ error: "Failed to remove property" });
    }
  });

  app.patch("/api/property-finder/favorites/:id/notes", requireManagementAccess, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid property ID" });
      }
      const { notes } = req.body;
      const updated = await storage.updateProspectivePropertyNotes(id, userId, notes || "");
      res.json(updated);
    } catch (error) {
      console.error("Update notes error:", error);
      res.status(500).json({ error: "Failed to update notes" });
    }
  });

  // --- Saved Searches ---
  app.get("/api/property-finder/saved-searches", requireManagementAccess, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const searches = await storage.getSavedSearches(userId);
      res.json(searches);
    } catch (error) {
      console.error("Get saved searches error:", error);
      res.status(500).json({ error: "Failed to fetch saved searches" });
    }
  });

  app.post("/api/property-finder/saved-searches", requireManagementAccess, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const validation = insertSavedSearchSchema.safeParse({ ...req.body, userId });
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }
      const search = await storage.addSavedSearch(validation.data);
      res.json(search);
    } catch (error) {
      console.error("Save search error:", error);
      res.status(500).json({ error: "Failed to save search" });
    }
  });

  app.delete("/api/property-finder/saved-searches/:id", requireManagementAccess, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid search ID" });
      }
      await storage.deleteSavedSearch(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete saved search error:", error);
      res.status(500).json({ error: "Failed to delete saved search" });
    }
  });

  // --- ACTIVITY LOG ENDPOINTS ---

  /** Admin: query activity logs with optional filters. */
  app.get("/api/admin/activity-logs", requireAdmin, async (req, res) => {
    try {
      const querySchema = z.object({
        userId: z.coerce.number().int().positive().optional(),
        entityType: z.string().max(50).optional(),
        from: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
        to: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
        limit: z.coerce.number().int().min(1).max(200).optional(),
        offset: z.coerce.number().int().min(0).optional(),
      });
      const parsed = querySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).message });
      }
      const filters: ActivityLogFilters = {};
      if (parsed.data.userId) filters.userId = parsed.data.userId;
      if (parsed.data.entityType) filters.entityType = parsed.data.entityType;
      if (parsed.data.from) filters.from = new Date(parsed.data.from);
      if (parsed.data.to) filters.to = new Date(parsed.data.to);
      if (parsed.data.limit) filters.limit = parsed.data.limit;
      if (parsed.data.offset) filters.offset = parsed.data.offset;

      const logs = await storage.getActivityLogs(filters);
      res.json(logs.map(log => ({
        id: log.id,
        userId: log.userId,
        userEmail: log.user.email,
        userName: log.user.name,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        entityName: log.entityName,
        metadata: log.metadata,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
      })));
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  /** Admin: get checker-role activity summary for analytics. */
  app.get("/api/admin/checker-activity", requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const checkerUsers = allUsers.filter(u => u.role === "checker");
      const checkerIds = checkerUsers.map(u => u.id);
      
      if (checkerIds.length === 0) {
        return res.json({ checkers: [], summary: { totalActions: 0, verificationRuns: 0, manualViews: 0, exports: 0, pageVisits: 0 } });
      }
      
      const allLogs: Array<{id: number; userId: number; action: string; entityType: string; entityId: number | null; entityName: string | null; metadata: unknown; ipAddress: string | null; createdAt: Date; user: {email: string; name: string | null}}> = [];
      for (const checkerId of checkerIds) {
        const logs = await storage.getActivityLogs({ userId: checkerId, limit: 200 });
        allLogs.push(...logs);
      }
      
      const summary = {
        totalActions: allLogs.length,
        verificationRuns: allLogs.filter(l => l.action === "run" && l.entityType === "verification").length,
        manualViews: allLogs.filter(l => l.action === "view" && l.entityType === "checker_manual").length,
        exports: allLogs.filter(l => l.action.includes("export")).length,
        pageVisits: allLogs.filter(l => l.action === "view").length,
        roleChanges: allLogs.filter(l => l.action === "role_change").length,
      };
      
      const checkerSummaries = checkerUsers.map(u => {
        const userLogs = allLogs.filter(l => l.userId === u.id);
        return {
          id: u.id,
          email: u.email,
          name: u.name,
          totalActions: userLogs.length,
          lastActive: userLogs.length > 0 ? userLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt : null,
          verificationRuns: userLogs.filter(l => l.action === "run" && l.entityType === "verification").length,
          manualViews: userLogs.filter(l => l.action === "view" && l.entityType === "checker_manual").length,
          exports: userLogs.filter(l => l.action.includes("export")).length,
        };
      });
      
      res.json({
        checkers: checkerSummaries,
        summary,
        recentActivity: allLogs
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 50)
          .map(log => ({
            id: log.id,
            userId: log.userId,
            userEmail: log.user.email,
            userName: log.user.name,
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            entityName: log.entityName,
            metadata: log.metadata,
            createdAt: log.createdAt,
          })),
      });
    } catch (error) {
      console.error("Error fetching checker activity:", error);
      res.status(500).json({ error: "Failed to fetch checker activity" });
    }
  });

  /** User: get own activity logs. */
  app.get("/api/activity-logs/mine", requireAuth, async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const logs = await storage.getUserActivityLogs(req.user!.id, limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching user activity logs:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  const manualLogMetadataSchema = z.object({
    exportType: z.string().max(50).optional(),
    sectionCount: z.number().int().nonnegative().optional(),
    exportedAt: z.string().max(50).optional(),
    status: z.string().max(50).optional(),
    propertyCount: z.number().int().nonnegative().optional(),
    statementsGenerated: z.number().int().nonnegative().optional(),
    companyIncluded: z.boolean().optional(),
    warningCount: z.number().int().nonnegative().optional(),
    warnings: z.array(z.string().max(200)).max(50).optional(),
    projectionYears: z.number().int().nonnegative().optional(),
  }).strict().optional();

  const manualLogBodySchema = z.object({
    action: z.string().max(50),
    metadata: manualLogMetadataSchema,
  });

  /** Log checker manual activity (view, export) with validated audit metadata. */
  app.post("/api/activity-logs/manual-view", requireAuth, async (req, res) => {
    try {
      const rawBody = JSON.stringify(req.body);
      if (rawBody && rawBody.length > 4096) {
        return res.status(400).json({ error: "Payload too large" });
      }

      const parsed = manualLogBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid log payload", details: parsed.error.issues.map(i => i.message) });
      }

      const { action, metadata } = parsed.data;
      const validActions = ["view", "export-manual-pdf", "full-data-export", "expand-section"];
      const sanitizedAction = validActions.includes(action) ? action : "view";
      const auditMeta: Record<string, unknown> = {
        userRole: req.user?.role || "unknown",
        timestamp: new Date().toISOString(),
        ...(metadata || {}),
      };
      logActivity(req, sanitizedAction, "checker_manual", undefined, undefined, auditMeta);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to log activity" });
    }
  });

  // --- VERIFICATION HISTORY ENDPOINTS ---

  /** Admin: list recent verification runs (summary, no full results). */
  app.get("/api/admin/verification-history", requireAdmin, async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const runs = await storage.getVerificationRuns(limit);
      res.json(runs);
    } catch (error) {
      console.error("Error fetching verification history:", error);
      res.status(500).json({ error: "Failed to fetch verification history" });
    }
  });

  /** Admin: get full detail for a single verification run. */
  app.get("/api/admin/verification-history/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid verification run ID" });
      }
      const run = await storage.getVerificationRun(id);
      if (!run) {
        return res.status(404).json({ error: "Verification run not found" });
      }
      res.json(run);
    } catch (error) {
      console.error("Error fetching verification run:", error);
      res.status(500).json({ error: "Failed to fetch verification run" });
    }
  });

  // --- SESSION MANAGEMENT ENDPOINTS ---

  /** Admin: list all active (non-expired) sessions with user info. */
  app.get("/api/admin/active-sessions", requireAdmin, async (req, res) => {
    try {
      const sessions = await storage.getActiveSessions();
      res.json(sessions.map(s => ({
        id: s.id,
        userId: s.userId,
        userEmail: s.user.email,
        userName: s.user.name,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      })));
    } catch (error) {
      console.error("Error fetching active sessions:", error);
      res.status(500).json({ error: "Failed to fetch active sessions" });
    }
  });

  /** Admin: force-logout a session by deleting it. */
  app.delete("/api/admin/sessions/:sessionId", requireAdmin, async (req, res) => {
    try {
      const sessionId = req.params.sessionId as string;
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID is required" });
      }
      await storage.forceDeleteSession(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error force-deleting session:", error);
      res.status(500).json({ error: "Failed to delete session" });
    }
  });

  // --- SCENARIO EXPORT / IMPORT / CLONE / COMPARE ENDPOINTS ---

  /** Export a scenario as downloadable JSON (excludes images for size). */
  app.get("/api/scenarios/:id/export", requireManagementAccess, async (req, res) => {
    try {
      const userId = req.user!.id;
      const scenarioId = parseInt(req.params.id as string);
      if (isNaN(scenarioId)) {
        return res.status(400).json({ error: "Invalid scenario ID" });
      }

      const scenario = await storage.getScenario(scenarioId);
      if (!scenario) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      if (scenario.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Build export payload without images (they're large base64 blobs)
      const exportData = {
        name: scenario.name,
        description: scenario.description,
        exportedAt: new Date().toISOString(),
        globalAssumptions: scenario.globalAssumptions,
        properties: scenario.properties,
      };

      logActivity(req, "export", "scenario", scenarioId, scenario.name);

      res.setHeader("Content-Disposition", `attachment; filename="${scenario.name.replace(/[^a-zA-Z0-9-_ ]/g, "")}.json"`);
      res.setHeader("Content-Type", "application/json");
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting scenario:", error);
      res.status(500).json({ error: "Failed to export scenario" });
    }
  });

  /** Import a scenario from JSON upload. Validates structure before creating. */
  app.post("/api/scenarios/import", requireManagementAccess, async (req, res) => {
    try {
      const userId = req.user!.id;

      const importCount = (await storage.getScenariosByUser(userId)).length;
      if (importCount >= MAX_SCENARIOS_PER_USER) {
        return res.status(400).json({ error: `Maximum of ${MAX_SCENARIOS_PER_USER} scenarios per user reached. Delete an existing scenario to import a new one.` });
      }

      const { name, description, globalAssumptions: ga, properties: props } = req.body;

      if (!name || typeof name !== "string") {
        return res.status(400).json({ error: "Scenario name is required" });
      }
      if (!ga || typeof ga !== "object") {
        return res.status(400).json({ error: "globalAssumptions object is required" });
      }
      if (!Array.isArray(props)) {
        return res.status(400).json({ error: "properties array is required" });
      }

      const existingScenarios = await storage.getScenariosByUser(userId);
      const existingNames = new Set(existingScenarios.map(s => s.name));
      let importName = name.trim();
      if (existingNames.has(importName)) {
        let suffix = 2;
        while (existingNames.has(`${importName} (${suffix})`)) {
          suffix++;
        }
        importName = `${importName} (${suffix})`;
      }

      const scenario = await storage.createScenario({
        userId,
        name: importName,
        description: description || null,
        globalAssumptions: ga as any,
        properties: props as any,
      });

      logActivity(req, "import", "scenario", scenario.id, scenario.name);
      res.json(scenario);
    } catch (error) {
      console.error("Error importing scenario:", error);
      res.status(500).json({ error: "Failed to import scenario" });
    }
  });

  /** Clone a scenario — duplicates with " (Copy)" suffix, auto-incrementing if name exists. */
  app.post("/api/scenarios/:id/clone", requireManagementAccess, async (req, res) => {
    try {
      const userId = req.user!.id;
      const scenarioId = parseInt(req.params.id as string);
      if (isNaN(scenarioId)) {
        return res.status(400).json({ error: "Invalid scenario ID" });
      }

      const existingScenarios = await storage.getScenariosByUser(userId);
      if (existingScenarios.length >= MAX_SCENARIOS_PER_USER) {
        return res.status(400).json({ error: `Maximum of ${MAX_SCENARIOS_PER_USER} scenarios per user reached. Delete an existing scenario to clone.` });
      }

      const scenario = await storage.getScenario(scenarioId);
      if (!scenario) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      if (scenario.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const existingNames = new Set(existingScenarios.map(s => s.name));
      let cloneName = `${scenario.name} (Copy)`;
      let suffix = 2;
      while (existingNames.has(cloneName)) {
        cloneName = `${scenario.name} (Copy ${suffix})`;
        suffix++;
      }

      const clone = await storage.createScenario({
        userId,
        name: cloneName,
        description: scenario.description,
        globalAssumptions: scenario.globalAssumptions as any,
        properties: scenario.properties as any,
        scenarioImages: scenario.scenarioImages as any,
      });

      logActivity(req, "clone", "scenario", clone.id, clone.name, { sourceId: scenarioId });
      res.json(clone);
    } catch (error) {
      console.error("Error cloning scenario:", error);
      res.status(500).json({ error: "Failed to clone scenario" });
    }
  });

  /** Compare two scenarios — returns diff of assumptions and properties. */
  app.get("/api/scenarios/:id1/compare/:id2", requireManagementAccess, async (req, res) => {
    try {
      const userId = req.user!.id;
      const id1 = parseInt(req.params.id1 as string);
      const id2 = parseInt(req.params.id2 as string);
      if (isNaN(id1) || isNaN(id2)) {
        return res.status(400).json({ error: "Invalid scenario IDs" });
      }

      const [s1, s2] = await Promise.all([
        storage.getScenario(id1),
        storage.getScenario(id2),
      ]);
      if (!s1 || !s2) {
        return res.status(404).json({ error: "One or both scenarios not found" });
      }
      if (s1.userId !== userId || s2.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Diff assumptions
      const ga1 = (s1.globalAssumptions || {}) as Record<string, any>;
      const ga2 = (s2.globalAssumptions || {}) as Record<string, any>;
      const allAssumptionKeys = Array.from(new Set(Object.keys(ga1).concat(Object.keys(ga2))));
      const assumptionDiffs: Array<{ field: string; scenario1: any; scenario2: any }> = [];
      for (const key of allAssumptionKeys) {
        if (JSON.stringify(ga1[key]) !== JSON.stringify(ga2[key])) {
          assumptionDiffs.push({ field: key, scenario1: ga1[key], scenario2: ga2[key] });
        }
      }

      // Diff properties
      const props1 = ((s1.properties || []) as any[]);
      const props2 = ((s2.properties || []) as any[]);
      const propMap1 = new Map<string, any>(props1.map(p => [p.name, p]));
      const propMap2 = new Map<string, any>(props2.map(p => [p.name, p]));
      const allPropNames = Array.from(new Set(Array.from(propMap1.keys()).concat(Array.from(propMap2.keys()))));

      const propertyDiffs: Array<{ name: string; status: "added" | "removed" | "changed"; changes?: Array<{ field: string; scenario1: any; scenario2: any }> }> = [];
      for (const name of allPropNames) {
        const p1 = propMap1.get(name);
        const p2 = propMap2.get(name);
        if (!p1) {
          propertyDiffs.push({ name, status: "added" });
        } else if (!p2) {
          propertyDiffs.push({ name, status: "removed" });
        } else {
          const allKeys = Array.from(new Set(Object.keys(p1).concat(Object.keys(p2))));
          const changes: Array<{ field: string; scenario1: any; scenario2: any }> = [];
          for (const key of allKeys) {
            if (key === "id" || key === "createdAt" || key === "updatedAt" || key === "userId") continue;
            if (JSON.stringify(p1[key]) !== JSON.stringify(p2[key])) {
              changes.push({ field: key, scenario1: p1[key], scenario2: p2[key] });
            }
          }
          if (changes.length > 0) {
            propertyDiffs.push({ name, status: "changed", changes });
          }
        }
      }

      res.json({
        scenario1: { id: s1.id, name: s1.name },
        scenario2: { id: s2.id, name: s2.name },
        assumptionDiffs,
        propertyDiffs,
      });
    } catch (error) {
      console.error("Error comparing scenarios:", error);
      res.status(500).json({ error: "Failed to compare scenarios" });
    }
  });

  // ──────────────────────────────────────────────────────
  // FINANCING CALCULATOR API ENDPOINTS
  // ──────────────────────────────────────────────────────

  const defaultRounding = { precision: 2, bankers_rounding: false };

  const dscrSchema = z.object({
    noi_annual: z.number().positive(),
    interest_rate_annual: z.number().min(0).max(1),
    term_months: z.number().int().positive(),
    amortization_months: z.number().int().positive(),
    io_months: z.number().int().min(0).optional(),
    min_dscr: z.number().positive(),
    purchase_price: z.number().positive().optional(),
    ltv_max: z.number().min(0).max(1).optional(),
  });

  function calcRateLimit(req: Request, res: Response, endpoint: string): boolean {
    if (isApiRateLimited(req.user!.id, endpoint, 30)) {
      res.status(429).json({ error: "Too many calculation requests. Please wait a minute." });
      return true;
    }
    return false;
  }

  app.post("/api/financing/dscr", requireAuth, async (req, res) => {
    try {
      if (calcRateLimit(req, res, "financing")) return;
      const parsed = dscrSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: fromZodError(parsed.error).message });
      const { computeDSCR } = await import("../calc/financing/dscr-calculator");
      const result = computeDSCR({ ...parsed.data, rounding_policy: defaultRounding });
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Calculation failed" });
    }
  });

  const debtYieldSchema = z.object({
    noi_annual: z.number().positive(),
    loan_amount: z.number().positive().optional(),
    min_debt_yield: z.number().positive().optional(),
    purchase_price: z.number().positive().optional(),
    ltv_max: z.number().min(0).max(1).optional(),
  });

  app.post("/api/financing/debt-yield", requireAuth, async (req, res) => {
    try {
      if (calcRateLimit(req, res, "financing")) return;
      const parsed = debtYieldSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: fromZodError(parsed.error).message });
      const { computeDebtYield } = await import("../calc/financing/debt-yield");
      const result = computeDebtYield({ ...parsed.data, rounding_policy: defaultRounding });
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Calculation failed" });
    }
  });

  const sensitivitySchema = z.object({
    noi_annual: z.number().positive(),
    loan_amount: z.number().positive(),
    interest_rate_annual: z.number().min(0).max(1),
    amortization_months: z.number().int().positive(),
    term_months: z.number().int().positive(),
    io_months: z.number().int().min(0).optional(),
    rate_shocks_bps: z.array(z.number()),
    noi_shocks_pct: z.array(z.number()),
    min_dscr: z.number().positive().optional(),
  });

  app.post("/api/financing/sensitivity", requireAuth, async (req, res) => {
    try {
      if (calcRateLimit(req, res, "financing")) return;
      const parsed = sensitivitySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: fromZodError(parsed.error).message });
      const { computeSensitivity } = await import("../calc/financing/sensitivity");
      const result = computeSensitivity({ ...parsed.data, rounding_policy: defaultRounding });
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Calculation failed" });
    }
  });

  const prepaymentSchema = z.object({
    outstanding_balance: z.number().positive().optional(),
    prepayment_month: z.number().int().min(0).optional(),
    loan_rate_annual: z.number().min(0).max(1),
    term_months: z.number().int().positive(),
    prepayment_type: z.enum(["yield_maintenance", "step_down", "defeasance"]),
    treasury_rate_annual: z.number().min(0).max(1).optional(),
    step_down_schedule: z.array(z.number()).optional(),
    defeasance_fee_pct: z.number().min(0).optional(),
  });

  app.post("/api/financing/prepayment", requireAuth, async (req, res) => {
    try {
      if (calcRateLimit(req, res, "financing")) return;
      const parsed = prepaymentSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: fromZodError(parsed.error).message });
      const { computePrepayment } = await import("../calc/financing/prepayment");
      const result = computePrepayment({ ...parsed.data, rounding_policy: defaultRounding });
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Calculation failed" });
    }
  });

  // ── Returns Routes ────────────────────────────────────────

  app.post("/api/returns/dcf-npv", requireAuth, (req, res) => {
    try {
      if (calcRateLimit(req, res, "returns")) return;
      const parsed = calcSchemas.dcfSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: fromZodError(parsed.error).message });
      res.json(computeDCF({ ...parsed.data, rounding_policy: defaultRounding }));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Calculation failed" });
    }
  });

  app.post("/api/returns/irr-vector", requireAuth, (req, res) => {
    try {
      if (calcRateLimit(req, res, "returns")) return;
      const parsed = calcSchemas.irrVectorSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: fromZodError(parsed.error).message });
      res.json(buildIRRVector(parsed.data));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Calculation failed" });
    }
  });

  app.post("/api/returns/equity-multiple", requireAuth, (req, res) => {
    try {
      if (calcRateLimit(req, res, "returns")) return;
      const parsed = calcSchemas.equityMultipleSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: fromZodError(parsed.error).message });
      res.json(computeEquityMultiple({ ...parsed.data, rounding_policy: defaultRounding }));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Calculation failed" });
    }
  });

  app.post("/api/returns/exit-valuation", requireAuth, (req, res) => {
    try {
      if (calcRateLimit(req, res, "returns")) return;
      const parsed = calcSchemas.exitValuationSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: fromZodError(parsed.error).message });
      res.json(computeExitValuation({ ...parsed.data, rounding_policy: defaultRounding }));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Calculation failed" });
    }
  });

  // ── Validation Routes ──────────────────────────────────────

  app.post("/api/validation/financial-identities", requireChecker, (req, res) => {
    try {
      if (calcRateLimit(req, res, "validation")) return;
      const parsed = calcSchemas.financialIdentitiesSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: fromZodError(parsed.error).message });
      res.json(validateFinancialIdentities({ ...parsed.data, rounding_policy: defaultRounding }));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Calculation failed" });
    }
  });

  app.post("/api/validation/funding-gates", requireChecker, (req, res) => {
    try {
      if (calcRateLimit(req, res, "validation")) return;
      const parsed = calcSchemas.fundingGatesSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: fromZodError(parsed.error).message });
      res.json(checkFundingGates(parsed.data));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Calculation failed" });
    }
  });

  app.post("/api/validation/schedule-reconcile", requireChecker, (req, res) => {
    try {
      if (calcRateLimit(req, res, "validation")) return;
      const parsed = calcSchemas.scheduleReconcileSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: fromZodError(parsed.error).message });
      res.json(reconcileSchedule(parsed.data));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Calculation failed" });
    }
  });

  app.post("/api/validation/assumption-consistency", requireChecker, (req, res) => {
    try {
      if (calcRateLimit(req, res, "validation")) return;
      const parsed = calcSchemas.assumptionConsistencySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: fromZodError(parsed.error).message });
      res.json(checkAssumptionConsistency(parsed.data));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Calculation failed" });
    }
  });

  app.post("/api/validation/export-verification", requireChecker, (req, res) => {
    try {
      if (calcRateLimit(req, res, "validation")) return;
      const parsed = calcSchemas.exportVerificationSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: fromZodError(parsed.error).message });
      res.json(verifyExport(parsed.data));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Calculation failed" });
    }
  });

  // ── Analysis Routes ────────────────────────────────────────

  app.post("/api/analysis/consolidation", requireChecker, (req, res) => {
    try {
      if (calcRateLimit(req, res, "analysis")) return;
      const parsed = calcSchemas.consolidationSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: fromZodError(parsed.error).message });
      res.json(consolidateStatements({ ...parsed.data, rounding_policy: defaultRounding }));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Calculation failed" });
    }
  });

  app.post("/api/analysis/scenario-compare", requireChecker, (req, res) => {
    try {
      if (calcRateLimit(req, res, "analysis")) return;
      const parsed = calcSchemas.scenarioCompareSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: fromZodError(parsed.error).message });
      res.json(compareScenarios(parsed.data));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Calculation failed" });
    }
  });

  app.post("/api/analysis/break-even", requireChecker, (req, res) => {
    try {
      if (calcRateLimit(req, res, "analysis")) return;
      const parsed = calcSchemas.breakEvenSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: fromZodError(parsed.error).message });
      res.json(computeBreakEven(parsed.data));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Calculation failed" });
    }
  });

  // --- Fee Categories ---
  app.get("/api/properties/:propertyId/fee-categories", requireAuth, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.propertyId);
      if (isNaN(propertyId)) return res.status(400).json({ error: "Invalid property ID" });
      const categories = await storage.getFeeCategoriesByProperty(propertyId);
      if (categories.length === 0) {
        const seeded = await storage.seedDefaultFeeCategories(propertyId);
        return res.json(seeded);
      }
      res.json(categories);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Calculation failed" });
    }
  });

  app.put("/api/properties/:propertyId/fee-categories", requireAuth, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.propertyId);
      if (isNaN(propertyId)) return res.status(400).json({ error: "Invalid property ID" });
      const categories = req.body;
      if (!Array.isArray(categories)) return res.status(400).json({ error: "Expected array of categories" });
      for (const cat of categories) {
        if (typeof cat.name !== "string" || !cat.name.trim()) {
          return res.status(400).json({ error: "Each category must have a non-empty name" });
        }
        if (cat.rate !== undefined && cat.rate !== null) {
          if (typeof cat.rate !== "number" || cat.rate < 0 || cat.rate > 1) {
            return res.status(400).json({ error: `Invalid rate for category "${cat.name}": must be a number between 0 and 1` });
          }
        }
      }
      const results = [];
      for (const cat of categories) {
        if (cat.id) {
          const updated = await storage.updateFeeCategory(cat.id, {
            name: cat.name,
            rate: cat.rate,
            isActive: cat.isActive,
            sortOrder: cat.sortOrder,
          });
          if (updated) results.push(updated);
        } else {
          const created = await storage.createFeeCategory({
            propertyId,
            name: cat.name,
            rate: cat.rate ?? 0,
            isActive: cat.isActive ?? true,
            sortOrder: cat.sortOrder ?? 0,
          });
          results.push(created);
        }
      }
      res.json(results);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Calculation failed" });
    }
  });

  app.get("/api/fee-categories/all", requireAuth, async (req: any, res) => {
    try {
      const categories = await storage.getAllFeeCategories();
      res.json(categories);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Calculation failed" });
    }
  });

  return httpServer;
}
