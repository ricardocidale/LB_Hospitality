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

## Edge Cases & Boundary Conditions

These UI edge cases MUST be handled with premium quality — not ignored or left with broken states:

### Empty States
- **Zero properties** — Portfolio shows a beautiful empty state with illustration/animation and a prominent CTA to add the first property. Never a blank white page.
- **Zero research data** — Research pages show an inviting "Generate Research" state with context about what AI research provides. Never raw "No data" text.
- **Zero activity logs** — Activity tabs show a friendly "No activity yet" with subtle animation. Never an empty table with headers only.
- **First-time user** — Dashboard with no data shows a guided onboarding experience, not an empty grid of NaN values.

### Loading States
- **Initial page load** — Full skeleton layout matching the page structure (card shapes, line heights, chart placeholders). Never a centered spinner.
- **Tab switching** — Content area shows skeleton of incoming tab immediately while data loads. Never a blank content area.
- **Long-running operations** — AI research generation, verification runs, PDF exports show progress indicators with context ("Analyzing 6 properties...", not just a spinner).
- **Mutation in progress** — Save buttons show loading state with disabled interaction. Never allow double-submit.
- **Image loading** — Property images show a shimmer placeholder with the correct aspect ratio. Never a broken image icon or layout shift.

### Error States
- **API failure** — Show a styled error card with retry button and helpful message. Never a raw error string or console dump.
- **Partial data failure** — If one query fails but others succeed, show what's available with an inline error for the failed section. Never blank the entire page.
- **Network timeout** — Show a connection-aware message ("Reconnecting..." with animation). Never an unhandled promise rejection.
- **Invalid property data** — If calculations produce NaN/Infinity, show "—" with a tooltip explaining the issue. Never display raw NaN.

### Responsive Edge Cases
- **Very long property names** — Text truncates with ellipsis and shows full name on hover tooltip. Never overflows container or breaks layout.
- **Very large numbers** — $999,999,999+ formats with abbreviation (e.g., "$1.0B") in compact contexts, full format in detail views. Never wraps or overflows.
- **Very small screens (320px)** — Cards stack vertically, tables become scrollable, charts reduce to minimum viable size. Never horizontal overflow on the page body.
- **Many properties (10+)** — Grids paginate or virtualize. Tab bars scroll horizontally on mobile. Never clip or hide content without indication.

### Animation Edge Cases
- **Reduced motion preference** — Respect `prefers-reduced-motion` media query. Disable animated numbers, staggered reveals, and page transitions. Maintain static visual quality.
- **Tab rapid-switching** — AnimatePresence must handle rapid tab changes without animation queue buildup or flash of wrong content.
- **Number animation during scroll** — Financial values that animate on mount should only trigger when visible (intersection observer). Never animate off-screen.
- **Chart resize** — Charts must gracefully re-render on window resize without animation jank. Use debounced resize handlers.

### Data Edge Cases in UI
- **$0 values** — Display as "$0" (not blank or hidden). Zero values are meaningful in financial context.
- **Negative values** — Display in red/warning color with parentheses or minus sign. Never same style as positive.
- **Percentage > 100%** — Some metrics can exceed 100% (e.g., revenue growth). Display correctly, don't cap at 100% visually.
- **Very long time horizons** — 20+ year projections should still render readable charts. Compress x-axis labels as needed.
- **Date formatting** — Consistent format across all views (e.g., "Jan 2027", not mixed "1/2027" and "January 2027").
