# Hospitality Business Group - Business Simulation Portal

**All project documentation lives in `.claude/claude.md`** — the single source of truth for architecture, skills, rules, manuals, tools, testing, integrations, and project state. Load it for any detailed work.

## MANDATORY: Rules Loading

**Before ANY work, read `session-memory.md` + `replit.md` + all `.claude/rules/*.md`.** Include all rules in architect calls. See `.claude/rules/session-startup.md` for full protocol.

## Key Directories
- `.claude/skills/` — 99+ skill files (finance, UI, testing, exports, proof system, architecture, research questions, mobile-responsive, admin refactor, property refactor)
- `.claude/skills/context-loading/` — Start here: maps task types to minimum required skills
- `.claude/skills/mobile-responsive/` — 4 mobile/tablet skills (breakpoints, iPad layouts, device checklist, responsive helpers)
- `.claude/rules/` — 20 rule files (session-startup, documentation, ui-patterns, constants, DB seeding, API routes, graphics, hardcoding, skill organization, context-reduction, premium-design, etc.)
- `.claude/manuals/` — Checker manual and user manual
- `.claude/tools/` — Tool schemas for analysis, financing, returns, validation, UI
- `.claude/commands/` — 8 slash commands (verify, seed, scenarios, themes, etc.)

## Quick Commands
```bash
npm run dev            # Start dev server
npm run health         # One-shot: tsc + tests + verify (~4 lines output)
npm run test:summary   # Run all 1,529 tests, 1-line output on pass
npm run verify:summary # 4-phase verification, compact output
npm test               # Run all 1,529 tests (full output)
npm run verify         # Full 4-phase financial verification (verbose)
npm run db:push        # Push schema changes
npm run lint:summary   # tsc --noEmit, 1-line output
npm run diff:summary   # Compact git diff stat
npm run test:file -- <path>  # Single test file, summary output
npm run stats          # Codebase metrics (~12 lines)
npm run audit:quick    # Quick code quality scan
npm run exports:check  # Find unused exports
```

## Branding Architecture
- **Branding flows: User → User Group → Default.** No per-user branding overrides.
- Design themes are standalone entities (not user-owned). Each has `isDefault` flag.
- User Groups define company branding: `companyName`, `logoId`, `themeId`, `assetDescriptionId`.
- Users inherit branding from their assigned User Group. Admin manages branding at the group level.

## AI Image Generation
- **Primary model:** Nano Banana (`gemini-2.5-flash-image`) via Gemini AI Integrations
- **Fallback:** OpenAI `gpt-image-1`
- **Reusable component:** `client/src/components/ui/ai-image-picker.tsx` — supports upload, AI generate, and URL input modes
- **Property-specific wrapper:** `client/src/features/property-images/PropertyImagePicker.tsx`
- **AnimatedLogo:** `client/src/components/ui/animated-logo.tsx` — SVG wrapper for vector-like scaling and animation (pulse, glow, spin, bounce)
- **Server endpoint:** `POST /api/generate-property-image` — generates image, uploads to object storage, returns `objectPath`

## Admin Page Structure
Admin Settings page (`/admin`) — **refactored from 3,235-line monolith into 10 standalone tab components + 87-line shell**.
- Shell: `client/src/pages/Admin.tsx` — tab navigation only, no business logic
- Tabs: `client/src/components/admin/` — each tab owns its data fetching, mutations, dialogs, and state
  - `UsersTab.tsx` — user CRUD, add/edit/password dialogs
  - `CompaniesTab.tsx` — SPV management, mgmt company config
  - `ActivityTab.tsx` — login logs, activity feed, checker activity (3 sub-tabs)
  - `VerificationTab.tsx` — auto-verification, AI review, PDF export
  - `UserGroupsTab.tsx` — group CRUD, user-to-group assignment
  - `LogosTab.tsx` — logo CRUD with AI image picker
  - `BrandingTab.tsx` — global branding config (accepts `onNavigate` prop for cross-tab nav)
  - `ThemesTab.tsx` — wraps ThemeManager
  - `NavigationTab.tsx` — sidebar toggle config
  - `DatabaseTab.tsx` — sync status, seed execution
- Shared types: `client/src/components/admin/types.ts` (17 interfaces)
- Barrel export: `client/src/components/admin/index.ts`
- Logo Management is a tab within Admin (not a separate sidebar link)
- Branding tab shows read-only logo summary with "Manage Logos" button linking to Logos tab

## Property Page Structure
Property pages — **refactored from 5 monolithic files (4,891 lines) into organized components + shells (1,701 lines in shells)**.

### PropertyEdit (`/properties/:id/edit`) — 322-line shell + 7 sections
- Shell: `client/src/pages/PropertyEdit.tsx` — queries, mutations, draft state, research values
- Sections: `client/src/components/property-edit/` — each receives `draft` + handlers via props
  - `BasicInfoSection.tsx` (91) — name, location, market, photo, rooms
  - `TimelineSection.tsx` (38) — acquisition/operations dates
  - `CapitalStructureSection.tsx` (331) — purchase, financing, refinancing
  - `RevenueAssumptionsSection.tsx` (317) — ADR, occupancy, revenue mix
  - `OperatingCostRatesSection.tsx` (362) — cost rates by category
  - `ManagementFeesSection.tsx` (123) — fee categories, incentive fees
  - `OtherAssumptionsSection.tsx` (117) — exit cap, tax, commission
- Shared types: `client/src/components/property-edit/types.ts`
- Barrel export: `client/src/components/property-edit/index.ts`

