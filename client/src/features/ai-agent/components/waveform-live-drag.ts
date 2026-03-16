"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export interface LiveDragConfig {
  active: boolean
  barWidth: number
  barGap: number
  enableAudioPlayback: boolean
  playbackRate: number
  historyRef: React.MutableRefObject<number[]>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  audioContextRef: React.MutableRefObject<AudioContext | null>
  audioBufferRef: React.MutableRefObject<AudioBuffer | null>
  sourceNodeRef: React.MutableRefObject<AudioBufferSourceNode | null>
  scrubSourceRef: React.MutableRefObject<AudioBufferSourceNode | null>
  dragOffset: number
  setDragOffset: (offset: number) => void
}

export function useLiveDragInteraction(config: LiveDragConfig) {
  const {
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
  } = config

  const [isDragging, setIsDragging] = useState(false)
  const [playbackPosition, setPlaybackPosition] = useState<number | null>(null)
  const dragStartXRef = useRef<number>(0)
  const dragStartOffsetRef = useRef<number>(0)
  const playbackStartTimeRef = useRef<number>(0)

  const playScrubSound = useCallback(
    (position: number, direction: number) => {
      if (
        !enableAudioPlayback ||
        !audioBufferRef.current ||
        !audioContextRef.current
      )
        return

      if (scrubSourceRef.current) {
        try {
          scrubSourceRef.current.stop()
        } catch { /* ignore: stop() throws if already stopped */ }
      }

      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBufferRef.current

      const speed = Math.abs(direction)
      const rate =
        direction > 0
          ? Math.min(3, 1 + speed * 0.1)
          : Math.max(-3, -1 - speed * 0.1)

      source.playbackRate.value = rate

      const filter = audioContextRef.current.createBiquadFilter()
      filter.type = "lowpass"
      filter.frequency.value = Math.max(200, 2000 - speed * 100)

      source.connect(filter)
      filter.connect(audioContextRef.current.destination)

      const startTime = Math.max(
        0,
        Math.min(position, audioBufferRef.current.duration - 0.1)
      )
      source.start(0, startTime, 0.1)

      scrubSourceRef.current = source
    },
    [enableAudioPlayback, audioBufferRef, audioContextRef, scrubSourceRef]
  )

  const playFromPosition = useCallback(
    (position: number) => {
      if (
        !enableAudioPlayback ||
        !audioBufferRef.current ||
        !audioContextRef.current
      )
        return

      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop()
        } catch { /* ignore: stop() throws if already stopped */ }
      }

      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBufferRef.current
      source.playbackRate.value = playbackRate
      source.connect(audioContextRef.current.destination)

      const startTime = Math.max(
        0,
        Math.min(position, audioBufferRef.current.duration)
      )
      source.start(0, startTime)
      sourceNodeRef.current = source

      playbackStartTimeRef.current =
        audioContextRef.current.currentTime - startTime
      setPlaybackPosition(startTime)

      source.onended = () => {
        setPlaybackPosition(null)
      }
    },
    [enableAudioPlayback, playbackRate, audioBufferRef, audioContextRef, sourceNodeRef]
  )

  useEffect(() => {
    if (playbackPosition === null || !audioBufferRef.current) return

    let animationId: number
    const updatePlaybackVisual = () => {
      if (
        audioContextRef.current &&
        sourceNodeRef.current &&
        audioBufferRef.current
      ) {
        const elapsed =
          audioContextRef.current.currentTime - playbackStartTimeRef.current
        const currentPos = playbackPosition + elapsed * playbackRate

        if (currentPos < audioBufferRef.current.duration) {
          const progressRatio = currentPos / audioBufferRef.current.duration
          const currentBarIndex = Math.floor(
            progressRatio * historyRef.current.length
          )
          const step = barWidth + barGap

          const containerWidth =
            canvasRef.current?.parentElement?.getBoundingClientRect().width || 0
          const viewBars = Math.floor(containerWidth / step)
          const targetOffset =
            -(currentBarIndex - (historyRef.current.length - viewBars)) * step
          const clampedOffset = Math.max(
            -(historyRef.current.length - viewBars) * step,
            Math.min(0, targetOffset)
          )

          setDragOffset?.(clampedOffset)
          animationId = requestAnimationFrame(updatePlaybackVisual)
        } else {
          setPlaybackPosition(null)
          const step = barWidth + barGap
          const containerWidth =
            canvasRef.current?.parentElement?.getBoundingClientRect().width || 0
          const viewBars = Math.floor(containerWidth / step)
          setDragOffset?.(-(historyRef.current.length - viewBars) * step)
        }
      }
    }

    animationId = requestAnimationFrame(updatePlaybackVisual)

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [
    playbackPosition,
    playbackRate,
    barWidth,
    barGap,
    setDragOffset,
    historyRef,
    audioContextRef,
    sourceNodeRef,
    audioBufferRef,
    canvasRef,
  ])

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (active || historyRef.current.length === 0) return

    e.preventDefault()
    setIsDragging(true)
    dragStartXRef.current = e.clientX
    dragStartOffsetRef.current = dragOffset
  }

  useEffect(() => {
    if (!isDragging) return

    let lastScrubTime = 0
    let lastMouseX = dragStartXRef.current
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartXRef.current
      const newOffset = dragStartOffsetRef.current - deltaX * 0.5

      const step = barWidth + barGap
      const maxBars = historyRef.current.length
      const viewWidth = canvasRef.current?.getBoundingClientRect().width || 0
      const viewBars = Math.floor(viewWidth / step)

      const maxOffset = Math.max(0, (maxBars - viewBars) * step)
      const minOffset = 0
      const clampedOffset = Math.max(minOffset, Math.min(maxOffset, newOffset))

      setDragOffset?.(clampedOffset)

      const now = Date.now()
      if (
        enableAudioPlayback &&
        audioBufferRef.current &&
        now - lastScrubTime > 50
      ) {
        lastScrubTime = now
        const offsetBars = Math.floor(clampedOffset / step)
        const rightmostBarIndex = Math.max(
          0,
          Math.min(maxBars - 1, maxBars - 1 - offsetBars)
        )
        const audioPosition =
          (rightmostBarIndex / maxBars) * audioBufferRef.current.duration
        const direction = e.clientX - lastMouseX
        lastMouseX = e.clientX
        playScrubSound(
          Math.max(
            0,
            Math.min(audioBufferRef.current.duration - 0.1, audioPosition)
          ),
          direction
        )
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)

      if (enableAudioPlayback && audioBufferRef.current) {
        const step = barWidth + barGap
        const maxBars = historyRef.current.length
        const offsetBars = Math.floor(dragOffset / step)
        const rightmostBarIndex = Math.max(
          0,
          Math.min(maxBars - 1, maxBars - 1 - offsetBars)
        )
        const audioPosition =
          (rightmostBarIndex / maxBars) * audioBufferRef.current.duration
        playFromPosition(
          Math.max(
            0,
            Math.min(audioBufferRef.current.duration - 0.1, audioPosition)
          )
        )
      }

      if (scrubSourceRef.current) {
        try {
          scrubSourceRef.current.stop()
        } catch { /* ignore: stop() throws if already stopped */ }
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [
    isDragging,
    barWidth,
    barGap,
    setDragOffset,
    dragOffset,
    enableAudioPlayback,
    playScrubSound,
    playFromPosition,
    historyRef,
    canvasRef,
    audioBufferRef,
    scrubSourceRef,
  ])

  return {
    isDragging,
    playbackPosition,
    handleMouseDown,
  }
}
