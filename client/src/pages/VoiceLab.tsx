/**
 * VoiceLab.tsx — Showcase page for all ElevenLabs conversational AI UI patterns.
 *
 * Exposes three chat interface variants (Orb, Full, Bar) in tabs, plus
 * a real-time speech transcriber and a standalone audio player/speaker demo.
 */
import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic2, MessageSquare, AudioLines, Captions, Music2, Mic } from "lucide-react";
import Layout from "@/components/Layout";
import VoiceChatOrb from "@/features/ai-agent/VoiceChatOrb";
import VoiceChatFull from "@/features/ai-agent/VoiceChatFull";
import VoiceChatBar from "@/features/ai-agent/VoiceChatBar";
import RealtimeTranscriber01 from "@/features/ai-agent/RealtimeTranscriber";
import { Speaker } from "@/features/ai-agent/Speaker";
import { useMarcelaSettings } from "@/features/ai-agent/hooks/use-agent-settings";

const TABS = [
  { id: "orb",         label: "Voice Orb",    icon: Mic2,           description: "Minimal voice-first interface", requiresMic: true  },
  { id: "full",        label: "Full Chat",    icon: MessageSquare,  description: "Chat + voice hybrid",           requiresMic: false },
  { id: "bar",         label: "Floating Bar", icon: AudioLines,     description: "Compact inline chat bar",       requiresMic: true  },
  { id: "transcriber", label: "Transcriber",  icon: Captions,       description: "Real-time speech-to-text",     requiresMic: true  },
  { id: "speaker",     label: "Speaker",      icon: Music2,         description: "Audio player with waveform",   requiresMic: false },
] as const;

type TabId = typeof TABS[number]["id"];

export default function VoiceLab() {
  const [activeTab, setActiveTab] = useState<TabId>("full");
  const { data: settings } = useMarcelaSettings();
  const agentName = settings?.aiAgentName ?? "Marcela";
  const hasActiveSessionRef = useRef(false);

  const handleTabChange = useCallback((id: TabId) => {
    if (hasActiveSessionRef.current && id !== activeTab) {
      if (!window.confirm("A session is active. Switch tabs and end the current session?")) return;
      hasActiveSessionRef.current = false;
    }
    setActiveTab(id);
  }, [activeTab]);

  const handleSessionChange = useCallback((active: boolean) => {
    hasActiveSessionRef.current = active;
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900 font-display">
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
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={[
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                ].join(" ")}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.requiresMic && (
                  <Mic className="w-2.5 h-2.5 opacity-50" />
                )}
              </button>
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
          </motion.div>
        </AnimatePresence>
      </div>
    </Layout>
  );
}