### PropertyDetail (`/properties/:id`) — 595-line shell + 5 components
- Shell: `client/src/pages/PropertyDetail.tsx` — queries, memos, export logic, tab layout
- Components: `client/src/components/property-detail/`
  - `PPECostBasisSchedule.tsx` (215) — depreciation schedule table
  - `IncomeStatementTab.tsx` (106) — chart + yearly statement
  - `CashFlowTab.tsx` (121) — NOI/FCF/FCFE chart + statement
  - `PropertyHeader.tsx` (89) — image, info bar, actions
  - `PropertyKPIs.tsx` (46) — Year 1 KPI grid

### PropertyFinder (`/property-finder`) — 354-line shell + 4 components
- Components: `client/src/components/property-finder/`
  - `SearchResultCard.tsx` (134), `FavoriteCard.tsx` (157), `SearchForm.tsx` (188), `SavedSearchBar.tsx` (53)

### Portfolio (`/portfolio`) — 244-line shell + 3 components
- Components: `client/src/components/portfolio/`
  - `AddPropertyDialog.tsx` (352), `PortfolioPropertyCard.tsx` (126), `CurrencyInput.tsx` (61)

### PropertyMarketResearch (`/properties/:id/research`) — 186-line shell + 5 components
- Components: `client/src/components/property-research/`
  - `SectionCard.tsx` (17), `MetricCard.tsx` (11), `ResearchSections.tsx` (381), `useResearchStream.ts` (80), `types.ts` (22)

## Management Company Page Structure
Management Company pages — **refactored from 3 monolithic files (3,541 lines) into organized components + shells (1,186 lines in shells)**.

### Company (`/company`) — 804-line shell + 4 components
- Shell: `client/src/pages/Company.tsx` — queries, memos, export logic (PDF/CSV/Excel/PPTX/PNG), tab state
- Components: `client/src/components/company/`
  - `CompanyIncomeTab.tsx` (375) — income statement with formula accordion rows
  - `CompanyCashFlowTab.tsx` (454) — cash flow statement (operating/financing/net)
  - `CompanyBalanceSheet.tsx` (210) — assets/liabilities/equity sections
  - `CompanyHeader.tsx` (86) — page header, KPIs, chart, insight panel
- Shared helper: `client/src/lib/financial/analyzeCompanyCashPosition.ts` (70)

### CompanyAssumptions (`/company/assumptions`) — 218-line shell + 13 sections
- Shell: `client/src/pages/CompanyAssumptions.tsx` — query, mutation, formData state, handleSave
- Sections: `client/src/components/company-assumptions/` — each receives `formData` + handlers via props
  - `EditableValue.tsx` (77) — reusable inline editable numeric display
  - `CompanySetupSection.tsx` (87), `FundingSection.tsx` (160), `ManagementFeesSection.tsx` (86)
  - `CompensationSection.tsx` (127), `FixedOverheadSection.tsx` (140), `VariableCostsSection.tsx` (118)
  - `TaxSection.tsx` (45), `ExitAssumptionsSection.tsx` (70), `PropertyExpenseRatesSection.tsx` (103)
  - `CateringSection.tsx` (21), `PartnerCompSection.tsx` (86), `SummaryFooter.tsx` (17)

### CompanyResearch (`/company/research`) — 164-line shell + 3 components
- Components: `client/src/components/company-research/`
  - `CompanyResearchSections.tsx` (198), `useCompanyResearchStream.ts` (60), `types.ts` (12)
- Reuses `SectionCard` and `MetricCard` from `property-research/`

## Production Seed Script
- `script/seed-production.sql` — comprehensive SQL to seed production DB
- Covers 11 persistent tables (companies, logos, user_groups, design_themes, users, global_assumptions, properties, property_fee_categories, market_research, research_questions, saved_searches)
- Uses `OVERRIDING SYSTEM VALUE` for identity columns, resets sequences, idempotent with `ON CONFLICT DO NOTHING`

## Calculation Transparency
- Two toggles in **Systemwide Assumptions > Other tab** control formula accordion visibility:
  - `showCompanyCalculationDetails` — Management Company reports
  - `showPropertyCalculationDetails` — Property reports
- Default: ON. When OFF, shows clean numbers only (investor-ready view).
- **Consolidated statements** use 3-level accordion: consolidated total → weighted formula → per-property breakdown
- 7 reusable helpers in `client/src/lib/consolidatedFormulaHelpers.tsx` (zero re-aggregation architecture)
- Shared row components in `client/src/components/financial-table-rows.tsx`

## Top Rules
- **Calculations first.** 1,529-test proof system must always pass.
- **Graphics-rich pages.** Charts, animations, visual elements everywhere.
- **No hardcoded values.** Financial assumptions and admin config from DB or named constants.
- **Full recalculation on save.** No partial query invalidation.
- **Context reduction mandatory.** Every refactor/feature must produce skills, helpers, scripts, and tools to reduce future context needs.
- **Premium design always.** Every page must look $50K+ bespoke — animated numbers, micro-interactions, depth, staggered reveals, skeleton loading. Never generic AI-template design.
- **Rule compliance on audits.** Check all `.claude/rules/` every audit.
- **Session memory.** Update `session-memory.md` every session. Read it first.
- **Docs after edits.** `.claude` docs and `replit.md` harmonized after code changes.
- **"Save" not "Update"** on all buttons.
- Company: "Hospitality Business Group". All UI references a theme. Skills under `.claude/`.
- See `.claude/claude.md` for everything else.
