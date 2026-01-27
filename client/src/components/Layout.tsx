import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Building2, Briefcase, Settings2, Menu, X, BookOpen, FileText, Users, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/logo.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/portfolio", label: "Properties", icon: Building2 },
    { href: "/company", label: "Management Co.", icon: Briefcase },
    { href: "/settings", label: "Global Assumptions", icon: Settings2 },
    { href: "/methodology", label: "Methodology", icon: FileText },
    { href: "/research", label: "Research", icon: BookOpen },
    ...(isAdmin ? [{ href: "/admin/users", label: "User Management", icon: Users }] : []),
  ];

  return (
    <div className="min-h-screen bg-background font-sans text-foreground flex">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 transition-all duration-500 ease-out lg:translate-x-0 flex flex-col overflow-hidden",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Liquid Glass Background with Edge Sheen */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2d4a5e] via-[#3d5a6a] to-[#4a3d5e]" />
        {/* Glossy Edge Highlight - Right Side */}
        <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-gradient-to-b from-white/30 via-white/10 to-white/20" />
        {/* Top Edge Sheen */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        {/* Floating Color Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-12 -left-12 w-56 h-56 rounded-full bg-[#9FBCA4]/20 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/3 -right-8 w-44 h-44 rounded-full bg-[#60A5FA]/15 blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="absolute bottom-1/4 left-1/3 w-52 h-52 rounded-full bg-[#A78BFA]/15 blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        </div>
        
        <div className="relative flex flex-col h-full">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-[#9FBCA4]/30 rounded-xl blur-md" />
                <img src={logo} alt="L+B Hospitality" className="relative w-10 h-10 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white" style={{ fontFamily: "'Nunito', sans-serif" }}>
                  L+B <span style={{ color: '#9FBCA4' }}>Hospitality</span>
                </h1>
                <p className="text-xs text-white/50 uppercase tracking-widest">Analytics</p>
              </div>
            </div>
          </div>

          <div className="mx-4 mb-2">
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          <nav className="flex-1 p-4 pt-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              // Check for exact match or if we're on a sub-route
              const isActive = location === item.href || 
                (item.href === "/portfolio" && location.startsWith("/property")) ||
                (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                  <div className={cn(
                    "group relative flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-300 ease-out rounded-2xl cursor-pointer overflow-hidden",
                    isActive 
                      ? "text-white" 
                      : "text-white/60 hover:text-white"
                  )}>
                    {/* Frosted Glass Background for Active */}
                    {isActive && (
                      <>
                        <div className="absolute inset-0 bg-white/12 backdrop-blur-xl rounded-2xl" />
                        <div className="absolute inset-0 rounded-2xl border border-white/20" />
                        {/* Top edge sheen */}
                        <div className="absolute top-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                        {/* Subtle glow */}
                        <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_4px_16px_rgba(0,0,0,0.2)]" />
                      </>
                    )}
                    {/* Hover state background */}
                    {!isActive && (
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all duration-300 rounded-2xl" />
                    )}
                    <div className={cn(
                      "relative w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300",
                      isActive 
                        ? "bg-gradient-to-br from-[#9FBCA4] to-[#257D41] shadow-[0_0_16px_rgba(159,188,164,0.5)]" 
                        : "bg-white/5 group-hover:bg-white/10"
                    )}>
                      <item.icon className={cn("w-4 h-4 transition-all duration-300", isActive ? "text-white" : "text-white/60 group-hover:text-white")} />
                    </div>
                    <span className="relative">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 space-y-3">
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            <button 
              className="group relative w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/60 hover:text-white rounded-2xl transition-all duration-300 overflow-hidden"
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white font-bold text-sm shadow-[0_0_16px_rgba(99,102,241,0.4)]">
                  {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.name || user?.email || "User"}</p>
                  <p className="text-xs text-white/50 capitalize">{user?.role || "User"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden h-16 border-b bg-card flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <img src={logo} alt="L+B Hospitality" className="w-8 h-8 object-contain" />
            <span className="font-extrabold text-lg" style={{ fontFamily: "'Nunito', sans-serif" }}>L+B <span style={{ color: '#9FBCA4' }}>Hospitality</span></span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </header>

        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
