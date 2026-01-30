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
const SESSION_DURATION_DAYS = 30;
const BCRYPT_ROUNDS = 12;

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 1 * 60 * 1000; // 1 minute lockout

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

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password.toLowerCase(), BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password.toLowerCase(), hash);
}

export function generateSessionId(): string {
  return crypto.randomBytes(32).toString("hex");
}

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

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export function setSessionCookie(res: Response, sessionId: string) {
  res.cookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE);
}

export function getSessionExpiryDate(): Date {
  return new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
}

export async function seedAdminUser() {
  // Seed admin user
  const adminEmail = "admin";
  const defaultPassword = "admin123";
  const existingAdmin = await storage.getUserByEmail(adminEmail);
  
  if (!existingAdmin) {
    const passwordHash = await hashPassword(defaultPassword);
    await storage.createUser({
      email: adminEmail,
      passwordHash,
      role: "admin",
      name: "Administrator",
    });
    console.log(`Admin user created: admin / ${defaultPassword}`);
  } else {
    // Always update password to ensure it matches
    const passwordHash = await hashPassword(defaultPassword);
    await storage.updateUserPassword(existingAdmin.id, passwordHash);
    console.log(`Admin user password reset: admin / ${defaultPassword}`);
  }

  // Seed checker user
  const checkerEmail = "checker";
  const checkerPassword = "checker123";
  const existingChecker = await storage.getUserByEmail(checkerEmail);
  
  if (!existingChecker) {
    const passwordHash = await hashPassword(checkerPassword);
    await storage.createUser({
      email: checkerEmail,
      passwordHash,
      role: "user",
      name: "Checker User",
    });
    console.log(`Checker user created: checker / ${checkerPassword}`);
  } else {
    // Always update password to ensure it matches
    const passwordHash = await hashPassword(checkerPassword);
    await storage.updateUserPassword(existingChecker.id, passwordHash);
    console.log(`Checker user password reset: checker / ${checkerPassword}`);
  }
}
