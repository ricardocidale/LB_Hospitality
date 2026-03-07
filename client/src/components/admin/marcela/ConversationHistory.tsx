import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquare, RefreshCw, ChevronDown, ChevronRight, Clock,
  Loader2, Inbox, Mic, Keyboard, Copy, Check, AlertCircle,
  BarChart2, CheckCircle2, XCircle, Play,
} from "lucide-react";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ui/conversation";
import { Message, MessageContent } from "@/components/ui/message";
import { useConversations, useConversation } from "./hooks";
import {
  AudioPlayerProvider,
  AudioPlayerButton,
  AudioPlayerProgress,
  AudioPlayerTime,
  AudioPlayerDuration,
} from "@/components/ui/audio-player";

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
  if (status === "failed") return "border-red-200 text-red-700 bg-red-50/80";
  return "border-muted-foreground/20 text-muted-foreground bg-muted/30";
}

function ConversationDetail({ id }: { id: string }) {
  const { data, isLoading } = useConversation(id);
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="py-6 flex justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const transcript: any[] = data?.transcript ?? [];
  const terminationReason = data?.metadata?.termination_reason;

  if (!transcript.length) {
    return <p className="text-xs text-muted-foreground/60 py-4 text-center">No transcript available.</p>;
  }

  const handleCopyTranscript = () => {
    const text = transcript
      .map((line: any) => `${line.role === "agent" ? "Agent" : "User"}: ${line.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-2 pt-2">
      {terminationReason && (
        <div className="flex items-start gap-2 p-2.5 bg-red-50/80 rounded-lg border border-red-200/60 text-xs text-red-700">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{terminationReason}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <AudioPlayer conversationId={id} />
        <button
          type="button"
          onClick={handleCopyTranscript}
          className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy transcript"}
        </button>
      </div>
      <Conversation className="max-h-72">
        <ConversationContent className="p-0">
          {transcript.map((line: any, i: number) => (
            <Message key={i} from={line.role === "agent" ? "assistant" : "user"} className="py-1.5 px-1">
              <MessageContent variant="contained" className="text-xs leading-relaxed">
                {line.message}
                <div className="flex items-center gap-1.5 mt-1 opacity-50">
                  {line.time_in_call_secs != null && (
                    <span className="text-[10px]">{line.time_in_call_secs}s</span>
                  )}
                  {line.source_medium === "text"
                    ? <Keyboard className="w-2.5 h-2.5" />
                    : line.role === "user"
                      ? <Mic className="w-2.5 h-2.5" />
                      : null}
                </div>
              </MessageContent>
            </Message>
          ))}
          <ConversationScrollButton />
        </ConversationContent>
      </Conversation>
    </div>
  );
}

function AudioPlayer({ conversationId }: { conversationId: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  const handleLoad = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/convai/conversations/${conversationId}/audio`, { credentials: "include" });
      if (!res.ok) throw new Error("Audio unavailable");
      const blob = await res.blob();
      setSrc(URL.createObjectURL(blob));
    } catch {
      setUnavailable(true);
    } finally {
      setLoading(false);
    }
  };

  if (unavailable) return null;

  if (!src) {
    return (
      <button
        type="button"
        onClick={handleLoad}
        disabled={loading}
        className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-gray-600 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
        {loading ? "Loading…" : "Play"}
      </button>
    );
  }

  const item = { id: conversationId, src };
  return (
    <AudioPlayerProvider>
      <div className="flex items-center gap-2">
        <AudioPlayerButton
          item={item}
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0 text-muted-foreground/60 hover:text-gray-600"
        />
        <AudioPlayerProgress className="w-28" />
        <AudioPlayerTime className="text-[10px]" />
        <span className="text-[10px] text-muted-foreground/30">/</span>
        <AudioPlayerDuration className="text-[10px]" />
      </div>
    </AudioPlayerProvider>
  );
}

type FilterType = "all" | "done" | "failed" | "in-progress";

