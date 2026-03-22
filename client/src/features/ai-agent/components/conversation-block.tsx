/**
 * ConversationBlock — Full-screen centered conversation card.
 *
 * ElevenLabs "block" pattern: hero-sized card with animated Orb,
 * agent state status text, and start/end controls. Designed as a
 * standalone page section or full-screen overlay.
 *
 * Usage:
 *   <ConversationBlock
 *     agentName="Marcela"
 *     status={agentState}
 *     isSpeaking={conversation.isSpeaking}
 *     onStart={startConversation}
 *     onEnd={stopConversation}
 *   />
 */
import { useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Phone, PhoneOff } from "@/components/icons/themed-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Orb, type AgentState as OrbAgentState } from "./orb";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "disconnecting";

interface ConversationBlockProps {
  /** Display name for the AI agent. */
  agentName?: string;
  /** Current connection status. */
  status: ConnectionStatus;
  /** Whether the agent is currently speaking. */
  isSpeaking?: boolean;
  /** Called to start a new voice session. */
  onStart: () => void;
  /** Called to end the current session. */
  onEnd: () => void;
  /** Optional error message to display. */
  error?: string | null;
  /** Orb colors override [primary, secondary]. */
  colors?: [string, string];
  /** Orb size in px. Default 250. */
  orbSize?: number;
  /** Volume accessors for the orb. */
  getInputVolume?: () => number;
  getOutputVolume?: () => number;
  /** Extra class names on the outer wrapper. */
  className?: string;
  /** Extra class names on the card. */
  cardClassName?: string;
}

export function ConversationBlock({
  agentName = "AI Assistant",
  status,
  isSpeaking = false,
  onStart,
  onEnd,
  error,
  colors,
  orbSize = 250,
  getInputVolume,
  getOutputVolume,
  className,
  cardClassName,
}: ConversationBlockProps) {
  const isActive = status === "connected";
  const isTransitioning = status === "connecting" || status === "disconnecting";

  const orbState: OrbAgentState = useMemo(() => {
    if (status === "connected" && isSpeaking) return "talking";
    if (status === "connected") return "listening";
    return null;
  }, [status, isSpeaking]);

  const statusText = useMemo(() => {
    if (error) return null;
    switch (status) {
      case "connected":
        return isSpeaking ? `${agentName} is speaking` : `${agentName} is listening`;
      case "connecting":
        return "Connecting...";
      case "disconnecting":
        return "Ending session...";
      default:
        return "Ready to talk";
    }
  }, [status, isSpeaking, agentName, error]);

  const handleToggle = useCallback(() => {
    if (status === "disconnected") onStart();
    else if (status === "connected") onEnd();
  }, [status, onStart, onEnd]);

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Card className={cn("rounded-3xl border-border/50 shadow-lg", cardClassName)}>
        <CardContent className="p-8">
          <CardHeader className="p-0 pb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={error ? "error" : status + String(isSpeaking)}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                <CardTitle
                  className={cn(
                    "text-center text-lg",
                    error ? "text-destructive" : "text-foreground"
                  )}
                >
                  {error ?? statusText}
                </CardTitle>
              </motion.div>
            </AnimatePresence>
          </CardHeader>

          <div className="flex flex-col items-center gap-8">
            {/* Orb */}
            <motion.div
              style={{ width: orbSize, height: orbSize }}
              animate={{
                scale: isActive ? 1 : 0.92,
                opacity: isTransitioning ? 0.6 : 1,
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Orb
                className="h-full w-full"
                agentState={orbState}
                colors={colors}
                volumeMode={getInputVolume || getOutputVolume ? "manual" : "auto"}
                getInputVolume={getInputVolume}
                getOutputVolume={getOutputVolume}
              />
            </motion.div>

            {/* Status indicator dot */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "h-2 w-2 rounded-full transition-colors duration-300",
                  isActive && "bg-primary",
                  isTransitioning && "bg-accent-pop/80 animate-pulse",
                  status === "disconnected" && "bg-muted-foreground/40"
                )}
              />
              <span className="text-sm text-muted-foreground capitalize">{status}</span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8"
                disabled={status !== "disconnected" || isTransitioning}
                onClick={handleToggle}
              >
                {status === "connecting" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Phone className="mr-2 h-4 w-4" />
                )}
                Start conversation
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8"
                disabled={status !== "connected" || isTransitioning}
                onClick={handleToggle}
              >
                {status === "disconnecting" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PhoneOff className="mr-2 h-4 w-4" />
                )}
                End conversation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
