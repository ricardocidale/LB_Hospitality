import {
  LayoutDashboard,
  Hotel,
  Building2,
  Settings,
  FolderOpen,
  Download,
  MessageCircle,
  Search,
  BarChart3,
  UserCircle,
  Shield,
  LogIn,
  Navigation,
  ImagePlus,
  Palette,
  ShieldCheck,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface UserManualSection {
  id: string;
  title: string;
  icon: LucideIcon;
}

export const USER_MANUAL_SECTIONS: UserManualSection[] = [
  { id: "getting-started", title: "1. Getting Started", icon: LogIn },
  { id: "navigation", title: "2. Navigating the Portal", icon: Navigation },
  { id: "dashboard", title: "3. Dashboard", icon: LayoutDashboard },
  { id: "properties", title: "4. Properties", icon: Hotel },
  { id: "property-details", title: "5. Property Details & Financials", icon: BarChart3 },
  { id: "property-images", title: "6. Property Images", icon: ImagePlus },
  { id: "management-company", title: "7. Management Company", icon: Building2 },
  { id: "assumptions", title: "8. Systemwide Assumptions", icon: Settings },
  { id: "scenarios", title: "9. Scenarios", icon: FolderOpen },
  { id: "analysis", title: "10. Analysis Tools", icon: BarChart3 },
  { id: "property-finder", title: "11. Property Finder", icon: Search },
  { id: "exports", title: "12. Exports & Reports", icon: Download },
  { id: "marcela", title: "13. Marcela AI Assistant", icon: MessageCircle },
  { id: "profile", title: "14. My Profile", icon: UserCircle },
  { id: "branding", title: "15. Branding & Themes", icon: Palette },
  { id: "admin", title: "16. Admin Settings", icon: Shield },
  { id: "business-constraints", title: "17. Business Rules & Constraints", icon: ShieldCheck },
];
