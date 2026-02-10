import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { storage } from "./storage";
import type { User } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      sessionId?: string;
    }
  }
}

const SESSION_COOKIE = "session_id";
const SESSION_DURATION_DAYS = 7;
const BCRYPT_ROUNDS = 12;

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minute lockout

/**
 * Checks whether a given identifier has exceeded the maximum allowed login attempts.
 * If the lockout duration has elapsed since the last attempt, the record is cleared.
 * @param identifier - The unique identifier to check (e.g., email or IP address).
 * @returns `true` if the identifier is currently rate-limited, `false` otherwise.
 */
export function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier);
  
  if (!attempts) return false;
  
  if (now - attempts.lastAttempt > LOCKOUT_DURATION_MS) {
    loginAttempts.delete(identifier);
    return false;
  }
  
  return attempts.count >= MAX_LOGIN_ATTEMPTS;
}

/**
 * Records a login attempt for the given identifier. On a successful attempt the
 * record is deleted, effectively resetting the counter. On a failed attempt the
 * failure count is incremented (or initialised to 1).
 * @param identifier - The unique identifier for the login attempt (e.g., email or IP address).
 * @param success - Whether the login attempt was successful.
 * @returns {void}
 */
export function recordLoginAttempt(identifier: string, success: boolean) {
  const now = Date.now();
  
  if (success) {
    loginAttempts.delete(identifier);
    return;
  }
  
  const attempts = loginAttempts.get(identifier);
  if (attempts) {
    attempts.count++;
    attempts.lastAttempt = now;
  } else {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now });
  }
}

// API rate limiting (per-user, for expensive operations like AI calls and external API)
const apiRateLimits = new Map<string, { count: number; windowStart: number }>();
const API_RATE_WINDOW_MS = 60 * 1000; // 1 minute sliding window

/**
 * Determines whether a specific user has exceeded the allowed number of requests
 * for a given API endpoint within a 1-minute sliding window.
 * @param userId - The numeric ID of the user making the request.
 * @param endpoint - The API endpoint being rate-limited.
 * @param maxRequests - The maximum number of requests allowed within the window.
 * @returns `true` if the user has exceeded the limit, `false` otherwise.
 */
export function isApiRateLimited(userId: number, endpoint: string, maxRequests: number): boolean {
  const key = `${userId}:${endpoint}`;
  const now = Date.now();
  const record = apiRateLimits.get(key);

  if (!record || now - record.windowStart > API_RATE_WINDOW_MS) {
    apiRateLimits.set(key, { count: 1, windowStart: now });
    return false;
  }

  record.count++;
  return record.count > maxRequests;
}

/**
 * Validates that a password meets the minimum complexity requirements:
 * at least 8 characters, one uppercase letter, one lowercase letter, and one number.
 * @param password - The plaintext password to validate.
 * @returns An object with `valid` set to `true` if all requirements are met,
 *          or `valid` set to `false` with a descriptive `message` explaining the failure.
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  return { valid: true };
}

/**
 * Sanitizes an email address by converting it to lowercase and trimming whitespace.
 * @param email - The raw email string to sanitize.
 * @returns The sanitized email string.
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Hashes a plaintext password using bcrypt with the configured number of salt rounds.
 * @param password - The plaintext password to hash.
 * @returns A promise that resolves to the bcrypt hash string.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compares a plaintext password against a bcrypt hash to verify a match.
 * @param password - The plaintext password to verify.
 * @param hash - The bcrypt hash to compare against.
 * @returns A promise that resolves to `true` if the password matches, `false` otherwise.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generates a cryptographically secure random session ID.
 * @returns A 64-character hexadecimal string derived from 32 random bytes.
 */
export function generateSessionId(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Express middleware that attempts to load the authenticated user from the session cookie.
 * If a valid session is found, `req.user` and `req.sessionId` are populated.
 * If no session cookie is present or the session is invalid, the request proceeds unauthenticated.
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The next middleware function in the chain.
 * @returns {Promise<void>}
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.[SESSION_COOKIE];
  
  if (!sessionId) {
    return next();
  }

  try {
    const session = await storage.getSession(sessionId);
    if (session) {
      req.user = session.user;
      req.sessionId = sessionId;
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
  }
  
  next();
}

/**
 * Express middleware that enforces authentication. Returns a 401 response
 * if no authenticated user is attached to the request.
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The next middleware function in the chain.
 * @returns {void}
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

/**
 * Express middleware that enforces admin-level access. Returns a 401 response
 * if the user is not authenticated, or a 403 response if the user does not
 * have the "admin" role.
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The next middleware function in the chain.
 * @returns {void}
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

/**
 * Express middleware that enforces checker or admin-level access. Returns a 401 response
 * if the user is not authenticated, or a 403 response if the user does not have
 * a "checker" or "admin" role.
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The next middleware function in the chain.
 * @returns {void}
 */
export function requireChecker(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.user.role !== "admin" && req.user.role !== "checker") {
    return res.status(403).json({ error: "Checker or admin access required" });
  }
  next();
}

/**
 * Sets an httpOnly session cookie on the response with a 7-day expiry.
 * The cookie is marked as secure in production and uses strict same-site policy.
 * @param res - The Express response object.
 * @param sessionId - The session ID string to store in the cookie.
 * @returns {void}
 */
export function setSessionCookie(res: Response, sessionId: string) {
  res.cookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
  });
}

/**
 * Clears the session cookie from the response, effectively logging the user out.
 * @param res - The Express response object.
 * @returns {void}
 */
export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE);
}

/**
 * Calculates and returns the session expiry date, which is 7 days from the current time.
 * @returns A `Date` object representing the session expiry timestamp.
 */
