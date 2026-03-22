

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"

import { IconMusic, IconSkipBack, IconSkipForward, IconSparkles, IconVolume, IconVolume1, IconVolume2, IconVolumeX } from "@/components/icons";

import { cn } from "@/lib/utils"
import {
  AudioPlayerButton,
  AudioPlayerDuration,
  AudioPlayerProgress,
  AudioPlayerProvider,
  AudioPlayerTime,
  useAudioPlayer,
} from "@/features/ai-agent/components/audio-player"
import { useAudioEngine } from "@/features/ai-agent/hooks/useAudioEngine"
import { useScrubbing } from "@/features/ai-agent/hooks/useScrubbing"

const exampleTracks = [
  {
    id: "track-1",
    name: "Aria — The Last Expedition",
    url: "https://storage.googleapis.com/eleven-public-prod/audio/marketing/aria_the_last_expedition.mp3",
    title: "The Last Expedition",
    artist: "Aria · ElevenLabs",
  },
  {
    id: "track-2",
    name: "Bill — The Valley of Echoes",
    url: "https://storage.googleapis.com/eleven-public-prod/audio/marketing/bill_the_valley_of_echoes.mp3",
    title: "The Valley of Echoes",
    artist: "Bill · ElevenLabs",
  },
  {
    id: "track-3",
    name: "Sarah — The Last Expedition",
    url: "https://storage.googleapis.com/eleven-public-prod/audio/marketing/sarah_the_last_expedition.mp3",
    title: "The Last Expedition",
    artist: "Sarah · ElevenLabs",
  },
] as const
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Orb } from "@/features/ai-agent/components/orb"
import { Waveform } from "@/features/ai-agent/components/waveform"


const PlayButton = memo(
  ({ currentTrackIndex }: { currentTrackIndex: number }) => {
    const player = useAudioPlayer()
    return (
      <AudioPlayerButton
        variant="outline"
        size="icon"
        item={
          player.activeItem
            ? {
                id: exampleTracks[currentTrackIndex].id,
                src: exampleTracks[currentTrackIndex].url,
                data: { name: exampleTracks[currentTrackIndex].name },
              }
            : undefined
        }
        className={cn(
          "border-border h-14 w-14 rounded-full transition-all duration-300",
          player.isPlaying
            ? "bg-foreground/10 hover:bg-foreground/15 border-foreground/30 dark:bg-primary/20 dark:hover:bg-primary/30 dark:border-primary/50"
            : "bg-background hover:bg-muted"
        )}
      />
    )
  }
)

PlayButton.displayName = "PlayButton"

const TimeDisplay = memo(() => {
  return (
    <div className="flex items-center gap-2">
      <AudioPlayerTime className="text-xs" />
      <AudioPlayerProgress className="flex-1" />
      <AudioPlayerDuration className="text-xs" />
    </div>
  )
})

TimeDisplay.displayName = "TimeDisplay"

const SpeakerContextBridge = ({ className }: { className?: string }) => {
  const player = useAudioPlayer()
  const playerRefStatic = useRef(player)

  playerRefStatic.current = player

  return useMemo(
    () => <SpeakerControls className={className} playerRef={playerRefStatic} />,
    [className]
  )
}

export function Speaker({ className }: { className?: string }) {
  return (
    <AudioPlayerProvider>
      <SpeakerContextBridge className={className} />
    </AudioPlayerProvider>
  )
}

type AudioState = { isPlaying: boolean; volume: number; isDark: boolean }

