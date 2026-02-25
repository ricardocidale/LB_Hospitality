import type { Request } from "express";
import { storage } from "../storage";
import { VALID_USER_ROLES } from "@shared/schema";
import { z } from "zod";

/** Combine first + last name into a display-friendly string. Returns null if both are empty. */
export function fullName(user: { firstName?: string | null; lastName?: string | null }): string | null {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : null;
}

/** Strip sensitive fields (password hash, etc.) from a user record before sending to the client. */
export function userResponse(u: any, extra?: Record<string, any>) {
  return { 
    id: u.id, 
    email: u.email, 
    firstName: u.firstName, 
    lastName: u.lastName, 
    name: fullName(u), 
    company: u.company, 
    companyId: u.companyId, 
    title: u.title, 
    role: u.role, 
    ...extra 
  };
}

/**
 * Log a user action to the activity_logs table. Non-blocking — errors are
 * caught and logged to console so they never break the primary request.
 */
export function logActivity(
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

export const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  company: z.string().max(100).optional(),
  companyId: z.number().nullable().optional(),
  title: z.string().max(100).optional(),
  role: z.enum(VALID_USER_ROLES).optional().default("partner"),
});

export const createScenarioSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
});

export const MAX_SCENARIOS_PER_USER = 20;

export const researchGenerateSchema = z.object({
  type: z.enum(["property", "company", "global"]),
  propertyId: z.number().optional(),
  propertyContext: z.record(z.any()).optional(),
  assetDefinition: z.record(z.any()).optional(),
  researchVariables: z.object({
    focusAreas: z.array(z.string()).optional(),
    regions: z.array(z.string()).optional(),
    timeHorizon: z.string().optional(),
    customQuestions: z.string().optional(),
  }).optional(),
});

export const VALID_RESEARCH_TYPES = ["property", "company", "global"] as const;
