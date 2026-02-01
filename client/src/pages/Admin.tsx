import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Users, Key, Eye, EyeOff, Pencil, Clock, FileCheck, CheckCircle2, XCircle, AlertTriangle, PlayCircle, Palette, ArrowLeft, Activity, HelpCircle, SwatchBook } from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";
import { PageHeader } from "@/components/ui/page-header";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { ColorPicker } from "@/components/ui/color-picker";

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

interface DesignColor {
  rank: number;
  name: string;
  hexCode: string;
  description: string;
}

interface DesignTheme {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  colors: DesignColor[];
  createdAt: string;
  updatedAt: string;
}

type AdminView = "dashboard" | "users" | "activity" | "verification" | "design" | "themes";

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
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<DesignTheme | null>(null);
  const [newTheme, setNewTheme] = useState<{ name: string; description: string; colors: DesignColor[] }>({
    name: "",
    description: "",
    colors: [
      { rank: 1, name: "", hexCode: "#000000", description: "" },
    ],
  });

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

  const { data: designThemes, isLoading: themesLoading } = useQuery<DesignTheme[]>({
    queryKey: ["admin", "design-themes"],
    queryFn: async () => {
      const res = await fetch("/api/admin/design-themes", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch design themes");
      return res.json();
    },
  });

  const createThemeMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; colors: DesignColor[] }) => {
      const res = await fetch("/api/admin/design-themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create theme");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "design-themes"] });
      setThemeDialogOpen(false);
      setNewTheme({ name: "", description: "", colors: [{ rank: 1, name: "", hexCode: "#000000", description: "" }] });
      toast({ title: "Theme created successfully" });
    },
  });

  const updateThemeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<{ name: string; description: string; colors: DesignColor[] }> }) => {
      const res = await fetch(`/api/admin/design-themes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update theme");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "design-themes"] });
      setEditingTheme(null);
      toast({ title: "Theme updated successfully" });
    },
  });

  const deleteThemeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/design-themes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete theme");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "design-themes"] });
      toast({ title: "Theme deleted successfully" });
    },
  });

  const activateThemeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/design-themes/${id}/activate`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to activate theme");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "design-themes"] });
      toast({ title: "Theme activated successfully" });
    },
  });

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

        <Card className="group relative overflow-hidden bg-gradient-to-br from-[#1a2e3d]/95 via-[#243d4d]/95 to-[#1e3a42]/95 backdrop-blur-3xl border border-white/20 shadow-2xl shadow-black/40 cursor-pointer hover:border-[#F4795B]/40 hover:shadow-[#F4795B]/20 transition-all duration-500" onClick={() => setCurrentView("themes")} data-testid="card-themes">
          <div className="absolute inset-0 bg-gradient-to-br from-[#F4795B]/10 via-transparent to-[#9FBCA4]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -top-16 -left-16 w-48 h-48 bg-[#F4795B]/15 rounded-full blur-3xl group-hover:bg-[#F4795B]/25 transition-colors duration-500" />
          <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-[#9FBCA4]/10 rounded-full blur-3xl group-hover:bg-[#9FBCA4]/20 transition-colors duration-500" />
          <CardContent className="relative p-8">
            <div className="flex items-center gap-6">
              <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-[#F4795B] via-[#e86a4c] to-[#d45a3d] flex items-center justify-center shadow-xl shadow-[#F4795B]/30 border border-white/20" style={{ width: '72px', height: '72px' }}>
                <SwatchBook className="w-9 h-9 text-white drop-shadow-lg" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-display font-semibold text-white mb-2">Design Themes</h3>
                <p className="text-white/50 label-text">Manage color palettes and design system definitions</p>
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
    <Card className="relative overflow-hidden bg-white/80 backdrop-blur-xl border border-gray-200 shadow-2xl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[#9FBCA4]/10 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[#257D41]/10 blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-display text-gray-900">Financial Verification</CardTitle>
            <CardDescription className="label-text text-gray-600">
              Run formula and GAAP compliance checks on all statements
            </CardDescription>
          </div>
          <button 
            onClick={() => runVerification.mutate()} 
            disabled={runVerification.isPending} 
            data-testid="button-run-verification"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[#257D41] bg-[#257D41]/10 text-[#257D41] font-semibold hover:bg-[#257D41]/20 transition-colors disabled:opacity-50"
          >
            {runVerification.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
            Run Verification
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-6">
        {!verificationResults && !runVerification.isPending && (
          <div className="text-center py-12">
            <FileCheck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="label-text text-gray-500">Click "Run Verification" to check all financial statements</p>
          </div>
        )}

        {runVerification.isPending && (
          <div className="text-center py-12">
            <Loader2 className="w-16 h-16 mx-auto text-[#9FBCA4] animate-spin mb-4" />
            <p className="label-text text-gray-500">Running verification checks...</p>
          </div>
        )}

        {verificationResults && (
          <>
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-lg text-gray-900 font-semibold">Verification Results</h3>
                  <p className="text-xs text-gray-500 font-mono mt-1">Run at: {formatDate(verificationResults.timestamp)}</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  verificationResults.overallStatus === "PASS" ? "bg-green-100 text-green-700" :
                  verificationResults.overallStatus === "WARNING" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {verificationResults.overallStatus === "PASS" ? <CheckCircle2 className="w-5 h-5" /> :
                   verificationResults.overallStatus === "WARNING" ? <AlertTriangle className="w-5 h-5" /> :
                   <XCircle className="w-5 h-5" />}
                  <span className="font-display font-bold">{verificationResults.overallStatus}</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4 text-center">
                <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
                  <div className="text-3xl font-mono font-bold text-gray-900">{verificationResults.propertiesChecked}</div>
                  <div className="text-xs text-gray-500 label-text mt-1">Properties</div>
                </div>
                <div className="p-4 rounded-xl bg-[#9FBCA4]/10 border border-[#9FBCA4]/30 shadow-sm">
                  <div className="text-3xl font-mono font-bold text-[#257D41]">{verificationResults.formulaChecks.passed}</div>
                  <div className="text-xs text-gray-600 label-text mt-1">Property Checks</div>
                </div>
                <div className="p-4 rounded-xl bg-[#9FBCA4]/10 border border-[#9FBCA4]/30 shadow-sm">
                  <div className="text-3xl font-mono font-bold text-[#257D41]">{verificationResults.managementCompanyChecks?.passed || 0}</div>
                  <div className="text-xs text-gray-600 label-text mt-1">Mgmt Co Checks</div>
                </div>
                <div className="p-4 rounded-xl bg-[#9FBCA4]/10 border border-[#9FBCA4]/30 shadow-sm">
                  <div className="text-3xl font-mono font-bold text-[#257D41]">{verificationResults.consolidatedChecks?.passed || 0}</div>
                  <div className="text-xs text-gray-600 label-text mt-1">Consolidated</div>
                </div>
                <div className="p-4 rounded-xl bg-[#257D41]/10 border border-[#257D41]/30 shadow-sm">
                  <div className="text-3xl font-mono font-bold text-[#257D41]">{verificationResults.complianceChecks.passed}</div>
                  <div className="text-xs text-gray-600 label-text mt-1">GAAP Compliance</div>
                </div>
              </div>
            </div>

            {/* Property Formula Checks */}
            {verificationResults.formulaChecks.details.map((property: any, pIdx: number) => (
              <div key={pIdx} className="p-5 rounded-2xl bg-gray-50 border border-gray-200">
                <h4 className="font-display text-gray-900 font-semibold mb-3">{property.name} <span className="text-gray-500 font-normal text-sm">({property.type})</span></h4>
                <div className="space-y-2">
                  {property.checks?.map((check: any, cIdx: number) => (
                    <div key={cIdx} className="space-y-1">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100">
                        {check.passed ? <CheckCircle2 className="w-5 h-5 text-[#257D41] shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700 text-sm">{check.name}</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p>{check.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{check.description}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${check.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {check.passed ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                      {!check.passed && (
                        <div className="ml-8 p-3 rounded-lg bg-red-50 border border-red-200">
                          <p className="text-xs text-red-700 font-medium">Diagnosis: {check.diagnosis || 'Formula mismatch detected in calculations'}</p>
                          <p className="text-xs text-gray-600 mt-1">Solution: {check.solution || 'Review property assumptions and verify formula inputs match expected values'}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Management Company Checks */}
            {verificationResults.managementCompanyChecks?.details?.map((entity: any, eIdx: number) => (
              <div key={eIdx} className="p-5 rounded-2xl bg-gray-50 border border-gray-200">
                <h4 className="font-display text-gray-900 font-semibold mb-3">{entity.name} <span className="text-gray-500 font-normal text-sm">({entity.type})</span></h4>
                <div className="space-y-2">
                  {entity.checks?.map((check: any, cIdx: number) => (
                    <div key={cIdx} className="space-y-1">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100">
                        {check.passed ? <CheckCircle2 className="w-5 h-5 text-[#257D41] shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700 text-sm">{check.name}</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p>{check.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{check.description}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${check.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {check.passed ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                      {!check.passed && (
                        <div className="ml-8 p-3 rounded-lg bg-red-50 border border-red-200">
                          <p className="text-xs text-red-700 font-medium">Diagnosis: {check.diagnosis || 'Management company calculation error detected'}</p>
                          <p className="text-xs text-gray-600 mt-1">Solution: {check.solution || 'Verify management fee structures and revenue allocations'}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Consolidated Checks */}
            {verificationResults.consolidatedChecks?.details?.map((entity: any, eIdx: number) => (
              <div key={eIdx} className="p-5 rounded-2xl bg-gray-50 border border-gray-200">
                <h4 className="font-display text-gray-900 font-semibold mb-3">{entity.name} <span className="text-gray-500 font-normal text-sm">({entity.type})</span></h4>
                <div className="space-y-2">
                  {entity.checks?.map((check: any, cIdx: number) => (
                    <div key={cIdx} className="space-y-1">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100">
                        {check.passed ? <CheckCircle2 className="w-5 h-5 text-[#257D41] shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700 text-sm">{check.name}</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p>{check.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{check.description}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${check.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {check.passed ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                      {!check.passed && (
                        <div className="ml-8 p-3 rounded-lg bg-red-50 border border-red-200">
                          <p className="text-xs text-red-700 font-medium">Diagnosis: {check.diagnosis || 'Consolidation mismatch between entities'}</p>
                          <p className="text-xs text-gray-600 mt-1">Solution: {check.solution || 'Review inter-company eliminations and ensure all entities are properly consolidated'}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* GAAP Compliance Checks */}
            <div className="p-5 rounded-2xl bg-[#257D41]/10 border border-[#257D41]/30">
              <h4 className="font-display text-[#257D41] font-semibold mb-3">GAAP Compliance Standards</h4>
              <div className="space-y-2">
                {verificationResults.complianceChecks.details.map((check: any, cIdx: number) => (
                  <div key={cIdx} className="space-y-1">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100">
                      {check.passed ? <CheckCircle2 className="w-5 h-5 text-[#257D41] shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{check.category}</span>
                          <span className="text-gray-700 text-sm">{check.rule}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>Scope: {check.scope}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">Scope: {check.scope}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${check.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {check.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    {!check.passed && (
                      <div className="ml-8 p-3 rounded-lg bg-red-50 border border-red-200">
                        <p className="text-xs text-red-700 font-medium">Diagnosis: {check.diagnosis || `Non-compliance with ${check.category} standard detected`}</p>
                        <p className="text-xs text-gray-600 mt-1">Solution: {check.solution || `Review ${check.scope} to ensure compliance with GAAP ${check.category} requirements`}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderThemes = () => (
    <Card className="relative overflow-hidden bg-white/80 backdrop-blur-xl border border-gray-200 shadow-2xl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[#9FBCA4]/10 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[#257D41]/10 blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-display text-gray-900">Design Themes</CardTitle>
            <CardDescription className="label-text text-gray-600">
              Define color palettes and design systems for your application
            </CardDescription>
          </div>
          <Button onClick={() => setThemeDialogOpen(true)} className="flex items-center gap-2 bg-[#257D41] hover:bg-[#1e6434]">
            <Plus className="w-4 h-4" />
            New Theme
          </Button>
        </div>
      </CardHeader>
        
        <CardContent className="relative space-y-6">
          {themesLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto text-[#257D41] animate-spin" />
            </div>
          ) : designThemes && designThemes.length > 0 ? (
            <div className="space-y-4">
              {designThemes.map((theme) => (
                <div key={theme.id} className={`p-5 rounded-2xl border-2 ${theme.isActive ? 'border-[#257D41] bg-[#9FBCA4]/10' : 'border-gray-200 bg-white'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-display text-lg text-gray-900 font-semibold">{theme.name}</h3>
                        {theme.isActive && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#257D41] text-white">Active</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 max-w-2xl">{theme.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!theme.isActive && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => activateThemeMutation.mutate(theme.id)}
                          className="text-[#257D41] border-[#257D41] hover:bg-[#257D41]/10"
                        >
                          Set Active
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setEditingTheme(theme)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => deleteThemeMutation.mutate(theme.id)}
                        disabled={theme.isActive}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Color Swatches */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {theme.colors.sort((a, b) => a.rank - b.rank).map((color) => (
                      <div key={color.rank} className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div 
                            className="w-10 h-10 rounded-lg border border-gray-300 shadow-inner" 
                            style={{ backgroundColor: color.hexCode }}
                          />
                          <div>
                            <p className="font-medium text-sm text-gray-900">{color.name}</p>
                            <p className="font-mono text-xs text-gray-500">{color.hexCode}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">{color.description}</p>
                        <div className="mt-2 px-2 py-1 rounded text-xs font-medium text-center" style={{ backgroundColor: color.hexCode, color: parseInt(color.hexCode.slice(1), 16) > 0x888888 ? '#000' : '#fff' }}>
                          Rank {color.rank}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Palette className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="label-text text-gray-500">No design themes yet. Create your first theme to define your color palette.</p>
            </div>
          )}
        </CardContent>
    </Card>
  );

  const renderDesign = () => (
    <Card className="relative overflow-hidden bg-white/80 backdrop-blur-xl border border-gray-200 shadow-2xl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[#9FBCA4]/10 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[#257D41]/10 blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>
      <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-display text-gray-900">Design Consistency Verification</CardTitle>
              <CardDescription className="label-text text-gray-600">
                Check fonts, typography, color palette, and component standards across all pages
              </CardDescription>
            </div>
            <button 
              onClick={() => runDesignCheck.mutate()} 
              disabled={runDesignCheck.isPending} 
              data-testid="button-run-design-check"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[#257D41] bg-[#257D41]/10 text-[#257D41] font-semibold hover:bg-[#257D41]/20 transition-colors disabled:opacity-50"
            >
              {runDesignCheck.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Palette className="w-4 h-4" />}
              Run Design Check
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="relative space-y-6">
          {!designResults && !runDesignCheck.isPending && (
            <div className="text-center py-8">
              <Palette className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="label-text text-gray-500 text-sm">Click "Run Design Check" to verify design consistency</p>
            </div>
          )}

        {runDesignCheck.isPending && (
          <div className="text-center py-12">
            <Loader2 className="w-16 h-16 mx-auto text-[#257D41] animate-spin mb-4" />
            <p className="label-text text-gray-500">Analyzing design consistency...</p>
          </div>
        )}

        {designResults && (
          <>
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-lg text-gray-900 font-semibold">Design Check Results</h3>
                  <p className="text-xs text-gray-500 font-mono mt-1">Run at: {formatDate(designResults.timestamp)}</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                  designResults.overallStatus === "PASS" ? "bg-green-100 text-green-700" :
                  designResults.overallStatus === "WARNING" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {designResults.overallStatus === "PASS" ? <CheckCircle2 className="w-5 h-5" /> :
                   designResults.overallStatus === "WARNING" ? <AlertTriangle className="w-5 h-5" /> :
                   <XCircle className="w-5 h-5" />}
                  <span className="font-display font-bold">{designResults.overallStatus}</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-center mb-6">
                <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
                  <div className="text-3xl font-mono font-bold text-gray-900">{designResults.totalChecks}</div>
                  <div className="text-xs text-gray-500 label-text mt-1">Total Checks</div>
                </div>
                <div className="p-4 rounded-xl bg-[#9FBCA4]/10 border border-[#9FBCA4]/30 shadow-sm">
                  <div className="text-3xl font-mono font-bold text-[#257D41]">{designResults.passed}</div>
                  <div className="text-xs text-gray-600 label-text mt-1">Passed</div>
                </div>
                <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200 shadow-sm">
                  <div className="text-3xl font-mono font-bold text-yellow-600">{designResults.warnings}</div>
                  <div className="text-xs text-gray-600 label-text mt-1">Warnings</div>
                </div>
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 shadow-sm">
                  <div className="text-3xl font-mono font-bold text-red-600">{designResults.failed}</div>
                  <div className="text-xs text-gray-600 label-text mt-1">Failed</div>
                </div>
              </div>

              <div className="space-y-2">
                {designResults.checks.map((check, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100">
                      {check.status === "pass" ? <CheckCircle2 className="w-5 h-5 text-[#257D41] shrink-0" /> :
                       check.status === "warning" ? <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" /> :
                       <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{check.category}</span>
                          <span className="text-gray-700 text-sm">{check.rule}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>{check.details}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{check.details}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        check.status === "pass" ? 'bg-green-100 text-green-700' : 
                        check.status === "warning" ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {check.status === "pass" ? 'PASS' : check.status === "warning" ? 'WARNING' : 'FAIL'}
                      </span>
                    </div>
                    {check.status === "fail" && (
                      <div className="ml-8 p-3 rounded-lg bg-red-50 border border-red-200">
                        <p className="text-xs text-red-700 font-medium">Diagnosis: {check.diagnosis || `Design standard violation in ${check.category}`}</p>
                        <p className="text-xs text-gray-600 mt-1">Solution: {check.solution || `Update component to follow ${check.category} design guidelines`}</p>
                      </div>
                    )}
                    {check.status === "warning" && (
                      <div className="ml-8 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                        <p className="text-xs text-yellow-700 font-medium">Diagnosis: {check.diagnosis || `Minor design inconsistency in ${check.category}`}</p>
                        <p className="text-xs text-gray-600 mt-1">Solution: {check.solution || `Consider updating to improve ${check.category} consistency`}</p>
                      </div>
                    )}
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
    <TooltipProvider>
    <Layout>
      <div className="space-y-8">
        <PageHeader 
            title={currentView === "dashboard" ? "Administration" : 
                   currentView === "users" ? "User Management" :
                   currentView === "activity" ? "Login Activity" :
                   currentView === "verification" ? "Financial Verification" : 
                   currentView === "themes" ? "Design Themes" : "Design Consistency"}
            subtitle={currentView === "dashboard" ? "Manage users, monitor activity, and run system verification" :
                      currentView === "users" ? "Add, edit, and manage user accounts" :
                      currentView === "activity" ? "Monitor user sessions and login history" :
                      currentView === "verification" ? "Run formula and GAAP compliance checks" :
                      currentView === "themes" ? "Manage color palettes and design systems" : "Check fonts, colors, and component standards"}
            variant="dark"
            actions={currentView !== "dashboard" ? (
              <GlassButton variant="primary" onClick={() => setCurrentView("dashboard")} data-testid="button-back">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </GlassButton>
            ) : undefined}
          />

        {currentView === "dashboard" && renderDashboard()}
        {currentView === "users" && renderUsers()}
        {currentView === "activity" && renderActivity()}
        {currentView === "verification" && renderVerification()}
        {currentView === "design" && renderDesign()}
        {currentView === "themes" && renderThemes()}
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

      {/* Theme Create/Edit Dialog */}
      <Dialog open={themeDialogOpen || !!editingTheme} onOpenChange={(open) => { if (!open) { setThemeDialogOpen(false); setEditingTheme(null); } }}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTheme ? "Edit Design Theme" : "Create Design Theme"}</DialogTitle>
            <DialogDescription>
              Define your design system colors and when to use them.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Theme Name</Label>
              <Input
                value={editingTheme ? editingTheme.name : newTheme.name}
                onChange={(e) => editingTheme 
                  ? setEditingTheme({ ...editingTheme, name: e.target.value })
                  : setNewTheme({ ...newTheme, name: e.target.value })
                }
                placeholder="e.g., Fluid Glass"
              />
            </div>
            <div>
              <Label>Description</Label>
              <textarea
                className="w-full min-h-[80px] p-3 border rounded-lg text-sm resize-none"
                value={editingTheme ? editingTheme.description : newTheme.description}
                onChange={(e) => editingTheme
                  ? setEditingTheme({ ...editingTheme, description: e.target.value })
                  : setNewTheme({ ...newTheme, description: e.target.value })
                }
                placeholder="Describe the design philosophy and inspiration..."
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Colors (up to 5)</Label>
                {((editingTheme?.colors.length || 0) < 5 || (newTheme.colors.length < 5 && !editingTheme)) && (
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      const newColor = { rank: (editingTheme?.colors.length || newTheme.colors.length) + 1, name: "", hexCode: "#000000", description: "" };
                      if (editingTheme) {
                        setEditingTheme({ ...editingTheme, colors: [...editingTheme.colors, newColor] });
                      } else {
                        setNewTheme({ ...newTheme, colors: [...newTheme.colors, newColor] });
                      }
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Color
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                {(editingTheme ? editingTheme.colors : newTheme.colors).map((color, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-gray-50 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-500 w-6">#{color.rank}</span>
                      <Input
                        value={color.name}
                        onChange={(e) => {
                          const colors = editingTheme ? [...editingTheme.colors] : [...newTheme.colors];
                          colors[idx] = { ...colors[idx], name: e.target.value };
                          if (editingTheme) setEditingTheme({ ...editingTheme, colors });
                          else setNewTheme({ ...newTheme, colors });
                        }}
                        placeholder="Color name"
                        className="flex-1"
                      />
                      <div className="w-40">
                        <ColorPicker
                          value={color.hexCode}
                          onChange={(newColor) => {
                            const colors = editingTheme ? [...editingTheme.colors] : [...newTheme.colors];
                            colors[idx] = { ...colors[idx], hexCode: newColor };
                            if (editingTheme) setEditingTheme({ ...editingTheme, colors });
                            else setNewTheme({ ...newTheme, colors });
                          }}
                        />
                      </div>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          const colors = (editingTheme ? editingTheme.colors : newTheme.colors)
                            .filter((_, i) => i !== idx)
                            .map((c, i) => ({ ...c, rank: i + 1 }));
                          if (editingTheme) setEditingTheme({ ...editingTheme, colors });
                          else setNewTheme({ ...newTheme, colors });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input
                      value={color.description}
                      onChange={(e) => {
                        const colors = editingTheme ? [...editingTheme.colors] : [...newTheme.colors];
                        colors[idx] = { ...colors[idx], description: e.target.value };
                        if (editingTheme) setEditingTheme({ ...editingTheme, colors });
                        else setNewTheme({ ...newTheme, colors });
                      }}
                      placeholder="When to use this color..."
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setThemeDialogOpen(false); setEditingTheme(null); }}>Cancel</Button>
            <Button 
              className="bg-[#257D41] hover:bg-[#1e6434]"
              onClick={() => {
                if (editingTheme) {
                  updateThemeMutation.mutate({ id: editingTheme.id, data: { name: editingTheme.name, description: editingTheme.description, colors: editingTheme.colors } });
                } else {
                  createThemeMutation.mutate(newTheme);
                }
              }}
              disabled={createThemeMutation.isPending || updateThemeMutation.isPending}
            >
              {(createThemeMutation.isPending || updateThemeMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingTheme ? "Save Changes" : "Create Theme"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
    </TooltipProvider>
  );
}
