import { useEffect, useRef, useMemo, useState, useCallback } from "react"

export type AgentState = null | "thinking" | "listening" | "talking"

const ORB_DEFAULT_COLOR_1 = "#CADCFC";
const ORB_DEFAULT_COLOR_2 = "#A0B9D1";

type OrbProps = {
  colors?: [string, string]
  colorsRef?: React.RefObject<[string, string]>
  resizeDebounce?: number
  seed?: number
  agentState?: AgentState
  volumeMode?: "auto" | "manual"
  manualInput?: number
  manualOutput?: number
  inputVolumeRef?: React.RefObject<number>
  outputVolumeRef?: React.RefObject<number>
  getInputVolume?: () => number
  getOutputVolume?: () => number
  className?: string
}

function splitmix32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x9e3779b9) | 0
    let t = a ^ (a >>> 16)
    t = Math.imul(t, 0x21f0aaad)
    t = t ^ (t >>> 15)
    t = Math.imul(t, 0x735a2d97)
    return ((t = t ^ (t >>> 15)) >>> 0) / 4294967296
  }
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace("#", "")
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2]
  const num = parseInt(c, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

function lerpColor(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ]
}

function noise2D(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return n - Math.floor(n)
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  const n00 = noise2D(ix, iy)
  const n10 = noise2D(ix + 1, iy)
  const n01 = noise2D(ix, iy + 1)
  const n11 = noise2D(ix + 1, iy + 1)
  const nx0 = n00 * (1 - sx) + n10 * sx
  const nx1 = n01 * (1 - sx) + n11 * sx
  return nx0 * (1 - sy) + nx1 * sy
}

