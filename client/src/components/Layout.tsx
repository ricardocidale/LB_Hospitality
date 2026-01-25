import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Menu, X, FileText } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "L+B Management", active: true },
    { href: "/portfolio", label: "Properties" },
    { href: "/company", label: "Consolidated" },
    { href: "/settings", label: "Variables" },
  ];

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 md:px-6 h-14">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">L+B</span>
              </div>
              <div className="hidden md:block">
                <h1 className="font-semibold text-foreground">L+B Hospitality</h1>
                <p className="text-xs text-muted-foreground">Financial Model</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={cn(
                      "px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}>
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="hidden md:flex gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              <FileText className="w-4 h-4" />
              Export PDF
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border p-2 space-y-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                  <div className={cn(
                    "px-3 py-2 text-sm font-medium rounded-md cursor-pointer",
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      <main className="p-4 md:p-6">
        <div className="max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
