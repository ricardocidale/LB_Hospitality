import { User, ActivityLogEntry } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

interface ActivityFeedProps {
  users?: User[];
  activityLogs?: ActivityLogEntry[];
  activityLogsLoading: boolean;
  activityEntityFilter: string;
  setActivityEntityFilter: (v: string) => void;
  activityUserFilter: string;
  setActivityUserFilter: (v: string) => void;
}

export function ActivityFeed({
  users,
  activityLogs,
  activityLogsLoading,
  activityEntityFilter,
  setActivityEntityFilter,
  activityUserFilter,
  setActivityUserFilter,
}: ActivityFeedProps) {
  return (
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
}
