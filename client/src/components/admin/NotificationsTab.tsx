import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, TestTube, Bell, MessageSquare, Mail, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import type { AlertRule, Property } from "@shared/schema";

const METRIC_OPTIONS = [
  { value: "dscr", label: "DSCR" },
  { value: "cap_rate", label: "Cap Rate" },
  { value: "occupancy", label: "Occupancy" },
  { value: "noi_variance", label: "NOI Variance" },
];

const OPERATOR_OPTIONS = [
  { value: "<", label: "Less than (<)" },
  { value: ">", label: "Greater than (>)" },
  { value: "=", label: "Equals (=)" },
  { value: "!=", label: "Not equals (≠)" },
];

const SCOPE_OPTIONS = [
  { value: "all", label: "All Properties" },
  { value: "specific", label: "Specific Property" },
  { value: "portfolio", label: "Portfolio Level" },
];

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
    sent: { variant: "default", icon: CheckCircle },
    delivered: { variant: "default", icon: CheckCircle },
    pending: { variant: "secondary", icon: Clock },
    failed: { variant: "destructive", icon: XCircle },
    bounced: { variant: "destructive", icon: AlertTriangle },
  };
  const { variant, icon: Icon } = config[status] || config.pending;
  return (
    <Badge variant={variant} className="gap-1" data-testid={`status-badge-${status}`}>
      <Icon className="w-3 h-3" />
      {status}
    </Badge>
  );
}