const SpeakerOrb = memo(
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

const SpeakerOrbsSection = memo(
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

const VolumeSlider = memo(
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

function SpeakerControls({
  className,
  playerRef,
}: {
  className?: string
  playerRef: React.RefObject<ReturnType<typeof useAudioPlayer>>
}) {
  const playerApiRef = playerRef
  const [volume, setVolume] = useState(0.7)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [showTrackList, setShowTrackList] = useState(false)

  const waveformElementRef = useRef<HTMLDivElement>(null)
  const waveformOffset = useRef(0)
  const containerWidthRef = useRef(300)
  const totalBarsRef = useRef(600)

  const {
    isPlayingRef,
    audioStateRef,
    audioDataRef,
    isDark,
    ambienceMode,
    setAmbienceMode,
    precomputedWaveform,
    precomputeWaveform,
    playScratchSound,
    stopScratchSound,
  } = useAudioEngine(playerApiRef)

  const { isScrubbing, isMomentumActive, onTouchStart, onMouseDown } = useScrubbing({
    playerApiRef,
    waveformOffset,
    waveformElementRef,
    containerWidthRef,
    totalBarsRef,
    isPlayingRef,
    playScratchSound,
    stopScratchSound,
  })

  useEffect(() => {
    const container = document.querySelector(".waveform-container")
    if (container) {
      const rect = container.getBoundingClientRect()
      containerWidthRef.current = rect.width
      waveformOffset.current = rect.width
      if (waveformElementRef.current) {
        waveformElementRef.current.style.transform = `translateX(${rect.width}px)`
      }
    }
  }, [])

  useEffect(() => {
    setPrecomputedWaveformOnMount()
  }, [])

  useEffect(() => {
    if (precomputedWaveform.length > 0 && containerWidthRef.current > 0) {
      waveformOffset.current = containerWidthRef.current
      if (waveformElementRef.current) {
        waveformElementRef.current.style.transform = `translateX(${containerWidthRef.current}px)`
      }
      if (playerApiRef.current.ref.current) {
        playerApiRef.current.ref.current.currentTime = 0
      }
    }
  }, [precomputedWaveform])

  const setPrecomputedWaveformOnMount = useCallback(() => {
    const track = {
      id: exampleTracks[0].id,
      src: exampleTracks[0].url,
      data: { name: exampleTracks[0].name },
    }
    playerApiRef.current.setActiveItem(track)
    precomputeWaveform(track.src)
  }, [precomputeWaveform])

  useEffect(() => {
    if (playerApiRef.current.ref.current) {
      playerApiRef.current.ref.current.volume = volume
    }
    audioStateRef.current.volume = volume
  }, [volume])

  const playTrack = useCallback(
    (index: number) => {
      setCurrentTrackIndex(index)
      const track = {
        id: exampleTracks[index].id,
        src: exampleTracks[index].url,
        data: { name: exampleTracks[index].name },
      }
      playerApiRef.current.play(track)
      setShowTrackList(false)
      precomputeWaveform(track.src)
    },
    [precomputeWaveform]
  )

  const nextTrack = () => {
    const nextIndex = (currentTrackIndex + 1) % exampleTracks.length
    playTrack(nextIndex)
  }

  const prevTrack = () => {
    const prevIndex =
      (currentTrackIndex - 1 + exampleTracks.length) % exampleTracks.length
    playTrack(prevIndex)
  }

  const tracks = exampleTracks.map((t) => ({
    id: t.id,
    title: t.name,
    artist: "ElevenLabs Music",
  }))
  const currentTrack = tracks[currentTrackIndex]

  return (
    <Card className={cn("relative", className)}>
      <div className="bg-muted-foreground/30 absolute top-0 left-1/2 h-3 w-48 -translate-x-1/2 rounded-b-full" />
      <div className="bg-muted-foreground/20 absolute top-0 left-1/2 h-2 w-44 -translate-x-1/2 rounded-b-full" />

      <div className="relative space-y-6 p-4">
        <div className="border-border rounded-lg border bg-foreground/5 p-4 backdrop-blur-sm dark:bg-foreground/50">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="text-foreground truncate text-sm font-medium">
                  {currentTrack.title}
                </h3>
                <a
                  href="https://elevenlabs.io/music"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground truncate text-xs"
                >
                  {currentTrack.artist}
                </a>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 transition-all",
                    ambienceMode
                      ? "text-primary hover:text-primary/80"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setAmbienceMode(!ambienceMode)}
                >
                  <IconSparkles className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground h-8 w-8"
                  onClick={() => setShowTrackList(!showTrackList)}
                >
                  <IconMusic className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div
              className="waveform-container bg-foreground/10 relative h-12 cursor-grab overflow-hidden rounded-lg p-2 active:cursor-grabbing dark:bg-foreground/80"
              onTouchStart={onTouchStart}
              onMouseDown={onMouseDown}
            >
              <div className="relative h-full w-full overflow-hidden">
                <div
                  ref={waveformElementRef}
                  style={{
                    transform: `translateX(${waveformOffset.current}px)`,
                    transition:
                      isScrubbing || isMomentumActive
                        ? "none"
                        : "transform 0.016s linear",
                    width: `${totalBarsRef.current * 5}px`,
                    position: "absolute",
                    left: 0,
                  }}
                >
                  <Waveform
                    key={isDark ? "dark" : "light"}
                    data={
                      precomputedWaveform.length > 0
                        ? precomputedWaveform
                        : audioDataRef.current
                    }
                    height={32}
                    barWidth={3}
                    barGap={2}
                    fadeEdges={true}
                    fadeWidth={24}
                    barRadius={1}
                    barColor={isDark ? "#a1a1aa" : "#71717a"}
                  />
                </div>
              </div>
            </div>

            <TimeDisplay />
          </div>
        </div>

        {showTrackList && (
          <div className="bg-card/95 border-border absolute top-36 right-8 left-8 z-10 rounded-lg border p-3 shadow-xl backdrop-blur">
            <h4 className="text-muted-foreground mb-2 font-mono text-xs tracking-wider uppercase">
              Playlist
            </h4>
            <div className="max-h-32 space-y-1 overflow-y-auto">
              {tracks.map((track, index) => (
                <Button
                  key={track.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => playTrack(index)}
                  className={cn(
                    "w-full rounded px-2 py-1 text-left text-xs h-auto justify-start",
                    currentTrackIndex === index
                      ? "bg-foreground/10 text-foreground dark:bg-primary/20 dark:text-primary"
                      : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground/60">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{track.title}</div>
                      <div className="text-muted-foreground/60 truncate text-xs">
                        {track.artist}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="border-border bg-background hover:bg-muted h-10 w-10 rounded-full"
            onClick={prevTrack}
          >
            <IconSkipBack className="text-muted-foreground h-4 w-4" />
          </Button>

          <PlayButton currentTrackIndex={currentTrackIndex} />

          <Button
            variant="outline"
            size="icon"
            className="border-border bg-background hover:bg-muted h-10 w-10 rounded-full"
            onClick={nextTrack}
          >
            <IconSkipForward className="text-muted-foreground h-4 w-4" />
          </Button>
        </div>

        <SpeakerOrbsSection isDark={isDark} audioDataRef={audioDataRef} stateRef={audioStateRef} />

        <VolumeSlider volume={volume} setVolume={setVolume} />
      </div>
    </Card>
  )
}
