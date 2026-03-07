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
import { LayoutDashboard, Building2, Briefcase, Settings2, Menu, X, Shield, LogOut, UserCircle, FolderOpen, SearchCheck, BarChart3, Search, MapPin, FileBarChart, BookOpen, FlaskConical, MoreHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useGlobalAssumptions } from "@/lib/api";
import defaultLogo from "@/assets/logo.png";
import CommandPalette from "@/components/CommandPalette";
import Breadcrumbs from "@/components/Breadcrumbs";
import NotificationCenter from "@/components/NotificationCenter";
import FavoritesSidebar from "@/components/Favorites";
import GuidedWalkthrough, { useWalkthroughStore } from "@/components/GuidedWalkthrough";
import ElevenLabsWidget from "@/components/ElevenLabsWidget";
import { UserAvatar } from "@/components/ui/user-avatar";
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
  SidebarSeparator,
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
      <SidebarHeader className="p-4 pb-3">
        <div className="flex items-center gap-3">
          <img src={companyLogo} alt={companyName} className="w-8 h-8 object-contain rounded" />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-sidebar-foreground truncate">{companyName}</h1>
            <p className="text-[11px] text-sidebar-foreground/50">Business Simulation</p>
          </div>
        </div>
      </SidebarHeader>

      <div className="mx-3 mb-2 flex items-center gap-2">
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
            document.dispatchEvent(event);
          }}
          className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sidebar-accent text-sidebar-foreground/40 hover:text-sidebar-foreground/60 text-xs transition-colors border border-sidebar-border"
          data-testid="button-search"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search...</span>
          <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-sidebar-border text-sidebar-foreground/40 font-mono">⌘K</kbd>
        </button>
        <div className="relative">
          <NotificationCenter />
        </div>
      </div>

      <SidebarSeparator className="mx-3" />

      <div className="px-3 pt-2">
        <FavoritesSidebar />
      </div>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label || "misc"}>
            {group.label && (
              <SidebarGroupLabel className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/40 px-3">
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
                          "px-3 py-2 rounded-lg transition-colors",
                          active ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
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

      <SidebarFooter className="p-3 space-y-2">
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => logout()}
              className="px-3 py-2 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent p-3">
          <div className="flex items-center gap-3">
            <UserAvatar firstName={user?.firstName} lastName={user?.lastName} name={user?.name} email={user?.email} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name || user?.email || "User"}</p>
              <p className="text-xs text-sidebar-foreground/50 capitalize">{user?.role || "User"}</p>
            </div>
          </div>
        </div>

        <p className="text-center text-[9px] tracking-wider text-sidebar-foreground/25 pt-1 pb-0.5">
          powered by Norfolk AI
        </p>
      </SidebarFooter>
    </>
  );

  return (
    <SidebarProvider>
      <div className={cn("min-h-screen font-sans flex w-full", darkMode ? "bg-[#0a0a0f] text-white" : "bg-background text-foreground")}>
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
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

        <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <header className="md:hidden h-14 border-b border-sidebar-border bg-sidebar flex items-center justify-between px-3 sticky top-0 z-30">
            <div className="flex items-center gap-2 min-w-0">
              <img src={companyLogo} alt={companyName} className="w-7 h-7 object-contain flex-shrink-0 rounded" />
              <span className="font-semibold text-sm text-sidebar-foreground truncate">{companyName}</span>
            </div>
            <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </header>

          <div className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 md:p-6 lg:p-8 pb-20 md:pb-6 lg:pb-8">
            <div className="w-full max-w-7xl mx-auto">
              <div className="mb-3 md:mb-4">
                <Breadcrumbs />
              </div>
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
                          isActive ? "bg-sidebar-accent" : ""
                        )}>
                          <item.icon className={cn("w-[18px] h-[18px]", isActive ? "text-sidebar-foreground" : "text-sidebar-foreground/40")} />
                        </div>
                        <span className={cn("text-[10px] leading-tight", isActive ? "text-sidebar-foreground font-medium" : "text-sidebar-foreground/40")}>{item.label}</span>
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
