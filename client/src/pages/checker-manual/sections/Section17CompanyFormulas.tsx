import { SectionCard } from "@/components/ui/section-card";
  import { ManualTable } from "@/components/ui/manual-table";
  import { Callout } from "@/components/ui/callout";
  import { IconBriefcase } from "@/components/icons/brand-icons";

  interface SectionProps {
    expanded: boolean;
    onToggle: () => void;
    sectionRef: (el: HTMLDivElement | null) => void;
  }

  export default function Section17CompanyFormulas({ expanded, onToggle, sectionRef }: SectionProps) {
    return (
      <SectionCard
        id="company-formulas"
        title="17. Management Company Formulas"
        icon={IconBriefcase}
        expanded={expanded}
        onToggle={onToggle}
        sectionRef={sectionRef}
      >
        <ManualTable
          headers={["Ref ID", "Name", "Formula / Logic"]}
          rows={[
            ["F-C-01", "Base Fee Revenue", "Σ (propertyTotalRevenue × baseMgmtFeeRate)"],
            ["F-C-02", "Incentive Fee Revenue", "Σ (propertyGOP × incentiveMgmtFeeRate)"],
            ["F-C-03", "Total Revenue", "baseFeeRevenue + incentiveFeeRevenue"],
            ["F-C-04", "Partner Comp", "partnerCompScheduleYearN / 12"],
            ["F-C-05", "Staff Comp", "(headcountTier × staffSalary / 12) × (1 + companyInflation)^year"],
            ["F-C-06", "Fixed Overheads", "annualCost / 12 × (1 + max(escalation, companyInflation))^year"],
            ["F-C-07", "Travel/IT Variable", "managedProperties × costPerProperty / 12 × (1 + companyInflation)^year"],
            ["F-C-08", "Marketing/Misc", "totalCompanyRevenue × rate"],
            ["F-C-09", "Net Income", "totalRevenue − totalExpenses − companyTax"],
          ]}
        />
      </SectionCard>
    );
  }
