# Session Memory Rule

**Every session MUST begin by reading this file and `replit.md` to restore full context.**
**Every session MUST end by updating this file with all decisions, changes, and pending work.**

This rule ensures continuity across chat resets. The agent must treat this file as a living changelog of the project's evolution.

---

## Session: February 16, 2026 — Codebase Cleanup & Rules Documentation

### What Was Done

#### 1. New Rule: Database Sync Is SQL-Only
- **File:** `.claude/rules/database-sync-sql-only.md`
- **Lesson learned:** Multiple code-based sync approaches (auto-sync on startup, force-sync endpoints, fill-only with overwrite mode) all failed or added fragile complexity. The only reliable way to sync databases between environments is direct SQL UPDATE statements.
- **Prohibited:** Auto-sync on startup, sync endpoints that read from one DB and write to another, overwrite modes
- **Allowed:** Fill-only seeding for initial setup, direct SQL for corrections

#### 2. Removed Duplicate Seed Endpoint
- **Removed:** `/api/seed-production` (line 1482 in routes.ts) — ~100 lines of dead code duplicating `/api/admin/seed-production`
- **Kept:** `/api/admin/seed-production` — the one actually used by Admin Database tab

#### 3. Underfunding Changed from Verification Error to Notification
- **Changed:** "No Negative Cash Balance" checks (both per-property and management company) in `server/calculationChecker.ts` from `severity: "material"` to `severity: "info"`
- **Effect:** Underfunding no longer causes QUALIFIED audit opinion. It still shows in verification results as an informational item.
- **Rationale:** Underfunding is a business condition (insufficient reserves/funding), not a calculation error. The math is correct — the model accurately reflects the shortfall.

#### 4. Updated Existing Rules
- **`database-seeding.md`:** Added seeding best practices #5 (error-proof seeding) and #6 (SQL-only sync reference). Removed documentation of the deleted duplicate endpoint.
- **`verification-system.md`:** Added cash balance checks to the table. Added "Underfunding vs. Calculation Errors" section explaining the distinction.

### Key Decisions
- Database sync between environments = SQL only, never code
- Seeding errors are ultra-serious — wrong seed values cascade into calculation failures across the entire model
- Underfunding = business notification, not verification failure
- Removed ~100 lines of dead code (duplicate seed endpoint)

### Test Results
- All 1401 tests pass
- TypeScript: clean
- UNQUALIFIED audit opinion maintained

---

## Session: February 15, 2026 (Continued — Research Questions CRUD)

### What Was Done

#### 1. Research Questions CRUD Feature
- **Purpose:** Allow users to create, edit, and delete custom AI research questions/qualifiers that get merged into AI research prompts
- **Database:** Added `researchQuestions` table (`id`, `question`, `sortOrder`, `createdAt`) to `shared/schema.ts`
- **Storage:** Added 4 IStorage methods: `getResearchQuestions()`, `createResearchQuestion()`, `updateResearchQuestion()`, `deleteResearchQuestion()`
- **API Routes:** 4 endpoints under `/api/research-questions` (GET, POST, PUT, DELETE) — all use `requireAuth` middleware
- **React Query Hooks:** `useResearchQuestions`, `useCreateResearchQuestion`, `useUpdateResearchQuestion`, `useDeleteResearchQuestion` in `client/src/lib/api.ts`
- **UI:** Settings > Industry Research tab — CRUD list with inline editing (pencil icon), delete (trash icon), add input with Enter/button
- **AI Integration:** Server fetches all questions from DB during research generation, joins them as `researchVariables.customQuestions`, merged into AI prompt
- **Auto-sortOrder:** New questions auto-assign `max(sortOrder) + 1`

#### 2. Documentation Created
- **Skill:** `.claude/skills/research/research-questions/SKILL.md` — full architecture, data flow, UI patterns, key files
- **Tool:** `.claude/tools/validation/research-questions-crud.json` — CRUD operation schemas with request/response formats
- **Rule update:** `.claude/rules/api-routes.md` — added Research Questions section with all 4 endpoints
- **Context loading:** Updated context-loading SKILL.md with research-questions task mapping
- **Research SKILL.md:** Updated master skill with research-questions sub-skill reference

### Key Files
| File | Purpose |
|------|---------|
| `shared/schema.ts` | `researchQuestions` table + insert/select schemas |
| `server/storage.ts` | IStorage CRUD methods for research questions |
| `server/routes.ts` | API endpoints + AI prompt integration |
| `client/src/lib/api.ts` | React Query hooks |
| `client/src/pages/Settings.tsx` | UI in Industry Research tab |
| `.claude/skills/research/research-questions/SKILL.md` | Feature skill |
| `.claude/tools/validation/research-questions-crud.json` | Tool schema |

