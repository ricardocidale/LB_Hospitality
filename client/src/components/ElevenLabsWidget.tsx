import { useGlobalAssumptions } from "@/lib/api/admin";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
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

  if (!enabled || !agentId) return null;

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";

  const dynamicVars = JSON.stringify({
    user_name: fullName,
    user_role: user?.role || "partner",
    current_page: location,
  });

  return (
    <elevenlabs-convai
      agent-id={agentId}
      language={language}
      dynamic-variables={dynamicVars}
    />
  );
}