export function getSessionExpiryDate(): Date {
  return new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Creates a default "Development" scenario for a newly created user, populated with
 * the current global assumptions and properties. Skips creation if the user already
 * has a scenario named "Development".
 * @param userId - The numeric ID of the user to create the scenario for.
 * @param userName - The display name of the user (used for logging).
 * @returns {Promise<void>}
 */
async function createDefaultScenarioForUser(userId: number, userName: string) {
  // Check if user already has a "Development" scenario
  const existingScenarios = await storage.getScenariosByUser(userId);
  const hasDefaultScenario = existingScenarios.some(s => s.name === "Development");
  
  if (!hasDefaultScenario) {
    // Get current global assumptions and properties to save as default
    const globalAssumptions = await storage.getGlobalAssumptions();
    const properties = await storage.getAllProperties();
    
    if (globalAssumptions) {
      await storage.createScenario({
        userId,
        name: "Development",
        description: "Default development scenario with initial assumptions",
        globalAssumptions: globalAssumptions as any,
        properties: properties as any,
      });
      console.log(`Default "Development" scenario created for ${userName}`);
    }
  }
}

/**
 * Seeds the database with default users (admin, checker, and Reynaldo) using
 * credentials from environment variables (`ADMIN_PASSWORD`, `CHECKER_PASSWORD`,
 * `REYNALDO_PASSWORD`). If users already exist, their passwords are reset to match
 * the current environment variable values. A default "Development" scenario is
 * created for each seeded user.
 * @returns A promise that resolves when all seed operations are complete.
 */
export async function seedAdminUser() {
  // Seed admin user
  const adminEmail = "admin";
  const defaultPassword = process.env.ADMIN_PASSWORD;
  
  if (!defaultPassword) {
    console.warn("ADMIN_PASSWORD environment variable not set. Skipping admin user creation.");
    return;
  }
  
  let adminUser = await storage.getUserByEmail(adminEmail);
  
  if (!adminUser) {
    const passwordHash = await hashPassword(defaultPassword);
    adminUser = await storage.createUser({
      email: adminEmail,
      passwordHash,
      role: "admin",
      name: "Administrator",
    });
    console.log(`Admin user created: admin`);
  } else {
    // Always update password to ensure it matches
    const passwordHash = await hashPassword(defaultPassword);
    await storage.updateUserPassword(adminUser.id, passwordHash);
    console.log(`Admin user password reset: admin`);
  }
  
  // Create default scenario for admin
  await createDefaultScenarioForUser(adminUser.id, "admin");

  // Seed checker user
  const checkerEmail = "checker@norfolkgroup.io";
  const checkerPassword = process.env.CHECKER_PASSWORD;
  
  if (!checkerPassword) {
    console.warn("CHECKER_PASSWORD environment variable not set. Skipping checker user creation.");
    return;
  }
  
  let checkerUser = await storage.getUserByEmail(checkerEmail);
  
  if (!checkerUser) {
    // Check if old "checker" user exists and migrate it
    const oldChecker = await storage.getUserByEmail("checker");
    if (oldChecker) {
      const passwordHash = await hashPassword(checkerPassword);
      await storage.updateUserProfile(oldChecker.id, { email: checkerEmail, name: "Checker", company: "Norfolk AI", title: "Checker" });
      await storage.updateUserPassword(oldChecker.id, passwordHash);
      await storage.updateUserRole(oldChecker.id, "checker");
      checkerUser = await storage.getUserById(oldChecker.id);
      console.log(`Migrated old 'checker' user to checker@norfolkgroup.io with role=checker`);
    } else {
      const passwordHash = await hashPassword(checkerPassword);
      checkerUser = await storage.createUser({
        email: checkerEmail,
        passwordHash,
        role: "checker",
        name: "Checker",
        company: "Norfolk AI",
        title: "Checker",
      });
      console.log(`Checker user created: checker@norfolkgroup.io`);
    }
  } else {
    // Always update password and ensure role is correct
    const passwordHash = await hashPassword(checkerPassword);
    await storage.updateUserPassword(checkerUser.id, passwordHash);
    await storage.updateUserRole(checkerUser.id, "checker");
    console.log(`Checker user password reset: checker@norfolkgroup.io`);
  }
  
  // Create default scenario for checker
  if (checkerUser) {
    await createDefaultScenarioForUser(checkerUser.id, "checker");
  }

  // Seed Reynaldo user
  const reynaldoEmail = "reynaldo.fagundes@norfolk.ai";
  const reynaldoPassword = process.env.REYNALDO_PASSWORD;

  if (!reynaldoPassword) {
    console.warn("REYNALDO_PASSWORD environment variable not set. Skipping Reynaldo user creation.");
  } else {
    let reynaldoUser = await storage.getUserByEmail(reynaldoEmail);

    if (!reynaldoUser) {
      const passwordHash = await hashPassword(reynaldoPassword);
      reynaldoUser = await storage.createUser({
        email: reynaldoEmail,
        passwordHash,
        role: "user",
        name: "Reynaldo Fagundes",
        company: "Norfolk AI",
        title: "CTO",
      });
      console.log(`Reynaldo user created: ${reynaldoEmail}`);
    } else {
      const passwordHash = await hashPassword(reynaldoPassword);
      await storage.updateUserPassword(reynaldoUser.id, passwordHash);
      await storage.updateUserProfile(reynaldoUser.id, {
        name: "Reynaldo Fagundes",
        company: "Norfolk AI",
        title: "CTO",
      });
      console.log(`Reynaldo user password reset: ${reynaldoEmail}`);
    }

    if (reynaldoUser) {
      await createDefaultScenarioForUser(reynaldoUser.id, "reynaldo");
    }
  }
}
