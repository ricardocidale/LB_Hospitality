/**
 * Layout.tsx — Main application shell used by every authenticated page.
 *
 * Desktop: static sidebar (always visible, not collapsible).
 * Mobile: Sheet-based drawer opened via hamburger in header, plus bottom nav.
 */
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { IconMenu, IconLogOut, IconDashboard, IconProperties, IconBriefcase, IconSettings, IconShield, IconProfile, IconScenarios, IconPropertyFinder, IconAnalysis, IconMapPin, IconExecutive, IconHelp, IconResearch } from "@/components/icons";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useGlobalAssumptions } from "@/lib/api";
import defaultLogo from "@/assets/logo.png";
import CommandPalette from "@/components/CommandPalette";
import Breadcrumbs from "@/components/Breadcrumbs";
import NotificationCenter from "@/components/NotificationCenter";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import GuidedWalkthrough, { useWalkthroughStore } from "@/components/GuidedWalkthrough";
import ElevenLabsWidget from "@/features/ai-agent/ElevenLabsWidget";
import { RebeccaChatbot } from "@/components/RebeccaChatbot";

import { applyThemeColors, resetThemeColors, type ThemeColor as DesignColor } from "@/lib/theme";

type NavLink = { href: string; label: string; icon: any; onClick?: () => void };

function MarcelaWidgetGated() {
  const { data: global } = useGlobalAssumptions();
  const { tourActive, promptVisible } = useWalkthroughStore();
  const [location] = useLocation();
  const onAdminPage = location.startsWith("/admin");
  const rebeccaActive = !!(global as any)?.rebeccaEnabled;
  const enabled = !!(global as any)?.showAiAssistant && !!(global as any)?.marcelaEnabled && !rebeccaActive && !tourActive && !promptVisible && !onAdminPage;
  return <ElevenLabsWidget enabled={enabled} />;
}

interface NavGroupDef {
  label: string;
  items: NavLink[];
}

