# Hospitality Business Group - Business Simulation Portal

> **Source of truth:** `.claude/claude.md` — all detailed documentation lives there. This file is a slim pointer. If conflicts arise, `.claude/claude.md` wins.

## Overview
Business simulation portal for boutique hotel investment. Financial modeling, property management, investment analysis, and AI-powered assistant (Marcela). GAAP-compliant with independent audit/verification engine.

**Codebase:** ~635 source files, ~97,200 lines, 2,460 tests across 116 files.

## Quick Commands
```bash
npm run dev            # Start dev server (port 5000)
npm run health         # One-shot: tsc + tests + verify
npm run test:summary   # 2,460 tests, 1-line output
npm run verify:summary # 7-phase verification, compact
npm test               # Full test output
npm run verify         # Full verification (verbose)
npm run db:push        # Push schema changes
npm run lint:summary   # tsc --noEmit, 1-line output
npm run diff:summary   # Compact git status + diff stat
npm run test:file -- <path>  # Run single test file
npm run stats          # Codebase metrics
npm run audit:quick    # Quick code quality scan
npm run exports:check  # Find unused exports
```

## Tech Stack
React 18, TypeScript, Wouter, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts, Three.js, framer-motion, Express 5, Drizzle ORM, PostgreSQL, Zod, jsPDF, xlsx, pptxgenjs

## Design System (ElevenLabs Standard)
- **UI standard**: ElevenLabs component patterns — shadcn primitives (`Button`, `Card`, `DropdownMenu`, `Separator`) + `cva` for variants
- **Colors**: All hardcoded `bg-gray-*`, `text-gray-*`, `border-gray-*` have been replaced with CSS variable tokens (`text-foreground`, `text-muted-foreground`, `bg-muted`, `border-border`, etc.) — zero hardcoded gray references remain
- **Buttons**: shadcn `Button` from `@/components/ui/button` — GlassButton is deleted
- **Cards**: shadcn `Card` or `bg-card border shadow-sm` tokens; `SectionCard`/`ContentPanel` are thin wrappers
- **Icons**: Custom duotone brand icons in `client/src/components/icons/brand-icons.tsx` (~35 icons). All sidebar, tab, and command palette icons use these instead of Lucide. Lucide still used for utility icons (chevrons, loaders, close buttons).
- **Export menus**: `ExportToolbar` uses shadcn `DropdownMenu` internally
- **Voice/AI components**: Canonical versions in `client/src/features/ai-agent/components/` (17 components: conversation, orb, waveform, message, audio-player, etc.)
- **Theme**: Liquid ice palette defined via CSS variables in `client/src/index.css` — components consume via Tailwind tokens. Theme engine (`themeUtils.ts`) manages all CSS vars including sidebar variables. 100% theme-compliant — zero `bg-gray-*`, `text-gray-*`, `border-gray-*`, `bg-white`, `bg-black`, or hardcoded hex color classes remain. All structural colors use tokens (`bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`, `text-primary-foreground`).
- **Exceptions**: Chart data colors (Recharts fill/stroke) may use hardcoded hex; semantic colors (red=error, green=success, amber=warning, blue=info) remain as Tailwind utilities; ~40 `text-white` instances on dark overlays/semantic badges are contextually correct

## Documentation (all in .claude/)
```
.claude/
├── claude.md              # Master doc (source of truth)
├── rules/ (26 files)      # Enforceable constraints
├── skills/ (126 files)    # Implementation knowledge
├── tools/ (61 files)      # Tool schemas
├── manuals/               # Checker + user manuals
├── commands/              # Slash commands
└── scripts/               # SQL utilities
```

