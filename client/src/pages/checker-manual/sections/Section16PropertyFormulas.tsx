import { SectionCard } from "@/components/ui/section-card";
  import { ManualTable } from "@/components/ui/manual-table";
  import { Callout } from "@/components/ui/callout";
  import { IconCalculator } from "@/components/icons/brand-icons";

  interface SectionProps {
    expanded: boolean;
    onToggle: () => void;
    sectionRef: (el: HTMLDivElement | null) => void;
  }

  export default function Section16PropertyFormulas({ expanded, onToggle, sectionRef }: SectionProps) {
    return (
      <SectionCard
        id="property-formulas"
        title="16. Property Financial Formulas"
        icon={IconCalculator}
        expanded={expanded}
        onToggle={onToggle}
        sectionRef={sectionRef}
      >
        <ManualTable
          headers={["Ref ID", "Name", "Formula / Logic"]}
          rows={[
            ["F-P-01", "Days in Month", "30.4375 (average) or actual calendar days"],
            ["F-P-02", "Available Rooms", "roomCount × daysInMonth"],
            ["F-P-03", "Room Revenue", "availableRooms × occupancyRate × currentADR"],
            ["F-P-04", "Events Revenue", "roomRevenue × revShareEvents"],
            ["F-P-05", "F&B Revenue", "roomRevenue × revShareFB × (1 + cateringBoost)"],
            ["F-P-06", "Other Revenue", "roomRevenue × revShareOther"],
            ["F-P-07", "Total Revenue", "roomRevenue + eventsRevenue + fbRevenue + otherRevenue"],
            ["F-P-08", "Operating Expenses", "Σ (undistributedExpenses)"],
            ["F-P-09", "Gross Operating Profit", "Total Revenue − Operating Expenses"],
            ["F-P-10", "Adjusted GOP (AGOP)", "GOP − Management Fees"],
            ["F-P-11", "Net Operating Income (NOI)", "AGOP − Insurance − Taxes"],
            ["F-P-12", "Adjusted NOI (ANOI)", "NOI − FF&E Reserve"],
            ["F-P-13", "Depreciable Basis", "(Purchase Price + Improvements) × (1 − Land Value %)"],
            ["F-P-14", "Depreciation", "Depreciable Basis / 27.5 / 12 (monthly straight-line)"],
            ["F-P-15", "Interest Expense", "Beginning Loan Balance × Monthly Interest Rate"],
            ["F-P-16", "Net Income", "ANOI − Interest Expense − Depreciation − Income Tax"],
            ["F-P-17", "Cash from Ops (CFO)", "netIncome + depreciation"],
            ["F-P-18", "Cash from Investing (CFI)", "−acquisitionCosts + exitProceeds"],
            ["F-P-19", "Cash from Financing (CFF)", "equityInjection + loanProceeds − principalRepayment − distributions"],
          ]}
        />
      </SectionCard>
    );
  }
