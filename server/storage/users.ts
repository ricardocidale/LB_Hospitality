import { users, sessions, type User, type InsertUser, type Session } from "@shared/schema";
import { db } from "../db";
import { eq, and, gt, lt } from "drizzle-orm";

export class UserStorage {
  /** Look up a user by their numeric ID. Returns undefined if not found. */
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  /** Look up a user by email (case-insensitive). Used during login. */
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user || undefined;
  }

  /** Look up a user by phone number. Used for Twilio caller identification. */
  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    const normalized = phoneNumber.replace(/[^\d+]/g, '');
    const [user] = await db.select().from(users).where(eq(users.phoneNumber, normalized));
    return user || undefined;
  }

  /** Create a new user. Email is always lowercased for case-insensitive lookup. */
  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
        company: data.company,
        companyId: data.companyId,
        title: data.title,
      })
      .returning();
    return user;
  }

  /** List all users, ordered by creation date. Used by the admin user management panel. */
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  /**
   * Update a user's password hash and immediately invalidate all their sessions
   * so they must re-authenticate with the new password.
   */
  async updateUserPassword(id: number, passwordHash: string): Promise<void> {
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, id));
    await db.delete(sessions).where(eq(sessions.userId, id));
  }

  /** Update a user's profile fields (name, email, company, title). Timestamps the update. */
  async updateUserProfile(id: number, data: { firstName?: string; lastName?: string; email?: string; company?: string; companyId?: number | null; title?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  /** Set the user's preferred color theme. Pass null to revert to the group/default theme. */
  async updateUserSelectedTheme(id: number, themeId: number | null): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ selectedThemeId: themeId, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  /** Change a user's role (admin, partner, checker, investor). Admin-only operation. */
  async updateUserRole(id: number, role: string): Promise<void> {
    await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id));
  }

  // Sessions
  /** Create a new login session (called after successful authentication). */
  async createSession(userId: number, sessionId: string, expiresAt: Date): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values({ id: sessionId, userId, expiresAt })
      .returning();
    return session;
  }

  /**
   * Validate a session cookie: find the session, verify it hasn't expired,
   * and return it joined with the user record. This runs on every authenticated request.
   */
  async getSession(sessionId: string): Promise<(Session & { user: User }) | undefined> {
    const [result] = await db
      .select()
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())));
    
    if (!result) return undefined;
    return { ...result.sessions, user: result.users };
  }

  /** Delete a single session (user-initiated logout). */
  async deleteSession(sessionId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  /** Delete all sessions for a user (used after password change to force re-login). */
  async deleteUserSessions(userId: number): Promise<void> {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }

  /** Bulk-delete expired sessions. Called hourly by the cleanup interval in server/index.ts. */
  async deleteExpiredSessions(): Promise<number> {
    const result = await db.delete(sessions).where(lt(sessions.expiresAt, new Date())).returning();
    return result.length;
  }
}
