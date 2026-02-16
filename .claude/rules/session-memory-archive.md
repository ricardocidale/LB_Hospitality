# Session Memory Archive

Older sessions moved here to reduce token cost. Only referenced when investigating historical decisions.

---

## Session: February 14, 2026

### Per-Property Financing Architecture Migration
- Moved Acquisition Financing, Refinancing, Disposition Commission from systemwide to per-property
- Schema: Added 10 per-property columns (dispositionCommission, refinance*, acquisition*)
- Fallback: Changed from `property → global → DEFAULT` to `property → DEFAULT`
- Updated: financialEngine, loanCalculations, equityCalculations, cashFlowAggregator, calculationChecker, seed, routes, syncHelpers
- Settings.tsx: Financing sections relabeled "Defaults for New Properties"
- Tests: 1372 passing, UNQUALIFIED

### F&B Cost Fix + Operating Reserve Seed
- F&B expense: Changed from `revenueRooms * costRateFB` to `revenueFB * costRateFB` (USALI standard)
- Operating reserve seeds cumulative cash at acquisition month (covers pre-ops debt service)
- Blue Ridge Manor reserve: $300K → $500K; Casa Medellín: $250K → $600K
- Tests: 1371 passing, UNQUALIFIED

### Verification UI — Accordion Category Grouping
- Added `renderGroupedChecks()` in Admin.tsx — groups checks by category
- Categories with all passes collapse by default; failures auto-expand

### Auditor Fixes
- Fixed loan amortization audit to use per-property financing fields
- Fixed cash flow reconciliation to include operatingReserve
- Fixed `convertToAuditInput` to pass per-property fields

### Operating Reserve Tests (10 tests)
- File: `tests/engine/operating-reserve-cash.test.ts`
- Tests: 1381 passing, UNQUALIFIED

### Refinance Operating Reserve Bug Fix
- Bug: Refinance Pass 2 reset `cumCash = 0`, losing operating reserve from Pass 1
- Fix: Added reserve seed at `acqMonthIdx` during refinance loop
- 3 regression tests added. Tests: 1384 passing

---

## Session: February 13, 2026 — Dashboard Hover Effects

### KPIGrid + Dashboard Hover Effects
- KPIGrid: framer-motion whileHover (scale 1.04, y -4), radial gradient overlay, enhanced shadow
- Dashboard cards: 9 cards with themed glow effects (blue/amber/emerald/sage)
- Pattern: `group` class + `transition-all duration-500` + color-matched shadows + radial overlay
- SVG gauges: `group-hover:scale-110`, `group-hover:stroke-[8]`
- 6 UI skill files created under `.claude/skills/ui/` for hover patterns

---

## Session: February 13, 2026 — Consolidated Formula Helpers

### Zero Re-Aggregation Architecture
- Created `client/src/lib/consolidatedFormulaHelpers.tsx` — 7 helper functions
- Created `client/src/components/financial-table-rows.tsx` — shared FormulaDetailRow, PropertyBreakdownRow
- 3-level accordion: consolidated total → formula → per-property breakdown
- All helpers accept precomputed arrays (zero re-aggregation in render paths)
- Rules created: `docs-after-edits.md`, `read-session-memory-first.md`

---

## Session: February 13, 2026 — Logo Management, AI Image Gen, Reusable Components

### Logo Management → Admin Page Tab
- Moved from separate sidebar link to "Logos" tab in Admin
- Logo CRUD with upload (object storage), AI generate (Nano Banana), URL input

### Image Generation — Nano Banana
- Primary: `gemini-2.5-flash-image` via generateContent API
- Fallback: OpenAI `gpt-image-1`
- File: `server/replit_integrations/image/client.ts`

### Reusable Components Created
- `AIImagePicker` — upload + AI generate + URL (3 modes)
- `AnimatedLogo` — SVG wrapper for vector-like scaling/animation
- `StatusBadge`, `ImagePreviewCard`

### Other Changes
- All "Update" → "Save" buttons, added ? tooltips to all Dashboard financial lines
- README.md rewritten, full docs harmonization (84 skill files)
- Removed Catering Revenue Model card, renamed "Help & Manuals" to "Help"

---

## Session: February 14, 2026 — Industry Research & Marcela AI

### Industry Research Tab (Settings Page)
- 4th tab: Focus Areas (10 options), Target Regions (6), Time Horizon, Custom Questions
- Model Context Card: read-only display of systemwide settings
- Backend merges user selections with globalAssumptions for AI prompts

### Marcela AI Chatbot
- Renamed from "AI Assistant" to "Marcela" — witty hospitality strategist
- System prompt: full platform knowledge, personality traits, manual chapter summaries
- Dynamic context: live portfolio data, properties, team (safe fields only — no passwordHash)
- Security: destructures only safe fields from user records

### Timezone-Dependent Date Parsing Bug (February 15)
- Root cause: `new Date("2027-07-01")` in Western Hemisphere produces previous day local time
- Fix: `parseLocalDate()` appends `T00:00:00` — forces local-time interpretation
- Applied to: financialEngine, financialAuditor, equityCalculations, loanCalculations
- 17 regression tests added. Tests: 1401 passing, UNQUALIFIED

### Research Questions CRUD (February 15)
- Database: `researchQuestions` table (id, question, sortOrder, createdAt)
- Storage: 4 IStorage methods, 4 API endpoints under `/api/research-questions`
- UI: Settings > Industry Research tab — inline editing with CRUD
- AI: Custom questions merged into research prompts
