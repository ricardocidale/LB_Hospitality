List all users, their roles, and recent login activity:

1. Login as admin via POST /api/auth/admin-login using $ADMIN_PASSWORD
2. GET /api/admin/users → list all users with id, email, name, company, role, createdAt
3. GET /api/admin/login-logs → show recent login/logout activity per user
4. GET /api/admin/active-sessions → show who's currently logged in
5. Summarize in a table: user count by role, active sessions, most recent login per user

User management endpoints available:
- POST /api/admin/users → create user (email, password, name, company, title)
- PATCH /api/admin/users/:id → update user profile
- PATCH /api/admin/users/:id/password → reset user password
- DELETE /api/admin/users/:id → delete user (cannot delete admin)

Notes:
- The "checker" user has role="user" but gets verification access via email check
- Admin user password syncs from ADMIN_PASSWORD env var on every server restart
- Deleting a user cascades: sessions, scenarios, properties, research, logs
