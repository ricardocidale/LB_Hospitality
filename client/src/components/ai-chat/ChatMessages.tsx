import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Loader2, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message, VoiceState } from "./types";

interface ChatMessagesProps {
  messages: Message[];
  streamingContent: string;
  voiceState: VoiceState;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatMessages({ messages, streamingContent, voiceState, messagesEndRef }: ChatMessagesProps) {
  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-start gap-3 max-w-[85%]",
              message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              {message.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={cn(
              "rounded-2xl px-4 py-2 text-sm",
              message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              <MarkdownContent content={message.content} />
            </div>
          </div>
        ))}
        {streamingContent && (
          <div className="flex items-start gap-3 max-w-[85%] mr-auto">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="rounded-2xl px-4 py-2 text-sm bg-muted">
              <MarkdownContent content={streamingContent} />
            </div>
          </div>
        )}
        <VoiceStateIndicator voiceState={voiceState} />
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      elements.push(
        <pre key={elements.length} className="bg-muted rounded p-2 my-1 overflow-x-auto text-xs">
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    if (line.startsWith("### ")) {
      elements.push(<h4 key={elements.length} className="font-semibold text-sm mt-2">{formatInline(line.slice(4))}</h4>);
    } else if (line.startsWith("## ")) {
      elements.push(<h3 key={elements.length} className="font-semibold mt-2">{formatInline(line.slice(3))}</h3>);
    } else if (line.startsWith("- ")) {
      elements.push(<li key={elements.length} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>);
    } else if (/^\d+\.\s/.test(line)) {
      elements.push(<li key={elements.length} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ""))}</li>);
    } else if (line.trim() === "") {
      elements.push(<br key={elements.length} />);
    } else {
      elements.push(<p key={elements.length} className="text-sm">{formatInline(line)}</p>);
    }
    i++;
  }

  return <div className="max-w-none text-sm leading-relaxed space-y-0.5">{elements}</div>;
}

function formatInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      parts.push(<strong key={parts.length}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={parts.length}>{match[4]}</em>);
    } else if (match[5]) {
      parts.push(<code key={parts.length} className="bg-muted px-1 rounded text-xs">{match[6]}</code>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

function VoiceStateIndicator({ voiceState }: { voiceState: VoiceState }) {
  if (voiceState === "idle") return null;

  const configs: Record<VoiceState, { label: string; color: string; icon: React.ReactNode }> = {
    idle: { label: "", color: "", icon: null },
    recording: {
      label: "Listening...",
      color: "text-red-500",
      icon: <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />,
    },
    processing: {
      label: "Processing audio...",
      color: "text-amber-500",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    thinking: {
      label: "Thinking...",
      color: "text-primary",
      icon: (
        <div className="flex gap-0.5">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      ),
    },
    speaking: {
      label: "Marcela is speaking...",
      color: "text-primary",
      icon: <Volume2 className="w-3 h-3 animate-pulse" />,
    },
  };

  const config = configs[voiceState];
  if (!config.label) return null;

  return (
    <div className={cn("flex items-center gap-2 px-3 py-1.5 text-xs", config.color)}>
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}
