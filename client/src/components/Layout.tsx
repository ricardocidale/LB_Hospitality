import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Building2, Briefcase, Settings2, Menu, X, PieChart } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/portfolio", label: "Properties", icon: Building2 },
    { href: "/company", label: "Management Co.", icon: Briefcase },
    { href: "/financials", label: "Financials", icon: PieChart },
    { href: "/settings", label: "Model Inputs", icon: Settings2 },
  ];

  return (
    <div className="min-h-screen mesh-bg font-sans text-foreground selection:bg-primary/20">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen w-72 transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <GlassCard variant="sidebar" className="h-full rounded-none border-y-0 border-l-0">
          <div className="p-8 border-b border-white/20">
            <h1 className="font-serif text-3xl tracking-wide text-primary">
              L+B <span className="text-foreground font-light">Co.</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-2 uppercase tracking-widest font-medium">Financial Intelligence</p>
          </div>

          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <a className={cn(
                    "flex items-center gap-4 px-6 py-4 text-sm font-medium transition-all duration-300 rounded-xl group relative overflow-hidden",
                    isActive 
                      ? "text-primary shadow-sm bg-white/50" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/30"
                  )}>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                    )}
                    <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                    {item.label}
                  </a>
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-8 border-t border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-serif font-bold shadow-lg">
                LB
              </div>
              <div>
                <p className="text-sm font-bold">Admin User</p>
                <p className="text-xs text-muted-foreground">Managing Partner</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden h-20 flex items-center justify-between px-6 sticky top-0 z-30 bg-white/20 backdrop-blur-md border-b border-white/20">
          <span className="font-serif font-bold text-xl text-primary">L+B Hospitality</span>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 lg:p-12 animate-in fade-in zoom-in-95 duration-500">
          <div className="max-w-7xl mx-auto">
             {children}
          </div>
        </div>
      </main>
    </div>
  );
}
