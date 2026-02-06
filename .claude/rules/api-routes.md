# API Routes Reference

## Authentication

All routes under `/api/auth/` handle user authentication.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/login` | None | Login with email + password. Rate-limited by IP. |
| `POST` | `/api/auth/admin-login` | None | Convenience login for admin user (uses ADMIN_PASSWORD env var) |
| `POST` | `/api/auth/logout` | Any | Clear session cookie and log out |
| `GET` | `/api/auth/me` | Any | Get current authenticated user info |

### Login Request
```json
{ "email": "admin", "password": "..." }
```

### Login Response
```json
{ "user": { "id": 1, "email": "admin", "name": "Ricardo Cidale", "role": "admin" } }
```

## User Profile

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `PATCH` | `/api/profile` | User | Update own profile (name, email, company, title) |
| `PATCH` | `/api/profile/password` | User | Change own password |

## Admin - User Management

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/admin/users` | Admin | List all users |
| `POST` | `/api/admin/users` | Admin | Create new user |
| `PATCH` | `/api/admin/users/:id` | Admin | Update user profile |
| `PATCH` | `/api/admin/users/:id/password` | Admin | Reset user password |
| `DELETE` | `/api/admin/users/:id` | Admin | Delete user |
| `GET` | `/api/admin/login-logs` | Admin | Get login audit history |

## Admin - Seeding & Verification

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/admin/seed-production` | Admin | Seed database with production data |
| `GET` | `/api/admin/run-verification` | Admin/Checker | Run independent financial verification |
| `POST` | `/api/admin/ai-verification` | Admin/Checker | AI-powered methodology review (SSE stream) |
| `GET` | `/api/admin/run-design-check` | Admin | Run design consistency check on frontend |

## Global Assumptions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/global-assumptions` | User | Get current global assumptions |
| `POST` | `/api/global-assumptions` | User | Create or update global assumptions |

### Global Assumptions Response (key fields)
```json
{
  "id": 1,
  "modelStartDate": "2026-04-01",
  "projectionYears": 10,
  "inflationRate": 0.03,
  "baseManagementFee": 0.05,
  "incentiveManagementFee": 0.15,
  "staffSalary": 75000,
  "staffTier1MaxProperties": 3,
  "staffTier1Fte": 2.5,
  "staffTier2MaxProperties": 6,
  "staffTier2Fte": 4.5,
  "staffTier3Fte": 7.0,
  "debtAssumptions": { "acqLTV": 0.75, "interestRate": 0.09, "amortizationYears": 25 }
}
```

## Properties

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/properties` | User | List all properties for current user |
| `GET` | `/api/properties/:id` | User | Get single property by ID |
| `POST` | `/api/properties` | User | Create new property |
| `PATCH` | `/api/properties/:id` | User | Update existing property |
| `DELETE` | `/api/properties/:id` | User | Delete property |

### Property Response (key fields)
```json
{
  "id": 1,
  "name": "The Hudson Estate",
  "location": "Upstate New York",
  "market": "North America",
  "roomCount": 20,
  "startAdr": 330,
  "purchasePrice": 2300000,
  "type": "Full Equity",
  "cateringLevel": "Partial",
  "costRateRooms": 0.36,
  "costRateFB": 0.38
}
```

## Scenarios

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/scenarios` | User | List all scenarios for current user |
| `POST` | `/api/scenarios` | User | Save current state as new scenario |
| `POST` | `/api/scenarios/:id/load` | User | Load saved scenario (restores all data) |
| `PATCH` | `/api/scenarios/:id` | User | Update scenario name/description |
| `DELETE` | `/api/scenarios/:id` | User | Delete scenario (cannot delete "Base") |

### Scenario Save Request
```json
{ "name": "Optimistic Case", "description": "Higher ADR growth scenario" }
```

## Design Themes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/admin/design-themes` | Admin | List all themes |
| `GET` | `/api/admin/design-themes/active` | None | Get active theme |
| `POST` | `/api/admin/design-themes` | Admin | Create theme |
| `PATCH` | `/api/admin/design-themes/:id` | Admin | Update theme |
| `DELETE` | `/api/admin/design-themes/:id` | Admin | Delete theme |
| `POST` | `/api/admin/design-themes/:id/activate` | Admin | Set theme as active |

## Market Research

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/research/:type` | User | Get cached research (type: property/company/global) |
| `POST` | `/api/research/generate` | User | Generate new AI research (SSE stream) |

### Research Generate Request
```json
{
  "type": "property",
  "propertyId": 1,
  "propertyContext": { "name": "The Hudson Estate", "location": "..." },
  "boutiqueDefinition": { ... }
}
```

## File Uploads

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/uploads/request-url` | User | Get presigned upload URL for object storage |
| `GET` | `/api/objects/*` | None | Serve uploaded files from object storage |

## Utility

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/fix-images` | None | Utility endpoint to fix property image URLs |

## One-Time Seeding

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/seed-production` | None | Initial database population (skips if data exists) |

## Auth Roles

| Role | Access Level |
|------|-------------|
| `admin` | Full access to all endpoints including user management and verification |
| `user` | Standard access to properties, assumptions, scenarios, research |

**Checker Access**: The `requireChecker` middleware grants verification endpoint access to users with `role === "admin"` OR `email === "checker"`. The checker user has role `"user"` in the database — checker is identified by email, not by a separate role.

## Error Responses

All errors follow this format:
```json
{ "error": "Human-readable error message" }
```

Common HTTP status codes:
- `400` - Bad request (validation failure)
- `401` - Not authenticated
- `403` - Access denied (insufficient role)
- `404` - Resource not found
- `429` - Rate limited (too many login attempts)
- `500` - Server error
