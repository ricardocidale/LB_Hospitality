import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  /**
   * Fetches a user by their unique ID from the database.
   * @param {string} id - The unique identifier of the user to retrieve
   * @returns {Promise<User | undefined>} The user record if found, or undefined if no user exists with the given ID
   */
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  /**
   * Inserts a new user record or updates an existing one if a user with the same ID already exists, setting the updatedAt timestamp on conflict.
   * @param {UpsertUser} userData - The user data to insert or update
   * @returns {Promise<User>} The inserted or updated user record
   */
  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
}

export const authStorage = new AuthStorage();
