import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { IconWrench, IconMonitor, IconServer, IconCpu, IconRefreshCw, IconAlertCircle, IconExternalLink } from "@/components/icons";
import StatusIndicator from "@/components/ui/status-indicator";
import { useAgentConfig } from "@/features/ai-agent/hooks/use-convai-api";

const TYPE_META: Record<string, { label: string; icon: typeof IconMonitor; color: string; badge: string }> = {
  client:  { label: "Client", icon: IconMonitor, color: "text-muted-foreground",   badge: "border-blue-200 text-muted-foreground bg-blue-50/50" },
  webhook: { label: "Server", icon: IconServer,  color: "text-violet-600", badge: "border-violet-200 text-violet-600 bg-violet-50/50" },
  system:  { label: "System", icon: IconCpu,     color: "text-muted-foreground",    badge: "border-border text-muted-foreground bg-muted" },
};

interface ToolsStatusProps {
  agentName: string;
}

export function ToolsStatus({ agentName }: ToolsStatusProps) {
  const { data: agent, isLoading, error, refetch } = useAgentConfig();

  if (isLoading) {
    return (
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardContent className="py-16 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted mb-4">
            <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading tools from ElevenLabs...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardContent className="py-10">
          <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-xl border border-amber-200/60">
            <IconAlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Could not load agent tools</p>
              <p className="text-xs text-amber-700/80 mt-1">{(error as Error).message}</p>
              <Button variant="ghost" size="sm" className="mt-3 gap-1.5 text-amber-700 hover:bg-amber-100/50 -ml-2" onClick={() => refetch()}>
                <IconRefreshCw className="w-3.5 h-3.5" /> Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tools: any[] = (agent as any)?.conversation_config?.agent?.prompt?.tools ?? [];
  const byType = tools.reduce((acc: Record<string, any[]>, t: any) => {
    const k = t.type ?? "other";
    (acc[k] = acc[k] ?? []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <IconWrench className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">Active Tools</CardTitle>
                <CardDescription className="label-text mt-0.5">
                  Tools configured on {agentName} in ElevenLabs — manage them in the{" "}
                  <a href="https://elevenlabs.io/app/conversational-ai" target="_blank" rel="noopener noreferrer" className="text-muted-foreground underline inline-flex items-center gap-0.5">
                    ElevenLabs dashboard <IconExternalLink className="w-3 h-3" />
                  </a>
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tabular-nums text-muted-foreground">{tools.length} tools</span>
              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => refetch()}>
                <IconRefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {tools.length === 0 && (
            <p className="text-sm text-muted-foreground/60 text-center py-6">No tools configured on this agent yet.</p>
          )}
          {Object.entries(byType).map(([type, group]) => {
            const meta = TYPE_META[type] ?? { label: type, icon: IconWrench, color: "text-muted-foreground", badge: "" };
            const Icon = meta.icon;
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${meta.color}`} />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">{meta.label} Tools</h4>
                  <Badge variant="outline" className={`text-[10px] ml-auto ${meta.badge}`}>{group.length}</Badge>
                </div>
                <div className="grid gap-1">
                  {group.map((tool: any) => (
                    <div key={tool.name} className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors">
                      <StatusIndicator state="active" size="sm" className="gap-0 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-mono font-medium text-foreground/90">{tool.name}</p>
                        {tool.description && (
                          <p className="text-[11px] text-muted-foreground/60 leading-relaxed mt-0.5">{tool.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