function SidebarNav({ groups, isActiveLink, onNavigate }: { groups: NavGroupDef[]; isActiveLink: (href: string) => boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto px-2 pt-1 space-y-1">
      {groups.filter(g => g.items.length > 0).map((group) => (
        <div key={group.label || "misc"} className="py-1">
          {group.label && (
            <p className="text-[11px] font-medium text-muted-foreground px-3 pb-1 pt-2">{group.label}</p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActiveLink(item.href);
              const isAction = item.href.startsWith("#");
              return (
                <li key={item.href}>
                  {isAction ? (
                    <button
                      onClick={() => { item.onClick?.(); onNavigate?.(); }}
                      className={cn(
                        "flex items-center gap-2.5 w-full h-8 px-3 rounded-md text-[13px] transition-colors",
                        active ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                      data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  ) : (
                    <Link href={item.href} onClick={onNavigate}>
                      <span
                        className={cn(
                          "flex items-center gap-2.5 w-full h-8 px-3 rounded-md text-[13px] transition-colors",
                          active ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                        data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function Layout({ children, darkMode }: { children: React.ReactNode; darkMode?: boolean }) {
  const [location] = useLocation();
  const { user, isAdmin, isInvestor, hasManagementAccess, logout } = useAuth();
  const { data: global } = useGlobalAssumptions();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: myBranding } = useQuery<{ logoUrl: string | null; themeName: string | null; themeColors: DesignColor[] | null; groupCompanyName: string | null }>({
    queryKey: ["my-branding"],
    queryFn: async () => {
      const res = await fetch("/api/my-branding", { credentials: "include" });
      if (!res.ok) return { logoUrl: null, themeName: null, groupCompanyName: null };
      return res.json();
    },
    enabled: !!user,
  });

  const companyName = global?.companyName || "Hospitality Business";
  const companyLogo = global?.companyLogoUrl || global?.companyLogo || defaultLogo;

  useEffect(() => {
    if (myBranding?.themeColors?.length) {
      applyThemeColors(myBranding.themeColors as DesignColor[]);
    } else {
      resetThemeColors();
    }
    return () => { resetThemeColors(); };
  }, [myBranding?.themeName, myBranding?.themeColors]);

  useEffect(() => { setMobileOpen(false); }, [location]);

  const sb = (key: string) => (global as any)?.[key] !== false;
  const showAnalysis = sb("sidebarSensitivity") || sb("sidebarFinancing") || sb("sidebarExecutiveSummary") || sb("sidebarCompare") || sb("sidebarTimeline");

  const navGroups: NavGroupDef[] = [
    {
      label: "Home",
      items: [
        { href: "/", label: "Dashboard", icon: IconDashboard },
        { href: "/portfolio", label: "Properties", icon: IconProperties },
        ...(hasManagementAccess ? [{ href: "/company", label: "Management Co.", icon: IconBriefcase }] : []),
      ],
    },
    {
      label: "Insights",
      items: [
        ...(sb("sidebarExecutiveSummary") && hasManagementAccess ? [{ href: "/executive-summary", label: "Executive Summary", icon: IconExecutive }] : []),
      ].filter(Boolean),
    },
    {
      label: "Tools",
      items: [
        ...(showAnalysis && hasManagementAccess ? [{ href: "/analysis", label: "Simulation", icon: IconAnalysis }] : []),
        ...(sb("sidebarPropertyFinder") && hasManagementAccess ? [{ href: "/property-finder", label: "Property Finder", icon: IconPropertyFinder }] : []),
        ...(sb("sidebarMapView") && hasManagementAccess ? [{ href: "/map", label: "Map View", icon: IconMapPin }] : []),
      ].filter(Boolean),
    },
    {
      label: "Settings",
      items: [
        { href: "/profile", label: "My Profile", icon: IconProfile },
        ...(sb("sidebarScenarios") && hasManagementAccess ? [{ href: "/scenarios", label: "My Scenarios", icon: IconScenarios }] : []),
        ...(hasManagementAccess ? [{ href: "/settings", label: "General Config", icon: IconSettings }] : []),
      ],
    },
    {
      label: "",
      items: [
        ...(sb("sidebarUserManual") ? [{ href: "/help", label: "Help", icon: IconHelp }] : []),
        ...(isAdmin ? [{ href: "/admin", label: "Admin Settings", icon: IconShield }] : []),
      ],
    },
  ].filter(g => g.items.length > 0);

  const isActiveLink = (href: string) =>
    location === href ||
    (href === "/portfolio" && location.startsWith("/property/")) ||
    (href !== "/" && location.startsWith(href + "/"));

  const sidebarHeader = (
    <div className="flex items-center gap-2.5 px-4 pt-4 pb-2">
      <img src={companyLogo} alt={companyName} className="w-7 h-7 object-contain" />
      <h1 className="text-sm font-semibold text-foreground truncate">{companyName}</h1>
    </div>
  );

  const sidebarFooter = (
    <div className="px-2 pb-3 pt-1">
      <button
        onClick={() => { logout(); setMobileOpen(false); }}
        className="flex items-center gap-2.5 w-full h-8 px-3 rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        data-testid="button-logout"
      >
        <IconLogOut className="w-4 h-4 shrink-0" />
        <span>Sign Out</span>
      </button>
    </div>
  );

  return (
    <div className="flex min-h-svh w-full">
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border h-svh sticky top-0">
        {sidebarHeader}
        <SidebarNav groups={navGroups} isActiveLink={isActiveLink} />
        {sidebarFooter}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar text-sidebar-foreground">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          {sidebarHeader}
          <SidebarNav groups={navGroups} isActiveLink={isActiveLink} onNavigate={() => setMobileOpen(false)} />
          {sidebarFooter}
        </SheetContent>
      </Sheet>

      <main className={cn("relative flex-1 flex flex-col min-w-0 overflow-hidden", darkMode ? "bg-foreground text-white" : "bg-background text-foreground")}>
        <header className="h-12 shrink-0 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={() => setMobileOpen(true)}
              data-testid="button-mobile-menu"
            >
              <IconMenu className="w-5 h-5" />
            </Button>
            <Breadcrumbs />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
                document.dispatchEvent(event);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-muted-foreground hover:text-muted-foreground text-xs transition-colors border border-border"
              data-testid="button-search"
            >
              <Search className="w-3.5 h-3.5" />
              <kbd className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground font-mono">⌘K</kbd>
            </button>
            <NotificationCenter />
            {!!(global as any)?.rebeccaEnabled && (
              <RebeccaChatbot displayName={(global as any)?.rebeccaDisplayName || "Rebecca"} />
            )}
            <ErrorBoundary><MarcelaWidgetGated /></ErrorBoundary>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6 lg:px-8 lg:py-6 pb-20 md:pb-6 lg:pb-6">
          {children}
        </div>
      </main>

      {(() => {
        const bottomNavItems: { href: string; label: string; icon: any }[] = [
          { href: "/", label: "Dashboard", icon: IconDashboard },
          { href: "/portfolio", label: "Properties", icon: IconProperties },
          ...(hasManagementAccess ? [{ href: "/company", label: "Company", icon: IconBriefcase }] : []),
          { href: "/profile", label: "Profile", icon: IconProfile },
        ];
        return (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40" data-testid="mobile-bottom-nav">
            <div className="absolute inset-0 bg-sidebar" />
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-sidebar-border" />
            <div className="relative flex items-center justify-around px-1 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
              {bottomNavItems.map((item) => {
                const isActive = location === item.href ||
                  (item.href === "/portfolio" && location.startsWith("/property/")) ||
                  (item.href !== "/" && location.startsWith(item.href + "/"));
                return (
                  <Link key={item.href} href={item.href}>
                    <button className="flex flex-col items-center gap-0.5 px-3 py-1.5 min-w-[3.5rem]" data-testid={`bottom-nav-${item.label.toLowerCase()}`}>
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200",
                        isActive ? "bg-muted" : ""
                      )}>
                        <item.icon className={cn("w-[18px] h-[18px]", isActive ? "text-foreground" : "text-muted-foreground")} />
                      </div>
                      <span className={cn("text-[10px] leading-tight", isActive ? "text-foreground font-medium" : "text-muted-foreground")}>{item.label}</span>
                    </button>
                  </Link>
                );
              })}
            </div>
          </nav>
        );
      })()}

      <CommandPalette />
      <GuidedWalkthrough />
    </div>
  );
}
