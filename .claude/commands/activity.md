Show recent activity across the system:

1. Login as admin via POST /api/auth/admin-login using $ADMIN_PASSWORD
2. GET /api/admin/activity-logs?limit=50 → recent user actions (property edits, scenario saves, etc.)
3. GET /api/admin/login-logs → recent login/logout events with IPs
4. GET /api/admin/verification-history?limit=5 → recent verification runs with opinions
5. Summarize: actions per user, most-edited properties, verification trend

Activity log query parameters:
- userId: filter by specific user
- entityType: filter by entity (property, scenario, global_assumptions, user, verification, image)
- from/to: ISO date range
- limit: max results (default 50)

Activity log actions tracked:
- create/update/delete on properties
- update on global_assumptions
- save/load/delete on scenarios
- create/delete on users
- run on verification
- create on images (AI-generated property photos)

Notes:
- GET /api/activity-logs/mine?limit=20 shows the current user's own activity
- Login logs have 90-day retention
- Activity logs are permanent unless manually purged