## Key References
| Topic | Location |
|-------|----------|
| Architecture & tech stack | `.claude/claude.md` § Tech Stack, `.claude/skills/architecture/SKILL.md` |
| User preferences | `.claude/claude.md` § User Preferences |
| Financial engine | `.claude/rules/financial-engine.md`, `.claude/skills/finance/SKILL.md` |
| Admin page (10 tabs) | `.claude/skills/admin/SKILL.md`, `.claude/skills/admin/ai-agent-admin.md` |
| Prod migration (sync) | `server/migrations/prod-sync-002.ts` — canonical data enforcement on every boot |
| AI assistant (Marcela) | `.claude/claude.md` § Marcela AI, `.claude/skills/marcela-ai/SKILL.md` |
| Design system & themes | `client/src/lib/theme/` (reusable module), `.claude/skills/design-system/SKILL.md` |
| Testing & proof system | `.claude/claude.md` § Testing & Proof System, `.claude/skills/proof-system/SKILL.md` |
| Rules (26 files) | `.claude/rules/` — session-startup, constants, no-hardcoded, recalculate-on-save, etc. |
| Session memory | `.claude/rules/session-memory.md` (read first every session) |
| Context loading | `.claude/skills/context-loading/SKILL.md` (task-to-skill router) |
| Research system | `.claude/skills/research/SKILL.md` |
| Exports | `.claude/skills/exports/SKILL.md` |
| Voice UI blocks (5) | `.claude/skills/marcela-ai/SKILL.md` — VoiceChatOrb/Full/Bar, Speaker, Transcriber at `/voice` |

## Invariants
- UNQUALIFIED audit opinion required at all times
- All tests must pass before delivering changes
- No LLM-computed financial values — engine only
- Button labels: always "Save", never "Update"
- USALI four-level waterfall: GOP → AGOP → NOI → ANOI. GOP = Revenue − operating expenses (EXCLUDES insurance/taxes). AGOP = GOP − management fees. NOI = AGOP − insurance − property taxes (fixed charges). ANOI = NOI − FF&E reserve. Internal fields: `gop`, `agop`, `noi`, `anoi`. ANOI is the bottom operating line feeding into netIncome, cashFlow, BTCF, taxableIncome. NOI (proper) used for cap rate valuations.
- Button hover: `hover:scale-[1.03] active:scale-[0.97]` on all buttons — noticeable bounce
- All properties: `userId = NULL` (shared portfolio)
- Ricardo Cidale is sole Admin
- AI agent name configurable via DB (`aiAgentName`), default "Marcela"
- All ElevenLabs config via API — no manual dashboard usage

## Barrel Files & Wrappers
Documented in `.agents/skills/codebase-architecture/SKILL.md`. Key rules:
- Barrel files (`index.ts`) aggregate directory exports — maintain these
- Thin re-export wrappers (e.g., `lib/api.ts` → `lib/api/index`) exist for convenience — never duplicate logic
- New code should import from canonical source, not wrappers
- Orphan wrappers (zero importers) should be deleted during cleanup

## Preset Themes
5 admin-selectable themes seeded via `script/seed-preset-themes.ts`:
Studio Noir, Tuscan Olive Grove, Starlit Harbor, Coastal Breeze, Electric Twilight.
Theme engine: `client/src/lib/theme/` (reusable module) — maps PALETTE rank 1-6, ACCENT rank 1 (→ `--accent-pop`), CHART rank 1-5, LINE rank 1-5 to CSS variables.

### Theme Module Structure (`client/src/lib/theme/`)
```
theme/
├── index.ts        # Barrel export — single import point
├── types.ts        # ThemeColor, ThemePreset, ColorCategory
├── color-utils.ts  # hexToHslString, contrastHsl (pure functions)
├── engine.ts       # applyThemeColors, resetThemeColors, MANAGED_CSS_VARS
└── presets.ts      # 5 preset palettes + getPresetByName/getPresetNames
```
Portable: no DB, no framework dependencies. Import via `@/lib/theme` in any app.

## Scripts Directory
All utility scripts live in `script/` (single canonical directory). Includes health checks, test runners, verification, seed data, branding tools, and admin utilities.

