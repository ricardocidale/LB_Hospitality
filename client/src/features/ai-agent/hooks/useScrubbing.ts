import { useCallback, useEffect, useRef, useState } from "react"
import type { useAudioPlayer } from "@/features/ai-agent/components/audio-player"

interface UseScrubOpts {
  playerApiRef: React.RefObject<ReturnType<typeof useAudioPlayer>>
  waveformOffset: React.MutableRefObject<number>
  waveformElementRef: React.RefObject<HTMLDivElement | null>
  containerWidthRef: React.MutableRefObject<number>
  totalBarsRef: React.MutableRefObject<number>
  isPlayingRef: React.MutableRefObject<boolean>
  playScratchSound: (position: number, speed: number) => void
  stopScratchSound: () => void
}

export function useScrubbing(opts: UseScrubOpts) {
  const {
    playerApiRef, waveformOffset, waveformElementRef,
    containerWidthRef, totalBarsRef, isPlayingRef,
    playScratchSound, stopScratchSound,
  } = opts

  const [isScrubbing, setIsScrubbing] = useState(false)
  const [isMomentumActive, setIsMomentumActive] = useState(false)

  useEffect(() => {
    if (!isScrubbing && !isMomentumActive && playerApiRef.current.ref.current) {
      let animationId: number
      const updatePosition = () => {
        const audioEl = playerApiRef.current.ref.current
        if (audioEl && !isScrubbing && !isMomentumActive && waveformElementRef.current) {
          const duration = audioEl.duration
          const currentTime = audioEl.currentTime
          if (!isNaN(duration) && duration > 0) {
            const position = currentTime / duration
            const containerWidth = containerWidthRef.current
            const totalWidth = totalBarsRef.current * 5
            const newOffset = containerWidth - position * totalWidth
            waveformOffset.current = newOffset
            waveformElementRef.current.style.transform = `translateX(${newOffset}px)`
          }
        }
        animationId = requestAnimationFrame(updatePosition)
      }
      animationId = requestAnimationFrame(updatePosition)
      return () => cancelAnimationFrame(animationId)
    }
  }, [isScrubbing, isMomentumActive])

  const runMomentum = useCallback((
    velocity: number,
    containerWidth: number,
    totalWidth: number,
    wasPlaying: boolean,
  ) => {
    setIsMomentumActive(true)
    let momentumOffset = waveformOffset.current
    let currentVelocity = velocity * 15
    const friction = 0.92
    const minVelocity = 0.5
    let lastScratchFrame = 0
    const scratchFrameInterval = 50

    const animateMomentum = () => {
      if (Math.abs(currentVelocity) > minVelocity) {
        momentumOffset += currentVelocity
        currentVelocity *= friction
        const minOffset = containerWidth - totalWidth
        const maxOffset = containerWidth
        const clampedOffset = Math.max(minOffset, Math.min(maxOffset, momentumOffset))
        if (clampedOffset !== momentumOffset) currentVelocity = 0
        momentumOffset = clampedOffset
        waveformOffset.current = clampedOffset
        if (waveformElementRef.current) {
          waveformElementRef.current.style.transform = `translateX(${clampedOffset}px)`
        }
        const position = Math.max(0, Math.min(1, (containerWidth - clampedOffset) / totalWidth))
        const audioEl = playerApiRef.current.ref.current
        if (audioEl && !isNaN(audioEl.duration)) {
          audioEl.currentTime = position * audioEl.duration
        }
        const now = Date.now()
        if (now - lastScratchFrame >= scratchFrameInterval) {
          const speed = Math.min(2.5, Math.abs(currentVelocity) / 10)
          if (speed > 0.1) playScratchSound(position, speed)
          lastScratchFrame = now
        }
        requestAnimationFrame(animateMomentum)
      } else {
        stopScratchSound()
        setIsMomentumActive(false)
        if (wasPlaying) {
          setTimeout(() => playerApiRef.current.play(), 10)
        }
      }
    }
    requestAnimationFrame(animateMomentum)
  }, [playScratchSound, stopScratchSound])

  const handleScrubStart = useCallback((
    startClientX: number,
    rectLeft: number,
    rectWidth: number,
    getClientX: (e: any) => number,
    addMoveListener: (handler: (e: any) => void) => void,
    addEndListener: (handler: () => void) => void,
    removeMoveListener: (handler: (e: any) => void) => void,
    removeEndListener: (handler: () => void) => void,
  ) => {
    setIsScrubbing(true)
    const wasPlaying = isPlayingRef.current
    if (isPlayingRef.current) playerApiRef.current.pause()

    const containerWidth = rectWidth
    containerWidthRef.current = containerWidth
    const totalWidth = totalBarsRef.current * 5
    const currentOffset = waveformOffset.current
    let lastX = startClientX
    let lastScratchTime = 0
    const scratchThrottle = 10
    let velocity = 0
    let lastTime = Date.now()
    let lastClientX = startClientX

    const handleMove = (e: any) => {
      const clientX = getClientX(e)
      const deltaX = clientX - startClientX
      const newOffset = currentOffset + deltaX
      const minOffset = containerWidth - totalWidth
      const maxOffset = containerWidth
      const clampedOffset = Math.max(minOffset, Math.min(maxOffset, newOffset))
      waveformOffset.current = clampedOffset
      if (waveformElementRef.current) {
        waveformElementRef.current.style.transform = `translateX(${clampedOffset}px)`
      }
      const position = Math.max(0, Math.min(1, (containerWidth - clampedOffset) / totalWidth))
      const audioEl = playerApiRef.current.ref.current
      if (audioEl && !isNaN(audioEl.duration)) {
        audioEl.currentTime = position * audioEl.duration
      }
      const now = Date.now()
      const moveDelta = clientX - lastX
      const timeDelta = now - lastTime
      if (timeDelta > 0) {
        const instantVelocity = (clientX - lastClientX) / timeDelta
        velocity = velocity * 0.6 + instantVelocity * 0.4
      }
      lastTime = now
      lastClientX = clientX
      if (Math.abs(moveDelta) > 0) {
        if (now - lastScratchTime >= scratchThrottle) {
          const speed = Math.min(3, Math.abs(moveDelta) / 3)
          playScratchSound(position, speed)
          lastScratchTime = now
        }
      }
      lastX = clientX
    }

    const handleEnd = () => {
      setIsScrubbing(false)
      stopScratchSound()
      if (Math.abs(velocity) > 0.1) {
        runMomentum(velocity, containerWidth, totalWidth, wasPlaying)
      } else {
        if (wasPlaying) playerApiRef.current.play()
      }
      removeMoveListener(handleMove)
      removeEndListener(handleEnd)
    }

    addMoveListener(handleMove)
    addEndListener(handleEnd)
  }, [runMomentum, playScratchSound, stopScratchSound])

  const onTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    handleScrubStart(
      e.touches[0].clientX, rect.left, rect.width,
      (ev: TouchEvent) => ev.touches[0].clientX,
      (handler) => document.addEventListener("touchmove", handler),
      (handler) => document.addEventListener("touchend", handler),
      (handler) => document.removeEventListener("touchmove", handler),
      (handler) => document.removeEventListener("touchend", handler),
    )
  }, [handleScrubStart])

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    handleScrubStart(
      e.clientX, rect.left, rect.width,
      (ev: MouseEvent) => ev.clientX,
      (handler) => document.addEventListener("mousemove", handler),
      (handler) => document.addEventListener("mouseup", handler),
      (handler) => document.removeEventListener("mousemove", handler),
      (handler) => document.removeEventListener("mouseup", handler),
    )
  }, [handleScrubStart])

  return { isScrubbing, isMomentumActive, onTouchStart, onMouseDown }
}
