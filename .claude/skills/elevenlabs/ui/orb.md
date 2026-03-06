# Orb Component

3D animated orb with audio reactivity and agent state visualization. Built on Three.js via `@react-three/fiber`.

## Install

```bash
npx @elevenlabs/cli@latest components add orb
```

### Peer Dependencies
- `three` (already in project)
- `@react-three/fiber` (already in project)
- `@react-three/drei` (already in project)

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `colors` | `[string, string]` | `["#CADCFC", "#A0B9D1"]` | Gradient colors for orb surface |
| `agentState` | `"idle" \| "listening" \| "talking"` | — | Controls animation intensity |
| `getInputVolume` | `() => number` | — | Returns normalized mic input volume (0–1) for reactive animation |
| `getOutputVolume` | `() => number` | — | Returns normalized output volume (0–1) for reactive animation |
| `seed` | `number` | Random | Consistent animation pattern |
| `height` | `number` | `200` | Height in px |
| `width` | `number` | `200` | Width in px |

## Usage

### Basic
```tsx
import { Orb } from "@/components/ui/elevenlabs/orb";

<Orb colors={["#9FBCA4", "#257D41"]} agentState="idle" />
```

### With Conversation Hook
```tsx
import { useConversation } from "@elevenlabs/react";
import { Orb } from "@/components/ui/elevenlabs/orb";

function MarcelaOrb() {
  const conversation = useConversation();
  const agentState = conversation.isSpeaking
    ? "talking"
    : conversation.status === "connected"
    ? "listening"
    : "idle";

  return (
    <Orb
      colors={["#9FBCA4", "#257D41"]}
      agentState={agentState}
      height={200}
      width={200}
    />
  );
}
```

### Marcela Theme Colors
```tsx
<Orb colors={["#9FBCA4", "#257D41"]} />
```

## Animation States

| State | Behavior |
|-------|----------|
| `idle` | Gentle floating, slow color shift |
| `listening` | Subtle pulsing, reactive to mic input |
| `talking` | Active morphing, audio-reactive amplitude |

## Implementation Notes

- Uses `@react-three/fiber` Canvas internally — avoid nesting inside another Canvas
- GPU-accelerated via WebGL shaders
- Responds to audio amplitude when connected to `useConversation`
- The `seed` prop ensures the same organic shape across renders
- Wrap in a container with explicit dimensions to prevent layout shift

## Vite Adaptation

If installed via CLI and moved to Vite project:
1. Copy source to `client/src/components/ui/elevenlabs/orb.tsx`
2. Three.js deps are already installed in this project
3. Fix any `@/` imports to match Vite path aliases
4. No SSR concerns in Vite (unlike Next.js)
