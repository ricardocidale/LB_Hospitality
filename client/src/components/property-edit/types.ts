import type { FeeCategoryResponse } from "@/lib/api";

export interface PropertyEditSectionProps {
  draft: any;
  onChange: (key: string, value: string | number | null) => void;
  onNumberChange: (key: string, value: string) => void;
  globalAssumptions: any;
  researchValues: Record<string, { display: string; mid: number; source?: string }>;
}

export interface ManagementFeesSectionProps extends PropertyEditSectionProps {
  feeDraft: FeeCategoryResponse[] | null;
  onFeeCategoryChange: (index: number, field: keyof FeeCategoryResponse, value: any) => void;
  totalServiceFeeRate: number;
}

export interface OtherAssumptionsSectionProps extends PropertyEditSectionProps {
  exitYear: number;
}
