/**
 * CommandPalette.tsx — Keyboard-driven command palette (Cmd+K / Ctrl+K).
 *
 * Opens a searchable dialog listing all navigable pages and properties.
 * The user can type to filter and press Enter to navigate instantly.
 * Groups include: Pages (Dashboard, Company, Admin), Properties (all
 * properties in the portfolio), and Actions (e.g. add property, export).
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { useStore } from "@/lib/store";
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Settings2,
  BarChart3,
  Calculator,
  UserCircle,
  FolderOpen,
  FileDown,
  CheckCircle,
  RefreshCw,
  Search,
} from "lucide-react";

const navigationItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Properties", href: "/portfolio", icon: Building2 },
  { label: "Management Co.", href: "/company", icon: Briefcase },
  { label: "Settings", href: "/settings", icon: Settings2 },
  { label: "Sensitivity", href: "/sensitivity", icon: BarChart3 },
  { label: "Financing", href: "/financing", icon: Calculator },
  { label: "Profile", href: "/profile", icon: UserCircle },
  { label: "Scenarios", href: "/scenarios", icon: FolderOpen },
];

const quickActions = [
  { label: "Export Portfolio", icon: FileDown, id: "export-portfolio" },
  { label: "Run Verification", icon: CheckCircle, id: "run-verification" },
  { label: "Research Refresh", icon: RefreshCw, id: "research-refresh" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const properties = useStore((s) => s.properties);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (href: string) => {
    setLocation(href);
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div className="bg-[#0a0a0f] border border-white/10 rounded-lg overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-white/[0.08] pointer-events-none rounded-lg" />
        <CommandInput
          placeholder="Type a command or search..."
          className="text-background placeholder:text-background/40"
          data-testid="command-palette-input"
        />
        <CommandList className="text-background">
          <CommandEmpty className="text-background/50">
            No results found.
          </CommandEmpty>

          <CommandGroup
            heading="Navigation"
            className="[&_[cmdk-group-heading]]:text-primary [&_[cmdk-group-heading]]:font-semibold"
          >
            {navigationItems.map((item) => (
              <CommandItem
                key={item.href}
                value={item.label}
                onSelect={() => handleSelect(item.href)}
                className="text-background/80 hover:text-background data-[selected=true]:bg-primary/20 data-[selected=true]:text-background cursor-pointer"
                data-testid={`command-item-${item.label.toLowerCase().replace(/[\s.]+/g, "-")}`}
              >
                <item.icon className="mr-2 h-4 w-4 text-primary" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator className="bg-white/10" />

          <CommandGroup
            heading="Properties"
            className="[&_[cmdk-group-heading]]:text-primary [&_[cmdk-group-heading]]:font-semibold"
          >
            {properties.map((property) => (
              <CommandItem
                key={property.id}
                value={property.name}
                onSelect={() => handleSelect(`/property/${property.id}`)}
                className="text-background/80 hover:text-background data-[selected=true]:bg-primary/20 data-[selected=true]:text-background cursor-pointer"
                data-testid={`command-item-property-${property.id}`}
              >
                <Building2 className="mr-2 h-4 w-4 text-primary" />
                <span>{property.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator className="bg-white/10" />

          <CommandGroup
            heading="Quick Actions"
            className="[&_[cmdk-group-heading]]:text-primary [&_[cmdk-group-heading]]:font-semibold"
          >
            {quickActions.map((action) => (
              <CommandItem
                key={action.id}
                value={action.label}
                onSelect={() => setOpen(false)}
                className="text-background/80 hover:text-background data-[selected=true]:bg-primary/20 data-[selected=true]:text-background cursor-pointer"
                data-testid={`command-item-${action.id}`}
              >
                <action.icon className="mr-2 h-4 w-4 text-primary" />
                <span>{action.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>

        <div className="border-t border-white/10 px-3 py-2 flex items-center gap-2 text-background/30 text-xs">
          <Search className="h-3 w-3" />
          <span>
            Press{" "}
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-background/50 font-mono text-[10px]">
              ⌘K
            </kbd>{" "}
            to toggle
          </span>
        </div>
      </div>
    </CommandDialog>
  );
}
