# No Hardcoded Values

## Rule

Never hardcode financial, operational, or admin-configurable values as literals. All such values must come from the database with named-constant fallbacks.

## Fallback Pattern (mandatory)

```typescript
// CORRECT — database value → named constant fallback
const taxRate = globalAssumptions.companyTaxRate ?? DEFAULT_COMPANY_TAX_RATE;

// WRONG — hardcoded literal
const taxRate = 0.30;

// WRONG — unnamed magic number as fallback
const taxRate = globalAssumptions.companyTaxRate ?? 0.30;
```

## Two Categories of Protected Values

### 1. Financial/Operational Assumptions
Any value configurable on the Company Assumptions page or Property Edit page must come from `globalAssumptions.*` or `property.*` with a `DEFAULT_*` constant fallback from `shared/constants.ts`.

> Full reference table of all protected fields: `.claude/skills/finance/constants-and-config.md`

**Exceptions (immutable — never configurable):**
- `DEPRECIATION_YEARS = 27.5` (IRS Pub 946)
- `DAYS_PER_MONTH = 30.5` (industry standard)

### 2. Admin-Configurable Settings
Any value an administrator can change via the Admin page must come from the database. No literals, no constants.

Covers: company name, logos, property type label, user group names/assignments, theme names/colors, sidebar visibility toggles, display settings, preferred LLM.

**Branding resolution chain (never short-circuit):**
- Company name: `myBranding.groupCompanyName` → `globalAssumptions.companyName`
- Logo: group logo → management co. logo pool → legacy URL → default asset
- Theme: `user.selectedThemeId` → `userGroup.themeId` → system default (`isDefault = true`)

> Full reference table of all admin-protected fields: `.claude/skills/finance/constants-and-config.md`

## How to Check

Before writing any value in code, ask:
1. Can a user or admin change this via any UI page? → Must come from the database.
2. Is a fallback needed? → Use the named constant from `shared/constants.ts`, never a raw number.
3. Is it DEPRECIATION_YEARS or DAYS_PER_MONTH? → These are the only allowed literals.
