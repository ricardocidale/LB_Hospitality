import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, RefreshCw, ChevronDown, ChevronRight, Clock, User, Bot, Loader2, Inbox } from "lucide-react";
import { useConversations, useConversation } from "./hooks";

function formatDuration(secs?: number) {
  if (!secs) return "—";
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

function formatTime(unix?: number) {
  if (!unix) return "—";
  return new Date(unix * 1000).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function statusColor(status: string) {
  if (status === "done" || status === "completed") return "border-green-200 text-green-700 bg-green-50/80";
  if (status === "in-progress" || status === "active") return "border-blue-200 text-blue-700 bg-blue-50/80";
  return "border-muted-foreground/20 text-muted-foreground bg-muted/30";
}

function ConversationDetail({ id }: { id: string }) {
  const { data, isLoading } = useConversation(id);

  if (isLoading) {
    return (
      <div className="py-6 flex justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const transcript: any[] = data?.transcript ?? [];

  if (!transcript.length) {
    return <p className="text-xs text-muted-foreground/60 py-4 text-center">No transcript available.</p>;
  }

  return (
    <div className="space-y-2 pt-2 max-h-72 overflow-y-auto pr-1">
      {transcript.map((line: any, i: number) => (
        <div key={i} className={`flex gap-2.5 ${line.role === "agent" ? "flex-row" : "flex-row-reverse"}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${line.role === "agent" ? "bg-primary/10" : "bg-blue-100"}`}>
            {line.role === "agent"
              ? <Bot className="w-3 h-3 text-primary" />
              : <User className="w-3 h-3 text-blue-600" />}
          </div>
          <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${line.role === "agent" ? "bg-primary/5 text-foreground/90" : "bg-blue-50 text-foreground/90"}`}>
            {line.message}
            {line.time_in_call_secs != null && (
              <span className="block text-[10px] text-muted-foreground/50 mt-1">{line.time_in_call_secs}s</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConversationHistory() {
  const { data: conversations, isLoading, refetch, isFetching } = useConversations();
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display text-base">Conversation History</CardTitle>
                <CardDescription className="label-text mt-0.5">
                  Recent conversations from the ElevenLabs agent — auto-refreshes every minute
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground/50">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm">Loading conversations...</p>
            </div>
          ) : !conversations?.length ? (
            <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground/50">
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Inbox className="w-7 h-7" />
              </div>
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-xs text-center max-w-xs">Once users start chatting with the agent, conversations will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-primary/5">
              {conversations.map((conv: any) => (
                <div key={conv.conversation_id}>
                  <button
                    type="button"
                    onClick={() => toggle(conv.conversation_id)}
                    className="w-full flex items-center gap-3 py-3 px-1 hover:bg-primary/[0.02] rounded-lg transition-colors text-left"
                  >
                    <div className="shrink-0 text-muted-foreground/40">
                      {expanded === conv.conversation_id
                        ? <ChevronDown className="w-4 h-4" />
                        : <ChevronRight className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground/60 truncate">{conv.conversation_id.slice(0, 20)}…</span>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${statusColor(conv.status)}`}>
                          {conv.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-muted-foreground/50 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{formatTime(conv.start_time_unix_secs)}
                        </span>
                        <span className="text-[11px] text-muted-foreground/50">{formatDuration(conv.call_duration_secs)}</span>
                      </div>
                    </div>
                  </button>
                  {expanded === conv.conversation_id && (
                    <div className="px-8 pb-3">
                      <ConversationDetail id={conv.conversation_id} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
