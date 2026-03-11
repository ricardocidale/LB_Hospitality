import { useQuery } from "@tanstack/react-query";
import { AI_AGENT_KEYS } from "@/features/ai-agent/query-keys";

export function useAdminSignedUrl() {
  return useQuery<string>({
    queryKey: AI_AGENT_KEYS.signedUrl,
    queryFn: async () => {
      const res = await fetch("/api/marcela/signed-url", { credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Unknown error" }));
        const msg = data.error || `HTTP ${res.status}`;
        console.warn("[Marcela] Signed URL failed:", msg);
        throw new Error(msg);
      }
      const data = await res.json();
      if (!data.signedUrl) {
        throw new Error("Server returned empty signed URL");
      }
      return data.signedUrl as string;
    },
    // Signed URLs expire — refresh every 8 minutes (they last ~10 min)
    staleTime: 8 * 60 * 1000,
    // Retry once on transient failures (network blip), but not on 4xx config errors
    retry: (failureCount, error) => {
      if (failureCount >= 1) return false;
      const msg = (error as Error).message || "";
      // Don't retry config errors (missing agent ID, missing API key)
      if (msg.includes("not configured") || msg.includes("not set") || msg.includes("404")) return false;
      return true;
    },
    retryDelay: 2000,
  });
}
