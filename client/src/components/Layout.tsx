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
        "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-300 lg:translate-x-0 flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="L+B Hospitality" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-xl font-extrabold text-white" style={{ fontFamily: "'Nunito', sans-serif" }}>
                L+B <span style={{ color: '#9FBCA4' }}>Hospitality</span>
              </h1>
              <p className="text-xs text-sidebar-foreground/60 uppercase tracking-widest">Analytics</p>
            </div>
          </div>
        </div>

        <div className="mx-4 mb-2">
          <div className="h-px bg-[#9FBCA4]/40" />
        </div>

        <nav className="flex-1 p-4 pt-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                <div className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg cursor-pointer",
                  isActive 
                    ? "bg-[#9FBCA4]/20 text-white border-l-4 border-[#9FBCA4] ml-0 pl-3" 
                    : "text-sidebar-foreground/70 hover:bg-[#9FBCA4]/10 hover:text-white border-l-4 border-transparent"
                )}>
                  <item.icon className={cn("w-5 h-5", isActive ? "text-[#9FBCA4]" : "")} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#9FBCA4]/20 space-y-3">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 px-4 py-3 text-sm font-medium text-sidebar-foreground/70 hover:bg-[#9FBCA4]/10 hover:text-white"
            onClick={() => logout()}
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
          
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-[#9FBCA4]/10">
            <div className="w-9 h-9 rounded-full bg-[#9FBCA4] flex items-center justify-center text-white font-bold text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || user?.email || "User"}</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{user?.role || "User"}</p>
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
