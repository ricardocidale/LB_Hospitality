import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Building2, Briefcase, Settings2, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.jpeg";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/portfolio", label: "Properties", icon: Building2 },
    { href: "/company", label: "Management Co.", icon: Briefcase },
    { href: "/settings", label: "Model Assumptions", icon: Settings2 },
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
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <img src={logo} alt="L+B Hospitality" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-xl font-extrabold text-white" style={{ fontFamily: "'Nunito', sans-serif" }}>
                L+B <span className="text-sidebar-primary">Hospitality</span>
              </h1>
              <p className="text-xs text-sidebar-foreground/60 uppercase tracking-widest">Investor Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                <div className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg cursor-pointer",
                  isActive 
                    ? "bg-sidebar-accent text-white" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                )}>
                  <item.icon className={cn("w-5 h-5", isActive ? "text-sidebar-primary" : "")} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center text-white font-bold text-sm">
              LB
            </div>
            <div>
              <p className="text-sm font-medium text-white">Admin</p>
              <p className="text-xs text-sidebar-foreground/60">Managing Partner</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden h-16 border-b bg-card flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <img src={logo} alt="L+B Hospitality" className="w-8 h-8 object-contain" />
            <span className="font-extrabold text-lg" style={{ fontFamily: "'Nunito', sans-serif" }}>L+B Hospitality</span>
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
