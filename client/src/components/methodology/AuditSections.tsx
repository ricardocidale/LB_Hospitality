import { SectionCard } from "@/components/ui/section-card";
import { LucideIcon } from "lucide-react";
import { DEPRECIATION_YEARS } from "@/lib/constants";

interface AuditSectionsProps {
  expandedSections: Set<string>;
  toggleSection: (id: string) => void;
  sectionRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  icon: LucideIcon;
}

export function AuditSections({ 
  expandedSections, 
  toggleSection, 
  sectionRefs,
  icon
}: AuditSectionsProps) {
  return (
    <SectionCard
      id="verification"
      title="Financial Verification & Audit"
      subtitle="How we verify calculations for GAAP compliance"
      icon={icon}
      variant="light"
      expanded={expandedSections.has("verification")}
      onToggle={() => toggleSection("verification")}
      sectionRef={(el) => { sectionRefs.current["verification"] = el; }}
    >
      <p className="text-sm text-muted-foreground">
        The system includes a comprehensive <strong>PwC-level audit engine</strong> that independently
        recalculates all financial values and compares them against the primary financial engine.
        This ensures accuracy and GAAP compliance across all statements.
      </p>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Audit Sections</h4>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>&#8226; <strong>Timing Rules (ASC 606)</strong>: Verifies no revenue or expenses before acquisition/operations start dates</li>
          <li>&#8226; <strong>Depreciation (ASC 360)</strong>: Verifies {DEPRECIATION_YEARS}-year straight-line depreciation starting at acquisition</li>
          <li>&#8226; <strong>Loan Amortization (ASC 470)</strong>: Recalculates PMT formula, verifies interest/principal split each month</li>
          <li>&#8226; <strong>Income Statement</strong>: Verifies Revenue, GOP, NOI, and Net Income calculations</li>
          <li>&#8226; <strong>Balance Sheet (FASB Framework)</strong>: Verifies Assets = Liabilities + Equity for every period</li>
          <li>&#8226; <strong>Cash Flow Statement (ASC 230)</strong>: Verifies indirect method and Operating/Financing activity split</li>
          <li>&#8226; <strong>Management Fees</strong>: Verifies base and incentive fee calculations</li>
        </ul>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Key GAAP Rules Enforced</h4>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>&#8226; <strong>ASC 470</strong>: Principal payments are NOT expenses - they reduce Net Income only for cash flow purposes, not on the income statement</li>
          <li>&#8226; <strong>ASC 230-10-45</strong>: Operating Cash Flow = Net Income + Depreciation (indirect method)</li>
          <li>&#8226; <strong>ASC 230-10-45-17</strong>: Interest expense is an operating activity; principal repayment is a financing activity</li>
          <li>&#8226; <strong>ASC 360-10</strong>: Property assets carried at cost minus accumulated depreciation</li>
        </ul>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Audit Opinions</h4>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>&#8226; <strong>UNQUALIFIED</strong>: All calculations verified, no material or critical issues</li>
          <li>&#8226; <strong>QUALIFIED</strong>: Minor material issues found but overall statements are fairly presented</li>
          <li>&#8226; <strong>ADVERSE</strong>: Critical issues found that affect the reliability of the financial projections</li>
        </ul>
      </div>
    </SectionCard>
  );
}
