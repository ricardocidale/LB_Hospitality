# UI/UX Design System

## Design Philosophy

Swiss Modernist design principles with L+B brand colors. Clean typography, generous whitespace, glass-morphism effects, and data-dense financial tables.

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Primary Sage Green | `#9FBCA4` | Accents, borders, decorative elements |
| Secondary Green | `#257D41` | Chart lines (revenue/NOI), active states |
| Warm Off-White | `#FFF9F5` | Background tint |
| Coral Accent | `#F4795B` | Chart lines (FCFE/secondary), alerts |
| Black | `#000000`, `#0a0a0f` | Text, dark backgrounds |
| Dark Blue-Gray Gradient | `#2d4a5e → #3d5a6a → #3a5a5e` | Navigation, dark cards, buttons |

## Page Themes

### Login Page
- Near-black (`#0a0a0f`) background
- Centered glass dialog card
- Subtle sage green blur orbs for depth
- Swiss Modernist typography

### Assumption Pages (Light Theme)
- `bg-white/80 backdrop-blur-xl` cards
- Sage green accent borders (`border-[#9FBCA4]/20`)
- Gray text for labels, dark gray for values
- White input backgrounds
- Decorative blur orbs in sage green

### Main App Pages (Dark Glass Theme)
- Dark blue-gray gradient background cards
- Off-white text (`text-white/90`)
- Semi-transparent white input backgrounds (`bg-white/10`)
- Glass morphism with backdrop blur

### Financial Statement Tables (Light Theme)
- White/gray-50/gray-100 backgrounds
- Dark gray text for readability
- Alternating row colors for data density

## Component Standards

### PageHeader
Standardized header component used on all pages:
- Fixed minimum height
- `text-3xl` serif title (Playfair Display)
- `text-sm` subtitle
- Dark glass variant (`variant="dark"`)
- Optional back link and action buttons

### Buttons

**Action buttons on dark backgrounds** (most common):
```tsx
<GlassButton variant="primary">Save Changes</GlassButton>
```
- Dark glass gradient (`#2d4a5e → #3d5a6a → #3a5a5e`)
- White text
- Top shine line effect
- Sage green glow on hover
- **MUST** use `GlassButton variant="primary"` - never raw `<button>` with ad-hoc classes

**Save buttons** (convenience wrapper):
```tsx
<SaveButton onClick={handleSave} isPending={mutation.isPending} />
```
- Wraps `GlassButton variant="primary"` with save icon and loading state

**Export buttons** (PDF, CSV, Chart):
```tsx
<GlassButton variant="export">Export PDF</GlassButton>
```
- Neutral gray background (`#f5f5f5`)
- Dark gray text, gray border
- Aligned with tabs on financial pages, not in the title block

### Charts

All Recharts visualizations follow these rules:

1. **White background** with `shadow-lg` and gray border
2. **Gradient line colors**:
   - Green: `#257D41 → #34D399` (revenue, NOI)
   - Blue: `#3B82F6 → #60A5FA` (GOP, FCF)
   - Coral: `#F4795B → #FB923C` (FCFE, secondary)
3. **Data point dots** on every line:
   ```tsx
   dot={{ fill: '#257D41', stroke: '#fff', strokeWidth: 2, r: 4 }}
   ```
4. **Light gray dashed grid**: `#E5E7EB`, no vertical lines
5. **Line width**: `strokeWidth={3}`

### Navigation
- Dark glass gradient sidebar
- White text for active items
- Sage green accent for active indicator

## Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Page titles | Playfair Display | 700 | text-3xl |
| Card headings | Playfair Display | 600 | text-lg |
| Labels | Inter | 400 | text-sm |
| Data values | Inter (mono) | 600 | text-sm |
| Body text | Inter | 400 | text-base |

## Admin Page

Consolidated admin functionality in single `/admin` route with tabs:
- **Users** - User management (CRUD)
- **Login Activity** - Authentication audit log
- **Verification** - Financial verification runner and results

## Data Test IDs

All interactive elements must have `data-testid` attributes:
- Interactive: `{action}-{target}` (e.g., `button-submit`, `input-email`)
- Display: `{type}-{content}` (e.g., `text-username`, `status-payment`)
- Dynamic: append unique ID (e.g., `card-property-${id}`)
