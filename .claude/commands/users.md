List all users, their roles, group assignments, and recent login activity:

1. Login as admin via POST /api/auth/admin-login using $ADMIN_PASSWORD
2. GET /api/admin/users → list all users with id, email, name, company, role, createdAt, userGroupId, assignedLogoId, assignedThemeId, assignedAssetDescriptionId
3. GET /api/admin/user-groups → list all user groups with id, name, companyName, logoId, themeId, assetDescriptionId
4. GET /api/admin/login-logs → show recent login/logout activity per user
5. GET /api/admin/active-sessions → show who's currently logged in
6. Summarize in a table: user count by role, group membership, active sessions, most recent login per user

User management endpoints available:
- POST /api/admin/users → create user (email, password, name, company, title)
- PATCH /api/admin/users/:id → update user profile
- PATCH /api/admin/users/:id/password → reset user password
- DELETE /api/admin/users/:id → delete user (cannot delete admin)

User group management endpoints:
- GET /api/admin/user-groups → list all groups
- POST /api/admin/user-groups → create group (name, companyName, logoId?, themeId?, assetDescriptionId?)
- PATCH /api/admin/user-groups/:id → update group
- DELETE /api/admin/user-groups/:id → delete group (unassigns members)
- POST /api/admin/user-groups/:id/assign → assign user to group ({ userId })
- POST /api/admin/user-groups/:id/unassign → remove user from group ({ userId })

Branding resolution (GET /api/my-branding):
- Priority: user-level override > group-level > system default
- Group provides: companyName, logo, theme, asset description
- User overrides: assignedLogoId, assignedThemeId, assignedAssetDescriptionId

Current groups:
- KIT Group (company: KIT Capital) → Rosario David, Dov Tuzman, Lea Mazniku
- Norfolk Group (company: Norfolk Group) → Ricardo Cidale, Checker, Bhuvan Agarwal, Reynaldo Fagundes

Notes:
- The "checker" user has role="checker" and gets verification access via requireChecker middleware
- Admin user password syncs from ADMIN_PASSWORD env var on every server restart
- Checker user password syncs from CHECKER_PASSWORD env var on every server restart
- Reynaldo's password syncs from REYNALDO_PASSWORD env var on every server restart
- Deleting a user cascades: sessions, scenarios, properties, research, logs
