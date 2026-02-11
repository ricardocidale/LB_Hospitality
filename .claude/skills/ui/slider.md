# Slider + EditableValue Pattern

**Components**:
- `Slider` (`client/src/components/ui/slider.tsx`) — Radix-based range slider
- `EditableValue` (`client/src/components/ui/editable-value.tsx`) — Click-to-edit value display

## Golden Rule

**Sliders MUST always be paired with a visible value display.** Use `EditableValue` for user-editable fields, or a `<span className="text-sm font-mono text-primary">` for read-only display. Never show a slider without its current value.

## Imports

```tsx
import { Slider } from "@/components/ui/slider";
import { EditableValue } from "@/components/ui/editable-value";
```

## Slider Component

Built on `@radix-ui/react-slider`. Always single-thumb (one value).

### Styling

| Part   | Style                                                                      |
| ------ | -------------------------------------------------------------------------- |
| Track  | `h-2 bg-gray-200/80 rounded-full shadow-inner`                            |
| Range  | `bg-gradient-to-r from-[#9FBCA4] to-[#85a88b] rounded-full`              |
| Thumb  | `h-5 w-5 rounded-full border-2 border-[#9FBCA4] bg-white shadow-md`      |
| Hover  | `hover:scale-110 hover:shadow-lg`                                          |
| Active | `active:cursor-grabbing active:scale-95` (cursor changes to grab)          |
| Focus  | `ring-2 ring-[#9FBCA4]/50 ring-offset-1`                                  |

### Props

Standard Radix `Slider` props. Key ones used:

| Prop            | Type         | Description                         |
| --------------- | ------------ | ----------------------------------- |
| `value`         | `number[]`   | Always wrap in array: `[myValue]`   |
| `onValueChange` | `(v) => void`| Callback receives array of numbers  |
| `min`           | `number`     | Minimum bound                       |
| `max`           | `number`     | Maximum bound                       |
| `step`          | `number`     | Step increment                      |

## EditableValue Component (Shared)

Displays a formatted value that becomes an inline `<input>` on click. Sage green monospace text.

### Props

| Prop        | Type                                        | Default     | Description                         |
| ----------- | ------------------------------------------- | ----------- | ----------------------------------- |
| `value`     | `number`                                    | —           | Current numeric value               |
| `onChange`   | `(val: number) => void`                     | —           | Called with clamped value on commit  |
| `format`    | `"percent" \| "dollar" \| "months" \| "number"` | `"percent"` | Display format                      |
| `min`       | `number`                                    | `0`         | Minimum allowed value               |
| `max`       | `number`                                    | `100`       | Maximum allowed value               |
| `step`      | `number`                                    | `1`         | Input step                          |
| `className` | `string`                                    | —           | Additional classes                  |

### Display Formats

| Format    | Example Output   |
| --------- | ---------------- |
| `percent` | `65.0%`          |
| `dollar`  | `$1,200`         |
| `months`  | `12 mo`          |
| `number`  | `42`             |

### Behavior

1. **Display mode**: `text-sm font-mono font-semibold text-[#9FBCA4]` with hover underline + cursor pointer
2. **Click**: Switches to inline `<input type="number">` (`w-16`, border-b, sage green text), value auto-selected
3. **Enter/Blur**: Parses, clamps to min/max, calls `onChange`
4. **Escape**: Cancels edit, reverts to display mode

## Layout Rule — Half-Width Maximum

**Sliders must never span the full content width on desktop.** All slider groups must be inside a multi-column grid (`grid lg:grid-cols-2`, `md:grid-cols-2`, etc.) so each slider occupies at most half the screen width. On mobile (`< md` breakpoint), sliders can be full width.

If you have standalone cards with only 1-3 sliders, pair them with another card in a `grid gap-6 lg:grid-cols-2` wrapper rather than leaving them as full-width standalone cards.

## Standard Layout Pattern

The slider + label + value follows a consistent structure across all assumption pages:

### With EditableValue (editable fields)

```tsx
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <Label className="label-text text-gray-700">Starting ADR</Label>
    <EditableValue
      value={draft.startAdr}
      onChange={(val) => handleChange("startAdr", val.toString())}
      format="dollar"
      min={100}
      max={1200}
      step={10}
    />
  </div>
  <Slider
    value={[draft.startAdr]}
    onValueChange={(vals: number[]) => handleChange("startAdr", vals[0].toString())}
    min={100}
    max={1200}
    step={10}
  />
</div>
```

