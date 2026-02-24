# Hospitality Business Group - Business Simulation Portal

**All project documentation lives in `.claude/claude.md`** — the single source of truth for architecture, skills, rules, manuals, tools, testing, integrations, and project state. Load it for any detailed work.

## MANDATORY: Rules Loading

**Before ANY work, read `session-memory.md` + `replit.md` + all `.claude/rules/*.md`.** Include all rules in architect calls. See `.claude/rules/session-startup.md` for full protocol.

## Key Directories
- `.claude/skills/` — 99+ skill files (finance, UI, testing, exports, proof system, architecture, research questions, mobile-responsive, admin refactor)
- `.claude/skills/context-loading/` — Start here: maps task types to minimum required skills
- `.claude/skills/mobile-responsive/` — 4 mobile/tablet skills (breakpoints, iPad layouts, device checklist, responsive helpers)
- `.claude/rules/` — 18 rule files (session-startup, documentation, ui-patterns, constants, DB seeding, API routes, graphics, hardcoding, skill organization, etc.)
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
Admin Settings page (`/admin`) has these tabs:
- Users, Companies, Activity, Verification, User Groups, **Logos**, Branding, Themes, Navigation, Database
- Logo Management is a tab within Admin (not a separate sidebar link)
- Branding tab shows read-only logo summary with "Manage Logos" button linking to Logos tab

## Calculation Transparency
- Two toggles in **Systemwide Assumptions > Other tab** control formula accordion visibility:
  - `showCompanyCalculationDetails` — Management Company reports
  - `showPropertyCalculationDetails` — Property reports
- Default: ON. When OFF, shows clean numbers only (investor-ready view).
- **Consolidated statements** use 3-level accordion: consolidated total → weighted formula → per-property breakdown
- 7 reusable helpers in `client/src/lib/consolidatedFormulaHelpers.tsx` (zero re-aggregation architecture)
- Shared row components in `client/src/components/financial-table-rows.tsx`

## Top Rules
- **Calculations first.** 1,502-test proof system must always pass.
- **Graphics-rich pages.** Charts, animations, visual elements everywhere.
- **No hardcoded values.** Financial assumptions and admin config from DB or named constants.
- **Full recalculation on save.** No partial query invalidation.
- **Rule compliance on audits.** Check all `.claude/rules/` every audit.
- **Session memory.** Update `session-memory.md` every session. Read it first.
- **Docs after edits.** `.claude` docs and `replit.md` harmonized after code changes.
- **"Save" not "Update"** on all buttons.
- Company: "Hospitality Business Group". All UI references a theme. Skills under `.claude/`.
- See `.claude/claude.md` for everything else.
