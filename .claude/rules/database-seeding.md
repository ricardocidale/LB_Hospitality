# Database Schema & Seeding

## Database Schema

The database schema is defined in `shared/schema.ts` using Drizzle ORM. All tables, insert schemas, and TypeScript types are co-located in this single file.

### Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User accounts and roles | email, passwordHash, role (admin/user), name, company, title |
| `global_assumptions` | Model-wide financial parameters | inflationRate, managementFees, SAFE funding, partner comp, staffing tiers, projectionYears |
| `properties` | Individual hotel assets | name, location, purchasePrice, roomCount, ADR, occupancy, cost rates, revenue shares |
| `scenarios` | Saved configuration snapshots | name, userId, globalAssumptionsSnapshot (JSON), propertiesSnapshot (JSON) |
| `login_logs` | Authentication audit trail | userId, email, ipAddress, success, timestamp |
| `market_research` | AI-generated research cache | type (property/company/global), content (JSON), propertyId, userId |
| `design_themes` | UI color theme definitions | name, colors (JSON array), isActive |

### Schema Conventions
- Primary keys use `integer().primaryKey().generatedAlwaysAsIdentity()`
- Foreign keys reference parent tables with `.references(() => table.id)`
- Date fields stored as `text` in ISO format (not timestamp) for portability
- Financial rates stored as decimals (e.g., 0.03 for 3%)
- JSON fields use `jsonb` type with TypeScript type assertions

## Seeding System

There are **three seeding mechanisms**, each serving a different purpose:

### 1. Automatic User Seeding (on every server start)

**Location**: `server/auth.ts` → `seedAdminUser()`
**Called from**: `server/index.ts` on startup

This runs automatically every time the server starts. It ensures the `admin` and `checker` users exist and their passwords match the environment variables.

```
Server starts
    │
    ▼
seedAdminUser() in server/auth.ts
    │
    ├── Check if "admin" user exists
    │   ├── No  → Create with ADMIN_PASSWORD env var
    │   └── Yes → Update password hash to match ADMIN_PASSWORD
    │
    ├── Check if "checker" user exists
    │   ├── No  → Create with CHECKER_PASSWORD env var
    │   └── Yes → Update password hash to match CHECKER_PASSWORD
    │
    └── Ensure both users have a "Base" scenario
```

**Environment Variables Required**:
- `ADMIN_PASSWORD` - Sets the admin user's password
- `CHECKER_PASSWORD` - Sets the checker user's password

If these env vars are not set, user creation is skipped with a warning.

### 2. Development Seeding Script

**Location**: `server/seed.ts`
**Command**: `npx tsx server/seed.ts` or `npx tsx server/seed.ts --force`

This is a standalone script for development environments. It creates sample data for testing.

```
npx tsx server/seed.ts
    │
    ▼
Check if global_assumptions or properties exist
    │
    ├── Data exists + no --force flag → Skip (prevent duplicates)
    ├── Data exists + --force flag → Delete all, then re-seed
    └── No data → Seed everything
        │
        ├── Create admin user (email: "admin", password: "admin123")
        ├── Seed global assumptions (model start: 2026-04-01)
        └── Seed sample properties:
            ├── The Hudson Estate (Upstate NY, 20 rooms, $330 ADR)
            ├── Hacienda Luna (Riviera Maya, 30 rooms, $280 ADR)
            ├── The Pines (Vermont, 15 rooms, $250 ADR)
            └── Casa Montaña (San Miguel de Allende, 25 rooms, $180 ADR)
```

