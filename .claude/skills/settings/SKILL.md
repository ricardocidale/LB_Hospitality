---
name: settings
description: Where configuration lives — property defaults vs company working variables vs config switches. The three categories of configurable values, where each is edited, and how they flow through the system.
---

# Settings Architecture — Where Configuration Lives

Every configurable value in the app falls into one of three categories. Knowing which category a value belongs to determines where it should be edited, how it behaves when changed, and who can access it.

**Related skills:** `finance/` (how engines consume values), `architecture/` (storage interface), `constants-governance/` (fallback constants)

---

## The Three Categories

### 1. Property Defaults (Templates for New Properties)

**What they are:** Starting values that get **copied into a new property** when it's created. After creation, the property owns its copy — changing the default has NO effect on existing properties.

**Where they're edited:** Admin > Model Defaults (2 tabs: Market & Macro, Property Underwriting)

**How they flow:**
```
Admin sets default ADR = $250 in Model Defaults
    ↓
User creates "Hotel Loch Sheldrake"
    ↓
buildPropertyDefaultsFromGlobal() reads defaults from globalAssumptions
    ↓
Property created with startAdr = $250 (copied from default)
    ↓
User edits property ADR to $300 and saves
    ↓
Admin later changes default ADR to $275
    ↓
Hotel Loch Sheldrake STILL has $300 (its own value)
NEXT new property will start at $275
```

**Examples:**
| Value | Default | Stored In |
|-------|---------|-----------|
| Starting ADR | $250 | `globalAssumptions.defaultStartAdr` → `properties.startAdr` |
| Rooms cost rate | 20% | `globalAssumptions.defaultCostRateRooms` → `properties.costRateRooms` |
| Exit cap rate | 8.5% | `globalAssumptions.exitCapRate` → `properties.exitCapRate` |
| Depreciation years | 27.5 | `globalAssumptions.depreciationYears` → `properties.depreciationYears` |
| Acquisition LTV | 75% | `globalAssumptions.debtAssumptions.acqLTV` → `properties.acquisitionLTV` |

**Technical pattern:** New default columns in `globalAssumptions` are **nullable**. NULL means "use the hardcoded constant from `shared/constants.ts`." The function `buildPropertyDefaultsFromGlobal()` in `server/routes/properties.ts` reads these at property creation time:

```typescript
startAdr: ga?.defaultStartAdr ?? DEFAULT_START_ADR,  // DB value or constant fallback
costRateRooms: ga?.defaultCostRateRooms ?? DEFAULT_COST_RATE_ROOMS,
```

**The test:** Does this value get copied into a new property at creation? → It's a property default.

---

### 2. Working Variables (Live Company Values)

**What they are:** Values that **directly drive the financial engine** for the management company right now. They are read every time the engine runs. They are not templates — they ARE the live model.

**Where they're edited:** Company Assumptions page (`/company/assumptions`)

**Why they're different from defaults:** The management company is a single entity. There is no "create a new management company" flow. These values don't get copied into anything — they're consumed directly by the company engine.

**How they flow:**
```
User sets partner compensation Year 1 = $540,000 on Company Assumptions
    ↓
Company engine reads this value directly from globalAssumptions
    ↓
Company Income Statement shows Partner Comp = $540,000 in Year 1
    ↓
User changes to $600,000 and saves
    ↓
Company Income Statement IMMEDIATELY updates to $600,000
```

**Examples:**
| Value | What It Drives | Why It's Not a Default |
|-------|---------------|----------------------|
| Partner comp ($540K/yr) | Company P&L line item | Not copied to any entity — used directly |
| Staff salary ($75K) | Company payroll expense | Read live by engine every calculation |
| SAFE tranche 1 ($1M) | Company financing cash flow | The company has ONE funding structure |
| Office lease ($36K/yr) | Company G&A expense | Directly consumed, not templated |
| Base management fee (8.5%) | Company revenue + property expense | Applied live to each property's output |
| Company tax rate (30%) | Company net income | Only one company, one tax rate |

**The test:** Does this value directly drive the management company P&L/CF/BS and never get copied into a new entity? → It's a working variable.

---

### 3. Config Switches (Platform Behavior)

**What they are:** Toggles that control **how the app looks and behaves** — what users see, which features are active, which AI model to use. They don't flow into financial calculations and don't pre-fill any entity.

**Where they're edited:** Various admin tabs (Navigation & Display, Research Center, AI Agents)

