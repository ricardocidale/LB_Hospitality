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
  Role -->|user| Dashboard[Dashboard]
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

const L1_INTEGRATIONS = `flowchart TB
  Platform((HBG Platform))

  subgraph AI["AI & LLM"]
    Claude[Anthropic Claude\nResearch & exports]
    OpenAI_[OpenAI\nEmbeddings & chat]
    Gemini_[Google Gemini\nRebecca advisor]
  end

  subgraph VoiceAI["Voice AI"]
    EL[ElevenLabs / Convai\nMarcela voice agent]
  end

  subgraph Geo["Geospatial"]
    GMaps[Google Maps / Places\nGeocoding & POI search]
    MapLibre[MapLibre GL\n3D globe rendering]
  end

  subgraph DocIntel["Document Intelligence"]
    DocAI[Google Cloud Doc AI\nOCR & extraction]
  end

  subgraph Comms["Communication"]
    Twilio_[Twilio\nSMS notification alerts]
    Resend[Resend\nTransactional email delivery]
  end

  subgraph ImgGen["Image Generation"]
    Replicate[Replicate\nAI architectural renders]
  end

  subgraph Observe["Observability"]
    Sentry[Sentry\nReal-time error tracking]
    PostHog[PostHog\nProduct usage analytics]
  end

  subgraph Storage["Storage"]
    ObjStore[Replit Object Storage\nFile & asset storage]
    Redis[Upstash Redis\nCache & sessions]
    PG[(PostgreSQL\nPrimary database)]
  end

  Claude -->|"research results"| Platform
  Platform -->|"analysis prompts"| Claude
  Platform -->|"embedding requests"| OpenAI_
  OpenAI_ -->|"vectors"| Platform
  Platform -->|"advisor queries"| Gemini_
  Gemini_ -->|"insights"| Platform

  Platform -->|"voice config"| EL
  EL -->|"audio stream"| Platform

  Platform -->|"geocode queries"| GMaps
  GMaps -->|"coordinates & POIs"| Platform
  MapLibre -.->|"renders map UI"| Platform

  Platform -->|"document scans"| DocAI
  DocAI -->|"structured data"| Platform

  Platform -->|"SMS alerts"| Twilio_
  Platform -->|"email sends"| Resend

  Platform -->|"render prompts"| Replicate
  Replicate -->|"generated images"| Platform

  Platform -->|"error events"| Sentry
  Platform -->|"analytics events"| PostHog

  Platform <-->|"read/write"| ObjStore
  Platform <-->|"cache ops"| Redis
  Platform <-->|"queries"| PG`;

// ─────────────────────────────────────────────────
// LEVEL 2 — Domain Flows
// ─────────────────────────────────────────────────

