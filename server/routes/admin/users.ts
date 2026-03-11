import { type Express } from "express";
import { storage } from "../../storage";
import { requireAdmin, validatePassword } from "../../auth";
import { userResponse, createUserSchema, logAndSendError } from "../helpers";
import { fromZodError } from "zod-validation-error";
import { hashPassword } from "../../auth";
import { VALID_USER_ROLES } from "../../../shared/schema.js";
import { z } from "zod";

const roleSchema = z.enum(VALID_USER_ROLES);

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
      logAndSendError(res, "Failed to fetch users", error);
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

      const defaultGroup = await storage.getDefaultUserGroup();

      const user = await storage.createUser({
        email,
        passwordHash,
        role,
        firstName,
        lastName,
        company,
        companyId,
        title,
        userGroupId: defaultGroup?.id ?? null,
      });

      res.status(201).json(userResponse(user));
    } catch (error) {
      logAndSendError(res, "Failed to create user", error);
    }
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { email, firstName, lastName, company, companyId, title, role } = req.body;

      if (role !== undefined) {
        const roleResult = roleSchema.safeParse(role);
        if (!roleResult.success) {
          return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_USER_ROLES.join(", ")}` });
        }
        if (id === req.user!.id) {
          return res.status(400).json({ error: "You cannot change your own role" });
        }
      }

      const profileData: Record<string, any> = {};
      if (email !== undefined) profileData.email = email;
      if (firstName !== undefined) profileData.firstName = firstName;
      if (lastName !== undefined) profileData.lastName = lastName;
      if (company !== undefined) profileData.company = company;
      if (companyId !== undefined) profileData.companyId = companyId;
      if (title !== undefined) profileData.title = title;

      if (Object.keys(profileData).length > 0) {
        await storage.updateUserProfile(id, profileData as any);
      }

      if (role) {
        await storage.updateUserRole(id, role);
      }

      res.json({ success: true });
    } catch (error) {
      logAndSendError(res, "Failed to update user", error);
    }
  });

  app.patch("/api/admin/users/:id/role", requireAdmin, async (req, res) => {
    try {
      const { role } = req.body;
      const roleResult = roleSchema.safeParse(role);
      if (!roleResult.success) {
        return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_USER_ROLES.join(", ")}` });
      }

      const id = Number(req.params.id);

      if (id === req.user!.id) {
        return res.status(400).json({ error: "You cannot change your own role" });
      }

      await storage.updateUserRole(id, roleResult.data);
      res.json({ success: true });
    } catch (error) {
      logAndSendError(res, "Failed to update user role", error);
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
      logAndSendError(res, "Failed to delete user", error);
    }
  });

  app.patch("/api/admin/users/:id/password", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { password } = req.body;
      const validation = validatePassword(password ?? "");
      if (!validation.valid) {
        return res.status(400).json({ error: validation.message });
      }
      const passwordHash = await hashPassword(password);
      await storage.updateUserPassword(id, passwordHash);
      res.json({ success: true });
    } catch (error) {
      logAndSendError(res, "Failed to update password", error);
    }
  });

  app.patch("/api/admin/users/:id/group", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { groupId } = req.body;
      const user = await storage.assignUserToGroup(id, groupId ?? null);
      res.json(user);
    } catch (error) {
      logAndSendError(res, "Failed to assign user to group", error);
    }
  });

  app.patch("/api/admin/users/:id/theme", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { themeId } = req.body;
      await storage.updateUserSelectedTheme(id, themeId ?? null);
      res.json({ success: true });
    } catch (error) {
      logAndSendError(res, "Failed to assign theme", error);
    }
  });

  app.post("/api/admin/reset-all-passwords", requireAdmin, async (req, res) => {
    try {
      const { password, confirm } = req.body;
      if (typeof confirm !== "string" || confirm.trim() !== "RESET ALL PASSWORDS") {
        return res.status(400).json({ error: "Confirmation phrase required" });
      }
      const pwValidation = validatePassword(password ?? "");
      if (!pwValidation.valid) {
        return res.status(400).json({ error: pwValidation.message });
      }
      const allUsers = await storage.getAllUsers();
      const newHash = await hashPassword(password);
      // Update all passwords — if any fails, partial state is acceptable since
      // all passwords are being set to the same value. The admin can retry.
      let count = 0;
      for (const user of allUsers) {
        await storage.updateUserPassword(user.id, newHash);
        count++;
      }
      res.json({ success: true, message: `Reset passwords for ${count} users` });
    } catch (error) {
      logAndSendError(res, "Failed to reset passwords", error);
    }
  });
}
