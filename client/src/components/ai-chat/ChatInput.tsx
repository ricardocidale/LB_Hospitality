import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, MicOff, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  onSend: () => void;
  isStreaming: boolean;
  isRecording: boolean;
  isPlayingAudio: boolean;
  handleVoiceToggle: () => void;
  voiceError: string | null;
  retryVoice: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function ChatInput({
  input,
  setInput,
  onSend,
  isStreaming,
  isRecording,
  isPlayingAudio,
  handleVoiceToggle,
  voiceError,
  retryVoice,
  inputRef,
}: ChatInputProps) {
  return (
    <div className="p-4 border-t bg-background">
      {voiceError && (
        <div className="mb-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between gap-2">
          <p className="text-[10px] text-red-600 font-medium leading-tight">{voiceError}</p>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-red-500 hover:text-red-600 hover:bg-red-100 shrink-0"
            onClick={retryVoice}
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button
          data-testid="button-voice-chat"
          variant="outline"
          size="icon"
          className={cn(
            "shrink-0 transition-all duration-300",
            isRecording && "bg-red-50 border-red-200 text-red-500 animate-pulse scale-110",
            isPlayingAudio && "bg-primary/10 border-primary/20 text-primary animate-pulse"
          )}
          onClick={handleVoiceToggle}
        >
          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className={cn("w-4 h-4", isPlayingAudio && "fill-current")} />}
        </Button>

        <div className="relative flex-1 group">
          <Input
            ref={inputRef}
            data-testid="input-chat-message"
            placeholder={isRecording ? "Listening..." : "Type a message..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            disabled={isStreaming || isRecording}
            className={cn(
              "pr-10 transition-all focus-visible:ring-primary/30",
              isRecording && "placeholder:text-red-400"
            )}
          />
          <Button
            data-testid="button-send-message"
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
            onClick={onSend}
            disabled={!input.trim() || isStreaming || isRecording}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {isRecording && (
          <div className="absolute left-1/2 -translate-x-1/2 -top-12 bg-red-500 text-white px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <WaveformVisualizer isActive={isRecording} />
            <span className="text-xs font-medium">Recording...</span>
          </div>
        )}
      </div>
    </div>
  );
}

function WaveformVisualizer({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;

  return (
    <div className="flex items-center gap-0.5 h-4 px-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="w-0.5 bg-red-400 rounded-full animate-pulse"
          style={{
            height: `${Math.random() * 12 + 4}px`,
            animationDelay: `${i * 80}ms`,
            animationDuration: `${300 + Math.random() * 400}ms`,
          }}
        />
      ))}
    </div>
  );
}
