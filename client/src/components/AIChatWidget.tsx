import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  X,
  Send,
  Plus,
  Trash2,
  Bot,
  User,
  Loader2,
  Sparkles,
  ChevronLeft,
  Mic,
  MicOff,
  Volume2,
} from "lucide-react";
import { useVoiceRecorder } from "../../replit_integrations/audio/useVoiceRecorder";
import { useAudioPlayback } from "../../replit_integrations/audio/useAudioPlayback";

interface Message {
  id: number;
  role: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  messages?: Message[];
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

function VoiceIndicator({ isRecording, isPlaying }: { isRecording: boolean; isPlaying: boolean }) {
  if (!isRecording && !isPlaying) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs">
      {isRecording && (
        <div className="flex items-center gap-1.5 text-red-500">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>Listening...</span>
        </div>
      )}
      {isPlaying && (
        <div className="flex items-center gap-1.5 text-primary">
          <Volume2 className="w-3 h-3 animate-pulse" />
          <span>Marcela is speaking...</span>
        </div>
      )}
    </div>
  );
}

export default function AIChatWidget({ enabled = false }: { enabled?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { state: recorderState, startRecording, stopRecording } = useVoiceRecorder();
  const playback = useAudioPlayback();
  const isRecording = recorderState === "recording";
  const isPlayingAudio = playback.state === "playing";

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await fetch("/api/conversations", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: isOpen,
  });

  const { data: activeConversation } = useQuery<Conversation>({
    queryKey: ["conversation", activeConversationId],
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${activeConversationId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!activeConversationId,
  });

  const createConversation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/conversations", { title: "New Chat" });
      return res.json();
    },
    onSuccess: (data: Conversation) => {
      setActiveConversationId(data.id);
      setShowConversations(false);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const deleteConversation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/conversations/${id}`);
    },
    onSuccess: (_, id) => {
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setShowConversations(true);
      }
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, streamingContent, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !activeConversationId) {
      setShowConversations(true);
    }
  }, [isOpen, activeConversationId]);

  useEffect(() => {
    if (isOpen && activeConversationId) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, activeConversationId]);

  const sendMessage = async () => {
    if (!input.trim() || !activeConversationId || isStreaming) return;

    const messageContent = input.trim();
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");

    queryClient.setQueryData<Conversation>(
      ["conversation", activeConversationId],
      (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: [
            ...(old.messages || []),
            { id: Date.now(), role: "user", content: messageContent, createdAt: new Date().toISOString() },
          ],
        };
      }
    );

    try {
      const response = await fetch(`/api/conversations/${activeConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent }),
        credentials: "include",
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  accumulated += data.content;
                  setStreamingContent(accumulated);
                }
                if (data.done) {
                  setIsStreaming(false);
                  setStreamingContent("");
                  queryClient.invalidateQueries({ queryKey: ["conversation", activeConversationId] });
                  queryClient.invalidateQueries({ queryKey: ["conversations"] });
                }
              } catch {}
            }
          }
        }
      }
    } catch (error) {
      console.error("Stream error:", error);
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  const handleVoiceToggle = async () => {
    if (isStreaming || isProcessingVoice) return;

    if (isRecording) {
      const audioBlob = await stopRecording();
      if (audioBlob.size === 0) return;

      if (!activeConversationId) {
        try {
          const res = await apiRequest("POST", "/api/conversations", { title: "Voice Chat" });
          const conv = await res.json();
          setActiveConversationId(conv.id);
          setShowConversations(false);
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          await sendVoiceMessage(conv.id, audioBlob);
        } catch (error) {
          console.error("Failed to create conversation for voice:", error);
        }
        return;
      }

      await sendVoiceMessage(activeConversationId, audioBlob);
    } else {
      try {
        await playback.init();
        await startRecording();
      } catch (error) {
        console.error("Microphone access denied:", error);
      }
    }
  };

  const sendVoiceMessage = async (conversationId: number, audioBlob: Blob) => {
    setIsProcessingVoice(true);
    setIsStreaming(true);
    setStreamingContent("");

    const base64Audio = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.readAsDataURL(audioBlob);
    });

    try {
      const response = await fetch(`/api/conversations/${conversationId}/voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64Audio }),
        credentials: "include",
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Voice request failed" }));
        throw new Error(err.error || "Voice request failed");
      }

      const streamReader = response.body?.getReader();
      if (!streamReader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullTranscript = "";

      playback.clear();

      while (true) {
        const { done, value } = await streamReader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          try {
            const event = JSON.parse(line.slice(6));

            switch (event.type) {
              case "user_transcript":
                queryClient.setQueryData<Conversation>(
                  ["conversation", conversationId],
                  (old) => {
                    if (!old) return old;
                    return {
                      ...old,
                      messages: [
                        ...(old.messages || []),
                        { id: Date.now(), role: "user", content: event.data, createdAt: new Date().toISOString() },
                      ],
                    };
                  }
                );
                setIsProcessingVoice(false);
                break;
              case "transcript":
                fullTranscript += event.data;
                setStreamingContent(fullTranscript);
                break;
              case "audio":
                playback.pushAudio(event.data);
                break;
              case "done":
                playback.signalComplete();
                setIsStreaming(false);
                setStreamingContent("");
                queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
                queryClient.invalidateQueries({ queryKey: ["conversations"] });
                break;
              case "error":
                throw new Error(event.error);
            }
          } catch (e) {
            if (!(e instanceof SyntaxError)) {
              console.error("Voice stream error:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Voice error:", error);
    } finally {
      setIsStreaming(false);
      setIsProcessingVoice(false);
      setStreamingContent("");
    }
  };

  const messages = activeConversation?.messages || [];

  if (!enabled) return null;

  return (
    <>
      <button
        data-testid="button-open-ai-chat"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          isOpen && "rotate-90 scale-0 opacity-0 pointer-events-none"
        )}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 w-[400px] h-[600px] max-h-[80vh] rounded-2xl shadow-2xl border bg-background flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        )}
      >
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
            {isPlayingAudio && (
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
                onClick={() => createConversation.mutate()}
                disabled={createConversation.isPending}
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
            <Button
              data-testid="button-close-ai-chat"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {showConversations ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b">
              <Button
                data-testid="button-start-new-chat"
                className="w-full gap-2"
                onClick={() => createConversation.mutate()}
                disabled={createConversation.isPending}
              >
                <Plus className="w-4 h-4" />
                New Chat
              </Button>
            </div>
            <ScrollArea className="flex-1">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <Bot className="w-12 h-12 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">No conversations yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Start a new chat with Marcela for hospitality analytics</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      data-testid={`conversation-item-${conv.id}`}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors group",
                        "hover:bg-muted/50",
                        activeConversationId === conv.id && "bg-muted"
                      )}
                      onClick={() => {
                        setActiveConversationId(conv.id);
                        setShowConversations(false);
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">{conv.title}</span>
                      </div>
                      <Button
                        data-testid={`button-delete-conversation-${conv.id}`}
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation.mutate(conv.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-4">
              {messages.length === 0 && !streamingContent ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-base mb-1">Hi, I'm Marcela</h3>
                  <p className="text-xs text-muted-foreground max-w-[250px]">
                    Ask me about hotel financials, market analysis, revenue management, or anything hospitality-related.
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-2 max-w-[250px]">
                    Tap the microphone to start a voice conversation.
                  </p>
                  <div className="mt-4 space-y-2 w-full max-w-[280px]">
                    {[
                      "What's a good cap rate for boutique hotels?",
                      "How can I use Industry Research for market insights?",
                      "How do management fees typically work?",
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        data-testid={`button-suggestion-${i}`}
                        className="w-full text-left text-xs p-2.5 rounded-lg border hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setInput(suggestion);
                          setTimeout(() => inputRef.current?.focus(), 0);
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      data-testid={`message-${msg.role}-${msg.id}`}
                      className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-3.5 py-2.5",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        )}
                      >
                        {msg.role === "assistant" ? (
                          <MarkdownContent content={msg.content} />
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isStreaming && streamingContent && (
                    <div className="flex gap-2.5 justify-start" data-testid="message-streaming">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                      <div className="max-w-[85%] rounded-2xl rounded-bl-md px-3.5 py-2.5 bg-muted">
                        <MarkdownContent content={streamingContent} />
                      </div>
                    </div>
                  )}

                  {isStreaming && !streamingContent && (
                    <div className="flex gap-2.5 justify-start" data-testid="message-loading">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex gap-1.5">
                          <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            <VoiceIndicator isRecording={isRecording} isPlaying={isPlayingAudio} />

            <div className="p-3 border-t bg-background">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  ref={inputRef}
                  data-testid="input-chat-message"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isRecording ? "Listening..." : "Ask anything..."}
                  disabled={isStreaming || isRecording}
                  className="text-sm"
                />
                <Button
                  data-testid="button-voice-toggle"
                  type="button"
                  size="icon"
                  variant={isRecording ? "destructive" : "outline"}
                  disabled={isStreaming && !isRecording}
                  className={cn("shrink-0 transition-all", isRecording && "animate-pulse")}
                  onClick={handleVoiceToggle}
                  title={isRecording ? "Stop recording" : "Start voice chat"}
                >
                  {isProcessingVoice ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isRecording ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  data-testid="button-send-message"
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isStreaming}
                  className="shrink-0"
                >
                  {isStreaming && !isProcessingVoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </>
  );
}
