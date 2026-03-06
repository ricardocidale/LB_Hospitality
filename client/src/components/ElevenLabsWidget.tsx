import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useGlobalAssumptions } from "@/lib/api/admin";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useWalkthroughStore } from "@/components/GuidedWalkthrough";
import { registerWidget } from "@elevenlabs/convai-widget-core";

if (!customElements.get("elevenlabs-convai")) {
  registerWidget();
}

export default function ElevenLabsWidget({ enabled = false }: { enabled?: boolean }) {
  const { data: global } = useGlobalAssumptions();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { setTourActive, setShownThisSession } = useWalkthroughStore();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [urlFailed, setUrlFailed] = useState(false);
  const fetchedRef = useRef(false);
  const widgetRef = useRef<HTMLElement>(null);
  const toolsRegisteredRef = useRef(false);

  const agentId = (global as any)?.marcelaAgentId;

  useEffect(() => {
    if (!enabled || !agentId || fetchedRef.current) return;
    fetchedRef.current = true;

    apiRequest("GET", "/api/marcela/signed-url")
      .then((res) => res.json())
      .then((data: { signedUrl: string }) => {
        setSignedUrl(data.signedUrl);
      })
      .catch(() => {
        setUrlFailed(true);
      });
  }, [enabled, agentId]);

  const handleNavigate = useCallback((page: string) => {
    setLocation(page);
    return `Navigated to ${page}`;
  }, [setLocation]);

  const handleStartTour = useCallback(() => {
    setShownThisSession(false);
    setTourActive(true);
    return "Guided tour started";
  }, [setTourActive, setShownThisSession]);

  useEffect(() => {
    const el = widgetRef.current;
    if (!el || toolsRegisteredRef.current) return;
    toolsRegisteredRef.current = true;

    const handleCall = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail?.config) return;

      detail.config.clientTools = {
        navigateToPage: ({ page }: { page: string }) => {
          return handleNavigate(page);
        },
        showPropertyDetails: ({ propertyId }: { propertyId: number }) => {
          return handleNavigate(`/property/${propertyId}`);
        },
        openPropertyEditor: ({ propertyId }: { propertyId: number }) => {
          return handleNavigate(`/property/${propertyId}/edit`);
        },
        showPortfolio: () => {
          return handleNavigate("/portfolio");
        },
        showAnalysis: () => {
          return handleNavigate("/analysis");
        },
        showDashboard: () => {
          return handleNavigate("/");
        },
        startGuidedTour: () => {
          return handleStartTour();
        },
        openHelp: () => {
          return handleNavigate("/help");
        },
        showScenarios: () => {
          return handleNavigate("/scenarios");
        },
        openPropertyFinder: () => {
          return handleNavigate("/property-finder");
        },
        showCompanyPage: () => {
          return handleNavigate("/company");
        },
        getCurrentContext: () => {
          return JSON.stringify({
            currentPage: window.location.pathname,
            userName: user?.firstName || "User",
            userRole: user?.role || "partner",
          });
        },
      };
    };

    el.addEventListener("elevenlabs-convai:call", handleCall);
    return () => {
      el.removeEventListener("elevenlabs-convai:call", handleCall);
      toolsRegisteredRef.current = false;
    };
  }, [signedUrl, urlFailed, handleNavigate, handleStartTour, user]);

  if (!enabled || !agentId) return null;
  if (!signedUrl && !urlFailed) return null;

  const dynamicVars = JSON.stringify({
    user_name: user?.firstName || "User",
    user_role: user?.role || "partner",
    current_page: window.location.pathname,
  });

  return (
    <elevenlabs-convai
      ref={widgetRef}
      {...(signedUrl ? { url: signedUrl } : { "agent-id": agentId })}
      dynamic-variables={dynamicVars}
    />
  );
}
