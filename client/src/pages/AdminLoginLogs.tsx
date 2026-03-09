;
import { CardContent, CardDescription, CardHeader, CardTitle, IconClock, IconLoader, IconLogIn } from "@/components/icons/brand-icons";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateTime, formatDuration } from "@/lib/formatters";
import { AnimatedPage } from "@/components/graphics/motion/AnimatedPage";

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
          <IconLoader className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatedPage>
      <div className="space-y-8">
        <PageHeader 
          title="Login Activity" 
          subtitle="Track user login and logout activity across the system"
          variant="dark"
        />

        <Card className="relative overflow-hidden bg-card border border-border shadow-sm rounded-lg">
          
          <CardHeader className="relative">
            <div className="flex items-center gap-3">
              <IconLogIn className="w-5 h-5 text-primary" />
              <div>
                <CardTitle className="text-xl font-display text-foreground">Login History</CardTitle>
                <CardDescription className="label-text text-muted-foreground">
                  {logs?.length || 0} login records
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="relative">
            {logs?.length === 0 ? (
              <div className="text-center py-12">
                <IconClock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="label-text text-muted-foreground">No login activity recorded yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground font-display">User</TableHead>
                      <TableHead className="text-muted-foreground font-display">Login Time</TableHead>
                      <TableHead className="text-muted-foreground font-display">Logout Time</TableHead>
                      <TableHead className="text-muted-foreground font-display">Duration</TableHead>
                      <TableHead className="text-muted-foreground font-display">IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs?.map((log) => (
                      <TableRow key={log.id} className="border-border hover:bg-muted" data-testid={`login-log-row-${log.id}`}>
                        <TableCell className="text-foreground">
                          <div>
                            <div className="font-medium">{log.userName || log.userEmail}</div>
                            {log.userName && (
                              <div className="text-xs text-muted-foreground label-text">{log.userEmail}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground font-mono text-sm">
                          {formatDateTime(log.loginAt)}
                        </TableCell>
                        <TableCell className="text-foreground font-mono text-sm">
                          {log.logoutAt ? formatDateTime(log.logoutAt) : (
                            <span className="text-primary">Active</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <span className={log.logoutAt ? "text-foreground" : "text-primary"}>
                            {formatDuration(log.loginAt, log.logoutAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">
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
      </AnimatedPage>
    </Layout>
  );
}
