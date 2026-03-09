import { BarChart3, BookOpenCheck } from "lucide-react";
import { IconCalculator, FlaskConical, IconBookOpen, IconBrain, IconBriefcase, IconBuilding, IconDollarSign, IconDownload, IconFileText, IconFolderOpen, IconHotel, IconLandmark, IconPalette, IconPlus, IconSliders, PieChart, Settings, UserCircle } from "@/components/icons/brand-icons";
import { ManualSection } from "./types";

export const SECTIONS: ManualSection[] = [
  { id: "app-overview", title: "1. Application Overview", icon: IconBookOpen },
  { id: "mgmt-company", title: "2. Management Company", icon: IconBuilding },
  { id: "property-portfolio", title: "3. Property Portfolio (SPVs)", icon: IconHotel },
  { id: "global-assumptions", title: "4. Global Assumptions", icon: Settings },
  { id: "property-assumptions", title: "5. Property-Level Assumptions", icon: IconSliders },
  { id: "cashflow-streams", title: "6. Cash Flow Streams", icon: IconDollarSign },
  { id: "financial-statements", title: "7. Financial Statements", icon: IconFileText },
  { id: "export-system", title: "8. Export System", icon: IconDownload },
  { id: "design-config", title: "9. Design Configuration", icon: IconPalette },
  { id: "scenario-mgmt", title: "10. Scenario Management", icon: IconFolderOpen },
  { id: "my-profile", title: "11. My Profile", icon: UserCircle },
  { id: "dashboard-kpis", title: "12. Dashboard & KPIs", icon: BarChart3 },
  { id: "ai-research", title: "13. AI Research & Calibration", icon: IconBrain },
  { id: "property-crud", title: "14. Property CRUD & Images", icon: IconPlus },
  { id: "testing-methodology", title: "15. Testing Methodology", icon: FlaskConical },
  { id: "property-formulas", title: "16. Property Financial Formulas", icon: IconCalculator },
  { id: "company-formulas", title: "17. Management Company Formulas", icon: IconBriefcase },
  { id: "consolidated-formulas", title: "18. Consolidated Portfolio Formulas", icon: PieChart },
  { id: "investment-returns", title: "19. Investment Returns (DCF/FCF/IRR)", icon: IconLandmark },
  { id: "funding-financing", title: "20. Funding, Financing & Refinancing", icon: IconDollarSign },
  { id: "glossary", title: "21. Glossary", icon: BookOpenCheck },
];
