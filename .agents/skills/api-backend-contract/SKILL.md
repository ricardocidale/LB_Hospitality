---
name: api-backend-contract
description: The server-side architecture and API surface for the HBG Portal. Covers Express backend structure, route modules, storage interface, authentication middleware, rate limiting, SSE streaming, scenario system, multi-tenancy, and role-based access control. Use this skill when working on server routes, API endpoints, storage operations, or authentication.
---

# API & Backend Contract

This skill documents the server-side architecture, API surface, and data access patterns of the HBG Portal.

**Related skills:** `hbg-business-model` (domain model), `financial-engine` (dual-engine architecture), `verification-system` (server-side checker), `integrations-infrastructure` (external services), `marcela-ai-system` (AI endpoints)

---

## Express Backend Structure

| File | Role |
|------|------|
| `server/index.ts` | Entry point — Express app setup, middleware, server start |
| `server/routes.ts` | Central route registry — imports and registers all route modules |
| `server/storage.ts` | `IStorage` interface + Drizzle ORM implementation (delegates to `server/storage/` modules) |
| `server/db.ts` | Database connection (PostgreSQL via Drizzle) |
| `server/auth.ts` | Authentication, session management, authorization middleware |
| `server/logger.ts` | Structured logging utility |

---

## Route Modules

All routes are organized by domain. Each module exports a `register(app)` function called from `server/routes.ts`.

### Core Domain Routes

| Module | File | Key Endpoints |
|--------|------|--------------|
| **Auth** | `server/routes/auth.ts` | `POST /api/login`, `POST /api/logout`, `GET /api/me`, `PUT /api/profile` |
| **Properties** | `server/routes/properties.ts` | CRUD: `GET/POST/PUT/DELETE /api/properties`, `POST /api/properties/:id/seed-research` |
| **Global Assumptions** | `server/routes/global-assumptions.ts` | `GET/PUT /api/global-assumptions` |
| **Scenarios** | `server/routes/scenarios.ts` | `GET/POST/PUT/DELETE /api/scenarios`, `POST /api/scenarios/:id/load` |
| **Branding** | `server/routes/branding.ts` | `GET /api/branding` — theme/logo resolution with user → group → system fallback |

### Calculation & Verification Routes

| Module | File | Key Endpoints |
|--------|------|--------------|
| **Calculations** | `server/routes/calculations.ts` | Verification runs, DCF analysis, IRR vector, consolidation |
| **Market Rates** | `server/routes/market-rates.ts` | SOFR, Treasury, Fed Funds rate fetching |

### AI & Research Routes

| Module | File | Key Endpoints |
|--------|------|--------------|
| **Research** | `server/routes/research.ts` | SSE streaming research generation, research CRUD |
| **AI** | `server/routes/ai.ts` | General AI endpoints |
| **Marcela Tools** | `server/routes/marcela-tools.ts` | Webhook tool endpoints for Marcela |
| **ICP Research** | `server/routes/icp-research.ts` | Company-level research driven by ICP config |
| **Chat** | `server/routes/chat.ts` | Rebecca text chat endpoints |
| **Premium Exports** | `server/routes/premium-exports.ts` | AI-structured document generation |

### Integration Routes

| Module | File | Key Endpoints |
|--------|------|--------------|
| **Google Auth** | `server/routes/google-auth.ts` | OAuth 2.0 login/callback |
| **Twilio** | `server/routes/twilio.ts` | SMS notifications (HTTP + WebSocket) |
| **Documents** | `server/routes/documents.ts` | Document upload, OCR extraction |
| **Geospatial** | `server/routes/geospatial.ts` | Geocoding, Places autocomplete, POI |
| **Geo** | `server/routes/geo.ts` | Geographic data endpoints |

### Admin Routes

| Module | File | Key Endpoints |
|--------|------|--------------|
| **Admin** | `server/routes/admin.ts` | Users, companies, groups, navigation toggles, database tools |
| **Admin Integrations** | `server/routes/admin-integrations.ts` | Integration configuration |
| **Admin Marcela** | `server/routes/admin/marcela.ts` | Convai/Marcela config, voice settings, KB rebuild |

### Asset Routes

| Module | File | Key Endpoints |
|--------|------|--------------|
| **Object Storage** | `server/replit_integrations/object_storage/` | File storage routes |
| **Uploads** | `server/routes/uploads.ts` | File upload handling |
| **Property Photos** | `server/routes/property-photos.ts` | Property image management |
| **Tiles** | `server/routes/tiles.ts` | Dashboard tile configuration |
| **Property Finder** | `server/routes/property-finder.ts` | Acquisition search |
| **Notifications** | `server/routes/notifications.ts` | Alert management (DSCR/occupancy breach thresholds) |

---

## Storage Interface Pattern

All database access goes through the `IStorage` interface in `server/storage.ts`, backed by Drizzle ORM against PostgreSQL.

