import { useEffect, useRef } from "react";
import { useGlobalAssumptions } from "@/lib/api/admin";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useAdminSignedUrl } from "@/features/ai-agent/hooks/use-signed-url";

export default function ElevenLabsWidget({ enabled = false }: { enabled?: boolean }) {
  const { data: global } = useGlobalAssumptions();
  const { user } = useAuth();
  const [location] = useLocation();
  const { data: signedUrl } = useAdminSignedUrl();

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
      signedUrl={signedUrl}
      avatarUrl={avatarUrl}
      dynamicVars={dynamicVars}
    />
  );
}

function NativeElevenLabsWidget({
  signedUrl,
  avatarUrl,
  dynamicVars,
}: {
  signedUrl?: string;
  avatarUrl?: string;
  dynamicVars: Record<string, string>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !signedUrl) return;
    let cancelled = false;

    customElements.whenDefined("elevenlabs-convai").then(() => {
      if (cancelled || !containerRef.current) return;

      if (widgetRef.current) {
        widgetRef.current.remove();
        widgetRef.current = null;
      }

      const widget = document.createElement("elevenlabs-convai");
      widget.setAttribute("signed-url", signedUrl);
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
  }, [signedUrl]);

  useEffect(() => {
    if (widgetRef.current) {
      widgetRef.current.setAttribute("dynamic-variables", JSON.stringify(dynamicVars));
    }
  }, [dynamicVars.user_name, dynamicVars.user_role, dynamicVars.current_page]);

  return <div ref={containerRef} data-testid="elevenlabs-native-widget" />;
}
