/**
 * CustomizeTab.tsx — Consolidated appearance and configuration panel.
 *
 * Groups four related admin functions under one roof:
 *   • Branding   — company name, logo assignment, asset descriptions per user group
 *   • Themes     — color palette definitions for the UI
 *   • Logos      — upload and manage logo images (supports AI generation)
 *   • Navigation — toggle which sidebar pages are visible to non-admin users
 *
 * Uses an internal sub-navigation so the main Admin tab bar stays clean
 * (7 tabs instead of 10). Each sub-section renders the same standalone
 * component that was previously its own top-level tab.
 */
import { useState } from "react";
import { IconImage, IconSwatchBook, IconUpload, IconPanelLeft } from "@/components/icons";
import BrandingTab from "./BrandingTab";
import ThemesTab from "./ThemesTab";
import LogosTab from "./LogosTab";
import NavigationTab from "./NavigationTab";

type CustomizeSection = "branding" | "themes" | "logos" | "navigation";

const sections: { value: CustomizeSection; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { value: "branding", label: "Branding", icon: IconImage, description: "Company name, logo, and asset labels" },
  { value: "themes", label: "Themes", icon: IconSwatchBook, description: "Color palettes and visual styles" },
  { value: "logos", label: "Logos", icon: IconUpload, description: "Upload and manage logo images" },
  { value: "navigation", label: "Navigation", icon: IconPanelLeft, description: "Sidebar visibility for non-admin users" },
];

export default function CustomizeTab() {
  const [activeSection, setActiveSection] = useState<CustomizeSection>("branding");

  const handleBrandingNavigate = (tab: string) => {
    if (tab === "logos") setActiveSection("logos");
    else if (tab === "themes") setActiveSection("themes");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.value;
          return (
            <button
              key={section.value}
              onClick={() => setActiveSection(section.value)}
              data-testid={`customize-section-${section.value}`}
              className={`group relative p-4 rounded-2xl border-2 transition-all duration-300 text-left cursor-pointer ${
                isActive
                  ? "border-primary bg-muted shadow-sm"
                  : "border-border bg-card hover:border-border hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-3 mb-1.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  isActive ? "bg-muted text-muted-foreground" : "bg-muted text-muted-foreground group-hover:bg-muted group-hover:text-muted-foreground"
                }`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <span className={`text-sm font-semibold transition-colors ${
                  isActive ? "text-muted-foreground" : "text-foreground"
                }`}>{section.label}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed pl-12">{section.description}</p>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-2">
        {activeSection === "branding" && <BrandingTab onNavigate={handleBrandingNavigate} />}
        {activeSection === "themes" && <ThemesTab />}
        {activeSection === "logos" && <LogosTab />}
        {activeSection === "navigation" && <NavigationTab />}
      </div>
    </div>
  );
}
