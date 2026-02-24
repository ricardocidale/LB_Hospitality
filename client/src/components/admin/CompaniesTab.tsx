/**
 * CompaniesTab.tsx — Company entity management for administrators.
 *
 * In this platform, "companies" are legal entities:
 *   • Management Company — the operating entity that manages properties
 *     and earns management fees (there is typically one per platform instance)
 *   • SPV (Special Purpose Vehicle) — a single-asset entity created for
 *     each property acquisition. SPVs isolate liability and simplify
 *     ownership structures for investors.
 *
 * This tab lets admins:
 *   • Create new SPV companies
 *   • Edit company names and metadata
 *   • Assign properties to SPVs
 *   • Delete companies (with cascade warnings)
 *
 * Data flows: GET/POST/PATCH/DELETE /api/admin/companies
 */
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Pencil, Building2, Save, Image, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User, Logo, AdminCompany } from "./types";

export default function CompaniesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<AdminCompany | null>(null);
  const [companyForm, setCompanyForm] = useState({ name: "", type: "spv" as string, description: "", logoId: null as number | null });
  const [mgmtName, setMgmtName] = useState("");
  const [mgmtLogoId, setMgmtLogoId] = useState<number | null>(null);
  const [mgmtInitialized, setMgmtInitialized] = useState(false);

  const { data: users } = useQuery<User[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const { data: adminLogos } = useQuery<Logo[]>({
    queryKey: ["admin", "logos"],
    queryFn: async () => {
      const res = await fetch("/api/admin/logos", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch logos");
      return res.json();
    },
  });

  const { data: adminCompanies } = useQuery<AdminCompany[]>({
    queryKey: ["admin", "companies"],
    queryFn: async () => {
      const res = await fetch("/api/admin/companies", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch companies");
      return res.json();
    },
  });

  const managementCompany = adminCompanies?.find(c => c.type === "management");
  const spvCompanies = adminCompanies?.filter(c => c.type !== "management") || [];

  useEffect(() => {
    if (managementCompany && !mgmtInitialized) {
      setMgmtName(managementCompany.name);
      setMgmtLogoId(managementCompany.logoId);
      setMgmtInitialized(true);
    }
    if (!managementCompany) {
      setMgmtInitialized(false);
    }
  }, [managementCompany, mgmtInitialized]);

  const createCompanyMutation = useMutation({
    mutationFn: async (data: { name: string; type: string; description?: string | null; logoId?: number | null }) => {
      const res = await fetch("/api/admin/companies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!res.ok) throw new Error("Failed to create company");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "companies"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setCompanyDialogOpen(false);
      setCompanyForm({ name: "", type: "spv", description: "", logoId: null });
      setEditingCompany(null);
      toast({ title: "Company Created", description: "Company has been created." });
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; name?: string; type?: string; description?: string | null; logoId?: number | null }) => {
      const res = await fetch(`/api/admin/companies/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!res.ok) throw new Error("Failed to update company");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "companies"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setCompanyDialogOpen(false);
      setEditingCompany(null);
      toast({ title: "Company Updated", description: "Company has been updated." });
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/companies/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete company");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "companies"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({ title: "Company Deleted", description: "Company has been deleted." });
    },
  });

  const saveMgmtCompanyMutation = useMutation({
    mutationFn: async (data: { name: string; logoId: number | null }) => {
      if (managementCompany) {
        const res = await fetch(`/api/admin/companies/${managementCompany.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.name, logoId: data.logoId, type: "management" }), credentials: "include" });
        if (!res.ok) throw new Error("Failed to update management company");
        return res.json();
      } else {
        const res = await fetch("/api/admin/companies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.name, logoId: data.logoId, type: "management" }), credentials: "include" });
        if (!res.ok) throw new Error("Failed to create management company");
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "companies"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setMgmtInitialized(false);
      toast({ title: "Management Company Saved", description: "Management company name and logo have been updated." });
    },
  });

  const mgmtLogo = mgmtLogoId != null ? adminLogos?.find(l => l.id === mgmtLogoId) : null;
  const mgmtDirty = managementCompany
    ? (mgmtName !== managementCompany.name || mgmtLogoId !== managementCompany.logoId)
    : (mgmtName.length > 0);

  return (
    <>
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-xl border-primary/30 shadow-[0_8px_32px_rgba(159,188,164,0.15)]">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Management Company</CardTitle>
          <CardDescription className="label-text">Set the name and logo for the management company. Only admins can configure this.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {mgmtLogo ? (
                <div className="w-20 h-20 rounded-xl bg-white border-2 border-primary/30 flex items-center justify-center overflow-hidden shadow-md">
                  <img src={mgmtLogo.url} alt={mgmtLogo.name} className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-primary/40" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium"><Pencil className="w-3.5 h-3.5 text-primary" />Company Name</Label>
                <Input
                  value={mgmtName}
                  onChange={(e) => setMgmtName(e.target.value)}
                  placeholder="e.g., Hospitality Business Group"
                  className="max-w-md"
                  data-testid="input-mgmt-company-name"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium"><Image className="w-3.5 h-3.5 text-primary" />Logo</Label>
                <Select
                  value={mgmtLogoId != null ? String(mgmtLogoId) : "none"}
                  onValueChange={(v) => setMgmtLogoId(v === "none" ? null : parseInt(v))}
                >
                  <SelectTrigger className="max-w-md" data-testid="trigger-mgmt-company-logo"><SelectValue placeholder="Select a logo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Logo</SelectItem>
                    {adminLogos?.map(logo => (
                      <SelectItem key={logo.id} value={String(logo.id)}>
                        <span className="flex items-center gap-2">
                          <img src={logo.url} alt={logo.name} className="w-5 h-5 object-contain rounded" />
                          {logo.name}{logo.isDefault ? " (Default)" : ""}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(!adminLogos || adminLogos.length === 0) && (
                  <p className="text-xs text-muted-foreground">No logos uploaded yet. Go to Logo Management to upload logos first.</p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => saveMgmtCompanyMutation.mutate({ name: mgmtName, logoId: mgmtLogoId })}
                disabled={!mgmtName.trim() || !mgmtDirty || saveMgmtCompanyMutation.isPending}
                className="flex items-center gap-2 mt-2"
                data-testid="button-save-mgmt-company"
              >
                {saveMgmtCompanyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-500" /> SPV Companies</CardTitle>
              <CardDescription className="label-text">Manage special purpose vehicle companies for individual properties.</CardDescription>
            </div>
            <Button variant="outline" onClick={() => {
              setEditingCompany(null);
              setCompanyForm({ name: "", type: "spv", description: "", logoId: null });
              setCompanyDialogOpen(true);
            }} className="flex items-center gap-2" data-testid="button-add-company">
              <Plus className="w-4 h-4" /> New SPV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-4">
          {spvCompanies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No SPV companies created yet.</p>
              <p className="text-sm">Create an SPV to represent individual property entities.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {spvCompanies.map(company => {
                const companyLogo = adminLogos?.find(l => l.id === company.logoId);
                const companyUsers = users?.filter(u => u.companyId === company.id) || [];
                return (
                  <div key={company.id} className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4" data-testid={`company-card-${company.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {companyLogo ? (
                          <div className="w-10 h-10 rounded-lg bg-white border border-blue-500/20 flex items-center justify-center overflow-hidden">
                            <img src={companyLogo.url} alt={companyLogo.name} className="max-w-full max-h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-blue-500" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-display text-foreground font-medium">{company.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded font-mono bg-blue-500/20 text-blue-600">SPV</span>
                          {!company.isActive && <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-600 ml-2">Inactive</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingCompany(company);
                          setCompanyForm({ name: company.name, type: company.type, description: company.description || "", logoId: company.logoId });
                          setCompanyDialogOpen(true);
                        }} className="text-blue-500 hover:text-foreground hover:bg-blue-500/10" data-testid={`button-edit-company-${company.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => {
                          if (confirm(`Delete "${company.name}"? Users assigned to this company will be unassigned.`)) {
                            deleteCompanyMutation.mutate(company.id);
                          }
                        }} className="text-red-400 hover:text-red-300 hover:bg-red-500/10" data-testid={`button-delete-company-${company.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {company.description && (
                      <p className="text-sm text-muted-foreground mb-3">{company.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                      {companyLogo && <span className="bg-blue-500/10 px-2 py-0.5 rounded">Logo: {companyLogo.name}</span>}
                      <span className="bg-blue-500/10 px-2 py-0.5 rounded">{companyUsers.length} member{companyUsers.length !== 1 ? "s" : ""}</span>
                    </div>
                    {companyUsers.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {companyUsers.map(u => (
                          <span key={u.id} className="inline-flex items-center gap-1 bg-white/80 border border-blue-500/20 rounded-full px-3 py-1 text-sm">
                            <span className="font-medium">{u.name || u.email}</span>
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
    </div>

    <Dialog open={companyDialogOpen} onOpenChange={setCompanyDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">{editingCompany ? "Edit SPV" : "Create SPV"}</DialogTitle>
          <DialogDescription className="label-text">{editingCompany ? "Update SPV company details" : "Create a new SPV company with a name and logo"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Building2 className="w-4 h-4 text-gray-500" />Company Name</Label>
            <Input value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} placeholder="e.g., Norfolk Group" data-testid="input-company-form-name" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Image className="w-4 h-4 text-gray-500" />Logo</Label>
            <Select value={companyForm.logoId != null ? String(companyForm.logoId) : "none"} onValueChange={(v) => setCompanyForm({ ...companyForm, logoId: v === "none" ? null : parseInt(v) })} data-testid="select-company-logo">
              <SelectTrigger data-testid="trigger-company-logo"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Logo</SelectItem>
                {adminLogos?.map(logo => (
                  <SelectItem key={logo.id} value={String(logo.id)}>{logo.name}{logo.isDefault ? " (Default)" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><FileText className="w-4 h-4 text-gray-500" />Description</Label>
            <Input value={companyForm.description} onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })} placeholder="Optional description" data-testid="input-company-form-description" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setCompanyDialogOpen(false); setEditingCompany(null); }} data-testid="button-cancel-company">Cancel</Button>
          <Button variant="outline" onClick={() => {
            const payload = { ...companyForm, type: "spv", description: companyForm.description || null };
            if (editingCompany) {
              updateCompanyMutation.mutate({ id: editingCompany.id, ...payload });
            } else {
              createCompanyMutation.mutate(payload);
            }
          }} disabled={!companyForm.name || createCompanyMutation.isPending || updateCompanyMutation.isPending} data-testid="button-save-company" className="flex items-center gap-2">
            {(createCompanyMutation.isPending || updateCompanyMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editingCompany ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
