import { PropertyResponse, GlobalResponse } from "@/lib/api";

export interface SettingsTabProps {
  global: GlobalResponse;
  currentGlobal: GlobalResponse;
  globalDraft: any;
  handleGlobalChange: (key: string, value: string | boolean) => void;
  handleNestedChange: (parent: string, key: string, value: string | boolean) => void;
  properties?: PropertyResponse[];
  propertyDrafts: Record<number, any>;
  handlePropertyChange: (id: number, key: string, value: string) => void;
  handlePropertyMoneyChange: (id: number, key: string, value: string) => void;
  handleSaveProperty: (id: number) => void;
  updatePropertyPending?: boolean;
}
