# Visual Effects Components

Decorative components for animated text and visual displays.

## Shimmering Text

Animated text with gradient shimmer effects and viewport-triggered animations using Motion (framer-motion).

### Install

```bash
npx @elevenlabs/cli@latest components add shimmering-text
```

### Peer Dependencies
- `framer-motion` (already in project)

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | `string` | — | Text to display with shimmer effect |
| `duration` | `number` | `2` | Shimmer animation duration in seconds |
| `color` | `string` | `#6B7280` | Base text color |
| `shimmerColor` | `string` | `#3B82F6` | Shimmer highlight color |
| `startOnView` | `boolean` | `false` | Start animation when scrolled into view |
| `once` | `boolean` | `false` | Play animation only once |
| `repeat` | `boolean` | `false` | Repeat animation continuously |
| `repeatDelay` | `number` | `0` | Delay between repeats in seconds |

### Usage

```tsx
import { ShimmeringText } from "@/components/ui/elevenlabs/shimmering-text";

<ShimmeringText
  text="Welcome to Hospitality Business Group"
  duration={3}
  color="#FFF9F5"
  shimmerColor="#9FBCA4"
  repeat
  repeatDelay={2}
/>

<ShimmeringText
  text="AI-Powered Investment Analysis"
  startOnView
  once
  color="#FFF9F5"
  shimmerColor="#257D41"
/>
```

### Marcela Use Cases
- Landing page hero text
- Loading state messages ("Marcela is thinking...")
- Feature highlights with viewport-triggered animation

## Matrix

Retro dot-matrix display with circular cells and smooth animations. Useful for status indicators, audio visualizations, and decorative displays.

### Install

```bash
npx @elevenlabs/cli@latest components add matrix
```

### Peer Dependencies
None.

### Usage

```tsx
import { Matrix } from "@/components/ui/elevenlabs/matrix";

<Matrix />
```

### Marcela Use Cases
- Audio visualization alternative to waveform
- Decorative background for voice interface
- Status indicator display

## Vite Adaptation

1. `shimmering-text`: framer-motion already installed; copy source, fix imports
2. `matrix`: no extra deps; copy source, fix imports
