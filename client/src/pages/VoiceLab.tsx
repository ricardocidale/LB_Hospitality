/**
 * VoiceLab.tsx — Showcase page for all ElevenLabs conversational AI UI patterns.
 *
 * Exposes three chat interface variants (Orb, Full, Bar) in tabs, plus
 * a real-time speech transcriber and a standalone audio player/speaker demo.
 */
import React, { useCallback, useRef, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconMic2, IconMessageSquare, IconAudioLines, IconCaptions, IconMusic2, IconMic, IconAlertTriangle, IconRefreshCw } from "@/components/icons";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useMarcelaSettings } from "@/features/ai-agent/hooks/use-agent-settings";

// Lazy-load heavy ElevenLabs/Three.js components so a failure in one tab
// doesn't crash the entire page and the initial bundle stays small.
const VoiceChatOrb = React.lazy(() => import("@/features/ai-agent/VoiceChatOrb"));
const VoiceChatFull = React.lazy(() => import("@/features/ai-agent/VoiceChatFull"));
const VoiceChatBar = React.lazy(() => import("@/features/ai-agent/VoiceChatBar"));
const RealtimeTranscriber01 = React.lazy(() => import("@/features/ai-agent/RealtimeTranscriber"));
const Speaker = React.lazy(() => import("@/features/ai-agent/Speaker").then(m => ({ default: m.Speaker })));

// ── Per-tab error boundary ───────────────────────────────────────────────────
interface TabErrorBoundaryState { hasError: boolean; error: Error | null }

class TabErrorBoundary extends React.Component<
  { children: React.ReactNode; tabName: string },
  TabErrorBoundaryState
> {
  state: TabErrorBoundaryState = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[VoiceLab/${this.props.tabName}]`, error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <IconAlertTriangle className="h-10 w-10 text-accent-pop" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {this.props.tabName} failed to load
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            <IconRefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Suspense fallback for lazy-loaded tabs
function TabSkeleton() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

const TABS = [
  { id: "orb",         label: "Voice Orb",    icon: IconMic2,           description: "Minimal voice-first interface", requiresMic: true  },
  { id: "full",        label: "Full Chat",    icon: IconMessageSquare,  description: "Chat + voice hybrid",           requiresMic: false },
  { id: "bar",         label: "Floating Bar", icon: IconAudioLines,     description: "Compact inline chat bar",       requiresMic: true  },
  { id: "transcriber", label: "Transcriber",  icon: IconCaptions,       description: "Real-time speech-to-text",     requiresMic: true  },
  { id: "speaker",     label: "Speaker",      icon: IconMusic2,         description: "Audio player with waveform",   requiresMic: false },
] as const;

type TabId = typeof TABS[number]["id"];

export default function VoiceLab() {
  const [activeTab, setActiveTab] = useState<TabId>("full");
  const { data: settings } = useMarcelaSettings();
  const agentName = settings?.aiAgentName ?? "Marcela";
  const hasActiveSessionRef = useRef(false);

  const handleTabChange = useCallback((id: TabId) => {
    if (hasActiveSessionRef.current) {
      if (!window.confirm("A session is active. Switch tabs and end the current session?")) return;
      hasActiveSessionRef.current = false;
    }
    setActiveTab(id);
  }, []);

  const handleSessionChange = useCallback((active: boolean) => {
    hasActiveSessionRef.current = active;
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground font-display">
            {agentName} — Voice Lab
          </h1>
          <p className="text-sm text-muted-foreground">
            Explore every conversational UI pattern available for the AI agent.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 flex-wrap">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                type="button"
                variant={active ? "default" : "ghost"}
                size="sm"
                onClick={() => handleTabChange(tab.id)}
                className={[
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all h-auto",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                ].join(" ")}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.requiresMic && (
                  <IconMic className="w-2.5 h-2.5 opacity-50" />
                )}
              </Button>
            );
          })}
        </div>

        {/* Description strip */}
        <AnimatePresence mode="wait">
          <motion.p
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-xs text-muted-foreground/70"
          >
            {TABS.find((t) => t.id === activeTab)?.description}
          </motion.p>
        </AnimatePresence>

        {/* Tab panels */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <TabErrorBoundary tabName={TABS.find(t => t.id === activeTab)?.label ?? activeTab}>
              <Suspense fallback={<TabSkeleton />}>
                {activeTab === "orb" && (
                  <VoiceChatOrb className="max-w-sm mx-auto" onSessionChange={handleSessionChange} />
                )}
                {activeTab === "full" && (
                  <VoiceChatFull className="max-w-2xl mx-auto" onSessionChange={handleSessionChange} />
                )}
                {activeTab === "bar" && (
                  <div className="max-w-2xl mx-auto">
                    <VoiceChatBar onSessionChange={handleSessionChange} />
                  </div>
                )}
                {activeTab === "transcriber" && (
                  <div className="max-w-2xl mx-auto min-h-[480px]">
                    <RealtimeTranscriber01 />
                  </div>
                )}
                {activeTab === "speaker" && (
                  <div className="max-w-sm mx-auto">
                    <Speaker />
                  </div>
                )}
              </Suspense>
            </TabErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </div>
    </Layout>
  );
}
