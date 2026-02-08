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

| Part   | Style                                                    |
| ------ | -------------------------------------------------------- |
| Track  | `h-1.5 bg-white/20 rounded-full`                        |
| Range  | `bg-[#9FBCA4]` (sage green fill)                         |
| Thumb  | `h-4 w-4 rounded-full bg-[#9FBCA4] border-[#9FBCA4]/50` |
| Focus  | `ring-1 ring-[#9FBCA4]`                                  |

### Props

Standard Radix `Slider` props. Key ones used:

| Prop            | Type         | Description                         |
| --------------- | ------------ | ----------------------------------- |
| `value`         | `number[]`   | Always wrap in array: `[myValue]`   |
| `onValueChange` | `(v) => void`| Callback receives array of numbers  |
| `min`           | `number`     | Minimum bound                       |
| `max`           | `number`     | Maximum bound                       |
| `step`          | `number`     | Step increment                      |

## EditableValue Component

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

1. **Display mode**: Sage green monospace text with hover underline + cursor pointer
2. **Click**: Switches to inline `<input type="number">` with value selected
3. **Enter/Blur**: Parses, clamps to min/max, calls `onChange`
4. **Escape**: Cancels edit, reverts to display mode

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

- **PropertyEdit**: ADR, growth rates, occupancy, ramp months, revenue shares, catering, financing terms
- **CompanyAssumptions**: SAFE tranches, management fees, staffing, escalation rates, office lease
- **Settings**: Boutique definition sliders (rooms, ADR, events, acreage), commission rate, debt assumptions
- **SensitivityAnalysis**: Variable adjustment sliders (imported as icon only, not slider component)

## CompanyAssumptions Variant

`CompanyAssumptions.tsx` has its own inline `EditableValue` with different behavior:
- Passes raw decimal values (0.05) and internally handles `×100` for percent display
- Uses `text-[#257D41]` darker green instead of `text-[#9FBCA4]` sage
- Uses `w-24` input with border+background instead of borderless
- **Not yet migrated** to the shared component because its API differs (percent scaling is internal)

When migrating: either update all call sites to pre-scale values, or add a `percentAsDecimal` prop to the shared component.

## Anti-Patterns

1. **Slider without visible value** — Always show the current value
2. **Mismatched min/max/step** between EditableValue and Slider — They must be identical
3. **Inline EditableValue definitions** — Import from `@/components/ui/editable-value`
4. **Raw `<input type="range">`** — Always use the Radix-based `Slider` component
