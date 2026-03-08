
import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"

import { cn } from "@/lib/utils"

export interface AudioAnalyserOptions {
  fftSize?: number
  smoothingTimeConstant?: number
  minDecibels?: number
  maxDecibels?: number
}

function createAudioAnalyser(
  mediaStream: MediaStream,
  options: AudioAnalyserOptions = {}
) {
  const audioContext = new (window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext)()
  const source = audioContext.createMediaStreamSource(mediaStream)
  const analyser = audioContext.createAnalyser()

  if (options.fftSize) analyser.fftSize = options.fftSize
  if (options.smoothingTimeConstant !== undefined)
    analyser.smoothingTimeConstant = options.smoothingTimeConstant
  if (options.minDecibels !== undefined) analyser.minDecibels = options.minDecibels
  if (options.maxDecibels !== undefined) analyser.maxDecibels = options.maxDecibels

  source.connect(analyser)
  return { analyser, audioContext, cleanup: () => { source.disconnect(); audioContext.close() } }
}

export function useAudioVolume(
  mediaStream?: MediaStream | null,
  options: AudioAnalyserOptions = { fftSize: 32, smoothingTimeConstant: 0 }
) {
  const [volume, setVolume] = useState(0)
  const volumeRef = useRef(0)
  const frameId = useRef<number | undefined>(undefined)
  const memoizedOptions = useMemo(
    () => options,
    [options.fftSize, options.smoothingTimeConstant, options.minDecibels, options.maxDecibels]
  )

  useEffect(() => {
    if (!mediaStream) { setVolume(0); volumeRef.current = 0; return }
    const { analyser, cleanup } = createAudioAnalyser(mediaStream, memoizedOptions)
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    let lastUpdate = 0

    const updateVolume = (timestamp: number) => {
      if (timestamp - lastUpdate >= 1000 / 30) {
        analyser.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i] * dataArray[i]
        const newVolume = Math.sqrt(sum / dataArray.length) / 255
        if (Math.abs(newVolume - volumeRef.current) > 0.01) {
          volumeRef.current = newVolume
          setVolume(newVolume)
        }
        lastUpdate = timestamp
      }
      frameId.current = requestAnimationFrame(updateVolume)
    }
    frameId.current = requestAnimationFrame(updateVolume)
    return () => { cleanup(); if (frameId.current) cancelAnimationFrame(frameId.current) }
  }, [mediaStream, memoizedOptions])

  return volume
}

export interface MultiBandVolumeOptions {
  bands?: number
  loPass?: number
  hiPass?: number
  updateInterval?: number
  analyserOptions?: AudioAnalyserOptions
}

const normalizeDb = (value: number) => {
  if (value === -Infinity) return 0
  return Math.sqrt(1 - (Math.max(-100, Math.min(-10, value)) * -1) / 100)
}

export function useMultibandVolume(
  mediaStream?: MediaStream | null,
  options: MultiBandVolumeOptions = {}
) {
  const opts = useMemo(() => ({
    bands: 5, loPass: 100, hiPass: 600, updateInterval: 32,
    analyserOptions: { fftSize: 2048 }, ...options,
  }), [options.bands, options.loPass, options.hiPass, options.updateInterval,
    options.analyserOptions?.fftSize, options.analyserOptions?.smoothingTimeConstant,
    options.analyserOptions?.minDecibels, options.analyserOptions?.maxDecibels])

  const [frequencyBands, setFrequencyBands] = useState<number[]>(() => new Array(opts.bands).fill(0))
  const bandsRef = useRef<number[]>(new Array(opts.bands).fill(0))
  const frameId = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!mediaStream) {
      const empty = new Array(opts.bands).fill(0)
      setFrequencyBands(empty); bandsRef.current = empty; return
    }
    const { analyser, cleanup } = createAudioAnalyser(mediaStream, opts.analyserOptions)
    const dataArray = new Float32Array(analyser.frequencyBinCount)
    const { loPass, hiPass, bands } = opts
    const chunkSize = Math.ceil((hiPass! - loPass!) / bands!)
    let lastUpdate = 0

    const update = (timestamp: number) => {
      if (timestamp - lastUpdate >= opts.updateInterval!) {
        analyser.getFloatFrequencyData(dataArray)
        const chunks = new Array(bands!)
        for (let i = 0; i < bands!; i++) {
          let sum = 0, count = 0
          const startIdx = loPass! + i * chunkSize
          const endIdx = Math.min(loPass! + (i + 1) * chunkSize, hiPass!)
          for (let j = startIdx; j < endIdx; j++) { sum += normalizeDb(dataArray[j]); count++ }
          chunks[i] = count > 0 ? sum / count : 0
        }
        let hasChanged = false
        for (let i = 0; i < chunks.length; i++) {
          if (Math.abs(chunks[i] - bandsRef.current[i]) > 0.01) { hasChanged = true; break }
        }
        if (hasChanged) { bandsRef.current = chunks; setFrequencyBands(chunks) }
        lastUpdate = timestamp
      }
      frameId.current = requestAnimationFrame(update)
    }
    frameId.current = requestAnimationFrame(update)
    return () => { cleanup(); if (frameId.current) cancelAnimationFrame(frameId.current) }
  }, [mediaStream, opts])

  return frequencyBands
}

type AnimationState = "connecting" | "initializing" | "listening" | "speaking" | "thinking" | undefined

