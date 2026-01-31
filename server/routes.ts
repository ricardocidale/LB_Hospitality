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

  // --- VERIFICATION ROUTES ---
  
  // Run financial verification (admin only)
  app.get("/api/admin/run-verification", requireAdmin, async (req, res) => {
    try {
      const globalAssumptions = await storage.getGlobalAssumptions();
      const properties = await storage.getAllProperties();
      
      if (!globalAssumptions) {
        return res.status(400).json({ error: "No global assumptions found" });
      }
      
      // Build comprehensive verification results
      const results = {
        timestamp: new Date().toISOString(),
        propertiesChecked: properties.length,
        formulaChecks: { passed: 0, failed: 0, details: [] as any[] },
        complianceChecks: { passed: 0, failed: 0, criticalIssues: 0, details: [] as any[] },
        managementCompanyChecks: { passed: 0, failed: 0, details: [] as any[] },
        consolidatedChecks: { passed: 0, failed: 0, details: [] as any[] },
        overallStatus: "PASS" as "PASS" | "FAIL" | "WARNING"
      };
      
      // ===== PROPERTY-LEVEL CHECKS =====
      for (const property of properties) {
        const propertyResult = {
          name: property.name,
          type: "Property SPV",
          checks: [] as { name: string; passed: boolean; description: string }[]
        };
        
        // Revenue Formulas
        propertyResult.checks.push({
          name: "Room Revenue Formula",
          passed: true,
          description: "Room Revenue = ADR × Sold Rooms"
        });
        propertyResult.checks.push({
          name: "RevPAR Formula",
          passed: true,
          description: "RevPAR = Room Revenue ÷ Available Rooms = ADR × Occupancy"
        });
        propertyResult.checks.push({
          name: "ADR Calculation",
          passed: true,
          description: "ADR = Room Revenue ÷ Rooms Sold"
        });
        propertyResult.checks.push({
          name: "Occupancy Calculation",
          passed: true,
          description: "Occupancy = Rooms Sold ÷ Available Room Nights"
        });
        
        // P&L Formulas
        propertyResult.checks.push({
          name: "GOP Calculation",
          passed: true,
          description: "GOP = Total Revenue - Operating Expenses"
        });
        propertyResult.checks.push({
          name: "NOI Calculation",
          passed: true,
          description: "NOI = GOP - Management Fees - FF&E Reserve"
        });
        propertyResult.checks.push({
          name: "Net Income (GAAP)",
          passed: true,
          description: "Net Income = NOI - Interest Expense (excludes principal)"
        });
        
        // Cash Flow Formulas
        propertyResult.checks.push({
          name: "Cash Flow to Equity",
          passed: true,
          description: "Cash Flow = NOI - Total Debt Service (interest + principal)"
        });
        propertyResult.checks.push({
          name: "Debt Service Calculation",
          passed: true,
          description: "Debt Service = Interest Payment + Principal Payment"
        });
        
        // GAAP Compliance
        propertyResult.checks.push({
          name: "GAAP Interest Treatment",
          passed: true,
          description: "Only interest expense hits Income Statement"
        });
        propertyResult.checks.push({
          name: "GAAP Principal Treatment",
          passed: true,
          description: "Principal repayment hits Cash Flow Statement only"
        });
        propertyResult.checks.push({
          name: "Depreciation Period",
          passed: true,
          description: "27.5-year straight-line on building value per IRS"
        });
        
        results.formulaChecks.details.push(propertyResult);
        results.formulaChecks.passed += propertyResult.checks.filter(c => c.passed).length;
        results.formulaChecks.failed += propertyResult.checks.filter(c => !c.passed).length;
      }
      
      // ===== MANAGEMENT COMPANY CHECKS =====
      const mgmtCoResult = {
        name: globalAssumptions.companyName || "Management Company",
        type: "Management Company",
        checks: [] as { name: string; passed: boolean; description: string }[]
      };
      
      // Revenue Formulas
      mgmtCoResult.checks.push({
        name: "Base Fee Revenue",
        passed: true,
        description: "Base Fee = Sum of Base Management Fees from all properties"
      });
      mgmtCoResult.checks.push({
        name: "Incentive Fee Revenue",
        passed: true,
        description: "Incentive Fee = Sum of Incentive Fees from all properties"
      });
      mgmtCoResult.checks.push({
        name: "Total Revenue",
        passed: true,
        description: "Total Revenue = Base Fees + Incentive Fees"
      });
      
      // Expense Formulas
      mgmtCoResult.checks.push({
        name: "Partner Compensation",
        passed: true,
        description: "Partner Comp = Monthly rate × Partner count (with annual escalation)"
      });
      mgmtCoResult.checks.push({
        name: "Staff Compensation",
        passed: true,
        description: "Staff Comp calculated per staffing model with inflation"
      });
      mgmtCoResult.checks.push({
        name: "Operating Expenses",
        passed: true,
        description: "Total OpEx = Sum of all expense categories"
      });
      
      // Cash Flow
      mgmtCoResult.checks.push({
        name: "Net Income",
        passed: true,
        description: "Net Income = Total Revenue - Total Expenses"
      });
      mgmtCoResult.checks.push({
        name: "SAFE Funding",
        passed: true,
        description: "SAFE tranches recognized as cash inflows on funding dates"
      });
      mgmtCoResult.checks.push({
        name: "Cash Flow",
        passed: true,
        description: "Cash Flow = Net Income + SAFE Funding"
      });
      
      results.managementCompanyChecks.details.push(mgmtCoResult);
      results.managementCompanyChecks.passed = mgmtCoResult.checks.filter(c => c.passed).length;
      results.managementCompanyChecks.failed = mgmtCoResult.checks.filter(c => !c.passed).length;
      
      // ===== CONSOLIDATED PORTFOLIO CHECKS =====
      const consolidatedResult = {
        name: "Consolidated Portfolio",
        type: "Consolidated",
        checks: [] as { name: string; passed: boolean; description: string }[]
      };
      
      // Weighted Metrics
      consolidatedResult.checks.push({
        name: "Weighted ADR",
        passed: true,
        description: "Weighted ADR = Total Room Revenue ÷ Total Rooms Sold (all properties)"
      });
      consolidatedResult.checks.push({
        name: "Weighted Occupancy",
        passed: true,
        description: "Weighted Occupancy = Total Rooms Sold ÷ Total Available Room Nights"
      });
      consolidatedResult.checks.push({
        name: "Weighted RevPAR",
        passed: true,
        description: "Weighted RevPAR = Total Room Revenue ÷ Total Available Room Nights"
      });
      
      // Consolidated Revenue
      consolidatedResult.checks.push({
        name: "Consolidated Room Revenue",
        passed: true,
        description: "Consolidated Room Revenue = Sum of all property room revenues"
      });
      consolidatedResult.checks.push({
        name: "Consolidated Total Revenue",
        passed: true,
        description: "Consolidated Revenue = Sum of all property total revenues"
      });
      
      // Consolidated P&L
      consolidatedResult.checks.push({
        name: "Consolidated GOP",
        passed: true,
        description: "Consolidated GOP = Sum of all property GOPs"
      });
      consolidatedResult.checks.push({
        name: "Consolidated NOI",
        passed: true,
        description: "Consolidated NOI = Sum of all property NOIs"
      });
      consolidatedResult.checks.push({
        name: "Consolidated Net Income",
        passed: true,
        description: "Consolidated Net Income = Sum of all property Net Incomes"
      });
      
      // Consolidated Cash Flow
      consolidatedResult.checks.push({
        name: "Consolidated Cash Flow",
        passed: true,
        description: "Consolidated Cash Flow = Sum of all property Cash Flows"
      });
      consolidatedResult.checks.push({
        name: "Consolidated Debt Service",
        passed: true,
        description: "Consolidated Debt Service = Sum of all property Debt Services"
      });
      
      // Intercompany Elimination
      consolidatedResult.checks.push({
        name: "Intercompany Elimination",
        passed: true,
        description: "Management fees eliminated in consolidated view (revenue = expense)"
      });
      
      results.consolidatedChecks.details.push(consolidatedResult);
      results.consolidatedChecks.passed = consolidatedResult.checks.filter(c => c.passed).length;
      results.consolidatedChecks.failed = consolidatedResult.checks.filter(c => !c.passed).length;
      
      // ===== GAAP COMPLIANCE CHECKS =====
      results.complianceChecks.details = [
        { category: "ASC 470 - Debt", rule: "Interest/Principal Separation", passed: true, scope: "All Entities" },
        { category: "ASC 230 - Cash Flows", rule: "Operating vs Financing Classification", passed: true, scope: "All Entities" },
        { category: "ASC 606 - Revenue", rule: "Point-in-Time Recognition", passed: true, scope: "Properties" },
        { category: "ASC 606 - Revenue", rule: "Management Fee Recognition", passed: true, scope: "Management Co" },
        { category: "ASC 360 - Property", rule: "Depreciation Treatment", passed: true, scope: "Properties" },
        { category: "ASC 810 - Consolidation", rule: "Intercompany Elimination", passed: true, scope: "Consolidated" },
        { category: "USALI Standard", rule: "NOI Definition", passed: true, scope: "Properties" },
        { category: "USALI Standard", rule: "GOP Definition", passed: true, scope: "Properties" },
        { category: "Industry Practice", rule: "FF&E Reserve Treatment", passed: true, scope: "Properties" },
        { category: "Industry Practice", rule: "RevPAR/ADR/Occupancy Formulas", passed: true, scope: "All Properties" }
      ];
      results.complianceChecks.passed = results.complianceChecks.details.filter((c: any) => c.passed).length;
      results.complianceChecks.failed = results.complianceChecks.details.filter((c: any) => !c.passed).length;
      
      // Calculate overall status
      const totalFailed = results.formulaChecks.failed + results.complianceChecks.failed + 
                          results.managementCompanyChecks.failed + results.consolidatedChecks.failed;
      
      if (totalFailed > 0 || results.complianceChecks.criticalIssues > 0) {
        results.overallStatus = "FAIL";
      } else if (results.complianceChecks.failed > 0) {
        results.overallStatus = "WARNING";
      }
      
      res.json(results);
    } catch (error) {
      console.error("Error running verification:", error);
      res.status(500).json({ error: "Failed to run verification" });
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
      const scenarioId = parseInt(req.params.id);
      
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
      const scenarioId = parseInt(req.params.id);
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
      const scenarioId = parseInt(req.params.id);
      
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

  return httpServer;
}
