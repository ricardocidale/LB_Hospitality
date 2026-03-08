import {
  IconActivity,
  IconDashboard,
  IconProperties,
  IconBriefcase,
  IconSettings,
  IconScenarios,
  IconAnalysis,
  IconPropertyFinder,
  IconExport,
  IconBot,
  IconProfile,
  IconSwatchBook,
  IconShield,
  IconVerify,
  IconImage,
  IconInvestment,
  IconPanelLeft,
} from "@/components/icons/brand-icons";
import type { ComponentType, SVGAttributes } from "react";

export interface UserManualSection {
  id: string;
  title: string;
  icon: ComponentType<SVGAttributes<SVGSVGElement>>;
}

export const USER_MANUAL_SECTIONS: UserManualSection[] = [
  { id: "getting-started", title: "1. Getting Started", icon: IconActivity },
  { id: "navigation", title: "2. Navigating the Portal", icon: IconPanelLeft },
  { id: "dashboard", title: "3. Dashboard", icon: IconDashboard },
  { id: "properties", title: "4. Properties", icon: IconProperties },
  { id: "property-details", title: "5. Property Details & Financials", icon: IconInvestment },
  { id: "property-images", title: "6. Property Images", icon: IconImage },
  { id: "management-company", title: "7. Management Company", icon: IconBriefcase },
  { id: "assumptions", title: "8. Systemwide Assumptions", icon: IconSettings },
  { id: "scenarios", title: "9. Scenarios", icon: IconScenarios },
  { id: "analysis", title: "10. Analysis Tools", icon: IconAnalysis },
  { id: "property-finder", title: "11. Property Finder", icon: IconPropertyFinder },
  { id: "exports", title: "12. Exports & Reports", icon: IconExport },
  { id: "marcela", title: "13. Marcela AI Assistant", icon: IconBot },
  { id: "profile", title: "14. My Profile", icon: IconProfile },
  { id: "branding", title: "15. Branding & Themes", icon: IconSwatchBook },
  { id: "admin", title: "16. Admin Settings", icon: IconShield },
  { id: "business-constraints", title: "17. Business Rules & Constraints", icon: IconVerify },
];