**Examples:**
| Switch | What It Controls | Admin Tab |
|--------|-----------------|-----------|
| `sidebarPropertyFinder` | Show Property Finder in sidebar | Navigation & Display |
| `showCompanyCalculationDetails` | Show formula breakdowns | Navigation & Display |
| `rebeccaEnabled` | Enable Rebecca chatbot | AI Agents |
| `preferredLlm` | Which AI model for research | Research Center |
| `autoResearchRefreshEnabled` | Auto-refresh stale research | Research Center |

**The test:** Does this toggle a UI feature or platform behavior without affecting financial numbers? → It's a config switch.

---

## Quick Decision Guide

```
"Where does this new setting belong?"

Does it get COPIED into a new property?
  YES → Property Default → Admin > Model Defaults > Property Underwriting
  NO ↓

Does it directly drive the company financial engine?
  YES → Working Variable → Company Assumptions page
  NO ↓

Is it a global economic parameter (inflation, fiscal year)?
  YES → Market Parameter → Admin > Model Defaults > Market & Macro
  NO ↓

Does it toggle a UI feature or platform behavior?
  YES → Config Switch → Relevant admin tab
  NO → Ask the project owner before implementing
```

---

## Where Each Category Lives

### Admin > Model Defaults > Market & Macro
Global economic context — not entity-specific.
- Macro inflation rate, cost of equity, days per month (governed), fiscal year start month

### Admin > Model Defaults > Property Underwriting
Templates for new properties — copied at creation, then independent.
- Revenue defaults (ADR, occupancy, ramp, revenue shares, catering boost)
- USALI operating cost rates (14 rates across departmental, undistributed, fixed charges)
- Acquisition financing defaults (LTV, rate, term, closing costs)
- Refinance defaults
- Depreciation & tax (depreciation years, property tax rate, land value %)
- Disposition (exit cap rate, commissions)
- Default acquisition package (purchase price, improvements, reserves)

### Company Assumptions Page (`/company/assumptions`)
Live working variables — directly consumed by the company engine.
- Company identity (name, logo, contact, address)
- Timeline (model start date, ops start date, projection years)
- Funding (SAFE tranches, valuation cap, interest)
- Management fees (base %, incentive %)
- Compensation (salary, tiers, partner comp)
- Overhead (office, professional services, tech, insurance)
- Variable costs (travel, IT, marketing, misc ops)
- Tax (company tax rate, company inflation)

### Property Edit (`/property/:id/edit`)
Per-property values — override defaults, owned by the property.
- Everything from Property Underwriting defaults but specific to this property
- Plus: property name, location, dates, photos, fee categories

### Various Admin Tabs
Config switches — platform behavior toggles.
- Navigation & Display: sidebar toggles, calculation detail toggles, tour prompt
- Research Center: LLM selection, per-domain research behavior, auto-refresh
- AI Agents: Rebecca config (Marcela currently isolated)

---

## Key Rules

1. **Never put working variables in Model Defaults.** If it directly drives the company engine and isn't copied into properties, it belongs on Company Assumptions.
2. **Never put config switches in Model Defaults.** If it toggles behavior without affecting financial numbers, it belongs in its admin tab.
3. **All new property default columns are nullable.** NULL = use constant fallback. Non-NULL = admin set a custom default.
4. **Changing a default never affects existing properties.** Only the next property created gets the new value.
5. **Changing a working variable takes effect immediately.** The company engine reads these live.
6. **Property values always override defaults.** Engine priority: property value → globalAssumptions default → hardcoded constant.

---

## Key Files

| File | Role |
|------|------|
| `client/src/components/admin/ModelDefaultsTab.tsx` | Model Defaults UI (property defaults + market parameters) |
| `client/src/pages/CompanyAssumptions.tsx` | Company working variables UI |
| `client/src/pages/PropertyEdit.tsx` | Per-property value editing |
| `shared/schema/config.ts` | `globalAssumptions` table (stores all three categories) |
| `server/routes/properties.ts` | `buildPropertyDefaultsFromGlobal()` — where defaults flow to new properties |
| `shared/constants.ts` | Hardcoded fallback constants (last resort when DB value is NULL) |
| `.claude/plans/CLAUDE-CODE-INSTRUCTIONS-MODEL-DEFAULTS.md` | Definitive architecture guide |
| `.claude/plans/MODEL-DEFAULTS-COMPLETION.md` | Implementation spec with schema changes |
