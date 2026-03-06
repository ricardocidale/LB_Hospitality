import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { invalidateAllFinancialQueries } from "@/lib/api";
import type { Logo, User, AdminCompany } from "./types";

export function adminFetch<T>(url: string, errorMsg: string): () => Promise<T> {
  return async () => {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error(errorMsg);
    return res.json();
  };
}

export function adminMutate(url: string, method: "POST" | "PATCH" | "DELETE" = "POST") {
  return async (body?: Record<string, any>) => {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Request failed`);
    }
    return res.json();
  };
}

export function useAdminLogos() {
  return useQuery<Logo[]>({
    queryKey: ["admin", "logos"],
    queryFn: adminFetch<Logo[]>("/api/logos", "Failed to fetch logos"),
  });
}

export function useAdminUsers() {
  return useQuery<User[]>({
    queryKey: ["admin", "users"],
    queryFn: adminFetch<User[]>("/api/admin/users", "Failed to fetch users"),
  });
}

export function useAdminCompanies() {
  return useQuery<AdminCompany[]>({
    queryKey: ["admin", "companies"],
    queryFn: adminFetch<AdminCompany[]>("/api/admin/companies", "Failed to fetch companies"),
  });
}

export function useGlobalAssumptions() {
  return useQuery({
    queryKey: ["globalAssumptions"],
    queryFn: adminFetch("/api/global-assumptions", "Failed to fetch global assumptions"),
  });
}

export function useUpdateGlobalAssumptions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: globalAssumptions } = useGlobalAssumptions();

  return useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const res = await fetch("/api/global-assumptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...(globalAssumptions ?? {}), ...updates }),
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
}
