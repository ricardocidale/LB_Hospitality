import type { Express } from "express";
import { storage } from "../storage";
import { 
  requireAuth, 
  isRateLimited, 
  sanitizeEmail, 
  verifyPassword, 
  recordLoginAttempt, 
  generateSessionId, 
  getSessionExpiryDate, 
  setSessionCookie, 
  clearSessionCookie,
  hashPassword
} from "../auth";
import { loginSchema, userResponse, fullName } from "./helpers";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export function register(app: Express) {
  // ────────────────────────────────────────────────────────────
  // AUTHENTICATION ROUTES
  // Login: validates credentials → creates session → sets HTTP-only cookie
  // Logout: deletes session + clears cookie
  // GET /api/me: returns the currently authenticated user (session-based)
  // Rate-limiting: IP-based throttle on failed login attempts
  // ────────────────────────────────────────────────────────────

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
        user: userResponse(user)
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
        user: userResponse(user)
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
      const adminPassword = process.env.PASSWORD_ADMIN;
      if (!adminPassword) {
        return res.status(500).json({ error: "PASSWORD_ADMIN not configured" });
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
        user: userResponse(user)
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
      user: userResponse(u, { companyName })
    });
  });

  // ────────────────────────────────────────────────────────────
  // USER PROFILE ROUTES
  // Self-service endpoints: any authenticated user can update their own profile,
  // change their password, or select a design theme. No admin privileges needed.
  // ────────────────────────────────────────────────────────────
  
  const updateProfileSchema = z.object({
    firstName: z.string().max(50).optional(),
    lastName: z.string().max(50).optional(),
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
      
      const updates: { firstName?: string; lastName?: string; email?: string; company?: string; title?: string } = {};
      if (validation.data.firstName !== undefined) updates.firstName = validation.data.firstName.trim();
      if (validation.data.lastName !== undefined) updates.lastName = validation.data.lastName.trim();
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
      res.json(userResponse(user));
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and number"),
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
}
