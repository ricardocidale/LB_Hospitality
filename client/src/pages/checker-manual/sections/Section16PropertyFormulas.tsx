import { SectionCard } from "@/components/ui/section-card";
  import { ManualTable } from "@/components/ui/manual-table";
  import { Callout } from "@/components/ui/callout";
  import { Calculator } from "lucide-react";

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
        icon={Calculator}
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
            ["F-P-08", "Operating Expenses", "Σ (revenueStream × costRateStream)"],
            ["F-P-09", "Gross Operating Profit", "totalRevenue − operatingExpenses"],
            ["F-P-10", "Adjusted NOI (ANOI)", "GOP − baseMgmtFee − incentiveMgmtFee − ffEReserve"],
            ["F-P-11", "Depreciable Basis", "(purchasePrice + improvements) × (1 − landValuePercent)"],
            ["F-P-12", "Depreciation", "depreciableBasis / 27.5 / 12 (monthly straight-line)"],
            ["F-P-13", "Interest Expense", "beginningLoanBalance × monthlyInterestRate"],
            ["F-P-14", "Net Income", "NOI − interestExpense − depreciation − incomeTax"],
            ["F-P-15", "Cash from Ops (CFO)", "netIncome + depreciation"],
            ["F-P-16", "Cash from Investing (CFI)", "−acquisitionCosts + exitProceeds"],
            ["F-P-17", "Cash from Financing (CFF)", "equityInjection + loanProceeds − principalRepayment − distributions"],
          ]}
        />
      </SectionCard>
    );
  }
  