const L2_FINANCIAL = `flowchart TB
  subgraph Revenue["Revenue"]
    RR["Room Revenue\\n(ADR × Occ × Rooms × Days)"]
    FB["F&B Revenue\\n(RevPAR × F&B Capture %)"]
    EV["Events & Banquet Revenue\\n(Event Pace × Avg Check)"]
    OTH["Other Income\\n(Parking, Spa, Retail, Misc)"]
  end

  RR --> TR(["Total Revenue"])
  FB --> TR
  EV --> TR
  OTH --> TR

  subgraph DeptExp["Departmental Expenses"]
    HK["Housekeeping\\n(CPOR × Occupied Rooms)"]
    FBC["F&B Cost\\n(F&B Rev × Cost %)"]
    EVC["Events Cost\\n(Events Rev × Cost %)"]
    OE["Other Dept Expense\\n(Other Rev × Cost %)"]
  end

  TR --> |"less"| HK
  TR --> |"less"| FBC
  TR --> |"less"| EVC
  TR --> |"less"| OE
  HK --> DeptTotal["Total Dept Expenses"]
  FBC --> DeptTotal
  EVC --> DeptTotal
  OE --> DeptTotal
  TR --> GOP(["GROSS OPERATING PROFIT (GOP)"])
  DeptTotal --> |"subtracted"| GOP

  subgraph MgmtFees["Management Fees"]
    BF["Base Fee\\n(% of Total Revenue)"]
    IF["Incentive Fee\\n(% of GOP)"]
  end

  GOP --> |"less"| BF
  GOP --> |"less"| IF
  BF --> FeeTotal["Total Mgmt Fees"]
  IF --> FeeTotal
  GOP --> AGOP(["ADJUSTED GOP (AGOP)"])
  FeeTotal --> |"subtracted"| AGOP

  subgraph FixedCharges["Fixed Charges"]
    INS["Insurance\\n(per key / year)"]
    PT["Property Tax\\n(assessed value × mill rate)"]
  end

  AGOP --> |"less"| INS
  AGOP --> |"less"| PT
  INS --> ChargeTotal["Total Fixed Charges"]
  PT --> ChargeTotal
  AGOP --> NOI(["NET OPERATING INCOME (NOI)"])
  ChargeTotal --> |"subtracted"| NOI

  NOI --> |"less"| FFE["FF&E Reserve\\n(% of Total Revenue)"]
  FFE --> ANOI(["ADJUSTED NOI (ANOI)"])

  ANOI --> |"less"| INT["Interest Expense\\n(Debt Service)"]
  INT --> |"less"| DEP["Depreciation\\n(Straight-Line)"]
  DEP --> PTI(["Pre-Tax Income"])
  PTI --> |"less"| TAX["Income Tax\\n(NOL carryforward applied)"]
  TAX --> NI(["NET INCOME"])

  style GOP fill:#2563eb,color:#fff,stroke:#1d4ed8
  style AGOP fill:#2563eb,color:#fff,stroke:#1d4ed8
  style NOI fill:#2563eb,color:#fff,stroke:#1d4ed8
  style ANOI fill:#2563eb,color:#fff,stroke:#1d4ed8
  style NI fill:#16a34a,color:#fff,stroke:#15803d
  style TR fill:#7c3aed,color:#fff,stroke:#6d28d9
  style PTI fill:#7c3aed,color:#fff,stroke:#6d28d9`;

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

const L2_AI = `flowchart TB
  User([Guest / Admin]) --> ConvaiWidget[ElevenLabs Convai Widget]
  ConvaiWidget --> Marcela{"Marcela\\nVoice Agent"}

  subgraph ClientTools["Client-Side Tools (browser)"]
    direction TB
    nav[navigateToPage\\nRoute to any portal page]
    showProp[showPropertyDetails\\nOpen property detail view]
    editProp[openPropertyEditor\\nLaunch assumption editor]
    tour[startGuidedTour\\nBegin interactive walkthrough]
  end

  subgraph ServerTools["Server-Side Webhooks (API)"]
    direction TB
    getProp[getProperties\\nList all portfolio properties]
    getPropDet[getPropertyDetails\\nSingle property financials]
    getPort[getPortfolioSummary\\nAggregated portfolio metrics]
    getGA[getGlobalAssumptions\\nShared assumption values]
  end

  Marcela -->|"client_tool calls"| ClientTools
  Marcela -->|"server_tool webhooks"| ServerTools

  subgraph KB["Knowledge Base (RAG)"]
    direction TB
    StaticKB["Static KB Markdown\\nProduct docs, USALI glossary,\\nhospitality terminology"]
    DynamicKB["Dynamic Live-Data Docs\\nProperty snapshots, portfolio\\nmetrics synced to ElevenLabs"]
    StaticKB --> RAG["RAG Retrieval"]
    DynamicKB --> RAG
  end

  RAG -->|"contextual grounding"| Marcela

  subgraph Integrity["Deterministic Integrity Rule"]
    Rule["Marcela NEVER calculates —\\nshe calls deterministic\\nengine tools for all numbers"]
  end

  ServerTools -.->|"all numbers from"| Engine[("Financial Engine\\n(Property + Company)")]
  Integrity -.-> Marcela

  style Marcela fill:#7c3aed,color:#fff,stroke:#6d28d9
  style Rule fill:#dc2626,color:#fff,stroke:#b91c1c
  style Engine fill:#2563eb,color:#fff,stroke:#1d4ed8
  style RAG fill:#16a34a,color:#fff,stroke:#15803d`;

