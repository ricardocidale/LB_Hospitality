import { useGlobalAssumptions } from "@/lib/api/admin";
import { useAuth } from "@/lib/auth";
import { registerWidget } from "@elevenlabs/convai-widget-core";

if (!customElements.get("elevenlabs-convai")) {
  registerWidget();
}

export default function ElevenLabsWidget({ enabled = false }: { enabled?: boolean }) {
  const { data: global } = useGlobalAssumptions();
  const { user } = useAuth();

  const agentId = (global as any)?.marcelaAgentId;

  if (!enabled || !agentId) return null;

  const dynamicVars = JSON.stringify({
    user_name: user?.firstName || "User",
    user_role: user?.role || "partner",
    current_page: window.location.pathname,
  });

  return (
    <elevenlabs-convai
      agent-id={agentId}
      dynamic-variables={dynamicVars}
    />
  );
}
