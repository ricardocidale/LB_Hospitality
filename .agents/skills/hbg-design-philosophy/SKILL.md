---
name: hbg-design-philosophy
description: The visual identity, UX principles, and hospitality-appropriate design language governing every screen in the HBG Portal. Covers Swiss Modernist design identity, typography system, color philosophy, motion design, layout principles, data presentation patterns, hospitality vocabulary, navigation structure, responsive design, and chart styling. Use this skill when building new pages, designing UI, choosing terminology, or making any visual decision.
---

# HBG Design Philosophy

This skill defines the visual identity and UX principles that make the HBG Portal feel like a premium institutional investment tool used by hospitality professionals — not a consumer SaaS product.

**Related skills:** `consistent-card-widths` (width conventions), `save-button-placement` (form interaction), `design-system-export` (component library), `export-system` (document exports), `hbg-business-model` (business vocabulary), `hbg-product-vision` (product direction)

---

## Design Identity: Swiss Modernist Precision

The app's visual language is **authoritative, minimalist, and high data-density with surgical clarity**. Every screen should feel like a page from an investment committee presentation or an institutional offering memorandum.

### Core Principles
1. **Data density without clutter** — Show many metrics in compact grids; use whitespace strategically, not generously
2. **Typographic hierarchy** — Three-font system creates clear visual layers
3. **Earth-tone warmth** — Warm, natural color palette avoids cold corporate sterility
4. **Restrained motion** — Animations are polish, never distraction
5. **Professional precision** — Monospaced numbers for alignment; consistent formatting

---

## Typography: Triple-Font System

| Font | Role | Usage | CSS Variable |
|------|------|-------|-------------|
| **IBM Plex Sans** | Display / Headings | Page titles, section headers, navigation labels | `--font-display` |
| **Inter** | Body / Labels | Paragraph text, form labels, descriptions, tooltips | `--font-sans` |
| **JetBrains Mono** | Financial Data / Metrics | All numbers, currency values, percentages, KPIs | `--font-mono` |

### Typography Classes
| Context | Classes |
|---------|---------|
| Page headings | `text-lg font-display text-foreground` |
| Body text | `text-sm text-muted-foreground/80 leading-relaxed` |
| Form labels | `text-xs text-muted-foreground` |
| Micro labels | `text-[11px] text-muted-foreground/60 uppercase tracking-wider` |
| Financial values | `font-mono font-semibold text-foreground` |

---

## Color Philosophy

### Default Theme: "Tuscan Olive Grove"
An earth-tone palette inspired by Italian hospitality:

| Token | HSL | Visual | Usage |
|-------|-----|--------|-------|
| `--primary` | 91 13% 54% | Olive green | Primary buttons, active states |
| `--secondary` | 100 20% 30% | Dark forest | Secondary elements |
| `--background` | 30 100% 98% | Warm cream | Page background |
| `--accent-pop` | 43 90% 55% | Tuscan gold | Accent highlights, warnings |
| `--accent-pop-2` | 155 41% 30% | Sage | Secondary accent |

### Theme Presets
Multiple theme presets are available and switchable:
- **Tuscan Olive Grove** (default) — warm earth tones
- **Studio Noir** — dark, sophisticated
- **Starlit Harbor** — cool blues
- **Coastal Breeze** — light and airy

### Dynamic White-Labeling
Each user group can have custom branding (logo, theme). Theme resolution cascades: **User preference → Group theme → System default**.

### Dark Mode
Full dark mode support via CSS variables with `:root` / `.dark` variants. All custom components must respect the dark mode variables.

---

## Motion Design

**Framework:** Framer Motion

### Principles
- Motion is a **polish layer** — it communicates state changes, never distracts
- Transitions are restrained and fast (150–300ms)
- No bouncing, no overshooting, no playful animations

### Standard Patterns
| Pattern | Implementation | When to Use |
|---------|---------------|-------------|
| Page entry | `AnimatedPage` — fade + y:8 slide | Every route transition |
| Progressive disclosure | `ScrollReveal` — fade on scroll | Long pages with sections |
| Accordion expand | Framer `layout` animation | SectionCard open/close |
| Loading states | `Loader2` spinner from lucide-react | Async operations |

### AnimatedPage Wrapper
Every page route must be wrapped:
```tsx
<Layout>
  <AnimatedPage>
    <div className="space-y-6">
      {/* page content */}
    </div>
  </AnimatedPage>
</Layout>
```

---

## Layout Principles

### Page Structure
Reference the `consistent-card-widths` skill for detailed width categories. Summary:

| Category | `max-w-*` | Use Case |
|----------|-----------|----------|
| Dashboard / Multi-column | None (full width) | Grids, dashboards |
| Form / Single-column | `max-w-4xl` | Property edit, settings |
| Narrow profile | `max-w-2xl mx-auto` | Profile, account |
| Admin tabs | Full width, delegated | Admin panel tabs |

