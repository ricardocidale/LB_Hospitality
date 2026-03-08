# Premium Design Standard

Every UI element must look and feel like a premium, bespoke $50K+ financial platform — not a generic AI template. Default shadcn/Tailwind is the starting point, never the finish line.

## What "Premium" Means (non-negotiable)

1. **Animated numbers** — Financial values animate on change. Never snap.
2. **Micro-interactions** — Every interactive element responds with subtle motion.
3. **Layered depth** — Glassmorphism, backdrop blur, shadows, gradient overlays. No flat cards.
4. **Custom charts** — Custom tooltips, gradient fills, animated entries, glow effects. No default Recharts gray grid.
5. **Smooth transitions** — Every route change, tab switch, content swap is choreographed. No hard cuts.
6. **Staggered reveals** — Lists and grids cascade in. Never all at once.
7. **Skeleton loading** — Every data section shows shimmer/skeleton while loading. No spinners alone.
8. **Typography hierarchy** — Playfair Display for headings, Inter for data. Mix weights deliberately.
9. **Color with purpose** — Use full theme palette. Accents for CTAs, muted for secondary.
10. **Spatial rhythm** — Consistent spacing. White space is a tool.

## Banned Patterns

- Plain white cards with thin gray borders
- Static number displays
- Hard page transitions
- Default Recharts appearance
- Lists that appear all at once
- Spinner-only loading states
- Buttons without hover/press states

## Edge Cases (must be handled with premium quality)

- **Empty states** — Beautiful illustrated placeholders with CTAs, not blank pages or "No data" text
- **Loading** — Full skeleton matching page structure; long ops show progress with context text
- **Errors** — Styled error cards with retry; never raw error strings
- **NaN/Infinity** — Show "—" with tooltip; never display raw NaN
- **$0 values** — Display as "$0", never blank
- **Negative values** — Red/warning color with parentheses
- **Reduced motion** — Respect `prefers-reduced-motion`; disable animations, maintain visual quality

## Verification

1. Does this page look like it cost $50K+ to design?
2. Are numbers animated? Static = violation.
3. Do cards have depth? Flat = violation.
4. Do transitions feel choreographed? Jarring = violation.
5. Do lists stagger? All-at-once = violation.
6. Are loading states skeleton-based? Spinner-only = violation.
