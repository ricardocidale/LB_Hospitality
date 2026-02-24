import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2, Users, Clock, Activity, FileCheck, LogIn, LogOut, Monitor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime, formatDuration } from "@/lib/formatters";
import type { User, LoginLog, ActivityLogEntry, CheckerActivityData, ActiveSession, ActivitySubView } from "./types";

export default function ActivityTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activitySubTab, setActivitySubTab] = useState<ActivitySubView>("login");
  const [loginLogUserFilter, setLoginLogUserFilter] = useState<string>("");
  const [loginLogIpFilter, setLoginLogIpFilter] = useState<string>("");
  const [activityEntityFilter, setActivityEntityFilter] = useState<string>("");
  const [activityUserFilter, setActivityUserFilter] = useState<string>("");

  const { data: users } = useQuery<User[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const { data: loginLogs, isLoading: logsLoading } = useQuery<LoginLog[]>({
    queryKey: ["admin", "login-logs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/login-logs", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch login logs");
      return res.json();
    },
  });

  const activeSessions = loginLogs?.filter(l => !l.logoutAt).length || 0;

  const { data: activityLogs, isLoading: activityLogsLoading } = useQuery<ActivityLogEntry[]>({
    queryKey: ["admin", "activity-logs", activityEntityFilter, activityUserFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (activityEntityFilter) params.set("entityType", activityEntityFilter);
      if (activityUserFilter) params.set("userId", activityUserFilter);
      const res = await fetch(`/api/admin/activity-logs?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch activity logs");
      return res.json();
    },
  });

  const { data: checkerActivity } = useQuery<CheckerActivityData>({
    queryKey: ["admin", "checker-activity"],
    queryFn: async () => {
      const res = await fetch("/api/admin/checker-activity", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch checker activity");
      return res.json();
    },
    enabled: activitySubTab === "checker",
  });

  const { data: activeSessionsList } = useQuery<ActiveSession[]>({
    queryKey: ["admin", "active-sessions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/active-sessions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch active sessions");
      return res.json();
    },
  });

  const renderActivity = () => {
    const filteredLogs = loginLogs?.filter(log => {
      if (loginLogUserFilter && String(log.userId) !== loginLogUserFilter) return false;
      if (loginLogIpFilter && !(log.ipAddress || "").toLowerCase().includes(loginLogIpFilter.toLowerCase())) return false;
      return true;
    });

    return (<>
    <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">


      <CardHeader className="relative">
        <CardTitle className="text-xl font-display">Login Activity</CardTitle>
        <CardDescription className="label-text">
          {loginLogs?.length || 0} login records | {activeSessions} active sessions
        </CardDescription>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground text-sm whitespace-nowrap">User</Label>
            <Select value={loginLogUserFilter || "all"} onValueChange={(v) => setLoginLogUserFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="bg-primary/10 border-primary/20 text-foreground h-8 w-40 text-sm" data-testid="select-login-log-user-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users?.map(u => (
                  <SelectItem key={u.id} value={String(u.id)}>{u.name || u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground text-sm whitespace-nowrap">IP Address</Label>
            <Input
              value={loginLogIpFilter}
              onChange={(e) => setLoginLogIpFilter(e.target.value)}
              placeholder="Search IP..."
              className="bg-primary/10 border-primary/20 text-foreground placeholder:text-muted-foreground h-8 w-36 text-sm"
              data-testid="input-login-log-ip-filter"
            />
          </div>
          <span className="text-muted-foreground text-sm ml-auto">
            {filteredLogs?.length ?? 0} of {loginLogs?.length ?? 0} entries
          </span>
        </div>

        {logsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredLogs?.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="label-text">
              {loginLogs?.length === 0 ? "No login activity recorded yet" : "No logs match the current filters"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20 hover:bg-transparent">
                <TableHead className="text-muted-foreground font-display"><div className="flex items-center gap-2"><Users className="w-4 h-4" />User</div></TableHead>
                <TableHead className="text-muted-foreground font-display"><div className="flex items-center gap-2"><LogIn className="w-4 h-4" />Login Time</div></TableHead>
                <TableHead className="text-muted-foreground font-display"><div className="flex items-center gap-2"><LogOut className="w-4 h-4" />Logout Time</div></TableHead>
                <TableHead className="text-muted-foreground font-display"><div className="flex items-center gap-2"><Clock className="w-4 h-4" />Duration</div></TableHead>
                <TableHead className="text-muted-foreground font-display"><div className="flex items-center gap-2"><Monitor className="w-4 h-4" />IP Address</div></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs?.map((log) => (
                <TableRow key={log.id} className="border-primary/20 hover:bg-primary/5" data-testid={`row-log-${log.id}`}>
                  <TableCell>
                    <div className="font-display">{log.userName || log.userEmail}</div>
                    {log.userName && <div className="text-xs text-muted-foreground">{log.userEmail}</div>}
                  </TableCell>
                  <TableCell className="text-foreground/80 font-mono text-sm">{formatDateTime(log.loginAt)}</TableCell>
                  <TableCell className="text-foreground/80 font-mono text-sm">
                    {log.logoutAt ? formatDateTime(log.logoutAt) : <span className="text-primary">Active</span>}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <span className={log.logoutAt ? "text-foreground/80" : "text-primary"}>
                      {formatDuration(log.loginAt, log.logoutAt)}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">{log.ipAddress || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>

    {activeSessionsList && activeSessionsList.length > 0 && (
      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)] mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-display">Active Sessions</CardTitle>
          <CardDescription className="label-text">
            {activeSessionsList.length} active session{activeSessionsList.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-primary/20 hover:bg-transparent">
                <TableHead className="text-primary font-semibold text-xs uppercase tracking-wider">User</TableHead>
                <TableHead className="text-primary font-semibold text-xs uppercase tracking-wider">Session Started</TableHead>
                <TableHead className="text-primary font-semibold text-xs uppercase tracking-wider">Expires</TableHead>
                <TableHead className="text-primary font-semibold text-xs uppercase tracking-wider text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeSessionsList.map((s) => (
                <TableRow key={s.id} className="border-b border-primary/10 hover:bg-primary/5">
                  <TableCell className="text-foreground/80 text-sm">{s.userName || s.userEmail}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{new Date(s.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{new Date(s.expiresAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={async () => {
                        try {
                          await fetch(`/api/admin/sessions/${s.id}`, { method: "DELETE", credentials: "include" });
                          queryClient.invalidateQueries({ queryKey: ["admin", "active-sessions"] });
                          toast({ title: "Session terminated", description: `Force logged out ${s.userName || s.userEmail}` });
                        } catch {
                          toast({ title: "Error", description: "Failed to terminate session", variant: "destructive" });
                        }
                      }}
                      data-testid={`button-force-logout-${s.id.slice(0, 8)}`}
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      Force Logout
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )}
    </>
  );};

  const renderActivityFeed = () => (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardContent className="relative p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground text-sm whitespace-nowrap">Entity Type</Label>
              <Select value={activityEntityFilter || "all"} onValueChange={(v) => setActivityEntityFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="bg-primary/10 border-primary/20 text-foreground h-8 w-40 text-sm" data-testid="select-activity-entity-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="property">Property</SelectItem>
                  <SelectItem value="scenario">Scenario</SelectItem>
                  <SelectItem value="global_assumptions">Assumptions</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="verification">Verification</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground text-sm whitespace-nowrap">User</Label>
              <Select value={activityUserFilter || "all"} onValueChange={(v) => setActivityUserFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="bg-primary/10 border-primary/20 text-foreground h-8 w-40 text-sm" data-testid="select-activity-user-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users?.map(u => (
                    <SelectItem key={u.id} value={String(u.id)}>{u.name || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-muted-foreground text-sm ml-auto">
              {activityLogs?.length ?? 0} entries
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardContent className="p-6">
          {activityLogsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !activityLogs?.length ? (
            <p className="text-muted-foreground text-center py-12 label-text">No activity recorded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-primary/20 hover:bg-transparent">
                    <TableHead className="text-primary font-semibold text-xs uppercase tracking-wider">Time</TableHead>
                    <TableHead className="text-primary font-semibold text-xs uppercase tracking-wider">User</TableHead>
                    <TableHead className="text-primary font-semibold text-xs uppercase tracking-wider">Action</TableHead>
                    <TableHead className="text-primary font-semibold text-xs uppercase tracking-wider">Type</TableHead>
                    <TableHead className="text-primary font-semibold text-xs uppercase tracking-wider">Entity</TableHead>
                    <TableHead className="text-primary font-semibold text-xs uppercase tracking-wider">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLogs.map((log) => (
                    <TableRow key={log.id} className="border-b border-primary/10 hover:bg-primary/5">
                      <TableCell className="text-muted-foreground text-xs font-mono whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-foreground/80 text-sm">
                        {log.userName || log.userEmail}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                          log.action === "create" ? "bg-green-500/20 text-green-400" :
                          log.action === "update" ? "bg-blue-500/20 text-blue-400" :
                          log.action === "delete" ? "bg-red-500/20 text-red-400" :
                          log.action === "run" ? "bg-purple-500/20 text-purple-400" :
                          "bg-primary/10 text-muted-foreground"
                        }`}>
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono">{log.entityType}</TableCell>
                      <TableCell className="text-foreground/80 text-sm">{log.entityName || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">
                        {log.metadata ? JSON.stringify(log.metadata).slice(0, 80) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderCheckerActivity = () => {
    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return "Never";
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary">{checkerActivity?.summary.totalActions ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Actions</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-[#4ECDC4]">{checkerActivity?.summary.verificationRuns ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Verification Runs</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-[#E8927C]">{checkerActivity?.summary.manualViews ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Manual Reviews</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-foreground">{checkerActivity?.summary.exports ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Exports</div>
            </CardContent>
          </Card>
        </div>

        {checkerActivity?.checkers && checkerActivity.checkers.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
            <CardHeader>
              <CardTitle className="text-xl font-display">Checker Users</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-primary/20">
                    <TableHead className="text-muted-foreground">Email</TableHead>
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground text-center">Actions</TableHead>
                    <TableHead className="text-muted-foreground text-center">Verifications</TableHead>
                    <TableHead className="text-muted-foreground text-center">Reviews</TableHead>
                    <TableHead className="text-muted-foreground text-center">Exports</TableHead>
                    <TableHead className="text-muted-foreground">Last Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkerActivity.checkers.map((checker) => (
                    <TableRow key={checker.id} className="border-primary/20">
                      <TableCell className="text-foreground font-mono text-sm">{checker.email}</TableCell>
                      <TableCell className="text-foreground/80">{checker.name || "-"}</TableCell>
                      <TableCell className="text-foreground/80 text-center">{checker.totalActions}</TableCell>
                      <TableCell className="text-[#4ECDC4] text-center font-semibold">{checker.verificationRuns}</TableCell>
                      <TableCell className="text-[#E8927C] text-center font-semibold">{checker.manualViews}</TableCell>
                      <TableCell className="text-foreground/80 text-center">{checker.exports}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatDate(checker.lastActive)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
          <CardHeader>
            <CardTitle className="text-xl font-display">Recent Checker Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {(!checkerActivity?.recentActivity || checkerActivity.recentActivity.length === 0) ? (
              <p className="text-muted-foreground text-center py-8">No checker activity recorded yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-primary/20">
                    <TableHead className="text-muted-foreground">Time</TableHead>
                    <TableHead className="text-muted-foreground">User</TableHead>
                    <TableHead className="text-muted-foreground">Action</TableHead>
                    <TableHead className="text-muted-foreground">Entity</TableHead>
                    <TableHead className="text-muted-foreground">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkerActivity.recentActivity.map((log) => (
                    <TableRow key={log.id} className="border-primary/20">
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{formatDate(log.createdAt)}</TableCell>
                      <TableCell className="text-foreground font-mono text-sm">{log.userEmail}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          log.action === "run" ? "bg-[#4ECDC4]/20 text-[#4ECDC4]" :
                          log.action === "view" ? "bg-blue-500/20 text-blue-400" :
                          log.action.includes("export") ? "bg-purple-500/20 text-purple-400" :
                          "bg-primary/10 text-muted-foreground"
                        }`}>
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-foreground/80 text-sm">{log.entityName || log.entityType}</TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">
                        {log.metadata ? JSON.stringify(log.metadata).slice(0, 80) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <>
      <div className="flex gap-2 mb-6">
        {([
          { value: "login" as ActivitySubView, label: "Login Activity", icon: Clock },
          { value: "feed" as ActivitySubView, label: "User Activity Feed", icon: Activity },
          { value: "checker" as ActivitySubView, label: "Checker Activity", icon: FileCheck },
        ]).map((sub) => (
          <Button
            key={sub.value}
            variant={activitySubTab === sub.value ? "default" : "outline"}
            size="sm"
            onClick={() => setActivitySubTab(sub.value)}
            className={activitySubTab === sub.value
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-card/50 border-primary/20 text-muted-foreground hover:bg-primary/10 hover:text-foreground"}
            data-testid={`btn-activity-sub-${sub.value}`}
          >
            <sub.icon className="w-4 h-4 mr-2" />
            {sub.label}
          </Button>
        ))}
      </div>
      {activitySubTab === "login" && renderActivity()}
      {activitySubTab === "feed" && renderActivityFeed()}
      {activitySubTab === "checker" && renderCheckerActivity()}
    </>
  );
}