## Export System (ExportDialog + ExportVersion)
- **ExportDialog** (`client/src/components/ExportDialog.tsx`): Modal gate for PDF/PPTX/PNG exports. Exports `ExportVersion = "short" | "extended"` type and the `ExportDialog` component.
- **ExportVersion**: `"short"` = summary/headers only (accordions collapsed, formula rows excluded). `"extended"` = all sections expanded (formula rows still excluded — only data rows).
- **Props**: `open`, `onClose`, `onExport(orientation, version)`, `title`, `showVersionOption` (shows/hides the radio group).
- **Integration pattern**: PDF/PPTX/PNG actions set `pendingExportAction` state and open dialog → dialog calls `handleVersionExport(orientation, version)` → version-aware data generation → actual export.
- **CSV/Excel bypass**: These formats always export directly without the dialog (raw data, no visual formatting concerns).
- **PropertyDetail.tsx**: Uses `ExportVersion` in `handleExport`. For income tab: `extended` expands all accordion rows, `short` collapses them. Both exclude `isFormula` rows from visual exports.
- **IncomeStatementTab.tsx**: `generateIncomeStatementData(overrideExpanded?, excludeFormulas?)` — accepts override expanded set and formula exclusion flag. `getVersionRows(version)` builds the appropriate row set.
- **CashFlowTab.tsx** & **BalanceSheetTab.tsx**: Same dialog-gate pattern. CashFlowTab has `showVersionOption={true}`, BalanceSheetTab has `showVersionOption={false}` (no expandable rows).
- **ExportMenu** (`client/src/components/ui/export-toolbar.tsx`): Dropdown with action helpers (`pdfAction`, `csvAction`, `excelAction`, `pptxAction`, `chartAction`, `pngAction`).

## Bar Charts (shadcn Pattern)
- All bar charts use `ChartContainer`/`ChartTooltip`/`ChartTooltipContent` from `@/components/ui/chart`.
- `radius={8}` on all `<Bar>` elements, `LabelList` on top for value labels.
- Config uses `satisfies ChartConfig` pattern.
- Files: `OverviewTab.tsx` (IRR + Equity), `TornadoChartPanel.tsx`, `WaterfallChart.tsx`.

## Line Charts (shadcn Pattern — Target Style)
- Use `ChartContainer`/`ChartTooltip`/`ChartTooltipContent` from `@/components/ui/chart`.
- `LineChart` with `CartesianGrid vertical={false}`, margins `{ top: 24, left: 24, right: 24 }`.
- `ChartTooltip cursor={false}` with `ChartTooltipContent indicator="line"`.
- `Line` with `type="natural"`, `strokeWidth={2}`, colored dots via custom `dot` render prop.
- Each data point has a `fill` field using CSS variables (`var(--color-seriesName)`).
- Custom `Dot` component: `r={5}`, `fill={payload.fill}`, `stroke={payload.fill}`.
- Config uses `satisfies ChartConfig` with `color: "var(--chart-N)"` per series.
- Reference: shadcn "Line Chart - Dots Colors" pattern.
- **Multi-series variant** ("Line Chart - Dots"): One `<Line>` per series, each with own `stroke="var(--color-seriesName)"`, simple `dot={{ fill: "var(--color-seriesName)" }}`, `activeDot={{ r: 6 }}`. `XAxis` with `tickLine={false}`, `axisLine={false}`, `tickMargin={8}`, `tickFormatter` for abbreviation. `ChartTooltipContent hideLabel`. Margins `{ left: 12, right: 12 }`.

## Norfolk AI Logos
- `norfolk-ai-wireframe.png` — thin outline strokes, dim on dark backgrounds (avoid for login)
- `norfolk-ai-blue.png` — solid fill, good visibility (used on login page)
- `norfolk-ai-yellow.png` — alternate color variant
- Login page uses `norfolk-ai-blue.png` with `text-foreground` (no opacity reduction)

## Session Patterns & Conventions
- **generatePropertyProForma always returns 10 years (120 months)** regardless of `projectionYears`. Slice to `projectionYears * 12` when passing to server.
- **GAAP compliance test expectations**: Rule names in `gaap-compliance.test.ts` must match the actual rule names emitted by `gaapComplianceChecker` (e.g., `revenue-recognition-accrual`, `matching-principle`, etc.). If checker refactors rename rules, update test expectations accordingly.
- **stripAutoFields**: Always use on all `.set()` calls to prevent Drizzle auto-field conflicts.
- **Button label rule**: Always "Save", never "Update".

## Future Improvements (Noted, Not Blocking)
- `shared/schema.ts` (1,172 lines) — candidate for domain split (auth, portfolio, research, branding, operations)
- `client/src/components/ui/sidebar.tsx` (736 lines) — shadcn/ui primitive, do not modify
- Feature-first client folder reorg (`features/admin`, `features/property`, etc.) — not yet implemented
