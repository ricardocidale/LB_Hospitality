# Database Schema & Seeding

## Database Schema

The database schema is defined in `shared/schema.ts` using Drizzle ORM. All tables, insert schemas, and TypeScript types are co-located in this single file.

### Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `user_groups` | Named groups for multi-tenant branding | name, companyName, logoId, themeId, assetDescriptionId |
| `users` | User accounts and roles | email, passwordHash, role (admin/partner/checker/investor), name, company, title, userGroupId (FK→user_groups), selectedThemeId, createdAt, updatedAt |
| `sessions` | Active user sessions | id (text PK), userId (FK), expiresAt, createdAt |
| `global_assumptions` | Model-wide financial parameters | inflationRate, managementFees, SAFE funding, partner comp, staffing tiers, projectionYears |
| `properties` | Individual hotel assets | name, location, purchasePrice, roomCount, ADR, occupancy, cost rates, revenue shares |
| `scenarios` | Saved configuration snapshots | name, userId, globalAssumptionsSnapshot (JSON), propertiesSnapshot (JSON) |
| `login_logs` | Authentication audit trail | userId, email, ipAddress, success, timestamp |
| `market_research` | AI-generated research cache | type (property/company/global), content (JSON), propertyId, userId |
| `design_themes` | UI color theme definitions | name, colors (JSON array of DesignColor), isActive |
| `activity_logs` | User action audit trail | userId, action, entityType, entityId, entityName, metadata (JSONB), ipAddress, createdAt |
| `verification_runs` | Persisted verification results | userId, totalChecks, passed, failed, auditOpinion, overallStatus, results (JSONB), createdAt |

### Schema Conventions
- Most primary keys use `integer().primaryKey().generatedAlwaysAsIdentity()` (exception: `sessions` uses `text` PK)
- Foreign keys reference parent tables with `.references(() => table.id)`
- Temporal fields: `users`, `sessions`, and some tables use `timestamp` type for createdAt/updatedAt/expiresAt; property dates (acquisitionDate, operationsStartDate) use `text` in ISO format
- Financial rates stored as decimals (e.g., 0.03 for 3%)
- JSON fields use `jsonb` type with TypeScript type assertions (e.g., `DesignColor[]` for themes, JSON for scenario snapshots)

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
    ├── Check ADMIN_PASSWORD env var
    │   ├── Not set → Skip admin creation (warn to console)
    │   └── Set → Check if "admin" user exists
    │       ├── No  → Create with role "admin"
    │       └── Yes → Update password hash to match env var
    │
    ├── Check CHECKER_PASSWORD env var
    │   ├── Not set → Skip checker creation (warn to console)
    │   └── Set → Check if "checker@norfolkgroup.io" user exists
    │       ├── No  → Create with role "checker"
    │       └── Yes → Update password hash to match env var
    │
    ├── Check REYNALDO_PASSWORD env var
    │   ├── Not set → Skip Reynaldo creation (warn to console)
    │   └── Set → Check if "reynaldo.fagundes@norfolk.ai" user exists
    │       ├── No  → Create with role "partner"
    │       └── Yes → Update password hash to match env var
    │
    └── Ensure admin, checker, and Reynaldo users have a "Base" scenario
```

**Important**: The checker user has role `"checker"` in the database. Checker access is determined by the `requireChecker` middleware in `server/auth.ts`, which grants verification access to users with `role === "admin"` OR `email === "checker@norfolkgroup.io"`.

**Environment Variables Required**:
- `ADMIN_PASSWORD` - Sets the admin user's password
- `CHECKER_PASSWORD` - Sets the checker user's password
- `REYNALDO_PASSWORD` - Sets Reynaldo's password

If these env vars are not set, the respective user creation is skipped with a console warning.

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
    ├── Data exists + --force flag → Delete properties & global_assumptions, then re-seed
    └── No data → Seed everything
        │
        ├── Create admin user (email: "admin", password: "admin123") if not exists
        ├── Seed global assumptions (model start: 2026-04-01)
        └── Seed 5 sample properties:
            ├── The Hudson Estate (Upstate NY, 20 rooms, $330 ADR, Full Equity)
            ├── Eden Summit Lodge (Eden, Utah, 20 rooms, $390 ADR, Full Equity)
            ├── Austin Hillside (Austin, Texas, 20 rooms, $270 ADR, Full Equity)
            ├── Casa Medellín (Medellín, Colombia, 30 rooms, $180 ADR, Financed)
            └── Blue Ridge Manor (Asheville, NC, 30 rooms, $342 ADR, Financed)
```

