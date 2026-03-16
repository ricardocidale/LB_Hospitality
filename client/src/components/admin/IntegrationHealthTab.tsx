import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2 } from "@/components/icons/themed-icons";
import { IconActivity, IconRefreshCw, IconTrash } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";

interface IntegrationStatus {
  name: string;
  healthy: boolean;
  latencyMs: number;
  lastError?: string;
  lastErrorAt?: number;
  circuitState: "closed" | "open" | "half-open";
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  invalidations: number;
  keyCount: number;
  connected: boolean;
}

function CircuitBadge({ state }: { state: string }) {
  const variant = state === "closed" ? "default" : state === "open" ? "destructive" : "secondary";
  return <Badge variant={variant} data-testid={`badge-circuit-${state}`}>{state.toUpperCase()}</Badge>;
}

function HealthBadge({ healthy }: { healthy: boolean }) {
  return (
    <Badge variant={healthy ? "default" : "destructive"} data-testid={`badge-health-${healthy}`}>
      {healthy ? "Healthy" : "Unhealthy"}
    </Badge>
  );
}

export default function IntegrationHealthTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [propertyId, setPropertyId] = useState("");

  const { data: integrations, isLoading: loadingHealth, refetch: refetchHealth } = useQuery<IntegrationStatus[]>({
    queryKey: ["/api/admin/integrations/health"],
    staleTime: 30_000,
  });

  const { data: cacheStats, isLoading: loadingCache, refetch: refetchCache } = useQuery<CacheStats>({
    queryKey: ["/api/admin/integrations/cache/stats"],
    staleTime: 30_000,
  });

  const clearAllCache = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/integrations/cache/clear");
    },
    onSuccess: () => {
      toast({ title: "Cache cleared" });
      refetchCache();
    },
  });

  const clearPropertyCache = useMutation({
    mutationFn: async (pid: string) => {
      await apiRequest("POST", `/api/admin/integrations/cache/clear-property/${pid}`);
    },
    onSuccess: () => {
      toast({ title: "Property cache cleared" });
      refetchCache();
      setPropertyId("");
    },
  });

  if (loadingHealth || loadingCache) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hitRate = cacheStats && cacheStats.hits + cacheStats.misses > 0
    ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6" data-testid="integration-health-tab">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Integration Health</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { refetchHealth(); refetchCache(); }}
          data-testid="button-refresh-health"
        >
          <IconRefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(integrations || []).map((integration) => (
          <Card key={integration.name} data-testid={`card-integration-${integration.name}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{integration.name}</CardTitle>
                <div className="flex gap-2">
                  <HealthBadge healthy={integration.healthy} />
                  <CircuitBadge state={integration.circuitState} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Latency</span>
                  <span data-testid={`text-latency-${integration.name}`}>{integration.latencyMs}ms</span>
                </div>
                {integration.lastError && (
                  <div className="flex justify-between">
                    <span>Last Error</span>
                    <span className="text-destructive text-xs truncate max-w-48" title={integration.lastError}>
                      {integration.lastError}
                    </span>
                  </div>
                )}
                {integration.lastErrorAt && (
                  <div className="flex justify-between">
                    <span>Error At</span>
                    <span className="text-xs">{new Date(integration.lastErrorAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card data-testid="card-cache-stats">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <IconActivity className="w-4 h-4" />
            Cache Statistics
            <Badge variant={cacheStats?.connected ? "default" : "secondary"}>
              {cacheStats?.connected ? "Connected" : "Disconnected"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Hit Rate</p>
              <p className="font-semibold" data-testid="text-cache-hit-rate">{hitRate}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Hits</p>
              <p className="font-semibold" data-testid="text-cache-hits">{cacheStats?.hits ?? 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Misses</p>
              <p className="font-semibold" data-testid="text-cache-misses">{cacheStats?.misses ?? 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Keys</p>
              <p className="font-semibold" data-testid="text-cache-keys">{cacheStats?.keyCount ?? 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Invalidations</p>
              <p className="font-semibold" data-testid="text-cache-invalidations">{cacheStats?.invalidations ?? 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <Input
              placeholder="Property ID"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-32"
              data-testid="input-property-id"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => propertyId && clearPropertyCache.mutate(propertyId)}
              disabled={!propertyId || clearPropertyCache.isPending}
              data-testid="button-clear-property-cache"
            >
              <IconTrash className="w-3 h-3 mr-1" />
              Clear Property
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => clearAllCache.mutate()}
              disabled={clearAllCache.isPending}
              data-testid="button-clear-all-cache"
            >
              <IconTrash className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
