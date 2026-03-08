import { useEffect, useRef } from "react";
import { useGlobalAssumptions } from "@/lib/api/admin";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

/**
 * Renders the native ElevenLabs <elevenlabs-convai> widget.
 *
 * The widget automatically fetches its full configuration from ElevenLabs
 * (variant, placement, avatar, colors, text labels, language presets,
 * feedback mode, etc.) using the agent-id. All those settings are managed
 * in the ElevenLabs dashboard or pushed via the API from our Admin panel.
 *
 * We only pass HTML attributes for:
 *  - agent-id (required)
 *  - dynamic-variables (runtime user context)
 *  - avatar-image-url (local override if admin sets one)
 */
export default function ElevenLabsWidget({ enabled = false }: { enabled?: boolean }) {
  const { data: global } = useGlobalAssumptions();
  const { user } = useAuth();
  const [location] = useLocation();

  const agentId = (global as any)?.marcelaAgentId;
  const avatarUrl = (global as any)?.marcelaAvatarUrl as string | undefined;

  const shouldActivate = !!(enabled && agentId);

  if (!shouldActivate) return null;

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";
  const dynamicVars: Record<string, string> = {
    user_name: fullName,
    user_role: user?.role || "partner",
    current_page: location,
  };

  return (
    <NativeElevenLabsWidget
      agentId={agentId}
      avatarUrl={avatarUrl}
      dynamicVars={dynamicVars}
    />
  );
}

function NativeElevenLabsWidget({
  agentId,
  avatarUrl,
  dynamicVars,
}: {
  agentId: string;
  avatarUrl?: string;
  dynamicVars: Record<string, string>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    // Wait for the custom element registered in main.tsx via the local
    // @elevenlabs/convai-widget-core package (no external CDN dependency).
    customElements.whenDefined("elevenlabs-convai").then(() => {
      if (cancelled || !containerRef.current) return;

      if (widgetRef.current) {
        widgetRef.current.remove();
        widgetRef.current = null;
      }

      const widget = document.createElement("elevenlabs-convai");
      widget.setAttribute("agent-id", agentId);
      if (avatarUrl) widget.setAttribute("avatar-image-url", avatarUrl);
      widget.setAttribute("dynamic-variables", JSON.stringify(dynamicVars));

      containerRef.current!.appendChild(widget);
      widgetRef.current = widget;
    });

    return () => {
      cancelled = true;
      widgetRef.current?.remove();
      widgetRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  useEffect(() => {
    if (widgetRef.current) {
      widgetRef.current.setAttribute("dynamic-variables", JSON.stringify(dynamicVars));
    }
  }, [dynamicVars.user_name, dynamicVars.user_role, dynamicVars.current_page]);

  return <div ref={containerRef} data-testid="elevenlabs-native-widget" />;
}