### Test Results
- All 1401 tests pass
- TypeScript: 0 errors
- Verification: UNQUALIFIED (PASS)
- API tested: create, read, update, delete all working

---

## Session: February 15, 2026

### What Was Done

#### 1. Critical Timezone Bug Fix — Client-Side Financial Auditor
- **Root cause:** `new Date("2027-07-01")` parses date-only strings as UTC midnight. In Western Hemisphere browsers (UTC-5 to UTC-8), this shifts to previous day local time (June 30), causing `startOfMonth()` to return June 1 instead of July 1
- **Impact:** Month index misalignment caused interest rate lookups, loan amortization schedules, and equity calculations to use wrong months — resulting in QUALIFIED audit opinion in browsers while server (Node.js, UTC) showed UNQUALIFIED
- **Fix:** Created `parseLocalDate()` helper that appends `T00:00:00` to date-only strings, forcing local-time interpretation instead of UTC
- **Applied across 4 files:**
  - `client/src/lib/financialAuditor.ts` — audit date parsing
  - `client/src/lib/financialEngine.ts` — core financial engine date parsing
  - `client/src/lib/loanCalculations.ts` — loan amortization date parsing
  - `client/src/lib/equityCalculations.ts` — acquisition year derivation
- **Verification:** All `startOfMonth(new Date(dateStr))` patterns replaced; grep confirms zero remaining instances in `client/src/`
- **No server-side changes needed:** Server `calculationChecker.ts` already had no `startOfMonth(new Date(` patterns

#### 2. Client-Side Auditor Regression Tests Added
- **Created** `tests/engine/client-auditor-regression.test.ts` with 17 tests covering all 5 properties
- **Tests verify:** formula counts (5550/5550), cross-validation checks (39/39), UNQUALIFIED opinion for each property
- All 1401 tests pass

#### 3. Documentation & Rules
- **Created** `.claude/rules/source-of-truth.md` — establishes `.claude` as single source of truth with `replit.md` as harmonized pointer
- **Updated** `.claude/rules/docs-after-edits.md` — added mandatory bug-fix completion checklist
- **Created** `.claude/rules/mandatory-financial-tests.md` — tracks financial bug regression tests

### Completed
- All 1401 tests pass
- Financial verification: UNQUALIFIED (PASS) — all 5 properties, 5550/5550 formula checks, 39/39 cross-validation
- Server-side diagnostic: UNQUALIFIED for all properties
- Architect review: PASS — timezone fix approved, no blocking issues
- No remaining `startOfMonth(new Date(` patterns in client/src

### Key Technical Decision
- **`parseLocalDate()` is defined locally in each file** (not centralized) — architect noted this could be centralized in future to avoid drift, but current approach is safe and complete

### Pending / Future Work
- Browser-side manual verification by user (confirming UNQUALIFIED in actual browser Verification tab)
- Consider centralizing `parseLocalDate()` into a shared utility module

---

## Session: February 13, 2026

### What Was Done

#### 1. Logo Management Moved Into Administration Page
- **Removed** the separate "Logo Management" sidebar link from `Layout.tsx`
- **Added** a "Logos" tab to the Admin page's `DarkGlassTabs` (using `Upload` icon)
- **Created** `renderLogos()` function inside `Admin.tsx` with:
  - Grid of logo cards showing image preview, name, company name, default badge (star icon), delete button
  - "Add Logo" button opening a create dialog
  - Empty state with icon and guidance text
- **Added** logo create dialog with:
  - Logo name field
  - Company name field
  - File upload via object storage presigned URLs (5MB limit, image validation)
  - OR manual URL input
  - Image preview before saving
- **Added** delete confirmation dialog for logos
- **Replaced** the old inline Logo Portfolio card in the Branding tab with a read-only summary view + "Manage Logos" button that navigates to the Logos tab
- **Removed** duplicate state variables (`newLogoName`, `newLogoUrl`) and old duplicate mutations (`createLogoMutation`, `deleteLogoMutation`) that existed from the previous inline implementation
- **Files changed:** `client/src/pages/Admin.tsx`, `client/src/components/Layout.tsx`

#### 2. Image Generation Updated to Nano Banana
- **Updated** `server/replit_integrations/image/client.ts` to use Nano Banana (`gemini-2.5-flash-image`) via `generateContent` API
- **Old approach:** Used deprecated `gemini.models.generateImages()` with `imagen-3.0-generate-002`
- **New approach:** Uses `gemini.models.generateContent()` with `gemini-2.5-flash-image` model and `responseModalities: ["image", "text"]`
- **Fallback:** Still falls back to OpenAI `gpt-image-1` if Nano Banana fails
- **Files changed:** `server/replit_integrations/image/client.ts`

