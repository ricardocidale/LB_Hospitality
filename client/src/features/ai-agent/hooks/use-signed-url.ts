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
      return data.signedUrl as string;
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}
