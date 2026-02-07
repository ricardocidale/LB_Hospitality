List and manage design themes for the current user:

1. Login as admin via POST /api/auth/admin-login using $ADMIN_PASSWORD
2. GET /api/design-themes → list all themes for current user (includes system themes where userId=null)
3. Show each theme: name, active status, color count, palette vs chart color breakdown
4. GET /api/design-themes/active → show currently active theme details with full color palette
5. Summarize: total themes, active theme name, system vs user-owned themes

Theme management endpoints available:
- POST /api/design-themes → create theme (name, description, colors[])
- PATCH /api/design-themes/:id → update theme (name, description, colors)
- DELETE /api/design-themes/:id → delete theme (cannot delete active theme)
- POST /api/design-themes/:id/activate → set theme as active for current user

Notes:
- Themes with userId=null are system themes (e.g., seeded "Fluid Glass"), visible to all users
- Each user has their own set of themes plus system themes
- Colors have a description prefix: "PALETTE: " for UI colors, "CHART: " for chart colors
- Only theme owners can edit/delete their themes; system themes are read-only
- Auth: any logged-in user can manage their own themes (requireAuth, not requireAdmin)
