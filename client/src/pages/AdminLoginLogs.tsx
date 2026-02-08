import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Clock, LogIn } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateTime, formatDuration } from "@/lib/formatters";

interface LoginLog {
  id: number;
  userId: number;
  sessionId: string;
  loginAt: string;
  logoutAt: string | null;
  ipAddress: string | null;
  userEmail: string;
  userName: string | null;
}


export default function AdminLoginLogs() {
  const { data: logs, isLoading } = useQuery<LoginLog[]>({
    queryKey: ["admin", "login-logs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/login-logs", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch login logs");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <PageHeader 
          title="Login Activity" 
          subtitle="Track user login and logout activity across the system"
          variant="dark"
        />

        <Card className="relative overflow-hidden bg-gradient-to-br from-[#2d4a5e]/90 via-[#3d5a6a]/90 to-[#3a5a5e]/90 backdrop-blur-xl border-white/10">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-[#9FBCA4]/15 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-[#257D41]/10 blur-3xl" />
          </div>
          
          <CardHeader className="relative">
            <div className="flex items-center gap-3">
              <LogIn className="w-5 h-5 text-[#9FBCA4]" />
              <div>
                <CardTitle className="text-xl font-display text-[#FFF9F5]">Login History</CardTitle>
                <CardDescription className="label-text text-white/60">
                  {logs?.length || 0} login records
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="relative">
            {logs?.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 mx-auto text-white/30 mb-4" />
                <p className="label-text text-white/60">No login activity recorded yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-white/60 font-display">User</TableHead>
                      <TableHead className="text-white/60 font-display">Login Time</TableHead>
                      <TableHead className="text-white/60 font-display">Logout Time</TableHead>
                      <TableHead className="text-white/60 font-display">Duration</TableHead>
                      <TableHead className="text-white/60 font-display">IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs?.map((log) => (
                      <TableRow key={log.id} className="border-white/10 hover:bg-white/5" data-testid={`login-log-row-${log.id}`}>
                        <TableCell className="text-[#FFF9F5]">
                          <div>
                            <div className="font-medium">{log.userName || log.userEmail}</div>
                            {log.userName && (
                              <div className="text-xs text-white/50 label-text">{log.userEmail}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-white/80 font-mono text-sm">
                          {formatDateTime(log.loginAt)}
                        </TableCell>
                        <TableCell className="text-white/80 font-mono text-sm">
                          {log.logoutAt ? formatDateTime(log.logoutAt) : (
                            <span className="text-[#9FBCA4]">Active</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <span className={log.logoutAt ? "text-white/80" : "text-[#9FBCA4]"}>
                            {formatDuration(log.loginAt, log.logoutAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-white/60 font-mono text-sm">
                          {log.ipAddress || "-"}
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
    </Layout>
  );
}
