---
name: settings-architecture
description: Where every configurable setting belongs in the HBG Portal. Covers the three configuration surfaces (Management Company, General Settings, Admin Panel), property edit overrides, overlap prevention rules, and the decision tree for placing new settings. Use this skill when adding or moving any configurable setting.
---

# Settings Architecture — Where Configuration Lives

This skill defines where every configurable setting belongs in the HBG Portal. It prevents settings from being placed in the wrong location and eliminates duplicate controls across pages. Every new setting must be placed according to these rules.

**Related skills:** `hbg-business-model` (dual-entity model context), `financial-engine` (how engines consume settings), `api-backend-contract` (storage interface for global_assumptions and properties), `consistent-card-widths` (layout patterns for settings pages), `save-button-placement` (save button patterns for settings forms)

---

## The Three Configuration Surfaces

### 1. Management Company Page (`/company` + `/company/assumptions`)
**Owner:** The management entity itself — its identity, revenue model, and operating costs.

**What belongs here:**
- Company identity: name, logo, contact info, EIN, address, founding year
- Company timeline: operations start date, projection years
- Revenue model: service fee category templates, incentive management fee rate
- Operating costs: staffing tiers, compensation schedules, fixed overhead, variable costs
- Funding: SAFE note tranches, amounts, dates, gates
- Company-specific economics: company tax rate, company inflation rate, cost of equity

**Decision test:** "Does this setting describe *what the management company is* or *how it operates*?" → It belongs here.

**Sub-page structure:**
- `/company` — Financial statements (Income, Cash Flow, Balance Sheet) with CompanyHeader KPIs
- `/company/assumptions` — All assumption inputs organized by section (Setup, Funding, Fees, Compensation, Overhead, Variable Costs, Tax)

### 2. General Settings (`/settings`)
**Owner:** System-wide defaults and preferences that affect multiple entities or the platform behavior.

**Tabs:**
- **Property Defaults** — Default values used when creating new properties (cost rates, financing terms, revenue shares, exit cap rate, commissions). These are templates, not per-property overrides.
- **Macro** — Economic factors (global inflation rate, fiscal year start month)
- **Other** — UI behavior (calculation transparency toggles, research auto-refresh, guided tour)

**What belongs here:**
- Default property operating cost rates (rooms, F&B, admin, marketing, etc.)
- Default financing terms (LTV, interest rate, term, closing costs)
- Default revenue share percentages (events, F&B, other)
- Default exit cap rate and disposition commission
- Global inflation rate (distinct from company-specific inflation)
- Fiscal year configuration
- UI preference toggles

**Decision test:** "Is this a default that applies to *new properties* or *platform-wide behavior*?" → It belongs here.

**Critical rule:** When a new property is created, it MUST read defaults from General Settings (global_assumptions), not from hardcoded constants in shared/constants.ts. The hardcoded constants are only fallbacks if global_assumptions has no value.

### 3. Admin Panel (`/admin`)
**Owner:** Platform administration — things only a system administrator should configure.

**What belongs here:**
- User management (users, groups, companies)
- ICP / Research Center configuration
- AI agent configuration (Marcela, Rebecca, LLM models)
- Design system (logos, themes)
- Navigation visibility toggles
- System monitoring (verification, database, integrations, activity logs)
- Notification rules and channels
- Architecture diagrams

**What does NOT belong here:**
- Financial defaults (→ General Settings)
- Company identity or operating assumptions (→ Management Company)
- Revenue stream / fee category configuration (→ Management Company)
- Any setting that a Partner-level user should be able to adjust

**Decision test:** "Would a non-admin user ever need to see or change this?" → If yes, it does NOT belong in Admin.

## Property Edit (`/properties/:id/edit`)
**Owner:** The individual property SPV — its specific deal terms and assumptions.

**What belongs here:**
- Everything about this specific property: capital structure, revenue assumptions, operating cost rates, management fees, timeline, exit assumptions
- Property-level fee categories (seeded from company templates but individually overridable)

**Rule:** Property-level values always override system defaults. The engine priority is: property value → global_assumptions default → hardcoded constant.

## Overlap Prevention Rules

1. **No duplicate controls.** A setting must appear in exactly ONE editable location. Read-only displays are acceptable only if clearly marked.
2. **No admin-only duplicates.** If Revenue Streams or Other Assumptions are editable on the Management Company page, they must NOT also be editable in Admin.
3. **Template vs. instance.** Service fee categories on the Management Company page are *templates*. The same categories on a Property Edit page are *instances* (copies that can diverge). Label them differently: "Default Service Categories" vs. "Property Service Fees."
4. **New properties inherit.** The property creation flow must read from `global_assumptions` for all default values. Hardcoded constants in `shared/constants.ts` are last-resort fallbacks only.

## When Adding a New Setting

Ask these questions in order:
1. Is it about the management company entity? → Management Company assumptions
2. Is it a default for new properties? → General Settings → Property Defaults
3. Is it a platform-wide economic factor? → General Settings → Macro
4. Is it a UI/behavior preference? → General Settings → Other
5. Is it system administration? → Admin Panel
6. Is it specific to one property? → Property Edit

If a setting doesn't clearly fit any category, it likely needs a conversation before implementation.

## Key Files

| File | Purpose |
|------|---------|
| `client/src/pages/Settings.tsx` | General Settings page (Property Defaults, Macro, Other tabs) |
| `client/src/pages/CompanyAssumptions.tsx` | Management Company assumptions page |
| `client/src/pages/PropertyEdit.tsx` | Property-level settings and overrides |
| `client/src/pages/Admin.tsx` | Admin Panel page |
| `shared/schema.ts` | `globalAssumptions` and `properties` table definitions |
| `server/storage.ts` | Storage interface for CRUD operations on settings |
