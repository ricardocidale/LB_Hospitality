import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Users, Key, Eye, EyeOff, Pencil, Clock, FileCheck, CheckCircle2, XCircle, AlertTriangle, PlayCircle, Palette, ArrowLeft, Activity, HelpCircle, SwatchBook, UserPlus, Shield, Mail, Calendar, LogIn, LogOut, Monitor, MapPin, Hash, LayoutGrid, Sparkles, Settings, FileText, Download, Save, FileDown, Image, PanelLeft } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Switch } from "@/components/ui/switch";
import { GlassButton } from "@/components/ui/glass-button";
import { PageHeader } from "@/components/ui/page-header";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
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
  assignedLogoId: number | null;
  assignedThemeId: number | null;
}

interface Logo {
  id: number;
  name: string;
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

type AdminView = "dashboard" | "users" | "activity" | "activity-feed" | "checker-activity" | "verification" | "design" | "themes" | "branding" | "sidebar";

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
  const [currentView, setCurrentView] = useState<AdminView>("dashboard");
  
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
    enabled: currentView === "sidebar",
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
      queryClient.invalidateQueries({ queryKey: ["globalAssumptions"] });
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
    enabled: currentView === "checker-activity" || currentView === "dashboard",
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

  const [brandingDialogOpen, setBrandingDialogOpen] = useState(false);
  const [brandingUser, setBrandingUser] = useState<User | null>(null);
  const [brandingLogoId, setBrandingLogoId] = useState<number | null>(null);
  const [brandingThemeId, setBrandingThemeId] = useState<number | null>(null);
  const [newLogoName, setNewLogoName] = useState("");
  const [newLogoUrl, setNewLogoUrl] = useState("");

