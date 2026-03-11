import { useEffect, useRef, useState } from "react";
import { useGlobalAssumptions } from "@/lib/api/admin";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useAdminSignedUrl } from "@/features/ai-agent/hooks/use-signed-url";

/** How long to wait for the custom element before giving up (ms). */
const WIDGET_REGISTER_TIMEOUT = 10_000;

export default function ElevenLabsWidget({ enabled = false }: { enabled?: boolean }) {
  const { data: global } = useGlobalAssumptions();
  const { user } = useAuth();
  const [location] = useLocation();
  const { data: signedUrl, error: signedUrlError, isLoading: signedUrlLoading } = useAdminSignedUrl();

  const agentId = (global as any)?.marcelaAgentId;
  const avatarUrl = (global as any)?.marcelaAvatarUrl as string | undefined;

  const shouldActivate = !!(enabled && agentId);

  useEffect(() => {
    if (!enabled && global) {
      const reasons: string[] = [];
      if (!(global as any)?.showAiAssistant) reasons.push("showAiAssistant is off");
      if (!(global as any)?.marcelaEnabled) reasons.push("marcelaEnabled is off");
      if (!agentId) reasons.push("marcelaAgentId is empty");
      if (reasons.length > 0) {
        console.info("[Marcela] Widget inactive:", reasons.join(", "));
      }
    }
    if (signedUrlError) {
      console.warn("[Marcela] Signed URL error:", (signedUrlError as Error).message);
    }
  }, [enabled, global, agentId, signedUrlError]);

  if (!shouldActivate) return null;

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";
  const dynamicVars: Record<string, string> = {
    user_name: fullName,
    user_role: user?.role || "partner",
    current_page: location,
  };

  // Show nothing while signed URL is loading; if it failed, log was already emitted
  if (signedUrlLoading || signedUrlError || !signedUrl) return null;

  return (
    <NativeElevenLabsWidget
      agentId={agentId}
      signedUrl={signedUrl}
      avatarUrl={avatarUrl}
      dynamicVars={dynamicVars}
    />
  );
}

function NativeElevenLabsWidget({
  agentId,
  signedUrl,
  avatarUrl,
  dynamicVars,
}: {
  agentId: string;
  signedUrl: string;
  avatarUrl?: string;
  dynamicVars: Record<string, string>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    // Race: wait for custom element registration OR timeout
    const timeoutId = setTimeout(() => {
      if (!cancelled && !customElements.get("elevenlabs-convai")) {
        console.error("[Marcela] Widget element never registered — timed out after", WIDGET_REGISTER_TIMEOUT, "ms");
        setError("Widget failed to load");
      }
    }, WIDGET_REGISTER_TIMEOUT);

    // If already registered, resolve immediately
    const isAlreadyDefined = !!customElements.get("elevenlabs-convai");

    const mount = () => {
      if (cancelled || !containerRef.current) return;
      clearTimeout(timeoutId);

      if (widgetRef.current) {
        widgetRef.current.remove();
        widgetRef.current = null;
      }

      try {
        const widget = document.createElement("elevenlabs-convai");
        widget.setAttribute("agent-id", agentId);
        widget.setAttribute("signed-url", signedUrl);
        if (avatarUrl) widget.setAttribute("avatar-image-url", avatarUrl);
        widget.setAttribute("dynamic-variables", JSON.stringify(dynamicVars));

        containerRef.current!.appendChild(widget);
        widgetRef.current = widget;
        setError(null);
        console.info("[Marcela] Widget mounted with signed URL");
      } catch (err) {
        console.error("[Marcela] Failed to create widget element:", err);
        setError("Widget creation failed");
      }
    };

    if (isAlreadyDefined) {
      mount();
    } else {
      customElements.whenDefined("elevenlabs-convai").then(mount);
    }

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      widgetRef.current?.remove();
      widgetRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, signedUrl]);

  // Update dynamic variables when they change (e.g. page navigation)
  const dynamicVarsJson = JSON.stringify(dynamicVars);
  useEffect(() => {
    if (widgetRef.current) {
      widgetRef.current.setAttribute("dynamic-variables", dynamicVarsJson);
    }
  }, [dynamicVarsJson]);

  if (error) {
    // Don't render broken widget — fail silently for end users, error already logged
    return null;
  }

  return <div ref={containerRef} data-testid="elevenlabs-native-widget" />;
}
