import { SectionCard } from "@/components/ui/section-card";
  import { ManualTable } from "@/components/ui/manual-table";
  import { Callout } from "@/components/ui/callout";
  import { IconInvestment } from "@/components/icons";interface SectionProps {
    expanded: boolean;
    onToggle: () => void;
    sectionRef: (el: HTMLDivElement | null) => void;
  }

  export default function Section19InvestmentReturns({ expanded, onToggle, sectionRef }: SectionProps) {
    return (
      <SectionCard
        id="investment-returns"
        title="19. Investment Returns (DCF/FCF/IRR)"
        icon={IconInvestment}
        expanded={expanded}
        onToggle={onToggle}
        sectionRef={sectionRef}
      >
        <ManualTable
          headers={["Ref ID", "Name", "Formula / Logic"]}
          rows={[
            ["F-R-01", "Free Cash Flow (FCF)", "CFO − CapEx"],
            ["F-R-02", "FCF to Equity (FCFE)", "CFO − CapEx − principalRepayment + loanProceeds"],
            ["F-R-03", "Equity Invested", "Total Project Cost − Initial Loan Amount"],
            ["F-R-04", "Multiple (MOIC)", "Total Distributions / Equity Invested"],
            ["F-R-05", "Terminal Value", "Year 10 NOI / exitCapRate"],
            ["F-R-06", "Net Exit Proceeds", "terminalValue × (1 − commissionRate) − remainingLoanBalance"],
            ["F-R-07", "IRR", "Internal Rate of Return on the FCFE vector including terminal year"],
          ]}
        />
      </SectionCard>
    );
  }
  