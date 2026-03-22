import { memo, useCallback, useMemo, useState } from "react"
import { IconVolume, IconVolume1, IconVolume2, IconVolumeX } from "@/components/icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Orb } from "@/features/ai-agent/components/orb"

type AudioState = { isPlaying: boolean; volume: number; isDark: boolean }

export const SpeakerOrb = memo(
  ({
    seed,
    side,
    isDark,
    audioDataRef,
    stateRef,
  }: {
    seed: number
    side: "left" | "right"
    isDark: boolean
    audioDataRef: React.RefObject<number[]>
    stateRef: React.RefObject<AudioState>
  }) => {
    const getInputVolume = useCallback(() => {
      const audioData = audioDataRef?.current || []
      if (
        !stateRef.current.isPlaying ||
        stateRef.current.volume === 0 ||
        audioData.length === 0
      )
        return 0
      const lowFreqEnd = Math.floor(audioData.length * 0.25)
      let sum = 0
      for (let i = 0; i < lowFreqEnd; i++) {
        sum += audioData[i]
      }
      const avgLow = sum / lowFreqEnd
      const amplified = Math.pow(avgLow, 0.5) * 3.5
      return Math.max(0.2, Math.min(1.0, amplified))
    }, [audioDataRef, stateRef])

    const getOutputVolume = useCallback(() => {
      const audioData = audioDataRef?.current || []
      if (
        !stateRef.current.isPlaying ||
        stateRef.current.volume === 0 ||
        audioData.length === 0
      )
        return 0
      const midStart = Math.floor(audioData.length * 0.25)
      const midEnd = Math.floor(audioData.length * 0.75)
      let sum = 0
      for (let i = midStart; i < midEnd; i++) {
        sum += audioData[i]
      }
      const avgMid = sum / (midEnd - midStart)
      const modifier = side === "left" ? 0.9 : 1.1
      const amplified = Math.pow(avgMid, 0.5) * 4.0
      return Math.max(0.25, Math.min(1.0, amplified * modifier))
    }, [side, audioDataRef, stateRef])

    const colors: [string, string] = useMemo(
      () => (isDark ? ["#A0A0A0", "#232323"] : ["#F4F4F4", "#E0E0E0"]),
      [isDark]
    )

    return (
      <Orb
        colors={colors}
        seed={seed}
        volumeMode="manual"
        getInputVolume={getInputVolume}
        getOutputVolume={getOutputVolume}
      />
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.isDark === nextProps.isDark &&
      prevProps.seed === nextProps.seed &&
      prevProps.side === nextProps.side
    )
  }
)

SpeakerOrb.displayName = "SpeakerOrb"

export const SpeakerOrbsSection = memo(
  ({
    isDark,
    audioDataRef,
    stateRef,
  }: {
    isDark: boolean
    audioDataRef: React.RefObject<number[]>
    stateRef: React.RefObject<AudioState>
  }) => {
    return (
      <div className="mt-8 grid grid-cols-2 gap-8">
        <div className="relative aspect-square">
          <div className="bg-muted relative h-full w-full rounded-full p-1 shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
            <div className="bg-background h-full w-full overflow-hidden rounded-full shadow-[inset_0_0_12px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_0_12px_rgba(0,0,0,0.3)]">
              <SpeakerOrb
                key={`left-${isDark}`}
                seed={100}
                side="left"
                isDark={isDark}
                audioDataRef={audioDataRef}
                stateRef={stateRef}
              />
            </div>
          </div>
        </div>

        <div className="relative aspect-square">
          <div className="bg-muted relative h-full w-full rounded-full p-1 shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]">
            <div className="bg-background h-full w-full overflow-hidden rounded-full shadow-[inset_0_0_12px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_0_12px_rgba(0,0,0,0.3)]">
              <SpeakerOrb
                key={`right-${isDark}`}
                seed={2000}
                side="right"
                isDark={isDark}
                audioDataRef={audioDataRef}
                stateRef={stateRef}
              />
            </div>
          </div>
        </div>
      </div>
    )
  },
  (prevProps, nextProps) => {
    return prevProps.isDark === nextProps.isDark
  }
)

SpeakerOrbsSection.displayName = "SpeakerOrbsSection"

export const VolumeSlider = memo(
  ({
    volume,
    setVolume,
  }: {
    volume: number
    setVolume: (value: number | ((prev: number) => number)) => void
  }) => {
    const [isDragging, setIsDragging] = useState(false)

    const getVolumeIcon = () => {
      if (volume === 0) return IconVolumeX
      if (volume <= 0.33) return IconVolume
      if (volume <= 0.66) return IconVolume1
      return IconVolume2
    }

    const VolumeIcon = getVolumeIcon()

    return (
      <div className="flex items-center justify-center gap-4 pt-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setVolume((prev: number) => (prev > 0 ? 0 : 0.7))}
          className="text-muted-foreground hover:text-foreground h-auto w-auto p-1"
        >
          <VolumeIcon
            className={cn(
              "h-4 w-4 transition-all",
              volume === 0 && "text-muted-foreground/50"
            )}
          />
        </Button>
        <div
          className="volume-slider bg-foreground/10 group relative h-1 w-48 cursor-pointer rounded-full"
          onClick={(e) => {
            if (isDragging) return
            const rect = e.currentTarget.getBoundingClientRect()
            const x = Math.max(
              0,
              Math.min(1, (e.clientX - rect.left) / rect.width)
            )
            setVolume(x)
          }}
          onMouseDown={(e) => {
            e.preventDefault()
            setIsDragging(true)
            const sliderRect = e.currentTarget.getBoundingClientRect()

            const initialX = Math.max(
              0,
              Math.min(1, (e.clientX - sliderRect.left) / sliderRect.width)
            )
            setVolume(initialX)

            const handleMove = (e: MouseEvent) => {
              const x = Math.max(
                0,
                Math.min(1, (e.clientX - sliderRect.left) / sliderRect.width)
              )
              setVolume(x)
            }
            const handleUp = () => {
              setIsDragging(false)
              document.removeEventListener("mousemove", handleMove)
              document.removeEventListener("mouseup", handleUp)
            }
            document.addEventListener("mousemove", handleMove)
            document.addEventListener("mouseup", handleUp)
          }}
        >
          <div
            className={cn(
              "bg-primary absolute top-0 left-0 h-full rounded-full",
              !isDragging && "transition-all duration-150"
            )}
            style={{ width: `${volume * 100}%` }}
          />
        </div>
        <span className="text-muted-foreground w-12 text-right font-mono text-xs">
          {Math.round(volume * 100)}%
        </span>
      </div>
    )
  }
)

VolumeSlider.displayName = "VolumeSlider"