### Design Principles
- **Routes are thin dispatchers** — they validate input, call storage methods, and format responses
- **All CRUD goes through storage methods** — never query the database directly in route files
- **Types from `@shared/schema.ts`** — storage methods use the Drizzle schema types
- **Transactions for atomicity** — multiple related operations wrapped in database transactions

### Schema Location
`shared/schema.ts` defines all database tables using Drizzle ORM. Key tables:
- `users`, `sessions`, `userGroups`
- `properties`, `globalAssumptions`, `feeCategories`
- `scenarios`, `scenarioSnapshots`
- `research`, `companyResearch`
- `notifications`, `alertConfigs`
- `themes`, `brandAssets`

---

## Authentication & Authorization

### Middleware Chain

| Middleware | File | Purpose | HTTP Status on Failure |
|-----------|------|---------|----------------------|
| `authMiddleware` | `server/auth.ts` | Runs on every request. Loads user from session cookie → `req.user` | — (silent, sets user or not) |
| `requireAuth` | `server/auth.ts` | Any logged-in user | 401 Unauthorized |
| `requireAdmin` | `server/auth.ts` | Admin role only | 403 Forbidden |
| `requireChecker` | `server/auth.ts` | Admin or checker role | 403 Forbidden |
| `requireManagementAccess` | `server/auth.ts` | Everyone except investors (admin + partner + checker) | 403 Forbidden |

### Session Management
- Sessions stored in the database (survive server restarts)
- 64-character cryptographically random session ID in HTTP-only cookie
- 7-day expiry
- Session cookie name: `session_id`

### Password Security
- bcrypt with 12 salt rounds
- Password validation: 8+ characters, mixed case, digits
- Never stored in plain text

---

## Rate Limiting

| Scope | Limit | Lockout | Applied To |
|-------|-------|---------|-----------|
| Login attempts | 5 per IP | 15 minutes | `POST /api/login` |
| AI/Research calls | Per-user sliding window | 1 minute | Research generation endpoints |

Both rate limit maps are cleaned hourly by `server/index.ts`.

---

## SSE Streaming

Server-Sent Events are used for research generation to stream AI progress to the client in real-time:

```
Client: GET /api/research/:id/generate (with Accept: text/event-stream)
Server: Streams { type: "content" | "done" | "error", data: string } events
```

The research generation uses an async generator pattern that yields chunks as the LLM produces them.

---

## Dual-Engine Architecture

The client-side and server-side engines serve different purposes:

| Engine | Location | Purpose | Shares Code? |
|--------|----------|---------|-------------|
| Property Engine | `client/src/lib/financial/property-engine.ts` | Real-time UI recalculation | No |
| Company Engine | `client/src/lib/financial/company-engine.ts` | Real-time UI recalculation | No |
| Calculation Checker | `server/calculation-checker/` | Independent verification | **Never** |

The checker must **never share calculation code** with the client engines to maintain independence. See the `verification-system` skill.

---

## Scenario System

Scenarios enable what-if portfolio analysis:

### Data Model
- JSONB snapshots storing full `globalAssumptions` + `properties` + `feeCategories`
- Each scenario has a name, description, and creation timestamp
- Users can have multiple saved scenarios

### Operations
1. **Save** — Snapshot current state as a named scenario
2. **Load** — Replace all current assumptions with scenario data, trigger full recalculation
3. **Compare** — Side-by-side comparison of multiple scenarios (see `calc/analysis/scenario-compare.ts`)
4. **Delete** — Remove a scenario

Loading a scenario replaces **all** assumptions (global + per-property + fee categories) and the client triggers a full engine recalculation.

---

## Multi-Tenancy Data Flow

```
User → UserGroup → Property Visibility Filter
```

### User Groups
- Each user belongs to a `userGroup`
- Groups control which properties the user can see
- Admin users bypass all property filters

### Branding Resolution
Theme and logo cascade through a fallback hierarchy:
```
User's selected theme → Group's assigned theme → System default theme
```

This enables white-labeling: each user group can have custom branding (logo, color theme, asset descriptions for AI context).

---

## Role-Based Access Control

| Role | Access Level | Property Filter | Can Edit Assumptions | Can Run Verification | Admin Panel |
|------|-------------|----------------|---------------------|---------------------|-------------|
| **Admin** | Full access | Sees all properties | Yes | Yes | Yes |
| **Partner** | Management access | Sees all properties | Yes | No | No |
| **Checker** | Read-only + verification | Sees all properties | No | Yes | No |
| **Investor** | Read-only dashboard | Filtered by user group | No | No | No |

---

## Key Files

| File | Purpose |
|------|---------|
| `server/index.ts` | Express app setup, middleware registration, server start |
| `server/routes.ts` | Central route registry |
| `server/storage.ts` | IStorage interface + Drizzle implementation |
| `server/db.ts` | PostgreSQL connection via Drizzle |
| `server/auth.ts` | Authentication, sessions, authorization middleware |
| `server/logger.ts` | Structured logging |
| `shared/schema.ts` | Database schema (Drizzle ORM tables) |
| `server/routes/` | All route modules organized by domain |
| `server/calculation-checker/` | Independent verification engine |