export default function NotificationsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("channels");
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<AlertRule> | null>(null);

  const { data: settings = {} } = useQuery<Record<string, string | null>>({
    queryKey: ["/api/notifications/settings"],
  });

  const { data: alertRulesList = [] } = useQuery<AlertRule[]>({
    queryKey: ["/api/notifications/alert-rules"],
  });

  const { data: logs = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications/logs"],
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  const [sendgridEnabled, setSendgridEnabled] = useState(false);

  useEffect(() => {
    if (settings.slack_webhook_url) setSlackWebhookUrl(settings.slack_webhook_url);
    setSendgridEnabled(settings.sendgrid_enabled === "true");
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (updates: Record<string, string | null>) => {
      await apiRequest("PUT", "/api/notifications/settings", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/settings"] });
      toast({ title: "Settings saved" });
    },
  });

  const testSlackMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/notifications/test-slack", { webhookUrl: slackWebhookUrl });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.success) {
        toast({ title: "Slack test successful", description: "Check your Slack channel for the test message" });
      } else {
        toast({ title: "Slack test failed", description: data.error, variant: "destructive" });
      }
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: async (rule: any) => {
      if (rule.id) {
        await apiRequest("PATCH", `/api/notifications/alert-rules/${rule.id}`, rule);
      } else {
        await apiRequest("POST", "/api/notifications/alert-rules", rule);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/alert-rules"] });
      setRuleDialogOpen(false);
      setEditingRule(null);
      toast({ title: "Alert rule saved" });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/notifications/alert-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/alert-rules"] });
      toast({ title: "Alert rule deleted" });
    },
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/notifications/alert-rules/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/alert-rules"] });
    },
  });

  return (
    <div className="space-y-6" data-testid="notifications-tab">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="channels" data-testid="tab-channels">
            <MessageSquare className="w-4 h-4 mr-1" /> Channels
          </TabsTrigger>
          <TabsTrigger value="rules" data-testid="tab-rules">
            <AlertTriangle className="w-4 h-4 mr-1" /> Alert Rules
          </TabsTrigger>
          <TabsTrigger value="logs" data-testid="tab-logs">
            <Bell className="w-4 h-4 mr-1" /> Delivery Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> Slack Integration
              </CardTitle>
              <CardDescription>
                Configure an incoming webhook to receive alerts and system notifications in a Slack channel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="slack-webhook">Webhook URL</Label>
                <Input
                  id="slack-webhook"
                  data-testid="input-slack-webhook"
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={slackWebhookUrl}
                  onChange={(e) => setSlackWebhookUrl(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  data-testid="button-save-slack"
                  onClick={() => saveSettingsMutation.mutate({ slack_webhook_url: slackWebhookUrl || null })}
                  disabled={saveSettingsMutation.isPending}
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  data-testid="button-test-slack"
                  onClick={() => testSlackMutation.mutate()}
                  disabled={!slackWebhookUrl || testSlackMutation.isPending}
                >
                  <TestTube className="w-4 h-4 mr-1" /> Test
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" /> SendGrid Email
              </CardTitle>
              <CardDescription>
                Enable branded email notifications via SendGrid. Requires SENDGRID_API_KEY environment variable.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  data-testid="switch-sendgrid-enabled"
                  checked={sendgridEnabled}
                  onCheckedChange={(checked) => {
                    setSendgridEnabled(checked);
                    saveSettingsMutation.mutate({ sendgrid_enabled: checked ? "true" : "false" });
                  }}
                />
                <Label>Enable SendGrid email delivery</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                When enabled, report sharing and system notifications will be sent via SendGrid branded templates.
                Set <code className="text-xs bg-muted px-1 py-0.5 rounded">SENDGRID_API_KEY</code> in environment variables.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Alert Rules</h3>
              <p className="text-sm text-muted-foreground">
                Define threshold rules that trigger notifications when property metrics breach limits.
              </p>
            </div>
            <Button
              data-testid="button-add-rule"
              onClick={() => {
                setEditingRule({ metric: "dscr", operator: "<", threshold: 1.2, scope: "all", cooldownMinutes: 1440, isActive: true, name: "" });
                setRuleDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" /> Add Rule
            </Button>
          </div>

          {alertRulesList.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No alert rules configured yet. Add a rule to start receiving threshold alerts.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {alertRulesList.map((rule) => (
                <Card key={rule.id} data-testid={`card-alert-rule-${rule.id}`}>
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Switch
                        data-testid={`switch-rule-${rule.id}`}
                        checked={rule.isActive}
                        onCheckedChange={(checked) => toggleRuleMutation.mutate({ id: rule.id, isActive: checked })}
                      />
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {METRIC_OPTIONS.find((m) => m.value === rule.metric)?.label || rule.metric}{" "}
                          {rule.operator} {rule.threshold} &bull;{" "}
                          {SCOPE_OPTIONS.find((s) => s.value === rule.scope)?.label || rule.scope} &bull;{" "}
                          Cooldown: {rule.cooldownMinutes}min
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`button-edit-rule-${rule.id}`}
                        onClick={() => {
                          setEditingRule(rule);
                          setRuleDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`button-delete-rule-${rule.id}`}
                        onClick={() => deleteRuleMutation.mutate(rule.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Log</CardTitle>
              <CardDescription>Recent notification delivery status across all channels.</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No notifications sent yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 px-3">Time</th>
                        <th className="py-2 px-3">Event</th>
                        <th className="py-2 px-3">Channel</th>
                        <th className="py-2 px-3">Recipient</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log: any) => (
                        <tr key={log.id} className="border-b" data-testid={`row-log-${log.id}`}>
                          <td className="py-2 px-3 text-muted-foreground whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="py-2 px-3">{log.eventType}</td>
                          <td className="py-2 px-3">
                            <Badge variant="outline">{log.channel}</Badge>
                          </td>
                          <td className="py-2 px-3">{log.recipient || "—"}</td>
                          <td className="py-2 px-3">
                            <StatusBadge status={log.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRule?.id ? "Edit Alert Rule" : "New Alert Rule"}</DialogTitle>
          </DialogHeader>
          {editingRule && (
            <div className="space-y-4">
              <div>
                <Label>Rule Name</Label>
                <Input
                  data-testid="input-rule-name"
                  value={editingRule.name || ""}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  placeholder="e.g., Low DSCR Alert"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Metric</Label>
                  <Select value={editingRule.metric || "dscr"} onValueChange={(v) => setEditingRule({ ...editingRule, metric: v })}>
                    <SelectTrigger data-testid="select-rule-metric">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METRIC_OPTIONS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Operator</Label>
                  <Select value={editingRule.operator || "<"} onValueChange={(v) => setEditingRule({ ...editingRule, operator: v })}>
                    <SelectTrigger data-testid="select-rule-operator">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATOR_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Threshold</Label>
                  <Input
                    data-testid="input-rule-threshold"
                    type="number"
                    step="0.01"
                    value={editingRule.threshold ?? 1.2}
                    onChange={(e) => setEditingRule({ ...editingRule, threshold: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Scope</Label>
                  <Select value={editingRule.scope || "all"} onValueChange={(v) => setEditingRule({ ...editingRule, scope: v })}>
                    <SelectTrigger data-testid="select-rule-scope">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCOPE_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {editingRule.scope === "specific" && (
                <div>
                  <Label>Property</Label>
                  <Select
                    value={editingRule.propertyId?.toString() || ""}
                    onValueChange={(v) => setEditingRule({ ...editingRule, propertyId: parseInt(v) })}
                  >
                    <SelectTrigger data-testid="select-rule-property">
                      <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((p: Property) => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Cooldown (minutes)</Label>
                <Input
                  data-testid="input-rule-cooldown"
                  type="number"
                  value={editingRule.cooldownMinutes ?? 1440}
                  onChange={(e) => setEditingRule({ ...editingRule, cooldownMinutes: parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground mt-1">Default: 1440 (24 hours). Prevents duplicate alerts within this period.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>Cancel</Button>
            <Button
              data-testid="button-save-rule"
              onClick={() => {
                if (!editingRule?.name) return;
                createRuleMutation.mutate(editingRule);
              }}
              disabled={!editingRule?.name || createRuleMutation.isPending}
            >
              {editingRule?.id ? "Update" : "Create"} Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