const L2_RESEARCH = `flowchart TB
  subgraph Trigger["Research Trigger"]
    direction TB
    PropTrig([Property-Level\\nSingle asset research])
    CompTrig([Company-Level\\nICP-driven portfolio research])
  end

  subgraph Context["Context Assembly"]
    direction TB
    ICP["ICP / Asset Definition\\nTarget market, brand tier,\\nservice level positioning"]
    Location["Location Profile\\nCity, submarket, MSA,\\ndemand generators"]
    PropProfile["Property Profile\\nRoom count, star class,\\nF&B outlets, meeting space"]
    FinContext["Financial Context\\nCurrent ADR, occupancy,\\nRevPAR assumptions"]
  end

  PropTrig -->|"property-specific"| Location
  PropTrig --> PropProfile
  PropTrig --> FinContext
  CompTrig -->|"ICP-driven"| ICP
  ICP --> Location
  ICP --> PropProfile

  subgraph PromptBuilder["Prompt Builder"]
    direction TB
    LocBlock["Location Intelligence Block"]
    ProfBlock["Property Profile Block"]
    FinBlock["Financial Context Block"]
    LocBlock & ProfBlock & FinBlock --> Prompt["Assembled Research Prompt"]
  end

  Location --> LocBlock
  PropProfile --> ProfBlock
  FinContext --> FinBlock

  subgraph LLM["Tool-Augmented LLM (Claude 3.5 Sonnet)"]
    direction TB
    WebSearch["Web Search\\nLive market data,\\nSTR reports, news"]
    CompADR["compute_adr_projection\\nADR growth modeling"]
    CompOcc["compute_occupancy_ramp\\nStabilization curve"]
    WebSearch & CompADR & CompOcc --> Response["Structured LLM Response"]
  end

  Prompt --> LLM

  subgraph Output["Structured Output"]
    direction TB
    CompLand["Competitive Landscape\\nComp set, positioning,\\nrate intelligence"]
    OpBench["Operating Cost Benchmarks\\nCPOR, labor ratios,\\nF&B cost percentages"]
    LocalEcon["Local Economics\\nDemand drivers, supply\\npipeline, tourism trends"]
  end

  Response --> CompLand
  Response --> OpBench
  Response --> LocalEcon

  subgraph ValueExtract["Value Extraction"]
    Extractor["research-value-extractor\\nMaps narrative text to\\ntyped financial assumptions"]
  end

  CompLand & OpBench & LocalEcon --> Extractor

  subgraph Validation["Post-LLM Validation"]
    Checks["Consistency Checks\\nRange bounds, cross-field\\nlogic, outlier detection"]
  end

  Extractor --> Checks

  Checks --> Store[("market_research table\\nPostgreSQL")]

  subgraph UI["UI Display"]
    direction TB
    Pills["Benchmark Pills\\nShown next to each\\nassumption input field"]
    ApplyDialog["Apply Research Dialog\\nReview & selectively adopt\\nresearch values"]
  end

  Store --> Pills
  Store --> ApplyDialog

  subgraph Freshness["30-Day Refresh Cycle"]
    direction LR
    Fresh["🟢 Fresh\\n< 30 days old"]
    Stale["🔴 Stale\\n≥ 30 days old"]
    Fresh -.->|"after 30 days"| Stale
    Stale -.->|"re-trigger"| PropTrig & CompTrig
  end

  Store -.-> Fresh

  style PropTrig fill:#2563eb,color:#fff,stroke:#1d4ed8
  style CompTrig fill:#7c3aed,color:#fff,stroke:#6d28d9
  style Response fill:#16a34a,color:#fff,stroke:#15803d
  style Extractor fill:#d97706,color:#fff,stroke:#b45309
  style Store fill:#2563eb,color:#fff,stroke:#1d4ed8
  style Fresh fill:#16a34a,color:#fff,stroke:#15803d
  style Stale fill:#dc2626,color:#fff,stroke:#b91c1c`;

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

