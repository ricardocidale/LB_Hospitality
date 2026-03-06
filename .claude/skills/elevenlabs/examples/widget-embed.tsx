/**
 * Widget web component embed for React apps.
 * Uses @elevenlabs/convai-widget-core (NOT convai-widget-embed).
 */
import React, { useEffect, useRef, useMemo } from "react";
import { registerWidget } from "@elevenlabs/convai-widget-core";

if (!customElements.get("elevenlabs-convai")) {
  registerWidget();
}

interface WidgetProps {
  agentId?: string;
  signedUrl?: string;
  userName?: string;
  language?: string;
  overridePrompt?: string;
  overrideFirstMessage?: string;
  overrideVoiceId?: string;
  avatarImageUrl?: string;
  orbColor1?: string;
  orbColor2?: string;
  actionText?: string;
  variant?: "compact" | "expanded";
  onNavigate?: (page: string) => void;
}

export function ElevenLabsWidget({
  agentId,
  signedUrl,
  userName,
  language,
  overridePrompt,
  overrideFirstMessage,
  overrideVoiceId,
  avatarImageUrl,
  orbColor1,
  orbColor2,
  actionText,
  variant,
  onNavigate,
}: WidgetProps) {
  const widgetRef = useRef<HTMLElement>(null);

  const dynamicVars = useMemo(
    () =>
      JSON.stringify({
        user_name: userName || "Guest",
        current_page: window.location.pathname,
        timestamp: new Date().toISOString(),
      }),
    [userName]
  );

  useEffect(() => {
    const el = widgetRef.current;
    if (!el) return;

    const handleCall = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail?.config) return;

      detail.config.clientTools = {
        navigateToPage: ({ page }: { page: string }) => {
          onNavigate?.(page);
          return `Navigated to ${page}`;
        },
        getCurrentContext: () => {
          return JSON.stringify({
            page: window.location.pathname,
            user: userName || "Guest",
            time: new Date().toISOString(),
          });
        },
      };
    };

    el.addEventListener("elevenlabs-convai:call", handleCall);
    return () => el.removeEventListener("elevenlabs-convai:call", handleCall);
  }, [userName, onNavigate]);

  const attrs: Record<string, string | undefined> = {
    "agent-id": agentId,
    "signed-url": signedUrl,
    "dynamic-variables": dynamicVars,
    "override-language": language,
    "override-prompt": overridePrompt,
    "override-first-message": overrideFirstMessage,
    "override-voice-id": overrideVoiceId,
    "avatar-image-url": avatarImageUrl,
    "avatar-orb-color-1": orbColor1,
    "avatar-orb-color-2": orbColor2,
    "action-text": actionText,
    variant: variant,
  };

  const cleanAttrs = Object.fromEntries(
    Object.entries(attrs).filter(([, v]) => v !== undefined)
  );

  return React.createElement("elevenlabs-convai", {
    ref: widgetRef,
    ...cleanAttrs,
  });
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "elevenlabs-convai": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & Record<string, any>,
        HTMLElement
      >;
    }
  }
}
