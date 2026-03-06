import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { runFullVerification, runKnownValueTestsStructured } from "@/lib/runVerification";
import type { VerificationResult, VerificationHistoryEntry, DesignCheckResult } from "./types";

export function useVerificationHistory() {
  return useQuery<VerificationHistoryEntry[]>({
    queryKey: ["admin", "verification-history"],
    queryFn: async () => {
      const res = await fetch("/api/verification/history", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch verification history");
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) throw new Error("Server returned non-JSON response");
      return res.json();
    },
  });
}

export function useRunVerification(onSuccess?: (data: VerificationResult) => void) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      async function safeFetchJSON<T>(url: string, label: string): Promise<T> {
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) {
          const ct = res.headers.get("content-type") || "";
          if (!ct.includes("application/json")) {
            throw new Error(`${label}: server returned ${res.status} (non-JSON)`);
          }
          const body = await res.json().catch(() => ({}));
          throw new Error(`${label}: ${(body as any).error || res.statusText}`);
        }
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          throw new Error(`${label}: expected JSON but received ${ct || "unknown content"}`);
        }
        return res.json();
      }

      const [properties, globalAssumptions] = await Promise.all([
        safeFetchJSON<any[]>("/api/properties", "Properties"),
        safeFetchJSON<any>("/api/global-assumptions", "Global assumptions"),
      ]);

      const comprehensiveResults = runFullVerification(properties, globalAssumptions);
      const knownValueTests = runKnownValueTestsStructured();

      const serverRes = await fetch("/api/verification/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ clientResults: comprehensiveResults }),
      });
      if (!serverRes.ok) {
        const ct = serverRes.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          throw new Error(`Server verification: returned ${serverRes.status} (non-JSON)`);
        }
        const body = await serverRes.json().catch(() => ({}));
        throw new Error(`Server verification: ${(body as any).error || serverRes.statusText}`);
      }
      const sct = serverRes.headers.get("content-type") || "";
      if (!sct.includes("application/json")) {
        throw new Error(`Server verification: expected JSON but received ${sct || "unknown content"}`);
      }
      const serverRun = await serverRes.json();
      const serverReport: VerificationResult = serverRun.results ?? serverRun;

      return {
        ...serverReport,
        clientAuditWorkpaper: comprehensiveResults.auditWorkpaper,
        clientAuditReports: comprehensiveResults.auditReports,
        clientKnownValueTests: knownValueTests,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "verification-history"] });
      toast({
        title: data.summary.auditOpinion === "UNQUALIFIED" ? "Audit Complete - Unqualified Opinion" :
               data.summary.auditOpinion === "QUALIFIED" ? "Audit Complete - Qualified Opinion" :
               "Audit Complete - Issues Found",
        description: `${data.summary.totalChecks} checks run. ${data.summary.criticalIssues} critical issues.`,
        variant: data.summary.auditOpinion === "UNQUALIFIED" ? "default" : "destructive"
      });
      if (onSuccess) onSuccess(data);
    },
    onError: (error: Error) => {
      toast({ title: "Verification Failed", description: error.message, variant: "destructive" });
    },
  });
}

export function useRunDesignCheck(onSuccess?: (data: DesignCheckResult) => void) {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/verification/design-check", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to run design check");
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) throw new Error("Server returned non-JSON response");
      return res.json();
    },
    onSuccess: (data) => {
      if (onSuccess) onSuccess(data);
    },
    onError: (error: Error) => {
      toast({ title: "Design Check Failed", description: error.message, variant: "destructive" });
    },
  });
}
