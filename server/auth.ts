/**
 * server/auth.ts — Authentication, Session Management & Authorization
 *
 * This file contains everything related to securing the application:
 *
 *   Password hashing & verification:
 *     Uses bcrypt with 12 salt rounds. Passwords are never stored in plain text.
 *     The validatePassword() function enforces complexity rules (8+ chars, mixed case, digits).
 *
 *   Session management:
 *     Sessions are stored in the database (not in-memory) so they survive server restarts.
 *     Each session maps to a cryptographically random 64-hex-char ID stored in an HTTP-only cookie.
 *     Sessions expire after 7 days. The authMiddleware() function runs on every request,
 *     loading the user record from the session cookie if present.
 *
 *   Rate limiting:
 *     Login attempts are rate-limited per IP address (5 attempts, 15-minute lockout).
 *     API calls to expensive operations (AI, external search) are rate-limited per user
 *     within a 1-minute sliding window. Both maps are cleaned hourly by server/index.ts.
 *
 *   Authorization middleware:
 *     Four levels of access control, applied as Express middleware on individual routes:
 *       - requireAuth: any logged-in user (rejects 401 if no session)
 *       - requireAdmin: admin role only (rejects 403 for non-admins)
 *       - requireChecker: admin or checker role (for verification tools)
 *       - requireManagementAccess: everyone except investors (admin + partner + checker)
 *
 *   Seed users:
 *     On startup, seedAdminUser() ensures the predefined team members exist in the database
 *     with passwords from environment variables. Each gets a default "Development" scenario.
 */
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { storage } from "./storage";
import type { User } from "@shared/schema";

declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      passwordHash: string;
      role: string;
      firstName: string | null;
      lastName: string | null;
      company: string | null;
      companyId: number | null;
      title: string | null;
      userGroupId: number | null;
      selectedThemeId: number | null;
      createdAt: Date;
      updatedAt: Date;
    }
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
 * Removes expired entries from the in-memory rate limit maps to prevent
 * unbounded memory growth. Should be called periodically (e.g., hourly).
 * @returns The total number of stale entries removed.
 */
export function cleanupRateLimitMaps(): number {
  const now = Date.now();
  let removed = 0;

  loginAttempts.forEach((value, key) => {
    if (now - value.lastAttempt > LOCKOUT_DURATION_MS) {
      loginAttempts.delete(key);
      removed++;
    }
  });

  apiRateLimits.forEach((value, key) => {
    if (now - value.windowStart > API_RATE_WINDOW_MS) {
      apiRateLimits.delete(key);
      removed++;
    }
  });

  return removed;
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
 * Express middleware that allows access to anyone except investors. Investors get
 * a read-only view of the platform; management operations (editing properties,
 * saving scenarios, updating assumptions) require this middleware.
 * Returns 401 if not authenticated, 403 if the user has the "investor" role.
 */
export function requireManagementAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.user.role === "investor") {
    return res.status(403).json({ error: "Management company access required" });
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
  const defaultPassword = process.env.PASSWORD_DEFAULT || process.env.PASSWORD_ADMIN;

  const userSeeds: Array<{
    email: string;
    envVar: string;
    role: "admin" | "partner" | "checker";
    firstName: string;
    lastName?: string;
    company: string;
    title: string;
    userGroupId?: number;
  }> = [
    { email: "admin", envVar: "PASSWORD_ADMIN", role: "admin", firstName: "Ricardo", lastName: "Cidale", company: "Norfolk Group", title: "Partner", userGroupId: 2 },
    { email: "checker@norfolkgroup.io", envVar: "PASSWORD_CHECKER", role: "checker", firstName: "Checker", company: "Norfolk AI", title: "Checker", userGroupId: 2 },
    { email: "reynaldo.fagundes@norfolk.ai", envVar: "PASSWORD_REYNALDO", role: "partner", firstName: "Reynaldo", lastName: "Fagundes", company: "Norfolk AI", title: "CTO", userGroupId: 2 },
    { email: "kit@kitcapital.com", envVar: "PASSWORD_KIT", role: "partner", firstName: "Dov", lastName: "Tuzman", company: "KIT Capital", title: "Principal", userGroupId: 1 },
    { email: "rosario@kitcapital.com", envVar: "PASSWORD_ROSARIO", role: "partner", firstName: "Rosario", lastName: "David", company: "KIT Capital", title: "COO", userGroupId: 1 },
    { email: "lemazniku@icloud.com", envVar: "PASSWORD_LEA", role: "partner", firstName: "Lea", lastName: "Mazniku", company: "KIT Capital", title: "Partner", userGroupId: 1 },
    { email: "leslie@cidale.com", envVar: "PASSWORD_LESLIE", role: "partner", firstName: "Leslie", lastName: "Cidale", company: "Numeratti Endeavors", title: "Senior Partner", userGroupId: 3 },
    { email: "wlaruffa@gmail.com", envVar: "PASSWORD_WILLIAM", role: "partner", firstName: "William", lastName: "Laruffa", company: "Independent", title: "Partner", userGroupId: 3 },
  ];

  for (const seed of userSeeds) {
    const password = process.env[seed.envVar] || defaultPassword;
    if (!password) {
      console.warn(`${seed.envVar} not set and no PASSWORD_DEFAULT. Skipping ${seed.email}.`);
      continue;
    }

    let user = await storage.getUserByEmail(seed.email);

    if (!user) {
      if (seed.email === "checker@norfolkgroup.io") {
        const oldChecker = await storage.getUserByEmail("checker");
        if (oldChecker) {
          const passwordHash = await hashPassword(password);
          await storage.updateUserProfile(oldChecker.id, { email: seed.email, firstName: seed.firstName, company: seed.company, title: seed.title });
          await storage.updateUserPassword(oldChecker.id, passwordHash);
          await storage.updateUserRole(oldChecker.id, "checker");
          user = await storage.getUserById(oldChecker.id);
          console.log(`Migrated old 'checker' user to ${seed.email}`);
        }
      }

      if (!user) {
        const passwordHash = await hashPassword(password);
        user = await storage.createUser({
          email: seed.email,
          passwordHash,
          role: seed.role,
          firstName: seed.firstName,
          lastName: seed.lastName,
          company: seed.company,
          title: seed.title,
        });
        console.log(`User created: ${seed.email}`);
      }
    } else {
      const passwordHash = await hashPassword(password);
      await storage.updateUserPassword(user.id, passwordHash);
      await storage.updateUserProfile(user.id, {
        firstName: seed.firstName,
        lastName: seed.lastName,
        company: seed.company,
        title: seed.title,
      });
      if (seed.role === "checker") {
        await storage.updateUserRole(user.id, "checker");
      }
      console.log(`User password reset: ${seed.email}`);
    }

    if (user) {
      await createDefaultScenarioForUser(user.id, seed.firstName.toLowerCase());
    }
  }
}
