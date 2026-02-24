# Skill File Organization Standards

## Rule

All skill files must follow consistent organization, naming, and placement conventions. Skills are the executable documentation of how features work — they must be findable, up-to-date, and cross-referenced with their governing rules.

## Directory Structure

```
.claude/
├── claude.md                  # Master doc (always loaded)
├── rules/                     # Enforceable constraints (20 files + 1 archive)
├── skills/                    # How-to documentation (96 files)
│   ├── context-loading/       # Skill router (load first)
│   ├── architecture/          # System architecture
│   ├── coding-conventions/    # Code style rules
│   ├── component-library/     # UI component catalog
│   ├── database-environments/ # DB setup and migrations
│   ├── design-system/         # Colors, typography, tokens
│   ├── exports/               # PDF, Excel, PPTX, PNG, CSV
│   ├── finance/               # 16 financial calculation skills
│   ├── multi-tenancy/         # User groups, branding, roles
│   ├── proof-system/          # Test framework, verification
│   ├── property-finder/       # RapidAPI property search
│   ├── research/              # 17 AI research skills
│   ├── source-code/           # Full source file map
│   ├── testing/               # 7 test coverage skills
│   ├── tool-schemas/          # Tool JSON schema conventions
│   ├── ui/                    # 27 UI skills (charts, graphics, components, image picker)
│   ├── mobile-responsive/     # 4 mobile/tablet responsive design skills
│   └── 3d-graphics/           # Three.js / React Three Fiber
├── tools/                     # Tool schemas (JSON)
│   ├── analysis/              # Break-even, consolidation, scenario
│   ├── financing/             # DSCR, debt yield, prepayment, IRR
│   ├── returns/               # IRR vector, DCF, equity multiple
│   ├── ui/                    # Compare, theme, variance
│   └── validation/            # Assumption checks, funding gates
├── commands/                  # 8 slash commands
├── manuals/                   # Checker manual + user manual
│   ├── checker-manual/        # 15 sections + formulas + tools
│   └── user-manual/           # 16 sections
└── scripts/                   # SQL and utility scripts
```

## Placement Rules

1. **No loose files in `.claude/skills/`** — Every skill file belongs in a subdirectory. If a file doesn't fit an existing subdirectory, create one or place it in the most relevant existing one.
2. **UI skills go in `ui/`** — All visual, animation, chart, graphics, layout, and component skills belong under `.claude/skills/ui/`.
3. **Finance skills go in `finance/`** — All calculation, statement, and financial logic skills belong under `.claude/skills/finance/`.
4. **Research skills go in `research/`** — All AI research and market analysis skills belong under `.claude/skills/research/`.
5. **Testing skills go in `testing/`** — All test coverage and test methodology skills belong under `.claude/skills/testing/`.

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Directory SKILL.md | `SKILL.md` (uppercase) | `architecture/SKILL.md` |
| Sub-skills | `kebab-case.md` | `income-statement.md` |
| Rule files | `kebab-case.md` | `no-hardcoded-assumptions.md` |
| Tool schemas | `kebab-case.json` or `.js` | `calculate-dscr.json` |
| Command files | `kebab-case.md` | `add-constant.md` |

## Required Sections in Skill Files

Every SKILL.md should include:
1. **YAML frontmatter** with `name` and `description`
2. **Purpose** — What the skill covers
3. **Key files** — Source files this skill documents
4. **Related rules** — Which `.claude/rules/` files govern this skill's domain
5. **Examples** — Usage patterns or code snippets

## Rules-to-Skills Cross-Reference

Each rule governs one or more skill domains. When working in a domain, load both the rule AND the skill:

| Rule | Governs These Skills | Enforcement |
|------|---------------------|-------------|
| `graphics-rich-design.md` | `ui/graphics-component-catalog.md`, `ui/page-enhancement-checklist.md`, `ui/animation-patterns.md`, `ui/charts.md`, `3d-graphics/SKILL.md` | Every page must have graphics per checklist |
| `no-hardcoded-assumptions.md` | `finance/*`, `coding-conventions/SKILL.md` | No literal financial values in code |
| `no-hardcoded-admin-config.md` | `multi-tenancy/SKILL.md`, `design-system/SKILL.md` | No literal admin config values in code |
| `recalculate-on-save.md` | `architecture/SKILL.md`, `finance/calculation-chain.md` | All save mutations invalidate financial queries |
| `financial-engine.md` | `finance/*` (all 16 skills) | Engine architecture and calculation rules |
| `constants-and-config.md` | `finance/*`, `coding-conventions/SKILL.md` | Named constants in `shared/constants.ts` |
| `database-seeding.md` | `database-environments/SKILL.md`, `research/location-aware-seeding/` | Seed data standards |
| `api-routes.md` | `architecture/SKILL.md` | API route naming and middleware conventions |
| `architecture.md` | `architecture/SKILL.md`, `source-code/SKILL.md` | System architecture decisions |
| `audit-persona.md` | `proof-system/SKILL.md`, `testing/SKILL.md` | Audit doctrine and verification mindset |
| `session-startup.md` | `context-loading/SKILL.md` | Session init + architect calls include all rules |
| `documentation.md` | All skills | Source-of-truth hierarchy + docs-after-edits protocol |
| `ui-patterns.md` | `ui/entity-cards.md` | Button labels + entity card layout consistency |
| `verification-system.md` | `proof-system/SKILL.md`, `testing/SKILL.md` | GAAP verification pipeline |
| `release-audit-checklist.md` | `proof-system/SKILL.md`, `testing/SKILL.md`, `exports/SKILL.md` | Pre-release audit + rule compliance checks |
| `graphics-rich-design.md` | `mobile-responsive/SKILL.md`, `mobile-responsive/device-testing-checklist.md` | Graphics must render on all devices |
| `skill-organization.md` | All skills | Skill file structure and naming |
| `context-reduction.md` | All skills, all refactors | Every refactor/feature must produce supporting skills, helpers, scripts, and tools |
| `premium-design.md` | `ui/*`, `3d-graphics/SKILL.md`, `mobile-responsive/SKILL.md` | Premium bespoke design: animated numbers, micro-interactions, glassmorphism, staggered reveals, skeleton loading |

## When Creating New Skills

1. Check if a related subdirectory exists — use it
2. If not, create one with a `SKILL.md` as the entry point
3. Add the new skill to `context-loading/SKILL.md` task-to-skill map
4. Add a row to the Skill Router in `claude.md`
5. Reference the governing rule(s) in the skill's "Related rules" section
6. If the skill introduces a new domain, consider whether a new rule is needed

## Verification

On any audit or code review that touches `.claude/`:
1. Run `find .claude/skills -maxdepth 1 -name "*.md"` — should return 0 files (no loose skills)
2. Verify every rule in the cross-reference table above has its listed skills present
3. Verify `context-loading/SKILL.md` reflects the current directory structure
4. Verify `claude.md` Skill Router is up to date