const L2_DUAL_ENGINE = `flowchart TB
  Assumptions["Property Assumptions\\n(Revenue, Expenses, Debt, CapEx)"]

  Assumptions --> ClientEngine
  Assumptions --> ServerChecker

  subgraph ClientSide["Client-Side Engine (Real-Time UI)"]
    ClientEngine["Property Financial Engine\\n(deterministic calc pipeline)"]
    ClientEngine --> ClientIS["Income Statement"]
    ClientEngine --> ClientCF["Cash Flow Statement"]
    ClientEngine --> ClientBS["Balance Sheet"]
    ClientIS & ClientCF & ClientBS --> ClientResults["Client-Side Results\\n(displayed in UI)"]
  end

  subgraph ServerSide["Server-Side Checker (Independent Recalculation)"]
    ServerChecker["Calculation Checker\\n(isolated recalculation)"]
    ServerChecker --> ServerIS["Income Statement"]
    ServerChecker --> ServerCF["Cash Flow Statement"]
    ServerChecker --> ServerBS["Balance Sheet"]
    ServerIS & ServerCF & ServerBS --> ServerResults["Server-Side Results\\n(never shown to user)"]
  end

  ClientResults --> Compare{"Cross-Calculator\\nValidation"}
  ServerResults --> Compare

  Compare -->|"values match\\nwithin tolerance"| Clean["✓ Unqualified Opinion\\n(clean audit)"]
  Compare -->|"minor deviations\\n< materiality threshold"| Qualified["⚠ Qualified Opinion\\n(minor issues noted)"]
  Compare -->|"material differences\\nexceed threshold"| Adverse["✗ Adverse Opinion\\n(material failures)"]`;

const L2_VERIFICATION_TIERS = `flowchart TB
  subgraph Tier1["Tier 1 — Property-Level Checks"]
    direction TB
    T1Rev["Revenue Formula Verification\\n(ADR × Occupancy × Rooms × 365)"]
    T1Debt["Debt Service PMT\\n(ASC 470 — amortization schedules)"]
    T1Depr["Depreciation Basis\\n(ASC 360 — cost allocation)"]
    T1CF["Cash Flow Reconciliation\\n(ASC 230 — operating / investing / financing)"]
    T1Rev --> T1Gate{"All Property\\nChecks Pass?"}
    T1Debt --> T1Gate
    T1Depr --> T1Gate
    T1CF --> T1Gate
  end

  subgraph Tier2["Tier 2 — Company-Level Checks"]
    direction TB
    T2Fees["Management Fee Calculations\\n(ASC 606 — base + incentive recognition)"]
    T2ManCo["ManCo Cash Flow\\n(fee revenue − operating costs)"]
    T2SAFE["SAFE Tranche Validation\\n(funding gate dates & amounts)"]
    T2Fees --> T2Gate{"All Company\\nChecks Pass?"}
    T2ManCo --> T2Gate
    T2SAFE --> T2Gate
  end

  subgraph Tier3["Tier 3 — Consolidated Checks"]
    direction TB
    T3Elim["Intercompany Elimination\\n(ASC 810 — ManCo fees = SPV expenses)"]
    T3Port["Portfolio Totals\\n(sum of all property NOI)"]
    T3Bal["Balance Sheet Identity\\n(Assets = Liabilities + Equity)"]
    T3Elim --> T3Gate{"All Consolidated\\nChecks Pass?"}
    T3Port --> T3Gate
    T3Bal --> T3Gate
  end

  T1Gate -->|"pass"| Tier2
  T2Gate -->|"pass"| Tier3

  subgraph Pipeline["Four-Stage Verification Pipeline"]
    direction LR
    Stage1["Stage 1:\\nFormula Checker"]
    Stage2["Stage 2:\\nGAAP Compliance"]
    Stage3["Stage 3:\\nFull Auditor"]
    Stage4["Stage 4:\\nCross-Calculator\\nValidation"]
    Stage1 --> Stage2 --> Stage3 --> Stage4
  end

  T3Gate -->|"pass"| Pipeline

  Stage4 --> Opinion{"Audit Opinion"}
  Opinion -->|"all checks pass"| Unqual["Unqualified\\n(Clean — no exceptions)"]
  Opinion -->|"non-material issues"| Qual["Qualified\\n(Minor issues noted)"]
  Opinion -->|"material failures"| Adv["Adverse\\n(Statements unreliable)"]`;

// ─────────────────────────────────────────────────
// LEVEL 3 — Detailed Sub-flows
// ─────────────────────────────────────────────────

