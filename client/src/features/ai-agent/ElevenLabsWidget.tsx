import { useEffect, useRef } from "react";
import { useGlobalAssumptions } from "@/lib/api/admin";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

export default function ElevenLabsWidget({ enabled = false }: { enabled?: boolean }) {
  const { data: global } = useGlobalAssumptions();
  const { user } = useAuth();
  const [location] = useLocation();

  const agentId = (global as any)?.marcelaAgentId;
  const variant = ((global as any)?.marcelaWidgetVariant || "compact") as string;
  const avatarUrl = (global as any)?.marcelaAvatarUrl as string | undefined;
  const language = (global as any)?.marcelaLanguage as string | undefined;

  const shouldActivate = !!(enabled && agentId);

  if (!shouldActivate) return null;

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";
  const dynamicVars: Record<string, string> = {
    user_name: fullName,
    user_role: user?.role || "partner",
    current_page: location,
  };

  // All variants are native ElevenLabs widget variants: compact, full, tiny
  return (
    <NativeElevenLabsWidget
      agentId={agentId}
      variant={variant}
      avatarUrl={avatarUrl}
      language={language}
      dynamicVars={dynamicVars}
    />
  );
}

function NativeElevenLabsWidget({
  agentId,
  variant,
  avatarUrl,
  language,
  dynamicVars,
}: {
  agentId: string;
  variant: string;
  avatarUrl?: string;
  language?: string;
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
      widget.setAttribute("variant", variant);
      if (avatarUrl) widget.setAttribute("avatar-image-url", avatarUrl);
      if (language) widget.setAttribute("language", language);
      widget.setAttribute("dynamic-variables", JSON.stringify(dynamicVars));

      // Enable native widget features
      widget.setAttribute("text-input", "true");
      widget.setAttribute("collect-feedback", "true");
      widget.setAttribute("mic-muting", "true");
      widget.setAttribute("transcript", "true");

      containerRef.current!.appendChild(widget);
      widgetRef.current = widget;
    });

    return () => {
      cancelled = true;
      widgetRef.current?.remove();
      widgetRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, variant]);

  useEffect(() => {
    if (widgetRef.current) {
      widgetRef.current.setAttribute("dynamic-variables", JSON.stringify(dynamicVars));
    }
  }, [dynamicVars.user_name, dynamicVars.user_role, dynamicVars.current_page]);

  useEffect(() => {
    if (widgetRef.current && language) {
      widgetRef.current.setAttribute("language", language);
    }
  }, [language]);

  return <div ref={containerRef} data-testid="elevenlabs-native-widget" />;
}