#### 3. Generic AIImagePicker Component Created (IN PROGRESS)
- **Created** `client/src/components/ui/ai-image-picker.tsx` — a reusable component supporting:
  - Three modes: Upload, AI Generate, URL input
  - Configurable aspect ratio (square, landscape, portrait)
  - Dark/light variant support
  - Default prompt and auto-prompt display
  - Progress states (uploading, generating)
  - Error display for generation failures
  - Nano Banana branding in generate button
  - Max file size validation
  - data-testid attributes on all interactive elements
- **Refactored** `PropertyImagePicker` to wrap `AIImagePicker` with property-specific defaults (auto-prompt from name + location)
- **Files changed:** `client/src/components/ui/ai-image-picker.tsx` (new), `client/src/features/property-images/PropertyImagePicker.tsx` (refactored)

#### 4. Additional Changes Made This Session
- **Fixed TypeScript errors:** removed unused `handleLogoFileUpload`, `setUploadingFile`, `logoFileInputRef` from Admin.tsx
- **Changed "Update" to "Save"** on Management Company button for UI consistency
- **Added missing ? tooltip explanations** to all Dashboard financial statement lines
- **Created AnimatedLogo** SVG component for vector-based logo display with animation support (`client/src/components/ui/animated-logo.tsx`)
- **Created StatusBadge** reusable component (`client/src/components/ui/status-badge.tsx`)
- **Created ImagePreviewCard** reusable component (`client/src/components/ui/image-preview-card.tsx`)
- **Logo dialog in Admin** now uses AIImagePicker (upload + AI generate + URL modes)

### Completed
- TypeScript compiles cleanly (0 errors via `npx tsc --noEmit`)
- All 1330 tests pass (59 files)
- Financial verification: UNQUALIFIED (PASS)
- Architect review: PASS — no blocking issues
- All "Update" buttons changed to "Save" across entire Admin page (management company, SPV companies, user groups)
- Skill file moved to `.claude/skills/ui/reusable-components.md` (proper subdirectory per skill-organization rule)
- **README.md rewritten** — comprehensive GitHub README covering app purpose, data sources, Replit's role, financial engine, verification system, tech stack, codebase structure
- **Full documentation harmonization** — claude.md, replit.md, and all 84 skill files updated to reflect latest project state with consistent counts, accurate role names, current Admin tab structure, and AI image generation architecture
- **Removed Catering Revenue Model card** from Systemwide Assumptions > Other tab (was informational-only with no inputs)
- **Renamed "Help & Manuals" to "Help"** in sidebar and page header
- **Fixed all "Settings page" references** in docs to "Systemwide Assumptions page" (13 files updated)

### Key Architecture Decisions
- **Nano Banana (gemini-2.5-flash-image)** is the primary image generation model; fallback to OpenAI `gpt-image-1`
- **Image generation endpoint:** `POST /api/generate-property-image` — generates image and uploads to object storage, returns `objectPath`
- **Logo upload endpoint:** `POST /api/admin/logos/upload` — returns presigned URL for direct upload
- **Logo CRUD:** `GET/POST /api/admin/logos`, `DELETE /api/admin/logos/:id`
- **AIImagePicker** is the canonical reusable image component; all specific pickers (property, logo) should wrap it
- **Branding resolution:** User Group logoId → Company logoId → Default Logo
- **AnimatedLogo** wraps raster images in SVG for vector-like behavior (scaling + animation)
- **All financial statement tooltips** controlled by CalcDetailsContext (`showDetails` flag)

