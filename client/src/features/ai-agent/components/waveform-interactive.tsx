"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

import { cn } from "@/lib/utils"
import { Waveform, type WaveformProps } from "./waveform-base"

export type AudioScrubberProps = WaveformProps & {
  currentTime?: number
  duration?: number
  onSeek?: (time: number) => void
  showHandle?: boolean
}

export const AudioScrubber = ({
  data = [],
  currentTime = 0,
  duration = 100,
  onSeek,
  showHandle = true,
  barWidth = 3,
  barHeight,
  barGap = 1,
  barRadius = 1,
  barColor,
  height = 128,
  className,
  ...props
}: AudioScrubberProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const [localProgress, setLocalProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const waveformData =
    data.length > 0
      ? data
      : Array.from({ length: 100 }, () => 0.2 + Math.random() * 0.6)

  useEffect(() => {
    if (!isDragging && duration > 0) {
      setLocalProgress(currentTime / duration)
    }
  }, [currentTime, duration, isDragging])

  const handleScrub = useCallback(
    (clientX: number) => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
      const progress = x / rect.width
      const newTime = progress * duration

      setLocalProgress(progress)
      onSeek?.(newTime)
    },
    [duration, onSeek]
  )

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
    handleScrub(e.clientX)
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      handleScrub(e.clientX)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, duration, handleScrub])

  const heightStyle = typeof height === "number" ? `${height}px` : height

  return (
    <div
      aria-label="Audio waveform scrubber"
      aria-valuemax={duration}
      aria-valuemin={0}
      aria-valuenow={currentTime}
      className={cn("relative cursor-pointer select-none", className)}
      onMouseDown={handleMouseDown}
      ref={containerRef}
      role="slider"
      style={{ height: heightStyle }}
      tabIndex={0}
      {...props}
    >
      <Waveform
        barColor={barColor}
        barGap={barGap}
        barRadius={barRadius}
        barWidth={barWidth}
        barHeight={barHeight}
        data={waveformData}
        fadeEdges={false}
      />

      <div
        className="bg-primary/20 pointer-events-none absolute inset-y-0 left-0"
        style={{ width: `${localProgress * 100}%` }}
      />

      <div
        className="bg-primary pointer-events-none absolute top-0 bottom-0 w-0.5"
        style={{ left: `${localProgress * 100}%` }}
      />

      {showHandle && (
        <div
          className="border-background bg-primary pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-lg transition-transform hover:scale-110"
          style={{ left: `${localProgress * 100}%` }}
        />
      )}
    </div>
  )
}

export type MicrophoneWaveformProps = WaveformProps & {
  active?: boolean
  processing?: boolean
  fftSize?: number
  smoothingTimeConstant?: number
  sensitivity?: number
  onError?: (error: Error) => void
}

export const MicrophoneWaveform = ({
  active = false,
  processing = false,
  fftSize = 256,
  smoothingTimeConstant = 0.8,
  sensitivity = 1,
  onError,
  ...props
}: MicrophoneWaveformProps) => {
  const [data, setData] = useState<number[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const processingAnimationRef = useRef<number | null>(null)
  const lastActiveDataRef = useRef<number[]>([])
  const transitionProgressRef = useRef(0)

  useEffect(() => {
    if (processing && !active) {
      let time = 0
      transitionProgressRef.current = 0

      const animateProcessing = () => {
        time += 0.03
        transitionProgressRef.current = Math.min(
          1,
          transitionProgressRef.current + 0.02
        )

        const processingData = []
        const barCount = 45

        for (let i = 0; i < barCount; i++) {
          const normalizedPosition = (i - barCount / 2) / (barCount / 2)
          const centerWeight = 1 - Math.abs(normalizedPosition) * 0.4

          const wave1 = Math.sin(time * 1.5 + i * 0.15) * 0.25
          const wave2 = Math.sin(time * 0.8 - i * 0.1) * 0.2
          const wave3 = Math.cos(time * 2 + i * 0.05) * 0.15
          const combinedWave = wave1 + wave2 + wave3
          const processingValue = (0.2 + combinedWave) * centerWeight

          let finalValue = processingValue
          if (
            lastActiveDataRef.current.length > 0 &&
            transitionProgressRef.current < 1
          ) {
            const lastDataIndex = Math.floor(
              (i / barCount) * lastActiveDataRef.current.length
            )
            const lastValue = lastActiveDataRef.current[lastDataIndex] || 0
            finalValue =
              lastValue * (1 - transitionProgressRef.current) +
              processingValue * transitionProgressRef.current
          }

          processingData.push(Math.max(0.05, Math.min(1, finalValue)))
        }

        setData(processingData)
        processingAnimationRef.current =
          requestAnimationFrame(animateProcessing)
      }

      animateProcessing()

      return () => {
        if (processingAnimationRef.current) {
          cancelAnimationFrame(processingAnimationRef.current)
        }
      }
    } else if (!active && !processing) {
      if (data.length > 0) {
        let fadeProgress = 0
        const fadeToIdle = () => {
          fadeProgress += 0.03
          if (fadeProgress < 1) {
            const fadedData = data.map((value) => value * (1 - fadeProgress))
            setData(fadedData)
            requestAnimationFrame(fadeToIdle)
          } else {
            setData([])
          }
        }
        fadeToIdle()
      }
      return
    }
  }, [processing, active])

  useEffect(() => {
    if (!active) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close()
      }
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      return
    }

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

        const dataArray = new Uint8Array(analyser.frequencyBinCount)

        const updateData = () => {
          if (!analyserRef.current || !active) return

          analyserRef.current.getByteFrequencyData(dataArray)

          const startFreq = Math.floor(dataArray.length * 0.05)
          const endFreq = Math.floor(dataArray.length * 0.4)
          const relevantData = dataArray.slice(startFreq, endFreq)

          const halfLength = Math.floor(relevantData.length / 2)
          const normalizedData = []

          for (let i = halfLength - 1; i >= 0; i--) {
            const value = Math.min(1, (relevantData[i] / 255) * sensitivity)
            normalizedData.push(value)
          }

          for (let i = 0; i < halfLength; i++) {
            const value = Math.min(1, (relevantData[i] / 255) * sensitivity)
            normalizedData.push(value)
          }

          setData(normalizedData)
          lastActiveDataRef.current = normalizedData

          animationIdRef.current = requestAnimationFrame(updateData)
        }

        updateData()
      } catch (error) {
        onError?.(error as Error)
      }
    }

    setupMicrophone()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close()
      }
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [active, fftSize, smoothingTimeConstant, sensitivity, onError])

  return <Waveform data={data} {...props} />
}
