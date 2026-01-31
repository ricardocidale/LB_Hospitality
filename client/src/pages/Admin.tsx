import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Users, Key, Eye, EyeOff, Pencil, Clock, FileCheck, CheckCircle2, XCircle, AlertTriangle, PlayCircle, Palette, ArrowLeft, Activity } from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";

interface DesignCheckResult {
  timestamp: string;
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: number;
  overallStatus: "PASS" | "FAIL" | "WARNING";
  checks: Array<{
    category: string;
    rule: string;
    status: "pass" | "fail" | "warning";
    details: string;
  }>;
}

interface User {
  id: number;
  email: string;
  name: string | null;
  company: string | null;
  title: string | null;
  role: string;
  createdAt: string;
}

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

interface VerificationResult {
  timestamp: string;
  propertiesChecked: number;
  formulaChecks: { passed: number; failed: number; details: any[] };
  complianceChecks: { passed: number; failed: number; criticalIssues: number; details: any[] };
  managementCompanyChecks?: { passed: number; failed: number; details: any[] };
  consolidatedChecks?: { passed: number; failed: number; details: any[] };
  overallStatus: "PASS" | "FAIL" | "WARNING";
}

type AdminView = "dashboard" | "users" | "activity" | "verification" | "design";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentView, setCurrentView] = useState<AdminView>("dashboard");
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [newUser, setNewUser] = useState({ email: "", password: "", name: "", company: "", title: "" });
  const [editUser, setEditUser] = useState({ email: "", name: "", company: "", title: "" });
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [verificationResults, setVerificationResults] = useState<VerificationResult | null>(null);
  const [designResults, setDesignResults] = useState<DesignCheckResult | null>(null);

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
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

  const createMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; name?: string; company?: string; title?: string }) => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setDialogOpen(false);
      setNewUser({ email: "", password: "", name: "", company: "", title: "" });
      toast({ title: "User Created", description: "New user has been registered." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete user");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({ title: "User Deleted", description: "User has been removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) => {
      const res = await fetch(`/api/admin/users/${id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update password");
      }
      return { id };
    },
    onSuccess: () => {
      setPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword("");
      toast({ title: "Password Updated", description: "User password has been changed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { email?: string; name?: string; company?: string; title?: string } }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setEditDialogOpen(false);
      setSelectedUser(null);
      toast({ title: "User Updated", description: "User information has been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const runVerification = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/run-verification", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to run verification");
      return res.json();
    },
    onSuccess: (data) => {
      setVerificationResults(data);
    },
  });

  const runDesignCheck = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/run-design-check", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to run design check");
      return res.json();
    },
    onSuccess: (data) => {
      setDesignResults(data);
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const calculateDuration = (loginAt: string, logoutAt: string | null): string => {
    if (!logoutAt) return "Active";
    const diffMs = new Date(logoutAt).getTime() - new Date(loginAt).getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group relative overflow-hidden bg-gradient-to-br from-[#1a2e3d]/95 via-[#243d4d]/95 to-[#1e3a42]/95 backdrop-blur-3xl border border-white/20 shadow-2xl shadow-black/40 hover:shadow-[#9FBCA4]/20 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-[#9FBCA4]/10 via-transparent to-[#257D41]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-[#9FBCA4]/20 rounded-full blur-3xl" />
          <CardContent className="relative p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#9FBCA4]/30 to-[#257D41]/20 flex items-center justify-center border border-[#9FBCA4]/30 shadow-lg shadow-[#9FBCA4]/10">
                <Users className="w-7 h-7 text-[#9FBCA4]" />
              </div>
              <div>
                <p className="text-4xl font-mono font-bold text-white tracking-tight">{users?.length || 0}</p>
                <p className="text-sm text-white/50 label-text mt-1">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-[#1a2e3d]/95 via-[#243d4d]/95 to-[#1e3a42]/95 backdrop-blur-3xl border border-white/20 shadow-2xl shadow-black/40 hover:shadow-[#257D41]/20 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-[#257D41]/10 via-transparent to-[#9FBCA4]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-[#257D41]/20 rounded-full blur-3xl" />
          <CardContent className="relative p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#257D41]/30 to-[#9FBCA4]/20 flex items-center justify-center border border-[#257D41]/30 shadow-lg shadow-[#257D41]/10">
                <Activity className="w-7 h-7 text-[#9FBCA4]" />
              </div>
              <div>
                <p className="text-4xl font-mono font-bold text-white tracking-tight">{activeSessions}</p>
                <p className="text-sm text-white/50 label-text mt-1">Active Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-[#1a2e3d]/95 via-[#243d4d]/95 to-[#1e3a42]/95 backdrop-blur-3xl border border-white/20 shadow-2xl shadow-black/40 hover:shadow-[#9FBCA4]/20 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-[#9FBCA4]/10 via-transparent to-[#257D41]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -top-8 -left-8 w-32 h-32 bg-[#9FBCA4]/15 rounded-full blur-3xl" />
          <CardContent className="relative p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#9FBCA4]/30 to-[#257D41]/20 flex items-center justify-center border border-[#9FBCA4]/30 shadow-lg shadow-[#9FBCA4]/10">
                <Clock className="w-7 h-7 text-[#9FBCA4]" />
              </div>
              <div>
                <p className="text-4xl font-mono font-bold text-white tracking-tight">{loginLogs?.length || 0}</p>
                <p className="text-sm text-white/50 label-text mt-1">Login Records</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-[#1a2e3d]/95 via-[#243d4d]/95 to-[#1e3a42]/95 backdrop-blur-3xl border border-white/20 shadow-2xl shadow-black/40 hover:shadow-[#257D41]/20 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-[#257D41]/10 via-transparent to-[#9FBCA4]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-[#257D41]/15 rounded-full blur-3xl" />
          <CardContent className="relative p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#257D41]/30 to-[#9FBCA4]/20 flex items-center justify-center border border-[#257D41]/30 shadow-lg shadow-[#257D41]/10">
                <FileCheck className="w-7 h-7 text-[#9FBCA4]" />
              </div>
              <div>
                <p className="text-4xl font-mono font-bold text-white tracking-tight">2</p>
                <p className="text-sm text-white/50 label-text mt-1">Verification Tools</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="group relative overflow-hidden bg-gradient-to-br from-[#1a2e3d]/95 via-[#243d4d]/95 to-[#1e3a42]/95 backdrop-blur-3xl border border-white/20 shadow-2xl shadow-black/40 cursor-pointer hover:border-[#9FBCA4]/40 hover:shadow-[#9FBCA4]/20 transition-all duration-500" onClick={() => setCurrentView("users")} data-testid="card-users">
          <div className="absolute inset-0 bg-gradient-to-br from-[#9FBCA4]/10 via-transparent to-[#257D41]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#9FBCA4]/15 rounded-full blur-3xl group-hover:bg-[#9FBCA4]/25 transition-colors duration-500" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#257D41]/10 rounded-full blur-3xl group-hover:bg-[#257D41]/20 transition-colors duration-500" />
          <CardContent className="relative p-8">
            <div className="flex items-center gap-6">
              <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-[#9FBCA4] via-[#7aa88a] to-[#257D41] flex items-center justify-center shadow-xl shadow-[#9FBCA4]/30 border border-white/20" style={{ width: '72px', height: '72px' }}>
                <Users className="w-9 h-9 text-white drop-shadow-lg" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-display font-semibold text-white mb-2">User Management</h3>
                <p className="text-white/50 label-text">Add, edit, and manage user accounts and permissions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-[#1a2e3d]/95 via-[#243d4d]/95 to-[#1e3a42]/95 backdrop-blur-3xl border border-white/20 shadow-2xl shadow-black/40 cursor-pointer hover:border-[#9FBCA4]/40 hover:shadow-[#9FBCA4]/20 transition-all duration-500" onClick={() => setCurrentView("activity")} data-testid="card-activity">
          <div className="absolute inset-0 bg-gradient-to-br from-[#257D41]/10 via-transparent to-[#9FBCA4]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -top-16 -left-16 w-48 h-48 bg-[#257D41]/15 rounded-full blur-3xl group-hover:bg-[#257D41]/25 transition-colors duration-500" />
          <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-[#9FBCA4]/10 rounded-full blur-3xl group-hover:bg-[#9FBCA4]/20 transition-colors duration-500" />
          <CardContent className="relative p-8">
            <div className="flex items-center gap-6">
              <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-[#9FBCA4] via-[#7aa88a] to-[#257D41] flex items-center justify-center shadow-xl shadow-[#9FBCA4]/30 border border-white/20" style={{ width: '72px', height: '72px' }}>
                <Clock className="w-9 h-9 text-white drop-shadow-lg" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-display font-semibold text-white mb-2">Login Activity</h3>
                <p className="text-white/50 label-text">Monitor user sessions and login history</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-[#1a2e3d]/95 via-[#243d4d]/95 to-[#1e3a42]/95 backdrop-blur-3xl border border-white/20 shadow-2xl shadow-black/40 cursor-pointer hover:border-[#9FBCA4]/40 hover:shadow-[#9FBCA4]/20 transition-all duration-500" onClick={() => setCurrentView("verification")} data-testid="card-verification">
          <div className="absolute inset-0 bg-gradient-to-br from-[#9FBCA4]/10 via-transparent to-[#257D41]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#9FBCA4]/15 rounded-full blur-3xl group-hover:bg-[#9FBCA4]/25 transition-colors duration-500" />
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#257D41]/10 rounded-full blur-3xl group-hover:bg-[#257D41]/20 transition-colors duration-500" />
          <CardContent className="relative p-8">
            <div className="flex items-center gap-6">
              <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-[#9FBCA4] via-[#7aa88a] to-[#257D41] flex items-center justify-center shadow-xl shadow-[#9FBCA4]/30 border border-white/20" style={{ width: '72px', height: '72px' }}>
                <FileCheck className="w-9 h-9 text-white drop-shadow-lg" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-display font-semibold text-white mb-2">Financial Verification</h3>
                <p className="text-white/50 label-text">Run formula checks and GAAP compliance validation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-[#1a2e3d]/95 via-[#243d4d]/95 to-[#1e3a42]/95 backdrop-blur-3xl border border-white/20 shadow-2xl shadow-black/40 cursor-pointer hover:border-[#9FBCA4]/40 hover:shadow-[#9FBCA4]/20 transition-all duration-500" onClick={() => setCurrentView("design")} data-testid="card-design">
          <div className="absolute inset-0 bg-gradient-to-br from-[#257D41]/10 via-transparent to-[#9FBCA4]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -top-16 -left-16 w-48 h-48 bg-[#257D41]/15 rounded-full blur-3xl group-hover:bg-[#257D41]/25 transition-colors duration-500" />
          <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-[#9FBCA4]/10 rounded-full blur-3xl group-hover:bg-[#9FBCA4]/20 transition-colors duration-500" />
          <CardContent className="relative p-8">
            <div className="flex items-center gap-6">
              <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-[#9FBCA4] via-[#7aa88a] to-[#257D41] flex items-center justify-center shadow-xl shadow-[#9FBCA4]/30 border border-white/20" style={{ width: '72px', height: '72px' }}>
                <Palette className="w-9 h-9 text-white drop-shadow-lg" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-display font-semibold text-white mb-2">Design Consistency</h3>
                <p className="text-white/50 label-text">Verify fonts, colors, and component standards across all pages</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderUsers = () => (
    <Card className="relative overflow-hidden bg-[#0a0a0f]/95 backdrop-blur-3xl border border-white/10 shadow-2xl shadow-black/50">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-black/20" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[#9FBCA4]/20 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[#257D41]/15 blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(159,188,164,0.05)]" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-display text-[#FFF9F5]">User Management</CardTitle>
            <CardDescription className="label-text text-white/60">
              {users?.length || 0} registered users
            </CardDescription>
          </div>
          <GlassButton variant="primary" onClick={() => setDialogOpen(true)} data-testid="button-add-user">
            <Plus className="w-4 h-4" />
            Add User
          </GlassButton>
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        {usersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#9FBCA4]" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60 font-display">User</TableHead>
                <TableHead className="text-white/60 font-display">Role</TableHead>
                <TableHead className="text-white/60 font-display">Created</TableHead>
                <TableHead className="text-white/60 font-display text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id} className="border-white/10 hover:bg-white/5" data-testid={`row-user-${user.id}`}>
                  <TableCell>
                    <div className="text-[#FFF9F5] font-medium">{user.name || user.email}</div>
                    {user.name && <div className="text-xs text-white/50">{user.email}</div>}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-[#257D41]/20 text-[#9FBCA4]' : 'bg-white/10 text-white/70'}`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-white/60 font-mono text-sm">{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10"
                        onClick={() => { setSelectedUser(user); setEditUser({ email: user.email, name: user.name || "", company: user.company || "", title: user.title || "" }); setEditDialogOpen(true); }}
                        data-testid={`button-edit-user-${user.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10"
                        onClick={() => { setSelectedUser(user); setPasswordDialogOpen(true); }}
                        data-testid={`button-password-user-${user.id}`}>
                        <Key className="w-4 h-4" />
                      </Button>
                      {user.role !== 'admin' && (
                        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => deleteMutation.mutate(user.id)}
                          data-testid={`button-delete-user-${user.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  const renderActivity = () => (
    <Card className="relative overflow-hidden bg-[#0a0a0f]/95 backdrop-blur-3xl border border-white/10 shadow-2xl shadow-black/50">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-black/20" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[#9FBCA4]/20 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[#257D41]/15 blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(159,188,164,0.05)]" />
      
      <CardHeader className="relative">
        <CardTitle className="text-xl font-display text-[#FFF9F5]">Login Activity</CardTitle>
        <CardDescription className="label-text text-white/60">
          {loginLogs?.length || 0} login records | {activeSessions} active sessions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="relative">
        {logsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#9FBCA4]" />
          </div>
        ) : loginLogs?.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 mx-auto text-white/30 mb-4" />
            <p className="label-text text-white/60">No login activity recorded yet</p>
          </div>
        ) : (
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
              {loginLogs?.map((log) => (
                <TableRow key={log.id} className="border-white/10 hover:bg-white/5" data-testid={`row-log-${log.id}`}>
                  <TableCell>
                    <div className="text-[#FFF9F5]">{log.userName || log.userEmail}</div>
                    {log.userName && <div className="text-xs text-white/50">{log.userEmail}</div>}
                  </TableCell>
                  <TableCell className="text-white/80 font-mono text-sm">{formatDate(log.loginAt)}</TableCell>
                  <TableCell className="text-white/80 font-mono text-sm">
                    {log.logoutAt ? formatDate(log.logoutAt) : <span className="text-[#9FBCA4]">Active</span>}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <span className={log.logoutAt ? "text-white/80" : "text-[#9FBCA4]"}>
                      {calculateDuration(log.loginAt, log.logoutAt)}
                    </span>
                  </TableCell>
                  <TableCell className="text-white/60 font-mono text-sm">{log.ipAddress || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  const renderVerification = () => (
    <Card className="relative overflow-hidden bg-[#0a0a0f]/95 backdrop-blur-3xl border border-white/10 shadow-2xl shadow-black/50">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-black/20" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[#9FBCA4]/20 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[#257D41]/15 blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#9FBCA4]/10 blur-[120px]" />
      </div>
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(159,188,164,0.05)]" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-display text-[#FFF9F5]">Financial Verification</CardTitle>
            <CardDescription className="label-text text-white/60">
              Run formula and GAAP compliance checks on all statements
            </CardDescription>
          </div>
          <GlassButton variant="primary" onClick={() => runVerification.mutate()} disabled={runVerification.isPending} data-testid="button-run-verification">
            {runVerification.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
            Run Verification
          </GlassButton>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-6">
        {!verificationResults && !runVerification.isPending && (
          <div className="text-center py-12">
            <FileCheck className="w-16 h-16 mx-auto text-white/30 mb-4" />
            <p className="label-text text-white/60">Click "Run Verification" to check all financial statements</p>
          </div>
        )}

        {runVerification.isPending && (
          <div className="text-center py-12">
            <Loader2 className="w-16 h-16 mx-auto text-[#9FBCA4] animate-spin mb-4" />
            <p className="label-text text-white/60">Running verification checks...</p>
          </div>
        )}

        {verificationResults && (
          <>
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-lg text-white font-semibold">Verification Results</h3>
                  <p className="text-xs text-white/40 font-mono mt-1">Run at: {formatDate(verificationResults.timestamp)}</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  verificationResults.overallStatus === "PASS" ? "bg-green-500/20 text-green-400" :
                  verificationResults.overallStatus === "WARNING" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-red-500/20 text-red-400"
                }`}>
                  {verificationResults.overallStatus === "PASS" ? <CheckCircle2 className="w-5 h-5" /> :
                   verificationResults.overallStatus === "WARNING" ? <AlertTriangle className="w-5 h-5" /> :
                   <XCircle className="w-5 h-5" />}
                  <span className="font-display font-bold">{verificationResults.overallStatus}</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4 text-center">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
                  <div className="text-3xl font-mono font-bold text-white">{verificationResults.propertiesChecked}</div>
                  <div className="text-xs text-white/50 label-text mt-1">Properties</div>
                </div>
                <div className="p-4 rounded-xl bg-[#9FBCA4]/10 border border-[#9FBCA4]/20 backdrop-blur-sm">
                  <div className="text-3xl font-mono font-bold text-[#9FBCA4]">{verificationResults.formulaChecks.passed}</div>
                  <div className="text-xs text-white/50 label-text mt-1">Property Checks</div>
                </div>
                <div className="p-4 rounded-xl bg-[#9FBCA4]/10 border border-[#9FBCA4]/20 backdrop-blur-sm">
                  <div className="text-3xl font-mono font-bold text-[#9FBCA4]">{verificationResults.managementCompanyChecks?.passed || 0}</div>
                  <div className="text-xs text-white/50 label-text mt-1">Mgmt Co Checks</div>
                </div>
                <div className="p-4 rounded-xl bg-[#9FBCA4]/10 border border-[#9FBCA4]/20 backdrop-blur-sm">
                  <div className="text-3xl font-mono font-bold text-[#9FBCA4]">{verificationResults.consolidatedChecks?.passed || 0}</div>
                  <div className="text-xs text-white/50 label-text mt-1">Consolidated</div>
                </div>
                <div className="p-4 rounded-xl bg-[#257D41]/10 border border-[#257D41]/20 backdrop-blur-sm">
                  <div className="text-3xl font-mono font-bold text-[#9FBCA4]">{verificationResults.complianceChecks.passed}</div>
                  <div className="text-xs text-white/50 label-text mt-1">GAAP Compliance</div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#257D41]/10 border border-[#257D41]/30 backdrop-blur-xl">
              <h4 className="font-display text-[#9FBCA4] mb-2">Key Standards Verified</h4>
              <ul className="grid grid-cols-2 gap-2 text-sm text-white/70 label-text">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#9FBCA4]" />ASC 470 - Interest vs Principal separation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#9FBCA4]" />ASC 230 - Cash Flow classification</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#9FBCA4]" />ASC 606 - Revenue recognition</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#9FBCA4]" />ASC 810 - Intercompany elimination</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#9FBCA4]" />USALI - NOI/GOP methodology</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#9FBCA4]" />STR/CBRE - ADR/RevPAR formulas</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderDesign = () => (
    <Card className="relative overflow-hidden bg-[#0a0a0f]/95 backdrop-blur-3xl border border-white/10 shadow-2xl shadow-black/50">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-black/20" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[#9FBCA4]/20 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[#257D41]/15 blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#9FBCA4]/10 blur-[120px]" />
      </div>
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(159,188,164,0.05)]" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-display text-[#FFF9F5]">Design Consistency Verification</CardTitle>
            <CardDescription className="label-text text-white/60">
              Check fonts, typography, color palette, and component standards across all pages
            </CardDescription>
          </div>
          <GlassButton variant="primary" onClick={() => runDesignCheck.mutate()} disabled={runDesignCheck.isPending} data-testid="button-run-design-check">
            {runDesignCheck.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Palette className="w-4 h-4" />}
            Run Design Check
          </GlassButton>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-6">
        {!designResults && !runDesignCheck.isPending && (
          <div className="text-center py-12">
            <Palette className="w-16 h-16 mx-auto text-white/30 mb-4" />
            <p className="label-text text-white/60">Click "Run Design Check" to verify design consistency</p>
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 max-w-md mx-auto">
              <h4 className="font-display text-[#9FBCA4] mb-3">What We Check</h4>
              <ul className="text-sm text-white/70 label-text space-y-2 text-left">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#9FBCA4]" />Color palette compliance (#257D41, #9FBCA4, #FFF9F5)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#9FBCA4]" />Typography standards (font-display, label-text, font-mono)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#9FBCA4]" />Button consistency (GlassButton usage)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#9FBCA4]" />Page header standardization</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#9FBCA4]" />Dark glass theme implementation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#9FBCA4]" />Testing attributes (data-testid)</li>
              </ul>
            </div>
          </div>
        )}

        {runDesignCheck.isPending && (
          <div className="text-center py-12">
            <Loader2 className="w-16 h-16 mx-auto text-[#9FBCA4] animate-spin mb-4" />
            <p className="label-text text-white/60">Analyzing design consistency...</p>
          </div>
        )}

        {designResults && (
          <>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-[#FFF9F5]">Design Check Results</h3>
                  <p className="text-xs text-white/40 font-mono mt-1">Run at: {formatDate(designResults.timestamp)}</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  designResults.overallStatus === "PASS" ? "bg-green-500/20 text-green-400" :
                  designResults.overallStatus === "WARNING" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-red-500/20 text-red-400"
                }`}>
                  {designResults.overallStatus === "PASS" ? <CheckCircle2 className="w-5 h-5" /> :
                   designResults.overallStatus === "WARNING" ? <AlertTriangle className="w-5 h-5" /> :
                   <XCircle className="w-5 h-5" />}
                  <span className="font-display font-bold">{designResults.overallStatus}</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-center mb-6">
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="text-2xl font-mono text-[#FFF9F5]">{designResults.totalChecks}</div>
                  <div className="text-xs text-white/40 label-text">Total Checks</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="text-2xl font-mono text-green-400">{designResults.passed}</div>
                  <div className="text-xs text-white/40 label-text">Passed</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="text-2xl font-mono text-yellow-400">{designResults.warnings}</div>
                  <div className="text-xs text-white/40 label-text">Warnings</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="text-2xl font-mono text-red-400">{designResults.failed}</div>
                  <div className="text-xs text-white/40 label-text">Failed</div>
                </div>
              </div>

              <div className="space-y-3">
                {designResults.checks.map((check, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    {check.status === "pass" ? <CheckCircle2 className="w-5 h-5 text-green-400" /> :
                     check.status === "warning" ? <AlertTriangle className="w-5 h-5 text-yellow-400" /> :
                     <XCircle className="w-5 h-5 text-red-400" />}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/60">{check.category}</span>
                        <span className="text-white/80 text-sm">{check.rule}</span>
                      </div>
                      <p className="text-xs text-white/50 mt-1">{check.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          {currentView !== "dashboard" && (
            <Button variant="ghost" onClick={() => setCurrentView("dashboard")} className="text-white/60 hover:text-white hover:bg-white/10" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <PageHeader 
            title={currentView === "dashboard" ? "Administration" : 
                   currentView === "users" ? "User Management" :
                   currentView === "activity" ? "Login Activity" :
                   currentView === "verification" ? "Financial Verification" : "Design Consistency"}
            subtitle={currentView === "dashboard" ? "Manage users, monitor activity, and run system verification" :
                      currentView === "users" ? "Add, edit, and manage user accounts" :
                      currentView === "activity" ? "Monitor user sessions and login history" :
                      currentView === "verification" ? "Run formula and GAAP compliance checks" : "Check fonts, colors, and component standards"}
            variant="dark"
          />
        </div>

        {currentView === "dashboard" && renderDashboard()}
        {currentView === "users" && renderUsers()}
        {currentView === "activity" && renderActivity()}
        {currentView === "verification" && renderVerification()}
        {currentView === "design" && renderDesign()}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Add New User</DialogTitle>
            <DialogDescription className="label-text">Create a new user account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="user@example.com" data-testid="input-new-user-email" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Input type={showNewUserPassword ? "text" : "password"} value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Secure password" data-testid="input-new-user-password" />
                <button type="button" onClick={() => setShowNewUserPassword(!showNewUserPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" data-testid="button-toggle-new-password">
                  {showNewUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2"><Label>Name</Label><Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Full name" data-testid="input-new-user-name" /></div>
            <div className="space-y-2"><Label>Company</Label><Input value={newUser.company} onChange={(e) => setNewUser({ ...newUser, company: e.target.value })} placeholder="Company name" data-testid="input-new-user-company" /></div>
            <div className="space-y-2"><Label>Title</Label><Input value={newUser.title} onChange={(e) => setNewUser({ ...newUser, title: e.target.value })} placeholder="Job title" data-testid="input-new-user-title" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-add-user">Cancel</Button>
            <GlassButton variant="primary" onClick={() => createMutation.mutate(newUser)} disabled={createMutation.isPending || !newUser.email || !newUser.password} data-testid="button-create-user">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create User
            </GlassButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Change Password</DialogTitle>
            <DialogDescription className="label-text">Set a new password for {selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input type={showChangePassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" data-testid="input-new-password" />
                <button type="button" onClick={() => setShowChangePassword(!showChangePassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" data-testid="button-toggle-change-password">
                  {showChangePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)} data-testid="button-cancel-password">Cancel</Button>
            <GlassButton variant="primary" onClick={() => selectedUser && passwordMutation.mutate({ id: selectedUser.id, password: newPassword })} disabled={passwordMutation.isPending || !newPassword} data-testid="button-update-password">
              {passwordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Update Password
            </GlassButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Edit User</DialogTitle>
            <DialogDescription className="label-text">Update user information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Email</Label><Input value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} data-testid="input-edit-email" /></div>
            <div className="space-y-2"><Label>Name</Label><Input value={editUser.name} onChange={(e) => setEditUser({ ...editUser, name: e.target.value })} data-testid="input-edit-name" /></div>
            <div className="space-y-2"><Label>Company</Label><Input value={editUser.company} onChange={(e) => setEditUser({ ...editUser, company: e.target.value })} data-testid="input-edit-company" /></div>
            <div className="space-y-2"><Label>Title</Label><Input value={editUser.title} onChange={(e) => setEditUser({ ...editUser, title: e.target.value })} data-testid="input-edit-title" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel-edit">Cancel</Button>
            <GlassButton variant="primary" onClick={() => selectedUser && editMutation.mutate({ id: selectedUser.id, data: editUser })} disabled={editMutation.isPending} data-testid="button-save-user">
              {editMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
              Save Changes
            </GlassButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
