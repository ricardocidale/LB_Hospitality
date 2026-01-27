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
        "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 transition-transform duration-300 lg:translate-x-0 flex flex-col overflow-hidden",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Liquid Glass Background - Matching Main Content */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2d4a5e] via-[#3d5a6a] to-[#4a3d5e]" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-48 h-48 rounded-full bg-[#9FBCA4]/25 blur-3xl" />
          <div className="absolute top-1/3 right-0 w-40 h-40 rounded-full bg-[#60A5FA]/20 blur-3xl" />
          <div className="absolute bottom-1/4 left-1/2 w-48 h-48 rounded-full bg-[#A78BFA]/20 blur-3xl" />
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

          <nav className="flex-1 p-4 pt-2 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-300 rounded-xl cursor-pointer",
                    isActive 
                      ? "bg-white/10 backdrop-blur-xl text-white border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.15)]" 
                      : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"
                  )}>
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                      isActive 
                        ? "bg-gradient-to-br from-[#9FBCA4] to-[#257D41] shadow-[0_0_12px_rgba(159,188,164,0.4)]" 
                        : "bg-white/5"
                    )}>
                      <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-white/60")} />
                    </div>
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 space-y-3">
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 px-4 py-3 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white rounded-xl border border-transparent hover:border-white/10 transition-all duration-300"
              onClick={() => logout()}
              data-testid="button-logout"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </div>
              Sign Out
            </Button>
            
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white font-bold text-sm shadow-[0_0_12px_rgba(99,102,241,0.4)]">
                {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || user?.email || "User"}</p>
                <p className="text-xs text-white/50 capitalize">{user?.role || "User"}</p>
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
