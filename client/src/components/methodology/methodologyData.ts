import { Banknote, BarChart3, IconBookOpen, IconBuilding, IconCalculator, IconDollarSign, IconInfo, IconRefresh, IconTrending, IconWallet, Layers, PieChart } from "@/components/icons/brand-icons";

export const sections = [
  { id: "business-model", title: "Business Model Overview", subtitle: "Two-entity structure: Management Company + Property Portfolio", icon: Layers },
  { id: "business-rules", title: "Business Rules & Constraints", subtitle: "Mandatory financial gates and safety checks", icon: ShieldCheck, className: "border-red-200 bg-red-50/30" },
  { id: "capital-lifecycle", title: "Capital Structure & Investor Returns", subtitle: "How capital flows in and how investors get paid back", icon: Banknote },
  { id: "dynamic-behavior", title: "Dynamic Behavior & System Goals", subtitle: "Real-time recalculation and multi-level analysis", icon: IconRefresh },
  { id: "property-lifecycle", title: "Property Lifecycle", subtitle: "Acquisition → Operations → Refinancing → Exit", icon: IconArrowRightLeft },
  { id: "defaults", title: "Default Values & Assumptions", subtitle: "Where the default numbers come from", icon: IconInfo },
  { id: "revenue", title: "Revenue Calculations", subtitle: "How we project rooms, F&B, and events revenue", icon: IconTrending },
  { id: "expenses", title: "Operating Expenses", subtitle: "How we calculate property operating costs", icon: IconWallet },
  { id: "noi-gop", title: "GOP and ANOI", subtitle: "Gross Operating Profit and Adjusted NOI", icon: BarChart3 },
  { id: "debt", title: "Debt & Financing", subtitle: "Loan calculations and refinancing", icon: IconBuilding },
  { id: "cash-flow", title: "Free Cash Flow (GAAP Method)", subtitle: "How we calculate cash available to investors", icon: IconDollarSign },
  { id: "balance-sheet", title: "Balance Sheet", subtitle: "Assets, liabilities, and equity per GAAP standards", icon: IconBookOpen },
  { id: "returns", title: "Investment Returns", subtitle: "IRR, equity multiple, and exit value calculations", icon: PieChart },
  { id: "management-company", title: "Management Company Financials", subtitle: "Hospitality Business Co. revenue and expenses", icon: IconBuilding },
  { id: "fixed-assumptions", title: "Fixed Assumptions (Not Configurable)", subtitle: "Hardcoded values built into the calculation engine", icon: IconInfo, className: "border-amber-200 bg-amber-50/30" },
  { id: "verification", title: "Financial Verification & Audit", subtitle: "How we verify calculations for GAAP compliance", icon: IconCalculator },
];
