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
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xl">
        <CommandInput
          placeholder="Type a command or search..."
          className="text-gray-900 placeholder:text-gray-400"
          data-testid="command-palette-input"
        />
        <CommandList className="text-gray-900">
          <CommandEmpty className="text-gray-400">
            No results found.
          </CommandEmpty>

          <CommandGroup
            heading="Navigation"
            className="[&_[cmdk-group-heading]]:text-gray-500 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase"
          >
            {navigationItems.map((item) => (
              <CommandItem
                key={item.href}
                value={item.label}
                onSelect={() => handleSelect(item.href)}
                className="text-gray-700 hover:text-gray-900 data-[selected=true]:bg-gray-100 data-[selected=true]:text-gray-900 cursor-pointer"
                data-testid={`command-item-${item.label.toLowerCase().replace(/[\s.]+/g, "-")}`}
              >
                <item.icon className="mr-2 h-4 w-4 text-gray-400" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator className="bg-gray-100" />

          <CommandGroup
            heading="Properties"
            className="[&_[cmdk-group-heading]]:text-gray-500 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase"
          >
            {properties.map((property) => (
              <CommandItem
                key={property.id}
                value={property.name}
                onSelect={() => handleSelect(`/property/${property.id}`)}
                className="text-gray-700 hover:text-gray-900 data-[selected=true]:bg-gray-100 data-[selected=true]:text-gray-900 cursor-pointer"
                data-testid={`command-item-property-${property.id}`}
              >
                <Building2 className="mr-2 h-4 w-4 text-primary" />
                <span>{property.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator className="bg-gray-100" />

          <CommandGroup
            heading="Quick Actions"
            className="[&_[cmdk-group-heading]]:text-gray-500 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase"
          >
            {quickActions.map((action) => (
              <CommandItem
                key={action.id}
                value={action.label}
                onSelect={() => setOpen(false)}
                className="text-gray-700 hover:text-gray-900 data-[selected=true]:bg-gray-100 data-[selected=true]:text-gray-900 cursor-pointer"
                data-testid={`command-item-${action.id}`}
              >
                <action.icon className="mr-2 h-4 w-4 text-gray-400" />
                <span>{action.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>

        <div className="border-t border-gray-100 px-3 py-2 flex items-center gap-2 text-gray-400 text-xs">
          <Search className="h-3 w-3" />
          <span>
            Press{" "}
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-[10px]">
              ⌘K
            </kbd>{" "}
            to toggle
          </span>
        </div>
      </div>
    </CommandDialog>
  );
}