const L3_PROPERTY = `flowchart TB
  subgraph Acquisition["Phase 1 — Acquisition (acquisitionDate)"]
    direction TB
    PP[Purchase Price] --> BI[+ Building Improvements]
    BI --> POC[+ Pre-Opening Costs]
    POC --> TPC[Total Project Cost]
    TPC --> CS{Capital Structure}
    CS -->|Equity contribution| Equity[Equity In]
    CS -->|Loan sized by LTV & DSCR| AcqLoan[Acquisition Loan]
    TPC --> Depr[Depreciation Basis = Purchase + Improvements − Land Value]
  end

  subgraph PreOpen["Phase 2 — Pre-Opening Gap"]
    direction TB
    DS1[Debt Service Begins\nIO or Amortizing] --> Reserve[Operating Reserve\nCovers Shortfall]
    DepAccrual[Depreciation Accrues] --> NOLBuild[NOL Builds]
    NoRev([No Revenue Yet])
  end

  subgraph Operations["Phase 3 — Operations (operationsStartDate)"]
    direction TB
    OccRamp[Occupancy Ramp\nStep-function: Start % → Max %] --> RoomRev[Room Revenue\nADR × Occupancy × Rooms]
    RoomRev --> Ancillary[Ancillary Revenue\n% of Room Revenue]
    RoomRev --> TotalRev[Total Revenue]
    Ancillary --> TotalRev
    TotalRev --> USALI[USALI Expense Application]
    USALI --> GOP[Gross Operating Profit]
    GOP --> MgmtFee[Less Management Fees]
    MgmtFee --> NOI[Net Operating Income]
    NOI --> ANOI[Adjusted NOI\nLess FF&E Reserve]
    ANOI --> DSvc[Less Debt Service]
    DSvc --> Tax[Less Income Tax\nw/ NOL Carryforward]
    Tax --> FCFE[Free Cash Flow to Equity]
  end

  subgraph Refinance["Phase 4 — Refinance (Optional, at refinanceDate)"]
    direction TB
    RefiTrigger([Refinance Triggered]) --> NewLoan[New Loan Sized by\nUpdated NOI · LTV · DSCR]
    NewLoan --> Payoff[Payoff Acquisition Debt]
    Payoff --> NetProc{Net Proceeds\n+Positive / −Negative}
    NetProc --> DSRecalc[Debt Service Recalculated]
  end

  subgraph Exit["Phase 5 — Exit"]
    direction TB
    ExitVal[Exit Valuation\nForward-Year NOI ÷ Exit Cap Rate] --> DispComm[Less Disposition Commission]
    DispComm --> DebtPayoff[Less Outstanding Debt Payoff]
    DebtPayoff --> NetEquity[Net Equity Proceeds]
    NetEquity --> Returns[Return Metrics]
    Returns --> IRR[IRR]
    Returns --> MOIC[MOIC]
    Returns --> CoC[Cash-on-Cash]
  end

  Acquisition --> PreOpen
  PreOpen -->|operationsStartDate| Operations
  Operations -->|refinanceDate| Refinance
  Refinance --> Operations
  Operations -->|exitDate| Exit`;

