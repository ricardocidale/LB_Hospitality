import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGlobalAssumptionsSchema, insertPropertySchema, updatePropertySchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { hashPassword, verifyPassword, generateSessionId, setSessionCookie, clearSessionCookie, getSessionExpiryDate, requireAuth, requireAdmin, isRateLimited, recordLoginAttempt, sanitizeEmail, validatePassword } from "./auth";
import { z } from "zod";

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
      setSessionCookie(res, sessionId);
      
      res.json({ 
        user: { id: user.id, email: user.email, name: user.name, company: user.company, title: user.title, role: user.role }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      if (req.sessionId) {
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

      const user = await storage.getUser(req.user.id);
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
      const id = parseInt(req.params.id);
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
      const id = parseInt(req.params.id);
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
      const id = parseInt(req.params.id);
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
      const data = await storage.getAllProperties();
      res.json(data);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ error: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid property ID" });
      }
      
      const property = await storage.getProperty(id);
      
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
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
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid property ID" });
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
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid property ID" });
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
        partnerSalary: 180000,
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
        fullCateringFbBoost: 0.5,
        partialCateringFbBoost: 0.25,
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

  return httpServer;
}
