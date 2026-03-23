

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import { useScribe } from "@/hooks/use-scribe"
import { Button } from "@/components/ui/button"
import { ShimmeringText } from "@/features/ai-agent/components/shimmering-text"

import { LanguageSelector } from "@/features/ai-agent/RealtimeTranscriberLanguageSelector"
import {
  BackgroundAura,
  BottomControls,
  TranscriberTranscript,
  TRANSCRIBER_KEYFRAME_STYLES,
} from "@/features/ai-agent/components/transcriber-parts"

interface RecordingState {
  error: string
  latenciesMs: number[]
}

type ConnectionState = "idle" | "connecting" | "connected" | "disconnecting"

export default function RealtimeTranscriber01() {
  const [recording, setRecording] = useState<RecordingState>({
    error: "",
    latenciesMs: [],
  })
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null)
  const [connectionState, setConnectionStateState] =
    useState<ConnectionState>("idle")
  const [localTranscript, setLocalTranscript] = useState("")

  const [isMac, setIsMac] = useState(true)
  useEffect(() => {
    setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent))
  }, [])

  const segmentStartMsRef = useRef<number | null>(null)
  const lastTranscriptRef = useRef<string>("")
  const finalTranscriptsRef = useRef<string[]>([])

  const startSoundRef = useRef<HTMLAudioElement | null>(null)
  const endSoundRef = useRef<HTMLAudioElement | null>(null)
  const errorSoundRef = useRef<HTMLAudioElement | null>(null)

  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastOperationTimeRef = useRef(0)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const connectionStateRef = useRef<ConnectionState>("idle")

  const updateConnectionState = useCallback(
    (next: ConnectionState) => {
      connectionStateRef.current = next
      setConnectionStateState(next)
    },
    [setConnectionStateState]
  )

  const clearSessionRefs = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current)
      errorTimeoutRef.current = null
    }

    segmentStartMsRef.current = null
    lastTranscriptRef.current = ""
    finalTranscriptsRef.current = []
  }, [])

  const onPartialTranscript = useCallback((data: { text?: string }) => {
    if (connectionStateRef.current !== "connected") return

    const currentText = data.text || ""

    if (currentText === lastTranscriptRef.current) return

    lastTranscriptRef.current = currentText

    const fullText = finalTranscriptsRef.current.join(" ")
    const combined = fullText ? `${fullText} ${currentText}` : currentText
    setLocalTranscript(combined)

    if (currentText.length > 0 && segmentStartMsRef.current != null) {
      const latency = performance.now() - segmentStartMsRef.current
      setRecording((prev) => ({
        ...prev,
        latenciesMs: [...prev.latenciesMs.slice(-29), latency],
      }))
      segmentStartMsRef.current = null
    }
  }, [])

  const onFinalTranscript = useCallback((data: { text?: string }) => {
    if (connectionStateRef.current !== "connected") return

    lastTranscriptRef.current = ""

    if (data.text && data.text.length > 0) {
      finalTranscriptsRef.current = [...finalTranscriptsRef.current, data.text]

      setLocalTranscript(finalTranscriptsRef.current.join(" "))

      if (segmentStartMsRef.current != null) {
        const latency = performance.now() - segmentStartMsRef.current
        setRecording((prev) => ({
          ...prev,
          latenciesMs: [...prev.latenciesMs.slice(-29), latency],
        }))
      }
    }
    segmentStartMsRef.current = null
  }, [])

  const onError = useCallback((error: Error | Event) => {
    console.error("[Scribe] Error:", error)

    if (connectionStateRef.current !== "connected") {
      if (import.meta.env.DEV) console.debug("[Scribe] Ignoring error - not connected")
      return
    }

    const errorMessage =
      error instanceof Error ? error.message : "Transcription error"

    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current)
    }

    errorTimeoutRef.current = setTimeout(() => {
      if (connectionStateRef.current !== "connected") return

      setRecording((prev) => ({
        ...prev,
        error: errorMessage,
      }))
      errorSoundRef.current?.play().catch(() => { /* ignore: autoplay may be blocked */ })
    }, 500)
  }, [])

  const scribeConfig = useMemo(
    () => ({
      modelId: "scribe_realtime_v2" as const,
      onPartialTranscript,
      onFinalTranscript,
      onError,
    }),
    [onPartialTranscript, onFinalTranscript, onError]
  )

  const scribe = useScribe(scribeConfig)

  useEffect(() => {
    if (connectionState !== "connected") {
      setLocalTranscript("")
    }
  }, [connectionState])

  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }

    if (connectionState !== "connected") return

    timerIntervalRef.current = setInterval(() => {
      if (segmentStartMsRef.current === null) {
        segmentStartMsRef.current = performance.now()
      }
    }, 100)

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }, [connectionState])

  const handleToggleRecording = useCallback(async () => {
    const now = Date.now()
    const timeSinceLastOp = now - lastOperationTimeRef.current

    if (connectionState === "connected" || connectionState === "connecting") {
      if (import.meta.env.DEV) console.debug("[Scribe] Disconnecting...")

      updateConnectionState("idle")
      setLocalTranscript("")
      setRecording({ error: "", latenciesMs: [] })
      clearSessionRefs()

      try {
        scribe.disconnect()
        scribe.clearTranscripts()
      } catch {
        // Ignore errors
      }

      if (endSoundRef.current) {
        endSoundRef.current.currentTime = 0
        endSoundRef.current.play().catch(() => { /* ignore: autoplay may be blocked */ })
      }

      lastOperationTimeRef.current = now
      return
    }

    if (timeSinceLastOp < 200) {
      if (import.meta.env.DEV) console.debug("[Scribe] Ignoring rapid click")
      return
    }
    lastOperationTimeRef.current = now

    if (connectionState !== "idle") {
      if (import.meta.env.DEV) console.debug("[Scribe] Not in idle state, ignoring")
      return
    }

    if (import.meta.env.DEV) console.debug("[Scribe] Connecting...")
    updateConnectionState("connecting")
    setLocalTranscript("")
    setRecording({ error: "", latenciesMs: [] })
    clearSessionRefs()

    try {
      const res = await fetch("/api/marcela/scribe-token", { method: "POST", credentials: "include" })
      const result: { token?: string; error?: string } = await res.json()

      if (connectionStateRef.current === "idle") {
        if (import.meta.env.DEV) console.debug("[Scribe] Cancelled during token fetch")
        return
      }

      if (result.error || !result.token) {
        throw new Error(result.error || "Failed to get token")
      }

      await scribe.connect({
        token: result.token,
        languageCode: selectedLanguage || undefined,
        microphone: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
        },
      })

      if (connectionStateRef.current !== "connecting") {
        if (import.meta.env.DEV) console.debug("[Scribe] Cancelled after connection")
        try {
          scribe.disconnect()
        } catch {
          // Ignore
        }
        return
      }

      if (import.meta.env.DEV) console.debug("[Scribe] Connected")
      updateConnectionState("connected")

      if (startSoundRef.current) {
        startSoundRef.current.currentTime = 0
        startSoundRef.current.play().catch(() => { /* ignore: autoplay may be blocked */ })
      }
    } catch (error) {
      console.error("[Scribe] Connection error:", error)
      updateConnectionState("idle")
      setRecording((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Connection failed",
      }))
    }
  }, [
    clearSessionRefs,
    connectionState,
    scribe,
    selectedLanguage,
    updateConnectionState,
  ])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "k" &&
        (e.metaKey || e.ctrlKey) &&
        e.target instanceof HTMLElement &&
        !["INPUT", "TEXTAREA"].includes(e.target.tagName)
      ) {
        e.preventDefault()
        handleToggleRecording()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleToggleRecording])

  useEffect(() => {
    const sounds = [
      {
        ref: startSoundRef,
        url: "https://ui.elevenlabs.io/sounds/transcriber-start.mp3",
      },
      {
        ref: endSoundRef,
        url: "https://ui.elevenlabs.io/sounds/transcriber-end.mp3",
      },
      {
        ref: errorSoundRef,
        url: "https://ui.elevenlabs.io/sounds/transcriber-error.mp3",
      },
    ]

    sounds.forEach(({ ref, url }) => {
      const audio = new Audio(url)
      audio.volume = 0.6
      audio.preload = "auto"
      audio.load()
      ref.current = audio
    })
  }, [])

  const displayText = recording.error || localTranscript
  const hasContent = Boolean(displayText) && connectionState === "connected"

  const isPartial = Boolean(lastTranscriptRef.current)

  return (
    <div className="relative mx-auto flex min-h-[480px] w-full max-w-4xl flex-col items-center justify-center overflow-hidden rounded-xl border bg-background">
      <BackgroundAura
        status={connectionState === "connecting" ? "connecting" : scribe.status}
        isConnected={connectionState === "connected"}
      />

      <style>{TRANSCRIBER_KEYFRAME_STYLES}</style>

      <div className="relative flex h-full w-full flex-col items-center justify-center gap-8 overflow-hidden px-8 py-12">
        <div className="relative flex min-h-[350px] w-full flex-1 items-center justify-center overflow-hidden">
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-250",
              hasContent ? "opacity-100" : "pointer-events-none opacity-0"
            )}
          >
            {hasContent && (
              <TranscriberTranscript
                transcript={displayText}
                error={recording.error}
                isPartial={isPartial}
                isConnected={connectionState === "connected"}
              />
            )}
          </div>

          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-opacity duration-250",
              !hasContent ? "opacity-100" : "pointer-events-none opacity-0"
            )}
          >
            <div
              className={cn(
                "absolute transition-opacity duration-250",
                connectionState === "connecting"
                  ? "opacity-100"
                  : "pointer-events-none opacity-0"
              )}
            >
              <ShimmeringText
                text="Connecting..."
                className="text-2xl font-light tracking-wide whitespace-nowrap"
              />
            </div>
            <div
              className={cn(
                "absolute transition-opacity duration-250",
                connectionState === "connected" && !hasContent
                  ? "opacity-100"
                  : "pointer-events-none opacity-0"
              )}
            >
              <ShimmeringText
                text="Say something aloud..."
                className="text-3xl font-light tracking-wide whitespace-nowrap"
              />
            </div>
          </div>

          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-opacity duration-250",
              connectionState === "idle"
                ? "opacity-100"
                : "pointer-events-none opacity-0"
            )}
          >
            <div className="flex w-full max-w-sm flex-col gap-4 px-8">
              <div className="flex flex-col items-center gap-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Realtime Speech to Text
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Transcribe your voice in real-time with high accuracy
                  </p>
                </div>

                <div className="w-full space-y-2">
                  <label className="text-foreground/70 text-sm font-medium">
                    Language
                  </label>
                  <LanguageSelector
                    value={selectedLanguage}
                    onValueChange={setSelectedLanguage}
                    disabled={connectionState !== "idle"}
                  />
                </div>

                <Button
                  onClick={handleToggleRecording}
                  disabled={false}
                  size="lg"
                  className="bg-foreground/95 hover:bg-foreground/90 w-full justify-center gap-3"
                >
                  <span>Start Transcribing</span>
                  <kbd className="border-background/20 bg-background/10 hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-xs sm:inline-flex">
                    {isMac ? "⌘K" : "Ctrl+K"}
                  </kbd>
                </Button>

                <a
                  href="https://elevenlabs.io/speech-to-text"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-foreground/60 hover:text-foreground/80 transition-colors"
                >
                  Powered by Norfolk AI
                </a>
              </div>
            </div>
          </div>
        </div>

        <BottomControls
          isConnected={connectionState === "connected"}
          hasError={Boolean(recording.error)}
          isMac={isMac}
          onStop={handleToggleRecording}
        />
      </div>
    </div>
  )
}
