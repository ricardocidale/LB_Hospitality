import { useGlobalAssumptions } from "@/lib/api/admin";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { registerWidget } from "@elevenlabs/convai-widget-core";

if (!customElements.get("elevenlabs-convai")) {
  registerWidget();
}

export default function ElevenLabsWidget({ enabled = false }: { enabled?: boolean }) {
  const { data: global } = useGlobalAssumptions();
  const { user } = useAuth();
  const [location] = useLocation();

  const agentId = (global as any)?.marcelaAgentId;
  const language = (global as any)?.marcelaLanguage || "en";
  const variant = (global as any)?.marcelaWidgetVariant || "compact";

  const { data: signedUrl } = useQuery<string>({
    queryKey: ["marcela-signed-url"],
    queryFn: async () => {
      const res = await fetch("/api/marcela/signed-url", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to get signed URL");
      const data = await res.json();
      return data.signedUrl as string;
    },
    enabled: !!(enabled && agentId),
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 1,
  });

  if (!enabled || !agentId) return null;

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";
  const dynamicVars = JSON.stringify({
    user_name: fullName,
    user_role: user?.role || "partner",
    current_page: location,
  });

  // Use signed URL for private agent access; fall back to agent-id while loading
  if (signedUrl) {
    return (
      <elevenlabs-convai
        signed-url={signedUrl}
        language={language}
        variant={variant}
        dynamic-variables={dynamicVars}
      />
    );
  }

  return (
    <elevenlabs-convai
      agent-id={agentId}
      language={language}
      variant={variant}
      dynamic-variables={dynamicVars}
    />
  );
}
