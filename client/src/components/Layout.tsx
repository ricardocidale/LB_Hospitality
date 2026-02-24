/**
 * Layout.tsx — Main application shell used by every authenticated page.
 *
 * Provides a persistent sidebar (desktop) / bottom-nav + hamburger drawer (mobile)
 * that wraps page content. The sidebar includes:
 *   • Company logo and name (pulled from per-user branding or global assumptions)
 *   • Quick-search trigger (⌘K command palette)
 *   • Notification center
 *   • Favorites shortcut panel
 *   • Navigation links — dynamically filtered by the user's role:
 *       – "investor" users see a reduced set (Dashboard, Properties, Profile, Help)
 *       – "admin" users see everything, including the Admin Settings link
 *       – Other roles (partner, checker, staff) get "management access" to the
 *         Company, Analysis, Settings, Scenarios, and Property Finder sections
 *   • Sidebar visibility of individual items can also be toggled by admin via
 *     globalAssumptions flags (e.g. sidebarSensitivity, sidebarFinancing).
 *   • User card at the bottom showing name, role, and a logout button.
 *
 * The component also mounts globally-available overlays:
 *   – CommandPalette (⌘K search)
 *   – GuidedWalkthrough (first-time tour)
 *   – AIChatWidget (floating AI assistant, if enabled)
 *
 * Theming: the Layout reads the user-group "themeName" from /api/my-branding
 * and applies the matching CSS class to <html> so the entire app switches theme.
 */
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Building2, Briefcase, Settings2, Menu, X, FileText, Shield, LogOut, UserCircle, FolderOpen, SearchCheck, BarChart3, Calculator, ClipboardCheck, Search, MapPin, FileBarChart, ChevronDown, BookOpen, MoreHorizontal } from "lucide-react";
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
import GuidedWalkthrough from "@/components/GuidedWalkthrough";
import AIChatWidget from "@/components/AIChatWidget";

const THEME_CSS_CLASSES: Record<string, string> = {
  "Fluid Glass": "",
  "Indigo Blue": "theme-indigo-blue",
};

type NavLink = { href: string; label: string; icon: any; onClick?: () => void };
type NavDivider = { type: "divider" };
type NavGroup = { type: "group"; label: string; icon: any; children: NavLink[] };
type NavItem = NavLink | NavDivider | NavGroup;

