# Hospitality Business Group — Project Instructions

## Overview

This project is a business simulation portal for Hospitality Business Group, modeling a boutique hospitality management company and its individual property Special Purpose Vehicles (SPVs). It provides monthly and yearly financial projections, adhering to GAAP standards (ASC 230, ASC 360, ASC 470). The platform aims to deliver a premium, bespoke financial platform experience with a focus on financial accuracy and robust data governance. The vision is to enable precise financial modeling and reporting for the hospitality industry.

## User Preferences

- Simple, everyday language. Ask clarifying questions before implementing — do not assume.
- **TOP PRIORITY: Financial accuracy always beats UI enhancements.** The proof system must always pass.
- Always format money as currency (commas, appropriate precision).
- All skills live in `.claude/skills/`; `.agents/skills/` contains slim pointers for Replit task agent compatibility.
- Company name is "Hospitality Business Group" (or "Hospitality Business" for short).
- Update skills and manuals after every feature change.
- **Doc Harmony Rule:** `replit.md` and `.claude/claude.md` must stay in sync. Both are standalone, comprehensive project docs — neither is a "pointer" to the other. When updating one, update the other. The health check enforces matching test counts and stats across both files.
- All UI components must reference a theme via the theme engine.
- New UI features get their own skill file in `.claude/skills/ui/`.
- **Button Label Consistency:** Always "Save" — never "Update". See `rules/ui-patterns.md`.
- **100% Session Memory:** Save decisions to `.claude/session-memory.md` at session end.
- **Every financial line item** should have a ? tooltip (HelpTooltip or InfoTooltip).
- **Every page must be graphics-rich** — charts, animations, visual elements required.
- **Context reduction is mandatory.** Every refactor must produce skills, helpers, scripts. See `skills/coding-conventions/context-reduction.md`.
- **Premium design, always.** $50K+ bespoke financial platform feel. See `rules/design-standards.md`.
- **Always update replit.md and claude.md after every task.** Mandatory — no exceptions.

## System Architecture

The application features a React 18 frontend built with TypeScript, Wouter, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts, D3.js, and framer-motion. The backend is an Express 5 application utilizing Drizzle ORM and PostgreSQL.

**Core Design Principles & Features:**
-   **Financial Accuracy & Compliance:** Highest priority, enforced by a comprehensive proof system (3,498 tests across 151 files), GAAP verification, and USALI 12th Edition compliance for property-level Income and Cash Flow Statements. The Balance Sheet Identity (A = L + E) must hold within $1.
-   **Modular Skill-Based Architecture:** Domain knowledge and context management are handled through a skill-based system located in `.claude/skills/`.
-   **Theming & UI/UX:** A robust theme engine provides consistent UI with 5 presets (default: Tuscan Olive Grove). All UI components are theme-compliant. Specific UI patterns (e.g., GlassButton, PageHeader, ExportMenu) and consistent button labels ("Save") are enforced. Every financial line item includes an `InfoTooltip`.
-   **Data Governance:** Model constants are primarily DB-backed with fallbacks, editable via admin interfaces. Inflation rates cascade globally.
-   **Configuration Management:** Settings are managed via "Company Assumptions" (admin-only, entity configuration), an "Admin panel" (system configuration), and a read-only "Model Inputs" panel for non-admins.
-   **Unified Export System:** A `server/report/compiler.ts` generates `ReportDefinition` IR, which is then rendered into PDF, PPTX, XLSX, and DOCX formats. Premium PDF exports leverage `@react-pdf/renderer` and an LLM Design Pass for intelligent layout, while client-side exports use jsPDF, pptxgenjs, and SheetJS. Cover pages are never included in any export.
-   **Multi-Tenancy:** Supports users, groups, logos, themes, and branding resolution for multiple entities.
-   **LLM Integration:** Features a dual-model configuration (primary + fallback) for AI-powered functionalities across 7 domains, with configurable defaults in the Admin panel.
-   **Observability:** Sentry for error tracking, PostHog for analytics, Upstash Redis for caching, and circuit breakers for integration stability.
-   **Image Processing:** A server-side Sharp pipeline generates responsive WebP/AVIF image variants.

## Tech Stack