**Important**: The dev seed script uses a hardcoded password ("admin123"). In production, the automatic seeding (mechanism #1) overrides this with the `ADMIN_PASSWORD` environment variable on every server restart.

### 3. Production Seeding Endpoints

**Location**: `server/routes.ts`

Two API endpoints handle production seeding:

#### a) Admin Seed Endpoint
```
POST /api/admin/seed-production
Authorization: Admin role required
```

Seeds users, global assumptions, properties, and design themes. Skips any category where data already exists.

**Seeded Users**:
| Email | Role | Name | Company |
|-------|------|------|---------|
| admin | admin | Ricardo Cidale | Norfolk Group |
| rosario@kitcapital.com | user | Rosario David | KIT Capital |
| checker | user | Checker User | - |
| sante@norfolk.com | admin | Sante Cidale | Norfolk Group |

**Seeded Properties**:
| Name | Location | Rooms | ADR | Type |
|------|----------|-------|-----|------|
| The Hudson Estate | Upstate New York | 20 | $330 | Full Equity |
| Hacienda Luna | Riviera Maya, Mexico | 30 | $280 | Financed |
| The Pines | Vermont | 15 | $250 | Full Equity |
| Casa Montaña | San Miguel de Allende | 25 | $180 | Full Equity |

**Design Themes Seeded**:
- Sage & Stone (default active) - sage green primary palette
- Ocean Depth - deep navy and teal palette
- Desert Rose - warm terracotta palette

#### b) One-Time Public Seed Endpoint
```
POST /api/seed-production
Authorization: None (intended for initial setup only)
```

A simpler endpoint for first-time database population. Seeds global assumptions and properties only. Returns early if any properties already exist, preventing duplicate data.

### Seeding Best Practices

1. **Idempotency**: All seed mechanisms check for existing data before inserting. Running them multiple times is safe.

2. **Password Security**: Production passwords come from environment variables (`ADMIN_PASSWORD`, `CHECKER_PASSWORD`), never from hardcoded values. The dev seed script's hardcoded password is overridden on server start.

3. **Order of Operations**: Users must exist before properties (foreign key constraint). The seed scripts handle this ordering automatically.

4. **Resetting Data**: To completely reset:
   - Use `npx tsx server/seed.ts --force` for development
   - For production, manually clear tables via SQL, then call the seed endpoint

## Global Assumptions Seed Defaults

| Parameter | Default Value | Description |
|-----------|--------------|-------------|
| modelStartDate | 2026-04-01 | When financial projections begin |
| companyOpsStartDate | 2026-06-01 | When management company starts operating |
| projectionYears | 10 | Number of years to project (configurable 1-30) |
| inflationRate | 3% | Annual inflation for cost escalation |
| fixedCostEscalationRate | 3% | Annual increase for fixed costs |
| baseManagementFee | 5% | Base management fee on revenue |
| incentiveManagementFee | 15% | Incentive fee on GOP above threshold |
| staffSalary | $75,000 | Average annual salary per staff FTE |
| staffTier1MaxProperties | 3 | Tier 1: up to 3 properties |
| staffTier1Fte | 2.5 | Tier 1: 2.5 full-time employees |
| staffTier2MaxProperties | 6 | Tier 2: up to 6 properties |
| staffTier2Fte | 4.5 | Tier 2: 4.5 full-time employees |
| staffTier3Fte | 7.0 | Tier 3: 7+ properties, 7.0 FTE |
| safeTranche1Amount | $1,000,000 | First funding tranche |
| safeTranche2Amount | $1,000,000 | Second funding tranche |
| exitCapRate | 8.5% | Cap rate for property sale valuation |
| commissionRate | 5% | Sales commission on property sale |
| taxRate | 25% | Default tax rate |

## Database Migrations

Schema changes follow this process:

1. Update `shared/schema.ts` with new columns/tables
2. Add SQL migration via `ALTER TABLE` for existing databases
3. Update seed endpoints with default values for new fields
4. Run `npx drizzle-kit push` if using Drizzle's push flow

**Example migration** (adding staffing tier columns):
```sql
ALTER TABLE global_assumptions
  ADD COLUMN IF NOT EXISTS staff_tier1_max_properties INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS staff_tier1_fte REAL NOT NULL DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS staff_tier2_max_properties INTEGER NOT NULL DEFAULT 6,
  ADD COLUMN IF NOT EXISTS staff_tier2_fte REAL NOT NULL DEFAULT 4.5,
  ADD COLUMN IF NOT EXISTS staff_tier3_fte REAL NOT NULL DEFAULT 7.0;
```