export const useBarAnimator = (state: AnimationState, columns: number, interval: number): number[] => {
  const indexRef = useRef(0)
  const [currentFrame, setCurrentFrame] = useState<number[]>([])
  const animFrameId = useRef<number | null>(null)

  const sequence = useMemo(() => {
    if (state === "thinking" || state === "listening") {
      const center = Math.floor(columns / 2)
      return [[center], [-1]]
    } else if (state === "connecting" || state === "initializing") {
      return Array.from({ length: columns }, (_, x) => [x, columns - 1 - x])
    }
    return [Array.from({ length: columns }, (_, idx) => idx)]
  }, [state, columns])

  useEffect(() => { indexRef.current = 0; setCurrentFrame(sequence[0] || []) }, [sequence])

  useEffect(() => {
    let startTime = performance.now()
    const animate = (time: DOMHighResTimeStamp) => {
      if (time - startTime >= interval) {
        indexRef.current = (indexRef.current + 1) % sequence.length
        setCurrentFrame(sequence[indexRef.current] || [])
        startTime = time
      }
      animFrameId.current = requestAnimationFrame(animate)
    }
    animFrameId.current = requestAnimationFrame(animate)
    return () => { if (animFrameId.current !== null) cancelAnimationFrame(animFrameId.current) }
  }, [interval, sequence])

  return currentFrame
}

export type AgentState = "connecting" | "initializing" | "listening" | "speaking" | "thinking"

export interface BarVisualizerProps extends React.HTMLAttributes<HTMLDivElement> {
  state?: AgentState
  barCount?: number
  mediaStream?: MediaStream | null
  minHeight?: number
  maxHeight?: number
  demo?: boolean
  centerAlign?: boolean
}

const BarVisualizerComponent = React.forwardRef<HTMLDivElement, BarVisualizerProps>(
  ({ state, barCount = 15, mediaStream, minHeight = 20, maxHeight = 100, demo = false, centerAlign = false, className, style, ...props }, ref) => {
    const realVolumeBands = useMultibandVolume(mediaStream, { bands: barCount, loPass: 100, hiPass: 200 })
    const fakeVolumeBandsRef = useRef<number[]>(new Array(barCount).fill(0.2))
    const [fakeVolumeBands, setFakeVolumeBands] = useState<number[]>(() => new Array(barCount).fill(0.2))
    const fakeAnimRef = useRef<number | undefined>(undefined)

    useEffect(() => {
      if (!demo) return
      if (state !== "speaking" && state !== "listening") {
        const bands = new Array(barCount).fill(0.2)
        fakeVolumeBandsRef.current = bands; setFakeVolumeBands(bands); return
      }
      let lastUpdate = 0
      const startTime = Date.now() / 1000
      const update = (timestamp: number) => {
        if (timestamp - lastUpdate >= 50) {
          const time = Date.now() / 1000 - startTime
          const newBands = Array.from({ length: barCount }, (_, i) =>
            Math.max(0.1, Math.min(1, Math.sin(time * 2 + i * 0.5) * 0.3 + 0.5 + Math.random() * 0.2))
          )
          let hasChanged = false
          for (let i = 0; i < barCount; i++) {
            if (Math.abs(newBands[i] - fakeVolumeBandsRef.current[i]) > 0.05) { hasChanged = true; break }
          }
          if (hasChanged) { fakeVolumeBandsRef.current = newBands; setFakeVolumeBands(newBands) }
          lastUpdate = timestamp
        }
        fakeAnimRef.current = requestAnimationFrame(update)
      }
      fakeAnimRef.current = requestAnimationFrame(update)
      return () => { if (fakeAnimRef.current) cancelAnimationFrame(fakeAnimRef.current) }
    }, [demo, state, barCount])

    const volumeBands = useMemo(() => (demo ? fakeVolumeBands : realVolumeBands), [demo, fakeVolumeBands, realVolumeBands])
    const highlightedIndices = useBarAnimator(state, barCount,
      state === "connecting" ? 2000 / barCount : state === "thinking" ? 150 : state === "listening" ? 500 : 1000
    )

    return (
      <div
        ref={ref}
        data-state={state}
        className={cn("relative flex justify-center gap-1.5", centerAlign ? "items-center" : "items-end", "bg-muted h-32 w-full overflow-hidden rounded-lg p-4", className)}
        style={style}
        {...props}
      >
        {volumeBands.map((volume, index) => {
          const heightPct = Math.min(maxHeight, Math.max(minHeight, volume * 100 + 5))
          const isHighlighted = highlightedIndices?.includes(index) ?? false
          return <Bar key={index} heightPct={heightPct} isHighlighted={isHighlighted} state={state} />
        })}
      </div>
    )
  }
)

const Bar = React.memo<{ heightPct: number; isHighlighted: boolean; state?: AgentState }>(
  ({ heightPct, isHighlighted, state }) => (
    <div
      data-highlighted={isHighlighted}
      className={cn(
        "max-w-[12px] min-w-[8px] flex-1 transition-all duration-150 rounded-full",
        "bg-border data-[highlighted=true]:bg-primary",
        state === "speaking" && "bg-primary",
        state === "thinking" && isHighlighted && "animate-pulse"
      )}
      style={{ height: `${heightPct}%`, animationDuration: state === "thinking" ? "300ms" : undefined }}
    />
  )
)
Bar.displayName = "Bar"

const BarVisualizer = React.memo(BarVisualizerComponent, (prev, next) =>
  prev.state === next.state && prev.barCount === next.barCount && prev.mediaStream === next.mediaStream &&
  prev.minHeight === next.minHeight && prev.maxHeight === next.maxHeight && prev.demo === next.demo &&
  prev.centerAlign === next.centerAlign && prev.className === next.className
)
BarVisualizerComponent.displayName = "BarVisualizerComponent"
BarVisualizer.displayName = "BarVisualizer"

export { BarVisualizer }
