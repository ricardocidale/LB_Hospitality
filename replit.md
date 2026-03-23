# Hospitality Business Group — Project Instructions

## Overview

This project is a business simulation portal for Hospitality Business Group, modeling a boutique hospitality management company and individual property Special Purpose Vehicles (SPVs). It provides monthly and yearly financial projections, adhering to GAAP standards (ASC 230, ASC 360, ASC 470). The platform aims to offer a premium, bespoke financial analysis experience, supporting detailed financial calculations, reporting, and market intelligence for hospitality assets. The system includes robust testing with a proof system to ensure financial accuracy.

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

The application is built with a React 18 frontend (TypeScript, Wouter, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts, D3.js, framer-motion) and an Express 5 backend (Drizzle ORM, PostgreSQL, Zod).

**Core Design Principles:**
- **Financial Accuracy:** The highest priority, ensured by a comprehensive proof system with 3,498 tests, including GAAP verification.
- **Modular Skills:** The project uses a skill-based architecture (`.claude/skills/`) for managing domain knowledge and context loading.
- **Theming:** A robust theme engine (Tuscan Olive Grove default, 5 presets) ensures consistent UI appearance, with all components referencing a central theme.
- **Consistent UI/UX:** Adherence to specific UI patterns (e.g., GlassButton, PageHeader, ExportMenu), consistent button labels ("Save"), and detailed design standards. Every financial line item requires an `InfoTooltip`.
- **Image Processing:** A server-side Sharp pipeline generates multiple WebP/AVIF image variants for responsive loading.
- **Data Governance:** Governed model constants are primarily DB-backed with constant fallbacks, editable via specific admin interfaces. Inflation rates cascade from property to company to global defaults.
- **Settings Architecture:** Configuration is managed across "Company Assumptions" (admin-only, entity configuration), the "Admin panel" (system configuration), and a read-only "Model Inputs" panel for non-admins.
- **Export System:** A unified report compiler (`server/report/compiler.ts`) generates `ReportDefinition` IR, which is then rendered into PDF, PPTX, XLSX, and DOCX formats. Premium PDF exports utilize `@react-pdf/renderer` and an LLM Design Pass for intelligent layout. Client-side exports use jsPDF, pptxgenjs, and SheetJS.
- **USALI Compliance:** All property-level Income Statements and Cash Flow Statements are structured according to USALI 12th Edition standards.
- **Balance Sheet Identity:** The equation A = L + E must hold within $1 on every balance sheet.
- **Multi-Tenancy:** Supports users, groups, logos, themes, and branding resolution.
- **LLM Integration:** Dual-model configuration (primary + fallback) for various AI-powered features across 7 domains, with configurable defaults in the Admin panel.
- **Observability:** Sentry for error tracking, PostHog for analytics, Upstash Redis for caching, and circuit breakers for integration stability.

## Tech Stack

- **Frontend:** React 18 · TypeScript · Wouter · TanStack Query · Zustand · shadcn/ui · Tailwind CSS v4 · Recharts · D3.js · framer-motion
- **Backend:** Express 5 · Drizzle ORM · PostgreSQL · Zod
- **PDF:** jsPDF (client), @react-pdf/renderer (server premium) with LLM Design Pass
- **AI/LLM:** Anthropic Claude, Gemini — dual-model config (primary + fallback) across 7 domains
- **Mapping:** MapLibre GL
- **Voice/Telephony:** ElevenLabs, Twilio
- **Email:** Resend
- **Image Processing:** Sharp (WebP/AVIF pipeline)
- **Icons:** @phosphor-icons/react, Lucide
- **Monitoring:** Sentry, PostHog, Upstash Redis

## Skill Router

| Domain | Skill Path |
|--------|-----------|
| Context Loading | `.claude/skills/context-loading/SKILL.md` |
| Architecture | `.claude/skills/architecture/SKILL.md` |
| Design System | `.claude/skills/design-system/SKILL.md` |
| Theme Engine | `.claude/skills/ui/theme-engine.md` |
| Proof System | `.claude/skills/proof-system/SKILL.md` |
| Finance (22 skills) | `.claude/skills/finance/` |
| Research (23 skills) | `.claude/skills/research/` |
| UI (45 skills) | `.claude/skills/ui/` |
| Exports | `.claude/skills/exports/SKILL.md` |
| Database | `.claude/skills/database/SKILL.md` |
| Admin (16 sections) | `.claude/skills/admin/SKILL.md` |
| Marcela AI | `.claude/skills/marcela-ai/SKILL.md` |
| Coding Conventions | `.claude/skills/coding-conventions/SKILL.md` |

## Key Rules

- **Financial accuracy always beats UI enhancements.** The proof system must always pass.
- **No cover pages EVER** in any PDF export.
- **Balance Sheet Identity:** A = L + E must hold within $1.
- **USALI 12th Edition** compliance for all property-level statements.
- **Doc Harmony:** `replit.md` and `.claude/claude.md` must stay in sync.
- **Button labels:** Always "Save" — never "Update".
- **Theme compliance:** All UI components must reference the theme engine.
- **LLM dual-model config** — primary + fallback, 7 domains, no hardcoded models.
- **Brand colors:** SAGE=#9FBCA4, DARK_GREEN=#257D41, NAVY=#1A2332

## User Roles

| Role | Access |
|------|--------|
| `admin` | Full — all pages + Admin Settings |
| `user` | Management-level — no Admin panel |
| `checker` | User + verification tools |
| `investor` | Limited — Dashboard, Properties, Profile, Help |

## Quick Commands

```bash
npm run dev            # Start dev server (port 5000)
npm run health         # tsc + tests + verify + doc harmony (~60s)
npm run test:summary   # All 3,498 tests, 1-line output (~35s)
npm run verify:summary # 8-phase financial verification (~20s)
npm run lint:summary   # TypeScript check only (<10s)
npm run stats          # File/line/test counts (<5s)
npm run audit:quick    # Code quality check (<3s)
npm run exports:check  # Unused export detection (<5s)
npm run diff:summary   # Git status + diff stats (<1s)
npm run db:push        # Push schema changes
```

## External Dependencies

- **Database:** PostgreSQL (managed via Drizzle ORM)
- **UI Libraries:** React 18, Wouter, TanStack Query, Zustand, shadcn/ui, Tailwind CSS v4, Recharts, D3.js, framer-motion
- **PDF Generation:** jsPDF (client-side), @react-pdf/renderer (server-side premium)
- **Document Processing:** Google Document AI (OCR)
- **Image Processing:** Sharp
- **Mapping:** MapLibre GL
- **Monitoring & Analytics:** Sentry, PostHog
- **Caching:** Upstash Redis
- **AI/LLM Providers:** `@anthropic-ai/sdk@0.78.0`, Gemini (for specific AI features)
- **Icons:** @phosphor-icons/react, Lucide (default)
- **Email:** Resend (transactional emails)
- **Voice AI:** ElevenLabs (for Marcela AI)
- **Telephony:** Twilio (for voice webhooks, SMS, Media Streams)
- **Research/Data APIs:** RapidAPI (Property Finder), FREDService (economic data), HospitalityBenchmarkService (CoStar/STR/AirDNA adapter), Perplexity SDK, Tavily (for GroundedResearchService)
- **Spreadsheet/Presentation:** xlsx, pptxgenjs (client-side)
- **Microsoft Office Formats:** DOCX (via server-side rendering logic for premium exports)