/**
 * DiagramsTab.tsx — Admin workflow diagrams using Mermaid.
 *
 * Displays application architecture and data flow in 3 levels:
 *   Level 1: System overview (10,000-foot view)
 *   Level 2: Domain flows (financial, auth, AI, research)
 *   Level 3: Detailed sub-flows (property lifecycle, seeding, exports, admin config)
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MermaidChart } from "@/lib/charts/MermaidChart";

// ─────────────────────────────────────────────────
// LEVEL 1 — System Overview
// ─────────────────────────────────────────────────

const L1_APP_FLOW = `flowchart LR
  User([User]) --> Auth[Authentication]
  Auth --> Role{Role Check}
  Role -->|admin| Admin[Admin Panel]
  Role -->|partner| Dashboard[Dashboard]
  Role -->|checker| Dashboard
  Role -->|investor| Dashboard
  Dashboard --> Properties[Properties]
  Dashboard --> Company[Management Company]
  Dashboard --> Analysis[Analysis]
  Properties --> Engine[Financial Engine]
  Company --> Engine
  Engine --> Statements[Financial Statements]
  Statements --> Exports[Exports]
  Statements --> Charts[Charts & Reports]`;

const L1_TWO_ENTITY = `flowchart TB
  subgraph SPV["Property SPVs"]
    P1[Hotel A]
    P2[Hotel B]
    P3[Hotel C]
    P1 --> BF1["Base Fee\\n% of Total Revenue"]
    P1 --> IF1["Incentive Fee\\n% of GOP"]
    P2 --> BF2["Base Fee\\n% of Total Revenue"]
    P2 --> IF2["Incentive Fee\\n% of GOP"]
    P3 --> BF3["Base Fee\\n% of Total Revenue"]
    P3 --> IF3["Incentive Fee\\n% of GOP"]
  end
  subgraph MC["Management Company"]
    FeeRev["Fee Revenue\\n(Base + Incentive)"]
    SvcFees["Service Fee Revenue\\n(per-category)"]
    FeeRev --> OpEx[Operating Expenses]
    SvcFees --> OpEx
    OpEx --> EBITDA[ManCo EBITDA]
  end
  BF1 & BF2 & BF3 --> FeeRev
  IF1 & IF2 & IF3 --> FeeRev
  subgraph Consol["Consolidated View"]
    Elim["Intercompany Elimination\\n(ManCo fees = SPV expenses)"]
    PortNOI[Portfolio NOI]
  end
  SPV -- "SPV NOI\\n(after mgmt fee expense)" --> Elim
  MC -- "ManCo EBITDA\\n(fee income − costs)" --> Elim
  Elim -- "Net: fees cancel out" --> PortNOI`;

// ─────────────────────────────────────────────────
// LEVEL 2 — Domain Flows
// ─────────────────────────────────────────────────

const L2_FINANCIAL = `flowchart LR
  GA[Global Assumptions] --> Engine[Financial Engine]
  PA[Property Assumptions] --> Engine
  Engine --> IS[Income Statement]
  Engine --> CF[Cash Flow]
  Engine --> BS[Balance Sheet]
  IS --> Export[Export Suite]
  CF --> Export
  BS --> Export
  Export --> PDF & Excel & CSV & PPTX & PNG`;

const L2_AUTH = `flowchart TB
  Login([Login]) --> Session[Session Created]
  Session --> Role{User Role}
  Role --> Group[User Group]
  Group --> Branding[Group Branding]
  Branding --> Theme[Theme Resolution]
  Theme --> CSS[CSS Variables Applied]

  subgraph Resolution["Theme Resolution Chain"]
    UT[user.selectedThemeId]
    GT[userGroup.themeId]
    DT[System Default]
    UT -->|fallback| GT -->|fallback| DT
  end`;

const L2_AI = `flowchart LR
  subgraph Marcela["Marcela (Voice)"]
    EL[ElevenLabs API] --> Voice[Voice Widget]
    Voice --> Audio[Audio Stream]
    KB[Knowledge Base] --> EL
    Twilio[Twilio] --> EL
  end
  subgraph Rebecca["Rebecca (Text)"]
    Gemini[Gemini API] --> Chat[Chat Panel]
    Props[Property Metrics] --> Gemini
    GA2[Global Assumptions] --> Gemini
  end
  User([User]) --> Voice
  User --> Chat`;

const L2_RESEARCH = `flowchart LR
  Trigger([Research Trigger]) --> Config[Admin]
  Config --> Builder[Prompt Builder]
  Builder --> Tools[Deterministic Tools]
  Tools --> LLM[AI Model]
  LLM --> Extract[Value Extraction]
  Extract --> Validate[Post-LLM Validation]
  Validate --> Store[Database Storage]
  Store --> Display[UI Display]`;

const L2_MANCO = `flowchart TB
  subgraph Revenue["Revenue"]
    direction TB
    BaseFee["Base Management Fees\\n% of each property Total Revenue"]
    IncentFee["Incentive Fees\\n% of each property GOP"]
    SvcFee["Service Fee Categories\\nDirect vs Centralized/Pass-Through"]
  end

  subgraph Expenses["Expenses"]
    direction TB
    subgraph Fixed["Fixed Overhead"]
      Office["Office Lease"]
      ProfSvc["Professional Services"]
      Tech["Tech Infrastructure"]
      Infl(("Escalated by\\nInflation Rate"))
      Office & ProfSvc & Tech --> Infl
    end
    subgraph Variable["Variable Costs"]
      TravelIT["Travel & IT\\n(per client)"]
      MktgMisc["Marketing & Misc\\n(% of revenue)"]
    end
    subgraph Staff["Staffing Tiers"]
      T1["Tier 1: ≤3 properties → 2.5 FTE"]
      T2["Tier 2: ≤6 properties → 4.5 FTE"]
      T3["Tier 3: 7+ properties → 7.0 FTE"]
    end
    PartnerComp["Partner Compensation\\n(10-year schedule)"]
  end

  subgraph Funding["SAFE Funding"]
    direction TB
    S1["SAFE Tranche 1\\n(date + amount)"]
    S2["SAFE Tranche 2\\n(date + amount)"]
    Gate{"Operational Gate"}
    S1 --> Gate
    S2 --> Gate
    OpsDate["companyOpsStartDate"] --> Gate
    SafeDate["safeTranche1Date"] --> Gate
    Gate -->|"BOTH dates reached"| Go["Operations Begin"]
  end

  Revenue --> NetRev["Total ManCo Revenue"]
  Expenses --> TotalExp["Total ManCo Expenses"]
  NetRev --> EBITDA["EBITDA"]
  TotalExp --> EBITDA
  EBITDA --> PreTax["Pre-Tax Income"]
  PreTax --> Tax["Tax Provision"]
  Tax --> NetInc["Net Income"]
  NetInc --> Cash["Cash Position"]
  Cash --> Check{"Shortfall?"}
  Check -->|Yes| Flag["⚠ Shortfall Flagged"]
  Check -->|No| OK["✓ Sufficient Cash"]
  Funding --> Cash`;

// ─────────────────────────────────────────────────
// LEVEL 3 — Detailed Sub-flows
// ─────────────────────────────────────────────────

const L3_PROPERTY = `flowchart TB
  Acquire([Acquisition]) --> PreOps[Pre-Operations Gap]
  PreOps -->|debt payments, reserve covers costs| OpsStart[Operations Start]
  OpsStart --> Revenue[Revenue Generation]
  Revenue --> IS[Income Statement]
  IS --> NOI[NOI Calculation]
  NOI --> CF[Cash Flow]
  CF -->|optional| Refi[Refinance]
  Refi --> CF2[Updated Cash Flow]
  CF2 --> Exit[Exit Valuation]
  Exit --> Waterfall[Equity Waterfall]
  Waterfall --> Net[Net Proceeds]

  subgraph ExitCalc["Exit Waterfall"]
    GrossVal[Gross Value = NOI / Cap Rate]
    Commission[Less Commission]
    Debt[Less Outstanding Debt]
    GrossVal --> Commission --> Debt --> Net2[Net to Equity]
  end`;

const L3_SEEDING = `flowchart TB
  Start([Server Start]) --> Seed[seedAdminUser]
  Seed --> Check{User Exists?}
  Check -->|No| Create[Create User + Hash Password]
  Check -->|Yes| Guard{FORCE_RESEED_PASSWORDS?}
  Guard -->|true| Reset[Reset Password]
  Guard -->|false| Preserve[Preserve Password]
  Reset --> Profile[Update Profile Fields]
  Preserve --> Profile
  Create --> Profile
  Profile --> Scenario[Create Default Scenario]

  subgraph ProdSync["Production Sync (fill-only)"]
    FillCheck[isFieldEmpty?]
    FillCheck -->|empty| Fill[Fill from defaults]
    FillCheck -->|has value| Skip[Skip - preserve user data]
  end`;

const L3_EXPORT = `flowchart LR
  Page([Data Page]) --> ExportMenu[ExportMenu Component]
  ExportMenu --> PDF[PDF Generator]
  ExportMenu --> Excel[Excel Generator]
  ExportMenu --> CSV[CSV Generator]
  ExportMenu --> PPTX[PowerPoint Generator]
  ExportMenu --> ChartPNG[Chart PNG]
  ExportMenu --> TablePNG[Table PNG]
  PDF --> Orient{Orientation Dialog}
  ChartPNG --> Orient
  Orient --> Download([File Download])
  Excel --> Download
  CSV --> Download
  PPTX --> Download
  TablePNG --> Download`;

const L3_ADMIN_CONFIG = `flowchart TB
  Admin([Admin]) --> Themes[Theme Management]
  Admin --> Groups[Group Management]
  Admin --> Users[User Management]

  Themes --> Default[Set Default Theme]
  Themes --> Create[Create Custom Theme]

  Groups --> AssignTheme[Assign Theme to Group]
  Groups --> AssignLogo[Assign Logo to Group]

  Users --> AssignGroup[Assign User to Group]
  Users --> AssignUserTheme[Override User Theme]

  subgraph Cascade["Resolution Cascade"]
    direction TB
    UserTheme[User Theme Override]
    GroupTheme[Group Theme]
    SystemDefault[System Default]
    UserTheme -->|fallback| GroupTheme -->|fallback| SystemDefault
  end`;

// ─────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────

interface DiagramCardProps {
  title: string;
  description: string;
  chart: string;
}

function DiagramCard({ title, description, chart }: DiagramCardProps) {
  return (
    <Card className="bg-card border border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/20 rounded-lg p-4 border border-border/40 overflow-auto">
          <MermaidChart chart={chart} theme="neutral" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DiagramsTab() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="1">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="1">Level 1 — Overview</TabsTrigger>
          <TabsTrigger value="2">Level 2 — Domains</TabsTrigger>
          <TabsTrigger value="3">Level 3 — Details</TabsTrigger>
        </TabsList>

        <TabsContent value="1" className="space-y-6 mt-4">
          <DiagramCard
            title="Application Flow"
            description="High-level user journey from login to exports"
            chart={L1_APP_FLOW}
          />
          <DiagramCard
            title="Two-Entity Model"
            description="Property SPVs, Management Company, and Consolidated view with intercompany elimination"
            chart={L1_TWO_ENTITY}
          />
        </TabsContent>

        <TabsContent value="2" className="mt-4">
          <Accordion type="multiple" defaultValue={["financial", "manco", "auth", "ai", "research"]}>
            <AccordionItem value="financial">
              <AccordionTrigger className="text-sm font-semibold">Financial Calculation Pipeline</AccordionTrigger>
              <AccordionContent>
                <DiagramCard
                  title="Financial Pipeline"
                  description="Assumptions → Engine → Statements → Exports"
                  chart={L2_FINANCIAL}
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="manco">
              <AccordionTrigger className="text-sm font-semibold">Management Company Engine</AccordionTrigger>
              <AccordionContent>
                <DiagramCard
                  title="ManCo Financial Model"
                  description="Revenue (Base + Incentive + Service Fees) → Expenses (Fixed, Variable, Staffing, Partner Comp) → SAFE Funding → Bottom Line"
                  chart={L2_MANCO}
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="auth">
              <AccordionTrigger className="text-sm font-semibold">Auth & Theme Resolution</AccordionTrigger>
              <AccordionContent>
                <DiagramCard
                  title="Authentication & Branding"
                  description="Login → Role → Group → Theme cascade"
                  chart={L2_AUTH}
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="ai">
              <AccordionTrigger className="text-sm font-semibold">AI Assistant Channels</AccordionTrigger>
              <AccordionContent>
                <DiagramCard
                  title="Marcela (Voice) & Rebecca (Text)"
                  description="Two AI channels — Norfolk AI voice + Norfolk AI text analysis"
                  chart={L2_AI}
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="research">
              <AccordionTrigger className="text-sm font-semibold">Research Pipeline</AccordionTrigger>
              <AccordionContent>
                <DiagramCard
                  title="AI Research Generation"
                  description="Trigger → Tools → LLM → Validation → Storage"
                  chart={L2_RESEARCH}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="3" className="mt-4">
          <Accordion type="multiple" defaultValue={["property", "seeding", "export", "admin"]}>
            <AccordionItem value="property">
              <AccordionTrigger className="text-sm font-semibold">Property Lifecycle</AccordionTrigger>
              <AccordionContent>
                <DiagramCard
                  title="Acquisition → Operations → Exit"
                  description="Full property lifecycle including pre-ops gap, refinance, and exit waterfall"
                  chart={L3_PROPERTY}
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="seeding">
              <AccordionTrigger className="text-sm font-semibold">Seeding & Password Flow</AccordionTrigger>
              <AccordionContent>
                <DiagramCard
                  title="Seeding & Password Management"
                  description="Server startup seeding with password guard and production fill-only sync"
                  chart={L3_SEEDING}
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="export">
              <AccordionTrigger className="text-sm font-semibold">Export Pipeline</AccordionTrigger>
              <AccordionContent>
                <DiagramCard
                  title="Six-Format Export Suite"
                  description="PDF, Excel, CSV, PowerPoint, Chart PNG, and Table PNG export paths"
                  chart={L3_EXPORT}
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="admin">
              <AccordionTrigger className="text-sm font-semibold">Admin Cascade</AccordionTrigger>
              <AccordionContent>
                <DiagramCard
                  title="Theme & Branding Cascade"
                  description="Admin → Themes → Groups → Users resolution chain"
                  chart={L3_ADMIN_CONFIG}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
      </Tabs>
    </div>
  );
}
