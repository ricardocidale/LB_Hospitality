# Hospitality Business Group — Project Instructions

## Project Summary
Business simulation portal for Hospitality Business Group. Models a boutique hospitality management company alongside individual property SPVs with monthly and yearly financial projections. GAAP-compliant (ASC 230, ASC 360, ASC 470) with IRS depreciation rules and an internal audit/verification engine.

## Skill Router
All detailed documentation lives in focused skills. Load the relevant skill before working.

| Domain | Skill Path | What It Covers |
|--------|-----------|---------------|
| Architecture | `.claude/skills/architecture/SKILL.md` | Tech stack, two-entity model, file organization |
| Design System | `.claude/skills/design-system/SKILL.md` | Colors, typography, component catalog, CSS classes |
| Theme Engine | `.claude/skills/ui/theme-engine.md` | Multi-theme system, user-created themes, token structure |
| Component Library | `.claude/skills/component-library/SKILL.md` | PageHeader, GlassButton, ExportMenu, DarkGlassTabs, etc. |
| Proof System | `.claude/skills/proof-system/SKILL.md` | 384 tests, 5 golden scenarios, verification commands |
| 3D Graphics | `.claude/skills/3d-graphics/SKILL.md` | Three.js scenes, framer-motion wrappers |
| Database | `.claude/skills/database-environments/SKILL.md` | Dev/prod databases, migrations, sync |
| Tool Schemas | `.claude/skills/tool-schemas/SKILL.md` | Tool organization, schema conventions |
| Coding Conventions | `.claude/skills/coding-conventions/SKILL.md` | Style rules, finance code rules, audit doctrine |
| Exports | `.claude/skills/exports/SKILL.md` | PDF, Excel, PPTX, PNG, CSV export system |
| Source Code | `.claude/skills/source-code/SKILL.md` | Full source code map |
| Finance (17 skills) | `.claude/skills/finance/` | Income statement, cash flow, balance sheet, IRR, DCF, etc. |
| Research (8 skills) | `.claude/skills/research/` | Market, ADR, occupancy, cap rate, catering, etc. |
| UI Components (20+) | `.claude/skills/ui/` | Individual component specs with theme references |
| Manuals | `.claude/manuals/` | Checker manual (15 sections), user manual (16 sections) |

## Quick Commands
```bash
npm run dev       # Start dev server
npm test          # Run all 384 tests
npm run verify    # Full 4-phase financial verification
npm run db:push   # Push schema changes
```

## Key Rules
- **Calculations always highest priority** — never compromise financial accuracy for visuals
- **All UI references a theme** — see theme engine skill
- **No raw hex in components** — use CSS variable tokens
- **All buttons use GlassButton**, all pages use PageHeader, all exports use ExportMenu
- **No mock data** in production paths
- **Finance changes must state Active Skill** and pass verification (UNQUALIFIED)
- **Agent persona**: `.claude/rules/agent-persona.md` mandatory for finance work
- **Audit doctrine**: `.claude/rules/audit-doctrine.md` defines audit scope

## Integrations (server/integrations/)
Google Sheets, Gmail, Google Drive, Google Docs, Google Calendar, Stripe, Twilio, Replit Auth (not wired), Google Analytics (needs measurement ID). Notion dismissed by user.
