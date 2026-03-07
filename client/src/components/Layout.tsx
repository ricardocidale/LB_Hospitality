/**
 * Layout.tsx — Main application shell used by every authenticated page.
 *
 * Uses shadcn/ui Sidebar components for clean, grouped navigation.
 * The sidebar includes:
 *   • Company logo and name (pulled from per-user branding or global assumptions)
 *   • Quick-search trigger (⌘K command palette)
 *   • Notification center
 *   • Favorites shortcut panel
 *   • Navigation links — dynamically filtered by the user's role
 *   • User card at the bottom showing name, role, and a logout button.
 */
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Building2, Briefcase, Settings2, Menu, X, Shield, LogOut, UserCircle, FolderOpen, SearchCheck, BarChart3, Search, MapPin, FileBarChart, BookOpen, FlaskConical, Bot } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useGlobalAssumptions } from "@/lib/api";
import defaultLogo from "@/assets/logo.png";
import CommandPalette from "@/components/CommandPalette";
import Breadcrumbs from "@/components/Breadcrumbs";
import NotificationCenter from "@/components/NotificationCenter";

import GuidedWalkthrough, { useWalkthroughStore } from "@/components/GuidedWalkthrough";
import ElevenLabsWidget from "@/features/ai-agent/ElevenLabsWidget";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";

import { applyThemeColors, resetThemeColors, type DesignColor } from "@/lib/themeUtils";

type NavLink = { href: string; label: string; icon: any; onClick?: () => void };

function MarcelaWidgetGated() {
  const { data: global } = useGlobalAssumptions();
  const { tourActive, promptVisible } = useWalkthroughStore();
  const [location] = useLocation();
  const onAdminPage = location.startsWith("/admin");
  const enabled = !!(global as any)?.showAiAssistant && !!(global as any)?.marcelaEnabled && !tourActive && !promptVisible && !onAdminPage;
  return <ElevenLabsWidget enabled={enabled} />;
}

interface NavGroupDef {
  label: string;
  items: NavLink[];
}

export default function Layout({ children, darkMode }: { children: React.ReactNode; darkMode?: boolean }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAdmin, isInvestor, hasManagementAccess, logout } = useAuth();
  const { data: global } = useGlobalAssumptions();
  
  const { data: myBranding } = useQuery<{ logoUrl: string | null; themeName: string | null; themeColors: DesignColor[] | null; groupCompanyName: string | null }>({
    queryKey: ["my-branding"],
    queryFn: async () => {
      const res = await fetch("/api/my-branding", { credentials: "include" });
      if (!res.ok) return { logoUrl: null, themeName: null, groupCompanyName: null };
      return res.json();
    },
    enabled: !!user,
  });

  const companyName = myBranding?.groupCompanyName || global?.companyName || "Hospitality Business";
  const companyLogo = myBranding?.logoUrl || global?.companyLogoUrl || global?.companyLogo || defaultLogo;

  useEffect(() => {
    if (myBranding?.themeColors?.length) {
      applyThemeColors(myBranding.themeColors as DesignColor[]);
    } else {
      resetThemeColors();
    }
    return () => { resetThemeColors(); };
  }, [myBranding?.themeName]);

  const sb = (key: string) => (global as any)?.[key] !== false;
  const showAnalysis = sb("sidebarSensitivity") || sb("sidebarFinancing") || sb("sidebarExecutiveSummary") || sb("sidebarCompare") || sb("sidebarTimeline");

  const navGroups: NavGroupDef[] = [
    {
      label: "Home",
      items: [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/portfolio", label: "Properties", icon: Building2 },
        ...(hasManagementAccess ? [{ href: "/company", label: "Management Co.", icon: Briefcase }] : []),
      ],
    },
    {
      label: "Tools",
      items: [
        ...(sb("sidebarPropertyFinder") && hasManagementAccess ? [{ href: "/property-finder", label: "Property Finder", icon: SearchCheck }] : []),
        ...(sb("sidebarResearch") && hasManagementAccess ? [{ href: "/research", label: "Research Center", icon: FlaskConical }] : []),
        ...(showAnalysis && hasManagementAccess ? [{ href: "/analysis", label: "Analysis", icon: BarChart3 }] : []),
        ...(sb("sidebarMapView") && hasManagementAccess ? [{ href: "/map", label: "Map View", icon: MapPin }] : []),
        ...((global as any)?.marcelaEnabled || (global as any)?.showAiAssistant ? [{ href: "/voice", label: "AI Voice Lab", icon: Bot }] : []),
        ...(sb("sidebarExecutiveSummary") && hasManagementAccess ? [{ href: "/executive-summary", label: "Executive Summary", icon: FileBarChart }] : []),
      ].filter(Boolean),
    },
    {
      label: "Settings",
      items: [
        ...(hasManagementAccess ? [{ href: "/settings", label: "Systemwide Assumptions", icon: Settings2 }] : []),
        { href: "/profile", label: "My Profile", icon: UserCircle },
        ...(sb("sidebarScenarios") && hasManagementAccess ? [{ href: "/scenarios", label: "My Scenarios", icon: FolderOpen }] : []),
      ],
    },
    {
      label: "",
      items: [
        ...(sb("sidebarUserManual") ? [{ href: "/help", label: "Help", icon: BookOpen }] : []),
        ...(isAdmin ? [{ href: "/admin", label: "Admin Settings", icon: Shield }] : []),
      ],
    },
  ].filter(g => g.items.length > 0);

  const isActiveLink = (href: string) =>
    location === href ||
    (href === "/portfolio" && location.startsWith("/property/")) ||
    (href !== "/" && location.startsWith(href + "/"));

  const sidebarContent = (
    <>
      <SidebarHeader className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          <img src={companyLogo} alt={companyName} className="w-7 h-7 object-contain" />
          <h1 className="text-sm font-semibold text-foreground truncate">{companyName}</h1>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 pt-1">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label || "misc"} className="py-1">
            {group.label && (
              <SidebarGroupLabel className="text-[11px] font-medium text-muted-foreground px-3 pb-0.5">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isActiveLink(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                        className={cn(
                          "h-8 px-3 rounded-md text-[13px] transition-colors",
                          active ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <Link href={item.href} onClick={() => setSidebarOpen(false)} data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-2 pb-3 pt-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => logout()}
              className="h-8 px-3 rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );

  return (
    <SidebarProvider>
      <div className={cn("min-h-screen font-sans flex w-full overflow-x-hidden", darkMode ? "bg-foreground text-white" : "bg-background text-foreground")}>
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-foreground/20 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar className="border-r border-sidebar-border">
          {sidebarContent}
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0 md:hidden">
          <aside className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-out flex flex-col",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            {sidebarContent}
          </aside>
        </div>

        <main className="relative flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <header className="h-12 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-20">
            <div className="flex items-center gap-2 min-w-0">
              <Button variant="ghost" size="icon" className="flex-shrink-0 md:hidden h-8 w-8" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
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
            </div>
          </header>

          <div className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 md:p-6 lg:p-8 pb-20 md:pb-6 lg:pb-8">
            <div className="w-full max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>

        {(() => {
          const bottomNavItems: { href: string; label: string; icon: any }[] = [
            { href: "/", label: "Dashboard", icon: LayoutDashboard },
            { href: "/portfolio", label: "Properties", icon: Building2 },
            ...(hasManagementAccess ? [{ href: "/company", label: "Company", icon: Briefcase }] : []),
            { href: "/profile", label: "Profile", icon: UserCircle },
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
        <MarcelaWidgetGated />
      </div>
    </SidebarProvider>
  );
}
