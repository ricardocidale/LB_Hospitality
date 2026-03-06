import { SectionCard } from "@/components/ui/section-card";
import { ManualTable } from "@/components/ui/manual-table";
import { Callout } from "@/components/ui/callout";
import {
  LogIn,
  Navigation,
  LayoutDashboard,
  Hotel,
  BarChart3,
  ImagePlus,
  Building2,
  Settings,
  FolderOpen,
  Search,
  Download,
  MessageCircle,
  UserCircle,
  Palette,
  Shield,
  ShieldCheck,
} from "lucide-react";

interface UserManualContentProps {
  expandedSections: Set<string>;
  toggleSection: (id: string) => void;
  sectionRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}

export function UserManualContent({ expandedSections, toggleSection, sectionRefs }: UserManualContentProps) {
  return (
    <main className="flex-1 space-y-4 min-w-0">

      <SectionCard
        id="getting-started"
        title="1. Getting Started"
        icon={LogIn}
        variant="light"
        expanded={expandedSections.has("getting-started")}
        onToggle={() => toggleSection("getting-started")}
        sectionRef={(el) => { sectionRefs.current["getting-started"] = el; }}
      >
        <p className="text-sm text-muted-foreground">
          The Hospitality Business Group portal is a financial simulation platform for boutique hotel investments.
          It generates multi-year projections, financial statements, and investment return analysis for a portfolio of hospitality properties.
        </p>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Logging In</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>&#8226; Navigate to the portal URL and enter your username and password.</li>
            <li>&#8226; If you forget your password, contact the Administrator to have it reset.</li>
            <li>&#8226; After logging in, you will be taken to the Dashboard.</li>
          </ul>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">User Roles</h4>
          <ManualTable
            variant="light"
            headers={["Role", "Access Level"]}
            rows={[
              ["Admin", "Full access to all features including user management, verification, and system configuration"],
              ["Partner", "Access to all financial tools, properties, management company, scenarios, and exports"],
              ["Investor", "View-only access to Dashboard, Properties, Profile, and Help"],
              ["Checker", "Partner access plus access to the verification engine and Checker Manual"],
            ]}
          />
        </div>
      </SectionCard>

      <SectionCard
        id="navigation"
        title="2. Navigating the Portal"
        icon={Navigation}
        variant="light"
        expanded={expandedSections.has("navigation")}
        onToggle={() => toggleSection("navigation")}
        sectionRef={(el) => { sectionRefs.current["navigation"] = el; }}
      >
        <p className="text-sm text-muted-foreground">
          The sidebar on the left is your primary navigation. It shows different menu items depending on your role.
          On mobile, a bottom navigation bar provides access to the most common pages.
        </p>

        <ManualTable
          variant="light"
          headers={["Menu Item", "What It Does", "Who Can See It"]}
          rows={[
            ["Dashboard", "Portfolio overview with KPI cards and consolidated charts", "Everyone"],
            ["Properties", "View and manage individual hotel properties", "Everyone"],
            ["Management Co.", "Management company financials and assumptions", "Partners, Admins"],
            ["Analysis", "Sensitivity and financing analysis tools", "Partners, Admins"],
            ["Systemwide Assumptions", "Configure model-wide parameters like inflation and staffing", "Partners, Admins"],
            ["Scenarios", "Save and load different assumption snapshots", "Partners, Admins"],
            ["Property Finder", "Search for prospective investment properties", "Partners, Admins"],
            ["Help", "User Manual, Checker Manual, and Guided Tour", "Everyone"],
            ["My Profile", "Account settings and password management", "Everyone"],
            ["Admin Settings", "User management, verification, branding, and system tools", "Admins only"],
          ]}
        />

        <Callout variant="light">
          Use the Guided Tour (under Help) for an interactive walkthrough of the interface.
        </Callout>
      </SectionCard>

      <SectionCard
        id="dashboard"
        title="3. Dashboard"
        icon={LayoutDashboard}
        variant="light"
        expanded={expandedSections.has("dashboard")}
        onToggle={() => toggleSection("dashboard")}
        sectionRef={(el) => { sectionRefs.current["dashboard"] = el; }}
      >
        <p className="text-sm text-muted-foreground">
          The Dashboard provides a high-level overview of the entire portfolio. It shows key performance indicators (KPIs),
          consolidated financial charts, and summary cards for each property.
        </p>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">KPI Cards</h4>
          <ManualTable
            variant="light"
            headers={["KPI", "Description"]}
            rows={[
              ["Portfolio IRR", "The internal rate of return across all properties combined"],
              ["Portfolio Equity Multiple", "Total distributions and exit proceeds divided by total equity invested"],
              ["Total Revenue", "Consolidated annual revenue across all properties"],
              ["Portfolio NOI", "Net Operating Income for the entire portfolio"],
              ["Weighted Avg Occupancy", "Average occupancy weighted by room count across properties"],
              ["Total Equity Invested", "Sum of all equity contributions across the portfolio"],
            ]}
          />
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Charts & Visualizations</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>&#8226; <strong>Revenue & NOI Trend</strong> — year-over-year revenue and NOI across the portfolio</li>
            <li>&#8226; <strong>Cash Flow Waterfall</strong> — visualizes how cash flows from revenue to distributions</li>
            <li>&#8226; <strong>Property Comparison</strong> — side-by-side metrics for each property</li>
          </ul>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Property Cards</h4>
          <p className="text-sm text-muted-foreground">
            Each property is shown as a summary card with its name, location, room count, ADR, occupancy, and key financial metrics.
            Click any property card to navigate to its detail page.
          </p>
        </div>
      </SectionCard>

      <SectionCard
        id="properties"
        title="4. Properties"
        icon={Hotel}
        variant="light"
        expanded={expandedSections.has("properties")}
        onToggle={() => toggleSection("properties")}
        sectionRef={(el) => { sectionRefs.current["properties"] = el; }}
      >
        <p className="text-sm text-muted-foreground">
          The Properties page lists all hotel properties in the portfolio. Each property is modeled as an independent
          Special Purpose Vehicle (SPV) with its own financial statements.
        </p>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Adding a Property</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>&#8226; Click the <strong>"Add Property"</strong> button on the Properties page.</li>
            <li>&#8226; Fill in the property details: name, location, room count, purchase price, and operating assumptions.</li>
            <li>&#8226; Click <strong>"Save"</strong> to create the property. All financial projections are calculated immediately.</li>
          </ul>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Editing a Property</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>&#8226; Click on a property card to open its detail page, then click <strong>"Edit"</strong>.</li>
            <li>&#8226; Modify any assumptions — ADR, occupancy, expense rates, financing terms, etc.</li>
            <li>&#8226; When you click <strong>"Save"</strong>, the entire portfolio is recalculated to reflect your changes.</li>
          </ul>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Deleting a Property</h4>
          <p className="text-sm text-muted-foreground">
            On the property edit page, scroll to the bottom and click <strong>"Delete Property"</strong>.
            This permanently removes the property and all its financial data. The portfolio recalculates automatically.
          </p>
        </div>

        <Callout variant="light">
          When editing assumptions, look for blue badges (GAAP/IRS rules) and amber badges (AI-researched market ranges) next to field labels.
          Hover blue badges to see the accounting standard. Click amber badges to auto-fill market-recommended values.
        </Callout>
      </SectionCard>

      <SectionCard
        id="property-details"
        title="5. Property Details & Financials"
        icon={BarChart3}
        variant="light"
        expanded={expandedSections.has("property-details")}
        onToggle={() => toggleSection("property-details")}
        sectionRef={(el) => { sectionRefs.current["property-details"] = el; }}
      >
        <p className="text-sm text-muted-foreground">
          Each property detail page shows comprehensive financial projections organized into tabs and sections.
        </p>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Financial Statements</h4>
          <ManualTable
            variant="light"
            headers={["Statement", "What It Shows"]}
            rows={[
              ["Income Statement", "Revenue, operating expenses, GOP, NOI, debt service, and net income by month and year"],
              ["Balance Sheet", "Assets (cash + property), liabilities (debt), and equity for each period"],
              ["Cash Flow Statement", "Operating, investing, and financing activities using the indirect method (GAAP ASC 230)"],
            ]}
          />
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Key Property Metrics</h4>
          <ManualTable
            variant="light"
            headers={["Metric", "Description"]}
            rows={[
              ["ADR (Average Daily Rate)", "Average price per occupied room per night"],
              ["Occupancy", "Percentage of rooms occupied in a given period"],
              ["RevPAR", "Revenue Per Available Room = ADR x Occupancy"],
              ["GOP (Gross Operating Profit)", "Total Revenue minus departmental operating expenses"],
              ["NOI (Net Operating Income)", "GOP minus management fees and FF&E reserve"],
              ["DSCR (Debt Service Coverage Ratio)", "NOI divided by total debt service — measures ability to service debt"],
              ["IRR (Internal Rate of Return)", "Annualized return considering all cash flows including exit"],
              ["Equity Multiple", "Total cash returned to investors divided by equity invested"],
              ["Cash-on-Cash Return", "Annual free cash flow divided by total equity invested"],
            ]}
          />
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">AI Market Research</h4>
          <p className="text-sm text-muted-foreground">
            Click <strong>"Run AI Research"</strong> on a property detail page to have the AI analyze market conditions
            for the property's location. The research provides benchmarks for ADR, occupancy, expense rates, and cap rates
            based on comparable properties in the area. Research results appear as amber badges on the property edit page.
          </p>
        </div>
      </SectionCard>

      <SectionCard
        id="property-images"
        title="6. Property Images"
        icon={ImagePlus}
        variant="light"
        expanded={expandedSections.has("property-images")}
        onToggle={() => toggleSection("property-images")}
        sectionRef={(el) => { sectionRefs.current["property-images"] = el; }}
      >
        <p className="text-sm text-muted-foreground">
          Each property can have images uploaded or generated using AI. Images appear on property cards and detail pages.
        </p>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Uploading Images</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>&#8226; On the property detail page, click the image area or the upload button.</li>
            <li>&#8226; Select an image file from your device (JPEG, PNG, or WebP).</li>
            <li>&#8226; The image is uploaded to cloud storage and displayed on the property card.</li>
          </ul>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">AI Image Generation</h4>
          <p className="text-sm text-muted-foreground">
            Click <strong>"Generate with AI"</strong> to create a photorealistic rendering of the property based on its
            name and description. The system uses the property details to produce a unique image.
          </p>
        </div>
      </SectionCard>

      <SectionCard
        id="management-company"
        title="7. Management Company"
        icon={Building2}
        variant="light"
        expanded={expandedSections.has("management-company")}
        onToggle={() => toggleSection("management-company")}
        sectionRef={(el) => { sectionRefs.current["management-company"] = el; }}
      >
        <p className="text-sm text-muted-foreground">
          The Management Company page models the service company that manages all properties in the portfolio.
          It is not a property owner — it earns revenue through management fees charged to each property.
        </p>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Revenue</h4>
          <ManualTable
            variant="light"
            headers={["Fee Type", "How It Works"]}
            rows={[
              ["Base Fee", "A percentage of each property's total revenue, paid monthly"],
              ["Incentive Fee", "A percentage of each property's Gross Operating Profit, rewarding operational efficiency"],
            ]}
          />
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Expenses</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>&#8226; <strong>Partner Compensation</strong> — configurable per-year schedule</li>
            <li>&#8226; <strong>Staff Compensation</strong> — based on headcount that scales with property count</li>
            <li>&#8226; <strong>Fixed Costs</strong> — office lease, professional services, tech infrastructure, insurance</li>
            <li>&#8226; <strong>Variable Costs</strong> — travel, IT licensing, marketing, miscellaneous (scale with portfolio size)</li>
          </ul>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Editing Assumptions</h4>
          <p className="text-sm text-muted-foreground">
            Click <strong>"Edit Assumptions"</strong> on the Management Company page to adjust fee rates, staffing levels,
            compensation schedules, and overhead costs. Click <strong>"Save"</strong> to recalculate all financials.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Funding Instrument</h4>
          <p className="text-sm text-muted-foreground">
            The management company is initially funded through capital tranches that provide working capital until
            management fee revenue covers operating expenses. These appear as cash inflows but are recorded as
            future equity, not revenue.
          </p>
        </div>
      </SectionCard>

      <SectionCard
        id="assumptions"
        title="8. Systemwide Assumptions"
        icon={Settings}
        variant="light"
        expanded={expandedSections.has("assumptions")}
        onToggle={() => toggleSection("assumptions")}
        sectionRef={(el) => { sectionRefs.current["assumptions"] = el; }}
      >
        <p className="text-sm text-muted-foreground">
          Systemwide Assumptions are model-wide parameters that affect all properties and the management company.
          Changes here trigger a full portfolio recalculation.
        </p>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Key Parameters</h4>
          <ManualTable
            variant="light"
            headers={["Category", "Examples"]}
            rows={[
              ["Economic", "Inflation rate, income tax rate, property tax rate"],
              ["Revenue Growth", "ADR growth rate, occupancy growth rate"],
              ["Expense Escalation", "Fixed cost escalation, variable cost growth"],
              ["Financing Defaults", "Default LTV, interest rate, loan term"],
              ["Management Fees", "Base fee rate, incentive fee rate"],
              ["Exit Parameters", "Exit cap rate, sales commission rate"],
              ["Staffing", "Staff FTE tiers based on property count"],
            ]}
          />
        </div>

        <Callout variant="light">
          Individual properties can override any systemwide assumption with property-specific values.
          When a property-level value is not set, the systemwide default is used automatically.
        </Callout>
      </SectionCard>

      <SectionCard
        id="scenarios"
        title="9. Scenarios"
        icon={FolderOpen}
        variant="light"
        expanded={expandedSections.has("scenarios")}
        onToggle={() => toggleSection("scenarios")}
        sectionRef={(el) => { sectionRefs.current["scenarios"] = el; }}
      >
        <p className="text-sm text-muted-foreground">
          Scenarios let you save and load different sets of assumptions to compare "what if" situations.
        </p>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Saving a Scenario</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>&#8226; Go to the <strong>Scenarios</strong> page from the sidebar.</li>
            <li>&#8226; Click <strong>"Save Current Scenario"</strong>.</li>
            <li>&#8226; Give it a descriptive name (e.g., "Base Case", "Conservative", "Aggressive Growth").</li>
            <li>&#8226; All current systemwide and property-level assumptions are captured in the snapshot.</li>
          </ul>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Loading a Scenario</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>&#8226; Select a previously saved scenario from the list.</li>
            <li>&#8226; Click <strong>"Load"</strong> to restore all assumptions from that snapshot.</li>
            <li>&#8226; The entire portfolio recalculates with the loaded assumptions.</li>
          </ul>
        </div>

        <Callout variant="light">
          Loading a scenario replaces all current assumptions. Save your current work before loading a different scenario.
        </Callout>
      </SectionCard>

      <SectionCard
        id="analysis"
        title="10. Analysis Tools"
        icon={BarChart3}
        variant="light"
        expanded={expandedSections.has("analysis")}
        onToggle={() => toggleSection("analysis")}
        sectionRef={(el) => { sectionRefs.current["analysis"] = el; }}
      >
        <p className="text-sm text-muted-foreground">
          The Analysis section provides advanced tools for testing how changes in key variables affect financial outcomes.
        </p>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Sensitivity Analysis</h4>
          <p className="text-sm text-muted-foreground">
            Tests how changing one variable at a time (e.g., ADR, occupancy, cap rate) impacts key metrics like IRR,
            NOI, and equity multiple. Results are shown as tables and charts that highlight upside and downside scenarios.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Financing Analysis</h4>
          <p className="text-sm text-muted-foreground">
            Compares different financing structures — varying LTV ratios, interest rates, and loan terms — to see
            how leverage affects returns. Useful for finding the optimal debt-to-equity ratio for each property.
          </p>
        </div>
      </SectionCard>

      <SectionCard
        id="property-finder"
        title="11. Property Finder"
        icon={Search}
        variant="light"
        expanded={expandedSections.has("property-finder")}
        onToggle={() => toggleSection("property-finder")}
        sectionRef={(el) => { sectionRefs.current["property-finder"] = el; }}
      >
        <p className="text-sm text-muted-foreground">
          The Property Finder helps you search for and evaluate prospective investment properties before adding them to the portfolio.
        </p>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">How to Use</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>&#8226; Enter a city or region to search for boutique hotel opportunities.</li>
            <li>&#8226; AI-powered research analyzes market conditions, comparable properties, and local demand drivers.</li>
            <li>&#8226; Review the results including suggested ADR ranges, occupancy rates, and cap rates.</li>
            <li>&#8226; Save promising prospects to revisit later or add them directly to your portfolio.</li>
          </ul>
        </div>
      </SectionCard>

      <SectionCard
        id="exports"
        title="12. Exports & Reports"
        icon={Download}
        variant="light"
        expanded={expandedSections.has("exports")}
        onToggle={() => toggleSection("exports")}
        sectionRef={(el) => { sectionRefs.current["exports"] = el; }}
      >
        <p className="text-sm text-muted-foreground">
          The portal supports multiple export formats for sharing financial data with investors, lenders, and advisors.
        </p>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Available Formats</h4>
          <ManualTable
            variant="light"
            headers={["Format", "Best For"]}
            rows={[
              ["Excel (.xlsx)", "Detailed financial analysis — all statements, monthly data, formulas. Best for accountants and analysts"],
              ["PDF", "Polished presentation-ready reports with branded headers and charts"],
              ["PowerPoint (.pptx)", "Investor pitch decks with portfolio overview slides"],
              ["CSV", "Raw data export for custom analysis in any spreadsheet tool"],
            ]}
          />
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">How to Export</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>&#8226; <strong>Property-level exports</strong> — available on each property detail page via the export button.</li>
            <li>&#8226; <strong>Portfolio-level exports</strong> — available on the Dashboard for consolidated reports.</li>
            <li>&#8226; <strong>Executive Summary</strong> — a one-page overview combining key metrics from all properties.</li>
          </ul>
        </div>
      </SectionCard>

      <SectionCard
        id="marcela"
        title="13. Marcela AI Assistant"
        icon={MessageCircle}
        variant="light"
        expanded={expandedSections.has("marcela")}
        onToggle={() => toggleSection("marcela")}
        sectionRef={(el) => { sectionRefs.current["marcela"] = el; }}
      >
        <p className="text-sm text-muted-foreground">
          Marcela is the portal's AI-powered assistant. She can answer questions about the portfolio, explain financial metrics,
          and help navigate the application.
        </p>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Text Chat</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>&#8226; Click the chat icon in the bottom-right corner to open the chat window.</li>
            <li>&#8226; Type your question and press Enter or click Send.</li>
            <li>&#8226; Marcela can explain any metric, compare properties, and provide context from market research data.</li>
          </ul>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Voice Chat</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>&#8226; Click the microphone icon in the chat window to start a voice conversation.</li>
            <li>&#8226; Speak naturally — Marcela will listen, process your question, and respond with a spoken answer.</li>
            <li>&#8226; You can interrupt Marcela while she is speaking to ask follow-up questions.</li>
          </ul>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Phone & SMS</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>&#8226; <strong>Phone</strong> — call the dedicated Marcela phone number for a voice conversation about your portfolio.</li>
            <li>&#8226; <strong>SMS</strong> — text the same number to get quick answers via text message.</li>
          </ul>
        </div>

        <Callout variant="light">
          Marcela never performs financial calculations directly. All financial data comes from the deterministic calculation engine
          to ensure accuracy and consistency.
        </Callout>
      </SectionCard>

      <SectionCard
        id="profile"
        title="14. My Profile"
        icon={UserCircle}
        variant="light"
        expanded={expandedSections.has("profile")}
        onToggle={() => toggleSection("profile")}
        sectionRef={(el) => { sectionRefs.current["profile"] = el; }}
      >
        <p className="text-sm text-muted-foreground">
          The Profile page lets you manage your account settings.
        </p>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Available Settings</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>&#8226; <strong>Display Name</strong> — how your name appears across the portal.</li>
            <li>&#8226; <strong>Email</strong> — your contact email address.</li>
            <li>&#8226; <strong>Password</strong> — change your password at any time.</li>
          </ul>
        </div>
      </SectionCard>

      <SectionCard
        id="branding"
        title="15. Branding & Themes"
        icon={Palette}
        variant="light"
        expanded={expandedSections.has("branding")}
        onToggle={() => toggleSection("branding")}
        sectionRef={(el) => { sectionRefs.current["branding"] = el; }}
      >
        <p className="text-sm text-muted-foreground">
          The portal supports customizable branding including logos, color themes, and design elements.
          Branding is managed by the Administrator and can be configured at the system level or per user group.
        </p>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Branding Hierarchy</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>&#8226; <strong>User-level</strong> — if a user has specific branding, it takes priority.</li>
            <li>&#8226; <strong>User Group-level</strong> — if the user belongs to a group with custom branding, that applies.</li>
            <li>&#8226; <strong>System Default</strong> — the fallback branding when no overrides exist.</li>
          </ul>
        </div>
      </SectionCard>

      <SectionCard
        id="admin"
        title="16. Admin Settings"
        icon={Shield}
        variant="light"
        expanded={expandedSections.has("admin")}
        onToggle={() => toggleSection("admin")}
        sectionRef={(el) => { sectionRefs.current["admin"] = el; }}
      >
        <p className="text-sm text-muted-foreground">
          Admin Settings is available only to users with the Admin role. It provides system-wide configuration and management tools.
        </p>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Admin Tabs</h4>
          <ManualTable
            variant="light"
            headers={["Tab", "Purpose"]}
            rows={[
              ["Users", "Manage user accounts — create, edit, assign roles and groups, reset passwords"],
              ["Companies", "Configure company entities and their details"],
              ["User Groups", "Create and manage groups for organizing users and applying group-level branding"],
              ["Logos", "Upload and manage logos used across the portal and in exports"],
              ["Branding", "Configure colors, fonts, and visual identity for different user groups"],
              ["Themes", "Manage the design themes available in the system"],
              ["Navigation", "Control which sidebar items are visible to different user roles"],
              ["Marcela", "Configure the AI assistant — voice settings, LLM model, telephony, and knowledge base"],
              ["Verification", "Run the financial verification engine and review audit results"],
              ["Activity", "View system activity logs and user actions"],
              ["Database", "Database management tools for administrators"],
            ]}
          />
        </div>
      </SectionCard>

      <SectionCard
        id="business-constraints"
        title="17. Business Rules & Constraints"
        icon={ShieldCheck}
        variant="light"
        className="border-primary/30 bg-primary/5"
        expanded={expandedSections.has("business-constraints")}
        onToggle={() => toggleSection("business-constraints")}
        sectionRef={(el) => { sectionRefs.current["business-constraints"] = el; }}
      >
        <p className="text-sm text-muted-foreground">
          The financial model enforces mandatory business rules that reflect real-world constraints.
          These rules cannot be overridden — if any are violated, the system flags the scenario as invalid.
        </p>

        <Callout severity="critical" variant="light" title="1. Management Company Funding Gate">
          <p>
            Operations of the Management Company cannot begin before funding is received. The company requires
            capital tranches to cover startup costs before management fee revenue begins flowing from properties.
          </p>
        </Callout>

        <Callout severity="critical" variant="light" title="2. Property Activation Gate">
          <p>
            A property cannot begin operating before it is purchased and funding is in place. Revenue and operating
            expenses only begin after the acquisition date and operations start date.
          </p>
        </Callout>

        <Callout severity="critical" variant="light" title="3. No Negative Cash Rule">
          <p>
            Cash balances for each property, the Management Company, and the aggregated portfolio must never be negative.
          </p>
        </Callout>

        <Callout severity="critical" variant="light" title="4. Debt-Free at Exit">
          <p>
            At exit, all properties must be debt-free. Outstanding loan balances are repaid from gross sale proceeds
            before calculating net proceeds to equity.
          </p>
          <div className="bg-white/50 rounded p-2 font-mono text-xs mt-2">
            <div>Gross Sale Value = Final Year NOI / Exit Cap Rate</div>
            <div>Less: Sales Commission</div>
            <div>Less: Outstanding Debt Balance (must be fully repaid)</div>
            <div>= Net Proceeds to Equity</div>
          </div>
        </Callout>

        <Callout severity="critical" variant="light" title="5. No Over-Distribution Rule">
          <p>
            FCF distributions and refinancing proceeds returned to investors must not exceed available cash.
          </p>
        </Callout>

        <Callout severity="critical" variant="light" title="6. Income Statement: Interest Only (No Principal)">
          <p>
            The income statement shows <strong>only interest expense</strong>, never principal repayment.
            Principal payments are balance sheet transactions that reduce the loan liability.
          </p>
        </Callout>

        <Callout severity="critical" variant="light" title="7. Capital Structure Presentation">
          <p>
            All financial reports must present capital sources on separate lines for clarity:
          </p>
          <div className="bg-white/50 rounded p-2 font-mono text-xs mt-2 space-y-1">
            <div><strong>Equity (Cash) Infusion</strong> — one line item</div>
            <div><strong>Loan Proceeds</strong> — separate line item (acquisition financing)</div>
            <div><strong>Refinancing Proceeds</strong> — separate line item (cash-out from refi)</div>
          </div>
        </Callout>
      </SectionCard>

    </main>
  );
}
