import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Wrench, Monitor, Server, Loader2, CheckCircle2, XCircle, RefreshCw, AlertCircle, Zap } from "lucide-react";
import { useToolsStatus, useConfigureAgentTools } from "./hooks";

interface ToolInfo {
  name: string;
  type: string;
  description: string;
  registered: boolean;
}

interface ToolsStatusProps {
  agentName: string;
}

export function ToolsStatus({ agentName }: ToolsStatusProps) {
  const { data: tools, isLoading, error, refetch } = useToolsStatus();
  const configureMutation = useConfigureAgentTools();

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardContent className="py-16 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Querying tool registration status...</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Comparing local tool definitions against the ElevenLabs agent</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardContent className="py-10">
          <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-xl border border-amber-200/60">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">Tools status unavailable</p>
              <p className="text-xs text-amber-700/80 mt-1 leading-relaxed">{(error as Error).message}</p>
              <Button variant="ghost" size="sm" className="mt-3 gap-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-100/50 -ml-2" onClick={() => refetch()}>
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const clientTools = (tools as ToolInfo[])?.filter((t) => t.type === "client") || [];
  const serverTools = (tools as ToolInfo[])?.filter((t) => t.type === "webhook") || [];
  const allRegistered = (tools as ToolInfo[])?.every((t) => t.registered) ?? false;
  const registeredCount = (tools as ToolInfo[])?.filter((t) => t.registered).length ?? 0;
  const totalCount = (tools as ToolInfo[])?.length ?? 0;

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display text-base">Agent Tools</CardTitle>
                <CardDescription className="label-text mt-0.5">
                  Tools registered on the ElevenLabs agent — {agentName} uses these for navigation and live data retrieval
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-1">
                <div className="flex items-center gap-2 justify-end">
                  <div className={`w-2 h-2 rounded-full ${allRegistered ? "bg-green-500" : "bg-amber-500"} animate-pulse`} />
                  <span className="text-sm font-semibold tabular-nums">{registeredCount}/{totalCount}</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                  {allRegistered ? "All Active" : "Needs Sync"}
                </span>
              </div>
              <Button
                size="sm"
                variant={allRegistered ? "outline" : "default"}
                onClick={() => configureMutation.mutate(undefined, { onSuccess: () => refetch() })}
                disabled={configureMutation.isPending}
                className="gap-1.5 shadow-sm"
                data-testid="button-configure-tools"
              >
                {configureMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                {configureMutation.isPending ? "Syncing..." : "Sync All Tools"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Monitor className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Client-Side Tools</h4>
              <Badge variant="outline" className="text-[10px] ml-auto border-blue-200 text-blue-600 bg-blue-50/50">
                {clientTools.filter(t => t.registered).length}/{clientTools.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground/60 mb-3 pl-6">
              Execute in the user's browser — page navigation, tour control, UI interactions
            </p>
            <div className="grid gap-1.5">
              {clientTools.map((tool) => (
                <ToolRow key={tool.name} tool={tool} />
              ))}
            </div>
          </div>

          <Separator className="bg-primary/8" />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Server className="w-4 h-4 text-violet-600" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Server-Side Webhooks</h4>
              <Badge variant="outline" className="text-[10px] ml-auto border-violet-200 text-violet-600 bg-violet-50/50">
                {serverTools.filter(t => t.registered).length}/{serverTools.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground/60 mb-3 pl-6">
              Called by ElevenLabs via HTTP — property data, portfolio analytics, scenario comparisons
            </p>
            <div className="grid gap-1.5">
              {serverTools.map((tool) => (
                <ToolRow key={tool.name} tool={tool} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ToolRow({ tool }: { tool: ToolInfo }) {
  return (
    <div
      className="group flex items-center justify-between py-2.5 px-3.5 rounded-lg border border-transparent hover:border-primary/10 hover:bg-primary/[0.02] transition-all duration-200"
      data-testid={`tool-row-${tool.name}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${tool.registered ? "bg-green-500" : "bg-red-400"}`} />
        <div className="min-w-0">
          <p className="text-sm font-mono font-medium truncate text-foreground/90">{tool.name}</p>
          <p className="text-[11px] text-muted-foreground/60 truncate leading-relaxed">{tool.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 ml-3">
        {tool.registered ? (
          <CheckCircle2 className="w-4 h-4 text-green-500/80" />
        ) : (
          <XCircle className="w-4 h-4 text-red-400" />
        )}
      </div>
    </div>
  );
}
