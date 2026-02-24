# Premium Design Standard

## Rule

Every UI element in this application must look and feel like it belongs in a premium, bespoke financial platform — not a generic AI-generated template. The design must consistently surprise and impress. Default shadcn/Tailwind patterns are the starting point, never the finish line.

## What "Premium" Means

1. **Animated numbers** — Financial values should animate on change (counting up/down, morphing digits). Never snap from one number to another.
2. **Micro-interactions everywhere** — Hover states, focus states, click feedback, loading transitions. Every interactive element must respond to the user with subtle motion.
3. **Layered depth** — Glassmorphism, backdrop blur, subtle shadows, gradient overlays, and parallax. Flat cards with a border are not acceptable.
4. **Custom data visualization** — Charts must go beyond default Recharts styling. Custom tooltips, animated entries, gradient fills, glow effects, branded color palettes. No default gray grid lines.
5. **Smooth page transitions** — Every route change, tab switch, and content swap must have a choreographed animation. No hard cuts.
6. **Staggered reveals** — Lists, grids, and card groups appear with cascading entrance animations. Never all at once.
7. **Skeleton loading** — Every data-dependent section shows a shimmer/skeleton state while loading. No blank screens or raw spinners.
8. **Typography hierarchy** — Playfair Display for headings creates editorial authority. Inter for data creates precision. Mix weights and sizes deliberately.
9. **Color with purpose** — Use the theme engine's full palette. Accent colors for CTAs, muted tones for secondary info, gradients for visual anchors.
10. **Spatial rhythm** — Consistent spacing, alignment, and proportions. White space is a design tool, not wasted space.

## Banned Patterns (Generic AI Look)

- Plain white cards with thin gray borders
- Default browser form inputs without custom styling
- Static number displays (no animation on value changes)
- Hard page transitions (no animation between routes)
- Default Recharts appearance (gray grid, default tooltips, no gradients)
- Lists that appear all at once (no stagger)
- Loading spinners without skeleton context
- Buttons without hover/press states beyond color change
- Tables without row hover effects or visual hierarchy
- Monochrome interfaces without accent colors

## Premium Libraries to Leverage

Already installed:
- **Framer Motion** — Page transitions, layout animations, gesture interactions, AnimatePresence
- **Three.js / React Three Fiber** — 3D backgrounds, particle effects, ambient scenes
- **Recharts** — With custom styling: gradient fills, animated entries, custom tooltips
- **Embla Carousel** — Smooth carousel transitions
- **Tailwind CSS** — With custom animations, gradients, backdrop-filter

Consider adding when needed:
- **@number-flow/react** — Animated number transitions (morphing digits for financial values)
- **auto-animate** — Drop-in animation for list/grid additions/removals
- **react-countup** — Smooth number counting animations
- **lottie-react** — Vector animations for empty states, loading, celebrations
- **GSAP** — Complex timeline animations for premium page entrances

## Verification

On any UI review or audit:
1. Does this page look like it cost $50K+ to design? If not, it needs work.
2. Are numbers animated or static? Static = violation.
3. Do cards have depth (blur, shadow, gradient) or are they flat? Flat = violation.
4. Do page transitions feel choreographed or jarring? Jarring = violation.
5. Do lists stagger in or appear all at once? All at once = violation.
6. Are loading states skeleton-based or spinner-only? Spinner-only = violation.
