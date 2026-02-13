# Session Memory Rule

**Every session MUST begin by reading this file and `replit.md` to restore full context.**
**Every session MUST end by updating this file with all decisions, changes, and pending work.**

This rule ensures continuity across chat resets. The agent must treat this file as a living changelog of the project's evolution.

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
| `client/src/pages/Settings.tsx` | Systemwide Assumptions page — "Other" tab has Calculation Transparency toggles |

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
