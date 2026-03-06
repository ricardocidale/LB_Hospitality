import { type Express } from "express";
import { storage } from "../../storage";
import { requireAdmin } from "../../auth";
import { userResponse, createUserSchema } from "../helpers";
import { fromZodError } from "zod-validation-error";
import { hashPassword } from "../../auth";

export function registerUserRoutes(app: Express) {
  // ────────────────────────────────────────────────────────────
  // ADMIN: USER MANAGEMENT
  // Full CRUD for user accounts. Only admins can access these endpoints.
  // ────────────────────────────────────────────────────────────

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map((u: any) => ({ ...userResponse(u), createdAt: u.createdAt, userGroupId: u.userGroupId })));
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const validation = createUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error).message });
      }
      
      const existingUser = await storage.getUserByEmail(validation.data.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      const { email, password, role, firstName, lastName, company, companyId, title } = validation.data;
      const passwordHash = await hashPassword(password);
      
      const user = await storage.createUser({
        email,
        passwordHash,
        role,
        firstName,
        lastName,
        company,
        companyId,
        title,
      });

      res.status(201).json(userResponse(user));
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { email, firstName, lastName, company, title, role } = req.body;

      if (role && id === req.user!.id) {
        return res.status(400).json({ error: "You cannot change your own role" });
      }

      const profileData: Record<string, any> = {};
      if (email !== undefined) profileData.email = email;
      if (firstName !== undefined) profileData.firstName = firstName;
      if (lastName !== undefined) profileData.lastName = lastName;
      if (company !== undefined) profileData.company = company;
      if (title !== undefined) profileData.title = title;

      if (Object.keys(profileData).length > 0) {
        await storage.updateUserProfile(id, profileData as any);
      }

      if (role) {
        await storage.updateUserRole(id, role);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.patch("/api/admin/users/:id/role", requireAdmin, async (req, res) => {
    try {
      const { role } = req.body;
      const id = Number(req.params.id);
      
      if (id === req.user!.id) {
        return res.status(400).json({ error: "You cannot change your own role" });
      }

      await storage.updateUserRole(id, role);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (id === req.user!.id) {
        return res.status(400).json({ error: "You cannot delete yourself" });
      }
      
      await storage.deleteUser(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.patch("/api/admin/users/:id/password", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { password } = req.body;
      if (!password || password.length < 4) {
        return res.status(400).json({ error: "Password must be at least 4 characters" });
      }
      const passwordHash = await hashPassword(password);
      await storage.updateUserPassword(id, passwordHash);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user password:", error);
      res.status(500).json({ error: "Failed to update password" });
    }
  });

  app.patch("/api/admin/users/:id/group", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { groupId } = req.body;
      const user = await storage.assignUserToGroup(id, groupId ?? null);
      res.json(user);
    } catch (error) {
      console.error("Error assigning user to group:", error);
      res.status(500).json({ error: "Failed to assign user to group" });
    }
  });

  app.post("/api/admin/reset-all-passwords", requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const defaultHash = await hashPassword("admin");
      let count = 0;
      for (const user of allUsers) {
        await storage.updateUserPassword(user.id, defaultHash);
        count++;
      }
      res.json({ success: true, message: `Reset passwords for ${count} users` });
    } catch (error) {
      console.error("Error resetting all passwords:", error);
      res.status(500).json({ error: "Failed to reset passwords" });
    }
  });
}
