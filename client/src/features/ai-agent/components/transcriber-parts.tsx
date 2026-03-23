import React, { useEffect, useMemo, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { IconCopy } from "@/components/icons"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { usePrevious } from "@/hooks/use-previous"
import { Button } from "@/components/ui/button"

export const TranscriptCharacter = React.memo(
  ({ char, delay }: { char: string; delay: number }) => {
    return (
      <motion.span
        initial={{ filter: `blur(3.5px)`, opacity: 0 }}
        animate={{ filter: `none`, opacity: 1 }}
        transition={{ duration: 0.5, delay }}
        style={{ willChange: delay > 0 ? "filter, opacity" : "auto" }}
      >
        {char}
      </motion.span>
    )
  }
)
TranscriptCharacter.displayName = "TranscriptCharacter"

export const BackgroundAura = React.memo(
  ({ status, isConnected }: { status: string; isConnected: boolean }) => {
    const isActive = status === "connecting" || isConnected

    return (
      <div
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out",
          isActive ? "opacity-100" : "opacity-0"
        )}
      >
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{
            width: "130%",
            height: "20vh",
            background:
              "radial-gradient(ellipse 100% 100% at 50% 100%, rgba(34, 211, 238, 0.5) 0%, rgba(168, 85, 247, 0.4) 35%, rgba(251, 146, 60, 0.5) 70%, transparent 100%)",
            filter: "blur(80px)",
          }}
        />

        <div
          className={cn(
            "absolute bottom-0 left-1/2 -translate-x-1/2 animate-pulse",
            isConnected ? "opacity-100" : "opacity-80"
          )}
          style={{
            width: "100%",
            height: "18vh",
            background:
              "radial-gradient(ellipse 100% 100% at 50% 100%, rgba(134, 239, 172, 0.5) 0%, rgba(192, 132, 252, 0.4) 50%, transparent 100%)",
            filter: "blur(60px)",
            animationDuration: "4s",
          }}
        />

        <div
          className="absolute bottom-0 left-0"
          style={{
            width: "25vw",
            height: "30vh",
            background:
              "radial-gradient(circle at 0% 100%, rgba(34, 211, 238, 0.5) 0%, rgba(134, 239, 172, 0.3) 30%, transparent 60%)",
            filter: "blur(70px)",
          }}
        />

        <div
          className="absolute bottom-0 -left-8"
          style={{
            width: "20vw",
            height: "45vh",
            background:
              "radial-gradient(ellipse 50% 100% at 10% 100%, rgba(34, 211, 238, 0.4) 0%, rgba(134, 239, 172, 0.25) 25%, transparent 60%)",
            filter: "blur(60px)",
            animation: "pulseGlow 5s ease-in-out infinite alternate",
          }}
        />

        <div
          className="absolute right-0 bottom-0"
          style={{
            width: "25vw",
            height: "30vh",
            background:
              "radial-gradient(circle at 100% 100%, rgba(251, 146, 60, 0.5) 0%, rgba(251, 146, 60, 0.3) 30%, transparent 60%)",
            filter: "blur(70px)",
          }}
        />

        <div
          className="absolute -right-8 bottom-0"
          style={{
            width: "20vw",
            height: "45vh",
            background:
              "radial-gradient(ellipse 50% 100% at 90% 100%, rgba(251, 146, 60, 0.4) 0%, rgba(192, 132, 252, 0.25) 25%, transparent 60%)",
            filter: "blur(60px)",
            animation: "pulseGlow 5s ease-in-out infinite alternate-reverse",
          }}
        />

        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{
            width: "100%",
            height: "15vh",
            background:
              "linear-gradient(90deg, rgba(34, 211, 238, 0.3) 0%, rgba(168, 85, 247, 0.3) 30%, rgba(251, 146, 60, 0.3) 60%, rgba(134, 239, 172, 0.3) 100%)",
            filter: "blur(30px)",
            animation: "shimmer 8s linear infinite",
          }}
        />
      </div>
    )
  }
)
BackgroundAura.displayName = "BackgroundAura"

export const BottomControls = React.memo(
  ({
    isConnected,
    hasError,
    isMac,
    onStop,
  }: {
    isConnected: boolean
    hasError: boolean
    isMac: boolean
    onStop: () => void
  }) => {
    return (
      <AnimatePresence mode="popLayout">
        {isConnected && !hasError && (
          <motion.div
            key="bottom-controls"
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: 0.1 },
            }}
            exit={{
              opacity: 0,
              y: 10,
              transition: { duration: 0.1 },
            }}
            className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2"
          >
            <Button
              onClick={onStop}
              className="bg-foreground text-background border-foreground/10 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-lg hover:opacity-90"
            >
              Stop
              <kbd className="border-background/20 bg-background/10 inline-flex h-5 items-center rounded border px-1.5 font-mono text-xs">
                {isMac ? "⌘K" : "Ctrl+K"}
              </kbd>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    )
  },
  (prev, next) => {
    if (prev.isConnected !== next.isConnected) return false
    if (prev.hasError !== next.hasError) return false
    if (prev.isMac !== next.isMac) return false
    return true
  }
)
BottomControls.displayName = "BottomControls"

export const TranscriberTranscript = React.memo(
  ({
    transcript,
    error,
    isPartial,
    isConnected,
  }: {
    transcript: string
    error: string
    isPartial?: boolean
    isConnected: boolean
  }) => {
    const characters = useMemo(() => transcript.split(""), [transcript])
    const previousNumChars = useDebounce(
      usePrevious(characters.length) || 0,
      100
    )
    const scrollRef = useRef<HTMLDivElement>(null)
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
      if (isConnected && scrollRef.current) {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
        scrollTimeoutRef.current = setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
          }
        }, 50)
      }
      return () => {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current)
        }
      }
    }, [transcript, isConnected])

    return (
      <div className="absolute inset-0 flex flex-col">
        <div ref={scrollRef} className="flex-1 overflow-auto">
          <div
            className={cn(
              "min-h-[50%] w-full px-12 py-8",
              isConnected && "absolute bottom-16"
            )}
          >
            <div
              className={cn(
                "text-foreground/90 w-full text-xl leading-relaxed font-light",
                error && "text-destructive",
                isPartial && !error && "text-foreground/60"
              )}
            >
              {characters.map((char, index) => {
                const delay =
                  index >= previousNumChars
                    ? (index - previousNumChars + 1) * 0.012
                    : 0
                return (
                  <TranscriptCharacter key={index} char={char} delay={delay} />
                )
              })}
            </div>
          </div>
        </div>
        {transcript && !error && !isPartial && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 h-8 w-8 opacity-0 transition-opacity hover:opacity-60"
            onClick={() => {
              navigator.clipboard.writeText(transcript)
            }}
            aria-label="Copy transcript"
          >
            <IconCopy className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }
)
TranscriberTranscript.displayName = "TranscriberTranscript"

export const TRANSCRIBER_KEYFRAME_STYLES = `
  @keyframes shimmer {
    0% {
      transform: translateX(-20%) scale(1);
    }
    50% {
      transform: translateX(20%) scale(1.1);
    }
    100% {
      transform: translateX(-20%) scale(1);
    }
  }
  @keyframes drift {
    0% {
      transform: translateX(-10%) scale(1);
    }
    100% {
      transform: translateX(10%) scale(1.05);
    }
  }
  @keyframes pulseGlow {
    0% {
      opacity: 0.5;
      transform: translateY(0) scale(1);
    }
    100% {
      opacity: 0.8;
      transform: translateY(-5%) scale(1.02);
    }
  }
`
