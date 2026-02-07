List and manage scenarios for the current user:

1. Login as admin via POST /api/auth/admin-login using $ADMIN_PASSWORD
2. GET /api/scenarios → list all scenarios with id, name, description, property count, dates
3. Show each scenario's metadata in a summary table

Available operations:
- POST /api/scenarios → save current state as new scenario (name, description)
- POST /api/scenarios/:id/load → load saved scenario (restores assumptions + properties)
- PATCH /api/scenarios/:id → update scenario name/description
- DELETE /api/scenarios/:id → delete scenario (cannot delete "Base")
- POST /api/scenarios/:id/clone → duplicate scenario with "(Copy)" suffix
- GET /api/scenarios/:id/export → download scenario as JSON
- POST /api/scenarios/import → upload and create scenario from JSON
- GET /api/scenarios/:id1/compare/:id2 → diff two scenarios

Notes:
- Scenarios store full snapshots (global assumptions + properties + images as base64)
- Loading a scenario REPLACES the entire portfolio — it's atomic
- The "Base" scenario is auto-created and cannot be deleted
- Export excludes images for smaller file size; import validates schema before creating
