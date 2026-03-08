import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquare, RefreshCw, ChevronDown, ChevronRight, Clock,
  Loader2, Inbox, Mic, Keyboard, Copy, Check, AlertCircle,
  BarChart2, CheckCircle2, XCircle, Play, Pause,
} from "lucide-react";
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
  if (status === "failed") return "border-red-200 text-red-700 bg-red-50/80";
  return "border-muted-foreground/20 text-muted-foreground bg-muted/30";
}

function NativeAudioPlayer({ conversationId }: { conversationId: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

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

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  if (unavailable) return null;

  if (!src) {
    return (
      <button
        type="button"
        onClick={handleLoad}
        disabled={loading}
        className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors disabled:opacity-50"
        data-testid={`button-load-audio-${conversationId}`}
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
        {loading ? "Loading…" : "Play"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />
      <button
        type="button"
        onClick={togglePlay}
        className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        data-testid={`button-toggle-audio-${conversationId}`}
      >
        {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        {isPlaying ? "Pause" : "Play"}
      </button>
    </div>
  );
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

  if (!data) {
    return (
      <div className="py-6 text-center">
        <AlertCircle className="w-5 h-5 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground/60">Could not load conversation details</p>
      </div>
    );
  }

  const transcript: any[] = data.transcript ?? [];
  const analysis = data.analysis ?? {};
  const summary = analysis.transcript_summary || data.metadata?.call_summary;
  const evaluation = analysis.evaluation_criteria_results;

  const handleCopy = () => {
    const text = transcript
      .map((line: any) => `[${line.role}]: ${line.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-3">
      {summary && (
        <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Summary</p>
          <p className="text-xs text-foreground/80 leading-relaxed">{summary}</p>
        </div>
      )}

      {evaluation && (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(evaluation).map(([key, result]: [string, any]) => (
            <Badge
              key={key}
              variant="outline"
              className={`text-[10px] ${result?.result === "success" ? "border-green-200 text-green-700 bg-green-50/50" : "border-muted-foreground/20"}`}
            >
              {key}: {result?.result || "—"}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <NativeAudioPlayer conversationId={id} />
          <span className="text-[10px] text-muted-foreground/40">
            {transcript.length} messages
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 px-2 gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground"
          data-testid={`button-copy-transcript-${id}`}
        >
          {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      {transcript.length > 0 && (
        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
          {transcript.map((line: any, i: number) => (
            <div
              key={i}
              className={`flex gap-2.5 p-2 rounded-lg text-xs ${
                line.role === "user" ? "bg-muted/30" : "bg-card"
              }`}
            >
              <div className={`shrink-0 mt-0.5 flex items-center gap-1 ${
                line.role === "user" ? "text-muted-foreground/50" : "text-primary/60"
              }`}>
                {line.role === "user" ? "You" : "AI"}
                {line.time_in_call_secs !== undefined && (
                  <span className="text-[10px] text-muted-foreground/30">{line.time_in_call_secs}s</span>
                )}
                {line.source_medium === "text"
                  ? <Keyboard className="w-2.5 h-2.5" />
                  : line.role === "user" ? <Mic className="w-2.5 h-2.5" /> : null}
              </div>
              <p className="text-foreground/80 leading-relaxed">{line.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
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
            { label: "Total", value: total, icon: <BarChart2 className="w-4 h-4 text-muted-foreground" />, color: "from-primary/10 to-primary/5" },
            { label: "Successful", value: successful, icon: <CheckCircle2 className="w-4 h-4 text-green-600" />, color: "from-green-500/10 to-green-500/5" },
            { label: "Avg Duration", value: formatDuration(avgDuration), icon: <Clock className="w-4 h-4 text-muted-foreground" />, color: "from-blue-500/10 to-blue-500/5" },
          ].map((stat) => (
            <div key={stat.label} className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} border border-border/60`}>
              <div className="flex items-center gap-1.5 mb-1">
                {stat.icon}
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{stat.label}</span>
              </div>
              <p className="text-lg font-bold font-display">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">Conversation History</CardTitle>
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
                const count = f === "all" ? total : counts[f as keyof typeof counts];
                return (
                  <Button
                    key={f}
                    variant={filter === f ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(f)}
                    className="h-6 px-2 text-[10px] gap-1"
                    data-testid={`filter-${f}`}
                  >
                    {f === "all" ? "All" : f === "done" ? "Done" : f === "failed" ? "Failed" : "Active"}
                    <span className="opacity-60">{count}</span>
                  </Button>
                );
              })}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="py-12 text-center">
              <Inbox className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground/60 font-medium">
                {total === 0 ? "No conversations yet" : "No conversations match this filter"}
              </p>
            </div>
          )}

          {!isLoading && filtered.length > 0 && (
            <div className="divide-y divide-border/60">
              {filtered.map((conv: any) => (
                <div key={conv.conversation_id} data-testid={`conversation-${conv.conversation_id}`}>
                  <button
                    type="button"
                    onClick={() => toggle(conv.conversation_id)}
                    className="w-full flex items-start gap-3 py-3 px-1 hover:bg-muted/30 rounded-lg transition-colors text-left"
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