export default function Layout({ children, darkMode }: { children: React.ReactNode; darkMode?: boolean }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const { user, isAdmin, isInvestor, hasManagementAccess, logout } = useAuth();
  const { data: global } = useGlobalAssumptions();
  
  const { data: myBranding } = useQuery<{ logoUrl: string | null; themeName: string | null; groupCompanyName: string | null }>({
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
    const root = document.documentElement;
    const allThemeClasses = Object.values(THEME_CSS_CLASSES).filter(Boolean);
    root.classList.remove(...allThemeClasses);
    const themeName = myBranding?.themeName;
    if (themeName && THEME_CSS_CLASSES[themeName]) {
      root.classList.add(THEME_CSS_CLASSES[themeName]);
    }
    return () => { root.classList.remove(...allThemeClasses); };
  }, [myBranding?.themeName]);

  // sb ("sidebar boolean") — checks whether a sidebar item is visible.
  // Admins always see everything; other users only see items whose
  // globalAssumptions flag hasn't been explicitly set to false.
  const sb = (key: string) => isAdmin || (global as any)?.[key] !== false;
  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  // The Analysis link only appears if at least one of its child features is enabled.
  const showAnalysis = sb("sidebarSensitivity") || sb("sidebarFinancing") || sb("sidebarExecutiveSummary") || sb("sidebarCompare") || sb("sidebarTimeline");

  const navItems: NavItem[] = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/portfolio", label: "Properties", icon: Building2 },
    ...(hasManagementAccess ? [{ href: "/company", label: "Management Co.", icon: Briefcase }] : []),
    { type: "divider" as const },
    ...(sb("sidebarPropertyFinder") && hasManagementAccess ? [{ href: "/property-finder", label: "Property Finder", icon: SearchCheck }] : []),
    ...(showAnalysis && hasManagementAccess ? [{ href: "/analysis", label: "Analysis", icon: BarChart3 }] : []),
    { type: "divider" as const },
    ...(hasManagementAccess ? [{ href: "/settings", label: "Systemwide Assumptions", icon: Settings2 }] : []),
    ...(hasManagementAccess ? [{ type: "divider" as const }] : []),
    { href: "/profile", label: "My Profile", icon: UserCircle },
    ...(sb("sidebarScenarios") && hasManagementAccess ? [{ href: "/scenarios", label: "My Scenarios", icon: FolderOpen }] : []),
    { type: "divider" as const },
    { href: "/help", label: "Help", icon: BookOpen },
    ...(isAdmin ? [
      { href: "/admin", label: "Admin Settings", icon: Shield },
    ] : []),
  ];

  return (
    <div className={cn("min-h-screen font-sans flex", darkMode ? "bg-[#0a0a0f] text-white" : "bg-background text-foreground")}>
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed md:sticky top-0 left-0 z-50 h-screen w-64 md:w-56 lg:w-64 shrink-0 transition-all duration-500 ease-out md:translate-x-0 flex flex-col overflow-hidden",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Deep Black Glass Background */}
        <div className="absolute inset-0 bg-[#0a0a0f]" />
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-black/20" />
        {/* Glossy Edge Highlight - Right Side */}
        <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-gradient-to-b from-primary/40 via-white/10 to-primary/30" />
        {/* Top Edge Sheen */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        {/* Floating Color Orbs - More visible on black */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-primary/20 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/3 -right-16 w-56 h-56 rounded-full bg-secondary/25 blur-[80px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/15 blur-[100px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-secondary/20 blur-[80px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '0.5s' }} />
        </div>
        {/* Inner glow effect */}
        <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(159,188,164,0.08)]" />
        
        <div className="relative flex flex-col h-full">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 rounded-xl blur-md" />
                <img src={companyLogo} alt={companyName} className="relative w-10 h-10 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold" style={{ fontFamily: "'Nunito', sans-serif" }}>
                  <span className="text-white">{companyName.split(' ')[0]}</span>{' '}
                  <span className="text-primary">{companyName.split(' ').slice(1).join(' ')}</span>
                </h1>
                <p className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255, 249, 245, 0.5)' }}>Business Simulation</p>
              </div>
            </div>
          </div>

          <div className="mx-4 mb-1 flex items-center gap-2">
            <button
              onClick={() => {
                const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
                document.dispatchEvent(event);
              }}
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sidebar-foreground/40 hover:text-sidebar-foreground/60 text-xs transition-all duration-300 border border-white/10"
              data-testid="button-search"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search...</span>
              <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-sidebar-foreground/30 font-mono">⌘K</kbd>
            </button>
            <div className="relative">
              <NotificationCenter />
            </div>
          </div>

          <div className="mx-4 my-2">
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          <div className="px-4 pt-1">
            <FavoritesSidebar />
          </div>

          <nav className="flex-1 p-4 pt-2 space-y-1 overflow-y-auto">
            {/* Filter out orphan dividers: strip leading/trailing dividers, consecutive
                dividers, and dividers that would appear at the very end of the list.
                This avoids ugly visual separators when role-based filtering hides sections. */}
            {navItems.filter((item, index, arr) => {
              if ('type' in item && item.type === 'divider') {
                if (index === 0 || index === arr.length - 1) return false;
                const prev = arr[index - 1];
                if ('type' in prev && prev.type === 'divider') return false;
                const nextNonDivider = arr.slice(index + 1).find(i => !('type' in i && i.type === 'divider'));
                if (!nextNonDivider) return false;
              }
              return true;
            }).map((item, index) => {
              if ('type' in item && item.type === 'divider') {
                return (
                  <div key={`divider-${index}`} className="my-3 mx-2">
                    <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </div>
                );
              }

              if ('type' in item && item.type === 'group') {
                const group = item as NavGroup;
                const isExpanded = expandedGroups[group.label] ?? false;
                const hasActiveChild = group.children.some(child =>
                  location === child.href || (child.href !== "/" && location.startsWith(child.href + "/"))
                );
                const autoExpand = isExpanded || hasActiveChild;

                return (
                  <div key={group.label}>
                    <button
                      onClick={() => toggleGroup(group.label)}
                      className={cn(
                        "group relative w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-300 ease-out rounded-2xl cursor-pointer overflow-hidden",
                        hasActiveChild ? "text-white" : "text-sidebar-foreground/60 hover:text-white"
                      )}
                      data-testid={`button-nav-group-${group.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {!hasActiveChild && (
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all duration-300 rounded-2xl" />
                      )}
                      <div className={cn(
                        "relative w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300",
                        hasActiveChild
                          ? "bg-gradient-to-br from-primary to-secondary shadow-[0_0_16px_rgba(159,188,164,0.5)]"
                          : "bg-white/5 group-hover:bg-white/10"
                      )}>
                        <group.icon className={cn("w-4 h-4 transition-all duration-300", hasActiveChild ? "text-white" : "text-sidebar-foreground/60 group-hover:text-white")} />
                      </div>
                      <span className="relative flex-1 text-left">{group.label}</span>
                      <ChevronDown className={cn(
                        "relative w-3.5 h-3.5 transition-transform duration-300",
                        autoExpand ? "rotate-180" : ""
                      )} />
                    </button>
                    <div className={cn(
                      "overflow-hidden transition-all duration-300 ease-out",
                      autoExpand ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                    )}>
                      {group.children.map(child => {
                        const isChildActive = !child.onClick && (location === child.href ||
                          (child.href !== "/" && location.startsWith(child.href + "/")));
                        const childContent = (
                          <div className={cn(
                            "group relative flex items-center gap-3 pl-8 pr-4 py-2.5 text-sm font-medium transition-all duration-300 ease-out rounded-2xl cursor-pointer overflow-hidden ml-4",
                            isChildActive ? "text-white" : "text-sidebar-foreground/50 hover:text-white"
                          )}>
                            {isChildActive && (
                              <>
                                <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-2xl" />
                                <div className="absolute inset-0 rounded-2xl border border-white/15" />
                              </>
                            )}
                            {!isChildActive && (
                              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all duration-300 rounded-2xl" />
                            )}
                            <child.icon className={cn("relative w-3.5 h-3.5 transition-all duration-300", isChildActive ? "text-primary" : "text-sidebar-foreground/40 group-hover:text-white")} />
                            <span className="relative">{child.label}</span>
                          </div>
                        );
                        if (child.onClick) {
                          return (
                            <button key={child.href} onClick={() => { child.onClick!(); setSidebarOpen(false); }} className="w-full text-left" data-testid={`nav-${child.label.toLowerCase().replace(/\s+/g, '-')}`}>
                              {childContent}
                            </button>
                          );
                        }
                        return (
                          <Link key={child.href} href={child.href} onClick={() => setSidebarOpen(false)}>
                            {childContent}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              
              const navLink = item as NavLink;
              const isActive = location === navLink.href || 
                (navLink.href === "/portfolio" && location.startsWith("/property/")) ||
                (navLink.href !== "/" && location.startsWith(navLink.href + "/"));
              return (
                <Link key={navLink.href} href={navLink.href!} onClick={() => setSidebarOpen(false)}>
                  <div className={cn(
                    "group relative flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-300 ease-out rounded-2xl cursor-pointer overflow-hidden",
                    isActive 
                      ? "text-white" 
                      : "text-sidebar-foreground/60 hover:text-white"
                  )}>
                    {isActive && (
                      <>
                        <div className="absolute inset-0 bg-white/12 backdrop-blur-xl rounded-2xl" />
                        <div className="absolute inset-0 rounded-2xl border border-white/20" />
                        <div className="absolute top-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                        <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_4px_16px_rgba(0,0,0,0.2)]" />
                      </>
                    )}
                    {!isActive && (
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all duration-300 rounded-2xl" />
                    )}
                    <div className={cn(
                      "relative w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300",
                      isActive 
                        ? "bg-gradient-to-br from-primary to-secondary shadow-[0_0_16px_rgba(159,188,164,0.5)]" 
                        : "bg-white/5 group-hover:bg-white/10"
                    )}>
                      <navLink.icon className={cn("w-4 h-4 transition-all duration-300", isActive ? "text-white" : "text-sidebar-foreground/60 group-hover:text-white")} />
                    </div>
                    <span className="relative">{navLink.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 space-y-3">
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            <button 
              className="group relative w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-sidebar-foreground/60 hover:text-white rounded-2xl transition-all duration-300 overflow-hidden"
              onClick={() => logout()}
              data-testid="button-logout"
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all duration-300 rounded-2xl" />
              <div className="relative w-8 h-8 rounded-xl bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-all duration-300">
                <LogOut className="w-4 h-4 transition-all duration-300" />
              </div>
              <span className="relative">Sign Out</span>
            </button>
            
            {/* Floating User Card with Liquid Glass Effect */}
            <div className="relative overflow-hidden rounded-2xl">
              {/* Glass Background */}
              <div className="absolute inset-0 bg-white/8 backdrop-blur-xl" />
              {/* Top Edge Sheen */}
              <div className="absolute top-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              {/* Border */}
              <div className="absolute inset-0 rounded-2xl border border-white/15" />
              {/* Content */}
              <div className="relative flex items-center gap-3 px-3 py-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sidebar-foreground font-bold text-sm shadow-[0_0_16px_rgba(159,188,164,0.4)]">
                  {user?.firstName ? user.firstName.charAt(0).toUpperCase() : user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name || user?.email || "User"}</p>
                  <p className="text-xs text-sidebar-foreground/50 capitalize">{user?.role || "User"}</p>
                </div>
              </div>
            </div>

            <p className="text-center text-[9px] tracking-wider text-sidebar-foreground/15 pt-2 pb-1">
              powered by Norfolk AI
            </p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <header className="md:hidden h-14 border-b border-white/10 bg-[#0a0a0f] flex items-center justify-between px-3 sticky top-0 z-30">
          <div className="flex items-center gap-2 min-w-0">
            <img src={companyLogo} alt={companyName} className="w-7 h-7 object-contain flex-shrink-0" />
            <span className="font-extrabold text-base truncate" style={{ fontFamily: "'Nunito', sans-serif" }}>
              <span className="text-white">{companyName.split(' ')[0]}</span>{' '}
              <span className="text-primary">{companyName.split(' ').slice(1).join(' ')}</span>
            </span>
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
            <div className="absolute inset-0 bg-[#0a0a0f]" />
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
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
                        isActive ? "bg-primary/20" : ""
                      )}>
                        <item.icon className={cn("w-[18px] h-[18px]", isActive ? "text-primary" : "text-white/50")} />
                      </div>
                      <span className={cn("text-[10px] leading-tight", isActive ? "text-primary font-medium" : "text-white/40")}>{item.label}</span>
                    </button>
                  </Link>
                );
              })}
              <button
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 min-w-[3.5rem]"
                onClick={() => setSidebarOpen(true)}
                data-testid="bottom-nav-more"
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center">
                  <MoreHorizontal className="w-[18px] h-[18px] text-white/50" />
                </div>
                <span className="text-[10px] leading-tight text-white/40">More</span>
              </button>
            </div>
          </nav>
        );
      })()}

      <CommandPalette />
      <GuidedWalkthrough />
      <AIChatWidget enabled={!!(global as any)?.showAiAssistant} />
    </div>
  );
}
