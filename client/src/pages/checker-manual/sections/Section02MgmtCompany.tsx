import { SectionCard } from "@/components/ui/section-card";
  import { ManualTable } from "@/components/ui/manual-table";
  import { Callout } from "@/components/ui/callout";
  import { IconBriefcase } from "@/components/icons/brand-icons";

  interface SectionProps {
    expanded: boolean;
    onToggle: () => void;
    sectionRef: (el: HTMLDivElement | null) => void;
  }

  export default function Section02MgmtCompany({ expanded, onToggle, sectionRef }: SectionProps) {
    return (
      <SectionCard
        id="mgmt-company"
        title="2. Management Company"
        icon={IconBriefcase}
        expanded={expanded}
        onToggle={onToggle}
        sectionRef={sectionRef}
      >
        <p className="text-muted-foreground text-sm">Service company, NOT a property owner. Revenue: Base Fee (% of Total Revenue) + Incentive Fee (% of GOP). Funded via capital notes (Tranche 1 gates operations — Business Rule #1).</p>
        <ManualTable
          headers={["Expense Category", "Calculation", "Escalation"]}
          rows={[
            ["Partner Compensation", "partnerCompYearN × partnerCount / 12", "Per-year schedule"],
            ["Staff Compensation", "headcountYearN × avgStaffSalary / 12", "Per-year schedule"],
            ["Office Lease", "Annual / 12 × (1 + escalation)^year", "Fixed cost escalation"],
            ["Professional Services", "Annual / 12 × (1 + escalation)^year", "Fixed cost escalation"],
            ["Tech Infrastructure", "Annual / 12 × (1 + escalation)^year", "Fixed cost escalation"],
            ["Business Insurance", "Annual / 12 × (1 + escalation)^year", "Fixed cost escalation"],
            ["Travel", "Properties × cost/client / 12 × (1 + inflation)^year", "Inflation"],
            ["IT Licensing", "Properties × cost/client / 12 × (1 + inflation)^year", "Inflation"],
            ["Marketing", "Portfolio Revenue × rate × (1 + inflation)^year", "Inflation"],
            ["Misc Operations", "Portfolio Revenue × rate × (1 + inflation)^year", "Inflation"],
          ]}
        />
        <Callout>Management fees appear as REVENUE for the Management Company and as EXPENSES for each Property SPV.</Callout>
      </SectionCard>
    );
  }
  