const L3_DATA_MODEL = `erDiagram
  Users ||--o{ Properties : "owns"
  Users ||--o{ Scenarios : "creates"
  Users ||--o{ Sessions : "authenticates"
  Users ||--o{ LoginLogs : "logs"
  Users ||--o{ ActivityLogs : "generates"
  Users ||--o{ Conversations : "starts"
  Users ||--o{ MarketResearch : "requests"
  Users ||--o{ ProspectiveProperties : "saves"
  Users ||--o{ VerificationRuns : "runs"
  Users ||--o{ AlertRules : "configures"
  Users ||--o{ GlobalAssumptions : "edits"
  Users }o--o| UserGroups : "belongs to"
  Users }o--o| Companies : "assigned to"

  UserGroups ||--o{ UserGroupProperties : "filters via"
  Properties ||--o{ UserGroupProperties : "visible in"

  Properties ||--o{ PropertyPhotos : "has"
  Properties ||--o{ PropertyFeeCategories : "has"
  Properties ||--o{ MarketResearch : "subject of"

  Conversations ||--o{ Messages : "contains"

  Companies }o--o| Logos : "branded with"
  UserGroups }o--o| Logos : "branded with"
  UserGroups }o--o| DesignThemes : "styled by"
  Users }o--o| DesignThemes : "overrides with"

  AlertRules ||--o{ NotificationLogs : "triggers"

  Users {
    int id PK
    string username
    string role "admin | user | checker | investor"
    int companyId FK
    int userGroupId FK
  }
  UserGroups {
    int id PK
    string name
    int logoId FK
    int themeId FK
  }
  Companies {
    int id PK
    string name
    string type "management | spv"
    int logoId FK
  }
  Properties {
    int id PK
    string name
    int userId FK
    string status
    jsonb financialData
  }
  UserGroupProperties {
    int userGroupId FK
    int propertyId FK
  }
  Scenarios {
    int id PK
    int userId FK
    string name
    jsonb snapshot
  }
  GlobalAssumptions {
    int id PK
    int userId FK
    jsonb data
  }
  VerificationRuns {
    int id PK
    int userId FK
    string auditOpinion
  }
  MarketResearch {
    int id PK
    int userId FK
    int propertyId FK
    string status
  }
  ResearchQuestions {
    int id PK
    string question
    int sortOrder
  }
  Conversations {
    int id PK
    int userId FK
    string title
  }
  Messages {
    int id PK
    int conversationId FK
    string role
    text content
  }
  PropertyPhotos {
    int id PK
    int propertyId FK
    string url
  }
  PropertyFeeCategories {
    int id PK
    int propertyId FK
    string category
  }
  ProspectiveProperties {
    int id PK
    int userId FK
    string name
  }
  ActivityLogs {
    int id PK
    int userId FK
    string action
    string entityType
  }
  AlertRules {
    int id PK
    int userId FK
    string metric
    string operator
  }
  NotificationLogs {
    int id PK
    int alertRuleId FK
    string channel
  }
  Sessions {
    string sid PK
    int userId FK
    timestamp expires
  }
  LoginLogs {
    int id PK
    int userId FK
    timestamp timestamp
  }
  DesignThemes {
    int id PK
    string name
    jsonb colors
  }
  Logos {
    int id PK
    string url
  }`;

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

