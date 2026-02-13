# Graphics-Rich Design Standard

## Rule

Every page in the application must be visually impressive. Leverage all available graphics libraries, AI services, and visualization tools to create a rich, professional experience. No page should feel like a plain data table — every view should have meaningful visual elements.

## Available Services to Engage

### Charting & Visualization (Recharts)
- Use interactive, animated charts on every page that displays financial data
- Chart types: area, bar, line, composed, radar, waterfall, pie/donut, treemap
- All charts must have tooltips, legends, and smooth animations
- Use gradient fills and styled axes for a polished look

### 3D Graphics (React Three Fiber / Three.js)
- Use for hero sections, loading states, or decorative elements
- Portfolio visualizations, building models, or abstract data sculptures
- Keep performant — use lazy loading and suspense boundaries

### Animations (Framer Motion)
- Page transitions between routes
- Staggered list animations for cards and table rows
- Micro-interactions on buttons, toggles, and interactive elements
- Number counters that animate when values change
- Hover effects on cards and data elements

### AI-Generated Images (OpenAI / Anthropic / Gemini)
- Generate property illustration images when properties lack photos
- Create themed visual assets that match the active design theme
- Use AI for dynamic chart annotations or insight summaries

### Icons & Visual Elements (Lucide React)
- Every section header should have a relevant icon
- Use icons in data tables, cards, and navigation
- Status indicators with colored icons

### Object Storage
- Store generated images, custom logos, and visual assets
- Serve cached AI-generated content from object storage

## Page-Level Standards

| Page | Required Visual Elements |
|------|------------------------|
| Dashboard | Hero metrics with animated counters, portfolio overview chart, property cards with images |
| Properties List | Property cards with images/illustrations, status badges, mini-charts |
| Property Detail | Revenue/expense charts, occupancy visualization, property image header |
| Company Assumptions | Interactive sliders with real-time chart previews |
| Company Financials | Multi-year P&L charts, cash flow waterfall, balance sheet composition |
| Executive Summary | Full-page report with charts, KPI cards, branded header |
| Sensitivity Analysis | Tornado charts, scenario comparison visuals |
| Financing Analysis | Amortization charts, debt service coverage graphs |
| Compare | Side-by-side property comparison with radar charts |
| Timeline | Visual timeline with milestones and property acquisition dates |
| Map View | Interactive map with property markers and data overlays |
| Profile | User avatar area, theme preview, activity summary |
| Admin | Visual theme previews, logo gallery, group membership visualization |

## Design Principles

1. **No bare tables** — Always pair data tables with a chart or visual summary
2. **Animated transitions** — Page changes and data updates should animate smoothly
3. **Branded consistency** — All visuals must respect the active theme colors
4. **Progressive enhancement** — Show skeleton loaders, then animate content in
5. **Data density with clarity** — Pack information in but keep it readable with good hierarchy

## Related Skills (Mandatory Reading for Graphics Work)

Before any graphics or visual enhancement work, load these skills:

| Skill | Path | What It Covers |
|-------|------|----------------|
| Graphics Component Catalog | `.claude/skills/ui/graphics-component-catalog.md` | Reusable graphics components: KPIGrid, InsightPanel, Gauge, DonutChart, AnimatedPage, ScrollReveal, etc. Import paths and props reference. |
| Page Enhancement Checklist | `.claude/skills/ui/page-enhancement-checklist.md` | Per-page-type minimum visual requirements (financial, analysis, list, config pages). Checklist for architect review compliance. |
| Animation Patterns | `.claude/skills/ui/animation-patterns.md` | AnimatedPage, ScrollReveal, AnimatedGrid, AnimatedGridItem, HoverScale patterns with Framer Motion. |
| Entity Cards | `.claude/skills/ui/entity-cards.md` | Container cards, featured entity cards, entity item cards, logo display, CRUD actions for admin pages. |
| Charts | `.claude/skills/ui/charts.md` | Recharts line/bar/area chart styling, Waterfall, Heat Map, Radar chart specs. |
| 3D Graphics | `.claude/skills/3d-graphics/SKILL.md` | Three.js scenes, React Three Fiber wrappers. |

## Verification Checklist

When reviewing or auditing graphics compliance, check each page against:
1. **Page Enhancement Checklist** (`ui/page-enhancement-checklist.md`) — Does the page meet the minimum requirements for its type?
2. **Graphics Component Catalog** (`ui/graphics-component-catalog.md`) — Are the correct reusable components being used?
3. **Page-Level Standards** (table above) — Does the page include all required visual elements?
4. **Animation Patterns** (`ui/animation-patterns.md`) — Are AnimatedPage wrappers and ScrollReveal used on every page?