  const { data: adminLogos } = useQuery<Logo[]>({
    queryKey: ["admin", "logos"],
    queryFn: async () => {
      const res = await fetch("/api/admin/logos", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch logos");
      return res.json();
    },
    enabled: currentView === "branding",
  });

  const { data: allThemes } = useQuery<Array<{ id: number; name: string; isActive: boolean }>>({
    queryKey: ["admin", "all-themes"],
    queryFn: async () => {
      const res = await fetch("/api/design-themes", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch themes");
      return res.json();
    },
    enabled: currentView === "branding",
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

  const assignBrandingMutation = useMutation({
    mutationFn: async ({ userId, assignedLogoId, assignedThemeId }: { userId: number; assignedLogoId: number | null; assignedThemeId: number | null }) => {
      const res = await fetch(`/api/admin/users/${userId}/branding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedLogoId, assignedThemeId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to assign branding");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setBrandingDialogOpen(false);
      toast({ title: "Branding Updated", description: "User branding has been assigned." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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

  // Auto-run verification when entering verification view
  const verificationAutoRan = useRef(false);
  useEffect(() => {
    if (currentView === "verification" && !verificationResults && !runVerification.isPending && !verificationAutoRan.current) {
      verificationAutoRan.current = true;
      runVerification.mutate();
    }
    if (currentView !== "verification") {
      verificationAutoRan.current = false;
    }
  }, [currentView]);

  // Auto-run design check when entering design view
  const designAutoRan = useRef(false);
  useEffect(() => {
    if (currentView === "design" && !designResults && !runDesignCheck.isPending && !designAutoRan.current) {
      designAutoRan.current = true;
      runDesignCheck.mutate();
    }
    if (currentView !== "design") {
      designAutoRan.current = false;
    }
  }, [currentView]);


  const AdminCard = ({ icon: Icon, title, description, onClick, testId, badge, iconBg }: {
    icon: any; title: string; description: string; onClick: () => void; testId: string;
    badge?: React.ReactNode; iconBg?: string;
  }) => (
    <button
      onClick={onClick}
      data-testid={testId}
      className="group w-full text-left rounded-2xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] hover:border-[#9FBCA4]/30 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-[#9FBCA4]/5"
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg || "bg-[#9FBCA4]/15"}`}>
          <Icon className="w-5 h-5 text-[#9FBCA4]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-white/90 group-hover:text-white transition-colors">{title}</h3>
          <p className="text-[13px] text-white/40 mt-0.5 leading-relaxed">{description}</p>
          {badge}
        </div>
      </div>
    </button>
  );

  const renderDashboard = () => (
    <div className="space-y-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Users", value: users?.length || 0, icon: Users, color: "text-[#9FBCA4]" },
          { label: "Sessions", value: activeSessions, icon: Activity, color: "text-[#9FBCA4]" },
          { label: "Logins", value: loginLogs?.length || 0, icon: Clock, color: "text-[#9FBCA4]" },
          {
            label: verificationHistory?.[0]?.auditOpinion || "Verification",
            value: verificationHistory?.[0] ? `${verificationHistory[0].passed}/${verificationHistory[0].totalChecks}` : "--",
            icon: FileCheck,
            color: verificationHistory?.[0]?.auditOpinion === "UNQUALIFIED" ? "text-[#9FBCA4]" : verificationHistory?.[0]?.auditOpinion === "QUALIFIED" ? "text-yellow-400" : "text-white/50",
            onClick: () => setCurrentView("verification"),
          },
        ].map((stat, i) => (
          <div
            key={i}
            onClick={(stat as any).onClick}
            className={`rounded-2xl bg-white/[0.06] border border-white/[0.08] p-5 ${(stat as any).onClick ? "cursor-pointer hover:bg-white/[0.10] hover:border-[#9FBCA4]/30 transition-all" : ""}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className={`text-3xl font-display font-bold tracking-tight ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4 px-1">Users & Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <AdminCard icon={Users} title="Users" description="Accounts & permissions" onClick={() => setCurrentView("users")} testId="card-users" />
          <AdminCard icon={Clock} title="Login Activity" description="Sessions & history" onClick={() => setCurrentView("activity")} testId="card-activity" />
          <AdminCard icon={Activity} title="Activity Feed" description="Edits & system actions" onClick={() => setCurrentView("activity-feed")} testId="card-activity-feed" />
          <AdminCard
            icon={FileCheck}
            title="Checker Activity"
            description="Verifications & audit trail"
            onClick={() => setCurrentView("checker-activity")}
            testId="card-checker-activity"
            iconBg="bg-[#E8927C]/15"
            badge={checkerActivity ? (
              <div className="flex gap-3 mt-2">
                <span className="text-[11px] text-[#9FBCA4]">{checkerActivity.summary.verificationRuns} runs</span>
                <span className="text-[11px] text-[#E8927C]">{checkerActivity.summary.manualViews} reviews</span>
              </div>
            ) : undefined}
          />
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4 px-1">Verification & Quality</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <AdminCard
            icon={FileCheck}
            title="Financial Verification"
            description="GAAP compliance & independent recalculation"
            onClick={() => setCurrentView("verification")}
            testId="card-verification"
            badge={verificationHistory?.[0] ? (
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-[11px] px-2 py-0.5 rounded-md font-mono ${
                  verificationHistory[0].auditOpinion === "UNQUALIFIED" ? "bg-[#257D41]/15 text-[#9FBCA4]" :
                  verificationHistory[0].auditOpinion === "QUALIFIED" ? "bg-yellow-500/15 text-yellow-400" :
                  "bg-red-500/15 text-red-400"
                }`}>{verificationHistory[0].passed}/{verificationHistory[0].totalChecks} {verificationHistory[0].auditOpinion}</span>
                <span className="text-[11px] text-white/25 font-mono">{new Date(verificationHistory[0].createdAt).toLocaleDateString()}</span>
              </div>
            ) : undefined}
          />
          <AdminCard
            icon={Palette}
            title="Design Consistency"
            description="Fonts, colors & component standards"
            onClick={() => setCurrentView("design")}
            testId="card-design"
            badge={designResults ? (
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-[11px] px-2 py-0.5 rounded-md font-mono ${
                  designResults.overallStatus === "PASS" ? "bg-[#257D41]/15 text-[#9FBCA4]" :
                  designResults.overallStatus === "WARNING" ? "bg-yellow-500/15 text-yellow-400" :
                  "bg-red-500/15 text-red-400"
                }`}>{designResults.passed}/{designResults.totalChecks} {designResults.overallStatus}</span>
              </div>
            ) : undefined}
          />
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4 px-1">Appearance & Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <AdminCard icon={SwatchBook} title="Design Themes" description="Color palettes & system" onClick={() => setCurrentView("themes")} testId="card-themes" />
          <AdminCard icon={Image} title="Branding" description="Logos & user assignments" onClick={() => setCurrentView("branding")} testId="card-branding" />
          <AdminCard icon={PanelLeft} title="Navigation" description="Sidebar page visibility" onClick={() => setCurrentView("sidebar")} testId="card-sidebar" />
        </div>
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
            <UserPlus className="w-4 h-4" />
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
                <TableHead className="text-white/60 font-display"><div className="flex items-center gap-2"><Users className="w-4 h-4" />User</div></TableHead>
                <TableHead className="text-white/60 font-display"><div className="flex items-center gap-2"><Shield className="w-4 h-4" />Role</div></TableHead>
                <TableHead className="text-white/60 font-display"><div className="flex items-center gap-2"><Calendar className="w-4 h-4" />Created</div></TableHead>
                <TableHead className="text-white/60 font-display text-right"><div className="flex items-center justify-end gap-2"><Settings className="w-4 h-4" />Actions</div></TableHead>
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
                  <TableCell className="text-white/60 font-mono text-sm">{formatDateTime(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10"
                        onClick={() => { setSelectedUser(user); setOriginalEmail(user.email); setEditUser({ email: user.email, name: user.name || "", company: user.company || "", title: user.title || "", role: user.role || "user" }); setEditDialogOpen(true); }}
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

  const renderActivity = () => {
    const filteredLogs = loginLogs?.filter(log => {
      if (loginLogUserFilter && String(log.userId) !== loginLogUserFilter) return false;
      if (loginLogIpFilter && !(log.ipAddress || "").toLowerCase().includes(loginLogIpFilter.toLowerCase())) return false;
      return true;
    });

    return (<>
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

      <CardContent className="relative space-y-4">
        {/* Login Log Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2">
            <Label className="text-white/60 text-sm whitespace-nowrap">User</Label>
            <select
              value={loginLogUserFilter}
              onChange={(e) => setLoginLogUserFilter(e.target.value)}
              className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1.5 text-sm"
              data-testid="select-login-log-user-filter"
            >
              <option value="">All Users</option>
              {users?.map(u => (
                <option key={u.id} value={String(u.id)}>{u.name || u.email}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-white/60 text-sm whitespace-nowrap">IP Address</Label>
            <Input
              value={loginLogIpFilter}
              onChange={(e) => setLoginLogIpFilter(e.target.value)}
              placeholder="Search IP..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-8 w-36 text-sm"
              data-testid="input-login-log-ip-filter"
            />
          </div>
          <span className="text-white/40 text-sm ml-auto">
            {filteredLogs?.length ?? 0} of {loginLogs?.length ?? 0} entries
          </span>
        </div>

        {logsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#9FBCA4]" />
          </div>
        ) : filteredLogs?.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 mx-auto text-white/30 mb-4" />
            <p className="label-text text-white/60">
              {loginLogs?.length === 0 ? "No login activity recorded yet" : "No logs match the current filters"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60 font-display"><div className="flex items-center gap-2"><Users className="w-4 h-4" />User</div></TableHead>
                <TableHead className="text-white/60 font-display"><div className="flex items-center gap-2"><LogIn className="w-4 h-4" />Login Time</div></TableHead>
                <TableHead className="text-white/60 font-display"><div className="flex items-center gap-2"><LogOut className="w-4 h-4" />Logout Time</div></TableHead>
                <TableHead className="text-white/60 font-display"><div className="flex items-center gap-2"><Clock className="w-4 h-4" />Duration</div></TableHead>
                <TableHead className="text-white/60 font-display"><div className="flex items-center gap-2"><Monitor className="w-4 h-4" />IP Address</div></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs?.map((log) => (
                <TableRow key={log.id} className="border-white/10 hover:bg-white/5" data-testid={`row-log-${log.id}`}>
                  <TableCell>
                    <div className="text-[#FFF9F5]">{log.userName || log.userEmail}</div>
                    {log.userName && <div className="text-xs text-white/50">{log.userEmail}</div>}
                  </TableCell>
                  <TableCell className="text-white/80 font-mono text-sm">{formatDateTime(log.loginAt)}</TableCell>
                  <TableCell className="text-white/80 font-mono text-sm">
                    {log.logoutAt ? formatDateTime(log.logoutAt) : <span className="text-[#9FBCA4]">Active</span>}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <span className={log.logoutAt ? "text-white/80" : "text-[#9FBCA4]"}>
                      {formatDuration(log.loginAt, log.logoutAt)}
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

    {/* Active Sessions */}
    {activeSessionsList && activeSessionsList.length > 0 && (
      <Card className="relative overflow-hidden bg-[#0a0a0f]/95 backdrop-blur-3xl border border-white/10 shadow-2xl shadow-black/50 mt-6">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-black/20" />
        <CardHeader className="relative">
          <CardTitle className="text-lg font-display text-[#FFF9F5]">Active Sessions</CardTitle>
          <CardDescription className="label-text text-white/60">
            {activeSessionsList.length} active session{activeSessionsList.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/10 hover:bg-transparent">
                <TableHead className="text-[#9FBCA4] font-semibold text-xs uppercase tracking-wider">User</TableHead>
                <TableHead className="text-[#9FBCA4] font-semibold text-xs uppercase tracking-wider">Session Started</TableHead>
                <TableHead className="text-[#9FBCA4] font-semibold text-xs uppercase tracking-wider">Expires</TableHead>
                <TableHead className="text-[#9FBCA4] font-semibold text-xs uppercase tracking-wider text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeSessionsList.map((s) => (
                <TableRow key={s.id} className="border-b border-white/5 hover:bg-white/5">
                  <TableCell className="text-white/80 text-sm">{s.userName || s.userEmail}</TableCell>
                  <TableCell className="text-white/60 font-mono text-xs">{new Date(s.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="text-white/60 font-mono text-xs">{new Date(s.expiresAt).toLocaleString()}</TableCell>
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
        {chk.passed ? <CheckCircle2 className="w-5 h-5 text-[#257D41] shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-800 text-sm font-medium">{chk.metric}</span>
            {!chk.passed && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${severityColor(chk.severity)}`}>{chk.severity.toUpperCase()}</span>
            )}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#9FBCA4]/20 text-[#257D41] font-mono">{chk.gaapRef}</span>
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
      <Card className="relative overflow-hidden bg-[#0a0a0f]/95 backdrop-blur-3xl border border-white/10 shadow-2xl shadow-black/50">
        <CardContent className="relative p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-white/60 text-sm whitespace-nowrap">Entity Type</Label>
              <select
                value={activityEntityFilter}
                onChange={(e) => setActivityEntityFilter(e.target.value)}
                className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1.5 text-sm"
                data-testid="select-activity-entity-filter"
              >
                <option value="">All</option>
                <option value="property">Property</option>
                <option value="scenario">Scenario</option>
                <option value="global_assumptions">Assumptions</option>
                <option value="user">User</option>
                <option value="verification">Verification</option>
                <option value="image">Image</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-white/60 text-sm whitespace-nowrap">User</Label>
              <select
                value={activityUserFilter}
                onChange={(e) => setActivityUserFilter(e.target.value)}
                className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1.5 text-sm"
                data-testid="select-activity-user-filter"
              >
                <option value="">All Users</option>
                {users?.map(u => (
                  <option key={u.id} value={String(u.id)}>{u.name || u.email}</option>
                ))}
              </select>
            </div>
            <span className="text-white/40 text-sm ml-auto">
              {activityLogs?.length ?? 0} entries
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card className="relative overflow-hidden bg-[#0a0a0f]/95 backdrop-blur-3xl border border-white/10 shadow-2xl shadow-black/50">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-black/20" />
        <CardContent className="relative p-6">
          {activityLogsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#9FBCA4]" />
            </div>
          ) : !activityLogs?.length ? (
            <p className="text-white/50 text-center py-12 label-text">No activity recorded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/10 hover:bg-transparent">
                    <TableHead className="text-[#9FBCA4] font-semibold text-xs uppercase tracking-wider">Time</TableHead>
                    <TableHead className="text-[#9FBCA4] font-semibold text-xs uppercase tracking-wider">User</TableHead>
                    <TableHead className="text-[#9FBCA4] font-semibold text-xs uppercase tracking-wider">Action</TableHead>
                    <TableHead className="text-[#9FBCA4] font-semibold text-xs uppercase tracking-wider">Type</TableHead>
                    <TableHead className="text-[#9FBCA4] font-semibold text-xs uppercase tracking-wider">Entity</TableHead>
                    <TableHead className="text-[#9FBCA4] font-semibold text-xs uppercase tracking-wider">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLogs.map((log) => (
                    <TableRow key={log.id} className="border-b border-white/5 hover:bg-white/5">
                      <TableCell className="text-white/70 text-xs font-mono whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-white/80 text-sm">
                        {log.userName || log.userEmail}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                          log.action === "create" ? "bg-green-500/20 text-green-400" :
                          log.action === "update" ? "bg-blue-500/20 text-blue-400" :
                          log.action === "delete" ? "bg-red-500/20 text-red-400" :
                          log.action === "run" ? "bg-purple-500/20 text-purple-400" :
                          "bg-white/10 text-white/60"
                        }`}>
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-white/60 text-xs font-mono">{log.entityType}</TableCell>
                      <TableCell className="text-white/80 text-sm">{log.entityName || "—"}</TableCell>
                      <TableCell className="text-white/50 text-xs max-w-[200px] truncate">
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
          <Card className="bg-gradient-to-br from-[#1a2e3d]/95 to-[#243d4d]/95 border border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-[#9FBCA4]">{checkerActivity?.summary.totalActions ?? 0}</div>
              <div className="text-xs text-white/50 mt-1">Total Actions</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-[#1a2e3d]/95 to-[#243d4d]/95 border border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-[#4ECDC4]">{checkerActivity?.summary.verificationRuns ?? 0}</div>
              <div className="text-xs text-white/50 mt-1">Verification Runs</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-[#1a2e3d]/95 to-[#243d4d]/95 border border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-[#E8927C]">{checkerActivity?.summary.manualViews ?? 0}</div>
              <div className="text-xs text-white/50 mt-1">Manual Reviews</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-[#1a2e3d]/95 to-[#243d4d]/95 border border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-white">{checkerActivity?.summary.exports ?? 0}</div>
              <div className="text-xs text-white/50 mt-1">Exports</div>
            </CardContent>
          </Card>
        </div>

        {checkerActivity?.checkers && checkerActivity.checkers.length > 0 && (
          <Card className="bg-gradient-to-br from-[#1a2e3d]/95 to-[#243d4d]/95 border border-white/20">
            <CardHeader>
              <CardTitle className="text-xl font-display text-white">Checker Users</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-white/60">Email</TableHead>
                    <TableHead className="text-white/60">Name</TableHead>
                    <TableHead className="text-white/60 text-center">Actions</TableHead>
                    <TableHead className="text-white/60 text-center">Verifications</TableHead>
                    <TableHead className="text-white/60 text-center">Reviews</TableHead>
                    <TableHead className="text-white/60 text-center">Exports</TableHead>
                    <TableHead className="text-white/60">Last Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkerActivity.checkers.map((checker) => (
                    <TableRow key={checker.id} className="border-white/10">
                      <TableCell className="text-white font-mono text-sm">{checker.email}</TableCell>
                      <TableCell className="text-white/80">{checker.name || "-"}</TableCell>
                      <TableCell className="text-white/80 text-center">{checker.totalActions}</TableCell>
                      <TableCell className="text-[#4ECDC4] text-center font-semibold">{checker.verificationRuns}</TableCell>
                      <TableCell className="text-[#E8927C] text-center font-semibold">{checker.manualViews}</TableCell>
                      <TableCell className="text-white/80 text-center">{checker.exports}</TableCell>
                      <TableCell className="text-white/60 text-sm">{formatDate(checker.lastActive)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card className="bg-gradient-to-br from-[#1a2e3d]/95 to-[#243d4d]/95 border border-white/20">
          <CardHeader>
            <CardTitle className="text-xl font-display text-white">Recent Checker Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {(!checkerActivity?.recentActivity || checkerActivity.recentActivity.length === 0) ? (
              <p className="text-white/40 text-center py-8">No checker activity recorded yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-white/60">Time</TableHead>
                    <TableHead className="text-white/60">User</TableHead>
                    <TableHead className="text-white/60">Action</TableHead>
                    <TableHead className="text-white/60">Entity</TableHead>
                    <TableHead className="text-white/60">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkerActivity.recentActivity.map((log) => (
                    <TableRow key={log.id} className="border-white/10">
                      <TableCell className="text-white/60 text-sm whitespace-nowrap">{formatDate(log.createdAt)}</TableCell>
                      <TableCell className="text-white font-mono text-sm">{log.userEmail}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          log.action === "run" ? "bg-[#4ECDC4]/20 text-[#4ECDC4]" :
                          log.action === "view" ? "bg-blue-500/20 text-blue-400" :
                          log.action.includes("export") ? "bg-purple-500/20 text-purple-400" :
                          "bg-white/10 text-white/60"
                        }`}>
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-white/80 text-sm">{log.entityName || log.entityType}</TableCell>
                      <TableCell className="text-white/50 text-xs max-w-[200px] truncate">
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
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[#9FBCA4]/10 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[#257D41]/10 blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[#257D41] bg-[#257D41]/10 text-[#257D41] font-semibold hover:bg-[#257D41]/20 transition-colors disabled:opacity-50"
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
              <Loader2 className="w-16 h-16 mx-auto text-[#9FBCA4] animate-spin mb-4" />
              <p className="label-text text-gray-500">Starting verification...</p>
            </div>
          )
        )}

        {runVerification.isPending && (
          <div className="text-center py-12">
            <Loader2 className="w-16 h-16 mx-auto text-[#9FBCA4] animate-spin mb-4" />
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
                  <div className="text-3xl font-mono font-bold text-[#257D41]">{verificationResults.summary.totalPassed}</div>
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
                    <span className="text-xs font-mono text-[#257D41] bg-green-50 px-2 py-1 rounded">{property.passed} passed</span>
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
              <div className="p-5 rounded-2xl bg-[#9FBCA4]/10 border border-[#9FBCA4]/30">
                <h4 className="font-display text-[#257D41] font-semibold mb-3">Management Company Checks</h4>
                <div className="space-y-2">
                  {verificationResults.companyChecks.map((chk, cIdx) => renderCheckRow(chk, cIdx))}
                </div>
              </div>
            )}

            {/* Consolidated Portfolio Checks */}
            {verificationResults.consolidatedChecks.length > 0 && (
              <div className="p-5 rounded-2xl bg-[#257D41]/10 border border-[#257D41]/30">
                <h4 className="font-display text-[#257D41] font-semibold mb-3">Consolidated Portfolio Checks</h4>
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
      <Card className="relative overflow-hidden bg-[#0a0a0f]/95 backdrop-blur-3xl border border-white/10 shadow-2xl shadow-black/50">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-black/20" />
        <CardHeader className="relative">
          <CardTitle className="font-display text-white flex items-center gap-2"><Image className="w-5 h-5" /> Logo Portfolio</CardTitle>
          <CardDescription className="label-text">Manage logos available for user assignment</CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminLogos?.map(logo => (
              <div key={logo.id} className="relative bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4" data-testid={`logo-card-${logo.id}`}>
                <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
                  <img src={logo.url} alt={logo.name} className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{logo.name}</p>
                  {logo.isDefault && <span className="text-xs text-[#9FBCA4] font-mono">DEFAULT</span>}
                </div>
                {!logo.isDefault && (
                  <Button variant="ghost" size="sm" onClick={() => deleteLogoMutation.mutate(logo.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10" data-testid={`button-delete-logo-${logo.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-4">
            <h4 className="text-white/80 font-medium mb-3">Add New Logo</h4>
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-white/60 text-xs">Name</Label>
                <Input value={newLogoName} onChange={(e) => setNewLogoName(e.target.value)} placeholder="Logo name" className="bg-white/5 border-white/10" data-testid="input-new-logo-name" />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-white/60 text-xs">URL</Label>
                <Input value={newLogoUrl} onChange={(e) => setNewLogoUrl(e.target.value)} placeholder="/logos/custom.png or https://..." className="bg-white/5 border-white/10" data-testid="input-new-logo-url" />
              </div>
              <Button variant="outline" onClick={() => createLogoMutation.mutate({ name: newLogoName, url: newLogoUrl })} disabled={!newLogoName || !newLogoUrl || createLogoMutation.isPending} className="flex items-center gap-2" data-testid="button-add-logo">
                {createLogoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden bg-[#0a0a0f]/95 backdrop-blur-3xl border border-white/10 shadow-2xl shadow-black/50">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-black/20" />
        <CardHeader className="relative">
          <CardTitle className="font-display text-white flex items-center gap-2"><Users className="w-5 h-5" /> User Branding Assignment</CardTitle>
          <CardDescription className="label-text">Assign a specific logo and theme to each user</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">User</TableHead>
                <TableHead className="text-white/60">Role</TableHead>
                <TableHead className="text-white/60">Assigned Logo</TableHead>
                <TableHead className="text-white/60">Assigned Theme</TableHead>
                <TableHead className="text-white/60 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map(user => {
                const userLogo = adminLogos?.find(l => l.id === user.assignedLogoId);
                const userTheme = allThemes?.find(t => t.id === user.assignedThemeId);
                return (
                  <TableRow key={user.id} className="border-white/10 hover:bg-white/5" data-testid={`branding-row-${user.id}`}>
                    <TableCell className="text-white">
                      <div>
                        <span className="font-medium">{user.name || user.email}</span>
                        {user.name && <span className="text-white/40 text-xs ml-2">{user.email}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                        user.role === "admin" ? "bg-[#9FBCA4]/20 text-[#9FBCA4]" :
                        user.role === "checker" ? "bg-blue-500/20 text-blue-400" :
                        "bg-white/10 text-white/60"
                      }`}>{user.role}</span>
                    </TableCell>
                    <TableCell className="text-white/70">
                      {userLogo ? (
                        <div className="flex items-center gap-2">
                          <img src={userLogo.url} alt={userLogo.name} className="w-6 h-6 rounded object-contain bg-white/10" />
                          <span className="text-sm">{userLogo.name}</span>
                        </div>
                      ) : <span className="text-white/30 text-sm">Default</span>}
                    </TableCell>
                    <TableCell className="text-white/70">
                      {userTheme ? <span className="text-sm">{userTheme.name}</span> : <span className="text-white/30 text-sm">Default</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setBrandingUser(user);
                        setBrandingLogoId(user.assignedLogoId);
                        setBrandingThemeId(user.assignedThemeId);
                        setBrandingDialogOpen(true);
                      }} className="text-[#9FBCA4] hover:text-white hover:bg-white/10" data-testid={`button-edit-branding-${user.id}`}>
                        <Pencil className="w-4 h-4 mr-1" /> Assign
                      </Button>
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
    <Card className="relative overflow-hidden bg-[#0a0a0f]/95 backdrop-blur-3xl border border-white/10 shadow-2xl shadow-black/50" data-testid="card-sidebar-settings">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-black/20" />
      <CardHeader className="relative">
        <CardTitle className="font-display text-white flex items-center gap-2"><Settings className="w-5 h-5" /> Navigation Visibility</CardTitle>
        <CardDescription className="label-text">Toggle which optional pages appear in the sidebar for non-admin users. Core pages (Dashboard, Properties, Management Co., Settings, Profile, Administration) are always visible.</CardDescription>
      </CardHeader>
      <CardContent className="relative space-y-1">
        {sidebarToggles.map((toggle) => {
          const isOn = globalAssumptions?.[toggle.key] !== false;
          return (
            <div
              key={toggle.key}
              className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-white/5 transition-colors"
              data-testid={`sidebar-toggle-${toggle.key}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{toggle.label}</p>
                <p className="text-white/40 text-xs mt-0.5">{toggle.description}</p>
              </div>
              <Switch
                checked={isOn}
                onCheckedChange={(checked) => {
                  updateSidebarMutation.mutate({ [toggle.key]: checked });
                }}
                className="data-[state=checked]:bg-[#9FBCA4]"
                data-testid={`switch-${toggle.key}`}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );

  const renderThemes = () => (<ThemeManager />);

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
              <Loader2 className="w-12 h-12 mx-auto text-[#9FBCA4] animate-spin mb-3" />
              <p className="label-text text-gray-500 text-sm">Starting design consistency check...</p>
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
                  <p className="text-xs text-gray-500 font-mono mt-1">Run at: {formatDateTime(designResults.timestamp)}</p>
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
                        <p className="text-xs text-red-700 font-medium">Diagnosis: Design standard violation in {check.category}</p>
                        <p className="text-xs text-gray-600 mt-1">Solution: Update component to follow {check.category} design guidelines</p>
                      </div>
                    )}
                    {check.status === "warning" && (
                      <div className="ml-8 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                        <p className="text-xs text-yellow-700 font-medium">Diagnosis: Minor design inconsistency in {check.category}</p>
                        <p className="text-xs text-gray-600 mt-1">Solution: Consider updating to improve {check.category} consistency</p>
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
                   currentView === "activity-feed" ? "Activity Feed" :
                   currentView === "checker-activity" ? "Checker Activity" :
                   currentView === "verification" ? "Financial Verification" :
                   currentView === "themes" ? "Design Themes" :
                   currentView === "branding" ? "Branding" :
                   currentView === "sidebar" ? "Sidebar Navigation" : "Design Consistency"}
            subtitle={currentView === "dashboard" ? "Manage users, monitor activity, and run system verification" :
                      currentView === "users" ? "Add, edit, and manage user accounts" :
                      currentView === "activity" ? "Monitor user sessions and login history" :
                      currentView === "activity-feed" ? "Track all user actions across the system" :
                      currentView === "checker-activity" ? "Monitor checker verifications, manual reviews, and exports" :
                      currentView === "verification" ? "Run formula and GAAP compliance checks" :
                      currentView === "themes" ? "Manage color palettes and design systems" :
                      currentView === "branding" ? "Manage logos and assign branding per user" :
                      currentView === "sidebar" ? "Control which pages users and checkers see in the sidebar" : "Check fonts, colors, and component standards"}
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
        {currentView === "activity-feed" && renderActivityFeed()}
        {currentView === "checker-activity" && renderCheckerActivity()}
        {currentView === "verification" && renderVerification()}
        {currentView === "design" && renderDesign()}
        {currentView === "themes" && renderThemes()}
        {currentView === "branding" && renderBranding()}
        {currentView === "sidebar" && renderSidebar()}
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
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-testid="select-new-user-role">
                <option value="user">User</option>
                <option value="checker">Checker</option>
                <option value="admin">Admin</option>
              </select>
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
              <select value={editUser.role} onChange={(e) => setEditUser({ ...editUser, role: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-testid="select-edit-user-role">
                <option value="user">User</option>
                <option value="checker">Checker</option>
                <option value="admin">Admin</option>
              </select>
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

      <Dialog open={brandingDialogOpen} onOpenChange={setBrandingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Assign Branding</DialogTitle>
            <DialogDescription className="label-text">Set logo and theme for {brandingUser?.name || brandingUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Image className="w-4 h-4 text-gray-500" />Logo</Label>
              <select value={brandingLogoId ?? ""} onChange={(e) => setBrandingLogoId(e.target.value ? parseInt(e.target.value) : null)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-testid="select-branding-logo">
                <option value="">Default Logo</option>
                {adminLogos?.map(logo => (
                  <option key={logo.id} value={logo.id}>{logo.name}{logo.isDefault ? " (Default)" : ""}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Palette className="w-4 h-4 text-gray-500" />Theme</Label>
              <select value={brandingThemeId ?? ""} onChange={(e) => setBrandingThemeId(e.target.value ? parseInt(e.target.value) : null)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-testid="select-branding-theme">
                <option value="">Default Theme</option>
                {allThemes?.map(theme => (
                  <option key={theme.id} value={theme.id}>{theme.name}{theme.isActive ? " (Active)" : ""}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBrandingDialogOpen(false)} data-testid="button-cancel-branding">Cancel</Button>
            <Button variant="outline" onClick={() => {
              if (!brandingUser) return;
              assignBrandingMutation.mutate({ userId: brandingUser.id, assignedLogoId: brandingLogoId, assignedThemeId: brandingThemeId });
            }} disabled={assignBrandingMutation.isPending} data-testid="button-save-branding" className="flex items-center gap-2">
              {assignBrandingMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Layout>
    </TooltipProvider>
  );
}
