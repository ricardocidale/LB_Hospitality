import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGlobalAssumptionsSchema, insertPropertySchema, updatePropertySchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { hashPassword, verifyPassword, generateSessionId, setSessionCookie, clearSessionCookie, getSessionExpiryDate, requireAuth, requireAdmin, requireChecker, isRateLimited, recordLoginAttempt, sanitizeEmail, validatePassword } from "./auth";
import { z } from "zod";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { runIndependentVerification, type VerificationReport } from "./calculationChecker";

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  title: z.string().max(100).optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // --- AUTH ROUTES ---
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      
      if (isRateLimited(clientIp)) {
        return res.status(429).json({ error: "Too many login attempts. Please try again in 15 minutes." });
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
      const user = await storage.getUserByEmail("admin");
      if (!user) {
        return res.status(401).json({ error: "Admin user not found" });
      }
      
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) {
        return res.status(401).json({ error: "Admin password not configured" });
      }
      
      const isValid = await verifyPassword(adminPassword, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid admin credentials" });
      }
      
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

  app.get("/api/auth/me", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json({ 
      user: { id: req.user.id, email: req.user.email, name: req.user.name, company: req.user.company, title: req.user.title, role: req.user.role }
    });
  });

  // --- USER PROFILE ROUTES ---
  
  const updateProfileSchema = z.object({
    name: z.string().max(100).optional(),
    email: z.string().email().max(255).optional(),
    company: z.string().max(100).optional(),
    title: z.string().max(100).optional(),
  });

  app.patch("/api/profile", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const validation = updateProfileSchema.safeParse(req.body);
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }
      
      const updates: { name?: string; email?: string; company?: string; title?: string } = {};
      if (validation.data.name !== undefined) updates.name = validation.data.name.trim();
      if (validation.data.email !== undefined) {
        const newEmail = sanitizeEmail(validation.data.email);
        if (newEmail !== req.user.email) {
          const existingUser = await storage.getUserByEmail(newEmail);
          if (existingUser && existingUser.id !== req.user.id) {
            return res.status(400).json({ error: "Email already in use" });
          }
          updates.email = newEmail;
        }
      }
      if (validation.data.company !== undefined) updates.company = validation.data.company.trim();
      if (validation.data.title !== undefined) updates.title = validation.data.title.trim();
      
      const user = await storage.updateUserProfile(req.user.id, updates);
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

  app.patch("/api/profile/password", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const validation = changePasswordSchema.safeParse(req.body);
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }

      const user = await storage.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const validPassword = await verifyPassword(validation.data.currentPassword, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      const newPasswordHash = await hashPassword(validation.data.newPassword);
      await storage.updateUserPassword(req.user.id, newPasswordHash);
      
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
      res.json(users.map(u => ({ id: u.id, email: u.email, name: u.name, company: u.company, title: u.title, role: u.role, createdAt: u.createdAt })));
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
      
      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({ email, passwordHash, role: "user", name, company, title });
      
      res.json({ id: user.id, email: user.email, name: user.name, company: user.company, title: user.title, role: user.role });
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

  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const validation = updateProfileSchema.safeParse(req.body);
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }
      
      const existingUser = await storage.getUserById(id);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const updates: { email?: string; name?: string; company?: string; title?: string } = {};
      if (validation.data.email !== undefined && existingUser.role !== "admin") {
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
      if (validation.data.title !== undefined) updates.title = validation.data.title.trim();
      
      const user = await storage.updateUserProfile(id, updates);
      res.json({ id: user.id, email: user.email, name: user.name, company: user.company, title: user.title, role: user.role });
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
        return res.status(400).json({ error: "Cannot delete admin user" });
      }
      
      await storage.deleteUser(id);
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

  // --- PRODUCTION DATA SEEDING (one-time use) ---
  app.post("/api/admin/seed-production", requireAdmin, async (req, res) => {
    try {
      const results = {
        users: { created: 0, skipped: 0 },
        globalAssumptions: { created: 0, skipped: 0 },
        properties: { created: 0, skipped: 0 },
        designThemes: { created: 0, skipped: 0 }
      };

      // Seed users (skip if already exist)
      const usersToSeed = [
        { email: "admin", passwordHash: "$2b$12$Pn7FR96mt7FWlXE4CVfCZ.J4amO5fnhrVpXa.fw6R.FpR.EJCYR.O", role: "admin" as const, name: "Ricardo Cidale", company: "Norfolk Group", title: "Partner" },
        { email: "rosario@kitcapital.com", passwordHash: "$2b$12$2AtbFcvAfiT2mEYMIXPF0uvwZR764dP2HGtGsq1hfZLgFuYmJ7xaq", role: "user" as const, name: "Rosario David", company: "KIT Capital", title: "COO" },
        { email: "checker", passwordHash: "$2b$12$2nybBrwP6J7IkfAhoyneDev.bO5U2KQIoRsM2txsp2gk7ofVQATMG", role: "user" as const, name: "Checker User" }
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

      // Seed global assumptions (skip if already exist)
      const existingAssumptions = await storage.getGlobalAssumptions();
      if (!existingAssumptions) {
        await storage.upsertGlobalAssumptions({
          modelStartDate: "2026-04-01",
          inflationRate: 0.03,
          baseManagementFee: 0.05,
          incentiveManagementFee: 0.15,
          staffSalary: 75000,
          travelCostPerClient: 12000,
          itLicensePerClient: 3000,
          marketingRate: 0.05,
          miscOpsRate: 0.03,
          officeLeaseStart: 36000,
          professionalServicesStart: 24000,
          techInfraStart: 18000,
          businessInsuranceStart: 12000,
          standardAcqPackage: { monthsToOps: 6, purchasePrice: 2300000, preOpeningCosts: 150000, operatingReserve: 200000, buildingImprovements: 800000 },
          debtAssumptions: { acqLTV: 0.75, refiLTV: 0.75, interestRate: 0.09, amortizationYears: 25, acqClosingCostRate: 0.02, refiClosingCostRate: 0.03 },
          commissionRate: 0.06,
          fullCateringFBBoost: 0.5,
          partialCateringFBBoost: 0.25,
          fixedCostEscalationRate: 0.03,
          safeTranche1Amount: 750000,
          safeTranche1Date: "2026-06-01",
          safeTranche2Amount: 750000,
          safeTranche2Date: "2027-04-01",
          safeValuationCap: 2500000,
          safeDiscountRate: 0.2,
          companyTaxRate: 0.3,
          companyOpsStartDate: "2026-06-01",
          fiscalYearStartMonth: 1,
          partnerCompYear1: 540000, partnerCompYear2: 540000, partnerCompYear3: 540000,
          partnerCompYear4: 600000, partnerCompYear5: 600000, partnerCompYear6: 700000,
          partnerCompYear7: 700000, partnerCompYear8: 800000, partnerCompYear9: 800000, partnerCompYear10: 900000,
          partnerCountYear1: 3, partnerCountYear2: 3, partnerCountYear3: 3, partnerCountYear4: 3, partnerCountYear5: 3,
          partnerCountYear6: 3, partnerCountYear7: 3, partnerCountYear8: 3, partnerCountYear9: 3, partnerCountYear10: 3,
          companyName: "L+B Hospitality Company",
          exitCapRate: 0.085,
          salesCommissionRate: 0.05,
          eventExpenseRate: 0.65,
          otherExpenseRate: 0.6,
          utilitiesVariableSplit: 0.6
        });
        results.globalAssumptions.created++;
      } else {
        results.globalAssumptions.skipped++;
      }

      // Seed properties (skip if already exist by name)
      const propertiesToSeed = [
        { name: "The Hudson Estate", location: "Upstate New York", market: "North America", imageUrl: "/images/property-ny.png", status: "Development", acquisitionDate: "2026-06-01", operationsStartDate: "2026-12-01", purchasePrice: 2300000, buildingImprovements: 800000, preOpeningCosts: 150000, operatingReserve: 200000, roomCount: 20, startAdr: 330, adrGrowthRate: 0.025, startOccupancy: 0.6, maxOccupancy: 0.9, occupancyRampMonths: 6, occupancyGrowthStep: 0.05, stabilizationMonths: 36, type: "Full Equity", cateringLevel: "Partial", costRateRooms: 0.36, costRateFB: 0.15, costRateAdmin: 0.08, costRateMarketing: 0.01, costRatePropertyOps: 0.04, costRateUtilities: 0.05, costRateInsurance: 0.02, costRateTaxes: 0.03, costRateIT: 0.005, costRateFFE: 0.04, revShareEvents: 0.43, revShareFB: 0.22, revShareOther: 0.07, fullCateringPercent: 0.4, partialCateringPercent: 0.3, costRateOther: 0.05, exitCapRate: 0.085, taxRate: 0.25, willRefinance: "Yes", refinanceDate: "2029-12-01" },
        { name: "Eden Summit Lodge", location: "Eden, Utah", market: "North America", imageUrl: "/images/property-utah.png", status: "Acquisition", acquisitionDate: "2027-01-01", operationsStartDate: "2027-07-01", purchasePrice: 2300000, buildingImprovements: 800000, preOpeningCosts: 150000, operatingReserve: 200000, roomCount: 20, startAdr: 390, adrGrowthRate: 0.025, startOccupancy: 0.6, maxOccupancy: 0.9, occupancyRampMonths: 6, occupancyGrowthStep: 0.05, stabilizationMonths: 36, type: "Full Equity", cateringLevel: "Full", costRateRooms: 0.36, costRateFB: 0.15, costRateAdmin: 0.08, costRateMarketing: 0.01, costRatePropertyOps: 0.04, costRateUtilities: 0.05, costRateInsurance: 0.02, costRateTaxes: 0.03, costRateIT: 0.005, costRateFFE: 0.04, revShareEvents: 0.43, revShareFB: 0.22, revShareOther: 0.07, fullCateringPercent: 0.4, partialCateringPercent: 0.3, costRateOther: 0.05, exitCapRate: 0.085, taxRate: 0.25, willRefinance: "Yes", refinanceDate: "2030-07-01" },
        { name: "Austin Hillside", location: "Austin, Texas", market: "North America", imageUrl: "/images/property-austin.png", status: "Acquisition", acquisitionDate: "2027-04-01", operationsStartDate: "2028-01-01", purchasePrice: 2300000, buildingImprovements: 800000, preOpeningCosts: 150000, operatingReserve: 200000, roomCount: 20, startAdr: 270, adrGrowthRate: 0.025, startOccupancy: 0.6, maxOccupancy: 0.9, occupancyRampMonths: 6, occupancyGrowthStep: 0.05, stabilizationMonths: 36, type: "Full Equity", cateringLevel: "Partial", costRateRooms: 0.36, costRateFB: 0.15, costRateAdmin: 0.08, costRateMarketing: 0.01, costRatePropertyOps: 0.04, costRateUtilities: 0.05, costRateInsurance: 0.02, costRateTaxes: 0.03, costRateIT: 0.005, costRateFFE: 0.04, revShareEvents: 0.43, revShareFB: 0.22, revShareOther: 0.07, fullCateringPercent: 0.4, partialCateringPercent: 0.3, costRateOther: 0.05, exitCapRate: 0.085, taxRate: 0.25, willRefinance: "Yes", refinanceDate: "2031-01-01" },
        { name: "Casa Medellín", location: "Medellín, Colombia", market: "Latin America", imageUrl: "/images/property-medellin.png", status: "Acquisition", acquisitionDate: "2026-09-01", operationsStartDate: "2028-07-01", purchasePrice: 3500000, buildingImprovements: 800000, preOpeningCosts: 150000, operatingReserve: 200000, roomCount: 30, startAdr: 180, adrGrowthRate: 0.04, startOccupancy: 0.6, maxOccupancy: 0.9, occupancyRampMonths: 6, occupancyGrowthStep: 0.05, stabilizationMonths: 36, type: "Financed", cateringLevel: "Full", costRateRooms: 0.36, costRateFB: 0.15, costRateAdmin: 0.08, costRateMarketing: 0.01, costRatePropertyOps: 0.04, costRateUtilities: 0.05, costRateInsurance: 0.02, costRateTaxes: 0.03, costRateIT: 0.005, costRateFFE: 0.04, revShareEvents: 0.43, revShareFB: 0.22, revShareOther: 0.07, fullCateringPercent: 0.4, partialCateringPercent: 0.3, costRateOther: 0.05, exitCapRate: 0.085, taxRate: 0.25, acquisitionLTV: 0.75, acquisitionInterestRate: 0.09, acquisitionTermYears: 25, acquisitionClosingCostRate: 0.02 },
        { name: "Blue Ridge Manor", location: "Asheville, North Carolina", market: "North America", imageUrl: "/images/property-asheville.png", status: "Acquisition", acquisitionDate: "2027-07-01", operationsStartDate: "2028-07-01", purchasePrice: 3500000, buildingImprovements: 800000, preOpeningCosts: 150000, operatingReserve: 200000, roomCount: 30, startAdr: 342, adrGrowthRate: 0.025, startOccupancy: 0.6, maxOccupancy: 0.9, occupancyRampMonths: 6, occupancyGrowthStep: 0.05, stabilizationMonths: 36, type: "Financed", cateringLevel: "Full", costRateRooms: 0.36, costRateFB: 0.15, costRateAdmin: 0.08, costRateMarketing: 0.01, costRatePropertyOps: 0.04, costRateUtilities: 0.05, costRateInsurance: 0.02, costRateTaxes: 0.03, costRateIT: 0.005, costRateFFE: 0.04, revShareEvents: 0.43, revShareFB: 0.22, revShareOther: 0.07, fullCateringPercent: 0.4, partialCateringPercent: 0.3, costRateOther: 0.05, exitCapRate: 0.085, taxRate: 0.25, acquisitionLTV: 0.75, acquisitionInterestRate: 0.09, acquisitionTermYears: 25, acquisitionClosingCostRate: 0.02 }
      ];

      const existingProperties = await storage.getAllProperties();
      const existingNames = new Set(existingProperties.map(p => p.name));
      
      for (const propData of propertiesToSeed) {
        if (!existingNames.has(propData.name)) {
          await storage.createProperty(propData);
          results.properties.created++;
        } else {
          results.properties.skipped++;
        }
      }

      // Seed design theme (skip if already exists)
      const existingThemes = await storage.getAllDesignThemes();
      if (existingThemes.length === 0) {
        await storage.createDesignTheme({
          name: "Fluid Glass",
          description: "Inspired by Apple's iOS design language, Fluid Glass creates a sense of depth and dimension through translucent layers, subtle gradients, and smooth animations.",
          isActive: true,
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
      const globalAssumptions = await storage.getGlobalAssumptions();
      const properties = await storage.getAllProperties();
      
      if (!globalAssumptions) {
        return res.status(400).json({ error: "No global assumptions found" });
      }

      const report = runIndependentVerification(properties, globalAssumptions);
      res.json(report);
    } catch (error) {
      console.error("Error running verification:", error);
      res.status(500).json({ error: "Failed to run verification" });
    }
  });

  // AI-powered methodology review (admin or checker)
  app.post("/api/admin/ai-verification", requireChecker, async (req, res) => {
    try {
      const globalAssumptions = await storage.getGlobalAssumptions();
      const properties = await storage.getAllProperties();

      if (!globalAssumptions) {
        return res.status(400).json({ error: "No global assumptions found" });
      }

      const report = runIndependentVerification(properties, globalAssumptions);

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
Global assumptions: Inflation ${(globalAssumptions.inflationRate * 100).toFixed(1)}%, Base fee ${(globalAssumptions.baseManagementFee * 100).toFixed(1)}%, Incentive fee ${(globalAssumptions.incentiveManagementFee * 100).toFixed(1)}%`;

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
        rule: "All colors should be from L+B brand palette",
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
      
      res.json(data);
    } catch (error) {
      console.error("Error fetching global assumptions:", error);
      res.status(500).json({ error: "Failed to fetch global assumptions" });
    }
  });

  app.post("/api/global-assumptions", async (req, res) => {
    try {
      const validation = insertGlobalAssumptionsSchema.safeParse(req.body);
      
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }
      
      const data = await storage.upsertGlobalAssumptions(validation.data);
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
      
      const property = await storage.createProperty(validation.data);
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
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting property:", error);
      res.status(500).json({ error: "Failed to delete property" });
    }
  });

  // Register object storage routes for file uploads
  registerObjectStorageRoutes(app);

  // --- FIX IMAGE URLS ENDPOINT ---
  app.post("/api/fix-images", async (req, res) => {
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
  app.post("/api/seed-production", async (req, res) => {
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
        baseManagementFee: 0.05,
        incentiveManagementFee: 0.15,
        staffSalary: 75000,
        travelCostPerClient: 12000,
        itLicensePerClient: 24000,
        marketingRate: 0.05,
        miscOpsRate: 0.03,
        officeLeaseStart: 36000,
        professionalServicesStart: 24000,
        techInfraStart: 18000,
        businessInsuranceStart: 12000,
        standardAcqPackage: {
          monthsToOps: 6,
          purchasePrice: 2300000,
          preOpeningCosts: 150000,
          operatingReserve: 200000,
          buildingImprovements: 800000
        },
        debtAssumptions: {
          acqLTV: 0.75,
          refiLTV: 0.75,
          interestRate: 0.09,
          amortizationYears: 25,
          acqClosingCostRate: 0.02,
          refiClosingCostRate: 0.03
        },
        commissionRate: 0.06,
        fullCateringFBBoost: 0.5,
        partialCateringFBBoost: 0.25,
        fixedCostEscalationRate: 0.03,
        safeTranche1Amount: 800000,
        safeTranche1Date: "2026-06-01",
        safeTranche2Amount: 800000,
        safeTranche2Date: "2027-04-01",
        safeValuationCap: 2500000,
        safeDiscountRate: 0.2,
        companyTaxRate: 0.3,
        companyOpsStartDate: "2026-06-01",
        fiscalYearStartMonth: 1
      });

      // Seed Properties
      const properties = [
        {
          name: "The Hudson Estate",
          location: "Upstate New York",
          market: "North America",
          imageUrl: "/images/property-ny.png",
          status: "Development",
          acquisitionDate: "2026-06-01",
          operationsStartDate: "2026-12-01",
          purchasePrice: 2300000,
          buildingImprovements: 800000,
          preOpeningCosts: 150000,
          operatingReserve: 200000,
          roomCount: 20,
          startAdr: 330,
          adrGrowthRate: 0.025,
          startOccupancy: 0.6,
          maxOccupancy: 0.9,
          occupancyRampMonths: 6,
          occupancyGrowthStep: 0.05,
          stabilizationMonths: 36,
          type: "Full Equity",
          cateringLevel: "Partial",
          willRefinance: "Yes",
          refinanceDate: "2029-12-01",
          costRateRooms: 0.36,
          costRateFb: 0.15,
          costRateAdmin: 0.08,
          costRateMarketing: 0.05,
          costRatePropertyOps: 0.04,
          costRateUtilities: 0.05,
          costRateInsurance: 0.02,
          costRateTaxes: 0.03,
          costRateIt: 0.02,
          costRateFfe: 0.04,
          revShareEvents: 0.43,
          revShareFb: 0.22,
          revShareOther: 0.07,
          fullCateringPercent: 0.4,
          partialCateringPercent: 0.3,
          costRateOther: 0.05,
          exitCapRate: 0.085,
          taxRate: 0.25
        },
        {
          name: "Eden Summit Lodge",
          location: "Eden, Utah",
          market: "North America",
          imageUrl: "/images/property-utah.png",
          status: "Acquisition",
          acquisitionDate: "2027-01-01",
          operationsStartDate: "2027-07-01",
          purchasePrice: 2300000,
          buildingImprovements: 800000,
          preOpeningCosts: 150000,
          operatingReserve: 200000,
          roomCount: 20,
          startAdr: 390,
          adrGrowthRate: 0.025,
          startOccupancy: 0.6,
          maxOccupancy: 0.9,
          occupancyRampMonths: 6,
          occupancyGrowthStep: 0.05,
          stabilizationMonths: 36,
          type: "Full Equity",
          cateringLevel: "Full",
          willRefinance: "Yes",
          refinanceDate: "2030-07-01",
          costRateRooms: 0.36,
          costRateFb: 0.15,
          costRateAdmin: 0.08,
          costRateMarketing: 0.05,
          costRatePropertyOps: 0.04,
          costRateUtilities: 0.05,
          costRateInsurance: 0.02,
          costRateTaxes: 0.03,
          costRateIt: 0.02,
          costRateFfe: 0.04,
          revShareEvents: 0.43,
          revShareFb: 0.22,
          revShareOther: 0.07,
          fullCateringPercent: 0.4,
          partialCateringPercent: 0.3,
          costRateOther: 0.05,
          exitCapRate: 0.085,
          taxRate: 0.25
        },
        {
          name: "Austin Hillside",
          location: "Austin, Texas",
          market: "North America",
          imageUrl: "/images/property-austin.png",
          status: "Acquisition",
          acquisitionDate: "2027-04-01",
          operationsStartDate: "2028-01-01",
          purchasePrice: 2300000,
          buildingImprovements: 800000,
          preOpeningCosts: 150000,
          operatingReserve: 200000,
          roomCount: 20,
          startAdr: 270,
          adrGrowthRate: 0.025,
          startOccupancy: 0.6,
          maxOccupancy: 0.9,
          occupancyRampMonths: 6,
          occupancyGrowthStep: 0.05,
          stabilizationMonths: 36,
          type: "Full Equity",
          cateringLevel: "Partial",
          willRefinance: "Yes",
          refinanceDate: "2031-01-01",
          costRateRooms: 0.36,
          costRateFb: 0.15,
          costRateAdmin: 0.08,
          costRateMarketing: 0.05,
          costRatePropertyOps: 0.04,
          costRateUtilities: 0.05,
          costRateInsurance: 0.02,
          costRateTaxes: 0.03,
          costRateIt: 0.02,
          costRateFfe: 0.04,
          revShareEvents: 0.43,
          revShareFb: 0.22,
          revShareOther: 0.07,
          fullCateringPercent: 0.4,
          partialCateringPercent: 0.3,
          costRateOther: 0.05,
          exitCapRate: 0.085,
          taxRate: 0.25
        },
        {
          name: "Casa Medellín",
          location: "Medellín, Colombia",
          market: "Latin America",
          imageUrl: "/images/property-medellin.png",
          status: "Acquisition",
          acquisitionDate: "2026-09-01",
          operationsStartDate: "2028-07-01",
          purchasePrice: 3500000,
          buildingImprovements: 800000,
          preOpeningCosts: 150000,
          operatingReserve: 200000,
          roomCount: 30,
          startAdr: 180,
          adrGrowthRate: 0.04,
          startOccupancy: 0.6,
          maxOccupancy: 0.9,
          occupancyRampMonths: 6,
          occupancyGrowthStep: 0.05,
          stabilizationMonths: 36,
          type: "Financed",
          cateringLevel: "Full",
          costRateRooms: 0.36,
          costRateFb: 0.15,
          costRateAdmin: 0.08,
          costRateMarketing: 0.05,
          costRatePropertyOps: 0.04,
          costRateUtilities: 0.05,
          costRateInsurance: 0.02,
          costRateTaxes: 0.03,
          costRateIt: 0.02,
          costRateFfe: 0.04,
          revShareEvents: 0.43,
          revShareFb: 0.22,
          revShareOther: 0.07,
          fullCateringPercent: 0.4,
          partialCateringPercent: 0.3,
          costRateOther: 0.05,
          exitCapRate: 0.085,
          taxRate: 0.25
        },
        {
          name: "Blue Ridge Manor",
          location: "Asheville, North Carolina",
          market: "North America",
          imageUrl: "/images/property-asheville.png",
          status: "Acquisition",
          acquisitionDate: "2027-07-01",
          operationsStartDate: "2028-07-01",
          purchasePrice: 3500000,
          buildingImprovements: 800000,
          preOpeningCosts: 150000,
          operatingReserve: 200000,
          roomCount: 30,
          startAdr: 342,
          adrGrowthRate: 0.025,
          startOccupancy: 0.6,
          maxOccupancy: 0.9,
          occupancyRampMonths: 6,
          occupancyGrowthStep: 0.05,
          stabilizationMonths: 36,
          type: "Financed",
          cateringLevel: "Full",
          costRateRooms: 0.36,
          costRateFb: 0.15,
          costRateAdmin: 0.08,
          costRateMarketing: 0.05,
          costRatePropertyOps: 0.04,
          costRateUtilities: 0.05,
          costRateInsurance: 0.02,
          costRateTaxes: 0.03,
          costRateIt: 0.02,
          costRateFfe: 0.04,
          revShareEvents: 0.43,
          revShareFb: 0.22,
          revShareOther: 0.07,
          fullCateringPercent: 0.4,
          partialCateringPercent: 0.3,
          costRateOther: 0.05,
          exitCapRate: 0.085,
          taxRate: 0.25
        }
      ];

      for (const prop of properties) {
        await storage.createProperty(prop);
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
  
  // Get all scenarios for current user (ensures Base scenario exists)
  app.get("/api/scenarios", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      let scenarios = await storage.getScenariosByUser(userId);
      
      // Ensure Base scenario exists
      const hasBase = scenarios.some(s => s.name === "Base");
      if (!hasBase) {
        // Create Base scenario with current assumptions and properties
        let assumptions = await storage.getGlobalAssumptions(userId);
        let properties = await storage.getAllProperties(userId);
        
        // Fallback to shared data if user has none
        if (!assumptions) {
          assumptions = await storage.getGlobalAssumptions();
        }
        if (properties.length === 0) {
          properties = await storage.getAllProperties();
        }
        
        if (assumptions) {
          await storage.createScenario({
            userId,
            name: "Base",
            description: "Default baseline scenario with initial assumptions",
            globalAssumptions: assumptions,
            properties: properties,
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

  // Create new scenario (save current assumptions + properties)
  app.post("/api/scenarios", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { name, description } = req.body;
      
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ error: "Scenario name is required" });
      }
      
      // Get current assumptions and properties for this user (fallback to shared if none)
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
      
      const scenario = await storage.createScenario({
        userId,
        name: name.trim(),
        description: description || null,
        globalAssumptions: assumptions,
        properties: properties,
      });
      
      res.json(scenario);
    } catch (error) {
      console.error("Error creating scenario:", error);
      res.status(500).json({ error: "Failed to create scenario" });
    }
  });

  // Load scenario (restore assumptions + properties)
  app.post("/api/scenarios/:id/load", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const scenarioId = parseInt(req.params.id as string);
      
      const scenario = await storage.getScenario(scenarioId);
      if (!scenario) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      
      if (scenario.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Restore global assumptions
      const savedAssumptions = scenario.globalAssumptions as any;
      await storage.upsertGlobalAssumptions(savedAssumptions, userId);
      
      // Delete current properties and restore saved ones
      const currentProperties = await storage.getAllProperties(userId);
      for (const prop of currentProperties) {
        await storage.deleteProperty(prop.id);
      }
      
      const savedProperties = scenario.properties as any[];
      for (const prop of savedProperties) {
        const { id, createdAt, updatedAt, ...propData } = prop;
        await storage.createProperty({ ...propData, userId });
      }
      
      res.json({ success: true, message: "Scenario loaded successfully" });
    } catch (error) {
      console.error("Error loading scenario:", error);
      res.status(500).json({ error: "Failed to load scenario" });
    }
  });

  // Update scenario (rename)
  app.patch("/api/scenarios/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const scenarioId = parseInt(req.params.id as string);
      const { name, description } = req.body;
      
      const scenario = await storage.getScenario(scenarioId);
      if (!scenario) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      
      if (scenario.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const updated = await storage.updateScenario(scenarioId, { name, description });
      res.json(updated);
    } catch (error) {
      console.error("Error updating scenario:", error);
      res.status(500).json({ error: "Failed to update scenario" });
    }
  });

  // Delete scenario (cannot delete Base scenario)
  app.delete("/api/scenarios/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const scenarioId = parseInt(req.params.id as string);
      
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
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting scenario:", error);
      res.status(500).json({ error: "Failed to delete scenario" });
    }
  });

  // --- DESIGN THEMES ROUTES ---
  
  // Get all design themes
  app.get("/api/admin/design-themes", requireAdmin, async (req, res) => {
    try {
      const themes = await storage.getAllDesignThemes();
      res.json(themes);
    } catch (error) {
      console.error("Error fetching design themes:", error);
      res.status(500).json({ error: "Failed to fetch design themes" });
    }
  });
  
  // Get active design theme
  app.get("/api/admin/design-themes/active", async (req, res) => {
    try {
      const theme = await storage.getActiveDesignTheme();
      res.json(theme || null);
    } catch (error) {
      console.error("Error fetching active design theme:", error);
      res.status(500).json({ error: "Failed to fetch active design theme" });
    }
  });
  
  // Create design theme
  app.post("/api/admin/design-themes", requireAdmin, async (req, res) => {
    try {
      const theme = await storage.createDesignTheme(req.body);
      res.json(theme);
    } catch (error) {
      console.error("Error creating design theme:", error);
      res.status(500).json({ error: "Failed to create design theme" });
    }
  });
  
  // Update design theme
  app.patch("/api/admin/design-themes/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const theme = await storage.updateDesignTheme(id, req.body);
      if (!theme) {
        return res.status(404).json({ error: "Theme not found" });
      }
      res.json(theme);
    } catch (error) {
      console.error("Error updating design theme:", error);
      res.status(500).json({ error: "Failed to update design theme" });
    }
  });
  
  // Delete design theme
  app.delete("/api/admin/design-themes/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      await storage.deleteDesignTheme(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting design theme:", error);
      res.status(500).json({ error: "Failed to delete design theme" });
    }
  });
  
  // Set active design theme
  app.post("/api/admin/design-themes/:id/activate", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      await storage.setActiveDesignTheme(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error activating design theme:", error);
      res.status(500).json({ error: "Failed to activate design theme" });
    }
  });

  // --- MARKET RESEARCH ROUTES ---
  
  app.get("/api/research/:type", requireAuth, async (req, res) => {
    try {
      const { type } = req.params;
      const propertyId = req.query.propertyId ? parseInt(req.query.propertyId as string) : undefined;
      const userId = (req as any).user?.id;
      const research = await storage.getMarketResearch(type, userId, propertyId);
      res.json(research || null);
    } catch (error) {
      console.error("Error fetching research:", error);
      res.status(500).json({ error: "Failed to fetch research" });
    }
  });
  
  app.post("/api/research/generate", requireAuth, async (req, res) => {
    try {
      const { type, propertyId, propertyContext, boutiqueDefinition: clientBoutiqueDef } = req.body;
      const userId = (req as any).user?.id;
      
      const globalAssumptions = await storage.getGlobalAssumptions(userId);
      const preferredModel = globalAssumptions?.preferredLlm || "claude-sonnet-4-5";
      const boutiqueDef = clientBoutiqueDef || (globalAssumptions?.boutiqueDefinition as any) || {
        minRooms: 10, maxRooms: 80, hasFB: true, hasEvents: true, hasWellness: true, minAdr: 150, maxAdr: 600,
        level: "luxury", eventLocations: 2, maxEventCapacity: 150, acreage: 5, privacyLevel: "high", parkingSpaces: 50,
        description: "Independently operated, design-forward properties with curated guest experiences."
      };
      
      let systemPrompt = "";
      let userPrompt = "";
      
      if (type === "property" && propertyContext) {
        systemPrompt = `You are a hospitality industry market research analyst specializing in boutique hotels that focus on unique experiences like wellness retreats, corporate events, yoga, relationship retreats, and couples therapy. Provide data-driven analysis with specific numbers and industry sources. Format your response as a JSON object with these sections:
{
  "marketOverview": { "summary": "string", "keyMetrics": [{ "label": "string", "value": "string", "source": "string" }] },
  "adrAnalysis": { "marketAverage": "string", "boutiqueRange": "string", "recommendedRange": "string", "rationale": "string", "comparables": [{ "name": "string", "adr": "string", "type": "string" }] },
  "occupancyAnalysis": { "marketAverage": "string", "seasonalPattern": [{ "season": "string", "occupancy": "string", "notes": "string" }], "rampUpTimeline": "string" },
  "eventDemand": { "corporateEvents": "string", "wellnessRetreats": "string", "weddingsPrivate": "string", "estimatedEventRevShare": "string", "keyDrivers": ["string"] },
  "capRateAnalysis": { "marketRange": "string", "boutiqueRange": "string", "recommendedRange": "string", "rationale": "string", "comparables": [{ "name": "string", "capRate": "string", "saleYear": "string", "notes": "string" }] },
  "competitiveSet": [{ "name": "string", "rooms": "string", "adr": "string", "positioning": "string" }],
  "risks": [{ "risk": "string", "mitigation": "string" }],
  "sources": ["string"]
}`;
        userPrompt = `Analyze the market for this boutique hotel property:
- Property: ${propertyContext.name}
- Location: ${propertyContext.location}
- Market: ${propertyContext.market}
- Room Count: ${propertyContext.roomCount}
- Current ADR: $${propertyContext.startAdr}
- Target Occupancy: ${(propertyContext.maxOccupancy * 100).toFixed(0)}%
- Catering Level: ${propertyContext.cateringLevel}
- Property Type: ${propertyContext.type}

Our definition of a boutique hotel: ${boutiqueDef.description}
- Property level: ${boutiqueDef.level || "luxury"}
- Room range: ${boutiqueDef.minRooms}–${boutiqueDef.maxRooms} rooms
- ADR range: $${boutiqueDef.minAdr}–$${boutiqueDef.maxAdr}
- Features: ${[boutiqueDef.hasFB && "F&B operations", boutiqueDef.hasEvents && "event hosting", boutiqueDef.hasWellness && "wellness programming"].filter(Boolean).join(", ")}
- Event locations on property: ${boutiqueDef.eventLocations ?? 2}
- Max event capacity (guests + attendees): ${boutiqueDef.maxEventCapacity ?? 150} people
- Property acreage: ${boutiqueDef.acreage ?? 5} acres
- Privacy level: ${boutiqueDef.privacyLevel || "high"}
- Parking spaces: ${boutiqueDef.parkingSpaces ?? 50}

Focus on: local market ADR benchmarks for boutique hotels matching this profile, occupancy patterns and seasonality, corporate event and wellness retreat demand in this market, cap rates for recent boutique hotel transactions in this market (provide a narrow recommended range for acquisition and exit cap rates), competitive landscape (only comparable boutique hotels), and risks. Provide real, specific data points with sources where possible.`;
      } else if (type === "company") {
        systemPrompt = `You are a hospitality management consulting expert specializing in hotel management company structures, GAAP-compliant fee arrangements, and industry benchmarks. Focus on boutique hotel management companies that specialize in unique events (wellness retreats, corporate events, yoga retreats, relationship retreats). Format your response as a JSON object:
{
  "managementFees": {
    "baseFee": { "industryRange": "string", "boutiqueRange": "string", "recommended": "string", "gaapReference": "string", "sources": [{ "source": "string", "data": "string" }] },
    "incentiveFee": { "industryRange": "string", "commonBasis": "string", "recommended": "string", "gaapReference": "string", "sources": [{ "source": "string", "data": "string" }] }
  },
  "gaapStandards": [{ "standard": "string", "reference": "string", "application": "string" }],
  "industryBenchmarks": {
    "operatingExpenseRatios": [{ "category": "string", "range": "string", "source": "string" }],
    "revenuePerRoom": { "economy": "string", "midscale": "string", "upscale": "string", "luxury": "string" }
  },
  "compensationBenchmarks": { "gm": "string", "director": "string", "manager": "string", "source": "string" },
  "contractTerms": [{ "term": "string", "typical": "string", "notes": "string" }],
  "sources": ["string"]
}`;
        userPrompt = `Provide comprehensive research on hotel management company fee structures, GAAP standards, and industry benchmarks for a boutique hotel management company focused on:
1. Base management fee structures and industry norms (ASC 606 revenue recognition)
2. Incentive management fee (IMF) structures and triggers
3. GAAP-compliant fee recognition standards
4. Operating expense ratios by department (USALI format)
5. Management company compensation benchmarks
6. Typical contract terms and duration
Focus specifically on boutique hotels specializing in unique events like wellness retreats, corporate retreats, and experiential hospitality.`;
      } else if (type === "global") {
        systemPrompt = `You are a hospitality industry research analyst specializing in the boutique hotel segment, with emphasis on properties focused on unique events and experiences (wellness retreats, corporate events, yoga, relationship retreats, couples therapy). Provide comprehensive industry data with sources. Format your response as a JSON object:
{
  "industryOverview": { "marketSize": "string", "growthRate": "string", "boutiqueShare": "string", "keyTrends": ["string"] },
  "eventHospitality": {
    "wellnessRetreats": { "marketSize": "string", "growth": "string", "avgRevPerEvent": "string", "seasonality": "string" },
    "corporateEvents": { "marketSize": "string", "growth": "string", "avgRevPerEvent": "string", "trends": ["string"] },
    "yogaRetreats": { "marketSize": "string", "growth": "string", "demographics": "string" },
    "relationshipRetreats": { "marketSize": "string", "growth": "string", "positioning": "string" }
  },
  "financialBenchmarks": {
    "adrTrends": [{ "year": "string", "national": "string", "boutique": "string", "luxury": "string" }],
    "occupancyTrends": [{ "year": "string", "national": "string", "boutique": "string" }],
    "revparTrends": [{ "year": "string", "national": "string", "boutique": "string" }],
    "capRates": [{ "segment": "string", "range": "string", "trend": "string" }]
  },
  "debtMarket": { "currentRates": "string", "ltvRange": "string", "terms": "string", "outlook": "string" },
  "regulatoryEnvironment": ["string"],
  "sources": ["string"]
}`;
        userPrompt = `Provide comprehensive boutique hotel industry research covering:
1. Overall boutique hotel market size, growth, and trends
2. Event-focused hospitality: wellness retreats, corporate events, yoga retreats, relationship/couples retreats market data
3. Financial benchmarks: ADR, occupancy, RevPAR trends for boutique hotels
4. Capitalization rates and investment returns
5. Debt market conditions for hotel acquisitions
6. Emerging trends in experiential hospitality
Focus on North America and Latin America markets. Include specific data points, market sizes, growth rates, and cite sources.`;
      } else {
        return res.status(400).json({ error: "Invalid research type. Must be 'property', 'company', or 'global'." });
      }
      
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      
      let fullResponse = "";
      const isGeminiModel = preferredModel.startsWith("gemini");
      const isClaudeModel = preferredModel.startsWith("claude");
      
      if (isGeminiModel) {
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
      } else if (isClaudeModel) {
        const anthropic = new Anthropic({
          apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
          baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
        });
        
        const stream = anthropic.messages.stream({
          model: preferredModel,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            { role: "user", content: userPrompt }
          ],
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
      } else {
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
        parsedContent = JSON.parse(fullResponse);
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

  return httpServer;
}