export function ConversationHistory() {
  const { data: conversations, isLoading, refetch, isFetching } = useConversations();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

  const all = conversations ?? [];
  const total = all.length;
  const successful = all.filter((c: any) => c.call_successful === "success").length;
  const failed = all.filter((c: any) => c.call_successful === "failure").length;
  const avgDuration = total > 0
    ? Math.round(all.reduce((sum: number, c: any) => sum + (c.call_duration_secs ?? 0), 0) / total)
    : 0;

  const counts = {
    done: all.filter((c: any) => c.status === "done" || c.status === "completed").length,
    failed,
    "in-progress": all.filter((c: any) => c.status === "in-progress" || c.status === "active").length,
  };

  const filtered = all.filter((c: any) => {
    if (filter === "all") return true;
    if (filter === "done") return c.status === "done" || c.status === "completed";
    if (filter === "failed") return c.status === "failed";
    if (filter === "in-progress") return c.status === "in-progress" || c.status === "active";
    return true;
  });

  return (
    <div className="space-y-4">
      {total > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: total, icon: <BarChart2 className="w-4 h-4 text-gray-600" />, color: "from-primary/10 to-primary/5" },
            { label: "Successful", value: successful, icon: <CheckCircle2 className="w-4 h-4 text-green-600" />, color: "from-green-500/10 to-green-500/5" },
            { label: "Avg Duration", value: formatDuration(avgDuration), icon: <Clock className="w-4 h-4 text-gray-600" />, color: "from-blue-500/10 to-blue-500/5" },
          ].map((stat) => (
            <div key={stat.label} className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} border border-gray-200/60`}>
              <div className="flex items-center gap-1.5 mb-1">
                {stat.icon}
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{stat.label}</span>
              </div>
              <p className="text-lg font-bold font-display">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <Card className="bg-white border border-gray-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-gray-900">Conversation History</CardTitle>
                <CardDescription className="label-text mt-0.5">
                  Recent conversations from the ElevenLabs agent — auto-refreshes every minute
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {total > 0 && (
            <div className="flex gap-1.5 pt-1 flex-wrap">
              {(["all", "done", "failed", "in-progress"] as FilterType[]).map((f) => {
                const count = f === "all" ? total : counts[f];
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors capitalize ${
                      filter === f
                        ? "bg-primary text-gray-600-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {f === "all" ? "All" : f} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground/50">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm">Loading conversations...</p>
            </div>
          ) : !total ? (
            <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground/50">
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Inbox className="w-7 h-7" />
              </div>
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-xs text-center max-w-xs">Once users start chatting with the agent, conversations will appear here.</p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 py-8 text-center">No {filter} conversations.</p>
          ) : (
            <div className="divide-y divide-primary/5">
              {filtered.map((conv: any) => (
                <div key={conv.conversation_id}>
                  <button
                    type="button"
                    onClick={() => toggle(conv.conversation_id)}
                    className="w-full flex items-start gap-3 py-3 px-1 hover:bg-gray-50/30 rounded-lg transition-colors text-left"
                  >
                    <div className="shrink-0 text-muted-foreground/40 mt-0.5">
                      {expanded === conv.conversation_id
                        ? <ChevronDown className="w-4 h-4" />
                        : <ChevronRight className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {conv.call_summary_title ? (
                          <span className="text-xs font-medium text-foreground/80 truncate">{conv.call_summary_title}</span>
                        ) : (
                          <span className="text-xs font-mono text-muted-foreground/60 truncate">{conv.conversation_id.slice(0, 20)}…</span>
                        )}
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${statusColor(conv.status)}`}>
                          {conv.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-[11px] text-muted-foreground/50 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{formatTime(conv.start_time_unix_secs)}
                        </span>
                        <span className="text-[11px] text-muted-foreground/50">{formatDuration(conv.call_duration_secs)}</span>
                        {conv.call_successful === "failure" && (
                          <span className="text-[10px] text-red-500/70 flex items-center gap-0.5">
                            <XCircle className="w-3 h-3" /> failed
                          </span>
                        )}
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