### User Preferences Noted
- User calls the image generation model "Nano Banana" (Google's gemini-2.5-flash-image)
- User wants reusable UI tools that can be shared across features
- User wants **100% session memory** — all decisions, changes, and context must be saved to persist across chat resets
- User wants "formula-like" accordion details in statements to remain toggleable via Systemwide Assumptions > Other tab > Calculation Transparency (two switches: `showCompanyCalculationDetails` and `showPropertyCalculationDetails`)
- User wants **ALL buttons to use "Save"** consistently (not "Update" for existing items)
- User wants **logos to be vector-based/SVG** for animation support
- User wants **every financial line item** to have a ? tooltip explanation
- User wants **reusable UI tools created** whenever building new features

### Important File Map
| File | Purpose |
|------|---------|
| `client/src/components/ui/ai-image-picker.tsx` | Generic AI image picker (upload + generate + URL) |
| `client/src/features/property-images/PropertyImagePicker.tsx` | Property-specific wrapper around AIImagePicker |
| `client/src/features/property-images/useGenerateImage.ts` | Hook for AI image generation (calls `/api/generate-property-image`) |
| `client/src/hooks/use-upload.ts` | Hook for file uploads via presigned URLs |
| `client/src/components/ui/entity-card.tsx` | Reusable entity card components (container, item, empty state) |
| `client/src/pages/Admin.tsx` | Administration page with tabs: Users, Companies, Activity, Verification, User Groups, Logos, Branding, Themes, Navigation, Database |
| `server/replit_integrations/image/client.ts` | Server-side image gen client (Nano Banana + OpenAI fallback) |
| `server/routes.ts` | All API routes including logo CRUD, image generation, branding |
| `client/src/pages/Settings.tsx` | Systemwide Assumptions page — tabs: Portfolio, Macro, Other (Calculation Transparency toggles), Industry Research (configurable AI research) |
| `server/aiResearch.ts` | AI research prompt builder — merges researchVariables + globalAssumptions into tailored prompts |

### Sidebar Navigation Structure (by role)
- **Admin:** sees everything — all pages + Administration
- **Partner/Checker:** sees management-level pages (dashboard, properties, company, settings, etc.) but NOT Administration
- **Investor:** sees limited view — Dashboard, Properties, Profile, Help only
- Consecutive dividers are auto-filtered to prevent visual gaps

---

## Session: February 13, 2026 (Continued — Consolidated Formula Helpers)

### What Was Done

#### 1. Consolidated Formula Helpers — Zero Re-Aggregation Architecture
- **Created** `client/src/lib/consolidatedFormulaHelpers.tsx` with 7 exported helper functions for building multi-level accordion formula rows in consolidated (Dashboard) financial statements
- **Exported helpers:**
  - `consolidatedLineItemBreakdown()` — per-property breakdown for any summed IS field
  - `consolidatedWeightedADR()` — weighted ADR formula with per-property breakdown
  - `consolidatedWeightedOccupancy()` — weighted occupancy with per-property breakdown
  - `consolidatedRevPAR()` — portfolio RevPAR with per-property breakdown
  - `consolidatedCashFlowBreakdown()` — per-property breakdown for any CF field
  - `consolidatedDSCR()` — DSCR formula with per-property breakdown
  - `consolidatedCashOnCash()` — Cash-on-Cash formula with per-property breakdown
- **Exported interface:** `WeightedMetrics { weightedADR, weightedOcc, revPAR, totalAvailableRoomNights }`
- **Key design:** All helpers accept precomputed consolidated arrays (yearlyConsolidated, consolidatedNOI[], consolidatedDS[], consolidatedATCF[], totalEquity) — zero re-aggregation inside render paths

#### 2. Shared Financial Table Row Components
- **Created** `client/src/components/financial-table-rows.tsx` with shared exports:
  - `FormulaDetailRow` — Level 2 accordion row (italic, blue-tinted, formula display)
  - `PropertyBreakdownRow` — Level 3 accordion row (deeper indent, indigo-tinted, per-property contribution)
- Legacy local copies remain in property-level statement components until full refactor

#### 3. Three-Level Accordion Architecture Documented
- **Level 1:** `ExpandableLineItem` / `ExpandableMetricRow` — consolidated total with chevron
- **Level 2:** `FormulaDetailRow` — consolidated formula (e.g., "Σ(Room Revenue) ÷ Σ(Sold Rooms)")
- **Level 3:** `PropertyBreakdownRow` — per-property contributions
- All controlled by `CalcDetailsProvider` context (Calculation Transparency toggles)

#### 4. Documentation Updated
- **Created** `.claude/skills/finance/consolidated-formula-helpers.md` — full API reference for all 7 helpers
- **Updated** `.claude/skills/ui/accordion-formula-rows.md` — shared FormulaDetailRow/PropertyBreakdownRow location, correct helper function names
- **Updated** `.claude/skills/finance/consolidation.md` — fixed `.tsx` extension references, accurate helper names
- **Fixed** all `.ts` → `.tsx` extension mismatches across docs
- **Fixed** re-aggregation in helpers — replaced inline `.reduce()` calls with precomputed array parameters

#### 5. New Rules Created
- **Created** `.claude/rules/docs-after-edits.md` — mandates updating `.claude` docs and harmonizing `replit.md` after any codebase edits
- **Created** `.claude/rules/read-session-memory-first.md` — mandates reading session-memory.md and replit.md before answering any question or starting any task
- Rules count now: 20 (was 18)

### Completed
- TypeScript compiles cleanly (0 errors via `npx tsc --noEmit`)
- All 1,330 tests pass (59 files)
- Architect review: PASS — docs match actual exports, zero re-aggregation confirmed

### Key Architecture Decisions
- **3-level accordion** pattern for consolidated statements (total → formula → per-property)
- **Zero re-aggregation** — helpers never call `.reduce()` on raw data; all consolidated totals passed in as precomputed arrays
- **Shared components** — FormulaDetailRow and PropertyBreakdownRow exported from `financial-table-rows.tsx` for use by both property-level and consolidated components
- **Token efficiency** — all 7 helpers in one file, accept precomputed data, return JSX fragments

### Important File Map (Additions)
| File | Purpose |
|------|---------|
| `client/src/lib/consolidatedFormulaHelpers.tsx` | 7 reusable formula row builders for consolidated statements |
| `client/src/components/financial-table-rows.tsx` | Shared FormulaDetailRow and PropertyBreakdownRow components |
| `.claude/skills/finance/consolidated-formula-helpers.md` | Full API docs for consolidated helpers |
| `.claude/rules/docs-after-edits.md` | Rule: update docs after every codebase edit |
| `.claude/rules/read-session-memory-first.md` | Rule: read session memory before answering questions |

---

## Session: February 13, 2026 (Continued — Dashboard Hover Effects)

### What Was Done

#### 1. KPIGrid Hover Effects Enhanced
- **File:** `client/src/components/graphics/cards/KPIGrid.tsx`
- Added framer-motion `whileHover` (scale 1.04, y -4) to each KPI card
- Added `group` class with radial gradient overlay (`group-hover:opacity-100`)
- Added enhanced shadow on hover (`hover:shadow-[0_12px_40px_rgba(159,188,164,0.25)]`)
- Added border color change on hover (`hover:border-primary/40`)

#### 2. Dashboard Overview Cards — Rich Hover Effects
- **File:** `client/src/pages/Dashboard.tsx`
- **IRR Gauge:** scale 1.03 on hover, orange glow shadow, SVG gauge scales up with thicker stroke, percentage text scales up
- **Property IRR Chart:** blue glow shadow on hover, scale 1.02, border changes to blue
- **Equity Investment Chart:** amber glow shadow on hover, scale 1.02, border changes to amber
- **Equity Multiple card:** lifts up, blue glow, gauge SVG rotates slightly and thickens stroke, value text scales
- **Cash-on-Cash card:** lifts up, amber glow, same gauge effects as Equity Multiple
- **Total Equity card:** lifts up, sage green glow, progress bar gets glow effect
- **Exit Value card:** lifts up, emerald glow, up-arrow icon scales and rises
- **Portfolio Composition card:** lifts up, sage gradient overlay
- **Capital Structure card:** lifts up, subtle slate gradient overlay

### Design Pattern
All cards use a consistent approach:
- `group` class on container for child targeting
- `transition-all duration-500` for smooth animation
- `hover:scale-[1.02-1.05]` and `hover:-translate-y-1` for lift effect
- Color-matched `hover:shadow-[...]` for themed glow (blue for equity, amber for CoC, emerald for exit, etc.)
- Radial gradient overlay (`group-hover:opacity-100`) for inner glow
- SVG gauges: `group-hover:scale-110`, `group-hover:stroke-[8]` for emphasis
- Value text: `group-hover:scale-105` for subtle zoom

### New UI Skill Files Created
| File | Purpose |
|------|---------|
| `.claude/skills/ui/card-hover-effects.md` | Core 5-layer card hover pattern with color theme map |
| `.claude/skills/ui/gauge-hover-effects.md` | SVG gauge hover (stroke thicken, scale, rotate) |
| `.claude/skills/ui/chart-container-hover.md` | Chart container subtle hover (scale 1.02, no lift) |
| `.claude/skills/ui/kpi-grid-hover.md` | KPIGrid dual-layer hover (framer-motion + Tailwind) |
| `.claude/skills/ui/radial-glow-overlay.md` | Radial gradient inner glow overlay presets |
| `.claude/skills/ui/animation-patterns.md` | Updated with cross-references to new hover skills |

---

## Session: February 14, 2026

### Per-Property Financing Architecture Migration

**Major architectural change**: Moved Acquisition Financing, Refinancing, and Disposition Commission from systemwide-level settings to per-property settings.

#### What Changed
1. **Schema** (`shared/schema.ts`): Added per-property columns: `dispositionCommission`, `refinanceYearsAfterAcquisition`, `acquisitionLTV`, `acquisitionInterestRate`, `acquisitionTermYears`, `acquisitionClosingCostRate`, `refinanceLTV`, `refinanceInterestRate`, `refinanceTermYears`, `refinanceClosingCostRate`
2. **Fallback pattern**: Changed from `property → global → DEFAULT` to `property → DEFAULT` for all financing fields
3. **Calculation engines**: Updated `financialEngine.ts`, `loanCalculations.ts`, `equityCalculations.ts`, `cashFlowAggregator.ts` to use property-only fallback
4. **Server-side**: Updated `calculationChecker.ts`, `seed.ts`, `routes.ts`, `syncHelpers.ts`
5. **UI**: Settings.tsx relabeled financing sections as "Defaults for New Properties"; PropertyEdit.tsx has all per-property financing inputs
6. **Consumers**: Updated sensitivity analysis, yearly cash flow, cross-validation, auditor, checker manual, exports, company assumptions
7. **Tests**: All 1372 tests passing, TypeScript clean (0 errors), verification UNQUALIFIED

#### Key Design Decisions
- Systemwide assumptions for financing/refinancing/disposition are labeled "Defaults for New Properties" — they populate new properties at creation but don't override existing ones
- Existing properties were populated with DEFAULT constant values during migration
- `willRefinance` remains on the property (it was already per-property)
- The `syncHelpers.ts` copies global defaults to new properties when they lack financing values

#### Files Modified (key)
- `shared/schema.ts` — new columns on properties table
- `client/src/lib/financialEngine.ts` — property-only fallback
- `client/src/lib/loanCalculations.ts` — property-only fallback
- `client/src/lib/equityCalculations.ts` — property-only fallback
- `client/src/lib/cashFlowAggregator.ts` — property-only fallback
- `client/src/pages/Settings.tsx` — "Defaults for New Properties" labels
- `client/src/pages/PropertyEdit.tsx` — per-property financing inputs
- `server/calculationChecker.ts` — property-only fallback
- `server/routes.ts` — property financing in PATCH routes
- `server/seed.ts` — per-property financing in seed data
- `tests/engine/loan-calculations.test.ts` — fixed import path

#### Rules Updated
- `.claude/rules/financial-engine.md` — expanded per-property config table
- `.claude/rules/constants-and-config.md` — updated fallback pattern to two-tier
- `replit.md` — reflects per-property architecture

### F&B Cost Fix + Operating Reserve Seed

#### What Changed
1. **F&B expense calculation fix**: Changed from `revenueRooms * costRateFB` to `revenueFB * costRateFB` in both client engine (`financialEngine.ts`) and server checker (`calculationChecker.ts`). This aligns with USALI standard — F&B costs are a percentage of F&B revenue, not room revenue.
2. **Operating reserve seeds initial cash**: Both `generatePropertyProForma()` and `independentPropertyCalc()` now add `operatingReserve` to cumulative cash at the acquisition month. This covers pre-operational debt service payments during the gap between acquisition and operations start.
3. **Added `operatingReserve` to `PropertyInput` interface** in `financialEngine.ts`
4. **Blue Ridge Manor operating reserve increased**: $300K → $500K in database (property id=36) to fully cover 12-month pre-ops period ($453K in debt payments)
5. **Year 10 NOI divergence eliminated**: Server and client engines now produce matching results (~15% divergence was caused by F&B cost bug)

#### Key Design Decisions
- Operating reserve is standard hotel accounting practice — covers pre-ops debt service before revenue begins
- Reserve seeds `cumulativeCash` at acquisition month, not at model start
- No negative cash balances allowed — operating reserve must fully cover pre-ops debt service gap
- F&B cost formula: `revenueFB * costRateFB` (NOT `revenueRooms * costRateFB`)

#### Test Results
- All 1371 tests passing (60 files)
- TypeScript: 0 errors
- Verification: UNQUALIFIED (PASS)
- Blue Ridge Manor: min cash $0, 0 negative months

### Casa Medellin Operating Reserve Fix
- **Problem:** Casa Medellin had $250K operating reserve but a 22-month pre-ops gap (Sept 2026 → July 2028) generating ~$554K in debt payments
- **Fix:** Increased operating reserve from $250K to $600K in database (property id=35) and seed data
- **Result:** min cash $0, 0 negative months

### Verification UI — Accordion Category Grouping
- **Problem:** Verification check list was too long; all checks listed flat per property
- **Fix:** Added `renderGroupedChecks()` helper that groups checks by `category` field (Revenue, P&L, Cash Flow, Balance Sheet, Debt Service, Independence, Industry Benchmark, Business Rule)
- **Behavior:** Categories with all passes show collapsed (green) by default; categories with failures auto-expand (red). User can click to toggle any category.
- **UI:** Chevron left/down icon, category name, pass/fail counts. Click to expand/collapse.
- **State:** `expandedCategories` Set<string> tracks which are manually toggled open
- **Applied to:** Property checks, Management Company checks, Consolidated Portfolio checks
- **Files changed:** `client/src/pages/Admin.tsx` (added ChevronDown/ChevronRight imports, expandedCategories state, toggleCategory, renderGroupedChecks)

### Auditor Fixes — Per-Property Fields & Operating Reserve
1. **Loan amortization audit** (`financialAuditor.ts`): Fixed to use `property.acquisitionInterestRate ?? property.debtAssumptions?.interestRate ?? DEFAULT_INTEREST_RATE` (and same for termYears). Was only using legacy `debtAssumptions` pattern.
2. **Cash Flow Reconciliation audit** (`financialAuditor.ts`): Fixed to include `operatingReserve` in cumulative cash tracking at acquisition month — matches the engine's approach.
3. **`convertToAuditInput`** (`runVerification.ts`): Added `acquisitionInterestRate`, `acquisitionTermYears`, `operatingReserve` to the conversion function so client-side audits receive per-property financing fields.
4. **Seed data** (`routes.ts`): Updated Casa Medellín reserve to $600K and Blue Ridge Manor to $500K (matching DB values).

### Operating Reserve & Cumulative Cash Tests Added
- **File:** `tests/engine/operating-reserve-cash.test.ts` (10 tests)
- Tests cover:
  - Operating reserve seeds ending cash at acquisition month
  - Reserve difference shows up in ending cash
  - Reserve flows through to cumulative cash tracking
  - Per-property `acquisitionInterestRate` used for debt payment calculation
  - Different `acquisitionTermYears` produce different monthly payments
  - Cumulative cash + reserve = ending cash (Full Equity and Financed)
  - Pre-ops gap has debt payments during the gap
- **Test count:** 1381 tests (61 files), all passing
- **Verification:** UNQUALIFIED (PASS)

### New Rule Created: Mandatory Financial Tests
- **File:** `.claude/rules/mandatory-financial-tests.md`
- **Purpose:** Ensures operating reserve, per-property financing, and cumulative cash flow tests run every time financial code changes
- **Triggers:** Any change to financialEngine.ts, financialAuditor.ts, calculationChecker.ts, runVerification.ts, loanCalculations.ts, cashFlowAggregator.ts, seed data, or schema financial fields
- **Quick command:** `npm run test:file -- tests/engine/operating-reserve-cash.test.ts`
- **Rules count now: 22** (was 20, added mandatory-financial-tests.md + this session also had docs-after-edits.md and read-session-memory-first.md from prior session)

### Industry Research Tab Added to Settings Page
- **What:** Added "Industry Research" tab to the Systemwide Assumptions (Settings) page
- **Location:** 4th tab in Settings page tabs (Portfolio, Macro, Other, Industry Research)
- **Configuration Variables:**
  - Focus Areas: 10 options (Market Overview & Trends, Event Hospitality, Financial Benchmarks, Cap Rates & Returns, Debt Market, Emerging Trends, Supply Pipeline, Labor Market, Technology, Sustainability). Default: first 6 selected.
  - Target Regions: 6 options (North America, Latin America, Europe, Asia Pacific, Middle East & Africa, Caribbean). Default: North America + Latin America.
  - Time Horizon: 1/3/5/10 years. Default: 5 years.
  - Custom Questions: free-text field. Default: empty.
- **Model Context Card:** Read-only display of systemwide settings (asset type, tier, room range, ADR range, inflation, projection years, features) from globalAssumptions. Automatically merged into AI research prompts.
- **Backend:** `researchGenerateSchema` accepts `researchVariables` object; `buildUserPrompt()` merges user selections with `globalAssumptions` for context-aware research
- **Research Results:** Display inline below configuration form, same card layout as GlobalResearch.tsx
- **Important:** Field is `projectionYears` (not `modelDurationYears`) in globalAssumptions schema
- **Files changed:** `client/src/pages/Settings.tsx`, `server/routes.ts`, `server/aiResearch.ts`
- **Manuals updated:** Checker manual chapters 4 and 13 updated with Industry Research tab documentation
- **Tests:** 1381/1381 pass, verification UNQUALIFIED (PASS)

### AI Chatbot Enhanced — "Marcela"
- **Name:** Chatbot renamed from "AI Assistant" to "Marcela" — a witty, brilliant hospitality strategist
- **System prompt** (`server/replit_integrations/chat/routes.ts`): Expanded from generic assistant to full platform-aware advisor with:
  - Platform knowledge (Dashboard, Properties, Management Company, Systemwide Assumptions tabs, Scenarios, Reports, AI Features including Industry Research)
  - Personality traits: witty, sharp, clever analogies, memorable one-liners, warm but direct
  - Full manual chapter summaries (User Manual 16 chapters, Checker Manual 15 chapters)
  - Administration page structure, user role definitions (admin/partner/checker/investor)
  - Dynamic context injection: `buildContextPrompt()` fetches live portfolio data and appends to system prompt per message
- **Dynamic context** (`buildContextPrompt()`):
  - Portfolio assumptions (company name, property type, projection years, inflation, fees, asset definition)
  - All properties with details (roomCount, startAdr, location, purchasePrice)
  - Team members with safe fields only (id, name, email, role, title) — **passwordHash and other sensitive fields are stripped**
  - Identifies who Marcela is currently speaking with by userId
- **UI** (`client/src/components/AIChatWidget.tsx`): Header shows "Marcela", empty state says "Hi, I'm Marcela", suggestion prompts updated to include Industry Research
- **Security fix (architect-reviewed):** `buildContextPrompt()` destructures only safe fields from user records — `passwordHash`, `companyId`, `userGroupId`, `selectedThemeId`, and other internal fields are never sent to the AI
- **Schema field mapping (corrected):** Uses actual Drizzle schema field names: `name` (not fullName/username), `roomCount` (not rooms), `startAdr` (not startingADR), `purchasePrice` (not acquisitionCost), `assetDefinition` (not boutiqueDefinition)
- **Files changed:** `server/replit_integrations/chat/routes.ts`, `client/src/components/AIChatWidget.tsx`

### Architect Review Findings
- **Security:** Fixed — password hashes stripped from AI context via safe field destructuring
- **Schema correctness:** Fixed — all field names now match Drizzle schema types
- **Performance:** Noted — fetching all users/properties/assumptions per message is acceptable for current portfolio size; caching recommended if portfolio grows significantly
- **Manual knowledge:** Approved — 31 chapter summaries provide comprehensive platform awareness
- **Overall verdict:** PASS after security fix

### Refinance Operating Reserve Bug Fix (February 14, 2026)
- **Bug:** Refinance post-processing (Pass 2) in `financialEngine.ts` reset `cumCash = 0` to rebuild cumulative cash, but operating reserve was added directly to `cumulativeCash` in Pass 1 (not to `cashFlow`), so it was lost during the rebuild
- **Affected properties:** The Hudson Estate, Eden Summit Lodge, Austin Hillside (all Full Equity + Refinance)
- **Fix:** Added `acqMonthIdx` calculation and operating reserve seed at `i === acqMonthIdx` during refinance loop (line 593-606 in `financialEngine.ts`)
- **3 regression tests added** to `tests/engine/operating-reserve-cash.test.ts`:
  1. Full Equity + Refinance: ending cash includes operating reserve after refinance rebuild
  2. Full Equity + Refinance with pre-ops gap: reserve seeds at acquisition month, not lost in refi rebuild
  3. Removing reserve from refinance property drops ending cash by exactly the reserve amount
- **Mandatory tests rule updated** (`.claude/rules/mandatory-financial-tests.md`): Added section 3 "Refinance Path Operating Reserve Bugs" with 4 mandated invariants, and added bug to historical bugs table
- **Test count:** 1384 tests (61 files), all passing (was 1381)

### Timezone-Dependent Date Parsing Bug Fix (February 15, 2026)
- **Bug:** Client-side auditor reports (financialAuditor.ts) showed systematic failures across all properties: balance sheet +0.25% variance, $0 values at acquisition months, and principal calculation mismatches
- **Root Cause:** `new Date("2026-04-01")` in non-UTC timezones (e.g., US EST) produces March 31 local time. `addMonths(March 31, N)` then produces end-of-month dates (April 30, May 30, June 30...). `differenceInMonths(June 30, May 31)` returns 0 instead of 1 due to day-of-month adjustment (30 < 31). This caused `monthsSinceAcquisition` to be 1 less than expected, producing wrong accumulated depreciation, wrong debt amortization, and wrong acquisition timing.
- **Fix:** Added `startOfMonth()` normalization to all date string parsing in:
  - `client/src/lib/financialEngine.ts` — modelStart, opsStart, acquisitionDate, refinanceDate, getFiscalYearLabel
  - `client/src/lib/financialAuditor.ts` — all 7 audit functions (depreciation, loan, income, timing, fees, balance sheet, cash flow)
  - `client/src/lib/equityCalculations.ts` — `acqMonthsFromModelStart()` helper
  - `client/src/lib/loanCalculations.ts` — refinance date parsing
- **Server-side checker unaffected** — already uses pure `YearMonth` integer arithmetic (no `Date` objects)
- **Tests:** 1401/1401 pass (62 files), TypeScript 0 errors, Verification UNQUALIFIED

### Full Audit Results (February 15, 2026)
- TypeScript: PASS — 0 errors
- Tests: PASS — 1401/1401 (62 files)
- Verification: UNQUALIFIED (PASS)
