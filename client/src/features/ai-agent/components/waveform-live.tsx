"use client"

import {
  useEffect,
  useRef,
  useState,
} from "react"

import { cn } from "@/lib/utils"
import type { WaveformProps } from "./waveform-base"
import type { ScrollingWaveformProps } from "./waveform-scrolling"
import { useLiveDragInteraction } from "./waveform-live-drag"

export type LiveMicrophoneWaveformProps = Omit<
  ScrollingWaveformProps,
  "barCount"
> & {
  active?: boolean
  fftSize?: number
  smoothingTimeConstant?: number
  sensitivity?: number
  onError?: (error: Error) => void
  historySize?: number
  updateRate?: number
  savedHistoryRef?: React.MutableRefObject<number[]>
  dragOffset?: number
  setDragOffset?: (offset: number) => void
  enableAudioPlayback?: boolean
  playbackRate?: number
}

export const LiveMicrophoneWaveform = ({
  active = false,
  fftSize = 256,
  smoothingTimeConstant = 0.8,
  sensitivity = 1,
  onError,
  historySize = 150,
  updateRate = 50,
  barWidth = 3,
  barHeight: baseBarHeight = 4,
  barGap = 1,
  barRadius = 1,
  barColor,
  fadeEdges = true,
  fadeWidth = 24,
  height = 128,
  className,
  savedHistoryRef,
  dragOffset: externalDragOffset,
  setDragOffset: externalSetDragOffset,
  enableAudioPlayback = true,
  playbackRate = 1,
  ...props
}: LiveMicrophoneWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const internalHistoryRef = useRef<number[]>([])
  const historyRef = savedHistoryRef || internalHistoryRef
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number>(0)
  const lastUpdateRef = useRef<number>(0)
  const [internalDragOffset, setInternalDragOffset] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const scrubSourceRef = useRef<AudioBufferSourceNode | null>(null)

  const dragOffset = externalDragOffset ?? internalDragOffset
  const setDragOffset = externalSetDragOffset ?? setInternalDragOffset

  const { isDragging, playbackPosition, handleMouseDown } = useLiveDragInteraction({
    active,
    barWidth,
    barGap,
    enableAudioPlayback,
    playbackRate,
    historyRef,
    canvasRef,
    audioContextRef,
    audioBufferRef,
    sourceNodeRef,
    scrubSourceRef,
    dragOffset,
    setDragOffset,
  })

  const heightStyle = typeof height === "number" ? `${height}px` : height

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`

      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.scale(dpr, dpr)
      }
    })

    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    if (!active) {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (enableAudioPlayback && audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        })
        processAudioBlob(audioBlob)
      }
      return
    }

    setDragOffset?.(0)
    historyRef.current = []
    audioChunksRef.current = []
    audioBufferRef.current = null

    const setupMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        })
        streamRef.current = stream

        const audioContext = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)()
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = fftSize
        analyser.smoothingTimeConstant = smoothingTimeConstant

        const source = audioContext.createMediaStreamSource(stream)
        source.connect(analyser)

        audioContextRef.current = audioContext
        analyserRef.current = analyser

        if (enableAudioPlayback) {
          const mediaRecorder = new MediaRecorder(stream)
          mediaRecorderRef.current = mediaRecorder

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data)
            }
          }

          mediaRecorder.start(100)
        }
      } catch (error) {
        onError?.(error as Error)
      }
    }

    setupMicrophone()

    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop()
      }
      if (scrubSourceRef.current) {
        scrubSourceRef.current.stop()
      }
    }
  }, [
    active,
    fftSize,
    smoothingTimeConstant,
    onError,
    setDragOffset,
    enableAudioPlayback,
    historyRef,
  ])

  const processAudioBlob = async (blob: Blob) => {
    try {
      const arrayBuffer = await blob.arrayBuffer()
      if (audioContextRef.current) {
        const audioBuffer =
          await audioContextRef.current.decodeAudioData(arrayBuffer)
        audioBufferRef.current = audioBuffer
      }
    } catch (error) {
      console.error("Error processing audio:", error)
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (!active && historyRef.current.length === 0 && playbackPosition === null)
      return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const animate = (currentTime: number) => {
      if (active && currentTime - lastUpdateRef.current > updateRate) {
        lastUpdateRef.current = currentTime

        if (analyserRef.current) {
          const dataArray = new Uint8Array(
            analyserRef.current.frequencyBinCount
          )
          analyserRef.current.getByteFrequencyData(dataArray)

          let sum = 0
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i]
          }
          const average = (sum / dataArray.length / 255) * sensitivity

          historyRef.current.push(Math.min(1, Math.max(0.05, average)))

          if (historyRef.current.length > historySize) {
            historyRef.current.shift()
          }
        }
      }

      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)

      const computedBarColor =
        barColor ||
        getComputedStyle(canvas).getPropertyValue("--foreground") ||
        "#000"

      const step = barWidth + barGap
      const barCount = Math.floor(rect.width / step)
      const centerY = rect.height / 2

      const dataToRender = historyRef.current

      if (dataToRender.length > 0) {
        const offsetInBars = Math.floor(dragOffset / step)

        for (let i = 0; i < barCount; i++) {
          let dataIndex

          if (active) {
            dataIndex = dataToRender.length - 1 - i
          } else {
            dataIndex = Math.max(
              0,
              Math.min(
                dataToRender.length - 1,
                dataToRender.length - 1 - i - Math.floor(offsetInBars)
              )
            )
          }

          if (dataIndex >= 0 && dataIndex < dataToRender.length) {
            const value = dataToRender[dataIndex]
            if (value !== undefined) {
              const x = rect.width - (i + 1) * step
              const barHeight = Math.max(
                baseBarHeight,
                value * rect.height * 0.7
              )
              const y = centerY - barHeight / 2

              ctx.fillStyle = computedBarColor
              ctx.globalAlpha = 0.3 + value * 0.7

              if (barRadius > 0) {
                ctx.beginPath()
                ctx.roundRect(x, y, barWidth, barHeight, barRadius)
                ctx.fill()
              } else {
                ctx.fillRect(x, y, barWidth, barHeight)
              }
            }
          }
        }
      }

      if (fadeEdges && fadeWidth > 0) {
        const gradient = ctx.createLinearGradient(0, 0, rect.width, 0)
        const fadePercent = Math.min(0.2, fadeWidth / rect.width)

        gradient.addColorStop(0, "rgba(255,255,255,1)")
        gradient.addColorStop(fadePercent, "rgba(255,255,255,0)")
        gradient.addColorStop(1 - fadePercent, "rgba(255,255,255,0)")
        gradient.addColorStop(1, "rgba(255,255,255,1)")

        ctx.globalCompositeOperation = "destination-out"
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, rect.width, rect.height)
        ctx.globalCompositeOperation = "source-over"
      }

      ctx.globalAlpha = 1

      animationRef.current = requestAnimationFrame(animate)
    }

    if (active || historyRef.current.length > 0 || playbackPosition !== null) {
      animationRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [
    active,
    sensitivity,
    updateRate,
    historySize,
    barWidth,
    baseBarHeight,
    barGap,
    barRadius,
    barColor,
    fadeEdges,
    fadeWidth,
    dragOffset,
    playbackPosition,
    historyRef,
  ])

  return (
    <div
      className={cn(
        "relative flex items-center",
        !active && historyRef.current.length > 0 && "cursor-pointer",
        className
      )}
      onMouseDown={handleMouseDown}
      ref={containerRef}
      role={!active && historyRef.current.length > 0 ? "slider" : undefined}
      aria-label={
        !active && historyRef.current.length > 0
          ? "Drag to scrub through recording"
          : undefined
      }
      aria-valuenow={
        !active && historyRef.current.length > 0
          ? Math.abs(dragOffset)
          : undefined
      }
      aria-valuemin={!active && historyRef.current.length > 0 ? 0 : undefined}
      aria-valuemax={
        !active && historyRef.current.length > 0
          ? historyRef.current.length
          : undefined
      }
      tabIndex={!active && historyRef.current.length > 0 ? 0 : undefined}
      style={{ height: heightStyle }}
      {...props}
    >
      <canvas className="block h-full w-full" ref={canvasRef} />
    </div>
  )
}
