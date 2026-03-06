import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Plus,
  Trash2,
  Bot,
  Globe,
  Phone,
  PhoneCall,
  MessageCircle,
} from "lucide-react";
import { useChat, useVoice } from "./hooks";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ChatHeader } from "./ChatHeader";

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function ChannelIcon({ channel, className }: { channel?: string; className?: string }) {
  switch (channel) {
    case "phone":
      return <Phone className={cn("w-3.5 h-3.5 text-blue-500", className)} />;
    case "sms":
      return <MessageCircle className={cn("w-3.5 h-3.5 text-green-500", className)} />;
    default:
      return <Globe className={cn("w-3.5 h-3.5 text-muted-foreground", className)} />;
  }
}

export default function AIChatWidget({ enabled = false }: { enabled?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const {
    conversations,
    phoneInfo,
    activeConversation,
    createConversation,
    deleteConversation,
    sendMessage,
    streamingContent,
    setStreamingContent,
    isStreaming,
    setIsStreaming,
  } = useChat(isOpen, activeConversationId, setActiveConversationId, setShowConversations);

  const {
    voiceState,
    voiceError,
    isRecording,
    isPlayingAudio,
    handleVoiceToggle,
    retryVoice,
  } = useVoice(
    activeConversationId,
    setActiveConversationId,
    setShowConversations,
    isStreaming,
    setIsStreaming,
    setStreamingContent,
    streamingContent
  );

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

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

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
        <ChatHeader
          showConversations={showConversations}
          setShowConversations={setShowConversations}
          activeConversationId={activeConversationId}
          voiceState={voiceState}
          createConversation={() => createConversation.mutate()}
          isCreating={createConversation.isPending}
          onClose={() => setIsOpen(false)}
        />

        {showConversations ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b space-y-2">
              <Button
                data-testid="button-start-new-chat"
                className="w-full gap-2"
                onClick={() => createConversation.mutate()}
                disabled={createConversation.isPending}
              >
                <Plus className="w-4 h-4" />
                New Chat
              </Button>
              {phoneInfo?.enabled && phoneInfo.phoneNumber && (
                <a
                  href={`tel:${phoneInfo.phoneNumber}`}
                  data-testid="link-call-marcela"
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <PhoneCall className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-blue-900">Call Marcela</p>
                    <p className="text-xs text-blue-600">{formatPhoneDisplay(phoneInfo.phoneNumber)}</p>
                  </div>
                </a>
              )}
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
                        "flex items-center gap-2 w-full p-2.5 rounded-lg hover:bg-muted/60 transition-colors group cursor-pointer text-left",
                        activeConversationId === conv.id && "bg-muted shadow-sm"
                      )}
                      onClick={() => {
                        setActiveConversationId(conv.id);
                        setShowConversations(false);
                      }}
                    >
                      <ChannelIcon channel={conv.channel} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{conv.title}</p>
                        <p className="text-[10px] text-muted-foreground/60">{new Date(conv.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Button
                        data-testid={`button-delete-conversation-${conv.id}`}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation.mutate(conv.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          <>
            <ChatMessages
              messages={activeConversation?.messages || []}
              streamingContent={streamingContent}
              voiceState={voiceState}
              messagesEndRef={messagesEndRef}
            />
            <ChatInput
              input={input}
              setInput={setInput}
              onSend={handleSend}
              isStreaming={isStreaming}
              isRecording={isRecording}
              isPlayingAudio={isPlayingAudio}
              handleVoiceToggle={handleVoiceToggle}
              voiceError={voiceError}
              retryVoice={retryVoice}
              inputRef={inputRef}
            />
          </>
        )}
      </div>
    </>
  );
}
