import type { GlobalResponse, FeeCategoryResponse } from "@/lib/api";

export interface CompanyAssumptionsSectionProps {
  formData: Partial<GlobalResponse>;
  onChange: <K extends keyof GlobalResponse>(field: K, value: GlobalResponse[K]) => void;
  global: GlobalResponse;
}

export interface CompanySetupSectionProps extends CompanyAssumptionsSectionProps {
  isAdmin: boolean;
}

export interface FundingSectionProps extends CompanyAssumptionsSectionProps {}

export interface ManagementFeesSectionProps extends CompanyAssumptionsSectionProps {
  properties: any[];
  allFeeCategories: FeeCategoryResponse[];
}

export interface CompensationSectionProps extends CompanyAssumptionsSectionProps {
  researchValues: Record<string, { display: string; mid: number } | null | undefined>;
}

export interface FixedOverheadSectionProps extends CompanyAssumptionsSectionProps {
  modelStartYear: number;
}

export interface VariableCostsSectionProps extends CompanyAssumptionsSectionProps {
  researchValues: Record<string, { display: string; mid: number } | null | undefined>;
}

export interface PropertyExpenseRatesSectionProps extends CompanyAssumptionsSectionProps {
  researchValues: Record<string, { display: string; mid: number } | null | undefined>;
}

export interface PartnerCompSectionProps extends CompanyAssumptionsSectionProps {
  modelStartYear: number;
}