### With Read-Only Value (Settings page style)

```tsx
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <span className="text-sm text-muted-foreground">Min Rooms</span>
    <span className="text-sm font-mono text-primary">{value}</span>
  </div>
  <Slider
    value={[value]}
    onValueChange={(vals) => handleChange("minRooms", vals[0].toString())}
    min={5}
    max={50}
    step={5}
  />
</div>
```

## Percentage Fields — Value Scaling

When a field is stored as a decimal (0.65) but displayed as a percentage (65%):

```tsx
<EditableValue
  value={draft.startOccupancy * 100}
  onChange={(val) => handleChange("startOccupancy", (val / 100).toString())}
  format="percent"
  min={0}
  max={100}
  step={1}
/>
<Slider
  value={[draft.startOccupancy * 100]}
  onValueChange={(vals: number[]) => handleChange("startOccupancy", (vals[0] / 100).toString())}
  min={0}
  max={100}
  step={1}
/>
```

**Critical**: Both `EditableValue` and `Slider` must use identical `min`, `max`, `step`, and value scaling. They share the same `handleChange` callback to stay synchronized.

## Common Step Values

| Field Type              | Step   | Min      | Max        |
| ----------------------- | ------ | -------- | ---------- |
| Percentage rates        | `1`    | `0`      | `100`      |
| Fee rates (%)           | `0.5`  | `0`      | `10`       |
| Dollar (ADR)            | `10`   | `100`    | `1,200`    |
| Dollar (large amounts)  | `25000`| `100,000`| `1,500,000`|
| Dollar (salary)         | `5000` | `40,000` | `200,000`  |
| Months                  | `1`    | `0`      | `36`       |
| Count (rooms, spaces)   | `5`    | `0`      | `200`      |

## Where Used

- **PropertyEdit**: ADR, growth rates, occupancy, ramp months, revenue shares, catering, financing terms — uses shared `EditableValue` from `@/components/ui/editable-value`
- **CompanyAssumptions**: SAFE tranches, management fees, staffing, escalation rates, office lease, sales commission, event/other expense rates, utilities split, compensation — uses its own inline `EditableValue` (see below)
- **Settings**: Boutique definition sliders (rooms, ADR, events, acreage, parking), commission rate, debt assumptions (LTV, interest rate, amortization, closing costs, refi terms) — uses read-only `<span>` values, not `EditableValue`
- **SensitivityAnalysis**: Uses `Sliders` icon from lucide-react only (no actual `Slider` component); variable adjustments are via input fields

## CompanyAssumptions Inline EditableValue

`CompanyAssumptions.tsx` defines its own inline `EditableValue` function (not imported from shared component). Key differences from the shared version:

| Aspect              | Shared (`editable-value.tsx`)        | CompanyAssumptions inline          |
| ------------------- | ------------------------------------ | ---------------------------------- |
| **Color**           | `text-[#9FBCA4]` (sage green)        | `text-[#257D41]` (darker green)   |
| **Input style**     | `w-16` borderless, border-b only     | `w-24` with border+rounded+bg-white|
| **Input type**      | `type="number"`                      | `type="text"` (allows decimal entry)|
| **Percent scaling** | External (caller pre-multiplies ×100)| Internal (component handles ×100)  |
| **Format options**  | `percent\|dollar\|months\|number`    | `percent\|dollar\|number`          |
| **Formatting**      | Simple `toFixed`/`toLocaleString`    | Uses `formatPercent`/`formatMoney` from `@/lib/constants` |

**Not yet migrated** to the shared component because its percent-scaling API differs (percent scaling is internal vs external). When migrating: either update all call sites to pre-scale values, or add a `percentAsDecimal` prop to the shared component.

## Anti-Patterns

1. **Full-width slider on desktop** — Always place sliders in a multi-column grid so they occupy at most half the screen width on desktop
2. **Slider without visible value** — Always show the current value
3. **Mismatched min/max/step** between EditableValue and Slider — They must be identical
4. **Inline EditableValue definitions** — Import from `@/components/ui/editable-value` (except CompanyAssumptions legacy)
5. **Raw `<input type="range">`** — Always use the Radix-based `Slider` component
6. **Missing HelpTooltip** — Every slider field should have a HelpTooltip explaining the parameter