**Important**: The dev seed script uses a hardcoded password ("admin123") and inserts the admin user directly into the database. In production, the automatic seeding (mechanism #1) overrides the password with the `ADMIN_PASSWORD` environment variable on every server restart. The `--force` flag only deletes properties and global_assumptions, not users.

### 3. Production Seeding Endpoints

**Location**: `server/routes.ts`

Two API endpoints handle production seeding:

#### a) Admin Seed Endpoint
```
POST /api/admin/seed-production
Authorization: Admin role required
```

Seeds users, global assumptions, properties, and design themes. Skips any category where data already exists.

**Seeded Users** (skips if email already exists):
| Email | Role | Name | Company | Title |
|-------|------|------|---------|-------|
| admin | admin | Ricardo Cidale | Norfolk Group | Partner |
| rosario@kitcapital.com | user | Rosario David | KIT Capital | COO |
| kit@kitcapital.com | user | Dov Tuzman | KIT Capital | Principal |
| lemazniku@icloud.com | user | Lea Mazniku | KIT Capital | Partner |
| checker@norfolkgroup.io | checker | Checker | Norfolk AI | Checker |
| bhuvan@norfolkgroup.io | user | Bhuvan Agarwal | Norfolk AI | Financial Analyst |
| reynaldo.fagundes@norfolk.ai | user | Reynaldo Fagundes | Norfolk AI | CTO |
| leslie@cidale.com | user | Leslie Cidale | Numeratti Endeavors | Senior Partner |

**Seeded User Groups** (skips if group name already exists):
| Group Name | Company Name | Members |
|------------|-------------|---------|
| KIT Group | KIT Capital | Rosario David, Dov Tuzman, Lea Mazniku |
| Norfolk Group | Norfolk Group | Ricardo Cidale, Checker, Bhuvan Agarwal, Reynaldo Fagundes |

User groups control branding (company name, logo, theme, asset description) for all members. Branding resolution priority: user-level override > group-level > system default.

**Seeded Properties** (skips if name already exists):
| Name | Location | Rooms | ADR | Type |
|------|----------|-------|-----|------|
| The Hudson Estate | Upstate New York | 20 | $330 | Full Equity |
| Eden Summit Lodge | Eden, Utah | 20 | $390 | Full Equity |
| Austin Hillside | Austin, Texas | 20 | $270 | Full Equity |
| Casa Medellín | Medellín, Colombia | 30 | $180 | Financed |
| Blue Ridge Manor | Asheville, NC | 30 | $342 | Financed |

**Design Theme Seeded** (skips if any themes exist):
- Fluid Glass (active) - Apple-inspired translucent design with sage green, deep green, cream, and black

### Seeding Best Practices

1. **Idempotency**: All seed mechanisms check for existing data before inserting. Running them multiple times is safe.

2. **Password Security**: Production passwords come from environment variables (`ADMIN_PASSWORD`, `CHECKER_PASSWORD`), never from hardcoded values. The dev seed script's hardcoded password is overridden on server start.

3. **Order of Operations**: Users must exist before properties (foreign key constraint). The seed scripts handle this ordering automatically.

4. **Resetting Data**: To completely reset:
   - Use `npx tsx server/seed.ts --force` for development
   - For production, manually clear tables via SQL, then call the seed endpoint

5. **Seeding Must Be Error-Proof**: Seed data is the foundation of all financial calculations. Any error in seed values (wrong operating reserve, missing refinance parameters, incorrect rates) causes cascading calculation failures across the entire model. Seed data constants must be reviewed and verified before any deployment.

6. **Database Sync Is SQL-Only**: Synchronizing values between production and development databases must be done via direct SQL statements. See `.claude/rules/database-sync-sql-only.md`.

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
