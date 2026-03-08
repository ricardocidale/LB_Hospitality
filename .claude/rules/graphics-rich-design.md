# Graphics-Rich Design Standard

Every page must be visually impressive. No page should feel like a plain data table.

> Page-level requirements and component catalog: `.claude/skills/ui/graphics-component-catalog.md`, `ui/page-enhancement-checklist.md`

## Required on Every Page

- At least one interactive animated chart (Recharts — gradient fills, custom tooltips, smooth animations)
- Framer Motion: page transitions, staggered list reveals, micro-interactions
- Section headers with icons (Lucide)
- Skeleton loading states while data loads

## Design Principles

1. **No bare tables** — Always pair with a chart or visual summary
2. **Animated transitions** — Page changes and data updates animate smoothly
3. **Branded consistency** — All visuals respect active theme colors (no raw hex)
4. **Progressive enhancement** — Skeleton first, then animate content in
5. **Data density with clarity** — Dense but readable; good hierarchy

## Skills to Load for Graphics Work

| Task | Load |
|------|------|
| Adding charts | `ui/charts.md`, `charts/SKILL.md` |
| Adding animations | `ui/animation-patterns.md` |
| Adding 3D elements | `3d-graphics/SKILL.md` |
| Building a new page | `ui/page-enhancement-checklist.md`, `ui/graphics-component-catalog.md` |
| Mobile graphics | `mobile-responsive/SKILL.md` |
