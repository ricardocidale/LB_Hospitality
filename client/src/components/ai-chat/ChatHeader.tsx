import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Sparkles, Volume2, Plus, X } from "lucide-react";
import type { VoiceState } from "./types";

interface ChatHeaderProps {
  showConversations: boolean;
  setShowConversations: (show: boolean) => void;
  activeConversationId: number | null;
  voiceState: VoiceState;
  createConversation: () => void;
  isCreating: boolean;
  onClose: () => void;
}

export function ChatHeader({
  showConversations,
  setShowConversations,
  activeConversationId,
  voiceState,
  createConversation,
  isCreating,
  onClose,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-primary/5">
      <div className="flex items-center gap-2">
        {activeConversationId && !showConversations && (
          <Button
            data-testid="button-back-conversations"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowConversations(true)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
        <Sparkles className="w-5 h-5 text-primary" />
        <span className="font-semibold text-sm">Marcela</span>
        {voiceState === "speaking" && (
          <Volume2 className="w-4 h-4 text-primary animate-pulse" />
        )}
      </div>
      <div className="flex items-center gap-1">
        {!showConversations && (
          <Button
            data-testid="button-new-conversation"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={createConversation}
            disabled={isCreating}
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
        <Button
          data-testid="button-close-ai-chat"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