### Vertical Rhythm
- `space-y-6` between PageHeader and content sections
- `space-y-4` within cards/sections
- `gap-6` in grid layouts

### SectionCard
Collapsible content sections with consistent header styling. Used for grouping related form fields or data sections.

### PageHeader
Always placed **inside** the width-constraining container (never outside). Includes title, subtitle, back link, and actions slot (for save buttons — see `save-button-placement` skill).

---

## Data Presentation

### Financial Tables
High-density grids designed for scanning large datasets:
- **Alternating row tints** for readability
- **Bold subtotals** (GOP, NOI, Net Income rows)
- **Italic formula rows** (calculated fields)
- **Section header fills** with background tint
- **Right-aligned numbers** with monospace font
- **Consistent currency formatting** ($1,234,567 or $1.2M compact)

### KPIGrid
Metric cards for dashboard-style displays:
```tsx
<KPIGrid
  items={[
    { label: "Portfolio RevPAR", value: "$185", sublabel: "Weighted Average" },
    { label: "Total NOI", value: "$2.4M", trend: "+8.2%" },
  ]}
  columns={4}
  variant="glass"
/>
```

### InfoTooltip and GaapBadge
- **InfoTooltip**: Contextual education without clutter — hover for explanation
- **GaapBadge**: Small badge indicating which GAAP standard applies to a line item (e.g., "ASC 230")
- These provide transparency without overwhelming the UI

---

## Hospitality Vocabulary Rules

Every label, tooltip, section header, and navigation item must use hospitality industry terminology:

| Always Use | Never Use |
|-----------|-----------|
| Average Daily Rate (ADR) | Average price |
| Occupancy | Utilization rate |
| Rooms | Units |
| Property | Asset (except in financial context) |
| Gross Operating Profit (GOP) | Gross margin |
| Housekeeping | Cleaning costs |
| Food & Beverage | Dining |
| Pre-Opening | Setup period |
| Hold Period | Duration |
| Disposition | Sale (in formal contexts) |
| Capital Improvements | Upgrades |
| RevPAR | Revenue per unit |
| Guests | Users (when referring to hotel customers) |

### Navigation Vocabulary
| Nav Item | Description |
|----------|-------------|
| Dashboard | Portfolio overview with KPIs |
| Properties | Hotel asset list |
| Management Company | Corporate entity financials |
| Simulation | Analysis tools |
| Property Finder | Acquisition search |
| General Settings | Global configuration |
| My Scenarios | What-if portfolio snapshots |

---

## Tone

**Professional, confident, precise** — the language of investment memos and offering memoranda.

- Tooltips should **educate without condescending** — assume the user is a hospitality professional
- Error messages should be **specific and actionable** — not generic "something went wrong"
- Never use casual or playful language
- Financial terms should be precise (e.g., "Net Operating Income" not "profit")
- Use abbreviations only after first defining them (e.g., "Gross Operating Profit (GOP)")

---

## Responsive Design

- **Desktop-first** — the primary experience is a wide-screen professional workstation
- **Static sidebar** on desktop with full navigation
- **Mobile**: Sheet drawer for navigation + bottom navigation bar for key actions
- Financial tables may use horizontal scroll on mobile
- KPIGrids reduce columns on smaller screens

---

## Admin Visual Patterns

Admin pages use specific style constants from `client/src/components/admin/styles.ts`:
- `ADMIN_CARD` — card styling for admin sections
- `ADMIN_LINK_CARD` — card styling for admin navigation links

Reference the `save-button-placement` skill for form interaction patterns within admin tabs.

---

## Chart Styling

**Framework:** Recharts (with D3 under the hood)

### Chart Types
| Type | Use Case |
|------|----------|
| Line (multi-series) | Revenue/NOI trends over projection period |
| Bar | Annual comparisons, budget vs actual |
| Donut | Revenue mix, expense breakdown |
| Tornado | Sensitivity analysis (IRR impact of each variable) |
| Heatmap | Scenario comparison grids |
| Waterfall | Cash flow walkthrough (revenue → expenses → profit) |
| Radar | Property comparison across multiple metrics |

### Chart Colors
Charts use theme-consistent colors from the active color palette. Export versions use the brand palette defined in the `export-system` skill.

### Export Integration
Charts translate to PDF/PPTX via the export system — reference the `export-system` skill for how chart data maps to export formats.

---

## Key Files

| File | Purpose |
|------|---------|
| `client/src/index.css` | Theme CSS variables, font imports, dark mode |
| `client/src/lib/theme/engine.ts` | Theme resolution and dynamic theming |
| `client/src/components/ui/page-header.tsx` | Shared page header |
| `client/src/components/ui/section-card.tsx` | Collapsible section card |
| `client/src/components/graphics/` | AnimatedPage, ScrollReveal, KPIGrid, InsightPanel |
| `client/src/components/icons/` | Custom brand SVG icons |
| `client/src/components/admin/styles.ts` | Admin card style constants |
| `client/src/lib/utils.ts` | `cn()` Tailwind merge helper |