- **Frontend:** React 18, TypeScript, Wouter, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts, D3.js, framer-motion
- **Backend:** Express 5, TypeScript, Drizzle ORM, PostgreSQL
- **PDF:** jsPDF (client), @react-pdf/renderer (server premium)
- **AI/LLM:** Anthropic, Gemini (dual-model config with 7 domains)
- **Observability:** Sentry, PostHog, Upstash Redis

---

## Skill Router

| Domain | Skill Path | What It Covers |
|--------|-----------|---------------|
| Architecture | `.claude/skills/architecture/SKILL.md` | Tech stack, two-entity model, file organization |
| Design System | `.claude/skills/design-system/SKILL.md` | Colors, typography, component catalog |
| Theme Engine | `.claude/skills/ui/theme-engine.md` | Multi-theme system, token structure |
| Component Library | `.claude/skills/component-library/SKILL.md` | PageHeader, GlassButton, ExportMenu |
| Proof System | `.claude/skills/proof-system/SKILL.md` | 3,498 tests, verification commands |
| Finance (22 skills) | `.claude/skills/finance/` | IS, CF, BS, IRR, DCF, fee categories |
| Research (23 skills) | `.claude/skills/research/` | Market, ADR, occupancy, cap rate |
| UI (45 skills) | `.claude/skills/ui/` | Graphics, animation, navigation |
| Exports | `.claude/skills/exports/SKILL.md` | PDF, Excel, PPTX, PNG, CSV export system |
| Database | `.claude/skills/database/SKILL.md` | Dev/prod databases, Drizzle ORM, migrations |

---

## Key Rules

- **Calculations always highest priority** — never compromise financial accuracy for visuals
- **No raw hex in components** — use CSS variable tokens
- **All buttons GlassButton**, all pages PageHeader, all exports ExportMenu
- **No mock data** in production paths
- **Finance changes must pass verification** (UNQUALIFIED opinion)
- **Engine chain**: `gop = revenue − opex`, `agop = gop − feeBase − feeIncentive`, `noi = agop − expenseTaxes`, `anoi = noi − expenseFFE`
- **Balance Sheet Identity**: A = L + E must hold within $1
- **Cover pages never included** in any export format
- **LLM dual-model config** — primary + fallback model with vendor selection in Admin LLM tab

---

## User Roles

| Role | Access |
|------|--------|
| `admin` | Full — all pages + Admin Settings |
| `user` | Management-level — no Admin panel |
| `checker` | User + verification tools |
| `investor` | Limited — Dashboard, Properties, Profile, Help |

---

## Quick Commands

```bash
npm run dev            # Start dev server (port 5000)
npm run health         # tsc + tests + verify + doc harmony (~60s)
npm run test:summary   # All 3,498 tests, 151 files (~35s)
npm run verify:summary # 8-phase financial verification (~20s)
npm run lint:summary   # TypeScript check only (<10s)
npm run stats          # File/line/test counts (<5s)
npm run audit:quick    # Code quality checks (<3s)
npm run exports:check  # Unused export detection (<5s)
npm run diff:summary   # Git status + diff stats (<1s)
npm run db:push        # Push schema changes
npm run test:file -- <path>  # Single test file
```

---

## External Dependencies

-   **Database:** PostgreSQL (managed by Drizzle ORM)
-   **Frontend Libraries:** React 18, Wouter, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts, D3.js, framer-motion
-   **PDF Generation:** jsPDF (client-side), @react-pdf/renderer (server-side premium)
-   **Document Processing:** Google Document AI (OCR)
-   **Image Processing:** Sharp
-   **Mapping:** MapLibre GL
-   **Monitoring & Analytics:** Sentry, PostHog
-   **Caching:** Upstash Redis
-   **AI/LLM Providers:** `@anthropic-ai/sdk`, Gemini
-   **Icons:** @phosphor-icons/react, Lucide
-   **Email:** Resend
-   **Voice AI:** ElevenLabs (for Marcela AI functionality)
-   **Telephony:** Twilio (for voice webhooks, SMS, Media Streams)
-   **Research/Data APIs:** RapidAPI (Property Finder), FREDService (economic data), HospitalityBenchmarkService (CoStar/STR/AirDNA adapter), Perplexity SDK, Tavily (for GroundedResearchService)
-   **Spreadsheet/Presentation:** xlsx, pptxgenjs (client-side)