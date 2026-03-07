import { useCallback, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/features/ai-agent/components/conversation";
import { ConversationBar } from "@/features/ai-agent/components/conversation-bar";
import { Message, MessageContent } from "@/features/ai-agent/components/message";
import { Orb } from "@/features/ai-agent/components/orb";
import { Response } from "@/features/ai-agent/components/response";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMarcelaSettings } from "@/features/ai-agent/hooks/use-agent-settings";
import { useAdminSignedUrl } from "@/features/ai-agent/hooks/use-signed-url";
import { useAuth } from "@/lib/auth";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface VoiceChatBarProps {
  className?: string;
  onSessionChange?: (active: boolean) => void;
}

export default function VoiceChatBar({ className, onSessionChange }: VoiceChatBarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: settings } = useMarcelaSettings();
  // useAdminSignedUrl auto-fetches on mount — data is ready before first click
  const { data: signedUrl, refetch: refetchSignedUrl } = useAdminSignedUrl();
  const { user } = useAuth();

  const agentName = settings?.aiAgentName ?? "Marcela";

  const handleDisconnect = useCallback(() => {
    setMessages([]);
    // Pre-fetch the next signed URL so it's ready for the following session
    refetchSignedUrl();
  }, [refetchSignedUrl]);

  const dynamicVariables = {
    user_name: user?.name ?? "Guest",
    user_role: user?.role ?? "user",
    current_page: window.location.pathname,
  };

  return (
    <div className={cn("relative mx-auto h-[600px] w-full", className)}>
      <Card className="flex h-full w-full flex-col gap-0 overflow-hidden">
        <CardContent className="relative flex-1 overflow-hidden p-0">
          <Conversation className="absolute inset-0 pb-[88px]">
            <ConversationContent className="flex min-w-0 flex-col gap-2 p-6 pb-6">
              {messages.length === 0 ? (
                <ConversationEmptyState
                  icon={<Orb className="size-12" />}
                  title={errorMessage ? "Connection failed" : "Start a conversation"}
                  description={errorMessage ?? "Tap the phone button or type a message"}
                />
              ) : (
                messages.map((message, index) => (
                  <div key={index} className="flex w-full flex-col gap-1">
                    <Message from={message.role}>
                      <MessageContent className="max-w-full min-w-0">
                        <Response className="w-auto [overflow-wrap:anywhere] whitespace-pre-wrap">
                          {message.content}
                        </Response>
                      </MessageContent>
                      {message.role === "assistant" && (
                        <div className="ring-border size-6 flex-shrink-0 self-end overflow-hidden rounded-full ring-1">
                          <Orb className="h-full w-full" />
                        </div>
                      )}
                    </Message>
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                className={cn("text-muted-foreground hover:text-foreground relative size-9 p-1.5")}
                                size="sm"
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                  navigator.clipboard.writeText(message.content);
                                  setCopiedIndex(index);
                                  setTimeout(() => setCopiedIndex(null), 2000);
                                }}
                              >
                                {copiedIndex === index ? (
                                  <CheckIcon className="size-4" />
                                ) : (
                                  <CopyIcon className="size-4" />
                                )}
                                <span className="sr-only">
                                  {copiedIndex === index ? "Copied!" : "Copy"}
                                </span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{copiedIndex === index ? "Copied!" : "Copy"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                ))
              )}
            </ConversationContent>
            <ConversationScrollButton className="bottom-[100px]" />
          </Conversation>

          <div className="absolute right-0 bottom-0 left-0 flex justify-center">
            <ConversationBar
              className="w-full max-w-2xl"
              signedUrl={signedUrl}
              agentId={settings?.marcelaAgentId}
              dynamicVariables={dynamicVariables}
              agentLabel={agentName}
              onConnect={() => { setMessages([]); setErrorMessage(null); onSessionChange?.(true); }}
              onDisconnect={() => { handleDisconnect(); onSessionChange?.(false); }}
              onSendMessage={(message) =>
                setMessages((prev) => [...prev, { role: "user", content: message }])
              }
              onMessage={(message) =>
                setMessages((prev) => [
                  ...prev,
                  {
                    role: message.source === "user" ? "user" : "assistant",
                    content: message.message,
                  },
                ])
              }
              onError={(error) => {
                console.error("Conversation error:", error);
                setErrorMessage(error.message || "Connection failed");
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