const L3_ROLE_ACCESS = `flowchart TB
  subgraph Roles["User Roles"]
    direction LR
    Admin["🔑 Admin"]
    UserRole["🤝 User"]
    Checker["✅ Checker"]
    Investor["📊 Investor"]
  end

  subgraph Gates["Permission Gates"]
    isAdmin{"isAdmin"}
    hasMgmt{"hasManagementAccess\\n(all except Investor)"}
    reqChecker{"requireChecker"}
    groupFilter{"Property Group Filter\\n(Admin bypasses)"}
  end

  subgraph AdminPanel["Admin-Only Panel"]
    UserMgmt["User Management"]
    GroupMgmt["Group Management"]
    ThemeMgmt["Theme Management"]
    Diagrams["System Diagrams"]
    AlertConfig["Alert Configuration"]
  end

  subgraph FullToolkit["Investment Toolkit"]
    Dash["Dashboard"]
    Props["Properties"]
    MgmtCo["Management Company"]
    Sim["Simulation"]
    Finder["Property Finder"]
    MapView["Map View"]
    Scenarios["Scenarios"]
    Settings["Settings"]
  end

  subgraph CheckerTools["Checker Tools"]
    Verify["Verification Panel"]
    Manual["Checker Manual"]
    ReadOnly["Read-Only Financials"]
  end

  subgraph InvestorView["Investor View"]
    InvDash["Dashboard"]
    InvProps["Filtered Properties"]
  end

  Admin --> isAdmin --> AdminPanel
  Admin --> hasMgmt --> FullToolkit
  UserRole --> hasMgmt
  Checker --> reqChecker --> CheckerTools
  Checker --> hasMgmt
  Investor --> InvestorView

  Admin -.->|"bypasses"| groupFilter
  UserRole --> groupFilter
  Checker --> groupFilter
  Investor --> groupFilter
  groupFilter -->|"sees only mapped properties"| Props`;

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
          <DiagramCard
            title="Integration & Infrastructure Map"
            description="All external services organized by category with data flow directions"
            chart={L1_INTEGRATIONS}
          />
        </TabsContent>

        <TabsContent value="2" className="mt-4">
          <Accordion type="multiple" defaultValue={["financial", "manco", "dual-engine", "verification", "auth", "ai", "research"]}>
            <AccordionItem value="financial">
              <AccordionTrigger className="text-sm font-semibold">Financial Calculation Pipeline</AccordionTrigger>
              <AccordionContent>
                <DiagramCard
                  title="USALI Income Waterfall"
                  description="Revenue → Departmental Expenses → GOP → Fixed Charges → NOI → Management Fees → FF&E Reserve → ANOI → Debt Service → Depreciation → Pre-Tax Income → Tax → Net Income"
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
            <AccordionItem value="dual-engine">
              <AccordionTrigger className="text-sm font-semibold">Dual-Engine Verification Architecture</AccordionTrigger>
              <AccordionContent>
                <DiagramCard
                  title="Client Engine vs Server Checker"
                  description="Property assumptions feed both engines in parallel — client-side for real-time UI, server-side for independent verification — then cross-validated for audit opinion"
                  chart={L2_DUAL_ENGINE}
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="verification">
              <AccordionTrigger className="text-sm font-semibold">Three-Tier Verification Pipeline</AccordionTrigger>
              <AccordionContent>
                <DiagramCard
                  title="Verification Tiers & GAAP Compliance"
                  description="Tier 1 (Property — revenue, debt service, depreciation, cash flow) → Tier 2 (Company — fees, ManCo, SAFE) → Tier 3 (Consolidated — elimination, totals, balance sheet identity) with ASC 230/360/470/606/810 references"
                  chart={L2_VERIFICATION_TIERS}
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
              <AccordionTrigger className="text-sm font-semibold">Marcela Voice Agent Architecture</AccordionTrigger>
              <AccordionContent>
                <DiagramCard
                  title="Marcela Dual-Channel Tool System"
                  description="ElevenLabs Convai → Client-side tools (navigation, property views, guided tours) + Server-side webhooks (portfolio data, financials) → Knowledge Base RAG (static docs + live-synced data) — Marcela never calculates, she calls deterministic engine tools"
                  chart={L2_AI}
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="research">
              <AccordionTrigger className="text-sm font-semibold">Market Research Pipeline</AccordionTrigger>
              <AccordionContent>
                <DiagramCard
                  title="ICP-Driven Research & Value Extraction"
                  description="Property or Company trigger → ICP/Asset context assembly → Prompt Builder → Tool-augmented Claude (web search + compute tools) → Structured output (comp set, benchmarks, local economics) → Value extraction to financial assumptions → Validation → Storage → Benchmark pills & Apply Research dialog — 30-day compulsory refresh cycle"
                  chart={L2_RESEARCH}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="3" className="mt-4">
          <Accordion type="multiple" defaultValue={["property", "data-model", "export", "role-access"]}>
            <AccordionItem value="property">
              <AccordionTrigger className="text-sm font-semibold">Property Lifecycle</AccordionTrigger>
              <AccordionContent>
                <DiagramCard
                  title="Investment Lifecycle & Cash Flow Engine"
                  description="Five-phase property lifecycle — Acquisition capital structure, Pre-Opening gap funding, Operations occupancy ramp through USALI waterfall to FCFE, optional Refinance with debt restructuring, and Exit valuation with IRR / MOIC / Cash-on-Cash return metrics"
                  chart={L3_PROPERTY}
                />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="data-model">
              <AccordionTrigger className="text-sm font-semibold">Data Model ER Diagram</AccordionTrigger>
              <AccordionContent>
                <DiagramCard
                  title="Entity Relationship Diagram"
                  description="Core data entities and their relationships — users, properties, scenarios, research, and support tables"
                  chart={L3_DATA_MODEL}
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
            <AccordionItem value="role-access">
              <AccordionTrigger className="text-sm font-semibold">Role-Based Access Control</AccordionTrigger>
              <AccordionContent>
                <DiagramCard
                  title="Role-Based Access Control"
                  description="Four user roles, sidebar visibility, permission gates, and property group filtering"
                  chart={L3_ROLE_ACCESS}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
      </Tabs>
    </div>
  );
}