function CanvasOrb({
  colors,
  colorsRef,
  seed,
  agentState,
  volumeMode,
  manualInput,
  manualOutput,
  inputVolumeRef,
  outputVolumeRef,
  getInputVolume,
  getOutputVolume,
  className,
}: OrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef(0)
  const startRef = useRef(performance.now())

  const stateRef = useRef({
    agentState: agentState ?? null,
    volumeMode: volumeMode ?? "auto",
    curIn: 0,
    curOut: 0,
    animSpeed: 0.1,
    opacity: 0,
    color1: hexToRgb(colors?.[0] ?? ORB_DEFAULT_COLOR_1),
    color2: hexToRgb(colors?.[1] ?? ORB_DEFAULT_COLOR_2),
    targetColor1: hexToRgb(colors?.[0] ?? ORB_DEFAULT_COLOR_1),
    targetColor2: hexToRgb(colors?.[1] ?? ORB_DEFAULT_COLOR_2),
  })

  const random = useMemo(
    () => splitmix32(seed ?? Math.floor(Math.random() * 2 ** 32)),
    [seed]
  )
  const offsets = useMemo(
    () => Array.from({ length: 7 }, () => random() * Math.PI * 2),
    [random]
  )

  useEffect(() => {
    stateRef.current.agentState = agentState ?? null
  }, [agentState])

  useEffect(() => {
    stateRef.current.volumeMode = volumeMode ?? "auto"
  }, [volumeMode])

  useEffect(() => {
    stateRef.current.targetColor1 = hexToRgb(colors?.[0] ?? "#CADCFC")
    stateRef.current.targetColor2 = hexToRgb(colors?.[1] ?? "#A0B9D1")
  }, [colors])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const cx = w / 2
    const cy = h / 2
    const maxR = Math.min(cx, cy) * 0.95

    const now = performance.now()
    const elapsed = (now - startRef.current) / 1000
    const dt = 1 / 60
    const s = stateRef.current

    const live = colorsRef?.current
    if (live) {
      if (live[0]) s.targetColor1 = hexToRgb(live[0])
      if (live[1]) s.targetColor2 = hexToRgb(live[1])
    }

    s.color1 = lerpColor(s.color1, s.targetColor1, 0.08)
    s.color2 = lerpColor(s.color2, s.targetColor2, 0.08)

    if (s.opacity < 1) s.opacity = Math.min(1, s.opacity + dt * 2)

    let targetIn = 0
    let targetOut = 0.3
    const t = elapsed * 2
    if (s.volumeMode === "manual") {
      targetIn = clamp01(manualInput ?? inputVolumeRef?.current ?? getInputVolume?.() ?? 0)
      targetOut = clamp01(manualOutput ?? outputVolumeRef?.current ?? getOutputVolume?.() ?? 0)
    } else {
      if (s.agentState === null) {
        targetIn = 0
        targetOut = 0.3
      } else if (s.agentState === "listening") {
        targetIn = clamp01(0.55 + Math.sin(t * 3.2) * 0.35)
        targetOut = 0.45
      } else if (s.agentState === "talking") {
        targetIn = clamp01(0.65 + Math.sin(t * 4.8) * 0.22)
        targetOut = clamp01(0.75 + Math.sin(t * 3.6) * 0.22)
      } else {
        const base = 0.38 + 0.07 * Math.sin(t * 0.7)
        const wander = 0.05 * Math.sin(t * 2.1) * Math.sin(t * 0.37 + 1.2)
        targetIn = clamp01(base + wander)
        targetOut = clamp01(0.48 + 0.12 * Math.sin(t * 1.05 + 0.6))
      }
    }

    s.curIn += (targetIn - s.curIn) * 0.2
    s.curOut += (targetOut - s.curOut) * 0.2
    const targetSpeed = 0.1 + (1 - Math.pow(s.curOut - 1, 2)) * 0.9
    s.animSpeed += (targetSpeed - s.animSpeed) * 0.12

    const isDark =
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")

    ctx.clearRect(0, 0, w, h)

    const anim = elapsed * s.animSpeed * 0.5
    const timeVal = elapsed * 0.05

    for (let py = 0; py < h; py += 2) {
      for (let px = 0; px < w; px += 2) {
        const dx = px - cx
        const dy = py - cy
        const radius = Math.sqrt(dx * dx + dy * dy) / maxR
        if (radius > 1.05) continue

        let theta = Math.atan2(dy, dx)
        if (theta < 0) theta += Math.PI * 2

        const normalizedAngle = theta / (Math.PI * 2)
        const flowNoise =
          smoothNoise(normalizedAngle * 5 + anim, radius * 3 - anim * 2) - 0.5
        theta += flowNoise * (0.08 + s.curOut * 0.17)

        let gray = 1.0
        for (let i = 0; i < 7; i++) {
          const center = offsets[i] + 0.5 * Math.sin(timeVal + offsets[i])
          let distTheta = Math.abs(theta - center)
          distTheta = Math.min(
            distTheta,
            Math.abs(theta + Math.PI * 2 - center),
            Math.abs(theta - Math.PI * 2 - center)
          )
          const noiseVal = smoothNoise(center + timeVal * 0.5, 0.5)
          const a = 0.5 + noiseVal * 0.3
          const b = noiseVal * (3.5 - s.curIn)
          const oval = (distTheta * distTheta) / (a * a) + (radius * radius) / (b * b)
          if (oval < 1) {
            const edge = Math.max(0, Math.min(1, (1 - oval) / 0.6))
            const grad = i % 2 === 1
              ? 1 - (distTheta / a + 1) / 2
              : (distTheta / a + 1) / 2
            const flatGrad = 0.5 + (grad - 0.5) * 0.1
            gray = gray * (1 - edge * 0.85) + flatGrad * edge * 0.85
          }
        }

        const ringNoise1 =
          smoothNoise(normalizedAngle * 5 + timeVal, timeVal * 0.1)
        const ringRadius1 = 1.0 + (ringNoise1 - 0.5) * 0.45
        const inputRadius1 = radius + s.curIn * 0.2
        const ringAlpha =
          inputRadius1 >= ringRadius1 ? 0.2 + s.curIn * 0.4 : 0

        gray = 1 - (1 - gray) * (1 - ringAlpha)

        const luminance = isDark ? 1 - gray : gray

        let r: number, g: number, b: number
        if (luminance < 0.33) {
          const lt = luminance * 3
          r = s.color1[0] * lt
          g = s.color1[1] * lt
          b = s.color1[2] * lt
        } else if (luminance < 0.66) {
          const lt = (luminance - 0.33) * 3
          r = s.color1[0] * (1 - lt) + s.color2[0] * lt
          g = s.color1[1] * (1 - lt) + s.color2[1] * lt
          b = s.color1[2] * (1 - lt) + s.color2[2] * lt
        } else {
          const lt = (luminance - 0.66) * 3
          r = s.color2[0] * (1 - lt) + 255 * lt
          g = s.color2[1] * (1 - lt) + 255 * lt
          b = s.color2[2] * (1 - lt) + 255 * lt
        }

        const edgeFade = radius > 0.92 ? Math.max(0, 1 - (radius - 0.92) / 0.08) : 1
        const alpha = s.opacity * edgeFade

        if (alpha > 0.01) {
          ctx.fillStyle = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha})`
          ctx.fillRect(px, py, 2, 2)
        }
      }
    }

    animRef.current = requestAnimationFrame(render)
  }, [colorsRef, manualInput, manualOutput, inputVolumeRef, outputVolumeRef, getInputVolume, getOutputVolume, offsets])

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return
      const rect = container.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio, 2)
      const size = Math.min(rect.width, rect.height)
      canvas.width = size * dpr * 0.5
      canvas.height = size * dpr * 0.5
      canvas.style.width = `${size}px`
      canvas.style.height = `${size}px`
    }
    resize()
    window.addEventListener("resize", resize)
    startRef.current = performance.now()
    animRef.current = requestAnimationFrame(render)
    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [render])

  return (
    <div ref={containerRef} className={className ?? "relative h-full w-full"}>
      <div className="absolute inset-0 flex items-center justify-center">
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

function CSSFallbackOrb({
  colors = [ORB_DEFAULT_COLOR_1, ORB_DEFAULT_COLOR_2] as [string, string],
  className,
}: {
  colors?: [string, string]
  className?: string
}) {
  return (
    <div className={className ?? "relative h-full w-full"}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-32 h-32 rounded-full animate-pulse"
          style={{
            background: `radial-gradient(circle at 40% 40%, ${colors[0]}, ${colors[1]})`,
            boxShadow: `0 0 60px ${colors[0]}40, 0 0 120px ${colors[1]}20`,
          }}
        />
      </div>
    </div>
  )
}

export function Orb({
  colors = [ORB_DEFAULT_COLOR_1, ORB_DEFAULT_COLOR_2] as [string, string],
  colorsRef,
  resizeDebounce = 100,
  seed,
  agentState = null,
  volumeMode = "auto",
  manualInput,
  manualOutput,
  inputVolumeRef,
  outputVolumeRef,
  getInputVolume,
  getOutputVolume,
  className,
}: OrbProps) {
  const [canvasSupported] = useState(() => {
    try {
      const c = document.createElement("canvas")
      return !!c.getContext("2d")
    } catch {
      return false
    }
  })

  if (!canvasSupported) {
    return <CSSFallbackOrb colors={colors} className={className} />
  }

  return (
    <CanvasOrb
      colors={colors}
      colorsRef={colorsRef}
      resizeDebounce={resizeDebounce}
      seed={seed}
      agentState={agentState}
      volumeMode={volumeMode}
      manualInput={manualInput}
      manualOutput={manualOutput}
      inputVolumeRef={inputVolumeRef}
      outputVolumeRef={outputVolumeRef}
      getInputVolume={getInputVolume}
      getOutputVolume={getOutputVolume}
      className={className}
    />
  )
}
