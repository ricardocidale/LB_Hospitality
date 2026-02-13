import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Users, Key, Eye, EyeOff, Pencil, Clock, FileCheck, CheckCircle2, XCircle, AlertTriangle, PlayCircle, Palette, Activity, HelpCircle, SwatchBook, UserPlus, Shield, Mail, Calendar, LogIn, LogOut, Monitor, MapPin, Hash, LayoutGrid, Sparkles, Settings, FileText, Download, Save, FileDown, Image, PanelLeft, Building2, Tag, Database, RefreshCw } from "lucide-react";
import defaultLogo from "@/assets/logo.png";
import { Tabs, TabsContent, DarkGlassTabs } from "@/components/ui/tabs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Switch } from "@/components/ui/switch";
import { GlassButton } from "@/components/ui/glass-button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { invalidateAllFinancialQueries } from "@/lib/api";
import { ThemeManager } from "@/features/design-themes";
import { runFullVerification, runKnownValueTests, VerificationResults } from "@/lib/runVerification";
import { generatePropertyProForma, formatMoney } from "@/lib/financialEngine";
import { AuditReport } from "@/lib/financialAuditor";
import { formatDateTime, formatDuration } from "@/lib/formatters";

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
  userGroupId: number | null;
}

interface Logo {
  id: number;
  name: string;
  companyName: string;
  url: string;
  isDefault: boolean;
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

interface CheckResult {
  metric: string;
  category: string;
  gaapRef: string;
  formula: string;
  expected: number;
  actual: number;
  variance: number;
  variancePct: number;
  passed: boolean;
  severity: "critical" | "material" | "minor" | "info";
}

interface PropertyCheckResults {
  propertyName: string;
  propertyType: string;
  checks: CheckResult[];
  passed: number;
  failed: number;
  criticalIssues: number;
}

interface VerificationResult {
  timestamp: string;
  propertiesChecked: number;
  propertyResults: PropertyCheckResults[];
  companyChecks: CheckResult[];
  consolidatedChecks: CheckResult[];
  summary: {
    totalChecks: number;
    totalPassed: number;
    totalFailed: number;
    criticalIssues: number;
    materialIssues: number;
    auditOpinion: "UNQUALIFIED" | "QUALIFIED" | "ADVERSE";
    overallStatus: "PASS" | "FAIL" | "WARNING";
  };
  clientAuditWorkpaper?: string;
  clientAuditReports?: AuditReport[];
  clientKnownValueTests?: { passed: boolean; results: string };
}

interface UserGroup {
  id: number;
  name: string;
  logoId: number | null;
  themeId: number | null;
  assetDescriptionId: number | null;
  isDefault: boolean;
  createdAt: string;
}

type AdminView = "users" | "activity" | "verification" | "themes" | "branding" | "user-groups" | "sidebar" | "database";
type ActivitySubView = "login" | "feed" | "checker";

interface ActivityLogEntry {
  id: number;
  userId: number;
  userEmail: string;
  userName: string | null;
  action: string;
  entityType: string;
  entityId: number | null;
  entityName: string | null;
  metadata: Record<string, any> | null;
  ipAddress: string | null;
  createdAt: string;
}

interface CheckerSummary {
  id: number;
  email: string;
  name: string | null;
  totalActions: number;
  lastActive: string | null;
  verificationRuns: number;
  manualViews: number;
  exports: number;
}

interface CheckerActivityData {
  checkers: CheckerSummary[];
  summary: {
    totalActions: number;
    verificationRuns: number;
    manualViews: number;
    exports: number;
    pageVisits: number;
    roleChanges: number;
  };
  recentActivity: ActivityLogEntry[];
}

interface VerificationHistoryEntry {
  id: number;
  userId: number;
  totalChecks: number;
  passed: number;
  failed: number;
  auditOpinion: string;
  overallStatus: string;
  createdAt: string;
}

interface ActiveSession {
  id: string;
  userId: number;
  userEmail: string;
  userName: string | null;
  createdAt: string;
  expiresAt: string;
}

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [adminTab, setAdminTab] = useState<AdminView>("users");
  const [activitySubTab, setActivitySubTab] = useState<ActivitySubView>("login");
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [newUser, setNewUser] = useState({ email: "", password: "", name: "", company: "", title: "", role: "user" as string });
  const [editUser, setEditUser] = useState({ email: "", name: "", company: "", title: "", role: "user" as string });
  const [originalEmail, setOriginalEmail] = useState("");
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [verificationResults, setVerificationResults] = useState<VerificationResult | null>(null);
  const [designResults, setDesignResults] = useState<DesignCheckResult | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, any> | null>(null);
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);

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

  const { data: globalAssumptions } = useQuery({
    queryKey: ["globalAssumptions"],
    queryFn: async () => {
      const res = await fetch("/api/global-assumptions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch global assumptions");
      return res.json();
    },
    enabled: adminTab === "sidebar" || adminTab === "branding",
  });

  const updateSidebarMutation = useMutation({
    mutationFn: async (updates: Record<string, boolean>) => {
      const res = await fetch("/api/global-assumptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...globalAssumptions, ...updates }),
      });
      if (!res.ok) throw new Error("Failed to update sidebar settings");
      return res.json();
    },
    onSuccess: () => {
      invalidateAllFinancialQueries(queryClient);
      toast({ title: "Sidebar updated", description: "Navigation visibility saved for all users." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save sidebar settings.", variant: "destructive" });
    },
  });

  // Activity feed filter state
  const [activityEntityFilter, setActivityEntityFilter] = useState<string>("");
  const [activityUserFilter, setActivityUserFilter] = useState<string>("");

  // Login log filter state
  const [loginLogUserFilter, setLoginLogUserFilter] = useState<string>("");
  const [loginLogIpFilter, setLoginLogIpFilter] = useState<string>("");

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
    enabled: adminTab === "activity" && activitySubTab === "checker",
  });

  const { data: verificationHistory } = useQuery<VerificationHistoryEntry[]>({
    queryKey: ["admin", "verification-history"],
    queryFn: async () => {
      const res = await fetch("/api/admin/verification-history?limit=10", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch verification history");
      return res.json();
    },
  });

  const { data: activeSessionsList } = useQuery<ActiveSession[]>({
    queryKey: ["admin", "active-sessions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/active-sessions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch active sessions");
      return res.json();
    },
  });

  const [newLogoName, setNewLogoName] = useState("");
  const [newLogoUrl, setNewLogoUrl] = useState("");
  const [newAssetDescName, setNewAssetDescName] = useState("");

  const { data: adminLogos } = useQuery<Logo[]>({
    queryKey: ["admin", "logos"],
    queryFn: async () => {
      const res = await fetch("/api/admin/logos", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch logos");
      return res.json();
    },
    enabled: adminTab === "branding" || adminTab === "user-groups",
  });

  const { data: allThemes } = useQuery<Array<{ id: number; name: string; isDefault: boolean }>>({
    queryKey: ["admin", "all-themes"],
    queryFn: async () => {
      const res = await fetch("/api/design-themes", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch themes");
      return res.json();
    },
    enabled: adminTab === "branding" || adminTab === "user-groups",
  });

  interface AssetDesc { id: number; name: string; isDefault: boolean; createdAt: string; }
  const { data: assetDescriptions } = useQuery<AssetDesc[]>({
    queryKey: ["admin", "asset-descriptions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/asset-descriptions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch asset descriptions");
      return res.json();
    },
    enabled: adminTab === "branding" || adminTab === "user-groups",
  });

  const createAssetDescMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await fetch("/api/admin/asset-descriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create asset description");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "asset-descriptions"] });
      setNewAssetDescName("");
      toast({ title: "Asset Description Added", description: "New asset description has been created." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteAssetDescMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/asset-descriptions/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete asset description");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "asset-descriptions"] });
      toast({ title: "Asset Description Deleted", description: "Asset description has been removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateGlobalMutation = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const res = await fetch("/api/global-assumptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...globalAssumptions, ...updates }),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      invalidateAllFinancialQueries(queryClient);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    },
  });


  const createLogoMutation = useMutation({
    mutationFn: async (data: { name: string; url: string }) => {
      const res = await fetch("/api/admin/logos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create logo");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "logos"] });
      setNewLogoName("");
      setNewLogoUrl("");
      toast({ title: "Logo Added", description: "New logo has been added to the portfolio." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteLogoMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/logos/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete logo");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "logos"] });
      toast({ title: "Logo Deleted", description: "Logo has been removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // --- User Groups ---
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [groupForm, setGroupForm] = useState({ name: "", logoId: null as number | null, themeId: null as number | null, assetDescriptionId: null as number | null });

  const { data: userGroupsList } = useQuery<UserGroup[]>({
    queryKey: ["admin", "user-groups"],
    queryFn: async () => {
      const res = await fetch("/api/admin/user-groups", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user groups");
      return res.json();
    },
    enabled: adminTab === "user-groups" || adminTab === "branding",
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; logoId?: number | null; themeId?: number | null; assetDescriptionId?: number | null }) => {
      const res = await fetch("/api/admin/user-groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!res.ok) throw new Error("Failed to create group");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user-groups"] });
      setGroupDialogOpen(false);
      setGroupForm({ name: "", logoId: null, themeId: null, assetDescriptionId: null });
      setEditingGroup(null);
      toast({ title: "Group Created", description: "User group has been created." });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; name?: string; logoId?: number | null; themeId?: number | null; assetDescriptionId?: number | null }) => {
      const res = await fetch(`/api/admin/user-groups/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!res.ok) throw new Error("Failed to update group");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user-groups"] });
      setGroupDialogOpen(false);
      setEditingGroup(null);
      toast({ title: "Group Updated", description: "User group has been updated." });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/user-groups/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete group");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user-groups"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({ title: "Group Deleted", description: "User group has been deleted." });
    },
  });

  const assignGroupMutation = useMutation({
    mutationFn: async ({ userId, groupId }: { userId: number; groupId: number | null }) => {
      const res = await fetch(`/api/admin/users/${userId}/group`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ groupId }), credentials: "include" });
      if (!res.ok) throw new Error("Failed to assign group");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({ title: "Group Assigned", description: "User has been assigned to the group." });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; name?: string; company?: string; title?: string; role?: string }) => {
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
      setNewUser({ email: "", password: "", name: "", company: "", title: "", role: "user" });
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
    mutationFn: async ({ id, data }: { id: number; data: { email?: string; name?: string; company?: string; title?: string; role?: string } }) => {
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

  const [aiReview, setAiReview] = useState<string>("");
  const [aiReviewLoading, setAiReviewLoading] = useState(false);

  const runVerification = useMutation({
    mutationFn: async () => {
      const [propertiesRes, assumptionsRes] = await Promise.all([
        fetch("/api/properties", { credentials: "include" }),
        fetch("/api/global-assumptions", { credentials: "include" })
      ]);
      
      if (!propertiesRes.ok) throw new Error("Failed to fetch properties");
      if (!assumptionsRes.ok) throw new Error("Failed to fetch global assumptions");
      
      const properties = await propertiesRes.json();
      const globalAssumptions = await assumptionsRes.json();
      
      const comprehensiveResults = runFullVerification(properties, globalAssumptions);
      const knownValueTests = runKnownValueTests();
      
      const serverRes = await fetch("/api/admin/run-verification", { credentials: "include" });
      if (!serverRes.ok) throw new Error("Server verification failed");
      const serverReport: VerificationResult = await serverRes.json();
      
      return {
        ...serverReport,
        clientAuditWorkpaper: comprehensiveResults.auditWorkpaper,
        clientAuditReports: comprehensiveResults.auditReports,
        clientKnownValueTests: knownValueTests,
      };
    },
    onSuccess: (data) => {
      setVerificationResults(data);
      setAiReview("");
      queryClient.invalidateQueries({ queryKey: ["admin", "verification-history"] });
      toast({
        title: data.summary.auditOpinion === "UNQUALIFIED" ? "Audit Complete - Unqualified Opinion" :
               data.summary.auditOpinion === "QUALIFIED" ? "Audit Complete - Qualified Opinion" :
               "Audit Complete - Issues Found",
        description: `${data.summary.totalChecks} checks run. ${data.summary.criticalIssues} critical issues.`,
        variant: data.summary.auditOpinion === "UNQUALIFIED" ? "default" : "destructive"
      });
    },
    onError: (error: Error) => {
      toast({ title: "Verification Failed", description: error.message, variant: "destructive" });
    }
  });

  const runAiVerification = async () => {
    setAiReviewLoading(true);
    setAiReview("");
    try {
      const res = await fetch("/api/admin/ai-verification", { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("AI verification failed");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.content) {
                setAiReview(prev => prev + parsed.content);
              }
            } catch {}
          }
        }
      }
    } catch (error: any) {
      toast({ title: "AI Review Failed", description: error.message, variant: "destructive" });
    } finally {
      setAiReviewLoading(false);
    }
  };

  const exportVerificationPDF = () => {
    if (!verificationResults) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Independent Financial Verification Report", pageWidth / 2, y, { align: "center" });
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Hospitality Business Company | ${new Date(verificationResults.timestamp).toLocaleDateString()}`, pageWidth / 2, y, { align: "center" });
    y += 12;

    // Audit Opinion banner
    const opinion = verificationResults.summary.auditOpinion;
    const status = verificationResults.summary.overallStatus;
    doc.setFillColor(opinion === "UNQUALIFIED" ? 34 : opinion === "QUALIFIED" ? 200 : 220,
                     opinion === "UNQUALIFIED" ? 125 : opinion === "QUALIFIED" ? 180 : 50,
                     opinion === "UNQUALIFIED" ? 65 : opinion === "QUALIFIED" ? 30 : 50);
    doc.rect(14, y, pageWidth - 28, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Audit Opinion: ${opinion} | Overall Status: ${status}`, pageWidth / 2, y + 8, { align: "center" });
    doc.setTextColor(0, 0, 0);
    y += 18;

    // Summary stats
    const s = verificationResults.summary;
    autoTable(doc, {
      startY: y,
      head: [["Total Checks", "Passed", "Failed", "Critical Issues", "Material Issues"]],
      body: [[s.totalChecks, s.totalPassed, s.totalFailed, s.criticalIssues, s.materialIssues]],
      theme: "grid",
      headStyles: { fillColor: [45, 74, 94], fontSize: 9 },
      bodyStyles: { halign: "center", fontSize: 10, fontStyle: "bold" },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // Known-value tests
    if (verificationResults.clientKnownValueTests) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Known-Value Test Cases", 14, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      const testLines = verificationResults.clientKnownValueTests.results.split("\n");
      for (const line of testLines) {
        if (y > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); y = 20; }
        doc.text(line, 14, y);
        y += 3.5;
      }
      y += 5;
    }

    // Server-side property checks
    for (const propResult of verificationResults.propertyResults) {
      if (y > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`${propResult.propertyName} (${propResult.propertyType})`, 14, y);
      y += 2;

      const rows = propResult.checks.map(c => [
        c.passed ? "PASS" : "FAIL",
        c.severity.toUpperCase(),
        c.gaapRef,
        c.metric,
        c.formula.length > 50 ? c.formula.slice(0, 50) + "..." : c.formula,
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Status", "Severity", "GAAP Ref", "Metric", "Formula"]],
        body: rows,
        theme: "striped",
        headStyles: { fillColor: [45, 74, 94], fontSize: 7 },
        bodyStyles: { fontSize: 6.5 },
        columnStyles: {
          0: { cellWidth: 14, halign: "center", fontStyle: "bold" },
          1: { cellWidth: 18 },
          2: { cellWidth: 22 },
          3: { cellWidth: 45 },
        },
        didParseCell: (data: any) => {
          if (data.column.index === 0 && data.cell.raw === "PASS") {
            data.cell.styles.textColor = [34, 125, 65];
          } else if (data.column.index === 0 && data.cell.raw === "FAIL") {
            data.cell.styles.textColor = [220, 50, 50];
          }
        },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // Company checks
    if (verificationResults.companyChecks.length > 0) {
      if (y > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Management Company Checks", 14, y);
      y += 2;
      const rows = verificationResults.companyChecks.map(c => [
        c.passed ? "PASS" : "FAIL", c.severity.toUpperCase(), c.gaapRef, c.metric, c.formula.length > 50 ? c.formula.slice(0, 50) + "..." : c.formula
      ]);
      autoTable(doc, {
        startY: y, head: [["Status", "Severity", "GAAP Ref", "Metric", "Formula"]], body: rows, theme: "striped",
        headStyles: { fillColor: [45, 74, 94], fontSize: 7 }, bodyStyles: { fontSize: 6.5 },
        columnStyles: { 0: { cellWidth: 14, halign: "center", fontStyle: "bold" }, 1: { cellWidth: 18 }, 2: { cellWidth: 22 }, 3: { cellWidth: 45 } },
        didParseCell: (data: any) => {
          if (data.column.index === 0 && data.cell.raw === "PASS") data.cell.styles.textColor = [34, 125, 65];
          else if (data.column.index === 0 && data.cell.raw === "FAIL") data.cell.styles.textColor = [220, 50, 50];
        },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // Consolidated checks
    if (verificationResults.consolidatedChecks.length > 0) {
      if (y > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Consolidated Portfolio Checks", 14, y);
      y += 2;
      const rows = verificationResults.consolidatedChecks.map(c => [
        c.passed ? "PASS" : "FAIL", c.severity.toUpperCase(), c.gaapRef, c.metric, c.formula.length > 50 ? c.formula.slice(0, 50) + "..." : c.formula
      ]);
      autoTable(doc, {
        startY: y, head: [["Status", "Severity", "GAAP Ref", "Metric", "Formula"]], body: rows, theme: "striped",
        headStyles: { fillColor: [45, 74, 94], fontSize: 7 }, bodyStyles: { fontSize: 6.5 },
        columnStyles: { 0: { cellWidth: 14, halign: "center", fontStyle: "bold" }, 1: { cellWidth: 18 }, 2: { cellWidth: 22 }, 3: { cellWidth: 45 } },
        didParseCell: (data: any) => {
          if (data.column.index === 0 && data.cell.raw === "PASS") data.cell.styles.textColor = [34, 125, 65];
          else if (data.column.index === 0 && data.cell.raw === "FAIL") data.cell.styles.textColor = [220, 50, 50];
        },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // Client-side audit summary
    if (verificationResults.clientAuditReports && verificationResults.clientAuditReports.length > 0) {
      if (y > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Client-Side GAAP Audit Summary", 14, y);
      y += 5;
      const rows = verificationResults.clientAuditReports.flatMap(report =>
        report.sections.map(sec => [
          report.propertyName,
          sec.name,
          `${sec.passed}/${sec.passed + sec.failed}`,
          sec.failed === 0 ? "PASS" : sec.materialIssues > 0 ? "FAIL" : "WARNING",
        ])
      );
      autoTable(doc, {
        startY: y, head: [["Property", "Audit Section", "Checks", "Status"]], body: rows, theme: "striped",
        headStyles: { fillColor: [45, 74, 94], fontSize: 8 }, bodyStyles: { fontSize: 7 },
        didParseCell: (data: any) => {
          if (data.column.index === 3 && data.cell.raw === "PASS") data.cell.styles.textColor = [34, 125, 65];
          else if (data.column.index === 3 && data.cell.raw === "FAIL") data.cell.styles.textColor = [220, 50, 50];
          else if (data.column.index === 3 && data.cell.raw === "WARNING") data.cell.styles.textColor = [200, 150, 0];
        },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(`Hospitality Business - Verification Report | Page ${p} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
    }

    doc.save(`verification-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const runDesignCheck = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/run-design-check", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to run design check");
      return res.json();
    },
    onSuccess: (data) => {
      setDesignResults(data);
    },
    onError: (error: Error) => {
      toast({ title: "Design Check Failed", description: error.message, variant: "destructive" });
    },
  });

  const checkSyncStatus = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/sync-status", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to check sync status");
      return res.json();
    },
    onSuccess: (data) => {
      setSyncResults(data);
    },
    onError: (error: Error) => {
      toast({ title: "Sync Check Failed", description: error.message, variant: "destructive" });
    },
  });

  const executeSyncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/seed-production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mode: "sync" }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Sync failed" }));
        throw new Error(errData.error || "Sync failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Sync Complete", description: data.message || "Database synchronized successfully" });
      setSyncConfirmOpen(false);
      checkSyncStatus.mutate();
    },
    onError: (error: Error) => {
      toast({ title: "Sync Failed", description: error.message, variant: "destructive" });
      setSyncConfirmOpen(false);
    },
  });

  const syncAutoChecked = useRef(false);
  useEffect(() => {
    if (adminTab === "database" && !syncResults && !checkSyncStatus.isPending && !syncAutoChecked.current) {
      syncAutoChecked.current = true;
      checkSyncStatus.mutate();
    }
    if (adminTab !== "database") {
      syncAutoChecked.current = false;
    }
  }, [adminTab]);

  // Auto-run verification when entering verification view
  const verificationAutoRan = useRef(false);
  useEffect(() => {
    if (adminTab === "verification" && !verificationResults && !runVerification.isPending && !verificationAutoRan.current) {
      verificationAutoRan.current = true;
      runVerification.mutate();
    }
    if (adminTab !== "verification") {
      verificationAutoRan.current = false;
    }
  }, [adminTab]);



  const renderUsers = () => (
    <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">

      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-display">User Management</CardTitle>
            <CardDescription className="label-text">
              {users?.length || 0} registered users
            </CardDescription>
          </div>
          <GlassButton variant="primary" onClick={() => setDialogOpen(true)} data-testid="button-add-user">
            <UserPlus className="w-4 h-4" />
            Add User
          </GlassButton>
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        {usersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20 hover:bg-transparent">
                <TableHead className="text-muted-foreground font-display"><div className="flex items-center gap-2"><Users className="w-4 h-4" />User</div></TableHead>
                <TableHead className="text-muted-foreground font-display"><div className="flex items-center gap-2"><Shield className="w-4 h-4" />Role</div></TableHead>
                <TableHead className="text-muted-foreground font-display"><div className="flex items-center gap-2"><Calendar className="w-4 h-4" />Created</div></TableHead>
                <TableHead className="text-muted-foreground font-display text-right"><div className="flex items-center justify-end gap-2"><Settings className="w-4 h-4" />Actions</div></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id} className="border-primary/20 hover:bg-primary/5" data-testid={`row-user-${user.id}`}>
                  <TableCell>
                    <div className="font-display font-medium">{user.name || user.email}</div>
                    {user.name && <div className="text-xs text-muted-foreground">{user.email}</div>}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-secondary/15 text-secondary' : 'bg-primary/10 text-muted-foreground'}`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">{formatDateTime(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-primary/10"
                        onClick={() => { setSelectedUser(user); setOriginalEmail(user.email); setEditUser({ email: user.email, name: user.name || "", company: user.company || "", title: user.title || "", role: user.role || "user" }); setEditDialogOpen(true); }}
                        data-testid={`button-edit-user-${user.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-primary/10"
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
        {/* Login Log Filters */}
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

    {/* Active Sessions */}
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


  const severityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-700";
      case "material": return "bg-yellow-100 text-yellow-700";
      case "minor": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const renderCheckRow = (chk: CheckResult, idx: number) => (
    <div key={idx} className="space-y-1">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100">
        {chk.passed ? <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-800 text-sm font-medium">{chk.metric}</span>
            {!chk.passed && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${severityColor(chk.severity)}`}>{chk.severity.toUpperCase()}</span>
            )}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-secondary font-mono">{chk.gaapRef}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 font-mono">{chk.formula}</p>
        </div>
        <div className="text-right shrink-0 ml-2">
          <span className={`text-xs px-2 py-1 rounded font-semibold ${chk.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {chk.passed ? 'PASS' : 'FAIL'}
          </span>
        </div>
      </div>
      {!chk.passed && (
        <div className="ml-8 p-3 rounded-lg bg-red-50 border border-red-200">
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div><span className="text-gray-500">Expected:</span> <span className="font-mono font-semibold">{formatMoney(chk.expected)}</span></div>
            <div><span className="text-gray-500">Actual:</span> <span className="font-mono font-semibold">{formatMoney(chk.actual)}</span></div>
            <div><span className="text-gray-500">Variance:</span> <span className="font-mono font-semibold text-red-600">{formatMoney(chk.variance)} ({chk.variancePct.toFixed(2)}%)</span></div>
          </div>
        </div>
      )}
    </div>
  );

  /** Activity Feed — filterable log of all user actions across the system. */
  const renderActivityFeed = () => (
    <div className="space-y-6">
      {/* Filters */}
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

      {/* Activity Table */}
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

  const renderVerification = () => (<>
    <Card className="relative overflow-hidden bg-white/80 backdrop-blur-xl border border-gray-200 shadow-2xl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-primary/10 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-secondary/10 blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-display text-gray-900">Independent Financial Verification</CardTitle>
            <CardDescription className="label-text text-gray-600">
              Server-side independent recalculation with GAAP variance analysis
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => runVerification.mutate()} 
              disabled={runVerification.isPending} 
              data-testid="button-run-verification"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-secondary bg-secondary/10 text-secondary font-semibold hover:bg-secondary/20 transition-colors disabled:opacity-50"
            >
              {runVerification.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
              Run Verification
            </button>
            {verificationResults && (
              <>
                <button
                  onClick={runAiVerification}
                  disabled={aiReviewLoading}
                  data-testid="button-ai-verification"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[#F4795B] bg-[#F4795B]/10 text-[#F4795B] font-semibold hover:bg-[#F4795B]/20 transition-colors disabled:opacity-50"
                >
                  {aiReviewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  AI Review
                </button>
                <button
                  onClick={exportVerificationPDF}
                  data-testid="button-export-verification-pdf"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-400 bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  Export PDF
                </button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-6">
        {!verificationResults && !runVerification.isPending && (
          verificationHistory?.[0] ? (
            <div className={`p-5 rounded-2xl border-2 ${
              verificationHistory[0].auditOpinion === "UNQUALIFIED" ? "bg-green-50 border-green-200" :
              verificationHistory[0].auditOpinion === "QUALIFIED" ? "bg-yellow-50 border-yellow-200" :
              "bg-red-50 border-red-200"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {verificationHistory[0].auditOpinion === "UNQUALIFIED" ?
                    <CheckCircle2 className="w-7 h-7 text-green-600" /> :
                    verificationHistory[0].auditOpinion === "QUALIFIED" ?
                    <AlertTriangle className="w-7 h-7 text-yellow-600" /> :
                    <XCircle className="w-7 h-7 text-red-600" />
                  }
                  <div>
                    <h3 className="font-display text-base font-bold">Last Run: {verificationHistory[0].auditOpinion}</h3>
                    <p className="text-xs text-gray-500">
                      {verificationHistory[0].passed}/{verificationHistory[0].totalChecks} checks passed on {new Date(verificationHistory[0].createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 label-text">Running fresh verification...</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-4" />
              <p className="label-text text-gray-500">Starting verification...</p>
            </div>
          )
        )}

        {runVerification.isPending && (
          <div className="text-center py-12">
            <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-4" />
            <p className="label-text text-gray-500">Running independent recalculation...</p>
          </div>
        )}

        {verificationResults && (
          <>
            <div className={`p-5 rounded-2xl border-2 ${
              verificationResults.summary.auditOpinion === "UNQUALIFIED" ? "bg-green-50 border-green-300" :
              verificationResults.summary.auditOpinion === "QUALIFIED" ? "bg-yellow-50 border-yellow-300" :
              "bg-red-50 border-red-300"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {verificationResults.summary.auditOpinion === "UNQUALIFIED" ? 
                    <CheckCircle2 className="w-8 h-8 text-green-600" /> :
                    verificationResults.summary.auditOpinion === "QUALIFIED" ? 
                    <AlertTriangle className="w-8 h-8 text-yellow-600" /> :
                    <XCircle className="w-8 h-8 text-red-600" />
                  }
                  <div>
                    <h3 className="font-display text-lg font-bold">Audit Opinion: {verificationResults.summary.auditOpinion}</h3>
                    <p className="text-sm text-gray-600">Independent Calculation Verification Report</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  verificationResults.summary.overallStatus === "PASS" ? "bg-green-100 text-green-700" :
                  verificationResults.summary.overallStatus === "WARNING" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  <span className="font-display font-bold">{verificationResults.summary.overallStatus}</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4 text-center">
                <div className="p-4 rounded-xl bg-white/60 border border-gray-200 shadow-sm">
                  <div className="text-3xl font-mono font-bold text-gray-900">{verificationResults.summary.totalChecks}</div>
                  <div className="text-xs text-gray-500 label-text mt-1">Total Checks</div>
                </div>
                <div className="p-4 rounded-xl bg-white/60 border border-gray-200 shadow-sm">
                  <div className="text-3xl font-mono font-bold text-secondary">{verificationResults.summary.totalPassed}</div>
                  <div className="text-xs text-gray-600 label-text mt-1">Passed</div>
                </div>
                <div className="p-4 rounded-xl bg-white/60 border border-gray-200 shadow-sm">
                  <div className="text-3xl font-mono font-bold text-red-600">{verificationResults.summary.totalFailed}</div>
                  <div className="text-xs text-gray-600 label-text mt-1">Failed</div>
                </div>
                <div className="p-4 rounded-xl bg-white/60 border border-gray-200 shadow-sm">
                  <div className="text-3xl font-mono font-bold text-red-600">{verificationResults.summary.criticalIssues}</div>
                  <div className="text-xs text-gray-600 label-text mt-1">Critical</div>
                </div>
                <div className="p-4 rounded-xl bg-white/60 border border-gray-200 shadow-sm">
                  <div className="text-3xl font-mono font-bold text-yellow-600">{verificationResults.summary.materialIssues}</div>
                  <div className="text-xs text-gray-600 label-text mt-1">Material</div>
                </div>
              </div>
              <p className="text-xs text-gray-500 font-mono mt-3 text-right">Verified at: {formatDateTime(verificationResults.timestamp)}</p>
            </div>

            {/* AI Review */}
            {(aiReview || aiReviewLoading) && (
              <div className="p-5 rounded-2xl bg-[#F4795B]/10 border border-[#F4795B]/30">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-6 h-6 text-[#F4795B]" />
                  <h3 className="font-display font-semibold text-gray-900">AI Methodology Review</h3>
                  {aiReviewLoading && <Loader2 className="w-4 h-4 animate-spin text-[#F4795B]" />}
                </div>
                <pre className="text-xs font-mono bg-white/80 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap border border-gray-200 max-h-96 overflow-y-auto">
                  {aiReview || "Analyzing verification results..."}
                </pre>
              </div>
            )}

            {/* Client-side Known Value Tests */}
            {verificationResults.clientKnownValueTests && (
              <div className={`p-5 rounded-2xl border-2 ${verificationResults.clientKnownValueTests.passed ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}`}>
                <div className="flex items-center gap-3 mb-3">
                  {verificationResults.clientKnownValueTests.passed ? 
                    <CheckCircle2 className="w-6 h-6 text-green-600" /> :
                    <XCircle className="w-6 h-6 text-red-600" />
                  }
                  <h3 className="font-display font-semibold">Known-Value Test Cases</h3>
                </div>
                <pre className="text-xs font-mono bg-white/80 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap border border-gray-200">
                  {verificationResults.clientKnownValueTests.results}
                </pre>
              </div>
            )}

            {/* Property-Level Independent Checks */}
            {verificationResults.propertyResults.map((property, pIdx) => (
              <div key={pIdx} className="p-5 rounded-2xl bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-display text-gray-900 font-semibold">
                    {property.propertyName} <span className="text-gray-500 font-normal text-sm">({property.propertyType})</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-secondary bg-green-50 px-2 py-1 rounded">{property.passed} passed</span>
                    {property.failed > 0 && <span className="text-xs font-mono text-red-600 bg-red-50 px-2 py-1 rounded">{property.failed} failed</span>}
                    {property.criticalIssues > 0 && <span className="text-xs font-mono text-red-700 bg-red-100 px-2 py-1 rounded">{property.criticalIssues} critical</span>}
                  </div>
                </div>
                <div className="space-y-2">
                  {property.checks.map((chk, cIdx) => renderCheckRow(chk, cIdx))}
                </div>
              </div>
            ))}

            {/* Management Company Checks */}
            {verificationResults.companyChecks.length > 0 && (
              <div className="p-5 rounded-2xl bg-primary/10 border border-primary/30">
                <h4 className="font-display text-secondary font-semibold mb-3">Management Company Checks</h4>
                <div className="space-y-2">
                  {verificationResults.companyChecks.map((chk, cIdx) => renderCheckRow(chk, cIdx))}
                </div>
              </div>
            )}

            {/* Consolidated Portfolio Checks */}
            {verificationResults.consolidatedChecks.length > 0 && (
              <div className="p-5 rounded-2xl bg-secondary/10 border border-secondary/30">
                <h4 className="font-display text-secondary font-semibold mb-3">Consolidated Portfolio Checks</h4>
                <div className="space-y-2">
                  {verificationResults.consolidatedChecks.map((chk, cIdx) => renderCheckRow(chk, cIdx))}
                </div>
              </div>
            )}

            {/* Client-side Audit Reports */}
            {verificationResults.clientAuditReports && verificationResults.clientAuditReports.length > 0 && (
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-display text-gray-900 font-semibold">Client-Side Audit Reports</h4>
                  {verificationResults.clientAuditWorkpaper && (
                    <button
                      onClick={() => {
                        const blob = new Blob([verificationResults.clientAuditWorkpaper!], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `audit-workpaper-${new Date().toISOString().slice(0,10)}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download Workpaper
                    </button>
                  )}
                </div>
                {verificationResults.clientAuditReports.map((report, rIdx) => (
                  <div key={rIdx} className="mt-4 p-4 bg-white/80 rounded-lg border border-gray-200">
                    <h4 className="font-display font-semibold text-gray-800 mb-2">{report.propertyName}</h4>
                    <div className="space-y-2">
                      {report.sections.map((section, sIdx) => (
                        <div key={sIdx} className="flex items-center justify-between p-2 rounded bg-gray-50">
                          <div className="flex items-center gap-2">
                            {section.failed === 0 ? 
                              <CheckCircle2 className="w-4 h-4 text-green-600" /> :
                              section.materialIssues > 0 ?
                              <XCircle className="w-4 h-4 text-red-600" /> :
                              <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            }
                            <span className="text-sm font-medium">{section.name}</span>
                          </div>
                          <span className="text-xs font-mono text-gray-600">{section.passed}/{section.findings.length} passed</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>

    {/* Verification History */}
    {verificationHistory && verificationHistory.length > 0 && (
      <Card className="relative overflow-hidden bg-white/80 backdrop-blur-xl border border-gray-200 shadow-2xl mt-6">
        <CardHeader className="relative">
          <CardTitle className="text-lg font-display text-gray-900">Verification History</CardTitle>
          <CardDescription className="label-text text-gray-600">
            Past verification runs with audit opinions
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider">Date</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Checks</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Passed</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Failed</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Opinion</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verificationHistory.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="text-sm font-mono">
                    {new Date(run.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm font-mono">{run.totalChecks}</TableCell>
                  <TableCell className="text-sm font-mono text-green-700">{run.passed}</TableCell>
                  <TableCell className="text-sm font-mono text-red-600">{run.failed}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                      run.auditOpinion === "UNQUALIFIED" ? "bg-green-100 text-green-700" :
                      run.auditOpinion === "QUALIFIED" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {run.auditOpinion}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                      run.overallStatus === "PASS" ? "bg-green-100 text-green-700" :
                      run.overallStatus === "WARNING" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {run.overallStatus}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )}
    </>
  );

  const renderBranding = () => (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Management Company</CardTitle>
          <CardDescription className="label-text">Define the management company name and logo used in financial reports and navigation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="label-text text-gray-700">Company Name</Label>
              <Input
                value={globalAssumptions?.companyName || "Hospitality Business"}
                onChange={(e) => updateGlobalMutation.mutate({ companyName: e.target.value })}
                placeholder="Enter management company name"
                className="bg-white"
                data-testid="input-company-name"
              />
              <p className="text-xs text-muted-foreground">The entity name used in financial modeling and reports</p>
            </div>
            <div className="space-y-2">
              <Label className="label-text text-gray-700">Company Logo</Label>
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-lg border-2 border-dashed border-primary/40 flex items-center justify-center overflow-hidden bg-white">
                  <img
                    src={(() => {
                      if (globalAssumptions?.companyLogoId) {
                        const logo = adminLogos?.find(l => l.id === globalAssumptions.companyLogoId);
                        if (logo) return logo.url;
                      }
                      return globalAssumptions?.companyLogoUrl || globalAssumptions?.companyLogo || defaultLogo;
                    })()}
                    alt="Company logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Select
                    value={globalAssumptions?.companyLogoId ? String(globalAssumptions.companyLogoId) : "default"}
                    onValueChange={(v) => {
                      const logoId = v === "default" ? null : Number(v);
                      updateGlobalMutation.mutate({ companyLogoId: logoId }, {
                        onSuccess: () => toast({ title: logoId ? "Logo updated" : "Logo reset", description: logoId ? "Management company logo has been updated." : "Logo has been reset to default." })
                      });
                    }}
                  >
                    <SelectTrigger data-testid="select-company-logo"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Logo</SelectItem>
                      {adminLogos?.map(logo => (
                        <SelectItem key={logo.id} value={String(logo.id)}>{logo.name}{logo.isDefault ? " (Default)" : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Select from Logo Portfolio below</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2"><Tag className="w-5 h-5 text-primary" /> Property Type</CardTitle>
          <CardDescription className="label-text">Set the property type label used across the application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label className="label-text text-gray-700">Property Type Label</Label>
            <Input
              value={globalAssumptions?.propertyLabel || "Boutique Hotel"}
              onChange={(e) => updateGlobalMutation.mutate({ propertyLabel: e.target.value })}
              placeholder="e.g., Boutique Hotel, Estate Hotel, Private Estate"
              className="bg-white max-w-md"
              data-testid="input-property-label"
            />
            <p className="text-xs text-muted-foreground">This label appears in page titles, research prompts, and financial reports</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2"><Tag className="w-5 h-5 text-primary" /> Asset Descriptions</CardTitle>
          <CardDescription className="label-text">Define asset description labels that can be assigned to users</CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {assetDescriptions?.map(ad => (
              <div key={ad.id} className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between" data-testid={`asset-desc-card-${ad.id}`}>
                <div className="min-w-0">
                  <p className="text-foreground font-medium truncate">{ad.name}</p>
                  {ad.isDefault && <span className="text-xs text-primary font-mono">DEFAULT</span>}
                </div>
                {!ad.isDefault && (
                  <Button variant="ghost" size="sm" onClick={() => deleteAssetDescMutation.mutate(ad.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10" data-testid={`button-delete-asset-desc-${ad.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-primary/20 pt-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-muted-foreground text-xs">Name</Label>
                <Input value={newAssetDescName} onChange={(e) => setNewAssetDescName(e.target.value)} placeholder="e.g., Luxury Resort, Urban Boutique" className="bg-primary/5 border-primary/20" data-testid="input-new-asset-desc-name" />
              </div>
              <Button variant="outline" onClick={() => createAssetDescMutation.mutate({ name: newAssetDescName })} disabled={!newAssetDescName || createAssetDescMutation.isPending} className="flex items-center gap-2" data-testid="button-add-asset-desc">
                {createAssetDescMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2"><Image className="w-5 h-5 text-primary" /> Logo Portfolio</CardTitle>
          <CardDescription className="label-text">Manage logos available for user assignment</CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminLogos?.map(logo => (
              <div key={logo.id} className="relative bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-4" data-testid={`logo-card-${logo.id}`}>
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
                  <img src={logo.url} alt={logo.name} className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium truncate">{logo.name}</p>
                  {logo.isDefault && <span className="text-xs text-primary font-mono">DEFAULT</span>}
                </div>
                {!logo.isDefault && (
                  <Button variant="ghost" size="sm" onClick={() => deleteLogoMutation.mutate(logo.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10" data-testid={`button-delete-logo-${logo.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-primary/20 pt-4">
            <h4 className="text-foreground/80 font-medium mb-3">Add New Logo</h4>
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-muted-foreground text-xs">Name</Label>
                <Input value={newLogoName} onChange={(e) => setNewLogoName(e.target.value)} placeholder="Logo name" className="bg-primary/5 border-primary/20" data-testid="input-new-logo-name" />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-muted-foreground text-xs">URL</Label>
                <Input value={newLogoUrl} onChange={(e) => setNewLogoUrl(e.target.value)} placeholder="/logos/custom.png or https://..." className="bg-primary/5 border-primary/20" data-testid="input-new-logo-url" />
              </div>
              <Button variant="outline" onClick={() => createLogoMutation.mutate({ name: newLogoName, url: newLogoUrl })} disabled={!newLogoName || !newLogoUrl || createLogoMutation.isPending} className="flex items-center gap-2" data-testid="button-add-logo">
                {createLogoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> User Branding</CardTitle>
          <CardDescription className="label-text">Branding is managed at the User Group level. Assign users to groups in the User Groups tab to control their branding experience.</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20 hover:bg-transparent">
                <TableHead className="text-muted-foreground">User</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">Group</TableHead>
                <TableHead className="text-muted-foreground">Effective Logo</TableHead>
                <TableHead className="text-muted-foreground">Effective Theme</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map(user => {
                const group = userGroupsList?.find((g: UserGroup) => g.id === user.userGroupId);
                const groupLogo = group?.logoId ? adminLogos?.find(l => l.id === group.logoId) : null;
                const groupTheme = group?.themeId ? allThemes?.find(t => t.id === group.themeId) : null;
                return (
                  <TableRow key={user.id} className="border-primary/20 hover:bg-primary/5" data-testid={`branding-row-${user.id}`}>
                    <TableCell className="text-foreground">
                      <div>
                        <span className="font-medium">{user.name || user.email}</span>
                        {user.name && <span className="text-muted-foreground text-xs ml-2">{user.email}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                        user.role === "admin" ? "bg-primary/20 text-primary" :
                        user.role === "checker" ? "bg-blue-500/20 text-blue-400" :
                        "bg-primary/10 text-muted-foreground"
                      }`}>{user.role}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {group ? <span className="text-sm font-medium">{group.name}</span> : <span className="text-muted-foreground text-sm italic">No group</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {groupLogo ? (
                        <div className="flex items-center gap-2">
                          <img src={groupLogo.url} alt={groupLogo.name} className="w-6 h-6 rounded object-contain bg-primary/10" />
                          <span className="text-sm">{groupLogo.name}</span>
                        </div>
                      ) : <span className="text-muted-foreground text-sm">Default</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {groupTheme ? <span className="text-sm">{groupTheme.name}</span> : <span className="text-muted-foreground text-sm">Default</span>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderUserGroups = () => (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> User Groups</CardTitle>
              <CardDescription className="label-text">Create groups with a company name and logo. Assign users to groups so they see the group's branding.</CardDescription>
            </div>
            <Button variant="outline" onClick={() => {
              setEditingGroup(null);
              setGroupForm({ name: "", logoId: null, themeId: null, assetDescriptionId: null });
              setGroupDialogOpen(true);
            }} className="flex items-center gap-2" data-testid="button-add-group">
              <Plus className="w-4 h-4" /> New Group
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-4">
          {(!userGroupsList || userGroupsList.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No user groups created yet.</p>
              <p className="text-sm">Create a group to assign a company name and logo to one or more users.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userGroupsList.map(group => {
                const groupLogo = adminLogos?.find(l => l.id === group.logoId);
                const groupTheme = allThemes?.find(t => t.id === group.themeId);
                const groupAssetDesc = assetDescriptions?.find(a => a.id === group.assetDescriptionId);
                const groupUsers = users?.filter(u => u.userGroupId === group.id) || [];
                return (
                  <div key={group.id} className="bg-primary/5 border border-primary/20 rounded-xl p-4" data-testid={`group-card-${group.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {groupLogo ? (
                          <div className="w-10 h-10 rounded-lg bg-white border border-primary/20 flex items-center justify-center overflow-hidden">
                            <img src={groupLogo.url} alt={groupLogo.name} className="max-w-full max-h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-display text-foreground font-medium">{group.name}{group.isDefault && <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Default</span>}</h3>
                          <p className="text-sm text-muted-foreground">Logo: <span className="text-foreground">{group.logoId ? `ID ${group.logoId}` : "Default"}</span></p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingGroup(group);
                          setGroupForm({ name: group.name, logoId: group.logoId, themeId: group.themeId, assetDescriptionId: group.assetDescriptionId });
                          setGroupDialogOpen(true);
                        }} className="text-primary hover:text-foreground hover:bg-primary/10" data-testid={`button-edit-group-${group.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {!group.isDefault && (
                          <Button variant="ghost" size="sm" onClick={() => {
                            if (confirm("Delete this group? Users will be moved to the default group.")) {
                              deleteGroupMutation.mutate(group.id);
                            }
                          }} className="text-red-400 hover:text-red-300 hover:bg-red-500/10" data-testid={`button-delete-group-${group.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                      {groupTheme && <span className="bg-primary/10 px-2 py-0.5 rounded">Theme: {groupTheme.name}</span>}
                      {groupAssetDesc && <span className="bg-primary/10 px-2 py-0.5 rounded">Asset: {groupAssetDesc.name}</span>}
                      <span className="bg-primary/10 px-2 py-0.5 rounded">{groupUsers.length} member{groupUsers.length !== 1 ? "s" : ""}</span>
                    </div>
                    {groupUsers.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {groupUsers.map(u => (
                          <span key={u.id} className="inline-flex items-center gap-1 bg-white/80 border border-primary/20 rounded-full px-3 py-1 text-sm">
                            <span className="font-medium">{u.name || u.email}</span>
                            <button onClick={() => assignGroupMutation.mutate({ userId: u.id, groupId: null })} className="text-red-400 hover:text-red-600 ml-1" title="Remove from group" data-testid={`button-remove-user-${u.id}-from-group`}>
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" /> Assign Users to Groups</CardTitle>
          <CardDescription className="label-text">Set which group each user belongs to. Group branding overrides defaults.</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20 hover:bg-transparent">
                <TableHead className="text-muted-foreground">User</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">Group</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map(user => {
                const currentGroup = userGroupsList?.find(g => g.id === user.userGroupId);
                return (
                  <TableRow key={user.id} className="border-primary/20 hover:bg-primary/5" data-testid={`group-assign-row-${user.id}`}>
                    <TableCell className="text-foreground">
                      <div>
                        <span className="font-medium">{user.name || user.email}</span>
                        {user.name && <span className="text-muted-foreground text-xs ml-2">{user.email}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                        user.role === "admin" ? "bg-primary/20 text-primary" :
                        user.role === "checker" ? "bg-blue-500/20 text-blue-400" :
                        "bg-primary/10 text-muted-foreground"
                      }`}>{user.role}</span>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.userGroupId != null ? String(user.userGroupId) : "none"}
                        onValueChange={(v) => {
                          const groupId = v === "none" ? null : parseInt(v);
                          assignGroupMutation.mutate({ userId: user.id, groupId });
                        }}
                      >
                        <SelectTrigger className="h-9 max-w-[200px]" data-testid={`select-user-group-${user.id}`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Group</SelectItem>
                          {userGroupsList?.map(g => (
                            <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const sidebarToggles = [
    { key: "sidebarPropertyFinder", label: "Property Finder", description: "Search and discover new property opportunities" },
    { key: "sidebarSensitivity", label: "Sensitivity Analysis", description: "Run what-if scenarios on key assumptions" },
    { key: "sidebarFinancing", label: "Financing Analysis", description: "Analyze debt structures and refinance options" },
    { key: "sidebarCompare", label: "Compare", description: "Side-by-side property comparison" },
    { key: "sidebarTimeline", label: "Timeline", description: "Visual timeline of acquisitions and milestones" },
    { key: "sidebarMapView", label: "Map View", description: "Geographic overview (only for properties with addresses)" },
    { key: "sidebarExecutiveSummary", label: "Executive Summary", description: "High-level portfolio summary report" },
    { key: "sidebarScenarios", label: "My Scenarios", description: "Saved scenario snapshots per user" },
    { key: "sidebarUserManual", label: "User Manual", description: "Methodology documentation and help" },
  ];

  const renderSidebar = () => (
    <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]" data-testid="card-sidebar-settings">
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2"><Settings className="w-5 h-5" /> Navigation Visibility</CardTitle>
        <CardDescription className="label-text">Toggle which optional pages appear in the sidebar for non-admin users. Core pages (Dashboard, Properties, Management Co., Settings, Profile, Administration) are always visible.</CardDescription>
      </CardHeader>
      <CardContent className="relative space-y-1">
        {sidebarToggles.map((toggle) => {
          const isOn = globalAssumptions?.[toggle.key] !== false;
          return (
            <div
              key={toggle.key}
              className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-primary/5 transition-colors"
              data-testid={`sidebar-toggle-${toggle.key}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-medium text-sm">{toggle.label}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{toggle.description}</p>
              </div>
              <Switch
                checked={isOn}
                onCheckedChange={(checked) => {
                  updateSidebarMutation.mutate({ [toggle.key]: checked });
                }}
                className="data-[state=checked]:bg-primary"
                data-testid={`switch-${toggle.key}`}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );

  const renderThemes = () => (<ThemeManager />);

  const renderDatabase = () => (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]" data-testid="card-database-sync">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Database className="w-5 h-5" /> Database Status
          </CardTitle>
          <CardDescription className="label-text">
            View current database state and reset to canonical seed values. Sync mode overwrites global assumptions, property values, and fee categories with the values defined in the seed configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <GlassButton
              onClick={() => { setSyncResults(null); checkSyncStatus.mutate(); }}
              disabled={checkSyncStatus.isPending}
              data-testid="button-check-status"
            >
              {checkSyncStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Check Status
            </GlassButton>
            <GlassButton
              onClick={() => setSyncConfirmOpen(true)}
              disabled={executeSyncMutation.isPending}
              className="bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 text-amber-700"
              data-testid="button-sync-database"
            >
              {executeSyncMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
              Sync Database
            </GlassButton>
          </div>

          {syncResults && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-primary/5 rounded-xl p-4 text-center" data-testid="stat-users-count">
                  <p className="text-2xl font-bold text-primary">{syncResults.summary?.users ?? "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Users</p>
                </div>
                <div className="bg-primary/5 rounded-xl p-4 text-center" data-testid="stat-properties-count">
                  <p className="text-2xl font-bold text-primary">{syncResults.summary?.properties ?? "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Properties</p>
                </div>
                <div className="bg-primary/5 rounded-xl p-4 text-center" data-testid="stat-groups-count">
                  <p className="text-2xl font-bold text-primary">{syncResults.summary?.userGroups ?? "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">User Groups</p>
                </div>
                <div className="bg-primary/5 rounded-xl p-4 text-center" data-testid="stat-fee-categories">
                  <p className="text-2xl font-bold text-primary">{syncResults.summary?.totalFeeCategories ?? "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Fee Categories</p>
                </div>
                <div className="bg-primary/5 rounded-xl p-4 text-center" data-testid="stat-global-assumptions">
                  <p className="text-2xl font-bold text-primary">{syncResults.summary?.hasGlobalAssumptions ? "Yes" : "No"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Global Assumptions</p>
                </div>
              </div>

              {syncResults.globalAssumptions && (
                <Card className="bg-white/60 border-primary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Global Assumptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Base Mgmt Fee:</span> <span className="font-mono">{((syncResults.globalAssumptions.baseManagementFee ?? 0) * 100).toFixed(1)}%</span></div>
                      <div><span className="text-muted-foreground">Incentive Fee:</span> <span className="font-mono">{((syncResults.globalAssumptions.incentiveManagementFee ?? 0) * 100).toFixed(1)}%</span></div>
                      <div><span className="text-muted-foreground">Inflation:</span> <span className="font-mono">{((syncResults.globalAssumptions.inflationRate ?? 0) * 100).toFixed(1)}%</span></div>
                      <div><span className="text-muted-foreground">Tax Rate:</span> <span className="font-mono">{((syncResults.globalAssumptions.companyTaxRate ?? 0) * 100).toFixed(1)}%</span></div>
                      <div><span className="text-muted-foreground">Exit Cap:</span> <span className="font-mono">{((syncResults.globalAssumptions.exitCapRate ?? 0) * 100).toFixed(1)}%</span></div>
                      <div><span className="text-muted-foreground">Commission:</span> <span className="font-mono">{((syncResults.globalAssumptions.commissionRate ?? 0) * 100).toFixed(1)}%</span></div>
                      <div className="col-span-2"><span className="text-muted-foreground">Company:</span> <span className="font-medium">{syncResults.globalAssumptions.companyName}</span></div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {syncResults.properties?.length > 0 && (
                <Card className="bg-white/60 border-primary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Properties ({syncResults.properties.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead className="text-right">Rooms</TableHead>
                          <TableHead className="text-right">ADR</TableHead>
                          <TableHead className="text-right">Base Fee</TableHead>
                          <TableHead className="text-right">Exit Cap</TableHead>
                          <TableHead className="text-center">Research</TableHead>
                          <TableHead className="text-center">Fee Cats</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {syncResults.properties.map((prop: any) => (
                          <TableRow key={prop.id} data-testid={`row-property-${prop.id}`}>
                            <TableCell className="font-medium" data-testid={`text-property-name-${prop.id}`}>{prop.name}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">{prop.location}</TableCell>
                            <TableCell className="text-right font-mono">{prop.roomCount}</TableCell>
                            <TableCell className="text-right font-mono">${prop.startAdr}</TableCell>
                            <TableCell className="text-right font-mono">{((prop.baseManagementFeeRate ?? 0) * 100).toFixed(1)}%</TableCell>
                            <TableCell className="text-right font-mono">{((prop.exitCapRate ?? 0) * 100).toFixed(1)}%</TableCell>
                            <TableCell className="text-center">
                              {prop.hasResearchValues ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-400 mx-auto" />}
                            </TableCell>
                            <TableCell className="text-center font-mono">{prop.feeCategories?.length ?? 0}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={syncConfirmOpen} onOpenChange={setSyncConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Confirm Database Sync
            </DialogTitle>
            <DialogDescription>
              This will overwrite global assumptions, property financial values, and fee categories with canonical seed data. Users and user groups will be created if missing but not overwritten. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSyncConfirmOpen(false)} data-testid="button-cancel-sync">Cancel</Button>
            <Button
              onClick={() => executeSyncMutation.mutate()}
              disabled={executeSyncMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-white"
              data-testid="button-confirm-sync"
            >
              {executeSyncMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Yes, Sync Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <TooltipProvider>
    <Layout>
      <div className="space-y-6">
        <PageHeader 
          title="Administration"
          subtitle="Manage users, monitor activity, and run system verification"
          variant="dark"
        />

        <Tabs value={adminTab} onValueChange={(v) => setAdminTab(v as AdminView)} className="w-full">
          <DarkGlassTabs
            tabs={[
              { value: 'users', label: 'Users', icon: Users },
              { value: 'activity', label: 'Activity', icon: Activity },
              { value: 'verification', label: 'Verification', icon: FileCheck },
              { value: 'user-groups', label: 'User Groups', icon: Building2 },
              { value: 'branding', label: 'Branding', icon: Image },
              { value: 'themes', label: 'Themes', icon: SwatchBook },
              { value: 'sidebar', label: 'Navigation', icon: PanelLeft },
              { value: 'database', label: 'Database', icon: Database },
            ]}
            activeTab={adminTab}
            onTabChange={(v) => setAdminTab(v as AdminView)}
          />

          <TabsContent value="users" className="space-y-6 mt-6">
            {renderUsers()}
          </TabsContent>
          <TabsContent value="activity" className="space-y-6 mt-6">
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
          </TabsContent>
          <TabsContent value="verification" className="space-y-6 mt-6">
            {renderVerification()}
          </TabsContent>
          <TabsContent value="user-groups" className="space-y-6 mt-6">
            {renderUserGroups()}
          </TabsContent>
          <TabsContent value="branding" className="space-y-6 mt-6">
            {renderBranding()}
          </TabsContent>
          <TabsContent value="themes" className="space-y-6 mt-6">
            {renderThemes()}
          </TabsContent>
          <TabsContent value="sidebar" className="space-y-6 mt-6">
            {renderSidebar()}
          </TabsContent>
          <TabsContent value="database" className="space-y-6 mt-6">
            {renderDatabase()}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Add New User</DialogTitle>
            <DialogDescription className="label-text">Create a new user account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-500" />Email</Label>
              <Input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="user@example.com" data-testid="input-new-user-email" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Key className="w-4 h-4 text-gray-500" />Password</Label>
              <div className="relative">
                <Input type={showNewUserPassword ? "text" : "password"} value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Secure password" data-testid="input-new-user-password" />
                <button type="button" onClick={() => setShowNewUserPassword(!showNewUserPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" data-testid="button-toggle-new-password">
                  {showNewUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2"><Label className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-500" />Name</Label><Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Full name" data-testid="input-new-user-name" /></div>
            <div className="space-y-2"><Label className="flex items-center gap-2"><LayoutGrid className="w-4 h-4 text-gray-500" />Company</Label><Input value={newUser.company} onChange={(e) => setNewUser({ ...newUser, company: e.target.value })} placeholder="Company name" data-testid="input-new-user-company" /></div>
            <div className="space-y-2"><Label className="flex items-center gap-2"><Shield className="w-4 h-4 text-gray-500" />Title</Label><Input value={newUser.title} onChange={(e) => setNewUser({ ...newUser, title: e.target.value })} placeholder="Job title" data-testid="input-new-user-title" /></div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Shield className="w-4 h-4 text-gray-500" />Role</Label>
              <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })} data-testid="select-new-user-role">
                <SelectTrigger data-testid="select-new-user-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="checker">Checker</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-add-user">Cancel</Button>
            <Button variant="outline" onClick={() => createMutation.mutate(newUser)} disabled={createMutation.isPending || !newUser.email || !newUser.password} data-testid="button-create-user" className="flex items-center gap-2">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </Button>
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
            <Button variant="outline" onClick={() => selectedUser && passwordMutation.mutate({ id: selectedUser.id, password: newPassword })} disabled={passwordMutation.isPending || !newPassword} data-testid="button-update-password" className="flex items-center gap-2">
              {passwordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Update Password
            </Button>
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
            <div className="space-y-2"><Label className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-500" />Email</Label><Input value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} data-testid="input-edit-email" /></div>
            <div className="space-y-2"><Label className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-500" />Name</Label><Input value={editUser.name} onChange={(e) => setEditUser({ ...editUser, name: e.target.value })} data-testid="input-edit-name" /></div>
            <div className="space-y-2"><Label className="flex items-center gap-2"><LayoutGrid className="w-4 h-4 text-gray-500" />Company</Label><Input value={editUser.company} onChange={(e) => setEditUser({ ...editUser, company: e.target.value })} data-testid="input-edit-company" /></div>
            <div className="space-y-2"><Label className="flex items-center gap-2"><Shield className="w-4 h-4 text-gray-500" />Title</Label><Input value={editUser.title} onChange={(e) => setEditUser({ ...editUser, title: e.target.value })} data-testid="input-edit-title" /></div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Shield className="w-4 h-4 text-gray-500" />Role</Label>
              <Select value={editUser.role} onValueChange={(v) => setEditUser({ ...editUser, role: v })} data-testid="select-edit-user-role">
                <SelectTrigger data-testid="select-edit-user-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="checker">Checker</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel-edit">Cancel</Button>
            <Button variant="outline" onClick={() => {
              if (!selectedUser) return;
              const data: { email?: string; name?: string; company?: string; title?: string; role?: string } = {
                name: editUser.name,
                company: editUser.company,
                title: editUser.title,
              };
              if (editUser.email !== originalEmail) {
                data.email = editUser.email;
              }
              if (editUser.role !== selectedUser.role) {
                data.role = editUser.role;
              }
              editMutation.mutate({ id: selectedUser.id, data });
            }} disabled={editMutation.isPending} data-testid="button-save-user" className="flex items-center gap-2">
              {editMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">{editingGroup ? "Edit Group" : "Create User Group"}</DialogTitle>
            <DialogDescription className="label-text">{editingGroup ? "Update group settings" : "Create a new group with a company name and logo"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-500" />Group Name</Label>
              <Input value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} placeholder="e.g., KIT Capital Team" data-testid="input-group-name" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Image className="w-4 h-4 text-gray-500" />Logo (includes company name)</Label>
              <Select value={groupForm.logoId != null ? String(groupForm.logoId) : "default"} onValueChange={(v) => setGroupForm({ ...groupForm, logoId: v === "default" ? null : parseInt(v) })} data-testid="select-group-logo">
                <SelectTrigger data-testid="select-group-logo"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Logo</SelectItem>
                  {adminLogos?.map(logo => (
                    <SelectItem key={logo.id} value={String(logo.id)}>{logo.name} — {logo.companyName}{logo.isDefault ? " (Default)" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Palette className="w-4 h-4 text-gray-500" />Theme</Label>
              <Select value={groupForm.themeId != null ? String(groupForm.themeId) : "default"} onValueChange={(v) => setGroupForm({ ...groupForm, themeId: v === "default" ? null : parseInt(v) })} data-testid="select-group-theme">
                <SelectTrigger data-testid="select-group-theme"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Theme</SelectItem>
                  {allThemes?.map(theme => (
                    <SelectItem key={theme.id} value={String(theme.id)}>{theme.name}{theme.isDefault ? " (Default)" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Tag className="w-4 h-4 text-gray-500" />Asset Description</Label>
              <Select value={groupForm.assetDescriptionId != null ? String(groupForm.assetDescriptionId) : "default"} onValueChange={(v) => setGroupForm({ ...groupForm, assetDescriptionId: v === "default" ? null : parseInt(v) })} data-testid="select-group-asset-desc">
                <SelectTrigger data-testid="select-group-asset-desc"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  {assetDescriptions?.map(ad => (
                    <SelectItem key={ad.id} value={String(ad.id)}>{ad.name}{ad.isDefault ? " (Default)" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setGroupDialogOpen(false); setEditingGroup(null); }} data-testid="button-cancel-group">Cancel</Button>
            <Button variant="outline" onClick={() => {
              if (editingGroup) {
                updateGroupMutation.mutate({ id: editingGroup.id, ...groupForm });
              } else {
                createGroupMutation.mutate(groupForm);
              }
            }} disabled={!groupForm.name || createGroupMutation.isPending || updateGroupMutation.isPending} data-testid="button-save-group" className="flex items-center gap-2">
              {(createGroupMutation.isPending || updateGroupMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingGroup ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Layout>
    </TooltipProvider>
  );
}
